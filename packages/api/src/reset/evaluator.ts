import { businessDayFor } from "../occupancy/business-day";
import { evaluateSchedule } from "../occupancy/schedule";
import type {
	EvaluateScheduledResetInput,
	ResetScheduleSettingsVersion,
	ScheduledResetEvaluation,
} from "./types";

type CivilDate = { year: number; month: number; day: number };
type WallTime = {
	hour: number;
	minute: number;
	second: number;
	millisecond: number;
	totalMilliseconds: number;
};
type LocalParts = CivilDate & Omit<WallTime, "totalMilliseconds">;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME = /^(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,6}))?)?$/;

function milliseconds(value: Date, name: string): number {
	const result = value.getTime();
	if (!Number.isFinite(result)) throw new RangeError(`${name} must be valid`);
	return result;
}

function parseIsoDate(value: string): CivilDate {
	const match = ISO_DATE.exec(value);
	if (!match) throw new RangeError("Business day must be an ISO date");
	const result = {
		year: Number(match[1]),
		month: Number(match[2]),
		day: Number(match[3]),
	};
	const canonical = new Date(0);
	canonical.setUTCFullYear(result.year, result.month - 1, result.day);
	canonical.setUTCHours(0, 0, 0, 0);
	if (canonical.toISOString().slice(0, 10) !== value) {
		throw new RangeError("Business day must be an ISO date");
	}
	return result;
}

function addDays(value: CivilDate, amount: number): CivilDate {
	const date = new Date(0);
	date.setUTCFullYear(value.year, value.month - 1, value.day + amount);
	date.setUTCHours(0, 0, 0, 0);
	return {
		year: date.getUTCFullYear(),
		month: date.getUTCMonth() + 1,
		day: date.getUTCDate(),
	};
}

function parseTime(value: string): WallTime {
	const match = TIME.exec(value);
	if (!match) throw new RangeError("Schedule time must be HH:mm or HH:mm:ss");
	const hour = Number(match[1]);
	const minute = Number(match[2]);
	const second = Number(match[3] ?? 0);
	const millisecond = Number((match[4] ?? "").slice(0, 3).padEnd(3, "0"));
	if (hour > 23 || minute > 59 || second > 59) {
		throw new RangeError("Schedule time is outside the clock range");
	}
	return {
		hour,
		minute,
		second,
		millisecond,
		totalMilliseconds:
			((hour * 60 + minute) * 60 + second) * 1_000 + millisecond,
	};
}

function localParts(instant: Date, timeZone: string): LocalParts {
	const parts = Object.fromEntries(
		new Intl.DateTimeFormat("en-CA-u-ca-gregory-nu-latn", {
			timeZone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			fractionalSecondDigits: 3,
			hourCycle: "h23",
		})
			.formatToParts(instant)
			.filter((part) => part.type !== "literal")
			.map((part) => [part.type, part.value]),
	);
	return {
		year: Number(parts.year),
		month: Number(parts.month),
		day: Number(parts.day),
		hour: Number(parts.hour),
		minute: Number(parts.minute),
		second: Number(parts.second),
		millisecond: Number(parts.fractionalSecond),
	};
}

function utcMilliseconds(value: LocalParts): number {
	const date = new Date(0);
	date.setUTCFullYear(value.year, value.month - 1, value.day);
	date.setUTCHours(value.hour, value.minute, value.second, value.millisecond);
	return date.getTime();
}

function sameLocalParts(left: LocalParts, right: LocalParts): boolean {
	return (
		left.year === right.year &&
		left.month === right.month &&
		left.day === right.day &&
		left.hour === right.hour &&
		left.minute === right.minute &&
		left.second === right.second &&
		left.millisecond === right.millisecond
	);
}

function wallTimeToInstant(
	date: CivilDate,
	time: WallTime,
	timeZone: string,
	isRelevantAt: (instant: Date) => boolean,
): Date | null {
	const requested: LocalParts = { ...date, ...time };
	const naive = utcMilliseconds(requested);
	const offsets = new Set<number>();
	for (let delta = -48; delta <= 48; delta += 6) {
		const sampled = naive + delta * 60 * 60 * 1_000;
		offsets.add(
			utcMilliseconds(localParts(new Date(sampled), timeZone)) - sampled,
		);
	}
	const candidates = [...offsets].map((offset) => naive - offset);
	const match = candidates
		.filter((candidate) =>
			sameLocalParts(localParts(new Date(candidate), timeZone), requested),
		)
		.sort((left, right) => left - right)[0];
	if (match === undefined) {
		if (
			!candidates.some((candidate) => isRelevantAt(new Date(candidate - 1)))
		) {
			return null;
		}
		throw new RangeError(
			"Schedule wall time does not exist in the configured zone",
		);
	}
	return new Date(match);
}

function weekdayIndex(value: CivilDate): number {
	const date = new Date(0);
	date.setUTCFullYear(value.year, value.month - 1, value.day);
	date.setUTCHours(0, 0, 0, 0);
	return date.getUTCDay();
}

function settingsEffectiveAt(
	versions: readonly ResetScheduleSettingsVersion[],
	at: Date,
): ResetScheduleSettingsVersion | null {
	const atMs = milliseconds(at, "Settings evaluation instant");
	return [...versions]
		.sort(
			(left, right) =>
				milliseconds(left.effectiveFrom, "Settings effectiveFrom") -
					milliseconds(right.effectiveFrom, "Settings effectiveFrom") ||
				left.version - right.version,
		)
		.reduce<ResetScheduleSettingsVersion | null>(
			(result, version) =>
				milliseconds(version.effectiveFrom, "Settings effectiveFrom") <= atMs
					? version
					: result,
			null,
		);
}

function scheduledCloseFor(
	businessDay: string,
	anchor: CivilDate,
	version: ResetScheduleSettingsVersion,
	versions: readonly ResetScheduleSettingsVersion[],
): Date | null {
	const weekday = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
	const hours = version.weeklySchedule[weekday[weekdayIndex(anchor)] ?? "sun"];
	if (!hours) return null;
	const open = parseTime(hours.open);
	const close = parseTime(hours.close);
	const closeAt = wallTimeToInstant(
		close.totalMilliseconds <= open.totalMilliseconds
			? addDays(anchor, 1)
			: anchor,
		close,
		version.timeZone,
		(at) => settingsEffectiveAt(versions, at) === version,
	);
	if (!closeAt) return null;
	const beforeClose = new Date(closeAt.getTime() - 1);
	if (settingsEffectiveAt(versions, beforeClose) !== version) return null;
	if (!evaluateSchedule(version, beforeClose).open) return null;
	if (
		businessDayFor(
			beforeClose,
			version.timeZone,
			version.businessDayBoundary,
		) !== businessDay
	) {
		return null;
	}
	return closeAt;
}

export function evaluateScheduledReset(
	input: EvaluateScheduledResetInput,
): ScheduledResetEvaluation {
	const businessDay = parseIsoDate(input.businessDay);
	const nowMs = milliseconds(input.now, "Reset evaluation instant");
	const anchors = [
		addDays(businessDay, -1),
		businessDay,
		addDays(businessDay, 1),
	];
	const candidates = input.settingsVersions
		.flatMap((version) =>
			anchors.map((anchor) => ({
				version,
				closeAt: scheduledCloseFor(
					input.businessDay,
					anchor,
					version,
					input.settingsVersions,
				),
			})),
		)
		.filter(
			(
				value,
			): value is { version: ResetScheduleSettingsVersion; closeAt: Date } =>
				value.closeAt !== null,
		);
	const candidate = candidates.sort(
		(left, right) => right.closeAt.getTime() - left.closeAt.getTime(),
	)[0];
	if (!candidate) {
		return {
			decision: "skip",
			businessDay: input.businessDay,
			reason: "no_scheduled_close",
			dueAt: null,
		};
	}
	if (
		!Number.isSafeInteger(candidate.version.resetBufferMinutes) ||
		candidate.version.resetBufferMinutes < 0
	) {
		throw new RangeError("Reset buffer must be a nonnegative safe integer");
	}
	const dueAt = new Date(
		candidate.closeAt.getTime() +
			candidate.version.resetBufferMinutes * 60 * 1_000,
	);
	if (nowMs < dueAt.getTime()) {
		return {
			decision: "skip",
			businessDay: input.businessDay,
			reason: "not_due",
			dueAt,
		};
	}
	if (
		input.priorIssuances.some(
			(issuance) => issuance.businessDay === input.businessDay,
		)
	) {
		return {
			decision: "skip",
			businessDay: input.businessDay,
			reason: "already_issued",
			dueAt,
		};
	}
	return {
		decision: "issue",
		issuanceKey: `scheduled-reset:${input.businessDay}`,
		businessDay: input.businessDay,
		settingsVersion: candidate.version.version,
		scheduledCloseAt: candidate.closeAt,
		dueAt,
		issuedAt: input.now,
		issuer: "system",
		command: {
			type: "reset_zero",
			targetValue: null,
			reason: `scheduled reset for business day ${input.businessDay}`,
			supersedePending: true,
		},
	};
}
