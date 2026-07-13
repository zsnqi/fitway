import { describe, expect, it } from "vitest";
import {
	type DailyHours,
	evaluateSchedule,
	type ScheduleSettings,
	type Weekday,
	type WeeklySchedule,
} from "./schedule";

const googleHours: WeeklySchedule = {
	sun: { open: "06:00", close: "02:00" },
	mon: { open: "06:00", close: "02:00" },
	tue: { open: "06:00", close: "02:00" },
	wed: { open: "06:00", close: "02:00" },
	thu: { open: "06:00", close: "02:00" },
	fri: { open: "14:00", close: "00:00" },
	sat: { open: "06:00", close: "02:00" },
};

const riyadh: ScheduleSettings = {
	timeZone: "Asia/Riyadh",
	weeklySchedule: googleHours,
};

function closedWeek(): Record<Weekday, DailyHours | null> {
	return {
		sun: null,
		mon: null,
		tue: null,
		wed: null,
		thu: null,
		fri: null,
		sat: null,
	};
}

function resultAt(settings: ScheduleSettings, instant: string) {
	return evaluateSchedule(settings, new Date(instant));
}

describe("weekly schedule evaluation", () => {
	it("uses half-open boundaries and handles a past-midnight session", () => {
		expect(resultAt(riyadh, "2026-07-15T02:59:59.999Z")).toEqual({
			open: false,
			nextOpenAt: new Date("2026-07-15T03:00:00.000Z"),
		});
		expect(resultAt(riyadh, "2026-07-15T03:00:00.000Z")).toEqual({
			open: true,
		});
		expect(resultAt(riyadh, "2026-07-15T03:00:00.001Z")).toEqual({
			open: true,
		});
		expect(resultAt(riyadh, "2026-07-15T22:00:00.000Z")).toEqual({
			open: true,
		});
		expect(resultAt(riyadh, "2026-07-15T22:59:59.999Z")).toEqual({
			open: true,
		});
		expect(resultAt(riyadh, "2026-07-15T23:00:00.000Z")).toEqual({
			open: false,
			nextOpenAt: new Date("2026-07-16T03:00:00.000Z"),
		});
		expect(resultAt(riyadh, "2026-07-15T23:00:00.001Z")).toEqual({
			open: false,
			nextOpenAt: new Date("2026-07-16T03:00:00.000Z"),
		});
		expect(resultAt(riyadh, "2026-07-16T00:00:00.000Z")).toEqual({
			open: false,
			nextOpenAt: new Date("2026-07-16T03:00:00.000Z"),
		});
	});

	it("treats Thursday spillover and Friday hours as ordinary schedule data", () => {
		expect(resultAt(riyadh, "2026-07-16T20:59:59.000Z")).toEqual({
			open: true,
		});
		expect(resultAt(riyadh, "2026-07-16T22:59:59.999Z")).toEqual({
			open: true,
		});
		expect(resultAt(riyadh, "2026-07-16T23:00:00.000Z")).toEqual({
			open: false,
			nextOpenAt: new Date("2026-07-17T11:00:00.000Z"),
		});
		expect(resultAt(riyadh, "2026-07-17T10:59:59.999Z")).toEqual({
			open: false,
			nextOpenAt: new Date("2026-07-17T11:00:00.000Z"),
		});
		expect(resultAt(riyadh, "2026-07-17T11:00:00.000Z")).toEqual({
			open: true,
		});
		expect(resultAt(riyadh, "2026-07-17T20:59:59.999Z")).toEqual({
			open: true,
		});
		expect(resultAt(riyadh, "2026-07-17T21:00:00.000Z")).toEqual({
			open: false,
			nextOpenAt: new Date("2026-07-18T03:00:00.000Z"),
		});
	});

	it("wraps Saturday spillover into Sunday and scans to the same weekday next week", () => {
		expect(resultAt(riyadh, "2026-07-18T22:30:00.000Z")).toEqual({
			open: true,
		});
		const onlyWednesday = closedWeek();
		onlyWednesday.wed = { open: "06:00", close: "07:00" };
		expect(
			resultAt(
				{ timeZone: "Asia/Riyadh", weeklySchedule: onlyWednesday },
				"2026-07-15T04:00:00.000Z",
			),
		).toEqual({
			open: false,
			nextOpenAt: new Date("2026-07-22T03:00:00.000Z"),
		});
	});

	it("returns null for an all-closed week", () => {
		expect(
			resultAt(
				{ timeZone: "Asia/Riyadh", weeklySchedule: closedWeek() },
				"2026-07-17T12:00:00.000Z",
			),
		).toEqual({ open: false, nextOpenAt: null });
	});

	it("treats equal open and close as a continuous 24-hour daily session", () => {
		const always = Object.fromEntries(
			Object.keys(closedWeek()).map((day) => [
				day,
				{ open: "06:00", close: "06:00" },
			]),
		) as WeeklySchedule;
		for (const instant of [
			"2026-07-17T02:59:59.999Z",
			"2026-07-17T03:00:00.000Z",
			"2026-07-17T18:00:00.000Z",
		]) {
			expect(
				resultAt({ timeZone: "Asia/Riyadh", weeklySchedule: always }, instant),
			).toEqual({ open: true });
		}
	});

	it("uses calendar-safe arithmetic across leap day and year boundaries", () => {
		const schedule = closedWeek();
		schedule.mon = { open: "00:00", close: "01:00" };
		expect(
			resultAt(
				{ timeZone: "UTC", weeklySchedule: schedule },
				"2027-12-31T23:59:59.999Z",
			),
		).toEqual({
			open: false,
			nextOpenAt: new Date("2028-01-03T00:00:00.000Z"),
		});
		const leap = closedWeek();
		leap.sat = { open: "00:00", close: "01:00" };
		expect(
			resultAt(
				{ timeZone: "UTC", weeklySchedule: leap },
				"2028-02-29T12:00:00.000Z",
			),
		).toEqual({
			open: false,
			nextOpenAt: new Date("2028-03-04T00:00:00.000Z"),
		});
	});

	it("normalizes PostgreSQL-style seconds and honors a non-Riyadh zone", () => {
		const schedule = closedWeek();
		schedule.mon = { open: "06:00:00", close: "07:00:00" };
		expect(
			resultAt(
				{ timeZone: "Asia/Kathmandu", weeklySchedule: schedule },
				"2026-07-20T00:10:00.000Z",
			),
		).toEqual({
			open: false,
			nextOpenAt: new Date("2026-07-20T00:15:00.000Z"),
		});
		expect(
			resultAt(
				{ timeZone: "Asia/Kathmandu", weeklySchedule: schedule },
				"2026-07-20T00:30:00.000Z",
			),
		).toEqual({ open: true });
	});

	it("is independent of the host timezone", () => {
		const originalTimeZone = process.env.TZ;
		try {
			process.env.TZ = "Pacific/Honolulu";
			const fromHonoluluHost = resultAt(riyadh, "2026-07-16T23:00:00.000Z");
			process.env.TZ = "Europe/Berlin";
			const fromBerlinHost = resultAt(riyadh, "2026-07-16T23:00:00.000Z");

			expect(fromHonoluluHost).toEqual({
				open: false,
				nextOpenAt: new Date("2026-07-17T11:00:00.000Z"),
			});
			expect(fromBerlinHost).toEqual(fromHonoluluHost);
		} finally {
			if (originalTimeZone === undefined) delete process.env.TZ;
			else process.env.TZ = originalTimeZone;
		}
	});

	it("uses the earlier instant for a repeated wall time and rejects a DST gap", () => {
		const fold = closedWeek();
		fold.sun = { open: "01:30", close: "03:00" };
		expect(
			resultAt(
				{ timeZone: "America/New_York", weeklySchedule: fold },
				"2026-11-01T05:00:00.000Z",
			),
		).toEqual({
			open: false,
			nextOpenAt: new Date("2026-11-01T05:30:00.000Z"),
		});

		const gap = closedWeek();
		gap.sun = { open: "02:30", close: "04:00" };
		expect(() =>
			resultAt(
				{ timeZone: "America/New_York", weeklySchedule: gap },
				"2026-03-08T06:00:00.000Z",
			),
		).toThrow(/does not exist/u);
	});

	it("fails deterministically for invalid instants, zones, shapes, and times", () => {
		expect(() => resultAt(riyadh, "invalid")).toThrow(/valid evaluation/u);
		expect(() =>
			resultAt(
				{ timeZone: "Not/AZone", weeklySchedule: closedWeek() },
				"2026-07-17T12:00:00.000Z",
			),
		).toThrow();
		const malformed = closedWeek();
		malformed.fri = { open: "6:00", close: "25:00" };
		expect(() =>
			resultAt(
				{ timeZone: "Asia/Riyadh", weeklySchedule: malformed },
				"2026-07-17T12:00:00.000Z",
			),
		).toThrow(/Schedule time/u);
	});
});
