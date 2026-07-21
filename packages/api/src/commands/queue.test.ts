import { describe, expect, it } from "vitest";
import { type CommandQueueRepository, createCommandQueue } from "./queue";
import type { DeviceCommand } from "./schemas";

const older: DeviceCommand = {
	id: 7,
	type: "set_count",
	targetValue: 4,
	issuedAt: "2026-07-22T00:00:00.000Z",
};
const newer: DeviceCommand = {
	id: 9,
	type: "reset_zero",
	targetValue: null,
	issuedAt: "2026-07-22T00:01:00.000Z",
};

function createQueueFixture(options?: {
	candidate?: {
		status: "pending" | "applied" | "superseded";
		deliveredAt: Date | null;
	} | null;
	pending?: DeviceCommand[];
}) {
	const writes: Array<{ kind: string; value: unknown }> = [];
	const repository: CommandQueueRepository = {
		findAcknowledgementCandidate: async () => options?.candidate ?? null,
		markAppliedThrough: async (deviceId, commandId, appliedAt) => {
			writes.push({
				kind: "applied",
				value: { deviceId, commandId, appliedAt },
			});
		},
		listPendingCommands: async () => options?.pending ?? [],
		markPendingDelivered: async (deviceId, deliveredAt) => {
			writes.push({ kind: "delivered", value: { deviceId, deliveredAt } });
		},
	};
	return { queue: createCommandQueue(repository), writes };
}

describe("command queue reconciliation", () => {
	it("does not apply an undelivered, superseded, or future acknowledgement", async () => {
		for (const candidate of [
			null,
			{ status: "pending" as const, deliveredAt: null },
			{
				status: "superseded" as const,
				deliveredAt: new Date("2026-07-22T00:00:00.000Z"),
			},
		]) {
			const value = createQueueFixture({ candidate });
			await value.queue.reconcile({
				deviceId: "device",
				appliedCommandId: 7,
				at: new Date("2026-07-22T00:02:00.000Z"),
			});
			expect(value.writes).toEqual([]);
		}
	});

	it("applies an eligible highest acknowledgement and delivers pending oldest-first", async () => {
		const at = new Date("2026-07-22T00:02:00.000Z");
		const value = createQueueFixture({
			candidate: {
				status: "pending",
				deliveredAt: new Date("2026-07-22T00:01:30.000Z"),
			},
			pending: [newer, older],
		});
		expect(
			await value.queue.reconcile({
				deviceId: "device",
				appliedCommandId: 7,
				at,
			}),
		).toEqual([older, newer]);
		expect(value.writes).toEqual([
			{
				kind: "applied",
				value: { deviceId: "device", commandId: 7, appliedAt: at },
			},
			{
				kind: "delivered",
				value: { deviceId: "device", deliveredAt: at },
			},
		]);
	});
});
