import { Button } from "@fitway/ui/components/button";
import { type FormEvent, useId, useState } from "react";

import {
	REPORTING_QUERY_MAX_RANGE_DAYS,
	type ReportingRangeSelection,
	rangeProblem,
	useOwnerReporting,
} from "@/hooks/use-owner-reporting";
import { formatDate } from "@/i18n/format";
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
	const pageTitle = messages.pageTitle;

	if (prerequisite.isPending) {
		return (
			<section
				className="owner-reporting"
				aria-labelledby={`${ids}-page-heading`}
			>
				<header
					className="owner-reporting-page-heading"
					data-owner-navigation-anchor=""
				>
					<h1 id={`${ids}-page-heading`}>{pageTitle}</h1>
				</header>
				<OwnerReportingLoading />
			</section>
		);
	}

	if (prerequisite.isError || !prerequisite.data) {
		return (
			<section
				className="owner-reporting"
				aria-labelledby={`${ids}-page-heading`}
			>
				<header
					className="owner-reporting-page-heading"
					data-owner-navigation-anchor=""
				>
					<h1 id={`${ids}-page-heading`}>{pageTitle}</h1>
				</header>
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

	const heatmap = reporting.heatmap.data;
	const comparison = reporting.comparison.data;
	const loading =
		reporting.heatmap.status === "pending" ||
		reporting.comparison.status === "pending";
	const pageDate = formatDate(new Date(`${anchor}T12:00:00.000Z`), locale, {
		weekday: "long",
		day: "numeric",
		month: "long",
		year: "numeric",
	});

	return (
		<section
			className="owner-reporting"
			aria-labelledby={`${ids}-page-heading`}
		>
			<header
				className="owner-reporting-page-heading"
				data-owner-navigation-anchor=""
			>
				<h1 id={`${ids}-page-heading`}>{pageTitle}</h1>
				<p>
					{messages.gymTime} · <bdi>{reporting.timeZone}</bdi> ·{" "}
					<bdi dir="auto">{pageDate}</bdi>
				</p>
			</header>

			<div
				className="owner-reporting-controls"
				data-owner-reporting-controls=""
			>
				<form
					className="owner-reporting-range"
					data-owner-reporting-range=""
					onSubmit={handleSubmit}
				>
					{/*
					 * The board names itself once, on one line, with the window it accepts
					 * stated beside the name rather than as a paragraph under the controls.
					 * The legend still carries the group name for assistive technology.
					 */}
					<div className="owner-reporting-board__heading">
						<h3 className="owner-reporting-board__title">
							{messages.rangeLegend}
						</h3>
						<p className="owner-reporting-board__meta" id={`${ids}-hint`}>
							{messages.rangeHint}
						</p>
					</div>
					<fieldset>
						<legend className="fw-sr-only">{messages.rangeLegend}</legend>
						<div className="owner-reporting-board__row">
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
							<div className="owner-reporting-range__actions">
								<Button type="submit" disabled={problem !== null}>
									{messages.apply}
								</Button>
							</div>
						</div>
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
					</fieldset>
				</form>

				<OwnerReportingExport anchorBusinessDay={anchor} />
			</div>

			{/* One loading card for the section, not one for each leaf in flight. */}
			{loading ? <OwnerReportingLoading /> : null}

			<div className="owner-reporting-block">
				{reporting.heatmap.status === "error" ? (
					<OwnerReportingError
						title={messages.errorTitle}
						onRetry={reporting.heatmap.retry}
					/>
				) : null}
				{heatmap ? <OwnerReportingHeatmap heatmap={heatmap} /> : null}
			</div>

			<div className="owner-reporting-lower">
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
				{heatmap ? (
					<div className="owner-reporting-block owner-reporting-block--disclosure">
						<OwnerReportingTable heatmap={heatmap} />
					</div>
				) : null}
			</div>
		</section>
	);
}
