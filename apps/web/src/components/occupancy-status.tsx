import type { PublicOccupancyUsablePayload } from "@fitway/api/public-occupancy";
import {
	Activity,
	CircleCheck,
	CircleGauge,
	Clock3,
	Gauge,
	RadioTower,
	TriangleAlert,
} from "lucide-react";
import { useEffect, useRef } from "react";

import { formatGymTime, formatNumber, formatRelativeTime } from "@/i18n/format";
import { useI18n } from "@/i18n/provider";

const icons = {
	quiet: Activity,
	moderate: CircleGauge,
	busy: Gauge,
	packed: TriangleAlert,
};
const colors = {
	quiet: "var(--fw-quiet)",
	moderate: "var(--fw-moderate)",
	busy: "var(--fw-busy)",
	packed: "var(--fw-packed)",
};
const foregroundColors = {
	quiet: "var(--fw-quiet-fg)",
	moderate: "var(--fw-moderate-fg)",
	busy: "var(--fw-busy-fg)",
	packed: "var(--fw-packed-fg)",
};

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
	const Icon = icons[payload.band];
	const count = formatNumber(payload.count, locale);
	const percent = formatNumber(payload.percentFull, locale);
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
	const freshnessText =
		freshness === "fresh"
			? messages.publicPage.fresh
			: messages.publicPage.stale;
	const summary = messages.publicPage.summary(
		band,
		count,
		percent,
		messages.publicPage.open,
		freshnessText,
		absolute,
	);
	const lastSummary = useRef("");
	const announced = summary === lastSummary.current ? "" : summary;
	useEffect(() => {
		if (announced) lastSummary.current = summary;
	}, [announced, summary]);

	return (
		<section
			className={`w-full overflow-hidden rounded-2xl border bg-surface p-5 shadow-[var(--fw-shadow-lg)] sm:p-7 ${freshness === "stale" ? "opacity-80" : ""}`}
			aria-labelledby="occupancy-title"
		>
			<div className="flex items-center justify-between gap-3">
				<p className="m-0 text-muted-foreground text-sm">
					{freshness === "fresh"
						? messages.publicPage.eyebrow
						: messages.publicPage.lastKnown}
				</p>
				<span
					className="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-semibold text-sm"
					style={{
						borderColor: colors[payload.band],
						color: foregroundColors[payload.band],
					}}
				>
					<Icon className="size-4" aria-hidden="true" />
					{band}
				</span>
			</div>
			<div className="mt-4 flex justify-center">
				<span className="fw-status-open fw-status-open--open">
					<CircleCheck className="size-4" aria-hidden="true" />
					{messages.publicPage.open}
				</span>
			</div>
			<div className="mt-7 text-center">
				<p className="m-0 text-muted-foreground text-sm">
					{messages.publicPage.around}
				</p>
				<h1
					id="occupancy-title"
					className="m-0 inline-block min-h-[1.15em] min-w-[3ch] text-center font-black text-7xl tabular-nums leading-none tracking-tight sm:text-8xl"
				>
					<bdi>{count}</bdi>
				</h1>
				<p className="mt-2 text-muted-foreground">
					<bdi>{messages.publicPage.people}</bdi>
				</p>
			</div>
			<div className="mt-7">
				<div className="mb-2 flex justify-between gap-3 text-sm">
					<span>{band}</span>
					<strong className="tabular-nums">
						<bdi>{messages.publicPage.percentFull(percent)}</bdi>
					</strong>
				</div>
				<div
					className="rounded-full bg-surface-raised"
					style={
						freshness === "stale"
							? {
									backgroundImage:
										"repeating-linear-gradient(135deg, transparent 0 6px, rgb(255 255 255 / 8%) 6px 10px)",
								}
							: undefined
					}
				>
					<meter
						className={`block h-3 overflow-hidden rounded-full bg-transparent ${freshness === "stale" ? "opacity-60" : ""}`}
						min={0}
						max={100}
						value={payload.percentFull}
						aria-label={messages.publicPage.meterLabel}
						aria-valuetext={messages.publicPage.meterValue(percent, band)}
						style={{
							accentColor: colors[payload.band],
							inlineSize: "100%",
						}}
					/>
				</div>
			</div>
			<div className="mt-5 flex items-center gap-2 text-muted-foreground text-sm">
				{freshness === "fresh" ? (
					<RadioTower className="size-4" aria-hidden="true" />
				) : (
					<Clock3 className="size-4" aria-hidden="true" />
				)}
				<span>{freshnessText}</span>
				<span aria-hidden="true">·</span>
				<span>
					<bdi>{messages.publicPage.lastUpdated(absolute, relative)}</bdi>
				</span>
			</div>
			{freshness === "stale" ? (
				<div className="mt-5 flex gap-3 rounded-xl border border-[var(--fw-stale)] bg-[var(--fw-stale-bg)] p-4 text-sm">
					<TriangleAlert
						className="mt-0.5 size-5 shrink-0 text-[var(--fw-stale-fg)]"
						aria-hidden="true"
					/>
					<p className="m-0">
						{messages.publicPage.staleWarning(count, absolute)}
					</p>
				</div>
			) : null}
			<p className="fw-sr-only" aria-live="polite" aria-atomic="true">
				{announced}
			</p>
		</section>
	);
}
