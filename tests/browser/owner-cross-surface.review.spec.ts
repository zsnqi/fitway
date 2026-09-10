// Owner cross-surface consistency review.
//
// Systemic guard for the "three dropdown systems" / material-drift class: the
// owner sections share popup and control families, and this spec compares
// computed styles ACROSS surfaces instead of trusting any one section's
// screenshot. There are no canonical baselines here — every capture goes to the
// run-scoped review evidence directory, while the assertions pin the shared
// popup material (radius 12px), the shared control fill (rgb(10 10 12 / 72%),
// radius 8px), the visible focus ring, the heading-at-rest navigation contract,
// and the ?section= URL round-trip.

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { expect, type Page, test } from "@playwright/test";

// The locale is persisted in localStorage, so every capture must start from a
// known direction rather than inheriting the previous test's toggle.
test.beforeEach(async ({ page }) => {
	await page.addInitScript(() => {
		window.localStorage.removeItem("fitway.locale");
	});
});

const ownerAuth = {
	principalId: "00000000-0000-4000-8000-000000000091",
	principalKind: "owner",
	role: "owner",
	sessionId: "00000000-0000-4000-8000-000000000092",
	expiresAt: "2026-08-22T00:00:00.000Z",
	active: true,
} as const;

const GYM_TIME_ZONE = "Asia/Riyadh";
const weekdays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

const daily = {
	businessDay: "2026-07-21",
	timeline: [
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

function heatmap() {
	return {
		startBusinessDay: "2026-07-18",
		endBusinessDay: "2026-08-14",
		cells: weekdays.flatMap((weekday) =>
			Array.from({ length: 24 }, (_unused, localHour) => ({
				weekday,
				localHour,
				state: "value",
				averageOccupancy: localHour === 9 ? 40 : 12,
				observedOpenMinutes: 60,
				expectedOpenMinutes: 60,
				sampleDayCount: 4,
			})),
		),
	};
}

const comparable = {
	state: "comparable",
	minimumCoverage: 0.8,
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
	changes: {
		averageOccupancy: { absolute: 2.8, percent: 0.088 },
		estimatedEntranceCrossings: { absolute: 213, percent: 0.065 },
	},
} as const;

const healthSummary = {
	window: {
		businessDayFrom: "2026-08-01",
		businessDayTo: "2026-08-14",
		businessDays: 14,
		timeZone: GYM_TIME_ZONE,
		generatedAtUtc: "2026-08-14T09:00:00.000Z",
	},
	connection: {
		expectedOpenMinutes: 12_840,
		monitoredOpenMinutes: 12_000,
		onlineOpenMinutes: 12_000,
		offlineOpenMinutes: 0,
		uptimeRatio: 1,
		monitoredRatio: 12_000 / 12_840,
		monitoringStartedAtUtc: "2026-08-02T06:00:00.000Z",
		offlinePeriodCount: 0,
		offlinePeriods: [],
	},
	alerts: {
		noticeCount: 0,
		delivered: 0,
		failed: 0,
		unconfirmed: 0,
		incidentCount: 0,
		incidents: [],
	},
} as const;

const settingsSnapshot = {
	version: 7,
	effectiveFromUtc: "2026-07-01T00:00:00.000Z",
	editable: {
		capacity: 220,
		thresholds: {
			quietMaxPercent: 30,
			moderateMaxPercent: 55,
			busyMaxPercent: 80,
		},
		weeklySchedule: {
			sun: { open: "06:00", close: "23:00" },
			mon: { open: "06:00", close: "23:00" },
			tue: { open: "06:00", close: "23:00" },
			wed: { open: "06:00", close: "23:00" },
			thu: { open: "06:00", close: "23:00" },
			fri: { open: "13:00", close: "01:00" },
			sat: null,
		},
		businessDayBoundary: "04:00",
		resetBufferMinutes: 15,
	},
	operational: {
		timezone: GYM_TIME_ZONE,
		pushIntervalSeconds: 20,
		freshForSeconds: 90,
		operationalStaleAfterSeconds: 180,
		publicPollSeconds: 60,
	},
} as const;

async function mockOwnerSurfaces(page: Page) {
	await page.route("**/rpc/admin/session", (route) =>
		route.fulfill({ status: 200, json: { json: ownerAuth } }),
	);
	await page.route("**/rpc/admin/analytics/daily", (route) =>
		route.fulfill({ status: 200, json: { json: daily } }),
	);
	await page.route("**/rpc/admin/analytics/timeContext", (route) =>
		route.fulfill({
			status: 200,
			json: {
				json: {
					current: { settingsVersion: 11, timeZone: GYM_TIME_ZONE },
					versions: (
						route.request().postDataJSON()?.json?.settingsVersions ?? []
					).map((settingsVersion: number) => ({
						settingsVersion,
						timeZone: GYM_TIME_ZONE,
					})),
				},
			},
		}),
	);
	await page.route("**/rpc/admin/audit/list", (route) =>
		route.fulfill({
			status: 200,
			json: { json: { entries: [], nextCursor: null } },
		}),
	);
	await page.route("**/rpc/admin/health/summary", (route) =>
		route.fulfill({ status: 200, json: { json: healthSummary } }),
	);
	await page.route("**/rpc/admin/settings/read", (route) =>
		route.fulfill({ status: 200, json: { json: settingsSnapshot } }),
	);
	await page.route("**/rpc/admin/access/list", (route) =>
		route.fulfill({ status: 200, json: { json: { principals: [] } } }),
	);
	await page.route("**/rpc/admin/analytics/heatmap", (route) =>
		route.fulfill({ status: 200, json: { json: heatmap() } }),
	);
	await page.route("**/rpc/admin/analytics/weekOverWeek", (route) =>
		route.fulfill({ status: 200, json: { json: comparable } }),
	);
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

async function reviewElementPath(name: string) {
	const reviewDirectory = process.env.FITWAY_PLAYWRIGHT_REVIEW_DIR;
	if (!reviewDirectory) {
		throw new Error("FITWAY_PLAYWRIGHT_REVIEW_DIR is required");
	}
	await mkdir(reviewDirectory, { recursive: true });
	return path.join(reviewDirectory, name);
}

async function activateSection(page: Page, section: string) {
	await page.locator(`[role="tab"][data-owner-section="${section}"]`).click();
	await expect(page.locator('[role="tabpanel"]:not([hidden])')).toHaveAttribute(
		"data-owner-section-state",
		"active",
	);
}

async function popupMaterial(popup: ReturnType<Page["locator"]>) {
	return popup.evaluate((element) => {
		const style = getComputedStyle(element);
		return {
			backgroundColor: style.backgroundColor,
			borderRadius: style.borderRadius,
			borderColor: style.borderColor,
		};
	});
}

/**
 * The shared control fill is rgb(10 10 12 / 72%); getComputedStyle reports it
 * as rgba(10, 10, 12, 0.72). Parse tolerantly instead of comparing strings so
 * engine formatting churn cannot mask a real material change.
 */
function expectControlFill(backgroundColor: string) {
	const match = /rgba?\(\s*10\s*,\s*10\s*,\s*12(?:\s*,\s*([\d.]+))?\s*\)/.exec(
		backgroundColor,
	);
	expect(backgroundColor, "control fill must be rgb(10 10 12 / 72%)").toMatch(
		/rgba?\(\s*10\s*,\s*10\s*,\s*12\b/,
	);
	expect(
		match,
		`control fill alpha missing in ${backgroundColor}`,
	).not.toBeNull();
	if (match?.[1]) {
		expect(Number(match[1])).toBeCloseTo(0.72, 2);
	}
}

async function expectFocusRing(
	page: Page,
	trigger: ReturnType<Page["locator"]>,
) {
	// A real keyboard interaction makes Chromium apply :focus-visible to the
	// immediately following script focus, so the ring below is the rendered one.
	await page.keyboard.press("Shift");
	await trigger.focus();
	const ring = await trigger.evaluate((element) => {
		const style = getComputedStyle(element);
		return { style: style.outlineStyle, width: style.outlineWidth };
	});
	expect(ring.style).toBe("solid");
	expect(Number.parseFloat(ring.width)).toBe(2);
}

test("all six owner sections capture review evidence at 1440x900 (arabic)", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await mockOwnerSurfaces(page);
	await page.goto("/admin");
	await expect(page.locator("[data-owner-chart]")).toBeVisible();

	for (const section of [
		"daily",
		"history",
		"access",
		"audit",
		"health",
		"settings",
	] as const) {
		await activateSection(page, section);
		await page.waitForTimeout(220);
		await captureReview(page, `owner-cross-surface-ar-${section}.png`);
	}
});

test("the daily, reports, and audit popups share one popup material", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await mockOwnerSurfaces(page);
	await page.goto("/admin");
	await expect(page.locator("[data-owner-chart]")).toBeVisible();

	// Daily: the minute-page popup inside the minute-details disclosure.
	await page
		.locator(".owner-table-disclosure > .owner-retained-disclosure__trigger")
		.click();
	const minuteTrigger = page.locator(".owner-table-pagination__page");
	await minuteTrigger.click();
	const dailyPopup = page.locator(".owner-table-pagination__popup[data-open]");
	await expect(dailyPopup).toBeVisible();
	const dailyMaterial = await popupMaterial(dailyPopup);
	await dailyPopup.screenshot({
		path: await reviewElementPath(
			"owner-cross-surface-popup-daily-minute-page.png",
		),
	});
	await page.keyboard.press("Escape");
	await expect(dailyPopup).toBeHidden();

	// Reports: a range date popup opened from a month segment.
	await activateSection(page, "history");
	await expect(page.locator("[data-owner-reporting-range]")).toBeVisible();
	await page
		.locator("[data-owner-reporting-range] [data-owner-date-field]")
		.first()
		.locator(".owner-date-field__segment")
		.nth(1)
		.locator(".owner-date-field__trigger")
		.click();
	const reportsPopup = page
		.locator(
			".owner-date-field__popup[data-open]:not(.owner-date-field__year-popup)",
		)
		.first();
	await expect(reportsPopup).toBeVisible();
	const reportsMaterial = await popupMaterial(reportsPopup);
	await reportsPopup.screenshot({
		path: await reviewElementPath(
			"owner-cross-surface-popup-reports-range-month.png",
		),
	});
	await page.keyboard.press("Escape");
	await expect(reportsPopup).toBeHidden();

	// Audit: a filter date popup opened from a month segment.
	await activateSection(page, "audit");
	await expect(page.locator(".owner-audit-filters")).toBeVisible();
	await page
		.locator(".owner-audit-filters [data-owner-date-field]")
		.first()
		.locator(".owner-date-field__segment")
		.nth(1)
		.locator(".owner-date-field__trigger")
		.click();
	const auditPopup = page
		.locator(
			".owner-date-field__popup[data-open]:not(.owner-date-field__year-popup)",
		)
		.first();
	await expect(auditPopup).toBeVisible();
	const auditMaterial = await popupMaterial(auditPopup);
	await auditPopup.screenshot({
		path: await reviewElementPath("owner-cross-surface-popup-audit-date.png"),
	});
	await page.keyboard.press("Escape");
	await expect(auditPopup).toBeHidden();

	// The three popup families must be one family: identical fill and edge,
	// and the approved 12px popup radius on every one of them.
	expect(reportsMaterial.backgroundColor).toBe(dailyMaterial.backgroundColor);
	expect(auditMaterial.backgroundColor).toBe(dailyMaterial.backgroundColor);
	expect(reportsMaterial.borderColor).toBe(dailyMaterial.borderColor);
	expect(auditMaterial.borderColor).toBe(dailyMaterial.borderColor);
	for (const [name, material] of [
		["daily", dailyMaterial],
		["reports", reportsMaterial],
		["audit", auditMaterial],
	] as const) {
		expect(
			material.borderRadius,
			`${name} popup radius drifted from the shared 12px popup material`,
		).toBe("12px");
	}
});

test("the control family keeps one fill, one radius, and a visible focus ring", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await mockOwnerSurfaces(page);
	await page.goto("/admin");
	await expect(page.locator("[data-owner-chart]")).toBeVisible();

	// Daily: the minute-page pagination trigger.
	await page
		.locator(".owner-table-disclosure > .owner-retained-disclosure__trigger")
		.click();
	const minuteTrigger = page.locator(".owner-table-pagination__page");
	await expect(minuteTrigger).toBeVisible();
	const minuteMaterial = await minuteTrigger.evaluate((element) => {
		const style = getComputedStyle(element);
		return {
			backgroundColor: style.backgroundColor,
			borderRadius: style.borderRadius,
		};
	});
	await expectFocusRing(page, minuteTrigger);

	// Reports: the shared date-field triggers.
	await activateSection(page, "history");
	await expect(page.locator("[data-owner-reporting-range]")).toBeVisible();
	const dateTrigger = page
		.locator("[data-owner-reporting-range] .owner-date-field__trigger")
		.first();
	const dateMaterial = await dateTrigger.evaluate((element) => {
		const style = getComputedStyle(element);
		return {
			backgroundColor: style.backgroundColor,
			borderRadius: style.borderRadius,
		};
	});

	// Audit: the shared filter trigger and text input.
	await activateSection(page, "audit");
	await expect(page.locator(".owner-audit-filters")).toBeVisible();
	const auditSelect = page
		.locator(".owner-audit-select > [data-owner-select-trigger]")
		.first();
	const auditInput = page.locator(".owner-audit-filters input").first();
	const auditSelectMaterial = await auditSelect.evaluate((element) => {
		const style = getComputedStyle(element);
		return {
			backgroundColor: style.backgroundColor,
			borderRadius: style.borderRadius,
		};
	});
	const auditInputMaterial = await auditInput.evaluate((element) => {
		const style = getComputedStyle(element);
		return {
			backgroundColor: style.backgroundColor,
			borderRadius: style.borderRadius,
		};
	});
	await expectFocusRing(page, auditSelect);

	for (const [name, material] of [
		["pagination trigger", minuteMaterial],
		["date-field trigger", dateMaterial],
		["audit filter select", auditSelectMaterial],
		["audit filter input", auditInputMaterial],
	] as const) {
		expectControlFill(material.backgroundColor);
		expect(
			material.borderRadius,
			`${name} radius drifted from the shared 8px control radius`,
		).toBe("8px");
	}
});

test("heading anchors rest at one viewport offset across sections", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await mockOwnerSurfaces(page);
	await page.goto("/admin");
	await expect(page.locator("[data-owner-chart]")).toBeVisible();

	const restingTops: number[] = [];
	for (const section of ["daily", "history", "health"] as const) {
		await activateSection(page, section);
		await page.waitForTimeout(320);
		expect(await page.evaluate(() => window.scrollY)).toBe(0);
		restingTops.push(
			await page
				.locator(
					'[role="tabpanel"]:not([hidden]) [data-owner-navigation-anchor]',
				)
				.first()
				.evaluate((element) => element.getBoundingClientRect().top),
		);
	}
	for (const [section, top] of [
		["history", restingTops[1]],
		["health", restingTops[2]],
	] as const) {
		expect(
			Math.abs(top - (restingTops[0] ?? 0)),
			`${section} heading-at-rest offset drifted from Daily's`,
		).toBeLessThanOrEqual(2);
	}
});

test("section selection round-trips through the ?section URL", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await mockOwnerSurfaces(page);
	await page.goto("/admin");
	await expect(page.locator("[data-owner-chart]")).toBeVisible();

	await activateSection(page, "history");
	await expect(page).toHaveURL(/\?section=/u);

	await page.goto("/admin?section=health");
	await expect(
		page.locator('[role="tab"][data-owner-section="health"]'),
	).toHaveAttribute("aria-selected", "true");
});
