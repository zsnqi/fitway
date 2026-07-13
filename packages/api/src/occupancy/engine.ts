import type { EdgePushRequest, EdgePushResponse } from "../edge-push";
import {
	assertBandSettings,
	type BandThresholds,
	bandFor,
	floorOccupancy,
} from "./bands";
import { businessDayFor } from "./business-day";

export type OccupancySettings = BandThresholds & {
	version: number;
	capacity: number;
	timezone: string;
	businessDayBoundary: string;
	pushIntervalSeconds: number;
	freshForSeconds: number;
	operationalStaleAfterSeconds: number;
	publicPollSeconds: number;
};

export type LockedDevice = {
	id: string;
	enabled: boolean;
	lastSequence: number;
};

export type OccupancyTransaction = {
	lockDevice(deviceId: string): Promise<LockedDevice | null>;
	loadLatestSettings(): Promise<OccupancySettings | null>;
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
		source: "live";
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
}

function response(
	accepted: boolean,
	reason: EdgePushResponse["reason"],
	highestProcessedSequence: number,
	settings: OccupancySettings,
	serverTime: Date,
): EdgePushResponse {
	return {
		schemaVersion: 1,
		accepted,
		reason,
		highestProcessedSequence,
		commands: [],
		settings: {
			version: settings.version,
			pushIntervalSeconds: settings.pushIntervalSeconds,
		},
		serverTime: serverTime.toISOString(),
	};
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
				false,
				"replay",
				device.lastSequence,
				settings,
				receivedAt,
			);
		}
		if (input.sequence > device.lastSequence + 1) {
			return response(
				false,
				"sequence_gap",
				device.lastSequence,
				settings,
				receivedAt,
			);
		}

		for (const minute of input.minutes) {
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
			const count = floorOccupancy(minute.count);
			await tx.upsertMinute({
				deviceId,
				minuteStartUtc: minuteStart,
				businessDay: businessDayFor(
					minuteStart,
					settings.timezone,
					settings.businessDayBoundary,
				),
				count,
				entries: minute.entries,
				exits: minute.exits,
				band: bandFor(count, settings.capacity, settings),
				capacitySnapshot: settings.capacity,
				settingsVersion: settings.version,
				source: "live",
				updatedAt: receivedAt,
			});
		}

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
		await tx.advanceDevice(deviceId, input.sequence, receivedAt);
		return response(true, "processed", input.sequence, settings, receivedAt);
	});
}
