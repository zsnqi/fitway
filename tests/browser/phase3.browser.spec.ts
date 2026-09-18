import { expect, test } from "@playwright/test";

test.use({ timezoneId: "America/New_York" });

function openPayload(base: Date = new Date()) {
	const now = base;
	return {
		schemaVersion: 2,
		freshness: "fresh",
		timeZone: "Asia/Riyadh",
		band: "quiet",
		count: 17,
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
	await page.clock.setFixedTime(new Date("2026-07-16T23:00:00.000Z"));
	await page.route("**/public/occupancy", (route) =>
		route.fulfill({
			json: {
				schemaVersion: 2,
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
	// The page clock is installed and paused so the 1500ms closed window is
	// anchored to the page's own timeline: navigation and hydration cannot
	// consume it, and the boundary and poll timers are fired by fastForward.
	// The paused instant sits slightly ahead of the install moment because the
	// installed clock keeps ticking in real time until pauseAt lands.
	const base = new Date(Date.now() + 60_000);
	await page.clock.install();
	await page.clock.pauseAt(base);
	const closed = {
		schemaVersion: 2,
		freshness: "closed",
		timeZone: "Asia/Riyadh",
		nextOpenAt: new Date(base.getTime() + 1_500).toISOString(),
		computedAt: base.toISOString(),
		trend: null,
	};
	let requests = 0;
	await page.route("**/public/occupancy", (route) => {
		requests += 1;
		return route.fulfill({
			json: requests < 3 ? closed : openPayload(base),
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Expose-Headers": "X-Fitway-Poll-Seconds",
				"X-Fitway-Poll-Seconds": requests === 1 ? "60" : "1",
			},
		});
	});
	await page.goto("/");
	// react-query delivers its cache notifications through setTimeout(0), which
	// the installed clock owns: each poll step flushes the timer queue so the
	// closed payload arrives and renders no matter how slow the machine is.
	await expect
		.poll(async () => {
			await page.clock.fastForward(1);
			return page.getByRole("heading", { name: "مغلق الآن" }).isVisible();
		})
		.toBe(true);
	await expect(page.locator("meter")).toHaveCount(0);
	await page.clock.fastForward(1_500);
	await expect(page.locator("body")).toContainText("غير متاح", {
		timeout: 3_000,
	});
	await expect
		.poll(
			async () => {
				// The jittered poll timer (900–1100ms) is only armed once the
				// expiry refetch settles, so each poll step advances the fake
				// clock past its maximum delay until the refetch fires.
				await page.clock.fastForward(1_100);
				return requests;
			},
			{ timeout: 4_000 },
		)
		.toBeGreaterThanOrEqual(3);
	await expect
		.poll(
			async () => {
				await page.clock.fastForward(1);
				return page.getByRole("heading", { name: "هادئ" }).isVisible();
			},
			{ timeout: 4_000 },
		)
		.toBe(true);
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
