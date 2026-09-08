import type {
	HealthIncident,
	HealthIncidentSummary,
	HealthOfflinePeriod,
} from "@fitway/api/health/incidents";
import { Button } from "@fitway/ui/components/button";
import {
	Activity,
	AlertTriangle,
	CircleCheck,
	HelpCircle,
	RefreshCw,
} from "lucide-react";

import type { Locale } from "@/i18n/catalog";
import { formatDate, formatGymTime, formatNumber } from "@/i18n/format";
import { localeConfig } from "@/i18n/locale";
import { useI18n } from "@/i18n/provider";

import type { OwnerHealthMessages } from "./messages";
import { useOwnerHealthMessages } from "./use-owner-health-messages";

import "./owner-health.css";

/**
 * A ratio as a percentage in the reader's locale with Western digits.
 *
 * `Intl` places the sign correctly for Arabic; the fraction digit is kept so a long
 * outage inside a fourteen-day window is not rounded away into a flattering 100%.
 */
export function formatRatio(ratio: number, locale: Locale): string {
	return new Intl.NumberFormat(localeConfig[locale].intl, {
		style: "percent",
		minimumFractionDigits: ratio > 0 && ratio < 1 ? 1 : 0,
		maximumFractionDigits: 1,
	}).format(ratio);
}

/** Whole minutes as hours and minutes; never a bare, unlabeled number. */
export function formatDuration(
	minutes: number,
	locale: Locale,
	messages: OwnerHealthMessages,
): string {
	const hours = Math.floor(minutes / 60);
	const rest = minutes % 60;
	const parts: string[] = [];
	if (hours > 0)
		parts.push(`${formatNumber(hours, locale)}${messages.hoursShort}`);
	if (rest > 0 || hours === 0) {
		parts.push(`${formatNumber(rest, locale)}${messages.minutesShort}`);
	}
	return parts.join(" ");
}

/** The gym-local day and clock time of a persisted UTC instant. */
export function gymDayTime(
	instantUtc: string,
	locale: Locale,
	timeZone: string,
): string {
	const value = new Date(instantUtc);
	const day = formatDate(value, locale, {
		timeZone,
		month: "short",
		day: "numeric",
	});
	return `${day} ${formatGymTime(value, locale, timeZone)}`;
}

/** Delivery outcomes as words. A failed send is named, never coloured only. */
export function deliveryLabel(
	value: { delivered: number; failed: number; unconfirmed: number },
	locale: Locale,
	messages: OwnerHealthMessages,
): string {
	const parts: string[] = [];
	if (value.delivered > 0) {
		parts.push(
			messages.deliveredSummary(
				value.delivered,
				formatNumber(value.delivered, locale),
			),
		);
	}
	if (value.failed > 0) {
		parts.push(
			messages.failedSummary(value.failed, formatNumber(value.failed, locale)),
		);
	}
	if (value.unconfirmed > 0) {
		parts.push(
			messages.unconfirmedSummary(
				value.unconfirmed,
				formatNumber(value.unconfirmed, locale),
			),
		);
	}
	return parts.length === 0 ? messages.none : parts.join(" · ");
}

function Metric({
	label,
	value,
	detail,
	tone,
	indicator,
}: {
	label: string;
	value: string;
	detail: string;
	tone: "measured" | "unknown";
	indicator: "live" | "delayed" | "neutral";
}) {
	return (
		<div
			className="owner-health-metric"
			data-tone={tone}
			data-indicator={indicator}
		>
			<p className="owner-health-metric__label">{label}</p>
			<p className="owner-health-metric__value">
				<bdi>{value}</bdi>
			</p>
			<p className="owner-health-metric__detail">{detail}</p>
		</div>
	);
}

/**
 * The three headline figures.
 *
 * Each one states its own denominator in the detail line: uptime is over monitored
 * open minutes, coverage is over scheduled open minutes, and the notice outcomes are
 * over notices sent. No figure is presented over an implied whole.
 */
export function OwnerHealthMetrics({
	summary,
}: {
	summary: HealthIncidentSummary;
}) {
	const { locale } = useI18n();
	const messages = useOwnerHealthMessages();
	const { connection, alerts } = summary;
	return (
		<div className="owner-health-metrics" data-owner-health-metrics="">
			<Metric
				indicator="live"
				tone={connection.uptimeRatio === null ? "unknown" : "measured"}
				label={messages.uptimeLabel}
				value={
					connection.uptimeRatio === null
						? messages.uptimeUnknown
						: formatRatio(connection.uptimeRatio, locale)
				}
				detail={
					connection.uptimeRatio === null
						? messages.uptimeUnknownDetail
						: `${formatNumber(connection.onlineOpenMinutes, locale)} / ${formatNumber(connection.monitoredOpenMinutes, locale)} ${messages.uptimeOf}`
				}
			/>
			<Metric
				indicator="delayed"
				tone={connection.monitoredRatio === null ? "unknown" : "measured"}
				label={messages.coverageLabel}
				value={
					connection.monitoredRatio === null
						? messages.uptimeUnknown
						: formatRatio(connection.monitoredRatio, locale)
				}
				detail={`${formatNumber(connection.monitoredOpenMinutes, locale)} / ${formatNumber(connection.expectedOpenMinutes, locale)} ${messages.coverageOf}`}
			/>
			<Metric
				indicator="neutral"
				tone="measured"
				label={messages.noticesLabel}
				value={formatNumber(alerts.noticeCount, locale)}
				detail={[
					messages.noticesSummary(
						alerts.noticeCount,
						formatNumber(alerts.noticeCount, locale),
					),
					alerts.noticeCount === 0
						? null
						: deliveryLabel(alerts, locale, messages),
				]
					.filter((part): part is string => part !== null)
					.join(" · ")}
			/>
		</div>
	);
}

function ScrollRegion({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	// A labeled scroll region must be reachable by keyboard alone
	// (`DESIGN_GUIDE.md` §8, §13), exactly as the audit and analytics tables are.
	const keyboardScrollable = { tabIndex: 0 };
	return (
		<section
			className="owner-health-region"
			aria-label={label}
			{...keyboardScrollable}
		>
			{children}
		</section>
	);
}

export function OwnerHealthOfflineTable({
	periods,
	timeZone,
	totalCount,
}: {
	periods: readonly HealthOfflinePeriod[];
	timeZone: string;
	totalCount?: number;
}) {
	const { locale } = useI18n();
	const messages = useOwnerHealthMessages();
	const total = totalCount ?? periods.length;
	return (
		<ScrollRegion label={messages.offlineRegion}>
			<div className="owner-health__board-header">
				<span className="owner-health__board-title">
					{messages.offlineRegion}
				</span>
				<span className="owner-health__board-count">
					<bdi>{formatNumber(periods.length, locale)}</bdi> {messages.offlineOf}{" "}
					<bdi>{formatNumber(total, locale)}</bdi>
				</span>
			</div>
			<table data-owner-health-offline-table="">
				<thead>
					<tr>
						<th scope="col">{messages.offlineColumnStarted}</th>
						<th scope="col">{messages.offlineColumnEnded}</th>
						<th scope="col">{messages.offlineColumnLength}</th>
						<th scope="col">{messages.offlineColumnOpen}</th>
					</tr>
				</thead>
				<tbody>
					{periods.map((period) => (
						<tr
							key={period.startedAtUtc}
							data-ongoing={period.endedAtUtc === null ? "" : undefined}
							data-closed-only={period.openMinutes === 0 ? "" : undefined}
						>
							<td>
								<span className="owner-health__field-label" aria-hidden="true">
									{messages.offlineColumnStarted}
								</span>
								<bdi dir="auto">
									{gymDayTime(period.startedAtUtc, locale, timeZone)}
								</bdi>
							</td>
							<td>
								<span className="owner-health__field-label" aria-hidden="true">
									{messages.offlineColumnEnded}
								</span>
								{period.endedAtUtc === null ? (
									<span className="owner-health__flag">
										{messages.offlineOngoing}
									</span>
								) : (
									<bdi dir="auto">
										{gymDayTime(period.endedAtUtc, locale, timeZone)}
									</bdi>
								)}
							</td>
							<td>
								<span className="owner-health__field-label" aria-hidden="true">
									{messages.offlineColumnLength}
								</span>
								<bdo dir="ltr">
									{formatDuration(period.elapsedMinutes, locale, messages)}
								</bdo>
							</td>
							<td>
								<span className="owner-health__field-label" aria-hidden="true">
									{messages.offlineColumnOpen}
								</span>
								{period.openMinutes === 0 ? (
									<span className="owner-health__absent">
										{messages.offlineClosedOnly}
									</span>
								) : (
									<bdo dir="ltr">
										{formatDuration(period.openMinutes, locale, messages)}
									</bdo>
								)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</ScrollRegion>
	);
}

export function OwnerHealthIncidentTable({
	incidents,
	timeZone,
	totalCount,
}: {
	incidents: readonly HealthIncident[];
	timeZone: string;
	totalCount?: number;
}) {
	const { locale } = useI18n();
	const messages = useOwnerHealthMessages();
	const total = totalCount ?? incidents.length;
	return (
		<ScrollRegion label={messages.incidentsRegion}>
			<div className="owner-health__board-header">
				<span className="owner-health__board-title">
					{messages.incidentsRegion}
				</span>
				<span className="owner-health__board-count">
					<bdi>{formatNumber(incidents.length, locale)}</bdi>{" "}
					{messages.offlineOf} <bdi>{formatNumber(total, locale)}</bdi>
				</span>
			</div>
			<table data-owner-health-incident-table="">
				<thead>
					<tr>
						<th scope="col">{messages.incidentsColumnCondition}</th>
						<th scope="col">{messages.incidentsColumnStarted}</th>
						<th scope="col">{messages.incidentsColumnRecovered}</th>
						<th scope="col">{messages.incidentsColumnNotices}</th>
						<th scope="col">{messages.incidentsColumnDelivery}</th>
					</tr>
				</thead>
				<tbody>
					{incidents.map((incident) => (
						<tr
							key={`${incident.condition}-${incident.startedAtUtc}`}
							data-condition={incident.condition}
							data-ongoing={incident.recoveredAtUtc === null ? "" : undefined}
						>
							<td>
								<span className="owner-health__field-label" aria-hidden="true">
									{messages.incidentsColumnCondition}
								</span>
								{messages[incident.condition]}
							</td>
							<td>
								<span className="owner-health__field-label" aria-hidden="true">
									{messages.incidentsColumnStarted}
								</span>
								<bdi dir="auto">
									{gymDayTime(incident.startedAtUtc, locale, timeZone)}
								</bdi>
							</td>
							<td>
								<span className="owner-health__field-label" aria-hidden="true">
									{messages.incidentsColumnRecovered}
								</span>
								{incident.recoveredAtUtc === null ? (
									<span className="owner-health__flag">
										{messages.incidentsOngoing}
									</span>
								) : (
									<bdi dir="auto">
										{gymDayTime(incident.recoveredAtUtc, locale, timeZone)}
									</bdi>
								)}
							</td>
							<td>
								<span className="owner-health__field-label" aria-hidden="true">
									{messages.incidentsColumnNotices}
								</span>
								<bdi>{formatNumber(incident.noticeCount, locale)}</bdi>
							</td>
							<td>
								<span className="owner-health__field-label" aria-hidden="true">
									{messages.incidentsColumnDelivery}
								</span>
								<bdi dir="auto">
									{incident.failed === 0 && incident.unconfirmed === 0
										? messages.deliveryAllDelivered
										: deliveryLabel(incident, locale, messages)}
								</bdi>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</ScrollRegion>
	);
}

function StateCard({
	variant,
	icon,
	title,
	description,
	action,
}: {
	variant: "loading" | "error" | "empty" | "unmonitored";
	icon: React.ReactNode;
	title: string;
	description: string;
	action?: React.ReactNode;
}) {
	return (
		<section
			className={`owner-health-state owner-health-state--${variant}`}
			role={variant === "error" ? "alert" : "status"}
			{...(variant === "loading" ? { "aria-live": "polite" as const } : {})}
			data-owner-health-state={variant}
		>
			{icon}
			<div>
				<h2>{title}</h2>
				<p>{description}</p>
			</div>
			{action}
		</section>
	);
}

export function OwnerHealthLoading() {
	const messages = useOwnerHealthMessages();
	return (
		<StateCard
			variant="loading"
			icon={<Activity aria-hidden="true" />}
			title={messages.loading}
			description={messages.loadingDescription}
			action={
				<div className="owner-health-loading-bars" aria-hidden="true">
					<i />
					<i />
					<i />
				</div>
			}
		/>
	);
}

export function OwnerHealthError({ onRetry }: { onRetry: () => void }) {
	const messages = useOwnerHealthMessages();
	return (
		<StateCard
			variant="error"
			icon={<AlertTriangle aria-hidden="true" />}
			title={messages.errorTitle}
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

/**
 * No transition has ever been recorded, so uptime has no denominator at all. This is
 * deliberately not rendered as 100%: unknown and perfect are different facts.
 */
export function OwnerHealthUnmonitored() {
	const messages = useOwnerHealthMessages();
	return (
		<StateCard
			variant="unmonitored"
			icon={<HelpCircle aria-hidden="true" />}
			title={messages.unmonitoredTitle}
			description={messages.unmonitoredDescription}
		/>
	);
}

export function OwnerHealthEmpty({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	return (
		<StateCard
			variant="empty"
			icon={<CircleCheck aria-hidden="true" />}
			title={title}
			description={description}
		/>
	);
}
