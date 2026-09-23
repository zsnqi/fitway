import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const browser = await chromium.launch({ headless: true });
const errors = [];
const base = process.env.FITWAY_DIRECTION_02_BASE ?? "http://127.0.0.1:3112/";
const evidenceDir = path.join(
	path.dirname(fileURLToPath(import.meta.url)),
	"evidence",
);
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on("pageerror", (error) => errors.push(error.message));

try {
	await page.goto(`${base}?section=daily&lang=en`);
	await page.keyboard.press("Tab");
	assert.ok(
		await page
			.locator(".skip-link")
			.evaluate((node) => node === document.activeElement),
		"skip link is first in keyboard order",
	);
	await page.locator("[data-point='10']").click();
	assert.match(await page.locator(".plot-detail").innerText(), /54/);
	assert.equal(
		await page.evaluate(() => document.activeElement?.dataset.point),
		"10",
	);
	await page.keyboard.press("Tab");
	assert.equal(
		await page.evaluate(() => document.activeElement?.dataset.point),
		"11",
	);
	await page.keyboard.press("Enter");
	assert.match(await page.locator(".plot-detail").innerText(), /17:00.*41/s);
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
			await page.goto(`${base}?section=${section}&lang=${language}`);
			assert.equal(
				await page.locator(".skip-link").innerText(),
				language === "ar" ? "تخطَّ إلى المحتوى" : "Skip to content",
			);
			assert.equal(
				await page.locator("#desktopNav").getAttribute("aria-label"),
				language === "ar" ? "أقسام مساحة المالك" : "Owner sections",
			);
			assert.equal(
				await page.locator("#mobileNav").getAttribute("aria-label"),
				language === "ar" ? "أقسام مساحة المالك" : "Owner sections",
			);
			assert.equal(
				await page.locator(".rail").getAttribute("aria-label"),
				language === "ar" ? "مساحة مالك FITWAY" : "FITWAY Owner workspace",
			);
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
				if (width <= 720) {
					for (const selector of ["#langBtn", "#menuBtn"]) {
						const box = await page.locator(selector).boundingBox();
						assert.ok(
							box.width >= 44 && box.height >= 44,
							`${selector} ${box.width}×${box.height} at ${width}`,
						);
					}
					if (section === "daily") {
						const metrics = await page
							.locator(".plot-body")
							.evaluate((plot) => {
								const boxes = [...plot.querySelectorAll(".plot-column")].map(
									(node) => {
										const r = node.getBoundingClientRect();
										return {
											left: r.left,
											right: r.right,
											top: r.top,
											bottom: r.bottom,
											width: r.width,
											height: r.height,
										};
									},
								);
								return {
									boxes,
									clientWidth: plot.clientWidth,
									scrollWidth: plot.scrollWidth,
								};
							});
						assert.equal(metrics.boxes.length, 12);
						assert.equal(
							await page.locator(".plot-overview .overview-cell").count(),
							12,
						);
						assert.ok(
							await page
								.locator(".plot-overview .overview-cell")
								.nth(6)
								.evaluate((node) => node.classList.contains("missing")),
						);
						for (let i = 0; i < metrics.boxes.length; i++) {
							const a = metrics.boxes[i];
							assert.ok(
								a.width >= 44 && a.height >= 44,
								`point ${i} ${a.width}×${a.height} at ${language}/${width}`,
							);
							for (let j = i + 1; j < metrics.boxes.length; j++) {
								const b = metrics.boxes[j];
								assert.ok(
									a.right <= b.left ||
										b.right <= a.left ||
										a.bottom <= b.top ||
										b.bottom <= a.top,
									`points ${i}/${j} overlap at ${language}/${width}`,
								);
							}
						}
						if (width <= 390)
							assert.ok(
								metrics.scrollWidth > metrics.clientWidth,
								`chart should scroll at ${width}`,
							);
					}
				}
				if (width === 390 || width === 1440) {
					await page.screenshot({
						path: path.join(
							evidenceDir,
							`${section}-${language}-${width}x${width === 1440 ? 900 : 844}.png`,
						),
					});
				}
			}
		}
	}
	await page.goto(`${base}?section=daily&lang=ar`);
	await page.setViewportSize({ width: 720, height: 900 });
	assert.ok(
		(await page.evaluate(
			() => document.documentElement.scrollWidth - innerWidth,
		)) <= 1,
		"1440px viewport at 200% reflow overflow",
	);
	assert.equal(
		await page.locator("#langBtn").getAttribute("aria-label"),
		"التبديل إلى الإنجليزية",
	);
	await page.setViewportSize({ width: 390, height: 844 });
	await page.locator("[data-point='11']").focus();
	assert.equal(
		await page.evaluate(() => document.activeElement?.dataset.point),
		"11",
	);
	const focusVisible = await page.locator(".plot-body").evaluate((plot) => {
		const area = plot.getBoundingClientRect();
		const point = plot
			.querySelector("[data-point='11']")
			.getBoundingClientRect();
		return point.left >= area.left - 1 && point.right <= area.right + 1;
	});
	assert.ok(
		focusVisible,
		"focused final point remains visible in scroll region",
	);
	const reduced = await browser.newPage({
		viewport: { width: 390, height: 844 },
		reducedMotion: "reduce",
	});
	await reduced.goto(`${base}?section=daily&lang=en`);
	await reduced.locator("[data-point='4']").click();
	const duration = await reduced
		.locator(".plot-detail")
		.evaluate((el) => getComputedStyle(el).animationDuration);
	assert.equal(duration, "1e-06s");
	assert.equal(errors.length, 0, errors.join("\n"));
	console.log(
		"Direction 02 checks passed: navigation, 44px targets without overlap, full-day overview/missing gap, point detail/focus, scope feedback, localized landmarks, RTL, Escape, 320/390/720/1440 reflow, reduced motion, exact evidence frames, no page errors.",
	);
	await reduced.close();
} finally {
	await page.close();
	await browser.close();
}
