import { describe, expect, it } from "vitest";
import type { AnalyticsSettingsVersion } from "./daily-analytics";
import { generateDeterministicAnalyticsHistory } from "./history-generator";

const alwaysOpen = {
	sun: { open: "00:00", close: "00:00" },
	mon: { open: "00:00", close: "00:00" },
	tue: { open: "00:00", close: "00:00" },
	wed: { open: "00:00", close: "00:00" },
	thu: { open: "00:00", close: "00:00" },
	fri: { open: "00:00", close: "00:00" },
	sat: { open: "00:00", close: "00:00" },
} as const;

describe("analytics history generator", () => {
	it("repeats the same multi-day history without shared fixtures", () => {
		const settings: AnalyticsSettingsVersion & {
			capacity: number;
			quietMaxPercent: number;
			moderateMaxPercent: number;
			busyMaxPercent: number;
		} = {
			version: 9,
			effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
			timeZone: "Asia/Riyadh",
			businessDayBoundary: "04:00",
			weeklySchedule: alwaysOpen,
			capacity: 10,
			quietMaxPercent: 25,
			moderateMaxPercent: 50,
			busyMaxPercent: 75,
		};
		const input = {
			startUtc: new Date("2026-07-15T21:00:00.000Z"),
			days: 2,
			seed: 3,
			omitEveryNthOpenMinute: 10,
			settings,
		};

		const first = generateDeterministicAnalyticsHistory(input);
		const second = generateDeterministicAnalyticsHistory(input);

		expect(second).toEqual(first);
		expect(first).toHaveLength(2_592);
		expect(new Set(first.map((row) => row.businessDay))).toEqual(
			new Set(["2026-07-15", "2026-07-16", "2026-07-17"]),
		);
		expect(first[0]).toEqual({
			minuteStartUtc: new Date("2026-07-15T21:00:00.000Z"),
			businessDay: "2026-07-15",
			count: 5,
			entries: 0,
			exits: 0,
			band: "moderate",
			capacitySnapshot: 10,
			settingsVersion: 9,
			source: "live",
		});
	});
});
