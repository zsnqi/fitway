import { mkdir } from "node:fs/promises";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const ownerAuth = {
	principalId: "00000000-0000-4000-8000-000000000091",
	principalKind: "owner",
	role: "owner",
	sessionId: "00000000-0000-4000-8000-000000000092",
	expiresAt: "2026-08-22T00:00:00.000Z",
	active: true,
} as const;

const mixedDaily = {
	businessDay: "2026-07-21",
	timeline: [
		{
			state: "closed",
			minuteStartUtc: "2026-07-21T06:59:00.000Z",
			count: null,
			settingsVersion: 11,
		},
		{
			state: "value",
			minuteStartUtc: "2026-07-21T07:00:00.000Z",
			count: 0,
			entries: 2,
			exits: 0,
			band: "quiet",
			capacitySnapshot: 100,
			settingsVersion: 11,
			source: "live",
		},
		{
			state: "value",
			minuteStartUtc: "2026-07-21T07:01:00.000Z",
			count: 8,
			entries: 8,
			exits: 0,
			band: "quiet",
			capacitySnapshot: 100,
			settingsVersion: 11,
			source: "live",
		},
		{
			state: "missing",
			minuteStartUtc: "2026-07-21T07:02:00.000Z",
			count: null,
			settingsVersion: 11,
		},
		{
			state: "value",
			minuteStartUtc: "2026-07-21T07:03:00.000Z",
			count: 18,
			entries: 10,
			exits: 0,
			band: "quiet",
			capacitySnapshot: 100,
			settingsVersion: 11,
			source: "backfill",
		},
		{
			state: "value",
			minuteStartUtc: "2026-07-21T07:04:00.000Z",
			count: 31,
			entries: 13,
			exits: 0,
			band: "moderate",
			capacitySnapshot: 100,
			settingsVersion: 12,
			source: "live",
		},
		{
			state: "value",
			minuteStartUtc: "2026-07-21T07:05:00.000Z",
			count: 46,
			entries: 15,
			exits: 0,
			band: "moderate",
			capacitySnapshot: 100,
			settingsVersion: 12,
			source: "live",
		},
		{
			state: "missing",
			minuteStartUtc: "2026-07-21T07:06:00.000Z",
			count: null,
			settingsVersion: 12,
		},
		{
			state: "value",
			minuteStartUtc: "2026-07-21T07:07:00.000Z",
			count: 57,
			entries: 11,
			exits: 0,
			band: "busy",
			capacitySnapshot: 100,
			settingsVersion: 12,
			source: "manual",
		},
		{
			state: "closed",
			minuteStartUtc: "2026-07-21T07:08:00.000Z",
			count: null,
			settingsVersion: 12,
		},
	],
	peak: {
		minuteStartUtc: "2026-07-21T07:07:00.000Z",
		count: 57,
		band: "busy",
		capacitySnapshot: 100,
		settingsVersion: 12,
	},
	dailyAverage: 160 / 6,
	estimatedEntranceCrossings: 59,
	observedOpenMinutes: 6,
	expectedOpenMinutes: 8,
	coverage: 0.75,
} as const;

const timeContext = {
	current: { settingsVersion: 12, timeZone: "Europe/London" },
	versions: [
		{ settingsVersion: 11, timeZone: "Asia/Riyadh" },
		{ settingsVersion: 12, timeZone: "America/New_York" },
	],
} as const;

function rpcError(status: number, code: string, message: string) {
	return { json: null, error: { json: { status, code, message, data: null } } };
}

async function captureReview(page: Page, name: string) {
	const reviewDirectory = process.env.FITWAY_PLAYWRIGHT_REVIEW_DIR;
	if (!reviewDirectory)
		throw new Error("FITWAY_PLAYWRIGHT_REVIEW_DIR is required");
	await mkdir(reviewDirectory, { recursive: true });
	await page.screenshot({
		path: path.join(reviewDirectory, name),
		fullPage: true,
	});
}

async function mockOwnerAnalytics(
	page: Page,
	daily: unknown = mixedDaily,
	context: unknown = timeContext,
) {
	await page.route("**/rpc/admin/session", (route) =>
		route.fulfill({ status: 200, json: { json: ownerAuth } }),
	);
	await page.route("**/rpc/admin/analytics/daily", (route) =>
		route.fulfill({ status: 200, json: { json: daily } }),
	);
	await page.route("**/rpc/admin/analytics/timeContext", async (route) => {
		expect(route.request().postDataJSON()).toEqual({
			json: { settingsVersions: [11, 12] },
		});
		await route.fulfill({ status: 200, json: { json: context } });
	});
}

function seriousViolations(
	results: Awaited<ReturnType<AxeBuilder["analyze"]>>,
) {
	return results.violations.filter(
		({ impact }) => impact === "serious" || impact === "critical",
	);
}

test("owner curve preserves exact states, historical timezones, and RTL/LTR interaction parity", async ({
	page,
}) => {
	await mockOwnerAnalytics(page);
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/admin");
	await expect(
		page.getByRole("heading", { name: "التحليلات اليومية" }),
	).toBeVisible();
	await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
	await expect(
		page.getByText("تقدير لمرات الدخول، وليس لعدد الأعضاء الفريدين"),
	).toBeVisible();
	await expect(page.locator(".owner-chart__missing")).toHaveCount(2);
	await expect(page.locator(".owner-chart__closed")).toHaveCount(2);
	await expect(page.locator(".owner-chart__zero")).toHaveCount(1);
	await expect(page.getByText("تغطية الرصد")).toHaveCount(0);
	await expect(page.locator("body")).not.toContainText(/[٠-٩]/u);

	const chart = page.locator("[data-owner-chart]");
	await expect(chart).toBeVisible();
	const rtlX = Number(
		await page.locator(".owner-chart__active").getAttribute("cx"),
	);
	expect(rtlX).toBeLessThan(600);
	await chart.focus();
	await expect(chart).toBeFocused();
	await page.keyboard.press("ArrowRight");
	await expect(page.locator("[data-active-reading]")).toContainText("46");
	const chartBox = await chart.boundingBox();
	if (!chartBox) throw new Error("Owner chart has no bounding box");
	await chart.hover({
		position: { x: chartBox.width / 2, y: chartBox.height / 2 },
	});
	await expect(page.locator("[data-active-reading]")).toContainText("18");
	await chart.dispatchEvent("pointerdown", {
		pointerType: "touch",
		pointerId: 7,
		isPrimary: true,
		buttons: 1,
		clientX: chartBox.x + 12,
		clientY: chartBox.y + chartBox.height / 2,
	});
	await expect(page.locator("[data-active-reading]")).toContainText("57");
	const rtlSelectedX = Number(
		await page.locator(".owner-chart__active").getAttribute("cx"),
	);

	await page.locator("summary").click();
	await expect(
		page.getByRole("region", { name: "بيانات التحليلات لكل دقيقة" }),
	).toBeVisible();
	await captureReview(page, "owner-analytics-ar-1440.png");

	await page
		.getByRole("button", { name: "التبديل إلى اللغة الإنجليزية" })
		.click();
	await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
	await expect(
		page.getByRole("heading", { name: "Daily analytics" }),
	).toBeVisible();
	const ltrX = Number(
		await page.locator(".owner-chart__active").getAttribute("cx"),
	);
	expect(ltrX).toBeGreaterThan(600);
	expect(Math.abs(rtlSelectedX + ltrX - 1200)).toBeLessThan(1);
	await expect(page.getByText("10:00 AM").first()).toBeVisible();
	await expect(page.getByText("3:04 AM").first()).toBeVisible();
	await chart.focus();
	await page.keyboard.press("Home");
	await page.keyboard.press("ArrowRight");
	await expect(page.locator("[data-active-reading]")).toContainText("8");
	await captureReview(page, "owner-analytics-en-1440.png");
});

test("both locales recompose without page overflow at every required width and pass axe", async ({
	page,
}) => {
	await mockOwnerAnalytics(page);
	await page.goto("/admin");
	const widths = [320, 360, 390, 721, 768, 820, 1024, 1200, 1440];
	for (const locale of ["ar", "en"] as const) {
		if (locale === "en") {
			await page
				.getByRole("button", { name: "التبديل إلى اللغة الإنجليزية" })
				.click();
		}
		for (const width of widths) {
			await page.setViewportSize({ width, height: width <= 390 ? 844 : 900 });
			await expect(page.locator("[data-owner-chart]")).toBeVisible();
			const overflow = await page.evaluate(
				() =>
					document.documentElement.scrollWidth >
					document.documentElement.clientWidth,
			);
			expect(overflow, `${locale} document overflow at ${width}px`).toBe(false);
			if ([390, 768, 1440].includes(width)) {
				await captureReview(page, `owner-analytics-${locale}-${width}.png`);
			}
		}
		const results = await new AxeBuilder({ page }).analyze();
		expect(seriousViolations(results)).toEqual([]);
	}
});

test("loading, transport error, missing-only, and scheduled-closed days stay distinct", async ({
	page,
}) => {
	await page.route("**/rpc/admin/session", (route) =>
		route.fulfill({ status: 200, json: { json: ownerAuth } }),
	);
	let mode: "error" | "missing" | "closed" = "error";
	await page.route("**/rpc/admin/analytics/daily", async (route) => {
		if (mode === "error") {
			await new Promise((resolve) => setTimeout(resolve, 500));
			await route.fulfill({
				status: 503,
				json: rpcError(503, "SERVICE_UNAVAILABLE", "Service Unavailable"),
			});
			return;
		}
		const state = mode === "missing" ? "missing" : "closed";
		await route.fulfill({
			status: 200,
			json: {
				json: {
					...mixedDaily,
					timeline: [
						{
							state,
							minuteStartUtc: "2026-07-21T07:00:00.000Z",
							count: null,
							settingsVersion: 11,
						},
					],
					peak: null,
					dailyAverage: null,
					estimatedEntranceCrossings: 0,
					observedOpenMinutes: 0,
					expectedOpenMinutes: mode === "missing" ? 1 : 0,
					coverage: mode === "missing" ? 0 : null,
				},
			},
		});
	});
	await page.route("**/rpc/admin/analytics/timeContext", (route) =>
		route.fulfill({
			status: 200,
			json: {
				json: {
					current: timeContext.current,
					versions: [timeContext.versions[0]],
				},
			},
		}),
	);

	await page.goto("/admin");
	await expect(page.getByRole("status")).toContainText(
		"جارٍ تحميل تحليلات المالك",
	);
	await expect(
		page.getByRole("heading", {
			level: 1,
			name: "جارٍ تحميل تحليلات المالك",
		}),
	).toBeVisible();
	await expect(page.locator("main h1:visible")).toHaveCount(1);
	await captureReview(page, "owner-analytics-loading-ar-1440.png");
	await page.evaluate(() => document.fonts.ready);
	await expect(page).toHaveScreenshot(
		"owner-daily-loading-route-ar-desktop-1440x900.png",
		{ fullPage: true },
	);
	await expect(page.getByRole("alert")).toContainText("تعذر تحميل التحليلات");
	await expect(
		page.getByRole("heading", { level: 1, name: "تعذر تحميل التحليلات" }),
	).toBeVisible();
	await expect(page.locator("main h1:visible")).toHaveCount(1);
	await expect(page.getByText("لا توجد بيانات إشغال مرصودة")).toHaveCount(0);
	await captureReview(page, "owner-analytics-error-ar-1440.png");
	await page.evaluate(() => document.fonts.ready);
	await expect(page).toHaveScreenshot(
		"owner-daily-error-route-ar-desktop-1440x900.png",
		{ fullPage: true },
	);

	mode = "missing";
	await page.getByRole("button", { name: "إعادة المحاولة" }).click();
	await expect(page.getByText("لا توجد بيانات إشغال مرصودة")).toBeVisible();
	await captureReview(page, "owner-analytics-no-observed-ar-1440.png");

	mode = "closed";
	await page.reload();
	await expect(page.getByText("يوم إغلاق مجدول")).toBeVisible();
	await expect(page.getByText("لا توجد بيانات إشغال مرصودة")).toHaveCount(0);
	await captureReview(page, "owner-analytics-closed-ar-1440.png");
});

test("strict mapping failures render an error and auth keeps anonymous and staff out", async ({
	page,
}) => {
	await page.route("**/rpc/admin/session", (route) =>
		route.fulfill({ status: 200, json: { json: ownerAuth } }),
	);
	await page.route("**/rpc/admin/analytics/daily", (route) =>
		route.fulfill({ status: 200, json: { json: mixedDaily } }),
	);
	await page.route("**/rpc/admin/analytics/timeContext", (route) =>
		route.fulfill({
			status: 200,
			json: {
				json: {
					current: timeContext.current,
					versions: [timeContext.versions[0]],
				},
			},
		}),
	);
	await page.goto("/admin");
	await expect(page.getByRole("alert")).toContainText("تعذر تحميل التحليلات");

	await page.unroute("**/rpc/admin/session");
	await page.route("**/rpc/admin/session", (route) =>
		route.fulfill({
			status: 403,
			json: rpcError(403, "FORBIDDEN", "Forbidden"),
		}),
	);
	await page.reload();
	await expect(page.getByRole("alert")).toContainText("يلزم دخول المالك");

	await page.unroute("**/rpc/admin/session");
	await page.route("**/rpc/admin/session", (route) =>
		route.fulfill({
			status: 401,
			json: rpcError(401, "UNAUTHORIZED", "Unauthorized"),
		}),
	);
	await page.route("**/api/auth/session", (route) =>
		route.fulfill({ status: 401, json: { error: "unauthorized" } }),
	);
	await page.reload();
	await expect(page).toHaveURL(/\/login$/u);
	await expect(
		page.getByRole("heading", { name: "تسجيل الدخول" }),
	).toBeVisible();
});

test("keyboard order, practical targets, reduced motion, and 200% reflow remain usable", async ({
	page,
}) => {
	await mockOwnerAnalytics(page);
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.setViewportSize({ width: 640, height: 900 });
	await page.goto("/admin");

	const skipLink = page.getByRole("link", {
		name: "الانتقال إلى الحالة التشغيلية",
	});
	await skipLink.focus();
	await expect(skipLink).toBeFocused();
	await page.keyboard.press("Enter");
	await expect(page.locator("main")).toBeFocused();

	const chart = page.locator("[data-owner-chart]");
	await chart.focus();
	await expect(chart).toBeFocused();
	await expect
		.poll(() =>
			chart.evaluate((element) => getComputedStyle(element).boxShadow),
		)
		.not.toBe("none");
	await page.keyboard.press("ArrowRight");
	await expect(page.locator("[data-active-reading]")).toContainText("46");

	await page.locator("summary").focus();
	await expect(page.locator("summary")).toBeFocused();
	for (const locator of [
		page.getByRole("button", { name: "التبديل إلى اللغة الإنجليزية" }),
		page.getByRole("button", { name: "تسجيل الخروج" }),
		chart,
		page.locator("summary"),
	]) {
		const box = await locator.boundingBox();
		expect(box?.height).toBeGreaterThanOrEqual(44);
	}

	const motion = await chart.evaluate((element) => {
		const style = getComputedStyle(element);
		return {
			animation: style.animationName,
			transition: style.transitionDuration,
		};
	});
	expect(motion.animation).toBe("none");
	expect(motion.transition).not.toMatch(/(?:^|, )(?:[1-9]|0\.[1-9][1-9])s/u);

	await page.evaluate(() => {
		document.documentElement.style.zoom = "2";
	});
	const overflow = await page.evaluate(
		() =>
			document.documentElement.scrollWidth >
			document.documentElement.clientWidth,
	);
	expect(overflow).toBe(false);
	await expect(
		page.getByRole("heading", { name: "التحليلات اليومية" }),
	).toBeVisible();
	await captureReview(page, "owner-analytics-ar-200-percent-reflow.png");
});

test("canonical routed Owner Daily desktop Arabic and mobile English match", async ({
	page,
}) => {
	await mockOwnerAnalytics(page);
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/admin");
	await expect(
		page.getByRole("heading", { name: "التحليلات اليومية" }),
	).toBeVisible();
	await page.evaluate(() => document.fonts.ready);
	await expect(page).toHaveScreenshot(
		"owner-daily-route-ar-desktop-1440x900.png",
		{
			fullPage: true,
		},
	);

	await page
		.getByRole("button", { name: "التبديل إلى اللغة الإنجليزية" })
		.click();
	await page.setViewportSize({ width: 390, height: 844 });
	await expect(
		page.getByRole("heading", { name: "Daily analytics" }),
	).toBeVisible();
	await page.evaluate(() => document.fonts.ready);
	await expect(page).toHaveScreenshot(
		"owner-daily-route-en-mobile-390x844.png",
		{
			fullPage: true,
		},
	);
});
