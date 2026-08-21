import type { CanonicalAuthContext } from "@fitway/auth";
import { call, ORPCError } from "@orpc/server";
import { describe, expect, it, vi } from "vitest";
import { appRouter } from "../../routers/index";
import type {
	AnalyticsSettingsVersion,
	ObservedOccupancyMinute,
} from "../daily-analytics";
import type { WeekComparison } from "./contracts";
import {
	heatmapOutputSchema,
	reportingRangeOutputSchema,
	weekComparisonOutputSchema,
} from "./contracts";
import { REPORTING_QUERY_MAX_RANGE_DAYS } from "./queries";
import { buildHeatmap, buildReportingRange } from "./reporting";

const common = {
	principalId: "00000000-0000-4000-8000-000000000001",
	sessionId: "00000000-0000-4000-8000-000000000002",
	expiresAt: new Date("2026-08-15T00:00:00.000Z"),
	active: true,
} as const;
const staff: CanonicalAuthContext = {
	...common,
	principalKind: "shared_staff",
	role: "staff",
};
const owner: CanonicalAuthContext = {
	...common,
	principalKind: "owner",
	role: "owner",
};

const closedWeek = {
	sun: null,
	mon: null,
	tue: null,
	wed: null,
	thu: null,
	fri: null,
	sat: null,
} as const;

/**
 * Thursday and Friday open for three gym-local minutes each; every other weekday is
 * closed all week. Thursday is observed twice — once above zero and once at a genuine
 * zero — and once not at all; Friday is never observed. One week therefore carries
 * every state the contracts distinguish, in both the minute timeline and the heatmap.
 */
const settingsVersions: AnalyticsSettingsVersion[] = [
	{
		version: 1,
		effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
		timeZone: "Asia/Riyadh",
		businessDayBoundary: "04:00",
		weeklySchedule: {
			...closedWeek,
			thu: { open: "10:00", close: "10:03" },
			fri: { open: "10:00", close: "10:03" },
		},
	},
];

function observed(
	minuteStartUtc: string,
	count: number,
): ObservedOccupancyMinute {
	return {
		minuteStartUtc: new Date(minuteStartUtc),
		businessDay: "2026-07-16",
		count,
		entries: count,
		exits: 0,
		band: "quiet",
		capacitySnapshot: 80,
		settingsVersion: 1,
		source: "live",
	};
}

/** Monday 2026-07-13 through Sunday 2026-07-19: one whole week, every weekday once. */
const range = {
	startBusinessDay: "2026-07-13",
	endBusinessDay: "2026-07-19",
} as const;

const reportingRange = buildReportingRange({
	...range,
	settingsVersions,
	// 10:00 and 10:01 local are +03:00, so 07:00Z and 07:01Z. 10:02 stays unobserved.
	observedMinutes: [
		observed("2026-07-16T07:00:00.000Z", 7),
		observed("2026-07-16T07:01:00.000Z", 0),
	],
});
const thursday = reportingRange.days.find(
	(day) => day.businessDay === "2026-07-16",
);
const heatmap = buildHeatmap(reportingRange);

const insufficient: WeekComparison = {
	state: "insufficient_history",
	minimumCoverage: 0.8,
	currentWeek: {
		startBusinessDay: "2026-08-09",
		endBusinessDay: "2026-08-11",
		averageOccupancy: null,
		estimatedEntranceCrossings: 0,
		observedOpenMinutes: 0,
		expectedOpenMinutes: 0,
		coverage: null,
	},
	priorWeek: {
		startBusinessDay: "2026-08-02",
		endBusinessDay: "2026-08-08",
		averageOccupancy: 18.5,
		estimatedEntranceCrossings: 240,
		observedOpenMinutes: 300,
		expectedOpenMinutes: 600,
		coverage: 0.5,
	},
	reasons: [
		"current_week_no_expected_open_minutes",
		"prior_week_coverage_below_minimum",
	],
};

async function rejectedCode(operation: Promise<unknown>) {
	try {
		await operation;
	} catch (error) {
		if (error instanceof ORPCError) return error.code;
		throw error;
	}
	return null;
}

function readers() {
	return {
		readReportingRange: vi.fn(async () => reportingRange),
		readReportingHeatmap: vi.fn(async () => heatmap),
		readWeekOverWeek: vi.fn(async () => insufficient),
	};
}

describe("owner reporting query leaves", () => {
	it("admits only an active owner and never touches the repository otherwise", async () => {
		// Each leaf is called by name rather than through a shared loop variable: the
		// three procedures carry three different output contracts, and widening them to
		// a common type to iterate would weaken exactly what this test is asserting.
		for (const auth of [null, { ...owner, active: false }] as const) {
			const context = readers();
			expect(
				await rejectedCode(
					call(appRouter.admin.analytics.range, range, {
						context: { auth, ...context },
					}),
				),
			).toBe("UNAUTHORIZED");
			expect(
				await rejectedCode(
					call(appRouter.admin.analytics.heatmap, range, {
						context: { auth, ...context },
					}),
				),
			).toBe("UNAUTHORIZED");
			expect(
				await rejectedCode(
					call(
						appRouter.admin.analytics.weekOverWeek,
						{},
						{ context: { auth, ...context } },
					),
				),
			).toBe("UNAUTHORIZED");
			expect(context.readReportingRange).not.toHaveBeenCalled();
			expect(context.readReportingHeatmap).not.toHaveBeenCalled();
			expect(context.readWeekOverWeek).not.toHaveBeenCalled();
		}

		const context = readers();
		expect(
			await rejectedCode(
				call(appRouter.admin.analytics.range, range, {
					context: { auth: staff, ...context },
				}),
			),
		).toBe("FORBIDDEN");
		expect(
			await rejectedCode(
				call(appRouter.admin.analytics.heatmap, range, {
					context: { auth: staff, ...context },
				}),
			),
		).toBe("FORBIDDEN");
		expect(
			await rejectedCode(
				call(
					appRouter.admin.analytics.weekOverWeek,
					{},
					{ context: { auth: staff, ...context } },
				),
			),
		).toBe("FORBIDDEN");
		expect(context.readReportingRange).not.toHaveBeenCalled();
		expect(context.readReportingHeatmap).not.toHaveBeenCalled();
		expect(context.readWeekOverWeek).not.toHaveBeenCalled();
	});

	it("answers the frozen range contract with closed, missing, and zero still apart", async () => {
		const context = readers();
		const result = await call(appRouter.admin.analytics.range, range, {
			context: { auth: owner, ...context },
		});

		expect(context.readReportingRange).toHaveBeenCalledWith(range);
		const parsed = reportingRangeOutputSchema.parse(result);
		expect(parsed.days).toHaveLength(7);
		const day = parsed.days.find((entry) => entry.businessDay === "2026-07-16");
		const states = day?.timeline.map((minute) => minute.state) ?? [];
		expect(new Set(states)).toEqual(new Set(["value", "missing", "closed"]));
		// A genuine zero is a value with a count, never an absence.
		expect(
			day?.timeline.find(
				(minute) => minute.state === "value" && minute.count === 0,
			),
		).toBeDefined();
		expect(
			day?.timeline.every(
				(minute) => minute.state === "value" || minute.count === null,
			),
		).toBe(true);
		// The row snapshot travels with the minute, so history is read from what was
		// recorded then rather than from whatever capacity is configured now.
		const value = day?.timeline.find((minute) => minute.state === "value");
		expect(value?.state === "value" && value.capacitySnapshot).toBe(80);
		expect(thursday?.dailyAverage).toBe(3.5);
	});

	it("answers the frozen heatmap contract with all 168 cells and their states", async () => {
		const context = readers();
		const result = await call(appRouter.admin.analytics.heatmap, range, {
			context: { auth: owner, ...context },
		});

		expect(context.readReportingHeatmap).toHaveBeenCalledWith(range);
		const parsed = heatmapOutputSchema.parse(result);
		expect(parsed.cells).toHaveLength(168);
		const thursdayTen = parsed.cells.find(
			(cell) => cell.weekday === "thu" && cell.localHour === 10,
		);
		expect(thursdayTen?.state).toBe("value");
		expect(thursdayTen?.observedOpenMinutes).toBe(2);
		expect(thursdayTen?.expectedOpenMinutes).toBe(3);
		// Half of the observed occupancy is a genuine zero; the average keeps it.
		expect(thursdayTen?.averageOccupancy).toBe(3.5);
		// A weekday the gym never opens is closed, not missing, and not a zero.
		expect(
			parsed.cells.find(
				(cell) => cell.weekday === "mon" && cell.localHour === 10,
			)?.state,
		).toBe("closed");
		// An open hour with no observation at all is missing, and its average is null
		// rather than a zero that would read as "nobody came".
		const friday = parsed.cells.find(
			(cell) => cell.weekday === "fri" && cell.localHour === 10,
		);
		expect(friday?.state).toBe("missing");
		expect(friday?.expectedOpenMinutes).toBe(3);
		expect(friday?.averageOccupancy).toBeNull();
	});

	it("rejects an unordered range and one longer than the query bound", async () => {
		const context = readers();
		expect(
			await rejectedCode(
				call(
					appRouter.admin.analytics.range,
					{ startBusinessDay: "2026-07-20", endBusinessDay: "2026-07-13" },
					{ context: { auth: owner, ...context } },
				),
			),
		).toBe("BAD_REQUEST");
		expect(
			await rejectedCode(
				call(
					appRouter.admin.analytics.heatmap,
					{ startBusinessDay: "2026-07-01", endBusinessDay: "2026-09-01" },
					{ context: { auth: owner, ...context } },
				),
			),
		).toBe("BAD_REQUEST");
		expect(
			await rejectedCode(
				call(
					appRouter.admin.analytics.range,
					{ startBusinessDay: "2026-07-13", endBusinessDay: "2026-07-32" },
					{ context: { auth: owner, ...context } },
				),
			),
		).toBe("BAD_REQUEST");
		expect(context.readReportingRange).not.toHaveBeenCalled();
		expect(context.readReportingHeatmap).not.toHaveBeenCalled();

		// The bound itself is inclusive and admitted.
		const end = new Date("2026-07-13T00:00:00.000Z");
		end.setUTCDate(end.getUTCDate() + REPORTING_QUERY_MAX_RANGE_DAYS - 1);
		await call(
			appRouter.admin.analytics.range,
			{
				startBusinessDay: "2026-07-13",
				endBusinessDay: end.toISOString().slice(0, 10),
			},
			{ context: { auth: owner, ...context } },
		);
		expect(context.readReportingRange).toHaveBeenCalledTimes(1);
	});

	it("resolves the comparison window server-side and preserves its typed reasons", async () => {
		const context = readers();
		const result = await call(
			appRouter.admin.analytics.weekOverWeek,
			{},
			{
				context: { auth: owner, ...context },
			},
		);

		// No client input reaches the reader: the window and the comparability bar are
		// product decisions, so no caller can shift either to manufacture a comparison.
		expect(context.readWeekOverWeek).toHaveBeenCalledWith();
		const parsed = weekComparisonOutputSchema.parse(result);
		expect(parsed.state).toBe("insufficient_history");
		if (parsed.state !== "insufficient_history") throw new Error("unreachable");
		expect(parsed.reasons).toEqual([
			"current_week_no_expected_open_minutes",
			"prior_week_coverage_below_minimum",
		]);
	});

	it("fails loudly when the transport did not inject a reader", async () => {
		expect(
			await rejectedCode(
				call(appRouter.admin.analytics.range, range, {
					context: { auth: owner },
				}),
			),
		).toBe("INTERNAL_SERVER_ERROR");
		expect(
			await rejectedCode(
				call(appRouter.admin.analytics.heatmap, range, {
					context: { auth: owner },
				}),
			),
		).toBe("INTERNAL_SERVER_ERROR");
		expect(
			await rejectedCode(
				call(
					appRouter.admin.analytics.weekOverWeek,
					{},
					{
						context: { auth: owner },
					},
				),
			),
		).toBe("INTERNAL_SERVER_ERROR");
	});
});
