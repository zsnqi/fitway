import { z } from "zod";

import { AUDIT_REASON_MAX_LENGTH } from "../audit/list";

/**
 * The owner access-management contract.
 *
 * Two shapes of the locked 2026-08-11 decisions are structural here rather than
 * enforced downstream:
 *
 * - **No procedure accepts a PIN.** Staff PINs are system-generated, so there is
 *   no input field one could arrive in. The generated PIN leaves in the response
 *   of exactly the two procedures the decision names — provision and rotate —
 *   and appears in no read.
 * - **A reason is an input only where the decision requires one.** The two
 *   destructive actions take a non-empty reason; the other five have no reason
 *   field at all, so none can be attached to a non-destructive row.
 */

/**
 * The longest reason, after trimming. The reason is written to the audit log in
 * the same transaction as the deactivation, and the log stores no more than
 * this, so a longer one is refused here rather than failing that write.
 */
export const ACCESS_REASON_MAX_LENGTH = AUDIT_REASON_MAX_LENGTH;

/** Trimmed, and non-empty after trimming: whitespace is not a reason. */
const requiredReason = z
	.string()
	.trim()
	.min(1)
	.max(ACCESS_REASON_MAX_LENGTH)
	.describe("Why this destructive action was taken");

const principalId = z.uuid();

export const principalGovernanceSchema = z.object({
	principalId,
	principalKind: z.enum(["shared_staff", "owner"]),
	role: z.enum(["staff", "owner"]),
	displayName: z.string(),
	/** Null for the shared staff principal, which never receives an email identity. */
	ownerEmail: z.email().nullable(),
	active: z.boolean(),
	/** Null before provisioning; never coerced to zero. */
	credentialVersion: z.number().int().positive().nullable(),
	credentialActive: z.boolean().nullable(),
});
export type PrincipalGovernance = z.infer<typeof principalGovernanceSchema>;

export const accessListOutputSchema = z.object({
	principals: z.array(principalGovernanceSchema),
});
export type AccessListOutput = z.infer<typeof accessListOutputSchema>;

/**
 * What a mutation says happened.
 *
 * `auditId` is the identity of the row written in the same transaction, so an
 * owner can find the change in the audit history rather than take the response
 * on trust. `revokedSessions` is a count, never a session identifier.
 */
export const accessMutationOutputSchema = z.object({
	auditId: z.number().int().positive(),
	principal: principalGovernanceSchema,
	revokedSessions: z.number().int().nonnegative(),
});
export type AccessMutationOutput = z.infer<typeof accessMutationOutputSchema>;

/**
 * The one-time reveal.
 *
 * A staff PIN is revealed once at provisioning or rotation and is not delivered
 * by email, so this is the only shape in the whole contract that carries secret
 * material, and it carries it exactly once — there is no read path that returns
 * a PIN, and the server keeps only a hash.
 */
export const staffPinRevealOutputSchema = accessMutationOutputSchema.extend({
	revealedPin: z
		.string()
		.describe(
			"Shown once. The server stores only a hash and cannot show it again.",
		),
});
export type StaffPinRevealOutput = z.infer<typeof staffPinRevealOutputSchema>;

/** Provision and rotate take no input: the PIN is generated, never supplied. */
export const staffPinProvisionInputSchema = z.object({});
export const staffPinRotateInputSchema = z.object({});

export const staffPinDeactivateInputSchema = z.object({
	reason: requiredReason,
});
export type StaffPinDeactivateInput = z.infer<
	typeof staffPinDeactivateInputSchema
>;

export const ownerProvisionInputSchema = z.object({
	email: z.email().max(254),
	displayName: z.string().trim().min(1).max(120),
	/**
	 * The initial owner password. V1 has no email delivery, so the provisioning
	 * owner sets it in-app; it is never stored in clear and never audited.
	 */
	password: z.string().min(12).max(200),
});
export type OwnerProvisionInput = z.infer<typeof ownerProvisionInputSchema>;

export const ownerDeactivateInputSchema = z.object({
	targetPrincipalId: principalId,
	reason: requiredReason,
});
export type OwnerDeactivateInput = z.infer<typeof ownerDeactivateInputSchema>;

export const ownerReactivateInputSchema = z.object({
	targetPrincipalId: principalId,
});
export type OwnerReactivateInput = z.infer<typeof ownerReactivateInputSchema>;

export const ownerCredentialResetInputSchema = z.object({
	targetPrincipalId: principalId,
	password: z.string().min(12).max(200),
});
export type OwnerCredentialResetInput = z.infer<
	typeof ownerCredentialResetInputSchema
>;
