import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const browser = await chromium.launch({ headless: true });
const base = "http://127.0.0.1:3114/";
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));

try {
	await page.goto(`${base}?section=daily&lang=en`);
	await page.locator("[data-hour='6']").click();
	assert.match(await page.locator(".signal-detail").innerText(), /No data/);
	assert.equal(
		await page.evaluate(() => document.activeElement?.dataset.hour),
		"6",
	);
	await page.locator("#workspaceButton").click();
	assert.equal(await page.locator("#menuLinks .menu-link").count(), 6);
	assert.equal(
		await page.locator("#workspaceButton").getAttribute("aria-expanded"),
		"true",
	);
	await page.keyboard.press("Escape");
	assert.equal(
		await page.locator("#workspaceButton").getAttribute("aria-expanded"),
		"false",
	);
	assert.equal(
		await page.evaluate(() => document.activeElement?.id),
		"workspaceButton",
	);
	await page.locator("#workspaceButton").click();
	await page.locator("#menuLinks [data-section='activity']").click();
	assert.match(await page.locator("h1").innerText(), /trace/);
	assert.equal(await page.locator(".event").count(), 3);
	assert.equal(
		await page.locator("[data-event='0']").getAttribute("aria-expanded"),
		"true",
	);
	await page.locator("[data-event='1']").click();
	assert.equal(
		await page.locator("[data-event='1']").getAttribute("aria-expanded"),
		"true",
	);
	assert.equal(
		await page.evaluate(() => document.activeElement?.dataset.event),
		"1",
	);
	await page.locator("[data-range='30']").click();
	assert.equal(await page.locator(".event").count(), 4);
	assert.match(await page.locator("#rangeFeedback").innerText(), /30 days/);
	assert.equal(
		await page.evaluate(() => document.activeElement?.dataset.range),
		"30",
	);
	await page.locator("#langButton").click();
	assert.equal(await page.locator("html").getAttribute("dir"), "rtl");
	assert.match(await page.locator("h1").innerText(), /لكل تغيير/);
	for (const language of ["en", "ar"]) {
		for (const section of ["daily", "activity"]) {
			await page.goto(`${base}?section=${section}&lang=${language}`);
			for (const width of [320, 390, 720, 1440]) {
				await page.setViewportSize({
					width,
					height: width === 1440 ? 900 : 844,
				});
				await page.evaluate(() => document.fonts.ready);
				const overflow = await page.evaluate(
					() => document.documentElement.scrollWidth - innerWidth,
				);
				assert.ok(
					overflow <= 1,
					`horizontal overflow ${overflow}px at ${language}/${section}/${width}`,
				);
			}
		}
	}
	const reduced = await browser.newPage({
		viewport: { width: 390, height: 844 },
		reducedMotion: "reduce",
	});
	await reduced.goto(`${base}?section=daily&lang=en`);
	await reduced.locator("[data-hour='4']").click();
	const duration = await reduced
		.locator(".selection-enter")
		.evaluate((el) => getComputedStyle(el).animationDuration);
	assert.equal(duration, "1e-06s");
	assert.equal(errors.length, 0, errors.join("\n"));
	console.log(
		"Direction 04 checks passed: switcher/Escape, bar detail/focus, event detail/focus, range feedback, RTL, 320/390/720/1440 reflow, reduced motion, no page errors.",
	);
	await reduced.close();
} finally {
	await page.close();
	await browser.close();
}
