import type { EdgeHealthProjection } from "@fitway/api/health/evaluator";
import type {
	OperationalSnapshotInputs,
	OperationalSnapshotRepository,
} from "@fitway/api/health/snapshot";
import { db } from "@fitway/db";
import {
	currentState,
	edgeCurrentHealth,
	edgeDevices,
} from "@fitway/db/schema/application";
import { eq } from "drizzle-orm";
import { createPublicPayloadRepository } from "./occupancy-repositories";

type Database = typeof db;

/**
 * Reads the operational-snapshot inputs. Occupancy inputs come from the shared
 * public payload path; the active device (from the current-state pointer) and
 * its persisted `edgeCurrentHealth` projection feed the health evaluator. The
 * repository only reads — it never derives freshness or condition.
 */
export function createHealthSnapshotRepository(
	database: Database,
): OperationalSnapshotRepository {
	const publicRepository = createPublicPayloadRepository(database);
	return {
		async readOperationalSnapshotInputs(): Promise<OperationalSnapshotInputs> {
			const { current, settings } =
				await publicRepository.readCurrentAndLatestSettings();
			const [row] = await database
				.select({
					activeDeviceId: currentState.activeDeviceId,
					deviceEnabled: edgeDevices.enabled,
					deviceLastSeenAt: edgeDevices.lastSeenAt,
					projectionDeviceId: edgeCurrentHealth.deviceId,
					sequence: edgeCurrentHealth.sequence,
					processStatus: edgeCurrentHealth.processStatus,
					cameraStatus: edgeCurrentHealth.cameraStatus,
					feedStatus: edgeCurrentHealth.feedStatus,
					detectorFps: edgeCurrentHealth.detectorFps,
					edgeObservedAt: edgeCurrentHealth.edgeObservedAt,
					receivedAt: edgeCurrentHealth.receivedAt,
					updatedAt: edgeCurrentHealth.updatedAt,
				})
				.from(currentState)
				.leftJoin(edgeDevices, eq(currentState.activeDeviceId, edgeDevices.id))
				.leftJoin(
					edgeCurrentHealth,
					eq(currentState.activeDeviceId, edgeCurrentHealth.deviceId),
				)
				.where(eq(currentState.id, 1))
				.limit(1);

			const activeDevice = row?.activeDeviceId
				? {
						enabled: row.deviceEnabled ?? false,
						lastSeenAt: row.deviceLastSeenAt ?? null,
					}
				: null;

			const projection: EdgeHealthProjection | null =
				row?.projectionDeviceId &&
				row.processStatus &&
				row.cameraStatus &&
				row.feedStatus &&
				row.edgeObservedAt &&
				row.receivedAt &&
				row.updatedAt
					? {
							deviceId: row.projectionDeviceId,
							sequence: row.sequence ?? 0,
							processStatus: row.processStatus,
							cameraStatus: row.cameraStatus,
							feedStatus: row.feedStatus,
							detectorFps: row.detectorFps ?? null,
							edgeObservedAt: row.edgeObservedAt,
							receivedAt: row.receivedAt,
							updatedAt: row.updatedAt,
						}
					: null;

			return { current, settings, activeDevice, projection };
		},
	};
}

export const healthSnapshotRepository = createHealthSnapshotRepository(db);
