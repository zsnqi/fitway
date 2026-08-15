import { AUDIT_ACTIONS, AUDIT_ACTOR_KINDS } from "@fitway/api/audit/list";
import { Button } from "@fitway/ui/components/button";
import { type FormEvent, useId, useState } from "react";

import {
	emptyOwnerAuditSelection,
	type OwnerAuditFilterSelection,
	useOwnerAudit,
} from "@/hooks/use-owner-audit";
import { formatNumber } from "@/i18n/format";
import { useI18n } from "@/i18n/provider";

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
	const audit = useOwnerAudit(applied);
	const ids = useId();
	const fieldId = (name: string) => `${ids}-${name}`;

	function update<Key extends keyof OwnerAuditFilterSelection>(
		key: Key,
		value: OwnerAuditFilterSelection[Key],
	) {
		setDraft((current) => ({ ...current, [key]: value }));
	}

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setApplied(draft);
	}

	function handleClear() {
		setDraft(emptyOwnerAuditSelection);
		setApplied(emptyOwnerAuditSelection);
	}

	// Without the configured gym timezone no record can be dated, and `/admin`
	// already carries one live region and one retry for that same cause. A second
	// copy would be noise for a screen reader and a duplicate control for everyone
	// else, so the section stands down entirely until the timezone is known.
	if (audit.status === "unavailable" || !audit.timeZone) return null;

	return (
		<section className="owner-audit" aria-labelledby={fieldId("heading")}>
			<header className="owner-audit__heading">
				<h2 id={fieldId("heading")}>{messages.title}</h2>
				<p>{messages.description}</p>
				<span className="owner-audit__zone">
					{messages.timeZoneLabel} <bdi>{audit.timeZone}</bdi>
				</span>
			</header>

			<form
				className="owner-audit-filters"
				aria-label={messages.filtersLabel}
				onSubmit={handleSubmit}
			>
				<div className="owner-audit-field">
					<label htmlFor={fieldId("action")}>{messages.actionLabel}</label>
					<select
						id={fieldId("action")}
						value={draft.action}
						onChange={(event) =>
							update(
								"action",
								event.target.value as OwnerAuditFilterSelection["action"],
							)
						}
					>
						<option value="any">{messages.anyOption}</option>
						{AUDIT_ACTIONS.map((action) => (
							<option key={action} value={action}>
								{messages[action]}
							</option>
						))}
					</select>
				</div>

				<div className="owner-audit-field">
					<label htmlFor={fieldId("actor")}>{messages.actorLabel}</label>
					<select
						id={fieldId("actor")}
						value={draft.actor}
						onChange={(event) =>
							update(
								"actor",
								event.target.value as OwnerAuditFilterSelection["actor"],
							)
						}
					>
						<option value="any">{messages.anyOption}</option>
						{AUDIT_ACTOR_KINDS.map((kind) => (
							<option key={kind} value={kind}>
								{messages[kind]}
							</option>
						))}
					</select>
				</div>

				<div className="owner-audit-field owner-audit-field--pair">
					<label htmlFor={fieldId("prior-mode")}>{messages.priorLabel}</label>
					<div className="owner-audit-field__controls">
						<select
							id={fieldId("prior-mode")}
							value={draft.priorMode}
							onChange={(event) =>
								update(
									"priorMode",
									event.target.value as OwnerAuditFilterSelection["priorMode"],
								)
							}
						>
							<option value="any">{messages.priorAny}</option>
							<option value="value">{messages.priorValue}</option>
							<option value="missing">{messages.priorMissing}</option>
						</select>
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

				<div className="owner-audit-field">
					<label htmlFor={fieldId("effective")}>
						{messages.effectiveLabel}
					</label>
					<input
						id={fieldId("effective")}
						type="number"
						inputMode="numeric"
						min={0}
						step={1}
						value={draft.effectiveValue}
						onChange={(event) => update("effectiveValue", event.target.value)}
					/>
				</div>

				<div className="owner-audit-field">
					<label htmlFor={fieldId("occurred-from")}>
						{messages.occurredFromLabel}
					</label>
					<input
						id={fieldId("occurred-from")}
						type="date"
						value={draft.occurredFromDay}
						onChange={(event) => update("occurredFromDay", event.target.value)}
					/>
				</div>

				<div className="owner-audit-field">
					<label htmlFor={fieldId("occurred-to")}>
						{messages.occurredToLabel}
					</label>
					<input
						id={fieldId("occurred-to")}
						type="date"
						value={draft.occurredToDay}
						onChange={(event) => update("occurredToDay", event.target.value)}
					/>
				</div>

				<div className="owner-audit-field owner-audit-field--pair">
					<label htmlFor={fieldId("reason-mode")}>{messages.reasonLabel}</label>
					<div className="owner-audit-field__controls">
						<select
							id={fieldId("reason-mode")}
							value={draft.reasonMode}
							onChange={(event) =>
								update(
									"reasonMode",
									event.target.value as OwnerAuditFilterSelection["reasonMode"],
								)
							}
						>
							<option value="any">{messages.reasonAny}</option>
							<option value="contains">{messages.reasonContains}</option>
							<option value="missing">{messages.reasonMissing}</option>
						</select>
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

				<div className="owner-audit-filters__actions">
					<Button type="submit">{messages.apply}</Button>
					<Button type="button" variant="outline" onClick={handleClear}>
						{messages.clear}
					</Button>
				</div>
			</form>

			{audit.status === "pending" ? <OwnerAuditLoading /> : null}
			{audit.status === "error" ? (
				<OwnerAuditError onRetry={audit.retry} />
			) : null}
			{audit.status === "success" ? (
				audit.entries.length === 0 ? (
					<OwnerAuditEmpty />
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
