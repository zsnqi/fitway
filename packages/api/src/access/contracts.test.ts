import { describe, expect, it } from "vitest";

import { AUDIT_REASON_MAX_LENGTH } from "../audit/list";
import {
	ownerDeactivateInputSchema,
	staffPinDeactivateInputSchema,
} from "./contracts";

const targetPrincipalId = "00000000-0000-4000-8000-0000000000a1";

/**
 * The reason is written to the audit log in the same transaction as the
 * deactivation, and the log stores at most AUDIT_REASON_MAX_LENGTH characters.
 * A reason the contract accepts but the log refuses fails the whole write, so
 * the contract must refuse it first.
 */
describe.each([
	{
		name: "staff PIN deactivation",
		parse: (reason: string) =>
			staffPinDeactivateInputSchema.safeParse({ reason }),
	},
	{
		name: "owner deactivation",
		parse: (reason: string) =>
			ownerDeactivateInputSchema.safeParse({ targetPrincipalId, reason }),
	},
])("the $name reason", ({ parse }) => {
	it("is capped at what the audit log stores", () => {
		expect(AUDIT_REASON_MAX_LENGTH).toBe(240);
		expect(parse("r".repeat(240)).success).toBe(true);
		expect(parse("r".repeat(241)).success).toBe(false);
	});

	it("counts the reason after trimming, as the log stores it", () => {
		const padded = `  ${"r".repeat(240)}  `;
		const parsed = parse(padded);
		expect(parsed.success).toBe(true);
		expect(parsed.data?.reason).toHaveLength(240);
	});

	it("still refuses whitespace as a reason", () => {
		expect(parse("   ").success).toBe(false);
	});
});
