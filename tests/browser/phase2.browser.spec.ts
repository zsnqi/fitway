import { expect, test } from "@playwright/test";

function usablePayload(
	freshUntil: string,
	freshness: "fresh" | "stale" = "fresh",
	stamps: { lastUpdatedAt: string; computedAt: string } = {
		lastUpdatedAt: new Date().toISOString(),
		computedAt: new Date().toISOString(),
	},
) {
	return {
		schemaVersion: 2,
		freshness,
		timeZone: "Asia/Riyadh",
		band: "moderate",
		count: 37,
		lastUpdatedAt: stamps.lastUpdatedAt,
		freshUntil,
		source: "edge",
		computedAt: stamps.computedAt,
		trend: null,
	};
}

test("renders unavailable without a count or meter", async ({ page }) => {
	await page.route("**/public/occupancy", (route) =>
		route.fulfill({
			json: {
				schemaVersion: 2,
				freshness: "unavailable",
				computedAt: new Date().toISOString(),
				trend: null,
			},
			headers: { "X-Fitway-Poll-Seconds": "60" },
		}),
	);
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/");
	await expect(page.getByRole("status")).toContainText("غير متاح");
	await expect(page.locator("meter")).toHaveCount(0);
	await expect(page.getByRole("heading")).not.toContainText(/\d/u);
});

test("renders localized live status and changes direction without overflow", async ({
	page,
}) => {
	await page.route("**/public/occupancy", (route) =>
		route.fulfill({
			json: usablePayload(new Date(Date.now() + 90_000).toISOString()),
			headers: { "X-Fitway-Poll-Seconds": "60" },
		}),
	);
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/");
	await expect(page.getByRole("heading", { name: "متوسط" })).toBeVisible();
	await expect(page.locator(".public-live__count-value")).toHaveText("37");
	await expect(
		page.getByRole("img", { name: /مستوى الازدحام: متوسط/u }),
	).toBeVisible();
	await expect(page.locator("meter")).toHaveCount(0);
	await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
	await expect(page.locator("body")).toContainText("العدد التقريبي");
	await expect(page.locator("body")).not.toContainText("%");
	await page.getByRole("button", { name: /الإنجليزية/u }).click();
	await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
	await expect(page.locator("body")).toContainText("Approximate count");
	const overflow = await page.evaluate(
		() =>
			document.documentElement.scrollWidth >
			document.documentElement.clientWidth,
	);
	expect(overflow).toBe(false);
});

test("locally expires cached fresh JSON without another request", async ({
	page,
}) => {
	// The page clock is installed and paused so the 500ms fresh window is
	// anchored to the page's own timeline: hydration cannot consume it, and the
	// local expiry timer is fired by fastForward instead of wall-clock luck.
	// The paused instant sits slightly ahead of the install moment because the
	// installed clock keeps ticking in real time until pauseAt lands.
	const base = new Date(Date.now() + 60_000);
	await page.clock.install();
	await page.clock.pauseAt(base);
	let requests = 0;
	await page.route("**/public/occupancy", (route) => {
		requests += 1;
		return route.fulfill({
			json: usablePayload(
				new Date(base.getTime() + 500).toISOString(),
				"fresh",
				{
					lastUpdatedAt: base.toISOString(),
					computedAt: base.toISOString(),
				},
			),
			headers: { "X-Fitway-Poll-Seconds": "60" },
		});
	});
	await page.goto("/");
	// react-query delivers its cache notifications through setTimeout(0), which
	// the installed clock owns: each poll step flushes the timer queue so the
	// response arrives and renders no matter how slow the machine is.
	await expect
		.poll(async () => {
			await page.clock.fastForward(0);
			return page.locator("body").textContent();
		})
		.toContain("تحديث مباشر");
	await page.clock.fastForward(500);
	await expect(page.locator("body")).toContainText("آخر عدد تقريبي معروف", {
		timeout: 3_000,
	});
	expect(requests).toBe(1);
});
