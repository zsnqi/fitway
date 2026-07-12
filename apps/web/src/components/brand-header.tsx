import { Button } from "@fitway/ui/components/button";
import { Languages } from "lucide-react";

import { useI18n } from "@/i18n/provider";

export function BrandHeader() {
	const { messages, toggleLocale } = useI18n();

	return (
		<header className="mx-auto flex w-full max-w-[var(--fw-container-public)] items-center justify-between gap-4 px-4 py-5 sm:px-6">
			<div className="flex min-w-0 items-center gap-3">
				<img
					src="/fitway-logo.png"
					alt=""
					width="40"
					height="40"
					className="size-10 shrink-0 object-contain"
				/>
				<bdi className="truncate font-bold text-lg tracking-[0.08em]">
					{messages.common.brandName}
				</bdi>
			</div>
			<Button
				type="button"
				variant="ghost"
				size="sm"
				onClick={toggleLocale}
				aria-label={messages.common.languageSwitchLabel}
				className="shrink-0"
			>
				<Languages aria-hidden="true" />
				<bdi>{messages.common.languageSwitchText}</bdi>
			</Button>
		</header>
	);
}
