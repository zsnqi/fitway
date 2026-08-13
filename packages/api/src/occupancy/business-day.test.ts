import { describe, expect, it } from "vitest";

import {
	businessDayFor,
	businessDayForExclusiveLocalClose,
} from "./business-day";

function wallMilliseconds(hour: number, minute: number): number {
	return (hour * 60 + minute) * 60 * 1_000;
}

describe("exclusive local-wall close attribution", () => {
	it.each([
		["normal before", { year: 2026, month: 7, day: 16 }, 2, 29, "2026-07-15"],
		["normal equal", { year: 2026, month: 7, day: 16 }, 2, 30, "2026-07-15"],
		["normal after", { year: 2026, month: 7, day: 16 }, 2, 31, "2026-07-16"],
		["gap-date before", { year: 2026, month: 3, day: 8 }, 2, 29, "2026-03-07"],
		["gap-date equal", { year: 2026, month: 3, day: 8 }, 2, 30, "2026-03-07"],
		["gap-date after", { year: 2026, month: 3, day: 8 }, 2, 31, "2026-03-08"],
	] as const)("attributes %s", (_name, date, hour, minute, expected) => {
		expect(
			businessDayForExclusiveLocalClose(
				date,
				wallMilliseconds(hour, minute),
				"02:30",
			),
		).toBe(expected);
	});
});

describe("business-day validation precedence", () => {
	it("rejects an invalid boundary before an invalid timezone", () => {
		expect(() =>
			businessDayFor(
				new Date("2026-07-16T00:00:00.000Z"),
				"Not/AZone",
				"24:00",
			),
		).toThrow("Invalid business-day boundary");
	});
});
