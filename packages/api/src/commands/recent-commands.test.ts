import type { CanonicalAuthContext } from "@fitway/auth";
import { call } from "@orpc/server";
import { describe, expect, it } from "vitest";

import { appRouter } from "../routers/index";
import { recentCommandSchema, recentCommandsSchema } from "./recent-commands";

const pending = {
	id: 42,
	type: "set_count" as const,
	targetValue: 17,
	status: "pending" as const,
	reason: "Door recount",
	issuedAt: "2026-07-27T12:00:00.000Z",
	deliveredAt: "2026-07-27T12:00:20.000Z",
	appliedAt: null,
	supersededAt: null,
	supersededByCommandId: null,
};

describe("recent command lifecycle contract", () => {
	it("keeps delivery as metadata while status remains pending", () => {
		expect(recentCommandSchema.parse(pending)).toMatchObject({
			status: "pending",
			deliveredAt: "2026-07-27T12:00:20.000Z",
		});
	});

	it("accepts only coherent pending, applied, and superseded command rows", () => {
		expect(
			recentCommandsSchema.parse([
				pending,
				{
					...pending,
					id: 43,
					status: "applied",
					appliedAt: "2026-07-27T12:00:30.000Z",
				},
				{
					...pending,
					id: 44,
					status: "superseded",
					deliveredAt: null,
					supersededAt: "2026-07-27T12:00:40.000Z",
					supersededByCommandId: 45,
				},
			]),
		).toHaveLength(3);
		expect(() =>
			recentCommandSchema.parse({ ...pending, status: "delivered" }),
		).toThrow();
		expect(() =>
			recentCommandSchema.parse({
				...pending,
				status: "applied",
				appliedAt: null,
			}),
		).toThrow();
		expect(() => recentCommandsSchema.parse(Array(5).fill(pending))).toThrow();
	});

	it("is private to staff or owner sessions and reads only server rows", async () => {
		const base = {
			principalId: "00000000-0000-4000-8000-000000000001",
			sessionId: "00000000-0000-4000-8000-000000000002",
			expiresAt: new Date("2026-08-22T00:00:00.000Z"),
			active: true,
		} as const;
		const rows = [pending];
		const readRecentCommands = async () => rows;

		for (const auth of [
			{ ...base, principalKind: "shared_staff", role: "staff" },
			{ ...base, principalKind: "owner", role: "owner" },
		] as const satisfies readonly CanonicalAuthContext[]) {
			expect(
				await call(appRouter.staff.recentCommands, undefined, {
					context: { auth, readRecentCommands },
				}),
			).toEqual(rows);
		}

		await expect(
			call(appRouter.staff.recentCommands, undefined, {
				context: { auth: null, readRecentCommands },
			}),
		).rejects.toMatchObject({ code: "UNAUTHORIZED" });
		await expect(
			call(appRouter.staff.recentCommands, undefined, {
				context: { auth: null },
			}),
		).rejects.toMatchObject({ code: "UNAUTHORIZED" });
	});
});
