// Durable Paper-fidelity coverage plus disposable review-evidence capture for
// /staff. Canonical screenshot baselines remain untouched; these captures are
// run-scoped evidence while the assertions protect state and reflow behavior.

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

const now = "2026-07-21T15:00:00.000Z";

const staffAuth = {
	principalId: "00000000-0000-4000-8000-000000000001",
	principalKind: "shared_staff",
	role: "staff",
	sessionId: "00000000-0000-4000-8000-000000000002",
	expiresAt: "2026-08-20T15:00:00.000Z",
	active: true,
} as const;

const liveSnapshot = {
	schemaVersion: 1,
	computedAt: now,
	occupancy: {
		schemaVersion: 2,
		freshness: "fresh",
		timeZone: "Asia/Riyadh",
		band: "moderate",
		count: 37,
		lastUpdatedAt: "2026-07-21T14:59:30.000Z",
		freshUntil: "2026-07-21T15:01:00.000Z",
		source: "edge",
		computedAt: now,
		trend: null,
	},
	capacity: 100,
	source: "edge",
	health: {
		freshness: "current",
		condition: "healthy",
		process: "ok",
		camera: "ok",
		feed: "ok",
		detectorFps: 7.5,
		edgeObservedAt: "2026-07-21T14:59:29.000Z",
		receivedAt: "2026-07-21T14:59:30.000Z",
		lastSeenAt: "2026-07-21T14:59:30.000Z",
		staleAt: "2026-07-21T15:04:30.000Z",
	},
} as const;

// S2 — delayed, reading still trusted and therefore still shown.
const delayedSnapshot = {
	...liveSnapshot,
	occupancy: { ...liveSnapshot.occupancy, freshness: "stale" },
	health: { ...liveSnapshot.health, freshness: "stale", condition: "degraded" },
} as const;

// S4 — club closed. Normal operation, nothing is flagged.
const closedSnapshot = {
	...liveSnapshot,
	occupancy: {
		schemaVersion: 2,
		freshness: "closed",
		timeZone: "Asia/Riyadh",
		nextOpenAt: "2026-07-22T03:00:00.000Z",
		computedAt: now,
		trend: null,
	},
	source: null,
} as const;

// S5 — the counting device is absent, so nothing can be verified.
const deviceOfflineSnapshot = {
	schemaVersion: 1,
	computedAt: now,
	occupancy: {
		schemaVersion: 2,
		freshness: "unavailable",
		computedAt: now,
		trend: null,
	},
	capacity: 100,
	source: null,
	health: {
		freshness: "unavailable",
		condition: "failed",
		process: null,
		camera: null,
		feed: null,
		detectorFps: null,
		edgeObservedAt: null,
		receivedAt: null,
		lastSeenAt: "2026-07-21T14:52:00.000Z",
		staleAt: null,
	},
} as const;

// S6 — camera degraded but the counting device is unaffected, so the reading stays live.
const cameraUnstableSnapshot = {
	...liveSnapshot,
	health: {
		...liveSnapshot.health,
		condition: "degraded",
		camera: "degraded",
		lastSeenAt: "2026-07-21T14:59:30.000Z",
	},
} as const;

// S7 — device present and working, but its reading failed verification.
const trustFailureSnapshot = {
	schemaVersion: 1,
	computedAt: now,
	occupancy: {
		schemaVersion: 2,
		freshness: "unavailable",
		computedAt: now,
		trend: null,
	},
	capacity: 100,
	source: null,
	health: {
		freshness: "current",
		condition: "failed",
		process: "ok",
		camera: "degraded",
		feed: "degraded",
		detectorFps: 7.1,
		edgeObservedAt: "2026-07-21T14:59:29.000Z",
		receivedAt: "2026-07-21T14:59:30.000Z",
		lastSeenAt: "2026-07-21T14:56:00.000Z",
		staleAt: null,
	},
} as const;

const viewports = [
	{ name: "1440", width: 1440, height: 900 },
	{ name: "768", width: 768, height: 1024 },
	{ name: "390", width: 390, height: 844 },
	{ name: "320", width: 320, height: 844 },
] as const;

const states = [
	{ name: "baseline-live", snapshot: liveSnapshot },
	{ name: "s2-delayed", snapshot: delayedSnapshot },
	{ name: "s4-closed", snapshot: closedSnapshot },
	{ name: "s5-device-offline", snapshot: deviceOfflineSnapshot },
	{ name: "s6-camera-unstable", snapshot: cameraUnstableSnapshot },
	{ name: "s7-trust-failure", snapshot: trustFailureSnapshot },
] as const;

async function mockStaff(page: Page, snapshot: unknown) {
	await page.route("**/api/auth/session", (route) =>
		route.fulfill({ status: 200, json: { auth: staffAuth } }),
	);
	await page.route("**/rpc/staff/operationalSnapshot", (route) =>
		route.fulfill({ status: 200, json: { json: snapshot } }),
	);
}

async function capture(page: Page, name: string) {
	const directory =
		process.env.FITWAY_STAFF_REVIEW_DIR ??
		process.env.FITWAY_PLAYWRIGHT_REVIEW_DIR;
	if (!directory)
		throw new Error(
			"FITWAY_STAFF_REVIEW_DIR or FITWAY_PLAYWRIGHT_REVIEW_DIR is required",
		);
	await mkdir(directory, { recursive: true });
	await page.screenshot({
		path: path.join(directory, `${name}.png`),
		fullPage: true,
	});
}

async function switchToEnglish(page: Page) {
	await page
		.getByRole("button", { name: "التبديل إلى اللغة الإنجليزية" })
		.click();
	await expect(
		page.getByRole("heading", { name: "Live operations" }),
	).toBeVisible();
}

async function expectNoDocumentOverflow(page: Page) {
	expect(
		await page.evaluate(
			() =>
				document.documentElement.scrollWidth <=
				document.documentElement.clientWidth,
		),
	).toBe(true);
}

for (const state of states) {
	for (const viewport of viewports) {
		test(`${state.name} at ${viewport.name}`, async ({ page }) => {
			await mockStaff(page, state.snapshot);
			await page.setViewportSize({
				width: viewport.width,
				height: viewport.height,
			});

			await page.goto("/staff");
			await expect(page.locator(".sboard")).toBeVisible();
			await expectNoDocumentOverflow(page);
			if (state.name === "baseline-live") {
				await expect(
					page.locator(".sboard").locator("button, input, select, textarea, a"),
				).toHaveCount(0);
			}
			await page.waitForTimeout(160);
			await capture(page, `${state.name}-ar-${viewport.name}`);
			if (state.name === "s4-closed" && viewport.name === "390") {
				await page.evaluate(() => document.fonts.ready);
				await expect(page).toHaveScreenshot(
					"staff-closed-route-ar-mobile-390x844.png",
					{ fullPage: true },
				);
			}

			await switchToEnglish(page);
			await expectNoDocumentOverflow(page);
			await page.waitForTimeout(160);
			await capture(page, `${state.name}-en-${viewport.name}`);
		});
	}
}

// S1 loading: hold the request open so the skeleton is the rendered state.
test("s1-loading at every width", async ({ page }) => {
	await page.route("**/api/auth/session", (route) =>
		route.fulfill({ status: 200, json: { auth: staffAuth } }),
	);
	await page.route("**/rpc/staff/operationalSnapshot", async () => {
		// never fulfilled — the board stays in its loading state
	});

	for (const viewport of viewports) {
		await page.setViewportSize({
			width: viewport.width,
			height: viewport.height,
		});
		await page.goto("/staff");
		await expect(page.locator(".sboard__skeleton").first()).toBeVisible();
		await capture(page, `s1-loading-ar-${viewport.name}`);
		if (viewport.name === "390") {
			await page.evaluate(() => document.fonts.ready);
			await expect(page).toHaveScreenshot(
				"staff-loading-route-ar-mobile-390x844.png",
				{ fullPage: true },
			);
		}
	}
});

// S3 load failure with the retry action.
test("s3-load-failure at every width", async ({ page }) => {
	await page.route("**/api/auth/session", (route) =>
		route.fulfill({ status: 200, json: { auth: staffAuth } }),
	);
	await page.route("**/rpc/staff/operationalSnapshot", (route) =>
		route.fulfill({
			status: 503,
			json: {
				json: {
					defined: false,
					code: "SERVICE_UNAVAILABLE",
					status: 503,
					message: "Service Unavailable",
					data: null,
				},
			},
		}),
	);

	for (const viewport of viewports) {
		await page.setViewportSize({
			width: viewport.width,
			height: viewport.height,
		});
		await page.goto("/staff");
		await expect(page.locator('.sboard[data-variant="failure"]')).toBeVisible({
			timeout: 15_000,
		});
		await expectNoDocumentOverflow(page);
		const retryTarget = await page.locator(".sboard__retry").boundingBox();
		expect(retryTarget?.height).toBeGreaterThanOrEqual(44);
		expect(retryTarget?.width).toBeGreaterThanOrEqual(44);
		await capture(page, `s3-load-failure-ar-${viewport.name}`);

		await switchToEnglish(page);
		await capture(page, `s3-load-failure-en-${viewport.name}`);
		if (viewport.name === "390") {
			await page.evaluate(() => document.fonts.ready);
			await expect(page).toHaveScreenshot(
				"staff-error-route-en-mobile-390x844.png",
				{ fullPage: true },
			);
		}
	}
});

// 200% text zoom reflow at a 720 CSS px viewport, per the Paper resilience matrix.
test("200pct text zoom reflow", async ({ page }) => {
	await mockStaff(page, trustFailureSnapshot);
	await page.setViewportSize({ width: 720, height: 900 });
	await page.goto("/staff");
	await expect(page.locator(".sboard")).toBeVisible();
	await page.evaluate(() => {
		document.documentElement.style.fontSize = "32px";
	});
	await expectNoDocumentOverflow(page);
	await expect(
		page.locator(".sboard").locator("button, input, select, textarea, a"),
	).toHaveCount(0);
	await page.waitForTimeout(200);
	await capture(page, "s7-trust-failure-ar-200pct-720");

	await switchToEnglish(page);
	await capture(page, "s7-trust-failure-en-200pct-720");
});

test("canonical routed Staff live and trust-failure frames match", async ({
	page,
}) => {
	await mockStaff(page, liveSnapshot);
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/staff");
	await expect(page.locator('.sboard[data-variant="live"]')).toBeVisible();
	await page.evaluate(() => document.fonts.ready);
	await expect(page).toHaveScreenshot(
		"staff-live-route-ar-desktop-1440x900.png",
		{
			fullPage: true,
		},
	);

	await switchToEnglish(page);
	await page.setViewportSize({ width: 390, height: 844 });
	await expect(page).toHaveScreenshot(
		"staff-live-route-en-mobile-390x844.png",
		{
			fullPage: true,
		},
	);

	await mockStaff(page, trustFailureSnapshot);
	await page.reload();
	await expect(page.locator('.sboard[data-variant="trust"]')).toBeVisible();
	await expect(page).toHaveScreenshot(
		"staff-trust-failure-route-en-mobile-390x844.png",
		{ fullPage: true },
	);
});
