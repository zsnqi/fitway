export const WEEKDAYS = [
	"sun",
	"mon",
	"tue",
	"wed",
	"thu",
	"fri",
	"sat",
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

export type DailyHours = {
	open: string;
	close: string;
};

export type WeeklySchedule = Readonly<Record<Weekday, DailyHours | null>>;

export type ScheduleSettings = {
	timeZone: string;
	weeklySchedule: WeeklySchedule;
};

type CivilDate = { year: number; month: number; day: number };
type WallTime = {
	hour: number;
	minute: number;
	second: number;
	millisecond: number;
	totalMilliseconds: number;
};
type LocalParts = CivilDate & Omit<WallTime, "totalMilliseconds">;

const TIME = /^(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,6}))?)?$/;
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
	let formatter = formatters.get(timeZone);
	if (!formatter) {
		formatter = new Intl.DateTimeFormat("en-CA-u-ca-gregory-nu-latn", {
			timeZone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			fractionalSecondDigits: 3,
			hourCycle: "h23",
		});
		formatters.set(timeZone, formatter);
	}
	return formatter;
}

function localParts(instant: Date, timeZone: string): LocalParts {
	const parts = Object.fromEntries(
		formatterFor(timeZone)
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

function utcMilliseconds(parts: LocalParts): number {
	const value = new Date(0);
	value.setUTCFullYear(parts.year, parts.month - 1, parts.day);
	value.setUTCHours(parts.hour, parts.minute, parts.second, parts.millisecond);
	return value.getTime();
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

function weekdayFor(value: CivilDate): Weekday {
	const date = new Date(0);
	date.setUTCFullYear(value.year, value.month - 1, value.day);
	date.setUTCHours(0, 0, 0, 0);
	return WEEKDAYS[date.getUTCDay()] ?? "sun";
}

function sameWallParts(left: LocalParts, right: LocalParts): boolean {
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

/**
 * Converts a gym-local wall time to an instant without using the host timezone.
 * DST policy: nonexistent wall times are rejected; repeated wall times use the
 * earlier of the two matching instants.
 */
function wallTimeToInstant(
	date: CivilDate,
	time: WallTime,
	timeZone: string,
): Date {
	const requested: LocalParts = { ...date, ...time };
	const naive = utcMilliseconds(requested);
	const offsets = new Set<number>();
	for (let delta = -48; delta <= 48; delta += 6) {
		const sampled = naive + delta * 60 * 60 * 1_000;
		offsets.add(
			utcMilliseconds(localParts(new Date(sampled), timeZone)) - sampled,
		);
	}
	const matches = [...offsets]
		.map((offset) => naive - offset)
		.filter((candidate) =>
			sameWallParts(localParts(new Date(candidate), timeZone), requested),
		)
		.sort((left, right) => left - right);
	const instant = matches[0];
	if (instant === undefined) {
		throw new RangeError(
			"Schedule wall time does not exist in the configured zone",
		);
	}
	return new Date(instant);
}

function sessionFor(
	settings: ScheduleSettings,
	anchor: CivilDate,
): { start: Date; end: Date } | null {
	const hours = settings.weeklySchedule[weekdayFor(anchor)];
	if (!hours) return null;
	const open = parseTime(hours.open);
	const close = parseTime(hours.close);
	return {
		start: wallTimeToInstant(anchor, open, settings.timeZone),
		end: wallTimeToInstant(
			close.totalMilliseconds <= open.totalMilliseconds
				? addDays(anchor, 1)
				: anchor,
			close,
			settings.timeZone,
		),
	};
}

export function assertScheduleSettings(
	settings: ScheduleSettings,
): asserts settings is ScheduleSettings {
	if (!settings || typeof settings.timeZone !== "string") {
		throw new TypeError("Schedule settings are required");
	}
	formatterFor(settings.timeZone);
	if (
		!settings.weeklySchedule ||
		typeof settings.weeklySchedule !== "object" ||
		Object.keys(settings.weeklySchedule).length !== WEEKDAYS.length
	) {
		throw new TypeError("Weekly schedule must contain exactly seven weekdays");
	}
	for (const day of WEEKDAYS) {
		const hours = settings.weeklySchedule[day];
		if (hours === null) continue;
		if (
			!hours ||
			typeof hours !== "object" ||
			Object.keys(hours).length !== 2 ||
			typeof hours.open !== "string" ||
			typeof hours.close !== "string"
		) {
			throw new TypeError(`Invalid schedule for ${day}`);
		}
		parseTime(hours.open);
		parseTime(hours.close);
	}
}

export function evaluateSchedule(
	settings: ScheduleSettings,
	now: Date,
): { open: true } | { open: false; nextOpenAt: Date | null } {
	assertScheduleSettings(settings);
	if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
		throw new RangeError("A valid evaluation instant is required");
	}
	const local = localParts(now, settings.timeZone);
	const today = { year: local.year, month: local.month, day: local.day };
	for (const anchor of [addDays(today, -1), today]) {
		const session = sessionFor(settings, anchor);
		if (
			session &&
			now.getTime() >= session.start.getTime() &&
			now.getTime() < session.end.getTime()
		) {
			return { open: true };
		}
	}

	const openings: Date[] = [];
	for (let days = 0; days <= 7; days += 1) {
		const date = addDays(today, days);
		const hours = settings.weeklySchedule[weekdayFor(date)];
		if (!hours) continue;
		const candidate = wallTimeToInstant(
			date,
			parseTime(hours.open),
			settings.timeZone,
		);
		if (candidate.getTime() > now.getTime()) openings.push(candidate);
	}
	openings.sort((left, right) => left.getTime() - right.getTime());
	return { open: false, nextOpenAt: openings[0] ?? null };
}
