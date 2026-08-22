import { ORPCError, ownerProcedure } from "../index";
import {
	accessListOutputSchema,
	accessMutationOutputSchema,
	ownerCredentialResetInputSchema,
	ownerDeactivateInputSchema,
	ownerProvisionInputSchema,
	ownerReactivateInputSchema,
	staffPinDeactivateInputSchema,
	staffPinProvisionInputSchema,
	staffPinRevealOutputSchema,
	staffPinRotateInputSchema,
} from "./contracts";

/**
 * The owner access-management leaves.
 *
 * Every one is an `ownerProcedure`, which is the same server-side guard the
 * analytics, audit, and health leaves use: missing or expired authentication is
 * 401 and staff is 403, decided on the server and never by navigation
 * visibility.
 *
 * The actor is read from the authenticated context and never from the input. An
 * owner cannot name someone else as the actor of a change they made, which is
 * what keeps the audit log's actor column meaningful.
 */

/**
 * Domain refusals arrive as `AccessRuleError` from the repository. They are the
 * caller's fault, not the server's, so they map to `BAD_REQUEST` with their
 * stable code. Anything else is genuinely unexpected and stays a 500 with no
 * detail: a governance failure is not a place to leak internals.
 */
function rethrowAsTransportError(error: unknown): never {
	if (
		error instanceof Error &&
		error.name === "AccessRuleError" &&
		"code" in error &&
		typeof error.code === "string"
	) {
		throw new ORPCError("BAD_REQUEST", {
			message: error.message,
			data: { code: error.code },
		});
	}
	throw error;
}

async function run<T>(work: () => Promise<T>): Promise<T> {
	try {
		return await work();
	} catch (error) {
		return rethrowAsTransportError(error);
	}
}

const list = ownerProcedure
	.output(accessListOutputSchema)
	.handler(({ context }) => {
		if (!context.listAccessPrincipals) {
			throw new ORPCError("INTERNAL_SERVER_ERROR");
		}
		return context.listAccessPrincipals();
	});

const provisionStaffPin = ownerProcedure
	.input(staffPinProvisionInputSchema)
	.output(staffPinRevealOutputSchema)
	.handler(({ context }) => {
		if (!context.provisionStaffPin) {
			throw new ORPCError("INTERNAL_SERVER_ERROR");
		}
		const actorPrincipalId = context.auth.principalId;
		return run(() =>
			// biome-ignore lint/style/noNonNullAssertion: guarded on the line above.
			context.provisionStaffPin!({ actorPrincipalId }),
		);
	});

const rotateStaffPin = ownerProcedure
	.input(staffPinRotateInputSchema)
	.output(staffPinRevealOutputSchema)
	.handler(({ context }) => {
		if (!context.rotateStaffPin) {
			throw new ORPCError("INTERNAL_SERVER_ERROR");
		}
		const actorPrincipalId = context.auth.principalId;
		return run(() =>
			// biome-ignore lint/style/noNonNullAssertion: guarded on the line above.
			context.rotateStaffPin!({ actorPrincipalId }),
		);
	});

const deactivateStaffPin = ownerProcedure
	.input(staffPinDeactivateInputSchema)
	.output(accessMutationOutputSchema)
	.handler(({ context, input }) => {
		if (!context.deactivateStaffPin) {
			throw new ORPCError("INTERNAL_SERVER_ERROR");
		}
		const actorPrincipalId = context.auth.principalId;
		return run(() =>
			// biome-ignore lint/style/noNonNullAssertion: guarded on the line above.
			context.deactivateStaffPin!({ actorPrincipalId, reason: input.reason }),
		);
	});

const provisionOwner = ownerProcedure
	.input(ownerProvisionInputSchema)
	.output(accessMutationOutputSchema)
	.handler(({ context, input }) => {
		if (!context.provisionOwner) {
			throw new ORPCError("INTERNAL_SERVER_ERROR");
		}
		const actorPrincipalId = context.auth.principalId;
		return run(() =>
			// biome-ignore lint/style/noNonNullAssertion: guarded on the line above.
			context.provisionOwner!({ actorPrincipalId, ...input }),
		);
	});

const deactivateOwner = ownerProcedure
	.input(ownerDeactivateInputSchema)
	.output(accessMutationOutputSchema)
	.handler(({ context, input }) => {
		if (!context.deactivateOwner) {
			throw new ORPCError("INTERNAL_SERVER_ERROR");
		}
		const actorPrincipalId = context.auth.principalId;
		return run(() =>
			// biome-ignore lint/style/noNonNullAssertion: guarded on the line above.
			context.deactivateOwner!({ actorPrincipalId, ...input }),
		);
	});

const reactivateOwner = ownerProcedure
	.input(ownerReactivateInputSchema)
	.output(accessMutationOutputSchema)
	.handler(({ context, input }) => {
		if (!context.reactivateOwner) {
			throw new ORPCError("INTERNAL_SERVER_ERROR");
		}
		const actorPrincipalId = context.auth.principalId;
		return run(() =>
			// biome-ignore lint/style/noNonNullAssertion: guarded on the line above.
			context.reactivateOwner!({ actorPrincipalId, ...input }),
		);
	});

const resetOwnerCredential = ownerProcedure
	.input(ownerCredentialResetInputSchema)
	.output(accessMutationOutputSchema)
	.handler(({ context, input }) => {
		if (!context.resetOwnerCredential) {
			throw new ORPCError("INTERNAL_SERVER_ERROR");
		}
		const actorPrincipalId = context.auth.principalId;
		return run(() =>
			// biome-ignore lint/style/noNonNullAssertion: guarded on the line above.
			context.resetOwnerCredential!({ actorPrincipalId, ...input }),
		);
	});

export const adminAccessProcedures = {
	list,
	staffPin: {
		provision: provisionStaffPin,
		rotate: rotateStaffPin,
		deactivate: deactivateStaffPin,
	},
	owner: {
		provision: provisionOwner,
		deactivate: deactivateOwner,
		reactivate: reactivateOwner,
		resetCredential: resetOwnerCredential,
	},
};
