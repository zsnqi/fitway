import { createFileRoute } from "@tanstack/react-router";

import { BrandHeader } from "@/components/brand-header";
import { OccupancyStatus } from "@/components/occupancy-status";
import { PublicStatusSkeleton } from "@/components/public-status-skeleton";
import { UnavailableState } from "@/components/unavailable-state";
import { usePublicOccupancy } from "@/hooks/use-public-occupancy";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	const occupancy = usePublicOccupancy();
	let content = <UnavailableState />;
	if (occupancy.isPending) content = <PublicStatusSkeleton />;
	else if (
		occupancy.payload &&
		occupancy.payload.freshness !== "unavailable" &&
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
		<div className="grid min-h-svh grid-rows-[auto_1fr] bg-background">
			<BrandHeader />
			<main className="mx-auto grid w-full max-w-[var(--fw-container-public)] place-items-center px-4 py-8 sm:px-6 sm:py-12">
				{content}
			</main>
		</div>
	);
}
