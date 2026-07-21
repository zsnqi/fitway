export const ALERT_CONDITION_TYPES = [
	"stale_push",
	"process_failure",
	"camera_failure",
	"feed_failure",
] as const;

export type AlertConditionType = (typeof ALERT_CONDITION_TYPES)[number];
export type AlertNoticeKind = "alert" | "recovery";
export type AlertDeliveryOutcome = "delivered" | "failed";
export type AlertHealthStatus = "ok" | "degraded" | "failed" | "unknown";
export type HealthTransitionType =
	| "online"
	| "offline"
	| "reported_flags_changed";

export type AlertPolicy = {
	/** Settings-derived stale boundary. Equality is stale. */
	staleAfterMs: number;
	/** Settings-derived period immediately before the next scheduled opening. */
	preOpenWindowMs: number;
	/** Settings-derived minimum interval between unresolved alert attempts. */
	reAlertIntervalMs: number;
};

export type ScheduleAnswer =
	| { open: true }
	| { open: false; nextOpenAt: Date | null };

export type CurrentHealth = {
	deviceId: string;
	processStatus: AlertHealthStatus;
	cameraStatus: AlertHealthStatus;
	feedStatus: AlertHealthStatus;
	receivedAt: Date;
};

export type PriorAlertLog = {
	id: number;
	deviceId: string;
	condition: AlertConditionType;
	noticeKind: AlertNoticeKind;
	conditionStartedAt: Date;
	sentAt: Date;
	deliveryOutcome: AlertDeliveryOutcome;
	recoveryOfAlertId: number | null;
};

export type PriorHealthTransition = {
	id: number;
	deviceId: string;
	type: HealthTransitionType;
	processStatus: AlertHealthStatus | null;
	cameraStatus: AlertHealthStatus | null;
	feedStatus: AlertHealthStatus | null;
	occurredAt: Date;
};

export type AlertNotice = {
	deviceId: string;
	condition: AlertConditionType;
	noticeKind: AlertNoticeKind;
	conditionStartedAt: Date;
	sentAt: Date;
	recoveryOfAlertId: number | null;
};

export type HealthTransition = Omit<PriorHealthTransition, "id">;

export type AlertEvaluation = {
	notices: AlertNotice[];
	healthTransitions: HealthTransition[];
};

export type EvaluateAlertsInput = {
	now: Date;
	policy: AlertPolicy;
	schedule: ScheduleAnswer;
	deviceId: string | null;
	lastAcceptedPushAt: Date | null;
	currentHealth: CurrentHealth | null;
	priorAlerts: readonly PriorAlertLog[];
	priorHealthTransitions: readonly PriorHealthTransition[];
};
