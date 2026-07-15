import { createFileRoute } from "@tanstack/react-router";

import { BrandHeader } from "@/components/brand-header";
import { ClosedState } from "@/components/closed-state";
import { OccupancyStatus } from "@/components/occupancy-status";
import { PublicAtmosphere } from "@/components/public-atmosphere";
import { PublicErrorState } from "@/components/public-error-state";
import { PublicStatusSkeleton } from "@/components/public-status-skeleton";
import { SkipLink } from "@/components/skip-link";
import { UnavailableState } from "@/components/unavailable-state";
import { usePublicOccupancy } from "@/hooks/use-public-occupancy";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	const occupancy = usePublicOccupancy();
	let content = <UnavailableState />;
	if (occupancy.isPending) content = <PublicStatusSkeleton />;
	else if (occupancy.isError) {
		content = (
			<PublicErrorState
				onRetry={() => void occupancy.refetch()}
				isRetrying={occupancy.isFetching}
			/>
		);
	} else if (
		occupancy.payload?.freshness === "closed" &&
		occupancy.effectiveFreshness === "closed"
	) {
		content = <ClosedState payload={occupancy.payload} />;
	} else if (
		occupancy.payload &&
		(occupancy.payload.freshness === "fresh" ||
			occupancy.payload.freshness === "stale") &&
		(occupancy.effectiveFreshness === "fresh" ||
			occupancy.effectiveFreshness === "stale")
	) {
		content = (
			<OccupancyStatus
				payload={occupancy.payload}
				freshness={occupancy.effectiveFreshness}
				now={occupancy.now}
			/>
		);
	}
	return (
		<div className="public-page-shell">
			<PublicAtmosphere />
			<SkipLink />
			<BrandHeader />
			<main id="main-content" className="public-page-main" tabIndex={-1}>
				{content}
			</main>
		</div>
	);
}
