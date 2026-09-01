import { useI18n } from "@/i18n/provider";
import { CrowdSignal } from "./crowd-signal";
import { PublicLiveCardShell } from "./public-live-card-shell";

function SkeletonLine({ className }: { className: string }) {
	return (
		<span className={`public-live__skeleton ${className}`} aria-hidden="true" />
	);
}

export function PublicStatusSkeleton() {
	const { messages } = useI18n();

	return (
		<PublicLiveCardShell
			className="public-live-card--loading"
			aria-busy="true"
			aria-labelledby="public-loading-title"
			statusKicker={messages.publicPage.eyebrow}
			status={
				<span className="public-live__open-status public-live__loading-status">
					<span className="public-live__loading-dot" aria-hidden="true" />
					{messages.publicPage.loadingStatus}
				</span>
			}
			freshness={<SkeletonLine className="public-live__skeleton-freshness" />}
			crowdLabel={messages.publicPage.crowdLevel}
			crowdValue={
				<SkeletonLine className="public-live__skeleton-crowd-value" />
			}
			countLabel={messages.publicPage.approximateCount}
			countValue={
				<SkeletonLine className="public-live__skeleton-count-value" />
			}
			signal={<CrowdSignal skeleton />}
		>
			<h1 id="public-loading-title" className="fw-sr-only">
				{messages.publicPage.loading}
			</h1>
			<p className="fw-sr-only" role="status">
				{messages.publicPage.loading}
			</p>
		</PublicLiveCardShell>
	);
}
