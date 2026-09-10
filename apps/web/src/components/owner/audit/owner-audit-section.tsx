import { AUDIT_ACTIONS, AUDIT_ACTOR_KINDS } from "@fitway/api/audit/list";
import { Button } from "@fitway/ui/components/button";
import { type FormEvent, useId, useState } from "react";

import {
	emptyOwnerAuditSelection,
	type OwnerAuditFilterSelection,
	useOwnerAudit,
} from "@/hooks/use-owner-audit";
import { formatDate, formatNumber } from "@/i18n/format";
import { useI18n } from "@/i18n/provider";

import {
	OwnerDateField,
	ownerDateValidationMessage,
} from "../owner-date-field";
import { OwnerSelect } from "../owner-select";
import {
	OwnerAuditEmpty,
	OwnerAuditError,
	OwnerAuditLoading,
	OwnerAuditTable,
} from "./owner-audit-view";
import { useOwnerAuditMessages } from "./use-owner-audit-messages";

import "./owner-audit.css";

/**
 * The owner audit history section.
 *
 * The draft form is applied deliberately rather than on every keystroke, so a
 * partially typed filter never issues a query and focus never moves under the
 * owner's hands.
 */
export function OwnerAuditSection() {
	const { locale } = useI18n();
	const messages = useOwnerAuditMessages();
	const [draft, setDraft] = useState<OwnerAuditFilterSelection>(
		emptyOwnerAuditSelection,
	);
	const [applied, setApplied] = useState<OwnerAuditFilterSelection>(
		emptyOwnerAuditSelection,
	);
	const [dateValidity, setDateValidity] = useState({ from: true, to: true });
	const [validationRequested, setValidationRequested] = useState(false);
	const audit = useOwnerAudit(applied);
	const ids = useId();
	const fieldId = (name: string) => `${ids}-${name}`;
	const appliedDateContext = [applied.occurredFromDay, applied.occurredToDay]
		.filter(Boolean)
		.map((day) =>
			formatDate(new Date(`${day}T12:00:00.000Z`), locale, {
				day: "numeric",
				month: "long",
				year: "numeric",
			}),
		)
		.join(" – ");
	const dateValidationProblem =
		!dateValidity.from || !dateValidity.to
			? ownerDateValidationMessage(locale, "invalid")
			: draft.occurredFromDay &&
					draft.occurredToDay &&
					draft.occurredFromDay > draft.occurredToDay
				? ownerDateValidationMessage(locale, "inverted")
				: null;
	const dateProblem = validationRequested ? dateValidationProblem : null;
	const gymYear = Number(
		new Intl.DateTimeFormat("en-US-u-ca-gregory-nu-latn", {
			year: "numeric",
			timeZone: audit.timeZone ?? "UTC",
		}).format(new Date()),
	);

	function update<Key extends keyof OwnerAuditFilterSelection>(
		key: Key,
		value: OwnerAuditFilterSelection[Key],
	) {
		setDraft((current) => ({ ...current, [key]: value }));
	}

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setValidationRequested(true);
		if (dateValidationProblem) return;
		setApplied(draft);
	}

	function handleClear() {
		setDraft(emptyOwnerAuditSelection);
		setApplied(emptyOwnerAuditSelection);
		setDateValidity({ from: true, to: true });
		setValidationRequested(false);
	}

	if (audit.status === "pending" || audit.status === "unavailable") {
		return (
			<section className="owner-audit" aria-labelledby={fieldId("heading")}>
				<header
					className="owner-audit__heading"
					data-owner-navigation-anchor=""
				>
					<h1 id={fieldId("heading")}>{messages.title}</h1>
					<p>{messages.description}</p>
				</header>
				<OwnerAuditLoading />
			</section>
		);
	}

	if (audit.status === "error" || !audit.timeZone) {
		return (
			<section className="owner-audit" aria-labelledby={fieldId("heading")}>
				<header
					className="owner-audit__heading"
					data-owner-navigation-anchor=""
				>
					<h1 id={fieldId("heading")}>{messages.title}</h1>
					<p>{messages.description}</p>
				</header>
				<OwnerAuditError onRetry={audit.retry} />
			</section>
		);
	}

	return (
		<section className="owner-audit" aria-labelledby={fieldId("heading")}>
			<header className="owner-audit__heading" data-owner-navigation-anchor="">
				<h1 id={fieldId("heading")}>{messages.title}</h1>
				<p>
					{appliedDateContext ? (
						<bdi dir="auto">{appliedDateContext}</bdi>
					) : (
						messages.description
					)}
				</p>
			</header>

			<form
				className="owner-audit-filters"
				aria-label={messages.filtersLabel}
				onSubmit={handleSubmit}
			>
				<header className="owner-audit-filters__heading">
					<h2>{messages.filtersLabel}</h2>
				</header>

				<div className="owner-audit-field owner-audit-field--action">
					<label htmlFor={fieldId("action")}>{messages.actionLabel}</label>
					<span className="owner-audit-select">
						<OwnerSelect
							id={fieldId("action")}
							value={draft.action}
							items={[
								{ value: "any", label: messages.anyOption },
								...AUDIT_ACTIONS.map((action) => ({
									value: action,
									label: messages[action],
								})),
							]}
							onValueChange={(value) =>
								update(
									"action",
									(value ?? "any") as OwnerAuditFilterSelection["action"],
								)
							}
						/>
					</span>
				</div>

				<div className="owner-audit-field owner-audit-field--actor">
					<label htmlFor={fieldId("actor")}>{messages.actorLabel}</label>
					<span className="owner-audit-select">
						<OwnerSelect
							id={fieldId("actor")}
							value={draft.actor}
							items={[
								{ value: "any", label: messages.anyOption },
								...AUDIT_ACTOR_KINDS.map((kind) => ({
									value: kind,
									label: messages[kind],
								})),
							]}
							onValueChange={(value) =>
								update(
									"actor",
									(value ?? "any") as OwnerAuditFilterSelection["actor"],
								)
							}
						/>
					</span>
				</div>

				<div className="owner-audit-field owner-audit-field--from">
					<OwnerDateField
						id={fieldId("occurred-from")}
						label={messages.occurredFromLabel}
						value={draft.occurredFromDay}
						referenceYear={gymYear}
						describedBy={fieldId("date-problem")}
						invalid={dateProblem !== null}
						onValidationRequest={() => setValidationRequested(true)}
						onValidationReset={() => setValidationRequested(false)}
						onValidityChange={(valid) =>
							setDateValidity((current) => ({ ...current, from: valid }))
						}
						onChange={(value) => update("occurredFromDay", value)}
					/>
				</div>

				<div className="owner-audit-field owner-audit-field--to">
					<OwnerDateField
						id={fieldId("occurred-to")}
						label={messages.occurredToLabel}
						value={draft.occurredToDay}
						referenceYear={gymYear}
						describedBy={fieldId("date-problem")}
						invalid={dateProblem !== null}
						onValidationRequest={() => setValidationRequested(true)}
						onValidationReset={() => setValidationRequested(false)}
						onValidityChange={(valid) =>
							setDateValidity((current) => ({ ...current, to: valid }))
						}
						onChange={(value) => update("occurredToDay", value)}
					/>
				</div>

				<div className="owner-audit-field owner-audit-field--prior">
					<label htmlFor={fieldId("prior-mode")}>{messages.priorLabel}</label>
					<div className="owner-audit-field__controls">
						<span className="owner-audit-select">
							<OwnerSelect
								id={fieldId("prior-mode")}
								value={draft.priorMode}
								items={[
									{ value: "any", label: messages.priorAny },
									{ value: "value", label: messages.priorValue },
									{ value: "missing", label: messages.priorMissing },
								]}
								onValueChange={(value) =>
									update(
										"priorMode",
										(value ?? "any") as OwnerAuditFilterSelection["priorMode"],
									)
								}
							/>
						</span>
						<input
							id={fieldId("prior-value")}
							type="number"
							inputMode="numeric"
							min={0}
							step={1}
							aria-label={messages.priorValueInput}
							disabled={draft.priorMode !== "value"}
							value={draft.priorValue}
							onChange={(event) => update("priorValue", event.target.value)}
						/>
					</div>
				</div>

				<div className="owner-audit-field owner-audit-field--effective">
					<label htmlFor={fieldId("effective-mode")}>
						{messages.effectiveLabel}
					</label>
					<div className="owner-audit-field__controls">
						<span className="owner-audit-select">
							<OwnerSelect
								id={fieldId("effective-mode")}
								value={draft.effectiveMode}
								items={[
									{ value: "any", label: messages.effectiveAny },
									{ value: "value", label: messages.effectiveValue },
									{ value: "missing", label: messages.effectiveMissing },
								]}
								onValueChange={(value) =>
									update(
										"effectiveMode",
										(value ??
											"any") as OwnerAuditFilterSelection["effectiveMode"],
									)
								}
							/>
						</span>
						<input
							id={fieldId("effective")}
							type="number"
							inputMode="numeric"
							min={0}
							step={1}
							aria-label={messages.effectiveValueInput}
							disabled={draft.effectiveMode !== "value"}
							value={draft.effectiveValue}
							onChange={(event) => update("effectiveValue", event.target.value)}
						/>
					</div>
				</div>

				<div className="owner-audit-field owner-audit-field--reason">
					<label htmlFor={fieldId("reason-mode")}>{messages.reasonLabel}</label>
					<div className="owner-audit-field__controls">
						<span className="owner-audit-select">
							<OwnerSelect
								id={fieldId("reason-mode")}
								value={draft.reasonMode}
								items={[
									{ value: "any", label: messages.reasonAny },
									{ value: "contains", label: messages.reasonContains },
									{ value: "missing", label: messages.reasonMissing },
								]}
								onValueChange={(value) =>
									update(
										"reasonMode",
										(value ?? "any") as OwnerAuditFilterSelection["reasonMode"],
									)
								}
							/>
						</span>
						<input
							id={fieldId("reason-text")}
							type="text"
							maxLength={240}
							aria-label={messages.reasonTextInput}
							disabled={draft.reasonMode !== "contains"}
							value={draft.reasonText}
							onChange={(event) => update("reasonText", event.target.value)}
						/>
					</div>
				</div>

				<p
					className="owner-audit-filters__problem"
					id={fieldId("date-problem")}
					role={dateProblem ? "alert" : undefined}
				>
					{dateProblem}
				</p>

				<div className="owner-audit-filters__actions">
					<Button type="submit">{messages.apply}</Button>
					<Button type="button" variant="outline" onClick={handleClear}>
						{messages.clear}
					</Button>
				</div>
			</form>

			{audit.status === "success" ? (
				audit.entries.length === 0 ? (
					<OwnerAuditEmpty onClear={handleClear} />
				) : (
					<>
						<OwnerAuditTable
							entries={audit.entries}
							timeZone={audit.timeZone}
						/>
						<div className="owner-audit__pager">
							<p aria-live="polite">
								{messages.resultsCount}{" "}
								<bdi>{formatNumber(audit.entries.length, locale)}</bdi>
							</p>
							{audit.hasNextPage ? (
								<Button
									type="button"
									variant="outline"
									onClick={audit.fetchNextPage}
									disabled={audit.isFetchingNextPage}
								>
									{audit.isFetchingNextPage
										? messages.loadingMore
										: messages.loadMore}
								</Button>
							) : (
								<span className="owner-audit__end">
									{messages.endOfHistory}
								</span>
							)}
						</div>
					</>
				)
			) : null}
		</section>
	);
}
