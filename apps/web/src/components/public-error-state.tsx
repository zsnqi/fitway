import { Button } from "@fitway/ui/components/button";
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
			<div className="public-state-card__body">
				<span className="public-state-card__status" data-tone="error">
					<span aria-hidden="true" />
					{messages.publicPage.errorStatus}
				</span>
				<h1 id="public-error-title">{messages.publicPage.errorTitle}</h1>
				<p className="fw-sr-only">{messages.publicPage.errorDescription}</p>
				<Button
					type="button"
					variant="default"
					onClick={onRetry}
					disabled={isRetrying}
				>
					{isRetrying
						? messages.publicPage.retrying
						: messages.publicPage.retry}
				</Button>
			</div>
		</section>
	);
}
