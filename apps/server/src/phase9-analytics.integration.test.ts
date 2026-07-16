import path from "node:path";
import { generateDeterministicAnalyticsHistory } from "@fitway/api/analytics/history-generator";
import * as applicationSchema from "@fitway/db/schema/application";
import {
	edgeDevices,
	occupancyMinutes,
	settingsVersions,
} from "@fitway/db/schema/application";
import * as authSchema from "@fitway/db/schema/auth";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createAnalyticsRepository } from "./analytics-repository";
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
const repository = createAnalyticsRepository(
	database as typeof import("@fitway/db").db,
);
let deviceId = "";

const analyticsSchedule = {
	scheduleSunOpen: null,
	scheduleSunClose: null,
	scheduleMonOpen: null,
	scheduleMonClose: null,
	scheduleTueOpen: null,
	scheduleTueClose: null,
	scheduleWedOpen: "00:00",
	scheduleWedClose: "00:00",
	scheduleThuOpen: "00:00",
	scheduleThuClose: "00:00",
	scheduleFriOpen: "14:00",
	scheduleFriClose: "00:00",
	scheduleSatOpen: null,
	scheduleSatClose: null,
} as const;

beforeAll(async () => {
	await database.execute("drop schema if exists drizzle cascade");
	await database.execute("drop schema if exists public cascade");
	await database.execute("create schema public");
	await migrate(database, {
		migrationsFolder: path.resolve("packages/db/src/migrations"),
	});
	await database.delete(settingsVersions);
	const [device] = await database
		.insert(edgeDevices)
		.values({
			name: "phase-9-analytics",
			tokenHash: "a".repeat(64),
		})
		.returning({ id: edgeDevices.id });
	if (!device) throw new Error("Analytics integration device was not created");
	deviceId = device.id;
}, 30_000);

afterAll(async () => pool.end());

describe("Phase 9 analytics repository", () => {
	it("reads historical snapshots and leaves them unchanged after later settings", async () => {
		const [historical] = await database
			.insert(settingsVersions)
			.values({
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
				effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
				...analyticsSchedule,
			})
			.returning({ version: settingsVersions.version });
		if (!historical) throw new Error("Historical settings were not created");
		const generatedHistory = generateDeterministicAnalyticsHistory({
			startUtc: new Date("2026-07-15T01:00:00.000Z"),
			days: 2,
			seed: 17,
			omitEveryNthOpenMinute: 10,
			settings: {
				version: historical.version,
				effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
				timeZone: "Asia/Riyadh",
				businessDayBoundary: "04:00",
				weeklySchedule: {
					sun: null,
					mon: null,
					tue: null,
					wed: { open: "00:00", close: "00:00" },
					thu: { open: "00:00", close: "00:00" },
					fri: { open: "14:00", close: "00:00" },
					sat: null,
				},
				capacity: 100,
				quietMaxPercent: 25,
				moderateMaxPercent: 50,
				busyMaxPercent: 75,
			},
		});
		await database.insert(occupancyMinutes).values(
			generatedHistory.map((row) => ({
				...row,
				deviceId,
			})),
		);
		await database.insert(occupancyMinutes).values([
			{
				deviceId,
				minuteStartUtc: new Date("2026-07-17T10:59:00.000Z"),
				businessDay: "2026-07-17",
				count: 99,
				entries: 9,
				exits: 0,
				band: "packed",
				capacitySnapshot: 70,
				settingsVersion: historical.version,
				source: "live",
			},
			{
				deviceId,
				minuteStartUtc: new Date("2026-07-17T11:00:00.000Z"),
				businessDay: "2026-07-17",
				count: 0,
				entries: 1,
				exits: 0,
				band: "busy",
				capacitySnapshot: 70,
				settingsVersion: historical.version,
				source: "live",
			},
			{
				deviceId,
				minuteStartUtc: new Date("2026-07-17T11:02:00.000Z"),
				businessDay: "2026-07-17",
				count: 12,
				entries: 2,
				exits: 1,
				band: "moderate",
				capacitySnapshot: 70,
				settingsVersion: historical.version,
				source: "live",
			},
		]);
		const generatedDay = await repository.readDailyAnalytics("2026-07-16");
		expect(generatedDay).toMatchObject({
			observedOpenMinutes: 1_080,
			expectedOpenMinutes: 1_200,
			coverage: 0.9,
		});

		const before = await repository.readDailyAnalytics("2026-07-17");
		expect(before).toMatchObject({
			dailyAverage: 6,
			estimatedEntranceCrossings: 12,
			observedOpenMinutes: 2,
			expectedOpenMinutes: 600,
			coverage: 2 / 600,
			peak: {
				count: 12,
				band: "moderate",
				capacitySnapshot: 70,
				settingsVersion: historical.version,
			},
		});
		expect(
			before.timeline.find(
				(bucket) => bucket.minuteStartUtc === "2026-07-17T11:00:00.000Z",
			),
		).toMatchObject({
			state: "value",
			count: 0,
			band: "busy",
			capacitySnapshot: 70,
			settingsVersion: historical.version,
		});
		expect(
			before.timeline.find(
				(bucket) => bucket.minuteStartUtc === "2026-07-17T11:01:00.000Z",
			),
		).toMatchObject({ state: "missing", count: null });

		await database.insert(settingsVersions).values({
			capacity: 250,
			quietMaxPercent: 10,
			moderateMaxPercent: 40,
			busyMaxPercent: 90,
			timezone: "UTC",
			businessDayBoundary: "00:00",
			pushIntervalSeconds: 20,
			freshForSeconds: 90,
			operationalStaleAfterSeconds: 180,
			publicPollSeconds: 60,
			effectiveFrom: new Date("2026-07-18T02:00:00.000Z"),
			...analyticsSchedule,
		});
		expect(await repository.readDailyAnalytics("2026-07-17")).toEqual(before);
	}, 20_000);
});
