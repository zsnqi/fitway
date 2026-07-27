import type { DailyAnalytics } from "@fitway/api/analytics/daily-analytics";
import {
	type AnalyticsTimeContext,
	analyticsTimeContextOutputSchema,
	ownerDailyAnalyticsOutputSchema,
} from "@fitway/api/analytics/time-context";

export function parseOwnerDailyAnalytics(value: unknown): DailyAnalytics {
	return ownerDailyAnalyticsOutputSchema.parse(value) as DailyAnalytics;
}

export function settingsVersionsForAnalytics(daily: DailyAnalytics): number[] {
	const versions = new Set(
		daily.timeline.map((bucket) => bucket.settingsVersion),
	);
	if (daily.peak) versions.add(daily.peak.settingsVersion);
	return [...versions].sort((left, right) => left - right);
}

export function parseAnalyticsTimeContext(
	value: unknown,
	requestedVersions: readonly number[],
): {
	timeContext: AnalyticsTimeContext;
	timeZoneByVersion: ReadonlyMap<number, string>;
} {
	const timeContext = analyticsTimeContextOutputSchema.parse(value);
	const timeZoneByVersion = new Map<number, string>();
	for (const mapping of timeContext.versions) {
		timeZoneByVersion.set(mapping.settingsVersion, mapping.timeZone);
	}
	for (const settingsVersion of requestedVersions) {
		if (!timeZoneByVersion.has(settingsVersion)) {
			throw new Error(
				`Analytics timezone mapping is missing settings version ${settingsVersion}`,
			);
		}
	}
	return { timeContext, timeZoneByVersion };
}
