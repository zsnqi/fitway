import { mkdir } from "node:fs/promises";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const owner = {
	principalId: "00000000-0000-4000-8000-000000000091",
	principalKind: "owner",
	role: "owner",
	sessionId: "00000000-0000-4000-8000-000000000092",
	expiresAt: "2026-08-22T00:00:00.000Z",
	active: true,
} as const;

const timeZone = "Asia/Riyadh";
const weekdays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

const daily = {
	businessDay: "2026-08-14",
	timeline: [
		{
			state: "value",
			minuteStartUtc: "2026-08-14T07:00:00.000Z",
			count: 12,
			entries: 12,
			exits: 0,
			band: "quiet",
			capacitySnapshot: 100,
			settingsVersion: 11,
			source: "live",
		},
	],
	peak: {
		minuteStartUtc: "2026-08-14T07:00:00.000Z",
		count: 12,
		band: "quiet",
		capacitySnapshot: 100,
		settingsVersion: 11,
	},
	dailyAverage: 12,
	estimatedEntranceCrossings: 12,
	observedOpenMinutes: 1,
	expectedOpenMinutes: 1,
	coverage: 1,
} as const;

function heatmap() {
	return {
		startBusinessDay: "2026-07-18",
		endBusinessDay: "2026-08-14",
		cells: weekdays.flatMap((weekday) =>
			Array.from({ length: 24 }, (_unused, localHour) => {
				const special = `${weekday}:${localHour}`;
				if (special === "sun:6") {
					return {
						weekday,
						localHour,
						state: "value",
						averageOccupancy: 0,
						observedOpenMinutes: 60,
						expectedOpenMinutes: 60,
						sampleDayCount: 4,
					};
				}
				if (special === "mon:8") {
					return {
						weekday,
						localHour,
						state: "missing",
						averageOccupancy: null,
						observedOpenMinutes: 0,
						expectedOpenMinutes: 60,
						sampleDayCount: 0,
					};
				}
				if (special === "tue:9") {
					return {
						weekday,
						localHour,
						state: "closed",
						averageOccupancy: null,
						observedOpenMinutes: 0,
						expectedOpenMinutes: 0,
						sampleDayCount: 0,
					};
				}
				return {
					weekday,
					localHour,
					state: "value",
					averageOccupancy: localHour === 9 ? 40 : 12,
					observedOpenMinutes: 60,
					expectedOpenMinutes: 60,
					sampleDayCount: 4,
				};
			}),
		),
	};
}

const weeks = {
	currentWeek: {
		startBusinessDay: "2026-08-02",
		endBusinessDay: "2026-08-08",
		averageOccupancy: 34.6,
		estimatedEntranceCrossings: 3497,
		observedOpenMinutes: 3884,
		expectedOpenMinutes: 4200,
		coverage: 3884 / 4200,
	},
	priorWeek: {
		startBusinessDay: "2026-07-26",
		endBusinessDay: "2026-08-01",
		averageOccupancy: 31.8,
		estimatedEntranceCrossings: 3284,
		observedOpenMinutes: 3612,
		expectedOpenMinutes: 4200,
		coverage: 3612 / 4200,
	},
} as const;

const insufficient = {
	state: "insufficient_history",
	minimumCoverage: 0.8,
	...weeks,
	reasons: ["prior_week_coverage_below_minimum"],
} as const;

function rpcError(status: number) {
	return {
		json: null,
		error: {
			json: {
				status,
				code: "SERVICE_UNAVAILABLE",
				message: "Service Unavailable",
				data: null,
			},
		},
	};
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

async function mockOwnerRoute(
	page: Page,
	options: {
		heatmapDelayMs?: number;
		heatmapStatus?: number;
		comparison?: typeof insufficient;
		csvMode?: "pending" | "error";
	} = {},
) {
	await page.route("**/rpc/admin/session", (route) =>
		route.fulfill({ status: 200, json: { json: owner } }),
	);
	await page.route("**/rpc/admin/analytics/daily", (route) =>
		route.fulfill({ status: 200, json: { json: daily } }),
	);
	await page.route("**/rpc/admin/analytics/timeContext", (route) =>
		route.fulfill({
			status: 200,
			json: {
				json: {
					current: { settingsVersion: 11, timeZone },
					versions: (
						route.request().postDataJSON()?.json?.settingsVersions ?? []
					).map((settingsVersion: number) => ({ settingsVersion, timeZone })),
				},
			},
		}),
	);
	// These are neighbours on /admin. Keeping them fulfilled proves the reporting
	// fixture does not get a green page by removing accepted owner surfaces.
	await page.route("**/rpc/admin/audit/list", (route) =>
		route.fulfill({
			status: 200,
			json: { json: { entries: [], nextCursor: null } },
		}),
	);
	await page.route("**/rpc/admin/health/summary", (route) =>
		route.fulfill({ status: 503, json: rpcError(503) }),
	);
	await page.route("**/rpc/admin/analytics/heatmap", async (route) => {
		if (options.heatmapDelayMs) {
			await new Promise((resolve) =>
				setTimeout(resolve, options.heatmapDelayMs),
			);
		}
		if (options.heatmapStatus) {
			await route.fulfill({
				status: options.heatmapStatus,
				json: rpcError(options.heatmapStatus),
			});
			return;
		}
		await route.fulfill({ status: 200, json: { json: heatmap() } });
	});
	await page.route("**/rpc/admin/analytics/weekOverWeek", (route) =>
		route.fulfill({
			status: 200,
			json: { json: options.comparison ?? insufficient },
		}),
	);
	await page.route("**/rpc/admin/analytics/csv", async (route) => {
		if (options.csvMode === "pending") {
			await new Promise(() => undefined);
			return;
		}
		await route.fulfill({ status: 503, json: rpcError(503) });
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
	const overflow = await page.evaluate(() => {
		const reporting = document.querySelector<HTMLElement>(".owner-reporting");
		return {
			document: document.documentElement.scrollWidth - window.innerWidth,
			body: document.body.scrollWidth - window.innerWidth,
			reporting: (reporting?.scrollWidth ?? 0) - (reporting?.clientWidth ?? 0),
		};
	});
	expect(overflow.document).toBeLessThanOrEqual(0);
	expect(overflow.body).toBeLessThanOrEqual(0);
	expect(overflow.reporting).toBeLessThanOrEqual(0);
}

function seriousViolations(
	results: Awaited<ReturnType<AxeBuilder["analyze"]>>,
) {
	return results.violations.filter(
		({ impact }) => impact === "serious" || impact === "critical",
	);
}

test("Arabic RTL and English LTR preserve semantic reporting states and owner siblings", async ({
	page,
}) => {
	await mockOwnerRoute(page);
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/admin");
	const reporting = page.locator(".owner-reporting");
	await expect(reporting).toBeVisible();
	await expect(page.locator("[data-owner-chart]")).toBeVisible();
	await expect(page.locator(".owner-audit")).toBeVisible();

	for (const locale of ["ar", "en"] as const) {
		await setLocale(page, locale);
		const labels =
			locale === "ar"
				? ["مفتوحة وفارغة", "لا توجد بيانات", "مغلقة"]
				: ["Open and empty", "No data", "Closed"];
		for (const label of labels) {
			await expect(reporting.locator(".owner-reporting-cell")).toHaveCount(168);
			expect(
				await reporting
					.locator(`.owner-reporting-cell[aria-label*="${label}"]`)
					.count(),
			).toBeGreaterThan(0);
		}
		await expect(
			reporting.locator(
				"[data-owner-reporting-comparison='insufficient_history']",
			),
		).toBeVisible();
		await expect(
			reporting.locator("[data-owner-reporting-reading]"),
		).toHaveAttribute("aria-live", "polite");
		await captureReview(page, `phase10-reporting-${locale}-1440x900.png`);
	}
});

test("loading, retryable error, insufficient history, and semantic-table parity are explicit", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await mockOwnerRoute(page, { heatmapDelayMs: 450 });
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/admin");
	const reporting = page.locator(".owner-reporting");
	await expect(page.locator("[data-owner-health-state='error']")).toBeVisible();
	await expect(
		reporting.locator("[data-owner-reporting-state='loading']"),
	).toBeVisible();
	await expect(
		reporting.locator("[data-owner-reporting-state='loading']"),
	).toHaveAttribute("role", "status");
	await expect(reporting.locator("[data-owner-reporting-grid]")).toBeVisible();

	await page.unroute("**/rpc/admin/analytics/heatmap");
	await page.route("**/rpc/admin/analytics/heatmap", (route) =>
		route.fulfill({ status: 503, json: rpcError(503) }),
	);
	const reportRange = reporting.locator("[data-owner-reporting-range]");
	await reportRange.getByLabel("Last business day").fill("2026-08-13");
	await reportRange.locator("button[type='submit']").click();
	const error = reporting.locator("[data-owner-reporting-state='error']");
	await expect(error).toBeVisible();
	await expect(error).toHaveAttribute("role", "alert");

	await page.unroute("**/rpc/admin/analytics/heatmap");
	await page.route("**/rpc/admin/analytics/heatmap", (route) =>
		route.fulfill({ status: 200, json: { json: heatmap() } }),
	);
	await error.getByRole("button", { name: "Try again" }).click();
	await expect(reporting.locator("[data-owner-reporting-grid]")).toBeVisible();

	await reporting.locator(".owner-reporting-disclosure summary").click();
	const table = reporting.locator("[data-owner-reporting-table]");
	await expect(table.locator("tbody tr")).toHaveCount(168);
	await expect(table.locator("tr[data-zero]")).toHaveCount(1);
	await expect(table.locator("tr[data-state='missing']")).toHaveCount(1);
	await expect(table.locator("tr[data-state='closed']")).toHaveCount(1);
	await captureReview(page, "phase10-reporting-states-en-390x844.png");
});

test("CSV export visibly starts, cancels without a file, and reports a transport failure", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await mockOwnerRoute(page, { csvMode: "pending" });
	await page.setViewportSize({ width: 768, height: 1024 });
	await page.goto("/admin");
	const reporting = page.locator(".owner-reporting");
	const exportBlock = reporting.locator("[data-owner-reporting-export]");
	await expect(exportBlock).toBeVisible();
	await exportBlock.locator("[data-owner-reporting-export-start]").click();
	await expect(
		exportBlock.locator("[data-owner-reporting-export-abort]"),
	).toBeVisible();
	await expect(
		exportBlock.locator("[data-owner-reporting-state='loading']"),
	).toBeVisible();
	await exportBlock.locator("[data-owner-reporting-export-abort]").click();
	await expect(
		exportBlock.locator("[data-owner-reporting-state='stopped']"),
	).toBeVisible();
	expect(
		await exportBlock.locator("[data-owner-reporting-download]").count(),
	).toBe(0);

	await page.unroute("**/rpc/admin/analytics/csv");
	await page.route("**/rpc/admin/analytics/csv", (route) =>
		route.fulfill({ status: 503, json: rpcError(503) }),
	);
	await exportBlock.getByRole("button", { name: "Start over" }).click();
	await exportBlock.locator("[data-owner-reporting-export-start]").click();
	await expect(
		exportBlock.locator("[data-owner-reporting-state='error']"),
	).toBeVisible();
	await expect(
		exportBlock.locator("[data-owner-reporting-download]"),
	).toHaveCount(0);
	await captureReview(page, "phase10-reporting-export-en-768x1024.png");
});

test("reflow, focus, keyboard, live names, reduced motion, and automated accessibility hold", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await mockOwnerRoute(page);
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto("/admin");
	const reporting = page.locator(".owner-reporting");
	for (const locale of ["en", "ar"] as const) {
		await setLocale(page, locale);
		for (const width of [320, 360, 390, 721, 768, 820, 1024, 1200, 1440]) {
			await page.setViewportSize({ width, height: 900 });
			await expect(
				reporting.locator("[data-owner-reporting-grid]"),
			).toBeVisible();
			await expectNoOverflow(page);
		}
	}

	await page.setViewportSize({ width: 768, height: 1024 });
	const activeCell = reporting.locator(".owner-reporting-cell[tabindex='0']");
	await expect(activeCell).toHaveCount(1);
	await activeCell.focus();
	await expect(activeCell).toBeFocused();
	await page.keyboard.press("ArrowRight");
	await expect(
		reporting.locator(".owner-reporting-cell[tabindex='0']"),
	).toHaveCount(1);
	await expect(
		reporting.locator("[data-owner-reporting-reading]"),
	).toContainText(/Average occupancy|متوسط الإشغال/u);
	const focus = await activeCell.evaluate((element) => {
		const style = getComputedStyle(element);
		return style.outlineStyle !== "none" || style.boxShadow !== "none";
	});
	expect(focus).toBe(true);
	expect(
		await page.evaluate(
			() => matchMedia("(prefers-reduced-motion: reduce)").matches,
		),
	).toBe(true);

	await page.evaluate(() => {
		document.documentElement.style.zoom = "2";
	});
	await expectNoOverflow(page);
	await page.evaluate(() => {
		document.documentElement.style.zoom = "1";
	});

	const results = await new AxeBuilder({ page })
		.include(".owner-reporting")
		.analyze();
	expect(seriousViolations(results)).toEqual([]);
	await captureReview(page, "phase10-reporting-a11y-reflow-ar-768x1024.png");
});
