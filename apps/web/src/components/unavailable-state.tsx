import { WifiOff } from "lucide-react";

import { useI18n } from "@/i18n/provider";

export function UnavailableState() {
	const { messages } = useI18n();

	return (
		<section
			className="public-state-card public-state-card--unavailable"
			role="status"
			aria-labelledby="unavailable-title"
		>
			<div className="public-live__status-row">
				<span className="public-live__open-status">
					<span
						className="public-live__open-dot"
						data-tone="offline"
						aria-hidden="true"
					/>
					{messages.publicPage.eyebrow}
				</span>
			</div>
			<div className="public-state-card__body">
				<div
					className="public-state-card__icon"
					data-tone="offline"
					aria-hidden="true"
				>
					<WifiOff />
				</div>
				<p className="public-state-card__eyebrow">
					{messages.publicPage.eyebrow}
				</p>
				<h1 id="unavailable-title">{messages.publicPage.unavailableTitle}</h1>
				<p className="public-state-card__copy">
					{messages.publicPage.unavailableDescription}
				</p>
			</div>
		</section>
	);
}
