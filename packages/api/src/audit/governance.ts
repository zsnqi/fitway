import type {
	AccessAuditAction,
	AccessAuditEntry,
	SettingsAuditEntry,
} from "./types";

/**
 * Construction of governance audit rows.
 *
 * This module exists to close one channel structurally rather than to promise it
 * is closed. `prior_credential_version` and `new_credential_version` are bounded
 * only by `> 0` in the database, and a staff PIN is 6-12 Western digits, so an
 * access procedure that accepted a credential version as *input* would hand an
 * operator a place to write a chosen integer into the audit log.
 *
 * The closure is the shape of these functions: they take before/after snapshots of
 * the principal — rows the caller must have read inside the mutation's own
 * transaction — and never a version number. There is consequently no credential
 * version to put on any access procedure's input schema, and the versions written
 * are by construction the principal's actual versions.
 *
 * A credential version is a small monotonic counter and is not secret material.
 * That is a statement about the data, recorded here rather than asserted as proof.
 */

/**
 * The governance-relevant, non-secret state of one principal at one instant.
 *
 * Deliberately narrow: an active flag and a credential version. A PIN, password,
 * hash, salt, pepper-derived value, or session token has nowhere to go in this
 * shape, so none can reach an audit row through it.
 *
 * `credentialVersion` is null when the principal has no credential row at all,
 * which is the honest state before provisioning and after a hard credential
 * removal; it is never coerced to zero.
 */
export type PrincipalGovernanceSnapshot = {
	principalId: string;
	active: boolean;
	credentialVersion: number | null;
};

/** The actions whose state transition the database requires; see migration 0007. */
const CREDENTIAL_TRANSITION_ACTIONS = new Set<AccessAuditAction>([
	"staff_pin_rotated",
	"credential_reset",
]);
const ACTIVE_TRANSITION_ACTIONS = new Set<AccessAuditAction>([
	"owner_deactivated",
	"owner_reactivated",
]);
/** A reason is required for these two only; the human decision says "only". */
const REASON_REQUIRED_ACTIONS = new Set<AccessAuditAction>([
	"staff_pin_deactivated",
	"owner_deactivated",
]);

export class GovernanceAuditError extends Error {}

function assertSameTarget(
	before: PrincipalGovernanceSnapshot,
	after: PrincipalGovernanceSnapshot,
): void {
	if (before.principalId !== after.principalId) {
		throw new GovernanceAuditError(
			"A governance audit row must describe one principal",
		);
	}
}

/**
 * Builds one access-governance audit row from snapshots taken inside the
 * mutation's transaction.
 *
 * Every rule the database enforces is re-asserted here so a violation surfaces as
 * a named error at the call site rather than as an opaque constraint failure that
 * — under `SPEC.md:212-214`, where the mutation and its audit row share one
 * transaction — would abort the mutation itself.
 */
export function buildAccessAuditEntry(input: {
	action: AccessAuditAction;
	/** The owner performing the action, never the subject of it. */
	actorPrincipalId: string;
	/** Read inside the transaction, before the mutation. */
	before: PrincipalGovernanceSnapshot;
	/** Read inside the transaction, after the mutation. */
	after: PrincipalGovernanceSnapshot;
	reason: string | null;
	createdAt: Date;
}): AccessAuditEntry {
	const { action, before, after } = input;
	assertSameTarget(before, after);

	const reason = input.reason;
	if (REASON_REQUIRED_ACTIONS.has(action) && reason === null) {
		throw new GovernanceAuditError(`${action} requires a reason`);
	}

	const carriesCredentialTransition = CREDENTIAL_TRANSITION_ACTIONS.has(action);
	const carriesActiveTransition = ACTIVE_TRANSITION_ACTIONS.has(action);

	if (carriesCredentialTransition) {
		if (before.credentialVersion === null || after.credentialVersion === null) {
			throw new GovernanceAuditError(
				`${action} requires both credential versions`,
			);
		}
		if (after.credentialVersion <= before.credentialVersion) {
			throw new GovernanceAuditError(
				`${action} must advance the credential version`,
			);
		}
	}
	if (carriesActiveTransition) {
		const expectedPrior = action === "owner_deactivated";
		if (before.active !== expectedPrior || after.active === expectedPrior) {
			throw new GovernanceAuditError(
				`${action} must record the matching active transition`,
			);
		}
	}

	return {
		eventClass: "access",
		action,
		actorPrincipalId: input.actorPrincipalId,
		actorPrincipalKind: "owner",
		actorRole: "owner",
		targetPrincipalId: after.principalId,
		// Recorded only where the action is *about* the transition. Elsewhere the
		// honest value is "not recorded", never a repeated current value dressed up
		// as a change.
		priorActive: carriesActiveTransition ? before.active : null,
		newActive: carriesActiveTransition ? after.active : null,
		priorCredentialVersion: carriesCredentialTransition
			? before.credentialVersion
			: null,
		newCredentialVersion: carriesCredentialTransition
			? after.credentialVersion
			: null,
		settingsVersion: null,
		commandId: null,
		commandIssuerClass: null,
		priorValue: null,
		requestedDelta: null,
		requestedValue: null,
		effectiveValue: null,
		reason,
		createdAt: input.createdAt,
	};
}

/**
 * Builds the settings-governance row. `settingsVersion` is the identity of the
 * version the mutation just appended, read back from the insert inside the same
 * transaction; `settings_versions` is append-only, so it names the change exactly.
 */
export function buildSettingsAuditEntry(input: {
	actorPrincipalId: string;
	settingsVersion: number;
	reason: string | null;
	createdAt: Date;
}): SettingsAuditEntry {
	if (
		!Number.isSafeInteger(input.settingsVersion) ||
		input.settingsVersion <= 0
	) {
		throw new GovernanceAuditError(
			"A settings audit row must name a persisted settings version",
		);
	}
	return {
		eventClass: "settings",
		action: "settings_updated",
		actorPrincipalId: input.actorPrincipalId,
		actorPrincipalKind: "owner",
		actorRole: "owner",
		settingsVersion: input.settingsVersion,
		targetPrincipalId: null,
		priorActive: null,
		newActive: null,
		priorCredentialVersion: null,
		newCredentialVersion: null,
		commandId: null,
		commandIssuerClass: null,
		priorValue: null,
		requestedDelta: null,
		requestedValue: null,
		effectiveValue: null,
		reason: input.reason,
		createdAt: input.createdAt,
	};
}
