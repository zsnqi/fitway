import type { ReactNode } from "react";

import "./owner-state-panel.css";

/** The closed set of Owner state variants currently rendered by the product. */
export type OwnerStatePanelVariant =
	| "loading"
	| "empty"
	| "error"
	| "insufficient"
	| "ready"
	| "stopped"
	| "unmonitored";

/**
 * Shared semantic frame for pending, empty, error, and stopped Owner states.
 *
 * The named slots are additive. Callers that pass only `children` keep their
 * original DOM exactly, so the frozen reporting and access panels are not
 * restructured; the unified state-card treatment is opt-in through the
 * `owner-state-panel--card` class.
 */
export function OwnerStatePanel({
	variant,
	className,
	dataAttribute,
	icon,
	action,
	loadingContent,
	children,
}: {
	variant: OwnerStatePanelVariant;
	className?: string;
	dataAttribute?: Record<string, string>;
	/** Leading icon slot, rendered as the panel's first child. */
	icon?: ReactNode;
	/** Trailing action slot, rendered as the panel's last child. */
	action?: ReactNode;
	/** Trailing loading kit, rendered after the body and before the action. */
	loadingContent?: ReactNode;
	children: ReactNode;
}) {
	return (
		<section
			className={`owner-state-panel${className ? ` ${className}` : ""}`}
			role={variant === "error" ? "alert" : "status"}
			aria-live={variant === "loading" ? "polite" : undefined}
			data-owner-state-panel=""
			data-owner-state-variant={variant}
			{...dataAttribute}
		>
			{icon}
			{children}
			{loadingContent}
			{action}
		</section>
	);
}
