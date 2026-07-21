import { describe, expect, it } from "vitest";

import { edgePushRequestSchema, edgePushResponseSchema } from "./edge-push";

const request = {
	schemaVersion: 1,
	sequence: 4,
	observedAt: "2026-07-22T00:00:00.000Z",
	currentCount: 12,
	minutes: [
		{
			minuteStart: "2026-07-22T00:00:00.000Z",
			count: 12,
			entries: 1,
			exits: 0,
		},
	],
	health: { process: "ok", camera: "ok", feed: "ok", detectorFps: 4.8 },
	appliedCommandId: 9,
} as const;

describe("Phase 5 edge push schemas", () => {
	it("accepts a positive safe applied-command acknowledgement", () => {
		expect(edgePushRequestSchema.parse(request).appliedCommandId).toBe(9);
		for (const appliedCommandId of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
			expect(
				edgePushRequestSchema.safeParse({ ...request, appliedCommandId })
					.success,
			).toBe(false);
		}
		expect(
			edgePushRequestSchema.safeParse({ ...request, backfillOnly: true })
				.success,
		).toBe(false);
	});

	it("returns the strict latest-only device command with a coherent target", () => {
		const response = edgePushResponseSchema.parse({
			schemaVersion: 1,
			accepted: true,
			reason: "processed",
			highestProcessedSequence: 4,
			commands: [
				{
					id: 10,
					type: "set_count",
					targetValue: 4,
					issuedAt: "2026-07-22T00:00:01.000Z",
				},
			],
			settings: { version: 1, pushIntervalSeconds: 20 },
			serverTime: "2026-07-22T00:00:03.000Z",
		});
		expect(response.commands.map((command) => command.id)).toEqual([10]);

		const multiple = {
			...response,
			commands: [
				...response.commands,
				{
					id: 12,
					type: "reset_zero" as const,
					targetValue: null,
					issuedAt: "2026-07-22T00:00:02.000Z",
				},
			],
		};
		expect(edgePushResponseSchema.safeParse(multiple).success).toBe(false);
		expect(
			edgePushResponseSchema.safeParse({
				...response,
				commands: [
					{
						id: 12,
						type: "reset_zero",
						targetValue: 0,
						issuedAt: "2026-07-22T00:00:02.000Z",
					},
				],
			}).success,
		).toBe(false);
	});
});
