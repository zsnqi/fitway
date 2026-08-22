import { randomBytes } from "node:crypto";

/**
 * Access-governance rules that need nothing but their inputs.
 *
 * They live here, beside the credential primitives, rather than inside the
 * service or the transport, because each one is a human decision recorded on
 * 2026-08-11 and a decision is easier to audit when it is one named function
 * with its own test than when it is a condition inside a mutation.
 *
 * Nothing in this module reads a database or a request. The caller supplies the
 * state it has already read — inside its own transaction, where that matters —
 * and gets back either nothing or a named refusal.
 */

/** `SPEC.md`: a staff PIN is 6-12 Western digits. */
export const STAFF_PIN_MIN_LENGTH = 6;
export const STAFF_PIN_MAX_LENGTH = 12;

/**
 * The length the system generates. Inside the permitted range and at its upper
 * half: the range is what the contract accepts, not what a generator should aim
 * at, and a shared desk PIN is typed rarely and read from a one-time reveal.
 */
export const GENERATED_STAFF_PIN_LENGTH = 8;

const WESTERN_DIGITS = /^[0-9]+$/;

export type AccessRuleCode =
	| "staff_pin_shape"
	| "owner_self_deactivation"
	| "owner_last_active"
	| "owner_already_inactive"
	| "owner_already_active"
	| "not_an_owner"
	| "reason_required";

/**
 * A refused access rule. It carries a stable `code` so the transport can map it
 * to a status without matching on message text, which is copy and will change.
 */
export class AccessRuleError extends Error {
	readonly code: AccessRuleCode;

	constructor(code: AccessRuleCode, message: string) {
		super(message);
		this.name = "AccessRuleError";
		this.code = code;
	}
}

/**
 * `SPEC.md` says Western digits, so this is a digit test and not a
 * locale-sensitive numeric one: Arabic-Indic digits are not accepted even though
 * the owner surface renders in Arabic. The stored PIN and the typed PIN must be
 * the same string on every keyboard.
 */
export function isStaffPinShape(pin: string): boolean {
	return (
		pin.length >= STAFF_PIN_MIN_LENGTH &&
		pin.length <= STAFF_PIN_MAX_LENGTH &&
		WESTERN_DIGITS.test(pin)
	);
}

export function assertStaffPinShape(pin: string): void {
	if (!isStaffPinShape(pin)) {
		throw new AccessRuleError(
			"staff_pin_shape",
			`A staff PIN is ${STAFF_PIN_MIN_LENGTH}-${STAFF_PIN_MAX_LENGTH} Western digits`,
		);
	}
}

/**
 * Generates the shared staff PIN.
 *
 * The human decision is that PINs are system-generated, so no procedure accepts
 * one as input and this is the only place a PIN comes into existence. The digits
 * are drawn by rejection sampling from `randomBytes` rather than by `% 10`: a
 * byte is 256 values and ten does not divide it, so the modulo shortcut would
 * make 0-5 measurably likelier than 6-9 across a six-digit space small enough
 * for that to matter.
 *
 * The byte source is injectable only so the test can prove the rejection path
 * and the digit alphabet. Production never passes it.
 */
export function createStaffPin(
	randomBytesSource: (size: number) => Uint8Array = randomBytes,
	length: number = GENERATED_STAFF_PIN_LENGTH,
): string {
	if (length < STAFF_PIN_MIN_LENGTH || length > STAFF_PIN_MAX_LENGTH) {
		throw new AccessRuleError(
			"staff_pin_shape",
			`A staff PIN is ${STAFF_PIN_MIN_LENGTH}-${STAFF_PIN_MAX_LENGTH} Western digits`,
		);
	}
	// 250 is the largest multiple of ten at or below 256; anything above it is
	// redrawn rather than folded, which is what keeps the digits uniform.
	const REJECT_AT_OR_ABOVE = 250;
	const digits: string[] = [];
	while (digits.length < length) {
		const batch = randomBytesSource(length);
		for (const byte of batch) {
			if (byte >= REJECT_AT_OR_ABOVE) continue;
			digits.push(String(byte % 10));
			if (digits.length === length) break;
		}
	}
	return digits.join("");
}

/** The non-secret governance state of one owner principal, as the caller read it. */
export type OwnerLifecycleTarget = {
	principalId: string;
	role: "staff" | "owner";
	active: boolean;
};

/**
 * Owner deactivation, with both of its locked refusals.
 *
 * `activeOwnerCount` must have been read inside the same transaction as the
 * mutation, and that row set must be locked: the last-active-owner rule is a
 * race otherwise, and two concurrent deactivations would each see two active
 * owners and each proceed. This function cannot enforce that — it only sees a
 * number — which is why the caller's transaction is where the test aims.
 */
export function assertOwnerDeactivationAllowed(input: {
	actorPrincipalId: string;
	target: OwnerLifecycleTarget;
	activeOwnerCount: number;
	reason: string | null;
}): void {
	const { actorPrincipalId, target, activeOwnerCount, reason } = input;
	if (target.role !== "owner") {
		throw new AccessRuleError(
			"not_an_owner",
			"Owner deactivation targets an owner principal",
		);
	}
	if (target.principalId === actorPrincipalId) {
		throw new AccessRuleError(
			"owner_self_deactivation",
			"An owner may not deactivate their own account",
		);
	}
	if (!target.active) {
		throw new AccessRuleError(
			"owner_already_inactive",
			"That owner is already deactivated",
		);
	}
	if (activeOwnerCount <= 1) {
		throw new AccessRuleError(
			"owner_last_active",
			"The last active owner may not be deactivated",
		);
	}
	assertReasonPresent(reason);
}

/** Reactivation is a separate explicit action, and it needs no reason. */
export function assertOwnerReactivationAllowed(input: {
	target: OwnerLifecycleTarget;
}): void {
	if (input.target.role !== "owner") {
		throw new AccessRuleError(
			"not_an_owner",
			"Owner reactivation targets an owner principal",
		);
	}
	if (input.target.active) {
		throw new AccessRuleError(
			"owner_already_active",
			"That owner is already active",
		);
	}
}

/**
 * The two destructive actions require a reason. Whitespace is not a reason, so a
 * blank string is refused rather than trimmed into the audit row.
 */
export function assertReasonPresent(reason: string | null): asserts reason {
	if (reason === null || reason.trim().length === 0) {
		throw new AccessRuleError(
			"reason_required",
			"This action requires a reason",
		);
	}
}
