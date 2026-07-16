import type { CanonicalAuthContext } from "@fitway/auth";
import { ORPCError } from "@orpc/server";
import { describe, expect, it } from "vitest";

import { requireOwner, requireStaffOrOwner } from "./authorization";

const base = {
	principalId: "00000000-0000-4000-8000-000000000001",
	sessionId: "00000000-0000-4000-8000-000000000002",
	expiresAt: new Date("2026-08-15T00:00:00.000Z"),
	active: true,
} as const;

const staff: CanonicalAuthContext = {
	...base,
	principalKind: "shared_staff",
	role: "staff",
};
const owner: CanonicalAuthContext = {
	...base,
	principalKind: "owner",
	role: "owner",
};

function errorCode(operation: () => unknown) {
	try {
		operation();
	} catch (error) {
		if (error instanceof ORPCError) return error.code;
		throw error;
	}
	return null;
}

describe("server-side role guards", () => {
	it("allows staff and owner through staff-or-owner authorization", () => {
		expect(requireStaffOrOwner(staff)).toBe(staff);
		expect(requireStaffOrOwner(owner)).toBe(owner);
	});

	it("returns UNAUTHORIZED for a missing or inactive canonical context", () => {
		expect(errorCode(() => requireStaffOrOwner(null))).toBe("UNAUTHORIZED");
		expect(errorCode(() => requireOwner({ ...owner, active: false }))).toBe(
			"UNAUTHORIZED",
		);
	});

	it("returns FORBIDDEN only for an authenticated wrong role", () => {
		expect(errorCode(() => requireOwner(staff))).toBe("FORBIDDEN");
		expect(requireOwner(owner)).toBe(owner);
	});
});
