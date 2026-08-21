/**
 * Phase 10 owner reporting reads over the real oRPC transport, real authentication, and
 * disposable Postgres.
 *
 * The three leaves this slice exposes — `admin.analytics.{range, heatmap, weekOverWeek}`
 * — sit in front of repository methods the domain slice already shipped. What is not
 * proven anywhere else is what happens on the wire: who is refused, which malformed
 * window is a 400 rather than a 500, whether the aggregate that reaches a client still
 * keeps closed, missing, and a genuine zero apart, and whether a client can widen a
 * window the server is supposed to own.
 *
 * The comparison fixture is seeded from the window the server itself reports rather than
 * from a window this test computes. Re-deriving "the last two comparable weeks" here
 * would only prove that the test agrees with its own author; asking the payload where
 * its weeks are and then filling exactly those days proves the reader and the writer
 * agree about the same days.
 */
import { randomBytes, randomInt, randomUUID } from "node:crypto";
import path from "node:path";
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

const GYM_TIME_ZONE = "Asia/Riyadh";
/**
 * The gym opens for exactly three minutes a day, at the business-day boundary itself.
 *
 * That makes every expectation in this file countable by hand: business day `D` runs
 * from local `D 04:00` to `D+1 04:00`, so its only open minutes are `D 01:00Z`,
 * `D 01:01Z`, and `D 01:02Z` at +03:00, and every other minute of the day is closed.
 */
const OPEN_SCHEDULE = Object.fromEntries(
	["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].flatMap((day) => [
		[`schedule${day}Open`, "04:00"],
		[`schedule${day}Close`, "04:03"],
	]),
) as Record<string, string>;

/** A historical window, seven days long, one occurrence of every weekday. */
const HISTORY_START = "2026-08-10";
const HISTORY_END = "2026-08-16";
const historyRange = {
	startBusinessDay: HISTORY_START,
	endBusinessDay: HISTORY_END,
} as const;

const privateDeviceName = "phase10-ui-private-device-name";
const privateTokenHash = "e".repeat(64);

type MinuteState = "value" | "closed" | "missing";

type RangeMinute = {
	businessDay: string;
	weekday: string;
	minuteStartUtc: string;
	minuteStartLocal: string;
	timeZone: string;
	state: MinuteState;
	count: number | null;
	capacitySnapshot?: number;
	settingsVersion: number;
	band?: string;
	entries?: number;
	exits?: number;
	source?: string;
};

type RangePayload = {
	startBusinessDay: string;
	endBusinessDay: string;
	days: Array<{
		businessDay: string;
		weekday: string;
		timeline: RangeMinute[];
		peak: { count: number; capacitySnapshot: number } | null;
		dailyAverage: number | null;
		estimatedEntranceCrossings: number;
		observedOpenMinutes: number;
		expectedOpenMinutes: number;
		coverage: number | null;
	}>;
	averageOccupancy: number | null;
	estimatedEntranceCrossings: number;
	observedOpenMinutes: number;
	expectedOpenMinutes: number;
	coverage: number | null;
};

type HeatmapCell = {
	weekday: string;
	localHour: number;
	state: MinuteState;
	averageOccupancy: number | null;
	observedOpenMinutes: number;
	expectedOpenMinutes: number;
	sampleDayCount: number;
};

type HeatmapPayload = {
	startBusinessDay: string;
	endBusinessDay: string;
	cells: HeatmapCell[];
};

type WeekMetrics = {
	startBusinessDay: string;
	endBusinessDay: string;
	averageOccupancy: number | null;
	estimatedEntranceCrossings: number;
	observedOpenMinutes: number;
	expectedOpenMinutes: number;
	coverage: number | null;
};

type ComparisonPayload = {
	state: "comparable" | "insufficient_history";
	minimumCoverage: number;
	currentWeek: WeekMetrics;
	priorWeek: WeekMetrics;
	reasons?: string[];
	changes?: {
		averageOccupancy: { absolute: number; percent: number | null };
		estimatedEntranceCrossings: { absolute: number; percent: number | null };
	};
};

let server: ReturnType<typeof serve>;
let baseUrl = "";
let staffCookie = "";
let ownerCookie = "";
let ownerEmail = "";
let deviceId = "";
let historicalSettingsVersion = 0;

function cookiePair(response: Response) {
	return (response.headers.getSetCookie()[0] ?? "").split(";", 1)[0] ?? "";
}

function rpc(leaf: string, input: unknown, cookie?: string) {
	return fetch(`${baseUrl}/rpc/admin/analytics/${leaf}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...(cookie ? { Cookie: cookie } : {}),
		},
		body: JSON.stringify({ json: input }),
	});
}

async function ownerJson<T>(leaf: string, input: unknown = {}): Promise<T> {
	const response = await rpc(leaf, input, ownerCookie);
	expect(response.status).toBe(200);
	return ((await response.json()) as { json: T }).json;
}

/** The UTC instant of gym-local `businessDay 04:0Xm` at a fixed +03:00 offset. */
function openMinute(businessDay: string, minute: number): Date {
	return new Date(Date.parse(`${businessDay}T01:00:00.000Z`) + minute * 60_000);
}

function businessDaysBetween(start: string, end: string): string[] {
	const days: string[] = [];
	for (
		let instant = Date.parse(`${start}T00:00:00.000Z`);
		instant <= Date.parse(`${end}T00:00:00.000Z`);
		instant += 86_400_000
	) {
		days.push(new Date(instant).toISOString().slice(0, 10));
	}
	return days;
}

async function seedOpenDay(
	businessDay: string,
	minutes: Array<{ count: number; entries: number } | null>,
) {
	const rows = minutes.flatMap((minute, index) =>
		minute === null
			? []
			: [
					{
						deviceId,
						minuteStartUtc: openMinute(businessDay, index),
						businessDay,
						count: minute.count,
						entries: minute.entries,
						exits: 0,
						band: "quiet" as const,
						// A snapshot deliberately unequal to the current capacity below.
						capacitySnapshot: 80,
						settingsVersion: historicalSettingsVersion,
						source: "live" as const,
					},
				],
	);
	if (rows.length > 0) await database.insert(occupancyMinutes).values(rows);
}

beforeAll(async () => {
	await database.execute("drop schema if exists drizzle cascade");
	await database.execute("drop schema if exists public cascade");
	await database.execute("create schema public");
	await migrate(database, {
		migrationsFolder: path.resolve("packages/db/src/migrations"),
	});
	await database.delete(settingsVersions);

	const [historical] = await database
		.insert(settingsVersions)
		.values({
			capacity: 80,
			quietMaxPercent: 25,
			moderateMaxPercent: 50,
			busyMaxPercent: 75,
			timezone: GYM_TIME_ZONE,
			businessDayBoundary: "04:00",
			effectiveFrom: new Date("2025-01-01T00:00:00.000Z"),
			...OPEN_SCHEDULE,
		})
		.returning({ version: settingsVersions.version });
	if (!historical) throw new Error("Historical settings were not created");
	historicalSettingsVersion = historical.version;

	const [device] = await database
		.insert(edgeDevices)
		.values({ name: privateDeviceName, tokenHash: privateTokenHash })
		.returning({ id: edgeDevices.id });
	if (!device) throw new Error("Device fixture was not created");
	deviceId = device.id;

	// Monday: one observed zero, one gap, one observed reading.
	await seedOpenDay(HISTORY_START, [
		{ count: 0, entries: 0 },
		null,
		{ count: 17, entries: 4 },
	]);
	// Tuesday: fully observed, and genuinely empty for every minute of it.
	await seedOpenDay("2026-08-11", [
		{ count: 0, entries: 0 },
		{ count: 0, entries: 0 },
		{ count: 0, entries: 0 },
	]);
	// Wednesday through Sunday are left unrecorded on purpose.

	const staffPin = `${randomInt(0, 1_000_000)}`.padStart(6, "0");
	await authService.setSharedStaffPin(staffPin);
	const ownerPassword = randomBytes(18).toString("base64url");
	ownerEmail = `phase10-ui-${randomUUID()}@fitway.example`;
	await authService.provisionOwner({
		email: ownerEmail,
		displayName: "Phase 10 reporting owner",
		password: ownerPassword,
	});

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

describe.sequential("Phase 10 owner reporting transport", () => {
	it("refuses every leaf without an owner session", async () => {
		for (const [leaf, input] of [
			["range", historyRange],
			["heatmap", historyRange],
			["weekOverWeek", {}],
		] as const) {
			expect((await rpc(leaf, input)).status).toBe(401);
			expect(
				(await rpc(leaf, input, "fitway_session=expired.invalid")).status,
			).toBe(401);
			expect((await rpc(leaf, input, staffCookie)).status).toBe(403);
			expect((await rpc(leaf, input, ownerCookie)).status).toBe(200);
		}
	}, 120_000);

	it("answers 400, never 500, for every unusable window", async () => {
		for (const invalid of [
			// Unordered.
			{ startBusinessDay: "2026-08-16", endBusinessDay: "2026-08-10" },
			// Not a real calendar day.
			{ startBusinessDay: "2026-02-30", endBusinessDay: "2026-03-02" },
			// A key the frozen contract does not carry.
			{ ...historyRange, extra: true },
			// Thirty-two inclusive days: one past the bound these two leaves accept.
			{ startBusinessDay: "2026-07-16", endBusinessDay: "2026-08-16" },
		]) {
			for (const leaf of ["range", "heatmap"] as const) {
				const response = await rpc(leaf, invalid, ownerCookie);
				expect(response.status).toBe(400);
				expect(response.headers.get("content-type")).toContain(
					"application/json",
				);
			}
		}

		// And the bound is inclusive: thirty-one days is accepted.
		expect(
			(
				await rpc(
					"heatmap",
					{ startBusinessDay: "2026-07-17", endBusinessDay: "2026-08-16" },
					ownerCookie,
				)
			).status,
		).toBe(200);
	}, 120_000);

	it("keeps closed, missing, and a genuine zero apart in the range timeline", async () => {
		const payload = await ownerJson<RangePayload>("range", historyRange);
		expect(payload.days).toHaveLength(7);

		const monday = payload.days[0];
		expect(monday?.businessDay).toBe(HISTORY_START);
		expect(monday?.weekday).toBe("mon");
		expect(monday?.timeline).toHaveLength(1440);

		const openMinutes = (monday?.timeline ?? []).filter(
			(minute) => minute.state !== "closed",
		);
		expect(openMinutes).toHaveLength(3);
		// Three different facts in three consecutive minutes.
		expect(openMinutes[0]).toMatchObject({ state: "value", count: 0 });
		expect(openMinutes[1]).toMatchObject({ state: "missing", count: null });
		expect(openMinutes[2]).toMatchObject({ state: "value", count: 17 });
		expect(monday?.observedOpenMinutes).toBe(2);
		expect(monday?.expectedOpenMinutes).toBe(3);
		expect(monday?.dailyAverage).toBeCloseTo(8.5, 10);

		// A closed minute is not a zero, and carries no reading to mistake for one.
		const closed = (monday?.timeline ?? []).find(
			(minute) => minute.state === "closed",
		);
		expect(closed?.count).toBeNull();
		expect(closed?.minuteStartLocal.slice(0, 10)).toBe(HISTORY_START);
		expect(closed?.timeZone).toBe(GYM_TIME_ZONE);

		// Wednesday was never recorded at all: three missing minutes, no coverage.
		const wednesday = payload.days[2];
		expect(wednesday?.weekday).toBe("wed");
		expect(wednesday?.observedOpenMinutes).toBe(0);
		expect(wednesday?.expectedOpenMinutes).toBe(3);
		expect(wednesday?.coverage).toBe(0);
		expect(wednesday?.dailyAverage).toBeNull();
	}, 120_000);

	it("reads capacity from the row snapshot rather than from current settings", async () => {
		// Current settings say 250; the rows were written when capacity was 80.
		await database.insert(settingsVersions).values({
			capacity: 250,
			quietMaxPercent: 10,
			moderateMaxPercent: 40,
			busyMaxPercent: 90,
			timezone: GYM_TIME_ZONE,
			businessDayBoundary: "04:00",
			effectiveFrom: new Date("2026-08-17T00:00:00.000Z"),
			...OPEN_SCHEDULE,
		});

		const payload = await ownerJson<RangePayload>("range", historyRange);
		const observed = (payload.days[0]?.timeline ?? []).filter(
			(minute) => minute.state === "value",
		);
		expect(observed).toHaveLength(2);
		for (const minute of observed) {
			expect(minute.capacitySnapshot).toBe(80);
			expect(minute.settingsVersion).toBe(historicalSettingsVersion);
		}
		expect(payload.days[0]?.peak?.capacitySnapshot).toBe(80);
	}, 120_000);

	it("aggregates the heatmap by weekday and gym-local hour, states intact", async () => {
		const payload = await ownerJson<HeatmapPayload>("heatmap", historyRange);
		expect(payload.cells).toHaveLength(7 * 24);

		const cell = (weekday: string, localHour: number) =>
			payload.cells.find(
				(candidate) =>
					candidate.weekday === weekday && candidate.localHour === localHour,
			);

		// The gym is open in local hour 4, never in local hour 3 — and the local hour
		// is the gym's, not the machine's.
		const monday = cell("mon", 4);
		expect(monday).toMatchObject({
			state: "value",
			observedOpenMinutes: 2,
			expectedOpenMinutes: 3,
			sampleDayCount: 1,
		});
		expect(monday?.averageOccupancy).toBeCloseTo(8.5, 10);

		// Open, fully observed, and genuinely empty. This is a measurement, and it is
		// not the same cell state as either absent kind.
		expect(cell("tue", 4)).toMatchObject({
			state: "value",
			averageOccupancy: 0,
			observedOpenMinutes: 3,
			expectedOpenMinutes: 3,
			sampleDayCount: 1,
		});

		// Scheduled open, never recorded: missing, with no average at all.
		expect(cell("wed", 4)).toMatchObject({
			state: "missing",
			averageOccupancy: null,
			observedOpenMinutes: 0,
			expectedOpenMinutes: 3,
			sampleDayCount: 0,
		});

		// Never open: closed, and distinct from both of the above.
		expect(cell("mon", 3)).toMatchObject({
			state: "closed",
			averageOccupancy: null,
			expectedOpenMinutes: 0,
		});
		expect(
			payload.cells.filter((candidate) => candidate.state === "closed"),
		).toHaveLength(7 * 23);
	}, 120_000);

	it("exposes no device, account, or per-visitor datum on any leaf", async () => {
		for (const [leaf, input] of [
			["range", historyRange],
			["heatmap", historyRange],
			["weekOverWeek", {}],
		] as const) {
			const text = await (await rpc(leaf, input, ownerCookie)).text();
			expect(text).not.toContain(deviceId);
			expect(text).not.toContain(privateDeviceName);
			expect(text).not.toContain(privateTokenHash);
			expect(text).not.toContain(ownerEmail);
			expect(text).not.toMatch(/deviceId|device_id|tokenHash|token_hash/i);
			expect(text).not.toMatch(/frame|image|camera|snapshot_url|visitor/i);
			expect(text).not.toMatch(/sessionId|session_id|credential|pinHash/i);
		}
	}, 120_000);

	it("shows the honest empty comparison while neither week is comparable", async () => {
		const payload = await ownerJson<ComparisonPayload>("weekOverWeek");
		expect(payload.state).toBe("insufficient_history");
		// The reasons are typed and named, not a generic "not enough data".
		expect(payload.reasons?.length ?? 0).toBeGreaterThan(0);
		for (const reason of payload.reasons ?? []) {
			expect([
				"current_week_no_expected_open_minutes",
				"current_week_coverage_below_minimum",
				"prior_week_no_expected_open_minutes",
				"prior_week_coverage_below_minimum",
			]).toContain(reason);
		}
		// No direction is stated, not even a zero one.
		expect(payload).not.toHaveProperty("changes");
		expect(payload.minimumCoverage).toBeGreaterThan(0);
		expect(
			payload.currentWeek.startBusinessDay <=
				payload.currentWeek.endBusinessDay,
		).toBe(true);
		expect(
			payload.priorWeek.endBusinessDay < payload.currentWeek.startBusinessDay,
		).toBe(true);
	}, 120_000);

	it("states a direction once both weeks are observed, over the server's own window", async () => {
		const before = await ownerJson<ComparisonPayload>("weekOverWeek");
		// The historical assertions above are complete; this fixture owns the table
		// from here so the two weeks can be filled exactly.
		await database.delete(occupancyMinutes);
		for (const businessDay of businessDaysBetween(
			before.priorWeek.startBusinessDay,
			before.priorWeek.endBusinessDay,
		)) {
			await seedOpenDay(businessDay, [
				{ count: 10, entries: 2 },
				{ count: 10, entries: 2 },
				{ count: 10, entries: 2 },
			]);
		}
		for (const businessDay of businessDaysBetween(
			before.currentWeek.startBusinessDay,
			before.currentWeek.endBusinessDay,
		)) {
			await seedOpenDay(businessDay, [
				{ count: 20, entries: 4 },
				{ count: 20, entries: 4 },
				{ count: 20, entries: 4 },
			]);
		}

		const payload = await ownerJson<ComparisonPayload>("weekOverWeek");
		expect(payload.state).toBe("comparable");
		expect(payload.reasons).toBeUndefined();
		expect(payload.currentWeek.coverage).toBe(1);
		expect(payload.priorWeek.coverage).toBe(1);
		expect(payload.currentWeek.averageOccupancy).toBeCloseTo(20, 10);
		expect(payload.priorWeek.averageOccupancy).toBeCloseTo(10, 10);
		// `percent` is a ratio in the frozen contract, so doubling is `1`, not `100`.
		expect(payload.changes?.averageOccupancy).toMatchObject({
			absolute: 10,
			percent: 1,
		});
		expect(
			payload.changes?.estimatedEntranceCrossings.absolute,
		).toBeGreaterThan(0);
	}, 120_000);

	it("resolves the comparison window server-side, whatever a client sends", async () => {
		const server = await ownerJson<ComparisonPayload>("weekOverWeek");
		const widened = await ownerJson<ComparisonPayload>("weekOverWeek", {
			at: "2020-01-01T00:00:00.000Z",
			minimumCoverage: 0,
			startBusinessDay: "2020-01-01",
			endBusinessDay: "2026-12-31",
		});
		// Which weeks are compared, and the bar a week must clear to be compared, are
		// product decisions. A client that could move either could manufacture a
		// direction out of a week the domain refuses to compare.
		expect(widened.currentWeek).toEqual(server.currentWeek);
		expect(widened.priorWeek).toEqual(server.priorWeek);
		expect(widened.minimumCoverage).toBe(server.minimumCoverage);
		expect(widened.state).toBe(server.state);
	}, 120_000);

	it("writes nothing, however often it is read", async () => {
		const snapshot = async () =>
			JSON.stringify(
				await database
					.select()
					.from(occupancyMinutes)
					.orderBy(occupancyMinutes.minuteStartUtc),
			);
		const before = await snapshot();
		await ownerJson<HeatmapPayload>("heatmap", historyRange);
		await ownerJson<RangePayload>("range", historyRange);
		await ownerJson<ComparisonPayload>("weekOverWeek");
		expect(await snapshot()).toBe(before);
	}, 120_000);
});
