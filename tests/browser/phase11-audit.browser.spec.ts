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
		{
			state: "value",
			minuteStartUtc: "2026-08-10T07:01:00.000Z",
			count: 31,
			entries: 19,
			exits: 0,
			band: "moderate",
			capacitySnapshot: 100,
			settingsVersion: 11,
			source: "live",
		},
	],
	peak: {
		minuteStartUtc: "2026-08-10T07:01:00.000Z",
		count: 31,
		band: "moderate",
		capacitySnapshot: 100,
		settingsVersion: 11,
	},
	dailyAverage: 21.5,
	estimatedEntranceCrossings: 31,
	observedOpenMinutes: 2,
	expectedOpenMinutes: 2,
	coverage: 1,
} as const;

type AuditEntry = {
	id: number;
	eventClass: "command" | "access" | "settings";
	action:
		| "correction_delta"
		| "correction_absolute"
		| "reset"
		| "staff_pin_provisioned"
		| "staff_pin_rotated"
		| "staff_pin_deactivated"
		| "owner_provisioned"
		| "owner_deactivated"
		| "owner_reactivated"
		| "credential_reset"
		| "settings_updated";
	actor: {
		principalId: string | null;
		kind: "shared_staff" | "owner" | "system";
		role: "staff" | "owner" | null;
		displayName: string | null;
	};
	target: { principalId: string; displayName: string } | null;
	priorValue: number | null;
	effectiveValue: number | null;
	requestedDelta: number | null;
	requestedValue: number | null;
	priorActive: boolean | null;
	newActive: boolean | null;
	priorCredentialVersion: number | null;
	newCredentialVersion: number | null;
	settingsVersion: number | null;
	reason: string | null;
	createdAtUtc: string;
};

const ownerActor = {
	principalId: "00000000-0000-4000-8000-0000000000a1",
	kind: "owner",
	role: "owner",
	displayName: "Real owner",
} as const;
const staffActor = {
	principalId: "00000000-0000-4000-8000-0000000000b2",
	kind: "shared_staff",
	role: "staff",
	displayName: "Shared front desk",
} as const;
const systemActor = {
	principalId: null,
	kind: "system",
	role: null,
	displayName: null,
} as const;

const commandAuditState = {
	eventClass: "command" as const,
	target: null,
	priorActive: null,
	newActive: null,
	priorCredentialVersion: null,
	newCredentialVersion: null,
	settingsVersion: null,
};

/** Newest first, exactly as the transport emits it. */
const auditEntries: AuditEntry[] = [
	{
		...commandAuditState,
		id: 26,
		action: "correction_absolute",
		actor: ownerActor,
		priorValue: 41,
		effectiveValue: 12,
		requestedDelta: null,
		requestedValue: 12,
		reason: "Recount after the door jam",
		createdAtUtc: "2026-08-10T21:30:00.000Z",
	},
	{
		...commandAuditState,
		id: 25,
		action: "correction_delta",
		actor: staffActor,
		priorValue: 2,
		effectiveValue: 0,
		requestedDelta: -9,
		requestedValue: null,
		reason: null,
		createdAtUtc: "2026-08-10T05:15:00.000Z",
	},
	{
		...commandAuditState,
		id: 24,
		action: "reset",
		actor: systemActor,
		priorValue: null,
		effectiveValue: 0,
		requestedDelta: null,
		requestedValue: 0,
		reason: "Scheduled post-close reset",
		createdAtUtc: "2026-08-09T21:05:00.000Z",
	},
	{
		...commandAuditState,
		id: 23,
		action: "correction_delta",
		actor: staffActor,
		priorValue: 30,
		effectiveValue: 26,
		requestedDelta: -4,
		requestedValue: null,
		reason: "Opening count",
		createdAtUtc: "2026-08-09T06:40:00.000Z",
	},
];

type ListInput = {
	limit: number;
	cursor: { createdAtUtc: string; id: number } | null;
	filters?: Record<string, unknown>;
};

let observedFilters: Array<Record<string, unknown> | undefined> = [];
/**
 * Every `admin.analytics.timeContext` body seen on the page. Mounting the audit
 * section must add none: that procedure belongs to Phase 9 and its spec asserts
 * exact post data on it.
 */
let observedTimeContextRequests: unknown[] = [];

function applyFilters(
	entries: AuditEntry[],
	filters: Record<string, unknown> | undefined,
) {
	if (!filters) return entries;
	return entries.filter((entry) => {
		if (
			Array.isArray(filters.actions) &&
			!(filters.actions as string[]).includes(entry.action)
		) {
			return false;
		}
		if (filters.actorKind && entry.actor.kind !== filters.actorKind)
			return false;
		if (filters.priorValue === null && entry.priorValue !== null) return false;
		if (
			typeof filters.priorValue === "number" &&
			entry.priorValue !== filters.priorValue
		) {
			return false;
		}
		if (
			typeof filters.effectiveValue === "number" &&
			entry.effectiveValue !== filters.effectiveValue
		) {
			return false;
		}
		if (filters.effectiveValue === null && entry.effectiveValue !== null)
			return false;
		if (filters.reason === null && entry.reason !== null) return false;
		if (
			typeof filters.reason === "string" &&
			!(entry.reason ?? "").toLowerCase().includes(filters.reason.toLowerCase())
		) {
			return false;
		}
		if (
			typeof filters.occurredFrom === "string" &&
			Date.parse(entry.createdAtUtc) < Date.parse(filters.occurredFrom)
		) {
			return false;
		}
		if (
			typeof filters.occurredTo === "string" &&
			Date.parse(entry.createdAtUtc) > Date.parse(filters.occurredTo)
		) {
			return false;
		}
		return true;
	});
}

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
		entries?: AuditEntry[];
		pageSize?: number;
		auditStatus?: number;
		auditDelayMs?: number;
	} = {},
) {
	const source = options.entries ?? auditEntries;
	observedFilters = [];
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
	await page.route("**/rpc/admin/audit/list", async (route) => {
		if (options.auditDelayMs) {
			await new Promise((resolve) => setTimeout(resolve, options.auditDelayMs));
		}
		if (options.auditStatus && options.auditStatus !== 200) {
			await route.fulfill({
				status: options.auditStatus,
				json: rpcError(
					options.auditStatus,
					"SERVICE_UNAVAILABLE",
					"Service Unavailable",
				),
			});
			return;
		}
		const input = (route.request().postDataJSON()?.json ?? {}) as ListInput;
		observedFilters.push(input.filters);
		const filtered = applyFilters(source, input.filters);
		const start = input.cursor
			? filtered.findIndex((entry) => entry.id === input.cursor?.id) + 1
			: 0;
		const size = options.pageSize ?? input.limit;
		const slice = filtered.slice(start, start + size);
		const last = slice.at(-1);
		await route.fulfill({
			status: 200,
			json: {
				json: {
					entries: slice,
					nextCursor:
						last && start + size < filtered.length
							? { createdAtUtc: last.createdAtUtc, id: last.id }
							: null,
				},
			},
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
		audit:
			(document.querySelector<HTMLElement>(".owner-audit")?.scrollWidth ?? 0) -
			(document.querySelector<HTMLElement>(".owner-audit")?.clientWidth ?? 0),
	}));
	expect(overflow.document).toBeLessThanOrEqual(0);
	expect(overflow.body).toBeLessThanOrEqual(0);
	expect(overflow.audit).toBeLessThanOrEqual(0);
}

function seriousViolations(
	results: Awaited<ReturnType<AxeBuilder["analyze"]>>,
) {
	return results.violations.filter(
		({ impact }) => impact === "serious" || impact === "critical",
	);
}

const auditTable = "[data-owner-audit-table]";

/**
 * A `.owner-audit` capture taller than the viewport paints the shell's fixed skip
 * link into the image. That link belongs to `phase11-shell`, which owns its
 * baseline and its focus behaviour, so it is removed from this slice's
 * composition baseline instead of being asserted twice.
 */
async function hideShellSkipLink(page: Page) {
	await page.addStyleTag({
		content: ".operations-skip-link { display: none !important; }",
	});
	await expect(page.locator(".operations-skip-link")).toBeHidden();
}

test("audit rows render in the configured gym timezone regardless of the device timezone", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await emulateDeviceTimeZone(page);
	await mockOwnerSurfaces(page);
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/admin");

	const rows = page.locator(`${auditTable} tbody tr`);
	await expect(rows).toHaveCount(4);

	// Mounting this section must not change what `/admin` asks for. The gym
	// timezone is one fact and the analytics query already resolved it, so exactly
	// one time-context request exists and it still carries the Phase 9 shape,
	// whose spec asserts that body exactly.
	expect(observedTimeContextRequests).toEqual([
		{ json: { settingsVersions: [11] } },
	]);

	expect(
		await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone),
	).toBe(DEVICE_TIME_ZONE);

	// 21:30Z is already the next gym day at +03:00. A device at -07:00 would say
	// "Aug 10, 2:30 PM"; the row must say the gym's own day and clock.
	const newest = rows.first().locator("td").first();
	await expect(newest).toContainText("Aug 11");
	await expect(newest).toContainText("12:30 AM");
	await expect(newest).not.toContainText("2:30 PM");
	await expect(page.locator(".owner-audit__zone")).toContainText(GYM_TIME_ZONE);

	const table = page.locator(auditTable);
	await expect(table).toContainText("Real owner");
	await expect(table).toContainText("Shared front desk");
	await expect(table).toContainText("Automatic system");
	await expect(table).not.toContainText("@");
	// A missing prior and a missing reason are named states, never a zero or a blank.
	await expect(rows.nth(2)).toContainText("Not recorded");
	await expect(rows.nth(1)).toContainText("No reason given");
	await expect(rows.nth(1)).toContainText("Floored at zero");
	await captureReview(page, "owner-audit-populated-en-1440x900.png");
});

test("Arabic renders RTL with Western digits and a mirrored change arrow", async ({
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

	const table = page.locator(auditTable);
	await expect(table.locator("tbody tr")).toHaveCount(4);
	const text = (await table.textContent()) ?? "";
	expect(text).not.toMatch(/[٠-٩۰-۹]/u);
	expect(text).toContain("←");
	expect(text).not.toContain("→");
	expect(text).toContain("النظام التلقائي");

	const direction = await page
		.locator(".owner-audit")
		.evaluate((element) => getComputedStyle(element).direction);
	expect(direction).toBe("rtl");
	await captureReview(page, "owner-audit-populated-ar-1440x900.png");
});

test("loading, empty, error, and populated states each render", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await page.setViewportSize({ width: 390, height: 844 });

	await mockOwnerSurfaces(page, { auditDelayMs: 600 });
	await page.goto("/admin");
	await expect(
		page.locator('[data-owner-audit-state="loading"]'),
	).toBeVisible();
	await expect(
		page.locator('[data-owner-audit-state="loading"]'),
	).toHaveAttribute("role", "status");
	await captureReview(page, "owner-audit-loading-en-390x844.png");
	await expect(page.locator(auditTable)).toBeVisible();
	await captureReview(page, "owner-audit-populated-en-390x844.png");

	await mockOwnerSurfaces(page, { entries: [] });
	await page.reload();
	const empty = page.locator('[data-owner-audit-state="empty"]');
	await expect(empty).toBeVisible();
	await expect(empty).toContainText("No audit records match");
	await expect(page.locator(auditTable)).toHaveCount(0);
	await captureReview(page, "owner-audit-empty-en-390x844.png");

	await mockOwnerSurfaces(page, { auditStatus: 503 });
	await page.reload();
	const error = page.locator('[data-owner-audit-state="error"]');
	await expect(error).toBeVisible();
	await expect(error).toHaveAttribute("role", "alert");
	await expect(page.locator(auditTable)).toHaveCount(0);
	await captureReview(page, "owner-audit-error-en-390x844.png");

	await mockOwnerSurfaces(page);
	await error.getByRole("button").click();
	await expect(page.locator(auditTable)).toBeVisible();
	await expectNoDocumentOverflow(page);
});

test("filters reach the transport with gym-day bounds and an explicit missing option", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await emulateDeviceTimeZone(page);
	await mockOwnerSurfaces(page);
	await page.setViewportSize({ width: 1200, height: 900 });
	await page.goto("/admin");
	await expect(page.locator(auditTable)).toBeVisible();

	const filters = page.getByRole("form", { name: "Filter audit history" });
	await filters.getByLabel("Action").selectOption("reset");
	await filters.getByLabel("Actor").selectOption("system");
	await filters.getByLabel("From (prior count)").selectOption("missing");
	await filters.getByLabel("Reason", { exact: true }).selectOption("contains");
	await filters.getByLabel("Reason text").fill("post-close");
	await filters.getByLabel("From day").fill("2026-08-09");
	await filters.getByLabel("To day").fill("2026-08-10");
	await filters.getByRole("button", { name: "Apply filters" }).click();

	await expect(page.locator(`${auditTable} tbody tr`)).toHaveCount(1);
	const sent = observedFilters.at(-1);
	expect(sent).toEqual({
		actions: ["reset"],
		actorKind: "system",
		priorValue: null,
		reason: "post-close",
		// Gym-local days at +03:00, computed from the configured zone only.
		occurredFrom: "2026-08-08T21:00:00.000Z",
		occurredTo: "2026-08-10T20:59:59.999Z",
	});

	await filters.getByRole("button", { name: "Clear filters" }).click();
	await expect(page.locator(`${auditTable} tbody tr`)).toHaveCount(4);
	expect(observedFilters.at(-1)).toBeUndefined();
});

test("keyset paging appends older records without repeating one", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await mockOwnerSurfaces(page, { pageSize: 2 });
	await page.setViewportSize({ width: 1024, height: 900 });
	await page.goto("/admin");

	const rows = page.locator(`${auditTable} tbody tr`);
	await expect(rows).toHaveCount(2);
	const loadMore = page.getByRole("button", { name: "Load older records" });
	await loadMore.click();
	await expect(rows).toHaveCount(4);
	await expect(page.locator(".owner-audit__end")).toBeVisible();

	const ids = await rows.evaluateAll((elements) =>
		elements.map((element) => element.textContent ?? ""),
	);
	expect(new Set(ids).size).toBe(ids.length);
});

test("governance rows render their resolved target and missing effective-count state in both locales", async ({
	page,
}) => {
	const governanceEntries: AuditEntry[] = [
		{
			id: 22,
			eventClass: "access",
			action: "owner_deactivated",
			actor: ownerActor,
			target: {
				principalId: "00000000-0000-4000-8000-0000000000b2",
				displayName: "Shared front desk",
			},
			priorValue: null,
			effectiveValue: null,
			requestedDelta: null,
			requestedValue: null,
			priorActive: true,
			newActive: false,
			priorCredentialVersion: null,
			newCredentialVersion: null,
			settingsVersion: null,
			reason: "Departure approved",
			createdAtUtc: "2026-08-09T05:15:00.000Z",
		},
		{
			id: 21,
			eventClass: "settings",
			action: "settings_updated",
			actor: ownerActor,
			target: null,
			priorValue: null,
			effectiveValue: null,
			requestedDelta: null,
			requestedValue: null,
			priorActive: null,
			newActive: null,
			priorCredentialVersion: null,
			newCredentialVersion: null,
			settingsVersion: 12,
			reason: null,
			createdAtUtc: "2026-08-09T05:14:00.000Z",
		},
		...auditEntries,
	];
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await mockOwnerSurfaces(page, { entries: governanceEntries });
	await page.setViewportSize({ width: 1200, height: 900 });
	await page.goto("/admin");
	const table = page.locator(auditTable);
	await expect(table).toContainText("Shared front desk");
	await expect(table).toContainText("Active");
	await expect(table).toContainText("Inactive");
	await expect(table).toContainText("Settings version 12");

	const filters = page.getByRole("form", { name: "Filter audit history" });
	await filters.getByLabel("To (effective count)").selectOption("missing");
	await filters.getByRole("button", { name: "Apply filters" }).click();
	await expect(page.locator(`${auditTable} tbody tr`)).toHaveCount(2);
	expect(observedFilters.at(-1)).toEqual({ effectiveValue: null });

	await setLocale(page, "ar");
	await expect(table).toContainText("مكتب الاستقبال");
	await expect(table).toContainText("تحديث الإعدادات");
	expect(
		await page
			.locator(".owner-audit")
			.evaluate((element) => getComputedStyle(element).direction),
	).toBe("rtl");
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
			await expect(page.locator(auditTable)).toBeVisible();
			await expectNoDocumentOverflow(page);
			const region = await page
				.locator(".owner-audit-region")
				.evaluate((element) => ({
					overflowX: getComputedStyle(element).overflowX,
					label: element.getAttribute("aria-label"),
					tabIndex: element.getAttribute("tabindex"),
				}));
			expect(region.overflowX).toBe("auto");
			expect(region.label).toBeTruthy();
			expect(region.tabIndex).toBe("0");
		}
		await page.setViewportSize({ width: 360, height: 900 });
		await captureReview(page, `owner-audit-${locale}-360x900.png`);
		await page.setViewportSize({ width: 768, height: 1024 });
		await captureReview(page, `owner-audit-${locale}-768x1024.png`);
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
	await expect(page.locator(auditTable)).toBeVisible();

	const controls = page.locator(
		".owner-audit :is(select, input, button, [tabindex='0'])",
	);
	const total = await controls.count();
	expect(total).toBeGreaterThanOrEqual(10);
	for (const control of await controls.all()) {
		if (!(await control.isVisible())) continue;
		const box = await control.boundingBox();
		expect(box?.height).toBeGreaterThanOrEqual(44);
		if (await control.isDisabled()) continue;
		await control.focus();
		await expect(control).toBeFocused();
		const focusRing = await control.evaluate((element) => {
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

	// Tab order follows the visual order of the filter form.
	await page.locator(".owner-audit-filters select").first().focus();
	await page.keyboard.press("Tab");
	await expect(
		page.locator(".owner-audit-filters :is(select, input)").nth(1),
	).toBeFocused();

	const motion = await page.locator(".owner-audit").evaluate(() => ({
		reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
	}));
	expect(motion.reduced).toBe(true);

	await page.evaluate(() => {
		document.documentElement.style.zoom = "2";
	});
	await expectNoDocumentOverflow(page);
	await captureReview(page, "owner-audit-en-200-percent-reflow.png");
	await page.evaluate(() => {
		document.documentElement.style.zoom = "1";
	});

	for (const locale of ["en", "ar"] as const) {
		await setLocale(page, locale);
		const results = await new AxeBuilder({ page })
			.include(".owner-audit")
			.analyze();
		expect(seriousViolations(results)).toEqual([]);
	}

	await page.emulateMedia({ forcedColors: "active" });
	expect(
		await page.evaluate(() => matchMedia("(forced-colors: active)").matches),
	).toBe(true);
	for (const control of await page
		.locator(".owner-audit :is(select, input, button)")
		.all()) {
		if (!(await control.isVisible()) || (await control.isDisabled())) continue;
		await control.focus();
		await expect(control).toBeFocused();
		const outline = await control.evaluate((element) => {
			const style = getComputedStyle(element);
			return {
				style: style.outlineStyle,
				width: Number.parseFloat(style.outlineWidth),
			};
		});
		expect(outline.style).not.toBe("none");
		expect(outline.width).toBeGreaterThanOrEqual(2);
	}
});

test("canonical desktop Arabic and mobile English audit compositions match", async ({
	page,
}) => {
	await emulateDeviceTimeZone(page);
	await mockOwnerSurfaces(page);
	await page.goto("/admin");
	await setLocale(page, "ar");
	await hideShellSkipLink(page);
	await page.setViewportSize({ width: 1440, height: 900 });
	await expect(page.locator(auditTable)).toBeVisible();
	await page.evaluate(() => document.fonts.ready);
	await expect(page.locator(".owner-audit")).toHaveScreenshot(
		"owner-audit-ar-desktop-1440x900.png",
	);

	await setLocale(page, "en");
	await page.setViewportSize({ width: 390, height: 844 });
	await expect(page.locator(auditTable)).toBeVisible();
	await page.evaluate(() => document.fonts.ready);
	await expect(page.locator(".owner-audit")).toHaveScreenshot(
		"owner-audit-en-mobile-390x844.png",
	);
});
