// @vitest-environment happy-dom

import type { DailyAnalytics } from "@fitway/api/analytics/daily-analytics";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/i18n/provider";

import {
	clampedCaptionLeft,
	markerExitPoint,
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
		expect(container.textContent).toContain("not unique members");
		expect(container.textContent).toContain("Scheduled closed");
		expect(container.textContent).toContain("Missing observation");
		expect(container.textContent).not.toContain("Observation coverage");
		expect(container.querySelectorAll(".owner-metric")).toHaveLength(3);
		expect(container.textContent).toContain("10:00 AM");
		expect(container.textContent).toContain("3:01 AM");
		expect(container.querySelectorAll(".owner-chart__point")).toHaveLength(2);
		// Paper gap language: the interior missing minute renders as dashed
		// stems plus a duration label, never as a filled band. The leading
		// closed edge stays in the table only.
		expect(
			container.querySelectorAll(".owner-chart__closed, .owner-chart__missing"),
		).toHaveLength(0);
		expect(container.querySelectorAll(".owner-chart__gap-stem")).toHaveLength(
			2,
		);
		expect(
			container.querySelectorAll(".owner-chart__gap-bracket"),
		).toHaveLength(1);
		expect(container.querySelectorAll(".owner-chart__gap-tick")).toHaveLength(
			2,
		);
		expect(
			container.querySelector(".owner-chart__gap-label")?.textContent,
		).toContain("1");
		// Mid-plot gap label stays centered on its bracket: centering comes
		// from the stylesheet, so no inline transform may override it. The
		// anchor carries only the minimal edge clamp (happy-dom cannot parse
		// clamp(), so the helper itself is asserted below and placement is
		// governed in Chromium).
		const gapLabel = container.querySelector<HTMLElement>(
			".owner-chart__gap-label",
		);
		expect(gapLabel?.style.transform).toBe("");
		expect(clampedCaptionLeft(0.6622, 40)).toBe(
			"clamp(40px, 66.22%, calc(100% - 40px))",
		);
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
		// Tick labels sit at their exact slot percentages, one slot per
		// label; no inline transform may override the stylesheet centering.
		const ticks = container.querySelectorAll(".owner-chart-x-axis span");
		expect(ticks).toHaveLength(7);
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
