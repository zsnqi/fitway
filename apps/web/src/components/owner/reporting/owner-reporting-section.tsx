import { Button } from "@fitway/ui/components/button";
import { type FormEvent, useId, useState } from "react";

import {
	REPORTING_DEFAULT_WINDOW_DAYS,
	REPORTING_QUERY_MAX_RANGE_DAYS,
	type ReportingRangeSelection,
	rangeProblem,
	useOwnerReporting,
	windowEndingOn,
} from "@/hooks/use-owner-reporting";
import { useI18n } from "@/i18n/provider";

import { OwnerAsyncSwap } from "../owner-async-swap";
import { OwnerDateField } from "../owner-date-field";
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
	const [dateValidity, setDateValidity] = useState({ start: true, end: true });
	const [validationRequested, setValidationRequested] = useState(false);
	const [appliedNotice, setAppliedNotice] = useState(false);
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
	// The 31-day preset is the reporting query's own bound, so the preset group states
	// the relationship between the quick ranges and the limit instead of leaving it out.
	// The pressed state marks the window in force, not the draft being edited.
	const presets = [
		{ days: 7, label: messages.presetLast7 },
		{ days: REPORTING_DEFAULT_WINDOW_DAYS, label: messages.presetLast28 },
		{ days: REPORTING_QUERY_MAX_RANGE_DAYS, label: messages.presetLast31 },
	].map((preset) => {
		const presetWindow = windowEndingOn(anchor, preset.days);
		return {
			...preset,
			applied:
				current.startBusinessDay === presetWindow.startBusinessDay &&
				current.endBusinessDay === presetWindow.endBusinessDay,
		};
	});

	const rangeValidationProblem =
		dateValidity.start && dateValidity.end
			? rangeProblemMessage(
					rangeProblem(editing, REPORTING_QUERY_MAX_RANGE_DAYS),
					messages,
					REPORTING_QUERY_MAX_RANGE_DAYS,
				)
			: messages.problemMalformed;
	const problem = validationRequested ? rangeValidationProblem : null;
	// An unapplied edit is only worth calling out when it is a window the section could
	// actually send. The invalid case already has its own message beside the fields.
	const pending =
		rangeValidationProblem === null &&
		(editing.startBusinessDay !== current.startBusinessDay ||
			editing.endBusinessDay !== current.endBusinessDay);

	function update(key: keyof ReportingRangeSelection, value: string) {
		setDraft({ ...editing, [key]: value });
	}

	function applySelection(selection: ReportingRangeSelection) {
		setDraft(null);
		setApplied(selection);
		setDateValidity({ start: true, end: true });
		setValidationRequested(false);
		setAppliedNotice(true);
	}

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setValidationRequested(true);
		// An unusable window is never sent and never silently corrected; the message
		// beside the field stays, and the answer already on screen stays with it.
		if (rangeValidationProblem) return;
		setDraft(null);
		setApplied(editing);
		setAppliedNotice(true);
	}

	const heatmap = reporting.heatmap.data;
	const comparison = reporting.comparison.data;
	const loadingHeatmap = reporting.heatmap.status === "pending";
	const pageDate = windowLabel(
		current.startBusinessDay,
		current.endBusinessDay,
		locale,
	);

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
						<h2 className="owner-reporting-board__title">
							{messages.rangeLegend}
						</h2>
						<p className="owner-reporting-board__meta" id={`${ids}-hint`}>
							{messages.rangeHint}
						</p>
					</div>
					<fieldset>
						<legend className="fw-sr-only">{messages.rangeLegend}</legend>
						<div className="owner-reporting-board__row">
							<OwnerDateField
								id={`${ids}-start`}
								label={messages.startLabel}
								value={editing.startBusinessDay}
								describedBy={problem ? `${ids}-problem` : `${ids}-hint`}
								invalid={problem !== null}
								referenceYear={Number(anchor.slice(0, 4))}
								onValidationRequest={() => setValidationRequested(true)}
								onValidationReset={() => setValidationRequested(false)}
								onValidityChange={(valid) =>
									setDateValidity((current) => ({ ...current, start: valid }))
								}
								onChange={(value) => update("startBusinessDay", value)}
							/>
							<OwnerDateField
								id={`${ids}-end`}
								label={messages.endLabel}
								value={editing.endBusinessDay}
								describedBy={problem ? `${ids}-problem` : `${ids}-hint`}
								invalid={problem !== null}
								referenceYear={Number(anchor.slice(0, 4))}
								onValidationRequest={() => setValidationRequested(true)}
								onValidationReset={() => setValidationRequested(false)}
								onValidityChange={(valid) =>
									setDateValidity((current) => ({ ...current, end: valid }))
								}
								onChange={(value) => update("endBusinessDay", value)}
							/>
							<div className="owner-reporting-range__tools">
								<div className="owner-reporting-range__actions">
									{pending ? (
										<p className="owner-reporting-range__pending" role="status">
											{messages.rangePending}
										</p>
									) : null}
									<Button type="submit">{messages.apply}</Button>
								</div>
								{/*
								 * A preset applies the moment it is chosen, exactly like the
								 * restore control it replaces; the pressed state marks the
								 * window currently in force, not the draft being edited.
								 */}
								<fieldset className="owner-reporting-range__presets">
									<legend className="fw-sr-only">
										{messages.presetsLegend}
									</legend>
									{presets.map((preset) => (
										<Button
											key={preset.days}
											type="button"
											variant="outline"
											aria-pressed={preset.applied}
											data-owner-reporting-preset={preset.days}
											onClick={() =>
												applySelection(windowEndingOn(anchor, preset.days))
											}
										>
											{preset.label}
										</Button>
									))}
								</fieldset>
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
						<p className="fw-sr-only" role="status" aria-live="polite">
							{appliedNotice ? `${messages.rangeApplied}: ${pageDate}` : ""}
						</p>
					</fieldset>
				</form>
				<OwnerReportingExport anchorBusinessDay={anchor} />
			</div>

			<div className="owner-reporting-block">
				<OwnerAsyncSwap
					stateKey={`${reporting.heatmap.status}:${heatmap ? "content" : "none"}`}
				>
					{loadingHeatmap ? <OwnerReportingLoading embedded /> : null}
					{reporting.heatmap.status === "error" ? (
						<OwnerReportingError
							title={messages.errorTitle}
							onRetry={reporting.heatmap.retry}
						/>
					) : null}
					{heatmap ? <OwnerReportingHeatmap heatmap={heatmap} /> : null}
				</OwnerAsyncSwap>
			</div>

			<div className="owner-reporting-lower">
				<div className="owner-reporting-block">
					<OwnerAsyncSwap
						stateKey={`${reporting.comparison.status}:${comparison ? "content" : "none"}`}
					>
						{reporting.comparison.status === "pending" ? (
							<OwnerReportingLoading
								embedded
								compact
								announce={!loadingHeatmap}
							/>
						) : null}
						{reporting.comparison.status === "error" ? (
							<OwnerReportingError
								title={messages.comparisonErrorTitle}
								onRetry={reporting.comparison.retry}
							/>
						) : null}
						{comparison ? (
							<OwnerReportingComparison comparison={comparison} />
						) : null}
					</OwnerAsyncSwap>
				</div>
				{heatmap ? (
					<div className="owner-reporting-block owner-reporting-block--disclosure">
						<OwnerReportingTable heatmap={heatmap} />
					</div>
				) : loadingHeatmap ? (
					<div className="owner-reporting-block">
						<OwnerReportingLoading embedded compact announce={false} />
					</div>
				) : null}
			</div>
		</section>
	);
}
