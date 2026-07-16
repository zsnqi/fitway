import { z } from "zod";
import { edgeHealthStatusSchema } from "../edge-push";
import {
	buildPublicOccupancyPayload,
	type PublicCurrentState,
	type PublicPayloadSettings,
} from "../public/payload-builder";
import { publicOccupancyPayloadSchema } from "../public-occupancy";
import {
	type EdgeHealthProjection,
	evaluateOperationalHealth,
	type OperationalHealthActiveDevice,
} from "./evaluator";

export const OPERATIONAL_SNAPSHOT_SCHEMA_VERSION = 1 as const;

const canonicalTimestamp = z
	.string()
	.datetime({ offset: false })
	.refine((value) => new Date(value).toISOString() === value);

export const operationalHealthSchema = z
	.object({
		freshness: z.enum(["current", "stale", "unavailable"]),
		condition: z.enum(["healthy", "degraded", "failed", "unknown"]),
		process: edgeHealthStatusSchema.nullable(),
		camera: edgeHealthStatusSchema.nullable(),
		feed: edgeHealthStatusSchema.nullable(),
		detectorFps: z.number().finite().nonnegative().nullable(),
		edgeObservedAt: canonicalTimestamp.nullable(),
		receivedAt: canonicalTimestamp.nullable(),
		lastSeenAt: canonicalTimestamp.nullable(),
		staleAt: canonicalTimestamp.nullable(),
	})
	.strict();

/**
 * The frozen `staff.operationalSnapshot` DTO: the ten-field health block plus
 * schema version, computed time, the public occupancy fields, authorized
 * capacity, and source detail. No speculative Phase 5 command fields exist.
 */
export const operationalSnapshotSchema = z
	.object({
		schemaVersion: z.literal(OPERATIONAL_SNAPSHOT_SCHEMA_VERSION),
		computedAt: canonicalTimestamp,
		occupancy: publicOccupancyPayloadSchema,
		capacity: z.number().int().positive().nullable(),
		source: z.enum(["edge", "manual"]).nullable(),
		health: operationalHealthSchema,
	})
	.strict();

export type OperationalHealthDto = z.infer<typeof operationalHealthSchema>;
export type OperationalSnapshot = z.infer<typeof operationalSnapshotSchema>;

export type OperationalSnapshotInputs = {
	current: PublicCurrentState | null;
	settings: PublicPayloadSettings | null;
	activeDevice: OperationalHealthActiveDevice | null;
	projection: EdgeHealthProjection | null;
};

export type OperationalSnapshotRepository = {
	readOperationalSnapshotInputs(): Promise<OperationalSnapshotInputs>;
};

function authorizedCapacity(
	settings: PublicPayloadSettings | null,
): number | null {
	if (!settings) return null;
	const { capacity } = settings;
	return Number.isSafeInteger(capacity) && capacity > 0 ? capacity : null;
}

/**
 * Reads the snapshot inputs once and composes the frozen DTO. Occupancy reuses
 * the shared public payload builder so no consumer recomputes it; the evaluator
 * owns freshness and condition. A read/transport failure propagates as an error
 * rather than being converted into an `unavailable` state.
 */
export async function buildOperationalSnapshot(
	repository: OperationalSnapshotRepository,
	now: Date = new Date(),
): Promise<OperationalSnapshot> {
	const inputs = await repository.readOperationalSnapshotInputs();
	const evaluationNow = Number.isFinite(now.getTime()) ? now : new Date();
	const { payload: occupancy } = await buildPublicOccupancyPayload(
		{
			readCurrentAndLatestSettings: async () => ({
				current: inputs.current,
				settings: inputs.settings,
			}),
		},
		evaluationNow,
	);
	const health = evaluateOperationalHealth({
		device: inputs.activeDevice,
		projection: inputs.projection,
		operationalStaleAfterSeconds:
			inputs.settings?.operationalStaleAfterSeconds ?? null,
		now: evaluationNow,
	});
	return {
		schemaVersion: OPERATIONAL_SNAPSHOT_SCHEMA_VERSION,
		computedAt: evaluationNow.toISOString(),
		occupancy,
		capacity: authorizedCapacity(inputs.settings),
		source: inputs.current?.source ?? null,
		health,
	};
}
