// @vitest-environment happy-dom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { daily, timeContext } = vi.hoisted(() => ({
	daily: vi.fn(),
	timeContext: vi.fn(),
}));
vi.mock("@/utils/orpc", () => ({
	client: { admin: { analytics: { daily, timeContext } } },
}));

import { useOwnerDailyAnalytics } from "./use-owner-daily-analytics";

const payload = {
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
			entries: 1,
			exits: 0,
			band: "quiet",
			capacitySnapshot: 100,
			settingsVersion: 2,
			source: "live",
		},
		{
			state: "missing",
			minuteStartUtc: "2026-07-21T07:01:00.000Z",
			count: null,
			settingsVersion: 2,
		},
	],
	peak: {
		minuteStartUtc: "2026-07-21T07:00:00.000Z",
		count: 0,
		band: "quiet",
		capacitySnapshot: 100,
		settingsVersion: 2,
	},
	dailyAverage: 0,
	estimatedEntranceCrossings: 1,
	observedOpenMinutes: 1,
	expectedOpenMinutes: 2,
	coverage: 0.5,
} as const;

let root: Root | undefined;
let container: HTMLDivElement;

function Probe() {
	const result = useOwnerDailyAnalytics();
	return (
		<div data-status={result.status}>
			{result.data
				? `${result.data.daily.businessDay}:${result.data.timeZoneByVersion.get(1)}:${result.data.timeZoneByVersion.get(2)}`
				: result.error?.message}
		</div>
	);
}

async function render() {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	await act(async () => {
		root?.render(
			<QueryClientProvider client={client}>
				<Probe />
			</QueryClientProvider>,
		);
	});
	await act(async () => {
		await new Promise((resolve) => setTimeout(resolve, 0));
	});
	await act(async () => {
		await new Promise((resolve) => setTimeout(resolve, 0));
	});
}

beforeEach(() => {
	Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
	daily.mockReset();
	timeContext.mockReset();
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});

afterEach(async () => {
	if (root) await act(async () => root?.unmount());
	container.remove();
});

describe("owner daily analytics query", () => {
	it("derives unique settings versions and resolves every bucket timezone", async () => {
		daily.mockResolvedValue(payload);
		timeContext.mockResolvedValue({
			current: { settingsVersion: 3, timeZone: "Europe/London" },
			versions: [
				{ settingsVersion: 1, timeZone: "Asia/Riyadh" },
				{ settingsVersion: 2, timeZone: "America/New_York" },
			],
		});
		await render();

		expect(daily).toHaveBeenCalledWith({});
		expect(timeContext).toHaveBeenCalledWith({ settingsVersions: [1, 2] });
		expect(container.firstElementChild?.getAttribute("data-status")).toBe(
			"success",
		);
		expect(container.textContent).toBe(
			"2026-07-21:Asia/Riyadh:America/New_York",
		);
	});

	it("surfaces strict mapping and transport failures without empty fallback data", async () => {
		daily.mockResolvedValue(payload);
		timeContext.mockResolvedValue({
			current: { settingsVersion: 3, timeZone: "Europe/London" },
			versions: [{ settingsVersion: 1, timeZone: "Asia/Riyadh" }],
		});
		await render();
		expect(container.firstElementChild?.getAttribute("data-status")).toBe(
			"error",
		);
		expect(container.textContent).toMatch(/settings version 2/i);
	});
});
