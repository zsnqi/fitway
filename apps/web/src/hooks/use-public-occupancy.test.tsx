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
});
