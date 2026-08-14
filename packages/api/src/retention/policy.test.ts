import { describe, expect, it } from "vitest";
import {
	isExpired,
	RETENTION_GOVERNING_COLUMN,
	RETENTION_TABLES,
	RETENTION_WINDOW_MONTHS,
	retentionCutoff,
} from "./policy";

describe("retention policy", () => {
	it("quantizes the cutoff to the start of the UTC day", () => {
		const dayStart = retentionCutoff(new Date("2026-08-14T00:00:00.000Z"));
		const midday = retentionCutoff(new Date("2026-08-14T12:34:56.789Z"));
		const dayEnd = retentionCutoff(new Date("2026-08-14T23:59:59.999Z"));

		expect(midday).toEqual(dayStart);
		expect(dayEnd).toEqual(dayStart);
	});

	it("subtracts twelve calendar months from that day start", () => {
		expect(retentionCutoff(new Date("2026-08-14T12:34:56.789Z"))).toEqual(
			new Date("2025-08-14T00:00:00.000Z"),
		);
		expect(RETENTION_WINDOW_MONTHS).toBe(12);
	});

	it.each([
		"2026-08-14T12:34:56.789Z",
		"2026-01-31T23:59:59.999Z",
		"2024-02-29T00:00:00.000Z",
		"2026-03-31T05:00:00.000Z",
		"2000-02-29T18:00:00.000Z",
	])("moves %s back by exactly RETENTION_WINDOW_MONTHS whole months", (iso) => {
		// Derived through a disjoint path — month arithmetic recovered from the
		// result rather than compared against a restated literal — so the
		// declared window and the cutoff cannot drift apart unnoticed.
		const now = new Date(iso);
		const cutoff = retentionCutoff(now);

		expect(
			(now.getUTCFullYear() - cutoff.getUTCFullYear()) * 12 +
				(now.getUTCMonth() - cutoff.getUTCMonth()),
		).toBe(RETENTION_WINDOW_MONTHS);
		// 29 February clamps back onto the shorter month rather than rolling
		// forward into March and silently shortening the window.
		expect(cutoff.getUTCDate()).toBe(
			Math.min(
				now.getUTCDate(),
				new Date(
					Date.UTC(cutoff.getUTCFullYear(), cutoff.getUTCMonth() + 1, 0),
				).getUTCDate(),
			),
		);
		expect(cutoff.toISOString().slice(10)).toBe("T00:00:00.000Z");
	});

	it("advances by exactly one day across a UTC day boundary", () => {
		const before = retentionCutoff(new Date("2026-08-14T23:59:59.999Z"));
		const after = retentionCutoff(new Date("2026-08-15T00:00:00.000Z"));

		expect(after.getTime() - before.getTime()).toBe(86_400_000);
	});

	it("clamps to the last day of the target month when the calendar day does not exist", () => {
		// 2024 is a leap year; 2023-02-29 does not exist. Clamping down keeps the
		// cutoff inside February rather than letting it roll forward into March,
		// which would silently shorten the retention window by a day.
		expect(retentionCutoff(new Date("2024-02-29T09:00:00.000Z"))).toEqual(
			new Date("2023-02-28T00:00:00.000Z"),
		);
	});

	it("retains a row exactly at the cutoff and expires one a millisecond older", () => {
		const cutoff = retentionCutoff(new Date("2026-08-14T12:00:00.000Z"));

		expect(isExpired(cutoff, cutoff)).toBe(false);
		expect(isExpired(new Date(cutoff.getTime() + 1), cutoff)).toBe(false);
		expect(isExpired(new Date(cutoff.getTime() - 1), cutoff)).toBe(true);
	});

	it("is pure: the same instant always yields the same cutoff", () => {
		const now = new Date("2026-08-14T12:34:56.789Z");
		expect(retentionCutoff(now)).toEqual(retentionCutoff(now));
		// The input is not mutated, so a caller's clock value survives the call.
		expect(now.toISOString()).toBe("2026-08-14T12:34:56.789Z");
	});

	it("names one governing timestamp column for each retention table", () => {
		expect([...RETENTION_TABLES]).toEqual([
			"audit_log",
			"edge_health_log",
			"alert_log",
		]);
		expect(RETENTION_GOVERNING_COLUMN).toEqual({
			audit_log: "created_at",
			edge_health_log: "occurred_at",
			alert_log: "sent_at",
		});
	});

	it("rejects an invalid instant rather than computing a cutoff from it", () => {
		expect(() => retentionCutoff(new Date(Number.NaN))).toThrow(RangeError);
		expect(() => isExpired(new Date(Number.NaN), new Date())).toThrow(
			RangeError,
		);
	});
});
