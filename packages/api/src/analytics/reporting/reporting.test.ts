import { describe, expect, it, vi } from "vitest";
import type {
	AnalyticsSettingsVersion,
	ObservedOccupancyMinute,
} from "../daily-analytics";
import {
	CSV_MAX_RANGE_DAYS,
	csvRangeInputSchema,
	type ReportingRange,
	WEEK_COMPARABILITY_MIN_COVERAGE,
} from "./contracts";
import { encodeCsvCell, encodeReportingCsv, reportingCsvRows } from "./csv";
import {
	buildHeatmap,
	buildReportingRange,
	buildWeekOverWeekComparison,
	resolveWeekComparisonWindow,
} from "./reporting";

const minuteMs = 60_000;

const closedWeek = {
	sun: null,
	mon: null,
	tue: null,
	wed: null,
	thu: null,
	fri: null,
	sat: null,
} as const;

function settings(
	overrides: Partial<AnalyticsSettingsVersion> = {},
): AnalyticsSettingsVersion {
	return {
		version: 1,
		effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
		timeZone: "Asia/Riyadh",
		businessDayBoundary: "04:00",
		weeklySchedule: closedWeek,
		...overrides,
	};
}

function observed(
	minuteStartUtc: string,
	businessDay: string,
	overrides: Partial<ObservedOccupancyMinute> = {},
): ObservedOccupancyMinute {
	return {
		minuteStartUtc: new Date(minuteStartUtc),
		businessDay,
		count: 12,
		entries: 2,
		exits: 1,
		band: "moderate",
		capacitySnapshot: 80,
		settingsVersion: 1,
		source: "live",
		...overrides,
	};
}

function isoDateAtOffset(start: string, offset: number): string {
	const value = new Date(`${start}T00:00:00.000Z`);
	value.setUTCDate(value.getUTCDate() + offset);
	return value.toISOString().slice(0, 10);
}

describe("reporting range and heatmap", () => {
	it("does not resolve the same daily schedule thousands of times while building a range", () => {
		const formats = vi.spyOn(Intl.DateTimeFormat.prototype, "formatToParts");
		try {
			const report = buildReportingRange({
				startBusinessDay: "2026-07-16",
				endBusinessDay: "2026-07-17",
				settingsVersions: [
					settings({
						weeklySchedule: Object.fromEntries(
							Object.keys(closedWeek).map((day) => [
								day,
								{ open: "00:00", close: "00:00" },
							]),
						) as AnalyticsSettingsVersion["weeklySchedule"],
					}),
				],
				observedMinutes: [],
			});
			expect(report.expectedOpenMinutes).toBe(2 * 1440);
			// A generous work budget for per-minute classification plus a small
			// number of timezone-aware session resolutions, independent of CPU speed.
			expect(formats.mock.calls.length).toBeLessThan(20_000);
		} finally {
			formats.mockRestore();
		}
	});

	it("uses business-day weekday and the effective minute timezone without collapsing zero, missing, or closed", () => {
		const report = buildReportingRange({
			startBusinessDay: "2026-07-16",
			endBusinessDay: "2026-07-16",
			settingsVersions: [
				settings({
					weeklySchedule: {
						...closedWeek,
						thu: { open: "22:00", close: "03:00" },
					},
				}),
			],
			observedMinutes: [
				observed("2026-07-16T23:00:00.000Z", "2026-07-16", {
					count: 0,
					entries: 1,
					band: "busy",
				}),
			],
		});

		const day = report.days[0];
		expect(day).toMatchObject({
			businessDay: "2026-07-16",
			dailyAverage: 0,
			estimatedEntranceCrossings: 1,
			observedOpenMinutes: 1,
			expectedOpenMinutes: 5 * 60,
		});
		expect(
			day?.timeline.find(
				(bucket) => bucket.minuteStartUtc === "2026-07-16T23:00:00.000Z",
			),
		).toMatchObject({
			state: "value",
			count: 0,
			weekday: "thu",
			minuteStartLocal: "2026-07-17T02:00:00",
			timeZone: "Asia/Riyadh",
			band: "busy",
			capacitySnapshot: 80,
		});
		expect(
			day?.timeline.find(
				(bucket) => bucket.minuteStartUtc === "2026-07-16T23:01:00.000Z",
			),
		).toMatchObject({ state: "missing", count: null, weekday: "thu" });

		const heatmap = buildHeatmap(report);
		expect(
			heatmap.cells.find(
				(cell) => cell.weekday === "thu" && cell.localHour === 2,
			),
		).toEqual({
			weekday: "thu",
			localHour: 2,
			state: "value",
			averageOccupancy: 0,
			observedOpenMinutes: 1,
			expectedOpenMinutes: 60,
			sampleDayCount: 1,
		});
		expect(
			heatmap.cells.find(
				(cell) => cell.weekday === "thu" && cell.localHour === 1,
			),
		).toMatchObject({
			state: "missing",
			averageOccupancy: null,
			observedOpenMinutes: 0,
			expectedOpenMinutes: 60,
			sampleDayCount: 0,
		});
		expect(
			heatmap.cells.find(
				(cell) => cell.weekday === "thu" && cell.localHour === 3,
			),
		).toMatchObject({
			state: "closed",
			averageOccupancy: null,
			observedOpenMinutes: 0,
			expectedOpenMinutes: 0,
			sampleDayCount: 0,
		});
		expect(
			heatmap.cells.find(
				(cell) => cell.weekday === "fri" && cell.localHour === 3,
			),
		).toMatchObject({
			state: "missing",
			averageOccupancy: null,
			observedOpenMinutes: 0,
			expectedOpenMinutes: 0,
			sampleDayCount: 0,
		});
	});

	it("reports unconfigured heatmap history as missing rather than closed", () => {
		const heatmap = buildHeatmap(
			buildReportingRange({
				startBusinessDay: "2026-06-01",
				endBusinessDay: "2026-06-01",
				settingsVersions: [settings()],
				observedMinutes: [],
			}),
		);

		expect(new Set(heatmap.cells.map((cell) => cell.state))).toEqual(
			new Set(["missing"]),
		);
		expect(
			heatmap.cells.every(
				(cell) =>
					cell.averageOccupancy === null &&
					cell.expectedOpenMinutes === 0 &&
					cell.observedOpenMinutes === 0,
			),
		).toBe(true);
	});

	it("uses the settings version effective at each instant", () => {
		const report = buildReportingRange({
			startBusinessDay: "2026-07-16",
			endBusinessDay: "2026-07-16",
			settingsVersions: [
				settings(),
				settings({
					version: 2,
					effectiveFrom: new Date("2026-07-16T20:00:00.000Z"),
					timeZone: "UTC",
					businessDayBoundary: "00:00",
					weeklySchedule: {
						...closedWeek,
						thu: { open: "20:00", close: "20:02" },
					},
				}),
			],
			observedMinutes: [
				observed("2026-07-16T20:00:00.000Z", "2026-07-16", {
					settingsVersion: 2,
				}),
			],
		});

		expect(
			report.days[0]?.timeline.find(
				(bucket) => bucket.minuteStartUtc === "2026-07-16T20:00:00.000Z",
			),
		).toMatchObject({
			state: "value",
			timeZone: "UTC",
			minuteStartLocal: "2026-07-16T20:00:00",
			settingsVersion: 2,
		});
	});

	it("rejects duplicate rows for one minute", () => {
		const row = observed("2026-07-16T23:00:00.000Z", "2026-07-16");
		expect(() =>
			buildReportingRange({
				startBusinessDay: "2026-07-16",
				endBusinessDay: "2026-07-16",
				settingsVersions: [settings()],
				observedMinutes: [row, { ...row, count: 40 }],
			}),
		).toThrow("Multiple occupancy rows exist for reporting minute");
	});
});

describe("week-over-week comparison", () => {
	function comparisonFixture(omitCurrentDays = 0): ReportingRange {
		const start = "2026-07-26";
		const days = Array.from({ length: 14 }, (_, index) => {
			const businessDay = isoDateAtOffset(start, index);
			const omitted = index >= 14 - omitCurrentDays;
			const count = index < 7 ? 10 : 20;
			const entries = index < 7 ? 1 : 2;
			const minuteStartUtc = `${businessDay}T00:00:00.000Z`;
			return {
				businessDay,
				weekday: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][
					new Date(minuteStartUtc).getUTCDay()
				] as "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat",
				timeline: omitted
					? [
							{
								businessDay,
								weekday: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][
									new Date(minuteStartUtc).getUTCDay()
								] as "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat",
								minuteStartUtc,
								minuteStartLocal: `${businessDay}T00:00:00`,
								timeZone: "UTC",
								state: "missing" as const,
								count: null,
								settingsVersion: 1,
							},
						]
					: [
							{
								businessDay,
								weekday: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][
									new Date(minuteStartUtc).getUTCDay()
								] as "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat",
								minuteStartUtc,
								minuteStartLocal: `${businessDay}T00:00:00`,
								timeZone: "UTC",
								state: "value" as const,
								count,
								entries,
								exits: 0,
								band: "moderate" as const,
								capacitySnapshot: 80,
								settingsVersion: 1,
								source: "live" as const,
							},
						],
				peak: omitted
					? null
					: {
							minuteStartUtc,
							count,
							band: "moderate" as const,
							capacitySnapshot: 80,
							settingsVersion: 1,
						},
				dailyAverage: omitted ? null : count,
				estimatedEntranceCrossings: omitted ? 0 : entries,
				observedOpenMinutes: omitted ? 0 : 1,
				expectedOpenMinutes: 1,
				coverage: omitted ? 0 : 1,
			};
		});
		const observedDays = days.filter((day) => day.observedOpenMinutes > 0);
		return {
			startBusinessDay: start,
			endBusinessDay: "2026-08-08",
			days,
			averageOccupancy:
				observedDays.length === 0
					? null
					: observedDays.reduce(
							(total, day) => total + (day.dailyAverage ?? 0),
							0,
						) / observedDays.length,
			estimatedEntranceCrossings: days.reduce(
				(total, day) => total + day.estimatedEntranceCrossings,
				0,
			),
			observedOpenMinutes: observedDays.length,
			expectedOpenMinutes: 14,
			coverage: observedDays.length / 14,
		};
	}

	it("compares two weekday-aligned seven-business-day windows", () => {
		const comparison = buildWeekOverWeekComparison({
			reportingRange: comparisonFixture(),
			lastCompleteBusinessDay: "2026-08-08",
		});

		expect(comparison).toMatchObject({
			state: "comparable",
			minimumCoverage: WEEK_COMPARABILITY_MIN_COVERAGE,
			currentWeek: {
				startBusinessDay: "2026-08-02",
				endBusinessDay: "2026-08-08",
				averageOccupancy: 20,
				estimatedEntranceCrossings: 14,
				observedOpenMinutes: 7,
				expectedOpenMinutes: 7,
				coverage: 1,
			},
			priorWeek: {
				startBusinessDay: "2026-07-26",
				endBusinessDay: "2026-08-01",
				averageOccupancy: 10,
				estimatedEntranceCrossings: 7,
				observedOpenMinutes: 7,
				expectedOpenMinutes: 7,
				coverage: 1,
			},
			changes: {
				averageOccupancy: { absolute: 10, percent: 1 },
				estimatedEntranceCrossings: { absolute: 7, percent: 1 },
			},
		});
	});

	it("returns machine-readable insufficiency when either week lacks coverage", () => {
		const comparison = buildWeekOverWeekComparison({
			reportingRange: comparisonFixture(2),
			lastCompleteBusinessDay: "2026-08-08",
		});

		expect(comparison).toMatchObject({
			state: "insufficient_history",
			minimumCoverage: 0.8,
			reasons: ["current_week_coverage_below_minimum"],
			currentWeek: {
				observedOpenMinutes: 5,
				expectedOpenMinutes: 7,
				coverage: 5 / 7,
			},
		});
	});

	it("ends at the business day before the in-progress day", () => {
		expect(
			resolveWeekComparisonWindow({
				at: new Date("2026-08-09T00:30:00.000Z"),
				settingsVersions: [settings()],
			}),
		).toEqual({
			priorWeekStartBusinessDay: "2026-07-25",
			priorWeekEndBusinessDay: "2026-07-31",
			currentWeekStartBusinessDay: "2026-08-01",
			lastCompleteBusinessDay: "2026-08-07",
		});
	});
});

describe("reporting CSV", () => {
	it("returns validation failure without throwing for malformed calendar dates", () => {
		for (const input of [
			{
				startBusinessDay: "2026-02-29",
				endBusinessDay: "2026-03-01",
			},
			{
				startBusinessDay: "2026-02-28",
				endBusinessDay: "2026-02-29",
			},
		]) {
			let success: boolean | undefined;
			expect(() => {
				success = csvRangeInputSchema.safeParse(input).success;
			}).not.toThrow();
			expect(success).toBe(false);
		}
	});

	it("enforces the inclusive 366-business-day cap", () => {
		expect(CSV_MAX_RANGE_DAYS).toBe(366);
		expect(
			csvRangeInputSchema.parse({
				startBusinessDay: "2026-01-01",
				endBusinessDay: "2026-01-01",
			}),
		).toEqual({
			startBusinessDay: "2026-01-01",
			endBusinessDay: "2026-01-01",
		});
		expect(
			csvRangeInputSchema.parse({
				startBusinessDay: "2026-01-01",
				endBusinessDay: "2027-01-01",
			}),
		).toEqual({
			startBusinessDay: "2026-01-01",
			endBusinessDay: "2027-01-01",
		});
		expect(() =>
			csvRangeInputSchema.parse({
				startBusinessDay: "2026-01-02",
				endBusinessDay: "2026-01-01",
			}),
		).toThrow(/must not precede/);
		expect(() =>
			csvRangeInputSchema.parse({
				startBusinessDay: "2026-01-01",
				endBusinessDay: "2027-01-02",
			}),
		).toThrow(/366/);
	});

	it("emits one BOM, CRLF, explicit absent rows, empty numeric cells, and no device fields", () => {
		const csvSettings = settings({
			timeZone: "UTC",
			businessDayBoundary: "00:00",
			weeklySchedule: {
				...closedWeek,
				thu: { open: "00:00", close: "00:02" },
			},
		});
		const range = buildReportingRange({
			startBusinessDay: "2026-07-16",
			endBusinessDay: "2026-07-16",
			settingsVersions: [csvSettings],
			observedMinutes: [
				observed("2026-07-16T00:00:00.000Z", "2026-07-16", {
					count: 0,
					entries: 0,
					exits: 0,
				}),
			],
		});
		const csv = encodeReportingCsv(reportingCsvRows(range));
		const lines = csv.slice(1).split("\r\n");

		expect(csv.startsWith("\uFEFF")).toBe(true);
		expect(csv.slice(1)).not.toContain("\uFEFF");
		expect(csv.replaceAll("\r\n", "")).not.toContain("\n");
		expect(lines[0]).toBe(
			"business_day,minute_start_utc,minute_start_local,time_zone,state,count,entries,exits,band,capacity_snapshot,settings_version,source",
		);
		expect(lines).toContain(
			"2026-07-16,2026-07-16T00:00:00.000Z,2026-07-16T00:00:00,UTC,value,0,0,0,moderate,80,1,live",
		);
		expect(lines).toContain(
			"2026-07-16,2026-07-16T00:01:00.000Z,2026-07-16T00:01:00,UTC,missing,,,,,,,",
		);
		expect(lines).toContain(
			"2026-07-16,2026-07-16T00:02:00.000Z,2026-07-16T00:02:00,UTC,closed,,,,,,,",
		);
		expect(csv).not.toMatch(/device|token/i);
	});

	it("quotes RFC 4180 cells and protects spreadsheet formulas", () => {
		expect(encodeCsvCell('plain, "quoted"')).toBe('"plain, ""quoted"""');
		expect(encodeCsvCell("=1+1")).toBe("'=1+1");
		expect(encodeCsvCell(" \t@SUM(A1:A2)")).toBe("' \t@SUM(A1:A2)");
	});

	it("keeps minute iteration UTC-aligned", () => {
		const aligned = new Date("2026-01-01T00:00:00.000Z").getTime();
		expect(aligned % minuteMs).toBe(0);
	});
});
