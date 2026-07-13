const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const BOUNDARY = /^(\d{2}):(\d{2})(?::(\d{2}))?$/;

function localParts(instant: Date, timezone: string) {
	const formatter = new Intl.DateTimeFormat("en-CA-u-nu-latn", {
		timeZone: timezone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hourCycle: "h23",
	});
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

export function businessDayFor(
	utcInstant: Date,
	timezone: string,
	boundary: string,
): string {
	if (Number.isNaN(utcInstant.getTime()))
		throw new RangeError("Invalid UTC instant");
	const match = BOUNDARY.exec(boundary);
	if (!match) throw new RangeError("Boundary must be HH:mm or HH:mm:ss");
	const hours = Number(match[1]);
	const minutes = Number(match[2]);
	const seconds = Number(match[3] ?? 0);
	if (hours > 23 || minutes > 59 || seconds > 59) {
		throw new RangeError("Invalid business-day boundary");
	}
	const local = localParts(utcInstant, timezone);
	const boundarySeconds = hours * 3600 + minutes * 60 + seconds;
	return local.seconds < boundarySeconds
		? previousIsoDate(local.date)
		: local.date;
}
