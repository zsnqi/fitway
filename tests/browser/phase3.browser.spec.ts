import { expect, test } from "@playwright/test";

test.use({ timezoneId: "America/New_York" });

function openPayload() {
	const now = new Date();
	return {
		schemaVersion: 1,
		freshness: "fresh",
		timeZone: "Asia/Riyadh",
		band: "quiet",
		count: 17,
		percentFull: 17,
		lastUpdatedAt: now.toISOString(),
		freshUntil: new Date(now.getTime() + 90_000).toISOString(),
		source: "edge",
		computedAt: now.toISOString(),
		trend: null,
	};
}

test("renders the Arabic closed state at 390px, formats in gym time, and toggles to English", async ({
	page,
}) => {
	await page.route("**/public/occupancy", (route) =>
		route.fulfill({
			json: {
				schemaVersion: 1,
				freshness: "closed",
				timeZone: "Asia/Riyadh",
				nextOpenAt: "2026-07-17T11:00:00.000Z",
				computedAt: "2026-07-16T23:00:00.000Z",
				trend: null,
			},
			headers: { "X-Fitway-Poll-Seconds": "60" },
		}),
	);
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/");
	await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
	await expect(page.getByRole("heading", { name: "مغلق الآن" })).toBeVisible();
	await expect(page.locator("main")).toContainText("2:00 م");
	await expect(page.locator("meter")).toHaveCount(0);
	await expect(page.locator("main")).not.toContainText(/17|%|هادئ/u);
	await page.getByRole("button", { name: /الإنجليزية/u }).click();
	await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
	await expect(page.locator("body")).toContainText("Closed now");
	await expect(page.locator("body")).toContainText("2:00 PM");
	const overflow = await page.evaluate(
		() =>
			document.documentElement.scrollWidth >
			document.documentElement.clientWidth,
	);
	expect(overflow).toBe(false);
});

test("expires cached closed honestly and transitions to open without reload", async ({
	page,
}) => {
	const now = Date.now();
	const closed = {
		schemaVersion: 1,
		freshness: "closed",
		timeZone: "Asia/Riyadh",
		nextOpenAt: new Date(now + 500).toISOString(),
		computedAt: new Date(now).toISOString(),
		trend: null,
	};
	let requests = 0;
	await page.route("**/public/occupancy", (route) => {
		requests += 1;
		return route.fulfill({
			json: requests < 3 ? closed : openPayload(),
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Expose-Headers": "X-Fitway-Poll-Seconds",
				"X-Fitway-Poll-Seconds": requests === 1 ? "60" : "1",
			},
		});
	});
	await page.goto("/");
	await expect(page.getByRole("heading", { name: "مغلق الآن" })).toBeVisible();
	await expect(page.locator("meter")).toHaveCount(0);
	await expect(page.locator("body")).toContainText("غير متاح", {
		timeout: 3_000,
	});
	await expect
		.poll(() => requests, { timeout: 4_000 })
		.toBeGreaterThanOrEqual(3);
	await expect(page.getByRole("heading", { name: "17" })).toBeVisible({
		timeout: 4_000,
	});
	await expect(page.locator("body")).toContainText("مفتوح الآن");
	expect(requests).toBeGreaterThanOrEqual(3);
});

test("shows the open badge without an open contract field", async ({
	page,
}) => {
	const payload = openPayload();
	expect(payload).not.toHaveProperty("open");
	await page.route("**/public/occupancy", (route) =>
		route.fulfill({
			json: payload,
			headers: { "X-Fitway-Poll-Seconds": "60" },
		}),
	);
	await page.goto("/");
	await expect(page.locator("body")).toContainText("مفتوح الآن");
});
