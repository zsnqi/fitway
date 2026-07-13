// @vitest-environment happy-dom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { usePublicOccupancy } from "./use-public-occupancy";

let root: Root | undefined;
let container: HTMLDivElement;
let visibility: DocumentVisibilityState;

const zeroRandom = () => 0;

function Probe() {
	usePublicOccupancy(zeroRandom);
	return null;
}

function StateProbe() {
	const value = usePublicOccupancy(zeroRandom);
	return (
		<div
			data-testid="state"
			data-origin={value.payload?.freshness ?? "none"}
			data-fetching={String(value.isFetching)}
		>
			{value.effectiveFreshness ?? "pending"}
		</div>
	);
}

function closedPayload(nextOpenAt: string | null) {
	return {
		schemaVersion: 1,
		freshness: "closed",
		timeZone: "Asia/Riyadh",
		nextOpenAt,
		computedAt: new Date().toISOString(),
		trend: null,
	};
}

function freshPayload() {
	const now = new Date();
	return {
		schemaVersion: 1,
		freshness: "fresh",
		timeZone: "Asia/Riyadh",
		band: "quiet",
		count: 8,
		percentFull: 8,
		lastUpdatedAt: now.toISOString(),
		freshUntil: new Date(now.getTime() + 90_000).toISOString(),
		source: "edge",
		computedAt: now.toISOString(),
		trend: null,
	};
}

async function flush() {
	await act(async () => {
		await Promise.resolve();
		await Promise.resolve();
		await Promise.resolve();
	});
}

beforeEach(() => {
	Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
	vi.useFakeTimers();
	visibility = "visible";
	Object.defineProperty(document, "visibilityState", {
		configurable: true,
		get: () => visibility,
	});
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});

afterEach(async () => {
	if (root) await act(async () => root?.unmount());
	container.remove();
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

describe("public occupancy polling controller", () => {
	it("jitter-polls only while visible, refetches once on return, and cancels on unmount", async () => {
		let requests = 0;
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				requests += 1;
				return new Response(
					JSON.stringify({
						schemaVersion: 1,
						freshness: "unavailable",
						computedAt: new Date().toISOString(),
						trend: null,
					}),
					{
						status: 200,
						headers: {
							"Content-Type": "application/json",
							"X-Fitway-Poll-Seconds": "60",
						},
					},
				);
			}),
		);
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
		await flush();
		expect(requests).toBe(1);
		await act(async () => vi.advanceTimersByTimeAsync(53_999));
		expect(requests).toBe(1);
		await act(async () => vi.advanceTimersByTimeAsync(1));
		await flush();
		expect(requests).toBe(2);

		visibility = "hidden";
		await act(async () =>
			document.dispatchEvent(new Event("visibilitychange")),
		);
		await act(async () => vi.advanceTimersByTimeAsync(120_000));
		expect(requests).toBe(2);
		visibility = "visible";
		await act(async () =>
			document.dispatchEvent(new Event("visibilitychange")),
		);
		await flush();
		expect(requests).toBe(3);

		await act(async () => root?.unmount());
		root = undefined;
		await act(async () => vi.advanceTimersByTimeAsync(120_000));
		expect(requests).toBe(3);
	});

	it("does not invent a fallback interval when the poll header is absent", async () => {
		let requests = 0;
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				requests += 1;
				return new Response(
					JSON.stringify({
						schemaVersion: 1,
						freshness: "unavailable",
						computedAt: new Date().toISOString(),
						trend: null,
					}),
					{ status: 200, headers: { "Content-Type": "application/json" } },
				);
			}),
		);
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
		await flush();
		await act(async () => vi.advanceTimersByTimeAsync(180_000));
		expect(requests).toBe(1);
	});

	it("expires closed at next-open, refetches once, and eventually renders open", async () => {
		vi.setSystemTime(new Date("2026-07-17T10:59:59.000Z"));
		const nextOpenAt = "2026-07-17T11:00:00.000Z";
		const cachedClosed = closedPayload(nextOpenAt);
		let requests = 0;
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				requests += 1;
				return new Response(
					JSON.stringify(requests < 3 ? cachedClosed : freshPayload()),
					{
						status: 200,
						headers: {
							"Content-Type": "application/json",
							"X-Fitway-Poll-Seconds": requests === 1 ? "60" : "1",
						},
					},
				);
			}),
		);
		const client = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});
		await act(async () => {
			root?.render(
				<QueryClientProvider client={client}>
					<StateProbe />
				</QueryClientProvider>,
			);
		});
		await act(async () => vi.advanceTimersByTimeAsync(1));
		await flush();
		expect(container.textContent).toBe("closed");
		await act(async () => vi.advanceTimersByTimeAsync(1_000));
		await flush();
		expect(requests).toBe(2);
		expect(container.textContent).toBe("unavailable");
		await act(async () => vi.advanceTimersByTimeAsync(900));
		await flush();
		await act(async () => vi.advanceTimersByTimeAsync(1));
		await flush();
		expect(requests).toBe(3);
		expect(container.firstElementChild?.getAttribute("data-origin")).toBe(
			"fresh",
		);
		expect(container.textContent).toBe("fresh");
	});

	it("preserves a valid closed state across polling errors", async () => {
		vi.setSystemTime(new Date("2026-07-17T10:59:00.000Z"));
		let requests = 0;
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				requests += 1;
				if (requests > 1) return new Response(null, { status: 503 });
				return new Response(
					JSON.stringify(closedPayload("2026-07-17T11:00:00.000Z")),
					{
						status: 200,
						headers: {
							"Content-Type": "application/json",
							"X-Fitway-Poll-Seconds": "1",
						},
					},
				);
			}),
		);
		const client = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});
		await act(async () => {
			root?.render(
				<QueryClientProvider client={client}>
					<StateProbe />
				</QueryClientProvider>,
			);
		});
		await act(async () => vi.advanceTimersByTimeAsync(0));
		await flush();
		await act(async () => vi.advanceTimersByTimeAsync(900));
		await flush();
		expect(requests).toBe(2);
		expect(container.textContent).toBe("closed");
	});

	it("does not create a boundary timer when every day is closed", async () => {
		vi.setSystemTime(new Date("2026-07-17T10:59:00.000Z"));
		let requests = 0;
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				requests += 1;
				return new Response(JSON.stringify(closedPayload(null)), {
					status: 200,
					headers: {
						"Content-Type": "application/json",
						"X-Fitway-Poll-Seconds": "1",
					},
				});
			}),
		);
		const client = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});
		await act(async () => {
			root?.render(
				<QueryClientProvider client={client}>
					<StateProbe />
				</QueryClientProvider>,
			);
		});
		await act(async () => vi.advanceTimersByTimeAsync(0));
		await flush();
		await act(async () => vi.advanceTimersByTimeAsync(899));
		expect(requests).toBe(1);
		await act(async () => vi.advanceTimersByTimeAsync(1));
		await flush();
		expect(requests).toBe(2);
		expect(container.textContent).toBe("closed");
	});
});
