import { EDGE_PUSH_INTERNAL_PATH } from "@fitway/api/edge-push";
import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { hashDeviceToken } from "./edge-auth";
import { createEdgePushHandler } from "./edge-push";
import { DeviceRateLimiter } from "./rate-limiter";

const token = "a".repeat(43);

describe("edge push transport", () => {
	it("returns the same minimal no-store 401 for missing and unknown credentials", async () => {
		const app = new Hono();
		app.post(
			EDGE_PUSH_INTERNAL_PATH,
			createEdgePushHandler({
				findDeviceByHash: async () => null,
				limiter: new DeviceRateLimiter(),
				engine: {
					transaction: async () => Promise.reject(new Error("unused")),
				},
			}),
		);
		for (const authorization of [undefined, `Bearer ${token}`]) {
			const response = await app.request(EDGE_PUSH_INTERNAL_PATH, {
				method: "POST",
				headers: authorization ? { Authorization: authorization } : undefined,
			});
			expect(response.status).toBe(401);
			expect(response.headers.get("cache-control")).toBe("no-store");
			expect(await response.json()).toEqual({ error: "unauthorized" });
		}
	});

	it("authenticates before an isolated limiter and never calls the engine on 429", async () => {
		let domainCalls = 0;
		const hash = hashDeviceToken(token);
		const app = new Hono();
		app.post(
			EDGE_PUSH_INTERNAL_PATH,
			createEdgePushHandler({
				findDeviceByHash: async (value) =>
					value === hash ? { id: "device", name: "dev", enabled: true } : null,
				limiter: new DeviceRateLimiter(() => 0),
				engine: {
					transaction: async () => {
						domainCalls += 1;
						throw new Error("unused");
					},
				},
			}),
		);
		for (let index = 0; index < 3; index += 1) {
			const response = await app.request(EDGE_PUSH_INTERNAL_PATH, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: "{}",
			});
			expect(response.status).toBe(422);
		}
		const limited = await app.request(EDGE_PUSH_INTERNAL_PATH, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: "{}",
		});
		expect(limited.status).toBe(429);
		expect(limited.headers.get("retry-after")).toBe("5");
		expect(domainCalls).toBe(0);
	});

	it("requires JSON media type after authentication and cannot trust a spoofed proxy header for HTTPS", async () => {
		const hash = hashDeviceToken(token);
		const dependencies = {
			findDeviceByHash: async (value: string) =>
				value === hash ? { id: "device", name: "dev", enabled: true } : null,
			limiter: new DeviceRateLimiter(),
			engine: { transaction: async () => Promise.reject(new Error("unused")) },
		};
		const local = new Hono();
		local.post(EDGE_PUSH_INTERNAL_PATH, createEdgePushHandler(dependencies));
		expect(
			(
				await local.request(EDGE_PUSH_INTERNAL_PATH, {
					method: "POST",
					headers: { Authorization: `Bearer ${token}` },
					body: "{}",
				})
			).status,
		).toBe(415);
		const production = new Hono();
		production.post(
			EDGE_PUSH_INTERNAL_PATH,
			createEdgePushHandler({ ...dependencies, requireHttps: true }),
		);
		expect(
			(
				await production.request(EDGE_PUSH_INTERNAL_PATH, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
						"X-Forwarded-Proto": "https",
					},
					body: "{}",
				})
			).status,
		).toBe(400);
	});
});
