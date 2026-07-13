import { assertBandSettings, type OccupancyBand } from "../occupancy/bands";
import {
	assertOccupancySettings,
	type OccupancySettings,
} from "../occupancy/engine";
import {
	createUnavailablePublicOccupancyPayload,
	type PublicOccupancyPayload,
} from "../public-occupancy";

export type PublicCurrentState = {
	currentCount: number | null;
	band: OccupancyBand | null;
	source: "edge" | "manual" | null;
	lastPushReceivedAt: Date | null;
	activeDeviceEnabled: boolean | null;
};

export type PublicPayloadRepository = {
	readCurrentAndLatestSettings(): Promise<{
		current: PublicCurrentState | null;
		settings: OccupancySettings | null;
	}>;
};

export type BuiltPublicPayload = {
	payload: PublicOccupancyPayload;
	pollSeconds: number | null;
};

export async function buildPublicOccupancyPayload(
	repository: PublicPayloadRepository,
	now: Date = new Date(),
): Promise<BuiltPublicPayload> {
	const { current, settings } = await repository.readCurrentAndLatestSettings();
	const unavailable = (): BuiltPublicPayload => ({
		payload: createUnavailablePublicOccupancyPayload(now),
		pollSeconds:
			settings &&
			Number.isInteger(settings.publicPollSeconds) &&
			settings.publicPollSeconds > 0
				? settings.publicPollSeconds
				: null,
	});
	if (
		!current ||
		!settings ||
		current.currentCount === null ||
		current.currentCount < 0 ||
		!current.band ||
		!current.source ||
		!current.lastPushReceivedAt ||
		current.activeDeviceEnabled !== true
	) {
		return unavailable();
	}
	try {
		assertBandSettings(settings.capacity, settings);
		assertOccupancySettings(settings);
	} catch {
		return unavailable();
	}
	if (
		!Number.isInteger(settings.freshForSeconds) ||
		settings.freshForSeconds <= 0
	) {
		return unavailable();
	}
	const lastUpdated = current.lastPushReceivedAt;
	const age = now.getTime() - lastUpdated.getTime();
	if (!Number.isFinite(age) || age < -5_000) return unavailable();
	const freshUntil = new Date(
		lastUpdated.getTime() + settings.freshForSeconds * 1_000,
	);
	const count = current.currentCount;
	return {
		payload: {
			schemaVersion: 1,
			freshness: age <= settings.freshForSeconds * 1_000 ? "fresh" : "stale",
			band: current.band,
			count,
			percentFull: Math.min(
				100,
				Math.max(0, Math.round((count / settings.capacity) * 100)),
			),
			lastUpdatedAt: lastUpdated.toISOString(),
			freshUntil: freshUntil.toISOString(),
			source: current.source,
			computedAt: now.toISOString(),
			trend: null,
		},
		pollSeconds: settings.publicPollSeconds,
	};
}
