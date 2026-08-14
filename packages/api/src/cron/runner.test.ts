import { afterEach, describe, expect, it, vi } from "vitest";
import {
	ALERT_PRE_OPEN_WINDOW_MS,
	ALERT_RE_ALERT_INTERVAL_MS,
	CRON_COMPONENT_DEADLINE_MS,
	createCompositeCronRunner,
} from "./runner";

function neverSettles(): Promise<never> {
	return new Promise(() => undefined);
}

function runnerWith(
	overrides: Partial<Parameters<typeof createCompositeCronRunner>[0]> = {},
) {
	const calls: string[] = [];
	const now = new Date("2026-08-14T12:00:00.000Z");
	const runner = createCompositeCronRunner({
		now: () => now,
		runScheduledReset: async () => {
			calls.push("reset");
		},
		evaluateAlerts: async () => {
			calls.push("alerts");
		},
		purgeExpired: async () => {
			calls.push("retention");
		},
		...overrides,
	});
	return { calls, now, runner };
}

afterEach(() => {
	vi.useRealTimers();
});

describe("frozen alert policy supplied at the cron composition boundary", () => {
	it("is the 30-minute pre-open window and 30-minute re-alert interval SPEC freezes", () => {
		// SPEC.md:595-598 resolves both as defaults. The evaluator has no ambient
		// policy (packages/api/src/alerts/types.ts:21-28), so the composition seam
		// is where they enter, as named constants rather than settings columns.
		expect(ALERT_PRE_OPEN_WINDOW_MS).toBe(30 * 60_000);
		expect(ALERT_RE_ALERT_INTERVAL_MS).toBe(30 * 60_000);
	});

	it("bounds a single component well inside one minutely invocation", () => {
		expect(CRON_COMPONENT_DEADLINE_MS).toBeGreaterThan(0);
		expect(CRON_COMPONENT_DEADLINE_MS * 3).toBeLessThanOrEqual(60_000);
	});
});

describe("composite cron runner", () => {
	it("attempts scheduled reset, then alerts, then retention on one shared instant", async () => {
		const seen: Date[] = [];
		const { calls, now, runner } = runnerWith({
			evaluateAlerts: async (at) => {
				seen.push(at);
			},
			purgeExpired: async (at) => {
				seen.push(at);
			},
		});

		await expect(runner.run()).resolves.toEqual({ failures: [] });

		expect(calls).toEqual(["reset"]);
		// Both time-dependent components read the same instant, so a retention
		// cutoff can never disagree with the alert evaluation beside it.
		expect(seen).toEqual([now, now]);
	});

	it("reads the clock exactly once per invocation", async () => {
		const now = vi.fn(() => new Date("2026-08-14T12:00:00.000Z"));
		const { runner } = runnerWith({ now });

		await runner.run();

		expect(now).toHaveBeenCalledTimes(1);
	});

	it.each([
		["runScheduledReset", ["alerts", "retention"]],
		["evaluateAlerts", ["reset", "retention"]],
		["purgeExpired", ["reset", "alerts"]],
	] as const)("still attempts every other component when %s fails", async (failing, expected) => {
		const { calls, runner } = runnerWith({
			[failing]: async () => {
				throw new TypeError("private component detail");
			},
		});

		await expect(runner.run()).rejects.toThrowError(
			expect.objectContaining({ name: "CronRunFailedError" }),
		);

		expect(calls).toEqual(expected);
	});

	it("names every failed component and no private detail in the aggregate error", async () => {
		const { runner } = runnerWith({
			runScheduledReset: async () => {
				throw new TypeError("reset detail that must not escape");
			},
			purgeExpired: async () => {
				throw new RangeError("retention detail that must not escape");
			},
		});

		const error = await runner.run().then(
			() => undefined,
			(caught: unknown) => caught,
		);

		expect(error).toBeInstanceOf(Error);
		const failure = error as Error & { failures?: readonly string[] };
		expect(failure.name).toBe("CronRunFailedError");
		expect(failure.failures).toEqual(["scheduled-reset", "retention"]);
		expect(failure.message).toContain("scheduled-reset");
		expect(failure.message).toContain("retention");
		expect(failure.message).not.toContain("must not escape");
		expect(
			JSON.stringify(failure, Object.getOwnPropertyNames(failure)),
		).not.toContain("must not escape");
	});

	it("resolves when every component succeeds, so a healthy invocation returns 200", async () => {
		const { calls, runner } = runnerWith();

		await expect(runner.run()).resolves.toEqual({ failures: [] });

		expect(calls).toEqual(["reset", "alerts", "retention"]);
	});

	it("gives up on a component that hangs, so a hang cannot suppress the ones after it", async () => {
		vi.useFakeTimers();
		const { calls, runner } = runnerWith({ evaluateAlerts: neverSettles });

		const settled = runner.run().then(
			() => undefined,
			(caught: unknown) => caught,
		);
		await vi.advanceTimersByTimeAsync(CRON_COMPONENT_DEADLINE_MS);
		const error = (await settled) as Error & { failures?: readonly string[] };

		// A rejection satisfies the frozen failure-isolation contract; a hang does
		// not, because nothing after it is ever attempted. The deadline converts
		// the second into the first.
		expect(error.name).toBe("CronRunFailedError");
		expect(error.failures).toEqual(["alerts"]);
		expect(calls).toEqual(["reset", "retention"]);
	});

	it("leaves no pending timer behind when a component settles in time", async () => {
		vi.useFakeTimers();
		const { runner } = runnerWith();

		await runner.run();

		// An uncleared deadline timer would keep a serverless invocation alive
		// after the cron response was already written.
		expect(vi.getTimerCount()).toBe(0);
	});
});
