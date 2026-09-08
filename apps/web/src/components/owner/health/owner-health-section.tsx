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
 * The window heading renders the payload's business-day count and timezone, so the
 * coverage shared by every figure below is stated before the first number.
 */
export function OwnerHealthSection() {
	const { locale } = useI18n();
	const messages = useOwnerHealthMessages();
	const health = useOwnerHealth();
	const ids = useId();
	const headingId = `${ids}-heading`;
	const summary = health.summary;
	const windowLabel = summary
		? [summary.window.businessDayFrom, summary.window.businessDayTo]
				.map((day) =>
					formatDate(new Date(`${day}T12:00:00.000Z`), locale, {
						day: "numeric",
						month: "long",
						year: "numeric",
					}),
				)
				.join(" – ")
		: null;

	// `/admin` already carries one live region and one retry while its own owner
	// query is in flight or failed. A second copy of either would compete with it,
	// so the section stands down entirely until the page itself has settled.
	if (health.status === "unavailable") return null;

	return (
		<section className="owner-health" aria-labelledby={headingId}>
			<header className="owner-health__heading" data-owner-navigation-anchor="">
				<h1 id={headingId}>{messages.title}</h1>
				{summary ? (
					<p className="owner-health__window">
						<bdi dir="auto">{windowLabel}</bdi>
					</p>
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
						<h2>{messages.offlineTitle}</h2>
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
						<h2>{messages.incidentsTitle}</h2>
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
				</>
			) : null}
		</section>
	);
}
