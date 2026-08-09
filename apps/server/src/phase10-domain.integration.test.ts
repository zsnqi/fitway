import path from "node:path";
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
import { createReportingRepository } from "./reporting-repository";
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
const repository = createReportingRepository(
	database as typeof import("@fitway/db").db,
);
let deviceId = "";

const oneMinuteDailySchedule = {
	scheduleSunOpen: "04:00",
	scheduleSunClose: "04:01",
	scheduleMonOpen: "04:00",
	scheduleMonClose: "04:01",
	scheduleTueOpen: "04:00",
	scheduleTueClose: "04:01",
	scheduleWedOpen: "04:00",
	scheduleWedClose: "04:01",
	scheduleThuOpen: "04:00",
	scheduleThuClose: "04:01",
	scheduleFriOpen: "04:00",
	scheduleFriClose: "04:01",
	scheduleSatOpen: "04:00",
	scheduleSatClose: "04:01",
} as const;

function businessDayAtOffset(start: string, offset: number): string {
	const day = new Date(`${start}T00:00:00.000Z`);
	day.setUTCDate(day.getUTCDate() + offset);
	return day.toISOString().slice(0, 10);
}

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
			name: "phase-10-reporting",
			tokenHash: "b".repeat(64),
		})
		.returning({ id: edgeDevices.id });
	if (!device) throw new Error("Phase 10 reporting device was not created");
	deviceId = device.id;
}, 30_000);

afterAll(async () => pool.end());

describe("Phase 10 reporting repository", () => {
	it("aggregates ranges, heatmap, weeks, and streamed CSV from historical snapshots", async () => {
		const [historical] = await database
			.insert(settingsVersions)
			.values({
				capacity: 80,
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
				...oneMinuteDailySchedule,
			})
			.returning({ version: settingsVersions.version });
		if (!historical) throw new Error("Historical settings were not created");

		const rows = Array.from({ length: 14 }, (_, index) => {
			const businessDay = businessDayAtOffset("2026-07-26", index);
			return {
				deviceId,
				minuteStartUtc: new Date(`${businessDay}T01:00:00.000Z`),
				businessDay,
				count: index < 7 ? 10 : 20,
				entries: index < 7 ? 1 : 2,
				exits: 0,
				band: index < 7 ? ("quiet" as const) : ("moderate" as const),
				capacitySnapshot: 80,
				settingsVersion: historical.version,
				source: "live" as const,
			};
		}).slice(0, 13);
		await database.insert(occupancyMinutes).values(rows);

		const snapshotBefore = await repository.readRange({
			startBusinessDay: "2026-08-01",
			endBusinessDay: "2026-08-01",
		});
		expect(snapshotBefore).toMatchObject({
			averageOccupancy: 10,
			estimatedEntranceCrossings: 1,
			observedOpenMinutes: 1,
			expectedOpenMinutes: 1,
			coverage: 1,
		});
		expect(snapshotBefore.days[0]?.peak).toMatchObject({
			count: 10,
			band: "quiet",
			capacitySnapshot: 80,
			settingsVersion: historical.version,
		});

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
			effectiveFrom: new Date("2026-08-10T00:00:00.000Z"),
			...oneMinuteDailySchedule,
		});
		expect(
			await repository.readRange({
				startBusinessDay: "2026-08-01",
				endBusinessDay: "2026-08-01",
			}),
		).toEqual(snapshotBefore);

		const heatmap = await repository.readHeatmap({
			startBusinessDay: "2026-08-01",
			endBusinessDay: "2026-08-01",
		});
		expect(
			heatmap.cells.find(
				(cell) => cell.weekday === "sat" && cell.localHour === 4,
			),
		).toMatchObject({
			state: "value",
			averageOccupancy: 10,
			observedOpenMinutes: 1,
			expectedOpenMinutes: 1,
			sampleDayCount: 1,
		});

		const comparison = await repository.readWeekOverWeek({
			at: new Date("2026-08-09T09:00:00.000Z"),
		});
		expect(comparison).toMatchObject({
			state: "comparable",
			minimumCoverage: 0.8,
			priorWeek: {
				startBusinessDay: "2026-07-26",
				endBusinessDay: "2026-08-01",
				averageOccupancy: 10,
				estimatedEntranceCrossings: 7,
				observedOpenMinutes: 7,
				expectedOpenMinutes: 7,
				coverage: 1,
			},
			currentWeek: {
				startBusinessDay: "2026-08-02",
				endBusinessDay: "2026-08-08",
				averageOccupancy: 20,
				estimatedEntranceCrossings: 12,
				observedOpenMinutes: 6,
				expectedOpenMinutes: 7,
				coverage: 6 / 7,
			},
		});

		const missing = await repository.readRange({
			startBusinessDay: "2026-08-08",
			endBusinessDay: "2026-08-08",
		});
		expect(
			missing.days[0]?.timeline.find(
				(minute) => minute.minuteStartUtc === "2026-08-08T01:00:00.000Z",
			),
		).toMatchObject({ state: "missing", count: null });
		expect(missing).toMatchObject({
			averageOccupancy: null,
			observedOpenMinutes: 0,
			expectedOpenMinutes: 1,
			coverage: 0,
		});

		let csv = "";
		for await (const chunk of repository.streamCsv({
			startBusinessDay: "2026-08-08",
			endBusinessDay: "2026-08-08",
		})) {
			csv += chunk;
		}
		expect(csv.startsWith("\uFEFFbusiness_day,")).toBe(true);
		expect(csv).toContain(
			"2026-08-08,2026-08-08T01:00:00.000Z,2026-08-08T04:00:00,Asia/Riyadh,missing,,,,,,,\r\n",
		);
		expect(csv).not.toMatch(/device_id|device name|token/i);

		const [secondDevice] = await database
			.insert(edgeDevices)
			.values({
				name: "phase-10-duplicate-proof",
				tokenHash: "c".repeat(64),
			})
			.returning({ id: edgeDevices.id });
		if (!secondDevice)
			throw new Error("Duplicate-proof device was not created");
		const duplicatedRow = rows[6];
		if (!duplicatedRow) throw new Error("Duplicate-proof minute is missing");
		await database.insert(occupancyMinutes).values({
			...duplicatedRow,
			deviceId: secondDevice.id,
		});
		await expect(
			repository.readRange({
				startBusinessDay: "2026-08-01",
				endBusinessDay: "2026-08-01",
			}),
		).rejects.toThrow("Multiple occupancy rows exist for reporting minute");
	}, 60_000);
});
