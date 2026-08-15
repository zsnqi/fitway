import {
	buildHealthIncidentSummary,
	type HealthAlertRow,
	type HealthIncidentSummary,
	type HealthSettingsVersion,
	type HealthTransitionRow,
	healthAlertLookbackStart,
} from "@fitway/api/health/incidents";
import type { db } from "@fitway/db";
import {
	alertLog,
	edgeHealthLog,
	settingsVersions,
} from "@fitway/db/schema/application";
import { asc, gte } from "drizzle-orm";

type Database = typeof db;

function normalizeDatabaseTime(value: string): string {
	return value.length === 5 ? value : value.slice(0, 8);
}

function scheduleHours(open: string | null, close: string | null) {
	if (open === null && close === null) return null;
	if (open === null || close === null) {
		throw new Error("Stored health schedule has an incomplete weekday pair");
	}
	return {
		open: normalizeDatabaseTime(open),
		close: normalizeDatabaseTime(close),
	};
}

/** The stored settings row as the schedule and business-day primitives need it. */
export function mapHealthSettings(
	row: typeof settingsVersions.$inferSelect,
): HealthSettingsVersion {
	return {
		version: row.version,
		effectiveFrom: row.effectiveFrom,
		timeZone: row.timezone,
		businessDayBoundary: normalizeDatabaseTime(row.businessDayBoundary),
		weeklySchedule: {
			sun: scheduleHours(row.scheduleSunOpen, row.scheduleSunClose),
			mon: scheduleHours(row.scheduleMonOpen, row.scheduleMonClose),
			tue: scheduleHours(row.scheduleTueOpen, row.scheduleTueClose),
			wed: scheduleHours(row.scheduleWedOpen, row.scheduleWedClose),
			thu: scheduleHours(row.scheduleThuOpen, row.scheduleThuClose),
			fri: scheduleHours(row.scheduleFriOpen, row.scheduleFriClose),
			sat: scheduleHours(row.scheduleSatOpen, row.scheduleSatClose),
		},
	};
}

export type HealthIncidentRepository = {
	readHealthIncidentSummary(): Promise<HealthIncidentSummary>;
};

/**
 * The owner-only read over the two Phase 8 append-only logs.
 *
 * It is read-only by construction: the repository exposes `select` alone, so nothing
 * reachable from the owner surface can insert, update, or delete a health transition
 * or an alert row. `alert-repository.ts` remains the single writer of both tables.
 *
 * Neither projection selects `device_id` beyond what the domain needs to keep two
 * devices' conditions from merging, and no device column ever reaches the DTO.
 *
 * Both reads are ordered sequential scans of change-log tables with no new index:
 * `edge_health_log` is read whole because the first transition ever recorded is what
 * makes the uptime denominator honest, and `alert_log` is bounded to the window
 * lookback.
 */
export function createHealthIncidentRepository(
	database: Pick<Database, "select">,
	now: () => Date = () => new Date(),
): HealthIncidentRepository {
	return {
		async readHealthIncidentSummary() {
			const evaluatedAt = now();
			const [settingsRows, transitionRows, alertRows] = await Promise.all([
				database
					.select()
					.from(settingsVersions)
					.orderBy(
						asc(settingsVersions.effectiveFrom),
						asc(settingsVersions.version),
					),
				database
					.select({
						id: edgeHealthLog.id,
						deviceId: edgeHealthLog.deviceId,
						transitionType: edgeHealthLog.transitionType,
						occurredAt: edgeHealthLog.occurredAt,
					})
					.from(edgeHealthLog)
					.orderBy(asc(edgeHealthLog.occurredAt), asc(edgeHealthLog.id)),
				database
					.select({
						id: alertLog.id,
						deviceId: alertLog.deviceId,
						condition: alertLog.condition,
						noticeKind: alertLog.noticeKind,
						conditionStartedAt: alertLog.conditionStartedAt,
						sentAt: alertLog.sentAt,
						deliveryOutcome: alertLog.deliveryOutcome,
					})
					.from(alertLog)
					.where(gte(alertLog.sentAt, healthAlertLookbackStart(evaluatedAt)))
					.orderBy(asc(alertLog.sentAt), asc(alertLog.id)),
			]);

			return buildHealthIncidentSummary({
				now: evaluatedAt,
				settingsVersions: settingsRows.map(mapHealthSettings),
				transitions: transitionRows satisfies HealthTransitionRow[],
				alerts: alertRows satisfies HealthAlertRow[],
			});
		},
	};
}
