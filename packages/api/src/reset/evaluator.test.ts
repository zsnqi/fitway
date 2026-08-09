import { describe, expect, it } from "vitest";

import { evaluateScheduledReset } from "./evaluator";
import type { ResetScheduleSettingsVersion } from "./types";

const closedWeek = {
	sun: null,
	mon: null,
	tue: null,
	wed: null,
	thu: null,
	fri: null,
	sat: null,
} as const;

function settings(
	overrides: Partial<ResetScheduleSettingsVersion> = {},
): ResetScheduleSettingsVersion {
	return {
		version: 1,
		effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
		timeZone: "Asia/Riyadh",
		businessDayBoundary: "04:00",
		resetBufferMinutes: 30,
		weeklySchedule: {
			...closedWeek,
			thu: { open: "06:00", close: "23:00" },
		},
		...overrides,
	};
}

describe("evaluateScheduledReset", () => {
	it("issues a stable system reset intent exactly at close plus buffer", () => {
		const now = new Date("2026-07-16T20:30:00.000Z");

		expect(
			evaluateScheduledReset({
				businessDay: "2026-07-16",
				now,
				settingsVersions: [settings()],
				priorIssuances: [],
			}),
		).toEqual({
			decision: "issue",
			issuanceKey: "scheduled-reset:2026-07-16",
			businessDay: "2026-07-16",
			settingsVersion: 1,
			scheduledCloseAt: new Date("2026-07-16T20:00:00.000Z"),
			dueAt: now,
			issuedAt: now,
			issuer: "system",
			command: {
				type: "reset_zero",
				targetValue: null,
				reason: "scheduled reset for business day 2026-07-16",
				supersedePending: true,
			},
		});
	});

	it("finds a past-midnight Friday close assigned to the next business day", () => {
		const now = new Date("2026-07-17T23:30:00.000Z");

		expect(
			evaluateScheduledReset({
				businessDay: "2026-07-18",
				now,
				settingsVersions: [
					settings({
						businessDayBoundary: "00:00",
						weeklySchedule: {
							...closedWeek,
							fri: { open: "14:00", close: "02:00" },
						},
					}),
				],
				priorIssuances: [],
			}),
		).toMatchObject({
			decision: "issue",
			businessDay: "2026-07-18",
			settingsVersion: 1,
			scheduledCloseAt: new Date("2026-07-17T23:00:00.000Z"),
			dueAt: now,
		});
	});

	it("uses the final scheduled close when adjacent sessions share a business day", () => {
		const now = new Date("2026-07-18T20:30:00.000Z");

		expect(
			evaluateScheduledReset({
				businessDay: "2026-07-18",
				now,
				settingsVersions: [
					settings({
						weeklySchedule: {
							...closedWeek,
							fri: { open: "14:00", close: "05:00" },
							sat: { open: "06:00", close: "23:00" },
						},
					}),
				],
				priorIssuances: [],
			}),
		).toMatchObject({
			decision: "issue",
			businessDay: "2026-07-18",
			scheduledCloseAt: new Date("2026-07-18T20:00:00.000Z"),
			dueAt: now,
		});
	});

	it("keeps a past-midnight close on the historical settings effective before close", () => {
		const historical = settings({
			version: 4,
			weeklySchedule: {
				...closedWeek,
				fri: { open: "14:00", close: "02:00" },
			},
		});
		const later = settings({
			version: 8,
			effectiveFrom: new Date("2026-07-17T23:15:00.000Z"),
			timeZone: "UTC",
			businessDayBoundary: "00:00",
			resetBufferMinutes: 5,
			weeklySchedule: {
				...closedWeek,
				fri: { open: "10:00", close: "18:00" },
			},
		});
		const now = new Date("2026-07-17T23:30:00.000Z");

		expect(
			evaluateScheduledReset({
				businessDay: "2026-07-17",
				now,
				settingsVersions: [later, historical],
				priorIssuances: [],
			}),
		).toMatchObject({
			decision: "issue",
			businessDay: "2026-07-17",
			settingsVersion: 4,
			scheduledCloseAt: new Date("2026-07-17T23:00:00.000Z"),
			dueAt: now,
		});
	});

	it("uses the canonical earlier instant for a repeated DST close time", () => {
		const now = new Date("2026-11-01T06:00:00.000Z");

		expect(
			evaluateScheduledReset({
				businessDay: "2026-10-31",
				now,
				settingsVersions: [
					settings({
						timeZone: "America/New_York",
						weeklySchedule: {
							...closedWeek,
							sat: { open: "20:00", close: "01:30" },
						},
					}),
				],
				priorIssuances: [],
			}),
		).toMatchObject({
			decision: "issue",
			businessDay: "2026-10-31",
			scheduledCloseAt: new Date("2026-11-01T05:30:00.000Z"),
			dueAt: now,
		});
	});

	it("ignores a superseded settings version with a nonexistent future close", () => {
		const obsolete = settings({
			version: 1,
			effectiveFrom: new Date("2020-01-01T00:00:00.000Z"),
			timeZone: "America/New_York",
			businessDayBoundary: "00:00",
			weeklySchedule: {
				...closedWeek,
				sun: { open: "00:00", close: "02:30" },
			},
		});
		const current = settings({
			version: 2,
			effectiveFrom: new Date("2021-01-01T00:00:00.000Z"),
			timeZone: "America/New_York",
			businessDayBoundary: "00:00",
			weeklySchedule: {
				...closedWeek,
				sun: { open: "00:00", close: "03:30" },
			},
		});

		expect(
			evaluateScheduledReset({
				businessDay: "2026-03-08",
				now: new Date("2026-03-08T08:00:00.000Z"),
				settingsVersions: [obsolete, current],
				priorIssuances: [],
			}),
		).toMatchObject({
			decision: "issue",
			settingsVersion: 2,
			scheduledCloseAt: new Date("2026-03-08T07:30:00.000Z"),
			dueAt: new Date("2026-03-08T08:00:00.000Z"),
		});
	});

	it("rejects a nonexistent close for the active settings version", () => {
		expect(() =>
			evaluateScheduledReset({
				businessDay: "2026-03-08",
				now: new Date("2026-03-08T08:00:00.000Z"),
				settingsVersions: [
					settings({
						effectiveFrom: new Date("2020-01-01T00:00:00.000Z"),
						timeZone: "America/New_York",
						businessDayBoundary: "00:00",
						weeklySchedule: {
							...closedWeek,
							sun: { open: "00:00", close: "02:30" },
						},
					}),
				],
				priorIssuances: [],
			}),
		).toThrow("Schedule wall time does not exist in the configured zone");
	});

	it.each([
		"pending",
		"applied",
		"superseded",
	] as const)("does not reissue a business-day reset whose Phase 5 command is %s", (status) => {
		const dueAt = new Date("2026-07-16T20:30:00.000Z");

		expect(
			evaluateScheduledReset({
				businessDay: "2026-07-16",
				now: new Date("2026-07-16T20:31:00.000Z"),
				settingsVersions: [settings()],
				priorIssuances: [{ businessDay: "2026-07-16", commandId: 11, status }],
			}),
		).toEqual({
			decision: "skip",
			businessDay: "2026-07-16",
			reason: "already_issued",
			dueAt,
		});
	});

	it("waits until the buffer boundary and reports days with no scheduled close", () => {
		expect(
			evaluateScheduledReset({
				businessDay: "2026-07-16",
				now: new Date("2026-07-16T20:29:59.999Z"),
				settingsVersions: [settings()],
				priorIssuances: [],
			}),
		).toEqual({
			decision: "skip",
			businessDay: "2026-07-16",
			reason: "not_due",
			dueAt: new Date("2026-07-16T20:30:00.000Z"),
		});
		expect(
			evaluateScheduledReset({
				businessDay: "2026-07-15",
				now: new Date("2026-07-16T20:30:00.000Z"),
				settingsVersions: [settings()],
				priorIssuances: [],
			}),
		).toEqual({
			decision: "skip",
			businessDay: "2026-07-15",
			reason: "no_scheduled_close",
			dueAt: null,
		});
	});
});
