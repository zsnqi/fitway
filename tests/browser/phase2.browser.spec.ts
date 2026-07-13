import { expect, test } from "@playwright/test";

function usablePayload(
	freshUntil: string,
	freshness: "fresh" | "stale" = "fresh",
) {
	const now = new Date();
	return {
		schemaVersion: 1,
		freshness,
		band: "moderate",
		count: 37,
		percentFull: 37,
		lastUpdatedAt: now.toISOString(),
		freshUntil,
		source: "edge",
		computedAt: now.toISOString(),
		trend: null,
	};
}

test("renders unavailable without a count or meter", async ({ page }) => {
	await page.route("**/public/occupancy", (route) =>
		route.fulfill({
			json: {
				schemaVersion: 1,
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
	await expect(page.getByRole("heading", { name: "37" })).toBeVisible();
	await expect(page.locator("meter")).toHaveAttribute("value", "37");
	await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
	await expect(page.locator("body")).toContainText("حوالي");
	await page.getByRole("button", { name: /الإنجليزية/u }).click();
	await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
	await expect(page.locator("body")).toContainText("Around");
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
	let requests = 0;
	await page.route("**/public/occupancy", (route) => {
		requests += 1;
		return route.fulfill({
			json: usablePayload(new Date(Date.now() + 500).toISOString()),
			headers: { "X-Fitway-Poll-Seconds": "60" },
		});
	});
	await page.goto("/");
	await expect(page.locator("body")).toContainText("تحديث مباشر");
	await expect(page.locator("body")).toContainText("آخر عدد معروف", {
		timeout: 3_000,
	});
	expect(requests).toBe(1);
});
