import {
	REPORTING_CSV_COLUMNS,
	type ReportingCsvRow,
	type ReportingRange,
} from "./contracts";

const byteOrderMark = "\uFEFF";
const recordSeparator = "\r\n";
const spreadsheetFormulaPrefix = /^\s*[=+\-@]/;

export function encodeCsvCell(value: string | number | null): string {
	if (value === null) return "";
	let rendered = String(value);
	if (typeof value === "string" && spreadsheetFormulaPrefix.test(rendered)) {
		rendered = `'${rendered}`;
	}
	return /[",\r\n]/.test(rendered)
		? `"${rendered.replaceAll('"', '""')}"`
		: rendered;
}

function encodeRow(row: ReportingCsvRow): string {
	return REPORTING_CSV_COLUMNS.map((column) => encodeCsvCell(row[column])).join(
		",",
	);
}

export function* reportingCsvRows(
	reportingRange: ReportingRange,
): Generator<ReportingCsvRow> {
	for (const day of reportingRange.days) {
		for (const minute of day.timeline) {
			if (minute.state === "value") {
				yield {
					business_day: minute.businessDay,
					minute_start_utc: minute.minuteStartUtc,
					minute_start_local: minute.minuteStartLocal,
					time_zone: minute.timeZone,
					state: minute.state,
					count: minute.count,
					entries: minute.entries,
					exits: minute.exits,
					band: minute.band,
					capacity_snapshot: minute.capacitySnapshot,
					settings_version: minute.settingsVersion,
					source: minute.source,
				};
				continue;
			}
			yield {
				business_day: minute.businessDay,
				minute_start_utc: minute.minuteStartUtc,
				minute_start_local: minute.minuteStartLocal,
				time_zone: minute.timeZone,
				state: minute.state,
				count: null,
				entries: null,
				exits: null,
				band: null,
				capacity_snapshot: null,
				settings_version: null,
				source: null,
			};
		}
	}
}

export function encodeReportingCsv(rows: Iterable<ReportingCsvRow>): string {
	let result = `${byteOrderMark}${REPORTING_CSV_COLUMNS.join(",")}${recordSeparator}`;
	for (const row of rows) result += `${encodeRow(row)}${recordSeparator}`;
	return result;
}

export async function* streamReportingCsv(
	rows: AsyncIterable<ReportingCsvRow>,
): AsyncGenerator<string> {
	yield `${byteOrderMark}${REPORTING_CSV_COLUMNS.join(",")}${recordSeparator}`;
	for await (const row of rows) yield `${encodeRow(row)}${recordSeparator}`;
}
