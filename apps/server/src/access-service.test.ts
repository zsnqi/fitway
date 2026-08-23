import { describe, expect, it, vi } from "vitest";

import type { AccessRepository } from "./access-repository";
import { createAccessService } from "./access-service";

/**
 * The generator the service uses, swapped so a defect in it can be observed.
 *
 * `createStaffPin` is the only source of PIN material in the product, and no
 * procedure accepts one, so the failure this file is about is unreachable
 * through the transport. It is reachable here, which is the whole reason this
 * file exists.
 */
const generator = vi.hoisted(() => ({ next: "" }));

vi.mock("@fitway/auth", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@fitway/auth")>();
	return { ...actual, createStaffPin: () => generator.next };
});

function serviceWithRepository(repository: Partial<AccessRepository>) {
	return createAccessService({
		repository: repository as AccessRepository,
		pinPepper: "pin-pepper-for-this-test",
		ownerPasswordPepper: "owner-pepper-for-this-test",
		now: () => new Date("2026-08-23T10:00:00.000Z"),
	});
}

describe("the staff PIN generator seam", () => {
	it("refuses a malformed generated PIN as a server fault, not a caller error", async () => {
		generator.next = "not-a-pin";
		let stored = false;
		const service = serviceWithRepository({
			provisionStaffPin: async () => {
				stored = true;
				throw new Error("the repository must not be reached");
			},
		});

		const error = await service
			.provisionStaffPin({ actorPrincipalId: "actor" })
			.then(
				() => null,
				(thrown: unknown) => thrown,
			);

		expect(error, "the seam must refuse").toBeInstanceOf(Error);
		// The transport maps AccessRuleError, and only AccessRuleError, to
		// BAD_REQUEST. Anything else is rethrown raw and becomes a 500. This
		// assertion is the whole contract: an owner is never told they mistyped a
		// value the server generated.
		expect(
			(error as Error).name,
			"an AccessRuleError here would surface to the owner as a 400",
		).not.toBe("AccessRuleError");
		expect(stored, "nothing may be stored after a failed generation").toBe(
			false,
		);
	});

	it("keeps the rejected PIN out of the error it raises", async () => {
		generator.next = "not-a-pin";
		const service = serviceWithRepository({
			provisionStaffPin: async () => {
				throw new Error("the repository must not be reached");
			},
		});

		const error = (await service
			.provisionStaffPin({ actorPrincipalId: "actor" })
			.then(
				() => null,
				(thrown: unknown) => thrown,
			)) as Error;

		// A malformed PIN is still credential material, and a server fault is the
		// path most likely to reach a log.
		const rendered = `${error.message} ${String((error as { cause?: unknown }).cause ?? "")}`;
		expect(rendered).not.toContain(generator.next);
	});

	it("reveals a well-formed generated PIN, so the refusal above is not vacuous", async () => {
		generator.next = "123456";
		const service = serviceWithRepository({
			provisionStaffPin: async () => ({
				auditId: 1,
				principal: {
					principalId: "shared-staff",
				} as never,
				revokedSessions: 0,
			}),
		});

		const result = await service.provisionStaffPin({
			actorPrincipalId: "actor",
		});

		expect(result.revealedPin).toBe("123456");
	});
});
