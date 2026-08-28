import { execFile, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { EDGE_PUSH_INTERNAL_PATH } from "@fitway/api/edge-push";
import { processLivePush } from "@fitway/api/occupancy/engine";
import { buildPublicOccupancyPayload } from "@fitway/api/public/payload-builder";
import {
	PUBLIC_OCCUPANCY_CACHE_CONTROL,
	PUBLIC_OCCUPANCY_INTERNAL_PATH,
} from "@fitway/api/public-occupancy";
import * as applicationSchema from "@fitway/db/schema/application";
import {
	currentState,
	edgeDevices,
	occupancyMinutes,
	settingsVersions,
} from "@fitway/db/schema/application";
import * as authSchema from "@fitway/db/schema/auth";
import { serve } from "@hono/node-server";
import { chromium } from "@playwright/test";
import { eq, gt, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createEdgePushHandler } from "./edge-push";
import {
	createFindDeviceByTokenHash,
	createOccupancyEngineDatabase,
	createPublicPayloadRepository,
} from "./occupancy-repositories";
import { createPublicOccupancyHandler } from "./public-occupancy";
import { DeviceRateLimiter } from "./rate-limiter";
import { assertDisposableIntegrationDatabase } from "./test-support/integration-database-safety";

const connectionString = process.env.TEST_DATABASE_URL;
assertDisposableIntegrationDatabase({
	connectionString,
	resetMarker: process.env.FITWAY_INTEGRATION_RESET_DATABASE,
	runId: process.env.FITWAY_RUN_ID,
});

const pool = new Pool({ connectionString });
const database = drizzle(pool, {
	schema: { ...applicationSchema, ...authSchema },
});
const engine = createOccupancyEngineDatabase(
	database as typeof import("@fitway/db").db,
);
const publicRepository = createPublicPayloadRepository(
	database as typeof import("@fitway/db").db,
);
const token = "integration-device-token-that-is-at-least-32-bytes-long";
const execFileAsync = promisify(execFile);
let deviceId = "";

async function reserveEphemeralPort() {
	const reservation = createServer();
	await new Promise<void>((resolve, reject) => {
		reservation.once("error", reject);
		reservation.listen(0, "127.0.0.1", resolve);
	});
	const address = reservation.address();
	if (!address || typeof address === "string") {
		reservation.close();
		throw new Error("Could not reserve an ephemeral browser port");
	}
	const { port } = address;
	await new Promise<void>((resolve, reject) => {
		reservation.close((error) => (error ? reject(error) : resolve()));
	});
	return port;
}

type W1EdgeDiagnostic = {
	kind: "edge";
	elapsedMs: number;
	mode: string | null;
	sequence: number | null;
	observedAt: string | null;
	currentCount: number | null;
	httpStatus: number;
	reason: string | null;
	highestProcessedSequence: number | null;
	serverTime: string | null;
};

type W1SimulatorDiagnostic = {
	kind: "simulator";
	elapsedMs: number;
	seed: number;
	processOutcome: string | null;
};

type W1PublicBrowserDiagnostic = {
	kind: "public-browser-response";
	elapsedMs: number | null;
	httpStatus: number;
	pollSeconds: number | null;
	freshness: string | null;
	count: number | null;
	computedAt: string | null;
	lastUpdatedAt: string | null;
	freshUntil: string | null;
	source: string | null;
};

type W1DomTimingDiagnostic = {
	kind: "dom-timing";
	elapsedMs: number;
	assertion: string;
	expectedCount: number | null;
	observedCountText: string | null;
	observedFreshnessText: string | null;
};

type W1Diagnostic =
	| W1EdgeDiagnostic
	| W1SimulatorDiagnostic
	| W1PublicBrowserDiagnostic
	| W1DomTimingDiagnostic;

const W1_DIAGNOSTIC_RING_LIMIT = 32;

const createW1Diagnostics = () => {
	const records: W1Diagnostic[] = [];
	return {
		record(record: W1Diagnostic): void {
			records.push(record);
			if (records.length > W1_DIAGNOSTIC_RING_LIMIT) {
				records.shift();
			}
		},
		snapshot(): readonly W1Diagnostic[] {
			return records.map((record) => ({ ...record }));
		},
		emit(): void {
			console.error(
				JSON.stringify({
					stage: "w1-failure-diagnostics",
					diagnostics: records,
				}),
			);
		},
	};
};

const w1Token = (value: unknown, allowed: readonly string[]): string | null =>
	typeof value === "string" && allowed.includes(value) ? value : null;

const w1Timestamp = (value: unknown): string | null =>
	typeof value === "string" &&
	/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value)
		? value
		: null;

const w1Count = (value: unknown): number | null =>
	typeof value === "number" && Number.isSafeInteger(value) && value >= 0
		? value
		: null;

type W1SimulatorLastRequest = {
	mode: "live" | "backfill";
	sequence: number;
	observedAt: string | null;
	currentCount: number | null;
};

type W1SimulatorState = {
	sequence: number;
	outbox: readonly unknown[];
	lastRequest: W1SimulatorLastRequest;
	inFlightRequest: null;
};

type W1SimulatorSample = {
	currentCount: number;
	ackElapsedMs: number;
};

const alwaysOpenSchedule = {
	scheduleSunOpen: "00:00",
	scheduleSunClose: "00:00",
	scheduleMonOpen: "00:00",
	scheduleMonClose: "00:00",
	scheduleTueOpen: "00:00",
	scheduleTueClose: "00:00",
	scheduleWedOpen: "00:00",
	scheduleWedClose: "00:00",
	scheduleThuOpen: "00:00",
	scheduleThuClose: "00:00",
	scheduleFriOpen: "00:00",
	scheduleFriClose: "00:00",
	scheduleSatOpen: "00:00",
	scheduleSatClose: "00:00",
} as const;

beforeAll(async () => {
	await database.execute(sql`drop schema if exists drizzle cascade`);
	await database.execute(sql`drop schema if exists public cascade`);
	await database.execute(sql`create schema public`);
	await migrate(database, {
		migrationsFolder: path.resolve("packages/db/src/migrations"),
	});
	await database.delete(occupancyMinutes);
	await database
		.update(currentState)
		.set({
			currentCount: null,
			band: null,
			source: null,
			lastPushReceivedAt: null,
			lastEdgeReportedAt: null,
			activeDeviceId: null,
			settingsVersion: null,
		})
		.where(eq(currentState.id, 1));
	await database
		.delete(settingsVersions)
		.where(gt(settingsVersions.version, 2));
	await database
		.update(settingsVersions)
		.set({ effectiveFrom: new Date("2026-01-01T00:00:00.000Z") });
	await database.delete(edgeDevices);
	const [device] = await database
		.insert(edgeDevices)
		.values({
			name: "phase-2-integration",
			tokenHash: createHash("sha256").update(token).digest("hex"),
		})
		.returning({ id: edgeDevices.id });
	if (!device) throw new Error("Integration device not created");
	deviceId = device.id;
});

afterAll(async () => pool.end());

describe("Phase 2 real Postgres vertical slice", () => {
	it("has deterministic settings and empty singleton after migration", async () => {
		const result = await database.execute(
			sql`select (select count(*) from settings_versions)::int settings_count, (select count(*) from current_state)::int current_count`,
		);
		expect(result.rows[0]).toMatchObject({
			settings_count: 2,
			current_count: 1,
		});
		const rows = await database
			.select()
			.from(settingsVersions)
			.orderBy(settingsVersions.version);
		expect(rows[0]).toMatchObject({
			version: 1,
			scheduleSunOpen: null,
			scheduleSunClose: null,
			scheduleFriOpen: null,
			scheduleFriClose: null,
		});
		expect(rows[1]).toMatchObject({
			version: 2,
			scheduleSunOpen: "06:00:00",
			scheduleSunClose: "02:00:00",
			scheduleThuOpen: "06:00:00",
			scheduleThuClose: "02:00:00",
			scheduleFriOpen: "14:00:00",
			scheduleFriClose: "00:00:00",
			scheduleSatOpen: "06:00:00",
			scheduleSatClose: "02:00:00",
		});
		const latest = await publicRepository.readCurrentAndLatestSettings();
		expect(latest.settings).toMatchObject({
			version: 2,
			timeZone: "Asia/Riyadh",
			weeklySchedule: {
				thu: { open: "06:00:00", close: "02:00:00" },
				fri: { open: "14:00:00", close: "00:00:00" },
			},
		});
		await expect(
			database.insert(settingsVersions).values({
				capacity: 100,
				quietMaxPercent: 25,
				moderateMaxPercent: 50,
				busyMaxPercent: 75,
				timezone: "Asia/Riyadh",
				businessDayBoundary: "04:00",
				pushIntervalSeconds: 20,
				freshForSeconds: 90,
				operationalStaleAfterSeconds: 180,
				publicPollSeconds: 60,
				scheduleSunOpen: "06:00",
				scheduleSunClose: null,
			}),
		).rejects.toThrow();
	});

	it("keeps pushes updating while closed and exposes them only after opening", async () => {
		const phase3Token = "phase-3-device-token-that-is-at-least-32-bytes";
		const [device] = await database
			.insert(edgeDevices)
			.values({
				name: "phase-3-integration",
				tokenHash: createHash("sha256").update(phase3Token).digest("hex"),
			})
			.returning({ id: edgeDevices.id });
		if (!device) throw new Error("Phase 3 device not created");
		let now = new Date("2026-07-17T10:59:40.000Z");
		const input = (sequence: number, count: number) => ({
			schemaVersion: 1 as const,
			sequence,
			observedAt: new Date(now.getTime() - 1_000).toISOString(),
			currentCount: count,
			minutes: [],
			health: {
				process: "ok" as const,
				camera: "ok" as const,
				feed: "ok" as const,
				detectorFps: 4,
			},
			appliedCommandId: null,
		});
		await processLivePush(device.id, input(1, 21), {
			...engine,
			now: () => now,
		});
		now = new Date("2026-07-17T10:59:50.000Z");
		await processLivePush(device.id, input(2, 23), {
			...engine,
			now: () => now,
		});

		const app = new Hono();
		app.get(
			PUBLIC_OCCUPANCY_INTERNAL_PATH,
			createPublicOccupancyHandler(publicRepository, () => now),
		);
		const closedResponse = await app.request(PUBLIC_OCCUPANCY_INTERNAL_PATH);
		const closed = await closedResponse.json();
		expect(closedResponse.headers.get("cache-control")).toBe(
			"public, s-maxage=10, stale-while-revalidate=60",
		);
		expect(closedResponse.headers.get("x-fitway-poll-seconds")).toBe("60");
		expect(closed).toEqual({
			schemaVersion: 2,
			freshness: "closed",
			timeZone: "Asia/Riyadh",
			nextOpenAt: "2026-07-17T11:00:00.000Z",
			computedAt: "2026-07-17T10:59:50.000Z",
			trend: null,
		});
		expect(closed).not.toHaveProperty("count");
		expect((await database.select().from(currentState))[0]).toMatchObject({
			currentCount: 23,
		});

		now = new Date("2026-07-17T11:00:10.000Z");
		const openResponse = await app.request(PUBLIC_OCCUPANCY_INTERNAL_PATH);
		expect(await openResponse.json()).toMatchObject({
			freshness: "fresh",
			timeZone: "Asia/Riyadh",
			count: 23,
		});

		await database
			.update(currentState)
			.set({ lastPushReceivedAt: new Date("2026-07-17T12:00:00.000Z") })
			.where(eq(currentState.id, 1));
		now = new Date("2026-07-17T10:59:50.000Z");
		expect(
			await (await app.request(PUBLIC_OCCUPANCY_INTERNAL_PATH)).json(),
		).toMatchObject({ freshness: "closed" });
		now = new Date("2026-07-17T11:00:10.000Z");
		expect(
			await (await app.request(PUBLIC_OCCUPANCY_INTERNAL_PATH)).json(),
		).toMatchObject({ freshness: "unavailable" });

		await database
			.update(currentState)
			.set({
				currentCount: null,
				band: null,
				source: null,
				lastPushReceivedAt: null,
				lastEdgeReportedAt: null,
				activeDeviceId: null,
				settingsVersion: null,
			})
			.where(eq(currentState.id, 1));
		await database.delete(edgeDevices).where(eq(edgeDevices.id, device.id));
	});

	it("commits current and complete minute snapshot, projects fresh, and keeps replay immutable", async () => {
		const now = new Date("2026-07-12T22:30:21.000Z");
		const input = {
			schemaVersion: 1 as const,
			sequence: 1,
			observedAt: "2026-07-12T22:30:20.000Z",
			currentCount: 12,
			minutes: [
				{
					minuteStart: "2026-07-12T22:30:00.000Z",
					count: 12,
					entries: 3,
					exits: 1,
				},
			],
			health: {
				process: "ok" as const,
				camera: "ok" as const,
				feed: "ok" as const,
				detectorFps: 4.8,
			},
			appliedCommandId: null,
		};
		const app = new Hono();
		app.post(
			EDGE_PUSH_INTERNAL_PATH,
			createEdgePushHandler({
				findDeviceByHash: createFindDeviceByTokenHash(
					database as typeof import("@fitway/db").db,
				),
				limiter: new DeviceRateLimiter(() => now.getTime()),
				engine: { ...engine, now: () => now },
			}),
		);
		app.get(
			PUBLIC_OCCUPANCY_INTERNAL_PATH,
			createPublicOccupancyHandler(publicRepository, () => now),
		);
		const firstResponse = await app.request(EDGE_PUSH_INTERNAL_PATH, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(input),
		});
		const first = await firstResponse.json();
		expect(firstResponse.headers.get("cache-control")).toBe("no-store");
		expect(first).toMatchObject({
			accepted: true,
			highestProcessedSequence: 1,
		});
		const minute = (await database.select().from(occupancyMinutes))[0];
		expect(minute).toMatchObject({
			count: 12,
			entries: 3,
			exits: 1,
			businessDay: "2026-07-12",
			source: "live",
			capacitySnapshot: 100,
			settingsVersion: 2,
		});
		const publicValue = await buildPublicOccupancyPayload(
			publicRepository,
			now,
		);
		expect(publicValue.payload).toMatchObject({
			schemaVersion: 2,
			freshness: "fresh",
			count: 12,
		});
		expect(publicValue.payload).not.toHaveProperty("percentFull");
		const publicResponse = await app.request(PUBLIC_OCCUPANCY_INTERNAL_PATH);
		expect(publicResponse.headers.get("cache-control")).toBe(
			PUBLIC_OCCUPANCY_CACHE_CONTROL,
		);
		expect(await publicResponse.json()).toMatchObject({ count: 12 });
		const before = JSON.stringify(await database.select().from(currentState));
		const replay = await app.request(EDGE_PUSH_INTERNAL_PATH, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(input),
		});
		expect(await replay.json()).toMatchObject({
			accepted: false,
			reason: "replay",
		});
		expect(JSON.stringify(await database.select().from(currentState))).toBe(
			before,
		);
	});

	it("replaces same-minute totals for the next contiguous sequence and floors negative counts", async () => {
		const result = await processLivePush(
			deviceId,
			{
				schemaVersion: 1,
				sequence: 2,
				observedAt: "2026-07-12T22:30:40.000Z",
				currentCount: -1,
				minutes: [
					{
						minuteStart: "2026-07-12T22:30:00.000Z",
						count: -2,
						entries: 5,
						exits: 9,
					},
				],
				health: { process: "ok", camera: "ok", feed: "ok", detectorFps: null },
				appliedCommandId: null,
			},
			{ ...engine, now: () => new Date("2026-07-12T22:30:41.000Z") },
		);
		expect(result.accepted).toBe(true);
		const rows = await database.select().from(occupancyMinutes);
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({ count: 0, entries: 5, exits: 9 });
	});

	it("keeps gaps immutable and serializes concurrent same-next pushes to one commit", async () => {
		const base = {
			schemaVersion: 1 as const,
			observedAt: "2026-07-12T22:30:50.000Z",
			currentCount: 14,
			minutes: [
				{
					minuteStart: "2026-07-12T22:30:00.000Z",
					count: 14,
					entries: 7,
					exits: 2,
				},
			],
			health: {
				process: "ok" as const,
				camera: "ok" as const,
				feed: "ok" as const,
				detectorFps: 5,
			},
			appliedCommandId: null,
		};
		const before = JSON.stringify(await database.select().from(currentState));
		expect(
			await processLivePush(deviceId, { ...base, sequence: 4 }, engine),
		).toMatchObject({ accepted: false, reason: "sequence_gap" });
		expect(JSON.stringify(await database.select().from(currentState))).toBe(
			before,
		);
		const outcomes = await Promise.all([
			processLivePush(deviceId, { ...base, sequence: 3 }, engine),
			processLivePush(deviceId, { ...base, sequence: 3 }, engine),
		]);
		expect(outcomes.filter((value) => value.accepted)).toHaveLength(1);
		expect(outcomes.filter((value) => value.reason === "replay")).toHaveLength(
			1,
		);
	});

	it("rolls back minute and device advancement when the singleton write fails", async () => {
		await database.delete(currentState);
		const beforeDevice = (
			await database
				.select({ lastSequence: edgeDevices.lastSequence })
				.from(edgeDevices)
				.where(eq(edgeDevices.id, deviceId))
		)[0];
		await expect(
			processLivePush(
				deviceId,
				{
					schemaVersion: 1,
					sequence: 4,
					observedAt: "2026-07-12T22:31:20.000Z",
					currentCount: 15,
					minutes: [
						{
							minuteStart: "2026-07-12T22:31:00.000Z",
							count: 15,
							entries: 1,
							exits: 0,
						},
					],
					health: {
						process: "ok",
						camera: "ok",
						feed: "ok",
						detectorFps: 5,
					},
					appliedCommandId: null,
				},
				engine,
			),
		).rejects.toThrow("Current singleton is missing");
		expect(
			await database
				.select()
				.from(occupancyMinutes)
				.where(
					eq(
						occupancyMinutes.minuteStartUtc,
						new Date("2026-07-12T22:31:00.000Z"),
					),
				),
		).toHaveLength(0);
		const afterDevice = (
			await database
				.select({ lastSequence: edgeDevices.lastSequence })
				.from(edgeDevices)
				.where(eq(edgeDevices.id, deviceId))
		)[0];
		expect(afterDevice).toEqual(beforeDevice);
		await database.insert(currentState).values({ id: 1 });
	});

	it("applies a newer settings version to the next acknowledgement and public timing", async () => {
		const [settings] = await database
			.insert(settingsVersions)
			.values({
				capacity: 120,
				quietMaxPercent: 20,
				moderateMaxPercent: 50,
				busyMaxPercent: 80,
				timezone: "Asia/Riyadh",
				businessDayBoundary: "04:00",
				pushIntervalSeconds: 7,
				freshForSeconds: 30,
				operationalStaleAfterSeconds: 60,
				publicPollSeconds: 11,
				effectiveFrom: new Date("2026-07-12T22:31:30.000Z"),
				...alwaysOpenSchedule,
			})
			.returning({ version: settingsVersions.version });
		if (!settings) throw new Error("New settings version was not created");
		const receivedAt = new Date("2026-07-12T22:32:01.000Z");
		const result = await processLivePush(
			deviceId,
			{
				schemaVersion: 1,
				sequence: 4,
				observedAt: "2026-07-12T22:32:00.000Z",
				currentCount: 24,
				minutes: [
					{
						minuteStart: "2026-07-12T22:32:00.000Z",
						count: 24,
						entries: 2,
						exits: 0,
					},
				],
				health: {
					process: "ok",
					camera: "ok",
					feed: "ok",
					detectorFps: 5,
				},
				appliedCommandId: null,
			},
			{ ...engine, now: () => receivedAt },
		);
		expect(result.settings).toEqual({
			version: settings.version,
			pushIntervalSeconds: 7,
		});
		const publicValue = await buildPublicOccupancyPayload(
			publicRepository,
			receivedAt,
		);
		expect(publicValue.pollSeconds).toBe(11);
		expect(publicValue.payload).toMatchObject({
			freshUntil: "2026-07-12T22:32:31.000Z",
		});
	});

	it("runs the real Python simulator through auth, limiter, engine, and Postgres", async () => {
		const simulatorToken =
			"simulator-integration-token-that-is-at-least-32-bytes";
		const [device] = await database
			.insert(edgeDevices)
			.values({
				name: "python-simulator-integration",
				tokenHash: createHash("sha256").update(simulatorToken).digest("hex"),
			})
			.returning({ id: edgeDevices.id });
		if (!device)
			throw new Error("Simulator integration device was not created");
		const app = new Hono();
		app.post(
			EDGE_PUSH_INTERNAL_PATH,
			createEdgePushHandler({
				findDeviceByHash: createFindDeviceByTokenHash(
					database as typeof import("@fitway/db").db,
				),
				limiter: new DeviceRateLimiter(),
				engine,
			}),
		);
		const server = serve({ fetch: app.fetch, hostname: "127.0.0.1", port: 0 });
		await new Promise<void>((resolve) => server.once("listening", resolve));
		const address = server.address();
		if (!address || typeof address === "string") {
			server.close();
			throw new Error("Ephemeral simulator server did not expose a TCP port");
		}
		const directory = await mkdtemp(path.join(tmpdir(), "fitway-edge-"));
		try {
			const tokenFile = path.join(directory, "device.token");
			const stateFile = path.join(directory, "state.json");
			await writeFile(tokenFile, simulatorToken, "utf8");
			const result = await execFileAsync("py", [
				path.resolve("edge/simulator.py"),
				"--base-url",
				`http://127.0.0.1:${address.port}`,
				"--token-file",
				tokenFile,
				"--state-file",
				stateFile,
				"--seed",
				"42",
				"--action",
				"once",
			]);
			expect(result.stdout).toContain("outcome=processed");
			expect(result.stdout).not.toContain(simulatorToken);
			const [stored] = await database
				.select()
				.from(edgeDevices)
				.where(eq(edgeDevices.id, device.id));
			expect(stored?.lastSequence).toBe(1);
		} finally {
			await new Promise<void>((resolve) => server.close(() => resolve()));
			await rm(directory, { recursive: true, force: true });
		}
	});

	it("drives the real browser through unavailable, fresh, changed, stale, and recovery", {
		timeout: 60_000,
	}, async () => {
		const webPort = await reserveEphemeralPort();
		const webOrigin = `http://127.0.0.1:${webPort}`;
		await database
			.update(currentState)
			.set({
				currentCount: null,
				band: null,
				source: null,
				lastPushReceivedAt: null,
				lastEdgeReportedAt: null,
				activeDeviceId: null,
				settingsVersion: null,
			})
			.where(eq(currentState.id, 1));
		await database.insert(settingsVersions).values({
			capacity: 100,
			quietMaxPercent: 25,
			moderateMaxPercent: 50,
			busyMaxPercent: 75,
			timezone: "Asia/Riyadh",
			businessDayBoundary: "04:00",
			pushIntervalSeconds: 1,
			freshForSeconds: 3,
			operationalStaleAfterSeconds: 4,
			publicPollSeconds: 1,
			effectiveFrom: new Date("2026-07-12T22:32:30.000Z"),
			...alwaysOpenSchedule,
		});
		const browserToken = "browser-integration-token-that-is-at-least-32-bytes";
		await database.insert(edgeDevices).values({
			name: "browser-integration",
			tokenHash: createHash("sha256").update(browserToken).digest("hex"),
		});
		const diagnosticStartedAt = Date.now();
		const diagnostics = createW1Diagnostics();
		const app = new Hono();
		app.use(EDGE_PUSH_INTERNAL_PATH, async (context, next) => {
			let mode: string | null = null;
			let sequence: number | null = null;
			let observedAt: string | null = null;
			let currentCount: number | null = null;
			try {
				const request = (await context.req.raw.clone().json()) as unknown;
				if (typeof request === "object" && request !== null) {
					const fields = request as Record<string, unknown>;
					mode = w1Token(fields.mode, ["live", "backfill"]);
					sequence = w1Count(fields.sequence);
					observedAt = w1Timestamp(fields.observedAt);
					currentCount = w1Count(fields.currentCount);
				}
			} catch {
				// Observation only; the handler still receives the original request.
			}
			await next();
			let reason: string | null = null;
			let highestProcessedSequence: number | null = null;
			let serverTime: string | null = null;
			const httpStatus = context.res.status;
			try {
				const response = (await context.res.clone().json()) as unknown;
				if (typeof response === "object" && response !== null) {
					const fields = response as Record<string, unknown>;
					reason = w1Token(fields.reason, [
						"processed",
						"replay",
						"sequence_gap",
						"commands_pending",
					]);
					highestProcessedSequence = w1Count(fields.highestProcessedSequence);
					serverTime = w1Timestamp(fields.serverTime);
				}
			} catch {
				// Observation only; non-JSON responses are recorded by status alone.
			}
			diagnostics.record({
				kind: "edge",
				elapsedMs: Date.now() - diagnosticStartedAt,
				mode,
				sequence,
				observedAt,
				currentCount,
				httpStatus,
				reason,
				highestProcessedSequence,
				serverTime,
			});
		});
		app.use(
			"*",
			cors({
				origin: webOrigin,
				exposeHeaders: ["X-Fitway-Poll-Seconds"],
			}),
		);
		app.post(
			EDGE_PUSH_INTERNAL_PATH,
			createEdgePushHandler({
				findDeviceByHash: createFindDeviceByTokenHash(
					database as typeof import("@fitway/db").db,
				),
				limiter: new DeviceRateLimiter(),
				engine,
			}),
		);
		app.get(
			PUBLIC_OCCUPANCY_INTERNAL_PATH,
			createPublicOccupancyHandler(publicRepository),
		);
		const apiServer = serve({
			fetch: app.fetch,
			hostname: "127.0.0.1",
			port: 0,
		});
		await new Promise<void>((resolve) => apiServer.once("listening", resolve));
		const address = apiServer.address();
		if (!address || typeof address === "string") {
			apiServer.close();
			throw new Error("Browser API server did not expose a TCP port");
		}
		const apiBase = `http://127.0.0.1:${address.port}`;
		const vite = spawn(
			process.execPath,
			[
				path.resolve("apps/web/node_modules/vite/bin/vite.js"),
				"dev",
				"--host",
				"127.0.0.1",
				"--port",
				String(webPort),
				"--strictPort",
			],
			{
				cwd: path.resolve("apps/web"),
				env: { ...process.env, VITE_SERVER_URL: apiBase },
				stdio: "ignore",
				windowsHide: true,
			},
		);
		const simulatorDirectory = await mkdtemp(
			path.join(tmpdir(), "fitway-browser-edge-"),
		);
		const simulatorTokenFile = path.join(simulatorDirectory, "device.token");
		const simulatorStateFile = path.join(simulatorDirectory, "state.json");
		await writeFile(simulatorTokenFile, browserToken, "utf8");
		let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
		try {
			for (let attempt = 0; attempt < 80; attempt += 1) {
				try {
					const response = await fetch(webOrigin);
					if (response.ok) break;
				} catch {
					if (attempt === 79) throw new Error("Vite did not become ready");
				}
				await new Promise((resolve) => setTimeout(resolve, 250));
			}
			browser = await chromium.launch();
			const page = await browser.newPage({
				viewport: { width: 390, height: 844 },
			});
			let lastPublicSignature = "";
			page.on("response", (response) => {
				if (response.url() !== `${apiBase}${PUBLIC_OCCUPANCY_INTERNAL_PATH}`) {
					return;
				}
				void (async () => {
					try {
						const elapsedMs = Date.now() - diagnosticStartedAt;
						const rawPollSeconds = response.headers()["x-fitway-poll-seconds"];
						const pollSeconds =
							typeof rawPollSeconds === "string" &&
							/^\d+$/u.test(rawPollSeconds)
								? Number(rawPollSeconds)
								: null;
						const body = (await response.json()) as unknown;
						let freshness: string | null = null;
						let count: number | null = null;
						let computedAt: string | null = null;
						let lastUpdatedAt: string | null = null;
						let freshUntil: string | null = null;
						let source: string | null = null;
						if (typeof body === "object" && body !== null) {
							const fields = body as Record<string, unknown>;
							freshness = w1Token(fields.freshness, [
								"fresh",
								"stale",
								"unavailable",
								"closed",
							]);
							count = w1Count(fields.count);
							computedAt = w1Timestamp(fields.computedAt);
							lastUpdatedAt = w1Timestamp(fields.lastUpdatedAt);
							freshUntil = w1Timestamp(fields.freshUntil);
							source = w1Token(fields.source, ["edge", "manual"]);
						}
						const signature = `${freshness}|${count}|${source}`;
						if (signature === lastPublicSignature) {
							return;
						}
						lastPublicSignature = signature;
						diagnostics.record({
							kind: "public-browser-response",
							elapsedMs,
							httpStatus: response.status(),
							pollSeconds,
							freshness,
							count,
							computedAt,
							lastUpdatedAt,
							freshUntil,
							source,
						});
					} catch {
						// Observation only; never a success prerequisite.
					}
				})();
			});
			await page.goto(webOrigin);
			const observeCountWait = async (
				assertion: string,
				expectedCount: number,
				wait: Promise<void>,
			) => {
				try {
					await wait;
				} finally {
					const completedElapsedMs = Date.now() - diagnosticStartedAt;
					let observedCountText: string | null = null;
					let observedFreshnessText: string | null = null;
					try {
						const countText = await page
							.locator(".public-live__count-value")
							.textContent({ timeout: 250 })
							.catch(() => null);
						const freshnessText = await page
							.locator(".public-live__freshness--mobile")
							.textContent({ timeout: 250 })
							.catch(() => null);
						observedCountText =
							countText === null ? null : countText.trim().slice(0, 24) || null;
						observedFreshnessText =
							freshnessText === null
								? null
								: freshnessText.trim().slice(0, 24) || null;
					} catch {
						// Best-effort observation only.
					}
					diagnostics.record({
						kind: "dom-timing",
						elapsedMs: completedElapsedMs,
						assertion,
						expectedCount,
						observedCountText,
						observedFreshnessText,
					});
				}
			};
			const countWaitTimeoutMs = (
				sample: W1SimulatorSample,
				assertion: string,
			): number => {
				const deadlineMs = diagnosticStartedAt + sample.ackElapsedMs + 5_000;
				const remainingMs = deadlineMs - Date.now();
				if (remainingMs <= 0) {
					throw new Error(
						`${assertion} count wait deadline expired before the wait started`,
					);
				}
				return remainingMs;
			};
			await page
				.getByText("التحديث المباشر غير متاح الآن")
				.waitFor({ timeout: 5_000 });
			await expect(page.locator("meter").count()).resolves.toBe(0);
			let expectedSequence = 1;
			let lastAcceptedAckElapsedMs: number | null = null;
			const readSimulatorState = async (): Promise<W1SimulatorState> => {
				let parsed: unknown;
				try {
					parsed = JSON.parse(
						await readFile(simulatorStateFile, "utf8"),
					) as unknown;
				} catch {
					throw new Error("Simulator state file could not be read as JSON");
				}
				if (typeof parsed !== "object" || parsed === null) {
					throw new Error("Simulator state file is not an object");
				}
				const fields = parsed as Record<string, unknown>;
				const sequence = w1Count(fields.sequence);
				if (sequence === null) {
					throw new Error("Simulator state sequence is missing or invalid");
				}
				if (fields.inFlightRequest !== null) {
					throw new Error("Simulator state in-flight request is not null");
				}
				if (!Array.isArray(fields.outbox)) {
					throw new Error("Simulator state outbox is missing or invalid");
				}
				const outbox: readonly unknown[] = fields.outbox;
				const lastRequestFields = fields.lastRequest;
				if (
					typeof lastRequestFields !== "object" ||
					lastRequestFields === null
				) {
					throw new Error("Simulator state lastRequest is missing or invalid");
				}
				const lastRequest = lastRequestFields as Record<string, unknown>;
				const lastMode: "live" | "backfill" | null =
					lastRequest.mode === "live" || lastRequest.mode === "backfill"
						? lastRequest.mode
						: null;
				if (lastMode === null) {
					throw new Error(
						"Simulator state lastRequest mode is missing or invalid",
					);
				}
				const lastSequence = w1Count(lastRequest.sequence);
				if (lastSequence === null) {
					throw new Error(
						"Simulator state lastRequest sequence is missing or invalid",
					);
				}
				const lastObservedAt =
					lastRequest.observedAt === undefined ||
					lastRequest.observedAt === null
						? null
						: w1Timestamp(lastRequest.observedAt);
				const lastCurrentCount =
					lastRequest.currentCount === undefined ||
					lastRequest.currentCount === null
						? null
						: w1Count(lastRequest.currentCount);
				return {
					sequence,
					outbox,
					lastRequest: {
						mode: lastMode,
						sequence: lastSequence,
						observedAt: lastObservedAt,
						currentCount: lastCurrentCount,
					},
					inFlightRequest: null,
				};
			};
			const runSimulator = async (seed: number): Promise<W1SimulatorSample> => {
				let backfillCount = 0;
				for (;;) {
					if (lastAcceptedAckElapsedMs !== null) {
						const pacingTargetMs =
							diagnosticStartedAt + lastAcceptedAckElapsedMs + 5_000;
						const pacingRemainingMs = pacingTargetMs - Date.now();
						if (pacingRemainingMs > 0) {
							await new Promise((resolve) =>
								setTimeout(resolve, pacingRemainingMs),
							);
						}
					}
					const invocationStartElapsed = Date.now() - diagnosticStartedAt;
					let processOutcome: string | null = null;
					try {
						const result = await execFileAsync("py", [
							path.resolve("edge/simulator.py"),
							"--base-url",
							apiBase,
							"--token-file",
							simulatorTokenFile,
							"--state-file",
							simulatorStateFile,
							"--starting-count",
							"12",
							"--seed",
							String(seed),
							"--mode",
							"exit-heavy",
							"--action",
							"once",
						]);
						const stdoutText = result.stdout;
						if (/Network failure|Rate limited|retrying/u.test(stdoutText)) {
							processOutcome = "retry-indicated";
							throw new Error("Simulator output reported a transport retry");
						}
						if (result.stderr.trim().length > 0) {
							processOutcome = "stderr-present";
							throw new Error("Simulator produced stderr output");
						}
						const outcomeMatches = [
							...stdoutText.matchAll(
								/sequence=(\d+) outcome=([a-z_]+) highest=(\d+)/gu,
							),
						];
						const [outcomeMatch] = outcomeMatches;
						if (outcomeMatches.length !== 1 || !outcomeMatch) {
							processOutcome = "outcome-lines";
							throw new Error(
								"Simulator output did not contain exactly one outcome line",
							);
						}
						const reportedOutcome = outcomeMatch[2]?.slice(0, 24) ?? null;
						processOutcome = reportedOutcome;
						const reportedSequence = w1Count(Number(outcomeMatch[1]));
						const reportedHighest = w1Count(Number(outcomeMatch[3]));
						if (
							reportedOutcome !== "processed" ||
							reportedSequence === null ||
							reportedHighest === null
						) {
							throw new Error("Simulator outcome was not a processed result");
						}
						if (reportedSequence !== expectedSequence) {
							throw new Error(
								"Simulator outcome sequence did not match the expected contiguous sequence",
							);
						}
						if (reportedHighest !== reportedSequence) {
							throw new Error(
								"Simulator outcome highest sequence did not match the reported sequence",
							);
						}
						const observedEdges = diagnostics
							.snapshot()
							.filter(
								(record): record is W1EdgeDiagnostic =>
									record.kind === "edge" &&
									record.elapsedMs >= invocationStartElapsed,
							);
						if (observedEdges.length !== 1) {
							processOutcome =
								observedEdges.length === 0
									? "no-edge-record"
									: "multiple-edge-records";
							throw new Error(
								observedEdges.length === 0
									? "No edge request record was observed for the simulator invocation"
									: "More than one edge request record was observed for the simulator invocation",
							);
						}
						const [ackRecord] = observedEdges;
						if (!ackRecord) {
							processOutcome = "no-edge-record";
							throw new Error(
								"No edge request record was observed for the simulator invocation",
							);
						}
						if (ackRecord.httpStatus !== 200) {
							processOutcome = "non-200-ack";
							throw new Error(
								"Simulator edge request was not accepted with HTTP 200",
							);
						}
						if (ackRecord.reason !== "processed") {
							processOutcome = "unprocessed-ack";
							throw new Error("Simulator edge request was not processed");
						}
						if (
							ackRecord.mode === null ||
							ackRecord.sequence === null ||
							ackRecord.highestProcessedSequence !== ackRecord.sequence
						) {
							processOutcome = "uncorrelated-ack";
							throw new Error(
								"Edge acknowledgement did not correlate with the request",
							);
						}
						if (ackRecord.sequence !== reportedSequence) {
							processOutcome = "uncorrelated-ack";
							throw new Error(
								"Edge acknowledgement sequence did not match the simulator outcome",
							);
						}
						let state: W1SimulatorState;
						try {
							state = await readSimulatorState();
						} catch {
							processOutcome = "invalid-state";
							throw new Error(
								"Persisted simulator state was missing or invalid",
							);
						}
						if (state.sequence !== ackRecord.sequence) {
							processOutcome = "invalid-state";
							throw new Error(
								"Persisted simulator state sequence did not match the acknowledgement",
							);
						}
						if (
							state.lastRequest.mode !== ackRecord.mode ||
							state.lastRequest.sequence !== ackRecord.sequence
						) {
							processOutcome = "invalid-state";
							throw new Error(
								"Persisted simulator lastRequest did not match the observed request",
							);
						}
						if (ackRecord.mode === "backfill") {
							if (
								ackRecord.observedAt !== null ||
								ackRecord.currentCount !== null
							) {
								processOutcome = "uncorrelated-ack";
								throw new Error(
									"Backfill request unexpectedly carried observedAt or currentCount",
								);
							}
							if (
								state.lastRequest.observedAt !== null ||
								state.lastRequest.currentCount !== null
							) {
								processOutcome = "invalid-state";
								throw new Error(
									"Backfill lastRequest unexpectedly carried observedAt or currentCount",
								);
							}
							lastAcceptedAckElapsedMs = ackRecord.elapsedMs;
							expectedSequence = ackRecord.sequence + 1;
							backfillCount += 1;
							if (backfillCount >= 3) {
								processOutcome = "backfill-limit";
								throw new Error(
									"Simulator produced three accepted backfills without a live sample",
								);
							}
							continue;
						}
						if (ackRecord.mode !== "live") {
							processOutcome = "uncorrelated-ack";
							throw new Error("Edge request mode was not live or backfill");
						}
						if (
							ackRecord.observedAt === null ||
							ackRecord.currentCount === null
						) {
							processOutcome = "uncorrelated-ack";
							throw new Error(
								"Live edge request is missing observedAt or currentCount",
							);
						}
						if (ackRecord.serverTime === null) {
							processOutcome = "uncorrelated-ack";
							throw new Error("Live acknowledgement is missing serverTime");
						}
						if (
							state.lastRequest.observedAt !== ackRecord.observedAt ||
							state.lastRequest.currentCount !== ackRecord.currentCount
						) {
							processOutcome = "invalid-state";
							throw new Error(
								"Persisted simulator lastRequest did not match the live acknowledgement",
							);
						}
						if (state.outbox.length !== 0) {
							processOutcome = "invalid-state";
							throw new Error(
								"Simulator outbox is not empty for a live sample",
							);
						}
						const observedMs = Date.parse(ackRecord.observedAt);
						const serverMs = Date.parse(ackRecord.serverTime);
						const sampleAgeMs = serverMs - observedMs;
						if (
							!Number.isFinite(sampleAgeMs) ||
							sampleAgeMs < 0 ||
							sampleAgeMs > 3_000
						) {
							processOutcome = "invalid-freshness";
							throw new Error(
								"Live sample age is outside the accepted freshness window",
							);
						}
						lastAcceptedAckElapsedMs = ackRecord.elapsedMs;
						expectedSequence = ackRecord.sequence + 1;
						return {
							currentCount: ackRecord.currentCount,
							ackElapsedMs: ackRecord.elapsedMs,
						};
					} catch (invocationError) {
						if (processOutcome === null) {
							processOutcome = "transport-error";
							throw new Error(
								"Simulator invocation failed without a processed outcome",
							);
						}
						throw invocationError;
					} finally {
						diagnostics.record({
							kind: "simulator",
							elapsedMs: Date.now() - diagnosticStartedAt,
							seed,
							processOutcome,
						});
					}
				}
			};
			const firstCount = await runSimulator(41);
			await observeCountWait(
				"fresh-first-count",
				firstCount.currentCount,
				page
					.locator(".public-live__count-value")
					.getByText(String(firstCount.currentCount), { exact: true })
					.waitFor({
						timeout: countWaitTimeoutMs(firstCount, "fresh-first-count"),
					}),
			);
			await page
				.locator(".public-live__freshness--mobile")
				.getByText("تحديث مباشر", { exact: true })
				.waitFor({ timeout: 5_000 });
			const persistedState = JSON.parse(
				await readFile(simulatorStateFile, "utf8"),
			) as {
				sequence: number;
				count: number;
				minute: string;
				entries: number;
				exits: number;
				appliedCommandId: number;
				outbox: Array<{
					minuteStart: string;
					count: number;
					entries: number;
					exits: number;
				}>;
				lastRequest?: unknown;
				inFlightRequest: unknown | null;
			};
			expect(persistedState.outbox).toEqual([]);
			expect(persistedState.inFlightRequest).toBeNull();
			const previousMinute = new Date(
				Math.floor(Date.now() / 60_000) * 60_000 - 60_000,
			).toISOString();
			await writeFile(
				simulatorStateFile,
				JSON.stringify({ ...persistedState, minute: previousMinute }),
				"utf8",
			);
			const changedCount = await runSimulator(42);
			expect(changedCount.currentCount).not.toBe(firstCount.currentCount);
			await observeCountWait(
				"changed-count",
				changedCount.currentCount,
				page
					.locator(".public-live__count-value")
					.getByText(String(changedCount.currentCount), { exact: true })
					.waitFor({
						timeout: countWaitTimeoutMs(changedCount, "changed-count"),
					}),
			);
			await page.getByRole("button", { name: /الإنجليزية/u }).click();
			await page
				.getByText("Last known approximate count", { exact: true })
				.waitFor({ timeout: 5_000 });
			const recoveredCount = await runSimulator(43);
			await observeCountWait(
				"recovered-count",
				recoveredCount.currentCount,
				page
					.locator(".public-live__count-value")
					.getByText(String(recoveredCount.currentCount), { exact: true })
					.waitFor({
						timeout: countWaitTimeoutMs(recoveredCount, "recovered-count"),
					}),
			);
			await page
				.locator(".public-live__freshness--mobile")
				.getByText("Live update", { exact: true })
				.waitFor({ timeout: 5_000 });
			await page.getByRole("button", { name: /Arabic/u }).click();
			await page
				.locator(".public-live__freshness--mobile")
				.getByText("تحديث مباشر", { exact: true })
				.waitFor({ timeout: 5_000 });
		} catch (failure) {
			diagnostics.emit();
			throw failure;
		} finally {
			await browser?.close();
			if (vite.exitCode === null) {
				await new Promise<void>((resolve) => {
					vite.once("exit", () => resolve());
					vite.kill();
				});
			}
			await new Promise<void>((resolve) => apiServer.close(() => resolve()));
			await rm(simulatorDirectory, { recursive: true, force: true });
		}
	});
});
