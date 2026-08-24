import type {
	AccessMutationOutput,
	OwnerCredentialResetInput,
	OwnerDeactivateInput,
	OwnerProvisionInput,
	OwnerReactivateInput,
	PrincipalGovernance,
	StaffPinDeactivateInput,
} from "@fitway/api/access/contracts";
import {
	accessListOutputSchema,
	accessMutationOutputSchema,
	staffPinRevealOutputSchema,
} from "@fitway/api/access/contracts";
import { ORPCError } from "@orpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { client } from "@/utils/orpc";

/**
 * Mirror of the `AccessRuleCode` union at `packages/auth/src/access.ts` —
 * minus one code.
 *
 * `staff_pin_shape` is deliberately absent: it is a generator-defect code, not
 * a caller refusal. A staff PIN is system-generated and never supplied by an
 * owner, so an off-shape PIN can only mean the generator itself produced
 * garbage, which the server converts to a fault before the transport sees it.
 * An owner can never provoke it, so it never arrives here as a typed
 * `BAD_REQUEST`, and this union must not grow it back.
 */
export type OwnerAccessRefusalCode =
	| "staff_pin_already_active"
	| "staff_pin_not_active"
	| "owner_self_deactivation"
	| "owner_last_active"
	| "owner_already_inactive"
	| "owner_already_active"
	| "owner_email_taken"
	| "not_an_owner"
	| "reason_required";

const REFUSAL_CODES: ReadonlySet<string> = new Set<OwnerAccessRefusalCode>([
	"staff_pin_already_active",
	"staff_pin_not_active",
	"owner_self_deactivation",
	"owner_last_active",
	"owner_already_inactive",
	"owner_already_active",
	"owner_email_taken",
	"not_an_owner",
	"reason_required",
]);

/**
 * Classifies a mutation failure as either a named governance refusal or an
 * unnamed failure. Only a typed `BAD_REQUEST` carrying one of the nine
 * owner-provokable codes counts as a refusal; anything else — including a
 * `BAD_REQUEST` carrying `staff_pin_shape`, which would be a server defect —
 * falls through to the generic failure phase.
 */
function refusalCode(error: unknown): OwnerAccessRefusalCode | null {
	if (!(error instanceof ORPCError)) return null;
	if (error.code !== "BAD_REQUEST") return null;
	const data = error.data as { code?: unknown } | undefined;
	const code = data?.code;
	return typeof code === "string" && REFUSAL_CODES.has(code)
		? (code as OwnerAccessRefusalCode)
		: null;
}

/**
 * What one mutation says happened, shaped so presentation can branch without
 * re-deriving meaning from transport details: refused changes carry their
 * stable governance code, unexpected failures do not pretend to be refusals,
 * and every success carries the audit row written for it in the same
 * transaction.
 */
export type OwnerAccessMutationOutcome =
	| { phase: "idle" }
	| { phase: "pending" }
	| { phase: "success"; output: AccessMutationOutput }
	| { phase: "refused"; code: OwnerAccessRefusalCode }
	| { phase: "failed" };

export type OwnerAccessMutation<TInput> = {
	outcome: OwnerAccessMutationOutcome;
	submit: (input: TInput) => void;
	reset: () => void;
};

export type OwnerAccessResult = {
	/**
	 * `standby` means enablement has not been granted yet, so the hook issues no
	 * request at all — the same standing-down the audit and health sections
	 * perform while `/admin` already speaks for the page.
	 */
	status: "standby" | "pending" | "error" | "success";
	principals: PrincipalGovernance[];
	retry: () => void;
	provisionStaffPin: OwnerAccessMutation<void>;
	rotateStaffPin: OwnerAccessMutation<void>;
	deactivateStaffPin: OwnerAccessMutation<StaffPinDeactivateInput>;
	provisionOwner: OwnerAccessMutation<OwnerProvisionInput>;
	deactivateOwner: OwnerAccessMutation<OwnerDeactivateInput>;
	reactivateOwner: OwnerAccessMutation<OwnerReactivateInput>;
	resetOwnerCredential: OwnerAccessMutation<OwnerCredentialResetInput>;
	/**
	 * The one-time reveal from provision or rotate. It lives outside the query
	 * cache and disappears on dismissal or unmount; see the comment on
	 * `useStaffPinRevealMutation`.
	 */
	revealedPin: string | null;
	dismissRevealedPin: () => void;
};

const LIST_KEY = ["owner", "access", "list"] as const;

function outcomeOf(
	data: AccessMutationOutput | undefined,
	isIdle: boolean,
	isPending: boolean,
	error: unknown,
): OwnerAccessMutationOutcome {
	if (isIdle) return { phase: "idle" };
	if (isPending) return { phase: "pending" };
	if (error !== null) {
		const code = refusalCode(error);
		return code === null ? { phase: "failed" } : { phase: "refused", code };
	}
	return data === undefined
		? { phase: "failed" }
		: { phase: "success", output: data };
}

/** The sanitized half of a reveal response: everything except the secret. */
function withoutReveal({
	auditId,
	principal,
	revokedSessions,
}: AccessMutationOutput): AccessMutationOutput {
	return { auditId, principal, revokedSessions };
}

function refreshPrincipals(queryClient: ReturnType<typeof useQueryClient>) {
	void queryClient.invalidateQueries({ queryKey: LIST_KEY });
}

/**
 * One governance writer. The response is parsed against the shared schema, a
 * success marks the principal list stale so the table reflects what the audit
 * row records, and nothing logs anything.
 */
function useGovernanceMutation<TInput>(
	call: (input: TInput) => Promise<unknown>,
): OwnerAccessMutation<TInput> {
	const queryClient = useQueryClient();
	const mutation = useMutation({
		mutationFn: async (input: TInput): Promise<AccessMutationOutput> =>
			accessMutationOutputSchema.parse(await call(input)),
		onSuccess: () => {
			refreshPrincipals(queryClient);
		},
		retry: false,
	});
	return {
		outcome: outcomeOf(
			mutation.data,
			mutation.isIdle,
			mutation.isPending,
			mutation.error,
		),
		submit: (input) => void mutation.mutate(input),
		reset: () => mutation.reset(),
	};
}

/**
 * Provision or rotate: the one-time reveal.
 *
 * TanStack Query retains `mutation.data` after a mutation settles, so letting
 * the raw response through would leave the PIN sitting in the mutation cache
 * indefinitely. The mutation function instead parses against the shared
 * schema, hands `revealedPin` to hook state that dies on dismissal or
 * unmount, and returns only the sanitized remainder — the cache never holds
 * credential material. Nothing here logs a result, so the PIN reaches neither
 * the console nor any persistence layer.
 */
function useStaffPinRevealMutation(
	call: () => Promise<unknown>,
	setRevealedPin: (pin: string | null) => void,
): OwnerAccessMutation<void> {
	const queryClient = useQueryClient();
	const mutation = useMutation({
		mutationFn: async (): Promise<AccessMutationOutput> => {
			const parsed = staffPinRevealOutputSchema.parse(await call());
			setRevealedPin(parsed.revealedPin);
			return withoutReveal(parsed);
		},
		onSuccess: () => {
			refreshPrincipals(queryClient);
		},
		retry: false,
	});
	return {
		outcome: outcomeOf(
			mutation.data,
			mutation.isIdle,
			mutation.isPending,
			mutation.error,
		),
		submit: () => void mutation.mutate(undefined),
		reset: () => mutation.reset(),
	};
}

/**
 * Owner access management: principals, shared-staff-PIN lifecycle, owner
 * lifecycle. Data layer only — it renders nothing and decides nothing about
 * when the section appears.
 *
 * ## The list does not fetch until told to
 *
 * Enablement is an explicit argument, not a mount-time default. Five sibling
 * `/admin` browser specs stub no `admin.access` route, so a hook that fired
 * `admin.access.list` unconditionally on mount would put an unmocked request
 * into specs this layer cannot repair. While `enabled` is false the status is
 * `standby` and the wire stays silent; the section turns the hook on once its
 * own prerequisite resolves.
 *
 * ## Reads are schema-validated
 *
 * The list response is parsed against the shared transport schema, so a
 * malformed payload surfaces as an error rather than rendering as a
 * plausible-looking principal.
 *
 * ## Refusals are typed, defects are not
 *
 * Each mutation maps a server-typed governance refusal to
 * `{ phase: "refused", code }`; anything else is `{ phase: "failed" }`.
 * `staff_pin_shape` is intentionally outside the refusal set — see
 * `OwnerAccessRefusalCode`.
 */
export function useOwnerAccess({
	enabled,
}: {
	enabled: boolean;
}): OwnerAccessResult {
	const [revealedPin, setRevealedPin] = useState<string | null>(null);

	const list = useQuery({
		queryKey: LIST_KEY,
		enabled,
		queryFn: async (): Promise<{ principals: PrincipalGovernance[] }> =>
			accessListOutputSchema.parse(await client.admin.access.list()),
		retry: false,
		refetchOnWindowFocus: false,
	});

	const status: OwnerAccessResult["status"] = !enabled
		? "standby"
		: list.isError
			? "error"
			: list.isPending
				? "pending"
				: "success";

	const provisionStaffPin = useStaffPinRevealMutation(
		() => client.admin.access.staffPin.provision({}),
		setRevealedPin,
	);
	const rotateStaffPin = useStaffPinRevealMutation(
		() => client.admin.access.staffPin.rotate({}),
		setRevealedPin,
	);
	const deactivateStaffPin = useGovernanceMutation<StaffPinDeactivateInput>(
		(input) => client.admin.access.staffPin.deactivate(input),
	);
	const provisionOwner = useGovernanceMutation<OwnerProvisionInput>((input) =>
		client.admin.access.owner.provision(input),
	);
	const deactivateOwner = useGovernanceMutation<OwnerDeactivateInput>((input) =>
		client.admin.access.owner.deactivate(input),
	);
	const reactivateOwner = useGovernanceMutation<OwnerReactivateInput>((input) =>
		client.admin.access.owner.reactivate(input),
	);
	const resetOwnerCredential = useGovernanceMutation<OwnerCredentialResetInput>(
		(input) => client.admin.access.owner.resetCredential(input),
	);

	return {
		status,
		principals: status === "success" ? (list.data?.principals ?? []) : [],
		retry: () => void list.refetch(),
		provisionStaffPin,
		rotateStaffPin,
		deactivateStaffPin,
		provisionOwner,
		deactivateOwner,
		reactivateOwner,
		resetOwnerCredential,
		revealedPin,
		dismissRevealedPin: () => setRevealedPin(null),
	};
}
