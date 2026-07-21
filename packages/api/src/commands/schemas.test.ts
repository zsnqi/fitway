import { describe, expect, it } from "vitest";

import {
	correctionInputSchema,
	deviceCommandSchema,
	resetInputSchema,
} from "./schemas";

describe("command contract schemas", () => {
	it("accepts exactly one safe correction form and normalizes a short reason", () => {
		expect(
			correctionInputSchema.parse({ delta: -5, reason: "  counter drift  " }),
		).toEqual({ delta: -5, reason: "counter drift" });
		expect(correctionInputSchema.parse({ absolute: 0 })).toEqual({
			absolute: 0,
		});
		for (const invalid of [
			{},
			{ delta: 1, absolute: 2 },
			{ delta: 1.5 },
			{ delta: Number.MAX_SAFE_INTEGER + 1 },
			{ absolute: -1 },
			{ absolute: 1.5 },
			{ absolute: 2_147_483_648 },
			{ delta: 1, reason: " ".repeat(3) },
			{ delta: 1, reason: "x".repeat(241) },
		]) {
			expect(correctionInputSchema.safeParse(invalid).success).toBe(false);
		}
	});

	it("keeps reset input strict and device commands JSON-safe", () => {
		expect(resetInputSchema.parse({ reason: "  closing check  " })).toEqual({
			reason: "closing check",
		});
		expect(
			resetInputSchema.safeParse({ reason: "ok", extra: true }).success,
		).toBe(false);
		expect(
			deviceCommandSchema.parse({
				id: 7,
				type: "set_count",
				targetValue: 0,
				issuedAt: "2026-07-22T00:00:00.000Z",
			}),
		).toMatchObject({ id: 7, targetValue: 0 });
		expect(
			deviceCommandSchema.safeParse({
				id: Number.MAX_SAFE_INTEGER + 1,
				type: "reset_zero",
				targetValue: null,
				issuedAt: "2026-07-22T00:00:00.000Z",
			}).success,
		).toBe(false);
		expect(
			deviceCommandSchema.safeParse({
				id: 8,
				type: "reset_zero",
				targetValue: 1,
				issuedAt: "2026-07-22T00:00:00.000Z",
			}).success,
		).toBe(false);
	});
});
