import type { AuditEntryView } from "@fitway/api/audit/list";
import { Button } from "@fitway/ui/components/button";
import { AlertTriangle, History, RefreshCw, ScrollText } from "lucide-react";

import { formatDate, formatGymTime, formatNumber } from "@/i18n/format";
import { useI18n } from "@/i18n/provider";

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
	// A labeled scroll region must be reachable by keyboard alone
	// (`DESIGN_GUIDE.md` §8, §13). The same spread is used by the analytics table.
	const keyboardScrollable = { tabIndex: 0 };
	return (
		<>
			<p className="owner-audit__scroll-hint">{messages.scrollHint}</p>
			<section
				className="owner-audit-region"
				aria-label={messages.tableRegion}
				{...keyboardScrollable}
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
			</section>
		</>
	);
}

export function OwnerAuditLoading() {
	const messages = useOwnerAuditMessages();
	return (
		<section
			className="owner-audit-state owner-audit-state--loading"
			role="status"
			aria-live="polite"
			data-owner-audit-state="loading"
		>
			<History aria-hidden="true" />
			<div>
				<h3>{messages.loading}</h3>
				<p>{messages.loadingDescription}</p>
			</div>
			<div className="owner-audit-loading-bars" aria-hidden="true">
				<i />
				<i />
				<i />
			</div>
		</section>
	);
}

export function OwnerAuditError({ onRetry }: { onRetry: () => void }) {
	const messages = useOwnerAuditMessages();
	return (
		<section
			className="owner-audit-state owner-audit-state--error"
			role="alert"
			data-owner-audit-state="error"
		>
			<AlertTriangle aria-hidden="true" />
			<div>
				<h3>{messages.errorTitle}</h3>
				<p>{messages.errorDescription}</p>
			</div>
			<Button type="button" onClick={onRetry}>
				<RefreshCw aria-hidden="true" />
				{messages.retry}
			</Button>
		</section>
	);
}

export function OwnerAuditEmpty() {
	const messages = useOwnerAuditMessages();
	return (
		<section
			className="owner-audit-state owner-audit-state--empty"
			role="status"
			data-owner-audit-state="empty"
		>
			<ScrollText aria-hidden="true" />
			<div>
				<h3>{messages.emptyTitle}</h3>
				<p>{messages.emptyDescription}</p>
			</div>
		</section>
	);
}
