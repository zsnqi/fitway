import { type KeyboardEvent, type ReactNode, useRef, useState } from "react";

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
		history: "History",
		access: "Access",
		audit: "Audit",
		health: "Uptime",
		settings: "Settings",
	},
	ar: {
		group: "أقسام الإدارة",
		daily: "اليومي",
		history: "السجل",
		access: "الوصول",
		audit: "التدقيق",
		health: "التشغيل",
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
	const copy = labels[locale];

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
		<div className="owner-analytics-mode owner-section-switch">
			<div
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
							(prerequisite.isPending || prerequisite.isError)
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
