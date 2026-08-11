import { z } from "zod";
import { WEEKDAYS } from "../../occupancy/schedule";

const millisecondsPerDay = 24 * 60 * 60 * 1_000;

const validIsoBusinessDay = (value: string): boolean => {
	const parsed = new Date(`${value}T00:00:00.000Z`);
	return (
		Number.isFinite(parsed.getTime()) &&
		parsed.toISOString().slice(0, 10) === value
	);
};

export const isoBusinessDaySchema = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/)
	.refine(validIsoBusinessDay, {
		message: "Business day must be a valid ISO date",
	});

const positiveSafeIntegerSchema = z
	.number()
	.int()
	.positive()
	.max(Number.MAX_SAFE_INTEGER);
const nonnegativeSafeIntegerSchema = z
	.number()
	.int()
	.nonnegative()
	.max(Number.MAX_SAFE_INTEGER);
const occupancyBandSchema = z.enum(["quiet", "moderate", "busy", "packed"]);
const occupancySourceSchema = z.enum(["live", "backfill", "manual"]);
const weekdaySchema = z.enum(WEEKDAYS);
const clockTimeSchema = z
	.string()
	.regex(/^\d{2}:\d{2}(?::\d{2})?$/, "Time must use HH:mm or HH:mm:ss");
const dailyHoursSchema = z
	.object({ open: clockTimeSchema, close: clockTimeSchema })
	.strict();
const weeklyScheduleSchema = z
	.object({
		sun: dailyHoursSchema.nullable(),
		mon: dailyHoursSchema.nullable(),
		tue: dailyHoursSchema.nullable(),
		wed: dailyHoursSchema.nullable(),
		thu: dailyHoursSchema.nullable(),
		fri: dailyHoursSchema.nullable(),
		sat: dailyHoursSchema.nullable(),
	})
	.strict();

const dateRangeShape = {
	startBusinessDay: isoBusinessDaySchema,
	endBusinessDay: isoBusinessDaySchema,
};

function validateOrderedRange(
	value: { startBusinessDay: string; endBusinessDay: string },
	context: z.RefinementCtx,
): void {
	if (value.startBusinessDay > value.endBusinessDay) {
		context.addIssue({
			code: "custom",
			path: ["endBusinessDay"],
			message: "End business day must not precede start business day",
		});
	}
}

export function inclusiveBusinessDayCount(
	startBusinessDay: string,
	endBusinessDay: string,
): number {
	const start = Date.parse(`${startBusinessDay}T00:00:00.000Z`);
	const end = Date.parse(`${endBusinessDay}T00:00:00.000Z`);
	if (
		!validIsoBusinessDay(startBusinessDay) ||
		!validIsoBusinessDay(endBusinessDay) ||
		start > end
	) {
		throw new RangeError(
			"Reporting range must contain ordered ISO business days",
		);
	}
	return (end - start) / millisecondsPerDay + 1;
}

export const reportingDateRangeInputSchema = z
	.object(dateRangeShape)
	.strict()
	.superRefine(validateOrderedRange);

export type ReportingDateRangeInput = z.input<
	typeof reportingDateRangeInputSchema
>;
export type ReportingDateRange = z.output<typeof reportingDateRangeInputSchema>;

export const CSV_MAX_RANGE_DAYS = 366;

export const csvRangeInputSchema = z
	.object(dateRangeShape)
	.strict()
	.superRefine((value, context) => {
		validateOrderedRange(value, context);
		if (
			validIsoBusinessDay(value.startBusinessDay) &&
			validIsoBusinessDay(value.endBusinessDay) &&
			value.startBusinessDay <= value.endBusinessDay &&
			inclusiveBusinessDayCount(value.startBusinessDay, value.endBusinessDay) >
				CSV_MAX_RANGE_DAYS
		) {
			context.addIssue({
				code: "custom",
				path: ["endBusinessDay"],
				message: `CSV range must not exceed ${CSV_MAX_RANGE_DAYS} inclusive business days`,
			});
		}
	});

export type CsvRangeInput = z.input<typeof csvRangeInputSchema>;
export type CsvRange = z.output<typeof csvRangeInputSchema>;

const analyticsSettingsVersionSchema = z
	.object({
		version: positiveSafeIntegerSchema,
		effectiveFrom: z.date(),
		timeZone: z.string().trim().min(1),
		businessDayBoundary: clockTimeSchema,
		weeklySchedule: weeklyScheduleSchema,
	})
	.strict();

const observedOccupancyMinuteSchema = z
	.object({
		minuteStartUtc: z.date(),
		businessDay: isoBusinessDaySchema,
		count: nonnegativeSafeIntegerSchema,
		entries: nonnegativeSafeIntegerSchema,
		exits: nonnegativeSafeIntegerSchema,
		band: occupancyBandSchema,
		capacitySnapshot: positiveSafeIntegerSchema,
		settingsVersion: positiveSafeIntegerSchema,
		source: occupancySourceSchema,
	})
	.strict();

export const reportingBuilderInputSchema = z
	.object({
		...dateRangeShape,
		settingsVersions: z.array(analyticsSettingsVersionSchema),
		observedMinutes: z.array(observedOccupancyMinuteSchema),
	})
	.strict()
	.superRefine(validateOrderedRange);

export type ReportingBuilderInput = z.input<typeof reportingBuilderInputSchema>;

const minuteStartUtcSchema = z.iso.datetime({ offset: true });
const minuteStartLocalSchema = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
const reportingMinuteContextShape = {
	businessDay: isoBusinessDaySchema,
	weekday: weekdaySchema,
	minuteStartUtc: minuteStartUtcSchema,
	minuteStartLocal: minuteStartLocalSchema,
	timeZone: z.string().min(1),
};

export const reportingValueMinuteSchema = z
	.object({
		...reportingMinuteContextShape,
		state: z.literal("value"),
		count: nonnegativeSafeIntegerSchema,
		entries: nonnegativeSafeIntegerSchema,
		exits: nonnegativeSafeIntegerSchema,
		band: occupancyBandSchema,
		capacitySnapshot: positiveSafeIntegerSchema,
		settingsVersion: positiveSafeIntegerSchema,
		source: occupancySourceSchema,
	})
	.strict();

export const reportingClosedMinuteSchema = z
	.object({
		...reportingMinuteContextShape,
		state: z.literal("closed"),
		count: z.null(),
		settingsVersion: positiveSafeIntegerSchema,
	})
	.strict();

export const reportingMissingMinuteSchema = z
	.object({
		...reportingMinuteContextShape,
		state: z.literal("missing"),
		count: z.null(),
		settingsVersion: positiveSafeIntegerSchema,
	})
	.strict();

export const reportingAbsentMinuteSchema = z.union([
	reportingClosedMinuteSchema,
	reportingMissingMinuteSchema,
]);

export const reportingMinuteSchema = z.discriminatedUnion("state", [
	reportingValueMinuteSchema,
	reportingClosedMinuteSchema,
	reportingMissingMinuteSchema,
]);

export type ReportingValueMinute = z.output<typeof reportingValueMinuteSchema>;
export type ReportingAbsentMinute = z.output<
	typeof reportingAbsentMinuteSchema
>;
export type ReportingMinute = z.output<typeof reportingMinuteSchema>;

const peakSchema = z
	.object({
		minuteStartUtc: minuteStartUtcSchema,
		count: nonnegativeSafeIntegerSchema,
		band: occupancyBandSchema,
		capacitySnapshot: positiveSafeIntegerSchema,
		settingsVersion: positiveSafeIntegerSchema,
	})
	.strict();

export const reportingDaySchema = z
	.object({
		businessDay: isoBusinessDaySchema,
		weekday: weekdaySchema,
		timeline: z.array(reportingMinuteSchema),
		peak: peakSchema.nullable(),
		dailyAverage: z.number().finite().nonnegative().nullable(),
		estimatedEntranceCrossings: nonnegativeSafeIntegerSchema,
		observedOpenMinutes: nonnegativeSafeIntegerSchema,
		expectedOpenMinutes: nonnegativeSafeIntegerSchema,
		coverage: z.number().finite().min(0).max(1).nullable(),
	})
	.strict();

export const reportingRangeOutputSchema = z
	.object({
		...dateRangeShape,
		days: z.array(reportingDaySchema),
		averageOccupancy: z.number().finite().nonnegative().nullable(),
		estimatedEntranceCrossings: nonnegativeSafeIntegerSchema,
		observedOpenMinutes: nonnegativeSafeIntegerSchema,
		expectedOpenMinutes: nonnegativeSafeIntegerSchema,
		coverage: z.number().finite().min(0).max(1).nullable(),
	})
	.strict();

export type ReportingDay = z.output<typeof reportingDaySchema>;
export type ReportingRange = z.output<typeof reportingRangeOutputSchema>;

export const heatmapCellSchema = z
	.object({
		weekday: weekdaySchema,
		localHour: z.number().int().min(0).max(23),
		state: z.enum(["value", "closed", "missing"]),
		averageOccupancy: z.number().finite().nonnegative().nullable(),
		observedOpenMinutes: nonnegativeSafeIntegerSchema,
		expectedOpenMinutes: nonnegativeSafeIntegerSchema,
		sampleDayCount: nonnegativeSafeIntegerSchema,
	})
	.strict();

export const heatmapOutputSchema = z
	.object({
		...dateRangeShape,
		cells: z.array(heatmapCellSchema).length(7 * 24),
	})
	.strict();

export type Heatmap = z.output<typeof heatmapOutputSchema>;

export const WEEK_COMPARABILITY_MIN_COVERAGE = 0.8;

const comparisonCoverageSchema = z.number().finite().min(0).max(1);

export const weekComparisonReadInputSchema = z
	.object({
		at: z.date().optional(),
		minimumCoverage: comparisonCoverageSchema.optional(),
	})
	.strict();

export type WeekComparisonReadInput = z.input<
	typeof weekComparisonReadInputSchema
>;

export const weekComparisonWindowInputSchema = z
	.object({
		at: z.date(),
		settingsVersions: z.array(analyticsSettingsVersionSchema),
	})
	.strict();

export type WeekComparisonWindowInput = z.input<
	typeof weekComparisonWindowInputSchema
>;

export const weekComparisonWindowOutputSchema = z
	.object({
		priorWeekStartBusinessDay: isoBusinessDaySchema,
		priorWeekEndBusinessDay: isoBusinessDaySchema,
		currentWeekStartBusinessDay: isoBusinessDaySchema,
		lastCompleteBusinessDay: isoBusinessDaySchema,
	})
	.strict();

export type WeekComparisonWindow = z.output<
	typeof weekComparisonWindowOutputSchema
>;

const weekMetricsSchema = z
	.object({
		startBusinessDay: isoBusinessDaySchema,
		endBusinessDay: isoBusinessDaySchema,
		averageOccupancy: z.number().finite().nonnegative().nullable(),
		estimatedEntranceCrossings: nonnegativeSafeIntegerSchema,
		observedOpenMinutes: nonnegativeSafeIntegerSchema,
		expectedOpenMinutes: nonnegativeSafeIntegerSchema,
		coverage: comparisonCoverageSchema.nullable(),
	})
	.strict();

const comparisonChangeSchema = z
	.object({
		absolute: z.number().finite(),
		percent: z.number().finite().nullable(),
	})
	.strict();

const weekComparisonBaseShape = {
	minimumCoverage: comparisonCoverageSchema,
	currentWeek: weekMetricsSchema,
	priorWeek: weekMetricsSchema,
};

const weekInsufficiencyReasonSchema = z.enum([
	"current_week_no_expected_open_minutes",
	"current_week_coverage_below_minimum",
	"prior_week_no_expected_open_minutes",
	"prior_week_coverage_below_minimum",
]);

export const weekComparisonOutputSchema = z.discriminatedUnion("state", [
	z
		.object({
			state: z.literal("insufficient_history"),
			...weekComparisonBaseShape,
			reasons: z.array(weekInsufficiencyReasonSchema).min(1),
		})
		.strict(),
	z
		.object({
			state: z.literal("comparable"),
			...weekComparisonBaseShape,
			changes: z
				.object({
					averageOccupancy: comparisonChangeSchema,
					estimatedEntranceCrossings: comparisonChangeSchema,
				})
				.strict(),
		})
		.strict(),
]);

export type WeekComparison = z.output<typeof weekComparisonOutputSchema>;

export const weekComparisonBuilderInputSchema = z
	.object({
		reportingRange: reportingRangeOutputSchema,
		lastCompleteBusinessDay: isoBusinessDaySchema,
		minimumCoverage: comparisonCoverageSchema.optional(),
	})
	.strict();

export type WeekComparisonBuilderInput = z.input<
	typeof weekComparisonBuilderInputSchema
>;

export const REPORTING_CSV_COLUMNS = [
	"business_day",
	"minute_start_utc",
	"minute_start_local",
	"time_zone",
	"state",
	"count",
	"entries",
	"exits",
	"band",
	"capacity_snapshot",
	"settings_version",
	"source",
] as const;

export const reportingCsvRowSchema = z
	.object({
		business_day: isoBusinessDaySchema,
		minute_start_utc: minuteStartUtcSchema,
		minute_start_local: minuteStartLocalSchema,
		time_zone: z.string().min(1),
		state: z.enum(["value", "closed", "missing"]),
		count: nonnegativeSafeIntegerSchema.nullable(),
		entries: nonnegativeSafeIntegerSchema.nullable(),
		exits: nonnegativeSafeIntegerSchema.nullable(),
		band: occupancyBandSchema.nullable(),
		capacity_snapshot: positiveSafeIntegerSchema.nullable(),
		settings_version: positiveSafeIntegerSchema.nullable(),
		source: occupancySourceSchema.nullable(),
	})
	.strict();

export type ReportingCsvRow = z.output<typeof reportingCsvRowSchema>;

export const reportingCsvChunkOutputSchema = z.string();
