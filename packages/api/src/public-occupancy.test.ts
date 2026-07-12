import { describe, expect, it } from "vitest";

import {
	createPublicOccupancyUrl,
	createUnavailablePublicOccupancyPayload,
	isPublicOccupancyUnavailablePayload,
	PUBLIC_OCCUPANCY_CACHE_CONTROL,
	PUBLIC_OCCUPANCY_EXTERNAL_PATH,
	PUBLIC_OCCUPANCY_INTERNAL_PATH,
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
			schemaVersion: 1,
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
				schemaVersion: 1,
				freshness: "unavailable",
				computedAt: "2026-07-13",
				trend: null,
			}),
		).toBe(false);
	});
});
