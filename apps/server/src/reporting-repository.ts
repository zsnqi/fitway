import type {
	AnalyticsSettingsVersion,
	ObservedOccupancyMinute,
} from "@fitway/api/analytics/daily-analytics";
import {
	type CsvRangeInput,
	csvRangeInputSchema,
	type Heatmap,
	type ReportingDateRangeInput,
	type ReportingRange,
	reportingDateRangeInputSchema,
	type WeekComparison,
	type WeekComparisonReadInput,
	weekComparisonReadInputSchema,
} from "@fitway/api/analytics/reporting/contracts";
import {
	reportingCsvRows,
	streamReportingCsv,
} from "@fitway/api/analytics/reporting/csv";
import {
	buildHeatmap,
	buildReportingRange,
	buildWeekOverWeekComparison,
	enumerateBusinessDays,
	resolveWeekComparisonWindow,
} from "@fitway/api/analytics/reporting/reporting";
import type { db } from "@fitway/db";
import {
	occupancyMinutes,
	settingsVersions,
} from "@fitway/db/schema/application";
import { and, asc, gte, lte } from "drizzle-orm";
import type { PoolClient, QueryResultRow } from "pg";

type Database = typeof db;

type StoredSettingsRow = {
	version: number | string;
	effectiveFrom: Date | string;
	timeZone: string;
	businessDayBoundary: string;
	scheduleSunOpen: string | null;
	scheduleSunClose: string | null;
	scheduleMonOpen: string | null;
	scheduleMonClose: string | null;
	scheduleTueOpen: string | null;
	scheduleTueClose: string | null;
	scheduleWedOpen: string | null;
	scheduleWedClose: string | null;
	scheduleThuOpen: string | null;
	scheduleThuClose: string | null;
	scheduleFriOpen: string | null;
	scheduleFriClose: string | null;
	scheduleSatOpen: string | null;
	scheduleSatClose: string | null;
};

type StoredMinuteRow = {
	minuteStartUtc: Date | string;
	businessDay: string;
	count: number;
	entries: number;
	exits: number;
	band: string;
	capacitySnapshot: number;
	settingsVersion: number | string;
	source: string;
};

type RawSettingsRow = StoredSettingsRow & QueryResultRow;
type RawMinuteRow = StoredMinuteRow & QueryResultRow;
/**
 * Category-only CSV export diagnostics. The category is the entire payload: no
 * SQL, parameter, range, CSV content, connection, database, or credential value
 * is ever emitted.
 */
export type CsvDiagnosticCategory = "csv_abort" | "csv_statement_timeout";

const STATEMENT_TIMEOUT_SQLSTATE = "57014";

function isStatementTimeout(error: unknown): boolean {
	return (
		typeof error === "object" &&
		error !== null &&
		(error as { code?: unknown }).code === STATEMENT_TIMEOUT_SQLSTATE
	);
}

function normalizeDatabaseTime(value: string): string {
	return value.length === 5 ? value : value.slice(0, 8);
}

function scheduleHours(open: string | null, close: string | null) {
	if (open === null && close === null) return null;
	if (open === null || close === null) {
		throw new Error("Stored reporting schedule has an incomplete weekday pair");
	}
	return {
		open: normalizeDatabaseTime(open),
		close: normalizeDatabaseTime(close),
	};
}

function safeInteger(value: number | string, label: string): number {
	const parsed = typeof value === "number" ? value : Number(value);
	if (!Number.isSafeInteger(parsed)) {
		throw new RangeError(`${label} must be a safe integer`);
	}
	return parsed;
}

function mapSettings(row: StoredSettingsRow): AnalyticsSettingsVersion {
	return {
		version: safeInteger(row.version, "Settings version"),
		effectiveFrom:
			row.effectiveFrom instanceof Date
				? row.effectiveFrom
				: new Date(row.effectiveFrom),
		timeZone: row.timeZone,
		businessDayBoundary: normalizeDatabaseTime(row.businessDayBoundary),
		weeklySchedule: {
			sun: scheduleHours(row.scheduleSunOpen, row.scheduleSunClose),
			mon: scheduleHours(row.scheduleMonOpen, row.scheduleMonClose),
			tue: scheduleHours(row.scheduleTueOpen, row.scheduleTueClose),
			wed: scheduleHours(row.scheduleWedOpen, row.scheduleWedClose),
			thu: scheduleHours(row.scheduleThuOpen, row.scheduleThuClose),
			fri: scheduleHours(row.scheduleFriOpen, row.scheduleFriClose),
			sat: scheduleHours(row.scheduleSatOpen, row.scheduleSatClose),
		},
	};
}

function mapMinute(row: StoredMinuteRow): ObservedOccupancyMinute {
	return {
		minuteStartUtc:
			row.minuteStartUtc instanceof Date
				? row.minuteStartUtc
				: new Date(row.minuteStartUtc),
		businessDay: row.businessDay,
		count: row.count,
		entries: row.entries,
		exits: row.exits,
		band: row.band as ObservedOccupancyMinute["band"],
		capacitySnapshot: row.capacitySnapshot,
		settingsVersion: safeInteger(
			row.settingsVersion,
			"Minute settings version",
		),
		source: row.source as ObservedOccupancyMinute["source"],
	};
}

const settingsSelection = {
	version: settingsVersions.version,
	effectiveFrom: settingsVersions.effectiveFrom,
	timeZone: settingsVersions.timezone,
	businessDayBoundary: settingsVersions.businessDayBoundary,
	scheduleSunOpen: settingsVersions.scheduleSunOpen,
	scheduleSunClose: settingsVersions.scheduleSunClose,
	scheduleMonOpen: settingsVersions.scheduleMonOpen,
	scheduleMonClose: settingsVersions.scheduleMonClose,
	scheduleTueOpen: settingsVersions.scheduleTueOpen,
	scheduleTueClose: settingsVersions.scheduleTueClose,
	scheduleWedOpen: settingsVersions.scheduleWedOpen,
	scheduleWedClose: settingsVersions.scheduleWedClose,
	scheduleThuOpen: settingsVersions.scheduleThuOpen,
	scheduleThuClose: settingsVersions.scheduleThuClose,
	scheduleFriOpen: settingsVersions.scheduleFriOpen,
	scheduleFriClose: settingsVersions.scheduleFriClose,
	scheduleSatOpen: settingsVersions.scheduleSatOpen,
	scheduleSatClose: settingsVersions.scheduleSatClose,
};

const minuteSelection = {
	minuteStartUtc: occupancyMinutes.minuteStartUtc,
	businessDay: occupancyMinutes.businessDay,
	count: occupancyMinutes.count,
	entries: occupancyMinutes.entries,
	exits: occupancyMinutes.exits,
	band: occupancyMinutes.band,
	capacitySnapshot: occupancyMinutes.capacitySnapshot,
	settingsVersion: occupancyMinutes.settingsVersion,
	source: occupancyMinutes.source,
};

async function readSettings(
	database: Database,
): Promise<AnalyticsSettingsVersion[]> {
	const rows = await database
		.select(settingsSelection)
		.from(settingsVersions)
		.orderBy(
			asc(settingsVersions.effectiveFrom),
			asc(settingsVersions.version),
		);
	return rows.map(mapSettings);
}

async function readMinutes(
	database: Database,
	startBusinessDay: string,
	endBusinessDay: string,
): Promise<ObservedOccupancyMinute[]> {
	const rows = await database
		.select(minuteSelection)
		.from(occupancyMinutes)
		.where(
			and(
				gte(occupancyMinutes.businessDay, startBusinessDay),
				lte(occupancyMinutes.businessDay, endBusinessDay),
			),
		)
		.orderBy(
			asc(occupancyMinutes.businessDay),
			asc(occupancyMinutes.minuteStartUtc),
			asc(occupancyMinutes.deviceId),
		);
	return rows.map(mapMinute);
}

async function readRange(
	database: Database,
	input: ReportingDateRangeInput,
): Promise<ReportingRange> {
	const range = reportingDateRangeInputSchema.parse(input);
	const [resolvedSettings, observedMinutes] = await Promise.all([
		readSettings(database),
		readMinutes(database, range.startBusinessDay, range.endBusinessDay),
	]);
	return buildReportingRange({
		...range,
		settingsVersions: resolvedSettings,
		observedMinutes,
	});
}

export const DEFAULT_CSV_FETCH_BATCH_SIZE = 1_000;
export const DEFAULT_CSV_STATEMENT_TIMEOUT_MS = 30_000;
const TEST_CSV_STATEMENT_TIMEOUT_MS = 250;
const csvCursorName = "fitway_reporting_csv_cursor";

const cursorSettingsQuery = `SELECT
	version,
	effective_from AS "effectiveFrom",
	timezone AS "timeZone",
	business_day_boundary::text AS "businessDayBoundary",
	schedule_sun_open::text AS "scheduleSunOpen",
	schedule_sun_close::text AS "scheduleSunClose",
	schedule_mon_open::text AS "scheduleMonOpen",
	schedule_mon_close::text AS "scheduleMonClose",
	schedule_tue_open::text AS "scheduleTueOpen",
	schedule_tue_close::text AS "scheduleTueClose",
	schedule_wed_open::text AS "scheduleWedOpen",
	schedule_wed_close::text AS "scheduleWedClose",
	schedule_thu_open::text AS "scheduleThuOpen",
	schedule_thu_close::text AS "scheduleThuClose",
	schedule_fri_open::text AS "scheduleFriOpen",
	schedule_fri_close::text AS "scheduleFriClose",
	schedule_sat_open::text AS "scheduleSatOpen",
	schedule_sat_close::text AS "scheduleSatClose"
FROM settings_versions
ORDER BY effective_from, version`;

const declareCursorQuery = `DECLARE ${csvCursorName} NO SCROLL CURSOR FOR
SELECT
	minute_start_utc AS "minuteStartUtc",
	business_day::text AS "businessDay",
	count,
	entries,
	exits,
	band,
	capacity_snapshot AS "capacitySnapshot",
	settings_version AS "settingsVersion",
	source
FROM occupancy_minutes
WHERE business_day >= $1::date AND business_day <= $2::date
ORDER BY business_day, minute_start_utc, device_id`;

async function acquireCsvClient(
	database: Database,
	signal?: AbortSignal,
	reportAbort?: () => void,
): Promise<PoolClient> {
	if (signal?.aborted) {
		reportAbort?.();
		throw signal.reason;
	}
	const connectPromise = database.$client.connect();
	if (!signal) return connectPromise;

	let aborted = false;
	const settledConnect = connectPromise.then(
		(client) => {
			if (!aborted) return { kind: "client" as const, client };
			try {
				client.release(true);
			} catch {
				// The abort reason is primary and the late client cannot be reused.
			}
			return { kind: "aborted" as const };
		},
		(error: unknown) => {
			if (aborted) return { kind: "aborted" as const };
			throw error;
		},
	);
	let abortListener: (() => void) | undefined;
	const abortPromise = new Promise<never>((_resolve, reject) => {
		abortListener = () => {
			aborted = true;
			reportAbort?.();
			reject(signal.reason);
		};
		signal.addEventListener("abort", abortListener, { once: true });
		if (signal.aborted) abortListener();
	});

	try {
		const result = await Promise.race([settledConnect, abortPromise]);
		if (result.kind === "aborted") throw signal.reason;
		return result.client;
	} finally {
		if (abortListener) signal.removeEventListener("abort", abortListener);
	}
}

async function* cursorMinutes(
	client: PoolClient,
	batchSize: number,
): AsyncGenerator<ObservedOccupancyMinute> {
	while (true) {
		const result = await client.query<RawMinuteRow>(
			`FETCH FORWARD ${batchSize} FROM ${csvCursorName}`,
		);
		for (const row of result.rows) yield mapMinute(row);
		if (result.rows.length < batchSize) return;
	}
}

async function* csvRowsFromCursor(
	client: PoolClient,
	range: { startBusinessDay: string; endBusinessDay: string },
	settingsVersions: readonly AnalyticsSettingsVersion[],
	batchSize: number,
) {
	const iterator = cursorMinutes(client, batchSize)[Symbol.asyncIterator]();
	let current = await iterator.next();
	for (const businessDay of enumerateBusinessDays(
		range.startBusinessDay,
		range.endBusinessDay,
	)) {
		const observedMinutes: ObservedOccupancyMinute[] = [];
		while (!current.done && current.value.businessDay < businessDay) {
			throw new Error("Reporting cursor returned business days out of order");
		}
		while (!current.done && current.value.businessDay === businessDay) {
			observedMinutes.push(current.value);
			current = await iterator.next();
		}
		const reportingRange = buildReportingRange({
			startBusinessDay: businessDay,
			endBusinessDay: businessDay,
			settingsVersions,
			observedMinutes,
		});
		for (const row of reportingCsvRows(reportingRange)) yield row;
	}
	if (!current.done) {
		throw new Error(
			"Reporting cursor returned a row outside the requested range",
		);
	}
}

async function* streamCsvFromDatabase(
	database: Database,
	range: { startBusinessDay: string; endBusinessDay: string },
	batchSize: number,
	statementTimeoutMs: number,
	signal?: AbortSignal,
	onCsvDiagnostic?: (category: CsvDiagnosticCategory) => void,
): AsyncGenerator<string> {
	const reported = new Set<CsvDiagnosticCategory>();
	const report = (category: CsvDiagnosticCategory) => {
		if (reported.has(category)) return;
		reported.add(category);
		try {
			onCsvDiagnostic?.(category);
		} catch {
			// Diagnostics are advisory and never alter export control flow.
		}
	};
	const client = await acquireCsvClient(database, signal, () =>
		report("csv_abort"),
	);
	let transactionOpen = false;
	let cursorOpen = false;
	let released = false;
	let hasPrimary = false;
	let primaryError: unknown;
	let cleanupError: unknown;
	let abortReleaseError: unknown;
	const release = (destroy = false) => {
		if (released) return;
		released = true;
		if (destroy) client.release(true);
		else client.release();
	};
	const onAbort = () => {
		report("csv_abort");
		try {
			release(true);
		} catch (error) {
			abortReleaseError = error;
		}
	};
	/**
	 * Idempotent cleanup helper called by the generator so no `throw` or
	 * `return` ever occurs directly in `finally`. It never rethrows; the caller
	 * decides whether a cleanup failure may surface.
	 */
	const cleanup = async (): Promise<unknown> => {
		if (released) return abortReleaseError;
		let error: unknown;
		if (transactionOpen) {
			if (cursorOpen) {
				cursorOpen = false;
				try {
					await client.query(`CLOSE ${csvCursorName}`);
				} catch (closeError) {
					error = closeError;
				}
			}
			transactionOpen = false;
			try {
				await client.query("ROLLBACK");
			} catch (rollbackError) {
				error ??= rollbackError;
			}
		}
		try {
			release();
		} catch (releaseError) {
			error ??= releaseError;
		}
		return error;
	};
	signal?.addEventListener("abort", onAbort, { once: true });
	try {
		if (signal?.aborted) onAbort();
		signal?.throwIfAborted();
		await client.query(
			"BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY",
		);
		transactionOpen = true;
		await client.query({
			text: "SELECT set_config('statement_timeout', $1, true)",
			values: [`${statementTimeoutMs}`],
		});
		const settingsResult =
			await client.query<RawSettingsRow>(cursorSettingsQuery);
		const resolvedSettings = settingsResult.rows.map(mapSettings);
		await client.query({
			text: declareCursorQuery,
			values: [range.startBusinessDay, range.endBusinessDay],
		});
		cursorOpen = true;
		for await (const chunk of streamReportingCsv(
			csvRowsFromCursor(client, range, resolvedSettings, batchSize),
		)) {
			yield chunk;
		}
		await client.query(`CLOSE ${csvCursorName}`);
		cursorOpen = false;
		await client.query("COMMIT");
		transactionOpen = false;
	} catch (error) {
		hasPrimary = true;
		if (signal?.aborted) {
			// The exact abort reason outranks the socket, timeout, and cleanup
			// failures that destroying the connection necessarily produces.
			report("csv_abort");
			primaryError = signal.reason;
		} else {
			if (isStatementTimeout(error)) report("csv_statement_timeout");
			primaryError = error;
		}
	} finally {
		signal?.removeEventListener("abort", onAbort);
		cleanupError = await cleanup();
	}
	if (hasPrimary) throw primaryError;
	if (cleanupError !== undefined) throw cleanupError;
}

export type ReportingRepository = {
	readRange(input: ReportingDateRangeInput): Promise<ReportingRange>;
	readHeatmap(input: ReportingDateRangeInput): Promise<Heatmap>;
	readWeekOverWeek(input?: WeekComparisonReadInput): Promise<WeekComparison>;
	streamCsv(input: CsvRangeInput, signal?: AbortSignal): AsyncIterable<string>;
};

export type ReportingRepositoryOptions = {
	now?: () => Date;
	csvFetchBatchSize?: number;
	csvStatementTimeoutMs?: number;
	onCsvDiagnostic?: (category: CsvDiagnosticCategory) => void;
};

export function createReportingRepository(
	database: Database,
	options: ReportingRepositoryOptions = {},
): ReportingRepository {
	const now = options.now ?? (() => new Date());
	const csvFetchBatchSize =
		options.csvFetchBatchSize ?? DEFAULT_CSV_FETCH_BATCH_SIZE;
	const csvStatementTimeoutMs =
		options.csvStatementTimeoutMs ?? DEFAULT_CSV_STATEMENT_TIMEOUT_MS;
	if (
		!Number.isSafeInteger(csvFetchBatchSize) ||
		csvFetchBatchSize <= 0 ||
		csvFetchBatchSize > 10_000
	) {
		throw new RangeError("CSV fetch batch size must be between 1 and 10000");
	}
	if (
		csvStatementTimeoutMs !== TEST_CSV_STATEMENT_TIMEOUT_MS &&
		csvStatementTimeoutMs !== DEFAULT_CSV_STATEMENT_TIMEOUT_MS
	) {
		throw new RangeError("CSV statement timeout must be 250 or 30000 ms");
	}

	return {
		readRange: (input) => readRange(database, input),
		async readHeatmap(input) {
			return buildHeatmap(await readRange(database, input));
		},
		async readWeekOverWeek(input = {}) {
			const parsed = weekComparisonReadInputSchema.parse(input);
			const resolvedSettings = await readSettings(database);
			const window = resolveWeekComparisonWindow({
				at: parsed.at ?? now(),
				settingsVersions: resolvedSettings,
			});
			const observedMinutes = await readMinutes(
				database,
				window.priorWeekStartBusinessDay,
				window.lastCompleteBusinessDay,
			);
			const reportingRange = buildReportingRange({
				startBusinessDay: window.priorWeekStartBusinessDay,
				endBusinessDay: window.lastCompleteBusinessDay,
				settingsVersions: resolvedSettings,
				observedMinutes,
			});
			return buildWeekOverWeekComparison({
				reportingRange,
				lastCompleteBusinessDay: window.lastCompleteBusinessDay,
				minimumCoverage: parsed.minimumCoverage,
			});
		},
		streamCsv(input, signal) {
			const range = csvRangeInputSchema.parse(input);
			return streamCsvFromDatabase(
				database,
				range,
				csvFetchBatchSize,
				csvStatementTimeoutMs,
				signal,
				options.onCsvDiagnostic,
			);
		},
	};
}
