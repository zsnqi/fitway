import type { CanonicalAuthContext } from "@fitway/auth";
import { call, ORPCError } from "@orpc/server";
import { describe, expect, it, vi } from "vitest";

import { appRouter } from "../routers/index";

const base = {
	principalId: "00000000-0000-4000-8000-000000000001",
	sessionId: "00000000-0000-4000-8000-000000000002",
	expiresAt: new Date("2026-08-22T00:00:00.000Z"),
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
const result = {
	command: {
		id: 1,
		type: "set_count" as const,
		targetValue: 5,
		status: "pending" as const,
		reason: null,
		issuedAt: "2026-07-22T00:00:00.000Z",
	},
	auditId: 2,
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

describe("staff command router leaves", () => {
	it("re-checks staff-or-owner authorization and passes canonical provenance", async () => {
		const issueCorrection = vi.fn(async () => result);
		const commandService = {
			issueCorrection,
			issueReset: vi.fn(async () => ({
				...result,
				command: {
					...result.command,
					type: "reset_zero" as const,
					targetValue: null,
				},
			})),
		};

		expect(
			await call(
				appRouter.staff.issueCorrection,
				{ absolute: 5 },
				{
					context: { auth: staff, commandService },
				},
			),
		).toEqual(result);
		expect(issueCorrection).toHaveBeenCalledWith(staff, { absolute: 5 });
		expect(
			await call(
				appRouter.staff.issueCorrection,
				{ delta: -1 },
				{
					context: { auth: owner, commandService },
				},
			),
		).toEqual(result);
		expect(
			await rejectedCode(
				call(
					appRouter.staff.issueCorrection,
					{ delta: 1 },
					{
						context: { auth: null, commandService },
					},
				),
			),
		).toBe("UNAUTHORIZED");
	});

	it("keeps validation and reset authorization on the procedure leaf", async () => {
		const commandService = {
			issueCorrection: vi.fn(async () => result),
			issueReset: vi.fn(async () => ({
				...result,
				command: {
					...result.command,
					type: "reset_zero" as const,
					targetValue: null,
				},
			})),
		};
		await expect(
			call(
				appRouter.staff.issueCorrection,
				{ absolute: -1 },
				{
					context: { auth: staff, commandService },
				},
			),
		).rejects.toBeDefined();
		expect(commandService.issueCorrection).not.toHaveBeenCalled();
		expect(
			await call(
				appRouter.staff.issueReset,
				{},
				{
					context: { auth: staff, commandService },
				},
			),
		).toMatchObject({ command: { type: "reset_zero", targetValue: null } });
	});
});
