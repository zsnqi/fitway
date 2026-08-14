/**
 * Twelve-month audit/health/alert retention, per `SPEC.md`. The window is
 * approximate by the specification's own wording ("~12 months"), so it is
 * frozen here as whole calendar months against a UTC-day-quantized clock.
 *
 * Retention is not a business-day concept, so ADR-004's gym-local business-day
 * machinery deliberately does not apply — stored UTC is authoritative.
 */
export const RETENTION_WINDOW_MONTHS = 12;

export const RETENTION_TABLES = [
	"audit_log",
	"edge_health_log",
	"alert_log",
] as const;

export type RetentionTable = (typeof RETENTION_TABLES)[number];

/** The one timestamp that decides each table's eligibility. */
export const RETENTION_GOVERNING_COLUMN: Record<RetentionTable, string> = {
	audit_log: "created_at",
	edge_health_log: "occurred_at",
	alert_log: "sent_at",
};

function assertInstant(value: Date, name: string): void {
	if (!Number.isFinite(value.getTime())) {
		throw new RangeError(`${name} must be a valid instant`);
	}
}

/**
 * The instant before which rows are expired, quantized down to the start of
 * `now`'s UTC day and then moved back twelve calendar months.
 *
 * Quantization is load-bearing rather than cosmetic. A `now`-relative cutoff
 * advances every minute, so every minutely invocation would find newly-expired
 * rows and no data-derived gate could make a repeat run a no-op — forcing
 * either a persisted run marker or in-process memory that does not survive a
 * serverless invocation. A day-quantized cutoff is constant for the whole UTC
 * day, so the day's first invocation deletes and every later one is inherently
 * a no-op. That is what lets retention run on every invocation with no gate,
 * no state, and no migration.
 */
export function retentionCutoff(now: Date): Date {
	assertInstant(now, "now");
	const year = now.getUTCFullYear();
	const month = now.getUTCMonth();
	// Day 0 of the following month is the last day of the target month, which
	// clamps 29 February back onto a non-leap year instead of letting it roll
	// forward into March and silently shorten the window by a day.
	const lastDayOfTargetMonth = new Date(
		Date.UTC(year - 1, month + 1, 0),
	).getUTCDate();
	return new Date(
		Date.UTC(year - 1, month, Math.min(now.getUTCDate(), lastDayOfTargetMonth)),
	);
}

/**
 * Eligibility for one row. Strictly older: a row exactly at the cutoff is
 * retained, so the boundary instant itself is never deleted.
 */
export function isExpired(governingTimestamp: Date, cutoff: Date): boolean {
	assertInstant(governingTimestamp, "governingTimestamp");
	assertInstant(cutoff, "cutoff");
	return governingTimestamp.getTime() < cutoff.getTime();
}
