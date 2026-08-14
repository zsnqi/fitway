/**
 * The composed minutely cron seam. One authenticated GET drives scheduled reset,
 * health-alert evaluation, and retention cleanup — in that fixed order, all three
 * attempted on every invocation.
 */

/**
 * Frozen alert policy, supplied here because `evaluateAlerts` deliberately has no
 * ambient policy and takes both as caller input
 * (`packages/api/src/alerts/types.ts:21-28`). `SPEC.md:595-598` resolves both at
 * 30 minutes as defaults, and `RESEARCH.md:622-624` marks alert policy frozen in
 * the specification while naming the reset buffer alone as the settings-driven,
 * owner-configurable value. They are therefore constants at this composition
 * boundary rather than `settings_versions` columns. `staleAfterMs` is the
 * genuinely settings-derived third field and continues to come from
 * `settings_versions.operational_stale_after_seconds`.
 */
export const ALERT_PRE_OPEN_WINDOW_MS = 30 * 60_000;
export const ALERT_RE_ALERT_INTERVAL_MS = 30 * 60_000;

/**
 * Per-component wall-clock bound, sized so all three components together stay
 * inside one minutely invocation.
 *
 * The frozen failure-isolation contract says a component failure must not stop
 * the components after it. A rejection satisfies that; a hang does not — nothing
 * after it is ever attempted, so an alerting or transport stall would silently
 * cost that invocation its scheduled reset. The deadline turns a hang into a
 * rejection.
 *
 * It abandons rather than cancels: the underlying query or request keeps running
 * to its own completion. That is acceptable here because every component is
 * idempotent against a repeat invocation — the alert claim is taken under an
 * advisory transaction lock, retention's cutoff is day-quantized, and reset
 * issuance is keyed — and because the outbound Telegram call carries its own
 * abort signal, bounded by `ALERT_DELIVERY_TIMEOUT_MS` below.
 */
export const CRON_COMPONENT_DEADLINE_MS = 18_000;

/**
 * Per-delivery bound for the outbound Telegram call, applied by the composition
 * site to the `fetch` the accepted notifier takes as a dependency.
 *
 * It is deliberately far below the component deadline rather than close to it.
 * `apps/server/src/alert-repository.ts:233-244` delivers notices **sequentially**,
 * and one invocation can carry one notice per member of `ALERT_CONDITION_TYPES`,
 * so a stalling — as opposed to rejecting — Telegram costs the alerts component
 * up to `ALERT_CONDITION_TYPES.length × ALERT_DELIVERY_TIMEOUT_MS`. If that
 * product exceeded `CRON_COMPONENT_DEADLINE_MS`, a transport outage would breach
 * the deadline and raise the aggregate error — which is exactly the 500 the
 * frozen contract says a transport outage must never produce, because
 * `alert-repository.ts:103-111` already turns a rejection into a durable
 * `failed` row. The relation is asserted by test, not left to arithmetic here.
 */
export const ALERT_DELIVERY_TIMEOUT_MS = 4_000;

export type CompositeCronRunnerDependencies = {
	now: () => Date;
	runScheduledReset: () => Promise<unknown>;
	evaluateAlerts: (now: Date) => Promise<unknown>;
	purgeExpired: (now: Date) => Promise<unknown>;
};

export type CompositeCronRunResult = {
	/** Empty on a healthy invocation; otherwise the runner has already thrown. */
	failures: readonly string[];
};

/**
 * Thrown once, after every component has been attempted. It names which
 * components failed and carries no detail from their errors: the cron handler
 * logs `error.name` only (`apps/server/src/cron.ts:70-73`), and a component
 * error may quote a credential-bearing endpoint.
 */
class CronRunFailedError extends Error {
	override readonly name = "CronRunFailedError";
	readonly failures: readonly string[];

	constructor(failures: readonly string[]) {
		super(`Cron components failed: ${failures.join(", ")}`);
		this.failures = failures;
	}
}

function withDeadline<T>(
	work: Promise<T>,
	component: string,
	deadlineMs: number,
): Promise<T> {
	let timer: ReturnType<typeof setTimeout> | undefined;
	const deadline = new Promise<never>((_resolve, reject) => {
		timer = setTimeout(
			() => reject(new Error(`${component} exceeded its cron deadline`)),
			deadlineMs,
		);
		// A pending deadline must never hold a serverless invocation open past
		// the response the cron handler already wrote.
		timer.unref?.();
	});
	return Promise.race([work, deadline]).finally(() => {
		if (timer) clearTimeout(timer);
	}) as Promise<T>;
}

export function createCompositeCronRunner(
	dependencies: CompositeCronRunnerDependencies,
) {
	return {
		async run(): Promise<CompositeCronRunResult> {
			// One instant for the whole invocation, so the alert evaluation and the
			// retention cutoff beside it can never disagree about "now".
			const now = dependencies.now();
			const components = [
				["scheduled-reset", () => dependencies.runScheduledReset()],
				["alerts", () => dependencies.evaluateAlerts(now)],
				["retention", () => dependencies.purgeExpired(now)],
			] as const;

			const failures: string[] = [];
			for (const [name, run] of components) {
				try {
					await withDeadline(run(), name, CRON_COMPONENT_DEADLINE_MS);
				} catch {
					// Captured, never rethrown here: an alerting fault must not
					// suppress the scheduled reset, and a reset fault must not
					// suppress alerting.
					failures.push(name);
				}
			}

			if (failures.length > 0) throw new CronRunFailedError(failures);
			return { failures };
		},
	};
}
