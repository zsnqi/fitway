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
	markerExitPoint,
	niceCountScale,
	OwnerAnalyticsError,
	OwnerAnalyticsLoading,
	OwnerAnalyticsView,
	smoothPath,
	trimActiveRun,
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

	it("separates half-hour stops from exact peak, zero and outage boundaries", () => {
		const daily = overviewDay();
		const overview = chartOverview(daily.timeline, new Map([[1, "UTC"]]));
		expect(overview.stops.map(({ index }) => index)).toEqual([
			0, 30, 60, 90, 120, 150, 180,
		]);
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
		expect(overview.stops.map(({ index }) => index)).not.toContain(80);
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
		await leave();
		expect(container.querySelector("[data-selected-reading]")).toBeNull();
		await act(async () => {
			chart.dispatchEvent(
				new KeyboardEvent("keydown", { key: "Home", bubbles: true }),
			);
		});
		await act(async () => {
			chart.dispatchEvent(
				new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
			);
		});
		await hover(60);
		await leave();
		expect(
			container.querySelector("[data-selected-reading]")?.textContent,
		).toContain("7:30 AM");
		await act(async () => {
			chart.dispatchEvent(
				new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
			);
		});
		expect(container.querySelector("[data-selected-reading]")).toBeNull();
		expect(
			container.querySelectorAll(".owner-table-region tbody tr"),
		).toHaveLength(181);
		expect(container.querySelectorAll(".owner-chart__gap-label")).toHaveLength(
			1,
		);
		expect(
			container.querySelector(".owner-chart__gap-label")?.textContent,
		).toContain("15");
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
		expect(container.textContent).not.toContain("not unique members");
		expect(container.textContent).toContain("Scheduled closed");
		expect(container.textContent).toContain("Missing observation");
		expect(
			container.querySelector(".owner-metrics")?.textContent,
		).not.toContain("Observation coverage");
		expect(
			container.querySelector(".owner-table-disclosure")?.textContent,
		).toContain("Observation coverage");
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
			2,
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
		// Completed day, pristine selection: ring rests on the peak with no
		// stem, no Latest label, and no tooltip — Paper's closed treatment.
		expect(container.querySelectorAll(".owner-chart__active")).toHaveLength(1);
		expect(container.querySelectorAll(".owner-chart__stem")).toHaveLength(0);
		expect(container.querySelectorAll(".owner-chart__latest")).toHaveLength(0);
		expect(container.querySelectorAll(".owner-chart-tip")).toHaveLength(0);
		// Paper terminates the line at the marker's OUTER edge: the active
		// solo reading (the 12 peak) draws no line at all — the HTML core
		// already marks it — while the idle solo dot (the genuine 0) keeps
		// its stroked point so no real reading is hidden.
		expect(container.querySelectorAll(".owner-chart__line")).toHaveLength(1);
		for (const line of container.querySelectorAll(".owner-chart__line")) {
			expect(line.getAttribute("d")).toContain("L");
		}
		expect(container.querySelectorAll(".owner-chart__solo")).toHaveLength(1);
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
		// An explicit selection replaces the Latest annotation with the
		// selected-point readout, matching Paper's focus treatment.
		expect(container.querySelectorAll(".owner-chart__latest")).toHaveLength(0);
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
			4,
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
		const rows = container.querySelectorAll(".owner-table-region tbody tr");
		expect(rows).toHaveLength(9);
		expect(
			container.querySelectorAll(
				'.owner-table-region tr[data-state="missing"]',
			),
		).toHaveLength(6);
	});

	describe("marker-geometry fidelity", () => {
		it("exits the marker ellipse on the outer edge along each axis", () => {
			expect(
				markerExitPoint(
					{ x: 100, y: 100 },
					{ x: 200, y: 100 },
					{ x: 100, y: 100 },
					10,
					10,
				),
			).toEqual({ x: 110, y: 100 });
			expect(
				markerExitPoint(
					{ x: 100, y: 100 },
					{ x: 100, y: 200 },
					{ x: 100, y: 100 },
					10,
					10,
				),
			).toEqual({ x: 100, y: 110 });
			// Diagonal leaves along the ray: (0.6, 0.8) * 10 = (6, 8).
			const diagonal = markerExitPoint(
				{ x: 0, y: 0 },
				{ x: 30, y: 40 },
				{ x: 0, y: 0 },
				10,
				10,
			);
			expect(diagonal?.x).toBeCloseTo(6, 9);
			expect(diagonal?.y).toBeCloseTo(8, 9);
			// An outer point exactly on the edge is already a valid end.
			expect(
				markerExitPoint(
					{ x: 0, y: 0 },
					{ x: 10, y: 0 },
					{ x: 0, y: 0 },
					10,
					10,
				),
			).toEqual({ x: 10, y: 0 });
		});

		it("rejects inverted or degenerate cutouts", () => {
			const center = { x: 0, y: 0 };
			// Inner already outside: nothing to trim from.
			expect(
				markerExitPoint({ x: 50, y: 0 }, { x: 100, y: 0 }, center, 10, 10),
			).toBeNull();
			// Outer still inside: the segment never leaves.
			expect(
				markerExitPoint(center, { x: 5, y: 0 }, center, 10, 10),
			).toBeNull();
			expect(
				markerExitPoint(center, { x: 50, y: 0 }, center, 0, 10),
			).toBeNull();
			expect(
				trimActiveRun(
					[
						{ x: 0, y: 0 },
						{ x: 50, y: 0 },
					],
					0,
					0,
					10,
				),
			).toEqual({ left: null, right: null });
		});

		it("splits an interior active point into two edge-terminated sides", () => {
			const points = [
				{ x: 0, y: 100 },
				{ x: 100, y: 100 },
				{ x: 200, y: 100 },
			];
			const { left, right } = trimActiveRun(points, 1, 10, 10);
			expect(left).toEqual([
				{ x: 0, y: 100 },
				{ x: 90, y: 100 },
			]);
			expect(right).toEqual([
				{ x: 110, y: 100 },
				{ x: 200, y: 100 },
			]);
		});

		it("keeps a single side when the active point ends its run", () => {
			const points = [
				{ x: 0, y: 100 },
				{ x: 100, y: 100 },
			];
			expect(trimActiveRun(points, 1, 10, 10)).toEqual({
				left: [
					{ x: 0, y: 100 },
					{ x: 90, y: 100 },
				],
				right: null,
			});
			expect(trimActiveRun(points, 0, 10, 10)).toEqual({
				left: null,
				right: [
					{ x: 10, y: 100 },
					{ x: 100, y: 100 },
				],
			});
		});

		it("draws trimmed tip segments straight so no smoothing bow crosses the ring", () => {
			const points = [
				{ x: 0, y: 100 },
				{ x: 100, y: 60 },
				{ x: 200, y: 100 },
			];
			// Default keeps every segment smoothed.
			expect(smoothPath(points)).toContain("C");
			expect(smoothPath(points).trimEnd().endsWith("L")).toBe(false);
			// Left side: last segment straight, earlier segments smoothed.
			const leftTip = smoothPath(points, "end");
			expect(leftTip).toContain("C");
			expect(leftTip.trimEnd()).toMatch(/L200,100$/);
			// Right side: first segment straight, later segments smoothed.
			const rightTip = smoothPath(points, "start");
			expect(rightTip).toContain("C");
			expect(rightTip).toMatch(/^M0,100 L100,60/);
			// Two-point sides are straight lines either way.
			expect(smoothPath(points.slice(0, 2), "end")).toBe("M0,100 L100,60");
			expect(smoothPath(points.slice(1), "start")).toBe("M100,60 L200,100");
		});

		it("terminates rendered lines at the marker outer edge and drops the stem from the ring", async () => {
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
			const markerCenter = () => {
				const marker = container.querySelector<HTMLElement>(
					".owner-chart__active",
				);
				if (!marker) throw new Error("active marker is missing");
				return {
					x: (Number.parseFloat(marker.style.left) / 100) * 1200,
					y: (Number.parseFloat(marker.style.top) / 100) * 240,
				};
			};
			const closestLineApproach = () => {
				const center = markerCenter();
				let closest = Number.POSITIVE_INFINITY;
				for (const line of container.querySelectorAll(".owner-chart__line")) {
					const pairs = [
						...(line.getAttribute("d") ?? "").matchAll(
							/(-?[\d.]+),(-?[\d.]+)/g,
						),
					];
					for (const pair of pairs) {
						closest = Math.min(
							closest,
							Math.hypot(
								Number(pair[1]) - center.x,
								Number(pair[2]) - center.y,
							),
						);
					}
				}
				return closest;
			};
			await render(
				<OwnerAnalyticsView
					daily={connected}
					currentTimeZone="UTC"
					timeZoneByVersion={new Map([[1, "UTC"]])}
				/>,
			);
			// Pristine completed day: ring on the interior peak with both
			// sides trimmed to the ring, no stem, no tooltip.
			expect(
				container.querySelectorAll('.owner-chart__line[data-trimmed="left"]'),
			).toHaveLength(1);
			expect(
				container.querySelectorAll('.owner-chart__line[data-trimmed="right"]'),
			).toHaveLength(1);
			// Paint-level junction: trimmed sides carry the butt-cap class so
			// no round cap extends past the outer edge toward the core, and
			// each tip segment is a straight radial line: the left side ends
			// with L, the right side opens with M..L.
			for (const line of container.querySelectorAll(
				".owner-chart__line[data-trimmed]",
			)) {
				expect(line.classList.contains("owner-chart__line--trimmed")).toBe(
					true,
				);
				const d = line.getAttribute("d") ?? "";
				if (line.getAttribute("data-trimmed") === "left") {
					expect(d.trimEnd()).toMatch(/L-?[\d.]+,-?[\d.]+$/);
				} else {
					expect(d).toMatch(/^M-?[\d.]+,-?[\d.]+ L-?[\d.]+,-?[\d.]+/);
				}
			}
			expect(container.querySelectorAll(".owner-chart__stem")).toHaveLength(0);
			// No stroked coordinate may reach the marker center: the closest
			// approach is a trimmed edge on the ring (≥10 viewBox units away
			// under the deterministic unit fallback radii).
			expect(closestLineApproach()).toBeGreaterThan(5);
			// Move to the final reading: only the approaching side remains,
			// and the fresh stem drops from the ring's outer bottom edge.
			const chart = container.querySelector<HTMLElement>("[data-owner-chart]");
			chart?.focus();
			await act(async () =>
				chart?.dispatchEvent(
					new KeyboardEvent("keydown", { key: "End", bubbles: true }),
				),
			);
			expect(
				container.querySelectorAll('.owner-chart__line[data-trimmed="left"]'),
			).toHaveLength(1);
			expect(
				container.querySelectorAll('.owner-chart__line[data-trimmed="right"]'),
			).toHaveLength(0);
			expect(closestLineApproach()).toBeGreaterThan(5);
			const endCenter = markerCenter();
			const stem = container.querySelector(".owner-chart__stem");
			expect(stem).not.toBeNull();
			expect(Number(stem?.getAttribute("y1")) - endCenter.y).toBeCloseTo(10, 5);
		});

		it("draws nothing for a lone active reading and walks past hidden neighbors", () => {
			expect(trimActiveRun([{ x: 50, y: 50 }], 0, 10, 10)).toEqual({
				left: null,
				right: null,
			});
			// Neighbors 8px away sit inside the 10px ring: the whole
			// three-point run hides behind the marker, so both sides are null.
			const dense = [
				{ x: 0, y: 0 },
				{ x: 8, y: 0 },
				{ x: 16, y: 0 },
			];
			expect(trimActiveRun(dense, 1, 10, 10)).toEqual({
				left: null,
				right: null,
			});
			// A farther point beyond a hidden neighbor still exits cleanly.
			const beyond = [
				{ x: 0, y: 0 },
				{ x: 12, y: 0 },
				{ x: 20, y: 0 },
			];
			const trimmed = trimActiveRun(beyond, 2, 10, 10);
			expect(trimmed.right).toBeNull();
			expect(trimmed.left?.at(-1)).toEqual({ x: 10, y: 0 });
			expect(trimmed.left?.at(0)).toEqual({ x: 0, y: 0 });
		});
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
