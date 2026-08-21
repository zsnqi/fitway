// @vitest-environment happy-dom

import { WEEKDAYS } from "@fitway/api/occupancy/schedule";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { csv, daily, heatmap, timeContext, weekOverWeek } = vi.hoisted(() => ({
	csv: vi.fn(),
	daily: vi.fn(),
	heatmap: vi.fn(),
	timeContext: vi.fn(),
	weekOverWeek: vi.fn(),
}));

vi.mock("@/utils/orpc", () => ({
	client: {
		admin: { analytics: { csv, daily, heatmap, timeContext, weekOverWeek } },
	},
}));

import { useOwnerDailyAnalytics } from "@/hooks/use-owner-daily-analytics";
import { I18nProvider } from "@/i18n/provider";

import { OwnerAnalyticsModeSwitch } from "./owner-analytics-mode-switch";
import { OwnerReportingSection } from "./owner-reporting-section";

const dailyPayload = {
	businessDay: "2026-08-15",
	timeline: [
		{
			state: "value",
			minuteStartUtc: "2026-08-15T07:00:00.000Z",
			count: 12,
			entries: 12,
			exits: 0,
			band: "quiet",
			capacitySnapshot: 100,
			settingsVersion: 11,
			source: "live",
		},
	],
	peak: {
		minuteStartUtc: "2026-08-15T07:00:00.000Z",
		count: 12,
		band: "quiet",
		capacitySnapshot: 100,
		settingsVersion: 11,
	},
	dailyAverage: 12,
	estimatedEntranceCrossings: 12,
	observedOpenMinutes: 1,
	expectedOpenMinutes: 1,
	coverage: 1,
};

const timeContextPayload = {
	current: { settingsVersion: 11, timeZone: "Asia/Riyadh" },
	versions: [{ settingsVersion: 11, timeZone: "Asia/Riyadh" }],
};

function heatmapPayload() {
	return {
		startBusinessDay: "2026-07-19",
		endBusinessDay: "2026-08-15",
		cells: WEEKDAYS.flatMap((weekday) =>
			Array.from({ length: 24 }, (_unused, localHour) => ({
				weekday,
				localHour,
				state: localHour === 9 ? ("value" as const) : ("closed" as const),
				averageOccupancy: localHour === 9 ? 18.5 : null,
				observedOpenMinutes: localHour === 9 ? 60 : 0,
				expectedOpenMinutes: localHour === 9 ? 60 : 0,
				sampleDayCount: localHour === 9 ? 4 : 0,
			})),
		),
	};
}

const comparisonPayload = {
	state: "comparable" as const,
	minimumCoverage: 0.8,
	currentWeek: {
		startBusinessDay: "2026-08-09",
		endBusinessDay: "2026-08-15",
		averageOccupancy: 34.6,
		estimatedEntranceCrossings: 3497,
		observedOpenMinutes: 3884,
		expectedOpenMinutes: 4200,
		coverage: 3884 / 4200,
	},
	priorWeek: {
		startBusinessDay: "2026-08-02",
		endBusinessDay: "2026-08-08",
		averageOccupancy: 31.8,
		estimatedEntranceCrossings: 3284,
		observedOpenMinutes: 3612,
		expectedOpenMinutes: 4200,
		coverage: 3612 / 4200,
	},
	changes: {
		averageOccupancy: { absolute: 2.8, percent: 0.088 },
		estimatedEntranceCrossings: { absolute: 213, percent: 0.065 },
	},
};

let root: Root | undefined;
let container: HTMLDivElement;

async function settle() {
	for (let pass = 0; pass < 6; pass += 1) {
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});
	}
}

function DailyObserverProbe() {
	const query = useOwnerDailyAnalytics();
	if (query.isPending) return <p data-daily-state="pending">daily pending</p>;
	if (query.isError) {
		return (
			<button type="button" onClick={() => void query.refetch()}>
				daily retry
			</button>
		);
	}
	return <button type="button">daily content</button>;
}

async function mount(locale: "en" | "ar" = "en") {
	window.localStorage.setItem("fitway.locale", locale);
	document.documentElement.lang = locale;
	document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	await act(async () => {
		root?.render(
			<I18nProvider>
				<QueryClientProvider client={queryClient}>
					<OwnerAnalyticsModeSwitch
						daily={<DailyObserverProbe />}
						history={(prerequisite) => (
							<OwnerReportingSection prerequisite={prerequisite} />
						)}
					/>
				</QueryClientProvider>
			</I18nProvider>,
		);
	});
}

async function click(element: Element | null) {
	if (!(element instanceof HTMLElement))
		throw new Error("Missing click target");
	await act(async () => element.click());
}

async function keydown(element: Element | null, key: string) {
	if (!(element instanceof HTMLElement)) throw new Error("Missing key target");
	await act(async () => {
		element.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
	});
}

async function fill(input: HTMLInputElement | null, value: string) {
	if (!input) throw new Error("Missing input");
	await act(async () => {
		const setter = Object.getOwnPropertyDescriptor(
			HTMLInputElement.prototype,
			"value",
		)?.set;
		setter?.call(input, value);
		input.dispatchEvent(new Event("input", { bubbles: true }));
	});
}

function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((resolvePromise, rejectPromise) => {
		resolve = resolvePromise;
		reject = rejectPromise;
	});
	return { promise, resolve, reject };
}

beforeEach(() => {
	Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
	vi.clearAllMocks();
	daily.mockResolvedValue(dailyPayload);
	timeContext.mockResolvedValue(timeContextPayload);
	heatmap.mockResolvedValue(heatmapPayload());
	weekOverWeek.mockResolvedValue(comparisonPayload);
	csv.mockResolvedValue(
		(async function* stream() {
			yield "﻿business_day,count\r\n2026-08-15,12\r\n";
		})(),
	);
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});

afterEach(async () => {
	await act(async () => root?.unmount());
	container.remove();
	root = undefined;
	window.localStorage.clear();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe.each([
	{
		locale: "en" as const,
		group: "Analytics view",
		daily: "Daily",
		history: "History",
	},
	{
		locale: "ar" as const,
		group: "عرض التحليلات",
		daily: "اليومي",
		history: "السجل",
	},
])("OwnerAnalyticsModeSwitch ($locale)", ({
	locale,
	group,
	daily: dailyLabel,
	history: historyLabel,
}) => {
	it("keeps both IDREF-complete panel shells while History stays lazy", async () => {
		await mount(locale);

		const tablist = container.querySelector('[role="tablist"]');
		const tabs = [
			...container.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
		];
		expect(tablist?.getAttribute("aria-label")).toBe(group);
		expect(tabs.map((tab) => tab.textContent)).toEqual([
			dailyLabel,
			historyLabel,
		]);
		expect(tabs.map((tab) => tab.tabIndex)).toEqual([0, -1]);
		expect(tabs.map((tab) => tab.getAttribute("aria-selected"))).toEqual([
			"true",
			"false",
		]);

		for (const tab of tabs) {
			const panelId = tab.getAttribute("aria-controls");
			const panel = panelId ? document.getElementById(panelId) : null;
			expect(panel?.getAttribute("role")).toBe("tabpanel");
			expect(panel?.getAttribute("aria-labelledby")).toBe(tab.id);
		}
		const historyPanel = document.getElementById(
			tabs[1]?.getAttribute("aria-controls") ?? "missing",
		);
		expect(historyPanel?.hidden).toBe(true);
		expect(historyPanel?.childElementCount).toBe(0);
		expect(container.querySelector(".owner-reporting")).toBeNull();
		expect(heatmap).not.toHaveBeenCalled();
		expect(weekOverWeek).not.toHaveBeenCalled();
		expect(csv).not.toHaveBeenCalled();

		await settle();
		expect(daily).toHaveBeenCalledTimes(1);
		expect(timeContext).toHaveBeenCalledTimes(1);
		await click(tabs[1] ?? null);
		await settle();
		expect(historyPanel?.hidden).toBe(false);
		expect(container.querySelector(".owner-reporting")).not.toBeNull();
		expect(daily).toHaveBeenCalledTimes(1);
		expect(timeContext).toHaveBeenCalledTimes(1);
		expect(heatmap).toHaveBeenCalledTimes(1);
		expect(weekOverWeek).toHaveBeenCalledTimes(1);
		expect(csv).not.toHaveBeenCalled();

		await click(tabs[0] ?? null);
		await click(tabs[1] ?? null);
		await settle();
		expect(daily).toHaveBeenCalledTimes(1);
		expect(timeContext).toHaveBeenCalledTimes(1);
		expect(heatmap).toHaveBeenCalledTimes(1);
		expect(weekOverWeek).toHaveBeenCalledTimes(1);
	});

	it("selects and focuses with the complete roving keyboard model", async () => {
		await mount(locale);
		await settle();
		const tabs = [
			...container.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
		];
		const dailyTab = tabs[0];
		const historyTab = tabs[1];
		if (!dailyTab || !historyTab) throw new Error("Missing tabs");

		dailyTab.focus();
		await keydown(dailyTab, locale === "ar" ? "ArrowLeft" : "ArrowRight");
		expect(historyTab.getAttribute("aria-selected")).toBe("true");
		expect(historyTab.tabIndex).toBe(0);
		expect(document.activeElement).toBe(historyTab);

		await keydown(historyTab, locale === "ar" ? "ArrowLeft" : "ArrowRight");
		expect(dailyTab.getAttribute("aria-selected")).toBe("true");
		expect(document.activeElement).toBe(dailyTab);

		await keydown(dailyTab, "End");
		expect(document.activeElement).toBe(historyTab);
		await keydown(historyTab, "Home");
		expect(document.activeElement).toBe(dailyTab);
		await keydown(historyTab, "Enter");
		expect(historyTab.getAttribute("aria-selected")).toBe("true");
		await keydown(dailyTab, " ");
		expect(dailyTab.getAttribute("aria-selected")).toBe("true");
	});
});

describe("Owner reporting prerequisite ownership", () => {
	it("shows a History-owned pending state without starting leaf work", async () => {
		const pendingDaily = deferred<typeof dailyPayload>();
		daily.mockReturnValue(pendingDaily.promise);
		await mount();
		const historyTab = container.querySelectorAll('[role="tab"]')[1];
		await click(historyTab ?? null);

		expect(
			container.querySelector('[data-owner-reporting-state="loading"]'),
		).not.toBeNull();
		expect(heatmap).not.toHaveBeenCalled();
		expect(weekOverWeek).not.toHaveBeenCalled();
		expect(csv).not.toHaveBeenCalled();

		pendingDaily.resolve(dailyPayload);
		await settle();
		expect(daily).toHaveBeenCalledTimes(1);
		expect(timeContext).toHaveBeenCalledTimes(1);
		expect(container.querySelector(".owner-reporting__heading")).not.toBeNull();
	});

	it("does not retry implicitly and one visible retry starts exactly one new chain", async () => {
		timeContext.mockRejectedValueOnce(new Error("offline"));
		await mount();
		await settle();
		const historyTab = container.querySelectorAll('[role="tab"]')[1];
		await click(historyTab ?? null);
		await settle();

		const error = container.querySelector(
			'[data-owner-reporting-state="error"]',
		);
		expect(error).not.toBeNull();
		expect(daily).toHaveBeenCalledTimes(1);
		expect(timeContext).toHaveBeenCalledTimes(1);
		expect(heatmap).not.toHaveBeenCalled();
		expect(weekOverWeek).not.toHaveBeenCalled();

		timeContext.mockResolvedValue(timeContextPayload);
		await click(error?.querySelector("button") ?? null);
		await settle();
		expect(daily).toHaveBeenCalledTimes(2);
		expect(timeContext).toHaveBeenCalledTimes(2);
		expect(heatmap).toHaveBeenCalledTimes(1);
		expect(weekOverWeek).toHaveBeenCalledTimes(1);
	});

	it("preserves range, heatmap, in-flight export, and prepared URL state across round trips", async () => {
		const releaseStream = deferred<void>();
		csv.mockResolvedValue(
			(async function* stream() {
				yield "﻿business_day,count\r\n";
				await releaseStream.promise;
				yield "2026-08-15,12\r\n";
			})(),
		);
		let created = 0;
		vi.stubGlobal("URL", {
			...URL,
			createObjectURL: vi.fn(() => {
				created += 1;
				return `blob:fitway/${created}`;
			}),
			revokeObjectURL: vi.fn(),
		});
		const abort = vi.spyOn(AbortController.prototype, "abort");

		await mount();
		await settle();
		const tabs = [
			...container.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
		];
		await click(tabs[1] ?? null);
		await settle();

		const reportingRange = container.querySelector<HTMLElement>(
			"[data-owner-reporting-range]",
		);
		const reportingStart =
			reportingRange?.querySelector<HTMLInputElement>('input[type="date"]');
		const exportBlock = container.querySelector<HTMLElement>(
			"[data-owner-reporting-export]",
		);
		const exportStart =
			exportBlock?.querySelector<HTMLInputElement>('input[type="date"]');
		await fill(reportingStart ?? null, "2026-07-20");
		await fill(exportStart ?? null, "2026-08-10");

		const selectedCell = container.querySelectorAll<HTMLButtonElement>(
			".owner-reporting-cell",
		)[25];
		await click(selectedCell ?? null);
		const selectedLabel = selectedCell?.getAttribute("aria-label");
		await click(
			exportBlock?.querySelector("[data-owner-reporting-export-start]") ?? null,
		);
		await settle();
		expect(
			exportBlock?.querySelector("[data-owner-reporting-export-abort]"),
		).not.toBeNull();

		await click(tabs[0] ?? null);
		await click(tabs[1] ?? null);
		expect(abort).not.toHaveBeenCalled();
		expect(URL.revokeObjectURL).not.toHaveBeenCalled();
		expect(reportingStart?.value).toBe("2026-07-20");
		expect(exportStart?.value).toBe("2026-08-10");
		expect(
			container
				.querySelector(".owner-reporting-cell[data-active]")
				?.getAttribute("aria-label"),
		).toBe(selectedLabel);

		releaseStream.resolve();
		await settle();
		const download = container.querySelector<HTMLAnchorElement>(
			"[data-owner-reporting-download]",
		);
		expect(download?.getAttribute("href")).toBe("blob:fitway/1");
		await click(tabs[0] ?? null);
		await click(tabs[1] ?? null);
		expect(abort).not.toHaveBeenCalled();
		expect(URL.revokeObjectURL).not.toHaveBeenCalled();
		expect(
			container
				.querySelector<HTMLAnchorElement>("[data-owner-reporting-download]")
				?.getAttribute("href"),
		).toBe("blob:fitway/1");
		expect(daily).toHaveBeenCalledTimes(1);
		expect(timeContext).toHaveBeenCalledTimes(1);
		expect(heatmap).toHaveBeenCalledTimes(1);
		expect(weekOverWeek).toHaveBeenCalledTimes(1);
	});
});
