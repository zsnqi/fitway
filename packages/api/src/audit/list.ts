import { z } from "zod";

/**
 * The owner-only audit read contract.
 *
 * This is the transport DTO. The command-write `HumanAuditEntry`/`SystemAuditEntry`
 * in `./types` carry a `Date` and a `commandId`; they belong to the frozen Phase 5
 * append path and are deliberately not reused here.
 *
 * `AUDIT_ACTIONS` is the single source of the rendered persisted enum. Its array
 * filter is additive on the wire, and this entry deliberately carries neither a
 * command identity nor an issuer class.
 */
export const AUDIT_COMMAND_ACTIONS = [
	"correction_delta",
	"correction_absolute",
	"reset",
] as const;
export const AUDIT_ACTOR_KINDS = ["shared_staff", "owner", "system"] as const;
export const AUDIT_ACTOR_ROLES = ["staff", "owner"] as const;

/**
 * The generalized action set, as persisted by migration 0007.
 *
 * These tuples are the persisted truth. `AUDIT_ACTIONS` below is their ordered
 * union, shared by the strict output and filter contracts.
 */
export const AUDIT_EVENT_CLASSES = ["command", "access", "settings"] as const;
/** The seven human-approved access actions. Locked; not extended by any slice. */
export const AUDIT_ACCESS_ACTIONS = [
	"staff_pin_provisioned",
	"staff_pin_rotated",
	"staff_pin_deactivated",
	"owner_provisioned",
	"owner_deactivated",
	"owner_reactivated",
	"credential_reset",
] as const;
export const AUDIT_SETTINGS_ACTIONS = ["settings_updated"] as const;
export const AUDIT_ALL_ACTIONS = [
	...AUDIT_COMMAND_ACTIONS,
	...AUDIT_ACCESS_ACTIONS,
	...AUDIT_SETTINGS_ACTIONS,
] as const;
/** Every action the generalized audit list renders and filters. */
export const AUDIT_ACTIONS = AUDIT_ALL_ACTIONS;

/** A reason is required for these two actions only. */
export const AUDIT_REASON_REQUIRED_ACTIONS = [
	"staff_pin_deactivated",
	"owner_deactivated",
] as const;

export const auditEventClassSchema = z.enum(AUDIT_EVENT_CLASSES);
/** Every persisted action, including the ones the rendered contract cannot name yet. */
export const auditAnyActionSchema = z.enum(AUDIT_ALL_ACTIONS);

export type AuditEventClass = z.infer<typeof auditEventClassSchema>;
export type AuditAnyAction = z.infer<typeof auditAnyActionSchema>;

/** Which class a persisted action belongs to; mirrors `audit_log_action_event_class`. */
export function auditActionEventClass(action: AuditAnyAction): AuditEventClass {
	if ((AUDIT_COMMAND_ACTIONS as readonly string[]).includes(action)) {
		return "command";
	}
	if ((AUDIT_ACCESS_ACTIONS as readonly string[]).includes(action)) {
		return "access";
	}
	return "settings";
}

export const AUDIT_REASON_MAX_LENGTH = 240;
export const AUDIT_PAGE_LIMIT_DEFAULT = 25;
export const AUDIT_PAGE_LIMIT_MAX = 100;

export const auditActionSchema = z.enum(AUDIT_ACTIONS);
export const auditActorKindSchema = z.enum(AUDIT_ACTOR_KINDS);
export const auditActorRoleSchema = z.enum(AUDIT_ACTOR_ROLES);

function auditActionRequiresReason(action: AuditAnyAction): boolean {
	return (AUDIT_REASON_REQUIRED_ACTIONS as readonly AuditAnyAction[]).includes(
		action,
	);
}

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

/** The named principal an access event is about; command and settings rows have none. */
export const auditTargetSchema = z
	.object({
		principalId: z.uuid(),
		displayName: z.string().min(1),
	})
	.strict()
	.nullable();

export const auditEntrySchema = z
	.object({
		id: safeIdSchema,
		action: auditActionSchema,
		eventClass: auditEventClassSchema,
		actor: auditActorSchema,
		target: auditTargetSchema,
		/** Nullable `prior_value`. A null prior means "not recorded"; it never means zero. */
		priorValue: nonNegativeCountSchema.nullable(),
		/** `effective_value`: the floored count, or absent for governance events. */
		effectiveValue: nonNegativeCountSchema.nullable(),
		requestedDelta: deltaSchema.nullable(),
		requestedValue: nonNegativeCountSchema.nullable(),
		/** Non-secret governance transition state; null means it was not recorded. */
		priorActive: z.boolean().nullable(),
		newActive: z.boolean().nullable(),
		priorCredentialVersion: safeIdSchema.nullable(),
		newCredentialVersion: safeIdSchema.nullable(),
		/** The append-only settings version named by a settings event. */
		settingsVersion: safeIdSchema.nullable(),
		reason: auditReasonSchema.nullable(),
		createdAtUtc: isoUtcInstantSchema,
	})
	.strict()
	.superRefine((entry, context) => {
		const reject = (message: string) =>
			context.addIssue({ code: "custom", message });
		if (auditActionEventClass(entry.action) !== entry.eventClass) {
			reject("Audit action must match its event class");
		}
		if (entry.eventClass === "command") {
			if (entry.target !== null || entry.effectiveValue === null) {
				reject("A command must have a count and no governance target");
			}
			if (
				entry.priorActive !== null ||
				entry.newActive !== null ||
				entry.priorCredentialVersion !== null ||
				entry.newCredentialVersion !== null ||
				entry.settingsVersion !== null
			) {
				reject("A command cannot carry governance state");
			}
			return;
		}
		if (
			entry.priorValue !== null ||
			entry.effectiveValue !== null ||
			entry.requestedDelta !== null ||
			entry.requestedValue !== null
		) {
			reject("A governance event cannot carry count state");
		}
		if (
			entry.actor.principalId === null ||
			entry.actor.kind !== "owner" ||
			entry.actor.role !== "owner" ||
			entry.actor.displayName === null
		) {
			reject("A governance event must be authored by a real owner");
		}
		if (auditActionRequiresReason(entry.action) && entry.reason === null) {
			reject("A destructive governance event must carry a reason");
		}
		if (entry.eventClass === "access") {
			if (entry.target === null || entry.settingsVersion !== null) {
				reject("An access event must name a target and no settings version");
			}
			const activeTransition =
				entry.action === "owner_deactivated" ||
				entry.action === "owner_reactivated";
			const credentialTransition =
				entry.action === "staff_pin_rotated" ||
				entry.action === "credential_reset";
			if (activeTransition) {
				const expectedPrior = entry.action === "owner_deactivated";
				if (
					entry.priorActive !== expectedPrior ||
					entry.newActive !== !expectedPrior ||
					entry.priorCredentialVersion !== null ||
					entry.newCredentialVersion !== null
				) {
					reject(
						"An active transition must carry its matching non-secret state",
					);
				}
			} else if (credentialTransition) {
				if (
					entry.priorActive !== null ||
					entry.newActive !== null ||
					entry.priorCredentialVersion === null ||
					entry.newCredentialVersion === null ||
					entry.newCredentialVersion <= entry.priorCredentialVersion
				) {
					reject("A credential transition must advance its non-secret version");
				}
			} else if (
				entry.priorActive !== null ||
				entry.newActive !== null ||
				entry.priorCredentialVersion !== null ||
				entry.newCredentialVersion !== null
			) {
				reject("An access action cannot carry another action's state");
			}
		} else if (
			entry.target !== null ||
			entry.settingsVersion === null ||
			entry.priorActive !== null ||
			entry.newActive !== null ||
			entry.priorCredentialVersion !== null ||
			entry.newCredentialVersion !== null
		) {
			reject("A settings event must name only its settings version");
		}
	});

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
		/** `null` is the explicit missing option for governance rows. */
		effectiveValue: nonNegativeCountSchema.nullable().optional(),
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

/**
 * The joined persistence shape the repository reads.
 *
 * This is the generalized row: it carries the class discriminator, the resolved
 * target principal that every access event is *about*, and a nullable
 * `effectiveValue`, because a governance event has no count.
 */
export type PersistedAuditRow = {
	id: number;
	eventClass: AuditEventClass;
	action: AuditAnyAction;
	actorPrincipalId: string | null;
	actorPrincipalKind: AuditActorKind;
	actorRole: AuditActorRole | null;
	actorDisplayName: string | null;
	targetPrincipalId: string | null;
	targetDisplayName: string | null;
	priorValue: number | null;
	requestedDelta: number | null;
	requestedValue: number | null;
	effectiveValue: number | null;
	priorActive: boolean | null;
	newActive: boolean | null;
	priorCredentialVersion: number | null;
	newCredentialVersion: number | null;
	settingsVersion: number | null;
	reason: string | null;
	createdAt: Date;
};

function isCommandAction(action: AuditAnyAction): action is AuditAction {
	return (AUDIT_COMMAND_ACTIONS as readonly string[]).includes(action);
}

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

function assertGovernanceAuthorAndReason(row: PersistedAuditRow): void {
	if (
		row.actorPrincipalId === null ||
		row.actorPrincipalKind !== "owner" ||
		row.actorRole !== "owner" ||
		row.actorDisplayName === null
	) {
		throw new Error(`Audit row ${row.id} has a non-owner governance actor`);
	}
	if (auditActionRequiresReason(row.action) && row.reason === null) {
		throw new Error(`Audit row ${row.id} is missing its destructive reason`);
	}
}

function assertValuesCoherent(
	row: PersistedAuditRow,
	action: AuditAction,
	effectiveValue: number,
): void {
	const { priorValue, requestedDelta, requestedValue } = row;
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

function assertCommandGovernanceColumnsEmpty(row: PersistedAuditRow): void {
	if (
		row.targetPrincipalId !== null ||
		row.targetDisplayName !== null ||
		row.priorActive !== null ||
		row.newActive !== null ||
		row.priorCredentialVersion !== null ||
		row.newCredentialVersion !== null ||
		row.settingsVersion !== null
	) {
		throw new Error(`Audit row ${row.id} mixes command and governance state`);
	}
}

function assertGovernanceCountsEmpty(row: PersistedAuditRow): void {
	if (
		row.priorValue !== null ||
		row.requestedDelta !== null ||
		row.requestedValue !== null ||
		row.effectiveValue !== null
	) {
		throw new Error(`Audit row ${row.id} mixes governance and count state`);
	}
}

function assertAccessStateCoherent(row: PersistedAuditRow): void {
	if (
		!row.targetPrincipalId ||
		!row.targetDisplayName ||
		row.settingsVersion !== null
	) {
		throw new Error(`Audit row ${row.id} has an incoherent access target`);
	}
	const activeTransition =
		row.action === "owner_deactivated" || row.action === "owner_reactivated";
	const credentialTransition =
		row.action === "staff_pin_rotated" || row.action === "credential_reset";
	if (activeTransition) {
		const expectedPrior = row.action === "owner_deactivated";
		if (
			row.priorActive !== expectedPrior ||
			row.newActive !== !expectedPrior ||
			row.priorCredentialVersion !== null ||
			row.newCredentialVersion !== null
		) {
			throw new Error(
				`Audit row ${row.id} has an incoherent active transition`,
			);
		}
		return;
	}
	if (credentialTransition) {
		if (
			row.priorActive !== null ||
			row.newActive !== null ||
			row.priorCredentialVersion === null ||
			row.newCredentialVersion === null ||
			row.newCredentialVersion <= row.priorCredentialVersion
		) {
			throw new Error(
				`Audit row ${row.id} has an incoherent credential transition`,
			);
		}
		return;
	}
	if (
		row.priorActive !== null ||
		row.newActive !== null ||
		row.priorCredentialVersion !== null ||
		row.newCredentialVersion !== null
	) {
		throw new Error(`Audit row ${row.id} carries unclaimed governance state`);
	}
}

function assertSettingsStateCoherent(row: PersistedAuditRow): void {
	if (
		row.targetPrincipalId !== null ||
		row.targetDisplayName !== null ||
		row.settingsVersion === null ||
		row.priorActive !== null ||
		row.newActive !== null ||
		row.priorCredentialVersion !== null ||
		row.newCredentialVersion !== null
	) {
		throw new Error(`Audit row ${row.id} has incoherent settings state`);
	}
}

/**
 * Maps one persisted row to the transport DTO. Every coherence rule the database
 * already enforces is re-asserted here, because a read surface that silently
 * reshapes an audit row is worse than one that refuses to serve it.
 *
 * Command, access, and settings rows share one strict transport shape. Null is
 * always carried honestly: governance has no count, only access has a target,
 * and only actions with a persisted transition expose from/to state.
 */
export function toAuditEntry(row: PersistedAuditRow): AuditEntryView {
	if (!Number.isFinite(row.createdAt.getTime())) {
		throw new Error(`Audit row ${row.id} has an invalid server instant`);
	}
	assertActorCoherent(row);
	if (auditActionEventClass(row.action) !== row.eventClass) {
		throw new Error(`Audit row ${row.id} has an incoherent action class`);
	}
	if (row.eventClass === "command") {
		if (!isCommandAction(row.action) || row.effectiveValue === null) {
			throw new Error(
				`Audit row ${row.id} is a command without an effective count`,
			);
		}
		assertCommandGovernanceColumnsEmpty(row);
		assertValuesCoherent(row, row.action, row.effectiveValue);
	} else {
		assertGovernanceAuthorAndReason(row);
		assertGovernanceCountsEmpty(row);
		if (row.eventClass === "access") assertAccessStateCoherent(row);
		else assertSettingsStateCoherent(row);
	}
	return auditEntrySchema.parse({
		id: row.id,
		action: row.action,
		eventClass: row.eventClass,
		actor: {
			principalId: row.actorPrincipalId,
			kind: row.actorPrincipalKind,
			role: row.actorRole,
			displayName:
				row.actorPrincipalKind === "system" ? null : row.actorDisplayName,
		},
		target:
			row.targetPrincipalId === null
				? null
				: {
						principalId: row.targetPrincipalId,
						displayName: row.targetDisplayName,
					},
		priorValue: row.priorValue,
		effectiveValue: row.effectiveValue,
		requestedDelta: row.requestedDelta,
		requestedValue: row.requestedValue,
		priorActive: row.priorActive,
		newActive: row.newActive,
		priorCredentialVersion: row.priorCredentialVersion,
		newCredentialVersion: row.newCredentialVersion,
		settingsVersion: row.settingsVersion,
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
