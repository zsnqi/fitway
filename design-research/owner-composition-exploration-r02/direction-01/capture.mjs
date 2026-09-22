import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const here = path.dirname(fileURLToPath(import.meta.url));
const frames = path.join(here, "frames");
await mkdir(frames, { recursive: true });
const browser = await chromium.launch({ headless: true });
const frameRecords = [];
const checks = [];
const widths = [320, 360, 390, 721, 768, 820, 1024, 1200, 1440];
const states = [
	"populated",
	"current",
	"closed",
	"noReadings",
	"loading",
	"error",
];
const url = (lang, state) =>
	`${pathToFileURL(path.join(here, "index.html")).href}?lang=${lang}&state=${state}`;

async function inspect(page, label) {
	const result = await page.evaluate(() => ({
		viewport: innerWidth,
		documentWidth: document.documentElement.scrollWidth,
		bodyWidth: document.body.scrollWidth,
		lang: document.documentElement.lang,
		dir: document.documentElement.dir,
		h1: document.querySelector("h1")?.textContent,
		current: document.querySelector("#current-reading")?.textContent,
		source: document.querySelector("#current-source")?.textContent,
		fontReady: document.fonts.status === "loaded",
	}));
	checks.push({ label, ...result });
	if (
		result.documentWidth > result.viewport + 1 ||
		result.bodyWidth > result.viewport + 1
	) {
		throw new Error(
			`Horizontal overflow at ${label}: document ${result.documentWidth}, viewport ${result.viewport}`,
		);
	}
}
async function shot(lang, state, width, height, name, fullPage = false) {
	const page = await browser.newPage({
		viewport: { width, height },
		reducedMotion: "reduce",
	});
	await page.goto(url(lang, state));
	await page.evaluate(() => document.fonts.ready);
	await inspect(page, name);
	await page.screenshot({
		path: path.join(frames, name),
		fullPage,
		animations: "disabled",
	});
	frameRecords.push({
		file: `frames/${name}`,
		lang,
		state,
		viewport: `${width}x${height}`,
		fullPage,
	});
	await page.close();
}

try {
	for (const lang of ["en", "ar"]) {
		for (const width of widths) {
			const page = await browser.newPage({
				viewport: { width, height: width <= 390 ? 844 : 900 },
				reducedMotion: "reduce",
			});
			await page.goto(url(lang, "populated"));
			await page.evaluate(() => document.fonts.ready);
			await inspect(page, `${lang}-populated-${width}`);
			await page.close();
		}
	}
	for (const lang of ["en", "ar"]) {
		await shot(lang, "populated", 1440, 900, `${lang}-desktop-1440x900.png`);
		await shot(lang, "populated", 390, 844, `${lang}-mobile-390x844.png`);
		await shot(lang, "populated", 390, 844, `${lang}-mobile-full.png`, true);
	}
	for (const state of states.filter((s) => s !== "populated")) {
		await shot("en", state, 390, 844, `en-${state}-mobile-390x844.png`);
		await shot("ar", state, 390, 844, `ar-${state}-mobile-390x844.png`);
	}
	for (const lang of ["en", "ar"]) {
		const reflow = await browser.newPage({
			viewport: { width: 640, height: 1000 },
			reducedMotion: "reduce",
		});
		await reflow.goto(url(lang, "populated"));
		await reflow.evaluate(() => {
			document.body.style.zoom = "2";
		});
		const zoomResult = await reflow.evaluate(() => {
			const brand = document.querySelector(".brand").getBoundingClientRect();
			const control = document
				.querySelector(".language-button")
				.getBoundingClientRect();
			return {
				viewport: innerWidth,
				width: document.documentElement.scrollWidth,
				body: document.body.scrollWidth,
				zoom: getComputedStyle(document.body).zoom,
				brandControlOverlap: !(
					brand.right <= control.left || control.right <= brand.left
				),
			};
		});
		checks.push({
			label: `${lang}-320-effective-at-200-percent`,
			...zoomResult,
		});
		if (zoomResult.body > 320 || zoomResult.brandControlOverlap)
			throw new Error(`200% reflow failed in ${lang}`);
		const name = `${lang}-reflow-320-at-200-percent.png`;
		await reflow.screenshot({
			path: path.join(frames, name),
			animations: "disabled",
		});
		frameRecords.push({
			file: `frames/${name}`,
			lang,
			state: "populated",
			viewport: "640x1000",
			zoom: "200%",
			effectiveCssWidth: 320,
		});
		await reflow.close();
	}

	const focus = await browser.newPage({
		viewport: { width: 390, height: 844 },
		reducedMotion: "reduce",
	});
	await focus.goto(url("ar", "populated"));
	await focus.keyboard.press("Tab");
	const skipFocused = await focus.evaluate(() =>
		document.activeElement?.classList.contains("skip"),
	);
	await focus.locator(".chart-region g[role=button]").first().focus();
	const pointDetail = await focus.locator("#point-note").textContent();
	await focus.locator("#table-disclosure summary").focus();
	await focus.keyboard.press("Enter");
	const tableOpened = await focus
		.locator("#table-disclosure")
		.evaluate((el) => el.open);
	const indicatorGap = await focus.locator(".select-shell").evaluate((el) => {
		const select = el.querySelector("select");
		const icon = el.querySelector("svg");
		const s = select.getBoundingClientRect();
		const i = icon.getBoundingClientRect();
		return {
			selectLeft: s.left,
			iconLeft: i.left,
			iconBorderGap: i.left - s.left,
		};
	});
	checks.push({
		label: "keyboard-and-rtl-control",
		skipFocused,
		pointDetail,
		tableOpened,
		indicatorGap,
	});
	if (!skipFocused || !tableOpened || indicatorGap.iconBorderGap < 8)
		throw new Error("Keyboard or RTL indicator check failed");
	await focus.close();
	await writeFile(
		path.join(here, "frame-manifest.json"),
		JSON.stringify(
			{
				capturedWith: "local Playwright Chromium; reduced motion; file URL",
				frames: frameRecords,
				checks,
			},
			null,
			2,
		) + "\n",
	);
	console.log(
		`Captured ${frameRecords.length} frames; ${checks.length} checks passed.`,
	);
} finally {
	await browser.close();
}
