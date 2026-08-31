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
				// At mobile widths the stacked-record board clips instead of
				// scrolling; at 721px and wider the labelled scroll region stays.
				expect(region.overflowX).toBe(width <= 720 ? "clip" : "auto");
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

/**
 * Independent literal oracle for the mobile stacked-record boards (Paper 1DZC-0).
 *
 * Every expected string is derived from the fixed fixture and its locale — fixed
 * instants rendered in Asia/Riyadh, ICU month/time spellings, and the component's
 * own bilingual copy — never read back from the implementation or its catalogs at
 * runtime. Durations follow formatDuration's "1h 35m" / "1س 35د" composition.
 */
const mobileOracle = {
	en: {
		offline: {
			title: "Offline periods",
			count: "3 of 3",
			columns: ["Started", "Recovered", "Length", "Open minutes affected"],
			rows: [
				["Aug 14 12:30 AM", "Not yet recovered", "1h 35m", "1h 35m"],
				[
					"Aug 13 1:00 AM",
					"Aug 13 3:00 AM",
					"2h",
					"None — gym closed throughout",
				],
				["Aug 9 2:15 PM", "Aug 9 2:45 PM", "30m", "30m"],
			],
		},
		incidents: {
			title: "Incidents",
			count: "2 of 2",
			columns: ["Condition", "Started", "Recovered", "Alerts sent", "Delivery"],
			rows: [
				[
					"Device reported a camera failure",
					"Aug 13 8:00 AM",
					"Not yet recovered",
					"2",
					"1 delivered · 1 failed to send",
				],
				[
					"Edge stopped pushing",
					"Aug 9 2:15 PM",
					"Aug 9 2:46 PM",
					"1",
					"All delivered",
				],
			],
		},
	},
	ar: {
		offline: {
			title: "فترات الانقطاع",
			count: "3 من 3",
			columns: ["البداية", "التعافي", "المدة", "دقائق العمل المتأثرة"],
			rows: [
				["14 أغسطس 12:30 ص", "لم يتعافَ بعد", "1س 35د", "1س 35د"],
				[
					"13 أغسطس 1:00 ص",
					"13 أغسطس 3:00 ص",
					"2س",
					"لا شيء — الصالة مغلقة طوال الفترة",
				],
				["9 أغسطس 2:15 م", "9 أغسطس 2:45 م", "30د", "30د"],
			],
		},
		incidents: {
			title: "الأعطال",
			count: "2 من 2",
			columns: ["الحالة", "البداية", "التعافي", "التنبيهات المرسلة", "الإرسال"],
			rows: [
				[
					"أبلغ الجهاز عن تعطل الكاميرا",
					"13 أغسطس 8:00 ص",
					"لم تتعافَ بعد",
					"2",
					"1 وصل · 1 فشل الإرسال",
				],
				[
					"توقف الجهاز عن الإرسال",
					"9 أغسطس 2:15 م",
					"9 أغسطس 2:46 م",
					"1",
					"وصلت كلها",
				],
			],
		},
	},
} as const;

type MobileBoardOracle =
	(typeof mobileOracle)["en"][keyof (typeof mobileOracle)["en"]];

/** A mobile-only variant whose first incident adds one unconfirmed notice. */
const mobileUnconfirmed: Summary = {
	...populated,
	alerts: {
		...populated.alerts,
		incidents: populated.alerts.incidents.map((incident, index) =>
			index === 0 ? { ...incident, unconfirmed: 1 } : incident,
		),
	},
};

const unconfirmedOracle = {
	en: "1 delivered · 1 failed to send · 1 unconfirmed",
	ar: "1 وصل · 1 فشل الإرسال · 1 غير مؤكد",
} as const;

/**
 * In-page geometric and paint oracle for one mobile board.
 *
 * It returns the board's text content plus a list of concrete violations so the
 * same collector proves the positive contract and rejects every fault injection:
 * hidden or translucent values, transparent text, values moved outside their
 * card, clipped values, covered text (including pointer-events:none overlays and
 * content-bearing pseudo-elements), and stretched fixed-height geometry.
 * Border-only decorative pseudo-elements paint no opaque pixel and are ignored.
 */
function collectMobileBoard(table: Element) {
	const violations: string[] = [];
	const doc = table.ownerDocument;
	const win = doc.defaultView;
	if (!win) return { violations: ["no window"], data: null };
	const region = table.closest("section");
	if (!(region instanceof HTMLElement)) {
		return { violations: ["region section missing"], data: null };
	}

	const alphaOf = (value: string) => {
		const match = /rgba?\(([^)]+)\)/.exec(value);
		if (!match) return 1;
		const parts = match[1].split(",").map((part) => Number.parseFloat(part));
		return parts.length >= 4 ? (parts[3] ?? 1) : 1;
	};
	const describe = (element: Element) =>
		`${element.tagName.toLowerCase()}${
			element.className && typeof element.className === "string"
				? `.${element.className.split(" ").join(".")}`
				: ""
		}`;
	const rgbKey = (value: string) => {
		const match = /rgba?\(([^)]+)\)/.exec(value);
		if (!match) return value;
		const parts = match[1].split(",").map((part) => Number.parseFloat(part));
		return `${parts[0] ?? 0},${parts[1] ?? 0},${parts[2] ?? 0}`;
	};

	if (region.scrollWidth > region.clientWidth + 1) {
		violations.push("region: horizontal overflow");
	}
	if (region.scrollHeight > region.clientHeight + 1) {
		violations.push("region: vertical content clipped by overflow");
	}

	const style = (element: Element) => win.getComputedStyle(element);

	/**
	 * Scroll the value into the viewport first: elementFromPoint only sees the
	 * visible viewport, and the boards sit far below the fold on /admin.
	 */
	const checkValue = (node: Node, where: string, container: Element) => {
		const element =
			node instanceof Element ? node : (node.parentElement as Element);
		if (!element) {
			violations.push(`${where}: detached value`);
			return;
		}
		// elementFromPoint only sees the visible viewport, and the boards sit far
		// below the fold on /admin: scroll this value into view before measuring.
		// Scrolling invalidates every viewport-relative rect, so the region rect is
		// re-measured here rather than reused from the pre-scroll pass.
		element.scrollIntoView({ block: "center" });
		const regionRect = region.getBoundingClientRect();
		const rect =
			node instanceof Element
				? node.getBoundingClientRect()
				: (() => {
						const range = doc.createRange();
						range.selectNodeContents(node);
						return range.getBoundingClientRect();
					})();
		if (rect.width <= 0 || rect.height <= 0) {
			violations.push(`${where}: empty rendered box`);
			return;
		}
		const valueStyle = style(element);
		if (
			valueStyle.display === "none" ||
			valueStyle.visibility === "hidden" ||
			valueStyle.visibility === "collapse"
		) {
			violations.push(`${where}: value hidden`);
			return;
		}
		if (Number.parseFloat(valueStyle.opacity) < 0.5) {
			violations.push(`${where}: value effectively invisible (opacity)`);
		}
		if (alphaOf(valueStyle.color) < 0.5) {
			violations.push(`${where}: value effectively invisible (color alpha)`);
		}
		// Opacity is not inherited but composites multiplicatively down the tree,
		// so a near-transparent ancestor hides the text without touching its own
		// computed value. Walk the full ancestor chain for the effective product.
		let effectiveOpacity = 1;
		for (
			let ancestor: Element | null = element;
			ancestor;
			ancestor = ancestor.parentElement
		) {
			effectiveOpacity *= Number.parseFloat(style(ancestor).opacity) || 1;
			if (effectiveOpacity < 0.5) {
				violations.push(
					`${where}: value effectively invisible (ancestor opacity)`,
				);
				break;
			}
		}
		// A clip-path hides glyphs while keeping the box intact and hit-testable.
		for (
			let clipped: Element | null = element;
			clipped && region.contains(clipped);
			clipped = clipped.parentElement
		) {
			if (style(clipped).clipPath !== "none") {
				violations.push(`${where}: value clipped via clip-path`);
				break;
			}
		}
		// Camouflage: text painted in the card's own background color is invisible
		// even though every visibility, opacity, and paint probe above passes.
		const cardBackground =
			alphaOf(style(container).backgroundColor) >= 0.5
				? style(container).backgroundColor
				: null;
		if (cardBackground && rgbKey(cardBackground) === rgbKey(valueStyle.color)) {
			violations.push(
				`${where}: value text color indistinguishable from the card background`,
			);
		}

		const cardRect = container.getBoundingClientRect();
		const inside = (outer: DOMRect) =>
			rect.left >= outer.left - 1 &&
			rect.right <= outer.right + 1 &&
			rect.top >= outer.top - 1 &&
			rect.bottom <= outer.bottom + 1;
		if (!inside(cardRect)) {
			violations.push(`${where}: value outside its record card`);
		}
		if (!inside(regionRect)) {
			violations.push(`${where}: value clipped by the board region`);
		}

		const cx = rect.left + rect.width / 2;
		const cy = rect.top + rect.height / 2;
		const samples: Array<[number, number]> = [
			[cx, cy],
			[rect.left + 1, cy],
			[rect.right - 1, cy],
			[cx, rect.top + 1],
			[cx, rect.bottom - 1],
		];
		let painted = 0;
		for (const [x, y] of samples) {
			const hit = doc.elementFromPoint(x, y);
			if (!hit) {
				violations.push(
					`${where}: nothing painted at ${x.toFixed(0)},${y.toFixed(0)}`,
				);
				continue;
			}
			if (hit === element || element.contains(hit) || hit.contains(element)) {
				painted += 1;
				continue;
			}
			violations.push(
				`${where}: text covered by ${describe(hit)} at ${x.toFixed(0)},${y.toFixed(0)}`,
			);
		}
		if (painted === 0) {
			violations.push(`${where}: value text never painted on top`);
		}
		// elementFromPoint skips pointer-events:none boxes by specification, so a
		// hit-test pass alone cannot see an opaque overlay that mutes its own hit
		// testing. Enumerate real elements and pseudo-elements whose boxes cover
		// the text center and paint an opaque pixel there, regardless of
		// pointer-events or pseudo content.
		for (const other of region.querySelectorAll("*")) {
			if (
				other === element ||
				element.contains(other) ||
				other.contains(element)
			) {
				continue;
			}
			const otherRect = other.getBoundingClientRect();
			if (
				otherRect.right <= cx ||
				otherRect.left >= cx ||
				otherRect.bottom <= cy ||
				otherRect.top >= cy
			) {
				continue;
			}
			const otherStyle = style(other);
			// Only an opaque background or background image can paint over the text
			// centre; outset box-shadows are handled board-wide below.
			const paintsOver =
				alphaOf(otherStyle.backgroundColor) >= 0.5 ||
				otherStyle.backgroundImage !== "none";
			if (paintsOver) {
				violations.push(
					`${where}: opaque element ${describe(other)} covers the text centre`,
				);
			}
		}
	};

	function styleWithPseudo(element: Element, pseudo: string) {
		return win.getComputedStyle(element, pseudo);
	}

	const checkPseudoOverlays = (where: string, point: DOMRect) => {
		for (const host of region.querySelectorAll("*")) {
			for (const pseudo of ["::before", "::after"] as const) {
				const pseudoStyle = styleWithPseudo(host, pseudo);
				// An empty-content pseudo still paints its background, so content is
				// not a skip condition: only a transparent (or absent) background is.
				if (alphaOf(pseudoStyle.backgroundColor) < 0.5) continue;
				const hostRect = host.getBoundingClientRect();
				const overlaps =
					hostRect.right > point.left &&
					hostRect.left < point.right &&
					hostRect.bottom > point.top &&
					hostRect.top < point.bottom;
				if (overlaps) {
					violations.push(
						`${where}: opaque ${pseudo} of ${describe(host)} covers text`,
					);
				}
			}
		}
	};

	const header = table.previousElementSibling;

	const cards = Array.from(table.querySelectorAll("tbody tr"));
	for (const [cardIndex, card] of cards.entries()) {
		if (!(card instanceof HTMLElement)) continue;
		const cells = Array.from(card.children).filter(
			(child): child is HTMLElement => child.tagName === "TD",
		);
		for (const [cellIndex, cell] of cells.entries()) {
			const where = `row ${cardIndex + 1} field ${cellIndex + 1}`;
			const valueNodes = Array.from(cell.childNodes).filter((node) => {
				if (
					node instanceof Element &&
					node.getAttribute("aria-hidden") === "true"
				) {
					return false;
				}
				return (node.textContent?.trim().length ?? 0) > 0;
			});
			if (valueNodes.length === 0) {
				violations.push(`${where}: no value rendered`);
				continue;
			}
			for (const node of valueNodes) {
				checkValue(node, where, card);
			}
			checkPseudoOverlays(where, cell.getBoundingClientRect());
			// A cell stretched by a fixed grid height stretches its own boxes with
			// it, so boxes cannot prove natural sizing. The text cannot stretch:
			// compare the cell box against the rendered height of its label/value
			// TEXT plus the cell's own padding.
			const cellRect = cell.getBoundingClientRect();
			const cellStyle = style(cell);
			const textHeight = (node: Node) => {
				const range = doc.createRange();
				range.selectNodeContents(node);
				return range.getBoundingClientRect().height;
			};
			const kidTextHeights = Array.from(cell.childNodes).map((child) =>
				textHeight(child),
			);
			const cellNatural =
				(Number.parseFloat(cellStyle.paddingTop) || 0) +
				(Number.parseFloat(cellStyle.paddingBottom) || 0) +
				Math.max(0, ...kidTextHeights);
			if (cellRect.height > cellNatural + 6) {
				violations.push(
					`${where}: stretched cell (${cellRect.height.toFixed(0)}px vs natural ${cellNatural.toFixed(0)}px)`,
				);
			}
		}
		// The card must be as tall as its content: a fixed stylesheet height that
		// stretches the grid must fail even though every paint check above passes.
		// A card short enough to clip also fails here, even though the value-level
		// scrollIntoView can programmatically reveal content inside an
		// overflow:hidden box.
		const cardRect = card.getBoundingClientRect();
		if (card.scrollHeight > card.clientHeight + 1) {
			violations.push(
				`row ${cardIndex + 1}: card content clipped (scrollHeight ${card.scrollHeight} > clientHeight ${card.clientHeight})`,
			);
		}
		const cardStyle = style(card);
		const gap = Number.parseFloat(cardStyle.rowGap) || 0;
		const padTop = Number.parseFloat(cardStyle.paddingTop) || 0;
		const padBottom = Number.parseFloat(cardStyle.paddingBottom) || 0;
		const content = cells.reduce(
			(sum, cell) => sum + cell.getBoundingClientRect().height,
			0,
		);
		const natural =
			padTop + padBottom + gap * Math.max(cells.length - 1, 0) + content;
		if (cardRect.height > natural + 6) {
			violations.push(
				`row ${cardIndex + 1}: stretched card (${cardRect.height.toFixed(0)}px vs natural ${natural.toFixed(0)}px)`,
			);
		}
	}

	// The shown/total lane must itself be visible and painted inside the clipped
	// header, not merely present in the DOM.
	const countLane = header?.querySelector(".owner-health__board-count");
	if (countLane) {
		checkValue(countLane, "board count", header);
	} else {
		violations.push("board count lane missing");
	}

	// An outset box-shadow paints outside its box and can cover record content
	// anywhere on the board; the accepted accents are inset and stay excluded.
	for (const element of region.querySelectorAll("*")) {
		const elementStyle = style(element);
		if (
			elementStyle.boxShadow !== "none" &&
			!elementStyle.boxShadow.includes("inset")
		) {
			violations.push(
				`outset box-shadow on ${describe(element)} can paint over record content`,
			);
		}
	}

	// The collection lane is also content-sized: a fixed height there stretches
	// the grid without moving any text.
	const tbody = table.querySelector("tbody");
	if (tbody instanceof HTMLElement) {
		const tbodyRect = tbody.getBoundingClientRect();
		const tbodyStyle = style(tbody);
		const gap = Number.parseFloat(tbodyStyle.rowGap) || 0;
		const padTop = Number.parseFloat(tbodyStyle.paddingTop) || 0;
		const padBottom = Number.parseFloat(tbodyStyle.paddingBottom) || 0;
		const cardSum = cards.reduce(
			(sum, card) => sum + card.getBoundingClientRect().height,
			0,
		);
		const natural =
			padTop + padBottom + gap * Math.max(cards.length - 1, 0) + cardSum;
		if (tbodyRect.height > natural + 6) {
			violations.push(
				`collection: stretched lane (${tbodyRect.height.toFixed(0)}px vs natural ${natural.toFixed(0)}px)`,
			);
		}
	}

	const data = {
		title:
			header?.querySelector(".owner-health__board-title")?.textContent ?? null,
		count:
			header?.querySelector(".owner-health__board-count")?.textContent ?? null,
		headerRect: header
			? {
					left: header.getBoundingClientRect().left,
					right: header.getBoundingClientRect().right,
					top: header.getBoundingClientRect().top,
					bottom: header.getBoundingClientRect().bottom,
				}
			: null,
		columns: Array.from(table.querySelectorAll("thead th")).map(
			(th) => th.textContent?.trim() ?? "",
		),
		thDisplayNone: Array.from(table.querySelectorAll("thead th")).map(
			(th) => style(th).display === "none" || style(th).visibility === "hidden",
		),
		rows: cards.map((card) => ({
			labels: Array.from(
				card.querySelectorAll(":scope > td > .owner-health__field-label"),
			).map((label) => label.textContent?.trim() ?? ""),
			values: Array.from(card.querySelectorAll(":scope > td")).map((cell) => {
				const label = cell.querySelector(":scope > .owner-health__field-label");
				const clone = label ? (label.textContent ?? "") : "";
				return (cell.textContent ?? "").replace(clone, "").trim();
			}),
		})),
		bdiCount: table.querySelectorAll("bdi").length,
		bdiIsolated: Array.from(table.querySelectorAll("bdi")).every(
			(bdi) => style(bdi).unicodeBidi === "isolate",
		),
		region: {
			overflowX: style(region).overflowX,
			overflowY: style(region).overflowY,
			maxBlockHeight: style(region).maxHeight,
		},
		tableDisplay: style(table).display,
		tbodyDisplay: tbody ? style(tbody).display : null,
		hasArabicIndicDigits: /[\u0660-\u0669\u06F0-\u06F9]/u.test(
			table.textContent ?? "",
		),
	};

	return { violations, data };
}

/** Node-side comparison of the in-page collection against the literal oracle. */
async function collectBoardViolations(
	page: Page,
	tableSelector: string,
	oracle: MobileBoardOracle,
	label: string,
): Promise<string[]> {
	const result = await page.locator(tableSelector).evaluate(collectMobileBoard);
	if (result.data === null) return result.violations;
	const { violations, data } = result;
	const found: string[] = [...violations];
	const push = (message: string) => found.push(`${label}: ${message}`);

	if (data.title?.trim() !== oracle.title) {
		push(`board title "${data.title?.trim()}" != "${oracle.title}"`);
	}
	if (data.count?.replace(/\s+/g, " ").trim() !== oracle.count) {
		push(`board count "${data.count?.trim()}" != "${oracle.count}"`);
	}
	if (data.columns.join("|") !== oracle.columns.join("|")) {
		push(
			`column headers [${data.columns.join(", ")}] != [${oracle.columns.join(", ")}]`,
		);
	}
	if (data.thDisplayNone.some(Boolean)) {
		push("a column header is display:none or visibility:hidden");
	}
	if (data.rows.length !== oracle.rows.length) {
		push(`record count ${data.rows.length} != ${oracle.rows.length}`);
	}
	for (const [index, row] of data.rows.entries()) {
		const expected = oracle.rows[index];
		if (!expected) break;
		if (row.labels.join("|") !== oracle.columns.join("|")) {
			push(
				`row ${index + 1} field labels [${row.labels.join(", ")}] != [${oracle.columns.join(", ")}]`,
			);
		}
		for (const [field, value] of row.values.entries()) {
			const expectedValue = expected[field];
			if (expectedValue === undefined) {
				push(`row ${index + 1} has an extra field ${field + 1}`);
				continue;
			}
			if (value !== expectedValue) {
				push(
					`row ${index + 1} field ${field + 1} "${value}" != "${expectedValue}"`,
				);
			}
		}
	}
	if (!data.bdiIsolated || data.bdiCount === 0) {
		push("bdi isolation is missing");
	}
	if (data.hasArabicIndicDigits) {
		push("Arabic-Indic digits rendered; Western digits are required");
	}
	if (data.region.overflowX !== "clip" || data.region.overflowY !== "clip") {
		push(
			`region overflow is ${data.region.overflowX}/${data.region.overflowY}, expected clip`,
		);
	}
	if (data.region.maxBlockHeight !== "none") {
		push(
			`region max-block-size is ${data.region.maxBlockHeight}, expected none`,
		);
	}
	if (data.tableDisplay !== "block") {
		push(`mobile table display is ${data.tableDisplay}, expected block`);
	}
	if (data.tbodyDisplay !== "grid") {
		push(`mobile collection display is ${data.tbodyDisplay}, expected grid`);
	}
	return found;
}

test("mobile stacked records keep every required value visible, painted, and contained", async ({
	page,
}) => {
	await emulateDeviceTimeZone(page);
	await mockOwnerSurfaces(page);
	await page.goto("/admin");

	for (const locale of ["ar", "en"] as const) {
		await setLocale(page, locale);
		for (const width of [320, 360, 390]) {
			await page.setViewportSize({ width, height: 844 });
			await expect(page.locator(offlineTable)).toBeVisible();

			const offline = await collectBoardViolations(
				page,
				offlineTable,
				mobileOracle[locale].offline,
				`offline ${locale} ${width}px`,
			);
			expect(offline).toEqual([]);
			const incidents = await collectBoardViolations(
				page,
				incidentTable,
				mobileOracle[locale].incidents,
				`incidents ${locale} ${width}px`,
			);
			expect(incidents).toEqual([]);

			await expectNoDocumentOverflow(page);
		}
		await page.setViewportSize({ width: 390, height: 844 });
		await captureReview(
			page,
			`owner-health-mobile-stacked-${locale}-390x844.png`,
		);
	}
});

test("Arabic unconfirmed delivery wording is pinned by the independent oracle", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "ar"),
	);
	await mockOwnerSurfaces(page, { summary: mobileUnconfirmed });
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/admin");
	await setLocale(page, "ar");
	await expect(page.locator(incidentTable)).toBeVisible();

	const oracle = {
		...mobileOracle.ar.incidents,
		rows: mobileOracle.ar.incidents.rows.map((row, index) =>
			index === 0 ? [...row.slice(0, 4), unconfirmedOracle.ar] : row,
		),
	};
	const violations = await collectBoardViolations(
		page,
		incidentTable,
		oracle,
		"incidents ar unconfirmed 390px",
	);
	expect(violations).toEqual([]);

	await setLocale(page, "en");
	const oracleEn = {
		...mobileOracle.en.incidents,
		rows: mobileOracle.en.incidents.rows.map((row, index) =>
			index === 0 ? [...row.slice(0, 4), unconfirmedOracle.en] : row,
		),
	};
	const violationsEn = await collectBoardViolations(
		page,
		incidentTable,
		oracleEn,
		"incidents en unconfirmed 390px",
	);
	expect(violationsEn).toEqual([]);
	await captureReview(page, "owner-health-mobile-unconfirmed-en-390x844.png");
});

test("the desktop table composition at 721px and wider is unchanged", async ({
	page,
}) => {
	await mockOwnerSurfaces(page);
	await page.goto("/admin");

	for (const width of [721, 768, 820, 1024, 1200, 1440]) {
		for (const locale of ["ar", "en"] as const) {
			await setLocale(page, locale);
			await page.setViewportSize({ width, height: 900 });
			await expect(page.locator(offlineTable)).toBeVisible();

			const desktop = await page.locator(offlineTable).evaluate((table) => {
				const region = table.closest("section");
				const win = table.ownerDocument.defaultView;
				if (!(region instanceof HTMLElement) || !win) return null;
				const computed = (element: Element, pseudo?: string) =>
					win.getComputedStyle(element, pseudo);
				const headerEl = table.previousElementSibling;
				const boardHeader = headerEl?.matches(".owner-health__board-header")
					? headerEl
					: headerEl?.querySelector(".owner-health__board-header");
				const ongoing = table.querySelector("tbody tr[data-ongoing]");
				return {
					overflowX: computed(region).overflowX,
					maxBlockHeight: computed(region).maxHeight,
					boardHeaderDisplay: computed(boardHeader ?? table).display,
					fieldLabelDisplay: computed(
						table.querySelector(".owner-health__field-label") ?? table,
					).display,
					theadPosition: computed(table.querySelector("thead") ?? table)
						.position,
					tableDisplay: computed(table).display,
					tdDisplay: computed(table.querySelector("td") ?? table).display,
					accent: ongoing
						? computed(ongoing.querySelector("td") ?? ongoing).boxShadow
						: null,
					scrollHintVisible:
						(document.querySelector(".owner-health__scroll-hint")
							? computed(document.querySelector(".owner-health__scroll-hint"))
									.display
							: "missing") !== "none",
				};
			});
			expect(desktop, `${locale} ${width}px`).toEqual({
				overflowX: "auto",
				maxBlockHeight: "420px",
				boardHeaderDisplay: "none",
				fieldLabelDisplay: "none",
				theadPosition: "static",
				tableDisplay: "table",
				tdDisplay: "table-cell",
				accent: expect.stringContaining("2px"),
				// Pre-existing behaviour: the sideways-scroll hint shows only where
				// the table actually scrolls, 721px through 1023px.
				scrollHintVisible: width <= 1023,
			});
		}
	}
});

test("the mobile contract rejects every false-pass fault injection", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await mockOwnerSurfaces(page);

	/**
	 * Each fault re-navigates from a clean load at a true mobile viewport, proves
	 * the baseline contract clean, applies exactly one fault, and requires the
	 * collector to reject the board — a fault that passes on an already-violated
	 * or desktop-rendered board proves nothing. The accepted border-only
	 * tr::before runs through every baseline and fault untouched: the positive
	 * collector above passes with it, so decorative borders never reject.
	 */
	const expectFaultRejected = async (
		name: string,
		fault: () => Promise<void>,
		table: string,
		oracle: MobileBoardOracle = mobileOracle.en.offline,
	) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto("/admin");
		await expect(page.locator(offlineTable)).toBeVisible();
		const baseline = await collectBoardViolations(
			page,
			table,
			oracle,
			`fault ${name} baseline`,
		);
		expect(
			baseline,
			`fault "${name}" baseline must be clean before injecting`,
		).toEqual([]);
		await fault();
		const violations = await collectBoardViolations(
			page,
			table,
			oracle,
			`fault ${name}`,
		);
		expect(
			violations,
			`fault "${name}" must be rejected, got none`,
		).not.toEqual([]);
	};

	const inject = (css: string) => async () => {
		await page.addStyleTag({ content: css });
	};
	const firstValue = `${offlineTable} tbody tr:first-child td:first-child bdi`;

	await expectFaultRejected(
		"values hidden",
		inject(`${offlineTable} tbody tr td { display: none !important; }`),
		offlineTable,
	);
	await expectFaultRejected(
		"values translucent",
		inject(`${offlineTable} tbody tr { opacity: 0.05 !important; }`),
		offlineTable,
	);
	await expectFaultRejected(
		"text transparent",
		inject(`${firstValue} { color: transparent !important; }`),
		offlineTable,
	);
	await expectFaultRejected(
		"value moved outside its card",
		inject(`${firstValue} { transform: translate(80vw, 200px) !important; }`),
		offlineTable,
	);
	await expectFaultRejected(
		"values clipped by the card",
		inject(
			`${offlineTable} tbody tr { block-size: 48px !important; height: 48px !important; overflow: hidden !important; }`,
		),
		offlineTable,
	);
	await expectFaultRejected(
		"oversized fixed card height stretches the grid",
		inject(`${offlineTable} tbody tr { block-size: 2000px !important; }`),
		offlineTable,
	);
	await expectFaultRejected(
		"oversized fixed collection height stretches the grid",
		inject(`${offlineTable} tbody { block-size: 2000px !important; }`),
		offlineTable,
	);
	const injectCoverOverlay = (pointerEvents: "auto" | "none") => async () => {
		// The overlay lives inside the value's own cell, so it covers the text
		// wherever the contract's own scrolling places the card.
		await page.evaluate((pointerEvents) => {
			const td = document.querySelector(
				"[data-owner-health-offline-table] tbody tr:first-child td:first-child",
			);
			if (!(td instanceof HTMLElement)) return;
			td.style.position = "relative";
			const overlay = document.createElement("div");
			overlay.style.position = "absolute";
			overlay.style.inset = "0";
			overlay.style.background = "rgb(20, 16, 20)";
			overlay.style.zIndex = "50";
			overlay.style.pointerEvents = pointerEvents;
			td.append(overlay);
		}, pointerEvents);
	};

	await expectFaultRejected(
		"opaque overlay covers text",
		injectCoverOverlay("auto"),
		offlineTable,
	);
	await expectFaultRejected(
		"opaque pseudo-element covers text",
		inject(
			`${offlineTable} tbody tr:first-child td:first-child::after { content: "x"; position: absolute; inset: 0; background: rgb(20, 16, 20) !important; }`,
		),
		offlineTable,
	);
	await expectFaultRejected(
		"pointer-events none overlay covers text",
		injectCoverOverlay("none"),
		offlineTable,
	);
	await expectFaultRejected(
		"text camouflaged as the card background",
		inject(`${firstValue} { color: rgb(23, 23, 27) !important; }`),
		offlineTable,
	);
	await expectFaultRejected(
		"value clipped via clip-path",
		inject(`${firstValue} { clip-path: inset(50%) !important; }`),
		offlineTable,
	);
	await expectFaultRejected(
		"outset box-shadow paints over content",
		inject(
			`${offlineTable} tbody tr td:nth-child(2) { box-shadow: 0 0 0 300px rgb(20, 16, 20) !important; }`,
		),
		offlineTable,
	);
	await expectFaultRejected(
		"summary lanes swapped",
		async () => {
			await page.evaluate(() => {
				const counts = document.querySelectorAll(".owner-health__board-count");
				if (counts.length >= 2) {
					const first = counts[0];
					const second = counts[1];
					const swap = first.textContent;
					first.textContent = second.textContent;
					second.textContent = swap;
				}
			});
		},
		offlineTable,
	);
	await expectFaultRejected(
		"required field removed",
		async () => {
			await page.evaluate(() => {
				document
					.querySelector(
						"[data-owner-health-offline-table] tbody tr td:last-child",
					)
					?.remove();
			});
		},
		offlineTable,
	);

	// The Arabic unconfirmed wording is pinned in Arabic with its own fixture:
	// rewriting the rendered cell must be rejected by the literal oracle.
	await page.unroute("**/rpc/admin/health/summary");
	await page.route("**/rpc/admin/health/summary", (route) =>
		route.fulfill({ status: 200, json: { json: mobileUnconfirmed } }),
	);
	// The addInitScript above pins English on every load; the reload must opt
	// back into Arabic explicitly.
	await page.setViewportSize({ width: 390, height: 844 });
	await page.evaluate(() => window.localStorage.setItem("fitway.locale", "ar"));
	await page.reload();
	await setLocale(page, "ar");
	const oracleArUnconfirmed: MobileBoardOracle = {
		...mobileOracle.ar.incidents,
		rows: mobileOracle.ar.incidents.rows.map((row, index) =>
			index === 0 ? [...row.slice(0, 4), unconfirmedOracle.ar] : row,
		),
	};
	const violationsBefore = await collectBoardViolations(
		page,
		incidentTable,
		oracleArUnconfirmed,
		"fault baseline ar unconfirmed",
	);
	expect(violationsBefore).toEqual([]);
	await page.evaluate(() => {
		const cell = document.querySelector(
			"[data-owner-health-incident-table] tbody tr:first-child td:last-child bdi",
		);
		if (cell) cell.textContent = "وصلت كلها";
	});
	const violationsAfter = await collectBoardViolations(
		page,
		incidentTable,
		oracleArUnconfirmed,
		"fault Arabic unconfirmed removed",
	);
	expect(violationsAfter, "removing غير مؤكد must be rejected").not.toEqual([]);
});
