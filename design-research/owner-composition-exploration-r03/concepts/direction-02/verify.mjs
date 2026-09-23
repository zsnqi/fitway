import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const browser = await chromium.launch({ headless: true });
const errors = [];
const base = "http://127.0.0.1:3112/";
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on("pageerror", (error) => errors.push(error.message));

try {
	await page.goto(base + "?section=daily&lang=en");
	await page.locator("[data-point='10']").click();
	assert.match(await page.locator(".plot-detail").innerText(), /54/);
	assert.equal(
		await page.evaluate(() => document.activeElement?.dataset.point),
		"10",
	);
	await page.locator("#menuBtn").click();
	assert.equal(await page.locator("#mobileNav .nav-link").count(), 6);
	assert.equal(
		await page.locator("#menuBtn").getAttribute("aria-expanded"),
		"true",
	);
	await page.locator("#mobileNav [data-section='log']").click();
	assert.match(await page.locator("h1").innerText(), /Every change/);
	assert.equal(await page.locator(".record").count(), 3);
	await page.locator("#scopeBtn").click();
	assert.equal(await page.locator(".record").count(), 4);
	assert.match(await page.locator("#scopeNote").innerText(), /30 days/);
	assert.equal(
		await page.evaluate(() => document.activeElement?.id),
		"scopeBtn",
	);
	await page.locator("#langBtn").click();
	assert.equal(await page.locator("html").getAttribute("dir"), "rtl");
	assert.match(await page.locator("h1").innerText(), /كل تغيير/);
	await page.locator("#menuBtn").click();
	await page.keyboard.press("Escape");
	assert.equal(
		await page.locator("#menuBtn").getAttribute("aria-expanded"),
		"false",
	);
	assert.equal(
		await page.evaluate(() => document.activeElement?.id),
		"menuBtn",
	);
	for (const language of ["en", "ar"]) {
		for (const section of ["daily", "log"]) {
			await page.goto(base + `?section=${section}&lang=${language}`);
			for (const width of [320, 390, 1440]) {
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
	await page.goto(base + "?section=daily&lang=ar");
	await page.setViewportSize({ width: 720, height: 900 });
	assert.ok(
		(await page.evaluate(
			() => document.documentElement.scrollWidth - innerWidth,
		)) <= 1,
		"1440px viewport at 200% reflow overflow",
	);
	const reduced = await browser.newPage({
		viewport: { width: 390, height: 844 },
		reducedMotion: "reduce",
	});
	await reduced.goto(base + "?section=daily&lang=en");
	await reduced.locator("[data-point='4']").click();
	const duration = await reduced
		.locator(".plot-detail")
		.evaluate((el) => getComputedStyle(el).animationDuration);
	assert.equal(duration, "1e-06s");
	assert.equal(errors.length, 0, errors.join("\n"));
	console.log(
		"Direction 02 checks passed: navigation, point detail/focus, scope feedback, RTL, Escape, 320/390/1440 overflow, 200% zoom, reduced motion, no page errors.",
	);
	await reduced.close();
} finally {
	await page.close();
	await browser.close();
}
