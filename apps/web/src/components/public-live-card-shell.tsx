import type { ComponentPropsWithoutRef, ReactNode } from "react";

type PublicLiveCardShellProps = Omit<
	ComponentPropsWithoutRef<"section">,
	"children"
> & {
	children?: ReactNode;
	status: ReactNode;
	desktopFreshness?: ReactNode;
	alert?: ReactNode;
	crowdLabel: ReactNode;
	crowdValue: ReactNode;
	countLabel: ReactNode;
	countValue: ReactNode;
	signal: ReactNode;
	mobileFreshness?: ReactNode;
};

export function PublicLiveCardShell({
	status,
	desktopFreshness,
	alert,
	crowdLabel,
	crowdValue,
	countLabel,
	countValue,
	signal,
	mobileFreshness,
	children,
	className,
	...sectionProps
}: PublicLiveCardShellProps) {
	return (
		<section
			className={["public-live-card", className].filter(Boolean).join(" ")}
			{...sectionProps}
		>
			<div className="public-live__status-row">
				{status}
				{desktopFreshness ? (
					<div className="public-live__freshness public-live__freshness--desktop">
						{desktopFreshness}
					</div>
				) : null}
			</div>

			{alert ? <div className="public-live__alert-row">{alert}</div> : null}

			<div className="public-live__hero">
				<div className="public-live__metric public-live__metric--band">
					<div className="public-live__metric-label">{crowdLabel}</div>
					<div className="public-live__metric-primary">{crowdValue}</div>
				</div>
				<div className="public-live__metric public-live__metric--count">
					<div className="public-live__metric-label">{countLabel}</div>
					<div className="public-live__metric-primary">{countValue}</div>
				</div>
			</div>

			<div className="public-live__signal-slot">{signal}</div>

			{mobileFreshness ? (
				<div className="public-live__freshness public-live__freshness--mobile">
					{mobileFreshness}
				</div>
			) : null}

			{children}
		</section>
	);
}
