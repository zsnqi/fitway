import {
	ALERT_CONDITION_TYPES,
	type AlertConditionType,
	type AlertEvaluation,
	type AlertHealthStatus,
	type AlertNotice,
	type EvaluateAlertsInput,
	type HealthTransition,
	type PriorAlertLog,
} from "./types";

function milliseconds(value: Date): number {
	const result = value.getTime();
	if (!Number.isFinite(result))
		throw new RangeError("Alert dates must be valid");
	return result;
}

function positiveMilliseconds(value: number, name: string): number {
	if (!Number.isFinite(value) || value <= 0) {
		throw new RangeError(`${name} must be a positive finite duration`);
	}
	return value;
}

function alertAllowedDuringSchedule(
	now: Date,
	schedule: EvaluateAlertsInput["schedule"],
	preOpenWindowMs: number,
): boolean {
	if (schedule.open) return true;
	if (!schedule.nextOpenAt) return false;
	const untilOpen = milliseconds(schedule.nextOpenAt) - milliseconds(now);
	return untilOpen >= 0 && untilOpen <= preOpenWindowMs;
}

function latest<T>(
	values: readonly T[],
	compare: (value: T) => number,
): T | null {
	let result: T | null = null;
	for (const value of values) {
		if (result === null || compare(value) >= compare(result)) result = value;
	}
	return result;
}

function unresolvedAlert(
	deviceId: string,
	condition: AlertConditionType,
	alerts: readonly PriorAlertLog[],
): PriorAlertLog | null {
	const conditionLogs = alerts.filter(
		(alert) => alert.deviceId === deviceId && alert.condition === condition,
	);
	const last = latest(conditionLogs, (alert) => milliseconds(alert.sentAt));
	return last?.noticeKind === "alert" ? last : null;
}

function failureStartedAt(
	input: EvaluateAlertsInput,
	condition: Exclude<AlertConditionType, "stale_push">,
	health: NonNullable<EvaluateAlertsInput["currentHealth"]>,
): Date {
	if (!input.deviceId) return health.receivedAt;
	const statusKey =
		condition === "process_failure"
			? "processStatus"
			: condition === "camera_failure"
				? "cameraStatus"
				: "feedStatus";
	let unresolvedStartedAt: Date | null = null;
	const transitions = input.priorHealthTransitions
		.filter(
			(transition) =>
				transition.deviceId === input.deviceId &&
				transition.processStatus !== null &&
				transition.cameraStatus !== null &&
				transition.feedStatus !== null,
		)
		.slice()
		.sort(
			(left, right) =>
				milliseconds(left.occurredAt) - milliseconds(right.occurredAt),
		);
	for (const transition of transitions) {
		if (transition[statusKey] === "failed") {
			unresolvedStartedAt ??= transition.occurredAt;
		} else {
			unresolvedStartedAt = null;
		}
	}
	return unresolvedStartedAt ?? health.receivedAt;
}

function activeConditions(
	input: EvaluateAlertsInput,
): Map<AlertConditionType, Date> {
	const result = new Map<AlertConditionType, Date>();
	if (!input.deviceId) return result;
	const now = milliseconds(input.now);
	const staleAfterMs = positiveMilliseconds(
		input.policy.staleAfterMs,
		"staleAfterMs",
	);
	if (
		input.lastAcceptedPushAt === null ||
		now - milliseconds(input.lastAcceptedPushAt) >= staleAfterMs
	) {
		result.set(
			"stale_push",
			input.lastAcceptedPushAt
				? new Date(milliseconds(input.lastAcceptedPushAt) + staleAfterMs)
				: input.now,
		);
	}
	const health = input.currentHealth;
	if (!health || health.deviceId !== input.deviceId) return result;
	const failures: Array<
		[Exclude<AlertConditionType, "stale_push">, AlertHealthStatus]
	> = [
		["process_failure", health.processStatus],
		["camera_failure", health.cameraStatus],
		["feed_failure", health.feedStatus],
	];
	for (const [condition, status] of failures) {
		if (status === "failed") {
			result.set(condition, failureStartedAt(input, condition, health));
		}
	}
	return result;
}

function healthTransitions(input: EvaluateAlertsInput): HealthTransition[] {
	if (!input.deviceId) return [];
	const now = milliseconds(input.now);
	const staleAfterMs = positiveMilliseconds(
		input.policy.staleAfterMs,
		"staleAfterMs",
	);
	const online =
		input.lastAcceptedPushAt !== null &&
		now - milliseconds(input.lastAcceptedPushAt) < staleAfterMs;
	const forDevice = input.priorHealthTransitions.filter(
		(transition) => transition.deviceId === input.deviceId,
	);
	const priorConnection = latest(
		forDevice.filter(
			(transition) =>
				transition.type === "online" || transition.type === "offline",
		),
		(transition) => milliseconds(transition.occurredAt),
	);
	const result: HealthTransition[] = [];
	const statuses =
		input.currentHealth && input.currentHealth.deviceId === input.deviceId
			? {
					processStatus: input.currentHealth.processStatus,
					cameraStatus: input.currentHealth.cameraStatus,
					feedStatus: input.currentHealth.feedStatus,
				}
			: { processStatus: null, cameraStatus: null, feedStatus: null };
	if (!priorConnection || (priorConnection.type === "online") !== online) {
		result.push({
			deviceId: input.deviceId,
			type: online ? "online" : "offline",
			...statuses,
			occurredAt: input.now,
		});
	}
	const currentHealth = input.currentHealth;
	if (!online || !currentHealth || currentHealth.deviceId !== input.deviceId) {
		return result;
	}
	const priorFlags = latest(
		forDevice.filter(
			(transition) =>
				transition.processStatus !== null &&
				transition.cameraStatus !== null &&
				transition.feedStatus !== null,
		),
		(transition) => milliseconds(transition.occurredAt),
	);
	if (
		!priorFlags ||
		priorFlags.processStatus !== statuses.processStatus ||
		priorFlags.cameraStatus !== statuses.cameraStatus ||
		priorFlags.feedStatus !== statuses.feedStatus
	) {
		result.push({
			deviceId: input.deviceId,
			type: "reported_flags_changed",
			...statuses,
			occurredAt: currentHealth.receivedAt,
		});
	}
	return result;
}

/**
 * Deterministically evaluates health transitions plus alert/recovery notices.
 * It uses no database, ambient clock, randomness, or transport. The caller
 * supplies schedule answers and the append-only logs that control suppression.
 */
export function evaluateAlerts(input: EvaluateAlertsInput): AlertEvaluation {
	milliseconds(input.now);
	const preOpenWindowMs = positiveMilliseconds(
		input.policy.preOpenWindowMs,
		"preOpenWindowMs",
	);
	const reAlertIntervalMs = positiveMilliseconds(
		input.policy.reAlertIntervalMs,
		"reAlertIntervalMs",
	);
	const active = activeConditions(input);
	const notices: AlertNotice[] = [];
	if (input.deviceId) {
		for (const condition of ALERT_CONDITION_TYPES) {
			const activeSince = active.get(condition);
			const previous = unresolvedAlert(
				input.deviceId,
				condition,
				input.priorAlerts,
			);
			if (activeSince) {
				if (
					!alertAllowedDuringSchedule(
						input.now,
						input.schedule,
						preOpenWindowMs,
					)
				) {
					continue;
				}
				if (
					previous &&
					milliseconds(input.now) - milliseconds(previous.sentAt) <
						reAlertIntervalMs
				) {
					continue;
				}
				notices.push({
					deviceId: input.deviceId,
					condition,
					noticeKind: "alert",
					conditionStartedAt: previous?.conditionStartedAt ?? activeSince,
					sentAt: input.now,
					recoveryOfAlertId: null,
				});
				continue;
			}
			if (previous) {
				notices.push({
					deviceId: input.deviceId,
					condition,
					noticeKind: "recovery",
					conditionStartedAt: previous.conditionStartedAt,
					sentAt: input.now,
					recoveryOfAlertId: previous.id,
				});
			}
		}
	}
	return { notices, healthTransitions: healthTransitions(input) };
}
