import { Button } from "@fitway/ui/components/button";

import { useI18n } from "@/i18n/provider";

export function BrandHeader() {
	const { messages, toggleLocale } = useI18n();

	return (
		<header className="public-site-header">
			<div className="public-site-header__inner">
				<div className="public-site-header__brand">
					<bdi>{messages.common.brandName}</bdi>
					<img
						src="/fitway-logo.png"
						alt=""
						aria-hidden="true"
						width="24"
						height="24"
					/>
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
