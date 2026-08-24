import { mkdir } from "node:fs/promises";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, type Route, test } from "@playwright/test";

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

type Principal = {
	principalId: string;
	principalKind: "shared_staff" | "owner";
	role: "staff" | "owner";
	displayName: string;
	ownerEmail: string | null;
	active: boolean;
	credentialVersion: number | null;
	credentialActive: boolean | null;
};

const staff: Principal = {
	principalId: "00000000-0000-4000-8000-0000000000c1",
	principalKind: "shared_staff",
	role: "staff",
	displayName: "Front desk",
	ownerEmail: null,
	active: true,
	credentialVersion: 3,
	credentialActive: true,
};

const unprovisionedStaff: Principal = {
	...staff,
	credentialVersion: null,
	credentialActive: null,
};

const selfOwner: Principal = {
	principalId: ownerAuth.principalId,
	principalKind: "owner",
	role: "owner",
	displayName: "Rashid Owner",
	ownerEmail: "rashid@fitway.example",
	active: true,
	credentialVersion: null,
	credentialActive: null,
};

const otherOwner: Principal = {
	principalId: "00000000-0000-4000-8000-0000000000a2",
	principalKind: "owner",
	role: "owner",
	displayName: "Amina Owner",
	ownerEmail: "amina@fitway.example",
	active: true,
	credentialVersion: null,
	credentialActive: null,
};

const inactiveOwner: Principal = {
	principalId: "00000000-0000-4000-8000-0000000000a3",
	principalKind: "owner",
	role: "owner",
	displayName: "Samir Owner",
	ownerEmail: "samir@fitway.example",
	active: false,
	credentialVersion: null,
	credentialActive: null,
};

const livePrincipals: Principal[] = [
	staff,
	otherOwner,
	selfOwner,
	inactiveOwner,
];

/** A deterministic, non-secret fixture: never a credential that exists anywhere. */
const REVEALED_PIN = "48291057";

const REFUSAL_CODES = [
	"staff_pin_already_active",
	"staff_pin_not_active",
	"owner_self_deactivation",
	"owner_last_active",
	"owner_already_inactive",
	"owner_already_active",
	"owner_email_taken",
	"not_an_owner",
	"reason_required",
] as const;

/**
 * The exact wire envelope the oRPC client decodes into `ORPCError`. The sibling
 * specs' `rpcError` helper deliberately omits `defined`, which drops the payload
 * onto the malformed-response fallback keyed by HTTP status — fine for a generic
 * 503, but wrong for a typed refusal, which the hook only recognizes when it
 * arrives as `code: "BAD_REQUEST"` plus `data.code`.
 */
function refusal(code: string) {
	return {
		json: {
			defined: false,
			code: "BAD_REQUEST",
			status: 400,
			message: "Refused",
			data: { code },
		},
	};
}

function rpcError(status: number, code: string, message: string) {
	return { json: null, error: { json: { status, code, message, data: null } } };
}

function mutationOutput() {
	return { auditId: 42, principal: staff, revokedSessions: 0 };
}

function revealOutput() {
	return { ...mutationOutput(), revealedPin: REVEALED_PIN };
}

function deferred() {
	let resolve: (() => void) | null = null;
	const promise = new Promise<void>((r) => {
		resolve = r;
	});
	return { promise, resolve: () => resolve?.() };
}

let listPrincipals: Principal[] = [];
let listStatus = 200;
let listHoldOpen = false;
let releaseList: (() => void) | null = null;
let refusals: Record<string, string> = {};
let observedAccessRequests: number[] = [];
/** Every `admin.analytics.timeContext` body seen; mounting access must add none. */
let observedTimeContextRequests: unknown[] = [];

async function mockOwnerSurfaces(
	page: Page,
	options: { principals?: Principal[]; listStatus?: number } = {},
) {
	observedAccessRequests = [];
	observedTimeContextRequests = [];
	listPrincipals = options.principals ?? [];
	listStatus = options.listStatus ?? 200;
	listHoldOpen = false;
	releaseList = null;
	refusals = {};

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

	await page.route("**/rpc/admin/access/list", async (route) => {
		observedAccessRequests.push(Date.now());
		if (listHoldOpen) {
			await new Promise<void>((resolve) => {
				releaseList = resolve;
			});
		}
		if (listStatus !== 200) {
			await route.fulfill({
				status: listStatus,
				json: rpcError(
					listStatus,
					"SERVICE_UNAVAILABLE",
					"Service Unavailable",
				),
			});
			return;
		}
		await route.fulfill({
			status: 200,
			json: { json: { principals: listPrincipals } },
		});
	});

	const mutations: Array<[string, string]> = [
		["staffPin/provision", "staffPin/provision"],
		["staffPin/rotate", "staffPin/rotate"],
		["staffPin/deactivate", "staffPin/deactivate"],
		["owner/provision", "owner/provision"],
		["owner/deactivate", "owner/deactivate"],
		["owner/reactivate", "owner/reactivate"],
		["owner/resetCredential", "owner/resetCredential"],
	];
	for (const [suffix, key] of mutations) {
		await page.route(`**/rpc/admin/access/${suffix}`, async (route: Route) => {
			const code = refusals[key];
			if (code) {
				await route.fulfill({ status: 400, json: refusal(code) });
				return;
			}
			if (key === "staffPin/provision" || key === "staffPin/rotate") {
				await route.fulfill({ status: 200, json: { json: revealOutput() } });
				return;
			}
			await route.fulfill({ status: 200, json: { json: mutationOutput() } });
		});
	}
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
		access:
			(document.querySelector<HTMLElement>(".owner-access")?.scrollWidth ?? 0) -
			(document.querySelector<HTMLElement>(".owner-access")?.clientWidth ?? 0),
	}));
	expect(overflow.document).toBeLessThanOrEqual(0);
	expect(overflow.body).toBeLessThanOrEqual(0);
	expect(overflow.access).toBeLessThanOrEqual(0);
}

/**
 * A `.owner-access` capture taller than the viewport paints the shell's fixed
 * skip link into the image. That link belongs to `phase11-shell`, which owns its
 * baseline and its focus behaviour, so it is removed from this slice's
 * composition baseline instead of being asserted twice.
 */
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

const accessSection = ".owner-access";
const staffCard = "[data-owner-access-staff-pin]";
const reveal = "[data-owner-access-reveal]";
const revealDismiss = ".owner-access-reveal__dismiss";

test("the owner list reads once and leaves the shared analytics query untouched", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await mockOwnerSurfaces(page, { principals: livePrincipals });
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/admin");

	const rows = page.locator(".owner-access-owner");
	await expect(rows).toHaveCount(3);
	await expect(page.locator(staffCard)).toContainText("Active");
	await expect(rows.nth(0)).toContainText("Amina Owner");
	await expect(rows.nth(0)).toContainText("amina@fitway.example");
	await expect(rows.nth(1)).toContainText("Rashid Owner");
	await expect(rows.nth(2)).toContainText("Samir Owner");
	await expect(rows.nth(2)).toContainText("Deactivated");

	// Mounting this section must add no time-context request: that procedure
	// belongs to Phase 9 and its spec asserts exact post data on it.
	expect(observedTimeContextRequests).toEqual([
		{ json: { settingsVersions: [11] } },
	]);
	// Exactly one access list request for the page load.
	expect(observedAccessRequests).toHaveLength(1);

	// The neighbouring audit section still mounts on the same route.
	await expect(page.locator('[data-owner-audit-state="empty"]')).toBeVisible();
	await expectNoDocumentOverflow(page);
});

test("loading, error, empty, and live states each render with their own announcement", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await page.setViewportSize({ width: 390, height: 844 });

	await mockOwnerSurfaces(page, { principals: livePrincipals });
	// Hold the list open so the loading state cannot be outrun by the machine.
	listHoldOpen = true;
	await page.goto("/admin");
	const loading = page.locator('[data-owner-access-state="loading"]');
	await expect(loading).toBeVisible();
	await expect(loading).toHaveAttribute("role", "status");
	await captureReview(page, "owner-access-loading-en-390x844.png");
	listHoldOpen = false;
	releaseList?.();
	releaseList = null;
	await expect(page.locator(staffCard)).toBeVisible();
	await captureReview(page, "owner-access-live-en-390x844.png");

	await mockOwnerSurfaces(page, { principals: [] });
	await page.reload();
	const empty = page.locator('[data-owner-access-state="empty"]');
	await expect(empty).toBeVisible();
	await expect(empty).toContainText("No accounts to manage");
	await expect(page.locator(".owner-access-owner")).toHaveCount(0);
	await captureReview(page, "owner-access-empty-en-390x844.png");

	await mockOwnerSurfaces(page, { listStatus: 503 });
	await page.reload();
	const error = page.locator('[data-owner-access-state="error"]');
	await expect(error).toBeVisible();
	await expect(error).toHaveAttribute("role", "alert");
	await expect(page.locator(".owner-access-owner")).toHaveCount(0);
	await captureReview(page, "owner-access-error-en-390x844.png");

	await mockOwnerSurfaces(page, { principals: livePrincipals });
	await error.getByRole("button", { name: "Try again" }).click();
	await expect(page.locator(staffCard)).toBeVisible();
	await expectNoDocumentOverflow(page);
});

test("the section stands down while the shared analytics query is pending, issuing no access request", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	observedAccessRequests = [];
	const dailyGate = deferred();

	await page.route("**/rpc/admin/session", (route) =>
		route.fulfill({ status: 200, json: { json: ownerAuth } }),
	);
	await page.route("**/rpc/admin/analytics/daily", async (route) => {
		await dailyGate.promise;
		await route.fulfill({ status: 200, json: { json: daily } });
	});
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
	await page.route("**/rpc/admin/access/list", (route) => {
		observedAccessRequests.push(Date.now());
		return route.fulfill({
			status: 200,
			json: { json: { principals: livePrincipals } },
		});
	});

	await page.goto("/admin");
	// The page's own analytics loading region proves hydration has completed and
	// the shared query is still pending — not merely that nothing has mounted yet.
	await expect(page.getByRole("status")).toBeVisible();
	await expect(page.locator(accessSection)).toHaveCount(0);
	expect(observedAccessRequests).toHaveLength(0);

	dailyGate.resolve();
	await expect(page.locator(staffCard)).toBeVisible();
	expect(observedAccessRequests).toHaveLength(1);
});

test("the section stands down while the shared analytics query has failed, issuing no access request", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	observedAccessRequests = [];
	await page.route("**/rpc/admin/session", (route) =>
		route.fulfill({ status: 200, json: { json: ownerAuth } }),
	);
	await page.route("**/rpc/admin/analytics/daily", (route) =>
		route.fulfill({
			status: 503,
			json: rpcError(503, "SERVICE_UNAVAILABLE", "Service Unavailable"),
		}),
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
	await page.route("**/rpc/admin/access/list", (route) => {
		observedAccessRequests.push(Date.now());
		return route.fulfill({
			status: 200,
			json: { json: { principals: livePrincipals } },
		});
	});

	await page.goto("/admin");
	await expect(page.getByRole("alert")).toBeVisible();
	await expect(page.locator(accessSection)).toHaveCount(0);
	expect(observedAccessRequests).toHaveLength(0);
});

test("Arabic renders RTL with Western digits and a plain-hyphen PIN range", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "ar"),
	);
	await mockOwnerSurfaces(page, { principals: livePrincipals });
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/admin");
	await setLocale(page, "ar");

	await expect(page.locator(staffCard)).toBeVisible();
	const text = (await page.locator(accessSection).textContent()) ?? "";
	expect(text).not.toMatch(/[٠-٩۰-۹]/u);
	expect(text).toContain("رمز موظف الاستقبال المشترك");
	expect(text).toContain("المالكون");
	expect(text).toContain("مفعّل");
	expect(text).toContain("معطّل");
	// The 6-12 range uses a plain ASCII hyphen, never an en dash, so the run
	// does not reverse under bidi.
	expect(text).toContain("6-12");
	expect(text).not.toContain("\u2013");

	const direction = await page
		.locator(accessSection)
		.evaluate((element) => getComputedStyle(element).direction);
	expect(direction).toBe("rtl");

	// One refusal in Arabic proves the named copy is localized, not the bare line.
	await mockOwnerSurfaces(page, { principals: [staff] });
	refusals = { "owner/provision": "owner_email_taken" };
	await page.reload();
	await expect(page.locator(staffCard)).toBeVisible();
	await page.getByLabel("البريد الإلكتروني").fill("taken@fitway.example");
	await page.getByLabel("اسم العرض").fill("مالك جديد");
	await page.getByLabel("كلمة المرور الأولية").fill("long-enough-passphrase");
	await page.getByRole("button", { name: "توفير حساب مالك" }).click();
	const note = page.locator('[data-owner-access-refusal="owner_email_taken"]');
	await expect(note).toBeVisible();
	await expect(note).toContainText("يوجد مالك بالفعل بهذا البريد الإلكتروني");
	expect((await note.textContent()) ?? "").not.toMatch(/[٠-٩۰-۹]/u);
});

test("each of the nine typed refusals reaches the owner as its own named copy", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await page.setViewportSize({ width: 1200, height: 900 });
	await mockOwnerSurfaces(page, { principals: livePrincipals });

	async function deactivateOwnerNamed(page: Page, name: string) {
		const row = page.locator(".owner-access-owner").filter({ hasText: name });
		await row.getByRole("button", { name: "Deactivate" }).click();
		await row.getByLabel("Reason").fill("Offboarding");
		await row.getByRole("button", { name: "Confirm" }).click();
	}

	async function resetOwnerNamed(page: Page, name: string) {
		const row = page.locator(".owner-access-owner").filter({ hasText: name });
		await row.getByRole("button", { name: "Reset credential" }).click();
		await row.getByLabel("New password").fill("another-long-passphrase");
		await row.getByRole("button", { name: "Confirm" }).click();
	}

	async function reactivateOwnerNamed(page: Page, name: string) {
		const row = page.locator(".owner-access-owner").filter({ hasText: name });
		await row.getByRole("button", { name: "Reactivate" }).click();
	}

	async function provisionOwnerTaken(page: Page) {
		await page.getByLabel("Email").fill("taken@fitway.example");
		await page.getByLabel("Display name").fill("New owner");
		await page.getByLabel("Initial password").fill("long-enough-passphrase");
		await page.getByRole("button", { name: "Provision owner" }).click();
	}

	const scenarios: Array<{
		code: (typeof REFUSAL_CODES)[number];
		principals: Principal[];
		route: string;
		copy: string;
		run: (page: Page) => Promise<void>;
	}> = [
		{
			code: "staff_pin_already_active",
			principals: [unprovisionedStaff],
			route: "staffPin/provision",
			copy: "A staff PIN is already active. Rotate it instead of provisioning a new one.",
			run: async (page) => {
				await page
					.locator(staffCard)
					.getByRole("button", { name: "Provision staff PIN" })
					.click();
			},
		},
		{
			code: "staff_pin_not_active",
			principals: [staff],
			route: "staffPin/rotate",
			copy: "There is no active staff PIN to change. Provision one first.",
			run: async (page) => {
				await page
					.locator(staffCard)
					.getByRole("button", { name: "Rotate staff PIN" })
					.click();
			},
		},
		{
			code: "owner_self_deactivation",
			principals: [staff, selfOwner],
			route: "owner/deactivate",
			copy: "You cannot deactivate your own account. Ask another active owner to do it.",
			run: (page) => deactivateOwnerNamed(page, "Rashid Owner"),
		},
		{
			code: "owner_last_active",
			principals: [staff, otherOwner],
			route: "owner/deactivate",
			copy: "That owner is the last active owner. Deactivating them would leave the gym with no one able to manage it.",
			run: (page) => deactivateOwnerNamed(page, "Amina Owner"),
		},
		{
			code: "owner_already_inactive",
			principals: [staff, otherOwner],
			route: "owner/resetCredential",
			copy: "That owner is already deactivated.",
			run: (page) => resetOwnerNamed(page, "Amina Owner"),
		},
		{
			code: "owner_already_active",
			principals: [staff, inactiveOwner],
			route: "owner/reactivate",
			copy: "That owner is already active.",
			run: (page) => reactivateOwnerNamed(page, "Samir Owner"),
		},
		{
			code: "owner_email_taken",
			principals: [staff],
			route: "owner/provision",
			copy: "An owner already exists for that email address.",
			run: provisionOwnerTaken,
		},
		{
			code: "not_an_owner",
			principals: [staff, inactiveOwner],
			route: "owner/reactivate",
			copy: "That account is not an owner account, so this action cannot be applied to it.",
			run: (page) => reactivateOwnerNamed(page, "Samir Owner"),
		},
		{
			code: "reason_required",
			principals: [staff, otherOwner],
			route: "owner/deactivate",
			copy: "This action requires a reason. Enter one before confirming.",
			run: (page) => deactivateOwnerNamed(page, "Amina Owner"),
		},
	];

	for (const scenario of scenarios) {
		listPrincipals = scenario.principals;
		refusals = { [scenario.route]: scenario.code };
		await page.goto("/admin");
		await expect(page.locator(staffCard)).toBeVisible();
		await scenario.run(page);

		const note = page.locator(`[data-owner-access-refusal="${scenario.code}"]`);
		await expect(note).toBeVisible();
		await expect(note).toHaveAttribute("role", "alert");
		await expect(note).toHaveText(scenario.copy);
		await expect(note).not.toContainText("could not be applied");
	}
});

test("the generator-defect staff_pin_shape code is a generic failure, not a refusal", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await mockOwnerSurfaces(page, { principals: [unprovisionedStaff] });
	refusals = { "staffPin/provision": "staff_pin_shape" };
	await page.goto("/admin");
	await expect(page.locator(staffCard)).toBeVisible();
	await page
		.locator(staffCard)
		.getByRole("button", { name: "Provision staff PIN" })
		.click();

	// No named refusal: the surface reports the generic retry line instead.
	await expect(page.locator("[data-owner-access-failure]")).toBeVisible();
	await expect(page.locator("[data-owner-access-failure]")).toHaveText(
		"The change could not be applied. Check the connection and try again.",
	);
	await expect(page.locator("[data-owner-access-refusal]")).toHaveCount(0);
});

test("the one-time PIN reveal appears only after provision and rotate, focuses its dismiss, and returns focus to the trigger", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await page.setViewportSize({ width: 1024, height: 900 });

	// Provision path: an unprovisioned PIN offers only "Provision".
	await mockOwnerSurfaces(page, { principals: [unprovisionedStaff] });
	await page.goto("/admin");
	const card = page.locator(staffCard);
	await expect(card).toContainText("Not provisioned");
	await expect(page.locator(reveal)).toHaveCount(0);

	const provisionButton = card.getByRole("button", {
		name: "Provision staff PIN",
	});
	await provisionButton.click();

	const revealRegion = page.locator(reveal);
	await expect(revealRegion).toBeVisible();
	// Focus lands on the dismiss control the moment the reveal appears.
	await expect(page.locator(revealDismiss)).toBeFocused();
	// The copy names the once-only nature and the value reads in an LTR run.
	await expect(revealRegion).toContainText("shown once");
	await expect(revealRegion.locator("dd bdi")).toHaveText(REVEALED_PIN);
	await expect(revealRegion.locator("dd bdi")).toHaveAttribute("dir", "ltr");

	// Dismissal returns focus to the invoking control, never the body.
	await page.locator(revealDismiss).click();
	await expect(revealRegion).toHaveCount(0);
	await expect(provisionButton).toBeFocused();
	await expect(page.locator(reveal)).toHaveCount(0);

	// Rotate path: an active PIN offers rotate, and reveals through the same channel.
	await mockOwnerSurfaces(page, { principals: [staff] });
	await page.reload();
	await expect(card).toContainText("Active");
	const rotateButton = card.getByRole("button", { name: "Rotate staff PIN" });
	await rotateButton.click();
	await expect(revealRegion).toBeVisible();
	await expect(page.locator(revealDismiss)).toBeFocused();
	await page.locator(revealDismiss).click();
	await expect(revealRegion).toHaveCount(0);
	await expect(rotateButton).toBeFocused();

	// Deactivation is not a reveal path.
	await card.getByRole("button", { name: "Deactivate staff PIN" }).click();
	await card.getByLabel("Reason").fill("Desk closed");
	await card.getByRole("button", { name: "Confirm" }).click();
	await expect(page.locator(reveal)).toHaveCount(0);
});

test("a staff session and an anonymous visitor reach the access surface not at all", async ({
	page,
}) => {
	// Forbidden (staff / wrong role): the page shows the forbidden state and the
	// access section is never mounted.
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	observedAccessRequests = [];
	await page.route("**/rpc/admin/session", (route) =>
		route.fulfill({
			status: 403,
			json: rpcError(403, "FORBIDDEN", "Forbidden"),
		}),
	);
	await page.route("**/rpc/admin/access/list", (route) => {
		observedAccessRequests.push(Date.now());
		return route.fulfill({
			status: 200,
			json: { json: { principals: livePrincipals } },
		});
	});
	await page.goto("/admin");
	await expect(page.locator(".admin-state--forbidden")).toBeVisible();
	await expect(page.locator(accessSection)).toHaveCount(0);
	expect(observedAccessRequests).toHaveLength(0);

	// Anonymous: the route guard redirects to login, so the surface is unreachable.
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
	await page.goto("/admin");
	await expect(page).toHaveURL(/\/login$/u);
	await expect(page.locator(accessSection)).toHaveCount(0);
});

test("keyboard, targets, reduced motion, 200% reflow, forced colors, and axe hold", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await mockOwnerSurfaces(page, { principals: livePrincipals });
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.setViewportSize({ width: 1024, height: 900 });
	await page.goto("/admin");
	await expect(page.locator(staffCard)).toBeVisible();

	const controls = page.locator(`${accessSection} :is(button, input)`);
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

	// Tab order follows visual order from the first staff-card action.
	await controls.first().focus();
	await page.keyboard.press("Tab");
	await expect(controls.nth(1)).toBeFocused();

	expect(
		await page.evaluate(
			() => matchMedia("(prefers-reduced-motion: reduce)").matches,
		),
	).toBe(true);
	const animated = await page.evaluate(
		() =>
			document.querySelector(".owner-access")?.getAnimations({ subtree: true })
				.length ?? 0,
	);
	expect(animated).toBe(0);

	await page.evaluate(() => {
		document.documentElement.style.zoom = "2";
	});
	await expectNoDocumentOverflow(page);
	await captureReview(page, "owner-access-en-200-percent-reflow.png");
	await page.evaluate(() => {
		document.documentElement.style.zoom = "1";
	});

	for (const locale of ["en", "ar"] as const) {
		await setLocale(page, locale);
		const results = await new AxeBuilder({ page })
			.include(accessSection)
			.analyze();
		expect(seriousViolations(results)).toEqual([]);
	}
	await setLocale(page, "en");

	await page.emulateMedia({ forcedColors: "active" });
	expect(
		await page.evaluate(() => matchMedia("(forced-colors: active)").matches),
	).toBe(true);
	for (const control of await page
		.locator(`${accessSection} :is(button, input)`)
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

test("canonical desktop Arabic and mobile English access compositions match", async ({
	page,
}) => {
	await mockOwnerSurfaces(page, { principals: livePrincipals });
	await page.goto("/admin");
	await setLocale(page, "ar");
	await hideShellSkipLink(page);
	await page.setViewportSize({ width: 1440, height: 900 });
	await expect(page.locator(staffCard)).toBeVisible();
	await page.evaluate(() => document.fonts.ready);
	await expect(page.locator(accessSection)).toHaveScreenshot(
		"owner-access-ar-desktop-1440x900.png",
	);

	await setLocale(page, "en");
	await page.setViewportSize({ width: 390, height: 844 });
	await expect(page.locator(staffCard)).toBeVisible();
	await page.evaluate(() => document.fonts.ready);
	await expect(page.locator(accessSection)).toHaveScreenshot(
		"owner-access-en-mobile-390x844.png",
	);
});
