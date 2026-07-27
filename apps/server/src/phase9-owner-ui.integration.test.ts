import { randomBytes, randomInt, randomUUID } from "node:crypto";
import path from "node:path";
import { businessDayFor } from "@fitway/api/occupancy/business-day";
import { AuthService } from "@fitway/auth";
import * as applicationSchema from "@fitway/db/schema/application";
import {
	edgeDevices,
	occupancyMinutes,
	settingsVersions,
} from "@fitway/db/schema/application";
import * as authSchema from "@fitway/db/schema/auth";
import { serve } from "@hono/node-server";
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
const secret = randomBytes(32).toString("base64url");
process.env.BETTER_AUTH_SECRET = secret;
process.env.BETTER_AUTH_URL = "http://127.0.0.1/api/auth";
process.env.CORS_ORIGIN = "http://127.0.0.1";
process.env.NODE_ENV = "test";

const pool = new Pool({ connectionString });
const database = drizzle(pool, {
	schema: { ...applicationSchema, ...authSchema },
});
const authService = new AuthService({
	repository: new PostgresAuthRepository(
		database as unknown as typeof import("@fitway/db").db,
	),
	pepper: secret,
	cookieSecret: secret,
});
const runtime = {
	service: authService,
	staffPinLimiter: new PinRateLimiter(),
	ownerLoginLimiter: new PinRateLimiter(),
};
let server: ReturnType<typeof serve>;
let baseUrl = "";
let staffCookie = "";
let ownerCookie = "";
let historicalVersion = 0;
let currentVersion = 0;

function cookiePair(response: Response) {
	return (response.headers.getSetCookie()[0] ?? "").split(";", 1)[0] ?? "";
}

async function rpc(
	pathName: string,
	json: unknown,
	cookie?: string,
): Promise<Response> {
	return fetch(`${baseUrl}/rpc/${pathName}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...(cookie ? { Cookie: cookie } : {}),
		},
		body: JSON.stringify({ json }),
	});
}

beforeAll(async () => {
	const { createApp } = await import("./index");
	await database.execute("drop schema if exists drizzle cascade");
	await database.execute("drop schema if exists public cascade");
	await database.execute("create schema public");
	await migrate(database, {
		migrationsFolder: path.resolve("packages/db/src/migrations"),
	});
	await database.delete(settingsVersions);

	const schedule = {
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
	};
	const [historical] = await database
		.insert(settingsVersions)
		.values({
			capacity: 100,
			quietMaxPercent: 25,
			moderateMaxPercent: 50,
			busyMaxPercent: 75,
			timezone: "Asia/Riyadh",
			businessDayBoundary: "04:00",
			effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
			...schedule,
		})
		.returning({ version: settingsVersions.version });
	const [current] = await database
		.insert(settingsVersions)
		.values({
			capacity: 120,
			quietMaxPercent: 25,
			moderateMaxPercent: 50,
			busyMaxPercent: 75,
			timezone: "Europe/London",
			businessDayBoundary: "03:30",
			effectiveFrom: new Date("2026-07-22T00:00:00.000Z"),
			...schedule,
		})
		.returning({ version: settingsVersions.version });
	if (!historical || !current)
		throw new Error("Settings fixtures were not created");
	historicalVersion = historical.version;
	currentVersion = current.version;
	const [device] = await database
		.insert(edgeDevices)
		.values({ name: "owner-ui", tokenHash: "b".repeat(64) })
		.returning({ id: edgeDevices.id });
	if (!device) throw new Error("Device fixture was not created");
	await database.insert(occupancyMinutes).values({
		deviceId: device.id,
		minuteStartUtc: new Date("2026-07-21T10:00:00.000Z"),
		businessDay: "2026-07-21",
		count: 0,
		entries: 3,
		exits: 1,
		band: "quiet",
		capacitySnapshot: 100,
		settingsVersion: historicalVersion,
		source: "live",
	});

	const ownerPassword = randomBytes(18).toString("base64url");
	const ownerEmail = `phase9-${randomUUID()}@fitway.example`;
	await authService.provisionOwner({
		email: ownerEmail,
		displayName: "Phase 9 owner",
		password: ownerPassword,
	});

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

	const staffPin = `${randomInt(0, 1_000_000)}`.padStart(6, "0");
	await authService.setSharedStaffPin(staffPin);
	staffCookie = cookiePair(
		await fetch(`${baseUrl}/api/auth/staff/pin`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ pin: staffPin }),
		}),
	);
	ownerCookie = cookiePair(
		await fetch(`${baseUrl}/api/auth/owner/password`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: ownerEmail, password: ownerPassword }),
		}),
	);
}, 30_000);

afterAll(async () => {
	await new Promise<void>((resolve, reject) =>
		server.close((error) => (error ? reject(error) : resolve())),
	);
	await pool.end();
});

describe("Phase 9 owner analytics private transport", () => {
	it("enforces owner auth, strict inputs, unchanged analytics, and timezone mappings", async () => {
		for (const pathName of [
			"admin/analytics/daily",
			"admin/analytics/timeContext",
		]) {
			expect((await rpc(pathName, null)).status).toBe(401);
			expect((await rpc(pathName, null, staffCookie)).status).toBe(403);
		}

		expect(
			(
				await rpc(
					"admin/analytics/daily",
					{ businessDay: "2026-07-21", extra: true },
					ownerCookie,
				)
			).status,
		).toBe(400);
		expect(
			(
				await rpc(
					"admin/analytics/timeContext",
					{ settingsVersions: [historicalVersion, historicalVersion] },
					ownerCookie,
				)
			).status,
		).toBe(400);

		const daily = await rpc(
			"admin/analytics/daily",
			{ businessDay: "2026-07-21" },
			ownerCookie,
		);
		expect(daily.status).toBe(200);
		const dailyBody = (await daily.json()) as { json: Record<string, unknown> };
		expect(dailyBody.json).toMatchObject({
			businessDay: "2026-07-21",
			dailyAverage: 0,
			estimatedEntranceCrossings: 3,
			observedOpenMinutes: 1,
			peak: { count: 0, settingsVersion: historicalVersion },
		});
		expect(Object.keys(dailyBody.json).sort()).toEqual(
			[
				"businessDay",
				"coverage",
				"dailyAverage",
				"estimatedEntranceCrossings",
				"expectedOpenMinutes",
				"observedOpenMinutes",
				"peak",
				"timeline",
			].sort(),
		);

		const expectedCurrentBusinessDay = businessDayFor(
			new Date(),
			"Europe/London",
			"03:30",
		);
		const currentDaily = await rpc("admin/analytics/daily", {}, ownerCookie);
		expect(currentDaily.status).toBe(200);
		expect(await currentDaily.json()).toMatchObject({
			json: { businessDay: expectedCurrentBusinessDay },
		});

		const timeContext = await rpc(
			"admin/analytics/timeContext",
			{ settingsVersions: [historicalVersion] },
			ownerCookie,
		);
		expect(timeContext.status).toBe(200);
		expect(await timeContext.json()).toEqual({
			json: {
				current: {
					settingsVersion: currentVersion,
					timeZone: "Europe/London",
				},
				versions: [
					{
						settingsVersion: historicalVersion,
						timeZone: "Asia/Riyadh",
					},
				],
			},
		});
		expect(
			(
				await rpc(
					"admin/analytics/timeContext",
					{ settingsVersions: [999_999] },
					ownerCookie,
				)
			).status,
		).toBe(500);
	});
});
