import { describe, expect, it } from "vitest";
import { bandFor, floorOccupancy } from "./bands";
import { businessDayFor } from "./business-day";

const thresholds = {
	quietMaxPercent: 25,
	moderateMaxPercent: 50,
	busyMaxPercent: 75,
};

describe("occupancy primitives", () => {
	it("floors counts and applies exact inclusive band boundaries", () => {
		expect(floorOccupancy(-9)).toBe(0);
		expect(
			[0, 25, 26, 50, 51, 75, 76, 150].map((count) =>
				bandFor(count, 100, thresholds),
			),
		).toEqual([
			"quiet",
			"quiet",
			"moderate",
			"moderate",
			"busy",
			"busy",
			"packed",
			"packed",
		]);
	});

	it("rejects invalid capacity and threshold settings", () => {
		expect(() => bandFor(1, 0, thresholds)).toThrow();
		expect(() =>
			bandFor(1, 100, { ...thresholds, moderateMaxPercent: 25 }),
		).toThrow();
	});

	it("attributes pre-boundary Riyadh minutes to the previous business date", () => {
		expect(
			businessDayFor(
				new Date("2026-07-12T22:30:00.000Z"),
				"Asia/Riyadh",
				"04:00",
			),
		).toBe("2026-07-12");
		expect(
			businessDayFor(
				new Date("2026-07-13T01:00:00.000Z"),
				"Asia/Riyadh",
				"04:00",
			),
		).toBe("2026-07-13");
		expect(
			businessDayFor(new Date("2026-07-13T03:59:59.000Z"), "UTC", "04:00"),
		).toBe("2026-07-12");
		expect(() => businessDayFor(new Date(), "Not/AZone", "04:00")).toThrow();
	});
});
