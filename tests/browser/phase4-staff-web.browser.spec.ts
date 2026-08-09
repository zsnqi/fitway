import { mkdir } from "node:fs/promises";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const now = "2026-07-21T15:00:00.000Z";

const staffAuth = {
	principalId: "00000000-0000-4000-8000-000000000001",
	principalKind: "shared_staff",
	role: "staff",
	sessionId: "00000000-0000-4000-8000-000000000002",
	expiresAt: "2026-08-20T15:00:00.000Z",
	active: true,
} as const;

const ownerAuth = {
	...staffAuth,
	principalId: "00000000-0000-4000-8000-000000000003",
	principalKind: "owner",
	role: "owner",
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

const staleSnapshot = {
	...liveSnapshot,
	occupancy: { ...liveSnapshot.occupancy, freshness: "stale" },
	health: {
		...liveSnapshot.health,
		freshness: "stale",
		condition: "degraded",
		feed: "degraded",
	},
} as const;

const unavailableSnapshot = {
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
		condition: "unknown",
		process: null,
		camera: null,
		feed: null,
		detectorFps: null,
		edgeObservedAt: null,
		receivedAt: null,
		lastSeenAt: "2026-07-21T14:45:00.000Z",
		staleAt: null,
	},
} as const;

const closedSnapshot = {
	...liveSnapshot,
	occupancy: {
		schemaVersion: 2,
		freshness: "closed",
		timeZone: "Asia/Riyadh",
		nextOpenAt: "2026-07-21T17:00:00.000Z",
		computedAt: now,
		trend: null,
	},
	source: null,
} as const;

async function mockStaffPage(page: Page, snapshot: unknown = liveSnapshot) {
	await page.route("**/api/auth/session", (route) =>
		route.fulfill({ status: 200, json: { auth: staffAuth } }),
	);
	await page.route("**/rpc/staff/operationalSnapshot", (route) =>
		route.fulfill({ status: 200, json: { json: snapshot } }),
	);
}

function rpcError(status: number, code: string, message: string) {
	return {
		json: {
			defined: false,
			code,
			status,
			message,
			data: null,
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

test("PIN-first login accepts only Western digits, opens staff, and logs out", async ({
	page,
}) => {
	let authenticated = false;
	let logoutRequests = 0;

	await page.route("**/api/auth/session", (route) =>
		route.fulfill(
			authenticated
				? { status: 200, json: { auth: staffAuth } }
				: { status: 401, json: { error: "unauthorized" } },
		),
	);
	await page.route("**/api/auth/staff/pin", async (route) => {
		expect(route.request().postDataJSON()).toEqual({ pin: "123456" });
		authenticated = true;
		await route.fulfill({ status: 200, json: { auth: staffAuth } });
	});
	await page.route("**/api/auth/logout", async (route) => {
		logoutRequests += 1;
		authenticated = false;
		await route.fulfill({ status: 204, body: "" });
	});
	await page.route("**/rpc/staff/operationalSnapshot", (route) =>
		route.fulfill({ status: 200, json: { json: liveSnapshot } }),
	);

	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/login");
	const pin = page.getByLabel("الرقم السري للموظفين");
	await expect(pin).toBeVisible();
	await page.evaluate(() =>
		(document.activeElement as HTMLElement | null)?.blur(),
	);
	await captureReview(page, "login-ar-390.png");
	await pin.fill("12a٣34-56");
	await expect(pin).toHaveValue("123456");
	await page.getByRole("button", { name: "دخول العمليات" }).click();

	await expect(page).toHaveURL(/\/staff$/u);
	await expect(
		page.getByRole("heading", { name: "العمليات المباشرة" }),
	).toBeVisible();
	await expect(page.getByText("37", { exact: true })).toBeVisible();
	await expect(page.locator(".sboard__band")).toHaveText("متوسط");

	await page.getByRole("button", { name: "تسجيل الخروج" }).click();
	await expect(page).toHaveURL(/\/login$/u);
	expect(logoutRequests).toBe(1);
});

test("login renders non-enumerating failure and honors Retry-After", async ({
	page,
}) => {
	let attempts = 0;
	await page.route("**/api/auth/session", (route) =>
		route.fulfill({ status: 401, json: { error: "unauthorized" } }),
	);
	await page.route("**/api/auth/staff/pin", async (route) => {
		attempts += 1;
		await route.fulfill(
			attempts === 1
				? { status: 401, json: { error: "invalid_credentials" } }
				: {
						status: 429,
						headers: { "Retry-After": "5" },
						json: { error: "invalid_credentials" },
					},
		);
	});

	await page.goto("/login");
	const pin = page.getByLabel("الرقم السري للموظفين");
	await pin.fill("123456");
	await page.getByRole("button", { name: "دخول العمليات" }).click();
	await expect(page.getByRole("alert")).toContainText("تعذر تسجيل الدخول");
	await page.getByRole("button", { name: "دخول العمليات" }).click();
	await expect(page.getByRole("alert")).toContainText("5");
	await expect(
		page.getByRole("button", { name: "دخول العمليات" }),
	).toBeDisabled();
});

test("English login, logout, and owner shell complete their functional flow", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	let authenticated = false;
	await page.route("**/api/auth/session", (route) =>
		route.fulfill(
			authenticated
				? { status: 200, json: { auth: staffAuth } }
				: { status: 401, json: { error: "unauthorized" } },
		),
	);
	await page.route("**/api/auth/staff/pin", async (route) => {
		authenticated = true;
		await route.fulfill({ status: 200, json: { auth: staffAuth } });
	});
	await page.route("**/api/auth/logout", async (route) => {
		authenticated = false;
		await route.fulfill({ status: 204, body: "" });
	});
	await page.route("**/rpc/staff/operationalSnapshot", (route) =>
		route.fulfill({ status: 200, json: { json: liveSnapshot } }),
	);
	await page.route("**/rpc/admin/session", (route) =>
		route.fulfill({ status: 200, json: { json: ownerAuth } }),
	);

	await page.goto("/login");
	await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
	await page.getByLabel("Staff PIN").fill("123456");
	await page.getByRole("button", { name: "Open operations" }).click();
	await expect(
		page.getByRole("heading", { name: "Live operations" }),
	).toBeVisible();
	await page.getByRole("button", { name: "Sign out" }).click();
	await expect(page).toHaveURL(/\/login$/u);

	await page.goto("/admin");
	await expect(
		page.getByRole("heading", { name: "Today's occupancy curve" }),
	).toBeVisible();
});

test("a failed background refresh replaces cached live data with transport error", async ({
	page,
}) => {
	let snapshotRequests = 0;
	await page.route("**/api/auth/session", (route) =>
		route.fulfill({ status: 200, json: { auth: ownerAuth } }),
	);
	await page.route("**/rpc/admin/session", (route) =>
		route.fulfill({ status: 200, json: { json: ownerAuth } }),
	);
	await page.route("**/rpc/staff/operationalSnapshot", async (route) => {
		snapshotRequests += 1;
		await route.fulfill(
			snapshotRequests === 1
				? { status: 200, json: { json: liveSnapshot } }
				: {
						status: 503,
						json: rpcError(503, "SERVICE_UNAVAILABLE", "Service Unavailable"),
					},
		);
	});

	await page.goto("/staff");
	await expect(page.getByText("37", { exact: true })).toBeVisible();
	await page.getByRole("link", { name: "منطقة المالك" }).click();
	await expect(
		page.getByRole("heading", { name: "منحنى الإشغال اليوم" }),
	).toBeVisible();
	await page
		.locator(".operations-nav")
		.getByRole("link", { name: "العمليات المباشرة" })
		.click();
	await expect(page.getByRole("alert")).toContainText(
		"تعذر تحميل الحالة التشغيلية",
	);
	await expect(page.getByText("37", { exact: true })).toHaveCount(0);
});

test("stale and unavailable snapshots remain visibly distinct from live", async ({
	page,
}) => {
	await mockStaffPage(page, staleSnapshot);
	await page.goto("/staff");
	await expect(
		page.getByText("آخر قراءة معروفة", { exact: true }),
	).toBeVisible();
	await expect(page.getByText("37", { exact: true })).toBeVisible();
	await expect(page.getByText("قراءة مباشرة", { exact: true })).toHaveCount(0);
	await captureReview(page, "staff-stale-ar-1280.png");

	await page.unroute("**/rpc/staff/operationalSnapshot");
	await page.route("**/rpc/staff/operationalSnapshot", (route) =>
		route.fulfill({ status: 200, json: { json: unavailableSnapshot } }),
	);
	await page.reload();
	// The approved board withdraws an unverifiable reading outright and states the
	// reason, rather than showing an emptied or dimmed metric.
	await expect(
		page.locator(".sboard").getByText("القراءة غير متاحة", { exact: true }),
	).toBeVisible();
	await expect(page.getByText("37", { exact: true })).toHaveCount(0);
	await expect(page.locator(".sboard__band")).toHaveCount(0);
	await expect(page.locator(".sboard__signal")).toHaveCount(0);
	// Device health survives the withdrawal — it is why the reading is gone.
	await expect(page.locator(".sboard__status")).toBeVisible();
	await captureReview(page, "staff-unavailable-ar-1280.png");
});

test("closed occupancy removes the reading and shows the next opening", async ({
	page,
}) => {
	await mockStaffPage(page, closedSnapshot);
	await page.goto("/staff");
	await expect(
		page.getByText("النادي مغلق الآن", { exact: true }).first(),
	).toBeVisible();
	await expect(page.getByText("8:00 م", { exact: false })).toBeVisible();
	await expect(page.getByText("37", { exact: true })).toHaveCount(0);
	await expect(page.getByText("متوسط", { exact: true })).toHaveCount(0);
	await captureReview(page, "staff-closed-ar-1280.png");
});

test("loading and transport failure are honest states, and 401 redirects", async ({
	page,
}) => {
	await page.route("**/api/auth/session", (route) =>
		route.fulfill({ status: 200, json: { auth: staffAuth } }),
	);
	await page.route("**/rpc/staff/operationalSnapshot", async (route) => {
		await new Promise((resolve) => setTimeout(resolve, 700));
		await route.fulfill({
			status: 503,
			json: rpcError(503, "SERVICE_UNAVAILABLE", "Service Unavailable"),
		});
	});
	await page.goto("/staff");
	await expect(page.getByRole("status")).toContainText(
		"جارٍ تحميل الحالة التشغيلية",
	);
	await captureReview(page, "staff-loading-ar-1280.png");
	await expect(page.getByRole("alert")).toContainText(
		"تعذر تحميل الحالة التشغيلية",
	);
	await expect(page.getByText("الإشغال غير متاح", { exact: true })).toHaveCount(
		0,
	);
	await captureReview(page, "staff-error-ar-1280.png");

	await page.unroute("**/api/auth/session");
	await page.route("**/api/auth/session", (route) =>
		route.fulfill({ status: 401, json: { error: "unauthorized" } }),
	);
	await page.unroute("**/rpc/staff/operationalSnapshot");
	await page.route("**/rpc/staff/operationalSnapshot", (route) =>
		route.fulfill({
			status: 401,
			json: rpcError(401, "UNAUTHORIZED", "Unauthorized"),
		}),
	);
	await page.reload();
	await expect(page).toHaveURL(/\/login$/u);
});

test("admin renders localized 403 for staff and the shell only for owner", async ({
	page,
}) => {
	await page.route("**/rpc/admin/session", (route) =>
		route.fulfill({
			status: 403,
			json: rpcError(403, "FORBIDDEN", "Forbidden"),
		}),
	);
	await page.goto("/admin");
	await expect(page.getByRole("alert")).toContainText("يلزم دخول المالك");
	await captureReview(page, "admin-forbidden-ar-1280.png");

	await page.unroute("**/rpc/admin/session");
	await page.route("**/rpc/admin/session", (route) =>
		route.fulfill({ status: 200, json: { json: ownerAuth } }),
	);
	await page.reload();
	await expect(
		page.getByRole("heading", { name: "منحنى الإشغال اليوم" }),
	).toBeVisible();
	await expect(page.getByRole("link", { name: "منطقة المالك" })).toBeVisible();
	await captureReview(page, "admin-owner-ar-1280.png");
});

test("Arabic RTL and English LTR remain accessible and responsive at every required width", async ({
	page,
}) => {
	await mockStaffPage(page);
	const reviewDirectory = process.env.FITWAY_PLAYWRIGHT_REVIEW_DIR;
	if (!reviewDirectory)
		throw new Error("FITWAY_PLAYWRIGHT_REVIEW_DIR is required");
	await mkdir(reviewDirectory, { recursive: true });
	await page.goto("/staff");
	await expect(page.getByText("37", { exact: true })).toBeVisible();

	for (const width of [320, 360, 390, 721, 768, 820, 1024, 1200, 1440]) {
		await page.setViewportSize({ width, height: width < 721 ? 844 : 900 });
		await expect(page.getByText("37", { exact: true })).toBeVisible();
		const overflow = await page.evaluate(
			() =>
				document.documentElement.scrollWidth >
				document.documentElement.clientWidth,
		);
		expect(overflow, `document overflow at ${width}px`).toBe(false);
		if (width === 390 || width === 768 || width === 1440) {
			await page.screenshot({
				path: path.join(reviewDirectory, `staff-live-ar-${width}.png`),
				fullPage: true,
			});
		}
	}

	await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
	let results = await new AxeBuilder({ page }).analyze();
	expect(
		results.violations.filter(
			({ impact }) => impact === "serious" || impact === "critical",
		),
	).toEqual([]);

	await page
		.getByRole("button", { name: "التبديل إلى اللغة الإنجليزية" })
		.click();
	await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
	await expect(
		page.getByRole("heading", { name: "Live operations" }),
	).toBeVisible();
	results = await new AxeBuilder({ page }).analyze();
	expect(
		results.violations.filter(
			({ impact }) => impact === "serious" || impact === "critical",
		),
	).toEqual([]);
	await page.screenshot({
		path: path.join(reviewDirectory, "staff-live-en-1440.png"),
		fullPage: true,
	});
});

test("keyboard order, focus transfer, practical targets, reduced motion, and 200% reflow", async ({
	page,
}) => {
	await page.route("**/api/auth/session", (route) =>
		route.fulfill({ status: 401, json: { error: "unauthorized" } }),
	);
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.setViewportSize({ width: 320, height: 844 });
	await page.goto("/login");

	const skipLink = page.getByRole("link", {
		name: "الانتقال إلى الحالة التشغيلية",
	});
	await expect(skipLink).toBeAttached();
	await page.evaluate(() =>
		(document.activeElement as HTMLElement | null)?.blur(),
	);
	await page.keyboard.press("Tab");
	await expect(skipLink).toBeFocused();
	await page.keyboard.press("Enter");
	await expect(page.locator("main")).toBeFocused();
	await page.reload();
	await expect(skipLink).toBeAttached();
	await page.evaluate(() =>
		(document.activeElement as HTMLElement | null)?.blur(),
	);
	await page.keyboard.press("Tab");
	await page.keyboard.press("Tab");
	await expect(
		page.getByRole("button", { name: "التبديل إلى اللغة الإنجليزية" }),
	).toBeFocused();
	await expect
		.poll(() =>
			page
				.getByRole("button", { name: "التبديل إلى اللغة الإنجليزية" })
				.evaluate((element) => getComputedStyle(element).boxShadow),
		)
		.not.toBe("none");
	await page.keyboard.press("Tab");
	await expect(page.getByLabel("الرقم السري للموظفين")).toBeFocused();
	await expect
		.poll(() =>
			page
				.getByLabel("الرقم السري للموظفين")
				.evaluate((element) => getComputedStyle(element).boxShadow),
		)
		.not.toBe("none");
	await page.getByLabel("الرقم السري للموظفين").fill("123456");
	await page.keyboard.press("Tab");
	await expect(
		page.getByRole("button", { name: "دخول العمليات" }),
	).toBeFocused();

	for (const locator of [
		page.getByRole("button", { name: "التبديل إلى اللغة الإنجليزية" }),
		page.getByLabel("الرقم السري للموظفين"),
		page.getByRole("button", { name: "دخول العمليات" }),
	]) {
		const box = await locator.boundingBox();
		expect(box?.height).toBeGreaterThanOrEqual(44);
	}

	await page.evaluate(() => {
		document.documentElement.style.zoom = "2";
	});
	const overflow = await page.evaluate(
		() =>
			document.documentElement.scrollWidth >
			document.documentElement.clientWidth,
	);
	expect(overflow).toBe(false);
});

test("Staff Arabic order, monitoring-only scope, Retry focus target, overflow, and 200% reflow", async ({
	page,
}) => {
	let snapshotRequests = 0;
	await page.route("**/api/auth/session", (route) =>
		route.fulfill({ status: 200, json: { auth: staffAuth } }),
	);
	await page.route("**/rpc/staff/operationalSnapshot", async (route) => {
		snapshotRequests += 1;
		await route.fulfill(
			snapshotRequests === 1
				? {
						status: 503,
						json: rpcError(503, "SERVICE_UNAVAILABLE", "Service Unavailable"),
					}
				: { status: 200, json: { json: liveSnapshot } },
		);
	});

	await page.setViewportSize({ width: 320, height: 844 });
	await page.goto("/staff");
	const skipLink = page.locator(".operations-skip-link");
	const signOut = page.locator(".sboard-rail__session button").nth(0);
	const language = page.locator(".sboard-rail__session button").nth(1);
	const retry = page.locator(".sboard__retry");
	await expect(retry).toBeVisible();
	await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

	await page.evaluate(() =>
		(document.activeElement as HTMLElement | null)?.blur(),
	);
	for (const control of [skipLink, signOut, language, retry]) {
		await page.keyboard.press("Tab");
		await expect(control).toBeFocused();
	}
	await expect
		.poll(() =>
			page
				.locator(".sboard__retry-focus")
				.evaluate((element) => getComputedStyle(element).boxShadow),
		)
		.not.toBe("none");
	const retryTarget = await retry.boundingBox();
	expect(retryTarget?.height).toBeGreaterThanOrEqual(44);
	expect(retryTarget?.width).toBeGreaterThanOrEqual(44);
	expect(
		await page.evaluate(
			() =>
				document.documentElement.scrollWidth <=
				document.documentElement.clientWidth,
		),
	).toBe(true);

	await page.keyboard.press("Enter");
	await expect(page.getByText("37", { exact: true })).toBeVisible();
	expect(snapshotRequests).toBeGreaterThanOrEqual(2);
	await expect(
		page.locator(".sboard").locator("button, input, select, textarea, a"),
	).toHaveCount(0);

	await page.unroute("**/rpc/staff/operationalSnapshot");
	await page.route("**/rpc/staff/operationalSnapshot", (route) =>
		route.fulfill({
			status: 503,
			json: rpcError(503, "SERVICE_UNAVAILABLE", "Service Unavailable"),
		}),
	);
	await page.setViewportSize({ width: 720, height: 900 });
	await page.reload();
	await expect(retry).toBeVisible();
	await page.evaluate(() => {
		document.documentElement.style.zoom = "2";
	});
	await expect(retry).toBeVisible();
	expect(
		await page.evaluate(
			() =>
				document.documentElement.scrollWidth <=
				document.documentElement.clientWidth,
		),
	).toBe(true);
});
