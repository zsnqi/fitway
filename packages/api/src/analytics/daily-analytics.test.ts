import { describe, expect, it } from "vitest";
import {
	type AnalyticsSettingsVersion,
	buildDailyAnalytics,
	type ObservedOccupancyMinute,
} from "./daily-analytics";

const settings: AnalyticsSettingsVersion = {
	version: 1,
	effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
	timeZone: "Asia/Riyadh",
	businessDayBoundary: "04:00",
	weeklySchedule: {
		sun: null,
		mon: null,
		tue: null,
		wed: null,
		thu: null,
		fri: { open: "14:00", close: "00:00" },
		sat: null,
	},
};

function observed(
	minuteStartUtc: string,
	value: Partial<ObservedOccupancyMinute> = {},
): ObservedOccupancyMinute {
	return {
		minuteStartUtc: new Date(minuteStartUtc),
		businessDay: "2026-07-17",
		count: 12,
		entries: 2,
		exits: 1,
		band: "moderate",
		capacitySnapshot: 80,
		settingsVersion: 1,
		source: "live",
		...value,
	};
}

describe("daily analytics", () => {
	it("keeps Friday closed, missing, and genuine zero buckets distinct", () => {
		const report = buildDailyAnalytics({
			businessDay: "2026-07-17",
			settingsVersions: [settings],
			observedMinutes: [
				observed("2026-07-17T10:59:00.000Z", { count: 99, entries: 9 }),
				observed("2026-07-17T11:00:00.000Z", {
					count: 0,
					entries: 1,
					band: "busy",
				}),
				observed("2026-07-17T11:02:00.000Z"),
			],
		});

		expect(report.timeline).toHaveLength(24 * 60);
		expect(
			report.timeline.find(
				(bucket) => bucket.minuteStartUtc === "2026-07-17T10:59:00.000Z",
			),
		).toMatchObject({ state: "closed", count: null, settingsVersion: 1 });
		expect(
			report.timeline.find(
				(bucket) => bucket.minuteStartUtc === "2026-07-17T11:00:00.000Z",
			),
		).toEqual({
			state: "value",
			minuteStartUtc: "2026-07-17T11:00:00.000Z",
			count: 0,
			entries: 1,
			exits: 1,
			band: "busy",
			capacitySnapshot: 80,
			settingsVersion: 1,
			source: "live",
		});
		expect(
			report.timeline.find(
				(bucket) => bucket.minuteStartUtc === "2026-07-17T11:01:00.000Z",
			),
		).toEqual({
			state: "missing",
			minuteStartUtc: "2026-07-17T11:01:00.000Z",
			count: null,
			settingsVersion: 1,
		});
		expect(report).toMatchObject({
			businessDay: "2026-07-17",
			dailyAverage: 6,
			estimatedEntranceCrossings: 12,
			observedOpenMinutes: 2,
			expectedOpenMinutes: 600,
			coverage: 2 / 600,
			peak: {
				minuteStartUtc: "2026-07-17T11:02:00.000Z",
				count: 12,
				band: "moderate",
				capacitySnapshot: 80,
				settingsVersion: 1,
			},
		});
	});

	it("uses effective-time version ties across midnight without retroactive changes", () => {
		const base: AnalyticsSettingsVersion = {
			...settings,
			version: 4,
			effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
			weeklySchedule: {
				...settings.weeklySchedule,
				thu: { open: "18:00", close: "02:00" },
			},
		};
		const tiedClosed: AnalyticsSettingsVersion = {
			...base,
			version: 5,
			effectiveFrom: new Date("2026-07-16T20:00:00.000Z"),
			weeklySchedule: {
				...settings.weeklySchedule,
				thu: null,
			},
		};
		const tiedOpen: AnalyticsSettingsVersion = {
			...base,
			version: 6,
			effectiveFrom: tiedClosed.effectiveFrom,
		};
		const input = {
			businessDay: "2026-07-16",
			settingsVersions: [tiedOpen, base, tiedClosed],
			observedMinutes: [
				observed("2026-07-16T21:30:00.000Z", {
					businessDay: "2026-07-16",
					count: 7,
					settingsVersion: 4,
				}),
			],
		};
		const before = buildDailyAnalytics(input);

		expect(
			before.timeline.find(
				(bucket) => bucket.minuteStartUtc === "2026-07-16T21:30:00.000Z",
			),
		).toMatchObject({
			state: "value",
			count: 7,
			settingsVersion: 4,
		});
		expect(
			before.timeline.find(
				(bucket) => bucket.minuteStartUtc === "2026-07-16T23:30:00.000Z",
			),
		).toEqual({
			state: "closed",
			minuteStartUtc: "2026-07-16T23:30:00.000Z",
			count: null,
			settingsVersion: 6,
		});

		const after = buildDailyAnalytics({
			...input,
			settingsVersions: [
				...input.settingsVersions,
				{
					...base,
					version: 7,
					effectiveFrom: new Date("2026-07-18T00:00:00.000Z"),
					weeklySchedule: {
						...base.weeklySchedule,
						thu: null,
					},
				},
			],
		});
		expect(after).toEqual(before);
	});

	it("returns honest all-closed, all-missing, and unconfigured empty days", () => {
		const allClosed: AnalyticsSettingsVersion = {
			...settings,
			weeklySchedule: {
				sun: null,
				mon: null,
				tue: null,
				wed: null,
				thu: null,
				fri: null,
				sat: null,
			},
		};
		const closed = buildDailyAnalytics({
			businessDay: "2026-07-17",
			settingsVersions: [allClosed],
			observedMinutes: [],
		});
		expect(closed.timeline).toHaveLength(24 * 60);
		expect(new Set(closed.timeline.map((bucket) => bucket.state))).toEqual(
			new Set(["closed"]),
		);
		expect(closed).toMatchObject({
			peak: null,
			dailyAverage: null,
			estimatedEntranceCrossings: 0,
			observedOpenMinutes: 0,
			expectedOpenMinutes: 0,
			coverage: null,
		});

		const alwaysOpen: AnalyticsSettingsVersion = {
			...settings,
			weeklySchedule: {
				sun: { open: "00:00", close: "00:00" },
				mon: { open: "00:00", close: "00:00" },
				tue: { open: "00:00", close: "00:00" },
				wed: { open: "00:00", close: "00:00" },
				thu: { open: "00:00", close: "00:00" },
				fri: { open: "00:00", close: "00:00" },
				sat: { open: "00:00", close: "00:00" },
			},
		};
		const missing = buildDailyAnalytics({
			businessDay: "2026-07-17",
			settingsVersions: [alwaysOpen],
			observedMinutes: [],
		});
		expect(missing.timeline).toHaveLength(24 * 60);
		expect(new Set(missing.timeline.map((bucket) => bucket.state))).toEqual(
			new Set(["missing"]),
		);
		expect(missing).toMatchObject({
			peak: null,
			dailyAverage: null,
			observedOpenMinutes: 0,
			expectedOpenMinutes: 24 * 60,
			coverage: 0,
		});

		expect(
			buildDailyAnalytics({
				businessDay: "2026-07-17",
				settingsVersions: [],
				observedMinutes: [],
			}),
		).toEqual({
			businessDay: "2026-07-17",
			timeline: [],
			peak: null,
			dailyAverage: null,
			estimatedEntranceCrossings: 0,
			observedOpenMinutes: 0,
			expectedOpenMinutes: 0,
			coverage: null,
		});
	});

	it("rejects overlapping device rows instead of double-counting a minute", () => {
		const row = observed("2026-07-17T11:00:00.000Z");
		expect(() =>
			buildDailyAnalytics({
				businessDay: "2026-07-17",
				settingsVersions: [settings],
				observedMinutes: [row, { ...row, count: 30 }],
			}),
		).toThrow("Multiple occupancy rows exist for analytics minute");
	});
});
