import { describe, expect, it } from "vitest";

import {
	AccessRuleError,
	assertOwnerCredentialResetAllowed,
	assertOwnerDeactivationAllowed,
	assertOwnerReactivationAllowed,
	assertReasonPresent,
	assertStaffPinShape,
	createStaffPin,
	GENERATED_STAFF_PIN_LENGTH,
	isStaffPinShape,
	STAFF_PIN_MAX_LENGTH,
	STAFF_PIN_MIN_LENGTH,
} from "./access";

function ruleCode(run: () => void) {
	try {
		run();
	} catch (error) {
		if (error instanceof AccessRuleError) return error.code;
		throw error;
	}
	return null;
}

const owner = {
	principalId: "00000000-0000-4000-8000-000000000001",
	role: "owner",
	active: true,
} as const;
const otherOwner = {
	principalId: "00000000-0000-4000-8000-000000000002",
	role: "owner",
	active: true,
} as const;

describe("staff PIN shape", () => {
	it("accepts the whole documented range and nothing outside it", () => {
		expect(isStaffPinShape("1".repeat(STAFF_PIN_MIN_LENGTH))).toBe(true);
		expect(isStaffPinShape("1".repeat(STAFF_PIN_MAX_LENGTH))).toBe(true);
		expect(isStaffPinShape("1".repeat(STAFF_PIN_MIN_LENGTH - 1))).toBe(false);
		expect(isStaffPinShape("1".repeat(STAFF_PIN_MAX_LENGTH + 1))).toBe(false);
	});

	it("rejects everything that is not a Western digit", () => {
		// The owner surface is bilingual; the PIN is not. An Arabic-Indic digit
		// reads as the same number and is a different string.
		expect(isStaffPinShape("١٢٣٤٥٦")).toBe(false);
		expect(isStaffPinShape("12345a")).toBe(false);
		expect(isStaffPinShape("123 456")).toBe(false);
		expect(isStaffPinShape("12345.6")).toBe(false);
		expect(isStaffPinShape("+123456")).toBe(false);
		expect(isStaffPinShape("")).toBe(false);
	});

	it("names the refusal instead of throwing an anonymous error", () => {
		expect(ruleCode(() => assertStaffPinShape("12345"))).toBe(
			"staff_pin_shape",
		);
		expect(ruleCode(() => assertStaffPinShape("12345678"))).toBeNull();
	});
});

describe("staff PIN generation", () => {
	it("produces a PIN that satisfies the shape it must be stored under", () => {
		for (let attempt = 0; attempt < 200; attempt += 1) {
			const pin = createStaffPin();
			expect(pin).toHaveLength(GENERATED_STAFF_PIN_LENGTH);
			expect(isStaffPinShape(pin)).toBe(true);
		}
	});

	it("rejects biased bytes rather than folding them into a digit", () => {
		// 250-255 are the six values that would make 0-5 likelier under `% 10`.
		// Feeding only those first proves they are redrawn, not used: if the
		// implementation folded them the first digits would be 0,1,2,3,4,5.
		const batches = [
			Uint8Array.from([250, 251, 252, 253, 254, 255]),
			Uint8Array.from([7, 7, 7, 7, 7, 7]),
		];
		let call = 0;
		const pin = createStaffPin(() => {
			const batch = batches[Math.min(call, batches.length - 1)];
			call += 1;
			return batch as Uint8Array;
		}, 6);
		expect(pin).toBe("777777");
	});

	it("maps each accepted byte to its digit", () => {
		const pin = createStaffPin(
			() => Uint8Array.from([0, 1, 9, 10, 19, 249]),
			6,
		);
		expect(pin).toBe("019099");
	});

	it("refuses a length outside the documented range", () => {
		expect(ruleCode(() => createStaffPin(undefined, 5))).toBe(
			"staff_pin_shape",
		);
		expect(ruleCode(() => createStaffPin(undefined, 13))).toBe(
			"staff_pin_shape",
		);
	});
});

describe("owner deactivation", () => {
	it("refuses self-deactivation before anything else about the target", () => {
		expect(
			ruleCode(() =>
				assertOwnerDeactivationAllowed({
					actorPrincipalId: owner.principalId,
					target: owner,
					activeOwnerCount: 5,
					reason: "leaving",
				}),
			),
		).toBe("owner_self_deactivation");
	});

	it("refuses the last active owner", () => {
		expect(
			ruleCode(() =>
				assertOwnerDeactivationAllowed({
					actorPrincipalId: owner.principalId,
					target: otherOwner,
					activeOwnerCount: 1,
					reason: "leaving",
				}),
			),
		).toBe("owner_last_active");
	});

	it("allows deactivation while another owner stays active", () => {
		expect(
			ruleCode(() =>
				assertOwnerDeactivationAllowed({
					actorPrincipalId: owner.principalId,
					target: otherOwner,
					activeOwnerCount: 2,
					reason: "left the company",
				}),
			),
		).toBeNull();
	});

	it("refuses an already inactive target rather than writing a no-op audit row", () => {
		expect(
			ruleCode(() =>
				assertOwnerDeactivationAllowed({
					actorPrincipalId: owner.principalId,
					target: { ...otherOwner, active: false },
					activeOwnerCount: 2,
					reason: "left the company",
				}),
			),
		).toBe("owner_already_inactive");
	});

	it("refuses a staff target", () => {
		expect(
			ruleCode(() =>
				assertOwnerDeactivationAllowed({
					actorPrincipalId: owner.principalId,
					target: { ...otherOwner, role: "staff" },
					activeOwnerCount: 2,
					reason: "left the company",
				}),
			),
		).toBe("not_an_owner");
	});

	it("requires a reason, and does not accept whitespace as one", () => {
		expect(
			ruleCode(() =>
				assertOwnerDeactivationAllowed({
					actorPrincipalId: owner.principalId,
					target: otherOwner,
					activeOwnerCount: 2,
					reason: null,
				}),
			),
		).toBe("reason_required");
		expect(
			ruleCode(() =>
				assertOwnerDeactivationAllowed({
					actorPrincipalId: owner.principalId,
					target: otherOwner,
					activeOwnerCount: 2,
					reason: "   ",
				}),
			),
		).toBe("reason_required");
	});
});

describe("owner reactivation", () => {
	it("allows an inactive owner and needs no reason", () => {
		expect(
			ruleCode(() =>
				assertOwnerReactivationAllowed({
					target: { ...otherOwner, active: false },
				}),
			),
		).toBeNull();
	});

	it("refuses an already active owner", () => {
		expect(
			ruleCode(() => assertOwnerReactivationAllowed({ target: otherOwner })),
		).toBe("owner_already_active");
	});

	it("refuses a staff target", () => {
		expect(
			ruleCode(() =>
				assertOwnerReactivationAllowed({
					target: { ...otherOwner, role: "staff", active: false },
				}),
			),
		).toBe("not_an_owner");
	});
});

describe("owner credential reset", () => {
	it("allows an active owner", () => {
		expect(
			ruleCode(() => assertOwnerCredentialResetAllowed({ target: otherOwner })),
		).toBeNull();
	});

	it("refuses a deactivated owner rather than silently re-enabling them", () => {
		// The credential row would come back active with no owner_reactivated row
		// to describe it. Reactivate first; that is the explicit separate action.
		expect(
			ruleCode(() =>
				assertOwnerCredentialResetAllowed({
					target: { ...otherOwner, active: false },
				}),
			),
		).toBe("owner_already_inactive");
	});

	it("refuses a staff target", () => {
		expect(
			ruleCode(() =>
				assertOwnerCredentialResetAllowed({
					target: { ...otherOwner, role: "staff" },
				}),
			),
		).toBe("not_an_owner");
	});

	it("allows an owner to reset their own credential", () => {
		// Self-deactivation is refused; self-reset is not. Nothing in the locked
		// decisions makes an owner unable to change their own password, and the
		// deactivation rule exists to stop an owner locking themselves out.
		expect(
			ruleCode(() => assertOwnerCredentialResetAllowed({ target: owner })),
		).toBeNull();
	});
});

describe("reason", () => {
	it("accepts a real reason and refuses an empty one", () => {
		expect(
			ruleCode(() => assertReasonPresent("recount after the door jam")),
		).toBeNull();
		expect(ruleCode(() => assertReasonPresent(null))).toBe("reason_required");
		expect(ruleCode(() => assertReasonPresent(""))).toBe("reason_required");
		expect(ruleCode(() => assertReasonPresent("\t\n "))).toBe(
			"reason_required",
		);
	});
});
