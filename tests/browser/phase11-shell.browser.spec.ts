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

const daily = {
	businessDay: "2026-07-21",
	timeline: [
		{
			state: "closed",
			minuteStartUtc: "2026-07-21T06:59:00.000Z",
			count: null,
			settingsVersion: 11,
		},
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

const timeContext = {
	current: { settingsVersion: 12, timeZone: "Europe/London" },
	versions: [
		{ settingsVersion: 11, timeZone: "Asia/Riyadh" },
		{ settingsVersion: 12, timeZone: "America/New_York" },
	],
} as const;

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

async function mockOwnerAnalytics(
	page: Page,
	options: { dailyHold?: Promise<void> } = {},
) {
	await page.route("**/rpc/admin/session", (route) =>
		route.fulfill({ status: 200, json: { json: ownerAuth } }),
	);
	await page.route("**/rpc/admin/analytics/daily", async (route) => {
		await options.dailyHold;
		await route.fulfill({ status: 200, json: { json: daily } });
	});
	await page.route("**/rpc/admin/analytics/timeContext", async (route) => {
		expect(route.request().postDataJSON()).toEqual({
			json: { settingsVersions: [11, 12] },
		});
		await route.fulfill({ status: 200, json: { json: timeContext } });
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

async function settleOwnerBrand(page: Page) {
	const image = page.locator(".owner-rail__brand img");
	await image.evaluate(async (element) => {
		await (element as HTMLImageElement).decode();
		await new Promise<void>((resolve) => {
			requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
		});
	});
}

async function expectNoOverflow(page: Page) {
	const overflow = await page.evaluate(() => ({
		document: document.documentElement.scrollWidth - window.innerWidth,
		body: document.body.scrollWidth - window.innerWidth,
		rail: document.querySelector<HTMLElement>(".owner-rail")?.scrollWidth ?? 0,
		railClient:
			document.querySelector<HTMLElement>(".owner-rail")?.clientWidth ?? 0,
	}));
	expect(overflow.document).toBeLessThanOrEqual(0);
	expect(overflow.body).toBeLessThanOrEqual(0);
	expect(overflow.rail).toBe(overflow.railClient);
}

function seriousViolations(
	results: Awaited<ReturnType<AxeBuilder["analyze"]>>,
) {
	return results.violations.filter(
		({ impact }) => impact === "serious" || impact === "critical",
	);
}

test("approved physical rail zones and spacing hold in both locales at every required width", async ({
	page,
}) => {
	await mockOwnerAnalytics(page);
	await page.goto("/admin");

	const cases = [
		{ width: 1440, height: 900, rail: 56, padding: 48, top: 36 },
		{ width: 768, height: 1024, rail: 56, padding: 24, top: 28 },
		{ width: 390, height: 844, rail: 96, padding: 16, top: 20 },
		{ width: 320, height: 720, rail: 96, padding: 12, top: 20 },
	] as const;

	for (const locale of ["ar", "en"] as const) {
		await setLocale(page, locale);
		for (const view of cases) {
			await page.setViewportSize(view);
			await expect(page.locator("[data-owner-chart]")).toBeVisible();
			const geometry = await page.evaluate(() => {
				const rail = document.querySelector<HTMLElement>(".owner-rail");
				const session = document.querySelector<HTMLElement>(
					".owner-rail__session",
				);
				const brand = document.querySelector<HTMLElement>(".owner-rail__brand");
				const main = document.querySelector<HTMLElement>(".owner-main");
				const links = [
					...document.querySelectorAll<HTMLElement>(".owner-nav__link"),
				];
				const sessionActions = [
					...document.querySelectorAll<HTMLElement>(
						".owner-rail__session-action",
					),
				];
				if (!rail || !session || !brand || !main) {
					throw new Error("Owner shell geometry is unavailable");
				}
				return {
					railHeight: rail.getBoundingClientRect().height,
					sessionX: session.getBoundingClientRect().x,
					brandX: brand.getBoundingClientRect().x,
					linkBoxes: links.map((link) => link.getBoundingClientRect()),
					sessionActionBoxes: sessionActions.map((action) =>
						action.getBoundingClientRect(),
					),
					mainPaddingInlineStart: Number.parseFloat(
						getComputedStyle(main).paddingInlineStart,
					),
					mainPaddingTop: Number.parseFloat(getComputedStyle(main).paddingTop),
				};
			});

			expect(geometry.railHeight).toBe(view.rail);
			expect(geometry.mainPaddingInlineStart).toBe(view.padding);
			expect(geometry.mainPaddingTop).toBe(view.top);
			expect(geometry.sessionX).toBeLessThan(geometry.brandX);
			expect(geometry.linkBoxes[0]?.x).toBeLessThan(
				geometry.linkBoxes[1]?.x ?? 0,
			);
			for (const box of geometry.sessionActionBoxes) {
				expect(box.width).toBeGreaterThanOrEqual(44);
				expect(box.height).toBeGreaterThanOrEqual(44);
			}
			if (view.width <= 390) {
				expect(geometry.linkBoxes[0]?.x).toBe(0);
				expect(geometry.linkBoxes[0]?.width).toBe(view.width / 2);
				expect(geometry.linkBoxes[1]?.width).toBe(view.width / 2);
			}
			await expectNoOverflow(page);
			await captureReview(
				page,
				`owner-shell-${locale}-${view.width}x${view.height}.png`,
			);
		}
	}

	const safeAreaCases = [
		{ width: 768, height: 1024, left: 37, right: 59 },
		{ width: 320, height: 720, left: 29, right: 41 },
	] as const;
	for (const locale of ["ar", "en"] as const) {
		await setLocale(page, locale);
		for (const view of safeAreaCases) {
			await page.setViewportSize(view);
			await page.locator(".owner-shell").evaluate((shell, insets) => {
				shell.style.setProperty("--owner-safe-inset-left", `${insets.left}px`);
				shell.style.setProperty(
					"--owner-safe-inset-right",
					`${insets.right}px`,
				);
			}, view);
			await expect(page.locator("[data-owner-chart]")).toBeVisible();

			const safeGeometry = await page.evaluate(() => {
				const actions = [
					...document.querySelectorAll<HTMLElement>(
						".owner-rail__session-action",
					),
				];
				const brand = document.querySelector<HTMLElement>(".owner-rail__brand");
				if (!brand) {
					throw new Error("Owner brand geometry is unavailable");
				}
				const brandBox = brand.getBoundingClientRect();
				return {
					actionBoxes: actions.map((action) => {
						const box = action.getBoundingClientRect();
						return { left: box.left, right: box.right };
					}),
					brandRight: brandBox.right,
				};
			});
			for (const box of safeGeometry.actionBoxes) {
				expect(box.left).toBeGreaterThanOrEqual(view.left);
				expect(box.right).toBeLessThanOrEqual(view.width - view.right);
			}
			expect(safeGeometry.brandRight).toBeLessThanOrEqual(
				view.width - view.right,
			);
			await expectNoOverflow(page);
		}
	}
});

test("canonical desktop Arabic and mobile English shell compositions match", async ({
	page,
}) => {
	await mockOwnerAnalytics(page);
	await page.goto("/admin");
	await setLocale(page, "ar");
	await page.setViewportSize({ width: 1440, height: 900 });
	await expect(page.locator("[data-owner-chart]")).toBeVisible();
	await page.evaluate(() => document.fonts.ready);
	await settleOwnerBrand(page);
	// Scoped to the shell chrome rather than the full page, under the human
	// decision of 2026-08-15. `/admin` is designed to host a growing set of owner
	// sections, so a full-page capture of this route asserted the composition of
	// whatever happened to be mounted and broke on every new section regardless of
	// whether the shell itself changed. Each section's composition is covered by
	// its own slice's baselines; this one owns the rail.
	await expect(page.locator(".owner-rail")).toHaveScreenshot(
		"owner-shell-ar-desktop-1440x900.png",
	);

	await setLocale(page, "en");
	await page.setViewportSize({ width: 390, height: 844 });
	await expect(page.locator("[data-owner-chart]")).toBeVisible();
	await settleOwnerBrand(page);
	await expect(page.locator(".owner-rail")).toHaveScreenshot(
		"owner-shell-en-mobile-390x844.png",
	);
});

test("shared Owner navigation keeps the approved labels, transparent material, and selected reveal", async ({
	page,
}) => {
	await mockOwnerAnalytics(page);
	await page.goto("/admin");
	const expected = {
		en: [
			"Daily",
			"Reports",
			"Accounts & Sign-in",
			"Activity Log",
			"System Status",
			"Settings",
		],
		ar: [
			"اليومي",
			"التقارير",
			"الحسابات والدخول",
			"سجل النشاط",
			"حالة النظام",
			"الإعدادات",
		],
	} as const;

	for (const locale of ["en", "ar"] as const) {
		await setLocale(page, locale);
		const tablist = page.getByRole("tablist", {
			name: locale === "ar" ? "أقسام الإدارة" : "Management sections",
		});
		await expect(tablist.getByRole("tab")).toHaveText(expected[locale]);
		await expect(page.locator(".owner-nav__link")).toHaveText(
			locale === "ar" ? ["المراقبة", "الإدارة"] : ["Monitoring", "Management"],
		);

		for (const viewport of [
			{ width: 1440, height: 900 },
			{ width: 768, height: 1024 },
			{ width: 390, height: 844 },
			{ width: 320, height: 720 },
		]) {
			await page.setViewportSize(viewport);
			const dailyTab = tablist.getByRole("tab", { name: expected[locale][0] });
			const settingsTab = tablist.getByRole("tab", {
				name: expected[locale][5],
			});
			await dailyTab.focus();
			await page.keyboard.press("End");
			await expect(settingsTab).toBeFocused();
			await expect(settingsTab).toHaveAttribute("aria-selected", "true");

			const geometry = await tablist.evaluate((element, width) => {
				const selected = element.querySelector<HTMLElement>(
					'[role="tab"][aria-selected="true"]',
				);
				const row = element.getBoundingClientRect();
				const active = selected?.getBoundingClientRect();
				const style = getComputedStyle(element);
				return {
					backgroundColor: style.backgroundColor,
					backgroundImage: style.backgroundImage,
					clientWidth: element.clientWidth,
					scrollWidth: element.scrollWidth,
					row: { left: row.left, right: row.right, height: row.height },
					active: active && { left: active.left, right: active.right },
					viewportWidth: width,
				};
			}, viewport.width);
			expect(geometry.backgroundImage).toBe("none");
			// Approved Variant B: the six-destination row stays fully
			// transparent over the page wash (the earlier uniform
			// #FFEEF004 fill is superseded); only the Paper divider and the
			// active-tab underline carry the row structure.
			expect(geometry.backgroundColor).toBe("rgba(0, 0, 0, 0)");
			expect(geometry.row.height).toBe(viewport.width <= 900 ? 46 : 48);
			expect(geometry.active).not.toBeNull();
			if (geometry.active) {
				expect(geometry.active.left).toBeGreaterThanOrEqual(
					geometry.row.left - 1,
				);
				expect(geometry.active.right).toBeLessThanOrEqual(
					geometry.row.right + 1,
				);
			}
			if (viewport.width <= 768) {
				expect(geometry.scrollWidth).toBeGreaterThan(geometry.clientWidth);
			} else {
				expect(geometry.scrollWidth).toBe(geometry.clientWidth);
			}
			if (viewport.width === 320) {
				const scrollBeforeMutation = await page.evaluate(() => {
					window.scrollTo(0, document.documentElement.scrollHeight);
					return window.scrollY;
				});
				await page
					.locator('[role="tabpanel"]:not([hidden])')
					.evaluate((panel) => {
						const probe = document.createElement("span");
						probe.hidden = true;
						panel.append(probe);
						probe.remove();
					});
				await page.evaluate(
					() =>
						new Promise((resolve) =>
							requestAnimationFrame(() => resolve(null)),
						),
				);
				expect(await page.evaluate(() => window.scrollY)).toBe(
					scrollBeforeMutation,
				);
			}
			await expectNoOverflow(page);
		}
	}
});

test("every destination keeps its own identity while Daily is pending", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	let releaseDaily = () => {};
	const dailyHold = new Promise<void>((resolve) => {
		releaseDaily = resolve;
	});
	await mockOwnerAnalytics(page, { dailyHold });

	const independentRequests = {
		access: 0,
		health: 0,
		settings: 0,
	};
	let releaseIndependent = () => {};
	const independentHold = new Promise<void>((resolve) => {
		releaseIndependent = resolve;
	});
	for (const section of Object.keys(independentRequests) as Array<
		keyof typeof independentRequests
	>) {
		const endpoint =
			section === "health"
				? "summary"
				: section === "settings"
					? "read"
					: "list";
		await page.route(`**/rpc/admin/${section}/${endpoint}`, async (route) => {
			independentRequests[section] += 1;
			await independentHold;
			await route.fulfill({
				status: 503,
				json: rpcError(503, "SERVICE_UNAVAILABLE", "Service Unavailable"),
			});
		});
	}
	let auditRequests = 0;
	await page.route("**/rpc/admin/audit/list", async (route) => {
		auditRequests += 1;
		await route.fulfill({
			status: 503,
			json: rpcError(503, "SERVICE_UNAVAILABLE", "Service Unavailable"),
		});
	});

	await page.goto("/admin");
	await expect(page.getByRole("status")).toContainText("Loading");

	const destinations = [
		{ section: "history", heading: "Reports", stateRole: "status" },
		{ section: "access", heading: "Access", stateRole: "status" },
		{ section: "audit", heading: "Activity Log", stateRole: "status" },
		{ section: "health", heading: "Uptime and incidents", stateRole: "status" },
		{ section: "settings", heading: "Settings", stateRole: "status" },
	] as const;

	for (const destination of destinations) {
		await page
			.locator(`[role="tab"][data-owner-section="${destination.section}"]`)
			.click();
		const panel = page.locator('[role="tabpanel"]:not([hidden])');
		await expect(panel.getByRole("heading", { level: 1 })).toHaveText(
			destination.heading,
		);
		await expect(panel.getByRole(destination.stateRole)).toBeVisible();
	}

	await expect
		.poll(() => independentRequests)
		.toEqual({ access: 1, health: 1, settings: 1 });
	// Audit legitimately shares Daily's resolved gym timezone, but it must render
	// Activity Log's own pending surface instead of substituting the Daily panel.
	expect(auditRequests).toBe(0);
	releaseIndependent();
	releaseDaily();
});

test("rapid section changes are latest-wins even when older requests finish late", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await mockOwnerAnalytics(page);
	let releaseAccess = () => {};
	let releaseSettings = () => {};
	const accessHold = new Promise<void>((resolve) => {
		releaseAccess = resolve;
	});
	const settingsHold = new Promise<void>((resolve) => {
		releaseSettings = resolve;
	});
	await page.route("**/rpc/admin/access/list", async (route) => {
		await accessHold;
		await route.fulfill({
			status: 503,
			json: rpcError(503, "SERVICE_UNAVAILABLE", "Service Unavailable"),
		});
	});
	await page.route("**/rpc/admin/settings/read", async (route) => {
		await settingsHold;
		await route.fulfill({
			status: 503,
			json: rpcError(503, "SERVICE_UNAVAILABLE", "Service Unavailable"),
		});
	});

	await page.goto("/admin");
	await expect(page.locator("[data-owner-chart]")).toBeVisible();
	await page.evaluate(() => {
		for (const section of ["access", "settings"]) {
			const tab = document.querySelector<HTMLElement>(
				`[role="tab"][data-owner-section="${section}"]`,
			);
			if (!tab) throw new Error(`Missing ${section} tab`);
			tab.click();
		}
	});

	const settingsTab = page.locator(
		'[role="tab"][data-owner-section="settings"]',
	);
	const activePanel = page.locator('[role="tabpanel"]:not([hidden])');
	await expect(settingsTab).toHaveAttribute("aria-selected", "true");
	await expect(activePanel).toHaveAttribute(
		"id",
		"owner-section-settings-panel",
	);
	await expect(activePanel.getByRole("heading", { level: 1 })).toHaveText(
		"Settings",
	);
	const settledScroll = await page.evaluate(() => window.scrollY);

	releaseAccess();
	await page.waitForTimeout(220);
	await expect(settingsTab).toHaveAttribute("aria-selected", "true");
	expect(await page.evaluate(() => window.scrollY)).toBe(settledScroll);

	releaseSettings();
	await expect(activePanel.getByRole("heading", { level: 1 })).toContainText(
		"Settings",
	);
	await page.waitForTimeout(220);
	await expect(settingsTab).toHaveAttribute("aria-selected", "true");
	expect(await page.evaluate(() => window.scrollY)).toBe(settledScroll);
});

test("section navigation preserves scroll through tall and short retained panels", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await mockOwnerAnalytics(page);
	await page.route("**/rpc/admin/health/summary", (route) =>
		route.fulfill({
			status: 503,
			json: rpcError(503, "SERVICE_UNAVAILABLE", "Service Unavailable"),
		}),
	);
	await page.setViewportSize({ width: 390, height: 600 });
	await page.goto("/admin");
	await expect(page.locator("[data-owner-chart]")).toBeVisible();

	await page.locator("#owner-analytics-daily-panel").evaluate((panel) => {
		const probe = document.createElement("div");
		probe.dataset.ownerScrollProbe = "";
		probe.style.height = "1600px";
		probe.style.pointerEvents = "none";
		panel.append(probe);
	});

	async function activateAndSample(section: string) {
		await page.evaluate((nextSection) => {
			const state = window as typeof window & {
				__ownerScrollSamples?: number[];
			};
			state.__ownerScrollSamples = [];
			let frames = 0;
			const sample = () => {
				state.__ownerScrollSamples?.push(window.scrollY);
				frames += 1;
				if (frames < 16) requestAnimationFrame(sample);
			};
			requestAnimationFrame(sample);
			const tab = document.querySelector<HTMLElement>(
				`[role="tab"][data-owner-section="${nextSection}"]`,
			);
			if (!tab) throw new Error(`Missing ${nextSection} tab`);
			tab.click();
		}, section);
		await expect(
			page.locator(
				`[role="tab"][data-owner-section="${section}"][aria-selected="true"]`,
			),
		).toBeVisible();
		await expect
			.poll(() =>
				page
					.locator('[role="tabpanel"]:not([hidden])')
					.getAttribute("data-owner-section-state"),
			)
			.toBe("active");
		await page.waitForTimeout(220);
		return page.evaluate(
			() =>
				(window as typeof window & { __ownerScrollSamples?: number[] })
					.__ownerScrollSamples ?? [],
		);
	}

	async function expectNavigationAligned() {
		const delta = await page.evaluate(() => {
			const switcher = document.querySelector<HTMLElement>(
				".owner-section-switch",
			);
			const row = switcher?.querySelector<HTMLElement>(
				":scope > .owner-analytics-mode__tabs",
			);
			const anchor = switcher?.querySelector<HTMLElement>(
				'[role="tabpanel"]:not([hidden]) [data-owner-navigation-anchor]',
			);
			if (!switcher || !row || !anchor) {
				throw new Error("Active navigation geometry is unavailable");
			}
			const switcherBox = switcher.getBoundingClientRect();
			const scale =
				switcher.offsetWidth > 0 ? switcherBox.width / switcher.offsetWidth : 1;
			const gap = Number.parseFloat(
				getComputedStyle(switcher).getPropertyValue(
					"--owner-section-navigation-gap",
				),
			);
			return Math.abs(
				row.getBoundingClientRect().top -
					(anchor.getBoundingClientRect().bottom + gap * scale),
			);
		});
		expect(delta).toBeLessThanOrEqual(1);
	}

	await page.evaluate(() => window.scrollTo(0, 135));
	expect(await page.evaluate(() => window.scrollY)).toBe(135);
	const shortSamples = await activateAndSample("health");
	await expectNavigationAligned();
	expect(shortSamples.length).toBeGreaterThan(1);
	const savedShortScroll = await page.evaluate(() => window.scrollY);
	// A first visit settles at the resting position: the destination heading
	// keeps the same viewport offset it has at scrollY=0 instead of being
	// pinned to the viewport top (0 here, matching that resting offset).
	expect(savedShortScroll).toBe(0);

	const firstRestoreSamples = await activateAndSample("daily");
	await expectNavigationAligned();
	// The remembered restore may clamp to the top only while the short panel
	// is briefly displayed; once settled it must rest at the saved position.
	expect(firstRestoreSamples.at(-1)).toBeGreaterThan(0);
	expect(await page.evaluate(() => window.scrollY)).toBe(135);

	const nearBottom = await page.evaluate(() => {
		const maximum = Math.max(
			0,
			document.documentElement.scrollHeight - window.innerHeight,
		);
		const target = Math.max(1, maximum - 40);
		window.scrollTo(0, target);
		return window.scrollY;
	});
	expect(nearBottom).toBeGreaterThan(135);
	const revisitShortSamples = await activateAndSample("health");
	await expectNavigationAligned();
	expect(revisitShortSamples.length).toBeGreaterThan(1);
	expect(await page.evaluate(() => window.scrollY)).toBe(savedShortScroll);

	const nearBottomRestoreSamples = await activateAndSample("daily");
	await expectNavigationAligned();
	expect(nearBottomRestoreSamples.at(-1)).toBeGreaterThan(0);
	expect(await page.evaluate(() => window.scrollY)).toBe(nearBottom);

	// Give the retained short panel a temporary tall body, save a deep position,
	// then make it short again. A wheel gesture during the bounded settlement
	// window owns the scroll position and cancels every late automatic restore.
	await page.locator("#owner-section-health-panel").evaluate((panel) => {
		const probe = document.createElement("div");
		probe.dataset.ownerHealthScrollProbe = "";
		probe.style.height = "1400px";
		panel.append(probe);
	});
	await activateAndSample("health");
	const deepHealthScroll = await page.evaluate(() => {
		const maximum = document.documentElement.scrollHeight - window.innerHeight;
		const target = Math.max(1, maximum - 40);
		window.scrollTo(0, target);
		return window.scrollY;
	});
	expect(deepHealthScroll).toBeGreaterThan(200);
	await activateAndSample("daily");
	await page.locator("[data-owner-health-scroll-probe]").evaluate((probe) => {
		probe.style.height = "450px";
	});

	await page.evaluate(() => {
		document
			.querySelector<HTMLElement>('[role="tab"][data-owner-section="health"]')
			?.click();
	});
	await expect(
		page.locator(
			'[role="tab"][data-owner-section="health"][aria-selected="true"]',
		),
	).toBeVisible();
	const userOwnedScroll = await page.evaluate(() => {
		window.dispatchEvent(new WheelEvent("wheel", { deltaY: -1 }));
		const maximum = Math.max(
			0,
			document.documentElement.scrollHeight - window.innerHeight,
		);
		const target = Math.min(60, maximum);
		window.scrollTo(0, target);
		return window.scrollY;
	});
	await page.waitForTimeout(240);
	expect(await page.evaluate(() => window.scrollY)).toBe(userOwnedScroll);
});

test("selected middle tab stays visible when zoom and viewport resize change", async ({
	page,
}) => {
	await mockOwnerAnalytics(page);
	await page.goto("/admin");
	for (const locale of ["en", "ar"] as const) {
		await page.evaluate(() => {
			document.documentElement.style.zoom = "1";
		});
		await page.setViewportSize({ width: 1440, height: 900 });
		await setLocale(page, locale);
		const row = page.getByRole("tablist");
		const activity = row.locator('[data-owner-section="audit"]');
		await activity.click();
		await page.evaluate(() => {
			document.documentElement.style.zoom = "2";
		});
		await page.setViewportSize({ width: 768, height: 900 });
		await expect
			.poll(async () => {
				const bounds = await row.boundingBox();
				const tab = await activity.boundingBox();
				return (
					!!bounds &&
					!!tab &&
					tab.x >= bounds.x - 1 &&
					tab.x + tab.width <= bounds.x + bounds.width + 1
				);
			})
			.toBe(true);
	}
});

test("navigation, locale, and logout keep their established behavior", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await mockOwnerAnalytics(page);
	let authenticated = true;
	let logoutRequests = 0;
	await page.route("**/api/auth/session", (route) =>
		route.fulfill(
			authenticated
				? { status: 200, json: { auth: ownerAuth } }
				: { status: 401, json: { error: "unauthorized" } },
		),
	);
	await page.route("**/api/auth/logout", async (route) => {
		logoutRequests += 1;
		authenticated = false;
		await route.fulfill({ status: 204, body: "" });
	});
	await page.route("**/rpc/staff/operationalSnapshot", (route) =>
		route.fulfill({
			status: 503,
			json: rpcError(503, "SERVICE_UNAVAILABLE", "Service Unavailable"),
		}),
	);

	await page.goto("/admin");
	await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
	await page.locator(".owner-rail__language").click();
	await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
	await page.locator(".owner-nav__link").first().click();
	await expect(page).toHaveURL(/\/staff$/u);

	await page.goto("/admin");
	await page.locator(".owner-rail__logout").click();
	await expect(page).toHaveURL(/\/login$/u);
	expect(logoutRequests).toBe(1);
});

test("rail geometry is invariant through loading, error, and forbidden states", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await page.route("**/rpc/admin/session", (route) =>
		route.fulfill({ status: 200, json: { json: ownerAuth } }),
	);
	await page.route("**/rpc/admin/analytics/daily", async (route) => {
		await new Promise((resolve) => setTimeout(resolve, 500));
		await route.fulfill({
			status: 503,
			json: rpcError(503, "SERVICE_UNAVAILABLE", "Service Unavailable"),
		});
	});
	await page.route("**/rpc/admin/analytics/timeContext", (route) =>
		route.fulfill({ status: 200, json: { json: timeContext } }),
	);
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/admin");

	const rail = page.locator(".owner-rail");
	await expect(page.getByRole("status")).toBeVisible();
	const loadingBox = await rail.boundingBox();
	await captureReview(page, "owner-shell-loading-en-390x844.png");
	await expect(page.getByRole("alert")).toBeVisible();
	const errorBox = await rail.boundingBox();
	expect(errorBox).toEqual(loadingBox);
	await captureReview(page, "owner-shell-error-en-390x844.png");

	await page.unroute("**/rpc/admin/session");
	await page.route("**/rpc/admin/session", (route) =>
		route.fulfill({
			status: 403,
			json: rpcError(403, "FORBIDDEN", "Forbidden"),
		}),
	);
	await page.reload();
	await expect(page.getByRole("alert")).toBeVisible();
	const forbiddenBox = await rail.boundingBox();
	expect(forbiddenBox).toEqual(loadingBox);
	await expectNoOverflow(page);
	await captureReview(page, "owner-shell-forbidden-en-390x844.png");
});

test("focus, 44px targets, reduced preferences, 200% reflow, and axe remain sound", async ({
	page,
}) => {
	await page.addInitScript(() =>
		window.localStorage.setItem("fitway.locale", "en"),
	);
	await mockOwnerAnalytics(page);
	await page.emulateMedia({ reducedMotion: "reduce" });
	const cdp = await page.context().newCDPSession(page);
	await cdp.send("Emulation.setEmulatedMedia", {
		features: [
			{ name: "prefers-reduced-motion", value: "reduce" },
			{ name: "prefers-reduced-transparency", value: "reduce" },
		],
	});
	await page.setViewportSize({ width: 640, height: 900 });
	await page.goto("/admin");
	await expect(page.locator("[data-owner-chart]")).toBeVisible();

	const skip = page.locator(".operations-skip-link");
	await skip.focus();
	await expect(skip).toBeFocused();
	const skipPreferences = await skip.evaluate((element) => {
		const style = getComputedStyle(element);
		return {
			transitionDuration: style.transitionDuration,
			transitionProperty: style.transitionProperty,
		};
	});
	expect(skipPreferences.transitionProperty).toBe("none");
	expect(skipPreferences.transitionDuration).toBe("0s");
	await page.keyboard.press("Enter");
	await expect(page.locator("main")).toBeFocused();

	for (const locator of [
		page.locator(".owner-rail__logout"),
		page.locator(".owner-rail__language"),
		page.locator(".owner-nav__link").first(),
		page.locator(".owner-nav__link").last(),
		page.locator(".owner-rail__brand"),
	]) {
		const box = await locator.boundingBox();
		expect(box?.width).toBeGreaterThanOrEqual(44);
		expect(box?.height).toBeGreaterThanOrEqual(44);
		await locator.focus();
		await expect(locator).toBeFocused();
		await expect
			.poll(() =>
				locator.evaluate((element) => getComputedStyle(element).boxShadow),
			)
			.not.toBe("none");
	}

	const preferences = await page.locator(".owner-rail").evaluate((element) => {
		const style = getComputedStyle(element);
		return {
			motion: matchMedia("(prefers-reduced-motion: reduce)").matches,
			transparency: matchMedia("(prefers-reduced-transparency: reduce)")
				.matches,
			transition: style.transitionDuration,
			backdrop: style.backdropFilter,
		};
	});
	expect(preferences.motion).toBe(true);
	expect(preferences.transparency).toBe(true);
	expect(preferences.transition).toBe("0s");
	expect(preferences.backdrop).toBe("none");

	await page.evaluate(() => {
		document.documentElement.style.zoom = "2";
	});
	await expectNoOverflow(page);
	await captureReview(page, "owner-shell-en-200-percent-reflow.png");
	await page.evaluate(() => {
		document.documentElement.style.zoom = "1";
	});

	for (const locale of ["en", "ar"] as const) {
		await setLocale(page, locale);
		const results = await new AxeBuilder({ page }).analyze();
		expect(seriousViolations(results)).toEqual([]);
	}

	await page.emulateMedia({ forcedColors: "active" });
	expect(
		await page.evaluate(() => matchMedia("(forced-colors: active)").matches),
	).toBe(true);
	const forcedColorTargets = page.locator(
		'.owner-shell :is(a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"]))',
	);
	expect(await forcedColorTargets.count()).toBeGreaterThan(4);
	for (const target of await forcedColorTargets.all()) {
		if (!(await target.isVisible()) || (await target.isDisabled())) {
			continue;
		}
		await target.focus();
		await expect(target).toBeFocused();
		const outline = await target.evaluate((element) => {
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
