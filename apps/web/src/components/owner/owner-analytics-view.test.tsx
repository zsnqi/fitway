// @vitest-environment happy-dom

import type { DailyAnalytics } from "@fitway/api/analytics/daily-analytics";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/i18n/provider";

import {
	OwnerAnalyticsError,
	OwnerAnalyticsLoading,
	OwnerAnalyticsView,
} from "./owner-analytics-view";

const mixedDaily: DailyAnalytics = {
	businessDay: "2026-07-21",
	timeline: [
		{
			state: "closed",
			minuteStartUtc: "2026-07-21T06:59:00.000Z",
			count: null,
			settingsVersion: 1,
		},
		{
			state: "value",
			minuteStartUtc: "2026-07-21T07:00:00.000Z",
			count: 0,
			entries: 2,
			exits: 0,
			band: "quiet",
			capacitySnapshot: 100,
			settingsVersion: 1,
			source: "live",
		},
		{
			state: "missing",
			minuteStartUtc: "2026-07-21T07:01:00.000Z",
			count: null,
			settingsVersion: 2,
		},
		{
			state: "value",
			minuteStartUtc: "2026-07-21T07:02:00.000Z",
			count: 12,
			entries: 1,
			exits: 0,
			band: "moderate",
			capacitySnapshot: 80,
			settingsVersion: 2,
			source: "backfill",
		},
	],
	peak: {
		minuteStartUtc: "2026-07-21T07:02:00.000Z",
		count: 12,
		band: "moderate",
		capacitySnapshot: 80,
		settingsVersion: 2,
	},
	dailyAverage: 6,
	estimatedEntranceCrossings: 3,
	observedOpenMinutes: 2,
	expectedOpenMinutes: 3,
	coverage: 2 / 3,
};

let root: Root | undefined;
let container: HTMLDivElement;

async function render(node: React.ReactNode, locale: "ar" | "en" = "en") {
	document.documentElement.lang = locale;
	document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
	await act(async () => {
		root?.render(<I18nProvider>{node}</I18nProvider>);
	});
}

beforeEach(() => {
	Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});

afterEach(async () => {
	if (root) await act(async () => root?.unmount());
	container.remove();
	document.documentElement.lang = "";
	document.documentElement.dir = "";
});

describe("owner daily analytics states", () => {
	it("keeps chart and table parity for closed, missing, zero, and historical zones", async () => {
		await render(
			<OwnerAnalyticsView
				daily={mixedDaily}
				currentTimeZone="Europe/London"
				timeZoneByVersion={
					new Map([
						[1, "Asia/Riyadh"],
						[2, "America/New_York"],
					])
				}
			/>,
		);

		expect(container.textContent).toContain("Occupancy by minute");
		expect(container.textContent).toContain("Estimated entrance crossings");
		expect(container.textContent).toContain("not unique members");
		expect(container.textContent).toContain("Scheduled closed");
		expect(container.textContent).toContain("Missing observation");
		expect(container.textContent).toContain("Genuine zero");
		expect(container.textContent).toContain("2 / 3");
		expect(container.textContent).toContain("10:00 AM");
		expect(container.textContent).toContain("3:01 AM");
		expect(container.querySelectorAll(".owner-chart__point")).toHaveLength(2);

		const chart = container.querySelector<HTMLElement>("[data-owner-chart]");
		expect(chart?.tabIndex).toBe(0);
		chart?.focus();
		await act(async () =>
			chart?.dispatchEvent(
				new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
			),
		);
		expect(
			container.querySelector("[data-active-reading]")?.textContent,
		).toContain("12");
	});

	it("renders honest no-observation and scheduled-closed days separately", async () => {
		await render(
			<OwnerAnalyticsView
				daily={{
					...mixedDaily,
					timeline: mixedDaily.timeline.filter(
						(bucket) => bucket.state === "missing",
					),
					peak: null,
					dailyAverage: null,
					observedOpenMinutes: 0,
					expectedOpenMinutes: 1,
					coverage: 0,
				}}
				currentTimeZone="Europe/London"
				timeZoneByVersion={new Map([[2, "America/New_York"]])}
			/>,
		);
		expect(container.textContent).toContain("No observed occupancy data");

		await render(
			<OwnerAnalyticsView
				daily={{
					...mixedDaily,
					timeline: mixedDaily.timeline.filter(
						(bucket) => bucket.state === "closed",
					),
					peak: null,
					dailyAverage: null,
					observedOpenMinutes: 0,
					expectedOpenMinutes: 0,
					coverage: null,
				}}
				currentTimeZone="Europe/London"
				timeZoneByVersion={new Map([[1, "Asia/Riyadh"]])}
			/>,
		);
		expect(container.textContent).toContain("Scheduled closed day");
	});

	it("provides distinct accessible loading and retryable error states", async () => {
		const retry = vi.fn();
		await render(<OwnerAnalyticsLoading />);
		expect(container.querySelector('[role="status"]')?.textContent).toContain(
			"Loading",
		);
		await render(<OwnerAnalyticsError onRetry={retry} />);
		const button = container.querySelector("button");
		expect(container.querySelector('[role="alert"]')).not.toBeNull();
		button?.click();
		expect(retry).toHaveBeenCalledOnce();
	});
});
