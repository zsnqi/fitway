import type { z } from "zod";
import type { edgeHealthStatusSchema } from "../edge-push";

export type EdgeHealthStatus = z.infer<typeof edgeHealthStatusSchema>;

export type OperationalHealthFreshness = "current" | "stale" | "unavailable";
export type OperationalHealthCondition =
	| "healthy"
	| "degraded"
	| "failed"
	| "unknown";

/**
 * The latest accepted live health persisted for the active device. The
 * repository owns reading this projection; the evaluator never queries.
 */
export type EdgeHealthProjection = {
	deviceId: string;
	sequence: number;
	processStatus: EdgeHealthStatus;
	cameraStatus: EdgeHealthStatus;
	feedStatus: EdgeHealthStatus;
	detectorFps: number | null;
	edgeObservedAt: Date;
	receivedAt: Date;
	updatedAt: Date;
};

export type OperationalHealthActiveDevice = {
	enabled: boolean;
	lastSeenAt: Date | null;
};

/** The frozen ten-field health block returned by `staff.operationalSnapshot`. */
export type OperationalHealth = {
	freshness: OperationalHealthFreshness;
	condition: OperationalHealthCondition;
	process: EdgeHealthStatus | null;
	camera: EdgeHealthStatus | null;
	feed: EdgeHealthStatus | null;
	detectorFps: number | null;
	edgeObservedAt: string | null;
	receivedAt: string | null;
	lastSeenAt: string | null;
	staleAt: string | null;
};

export type EvaluateOperationalHealthInput = {
	device: OperationalHealthActiveDevice | null;
	projection: EdgeHealthProjection | null;
	operationalStaleAfterSeconds: number | null;
	now: Date;
};

function conditionFor(
	process: EdgeHealthStatus,
	camera: EdgeHealthStatus,
	feed: EdgeHealthStatus,
): OperationalHealthCondition {
	const flags = [process, camera, feed];
	if (flags.includes("failed")) return "failed";
	if (flags.includes("degraded")) return "degraded";
	if (flags.includes("unknown")) return "unknown";
	return "healthy";
}

function unavailable(lastSeenAt: Date | null): OperationalHealth {
	return {
		freshness: "unavailable",
		condition: "unknown",
		process: null,
		camera: null,
		feed: null,
		detectorFps: null,
		edgeObservedAt: null,
		receivedAt: null,
		lastSeenAt: lastSeenAt ? lastSeenAt.toISOString() : null,
		staleAt: null,
	};
}

/**
 * Derives operational freshness and condition from a persisted projection.
 *
 * `unavailable` is returned when there is no projection, no usable active
 * device, or a disabled device; every raw field/time is nulled except an
 * independently known `lastSeenAt`. A usable projection is `current` only when
 * its trusted server receipt age is strictly below the settings-driven
 * threshold, `stale` at equality and beyond; stale freshness never erases the
 * last-known flags. Transport/API failure is an error state upstream and is
 * never converted into `unavailable` here.
 */
export function evaluateOperationalHealth(
	input: EvaluateOperationalHealthInput,
): OperationalHealth {
	const { device, projection, operationalStaleAfterSeconds, now } = input;
	const lastSeenAt = device?.lastSeenAt ?? null;
	if (
		!device?.enabled ||
		!projection ||
		operationalStaleAfterSeconds === null ||
		!Number.isSafeInteger(operationalStaleAfterSeconds) ||
		operationalStaleAfterSeconds <= 0
	) {
		return unavailable(lastSeenAt);
	}
	const thresholdMs = operationalStaleAfterSeconds * 1_000;
	const ageMs = now.getTime() - projection.receivedAt.getTime();
	const freshness: OperationalHealthFreshness =
		Number.isFinite(ageMs) && ageMs < thresholdMs ? "current" : "stale";
	const staleAt = new Date(projection.receivedAt.getTime() + thresholdMs);
	return {
		freshness,
		condition: conditionFor(
			projection.processStatus,
			projection.cameraStatus,
			projection.feedStatus,
		),
		process: projection.processStatus,
		camera: projection.cameraStatus,
		feed: projection.feedStatus,
		detectorFps: projection.detectorFps,
		edgeObservedAt: projection.edgeObservedAt.toISOString(),
		receivedAt: projection.receivedAt.toISOString(),
		lastSeenAt: lastSeenAt ? lastSeenAt.toISOString() : null,
		staleAt: staleAt.toISOString(),
	};
}
