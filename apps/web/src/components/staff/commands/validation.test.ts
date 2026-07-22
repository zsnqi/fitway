import { describe, expect, it } from "vitest";

import {
	isCommandReasonTooLong,
	normalizeCommandReason,
	parseDirectCount,
} from "./validation";

describe("staff command input validation", () => {
	it("accepts only a non-negative Postgres integer written with Western digits", () => {
		expect(parseDirectCount(" 37 ")).toEqual({ value: 37, error: null });
		expect(parseDirectCount("0")).toEqual({ value: 0, error: null });
		expect(parseDirectCount("")).toEqual({ value: null, error: "required" });
		expect(parseDirectCount("٣٧")).toEqual({ value: null, error: "western" });
		expect(parseDirectCount("-1")).toEqual({ value: null, error: "western" });
		expect(parseDirectCount("1.5")).toEqual({ value: null, error: "western" });
		expect(parseDirectCount("2147483648")).toEqual({
			value: null,
			error: "range",
		});
	});

	it("trims optional reasons and enforces the API length", () => {
		expect(normalizeCommandReason("  Door recount  ")).toBe("Door recount");
		expect(normalizeCommandReason("   ")).toBeUndefined();
		expect(isCommandReasonTooLong("x".repeat(240))).toBe(false);
		expect(isCommandReasonTooLong(` ${"x".repeat(241)} `)).toBe(true);
	});
});
