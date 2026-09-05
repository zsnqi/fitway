import { mkdir } from "node:fs/promises";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectOfficialBrandMark } from "./helpers/brand";

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
	await expect(
		page.locator(".owner-chart__closed, .owner-chart__missing"),
	).toHaveCount(0);
	await expect(page.locator(".owner-chart__gap-stem")).toHaveCount(4);
	await expect(page.locator(".owner-chart__gap-bracket")).toHaveCount(2);
	await expect(page.locator(".owner-chart__gap-tick")).toHaveCount(4);
	await expect(page.locator(".owner-chart__gap-label")).toHaveCount(2);
	await expect(page.locator(".owner-chart__gap-label").first()).toContainText(
		"1",
	);
	// Human decision 2026-09-05: no zero-square marker. The genuine zero
	// stays truthful through the line at zero plus the Observed table row.
	await expect(page.locator(".owner-chart__zero")).toHaveCount(0);
	// Completed day (2026-07-21), pristine selection: ring on the peak with
	// no stem, no Latest label, and no selected readout — Paper's closed
	// treatment.
	await expect(page.locator(".owner-chart__stem")).toHaveCount(0);
	await expect(page.locator(".owner-chart__latest")).toHaveCount(0);
	await expect(page.locator(".owner-chart-tip")).toHaveCount(0);
	// Paper terminates the line at the marker's OUTER edge: the pristine
	// peak is a lone reading hidden behind its own ring (the HTML core
	// marks it), so only the two connected runs stroke lines and no
	// solo dot remains.
	await expect(page.locator(".owner-chart__line")).toHaveCount(2);
	await expect(page.locator(".owner-chart__solo")).toHaveCount(0);
	await expect(page.locator(".owner-chart__line[data-trimmed]")).toHaveCount(0);
	await expect(page.getByText("تغطية الرصد")).toHaveCount(0);
	await expect(page.locator("body")).not.toContainText(/[٠-٩]/u);

	const chart = page.locator("[data-owner-chart]");
	await expect(chart).toBeVisible();
	const rtlX = Number(
		await page.locator(".owner-chart__active").getAttribute("data-chart-x"),
	);
	expect(rtlX).toBeLessThan(600);
	await chart.focus();
	await expect(chart).toBeFocused();
	await page.keyboard.press("ArrowRight");
	await expect(page.locator("[data-active-reading]")).toContainText("46");
	// First explicit selection exposes Paper's visible readout: stem plus a
	// tooltip card with the reading time and approximate count.
	await expect(page.locator(".owner-chart__stem")).toHaveCount(1);
	await expect(page.locator(".owner-chart-tip")).toBeVisible();
	await expect(page.locator(".owner-chart-tip")).toContainText("46");
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
		await page.locator(".owner-chart__active").getAttribute("data-chart-x"),
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
		await page.locator(".owner-chart__active").getAttribute("data-chart-x"),
	);
	expect(ltrX).toBeGreaterThan(600);
	expect(Math.abs(rtlSelectedX + ltrX - 1200)).toBeLessThan(1);
	await expect(page.getByText("10:00 AM").first()).toBeVisible();
	await expect(page.getByText("3:04 AM").first()).toBeVisible();
	await chart.focus();
	await page.keyboard.press("Home");
	await page.keyboard.press("ArrowRight");
	await expect(page.locator("[data-active-reading]")).toContainText("8");
	// The 8 ends its run (one trimmed side); the middle 31 of run
	// [18, 31, 46] is interior, so both sides trim to the ring.
	await page.keyboard.press("ArrowRight");
	await page.keyboard.press("ArrowRight");
	await expect(page.locator("[data-active-reading]")).toContainText("31");
	await expect(
		page.locator('.owner-chart__line[data-trimmed="left"]'),
	).toHaveCount(1);
	await expect(
		page.locator('.owner-chart__line[data-trimmed="right"]'),
	).toHaveCount(1);
	// No stroked line coordinate may reach the marker center: parse every
	// trimmed and untrimmed path and require daylight around the ring.
	const clearance = await page.evaluate(() => {
		const marker = document.querySelector<HTMLElement>(".owner-chart__active");
		const svg = document.querySelector(".owner-chart");
		if (!marker || !svg) throw new Error("Owner chart is missing");
		const plot = svg.getBoundingClientRect();
		const box = marker.getBoundingClientRect();
		const center = {
			x: box.x + box.width / 2,
			y: box.y + box.height / 2,
		};
		const toScreen = (viewX: number, viewY: number) => ({
			x: plot.x + (viewX / 1200) * plot.width,
			y: plot.y + (viewY / 240) * plot.height,
		});
		let closest = Number.POSITIVE_INFINITY;
		for (const line of document.querySelectorAll(".owner-chart__line")) {
			const pairs = [
				...(line.getAttribute("d") ?? "").matchAll(/(-?[\d.]+),(-?[\d.]+)/g),
			];
			for (const pair of pairs) {
				const screen = toScreen(Number(pair[1]), Number(pair[2]));
				closest = Math.min(
					closest,
					Math.hypot(screen.x - center.x, screen.y - center.y),
				);
			}
		}
		const stem = document.querySelector(".owner-chart__stem");
		const stemTop = stem ? Number(stem.getAttribute("y1")) : null;
		const stemScreen =
			stemTop === null ? null : toScreen(0, stemTop).y - toScreen(0, 0).y;
		return {
			closest,
			markerRadius: box.width / 2,
			stemGap:
				stemScreen === null ? null : stemScreen - (center.y - toScreen(0, 0).y),
		};
	});
	// The closest line coordinate stays outside the ring (2px tolerance
	// covers antialiasing); the stem resumes at the ring's bottom edge.
	expect(clearance.closest).toBeGreaterThan(clearance.markerRadius - 2);
	if (clearance.stemGap !== null) {
		expect(clearance.stemGap).toBeGreaterThanOrEqual(
			clearance.markerRadius - 3,
		);
		expect(clearance.stemGap).toBeLessThanOrEqual(clearance.markerRadius + 3);
	}
	// Paint-level junction (Paper outer-edge treatment): trimmed sides meet
	// the ring with butt caps on straight radial tips, so no round cap or
	// smoothing bow paints past the outer edge toward the core. The active
	// stem likewise starts with a butt cap on the ring edge.
	const junction = await page.evaluate(() => {
		const capOf = (selector: string) => {
			const element = document.querySelector(selector);
			return element ? getComputedStyle(element).strokeLinecap : null;
		};
		const left = document.querySelector(
			'.owner-chart__line[data-trimmed="left"]',
		);
		const right = document.querySelector(
			'.owner-chart__line[data-trimmed="right"]',
		);
		return {
			leftCap: capOf('.owner-chart__line[data-trimmed="left"]'),
			rightCap: capOf('.owner-chart__line[data-trimmed="right"]'),
			stemCap: capOf(".owner-chart__stem"),
			leftD: left?.getAttribute("d") ?? "",
			rightD: right?.getAttribute("d") ?? "",
		};
	});
	expect(junction.leftCap).toBe("butt");
	expect(junction.rightCap).toBe("butt");
	if (junction.stemCap !== null) expect(junction.stemCap).toBe("butt");
	expect(junction.leftD.trimEnd()).toMatch(/L-?[\d.]+,-?[\d.]+$/);
	expect(junction.rightD).toMatch(/^M-?[\d.]+,-?[\d.]+ L-?[\d.]+,-?[\d.]+/);
	await captureReview(page, "owner-analytics-en-1440.png");
});

test("latest-day captions stay associated with their points and the section row stays transparent", async ({
	page,
}) => {
	const todayNewYork = new Intl.DateTimeFormat("en-CA", {
		timeZone: "America/New_York",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(new Date());
	await mockOwnerAnalytics(page, { ...mixedDaily, businessDay: todayNewYork });

	for (const viewport of [
		{ width: 390, height: 844 },
		{ width: 1440, height: 900 },
	] as const) {
		await page.setViewportSize(viewport);
		await page.goto("/admin");
		await expect(page.locator(".owner-chart__latest")).toBeVisible();

		// Variant B: the six-destination row stays fully transparent over
		// the page wash; only the Paper divider and active-tab underline
		// carry the row structure.
		const tabs = page.locator(
			".owner-section-switch > .owner-analytics-mode__tabs",
		);
		await expect(tabs).toBeVisible();
		expect(
			await tabs.evaluate(
				(element) => getComputedStyle(element).backgroundColor,
			),
		).toBe("rgba(0, 0, 0, 0)");
		expect(
			await tabs.evaluate(
				(element) => getComputedStyle(element).backgroundImage,
			),
		).toBe("none");
		expect(
			await tabs.evaluate(
				(element) => getComputedStyle(element).borderBottomWidth,
			),
		).not.toBe("0px");
		expect(
			await page
				.locator('[role="tab"][aria-selected="true"]')
				.evaluate((element) => getComputedStyle(element).boxShadow),
		).toContain("inset");

		// Every caption box stays inside its own row container.
		const interactionBox = await page
			.locator(".owner-chart-interaction")
			.boundingBox();
		const plotBox = await page.locator(".owner-chart-plot").boundingBox();
		const axisBox = await page.locator(".owner-chart-x-axis").boundingBox();
		if (!interactionBox || !plotBox || !axisBox)
			throw new Error("Owner chart has no bounding box");
		for (const locator of [
			page.locator(".owner-chart__latest"),
			...(await page.locator(".owner-chart__gap-label").all()),
		]) {
			const box = await locator.boundingBox();
			if (!box) continue; // Mobile hides desktop gap labels by design.
			expect(box.x).toBeGreaterThanOrEqual(interactionBox.x - 1);
			expect(box.x + box.width).toBeLessThanOrEqual(
				interactionBox.x + interactionBox.width + 1,
			);
		}
		for (const tick of await page.locator(".owner-chart-x-axis span").all()) {
			const box = await tick.boundingBox();
			if (!box || box.width === 0) continue;
			expect(box.x).toBeGreaterThanOrEqual(plotBox.x - 1);
			expect(box.x + box.width).toBeLessThanOrEqual(
				plotBox.x + plotBox.width + 1,
			);
		}

		// The Latest caption always covers its own stem x: the marker
		// center falls inside the caption box, so the label cannot read as
		// attached to a different point.
		const markerBox = await page.locator(".owner-chart__active").boundingBox();
		const latestBox = await page.locator(".owner-chart__latest").boundingBox();
		if (!markerBox || !latestBox)
			throw new Error("Latest marker or caption is missing");
		const markerCenterX = markerBox.x + markerBox.width / 2;
		expect(markerCenterX).toBeGreaterThanOrEqual(latestBox.x - 2);
		expect(markerCenterX).toBeLessThanOrEqual(
			latestBox.x + latestBox.width + 2,
		);

		// Each gap-duration caption covers its own bracket midpoint.
		const stemXs = await page
			.locator(".owner-chart__gap-stem")
			.evaluateAll((elements) =>
				elements.map((element) => Number(element.getAttribute("x1"))),
			);
		const gapLabels = page.locator(".owner-chart__gap-label");
		const gapCount = await gapLabels.count();
		for (let index = 0; index < gapCount; index += 1) {
			const box = await gapLabels.nth(index).boundingBox();
			if (!box) continue; // Mobile hides desktop gap labels by design.
			const midpointViewBox =
				(Number(stemXs[index * 2]) + Number(stemXs[index * 2 + 1])) / 2;
			const anchorX = plotBox.x + (midpointViewBox / 1200) * plotBox.width;
			expect(anchorX).toBeGreaterThanOrEqual(box.x - 3);
			expect(anchorX).toBeLessThanOrEqual(box.x + box.width + 3);
		}

		// On desktop the anchors are far enough apart that the Latest
		// caption and the gap captions must not share any pixels.
		if (viewport.width > 720 && latestBox) {
			for (let index = 0; index < gapCount; index += 1) {
				const box = await gapLabels.nth(index).boundingBox();
				if (!box) continue;
				const overlapX =
					Math.min(latestBox.x + latestBox.width, box.x + box.width) -
					Math.max(latestBox.x, box.x);
				const overlapY =
					Math.min(latestBox.y + latestBox.height, box.y + box.height) -
					Math.max(latestBox.y, box.y);
				expect(overlapX <= 0 || overlapY <= 0).toBe(true);
			}
		}
	}

	await page
		.getByRole("button", { name: "التبديل إلى اللغة الإنجليزية" })
		.click();
	await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/admin");
	await expect(page.locator(".owner-chart__latest")).toBeVisible();
	await expect(page.locator(".owner-chart__latest")).toContainText("Latest");
	const enMarkerBox = await page.locator(".owner-chart__active").boundingBox();
	const enLatestBox = await page.locator(".owner-chart__latest").boundingBox();
	if (!enMarkerBox || !enLatestBox)
		throw new Error("Latest marker or caption is missing");
	const enMarkerCenterX = enMarkerBox.x + enMarkerBox.width / 2;
	expect(enMarkerCenterX).toBeGreaterThanOrEqual(enLatestBox.x - 2);
	expect(enMarkerCenterX).toBeLessThanOrEqual(
		enLatestBox.x + enLatestBox.width + 2,
	);
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
			const marker = page.locator(".owner-chart__active");
			const markerBox = await marker.boundingBox();
			expect(markerBox?.width).toBe(markerBox?.height);
			// Paper ring anatomy: 20px desktop, 18px mobile, hollow field.
			expect(markerBox?.width).toBe(width <= 720 ? 18 : 20);
			expect(
				await marker.evaluate(
					(element) => getComputedStyle(element).borderColor,
				),
			).toBe("rgb(229, 25, 53)");
			expect(
				await marker.evaluate(
					(element) => getComputedStyle(element).backgroundColor,
				),
			).toBe("rgba(0, 0, 0, 0)");
			// Paper marker anatomy: the solid core stays concentric with the
			// ring in both directions. A logical inline-start offset leaves
			// `left` as `auto` in RTL and shifts the core half its own size;
			// the core center must therefore coincide with the ring center
			// (1px tolerance covers used-value serialization rounding).
			const coreGeometry = await marker.evaluate((element) => {
				const ring = getComputedStyle(element);
				const core = getComputedStyle(element, "::after");
				return {
					ringWidth: Number.parseFloat(ring.width),
					ringHeight: Number.parseFloat(ring.height),
					coreWidth: Number.parseFloat(core.width),
					coreHeight: Number.parseFloat(core.height),
					coreLeft: core.left,
					coreTop: core.top,
				};
			});
			expect(coreGeometry.coreLeft).not.toBe("auto");
			expect(
				Math.abs(
					Number.parseFloat(coreGeometry.coreLeft) +
						coreGeometry.coreWidth / 2 -
						coreGeometry.ringWidth / 2,
				),
			).toBeLessThanOrEqual(1);
			expect(
				Math.abs(
					Number.parseFloat(coreGeometry.coreTop) +
						coreGeometry.coreHeight / 2 -
						coreGeometry.ringHeight / 2,
				),
			).toBeLessThanOrEqual(1);
			// Paper gap language is viewport-specific: desktop shows the
			// dimension bracket, ticks, and duration label; mobile shows the
			// dashed stems only. SVG lines have empty geometric boxes, so the
			// rule is asserted through computed display, not visibility.
			const gapBracketDisplay = await page
				.locator(".owner-chart__gap-bracket")
				.first()
				.evaluate((element) => getComputedStyle(element).display);
			const gapLabelDisplay = await page
				.locator(".owner-chart__gap-label")
				.first()
				.evaluate((element) => getComputedStyle(element).display);
			const gapStemDisplay = await page
				.locator(".owner-chart__gap-stem")
				.first()
				.evaluate((element) => getComputedStyle(element).display);
			if (width <= 720) {
				expect(gapBracketDisplay).toBe("none");
				expect(gapLabelDisplay).toBe("none");
			} else {
				expect(gapBracketDisplay).not.toBe("none");
				expect(gapLabelDisplay).not.toBe("none");
			}
			expect(gapStemDisplay).not.toBe("none");

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
	let releaseError!: () => void;
	const errorGate = new Promise<void>((resolve) => {
		releaseError = resolve;
	});
	let mode: "error" | "missing" | "closed" = "error";
	await page.route("**/rpc/admin/analytics/daily", async (route) => {
		if (mode === "error") {
			await errorGate;
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
	try {
		await expect(page.getByRole("status")).toContainText(
			"جارٍ تحميل قراءات اليوم",
		);
		await expect(
			page.getByRole("heading", {
				level: 1,
				name: "جارٍ تحميل قراءات اليوم",
			}),
		).toBeVisible();
		await expect(page.locator("main h1:visible")).toHaveCount(1);
		const brandMark = await expectOfficialBrandMark(page, ".owner-rail__brand");
		await captureReview(page, "owner-analytics-loading-ar-1440.png");
		await expect(brandMark).toBeVisible();
	} finally {
		releaseError();
	}
	await expect(page.getByRole("alert")).toContainText(
		"تعذر تحميل قراءات اليوم",
	);
	await expect(
		page.getByRole("heading", { level: 1, name: "تعذر تحميل قراءات اليوم" }),
	).toBeVisible();
	await expect(page.locator("main h1:visible")).toHaveCount(1);
	await expect(page.getByText("لا توجد قراءات اليوم بعد")).toHaveCount(0);
	await captureReview(page, "owner-analytics-error-ar-1440.png");
	await expect(page.locator(".owner-rail__brand img")).toBeVisible();

	mode = "missing";
	await page.getByRole("button", { name: "إعادة المحاولة" }).click();
	await expect(page.getByText("لا توجد قراءات اليوم بعد")).toBeVisible();
	await captureReview(page, "owner-analytics-no-observed-ar-1440.png");

	mode = "closed";
	await page.reload();
	await expect(
		page.getByRole("heading", { name: "النادي مغلق اليوم" }),
	).toBeVisible();
	await expect(page.getByText("لا توجد قراءات اليوم بعد")).toHaveCount(0);
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
	await expect(page.getByRole("alert")).toContainText(
		"تعذر تحميل قراءات اليوم",
	);

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
	const navigation = await page.getByRole("tablist").boundingBox();
	const board = await page.locator(".owner-analytics-board").boundingBox();
	expect(navigation).not.toBeNull();
	expect(board).not.toBeNull();
	if (!navigation || !board)
		throw new Error("Missing navigation or summary board");
	expect(navigation.y + navigation.height).toBeLessThanOrEqual(board.y);

	await expect(
		page.getByRole("heading", { name: "التحليلات اليومية" }),
	).toBeVisible();
	await captureReview(page, "owner-analytics-ar-200-percent-reflow.png");
});

test("canonical routed Owner Daily desktop Arabic and mobile English are captured for authority review", async ({
	page,
}) => {
	await mockOwnerAnalytics(page);
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/admin");
	await expect(
		page.getByRole("heading", { name: "التحليلات اليومية" }),
	).toBeVisible();
	await captureReview(page, "owner-daily-route-ar-desktop-1440x900.png");
	await expect(page).toHaveScreenshot(
		"owner-daily-route-ar-desktop-1440x900.png",
		{ fullPage: true },
	);

	await page
		.getByRole("button", { name: "التبديل إلى اللغة الإنجليزية" })
		.click();
	await page.setViewportSize({ width: 390, height: 844 });
	await expect(
		page.getByRole("heading", { name: "Daily analytics" }),
	).toBeVisible();
	await captureReview(page, "owner-daily-route-en-mobile-390x844.png");
	await expect(page).toHaveScreenshot(
		"owner-daily-route-en-mobile-390x844.png",
		{ fullPage: true },
	);
});
