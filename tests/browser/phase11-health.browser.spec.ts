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

/** The configured gym timezone for this fixture is +03:00 all year. */
const GYM_TIME_ZONE = "Asia/Riyadh";
/** A deliberately distant device zone; it must never change what a row says. */
const DEVICE_TIME_ZONE = "America/Los_Angeles";

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

type Summary = {
	window: {
		businessDayFrom: string;
		businessDayTo: string;
		businessDays: number;
		timeZone: string;
		generatedAtUtc: string;
	};
	connection: {
		expectedOpenMinutes: number;
		monitoredOpenMinutes: number;
		onlineOpenMinutes: number;
		offlineOpenMinutes: number;
		uptimeRatio: number | null;
		monitoredRatio: number | null;
		monitoringStartedAtUtc: string | null;
		offlinePeriodCount: number;
		offlinePeriods: Array<{
			startedAtUtc: string;
			endedAtUtc: string | null;
			elapsedMinutes: number;
			openMinutes: number;
		}>;
	};
	alerts: {
		noticeCount: number;
		delivered: number;
		failed: number;
		unconfirmed: number;
		incidentCount: number;
		incidents: Array<{
			condition: string;
			startedAtUtc: string;
			lastNoticeAtUtc: string | null;
			recoveredAtUtc: string | null;
			noticeCount: number;
			delivered: number;
			failed: number;
			unconfirmed: number;
		}>;
	};
};

const populated: Summary = {
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
		onlineOpenMinutes: 11_905,
		offlineOpenMinutes: 95,
		uptimeRatio: 11_905 / 12_000,
		monitoredRatio: 12_000 / 12_840,
		monitoringStartedAtUtc: "2026-08-02T06:00:00.000Z",
		offlinePeriodCount: 3,
		offlinePeriods: [
			{
				// 21:30Z is already the next gym day at +03:00.
				startedAtUtc: "2026-08-13T21:30:00.000Z",
				endedAtUtc: null,
				elapsedMinutes: 95,
				openMinutes: 95,
			},
			{
				startedAtUtc: "2026-08-12T22:00:00.000Z",
				endedAtUtc: "2026-08-13T00:00:00.000Z",
				elapsedMinutes: 120,
				openMinutes: 0,
			},
			{
				startedAtUtc: "2026-08-09T11:15:00.000Z",
				endedAtUtc: "2026-08-09T11:45:00.000Z",
				elapsedMinutes: 30,
				openMinutes: 30,
			},
		],
	},
	alerts: {
		noticeCount: 5,
		delivered: 3,
		failed: 1,
		unconfirmed: 1,
		incidentCount: 2,
		incidents: [
			{
				condition: "camera_failure",
				startedAtUtc: "2026-08-13T05:00:00.000Z",
				lastNoticeAtUtc: "2026-08-13T05:31:00.000Z",
				recoveredAtUtc: null,
				noticeCount: 2,
				delivered: 1,
				failed: 1,
				unconfirmed: 0,
			},
			{
				condition: "stale_push",
				startedAtUtc: "2026-08-09T11:15:00.000Z",
				lastNoticeAtUtc: "2026-08-09T11:16:00.000Z",
				recoveredAtUtc: "2026-08-09T11:46:00.000Z",
				noticeCount: 1,
				delivered: 1,
				failed: 0,
				unconfirmed: 0,
			},
		],
	},
};

/** Nothing broke, and the log covers the whole window. */
const clear: Summary = {
	...populated,
	connection: {
		...populated.connection,
		monitoredOpenMinutes: 12_840,
		onlineOpenMinutes: 12_840,
		offlineOpenMinutes: 0,
		uptimeRatio: 1,
		monitoredRatio: 1,
		monitoringStartedAtUtc: "2026-07-01T06:00:00.000Z",
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
};

/** No transition has ever been recorded: uptime has no denominator at all. */
const unmonitored: Summary = {
	...clear,
	connection: {
		...clear.connection,
		monitoredOpenMinutes: 0,
		onlineOpenMinutes: 0,
		offlineOpenMinutes: 0,
		uptimeRatio: null,
		monitoredRatio: 0,
		monitoringStartedAtUtc: null,
	},
};

let observedHealthRequests: number[] = [];
/**
 * Every `admin.analytics.timeContext` body seen on the page. Mounting the health
 * section must add none: that procedure belongs to Phase 9 and its spec asserts exact
 * post data on it.
 */
let observedTimeContextRequests: unknown[] = [];

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

async function mockOwnerSurfaces(
	page: Page,
	options: {
		summary?: Summary;
		healthStatus?: number;
		healthDelayMs?: number;
	} = {},
) {
	observedHealthRequests = [];
	observedTimeContextRequests = [];
	await page.route("**/rpc/admin/session", (route) =>
		route.fulfill({ status: 200, json: { json: ownerAuth } }),
	);
	await page.route("**/rpc/admin/analytics/daily", (route) =>
		route.fulfill({ status: 200, json: { json: daily } }),
	);
	await page.route("**/rpc/admin/analytics/timeContext", (route) => {
		observedTimeContextRequests.push(route.request().postDataJSON());
		return route.fulfill({
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
		});
	});
	// The audit section is a neighbour on this route; it must keep rendering.
	await page.route("**/rpc/admin/audit/list", (route) =>
		route.fulfill({
			status: 200,
			json: { json: { entries: [], nextCursor: null } },
		}),
	);
	await page.route("**/rpc/admin/health/summary", async (route) => {
		observedHealthRequests.push(Date.now());
		if (options.healthDelayMs) {
			await new Promise((resolve) =>
				setTimeout(resolve, options.healthDelayMs),
			);
		}
		if (options.healthStatus && options.healthStatus !== 200) {
			await route.fulfill({
				status: options.healthStatus,
				json: rpcError(
					options.healthStatus,
					"SERVICE_UNAVAILABLE",
					"Service Unavailable",
				),
			});
			return;
		}
		await route.fulfill({
			status: 200,
			json: { json: options.summary ?? populated },
		});
	});
}

async function emulateDeviceTimeZone(page: Page) {
	const cdp = await page.context().newCDPSession(page);
	await cdp.send("Emulation.setTimezoneOverride", {
		timezoneId: DEVICE_TIME_ZONE,
	});
	return cdp;
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

async function expectNoDocumentOverflow(page: Page) {
	const overflow = await page.evaluate(() => ({
		document: document.documentElement.scrollWidth - window.innerWidth,
		body: document.body.scrollWidth - window.innerWidth,
		health:
			(document.querySelector<HTMLElement>(".owner-health")?.scrollWidth ?? 0) -
			(document.querySelector<HTMLElement>(".owner-health")?.clientWidth ?? 0),
	}));
	expect(overflow.document).toBeLessThanOrEqual(0);
	expect(overflow.body).toBeLessThanOrEqual(0);
	expect(overflow.health).toBeLessThanOrEqual(0);
}

function seriousViolations(
	results: Awaited<ReturnType<AxeBuilder["analyze"]>>,
) {
	return results.violations.filter(
		({ impact }) => impact === "serious" || impact === "critical",
	);
}

const offlineTable = "[data-owner-health-offline-table]";
const incidentTable = "[data-owner-health-incident-table]";
const metrics = "[data-owner-health-metrics]";

/**
 * A `.owner-health` capture taller than the viewport paints the shell's fixed skip
 * link into the image. That link belongs to `phase11-shell`, which owns its baseline
 * and its focus behaviour, so it is removed from this slice's composition baseline
 * instead of being asserted twice.
 */
async function hideShellSkipLink(page: Page) {
	await page.addStyleTag({
		content: ".operations-skip-link { display: none !important; }",
	});
	await expect(page.locator(".operations-skip-link")).toBeHidden();
}

test("the summary reads in the gym timezone and adds no request to a neighbour", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await emulateDeviceTimeZone(page);
	await mockOwnerSurfaces(page);
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/admin");

	await expect(page.locator(offlineTable)).toBeVisible();

	// Exactly one health request, and the Phase 9 time-context call is untouched:
	// mounting this section must not change what `/admin` asks for.
	expect(observedHealthRequests).toHaveLength(1);
	expect(observedTimeContextRequests).toEqual([
		{ json: { settingsVersions: [11] } },
	]);
	// The neighbouring audit section still mounts on the same route.
	await expect(page.locator('[data-owner-audit-state="empty"]')).toBeVisible();

	expect(
		await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone),
	).toBe(DEVICE_TIME_ZONE);

	// 21:30Z is already the next gym day at +03:00. A device at -07:00 would say
	// "Aug 13, 2:30 PM"; the row must say the gym's own day and clock.
	const firstOutage = page.locator(`${offlineTable} tbody tr`).first();
	await expect(firstOutage).toContainText("Aug 14");
	await expect(firstOutage).toContainText("12:30 AM");
	await expect(firstOutage).not.toContainText("2:30 PM");
	await expect(page.locator(".owner-health__window")).toContainText(
		GYM_TIME_ZONE,
	);
	await captureReview(page, "owner-health-populated-en-1440x900.png");
});

test("every figure names its own denominator and the two failure kinds stay apart", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await mockOwnerSurfaces(page);
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/admin");
	await expect(page.locator(metrics)).toBeVisible();

	const metricText = (await page.locator(metrics).textContent()) ?? "";
	expect(metricText).toContain("11,905 / 12,000 monitored open minutes online");
	expect(metricText).toContain(
		"12,000 / 12,840 scheduled open minutes monitored",
	);
	expect(metricText).toContain(
		"3 delivered · 1 failed to send · 1 unconfirmed",
	);
	// 95 of 12,000 monitored minutes is 99.2%, not a rounded 100%.
	expect(metricText).toContain("99.2%");

	// A device-reported camera failure and a stopped push are named separately; a
	// send that failed on the wire is named as a messaging failure, not downtime.
	const incidents = page.locator(`${incidentTable} tbody tr`);
	await expect(incidents).toHaveCount(2);
	await expect(incidents.nth(0)).toContainText(
		"Device reported a camera failure",
	);
	await expect(incidents.nth(0)).toContainText("Not yet recovered");
	await expect(incidents.nth(0)).toContainText(
		"1 delivered · 1 failed to send",
	);
	await expect(incidents.nth(1)).toContainText("Edge stopped pushing");

	// A closed-hours outage is listed honestly, with no open minute charged to it.
	const closedOutage = page.locator(`${offlineTable} tbody tr`).nth(1);
	await expect(closedOutage).toContainText("None — gym closed throughout");
	await expect(page.locator(".owner-health__footnote")).toContainText(
		"is not an incident the gym was exposed to",
	);

	// Nothing was hidden by the list bound, so no "shown x of y" line is spent.
	await expect(page.locator(".owner-health__shown")).toHaveCount(0);
});

test("Arabic renders RTL with Western digits and no device identity", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "ar"),
	);
	await emulateDeviceTimeZone(page);
	await mockOwnerSurfaces(page);
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/admin");
	await setLocale(page, "ar");

	await expect(page.locator(incidentTable)).toBeVisible();
	const text = (await page.locator(".owner-health").textContent()) ?? "";
	expect(text).not.toMatch(/[٠-٩۰-۹]/u);
	expect(text).toContain("توقف الجهاز عن الإرسال");
	expect(text).toContain("لم يتعافَ بعد");
	expect(text).not.toMatch(/deviceId|device_id/i);

	const direction = await page
		.locator(".owner-health")
		.evaluate((element) => getComputedStyle(element).direction);
	expect(direction).toBe("rtl");

	// The row accent belongs on the reading-start edge, so it mirrors with the text.
	const accent = await page
		.locator(`${offlineTable} tbody tr[data-ongoing] td:first-child`)
		.evaluate((element) => getComputedStyle(element).boxShadow);
	expect(accent).toContain("-2px");
	await captureReview(page, "owner-health-populated-ar-1440x900.png");
});

test("loading, error, clear, unmonitored, and populated states each render", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await page.setViewportSize({ width: 390, height: 844 });

	await mockOwnerSurfaces(page, { healthDelayMs: 700 });
	await page.goto("/admin");
	const loading = page.locator('[data-owner-health-state="loading"]');
	await expect(loading).toBeVisible();
	await expect(loading).toHaveAttribute("role", "status");
	await captureReview(page, "owner-health-loading-en-390x844.png");
	await expect(page.locator(offlineTable)).toBeVisible();
	await captureReview(page, "owner-health-populated-en-390x844.png");

	await mockOwnerSurfaces(page, { healthStatus: 503 });
	await page.reload();
	const error = page.locator('[data-owner-health-state="error"]');
	await expect(error).toBeVisible();
	await expect(error).toHaveAttribute("role", "alert");
	await expect(page.locator(metrics)).toHaveCount(0);
	await captureReview(page, "owner-health-error-en-390x844.png");

	await mockOwnerSurfaces(page, { summary: clear });
	await error.getByRole("button").click();
	await expect(page.locator('[data-owner-health-state="empty"]')).toHaveCount(
		2,
	);
	await expect(page.locator(".owner-health")).toContainText(
		"No offline period in this window",
	);
	await expect(page.locator(".owner-health")).toContainText(
		"No incident in this window",
	);
	await expect(page.locator(".owner-health")).toContainText("100%");
	await captureReview(page, "owner-health-clear-en-390x844.png");

	await mockOwnerSurfaces(page, { summary: unmonitored });
	await page.reload();
	const unknown = page.locator('[data-owner-health-state="unmonitored"]');
	await expect(unknown).toBeVisible();
	// Unknown coverage is never dressed up as a perfect record.
	await expect(page.locator(metrics)).toContainText("Not measurable");
	await expect(page.locator(metrics)).not.toContainText("100%");
	await captureReview(page, "owner-health-unmonitored-en-390x844.png");
	await expectNoDocumentOverflow(page);
});

test("layout holds at every required width in both locales", async ({
	page,
}) => {
	await mockOwnerSurfaces(page);
	await page.goto("/admin");

	const widths = [320, 360, 390, 721, 768, 820, 1024, 1200, 1440];
	for (const locale of ["ar", "en"] as const) {
		await setLocale(page, locale);
		for (const width of widths) {
			await page.setViewportSize({ width, height: 900 });
			await expect(page.locator(offlineTable)).toBeVisible();
			await expectNoDocumentOverflow(page);
			for (const selector of [offlineTable, incidentTable]) {
				const region = await page
					.locator(selector)
					.locator("xpath=ancestor::section[1]")
					.evaluate((element) => ({
						overflowX: getComputedStyle(element).overflowX,
						label: element.getAttribute("aria-label"),
						tabIndex: element.getAttribute("tabindex"),
					}));
				expect(region.overflowX).toBe("auto");
				expect(region.label).toBeTruthy();
				expect(region.tabIndex).toBe("0");
			}
		}
		await page.setViewportSize({ width: 360, height: 900 });
		await captureReview(page, `owner-health-${locale}-360x900.png`);
		await page.setViewportSize({ width: 768, height: 1024 });
		await captureReview(page, `owner-health-${locale}-768x1024.png`);
	}
});

test("keyboard, targets, reduced motion, 200% reflow, forced colors, and axe hold", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await mockOwnerSurfaces(page);
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.setViewportSize({ width: 1024, height: 900 });
	await page.goto("/admin");
	await expect(page.locator(offlineTable)).toBeVisible();

	// The two scroll regions are the section's only interactive elements; both must
	// be keyboard reachable in visual order and show a focus ring.
	const regions = page.locator(".owner-health .owner-health-region");
	await expect(regions).toHaveCount(2);
	for (const region of await regions.all()) {
		const box = await region.boundingBox();
		expect(box?.height).toBeGreaterThanOrEqual(44);
		await region.focus();
		await expect(region).toBeFocused();
		const focusRing = await region.evaluate((element) => {
			const style = getComputedStyle(element);
			return {
				outline: style.outlineStyle,
				width: Number.parseFloat(style.outlineWidth),
				shadow: style.boxShadow,
			};
		});
		expect(
			(focusRing.outline !== "none" && focusRing.width >= 2) ||
				focusRing.shadow !== "none",
		).toBe(true);
	}
	await regions.first().focus();
	await page.keyboard.press("Tab");
	await expect(regions.nth(1)).toBeFocused();

	// The section is at rest: no animation runs, reduced motion or not.
	expect(
		await page.evaluate(
			() => matchMedia("(prefers-reduced-motion: reduce)").matches,
		),
	).toBe(true);
	const animated = await page.evaluate(
		() =>
			document.querySelector(".owner-health")?.getAnimations({ subtree: true })
				.length ?? 0,
	);
	expect(animated).toBe(0);

	await page.evaluate(() => {
		document.documentElement.style.zoom = "2";
	});
	await expectNoDocumentOverflow(page);
	await captureReview(page, "owner-health-en-200-percent-reflow.png");
	await page.evaluate(() => {
		document.documentElement.style.zoom = "1";
	});

	for (const locale of ["en", "ar"] as const) {
		await setLocale(page, locale);
		const results = await new AxeBuilder({ page })
			.include(".owner-health")
			.analyze();
		expect(seriousViolations(results)).toEqual([]);
	}
	await setLocale(page, "en");

	await page.emulateMedia({ forcedColors: "active" });
	expect(
		await page.evaluate(() => matchMedia("(forced-colors: active)").matches),
	).toBe(true);
	for (const region of await regions.all()) {
		await region.focus();
		await expect(region).toBeFocused();
		const outline = await region.evaluate((element) => {
			const style = getComputedStyle(element);
			return {
				style: style.outlineStyle,
				width: Number.parseFloat(style.outlineWidth),
			};
		});
		expect(outline.style).not.toBe("none");
		expect(outline.width).toBeGreaterThanOrEqual(2);
	}
	// Every state stays readable without colour: the ongoing outage is named.
	await expect(page.locator(offlineTable)).toContainText("Not yet recovered");
});

test("canonical desktop Arabic and mobile English health compositions match", async ({
	page,
}) => {
	await emulateDeviceTimeZone(page);
	await mockOwnerSurfaces(page);
	await page.goto("/admin");
	await setLocale(page, "ar");
	await hideShellSkipLink(page);
	await page.setViewportSize({ width: 1440, height: 900 });
	await expect(page.locator(incidentTable)).toBeVisible();
	await page.evaluate(() => document.fonts.ready);
	await expect(page.locator(".owner-health")).toHaveScreenshot(
		"owner-health-ar-desktop-1440x900.png",
	);

	await setLocale(page, "en");
	await page.setViewportSize({ width: 390, height: 844 });
	await expect(page.locator(incidentTable)).toBeVisible();
	await page.evaluate(() => document.fonts.ready);
	await expect(page.locator(".owner-health")).toHaveScreenshot(
		"owner-health-en-mobile-390x844.png",
	);
});
