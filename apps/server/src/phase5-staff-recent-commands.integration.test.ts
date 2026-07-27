import { createHash, randomBytes, randomInt, randomUUID } from "node:crypto";
import path from "node:path";
import { recentCommandsSchema } from "@fitway/api/commands/recent-commands";
import { OPENAPI_RESOURCE_PATH } from "@fitway/api/edge-push";
import { AuthService } from "@fitway/auth";
import * as applicationSchema from "@fitway/db/schema/application";
import { authPrincipals } from "@fitway/db/schema/auth";
import { serve } from "@hono/node-server";
import { and, eq } from "drizzle-orm";
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
	schema: { ...applicationSchema, authPrincipals },
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

let baseUrl = "";
let server: ReturnType<typeof serve>;
let staffCookie = "";
let ownerCookie = "";
const rawPin = `${randomInt(0, 1_000_000)}`.padStart(6, "0");

function cookiePair(setCookie: string) {
	return setCookie.split(";", 1)[0] ?? "";
}

async function request(pathname: string, init?: RequestInit) {
	return fetch(`${baseUrl}${pathname}`, init);
}

async function recentCommands(cookie?: string) {
	const response = await request("/rpc/staff/recentCommands", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...(cookie ? { Cookie: cookie } : {}),
		},
		body: JSON.stringify({ json: null }),
	});
	const envelope = (await response.json()) as { json?: unknown };
	return { status: response.status, body: envelope.json ?? envelope };
}

beforeAll(async () => {
	await database.execute("drop schema if exists drizzle cascade");
	await database.execute("drop schema if exists public cascade");
	await database.execute("create schema public");
	await migrate(database, {
		migrationsFolder: path.resolve("packages/db/src/migrations"),
	});

	const [device] = await database
		.insert(applicationSchema.edgeDevices)
		.values({
			name: "phase-5-staff-recent-commands",
			tokenHash: createHash("sha256").update("recent-commands").digest("hex"),
		})
		.returning({ id: applicationSchema.edgeDevices.id });
	if (!device) throw new Error("Recent-command test device was not created");
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
		displayName: "Lifecycle owner",
		password: ownerPassword,
	});
	const ownerLogin = await request("/api/auth/owner/password", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email: ownerEmail, password: ownerPassword }),
	});
	ownerCookie = cookiePair(ownerLogin.headers.getSetCookie()[0] ?? "");

	const [staff] = await database
		.select({ id: authPrincipals.id })
		.from(authPrincipals)
		.where(
			and(
				eq(authPrincipals.principalKind, "shared_staff"),
				eq(authPrincipals.role, "staff"),
			),
		);
	if (!staff) throw new Error("Shared staff principal was not created");
	const issuedAt = new Date("2026-07-27T12:00:00.000Z");
	const deliveredAt = new Date("2026-07-27T12:00:20.000Z");
	const appliedAt = new Date("2026-07-27T12:00:40.000Z");
	const supersededAt = new Date("2026-07-27T12:01:00.000Z");
	const [applied] = await database
		.insert(applicationSchema.edgeCommands)
		.values({
			deviceId: device.id,
			type: "reset_zero",
			targetValue: null,
			status: "applied",
			issuedByPrincipalId: staff.id,
			reason: "Closing check",
			issuedAt,
			deliveredAt,
			appliedAt,
		})
		.returning({ id: applicationSchema.edgeCommands.id });
	const [olderPending] = await database
		.insert(applicationSchema.edgeCommands)
		.values({
			deviceId: device.id,
			type: "set_count",
			targetValue: 17,
			issuedByPrincipalId: staff.id,
			issuedAt,
		})
		.returning({ id: applicationSchema.edgeCommands.id });
	const [newerPending] = await database
		.insert(applicationSchema.edgeCommands)
		.values({
			deviceId: device.id,
			type: "set_count",
			targetValue: 19,
			issuedByPrincipalId: staff.id,
			issuedAt,
		})
		.returning({ id: applicationSchema.edgeCommands.id });
	if (!applied || !olderPending || !newerPending) {
		throw new Error("Recent-command lifecycle rows were not created");
	}
	await database
		.update(applicationSchema.edgeCommands)
		.set({
			status: "superseded",
			supersededAt,
			supersededByCommandId: newerPending.id,
		})
		.where(eq(applicationSchema.edgeCommands.id, olderPending.id));
	await database.insert(applicationSchema.edgeCommands).values({
		deviceId: device.id,
		type: "set_count",
		targetValue: 21,
		issuedByPrincipalId: staff.id,
		issuedAt,
		deliveredAt,
	});
}, 40_000);

afterAll(async () => {
	if (server) {
		await new Promise<void>((resolve, reject) => {
			server.close((error) => (error ? reject(error) : resolve()));
		});
	}
	await pool.end();
});

describe.sequential("private recent command lifecycle read", () => {
	it("requires a staff-or-owner session and preserves exact server lifecycle rows", async () => {
		expect((await recentCommands()).status).toBe(401);
		const staff = await recentCommands(staffCookie);
		const owner = await recentCommands(ownerCookie);
		expect(staff.status).toBe(200);
		expect(owner.status).toBe(200);
		const rows = recentCommandsSchema.parse(staff.body);
		expect(rows).toHaveLength(4);
		expect(rows.map(({ status }) => status)).toEqual([
			"pending",
			"pending",
			"superseded",
			"applied",
		]);
		expect(rows[0]).toMatchObject({
			status: "pending",
			deliveredAt: "2026-07-27T12:00:20.000Z",
			appliedAt: null,
		});
		expect(rows[2]).toMatchObject({
			status: "superseded",
			supersededAt: "2026-07-27T12:01:00.000Z",
			supersededByCommandId: rows[1]?.id,
		});
		expect(rows[3]).toMatchObject({
			type: "reset_zero",
			targetValue: null,
			status: "applied",
			deliveredAt: "2026-07-27T12:00:20.000Z",
			appliedAt: "2026-07-27T12:00:40.000Z",
		});
		for (const row of rows) {
			expect(Object.keys(row).sort()).toEqual([
				"appliedAt",
				"deliveredAt",
				"id",
				"issuedAt",
				"reason",
				"status",
				"supersededAt",
				"supersededByCommandId",
				"targetValue",
				"type",
			]);
		}
		expect(owner.body).toEqual(staff.body);
	});

	it("does not publish the private read through the frozen edge OpenAPI surface", async () => {
		const response = await request(OPENAPI_RESOURCE_PATH);
		expect(response.status).toBe(200);
		expect(JSON.stringify(await response.json())).not.toContain(
			"recentCommands",
		);
	});
});
