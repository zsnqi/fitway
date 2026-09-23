import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "../../../../node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs";

const folder = path.dirname(fileURLToPath(import.meta.url));
const evidence = path.join(folder, "evidence");
const base =
	"http://127.0.0.1:3111/design-research/owner-composition-exploration-r03/concepts/direction-01/index.html";
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ headless: true });
const problems = [];
for (const [view, label] of [
	["daily", "daily"],
	["activity", "activity-log"],
]) {
	for (const lang of ["en", "ar"]) {
		for (const [width, height] of [
			[1440, 900],
			[390, 844],
			[320, 700],
		]) {
			const page = await browser.newPage({
				viewport: { width, height },
				deviceScaleFactor: 1,
				reducedMotion: "reduce",
			});
			page.on("pageerror", (error) =>
				problems.push(`${view}/${lang}/${width}: ${error.message}`),
			);
			page.on("response", (response) => {
				if (response.status() >= 400)
					problems.push(
						`${view}/${lang}/${width}: HTTP ${response.status()} ${response.url()}`,
					);
			});
			await page.goto(`${base}?view=${view}&lang=${lang}`, {
				waitUntil: "networkidle",
			});
			await page.evaluate(() => document.fonts.ready);
			await page.locator("h1").waitFor();
			const dir = await page.locator("html").getAttribute("dir");
			const overflow = await page.evaluate(
				() => document.documentElement.scrollWidth - innerWidth,
			);
			const heading = await page.locator("h1").innerText();
			const skip = await page.locator(".skip").innerText();
			if (skip !== (lang === "ar" ? "تجاوز إلى المحتوى" : "Skip to content"))
				problems.push(`${view}/${lang}/${width}: skip link not localized`);
			if (width <= 390) {
				const languageSize = await page.locator("#language").boundingBox();
				if (languageSize.width < 44 || languageSize.height < 44)
					problems.push(`${view}/${lang}/${width}: language target below 44px`);
			}
			if (view === "daily") {
				if (width <= 390) {
					const stateSize = await page.locator("#reading-state").boundingBox();
					if (stateSize.width < 44 || stateSize.height < 44)
						problems.push(`${view}/${lang}/${width}: state target below 44px`);
				}
				const targets = await page.locator(".chart-hit").evaluateAll((nodes) =>
					nodes.map((node) => {
						const box = node.getBoundingClientRect();
						return { x: box.x, y: box.y, width: box.width, height: box.height };
					}),
				);
				if (targets.length !== (width <= 390 ? 5 : 14))
					problems.push(
						`${view}/${lang}/${width}: unexpected chart target count ${targets.length}`,
					);
				for (let i = 0; i < targets.length; i++) {
					if (targets[i].width < 44 || targets[i].height < 44)
						problems.push(
							`${view}/${lang}/${width}: chart target ${i} below 44px`,
						);
					for (let j = i + 1; j < targets.length; j++) {
						const a = targets[i];
						const b = targets[j];
						const overlapX =
							Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
						const overlapY =
							Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
						if (overlapX > 0.5 && overlapY > 0.5)
							problems.push(
								`${view}/${lang}/${width}: chart targets ${i}/${j} overlap`,
							);
					}
				}
				console.log(
					`${lang}/${width} chart targets: ${targets.length}, minimum ${Math.min(...targets.map((v) => v.width)).toFixed(1)}px`,
				);
			}
			const file = path.join(
				evidence,
				`${label}-${lang}-${width}x${height}.png`,
			);
			await page.screenshot({
				path: file,
				fullPage: false,
				animations: "disabled",
			});
			console.log(
				`${path.basename(file)} heading=${heading} dir=${dir} overflow=${overflow}`,
			);
			if (overflow > 1)
				problems.push(
					`${view}/${lang}/${width}: document overflow ${overflow}px`,
				);
			if (dir !== (lang === "ar" ? "rtl" : "ltr"))
				problems.push(`${view}/${lang}/${width}: direction mismatch`);
			await page.close();
		}
	}
}
const page = await browser.newPage({
	viewport: { width: 390, height: 844 },
	reducedMotion: "reduce",
});
await page.goto(`${base}?view=daily&lang=en`, { waitUntil: "networkidle" });
await page.locator('[data-point="9"]').click();
if (!(await page.locator(".selected-reading").innerText()).includes("15:00"))
	problems.push("chart point selection did not update detail");
await page.locator('[data-point="6"]').focus();
await page.keyboard.press("Enter");
if (!(await page.locator(".selected-reading").innerText()).includes("12:00"))
	problems.push("keyboard chart point selection did not update detail");
await page.locator("#reading-state").selectOption("delayed");
if (!(await page.locator(".current-meta").innerText()).includes("last-known"))
	problems.push("delayed state lacks last-known qualifier");
await page.locator("#reading-state").selectOption("closed");
if (await page.locator(".readout-number").count())
	problems.push("closed state retains count");
await page.locator("#reading-state").selectOption("error");
if (await page.locator(".readout-number").count())
	problems.push("error state retains count");
await page.locator("#retry-preview").click();
if (!(await page.locator(".current-meta").innerText()).includes("open"))
	problems.push("retry feedback did not restore preview reading");
await page.locator('[data-view="activity"]').click();
await page.locator('[data-filter="access"]').click();
if ((await page.locator(".record").count()) !== 2)
	problems.push("access filter returned wrong records");
await page.locator(".record").first().click();
if (!(await page.locator(".record-detail").innerText()).includes("PIN"))
	problems.push("record detail not revealed");
await page.locator("#language").click();
if ((await page.locator("html").getAttribute("dir")) !== "rtl")
	problems.push("language toggle did not switch to RTL");
const anim = await page
	.locator(".view")
	.evaluate((el) => getComputedStyle(el).animationName);
if (anim !== "none")
	problems.push(`reduced motion still animates view: ${anim}`);
console.log(
	"Interaction check:",
	problems.length ? problems.join(" | ") : "PASS",
);
await page.close();
console.log(
	"320/390/1440 reflow and target checks:",
	problems.length ? problems.join(" | ") : "PASS",
);
await browser.close();
if (problems.length) process.exitCode = 1;
