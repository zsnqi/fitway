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
				// leaves an expired parent under a retained child. One pass suffices:
				// the `alert_log_recovery_linkage` check constraint forces
				// `notice_kind = 'alert'` to carry a null parent, making the graph
				// exactly one level deep. And because the key is `ON DELETE no
				// action`, which PostgreSQL evaluates at end of statement, an expired
				// parent and its equally expired child still go together — only a
				// *retained* recovery pins its parent.
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
