import { createHash, randomBytes, randomInt, randomUUID } from "node:crypto";
import path from "node:path";
import type { EdgePushRequest } from "@fitway/api/edge-push";
import { processLivePush } from "@fitway/api/occupancy/engine";
import { AuthService, type CanonicalAuthContext } from "@fitway/auth";
import * as applicationSchema from "@fitway/db/schema/application";
import {
	auditLog,
	currentState,
	edgeCommands,
	edgeCurrentHealth,
	edgeDevices,
	settingsVersions,
} from "@fitway/db/schema/application";
import * as authSchema from "@fitway/db/schema/auth";
import { serve } from "@hono/node-server";
import { asc, eq, sql } from "drizzle-orm";
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

const rawPin = `${randomInt(0, 1_000_000)}`.padStart(6, "0");
const rawDeviceToken = `p5_${"d".repeat(40)}`;
let baseUrl = "";
let server: ReturnType<typeof serve>;
let deviceId = "";
let staffCookie = "";
let ownerCookie = "";
let engine: ReturnType<
	typeof import("./occupancy-repositories").createOccupancyEngineDatabase
>;
let commandIds: number[] = [];

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

async function rpc(pathname: string, input: unknown, cookie?: string) {
	const response = await request(`/rpc/staff/${pathname}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...(cookie ? { Cookie: cookie } : {}),
		},
		body: JSON.stringify({ json: input }),
	});
	const envelope = (await response.json()) as { json?: unknown };
	return { status: response.status, body: envelope.json ?? envelope };
}

function minuteFor(value: Date) {
	return new Date(Math.floor(value.getTime() / 60_000) * 60_000).toISOString();
}

function pushPayload(
	sequence: number,
	currentCount: number,
	appliedCommandId: number | null,
) {
	const now = new Date(Date.now() + sequence * 1_000);
	const input: EdgePushRequest = {
		schemaVersion: 1,
		sequence,
		observedAt: now.toISOString(),
		currentCount,
		minutes: [
			{
				minuteStart: minuteFor(now),
				count: currentCount,
				entries: 0,
				exits: 0,
			},
		],
		health: {
			process: "ok",
			camera: "ok",
			feed: "ok",
			detectorFps: 4.8,
		},
		appliedCommandId,
	};
	return {
		now,
		input,
	};
}

async function push(
	sequence: number,
	currentCount: number,
	appliedCommandId: number | null,
) {
	const value = pushPayload(sequence, currentCount, appliedCommandId);
	return processLivePush(deviceId, value.input, {
		...engine,
		now: () => value.now,
	});
}

async function httpPush(
	sequence: number,
	currentCount: number,
	appliedCommandId: number | null,
) {
	const value = pushPayload(sequence, currentCount, appliedCommandId);
	const response = await request("/edge/push", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${rawDeviceToken}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(value.input),
	});
	return { status: response.status, body: await response.json() };
}

beforeAll(async () => {
	await database.execute(sql`drop schema if exists drizzle cascade`);
	await database.execute(sql`drop schema if exists public cascade`);
	await database.execute(sql`create schema public`);
	await migrate(database, {
		migrationsFolder: path.resolve("packages/db/src/migrations"),
	});
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
		...alwaysOpen,
	});
	const [device] = await database
		.insert(edgeDevices)
		.values({
			name: "phase-5-command-domain",
			tokenHash: createHash("sha256").update(rawDeviceToken).digest("hex"),
		})
		.returning({ id: edgeDevices.id });
	if (!device) throw new Error("Phase 5 device was not created");
	deviceId = device.id;

	const repositories = await import("./occupancy-repositories");
	engine = repositories.createOccupancyEngineDatabase(
		database as unknown as typeof import("@fitway/db").db,
	);
	const { createApp } = await import("./index");
	const app = createApp("test", runtime);
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

	expect(await push(1, 10, null)).toMatchObject({
		accepted: true,
		commands: [],
	});
}, 40_000);

afterAll(async () => {
	await new Promise<void>((resolve, reject) => {
		server.close((error) => (error ? reject(error) : resolve()));
	});
	await pool.end();
});

describe.sequential("Phase 5 command domain over real HTTP and disposable Postgres", () => {
	it("enforces authorization and strict correction/reset/backfill-shaped validation", async () => {
		expect((await rpc("issueCorrection", { delta: 1 })).status).toBe(401);
		for (const invalid of [
			{ absolute: -1 },
			{ delta: 1.5 },
			{ delta: 1, absolute: 2 },
			{ delta: 1, reason: " ".repeat(3) },
		]) {
			expect((await rpc("issueCorrection", invalid, staffCookie)).status).toBe(
				400,
			);
		}
		expect((await rpc("issueReset", { extra: true }, ownerCookie)).status).toBe(
			400,
		);

		const beforeBackfill = JSON.stringify({
			current: await database.select().from(currentState),
			health: await database.select().from(edgeCurrentHealth),
			commands: await database.select().from(edgeCommands),
			audits: await database.select().from(auditLog),
		});
		const backfillNow = new Date();
		const invalidBackfill = await request("/edge/push", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${rawDeviceToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				schemaVersion: 1,
				sequence: 2,
				observedAt: backfillNow.toISOString(),
				currentCount: 10,
				minutes: [
					{
						minuteStart: minuteFor(backfillNow),
						count: 10,
						entries: 0,
						exits: 0,
					},
				],
				health: {
					process: "ok",
					camera: "ok",
					feed: "ok",
					detectorFps: 4.8,
				},
				appliedCommandId: null,
				backfillOnly: true,
			}),
		});
		expect(invalidBackfill.status).toBe(422);
		const [device] = await database
			.select({ lastSequence: edgeDevices.lastSequence })
			.from(edgeDevices)
			.where(eq(edgeDevices.id, deviceId));
		expect(device?.lastSequence).toBe(1);
		expect(
			JSON.stringify({
				current: await database.select().from(currentState),
				health: await database.select().from(edgeCurrentHealth),
				commands: await database.select().from(edgeCommands),
				audits: await database.select().from(auditLog),
			}),
		).toBe(beforeBackfill);
	});

	it("atomically issues monotonic commands, floors delta, supersedes latest-only, and preserves cloud current state", async () => {
		const delta = await rpc(
			"issueCorrection",
			{ delta: -20, reason: "  obvious drift  " },
			staffCookie,
		);
		expect(delta.status).toBe(200);
		const deltaResult = delta.body as {
			command: { id: number; targetValue: number };
		};
		expect(deltaResult.command.targetValue).toBe(0);

		const absolute = await rpc(
			"issueCorrection",
			{ absolute: 17 },
			ownerCookie,
		);
		expect(absolute.status).toBe(200);
		const absoluteResult = absolute.body as {
			command: { id: number; targetValue: number };
		};
		commandIds = [deltaResult.command.id, absoluteResult.command.id];
		expect(commandIds[1]).toBeGreaterThan(commandIds[0] ?? 0);

		const rows = await database
			.select()
			.from(edgeCommands)
			.orderBy(asc(edgeCommands.id));
		expect(rows.map((row) => row.status)).toEqual(["superseded", "pending"]);
		expect(rows[0]?.supersededByCommandId).toBe(commandIds[1]);
		const audits = await database
			.select()
			.from(auditLog)
			.orderBy(asc(auditLog.id));
		expect(audits).toHaveLength(2);
		expect(audits[0]).toMatchObject({
			actorPrincipalKind: "shared_staff",
			actorRole: "staff",
			action: "correction_delta",
			priorValue: 10,
			requestedDelta: -20,
			effectiveValue: 0,
			reason: "obvious drift",
		});
		expect(audits[1]).toMatchObject({
			actorPrincipalKind: "owner",
			actorRole: "owner",
			action: "correction_absolute",
			requestedValue: 17,
			effectiveValue: 17,
			reason: null,
		});
		const [current] = await database.select().from(currentState);
		expect(current?.currentCount).toBe(10);
	});

	it("delivers latest-only and advances lifecycle only on eligible accepted acknowledgements", async () => {
		const latest = commandIds[1];
		const superseded = commandIds[0];
		if (!latest || !superseded) throw new Error("Commands were not issued");

		const firstDelivery = await httpPush(2, 10, latest);
		expect(firstDelivery.status).toBe(200);
		expect(firstDelivery.body).toMatchObject({
			accepted: true,
			commands: [{ id: latest, type: "set_count", targetValue: 17 }],
		});
		expect(
			(
				await database
					.select()
					.from(edgeCommands)
					.where(eq(edgeCommands.id, latest))
			)[0]?.status,
		).toBe("pending");

		expect(await push(2, 99, latest)).toMatchObject({ reason: "replay" });
		expect(await push(4, 99, latest)).toMatchObject({ reason: "sequence_gap" });
		expect(
			(
				await database
					.select()
					.from(edgeCommands)
					.where(eq(edgeCommands.id, latest))
			)[0]?.status,
		).toBe("pending");

		expect(await push(3, 10, latest + 1_000)).toMatchObject({
			accepted: true,
			commands: [{ id: latest }],
		});
		expect(await push(4, 10, superseded)).toMatchObject({
			accepted: true,
			commands: [{ id: latest }],
		});
		expect(
			(
				await database
					.select()
					.from(edgeCommands)
					.where(eq(edgeCommands.id, latest))
			)[0]?.status,
		).toBe("pending");

		const reset = await rpc(
			"issueReset",
			{ reason: " closing check " },
			ownerCookie,
		);
		expect(reset.status).toBe(200);
		const resetId = (reset.body as { command: { id: number } }).command.id;
		expect(resetId).toBeGreaterThan(latest);
		expect(await push(5, 10, latest)).toMatchObject({
			accepted: true,
			commands: [{ id: resetId, type: "reset_zero", targetValue: null }],
		});
		expect(
			(
				await database
					.select()
					.from(edgeCommands)
					.where(eq(edgeCommands.id, resetId))
			)[0]?.status,
		).toBe("pending");

		expect(await push(6, 0, resetId)).toMatchObject({
			accepted: true,
			commands: [],
		});
		const finalRows = await database
			.select()
			.from(edgeCommands)
			.orderBy(asc(edgeCommands.id));
		expect(finalRows.map((row) => row.status)).toEqual([
			"superseded",
			"superseded",
			"applied",
		]);
		expect(finalRows[2]?.deliveredAt).not.toBeNull();
		expect(finalRows[2]?.appliedAt).not.toBeNull();
		const appliedBeforeReplay = finalRows[2];
		expect(await push(7, 0, resetId)).toMatchObject({
			accepted: true,
			commands: [],
		});
		const [appliedAfterReplay] = await database
			.select()
			.from(edgeCommands)
			.where(eq(edgeCommands.id, resetId));
		expect(appliedAfterReplay).toEqual(appliedBeforeReplay);
		const [current] = await database.select().from(currentState);
		expect(current?.currentCount).toBe(0);
	});

	it("rolls back command, supersession, and audit together when audit append fails", async () => {
		expect(
			(await rpc("issueCorrection", { absolute: 3 }, staffCookie)).status,
		).toBe(200);
		const beforeCommands = await database.select().from(edgeCommands);
		const beforeAudits = await database.select().from(auditLog);
		const [principal] = await database
			.select()
			.from(authSchema.authPrincipals)
			.where(eq(authSchema.authPrincipals.principalKind, "shared_staff"));
		if (!principal) throw new Error("Shared staff principal is missing");
		const actor: CanonicalAuthContext = {
			principalId: principal.id,
			principalKind: "shared_staff",
			role: "staff",
			sessionId: randomUUID(),
			expiresAt: new Date(Date.now() + 60_000),
			active: true,
		};
		const { createCommandServiceDatabase } = await import(
			"./command-repository"
		);
		const failing = createCommandServiceDatabase(
			database as unknown as typeof import("@fitway/db").db,
			async () => {
				throw new Error("forced audit failure");
			},
		);
		await expect(
			failing.issueCorrection(actor, { absolute: 4 }),
		).rejects.toThrow("forced audit failure");
		expect(await database.select().from(edgeCommands)).toEqual(beforeCommands);
		expect(await database.select().from(auditLog)).toEqual(beforeAudits);
	});
});
