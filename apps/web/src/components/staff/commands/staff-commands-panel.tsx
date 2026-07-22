import type { OperationalSnapshot } from "@fitway/api/health/snapshot";
import { Button } from "@fitway/ui/components/button";
import { Input } from "@fitway/ui/components/input";
import { toORPCError } from "@orpc/client";
import {
	Ban,
	CircleCheck,
	Clock3,
	History,
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
	MAX_COMMAND_VALUE,
	normalizeCommandReason,
	parseDirectCount,
} from "./validation";
import "./commands.css";

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
	const messages = useStaffCommandMessages();
	const hintId = `${id}-hint`;
	const errorId = `${id}-error`;
	return (
		<div className="command-field">
			<label htmlFor={id}>{messages.reasonLabel}</label>
			<textarea
				id={id}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder={messages.reasonPlaceholder}
				maxLength={241}
				rows={2}
				aria-invalid={error ? true : undefined}
				aria-describedby={`${hintId}${error ? ` ${errorId}` : ""}`}
			/>
			<p id={hintId} className="command-field__hint">
				{messages.reasonHint}
			</p>
			{error ? (
				<p id={errorId} className="command-field__error">
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
	const commands = useStaffCommands({ snapshot, onAccepted: onRefresh });
	const errorStatus = commandErrorStatus(commands.error);

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
				<div>
					<p>{messages.eyebrow}</p>
					<h2 id="command-center-heading">{messages.title}</h2>
					<span>{messages.description}</span>
				</div>
				<RotateCcw aria-hidden="true" />
			</header>

			<p className="command-authority-note">
				<TriangleAlert aria-hidden="true" />
				{messages.edgeAuthority}
			</p>

			{commandError && errorStatus !== 401 ? (
				<div className="command-error" role="alert">
					<TriangleAlert aria-hidden="true" />
					<p>{commandError}</p>
				</div>
			) : null}

			<div className="command-center__forms">
				<form className="command-card" onSubmit={applyDelta} noValidate>
					<header>
						<h3>{messages.adjustmentTitle}</h3>
						<p>{messages.adjustmentDescription}</p>
					</header>
					<div className="command-current-reading">
						<span>{messages.currentCount}</span>
						<strong>
							{currentCount === null ? (
								messages.currentUnavailable
							) : (
								<bdi>{formatNumber(currentCount, locale)}</bdi>
							)}
						</strong>
					</div>
					<fieldset disabled={currentCount === null || commands.isSubmitting}>
						<legend>{messages.adjustment}</legend>
						<div className="command-stepper">
							<Button
								type="button"
								variant="secondary"
								size="icon"
								onClick={() =>
									setDelta((value) => Math.max(-(currentCount ?? 0), value - 1))
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
						<p className="command-card__notice">{messages.deltaUnavailable}</p>
					) : (
						<div className="command-result">
							<span>{messages.result}</span>
							<strong>
								<bdi>{formatNumber(projectedCount ?? 0, locale)}</bdi>
							</strong>
						</div>
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
					<header>
						<h3>{messages.directTitle}</h3>
						<p>{messages.directDescription}</p>
					</header>
					<div className="command-field">
						<label htmlFor="direct-command-value">{messages.directLabel}</label>
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
							<p id="direct-command-error" className="command-field__error">
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

			<section
				className="command-history"
				aria-labelledby="command-history-heading"
			>
				<header>
					<History aria-hidden="true" />
					<div>
						<p>{messages.historyEyebrow}</p>
						<h3 id="command-history-heading">{messages.historyTitle}</h3>
						<span>{messages.historyDescription}</span>
					</div>
				</header>
				{commands.history.length ? (
					<ol>
						{commands.history.map((command) => (
							<li key={command.id} data-status={command.status}>
								<StatusIcon status={command.status} />
								<div>
									<strong>
										{command.type === "reset_zero"
											? messages.resetToZero
											: messages.setTo(
													formatNumber(command.targetValue ?? 0, locale),
												)}
									</strong>
									<span>{messages.statuses[command.status]}</span>
									<small>
										<bdi>
											{messages.commandReference(
												formatNumber(command.id, locale),
												formatNumber(command.auditId, locale),
											)}
										</bdi>
									</small>
									{command.reason ? (
										<small>{messages.reasonValue(command.reason)}</small>
									) : null}
								</div>
							</li>
						))}
					</ol>
				) : (
					<p className="command-history__empty">{messages.historyEmpty}</p>
				)}
				<p className="fw-sr-only" role="status" aria-live="polite">
					{commands.history[0]
						? messages.commandAccepted(
								messages.statuses[commands.history[0].status],
							)
						: ""}
				</p>
			</section>

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
