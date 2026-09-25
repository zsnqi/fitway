// Backlight concept capture: serves this folder on 127.0.0.1:3171 and records frames with Playwright
// (chromium, deviceScaleFactor 1, reducedMotion "reduce"). Desktop 1440x900 only in this round.
// Run from PowerShell at the worktree root:
//   node design-research/owner-composition-exploration-r04/directions/backlight/capture.mjs
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "evidence");
const PORT = 3171;
const ORIGIN = `http://127.0.0.1:${PORT}`;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".json": "application/json",
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", ORIGIN);
  const path = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const file = normalize(join(HERE, path));
  if (!file.startsWith(HERE + sep)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream", "cache-control": "no-store" });
    res.end(body);
  } catch {
    res.writeHead(404).end("not found");
  }
});
await new Promise((resolve) => server.listen(PORT, "127.0.0.1", resolve));

const REQUIRED = [
  { name: "daily-ar-1440x900", q: "lang=ar" },
  { name: "daily-en-1440x900", q: "lang=en" },
  { name: "daily-ar-1440x900-inspect", q: "lang=ar", act: "keyboard-peak" },
  { name: "daily-en-1440x900-inspect", q: "lang=en", act: "hover-peak" },
  { name: "daily-ar-1440x900-rail-open", q: "lang=ar", act: "rail-open" },
  { name: "daily-en-1440x900-rail-open", q: "lang=en", act: "rail-open" },
  { name: "daily-ar-1440x900-delayed", q: "lang=ar&state=delayed" },
  { name: "daily-en-1440x900-delayed", q: "lang=en&state=delayed" },
  { name: "daily-ar-1440x900-nohistory", q: "lang=ar&state=nohistory" },
  { name: "daily-ar-1440x900-details", q: "lang=ar", act: "details", full: true },
  { name: "daily-ar-1440x900-focusname", q: "lang=ar", act: "focus-name" },
];
const EXTRA = [
  { name: "extra-daily-en-1440x900-details", q: "lang=en", act: "details", full: true },
  { name: "extra-daily-en-1440x900-nohistory", q: "lang=en&state=nohistory" },
  { name: "extra-daily-ar-1440x900-closed", q: "lang=ar&state=closed" },
  { name: "extra-daily-en-1440x900-closed", q: "lang=en&state=closed" },
  { name: "extra-daily-ar-1440x900-loading", q: "lang=ar&state=loading" },
  { name: "extra-daily-en-1440x900-loading", q: "lang=en&state=loading" },
  { name: "extra-daily-en-1440x900-focusname", q: "lang=en", act: "focus-name" },
  { name: "extra-daily-en-1440x900-inspect-gap", q: "lang=en", act: "hover-gap" },
  { name: "extra-daily-ar-1440x900-motion-off", q: "lang=ar&motion=off" },
  { name: "extra-daily-en-1440x900-rail-hover", q: "lang=en", act: "rail-hover" },
];
const OVERFLOW_ONLY = [
  { name: "daily-en-1280x800", q: "lang=en" },
  { name: "daily-ar-1280x800", q: "lang=ar" },
  { name: "daily-en-1280x800-rail-open", q: "lang=en", act: "rail-open" },
  { name: "daily-ar-1280x800-rail-open", q: "lang=ar", act: "rail-open" },
];

const FACES = [
  ['400 16px "Alexandria"', "مرحبا"],
  ['400 16px "Alexandria"', "Hello"],
  ['500 16px "Alexandria"', "مرحبا"],
  ['500 16px "Alexandria"', "0123"],
  ['600 16px "Alexandria"', "FITWAY"],
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const log = [];

async function act(page, frame) {
  const lang = frame.q.includes("lang=en") ? "en" : "ar";
  if (frame.act === "rail-open") {
    await page.click("#brand");
    await page.mouse.move(700, 880);
  }
  if (frame.act === "details") {
    await page.click("#details-btn");
    await page.mouse.move(700, 10);
    // Full-page capture from the top so the fixed rail and light sit where a reader first sees them.
    await page.evaluate(() => window.scrollTo(0, 0));
  }
  if (frame.act === "focus-name") {
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
      if (await page.evaluate(() => document.activeElement?.dataset?.nav === "reports")) break;
    }
  }
  if (frame.act === "keyboard-peak") {
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press("Tab");
      if (await page.evaluate(() => document.activeElement?.id === "plot-hit")) break;
    }
    await page.keyboard.press("End");
    const { latestIndex, peakIndex } = await page.evaluate(() => window.__backlight);
    const earlier = lang === "ar" ? "ArrowRight" : "ArrowLeft";
    for (let i = 0; i < latestIndex - peakIndex; i++) await page.keyboard.press(earlier);
  }
  if (frame.act === "hover-peak") {
    const pt = await page.evaluate(() => window.__backlight.pointClient(window.__backlight.peakIndex));
    await page.mouse.move(pt.x, pt.y);
  }
  if (frame.act === "rail-hover") {
    // Pointer hover on a rail icon: a state on the icon only, no name tooltip.
    await page.hover('[data-nav="reports"]');
  }
  if (frame.act === "hover-gap") {
    // Hover 2:20 PM (minute 500), inside the missing span.
    const pt = await page.evaluate(() => window.__backlight.minuteClient(500));
    await page.mouse.move(pt.x, pt.y);
  }
}

async function shoot(frame, { width, height, screenshot = true }) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: "reduce", colorScheme: "dark" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });
  await page.goto(`${ORIGIN}/index.html?${frame.q}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__backlight?.ready === true);
  await page.evaluate(() => document.fonts.ready);
  await act(page, frame);
  await page.waitForTimeout(200);
  const result = await page.evaluate((faces) => {
    const el = document.documentElement;
    const fonts = Object.fromEntries(faces.map(([spec, sample]) => [`${spec} ${/[a-z]/i.test(sample) ? "latin" : /\d/.test(sample) ? "digits" : "arabic"}`, document.fonts.check(spec, sample)]));
    const loaded = [...document.fonts].filter((f) => f.status === "loaded").map((f) => `${f.family.replace(/"/g, "")} ${f.weight} ${/U\+0*600-/i.test(f.unicodeRange) ? "arabic" : /U\+0*0-0*FF\b/i.test(f.unicodeRange) ? "latin" : "other"}`);
    const b = window.__backlight;
    const text = document.body.innerText;
    return {
      fonts,
      loadedFaces: [...new Set(loaded)].sort(),
      overflowX: el.scrollWidth - el.clientWidth,
      dir: el.dir,
      active: document.activeElement?.id || document.activeElement?.dataset?.nav || document.activeElement?.tagName,
      valuetext: document.getElementById("plot-hit")?.getAttribute("aria-valuetext") ?? null,
      railExpanded: document.getElementById("brand").getAttribute("aria-expanded"),
      easternDigits: /[\u0660-\u0669\u06F0-\u06F9]/.test(text),
      enDashInArabic: el.lang === "ar" && /\u2013/.test(text),
      figures: b.figures,
      checks: b.checks,
    };
  }, FACES);
  if (screenshot) await page.screenshot({ path: join(OUT, `${frame.name}.png`), fullPage: Boolean(frame.full) });
  const entry = {
    frame: frame.name,
    url: `index.html?${frame.q}`,
    viewport: `${width}x${height}`,
    screenshot,
    fullPage: Boolean(frame.full),
    fontsOk: Object.values(result.fonts).every(Boolean) && result.loadedFaces.some((f) => f.includes("arabic")) && result.loadedFaces.some((f) => f.includes("latin")),
    ...result,
    errors,
  };
  log.push(entry);
  console.log(`${entry.frame.padEnd(40)} ${entry.viewport.padEnd(9)} overflowX=${entry.overflowX} fonts=${entry.fontsOk ? "ok" : "MISSING"} errors=${errors.length} eastern=${entry.easternDigits} active=${entry.active}${frame.act?.includes("peak") ? ` "${entry.valuetext}"` : ""}`);
  await context.close();
}

try {
  for (const f of REQUIRED) await shoot(f, { width: 1440, height: 900 });
  for (const f of EXTRA) await shoot(f, { width: 1440, height: 900 });
  for (const f of OVERFLOW_ONLY) await shoot(f, { width: 1280, height: 800, screenshot: false });
} finally {
  await browser.close();
  server.close();
}
await writeFile(join(OUT, "capture-log.json"), `${JSON.stringify({ capturedAt: new Date().toISOString(), port: PORT, frames: log }, null, 2)}\n`);
const bad = log.filter((e) => e.overflowX > 0 || !e.fontsOk || e.errors.length || e.easternDigits || e.enDashInArabic);
console.log(bad.length ? `\n${bad.length} frame(s) need attention.` : "\nAll frames: no overflow, fonts loaded, no errors, Western digits only.");
