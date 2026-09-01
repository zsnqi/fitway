// @vitest-environment happy-dom

import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { localeConfig } from "@/i18n/locale";
import { I18nProvider } from "@/i18n/provider";
import { ClosedState } from "./closed-state";
import { OccupancyStatus } from "./occupancy-status";
import { PublicErrorState } from "./public-error-state";
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
	it("renders the localized unavailable state without live data", async () => {
		await render(<UnavailableState />);

		const status = container.querySelector('[role="status"]');
		expect(status?.textContent).toContain(
			localeConfig.ar.messages.publicPage.unavailableStatus,
		);
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

	it("gives the qualitative crowd scale a localized programmatic name", async () => {
		await resetLocale("en");
		await render(
			<OccupancyStatus
				payload={{
					schemaVersion: 2,
					freshness: "fresh",
					timeZone: "Asia/Riyadh",
					band: "quiet",
					count: 2,
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

		expect(
			container.querySelector('[role="img"]')?.getAttribute("aria-label"),
		).toContain("Crowd level: Quiet");
		expect(container.querySelectorAll(".public-live__signal-bar")).toHaveLength(
			28,
		);
		expect(container.querySelector("meter")).toBeNull();
		expect(container.textContent).not.toContain("%");
	});

	it("offers a keyboard-native retry action for transport errors", async () => {
		let retries = 0;
		await render(<PublicErrorState onRetry={() => retries++} />);
		const retry = container.querySelector("button");
		expect(container.querySelector('[role="alert"]')).not.toBeNull();
		expect(retry?.textContent).toContain(
			localeConfig.ar.messages.publicPage.retry,
		);
		await act(async () => retry?.click());
		expect(retries).toBe(1);
	});

	it("builds loading placeholders from the live card slots", async () => {
		await render(<PublicStatusSkeleton />);
		expect(
			container.querySelector(".public-live__status-block"),
		).not.toBeNull();
		expect(
			container.querySelector(".public-live__metric--count"),
		).not.toBeNull();
		expect(
			container.querySelector(".public-live__metric--band"),
		).not.toBeNull();
		expect(container.querySelectorAll(".public-live__signal-bar")).toHaveLength(
			28,
		);
		expect(
			container.querySelectorAll(
				'.public-live__signal-bar[data-state="skeleton"]',
			),
		).toHaveLength(28);
		expect(container.querySelectorAll("h1")).toHaveLength(1);
	});

	it("formats last-updated in the payload timezone instead of the host zone", async () => {
		await resetLocale("en");
		await render(
			<OccupancyStatus
				payload={{
					schemaVersion: 2,
					freshness: "fresh",
					timeZone: "Pacific/Auckland",
					band: "quiet",
					count: 2,
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
			schemaVersion: 2 as const,
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
			expect(
				container.querySelector(
					'.public-state-card__status > [aria-hidden="true"]',
				),
			).not.toBeNull();
		}
	});

	it("does not invent an opening time for an all-days-closed payload", async () => {
		await render(
			<ClosedState
				payload={{
					schemaVersion: 2,
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

	it("renders approximate count, qualitative band scale, icon label and fresh summary", async () => {
		const payload = {
			schemaVersion: 2 as const,
			freshness: "fresh" as const,
			timeZone: "Asia/Riyadh",
			band: "packed" as const,
			count: 150,
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
		expect(container.textContent).toContain(
			localeConfig.ar.messages.publicPage.approximateCount,
		);
		expect(container.textContent).toContain("ممتلئ جدًا");
		expect(container.textContent).toContain(
			localeConfig.ar.messages.publicPage.open,
		);
		expect(container.querySelector("meter")).toBeNull();
		expect(
			container.querySelector('[role="img"]')?.getAttribute("aria-label"),
		).toContain("ممتلئ جدًا");
		expect(container.textContent).not.toContain("%");
		expect(container.querySelector(".public-live__count-value")).not.toBeNull();
		expect(
			container.querySelector("h1.public-live__band-value"),
		).not.toBeNull();
		expect(container.querySelector("h1.public-live__count-value")).toBeNull();
		expect(
			container
				.querySelector(".public-live__open-dot")
				?.getAttribute("aria-hidden"),
		).toBe("true");
		expect(container.querySelector(".public-live__open-status svg")).toBeNull();
		expect(
			container.querySelectorAll(
				'.public-live__signal-bar[data-state="current"]',
			),
		).toHaveLength(9);
		expect(
			container.querySelectorAll(
				'.public-live__signal-bar[data-state="complete"]',
			),
		).toHaveLength(19);
		expect(
			container.querySelector(
				'.public-live__signal-bar:nth-child(28)[data-current-cap="true"]',
			),
		).not.toBeNull();
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
					schemaVersion: 2,
					freshness: "stale",
					timeZone: "Asia/Riyadh",
					band: "quiet",
					count: 4,
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
		expect(container.textContent).toContain("آخر عدد تقريبي معروف");
		expect(container.textContent).toContain("التحديثات المباشرة متأخرة");
		expect(container.textContent).toContain("آخر تحديث معروف");
		expect(container.querySelectorAll(".public-live__freshness")).toHaveLength(
			1,
		);
		expect(
			container.querySelectorAll(".public-live__stale-warning"),
		).toHaveLength(1);
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
			for (const [band, completeCount, currentCount, inactiveCount, cap] of [
				["quiet", 0, 6, 22, 6],
				["moderate", 6, 5, 17, 11],
				["busy", 11, 8, 9, 19],
				["packed", 19, 9, 0, 28],
			] as const) {
				await resetLocale(locale);
				await render(
					<OccupancyStatus
						payload={{
							schemaVersion: 2,
							freshness: "fresh",
							timeZone: "Asia/Riyadh",
							band,
							count: 20,
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
				expect(
					container.querySelectorAll(
						'.public-live__signal-bar[data-state="complete"]',
					),
				).toHaveLength(completeCount);
				expect(
					container.querySelectorAll(
						'.public-live__signal-bar[data-state="current"]',
					),
				).toHaveLength(currentCount);
				expect(
					container.querySelectorAll(
						'.public-live__signal-bar[data-state="inactive"]',
					),
				).toHaveLength(inactiveCount);
				expect(
					container.querySelector(
						`.public-live__signal-bar:nth-child(${cap})[data-current-cap="true"]`,
					),
				).not.toBeNull();
				expect(
					container.querySelectorAll(
						'.public-live__signal-bar[data-current-cap="true"]',
					),
				).toHaveLength(1);
			}
			await resetLocale(locale);
			await render(
				<OccupancyStatus
					payload={{
						schemaVersion: 2,
						freshness: "stale",
						timeZone: "Asia/Riyadh",
						band: "quiet",
						count: 20,
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
			expect(
				container.querySelectorAll(".public-live__freshness"),
			).toHaveLength(1);
			expect(
				container.querySelectorAll(".public-live__stale-warning"),
			).toHaveLength(1);
		}
	});
});
