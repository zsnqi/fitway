// Floodlight capture: serves this folder on 127.0.0.1:3161 and writes the
// required 1440x900 frames to ./evidence with a per-frame log.
// Run from PowerShell:  node capture.mjs
// Optional: INSPECT_DIR=<dir> also writes full-page and extra-state frames there.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3161;
const HOST = "127.0.0.1";
const OUT = path.join(HERE, "evidence");
const INSPECT = process.env.INSPECT_DIR || "";

async function loadPlaywright() {
	try {
		return await import("@playwright/test");
	} catch {}
	// This folder may sit in a worktree without node_modules; fall back to a
	// prepared FITWAY checkout (FITWAY_ROOT, or the r04 exploration worktree).
	const roots = [process.env.FITWAY_ROOT, "D:/Projects/fitway-worktrees/owner-design-exploration-r04"].filter(Boolean);
	for (const r of roots) {
		try {
			return createRequire(path.join(r, "package.json"))("@playwright/test");
		} catch {}
	}
	throw new Error("Could not resolve @playwright/test. Run pnpm install --frozen-lockfile or set FITWAY_ROOT.");
}

const TYPES = {
	".html": "text/html; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".mjs": "text/javascript; charset=utf-8",
	".png": "image/png",
	".svg": "image/svg+xml",
};
const server = http.createServer((req, res) => {
	const url = new URL(req.url, `http://${HOST}:${PORT}`);
	let p = decodeURIComponent(url.pathname);
	if (p === "/") p = "/index.html";
	const file = path.join(HERE, p);
	if (!file.startsWith(HERE) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
		res.writeHead(404);
		res.end("not found");
		return;
	}
	res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream", "cache-control": "no-store" });
	fs.createReadStream(file).pipe(res);
});

const FRAMES = [
	{ name: "daily-en-1440x900", q: "lang=en&section=daily" },
	{ name: "daily-ar-1440x900", q: "lang=ar&section=daily" },
	{ name: "history-en-1440x900", q: "lang=en&section=history" },
	{ name: "history-ar-1440x900", q: "lang=ar&section=history" },
	{ name: "daily-en-1440x900-delayed", q: "lang=en&section=daily&state=delayed" },
	{ name: "daily-ar-1440x900-delayed", q: "lang=ar&section=daily&state=delayed" },
	{ name: "daily-en-1440x900-keyboard", q: "lang=en&section=daily", keyboard: { presses: ["ArrowLeft", 8] } },
];
const EXTRA = [
	{ name: "x-daily-ar-full", q: "lang=ar&section=daily", full: true },
	{ name: "x-daily-en-full", q: "lang=en&section=daily", full: true },
	{ name: "x-history-ar-full", q: "lang=ar&section=history", full: true },
	{ name: "x-history-en-full", q: "lang=en&section=history", full: true },
	{ name: "x-daily-ar-delayed-full", q: "lang=ar&section=daily&state=delayed", full: true },
	{ name: "x-daily-ar-closed", q: "lang=ar&section=daily&state=closed" },
	{ name: "x-daily-en-empty", q: "lang=en&section=daily&state=empty" },
	{ name: "x-daily-ar-loading", q: "lang=ar&section=daily&state=loading" },
	{ name: "x-daily-en-error", q: "lang=en&section=daily&state=error" },
	{ name: "x-access-ar", q: "lang=ar&section=access" },
	{ name: "x-settings-en", q: "lang=en&section=settings" },
	{ name: "x-daily-ar-keyboard", q: "lang=ar&section=daily", keyboard: { presses: ["ArrowRight", 30] } },
	{ name: "x-history-ar-keyboard", q: "lang=ar&section=history", heatKeys: ["ArrowDown", "ArrowDown", "ArrowRight", "ArrowRight", "ArrowRight", "ArrowRight"] },
];
const OVERFLOW_ONLY = [
	{ name: "overflow-daily-en-1280x800", q: "lang=en&section=daily", w: 1280, h: 800 },
	{ name: "overflow-daily-ar-1280x800", q: "lang=ar&section=daily", w: 1280, h: 800 },
	{ name: "overflow-history-en-1280x800", q: "lang=en&section=history", w: 1280, h: 800 },
	{ name: "overflow-history-ar-1280x800", q: "lang=ar&section=history", w: 1280, h: 800 },
];

async function run() {
	await new Promise((r) => server.listen(PORT, HOST, r));
	const { chromium } = await loadPlaywright();
	const browser = await chromium.launch();
	fs.mkdirSync(OUT, { recursive: true });
	if (INSPECT) fs.mkdirSync(INSPECT, { recursive: true });
	const log = [];

	async function shoot(f, dir) {
		const w = f.w || 1440;
		const h = f.h || 900;
		const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, reducedMotion: "reduce" });
		const page = await ctx.newPage();
		const errors = [];
		page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
		page.on("console", (m) => {
			if (m.type() === "error") errors.push(`console: ${m.text()}`);
		});
		await page.goto(`http://${HOST}:${PORT}/?${f.q}`, { waitUntil: "networkidle" });
		await page.waitForSelector("html[data-ready='1']", { timeout: 15000 });
		await page.evaluate(() => document.fonts.ready);
		if (f.keyboard) {
			for (let i = 0; i < 40; i++) {
				await page.keyboard.press("Tab");
				if (await page.evaluate(() => document.activeElement && document.activeElement.id === "chart")) break;
			}
			const [key, n] = f.keyboard.presses;
			for (let i = 0; i < n; i++) await page.keyboard.press(key);
			await page.waitForTimeout(400);
		}
		if (f.heatKeys) {
			for (let i = 0; i < 60; i++) {
				await page.keyboard.press("Tab");
				if (await page.evaluate(() => document.activeElement && document.activeElement.classList.contains("cell"))) break;
			}
			for (const k of f.heatKeys) await page.keyboard.press(k);
			await page.waitForTimeout(200);
		}
		const info = await page.evaluate(() => {
			const el = document.scrollingElement || document.documentElement;
			const faces = [...document.fonts].filter((x) => x.status === "loaded").map((x) => `${x.family.replace(/"/g, "")} ${x.weight}`);
			return {
				overflowX: el.scrollWidth - el.clientWidth,
				fontsChanga: document.fonts.check('600 16px "Changa"', "عربي") && faces.some((x) => x.startsWith("Changa")),
				fontsBigShoulders: document.fonts.check('800 40px "Big Shoulders Display"', "0123") && faces.some((x) => x.startsWith("Big Shoulders Display")),
				loadedFaces: [...new Set(faces)].sort(),
				active: document.activeElement ? document.activeElement.id || document.activeElement.className : null,
				chartValue: document.getElementById("chart")?.getAttribute("aria-valuetext") || null,
			};
		});
		let file = null;
		if (dir) {
			file = path.join(dir, `${f.name}.png`);
			await page.screenshot({ path: file, fullPage: !!f.full });
		}
		log.push({ frame: f.name, viewport: `${w}x${h}`, url: `/?${f.q}`, file: file ? path.relative(HERE, file) : null, ...info, errors });
		await ctx.close();
	}

	for (const f of FRAMES) await shoot(f, OUT);
	for (const f of OVERFLOW_ONLY) await shoot(f, null);
	if (INSPECT) for (const f of EXTRA) await shoot(f, INSPECT);

	await browser.close();
	server.close();
	fs.writeFileSync(path.join(OUT, "capture-log.json"), `${JSON.stringify(log, null, 2)}\n`);
	for (const r of log)
		console.log(
			`${r.frame.padEnd(34)} overflowX=${r.overflowX} changa=${r.fontsChanga} bigShoulders=${r.fontsBigShoulders} errors=${r.errors.length}${r.chartValue ? ` sel="${r.chartValue}"` : ""}${r.errors.length ? `\n   ${r.errors.join("\n   ")}` : ""}`,
		);
}

run().catch((e) => {
	console.error(e);
	server.close();
	process.exit(1);
});
