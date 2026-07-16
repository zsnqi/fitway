import type { CanonicalAuthContext } from "@fitway/auth";
import { call, ORPCError } from "@orpc/server";
import { describe, expect, it } from "vitest";

import { appRouter } from "../routers/index";

const common = {
	principalId: "00000000-0000-4000-8000-000000000001",
	sessionId: "00000000-0000-4000-8000-000000000002",
	expiresAt: new Date("2026-08-15T00:00:00.000Z"),
	active: true,
} as const;
const staff: CanonicalAuthContext = {
	...common,
	principalKind: "shared_staff",
	role: "staff",
};
const owner: CanonicalAuthContext = {
	...common,
	principalKind: "owner",
	role: "owner",
};

async function rejectedCode(operation: Promise<unknown>) {
	try {
		await operation;
	} catch (error) {
		if (error instanceof ORPCError) return error.code;
		throw error;
	}
	return null;
}

describe("auth router leaves", () => {
	it("enforces staff-or-owner on the staff leaf", async () => {
		expect(
			await call(appRouter.staff.session, undefined, {
				context: { auth: staff },
			}),
		).toBe(staff);
		expect(
			await call(appRouter.staff.session, undefined, {
				context: { auth: owner },
			}),
		).toBe(owner);
		expect(
			await rejectedCode(
				call(appRouter.staff.session, undefined, { context: { auth: null } }),
			),
		).toBe("UNAUTHORIZED");
	});

	it("enforces owner-only on the admin leaf", async () => {
		expect(
			await call(appRouter.admin.session, undefined, {
				context: { auth: owner },
			}),
		).toBe(owner);
		expect(
			await rejectedCode(
				call(appRouter.admin.session, undefined, { context: { auth: staff } }),
			),
		).toBe("FORBIDDEN");
	});
});
