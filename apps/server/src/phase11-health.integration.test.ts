/**
 * Phase 11 owner incident and uptime summary over the real oRPC transport, real
 * authentication, and disposable Postgres.
 *
 * The decisive part of this fixture is that the alert history is written by the frozen
 * Phase 8 writer itself — `createAlertRepository(...).evaluateAndNotify` — and not by
 * hand. That is the only way to prove the read surface understands the shape the
 * writer actually produces: two persisted rows per notice, one `conditionStartedAt`
 * carried across every bounded re-alert, and a recovery linked back to the last alert.
 * A hand-built alert fixture would only prove that the reader agrees with its author.
 *
 * Closed-hours semantics are exercised here through a genuinely closed weekday, and
 * exhaustively in `packages/api/src/health/incidents.test.ts`, where the clock is not
 * the wall clock.
 */
import { randomBytes, randomInt, randomUUID } from "node:crypto";
import path from "node:path";
import type { AlertNotifier } from "@fitway/api/alerts/notifier";
import { WEEKDAYS } from "@fitway/api/occupancy/schedule";
import { AuthService } from "@fitway/auth";
import * as applicationSchema from "@fitway/db/schema/application";
import {
	alertLog,
	currentState,
	edgeDevices,
	edgeHealthLog,
	settingsVersions,
} from "@fitway/db/schema/application";
import * as authSchema from "@fitway/db/schema/auth";
import { serve } from "@hono/node-server";
import { asc, eq } from "drizzle-orm";
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

const GYM_TIME_ZONE = "Asia/Riyadh";
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const RE_ALERT_MS = 30 * MINUTE;
const PRE_OPEN_MS = 30 * MINUTE;

type SummaryPayload = {
	window: {
		businessDayFrom: string;
		businessDayTo: string;
		businessDays: number;
		timeZone: string;
		generatedAtUtc: string;
	};
	connection: {
		expectedOpenMinutes: number;
		monitoredOpenMinutes: number;
		onlineOpenMinutes: number;
		offlineOpenMinutes: number;
		uptimeRatio: number | null;
		monitoredRatio: number | null;
		monitoringStartedAtUtc: string | null;
		offlinePeriodCount: number;
		offlinePeriods: Array<{
			startedAtUtc: string;
			endedAtUtc: string | null;
			elapsedMinutes: number;
			openMinutes: number;
		}>;
	};
	alerts: {
		noticeCount: number;
		delivered: number;
		failed: number;
		unconfirmed: number;
		incidentCount: number;
		incidents: Array<{
			condition: string;
			startedAtUtc: string;
			lastNoticeAtUtc: string | null;
			recoveredAtUtc: string | null;
			noticeCount: number;
			delivered: number;
			failed: number;
			unconfirmed: number;
		}>;
	};
};

let server: ReturnType<typeof serve>;
let baseUrl = "";
let staffCookie = "";
let ownerCookie = "";
let ownerEmail = "";
let deviceId = "";
/** The instant the injected stale-push condition was first alerted on. */
let outageStart = new Date(0);
let closedOutageStart = new Date(0);

function cookiePair(response: Response) {
	return (response.headers.getSetCookie()[0] ?? "").split(";", 1)[0] ?? "";
}

async function rpcRaw(cookie?: string, body: unknown = {}): Promise<Response> {
	return fetch(`${baseUrl}/rpc/admin/health/summary`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...(cookie ? { Cookie: cookie } : {}),
		},
		body: JSON.stringify({ json: body }),
	});
}

async function summary(): Promise<SummaryPayload> {
	const response = await rpcRaw(ownerCookie);
	expect(response.status).toBe(200);
	return ((await response.json()) as { json: SummaryPayload }).json;
}

async function logSnapshot() {
	const [alerts, transitions] = await Promise.all([
		database.select().from(alertLog).orderBy(asc(alertLog.id)),
		database.select().from(edgeHealthLog).orderBy(asc(edgeHealthLog.id)),
	]);
	return JSON.stringify({ alerts, transitions });
}

/** The gym-local weekday key of an instant, as the stored schedule names them. */
function weekdayOf(instant: Date): (typeof WEEKDAYS)[number] {
	const short = new Intl.DateTimeFormat("en-US", {
		timeZone: GYM_TIME_ZONE,
		weekday: "short",
	}).format(instant);
	const key = short.slice(0, 3).toLowerCase();
	const match = WEEKDAYS.find((day) => day === key);
	if (!match) throw new Error(`Unresolved weekday ${short}`);
	return match;
}

async function setLastPush(at: Date, settingsVersion: number) {
	await database
		.update(currentState)
		.set({
			currentCount: 12,
			band: "quiet",
			source: "edge",
			lastPushReceivedAt: at,
			lastEdgeReportedAt: at,
			activeDeviceId: deviceId,
			settingsVersion,
		})
		.where(eq(currentState.id, 1));
}

beforeAll(async () => {
	const { createApp } = await import("./index");
	const { createAlertRepository } = await import("./alert-repository");
	await database.execute("drop schema if exists drizzle cascade");
	await database.execute("drop schema if exists public cascade");
	await database.execute("create schema public");
	await migrate(database, {
		migrationsFolder: path.resolve("packages/db/src/migrations"),
	});
	await database.delete(settingsVersions);

	const now = new Date();
	// The outage the owner was exposed to sits well inside today's window; the
	// suppressed one sits three days back, on a weekday the gym does not open. Two
	// consecutive closed weekdays keep a short span closed even across local midnight.
	outageStart = new Date(now.getTime() - 90 * MINUTE);
	closedOutageStart = new Date(now.getTime() - 3 * DAY);
	const closedDays = new Set([
		weekdayOf(closedOutageStart),
		weekdayOf(new Date(closedOutageStart.getTime() + DAY)),
	]);
	const schedule = Object.fromEntries(
		WEEKDAYS.flatMap((day) => {
			const capitalized = `${day[0]?.toUpperCase()}${day.slice(1)}`;
			const closed = closedDays.has(day);
			return [
				[`schedule${capitalized}Open`, closed ? null : "00:00"],
				[`schedule${capitalized}Close`, closed ? null : "00:00"],
			];
		}),
	);

	const [settings] = await database
		.insert(settingsVersions)
		.values({
			capacity: 100,
			quietMaxPercent: 25,
			moderateMaxPercent: 50,
			busyMaxPercent: 75,
			timezone: GYM_TIME_ZONE,
			businessDayBoundary: "04:00",
			operationalStaleAfterSeconds: 300,
			effectiveFrom: new Date(now.getTime() - 60 * DAY),
			...schedule,
		})
		.returning({ version: settingsVersions.version });
	if (!settings) throw new Error("Settings fixture was not created");

	const [device] = await database
		.insert(edgeDevices)
		.values({ name: "phase11-health", tokenHash: "d".repeat(64) })
		.returning({ id: edgeDevices.id });
	if (!device) throw new Error("Device fixture was not created");
	deviceId = device.id;

	// A closed-weekday outage, placed before the writer runs so the writer sees a
	// coherent prior connection state.
	await database.insert(edgeHealthLog).values([
		{ deviceId, transitionType: "offline", occurredAt: closedOutageStart },
		{
			deviceId,
			transitionType: "online",
			occurredAt: new Date(closedOutageStart.getTime() + 30 * MINUTE),
		},
	]);

	const alerts = createAlertRepository(
		database as unknown as typeof import("@fitway/db").db,
	);
	const delivering: AlertNotifier = async () => {};
	const refusing: AlertNotifier = async () => {
		throw new Error("Telegram transport refused the notice");
	};

	// The edge has been silent for two hours: one stale-push condition begins.
	await setLastPush(
		new Date(outageStart.getTime() - 2 * HOUR),
		settings.version,
	);
	await alerts.evaluateAndNotify({
		now: outageStart,
		preOpenWindowMs: PRE_OPEN_MS,
		reAlertIntervalMs: RE_ALERT_MS,
		notifier: delivering,
	});
	// Still unresolved one re-alert interval later, and this send does not land.
	await alerts.evaluateAndNotify({
		now: new Date(outageStart.getTime() + RE_ALERT_MS + MINUTE),
		preOpenWindowMs: PRE_OPEN_MS,
		reAlertIntervalMs: RE_ALERT_MS,
		notifier: refusing,
	});
	// A fresh push arrives; the same condition recovers.
	const recoveredAt = new Date(outageStart.getTime() + 50 * MINUTE);
	await setLastPush(recoveredAt, settings.version);
	await alerts.evaluateAndNotify({
		now: recoveredAt,
		preOpenWindowMs: PRE_OPEN_MS,
		reAlertIntervalMs: RE_ALERT_MS,
		notifier: delivering,
	});

	const ownerPassword = randomBytes(18).toString("base64url");
	ownerEmail = `phase11-health-${randomUUID()}@fitway.example`;
	await authService.provisionOwner({
		email: ownerEmail,
		displayName: "Real owner",
		password: ownerPassword,
	});
	const staffPin = `${randomInt(0, 1_000_000)}`.padStart(6, "0");
	await authService.setSharedStaffPin(staffPin);

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
}, 60_000);

afterAll(async () => {
	await new Promise<void>((resolve, reject) =>
		server.close((error) => (error ? reject(error) : resolve())),
	);
	await pool.end();
});

describe.sequential("Phase 11 owner health and uptime transport", () => {
	it("answers 401 without a session and 403 for staff", async () => {
		expect((await rpcRaw()).status).toBe(401);
		expect((await rpcRaw("fitway_session=expired.invalid")).status).toBe(401);
		expect((await rpcRaw(staffCookie)).status).toBe(403);
		expect((await rpcRaw(ownerCookie)).status).toBe(200);
	});

	it("persisted two rows per notice, which is the shape the reader must survive", async () => {
		const rows = await database
			.select()
			.from(alertLog)
			.orderBy(asc(alertLog.sentAt), asc(alertLog.id));
		// Two alert notices and one recovery, each written twice.
		expect(rows).toHaveLength(6);
		expect(rows.map((row) => row.deliveryOutcome)).toEqual([
			"claimed",
			"delivered",
			"claimed",
			"failed",
			"claimed",
			"delivered",
		]);
		// One condition start carried across every notice, recovery included.
		const starts = new Set(
			rows.map((row) => row.conditionStartedAt.toISOString()),
		);
		expect(starts.size).toBe(1);
		expect(rows.filter((row) => row.noticeKind === "recovery")).toHaveLength(2);
		expect(
			rows
				.filter((row) => row.noticeKind === "recovery")
				.every((row) => row.recoveryOfAlertId !== null),
		).toBe(true);
	});

	it("reports one incident for those six rows, with two notices and a recovery", async () => {
		const payload = await summary();
		expect(payload.alerts.incidentCount).toBe(1);
		const incident = payload.alerts.incidents[0];
		expect(incident?.condition).toBe("stale_push");
		expect(incident?.noticeCount).toBe(2);
		expect(incident?.delivered).toBe(1);
		expect(incident?.failed).toBe(1);
		expect(incident?.unconfirmed).toBe(0);
		expect(incident?.recoveredAtUtc).not.toBeNull();
		expect(Date.parse(incident?.recoveredAtUtc ?? "")).toBeGreaterThan(
			Date.parse(incident?.startedAtUtc ?? ""),
		);

		// The transport figure covers every notice, the recovery send included, and
		// its three outcomes sum to it.
		expect(payload.alerts.noticeCount).toBe(3);
		expect(payload.alerts.delivered).toBe(2);
		expect(payload.alerts.failed).toBe(1);
		expect(payload.alerts.unconfirmed).toBe(0);
	});

	it("states both denominators and never presents uptime over an implied whole", async () => {
		const payload = await summary();
		const { connection } = payload;
		expect(connection.expectedOpenMinutes).toBeGreaterThan(0);
		expect(connection.monitoredOpenMinutes).toBeLessThanOrEqual(
			connection.expectedOpenMinutes,
		);
		expect(connection.onlineOpenMinutes + connection.offlineOpenMinutes).toBe(
			connection.monitoredOpenMinutes,
		);
		expect(connection.uptimeRatio).toBeCloseTo(
			connection.onlineOpenMinutes / connection.monitoredOpenMinutes,
			10,
		);
		expect(connection.monitoredRatio).toBeCloseTo(
			connection.monitoredOpenMinutes / connection.expectedOpenMinutes,
			10,
		);
		// Monitoring only began with the seeded closed-day transition, so coverage of
		// the fourteen-day window is far from complete and the payload says so.
		expect(connection.monitoringStartedAtUtc).toBe(
			closedOutageStart.toISOString(),
		);
		expect(connection.monitoredRatio ?? 1).toBeLessThan(1);
		expect(payload.window.businessDays).toBe(14);
		expect(payload.window.timeZone).toBe(GYM_TIME_ZONE);
	});

	it("charges the open-hours outage to uptime and the closed-hours one to nothing", async () => {
		const payload = await summary();
		expect(payload.connection.offlinePeriodCount).toBe(2);
		const [recent, suppressed] = payload.connection.offlinePeriods;
		expect(recent?.startedAtUtc).toBe(outageStart.toISOString());
		expect(recent?.elapsedMinutes).toBe(50);
		expect(recent?.openMinutes).toBe(50);

		expect(suppressed?.startedAtUtc).toBe(closedOutageStart.toISOString());
		expect(suppressed?.elapsedMinutes).toBe(30);
		// The gym does not open on that weekday, so no visit was affected and the
		// alert policy suppressed any notice. It is not folded into uptime.
		expect(suppressed?.openMinutes).toBe(0);
		expect(payload.connection.offlineOpenMinutes).toBe(50);

		// And it raised no incident: a suppressed condition writes no alert row.
		expect(
			payload.alerts.incidents.some(
				(incident) =>
					Date.parse(incident.startedAtUtc) <
					closedOutageStart.getTime() + HOUR,
			),
		).toBe(false);
	});

	it("mutates neither append-only log, however often it is read", async () => {
		const before = await logSnapshot();
		await summary();
		await summary();
		await summary();
		expect(await logSnapshot()).toBe(before);
	});

	it("ignores a request body rather than letting a client widen the window", async () => {
		const wide = await rpcRaw(ownerCookie, {
			businessDays: 3650,
			deviceId,
			limit: 10_000,
		});
		expect(wide.status).toBe(200);
		const payload = ((await wide.json()) as { json: SummaryPayload }).json;
		expect(payload.window.businessDays).toBe(14);
		expect(payload.connection.offlinePeriods.length).toBeLessThanOrEqual(20);
		expect(payload.alerts.incidents.length).toBeLessThanOrEqual(20);
	});

	it("emits an exact non-sensitive shape with no device or per-visitor datum", async () => {
		const response = await rpcRaw(ownerCookie);
		const text = await response.text();
		const payload = (JSON.parse(text) as { json: SummaryPayload }).json;

		expect(Object.keys(payload).sort()).toEqual([
			"alerts",
			"connection",
			"window",
		]);
		expect(Object.keys(payload.window).sort()).toEqual([
			"businessDayFrom",
			"businessDayTo",
			"businessDays",
			"generatedAtUtc",
			"timeZone",
		]);
		for (const period of payload.connection.offlinePeriods) {
			expect(Object.keys(period).sort()).toEqual([
				"elapsedMinutes",
				"endedAtUtc",
				"openMinutes",
				"startedAtUtc",
			]);
		}
		for (const incident of payload.alerts.incidents) {
			expect(Object.keys(incident).sort()).toEqual([
				"condition",
				"delivered",
				"failed",
				"lastNoticeAtUtc",
				"noticeCount",
				"recoveredAtUtc",
				"startedAtUtc",
				"unconfirmed",
			]);
		}

		expect(text).not.toContain(deviceId);
		expect(text).not.toMatch(/deviceId|device_id|tokenHash|token_hash/i);
		expect(text).not.toMatch(/frame|image|camera_url|snapshot|visitor/i);
		expect(text).not.toContain(ownerEmail);
		expect(text).not.toMatch(/@/);
		expect(text).not.toMatch(/sessionId|session_id|credential|pinHash/i);
		expect(text).not.toMatch(/currentCount|current_count|occupancy/i);
	});

	it("answers inside a request budget without any new index", async () => {
		const started = performance.now();
		for (let attempt = 0; attempt < 3; attempt += 1) await summary();
		const perCall = (performance.now() - started) / 3;
		// Measured evidence that the fourteen-day scan and the two ordered
		// change-log reads do not need an index added to a frozen Phase 8 table.
		expect(perCall).toBeLessThan(400);
	});
});
