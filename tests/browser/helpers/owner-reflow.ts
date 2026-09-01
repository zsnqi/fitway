import { expect, type Page } from "@playwright/test";

/**
 * Browser page zoom from a 1024px window to 200% leaves roughly 512 CSS pixels.
 * Resizing the CSS viewport exercises the responsive layout a real browser exposes;
 * `documentElement.style.zoom = 2` does not update media queries and is not browser
 * zoom, so it can manufacture overlap while a scroll-width-only assertion passes.
 */
export async function expectOwnerReflowAt200Percent(
	page: Page,
	headingSelector: string,
) {
	await page.setViewportSize({ width: 512, height: 900 });
	const heading = page.locator(headingSelector);
	await expect(heading).toBeVisible();

	const geometry = await page.evaluate((selector) => {
		const box = (element: Element | null) =>
			element?.getBoundingClientRect() ?? null;
		const rail = box(document.querySelector(".owner-rail"));
		const tabs = box(
			document.querySelector(".owner-section-switch > [role='tablist']"),
		);
		const title = box(document.querySelector(selector));
		return {
			viewport: window.innerWidth,
			documentOverflow:
				document.documentElement.scrollWidth -
				document.documentElement.clientWidth,
			bodyOverflow: document.body.scrollWidth - document.body.clientWidth,
			rail: rail && { top: rail.top, bottom: rail.bottom },
			tabs: tabs && { top: tabs.top, bottom: tabs.bottom },
			title: title && { left: title.left, right: title.right, top: title.top },
		};
	}, headingSelector);

	expect(geometry.documentOverflow).toBeLessThanOrEqual(0);
	expect(geometry.bodyOverflow).toBeLessThanOrEqual(0);
	expect(geometry.rail).not.toBeNull();
	expect(geometry.tabs).not.toBeNull();
	expect(geometry.title).not.toBeNull();
	if (!geometry.rail || !geometry.tabs || !geometry.title) return;
	expect(geometry.rail.bottom).toBeLessThanOrEqual(geometry.tabs.top);
	expect(geometry.tabs.bottom).toBeLessThanOrEqual(geometry.title.top);
	expect(geometry.title.left).toBeGreaterThanOrEqual(0);
	expect(geometry.title.right).toBeLessThanOrEqual(geometry.viewport);
}
