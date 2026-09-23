import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const browser = await chromium.launch({ headless: true });
const base = "http://127.0.0.1:3114/";
const evidenceDir = path.join(
	path.dirname(fileURLToPath(import.meta.url)),
	"evidence",
);
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
const externalRequests = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("request", (request) => {
	if (!request.url().startsWith(base)) externalRequests.push(request.url());
});

try {
	await page.goto(`${base}?section=daily&lang=en`);
	await page.keyboard.press("Tab");
	assert.ok(
		await page
			.locator(".skip")
			.evaluate((node) => node === document.activeElement),
	);
	await page.locator(".hour-choice[data-hour='6']").click();
	assert.match(await page.locator(".signal-detail").innerText(), /No data/);
	assert.equal(
		await page.evaluate(() => document.activeElement?.dataset.hour),
		"6",
	);
	await page.keyboard.press("Tab");
	assert.equal(
		await page.evaluate(() => document.activeElement?.dataset.hour),
		"7",
	);
	await page.keyboard.press("Enter");
	assert.match(await page.locator(".signal-detail").innerText(), /13:00.*29/s);
	await page.locator("#workspaceButton").click();
	assert.equal(await page.locator("#menuLinks .menu-link").count(), 6);
	const closeBox = await page.locator("#closeMenu").boundingBox();
	assert.ok(closeBox.width >= 44 && closeBox.height >= 44);
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
	assert.equal(
		await page.locator("#menuLinks").getAttribute("aria-label"),
		"أقسام مساحة المالك",
	);
	assert.equal(
		await page.locator("#langButton").getAttribute("aria-label"),
		"التبديل إلى الإنجليزية",
	);
	for (const language of ["en", "ar"]) {
		for (const section of ["daily", "activity"]) {
			for (const width of [320, 390, 720, 1440]) {
				await page.setViewportSize({
					width,
					height: width === 1440 ? 900 : 844,
				});
				await page.goto(`${base}?section=${section}&lang=${language}`);
				await page.evaluate(() => document.fonts.ready);
				assert.equal(
					await page.locator("#menuLinks").getAttribute("aria-label"),
					language === "ar" ? "أقسام مساحة المالك" : "Owner workspace sections",
				);
				assert.match(
					await page.locator("#demoFlag").innerText(),
					language === "ar" ? /توضيحية/ : /ILLUSTRATIVE/,
				);
				if (
					language === "ar" &&
					section === "daily" &&
					[390, 1440].includes(width)
				) {
					assert.equal(await page.locator("html").getAttribute("dir"), "rtl");
					assert.equal(
						await page.locator(".big-ratio bdi").getAttribute("dir"),
						"ltr",
					);
					assert.equal(
						await page.locator(".big-ratio bdi").innerText(),
						"11/12",
					);
					assert.equal(
						await page
							.locator(".evidence-item:nth-child(2) bdi")
							.getAttribute("dir"),
						"ltr",
					);
					assert.equal(
						await page.locator(".evidence-item:nth-child(2) bdi").innerText(),
						"660 / 720",
					);
				}
				const overflow = await page.evaluate(
					() => document.documentElement.scrollWidth - innerWidth,
				);
				assert.ok(
					overflow <= 1,
					`horizontal overflow ${overflow}px at ${language}/${section}/${width}`,
				);
				if (width <= 720) {
					const langBox = await page.locator("#langButton").boundingBox();
					assert.ok(
						langBox.width >= 44 && langBox.height >= 44,
						`language target ${langBox.width}×${langBox.height}`,
					);
					if (section === "daily") {
						assert.equal(
							await page.locator(".mobile-bars .mobile-bar").count(),
							12,
						);
						assert.ok(
							await page
								.locator(".mobile-bars .mobile-bar")
								.nth(6)
								.evaluate((node) => node.classList.contains("missing")),
						);
						assert.match(
							await page
								.locator(".hour-choice[data-hour='0']")
								.getAttribute("aria-label"),
							language === "ar" ? /0 شخصًا/ : /0 approximate/,
						);
						assert.match(
							await page
								.locator(".hour-choice[data-hour='6']")
								.getAttribute("aria-label"),
							language === "ar" ? /لا بيانات/ : /No data/,
						);
						const targets = await page
							.locator(".hour-selector")
							.evaluate((group) => {
								const boxes = [...group.querySelectorAll(".hour-choice")].map(
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
								const selected = group
									.querySelector('[aria-pressed="true"]')
									.getBoundingClientRect();
								const area = group.getBoundingClientRect();
								return {
									boxes,
									scrollWidth: group.scrollWidth,
									clientWidth: group.clientWidth,
									selectedVisible:
										selected.left >= area.left - 1 &&
										selected.right <= area.right + 1,
								};
							});
						assert.equal(targets.boxes.length, 12);
						assert.ok(
							targets.selectedVisible,
							`selected hour not visible at ${language}/${width}`,
						);
						for (let i = 0; i < targets.boxes.length; i++) {
							const a = targets.boxes[i];
							assert.ok(
								a.width >= 44 && a.height >= 44,
								`hour ${i} target ${a.width}×${a.height} at ${language}/${width}`,
							);
							for (let j = i + 1; j < targets.boxes.length; j++) {
								const b = targets.boxes[j];
								assert.ok(
									a.right <= b.left ||
										b.right <= a.left ||
										a.bottom <= b.top ||
										b.bottom <= a.top,
									`hour targets ${i}/${j} overlap at ${language}/${width}`,
								);
							}
						}
						if (width <= 390)
							assert.ok(targets.scrollWidth > targets.clientWidth);
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
				if (section === "daily") {
					await page
						.locator(
							`${width <= 720 ? ".hour-choice" : ".bar-slot"}[data-hour='6']`,
						)
						.click();
					assert.match(
						await page.locator(".signal-detail").innerText(),
						language === "ar" ? /لا بيانات/ : /No data/,
					);
					assert.equal(
						await page.evaluate(() => document.activeElement?.dataset.hour),
						"6",
					);
				}
				if (width <= 720) {
					await page.locator("#workspaceButton").click();
					const closeTarget = await page.locator("#closeMenu").boundingBox();
					assert.ok(
						closeTarget.width >= 44 && closeTarget.height >= 44,
						`close target ${closeTarget.width}×${closeTarget.height} at ${language}/${width}`,
					);
					await page.locator("#closeMenu").click();
					assert.equal(
						await page
							.locator("#workspaceButton")
							.getAttribute("aria-expanded"),
						"false",
					);
					assert.equal(
						await page.evaluate(() => document.activeElement?.id),
						"workspaceButton",
					);
				}
			}
		}
	}
	const reduced = await browser.newPage({
		viewport: { width: 390, height: 844 },
		reducedMotion: "reduce",
	});
	await reduced.goto(`${base}?section=daily&lang=en`);
	await reduced.locator(".hour-choice[data-hour='4']").click();
	const duration = await reduced
		.locator(".selection-enter")
		.evaluate((el) => getComputedStyle(el).animationDuration);
	assert.equal(duration, "1e-06s");
	assert.equal(errors.length, 0, errors.join("\n"));
	assert.equal(externalRequests.length, 0, externalRequests.join("\n"));
	console.log(
		"Direction 04 checks passed: switcher/Escape, non-overlapping 48px hour targets, keyboard detail/focus, event detail/focus, range feedback, localized labels, RTL, 320/390/720/1440 reflow, reduced motion, exact frames, no external requests or page errors.",
	);
	await reduced.close();
} finally {
	await page.close();
	await browser.close();
}
