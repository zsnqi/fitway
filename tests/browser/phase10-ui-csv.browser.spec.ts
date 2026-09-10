import { mkdir } from "node:fs/promises";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { expectOfficialBrandMark } from "./helpers/brand";

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

const comparable = {
	state: "comparable",
	minimumCoverage: 0.8,
	...weeks,
	changes: {
		averageOccupancy: { absolute: 2.8, percent: 0.088 },
		estimatedEntranceCrossings: { absolute: 213, percent: 0.065 },
	},
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
	await page.evaluate(() =>
		(document.activeElement as HTMLElement | null)?.blur(),
	);
	await page.addStyleTag({
		content: ".operations-skip-link { display: none !important; }",
	});
	await page.screenshot({
		path: path.join(reviewDirectory, name),
		fullPage: true,
	});
}

async function mockOwnerRoute(
	page: Page,
	options: {
		// The daily response stays unfulfilled until this resolves, so the
		// prerequisite pending state lasts exactly as long as the caller holds it.
		dailyHold?: Promise<void>;
		heatmapDelayMs?: number;
		heatmapStatus?: number;
		comparison?: typeof insufficient | typeof comparable;
		csvMode?: "pending" | "ready" | "error";
		timeContextFailures?: number;
	} = {},
) {
	const calls = {
		daily: 0,
		timeContext: 0,
		heatmap: 0,
		weekOverWeek: 0,
		csv: 0,
	};
	await page.route("**/rpc/admin/session", (route) =>
		route.fulfill({ status: 200, json: { json: owner } }),
	);
	await page.route("**/rpc/admin/analytics/daily", async (route) => {
		calls.daily += 1;
		if (options.dailyHold) {
			await options.dailyHold;
		}
		await route.fulfill({ status: 200, json: { json: daily } });
	});
	await page.route("**/rpc/admin/analytics/timeContext", async (route) => {
		calls.timeContext += 1;
		if (calls.timeContext <= (options.timeContextFailures ?? 0)) {
			await route.fulfill({ status: 503, json: rpcError(503) });
			return;
		}
		await route.fulfill({
			status: 200,
			json: {
				json: {
					current: { settingsVersion: 11, timeZone },
					versions: (
						route.request().postDataJSON()?.json?.settingsVersions ?? []
					).map((settingsVersion: number) => ({ settingsVersion, timeZone })),
				},
			},
		});
	});
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
		calls.heatmap += 1;
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
	await page.route("**/rpc/admin/analytics/weekOverWeek", (route) => {
		calls.weekOverWeek += 1;
		return route.fulfill({
			status: 200,
			json: { json: options.comparison ?? comparable },
		});
	});
	await page.route("**/rpc/admin/analytics/csv", async (route) => {
		calls.csv += 1;
		if (options.csvMode === "pending") {
			await new Promise(() => undefined);
			return;
		}
		if (options.csvMode === "ready") {
			await route.fulfill({
				status: 200,
				headers: { "content-type": "text/event-stream" },
				body: [
					'event: message\ndata: {"json":"﻿business_day,count\\r\\n"}\n\n',
					'event: message\ndata: {"json":"2026-08-14,12\\r\\n"}\n\n',
					"event: done\ndata: {}\n\n",
				].join(""),
			});
			return;
		}
		await route.fulfill({ status: 503, json: rpcError(503) });
	});
	return calls;
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

async function expectNoOverflow(
	page: Page,
	allowReportingRegionOverflow = false,
) {
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
	if (!allowReportingRegionOverflow) {
		expect(overflow.reporting).toBeLessThanOrEqual(0);
	}
}

function seriousViolations(
	results: Awaited<ReturnType<AxeBuilder["analyze"]>>,
) {
	return results.violations.filter(
		({ impact }) => impact === "serious" || impact === "critical",
	);
}

async function activateHistory(page: Page) {
	await page.locator("#owner-analytics-history-tab").click();
	await expect(page.locator("#owner-analytics-history-panel")).toBeVisible();
	await expect(page.locator(".owner-reporting")).toBeVisible();
}

async function fillLocalizedDate(
	page: Page,
	scope: Page | Locator,
	label: string,
	iso: string,
) {
	const [year, month, day] = iso.split("-");
	const field = scope.getByRole("group", { name: label });
	await field.getByLabel("Year").click();
	await page.getByRole("option", { name: year, exact: true }).click();
	await field.getByLabel("Month").click();
	const monthName = new Intl.DateTimeFormat("en-US-u-ca-gregory-nu-latn", {
		month: "long",
		timeZone: "UTC",
	}).format(new Date(Date.UTC(2000, Number(month) - 1, 1)));
	await page.getByRole("option", { name: monthName, exact: true }).click();
	await field.getByLabel("Day").click();
	await page
		.getByRole("option", { name: String(Number(day)), exact: true })
		.click();
}

function localizedDateValue(scope: Page | Locator, label: string) {
	return scope
		.getByRole("group", { name: label })
		.locator("[data-owner-date-value]");
}

/*
 * Default-state density and flow of the two control boards.
 *
 * The approved composition gives each board one heading line, a 12px gap, and then a
 * single field-and-action row; it does not stack a legend, a field block, a hint
 * paragraph and a divided action strip into four rows. The numbers asserted here are the
 * approved board's own: a 22px heading line, a 12px gap, a 63px control row, and — for a
 * board carrying no extra prose — a 131px board. They are read from the rendered boxes,
 * so a return to the stacked control flow fails here rather than only in a screenshot.
 */
async function expectBoardDensity(page: Page, width: number) {
	for (const board of await page
		.locator("[data-owner-reporting-range], [data-owner-reporting-export]")
		.all()) {
		const fields = board.locator(
			"[data-owner-date-field] .owner-date-field__trigger",
		);
		await expect(fields).toHaveCount(6);
		const boxes = await fields.evaluateAll((elements) =>
			elements.map((element) => {
				const box = element.getBoundingClientRect();
				return {
					left: box.left,
					right: box.right,
					top: box.top,
					bottom: box.bottom,
					height: box.height,
				};
			}),
		);
		for (const box of boxes) {
			expect(box.height).toBeGreaterThanOrEqual(44);
			expect(box.left).toBeGreaterThanOrEqual(0);
			expect(box.right).toBeLessThanOrEqual(width);
		}
		const [first, second] = boxes;
		if (!first || !second) throw new Error("Missing date controls");
		expect(
			first.right <= second.left ||
				second.right <= first.left ||
				first.bottom <= second.top ||
				second.bottom <= first.top,
		).toBe(true);
	}
}

async function expectControlLayout(page: Page, width: number) {
	const controls = page.locator("[data-owner-reporting-controls]");
	await expect(
		controls.locator(":scope > [data-owner-reporting-range]"),
	).toHaveCount(1);
	const exportBlock = controls.locator(
		":scope > [data-owner-reporting-export]",
	);
	await expect(exportBlock).toHaveCount(1);
	for (const element of [
		controls.locator("[data-owner-reporting-range]"),
		exportBlock,
	]) {
		const box = await element.boundingBox();
		if (!box) throw new Error("Range/export layout missing");
		expect(box.x).toBeGreaterThanOrEqual(0);
		expect(box.x + box.width).toBeLessThanOrEqual(width);
	}
}

async function expectHeadingLayout(
	page: Page,
	locale: "ar" | "en",
	width: number,
) {
	const heading = page.locator(".owner-reporting-page-heading");
	const title = heading.locator("h1");
	const tablist = page.getByRole("tablist", {
		name: locale === "ar" ? "أقسام الإدارة" : "Management sections",
	});
	const [headingBox, tabsBox] = await Promise.all([
		heading.boundingBox(),
		tablist.boundingBox(),
	]);
	if (!headingBox || !tabsBox) {
		throw new Error("Analytics heading and tabs require layout boxes");
	}
	expect(tabsBox.height).toBe(width <= 900 ? 46 : 48);
	expect(headingBox.y + headingBox.height).toBeLessThanOrEqual(tabsBox.y);
	const typography = await title.evaluate((element) => {
		const style = getComputedStyle(element);
		return { family: style.fontFamily, weight: Number(style.fontWeight) };
	});
	expect(typography.family).toMatch(/Cairo/u);
	expect(typography.weight).toBe(700);
}

test("the lazy bilingual tabs keep exact prerequisite counts and stable panel shells", async ({
	page,
}) => {
	const calls = await mockOwnerRoute(page);
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/admin");
	const tablist = page.getByRole("tablist", { name: "أقسام الإدارة" });
	const dailyTab = page.locator("#owner-analytics-daily-tab");
	const historyTab = page.locator("#owner-analytics-history-tab");
	const dailyPanel = page.locator("#owner-analytics-daily-panel");
	const historyPanel = page.locator("#owner-analytics-history-panel");
	const reporting = page.locator(".owner-reporting");

	await expect(tablist).toBeVisible();
	await expect(tablist.getByRole("tab")).toHaveText([
		"اليومي",
		"التقارير",
		"الوصول",
		"سجل النشاط",
		"التشغيل",
		"الإعدادات",
	]);
	await expect(dailyTab).toHaveAttribute(
		"aria-controls",
		"owner-analytics-daily-panel",
	);
	await expect(historyTab).toHaveAttribute(
		"aria-controls",
		"owner-analytics-history-panel",
	);
	await expect(dailyPanel).toHaveAttribute(
		"aria-labelledby",
		"owner-analytics-daily-tab",
	);
	await expect(historyPanel).toHaveAttribute(
		"aria-labelledby",
		"owner-analytics-history-tab",
	);
	await expect(dailyTab).toHaveAttribute("aria-selected", "true");
	await expect(dailyTab).toHaveAttribute("tabindex", "0");
	await expect(historyTab).toHaveAttribute("tabindex", "-1");
	await expect(dailyPanel).toBeVisible();
	await expect(historyPanel).toBeHidden();
	await expect(historyPanel).toBeEmpty();
	await expect(reporting).toHaveCount(0);
	await expect.poll(() => calls.daily).toBe(1);
	await expect.poll(() => calls.timeContext).toBe(1);
	expect(calls.heatmap).toBe(0);
	expect(calls.weekOverWeek).toBe(0);
	expect(calls.csv).toBe(0);
	await expect(page.locator("[data-owner-chart]")).toBeVisible();
	await expect(page.locator(".owner-audit")).toHaveCount(0);
	await expect(page.locator(".owner-health")).toHaveCount(0);

	const tablistBox = await tablist.boundingBox();
	const dailyTabBox = await dailyTab.boundingBox();
	const historyTabBox = await historyTab.boundingBox();
	expect(tablistBox?.width).toBeGreaterThanOrEqual(1200);
	expect(tablistBox?.height).toBe(48);
	expect(dailyTabBox?.width).toBeGreaterThan(150);
	expect(dailyTabBox?.height).toBe(48);
	expect(historyTabBox?.width).toBeGreaterThan(150);
	expect(historyTabBox?.height).toBe(48);
	await historyTab.focus();
	await page.keyboard.press("ArrowRight");
	await expect(dailyTab).toBeFocused();
	await expect(dailyTab).toHaveAttribute("aria-selected", "true");
	await page.keyboard.press("ArrowLeft");
	await expect(historyTab).toBeFocused();
	await expect(historyTab).toHaveAttribute("aria-selected", "true");
	await expect(historyPanel).toBeVisible();
	await expect(dailyPanel).toBeHidden();
	await expect(reporting).toBeVisible();
	await expect.poll(() => calls.heatmap).toBe(1);
	await expect.poll(() => calls.weekOverWeek).toBe(1);
	expect(calls.daily).toBe(1);
	expect(calls.timeContext).toBe(1);

	for (const locale of ["ar", "en"] as const) {
		await setLocale(page, locale);
		await expect(
			page.getByRole("tablist", {
				name: locale === "ar" ? "أقسام الإدارة" : "Management sections",
			}),
		).toBeVisible();
		await expect(page.getByRole("tablist").getByRole("tab")).toHaveText(
			locale === "ar"
				? ["اليومي", "التقارير", "الوصول", "سجل النشاط", "التشغيل", "الإعدادات"]
				: [
						"Daily",
						"Reports",
						"Access",
						"Activity Log",
						"Operations",
						"Settings",
					],
		);
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
			reporting.locator("[data-owner-reporting-comparison='comparable']"),
		).toBeVisible();
		await expect(
			reporting.locator("[data-owner-reporting-reading]"),
		).toHaveAttribute("aria-live", "polite");
		await captureReview(page, `phase10-reporting-${locale}-1440x900.png`);
	}

	await dailyTab.click();
	await expect(dailyPanel).toBeVisible();
	await expect(historyPanel).toBeHidden();
	await historyTab.click();
	await expect(reporting).toBeVisible();
	expect(calls.daily).toBe(1);
	expect(calls.timeContext).toBe(1);
	expect(calls.heatmap).toBe(1);
	expect(calls.weekOverWeek).toBe(1);
	expect(calls.csv).toBe(0);
});

test("History exposes prerequisite pending, error, and one deliberate retry chain", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	let releaseDaily!: () => void;
	const calls = await mockOwnerRoute(page, {
		dailyHold: new Promise<void>((resolve) => {
			releaseDaily = resolve;
		}),
		timeContextFailures: 1,
	});
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/admin");
	await page.locator("#owner-analytics-history-tab").click();
	const reporting = page.locator(".owner-reporting");
	const loading = reporting.locator("[data-owner-reporting-state='loading']");
	// The daily response is still withheld, so the prerequisite pending state is
	// held open until the release below instead of racing a mock delay.
	await expect(loading).toBeVisible();
	await expect(loading).toHaveAttribute("role", "status");
	await expect(
		page.getByRole("heading", { level: 1, name: "Reports" }),
	).toBeVisible();
	await expect(page.locator("main h1:visible")).toHaveCount(1);
	await expectOfficialBrandMark(page, ".owner-rail__brand");
	await page.evaluate(() => document.fonts.ready);
	await captureReview(
		page,
		"owner-history-loading-route-en-mobile-390x844.png",
	);
	expect(calls.heatmap).toBe(0);
	expect(calls.weekOverWeek).toBe(0);
	expect(calls.csv).toBe(0);

	releaseDaily();
	const error = reporting.locator("[data-owner-reporting-state='error']");
	await expect(error).toBeVisible();
	await expect(error).toHaveAttribute("role", "alert");
	await expect(
		page.getByRole("heading", { level: 1, name: "Reports" }),
	).toBeVisible();
	await expect(page.locator("main h1:visible")).toHaveCount(1);
	await page.evaluate(() => document.fonts.ready);
	await captureReview(page, "owner-history-error-route-en-mobile-390x844.png");
	await expect.poll(() => calls.daily).toBe(1);
	await expect.poll(() => calls.timeContext).toBe(1);
	await page.waitForTimeout(150);
	expect(calls.daily).toBe(1);
	expect(calls.timeContext).toBe(1);
	expect(calls.heatmap).toBe(0);
	expect(calls.weekOverWeek).toBe(0);

	await error.getByRole("button", { name: "Try again" }).click();
	await expect(reporting.locator("[data-owner-reporting-grid]")).toBeVisible();
	await expect.poll(() => calls.daily).toBe(2);
	await expect.poll(() => calls.timeContext).toBe(2);
	await expect.poll(() => calls.heatmap).toBe(1);
	await expect.poll(() => calls.weekOverWeek).toBe(1);
	expect(calls.csv).toBe(0);
});

test("loading, retryable error, insufficient history, and semantic-table parity are explicit", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await mockOwnerRoute(page, {
		heatmapDelayMs: 450,
		comparison: insufficient,
	});
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/admin");
	await activateHistory(page);
	const reporting = page.locator(".owner-reporting");
	// Daily remains mounted to preserve its query and UI state, but its accepted
	// siblings are correctly hidden while the History panel is selected.
	await expect(page.locator("[data-owner-health-state='error']")).toBeHidden();
	const loading = reporting.locator("[data-owner-reporting-state='loading']");
	await expect(loading).toBeVisible();
	await expect(loading).toHaveAttribute("role", "status");
	expect(
		await reporting.evaluate((element) => {
			const controls = element.querySelector("[data-owner-reporting-controls]");
			const firstDataBlock = element.querySelector(
				":scope > .owner-reporting-block",
			);
			return Boolean(
				controls &&
					firstDataBlock &&
					controls.compareDocumentPosition(firstDataBlock) &
						Node.DOCUMENT_POSITION_FOLLOWING,
			);
		}),
	).toBe(true);
	await expect(reporting.locator("[data-owner-reporting-grid]")).toBeVisible();

	await page.unroute("**/rpc/admin/analytics/heatmap");
	await page.route("**/rpc/admin/analytics/heatmap", (route) =>
		route.fulfill({ status: 503, json: rpcError(503) }),
	);
	const reportRange = reporting.locator("[data-owner-reporting-range]");
	await fillLocalizedDate(page, reportRange, "End", "2026-08-13");
	await reportRange.locator("button[type='submit']").click();
	const error = reporting.locator("[data-owner-reporting-state='error']");
	await expect(error).toBeVisible();
	await expect(error).toHaveAttribute("role", "alert");
	expect(
		await reporting.evaluate((element) => {
			const controls = element.querySelector("[data-owner-reporting-controls]");
			const error = element.querySelector(
				':scope > .owner-reporting-block [data-owner-reporting-state="error"]',
			);
			return Boolean(
				controls &&
					error &&
					controls.compareDocumentPosition(error) &
						Node.DOCUMENT_POSITION_FOLLOWING,
			);
		}),
	).toBe(true);

	await page.unroute("**/rpc/admin/analytics/heatmap");
	await page.route("**/rpc/admin/analytics/heatmap", (route) =>
		route.fulfill({ status: 200, json: { json: heatmap() } }),
	);
	await error.getByRole("button", { name: "Try again" }).click();
	await expect(reporting.locator("[data-owner-reporting-grid]")).toBeVisible();
	const selectedCell = reporting.locator(".owner-reporting-cell").nth(25);
	await selectedCell.click();
	const selectedLabel = await selectedCell.getAttribute("aria-label");
	await page.locator("#owner-analytics-daily-tab").click();
	await page.locator("#owner-analytics-history-tab").click();
	await expect(localizedDateValue(reportRange, "End")).toHaveValue(
		"2026-08-13",
	);
	await expect(
		reporting.locator(".owner-reporting-cell[data-active]"),
	).toHaveAttribute("aria-label", selectedLabel ?? "missing");

	const table = reporting.locator("[data-owner-reporting-table]");
	await expect(table).toBeVisible();
	await expect(table.locator("tbody tr")).toHaveCount(168);
	await expect(table.locator("tr[data-zero]")).toHaveCount(1);
	await expect(table.locator("tr[data-state='missing']")).toHaveCount(1);
	await expect(table.locator("tr[data-state='closed']")).toHaveCount(1);
	await captureReview(page, "phase10-reporting-states-en-390x844.png");
	await reporting.getByRole("button", { name: "Last 28 days" }).click();
	await expect(localizedDateValue(reportRange, "Start")).toHaveValue(
		"2026-07-18",
	);
	await expect(localizedDateValue(reportRange, "End")).toHaveValue(
		"2026-08-14",
	);
});

test("CSV export visibly starts, cancels without a file, and reports a transport failure", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	const calls = await mockOwnerRoute(page, { csvMode: "pending" });
	await page.setViewportSize({ width: 768, height: 1024 });
	await page.goto("/admin");
	await activateHistory(page);
	const reporting = page.locator(".owner-reporting");
	const exportBlock = reporting.locator("[data-owner-reporting-export]");
	await expect(exportBlock).toBeVisible();
	await fillLocalizedDate(page, exportBlock, "Start", "2026-08-10");
	await exportBlock.locator("[data-owner-reporting-export-start]").click();
	await expect(
		exportBlock.locator("[data-owner-reporting-export-abort]"),
	).toBeVisible();
	await expect(
		exportBlock.locator("[data-owner-reporting-state='loading']"),
	).toBeVisible();
	await page.locator("#owner-analytics-daily-tab").click();
	await expect(page.locator("#owner-analytics-history-panel")).toBeHidden();
	await page.locator("#owner-analytics-history-tab").click();
	await expect(
		exportBlock.locator("[data-owner-reporting-export-abort]"),
	).toBeVisible();
	await expect(localizedDateValue(exportBlock, "Start")).toHaveValue(
		"2026-08-10",
	);
	expect(calls.csv).toBe(1);
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

	await page.unroute("**/rpc/admin/analytics/csv");
	await page.route("**/rpc/admin/analytics/csv", (route) =>
		route.fulfill({
			status: 200,
			headers: { "content-type": "text/event-stream" },
			body: [
				'event: message\ndata: {"json":"﻿business_day,count\\r\\n"}\n\n',
				'event: message\ndata: {"json":"2026-08-14,12\\r\\n"}\n\n',
				"event: done\ndata: {}\n\n",
			].join(""),
		}),
	);
	await exportBlock.getByRole("button", { name: "Start over" }).click();
	await exportBlock.locator("[data-owner-reporting-export-start]").click();
	const download = exportBlock.locator("[data-owner-reporting-download]");
	await expect(download).toBeVisible();
	const preparedHref = await download.getAttribute("href");
	expect(preparedHref).toMatch(/^blob:/u);
	await page.locator("#owner-analytics-daily-tab").click();
	await page.locator("#owner-analytics-history-tab").click();
	await expect(download).toHaveAttribute("href", preparedHref ?? "missing");
	await captureReview(page, "phase10-reporting-export-en-768x1024.png");
});

test("reflow, focus, keyboard, live names, reduced motion, and automated accessibility hold", async ({
	page,
}) => {
	test.setTimeout(60_000);
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await mockOwnerRoute(page);
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto("/admin");
	const dailyTab = page.locator("#owner-analytics-daily-tab");
	const historyTab = page.locator("#owner-analytics-history-tab");
	await dailyTab.focus();
	await page.keyboard.press("ArrowRight");
	await expect(historyTab).toBeFocused();
	await expect(historyTab).toHaveAttribute("aria-selected", "true");
	await expect(historyTab).toHaveAttribute("tabindex", "0");
	const focus = await historyTab.evaluate((element) => {
		const style = getComputedStyle(element);
		return style.outlineStyle !== "none" || style.boxShadow !== "none";
	});
	expect(focus).toBe(true);
	await page.keyboard.press("Tab");
	expect(
		await page
			.locator("#owner-analytics-history-panel")
			.evaluate((panel) => panel.contains(document.activeElement)),
	).toBe(true);
	const reporting = page.locator(".owner-reporting");
	await expect(reporting.locator("[data-owner-reporting-table]")).toBeVisible();
	for (const locale of ["en", "ar"] as const) {
		await setLocale(page, locale);
		for (const width of [320, 360, 390, 721, 768, 820, 1024, 1200, 1440]) {
			await page.setViewportSize({ width, height: 900 });
			await expect(
				reporting.locator("[data-owner-reporting-grid]"),
			).toBeVisible();
			const comparisonRegion = reporting.locator(
				".owner-reporting-region--compact",
			);
			const comparisonGeometry = await comparisonRegion.evaluate((element) => ({
				ariaLabel: element.getAttribute("aria-label"),
				clientWidth: element.clientWidth,
				overflowX: getComputedStyle(element).overflowX,
				scrollWidth: element.scrollWidth,
				tabIndex: element.getAttribute("tabindex"),
			}));
			expect(comparisonGeometry.ariaLabel).toBeTruthy();
			expect(comparisonGeometry.tabIndex).toBe("0");
			if (width <= 620) {
				expect(comparisonGeometry.scrollWidth).toBeLessThanOrEqual(
					comparisonGeometry.clientWidth + 1,
				);
				expect(comparisonGeometry.overflowX).toBe("visible");
			}
			if (width === 1024) {
				expect(comparisonGeometry.scrollWidth).toBeGreaterThan(
					comparisonGeometry.clientWidth,
				);
				await comparisonRegion.focus();
				await page.keyboard.press("Shift+Tab");
				await page.keyboard.press("Tab");
				await expect(comparisonRegion).toBeFocused();
				const comparisonFocus = await comparisonRegion.evaluate((element) => {
					const style = getComputedStyle(element);
					return {
						outlineStyle: style.outlineStyle,
						outlineWidth: Number.parseFloat(style.outlineWidth),
					};
				});
				expect(comparisonFocus.outlineStyle).toBe("solid");
				expect(comparisonFocus.outlineWidth).toBeGreaterThanOrEqual(2);
			}
			await expectControlLayout(page, width);
			await expectBoardDensity(page, width);
			await expectHeadingLayout(page, locale, width);
			// The relocated CSV prose is ordinary in-flow section content, so the
			// section-level overflow check no longer needs its recorded bypass.
			await expectNoOverflow(page);
			const containedAction = await reporting
				.locator("[data-owner-reporting-export-start]")
				.boundingBox();
			if (!containedAction)
				throw new Error("Export action requires a layout box");
			expect(containedAction.x).toBeGreaterThanOrEqual(0);
			expect(containedAction.x + containedAction.width).toBeLessThanOrEqual(
				width,
			);
			const overflowingOrdinaryContent = await reporting
				.locator(
					".owner-reporting-table__heading, .owner-reporting__note, .owner-reporting__footnote",
				)
				.evaluateAll((elements) =>
					elements.flatMap((element) => {
						const box = element.getBoundingClientRect();
						return box.left >= 0 && box.right <= window.innerWidth
							? []
							: [
									{
										text: element.textContent,
										left: box.left,
										right: box.right,
									},
								];
					}),
				);
			expect(overflowingOrdinaryContent).toEqual([]);
		}
		if (locale === "ar") {
			await historyTab.focus();
			await page.keyboard.press("ArrowRight");
			await expect(dailyTab).toBeFocused();
			await page.keyboard.press("ArrowLeft");
			await expect(historyTab).toBeFocused();
		}
	}
	const comparisonTable = reporting.locator(
		"[data-owner-reporting-comparison-table]",
	);
	await expect(comparisonTable.locator("thead")).toHaveCount(1);
	await expect(comparisonTable.locator("tbody")).toHaveCount(1);
	await expect(comparisonTable.locator("thead th[scope='col']")).toHaveCount(4);
	await expect(comparisonTable.locator("tbody th[scope='row']")).toHaveCount(3);

	await page.setViewportSize({ width: 768, height: 1024 });
	const cells = reporting.locator(".owner-reporting-cell");
	async function expectFocusedCell(index: number) {
		const activeCell = cells.nth(index);
		await expect(
			reporting.locator(".owner-reporting-cell[tabindex='0']"),
		).toHaveCount(1);
		await expect(activeCell).toHaveAttribute("tabindex", "0");
		await expect(activeCell).toBeFocused();
	}

	await setLocale(page, "en");
	await cells.nth(9).focus();
	await expectFocusedCell(9);
	await cells.nth(9).press("ArrowRight");
	await expectFocusedCell(10);
	await cells.nth(10).press("ArrowDown");
	await expectFocusedCell(34);
	await cells.nth(34).press("Home");
	await expectFocusedCell(24);
	await cells.nth(24).press("ArrowLeft");
	await expectFocusedCell(24);
	await cells.nth(24).press("ArrowUp");
	await expectFocusedCell(0);
	await cells.nth(0).press("ArrowUp");
	await expectFocusedCell(0);
	await cells.nth(0).press("End");
	await expectFocusedCell(23);
	await cells.nth(23).press("ArrowRight");
	await expectFocusedCell(23);

	await page.locator("#owner-analytics-daily-tab").click();
	await page.locator("#owner-analytics-history-tab").click();
	await expect(cells.nth(23)).toHaveAttribute("tabindex", "0");
	await cells.nth(23).focus();
	await cells.nth(23).press("ArrowLeft");
	await expectFocusedCell(22);

	await setLocale(page, "ar");
	await cells.nth(9).focus();
	await cells.nth(9).press("ArrowRight");
	await expectFocusedCell(8);
	await cells.nth(8).press("ArrowLeft");
	await expectFocusedCell(9);
	await cells.nth(9).press("ArrowDown");
	await expectFocusedCell(33);
	await expect(
		reporting.locator("[data-owner-reporting-reading]"),
	).toContainText(/Average occupancy|متوسط الازدحام/u);
	const cellFocus = await cells.nth(33).evaluate((element) => {
		const style = getComputedStyle(element);
		return style.outlineStyle !== "none" || style.boxShadow !== "none";
	});
	expect(cellFocus).toBe(true);
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
		.include(".owner-analytics-mode")
		.analyze();
	expect(seriousViolations(results)).toEqual([]);
	await captureReview(page, "phase10-reporting-a11y-reflow-ar-768x1024.png");
});

test("canonical routed Reporting History desktop English and mobile Arabic match", async ({
	page,
}) => {
	// Multi-locale, multi-viewport capture sweep needs headroom on loaded
	// machines; the 30s default is a flake source, not an oracle.
	test.setTimeout(60_000);
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await mockOwnerRoute(page);
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/admin");
	await activateHistory(page);
	await expect(page.locator(".owner-reporting")).toBeVisible();
	await page.evaluate(() => document.fonts.ready);
	await captureReview(page, "owner-history-route-en-desktop-1440x900.png");

	await setLocale(page, "ar");
	await page.setViewportSize({ width: 390, height: 844 });
	await expect(page.locator(".owner-reporting")).toBeVisible();
	await page.evaluate(() => document.fonts.ready);
	await captureReview(page, "owner-history-route-ar-mobile-390x844.png");
});

test("hourly headers stay opaque and stable through both scroll axes", async ({
	page,
}) => {
	await mockOwnerRoute(page, { heatmapDelayMs: 1500 });
	await page.goto("/admin");
	await activateHistory(page);
	await expect(
		page.locator('[data-owner-reporting-state="loading"]'),
	).toHaveCount(1);
	await captureReview(page, "reports-section-loading.png");
	await expect(page.locator("[data-owner-reporting-table]")).toBeVisible();
	for (const locale of ["ar", "en"] as const) {
		await setLocale(page, locale);
		await page.setViewportSize({ width: 390, height: 844 });
		const region = page.locator(
			".owner-reporting-table .owner-reporting-region",
		);
		await region.scrollIntoViewIfNeeded();
		await region.evaluate((element) => {
			element.scrollTop = 180;
			element.scrollLeft =
				getComputedStyle(element).direction === "rtl"
					? -element.scrollWidth
					: element.scrollWidth;
		});
		const geometry = await region.evaluate((element) => {
			const header = element.querySelector("thead th");
			if (!header) throw new Error("Missing table header");
			return {
				delta:
					header.getBoundingClientRect().top -
					element.getBoundingClientRect().top,
				background: getComputedStyle(header).backgroundColor,
				x: element.scrollLeft,
				y: element.scrollTop,
			};
		});
		expect(geometry.background).toBe("rgb(40, 27, 32)");
		expect(Math.abs(geometry.x)).toBeGreaterThan(100);
		expect(geometry.y).toBeGreaterThan(100);
		expect(geometry.delta).toBeGreaterThanOrEqual(0);
		expect(geometry.delta).toBeLessThan(3);
		await captureReview(page, `reports-hourly-scrolled-${locale}.png`);
	}
});
