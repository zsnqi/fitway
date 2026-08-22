import { buildAccessAuditEntry } from "@fitway/api/audit/governance";
import type { AccessAuditAction } from "@fitway/api/audit/types";
import {
	AccessRuleError,
	assertOwnerDeactivationAllowed,
	assertOwnerReactivationAllowed,
	assertReasonPresent,
} from "@fitway/auth";
import type { db } from "@fitway/db";
import {
	authOwnerCredentials,
	authPrincipals,
	authSessions,
	authStaffCredentials,
} from "@fitway/db/schema/auth";
import { and, asc, eq, isNull } from "drizzle-orm";

import { appendAuditEntry } from "./audit-repository";

type Database = typeof db;
type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

/**
 * Owner-visible access state. Deliberately the same narrow shape the audit
 * contract accepts — an active flag and a credential version — plus the identity
 * an owner needs to tell two principals apart. No hash, salt, or session token
 * has a field to live in, here or on the way out.
 */
export type PrincipalGovernanceView = {
	principalId: string;
	principalKind: "shared_staff" | "owner";
	role: "staff" | "owner";
	displayName: string;
	ownerEmail: string | null;
	active: boolean;
	credentialVersion: number | null;
	credentialActive: boolean | null;
};

/**
 * Why deactivation revokes sessions instead of relying on the checks that
 * already exist.
 *
 * `AuthService` refuses a session whose principal is inactive, whose credential
 * is inactive, or whose credential version has moved. That is enough to end a
 * session *while* the principal is deactivated — but it is lazy, and the session
 * row survives. Reactivation would then hand the principal's pre-deactivation
 * sessions back, still valid, because nothing about them changed. The locked
 * decision says deactivation invalidates active sessions, not that it suspends
 * them, so the rows are revoked here and reactivation cannot resurrect them.
 */
async function revokePrincipalSessions(
	transaction: Transaction,
	principalId: string,
	now: Date,
): Promise<number> {
	const revoked = await transaction
		.update(authSessions)
		.set({ revokedAt: now })
		.where(
			and(
				eq(authSessions.principalId, principalId),
				isNull(authSessions.revokedAt),
			),
		)
		.returning({ id: authSessions.id });
	return revoked.length;
}

function governanceView(
	principal: typeof authPrincipals.$inferSelect,
	credential: { credentialVersion: number; active: boolean } | null,
): PrincipalGovernanceView {
	return {
		principalId: principal.id,
		principalKind: principal.principalKind,
		role: principal.role,
		displayName: principal.displayName,
		ownerEmail: principal.ownerEmail,
		active: principal.active,
		credentialVersion: credential?.credentialVersion ?? null,
		credentialActive: credential?.active ?? null,
	};
}

/**
 * The snapshot the audit contract takes. `credentialVersion` is null when there
 * is no credential row at all, which is the honest state before provisioning;
 * it is never coerced to zero.
 */
function snapshot(view: PrincipalGovernanceView) {
	return {
		principalId: view.principalId,
		active: view.active,
		credentialVersion: view.credentialVersion,
	};
}

async function readStaffState(transaction: Transaction) {
	const [row] = await transaction
		.select({
			principal: authPrincipals,
			credential: authStaffCredentials,
		})
		.from(authPrincipals)
		.leftJoin(
			authStaffCredentials,
			eq(authStaffCredentials.principalId, authPrincipals.id),
		)
		.where(eq(authPrincipals.principalKind, "shared_staff"))
		.limit(1);
	if (!row) return null;
	return {
		principal: row.principal,
		credential: row.credential,
		view: governanceView(row.principal, row.credential),
	};
}

async function readOwnerState(transaction: Transaction, principalId: string) {
	const [row] = await transaction
		.select({
			principal: authPrincipals,
			credential: authOwnerCredentials,
		})
		.from(authPrincipals)
		.leftJoin(
			authOwnerCredentials,
			eq(authOwnerCredentials.principalId, authPrincipals.id),
		)
		.where(eq(authPrincipals.id, principalId))
		.limit(1);
	if (!row) return null;
	return {
		principal: row.principal,
		credential: row.credential,
		view: governanceView(row.principal, row.credential),
	};
}

/**
 * Counts active owners with the rows locked.
 *
 * `for update` is the whole point. The last-active-owner rule compares a count
 * against a mutation, and without the lock two concurrent deactivations each
 * read two active owners, each pass, and the gym is left with none. The lock
 * makes the second transaction wait and re-read a count of one.
 */
async function countActiveOwnersForUpdate(
	transaction: Transaction,
): Promise<number> {
	const rows = await transaction
		.select({ id: authPrincipals.id })
		.from(authPrincipals)
		.where(
			and(
				eq(authPrincipals.principalKind, "owner"),
				eq(authPrincipals.active, true),
			),
		)
		.for("update");
	return rows.length;
}

export type AccessMutationResult = {
	auditId: number;
	principal: PrincipalGovernanceView;
	revokedSessions: number;
};

/**
 * Every governance mutation writes its audit row inside its own transaction.
 *
 * `SPEC.md` requires the mutation and its audit row to share one transaction, so
 * this is the only shape a governance write takes here: read the before snapshot
 * under the transaction, mutate, read the after snapshot under the same
 * transaction, build the row from those two snapshots, append. A caller cannot
 * supply either snapshot and therefore cannot describe a transition that did not
 * happen.
 */
async function appendGovernanceRow(
	transaction: Transaction,
	input: {
		action: AccessAuditAction;
		actorPrincipalId: string;
		before: PrincipalGovernanceView;
		after: PrincipalGovernanceView;
		reason: string | null;
		now: Date;
	},
): Promise<number> {
	return appendAuditEntry(
		transaction,
		buildAccessAuditEntry({
			action: input.action,
			actorPrincipalId: input.actorPrincipalId,
			before: snapshot(input.before),
			after: snapshot(input.after),
			reason: input.reason,
			createdAt: input.now,
		}),
	);
}

export class AccessRepository {
	readonly #db: Database;

	constructor(database: Database) {
		this.#db = database;
	}

	/** The owner-visible list. Shared staff first, then owners by display name. */
	async listPrincipals(): Promise<PrincipalGovernanceView[]> {
		const rows = await this.#db
			.select({
				principal: authPrincipals,
				staffCredential: authStaffCredentials,
				ownerCredential: authOwnerCredentials,
			})
			.from(authPrincipals)
			.leftJoin(
				authStaffCredentials,
				eq(authStaffCredentials.principalId, authPrincipals.id),
			)
			.leftJoin(
				authOwnerCredentials,
				eq(authOwnerCredentials.principalId, authPrincipals.id),
			)
			.orderBy(asc(authPrincipals.principalKind), asc(authPrincipals.id));
		return rows.map((row) =>
			governanceView(
				row.principal,
				row.principal.principalKind === "shared_staff"
					? row.staffCredential
					: row.ownerCredential,
			),
		);
	}

	/**
	 * Provisions the shared staff PIN when none is active.
	 *
	 * The shared staff principal is singular by unique index, so this is a
	 * credential operation on an existing principal rather than a principal
	 * creation. When the principal does not exist yet it is created here, which is
	 * the same thing the login path does.
	 */
	async provisionStaffPin(input: {
		actorPrincipalId: string;
		pinHash: string;
		pinSalt: string;
		now: Date;
	}): Promise<AccessMutationResult> {
		return this.#db.transaction(async (transaction) => {
			const existing = await readStaffState(transaction);
			if (existing?.credential?.active) {
				throw new AccessRuleError(
					"staff_pin_shape",
					"An active staff PIN already exists; rotate it instead",
				);
			}
			const principal =
				existing?.principal ??
				(
					await transaction
						.insert(authPrincipals)
						.values({
							principalKind: "shared_staff",
							role: "staff",
							ownerEmail: null,
							displayName: "Shared front desk",
							createdAt: input.now,
							updatedAt: input.now,
						})
						.returning()
				)[0];
			if (!principal)
				throw new Error("Failed to create shared staff principal");
			const before = existing ? existing.view : governanceView(principal, null);

			const [credential] = existing?.credential
				? await transaction
						.update(authStaffCredentials)
						.set({
							pinHash: input.pinHash,
							pinSalt: input.pinSalt,
							credentialVersion: existing.credential.credentialVersion + 1,
							active: true,
							rotatedAt: input.now,
						})
						.where(eq(authStaffCredentials.id, existing.credential.id))
						.returning()
				: await transaction
						.insert(authStaffCredentials)
						.values({
							principalId: principal.id,
							pinHash: input.pinHash,
							pinSalt: input.pinSalt,
							createdAt: input.now,
							rotatedAt: input.now,
						})
						.returning();
			if (!credential) throw new Error("Failed to store staff credential");

			const after = governanceView(principal, credential);
			const auditId = await appendGovernanceRow(transaction, {
				action: "staff_pin_provisioned",
				actorPrincipalId: input.actorPrincipalId,
				before,
				after,
				reason: null,
				now: input.now,
			});
			return { auditId, principal: after, revokedSessions: 0 };
		});
	}

	/** Rotates the shared staff PIN, advancing the version and ending live sessions. */
	async rotateStaffPin(input: {
		actorPrincipalId: string;
		pinHash: string;
		pinSalt: string;
		now: Date;
	}): Promise<AccessMutationResult> {
		return this.#db.transaction(async (transaction) => {
			const existing = await readStaffState(transaction);
			if (!existing?.credential?.active) {
				throw new AccessRuleError(
					"staff_pin_shape",
					"There is no active staff PIN to rotate",
				);
			}
			const before = existing.view;
			const [credential] = await transaction
				.update(authStaffCredentials)
				.set({
					pinHash: input.pinHash,
					pinSalt: input.pinSalt,
					credentialVersion: existing.credential.credentialVersion + 1,
					active: true,
					rotatedAt: input.now,
				})
				.where(eq(authStaffCredentials.id, existing.credential.id))
				.returning();
			if (!credential) throw new Error("Failed to rotate staff credential");
			const revokedSessions = await revokePrincipalSessions(
				transaction,
				existing.principal.id,
				input.now,
			);
			const after = governanceView(existing.principal, credential);
			const auditId = await appendGovernanceRow(transaction, {
				action: "staff_pin_rotated",
				actorPrincipalId: input.actorPrincipalId,
				before,
				after,
				reason: null,
				now: input.now,
			});
			return { auditId, principal: after, revokedSessions };
		});
	}

	/** Deactivates the shared staff PIN. Destructive, so a reason is required. */
	async deactivateStaffPin(input: {
		actorPrincipalId: string;
		reason: string | null;
		now: Date;
	}): Promise<AccessMutationResult> {
		assertReasonPresent(input.reason);
		return this.#db.transaction(async (transaction) => {
			const existing = await readStaffState(transaction);
			if (!existing?.credential?.active) {
				throw new AccessRuleError(
					"staff_pin_shape",
					"There is no active staff PIN to deactivate",
				);
			}
			const before = existing.view;
			const [credential] = await transaction
				.update(authStaffCredentials)
				.set({ active: false })
				.where(eq(authStaffCredentials.id, existing.credential.id))
				.returning();
			if (!credential) throw new Error("Failed to deactivate staff credential");
			const revokedSessions = await revokePrincipalSessions(
				transaction,
				existing.principal.id,
				input.now,
			);
			const after = governanceView(existing.principal, credential);
			const auditId = await appendGovernanceRow(transaction, {
				action: "staff_pin_deactivated",
				actorPrincipalId: input.actorPrincipalId,
				before,
				after,
				reason: input.reason,
				now: input.now,
			});
			return { auditId, principal: after, revokedSessions };
		});
	}

	/** Provisions a real owner principal with its own credential. */
	async provisionOwner(input: {
		actorPrincipalId: string;
		email: string;
		displayName: string;
		passwordHash: string;
		passwordSalt: string;
		now: Date;
	}): Promise<AccessMutationResult> {
		return this.#db.transaction(async (transaction) => {
			const [principal] = await transaction
				.insert(authPrincipals)
				.values({
					principalKind: "owner",
					role: "owner",
					ownerEmail: input.email,
					displayName: input.displayName,
					createdAt: input.now,
					updatedAt: input.now,
				})
				.returning();
			if (!principal) throw new Error("Failed to provision owner principal");
			const [credential] = await transaction
				.insert(authOwnerCredentials)
				.values({
					principalId: principal.id,
					passwordHash: input.passwordHash,
					passwordSalt: input.passwordSalt,
					createdAt: input.now,
					rotatedAt: input.now,
				})
				.returning();
			if (!credential) throw new Error("Failed to provision owner credential");
			const after = governanceView(principal, credential);
			// The principal did not exist a moment ago, so its before-state is the
			// row as inserted. `owner_provisioned` records neither transition, so
			// nothing here can claim a change that did not happen.
			const auditId = await appendGovernanceRow(transaction, {
				action: "owner_provisioned",
				actorPrincipalId: input.actorPrincipalId,
				before: after,
				after,
				reason: null,
				now: input.now,
			});
			return { auditId, principal: after, revokedSessions: 0 };
		});
	}

	/**
	 * Deactivates another owner.
	 *
	 * The active-owner count is read with the rows locked *before* the target is
	 * examined, so a concurrent deactivation cannot slip between the check and the
	 * write. Hard deletion is out of scope for v1; this is the only removal there is.
	 */
	async deactivateOwner(input: {
		actorPrincipalId: string;
		targetPrincipalId: string;
		reason: string | null;
		now: Date;
	}): Promise<AccessMutationResult> {
		return this.#db.transaction(async (transaction) => {
			const activeOwnerCount = await countActiveOwnersForUpdate(transaction);
			const existing = await readOwnerState(
				transaction,
				input.targetPrincipalId,
			);
			if (!existing) {
				throw new AccessRuleError("not_an_owner", "No such principal");
			}
			assertOwnerDeactivationAllowed({
				actorPrincipalId: input.actorPrincipalId,
				target: {
					principalId: existing.principal.id,
					role: existing.principal.role,
					active: existing.principal.active,
				},
				activeOwnerCount,
				reason: input.reason,
			});
			const before = existing.view;
			const [principal] = await transaction
				.update(authPrincipals)
				.set({ active: false, updatedAt: input.now })
				.where(eq(authPrincipals.id, existing.principal.id))
				.returning();
			if (!principal) throw new Error("Failed to deactivate owner principal");
			// The decision says deactivation invalidates the principal's credentials
			// as well as its sessions, so the credential is deactivated too rather
			// than left active behind an inactive principal.
			const [credential] = existing.credential
				? await transaction
						.update(authOwnerCredentials)
						.set({ active: false })
						.where(eq(authOwnerCredentials.id, existing.credential.id))
						.returning()
				: [null];
			const revokedSessions = await revokePrincipalSessions(
				transaction,
				principal.id,
				input.now,
			);
			const after = governanceView(principal, credential);
			const auditId = await appendGovernanceRow(transaction, {
				action: "owner_deactivated",
				actorPrincipalId: input.actorPrincipalId,
				before,
				after,
				reason: input.reason,
				now: input.now,
			});
			return { auditId, principal: after, revokedSessions };
		});
	}

	/** Reactivation is its own explicit action and carries no reason. */
	async reactivateOwner(input: {
		actorPrincipalId: string;
		targetPrincipalId: string;
		now: Date;
	}): Promise<AccessMutationResult> {
		return this.#db.transaction(async (transaction) => {
			const existing = await readOwnerState(
				transaction,
				input.targetPrincipalId,
			);
			if (!existing) {
				throw new AccessRuleError("not_an_owner", "No such principal");
			}
			assertOwnerReactivationAllowed({
				target: {
					principalId: existing.principal.id,
					role: existing.principal.role,
					active: existing.principal.active,
				},
			});
			const before = existing.view;
			const [principal] = await transaction
				.update(authPrincipals)
				.set({ active: true, updatedAt: input.now })
				.where(eq(authPrincipals.id, existing.principal.id))
				.returning();
			if (!principal) throw new Error("Failed to reactivate owner principal");
			const [credential] = existing.credential
				? await transaction
						.update(authOwnerCredentials)
						.set({ active: true })
						.where(eq(authOwnerCredentials.id, existing.credential.id))
						.returning()
				: [null];
			const after = governanceView(principal, credential);
			const auditId = await appendGovernanceRow(transaction, {
				action: "owner_reactivated",
				actorPrincipalId: input.actorPrincipalId,
				before,
				after,
				reason: null,
				now: input.now,
			});
			return { auditId, principal: after, revokedSessions: 0 };
		});
	}

	/**
	 * Sets a new owner credential in-app.
	 *
	 * V1 has no email-based reset flow, so this is the whole recovery path. It
	 * advances the credential version, which is what the audit row records and
	 * what makes every session issued against the old credential unusable.
	 */
	async resetOwnerCredential(input: {
		actorPrincipalId: string;
		targetPrincipalId: string;
		passwordHash: string;
		passwordSalt: string;
		now: Date;
	}): Promise<AccessMutationResult> {
		return this.#db.transaction(async (transaction) => {
			const existing = await readOwnerState(
				transaction,
				input.targetPrincipalId,
			);
			if (existing?.principal.role !== "owner") {
				throw new AccessRuleError("not_an_owner", "No such owner principal");
			}
			if (!existing.credential) {
				throw new AccessRuleError(
					"not_an_owner",
					"That owner has no credential to reset",
				);
			}
			const before = existing.view;
			const [credential] = await transaction
				.update(authOwnerCredentials)
				.set({
					passwordHash: input.passwordHash,
					passwordSalt: input.passwordSalt,
					credentialVersion: existing.credential.credentialVersion + 1,
					active: true,
					rotatedAt: input.now,
				})
				.where(eq(authOwnerCredentials.id, existing.credential.id))
				.returning();
			if (!credential) throw new Error("Failed to reset owner credential");
			const revokedSessions = await revokePrincipalSessions(
				transaction,
				existing.principal.id,
				input.now,
			);
			const after = governanceView(existing.principal, credential);
			const auditId = await appendGovernanceRow(transaction, {
				action: "credential_reset",
				actorPrincipalId: input.actorPrincipalId,
				before,
				after,
				reason: null,
				now: input.now,
			});
			return { auditId, principal: after, revokedSessions };
		});
	}
}
