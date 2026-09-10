import type { AuditEntryView } from "@fitway/api/audit/list";
import { Button } from "@fitway/ui/components/button";
import { Activity, AlertTriangle, CircleCheck, RefreshCw } from "lucide-react";

import { formatDate, formatGymTime, formatNumber } from "@/i18n/format";
import { useI18n } from "@/i18n/provider";

import { OwnerAsyncSwap } from "../owner-async-swap";
import { OwnerScrollRegion } from "../owner-scroll-region";
import { OwnerStatePanel } from "../owner-state-panel";
import type { OwnerAuditMessages } from "./messages";
import { useOwnerAuditMessages } from "./use-owner-audit-messages";

import "./owner-audit.css";

/**
 * The gym-local calendar day of a persisted UTC instant.
 *
 * `formatGymTime` renders the clock time; audit history spans days, so the day is
 * rendered beside it. Both take the configured gym timezone, so the reader's own
 * device zone never changes what a record says.
 */
function gymDay(
	createdAtUtc: string,
	locale: "ar" | "en",
	timeZone: string,
): string {
	return formatDate(new Date(createdAtUtc), locale, {
		timeZone,
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

export function actorLabel(
	actor: AuditEntryView["actor"],
	messages: OwnerAuditMessages,
): string {
	if (actor.kind === "system") return messages.actorSystem;
	const role =
		actor.role === "owner" ? messages.actorRoleOwner : messages.actorRoleStaff;
	return actor.displayName ? `${actor.displayName} · ${role}` : role;
}

function CountValue({ value }: { value: number | null }) {
	const { locale } = useI18n();
	const messages = useOwnerAuditMessages();
	if (value === null) {
		return <span className="owner-audit__absent">{messages.notRecorded}</span>;
	}
	return <bdi>{formatNumber(value, locale)}</bdi>;
}

function GovernanceValue({ entry }: { entry: AuditEntryView }) {
	const { locale } = useI18n();
	const messages = useOwnerAuditMessages();
	if (entry.priorActive !== null && entry.newActive !== null) {
		return (
			<span className="owner-audit__change">
				{entry.priorActive ? messages.active : messages.inactive}
				<span aria-hidden="true" className="owner-audit__arrow">
					{locale === "ar" ? "←" : "→"}
				</span>
				{entry.newActive ? messages.active : messages.inactive}
			</span>
		);
	}
	if (
		entry.priorCredentialVersion !== null &&
		entry.newCredentialVersion !== null
	) {
		return (
			<span className="owner-audit__change">
				<bdi>{`${messages.credentialVersion} ${formatNumber(entry.priorCredentialVersion, locale)}`}</bdi>
				<span aria-hidden="true" className="owner-audit__arrow">
					{locale === "ar" ? "←" : "→"}
				</span>
				<bdi>{`${messages.credentialVersion} ${formatNumber(entry.newCredentialVersion, locale)}`}</bdi>
			</span>
		);
	}
	if (entry.settingsVersion !== null) {
		return (
			<bdi>{`${messages.settingsVersion} ${formatNumber(entry.settingsVersion, locale)}`}</bdi>
		);
	}
	return <span className="owner-audit__absent">{messages.notRecorded}</span>;
}

function ChangeValue({ entry }: { entry: AuditEntryView }) {
	const { locale } = useI18n();
	if (entry.eventClass !== "command") return <GovernanceValue entry={entry} />;
	return (
		<span className="owner-audit__change">
			<CountValue value={entry.priorValue} />
			{/* The change arrow points along the reading direction. */}
			<span aria-hidden="true" className="owner-audit__arrow">
				{locale === "ar" ? "←" : "→"}
			</span>
			<CountValue value={entry.effectiveValue} />
		</span>
	);
}

function RequestedValue({ entry }: { entry: AuditEntryView }) {
	const { locale } = useI18n();
	const messages = useOwnerAuditMessages();
	if (entry.requestedDelta !== null) {
		const floored =
			entry.priorValue !== null && entry.priorValue + entry.requestedDelta < 0;
		return (
			<span className="owner-audit__requested">
				<bdi dir="ltr">
					{entry.requestedDelta > 0 ? "+" : "-"}
					{formatNumber(Math.abs(entry.requestedDelta), locale)}
				</bdi>
				{floored ? <em>{messages.flooredNote}</em> : null}
			</span>
		);
	}
	if (entry.requestedValue !== null) {
		return <bdi>{formatNumber(entry.requestedValue, locale)}</bdi>;
	}
	return <span className="owner-audit__absent">{messages.notRecorded}</span>;
}

export function OwnerAuditTable({
	entries,
	timeZone,
}: {
	entries: readonly AuditEntryView[];
	timeZone: string;
}) {
	const { locale } = useI18n();
	const messages = useOwnerAuditMessages();
	return (
		<OwnerAsyncSwap stateKey="table">
			<section className="owner-audit-board">
				<header className="owner-audit-board__heading">
					<h2>{messages.tableRegion}</h2>
					<p className="owner-audit-board__count">
						{messages.resultsCount}{" "}
						<bdi>{formatNumber(entries.length, locale)}</bdi>
					</p>
				</header>
				<OwnerScrollRegion
					className="owner-audit-region"
					ariaLabel={messages.tableRegion}
					hint={messages.scrollHint}
				>
					<table data-owner-audit-table="">
						<thead>
							<tr>
								<th scope="col">{messages.columnTime}</th>
								<th scope="col">{messages.columnActor}</th>
								<th scope="col">{messages.columnTarget}</th>
								<th scope="col">{messages.columnAction}</th>
								<th scope="col">{messages.columnChange}</th>
								<th scope="col">{messages.columnRequested}</th>
								<th scope="col">{messages.columnReason}</th>
							</tr>
						</thead>
						<tbody>
							{entries.map((entry) => (
								<tr
									key={entry.id}
									data-action={entry.action}
									data-actor={entry.actor.kind}
								>
									<td>
										<bdi dir="auto">
											{gymDay(entry.createdAtUtc, locale, timeZone)}
										</bdi>{" "}
										<bdi dir="auto">
											{formatGymTime(
												new Date(entry.createdAtUtc),
												locale,
												timeZone,
											)}
										</bdi>
									</td>
									<td>
										<bdi dir="auto">{actorLabel(entry.actor, messages)}</bdi>
									</td>
									<td>
										{entry.target === null ? (
											<span className="owner-audit__absent">
												{messages.noTarget}
											</span>
										) : (
											<bdi dir="auto">{entry.target.displayName}</bdi>
										)}
									</td>
									<td>{messages[entry.action]}</td>
									<td>
										<ChangeValue entry={entry} />
									</td>
									<td>
										<RequestedValue entry={entry} />
									</td>
									<td>
										{entry.reason === null ? (
											<span className="owner-audit__absent">
												{messages.noReason}
											</span>
										) : (
											<bdi dir="auto">{entry.reason}</bdi>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</OwnerScrollRegion>
			</section>
		</OwnerAsyncSwap>
	);
}

export function OwnerAuditLoading() {
	const messages = useOwnerAuditMessages();
	return (
		<OwnerAsyncSwap stateKey="loading">
			<OwnerStatePanel
				variant="loading"
				className="owner-state-panel--card owner-audit-state owner-audit-state--loading"
				dataAttribute={{ "data-owner-audit-state": "loading" }}
				icon={<Activity aria-hidden="true" />}
				loadingContent={
					<div className="owner-audit-loading-bars" aria-hidden="true">
						<i />
						<i />
						<i />
					</div>
				}
			>
				<div>
					<h3>{messages.loading}</h3>
					<p>{messages.loadingDescription}</p>
				</div>
			</OwnerStatePanel>
		</OwnerAsyncSwap>
	);
}

export function OwnerAuditError({ onRetry }: { onRetry: () => void }) {
	const messages = useOwnerAuditMessages();
	return (
		<OwnerAsyncSwap stateKey="error">
			<OwnerStatePanel
				variant="error"
				className="owner-state-panel--card owner-audit-state owner-audit-state--error"
				dataAttribute={{ "data-owner-audit-state": "error" }}
				icon={<AlertTriangle aria-hidden="true" />}
				action={
					<Button type="button" onClick={onRetry}>
						<RefreshCw aria-hidden="true" />
						{messages.retry}
					</Button>
				}
			>
				<div>
					<h3>{messages.errorTitle}</h3>
					<p>{messages.errorDescription}</p>
				</div>
			</OwnerStatePanel>
		</OwnerAsyncSwap>
	);
}

export function OwnerAuditEmpty({ onClear }: { onClear: () => void }) {
	const messages = useOwnerAuditMessages();
	return (
		<OwnerAsyncSwap stateKey="empty">
			<OwnerStatePanel
				variant="empty"
				className="owner-state-panel--card owner-audit-state owner-audit-state--empty"
				dataAttribute={{ "data-owner-audit-state": "empty" }}
				icon={<CircleCheck aria-hidden="true" />}
				action={
					<Button type="button" variant="outline" onClick={onClear}>
						{messages.clear}
					</Button>
				}
			>
				<div>
					<h3>{messages.emptyTitle}</h3>
					<p>{messages.emptyDescription}</p>
				</div>
			</OwnerStatePanel>
		</OwnerAsyncSwap>
	);
}
