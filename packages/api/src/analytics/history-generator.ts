import {
	assertBandSettings,
	type BandThresholds,
	bandFor,
} from "../occupancy/bands";
import { businessDayFor } from "../occupancy/business-day";
import { evaluateSchedule } from "../occupancy/schedule";
import type {
	AnalyticsSettingsVersion,
	ObservedOccupancyMinute,
} from "./daily-analytics";

const MINUTE_MS = 60_000;
const MINUTES_PER_DAY = 24 * 60;

export type AnalyticsHistoryGeneratorSettings = AnalyticsSettingsVersion &
	BandThresholds & {
		capacity: number;
	};

export type AnalyticsHistoryGeneratorInput = {
	startUtc: Date;
	days: number;
	settings: AnalyticsHistoryGeneratorSettings;
	seed?: number;
	omitEveryNthOpenMinute?: number;
};

export function generateDeterministicAnalyticsHistory({
	startUtc,
	days,
	settings,
	seed = 1,
	omitEveryNthOpenMinute,
}: AnalyticsHistoryGeneratorInput): ObservedOccupancyMinute[] {
	const start = startUtc.getTime();
	if (!Number.isFinite(start) || start % MINUTE_MS !== 0) {
		throw new RangeError("History start must be a UTC-aligned minute");
	}
	if (!Number.isSafeInteger(days) || days <= 0 || days > 31) {
		throw new RangeError("History days must be between 1 and 31");
	}
	if (!Number.isSafeInteger(seed) || seed < 0) {
		throw new RangeError("History seed must be a nonnegative safe integer");
	}
	if (
		omitEveryNthOpenMinute !== undefined &&
		(!Number.isSafeInteger(omitEveryNthOpenMinute) ||
			omitEveryNthOpenMinute <= 1)
	) {
		throw new RangeError("Outage cadence must be greater than one minute");
	}
	assertBandSettings(settings.capacity, settings);

	const rows: ObservedOccupancyMinute[] = [];
	let openMinuteIndex = 0;
	for (let index = 0; index < days * MINUTES_PER_DAY; index += 1) {
		const minuteStartUtc = new Date(start + index * MINUTE_MS);
		if (!evaluateSchedule(settings, minuteStartUtc).open) continue;
		openMinuteIndex += 1;
		if (
			omitEveryNthOpenMinute !== undefined &&
			openMinuteIndex % omitEveryNthOpenMinute === 0
		) {
			continue;
		}
		const count = (seed * 31 + index * 17) % (settings.capacity + 1);
		rows.push({
			minuteStartUtc,
			businessDay: businessDayFor(
				minuteStartUtc,
				settings.timeZone,
				settings.businessDayBoundary,
			),
			count,
			entries: (seed + index) % 11 === 0 ? 1 : 0,
			exits: (seed + index) % 13 === 0 ? 1 : 0,
			band: bandFor(count, settings.capacity, settings),
			capacitySnapshot: settings.capacity,
			settingsVersion: settings.version,
			source: "live",
		});
	}
	return rows;
}
