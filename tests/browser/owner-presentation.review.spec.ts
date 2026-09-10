import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { expect, type Page, test } from "@playwright/test";

import {
	installOwnerReviewScenario,
	isOwnerReviewScenario,
	type OwnerReviewScenario,
	ownerReviewSection,
} from "./support/owner-review-fixtures";

type ReviewLocale = "ar" | "en";
type ReviewViewport = { width: number; height: number };

type OwnerPresentationCase = {
	name: string;
	scenario: OwnerReviewScenario;
	locale: ReviewLocale;
	viewport: ReviewViewport;
};

const desktop = { width: 1440, height: 900 } as const;
const mobile = { width: 390, height: 844 } as const;

const blockingCases: readonly OwnerPresentationCase[] = [
	{
		name: "daily-ar-desktop",
		scenario: "daily/full",
		locale: "ar",
		viewport: desktop,
	},
	{
		name: "daily-en-mobile",
		scenario: "daily/full",
		locale: "en",
		viewport: mobile,
	},
	{
		name: "reports-ar-desktop",
		scenario: "reports/full",
		locale: "ar",
		viewport: desktop,
	},
	{
		name: "reports-en-mobile",
		scenario: "reports/full",
		locale: "en",
		viewport: mobile,
	},
	{
		name: "activity-ar-desktop",
		scenario: "activity/long",
		locale: "ar",
		viewport: desktop,
	},
	{
		name: "activity-en-mobile",
		scenario: "activity/long",
		locale: "en",
		viewport: mobile,
	},
	{
		name: "access-ar-desktop",
		scenario: "access/generated-pin",
		locale: "ar",
		viewport: desktop,
	},
	{
		name: "access-en-mobile",
		scenario: "access/generated-pin",
		locale: "en",
		viewport: mobile,
	},
	{
		name: "health-ar-desktop",
		scenario: "health/degraded",
		locale: "ar",
		viewport: desktop,
	},
	{
		name: "health-en-mobile",
		scenario: "health/degraded",
		locale: "en",
		viewport: mobile,
	},
	{
		name: "settings-ar-desktop",
		scenario: "settings/dirty",
		locale: "ar",
		viewport: desktop,
	},
	{
		name: "settings-en-mobile",
		scenario: "settings/dirty",
		locale: "en",
		viewport: mobile,
	},
	{
		name: "reports-en-desktop",
		scenario: "reports/full",
		locale: "en",
		viewport: desktop,
	},
	{
		name: "reports-ar-mobile",
		scenario: "reports/full",
		locale: "ar",
		viewport: mobile,
	},
	{
		name: "activity-en-desktop",
		scenario: "activity/long",
		locale: "en",
		viewport: desktop,
	},
	{
		name: "activity-ar-mobile",
		scenario: "activity/long",
		locale: "ar",
		viewport: mobile,
	},
	{
		name: "access-en-desktop",
		scenario: "access/generated-pin",
		locale: "en",
		viewport: desktop,
	},
	{
		name: "access-ar-mobile",
		scenario: "access/generated-pin",
		locale: "ar",
		viewport: mobile,
	},
	{
		name: "settings-en-desktop",
		scenario: "settings/dirty",
		locale: "en",
		viewport: desktop,
	},
	{
		name: "settings-ar-mobile",
		scenario: "settings/dirty",
		locale: "ar",
		viewport: mobile,
	},
];

function parseViewport(value: string | undefined): ReviewViewport {
	if (!value) return desktop;
	const match = /^(\d{3,4})x(\d{3,4})$/u.exec(value);
	if (!match)
		throw new Error("FITWAY_OWNER_REVIEW_VIEWPORT must be WIDTHxHEIGHT");
	const width = Number(match[1]);
	const height = Number(match[2]);
	if (width < 320 || height < 568) {
		throw new Error(
			"Owner review viewport is below the supported reflow floor",
		);
	}
	return { width, height };
}

function selectedCases(): readonly OwnerPresentationCase[] {
	const value = process.env.FITWAY_OWNER_REVIEW_SCENARIO;
	if (!value) return blockingCases;
	if (!isOwnerReviewScenario(value)) {
		throw new Error(`Unsupported Owner review scenario: ${value}`);
	}
	const locale = process.env.FITWAY_OWNER_REVIEW_LOCALE ?? "ar";
	if (locale !== "ar" && locale !== "en") {
		throw new Error("FITWAY_OWNER_REVIEW_LOCALE must be ar or en");
	}
	const viewport = parseViewport(process.env.FITWAY_OWNER_REVIEW_VIEWPORT);
	return [
		{
			name: `${value.replace("/", "-")}-${locale}-${viewport.width}x${viewport.height}`,
			scenario: value,
			locale,
			viewport,
		},
	];
}

async function setLocale(page: Page, locale: ReviewLocale) {
	if ((await page.locator("html").getAttribute("lang")) !== locale) {
		await page.locator(".owner-rail__language").click();
	}
	await expect(page.locator("html")).toHaveAttribute("lang", locale);
	await expect(page.locator("html")).toHaveAttribute(
		"dir",
		locale === "ar" ? "rtl" : "ltr",
	);
}

async function settle(page: Page) {
	await page.evaluate(() => document.fonts.ready);
	await page.locator(".owner-shell").waitFor({ state: "visible" });
	const panel = page.locator('[role="tabpanel"]:not([hidden])');
	if ((await panel.count()) > 0) {
		await expect(panel).toHaveCSS("opacity", "1");
	}
}

async function makeScenarioVisible(page: Page, scenario: OwnerReviewScenario) {
	if (scenario.startsWith("reports/csv-")) {
		await page.locator("[data-owner-reporting-export-start]").click();
		if (scenario === "reports/csv-abort") {
			await page.locator("[data-owner-reporting-export-abort]").click();
		}
		return;
	}
	if (scenario === "reports/invalid-range") {
		const start = page
			.locator("[data-owner-reporting-range] [data-owner-date-field]")
			.first();
		await start.getByRole("combobox").first().click();
		await page.getByRole("option").first().click();
		await page
			.locator("[data-owner-reporting-range] button[type='submit']")
			.click();
		return;
	}
	if (
		scenario === "access/generated-pin" ||
		scenario === "access/provisioning-refusal"
	) {
		await page.locator("[data-owner-access-staff-pin-primary]").click();
		return;
	}
	if (scenario.startsWith("settings/") && scenario !== "settings/loading") {
		const capacity = page.getByTestId("capacity");
		await capacity.fill(scenario === "settings/validation" ? "0" : "240");
		if (
			scenario === "settings/saving" ||
			scenario === "settings/saved" ||
			scenario === "settings/save-failure" ||
			scenario === "settings/conflict"
		) {
			await page
				.locator("button[type='submit'].owner-settings__save:visible")
				.click();
		}
		return;
	}
	if (scenario === "shell/back-forward") {
		// Section selection intentionally replaces the current URL, so establish a
		// genuine prior in-app entry before exercising browser history. This keeps
		// the review on the product's replace contract instead of returning to the
		// browser's initial blank document.
		await page.goto("/admin?section=history");
		const selectedTab = (section: string) =>
			page.locator(
				`[role="tab"][data-owner-section="${section}"][aria-selected="true"]`,
			);
		await expect(selectedTab("history")).toBeVisible();
		await page.locator('[role="tab"][data-owner-section="settings"]').click();
		await expect(page).toHaveURL(/[?&]section=settings(?:&|$)/u);
		await expect(selectedTab("settings")).toBeVisible();
		await page.goBack();
		await expect(page).toHaveURL(/[?&]section=daily(?:&|$)/u);
		await expect(selectedTab("daily")).toBeVisible();
		await page.goForward();
		await expect(page).toHaveURL(/[?&]section=settings(?:&|$)/u);
		await expect(selectedTab("settings")).toBeVisible();
		return;
	}
	if (scenario === "shell/rapid-retarget") {
		for (const name of [
			/Reports|التقارير/u,
			/Activity Log|سجل النشاط/u,
			/Settings|الإعدادات/u,
		]) {
			await page.getByRole("tab", { name }).dispatchEvent("pointerdown", {
				pointerType: "mouse",
				button: 0,
			});
			await page.getByRole("tab", { name }).click();
		}
		return;
	}
	if (scenario === "shell/locale-round-trip") {
		await page.locator(".owner-rail__language").click();
		await page.locator(".owner-rail__language").click();
	}
}

async function capture(page: Page, name: string) {
	const directory = process.env.FITWAY_PLAYWRIGHT_REVIEW_DIR;
	if (!directory) throw new Error("FITWAY_PLAYWRIGHT_REVIEW_DIR is required");
	await mkdir(directory, { recursive: true });
	await page.addStyleTag({
		content: ".operations-skip-link { display: none !important; }",
	});
	await page.screenshot({
		path: path.join(directory, `${name}.png`),
		fullPage: true,
	});
}

async function captureContactSheet(page: Page) {
	const directory = process.env.FITWAY_PLAYWRIGHT_REVIEW_DIR;
	if (!directory) throw new Error("FITWAY_PLAYWRIGHT_REVIEW_DIR is required");
	const files = [
		process.env.FITWAY_OWNER_REVIEW_REFERENCE,
		process.env.FITWAY_OWNER_REVIEW_BEFORE,
		process.env.FITWAY_OWNER_REVIEW_AFTER,
	];
	if (files.some((file) => !file)) {
		throw new Error(
			"Contact sheet requires reference, before, and after paths",
		);
	}
	const images = await Promise.all(
		files.map(async (file) => {
			const data = await readFile(path.resolve(file ?? ""));
			return `data:image/png;base64,${data.toString("base64")}`;
		}),
	);
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.setContent(`<!doctype html><style>
		body{margin:0;background:#0d090b;color:#fff;font:600 14px system-ui;padding:20px}
		main{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
		figure{margin:0;min-width:0}figcaption{padding:0 0 8px;color:#d8cbd0}
		img{display:block;width:100%;height:auto;border:1px solid #ffffff2e;border-radius:8px}
	</style><main>${["Reference", "Before", "After"]
		.map(
			(label, index) =>
				`<figure><figcaption>${label}</figcaption><img src="${images[index]}"></figure>`,
		)
		.join("")}</main>`);
	await Promise.all(
		page
			.locator("img")
			.all()
			.then((items) =>
				items.map((item) =>
					item.evaluate((image: HTMLImageElement) => image.decode()),
				),
			),
	);
	await mkdir(directory, { recursive: true });
	await page.screenshot({
		path: path.join(directory, "owner-reference-before-after.png"),
		fullPage: true,
	});
}

if (process.env.FITWAY_OWNER_REVIEW_CONTACT_SHEET === "true") {
	test("Owner reference/before/after contact sheet", async ({ page }) => {
		await captureContactSheet(page);
	});
} else {
	for (const reviewCase of selectedCases()) {
		test(`Owner presentation: ${reviewCase.name}`, async ({ page }) => {
			await page.clock.setFixedTime(new Date("2026-08-14T12:00:00.000Z"));
			await page.setViewportSize(reviewCase.viewport);
			await installOwnerReviewScenario(page, reviewCase.scenario);
			const section = ownerReviewSection(reviewCase.scenario);
			const target =
				reviewCase.scenario === "shell/session-failure"
					? "/admin"
					: `/admin?section=${section}`;
			await page.goto(target);
			if (reviewCase.scenario === "shell/session-failure") {
				await expect(page).toHaveURL(/\/login/u);
			} else {
				await setLocale(page, reviewCase.locale);
				if (process.env.FITWAY_OWNER_REVIEW_MOTION === "true") {
					await capture(page, `${reviewCase.name}-start`);
				}
				await makeScenarioVisible(page, reviewCase.scenario);
				if (process.env.FITWAY_OWNER_REVIEW_MOTION === "true") {
					await capture(page, `${reviewCase.name}-mid`);
				}
				await settle(page);
			}
			await capture(page, reviewCase.name);
			const overflow = await page.evaluate(() =>
				Math.max(
					document.documentElement.scrollWidth - window.innerWidth,
					document.body.scrollWidth - window.innerWidth,
				),
			);
			expect(overflow).toBeLessThanOrEqual(0);
			if (process.env.FITWAY_OWNER_REVIEW_INTERACTIVE === "true") {
				await page.pause();
			}
		});
	}
}
