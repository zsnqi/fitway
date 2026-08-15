import { describe, expect, it } from "vitest";

import { mapHealthSettings } from "./health-incident-repository";

type SettingsRow = Parameters<typeof mapHealthSettings>[0];

/** Postgres returns `time` as `HH:mm:ss`; the schedule primitives take `HH:mm:ss`. */
function settingsRow(overrides: Partial<SettingsRow> = {}): SettingsRow {
	return {
		version: 11,
		effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
		timezone: "Asia/Riyadh",
		businessDayBoundary: "04:00:00",
		capacity: 100,
		quietMaxPercent: 25,
		moderateMaxPercent: 50,
		busyMaxPercent: 75,
		scheduleSunOpen: "06:00:00",
		scheduleSunClose: "22:00:00",
		scheduleMonOpen: "06:00:00",
		scheduleMonClose: "22:00:00",
		scheduleTueOpen: "06:00:00",
		scheduleTueClose: "22:00:00",
		scheduleWedOpen: "06:00:00",
		scheduleWedClose: "22:00:00",
		scheduleThuOpen: "06:00:00",
		scheduleThuClose: "22:00:00",
		scheduleFriOpen: "16:00:00",
		scheduleFriClose: "23:00:00",
		scheduleSatOpen: null,
		scheduleSatClose: null,
		...overrides,
	} as SettingsRow;
}

describe("health settings mapping", () => {
	it("carries the configured zone, boundary, and each weekday pair", () => {
		const mapped = mapHealthSettings(settingsRow());
		expect(mapped.timeZone).toBe("Asia/Riyadh");
		expect(mapped.businessDayBoundary).toBe("04:00:00");
		expect(mapped.weeklySchedule.fri).toEqual({
			open: "16:00:00",
			close: "23:00:00",
		});
	});

	it("treats a closed weekday as closed rather than as a zero-length session", () => {
		expect(mapHealthSettings(settingsRow()).weeklySchedule.sat).toBeNull();
	});

	it("refuses a half-configured weekday instead of inventing the other end", () => {
		expect(() =>
			mapHealthSettings(settingsRow({ scheduleSatOpen: "06:00:00" })),
		).toThrow(/incomplete weekday pair/i);
	});

	it("normalizes the shorter stored time form the driver may return", () => {
		const mapped = mapHealthSettings(
			settingsRow({ businessDayBoundary: "04:00" }),
		);
		expect(mapped.businessDayBoundary).toBe("04:00");
	});
});
