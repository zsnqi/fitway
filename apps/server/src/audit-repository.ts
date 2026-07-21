import type { HumanAuditEntry } from "@fitway/api/audit/types";
import { auditLog } from "@fitway/db/schema/application";

type AuditDatabase = {
	insert: typeof import("@fitway/db").db.insert;
};

export async function appendAuditEntry(
	database: AuditDatabase,
	value: HumanAuditEntry,
): Promise<number> {
	const [row] = await database
		.insert(auditLog)
		.values(value)
		.returning({ id: auditLog.id });
	if (!row || !Number.isSafeInteger(row.id) || row.id <= 0) {
		throw new Error("Audit identity is outside the JSON-safe contract");
	}
	return row.id;
}
