import {
	PUBLIC_OCCUPANCY_CACHE_CONTROL,
	PUBLIC_OCCUPANCY_INTERNAL_PATH,
} from "@fitway/api/public-occupancy";
import { Hono } from "hono";
import { describe, expect, it } from "vitest";

import { publicOccupancyHandler } from "./public-occupancy";

describe("public occupancy endpoint", () => {
	it("responds without auth or database context", async () => {
		const app = new Hono();
		app.get(PUBLIC_OCCUPANCY_INTERNAL_PATH, publicOccupancyHandler);

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
});
