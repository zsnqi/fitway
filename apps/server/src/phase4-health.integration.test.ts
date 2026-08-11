import { randomBytes, randomInt, randomUUID } from "node:crypto";
import path from "node:path";
import type { EdgeHealthStatus } from "@fitway/api/health/evaluator";
import { operationalSnapshotSchema } from "@fitway/api/health/snapshot";
import {
	type OccupancyEngineDependencies,
	processLivePush,
} from "@fitway/api/occupancy/engine";
import { PUBLIC_OCCUPANCY_INTERNAL_PATH } from "@fitway/api/public-occupancy";
import { AuthService } from "@fitway/auth";
import * as applicationSchema from "@fitway/db/schema/application";
import {
	currentState,
	edgeCurrentHealth,
	edgeDevices,
	settingsVersions,
} from "@fitway/db/schema/application";
import * as authSchema from "@fitway/db/schema/auth";
import { serve } from "@hono/node-server";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PinRateLimiter } from "./auth/pin-rate-limiter";
import { PostgresAuthRepository } from "./auth/postgres-auth-repository";
import { assertDisposableIntegrationDatabase } from "./test-support/integration-database-safety";

const connectionString = process.env.TEST_DATABASE_URL;
assertDisposableIntegrationDatabase({
	connectionString,
	resetMarker: process.env.FITWAY_INTEGRATION_RESET_DATABASE,
	runId: process.env.FITWAY_RUN_ID,
});

// This slice owns no auth changes; it provides its own server secrets so the
// real transport (`createApp`) can resolve sessions. Env is set before any
// db-touching module is dynamically imported in beforeAll.
const serverSecret = randomBytes(32).toString("base64url");
process.env.BETTER_AUTH_SECRET = serverSecret;
process.env.BETTER_AUTH_URL = "http://127.0.0.1/api/auth";
process.env.CORS_ORIGIN = "http://127.0.0.1";
process.env.NODE_ENV = "test";

const pool = new Pool({ connectionString });
const database = drizzle(pool, {
	schema: { ...applicationSchema, ...authSchema },
});
const service = new AuthService({
	repository: new PostgresAuthRepository(
		database as unknown as typeof import("@fitway/db").db,
	),
	pepper: serverSecret,
	cookieSecret: serverSecret,
});
const runtime = {
	service,
	staffPinLimiter: new PinRateLimiter(),
	ownerLoginLimiter: new PinRateLimiter(),
};

type Health = {
	process: EdgeHealthStatus;
	camera: EdgeHealthStatus;
	feed: EdgeHealthStatus;
	detectorFps: number | null;
};
let engine: Pick<OccupancyEngineDependencies, "transaction">;
let baseUrl = "";
let server: ReturnType<typeof serve>;
let deviceId = "";
const rawPin = `${randomInt(0, 1_000_000)}`.padStart(6, "0");
let staffCookie = "";
let ownerCookie = "";

const alwaysOpen = {
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

function cookiePair(setCookie: string) {
	return setCookie.split(";", 1)[0] ?? "";
}

async function request(pathname: string, init?: RequestInit) {
	return fetch(`${baseUrl}${pathname}`, init);
}

async function snapshot(cookie?: string) {
	const response = await request("/rpc/staff/operationalSnapshot", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...(cookie ? { Cookie: cookie } : {}),
		},
		body: JSON.stringify({ json: null }),
	});
	let body: unknown = null;
	try {
		body = await response.json();
	} catch {
		body = null;
	}
	const envelope = body as { json?: unknown } | null;
	return { status: response.status, body: envelope?.json ?? envelope };
}

async function push(
	sequence: number,
	count: number,
	options: {
		now: Date;
		health?: Health;
		minutes?: Array<{
			minuteStart: string;
			count: number;
			entries: number;
			exits: number;
		}>;
		device?: string;
	},
) {
	const { now } = options;
	return processLivePush(
		options.device ?? deviceId,
		{
			schemaVersion: 1,
			sequence,
			observedAt: new Date(now.getTime() - 1_000).toISOString(),
			currentCount: count,
			minutes: options.minutes ?? [],
			health: options.health ?? {
				process: "ok",
				camera: "ok",
				feed: "ok",
				detectorFps: 4.5,
			},
			appliedCommandId: null,
		},
		{ ...engine, now: () => now },
	);
}

async function projectionRows() {
	return database.select().from(edgeCurrentHealth);
}

beforeAll(async () => {
	const repositories = await import("./occupancy-repositories");
	engine = repositories.createOccupancyEngineDatabase(
		database as unknown as typeof import("@fitway/db").db,
	);
	const { createApp } = await import("./index");
	const app = createApp("test", runtime);

	await database.execute(sql`drop schema if exists drizzle cascade`);
	await database.execute(sql`drop schema if exists public cascade`);
	await database.execute(sql`create schema public`);
	await migrate(database, {
		migrationsFolder: path.resolve("packages/db/src/migrations"),
	});
	await database
		.update(settingsVersions)
		.set({ effectiveFrom: new Date("2026-01-01T00:00:00.000Z") });
	await database.insert(settingsVersions).values({
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
		effectiveFrom: new Date("2026-01-02T00:00:00.000Z"),
		...alwaysOpen,
	});
	const [device] = await database
		.insert(edgeDevices)
		.values({ name: "phase-4-health", tokenHash: "a".repeat(64) })
		.returning({ id: edgeDevices.id });
	if (!device) throw new Error("Health integration device was not created");
	deviceId = device.id;

	await new Promise<void>((resolve, reject) => {
		server = serve(
			{ fetch: app.fetch, hostname: "127.0.0.1", port: 0 },
			(info) => {
				baseUrl = `http://127.0.0.1:${info.port}`;
				resolve();
			},
		);
		server.once("error", reject);
	});

	await service.setSharedStaffPin(rawPin);
	const staffLogin = await request("/api/auth/staff/pin", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ pin: rawPin }),
	});
	staffCookie = cookiePair(staffLogin.headers.getSetCookie()[0] ?? "");
	const ownerPassword = randomBytes(24).toString("base64url");
	const ownerEmail = `owner-${randomUUID()}@fitway.example`;
	await service.provisionOwner({
		email: ownerEmail,
		displayName: "Provisioned pilot owner",
		password: ownerPassword,
	});
	const ownerLogin = await request("/api/auth/owner/password", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email: ownerEmail, password: ownerPassword }),
	});
	ownerCookie = cookiePair(ownerLogin.headers.getSetCookie()[0] ?? "");
}, 40_000);

afterAll(async () => {
	await new Promise<void>((resolve, reject) => {
		server.close((error) => (error ? reject(error) : resolve()));
	});
	await pool.end();
});

describe("Phase 4 operational health real HTTP and disposable Postgres slice", () => {
	it("has no seed projection and reports unavailable before the first push", async () => {
		expect(await projectionRows()).toHaveLength(0);
		const before = await snapshot(staffCookie);
		expect(before.status).toBe(200);
		const parsed = operationalSnapshotSchema.parse(before.body);
		expect(parsed.capacity).toBe(100);
		expect(parsed.source).toBeNull();
		expect(parsed.occupancy.freshness).toBe("unavailable");
		expect(parsed.health).toMatchObject({
			freshness: "unavailable",
			condition: "unknown",
			process: null,
			receivedAt: null,
			staleAt: null,
			lastSeenAt: null,
		});
	});

	it("persists the projection on an accepted push and reports current/healthy", async () => {
		const now = new Date();
		const minuteStart = new Date(
			Math.floor(now.getTime() / 60_000) * 60_000,
		).toISOString();
		const observedAt = new Date(now.getTime() - 1_000).toISOString();
		const result = await push(1, 12, {
			now,
			minutes: [{ minuteStart, count: 12, entries: 3, exits: 1 }],
			health: { process: "ok", camera: "ok", feed: "ok", detectorFps: 4.5 },
		});
		expect(result).toMatchObject({
			accepted: true,
			highestProcessedSequence: 1,
		});

		const rows = await projectionRows();
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({
			deviceId,
			sequence: 1,
			processStatus: "ok",
			cameraStatus: "ok",
			feedStatus: "ok",
			detectorFps: 4.5,
		});
		expect(rows[0]?.edgeObservedAt?.toISOString()).toBe(observedAt);
		expect(rows[0]?.receivedAt?.toISOString()).toBe(now.toISOString());
		expect(rows[0]?.updatedAt?.toISOString()).toBe(now.toISOString());

		const staff = await snapshot(staffCookie);
		expect(staff.status).toBe(200);
		const parsed = operationalSnapshotSchema.parse(staff.body);
		expect(parsed).toMatchObject({
			schemaVersion: 1,
			capacity: 100,
			source: "edge",
		});
		expect(parsed.occupancy).toMatchObject({
			schemaVersion: 2,
			freshness: "fresh",
			count: 12,
		});
		expect(parsed.health).toMatchObject({
			freshness: "current",
			condition: "healthy",
			process: "ok",
			camera: "ok",
			feed: "ok",
			detectorFps: 4.5,
		});
		expect(parsed.health.receivedAt).toBe(now.toISOString());

		const owner = await snapshot(ownerCookie);
		expect(owner.status).toBe(200);
		expect(operationalSnapshotSchema.parse(owner.body).health.freshness).toBe(
			"current",
		);
	});

	it("leaves the projection byte-for-byte unchanged on every non-accepted path", async () => {
		const now = new Date();
		const before = JSON.stringify(await projectionRows());

		expect(await push(1, 20, { now })).toMatchObject({ reason: "replay" });
		expect(JSON.stringify(await projectionRows())).toBe(before);

		expect(await push(3, 20, { now })).toMatchObject({
			reason: "sequence_gap",
		});
		expect(JSON.stringify(await projectionRows())).toBe(before);

		await expect(
			push(2, 20, {
				now,
				minutes: [
					{
						minuteStart: "2026-07-16T12:00:30.000Z",
						count: 20,
						entries: 1,
						exits: 0,
					},
				],
			}),
		).rejects.toThrow();
		expect(JSON.stringify(await projectionRows())).toBe(before);

		const [disabled] = await database
			.insert(edgeDevices)
			.values({
				name: "phase-4-health-disabled",
				tokenHash: "b".repeat(64),
				enabled: false,
			})
			.returning({ id: edgeDevices.id });
		if (!disabled) throw new Error("Disabled device was not created");
		await expect(push(1, 5, { now, device: disabled.id })).rejects.toThrow();
		expect(JSON.stringify(await projectionRows())).toBe(before);

		await database.delete(currentState);
		await expect(push(2, 22, { now })).rejects.toThrow(
			"Current singleton is missing",
		);
		expect(JSON.stringify(await projectionRows())).toBe(before);

		// Restore a coherent active state for the remaining snapshot cases.
		await database.insert(currentState).values({ id: 1 });
		const restore = new Date();
		expect(await push(2, 15, { now: restore })).toMatchObject({
			accepted: true,
		});
		const restored = await projectionRows();
		expect(restored).toHaveLength(1);
		expect(restored[0]?.sequence).toBe(2);
	});

	it("reports stale freshness while preserving the last-known degraded flags", async () => {
		const stalePush = new Date(Date.now() - 600_000);
		expect(
			await push(3, 18, {
				now: stalePush,
				health: {
					process: "degraded",
					camera: "ok",
					feed: "ok",
					detectorFps: 2,
				},
			}),
		).toMatchObject({ accepted: true });

		const parsed = operationalSnapshotSchema.parse(
			(await snapshot(staffCookie)).body,
		);
		expect(parsed.occupancy.freshness).toBe("stale");
		expect(parsed.health).toMatchObject({
			freshness: "stale",
			condition: "degraded",
			process: "degraded",
			camera: "ok",
			feed: "ok",
			detectorFps: 2,
		});
		expect(parsed.health.receivedAt).toBe(
			new Date(stalePush.getTime()).toISOString(),
		);
		expect(parsed.health.staleAt).toBe(
			new Date(stalePush.getTime() + 180_000).toISOString(),
		);
	});

	it("reports unavailable health when the active device is disabled", async () => {
		await database
			.update(edgeDevices)
			.set({ enabled: false })
			.where(eq(edgeDevices.id, deviceId));
		const parsed = operationalSnapshotSchema.parse(
			(await snapshot(staffCookie)).body,
		);
		expect(parsed.occupancy.freshness).toBe("unavailable");
		expect(parsed.health.freshness).toBe("unavailable");
		expect(parsed.health.process).toBeNull();
		expect(parsed.health.lastSeenAt).not.toBeNull();
		await database
			.update(edgeDevices)
			.set({ enabled: true })
			.where(eq(edgeDevices.id, deviceId));
	});

	it("enforces authentication and role on the leaf", async () => {
		expect((await snapshot()).status).toBe(401);
		expect((await snapshot(staffCookie)).status).toBe(200);
		expect((await snapshot(ownerCookie)).status).toBe(200);

		// Backdate created + expiry so the row is genuinely expired without
		// violating the expiry-after-creation check.
		await database.update(authSchema.authSessions).set({
			createdAt: new Date("2020-01-01T00:00:00.000Z"),
			expiresAt: new Date("2020-06-01T00:00:00.000Z"),
		});
		expect((await snapshot(staffCookie)).status).toBe(401);
		expect((await snapshot(ownerCookie)).status).toBe(401);
	});

	it("keeps the public payload free of health, capacity, and device identity", async () => {
		const response = await request(PUBLIC_OCCUPANCY_INTERNAL_PATH);
		const body = (await response.json()) as Record<string, unknown>;
		expect(body.schemaVersion).toBe(2);
		for (const forbidden of [
			"capacity",
			"percentFull",
			"health",
			"deviceId",
			"process",
			"camera",
			"feed",
			"detectorFps",
		]) {
			expect(body).not.toHaveProperty(forbidden);
		}
	});
});
