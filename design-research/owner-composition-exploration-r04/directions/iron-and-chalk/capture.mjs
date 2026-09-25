// Renders exact Iron & Chalk concept frames for personal inspection. Concept-only; no production
// route is opened and no credential is used. Run from the repository root:
//   node design-research/owner-composition-exploration-r04/directions/iron-and-chalk/capture.mjs
// `--serve` only serves this folder on loopback for interactive Browser review.
import { createReadStream, statSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const evidence = path.join(here, "evidence");
const port = Number(process.env.CONCEPT_PORT ?? 3152);
const types = {
	".html": "text/html; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".png": "image/png",
};

const server = http.createServer((request, response) => {
	const url = new URL(request.url, `http://127.0.0.1:${port}`);
	const relative = decodeURIComponent(url.pathname).replace(/^\/+/, "") || "index.html";
	const file = path.resolve(here, relative);
	if (!file.startsWith(here)) return response.writeHead(403).end();
	try {
		if (!statSync(file).isFile()) throw new Error("not a file");
	} catch {
		return response.writeHead(404).end();
	}
	response.writeHead(200, {
		"content-type": types[path.extname(file)] ?? "application/octet-stream",
		"cache-control": "no-store",
	});
	createReadStream(file).pipe(response);
});
await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));

if (process.argv.includes("--serve")) {
	console.log(`Iron & Chalk concept served at http://127.0.0.1:${port}/index.html`);
} else {
	const { chromium } = await import("@playwright/test");
	await mkdir(evidence, { recursive: true });
	const base = `http://127.0.0.1:${port}/index.html`;
	const frames = [];
	for (const section of ["daily", "history"]) {
		for (const lang of ["en", "ar"]) {
			frames.push({ name: `${section}-${lang}-1440x900`, section, lang, width: 1440, height: 900 });
			frames.push({ name: `${section}-${lang}-390x844`, section, lang, width: 390, height: 844 });
		}
	}
	frames.push({ name: "daily-en-1440x900-delayed", section: "daily", lang: "en", width: 1440, height: 900, query: "state=delayed" });
	frames.push({ name: "daily-ar-390x844-delayed", section: "daily", lang: "ar", width: 390, height: 844, query: "state=delayed" });
	frames.push({ name: "daily-ar-1440x900-selected", section: "daily", lang: "ar", width: 1440, height: 900, query: "select=740" });
	frames.push({ name: "daily-en-390x844-selected", section: "daily", lang: "en", width: 390, height: 844, query: "select=503" });
	frames.push({ name: "daily-en-1440x900-closed", section: "daily", lang: "en", width: 1440, height: 900, query: "state=closed" });
	frames.push({ name: "history-ar-1440x900-closedcell", section: "history", lang: "ar", width: 1440, height: 900, query: "cell=5,3" });
	frames.push({ name: "access-en-1440x900", section: "access", lang: "en", width: 1440, height: 900 });
	frames.push({ name: "daily-en-390x844-full", section: "daily", lang: "en", width: 390, height: 844, fullPage: true });
	frames.push({ name: "history-ar-390x844-full", section: "history", lang: "ar", width: 390, height: 844, fullPage: true });

	const browser = await chromium.launch();
	const report = [];
	try {
		for (const frame of frames) {
			const context = await browser.newContext({
				viewport: { width: frame.width, height: frame.height },
				deviceScaleFactor: 1,
				reducedMotion: "reduce",
			});
			const page = await context.newPage();
			const errors = [];
			page.on("pageerror", (error) => errors.push(String(error)));
			page.on("console", (message) => {
				if (message.type() === "error") errors.push(message.text());
			});
			const query = `lang=${frame.lang}&section=${frame.section}${frame.query ? `&${frame.query}` : ""}`;
			await page.goto(`${base}?${query}`, { waitUntil: "networkidle" });
			await page.waitForSelector(".page:not([hidden]) > *");
			const probe = await page.evaluate(() => ({
				archivo: document.fonts.check('700 16px "Archivo"'),
				kufi: document.fonts.check('700 16px "Noto Kufi Arabic"', "ع"),
				overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
				dir: document.documentElement.dir,
			}));
			await page.screenshot({ path: path.join(evidence, `${frame.name}.png`), fullPage: Boolean(frame.fullPage) });
			report.push({ frame: frame.name, ...probe, errors });
			await context.close();
		}
	} finally {
		await browser.close();
		server.close();
	}
	for (const row of report) console.log(JSON.stringify(row));
}
