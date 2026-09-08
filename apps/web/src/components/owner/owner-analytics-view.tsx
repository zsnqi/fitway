import type {
	AnalyticsTimelineBucket,
	AnalyticsValueBucket,
	DailyAnalytics,
} from "@fitway/api/analytics/daily-analytics";
import { Button } from "@fitway/ui/components/button";
import { Select } from "@fitway/ui/components/select";
import {
	BarChart3,
	Check,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import {
	type CSSProperties,
	type KeyboardEvent,
	type PointerEvent,
	useEffect,
	useId,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import { formatDate, formatGymTime, formatNumber } from "@/i18n/format";
import { useI18n } from "@/i18n/provider";

import type { OwnerAnalyticsMessages } from "./messages";
import { OwnerRetainedDisclosure } from "./owner-retained-disclosure";
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
function isCurrentBusinessDay(
	businessDay: string,
	timeZone: string,
	timeline: readonly AnalyticsTimelineBucket[],
): boolean {
	try {
		const today = new Intl.DateTimeFormat("en-CA", {
			timeZone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).format(new Date());
		// A gym day may continue after civil midnight. The server's timeline
		// defines that day; do not mislabel its live tail as a completed day.
		const now = Date.now();
		const first = timeline[0];
		const last = timeline.at(-1);
		return (
			today === businessDay ||
			Boolean(
				first &&
					last &&
					now >= Date.parse(first.minuteStartUtc) &&
					now < Date.parse(last.minuteStartUtc) + 60_000,
			)
		);
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
			{detail ? <p>{detail}</p> : null}
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
 * Short interruptions break the curve without extra endpoint marks. Only a
 * sustained outage earns a persistent duration annotation. Exact absent
 * minutes remain in the detail table regardless of their visual weight.
 */
export const MIN_ANNOTATED_GAP_MINUTES = 15;

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
		const last = previous?.at(-1);
		if (
			previous &&
			last?.index === index - 1 &&
			Date.parse(bucket.minuteStartUtc) -
				Date.parse(last.bucket.minuteStartUtc) ===
				60_000
		) {
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

const minuteFormatters = new Map<string, Intl.DateTimeFormat>();

function gymLocalMinute(instant: Date, timeZone: string): number | null {
	try {
		let formatter = minuteFormatters.get(timeZone);
		if (!formatter) {
			formatter = new Intl.DateTimeFormat("en-US", {
				timeZone,
				hour: "2-digit",
				minute: "2-digit",
				hourCycle: "h23",
			});
			if (minuteFormatters.size >= 64) minuteFormatters.clear();
			minuteFormatters.set(timeZone, formatter);
		}
		const parts = formatter.formatToParts(instant);
		const minute = Number(parts.find((part) => part.type === "minute")?.value);
		return Number.isSafeInteger(minute) ? minute : null;
	} catch {
		return null;
	}
}

/** Exact half-hour observations, with semantic boundaries kept in the curve.
 * Raw telemetry is never rewritten or averaged. Missing/closed runs always
 * split the path. Every retained peak and boundary is also inspectable; a
 * visible peak must not select a different half-hour reading beside it. */
export function chartOverview(
	timeline: readonly AnalyticsTimelineBucket[],
	timeZoneByVersion: ReadonlyMap<number, string>,
) {
	const cadence = timeline.flatMap((bucket, index) => {
		if (bucket.state !== "value") return [];
		const zone = mappedTimeZone(bucket.settingsVersion, timeZoneByVersion);
		const minute = gymLocalMinute(new Date(bucket.minuteStartUtc), zone);
		return minute !== null && minute % 30 === 0 ? [{ bucket, index }] : [];
	});
	const cadenceIndices = new Set(cadence.map(({ index }) => index));
	const dayPeak = timeline.reduce(
		(best, bucket) =>
			bucket.state === "value" ? Math.max(best, bucket.count) : best,
		0,
	);
	const runs = valueRuns(timeline).map((run) => {
		const peak = run.reduce((best, point) =>
			point.bucket.count > best.bucket.count ? point : best,
		);
		// Retain the exact high and low in each half-hour window when they
		// extend beyond both bounding readings by 5% of the day's peak (at
		// least two people). This is an overview prominence tolerance, never
		// a value cap: retained points and the global peak stay exact, while
		// smaller wiggles remain available in the untouched minute table.
		const extrema = new Set<number>();
		const prominence = Math.max(2, dayPeak * 0.05);
		const boundaries = run.filter(
			(point, position) =>
				position === 0 ||
				position === run.length - 1 ||
				cadenceIndices.has(point.index),
		);
		for (let position = 1; position < boundaries.length; position += 1) {
			const left = boundaries[position - 1];
			const right = boundaries[position];
			if (!left || !right) continue;
			const window = run.filter(
				(point) => point.index >= left.index && point.index <= right.index,
			);
			const high = window.reduce(
				(best, point) =>
					point.bucket.count > best.bucket.count ? point : best,
				left,
			);
			const low = window.reduce(
				(best, point) =>
					point.bucket.count < best.bucket.count ? point : best,
				left,
			);
			if (
				high.bucket.count - Math.max(left.bucket.count, right.bucket.count) >=
				prominence
			)
				extrema.add(high.index);
			if (
				Math.min(left.bucket.count, right.bucket.count) - low.bucket.count >=
				prominence
			)
				extrema.add(low.index);
		}
		return run.filter((point, position) => {
			const previous = run[position - 1];
			const next = run[position + 1];
			return (
				!previous ||
				!next ||
				cadenceIndices.has(point.index) ||
				extrema.has(point.index) ||
				point.index === peak.index ||
				(point.bucket.count === 0 &&
					(previous.bucket.count !== 0 || next.bucket.count !== 0)) ||
				previous.bucket.settingsVersion !== point.bucket.settingsVersion ||
				next.bucket.settingsVersion !== point.bucket.settingsVersion
			);
		});
	});
	const stops = runs.flat();
	return { runs, stops };
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
		const previous = points[index - 1];
		const after = points[index + 2];
		const dx = next.x - current.x;
		const slope = dx === 0 ? 0 : (next.y - current.y) / dx;
		// Shape-preserving tangents on the sparse, unevenly spaced observations.
		// X controls stay inside this time interval; extrema cannot overshoot.
		const tangent = (other: number) =>
			other * slope <= 0 ? 0 : (2 * other * slope) / (other + slope);
		const startSlope =
			previous && current.x !== previous.x
				? tangent((current.y - previous.y) / (current.x - previous.x))
				: slope;
		const endSlope =
			after && after.x !== next.x
				? tangent((after.y - next.y) / (after.x - next.x))
				: slope;
		const control1X = current.x + dx / 3;
		const minimumY = Math.min(current.y, next.y);
		const maximumY = Math.max(current.y, next.y);
		const control1Y = Math.min(
			maximumY,
			Math.max(minimumY, current.y + (startSlope * dx) / 3),
		);
		const control2X = next.x - dx / 3;
		const control2Y = Math.min(
			maximumY,
			Math.max(minimumY, next.y - (endSlope * dx) / 3),
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
 * the solid core. An SVG mask cuts out only the marker ellipse without
 * changing the original curve geometry, so the cutout stays
 * pixel-exact at every responsive width in both RTL and LTR.
 */
export const OWNER_CHART_MARKER_OUTER_PX_DESKTOP = 10;
export const OWNER_CHART_MARKER_OUTER_PX_MOBILE = 9;

type TooltipPresentation = {
	id: number;
	state: "entering" | "open" | "closing";
	left: string;
	top: string;
	y: string;
};

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
	const isLatestDay = isCurrentBusinessDay(
		daily.businessDay,
		currentTimeZone,
		daily.timeline,
	);
	const initialActive = isLatestDay
		? Math.max(0, values.length - 1)
		: Math.max(
				0,
				values.findIndex(
					({ bucket }) => bucket.minuteStartUtc === daily.peak?.minuteStartUtc,
				),
			);
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
	const [hoverIndex, setHoverIndex] = useState<
		number | "missing" | "closed" | null
	>(null);
	const [animateSelection, setAnimateSelection] = useState(false);
	const [readingCleared, setReadingCleared] = useState(false);
	const showActive = typeof hoverIndex !== "string";
	const hasSelected =
		showActive && (selectedIndex !== null || hoverIndex !== null);
	const overview = useMemo(
		() => chartOverview(daily.timeline, timeZoneByVersion),
		[daily.timeline, timeZoneByVersion],
	);
	const markerMaskId = useId();
	const interactionRef = useRef<HTMLButtonElement | null>(null);
	const tooltipPresentationRef = useRef<TooltipPresentation | null>(null);
	const tooltipPresenceIdRef = useRef(0);
	const tooltipFrameRef = useRef(0);
	const tooltipTimeoutRef = useRef(0);
	const [tooltipPresentation, setTooltipPresentation] =
		useState<TooltipPresentation | null>(null);
	const [plotSize, setPlotSize] = useState<{
		width: number;
		height: number;
	} | null>(null);
	useEffect(() => {
		const element = interactionRef.current;
		if (!element || typeof ResizeObserver === "undefined") return;
		const observe = () => {
			const rect = { width: element.clientWidth, height: element.clientHeight };
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
		values.find(({ index }) => index === (hoverIndex ?? selectedIndex)) ??
		values[initialActive];
	const latest = isLatestDay ? values.at(-1) : undefined;
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
	const runs = overview.runs;
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
	const timeTicks = useMemo(
		() => intentionalTimeTicks(daily.timeline, timeZoneByVersion),
		[daily.timeline, timeZoneByVersion],
	);

	function moveActive(delta: number) {
		const index = active?.index ?? 0;
		const next =
			delta > 0
				? (overview.stops.find((point) => point.index > index) ??
					overview.stops.at(-1))
				: (overview.stops.findLast((point) => point.index < index) ??
					overview.stops[0]);
		setHoverIndex(null);
		setSelectedIndex(next?.index ?? null);
		setReadingCleared(false);
	}

	function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
		setAnimateSelection(false);
		if (event.key === "Home") {
			setHoverIndex(null);
			setSelectedIndex(overview.stops[0]?.index ?? null);
			setReadingCleared(false);
		} else if (event.key === "End") {
			setHoverIndex(null);
			setSelectedIndex(overview.stops.at(-1)?.index ?? null);
			setReadingCleared(false);
		} else if (event.key === "Escape") {
			setHoverIndex(null);
			setSelectedIndex(null);
			setReadingCleared(true);
		} else if (event.key === "Enter" || event.key === " ") {
			setSelectedIndex(active?.index ?? null);
			setReadingCleared(false);
		} else if (event.key === "ArrowRight") moveActive(locale === "ar" ? -1 : 1);
		else if (event.key === "ArrowLeft") moveActive(locale === "ar" ? 1 : -1);
		else return;
		event.preventDefault();
	}

	function selectFromPointer(
		event: PointerEvent<HTMLButtonElement>,
		persistent = false,
	) {
		const bounds = event.currentTarget.getBoundingClientRect();
		if (bounds.width <= 0 || overview.stops.length === 0) return;
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
		// Hovering an outage must not claim a nearby observation occurred there.
		const hoveredBucket = daily.timeline[Math.round(timelineIndex)];
		if (hoveredBucket?.state !== "value") {
			setAnimateSelection(false);
			setHoverIndex(hoveredBucket?.state === "closed" ? "closed" : "missing");
			setReadingCleared(true);
			return;
		}
		const run = overview.runs.find(
			(points) =>
				timelineIndex >= (points[0]?.index ?? 0) - 0.5 &&
				timelineIndex <= (points.at(-1)?.index ?? 0) + 0.5,
		);
		const stops = overview.stops.filter(
			(point) =>
				point.index >= (run?.[0]?.index ?? Number.POSITIVE_INFINITY) &&
				point.index <= (run?.at(-1)?.index ?? Number.NEGATIVE_INFINITY),
		);
		if (stops.length === 0) return;
		let closestIndex = stops[0]?.index ?? 0;
		let distance = Number.POSITIVE_INFINITY;
		stops.forEach((value) => {
			const nextDistance = Math.abs(value.index - timelineIndex);
			if (nextDistance < distance) {
				distance = nextDistance;
				closestIndex = value.index;
			}
		});
		// Entering the plot, crossing an outage, keyboard navigation and taps
		// are immediate. Only successive observations in one connected run
		// ease together; the marker must never fly across absent data.
		setAnimateSelection(
			!persistent &&
				typeof hoverIndex === "number" &&
				hoverIndex >= (run?.[0]?.index ?? 0) &&
				hoverIndex <= (run?.at(-1)?.index ?? -1),
		);
		if (persistent) {
			setSelectedIndex(closestIndex);
			setHoverIndex(null);
		} else setHoverIndex(closestIndex);
		setReadingCleared(false);
	}

	const inspected = hasSelected && showActive ? active : undefined;
	const combinedMarker =
		latest !== undefined && inspected?.index === latest.index;
	const stemPoint = inspected ?? latest;
	const activeTime = active
		? bucketTime(active.bucket, locale, timeZoneByVersion)
		: "";
	const tooltipY =
		active &&
		(yFor(active.bucket.count) / height) * (plotSize?.height ?? height) < 72
			? "18px"
			: "calc(-100% - 14px)";
	const activeLabel = inspected
		? `${messages.selectedReading}: ${activeTime}, ${messages.count}: ${formatNumber(inspected.bucket.count, locale)}`
		: !readingCleared && active
			? `${messages.selectedReading}: ${activeTime}, ${messages.count}: ${formatNumber(active.bucket.count, locale)}`
			: "";
	const inspectedIndex = inspected?.index ?? null;
	const tooltipLeft = inspected
		? clampedCaptionLeft(xFor(inspected.index) / width, 110)
		: null;
	const tooltipTop = inspected
		? `${(yFor(inspected.bucket.count) / height) * 100}%`
		: null;

	useLayoutEffect(() => {
		if (tooltipFrameRef.current) {
			window.cancelAnimationFrame(tooltipFrameRef.current);
			tooltipFrameRef.current = 0;
		}
		if (tooltipTimeoutRef.current) {
			window.clearTimeout(tooltipTimeoutRef.current);
			tooltipTimeoutRef.current = 0;
		}
		const presenceId = ++tooltipPresenceIdRef.current;
		const reducedMotion = Boolean(
			window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
		);
		const publish = (next: TooltipPresentation | null) => {
			tooltipPresentationRef.current = next;
			setTooltipPresentation(next);
		};

		if (inspectedIndex !== null && tooltipLeft && tooltipTop) {
			const next: TooltipPresentation = {
				id: presenceId,
				state:
					reducedMotion || tooltipPresentationRef.current ? "open" : "entering",
				left: tooltipLeft,
				top: tooltipTop,
				y: tooltipY,
			};
			publish(next);
			if (next.state === "entering") {
				tooltipFrameRef.current = window.requestAnimationFrame(() => {
					tooltipFrameRef.current = 0;
					if (tooltipPresenceIdRef.current !== presenceId) return;
					publish({ ...next, state: "open" });
				});
			}
			return;
		}

		const current = tooltipPresentationRef.current;
		if (!current) return;
		if (reducedMotion) {
			publish(null);
			return;
		}
		publish({ ...current, id: presenceId, state: "closing" });
		tooltipTimeoutRef.current = window.setTimeout(() => {
			if (
				tooltipPresenceIdRef.current === presenceId &&
				tooltipPresentationRef.current?.state === "closing"
			) {
				publish(null);
			}
		}, 160);
	}, [inspectedIndex, tooltipLeft, tooltipTop, tooltipY]);

	useEffect(
		() => () => {
			if (tooltipFrameRef.current)
				window.cancelAnimationFrame(tooltipFrameRef.current);
			if (tooltipTimeoutRef.current)
				window.clearTimeout(tooltipTimeoutRef.current);
		},
		[],
	);

	if (!active) return null;
	const chartLabel = activeLabel
		? `${messages.chartLabel}. ${activeLabel}`
		: messages.chartLabel;
	function clearHover() {
		setAnimateSelection(false);
		setHoverIndex(null);
		if (selectedIndex === null) setReadingCleared(true);
	}

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
				<div className="owner-chart-plot">
					<button
						type="button"
						ref={interactionRef}
						className="owner-chart-interaction"
						data-owner-chart
						data-tracking={animateSelection ? "true" : undefined}
						aria-label={chartLabel}
						onKeyDown={handleKeyDown}
						onPointerMove={(event) => {
							if (event.pointerType !== "touch") selectFromPointer(event);
						}}
						onPointerDown={(event) => selectFromPointer(event, true)}
						onPointerLeave={clearHover}
						onPointerCancel={clearHover}
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
								if (gap.minutes < MIN_ANNOTATED_GAP_MINUTES) return [];
								const stemClass = gap.allClosed
									? "owner-chart__gap-stem owner-chart__gap-stem--closed"
									: "owner-chart__gap-stem owner-chart__gap-stem--missing";
								const leftX = xFor(left.index);
								const rightX = xFor(right.index);
								// Sustained interruptions retain their duration bracket. Short gaps
								// remain unconnected without decorative endpoint marks.
								const bracketY = baseY - 26;
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
								];
							})}
							<defs>
								<mask
									id={markerMaskId}
									maskUnits="userSpaceOnUse"
									x="0"
									y="-20"
									width={width}
									height={height + 40}
								>
									<rect
										x="0"
										y="-20"
										width={width}
										height={height + 40}
										fill="white"
									/>
									{latest ? (
										<ellipse
											className="owner-chart__cutout"
											cx={xFor(latest.index)}
											cy={yFor(latest.bucket.count)}
											rx={markerRx}
											ry={markerRy}
											fill="black"
										/>
									) : null}
									{inspected && !combinedMarker ? (
										<ellipse
											className="owner-chart__cutout"
											cx={xFor(inspected.index)}
											cy={yFor(inspected.bucket.count)}
											rx={markerRx}
											ry={markerRy}
											fill="black"
										/>
									) : null}
								</mask>
							</defs>
							{runs.map((run) => {
								const points = run.map(({ bucket, index }) => ({
									x: xFor(index),
									y: yFor(bucket.count),
								}));
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
										mask={`url(#${markerMaskId})`}
										d={line}
									/>
								);
							})}
							{runs.flat().map(({ bucket, index }) => (
								<circle
									key={`point-${index}`}
									className="owner-chart__point"
									cx={xFor(index)}
									cy={yFor(bucket.count)}
									r="3"
								/>
							))}
						</svg>
						{stemPoint &&
							yFor(stemPoint.bucket.count) + markerRy < baseY - 0.5 && (
								<span
									className="owner-chart__stem"
									aria-hidden="true"
									style={{
										left: `${(xFor(stemPoint.index) / width) * 100}%`,
										top: `${((yFor(stemPoint.bucket.count) + markerRy) / height) * 100}%`,
										height: `${((baseY - yFor(stemPoint.bucket.count) - markerRy) / height) * 100}%`,
									}}
								/>
							)}
						{latest ? (
							<span
								className="owner-chart__active owner-chart__active--latest"
								aria-hidden="true"
								data-chart-x={xFor(latest.index)}
								data-combined={combinedMarker ? "true" : undefined}
								style={{
									left: `${(xFor(latest.index) / width) * 100}%`,
									top: `${(yFor(latest.bucket.count) / height) * 100}%`,
								}}
							/>
						) : null}
						{inspected && !combinedMarker ? (
							<span
								className="owner-chart__active owner-chart__active--inspected"
								aria-hidden="true"
								data-chart-x={xFor(inspected.index)}
								style={{
									left: `${(xFor(inspected.index) / width) * 100}%`,
									top: `${(yFor(inspected.bucket.count) / height) * 100}%`,
								}}
							/>
						) : null}
						{latest
							? (() => {
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
												bottom:
													yFor(latest.bucket.count) / height > 0.84
														? `${(1 - yFor(latest.bucket.count) / height) * (plotSize?.height ?? height) + markerOuterPx + 8}px`
														: undefined,
												left: clampedCaptionLeft(
													xFor(latest.index) / width,
													55,
												),
											}}
										>
											<span>{messages.latest}</span> <bdi>{latestTime}</bdi>
										</span>
									);
								})()
							: null}
						{tooltipPresentation ? (
							<span
								className="owner-chart-tip"
								data-selected-reading={inspected ? "" : undefined}
								data-tooltip-state={tooltipPresentation.state}
								aria-hidden="true"
								style={
									{
										left: tooltipPresentation.left,
										top: tooltipPresentation.top,
										"--owner-chart-tip-y": tooltipPresentation.y,
									} as CSSProperties
								}
								onTransitionEnd={(event) => {
									if (
										event.propertyName === "opacity" &&
										tooltipPresentationRef.current?.state === "closing" &&
										tooltipPresentationRef.current.id ===
											tooltipPresenceIdRef.current
									) {
										tooltipPresentationRef.current = null;
										setTooltipPresentation(null);
									}
								}}
							>
								{inspected ? (
									<>
										<bdi dir="auto">{activeTime}</bdi>
										<span>
											{locale === "ar"
												? `${messages.presentPrefix} ${formatNumber(inspected.bucket.count, locale)} ${messages.presentSuffix}`
												: `${messages.presentPrefix}${formatNumber(inspected.bucket.count, locale)} ${messages.presentSuffix}`}
										</span>
									</>
								) : null}
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
	const [page, setPage] = useState(0);
	const pageSize = 60;
	const pageCount = Math.max(1, Math.ceil(daily.timeline.length / pageSize));
	const boundedPage = Math.min(page, pageCount - 1);
	const pageStart = boundedPage * pageSize;
	const pageRows = daily.timeline.slice(pageStart, pageStart + pageSize);
	const keyboardScrollable = { tabIndex: 0 };
	const pageItems = useMemo(
		() =>
			Array.from({ length: pageCount }, (_, index) => ({
				value: String(index),
				label: formatNumber(index + 1, locale),
			})),
		[locale, pageCount],
	);

	return (
		<OwnerRetainedDisclosure
			className="owner-table-disclosure"
			summary={
				<>
					<span className="owner-table-disclosure__title">
						{messages.tableSummary}
						<ChevronDown aria-hidden="true" />
					</span>
					<small>
						{messages.coverage}
						{" · "}
						<bdi>
							{daily.coverage === null
								? "—"
								: `${formatDecimal(daily.coverage * 100, locale)}%`}
						</bdi>
					</small>
				</>
			}
		>
			<p className="owner-coverage-detail">
				{messages.observedPrefix}{" "}
				{formatNumber(daily.observedOpenMinutes, locale)} {messages.crossingsOf}{" "}
				{formatNumber(daily.expectedOpenMinutes, locale)}{" "}
				{messages.scheduledMinutes}
			</p>
			<div className="owner-table-pagination">
				<p aria-live="polite">
					{messages.minuteRange}{" "}
					<bdi>
						{formatNumber(pageStart + (pageRows.length > 0 ? 1 : 0), locale)}
					</bdi>
					{"–"}
					<bdi>{formatNumber(pageStart + pageRows.length, locale)}</bdi>{" "}
					{messages.minuteTotal}{" "}
					<bdi>{formatNumber(daily.timeline.length, locale)}</bdi>
				</p>
				<div className="owner-table-pagination__controls">
					<Button
						type="button"
						variant="outline"
						aria-label={messages.previousPage}
						disabled={boundedPage === 0}
						onClick={() => setPage((current) => Math.max(0, current - 1))}
					>
						{locale === "ar" ? (
							<ChevronRight aria-hidden="true" />
						) : (
							<ChevronLeft aria-hidden="true" />
						)}
					</Button>
					<Select.Root
						items={pageItems}
						value={String(boundedPage)}
						modal={false}
						onValueChange={(next) => {
							if (next !== null) setPage(Number(next));
						}}
					>
						<Select.Trigger
							className="owner-table-pagination__page"
							aria-label={messages.minutePage}
						>
							<Select.Value>
								{(selected: string | null) =>
									formatNumber(Number(selected ?? boundedPage) + 1, locale)
								}
							</Select.Value>
							<Select.Icon className="owner-table-pagination__page-icon">
								<ChevronDown aria-hidden="true" />
							</Select.Icon>
						</Select.Trigger>
						<Select.Portal>
							<Select.Positioner
								className="owner-table-pagination__positioner"
								align="start"
								alignItemWithTrigger={false}
								sideOffset={6}
								collisionPadding={8}
								collisionAvoidance={{ side: "flip", align: "shift" }}
							>
								<Select.Popup className="owner-table-pagination__popup">
									<Select.List className="owner-table-pagination__list">
										{pageItems.map((item) => (
											<Select.Item
												key={item.value}
												value={item.value}
												label={item.label}
												className="owner-table-pagination__option"
											>
												<Select.ItemIndicator className="owner-table-pagination__check">
													<Check aria-hidden="true" />
												</Select.ItemIndicator>
												<Select.ItemText>{item.label}</Select.ItemText>
											</Select.Item>
										))}
									</Select.List>
								</Select.Popup>
							</Select.Positioner>
						</Select.Portal>
					</Select.Root>
					<Button
						type="button"
						variant="outline"
						aria-label={messages.nextPage}
						disabled={boundedPage >= pageCount - 1}
						onClick={() =>
							setPage((current) => Math.min(pageCount - 1, current + 1))
						}
					>
						{locale === "ar" ? (
							<ChevronLeft aria-hidden="true" />
						) : (
							<ChevronRight aria-hidden="true" />
						)}
					</Button>
				</div>
			</div>
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
						{pageRows.map((bucket) => (
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
		</OwnerRetainedDisclosure>
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
	const busiestEntryHour = useMemo(() => {
		const entryHours = new Map<string, { entries: number; label: string }>();
		const formatters = new Map<
			string,
			{ key: Intl.DateTimeFormat; label: Intl.DateTimeFormat }
		>();
		for (const bucket of daily.timeline) {
			if (bucket.state !== "value") continue;
			const zone = mappedTimeZone(bucket.settingsVersion, timeZoneByVersion);
			const date = new Date(bucket.minuteStartUtc);
			let formatter = formatters.get(zone);
			if (!formatter) {
				formatter = {
					key: new Intl.DateTimeFormat("en-CA", {
						timeZone: zone,
						year: "numeric",
						month: "2-digit",
						day: "2-digit",
						hour: "2-digit",
						hourCycle: "h23",
					}),
					label: new Intl.DateTimeFormat(
						locale === "ar" ? "ar-SA-u-nu-latn" : "en-US",
						{
							timeZone: zone,
							hour: "numeric",
							hour12: true,
						},
					),
				};
				formatters.set(zone, formatter);
			}
			const key = `${zone}:${formatter.key.format(date)}`;
			const hour = entryHours.get(key);
			const label = hour?.label ?? formatter.label.format(date);
			entryHours.set(key, {
				entries: (hour?.entries ?? 0) + bucket.entries,
				label,
			});
		}
		return [...entryHours.values()].sort((a, b) => b.entries - a.entries)[0];
	}, [daily.timeline, timeZoneByVersion, locale]);
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
								: messages.averageInsight
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
							noObserved ? (
								closedDay ? (
									messages.closedToday
								) : (
									messages.noReadingsYet
								)
							) : busiestEntryHour && busiestEntryHour.entries > 0 ? (
								<>
									{messages.busiestEntryHour}{" "}
									<bdi>{busiestEntryHour.label}</bdi>
								</>
							) : null
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
					<AnalyticsTable
						key={daily.businessDay}
						daily={daily}
						timeZoneByVersion={timeZoneByVersion}
					/>
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
