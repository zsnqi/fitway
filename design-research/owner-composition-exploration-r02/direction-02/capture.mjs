import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const modulePath = process.env.FITWAY_PLAYWRIGHT_MODULE;
const { chromium } = await import(
	modulePath ? pathToFileURL(modulePath).href : "playwright"
);
const root = process.cwd();
const base = "http://127.0.0.1:8765/index.html";
const folder = path.join(root, "frames");
await mkdir(folder, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
const cases = [
	{
		name: "dayline-en-desktop-1440x900.png",
		lang: "en",
		width: 1440,
		height: 900,
	},
	{
		name: "dayline-ar-desktop-1440x900.png",
		lang: "ar",
		width: 1440,
		height: 900,
	},
	{
		name: "dayline-en-mobile-390x844.png",
		lang: "en",
		width: 390,
		height: 844,
	},
	{
		name: "dayline-ar-mobile-390x844.png",
		lang: "ar",
		width: 390,
		height: 844,
	},
	{
		name: "dayline-en-mobile-full-390.png",
		lang: "en",
		width: 390,
		height: 844,
		fullPage: true,
	},
	{
		name: "dayline-ar-mobile-full-390.png",
		lang: "ar",
		width: 390,
		height: 844,
		fullPage: true,
	},
	{
		name: "dayline-ar-reflow-320-200pct.png",
		lang: "ar",
		width: 320,
		height: 844,
		dpr: 2,
		fullPage: true,
	},
	{
		name: "dayline-en-stale-desktop-1440x900.png",
		lang: "en",
		width: 1440,
		height: 900,
		snapshot: "stale",
	},
	{
		name: "dayline-ar-closed-mobile-390x844.png",
		lang: "ar",
		width: 390,
		height: 844,
		daily: "closed",
		snapshot: "closed",
	},
	{
		name: "dayline-en-no-readings-mobile-390x844.png",
		lang: "en",
		width: 390,
		height: 844,
		daily: "no-readings",
		snapshot: "unavailable",
	},
	{
		name: "dayline-en-loading-mobile-390x844.png",
		lang: "en",
		width: 390,
		height: 844,
		daily: "loading",
		snapshot: "loading",
	},
	{
		name: "dayline-ar-error-mobile-390x844.png",
		lang: "ar",
		width: 390,
		height: 844,
		daily: "error",
		snapshot: "error",
	},
];
for (const item of cases) {
	const page = await browser.newPage({
		viewport: { width: item.width, height: item.height },
		deviceScaleFactor: item.dpr ?? 1,
		reducedMotion: "reduce",
	});
	const query = new URLSearchParams({
		lang: item.lang,
		daily: item.daily ?? "populated",
		snapshot: item.snapshot ?? "current",
	});
	await page.goto(`${base}?${query}`, { waitUntil: "networkidle" });
	await page.evaluate(() => document.fonts.ready);
	await page.screenshot({
		path: path.join(folder, item.name),
		fullPage: !!item.fullPage,
		animations: "disabled",
	});
	const values = await page.evaluate(() => ({
		title: document.title,
		dir: document.documentElement.dir,
		scrollWidth: document.documentElement.scrollWidth,
		clientWidth: document.documentElement.clientWidth,
		font: getComputedStyle(document.querySelector("h1")).fontFamily,
		heading: document.querySelector("h1")?.textContent,
		dayMode: document.querySelector(".day-stage")?.dataset.mode,
		bodyText: document.body.innerText.slice(0, 400),
	}));
	results.push({ name: item.name, ...values });
	await page.close();
}
for (const width of [320, 360, 390, 721, 768, 820, 1024, 1200, 1440]) {
	for (const lang of ["en", "ar"]) {
		const page = await browser.newPage({
			viewport: { width, height: 900 },
			deviceScaleFactor: 1,
			reducedMotion: "reduce",
		});
		await page.goto(`${base}?lang=${lang}`, { waitUntil: "networkidle" });
		const metrics = await page.evaluate(() => ({
			scrollWidth: document.documentElement.scrollWidth,
			clientWidth: document.documentElement.clientWidth,
		}));
		results.push({
			width,
			lang,
			...metrics,
			overflow: metrics.scrollWidth > metrics.clientWidth,
		});
		await page.close();
	}
}
const interaction = await browser.newPage({
	viewport: { width: 390, height: 844 },
	reducedMotion: "reduce",
});
await interaction.goto(`${base}?lang=en&daily=populated&snapshot=current`, {
	waitUntil: "networkidle",
});
await interaction.keyboard.press("Tab");
const firstFocus = await interaction.evaluate(() => ({
	tag: document.activeElement.tagName,
	text: document.activeElement.textContent?.trim(),
}));
await interaction.locator(".plot-point").first().focus();
const pointFocus = await interaction.evaluate(() => ({
	tag: document.activeElement.tagName,
	outline: getComputedStyle(document.activeElement).outlineStyle,
	label: document.activeElement.getAttribute("aria-label"),
}));
await interaction.keyboard.press("Enter");
const dockAfterPoint = await interaction.locator("#detail-dock").innerText();
await interaction.locator("#records-disclosure summary").click();
const tableVisible = await interaction.locator(".table-region").isVisible();
await interaction.locator("#language-button").click();
const switched = await interaction.evaluate(() => ({
	lang: document.documentElement.lang,
	dir: document.documentElement.dir,
	heading: document.querySelector("h1")?.textContent,
}));
await interaction.close();
results.push({
	interaction: {
		firstFocus,
		pointFocus,
		dockAfterPoint,
		tableVisible,
		switched,
	},
});
await writeFile(
	path.join(folder, "capture-results.json"),
	JSON.stringify(results, null, 2),
);
await browser.close();
console.log(
	JSON.stringify(
		results.map((r) => ({
			name: r.name,
			width: r.width,
			lang: r.lang,
			overflow: r.overflow,
			scrollWidth: r.scrollWidth,
			clientWidth: r.clientWidth,
			heading: r.heading,
			dayMode: r.dayMode,
		})),
		null,
		2,
	),
);
