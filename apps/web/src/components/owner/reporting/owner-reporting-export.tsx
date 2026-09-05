import { Button } from "@fitway/ui/components/button";
import { AlertTriangle, Download, Loader, Square } from "lucide-react";
import { type FormEvent, useId, useState } from "react";

import {
	CSV_DEFAULT_WINDOW_DAYS,
	CSV_MAX_RANGE_DAYS,
	type ReportingRangeSelection,
	rangeProblem,
	useOwnerCsvExport,
	windowEndingOn,
} from "@/hooks/use-owner-reporting";
import { formatNumber } from "@/i18n/format";
import { useI18n } from "@/i18n/provider";

import type { OwnerReportingMessages } from "./messages";
import {
	OwnerReportingLoading,
	OwnerReportingReady,
	OwnerReportingState,
} from "./owner-reporting-view";
import { useOwnerReportingMessages } from "./use-owner-reporting-messages";

export function rangeProblemMessage(
	problem: ReturnType<typeof rangeProblem>,
	messages: OwnerReportingMessages,
	maximumDays: number,
): string | null {
	if (problem === null) return null;
	if (problem === "incomplete") return messages.problemIncomplete;
	if (problem === "malformed") return messages.problemMalformed;
	if (problem === "inverted") return messages.problemInverted;
	return maximumDays === CSV_MAX_RANGE_DAYS
		? messages.problemCsvTooLong
		: messages.problemTooLong;
}

/**
 * Owner CSV export of per-minute history.
 *
 * The export owns its own window rather than sharing the heatmap's. The two bounds are
 * genuinely different — a month for the aggregate the page draws, a year for the file the
 * owner takes away — and one control carrying two limits would have to reject a window
 * that is perfectly valid for the thing the owner is actually asking for.
 *
 * A year of per-minute rows is a slow export, so the abort control is present for the
 * whole of it. Stopping keeps nothing: the state says so in words rather than leaving a
 * half-written file on the page looking like a result.
 */
export function OwnerReportingExport({
	anchorBusinessDay,
}: {
	anchorBusinessDay: string;
}) {
	const { locale } = useI18n();
	const messages = useOwnerReportingMessages();
	const csv = useOwnerCsvExport();
	const ids = useId();
	const [selection, setSelection] = useState<ReportingRangeSelection>(() =>
		windowEndingOn(anchorBusinessDay, CSV_DEFAULT_WINDOW_DAYS),
	);
	const problem = rangeProblemMessage(
		rangeProblem(selection, CSV_MAX_RANGE_DAYS),
		messages,
		CSV_MAX_RANGE_DAYS,
	);
	const exporting = csv.state.status === "exporting";

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (problem) return;
		csv.start(selection);
	}

	return (
		<div className="owner-reporting-block" data-owner-reporting-export="">
			{/*
			 * One title, one line, with the export's own limit beside it. The window
			 * legend stays as the field group's name for assistive technology, where it
			 * is a group label rather than a second visible heading.
			 */}
			<div className="owner-reporting-board__heading">
				<h3 className="owner-reporting-board__title">{messages.csvTitle}</h3>
			</div>

			<form className="owner-reporting-range" onSubmit={handleSubmit}>
				<fieldset>
					<legend className="fw-sr-only">{messages.csvLegend}</legend>
					<div className="owner-reporting-board__row">
						<div className="owner-reporting-field">
							<label htmlFor={`${ids}-start`}>{messages.startLabel}</label>
							<input
								id={`${ids}-start`}
								type="date"
								value={selection.startBusinessDay}
								aria-describedby={problem ? `${ids}-problem` : undefined}
								aria-invalid={problem ? true : undefined}
								onChange={(event) =>
									setSelection((current) => ({
										...current,
										startBusinessDay: event.target.value,
									}))
								}
							/>
						</div>
						<div className="owner-reporting-field">
							<label htmlFor={`${ids}-end`}>{messages.endLabel}</label>
							<input
								id={`${ids}-end`}
								type="date"
								value={selection.endBusinessDay}
								aria-describedby={problem ? `${ids}-problem` : undefined}
								aria-invalid={problem ? true : undefined}
								onChange={(event) =>
									setSelection((current) => ({
										...current,
										endBusinessDay: event.target.value,
									}))
								}
							/>
						</div>
						<div className="owner-reporting-range__actions">
							{/*
							 * Export stays visually secondary to reading: the
							 * outline treatment keeps it discoverable and fully
							 * functional without competing with Apply or the
							 * report figures, especially on mobile.
							 */}
							<Button
								type="submit"
								variant="outline"
								data-owner-reporting-export-start=""
								disabled={exporting || problem !== null}
							>
								<Download aria-hidden="true" />
								{messages.csvExport}
							</Button>
							{/*
							 * The abort control exists only while there is something to
							 * abort, so it is never a disabled control the owner has to
							 * interpret.
							 */}
							{exporting ? (
								<Button
									type="button"
									variant="outline"
									data-owner-reporting-export-abort=""
									onClick={csv.abort}
								>
									<Square aria-hidden="true" />
									{messages.csvAbort}
								</Button>
							) : null}
						</div>
					</div>
					{problem ? (
						<p
							className="owner-reporting__problem"
							id={`${ids}-problem`}
							data-owner-reporting-problem="csv"
							role="alert"
						>
							{problem}
						</p>
					) : null}
				</fieldset>
			</form>

			{csv.state.status === "exporting" ? (
				<>
					<OwnerReportingLoading />
					{/*
					 * Outside the live region on purpose. The card announces once that an
					 * export began; a growing row count announced on every chunk would be
					 * an unusable stream of speech (`DESIGN_GUIDE.md` §13).
					 */}
					<p className="owner-reporting__progress">
						{messages.csvRows} <bdi>{formatNumber(csv.state.rows, locale)}</bdi>
					</p>
				</>
			) : null}

			{csv.state.status === "ready" ? (
				<>
					<OwnerReportingReady
						title={messages.csvReadyTitle}
						description={messages.csvReadyDescription}
						action={
							<a
								className="owner-reporting-download"
								data-owner-reporting-download=""
								href={csv.state.href}
								download={csv.state.fileName}
							>
								<Download aria-hidden="true" />
								{messages.csvDownload}
							</a>
						}
					/>
					<p className="owner-reporting__progress">
						{messages.csvRows} <bdi>{formatNumber(csv.state.rows, locale)}</bdi>
					</p>
				</>
			) : null}

			{csv.state.status === "aborted" ? (
				<OwnerReportingState
					variant="stopped"
					icon={<Loader aria-hidden="true" />}
					title={messages.csvAbortedTitle}
					description={messages.csvAbortedDescription}
					action={
						<Button type="button" variant="outline" onClick={csv.reset}>
							{messages.csvStartOver}
						</Button>
					}
				/>
			) : null}

			{csv.state.status === "error" ? (
				<OwnerReportingState
					variant="error"
					icon={<AlertTriangle aria-hidden="true" />}
					title={
						csv.state.reason === "range"
							? messages.csvRangeErrorTitle
							: messages.csvTransportErrorTitle
					}
					description={
						csv.state.reason === "range"
							? messages.problemCsvTooLong
							: messages.csvTransportErrorDescription
					}
					action={
						<Button type="button" variant="outline" onClick={csv.reset}>
							{messages.csvStartOver}
						</Button>
					}
				/>
			) : null}
		</div>
	);
}
