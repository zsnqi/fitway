import { describe, expect, it } from "vitest";
import type { PublicPayloadSettings } from "../public/payload-builder";
import type { EdgeHealthProjection } from "./evaluator";
import {
	buildOperationalSnapshot,
	type OperationalSnapshotInputs,
	type OperationalSnapshotRepository,
	operationalSnapshotSchema,
} from "./snapshot";

const now = new Date("2026-07-16T12:00:00.000Z");
const recent = new Date(now.getTime() - 1_000);

const alwaysOpen = {
	open: "00:00",
	close: "00:00",
} as const;

const settings: PublicPayloadSettings = {
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
		sun: alwaysOpen,
		mon: alwaysOpen,
		tue: alwaysOpen,
		wed: alwaysOpen,
		thu: alwaysOpen,
		fri: alwaysOpen,
		sat: alwaysOpen,
	},
};

function projection(
	overrides: Partial<EdgeHealthProjection> = {},
): EdgeHealthProjection {
	return {
		deviceId: "22222222-2222-2222-2222-222222222222",
		sequence: 9,
		processStatus: "ok",
		cameraStatus: "ok",
		feedStatus: "ok",
		detectorFps: 4,
		edgeObservedAt: recent,
		receivedAt: recent,
		updatedAt: recent,
		...overrides,
	};
}

function repository(
	inputs: OperationalSnapshotInputs,
): OperationalSnapshotRepository {
	return { readOperationalSnapshotInputs: async () => inputs };
}

describe("buildOperationalSnapshot", () => {
	it("composes the frozen DTO for a fresh edge push", async () => {
		const snapshot = await buildOperationalSnapshot(
			repository({
				current: {
					currentCount: 12,
					band: "moderate",
					source: "edge",
					lastPushReceivedAt: recent,
					activeDeviceEnabled: true,
				},
				settings,
				activeDevice: { enabled: true, lastSeenAt: recent },
				projection: projection(),
			}),
			now,
		);
		expect(() => operationalSnapshotSchema.parse(snapshot)).not.toThrow();
		expect(snapshot.schemaVersion).toBe(1);
		expect(snapshot.computedAt).toBe(now.toISOString());
		expect(snapshot.capacity).toBe(100);
		expect(snapshot.source).toBe("edge");
		expect(snapshot.occupancy).toMatchObject({
			schemaVersion: 2,
			freshness: "fresh",
			band: "moderate",
			count: 12,
		});
		expect(snapshot.health).toMatchObject({
			freshness: "current",
			condition: "healthy",
			process: "ok",
			detectorFps: 4,
			lastSeenAt: recent.toISOString(),
		});
		expect(Object.keys(snapshot).sort()).toEqual([
			"capacity",
			"computedAt",
			"health",
			"occupancy",
			"schemaVersion",
			"source",
		]);
	});

	it("keeps health availability independent from a fresh manual occupancy", async () => {
		const snapshot = await buildOperationalSnapshot(
			repository({
				current: {
					currentCount: 5,
					band: "quiet",
					source: "manual",
					lastPushReceivedAt: recent,
					activeDeviceEnabled: true,
				},
				settings,
				activeDevice: { enabled: true, lastSeenAt: recent },
				projection: null,
			}),
			now,
		);
		expect(snapshot.occupancy).toMatchObject({
			freshness: "fresh",
			source: "manual",
		});
		expect(snapshot.source).toBe("manual");
		expect(snapshot.health).toMatchObject({
			freshness: "unavailable",
			condition: "unknown",
			process: null,
			receivedAt: null,
			staleAt: null,
			lastSeenAt: recent.toISOString(),
		});
	});

	it("reports both surfaces unavailable for a disabled active device", async () => {
		const disabledSince = new Date("2026-07-16T09:00:00.000Z");
		const snapshot = await buildOperationalSnapshot(
			repository({
				current: {
					currentCount: 8,
					band: "quiet",
					source: "edge",
					lastPushReceivedAt: recent,
					activeDeviceEnabled: false,
				},
				settings,
				activeDevice: { enabled: false, lastSeenAt: disabledSince },
				projection: projection(),
			}),
			now,
		);
		expect(() => operationalSnapshotSchema.parse(snapshot)).not.toThrow();
		expect(snapshot.occupancy).toMatchObject({ freshness: "unavailable" });
		expect(snapshot.health).toMatchObject({
			freshness: "unavailable",
			lastSeenAt: disabledSince.toISOString(),
		});
	});

	it("nulls authorized capacity and reports unavailable when settings are missing", async () => {
		const snapshot = await buildOperationalSnapshot(
			repository({
				current: null,
				settings: null,
				activeDevice: null,
				projection: null,
			}),
			now,
		);
		expect(() => operationalSnapshotSchema.parse(snapshot)).not.toThrow();
		expect(snapshot.capacity).toBeNull();
		expect(snapshot.source).toBeNull();
		expect(snapshot.occupancy).toMatchObject({ freshness: "unavailable" });
		expect(snapshot.health).toMatchObject({
			freshness: "unavailable",
			lastSeenAt: null,
		});
	});
});
