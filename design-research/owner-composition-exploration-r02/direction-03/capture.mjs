import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const here = dirname(fileURLToPath(import.meta.url));
const output = join(here, "frames");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
const base = pathToFileURL(join(here, "index.html")).href;

async function capture(
	locale,
	width,
	height,
	name,
	{ fullPage = false, day = "populated", current = "fresh", zoom = 1 } = {},
) {
	const page = await browser.newPage({
		viewport: { width, height },
		deviceScaleFactor: 1,
		reducedMotion: "reduce",
	});
	await page.goto(`${base}?lang=${locale}&day=${day}&current=${current}`);
	await page.evaluate(async (z) => {
		document.documentElement.style.zoom = String(z);
		await document.fonts.ready;
	}, zoom);
	await page.screenshot({
		path: join(output, name),
		fullPage,
		animations: "disabled",
	});
	const result = await page.evaluate(() => ({
		viewport: innerWidth,
		scrollWidth: document.documentElement.scrollWidth,
		height: document.documentElement.scrollHeight,
		title: document.title,
		lang: document.documentElement.lang,
		dir: document.documentElement.dir,
		font: getComputedStyle(document.body).fontFamily,
		focusable: [...document.querySelectorAll("button,select,a,summary")].length,
		horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
		outliers: [...document.querySelectorAll("body *")]
			.filter((el) => {
				const r = el.getBoundingClientRect();
				return r.right > innerWidth + 1 || r.left < -1;
			})
			.slice(0, 12)
			.map((el) => ({
				tag: el.tagName,
				class: el.className,
				left: Math.round(el.getBoundingClientRect().left),
				right: Math.round(el.getBoundingClientRect().right),
			})),
	}));
	results.push({ file: name, ...result });
	await page.close();
}

for (const locale of ["en", "ar"]) {
	await capture(locale, 1440, 900, `${locale}-desktop-1440x900.png`);
	await capture(locale, 390, 844, `${locale}-mobile-390x844.png`);
	await capture(locale, 390, 844, `${locale}-mobile-full.png`, {
		fullPage: true,
	});
}
await capture("en", 640, 900, "en-reflow-320-200.png", {
	fullPage: true,
	zoom: 2,
});
await capture("ar", 640, 900, "ar-reflow-320-200.png", {
	fullPage: true,
	zoom: 2,
});
await capture("en", 390, 844, "en-closed-mobile.png", {
	fullPage: true,
	day: "closed",
	current: "closed",
});
await capture("ar", 390, 844, "ar-no-readings-mobile.png", {
	fullPage: true,
	day: "empty",
	current: "unavailable",
});
await capture("en", 390, 844, "en-loading-mobile.png", {
	fullPage: true,
	day: "loading",
	current: "loading",
});
await capture("ar", 390, 844, "ar-error-mobile.png", {
	fullPage: true,
	day: "error",
	current: "error",
});
for (const width of [320, 360, 390, 721, 768, 820, 1024, 1200, 1440]) {
	for (const locale of ["en", "ar"]) {
		const page = await browser.newPage({
			viewport: { width, height: 900 },
			reducedMotion: "reduce",
		});
		await page.goto(`${base}?lang=${locale}&day=populated&current=fresh`);
		const dims = await page.evaluate(() => ({
			viewport: innerWidth,
			scrollWidth: document.documentElement.scrollWidth,
			outliers: [...document.querySelectorAll("body *")]
				.filter((el) => {
					const r = el.getBoundingClientRect();
					return r.right > innerWidth + 1 || r.left < -1;
				})
				.slice(0, 12)
				.map((el) => ({
					tag: el.tagName,
					class: el.className,
					left: Math.round(el.getBoundingClientRect().left),
					right: Math.round(el.getBoundingClientRect().right),
				})),
		}));
		results.push({
			check: `${locale}-${width}`,
			horizontalOverflow: dims.scrollWidth > dims.viewport,
			...dims,
		});
		await page.close();
	}
}
const checkPage = await browser.newPage({
	viewport: { width: 390, height: 844 },
	reducedMotion: "reduce",
});
await checkPage.goto(`${base}?lang=en&day=populated&current=fresh`);
await checkPage.keyboard.press("Tab");
const focus = await checkPage.evaluate(() => ({
	tag: document.activeElement.tagName,
	outline: getComputedStyle(document.activeElement).outlineStyle,
}));
if (focus.tag !== "A" || focus.outline === "none")
	throw new Error("Keyboard focus is not visible on first control");
await checkPage.locator('[data-hour="12"]').click();
await checkPage.locator(".disclosure summary").click();
if ((await checkPage.locator(".minute-table tbody tr").count()) !== 60)
	throw new Error("Selected hour does not disclose 60 minute states");
if (
	(
		await checkPage.locator(".minute-table tbody tr").first().innerText()
	).includes("Missing")
)
	throw new Error("Genuine zero rendered as missing");
if (
	!(
		await checkPage.locator(".minute-table tbody tr").last().innerText()
	).includes("Missing")
)
	throw new Error("Missing minute rendered as observed");
await checkPage.locator("#current-state").selectOption("unavailable");
if ((await checkPage.locator(".current-main").innerText()).includes("18"))
	throw new Error("Unavailable current state retained a count");
await checkPage.locator("#language").click();
if ((await checkPage.evaluate(() => document.documentElement.dir)) !== "rtl")
	throw new Error("Language toggle did not switch direction");
results.push({
	interaction:
		"focus, 60-minute disclosure, zero/missing, unavailable fallback, RTL toggle",
	passed: true,
});
await checkPage.close();
await writeFile(
	join(output, "capture-results.json"),
	JSON.stringify(results, null, 2),
);
const names = results.filter((item) => item.file).map((item) => item.file);
const frames = [];
for (const name of names) {
	const bytes = await readFile(join(output, name));
	frames.push({
		file: name,
		bytes: bytes.length,
		sha256: createHash("sha256").update(bytes).digest("hex"),
	});
}
await writeFile(
	join(output, "manifest.json"),
	JSON.stringify(
		{
			status: "concept-only",
			captureRoute: "repository Playwright Chromium",
			viewports:
				"1440x900 desktop; 390x844 mobile; 320 CSS px at 200% zoom (640 physical); state mobile frames",
			inspectedBy: "direction-03 author",
			frames,
		},
		null,
		2,
	),
);
await browser.close();
if (results.some((x) => x.horizontalOverflow)) {
	console.error(results.filter((x) => x.horizontalOverflow));
	process.exitCode = 1;
} else
	console.log(
		"Captured exact frames; no document-level horizontal overflow at tested widths.",
	);
