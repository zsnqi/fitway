import { z } from "zod";

import {
	ALERT_CONDITION_TYPES,
	type AlertConditionType,
	type AlertDeliveryOutcome,
	type AlertNoticeKind,
	type HealthTransitionType,
} from "../alerts/types";
import { businessDayFor } from "../occupancy/business-day";
import {
	assertScheduleSettings,
	resolveScheduleSession,
	type ScheduleCivilDate,
	type WeeklySchedule,
} from "../occupancy/schedule";

/**
 * The owner-only incident and uptime read contract (SPEC.md story 27).
 *
 * ## What one incident is
 *
 * `alert_log` is an append-only *sequence*, not a mutable status table, and it is
 * emphatically not one row per incident:
 *
 * - `apps/server/src/alert-repository.ts` writes a `claimed` row for every notice
 *   inside the advisory-locked transaction, then a second row after commit carrying
 *   the real delivery outcome. Two rows, one notice.
 * - `packages/api/src/alerts/evaluator.ts` carries `conditionStartedAt` forward across
 *   every bounded re-alert (`previous?.conditionStartedAt ?? activeSince`) and reuses
 *   it again on the recovery notice. Many notices, one condition.
 *
 * So `(deviceId, condition, conditionStartedAt)` is the writer's own identity for one
 * continuous unresolved condition, and it is what this module calls an **incident**.
 * Counting rows would multiply a single outage by four or more.
 *
 * ## What the log cannot answer, and is not made to answer
 *
 * - A condition suppressed during closed hours produces **no row at all** — the
 *   evaluator returns before emitting a notice. An incident here is therefore always
 *   a condition the maintainer was actually notified about, never a suppressed one.
 * - `edge_health_log` only begins at its first transition. Minutes before that are
 *   unknown, not online, so they are excluded from the uptime denominator and the
 *   shortfall is reported as `monitoredRatio` rather than hidden inside a flattering
 *   percentage.
 *
 * ## Three dimensions that are never flattened into "down"
 *
 * `connection` (were pushes arriving), the device-reported failure conditions inside
 * `alerts.incidents`, and the Telegram delivery outcome (`delivered` / `failed` /
 * `unconfirmed`) are separate. A notification that failed to send is not an outage,
 * and an outage with a delivered notice is not a transport problem. That separation is
 * accepted Phase 8 authority (`PHASES.md` Phase 8).
 *
 * ## Privacy
 *
 * Both source tables are keyed by device. No device id, device name, per-visitor datum,
 * or image reference is emitted: the summary is counts, instants, and condition kinds.
 */

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

/** The single window every figure on this surface shares. */
export const HEALTH_WINDOW_BUSINESS_DAYS = 14;
/** Bounded lists; the unbounded truth stays available as a count. */
export const HEALTH_OFFLINE_PERIOD_LIST_MAX = 20;
export const HEALTH_INCIDENT_LIST_MAX = 20;

/** Extra scan margin so a business day that starts before local midnight is whole. */
const SCAN_MARGIN_DAYS = 2;

export type HealthSettingsVersion = {
	version: number;
	effectiveFrom: Date;
	timeZone: string;
	businessDayBoundary: string;
	weeklySchedule: WeeklySchedule;
};

/** One persisted `edge_health_log` row. */
export type HealthTransitionRow = {
	id: number;
	deviceId: string;
	transitionType: HealthTransitionType;
	occurredAt: Date;
};

/** One persisted `alert_log` row — a row, not a notice and not an incident. */
export type HealthAlertRow = {
	id: number;
	deviceId: string;
	condition: AlertConditionType;
	noticeKind: AlertNoticeKind;
	conditionStartedAt: Date;
	sentAt: Date;
	deliveryOutcome: AlertDeliveryOutcome;
};

/**
 * The earliest `sent_at` a caller must read for the window to be complete.
 *
 * The summary itself filters to the exact window, so a reader may hand over any
 * superset; this is the smallest safe one, and it keeps the `alert_log` read bounded
 * without any new index.
 */
export function healthAlertLookbackStart(now: Date): Date {
	return new Date(
		instantMs(now, "Server now") -
			(HEALTH_WINDOW_BUSINESS_DAYS + SCAN_MARGIN_DAYS + 1) * DAY_MS,
	);
}

export type HealthIncidentSummaryInput = {
	now: Date;
	settingsVersions: readonly HealthSettingsVersion[];
	transitions: readonly HealthTransitionRow[];
	alerts: readonly HealthAlertRow[];
};

const ISO_UTC_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const isoUtcInstantSchema = z
	.string()
	.regex(
		ISO_UTC_INSTANT,
		"Instant must be an ISO UTC instant with milliseconds",
	)
	.refine((value) => new Date(value).toISOString() === value, {
		message: "Instant must be a real UTC calendar instant",
	});
const isoBusinessDaySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const minuteCountSchema = z
	.number()
	.int()
	.nonnegative()
	.max(Number.MAX_SAFE_INTEGER);
const ratioSchema = z.number().finite().min(0).max(1);

export const healthConditionSchema = z.enum(ALERT_CONDITION_TYPES);

export const healthOfflinePeriodSchema = z
	.object({
		startedAtUtc: isoUtcInstantSchema,
		/** `null` is an outage that had not recovered when the summary was built. */
		endedAtUtc: isoUtcInstantSchema.nullable(),
		elapsedMinutes: minuteCountSchema,
		/** Zero means the gym was closed throughout, so no visit was affected. */
		openMinutes: minuteCountSchema,
	})
	.strict();

export const healthIncidentSchema = z
	.object({
		condition: healthConditionSchema,
		startedAtUtc: isoUtcInstantSchema,
		lastNoticeAtUtc: isoUtcInstantSchema.nullable(),
		recoveredAtUtc: isoUtcInstantSchema.nullable(),
		/** Notices, not rows: the initial alert plus each bounded re-alert. */
		noticeCount: minuteCountSchema,
		delivered: minuteCountSchema,
		failed: minuteCountSchema,
		/** Claimed but never confirmed; it is not the same as a failed send. */
		unconfirmed: minuteCountSchema,
	})
	.strict();

export const healthIncidentSummarySchema = z
	.object({
		window: z
			.object({
				businessDayFrom: isoBusinessDaySchema,
				businessDayTo: isoBusinessDaySchema,
				businessDays: z.number().int().positive(),
				timeZone: z.string().min(1),
				generatedAtUtc: isoUtcInstantSchema,
			})
			.strict(),
		connection: z
			.object({
				/** Scheduled open minutes in the window — the outer denominator. */
				expectedOpenMinutes: minuteCountSchema,
				/** Of those, the minutes the health log actually covers. */
				monitoredOpenMinutes: minuteCountSchema,
				onlineOpenMinutes: minuteCountSchema,
				offlineOpenMinutes: minuteCountSchema,
				/** online / monitored. `null` when nothing in the window is monitored. */
				uptimeRatio: ratioSchema.nullable(),
				/** monitored / expected. `null` only when the gym never opened. */
				monitoredRatio: ratioSchema.nullable(),
				monitoringStartedAtUtc: isoUtcInstantSchema.nullable(),
				offlinePeriodCount: minuteCountSchema,
				offlinePeriods: z
					.array(healthOfflinePeriodSchema)
					.max(HEALTH_OFFLINE_PERIOD_LIST_MAX),
			})
			.strict(),
		alerts: z
			.object({
				/**
				 * Every notice sent inside the window, alert and recovery alike, and the
				 * denominator of the three outcomes below, which sum to it. A recovery
				 * send can fail on the wire too, so it belongs to the transport figure
				 * even though it is not an incident of its own.
				 */
				noticeCount: minuteCountSchema,
				delivered: minuteCountSchema,
				failed: minuteCountSchema,
				unconfirmed: minuteCountSchema,
				incidentCount: minuteCountSchema,
				incidents: z.array(healthIncidentSchema).max(HEALTH_INCIDENT_LIST_MAX),
			})
			.strict(),
	})
	.strict();

export type HealthOfflinePeriod = z.infer<typeof healthOfflinePeriodSchema>;
export type HealthIncident = z.infer<typeof healthIncidentSchema>;
export type HealthIncidentSummary = z.infer<typeof healthIncidentSummarySchema>;

function instantMs(value: Date, what: string): number {
	const result = value.getTime();
	if (!Number.isFinite(result)) throw new RangeError(`${what} must be valid`);
	return result;
}

/**
 * Groups persisted rows into incidents, newest first.
 *
 * Exported because this is the single most misreadable part of the contract and it
 * deserves its own direct evidence in the test suite.
 */
export function groupAlertIncidents(
	rows: readonly HealthAlertRow[],
): HealthIncident[] {
	type Group = {
		condition: AlertConditionType;
		startedAt: number;
		/** Keyed by notice `sentAt`; the two persisted rows of one notice collapse here. */
		notices: Map<number, Set<AlertDeliveryOutcome>>;
		recoveredAt: number | null;
	};
	const groups = new Map<string, Group>();
	for (const row of rows) {
		const startedAt = instantMs(row.conditionStartedAt, "Condition start");
		const sentAt = instantMs(row.sentAt, "Notice send time");
		const key = `${row.deviceId} ${row.condition} ${startedAt}`;
		let group = groups.get(key);
		if (!group) {
			group = {
				condition: row.condition,
				startedAt,
				notices: new Map(),
				recoveredAt: null,
			};
			groups.set(key, group);
		}
		if (row.noticeKind === "recovery") {
			group.recoveredAt =
				group.recoveredAt === null
					? sentAt
					: Math.min(group.recoveredAt, sentAt);
			continue;
		}
		const outcomes =
			group.notices.get(sentAt) ?? new Set<AlertDeliveryOutcome>();
		outcomes.add(row.deliveryOutcome);
		group.notices.set(sentAt, outcomes);
	}

	return [...groups.values()]
		.map((group): HealthIncident => {
			const sentTimes = [...group.notices.keys()].sort(
				(left, right) => left - right,
			);
			let delivered = 0;
			let failed = 0;
			let unconfirmed = 0;
			for (const outcomes of group.notices.values()) {
				// The post-commit row is the authority. A notice with only its `claimed`
				// row never had its outcome recorded, which is not a failed send.
				if (outcomes.has("delivered")) delivered += 1;
				else if (outcomes.has("failed")) failed += 1;
				else unconfirmed += 1;
			}
			const last = sentTimes.at(-1);
			return {
				condition: group.condition,
				startedAtUtc: new Date(group.startedAt).toISOString(),
				lastNoticeAtUtc:
					last === undefined ? null : new Date(last).toISOString(),
				recoveredAtUtc:
					group.recoveredAt === null
						? null
						: new Date(group.recoveredAt).toISOString(),
				noticeCount: sentTimes.length,
				delivered,
				failed,
				unconfirmed,
			};
		})
		.sort(
			(left, right) =>
				Date.parse(right.startedAtUtc) - Date.parse(left.startedAtUtc) ||
				left.condition.localeCompare(right.condition),
		);
}

/**
 * Collapses rows into notices and counts how each one actually landed.
 *
 * The post-commit row is the delivery authority. A notice carrying only its
 * transaction-local `claimed` row never had an outcome recorded — the process did not
 * reach the second insert — and that is `unconfirmed`, not `failed`.
 */
export function countNoticeOutcomes(rows: readonly HealthAlertRow[]): {
	noticeCount: number;
	delivered: number;
	failed: number;
	unconfirmed: number;
} {
	const notices = new Map<string, Set<AlertDeliveryOutcome>>();
	for (const row of rows) {
		const key = `${row.deviceId} ${row.condition} ${row.noticeKind} ${instantMs(
			row.conditionStartedAt,
			"Condition start",
		)} ${instantMs(row.sentAt, "Notice send time")}`;
		const outcomes = notices.get(key) ?? new Set<AlertDeliveryOutcome>();
		outcomes.add(row.deliveryOutcome);
		notices.set(key, outcomes);
	}
	let delivered = 0;
	let failed = 0;
	let unconfirmed = 0;
	for (const outcomes of notices.values()) {
		if (outcomes.has("delivered")) delivered += 1;
		else if (outcomes.has("failed")) failed += 1;
		else unconfirmed += 1;
	}
	return { noticeCount: notices.size, delivered, failed, unconfirmed };
}

function validatedSettings(
	settingsVersions: readonly HealthSettingsVersion[],
): HealthSettingsVersion[] {
	const versions = [...settingsVersions];
	for (const settings of versions) {
		if (!Number.isSafeInteger(settings.version) || settings.version <= 0) {
			throw new RangeError("Settings version must be a positive safe integer");
		}
		instantMs(settings.effectiveFrom, "Settings effective time");
		assertScheduleSettings(settings);
		businessDayFor(
			settings.effectiveFrom,
			settings.timeZone,
			settings.businessDayBoundary,
		);
	}
	return versions.sort(
		(left, right) =>
			left.effectiveFrom.getTime() - right.effectiveFrom.getTime() ||
			left.version - right.version,
	);
}

function effectiveSettingsAt(
	sorted: readonly HealthSettingsVersion[],
	instant: number,
): HealthSettingsVersion | null {
	let result: HealthSettingsVersion | null = null;
	for (const settings of sorted) {
		if (settings.effectiveFrom.getTime() > instant) break;
		result = settings;
	}
	return result;
}

const civilFormatters = new Map<string, Intl.DateTimeFormat>();

function civilDateIn(instant: number, timeZone: string): ScheduleCivilDate {
	let formatter = civilFormatters.get(timeZone);
	if (!formatter) {
		formatter = new Intl.DateTimeFormat("en-CA-u-ca-gregory-nu-latn", {
			timeZone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		});
		civilFormatters.set(timeZone, formatter);
	}
	const parts = Object.fromEntries(
		formatter
			.formatToParts(instant)
			.filter((part) => part.type !== "literal")
			.map((part) => [part.type, Number(part.value)]),
	);
	const date = { year: parts.year, month: parts.month, day: parts.day };
	if (
		!Number.isInteger(date.year) ||
		!Number.isInteger(date.month) ||
		!Number.isInteger(date.day)
	) {
		throw new RangeError(`Local date cannot be resolved in ${timeZone}`);
	}
	return date as ScheduleCivilDate;
}

function addCivilDays(
	date: ScheduleCivilDate,
	days: number,
): ScheduleCivilDate {
	const value = new Date(Date.UTC(date.year, date.month - 1, date.day));
	value.setUTCDate(value.getUTCDate() + days);
	return {
		year: value.getUTCFullYear(),
		month: value.getUTCMonth() + 1,
		day: value.getUTCDate(),
	};
}

type OpenSession = { start: number; end: number };

/**
 * The open sessions of one settings version across the scan span.
 *
 * This is `evaluateSchedule`'s own answer, resolved once per local date instead of
 * once per minute: that function searches up to eight days ahead for the next opening
 * on every closed instant, which a fourteen-day minute scan cannot afford. A wall time
 * that does not exist in the configured zone still raises, exactly as it does there.
 */
function openSessionsFor(
	settings: HealthSettingsVersion,
	scanStart: number,
	scanEnd: number,
): OpenSession[] {
	const sessions: OpenSession[] = [];
	let anchor = addCivilDays(civilDateIn(scanStart, settings.timeZone), -1);
	const last = addCivilDays(civilDateIn(scanEnd, settings.timeZone), 1);
	for (;;) {
		const resolution = resolveScheduleSession(settings, anchor);
		if (resolution) {
			if (resolution.start.kind === "gap" || resolution.end.kind === "gap") {
				throw new RangeError(
					"Schedule wall time does not exist in the configured zone",
				);
			}
			const start = resolution.start.instant.getTime();
			const end = resolution.end.instant.getTime();
			if (end > start) sessions.push({ start, end });
		}
		if (
			anchor.year === last.year &&
			anchor.month === last.month &&
			anchor.day === last.day
		) {
			break;
		}
		anchor = addCivilDays(anchor, 1);
	}
	return sessions.sort((left, right) => left.start - right.start);
}

function isWithin(sessions: readonly OpenSession[], instant: number): boolean {
	for (const session of sessions) {
		if (instant < session.start) return false;
		if (instant < session.end) return true;
	}
	return false;
}

function previousIsoDay(value: string, days: number): string {
	const parsed = Date.parse(`${value}T00:00:00.000Z`);
	if (!Number.isFinite(parsed)) throw new RangeError("Invalid business day");
	return new Date(parsed - days * DAY_MS).toISOString().slice(0, 10);
}

/**
 * The first minute belonging to the window's earliest business day.
 *
 * `businessDayFor` partitions the timeline into consecutive days, so window
 * membership is a contiguous instant range and one boundary is enough: the minute
 * loop below then needs no per-minute timezone formatting at all, which is what keeps
 * a fourteen-day scan inside a request. The search is coarse by hour and then exact by
 * minute, so a settings change that moves the configured boundary still lands on the
 * real first crossing rather than on an assumed offset.
 */
function windowStartInstant(
	sorted: readonly HealthSettingsVersion[],
	scanStart: number,
	scanEnd: number,
	businessDayFrom: string,
): number {
	const dayAt = (instant: number): string | null => {
		const settings = effectiveSettingsAt(sorted, instant);
		if (!settings) return null;
		return businessDayFor(
			new Date(instant),
			settings.timeZone,
			settings.businessDayBoundary,
		);
	};
	const HOUR_MS = 60 * MINUTE_MS;
	let coarse: number | null = null;
	for (let instant = scanStart; instant <= scanEnd; instant += HOUR_MS) {
		const day = dayAt(instant);
		if (day !== null && day >= businessDayFrom) {
			coarse = instant;
			break;
		}
	}
	if (coarse === null) return scanEnd;
	const from = Math.max(scanStart, coarse - HOUR_MS + MINUTE_MS);
	for (let minute = from; minute <= coarse; minute += MINUTE_MS) {
		const day = dayAt(minute);
		if (day !== null && day >= businessDayFrom) return minute;
	}
	return coarse;
}

type ConnectionSpan = { offline: boolean; start: number; end: number | null };

/**
 * The gym's connection history as one ordered step function.
 *
 * `alert-repository.ts` only ever evaluates `currentState.activeDeviceId`, so exactly
 * one device is under evaluation at any instant. Ordering every `online`/`offline`
 * transition by time therefore reads as the gym's own connection history, and a device
 * swap reads as the recovery it was. `reported_flags_changed` carries device-reported
 * flags, not connectivity, and takes no part in it.
 */
function connectionSpans(
	transitions: readonly HealthTransitionRow[],
): ConnectionSpan[] {
	const ordered = transitions
		.filter(
			(row) =>
				row.transitionType === "online" || row.transitionType === "offline",
		)
		.map((row) => ({
			offline: row.transitionType === "offline",
			at: instantMs(row.occurredAt, "Health transition instant"),
			id: row.id,
		}))
		.sort((left, right) => left.at - right.at || left.id - right.id);

	const spans: ConnectionSpan[] = [];
	for (const transition of ordered) {
		const current = spans.at(-1);
		if (current && current.offline === transition.offline) continue;
		if (current) current.end = transition.at;
		spans.push({
			offline: transition.offline,
			start: transition.at,
			end: null,
		});
	}
	return spans;
}

export function buildHealthIncidentSummary(
	input: HealthIncidentSummaryInput,
): HealthIncidentSummary {
	const nowMs = instantMs(input.now, "Server now");
	const sorted = validatedSettings(input.settingsVersions);
	const current = effectiveSettingsAt(sorted, nowMs);
	if (!current) {
		throw new Error("No effective settings exist at server now");
	}

	const businessDayTo = businessDayFor(
		input.now,
		current.timeZone,
		current.businessDayBoundary,
	);
	const businessDayFrom = previousIsoDay(
		businessDayTo,
		HEALTH_WINDOW_BUSINESS_DAYS - 1,
	);

	const scanEnd = Math.floor(nowMs / MINUTE_MS) * MINUTE_MS;
	const scanStart =
		scanEnd - (HEALTH_WINDOW_BUSINESS_DAYS + SCAN_MARGIN_DAYS) * DAY_MS;
	const sessionsByVersion = new Map<number, OpenSession[]>();
	for (const settings of sorted) {
		sessionsByVersion.set(
			settings.version,
			openSessionsFor(settings, scanStart, scanEnd),
		);
	}

	const spans = connectionSpans(input.transitions);
	const monitoringStartedAt = spans[0]?.start ?? null;
	const offlineSpans = spans.filter((span) => span.offline);
	const openMinutesBySpan = new Map<ConnectionSpan, number>();

	let expectedOpenMinutes = 0;
	let monitoredOpenMinutes = 0;
	let offlineOpenMinutes = 0;
	let spanIndex = 0;
	const windowStart = windowStartInstant(
		sorted,
		scanStart,
		scanEnd,
		businessDayFrom,
	);

	for (
		let minute = windowStart;
		minute + MINUTE_MS <= scanEnd;
		minute += MINUTE_MS
	) {
		const settings = effectiveSettingsAt(sorted, minute);
		if (!settings) continue;

		const sessions = sessionsByVersion.get(settings.version);
		if (!sessions || !isWithin(sessions, minute)) continue;
		expectedOpenMinutes += 1;

		if (monitoringStartedAt === null || minute < monitoringStartedAt) continue;
		monitoredOpenMinutes += 1;

		while (
			spanIndex + 1 < spans.length &&
			(spans[spanIndex + 1]?.start ?? Number.POSITIVE_INFINITY) <= minute
		) {
			spanIndex += 1;
		}
		const span = spans[spanIndex];
		if (!span?.offline) continue;
		offlineOpenMinutes += 1;
		openMinutesBySpan.set(span, (openMinutesBySpan.get(span) ?? 0) + 1);
	}

	const onlineOpenMinutes = monitoredOpenMinutes - offlineOpenMinutes;
	const windowFrom = windowStart;
	const windowOfflineSpans = offlineSpans
		.filter((span) => (span.end ?? nowMs) > windowFrom && span.start < nowMs)
		.sort((left, right) => right.start - left.start);

	const noticesInWindow = input.alerts.filter((row) => {
		const sentAt = instantMs(row.sentAt, "Notice send time");
		return sentAt >= windowFrom && sentAt <= nowMs;
	});
	const incidents = groupAlertIncidents(noticesInWindow);

	return healthIncidentSummarySchema.parse({
		window: {
			businessDayFrom,
			businessDayTo,
			businessDays: HEALTH_WINDOW_BUSINESS_DAYS,
			timeZone: current.timeZone,
			generatedAtUtc: new Date(nowMs).toISOString(),
		},
		connection: {
			expectedOpenMinutes,
			monitoredOpenMinutes,
			onlineOpenMinutes,
			offlineOpenMinutes,
			uptimeRatio:
				monitoredOpenMinutes === 0
					? null
					: onlineOpenMinutes / monitoredOpenMinutes,
			monitoredRatio:
				expectedOpenMinutes === 0
					? null
					: monitoredOpenMinutes / expectedOpenMinutes,
			monitoringStartedAtUtc:
				monitoringStartedAt === null
					? null
					: new Date(monitoringStartedAt).toISOString(),
			offlinePeriodCount: windowOfflineSpans.length,
			offlinePeriods: windowOfflineSpans
				.slice(0, HEALTH_OFFLINE_PERIOD_LIST_MAX)
				.map((span) => ({
					startedAtUtc: new Date(span.start).toISOString(),
					endedAtUtc:
						span.end === null ? null : new Date(span.end).toISOString(),
					elapsedMinutes: Math.max(
						0,
						Math.floor(((span.end ?? nowMs) - span.start) / MINUTE_MS),
					),
					openMinutes: openMinutesBySpan.get(span) ?? 0,
				})),
		},
		alerts: {
			...countNoticeOutcomes(noticesInWindow),
			incidentCount: incidents.length,
			incidents: incidents.slice(0, HEALTH_INCIDENT_LIST_MAX),
		},
	});
}
