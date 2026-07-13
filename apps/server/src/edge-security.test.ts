import { describe, expect, it } from "vitest";
import {
	authenticateDevice,
	hashDeviceToken,
	parseBearerToken,
} from "./edge-auth";
import { DeviceRateLimiter } from "./rate-limiter";

const token = "a".repeat(43);
describe("edge authentication and rate limiting", () => {
	it("uses one strict bearer credential and one indistinguishable failure", async () => {
		expect(parseBearerToken(undefined)).toBeNull();
		expect(parseBearerToken("Basic x")).toBeNull();
		expect(parseBearerToken(`Bearer ${token},Bearer other`)).toBeNull();
		const hash = hashDeviceToken(token);
		expect(hash).toMatch(/^[0-9a-f]{64}$/);
		expect(
			await authenticateDevice(`Bearer ${token}`, async (value) =>
				value === hash ? { id: "d", name: "dev", enabled: true } : null,
			),
		).toMatchObject({ id: "d" });
		expect(
			await authenticateDevice(`Bearer ${token}`, async () => ({
				id: "d",
				name: "dev",
				enabled: false,
			})),
		).toBeNull();
	});

	it("allows a three-request burst, isolates keys, refills and reports retry time", () => {
		let now = 0;
		const limiter = new DeviceRateLimiter(() => now);
		expect(
			[limiter.consume("a"), limiter.consume("a"), limiter.consume("a")].every(
				(x) => x.allowed,
			),
		).toBe(true);
		expect(limiter.consume("a")).toEqual({
			allowed: false,
			retryAfterSeconds: 5,
		});
		expect(limiter.consume("b").allowed).toBe(true);
		now = 5_000;
		expect(limiter.consume("a").allowed).toBe(true);
	});
});
