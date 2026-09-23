// Renders exact concept frames for personal inspection. Concept-only; no production route is opened.
// Run from the repository root: node design-research/owner-composition-exploration-r04/concept/capture.mjs
import { createReadStream, statSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const evidence = path.join(here, "evidence");
const port = Number(process.env.CONCEPT_PORT ?? 3140);
const types = {
	".html": "text/html",
	".css": "text/css",
	".js": "text/javascript",
	".woff2": "font/woff2",
	".png": "image/png",
};

const server = http.createServer((request, response) => {
	const url = new URL(request.url, `http://127.0.0.1:${port}`);
	const file = path.resolve(root, `.${decodeURIComponent(url.pathname)}`);
	if (!file.startsWith(root)) return response.writeHead(403).end();
	try {
		if (!statSync(file).isFile()) throw new Error("not a file");
	} catch {
		return response.writeHead(404).end();
	}
	response.writeHead(200, {
		"content-type": types[path.extname(file)] ?? "application/octet-stream",
	});
	createReadStream(file).pipe(response);
});
await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
await mkdir(evidence, { recursive: true });

const base = `http://127.0.0.1:${port}/design-research/owner-composition-exploration-r04/concept/index.html`;
const frames = [];
for (const section of ["daily", "activity"]) {
	for (const lang of ["en", "ar"]) {
		frames.push({
			name: `${section}-${lang}-1440x900`,
			section,
			lang,
			width: 1440,
			height: 900,
		});
		frames.push({
			name: `${section}-${lang}-390x844`,
			section,
			lang,
			width: 390,
			height: 844,
		});
	}
}
frames.push({
	name: "daily-en-1440x900-gap",
	section: "daily",
	lang: "en",
	width: 1440,
	height: 900,
	state: "gap",
});
frames.push({
	name: "daily-ar-390x844-delayed",
	section: "daily",
	lang: "ar",
	width: 390,
	height: 844,
	state: "delayed",
});
frames.push({
	name: "daily-en-1440x900-selected",
	section: "daily",
	lang: "en",
	width: 1440,
	height: 900,
	select: "End",
});
frames.push({
	name: "daily-ar-390x844-full",
	section: "daily",
	lang: "ar",
	width: 390,
	height: 844,
	fullPage: true,
});

const browser = await chromium.launch({ headless: true });
const problems = [];
try {
	for (const frame of frames) {
		const page = await browser.newPage({
			viewport: { width: frame.width, height: frame.height },
		});
		page.on("pageerror", (error) =>
			problems.push(`${frame.name}: ${error.message}`),
		);
		page.on("console", (message) => {
			if (message.type() === "error")
				problems.push(`${frame.name}: console ${message.text()}`);
		});
		await page.goto(
			`${base}?lang=${frame.lang}&section=${frame.section}&state=${frame.state ?? "live"}&motion=off`,
		);
		await page.evaluate(() => document.fonts.ready);
		if (frame.select) {
			await page.focus(".stage__plot");
			await page.keyboard.press("Home");
			for (let i = 0; i < 22; i += 1)
				await page.keyboard.press(
					frame.lang === "ar" ? "ArrowLeft" : "ArrowRight",
				);
		}
		const facts = await page.evaluate(() => ({
			overflow:
				document.documentElement.scrollWidth -
				document.documentElement.clientWidth,
			cairo:
				document.fonts.check('700 16px "Cairo"') &&
				document.fonts.check('400 16px "Cairo"'),
			dir: document.documentElement.dir,
			valuetext:
				document
					.querySelector(".stage__plot")
					?.getAttribute("aria-valuetext") ?? null,
		}));
		if (facts.overflow > 0)
			problems.push(
				`${frame.name}: page overflows horizontally by ${facts.overflow}px`,
			);
		if (!facts.cairo) problems.push(`${frame.name}: Cairo did not load`);
		await page.screenshot({
			path: path.join(evidence, `${frame.name}.png`),
			fullPage: Boolean(frame.fullPage),
		});
		console.log(
			`${frame.name}: dir=${facts.dir} overflow=${facts.overflow} cairo=${facts.cairo}${facts.valuetext ? ` value="${facts.valuetext}"` : ""}`,
		);
		await page.close();
	}
} finally {
	await browser.close();
	server.close();
}
if (problems.length) {
	console.error(problems.join("\n"));
	process.exitCode = 1;
}
