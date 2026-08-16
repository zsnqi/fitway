import type {
	AuditCursor,
	AuditListFilters,
	AuditListInput,
	AuditListPage,
	PersistedAuditRow,
} from "@fitway/api/audit/list";
import { paginateAuditEntries, toAuditEntry } from "@fitway/api/audit/list";
import type { AuditEntry } from "@fitway/api/audit/types";
import { auditLog } from "@fitway/db/schema/application";
import { authPrincipals } from "@fitway/db/schema/auth";
import {
	and,
	desc,
	eq,
	gte,
	ilike,
	inArray,
	isNull,
	lte,
	type SQL,
	sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

/**
 * The target principal is a second, independent reference to `auth_principals`:
 * an access event's actor is the owner performing it and its target is the
 * principal it is about, and the two are different rows. An alias is what keeps
 * both joins in one query without either shadowing the other.
 */
const targetPrincipals = alias(authPrincipals, "target_principal");

type AuditDatabase = {
	insert: typeof import("@fitway/db").db.insert;
};

export async function appendAuditEntry(
	database: AuditDatabase,
	value: AuditEntry,
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

/**
 * `%`, `_`, and the default `\` escape are literal characters in an owner's reason
 * search. Escaping them keeps the filter a substring match instead of an accidental
 * pattern language.
 */
function escapeLikePattern(value: string): string {
	return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

/** Translates the six strict filters. An absent key adds no predicate at all. */
export function auditListFilterConditions(
	filters: AuditListFilters | undefined,
): SQL[] {
	if (!filters) return [];
	const conditions: SQL[] = [];
	if (filters.actorPrincipalId !== undefined) {
		conditions.push(eq(auditLog.actorPrincipalId, filters.actorPrincipalId));
	}
	if (filters.actorKind !== undefined) {
		conditions.push(eq(auditLog.actorPrincipalKind, filters.actorKind));
	}
	if (filters.actions !== undefined) {
		conditions.push(inArray(auditLog.action, filters.actions));
	}
	// `null` is the explicit missing-prior option; it is never rewritten to zero.
	if (filters.priorValue === null) {
		conditions.push(isNull(auditLog.priorValue));
	} else if (filters.priorValue !== undefined) {
		conditions.push(eq(auditLog.priorValue, filters.priorValue));
	}
	if (filters.effectiveValue === null) {
		conditions.push(isNull(auditLog.effectiveValue));
	} else if (filters.effectiveValue !== undefined) {
		conditions.push(eq(auditLog.effectiveValue, filters.effectiveValue));
	}
	if (filters.occurredFrom !== undefined) {
		conditions.push(gte(auditLog.createdAt, new Date(filters.occurredFrom)));
	}
	if (filters.occurredTo !== undefined) {
		conditions.push(lte(auditLog.createdAt, new Date(filters.occurredTo)));
	}
	if (filters.reason === null) {
		conditions.push(isNull(auditLog.reason));
	} else if (filters.reason !== undefined) {
		conditions.push(
			ilike(auditLog.reason, `%${escapeLikePattern(filters.reason)}%`),
		);
	}
	return conditions;
}

/**
 * Newest-first keyset seek over the existing `(created_at, id)` index. The row-value
 * comparison is what makes equal timestamps deterministic, so a page can neither
 * repeat nor skip a row.
 */
export function auditListKeysetCondition(cursor: AuditCursor): SQL {
	return sql`(${auditLog.createdAt}, ${auditLog.id}) < (cast(${cursor.createdAtUtc} as timestamptz), cast(${cursor.id} as bigint))`;
}

export function auditListConditions(input: AuditListInput): SQL | undefined {
	const conditions = auditListFilterConditions(input.filters);
	if (input.cursor) conditions.push(auditListKeysetCondition(input.cursor));
	return conditions.length === 0 ? undefined : and(...conditions);
}

type AuditListDatabase = {
	select: typeof import("@fitway/db").db.select;
};

export type AuditListRepository = {
	listAuditEntries(input: AuditListInput): Promise<AuditListPage>;
};

/**
 * The owner-only read path. It is a sibling of the append path above and shares
 * nothing with it: Phase 5 command/audit atomicity and append semantics are frozen.
 *
 * The projection is an explicit column list. `auth_principals` contributes exactly
 * `display_name`; no credential, email, or session column is reachable from here.
 */
export function createAuditListRepository(
	database: AuditListDatabase,
): AuditListRepository {
	return {
		async listAuditEntries(input) {
			const rows = await database
				.select({
					id: auditLog.id,
					eventClass: auditLog.eventClass,
					action: auditLog.action,
					actorPrincipalId: auditLog.actorPrincipalId,
					actorPrincipalKind: auditLog.actorPrincipalKind,
					actorRole: auditLog.actorRole,
					actorDisplayName: authPrincipals.displayName,
					targetPrincipalId: auditLog.targetPrincipalId,
					targetDisplayName: targetPrincipals.displayName,
					priorValue: auditLog.priorValue,
					requestedDelta: auditLog.requestedDelta,
					requestedValue: auditLog.requestedValue,
					effectiveValue: auditLog.effectiveValue,
					priorActive: auditLog.priorActive,
					newActive: auditLog.newActive,
					priorCredentialVersion: auditLog.priorCredentialVersion,
					newCredentialVersion: auditLog.newCredentialVersion,
					settingsVersion: auditLog.settingsVersion,
					reason: auditLog.reason,
					createdAt: auditLog.createdAt,
				})
				.from(auditLog)
				.leftJoin(
					authPrincipals,
					eq(auditLog.actorPrincipalId, authPrincipals.id),
				)
				.leftJoin(
					targetPrincipals,
					eq(auditLog.targetPrincipalId, targetPrincipals.id),
				)
				.where(auditListConditions(input))
				.orderBy(desc(auditLog.createdAt), desc(auditLog.id))
				// One extra row decides whether a next page exists; it is never emitted.
				.limit(input.limit + 1);
			return paginateAuditEntries(
				rows.map((row) => toAuditEntry(row as PersistedAuditRow)),
				input.limit,
			);
		},
	};
}
