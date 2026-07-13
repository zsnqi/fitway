import { describe, expect, it } from "vitest";
import type { EdgePushRequest } from "../edge-push";
import {
	type OccupancySettings,
	type OccupancyTransaction,
	processLivePush,
} from "./engine";

const settings: OccupancySettings = {
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
const push: EdgePushRequest = {
	schemaVersion: 1,
	sequence: 1,
	observedAt: "2026-07-12T22:30:20.000Z",
	currentCount: -2,
	minutes: [
		{
			minuteStart: "2026-07-12T22:30:00.000Z",
			count: -1,
			entries: 2,
			exits: 4,
		},
	],
	health: { process: "ok", camera: "ok", feed: "ok", detectorFps: 4.8 },
	appliedCommandId: null,
};

function fake(lastSequence = 0) {
	const writes: Array<{ kind: string; value: unknown }> = [];
	const tx: OccupancyTransaction = {
		lockDevice: async () => ({ id: "device", enabled: true, lastSequence }),
		loadLatestSettings: async () => settings,
		upsertMinute: async (value) => void writes.push({ kind: "minute", value }),
		updateCurrent: async (value) =>
			void writes.push({ kind: "current", value }),
		advanceDevice: async (_id, sequence) =>
			void writes.push({ kind: "device", value: sequence }),
	};
	return {
		writes,
		dependencies: {
			transaction: async <T>(
				work: (value: OccupancyTransaction) => Promise<T>,
			) => work(tx),
			now: () => new Date("2026-07-12T22:30:21.000Z"),
		},
	};
}

describe("occupancy engine", () => {
	it("writes the contiguous sequence atomically with floor, snapshot, and business day", async () => {
		const value = fake();
		const result = await processLivePush("device", push, value.dependencies);
		expect(result).toMatchObject({
			accepted: true,
			reason: "processed",
			highestProcessedSequence: 1,
			commands: [],
		});
		expect(value.writes).toHaveLength(3);
		expect(value.writes[0]?.value).toMatchObject({
			count: 0,
			entries: 2,
			exits: 4,
			band: "quiet",
			businessDay: "2026-07-12",
			source: "live",
		});
		expect(value.writes[1]?.value).toMatchObject({
			currentCount: 0,
			source: "edge",
			settingsVersion: 1,
		});
	});

	it("acknowledges replay and gap without any mutation", async () => {
		const replay = fake(1);
		expect(
			await processLivePush("device", push, replay.dependencies),
		).toMatchObject({
			accepted: false,
			reason: "replay",
			highestProcessedSequence: 1,
		});
		expect(replay.writes).toEqual([]);
		const gap = fake(0);
		expect(
			await processLivePush(
				"device",
				{ ...push, sequence: 2 },
				gap.dependencies,
			),
		).toMatchObject({
			accepted: false,
			reason: "sequence_gap",
			highestProcessedSequence: 0,
		});
		expect(gap.writes).toEqual([]);
	});
});
