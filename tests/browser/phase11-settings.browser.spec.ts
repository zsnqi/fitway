import { mkdir } from "node:fs/promises";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, type Route, test } from "@playwright/test";

async function selectSettings(page: Page) {
	const tab = page.getByRole("tab", { name: /^(?:Settings|الإعدادات)$/u });
	await tab.focus();
	await page.keyboard.press("Enter");
}

const ownerAuth = {
	principalId: "00000000-0000-4000-8000-000000000091",
	principalKind: "owner",
	role: "owner",
	sessionId: "00000000-0000-4000-8000-000000000092",
	expiresAt: "2026-08-30T00:00:00.000Z",
	active: true,
} as const;

/** The configured gym timezone for this fixture is +03:00 all year. */
const GYM_TIME_ZONE = "Asia/Riyadh";

const daily = {
	businessDay: "2026-08-10",
	timeline: [
		{
			state: "value",
			minuteStartUtc: "2026-08-10T07:00:00.000Z",
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
		minuteStartUtc: "2026-08-10T07:00:00.000Z",
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
};

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
};

function snapshotWithCapacity(capacity: number) {
	return {
		...settingsSnapshot,
		editable: { ...settingsSnapshot.editable, capacity },
	};
}

function savedOutput(version: number, capacity: number) {
	return {
		settings: { ...snapshotWithCapacity(capacity), version },
		auditId: 42,
	};
}

function rpcError(status: number, code: string, message: string) {
	// The oRPC wire error shape: a typed error the client rehydrates as an
	// ORPCError with the same code and data.
	return {
		json: { defined: false, code, status, message, data: null },
	};
}

function conflictError() {
	return {
		json: {
			defined: false,
			code: "CONFLICT",
			status: 409,
			message: "Settings were updated by someone else",
			data: { code: "settings_version_conflict" },
		},
	};
}

function deferred() {
	let resolve: (() => void) | null = null;
	const promise = new Promise<void>((r) => {
		resolve = r;
	});
	return { promise, resolve: () => resolve?.() };
}

const section = ".owner-settings";
const status = ".owner-settings__status";
const saveButtons = "button[type='submit'].owner-settings__save";
const discardButtons = "button.owner-settings__discard";
const lowerFrontier = ".owner-settings__actions--lower";
const upperActions = ".owner-settings__actions--upper";

let observedReadRequests = 0;
let observedDailyRequests = 0;
let observedTimeContextRequests = 0;
let observedUpdateRequests: unknown[] = [];
let readHold: { promise: Promise<void>; resolve: () => void } | null = null;
let updateHold: { promise: Promise<void>; resolve: () => void } | null = null;
let readResponse: { status: number; body: unknown } = {
	status: 200,
	body: { json: settingsSnapshot },
};
let updateResponse: { status: number; body: unknown } = {
	status: 200,
	body: { json: savedOutput(8, 240) },
};

async function mockOwnerSurfaces(
	page: Page,
	options: { readStatus?: number; dailyStatusAfterFirst?: number } = {},
) {
	observedReadRequests = 0;
	observedDailyRequests = 0;
	observedTimeContextRequests = 0;
	observedUpdateRequests = [];
	readHold = null;
	updateHold = null;
	readResponse = {
		status: 200,
		body: { json: settingsSnapshot },
	};
	if (options.readStatus && options.readStatus !== 200) {
		readResponse = {
			status: options.readStatus,
			body: rpcError(
				options.readStatus,
				"INTERNAL_SERVER_ERROR",
				"Internal Server Error",
			),
		};
	}
	updateResponse = { status: 200, body: { json: savedOutput(8, 240) } };

	await page.route("**/rpc/admin/session", (route) =>
		route.fulfill({ status: 200, json: { json: ownerAuth } }),
	);
	await page.route("**/rpc/admin/analytics/daily", async (route) => {
		observedDailyRequests += 1;
		if (options.dailyStatusAfterFirst && observedDailyRequests > 1) {
			await route.fulfill({
				status: options.dailyStatusAfterFirst,
				json: rpcError(
					options.dailyStatusAfterFirst,
					"SERVICE_UNAVAILABLE",
					"Service Unavailable",
				),
			});
			return;
		}
		await route.fulfill({ status: 200, json: { json: daily } });
	});
	await page.route("**/rpc/admin/analytics/timeContext", (route) => {
		observedTimeContextRequests += 1;
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
	await page.route("**/rpc/admin/audit/list", (route) =>
		route.fulfill({
			status: 200,
			json: { json: { entries: [], nextCursor: null } },
		}),
	);
	await page.route("**/rpc/admin/health/summary", (route) =>
		route.fulfill({ status: 200, json: { json: healthSummary } }),
	);
	await page.route("**/rpc/admin/access/list", (route) =>
		route.fulfill({ status: 200, json: { json: { principals: [] } } }),
	);

	await page.route("**/rpc/admin/settings/read", async (route) => {
		observedReadRequests += 1;
		if (readHold) {
			await readHold.promise;
		}
		await route.fulfill({
			status: readResponse.status,
			json: readResponse.body,
		});
	});

	await page.route("**/rpc/admin/settings/update", async (route: Route) => {
		observedUpdateRequests.push(route.request().postDataJSON()?.json);
		if (updateHold) {
			await updateHold.promise;
		}
		await route.fulfill({
			status: updateResponse.status,
			json: updateResponse.body,
		});
	});
}

async function captureReview(page: Page, name: string) {
	const reviewDirectory = process.env.FITWAY_PLAYWRIGHT_REVIEW_DIR;
	if (!reviewDirectory) {
		throw new Error("FITWAY_PLAYWRIGHT_REVIEW_DIR is required");
	}
	await hideShellSkipLink(page);
	await mkdir(reviewDirectory, { recursive: true });
	await page.screenshot({
		path: path.join(reviewDirectory, name),
		fullPage: true,
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

async function expectNoDocumentOverflow(page: Page) {
	const overflow = await page.evaluate(() => ({
		document: document.documentElement.scrollWidth - window.innerWidth,
		body: document.body.scrollWidth - window.innerWidth,
		settings:
			(document.querySelector<HTMLElement>(".owner-settings")?.scrollWidth ??
				0) -
			(document.querySelector<HTMLElement>(".owner-settings")?.clientWidth ??
				0),
	}));
	expect(overflow.document).toBeLessThanOrEqual(0);
	expect(overflow.body).toBeLessThanOrEqual(0);
	expect(overflow.settings).toBeLessThanOrEqual(0);
}

async function hideShellSkipLink(page: Page) {
	await page.addStyleTag({
		content: ".operations-skip-link { display: none !important; }",
	});
	await expect(page.locator(".operations-skip-link")).toBeHidden();
}

function seriousViolations(
	results: Awaited<ReturnType<AxeBuilder["analyze"]>>,
) {
	return results.violations.filter(
		({ impact }) => impact === "serious" || impact === "critical",
	);
}

async function openOwnerPage(page: Page, options?: { readStatus?: number }) {
	await mockOwnerSurfaces(page, options);
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/admin");
	await selectSettings(page);
	await expect(page.locator(section)).toBeVisible();
}

test("the section loads independently while the shared analytics query is pending", async ({
	page,
}) => {
	await mockOwnerSurfaces(page);
	const hold = deferred();
	await page.route("**/rpc/admin/analytics/daily", async (route) => {
		await hold.promise;
		await route.fulfill({ status: 200, json: { json: daily } });
	});
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/admin");
	await selectSettings(page);

	await expect.poll(() => observedReadRequests).toBe(1);
	await expect(page.locator(section)).toBeVisible();
	await expect(
		page.getByRole("heading", { level: 1, name: "Settings" }),
	).toBeVisible();
	await expect(page.locator("main h1:visible")).toHaveCount(1);

	hold.resolve();
	await expect(
		page.locator(`${upperActions} .owner-settings__version`),
	).toContainText("Current version 7");
	expect(observedReadRequests).toBe(1);
});

test("a late first section visit neither refetches Daily nor loses a mounted Settings draft", async ({
	page,
}) => {
	await page.addInitScript(() => {
		const realNow = Date.now.bind(Date);
		let offset = 0;
		Date.now = () => realNow() + offset;
		Object.defineProperty(window, "__fitwayAdvanceNow", {
			value: (milliseconds: number) => {
				offset += milliseconds;
			},
		});
		window.localStorage.setItem("fitway.locale", "en");
	});
	await mockOwnerSurfaces(page);
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/admin");
	await selectSettings(page);
	const capacity = page.locator("input[data-testid='capacity']");
	await expect(capacity).toHaveValue("220");
	await capacity.fill("333");

	await page.getByRole("tab", { name: "Daily" }).click();
	await page.evaluate(() =>
		(
			window as typeof window & {
				__fitwayAdvanceNow: (milliseconds: number) => void;
			}
		).__fitwayAdvanceNow(61_000),
	);
	await page.getByRole("tab", { name: "Accounts & Sign-in" }).click();
	await expect(page.locator(".owner-access")).toBeVisible();
	await page.waitForTimeout(300);

	expect(observedDailyRequests).toBe(1);
	expect(observedTimeContextRequests).toBe(1);
	await page.getByRole("tab", { name: "Settings" }).click();
	await expect(capacity).toHaveValue("333");
});

test("the first observer after a stale full-route remount refetches exactly once", async ({
	page,
}) => {
	await page.addInitScript(() => {
		const realNow = Date.now.bind(Date);
		let offset = 0;
		Date.now = () => realNow() + offset;
		Object.defineProperty(window, "__fitwayAdvanceNow", {
			value: (milliseconds: number) => {
				offset += milliseconds;
			},
		});
		window.localStorage.setItem("fitway.locale", "en");
	});
	await mockOwnerSurfaces(page);
	await page.route("**/api/auth/session", (route) =>
		route.fulfill({ status: 200, json: { auth: ownerAuth } }),
	);
	await page.route("**/rpc/staff/operationalSnapshot", (route) =>
		route.fulfill({
			status: 503,
			json: rpcError(503, "SERVICE_UNAVAILABLE", "Service Unavailable"),
		}),
	);
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/admin");
	await expect.poll(() => observedDailyRequests).toBe(1);
	await expect.poll(() => observedTimeContextRequests).toBe(1);

	await page.evaluate(() =>
		(
			window as typeof window & {
				__fitwayAdvanceNow: (milliseconds: number) => void;
			}
		).__fitwayAdvanceNow(61_000),
	);
	await page.locator(".owner-nav__link").first().click();
	await expect(page).toHaveURL(/\/staff$/u);
	await expect(page.locator(".owner-section-switch")).toHaveCount(0);
	await page.goBack();
	await expect(page).toHaveURL(/\/admin$/u);
	await expect.poll(() => observedDailyRequests).toBe(2);
	await expect.poll(() => observedTimeContextRequests).toBe(2);
	await page.waitForTimeout(300);
	expect(observedDailyRequests).toBe(2);
	expect(observedTimeContextRequests).toBe(2);
});

test("a failed stale reconnect preserves cached Daily data and a mounted Settings draft", async ({
	page,
}) => {
	await page.addInitScript(() => {
		const realNow = Date.now.bind(Date);
		let offset = 0;
		Date.now = () => realNow() + offset;
		Object.defineProperty(window, "__fitwayAdvanceNow", {
			value: (milliseconds: number) => {
				offset += milliseconds;
			},
		});
		window.localStorage.setItem("fitway.locale", "en");
	});
	await mockOwnerSurfaces(page, { dailyStatusAfterFirst: 503 });
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/admin");
	await selectSettings(page);
	const capacity = page.locator("input[data-testid='capacity']");
	await expect(capacity).toHaveValue("220");
	await capacity.fill("333");

	await page.evaluate(() =>
		(
			window as typeof window & {
				__fitwayAdvanceNow: (milliseconds: number) => void;
			}
		).__fitwayAdvanceNow(61_000),
	);
	await page.context().setOffline(true);
	await page.context().setOffline(false);
	await expect.poll(() => observedDailyRequests).toBe(2);
	await expect.poll(() => observedTimeContextRequests).toBe(1);

	await expect(page.locator(section)).toBeVisible();
	await expect(capacity).toHaveValue("333");
	await expect(page.locator("main h1:visible")).toHaveCount(1);
});

test("Settings loading retains one active page-level heading", async ({
	page,
}) => {
	await mockOwnerSurfaces(page);
	readHold = deferred();
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/admin");
	await selectSettings(page);
	await expect(
		page.getByRole("heading", { level: 1, name: "Settings" }),
	).toBeVisible();
	await expect(page.getByRole("status")).toContainText("Loading settings");
	await expect(page.locator("main h1:visible")).toHaveCount(1);
	await captureReview(page, "owner-settings-loading-en-desktop-1440.png");
	await page.evaluate(() => document.fonts.ready);
	await expect(page).toHaveScreenshot(
		"owner-settings-loading-route-en-desktop-1440x900.png",
		{ fullPage: true },
	);
	readHold.resolve();
	await expect(page.locator("input[data-testid='capacity']")).toHaveValue(
		"220",
	);
});

test("load failure carries its own copy and Retry; clean locks Save and renders no Discard", async ({
	page,
}) => {
	await openOwnerPage(page, { readStatus: 500 });

	await expect(page.locator(section)).toContainText(
		"Settings could not be loaded",
	);
	await expect(page.locator("main h1:visible")).toHaveCount(1);
	await captureReview(page, "owner-settings-load-failure-en-desktop-1440.png");
	await page.evaluate(() => document.fonts.ready);
	await expect(page).toHaveScreenshot(
		"owner-settings-error-route-en-desktop-1440x900.png",
		{ fullPage: true },
	);
	await expect(page.locator(section)).toContainText("Try again");
	await setLocale(page, "ar");
	await expect(page.locator(section)).toContainText("تعذر تحميل الإعدادات");
	// A retry must refetch: point the read back at the live snapshot first.
	readResponse = { status: 200, body: { json: settingsSnapshot } };
	await page.locator("button.owner-settings__retry").click();
	await expect(page.locator(section)).toContainText("الإعدادات");
	await expect(page.locator(section)).toContainText("Asia/Riyadh");
	await expect(page.locator(saveButtons).first()).toBeDisabled();
	await expect(page.locator(discardButtons)).toHaveCount(0);
	await expect(page.locator(lowerFrontier)).toHaveCount(0);
	expect(observedReadRequests).toBe(2);
});

test("clean state shows the locked timing board with copied values and Western digits", async ({
	page,
}) => {
	await openOwnerPage(page);
	await expect(page.locator(section)).toContainText(
		"Riyadh time (Asia/Riyadh)",
	);
	await expect(page.locator(section)).toContainText("20 seconds");
	await expect(page.locator(section)).toContainText("90 seconds");
	await expect(page.locator(section)).toContainText("180 seconds");
	await expect(page.locator(section)).toContainText("60 seconds");
	await expect(page.locator(section)).toContainText("All changes saved");
	await expect(page.locator(section)).toContainText("System timing");
	await expect(page.locator(saveButtons).first()).toBeDisabled();
	await expect(page.locator(discardButtons)).toHaveCount(0);
	await captureReview(page, "owner-settings-clean-en-desktop-1440.png");
});

test("dirty valid shows the upper Discard, saves once, and announces the created version", async ({
	page,
}) => {
	await openOwnerPage(page);
	await expect(page.locator(discardButtons)).toHaveCount(0);

	await page.locator("input[data-testid='capacity']").fill("240");
	await expect(page.locator(saveButtons).first()).toBeEnabled();
	// The lower frontier exists in the DOM at desktop width but is hidden; only
	// the upper Discard is visible. The unsaved state text lives beside the
	// foundations header, as in the accepted composition.
	await expect(page.locator(discardButtons)).toHaveCount(2);
	await expect(
		page.locator(`${upperActions} .owner-settings__discard`),
	).toBeVisible();
	await expect(
		page.locator(".owner-settings__board-state").first(),
	).toContainText("Unsaved changes");
	await expect(page.locator(lowerFrontier)).toBeHidden();
	await captureReview(page, "owner-settings-dirty-en-desktop-1440.png");

	updateHold = deferred();
	await page.locator(saveButtons).first().click();
	await expect(page.locator(status)).toContainText("Saving settings…");
	await expect(page.locator(saveButtons).first()).toBeDisabled();
	await expect(page.locator(saveButtons).locator("visible=true")).toHaveCount(
		1,
	);
	expect(observedUpdateRequests).toHaveLength(1);
	await captureReview(page, "owner-settings-saving-en-desktop-1440.png");

	updateHold?.resolve();
	await expect(page.locator(status)).toContainText(
		"Settings version 8 created.",
	);
	await expect(page.locator(saveButtons).first()).toBeDisabled();
	await expect(page.locator(discardButtons)).toHaveCount(0);
	await expect(
		page.locator(`${upperActions} .owner-settings__version`),
	).toContainText("Current version 8");
	await captureReview(page, "owner-settings-saved-en-desktop-1440.png");

	// The submitted snapshot is complete, never a delta.
	expect(observedUpdateRequests[0]).toMatchObject({
		expectedVersion: 7,
		editable: { ...settingsSnapshot.editable, capacity: 240 },
	});
});

test("discarding a dirty draft restores the last server snapshot locally", async ({
	page,
}) => {
	await openOwnerPage(page);

	await page.locator("input[data-testid='capacity']").fill("240");
	await page.locator("input[data-testid='reset']").fill("45");
	await page.locator(discardButtons).first().click();

	await expect(page.locator("input[data-testid='capacity']")).toHaveValue(
		"220",
	);
	await expect(page.locator("input[data-testid='reset']")).toHaveValue("15");
	await expect(page.locator(saveButtons).first()).toBeDisabled();
	expect(observedReadRequests).toBe(1);
});

test("dirty invalid locks Save, associates field errors, and announces the summary", async ({
	page,
}) => {
	await openOwnerPage(page);

	await page.locator("input[data-testid='capacity']").fill("5000000000");
	await page.locator("input[data-testid='boundary']").fill("25:00");

	await expect(page.locator(status)).toContainText(
		"Check the highlighted fields. Save stays locked until they are fixed.",
	);
	await expect(page.locator(saveButtons).first()).toBeDisabled();
	await expect(page.locator(discardButtons).first()).toBeEnabled();

	const capacity = page.locator("input[data-testid='capacity']");
	await expect(capacity).toHaveAttribute("aria-invalid", "true");
	await expect(page.locator(section)).toContainText(
		"Capacity must be between 1 and 2147483647.",
	);
	await expect(page.locator(section)).toContainText(
		"Use 24-hour time, for example 04:00.",
	);
	const describedBy = await capacity.getAttribute("aria-describedby");
	expect(describedBy).toBeTruthy();
	await expect(capacity.locator("..")).toHaveClass(
		/owner-settings__control--error/,
	);
	await expect(page.locator(`#${describedBy}`)).toContainText(
		"Capacity must be between 1 and 2147483647.",
	);

	await page.emulateMedia({ forcedColors: "active" });
	await expect(capacity.locator("..")).toHaveCSS("outline-style", "solid");
	await expect(capacity.locator("..")).toHaveCSS("outline-width", "2px");
	await page.emulateMedia({ forcedColors: "none" });
	await captureReview(page, "owner-settings-validation-en-desktop-1440.png");

	await page.locator("input[data-testid='capacity']").fill("240");
	await page.locator("input[data-testid='boundary']").fill("03:00");
	await expect(page.locator(saveButtons).first()).toBeEnabled();
});

test("an atomic failure preserves the draft and expected version and unlocks Save for retry", async ({
	page,
}) => {
	await openOwnerPage(page);

	await page.locator("input[data-testid='capacity']").fill("260");
	updateResponse = {
		status: 500,
		body: rpcError(500, "INTERNAL_SERVER_ERROR", "Internal Server Error"),
	};
	await page.locator(saveButtons).first().click();

	await expect(page.locator(status)).toContainText("Nothing was changed.");
	await expect(page.locator("input[data-testid='capacity']")).toHaveValue(
		"260",
	);
	await expect(page.locator(saveButtons).first()).toBeEnabled();
	await expect(
		page.locator(`${upperActions} .owner-settings__version`),
	).toContainText("Current version 7");
	await captureReview(
		page,
		"owner-settings-atomic-failure-en-desktop-1440.png",
	);

	await page.locator("input[data-testid='capacity']").fill("5000000000");
	await expect(page.locator(saveButtons).first()).toBeDisabled();
	await expect(page.locator(status)).toContainText(
		"Save stays locked until they are fixed.",
	);
	await expect(page.locator(status)).not.toContainText("Nothing was changed.");

	await page.locator("input[data-testid='capacity']").fill("220");
	await expect(page.locator(saveButtons).first()).toBeDisabled();
	await expect(page.locator(discardButtons)).toHaveCount(0);
	await expect(page.locator(status)).toBeEmpty();

	await page.locator("input[data-testid='capacity']").fill("260");
	await expect(page.locator(saveButtons).first()).toBeEnabled();

	updateResponse = { status: 200, body: { json: savedOutput(8, 260) } };
	await page.locator(saveButtons).first().click();
	await expect(page.locator(status)).toContainText(
		"Settings version 8 created.",
	);
	expect(observedUpdateRequests).toHaveLength(2);
	expect(observedUpdateRequests[1]).toMatchObject({ expectedVersion: 7 });
});

test("a version conflict preserves the draft, locks Save, and Discard reloads latest values without rebasing", async ({
	page,
}) => {
	await openOwnerPage(page);

	await page.locator("input[data-testid='capacity']").fill("260");
	updateResponse = {
		status: 409,
		body: conflictError(),
	};
	await page.locator(saveButtons).first().click();

	await expect(page.locator(status)).toContainText(
		"Settings changed elsewhere. Discard reloads the current values; your draft is not applied.",
	);
	await expect(page.locator(saveButtons).first()).toBeDisabled();
	await expect(page.locator("input[data-testid='capacity']")).toHaveValue(
		"260",
	);
	await expect(page.locator(discardButtons).first()).toBeEnabled();

	readResponse = {
		status: 200,
		body: { json: snapshotWithCapacity(300) },
	};
	await page.locator(discardButtons).first().click();
	await expect(page.locator(status)).not.toContainText(
		"Settings changed elsewhere.",
	);
	await expect(page.locator("input[data-testid='capacity']")).toHaveValue(
		"300",
	);
	await expect(
		page.locator(`${upperActions} .owner-settings__version`),
	).toContainText("Current version 7");
});

test("mobile conflict keeps the lower Discard visible and reloads the current snapshot", async ({
	page,
}) => {
	await openOwnerPage(page);
	await page.setViewportSize({ width: 390, height: 844 });
	await page.locator("input[data-testid='capacity']").fill("260");

	const lowerSave = page.locator(
		`${lowerFrontier} button.owner-settings__save`,
	);
	const lowerDiscard = page.locator(
		`${lowerFrontier} button.owner-settings__discard`,
	);
	await expect(lowerSave).toBeVisible();
	await expect(lowerDiscard).toBeVisible();

	updateResponse = { status: 409, body: conflictError() };
	await lowerSave.click();
	await expect(page.locator(status)).toContainText(
		"Settings changed elsewhere. Discard reloads the current values; your draft is not applied.",
	);
	await expect(lowerSave).toBeDisabled();
	await expect(lowerDiscard).toBeEnabled();

	readResponse = {
		status: 200,
		body: { json: snapshotWithCapacity(300) },
	};
	await lowerDiscard.click();
	await expect(page.locator("input[data-testid='capacity']")).toHaveValue(
		"300",
	);
	await expect(page.locator(lowerFrontier)).toHaveCount(0);
});

test("unchecking a day serializes null and removes its inputs; rechecking restores the draft-only pair; a persisted closed day starts empty and required", async ({
	page,
}) => {
	await openOwnerPage(page);

	// The checkbox is visually hidden inside its 44px label target. Locate the
	// user's click surface by the checkbox it owns; the weekday text is a
	// sibling column rather than visible label text.
	const sundayToggle = page.locator("label.owner-settings__toggle", {
		has: page.locator("input[data-testid='sun-toggle']"),
	});
	const sundayOpen = page.locator("input[data-testid='sun-open']");
	const sundayClose = page.locator("input[data-testid='sun-close']");
	await expect(sundayOpen).toHaveValue("06:00");
	await expect(sundayClose).toHaveValue("23:00");

	await sundayToggle.click();
	await expect(sundayOpen).toHaveCount(0);
	await expect(sundayClose).toHaveCount(0);
	await expect(page.locator(section)).toContainText(
		"Open and close unavailable while closed",
	);

	await sundayToggle.click();
	await expect(sundayOpen).toHaveValue("06:00");
	await expect(sundayClose).toHaveValue("23:00");

	const saturdayToggle = page.locator("label.owner-settings__toggle", {
		has: page.locator("input[data-testid='sat-toggle']"),
	});
	await saturdayToggle.click();
	const saturdayOpen = page.locator("input[data-testid='sat-open']");
	const saturdayClose = page.locator("input[data-testid='sat-close']");
	await expect(saturdayOpen).toHaveValue("");
	await expect(saturdayClose).toHaveValue("");
	await expect(saturdayOpen).toHaveAttribute("aria-invalid", "true");
	await expect(page.locator(saveButtons).first()).toBeDisabled();
	await expect(page.locator(section)).toContainText("Enter a time.");

	// Save stays locked until both required times are valid; the closed day
	// never invents defaults.
	await saturdayOpen.fill("08:00");
	await saturdayClose.fill("20:00");
	await expect(page.locator(saveButtons).first()).toBeEnabled();

	// The submitted schedule serializes the reopened day and keeps the
	// next-day Friday pair.
	updateResponse = {
		status: 200,
		body: { json: savedOutput(8, 220) },
	};
	await page.locator(saveButtons).first().click();
	await expect(page.locator(status)).toContainText(
		"Settings version 8 created.",
	);
	const submitted = observedUpdateRequests[0] as {
		editable: { weeklySchedule: Record<string, unknown> };
	};
	expect(submitted.editable.weeklySchedule.sat).toEqual({
		open: "08:00",
		close: "20:00",
	});
	expect(submitted.editable.weeklySchedule.fri).toEqual({
		open: "13:00",
		close: "01:00",
	});
});

test("mobile exposes the lower frontier only when dirty, and both Save controls share one submission controller", async ({
	page,
}) => {
	await mockOwnerSurfaces(page);
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/admin");
	await selectSettings(page);
	await expect(page.locator(section)).toBeVisible();

	// Clean: no Discard and no lower frontier on mobile either.
	await expect(page.locator(discardButtons)).toHaveCount(0);
	await expect(page.locator(lowerFrontier)).toHaveCount(0);

	await page.locator("input[data-testid='capacity']").fill("240");
	await expect(page.locator(lowerFrontier)).toBeVisible();
	await expect(page.locator(lowerFrontier)).toContainText("Unsaved changes");
	await expect(page.locator(lowerFrontier)).toContainText("Discard changes");
	await expect(page.locator(lowerFrontier)).toContainText("Save settings");
	await expect(
		page.locator(`${lowerFrontier} .owner-settings__discard`),
	).toBeVisible();
	// The upper cluster keeps version + Save only; its Discard stays hidden.
	await expect(
		page.locator(`${upperActions} .owner-settings__discard`),
	).toBeHidden();
	await captureReview(page, "owner-settings-dirty-en-mobile-390.png");

	const mobileFrontier = await page.locator(section).evaluate((root) => {
		const locked = root.querySelector<HTMLElement>(
			".owner-settings__board--locked",
		);
		const frontier = root.querySelector<HTMLElement>(
			".owner-settings__actions--lower",
		);
		const state = frontier?.querySelector<HTMLElement>(
			".owner-settings__lower-state",
		);
		const discard = frontier?.querySelector<HTMLElement>(
			".owner-settings__discard",
		);
		const save = frontier?.querySelector<HTMLElement>(".owner-settings__save");
		if (!(locked && frontier && state && discard && save)) return null;
		const lockedRect = locked.getBoundingClientRect();
		const frontierRect = frontier.getBoundingClientRect();
		const stateRect = state.getBoundingClientRect();
		const discardRect = discard.getBoundingClientRect();
		const saveRect = save.getBoundingClientRect();
		return {
			lockedBottom: lockedRect.bottom,
			frontierTop: frontierRect.top,
			frontierHeight: frontierRect.height,
			centers: [stateRect, discardRect, saveRect].map(
				(rect) => rect.top + rect.height / 2,
			),
		};
	});
	expect(mobileFrontier).not.toBeNull();
	expect(mobileFrontier?.frontierTop ?? 0).toBeGreaterThan(
		mobileFrontier?.lockedBottom ?? Number.POSITIVE_INFINITY,
	);
	expect(mobileFrontier?.frontierHeight).toBe(44);
	expect(Math.max(...(mobileFrontier?.centers ?? [0]))).toBeCloseTo(
		Math.min(...(mobileFrontier?.centers ?? [0])),
		0,
	);

	updateHold = deferred();
	// A genuine double-tap lands both clicks inside one React frame, before
	// the saving state can disable the second button. Dispatch both submits
	// synchronously to reproduce exactly that frame.
	await page.evaluate(() => {
		const saves = [
			...document.querySelectorAll<HTMLButtonElement>(
				"button[type='submit'].owner-settings__save",
			),
		];
		for (const button of saves) button.click();
	});
	await page.waitForTimeout(200);
	expect(observedUpdateRequests).toHaveLength(1);
	await expect(page.locator(status)).toContainText("Saving settings…");

	updateHold?.resolve();
	await expect(page.locator(status)).toContainText(
		"Settings version 8 created.",
	);
	await expect(page.locator(lowerFrontier)).toHaveCount(0);
});

test("Arabic renders the RTL form with explicit semantic order and preserved draft", async ({
	page,
}) => {
	await openOwnerPage(page);
	await page.locator("input[data-testid='capacity']").fill("240");

	await setLocale(page, "ar");
	await expect(page.locator(section)).toContainText("الإعدادات");
	await expect(page.locator(section)).toContainText("بداية يوم العمل");
	await expect(page.locator(section)).toContainText("نهاية النطاق الهادئ");
	await expect(page.locator("input[data-testid='capacity']")).toHaveValue(
		"240",
	);
	// Locked Latin values keep bidi isolation and Western digits.
	await expect(page.locator(section)).toContainText(
		"توقيت الرياض (Asia/Riyadh)",
	);
	await expect(page.locator(section)).toContainText("20 ثانية");

	// Arabic action vocabulary and order: Discard then Save in the upper cluster.
	await expect(page.locator(upperActions)).toContainText("تجاهل التغييرات");
	await expect(page.locator(upperActions)).toContainText("حفظ الإعدادات");
	await captureReview(page, "owner-settings-dirty-ar-desktop-1440.png");
	await page.setViewportSize({ width: 390, height: 844 });
	await expect(page.locator(lowerFrontier)).toBeVisible();
	await captureReview(page, "owner-settings-dirty-ar-mobile-390.png");
	await page.setViewportSize({ width: 1440, height: 900 });

	// The form stays fully operable in Arabic: saving announces in Arabic.
	updateResponse = { status: 200, body: { json: savedOutput(8, 240) } };
	await page.locator(saveButtons).first().click();
	await expect(page.locator(status)).toContainText(
		"تم إنشاء إصدار الإعدادات 8.",
	);

	await captureReview(page, "owner-settings-ar-desktop-1440.png");
	await setLocale(page, "en");
});

test("keyboard order follows the reading order and visible focus follows Tab", async ({
	page,
}) => {
	await openOwnerPage(page);

	const capacity = page.locator("input[data-testid='capacity']");
	await capacity.focus();
	await page.keyboard.press("ControlOrMeta+A");
	await page.keyboard.type("240");
	await expect(capacity).toHaveValue("240");

	// Tab walks forward through the form's own controls in DOM order:
	// boundary -> reset -> thresholds -> weekly.
	await page.keyboard.press("Tab");
	await expect(page.locator("input[data-testid='boundary']")).toBeFocused();
	await page.keyboard.press("Tab");
	await expect(page.locator("input[data-testid='reset']")).toBeFocused();
	await page.keyboard.press("Tab");
	await expect(
		page.locator("input[data-testid='quietMaxPercent']"),
	).toBeFocused();

	// Desktop weekly order is Opens -> Closes -> State.
	await page.locator("input[data-testid='sun-open']").focus();
	await page.keyboard.press("Tab");
	await expect(page.locator("input[data-testid='sun-close']")).toBeFocused();
	await page.keyboard.press("Tab");
	await expect(page.locator("input[data-testid='sun-toggle']")).toBeFocused();

	// Mobile recomposes the same native control as State -> Opens -> Closes;
	// the DOM order follows that visual order rather than using positive tabindex.
	await page.setViewportSize({ width: 390, height: 844 });
	await page.locator("input[data-testid='sun-toggle-mobile']").focus();
	await page.keyboard.press("Tab");
	await expect(page.locator("input[data-testid='sun-open']")).toBeFocused();
	await page.keyboard.press("Tab");
	await expect(page.locator("input[data-testid='sun-close']")).toBeFocused();

	// Enter submits the form when Save is enabled.
	await expect(page.locator(saveButtons).first()).toBeEnabled();
	await page.locator("input[data-testid='reset']").fill("45");
	await page.locator(saveButtons).first().focus();
	await page.keyboard.press("Enter");
	await expect(page.locator(status)).toContainText(
		"Settings version 8 created.",
	);
});

test("all required widths and 200 percent reflow keep the document free of horizontal overflow", async ({
	page,
}) => {
	await mockOwnerSurfaces(page);
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await page.goto("/admin");
	await selectSettings(page);
	await expect(page.locator(section)).toBeVisible();
	await page.locator("input[data-testid='capacity']").fill("240");

	for (const width of [320, 360, 390, 721, 768, 820, 1024, 1200, 1440]) {
		await page.setViewportSize({ width, height: 900 });
		await expectNoDocumentOverflow(page);
	}

	// 200% zoom / reflow at the narrowest canonical anchor.
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.evaluate(() => {
		document.documentElement.style.fontSize = "200%";
	});
	await page.setViewportSize({ width: 320, height: 900 });
	await expectNoDocumentOverflow(page);
	await captureReview(page, "owner-settings-en-200-percent-reflow.png");
	await page.evaluate(() => {
		document.documentElement.style.fontSize = "";
	});

	// Arabic covers the same sweep.
	await setLocale(page, "ar");
	for (const width of [320, 390, 768, 1440]) {
		await page.setViewportSize({ width, height: 900 });
		await expectNoDocumentOverflow(page);
	}
});

test("automated accessibility finds no serious or critical violations in either locale", async ({
	page,
}) => {
	await mockOwnerSurfaces(page);
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/admin");
	await selectSettings(page);
	await expect(page.locator(section)).toBeVisible();
	await hideShellSkipLink(page);

	const english = await new AxeBuilder({ page }).include(section).analyze();
	expect(seriousViolations(english)).toEqual([]);

	await page.locator("input[data-testid='capacity']").fill("5000000000");
	await setLocale(page, "ar");
	await expect(page.locator(section)).toContainText("مستويات الازدحام");

	const arabic = await new AxeBuilder({ page }).include(section).analyze();
	expect(seriousViolations(arabic)).toEqual([]);
});

test("canonical routed Settings frames and review states match Paper", async ({
	page,
}) => {
	await mockOwnerSurfaces(page);
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);

	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/admin");
	await selectSettings(page);
	await expect(page.locator(section)).toBeVisible();
	await hideShellSkipLink(page);
	await captureReview(page, "owner-settings-en-desktop-1440.png");
	await page.evaluate(() => document.fonts.ready);
	await expect(page).toHaveScreenshot(
		"owner-settings-route-en-desktop-1440x900.png",
		{
			fullPage: true,
		},
	);

	await setLocale(page, "ar");
	await captureReview(page, "owner-settings-ar-desktop-1440.png");

	await page.setViewportSize({ width: 390, height: 844 });
	await setLocale(page, "en");
	await page.locator("input[data-testid='capacity']").fill("240");
	await expect(page.locator(lowerFrontier)).toBeVisible();
	await page.waitForTimeout(200);
	await captureReview(page, "owner-settings-en-mobile-390.png");

	await setLocale(page, "ar");
	await page.waitForTimeout(200);
	await captureReview(page, "owner-settings-ar-mobile-390.png");
	await page.evaluate(() => document.fonts.ready);
	await expect(page).toHaveScreenshot(
		"owner-settings-route-ar-mobile-390x844.png",
		{
			fullPage: true,
		},
	);
});
