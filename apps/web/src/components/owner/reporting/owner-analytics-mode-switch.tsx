import { type KeyboardEvent, type ReactNode, useRef, useState } from "react";

import { useOwnerDailyAnalytics } from "@/hooks/use-owner-daily-analytics";
import { useI18n } from "@/i18n/provider";

import "./owner-reporting.css";

export type OwnerDailyAnalyticsPrerequisite = ReturnType<
	typeof useOwnerDailyAnalytics
>;

type AnalyticsMode = "daily" | "history";
const modeOrder: readonly AnalyticsMode[] = ["daily", "history"];

const ids = {
	dailyPanel: "owner-analytics-daily-panel",
	dailyTab: "owner-analytics-daily-tab",
	historyPanel: "owner-analytics-history-panel",
	historyTab: "owner-analytics-history-tab",
} as const;

const labels = {
	en: { group: "Analytics view", daily: "Daily", history: "History" },
	ar: { group: "عرض التحليلات", daily: "اليومي", history: "السجل" },
} as const;

/**
 * The route-local Daily/History seam from the approved Owner reporting composition.
 *
 * Both panel shells exist immediately so every tab IDREF is valid from first paint.
 * Only the History subtree is lazy: once visited it stays mounted, allowing its forms,
 * heatmap selection, export controller, and prepared object URL to survive mode changes.
 *
 * This wrapper also owns the prerequisite observer from the route's first render. The
 * Daily panel observes the same React Query key, so the requests deduplicate without a
 * late observer being added when History is opened.
 */
export function OwnerAnalyticsModeSwitch({
	daily,
	history,
}: {
	daily: ReactNode;
	history: (prerequisite: OwnerDailyAnalyticsPrerequisite) => ReactNode;
}) {
	const { locale } = useI18n();
	const prerequisite = useOwnerDailyAnalytics();
	const [selected, setSelected] = useState<AnalyticsMode>("daily");
	const [historyVisited, setHistoryVisited] = useState(false);
	const dailyTab = useRef<HTMLButtonElement>(null);
	const historyTab = useRef<HTMLButtonElement>(null);
	const copy = labels[locale];

	function select(mode: AnalyticsMode, focus = false) {
		if (mode === "history") setHistoryVisited(true);
		setSelected(mode);
		if (focus) {
			(mode === "daily" ? dailyTab : historyTab).current?.focus();
		}
	}

	function handleKeyDown(
		event: KeyboardEvent<HTMLButtonElement>,
		mode: AnalyticsMode,
	) {
		let next: AnalyticsMode | null = null;
		if (event.key === "Home") next = "daily";
		else if (event.key === "End") next = "history";
		else if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
			const forward =
				(event.key === "ArrowRight" && locale === "en") ||
				(event.key === "ArrowLeft" && locale === "ar");
			const current = modeOrder.indexOf(mode);
			const offset = forward ? 1 : -1;
			next =
				modeOrder[(current + offset + modeOrder.length) % modeOrder.length];
		} else if (event.key === "Enter" || event.key === " ") {
			next = mode;
		}
		if (!next) return;
		event.preventDefault();
		select(next, true);
	}

	return (
		<div className="owner-analytics-mode">
			<div
				className="owner-analytics-mode__tabs"
				role="tablist"
				aria-label={copy.group}
			>
				<button
					ref={dailyTab}
					id={ids.dailyTab}
					type="button"
					role="tab"
					aria-controls={ids.dailyPanel}
					aria-selected={selected === "daily"}
					tabIndex={selected === "daily" ? 0 : -1}
					onClick={() => select("daily")}
					onKeyDown={(event) => handleKeyDown(event, "daily")}
				>
					{copy.daily}
				</button>
				<button
					ref={historyTab}
					id={ids.historyTab}
					type="button"
					role="tab"
					aria-controls={ids.historyPanel}
					aria-selected={selected === "history"}
					tabIndex={selected === "history" ? 0 : -1}
					onClick={() => select("history")}
					onKeyDown={(event) => handleKeyDown(event, "history")}
				>
					{copy.history}
				</button>
			</div>

			<div
				id={ids.dailyPanel}
				className="owner-analytics-mode__panel"
				role="tabpanel"
				aria-labelledby={ids.dailyTab}
				hidden={selected !== "daily"}
			>
				{daily}
			</div>
			<div
				id={ids.historyPanel}
				className="owner-analytics-mode__panel"
				role="tabpanel"
				aria-labelledby={ids.historyTab}
				hidden={selected !== "history"}
			>
				{historyVisited ? history(prerequisite) : null}
			</div>
		</div>
	);
}
