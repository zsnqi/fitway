import type {
	AnalyticsTimelineBucket,
	AnalyticsValueBucket,
	DailyAnalytics,
} from "@fitway/api/analytics/daily-analytics";
import { Button } from "@fitway/ui/components/button";
import { BarChart3 } from "lucide-react";
import {
	Fragment,
	type KeyboardEvent,
	type PointerEvent,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import { formatDate, formatGymTime, formatNumber } from "@/i18n/format";
import { useI18n } from "@/i18n/provider";

import type { OwnerAnalyticsMessages } from "./messages";
import { useOwnerAnalyticsMessages } from "./use-owner-analytics-messages";

import "./owner-analytics.css";

type OwnerAnalyticsViewProps = {
	daily: DailyAnalytics;
	currentTimeZone: string;
	timeZoneByVersion: ReadonlyMap<number, string>;
};

function mappedTimeZone(
	settingsVersion: number,
	timeZoneByVersion: ReadonlyMap<number, string>,
): string {
	const timeZone = timeZoneByVersion.get(settingsVersion);
	if (!timeZone) {
		throw new Error(
			`Analytics timezone mapping is missing settings version ${settingsVersion}`,
		);
	}
	return timeZone;
}

function formatDecimal(value: number, locale: "ar" | "en") {
	return new Intl.NumberFormat(
		locale === "ar" ? "ar-SA-u-nu-latn" : "en-SA-u-nu-latn",
		{ maximumFractionDigits: 1 },
	).format(value);
}

function bucketTime(
	bucket: AnalyticsTimelineBucket,
	locale: "ar" | "en",
	timeZoneByVersion: ReadonlyMap<number, string>,
) {
	return formatGymTime(
		new Date(bucket.minuteStartUtc),
		locale,
		mappedTimeZone(bucket.settingsVersion, timeZoneByVersion),
	);
}

function bucketState(
	bucket: AnalyticsTimelineBucket,
	messages: OwnerAnalyticsMessages,
) {
	if (bucket.state === "value") return messages.observed;
	return bucket.state === "closed" ? messages.closed : messages.missing;
}

/**
 * Presentational latest-day check: Paper's in-progress state puts the marker
 * on the latest real reading with a visible Latest/time annotation, while a
 * completed day rests the marker on the peak with no annotation. The business
 * date comes from the server payload; only "is it today in the gym zone" is
 * derived on the client. An unresolvable zone degrades to completed-day
 * presentation rather than failing the chart.
 */
function isCurrentBusinessDay(businessDay: string, timeZone: string): boolean {
	try {
		const today = new Intl.DateTimeFormat("en-CA", {
			timeZone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).format(new Date());
		return today === businessDay;
	} catch {
		return false;
	}
}

/**
 * Minimal-clamp anchoring for centered chart captions (Latest label,
 * gap-duration labels, x-axis ticks). Captions always stay centered on
 * their point via the stylesheet translateX(-50%); only the anchor is
 * clamped so the centered box cannot cross the plot edge. Clamping the
 * anchor (instead of snapping the label fully to one side) keeps the
 * point's x inside its own caption box, preserving the association Paper
 * requires between a stem and its label. Pixel margins are tight
 * half-width estimates for the 10-11px tabular caption typography
 * (Latest longest in Arabic); physical left is direction-independent, so
 * LTR/RTL behave alike. Margins: latest 55, gap 40, tick 30.
 */
export function clampedCaptionLeft(ratio: number, halfPx: number): string {
	const percent = Math.round(ratio * 100 * 10000) / 10000;
	return `clamp(${halfPx}px, ${percent}%, calc(100% - ${halfPx}px))`;
}

function AnalyticsMetric({
	label,
	value,
	detail,
}: {
	label: string;
	value: React.ReactNode;
	detail: React.ReactNode;
}) {
	return (
		<article className="owner-metric">
			<span className="owner-metric__heading">{label}</span>
			<strong>{value}</strong>
			<p>{detail}</p>
		</article>
	);
}

type GapSegment = {
	start: number;
	end: number;
	minutes: number;
	allClosed: boolean;
};

/**
 * Gaps shorter than this keep their honest dashed stems but earn no
 * dimension bracket, end ticks, or duration label. A lone missing minute
 * (the routine one-minute outage cadence) is truthful as a stem pair; naming
 * every one of them annotates noise instead of information. Longer,
 * story-relevant absences keep the full Paper dimension treatment, and every
 * gap of any length stays exact in tooltips and the semantic table.
 */
export const MIN_ANNOTATED_GAP_MINUTES = 3;

/** How many clock-aligned time ticks the x-axis shows at most. */
export const OWNER_CHART_MAX_TIME_TICKS = 5;

/**
 * Interior absent stretches only: a maximal run of consecutive non-value
 * buckets with an observed value on both sides. Leading/trailing absent
 * ranges (overnight closed, not-yet-observed) stay in the semantic table but
 * are not painted in the chart, matching Paper's open-window domain.
 */
function gapSegments(
	timeline: readonly AnalyticsTimelineBucket[],
): GapSegment[] {
	const segments: GapSegment[] = [];
	for (let index = 0; index < timeline.length; index += 1) {
		const bucket = timeline[index];
		if (!bucket || bucket.state === "value") continue;
		const previous = segments.at(-1);
		if (previous && previous.end === index - 1) {
			previous.end = index;
			previous.minutes += 1;
			previous.allClosed = previous.allClosed && bucket.state === "closed";
		} else {
			segments.push({
				start: index,
				end: index,
				minutes: 1,
				allClosed: bucket.state === "closed",
			});
		}
	}
	return segments.filter(
		(segment) =>
			segment.start > 0 &&
			segment.end < timeline.length - 1 &&
			timeline[segment.start - 1]?.state === "value" &&
			timeline[segment.end + 1]?.state === "value",
	);
}

function valueRuns(timeline: readonly AnalyticsTimelineBucket[]) {
	const runs: Array<Array<{ bucket: AnalyticsValueBucket; index: number }>> =
		[];
	for (let index = 0; index < timeline.length; index += 1) {
		const bucket = timeline[index];
		if (bucket?.state !== "value") continue;
		const previous = runs.at(-1);
		if (previous?.at(-1)?.index === index - 1) {
			previous.push({ bucket, index });
		} else {
			runs.push([{ bucket, index }]);
		}
	}
	return runs;
}

const NICE_COUNT_STEPS = [5, 10, 20, 25, 50, 100, 200, 500, 1000] as const;

/**
 * Intentional count scale: the ceiling is the smallest nice multiple at or
 * above the true peak (never capped, never averaged — the peak keeps its
 * exact ordinate), and the ticks are the nice multiples between zero and the
 * ceiling. Replaces the mechanical max / two-thirds / one-third labels with
 * readable round numbers while every observation keeps its exact value.
 */
export function niceCountScale(rawMaxCount: number): {
	niceMax: number;
	ticks: number[];
} {
	const safe = Math.max(1, Math.floor(rawMaxCount));
	const step =
		NICE_COUNT_STEPS.find((candidate) => Math.ceil(safe / candidate) <= 4) ??
		1000;
	const niceMax = Math.max(20, Math.ceil(safe / step) * step);
	const ticks: number[] = [];
	for (let value = niceMax; value >= 0; value -= step) ticks.push(value);
	return { niceMax, ticks };
}

function gymLocalMinute(instant: Date, timeZone: string): number | null {
	try {
		const parts = new Intl.DateTimeFormat("en-US", {
			timeZone,
			hour: "2-digit",
			minute: "2-digit",
			hourCycle: "h23",
		}).formatToParts(instant);
		const minute = Number(parts.find((part) => part.type === "minute")?.value);
		return Number.isSafeInteger(minute) ? minute : null;
	} catch {
		return null;
	}
}

export type OwnerChartTimeTick = {
	index: number;
	bucket: AnalyticsTimelineBucket;
};

/**
 * Intentional time ticks: up to `maxTicks` positions snapped to gym-clock
 * hour boundaries, always including the domain ends so the axis shows the
 * data extent. Short spans without enough hour boundaries fall back to evenly
 * spaced distinct minutes (never a duplicated time). Replaces the mechanical
 * seven-slot index mapping, which could print the same minute twice on short
 * days and arbitrary mid-hour times on long ones.
 */
export function intentionalTimeTicks(
	timeline: readonly AnalyticsTimelineBucket[],
	timeZoneByVersion: ReadonlyMap<number, string>,
	maxTicks: number = OWNER_CHART_MAX_TIME_TICKS,
): OwnerChartTimeTick[] {
	if (timeline.length === 0 || maxTicks <= 0) return [];
	const count = Math.min(maxTicks, timeline.length);
	if (count === 1) {
		const only = timeline[0];
		return only ? [{ index: 0, bucket: only }] : [];
	}
	const hourBoundary = new Set<number>();
	timeline.forEach((bucket, index) => {
		if (!bucket) return;
		const timeZone = timeZoneByVersion.get(bucket.settingsVersion);
		if (!timeZone) return;
		if (gymLocalMinute(new Date(bucket.minuteStartUtc), timeZone) === 0) {
			hourBoundary.add(index);
		}
	});
	const last = timeline.length - 1;
	if (hourBoundary.size >= 2) {
		const chosen = new Set<number>([0]);
		for (let slot = 1; slot < count - 1; slot += 1) {
			const target = Math.round((slot / (count - 1)) * last);
			let best = -1;
			let distance = Number.POSITIVE_INFINITY;
			for (const candidate of hourBoundary) {
				const next = Math.abs(candidate - target);
				if (next < distance) {
					distance = next;
					best = candidate;
				}
			}
			if (best >= 0) chosen.add(best);
		}
		chosen.add(last);
		return [...chosen]
			.sort((left, right) => left - right)
			.flatMap((index) => {
				const bucket = timeline[index];
				return bucket ? [{ index, bucket }] : [];
			});
	}
	const indices = new Set<number>(
		Array.from({ length: count }, (_unused, slot) =>
			Math.round((slot / (count - 1)) * last),
		),
	);
	return [...indices]
		.sort((left, right) => left - right)
		.flatMap((index) => {
			const bucket = timeline[index];
			return bucket ? [{ index, bucket }] : [];
		});
}

export function smoothPath(
	points: readonly { x: number; y: number }[],
	// Paper marker junction: a trimmed side must meet the ring along its
	// final radial segment with no smoothing bow past the outer edge.
	// `straightTip: "end"` draws the last segment straight (left side),
	// `"start"` draws the first segment straight (right side). All other
	// segments keep the accepted bounded smoothing; values never move.
	straightTip: "none" | "start" | "end" = "none",
): string {
	if (points.length === 0) return "";
	if (points.length === 1) return `M${points[0]?.x},${points[0]?.y}`;
	const first = points[0];
	if (!first) return "";
	let path = `M${first.x},${first.y}`;
	for (let index = 0; index < points.length - 1; index += 1) {
		const current = points[index];
		const next = points[index + 1];
		if (!current || !next) continue;
		if (straightTip === "start" && index === 0) {
			path += ` L${next.x},${next.y}`;
			continue;
		}
		if (straightTip === "end" && index === points.length - 2) {
			path += ` L${next.x},${next.y}`;
			continue;
		}
		const previous = points[index - 1] ?? current;
		const after = points[index + 2] ?? next;
		const control1X = current.x + (next.x - previous.x) / 6;
		const minimumY = Math.min(current.y, next.y);
		const maximumY = Math.max(current.y, next.y);
		const control1Y = Math.min(
			maximumY,
			Math.max(minimumY, current.y + (next.y - previous.y) / 6),
		);
		const control2X = next.x - (after.x - current.x) / 6;
		const control2Y = Math.min(
			maximumY,
			Math.max(minimumY, next.y - (after.y - current.y) / 6),
		);
		path += ` C${control1X},${control1Y} ${control2X},${control2Y} ${next.x},${next.y}`;
	}
	return path;
}

/**
 * Paper marker cutout: the highlighted marker keeps a fixed CSS-pixel outer
 * diameter (20px desktop / 18px mobile, border-box), while the SVG stretches
 * with `preserveAspectRatio="none"`. Paper terminates the chart line at the
 * ring's OUTER edge — the stroke must not continue through the ring toward
 * the solid core. The helpers below trim the active run's line (and the
 * active stem) to the marker ellipse in viewBox units, so the cutout stays
 * pixel-exact at every responsive width in both RTL and LTR.
 */
export const OWNER_CHART_MARKER_OUTER_PX_DESKTOP = 10;
export const OWNER_CHART_MARKER_OUTER_PX_MOBILE = 9;

export type OwnerChartPoint = { x: number; y: number };

function pointInMarker(
	point: OwnerChartPoint,
	center: OwnerChartPoint,
	rx: number,
	ry: number,
): boolean {
	if (!(rx > 0 && ry > 0)) return false;
	const dx = (point.x - center.x) / rx;
	const dy = (point.y - center.y) / ry;
	return dx * dx + dy * dy < 1;
}

/**
 * Point where the segment inner→outer exits the marker ellipse. `inner`
 * must be strictly inside and `outer` on or outside the edge; returns null
 * otherwise. A degenerate or zero-size marker also returns null (no cutout).
 */
export function markerExitPoint(
	inner: OwnerChartPoint,
	outer: OwnerChartPoint,
	center: OwnerChartPoint,
	rx: number,
	ry: number,
): OwnerChartPoint | null {
	if (!(rx > 0 && ry > 0)) return null;
	const ix = (inner.x - center.x) / rx;
	const iy = (inner.y - center.y) / ry;
	const ox = (outer.x - center.x) / rx;
	const oy = (outer.y - center.y) / ry;
	const innerQ = ix * ix + iy * iy;
	const outerQ = ox * ox + oy * oy;
	if (innerQ >= 1 || outerQ < 1) return null;
	const dx = ox - ix;
	const dy = oy - iy;
	const a = dx * dx + dy * dy;
	if (a <= 0) return null;
	const b = 2 * (ix * dx + iy * dy);
	const c = innerQ - 1;
	const discriminant = b * b - 4 * a * c;
	if (discriminant < 0) return null;
	const root = Math.sqrt(discriminant);
	const candidates = [(-b - root) / (2 * a), (-b + root) / (2 * a)].filter(
		(t) => t >= 0 && t <= 1,
	);
	if (candidates.length === 0) return null;
	// Starting inside, the segment can only leave once: take the farthest
	// valid root so the line ends exactly on the outer edge.
	const t = Math.max(...candidates);
	return {
		x: center.x + (ix + dx * t) * rx,
		y: center.y + (iy + dy * t) * ry,
	};
}

function samePoint(a: OwnerChartPoint, b: OwnerChartPoint): boolean {
	return Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6;
}

/**
 * Split one value run around its active point so the stroked line stops at
 * the marker's outer edge on each connected side. Each side walks outward
 * along the polyline past densely packed points until the first segment
 * that leaves the ellipse; fully hidden sides (and lone active readings,
 * which the HTML core already marks) return null and draw nothing. Trimmed
 * endpoints interpolate between true observations, so the bounded
 * truthful-curve contract still holds and no value moves.
 */
export function trimActiveRun(
	points: readonly OwnerChartPoint[],
	activePos: number,
	rx: number,
	ry: number,
): { left: OwnerChartPoint[] | null; right: OwnerChartPoint[] | null } {
	const center = points[activePos];
	if (!center || !(rx > 0 && ry > 0)) return { left: null, right: null };
	let left: OwnerChartPoint[] | null = null;
	for (let index = activePos; index > 0; index -= 1) {
		const inner = index === activePos ? center : points[index];
		const outer = points[index - 1];
		if (!inner || !outer) break;
		if (pointInMarker(outer, center, rx, ry)) continue;
		const exit = markerExitPoint(inner, outer, center, rx, ry);
		if (!exit) break;
		left = samePoint(exit, outer)
			? [...points.slice(0, index)]
			: [...points.slice(0, index), exit];
		break;
	}
	let right: OwnerChartPoint[] | null = null;
	for (let index = activePos; index < points.length - 1; index += 1) {
		const inner = index === activePos ? center : points[index];
		const outer = points[index + 1];
		if (!inner || !outer) break;
		if (pointInMarker(outer, center, rx, ry)) continue;
		const exit = markerExitPoint(inner, outer, center, rx, ry);
		if (!exit) break;
		right = samePoint(exit, outer)
			? [...points.slice(index + 1)]
			: [exit, ...points.slice(index + 1)];
		break;
	}
	return { left, right };
}

function OccupancyChart({
	daily,
	timeZoneByVersion,
	currentTimeZone,
}: Pick<OwnerAnalyticsViewProps, "daily" | "timeZoneByVersion"> &
	Pick<OwnerAnalyticsViewProps, "currentTimeZone">) {
	const { locale } = useI18n();
	const messages = useOwnerAnalyticsMessages();
	const values = useMemo(
		() =>
			daily.timeline.flatMap((bucket, index) =>
				bucket.state === "value" ? [{ bucket, index }] : [],
			),
		[daily.timeline],
	);
	const isLatestDay = isCurrentBusinessDay(daily.businessDay, currentTimeZone);
	const initialActive = isLatestDay
		? Math.max(0, values.length - 1)
		: Math.max(
				0,
				values.findIndex(
					({ bucket }) => bucket.minuteStartUtc === daily.peak?.minuteStartUtc,
				),
			);
	const [activePosition, setActivePosition] = useState(initialActive);
	// Paper shows the selected/focus readout only once the reader picks a
	// point (hover, touch, or arrow keys). The pristine default — peak on a
	// completed day, latest reading on an in-progress day — carries no
	// tooltip, matching the accepted closed/latest frames.
	const [hasSelected, setHasSelected] = useState(false);
	const interactionRef = useRef<HTMLButtonElement | null>(null);
	const [plotSize, setPlotSize] = useState<{
		width: number;
		height: number;
	} | null>(null);
	useEffect(() => {
		const element = interactionRef.current;
		if (!element || typeof ResizeObserver === "undefined") return;
		const observe = () => {
			const rect = element.getBoundingClientRect();
			setPlotSize((current) =>
				current &&
				Math.abs(current.width - rect.width) < 0.5 &&
				Math.abs(current.height - rect.height) < 0.5
					? current
					: { width: rect.width, height: rect.height },
			);
		};
		observe();
		const observer = new ResizeObserver(observe);
		observer.observe(element);
		return () => observer.disconnect();
	}, []);
	const active =
		values[Math.min(activePosition, Math.max(0, values.length - 1))];
	const width = 1200;
	const height = 240;
	const padX = 16;
	const padTop = 1;
	const padBottom = 0;
	const chartHeight = height - padTop - padBottom;
	const baseY = padTop + chartHeight;
	const rawMaxCount = Math.max(1, ...values.map(({ bucket }) => bucket.count));
	// Intentional readable scale: a nice ceiling at or above the true peak
	// with round intermediate ticks. Extrema and timestamps are untouched.
	const { niceMax: maxCount, ticks: countTicks } = niceCountScale(rawMaxCount);
	const xFor = (index: number) => {
		const ratio =
			daily.timeline.length <= 1 ? 0.5 : index / (daily.timeline.length - 1);
		const visualRatio = locale === "ar" ? 1 - ratio : ratio;
		return padX + visualRatio * (width - padX * 2);
	};
	const yFor = (count: number) => padTop + (1 - count / maxCount) * chartHeight;
	const runs = valueRuns(daily.timeline);
	const gaps = gapSegments(daily.timeline);
	// Fixed-pixel cutout expressed in viewBox units. The marker's outer
	// radius is a CSS-pixel constant (10px desktop / 18px→9px mobile,
	// border-box) while the SVG stretches, so the viewBox radii follow the
	// measured plot box. The 220px height threshold separates the 240px
	// desktop plot from the 196px mobile one. Before the first measurement
	// (and in unit tests without layout) the breakpoint-matched estimate
	// applies — desktop 12/10, mobile ≈32/11 for a ~340px plot — so even the
	// first frame trims instead of drawing through the ring; the observer
	// then corrects to the exact measured radii.
	const fallbackMobile =
		typeof window !== "undefined" &&
		typeof window.matchMedia === "function" &&
		window.matchMedia("(max-width: 720px)").matches;
	const markerOuterPx =
		plotSize && plotSize.height < 220
			? OWNER_CHART_MARKER_OUTER_PX_MOBILE
			: OWNER_CHART_MARKER_OUTER_PX_DESKTOP;
	const markerRx =
		plotSize && plotSize.width > 0
			? (markerOuterPx / plotSize.width) * width
			: fallbackMobile
				? 32
				: 12;
	const markerRy =
		plotSize && plotSize.height > 0
			? (markerOuterPx / plotSize.height) * height
			: fallbackMobile
				? 11
				: 10;
	// Intentional clock-aligned time ticks (domain ends included, hour
	// boundaries preferred, never a duplicated time). Exact per-minute detail
	// stays available through pointer/keyboard selection and the table.
	const timeTicks = intentionalTimeTicks(daily.timeline, timeZoneByVersion);

	function moveActive(delta: number) {
		setHasSelected(true);
		setActivePosition((current) =>
			Math.min(values.length - 1, Math.max(0, current + delta)),
		);
	}

	function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
		if (event.key === "Home") {
			setHasSelected(true);
			setActivePosition(0);
		} else if (event.key === "End") {
			setHasSelected(true);
			setActivePosition(values.length - 1);
		} else if (event.key === "ArrowRight") moveActive(locale === "ar" ? -1 : 1);
		else if (event.key === "ArrowLeft") moveActive(locale === "ar" ? 1 : -1);
		else return;
		event.preventDefault();
	}

	function selectFromPointer(event: PointerEvent<HTMLButtonElement>) {
		const bounds = event.currentTarget.getBoundingClientRect();
		if (bounds.width <= 0 || values.length === 0) return;
		setHasSelected(true);
		const visualRatio = Math.min(
			1,
			Math.max(0, (event.clientX - bounds.left) / bounds.width),
		);
		const plotRatio = Math.min(
			1,
			Math.max(0, (visualRatio * width - padX) / Math.max(1, width - padX * 2)),
		);
		const ratio = locale === "ar" ? 1 - plotRatio : plotRatio;
		const timelineIndex = ratio * Math.max(0, daily.timeline.length - 1);
		let closestPosition = 0;
		let distance = Number.POSITIVE_INFINITY;
		values.forEach((value, position) => {
			const nextDistance = Math.abs(value.index - timelineIndex);
			if (nextDistance < distance) {
				distance = nextDistance;
				closestPosition = position;
			}
		});
		setActivePosition(closestPosition);
	}

	if (!active) return null;
	const activeTime = bucketTime(active.bucket, locale, timeZoneByVersion);
	const activeLabel = `${messages.selectedReading}: ${activeTime}, ${messages.count}: ${formatNumber(active.bucket.count, locale)}`;

	return (
		<section className="owner-chart-panel" aria-labelledby="owner-chart-title">
			<div className="owner-chart-panel__heading">
				<h2 id="owner-chart-title">{messages.chartTitle}</h2>
				<p className="sr-only">{messages.chartHint}</p>
				<div className="sr-only" data-active-reading aria-live="polite">
					{activeLabel}
				</div>
			</div>
			<div className="owner-chart-layout">
				<div className="owner-chart-y-axis" aria-hidden="true">
					{countTicks.map((tick) => (
						<span key={tick}>{formatNumber(tick, locale)}</span>
					))}
				</div>
				<div className="owner-chart-plot">
					<button
						type="button"
						ref={interactionRef}
						className="owner-chart-interaction"
						data-owner-chart
						aria-label={`${messages.chartLabel}. ${activeLabel}`}
						onKeyDown={handleKeyDown}
						onPointerMove={selectFromPointer}
						onPointerDown={selectFromPointer}
					>
						<svg
							className="owner-chart"
							viewBox={`0 0 ${width} ${height}`}
							preserveAspectRatio="none"
							aria-hidden="true"
						>
							{countTicks.map((tick) => (
								<line
									key={tick}
									className="owner-chart__grid"
									x1={padX}
									x2={width - padX}
									y1={padTop + (1 - tick / maxCount) * chartHeight}
									y2={padTop + (1 - tick / maxCount) * chartHeight}
								/>
							))}
							{gaps.flatMap((gap) => {
								const left = values.find(
									(value) => value.index === gap.start - 1,
								);
								const right = values.find(
									(value) => value.index === gap.end + 1,
								);
								if (!left || !right) return [];
								const stemClass = gap.allClosed
									? "owner-chart__gap-stem owner-chart__gap-stem--closed"
									: "owner-chart__gap-stem owner-chart__gap-stem--missing";
								const leftX = xFor(left.index);
								const rightX = xFor(right.index);
								// Paper's dimension bracket: a thin rule spanning the
								// stems with short end ticks, duration label beneath.
								// Only story-relevant gaps earn it; tiny gaps keep
								// their honest stems without the persistent hardware.
								const bracketY = baseY - 26;
								const annotated = gap.minutes >= MIN_ANNOTATED_GAP_MINUTES;
								return [
									<line
										key={`${gap.start}-left`}
										className={stemClass}
										x1={leftX}
										x2={leftX}
										y1={yFor(left.bucket.count)}
										y2={baseY}
									/>,
									<line
										key={`${gap.start}-right`}
										className={stemClass}
										x1={rightX}
										x2={rightX}
										y1={yFor(right.bucket.count)}
										y2={baseY}
									/>,
									...(annotated
										? [
												<line
													key={`${gap.start}-bracket`}
													className="owner-chart__gap-bracket"
													x1={leftX}
													x2={rightX}
													y1={bracketY}
													y2={bracketY}
												/>,
												<line
													key={`${gap.start}-tick-left`}
													className="owner-chart__gap-tick"
													x1={leftX}
													x2={leftX}
													y1={bracketY - 5}
													y2={bracketY + 5}
												/>,
												<line
													key={`${gap.start}-tick-right`}
													className="owner-chart__gap-tick"
													x1={rightX}
													x2={rightX}
													y1={bracketY - 5}
													y2={bracketY + 5}
												/>,
											]
										: []),
								];
							})}
							{runs.map((run) => {
								const isActiveRun = run.some(
									(entry) => entry.index === active.index,
								);
								if (isActiveRun) {
									// Paper terminates the line at the marker's OUTER
									// edge: the active run is redrawn as up to two
									// trimmed sides that stop on the ring instead of
									// continuing to the center. The tip segment of
									// each side is drawn straight along its radial
									// exit ray (no smoothing bow past the edge) and
									// uses a butt cap (see .owner-chart__line--trimmed),
									// so no paint extends past the outer boundary
									// toward the core. A lone active reading
									// draws nothing — the HTML core already marks it.
									const points = run.map(({ bucket, index }) => ({
										x: xFor(index),
										y: yFor(bucket.count),
									}));
									const activePos = run.findIndex(
										(entry) => entry.index === active.index,
									);
									const { left, right } = trimActiveRun(
										points,
										activePos,
										markerRx,
										markerRy,
									);
									return (
										<Fragment key={run[0]?.index}>
											{left && left.length > 1 ? (
												<path
													className="owner-chart__line owner-chart__line--trimmed"
													data-active-run="true"
													data-trimmed="left"
													d={smoothPath(left, "end")}
												/>
											) : null}
											{right && right.length > 1 ? (
												<path
													className="owner-chart__line owner-chart__line--trimmed"
													data-active-run="true"
													data-trimmed="right"
													d={smoothPath(right, "start")}
												/>
											) : null}
										</Fragment>
									);
								}
								const points = run.map(({ bucket, index }) => ({
									x: xFor(index),
									y: yFor(bucket.count),
								}));
								// A lone observation has no segment to stroke. Nudging the
								// pen with round caps renders it as a point dot in the
								// exact position instead of hiding a real reading.
								const solo = points.length === 1 && points[0];
								const line = solo
									? `M${solo.x},${solo.y} L${solo.x + 0.01},${solo.y}`
									: smoothPath(points);
								return (
									<path
										key={run[0]?.index}
										className={
											solo
												? "owner-chart__line owner-chart__solo"
												: "owner-chart__line"
										}
										d={line}
									/>
								);
							})}
							{(hasSelected || isLatestDay) &&
								(() => {
									// The stem drops from the ring's outer bottom edge,
									// never from the center through the ring. A reading
									// resting on the baseline leaves no room below the
									// ring, so the stem is omitted there.
									const stemTop = yFor(active.bucket.count) + markerRy;
									if (stemTop >= baseY - 0.5) return null;
									return (
										<line
											className="owner-chart__stem"
											x1={xFor(active.index)}
											x2={xFor(active.index)}
											y1={stemTop}
											y2={baseY}
										/>
									);
								})()}
							{values.map(({ bucket, index }) => (
								<circle
									key={`point-${index}`}
									className="owner-chart__point"
									cx={xFor(index)}
									cy={yFor(bucket.count)}
									r="3"
								/>
							))}
						</svg>
						<span
							className="owner-chart__active"
							aria-hidden="true"
							data-chart-x={xFor(active.index)}
							style={{
								left: `${(xFor(active.index) / width) * 100}%`,
								top: `${(yFor(active.bucket.count) / height) * 100}%`,
							}}
						/>
						{isLatestDay && !hasSelected && values.length > 0
							? (() => {
									const latest = values[values.length - 1];
									if (!latest) return null;
									const latestTime = bucketTime(
										latest.bucket,
										locale,
										timeZoneByVersion,
									);
									return (
										<span
											className="owner-chart__latest"
											data-latest-reading
											aria-hidden="true"
											style={{
												left: clampedCaptionLeft(
													xFor(latest.index) / width,
													55,
												),
											}}
										>
											{messages.latest} {latestTime}
										</span>
									);
								})()
							: null}
						{hasSelected ? (
							<span
								className="owner-chart-tip"
								data-selected-reading
								aria-hidden="true"
								style={{
									left: `${(xFor(active.index) / width) * 100}%`,
									top: `${(yFor(active.bucket.count) / height) * 100}%`,
									transform:
										xFor(active.index) / width > 0.75
											? "translate(-100%, calc(-100% - 12px))"
											: xFor(active.index) / width < 0.25
												? "translate(0, calc(-100% - 12px))"
												: "translate(-50%, calc(-100% - 12px))",
								}}
							>
								<bdi dir="auto">{activeTime}</bdi>
								<span>
									{locale === "ar"
										? `${messages.presentPrefix} ${formatNumber(active.bucket.count, locale)} ${messages.presentSuffix}`
										: `${messages.presentPrefix}${formatNumber(active.bucket.count, locale)} ${messages.presentSuffix}`}
								</span>
							</span>
						) : null}
						{gaps
							.filter((gap) => gap.minutes >= MIN_ANNOTATED_GAP_MINUTES)
							.map((gap) => {
								const leftX = xFor(gap.start - 1);
								const rightX = xFor(gap.end + 1);
								const labelRatio = (leftX + rightX) / 2 / width;
								return (
									<span
										key={`gap-${gap.start}`}
										className="owner-chart__gap-label"
										aria-hidden="true"
										style={{
											left: clampedCaptionLeft(labelRatio, 40),
										}}
									>
										{formatNumber(gap.minutes, locale)} {messages.gapMinutes}
									</span>
								);
							})}
					</button>
					<div className="owner-chart-x-axis" aria-hidden="true">
						{timeTicks.map(({ index, bucket }) => (
							<span
								key={index}
								style={{
									left: clampedCaptionLeft(xFor(index) / width, 30),
								}}
							>
								{bucketTime(bucket, locale, timeZoneByVersion)}
							</span>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}

function AnalyticsTable({
	daily,
	timeZoneByVersion,
}: Pick<OwnerAnalyticsViewProps, "daily" | "timeZoneByVersion">) {
	const { locale } = useI18n();
	const messages = useOwnerAnalyticsMessages();
	const keyboardScrollable = { tabIndex: 0 };
	return (
		<details className="owner-table-disclosure">
			<summary>
				<span>{messages.tableSummary}</span>
				<small>
					{formatNumber(daily.observedOpenMinutes, locale)}{" "}
					{messages.minutesRecordedSuffix}
				</small>
			</summary>
			<section
				className="owner-table-region"
				aria-label={messages.tableRegion}
				{...keyboardScrollable}
			>
				<table>
					<thead>
						<tr>
							<th scope="col">{messages.time}</th>
							<th scope="col">{messages.state}</th>
							<th scope="col">{messages.count}</th>
							<th scope="col">{messages.band}</th>
							<th scope="col">{messages.source}</th>
						</tr>
					</thead>
					<tbody>
						{daily.timeline.map((bucket) => (
							<tr key={bucket.minuteStartUtc} data-state={bucket.state}>
								<td>
									<bdi dir="auto">
										{bucketTime(bucket, locale, timeZoneByVersion)}
									</bdi>
								</td>
								<td>{bucketState(bucket, messages)}</td>
								<td>
									{bucket.state === "value" ? (
										<bdi>{formatNumber(bucket.count, locale)}</bdi>
									) : (
										"—"
									)}
								</td>
								<td>
									{bucket.state === "value" ? messages[bucket.band] : "—"}
								</td>
								<td>
									{bucket.state === "value" ? messages[bucket.source] : "—"}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</section>
		</details>
	);
}

export function OwnerAnalyticsView({
	daily,
	currentTimeZone,
	timeZoneByVersion,
}: OwnerAnalyticsViewProps) {
	const { locale } = useI18n();
	const messages = useOwnerAnalyticsMessages();
	const noObserved = daily.observedOpenMinutes === 0;
	const closedDay = noObserved && daily.expectedOpenMinutes === 0;
	const peakTime = daily.peak
		? formatGymTime(
				new Date(daily.peak.minuteStartUtc),
				locale,
				mappedTimeZone(daily.peak.settingsVersion, timeZoneByVersion),
			)
		: null;
	const businessDate = formatDate(
		new Date(`${daily.businessDay}T12:00:00.000Z`),
		locale,
		{ weekday: "long", day: "numeric", month: "long", year: "numeric" },
	);

	return (
		<div className="owner-analytics">
			<header className="owner-daily-heading" data-owner-navigation-anchor="">
				<h1>{messages.title}</h1>
				<p>
					<bdi dir="auto">{businessDate}</bdi>
				</p>
				<span className="sr-only">
					{messages.businessDay} <bdi>{daily.businessDay}</bdi>.{" "}
					{messages.currentTimeZone} <bdi>{currentTimeZone}</bdi>.
				</span>
			</header>
			<section className="owner-analytics-board" aria-label={messages.title}>
				<div className="owner-metrics">
					<AnalyticsMetric
						label={messages.peak}
						value={
							noObserved ? (
								messages.noReadingValue
							) : daily.peak ? (
								<bdi>{formatNumber(daily.peak.count, locale)}</bdi>
							) : (
								messages.noValue
							)
						}
						detail={
							noObserved ? (
								closedDay ? (
									messages.closedToday
								) : (
									messages.noReadingsYet
								)
							) : peakTime ? (
								<bdi dir="auto">{peakTime}</bdi>
							) : (
								messages.noValue
							)
						}
					/>
					<AnalyticsMetric
						label={messages.average}
						value={
							noObserved ? (
								messages.noReadingValue
							) : daily.dailyAverage === null ? (
								messages.noValue
							) : (
								<bdi>{formatDecimal(daily.dailyAverage, locale)}</bdi>
							)
						}
						detail={
							noObserved
								? closedDay
									? messages.closedToday
									: messages.noReadingsYet
								: `${messages.recordedMinutesPrefix} ${formatNumber(daily.observedOpenMinutes, locale)} ${messages.recordedMinutesSuffix}`
						}
					/>
					<AnalyticsMetric
						label={messages.crossings}
						value={
							noObserved && !closedDay ? (
								messages.noReadingValue
							) : (
								<bdi>
									{formatNumber(daily.estimatedEntranceCrossings, locale)}
								</bdi>
							)
						}
						detail={
							noObserved
								? closedDay
									? messages.closedToday
									: messages.noReadingsYet
								: // Concise observed-vs-scheduled comparison for the
									// total; no methodology disclaimer in the flow.
									`${formatNumber(daily.observedOpenMinutes, locale)} ${messages.crossingsOf} ${formatNumber(daily.expectedOpenMinutes, locale)} ${messages.crossingsOpenMinutes}`
						}
					/>
				</div>
				{noObserved ? (
					<section className="owner-empty-state" role="status">
						<BarChart3 aria-hidden="true" />
						<h2>
							{closedDay ? messages.closedDayTitle : messages.noObservedTitle}
						</h2>
						<p>
							{closedDay
								? messages.closedDayDescription
								: messages.noObservedDescription}
						</p>
					</section>
				) : (
					<OccupancyChart
						daily={daily}
						timeZoneByVersion={timeZoneByVersion}
						currentTimeZone={currentTimeZone}
					/>
				)}
				{noObserved ? null : (
					<AnalyticsTable daily={daily} timeZoneByVersion={timeZoneByVersion} />
				)}
			</section>
		</div>
	);
}

export function OwnerAnalyticsLoading() {
	const messages = useOwnerAnalyticsMessages();
	return (
		<section
			className="owner-analytics-state owner-analytics-state--loading owner-analytics-board"
			role="status"
			aria-live="polite"
		>
			<h1 className="sr-only">{messages.loading}</h1>
			<p className="sr-only">{messages.loadingDescription}</p>
			<div className="owner-loading-skeleton" aria-hidden="true">
				<div className="owner-loading-skeleton__metrics">
					{[0, 1, 2].map((index) => (
						<div key={index}>
							<i />
							<i />
							<i />
						</div>
					))}
				</div>
				<div className="owner-loading-skeleton__chart">
					<i />
					<span />
				</div>
				<div className="owner-loading-skeleton__summary">
					<i />
					<i />
				</div>
			</div>
		</section>
	);
}

export function OwnerAnalyticsError({ onRetry }: { onRetry: () => void }) {
	const messages = useOwnerAnalyticsMessages();
	return (
		<section
			className="owner-analytics-state owner-analytics-state--error owner-analytics-board"
			role="alert"
		>
			<div>
				<h1>{messages.errorTitle}</h1>
				<p>{messages.errorDescription}</p>
			</div>
			<Button type="button" onClick={onRetry}>
				{messages.retry}
			</Button>
		</section>
	);
}
