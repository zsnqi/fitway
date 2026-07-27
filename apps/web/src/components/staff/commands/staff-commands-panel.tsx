import type { OperationalSnapshot } from "@fitway/api/health/snapshot";
import { Button } from "@fitway/ui/components/button";
import { Input } from "@fitway/ui/components/input";
import { toORPCError } from "@orpc/client";
import {
	Ban,
	CircleCheck,
	Clock3,
	Minus,
	Plus,
	RotateCcw,
	TriangleAlert,
} from "lucide-react";
import {
	type FormEvent,
	type KeyboardEvent,
	useEffect,
	useRef,
	useState,
} from "react";

import { useStaffCommands } from "@/hooks/use-staff-commands";
import { formatNumber } from "@/i18n/format";
import { useI18n } from "@/i18n/provider";

import { useStaffCommandMessages } from "./messages";
import {
	isCommandReasonTooLong,
	MAX_COMMAND_REASON_LENGTH,
	MAX_COMMAND_VALUE,
	normalizeCommandReason,
	parseDirectCount,
} from "./validation";
import "./commands.css";

// The remaining-character hint stays hidden until the reason approaches its
// limit, so the common short reason carries no persistent instructional text.
const REASON_HINT_THRESHOLD = 40;

type StaffCommandsPanelProps = {
	snapshot: OperationalSnapshot;
	onRefresh: () => void | Promise<void>;
	onSessionExpired: () => void;
};

function currentCountFrom(snapshot: OperationalSnapshot): number | null {
	return snapshot.occupancy.freshness === "fresh" ||
		snapshot.occupancy.freshness === "stale"
		? snapshot.occupancy.count
		: null;
}

function commandErrorStatus(error: unknown): number | null {
	if (!error) return null;
	return toORPCError(error).status;
}

function ReasonField({
	id,
	value,
	onChange,
	error,
}: {
	id: string;
	value: string;
	onChange: (value: string) => void;
	error: string | null;
}) {
	const { locale } = useI18n();
	const messages = useStaffCommandMessages();
	const hintId = `${id}-hint`;
	const errorId = `${id}-error`;
	const remaining = MAX_COMMAND_REASON_LENGTH - value.trim().length;
	const showRemaining = remaining <= REASON_HINT_THRESHOLD;
	const describedBy = [showRemaining ? hintId : null, error ? errorId : null]
		.filter(Boolean)
		.join(" ");
	return (
		<div className="command-field">
			<label htmlFor={id}>{messages.reasonLabel}</label>
			<textarea
				id={id}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder={messages.reasonPlaceholder}
				maxLength={MAX_COMMAND_REASON_LENGTH + 1}
				rows={2}
				aria-invalid={error ? true : undefined}
				aria-describedby={describedBy || undefined}
			/>
			{showRemaining ? (
				// No live region: the counter is a visual affordance that would
				// otherwise re-announce on every keystroke. The over-limit message
				// below carries the announcement.
				<p id={hintId} className="command-field__hint">
					{messages.reasonRemaining(
						formatNumber(Math.max(0, remaining), locale),
					)}
				</p>
			) : null}
			{error ? (
				<p id={errorId} className="command-field__error" role="alert">
					{error}
				</p>
			) : null}
		</div>
	);
}

function StatusIcon({
	status,
}: {
	status: "pending" | "applied" | "superseded";
}) {
	if (status === "applied") return <CircleCheck aria-hidden="true" />;
	if (status === "superseded") return <Ban aria-hidden="true" />;
	return <Clock3 aria-hidden="true" />;
}

export function StaffCommandsPanel({
	snapshot,
	onRefresh,
	onSessionExpired,
}: StaffCommandsPanelProps) {
	const { locale } = useI18n();
	const messages = useStaffCommandMessages();
	const currentCount = currentCountFrom(snapshot);
	const [delta, setDelta] = useState(0);
	const [deltaReason, setDeltaReason] = useState("");
	const [deltaReasonError, setDeltaReasonError] = useState<string | null>(null);
	const [directValue, setDirectValue] = useState("");
	const [directReason, setDirectReason] = useState("");
	const [directError, setDirectError] = useState<string | null>(null);
	const [directReasonError, setDirectReasonError] = useState<string | null>(
		null,
	);
	const [resetReason, setResetReason] = useState("");
	const [resetReasonError, setResetReasonError] = useState<string | null>(null);
	const resetDialogRef = useRef<HTMLDialogElement>(null);
	const resetCancelRef = useRef<HTMLButtonElement>(null);
	const commands = useStaffCommands({ onAccepted: onRefresh });
	const errorStatus = commandErrorStatus(commands.error);
	const lastIssuedCommand =
		commands.lastIssuedCommandId === null
			? null
			: (commands.history.find(
					(command) => command.id === commands.lastIssuedCommandId,
				) ?? null);

	useEffect(() => {
		if (errorStatus === 401) {
			resetDialogRef.current?.close();
			onSessionExpired();
		}
	}, [errorStatus, onSessionExpired]);

	const projectedCount =
		currentCount === null ? null : Math.max(0, currentCount + delta);
	const commandError = commands.error
		? errorStatus === 400
			? messages.badRequest
			: errorStatus === 401
				? messages.sessionExpired
				: errorStatus === 403
					? messages.forbidden
					: messages.serviceError
		: null;

	async function applyDelta(event: FormEvent) {
		event.preventDefault();
		if (currentCount === null || delta === 0) return;
		if (isCommandReasonTooLong(deltaReason)) {
			setDeltaReasonError(messages.reasonTooLong);
			return;
		}
		setDeltaReasonError(null);
		const result = await commands.issueCorrection({
			delta,
			...(normalizeCommandReason(deltaReason)
				? { reason: normalizeCommandReason(deltaReason) }
				: {}),
		});
		if (result) {
			setDelta(0);
			setDeltaReason("");
		}
	}

	async function setDirect(event: FormEvent) {
		event.preventDefault();
		const parsed = parseDirectCount(directValue);
		const reasonTooLong = isCommandReasonTooLong(directReason);
		setDirectError(
			parsed.error === "required"
				? messages.directRequired
				: parsed.error === "western"
					? messages.directWestern
					: parsed.error === "range"
						? messages.directRange
						: null,
		);
		setDirectReasonError(reasonTooLong ? messages.reasonTooLong : null);
		if (parsed.value === null || reasonTooLong) return;
		const reason = normalizeCommandReason(directReason);
		const result = await commands.issueCorrection({
			absolute: parsed.value,
			...(reason ? { reason } : {}),
		});
		if (result) {
			setDirectValue("");
			setDirectReason("");
			setDirectError(null);
		}
	}

	async function confirmReset(event: FormEvent) {
		event.preventDefault();
		if (isCommandReasonTooLong(resetReason)) {
			setResetReasonError(messages.reasonTooLong);
			return;
		}
		setResetReasonError(null);
		const reason = normalizeCommandReason(resetReason);
		const result = await commands.issueReset(reason ? { reason } : {});
		if (result) {
			setResetReason("");
			resetDialogRef.current?.close();
		}
	}

	function openResetDialog() {
		commands.clearError();
		setResetReasonError(null);
		resetDialogRef.current?.showModal();
		resetCancelRef.current?.focus();
	}

	function trapResetDialogFocus(event: KeyboardEvent<HTMLDialogElement>) {
		if (event.key !== "Tab") return;
		const focusable = Array.from(
			event.currentTarget.querySelectorAll<HTMLElement>(
				'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
			),
		);
		const first = focusable[0];
		const last = focusable.at(-1);
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last?.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first?.focus();
		}
	}

	return (
		<section
			className="command-center"
			aria-labelledby="command-center-heading"
		>
			<header className="command-center__heading">
				<p>{messages.eyebrow}</p>
				<h2 id="command-center-heading">{messages.title}</h2>
				<span>{messages.description}</span>
			</header>

			{commandError && errorStatus !== 401 ? (
				<div className="command-error" role="alert">
					<TriangleAlert aria-hidden="true" />
					<p>{commandError}</p>
				</div>
			) : null}

			<div className="command-center__body">
				<div className="command-center__actions">
					<div className="command-center__forms">
						<form className="command-card" onSubmit={applyDelta} noValidate>
							<h3>{messages.adjustmentTitle}</h3>
							<fieldset
								disabled={currentCount === null || commands.isSubmitting}
							>
								<legend>{messages.adjustment}</legend>
								<div className="command-stepper">
									<Button
										type="button"
										variant="secondary"
										size="icon"
										onClick={() =>
											setDelta((value) =>
												Math.max(-(currentCount ?? 0), value - 1),
											)
										}
										aria-label={messages.decrease}
									>
										<Minus aria-hidden="true" />
									</Button>
									<output aria-live="polite">
										<bdi>
											{delta > 0 ? `+${delta}` : formatNumber(delta, locale)}
										</bdi>
									</output>
									<Button
										type="button"
										variant="secondary"
										size="icon"
										onClick={() =>
											setDelta((value) =>
												Math.min(
													MAX_COMMAND_VALUE - (currentCount ?? 0),
													value + 1,
												),
											)
										}
										aria-label={messages.increase}
									>
										<Plus aria-hidden="true" />
									</Button>
								</div>
							</fieldset>
							{currentCount === null ? (
								<p className="command-card__notice">
									{messages.deltaUnavailable}
								</p>
							) : (
								<p className="command-projection" data-active={delta !== 0}>
									{delta === 0
										? messages.adjustmentIdle
										: messages.projected(
												formatNumber(projectedCount ?? 0, locale),
											)}
								</p>
							)}
							<ReasonField
								id="delta-command-reason"
								value={deltaReason}
								onChange={setDeltaReason}
								error={deltaReasonError}
							/>
							<Button
								type="submit"
								disabled={
									currentCount === null || delta === 0 || commands.isSubmitting
								}
							>
								{commands.isSubmitting
									? messages.applying
									: messages.applyAdjustment}
							</Button>
						</form>

						<form className="command-card" onSubmit={setDirect} noValidate>
							<h3>{messages.directTitle}</h3>
							<div className="command-field">
								<label htmlFor="direct-command-value">
									{messages.directLabel}
								</label>
								<Input
									id="direct-command-value"
									type="text"
									inputMode="numeric"
									pattern="[0-9]*"
									dir="ltr"
									value={directValue}
									onChange={(event) => setDirectValue(event.target.value)}
									placeholder={messages.directPlaceholder}
									aria-invalid={directError ? true : undefined}
									aria-describedby={`direct-command-hint${directError ? " direct-command-error" : ""}`}
								/>
								<p id="direct-command-hint" className="command-field__hint">
									{messages.directHint}
								</p>
								{directError ? (
									<p
										id="direct-command-error"
										className="command-field__error"
										role="alert"
									>
										{directError}
									</p>
								) : null}
							</div>
							<ReasonField
								id="direct-command-reason"
								value={directReason}
								onChange={setDirectReason}
								error={directReasonError}
							/>
							<Button
								type="submit"
								variant="secondary"
								disabled={commands.isSubmitting}
							>
								{commands.isSubmitting ? messages.applying : messages.setDirect}
							</Button>
						</form>
					</div>

					<div className="command-reset-zone">
						<div>
							<p>{messages.resetEyebrow}</p>
							<h3>{messages.resetTitle}</h3>
							<span>{messages.resetDescription}</span>
						</div>
						<Button
							type="button"
							variant="destructive"
							onClick={openResetDialog}
							disabled={commands.isSubmitting}
						>
							<RotateCcw aria-hidden="true" />
							{messages.openReset}
						</Button>
					</div>
				</div>

				<section
					className="command-history"
					aria-labelledby="command-history-heading"
				>
					<header>
						<h3 id="command-history-heading">{messages.historyTitle}</h3>
						<span>{messages.historyDescription}</span>
					</header>
					{commands.isHistoryLoading ? (
						<p className="command-history__empty" role="status">
							{messages.historyLoading}
						</p>
					) : commands.historyError ? (
						<p className="command-history__empty" role="status">
							{messages.historyUnavailable}
						</p>
					) : commands.history.length ? (
						<ol>
							{commands.history.map((command) => (
								<li key={command.id} data-status={command.status}>
									<StatusIcon status={command.status} />
									<div>
										<strong>
											{command.type === "reset_zero" ? (
												messages.resetToZero
											) : (
												<>
													{messages.setTo}{" "}
													<bdi>
														{formatNumber(command.targetValue ?? 0, locale)}
													</bdi>
												</>
											)}
										</strong>
										<span>{messages.statuses[command.status]}</span>
										{command.reason ? (
											<q>
												{/* Quotation marks are decorative CSS content, so the reason */}
												{/* keeps a spoken label of its own. */}
												<span className="fw-sr-only">{messages.reason} </span>
												<bdi>{command.reason}</bdi>
											</q>
										) : null}
									</div>
								</li>
							))}
						</ol>
					) : (
						<p className="command-history__empty">{messages.historyEmpty}</p>
					)}
					<p className="fw-sr-only" role="status" aria-live="polite">
						{lastIssuedCommand
							? messages.commandAccepted(
									messages.statuses[lastIssuedCommand.status],
								)
							: ""}
					</p>
				</section>
			</div>

			<dialog
				ref={resetDialogRef}
				className="command-reset-dialog"
				aria-labelledby="reset-command-dialog-title"
				aria-describedby="reset-command-dialog-description"
				onKeyDown={trapResetDialogFocus}
				onClose={() => {
					setResetReasonError(null);
					commands.clearError();
				}}
			>
				<form onSubmit={confirmReset} noValidate>
					<div className="command-reset-dialog__icon">
						<TriangleAlert aria-hidden="true" />
					</div>
					<h2 id="reset-command-dialog-title">{messages.resetDialogTitle}</h2>
					<p id="reset-command-dialog-description">
						{messages.resetConsequence}
					</p>
					<ReasonField
						id="reset-command-reason"
						value={resetReason}
						onChange={setResetReason}
						error={resetReasonError}
					/>
					{commandError ? (
						<div className="command-error" role="alert">
							<TriangleAlert aria-hidden="true" />
							<p>{commandError}</p>
						</div>
					) : null}
					<div className="command-reset-dialog__actions">
						<Button
							type="button"
							variant="secondary"
							ref={resetCancelRef}
							onClick={() => resetDialogRef.current?.close()}
						>
							{messages.cancel}
						</Button>
						<Button
							type="submit"
							variant="destructive"
							disabled={commands.isSubmitting}
						>
							{commands.isSubmitting
								? messages.applying
								: messages.confirmReset}
						</Button>
					</div>
				</form>
			</dialog>
		</section>
	);
}
