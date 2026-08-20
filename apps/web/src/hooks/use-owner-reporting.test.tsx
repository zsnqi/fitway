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

import {
	csvFileName,
	rangeProblem,
	shiftBusinessDay,
	useOwnerCsvExport,
	useOwnerReporting,
	windowEndingOn,
} from "./use-owner-reporting";

describe("business-day arithmetic", () => {
	it("moves a business day by whole calendar days in either direction", () => {
		expect(shiftBusinessDay("2026-08-15", 1)).toBe("2026-08-16");
		expect(shiftBusinessDay("2026-08-01", -1)).toBe("2026-07-31");
		expect(shiftBusinessDay("2026-03-01", -1)).toBe("2026-02-28");
	});

	it("is unaffected by a daylight-saving transition in any device zone", () => {
		// A business day is a label the server assigned, not an instant. Moving it
		// through a European spring-forward must not lose or gain a day.
		expect(shiftBusinessDay("2026-03-28", 1)).toBe("2026-03-29");
		expect(shiftBusinessDay("2026-03-29", 1)).toBe("2026-03-30");
		expect(shiftBusinessDay("2026-10-24", 3)).toBe("2026-10-27");
	});

	it("rejects a value that is not a real calendar day", () => {
		expect(() => shiftBusinessDay("2026-02-30", 1)).toThrow();
		expect(() => shiftBusinessDay("15-08-2026", 1)).toThrow();
	});

	it("builds an inclusive window that ends on the anchor day", () => {
		expect(windowEndingOn("2026-08-15", 28)).toEqual({
			startBusinessDay: "2026-07-19",
			endBusinessDay: "2026-08-15",
		});
		expect(windowEndingOn("2026-08-15", 1)).toEqual({
			startBusinessDay: "2026-08-15",
			endBusinessDay: "2026-08-15",
		});
	});
});

describe("range validation", () => {
	const range = (startBusinessDay: string, endBusinessDay: string) => ({
		startBusinessDay,
		endBusinessDay,
	});

	it("names each distinct problem rather than coercing the range", () => {
		expect(rangeProblem(range("", "2026-08-15"), 31)).toBe("incomplete");
		expect(rangeProblem(range("2026-02-30", "2026-08-15"), 31)).toBe(
			"malformed",
		);
		expect(rangeProblem(range("2026-08-15", "2026-08-01"), 31)).toBe(
			"inverted",
		);
		expect(rangeProblem(range("2026-07-01", "2026-08-15"), 31)).toBe(
			"too_long",
		);
	});

	it("treats the bound as inclusive at exactly the maximum", () => {
		// 2026-07-16 through 2026-08-15 is 31 inclusive days.
		expect(rangeProblem(range("2026-07-16", "2026-08-15"), 31)).toBeNull();
		expect(rangeProblem(range("2026-07-15", "2026-08-15"), 31)).toBe(
			"too_long",
		);
		// And the export bound is the frozen CSV one, a full year wider.
		expect(rangeProblem(range("2025-08-15", "2026-08-15"), 366)).toBeNull();
		expect(rangeProblem(range("2025-08-14", "2026-08-15"), 366)).toBe(
			"too_long",
		);
	});

	it("names the export file after the window it actually covers", () => {
		expect(csvFileName(range("2026-08-01", "2026-08-15"))).toBe(
			"fitway-occupancy-2026-08-01-to-2026-08-15.csv",
		);
	});
});

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

const comparablePayload = {
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
	for (let pass = 0; pass < 5; pass += 1) {
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});
	}
}

async function render(element: React.ReactNode) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	await act(async () => {
		root?.render(
			<QueryClientProvider client={queryClient}>{element}</QueryClientProvider>,
		);
	});
	await settle();
}

beforeEach(() => {
	Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
	vi.clearAllMocks();
	daily.mockResolvedValue(dailyPayload);
	timeContext.mockResolvedValue(timeContextPayload);
	heatmap.mockResolvedValue(heatmapPayload());
	weekOverWeek.mockResolvedValue(comparablePayload);
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});

afterEach(async () => {
	await act(async () => root?.unmount());
	container.remove();
	root = undefined;
});

function ReportingProbe({
	startBusinessDay,
	endBusinessDay,
	prerequisite = {
		timeZone: "Asia/Riyadh",
		anchorBusinessDay: "2026-08-15",
	},
}: {
	startBusinessDay?: string;
	endBusinessDay?: string;
	prerequisite?: { timeZone: string | null; anchorBusinessDay: string | null };
}) {
	const reporting = useOwnerReporting(
		startBusinessDay && endBusinessDay
			? { startBusinessDay, endBusinessDay }
			: null,
		prerequisite,
	);
	return (
		<div
			data-available={String(reporting.available)}
			data-zone={reporting.timeZone ?? ""}
			data-anchor={reporting.anchorBusinessDay ?? ""}
			data-range={
				reporting.range
					? `${reporting.range.startBusinessDay}/${reporting.range.endBusinessDay}`
					: ""
			}
			data-heatmap={reporting.heatmap.status}
			data-cells={String(reporting.heatmap.data?.cells.length ?? 0)}
			data-comparison={reporting.comparison.status}
			data-comparison-state={reporting.comparison.data?.state ?? ""}
		/>
	);
}

function probe() {
	return container.firstElementChild;
}

describe("useOwnerReporting", () => {
	it("defaults to the 28-day window ending on the gym's own business day", async () => {
		await render(<ReportingProbe />);

		// Twenty-eight inclusive days gives four samples for every weekday, and the
		// anchor is the gym's business day rather than the device's calendar day.
		expect(probe()?.getAttribute("data-range")).toBe("2026-07-19/2026-08-15");
		expect(heatmap).toHaveBeenCalledWith({
			startBusinessDay: "2026-07-19",
			endBusinessDay: "2026-08-15",
		});
	});

	it("uses the prerequisite facts without creating another Daily observer", async () => {
		await render(
			<ReportingProbe
				startBusinessDay="2026-07-19"
				endBusinessDay="2026-08-15"
			/>,
		);

		expect(probe()?.getAttribute("data-available")).toBe("true");
		expect(probe()?.getAttribute("data-zone")).toBe("Asia/Riyadh");
		expect(probe()?.getAttribute("data-anchor")).toBe("2026-08-15");
		// Exactly the two History leaves, and no call at all to either shared Phase 9
		// procedure: their permanent observer lives above this subtree.
		expect(daily).not.toHaveBeenCalled();
		expect(timeContext).not.toHaveBeenCalled();
		expect(heatmap).toHaveBeenCalledTimes(1);
		expect(weekOverWeek).toHaveBeenCalledTimes(1);
		expect(heatmap).toHaveBeenCalledWith({
			startBusinessDay: "2026-07-19",
			endBusinessDay: "2026-08-15",
		});
		// The comparison window is resolved server-side, so it takes no argument.
		expect(weekOverWeek).toHaveBeenCalledWith();
	});

	it("stands down entirely while prerequisite facts are unavailable", async () => {
		await render(
			<ReportingProbe
				prerequisite={{ timeZone: null, anchorBusinessDay: null }}
			/>,
		);

		expect(probe()?.getAttribute("data-available")).toBe("false");
		// Neither leaf is called: `/admin` is already carrying one error and one
		// retry for that same cause.
		expect(heatmap).not.toHaveBeenCalled();
		expect(weekOverWeek).not.toHaveBeenCalled();
	});

	it("never sends a range the leaf would reject", async () => {
		await render(
			<ReportingProbe
				startBusinessDay="2026-01-01"
				endBusinessDay="2026-08-15"
			/>,
		);

		expect(heatmap).not.toHaveBeenCalled();
		expect(probe()?.getAttribute("data-heatmap")).toBe("pending");
		// The comparison does not share the range, so it still answers.
		expect(probe()?.getAttribute("data-comparison")).toBe("success");
	});

	it("keeps the two leaves independent when one of them fails", async () => {
		weekOverWeek.mockRejectedValue(new Error("unavailable"));
		await render(<ReportingProbe />);

		expect(probe()?.getAttribute("data-heatmap")).toBe("success");
		expect(probe()?.getAttribute("data-cells")).toBe("168");
		expect(probe()?.getAttribute("data-comparison")).toBe("error");
	});

	it("surfaces a malformed payload as an error rather than a plausible figure", async () => {
		const cells = heatmapPayload().cells.slice(0, 12);
		heatmap.mockResolvedValue({ ...heatmapPayload(), cells });
		await render(<ReportingProbe />);

		expect(probe()?.getAttribute("data-heatmap")).toBe("error");
		expect(probe()?.getAttribute("data-cells")).toBe("0");
	});

	it("carries the insufficient-history discriminant through unchanged", async () => {
		weekOverWeek.mockResolvedValue({
			state: "insufficient_history",
			minimumCoverage: 0.8,
			currentWeek: comparablePayload.currentWeek,
			priorWeek: { ...comparablePayload.priorWeek, coverage: 0.3 },
			reasons: ["prior_week_coverage_below_minimum"],
		});
		await render(<ReportingProbe />);

		expect(probe()?.getAttribute("data-comparison-state")).toBe(
			"insufficient_history",
		);
	});
});

function ExportProbe({ selection }: { selection: [string, string] }) {
	const csvExport = useOwnerCsvExport();
	const state = csvExport.state;
	return (
		<div
			data-status={state.status}
			data-rows={"rows" in state ? String(state.rows) : ""}
			data-file={state.status === "ready" ? state.fileName : ""}
			data-reason={state.status === "error" ? state.reason : ""}
		>
			<button
				type="button"
				data-start=""
				onClick={() =>
					csvExport.start({
						startBusinessDay: selection[0],
						endBusinessDay: selection[1],
					})
				}
			>
				start
			</button>
			<button type="button" data-abort="" onClick={csvExport.abort}>
				abort
			</button>
		</div>
	);
}

function pressExport(action: "start" | "abort") {
	const button = container.querySelector<HTMLButtonElement>(`[data-${action}]`);
	if (!button) throw new Error(`No ${action} control was rendered`);
	return act(async () => {
		button.click();
	});
}

describe("useOwnerCsvExport", () => {
	beforeEach(() => {
		let created = 0;
		vi.stubGlobal("URL", {
			...URL,
			createObjectURL: vi.fn(() => {
				created += 1;
				return `blob:fitway/${created}`;
			}),
			revokeObjectURL: vi.fn(),
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("streams to a prepared file and counts only history rows", async () => {
		csv.mockResolvedValue(
			(async function* stream() {
				yield "﻿business_day,count\r\n";
				yield "2026-08-15,12\r\n2026-08-15,14\r\n";
			})(),
		);
		await render(<ExportProbe selection={["2026-08-15", "2026-08-15"]} />);
		await pressExport("start");
		await settle();

		expect(probe()?.getAttribute("data-status")).toBe("ready");
		// Three CRLF-terminated lines arrived; the header is not a row of history.
		expect(probe()?.getAttribute("data-rows")).toBe("2");
		expect(probe()?.getAttribute("data-file")).toBe(
			"fitway-occupancy-2026-08-15-to-2026-08-15.csv",
		);
		expect(csv).toHaveBeenCalledWith(
			{ startBusinessDay: "2026-08-15", endBusinessDay: "2026-08-15" },
			expect.objectContaining({ signal: expect.any(AbortSignal) }),
		);
	});

	it("aborts the transport signal and keeps no partial file", async () => {
		let observed: AbortSignal | undefined;
		csv.mockImplementation(
			async (_input: unknown, options: { signal: AbortSignal }) => {
				observed = options.signal;
				return (async function* stream() {
					yield "﻿business_day,count\r\n";
					await new Promise((resolve) => setTimeout(resolve, 40));
					yield "2026-08-15,12\r\n";
				})();
			},
		);
		await render(<ExportProbe selection={["2026-08-15", "2026-08-15"]} />);
		await pressExport("start");
		await pressExport("abort");
		await settle();

		expect(observed?.aborted).toBe(true);
		// The owner's decision is answered at once, not when the blocked stream
		// happens to unwind.
		expect(probe()?.getAttribute("data-status")).toBe("aborted");

		// And the chunk still in flight cannot resurrect a file afterwards.
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 80));
		});
		await settle();
		expect(probe()?.getAttribute("data-status")).toBe("aborted");
		// A truncated CSV is never handed over as the window that was asked for.
		expect(probe()?.getAttribute("data-file")).toBe("");
		expect(URL.createObjectURL).not.toHaveBeenCalled();
	});

	it("reports a transport failure without inventing a file", async () => {
		csv.mockRejectedValue(new Error("Service Unavailable"));
		await render(<ExportProbe selection={["2026-08-15", "2026-08-15"]} />);
		await pressExport("start");
		await settle();

		expect(probe()?.getAttribute("data-status")).toBe("error");
		expect(probe()?.getAttribute("data-reason")).toBe("transport");
	});

	it("refuses an over-wide export before it reaches the wire", async () => {
		await render(<ExportProbe selection={["2024-01-01", "2026-08-15"]} />);
		await pressExport("start");
		await settle();

		expect(csv).not.toHaveBeenCalled();
		expect(probe()?.getAttribute("data-status")).toBe("error");
		expect(probe()?.getAttribute("data-reason")).toBe("range");
	});
});
