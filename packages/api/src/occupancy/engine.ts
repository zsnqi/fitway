import type { CommandQueue } from "../commands/queue";
import type { DeviceCommand } from "../commands/schemas";
import type {
	EdgeHealthStatus,
	EdgePushRequest,
	EdgePushResponse,
} from "../edge-push";
import { decidePushAuthority } from "../offline/reconciliation";
import {
	assertBandSettings,
	type BandThresholds,
	bandFor,
	floorOccupancy,
} from "./bands";
import { businessDayFor } from "./business-day";
import { assertScheduleSettings, type WeeklySchedule } from "./schedule";

export type OccupancySettings = BandThresholds & {
	version: number;
	capacity: number;
	timezone: string;
	businessDayBoundary: string;
	pushIntervalSeconds: number;
	freshForSeconds: number;
	operationalStaleAfterSeconds: number;
	publicPollSeconds: number;
	weeklySchedule: WeeklySchedule;
};

export type LockedDevice = {
	id: string;
	enabled: boolean;
	lastSequence: number;
};

export type OccupancyTransaction = {
	lockDevice(deviceId: string): Promise<LockedDevice | null>;
	loadLatestSettings(): Promise<OccupancySettings | null>;
	loadSettingsEffectiveAt(at: Date): Promise<OccupancySettings | null>;
	upsertMinute(value: {
		deviceId: string;
		minuteStartUtc: Date;
		businessDay: string;
		count: number;
		entries: number;
		exits: number;
		band: "quiet" | "moderate" | "busy" | "packed";
		capacitySnapshot: number;
		settingsVersion: number;
		source: "live" | "backfill";
		updatedAt: Date;
	}): Promise<void>;
	updateCurrent(value: {
		currentCount: number;
		band: "quiet" | "moderate" | "busy" | "packed";
		source: "edge";
		lastPushReceivedAt: Date;
		lastEdgeReportedAt: Date;
		activeDeviceId: string;
		settingsVersion: number;
		updatedAt: Date;
	}): Promise<void>;
	advanceDevice(
		deviceId: string,
		sequence: number,
		receivedAt: Date,
	): Promise<void>;
	upsertCurrentHealth(value: {
		deviceId: string;
		sequence: number;
		processStatus: EdgeHealthStatus;
		cameraStatus: EdgeHealthStatus;
		feedStatus: EdgeHealthStatus;
		detectorFps: number | null;
		edgeObservedAt: Date;
		receivedAt: Date;
		updatedAt: Date;
	}): Promise<void>;
	commandQueue: CommandQueue;
};

export type OccupancyEngineDependencies = {
	transaction<T>(work: (tx: OccupancyTransaction) => Promise<T>): Promise<T>;
	now?: () => Date;
};

export class OccupancyEngineError extends Error {
	constructor(
		message: string,
		readonly code:
			| "device_unavailable"
			| "settings_unavailable"
			| "invalid_minute",
	) {
		super(message);
	}
}

export function assertOccupancySettings(settings: OccupancySettings): void {
	assertBandSettings(settings.capacity, settings);
	for (const [name, value] of [
		["version", settings.version],
		["push interval", settings.pushIntervalSeconds],
		["fresh window", settings.freshForSeconds],
		["public poll", settings.publicPollSeconds],
	] as const) {
		if (!Number.isSafeInteger(value) || value <= 0) {
			throw new RangeError(`${name} must be a positive safe integer`);
		}
	}
	if (
		!Number.isSafeInteger(settings.operationalStaleAfterSeconds) ||
		settings.operationalStaleAfterSeconds <= settings.freshForSeconds
	) {
		throw new RangeError("Operational stale threshold must follow freshness");
	}
	businessDayFor(new Date(0), settings.timezone, settings.businessDayBoundary);
	assertScheduleSettings({
		timeZone: settings.timezone,
		weeklySchedule: settings.weeklySchedule,
	});
}

function response(
	schemaVersion: 1 | 2,
	accepted: boolean,
	reason: EdgePushResponse["reason"],
	highestProcessedSequence: number,
	settings: OccupancySettings,
	serverTime: Date,
	commands: DeviceCommand[] = [],
): EdgePushResponse {
	const base = {
		accepted,
		reason,
		highestProcessedSequence,
		commands,
		serverTime: serverTime.toISOString(),
	};
	if (schemaVersion === 1) {
		return {
			...base,
			schemaVersion,
			settings: {
				version: settings.version,
				pushIntervalSeconds: settings.pushIntervalSeconds,
			},
		} as EdgePushResponse;
	}
	return {
		...base,
		schemaVersion,
		settings: {
			version: settings.version,
			pushIntervalSeconds: settings.pushIntervalSeconds,
			timezone: settings.timezone,
			businessDayBoundary: settings.businessDayBoundary,
			weeklySchedule: settings.weeklySchedule,
		},
	} as EdgePushResponse;
}

export async function processLivePush(
	deviceId: string,
	input: EdgePushRequest,
	dependencies: OccupancyEngineDependencies,
): Promise<EdgePushResponse> {
	const receivedAt = dependencies.now?.() ?? new Date();
	return dependencies.transaction(async (tx) => {
		const device = await tx.lockDevice(deviceId);
		if (!device?.enabled) {
			throw new OccupancyEngineError(
				"Device unavailable",
				"device_unavailable",
			);
		}
		const settings = await tx.loadLatestSettings();
		if (!settings) {
			throw new OccupancyEngineError(
				"Settings unavailable",
				"settings_unavailable",
			);
		}
		assertOccupancySettings(settings);

		if (input.sequence <= device.lastSequence) {
			return response(
				input.schemaVersion,
				false,
				"replay",
				device.lastSequence,
				settings,
				receivedAt,
			);
		}
		if (input.sequence > device.lastSequence + 1) {
			return response(
				input.schemaVersion,
				false,
				"sequence_gap",
				device.lastSequence,
				settings,
				receivedAt,
			);
		}

		const mode = input.schemaVersion === 1 ? "live" : input.mode;
		const validatedMinutes = input.minutes.map((minute) => {
			const minuteStart = new Date(minute.minuteStart);
			if (
				minuteStart.getUTCSeconds() !== 0 ||
				minuteStart.getUTCMilliseconds() !== 0 ||
				minuteStart.getTime() > receivedAt.getTime() + 5 * 60_000
			) {
				throw new OccupancyEngineError(
					"Minute bucket is invalid or too far in the future",
					"invalid_minute",
				);
			}
			return {
				minute,
				minuteStart,
				count: floorOccupancy(minute.count),
			};
		});
		let commands: DeviceCommand[] = [];
		if (input.schemaVersion === 2 && mode === "live") {
			commands = await tx.commandQueue.reconcile({
				deviceId,
				appliedCommandId: input.appliedCommandId,
				at: receivedAt,
			});
		}
		const liveSampleAgeMs =
			"observedAt" in input
				? receivedAt.getTime() - new Date(input.observedAt).getTime()
				: null;
		const authority = decidePushAuthority({
			schemaVersion: input.schemaVersion,
			mode,
			hasPendingCommand: commands.length > 0,
			liveSampleFresh:
				liveSampleAgeMs !== null &&
				liveSampleAgeMs >= 0 &&
				liveSampleAgeMs <= settings.freshForSeconds * 1_000,
		});
		if (!authority.advanceSequence) {
			return response(
				input.schemaVersion,
				false,
				"commands_pending",
				device.lastSequence,
				settings,
				receivedAt,
				commands,
			);
		}

		for (const { minute, minuteStart, count } of authority.writeHistory
			? validatedMinutes
			: []) {
			const minuteSettings = await tx.loadSettingsEffectiveAt(minuteStart);
			if (!minuteSettings) {
				throw new OccupancyEngineError(
					"Settings unavailable for minute",
					"settings_unavailable",
				);
			}
			assertOccupancySettings(minuteSettings);
			await tx.upsertMinute({
				deviceId,
				minuteStartUtc: minuteStart,
				businessDay: businessDayFor(
					minuteStart,
					minuteSettings.timezone,
					minuteSettings.businessDayBoundary,
				),
				count,
				entries: minute.entries,
				exits: minute.exits,
				band: bandFor(count, minuteSettings.capacity, minuteSettings),
				capacitySnapshot: minuteSettings.capacity,
				settingsVersion: minuteSettings.version,
				source: mode === "backfill" ? "backfill" : "live",
				updatedAt: receivedAt,
			});
		}

		if (authority.writeCurrent && "currentCount" in input) {
			const currentCount = floorOccupancy(input.currentCount);
			await tx.updateCurrent({
				currentCount,
				band: bandFor(currentCount, settings.capacity, settings),
				source: "edge",
				lastPushReceivedAt: receivedAt,
				lastEdgeReportedAt: new Date(input.observedAt),
				activeDeviceId: deviceId,
				settingsVersion: settings.version,
				updatedAt: receivedAt,
			});
		}
		await tx.advanceDevice(deviceId, input.sequence, receivedAt);
		if (authority.writeHealth && "health" in input) {
			await tx.upsertCurrentHealth({
				deviceId,
				sequence: input.sequence,
				processStatus: input.health.process,
				cameraStatus: input.health.camera,
				feedStatus: input.health.feed,
				detectorFps: input.health.detectorFps,
				edgeObservedAt: new Date(input.observedAt),
				receivedAt,
				updatedAt: receivedAt,
			});
		}
		if (input.schemaVersion === 1 || mode === "backfill") {
			commands = await tx.commandQueue.reconcile({
				deviceId,
				appliedCommandId: input.appliedCommandId,
				at: receivedAt,
			});
		}
		return response(
			input.schemaVersion,
			true,
			"processed",
			input.sequence,
			settings,
			receivedAt,
			commands,
		);
	});
}
