const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const BOUNDARY = /^(\d{2}):(\d{2})(?::(\d{2}))?$/;

export type LocalCivilDate = { year: number; month: number; day: number };

const localFormatters = new Map<string, Intl.DateTimeFormat>();

function localParts(instant: Date, timezone: string) {
	let formatter = localFormatters.get(timezone);
	if (!formatter) {
		formatter = new Intl.DateTimeFormat("en-CA-u-nu-latn", {
			timeZone: timezone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hourCycle: "h23",
		});
		if (localFormatters.size >= 64) localFormatters.clear();
		localFormatters.set(timezone, formatter);
	}
	const parts = Object.fromEntries(
		formatter
			.formatToParts(instant)
			.filter((part) => part.type !== "literal")
			.map((part) => [part.type, part.value]),
	);
	return {
		date: `${parts.year}-${parts.month}-${parts.day}`,
		seconds:
			Number(parts.hour) * 3600 +
			Number(parts.minute) * 60 +
			Number(parts.second),
	};
}

function previousIsoDate(value: string): string {
	if (!ISO_DATE.test(value)) throw new RangeError("Invalid local date");
	const [year, month, day] = value.split("-").map(Number);
	const date = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1));
	date.setUTCDate(date.getUTCDate() - 1);
	return date.toISOString().slice(0, 10);
}

function boundarySeconds(boundary: string): number {
	const match = BOUNDARY.exec(boundary);
	if (!match) throw new RangeError("Boundary must be HH:mm or HH:mm:ss");
	const hours = Number(match[1]);
	const minutes = Number(match[2]);
	const seconds = Number(match[3] ?? 0);
	if (hours > 23 || minutes > 59 || seconds > 59) {
		throw new RangeError("Invalid business-day boundary");
	}
	return hours * 3600 + minutes * 60 + seconds;
}

function isoDate(value: LocalCivilDate): string {
	const date = new Date(0);
	date.setUTCFullYear(value.year, value.month - 1, value.day);
	date.setUTCHours(0, 0, 0, 0);
	const result = `${String(value.year).padStart(4, "0")}-${String(value.month).padStart(2, "0")}-${String(value.day).padStart(2, "0")}`;
	if (date.toISOString().slice(0, 10) !== result) {
		throw new RangeError("Invalid local date");
	}
	return result;
}

/** Attributes an exclusive local-wall close without resolving it to an instant. */
export function businessDayForExclusiveLocalClose(
	date: LocalCivilDate,
	closeMilliseconds: number,
	boundary: string,
): string {
	if (
		!Number.isSafeInteger(closeMilliseconds) ||
		closeMilliseconds < 0 ||
		closeMilliseconds >= 24 * 60 * 60 * 1_000
	) {
		throw new RangeError("Invalid local close time");
	}
	const localDate = isoDate(date);
	const boundaryMilliseconds = boundarySeconds(boundary) * 1_000;
	return closeMilliseconds <= boundaryMilliseconds
		? previousIsoDate(localDate)
		: localDate;
}

export function businessDayFor(
	utcInstant: Date,
	timezone: string,
	boundary: string,
): string {
	if (Number.isNaN(utcInstant.getTime()))
		throw new RangeError("Invalid UTC instant");
	const configuredBoundarySeconds = boundarySeconds(boundary);
	const local = localParts(utcInstant, timezone);
	return local.seconds < configuredBoundarySeconds
		? previousIsoDate(local.date)
		: local.date;
}
