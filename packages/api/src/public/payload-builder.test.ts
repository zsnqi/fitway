import { describe, expect, it } from "vitest";
import {
	buildPublicOccupancyPayload,
	type PublicPayloadRepository,
} from "./payload-builder";

const settings = {
	version: 1,
	capacity: 100,
	quietMaxPercent: 25,
	moderateMaxPercent: 50,
	busyMaxPercent: 75,
	timezone: "Asia/Riyadh",
	businessDayBoundary: "04:00",
	pushIntervalSeconds: 20,
	freshForSeconds: 90,
	operationalStaleAfterSeconds: 180,
	publicPollSeconds: 60,
};
function repository(
	lastPushReceivedAt: Date | null,
	count = 150,
	enabled = true,
): PublicPayloadRepository {
	return {
		readCurrentAndLatestSettings: async () => ({
			settings,
			current: {
				currentCount: lastPushReceivedAt ? count : null,
				band: lastPushReceivedAt ? "packed" : null,
				source: lastPushReceivedAt ? "edge" : null,
				lastPushReceivedAt,
				activeDeviceEnabled: lastPushReceivedAt ? enabled : null,
			},
		}),
	};
}

describe("public payload builder", () => {
	it("returns exact unavailable before a usable accepted push", async () => {
		const built = await buildPublicOccupancyPayload(
			repository(null),
			new Date("2026-07-13T12:00:00.000Z"),
		);
		expect(built.payload).toEqual({
			schemaVersion: 1,
			freshness: "unavailable",
			computedAt: "2026-07-13T12:00:00.000Z",
			trend: null,
		});
		expect(built.pollSeconds).toBe(60);
	});

	it("is fresh through 90 seconds, stale one millisecond later and at 180 seconds", async () => {
		const pushed = new Date("2026-07-13T12:00:00.000Z");
		for (const [age, expected] of [
			[90_000, "fresh"],
			[90_001, "stale"],
			[180_000, "stale"],
		] as const) {
			const built = await buildPublicOccupancyPayload(
				repository(pushed),
				new Date(pushed.getTime() + age),
			);
			expect(built.payload.freshness).toBe(expected);
		}
	});

	it("caps percentage without capping count and fails closed for disabled devices", async () => {
		const pushed = new Date("2026-07-13T12:00:00.000Z");
		const built = await buildPublicOccupancyPayload(repository(pushed), pushed);
		expect(built.payload).toMatchObject({
			count: 150,
			percentFull: 100,
			band: "packed",
			freshUntil: "2026-07-13T12:01:30.000Z",
		});
		expect(
			(await buildPublicOccupancyPayload(repository(pushed, 1, false), pushed))
				.payload.freshness,
		).toBe("unavailable");
	});
});
