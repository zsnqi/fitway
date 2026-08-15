import { describe, expect, it } from "vitest";

import {
	buildHealthIncidentSummary,
	groupAlertIncidents,
	HEALTH_INCIDENT_LIST_MAX,
	HEALTH_OFFLINE_PERIOD_LIST_MAX,
	HEALTH_WINDOW_BUSINESS_DAYS,
	type HealthAlertRow,
	type HealthSettingsVersion,
	type HealthTransitionRow,
	healthIncidentSummarySchema,
} from "./incidents";

const OPEN_06_TO_22 = { open: "06:00", close: "22:00" };
const settings: HealthSettingsVersion = {
	version: 11,
	effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
	timeZone: "Asia/Riyadh",
	businessDayBoundary: "04:00",
	weeklySchedule: {
		sun: OPEN_06_TO_22,
		mon: OPEN_06_TO_22,
		tue: OPEN_06_TO_22,
		wed: OPEN_06_TO_22,
		thu: OPEN_06_TO_22,
		fri: OPEN_06_TO_22,
		sat: OPEN_06_TO_22,
	},
};

/** 2026-08-14 12:00 local (+03:00) — inside the open session, mid business day. */
const NOW = new Date("2026-08-14T09:00:00.000Z");

let nextId = 1;

function transition(
	occurredAt: string,
	transitionType: HealthTransitionRow["transitionType"],
): HealthTransitionRow {
	return {
		id: nextId++,
		deviceId: "device-a",
		transitionType,
		occurredAt: new Date(occurredAt),
	};
}

/**
 * One notice as the Phase 8 writer actually persists it: a `claimed` row inside the
 * advisory-locked transaction, then a second row after commit carrying the real
 * delivery outcome. Both rows share the notice's `sentAt`.
 */
function notice(value: {
	condition: HealthAlertRow["condition"];
	noticeKind: HealthAlertRow["noticeKind"];
	conditionStartedAt: string;
	sentAt: string;
	outcome?: "delivered" | "failed";
}): HealthAlertRow[] {
	const base = {
		deviceId: "device-a",
		condition: value.condition,
		noticeKind: value.noticeKind,
		conditionStartedAt: new Date(value.conditionStartedAt),
		sentAt: new Date(value.sentAt),
	};
	const claimed: HealthAlertRow = {
		...base,
		id: nextId++,
		deliveryOutcome: "claimed",
	};
	if (!value.outcome) return [claimed];
	return [claimed, { ...base, id: nextId++, deliveryOutcome: value.outcome }];
}

function summarize(input: {
	transitions?: HealthTransitionRow[];
	alerts?: HealthAlertRow[];
	now?: Date;
}) {
	return buildHealthIncidentSummary({
		now: input.now ?? NOW,
		settingsVersions: [settings],
		transitions: input.transitions ?? [],
		alerts: input.alerts ?? [],
	});
}

describe("alert incident grouping", () => {
	it("counts one incident per condition start, not one per persisted row", () => {
		// One condition, three notices (initial plus two bounded re-alerts) and one
		// recovery. The writer persists two rows per notice, so eight rows exist.
		const alerts = [
			...notice({
				condition: "stale_push",
				noticeKind: "alert",
				conditionStartedAt: "2026-08-13T05:00:00.000Z",
				sentAt: "2026-08-13T05:01:00.000Z",
				outcome: "delivered",
			}),
			...notice({
				condition: "stale_push",
				noticeKind: "alert",
				conditionStartedAt: "2026-08-13T05:00:00.000Z",
				sentAt: "2026-08-13T05:31:00.000Z",
				outcome: "failed",
			}),
			...notice({
				condition: "stale_push",
				noticeKind: "alert",
				conditionStartedAt: "2026-08-13T05:00:00.000Z",
				sentAt: "2026-08-13T06:01:00.000Z",
				outcome: "delivered",
			}),
			...notice({
				condition: "stale_push",
				noticeKind: "recovery",
				conditionStartedAt: "2026-08-13T05:00:00.000Z",
				sentAt: "2026-08-13T06:20:00.000Z",
				outcome: "delivered",
			}),
		];
		expect(alerts).toHaveLength(8);

		const incidents = groupAlertIncidents(alerts);
		expect(incidents).toHaveLength(1);
		expect(incidents[0]).toEqual({
			condition: "stale_push",
			startedAtUtc: "2026-08-13T05:00:00.000Z",
			lastNoticeAtUtc: "2026-08-13T06:01:00.000Z",
			recoveredAtUtc: "2026-08-13T06:20:00.000Z",
			noticeCount: 3,
			delivered: 2,
			failed: 1,
			unconfirmed: 0,
		});
	});

	it("separates two conditions that overlap in time", () => {
		const alerts = [
			...notice({
				condition: "camera_failure",
				noticeKind: "alert",
				conditionStartedAt: "2026-08-13T05:00:00.000Z",
				sentAt: "2026-08-13T05:01:00.000Z",
				outcome: "delivered",
			}),
			...notice({
				condition: "feed_failure",
				noticeKind: "alert",
				conditionStartedAt: "2026-08-13T05:00:00.000Z",
				sentAt: "2026-08-13T05:01:00.000Z",
				outcome: "delivered",
			}),
		];
		expect(groupAlertIncidents(alerts).map((row) => row.condition)).toEqual([
			"camera_failure",
			"feed_failure",
		]);
	});

	it("separates a repeat of the same condition after it recovered", () => {
		const alerts = [
			...notice({
				condition: "feed_failure",
				noticeKind: "alert",
				conditionStartedAt: "2026-08-12T05:00:00.000Z",
				sentAt: "2026-08-12T05:01:00.000Z",
				outcome: "delivered",
			}),
			...notice({
				condition: "feed_failure",
				noticeKind: "recovery",
				conditionStartedAt: "2026-08-12T05:00:00.000Z",
				sentAt: "2026-08-12T05:40:00.000Z",
				outcome: "delivered",
			}),
			...notice({
				condition: "feed_failure",
				noticeKind: "alert",
				conditionStartedAt: "2026-08-13T05:00:00.000Z",
				sentAt: "2026-08-13T05:01:00.000Z",
				outcome: "delivered",
			}),
		];
		const incidents = groupAlertIncidents(alerts);
		expect(incidents).toHaveLength(2);
		// Newest first.
		expect(incidents.map((row) => row.startedAtUtc)).toEqual([
			"2026-08-13T05:00:00.000Z",
			"2026-08-12T05:00:00.000Z",
		]);
		expect(incidents[0]?.recoveredAtUtc).toBeNull();
		expect(incidents[1]?.recoveredAtUtc).toBe("2026-08-12T05:40:00.000Z");
	});

	it("reports a notice with no post-commit outcome row as unconfirmed, never as failed", () => {
		const alerts = notice({
			condition: "process_failure",
			noticeKind: "alert",
			conditionStartedAt: "2026-08-13T05:00:00.000Z",
			sentAt: "2026-08-13T05:01:00.000Z",
		});
		expect(alerts).toHaveLength(1);
		expect(groupAlertIncidents(alerts)[0]).toMatchObject({
			noticeCount: 1,
			delivered: 0,
			failed: 0,
			unconfirmed: 1,
		});
	});
});

describe("health incident summary", () => {
	it("returns an honest empty summary with an explicit window and no data", () => {
		const summary = summarize({});
		expect(healthIncidentSummarySchema.parse(summary)).toEqual(summary);
		expect(summary.window.timeZone).toBe("Asia/Riyadh");
		expect(summary.window.businessDayTo).toBe("2026-08-14");
		expect(summary.window.businessDayFrom).toBe("2026-08-01");
		expect(summary.window.businessDays).toBe(HEALTH_WINDOW_BUSINESS_DAYS);
		expect(summary.connection.monitoringStartedAtUtc).toBeNull();
		expect(summary.connection.monitoredOpenMinutes).toBe(0);
		expect(summary.connection.uptimeRatio).toBeNull();
		expect(summary.connection.monitoredRatio).toBe(0);
		expect(summary.connection.expectedOpenMinutes).toBeGreaterThan(0);
		expect(summary.alerts.incidents).toEqual([]);
	});

	it("counts expected open minutes from the schedule, not from the log", () => {
		const summary = summarize({});
		// Thirteen whole 16-hour days plus six elapsed hours of the current day.
		expect(summary.connection.expectedOpenMinutes).toBe(13 * 16 * 60 + 6 * 60);
	});

	it("charges only open minutes to uptime and states both denominators", () => {
		// Monitoring starts at the beginning of the window; one offline span covers
		// 12:00-13:00 local on 2026-08-13, which is entirely inside open hours.
		const transitions = [
			transition("2026-08-01T01:00:00.000Z", "online"),
			transition("2026-08-13T09:00:00.000Z", "offline"),
			transition("2026-08-13T10:00:00.000Z", "online"),
		];
		const summary = summarize({ transitions });
		expect(summary.connection.monitoringStartedAtUtc).toBe(
			"2026-08-01T01:00:00.000Z",
		);
		expect(summary.connection.offlineOpenMinutes).toBe(60);
		expect(summary.connection.onlineOpenMinutes).toBe(
			summary.connection.monitoredOpenMinutes - 60,
		);
		expect(summary.connection.uptimeRatio).toBeCloseTo(
			summary.connection.onlineOpenMinutes /
				summary.connection.monitoredOpenMinutes,
			12,
		);
		expect(summary.connection.offlinePeriods).toHaveLength(1);
		expect(summary.connection.offlinePeriods[0]).toEqual({
			startedAtUtc: "2026-08-13T09:00:00.000Z",
			endedAtUtc: "2026-08-13T10:00:00.000Z",
			elapsedMinutes: 60,
			openMinutes: 60,
		});
	});

	it("keeps a closed-hours outage out of uptime and marks it as no open minutes", () => {
		// 01:00-03:00 local on 2026-08-13 — the gym is closed, so the alert policy
		// suppressed any notice and the owner was never exposed to this outage.
		const transitions = [
			transition("2026-08-01T01:00:00.000Z", "online"),
			transition("2026-08-12T22:00:00.000Z", "offline"),
			transition("2026-08-13T00:00:00.000Z", "online"),
		];
		const summary = summarize({ transitions });
		expect(summary.connection.offlineOpenMinutes).toBe(0);
		expect(summary.connection.uptimeRatio).toBe(1);
		expect(summary.connection.offlinePeriods).toEqual([
			{
				startedAtUtc: "2026-08-12T22:00:00.000Z",
				endedAtUtc: "2026-08-13T00:00:00.000Z",
				elapsedMinutes: 120,
				openMinutes: 0,
			},
		]);
		expect(summary.alerts.noticeCount).toBe(0);
		expect(summary.alerts.incidents).toEqual([]);
	});

	it("never credits uptime for minutes before the log begins", () => {
		const transitions = [transition("2026-08-13T05:00:00.000Z", "online")];
		const summary = summarize({ transitions });
		expect(summary.connection.monitoringStartedAtUtc).toBe(
			"2026-08-13T05:00:00.000Z",
		);
		expect(summary.connection.monitoredOpenMinutes).toBeLessThan(
			summary.connection.expectedOpenMinutes,
		);
		expect(summary.connection.monitoredRatio).toBeCloseTo(
			summary.connection.monitoredOpenMinutes /
				summary.connection.expectedOpenMinutes,
			12,
		);
		// Every monitored minute was online, but coverage is far from complete and
		// the summary says so rather than implying a full-window 100%.
		expect(summary.connection.uptimeRatio).toBe(1);
		expect(summary.connection.monitoredRatio).toBeLessThan(0.2);
	});

	it("reports an unresolved outage as ongoing rather than closing it silently", () => {
		const transitions = [
			transition("2026-08-01T01:00:00.000Z", "online"),
			transition("2026-08-14T08:00:00.000Z", "offline"),
		];
		const summary = summarize({ transitions });
		expect(summary.connection.offlinePeriods[0]).toEqual({
			startedAtUtc: "2026-08-14T08:00:00.000Z",
			endedAtUtc: null,
			elapsedMinutes: 60,
			openMinutes: 60,
		});
	});

	it("ignores flag-change transitions when deriving the connection state", () => {
		const transitions = [
			transition("2026-08-13T05:00:00.000Z", "online"),
			transition("2026-08-13T06:00:00.000Z", "reported_flags_changed"),
			transition("2026-08-13T07:00:00.000Z", "reported_flags_changed"),
		];
		const summary = summarize({ transitions });
		expect(summary.connection.offlinePeriods).toEqual([]);
		expect(summary.connection.offlineOpenMinutes).toBe(0);
	});

	it("excludes an outage that ended before the window began", () => {
		const transitions = [
			transition("2026-07-20T05:00:00.000Z", "offline"),
			transition("2026-07-20T06:00:00.000Z", "online"),
		];
		const summary = summarize({ transitions });
		expect(summary.connection.offlinePeriods).toEqual([]);
		expect(summary.connection.offlinePeriodCount).toBe(0);
		expect(summary.connection.monitoringStartedAtUtc).toBe(
			"2026-07-20T05:00:00.000Z",
		);
	});

	it("keeps device-reported failure separate from delivery transport failure", () => {
		const alerts = [
			...notice({
				condition: "camera_failure",
				noticeKind: "alert",
				conditionStartedAt: "2026-08-13T05:00:00.000Z",
				sentAt: "2026-08-13T05:01:00.000Z",
				outcome: "failed",
			}),
			...notice({
				condition: "camera_failure",
				noticeKind: "recovery",
				conditionStartedAt: "2026-08-13T05:00:00.000Z",
				sentAt: "2026-08-13T05:40:00.000Z",
				outcome: "delivered",
			}),
		];
		const summary = summarize({ alerts });
		expect(summary.alerts.noticeCount).toBe(2);
		expect(summary.alerts.failed).toBe(1);
		expect(summary.alerts.delivered).toBe(1);
		expect(summary.alerts.unconfirmed).toBe(0);
		// The camera recovered; only the Telegram send for the alert notice failed.
		// The incident's own delivery figures cover its alert notices, so the
		// delivered recovery send counts in the transport total and not here.
		expect(summary.alerts.incidents[0]).toMatchObject({
			condition: "camera_failure",
			recoveredAtUtc: "2026-08-13T05:40:00.000Z",
			noticeCount: 1,
			failed: 1,
			delivered: 0,
		});
		// A delivery failure is never an offline period.
		expect(summary.connection.offlinePeriods).toEqual([]);
	});

	it("drops notices sent before the window so every count shares one denominator", () => {
		const alerts = notice({
			condition: "stale_push",
			noticeKind: "alert",
			conditionStartedAt: "2026-07-20T05:00:00.000Z",
			sentAt: "2026-07-20T05:01:00.000Z",
			outcome: "delivered",
		});
		const summary = summarize({ alerts });
		expect(summary.alerts.noticeCount).toBe(0);
		expect(summary.alerts.incidentCount).toBe(0);
	});

	it("bounds both lists and still reports the true totals", () => {
		const stamp = (index: number, span: number, minute: string) => {
			const day = 2 + Math.floor(index / span);
			const hour = 6 + (index % span);
			return `2026-08-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${minute}:00.000Z`;
		};
		const alerts: HealthAlertRow[] = [];
		for (let index = 0; index < HEALTH_INCIDENT_LIST_MAX + 5; index += 1) {
			alerts.push(
				...notice({
					condition: "feed_failure",
					noticeKind: "alert",
					conditionStartedAt: stamp(index, 6, "00"),
					sentAt: stamp(index, 6, "01"),
					outcome: "delivered",
				}),
			);
		}
		const transitions: HealthTransitionRow[] = [
			transition("2026-08-01T01:00:00.000Z", "online"),
		];
		for (
			let index = 0;
			index < HEALTH_OFFLINE_PERIOD_LIST_MAX + 3;
			index += 1
		) {
			transitions.push(
				transition(stamp(index, 6, "00"), "offline"),
				transition(stamp(index, 6, "30"), "online"),
			);
		}
		const summary = summarize({ alerts, transitions });
		expect(summary.alerts.incidents).toHaveLength(HEALTH_INCIDENT_LIST_MAX);
		expect(summary.alerts.incidentCount).toBe(HEALTH_INCIDENT_LIST_MAX + 5);
		expect(summary.connection.offlinePeriods).toHaveLength(
			HEALTH_OFFLINE_PERIOD_LIST_MAX,
		);
		expect(summary.connection.offlinePeriodCount).toBe(
			HEALTH_OFFLINE_PERIOD_LIST_MAX + 3,
		);
		expect(healthIncidentSummarySchema.parse(summary)).toEqual(summary);
	});

	it("carries no device identity anywhere in the emitted summary", () => {
		const summary = summarize({
			transitions: [
				transition("2026-08-13T05:00:00.000Z", "offline"),
				transition("2026-08-13T06:00:00.000Z", "online"),
			],
			alerts: notice({
				condition: "stale_push",
				noticeKind: "alert",
				conditionStartedAt: "2026-08-13T05:00:00.000Z",
				sentAt: "2026-08-13T05:01:00.000Z",
				outcome: "delivered",
			}),
		});
		const text = JSON.stringify(summary);
		expect(text).not.toContain("device-a");
		expect(text).not.toMatch(/deviceId|device_id/i);
	});

	it("resolves the schedule through the settings effective at each instant", () => {
		const closedThen: HealthSettingsVersion = {
			...settings,
			version: 10,
			effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
			weeklySchedule: {
				sun: null,
				mon: null,
				tue: null,
				wed: null,
				thu: null,
				fri: null,
				sat: null,
			},
		};
		const openLater: HealthSettingsVersion = {
			...settings,
			version: 12,
			effectiveFrom: new Date("2026-08-13T00:00:00.000Z"),
		};
		const summary = buildHealthIncidentSummary({
			now: NOW,
			settingsVersions: [closedThen, openLater],
			transitions: [],
			alerts: [],
		});
		// Only the days governed by the later, open schedule contribute open minutes.
		expect(summary.connection.expectedOpenMinutes).toBeLessThan(2 * 16 * 60);
		expect(summary.connection.expectedOpenMinutes).toBeGreaterThan(0);
	});

	it("refuses to build a summary with no effective settings", () => {
		expect(() =>
			buildHealthIncidentSummary({
				now: NOW,
				settingsVersions: [],
				transitions: [],
				alerts: [],
			}),
		).toThrow(/settings/i);
	});
});
