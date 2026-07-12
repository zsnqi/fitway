import { Skeleton } from "@fitway/ui/components/skeleton";

import { useI18n } from "@/i18n/provider";

export function PublicStatusSkeleton() {
	const { messages } = useI18n();

	return (
		<section
			className="w-full rounded-xl border bg-surface p-5 sm:p-6"
			aria-busy="true"
		>
			<p className="fw-sr-only" role="status">
				{messages.publicPage.loading}
			</p>
			<div className="flex items-start gap-4" aria-hidden="true">
				<Skeleton className="size-11 shrink-0 rounded-full" />
				<div className="w-full min-w-0">
					<Skeleton className="mb-3 h-4 w-28" />
					<Skeleton className="mb-3 h-9 w-4/5" />
					<Skeleton className="h-5 w-full max-w-80" />
				</div>
			</div>
		</section>
	);
}
