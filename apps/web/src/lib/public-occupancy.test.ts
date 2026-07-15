import { describe, expect, it } from "vitest";
import {
	effectiveFreshness,
	nextPollDelay,
	parsePollSeconds,
} from "./public-occupancy";

const payload = {
	schemaVersion: 2 as const,
	freshness: "fresh" as const,
	timeZone: "Asia/Riyadh",
	band: "quiet" as const,
	count: 10,
	lastUpdatedAt: "2026-07-13T12:00:00.000Z",
	freshUntil: "2026-07-13T12:01:30.000Z",
	source: "edge" as const,
	computedAt: "2026-07-13T12:00:01.000Z",
	trend: null,
};
describe("public polling and cache-safe expiry", () => {
	it("accepts only positive integer poll headers and jitters within ten percent", () => {
		expect([
			parsePollSeconds(null),
			parsePollSeconds("0"),
			parsePollSeconds("1.5"),
		]).toEqual([null, null, null]);
		expect(parsePollSeconds("60")).toBe(60);
		expect(nextPollDelay(60, () => 0)).toBe(54_000);
		expect(nextPollDelay(60, () => 1)).toBe(66_000);
	});

	it("expires origin-fresh locally and never upgrades origin stale", () => {
		expect(
			effectiveFreshness(payload, new Date("2026-07-13T12:01:29.999Z")),
		).toBe("fresh");
		expect(
			effectiveFreshness(payload, new Date("2026-07-13T12:01:30.000Z")),
		).toBe("stale");
		expect(
			effectiveFreshness(
				{ ...payload, freshness: "stale" },
				new Date("2026-07-13T12:00:02.000Z"),
			),
		).toBe("stale");
	});

	it("passes valid closed through until next-open then expires it honestly", () => {
		const closed = {
			schemaVersion: 2 as const,
			freshness: "closed" as const,
			timeZone: "Asia/Riyadh",
			nextOpenAt: "2026-07-17T11:00:00.000Z",
			computedAt: "2026-07-17T10:59:00.000Z",
			trend: null,
		};
		expect(
			effectiveFreshness(closed, new Date("2026-07-17T10:59:59.999Z")),
		).toBe("closed");
		expect(
			effectiveFreshness(closed, new Date("2026-07-17T11:00:00.000Z")),
		).toBe("unavailable");
		expect(
			effectiveFreshness(
				{ ...closed, nextOpenAt: null },
				new Date("2027-07-17T11:00:00.000Z"),
			),
		).toBe("closed");
		expect(
			effectiveFreshness(
				{ ...closed, computedAt: closed.nextOpenAt },
				new Date("2026-07-17T10:59:30.000Z"),
			),
		).toBe("unavailable");
	});
});
