import { useI18n } from "@/i18n/provider";

export function UnavailableState() {
	const { messages } = useI18n();

	return (
		<section
			className="public-state-card public-state-card--unavailable"
			role="status"
			aria-labelledby="unavailable-title"
		>
			<div className="public-state-card__body">
				<span className="public-state-card__status" data-tone="offline">
					<span aria-hidden="true" />
					{messages.publicPage.unavailableStatus}
				</span>
				<h1 id="unavailable-title">{messages.publicPage.unavailableTitle}</h1>
				<p className="fw-sr-only">
					{messages.publicPage.unavailableDescription}
				</p>
			</div>
		</section>
	);
}
