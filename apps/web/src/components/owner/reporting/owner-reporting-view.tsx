import type {
	Heatmap,
	WeekComparison,
} from "@fitway/api/analytics/reporting/contracts";
import { WEEKDAYS } from "@fitway/api/occupancy/schedule";
import { Button } from "@fitway/ui/components/button";
import {
	AlertTriangle,
	ArrowDown,
	ArrowUp,
	CircleCheck,
	HelpCircle,
	Minus,
	RefreshCw,
} from "lucide-react";
import { type KeyboardEvent, useId, useMemo, useRef, useState } from "react";

import type { Locale } from "@/i18n/catalog";
import { formatDate } from "@/i18n/format";
import { localeConfig } from "@/i18n/locale";
import { useI18n } from "@/i18n/provider";

import { OwnerScrollRegion } from "../owner-scroll-region";
import { OwnerStatePanel } from "../owner-state-panel";
import type { OwnerReportingMessages } from "./messages";
import {
	useOwnerReportingMessages,
	useOwnerReportingWeekdays,
} from "./use-owner-reporting-messages";

import "./owner-reporting.css";

type HeatmapCell = Heatmap["cells"][number];
type WeekMetrics = WeekComparison["currentWeek"];
type Weekday = (typeof WEEKDAYS)[number];
type HeatmapPosition = { weekday: Weekday; localHour: number };

const HOURS = Array.from({ length: 24 }, (_unused, hour) => hour);

const numberFormatters = new Map<Locale, Intl.NumberFormat>();
const averageFormatters = new Map<Locale, Intl.NumberFormat>();
const percentFormatters = new Map<string, Intl.NumberFormat>();
const hourLabels = new Map<
	Locale,
	{ headers: readonly string[]; spans: readonly string[] }
>();

function numberFormatter(locale: Locale): Intl.NumberFormat {
	const current = numberFormatters.get(locale);
	if (current) return current;
	const created = new Intl.NumberFormat(localeConfig[locale].intl);
	numberFormatters.set(locale, created);
	return created;
}

function formatReportingNumber(value: number, locale: Locale): string {
	return numberFormatter(locale).format(value);
}

function averageFormatter(locale: Locale): Intl.NumberFormat {
	const current = averageFormatters.get(locale);
	if (current) return current;
	const created = new Intl.NumberFormat(localeConfig[locale].intl, {
		minimumFractionDigits: 0,
		maximumFractionDigits: 1,
	});
	averageFormatters.set(locale, created);
	return created;
}

function percentFormatter(
	locale: Locale,
	minimumFractionDigits: number,
	maximumFractionDigits: number,
): Intl.NumberFormat {
	const key = `${locale}-${minimumFractionDigits}-${maximumFractionDigits}`;
	const current = percentFormatters.get(key);
	if (current) return current;
	const created = new Intl.NumberFormat(localeConfig[locale].intl, {
		style: "percent",
		minimumFractionDigits,
		maximumFractionDigits,
	});
	percentFormatters.set(key, created);
	return created;
}

function labelsForHours(locale: Locale) {
	const current = hourLabels.get(locale);
	if (current) return current;
	const headers = HOURS.map((hour) =>
		formatReportingNumber(hour, locale).padStart(2, "0"),
	);
	const created = {
		headers,
		spans: headers.map((hour) => `${hour}:00-${hour}:59`),
	};
	hourLabels.set(locale, created);
	return created;
}

/**
 * The clock span a heatmap cell covers.
 *
 * A plain hyphen, never an en dash: an en dash between two numbers is a neutral
 * character, so an Arabic run renders `09:00-09:59` as `09:59-09:00` and the span reads
 * backwards. The `<bdi dir="ltr">` around it keeps the clock itself unmirrored.
 */
function hourSpan(localHour: number, locale: Locale): string {
	return labelsForHours(locale).spans[localHour] ?? "";
}

/** A ratio as a percentage with Western digits; `Intl` places the sign for Arabic. */
export function formatPercent(
	ratio: number,
	locale: Locale,
	fractionDigits = 1,
): string {
	return percentFormatter(
		locale,
		ratio > 0 && ratio < 1 ? fractionDigits : 0,
		fractionDigits,
	).format(ratio);
}

/** An occupancy average, kept to one decimal: it is a mean, not a headcount. */
export function formatAverage(value: number, locale: Locale): string {
	return averageFormatter(locale).format(value);
}

/** A business day as a short, locale-correct calendar day. */
export function businessDayLabel(businessDay: string, locale: Locale): string {
	return formatDate(new Date(`${businessDay}T12:00:00.000Z`), locale, {
		month: "short",
		day: "numeric",
	});
}

/** An inclusive window. Hyphen, not en dash, for the same reason as `hourSpan`. */
export function windowLabel(
	startBusinessDay: string,
	endBusinessDay: string,
	locale: Locale,
): string {
	return `${businessDayLabel(startBusinessDay, locale)} - ${formatDate(
		new Date(`${endBusinessDay}T12:00:00.000Z`),
		locale,
		{ month: "short", day: "numeric", year: "numeric" },
	)}`;
}

/**
 * Which of the five cell appearances a cell earns.
 *
 * The four occupancy steps are a calibrated single-hue red ramp (`DESIGN_GUIDE.md` §12)
 * scaled to the busiest cell in the window, so a quiet gym still reads as a shape rather
 * than as one flat colour. `zero`, `closed`, and `missing` are not steps on that ramp:
 * an open and empty hour, an hour the gym never opened, and an hour nobody recorded are
 * three different facts, and each keeps its own treatment end to end.
 */
export function cellLevel(
	cell: HeatmapCell,
	busiestAverage: number,
): "zero" | "closed" | "missing" | "1" | "2" | "3" | "4" {
	if (cell.state === "closed") return "closed";
	if (cell.state === "missing" || cell.averageOccupancy === null) {
		return "missing";
	}
	if (cell.averageOccupancy === 0) return "zero";
	if (busiestAverage <= 0) return "1";
	const step = Math.ceil((cell.averageOccupancy / busiestAverage) * 4);
	return String(Math.min(4, Math.max(1, step))) as "1" | "2" | "3" | "4";
}

export function busiestAverage(heatmap: Heatmap): number {
	return heatmap.cells.reduce(
		(highest, cell) => Math.max(highest, cell.averageOccupancy ?? 0),
		0,
	);
}

function cellStateLabel(
	cell: HeatmapCell,
	messages: OwnerReportingMessages,
): string {
	if (cell.state === "closed") return messages.stateClosed;
	if (cell.state === "missing" || cell.averageOccupancy === null) {
		return messages.stateMissing;
	}
	return cell.averageOccupancy === 0 ? messages.stateZero : messages.stateValue;
}

function cellKey({ weekday, localHour }: HeatmapPosition): string {
	return `${weekday}-${localHour}`;
}

function movedPosition(
	current: HeatmapPosition,
	weekdayDelta: number,
	hourDelta: number,
): HeatmapPosition {
	const weekdayIndex = WEEKDAYS.indexOf(current.weekday);
	return {
		weekday:
			WEEKDAYS[
				Math.min(WEEKDAYS.length - 1, Math.max(0, weekdayIndex + weekdayDelta))
			] ?? current.weekday,
		localHour: Math.min(23, Math.max(0, current.localHour + hourDelta)),
	};
}

/**
 * The weekday-by-hour heatmap and the reading of whichever cell is selected.
 *
 * The grid carries one tab stop, not 168. Arrow keys move the selection inside it and
 * the arrows mirror by reading direction, so "next hour" is to the right in English and
 * to the left in Arabic — the same mirroring the accepted daily curve performs. Pointer,
 * keyboard, and touch all reach the identical reading (§12); hover is not a path to
 * anything the other two cannot get.
 */
export function OwnerReportingHeatmap({ heatmap }: { heatmap: Heatmap }) {
	const { locale } = useI18n();
	const messages = useOwnerReportingMessages();
	const weekdays = useOwnerReportingWeekdays();
	const ids = useId();
	const initialSelection: HeatmapPosition = {
		weekday: WEEKDAYS[0],
		localHour: 9,
	};
	const [selected, setSelected] = useState<HeatmapPosition>(initialSelection);
	const selectedRef = useRef<HeatmapPosition>(initialSelection);
	const cellRefs = useRef(new Map<string, HTMLButtonElement>());
	const derived = useMemo(() => {
		const index = new Map(
			heatmap.cells.map((cell) => [cellKey(cell), cell] as const),
		);
		const busiest = busiestAverage(heatmap);
		return {
			index,
			rows: WEEKDAYS.map((weekday) => ({
				weekday,
				label: weekdays.full[weekday],
				shortLabel: weekdays.short[weekday],
				cells: HOURS.map((hour) => {
					const cell = index.get(cellKey({ weekday, localHour: hour }));
					if (!cell) return null;
					const stateLabel = cellStateLabel(cell, messages);
					const reading =
						cell.state === "value" && cell.averageOccupancy !== null
							? `${messages.selectedAverage} ${formatAverage(cell.averageOccupancy, locale)}, ${messages.selectedSamples} ${formatReportingNumber(cell.sampleDayCount, locale)}`
							: stateLabel;
					return {
						cell,
						hour,
						key: cellKey(cell),
						level: cellLevel(cell, busiest),
						ariaLabel: `${weekdays.full[weekday]} ${hourSpan(hour, locale)}, ${stateLabel}. ${reading}`,
					};
				}),
			})),
		};
	}, [heatmap, locale, messages, weekdays.full, weekdays.short]);
	const active = derived.index.get(cellKey(selected)) ?? heatmap.cells[0];

	function select(next: HeatmapPosition, moveFocus = false) {
		selectedRef.current = next;
		setSelected(next);
		if (moveFocus) cellRefs.current.get(cellKey(next))?.focus();
	}

	function move(weekdayDelta: number, hourDelta: number) {
		select(movedPosition(selectedRef.current, weekdayDelta, hourDelta), true);
	}

	function handleKeyDown(event: KeyboardEvent<HTMLTableSectionElement>) {
		// The hour axis mirrors with the reading direction; the weekday axis does not.
		const forward = locale === "ar" ? -1 : 1;
		if (event.key === "ArrowRight") move(0, forward);
		else if (event.key === "ArrowLeft") move(0, -forward);
		else if (event.key === "ArrowDown") move(1, 0);
		else if (event.key === "ArrowUp") move(-1, 0);
		else if (event.key === "Home")
			select({ ...selectedRef.current, localHour: 0 }, true);
		else if (event.key === "End")
			select({ ...selectedRef.current, localHour: 23 }, true);
		else return;
		event.preventDefault();
	}

	if (!active) return null;

	return (
		<div className="owner-reporting-heatmap">
			<div className="owner-reporting-heatmap__heading">
				<div>
					<h2 id={`${ids}-title`}>{messages.heatmapTitle}</h2>
					<p>
						{messages.heatmapDescription} ·{" "}
						<bdi dir="auto">
							{windowLabel(
								heatmap.startBusinessDay,
								heatmap.endBusinessDay,
								locale,
							)}
						</bdi>
					</p>
				</div>
				<ul
					className="owner-reporting-legend"
					aria-label={messages.legendLabel}
				>
					<li data-level="1">{messages.legendQuiet}</li>
					<li data-level="4">{messages.legendBusy}</li>
					<li data-level="zero">{messages.legendZero}</li>
					<li data-level="closed">{messages.legendClosed}</li>
					<li data-level="missing">{messages.legendMissing}</li>
				</ul>
			</div>

			<section
				className="owner-reporting-grid-region"
				aria-label={messages.heatmapRegion}
			>
				<table
					className="owner-reporting-grid"
					data-owner-reporting-grid=""
					aria-describedby={`${ids}-hint`}
				>
					<caption>{messages.heatmapRegion}</caption>
					<thead>
						<tr>
							<th scope="col">{messages.weekdayAxis}</th>
							{labelsForHours(locale).headers.map((label, hour) => (
								<th key={hour} scope="col">
									<bdi dir="ltr">{label}</bdi>
								</th>
							))}
						</tr>
					</thead>
					{/*
					 * The key handler is delegated to the body rather than bound to each
					 * cell: the cells are the interactive elements, and one roving tab stop
					 * across 168 of them is the whole point of the arrangement.
					 */}
					<tbody onKeyDown={handleKeyDown}>
						{derived.rows.map((row) => (
							<tr key={row.weekday}>
								<th scope="row">
									<span className="owner-reporting-grid__full">
										{row.label}
									</span>
									<span
										className="owner-reporting-grid__short"
										aria-hidden="true"
									>
										{row.shortLabel}
									</span>
								</th>
								{row.cells.map((derivedCell, hour) => {
									if (!derivedCell) return <td key={hour} />;
									const { ariaLabel, cell, key, level } = derivedCell;
									const isActive =
										selected.weekday === row.weekday &&
										selected.localHour === hour;
									return (
										<td key={hour}>
											<button
												ref={(element) => {
													if (element) cellRefs.current.set(key, element);
													else cellRefs.current.delete(key);
												}}
												type="button"
												className="owner-reporting-cell"
												data-level={level}
												data-state={cell.state}
												data-active={isActive ? "" : undefined}
												tabIndex={isActive ? 0 : -1}
												aria-pressed={isActive}
												aria-label={ariaLabel}
												onClick={() =>
													select({ weekday: row.weekday, localHour: hour })
												}
												onFocus={() =>
													select({ weekday: row.weekday, localHour: hour })
												}
											/>
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
			</section>
			<p className="fw-sr-only" id={`${ids}-hint`}>
				{messages.heatmapHint}
			</p>

			<div
				className="owner-reporting-reading"
				data-owner-reporting-reading=""
				aria-live="polite"
			>
				<p className="owner-reporting-reading__where">
					<span>{messages.selectedTitle}</span>
					<strong>
						<bdi dir="auto">{weekdays.full[active.weekday]}</bdi>{" "}
						<bdi dir="ltr">{hourSpan(active.localHour, locale)}</bdi>
					</strong>
				</p>
				{active.state === "value" && active.averageOccupancy !== null ? (
					<dl className="owner-reporting-reading__figures">
						<div>
							<dt>{messages.selectedAverage}</dt>
							<dd>
								<bdi>{formatAverage(active.averageOccupancy, locale)}</bdi>
							</dd>
						</div>
						<div>
							<dt>{messages.selectedObserved}</dt>
							<dd>
								<bdi>
									{formatReportingNumber(active.observedOpenMinutes, locale)}
									{" / "}
									{formatReportingNumber(active.expectedOpenMinutes, locale)}
								</bdi>
							</dd>
						</div>
						<div>
							<dt>{messages.selectedSamples}</dt>
							<dd>
								<bdi>
									{formatReportingNumber(active.sampleDayCount, locale)}
								</bdi>
							</dd>
						</div>
					</dl>
				) : (
					<p className="owner-reporting-reading__absent">
						{active.state === "closed"
							? messages.selectedClosed
							: active.expectedOpenMinutes > 0
								? messages.selectedNoValue
								: messages.selectedMissing}
					</p>
				)}
			</div>
		</div>
	);
}

/**
 * The heatmap as words and figures.
 *
 * The colour ramp is a summary; this is the data (§12). Every one of the 168 cells is
 * listed with its own state, so an hour the gym was closed, an hour nobody recorded, and
 * an hour that was open and empty are three visibly different rows and never one.
 */
export function OwnerReportingTable({ heatmap }: { heatmap: Heatmap }) {
	const { locale } = useI18n();
	const messages = useOwnerReportingMessages();
	const weekdays = useOwnerReportingWeekdays();
	const rows = useMemo(
		() =>
			heatmap.cells.map((cell) => ({
				cell,
				key: cellKey(cell),
				weekday: weekdays.full[cell.weekday],
				hour: hourSpan(cell.localHour, locale),
				state: cellStateLabel(cell, messages),
				average:
					cell.averageOccupancy === null
						? null
						: formatAverage(cell.averageOccupancy, locale),
				observed: formatReportingNumber(cell.observedOpenMinutes, locale),
				expected: formatReportingNumber(cell.expectedOpenMinutes, locale),
				samples: formatReportingNumber(cell.sampleDayCount, locale),
			})),
		[heatmap, locale, messages, weekdays.full],
	);
	return (
		<div className="owner-reporting-table">
			<div className="owner-reporting-table__heading">
				<h2>{messages.tableSummary}</h2>
			</div>
			<OwnerScrollRegion
				className="owner-reporting-region owner-reporting-region--dense"
				ariaLabel={messages.tableRegion}
				hint={messages.scrollHint}
			>
				<table data-owner-reporting-table="">
					<thead>
						<tr>
							<th scope="col">{messages.columnWeekday}</th>
							<th scope="col">{messages.columnHour}</th>
							<th scope="col">{messages.columnState}</th>
							<th scope="col">{messages.columnAverage}</th>
							<th scope="col">{messages.columnObserved}</th>
							<th scope="col">{messages.columnExpected}</th>
							<th scope="col">{messages.columnSamples}</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => (
							<tr
								key={row.key}
								data-state={row.cell.state}
								data-zero={
									row.cell.state === "value" && row.cell.averageOccupancy === 0
										? ""
										: undefined
								}
							>
								<td>{row.weekday}</td>
								<td>
									<bdi dir="ltr">{row.hour}</bdi>
								</td>
								<td>{row.state}</td>
								<td>
									{row.average === null ? (
										<span className="owner-reporting__absent">{row.state}</span>
									) : (
										<bdi>{row.average}</bdi>
									)}
								</td>
								<td>
									<bdi>{row.observed}</bdi>
								</td>
								<td>
									<bdi>{row.expected}</bdi>
								</td>
								<td>
									<bdi>{row.samples}</bdi>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</OwnerScrollRegion>
		</div>
	);
}

function ChangeCell({
	change,
	format,
}: {
	change: { absolute: number; percent: number | null };
	format: (value: number, locale: Locale) => string;
}) {
	const { locale } = useI18n();
	const messages = useOwnerReportingMessages();
	const direction =
		change.absolute > 0 ? "up" : change.absolute < 0 ? "down" : "flat";
	const word =
		direction === "up"
			? messages.comparisonUp
			: direction === "down"
				? messages.comparisonDown
				: messages.comparisonFlat;
	// Vertical arrows, never a diagonal trend glyph: a diagonal mirrors under RTL and
	// would point the opposite way at the same number.
	const Glyph =
		direction === "up" ? ArrowUp : direction === "down" ? ArrowDown : Minus;
	return (
		<span className="owner-reporting-change" data-direction={direction}>
			<span className="fw-sr-only">
				{format(Math.abs(change.absolute), locale)} {word}
				{change.percent === null
					? ""
					: `, ${formatPercent(Math.abs(change.percent), locale)}`}
			</span>
			<Glyph aria-hidden="true" />
			{/*
			 * The contract's `percent` is a ratio, not a number of percent: `0.088` is
			 * the +8.8% the approved composition shows. `Intl` does the scaling, so
			 * nothing here multiplies by a hundred.
			 */}
			<bdi className="owner-reporting-change__percent" aria-hidden="true">
				{change.percent === null
					? format(Math.abs(change.absolute), locale)
					: formatPercent(Math.abs(change.percent), locale)}
			</bdi>
		</span>
	);
}

function weekHeading(week: WeekMetrics, locale: Locale) {
	const crossesYears =
		week.startBusinessDay.slice(0, 4) !== week.endBusinessDay.slice(0, 4);
	return {
		start: formatDate(
			new Date(`${week.startBusinessDay}T12:00:00.000Z`),
			locale,
			crossesYears
				? { month: "short", day: "numeric", year: "numeric" }
				: { month: "short", day: "numeric" },
		),
		end: formatDate(new Date(`${week.endBusinessDay}T12:00:00.000Z`), locale, {
			month: "short",
			day: "numeric",
			year: "numeric",
		}),
	};
}

/**
 * Week over week, including the state in which no direction may be stated.
 *
 * `insufficient_history` is not an empty screen: both weeks' own figures are shown as
 * they stand, and the typed reasons the domain returned are printed as sentences. What
 * is withheld is the comparison itself — an approximate direction drawn from a week the
 * domain refused to compare would be exactly the invented number this surface exists to
 * avoid.
 */
export function OwnerReportingComparison({
	comparison,
}: {
	comparison: WeekComparison;
}) {
	const { locale } = useI18n();
	const messages = useOwnerReportingMessages();
	const ids = useId();
	const comparable = comparison.state === "comparable";
	const { headings, rows } = useMemo(() => {
		const valueForAverage = (week: WeekMetrics) =>
			week.averageOccupancy === null
				? messages.comparisonNoAverage
				: formatAverage(week.averageOccupancy, locale);
		const valueForCoverage = (week: WeekMetrics) =>
			week.coverage === null
				? messages.comparisonNoAverage
				: `${formatPercent(week.coverage, locale)} (${formatReportingNumber(week.observedOpenMinutes, locale)} / ${formatReportingNumber(week.expectedOpenMinutes, locale)})`;
		return {
			headings: {
				current: weekHeading(comparison.currentWeek, locale),
				prior: weekHeading(comparison.priorWeek, locale),
			},
			rows: [
				{
					key: "average",
					label: messages.comparisonAverage,
					current: valueForAverage(comparison.currentWeek),
					prior: valueForAverage(comparison.priorWeek),
					change: comparable ? comparison.changes.averageOccupancy : null,
					format: formatAverage,
				},
				{
					key: "crossings",
					label: messages.comparisonCrossings,
					current: formatReportingNumber(
						comparison.currentWeek.estimatedEntranceCrossings,
						locale,
					),
					prior: formatReportingNumber(
						comparison.priorWeek.estimatedEntranceCrossings,
						locale,
					),
					change: comparable
						? comparison.changes.estimatedEntranceCrossings
						: null,
					format: formatReportingNumber,
				},
				{
					key: "coverage",
					label: messages.comparisonCoverage,
					current: valueForCoverage(comparison.currentWeek),
					prior: valueForCoverage(comparison.priorWeek),
					change: null,
					format: formatReportingNumber,
				},
			],
		};
	}, [comparable, comparison, locale, messages]);
	// Above the mobile semantic-row breakpoint this table can overflow its
	// half-width board. Keep that real scroll container keyboard reachable.
	const keyboardScrollable = { tabIndex: 0 };

	return (
		<div
			className="owner-reporting-comparison"
			data-owner-reporting-comparison={comparison.state}
		>
			<div className="owner-reporting-comparison__heading">
				<h2 id={`${ids}-title`}>{messages.comparisonTitle}</h2>
				<p>{messages.comparisonDescription}</p>
			</div>

			{comparable ? null : (
				<OwnerReportingState
					variant="insufficient"
					icon={<HelpCircle aria-hidden="true" />}
					title={messages.insufficientTitle}
					description={messages.insufficientDescription}
				>
					<ul className="owner-reporting-reasons">
						{comparison.reasons.map((reason) => (
							<li key={reason}>{messages[reason]}</li>
						))}
					</ul>
					<p className="owner-reporting-comparison__minimum">
						{messages.insufficientMinimum}{" "}
						<bdi>{formatPercent(comparison.minimumCoverage, locale, 0)}</bdi>
					</p>
				</OwnerReportingState>
			)}

			<section
				className="owner-reporting-region owner-reporting-region--compact"
				aria-label={messages.comparisonTitle}
				{...keyboardScrollable}
			>
				<table data-owner-reporting-comparison-table="">
					<colgroup>
						<col className="owner-reporting-comparison__metric-column" />
						<col className="owner-reporting-comparison__week-column" />
						<col className="owner-reporting-comparison__week-column" />
						{comparable ? (
							<col className="owner-reporting-comparison__change-column" />
						) : null}
					</colgroup>
					<thead>
						<tr>
							<th scope="col">{messages.comparisonMetric}</th>
							<th scope="col">
								<span>{messages.comparisonCurrent}</span>
								<bdi className="owner-reporting-week-heading" dir="auto">
									<span>{headings.current.start}</span>
									<span aria-hidden="true"> - </span>
									<span>{headings.current.end}</span>
								</bdi>
							</th>
							<th scope="col">
								<span>{messages.comparisonPrior}</span>
								<bdi className="owner-reporting-week-heading" dir="auto">
									<span>{headings.prior.start}</span>
									<span aria-hidden="true"> - </span>
									<span>{headings.prior.end}</span>
								</bdi>
							</th>
							{comparable ? (
								<th scope="col">{messages.comparisonChange}</th>
							) : null}
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => (
							<tr key={row.key}>
								<th scope="row">{row.label}</th>
								<td>
									<bdi dir="auto">{row.current}</bdi>
								</td>
								<td>
									<bdi dir="auto">{row.prior}</bdi>
								</td>
								{comparable ? (
									<td>
										{row.change ? (
											<ChangeCell change={row.change} format={row.format} />
										) : (
											<span className="owner-reporting__absent">
												{messages.none}
											</span>
										)}
									</td>
								) : null}
							</tr>
						))}
					</tbody>
				</table>
			</section>
		</div>
	);
}

export function OwnerReportingState({
	variant,
	icon,
	title,
	description,
	action,
	children,
}: {
	variant: "loading" | "error" | "insufficient" | "ready" | "stopped";
	icon: React.ReactNode;
	title: string;
	description: string;
	action?: React.ReactNode;
	children?: React.ReactNode;
}) {
	return (
		<OwnerStatePanel
			variant={variant}
			className={`owner-reporting-state owner-reporting-state--${variant}`}
			dataAttribute={{ "data-owner-reporting-state": variant }}
		>
			{icon}
			<div>
				<h3>{title}</h3>
				<p>{description}</p>
				{children}
			</div>
			{action}
		</OwnerStatePanel>
	);
}

export function OwnerReportingLoading({
	embedded = false,
	compact = false,
	announce = true,
}: {
	embedded?: boolean;
	compact?: boolean;
	announce?: boolean;
} = {}) {
	const messages = useOwnerReportingMessages();
	return (
		<div
			className="owner-reporting-skeleton"
			data-embedded={embedded ? "true" : undefined}
			data-compact={compact ? "true" : undefined}
			data-owner-reporting-state={announce ? "loading" : undefined}
			role="status"
			aria-hidden={announce ? undefined : true}
			aria-label={messages.loading}
		>
			<span className="sr-only">{messages.loading}</span>
			<div className="owner-reporting-skeleton__heading" aria-hidden="true" />
			<div className="owner-reporting-skeleton__grid" aria-hidden="true">
				{Array.from({ length: compact ? 9 : 168 }, (_, index) => (
					<i key={`loading-${index}`} />
				))}
			</div>
			<div className="owner-reporting-skeleton__footer" aria-hidden="true" />
		</div>
	);
}

export function OwnerReportingError({
	title,
	onRetry,
}: {
	title: string;
	onRetry: () => void;
}) {
	const messages = useOwnerReportingMessages();
	return (
		<OwnerReportingState
			variant="error"
			icon={<AlertTriangle aria-hidden="true" />}
			title={title}
			description={messages.errorDescription}
			action={
				<Button type="button" onClick={onRetry}>
					<RefreshCw aria-hidden="true" />
					{messages.retry}
				</Button>
			}
		/>
	);
}

export function OwnerReportingReady({
	title,
	description,
	action,
}: {
	title: string;
	description: string;
	action?: React.ReactNode;
}) {
	return (
		<OwnerReportingState
			variant="ready"
			icon={<CircleCheck aria-hidden="true" />}
			title={title}
			description={description}
			action={action}
		/>
	);
}
