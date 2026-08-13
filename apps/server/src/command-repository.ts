import {
	type CommandQueue,
	type CommandQueueRepository,
	createCommandQueue,
} from "@fitway/api/commands/queue";
import type { DeviceCommand } from "@fitway/api/commands/schemas";
import {
	type CommandIssuanceTransaction,
	createCommandService,
	type ScheduledResetIssuance,
} from "@fitway/api/commands/service";
import { db } from "@fitway/db";
import {
	edgeCommands,
	scheduledResetIssuances,
} from "@fitway/db/schema/application";
import { and, asc, eq, lt, lte, sql } from "drizzle-orm";
import { appendAuditEntry } from "./audit-repository";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Database = typeof db;

type CommandRepositoryFaultInjection = {
	afterCommandStateObservation?: () => Promise<void> | void;
	beforeSystemCommandInsert?: () => Promise<void> | void;
	beforeScheduledResetIssuanceInsert?: () => Promise<void> | void;
};

function toScheduledResetIssuance(row: {
	businessDay: string;
	issuanceKey: string;
	settingsVersion: number;
	scheduledCloseAt: Date;
	dueAt: Date;
	commandId: number;
	issuedAt: Date;
}): ScheduledResetIssuance {
	return row;
}

async function findScheduledResetIssuance(
	database: Pick<Database, "select">,
	businessDay: string,
): Promise<ScheduledResetIssuance | null> {
	const [row] = await database
		.select({
			businessDay: scheduledResetIssuances.businessDay,
			issuanceKey: scheduledResetIssuances.issuanceKey,
			settingsVersion: scheduledResetIssuances.settingsVersion,
			scheduledCloseAt: scheduledResetIssuances.scheduledClose,
			dueAt: scheduledResetIssuances.dueAt,
			commandId: scheduledResetIssuances.commandId,
			issuedAt: scheduledResetIssuances.issuedAt,
		})
		.from(scheduledResetIssuances)
		.where(eq(scheduledResetIssuances.businessDay, businessDay))
		.limit(1);
	return row ? toScheduledResetIssuance(row) : null;
}

function transactionAdapter(
	tx: Transaction,
	faultInjection: CommandRepositoryFaultInjection,
): CommandIssuanceTransaction {
	return {
		async lockCommandState(options) {
			const currentResult = await tx.execute<{
				current_count: number | null;
				active_device_id: string | null;
			}>(
				sql`select current_count, active_device_id from current_state where id = 1`,
			);
			const observed = currentResult.rows[0];
			if (!observed) throw new Error("Current singleton is missing");
			await faultInjection.afterCommandStateObservation?.();

			let deviceId: string | null = null;
			if (observed.active_device_id) {
				const active = await tx.execute<{ id: string }>(
					sql`select id from edge_devices where id = ${observed.active_device_id} and enabled = true for update`,
				);
				deviceId = active.rows[0]?.id ?? null;
			}
			if (!deviceId) {
				const enabled = await tx.execute<{ id: string }>(
					sql`select id from edge_devices where enabled = true order by created_at, id limit 2 for update`,
				);
				deviceId =
					enabled.rows.length === 1 ? (enabled.rows[0]?.id ?? null) : null;
			}

			const lockedResult = await tx.execute<{
				current_count: number | null;
				active_device_id: string | null;
			}>(
				sql`select current_count, active_device_id from current_state where id = 1 for update`,
			);
			const locked = lockedResult.rows[0];
			if (!locked) throw new Error("Current singleton is missing");
			if (
				options?.rejectActiveDeviceChange &&
				locked.active_device_id !== observed.active_device_id
			) {
				throw new Error("Active command target changed during issuance");
			}
			if (
				locked.active_device_id &&
				deviceId &&
				locked.active_device_id !== deviceId
			) {
				throw new Error("Active command target changed during issuance");
			}
			return { currentCount: locked.current_count, deviceId };
		},

		async insertCommand(value) {
			const [row] = await tx
				.insert(edgeCommands)
				.values({
					deviceId: value.deviceId,
					type: value.type,
					targetValue: value.targetValue,
					issuedByPrincipalId: value.actorPrincipalId,
					reason: value.reason,
					issuedAt: value.issuedAt,
				})
				.returning({
					id: edgeCommands.id,
					type: edgeCommands.type,
					targetValue: edgeCommands.targetValue,
					status: edgeCommands.status,
					reason: edgeCommands.reason,
					issuedAt: edgeCommands.issuedAt,
				});
			if (!row || !Number.isSafeInteger(row.id) || row.id <= 0) {
				throw new Error("Command identity is outside the JSON-safe contract");
			}
			return { ...row, issuedAt: row.issuedAt.toISOString() };
		},

		async insertSystemCommand(value) {
			await faultInjection.beforeSystemCommandInsert?.();
			const [row] = await tx
				.insert(edgeCommands)
				.values({
					deviceId: value.deviceId,
					type: value.type,
					targetValue: value.targetValue,
					issuerClass: "system",
					issuedByPrincipalId: null,
					reason: value.reason,
					issuedAt: value.issuedAt,
				})
				.returning({
					id: edgeCommands.id,
					type: edgeCommands.type,
					targetValue: edgeCommands.targetValue,
					status: edgeCommands.status,
					reason: edgeCommands.reason,
					issuedAt: edgeCommands.issuedAt,
				});
			if (!row || !Number.isSafeInteger(row.id) || row.id <= 0) {
				throw new Error("Command identity is outside the JSON-safe contract");
			}
			return { ...row, issuedAt: row.issuedAt.toISOString() };
		},

		async supersedePendingCommands(deviceId, newerCommandId, at) {
			await tx
				.update(edgeCommands)
				.set({
					status: "superseded",
					supersededAt: at,
					supersededByCommandId: newerCommandId,
				})
				.where(
					and(
						eq(edgeCommands.deviceId, deviceId),
						eq(edgeCommands.status, "pending"),
						lt(edgeCommands.id, newerCommandId),
					),
				);
		},

		appendAudit: (value) => appendAuditEntry(tx, value),
		findScheduledResetIssuance: (businessDay) =>
			findScheduledResetIssuance(tx, businessDay),
		async insertScheduledResetIssuance(value) {
			await faultInjection.beforeScheduledResetIssuanceInsert?.();
			const [row] = await tx
				.insert(scheduledResetIssuances)
				.values({
					businessDay: value.businessDay,
					issuanceKey: value.issuanceKey,
					settingsVersion: value.settingsVersion,
					scheduledClose: value.scheduledCloseAt,
					dueAt: value.dueAt,
					commandId: value.commandId,
					commandIssuerClass: "system",
					commandType: "reset_zero",
					issuedAt: value.issuedAt,
				})
				.onConflictDoNothing({ target: scheduledResetIssuances.businessDay })
				.returning({
					businessDay: scheduledResetIssuances.businessDay,
					issuanceKey: scheduledResetIssuances.issuanceKey,
					settingsVersion: scheduledResetIssuances.settingsVersion,
					scheduledCloseAt: scheduledResetIssuances.scheduledClose,
					dueAt: scheduledResetIssuances.dueAt,
					commandId: scheduledResetIssuances.commandId,
					issuedAt: scheduledResetIssuances.issuedAt,
				});
			return row ? toScheduledResetIssuance(row) : null;
		},
	};
}

function commandQueueRepository(tx: Transaction): CommandQueueRepository {
	return {
		async findAcknowledgementCandidate(deviceId, commandId) {
			const [target] = await tx
				.select({
					status: edgeCommands.status,
					deliveredAt: edgeCommands.deliveredAt,
				})
				.from(edgeCommands)
				.where(
					and(
						eq(edgeCommands.id, commandId),
						eq(edgeCommands.deviceId, deviceId),
					),
				)
				.limit(1);
			return target ?? null;
		},
		async markAppliedThrough(deviceId, commandId, appliedAt) {
			await tx
				.update(edgeCommands)
				.set({ status: "applied", appliedAt })
				.where(
					and(
						eq(edgeCommands.deviceId, deviceId),
						eq(edgeCommands.status, "pending"),
						lte(edgeCommands.id, commandId),
						sql`${edgeCommands.deliveredAt} is not null`,
					),
				);
		},
		async listPendingCommands(deviceId) {
			const rows = await tx
				.select({
					id: edgeCommands.id,
					type: edgeCommands.type,
					targetValue: edgeCommands.targetValue,
					issuedAt: edgeCommands.issuedAt,
				})
				.from(edgeCommands)
				.where(
					and(
						eq(edgeCommands.deviceId, deviceId),
						eq(edgeCommands.status, "pending"),
					),
				)
				.orderBy(asc(edgeCommands.id));
			return rows.map(
				(row): DeviceCommand => ({
					...row,
					issuedAt: row.issuedAt.toISOString(),
				}),
			);
		},
		async markPendingDelivered(deviceId, deliveredAt) {
			await tx
				.update(edgeCommands)
				.set({
					deliveredAt: sql`coalesce(${edgeCommands.deliveredAt}, ${deliveredAt})`,
				})
				.where(
					and(
						eq(edgeCommands.deviceId, deviceId),
						eq(edgeCommands.status, "pending"),
					),
				);
		},
	};
}

export function createCommandQueueForTransaction(
	tx: Transaction,
): CommandQueue {
	return createCommandQueue(commandQueueRepository(tx));
}

export function createCommandServiceDatabase(
	database: Database,
	appendAudit: typeof appendAuditEntry = appendAuditEntry,
	faultInjection: CommandRepositoryFaultInjection = {},
) {
	return createCommandService({
		findScheduledResetIssuance: (businessDay) =>
			findScheduledResetIssuance(database, businessDay),
		transaction<T>(
			work: (tx: CommandIssuanceTransaction) => Promise<T>,
		): Promise<T> {
			return database.transaction((tx) => {
				const adapter = transactionAdapter(tx, faultInjection);
				adapter.appendAudit = (value) => appendAudit(tx, value);
				return work(adapter);
			});
		},
	});
}

/**
 * Internal issuers call this singleton directly. `/staff` is monitoring-only
 * (`docs/adr/ADR-008-staff-monitoring-only.md`), so it is deliberately not
 * injected into the oRPC context; Phase 7's cron route consumes it here.
 */
export const commandService = createCommandServiceDatabase(db);
