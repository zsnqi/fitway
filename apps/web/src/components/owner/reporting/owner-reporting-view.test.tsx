// @vitest-environment happy-dom

import type {
	Heatmap,
	WeekComparison,
} from "@fitway/api/analytics/reporting/contracts";
import { WEEKDAYS } from "@fitway/api/occupancy/schedule";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { I18nProvider } from "@/i18n/provider";

import {
	busiestAverage,
	cellLevel,
	formatAverage,
	formatPercent,
	OwnerReportingComparison,
	OwnerReportingHeatmap,
	OwnerReportingTable,
	windowLabel,
} from "./owner-reporting-view";

type Cell = Heatmap["cells"][number];

function cell(overrides: Partial<Cell> & Pick<Cell, "weekday" | "localHour">) {
	return {
		state: "value",
		averageOccupancy: 10,
		observedOpenMinutes: 60,
		expectedOpenMinutes: 60,
		sampleDayCount: 4,
		...overrides,
	} as Cell;
}

/**
 * A window in which every distinguishable fact appears at least once: a busy hour, a
 * quiet hour, an hour the gym was open and completely empty, an hour it was closed, and
 * an hour nobody recorded.
 */
function heatmapFixture(): Heatmap {
	const cells = WEEKDAYS.flatMap((weekday) =>
		Array.from({ length: 24 }, (_unused, localHour) =>
			cell({
				weekday,
				localHour,
				state: "closed",
				averageOccupancy: null,
				observedOpenMinutes: 0,
				expectedOpenMinutes: 0,
				sampleDayCount: 0,
			}),
		),
	);
	const at = (weekday: string, hour: number) =>
		cells.findIndex(
			(candidate) =>
				candidate.weekday === weekday && candidate.localHour === hour,
		);
	cells[at("sun", 9)] = cell({ weekday: "sun", localHour: 9 });
	cells[at("sun", 18)] = cell({
		weekday: "sun",
		localHour: 18,
		averageOccupancy: 40,
	});
	// Open, measured, and genuinely empty — not the same fact as either absent state.
	cells[at("sun", 6)] = cell({
		weekday: "sun",
		localHour: 6,
		averageOccupancy: 0,
	});
	// Scheduled open, but nothing was ever recorded for it.
	cells[at("mon", 9)] = cell({
		weekday: "mon",
		localHour: 9,
		state: "missing",
		averageOccupancy: null,
		observedOpenMinutes: 0,
		expectedOpenMinutes: 60,
		sampleDayCount: 0,
	});
	return {
		startBusinessDay: "2026-07-19",
		endBusinessDay: "2026-08-15",
		cells,
	};
}

const week = {
	startBusinessDay: "2026-08-09",
	endBusinessDay: "2026-08-15",
	averageOccupancy: 34.6,
	estimatedEntranceCrossings: 3497,
	observedOpenMinutes: 3884,
	expectedOpenMinutes: 4200,
	coverage: 3884 / 4200,
};
const priorWeek = {
	startBusinessDay: "2026-08-02",
	endBusinessDay: "2026-08-08",
	averageOccupancy: 31.8,
	estimatedEntranceCrossings: 3284,
	observedOpenMinutes: 3612,
	expectedOpenMinutes: 4200,
	coverage: 3612 / 4200,
};

const comparable: WeekComparison = {
	state: "comparable",
	minimumCoverage: 0.8,
	currentWeek: week,
	priorWeek,
	changes: {
		// `percent` is a ratio in the frozen contract: 0.088 is +8.8%.
		averageOccupancy: { absolute: 2.8, percent: 0.088 },
		estimatedEntranceCrossings: { absolute: 213, percent: 0.065 },
	},
};

const insufficient: WeekComparison = {
	state: "insufficient_history",
	minimumCoverage: 0.8,
	currentWeek: week,
	priorWeek: { ...priorWeek, coverage: 0.31, observedOpenMinutes: 1302 },
	reasons: ["prior_week_coverage_below_minimum"],
};

let container: HTMLElement;
let root: Root;

beforeEach(() => {
	Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});

afterEach(() => {
	act(() => root.unmount());
	container.remove();
	document.documentElement.lang = "";
	window.localStorage.clear();
});

function render(node: React.ReactNode, locale: "ar" | "en" = "en") {
	window.localStorage.setItem("fitway.locale", locale);
	document.documentElement.lang = locale;
	act(() => root.render(<I18nProvider>{node}</I18nProvider>));
}

function text() {
	return container.textContent ?? "";
}

describe("reporting formatting", () => {
	it("keeps an average as a mean rather than dressing it up as a headcount", () => {
		expect(formatAverage(34.63, "en")).toBe("34.6");
		expect(formatAverage(34, "en")).toBe("34");
		expect(formatAverage(0, "en")).toBe("0");
	});

	it("uses Western digits in Arabic for both averages and percentages", () => {
		expect(formatAverage(34.6, "ar")).toContain("34.6");
		expect(formatAverage(34.6, "ar")).not.toMatch(/[٠-٩۰-۹]/u);
		expect(formatPercent(0.925, "ar")).not.toMatch(/[٠-٩۰-۹]/u);
	});

	it("separates a window with a plain hyphen, which does not reverse under RTL", () => {
		const label = windowLabel("2026-07-19", "2026-08-15", "ar");
		expect(label).toContain("-");
		// An en dash between two numbers is neutral and would flip the range.
		expect(label).not.toContain("–");
		expect(label).not.toMatch(/[٠-٩۰-۹]/u);
	});
});

describe("cell classification", () => {
	const heatmap = heatmapFixture();
	const busiest = busiestAverage(heatmap);

	function levelAt(weekday: string, hour: number) {
		const found = heatmap.cells.find(
			(candidate) =>
				candidate.weekday === weekday && candidate.localHour === hour,
		);
		if (!found) throw new Error("Fixture cell is missing");
		return cellLevel(found, busiest);
	}

	it("scales the ramp to the busiest cell in the window", () => {
		expect(busiest).toBe(40);
		expect(levelAt("sun", 18)).toBe("4");
		expect(levelAt("sun", 9)).toBe("1");
	});

	it("keeps a genuine zero, a closed hour, and an unrecorded hour apart", () => {
		expect(levelAt("sun", 6)).toBe("zero");
		expect(levelAt("sun", 0)).toBe("closed");
		expect(levelAt("mon", 9)).toBe("missing");
	});

	it("never collapses a quiet window into one flat step", () => {
		const flat = cell({ weekday: "sun", localHour: 9, averageOccupancy: 1 });
		expect(cellLevel(flat, 1)).toBe("4");
		expect(cellLevel(flat, 0)).toBe("1");
	});
});

describe("heatmap rendering", () => {
	function cells() {
		return [
			...container.querySelectorAll<HTMLButtonElement>(".owner-reporting-cell"),
		];
	}

	function at(weekdayIndex: number, localHour: number) {
		const button = cells()[weekdayIndex * 24 + localHour];
		if (!button) throw new Error("Expected heatmap cell is missing");
		return button;
	}

	function expectFocusedCell(weekdayIndex: number, localHour: number) {
		const expected = at(weekdayIndex, localHour);
		expect(document.activeElement).toBe(expected);
		expect(expected.tabIndex).toBe(0);
		expect(cells().filter((button) => button.tabIndex === 0)).toHaveLength(1);
	}

	function press(target: HTMLButtonElement, key: string) {
		act(() =>
			target.dispatchEvent(
				new KeyboardEvent("keydown", { bubbles: true, key }),
			),
		);
	}

	it("carries exactly one tab stop across the whole grid", () => {
		render(<OwnerReportingHeatmap heatmap={heatmapFixture()} />);
		const cells = container.querySelectorAll<HTMLButtonElement>(
			".owner-reporting-cell",
		);
		expect(cells).toHaveLength(168);
		expect([...cells].filter((button) => button.tabIndex === 0)).toHaveLength(
			1,
		);
	});

	it("keeps selection, the single tab stop, and DOM focus together for LTR moves", () => {
		render(<OwnerReportingHeatmap heatmap={heatmapFixture()} />);
		const initial = at(0, 9);
		act(() => initial.focus());
		expectFocusedCell(0, 9);

		press(initial, "ArrowRight");
		expectFocusedCell(0, 10);
		press(at(0, 10), "ArrowDown");
		expectFocusedCell(1, 10);
		press(at(1, 10), "Home");
		expectFocusedCell(1, 0);
		press(at(1, 0), "ArrowLeft");
		expectFocusedCell(1, 0);
		press(at(1, 0), "ArrowUp");
		expectFocusedCell(0, 0);
		press(at(0, 0), "End");
		expectFocusedCell(0, 23);
		press(at(0, 23), "ArrowRight");
		expectFocusedCell(0, 23);
	});

	it("mirrors only the Arabic hour direction while preserving focused selection", () => {
		render(<OwnerReportingHeatmap heatmap={heatmapFixture()} />, "ar");
		const initial = at(0, 9);
		act(() => initial.focus());
		press(initial, "ArrowRight");
		expectFocusedCell(0, 8);
		press(at(0, 8), "ArrowLeft");
		expectFocusedCell(0, 9);
		press(at(0, 9), "ArrowDown");
		expectFocusedCell(1, 9);
	});

	it("names every cell's state in its accessible name, not by colour alone", () => {
		render(<OwnerReportingHeatmap heatmap={heatmapFixture()} />);
		const labels = [
			...container.querySelectorAll<HTMLButtonElement>(".owner-reporting-cell"),
		].map((button) => button.getAttribute("aria-label") ?? "");

		expect(labels.some((label) => label.includes("Open and empty"))).toBe(true);
		expect(labels.some((label) => label.includes("No data"))).toBe(true);
		expect(labels.some((label) => label.includes("Closed"))).toBe(true);
		expect(
			labels.some(
				(label) => label.includes("Observed") && label.includes("40"),
			),
		).toBe(true);
		// The clock span uses a hyphen so it survives an RTL run intact.
		expect(labels[0]).toContain("00:00-00:59");
	});

	it("reads the selected cell out with its own denominator", () => {
		render(<OwnerReportingHeatmap heatmap={heatmapFixture()} />);
		const reading = container.querySelector("[data-owner-reporting-reading]");
		// Sunday 09:00 is the default selection and is an observed hour.
		expect(reading?.textContent).toContain("10");
		expect(reading?.textContent).toContain("60");
		expect(reading?.getAttribute("aria-live")).toBe("polite");
	});

	it("says why a cell has no average instead of showing a zero", () => {
		render(<OwnerReportingHeatmap heatmap={heatmapFixture()} />);
		const closed = container.querySelector<HTMLButtonElement>(
			'.owner-reporting-cell[data-level="closed"]',
		);
		act(() => closed?.click());
		const reading = container.querySelector("[data-owner-reporting-reading]");
		expect(reading?.textContent).toContain(
			"The gym was not open in this hour.",
		);
		// No figure list at all: an absent average is never rendered as a zero.
		expect(
			reading?.querySelector(".owner-reporting-reading__figures"),
		).toBeNull();
	});

	it("distinguishes an unrecorded hour from a closed one in the same readout", () => {
		render(<OwnerReportingHeatmap heatmap={heatmapFixture()} />);
		const missing = container.querySelector<HTMLButtonElement>(
			'.owner-reporting-cell[data-level="missing"]',
		);
		act(() => missing?.click());
		const reading = container.querySelector("[data-owner-reporting-reading]");
		expect(reading?.textContent).toContain("nothing was observed in this hour");
		expect(reading?.textContent).not.toContain("not open");
	});
});

describe("the semantic table beside the grid", () => {
	it("lists every cell in the grid, with parity of state", () => {
		render(<OwnerReportingTable heatmap={heatmapFixture()} />);
		const rows = container.querySelectorAll(
			"[data-owner-reporting-table] tbody tr",
		);
		expect(rows).toHaveLength(168);
		expect(
			container.querySelectorAll("[data-owner-reporting-table] tr[data-zero]"),
		).toHaveLength(1);
		expect(
			container.querySelectorAll(
				'[data-owner-reporting-table] tr[data-state="missing"]',
			),
		).toHaveLength(1);
	});

	it("prints an absent average as words rather than as a number", () => {
		render(<OwnerReportingTable heatmap={heatmapFixture()} />);
		const missing = container.querySelector(
			'[data-owner-reporting-table] tr[data-state="missing"]',
		);
		expect(missing?.textContent).toContain("No data");
		const zero = container.querySelector(
			"[data-owner-reporting-table] tr[data-zero]",
		);
		expect(zero?.textContent).toContain("Open and empty");
	});
});

describe("week-over-week", () => {
	it("states a direction in words as well as a shape when the weeks are comparable", () => {
		render(<OwnerReportingComparison comparison={comparable} />);
		expect(text()).toContain("34.6");
		expect(text()).toContain("31.8");
		expect(text()).toContain("up");
		expect(text()).toContain("8.8%");
		// The concise per-week crossings basis travels with the figure.
		expect(text()).toContain("Door crossings per week.");
	});

	it("withholds the comparison and names the typed reason instead", () => {
		render(<OwnerReportingComparison comparison={insufficient} />);
		const card = container.querySelector(
			'[data-owner-reporting-state="insufficient"]',
		);
		expect(card).not.toBeNull();
		expect(card?.textContent).toContain(
			"The week before was observed for too little",
		);
		// Both weeks' own figures still stand; only the direction is withheld.
		expect(text()).toContain("34.6");
		expect(text()).toContain("31.8");
		expect(container.querySelector(".owner-reporting-change")).toBeNull();
		expect(text()).not.toContain("8.8%");
	});

	it("renders Arabic with Western digits and no reversed range", () => {
		render(<OwnerReportingComparison comparison={comparable} />, "ar");
		expect(text()).toContain("المقارنة الأسبوعية");
		expect(text()).not.toMatch(/[٠-٩۰-۹]/u);
		expect(text()).not.toContain("–");
	});
});
