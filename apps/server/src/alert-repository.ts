import { evaluateAlerts } from "@fitway/api/alerts/evaluator";
import type { AlertNotifier } from "@fitway/api/alerts/notifier";
import type {
	AlertDeliveryOutcome,
	AlertEvaluation,
	AlertPolicy,
	CurrentHealth,
	EvaluateAlertsInput,
	PriorAlertLog,
	PriorHealthTransition,
} from "@fitway/api/alerts/types";
import {
	evaluateSchedule,
	type WeeklySchedule,
} from "@fitway/api/occupancy/schedule";
import type { db } from "@fitway/db";
import {
	alertLog,
	currentState,
	edgeCurrentHealth,
	edgeHealthLog,
	settingsVersions,
} from "@fitway/db/schema/application";
import { asc, desc, eq } from "drizzle-orm";

type Database = typeof db;

export type AlertEvaluationOptions = {
	now: Date;
	/** Caller-provided configuration; the evaluator has no ambient policy. */
	preOpenWindowMs: number;
	reAlertIntervalMs: number;
	notifier: AlertNotifier;
};

export type AlertRepository = {
	evaluateAndNotify(options: AlertEvaluationOptions): Promise<AlertEvaluation>;
};

function normalizeDatabaseTime(value: string): string {
	return value.length === 5 ? value : value.slice(0, 8);
}

function schedulePair(open: string | null, close: string | null) {
	if (open === null && close === null) return null;
	if (open === null || close === null) {
		throw new Error("Stored alert schedule has an incomplete weekday pair");
	}
	return {
		open: normalizeDatabaseTime(open),
		close: normalizeDatabaseTime(close),
	};
}

function scheduleFor(settings: typeof settingsVersions.$inferSelect): {
	timeZone: string;
	weeklySchedule: WeeklySchedule;
} {
	return {
		timeZone: settings.timezone,
		weeklySchedule: {
			sun: schedulePair(settings.scheduleSunOpen, settings.scheduleSunClose),
			mon: schedulePair(settings.scheduleMonOpen, settings.scheduleMonClose),
			tue: schedulePair(settings.scheduleTueOpen, settings.scheduleTueClose),
			wed: schedulePair(settings.scheduleWedOpen, settings.scheduleWedClose),
			thu: schedulePair(settings.scheduleThuOpen, settings.scheduleThuClose),
			fri: schedulePair(settings.scheduleFriOpen, settings.scheduleFriClose),
			sat: schedulePair(settings.scheduleSatOpen, settings.scheduleSatClose),
		},
	};
}

function asCurrentHealth(
	deviceId: string | null,
	row: {
		projectionDeviceId: string | null;
		processStatus: "ok" | "degraded" | "failed" | "unknown" | null;
		cameraStatus: "ok" | "degraded" | "failed" | "unknown" | null;
		feedStatus: "ok" | "degraded" | "failed" | "unknown" | null;
		receivedAt: Date | null;
	},
): CurrentHealth | null {
	if (
		!deviceId ||
		row.projectionDeviceId !== deviceId ||
		!row.processStatus ||
		!row.cameraStatus ||
		!row.feedStatus ||
		!row.receivedAt
	) {
		return null;
	}
	return {
		deviceId,
		processStatus: row.processStatus,
		cameraStatus: row.cameraStatus,
		feedStatus: row.feedStatus,
		receivedAt: row.receivedAt,
	};
}

function outcomeFor(
	notifier: AlertNotifier,
	notice: AlertEvaluation["notices"][number],
): Promise<AlertDeliveryOutcome> {
	return notifier(notice).then(
		() => "delivered" as const,
		() => "failed" as const,
	);
}

export function createAlertRepository(database: Database): AlertRepository {
	async function buildEvaluationInput(
		options: AlertEvaluationOptions,
	): Promise<EvaluateAlertsInput | null> {
		const [settings] = await database
			.select()
			.from(settingsVersions)
			.orderBy(
				desc(settingsVersions.effectiveFrom),
				desc(settingsVersions.version),
			)
			.limit(1);
		if (!settings) return null;
		const [current] = await database
			.select({
				deviceId: currentState.activeDeviceId,
				lastAcceptedPushAt: currentState.lastPushReceivedAt,
				projectionDeviceId: edgeCurrentHealth.deviceId,
				processStatus: edgeCurrentHealth.processStatus,
				cameraStatus: edgeCurrentHealth.cameraStatus,
				feedStatus: edgeCurrentHealth.feedStatus,
				receivedAt: edgeCurrentHealth.receivedAt,
			})
			.from(currentState)
			.leftJoin(
				edgeCurrentHealth,
				eq(currentState.activeDeviceId, edgeCurrentHealth.deviceId),
			)
			.where(eq(currentState.id, 1))
			.limit(1);
		const deviceId = current?.deviceId ?? null;
		const [alerts, transitions] = deviceId
			? await Promise.all([
					database
						.select()
						.from(alertLog)
						.where(eq(alertLog.deviceId, deviceId))
						.orderBy(asc(alertLog.sentAt), asc(alertLog.id)),
					database
						.select()
						.from(edgeHealthLog)
						.where(eq(edgeHealthLog.deviceId, deviceId))
						.orderBy(asc(edgeHealthLog.occurredAt), asc(edgeHealthLog.id)),
				])
			: [[], []];
		const policy: AlertPolicy = {
			staleAfterMs: settings.operationalStaleAfterSeconds * 1_000,
			preOpenWindowMs: options.preOpenWindowMs,
			reAlertIntervalMs: options.reAlertIntervalMs,
		};
		return {
			now: options.now,
			policy,
			schedule: evaluateSchedule(scheduleFor(settings), options.now),
			deviceId,
			lastAcceptedPushAt: current?.lastAcceptedPushAt ?? null,
			currentHealth: current ? asCurrentHealth(deviceId, current) : null,
			priorAlerts: alerts.map(
				(row): PriorAlertLog => ({
					id: row.id,
					deviceId: row.deviceId,
					condition: row.condition,
					noticeKind: row.noticeKind,
					conditionStartedAt: row.conditionStartedAt,
					sentAt: row.sentAt,
					deliveryOutcome: row.deliveryOutcome,
					recoveryOfAlertId: row.recoveryOfAlertId,
				}),
			),
			priorHealthTransitions: transitions.map(
				(row): PriorHealthTransition => ({
					id: row.id,
					deviceId: row.deviceId,
					type: row.transitionType,
					processStatus: row.processStatus,
					cameraStatus: row.cameraStatus,
					feedStatus: row.feedStatus,
					occurredAt: row.occurredAt,
				}),
			),
		};
	}

	return {
		async evaluateAndNotify(options) {
			const input = await buildEvaluationInput(options);
			if (!input) return { notices: [], healthTransitions: [] };
			const evaluation = evaluateAlerts(input);
			if (evaluation.healthTransitions.length > 0) {
				await database.insert(edgeHealthLog).values(
					evaluation.healthTransitions.map((transition) => ({
						deviceId: transition.deviceId,
						transitionType: transition.type,
						processStatus: transition.processStatus,
						cameraStatus: transition.cameraStatus,
						feedStatus: transition.feedStatus,
						occurredAt: transition.occurredAt,
					})),
				);
			}
			for (const notice of evaluation.notices) {
				const deliveryOutcome = await outcomeFor(options.notifier, notice);
				await database.insert(alertLog).values({
					deviceId: notice.deviceId,
					condition: notice.condition,
					noticeKind: notice.noticeKind,
					conditionStartedAt: notice.conditionStartedAt,
					sentAt: notice.sentAt,
					deliveryOutcome,
					recoveryOfAlertId: notice.recoveryOfAlertId,
				});
			}
			return evaluation;
		},
	};
}
