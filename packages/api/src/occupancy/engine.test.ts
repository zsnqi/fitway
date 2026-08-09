import { describe, expect, it } from "vitest";
import type { DeviceCommand } from "../commands/schemas";
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
	weeklySchedule: {
		sun: { open: "00:00", close: "00:00" },
		mon: { open: "00:00", close: "00:00" },
		tue: { open: "00:00", close: "00:00" },
		wed: { open: "00:00", close: "00:00" },
		thu: { open: "00:00", close: "00:00" },
		fri: { open: "00:00", close: "00:00" },
		sat: { open: "00:00", close: "00:00" },
	},
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

function fake(
	lastSequence = 0,
	commands: DeviceCommand[] = [],
	settingsAtMinute: OccupancySettings | null = settings,
) {
	const writes: Array<{ kind: string; value: unknown }> = [];
	const settingsLookups: Date[] = [];
	const tx: OccupancyTransaction = {
		lockDevice: async () => ({ id: "device", enabled: true, lastSequence }),
		loadLatestSettings: async () => settings,
		loadSettingsEffectiveAt: async (at) => {
			settingsLookups.push(at);
			return settingsAtMinute;
		},
		upsertMinute: async (value) => void writes.push({ kind: "minute", value }),
		updateCurrent: async (value) =>
			void writes.push({ kind: "current", value }),
		advanceDevice: async (_id, sequence) =>
			void writes.push({ kind: "device", value: sequence }),
		upsertCurrentHealth: async (value) =>
			void writes.push({ kind: "health", value }),
		commandQueue: {
			async reconcile(value) {
				writes.push({ kind: "command_reconciliation", value });
				return commands;
			},
		},
	};
	return {
		writes,
		settingsLookups,
		dependencies: {
			transaction: async <T>(
				work: (value: OccupancyTransaction) => Promise<T>,
			) => work(tx),
			now: () => new Date("2026-07-12T22:30:21.000Z"),
		},
	};
}

describe("occupancy engine", () => {
	it("accepts contiguous backfill with history-only authority", async () => {
		const value = fake();
		const result = await processLivePush(
			"device",
			{
				schemaVersion: 2,
				mode: "backfill",
				sequence: 1,
				minutes: push.minutes,
				appliedCommandId: null,
			},
			value.dependencies,
		);
		expect(result).toMatchObject({
			schemaVersion: 2,
			accepted: true,
			reason: "processed",
			highestProcessedSequence: 1,
		});
		expect(value.writes.map((write) => write.kind)).toEqual([
			"minute",
			"device",
			"command_reconciliation",
		]);
		expect(value.writes[0]?.value).toMatchObject({ source: "backfill" });
	});

	it("settles a stale v2 live request without refreshing current or health", async () => {
		const value = fake();
		const [minute] = push.minutes;
		if (!minute) throw new Error("Expected stale live minute fixture");
		const stale: EdgePushRequest = {
			...push,
			schemaVersion: 2,
			mode: "live",
			observedAt: "2026-07-12T22:20:00.000Z",
			minutes: [
				{
					...minute,
					minuteStart: "2026-07-12T22:20:00.000Z",
				},
			],
		};
		expect(
			await processLivePush("device", stale, value.dependencies),
		).toMatchObject({
			accepted: true,
			reason: "processed",
			highestProcessedSequence: 1,
		});
		expect(value.writes.map((write) => write.kind)).toEqual([
			"command_reconciliation",
			"minute",
			"device",
		]);
	});

	it("does not grant live authority to a future-dated sample", async () => {
		const value = fake();
		const [minute] = push.minutes;
		if (!minute) throw new Error("Expected future live minute fixture");
		const future: EdgePushRequest = {
			...push,
			schemaVersion: 2,
			mode: "live",
			observedAt: "2026-07-12T22:31:21.000Z",
			minutes: [
				{
					...minute,
					minuteStart: "2026-07-12T22:31:00.000Z",
				},
			],
		};
		expect(
			await processLivePush("device", future, value.dependencies),
		).toMatchObject({
			accepted: true,
			reason: "processed",
			highestProcessedSequence: 1,
		});
		expect(value.writes.map((write) => write.kind)).toEqual([
			"command_reconciliation",
			"minute",
			"device",
		]);
	});

	it("snapshots each historical minute with its effective settings", async () => {
		const historical: OccupancySettings = {
			...settings,
			version: 2,
			capacity: 20,
			timezone: "UTC",
			businessDayBoundary: "00:00",
		};
		const value = fake(0, [], historical);
		await processLivePush(
			"device",
			{
				schemaVersion: 2,
				mode: "backfill",
				sequence: 1,
				minutes: [
					{
						minuteStart: "2026-07-12T22:30:00.000Z",
						count: 16,
						entries: 1,
						exits: 0,
					},
				],
				appliedCommandId: null,
			},
			value.dependencies,
		);
		expect(value.settingsLookups).toEqual([
			new Date("2026-07-12T22:30:00.000Z"),
		]);
		expect(value.writes[0]).toMatchObject({
			kind: "minute",
			value: {
				businessDay: "2026-07-12",
				band: "packed",
				capacitySnapshot: 20,
				settingsVersion: 2,
			},
		});
	});

	it("rejects an invalid reconnect sample before delivering a pending command", async () => {
		const command: DeviceCommand = {
			id: 8,
			type: "set_count",
			targetValue: 4,
			issuedAt: "2026-07-12T22:30:20.000Z",
		};
		const value = fake(0, [command]);
		const [minute] = push.minutes;
		if (!minute) {
			throw new Error("Expected reconnect push minute fixture");
		}
		await expect(
			processLivePush(
				"device",
				{
					...push,
					schemaVersion: 2,
					mode: "live",
					minutes: [
						{
							...minute,
							minuteStart: "2026-07-12T22:36:00.000Z",
						},
					],
				},
				value.dependencies,
			),
		).rejects.toMatchObject({ code: "invalid_minute" });
		expect(value.writes).toEqual([]);
	});

	it("delivers pending commands before accepting the reconnecting live sequence", async () => {
		const command: DeviceCommand = {
			id: 8,
			type: "set_count",
			targetValue: 4,
			issuedAt: "2026-07-12T22:30:20.000Z",
		};
		const blocked = fake(0, [command]);
		const reconnect = { ...push, schemaVersion: 2, mode: "live" } as const;
		expect(
			await processLivePush("device", reconnect, blocked.dependencies),
		).toMatchObject({
			schemaVersion: 2,
			accepted: false,
			reason: "commands_pending",
			highestProcessedSequence: 0,
			commands: [command],
		});
		expect(blocked.writes.map((write) => write.kind)).toEqual([
			"command_reconciliation",
		]);

		const resumed = fake();
		expect(
			await processLivePush(
				"device",
				{ ...reconnect, currentCount: 4, appliedCommandId: command.id },
				resumed.dependencies,
			),
		).toMatchObject({
			accepted: true,
			reason: "processed",
			highestProcessedSequence: 1,
			commands: [],
		});
		expect(
			resumed.writes.find((write) => write.kind === "current")?.value,
		).toMatchObject({ currentCount: 4 });
	});

	it("writes the contiguous sequence atomically with floor, snapshot, and business day", async () => {
		const value = fake();
		const result = await processLivePush("device", push, value.dependencies);
		expect(result).toMatchObject({
			accepted: true,
			reason: "processed",
			highestProcessedSequence: 1,
			commands: [],
		});
		expect(value.writes).toHaveLength(5);
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
		expect(value.writes[3]).toMatchObject({
			kind: "health",
			value: {
				sequence: 1,
				processStatus: "ok",
				cameraStatus: "ok",
				feedStatus: "ok",
				detectorFps: 4.8,
				edgeObservedAt: new Date("2026-07-12T22:30:20.000Z"),
				receivedAt: new Date("2026-07-12T22:30:21.000Z"),
				updatedAt: new Date("2026-07-12T22:30:21.000Z"),
			},
		});
		expect(value.writes[4]).toMatchObject({ kind: "command_reconciliation" });
	});

	it("acknowledges and returns commands only inside an accepted contiguous live push", async () => {
		const command: DeviceCommand = {
			id: 8,
			type: "set_count",
			targetValue: 4,
			issuedAt: "2026-07-12T22:30:20.000Z",
		};
		const value = fake(0, [command]);
		const result = await processLivePush(
			"device",
			{ ...push, appliedCommandId: 7 },
			value.dependencies,
		);
		expect(result.commands).toEqual([command]);
		expect(value.writes.slice(-1)).toEqual([
			{
				kind: "command_reconciliation",
				value: {
					deviceId: "device",
					appliedCommandId: 7,
					at: new Date("2026-07-12T22:30:21.000Z"),
				},
			},
		]);
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
