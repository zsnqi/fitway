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

const daily = {
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
			count: 31,
			entries: 31,
			exits: 0,
			band: "moderate",
			capacitySnapshot: 100,
			settingsVersion: 12,
			source: "live",
		},
		{
			state: "missing",
			minuteStartUtc: "2026-07-21T07:02:00.000Z",
			count: null,
			settingsVersion: 12,
		},
		{
			state: "value",
			minuteStartUtc: "2026-07-21T07:03:00.000Z",
			count: 57,
			entries: 26,
			exits: 0,
			band: "busy",
			capacitySnapshot: 100,
			settingsVersion: 12,
			source: "manual",
		},
	],
	peak: {
		minuteStartUtc: "2026-07-21T07:03:00.000Z",
		count: 57,
		band: "busy",
		capacitySnapshot: 100,
		settingsVersion: 12,
	},
	dailyAverage: 88 / 3,
	estimatedEntranceCrossings: 59,
	observedOpenMinutes: 3,
	expectedOpenMinutes: 4,
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
	if (!reviewDirectory) {
		throw new Error("FITWAY_PLAYWRIGHT_REVIEW_DIR is required");
	}
	await mkdir(reviewDirectory, { recursive: true });
	await page.screenshot({
		path: path.join(reviewDirectory, name),
		fullPage: true,
	});
}

async function mockOwnerAnalytics(page: Page) {
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
		await route.fulfill({ status: 200, json: { json: timeContext } });
	});
}

async function setLocale(page: Page, locale: "ar" | "en") {
	if ((await page.locator("html").getAttribute("lang")) !== locale) {
		await page.locator(".owner-rail__language").click();
	}
	await expect(page.locator("html")).toHaveAttribute("lang", locale);
	await expect(page.locator("html")).toHaveAttribute(
		"dir",
		locale === "ar" ? "rtl" : "ltr",
	);
}

async function expectNoOverflow(page: Page) {
	const overflow = await page.evaluate(() => ({
		document: document.documentElement.scrollWidth - window.innerWidth,
		body: document.body.scrollWidth - window.innerWidth,
		rail: document.querySelector<HTMLElement>(".owner-rail")?.scrollWidth ?? 0,
		railClient:
			document.querySelector<HTMLElement>(".owner-rail")?.clientWidth ?? 0,
	}));
	expect(overflow.document).toBeLessThanOrEqual(0);
	expect(overflow.body).toBeLessThanOrEqual(0);
	expect(overflow.rail).toBe(overflow.railClient);
}

function seriousViolations(
	results: Awaited<ReturnType<AxeBuilder["analyze"]>>,
) {
	return results.violations.filter(
		({ impact }) => impact === "serious" || impact === "critical",
	);
}

test("approved physical rail zones and spacing hold in both locales at every required width", async ({
	page,
}) => {
	await mockOwnerAnalytics(page);
	await page.goto("/admin");

	const cases = [
		{ width: 1440, height: 900, rail: 56, padding: 48, top: 36 },
		{ width: 768, height: 1024, rail: 56, padding: 24, top: 28 },
		{ width: 390, height: 844, rail: 96, padding: 16, top: 20 },
		{ width: 320, height: 720, rail: 96, padding: 12, top: 20 },
	] as const;

	for (const locale of ["ar", "en"] as const) {
		await setLocale(page, locale);
		for (const view of cases) {
			await page.setViewportSize(view);
			await expect(page.locator("[data-owner-chart]")).toBeVisible();
			const geometry = await page.evaluate(() => {
				const rail = document.querySelector<HTMLElement>(".owner-rail");
				const session = document.querySelector<HTMLElement>(
					".owner-rail__session",
				);
				const brand = document.querySelector<HTMLElement>(".owner-rail__brand");
				const main = document.querySelector<HTMLElement>(".owner-main");
				const links = [
					...document.querySelectorAll<HTMLElement>(".owner-nav__link"),
				];
				const sessionActions = [
					...document.querySelectorAll<HTMLElement>(
						".owner-rail__session-action",
					),
				];
				if (!rail || !session || !brand || !main) {
					throw new Error("Owner shell geometry is unavailable");
				}
				return {
					railHeight: rail.getBoundingClientRect().height,
					sessionX: session.getBoundingClientRect().x,
					brandX: brand.getBoundingClientRect().x,
					linkBoxes: links.map((link) => link.getBoundingClientRect()),
					sessionActionBoxes: sessionActions.map((action) =>
						action.getBoundingClientRect(),
					),
					mainPaddingInlineStart: Number.parseFloat(
						getComputedStyle(main).paddingInlineStart,
					),
					mainPaddingTop: Number.parseFloat(getComputedStyle(main).paddingTop),
				};
			});

			expect(geometry.railHeight).toBe(view.rail);
			expect(geometry.mainPaddingInlineStart).toBe(view.padding);
			expect(geometry.mainPaddingTop).toBe(view.top);
			expect(geometry.sessionX).toBeLessThan(geometry.brandX);
			expect(geometry.linkBoxes[0]?.x).toBeLessThan(
				geometry.linkBoxes[1]?.x ?? 0,
			);
			for (const box of geometry.sessionActionBoxes) {
				expect(box.width).toBeGreaterThanOrEqual(44);
				expect(box.height).toBeGreaterThanOrEqual(44);
			}
			if (view.width <= 390) {
				expect(geometry.linkBoxes[0]?.x).toBe(0);
				expect(geometry.linkBoxes[0]?.width).toBe(view.width / 2);
				expect(geometry.linkBoxes[1]?.width).toBe(view.width / 2);
			}
			await expectNoOverflow(page);
			await captureReview(
				page,
				`owner-shell-${locale}-${view.width}x${view.height}.png`,
			);
		}
	}

	const safeAreaCases = [
		{ width: 768, height: 1024, left: 37, right: 59 },
		{ width: 320, height: 720, left: 29, right: 41 },
	] as const;
	for (const locale of ["ar", "en"] as const) {
		await setLocale(page, locale);
		for (const view of safeAreaCases) {
			await page.setViewportSize(view);
			await page.locator(".owner-shell").evaluate((shell, insets) => {
				shell.style.setProperty("--owner-safe-inset-left", `${insets.left}px`);
				shell.style.setProperty(
					"--owner-safe-inset-right",
					`${insets.right}px`,
				);
			}, view);
			await expect(page.locator("[data-owner-chart]")).toBeVisible();

			const safeGeometry = await page.evaluate(() => {
				const actions = [
					...document.querySelectorAll<HTMLElement>(
						".owner-rail__session-action",
					),
				];
				const brand = document.querySelector<HTMLElement>(".owner-rail__brand");
				if (!brand) {
					throw new Error("Owner brand geometry is unavailable");
				}
				const brandBox = brand.getBoundingClientRect();
				return {
					actionBoxes: actions.map((action) => {
						const box = action.getBoundingClientRect();
						return { left: box.left, right: box.right };
					}),
					brandRight: brandBox.right,
				};
			});
			for (const box of safeGeometry.actionBoxes) {
				expect(box.left).toBeGreaterThanOrEqual(view.left);
				expect(box.right).toBeLessThanOrEqual(view.width - view.right);
			}
			expect(safeGeometry.brandRight).toBeLessThanOrEqual(
				view.width - view.right,
			);
			await expectNoOverflow(page);
		}
	}
});

test("canonical desktop Arabic and mobile English shell compositions match", async ({
	page,
}) => {
	await mockOwnerAnalytics(page);
	await page.goto("/admin");
	await setLocale(page, "ar");
	await page.setViewportSize({ width: 1440, height: 900 });
	await expect(page.locator("[data-owner-chart]")).toBeVisible();
	await page.evaluate(() => document.fonts.ready);
	await expect(page).toHaveScreenshot("owner-shell-ar-desktop-1440x900.png", {
		fullPage: true,
	});

	await setLocale(page, "en");
	await page.setViewportSize({ width: 390, height: 844 });
	await expect(page.locator("[data-owner-chart]")).toBeVisible();
	await expect(page).toHaveScreenshot("owner-shell-en-mobile-390x844.png", {
		fullPage: true,
	});
});

test("navigation, locale, and logout keep their established behavior", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await mockOwnerAnalytics(page);
	let authenticated = true;
	let logoutRequests = 0;
	await page.route("**/api/auth/session", (route) =>
		route.fulfill(
			authenticated
				? { status: 200, json: { auth: ownerAuth } }
				: { status: 401, json: { error: "unauthorized" } },
		),
	);
	await page.route("**/api/auth/logout", async (route) => {
		logoutRequests += 1;
		authenticated = false;
		await route.fulfill({ status: 204, body: "" });
	});
	await page.route("**/rpc/staff/operationalSnapshot", (route) =>
		route.fulfill({
			status: 503,
			json: rpcError(503, "SERVICE_UNAVAILABLE", "Service Unavailable"),
		}),
	);

	await page.goto("/admin");
	await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
	await page.locator(".owner-rail__language").click();
	await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
	await page.locator(".owner-nav__link").first().click();
	await expect(page).toHaveURL(/\/staff$/u);

	await page.goto("/admin");
	await page.locator(".owner-rail__logout").click();
	await expect(page).toHaveURL(/\/login$/u);
	expect(logoutRequests).toBe(1);
});

test("rail geometry is invariant through loading, error, and forbidden states", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await page.route("**/rpc/admin/session", (route) =>
		route.fulfill({ status: 200, json: { json: ownerAuth } }),
	);
	await page.route("**/rpc/admin/analytics/daily", async (route) => {
		await new Promise((resolve) => setTimeout(resolve, 500));
		await route.fulfill({
			status: 503,
			json: rpcError(503, "SERVICE_UNAVAILABLE", "Service Unavailable"),
		});
	});
	await page.route("**/rpc/admin/analytics/timeContext", (route) =>
		route.fulfill({ status: 200, json: { json: timeContext } }),
	);
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/admin");

	const rail = page.locator(".owner-rail");
	await expect(page.getByRole("status")).toBeVisible();
	const loadingBox = await rail.boundingBox();
	await captureReview(page, "owner-shell-loading-en-390x844.png");
	await expect(page.getByRole("alert")).toBeVisible();
	const errorBox = await rail.boundingBox();
	expect(errorBox).toEqual(loadingBox);
	await captureReview(page, "owner-shell-error-en-390x844.png");

	await page.unroute("**/rpc/admin/session");
	await page.route("**/rpc/admin/session", (route) =>
		route.fulfill({
			status: 403,
			json: rpcError(403, "FORBIDDEN", "Forbidden"),
		}),
	);
	await page.reload();
	await expect(page.getByRole("alert")).toBeVisible();
	const forbiddenBox = await rail.boundingBox();
	expect(forbiddenBox).toEqual(loadingBox);
	await expectNoOverflow(page);
	await captureReview(page, "owner-shell-forbidden-en-390x844.png");
});

test("focus, 44px targets, reduced preferences, 200% reflow, and axe remain sound", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await mockOwnerAnalytics(page);
	await page.emulateMedia({ reducedMotion: "reduce" });
	const cdp = await page.context().newCDPSession(page);
	await cdp.send("Emulation.setEmulatedMedia", {
		features: [
			{ name: "prefers-reduced-motion", value: "reduce" },
			{ name: "prefers-reduced-transparency", value: "reduce" },
		],
	});
	await page.setViewportSize({ width: 640, height: 900 });
	await page.goto("/admin");
	await expect(page.locator("[data-owner-chart]")).toBeVisible();

	const skip = page.locator(".operations-skip-link");
	await skip.focus();
	await expect(skip).toBeFocused();
	await page.keyboard.press("Enter");
	await expect(page.locator("main")).toBeFocused();

	for (const locator of [
		page.locator(".owner-rail__logout"),
		page.locator(".owner-rail__language"),
		page.locator(".owner-nav__link").first(),
		page.locator(".owner-nav__link").last(),
		page.locator(".owner-rail__brand"),
	]) {
		const box = await locator.boundingBox();
		expect(box?.width).toBeGreaterThanOrEqual(44);
		expect(box?.height).toBeGreaterThanOrEqual(44);
		await locator.focus();
		await expect(locator).toBeFocused();
		await expect
			.poll(() =>
				locator.evaluate((element) => getComputedStyle(element).boxShadow),
			)
			.not.toBe("none");
	}

	const preferences = await page.locator(".owner-rail").evaluate((element) => {
		const style = getComputedStyle(element);
		return {
			motion: matchMedia("(prefers-reduced-motion: reduce)").matches,
			transparency: matchMedia("(prefers-reduced-transparency: reduce)")
				.matches,
			transition: style.transitionDuration,
			backdrop: style.backdropFilter,
		};
	});
	expect(preferences.motion).toBe(true);
	expect(preferences.transparency).toBe(true);
	expect(preferences.transition).toBe("0s");
	expect(preferences.backdrop).toBe("none");

	await page.evaluate(() => {
		document.documentElement.style.zoom = "2";
	});
	await expectNoOverflow(page);
	await captureReview(page, "owner-shell-en-200-percent-reflow.png");
	await page.evaluate(() => {
		document.documentElement.style.zoom = "1";
	});

	for (const locale of ["en", "ar"] as const) {
		await setLocale(page, locale);
		const results = await new AxeBuilder({ page }).analyze();
		expect(seriousViolations(results)).toEqual([]);
	}

	await page.emulateMedia({ forcedColors: "active" });
	expect(
		await page.evaluate(() => matchMedia("(forced-colors: active)").matches),
	).toBe(true);
	const forcedColorTargets = page.locator(
		'.owner-shell :is(a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"]))',
	);
	expect(await forcedColorTargets.count()).toBeGreaterThan(4);
	for (const target of await forcedColorTargets.all()) {
		if (!(await target.isVisible()) || (await target.isDisabled())) {
			continue;
		}
		await target.focus();
		await expect(target).toBeFocused();
		const outline = await target.evaluate((element) => {
			const style = getComputedStyle(element);
			return {
				style: style.outlineStyle,
				width: Number.parseFloat(style.outlineWidth),
			};
		});
		expect(outline.style).not.toBe("none");
		expect(outline.width).toBeGreaterThanOrEqual(2);
	}
});
