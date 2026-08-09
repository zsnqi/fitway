import {
	deviceCommandSchema,
	issuedCommandSchema,
} from "@fitway/api/commands/schemas";
import { evaluateScheduledReset } from "@fitway/api/reset/evaluator";
import type { ResetScheduleSettingsVersion } from "@fitway/api/reset/types";
import { describe, expect, it } from "vitest";

const overnightEveryDay = {
	sun: { open: "14:00", close: "02:00" },
	mon: { open: "14:00", close: "02:00" },
	tue: { open: "14:00", close: "02:00" },
	wed: { open: "14:00", close: "02:00" },
	thu: { open: "14:00", close: "02:00" },
	fri: { open: "14:00", close: "02:00" },
	sat: { open: "14:00", close: "02:00" },
} as const;

const settings: ResetScheduleSettingsVersion = {
	version: 3,
	effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
	timeZone: "Asia/Riyadh",
	businessDayBoundary: "04:00",
	resetBufferMinutes: 30,
	weeklySchedule: overnightEveryDay,
};

describe("Phase 7 reset evaluator command composition", () => {
	it("emits one Phase 5 reset command per business day and never reopens a claimed day", () => {
		const first = evaluateScheduledReset({
			businessDay: "2026-07-17",
			now: new Date("2026-07-17T23:30:00.000Z"),
			settingsVersions: [settings],
			priorIssuances: [],
		});
		expect(first.decision).toBe("issue");
		if (first.decision !== "issue") throw new Error("Reset was not due");

		expect(
			deviceCommandSchema.parse({
				id: 41,
				type: first.command.type,
				targetValue: first.command.targetValue,
				issuedAt: first.issuedAt.toISOString(),
			}),
		).toMatchObject({ type: "reset_zero", targetValue: null });
		expect(
			issuedCommandSchema.parse({
				id: 41,
				type: first.command.type,
				targetValue: first.command.targetValue,
				status: "pending",
				reason: first.command.reason,
				issuedAt: first.issuedAt.toISOString(),
			}),
		).toMatchObject({
			type: "reset_zero",
			targetValue: null,
			status: "pending",
		});
		expect(first.command.supersedePending).toBe(true);

		const priorIssuances = [
			{
				businessDay: first.businessDay,
				commandId: 41,
				status: "superseded" as const,
			},
		];
		expect(
			evaluateScheduledReset({
				businessDay: "2026-07-17",
				now: new Date("2026-07-18T06:00:00.000Z"),
				settingsVersions: [settings],
				priorIssuances,
			}),
		).toMatchObject({ decision: "skip", reason: "already_issued" });

		expect(
			evaluateScheduledReset({
				businessDay: "2026-07-18",
				now: new Date("2026-07-18T23:30:00.000Z"),
				settingsVersions: [settings],
				priorIssuances,
			}),
		).toMatchObject({
			decision: "issue",
			issuanceKey: "scheduled-reset:2026-07-18",
			businessDay: "2026-07-18",
		});
	});
});
