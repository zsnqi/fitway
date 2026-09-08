import type { OccupancyBand } from "../occupancy/bands";
import { businessDayFor } from "../occupancy/business-day";
import {
	assertScheduleSettings,
	createScheduleEvaluator,
	type WeeklySchedule,
} from "../occupancy/schedule";

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type AnalyticsSettingsVersion = {
	version: number;
	effectiveFrom: Date;
	timeZone: string;
	businessDayBoundary: string;
	weeklySchedule: WeeklySchedule;
};

export type ObservedOccupancyMinute = {
	minuteStartUtc: Date;
	businessDay: string;
	count: number;
	entries: number;
	exits: number;
	band: OccupancyBand;
	capacitySnapshot: number;
	settingsVersion: number;
	source: "live" | "backfill" | "manual";
};

export type AnalyticsValueBucket = {
	state: "value";
	minuteStartUtc: string;
	count: number;
	entries: number;
	exits: number;
	band: OccupancyBand;
	capacitySnapshot: number;
	settingsVersion: number;
	source: ObservedOccupancyMinute["source"];
};

export type AnalyticsAbsentBucket = {
	state: "closed" | "missing";
	minuteStartUtc: string;
	count: null;
	settingsVersion: number;
};

export type AnalyticsTimelineBucket =
	| AnalyticsValueBucket
	| AnalyticsAbsentBucket;

export type DailyAnalytics = {
	businessDay: string;
	timeline: AnalyticsTimelineBucket[];
	peak: {
		minuteStartUtc: string;
		count: number;
		band: OccupancyBand;
		capacitySnapshot: number;
		settingsVersion: number;
	} | null;
	dailyAverage: number | null;
	estimatedEntranceCrossings: number;
	observedOpenMinutes: number;
	expectedOpenMinutes: number;
	coverage: number | null;
};

export type DailyAnalyticsInput = {
	businessDay: string;
	settingsVersions: readonly AnalyticsSettingsVersion[];
	observedMinutes: readonly ObservedOccupancyMinute[];
};

function businessDayMidnightUtc(businessDay: string): number {
	if (!ISO_DATE.test(businessDay)) {
		throw new RangeError("Business day must be an ISO date");
	}
	const value = Date.parse(`${businessDay}T00:00:00.000Z`);
	if (
		!Number.isFinite(value) ||
		new Date(value).toISOString().slice(0, 10) !== businessDay
	) {
		throw new RangeError("Business day must be a valid ISO date");
	}
	return value;
}

function validatedSettings(
	settingsVersions: readonly AnalyticsSettingsVersion[],
): AnalyticsSettingsVersion[] {
	const versions = [...settingsVersions];
	for (const settings of versions) {
		if (!Number.isSafeInteger(settings.version) || settings.version <= 0) {
			throw new RangeError("Settings version must be a positive safe integer");
		}
		if (
			!(settings.effectiveFrom instanceof Date) ||
			!Number.isFinite(settings.effectiveFrom.getTime())
		) {
			throw new RangeError("Settings effective time must be valid");
		}
		assertScheduleSettings(settings);
		businessDayFor(
			settings.effectiveFrom,
			settings.timeZone,
			settings.businessDayBoundary,
		);
	}
	return versions.sort(
		(left, right) =>
			left.effectiveFrom.getTime() - right.effectiveFrom.getTime() ||
			left.version - right.version,
	);
}

function effectiveSettingsAt(
	settingsVersions: readonly AnalyticsSettingsVersion[],
	instant: Date,
): AnalyticsSettingsVersion | null {
	let result: AnalyticsSettingsVersion | null = null;
	for (const settings of settingsVersions) {
		if (settings.effectiveFrom.getTime() > instant.getTime()) break;
		result = settings;
	}
	return result;
}

function observedByInstant(
	observedMinutes: readonly ObservedOccupancyMinute[],
	businessDay: string,
): Map<number, ObservedOccupancyMinute> {
	const result = new Map<number, ObservedOccupancyMinute>();
	for (const row of observedMinutes) {
		const instant = row.minuteStartUtc.getTime();
		if (
			!Number.isFinite(instant) ||
			instant % MINUTE_MS !== 0 ||
			!Number.isSafeInteger(row.count) ||
			row.count < 0 ||
			!Number.isSafeInteger(row.entries) ||
			row.entries < 0 ||
			!Number.isSafeInteger(row.exits) ||
			row.exits < 0 ||
			!Number.isSafeInteger(row.capacitySnapshot) ||
			row.capacitySnapshot <= 0 ||
			!Number.isSafeInteger(row.settingsVersion) ||
			row.settingsVersion <= 0
		) {
			throw new RangeError("Observed analytics minute is invalid");
		}
		if (row.businessDay !== businessDay) continue;
		if (result.has(instant)) {
			throw new Error(
				`Multiple occupancy rows exist for analytics minute ${row.minuteStartUtc.toISOString()}`,
			);
		}
		result.set(instant, row);
	}
	return result;
}

function valueBucket(row: ObservedOccupancyMinute): AnalyticsValueBucket {
	return {
		state: "value",
		minuteStartUtc: row.minuteStartUtc.toISOString(),
		count: row.count,
		entries: row.entries,
		exits: row.exits,
		band: row.band,
		capacitySnapshot: row.capacitySnapshot,
		settingsVersion: row.settingsVersion,
		source: row.source,
	};
}

export function buildDailyAnalytics({
	businessDay,
	settingsVersions,
	observedMinutes,
}: DailyAnalyticsInput): DailyAnalytics {
	const midnightUtc = businessDayMidnightUtc(businessDay);
	const sortedSettings = validatedSettings(settingsVersions);
	const rows = observedByInstant(observedMinutes, businessDay);
	const timeline: AnalyticsTimelineBucket[] = [];
	const schedules = new Map<
		AnalyticsSettingsVersion,
		ReturnType<typeof createScheduleEvaluator>
	>();

	// IANA offsets are bounded well inside this window. Filtering through the
	// canonical business-day primitive avoids fixed-offset or host-timezone math.
	const scanStart = midnightUtc - 48 * HOUR_MS;
	const scanEnd = midnightUtc + 72 * HOUR_MS;
	for (let timestamp = scanStart; timestamp < scanEnd; timestamp += MINUTE_MS) {
		const instant = new Date(timestamp);
		const settings = effectiveSettingsAt(sortedSettings, instant);
		if (
			!settings ||
			businessDayFor(
				instant,
				settings.timeZone,
				settings.businessDayBoundary,
			) !== businessDay
		) {
			continue;
		}

		let evaluate = schedules.get(settings);
		if (!evaluate) {
			evaluate = createScheduleEvaluator(settings);
			schedules.set(settings, evaluate);
		}
		if (!evaluate(instant).open) {
			timeline.push({
				state: "closed",
				minuteStartUtc: instant.toISOString(),
				count: null,
				settingsVersion: settings.version,
			});
			continue;
		}

		const observed = rows.get(timestamp);
		timeline.push(
			observed
				? valueBucket(observed)
				: {
						state: "missing",
						minuteStartUtc: instant.toISOString(),
						count: null,
						settingsVersion: settings.version,
					},
		);
	}

	const values = timeline.filter(
		(bucket): bucket is AnalyticsValueBucket => bucket.state === "value",
	);
	const countTotal = values.reduce((total, bucket) => total + bucket.count, 0);
	const expectedOpenMinutes = timeline.reduce(
		(total, bucket) => total + (bucket.state === "closed" ? 0 : 1),
		0,
	);
	const peakBucket = values.reduce<AnalyticsValueBucket | null>(
		(peak, bucket) => (!peak || bucket.count > peak.count ? bucket : peak),
		null,
	);
	const estimatedEntranceCrossings = [...rows.values()].reduce(
		(total, row) => total + row.entries,
		0,
	);

	return {
		businessDay,
		timeline,
		peak: peakBucket
			? {
					minuteStartUtc: peakBucket.minuteStartUtc,
					count: peakBucket.count,
					band: peakBucket.band,
					capacitySnapshot: peakBucket.capacitySnapshot,
					settingsVersion: peakBucket.settingsVersion,
				}
			: null,
		dailyAverage: values.length === 0 ? null : countTotal / values.length,
		estimatedEntranceCrossings,
		observedOpenMinutes: values.length,
		expectedOpenMinutes,
		coverage:
			expectedOpenMinutes === 0 ? null : values.length / expectedOpenMinutes,
	};
}
