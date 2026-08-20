import { ORPCError, ownerProcedure } from "../../index";
import {
	heatmapOutputSchema,
	inclusiveBusinessDayCount,
	isoBusinessDaySchema,
	reportingDateRangeInputSchema,
	reportingRangeOutputSchema,
	weekComparisonOutputSchema,
} from "./contracts";
import { REPORTING_QUERY_MAX_RANGE_DAYS } from "./query-range";

/**
 * The bound now lives in `./query-range`, which imports nothing, so the owner range
 * control can state the same number without pulling `@orpc/server` into the web bundle.
 * It is re-exported here because this module is where a reader looks for it.
 */
export { REPORTING_QUERY_MAX_RANGE_DAYS };

/**
 * The frozen ordered-range contract, narrowed by the bound above. Nothing here
 * redefines or widens `reportingDateRangeInputSchema`; an unordered range is still
 * rejected by the frozen refinement before this one is consulted.
 */
export const reportingQueryRangeInputSchema =
	reportingDateRangeInputSchema.superRefine((value, context) => {
		// A malformed or unordered day already has its own issue from the frozen
		// schema. Counting one here would throw a `RangeError` out of validation and
		// turn a plain 400 into a 500, so this check only speaks for a valid window.
		if (
			!isoBusinessDaySchema.safeParse(value.startBusinessDay).success ||
			!isoBusinessDaySchema.safeParse(value.endBusinessDay).success ||
			value.startBusinessDay > value.endBusinessDay
		) {
			return;
		}
		if (
			inclusiveBusinessDayCount(value.startBusinessDay, value.endBusinessDay) >
			REPORTING_QUERY_MAX_RANGE_DAYS
		) {
			context.addIssue({
				code: "custom",
				path: ["endBusinessDay"],
				message: `Reporting range must not exceed ${REPORTING_QUERY_MAX_RANGE_DAYS} inclusive business days`,
			});
		}
	});

/**
 * Owner-only reporting range. Read-only by construction: the context exposes no
 * write path, and the response is the frozen `reportingRangeOutputSchema`, whose
 * per-minute `state` keeps closed, missing, and a genuine zero apart. Historical band
 * and capacity travel as row snapshots inside that payload, never as current settings.
 */
const adminAnalyticsRange = ownerProcedure
	.input(reportingQueryRangeInputSchema)
	.output(reportingRangeOutputSchema)
	.handler(({ context, input }) => {
		if (!context.readReportingRange) {
			throw new ORPCError("INTERNAL_SERVER_ERROR");
		}
		return context.readReportingRange(input);
	});

/** Owner-only weekday-by-hour aggregate over the same window and the same guard. */
const adminAnalyticsHeatmap = ownerProcedure
	.input(reportingQueryRangeInputSchema)
	.output(heatmapOutputSchema)
	.handler(({ context, input }) => {
		if (!context.readReportingHeatmap) {
			throw new ORPCError("INTERNAL_SERVER_ERROR");
		}
		return context.readReportingHeatmap(input);
	});

/**
 * Owner-only week-over-week comparison. It takes no input at all, exactly as the
 * health summary does: which two weeks are compared, and the coverage a week must
 * reach before it may be compared, are product decisions resolved server-side. A
 * client that could pass `at` or `minimumCoverage` could manufacture a comparison out
 * of a week that is not comparable, and the honest `insufficient_history` state this
 * surface exists to show would become optional.
 */
const adminAnalyticsWeekOverWeek = ownerProcedure
	.output(weekComparisonOutputSchema)
	.handler(({ context }) => {
		if (!context.readWeekOverWeek) {
			throw new ORPCError("INTERNAL_SERVER_ERROR");
		}
		return context.readWeekOverWeek();
	});

export const adminAnalyticsReportingQueries = {
	range: adminAnalyticsRange,
	heatmap: adminAnalyticsHeatmap,
	weekOverWeek: adminAnalyticsWeekOverWeek,
};
