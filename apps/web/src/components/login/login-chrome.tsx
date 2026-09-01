import { CircleAlert, CircleSlash2, Clock3 } from "lucide-react";
import type { ReactNode } from "react";

import { useI18n } from "@/i18n/provider";

export type LoginMessageKind =
	| "invalid-pin"
	| "invalid-credentials"
	| "rate-limited"
	| "service";

export function LoginRail() {
	const { messages, toggleLocale } = useI18n();

	return (
		<header className="login-rail">
			<button
				type="button"
				className="login-rail__language"
				onClick={toggleLocale}
				aria-label={messages.common.languageSwitchLabel}
			>
				<bdi>{messages.common.languageSwitchText}</bdi>
			</button>
			<div className="login-rail__brand">
				<bdi>{messages.common.brandName}</bdi>
				<img
					className="login-rail__mark"
					src="/fitway-logo.png"
					alt=""
					width="24"
					height="24"
					aria-hidden="true"
				/>
			</div>
		</header>
	);
}

export function LoginStatusMessage({
	kind,
	children,
}: {
	kind: LoginMessageKind;
	children: ReactNode;
}) {
	const tone =
		kind === "rate-limited"
			? "delayed"
			: kind === "service"
				? "offline"
				: "error";
	const Icon =
		tone === "delayed"
			? Clock3
			: tone === "offline"
				? CircleSlash2
				: CircleAlert;

	return (
		<p
			id="staff-pin-error"
			className="login-field__message"
			data-tone={tone}
			role="alert"
		>
			<Icon aria-hidden="true" />
			<span>{children}</span>
		</p>
	);
}

export function LoginSubmittingIndicator() {
	return <span className="login-submit__spinner" aria-hidden="true" />;
}
