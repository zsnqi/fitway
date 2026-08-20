import { Button } from "@fitway/ui/components/button";
import { type FormEvent, useId, useState } from "react";

import {
	inclusiveBusinessDayCount,
	REPORTING_DEFAULT_WINDOW_DAYS,
	REPORTING_QUERY_MAX_RANGE_DAYS,
	type ReportingRangeSelection,
	rangeProblem,
	useOwnerReporting,
	windowEndingOn,
} from "@/hooks/use-owner-reporting";
import { formatNumber } from "@/i18n/format";
import { useI18n } from "@/i18n/provider";

import type { OwnerDailyAnalyticsPrerequisite } from "./owner-analytics-mode-switch";
import {
	OwnerReportingExport,
	rangeProblemMessage,
} from "./owner-reporting-export";
import {
	OwnerReportingComparison,
	OwnerReportingError,
	OwnerReportingHeatmap,
	OwnerReportingLoading,
	OwnerReportingTable,
	windowLabel,
} from "./owner-reporting-view";
import { useOwnerReportingMessages } from "./use-owner-reporting-messages";

import "./owner-reporting.css";

/**
 * The owner reporting extension (`SPEC.md` stories 20, 22, and 23).
 *
 * It reads and never writes. The three leaves behind it expose no mutation path, so the
 * per-minute history remains the edge writer's alone.
 *
 * The route wrapper supplies the permanently observed Daily prerequisite. While History
 * is visible this section owns a visible pending or retryable error state for that shared
 * cause, then hands only the resolved timezone and business-day facts to its leaf hook.
 */
export function OwnerReportingSection({
	prerequisite,
}: {
	prerequisite: OwnerDailyAnalyticsPrerequisite;
}) {
	const { locale } = useI18n();
	const messages = useOwnerReportingMessages();
	const ids = useId();
	// Both pieces of form state start empty on purpose. The window in force is the one
	// the hook resolves from the gym's own business day, so nothing here has to correct
	// itself once the anchor arrives, and two owners in two device timezones open the
	// page on the same window.
	const [applied, setApplied] = useState<ReportingRangeSelection | null>(null);
	const [draft, setDraft] = useState<ReportingRangeSelection | null>(null);
	const reporting = useOwnerReporting(applied, {
		timeZone: prerequisite.data?.timeContext.current.timeZone ?? null,
		anchorBusinessDay: prerequisite.data?.daily.businessDay ?? null,
	});
	const anchor = reporting.anchorBusinessDay;
	const current = reporting.range;

	if (prerequisite.isPending) {
		return (
			<section className="owner-reporting" aria-label={messages.title}>
				<OwnerReportingLoading />
			</section>
		);
	}

	if (prerequisite.isError || !prerequisite.data) {
		return (
			<section className="owner-reporting" aria-label={messages.title}>
				<OwnerReportingError
					title={messages.errorTitle}
					onRetry={() => void prerequisite.refetch()}
				/>
			</section>
		);
	}

	if (!reporting.available || !anchor || !reporting.timeZone || !current) {
		return null;
	}

	const fallback = windowEndingOn(anchor, REPORTING_DEFAULT_WINDOW_DAYS);
	const editing = draft ?? current;

	const problem = rangeProblemMessage(
		rangeProblem(editing, REPORTING_QUERY_MAX_RANGE_DAYS),
		messages,
		REPORTING_QUERY_MAX_RANGE_DAYS,
	);

	function update(key: keyof ReportingRangeSelection, value: string) {
		setDraft({ ...editing, [key]: value });
	}

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		// An unusable window is never sent and never silently corrected; the message
		// beside the field stays, and the answer already on screen stays with it.
		if (problem) return;
		setApplied(editing);
	}

	function restoreDefault() {
		setDraft(fallback);
		setApplied(fallback);
	}

	const heatmap = reporting.heatmap.data;
	const comparison = reporting.comparison.data;
	const loading =
		reporting.heatmap.status === "pending" ||
		reporting.comparison.status === "pending";

	return (
		<section className="owner-reporting" aria-labelledby={`${ids}-heading`}>
			<header className="owner-reporting__heading">
				<h2 id={`${ids}-heading`}>{messages.title}</h2>
				<p>{messages.description}</p>
				<span className="owner-reporting__window">
					<span>
						{messages.windowLabel}
						<bdi dir="auto">
							{windowLabel(
								current.startBusinessDay,
								current.endBusinessDay,
								locale,
							)}
						</bdi>
					</span>
					<span>
						{messages.timeZoneLabel}
						<bdi>{reporting.timeZone}</bdi>
					</span>
				</span>
			</header>

			<form
				className="owner-reporting-range"
				data-owner-reporting-range=""
				onSubmit={handleSubmit}
			>
				<fieldset>
					<legend>{messages.rangeLegend}</legend>
					<div className="owner-reporting-range__fields">
						<div className="owner-reporting-field">
							<label htmlFor={`${ids}-start`}>{messages.startLabel}</label>
							<input
								id={`${ids}-start`}
								type="date"
								value={editing.startBusinessDay}
								aria-describedby={problem ? `${ids}-problem` : `${ids}-hint`}
								aria-invalid={problem ? true : undefined}
								onChange={(event) =>
									update("startBusinessDay", event.target.value)
								}
							/>
						</div>
						<div className="owner-reporting-field">
							<label htmlFor={`${ids}-end`}>{messages.endLabel}</label>
							<input
								id={`${ids}-end`}
								type="date"
								value={editing.endBusinessDay}
								aria-describedby={problem ? `${ids}-problem` : `${ids}-hint`}
								aria-invalid={problem ? true : undefined}
								onChange={(event) =>
									update("endBusinessDay", event.target.value)
								}
							/>
						</div>
					</div>
					<p className="owner-reporting__hint" id={`${ids}-hint`}>
						{messages.rangeHint}
					</p>
					{problem ? (
						<p
							className="owner-reporting__problem"
							id={`${ids}-problem`}
							data-owner-reporting-problem="range"
							role="alert"
						>
							{problem}
						</p>
					) : null}
					<div className="owner-reporting-range__actions">
						<Button type="submit" disabled={problem !== null}>
							{messages.apply}
						</Button>
						<Button type="button" variant="outline" onClick={restoreDefault}>
							{messages.restoreDefault}
						</Button>
					</div>
				</fieldset>
			</form>

			{/* One loading card for the section, not one for each leaf in flight. */}
			{loading ? <OwnerReportingLoading /> : null}

			<div className="owner-reporting-block">
				{reporting.heatmap.status === "error" ? (
					<OwnerReportingError
						title={messages.errorTitle}
						onRetry={reporting.heatmap.retry}
					/>
				) : null}
				{heatmap ? (
					<>
						<OwnerReportingHeatmap heatmap={heatmap} />
						<OwnerReportingTable heatmap={heatmap} />
						{/* The window the cells were actually built from, stated by the
						    payload itself rather than by the form beside it. */}
						<p className="owner-reporting__note">
							{messages.windowDays}{" "}
							<bdi>
								{formatNumber(
									inclusiveBusinessDayCount(
										heatmap.startBusinessDay,
										heatmap.endBusinessDay,
									),
									locale,
								)}
							</bdi>
						</p>
					</>
				) : null}
			</div>

			<div className="owner-reporting-block">
				{reporting.comparison.status === "error" ? (
					<OwnerReportingError
						title={messages.comparisonErrorTitle}
						onRetry={reporting.comparison.retry}
					/>
				) : null}
				{comparison ? (
					<OwnerReportingComparison comparison={comparison} />
				) : null}
			</div>

			<OwnerReportingExport anchorBusinessDay={anchor} />

			<p className="owner-reporting__footnote">{messages.footnote}</p>
		</section>
	);
}
