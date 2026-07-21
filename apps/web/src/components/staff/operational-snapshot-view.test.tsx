// @vitest-environment happy-dom

import type { OperationalSnapshot } from "@fitway/api/health/snapshot";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { I18nProvider } from "@/i18n/provider";

import { OperationalSnapshotView } from "./operational-snapshot-view";

const freshOccupancy = {
	schemaVersion: 2,
	freshness: "fresh",
	timeZone: "Asia/Riyadh",
	band: "moderate",
	count: 37,
	lastUpdatedAt: "2026-07-21T14:59:30.000Z",
	freshUntil: "2026-07-21T15:01:00.000Z",
	source: "edge",
	computedAt: "2026-07-21T15:00:00.000Z",
	trend: null,
} satisfies OperationalSnapshot["occupancy"];

const base: OperationalSnapshot = {
	schemaVersion: 1,
	computedAt: "2026-07-21T15:00:00.000Z",
	occupancy: freshOccupancy,
	capacity: 100,
	source: "edge",
	health: {
		freshness: "current",
		condition: "healthy",
		process: "ok",
		camera: "ok",
		feed: "ok",
		detectorFps: 7.5,
		edgeObservedAt: "2026-07-21T14:59:29.000Z",
		receivedAt: "2026-07-21T14:59:30.000Z",
		lastSeenAt: "2026-07-21T14:59:30.000Z",
		staleAt: "2026-07-21T15:04:30.000Z",
	},
};

let root: Root | undefined;
let container: HTMLDivElement;

async function render(snapshot: OperationalSnapshot) {
	await act(async () => {
		root?.render(
			<I18nProvider>
				<OperationalSnapshotView snapshot={snapshot} />
			</I18nProvider>,
		);
	});
}

beforeEach(() => {
	Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
	document.documentElement.lang = "en";
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});

afterEach(async () => {
	if (root) await act(async () => root?.unmount());
	container.remove();
	document.documentElement.lang = "";
});

describe("operational snapshot truth states", () => {
	it("labels stale values as last known and never calls them live", async () => {
		await render({
			...base,
			occupancy: { ...freshOccupancy, freshness: "stale" },
			health: { ...base.health, freshness: "stale" },
		});

		expect(container.textContent).toContain("Last-known reading");
		expect(container.textContent).toContain("These values are last known");
		expect(container.textContent).not.toContain("Live reading");
		expect(container.textContent).toContain("37");
	});

	it("removes occupancy values when unavailable while retaining authorized capacity", async () => {
		await render({
			...base,
			occupancy: {
				schemaVersion: 2,
				freshness: "unavailable",
				computedAt: base.computedAt,
				trend: null,
			},
			source: null,
			health: {
				freshness: "unavailable",
				condition: "unknown",
				process: null,
				camera: null,
				feed: null,
				detectorFps: null,
				edgeObservedAt: null,
				receivedAt: null,
				lastSeenAt: null,
				staleAt: null,
			},
		});

		expect(container.textContent).toContain("Occupancy unavailable");
		expect(container.textContent).not.toContain("37");
		expect(container.textContent).not.toContain("Moderate");
		expect(container.textContent).toContain("100");
		expect(container.textContent).toContain("Health freshness");
	});
});
