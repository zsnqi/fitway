import type { PublicOccupancyClosedPayload } from "@fitway/api/public-occupancy";
import { Clock, Moon } from "lucide-react";

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
			className="public-state-card public-state-card--closed"
			role="status"
			aria-labelledby="closed-title"
		>
			<div className="public-live__status-row">
				<span className="public-live__open-status">
					<span
						className="public-live__open-dot"
						data-tone="closed"
						aria-hidden="true"
					/>
					{messages.publicPage.closedTitle}
				</span>
			</div>
			<div className="public-state-card__body">
				<div
					className="public-state-card__icon"
					data-tone="closed"
					aria-hidden="true"
				>
					<Moon />
				</div>
				<p className="public-state-card__eyebrow">
					{messages.publicPage.eyebrow}
				</p>
				<h1 id="closed-title">{messages.publicPage.closedTitle}</h1>
				{opening && payload.nextOpenAt ? (
					<p className="public-state-card__detail">
						<Clock aria-hidden="true" />
						<time dateTime={payload.nextOpenAt}>
							<bdi>{opening}</bdi>
						</time>
					</p>
				) : null}
				<p className="fw-sr-only">
					{messages.publicPage.closedSummary(opening)}
				</p>
			</div>
		</section>
	);
}
