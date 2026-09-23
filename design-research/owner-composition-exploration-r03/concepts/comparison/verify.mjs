import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const base =
	process.env.FITWAY_COMPARISON_BASE ??
	"http://127.0.0.1:3115/design-research/owner-composition-exploration-r03/concepts/comparison/index.html";
const browser = await chromium.launch({ headless: true });
const pageErrors = [];

try {
	for (const lang of ["en", "ar"]) {
		for (const surface of ["daily", "governance"]) {
			for (const size of ["desktop", "mobile"]) {
				const width = size === "desktop" ? 1440 : 390;
				const height = size === "desktop" ? 900 : 844;
				const page = await browser.newPage({ viewport: { width, height } });
				page.on("pageerror", (error) => pageErrors.push(error.message));
				const url = new URL(base);
				url.search = new URLSearchParams({
					lang,
					surface,
					size,
					baseline: "activity",
				}).toString();
				await page.goto(url.toString(), { waitUntil: "networkidle" });
				await page.evaluate(async () => {
					await document.fonts.ready;
					for (const img of document.images) img.loading = "eager";
					await Promise.all([...document.images].map((img) => img.decode()));
				});
				const state = await page.evaluate(() => ({
					lang: document.documentElement.lang,
					dir: document.documentElement.dir,
					overflow: document.documentElement.scrollWidth - innerWidth,
					images: [...document.images].map((img) => ({
						width: img.naturalWidth,
						height: img.naturalHeight,
						alt: img.alt,
					})),
					links: [...document.querySelectorAll("a.open")].map((a) => a.href),
				}));
				assert.equal(state.lang, lang);
				assert.equal(state.dir, lang === "ar" ? "rtl" : "ltr");
				assert.ok(
					state.overflow <= 1,
					`document overflow ${state.overflow} at ${lang}/${surface}/${size}`,
				);
				assert.equal(state.images.length, 5);
				assert.ok(
					state.images.every(
						(img) =>
							img.width === width &&
							img.height === height &&
							img.alt.includes(lang.toUpperCase()),
					),
					`bad image in ${lang}/${surface}/${size}`,
				);
				assert.equal(state.links.length, 4);
				assert.ok(state.links.every((link) => link.includes(`lang=${lang}`)));
				await page.close();
			}
		}
	}
	const page = await browser.newPage({ viewport: { width: 320, height: 844 } });
	page.on("pageerror", (error) => pageErrors.push(error.message));
	await page.goto(
		`${base}?lang=ar&surface=governance&size=mobile&baseline=activity`,
		{ waitUntil: "networkidle" },
	);
	await page.locator("#currentGovernance").selectOption("reports");
	assert.match(
		await page.locator(".card.current .surface").innerText(),
		/التقارير/,
	);
	assert.match(
		await page.locator(".card.current .frame-wrap").getAttribute("href"),
		/current-reports-ar-390x844\.png$/,
	);
	assert.ok(
		(await page.evaluate(
			() => document.documentElement.scrollWidth - innerWidth,
		)) <= 1,
	);
	assert.equal(pageErrors.length, 0, pageErrors.join("\n"));
	await page.close();
	console.log(
		"Comparison checks passed: all 8 EN/AR Daily/governance desktop/mobile combinations, five exact images and links each, RTL, baseline selector, 320px reflow, no page errors.",
	);
} finally {
	await browser.close();
}
