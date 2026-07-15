import { describe, expect, it } from "vitest";
import {
	buildPublicOccupancyPayload,
	type PublicCurrentState,
	type PublicPayloadRepository,
	type PublicPayloadSettings,
} from "./payload-builder";

const weeklySchedule = {
	sun: { open: "06:00", close: "02:00" },
	mon: { open: "06:00", close: "02:00" },
	tue: { open: "06:00", close: "02:00" },
	wed: { open: "06:00", close: "02:00" },
	thu: { open: "06:00", close: "02:00" },
	fri: { open: "14:00", close: "00:00" },
	sat: { open: "06:00", close: "02:00" },
} as const;

const settings: PublicPayloadSettings = {
	version: 2,
	capacity: 100,
	quietMaxPercent: 25,
	moderateMaxPercent: 50,
	busyMaxPercent: 75,
	timezone: "Asia/Riyadh",
	timeZone: "Asia/Riyadh",
	weeklySchedule,
	businessDayBoundary: "04:00",
	pushIntervalSeconds: 20,
	freshForSeconds: 90,
	operationalStaleAfterSeconds: 180,
	publicPollSeconds: 60,
};

const current: PublicCurrentState = {
	currentCount: 150,
	band: "packed",
	source: "edge",
	lastPushReceivedAt: new Date("2026-07-16T22:59:30.000Z"),
	activeDeviceEnabled: true,
};

function repository(
	overrides: {
		settings?: PublicPayloadSettings | null;
		current?: PublicCurrentState | null;
	} = {},
): PublicPayloadRepository {
	return {
		readCurrentAndLatestSettings: async () => ({
			settings:
				overrides.settings === undefined ? settings : overrides.settings,
			current: overrides.current === undefined ? current : overrides.current,
		}),
	};
}

describe("public payload builder", () => {
	it("returns exact unavailable when settings are missing", async () => {
		const built = await buildPublicOccupancyPayload(
			repository({ settings: null, current: null }),
			new Date("2026-07-16T23:00:00.000Z"),
		);
		expect(built).toEqual({
			payload: {
				schemaVersion: 2,
				freshness: "unavailable",
				computedAt: "2026-07-16T23:00:00.000Z",
				trend: null,
			},
			pollSeconds: null,
		});
	});

	it("turns an invalid evaluation date into a canonical unavailable payload", async () => {
		const built = await buildPublicOccupancyPayload(
			repository(),
			new Date("invalid"),
		);
		expect(built.payload.freshness).toBe("unavailable");
		expect(() =>
			new Date(built.payload.computedAt).toISOString(),
		).not.toThrow();
		expect(built.pollSeconds).toBe(60);
	});

	it("returns a strict closed payload before inspecting occupancy state", async () => {
		const closedAt = new Date("2026-07-16T23:00:00.000Z");
		for (const value of [
			current,
			{ ...current, lastPushReceivedAt: new Date("2026-07-16T20:00:00Z") },
			null,
			{ ...current, activeDeviceEnabled: false },
			{ ...current, lastPushReceivedAt: new Date("invalid") },
			{ ...current, lastPushReceivedAt: new Date("2026-07-17T12:00:00Z") },
		] satisfies Array<PublicCurrentState | null>) {
			const built = await buildPublicOccupancyPayload(
				repository({ current: value }),
				closedAt,
			);
			expect(built).toEqual({
				payload: {
					schemaVersion: 2,
					freshness: "closed",
					timeZone: "Asia/Riyadh",
					nextOpenAt: "2026-07-17T11:00:00.000Z",
					computedAt: "2026-07-16T23:00:00.000Z",
					trend: null,
				},
				pollSeconds: 60,
			});
			expect(built.payload).not.toHaveProperty("count");
		}
	});

	it("allows a valid closed schedule to override invalid occupancy-only settings", async () => {
		const built = await buildPublicOccupancyPayload(
			repository({ settings: { ...settings, capacity: 0 } }),
			new Date("2026-07-16T23:00:00.000Z"),
		);
		expect(built.payload.freshness).toBe("closed");
	});

	it("returns unavailable for invalid schedule, timezone, or polling", async () => {
		for (const value of [
			{
				...settings,
				weeklySchedule: {
					...weeklySchedule,
					fri: { open: "bad", close: "00:00" },
				},
			},
			{ ...settings, timeZone: "Not/AZone" },
			{ ...settings, publicPollSeconds: 0 },
		]) {
			const built = await buildPublicOccupancyPayload(
				repository({ settings: value }),
				new Date("2026-07-16T23:00:00.000Z"),
			);
			expect(built.payload.freshness).toBe("unavailable");
		}
	});

	it("retains fresh and stale projection while open and adds only timezone metadata", async () => {
		const pushed = new Date("2026-07-17T11:00:00.000Z");
		for (const [age, expected] of [
			[90_000, "fresh"],
			[90_001, "stale"],
			[180_000, "stale"],
		] as const) {
			const built = await buildPublicOccupancyPayload(
				repository({ current: { ...current, lastPushReceivedAt: pushed } }),
				new Date(pushed.getTime() + age),
			);
			expect(built.payload).toMatchObject({
				freshness: expected,
				timeZone: "Asia/Riyadh",
				count: 150,
				band: "packed",
				freshUntil: "2026-07-17T11:01:30.000Z",
			});
			expect(built.payload).not.toHaveProperty("open");
			expect(built.payload).not.toHaveProperty("percentFull");
		}
	});

	it("returns unavailable during open hours for invalid current data or occupancy settings", async () => {
		for (const value of [
			repository({ current: null }),
			repository({ current: { ...current, activeDeviceEnabled: false } }),
			repository({ settings: { ...settings, capacity: 0 } }),
		]) {
			const built = await buildPublicOccupancyPayload(
				value,
				new Date("2026-07-17T11:30:00.000Z"),
			);
			expect(built.payload.freshness).toBe("unavailable");
			expect(built.pollSeconds).toBe(60);
		}
	});

	it("round-trips an all-days-closed schedule with no next opening", async () => {
		const allClosed = Object.fromEntries(
			Object.keys(weeklySchedule).map((day) => [day, null]),
		) as unknown as PublicPayloadSettings["weeklySchedule"];
		const built = await buildPublicOccupancyPayload(
			repository({ settings: { ...settings, weeklySchedule: allClosed } }),
			new Date("2026-07-17T11:30:00.000Z"),
		);
		expect(built.payload).toMatchObject({
			freshness: "closed",
			nextOpenAt: null,
		});
	});
});
