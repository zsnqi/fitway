import {
	type DailyHours,
	WEEKDAYS,
	type Weekday,
} from "@fitway/api/occupancy/schedule";
import type {
	EditableOwnerSettings,
	OwnerSettingsSnapshot,
} from "@fitway/api/settings/contracts";

/**
 * The unsaved-draft representation of the five editable axes.
 *
 * Numeric fields are strings because they are edited as text: an empty field
 * must be expressible (a reopened closed day starts with required empty time
 * fields) and an invalid intermediate value must never be silently coerced.
 * Validation mirrors the shared Zod contract exactly — same regex, same
 * PostgreSQL integer boundaries, same threshold ordering — so anything the
 * draft accepts is accepted by the server, and anything it refuses is refused
 * for the same reason.
 */
export type OwnerSettingsDraft = {
	capacity: string;
	quietMaxPercent: string;
	moderateMaxPercent: string;
	busyMaxPercent: string;
	businessDayBoundary: string;
	resetBufferMinutes: string;
	days: Record<Weekday, DailyHours | null>;
};

/** The draft-only last pair per day, restored when a day is rechecked. */
export type OwnerSettingsDraftPrior = Record<Weekday, DailyHours | null>;

export type OwnerSettingsDayFieldErrors = {
	open: "required" | "invalid" | null;
	close: "required" | "invalid" | null;
};

export type OwnerSettingsDraftErrors = {
	capacity: "required" | "invalid" | "range" | null;
	businessDayBoundary: "required" | "invalid" | null;
	resetBufferMinutes: "required" | "invalid" | "range" | null;
	quietMaxPercent: "required" | "invalid" | "range" | null;
	moderateMaxPercent: "required" | "invalid" | "range" | "order" | null;
	busyMaxPercent: "required" | "invalid" | "range" | "order" | null;
	days: Record<Weekday, OwnerSettingsDayFieldErrors>;
};

const WALL_TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const INTEGER = /^\d+$/;
const INT32_MAX = 2_147_483_647;

function emptyPrior(): OwnerSettingsDraftPrior {
	return {
		sun: null,
		mon: null,
		tue: null,
		wed: null,
		thu: null,
		fri: null,
		sat: null,
	};
}

export function emptyDraftErrors(): OwnerSettingsDraftErrors {
	return {
		capacity: null,
		businessDayBoundary: null,
		resetBufferMinutes: null,
		quietMaxPercent: null,
		moderateMaxPercent: null,
		busyMaxPercent: null,
		days: {
			sun: { open: null, close: null },
			mon: { open: null, close: null },
			tue: { open: null, close: null },
			wed: { open: null, close: null },
			thu: { open: null, close: null },
			fri: { open: null, close: null },
			sat: { open: null, close: null },
		},
	};
}

export function draftFromSnapshot(
	snapshot: OwnerSettingsSnapshot,
): OwnerSettingsDraft {
	const { editable } = snapshot;
	return {
		capacity: String(editable.capacity),
		quietMaxPercent: String(editable.thresholds.quietMaxPercent),
		moderateMaxPercent: String(editable.thresholds.moderateMaxPercent),
		busyMaxPercent: String(editable.thresholds.busyMaxPercent),
		businessDayBoundary: editable.businessDayBoundary,
		resetBufferMinutes: String(editable.resetBufferMinutes),
		days: { ...editable.weeklySchedule },
	};
}

function parseInteger(value: string): number | null {
	const trimmed = value.trim();
	if (!INTEGER.test(trimmed)) return null;
	const parsed = Number(trimmed);
	return Number.isSafeInteger(parsed) ? parsed : null;
}

/**
 * Canonical 24-hour `HH:mm` in Western digits only — `7:00`, `07:60`, and
 * `٠7:00` are all refused, exactly like the shared contract.
 */
export function isValidWallTime(value: string): boolean {
	return WALL_TIME.test(value);
}

export function validateDraft(
	draft: OwnerSettingsDraft,
): OwnerSettingsDraftErrors {
	const errors = emptyDraftErrors();

	const capacity = parseInteger(draft.capacity);
	if (draft.capacity.trim() === "") errors.capacity = "required";
	else if (capacity === null) errors.capacity = "invalid";
	else if (capacity < 1 || capacity > INT32_MAX) errors.capacity = "range";

	const resetBuffer = parseInteger(draft.resetBufferMinutes);
	if (draft.resetBufferMinutes.trim() === "")
		errors.resetBufferMinutes = "required";
	else if (resetBuffer === null) errors.resetBufferMinutes = "invalid";
	else if (resetBuffer < 0 || resetBuffer > INT32_MAX) {
		errors.resetBufferMinutes = "range";
	}

	if (draft.businessDayBoundary.trim() === "") {
		errors.businessDayBoundary = "required";
	} else if (!isValidWallTime(draft.businessDayBoundary.trim())) {
		errors.businessDayBoundary = "invalid";
	}

	const quiet = parseInteger(draft.quietMaxPercent);
	const moderate = parseInteger(draft.moderateMaxPercent);
	const busy = parseInteger(draft.busyMaxPercent);

	if (draft.quietMaxPercent.trim() === "") errors.quietMaxPercent = "required";
	else if (quiet === null) errors.quietMaxPercent = "invalid";
	else if (quiet < 0 || quiet > 100) errors.quietMaxPercent = "range";

	if (draft.moderateMaxPercent.trim() === "")
		errors.moderateMaxPercent = "required";
	else if (moderate === null) errors.moderateMaxPercent = "invalid";
	else if (moderate < 0 || moderate > 100) errors.moderateMaxPercent = "range";
	else if (quiet !== null && moderate <= quiet)
		errors.moderateMaxPercent = "order";

	if (draft.busyMaxPercent.trim() === "") errors.busyMaxPercent = "required";
	else if (busy === null) errors.busyMaxPercent = "invalid";
	else if (busy < 0 || busy > 100) errors.busyMaxPercent = "range";
	else if (moderate !== null && busy <= moderate)
		errors.busyMaxPercent = "order";

	for (const day of WEEKDAYS) {
		const pair = draft.days[day];
		if (pair === null) continue;
		errors.days[day] = {
			open:
				pair.open.trim() === ""
					? "required"
					: isValidWallTime(pair.open.trim())
						? null
						: "invalid",
			close:
				pair.close.trim() === ""
					? "required"
					: isValidWallTime(pair.close.trim())
						? null
						: "invalid",
		};
	}

	return errors;
}

export function hasErrors(errors: OwnerSettingsDraftErrors): boolean {
	if (
		errors.capacity !== null ||
		errors.businessDayBoundary !== null ||
		errors.resetBufferMinutes !== null ||
		errors.quietMaxPercent !== null ||
		errors.moderateMaxPercent !== null ||
		errors.busyMaxPercent !== null
	) {
		return true;
	}
	return WEEKDAYS.some(
		(day) => errors.days[day].open !== null || errors.days[day].close !== null,
	);
}

export function isDirty(
	draft: OwnerSettingsDraft,
	baseline: OwnerSettingsDraft,
): boolean {
	if (
		draft.capacity !== baseline.capacity ||
		draft.quietMaxPercent !== baseline.quietMaxPercent ||
		draft.moderateMaxPercent !== baseline.moderateMaxPercent ||
		draft.busyMaxPercent !== baseline.busyMaxPercent ||
		draft.businessDayBoundary !== baseline.businessDayBoundary ||
		draft.resetBufferMinutes !== baseline.resetBufferMinutes
	) {
		return true;
	}
	return WEEKDAYS.some((day) => {
		const left = draft.days[day];
		const right = baseline.days[day];
		if (left === null || right === null) return left !== right;
		return left.open !== right.open || left.close !== right.close;
	});
}

/**
 * The complete validated editable snapshot for the update call, or `null`
 * while any field is invalid. The full snapshot is always submitted — never a
 * delta — because the server appends whole versions.
 */
export function buildEditable(
	draft: OwnerSettingsDraft,
): EditableOwnerSettings | null {
	const capacity = parseInteger(draft.capacity);
	const quiet = parseInteger(draft.quietMaxPercent);
	const moderate = parseInteger(draft.moderateMaxPercent);
	const busy = parseInteger(draft.busyMaxPercent);
	const resetBuffer = parseInteger(draft.resetBufferMinutes);
	const boundary = draft.businessDayBoundary.trim();

	if (
		capacity === null ||
		quiet === null ||
		moderate === null ||
		busy === null ||
		resetBuffer === null ||
		!isValidWallTime(boundary)
	) {
		return null;
	}

	const days: Record<Weekday, DailyHours | null> = { ...draft.days };
	for (const day of WEEKDAYS) {
		const pair = days[day];
		if (pair === null) continue;
		const open = pair.open.trim();
		const close = pair.close.trim();
		if (!isValidWallTime(open) || !isValidWallTime(close)) return null;
		days[day] = { open, close };
	}

	return {
		capacity,
		thresholds: {
			quietMaxPercent: quiet,
			moderateMaxPercent: moderate,
			busyMaxPercent: busy,
		},
		weeklySchedule: days,
		businessDayBoundary: boundary,
		resetBufferMinutes: resetBuffer,
	};
}

export { emptyPrior };
