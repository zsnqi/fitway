/**
 * The audit *write* contracts.
 *
 * `HumanAuditEntry` and `SystemAuditEntry` belong to the frozen Phase 5 command
 * append path and are unchanged. The governance entries below are their siblings
 * for access and settings events, which have no command and no count.
 */
export type HumanAuditAction =
	| "correction_delta"
	| "correction_absolute"
	| "reset";

export type HumanAuditEntry = {
	actorPrincipalId: string;
	actorPrincipalKind: "shared_staff" | "owner";
	actorRole: "staff" | "owner";
	commandId: number;
	action: HumanAuditAction;
	priorValue: number | null;
	requestedDelta: number | null;
	requestedValue: number | null;
	effectiveValue: number;
	reason: string | null;
	createdAt: Date;
};

export type SystemAuditEntry = {
	actorPrincipalId: null;
	actorPrincipalKind: "system";
	actorRole: null;
	commandId: number;
	commandIssuerClass: "system";
	action: "reset";
	priorValue: number | null;
	requestedDelta: null;
	requestedValue: 0;
	effectiveValue: 0;
	reason: string;
	createdAt: Date;
};

/** The seven human-approved access actions. This set is locked; it is not extended here. */
export type AccessAuditAction =
	| "staff_pin_provisioned"
	| "staff_pin_rotated"
	| "staff_pin_deactivated"
	| "owner_provisioned"
	| "owner_deactivated"
	| "owner_reactivated"
	| "credential_reset";

export type SettingsAuditAction = "settings_updated";

export type AuditEventClass = "command" | "access" | "settings";

/**
 * What every governance row shares.
 *
 * `commandIssuerClass` is an explicit `null`, never an omission: the column keeps
 * its `'human'` default for the Phase 5 command path, and drizzle omits only
 * `undefined`, so an omitted key would silently become `'human'` and be rejected
 * by the linkage check. The four count columns are explicit nulls for the same
 * reason they are closed in the database — a count column is an integer channel.
 *
 * Only a real owner may author a governance event; there is no system arm here and
 * no synthetic staff identity is ever invented.
 */
type GovernanceAuditBase = {
	actorPrincipalId: string;
	actorPrincipalKind: "owner";
	actorRole: "owner";
	commandId: null;
	commandIssuerClass: null;
	priorValue: null;
	requestedDelta: null;
	requestedValue: null;
	effectiveValue: null;
	reason: string | null;
	createdAt: Date;
};

/**
 * An access-governance row. The credential versions are not free integers: they
 * are read from the principal's own credential row inside the mutation's
 * transaction. `buildAccessAuditEntry` in `./governance` is the only supported way
 * to construct one, and it takes principal snapshots rather than numbers, so no
 * procedure input can place a chosen integer here.
 */
export type AccessAuditEntry = GovernanceAuditBase & {
	eventClass: "access";
	action: AccessAuditAction;
	targetPrincipalId: string;
	priorActive: boolean | null;
	newActive: boolean | null;
	priorCredentialVersion: number | null;
	newCredentialVersion: number | null;
	settingsVersion: null;
};

/** A settings row names the version it created and carries no access state. */
export type SettingsAuditEntry = GovernanceAuditBase & {
	eventClass: "settings";
	action: SettingsAuditAction;
	settingsVersion: number;
	targetPrincipalId: null;
	priorActive: null;
	newActive: null;
	priorCredentialVersion: null;
	newCredentialVersion: null;
};

export type GovernanceAuditEntry = AccessAuditEntry | SettingsAuditEntry;

export type AuditEntry =
	| HumanAuditEntry
	| SystemAuditEntry
	| GovernanceAuditEntry;
