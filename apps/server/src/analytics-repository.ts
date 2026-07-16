import {
	type AnalyticsSettingsVersion,
	buildDailyAnalytics,
	type DailyAnalytics,
	type ObservedOccupancyMinute,
} from "@fitway/api/analytics/daily-analytics";
import type { db } from "@fitway/db";
import {
	occupancyMinutes,
	settingsVersions,
} from "@fitway/db/schema/application";
import { asc, eq } from "drizzle-orm";

type Database = typeof db;

function normalizeDatabaseTime(value: string): string {
	return value.length === 5 ? value : value.slice(0, 8);
}

function scheduleHours(open: string | null, close: string | null) {
	if (open === null && close === null) return null;
	if (open === null || close === null) {
		throw new Error("Stored analytics schedule has an incomplete weekday pair");
	}
	return {
		open: normalizeDatabaseTime(open),
		close: normalizeDatabaseTime(close),
	};
}

function mapSettings(
	row: typeof settingsVersions.$inferSelect,
): AnalyticsSettingsVersion {
	return {
		version: row.version,
		effectiveFrom: row.effectiveFrom,
		timeZone: row.timezone,
		businessDayBoundary: normalizeDatabaseTime(row.businessDayBoundary),
		weeklySchedule: {
			sun: scheduleHours(row.scheduleSunOpen, row.scheduleSunClose),
			mon: scheduleHours(row.scheduleMonOpen, row.scheduleMonClose),
			tue: scheduleHours(row.scheduleTueOpen, row.scheduleTueClose),
			wed: scheduleHours(row.scheduleWedOpen, row.scheduleWedClose),
			thu: scheduleHours(row.scheduleThuOpen, row.scheduleThuClose),
			fri: scheduleHours(row.scheduleFriOpen, row.scheduleFriClose),
			sat: scheduleHours(row.scheduleSatOpen, row.scheduleSatClose),
		},
	};
}

function mapObservedMinute(
	row: typeof occupancyMinutes.$inferSelect,
): ObservedOccupancyMinute {
	return {
		minuteStartUtc: row.minuteStartUtc,
		businessDay: row.businessDay,
		count: row.count,
		entries: row.entries,
		exits: row.exits,
		band: row.band,
		capacitySnapshot: row.capacitySnapshot,
		settingsVersion: row.settingsVersion,
		source: row.source,
	};
}

export type AnalyticsRepository = {
	readDailyAnalytics(businessDay: string): Promise<DailyAnalytics>;
};

export function createAnalyticsRepository(
	database: Database,
): AnalyticsRepository {
	return {
		async readDailyAnalytics(businessDay) {
			const [settingsRows, minuteRows] = await Promise.all([
				database
					.select()
					.from(settingsVersions)
					.orderBy(
						asc(settingsVersions.effectiveFrom),
						asc(settingsVersions.version),
					),
				database
					.select()
					.from(occupancyMinutes)
					.where(eq(occupancyMinutes.businessDay, businessDay))
					.orderBy(
						asc(occupancyMinutes.minuteStartUtc),
						asc(occupancyMinutes.deviceId),
					),
			]);
			return buildDailyAnalytics({
				businessDay,
				settingsVersions: settingsRows.map(mapSettings),
				observedMinutes: minuteRows.map(mapObservedMinute),
			});
		},
	};
}
