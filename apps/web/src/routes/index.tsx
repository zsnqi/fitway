import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { BrandHeader } from "@/components/brand-header";
import { PublicStatusSkeleton } from "@/components/public-status-skeleton";
import { UnavailableState } from "@/components/unavailable-state";
import { fetchPublicOccupancy } from "@/lib/public-occupancy";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	const occupancy = useQuery({
		queryKey: ["public-occupancy"],
		queryFn: fetchPublicOccupancy,
		retry: false,
		staleTime: 30_000,
	});

	return (
		<div className="grid min-h-svh grid-rows-[auto_1fr] bg-background">
			<BrandHeader />
			<main className="mx-auto grid w-full max-w-[var(--fw-container-public)] place-items-center px-4 py-8 sm:px-6 sm:py-12">
				{occupancy.isPending ? <PublicStatusSkeleton /> : <UnavailableState />}
			</main>
		</div>
	);
}
