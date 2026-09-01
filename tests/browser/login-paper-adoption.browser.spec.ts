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
			const input = document.querySelector(".login-field__input");
			return {
				brandRight: brand?.right,
				languageLeft: language?.left,
				panelWidth: panel?.width,
				railHeight: rail?.height,
				inputDirection: input ? getComputedStyle(input).direction : undefined,
			};
		});

		expect(measurements.railHeight).toBeCloseTo(viewport.railHeight, 0);
		expect(measurements.panelWidth).toBeCloseTo(viewport.panelWidth, 0);
		expect(measurements.languageLeft).toBeLessThan(viewport.width / 4);
		expect(measurements.brandRight).toBeGreaterThan((viewport.width * 3) / 4);
		// Approved Paper mirrors the field in Arabic (WBX-0/W0S-0 render
		// direction rtl) and keeps it LTR on the English page.
		expect(measurements.inputDirection).toBe("rtl");
		await expectNoHorizontalOverflow(page, `${viewport.width}px Arabic`);
		await captureReview(
			page,
			`login-ar-${viewport.width}x${viewport.height}.png`,
		);
	}

	await page.locator(".login-rail__language").click();
	await expect(page.locator("html")).toHaveAttribute("lang", "en");
	await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
	await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
	await expectNoHorizontalOverflow(page, "320px English");

	const physicalAnchors = await page.evaluate(() => {
		const language = document
			.querySelector(".login-rail__language")
			?.getBoundingClientRect();
		const brand = document
			.querySelector(".login-rail__brand")
			?.getBoundingClientRect();
		const input = document.querySelector(".login-field__input");
		return {
			brandRight: brand?.right,
			languageLeft: language?.left,
			inputDirection: input ? getComputedStyle(input).direction : undefined,
		};
	});
	expect(physicalAnchors.languageLeft).toBeLessThan(80);
	expect(physicalAnchors.brandRight).toBeGreaterThan(240);
	expect(physicalAnchors.inputDirection).toBe("ltr");
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
	await expect(page.locator(".login-field__hint")).toBeVisible();
	const pin = page.getByLabel("Access code");
	const submit = page.locator(".login-panel__submit");
	await pin.fill("123456");
	await submit.click();
	await expect(page.getByRole("alert")).toContainText(
		"That code didn’t work. Check it and try again.",
	);
	// The message replaces the helper in every exception state (approved Paper
	// S2/S3/S4 render no helper line).
	await expect(page.locator(".login-field__hint")).toHaveCount(0);
	await expect(page.getByRole("alert")).toHaveAttribute("data-tone", "error");
	await expect(pin).toHaveAttribute("aria-invalid", "true");
	await expect(pin).toHaveValue("123456");
	await expect(submit).toBeEnabled();
	await captureReview(page, "login-invalid-en-320x720.png");
	await page.evaluate(() => document.fonts.ready);
	await expect(page).toHaveScreenshot("login-invalid-route-en-320x720.png", {
		fullPage: true,
	});

	await submit.click();
	await expect(page.getByRole("alert")).toHaveAttribute("data-tone", "offline");
	await expect(submit).toBeDisabled();
	// Approved Paper S4/I3: the field takes the disabled treatment, renders no
	// code, and is not focusable — so no ring case exists (VF4-0).
	await expect(pin).toBeDisabled();
	await expect(pin).toHaveValue("");
	await expect
		.poll(() => pin.evaluate((element) => getComputedStyle(element).opacity))
		.toBe("0.72");
	await expectNoHorizontalOverflow(page, "320px service failure");
	await captureReview(page, "login-service-en-320x720.png");
	await page.evaluate(() => document.fonts.ready);
	await expect(page).toHaveScreenshot("login-service-route-en-320x720.png", {
		fullPage: true,
	});

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
	// Approved Paper S4 (VTY-0): no recovery action exists in the form while
	// the service condition holds and none is invented — the message states
	// what to do. A retry therefore begins from a fresh page load.
	await page.reload();
	await pin.fill("123456");
	await expect(submit).toBeEnabled();
	await submit.evaluate((button) => button.click());
	await expect(submit).toHaveAttribute("data-submitting", "true");
	await expect(submit).toBeDisabled();
	await expect(pin).toBeDisabled();
	// Approved Paper S5: the code stays in the field while submitting.
	await expect(pin).toHaveValue("123456");
	await expect(page.locator(".login-submit__spinner")).toBeVisible();
	await captureReview(page, "login-submitting-en-320x720.png");
	await page.evaluate(() => document.fonts.ready);
	await expect(page).toHaveScreenshot("login-submitting-route-en-320x720.png", {
		fullPage: true,
	});
	releaseSubmission();
	await expect(page.getByRole("alert")).toHaveAttribute("data-tone", "error");
});

test("enabled submit hover reaches WCAG AA contrast in both locales", async ({
	page,
}) => {
	await mockLoggedOutSession(page);
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/login");
	await waitForLogin(page);

	const measureHoverContrast = () =>
		page.locator(".login-panel__submit").evaluate((element) => {
			const channels = (value: string) => {
				const match = /rgba?\(([^)]+)\)/.exec(value);
				if (!match) return null;
				const parts = match[1]
					.split(",")
					.map((part) => Number.parseFloat(part));
				return {
					r: parts[0] ?? 0,
					g: parts[1] ?? 0,
					b: parts[2] ?? 0,
					a: parts[3] ?? 1,
				};
			};
			// Composite the sampled layer over the nearest opaque ancestors so the
			// measurement is the color actually painted, not the authored token.
			const composite = (
				layer: { r: number; g: number; b: number; a: number },
				under: { r: number; g: number; b: number; a: number },
			) => ({
				r: layer.r * layer.a + under.r * (1 - layer.a),
				g: layer.g * layer.a + under.g * (1 - layer.a),
				b: layer.b * layer.a + under.b * (1 - layer.a),
				a: layer.a + under.a * (1 - layer.a),
			});
			const linear = (channel: number) => {
				const c = channel / 255;
				return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
			};
			const luminance = (color: { r: number; g: number; b: number }) =>
				0.2126 * linear(color.r) +
				0.7152 * linear(color.g) +
				0.0722 * linear(color.b);

			let node: Element | null = element;
			let background: {
				r: number;
				g: number;
				b: number;
				a: number;
			} | null = null;
			while (node instanceof Element) {
				const sampled = channels(getComputedStyle(node).backgroundColor);
				if (sampled && sampled.a > 0) {
					background = background ? composite(background, sampled) : sampled;
					if (background.a >= 1) break;
				}
				node = node.parentElement;
			}
			if (!background || background.a < 1) return null;

			const foreground = channels(getComputedStyle(element).color);
			if (!foreground || foreground.a < 1) return null;

			const luminances = [luminance(background), luminance(foreground)].sort(
				(a, b) => b - a,
			);
			return (luminances[0] + 0.05) / (luminances[1] + 0.05);
		});

	for (const locale of ["ar", "en"] as const) {
		if (locale === "en") {
			await page.locator(".login-rail__language").click();
			await expect(page.locator("html")).toHaveAttribute("lang", "en");
		}
		const submit = page.locator(".login-panel__submit");
		await expect(submit).toBeEnabled();
		await submit.hover();
		// Pin the exact exception color first so the contrast poll cannot pass
		// with hover unapplied (the resting red already clears 4.5:1).
		await expect
			.poll(
				() =>
					page
						.locator(".login-panel__submit")
						.evaluate((element) => getComputedStyle(element).backgroundColor),
				`${locale} hover background`,
			)
			.toBe("rgb(196, 20, 48)");
		await expect
			.poll(measureHoverContrast, `${locale} hover contrast`)
			.toBeGreaterThanOrEqual(4.5);
	}

	// Fault injection: restoring the rejected Paper-bright hover over the
	// exception must fail this contract, proving the measurement is live.
	await page.addStyleTag({
		content:
			".login-panel__submit:hover:not(:disabled) { background: var(--fw-red-bright) !important; }",
	});
	await expect.poll(measureHoverContrast).toBeLessThan(4.5);
});

test("server Retry-After controls lockout while the field takes the disabled treatment", async ({
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
	const pin = page.getByLabel("Access code");
	await pin.fill("123456");
	await page.getByRole("button", { name: "Sign in" }).click();
	await expect(page.getByRole("alert")).toHaveAttribute("data-tone", "delayed");
	await expect(page.getByRole("alert")).toContainText("28");
	await expect(page.getByRole("button", { name: "Sign in" })).toBeDisabled();
	// Approved Paper S3/I3: the lockout field is disabled — not focusable, no
	// ring case — renders the disabled treatment, and holds no code while the
	// server-provided countdown runs.
	await expect(pin).toBeDisabled();
	await expect(pin).toHaveValue("");
	await expect
		.poll(() => pin.evaluate((element) => getComputedStyle(element).opacity))
		.toBe("0.72");
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
	const pin = page.getByLabel("Access code");
	const submit = page.getByRole("button", { name: "Sign in" });

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
	await page.getByLabel("Access code").fill("123456");
	const submission = page.getByRole("button", { name: "Sign in" }).click();
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
