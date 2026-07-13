// @vitest-environment happy-dom

import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { localeConfig } from "@/i18n/locale";
import { I18nProvider } from "@/i18n/provider";
import { ClosedState } from "./closed-state";
import { OccupancyStatus } from "./occupancy-status";
import { PublicStatusSkeleton } from "./public-status-skeleton";
import { UnavailableState } from "./unavailable-state";

let root: Root | undefined;
let container: HTMLDivElement;

async function render(element: ReactNode) {
	root ??= createRoot(container);
	await act(async () => {
		root?.render(<I18nProvider>{element}</I18nProvider>);
	});
}

async function resetLocale(locale: "ar" | "en") {
	if (root) await act(async () => root?.unmount());
	root = undefined;
	document.documentElement.lang = locale;
	document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
}

beforeEach(() => {
	Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
	window.localStorage.clear();
	document.documentElement.lang = "ar";
	document.documentElement.dir = "rtl";
	container = document.createElement("div");
	document.body.append(container);
});

afterEach(async () => {
	if (root) {
		await act(async () => root?.unmount());
	}
	root = undefined;
	container.remove();
});

describe("public occupancy states", () => {
	it("renders an icon and localized unavailable label without live data", async () => {
		await render(<UnavailableState />);

		const status = container.querySelector('[role="status"]');
		expect(status?.querySelector("svg")).not.toBeNull();
		expect(status?.textContent).toContain(
			localeConfig.ar.messages.publicPage.unavailableTitle,
		);
		expect(container.querySelector('[role="meter"]')).toBeNull();
		expect(container.querySelector(".fw-occupancy-number")).toBeNull();
	});

	it("renders an accessible, visually hidden loading announcement", async () => {
		await render(<PublicStatusSkeleton />);

		const busyRegion = container.querySelector('[aria-busy="true"]');
		const loadingStatus = container.querySelector('[role="status"]');
		expect(busyRegion).not.toBeNull();
		expect(busyRegion?.querySelector('[aria-hidden="true"]')).not.toBeNull();
		expect(loadingStatus?.textContent).toContain(
			localeConfig.ar.messages.publicPage.loading,
		);
	});

	it("gives the occupancy meter a localized programmatic name", async () => {
		await resetLocale("en");
		await render(
			<OccupancyStatus
				payload={{
					schemaVersion: 1,
					freshness: "fresh",
					timeZone: "Asia/Riyadh",
					band: "quiet",
					count: 2,
					percentFull: 2,
					lastUpdatedAt: "2026-07-13T12:00:00.000Z",
					freshUntil: "2026-07-13T12:01:30.000Z",
					source: "edge",
					computedAt: "2026-07-13T12:00:01.000Z",
					trend: null,
				}}
				freshness="fresh"
				now={new Date("2026-07-13T12:00:30.000Z")}
			/>,
		);

		expect(container.querySelector("meter")?.getAttribute("aria-label")).toBe(
			"Occupancy level",
		);
	});

	it("formats last-updated in the payload timezone instead of the host zone", async () => {
		await resetLocale("en");
		await render(
			<OccupancyStatus
				payload={{
					schemaVersion: 1,
					freshness: "fresh",
					timeZone: "Pacific/Auckland",
					band: "quiet",
					count: 2,
					percentFull: 2,
					lastUpdatedAt: "2026-07-17T21:00:00.000Z",
					freshUntil: "2026-07-17T21:01:30.000Z",
					source: "edge",
					computedAt: "2026-07-17T21:00:01.000Z",
					trend: null,
				}}
				freshness="fresh"
				now={new Date("2026-07-17T21:00:30.000Z")}
			/>,
		);
		expect(container.textContent).toContain("9:00 AM");
	});

	it("renders a timezone-aware closed state in both locales without occupancy details", async () => {
		const payload = {
			schemaVersion: 1 as const,
			freshness: "closed" as const,
			timeZone: "Pacific/Auckland",
			nextOpenAt: "2026-07-17T21:00:00.000Z",
			computedAt: "2026-07-17T20:00:00.000Z",
			trend: null,
		};
		for (const locale of ["ar", "en"] as const) {
			await resetLocale(locale);
			await render(<ClosedState payload={payload} />);
			expect(container.textContent).toContain(
				localeConfig[locale].messages.publicPage.closedTitle,
			);
			expect(container.textContent).toContain("9:00");
			expect(container.textContent).toContain(locale === "ar" ? "ص" : "AM");
			expect(container.textContent).not.toMatch(/[٠-٩]/u);
			expect(container.querySelector("meter")).toBeNull();
			expect(container.textContent).not.toContain("% ");
			expect(container.querySelector('[role="status"] svg')).not.toBeNull();
		}
	});

	it("does not invent an opening time for an all-days-closed payload", async () => {
		await render(
			<ClosedState
				payload={{
					schemaVersion: 1,
					freshness: "closed",
					timeZone: "Asia/Riyadh",
					nextOpenAt: null,
					computedAt: "2026-07-17T20:00:00.000Z",
					trend: null,
				}}
			/>,
		);
		expect(container.textContent).toContain(
			localeConfig.ar.messages.publicPage.closedTitle,
		);
		expect(container.textContent).not.toContain("يفتح");
	});

	it("renders approximate count, capped accessible meter, icon label and fresh summary", async () => {
		const payload = {
			schemaVersion: 1 as const,
			freshness: "fresh" as const,
			timeZone: "Asia/Riyadh",
			band: "packed" as const,
			count: 150,
			percentFull: 100,
			lastUpdatedAt: "2026-07-13T12:00:00.000Z",
			freshUntil: "2026-07-13T12:01:30.000Z",
			source: "edge" as const,
			computedAt: "2026-07-13T12:00:01.000Z",
			trend: null,
		};
		await render(
			<OccupancyStatus
				payload={payload}
				freshness="fresh"
				now={new Date("2026-07-13T12:00:30.000Z")}
			/>,
		);
		const meter = container.querySelector("meter");
		expect(container.textContent).toContain("حوالي");
		expect(container.textContent).toContain("ممتلئ جدًا");
		expect(container.textContent).toContain(
			localeConfig.ar.messages.publicPage.open,
		);
		expect(meter?.getAttribute("value")).toBe("100");
		expect(meter?.getAttribute("aria-valuetext")).toContain("100");
		expect(container.querySelector(".tabular-nums")).not.toBeNull();
		expect(
			container.querySelector('[aria-live="polite"]')?.textContent,
		).not.toBe("");
		await render(
			<OccupancyStatus
				payload={payload}
				freshness="fresh"
				now={new Date("2026-07-13T12:00:45.000Z")}
			/>,
		);
		expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe(
			"",
		);
	});

	it("retains count but adds explicit last-known warning when stale", async () => {
		await render(
			<OccupancyStatus
				payload={{
					schemaVersion: 1,
					freshness: "stale",
					timeZone: "Asia/Riyadh",
					band: "quiet",
					count: 4,
					percentFull: 4,
					lastUpdatedAt: "2026-07-13T12:00:00.000Z",
					freshUntil: "2026-07-13T12:01:30.000Z",
					source: "edge",
					computedAt: "2026-07-13T12:02:00.000Z",
					trend: null,
				}}
				freshness="stale"
				now={new Date("2026-07-13T12:02:00.000Z")}
			/>,
		);
		expect(container.textContent).toContain("آخر عدد معروف");
		expect(container.textContent).toContain("التحديثات المباشرة متأخرة");
	});

	it("covers loading, unavailable, every fresh band, and stale in both locales", async () => {
		for (const locale of ["ar", "en"] as const) {
			await resetLocale(locale);
			await render(<PublicStatusSkeleton />);
			expect(container.textContent).toContain(
				localeConfig[locale].messages.publicPage.loading,
			);
			await resetLocale(locale);
			await render(<UnavailableState />);
			expect(container.textContent).toContain(
				localeConfig[locale].messages.publicPage.unavailableTitle,
			);
			for (const band of ["quiet", "moderate", "busy", "packed"] as const) {
				await resetLocale(locale);
				await render(
					<OccupancyStatus
						payload={{
							schemaVersion: 1,
							freshness: "fresh",
							timeZone: "Asia/Riyadh",
							band,
							count: 20,
							percentFull: 20,
							lastUpdatedAt: "2026-07-13T12:00:00.000Z",
							freshUntil: "2026-07-13T12:01:30.000Z",
							source: "edge",
							computedAt: "2026-07-13T12:00:01.000Z",
							trend: null,
						}}
						freshness="fresh"
						now={new Date("2026-07-13T12:00:30.000Z")}
					/>,
				);
				expect(container.textContent).toContain(
					localeConfig[locale].messages.publicPage.bands[band],
				);
			}
			await resetLocale(locale);
			await render(
				<OccupancyStatus
					payload={{
						schemaVersion: 1,
						freshness: "stale",
						timeZone: "Asia/Riyadh",
						band: "quiet",
						count: 20,
						percentFull: 20,
						lastUpdatedAt: "2026-07-13T12:00:00.000Z",
						freshUntil: "2026-07-13T12:01:30.000Z",
						source: "edge",
						computedAt: "2026-07-13T12:02:00.000Z",
						trend: null,
					}}
					freshness="stale"
					now={new Date("2026-07-13T12:02:00.000Z")}
				/>,
			);
			expect(container.textContent).toContain(
				localeConfig[locale].messages.publicPage.lastKnown,
			);
		}
	});
});
