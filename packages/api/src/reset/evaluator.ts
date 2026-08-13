import { businessDayForExclusiveLocalClose } from "../occupancy/business-day";
import {
	resolveScheduleSession,
	type ScheduleCivilDate,
	type ScheduleSessionResolution,
} from "../occupancy/schedule";
import type {
	EvaluateScheduledResetInput,
	ResetScheduleSettingsVersion,
	ScheduledResetEvaluation,
} from "./types";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const GAP_ERROR = "Schedule wall time does not exist in the configured zone";

function milliseconds(value: Date, name: string): number {
	const result = value.getTime();
	if (!Number.isFinite(result)) throw new RangeError(`${name} must be valid`);
	return result;
}

function parseIsoDate(value: string): ScheduleCivilDate {
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

function addDays(value: ScheduleCivilDate, amount: number): ScheduleCivilDate {
	const date = new Date(0);
	date.setUTCFullYear(value.year, value.month - 1, value.day + amount);
	date.setUTCHours(0, 0, 0, 0);
	return {
		year: date.getUTCFullYear(),
		month: date.getUTCMonth() + 1,
		day: date.getUTCDate(),
	};
}

function scheduledCivilTime(
	date: ScheduleCivilDate,
	timeMilliseconds: number,
): number {
	const value = new Date(0);
	value.setUTCFullYear(date.year, date.month - 1, date.day);
	value.setUTCHours(0, 0, 0, timeMilliseconds);
	return value.getTime();
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

type ResetCandidate = {
	version: ResetScheduleSettingsVersion;
	session: ScheduleSessionResolution;
	scheduledCloseOrder: number;
	ownershipAt: Date;
};

function candidateFor(
	businessDay: string,
	anchor: ScheduleCivilDate,
	version: ResetScheduleSettingsVersion,
): ResetCandidate | null {
	const session = resolveScheduleSession(version, anchor);
	if (!session) return null;
	const endAt =
		session.end.kind === "gap" ? session.end.transitionAt : session.end.instant;
	const ownershipAt =
		session.end.kind === "gap" ? endAt : new Date(endAt.getTime() - 1);
	if (
		session.start.kind !== "gap" &&
		session.end.kind !== "gap" &&
		session.start.instant.getTime() >= session.end.instant.getTime()
	) {
		return null;
	}
	const attributedBusinessDay = businessDayForExclusiveLocalClose(
		session.end.scheduled.date,
		session.end.scheduled.timeMilliseconds,
		version.businessDayBoundary,
	);
	if (attributedBusinessDay !== businessDay) return null;
	return {
		version,
		session,
		scheduledCloseOrder: scheduledCivilTime(
			session.end.scheduled.date,
			session.end.scheduled.timeMilliseconds,
		),
		ownershipAt,
	};
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
			anchors.map((anchor) => candidateFor(input.businessDay, anchor, version)),
		)
		.filter((value): value is ResetCandidate => value !== null)
		.filter(
			(value) =>
				settingsEffectiveAt(input.settingsVersions, value.ownershipAt) ===
				value.version,
		);
	const candidate = candidates.sort(
		(left, right) =>
			right.scheduledCloseOrder - left.scheduledCloseOrder ||
			milliseconds(right.version.effectiveFrom, "Settings effectiveFrom") -
				milliseconds(left.version.effectiveFrom, "Settings effectiveFrom") ||
			right.version.version - left.version.version,
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
		candidate.session.start.kind === "gap" ||
		candidate.session.end.kind === "gap"
	) {
		throw new RangeError(GAP_ERROR);
	}
	const closeAt = candidate.session.end.instant;
	if (
		!Number.isSafeInteger(candidate.version.resetBufferMinutes) ||
		candidate.version.resetBufferMinutes < 0
	) {
		throw new RangeError("Reset buffer must be a nonnegative safe integer");
	}
	const dueAt = new Date(
		closeAt.getTime() + candidate.version.resetBufferMinutes * 60 * 1_000,
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
		scheduledCloseAt: closeAt,
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
