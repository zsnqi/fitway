import { retentionCutoff } from "@fitway/api/retention/policy";
import type { db } from "@fitway/db";
import {
	alertLog,
	auditLog,
	edgeHealthLog,
} from "@fitway/db/schema/application";
import { and, eq, gte, lt, notExists, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

type Database = typeof db;

export type RetentionRepository = {
	/**
	 * Deletes everything expired against `now`'s day-quantized cutoff. Safe to
	 * call on every cron invocation: the second and later calls in the same UTC
	 * day match no rows.
	 */
	purgeExpired: (now: Date) => Promise<void>;
};

export function createRetentionRepository(
	database: Database,
): RetentionRepository {
	return {
		async purgeExpired(now) {
			// Computed before the transaction opens, so an invalid clock value can
			// never leave a half-applied deletion behind.
			const cutoff = retentionCutoff(now);

			await database.transaction(async (transaction) => {
				await transaction
					.delete(auditLog)
					.where(lt(auditLog.createdAt, cutoff));
				await transaction
					.delete(edgeHealthLog)
					.where(lt(edgeHealthLog.occurredAt, cutoff));

				// `alert_log.recovery_of_alert_id` is a self-referencing key, so a
				// condition that opened before the cutoff and recovered after it
				// leaves an expired parent under a retained child.
				//
				// One pass suffices only because the reference graph is at most one
				// level deep, and that guarantee comes from the frozen evaluator, not
				// from the schema. `alert_log_recovery_linkage`
				// (`packages/db/src/schema/application.ts:530-533`) constrains only
				// `notice_kind = 'alert'` to carry a null parent; it places no
				// restriction on a recovery's parent, so recovery → recovery is
				// schema-legal and a deeper chain would leave a middle row pinned
				// while its expired root was deleted, aborting the whole transaction
				// on the foreign key. What actually prevents that chain is
				// `packages/api/src/alerts/evaluator.ts:57`, which returns a prior row
				// only when its `noticeKind` is `"alert"`, and `evaluator.ts:259`,
				// which sets `recoveryOfAlertId` from exactly that row. A recovery can
				// therefore never parent a recovery. If that evaluator behaviour ever
				// changes, this single pass must become a fixed-point loop.
				//
				// Within a depth-one graph the key's `ON DELETE no action`, which
				// PostgreSQL evaluates at end of statement, lets an expired parent and
				// its equally expired child go together — only a *retained* recovery
				// pins its parent.
				const retainedRecovery = alias(alertLog, "retained_recovery");
				await transaction.delete(alertLog).where(
					and(
						lt(alertLog.sentAt, cutoff),
						notExists(
							transaction
								.select({ retained: sql`1` })
								.from(retainedRecovery)
								.where(
									and(
										eq(retainedRecovery.recoveryOfAlertId, alertLog.id),
										gte(retainedRecovery.sentAt, cutoff),
									),
								),
						),
					),
				);
			});
		},
	};
}
