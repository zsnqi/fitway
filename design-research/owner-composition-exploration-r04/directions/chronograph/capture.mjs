// Chronograph concept capture. Serves this folder on 127.0.0.1:3162 and captures desktop frames
// with Playwright (deviceScaleFactor 1, reducedMotion "reduce") into ./evidence.
// Run from PowerShell:  node capture.mjs
// Playwright is resolved from this worktree first; set FITWAY_PLAYWRIGHT_FROM to a directory whose
// node_modules holds @playwright/test when this worktree has none installed.
import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { existsSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
const PORT = 3162;
const HOST = "127.0.0.1";
const outDir = join(here, "evidence");

function resolvePlaywright() {
  const candidates = [here];
  if (process.env.FITWAY_PLAYWRIGHT_FROM) candidates.push(process.env.FITWAY_PLAYWRIGHT_FROM);
  candidates.push("D:/Projects/fitway-worktrees/owner-design-exploration-r04");
  for (const base of candidates) {
    try {
      const req = createRequire(join(base, "package.json"));
      return { path: req.resolve("@playwright/test"), base };
    } catch {}
  }
  throw new Error("@playwright/test not found; run pnpm install --frozen-lockfile or set FITWAY_PLAYWRIGHT_FROM");
}

const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml" };
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${HOST}:${PORT}`);
    let p = normalize(decodeURIComponent(url.pathname)).replace(/^([\\/])+/, "");
    if (!p) p = "index.html";
    const file = join(here, p);
    if (!file.startsWith(here) || !existsSync(file)) { res.writeHead(404); res.end("not found"); return; }
    res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream", "cache-control": "no-store" });
    res.end(await readFile(file));
  } catch (e) { res.writeHead(500); res.end(String(e)); }
});

const frames = [
  { name: "daily-en-1440x900", q: "?lang=en" },
  { name: "daily-ar-1440x900", q: "?lang=ar" },
  { name: "history-en-1440x900", q: "?lang=en&section=history" },
  { name: "history-ar-1440x900", q: "?lang=ar&section=history" },
  { name: "daily-en-1440x900-delayed", q: "?lang=en&state=delayed" },
  { name: "daily-ar-1440x900-delayed", q: "?lang=ar&state=delayed" },
  { name: "daily-en-1440x900-keyboard", q: "?lang=en", keyboard: true },
  // Self-inspection extras (below-the-fold and truthful states).
  { name: "extra-daily-en-1440-fullpage", q: "?lang=en", full: true },
  { name: "extra-daily-ar-1440-fullpage", q: "?lang=ar", full: true },
  { name: "extra-history-en-1440-fullpage", q: "?lang=en&section=history", full: true },
  { name: "extra-history-ar-1440-fullpage", q: "?lang=ar&section=history", full: true },
  { name: "extra-daily-ar-1440x900-keyboard", q: "?lang=ar", keyboard: true },
  { name: "extra-daily-en-1440x900-closed", q: "?lang=en&state=closed" },
  { name: "extra-daily-ar-1440x900-empty", q: "?lang=ar&state=empty" },
  { name: "extra-daily-en-1440x900-loading", q: "?lang=en&state=loading" },
  { name: "extra-daily-ar-1440x900-error", q: "?lang=ar&state=error" },
  { name: "extra-access-ar-1440x900", q: "?lang=ar&section=access" },
];
const overflowOnly = [
  { name: "daily-en-1280x800", q: "?lang=en" },
  { name: "daily-ar-1280x800", q: "?lang=ar" },
  { name: "history-en-1280x800", q: "?lang=en&section=history" },
  { name: "history-ar-1280x800", q: "?lang=ar&section=history" },
];

async function measure(page) {
  return page.evaluate(async () => {
    await document.fonts.ready;
    const faces = [...document.fonts].filter((f) => f.family.replace(/"/g, "") === "Readex Pro");
    return {
      fontsCheckLatin: document.fonts.check('300 16px "Readex Pro"') && document.fonts.check('500 16px "Readex Pro"'),
      fontsCheckArabic: document.fonts.check('500 16px "Readex Pro"', "مباشر"),
      readexFacesLoaded: faces.filter((f) => f.status === "loaded").length,
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
}

async function main() {
  const pw = resolvePlaywright();
  const mod = await import(pathToFileURL(pw.path).href);
  const chromium = mod.chromium || (mod.default && mod.default.chromium);
  await mkdir(outDir, { recursive: true });
  await new Promise((r) => server.listen(PORT, HOST, r));
  const browser = await chromium.launch();
  const log = { playwrightFrom: pw.base, frames: [], overflowOnly: [] };

  async function open(viewport, q) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
    page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
    await page.goto(`http://${HOST}:${PORT}/index.html${q}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    return { context, page, errors };
  }

  for (const fr of frames) {
    const { context, page, errors } = await open({ width: 1440, height: 900 }, fr.q);
    if (fr.keyboard) {
      for (let i = 0; i < 30; i++) {
        await page.keyboard.press("Tab");
        if (await page.evaluate(() => document.activeElement && document.activeElement.id === "dial")) break;
      }
      // Home = opening (6:00 AM), PageDown = +60 min, Shift+later = +10 min  ->  7:20 AM, the morning bump.
      const later = fr.q.includes("lang=ar") ? "ArrowLeft" : "ArrowRight";
      await page.keyboard.press("Home");
      await page.keyboard.press("PageDown");
      await page.keyboard.press(`Shift+${later}`);
      await page.keyboard.press(`Shift+${later}`);
    }
    const m = await measure(page);
    await page.screenshot({ path: join(outDir, fr.name + ".png"), fullPage: !!fr.full });
    const extra = fr.keyboard ? await page.evaluate(() => ({ focused: document.activeElement && document.activeElement.id, hub: document.getElementById("hub").innerText.replace(/\s+/g, " ") })) : undefined;
    log.frames.push({ frame: fr.name, ...m, errors, ...(extra ? { keyboard: extra } : {}) });
    await context.close();
  }
  for (const fr of overflowOnly) {
    const { context, page, errors } = await open({ width: 1280, height: 800 }, fr.q);
    const m = await measure(page);
    log.overflowOnly.push({ check: fr.name, ...m, errors });
    await context.close();
  }
  await browser.close();
  server.close();
  await writeFile(join(outDir, "capture-log.json"), JSON.stringify(log, null, 2));
  for (const f of log.frames) console.log(`${f.frame}: overflowX=${f.overflowX} fonts(latin=${f.fontsCheckLatin}, arabic=${f.fontsCheckArabic}, faces=${f.readexFacesLoaded}) errors=${f.errors.length}${f.keyboard ? " keyboard=" + JSON.stringify(f.keyboard) : ""}`);
  for (const f of log.overflowOnly) console.log(`${f.check}: overflowX=${f.overflowX} errors=${f.errors.length}`);
}

main().catch((e) => { console.error(e); server.close(); process.exit(1); });
