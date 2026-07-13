import type { PublicOccupancyClosedPayload } from "@fitway/api/public-occupancy";
import { Moon } from "lucide-react";

import { formatGymTime } from "@/i18n/format";
import { useI18n } from "@/i18n/provider";

export function ClosedState({
	payload,
}: {
	payload: PublicOccupancyClosedPayload;
}) {
	const { locale, messages } = useI18n();
	const opening = payload.nextOpenAt
		? messages.publicPage.opensAt(
				formatGymTime(new Date(payload.nextOpenAt), locale, payload.timeZone),
			)
		: null;

	return (
		<section
			className="w-full rounded-2xl border bg-surface p-6 text-center shadow-[var(--fw-shadow-lg)] sm:p-8"
			role="status"
			aria-labelledby="closed-title"
		>
			<div className="mx-auto grid size-14 place-items-center rounded-full bg-surface-raised text-muted-foreground">
				<Moon className="size-7" aria-hidden="true" />
			</div>
			<div className="mt-5">
				<span className="fw-status-open fw-status-open--closed">
					<Moon className="size-4" aria-hidden="true" />
					{messages.publicPage.closedTitle}
				</span>
			</div>
			<h1
				id="closed-title"
				className="mt-5 mb-0 text-balance font-bold text-3xl leading-snug sm:text-4xl"
			>
				{messages.publicPage.closedTitle}
			</h1>
			{opening ? (
				<p className="mt-3 mb-0 text-lg text-muted-foreground tabular-nums">
					<bdi>{opening}</bdi>
				</p>
			) : null}
			<p className="fw-sr-only">{messages.publicPage.closedSummary(opening)}</p>
		</section>
	);
}
