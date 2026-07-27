import type {
	AnalyticsTimelineBucket,
	AnalyticsValueBucket,
	DailyAnalytics,
} from "@fitway/api/analytics/daily-analytics";
import { Button } from "@fitway/ui/components/button";
import {
	AlertTriangle,
	BarChart3,
	Clock3,
	DoorOpen,
	Gauge,
	RefreshCw,
} from "lucide-react";
import {
	type KeyboardEvent,
	type PointerEvent,
	useMemo,
	useState,
} from "react";

import { formatGymTime, formatNumber } from "@/i18n/format";
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

function AnalyticsMetric({
	icon: Icon,
	label,
	value,
	detail,
}: {
	icon: typeof Gauge;
	label: string;
	value: React.ReactNode;
	detail: React.ReactNode;
}) {
	return (
		<article className="owner-metric">
			<div className="owner-metric__heading">
				<span>{label}</span>
				<Icon aria-hidden="true" />
			</div>
			<strong>{value}</strong>
			<p>{detail}</p>
		</article>
	);
}

type Range = { state: "closed" | "missing"; start: number; end: number };

function absentRanges(timeline: readonly AnalyticsTimelineBucket[]): Range[] {
	const ranges: Range[] = [];
	for (let index = 0; index < timeline.length; index += 1) {
		const bucket = timeline[index];
		if (!bucket || bucket.state === "value") continue;
		const previous = ranges.at(-1);
		if (previous?.state === bucket.state && previous.end === index - 1) {
			previous.end = index;
		} else {
			ranges.push({ state: bucket.state, start: index, end: index });
		}
	}
	return ranges;
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

function OccupancyChart({
	daily,
	timeZoneByVersion,
}: Pick<OwnerAnalyticsViewProps, "daily" | "timeZoneByVersion">) {
	const { locale } = useI18n();
	const messages = useOwnerAnalyticsMessages();
	const values = useMemo(
		() =>
			daily.timeline.flatMap((bucket, index) =>
				bucket.state === "value" ? [{ bucket, index }] : [],
			),
		[daily.timeline],
	);
	const [activePosition, setActivePosition] = useState(0);
	const active =
		values[Math.min(activePosition, Math.max(0, values.length - 1))];
	const width = 1000;
	const height = 300;
	const padX = 28;
	const padTop = 20;
	const padBottom = 38;
	const chartHeight = height - padTop - padBottom;
	const maxCount = Math.max(1, ...values.map(({ bucket }) => bucket.count));
	const xFor = (index: number) => {
		const ratio =
			daily.timeline.length <= 1 ? 0.5 : index / (daily.timeline.length - 1);
		const visualRatio = locale === "ar" ? 1 - ratio : ratio;
		return padX + visualRatio * (width - padX * 2);
	};
	const yFor = (count: number) => padTop + (1 - count / maxCount) * chartHeight;
	const runs = valueRuns(daily.timeline);
	const ranges = absentRanges(daily.timeline);

	function moveActive(delta: number) {
		setActivePosition((current) =>
			Math.min(values.length - 1, Math.max(0, current + delta)),
		);
	}

	function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
		if (event.key === "Home") setActivePosition(0);
		else if (event.key === "End") setActivePosition(values.length - 1);
		else if (event.key === "ArrowRight") moveActive(locale === "ar" ? -1 : 1);
		else if (event.key === "ArrowLeft") moveActive(locale === "ar" ? 1 : -1);
		else return;
		event.preventDefault();
	}

	function selectFromPointer(event: PointerEvent<HTMLButtonElement>) {
		const bounds = event.currentTarget.getBoundingClientRect();
		if (bounds.width <= 0 || values.length === 0) return;
		const visualRatio = Math.min(
			1,
			Math.max(0, (event.clientX - bounds.left) / bounds.width),
		);
		const ratio = locale === "ar" ? 1 - visualRatio : visualRatio;
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
				<div>
					<h2 id="owner-chart-title">{messages.chartTitle}</h2>
					<p>{messages.chartHint}</p>
				</div>
				<div className="owner-chart-panel__meta">
					<ul className="owner-chart-legend" aria-label={messages.state}>
						<li data-kind="value">{messages.legendObserved}</li>
						<li data-kind="missing">{messages.legendMissing}</li>
						<li data-kind="closed">{messages.legendClosed}</li>
						<li data-kind="zero">{messages.legendZero}</li>
					</ul>
					<div
						className="owner-chart-reading"
						data-active-reading
						aria-live="polite"
					>
						<span>{messages.selectedReading}</span>
						<strong>
							<bdi>{formatNumber(active.bucket.count, locale)}</bdi>
						</strong>
						<bdi dir="auto">{activeTime}</bdi>
					</div>
				</div>
			</div>
			<button
				type="button"
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
					<defs>
						<pattern
							id="owner-missing"
							width="8"
							height="8"
							patternUnits="userSpaceOnUse"
						>
							<path d="M-2 8L8-2M4 12L12 4" />
						</pattern>
					</defs>
					{[0, 0.5, 1].map((ratio) => (
						<line
							key={ratio}
							className="owner-chart__grid"
							x1={padX}
							x2={width - padX}
							y1={padTop + ratio * chartHeight}
							y2={padTop + ratio * chartHeight}
						/>
					))}
					{ranges.map((range) => {
						const first = xFor(range.start);
						const last = xFor(range.end);
						const bucketWidth =
							(width - padX * 2) / Math.max(1, daily.timeline.length);
						return (
							<rect
								key={`${range.state}-${range.start}`}
								className={`owner-chart__${range.state}`}
								x={Math.min(first, last) - bucketWidth / 2}
								y={padTop}
								width={Math.abs(last - first) + bucketWidth}
								height={chartHeight}
							/>
						);
					})}
					{runs.map((run) => (
						<polyline
							key={run[0]?.index}
							className="owner-chart__line"
							points={run
								.map(
									({ bucket, index }) => `${xFor(index)},${yFor(bucket.count)}`,
								)
								.join(" ")}
						/>
					))}
					{values.map(({ bucket, index }) => (
						<circle
							key={`point-${index}`}
							className="owner-chart__point"
							cx={xFor(index)}
							cy={yFor(bucket.count)}
							r="3"
						/>
					))}
					{values
						.filter(({ bucket }) => bucket.count === 0)
						.map(({ index }) => (
							<rect
								key={`zero-${index}`}
								className="owner-chart__zero"
								x={xFor(index) - 3}
								y={yFor(0) - 3}
								width="6"
								height="6"
							/>
						))}
					<circle
						className="owner-chart__active-halo"
						cx={xFor(active.index)}
						cy={yFor(active.bucket.count)}
						r="11"
					/>
					<circle
						className="owner-chart__active"
						cx={xFor(active.index)}
						cy={yFor(active.bucket.count)}
						r="5"
					/>
				</svg>
			</button>
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
			<summary>{messages.tableSummary}</summary>
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

	return (
		<div className="owner-analytics">
			<div className="owner-analytics__context">
				<span>
					{messages.businessDay} <bdi>{daily.businessDay}</bdi>
				</span>
				<span>
					{messages.currentTimeZone} <bdi>{currentTimeZone}</bdi>
				</span>
			</div>
			<section className="owner-metrics" aria-label={messages.title}>
				<AnalyticsMetric
					icon={BarChart3}
					label={messages.peak}
					value={
						daily.peak ? (
							<bdi>{formatNumber(daily.peak.count, locale)}</bdi>
						) : (
							messages.noValue
						)
					}
					detail={
						peakTime ? (
							<>
								<span>{messages.atTime}</span> <bdi dir="auto">{peakTime}</bdi>
							</>
						) : (
							messages.noValue
						)
					}
				/>
				<AnalyticsMetric
					icon={Clock3}
					label={messages.average}
					value={
						daily.dailyAverage === null ? (
							messages.noValue
						) : (
							<bdi>{formatDecimal(daily.dailyAverage, locale)}</bdi>
						)
					}
					detail={`${formatNumber(daily.observedOpenMinutes, locale)} ${messages.observed.toLocaleLowerCase()}`}
				/>
				<AnalyticsMetric
					icon={DoorOpen}
					label={messages.crossings}
					value={
						<bdi>{formatNumber(daily.estimatedEntranceCrossings, locale)}</bdi>
					}
					detail={messages.crossingsNote}
				/>
				<AnalyticsMetric
					icon={Gauge}
					label={messages.coverage}
					value={
						<bdi dir="ltr">
							{formatNumber(daily.observedOpenMinutes, locale)} /{" "}
							{formatNumber(daily.expectedOpenMinutes, locale)}
						</bdi>
					}
					detail={messages.coverageNote}
				/>
			</section>
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
				<OccupancyChart daily={daily} timeZoneByVersion={timeZoneByVersion} />
			)}
			<AnalyticsTable daily={daily} timeZoneByVersion={timeZoneByVersion} />
		</div>
	);
}

export function OwnerAnalyticsLoading() {
	const messages = useOwnerAnalyticsMessages();
	return (
		<section
			className="owner-analytics-state owner-analytics-state--loading"
			role="status"
			aria-live="polite"
		>
			<BarChart3 aria-hidden="true" />
			<div>
				<h2>{messages.loading}</h2>
				<p>{messages.loadingDescription}</p>
			</div>
			<div className="owner-loading-bars" aria-hidden="true">
				<i />
				<i />
				<i />
				<i />
				<i />
			</div>
		</section>
	);
}

export function OwnerAnalyticsError({ onRetry }: { onRetry: () => void }) {
	const messages = useOwnerAnalyticsMessages();
	return (
		<section
			className="owner-analytics-state owner-analytics-state--error"
			role="alert"
		>
			<AlertTriangle aria-hidden="true" />
			<div>
				<h2>{messages.errorTitle}</h2>
				<p>{messages.errorDescription}</p>
			</div>
			<Button type="button" onClick={onRetry}>
				<RefreshCw aria-hidden="true" />
				{messages.retry}
			</Button>
		</section>
	);
}
