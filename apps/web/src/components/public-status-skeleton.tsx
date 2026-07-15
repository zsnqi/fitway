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
			status={<SkeletonLine className="public-live__skeleton-status" />}
			desktopFreshness={
				<SkeletonLine className="public-live__skeleton-freshness" />
			}
			crowdLabel={
				<SkeletonLine className="public-live__skeleton-crowd-label" />
			}
			crowdValue={
				<SkeletonLine className="public-live__skeleton-crowd-value" />
			}
			countLabel={
				<SkeletonLine className="public-live__skeleton-count-label" />
			}
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
