import {
	type ReactNode,
	type TransitionEvent,
	useEffect,
	useId,
	useRef,
	useState,
} from "react";

import "./owner-retained-disclosure.css";

const DISCLOSURE_DURATION_MS = 180;
type DisclosurePhase = "closed" | "entering" | "open" | "closing";

export function OwnerRetainedDisclosure({
	className,
	summary,
	children,
}: {
	className: string;
	summary: ReactNode;
	children: ReactNode;
}) {
	const contentId = useId();
	const triggerRef = useRef<HTMLButtonElement | null>(null);
	const clipRef = useRef<HTMLDivElement | null>(null);
	const bodyRef = useRef<HTMLDivElement | null>(null);
	const desiredOpenRef = useRef(false);
	const transitionIdRef = useRef(0);
	const frameRef = useRef(0);
	const timeoutRef = useRef(0);
	const [open, setOpen] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [phase, setPhase] = useState<DisclosurePhase>("closed");
	const [blockSize, setBlockSize] = useState<number | null>(0);

	function clearAsyncWork() {
		if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
		if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
		frameRef.current = 0;
		timeoutRef.current = 0;
	}

	function finish(transitionId: number) {
		if (transitionIdRef.current !== transitionId) return;
		clearAsyncWork();
		if (desiredOpenRef.current) {
			setPhase("open");
			setBlockSize(null);
			return;
		}
		setMounted(false);
		setPhase("closed");
		setBlockSize(0);
	}

	function scheduleFinish(transitionId: number) {
		timeoutRef.current = window.setTimeout(
			() => finish(transitionId),
			DISCLOSURE_DURATION_MS + 40,
		);
	}

	function reducedMotion() {
		return Boolean(
			window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
		);
	}

	function openDisclosure() {
		clearAsyncWork();
		const transitionId = ++transitionIdRef.current;
		desiredOpenRef.current = true;
		setOpen(true);

		if (reducedMotion()) {
			setMounted(true);
			setPhase("open");
			setBlockSize(null);
			return;
		}

		const clip = clipRef.current;
		if (mounted && clip) {
			setBlockSize(clip.getBoundingClientRect().height);
			setPhase("open");
		} else {
			setMounted(true);
			setBlockSize(0);
			setPhase("entering");
		}

		frameRef.current = window.requestAnimationFrame(() => {
			frameRef.current = 0;
			if (transitionIdRef.current !== transitionId) return;
			setBlockSize(bodyRef.current?.scrollHeight ?? 0);
			setPhase("open");
			scheduleFinish(transitionId);
		});
	}

	function closeDisclosure() {
		clearAsyncWork();
		const transitionId = ++transitionIdRef.current;
		desiredOpenRef.current = false;
		setOpen(false);
		if (bodyRef.current?.contains(document.activeElement)) {
			triggerRef.current?.focus();
		}

		if (reducedMotion()) {
			setMounted(false);
			setPhase("closed");
			setBlockSize(0);
			return;
		}

		setBlockSize(clipRef.current?.getBoundingClientRect().height ?? 0);
		setPhase("closing");
		frameRef.current = window.requestAnimationFrame(() => {
			frameRef.current = 0;
			if (transitionIdRef.current !== transitionId) return;
			setBlockSize(0);
			scheduleFinish(transitionId);
		});
	}

	useEffect(
		() => () => {
			if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
			if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
		},
		[],
	);

	function handleTransitionEnd(event: TransitionEvent<HTMLDivElement>) {
		if (
			event.target !== event.currentTarget ||
			event.propertyName !== "block-size"
		)
			return;
		finish(transitionIdRef.current);
	}

	return (
		<div className={className} data-open={open ? "" : undefined}>
			<button
				type="button"
				ref={triggerRef}
				className="owner-retained-disclosure__trigger"
				aria-expanded={open}
				aria-controls={contentId}
				onClick={open ? closeDisclosure : openDisclosure}
			>
				{summary}
			</button>
			{mounted ? (
				<div
					ref={clipRef}
					className="owner-retained-disclosure__clip"
					data-disclosure-state={phase}
					style={
						blockSize === null ? undefined : { blockSize: `${blockSize}px` }
					}
					onTransitionEnd={handleTransitionEnd}
				>
					<div
						ref={bodyRef}
						id={contentId}
						className="owner-retained-disclosure__body"
						aria-hidden={!open}
						inert={!open}
					>
						{children}
					</div>
				</div>
			) : null}
		</div>
	);
}
