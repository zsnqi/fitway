import type { ComponentPropsWithoutRef, ReactNode } from "react";

type PublicLiveCardShellProps = Omit<
	ComponentPropsWithoutRef<"section">,
	"children"
> & {
	children?: ReactNode;
	statusKicker: ReactNode;
	status: ReactNode;
	freshness?: ReactNode;
	alert?: ReactNode;
	crowdLabel: ReactNode;
	crowdValue: ReactNode;
	countLabel: ReactNode;
	countValue: ReactNode;
	signal: ReactNode;
};

export function PublicLiveCardShell({
	status,
	statusKicker,
	freshness,
	alert,
	crowdLabel,
	crowdValue,
	countLabel,
	countValue,
	signal,
	children,
	className,
	...sectionProps
}: PublicLiveCardShellProps) {
	return (
		<section
			className={["public-live-card", className].filter(Boolean).join(" ")}
			{...sectionProps}
		>
			<div className="public-live__status-block">
				<div className="public-live__status-kicker">{statusKicker}</div>
				{status}
			</div>

			{alert ? <div className="public-live__alert-row">{alert}</div> : null}

			<div className="public-live__hero">
				<div className="public-live__metric public-live__metric--band">
					<div className="public-live__metric-label">{crowdLabel}</div>
					<div className="public-live__metric-primary">{crowdValue}</div>
					{freshness ? (
						<div className="public-live__freshness">{freshness}</div>
					) : null}
				</div>
				<div className="public-live__metric public-live__metric--count">
					<div className="public-live__metric-label">{countLabel}</div>
					<div className="public-live__metric-primary">{countValue}</div>
				</div>
			</div>

			<div className="public-live__signal-slot">{signal}</div>

			{children}
		</section>
	);
}
