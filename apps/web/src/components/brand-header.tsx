import { Button } from "@fitway/ui/components/button";

import { useI18n } from "@/i18n/provider";

export function BrandHeader() {
	const { messages, toggleLocale } = useI18n();

	return (
		<header className="public-site-header">
			<div className="public-site-header__inner">
				<div className="public-site-header__brand">
					<img src="/fitway-logo.png" alt="" width="44" height="44" />
					<bdi>{messages.common.brandName}</bdi>
				</div>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={toggleLocale}
					aria-label={messages.common.languageSwitchLabel}
					className="public-site-header__language"
				>
					<bdi>{messages.common.languageSwitchText}</bdi>
				</Button>
			</div>
		</header>
	);
}
