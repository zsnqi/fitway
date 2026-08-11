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
		const app = new Hono();
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
			await page.goto(webOrigin);
			await page
				.getByText("التحديث المباشر غير متاح الآن")
				.waitFor({ timeout: 5_000 });
			await expect(page.locator("meter").count()).resolves.toBe(0);
			const runSimulator = async (seed: number) => {
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
				expect(result.stdout).toContain("outcome=processed");
				const state = JSON.parse(
					await readFile(simulatorStateFile, "utf8"),
				) as { count: number };
				return state.count;
			};
			const firstCount = await runSimulator(41);
			await page
				.locator(".public-live__count-value")
				.getByText(String(firstCount), { exact: true })
				.waitFor({ timeout: 5_000 });
			await page
				.locator(".public-live__freshness--mobile")
				.getByText("تحديث مباشر", { exact: true })
				.waitFor({ timeout: 5_000 });
			const changedCount = await runSimulator(42);
			expect(changedCount).not.toBe(firstCount);
			await page
				.locator(".public-live__count-value")
				.getByText(String(changedCount), { exact: true })
				.waitFor({ timeout: 5_000 });
			await page.getByRole("button", { name: /الإنجليزية/u }).click();
			await page
				.getByText("Last known approximate count", { exact: true })
				.waitFor({ timeout: 5_000 });
			const recoveredCount = await runSimulator(43);
			await page
				.locator(".public-live__count-value")
				.getByText(String(recoveredCount), { exact: true })
				.waitFor({ timeout: 5_000 });
			await page
				.locator(".public-live__freshness--mobile")
				.getByText("Live update", { exact: true })
				.waitFor({ timeout: 5_000 });
			await page.getByRole("button", { name: /Arabic/u }).click();
			await page
				.locator(".public-live__freshness--mobile")
				.getByText("تحديث مباشر", { exact: true })
				.waitFor({ timeout: 5_000 });
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
