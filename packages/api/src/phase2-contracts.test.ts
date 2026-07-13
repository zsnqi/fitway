import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { edgePushRequestSchema, edgePushResponseSchema } from "./edge-push";
import { publicOccupancyPayloadSchema } from "./public-occupancy";

const fixture = JSON.parse(readFileSync("edge/fixtures/push.json", "utf8"));
const acknowledgement = JSON.parse(
	readFileSync("edge/fixtures/acknowledgement.json", "utf8"),
);

describe("Phase 2 contracts", () => {
	it("accepts simulator fixtures and rejects unknown/privacy-risk fields", () => {
		expect(edgePushRequestSchema.safeParse(fixture).success).toBe(true);
		expect(edgePushResponseSchema.safeParse(acknowledgement).success).toBe(
			true,
		);
		expect(
			edgePushRequestSchema.safeParse({ ...fixture, image: "data" }).success,
		).toBe(false);
		expect(
			edgePushRequestSchema.safeParse({
				...fixture,
				appliedCommandId: "future",
			}).success,
		).toBe(false);
	});

	it("rejects duplicate, unordered, and unaligned minute snapshots", () => {
		const minute = fixture.minutes[0];
		expect(
			edgePushRequestSchema.safeParse({ ...fixture, minutes: [minute, minute] })
				.success,
		).toBe(false);
		expect(
			edgePushRequestSchema.safeParse({
				...fixture,
				minutes: [{ ...minute, minuteStart: "2026-07-13T18:24:01.000Z" }],
			}).success,
		).toBe(false);
	});

	it("keeps unavailable minimal and usable payload capacity-free", () => {
		const usable = {
			schemaVersion: 1,
			freshness: "fresh",
			timeZone: "Asia/Riyadh",
			band: "packed",
			count: 150,
			percentFull: 100,
			lastUpdatedAt: "2026-07-13T18:24:20.000Z",
			freshUntil: "2026-07-13T18:25:50.000Z",
			source: "edge",
			computedAt: "2026-07-13T18:24:21.000Z",
			trend: null,
		};
		expect(publicOccupancyPayloadSchema.parse(usable)).not.toHaveProperty(
			"capacity",
		);
		expect(
			publicOccupancyPayloadSchema.safeParse({ ...usable, capacity: 100 })
				.success,
		).toBe(false);
	});
});
