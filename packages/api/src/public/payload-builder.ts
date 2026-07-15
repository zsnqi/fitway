import { assertBandSettings, type OccupancyBand } from "../occupancy/bands";
import {
	assertOccupancySettings,
	type OccupancySettings,
} from "../occupancy/engine";
import {
	assertScheduleSettings,
	evaluateSchedule,
	type ScheduleSettings,
} from "../occupancy/schedule";
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

export type PublicPayloadSettings = OccupancySettings & ScheduleSettings;

export type PublicPayloadRepository = {
	readCurrentAndLatestSettings(): Promise<{
		current: PublicCurrentState | null;
		settings: PublicPayloadSettings | null;
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
	const evaluationNow = Number.isFinite(now.getTime()) ? now : null;
	const computedAt = evaluationNow ?? new Date();
	const unavailable = (): BuiltPublicPayload => ({
		payload: createUnavailablePublicOccupancyPayload(computedAt),
		pollSeconds:
			settings &&
			Number.isInteger(settings.publicPollSeconds) &&
			settings.publicPollSeconds > 0
				? settings.publicPollSeconds
				: null,
	});
	if (!evaluationNow) return unavailable();
	if (!settings) return unavailable();
	try {
		assertScheduleSettings(settings);
		if (
			!Number.isSafeInteger(settings.publicPollSeconds) ||
			settings.publicPollSeconds <= 0
		) {
			return unavailable();
		}
		const schedule = evaluateSchedule(settings, evaluationNow);
		if (!schedule.open) {
			return {
				payload: {
					schemaVersion: 2,
					freshness: "closed",
					timeZone: settings.timeZone,
					nextOpenAt: schedule.nextOpenAt?.toISOString() ?? null,
					computedAt: evaluationNow.toISOString(),
					trend: null,
				},
				pollSeconds: settings.publicPollSeconds,
			};
		}
	} catch {
		return unavailable();
	}
	if (
		!current ||
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
	const age = evaluationNow.getTime() - lastUpdated.getTime();
	if (!Number.isFinite(age) || age < -5_000) return unavailable();
	const freshUntil = new Date(
		lastUpdated.getTime() + settings.freshForSeconds * 1_000,
	);
	const count = current.currentCount;
	return {
		payload: {
			schemaVersion: 2,
			freshness: age <= settings.freshForSeconds * 1_000 ? "fresh" : "stale",
			timeZone: settings.timeZone,
			band: current.band,
			count,
			lastUpdatedAt: lastUpdated.toISOString(),
			freshUntil: freshUntil.toISOString(),
			source: current.source,
			computedAt: evaluationNow.toISOString(),
			trend: null,
		},
		pollSeconds: settings.publicPollSeconds,
	};
}
