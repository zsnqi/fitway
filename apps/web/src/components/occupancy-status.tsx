import type { PublicOccupancyUsablePayload } from "@fitway/api/public-occupancy";
import { Clock, TriangleAlert } from "lucide-react";
import { useEffect, useRef } from "react";

import { formatGymTime, formatNumber, formatRelativeTime } from "@/i18n/format";
import { useI18n } from "@/i18n/provider";
import { CrowdSignal } from "./crowd-signal";
import { PublicLiveCardShell } from "./public-live-card-shell";

export function OccupancyStatus({
	payload,
	freshness,
	now,
}: {
	payload: PublicOccupancyUsablePayload;
	freshness: "fresh" | "stale";
	now: Date;
}) {
	const { locale, messages } = useI18n();
	const count = formatNumber(payload.count, locale);
	const absolute = formatGymTime(
		new Date(payload.lastUpdatedAt),
		locale,
		payload.timeZone,
	);
	const relative = formatRelativeTime(
		new Date(payload.lastUpdatedAt),
		now,
		locale,
	);
	const band = messages.publicPage.bands[payload.band];
	const isStale = freshness === "stale";
	const freshnessText = isStale
		? messages.publicPage.stale
		: messages.publicPage.fresh;
	const summary = messages.publicPage.summary(
		band,
		count,
		isStale ? messages.publicPage.staleStatus : messages.publicPage.open,
		freshnessText,
		absolute,
	);
	const lastSummary = useRef("");
	const announced = summary === lastSummary.current ? "" : summary;
	useEffect(() => {
		if (announced) lastSummary.current = summary;
	}, [announced, summary]);

	const freshnessContent = (mobile: boolean) => (
		<>
			{isStale ? (
				<Clock className="public-live__freshness-icon" aria-hidden="true" />
			) : (
				<span className="public-live__broadcast" aria-hidden="true" />
			)}
			<strong className="public-live__freshness-primary">
				{freshnessText}
			</strong>
			{mobile ? (
				<span className="public-live__freshness-detail">
					<time dateTime={payload.lastUpdatedAt}>
						{messages.publicPage.lastUpdatedAt(absolute)}
					</time>
					<span aria-hidden="true"> · </span>
					<span>{relative}</span>
				</span>
			) : (
				<>
					<span className="public-live__separator" aria-hidden="true" />
					<time
						className="public-live__freshness-time"
						dateTime={payload.lastUpdatedAt}
					>
						{messages.publicPage.lastUpdatedAt(absolute)}
					</time>
					<span className="public-live__separator" aria-hidden="true" />
					<span className="public-live__freshness-relative">{relative}</span>
				</>
			)}
		</>
	);

	return (
		<PublicLiveCardShell
			data-freshness={freshness}
			data-band={payload.band}
			aria-labelledby="occupancy-status-title occupancy-title"
			aria-describedby="occupancy-spoken-summary"
			status={
				<span id="occupancy-status-title" className="public-live__open-status">
					<span
						className="public-live__open-dot"
						data-tone={isStale ? "stale" : "live"}
						aria-hidden="true"
					/>
					{isStale ? messages.publicPage.staleStatus : messages.publicPage.open}
				</span>
			}
			desktopFreshness={freshnessContent(false)}
			alert={
				isStale ? (
					<div className="public-live__stale-warning" role="status">
						<TriangleAlert aria-hidden="true" />
						<p>{messages.publicPage.staleWarning(count, absolute)}</p>
					</div>
				) : undefined
			}
			crowdLabel={
				<span>
					{isStale
						? messages.publicPage.lastKnownCrowdLevel
						: messages.publicPage.crowdLevel}
				</span>
			}
			crowdValue={
				<h1 id="occupancy-title" className="public-live__band-value">
					{band}
				</h1>
			}
			countLabel={
				<span id="occupancy-count-label">
					{isStale
						? messages.publicPage.lastKnownApproximateCount
						: messages.publicPage.approximateCount}
				</span>
			}
			countValue={
				<strong className="public-live__count-value">
					<bdi key={`${payload.count}-${freshness}`}>{count}</bdi>
				</strong>
			}
			signal={<CrowdSignal band={payload.band} stale={isStale} />}
			mobileFreshness={freshnessContent(true)}
		>
			<p
				id="occupancy-spoken-summary"
				className="fw-sr-only"
				aria-live={isStale ? "off" : "polite"}
				aria-atomic="true"
			>
				{announced}
			</p>
		</PublicLiveCardShell>
	);
}
