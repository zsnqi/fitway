import type { CanonicalAuthContext } from "@fitway/auth";
import { describe, expect, it } from "vitest";

import {
	type CommandIssuanceTransaction,
	type CommandIssueError,
	createCommandService,
} from "./service";

const actor: CanonicalAuthContext = {
	principalId: "00000000-0000-4000-8000-000000000001",
	principalKind: "shared_staff",
	role: "staff",
	sessionId: "00000000-0000-4000-8000-000000000002",
	expiresAt: new Date("2026-08-22T00:00:00.000Z"),
	active: true,
};

function createCommandServiceFixture(currentCount: number | null = 3) {
	const writes: Array<{ kind: string; value: unknown }> = [];
	let nextCommandId = 11;
	const tx: CommandIssuanceTransaction = {
		lockCommandState: async () => ({
			currentCount,
			deviceId: "00000000-0000-4000-8000-000000000010",
		}),
		insertCommand: async (value) => {
			writes.push({ kind: "command", value });
			return {
				id: nextCommandId++,
				type: value.type,
				targetValue: value.targetValue,
				status: "pending",
				reason: value.reason,
				issuedAt: value.issuedAt.toISOString(),
			};
		},
		supersedePendingCommands: async (deviceId, newerCommandId, at) => {
			writes.push({
				kind: "supersede",
				value: { deviceId, newerCommandId, at },
			});
		},
		appendAudit: async (value) => {
			writes.push({ kind: "audit", value });
			return 21;
		},
	};
	return {
		writes,
		service: createCommandService({
			transaction: async (work) => work(tx),
			now: () => new Date("2026-07-22T00:00:00.000Z"),
		}),
	};
}

describe("command issuance service", () => {
	it("resolves a delta under the state lock, floors at zero, and audits provenance", async () => {
		const value = createCommandServiceFixture(3);
		const result = await value.service.issueCorrection(actor, {
			delta: -8,
			reason: "  obvious drift  ",
		});

		expect(result).toMatchObject({
			auditId: 21,
			command: {
				id: 11,
				type: "set_count",
				targetValue: 0,
				status: "pending",
				reason: "obvious drift",
			},
		});
		expect(value.writes.map((write) => write.kind)).toEqual([
			"command",
			"supersede",
			"audit",
		]);
		expect(value.writes[2]?.value).toMatchObject({
			actorPrincipalId: actor.principalId,
			actorPrincipalKind: "shared_staff",
			actorRole: "staff",
			commandId: 11,
			action: "correction_delta",
			priorValue: 3,
			requestedDelta: -8,
			requestedValue: null,
			effectiveValue: 0,
			reason: "obvious drift",
			createdAt: new Date("2026-07-22T00:00:00.000Z"),
		});
	});

	it("allows an absolute correction without a current count but rejects a delta", async () => {
		const absolute = createCommandServiceFixture(null);
		expect(
			await absolute.service.issueCorrection(actor, { absolute: 17 }),
		).toMatchObject({ command: { targetValue: 17, reason: null } });
		expect(absolute.writes[2]?.value).toMatchObject({
			action: "correction_absolute",
			priorValue: null,
			requestedDelta: null,
			requestedValue: 17,
			effectiveValue: 17,
		});

		const delta = createCommandServiceFixture(null);
		await expect(
			delta.service.issueCorrection(actor, { delta: 1 }),
		).rejects.toEqual(
			expect.objectContaining<Partial<CommandIssueError>>({
				code: "current_count_unavailable",
			}),
		);
		expect(delta.writes).toEqual([]);
	});

	it("issues reset_zero with no target and an attributable reset audit", async () => {
		const value = createCommandServiceFixture(9);
		const result = await value.service.issueReset(actor, {});
		expect(result.command).toMatchObject({
			type: "reset_zero",
			targetValue: null,
			reason: null,
		});
		expect(value.writes[2]?.value).toMatchObject({
			action: "reset",
			priorValue: 9,
			requestedDelta: null,
			requestedValue: 0,
			effectiveValue: 0,
		});
	});
});
