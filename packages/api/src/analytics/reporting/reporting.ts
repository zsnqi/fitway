import { businessDayFor } from "../../occupancy/business-day";
import {
	assertScheduleSettings,
	evaluateSchedule,
	WEEKDAYS,
	type Weekday,
} from "../../occupancy/schedule";
import type {
	AnalyticsSettingsVersion,
	ObservedOccupancyMinute,
} from "../daily-analytics";
import {
	type Heatmap,
	type ReportingDay,
	type ReportingMinute,
	type ReportingRange,
	reportingBuilderInputSchema,
	reportingDateRangeInputSchema,
	WEEK_COMPARABILITY_MIN_COVERAGE,
	type WeekComparison,
	type WeekComparisonWindow,
	weekComparisonBuilderInputSchema,
	weekComparisonWindowInputSchema,
} from "./contracts";

const minuteMilliseconds = 60_000;
const hourMilliseconds = 60 * minuteMilliseconds;
const dayMilliseconds = 24 * hourMilliseconds;
const localFormatters = new Map<string, Intl.DateTimeFormat>();

function utcMidnight(businessDay: string): number {
	return Date.parse(`${businessDay}T00:00:00.000Z`);
}

export function addBusinessDays(businessDay: string, amount: number): string {
	const parsed = reportingDateRangeInputSchema.parse({
		startBusinessDay: businessDay,
		endBusinessDay: businessDay,
	});
	if (!Number.isSafeInteger(amount)) {
		throw new RangeError("Business-day offset must be a safe integer");
	}
	return new Date(
		utcMidnight(parsed.startBusinessDay) + amount * dayMilliseconds,
	)
		.toISOString()
		.slice(0, 10);
}

export function enumerateBusinessDays(
	startBusinessDay: string,
	endBusinessDay: string,
): string[] {
	const range = reportingDateRangeInputSchema.parse({
		startBusinessDay,
		endBusinessDay,
	});
	const result: string[] = [];
	for (
		let timestamp = utcMidnight(range.startBusinessDay);
		timestamp <= utcMidnight(range.endBusinessDay);
		timestamp += dayMilliseconds
	) {
		result.push(new Date(timestamp).toISOString().slice(0, 10));
	}
	return result;
}

function weekdayForBusinessDay(businessDay: string): Weekday {
	return (
		WEEKDAYS[new Date(`${businessDay}T00:00:00.000Z`).getUTCDay()] ?? "sun"
	);
}

function formatterFor(timeZone: string): Intl.DateTimeFormat {
	let formatter = localFormatters.get(timeZone);
	if (!formatter) {
		formatter = new Intl.DateTimeFormat("en-CA-u-ca-gregory-nu-latn", {
			timeZone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hourCycle: "h23",
		});
		localFormatters.set(timeZone, formatter);
	}
	return formatter;
}

function localMinute(instant: Date, timeZone: string): string {
	const parts = Object.fromEntries(
		formatterFor(timeZone)
			.formatToParts(instant)
			.filter((part) => part.type !== "literal")
			.map((part) => [part.type, part.value]),
	);
	return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
}

function sortedSettingsVersions(
	settingsVersions: readonly AnalyticsSettingsVersion[],
): AnalyticsSettingsVersion[] {
	const versions = [...settingsVersions];
	const seenVersions = new Set<number>();
	for (const settings of versions) {
		if (seenVersions.has(settings.version)) {
			throw new Error(`Settings version ${settings.version} is duplicated`);
		}
		seenVersions.add(settings.version);
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

function addSafe(left: number, right: number, label: string): number {
	const result = left + right;
	if (!Number.isSafeInteger(result)) {
		throw new RangeError(`${label} exceeds the safe integer range`);
	}
	return result;
}

type MutableReportingDay = {
	businessDay: string;
	weekday: Weekday;
	timeline: ReportingMinute[];
	countTotal: number;
	estimatedEntranceCrossings: number;
};

function observedMinuteMap(
	rows: readonly ObservedOccupancyMinute[],
	days: Map<string, MutableReportingDay>,
): Map<number, ObservedOccupancyMinute> {
	const result = new Map<number, ObservedOccupancyMinute>();
	for (const row of rows) {
		const day = days.get(row.businessDay);
		if (!day) continue;
		const timestamp = row.minuteStartUtc.getTime();
		if (timestamp % minuteMilliseconds !== 0) {
			throw new RangeError("Observed reporting minute must be UTC-aligned");
		}
		if (result.has(timestamp)) {
			throw new Error(
				`Multiple occupancy rows exist for reporting minute ${row.minuteStartUtc.toISOString()}`,
			);
		}
		result.set(timestamp, row);
		day.estimatedEntranceCrossings = addSafe(
			day.estimatedEntranceCrossings,
			row.entries,
			"Estimated entrance crossings",
		);
	}
	return result;
}

function finalizeDay(day: MutableReportingDay): ReportingDay {
	const values = day.timeline.filter((bucket) => bucket.state === "value");
	const expectedOpenMinutes = day.timeline.reduce(
		(total, bucket) => total + (bucket.state === "closed" ? 0 : 1),
		0,
	);
	const peak = values.reduce<(typeof values)[number] | null>(
		(result, bucket) =>
			!result || bucket.count > result.count ? bucket : result,
		null,
	);
	return {
		businessDay: day.businessDay,
		weekday: day.weekday,
		timeline: day.timeline,
		peak: peak
			? {
					minuteStartUtc: peak.minuteStartUtc,
					count: peak.count,
					band: peak.band,
					capacitySnapshot: peak.capacitySnapshot,
					settingsVersion: peak.settingsVersion,
				}
			: null,
		dailyAverage: values.length === 0 ? null : day.countTotal / values.length,
		estimatedEntranceCrossings: day.estimatedEntranceCrossings,
		observedOpenMinutes: values.length,
		expectedOpenMinutes,
		coverage:
			expectedOpenMinutes === 0 ? null : values.length / expectedOpenMinutes,
	};
}

export function buildReportingRange(
	input: Readonly<{
		startBusinessDay: string;
		endBusinessDay: string;
		settingsVersions: readonly AnalyticsSettingsVersion[];
		observedMinutes: readonly ObservedOccupancyMinute[];
	}>,
): ReportingRange {
	const parsed = reportingBuilderInputSchema.parse({
		...input,
		settingsVersions: [...input.settingsVersions],
		observedMinutes: [...input.observedMinutes],
	});
	const settingsVersions = sortedSettingsVersions(parsed.settingsVersions);
	const mutableDays = new Map<string, MutableReportingDay>(
		enumerateBusinessDays(parsed.startBusinessDay, parsed.endBusinessDay).map(
			(businessDay) => [
				businessDay,
				{
					businessDay,
					weekday: weekdayForBusinessDay(businessDay),
					timeline: [],
					countTotal: 0,
					estimatedEntranceCrossings: 0,
				},
			],
		),
	);
	const rows = observedMinuteMap(parsed.observedMinutes, mutableDays);

	const scanStart =
		utcMidnight(parsed.startBusinessDay) - 48 * hourMilliseconds;
	const scanEnd = utcMidnight(parsed.endBusinessDay) + 72 * hourMilliseconds;
	let settingsIndex = 0;
	let effectiveSettings: AnalyticsSettingsVersion | null = null;
	for (
		let timestamp = scanStart;
		timestamp < scanEnd;
		timestamp += minuteMilliseconds
	) {
		while (
			settingsIndex < settingsVersions.length &&
			(settingsVersions[settingsIndex]?.effectiveFrom.getTime() ??
				Number.POSITIVE_INFINITY) <= timestamp
		) {
			effectiveSettings = settingsVersions[settingsIndex] ?? null;
			settingsIndex += 1;
		}
		if (!effectiveSettings) continue;
		const instant = new Date(timestamp);
		const businessDay = businessDayFor(
			instant,
			effectiveSettings.timeZone,
			effectiveSettings.businessDayBoundary,
		);
		const day = mutableDays.get(businessDay);
		if (!day) continue;

		const context = {
			businessDay,
			weekday: day.weekday,
			minuteStartUtc: instant.toISOString(),
			minuteStartLocal: localMinute(instant, effectiveSettings.timeZone),
			timeZone: effectiveSettings.timeZone,
		};
		if (!evaluateSchedule(effectiveSettings, instant).open) {
			day.timeline.push({
				...context,
				state: "closed",
				count: null,
				settingsVersion: effectiveSettings.version,
			});
			continue;
		}

		const observed = rows.get(timestamp);
		if (!observed) {
			day.timeline.push({
				...context,
				state: "missing",
				count: null,
				settingsVersion: effectiveSettings.version,
			});
			continue;
		}
		day.countTotal = addSafe(day.countTotal, observed.count, "Occupancy total");
		day.timeline.push({
			...context,
			state: "value",
			count: observed.count,
			entries: observed.entries,
			exits: observed.exits,
			band: observed.band,
			capacitySnapshot: observed.capacitySnapshot,
			settingsVersion: observed.settingsVersion,
			source: observed.source,
		});
	}

	const days = [...mutableDays.values()].map(finalizeDay);
	const values = days.flatMap((day) =>
		day.timeline.filter((bucket) => bucket.state === "value"),
	);
	const countTotal = values.reduce(
		(total, bucket) => addSafe(total, bucket.count, "Occupancy total"),
		0,
	);
	const estimatedEntranceCrossings = days.reduce(
		(total, day) =>
			addSafe(
				total,
				day.estimatedEntranceCrossings,
				"Estimated entrance crossings",
			),
		0,
	);
	const expectedOpenMinutes = days.reduce(
		(total, day) => total + day.expectedOpenMinutes,
		0,
	);
	return {
		startBusinessDay: parsed.startBusinessDay,
		endBusinessDay: parsed.endBusinessDay,
		days,
		averageOccupancy: values.length === 0 ? null : countTotal / values.length,
		estimatedEntranceCrossings,
		observedOpenMinutes: values.length,
		expectedOpenMinutes,
		coverage:
			expectedOpenMinutes === 0 ? null : values.length / expectedOpenMinutes,
	};
}

type MutableHeatmapCell = {
	weekday: Weekday;
	localHour: number;
	classifiedMinutes: number;
	countTotal: number;
	observedOpenMinutes: number;
	expectedOpenMinutes: number;
	sampleDays: Set<string>;
};

export function buildHeatmap(reportingRange: ReportingRange): Heatmap {
	const cells = new Map<string, MutableHeatmapCell>();
	for (const weekday of WEEKDAYS) {
		for (let localHour = 0; localHour < 24; localHour += 1) {
			cells.set(`${weekday}:${localHour}`, {
				weekday,
				localHour,
				classifiedMinutes: 0,
				countTotal: 0,
				observedOpenMinutes: 0,
				expectedOpenMinutes: 0,
				sampleDays: new Set(),
			});
		}
	}

	for (const day of reportingRange.days) {
		for (const minute of day.timeline) {
			const localHour = Number(minute.minuteStartLocal.slice(11, 13));
			const cell = cells.get(`${minute.weekday}:${localHour}`);
			if (!cell) throw new Error("Reporting minute has an invalid heatmap key");
			cell.classifiedMinutes += 1;
			if (minute.state === "closed") continue;
			cell.expectedOpenMinutes += 1;
			if (minute.state === "missing") continue;
			cell.observedOpenMinutes += 1;
			cell.countTotal = addSafe(
				cell.countTotal,
				minute.count,
				"Heatmap occupancy total",
			);
			cell.sampleDays.add(minute.businessDay);
		}
	}

	return {
		startBusinessDay: reportingRange.startBusinessDay,
		endBusinessDay: reportingRange.endBusinessDay,
		cells: [...cells.values()].map((cell) => ({
			weekday: cell.weekday,
			localHour: cell.localHour,
			state:
				cell.classifiedMinutes === 0
					? "missing"
					: cell.expectedOpenMinutes === 0
						? "closed"
						: cell.observedOpenMinutes === 0
							? "missing"
							: "value",
			averageOccupancy:
				cell.observedOpenMinutes === 0
					? null
					: cell.countTotal / cell.observedOpenMinutes,
			observedOpenMinutes: cell.observedOpenMinutes,
			expectedOpenMinutes: cell.expectedOpenMinutes,
			sampleDayCount: cell.sampleDays.size,
		})),
	};
}

export function resolveWeekComparisonWindow(
	input: Readonly<{
		at: Date;
		settingsVersions: readonly AnalyticsSettingsVersion[];
	}>,
): WeekComparisonWindow {
	const parsed = weekComparisonWindowInputSchema.parse({
		at: input.at,
		settingsVersions: [...input.settingsVersions],
	});
	const settingsVersions = sortedSettingsVersions(parsed.settingsVersions);
	const effectiveSettings = effectiveSettingsAt(settingsVersions, parsed.at);
	if (!effectiveSettings) {
		throw new Error("No effective settings exist at the comparison instant");
	}
	const inProgressBusinessDay = businessDayFor(
		parsed.at,
		effectiveSettings.timeZone,
		effectiveSettings.businessDayBoundary,
	);
	const lastCompleteBusinessDay = addBusinessDays(inProgressBusinessDay, -1);
	return {
		priorWeekStartBusinessDay: addBusinessDays(lastCompleteBusinessDay, -13),
		priorWeekEndBusinessDay: addBusinessDays(lastCompleteBusinessDay, -7),
		currentWeekStartBusinessDay: addBusinessDays(lastCompleteBusinessDay, -6),
		lastCompleteBusinessDay,
	};
}

function weekMetrics(
	reportingRange: ReportingRange,
	startBusinessDay: string,
	endBusinessDay: string,
) {
	const days = reportingRange.days.filter(
		(day) =>
			day.businessDay >= startBusinessDay && day.businessDay <= endBusinessDay,
	);
	const values = days.flatMap((day) =>
		day.timeline.filter((minute) => minute.state === "value"),
	);
	const countTotal = values.reduce(
		(total, minute) => addSafe(total, minute.count, "Weekly occupancy total"),
		0,
	);
	const estimatedEntranceCrossings = days.reduce(
		(total, day) =>
			addSafe(
				total,
				day.estimatedEntranceCrossings,
				"Weekly estimated entrance crossings",
			),
		0,
	);
	const expectedOpenMinutes = days.reduce(
		(total, day) => total + day.expectedOpenMinutes,
		0,
	);
	return {
		startBusinessDay,
		endBusinessDay,
		averageOccupancy: values.length === 0 ? null : countTotal / values.length,
		estimatedEntranceCrossings,
		observedOpenMinutes: values.length,
		expectedOpenMinutes,
		coverage:
			expectedOpenMinutes === 0 ? null : values.length / expectedOpenMinutes,
	};
}

function change(current: number, prior: number) {
	const absolute = current - prior;
	return {
		absolute,
		percent: prior === 0 ? null : absolute / prior,
	};
}

export function buildWeekOverWeekComparison(
	input: Readonly<{
		reportingRange: ReportingRange;
		lastCompleteBusinessDay: string;
		minimumCoverage?: number;
	}>,
): WeekComparison {
	const parsed = weekComparisonBuilderInputSchema.parse(input);
	const minimumCoverage =
		parsed.minimumCoverage ?? WEEK_COMPARABILITY_MIN_COVERAGE;
	const currentWeekStartBusinessDay = addBusinessDays(
		parsed.lastCompleteBusinessDay,
		-6,
	);
	const priorWeekEndBusinessDay = addBusinessDays(
		parsed.lastCompleteBusinessDay,
		-7,
	);
	const priorWeekStartBusinessDay = addBusinessDays(
		parsed.lastCompleteBusinessDay,
		-13,
	);
	if (
		parsed.reportingRange.startBusinessDay !== priorWeekStartBusinessDay ||
		parsed.reportingRange.endBusinessDay !== parsed.lastCompleteBusinessDay
	) {
		throw new RangeError(
			"Week comparison requires exactly the prior and current fourteen business days",
		);
	}

	const currentWeek = weekMetrics(
		parsed.reportingRange,
		currentWeekStartBusinessDay,
		parsed.lastCompleteBusinessDay,
	);
	const priorWeek = weekMetrics(
		parsed.reportingRange,
		priorWeekStartBusinessDay,
		priorWeekEndBusinessDay,
	);
	const reasons: Array<
		| "current_week_no_expected_open_minutes"
		| "current_week_coverage_below_minimum"
		| "prior_week_no_expected_open_minutes"
		| "prior_week_coverage_below_minimum"
	> = [];
	if (currentWeek.expectedOpenMinutes === 0) {
		reasons.push("current_week_no_expected_open_minutes");
	} else if (
		currentWeek.coverage === null ||
		currentWeek.coverage < minimumCoverage
	) {
		reasons.push("current_week_coverage_below_minimum");
	}
	if (priorWeek.expectedOpenMinutes === 0) {
		reasons.push("prior_week_no_expected_open_minutes");
	} else if (
		priorWeek.coverage === null ||
		priorWeek.coverage < minimumCoverage
	) {
		reasons.push("prior_week_coverage_below_minimum");
	}
	if (reasons.length > 0) {
		return {
			state: "insufficient_history",
			minimumCoverage,
			currentWeek,
			priorWeek,
			reasons,
		};
	}

	if (
		currentWeek.averageOccupancy === null ||
		priorWeek.averageOccupancy === null
	) {
		throw new Error("Comparable weeks must contain observed occupancy values");
	}
	return {
		state: "comparable",
		minimumCoverage,
		currentWeek,
		priorWeek,
		changes: {
			averageOccupancy: change(
				currentWeek.averageOccupancy,
				priorWeek.averageOccupancy,
			),
			estimatedEntranceCrossings: change(
				currentWeek.estimatedEntranceCrossings,
				priorWeek.estimatedEntranceCrossings,
			),
		},
	};
}
