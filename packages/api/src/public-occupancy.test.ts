import { describe, expect, it } from "vitest";

import {
	createPublicOccupancyUrl,
	createUnavailablePublicOccupancyPayload,
	isPublicOccupancyUnavailablePayload,
	PUBLIC_OCCUPANCY_CACHE_CONTROL,
	PUBLIC_OCCUPANCY_EXTERNAL_PATH,
	PUBLIC_OCCUPANCY_INTERNAL_PATH,
	publicOccupancyCacheControl,
	publicOccupancyClosedSchema,
	publicOccupancyPayloadSchema,
} from "./public-occupancy";

describe("public occupancy contract", () => {
	it("freezes the canonical paths and cache policy", () => {
		expect(PUBLIC_OCCUPANCY_EXTERNAL_PATH).toBe("/api/public/occupancy");
		expect(PUBLIC_OCCUPANCY_INTERNAL_PATH).toBe("/public/occupancy");
		expect(PUBLIC_OCCUPANCY_CACHE_CONTROL).toBe(
			"public, s-maxage=30, stale-while-revalidate=60",
		);
	});

	it("builds local and canonical external URLs from one resource path", () => {
		expect(createPublicOccupancyUrl("http://localhost:3000")).toBe(
			"http://localhost:3000/public/occupancy",
		);
		expect(createPublicOccupancyUrl("/api/")).toBe(
			PUBLIC_OCCUPANCY_EXTERNAL_PATH,
		);
	});

	it("returns only an honest unavailable payload", () => {
		const payload = createUnavailablePublicOccupancyPayload(
			new Date("2026-07-13T10:00:00.000Z"),
		);

		expect(payload).toEqual({
			schemaVersion: 2,
			freshness: "unavailable",
			computedAt: "2026-07-13T10:00:00.000Z",
			trend: null,
		});
		expect(payload).not.toHaveProperty("count");
		expect(payload).not.toHaveProperty("capacity");
		expect(payload).not.toHaveProperty("percent");
		expect(isPublicOccupancyUnavailablePayload(payload)).toBe(true);
	});

	it("rejects extra live fields and non-canonical timestamps", () => {
		expect(
			isPublicOccupancyUnavailablePayload({
				...createUnavailablePublicOccupancyPayload(),
				count: 42,
			}),
		).toBe(false);
		expect(
			isPublicOccupancyUnavailablePayload({
				schemaVersion: 2,
				freshness: "unavailable",
				computedAt: "2026-07-13",
				trend: null,
			}),
		).toBe(false);
	});

	it("strictly accepts usable timezone metadata without an open flag", () => {
		const usable = {
			schemaVersion: 2,
			freshness: "fresh",
			timeZone: "Asia/Riyadh",
			band: "quiet",
			count: 12,
			lastUpdatedAt: "2026-07-13T10:00:00.000Z",
			freshUntil: "2026-07-13T10:01:30.000Z",
			source: "edge",
			computedAt: "2026-07-13T10:00:01.000Z",
			trend: null,
		};
		expect(publicOccupancyPayloadSchema.safeParse(usable).success).toBe(true);
		expect(
			publicOccupancyPayloadSchema.safeParse({ ...usable, percentFull: 12 })
				.success,
		).toBe(false);
		expect(
			publicOccupancyPayloadSchema.safeParse({ ...usable, open: true }).success,
		).toBe(false);
		expect(
			publicOccupancyPayloadSchema.safeParse({ ...usable, timeZone: undefined })
				.success,
		).toBe(false);
	});

	it("strictly accepts closed with nullable next-open and rejects occupancy leaks", () => {
		const closed = {
			schemaVersion: 2,
			freshness: "closed",
			timeZone: "Asia/Riyadh",
			nextOpenAt: "2026-07-17T11:00:00.000Z",
			computedAt: "2026-07-16T23:00:00.000Z",
			trend: null,
		};
		expect(publicOccupancyPayloadSchema.safeParse(closed).success).toBe(true);
		expect(
			publicOccupancyPayloadSchema.safeParse({ ...closed, nextOpenAt: null })
				.success,
		).toBe(true);
		for (const field of [
			"count",
			"band",
			"percentFull",
			"lastUpdatedAt",
			"freshUntil",
			"source",
		]) {
			expect(
				publicOccupancyPayloadSchema.safeParse({ ...closed, [field]: 1 })
					.success,
			).toBe(false);
		}
	});

	it("caps closed cache freshness at the next opening", () => {
		const closed = publicOccupancyClosedSchema.parse({
			schemaVersion: 2,
			freshness: "closed",
			timeZone: "Asia/Riyadh",
			nextOpenAt: "2026-07-17T11:00:00.000Z",
			computedAt: "2026-07-17T10:59:00.000Z",
			trend: null,
		});
		expect(
			publicOccupancyCacheControl(closed, new Date("2026-07-17T10:59:29.100Z")),
		).toBe("public, s-maxage=30, stale-while-revalidate=60");
		expect(
			publicOccupancyCacheControl(closed, new Date("2026-07-17T10:59:45.100Z")),
		).toBe("public, s-maxage=14, stale-while-revalidate=60");
		expect(
			publicOccupancyCacheControl(closed, new Date("2026-07-17T11:00:00.000Z")),
		).toBe("public, s-maxage=0, stale-while-revalidate=60");
		expect(
			publicOccupancyCacheControl(
				{ ...closed, nextOpenAt: null },
				new Date("2026-07-17T10:59:45.100Z"),
			),
		).toBe(PUBLIC_OCCUPANCY_CACHE_CONTROL);
	});
});
