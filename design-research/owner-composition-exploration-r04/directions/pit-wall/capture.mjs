// Pit Wall concept capture: serves this folder on 127.0.0.1:3163 and records frames with
// Playwright (deviceScaleFactor 1, reducedMotion "reduce"). Desktop only in this round.
// Run from PowerShell at the worktree root:  node design-research/owner-composition-exploration-r04/directions/pit-wall/capture.mjs
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "evidence");
const PORT = 3163;
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
  { name: "daily-en-1440x900", q: "lang=en&section=daily" },
  { name: "daily-ar-1440x900", q: "lang=ar&section=daily" },
  { name: "history-en-1440x900", q: "lang=en&section=history" },
  { name: "history-ar-1440x900", q: "lang=ar&section=history" },
  { name: "daily-en-1440x900-delayed", q: "lang=en&section=daily&state=delayed" },
  { name: "daily-ar-1440x900-delayed", q: "lang=ar&section=daily&state=delayed" },
  { name: "daily-ar-1440x900-keyboard", q: "lang=ar&section=daily", keyboard: true },
];
// Extra frames for self-inspection (lower page, other truthful states, placeholder).
const EXTRA = [
  { name: "extra-daily-ar-1440-fullpage", q: "lang=ar&section=daily", full: true },
  { name: "extra-daily-en-1440-fullpage", q: "lang=en&section=daily", full: true },
  { name: "extra-history-ar-1440-fullpage", q: "lang=ar&section=history", full: true },
  { name: "extra-history-en-1440-fullpage", q: "lang=en&section=history", full: true },
  { name: "extra-daily-ar-1440x900-closed", q: "lang=ar&section=daily&state=closed" },
  { name: "extra-daily-ar-1440x900-empty", q: "lang=ar&section=daily&state=empty" },
  { name: "extra-daily-ar-1440x900-loading", q: "lang=ar&section=daily&state=loading" },
  { name: "extra-daily-en-1440x900-error", q: "lang=en&section=daily&state=error" },
  { name: "extra-access-ar-1440x900", q: "lang=ar&section=access" },
];
const OVERFLOW_ONLY = [
  { name: "daily-en-1280x800", q: "lang=en&section=daily" },
  { name: "daily-ar-1280x800", q: "lang=ar&section=daily" },
  { name: "history-en-1280x800", q: "lang=en&section=history" },
  { name: "history-ar-1280x800", q: "lang=ar&section=history" },
];

const FONT_FACES = {
  ar: [
    ['400 16px "IBM Plex Sans Arabic"', "مرحبا"],
    ['500 16px "IBM Plex Sans Arabic"', "مرحبا"],
    ['600 16px "IBM Plex Sans Arabic"', "مرحبا"],
    ['700 17px "IBM Plex Sans"', "FITWAY"],
    ['500 16px "JetBrains Mono"', "0123"],
    ['600 16px "JetBrains Mono"', "0123"],
  ],
  en: [
    ['400 16px "IBM Plex Sans"', "Hello"],
    ['500 16px "IBM Plex Sans"', "Hello"],
    ['600 16px "IBM Plex Sans"', "Hello"],
    ['700 17px "IBM Plex Sans"', "FITWAY"],
    ['500 16px "JetBrains Mono"', "0123"],
    ['600 16px "JetBrains Mono"', "0123"],
  ],
};

// Extra frames (other states, placeholder) use fewer weights: check the faces they render.
const MIN_FACES = {
  ar: [FONT_FACES.ar[0], FONT_FACES.ar[2], FONT_FACES.ar[3], ['400 14px "JetBrains Mono"', "0123"]],
  en: [FONT_FACES.en[0], FONT_FACES.en[2], FONT_FACES.en[3], ['400 14px "JetBrains Mono"', "0123"]],
};

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const log = [];

async function shoot(frame, { width, height, screenshot = true }) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
    colorScheme: "dark",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  });
  await page.goto(`${ORIGIN}/index.html?${frame.q}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__pitwall?.ready === true);
  await page.evaluate(() => document.fonts.ready);
  if (frame.keyboard) {
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press("Tab");
      if (await page.evaluate(() => document.activeElement?.id === "scope")) break;
    }
    await page.keyboard.press("Home");
    for (let i = 0; i < 12; i++) await page.keyboard.press("PageUp");
    const peak = 747; // 6:27 PM in the seeded day
    const lang = frame.q.includes("lang=en") ? "en" : "ar";
    const fwd = lang === "ar" ? "ArrowLeft" : "ArrowRight";
    for (let i = 0; i < peak - 720; i++) await page.keyboard.press(fwd);
  }
  await page.waitForTimeout(150);
  const lang = frame.q.includes("lang=en") ? "en" : "ar";
  const result = await page.evaluate((faces) => {
    // A frame with no numerals (the placeholders) never requests the mono face.
    const hasMono = Boolean(document.querySelector(".n"));
    const fonts = Object.fromEntries(
      faces.filter(([spec]) => hasMono || !spec.includes("Mono")).map(([spec, sample]) => [spec, document.fonts.check(spec, sample)]),
    );
    const loaded = [...document.fonts]
      .filter((f) => f.status === "loaded")
      .map((f) => `${f.family.replace(/"/g, "")} ${f.weight}`);
    const el = document.documentElement;
    return {
      fonts,
      loadedFaces: [...new Set(loaded)].sort(),
      overflowX: el.scrollWidth - el.clientWidth,
      active: document.activeElement?.id || document.activeElement?.tagName,
      valuetext: document.getElementById("scope")?.getAttribute("aria-valuetext") ?? null,
    };
  }, frame.name.startsWith("extra-") ? MIN_FACES[lang] : FONT_FACES[lang]);
  if (screenshot) {
    await page.screenshot({ path: join(OUT, `${frame.name}.png`), fullPage: Boolean(frame.full) });
  }
  const entry = {
    frame: frame.name,
    viewport: `${width}x${height}`,
    screenshot,
    fontsOk: Object.values(result.fonts).every(Boolean),
    fonts: result.fonts,
    loadedFaces: result.loadedFaces,
    overflowX: result.overflowX,
    errors,
    ...(frame.keyboard ? { focused: result.active, valuetext: result.valuetext } : {}),
  };
  log.push(entry);
  console.log(
    `${entry.frame.padEnd(34)} ${entry.viewport.padEnd(9)} overflowX=${entry.overflowX} fonts=${entry.fontsOk ? "ok" : "MISSING"} errors=${errors.length}${frame.keyboard ? ` focus=${result.active} "${result.valuetext}"` : ""}`,
  );
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
const bad = log.filter((e) => e.overflowX > 0 || !e.fontsOk || e.errors.length);
console.log(bad.length ? `\n${bad.length} frame(s) need attention.` : "\nAll frames: no overflow, fonts loaded, no errors.");
