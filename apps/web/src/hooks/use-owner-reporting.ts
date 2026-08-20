import type {
	Heatmap,
	WeekComparison,
} from "@fitway/api/analytics/reporting/contracts";
import {
	CSV_MAX_RANGE_DAYS,
	heatmapOutputSchema,
	inclusiveBusinessDayCount,
	weekComparisonOutputSchema,
} from "@fitway/api/analytics/reporting/contracts";
import { REPORTING_QUERY_MAX_RANGE_DAYS } from "@fitway/api/analytics/reporting/query-range";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import { client } from "@/utils/orpc";

import { useOwnerDailyAnalytics } from "./use-owner-daily-analytics";

export {
	CSV_MAX_RANGE_DAYS,
	inclusiveBusinessDayCount,
	REPORTING_QUERY_MAX_RANGE_DAYS,
};

/**
 * The owner's range form state. Two inclusive gym business days, held as the raw
 * strings the two date inputs produce. Nothing in the component tree does date
 * arithmetic; this module is the only place that reads or moves a business day.
 */
export type ReportingRangeSelection = {
	startBusinessDay: string;
	endBusinessDay: string;
};

const BUSINESS_DAY = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

/**
 * The default reporting window: four occurrences of every weekday, ending on the
 * business day `/admin` already resolved. Four samples is what makes a weekday-by-hour
 * average mean anything, and 28 stays inside the 31-day leaf bound.
 */
export const REPORTING_DEFAULT_WINDOW_DAYS = 28;

/** The default export window. Deliberately short; the owner widens it deliberately. */
export const CSV_DEFAULT_WINDOW_DAYS = 7;

function isBusinessDay(value: string): boolean {
	if (!BUSINESS_DAY.test(value)) return false;
	const parsed = new Date(`${value}T00:00:00.000Z`);
	return (
		Number.isFinite(parsed.getTime()) &&
		parsed.toISOString().slice(0, 10) === value
	);
}

/**
 * Calendar-day arithmetic on the gym's own business day.
 *
 * A business day is a label the server assigned, not an instant, so it moves by whole
 * UTC days here and never by a device-local offset. The browser's timezone cannot shift
 * a window boundary.
 */
export function shiftBusinessDay(businessDay: string, amount: number): string {
	if (!isBusinessDay(businessDay)) {
		throw new Error("A business day must be an ISO calendar day");
	}
	return new Date(Date.parse(`${businessDay}T00:00:00.000Z`) + amount * DAY_MS)
		.toISOString()
		.slice(0, 10);
}

/** An inclusive window of `windowDays` ending on `anchorBusinessDay`. */
export function windowEndingOn(
	anchorBusinessDay: string,
	windowDays: number,
): ReportingRangeSelection {
	return {
		startBusinessDay: shiftBusinessDay(anchorBusinessDay, 1 - windowDays),
		endBusinessDay: anchorBusinessDay,
	};
}

/**
 * Why a selection cannot be sent, or `null` when it can.
 *
 * Each problem is a distinct message the owner can act on. An unusable range is never
 * silently coerced into a usable one: a window the owner did not choose would answer a
 * question the owner did not ask.
 */
export type RangeProblem = "incomplete" | "malformed" | "inverted" | "too_long";

export function rangeProblem(
	selection: ReportingRangeSelection,
	maximumDays: number,
): RangeProblem | null {
	if (!selection.startBusinessDay || !selection.endBusinessDay) {
		return "incomplete";
	}
	if (
		!isBusinessDay(selection.startBusinessDay) ||
		!isBusinessDay(selection.endBusinessDay)
	) {
		return "malformed";
	}
	if (selection.startBusinessDay > selection.endBusinessDay) return "inverted";
	if (
		inclusiveBusinessDayCount(
			selection.startBusinessDay,
			selection.endBusinessDay,
		) > maximumDays
	) {
		return "too_long";
	}
	return null;
}

export type OwnerReportingQuery<T> = {
	status: "pending" | "error" | "success";
	data: T | null;
	retry: () => void;
};

export type OwnerReportingResult = {
	/** `false` means `/admin` has not yet resolved the shared query this reads. */
	available: boolean;
	timeZone: string | null;
	/** The gym business day `/admin` already resolved; the anchor of every default. */
	anchorBusinessDay: string | null;
	/**
	 * The window actually in force: the caller's selection, or the default resolved from
	 * the anchor once one exists. It is `null` only while the section has nothing to
	 * show anyway, which is what lets the form hold no derived state of its own.
	 */
	range: ReportingRangeSelection | null;
	heatmap: OwnerReportingQuery<Heatmap>;
	comparison: OwnerReportingQuery<WeekComparison>;
};

/**
 * Owner weekday-by-hour occupancy and week-over-week comparison.
 *
 * ## No second call to a shared procedure
 *
 * The configured gym timezone and today's business day are two facts `/admin` has
 * already fetched: `useOwnerDailyAnalytics` resolves both alongside the day's curve.
 * This hook observes that same query rather than asking for either again, so mounting
 * the reporting surface adds exactly two requests — `admin.analytics.heatmap` and
 * `admin.analytics.weekOverWeek` — and leaves the request behaviour of the Phase 9
 * surface exactly as it was. Fetching the timezone twice is what cost a prior slice a
 * repair; there is no reason to repeat it.
 *
 * ## Why the range leaf is not read here
 *
 * `admin.analytics.range` answers with a complete per-minute timeline for every day in
 * the window. Over the 28-day default that is more than forty thousand minute objects,
 * several megabytes on the wire, for a surface whose visible content is 168 aggregate
 * cells. The heatmap leaf performs that aggregation server-side and answers with the
 * 168 cells, and the export streams the per-minute rows for anyone who wants them. So
 * the owner surface reads the aggregate and the export streams the detail; neither ships
 * a per-minute payload into the page.
 *
 * ## Validation at the boundary
 *
 * Both payloads are parsed against the frozen transport schemas, so a malformed response
 * surfaces as an error rather than rendering as a plausible-looking occupancy figure. A
 * wrong number on this surface is worse than no number.
 */
export function useOwnerReporting(
	selection: ReportingRangeSelection | null,
): OwnerReportingResult {
	const analytics = useOwnerDailyAnalytics();
	const timeZone = analytics.data?.timeContext.current.timeZone ?? null;
	const anchorBusinessDay = analytics.data?.daily.businessDay ?? null;
	const available = timeZone !== null && anchorBusinessDay !== null;
	// The default window is resolved here rather than in the section, so the form holds
	// no state derived from a value that only arrives later and never has to correct
	// itself mid-render. `null` means the anchor has not arrived yet.
	const range = anchorBusinessDay
		? (selection ??
			windowEndingOn(anchorBusinessDay, REPORTING_DEFAULT_WINDOW_DAYS))
		: null;
	// A selection the leaf would reject is never sent. The form states the problem
	// beside the field instead, and the last usable answer stays on screen.
	const sendable =
		available &&
		range !== null &&
		rangeProblem(range, REPORTING_QUERY_MAX_RANGE_DAYS) === null;

	const heatmap = useQuery({
		queryKey: [
			"owner",
			"reporting",
			"heatmap",
			range?.startBusinessDay ?? "",
			range?.endBusinessDay ?? "",
		],
		enabled: sendable,
		queryFn: async (): Promise<Heatmap> =>
			heatmapOutputSchema.parse(
				await client.admin.analytics.heatmap({
					startBusinessDay: range?.startBusinessDay ?? "",
					endBusinessDay: range?.endBusinessDay ?? "",
				}),
			),
		retry: false,
		refetchOnWindowFocus: false,
	});

	const comparison = useQuery({
		queryKey: ["owner", "reporting", "weekOverWeek"],
		enabled: available,
		queryFn: async (): Promise<WeekComparison> =>
			weekComparisonOutputSchema.parse(
				await client.admin.analytics.weekOverWeek(),
			),
		retry: false,
		refetchOnWindowFocus: false,
	});

	return {
		available,
		timeZone,
		anchorBusinessDay,
		range,
		heatmap: {
			status: heatmap.isError
				? "error"
				: heatmap.isSuccess
					? "success"
					: "pending",
			data: heatmap.data ?? null,
			retry: () => void heatmap.refetch(),
		},
		comparison: {
			status: comparison.isError
				? "error"
				: comparison.isSuccess
					? "success"
					: "pending",
			data: comparison.data ?? null,
			retry: () => void comparison.refetch(),
		},
	};
}

/**
 * The state of one CSV export.
 *
 * `aborted` carries no file on purpose. A cancelled stream is a truncated CSV, and a
 * truncated export handed over as if it were the requested range would be a quietly
 * wrong answer — the one failure this product does not permit. The owner is told the
 * export was stopped and nothing was kept.
 */
export type CsvExportState =
	| { status: "idle" }
	| { status: "exporting"; rows: number }
	| { status: "ready"; href: string; fileName: string; rows: number }
	| { status: "aborted"; rows: number }
	| { status: "error"; reason: "range" | "transport" };

export type OwnerCsvExport = {
	state: CsvExportState;
	/** Runs an export for `selection`, replacing any prepared file. */
	start: (selection: ReportingRangeSelection) => void;
	/** Cancels a running export. The transport stops streaming; nothing is kept. */
	abort: () => void;
	/** Returns to `idle` and releases a prepared file. */
	reset: () => void;
};

export function csvFileName(selection: ReportingRangeSelection): string {
	return `fitway-occupancy-${selection.startBusinessDay}-to-${selection.endBusinessDay}.csv`;
}

/** Rows completed so far. The transport terminates every record with CRLF. */
function countRows(chunk: string): number {
	let rows = 0;
	let index = chunk.indexOf("\r\n");
	while (index >= 0) {
		rows += 1;
		index = chunk.indexOf("\r\n", index + 2);
	}
	return rows;
}

/**
 * Owner CSV export over the accepted streaming transport.
 *
 * The transport is an oRPC event iterator whose cancellation semantics were verified
 * independently: aborting the signal closes the source iterator and destroys the export
 * backend. A year of per-minute history is a slow export, so the owner is given the
 * abort control that transport already supports rather than a progress bar and no way
 * out.
 *
 * Chunks are held as an array and joined once by `Blob`, never concatenated into a
 * growing string, so a long export does not degrade into quadratic copying. The BOM the
 * transport emits is left exactly where it is; nothing here re-encodes the payload.
 */
export function useOwnerCsvExport(): OwnerCsvExport {
	const [state, setState] = useState<CsvExportState>({ status: "idle" });
	const controller = useRef<AbortController | null>(null);
	const objectUrl = useRef<string | null>(null);
	const mounted = useRef(true);

	const releasePreparedFile = useCallback(() => {
		if (objectUrl.current) {
			URL.revokeObjectURL(objectUrl.current);
			objectUrl.current = null;
		}
	}, []);

	useEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
			controller.current?.abort();
			if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
		};
	}, []);

	/**
	 * The owner's decision takes effect the moment it is made.
	 *
	 * The state moves to `aborted` here rather than when the transport happens to
	 * unwind, so pressing the control is answered immediately even on a stream that is
	 * blocked mid-chunk. Clearing `controller.current` is what makes the running task
	 * stand down: it compares its own controller against this ref before touching state,
	 * so a late unwind cannot overwrite the answer the owner already has.
	 */
	const abort = useCallback(() => {
		if (!controller.current) return;
		controller.current.abort();
		controller.current = null;
		setState((current) =>
			current.status === "exporting"
				? { status: "aborted", rows: current.rows }
				: current,
		);
	}, []);

	const reset = useCallback(() => {
		abort();
		releasePreparedFile();
		setState({ status: "idle" });
	}, [abort, releasePreparedFile]);

	const start = useCallback(
		(selection: ReportingRangeSelection) => {
			if (rangeProblem(selection, CSV_MAX_RANGE_DAYS) !== null) {
				setState({ status: "error", reason: "range" });
				return;
			}
			controller.current?.abort();
			releasePreparedFile();
			const active = new AbortController();
			controller.current = active;
			setState({ status: "exporting", rows: 0 });

			void (async () => {
				const chunks: string[] = [];
				let rows = 0;
				/** True while this task is still the export the owner is waiting on. */
				const current = () => mounted.current && controller.current === active;
				try {
					const stream = await client.admin.analytics.csv(
						{
							startBusinessDay: selection.startBusinessDay,
							endBusinessDay: selection.endBusinessDay,
						},
						{ signal: active.signal },
					);
					for await (const chunk of stream) {
						// Breaking here closes the source iterator, which is the transport's
						// own cancellation path.
						if (!current()) break;
						chunks.push(chunk);
						rows += countRows(chunk);
						setState({ status: "exporting", rows });
					}
				} catch (error) {
					// An abort was already answered by `abort`; a superseded task says
					// nothing at all. Only a genuine transport failure speaks here.
					if (!current()) return;
					controller.current = null;
					setState(
						(error as Error | undefined)?.name === "AbortError"
							? { status: "aborted", rows }
							: { status: "error", reason: "transport" },
					);
					return;
				}
				if (!current()) return;
				controller.current = null;
				const href = URL.createObjectURL(
					new Blob(chunks, { type: "text/csv;charset=utf-8" }),
				);
				objectUrl.current = href;
				setState({
					status: "ready",
					href,
					fileName: csvFileName(selection),
					// The header line is not a row of history.
					rows: Math.max(0, rows - 1),
				});
			})();
		},
		[releasePreparedFile],
	);

	return { state, start, abort, reset };
}
