import { Button } from "@fitway/ui/components/button";
import { RefreshCw, TriangleAlert } from "lucide-react";

import { useI18n } from "@/i18n/provider";

export function PublicErrorState({
	onRetry,
	isRetrying = false,
}: {
	onRetry: () => void;
	isRetrying?: boolean;
}) {
	const { messages } = useI18n();

	return (
		<section
			className="public-state-card public-state-card--error"
			role="alert"
			aria-labelledby="public-error-title"
		>
			<div className="public-live__status-row">
				<span className="public-live__open-status">
					<span
						className="public-live__open-dot"
						data-tone="error"
						aria-hidden="true"
					/>
					{messages.publicPage.errorTitle}
				</span>
			</div>
			<div className="public-state-card__body">
				<div
					className="public-state-card__icon"
					data-tone="error"
					aria-hidden="true"
				>
					<TriangleAlert />
				</div>
				<p className="public-state-card__eyebrow">
					{messages.publicPage.eyebrow}
				</p>
				<h1 id="public-error-title">{messages.publicPage.errorTitle}</h1>
				<p className="public-state-card__copy">
					{messages.publicPage.errorDescription}
				</p>
				<Button
					type="button"
					variant="default"
					onClick={onRetry}
					disabled={isRetrying}
				>
					<RefreshCw aria-hidden="true" />
					{isRetrying
						? messages.publicPage.retrying
						: messages.publicPage.retry}
				</Button>
			</div>
		</section>
	);
}
