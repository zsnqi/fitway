import { z } from "zod";

/**
 * The owner-only audit read contract.
 *
 * This is the transport DTO. The command-write `HumanAuditEntry`/`SystemAuditEntry`
 * in `./types` carry a `Date` and a `commandId`; they belong to the frozen Phase 5
 * append path and are deliberately not reused here.
 *
 * Openness to a later additive action set, without inventing one now:
 * - `AUDIT_ACTIONS` is the single source of the action enum, so a later migration
 *   that adds a persisted action extends one tuple rather than every schema.
 * - The action filter is an *array*, so adding an action is additive on the wire:
 *   existing clients keep sending the same shape and keep the same meaning.
 * - The entry carries no `commandId` and no command issuer class. The current
 *   `audit_log` is command-coupled, but the read contract does not depend on that
 *   coupling, so a later generalized row is representable without a breaking change.
 */
export const AUDIT_ACTIONS = [
	"correction_delta",
	"correction_absolute",
	"reset",
] as const;
export const AUDIT_ACTOR_KINDS = ["shared_staff", "owner", "system"] as const;
export const AUDIT_ACTOR_ROLES = ["staff", "owner"] as const;

export const AUDIT_REASON_MAX_LENGTH = 240;
export const AUDIT_PAGE_LIMIT_DEFAULT = 25;
export const AUDIT_PAGE_LIMIT_MAX = 100;

export const auditActionSchema = z.enum(AUDIT_ACTIONS);
export const auditActorKindSchema = z.enum(AUDIT_ACTOR_KINDS);
export const auditActorRoleSchema = z.enum(AUDIT_ACTOR_ROLES);

const safeIdSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const nonNegativeCountSchema = z
	.number()
	.int()
	.nonnegative()
	.max(Number.MAX_SAFE_INTEGER);
const deltaSchema = z
	.number()
	.int()
	.min(-Number.MAX_SAFE_INTEGER)
	.max(Number.MAX_SAFE_INTEGER);

/**
 * The persisted server instant, emitted as an ISO UTC instant with milliseconds.
 * The exact `Date#toISOString` shape is required in both directions so a cursor
 * round-trips byte-for-byte and no client locale or device timezone can leak into
 * the wire value.
 */
const ISO_UTC_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
export const isoUtcInstantSchema = z
	.string()
	.regex(
		ISO_UTC_INSTANT,
		"Instant must be an ISO UTC instant with milliseconds",
	)
	.refine((value) => new Date(value).toISOString() === value, {
		message: "Instant must be a real UTC calendar instant",
	});

/** Optional, trimmed, and bounded. A missing reason stays absent; it is never "". */
export const auditReasonSchema = z
	.string()
	.min(1)
	.max(AUDIT_REASON_MAX_LENGTH)
	.refine((value) => value.trim() === value, {
		message: "Reason must be trimmed",
	});

export const auditCursorSchema = z
	.object({ createdAtUtc: isoUtcInstantSchema, id: safeIdSchema })
	.strict();

/**
 * Persisted principal attribution only. The shared front-desk principal is one
 * real principal: its `displayName` is the persisted `auth_principals.display_name`.
 * No email, credential, session, or per-person identity is derived or invented here.
 */
export const auditActorSchema = z
	.object({
		principalId: z.uuid().nullable(),
		kind: auditActorKindSchema,
		role: auditActorRoleSchema.nullable(),
		displayName: z.string().min(1).nullable(),
	})
	.strict();

export const auditEntrySchema = z
	.object({
		id: safeIdSchema,
		action: auditActionSchema,
		actor: auditActorSchema,
		/** Nullable `prior_value`. A null prior means "not recorded"; it never means zero. */
		priorValue: nonNegativeCountSchema.nullable(),
		/** `effective_value`: the floored result the system actually adopted. */
		effectiveValue: nonNegativeCountSchema,
		requestedDelta: deltaSchema.nullable(),
		requestedValue: nonNegativeCountSchema.nullable(),
		reason: auditReasonSchema.nullable(),
		createdAtUtc: isoUtcInstantSchema,
	})
	.strict();

/**
 * The six strict filters: actor, action, prior value, effective value, occurred
 * range, and reason.
 *
 * An absent key is "no filter". An explicit `null` on the two nullable columns is
 * the explicit missing option — `priorValue: null` matches rows with no recorded
 * prior, and `reason: null` matches rows with no reason. That keeps "missing"
 * expressible without ever coercing it to zero or to an empty string.
 */
export const auditListFilterSchema = z
	.object({
		actorPrincipalId: z.uuid().optional(),
		actorKind: auditActorKindSchema.optional(),
		actions: z
			.array(auditActionSchema)
			.min(1)
			.max(AUDIT_ACTIONS.length)
			.refine((values) => new Set(values).size === values.length, {
				message: "Actions must be unique",
			})
			.optional(),
		priorValue: nonNegativeCountSchema.nullable().optional(),
		effectiveValue: nonNegativeCountSchema.optional(),
		occurredFrom: isoUtcInstantSchema.optional(),
		occurredTo: isoUtcInstantSchema.optional(),
		/** Case-insensitive substring match, or `null` for rows without a reason. */
		reason: auditReasonSchema.nullable().optional(),
	})
	.strict()
	.refine(
		(filters) =>
			filters.occurredFrom === undefined ||
			filters.occurredTo === undefined ||
			Date.parse(filters.occurredFrom) <= Date.parse(filters.occurredTo),
		{ message: "Occurred range must start before it ends" },
	)
	.refine(
		(filters) =>
			filters.actorPrincipalId === undefined || filters.actorKind !== "system",
		{ message: "A system actor has no principal id" },
	);

export const auditListInputSchema = z
	.object({
		limit: z
			.number()
			.int()
			.min(1)
			.max(AUDIT_PAGE_LIMIT_MAX)
			.default(AUDIT_PAGE_LIMIT_DEFAULT),
		cursor: auditCursorSchema.nullish(),
		filters: auditListFilterSchema.optional(),
	})
	.strict();

export const auditListOutputSchema = z
	.object({
		entries: z.array(auditEntrySchema),
		nextCursor: auditCursorSchema.nullable(),
	})
	.strict();

export type AuditAction = z.infer<typeof auditActionSchema>;
export type AuditActorKind = z.infer<typeof auditActorKindSchema>;
export type AuditActorRole = z.infer<typeof auditActorRoleSchema>;
export type AuditCursor = z.infer<typeof auditCursorSchema>;
export type AuditEntryView = z.infer<typeof auditEntrySchema>;
export type AuditListFilters = z.infer<typeof auditListFilterSchema>;
export type AuditListInput = z.infer<typeof auditListInputSchema>;
export type AuditListPage = z.infer<typeof auditListOutputSchema>;

/** The joined persistence shape the repository reads. */
export type PersistedAuditRow = {
	id: number;
	action: AuditAction;
	actorPrincipalId: string | null;
	actorPrincipalKind: AuditActorKind;
	actorRole: AuditActorRole | null;
	actorDisplayName: string | null;
	priorValue: number | null;
	requestedDelta: number | null;
	requestedValue: number | null;
	effectiveValue: number;
	reason: string | null;
	createdAt: Date;
};

function assertActorCoherent(row: PersistedAuditRow): void {
	const { actorPrincipalId, actorPrincipalKind, actorRole } = row;
	if (actorPrincipalKind === "system") {
		if (actorPrincipalId !== null || actorRole !== null) {
			throw new Error(`Audit row ${row.id} has an incoherent system actor`);
		}
		return;
	}
	const expectedRole = actorPrincipalKind === "owner" ? "owner" : "staff";
	if (!actorPrincipalId || actorRole !== expectedRole) {
		throw new Error(`Audit row ${row.id} has an incoherent principal actor`);
	}
	if (!row.actorDisplayName) {
		throw new Error(`Audit row ${row.id} has an unresolved actor principal`);
	}
}

function assertValuesCoherent(row: PersistedAuditRow): void {
	const { action, priorValue, requestedDelta, requestedValue, effectiveValue } =
		row;
	if (action === "correction_delta") {
		if (priorValue === null || requestedDelta === null) {
			throw new Error(`Audit row ${row.id} is missing delta provenance`);
		}
		if (requestedValue !== null) {
			throw new Error(
				`Audit row ${row.id} mixes delta and absolute provenance`,
			);
		}
		if (effectiveValue !== Math.max(0, priorValue + requestedDelta)) {
			throw new Error(`Audit row ${row.id} does not floor its delta result`);
		}
		return;
	}
	if (action === "correction_absolute") {
		if (requestedDelta !== null || requestedValue !== effectiveValue) {
			throw new Error(`Audit row ${row.id} breaks absolute value parity`);
		}
		return;
	}
	if (requestedDelta !== null || requestedValue !== 0 || effectiveValue !== 0) {
		throw new Error(`Audit row ${row.id} is not a zeroing reset`);
	}
}

/**
 * Maps one persisted row to the transport DTO. Every coherence rule the database
 * already enforces is re-asserted here, because a read surface that silently
 * reshapes an audit row is worse than one that refuses to serve it.
 */
export function toAuditEntry(row: PersistedAuditRow): AuditEntryView {
	if (!Number.isFinite(row.createdAt.getTime())) {
		throw new Error(`Audit row ${row.id} has an invalid server instant`);
	}
	assertActorCoherent(row);
	assertValuesCoherent(row);
	return auditEntrySchema.parse({
		id: row.id,
		action: row.action,
		actor: {
			principalId: row.actorPrincipalId,
			kind: row.actorPrincipalKind,
			role: row.actorRole,
			displayName:
				row.actorPrincipalKind === "system" ? null : row.actorDisplayName,
		},
		priorValue: row.priorValue,
		effectiveValue: row.effectiveValue,
		requestedDelta: row.requestedDelta,
		requestedValue: row.requestedValue,
		reason: row.reason,
		createdAtUtc: row.createdAt.toISOString(),
	});
}

function isStrictlyNewer(left: AuditEntryView, right: AuditEntryView): boolean {
	const leftTime = Date.parse(left.createdAtUtc);
	const rightTime = Date.parse(right.createdAtUtc);
	return leftTime === rightTime ? left.id > right.id : leftTime > rightTime;
}

/**
 * Bounds one keyset page. The repository reads `limit + 1` rows; the extra row
 * only decides whether a next page exists and is never emitted. The cursor is the
 * last emitted row's `(createdAt, id)`, which is exactly the index order, so pages
 * neither duplicate nor skip a row even when timestamps tie.
 */
export function paginateAuditEntries(
	entries: readonly AuditEntryView[],
	limit: number,
): AuditListPage {
	if (!Number.isInteger(limit) || limit < 1 || limit > AUDIT_PAGE_LIMIT_MAX) {
		throw new Error("Audit page limit is outside the bounded contract");
	}
	for (let index = 1; index < entries.length; index += 1) {
		const previous = entries[index - 1];
		const current = entries[index];
		if (previous && current && !isStrictlyNewer(previous, current)) {
			throw new Error("Audit rows are not in newest-first keyset order");
		}
	}
	const page = entries.slice(0, limit);
	const last = page.at(-1);
	return {
		entries: page,
		nextCursor:
			entries.length > limit && last
				? { createdAtUtc: last.createdAtUtc, id: last.id }
				: null,
	};
}
