import { readFileSync } from "node:fs";
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

const frozenSettings = {
	version: 1,
	pushIntervalSeconds: 20,
	timezone: "Asia/Riyadh",
	businessDayBoundary: "04:00:00",
	weeklySchedule: {
		sun: { open: "06:00:00", close: "23:00:00" },
		mon: { open: "06:00:00", close: "23:00:00" },
		tue: { open: "06:00:00", close: "23:00:00" },
		wed: { open: "06:00:00", close: "23:00:00" },
		thu: { open: "06:00:00", close: "23:00:00" },
		fri: { open: "14:00:00", close: "23:00:00" },
		sat: null,
	},
} as const;

describe("Phase 5 edge push schemas", () => {
	it("parses the same frozen fixtures consumed by Python", () => {
		const fixture = (name: string) =>
			JSON.parse(
				readFileSync(
					new URL(`../../../edge/fixtures/${name}`, import.meta.url),
					"utf8",
				),
			);
		expect(edgePushRequestSchema.parse(fixture("push.json"))).toMatchObject({
			schemaVersion: 2,
			mode: "live",
		});
		expect(edgePushRequestSchema.parse(fixture("backfill.json"))).toMatchObject(
			{ schemaVersion: 2, mode: "backfill" },
		);
		expect(
			edgePushResponseSchema.parse(fixture("acknowledgement.json")),
		).toMatchObject({ schemaVersion: 2, accepted: true });
		expect(
			edgePushResponseSchema.parse(fixture("commands-pending.json")),
		).toMatchObject({
			schemaVersion: 2,
			accepted: false,
			reason: "commands_pending",
		});
	});

	it("separates the frozen live and history-only backfill envelopes", () => {
		const live = edgePushRequestSchema.parse({
			...request,
			schemaVersion: 2,
			mode: "live",
		});
		expect(live).toMatchObject({ schemaVersion: 2, mode: "live" });

		const backfill = edgePushRequestSchema.parse({
			schemaVersion: 2,
			mode: "backfill",
			sequence: 5,
			minutes: request.minutes,
			appliedCommandId: 9,
		});
		expect(backfill).toMatchObject({
			schemaVersion: 2,
			mode: "backfill",
			sequence: 5,
		});
		expect(backfill).not.toHaveProperty("currentCount");
		expect(backfill).not.toHaveProperty("health");
		expect(
			edgePushRequestSchema.safeParse({
				...backfill,
				currentCount: 99,
			}).success,
		).toBe(false);
	});

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

	it("freezes the v2 response settings subset without changing legacy v1", () => {
		const base = {
			accepted: true,
			reason: "processed",
			highestProcessedSequence: 4,
			commands: [],
			serverTime: "2026-07-22T00:00:03.000Z",
		} as const;
		expect(
			edgePushResponseSchema.parse({
				...base,
				schemaVersion: 2,
				settings: frozenSettings,
			}),
		).toMatchObject({ settings: frozenSettings });
		expect(
			edgePushResponseSchema.safeParse({
				...base,
				schemaVersion: 2,
				settings: { ...frozenSettings, resetBufferMinutes: 30 },
			}).success,
		).toBe(false);
		expect(
			edgePushResponseSchema.parse({
				...base,
				schemaVersion: 1,
				settings: { version: 1, pushIntervalSeconds: 20 },
			}),
		).toMatchObject({
			schemaVersion: 1,
			settings: { version: 1, pushIntervalSeconds: 20 },
		});
	});
});
