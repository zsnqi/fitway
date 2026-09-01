import type { PublicOccupancyClosedPayload } from "@fitway/api/public-occupancy";
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
			<div className="public-state-card__body">
				<span className="public-state-card__status" data-tone="closed">
					<span aria-hidden="true" />
					{messages.publicPage.closedStatus}
				</span>
				<div className="public-state-card__closed-copy">
					<h1 id="closed-title">{messages.publicPage.closedTitle}</h1>
					{opening && payload.nextOpenAt ? (
						<p className="public-state-card__detail">
							<time dateTime={payload.nextOpenAt}>
								<bdi>{opening}</bdi>
							</time>
						</p>
					) : null}
				</div>
				<p className="fw-sr-only">
					{messages.publicPage.closedSummary(opening)}
				</p>
			</div>
		</section>
	);
}
