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
	CalendarClock,
	CircleCheck,
	HelpCircle,
	Minus,
	RefreshCw,
} from "lucide-react";
import { type KeyboardEvent, useId, useRef, useState } from "react";

import type { Locale } from "@/i18n/catalog";
import { formatDate, formatNumber } from "@/i18n/format";
import { localeConfig } from "@/i18n/locale";
import { useI18n } from "@/i18n/provider";

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

/** Two digits, always, so the 24 column headers keep one width in both locales. */
function twoDigits(value: number, locale: Locale): string {
	return formatNumber(value, locale).padStart(2, "0");
}

/**
 * The clock span a heatmap cell covers.
 *
 * A plain hyphen, never an en dash: an en dash between two numbers is a neutral
 * character, so an Arabic run renders `09:00-09:59` as `09:59-09:00` and the span reads
 * backwards. The `<bdi dir="ltr">` around it keeps the clock itself unmirrored.
 */
function hourSpan(localHour: number, locale: Locale): string {
	return `${twoDigits(localHour, locale)}:00-${twoDigits(localHour, locale)}:59`;
}

/** A ratio as a percentage with Western digits; `Intl` places the sign for Arabic. */
export function formatPercent(
	ratio: number,
	locale: Locale,
	fractionDigits = 1,
): string {
	return new Intl.NumberFormat(localeConfig[locale].intl, {
		style: "percent",
		minimumFractionDigits: ratio > 0 && ratio < 1 ? fractionDigits : 0,
		maximumFractionDigits: fractionDigits,
	}).format(ratio);
}

/** An occupancy average, kept to one decimal: it is a mean, not a headcount. */
export function formatAverage(value: number, locale: Locale): string {
	return new Intl.NumberFormat(localeConfig[locale].intl, {
		minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
		maximumFractionDigits: 1,
	}).format(value);
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

function cellByPosition(heatmap: Heatmap, weekday: Weekday, localHour: number) {
	return heatmap.cells.find(
		(candidate) =>
			candidate.weekday === weekday && candidate.localHour === localHour,
	);
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
	const busiest = busiestAverage(heatmap);
	const active =
		cellByPosition(heatmap, selected.weekday, selected.localHour) ??
		heatmap.cells[0];

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
					<h3 id={`${ids}-title`}>{messages.heatmapTitle}</h3>
					<p>{messages.heatmapDescription}</p>
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

			<p className="owner-reporting__scroll-hint">{messages.scrollHint}</p>
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
							{HOURS.map((hour) => (
								<th key={hour} scope="col">
									<bdi dir="ltr">{twoDigits(hour, locale)}</bdi>
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
						{WEEKDAYS.map((weekday) => (
							<tr key={weekday}>
								<th scope="row">
									<span className="owner-reporting-grid__full">
										{weekdays.full[weekday]}
									</span>
									<span
										className="owner-reporting-grid__short"
										aria-hidden="true"
									>
										{weekdays.short[weekday]}
									</span>
								</th>
								{HOURS.map((hour) => {
									const cell = cellByPosition(heatmap, weekday, hour);
									if (!cell) return <td key={hour} />;
									const isActive =
										selected.weekday === weekday && selected.localHour === hour;
									const reading =
										cell.state === "value" && cell.averageOccupancy !== null
											? `${messages.selectedAverage} ${formatAverage(cell.averageOccupancy, locale)}, ${messages.selectedSamples} ${formatNumber(cell.sampleDayCount, locale)}`
											: cellStateLabel(cell, messages);
									return (
										<td key={hour}>
											<button
												ref={(element) => {
													const key = cellKey({ weekday, localHour: hour });
													if (element) cellRefs.current.set(key, element);
													else cellRefs.current.delete(key);
												}}
												type="button"
												className="owner-reporting-cell"
												data-level={cellLevel(cell, busiest)}
												data-state={cell.state}
												data-active={isActive ? "" : undefined}
												tabIndex={isActive ? 0 : -1}
												aria-pressed={isActive}
												aria-label={`${weekdays.full[weekday]} ${hourSpan(hour, locale)}, ${cellStateLabel(cell, messages)}. ${reading}`}
												onClick={() => select({ weekday, localHour: hour })}
												onFocus={() => select({ weekday, localHour: hour })}
											/>
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
			</section>
			<p className="owner-reporting__hint" id={`${ids}-hint`}>
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
									{formatNumber(active.observedOpenMinutes, locale)}
									{" / "}
									{formatNumber(active.expectedOpenMinutes, locale)}
								</bdi>
							</dd>
						</div>
						<div>
							<dt>{messages.selectedSamples}</dt>
							<dd>
								<bdi>{formatNumber(active.sampleDayCount, locale)}</bdi>
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
	const keyboardScrollable = { tabIndex: 0 };
	return (
		<details className="owner-reporting-disclosure">
			<summary>{messages.tableSummary}</summary>
			<section
				className="owner-reporting-region"
				aria-label={messages.tableRegion}
				{...keyboardScrollable}
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
						{heatmap.cells.map((cell) => (
							<tr
								key={`${cell.weekday}-${cell.localHour}`}
								data-state={cell.state}
								data-zero={
									cell.state === "value" && cell.averageOccupancy === 0
										? ""
										: undefined
								}
							>
								<td>{weekdays.full[cell.weekday]}</td>
								<td>
									<bdi dir="ltr">{hourSpan(cell.localHour, locale)}</bdi>
								</td>
								<td>{cellStateLabel(cell, messages)}</td>
								<td>
									{cell.averageOccupancy === null ? (
										<span className="owner-reporting__absent">
											{cellStateLabel(cell, messages)}
										</span>
									) : (
										<bdi>{formatAverage(cell.averageOccupancy, locale)}</bdi>
									)}
								</td>
								<td>
									<bdi>{formatNumber(cell.observedOpenMinutes, locale)}</bdi>
								</td>
								<td>
									<bdi>{formatNumber(cell.expectedOpenMinutes, locale)}</bdi>
								</td>
								<td>
									<bdi>{formatNumber(cell.sampleDayCount, locale)}</bdi>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</section>
		</details>
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
			<Glyph aria-hidden="true" />
			<bdi>{format(Math.abs(change.absolute), locale)}</bdi>
			{/*
			 * The contract's `percent` is a ratio, not a number of percent: `0.088` is
			 * the +8.8% the approved composition shows. `Intl` does the scaling, so
			 * nothing here multiplies by a hundred.
			 */}
			{change.percent === null ? null : (
				<bdi className="owner-reporting-change__percent">
					{formatPercent(Math.abs(change.percent), locale)}
				</bdi>
			)}
			{/* The direction is a word as well as a shape; colour alone never carries it. */}
			<span className="owner-reporting-change__word">{word}</span>
		</span>
	);
}

function weekHeading(week: WeekMetrics, locale: Locale) {
	return windowLabel(week.startBusinessDay, week.endBusinessDay, locale);
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
	const rows = [
		{
			key: "average",
			label: messages.comparisonAverage,
			value: (week: WeekMetrics) =>
				week.averageOccupancy === null
					? messages.comparisonNoAverage
					: formatAverage(week.averageOccupancy, locale),
			change: comparable ? comparison.changes.averageOccupancy : null,
			format: formatAverage,
		},
		{
			key: "crossings",
			label: messages.comparisonCrossings,
			value: (week: WeekMetrics) =>
				formatNumber(week.estimatedEntranceCrossings, locale),
			change: comparable ? comparison.changes.estimatedEntranceCrossings : null,
			format: formatNumber,
		},
		{
			key: "coverage",
			label: messages.comparisonCoverage,
			value: (week: WeekMetrics) =>
				week.coverage === null
					? messages.comparisonNoAverage
					: `${formatPercent(week.coverage, locale)} (${formatNumber(week.observedOpenMinutes, locale)} / ${formatNumber(week.expectedOpenMinutes, locale)})`,
			change: null,
			format: formatNumber,
		},
	];

	// A labeled scroll region must be reachable by keyboard alone (`DESIGN_GUIDE.md`
	// §8, §13), exactly as the accepted audit, health, and analytics tables are.
	const keyboardScrollable = { tabIndex: 0 };

	return (
		<section
			className="owner-reporting-comparison"
			data-owner-reporting-comparison={comparison.state}
			aria-labelledby={`${ids}-title`}
		>
			<div className="owner-reporting-comparison__heading">
				<h3 id={`${ids}-title`}>{messages.comparisonTitle}</h3>
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
				className="owner-reporting-region"
				aria-label={messages.comparisonTitle}
				{...keyboardScrollable}
			>
				<table data-owner-reporting-comparison-table="">
					<thead>
						<tr>
							<th scope="col">{/* metric name column */}</th>
							<th scope="col">
								<span>{messages.comparisonCurrent}</span>
								<bdi dir="auto">
									{weekHeading(comparison.currentWeek, locale)}
								</bdi>
							</th>
							<th scope="col">
								<span>{messages.comparisonPrior}</span>
								<bdi dir="auto">
									{weekHeading(comparison.priorWeek, locale)}
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
									<bdi dir="auto">{row.value(comparison.currentWeek)}</bdi>
								</td>
								<td>
									<bdi dir="auto">{row.value(comparison.priorWeek)}</bdi>
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
			<p className="owner-reporting__hint">
				{messages.comparisonCrossingsNote}
			</p>
		</section>
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
		<section
			className={`owner-reporting-state owner-reporting-state--${variant}`}
			role={variant === "error" ? "alert" : "status"}
			data-owner-reporting-state={variant}
		>
			{icon}
			<div>
				<h4>{title}</h4>
				<p>{description}</p>
				{children}
			</div>
			{action}
		</section>
	);
}

export function OwnerReportingLoading() {
	const messages = useOwnerReportingMessages();
	return (
		<OwnerReportingState
			variant="loading"
			icon={<CalendarClock aria-hidden="true" />}
			title={messages.loading}
			description={messages.loadingDescription}
			action={
				<div className="owner-reporting-loading-bars" aria-hidden="true">
					<i />
					<i />
					<i />
				</div>
			}
		/>
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
