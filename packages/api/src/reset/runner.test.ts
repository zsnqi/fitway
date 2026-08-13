import { describe, expect, it, vi } from "vitest";
import { createScheduledResetRunner } from "./runner";
import type { ResetScheduleSettingsVersion } from "./types";

const everyDay = {
	sun: { open: "08:00", close: "20:00" },
	mon: { open: "08:00", close: "20:00" },
	tue: { open: "08:00", close: "20:00" },
	wed: { open: "08:00", close: "20:00" },
	thu: { open: "08:00", close: "20:00" },
	fri: { open: "10:00", close: "18:00" },
	sat: { open: "08:00", close: "20:00" },
} as const;

const fridayOnly = {
	sun: null,
	mon: null,
	tue: null,
	wed: null,
	thu: null,
	fri: { open: "10:00", close: "18:00" },
	sat: null,
} as const;

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
		effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
		timeZone: "UTC",
		businessDayBoundary: "04:00",
		resetBufferMinutes: 30,
		weeklySchedule: everyDay,
		...overrides,
	};
}

describe("scheduled reset runner", () => {
	it("captures now once and preserves the close-owning Friday settings through changes at close and during the buffer", async () => {
		const closeOwning = settings({
			version: 1,
			effectiveFrom: new Date("2026-08-01T00:00:00.000Z"),
			weeklySchedule: fridayOnly,
		});
		const ownerAtClose = settings({
			version: 2,
			effectiveFrom: new Date("2026-08-07T18:00:00.000Z"),
			resetBufferMinutes: 0,
			weeklySchedule: fridayOnly,
		});
		const ownerDuringBuffer = settings({
			version: 3,
			effectiveFrom: new Date("2026-08-07T18:15:00.000Z"),
			resetBufferMinutes: 60,
			weeklySchedule: fridayOnly,
		});
		const now = vi.fn(() => new Date("2026-08-07T18:30:00.000Z"));
		const issueScheduledReset = vi.fn(async () => ({ alreadyIssued: false }));
		const runner = createScheduledResetRunner({
			now,
			readSettingsVersions: async () => [
				ownerDuringBuffer,
				closeOwning,
				ownerAtClose,
			],
			readPriorIssuances: async () => [],
			issueScheduledReset,
		});

		const result = await runner.run();

		expect(now).toHaveBeenCalledTimes(1);
		expect(
			result.evaluations.map((evaluation) => evaluation.businessDay),
		).toEqual(["2026-08-06", "2026-08-07", "2026-08-08"]);
		expect(issueScheduledReset).toHaveBeenCalledOnce();
		expect(issueScheduledReset).toHaveBeenCalledWith(
			expect.objectContaining({
				businessDay: "2026-08-07",
				settingsVersion: closeOwning.version,
				dueAt: new Date("2026-08-07T18:30:00.000Z"),
				issuedAt: new Date("2026-08-07T18:30:00.000Z"),
			}),
		);
	});

	it("keeps sorted local candidates and evaluator results stable across input order", async () => {
		const versions = [
			settings({
				version: 1,
				timeZone: "America/New_York",
				weeklySchedule: closedWeek,
			}),
			settings({
				version: 2,
				effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
				resetBufferMinutes: 0,
				weeklySchedule: closedWeek,
			}),
		] as const;
		const evaluate = async (
			settingsVersions: readonly ResetScheduleSettingsVersion[],
		) => {
			const runner = createScheduledResetRunner({
				now: () => new Date("2026-07-17T01:00:00.000Z"),
				readSettingsVersions: async () => settingsVersions,
				readPriorIssuances: async () => [],
				issueScheduledReset: async () => ({ alreadyIssued: false }),
			});
			return (await runner.run()).evaluations.map((evaluation) => ({
				businessDay: evaluation.businessDay,
				decision: evaluation.decision,
			}));
		};

		const expected = await evaluate(versions);
		expect(expected).toEqual([
			{ businessDay: "2026-07-15", decision: "skip" },
			{ businessDay: "2026-07-16", decision: "skip" },
			{ businessDay: "2026-07-17", decision: "skip" },
			{ businessDay: "2026-07-18", decision: "skip" },
		]);
		await expect(evaluate([...versions].reverse())).resolves.toEqual(expected);
	});

	it("issues a later reset for a Friday session that closes after midnight", async () => {
		const issueScheduledReset = vi.fn(async () => ({ alreadyIssued: false }));
		const runner = createScheduledResetRunner({
			now: () => new Date("2026-11-07T03:00:00.000Z"),
			readSettingsVersions: async () => [
				settings({
					weeklySchedule: {
						...closedWeek,
						fri: { open: "14:00", close: "02:00" },
					},
				}),
			],
			readPriorIssuances: async () => [],
			issueScheduledReset,
		});

		await runner.run();

		expect(issueScheduledReset).toHaveBeenCalledWith(
			expect.objectContaining({
				businessDay: "2026-11-06",
				dueAt: new Date("2026-11-07T02:30:00.000Z"),
				issuedAt: new Date("2026-11-07T03:00:00.000Z"),
			}),
		);
	});

	it.each([
		{ businessDayBoundary: "02:30" },
		{ businessDayBoundary: "00:00" },
	])("propagates the accepted spring-forward gap for boundary $businessDayBoundary", async ({
		businessDayBoundary,
	}) => {
		const issueScheduledReset = vi.fn(async () => ({ alreadyIssued: false }));
		const runner = createScheduledResetRunner({
			now: () => new Date("2026-03-08T08:00:00.000Z"),
			readSettingsVersions: async () => [
				settings({
					timeZone: "America/New_York",
					businessDayBoundary,
					weeklySchedule: {
						...closedWeek,
						sun: { open: "00:00", close: "02:30" },
					},
				}),
			],
			readPriorIssuances: async () => [],
			issueScheduledReset,
		});

		await expect(runner.run()).rejects.toThrow(/does not exist/u);
		expect(issueScheduledReset).not.toHaveBeenCalled();
	});

	it.each([
		"settings",
		"issuances",
	] as const)("propagates a rejected %s reader without attempting issuance", async (rejectedReader) => {
		const failure = new Error(`${rejectedReader} unavailable`);
		const readSettingsVersions = vi.fn(() =>
			rejectedReader === "settings"
				? Promise.reject(failure)
				: Promise.resolve([settings()]),
		);
		const readPriorIssuances = vi.fn(() =>
			rejectedReader === "issuances"
				? Promise.reject(failure)
				: Promise.resolve([]),
		);
		const issueScheduledReset = vi.fn(async () => ({ alreadyIssued: false }));
		const runner = createScheduledResetRunner({
			now: () => new Date("2026-07-17T18:30:00.000Z"),
			readSettingsVersions,
			readPriorIssuances,
			issueScheduledReset,
		});

		await expect(runner.run()).rejects.toBe(failure);
		expect(readSettingsVersions).toHaveBeenCalledOnce();
		expect(readPriorIssuances).toHaveBeenCalledOnce();
		expect(issueScheduledReset).not.toHaveBeenCalled();
	});

	it("keeps an earlier issuance observable when a later issuer call rejects", async () => {
		const failure = new Error("issuer unavailable");
		const issuedBusinessDays: string[] = [];
		const issueScheduledReset = vi.fn(async (decision) => {
			issuedBusinessDays.push(decision.businessDay);
			if (decision.businessDay === "2026-07-17") throw failure;
			return { alreadyIssued: false };
		});
		const runner = createScheduledResetRunner({
			now: () => new Date("2026-07-17T18:30:00.000Z"),
			readSettingsVersions: async () => [settings()],
			readPriorIssuances: async () => [],
			issueScheduledReset,
		});

		await expect(runner.run()).rejects.toBe(failure);
		expect(issuedBusinessDays).toEqual(["2026-07-16", "2026-07-17"]);
		expect(issueScheduledReset).toHaveBeenCalledTimes(2);
	});
});
