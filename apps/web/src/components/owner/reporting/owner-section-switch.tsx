import {
	type KeyboardEvent,
	type ReactNode,
	useCallback,
	useLayoutEffect,
	useRef,
	useState,
} from "react";

import { useOwnerDailyAnalytics } from "@/hooks/use-owner-daily-analytics";
import { useI18n } from "@/i18n/provider";

import type { OwnerDailyAnalyticsPrerequisite } from "./owner-analytics-mode-switch";
import "./owner-reporting.css";

type OwnerSection =
	| "daily"
	| "history"
	| "access"
	| "audit"
	| "health"
	| "settings";

type OwnerSectionTransition = {
	id: number;
	source: OwnerSection;
	destination: OwnerSection;
	desiredScroll: number;
	capturedDocumentHeight: number;
	capturedContainerHeight: number;
	firstVisit: boolean;
	cancelled: boolean;
};

type OwnerSectionNavigation = {
	selected: OwnerSection;
	transition: OwnerSectionTransition | null;
};

const SETTLEMENT_WINDOW_MS = 180;

const sectionOrder: readonly OwnerSection[] = [
	"daily",
	"history",
	"access",
	"audit",
	"health",
	"settings",
];

const labels = {
	en: {
		group: "Management sections",
		daily: "Daily",
		history: "Reports",
		access: "Accounts & Sign-in",
		audit: "Activity Log",
		health: "System Status",
		settings: "Settings",
	},
	ar: {
		group: "أقسام الإدارة",
		daily: "اليومي",
		history: "التقارير",
		access: "الحسابات والدخول",
		audit: "سجل النشاط",
		health: "حالة النظام",
		settings: "الإعدادات",
	},
} as const;

function tabId(section: OwnerSection) {
	return section === "daily" || section === "history"
		? `owner-analytics-${section}-tab`
		: `owner-section-${section}-tab`;
}

function panelId(section: OwnerSection) {
	return section === "daily" || section === "history"
		? `owner-analytics-${section}-panel`
		: `owner-section-${section}-panel`;
}

type OwnerSectionRenderers = Record<
	Exclude<OwnerSection, "history">,
	ReactNode
> & {
	history: (prerequisite: OwnerDailyAnalyticsPrerequisite) => ReactNode;
};

/**
 * In-page navigation for the accepted Owner/Management family.
 *
 * Every tab and panel IDREF exists from first paint. A section subtree mounts
 * only after its first visit and remains mounted afterwards, preserving filters,
 * drafts, and export state without fetching every governance surface under Daily.
 */
export function OwnerSectionSwitch(props: OwnerSectionRenderers) {
	const { locale } = useI18n();
	const prerequisite = useOwnerDailyAnalytics();
	const [navigation, setNavigation] = useState<OwnerSectionNavigation>({
		selected: "daily",
		transition: null,
	});
	const [visited, setVisited] = useState<ReadonlySet<OwnerSection>>(
		() => new Set(["daily"]),
	);
	const tabRefs = useRef<Partial<Record<OwnerSection, HTMLButtonElement>>>({});
	const panelRefs = useRef<Partial<Record<OwnerSection, HTMLDivElement>>>({});
	const containerRef = useRef<HTMLDivElement>(null);
	const tablistRef = useRef<HTMLDivElement>(null);
	const selectedRef = useRef<OwnerSection>("daily");
	const visitedRef = useRef<ReadonlySet<OwnerSection>>(new Set(["daily"]));
	const scrollBySectionRef = useRef<Partial<Record<OwnerSection, number>>>({});
	const nextTransitionIdRef = useRef(0);
	const activeTransitionRef = useRef<OwnerSectionTransition | null>(null);
	const cancelRestorationRef = useRef<(() => void) | null>(null);
	const selected = navigation.selected;
	const copy = labels[locale];

	const revealTab = useCallback((section: OwnerSection) => {
		const tablist = tablistRef.current;
		const tab = tabRefs.current[section];
		if (!tablist || !tab) return;
		const rowBox = tablist.getBoundingClientRect();
		const tabBox = tab.getBoundingClientRect();
		const correction =
			tabBox.left < rowBox.left
				? tabBox.left - rowBox.left
				: tabBox.right > rowBox.right
					? tabBox.right - rowBox.right
					: 0;
		const scale =
			tablist.offsetWidth > 0 ? rowBox.width / tablist.offsetWidth : 1;
		if (correction !== 0) tablist.scrollBy({ left: correction / scale });
	}, []);
	const revealSelectedTab = useCallback(
		() => revealTab(selected),
		[revealTab, selected],
	);

	useLayoutEffect(() => {
		const container = containerRef.current;
		const tablist = tablistRef.current;
		if (!container || !tablist) return;
		if (tablist.getAttribute("aria-label") !== copy.group) return;

		const panel = container.querySelector<HTMLElement>(`#${panelId(selected)}`);
		const updatePosition = () => {
			revealSelectedTab();
			const anchor = panel?.querySelector<HTMLElement>(
				"[data-owner-navigation-anchor]",
			);
			if (!anchor) {
				container.style.removeProperty(
					"--owner-section-navigation-block-start",
				);
				return;
			}
			const containerBox = container.getBoundingClientRect();
			const anchorBox = anchor.getBoundingClientRect();
			// DOM rectangles include CSS zoom; positioning values use unzoomed layout pixels.
			const scale =
				container.offsetWidth > 0
					? containerBox.width / container.offsetWidth
					: 1;
			const gap = Number.parseFloat(
				getComputedStyle(container).getPropertyValue(
					"--owner-section-navigation-gap",
				),
			);
			container.style.setProperty(
				"--owner-section-navigation-block-start",
				`${(anchorBox.bottom - containerBox.top) / scale + (Number.isFinite(gap) ? gap : 18)}px`,
			);
		};

		updatePosition();
		const observer =
			typeof ResizeObserver === "undefined"
				? null
				: new ResizeObserver(updatePosition);
		observer?.observe(panel ?? container);
		observer?.observe(tablist);
		const mutationObserver =
			typeof MutationObserver === "undefined"
				? null
				: new MutationObserver(updatePosition);
		if (panel) {
			mutationObserver?.observe(panel, { childList: true, subtree: true });
		}
		return () => {
			observer?.disconnect();
			mutationObserver?.disconnect();
		};
	}, [selected, copy.group, revealSelectedTab]);

	useLayoutEffect(() => {
		if (tablistRef.current?.getAttribute("aria-label") !== copy.group) return;
		revealSelectedTab();
	}, [copy.group, revealSelectedTab]);

	useLayoutEffect(() => {
		const pendingTransition = navigation.transition;
		const pendingContainer = containerRef.current;
		const pendingPanel = panelRefs.current[selected];
		if (!pendingTransition || !pendingContainer || !pendingPanel) return;
		if (activeTransitionRef.current?.id !== pendingTransition.id) return;
		const transition: OwnerSectionTransition = pendingTransition;
		const container: HTMLDivElement = pendingContainer;
		const panel: HTMLDivElement = pendingPanel;

		let frame = 0;
		let timeout = 0;
		let observer: ResizeObserver | null = null;
		let programmaticTarget: number | null = null;
		let finished = false;
		const documentHeight = () =>
			Math.max(
				document.documentElement.scrollHeight,
				document.body?.scrollHeight ?? 0,
			);
		const maximumScroll = () =>
			Math.max(0, documentHeight() - window.innerHeight);
		const isCurrent = () =>
			activeTransitionRef.current?.id === transition.id &&
			!transition.cancelled;

		function removeListeners() {
			window.removeEventListener("wheel", cancelForIntent);
			window.removeEventListener("touchstart", cancelForIntent);
			window.removeEventListener("pointerdown", cancelForIntent);
			window.removeEventListener("scroll", cancelForScroll);
		}

		function stopAsyncWork() {
			if (frame !== 0) window.cancelAnimationFrame(frame);
			if (timeout !== 0) window.clearTimeout(timeout);
			observer?.disconnect();
			removeListeners();
		}

		function writeScroll(top: number) {
			programmaticTarget = top;
			window.scrollTo({ left: window.scrollX, top, behavior: "auto" });
		}

		function naturalMaximumScroll() {
			const containerHeight = Math.max(
				container.offsetHeight,
				container.getBoundingClientRect().height,
			);
			const panelHeight = Math.max(
				panel.offsetHeight,
				panel.scrollHeight,
				panel.getBoundingClientRect().height,
			);
			return Math.max(
				0,
				documentHeight() -
					Math.max(0, containerHeight - panelHeight) -
					window.innerHeight,
			);
		}

		function finish(cancelled = false) {
			if (finished) return;
			finished = true;
			stopAsyncWork();
			panel.dataset.ownerSectionState = "active";
			if (activeTransitionRef.current?.id !== transition.id) return;
			activeTransitionRef.current = null;
			cancelRestorationRef.current = null;
			container.style.removeProperty("min-block-size");
			if (!cancelled) {
				writeScroll(Math.min(transition.desiredScroll, maximumScroll()));
			}
		}

		function cancelForIntent() {
			if (!isCurrent()) return;
			transition.cancelled = true;
			finish(true);
		}

		function cancelForScroll() {
			if (!isCurrent()) return;
			if (
				programmaticTarget !== null &&
				Math.abs(window.scrollY - programmaticTarget) <= 1
			) {
				programmaticTarget = null;
				return;
			}
			cancelForIntent();
		}

		function settleIfReady() {
			if (!isCurrent()) return;
			const target = Math.min(transition.desiredScroll, maximumScroll());
			if (Math.abs(window.scrollY - target) > 1) writeScroll(target);
			if (
				transition.firstVisit ||
				naturalMaximumScroll() >= transition.desiredScroll
			) {
				finish();
			}
		}

		const missingHeight = Math.max(
			0,
			transition.capturedDocumentHeight - documentHeight(),
		);
		container.style.minBlockSize = `${Math.max(
			transition.capturedContainerHeight,
			transition.capturedContainerHeight + missingHeight,
		)}px`;

		window.addEventListener("wheel", cancelForIntent, { passive: true });
		window.addEventListener("touchstart", cancelForIntent, { passive: true });
		window.addEventListener("pointerdown", cancelForIntent, { passive: true });
		window.addEventListener("scroll", cancelForScroll, { passive: true });
		writeScroll(Math.min(transition.desiredScroll, maximumScroll()));

		const reducedMotion = window.matchMedia?.(
			"(prefers-reduced-motion: reduce)",
		).matches;
		if (reducedMotion) {
			panel.dataset.ownerSectionState = "active";
		} else {
			frame = window.requestAnimationFrame(() => {
				frame = 0;
				if (isCurrent()) panel.dataset.ownerSectionState = "active";
			});
		}

		observer =
			typeof ResizeObserver === "undefined"
				? null
				: new ResizeObserver(settleIfReady);
		observer?.observe(panel);
		timeout = window.setTimeout(() => finish(), SETTLEMENT_WINDOW_MS);
		settleIfReady();
		cancelRestorationRef.current = cancelForIntent;

		return () => {
			stopAsyncWork();
			if (activeTransitionRef.current?.id === transition.id) {
				activeTransitionRef.current = null;
				cancelRestorationRef.current = null;
				container.style.removeProperty("min-block-size");
			}
		};
	}, [navigation.transition, selected]);

	function select(section: OwnerSection, focus = false) {
		const source = selectedRef.current;
		if (section === source) {
			if (focus) {
				tabRefs.current[section]?.focus({ preventScroll: true });
				revealTab(section);
			}
			return;
		}
		const container = containerRef.current;
		const outgoingScroll = window.scrollY;
		scrollBySectionRef.current[source] = outgoingScroll;
		const capturedDocumentHeight = Math.max(
			document.documentElement.scrollHeight,
			document.body?.scrollHeight ?? 0,
		);
		const capturedContainerHeight = container
			? Math.max(
					container.offsetHeight,
					container.getBoundingClientRect().height,
				)
			: 0;
		const firstVisit = !visitedRef.current.has(section);
		const sectionTop = container
			? Math.max(0, outgoingScroll + container.getBoundingClientRect().top)
			: 0;
		const desiredScroll = firstVisit
			? sectionTop
			: (scrollBySectionRef.current[section] ?? sectionTop);
		cancelRestorationRef.current?.();
		if (container) {
			container.style.minBlockSize = `${capturedContainerHeight}px`;
		}
		nextTransitionIdRef.current += 1;
		const transition: OwnerSectionTransition = {
			id: nextTransitionIdRef.current,
			source,
			destination: section,
			desiredScroll,
			capturedDocumentHeight,
			capturedContainerHeight,
			firstVisit,
			cancelled: false,
		};
		activeTransitionRef.current = transition;
		selectedRef.current = section;
		const nextVisited = firstVisit
			? new Set([...visitedRef.current, section])
			: visitedRef.current;
		visitedRef.current = nextVisited;
		setVisited(nextVisited);
		setNavigation({ selected: section, transition });
		if (focus) tabRefs.current[section]?.focus({ preventScroll: true });
	}

	function handleKeyDown(
		event: KeyboardEvent<HTMLButtonElement>,
		section: OwnerSection,
	) {
		let next: OwnerSection | null = null;
		if (event.key === "Home") next = sectionOrder[0] ?? null;
		else if (event.key === "End") next = sectionOrder.at(-1) ?? null;
		else if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
			const forward =
				(event.key === "ArrowRight" && locale === "en") ||
				(event.key === "ArrowLeft" && locale === "ar");
			const current = sectionOrder.indexOf(section);
			const offset = forward ? 1 : -1;
			next =
				sectionOrder[
					(current + offset + sectionOrder.length) % sectionOrder.length
				] ?? null;
		} else if (event.key === "Enter" || event.key === " ") next = section;
		if (!next) return;
		event.preventDefault();
		select(next, true);
	}

	return (
		<div
			ref={containerRef}
			className="owner-analytics-mode owner-section-switch"
		>
			<div
				ref={tablistRef}
				className="owner-analytics-mode__tabs"
				role="tablist"
				aria-label={copy.group}
			>
				{sectionOrder.map((section) => (
					<button
						key={section}
						ref={(node) => {
							if (node) tabRefs.current[section] = node;
						}}
						id={tabId(section)}
						data-owner-section={section}
						type="button"
						role="tab"
						aria-controls={panelId(section)}
						aria-selected={selected === section}
						tabIndex={selected === section ? 0 : -1}
						onClick={() => select(section)}
						onKeyDown={(event) => handleKeyDown(event, section)}
					>
						{copy[section]}
					</button>
				))}
			</div>

			{sectionOrder.map((section) => (
				<div
					key={section}
					ref={(node) => {
						if (node) panelRefs.current[section] = node;
					}}
					id={panelId(section)}
					className={`owner-analytics-mode__panel owner-section-switch__panel owner-section-switch__panel--${section}`}
					role="tabpanel"
					aria-labelledby={tabId(section)}
					hidden={selected !== section}
					aria-hidden={selected !== section ? true : undefined}
					inert={selected !== section}
					data-owner-section-state={
						selected === section &&
						navigation.transition &&
						activeTransitionRef.current?.id === navigation.transition.id
							? "entering"
							: selected === section
								? "active"
								: "inactive"
					}
				>
					{visited.has(section)
						? section === "history"
							? props.history(prerequisite)
							: props[section]
						: null}
				</div>
			))}
		</div>
	);
}
