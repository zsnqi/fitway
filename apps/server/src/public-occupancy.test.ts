import {
	PUBLIC_OCCUPANCY_CACHE_CONTROL,
	PUBLIC_OCCUPANCY_INTERNAL_PATH,
} from "@fitway/api/public-occupancy";
import { Hono } from "hono";
import { describe, expect, it } from "vitest";

import { createPublicOccupancyHandler } from "./public-occupancy";

describe("public occupancy endpoint", () => {
	it("responds without auth or database context", async () => {
		const app = new Hono();
		app.get(
			PUBLIC_OCCUPANCY_INTERNAL_PATH,
			createPublicOccupancyHandler({
				readCurrentAndLatestSettings: async () => ({
					current: null,
					settings: null,
				}),
			}),
		);

		const response = await app.request(PUBLIC_OCCUPANCY_INTERNAL_PATH);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("application/json");
		expect(response.headers.get("cache-control")).toBe(
			PUBLIC_OCCUPANCY_CACHE_CONTROL,
		);
		expect(payload).toMatchObject({
			schemaVersion: 1,
			freshness: "unavailable",
			trend: null,
		});
		expect(payload).not.toHaveProperty("count");
		expect(payload).not.toHaveProperty("capacity");
	});

	it("uses one injected instant for a strict closed payload and boundary cache cap", async () => {
		const app = new Hono();
		let clockCalls = 0;
		app.get(
			PUBLIC_OCCUPANCY_INTERNAL_PATH,
			createPublicOccupancyHandler(
				{
					readCurrentAndLatestSettings: async () => ({
						current: null,
						settings: {
							version: 2,
							capacity: 100,
							quietMaxPercent: 25,
							moderateMaxPercent: 50,
							busyMaxPercent: 75,
							timezone: "Asia/Riyadh",
							timeZone: "Asia/Riyadh",
							businessDayBoundary: "04:00",
							pushIntervalSeconds: 20,
							freshForSeconds: 90,
							operationalStaleAfterSeconds: 180,
							publicPollSeconds: 60,
							weeklySchedule: {
								sun: null,
								mon: null,
								tue: null,
								wed: null,
								thu: null,
								fri: { open: "14:00", close: "00:00" },
								sat: { open: "06:00", close: "02:00" },
							},
						},
					}),
				},
				() => {
					clockCalls += 1;
					return new Date("2026-07-17T10:59:45.100Z");
				},
			),
		);

		const response = await app.request(PUBLIC_OCCUPANCY_INTERNAL_PATH);
		expect(clockCalls).toBe(1);
		expect(response.headers.get("cache-control")).toBe(
			"public, s-maxage=14, stale-while-revalidate=60",
		);
		expect(response.headers.get("x-fitway-poll-seconds")).toBe("60");
		expect(await response.json()).toEqual({
			schemaVersion: 1,
			freshness: "closed",
			timeZone: "Asia/Riyadh",
			nextOpenAt: "2026-07-17T11:00:00.000Z",
			computedAt: "2026-07-17T10:59:45.100Z",
			trend: null,
		});
	});
});
