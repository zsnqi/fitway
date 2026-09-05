import { WEEKDAYS, type Weekday } from "@fitway/api/occupancy/schedule";
import type { OwnerSettingsSnapshot } from "@fitway/api/settings/contracts";
import { type FormEvent, useId } from "react";

import type { OwnerSettingsMessages, OwnerSettingsUiState } from "./messages";
import type {
	OwnerSettingsDraft,
	OwnerSettingsDraftErrors,
} from "./owner-settings-draft";

import "./owner-settings.css";

/**
 * The owner Settings form: the accepted Paper composition rendered by the
 * repository's runtime.
 *
 * The view is presentational. Every decision about *when* something shows —
 * standby gating, which Discard cluster is visible, whether Save is enabled —
 * arrives as props, so tests can drive the full state machine without a
 * server. Visual responsive recomposition (desktop weekly table, mobile day
 * cards, the conditional lower action frontier) is CSS-owned per ADR-007.
 */

export type OwnerSettingsViewProps = {
	messages: OwnerSettingsMessages;
	state: OwnerSettingsUiState;
	snapshot: OwnerSettingsSnapshot;
	draft: OwnerSettingsDraft;
	errors: OwnerSettingsDraftErrors;
	/** The version whose creation the polite status region is announcing. */
	savedVersion: number | null;
	onFieldChange: (patch: Partial<Omit<OwnerSettingsDraft, "days">>) => void;
	onDayToggle: (day: Weekday, open: boolean) => void;
	onDayTimeChange: (
		day: Weekday,
		field: "open" | "close",
		value: string,
	) => void;
	onSave: () => void;
	onDiscard: () => void;
};

type ErrorCatalog = Record<string, string>;

function catalogText(
	catalog: ErrorCatalog,
	error: string | null,
): string | null {
	if (error === null) return null;
	return catalog[error] ?? null;
}

function parsedPercent(value: string): number | null {
	const trimmed = value.trim();
	if (!/^\d+$/.test(trimmed)) return null;
	const parsed = Number(trimmed);
	return Number.isSafeInteger(parsed) ? parsed : null;
}

function withErrorClass(baseClass: string, hasError: boolean): string {
	return hasError ? `${baseClass} ${baseClass}--error` : baseClass;
}

export function OwnerSettingsView({
	messages,
	state,
	snapshot,
	draft,
	errors,
	savedVersion,
	onFieldChange,
	onDayToggle,
	onDayTimeChange,
	onSave,
	onDiscard,
}: OwnerSettingsViewProps) {
	const baseId = useId();
	const headingId = `${baseId}-heading`;
	const statusId = `${baseId}-status`;
	const fieldId = (name: string) => `${baseId}-${name}`;
	const errorId = (name: string) => `${baseId}-${name}-error`;

	const saving = state === "saving";
	const clean = state === "clean";
	const conflict = state === "conflict";
	const invalid = state === "dirty-invalid";
	// A just-saved form is clean again: Save locks until the next real change.
	const saveDisabled =
		clean || state === "saved" || invalid || conflict || saving;
	const discardDisabled = saving;
	const showDiscardInUpper = state !== "clean" && state !== "saved";
	const showLowerFrontier = state !== "clean" && state !== "saved";

	const quietValue = parsedPercent(draft.quietMaxPercent) ?? 0;
	const moderateValue = parsedPercent(draft.moderateMaxPercent) ?? 0;

	const stateShort =
		state === "clean"
			? messages.stateShort.clean
			: state === "saving"
				? messages.stateShort.saving
				: state === "saved"
					? messages.stateShort.saved
					: state === "failed"
						? messages.stateShort.failed
						: state === "conflict"
							? messages.stateShort.conflict
							: messages.stateShort.dirty;

	const statusText =
		state === "saving"
			? messages.savingState
			: state === "failed"
				? messages.failureAnnouncement
				: state === "conflict"
					? messages.conflictAnnouncement
					: invalid
						? messages.invalidAnnouncement
						: savedVersion !== null
							? messages.savedAnnouncement.replace(
									"{version}",
									String(savedVersion),
								)
							: "";

	const boardStateText =
		state === "clean"
			? messages.cleanState
			: state === "saving"
				? messages.savingState
				: state === "saved"
					? messages.savedState
					: messages.unsavedState;

	const lowerStateText =
		state === "failed"
			? messages.failureAnnouncement
			: state === "conflict"
				? messages.conflictAnnouncement
				: messages.unsavedState;

	const seconds = (value: number) => `${value} s`;

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		onSave();
	}

	return (
		<section className="owner-settings" aria-labelledby={headingId}>
			<form
				id={`${baseId}-form`}
				className="owner-settings__form"
				onSubmit={handleSubmit}
				noValidate
			>
				<div className="owner-settings__top" data-owner-navigation-anchor="">
					<header className="owner-settings__intro">
						<h1 id={headingId}>{messages.title}</h1>
					</header>
					<div className="owner-settings__actions owner-settings__actions--upper">
						<span className="owner-settings__version">
							<bdi>
								{messages.currentVersion} {snapshot.version}
							</bdi>
							<span className="owner-settings__version-state">
								{" · "}
								{stateShort}
							</span>
						</span>
						{showDiscardInUpper ? (
							<button
								type="button"
								className="owner-settings__discard"
								disabled={discardDisabled}
								onClick={onDiscard}
							>
								{messages.discard}
							</button>
						) : null}
						<button
							type="submit"
							className="owner-settings__save"
							disabled={saveDisabled}
						>
							{saving ? messages.saveShort : messages.save}
						</button>
					</div>
				</div>

				<p
					id={statusId}
					className="owner-settings__status"
					role="status"
					aria-live="polite"
				>
					{statusText}
				</p>

				<fieldset
					className="owner-settings__board owner-settings__board--foundations"
					aria-labelledby={fieldId("foundations-title")}
					disabled={saving}
				>
					<div className="owner-settings__board-head">
						<h3 id={fieldId("foundations-title")}>
							{messages.foundationsTitle}
						</h3>
						<span
							className="owner-settings__board-state"
							data-clean={clean ? "" : undefined}
						>
							{boardStateText}
						</span>
					</div>
					<div className="owner-settings__triple">
						<div className="owner-settings__field">
							<label htmlFor={fieldId("capacity")}>
								{messages.capacityLabel}
							</label>
							<div
								className={withErrorClass(
									"owner-settings__control",
									errors.capacity !== null,
								)}
							>
								<input
									id={fieldId("capacity")}
									data-testid="capacity"
									inputMode="numeric"
									autoComplete="off"
									value={draft.capacity}
									onChange={(event) =>
										onFieldChange({ capacity: event.target.value })
									}
									aria-invalid={errors.capacity !== null ? true : undefined}
									aria-describedby={
										errors.capacity !== null ? errorId("capacity") : undefined
									}
								/>
								<span className="owner-settings__unit">
									{messages.capacityUnit}
								</span>
							</div>
							{errors.capacity !== null ? (
								<p className="owner-settings__error" id={errorId("capacity")}>
									{catalogText(messages.errors.capacity, errors.capacity)}
								</p>
							) : null}
						</div>

						<div className="owner-settings__field">
							<label htmlFor={fieldId("boundary")}>
								{messages.boundaryLabel}
							</label>
							<div
								className={withErrorClass(
									"owner-settings__control",
									errors.businessDayBoundary !== null,
								)}
							>
								<input
									id={fieldId("boundary")}
									data-testid="boundary"
									inputMode="numeric"
									autoComplete="off"
									maxLength={5}
									placeholder="HH:mm"
									value={draft.businessDayBoundary}
									onChange={(event) =>
										onFieldChange({ businessDayBoundary: event.target.value })
									}
									aria-invalid={
										errors.businessDayBoundary !== null ? true : undefined
									}
									aria-describedby={
										errors.businessDayBoundary !== null
											? errorId("boundary")
											: undefined
									}
								/>
								<span className="owner-settings__unit">
									{messages.boundaryUnit(snapshot.operational.timezone)}
								</span>
							</div>
							{errors.businessDayBoundary !== null ? (
								<p className="owner-settings__error" id={errorId("boundary")}>
									{catalogText(
										messages.errors.wallTime,
										errors.businessDayBoundary,
									)}
								</p>
							) : null}
						</div>

						<div className="owner-settings__field">
							<label htmlFor={fieldId("reset")}>{messages.resetLabel}</label>
							<div
								className={withErrorClass(
									"owner-settings__control",
									errors.resetBufferMinutes !== null,
								)}
							>
								<input
									id={fieldId("reset")}
									data-testid="reset"
									inputMode="numeric"
									autoComplete="off"
									value={draft.resetBufferMinutes}
									onChange={(event) =>
										onFieldChange({ resetBufferMinutes: event.target.value })
									}
									aria-invalid={
										errors.resetBufferMinutes !== null ? true : undefined
									}
									aria-describedby={
										errors.resetBufferMinutes !== null
											? errorId("reset")
											: undefined
									}
								/>
								<span className="owner-settings__unit">
									{messages.resetUnit}
								</span>
							</div>
							{errors.resetBufferMinutes !== null ? (
								<p className="owner-settings__error" id={errorId("reset")}>
									{catalogText(
										messages.errors.reset,
										errors.resetBufferMinutes,
									)}
								</p>
							) : null}
						</div>
					</div>
				</fieldset>

				<fieldset
					className="owner-settings__board owner-settings__board--thresholds"
					aria-labelledby={fieldId("thresholds-title")}
					disabled={saving}
				>
					<div className="owner-settings__board-head">
						<h3 id={fieldId("thresholds-title")}>{messages.thresholdsTitle}</h3>
					</div>
					<div className="owner-settings__triple">
						{(
							[
								[
									"quietMaxPercent",
									messages.quietLabel,
									draft.quietMaxPercent,
									errors.quietMaxPercent,
								],
								[
									"moderateMaxPercent",
									messages.moderateLabel,
									draft.moderateMaxPercent,
									errors.moderateMaxPercent,
								],
								[
									"busyMaxPercent",
									messages.busyLabel,
									draft.busyMaxPercent,
									errors.busyMaxPercent,
								],
							] as const
						).map(([key, label, value, error]) => (
							<div className="owner-settings__field" key={key}>
								<label htmlFor={fieldId(key)}>{label}</label>
								<div
									className={withErrorClass(
										"owner-settings__control",
										error !== null,
									)}
								>
									<input
										id={fieldId(key)}
										data-testid={key}
										inputMode="numeric"
										autoComplete="off"
										value={value}
										onChange={(event) =>
											onFieldChange({
												[key]: event.target.value,
											})
										}
										aria-invalid={error !== null ? true : undefined}
										aria-describedby={error !== null ? errorId(key) : undefined}
									/>
									<span className="owner-settings__unit">%</span>
								</div>
								{error !== null ? (
									<p className="owner-settings__error" id={errorId(key)}>
										{key === "moderateMaxPercent" && error === "order"
											? messages.errors.moderateOrder(quietValue)
											: key === "busyMaxPercent" && error === "order"
												? messages.errors.busyOrder(moderateValue)
												: catalogText(messages.errors.threshold, error)}
									</p>
								) : null}
							</div>
						))}
					</div>
				</fieldset>

				<fieldset
					className="owner-settings__board owner-settings__board--weekly"
					aria-labelledby={fieldId("weekly-title")}
					disabled={saving}
				>
					<div className="owner-settings__board-head">
						<h3 id={fieldId("weekly-title")}>{messages.weeklyTitle}</h3>
					</div>
					<div className="owner-settings__week">
						<div className="owner-settings__week-header" aria-hidden="true">
							<span>{messages.columnDay}</span>
							<span>{messages.columnOpens}</span>
							<span>{messages.columnCloses}</span>
							<span>{messages.columnState}</span>
						</div>
						{WEEKDAYS.map((day) => {
							const pair = draft.days[day];
							const dayErrors = errors.days[day];
							const dayName = messages.weekdays[day];
							const closesNextDay =
								pair !== null &&
								pair.open.trim() !== "" &&
								pair.close.trim() !== "" &&
								pair.close.trim() <= pair.open.trim();
							return (
								<div className="owner-settings__week-row" key={day}>
									<span className="owner-settings__week-day">{dayName}</span>
									<label className="owner-settings__toggle owner-settings__toggle--mobile">
										<input
											type="checkbox"
											className="owner-settings__toggle-input"
											data-testid={`${day}-toggle-mobile`}
											checked={pair !== null}
											onChange={(event) =>
												onDayToggle(day, event.target.checked)
											}
											aria-label={`${dayName} — ${pair !== null ? messages.open : messages.closed}`}
										/>
										<span
											className="owner-settings__toggle-marker"
											data-open={pair !== null ? "" : undefined}
											aria-hidden="true"
										/>
										<span className="owner-settings__toggle-text">
											{pair !== null ? messages.open : messages.closed}
										</span>
										{closesNextDay ? (
											<span className="owner-settings__toggle-hint">
												{messages.closesNextDay}
											</span>
										) : null}
									</label>
									{pair === null ? (
										<div className="owner-settings__week-unavailable">
											{messages.closedDayMessage}
										</div>
									) : (
										<>
											<div
												className={withErrorClass(
													"owner-settings__time",
													dayErrors.open !== null,
												)}
											>
												<label
													className="owner-settings__time-label"
													htmlFor={fieldId(`${day}-open`)}
												>
													{messages.opensSub}
												</label>
												<input
													id={fieldId(`${day}-open`)}
													data-testid={`${day}-open`}
													type="text"
													inputMode="numeric"
													autoComplete="off"
													maxLength={5}
													placeholder="HH:mm"
													value={pair.open}
													onChange={(event) =>
														onDayTimeChange(day, "open", event.target.value)
													}
													aria-label={`${dayName} ${messages.columnOpens}`}
													aria-invalid={
														dayErrors.open !== null ? true : undefined
													}
													aria-describedby={
														dayErrors.open !== null
															? errorId(`${day}-open`)
															: undefined
													}
												/>
												{dayErrors.open !== null ? (
													<p
														className="owner-settings__error"
														id={errorId(`${day}-open`)}
													>
														{catalogText(
															messages.errors.wallTime,
															dayErrors.open,
														)}
													</p>
												) : null}
											</div>
											<div
												className={withErrorClass(
													"owner-settings__time",
													dayErrors.close !== null,
												)}
											>
												<label
													className="owner-settings__time-label"
													htmlFor={fieldId(`${day}-close`)}
												>
													{messages.closesSub}
												</label>
												<input
													id={fieldId(`${day}-close`)}
													data-testid={`${day}-close`}
													type="text"
													inputMode="numeric"
													autoComplete="off"
													maxLength={5}
													placeholder="HH:mm"
													value={pair.close}
													onChange={(event) =>
														onDayTimeChange(day, "close", event.target.value)
													}
													aria-label={`${dayName} ${messages.columnCloses}`}
													aria-invalid={
														dayErrors.close !== null ? true : undefined
													}
													aria-describedby={
														dayErrors.close !== null
															? errorId(`${day}-close`)
															: undefined
													}
												/>
												{dayErrors.close !== null ? (
													<p
														className="owner-settings__error"
														id={errorId(`${day}-close`)}
													>
														{catalogText(
															messages.errors.wallTime,
															dayErrors.close,
														)}
													</p>
												) : null}
											</div>
										</>
									)}
									<label className="owner-settings__toggle owner-settings__toggle--desktop">
										<input
											type="checkbox"
											className="owner-settings__toggle-input"
											data-testid={`${day}-toggle`}
											checked={pair !== null}
											onChange={(event) =>
												onDayToggle(day, event.target.checked)
											}
											aria-label={`${dayName} — ${pair !== null ? messages.open : messages.closed}`}
										/>
										<span
											className="owner-settings__toggle-marker"
											data-open={pair !== null ? "" : undefined}
											aria-hidden="true"
										/>
										<span className="owner-settings__toggle-text">
											{pair !== null ? messages.open : messages.closed}
										</span>
										{closesNextDay ? (
											<span className="owner-settings__toggle-hint">
												{messages.closesNextDay}
											</span>
										) : null}
									</label>
								</div>
							);
						})}
					</div>
				</fieldset>

				<fieldset
					className="owner-settings__board owner-settings__board--locked"
					aria-labelledby={fieldId("locked-title")}
					disabled={false}
				>
					<div className="owner-settings__board-head">
						<h3 id={fieldId("locked-title")}>
							<span className="owner-settings__locked-copy-desktop">
								{messages.lockedTitle}
							</span>
							<span className="owner-settings__locked-copy-mobile">
								{messages.lockedTitleMobile}
							</span>
						</h3>
						<span className="owner-settings__locked-badge">
							{messages.lockedBadge}
						</span>
					</div>
					<dl className="owner-settings__locked">
						<div className="owner-settings__locked-item">
							<dt>{messages.timezoneLabel}</dt>
							<dd>
								<bdi>{snapshot.operational.timezone}</bdi>
							</dd>
						</div>
						<div className="owner-settings__locked-item">
							<dt>{messages.pushLabel}</dt>
							<dd>
								<bdi>{seconds(snapshot.operational.pushIntervalSeconds)}</bdi>
							</dd>
						</div>
						<div className="owner-settings__locked-item">
							<dt>{messages.freshLabel}</dt>
							<dd>
								<bdi>{seconds(snapshot.operational.freshForSeconds)}</bdi>
							</dd>
						</div>
						<div className="owner-settings__locked-item">
							<dt>{messages.staleLabel}</dt>
							<dd>
								<bdi>
									{seconds(snapshot.operational.operationalStaleAfterSeconds)}
								</bdi>
							</dd>
						</div>
						<div className="owner-settings__locked-item">
							<dt>{messages.pollLabel}</dt>
							<dd>
								<bdi>{seconds(snapshot.operational.publicPollSeconds)}</bdi>
							</dd>
						</div>
					</dl>
				</fieldset>

				{showLowerFrontier ? (
					<div
						className="owner-settings__actions owner-settings__actions--lower"
						data-state={state}
					>
						<span className="owner-settings__lower-state">
							{lowerStateText}
						</span>
						<button
							type="button"
							className="owner-settings__discard"
							disabled={discardDisabled}
							onClick={onDiscard}
						>
							{messages.discard}
						</button>
						<button
							type="submit"
							className="owner-settings__save"
							disabled={saveDisabled}
						>
							{saving ? messages.saveShort : messages.save}
						</button>
					</div>
				) : null}
			</form>
		</section>
	);
}
