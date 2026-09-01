import { useId } from "react";

import { useOwnerHealth } from "@/hooks/use-owner-health";
import { formatDate, formatNumber } from "@/i18n/format";
import { useI18n } from "@/i18n/provider";

import {
	OwnerHealthEmpty,
	OwnerHealthError,
	OwnerHealthIncidentTable,
	OwnerHealthLoading,
	OwnerHealthMetrics,
	OwnerHealthOfflineTable,
	OwnerHealthUnmonitored,
} from "./owner-health-view";
import { useOwnerHealthMessages } from "./use-owner-health-messages";

import "./owner-health.css";

/**
 * The owner incident and uptime section (SPEC.md story 27).
 *
 * It reads and never writes: the transport leaf behind it exposes no append path, so
 * the frozen Phase 8 evaluator remains the only writer of either log.
 *
 * The window heading is rendered from the payload's own business days, so the period
 * every figure below shares is stated before the first number rather than assumed.
 */
export function OwnerHealthSection() {
	const { locale } = useI18n();
	const messages = useOwnerHealthMessages();
	const health = useOwnerHealth();
	const ids = useId();
	const headingId = `${ids}-heading`;
	const summary = health.summary;

	// `/admin` already carries one live region and one retry while its own owner
	// query is in flight or failed. A second copy of either would compete with it,
	// so the section stands down entirely until the page itself has settled.
	if (health.status === "unavailable") return null;

	const windowLabel = summary
		? `${formatDate(new Date(`${summary.window.businessDayFrom}T12:00:00.000Z`), locale, { month: "short", day: "numeric" })} - ${formatDate(
				new Date(`${summary.window.businessDayTo}T12:00:00.000Z`),
				locale,
				{ month: "short", day: "numeric", year: "numeric" },
			)}`
		: null;

	return (
		<section className="owner-health" aria-labelledby={headingId}>
			<header className="owner-health__heading">
				<h1 id={headingId}>{messages.title}</h1>
				<p>{messages.description}</p>
				{summary ? (
					<span className="owner-health__window">
						<span>
							{messages.windowLabel}
							<bdi dir="auto">{windowLabel}</bdi>
						</span>
						<span>
							{messages.windowDays}
							<bdi>{formatNumber(summary.window.businessDays, locale)}</bdi>
						</span>
						<span>
							{messages.timeZoneLabel}
							<bdi>{summary.window.timeZone}</bdi>
						</span>
					</span>
				) : null}
			</header>

			{health.status === "pending" ? <OwnerHealthLoading /> : null}
			{health.status === "error" ? (
				<OwnerHealthError onRetry={health.retry} />
			) : null}

			{summary ? (
				<>
					<OwnerHealthMetrics summary={summary} />

					{summary.connection.monitoringStartedAtUtc === null ? (
						<OwnerHealthUnmonitored />
					) : null}

					<div className="owner-health-block">
						<h3>{messages.offlineTitle}</h3>
						<p>{messages.offlineDescription}</p>
						{summary.connection.offlinePeriods.length === 0 ? (
							<OwnerHealthEmpty
								title={messages.offlineEmptyTitle}
								description={messages.offlineEmptyDescription}
							/>
						) : (
							<>
								<OwnerHealthOfflineTable
									periods={summary.connection.offlinePeriods}
									totalCount={summary.connection.offlinePeriodCount}
									timeZone={summary.window.timeZone}
								/>
								{/* The bound only earns a line when it actually hid a row. */}
								{summary.connection.offlinePeriodCount >
								summary.connection.offlinePeriods.length ? (
									<p className="owner-health__shown">
										{messages.offlineShown}{" "}
										<bdi>
											{formatNumber(
												summary.connection.offlinePeriods.length,
												locale,
											)}
										</bdi>{" "}
										{messages.offlineOf}{" "}
										<bdi>
											{formatNumber(
												summary.connection.offlinePeriodCount,
												locale,
											)}
										</bdi>
									</p>
								) : null}
							</>
						)}
					</div>

					<div className="owner-health-block">
						<h3>{messages.incidentsTitle}</h3>
						<p>{messages.incidentsDescription}</p>
						{summary.alerts.incidents.length === 0 ? (
							<OwnerHealthEmpty
								title={messages.incidentsEmptyTitle}
								description={messages.incidentsEmptyDescription}
							/>
						) : (
							<>
								<OwnerHealthIncidentTable
									incidents={summary.alerts.incidents}
									totalCount={summary.alerts.incidentCount}
									timeZone={summary.window.timeZone}
								/>
								{summary.alerts.incidentCount >
								summary.alerts.incidents.length ? (
									<p className="owner-health__shown">
										{messages.incidentsShown}{" "}
										<bdi>
											{formatNumber(summary.alerts.incidents.length, locale)}
										</bdi>{" "}
										{messages.offlineOf}{" "}
										<bdi>
											{formatNumber(summary.alerts.incidentCount, locale)}
										</bdi>
									</p>
								) : null}
							</>
						)}
					</div>

					<p className="owner-health__footnote">{messages.footnote}</p>
				</>
			) : null}
		</section>
	);
}
