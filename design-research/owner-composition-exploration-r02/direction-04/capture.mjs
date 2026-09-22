import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const here = path.dirname(fileURLToPath(import.meta.url));
const frames = path.join(here, "frames");
await mkdir(frames, { recursive: true });
const url = pathToFileURL(path.join(here, "index.html")).href;
const browser = await chromium.launch({ headless: true });
const failures = [];
const inspected = [];

async function open(page, lang, state = "populated") {
	await page.goto(`${url}?lang=${lang}&state=${state}`);
	await page.evaluate(() => document.fonts.ready);
	await page.waitForTimeout(100);
	const ready = await page.locator(".folio").isVisible();
	if (!ready) failures.push(`${lang}/${state}: folio missing`);
}
async function overflow(page, label) {
	const data = await page.evaluate(() => ({
		scroll: document.documentElement.scrollWidth,
		client: document.documentElement.clientWidth,
		body: document.body.scrollWidth,
	}));
	if (data.scroll > data.client + 1 || data.body > data.client + 1)
		failures.push(`${label}: horizontal overflow ${JSON.stringify(data)}`);
}
try {
	for (const lang of ["en", "ar"]) {
		for (const [width, height, name] of [
			[1440, 900, "desktop-1440x900"],
			[390, 844, "mobile-390x844"],
		]) {
			const page = await browser.newPage({
				viewport: { width, height },
				deviceScaleFactor: 1,
				reducedMotion: "reduce",
			});
			await open(page, lang);
			if (
				(await page.locator("html").getAttribute("dir")) !==
				(lang === "ar" ? "rtl" : "ltr")
			)
				failures.push(`${lang}/${name}: direction`);
			await overflow(page, `${lang}/${name}`);
			const file = path.join(frames, `${lang}-${name}-populated.png`);
			await page.screenshot({ path: file });
			inspected.push(path.basename(file));
			if (width === 390) {
				const full = path.join(frames, `${lang}-mobile-390-full-populated.png`);
				await page.screenshot({ path: full, fullPage: true });
				inspected.push(path.basename(full));
				await page.locator('[data-question="1"]').click();
				if (
					(await page
						.locator('[data-question="1"]')
						.getAttribute("aria-expanded")) !== "true"
				)
					failures.push(`${lang}: question did not open`);
				if (
					(await page
						.locator('[data-question="0"]')
						.getAttribute("aria-expanded")) !== "false"
				)
					failures.push(`${lang}: previous question stayed open`);
				await page.locator("#table-toggle").click();
				if (!(await page.locator("#reading-table").isVisible()))
					failures.push(`${lang}: semantic table did not open`);
			}
			await page.close();
		}
		for (const width of [320, 360, 721, 768, 820, 1024, 1200]) {
			const page = await browser.newPage({
				viewport: { width, height: 900 },
				reducedMotion: "reduce",
			});
			await open(page, lang);
			await overflow(page, `${lang}/${width}`);
			await page.close();
		}
		// A 320 CSS px layout rasterized at 2x represents the 200% zoom reflow target.
		const reflow = await browser.newPage({
			viewport: { width: 320, height: 450 },
			deviceScaleFactor: 2,
			reducedMotion: "reduce",
		});
		await open(reflow, lang);
		await overflow(reflow, `${lang}/320-css-200pct`);
		const reflowFile = path.join(frames, `${lang}-reflow-320css-200pct.png`);
		await reflow.screenshot({ path: reflowFile, fullPage: true });
		inspected.push(path.basename(reflowFile));
		await reflow.close();
		for (const state of [
			"closed",
			"no-readings",
			"loading",
			"error",
			"stale",
			"unavailable",
		]) {
			const page = await browser.newPage({
				viewport: { width: 390, height: 844 },
				reducedMotion: "reduce",
			});
			await open(page, lang, state);
			await overflow(page, `${lang}/${state}`);
			const current = await page.locator(".now-context").count();
			if (
				["closed", "loading", "error", "unavailable", "no-readings"].includes(
					state,
				) &&
				current
			)
				failures.push(`${lang}/${state}: current count displayed`);
			if (
				state === "stale" &&
				!(await page.locator(".now-context").innerText()).includes(
					lang === "ar" ? "آخر قيمة" : "last known",
				)
			)
				failures.push(`${lang}/stale: last-known label missing`);
			if (state === "no-readings" && (await page.locator(".timeline").count()))
				failures.push(`${lang}/no-readings: chart displayed`);
			if (
				[
					"closed",
					"no-readings",
					"loading",
					"error",
					"stale",
					"unavailable",
				].includes(state)
			) {
				const file = path.join(frames, `${lang}-mobile-390-${state}.png`);
				await page.screenshot({ path: file });
				inspected.push(path.basename(file));
			}
			await page.close();
		}
	}
	const keyboard = await browser.newPage({
		viewport: { width: 390, height: 844 },
	});
	await open(keyboard, "en");
	await keyboard.keyboard.press("Tab");
	if ((await keyboard.locator(":focus").getAttribute("class")) !== "skip")
		failures.push("keyboard: skip link is not first focus");
	await keyboard.locator('[data-question="2"]').focus();
	await keyboard.keyboard.press("Enter");
	if (
		(await keyboard
			.locator('[data-question="2"]')
			.getAttribute("aria-expanded")) !== "true"
	)
		failures.push("keyboard: question does not activate by Enter");
	await keyboard.close();
} finally {
	await browser.close();
}
const frameRecords = await Promise.all(
	inspected.map(async (name) => ({
		path: `frames/${name}`,
		sha256: createHash("sha256")
			.update(await readFile(path.join(frames, name)))
			.digest("hex"),
	})),
);
await writeFile(
	path.join(here, "manifest.json"),
	`${JSON.stringify(
		{
			title: "The Black Folio / الملف المفتوح",
			status: "CONCEPT_ONLY",
			authority: "NONE",
			data: "deterministic illustrative fixtures, no network calls",
			captureTool: "repository @playwright/test Chromium",
			desktopViewport: "1440x900 CSS px",
			mobileViewport: "390x844 CSS px",
			reflow: "320 CSS px rasterized at 2x device scale",
			checkedWidths: [320, 360, 390, 721, 768, 820, 1024, 1200, 1440],
			checkedLocales: ["en LTR", "ar RTL"],
			checkedStates: [
				"populated",
				"closed",
				"no-readings",
				"loading",
				"error",
				"stale",
				"unavailable",
			],
			programmaticFailures: failures,
			frames: frameRecords,
		},
		null,
		2,
	)}\n`,
);
console.log(JSON.stringify({ failures, inspected }, null, 2));
if (failures.length) process.exitCode = 1;
