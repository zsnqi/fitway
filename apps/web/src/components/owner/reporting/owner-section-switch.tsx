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
	const [selected, setSelected] = useState<OwnerSection>("daily");
	const [visited, setVisited] = useState<ReadonlySet<OwnerSection>>(
		() => new Set(["daily"]),
	);
	const tabRefs = useRef<Partial<Record<OwnerSection, HTMLButtonElement>>>({});
	const containerRef = useRef<HTMLDivElement>(null);
	const tablistRef = useRef<HTMLDivElement>(null);
	const copy = labels[locale];
	const prerequisiteUnavailable =
		!prerequisite.data && (prerequisite.isPending || prerequisite.isError);

	const revealSelectedTab = useCallback(() => {
		const tablist = tablistRef.current;
		const tab = tabRefs.current[selected];
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
	}, [selected]);

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

	function select(section: OwnerSection, focus = false) {
		setVisited((current) =>
			current.has(section) ? current : new Set([...current, section]),
		);
		setSelected(section);
		if (focus) tabRefs.current[section]?.focus();
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
					id={panelId(section)}
					className={`owner-analytics-mode__panel owner-section-switch__panel owner-section-switch__panel--${section}`}
					role="tabpanel"
					aria-labelledby={tabId(section)}
					hidden={selected !== section}
				>
					{visited.has(section)
						? section !== "daily" &&
							section !== "history" &&
							prerequisiteUnavailable
							? props.daily
							: section === "history"
								? props.history(prerequisite)
								: props[section]
						: null}
				</div>
			))}
		</div>
	);
}
