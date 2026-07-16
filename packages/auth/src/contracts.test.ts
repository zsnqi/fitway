import { describe, expect, it } from "vitest";

import {
	type CanonicalAuthContext,
	PIN_PATTERN,
	PRINCIPAL_KINDS,
	ROLES,
} from "./contracts";

describe("authentication contracts", () => {
	it("freezes the application roles and principal kinds", () => {
		expect(ROLES).toEqual(["staff", "owner"]);
		expect(PRINCIPAL_KINDS).toEqual(["shared_staff", "owner"]);
	});

	it("accepts only a 6-12 Western-digit staff PIN", () => {
		for (const valid of ["012345", "123456789012"]) {
			expect(PIN_PATTERN.test(valid)).toBe(true);
		}
		for (const invalid of [
			"12345",
			"1234567890123",
			"123 456",
			"１２３４５６",
			"١٢٣٤٥٦",
		]) {
			expect(PIN_PATTERN.test(invalid)).toBe(false);
		}
	});

	it("defines one canonical request context", () => {
		const context: CanonicalAuthContext = {
			principalId: "00000000-0000-4000-8000-000000000001",
			principalKind: "shared_staff",
			role: "staff",
			sessionId: "00000000-0000-4000-8000-000000000002",
			expiresAt: new Date("2026-08-15T00:00:00.000Z"),
			active: true,
		};
		expect(Object.keys(context).sort()).toEqual(
			[
				"active",
				"expiresAt",
				"principalId",
				"principalKind",
				"role",
				"sessionId",
			].sort(),
		);
	});
});
