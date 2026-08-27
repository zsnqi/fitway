import { mkdir } from "node:fs/promises";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

async function mockLoggedOutSession(page: Page) {
	await page.route("**/api/auth/session", (route) =>
		route.fulfill({ status: 401, json: { error: "unauthorized" } }),
	);
}

async function waitForLogin(page: Page) {
	await expect(page.locator(".login-panel")).toBeVisible();
	await page.evaluate(() => document.fonts.ready);
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

async function expectNoHorizontalOverflow(page: Page, label: string) {
	const dimensions = await page.evaluate(() => ({
		clientWidth: document.documentElement.clientWidth,
		scrollWidth: document.documentElement.scrollWidth,
	}));
	expect(
		dimensions.scrollWidth,
		`${label} horizontal overflow`,
	).toBeLessThanOrEqual(dimensions.clientWidth);
}

function seriousOrCritical(
	violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"],
) {
	return violations.filter(
		({ impact }) => impact === "serious" || impact === "critical",
	);
}

test("approved Login family is responsive, physically anchored, and locale-safe", async ({
	page,
}) => {
	await mockLoggedOutSession(page);

	for (const viewport of [
		{ width: 1440, height: 900, panelWidth: 480, railHeight: 56 },
		{ width: 768, height: 1024, panelWidth: 576, railHeight: 52 },
		{ width: 390, height: 844, panelWidth: 358, railHeight: 52 },
		{ width: 320, height: 720, panelWidth: 320, railHeight: 52 },
	]) {
		await page.setViewportSize(viewport);
		await page.goto("/login");
		await waitForLogin(page);
		await expect(page.locator("html")).toHaveAttribute("lang", "ar");
		await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

		const measurements = await page.evaluate(() => {
			const rail = document
				.querySelector(".login-rail")
				?.getBoundingClientRect();
			const language = document
				.querySelector(".login-rail__language")
				?.getBoundingClientRect();
			const brand = document
				.querySelector(".login-rail__brand")
				?.getBoundingClientRect();
			const panel = document
				.querySelector(".login-panel")
				?.getBoundingClientRect();
			return {
				brandRight: brand?.right,
				languageLeft: language?.left,
				panelWidth: panel?.width,
				railHeight: rail?.height,
			};
		});

		expect(measurements.railHeight).toBeCloseTo(viewport.railHeight, 0);
		expect(measurements.panelWidth).toBeCloseTo(viewport.panelWidth, 0);
		expect(measurements.languageLeft).toBeLessThan(viewport.width / 4);
		expect(measurements.brandRight).toBeGreaterThan((viewport.width * 3) / 4);
		await expectNoHorizontalOverflow(page, `${viewport.width}px Arabic`);
		await captureReview(
			page,
			`login-ar-${viewport.width}x${viewport.height}.png`,
		);
	}

	await page.locator(".login-rail__language").click();
	await expect(page.locator("html")).toHaveAttribute("lang", "en");
	await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
	await expect(
		page.getByRole("heading", { name: "Open live operations" }),
	).toBeVisible();
	await expectNoHorizontalOverflow(page, "320px English");

	const physicalAnchors = await page.evaluate(() => {
		const language = document
			.querySelector(".login-rail__language")
			?.getBoundingClientRect();
		const brand = document
			.querySelector(".login-rail__brand")
			?.getBoundingClientRect();
		return { brandRight: brand?.right, languageLeft: language?.left };
	});
	expect(physicalAnchors.languageLeft).toBeLessThan(80);
	expect(physicalAnchors.brandRight).toBeGreaterThan(240);
	await captureReview(page, "login-en-320x720.png");
});

test("canonical approved Login compositions remain stable", async ({
	page,
}) => {
	await mockLoggedOutSession(page);
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/login");
	await waitForLogin(page);
	await page.evaluate(() =>
		(document.activeElement as HTMLElement | null)?.blur(),
	);
	await expect(page).toHaveScreenshot("login-idle-ar-desktop-1440x900.png", {
		animations: "disabled",
		fullPage: true,
	});

	await page.locator(".login-rail__language").click();
	await page.setViewportSize({ width: 390, height: 844 });
	await waitForLogin(page);
	await page.evaluate(() =>
		(document.activeElement as HTMLElement | null)?.blur(),
	);
	await expect(page).toHaveScreenshot("login-idle-en-mobile-390x844.png", {
		animations: "disabled",
		fullPage: true,
	});
});

test("exception and submitting visuals preserve frozen authentication semantics", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await mockLoggedOutSession(page);
	let attempt = 0;
	await page.route("**/api/auth/staff/pin", async (route) => {
		attempt += 1;
		if (attempt === 1) {
			await route.fulfill({
				status: 401,
				json: { error: "invalid_credentials" },
			});
			return;
		}
		await route.fulfill({
			status: 503,
			json: { error: "service_unavailable" },
		});
	});

	await page.setViewportSize({ width: 320, height: 720 });
	await page.goto("/login");
	const pin = page.getByLabel("Staff PIN");
	const submit = page.locator(".login-panel__submit");
	await pin.fill("123456");
	await submit.click();
	await expect(page.getByRole("alert")).toContainText(
		"Unable to sign in. Check the PIN and try again.",
	);
	await expect(page.getByRole("alert")).toHaveAttribute("data-tone", "error");
	await expect(pin).toHaveAttribute("aria-invalid", "true");
	await expect(submit).toBeEnabled();
	await captureReview(page, "login-invalid-en-320x720.png");

	await submit.click();
	await expect(page.getByRole("alert")).toHaveAttribute("data-tone", "offline");
	await expect(submit).toBeEnabled();
	await expect(pin).toBeEnabled();
	await expectNoHorizontalOverflow(page, "320px service failure");
	await captureReview(page, "login-service-en-320x720.png");

	await page.unroute("**/api/auth/staff/pin");
	let releaseSubmission!: () => void;
	const submissionGate = new Promise<void>((resolve) => {
		releaseSubmission = resolve;
	});
	await page.route("**/api/auth/staff/pin", async (route) => {
		await submissionGate;
		await route.fulfill({
			status: 401,
			json: { error: "invalid_credentials" },
		});
	});
	await pin.fill("123456");
	await submit.evaluate((button) => button.click());
	await expect(submit).toHaveAttribute("data-submitting", "true");
	await expect(submit).toBeDisabled();
	await expect(pin).toBeDisabled();
	await expect(page.locator(".login-submit__spinner")).toBeVisible();
	await captureReview(page, "login-submitting-en-320x720.png");
	releaseSubmission();
	await expect(page.getByRole("alert")).toHaveAttribute("data-tone", "error");
});

test("server Retry-After controls lockout without disabling PIN entry", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await mockLoggedOutSession(page);
	await page.route("**/api/auth/staff/pin", (route) =>
		route.fulfill({
			status: 429,
			headers: { "Retry-After": "28" },
			json: { error: "invalid_credentials" },
		}),
	);
	await page.setViewportSize({ width: 320, height: 720 });
	await page.goto("/login");
	const pin = page.getByLabel("Staff PIN");
	await pin.fill("123456");
	await page.getByRole("button", { name: "Open operations" }).click();
	await expect(page.getByRole("alert")).toHaveAttribute("data-tone", "delayed");
	await expect(page.getByRole("alert")).toContainText("28");
	await expect(
		page.getByRole("button", { name: "Open operations" }),
	).toBeDisabled();
	await expect(pin).toBeEnabled();
	await expectNoHorizontalOverflow(page, "320px Retry-After");
	await captureReview(page, "login-rate-limited-en-320x720.png");
});

test("keyboard order, focus, practical targets, and 200 percent zoom remain resilient", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await mockLoggedOutSession(page);
	await page.setViewportSize({ width: 720, height: 900 });
	await page.goto("/login");
	const skip = page.getByRole("link", { name: "Skip to operational status" });
	const language = page.locator(".login-rail__language");
	const pin = page.getByLabel("Staff PIN");
	const submit = page.getByRole("button", { name: "Open operations" });

	await skip.focus();
	await expect(skip).toBeFocused();
	await page.keyboard.press("Enter");
	await expect(page.locator("main")).toBeFocused();

	await page.reload();
	await skip.focus();
	await expect(skip).toBeFocused();
	await page.keyboard.press("Tab");
	await expect(language).toBeFocused();
	await expect
		.poll(() =>
			language.evaluate((element) => getComputedStyle(element).boxShadow),
		)
		.not.toBe("none");
	await page.keyboard.press("Tab");
	await expect(pin).toBeFocused();
	await expect
		.poll(() => pin.evaluate((element) => getComputedStyle(element).boxShadow))
		.not.toBe("none");
	await pin.fill("123456");
	await page.keyboard.press("Tab");
	await expect(submit).toBeFocused();

	for (const target of [language, pin, submit]) {
		const box = await target.boundingBox();
		expect(box?.height).toBeGreaterThanOrEqual(44);
	}

	await page.evaluate(() => {
		document.documentElement.style.zoom = "2";
	});
	await expectNoHorizontalOverflow(page, "200 percent zoom");
	await captureReview(page, "login-en-200-percent-zoom.png");
});

test("reduced motion and reduced transparency retain state clarity", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await mockLoggedOutSession(page);
	await page.route("**/api/auth/staff/pin", async (route) => {
		await new Promise((resolve) => setTimeout(resolve, 500));
		await route.fulfill({
			status: 401,
			json: { error: "invalid_credentials" },
		});
	});
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto("/login");
	await page.getByLabel("Staff PIN").fill("123456");
	const submission = page
		.getByRole("button", { name: "Open operations" })
		.click();
	await expect(page.locator(".login-submit__spinner")).toBeHidden();
	await expect
		.poll(() =>
			page
				.locator(".login-submit__spinner")
				.evaluate((element) => getComputedStyle(element).animationName),
		)
		.toBe("none");
	await submission;

	const cdp = await page.context().newCDPSession(page);
	await cdp.send("Emulation.setEmulatedMedia", {
		features: [{ name: "prefers-reduced-transparency", value: "reduce" }],
	});
	await expect
		.poll(() =>
			page.evaluate(
				() =>
					window.matchMedia("(prefers-reduced-transparency: reduce)").matches,
			),
		)
		.toBe(true);
	await expect
		.poll(() =>
			page
				.locator(".login-panel")
				.evaluate((element) => getComputedStyle(element).backdropFilter),
		)
		.toBe("none");
	await expect
		.poll(() =>
			page
				.locator(".login-panel")
				.evaluate((element) => getComputedStyle(element).backgroundColor),
		)
		.toBe("rgb(23, 19, 22)");
	await captureReview(page, "login-en-reduced-transparency.png");
	await cdp.detach();
});

test("Arabic and English Login remain free of serious accessibility violations", async ({
	page,
}) => {
	await mockLoggedOutSession(page);
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/login");
	await waitForLogin(page);

	let results = await new AxeBuilder({ page }).analyze();
	expect(seriousOrCritical(results.violations)).toEqual([]);

	await page.locator(".login-rail__language").click();
	await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
	results = await new AxeBuilder({ page }).analyze();
	expect(seriousOrCritical(results.violations)).toEqual([]);
});
