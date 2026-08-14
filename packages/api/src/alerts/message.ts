import type { AlertConditionType, AlertNotice } from "./types";

/**
 * Operator-facing labels for the maintainer channel. They are diagnostics, not
 * product content: no public surface renders them, so they carry no locale,
 * no occupancy value, and nothing about a visitor.
 */
const CONDITION_LABELS: Record<AlertConditionType, string> = {
	stale_push: "No accepted push",
	process_failure: "Edge process failure",
	camera_failure: "Camera failure",
	feed_failure: "Feed failure",
};

function instant(value: Date, name: string): string {
	const milliseconds = value.getTime();
	if (!Number.isFinite(milliseconds)) {
		throw new RangeError(`${name} must be a valid instant`);
	}
	return value.toISOString();
}

/**
 * Deterministically renders one notice as maintainer message text. It is pure:
 * no clock, no locale, no transport, and no credential. Times are UTC ISO-8601
 * in Western digits so the maintainer reads the same instant the log stores.
 */
export function formatAlertMessage(notice: AlertNotice): string {
	const startedAt = instant(notice.conditionStartedAt, "conditionStartedAt");
	const sentAt = instant(notice.sentAt, "sentAt");
	const label = CONDITION_LABELS[notice.condition];
	const heading =
		notice.noticeKind === "recovery"
			? `FITWAY recovered: ${label}`
			: `FITWAY alert: ${label}`;
	return [
		heading,
		`Device: ${notice.deviceId}`,
		`Condition started: ${startedAt}`,
		`Evaluated: ${sentAt}`,
	].join("\n");
}
