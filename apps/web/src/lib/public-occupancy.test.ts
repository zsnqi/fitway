import { describe, expect, it } from "vitest";
import {
	effectiveFreshness,
	nextPollDelay,
	parsePollSeconds,
} from "./public-occupancy";

const payload = {
	schemaVersion: 1 as const,
	freshness: "fresh" as const,
	band: "quiet" as const,
	count: 10,
	percentFull: 10,
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
});
