import AxeBuilder from "@axe-core/playwright";
import {
	expect,
	type Page,
	type Route,
	type TestInfo,
	test,
} from "@playwright/test";

const fixedNow = new Date("2026-07-17T12:00:00.000Z");
const bands = ["quiet", "moderate", "busy", "packed"] as const;
type CrowdBand = (typeof bands)[number];

function livePayload(
	freshness: "fresh" | "stale" = "fresh",
	band: CrowdBand = "moderate",
) {
	return {
		schemaVersion: 2,
		freshness,
		timeZone: "Asia/Riyadh",
		band,
		count: 37,
		lastUpdatedAt:
			freshness === "fresh"
				? "2026-07-17T11:59:30.000Z"
				: "2026-07-17T11:48:00.000Z",
		freshUntil:
			freshness === "fresh"
				? "2026-07-17T12:02:00.000Z"
				: "2026-07-17T11:50:00.000Z",
		source: "edge",
		computedAt: fixedNow.toISOString(),
		trend: null,
	};
}

async function freezeClock(page: Page) {
	await page.clock.setFixedTime(fixedNow);
}

async function startInArabic(page: Page) {
	await page.addInitScript(() => {
		window.localStorage.setItem("fitway.locale", "ar");
	});
}

async function startInEnglish(page: Page) {
	await page.addInitScript(() => {
		window.localStorage.setItem("fitway.locale", "en");
	});
}

async function fulfill(route: Route, json: unknown) {
	await route.fulfill({
		json,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Expose-Headers": "X-Fitway-Poll-Seconds",
			"X-Fitway-Poll-Seconds": "60",
		},
	});
}

async function settleVisuals(page: Page) {
	await page.evaluate(async () => {
		await document.fonts.ready;
		await Promise.all(
			Array.from(document.images, (image) =>
				image.decode().catch(() => undefined),
			),
		);
		await new Promise<void>((resolve) => {
			requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
		});
	});
	await page.evaluate(() => window.scrollTo(0, 0));
}

async function captureReview(page: Page, testInfo: TestInfo, name: string) {
	await settleVisuals(page);
	await page.screenshot({
		path: testInfo.outputPath("review", name),
		fullPage: false,
		animations: "disabled",
	});
}

async function expectNoHorizontalOverflow(page: Page) {
	const dimensions = await page.evaluate(() => ({
		clientWidth: document.documentElement.clientWidth,
		scrollWidth: document.documentElement.scrollWidth,
	}));
	expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
}

async function expectStateContentInsideCard(page: Page) {
	const bounds = await page.evaluate(() => {
		const card = document.querySelector<HTMLElement>(".public-state-card");
		const body = document.querySelector<HTMLElement>(
			".public-state-card__body",
		);
		if (!card || !body) throw new Error("Expected a public state card");
		const cardRect = card.getBoundingClientRect();
		const bodyRect = body.getBoundingClientRect();
		const contentRects = Array.from(
			body.querySelectorAll<HTMLElement>(
				"h1, .public-state-card__status, .public-state-card__detail",
			),
		).map((element) => {
			const rect = element.getBoundingClientRect();
			return { left: rect.left, right: rect.right };
		});
		const textRects = Array.from(
			body.querySelectorAll<HTMLElement>(
				"h1, .public-state-card__status, .public-state-card__detail",
			),
		).flatMap((element) => {
			const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
			const rects: Array<{ left: number; right: number }> = [];
			for (let node = walker.nextNode(); node; node = walker.nextNode()) {
				if (!node.textContent?.trim()) continue;
				const range = document.createRange();
				range.selectNodeContents(node);
				const rect = range.getBoundingClientRect();
				rects.push({ left: rect.left, right: rect.right });
			}
			return rects;
		});
		return {
			bodyScrollLeft: document.body.scrollLeft,
			documentScrollLeft: document.documentElement.scrollLeft,
			cardLeft: cardRect.left,
			cardRight: cardRect.right,
			bodyLeft: bodyRect.left,
			bodyRight: bodyRect.right,
			contentRects,
			textRects,
		};
	});
	expect(bounds.bodyScrollLeft).toBe(0);
	expect(bounds.documentScrollLeft).toBe(0);
	expect(bounds.bodyLeft).toBeGreaterThanOrEqual(bounds.cardLeft);
	expect(bounds.bodyRight).toBeLessThanOrEqual(bounds.cardRight);
	for (const rect of bounds.contentRects) {
		expect(rect.left).toBeGreaterThanOrEqual(bounds.cardLeft);
		expect(rect.right).toBeLessThanOrEqual(bounds.cardRight);
	}
	for (const rect of bounds.textRects) {
		expect(rect.left).toBeGreaterThanOrEqual(bounds.cardLeft);
		expect(rect.right).toBeLessThanOrEqual(bounds.cardRight);
	}
}

async function expectHeaderInsideViewport(page: Page) {
	const bounds = await page
		.locator(".public-site-header__brand")
		.evaluate((brand) => {
			const rect = brand.getBoundingClientRect();
			return {
				left: rect.left,
				right: rect.right,
				viewportWidth: window.innerWidth,
			};
		});
	expect(bounds.left).toBeGreaterThanOrEqual(0);
	expect(bounds.right).toBeLessThanOrEqual(bounds.viewportWidth);
}

async function expectBandFirstHierarchy(page: Page) {
	const hierarchy = await page.evaluate(() => {
		const band = document.querySelector<HTMLElement>(
			".public-live__band-value",
		);
		const count = document.querySelector<HTMLElement>(
			".public-live__count-value",
		);
		if (!band || !count) throw new Error("Expected both public live readings");
		return {
			bandFontSize: Number.parseFloat(getComputedStyle(band).fontSize),
			countFontSize: Number.parseFloat(getComputedStyle(count).fontSize),
			bandPrecedesCount: Boolean(
				band.compareDocumentPosition(count) & Node.DOCUMENT_POSITION_FOLLOWING,
			),
		};
	});
	expect(hierarchy.bandPrecedesCount).toBe(true);
	expect(hierarchy.bandFontSize).toBeGreaterThan(hierarchy.countFontSize);
}

async function expectNoWcagViolations(page: Page) {
	const results = await new AxeBuilder({ page })
		.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
		.analyze();
	const report = results.violations
		.map(
			(violation) =>
				`${violation.id} (${violation.impact ?? "unknown"}): ${violation.help}\n${violation.nodes
					.map(
						(node) =>
							`  ${node.target.join(" ")}: ${node.failureSummary ?? ""}`,
					)
					.join("\n")}`,
		)
		.join("\n\n");
	expect(
		results.violations,
		report || "Expected no WCAG A/AA violations",
	).toEqual([]);
}

async function expectSignalDistribution(page: Page) {
	const signal = page.locator(".public-live__signal");
	await expect(signal.locator(".public-live__signal-bar")).toHaveCount(28);
	for (const [band, count] of [
		["quiet", 6],
		["moderate", 5],
		["busy", 8],
		["packed", 9],
	] as const) {
		await expect(signal.locator(`[data-step="${band}"]`)).toHaveCount(count);
	}
}

async function switchLocale(page: Page, locale: "ar" | "en") {
	const html = page.locator("html");
	const currentLocale = await html.getAttribute("lang");
	if (currentLocale !== locale) {
		await page
			.getByRole("button", {
				name:
					locale === "en" ? "التبديل إلى اللغة الإنجليزية" : "Switch to Arabic",
			})
			.click();
	}
	await expect(html).toHaveAttribute("lang", locale);
	await expect(html).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
}

async function expectNoOccupancyReading(
	page: Page,
	options: { allowSkeleton?: boolean } = {},
) {
	await expect(page.locator(".public-live__band-value")).toHaveCount(0);
	await expect(page.locator(".public-live__count-value")).toHaveCount(0);
	await expect(page.locator("#occupancy-spoken-summary")).toHaveCount(0);
	await expect(
		page.getByRole("img", {
			name: /مستوى الازدحام:|Crowd level:/u,
		}),
	).toHaveCount(0);
	if (!options.allowSkeleton) {
		await expect(page.locator(".public-live__signal")).toHaveCount(0);
	}
	await expect(page.locator("body")).not.toContainText("%");
	await expect(page.locator("body")).not.toContainText(/السعة|capacity/iu);
}

test.beforeEach(async ({ page }) => {
	await startInArabic(page);
	await freezeClock(page);
});

test("renders the privacy-safe schema-v2 live hierarchy and 28-bar signal", async ({
	page,
}) => {
	await page.route("**/public/occupancy", (route) =>
		fulfill(route, livePayload()),
	);
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/");

	await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
	await expect(
		page.getByRole("heading", { level: 1, name: "متوسط" }),
	).toBeVisible();
	await expect(page.getByRole("heading", { name: "37" })).toHaveCount(0);
	await expect(
		page.getByRole("region", { name: /النادي مفتوح الآن متوسط/u }),
	).toBeVisible();
	await expect(
		page.getByRole("img", { name: /مستوى الازدحام: متوسط/u }),
	).toBeVisible();
	await expect(page.locator(".public-live__count-value bdi")).toHaveText("37");
	await expect(page.locator("meter")).toHaveCount(0);
	await expect(page.locator(".public-live__intensity-bar")).toHaveCount(0);
	await expect(page.locator("body")).not.toContainText("%");
	await expect(page.locator("body")).not.toContainText(/السعة|capacity/iu);
	await expect(page.locator(".public-live__freshness")).toBeVisible();
	await expectSignalDistribution(page);
	await expect(
		page.locator('.public-live__signal-bar[data-state="complete"]'),
	).toHaveCount(6);
	await expect(
		page.locator('.public-live__signal-bar[data-state="current"]'),
	).toHaveCount(5);
	await expect(
		page.locator('.public-live__signal-bar[data-state="inactive"]'),
	).toHaveCount(17);
	await expect(
		page.locator(
			'.public-live__signal-bar[data-current-cap="true"][data-step="moderate"]',
		),
	).toHaveCount(1);
	await expectBandFirstHierarchy(page);
	await expectNoHorizontalOverflow(page);
	await expectNoWcagViolations(page);
});

test("maps all crowd bands to cumulative states without locking deferred colors", async ({
	page,
}) => {
	let band: CrowdBand = "quiet";
	await page.route("**/public/occupancy", (route) =>
		fulfill(route, livePayload("fresh", band)),
	);
	await page.goto("/");

	for (const [nextBand, expected] of [
		["quiet", { complete: 0, current: 6, inactive: 22 }],
		["moderate", { complete: 6, current: 5, inactive: 17 }],
		["busy", { complete: 11, current: 8, inactive: 9 }],
		["packed", { complete: 19, current: 9, inactive: 0 }],
	] as const) {
		band = nextBand;
		await page.reload();
		await expect(page.getByRole("heading", { level: 1 })).toHaveText(
			{
				quiet: "هادئ",
				moderate: "متوسط",
				busy: "مزدحم",
				packed: "ممتلئ جدًا",
			}[nextBand],
		);
		await expectSignalDistribution(page);
		await expect(
			page.locator('.public-live__signal-bar[data-state="complete"]'),
		).toHaveCount(expected.complete);
		await expect(
			page.locator('.public-live__signal-bar[data-state="current"]'),
		).toHaveCount(expected.current);
		await expect(
			page.locator('.public-live__signal-bar[data-state="inactive"]'),
		).toHaveCount(expected.inactive);
		await expect(
			page.locator(
				`.public-live__signal-bar[data-current-cap="true"][data-step="${nextBand}"]`,
			),
		).toHaveCount(1);
	}
	await expect(page.locator("body")).not.toContainText("%");
});

test("keeps stale, unavailable, and closed states honest in RTL and LTR", async ({
	page,
}, testInfo) => {
	await page.setViewportSize({ width: 390, height: 844 });
	let payload: unknown = livePayload("stale");
	await page.route("**/public/occupancy", (route) => fulfill(route, payload));
	await page.goto("/");

	await switchLocale(page, "ar");
	await expect(page.locator('[data-freshness="stale"]')).toBeVisible();
	await expect(page.getByRole("status")).toContainText(
		"التحديثات المباشرة متأخرة",
	);
	await expect(page.locator(".public-live__freshness")).toBeVisible();
	await expect(
		page.getByRole("heading", { level: 1, name: "متوسط" }),
	).toBeVisible();
	await expect(page.locator(".public-live__count-value bdi")).toHaveText("37");
	await expect(page.locator("body")).toContainText("آخر عدد تقريبي معروف");
	await expect(
		page.getByRole("img", {
			name: /مستوى الازدحام: متوسط.*آخر تحديث معروف/u,
		}),
	).toBeVisible();
	await expect(page.locator("body")).not.toContainText("%");
	await expectNoHorizontalOverflow(page);
	await expectNoWcagViolations(page);
	await captureReview(page, testInfo, "public-stale-ar-mobile.png");

	await switchLocale(page, "en");
	await expect(page.locator('[data-freshness="stale"]')).toBeVisible();
	await expect(page.getByRole("status")).toContainText(
		"Live updates are delayed",
	);
	await expect(
		page.getByRole("heading", { level: 1, name: "Moderate" }),
	).toBeVisible();
	await expect(page.locator(".public-live__count-value bdi")).toHaveText("37");
	await expect(page.locator("body")).toContainText(
		"Last known approximate count",
	);
	await expect(
		page.getByRole("img", {
			name: /Crowd level: Moderate.*Last known update/i,
		}),
	).toBeVisible();
	await expectNoHorizontalOverflow(page);
	await expectNoWcagViolations(page);
	await captureReview(page, testInfo, "public-stale-en-mobile.png");

	await switchLocale(page, "ar");
	payload = {
		schemaVersion: 2,
		freshness: "unavailable",
		computedAt: fixedNow.toISOString(),
		trend: null,
	};
	await page.reload();
	await switchLocale(page, "ar");
	await expect(
		page.getByRole("heading", {
			level: 1,
			name: "التحديث المباشر غير متاح الآن",
		}),
	).toBeVisible();
	await expect(page.locator("body")).not.toContainText(/37|متوسط|%/u);
	await expectNoOccupancyReading(page);
	await expectNoHorizontalOverflow(page);
	await expectStateContentInsideCard(page);
	await expectHeaderInsideViewport(page);
	await expectNoWcagViolations(page);
	await captureReview(page, testInfo, "public-unavailable-ar-mobile.png");

	await switchLocale(page, "en");
	await expect(
		page.getByRole("heading", {
			level: 1,
			name: "Live occupancy is unavailable right now",
		}),
	).toBeVisible();
	await expect(page.locator("body")).not.toContainText(/37|Moderate|%/u);
	await expectNoOccupancyReading(page);
	await expectNoHorizontalOverflow(page);
	await expectStateContentInsideCard(page);
	await expectHeaderInsideViewport(page);
	await expectNoWcagViolations(page);
	await captureReview(page, testInfo, "public-unavailable-en-mobile.png");

	await switchLocale(page, "ar");
	payload = {
		schemaVersion: 2,
		freshness: "closed",
		timeZone: "Asia/Riyadh",
		nextOpenAt: "2026-07-17T14:00:00.000Z",
		computedAt: fixedNow.toISOString(),
		trend: null,
	};
	await page.reload();
	await switchLocale(page, "ar");
	await expect(
		page.getByRole("heading", { level: 1, name: "مغلق الآن" }),
	).toBeVisible();
	await expect(page.locator("body")).not.toContainText(/37|متوسط|%/u);
	await expectNoOccupancyReading(page);
	await expectNoHorizontalOverflow(page);
	await expectStateContentInsideCard(page);
	await expectHeaderInsideViewport(page);
	await expectNoWcagViolations(page);
	await captureReview(page, testInfo, "public-closed-ar-mobile.png");

	await switchLocale(page, "en");
	await expect(
		page.getByRole("heading", { level: 1, name: "Closed now" }),
	).toBeVisible();
	await expect(page.locator("body")).not.toContainText(/37|Moderate|%/u);
	await expectNoOccupancyReading(page);
	await expectNoHorizontalOverflow(page);
	await expectStateContentInsideCard(page);
	await expectHeaderInsideViewport(page);
	await expectNoWcagViolations(page);
	await captureReview(page, testInfo, "public-closed-en-mobile.png");
});

test("protects the unavailable English mobile route from a fresh load", async ({
	page,
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await startInEnglish(page);
	await page.route("**/public/occupancy", (route) =>
		fulfill(route, {
			schemaVersion: 2,
			freshness: "unavailable",
			computedAt: fixedNow.toISOString(),
			trend: null,
		}),
	);
	await page.goto("/");
	await switchLocale(page, "en");
	await expect(page.locator(".public-site-header__brand")).toBeVisible();
	await page.reload();
	await switchLocale(page, "en");
	await expect(
		page.getByRole("heading", {
			level: 1,
			name: "Live occupancy is unavailable right now",
		}),
	).toBeVisible();
	await expectNoOccupancyReading(page);
	await expectNoHorizontalOverflow(page);
	await expectStateContentInsideCard(page);
	await expectNoWcagViolations(page);
	await expectHeaderInsideViewport(page);
	await settleVisuals(page);
	await expect(page).toHaveScreenshot(
		"public-unavailable-route-en-mobile-390x844.png",
		{ fullPage: true },
	);
});

test("protects the closed English mobile route from a fresh load", async ({
	page,
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await startInEnglish(page);
	await page.route("**/public/occupancy", (route) =>
		fulfill(route, {
			schemaVersion: 2,
			freshness: "closed",
			timeZone: "Asia/Riyadh",
			nextOpenAt: "2026-07-17T14:00:00.000Z",
			computedAt: fixedNow.toISOString(),
			trend: null,
		}),
	);
	await page.goto("/");
	await switchLocale(page, "en");
	await expect(page.locator(".public-site-header__brand")).toBeVisible();
	await page.reload();
	await switchLocale(page, "en");
	await expect(
		page.getByRole("heading", { level: 1, name: "Closed now" }),
	).toBeVisible();
	await expectNoOccupancyReading(page);
	await expectNoHorizontalOverflow(page);
	await expectStateContentInsideCard(page);
	await expectNoWcagViolations(page);
	await expectHeaderInsideViewport(page);
	await settleVisuals(page);
	await expect(page).toHaveScreenshot(
		"public-closed-route-en-mobile-390x844.png",
		{ fullPage: true },
	);
});

test("announces loading without exposing a reading in RTL and LTR", async ({
	page,
}, testInfo) => {
	await page.setViewportSize({ width: 390, height: 844 });
	let releaseRequest: (() => void) | undefined;
	const requestGate = new Promise<void>((resolve) => {
		releaseRequest = resolve;
	});
	await page.route("**/public/occupancy", async (route) => {
		await requestGate;
		await fulfill(route, livePayload());
	});
	await page.goto("/");
	const loadingCard = page.locator('.public-live-card[aria-busy="true"]');

	await switchLocale(page, "ar");
	await expect(loadingCard).toBeVisible();
	await expect(page.getByRole("status")).toContainText(
		"جارٍ تحميل حالة الازدحام",
	);
	await expect(
		loadingCard.locator('.public-live__signal-bar[data-state="skeleton"]'),
	).toHaveCount(28);
	await expectNoOccupancyReading(page, { allowSkeleton: true });
	await expectNoHorizontalOverflow(page);
	await expectNoWcagViolations(page);
	await captureReview(page, testInfo, "public-loading-ar-mobile.png");

	await switchLocale(page, "en");
	await expect(loadingCard).toBeVisible();
	await expect(page.getByRole("status")).toContainText(
		"Loading occupancy status",
	);
	await expect(
		loadingCard.locator('.public-live__signal-bar[data-state="skeleton"]'),
	).toHaveCount(28);
	await expectNoOccupancyReading(page, { allowSkeleton: true });
	await expectNoHorizontalOverflow(page);
	await expectNoWcagViolations(page);
	await captureReview(page, testInfo, "public-loading-en-mobile.png");
	await page.evaluate(() => document.fonts.ready);
	await expect(page).toHaveScreenshot(
		"public-loading-route-en-mobile-390x844.png",
		{ fullPage: true },
	);

	releaseRequest?.();
	await expect(
		page.getByRole("heading", { level: 1, name: "Moderate" }),
	).toBeVisible();
});

test("removes retained readings after a background error and keyboard retry recovers", async ({
	page,
}, testInfo) => {
	await page.setViewportSize({ width: 390, height: 844 });
	let attempts = 0;
	await page.route("**/public/occupancy", async (route) => {
		attempts += 1;
		if (attempts === 2) {
			await route.fulfill({ status: 503, body: "unavailable" });
			return;
		}
		await fulfill(route, livePayload());
	});
	await page.goto("/");
	await switchLocale(page, "ar");
	await expect(
		page.getByRole("heading", { level: 1, name: "متوسط" }),
	).toBeVisible();
	await expect(page.locator(".public-live__count-value bdi")).toHaveText("37");
	await expect(
		page.getByRole("img", { name: /مستوى الازدحام: متوسط/u }),
	).toBeVisible();
	expect(attempts).toBe(1);

	await page.evaluate(() => {
		document.dispatchEvent(new Event("visibilitychange"));
	});
	await expect(page.getByRole("alert")).toContainText(
		"تعذر تحميل حالة الازدحام",
	);
	expect(attempts).toBe(2);
	await expectNoOccupancyReading(page);
	await expect(page.locator("body")).not.toContainText(/37|متوسط|%/u);
	await expectNoHorizontalOverflow(page);
	await expectNoWcagViolations(page);
	await captureReview(page, testInfo, "public-error-ar-mobile.png");

	await switchLocale(page, "en");
	await expect(page.getByRole("alert")).toContainText(
		"We could not load the crowd status",
	);
	await expectNoOccupancyReading(page);
	await expect(page.locator("body")).not.toContainText(/37|Moderate|%/u);
	await expectNoHorizontalOverflow(page);
	await expectNoWcagViolations(page);
	await captureReview(page, testInfo, "public-error-en-mobile.png");
	await page.evaluate(() => document.fonts.ready);
	await expect(page).toHaveScreenshot(
		"public-error-route-en-mobile-390x844.png",
		{ fullPage: true },
	);

	const retryButton = page.getByRole("button", { name: "Try again" });
	await retryButton.focus();
	await expect(retryButton).toBeFocused();
	await retryButton.press("Enter");
	await expect(
		page.getByRole("heading", { level: 1, name: "Moderate" }),
	).toBeVisible();
	await expect(page.locator(".public-live__count-value bdi")).toHaveText("37");
	await expect(
		page.getByRole("img", { name: /Crowd level: Moderate/i }),
	).toBeVisible();
	expect(attempts).toBe(3);
});

test("supports skip navigation, locale switching, reduced motion, and 200% text", async ({
	page,
}) => {
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.route("**/public/occupancy", (route) =>
		fulfill(route, livePayload()),
	);
	await page.setViewportSize({ width: 720, height: 900 });
	await page.goto("/");

	const skipLink = page.getByRole("link", {
		name: "الانتقال إلى حالة الازدحام",
	});
	await expect(skipLink).toHaveAttribute("href", "#main-content");
	await page.locator(".public-live-card").click();
	await skipLink.focus();
	await expect(skipLink).toBeFocused();
	await expect
		.poll(() =>
			skipLink.evaluate((element) => element.getBoundingClientRect().top),
		)
		.toBeGreaterThanOrEqual(0);
	await page.goto("/");
	await expect(skipLink).toBeAttached();
	await page.evaluate(() =>
		(document.activeElement as HTMLElement | null)?.blur(),
	);
	await page.keyboard.press("Tab");
	await expect(skipLink).toBeFocused();
	await expect(skipLink).toBeVisible();
	await page.keyboard.press("Enter");
	await expect(page.locator("#main-content")).toBeFocused();

	const languageButton = page.getByRole("button", {
		name: "التبديل إلى اللغة الإنجليزية",
	});
	await languageButton.focus();
	await expect(languageButton).toBeFocused();
	await languageButton.press("Enter");
	await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
	await expect(
		page.getByRole("heading", { level: 1, name: "Moderate" }),
	).toBeVisible();

	const animatedElements = await page
		.locator(".public-page-shell *")
		.evaluateAll((elements) =>
			elements
				.map((element) => getComputedStyle(element).animationName)
				.filter((animationName) => animationName !== "none"),
		);
	expect(animatedElements).toEqual([]);

	await page.evaluate(() => {
		document.documentElement.style.fontSize = "200%";
	});
	await expectNoHorizontalOverflow(page);
	await expect(
		page.getByRole("heading", { level: 1, name: "Moderate" }),
	).toBeVisible();
	await page.locator(".public-live__signal").scrollIntoViewIfNeeded();
	await expect(page.locator(".public-live__signal")).toBeVisible();
	await expectNoWcagViolations(page);

	await page.emulateMedia({ forcedColors: "active" });
	expect(
		await page.evaluate(() => matchMedia("(forced-colors: active)").matches),
	).toBe(true);
	const forcedColorTarget = page.locator(".public-site-header__language");
	await forcedColorTarget.focus();
	const outline = await forcedColorTarget.evaluate((element) => {
		const style = getComputedStyle(element);
		return {
			style: style.outlineStyle,
			width: Number.parseFloat(style.outlineWidth),
		};
	});
	expect(outline.style).not.toBe("none");
	expect(outline.width).toBeGreaterThanOrEqual(2);
});

test("covers every approved responsive width in RTL and LTR", async ({
	page,
}, testInfo) => {
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.route("**/public/occupancy", (route) =>
		fulfill(route, livePayload()),
	);
	await page.goto("/");
	const viewports = [
		{ width: 320, height: 844 },
		{ width: 360, height: 800 },
		{ width: 390, height: 844 },
		{ width: 721, height: 1024 },
		{ width: 768, height: 1024 },
		{ width: 820, height: 1024 },
		{ width: 1024, height: 900 },
		{ width: 1200, height: 900 },
		{ width: 1440, height: 900 },
	] as const;

	for (const locale of ["ar", "en"] as const) {
		if (locale === "en") {
			await page
				.getByRole("button", { name: "التبديل إلى اللغة الإنجليزية" })
				.click();
			await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
		}
		for (const viewport of viewports) {
			await page.setViewportSize(viewport);
			await settleVisuals(page);
			await expectNoHorizontalOverflow(page);
			await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
			await expect(page.locator(".public-live__signal-bar")).toHaveCount(28);
			const controlSize = await page
				.locator(".public-site-header__language")
				.evaluate((element) => {
					const box = element.getBoundingClientRect();
					return { width: box.width, height: box.height };
				});
			expect(controlSize.width).toBeGreaterThanOrEqual(44);
			expect(controlSize.height).toBeGreaterThanOrEqual(44);
			const captionSize = await page
				.locator(".public-live__signal-caption")
				.evaluate((element) =>
					Number.parseFloat(getComputedStyle(element).fontSize),
				);
			expect(captionSize).toBeGreaterThanOrEqual(10);
			await captureReview(
				page,
				testInfo,
				`public-live-${locale}-${viewport.width}x${viewport.height}.png`,
			);
		}
	}
});

test("matches the approved visual baseline at representative locales and sizes", async ({
	page,
}, testInfo) => {
	await page.emulateMedia({ reducedMotion: "reduce" });
	let freshness: "fresh" | "stale" = "fresh";
	await page.route("**/public/occupancy", (route) =>
		fulfill(route, livePayload(freshness)),
	);
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/");
	await settleVisuals(page);
	await expect(page).toHaveScreenshot("public-live-ar-desktop-1440x900.png", {
		fullPage: false,
	});

	await page.setViewportSize({ width: 390, height: 844 });
	await settleVisuals(page);
	await expect(page).toHaveScreenshot("public-live-ar-mobile-390x844.png", {
		fullPage: false,
	});

	freshness = "stale";
	await page.setViewportSize({ width: 768, height: 1024 });
	await page.reload();
	await expect(page.locator('[data-freshness="stale"]')).toBeVisible();
	await settleVisuals(page);
	await expect(page).toHaveScreenshot("public-stale-ar-tablet-768x1024.png", {
		fullPage: false,
	});

	freshness = "fresh";
	await page.reload();
	await expect(page.locator('[data-freshness="fresh"]')).toBeVisible();
	await page.getByRole("button", { name: /اللغة الإنجليزية/u }).click();
	await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
	await page.setViewportSize({ width: 1024, height: 900 });
	await settleVisuals(page);
	await expect(page).toHaveScreenshot("public-live-en-tablet-1024x900.png", {
		fullPage: false,
	});

	await page.setViewportSize({ width: 1440, height: 900 });
	await settleVisuals(page);
	await expect(page).toHaveScreenshot("public-live-en-desktop-1440x900.png", {
		fullPage: false,
	});

	await page.setViewportSize({ width: 390, height: 844 });
	await settleVisuals(page);
	await expect(page).toHaveScreenshot("public-live-en-mobile-390x844.png", {
		fullPage: false,
	});

	await captureReview(page, testInfo, "public-live-en-mobile.png");
});
