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

	it("keeps ownership with the settings effective immediately before close", () => {
		const owner = settings({ version: 4 });
		const exactCloseChange = settings({
			version: 5,
			effectiveFrom: new Date("2026-07-16T20:00:00.000Z"),
			resetBufferMinutes: 1,
		});

		expect(
			evaluateScheduledReset({
				businessDay: "2026-07-16",
				now: new Date("2026-07-16T20:30:00.000Z"),
				settingsVersions: [exactCloseChange, owner],
				priorIssuances: [],
			}),
		).toMatchObject({
			decision: "issue",
			settingsVersion: 4,
			scheduledCloseAt: new Date("2026-07-16T20:00:00.000Z"),
			dueAt: new Date("2026-07-16T20:30:00.000Z"),
		});
	});

	it("freezes the owning settings and buffer across a during-buffer change", () => {
		const owner = settings({ version: 4 });
		const duringBufferChange = settings({
			version: 5,
			effectiveFrom: new Date("2026-07-16T20:15:00.000Z"),
			resetBufferMinutes: 5,
		});

		expect(
			evaluateScheduledReset({
				businessDay: "2026-07-16",
				now: new Date("2026-07-16T20:30:00.000Z"),
				settingsVersions: [duringBufferChange, owner],
				priorIssuances: [],
			}),
		).toMatchObject({
			decision: "issue",
			settingsVersion: 4,
			dueAt: new Date("2026-07-16T20:30:00.000Z"),
		});
	});

	it("allows a newer version to own only its prospective later close", () => {
		const owner = settings({ version: 4 });
		const prospective = settings({
			version: 5,
			effectiveFrom: new Date("2026-07-16T20:00:00.000Z"),
			resetBufferMinutes: 5,
			weeklySchedule: {
				...closedWeek,
				thu: { open: "06:00", close: "23:30" },
			},
		});

		expect(
			evaluateScheduledReset({
				businessDay: "2026-07-16",
				now: new Date("2026-07-16T20:35:00.000Z"),
				settingsVersions: [prospective, owner],
				priorIssuances: [],
			}),
		).toMatchObject({
			decision: "issue",
			settingsVersion: 5,
			scheduledCloseAt: new Date("2026-07-16T20:30:00.000Z"),
			dueAt: new Date("2026-07-16T20:35:00.000Z"),
		});
	});

	it("ignores a non-owning settings version with a nonexistent close", () => {
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

	it("uses the actual forward transition instant to select an owning close gap", () => {
		const earlier = settings({
			version: 1,
			effectiveFrom: new Date("2020-01-01T00:00:00.000Z"),
			timeZone: "America/New_York",
			businessDayBoundary: "00:00",
			weeklySchedule: {
				...closedWeek,
				sun: { open: "00:00", close: "01:30" },
			},
		});
		const gapOwner = settings({
			version: 2,
			effectiveFrom: new Date("2026-03-08T06:45:00.000Z"),
			timeZone: "America/New_York",
			businessDayBoundary: "00:00",
			weeklySchedule: {
				...closedWeek,
				sun: { open: "00:00", close: "02:30" },
			},
		});
		const successor = settings({
			version: 3,
			effectiveFrom: new Date("2026-03-08T07:15:00.000Z"),
			timeZone: "America/New_York",
			businessDayBoundary: "00:00",
			weeklySchedule: closedWeek,
		});

		expect(() =>
			evaluateScheduledReset({
				businessDay: "2026-03-08",
				now: new Date("2026-03-08T08:00:00.000Z"),
				settingsVersions: [successor, earlier, gapOwner],
				priorIssuances: [],
			}),
		).toThrow("Schedule wall time does not exist in the configured zone");
	});

	it("rejects a standalone selected nonexistent close", () => {
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

	it("attributes a close gap by its scheduled wall label, not its ownership transition", () => {
		expect(() =>
			evaluateScheduledReset({
				businessDay: "2026-03-08",
				now: new Date("2026-03-08T08:00:00.000Z"),
				settingsVersions: [
					settings({
						effectiveFrom: new Date("2020-01-01T00:00:00.000Z"),
						timeZone: "America/New_York",
						businessDayBoundary: "02:15",
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

	it("does not assign a close gap to a version obsolete at the real transition", () => {
		const earlier = settings({
			version: 1,
			effectiveFrom: new Date("2020-01-01T00:00:00.000Z"),
			timeZone: "America/New_York",
			businessDayBoundary: "00:00",
			weeklySchedule: {
				...closedWeek,
				sun: { open: "00:00", close: "01:30" },
			},
		});
		const obsoleteGap = settings({
			version: 2,
			effectiveFrom: new Date("2026-03-08T06:45:00.000Z"),
			timeZone: "America/New_York",
			businessDayBoundary: "00:00",
			weeklySchedule: {
				...closedWeek,
				sun: { open: "00:00", close: "02:30" },
			},
		});
		const successor = settings({
			version: 3,
			effectiveFrom: new Date("2026-03-08T06:59:00.000Z"),
			timeZone: "America/New_York",
			businessDayBoundary: "00:00",
			weeklySchedule: closedWeek,
		});

		expect(
			evaluateScheduledReset({
				businessDay: "2026-03-08",
				now: new Date("2026-03-08T08:00:00.000Z"),
				settingsVersions: [obsoleteGap, successor, earlier],
				priorIssuances: [],
			}),
		).toMatchObject({
			decision: "issue",
			settingsVersion: 1,
			scheduledCloseAt: new Date("2026-03-08T06:30:00.000Z"),
			dueAt: new Date("2026-03-08T07:00:00.000Z"),
		});
	});

	it("ignores a non-owning opening gap with a later real close", () => {
		const earlier = settings({
			version: 1,
			effectiveFrom: new Date("2020-01-01T00:00:00.000Z"),
			timeZone: "America/New_York",
			businessDayBoundary: "00:00",
			weeklySchedule: {
				...closedWeek,
				sun: { open: "00:00", close: "01:30" },
			},
		});
		const openingGap = settings({
			version: 2,
			effectiveFrom: new Date("2026-03-08T06:45:00.000Z"),
			timeZone: "America/New_York",
			businessDayBoundary: "00:00",
			weeklySchedule: {
				...closedWeek,
				sun: { open: "02:30", close: "04:00" },
			},
		});
		const successor = settings({
			version: 3,
			effectiveFrom: new Date("2026-03-08T07:15:00.000Z"),
			timeZone: "America/New_York",
			businessDayBoundary: "00:00",
			weeklySchedule: closedWeek,
		});

		expect(
			evaluateScheduledReset({
				businessDay: "2026-03-08",
				now: new Date("2026-03-08T08:00:00.000Z"),
				settingsVersions: [openingGap, earlier, successor],
				priorIssuances: [],
			}),
		).toMatchObject({
			decision: "issue",
			settingsVersion: 1,
			scheduledCloseAt: new Date("2026-03-08T06:30:00.000Z"),
		});
	});

	it("rejects a winning opening gap through the second evaluator path", () => {
		expect(() =>
			evaluateScheduledReset({
				businessDay: "2026-03-08",
				now: new Date("2026-03-08T08:30:00.000Z"),
				settingsVersions: [
					settings({
						version: 2,
						effectiveFrom: new Date("2026-03-08T06:45:00.000Z"),
						timeZone: "America/New_York",
						businessDayBoundary: "00:00",
						weeklySchedule: {
							...closedWeek,
							sun: { open: "02:30", close: "04:00" },
						},
					}),
				],
				priorIssuances: [],
			}),
		).toThrow("Schedule wall time does not exist in the configured zone");
	});

	it("selects the earlier fold instant before applying ownership", () => {
		const foldOwner = settings({
			version: 4,
			effectiveFrom: new Date("2020-01-01T00:00:00.000Z"),
			timeZone: "America/New_York",
			businessDayBoundary: "04:00",
			weeklySchedule: {
				...closedWeek,
				sat: { open: "20:00", close: "01:30" },
			},
		});
		const afterEarlierFold = settings({
			version: 5,
			effectiveFrom: new Date("2026-11-01T05:45:00.000Z"),
			timeZone: "America/New_York",
			weeklySchedule: closedWeek,
		});
		const input = {
			businessDay: "2026-10-31",
			now: new Date("2026-11-01T06:00:00.000Z"),
			priorIssuances: [],
		} as const;
		const histories = [
			[foldOwner, afterEarlierFold],
			[afterEarlierFold, foldOwner],
		];

		for (const settingsVersions of histories) {
			expect(
				evaluateScheduledReset({ ...input, settingsVersions }),
			).toMatchObject({
				decision: "issue",
				settingsVersion: 4,
				scheduledCloseAt: new Date("2026-11-01T05:30:00.000Z"),
			});
		}
	});

	it("is independent of settings-history input order", () => {
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
		const irrelevantFuture = settings({
			version: 3,
			effectiveFrom: new Date("2027-01-01T00:00:00.000Z"),
			weeklySchedule: closedWeek,
		});
		const input = {
			businessDay: "2026-03-08",
			now: new Date("2026-03-08T08:00:00.000Z"),
			priorIssuances: [],
		} as const;
		const histories = [
			[obsolete, current, irrelevantFuture],
			[obsolete, irrelevantFuture, current],
			[current, obsolete, irrelevantFuture],
			[current, irrelevantFuture, obsolete],
			[irrelevantFuture, obsolete, current],
			[irrelevantFuture, current, obsolete],
		];
		const expected = evaluateScheduledReset({
			...input,
			settingsVersions: histories[0] ?? [],
		});

		for (const settingsVersions of histories.slice(1)) {
			expect(evaluateScheduledReset({ ...input, settingsVersions })).toEqual(
				expected,
			);
		}
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

	it("attributes a gap close exactly at the boundary to the preceding business day", () => {
		const gapAtBoundary = settings({
			effectiveFrom: new Date("2020-01-01T00:00:00.000Z"),
			timeZone: "America/New_York",
			businessDayBoundary: "02:30",
			weeklySchedule: {
				...closedWeek,
				sun: { open: "00:00", close: "02:30" },
			},
		});
		const now = new Date("2026-03-08T08:00:00.000Z");

		expect(() =>
			evaluateScheduledReset({
				businessDay: "2026-03-07",
				now,
				settingsVersions: [gapAtBoundary],
				priorIssuances: [],
			}),
		).toThrow(/does not exist/u);
		expect(
			evaluateScheduledReset({
				businessDay: "2026-03-08",
				now,
				settingsVersions: [gapAtBoundary],
				priorIssuances: [],
			}),
		).toEqual({
			decision: "skip",
			businessDay: "2026-03-08",
			reason: "no_scheduled_close",
			dueAt: null,
		});
	});

	it("attributes equivalent exact and gap close labels with the same exclusive rule", () => {
		const exact = settings({
			effectiveFrom: new Date("2020-01-01T00:00:00.000Z"),
			timeZone: "UTC",
			businessDayBoundary: "02:30",
			weeklySchedule: {
				...closedWeek,
				sun: { open: "00:00", close: "02:30" },
			},
		});
		const gap = settings({
			...exact,
			timeZone: "America/New_York",
		});
		const now = new Date("2026-03-08T08:00:00.000Z");

		expect(
			evaluateScheduledReset({
				businessDay: "2026-03-07",
				now,
				settingsVersions: [exact],
				priorIssuances: [],
			}),
		).toMatchObject({
			decision: "issue",
			businessDay: "2026-03-07",
			scheduledCloseAt: new Date("2026-03-08T02:30:00.000Z"),
		});
		expect(() =>
			evaluateScheduledReset({
				businessDay: "2026-03-07",
				now,
				settingsVersions: [gap],
				priorIssuances: [],
			}),
		).toThrow(/does not exist/u);
		for (const version of [exact, gap]) {
			expect(
				evaluateScheduledReset({
					businessDay: "2026-03-08",
					now,
					settingsVersions: [version],
					priorIssuances: [],
				}),
			).toEqual({
				decision: "skip",
				businessDay: "2026-03-08",
				reason: "no_scheduled_close",
				dueAt: null,
			});
		}
	});

	it("orders final closes by scheduled civil time instead of a gap transition", () => {
		const laterScheduledExact = settings({
			version: 1,
			effectiveFrom: new Date("2020-01-01T00:00:00.000Z"),
			timeZone: "UTC",
			businessDayBoundary: "00:00",
			resetBufferMinutes: 0,
			weeklySchedule: {
				...closedWeek,
				sun: { open: "00:00", close: "03:00" },
			},
		});
		const laterTransitionGap = settings({
			version: 2,
			effectiveFrom: new Date("2026-03-08T07:30:00.000Z"),
			timeZone: "America/Chicago",
			businessDayBoundary: "00:00",
			weeklySchedule: {
				...closedWeek,
				sun: { open: "00:00", close: "02:15" },
			},
		});
		const input = {
			businessDay: "2026-03-08",
			now: new Date("2026-03-08T09:00:00.000Z"),
			priorIssuances: [],
		} as const;

		for (const settingsVersions of [
			[laterScheduledExact, laterTransitionGap],
			[laterTransitionGap, laterScheduledExact],
		]) {
			expect(
				evaluateScheduledReset({ ...input, settingsVersions }),
			).toMatchObject({
				decision: "issue",
				settingsVersion: 1,
				scheduledCloseAt: new Date("2026-03-08T03:00:00.000Z"),
			});
		}
	});

	it("selects an exact sentinel ahead of two applicable later-transition gaps", () => {
		const laterScheduledExact = settings({
			version: 1,
			effectiveFrom: new Date("2020-01-01T00:00:00.000Z"),
			timeZone: "UTC",
			businessDayBoundary: "00:00",
			resetBufferMinutes: 0,
			weeklySchedule: {
				...closedWeek,
				sun: { open: "00:00", close: "03:00" },
			},
		});
		const laterScheduledNewYorkGap = settings({
			version: 2,
			effectiveFrom: new Date("2026-03-08T06:45:00.000Z"),
			timeZone: "America/New_York",
			businessDayBoundary: "00:00",
			weeklySchedule: {
				...closedWeek,
				sun: { open: "00:00", close: "02:45" },
			},
		});
		const laterTransitionChicagoGap = settings({
			version: 3,
			effectiveFrom: new Date("2026-03-08T07:30:00.000Z"),
			timeZone: "America/Chicago",
			businessDayBoundary: "00:00",
			weeklySchedule: {
				...closedWeek,
				sun: { open: "00:00", close: "02:15" },
			},
		});
		const input = {
			businessDay: "2026-03-08",
			now: new Date("2026-03-08T09:00:00.000Z"),
			priorIssuances: [],
		} as const;

		for (const gap of [laterScheduledNewYorkGap, laterTransitionChicagoGap]) {
			expect(() =>
				evaluateScheduledReset({ ...input, settingsVersions: [gap] }),
			).toThrow(/does not exist/u);
		}

		const histories = [
			[
				laterScheduledExact,
				laterScheduledNewYorkGap,
				laterTransitionChicagoGap,
			],
			[
				laterScheduledExact,
				laterTransitionChicagoGap,
				laterScheduledNewYorkGap,
			],
			[
				laterScheduledNewYorkGap,
				laterScheduledExact,
				laterTransitionChicagoGap,
			],
			[
				laterScheduledNewYorkGap,
				laterTransitionChicagoGap,
				laterScheduledExact,
			],
			[
				laterTransitionChicagoGap,
				laterScheduledExact,
				laterScheduledNewYorkGap,
			],
			[
				laterTransitionChicagoGap,
				laterScheduledNewYorkGap,
				laterScheduledExact,
			],
		];
		for (const settingsVersions of histories) {
			expect(
				evaluateScheduledReset({ ...input, settingsVersions }),
			).toMatchObject({
				decision: "issue",
				settingsVersion: 1,
				scheduledCloseAt: new Date("2026-03-08T03:00:00.000Z"),
			});
		}
	});

	it("uses append-only precedence for equal exact and gap close labels", () => {
		const exact = settings({
			version: 1,
			effectiveFrom: new Date("2020-01-01T00:00:00.000Z"),
			timeZone: "UTC",
			businessDayBoundary: "00:00",
			weeklySchedule: {
				...closedWeek,
				sun: { open: "00:00", close: "02:30" },
			},
		});
		const laterGap = settings({
			version: 2,
			effectiveFrom: new Date("2026-03-08T06:45:00.000Z"),
			timeZone: "America/New_York",
			businessDayBoundary: "00:00",
			weeklySchedule: {
				...closedWeek,
				sun: { open: "00:00", close: "02:30" },
			},
		});
		const input = {
			businessDay: "2026-03-08",
			now: new Date("2026-03-08T08:00:00.000Z"),
			priorIssuances: [],
		} as const;

		for (const settingsVersions of [
			[exact, laterGap],
			[laterGap, exact],
		]) {
			expect(() =>
				evaluateScheduledReset({ ...input, settingsVersions }),
			).toThrow(/does not exist/u);
		}
	});

	it("uses higher version for a same-effective equal exact and gap label", () => {
		const effectiveFrom = new Date("2020-01-01T00:00:00.000Z");
		const higherExact = settings({
			version: 9,
			effectiveFrom,
			timeZone: "UTC",
			businessDayBoundary: "00:00",
			resetBufferMinutes: 0,
			weeklySchedule: {
				...closedWeek,
				sun: { open: "00:00", close: "02:30" },
			},
		});
		const lowerGap = settings({
			version: 4,
			effectiveFrom,
			timeZone: "America/New_York",
			businessDayBoundary: "00:00",
			weeklySchedule: {
				...closedWeek,
				sun: { open: "00:00", close: "02:30" },
			},
		});
		const input = {
			businessDay: "2026-03-08",
			now: new Date("2026-03-08T08:00:00.000Z"),
			priorIssuances: [],
		} as const;

		expect(() =>
			evaluateScheduledReset({ ...input, settingsVersions: [lowerGap] }),
		).toThrow(/does not exist/u);
		for (const settingsVersions of [
			[higherExact, lowerGap],
			[lowerGap, higherExact],
		]) {
			expect(
				evaluateScheduledReset({ ...input, settingsVersions }),
			).toMatchObject({
				decision: "issue",
				settingsVersion: 9,
				scheduledCloseAt: new Date("2026-03-08T02:30:00.000Z"),
			});
		}
	});

	it("keeps equal-label gap selection independent of transition and input order", () => {
		const newYorkGap = settings({
			version: 1,
			effectiveFrom: new Date("2026-03-08T06:45:00.000Z"),
			timeZone: "America/New_York",
			businessDayBoundary: "00:00",
			weeklySchedule: {
				...closedWeek,
				sun: { open: "00:00", close: "02:30" },
			},
		});
		const chicagoGap = settings({
			version: 2,
			effectiveFrom: new Date("2026-03-08T07:30:00.000Z"),
			timeZone: "America/Chicago",
			businessDayBoundary: "00:00",
			weeklySchedule: {
				...closedWeek,
				sun: { open: "00:00", close: "02:30" },
			},
		});
		const input = {
			businessDay: "2026-03-08",
			now: new Date("2026-03-08T09:00:00.000Z"),
			priorIssuances: [],
		} as const;

		for (const settingsVersions of [
			[newYorkGap, chicagoGap],
			[chicagoGap, newYorkGap],
		]) {
			expect(() =>
				evaluateScheduledReset({ ...input, settingsVersions }),
			).toThrow(/does not exist/u);
		}
	});
});
