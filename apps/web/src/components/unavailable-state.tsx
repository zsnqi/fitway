import { RadioTower } from "lucide-react";

import { useI18n } from "@/i18n/provider";

export function UnavailableState() {
	const { messages } = useI18n();

	return (
		<section
			className="w-full rounded-xl border border-[color:rgb(138_143_153_/_30%)] bg-offline-background p-5 text-start shadow-[var(--fw-shadow-md)] sm:p-6"
			role="status"
		>
			<div className="flex items-start gap-4">
				<div className="grid size-11 shrink-0 place-items-center rounded-full bg-[color:rgb(138_143_153_/_18%)] text-offline-foreground">
					<RadioTower className="size-6" aria-hidden="true" />
				</div>
				<div className="min-w-0">
					<p className="mb-2 font-semibold text-offline-foreground text-sm">
						{messages.publicPage.eyebrow}
					</p>
					<h1 className="m-0 text-balance font-bold text-2xl leading-snug sm:text-3xl">
						{messages.publicPage.unavailableTitle}
					</h1>
					<p className="mt-3 mb-0 text-pretty text-muted-foreground text-sm leading-relaxed sm:text-base">
						{messages.publicPage.unavailableDescription}
					</p>
				</div>
			</div>
		</section>
	);
}
