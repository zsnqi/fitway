// @vitest-environment happy-dom

import type { DailyAnalytics } from "@fitway/api/analytics/daily-analytics";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/i18n/provider";

import {
	chartOverview,
	clampedCaptionLeft,
	intentionalTimeTicks,
	MIN_ANNOTATED_GAP_MINUTES,
	niceCountScale,
	OwnerAnalyticsError,
	OwnerAnalyticsLoading,
	OwnerAnalyticsView,
	smoothPath,
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

async function openMinuteDetails() {
	const trigger = container.querySelector<HTMLButtonElement>(
		".owner-table-disclosure > .owner-retained-disclosure__trigger",
	);
	await act(async () => {
		if (!trigger) throw new Error("Missing minute details");
		trigger.click();
	});
}

async function click(element: HTMLElement) {
	await act(async () => {
		element.click();
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
	function overviewDay(): DailyAnalytics {
		const timeline: DailyAnalytics["timeline"] = Array.from(
			{ length: 181 },
			(_, index) => {
				const base = {
					minuteStartUtc: new Date(
						Date.parse("2026-07-21T07:00:00Z") + index * 60_000,
					).toISOString(),
					settingsVersion: 1,
				};
				if (index === 23 || (index >= 100 && index < 115))
					return { ...base, state: "missing", count: null };
				if (index >= 130 && index < 135)
					return { ...base, state: "closed", count: null };
				return {
					...base,
					state: "value",
					count:
						index === 47
							? 150
							: index >= 70 && index <= 73
								? 0
								: 30 + (index % 11),
					entries: 1,
					exits: 0,
					capacitySnapshot: 200,
					band: "quiet",
					source: "live",
				};
			},
		);
		const values = timeline.filter((bucket) => bucket.state === "value");
		return {
			...mixedDaily,
			timeline,
			peak: {
				minuteStartUtc: "2026-07-21T07:47:00.000Z",
				count: 150,
				band: "busy",
				capacitySnapshot: 200,
				settingsVersion: 1,
			},
			observedOpenMinutes: values.length,
			expectedOpenMinutes: 176,
			coverage: values.length / 176,
			dailyAverage:
				values.reduce((sum, value) => sum + value.count, 0) / values.length,
			estimatedEntranceCrossings: values.length,
		};
	}

	it("makes the half-hour overview and exact peak, zero and outage boundaries inspectable", () => {
		const daily = overviewDay();
		const overview = chartOverview(daily.timeline, new Map([[1, "UTC"]]));
		expect(overview.stops.map(({ index }) => index)).toEqual(
			expect.arrayContaining([0, 30, 47, 60, 70, 73, 90, 120, 150, 180]),
		);
		expect(overview.runs.flat().length).toBeLessThan(40);
		expect(overview.runs.flat().map(({ index }) => index)).toEqual(
			expect.arrayContaining([47, 70, 73, 22, 24, 99, 115, 129, 135]),
		);
		for (const run of overview.runs) {
			for (const point of run)
				expect(point.bucket).toBe(daily.timeline[point.index]);
			const first = run[0];
			const last = run.at(-1);
			if (!first || !last) throw new Error("Expected a nonempty run");
			const start = first.index;
			const end = last.index;
			expect(
				daily.timeline
					.slice(start, end + 1)
					.every((bucket) => bucket.state === "value"),
			).toBe(true);
		}
	});

	it("retains a secondary peak between half-hour stops without restoring telemetry wiggles", () => {
		const daily = overviewDay();
		const point = daily.timeline[80];
		if (point?.state !== "value")
			throw new Error("Expected observed fixture point");
		daily.timeline[80] = { ...point, count: 90 };
		const overview = chartOverview(daily.timeline, new Map([[1, "UTC"]]));
		expect(overview.runs.flat().map(({ index }) => index)).toContain(80);
		expect(overview.stops.map(({ index }) => index)).toContain(80);
		expect(overview.runs.flat().length).toBeLessThan(40);
	});

	it("dismisses mouse hover on leave and preserves deliberate keyboard selection", async () => {
		const daily = overviewDay();
		await render(
			<OwnerAnalyticsView
				daily={daily}
				currentTimeZone="UTC"
				timeZoneByVersion={new Map([[1, "UTC"]])}
			/>,
		);
		const chart =
			container.querySelector<HTMLButtonElement>("[data-owner-chart]");
		if (!chart) throw new Error("Expected the chart control");
		vi.spyOn(chart, "getBoundingClientRect").mockReturnValue({
			x: 0,
			y: 0,
			top: 0,
			left: 0,
			right: 1200,
			bottom: 240,
			width: 1200,
			height: 240,
			toJSON: () => ({}),
		});
		const hover = async (minute: number) =>
			act(async () => {
				chart.dispatchEvent(
					new PointerEvent("pointermove", {
						bubbles: true,
						pointerType: "mouse",
						clientX: 16 + (minute / 180) * 1168,
					}),
				);
			});
		const leave = async () =>
			act(async () => {
				chart.dispatchEvent(
					new PointerEvent("pointerout", {
						bubbles: true,
						pointerType: "mouse",
						relatedTarget: document.body,
					}),
				);
			});
		await hover(31);
		expect(
			container.querySelector("[data-selected-reading]")?.textContent,
		).toContain("7:30 AM");
		await hover(36);
		expect(
			container.querySelector("[data-selected-reading]")?.textContent,
		).toContain("7:30 AM");
		await hover(23);
		expect(container.querySelector(".owner-chart__active")).toBeNull();
		expect(container.querySelector("[data-selected-reading]")).toBeNull();
		expect(container.querySelector(".owner-chart-tip")?.textContent).toBe("");
		expect(
			container
				.querySelector(".owner-chart-tip")
				?.getAttribute("data-tooltip-state"),
		).toBe("closing");
		expect(container.querySelector(".owner-chart__stem")).toBeNull();
		await hover(31);
		expect(
			container.querySelector("[data-selected-reading]")?.textContent,
		).toContain("7:30 AM");
		await act(async () => {
			container.querySelector(".owner-chart-tip")?.dispatchEvent(
				new globalThis.TransitionEvent("transitionend", {
					bubbles: true,
					propertyName: "opacity",
				}),
			);
		});
		expect(container.querySelector("[data-selected-reading]")).not.toBeNull();
		await leave();
		expect(container.querySelector("[data-selected-reading]")).toBeNull();
		expect(container.querySelector(".owner-chart-tip")?.textContent).toBe("");
		await act(async () => {
			chart.dispatchEvent(
				new KeyboardEvent("keydown", { key: "Home", bubbles: true }),
			);
		});
		await hover(60);
		await leave();
		expect(
			container.querySelector("[data-selected-reading]")?.textContent,
		).toContain("7:00 AM");
		await act(async () => {
			chart.dispatchEvent(
				new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
			);
		});
		expect(container.querySelector("[data-selected-reading]")).toBeNull();
		expect(container.querySelector(".owner-chart-tip")?.textContent).toBe("");
		expect(
			container.querySelectorAll(".owner-table-region tbody tr"),
		).toHaveLength(0);
		await openMinuteDetails();
		expect(
			container.querySelectorAll(".owner-table-region tbody tr"),
		).toHaveLength(60);
		expect(container.querySelectorAll(".owner-chart__gap-label")).toHaveLength(
			1,
		);
		expect(
			container.querySelector(".owner-chart__gap-label")?.textContent,
		).toContain("15");
	});

	it("jumps to a minute page through the page select popup", async () => {
		await render(
			<OwnerAnalyticsView
				daily={overviewDay()}
				currentTimeZone="Asia/Riyadh"
				timeZoneByVersion={new Map([[1, "UTC"]])}
			/>,
		);

		await openMinuteDetails();
		expect(
			container.querySelectorAll(".owner-table-region tbody tr"),
		).toHaveLength(60);
		const page = container.querySelector<HTMLButtonElement>(
			'button[aria-label="Minute page"]',
		);
		if (!page) throw new Error("Missing minute page control");

		await click(page);
		const fourth = [
			...document.querySelectorAll<HTMLElement>(
				".owner-table-pagination__popup[data-open] [role='option']",
			),
		].find((option) => option.textContent?.trim() === "4");
		if (!fourth) throw new Error("Missing minute page option");
		await click(fourth);

		expect(
			container.querySelectorAll(".owner-table-region tbody tr"),
		).toHaveLength(1);
		expect(page.textContent).toContain("4");
		expect(
			container.querySelector(".owner-table-pagination p")?.textContent,
		).toContain("181");
	});

	it("keeps smoothed segments inside their endpoint bounds", () => {
		const path = smoothPath([
			{ x: 0, y: 240 },
			{ x: 100, y: 240 },
			{ x: 200, y: 1 },
		]);
		const yCoordinates = [...path.matchAll(/-?[\d.]+,(-?[\d.]+)/g)].map(
			(match) => Number(match[1]),
		);

		expect(path).toMatch(/^M0,240 C[^,]+,240 [^,]+,240 100,240/);
		expect(yCoordinates.every((value) => value >= 1 && value <= 240)).toBe(
			true,
		);
	});

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

		expect(container.textContent).toContain("People present through the day");
		expect(container.textContent).toContain("Total entries");
		expect(container.textContent).not.toContain("repeat visits");
		await openMinuteDetails();
		expect(container.textContent).toContain("Scheduled closed");
		expect(container.textContent).toContain("Missing observation");
		expect(
			container.querySelector(".owner-metrics")?.textContent,
		).not.toContain("Readings coverage");
		expect(
			container.querySelector(".owner-table-disclosure")?.textContent,
		).toContain("Readings coverage");
		expect(container.querySelectorAll(".owner-metric")).toHaveLength(3);
		expect(container.textContent).toContain("10:00 AM");
		expect(container.textContent).toContain("3:01 AM");
		expect(container.querySelectorAll(".owner-chart__point")).toHaveLength(2);
		// Paper gap language: the interior missing minute renders as dashed
		// stems, never as a filled band. The leading closed edge stays in the
		// table only. A lone one-minute gap keeps its honest stems but earns
		// no dimension bracket, end ticks, or duration label — naming every
		// routine one-minute absence annotates noise, not information.
		expect(
			container.querySelectorAll(".owner-chart__closed, .owner-chart__missing"),
		).toHaveLength(0);
		expect(container.querySelectorAll(".owner-chart__gap-stem")).toHaveLength(
			0,
		);
		expect(
			container.querySelectorAll(".owner-chart__gap-bracket"),
		).toHaveLength(0);
		expect(container.querySelectorAll(".owner-chart__gap-tick")).toHaveLength(
			0,
		);
		expect(container.querySelectorAll(".owner-chart__gap-label")).toHaveLength(
			0,
		);
		expect(MIN_ANNOTATED_GAP_MINUTES).toBe(15);
		// Human decision 2026-09-05: no zero-square marker on the chart. The
		// genuine zero stays truthful through the line at the zero ordinate
		// plus the table's Observed 0 row; nothing may invent a glyph for it.
		expect(container.querySelectorAll(".owner-chart__zero")).toHaveLength(0);
		expect(container.querySelectorAll(".owner-chart-y-axis")).toHaveLength(0);
		// A completed day has no false current identity before the owner
		// deliberately inspects a reading.
		expect(container.querySelectorAll(".owner-chart__active")).toHaveLength(0);
		expect(container.querySelectorAll(".owner-chart__stem")).toHaveLength(0);
		expect(container.querySelectorAll(".owner-chart__latest")).toHaveLength(0);
		expect(container.querySelectorAll(".owner-chart-tip")).toHaveLength(0);
		// Paper terminates the line at the marker's OUTER edge: the active
		// solo reading (the 12 peak) draws no line at all — the HTML core
		// already marks it — while the idle solo dot (the genuine 0) keeps
		// its stroked point so no real reading is hidden.
		expect(container.querySelectorAll(".owner-chart__line")).toHaveLength(2);
		for (const line of container.querySelectorAll(".owner-chart__line")) {
			expect(line.getAttribute("d")).toContain("L");
		}
		expect(container.querySelectorAll(".owner-chart__solo")).toHaveLength(2);
		expect(
			container.querySelectorAll(".owner-chart__line[data-trimmed]"),
		).toHaveLength(0);
		// Intentional time ticks: distinct clock minutes spanning the short
		// domain (no duplicated time, no blank slots), each centered by the
		// stylesheet with only the minimal edge clamp inline.
		const ticks = container.querySelectorAll(".owner-chart-x-axis span");
		expect(ticks.length).toBeGreaterThan(0);
		expect(ticks.length).toBeLessThanOrEqual(5);
		const tickTimes = new Set(
			[...ticks].map((tick) => tick.textContent?.trim()),
		);
		expect(tickTimes.size).toBe(ticks.length);
		for (const tick of ticks) {
			expect((tick as HTMLElement).style.transform).toBe("");
		}
		expect(clampedCaptionLeft(0.5, 30)).toBe(
			"clamp(30px, 50%, calc(100% - 30px))",
		);

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
		// First explicit selection exposes Paper's visible readout: stem plus
		// a tooltip card with the reading time and approximate count. The
		// screen-reader live region already announced the same reading.
		expect(container.querySelectorAll(".owner-chart__stem")).toHaveLength(1);
		expect(
			container.querySelectorAll(".owner-chart__active--inspected"),
		).toHaveLength(1);
		const tip = container.querySelector(".owner-chart-tip");
		expect(tip).not.toBeNull();
		expect(tip?.textContent).toContain("12");
		expect(container.querySelectorAll(".owner-chart__latest")).toHaveLength(0);
	});

	it("rests a latest day on the final reading with a visible Latest label", async () => {
		const today = new Intl.DateTimeFormat("en-CA", {
			timeZone: "UTC",
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).format(new Date());
		const latestDaily: DailyAnalytics = {
			...mixedDaily,
			businessDay: today,
			timeline: [
				...mixedDaily.timeline.slice(0, 3),
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
				{
					state: "value",
					minuteStartUtc: "2026-07-21T07:03:00.000Z",
					count: 5,
					entries: 0,
					exits: 7,
					band: "quiet",
					capacitySnapshot: 80,
					settingsVersion: 2,
					source: "live",
				},
			],
		};
		await render(
			<OwnerAnalyticsView
				daily={latestDaily}
				currentTimeZone="UTC"
				timeZoneByVersion={
					new Map([
						[1, "UTC"],
						[2, "UTC"],
					])
				}
			/>,
		);
		// The marker belongs to the latest real reading even though the peak
		// (12) sits earlier in the day; the stem and Latest/time annotation
		// follow Paper's in-progress frame. No tooltip before selection.
		expect(
			container.querySelector("[data-active-reading]")?.textContent,
		).toContain("5");
		expect(
			container.querySelector("[data-active-reading]")?.textContent,
		).not.toContain("12");
		expect(container.querySelectorAll(".owner-chart__stem")).toHaveLength(1);
		expect(
			container.querySelector(".owner-chart__latest")?.textContent,
		).toContain("Latest");
		// Latest reading at the plot edge stays centered on its point with
		// only the minimal anchor clamp — the point's x remains inside its
		// own caption box instead of the label snapping fully to one side.
		// The anchor keeps the exact point ratio (no remapping); only the
		// clamp bounds move, and by at most the caption half-width.
		const latest = container.querySelector<HTMLElement>(".owner-chart__latest");
		expect(latest?.style.transform).toBe("");
		expect(clampedCaptionLeft(1184 / 1200, 55)).toBe(
			"clamp(55px, 98.6667%, calc(100% - 55px))",
		);
		expect(container.querySelectorAll(".owner-chart-tip")).toHaveLength(0);

		const chart = container.querySelector<HTMLElement>("[data-owner-chart]");
		chart?.focus();
		await act(async () =>
			chart?.dispatchEvent(
				new KeyboardEvent("keydown", { key: "Home", bubbles: true }),
			),
		);
		// Inspection adds a distinct marker and tooltip while the true latest
		// reading retains its own identity.
		expect(container.querySelectorAll(".owner-chart__latest")).toHaveLength(1);
		expect(
			container.querySelectorAll(".owner-chart__active--latest"),
		).toHaveLength(1);
		expect(
			container.querySelectorAll(".owner-chart__active--inspected"),
		).toHaveLength(1);
		expect(container.querySelector(".owner-chart-tip")?.textContent).toContain(
			"0",
		);
	});

	it("falls back to completed-day presentation when the gym zone is unresolvable", async () => {
		const today = new Intl.DateTimeFormat("en-CA", {
			timeZone: "UTC",
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).format(new Date());
		await render(
			<OwnerAnalyticsView
				daily={{ ...mixedDaily, businessDay: today }}
				currentTimeZone="Invalid/Zone"
				timeZoneByVersion={
					new Map([
						[1, "Asia/Riyadh"],
						[2, "America/New_York"],
					])
				}
			/>,
		);
		expect(container.querySelectorAll(".owner-chart__latest")).toHaveLength(0);
		expect(container.querySelectorAll(".owner-chart__stem")).toHaveLength(0);
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
		expect(container.textContent).toContain("No readings yet today");

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
		expect(container.textContent).toContain("FITWAY is closed today");
	});

	it("scales counts to nice round ticks without capping the true peak", () => {
		expect(niceCountScale(57)).toEqual({
			niceMax: 60,
			ticks: [60, 40, 20, 0],
		});
		expect(niceCountScale(12)).toEqual({
			niceMax: 20,
			ticks: [20, 15, 10, 5, 0],
		});
		// The ceiling always covers the peak: a peak near the top of the
		// scale keeps its exact ordinate instead of being capped or averaged.
		for (const raw of [1, 19, 20, 68, 120, 400]) {
			const { niceMax, ticks } = niceCountScale(raw);
			expect(niceMax).toBeGreaterThanOrEqual(raw);
			expect(ticks[0]).toBe(niceMax);
			expect(ticks.at(-1)).toBe(0);
		}
	});

	it("aligns time ticks to gym-clock hours without duplicating a time", () => {
		const atMinute = (iso: string, settingsVersion: number) => ({
			state: "value" as const,
			minuteStartUtc: iso,
			count: 10,
			entries: 0,
			exits: 0,
			band: "quiet" as const,
			capacitySnapshot: 100,
			settingsVersion,
			source: "live" as const,
		});
		// A full open day in Riyadh: the axis prefers :00 hours and always
		// spans the domain ends.
		const timeline = Array.from({ length: 12 * 60 }, (_unused, minute) => {
			const base = Date.parse("2026-07-21T01:00:00.000Z") + minute * 60_000;
			return atMinute(new Date(base).toISOString(), 1);
		});
		const zones = new Map([[1, "Asia/Riyadh"]]);
		const ticks = intentionalTimeTicks(timeline, zones);
		expect(ticks.length).toBeGreaterThanOrEqual(2);
		expect(ticks.length).toBeLessThanOrEqual(5);
		expect(ticks[0]?.index).toBe(0);
		expect(ticks.at(-1)?.index).toBe(timeline.length - 1);
		const labels = ticks.map(({ bucket }) => bucket.minuteStartUtc);
		expect(new Set(labels).size).toBe(labels.length);
		// Short spans without hour boundaries fall back to distinct minutes.
		const short = [
			atMinute("2026-07-21T07:00:00.000Z", 1),
			atMinute("2026-07-21T07:01:00.000Z", 1),
		];
		expect(intentionalTimeTicks(short, zones)).toHaveLength(2);
		expect(intentionalTimeTicks([], zones)).toHaveLength(0);
	});

	it("keeps a noisy day readable: every gap stays honest, only long ones are named", async () => {
		// A demo-like noisy day: routine one-minute absences plus one
		// five-minute outage and a peak near the top of the scale.
		const noisy: DailyAnalytics = {
			businessDay: "2026-07-21",
			timeline: [
				{
					state: "value",
					minuteStartUtc: "2026-07-21T07:00:00.000Z",
					count: 58,
					entries: 58,
					exits: 0,
					band: "moderate",
					capacitySnapshot: 120,
					settingsVersion: 1,
					source: "live",
				},
				{
					state: "missing",
					minuteStartUtc: "2026-07-21T07:01:00.000Z",
					count: null,
					settingsVersion: 1,
				},
				{
					state: "value",
					minuteStartUtc: "2026-07-21T07:02:00.000Z",
					count: 57,
					entries: 0,
					exits: 1,
					band: "moderate",
					capacitySnapshot: 120,
					settingsVersion: 1,
					source: "live",
				},
				{
					state: "missing",
					minuteStartUtc: "2026-07-21T07:03:00.000Z",
					count: null,
					settingsVersion: 1,
				},
				{
					state: "missing",
					minuteStartUtc: "2026-07-21T07:04:00.000Z",
					count: null,
					settingsVersion: 1,
				},
				{
					state: "missing",
					minuteStartUtc: "2026-07-21T07:05:00.000Z",
					count: null,
					settingsVersion: 1,
				},
				{
					state: "missing",
					minuteStartUtc: "2026-07-21T07:06:00.000Z",
					count: null,
					settingsVersion: 1,
				},
				{
					state: "missing",
					minuteStartUtc: "2026-07-21T07:07:00.000Z",
					count: null,
					settingsVersion: 1,
				},
				{
					state: "value",
					minuteStartUtc: "2026-07-21T07:08:00.000Z",
					count: 62,
					entries: 5,
					exits: 0,
					band: "busy",
					capacitySnapshot: 120,
					settingsVersion: 1,
					source: "backfill",
				},
			],
			peak: {
				minuteStartUtc: "2026-07-21T07:08:00.000Z",
				count: 62,
				band: "busy",
				capacitySnapshot: 120,
				settingsVersion: 1,
			},
			dailyAverage: 59,
			estimatedEntranceCrossings: 63,
			observedOpenMinutes: 3,
			expectedOpenMinutes: 9,
			coverage: 1 / 3,
		};
		await render(
			<OwnerAnalyticsView
				daily={noisy}
				currentTimeZone="Asia/Riyadh"
				timeZoneByVersion={new Map([[1, "Asia/Riyadh"]])}
			/>,
		);
		// One- and five-minute gaps remain line breaks with short ticks; neither
		// should dominate the overview with a full-height dimension bracket.
		expect(container.querySelectorAll(".owner-chart__gap-stem")).toHaveLength(
			0,
		);
		expect(
			container.querySelectorAll(".owner-chart__gap-bracket"),
		).toHaveLength(0);
		expect(container.querySelectorAll(".owner-chart__gap-tick")).toHaveLength(
			0,
		);
		expect(container.querySelector(".owner-chart__gap-label")).toBeNull();
		for (const tick of container.querySelectorAll(".owner-chart__gap-stem")) {
			expect(
				Number(tick.getAttribute("y2")) - Number(tick.getAttribute("y1")),
			).toBeLessThanOrEqual(5);
		}
		// The 62 peak is not capped: the nice ceiling covers it and the
		// marker rests on the true peak ordinate.
		expect(niceCountScale(62).niceMax).toBeGreaterThanOrEqual(62);
		expect(
			container.querySelector("[data-active-reading]")?.textContent,
		).toContain("62");
		// Exact truth survives in the table: all nine minutes listed with
		// their states, and the missing rows show no invented count.
		await openMinuteDetails();
		const rows = container.querySelectorAll(".owner-table-region tbody tr");
		expect(rows).toHaveLength(9);
		expect(
			container.querySelectorAll(
				'.owner-table-region tr[data-state="missing"]',
			),
		).toHaveLength(6);
	});

	it("keeps curve geometry invariant as selection moves and masks only the marker", async () => {
		const peakUtc = "2026-07-21T07:02:00.000Z";
		const value = (minuteStartUtc: string, count: number) => ({
			state: "value" as const,
			minuteStartUtc,
			count,
			entries: 1,
			exits: 0,
			band: "moderate" as const,
			capacitySnapshot: 100,
			settingsVersion: 1,
			source: "live" as const,
		});
		const connected: DailyAnalytics = {
			businessDay: "2026-07-21",
			timeline: [
				value("2026-07-21T07:00:00.000Z", 10),
				value("2026-07-21T07:01:00.000Z", 20),
				value(peakUtc, 30),
				value("2026-07-21T07:03:00.000Z", 20),
				value("2026-07-21T07:04:00.000Z", 10),
			],
			peak: {
				minuteStartUtc: peakUtc,
				count: 30,
				band: "moderate",
				capacitySnapshot: 100,
				settingsVersion: 1,
			},
			dailyAverage: 18,
			estimatedEntranceCrossings: 5,
			observedOpenMinutes: 5,
			expectedOpenMinutes: 5,
			coverage: 1,
		};
		await render(
			<OwnerAnalyticsView
				daily={connected}
				currentTimeZone="UTC"
				timeZoneByVersion={new Map([[1, "UTC"]])}
			/>,
		);
		const paths = () =>
			[...container.querySelectorAll(".owner-chart__line")].map((line) =>
				line.getAttribute("d"),
			);
		const before = paths();
		expect(before.join()).toContain("C");
		expect(container.querySelector("mask ellipse")).toBeNull();
		const chart = container.querySelector<HTMLElement>("[data-owner-chart]");
		await act(async () =>
			chart?.dispatchEvent(
				new KeyboardEvent("keydown", { key: "End", bubbles: true }),
			),
		);
		expect(paths()).toEqual(before);
		const ellipse = container.querySelector("mask ellipse");
		expect(ellipse).not.toBeNull();
		expect(Number(ellipse?.getAttribute("rx"))).toBeGreaterThan(0);
		for (const line of container.querySelectorAll(".owner-chart__line"))
			expect(line.getAttribute("mask")).toContain("url(#");
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
