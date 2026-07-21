import { describe, expect, it } from "vitest";
import { evaluateSchedule, type WeeklySchedule } from "../occupancy/schedule";
import { evaluateAlerts } from "./evaluator";
import type { EvaluateAlertsInput, PriorAlertLog } from "./types";

const alwaysOpen: WeeklySchedule = {
	sun: { open: "00:00", close: "00:00" },
	mon: { open: "00:00", close: "00:00" },
	tue: { open: "00:00", close: "00:00" },
	wed: { open: "00:00", close: "00:00" },
	thu: { open: "00:00", close: "00:00" },
	fri: { open: "00:00", close: "00:00" },
	sat: { open: "00:00", close: "00:00" },
};

const healthyHealth = {
	deviceId: "device-1",
	processStatus: "ok" as const,
	cameraStatus: "ok" as const,
	feedStatus: "ok" as const,
	receivedAt: new Date("2026-07-17T09:57:00.000Z"),
};

function input(
	overrides: Partial<EvaluateAlertsInput> = {},
): EvaluateAlertsInput {
	return {
		now: new Date("2026-07-17T10:00:00.000Z"),
		policy: {
			staleAfterMs: 180_000,
			preOpenWindowMs: 1_800_000,
			reAlertIntervalMs: 1_800_000,
		},
		schedule: { open: true },
		deviceId: "device-1",
		lastAcceptedPushAt: new Date("2026-07-17T09:57:00.000Z"),
		currentHealth: healthyHealth,
		priorAlerts: [],
		priorHealthTransitions: [],
		...overrides,
	};
}

function alert(overrides: Partial<PriorAlertLog> = {}): PriorAlertLog {
	return {
		id: 1,
		deviceId: "device-1",
		condition: "stale_push",
		noticeKind: "alert",
		conditionStartedAt: new Date("2026-07-17T10:00:00.000Z"),
		sentAt: new Date("2026-07-17T10:00:00.000Z"),
		deliveryOutcome: "delivered",
		recoveryOfAlertId: null,
		...overrides,
	};
}

describe("evaluateAlerts", () => {
	it("alerts at stale-threshold equality and records initial online and flags transitions", () => {
		const result = evaluateAlerts(input());
		expect(result.notices).toMatchObject([
			{ condition: "stale_push", noticeKind: "alert" },
		]);
		expect(result.healthTransitions.map((event) => event.type)).toEqual([
			"offline",
		]);
	});

	it("suppresses closed-hour failures then escalates exactly at the pre-open boundary, including Friday", () => {
		const schedule: WeeklySchedule = {
			...alwaysOpen,
			fri: { open: "14:00", close: "00:00" },
		};
		const beforeWindow = new Date("2026-07-17T10:29:59.999Z");
		const atWindow = new Date("2026-07-17T10:30:00.000Z");
		const closed = evaluateSchedule(
			{ timeZone: "Asia/Riyadh", weeklySchedule: schedule },
			beforeWindow,
		);
		const preOpen = evaluateSchedule(
			{ timeZone: "Asia/Riyadh", weeklySchedule: schedule },
			atWindow,
		);
		expect(closed).toMatchObject({
			open: false,
			nextOpenAt: new Date("2026-07-17T11:00:00.000Z"),
		});
		expect(
			evaluateAlerts(input({ now: beforeWindow, schedule: closed })).notices,
		).toEqual([]);
		expect(
			evaluateAlerts(input({ now: atWindow, schedule: preOpen })).notices,
		).toMatchObject([{ condition: "stale_push", noticeKind: "alert" }]);
	});

	it("handles a past-midnight session as open", () => {
		const schedule = evaluateSchedule(
			{
				timeZone: "Asia/Riyadh",
				weeklySchedule: {
					...alwaysOpen,
					thu: { open: "20:00", close: "02:00" },
				},
			},
			new Date("2026-07-16T22:00:00.000Z"),
		);
		expect(schedule).toEqual({ open: true });
		expect(
			evaluateAlerts(
				input({
					now: new Date("2026-07-16T22:00:00.000Z"),
					schedule,
					lastAcceptedPushAt: new Date("2026-07-16T21:57:00.000Z"),
				}),
			).notices,
		).toHaveLength(1);
	});

	it("bounds re-alerts at the interval edge and emits one recovery when a failure clears", () => {
		const first = alert({
			condition: "camera_failure",
			sentAt: new Date("2026-07-17T09:30:00.000Z"),
		});
		const failed = input({
			lastAcceptedPushAt: new Date("2026-07-17T09:59:59.999Z"),
			currentHealth: { ...healthyHealth, cameraStatus: "failed" },
			priorAlerts: [first],
		});
		expect(evaluateAlerts(failed).notices).toMatchObject([
			{ condition: "camera_failure", noticeKind: "alert" },
		]);
		const suppressed = evaluateAlerts({
			...failed,
			now: new Date("2026-07-17T09:59:59.999Z"),
		});
		expect(suppressed.notices).toEqual([]);
		const recovery = evaluateAlerts({
			...failed,
			currentHealth: { ...healthyHealth, cameraStatus: "ok" },
		});
		expect(recovery.notices).toEqual([
			expect.objectContaining({
				condition: "camera_failure",
				noticeKind: "recovery",
				recoveryOfAlertId: 1,
			}),
		]);
	});

	it("tracks reported-flag flapping append-only without changing a prior transition", () => {
		const first = evaluateAlerts(
			input({
				lastAcceptedPushAt: new Date("2026-07-17T09:59:59.000Z"),
			}),
		);
		expect(first.healthTransitions.map((event) => event.type)).toEqual([
			"online",
			"reported_flags_changed",
		]);
		const second = evaluateAlerts(
			input({
				lastAcceptedPushAt: new Date("2026-07-17T09:59:59.000Z"),
				currentHealth: { ...healthyHealth, feedStatus: "failed" },
				priorHealthTransitions: first.healthTransitions.map((event, index) => ({
					...event,
					id: index + 1,
				})),
			}),
		);
		expect(second.healthTransitions.map((event) => event.type)).toEqual([
			"reported_flags_changed",
		]);
	});

	it("isolates unresolved alerts and recoveries by device", () => {
		const otherDeviceAlert = alert({
			deviceId: "device-2",
			condition: "camera_failure",
			sentAt: new Date("2026-07-17T09:30:00.000Z"),
		});
		const failed = evaluateAlerts(
			input({
				lastAcceptedPushAt: new Date("2026-07-17T09:59:59.000Z"),
				currentHealth: { ...healthyHealth, cameraStatus: "failed" },
				priorAlerts: [otherDeviceAlert],
			}),
		);
		expect(failed.notices).toEqual([
			expect.objectContaining({
				deviceId: "device-1",
				condition: "camera_failure",
				noticeKind: "alert",
			}),
		]);

		const recovered = evaluateAlerts(
			input({
				lastAcceptedPushAt: new Date("2026-07-17T09:59:59.000Z"),
				priorAlerts: [otherDeviceAlert],
			}),
		);
		expect(recovered.notices).toEqual([]);
	});

	it("keeps a failure start at its first unresolved qualifying transition", () => {
		const failureStartedAt = new Date("2026-07-17T09:00:00.000Z");
		const repeatedReceiptAt = new Date("2026-07-17T09:59:00.000Z");
		const priorFailure = alert({
			condition: "camera_failure",
			conditionStartedAt: failureStartedAt,
			sentAt: new Date("2026-07-17T09:30:00.000Z"),
		});
		const transitions: EvaluateAlertsInput["priorHealthTransitions"] = [
			{
				id: 1,
				deviceId: "device-1",
				type: "reported_flags_changed",
				processStatus: "ok",
				cameraStatus: "failed",
				feedStatus: "ok",
				occurredAt: failureStartedAt,
			},
		];
		const reAlert = evaluateAlerts(
			input({
				lastAcceptedPushAt: new Date("2026-07-17T09:59:59.000Z"),
				currentHealth: {
					...healthyHealth,
					cameraStatus: "failed",
					receivedAt: repeatedReceiptAt,
				},
				priorAlerts: [priorFailure],
				priorHealthTransitions: transitions,
			}),
		);
		expect(reAlert.notices).toEqual([
			expect.objectContaining({
				condition: "camera_failure",
				noticeKind: "alert",
				conditionStartedAt: failureStartedAt,
			}),
		]);

		const recovery = evaluateAlerts(
			input({
				lastAcceptedPushAt: new Date("2026-07-17T09:59:59.000Z"),
				priorAlerts: [priorFailure],
				priorHealthTransitions: transitions,
			}),
		);
		expect(recovery.notices).toEqual([
			expect.objectContaining({
				condition: "camera_failure",
				noticeKind: "recovery",
				conditionStartedAt: failureStartedAt,
				recoveryOfAlertId: priorFailure.id,
			}),
		]);

		const newFailureStartedAt = new Date("2026-07-17T10:01:00.000Z");
		const newFailure = evaluateAlerts(
			input({
				now: new Date("2026-07-17T10:02:00.000Z"),
				lastAcceptedPushAt: new Date("2026-07-17T10:01:59.000Z"),
				currentHealth: {
					...healthyHealth,
					cameraStatus: "failed",
					receivedAt: newFailureStartedAt,
				},
				priorAlerts: [
					priorFailure,
					{
						...priorFailure,
						id: 2,
						noticeKind: "recovery",
						sentAt: new Date("2026-07-17T10:00:00.000Z"),
						recoveryOfAlertId: priorFailure.id,
					},
				],
				priorHealthTransitions: [
					...transitions,
					{
						id: 2,
						deviceId: "device-1",
						type: "reported_flags_changed",
						processStatus: "ok",
						cameraStatus: "ok",
						feedStatus: "ok",
						occurredAt: new Date("2026-07-17T10:00:00.000Z"),
					},
				],
			}),
		);
		expect(newFailure.notices).toEqual([
			expect.objectContaining({
				condition: "camera_failure",
				conditionStartedAt: newFailureStartedAt,
			}),
		]);
	});
});
