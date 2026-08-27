import type {
	OwnerCredentialResetInput,
	OwnerDeactivateInput,
	OwnerProvisionInput,
	OwnerReactivateInput,
	PrincipalGovernance,
	StaffPinDeactivateInput,
} from "@fitway/api/access/contracts";
import { Button } from "@fitway/ui/components/button";
import { AlertTriangle, KeyRound, RefreshCw, Users } from "lucide-react";
import { type FormEvent, useEffect, useId, useRef, useState } from "react";

import type {
	OwnerAccessMutation,
	OwnerAccessMutationOutcome,
} from "@/hooks/use-owner-access";

import type { OwnerAccessMessages } from "./messages";
import { useOwnerAccessMessages } from "./use-owner-access-messages";

import "./owner-access.css";

/**
 * A typed refusal or an unnamed failure, as a short announcement.
 *
 * A refusal is rendered with its own stable governance code so the copy can
 * name the exact reason; an unnamed failure gets the generic retry line. Idle,
 * pending, and success render nothing — success is the principal list changing.
 */
export function OwnerAccessRefusal({
	outcome,
}: {
	outcome: OwnerAccessMutationOutcome;
}) {
	const messages = useOwnerAccessMessages();
	if (outcome.phase === "refused") {
		return (
			<p
				className="owner-access__refusal"
				role="alert"
				data-owner-access-refusal={outcome.code}
			>
				{messages.refusals[outcome.code]}
			</p>
		);
	}
	if (outcome.phase === "failed") {
		return (
			<p
				className="owner-access__failure"
				role="alert"
				data-owner-access-failure=""
			>
				{messages.failedToApply}
			</p>
		);
	}
	return null;
}

/**
 * The one-time staff PIN reveal, shared by provision and rotate.
 *
 * It is a focused, self-contained dialog rather than a live region on the whole
 * section: announcing it never makes a screen reader re-read the owners list.
 * Focus is placed deliberately — the dismiss control receives it the moment the
 * reveal appears — and returned deliberately to whichever control invoked the
 * mutation when the reveal is dismissed, so focus never falls to the body.
 */
export function OwnerAccessReveal({
	pin,
	returnFocus,
	onDismiss,
}: {
	pin: string;
	returnFocus: HTMLElement | null;
	onDismiss: () => void;
}) {
	const messages = useOwnerAccessMessages();
	const ids = useId();
	const dismissRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		dismissRef.current?.focus();
		return () => {
			returnFocus?.focus();
		};
	}, [returnFocus]);

	function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
		if (event.key === "Escape") {
			event.preventDefault();
			onDismiss();
			return;
		}
		if (event.key === "Tab") {
			event.preventDefault();
			dismissRef.current?.focus();
		}
	}

	return (
		<section
			className="owner-access-reveal"
			role="dialog"
			aria-modal="false"
			aria-labelledby={`${ids}-title`}
			aria-describedby={`${ids}-warning`}
			onKeyDown={handleKeyDown}
			data-owner-access-reveal=""
		>
			<KeyRound aria-hidden="true" />
			<div className="owner-access-reveal__copy">
				<h3 id={`${ids}-title`}>{messages.revealTitle}</h3>
				<p id={`${ids}-warning`}>{messages.revealWarning}</p>
			</div>
			<dl className="owner-access-reveal__value">
				<dt>{messages.revealPinLabel}</dt>
				<dd>
					<bdi dir="ltr">{pin}</bdi>
				</dd>
			</dl>
			<button
				ref={dismissRef}
				type="button"
				className="owner-access-reveal__dismiss"
				onClick={onDismiss}
			>
				{messages.revealDismiss}
			</button>
		</section>
	);
}

function StateCard({
	variant,
	icon,
	title,
	description,
	action,
}: {
	variant: "loading" | "error" | "empty";
	icon: React.ReactNode;
	title: string;
	description: string;
	action?: React.ReactNode;
}) {
	return (
		<section
			className={`owner-access-state owner-access-state--${variant}`}
			role={variant === "error" ? "alert" : "status"}
			{...(variant === "loading" ? { "aria-live": "polite" as const } : {})}
			data-owner-access-state={variant}
		>
			{icon}
			<div>
				<h3>{title}</h3>
				<p>{description}</p>
			</div>
			{action}
		</section>
	);
}

export function OwnerAccessLoading() {
	const messages = useOwnerAccessMessages();
	return (
		<StateCard
			variant="loading"
			icon={<KeyRound aria-hidden="true" />}
			title={messages.loading}
			description={messages.loadingDescription}
			action={
				<div className="owner-access-loading-bars" aria-hidden="true">
					<i />
					<i />
					<i />
				</div>
			}
		/>
	);
}

export function OwnerAccessError({ onRetry }: { onRetry: () => void }) {
	const messages = useOwnerAccessMessages();
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

export function OwnerAccessEmpty() {
	const messages = useOwnerAccessMessages();
	return (
		<StateCard
			variant="empty"
			icon={<Users aria-hidden="true" />}
			title={messages.emptyTitle}
			description={messages.emptyDescription}
		/>
	);
}

function staffPinStateLabel(
	staff: PrincipalGovernance | null,
	messages: OwnerAccessMessages,
): string {
	if (staff?.credentialActive === true) return messages.staffPinActive;
	if (staff?.credentialActive === false) return messages.staffPinInactive;
	return messages.staffPinNotProvisioned;
}

function staffPinTone(staff: PrincipalGovernance | null): string {
	if (staff?.credentialActive === true) return "active";
	if (staff?.credentialActive === false) return "inactive";
	return "none";
}

const provisionDraftInitial = { email: "", displayName: "", password: "" };

type OwnerPasswordError = "required" | "min" | "max" | null;

function ownerPasswordError(password: string): OwnerPasswordError {
	if (password.length === 0) return "required";
	if (password.length < 12) return "min";
	if (password.length > 200) return "max";
	return null;
}

/** A settled success closes the form that produced it; a refusal stays open. */
function closeOnSuccess(
	phase: OwnerAccessMutationOutcome["phase"],
	close: () => void,
) {
	if (phase === "success") close();
}

export function OwnerAccessLive({
	principals,
	revealedPin,
	dismissRevealedPin,
	provisionStaffPin,
	rotateStaffPin,
	deactivateStaffPin,
	provisionOwner,
	deactivateOwner,
	reactivateOwner,
	resetOwnerCredential,
}: {
	principals: readonly PrincipalGovernance[];
	revealedPin: string | null;
	dismissRevealedPin: () => void;
	provisionStaffPin: OwnerAccessMutation<void>;
	rotateStaffPin: OwnerAccessMutation<void>;
	deactivateStaffPin: OwnerAccessMutation<StaffPinDeactivateInput>;
	provisionOwner: OwnerAccessMutation<OwnerProvisionInput>;
	deactivateOwner: OwnerAccessMutation<OwnerDeactivateInput>;
	reactivateOwner: OwnerAccessMutation<OwnerReactivateInput>;
	resetOwnerCredential: OwnerAccessMutation<OwnerCredentialResetInput>;
}) {
	const messages = useOwnerAccessMessages();
	const ids = useId();
	const fieldId = (name: string) => `${ids}-${name}`;

	const revealReturnRef = useRef<HTMLElement | null>(null);

	const [staffPinDeactivating, setStaffPinDeactivating] = useState(false);
	const [staffPinReason, setStaffPinReason] = useState("");

	const [deactivatingOwnerId, setDeactivatingOwnerId] = useState<string | null>(
		null,
	);
	const [ownerReason, setOwnerReason] = useState("");
	const [resettingOwnerId, setResettingOwnerId] = useState<string | null>(null);
	const [ownerPassword, setOwnerPassword] = useState("");
	const [resetPasswordError, setResetPasswordError] =
		useState<OwnerPasswordError>(null);
	const [reactivatingOwnerId, setReactivatingOwnerId] = useState<string | null>(
		null,
	);

	const [provisionDraft, setProvisionDraft] = useState(provisionDraftInitial);
	const [provisionPasswordError, setProvisionPasswordError] =
		useState<OwnerPasswordError>(null);
	const [provisionOpen, setProvisionOpen] = useState(false);

	const staff =
		principals.find((p) => p.principalKind === "shared_staff") ?? null;
	const owners = principals.filter((p) => p.principalKind === "owner");

	// The reveal's focus return target is captured at the moment the trigger is
	// invoked, not when the reveal mounts, so a pending mutation that blurs its
	// button cannot lose the target.
	function requestReveal(submit: () => void) {
		revealReturnRef.current =
			document.activeElement instanceof HTMLElement
				? document.activeElement
				: null;
		submit();
	}

	function clearReset() {
		setResettingOwnerId(null);
		setOwnerPassword("");
		setResetPasswordError(null);
		resetOwnerCredential.reset();
	}

	function openReset(ownerId: string) {
		// The credential draft and refusal belong to a particular principal. Never
		// carry either from one owner to another.
		clearReset();
		setResettingOwnerId(ownerId);
	}

	function passwordValidationMessage(error: Exclude<OwnerPasswordError, null>) {
		return messages.ownerPasswordErrors[error];
	}

	useEffect(() => {
		closeOnSuccess(deactivateStaffPin.outcome.phase, () => {
			setStaffPinDeactivating(false);
			setStaffPinReason("");
		});
	}, [deactivateStaffPin.outcome.phase]);

	useEffect(() => {
		closeOnSuccess(deactivateOwner.outcome.phase, () => {
			setDeactivatingOwnerId(null);
			setOwnerReason("");
		});
	}, [deactivateOwner.outcome.phase]);

	useEffect(() => {
		closeOnSuccess(resetOwnerCredential.outcome.phase, () => {
			setResettingOwnerId(null);
			setOwnerPassword("");
			setResetPasswordError(null);
		});
	}, [resetOwnerCredential.outcome.phase]);

	useEffect(() => {
		closeOnSuccess(reactivateOwner.outcome.phase, () => {
			setReactivatingOwnerId(null);
		});
	}, [reactivateOwner.outcome.phase]);

	useEffect(() => {
		closeOnSuccess(provisionOwner.outcome.phase, () => {
			setProvisionDraft(provisionDraftInitial);
			setProvisionPasswordError(null);
			setProvisionOpen(false);
		});
	}, [provisionOwner.outcome.phase]);

	function handleProvisionOwner(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const error = ownerPasswordError(provisionDraft.password);
		if (error !== null) {
			setProvisionPasswordError(error);
			return;
		}
		provisionOwner.submit({
			email: provisionDraft.email.trim(),
			displayName: provisionDraft.displayName.trim(),
			password: provisionDraft.password,
		});
	}

	function handleDeactivateStaffPin(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		deactivateStaffPin.submit({ reason: staffPinReason.trim() });
	}

	function handleDeactivateOwner(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (deactivatingOwnerId === null) return;
		deactivateOwner.submit({
			targetPrincipalId: deactivatingOwnerId,
			reason: ownerReason.trim(),
		});
	}

	function handleResetOwner(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (resettingOwnerId === null) return;
		const error = ownerPasswordError(ownerPassword);
		if (error !== null) {
			setResetPasswordError(error);
			return;
		}
		resetOwnerCredential.submit({
			targetPrincipalId: resettingOwnerId,
			password: ownerPassword,
		});
	}

	return (
		<>
			<div className="owner-access-summary-grid">
				<div className="owner-access-card" data-owner-access-staff-pin="">
					<header className="owner-access-card__heading">
						<h3>{messages.staffPinTitle}</h3>
						<p>{messages.staffPinDescription}</p>
					</header>
					<p className="owner-access-card__state">
						<span>{messages.staffPinStateLabel}</span>
						<bdi data-tone={staffPinTone(staff)}>
							{staffPinStateLabel(staff, messages)}
						</bdi>
					</p>

					<div className="owner-access-actions">
						<Button
							type="button"
							data-owner-access-staff-pin-primary=""
							onClick={() =>
								requestReveal(() =>
									staff?.credentialActive === true
										? rotateStaffPin.submit()
										: provisionStaffPin.submit(),
								)
							}
						>
							{staff?.credentialActive === true
								? messages.rotateStaffPin
								: messages.provisionStaffPin}
						</Button>
						{staff?.credentialActive === true && !staffPinDeactivating ? (
							<Button
								type="button"
								variant="destructive"
								onClick={() => setStaffPinDeactivating(true)}
							>
								{messages.deactivateStaffPin}
							</Button>
						) : null}
					</div>
					<OwnerAccessRefusal
						outcome={
							staff?.credentialActive === true
								? rotateStaffPin.outcome
								: provisionStaffPin.outcome
						}
					/>
					{staff?.credentialActive === true && staffPinDeactivating ? (
						<form
							className="owner-access-inline"
							onSubmit={handleDeactivateStaffPin}
						>
							<label htmlFor={fieldId("staff-pin-reason")}>
								{messages.reasonLabel}
							</label>
							<input
								id={fieldId("staff-pin-reason")}
								type="text"
								maxLength={500}
								autoComplete="off"
								aria-describedby={fieldId("staff-pin-reason-hint")}
								value={staffPinReason}
								onChange={(event) => setStaffPinReason(event.target.value)}
							/>
							<p
								id={fieldId("staff-pin-reason-hint")}
								className="owner-access-inline__hint"
							>
								{messages.staffPinReasonHint} {messages.reasonHint}
							</p>
							<OwnerAccessRefusal outcome={deactivateStaffPin.outcome} />
							<div className="owner-access-inline__actions">
								<Button
									type="submit"
									variant="destructive"
									disabled={
										deactivateStaffPin.outcome.phase === "pending" ||
										staffPinReason.trim().length === 0
									}
								>
									{messages.confirm}
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={() => setStaffPinDeactivating(false)}
								>
									{messages.cancel}
								</Button>
							</div>
						</form>
					) : null}
				</div>

				<div
					className={
						provisionOpen
							? "owner-access-card owner-access-owners-summary owner-access-owners-summary--provision-open"
							: "owner-access-card owner-access-owners-summary"
					}
					data-owner-access-owners-summary=""
				>
					<header className="owner-access-block__heading">
						<h3>{messages.ownersTitle}</h3>
						<p>{messages.ownersDescription}</p>
					</header>
					<Button
						type="button"
						className="owner-access-provision__trigger"
						data-owner-access-provision-trigger=""
						onClick={() => setProvisionOpen(true)}
					>
						{messages.provisionOwner}
					</Button>

					<form
						className="owner-access-provision"
						data-open={provisionOpen ? "" : undefined}
						aria-labelledby={fieldId("provision-legend")}
						onSubmit={handleProvisionOwner}
					>
						<h4 id={fieldId("provision-legend")} className="fw-sr-only">
							{messages.ownerFormLegend}
						</h4>
						<div className="owner-access-field">
							<label htmlFor={fieldId("owner-email")}>
								{messages.ownerEmailLabel}
							</label>
							<input
								id={fieldId("owner-email")}
								type="email"
								autoComplete="off"
								value={provisionDraft.email}
								onChange={(event) =>
									setProvisionDraft((current) => ({
										...current,
										email: event.target.value,
									}))
								}
							/>
						</div>
						<div className="owner-access-field">
							<label htmlFor={fieldId("owner-name")}>
								{messages.ownerDisplayNameLabel}
							</label>
							<input
								id={fieldId("owner-name")}
								type="text"
								maxLength={120}
								autoComplete="off"
								value={provisionDraft.displayName}
								onChange={(event) =>
									setProvisionDraft((current) => ({
										...current,
										displayName: event.target.value,
									}))
								}
							/>
						</div>
						<div className="owner-access-field">
							<label htmlFor={fieldId("owner-password")}>
								{messages.ownerPasswordLabel}
							</label>
							<input
								id={fieldId("owner-password")}
								type="password"
								autoComplete="new-password"
								value={provisionDraft.password}
								onChange={(event) => {
									setProvisionDraft((current) => ({
										...current,
										password: event.target.value,
									}));
									setProvisionPasswordError(null);
								}}
								aria-invalid={provisionPasswordError !== null}
								aria-describedby={
									provisionPasswordError === null
										? fieldId("owner-password-hint")
										: `${fieldId("owner-password-hint")} ${fieldId("owner-password-error")}`
								}
							/>
							<p
								id={fieldId("owner-password-hint")}
								className="owner-access-field__hint"
							>
								{messages.ownerPasswordHint}
							</p>
							{provisionPasswordError !== null ? (
								<p
									id={fieldId("owner-password-error")}
									className="owner-access-field__error"
									role="alert"
								>
									{passwordValidationMessage(provisionPasswordError)}
								</p>
							) : null}
						</div>
						<div className="owner-access-provision__actions">
							<Button
								type="submit"
								disabled={provisionOwner.outcome.phase === "pending"}
							>
								{messages.provisionOwner}
							</Button>
							<Button
								type="button"
								variant="outline"
								className="owner-access-provision__cancel"
								onClick={() => {
									setProvisionDraft(provisionDraftInitial);
									setProvisionPasswordError(null);
									setProvisionOpen(false);
									provisionOwner.reset();
								}}
							>
								{messages.cancel}
							</Button>
						</div>
					</form>
					<OwnerAccessRefusal outcome={provisionOwner.outcome} />
					{provisionOwner.outcome.phase === "success" ? (
						<p
							className="owner-access__owner-created"
							data-owner-access-owner-created=""
							role="status"
							aria-live="polite"
						>
							<span>
								<strong>{messages.ownerCreatedTitle}</strong>{" "}
								{messages.ownerCreatedDescription}
							</span>
							<Button
								type="button"
								variant="outline"
								onClick={() => provisionOwner.reset()}
							>
								{messages.done}
							</Button>
						</p>
					) : null}
				</div>
			</div>

			<div className="owner-access-owners-board">
				<table className="owner-access-owners">
					<thead>
						<tr>
							<th scope="col">{messages.ownerColumnLabel}</th>
							<th scope="col">{messages.ownerActionsLabel}</th>
						</tr>
					</thead>
					<tbody>
						{owners.map((owner) => {
							const isDeactivating = deactivatingOwnerId === owner.principalId;
							const isResetting = resettingOwnerId === owner.principalId;
							const isReactivating = reactivatingOwnerId === owner.principalId;
							return (
								<tr
									key={owner.principalId}
									className="owner-access-owner"
									data-inactive={owner.active ? undefined : ""}
								>
									<td className="owner-access-owner__identity">
										<span className="owner-access-owner__name">
											<bdi dir="auto">{owner.displayName}</bdi>
										</span>
										{owner.ownerEmail ? (
											<span className="owner-access-owner__email">
												<bdi dir="auto">{owner.ownerEmail}</bdi>
											</span>
										) : null}
										<span
											className="owner-access-owner__state"
											data-active={owner.active ? "" : undefined}
										>
											{owner.active
												? messages.ownerActive
												: messages.ownerInactive}
										</span>
									</td>

									<td className="owner-access-owner__controls">
										{owner.active ? (
											isDeactivating ? (
												<form
													className="owner-access-inline"
													onSubmit={handleDeactivateOwner}
												>
													<label
														htmlFor={fieldId(`reason-${owner.principalId}`)}
													>
														{messages.reasonLabel}
													</label>
													<input
														id={fieldId(`reason-${owner.principalId}`)}
														type="text"
														maxLength={500}
														autoComplete="off"
														aria-describedby={fieldId(
															`reason-hint-${owner.principalId}`,
														)}
														value={ownerReason}
														onChange={(event) =>
															setOwnerReason(event.target.value)
														}
													/>
													<p
														id={fieldId(`reason-hint-${owner.principalId}`)}
														className="owner-access-inline__hint"
													>
														{messages.reasonHint}
													</p>
													<OwnerAccessRefusal
														outcome={deactivateOwner.outcome}
													/>
													<div className="owner-access-inline__actions">
														<Button
															type="submit"
															variant="destructive"
															disabled={
																deactivateOwner.outcome.phase === "pending" ||
																ownerReason.trim().length === 0
															}
														>
															{messages.confirm}
														</Button>
														<Button
															type="button"
															variant="outline"
															onClick={() => setDeactivatingOwnerId(null)}
														>
															{messages.cancel}
														</Button>
													</div>
												</form>
											) : isResetting ? (
												<form
													className="owner-access-inline owner-access-inline--reset"
													onSubmit={handleResetOwner}
												>
													<label
														htmlFor={fieldId(`password-${owner.principalId}`)}
													>
														{messages.resetPasswordLabel}
													</label>
													<input
														id={fieldId(`password-${owner.principalId}`)}
														type="password"
														autoComplete="new-password"
														value={ownerPassword}
														onChange={(event) => {
															setOwnerPassword(event.target.value);
															setResetPasswordError(null);
														}}
														aria-invalid={resetPasswordError !== null}
														aria-describedby={
															resetPasswordError === null
																? fieldId(`password-hint-${owner.principalId}`)
																: `${fieldId(`password-hint-${owner.principalId}`)} ${fieldId(`password-error-${owner.principalId}`)}`
														}
													/>
													<p
														id={fieldId(`password-hint-${owner.principalId}`)}
														className="owner-access-inline__hint"
													>
														{messages.resetPasswordHint}
													</p>
													{resetPasswordError !== null ? (
														<p
															id={fieldId(
																`password-error-${owner.principalId}`,
															)}
															className="owner-access-inline__error"
															role="alert"
														>
															{passwordValidationMessage(resetPasswordError)}
														</p>
													) : null}
													<OwnerAccessRefusal
														outcome={resetOwnerCredential.outcome}
													/>
													<div className="owner-access-inline__actions">
														<Button
															type="submit"
															disabled={
																resetOwnerCredential.outcome.phase === "pending"
															}
														>
															{messages.confirm}
														</Button>
														<Button
															type="button"
															variant="outline"
															onClick={clearReset}
														>
															{messages.cancel}
														</Button>
													</div>
												</form>
											) : (
												<div className="owner-access-owner__actions">
													<Button
														type="button"
														variant="destructive"
														onClick={() =>
															setDeactivatingOwnerId(owner.principalId)
														}
													>
														{messages.deactivateOwner}
													</Button>
													<Button
														type="button"
														variant="outline"
														onClick={() => openReset(owner.principalId)}
													>
														{messages.resetCredential}
													</Button>
												</div>
											)
										) : (
											<div className="owner-access-owner__actions">
												<Button
													type="button"
													onClick={() => {
														setReactivatingOwnerId(owner.principalId);
														reactivateOwner.submit({
															targetPrincipalId: owner.principalId,
														});
													}}
												>
													{messages.reactivateOwner}
												</Button>
												{isReactivating ? (
													<OwnerAccessRefusal
														outcome={reactivateOwner.outcome}
													/>
												) : null}
											</div>
										)}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{revealedPin !== null ? (
				<OwnerAccessReveal
					pin={revealedPin}
					returnFocus={revealReturnRef.current}
					onDismiss={dismissRevealedPin}
				/>
			) : null}
		</>
	);
}
