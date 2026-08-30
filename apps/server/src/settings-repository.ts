import { buildSettingsAuditEntry } from "@fitway/api/audit/governance";
import type {
	OwnerSettingsSnapshot,
	OwnerSettingsUpdateInput,
	OwnerSettingsUpdateOutput,
	WeeklyScheduleContract,
} from "@fitway/api/settings/contracts";
import { settingsVersions } from "@fitway/db/schema/application";
import { desc, lte, sql } from "drizzle-orm";

import { appendAuditEntry } from "./audit-repository";

/**
 * Settings persistence: the injected-clock, advisory-lock transaction seam.
 *
 * The clock is injected and called exactly once per operation. A read calls it
 * immediately before its current-effective query and takes no lock. An update
 * acquires the Settings-only advisory transaction lock first and calls the same
 * clock only after the lock is held, so the one captured instant supplies the
 * current-effective predicate, `effectiveFrom`, `createdAt`, and the audit time
 * — never a time captured while waiting for the lock.
 *
 * Current settings are the greatest row ordered by `(effectiveFrom DESC,
 * version DESC)` whose `effectiveFrom <= capturedNow`. That is the repository's
 * existing effective chronology and it keeps equal-timestamp versions
 * deterministic. No default is ever fabricated: a missing history or a
 * malformed stored row is an internal invariant failure.
 */

export class SettingsVersionConflictError extends Error {
	readonly code = "settings_version_conflict";

	constructor() {
		super("Settings were updated by someone else");
		this.name = "SettingsVersionConflictError";
	}
}

export class SettingsInvariantError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "SettingsInvariantError";
	}
}

/** The root database client type, referenced without importing its env-validated module instance. */
type Database = typeof import("@fitway/db").db;
type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
type SettingsClient = Pick<Database, "select" | "insert" | "execute">;

type SettingsRow = typeof settingsVersions.$inferSelect;

export type SettingsRepository = {
	readCurrentSnapshot(): Promise<OwnerSettingsSnapshot>;
	updateSnapshot(
		input: { actorPrincipalId: string } & OwnerSettingsUpdateInput,
	): Promise<OwnerSettingsUpdateOutput>;
};

/**
 * Database `time` values arrive as `HH:mm`, `HH:mm:ss`, or with a fractional
 * tail; the API boundary is canonical `HH:mm`. Anything else in storage is an
 * invariant failure, never a default.
 */
function normalizeWallTime(value: string): string {
	const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(value);
	if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) {
		throw new SettingsInvariantError("Stored settings wall time is malformed");
	}
	return `${match[1]}:${match[2]}`;
}

function schedulePair(
	open: string | null,
	close: string | null,
): { open: string; close: string } | null {
	if (open === null && close === null) return null;
	if (open === null || close === null) {
		throw new SettingsInvariantError(
			"Stored settings schedule pair is partial",
		);
	}
	return { open: normalizeWallTime(open), close: normalizeWallTime(close) };
}

export function mapSettingsRow(row: SettingsRow): OwnerSettingsSnapshot {
	const weeklySchedule: WeeklyScheduleContract = {
		sun: schedulePair(row.scheduleSunOpen, row.scheduleSunClose),
		mon: schedulePair(row.scheduleMonOpen, row.scheduleMonClose),
		tue: schedulePair(row.scheduleTueOpen, row.scheduleTueClose),
		wed: schedulePair(row.scheduleWedOpen, row.scheduleWedClose),
		thu: schedulePair(row.scheduleThuOpen, row.scheduleThuClose),
		fri: schedulePair(row.scheduleFriOpen, row.scheduleFriClose),
		sat: schedulePair(row.scheduleSatOpen, row.scheduleSatClose),
	};
	const effectiveFromUtc = row.effectiveFrom.toISOString();
	return {
		version: row.version,
		effectiveFromUtc,
		editable: {
			capacity: row.capacity,
			thresholds: {
				quietMaxPercent: row.quietMaxPercent,
				moderateMaxPercent: row.moderateMaxPercent,
				busyMaxPercent: row.busyMaxPercent,
			},
			weeklySchedule,
			businessDayBoundary: normalizeWallTime(row.businessDayBoundary),
			resetBufferMinutes: row.resetBufferMinutes,
		},
		operational: {
			timezone: row.timezone,
			pushIntervalSeconds: row.pushIntervalSeconds,
			freshForSeconds: row.freshForSeconds,
			operationalStaleAfterSeconds: row.operationalStaleAfterSeconds,
			publicPollSeconds: row.publicPollSeconds,
		},
	};
}

function currentEffective(client: SettingsClient, at: Date) {
	return client
		.select()
		.from(settingsVersions)
		.where(lte(settingsVersions.effectiveFrom, at))
		.orderBy(
			desc(settingsVersions.effectiveFrom),
			desc(settingsVersions.version),
		)
		.limit(1);
}

export function createSettingsRepository(options: {
	database: Database;
	now: () => Date;
}): SettingsRepository {
	const database = options.database;
	const clock = options.now;

	return {
		async readCurrentSnapshot() {
			const now = clock();
			const [row] = await currentEffective(database, now);
			if (!row) {
				throw new SettingsInvariantError("No settings version is effective");
			}
			return mapSettingsRow(row);
		},

		async updateSnapshot({ actorPrincipalId, expectedVersion, editable }) {
			return database.transaction(
				async (tx): Promise<OwnerSettingsUpdateOutput> => {
					// The Settings-only lock serializes concurrent appends so two owners
					// starting from one version produce exactly one success and one
					// conflict, not two silently ordered successes.
					await tx.execute(
						sql`select pg_advisory_xact_lock(hashtext('fitway-phase11-owner-settings'))`,
					);
					const now = clock();
					const [current] = await currentEffective(tx, now);
					if (!current) {
						throw new SettingsInvariantError(
							"No settings version is effective",
						);
					}
					if (current.version !== expectedVersion) {
						throw new SettingsVersionConflictError();
					}
					const [inserted] = await tx
						.insert(settingsVersions)
						.values({
							capacity: editable.capacity,
							quietMaxPercent: editable.thresholds.quietMaxPercent,
							moderateMaxPercent: editable.thresholds.moderateMaxPercent,
							busyMaxPercent: editable.thresholds.busyMaxPercent,
							// Every operational timing is copied from the locked current
							// row. Omitting any of these keys would reapply the column
							// defaults, which is a correctness failure, not a shortcut.
							timezone: current.timezone,
							businessDayBoundary: current.businessDayBoundary,
							pushIntervalSeconds: current.pushIntervalSeconds,
							freshForSeconds: current.freshForSeconds,
							operationalStaleAfterSeconds:
								current.operationalStaleAfterSeconds,
							publicPollSeconds: current.publicPollSeconds,
							resetBufferMinutes: editable.resetBufferMinutes,
							scheduleSunOpen: editable.weeklySchedule.sun?.open ?? null,
							scheduleSunClose: editable.weeklySchedule.sun?.close ?? null,
							scheduleMonOpen: editable.weeklySchedule.mon?.open ?? null,
							scheduleMonClose: editable.weeklySchedule.mon?.close ?? null,
							scheduleTueOpen: editable.weeklySchedule.tue?.open ?? null,
							scheduleTueClose: editable.weeklySchedule.tue?.close ?? null,
							scheduleWedOpen: editable.weeklySchedule.wed?.open ?? null,
							scheduleWedClose: editable.weeklySchedule.wed?.close ?? null,
							scheduleThuOpen: editable.weeklySchedule.thu?.open ?? null,
							scheduleThuClose: editable.weeklySchedule.thu?.close ?? null,
							scheduleFriOpen: editable.weeklySchedule.fri?.open ?? null,
							scheduleFriClose: editable.weeklySchedule.fri?.close ?? null,
							scheduleSatOpen: editable.weeklySchedule.sat?.open ?? null,
							scheduleSatClose: editable.weeklySchedule.sat?.close ?? null,
							effectiveFrom: now,
							createdAt: now,
							createdBy: actorPrincipalId,
						})
						.returning();
					if (!inserted) {
						throw new SettingsInvariantError("Settings append failed");
					}
					if (
						!Number.isSafeInteger(inserted.version) ||
						inserted.version <= 0
					) {
						throw new SettingsInvariantError(
							"Generated settings version is outside the JSON-safe contract",
						);
					}
					const auditId = await appendSettingsAudit(tx, {
						actorPrincipalId,
						settingsVersion: inserted.version,
						createdAt: now,
					});
					return { settings: mapSettingsRow(inserted), auditId };
				},
			);
		},
	};
}

/**
 * The one audit append for a settings change, in the same transaction as the
 * settings insert. `reason` is `null` because the accepted form has no reason
 * control; adding one would be a sixth unauthorized input.
 */
async function appendSettingsAudit(
	tx: Transaction,
	input: {
		actorPrincipalId: string;
		settingsVersion: number;
		createdAt: Date;
	},
): Promise<number> {
	return appendAuditEntry(
		tx,
		buildSettingsAuditEntry({
			actorPrincipalId: input.actorPrincipalId,
			settingsVersion: input.settingsVersion,
			reason: null,
			createdAt: input.createdAt,
		}),
	);
}
