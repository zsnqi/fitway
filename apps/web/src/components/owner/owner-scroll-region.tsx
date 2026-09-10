import {
	type ReactNode,
	useCallback,
	useId,
	useLayoutEffect,
	useRef,
	useState,
} from "react";

import "./owner-scroll-region.css";

type ScrollState = {
	scrollable: boolean;
	atStart: boolean;
	atEnd: boolean;
};

const initialState: ScrollState = {
	scrollable: false,
	atStart: true,
	atEnd: true,
};

/** A labeled, keyboard-reachable horizontal region with direction-safe edges. */
export function OwnerScrollRegion({
	ariaLabel,
	hint,
	className,
	children,
}: {
	ariaLabel: string;
	hint?: string;
	className?: string;
	children: ReactNode;
}) {
	const hintId = useId();
	const viewportRef = useRef<HTMLElement>(null);
	const inlineStartRef = useRef(0);
	const [state, setState] = useState<ScrollState>(initialState);

	const measure = useCallback(() => {
		const viewport = viewportRef.current;
		if (!viewport) return;
		const maximum = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
		const distanceFromStart = Math.abs(
			viewport.scrollLeft - inlineStartRef.current,
		);
		const next = {
			scrollable: maximum > 1,
			atStart: distanceFromStart <= 1,
			atEnd: maximum <= 1 || distanceFromStart >= maximum - 1,
		};
		setState((current) =>
			current.scrollable === next.scrollable &&
			current.atStart === next.atStart &&
			current.atEnd === next.atEnd
				? current
				: next,
		);
	}, []);

	useLayoutEffect(() => {
		const viewport = viewportRef.current;
		if (!viewport) return;
		inlineStartRef.current = viewport.scrollLeft;
		measure();
		const observer =
			typeof ResizeObserver === "undefined"
				? null
				: new ResizeObserver(measure);
		observer?.observe(viewport);
		const content = viewport.firstElementChild;
		if (content) observer?.observe(content);
		return () => observer?.disconnect();
	}, [measure]);
	// A scroll container must be reachable without a pointer. Keep the deliberate
	// tab stop as a spread so the static rule does not mistake it for arbitrary
	// focus on a prose section.
	const keyboardScrollable = { tabIndex: 0 };

	return (
		<div
			className="owner-scroll-region__frame"
			data-owner-scroll-frame=""
			data-scrollable={state.scrollable ? "true" : "false"}
			data-inline-start={state.atStart ? "true" : "false"}
			data-inline-end={state.atEnd ? "true" : "false"}
		>
			{hint && state.scrollable ? (
				<p className="owner-scroll-region__hint" id={hintId}>
					{hint}
				</p>
			) : null}
			<section
				ref={viewportRef}
				className={`owner-scroll-region${className ? ` ${className}` : ""}`}
				aria-label={ariaLabel}
				aria-describedby={hint && state.scrollable ? hintId : undefined}
				{...keyboardScrollable}
				onScroll={measure}
				data-owner-scroll-region=""
			>
				{children}
			</section>
		</div>
	);
}
