import type { ReactNode } from "react";

import "./owner-async-swap.css";

/**
 * A keyed Owner async seam. Only the current state is exposed, while the
 * incoming state gets a short opacity treatment and a stable minimum footprint.
 */
export function OwnerAsyncSwap({
	stateKey,
	className,
	children,
}: {
	stateKey: string;
	className?: string;
	children: ReactNode;
}) {
	return (
		<div
			className={`owner-async-swap${className ? ` ${className}` : ""}`}
			data-owner-async-swap=""
		>
			<div key={stateKey} className="owner-async-swap__current">
				{children}
			</div>
		</div>
	);
}
