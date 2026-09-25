// Light study capture: serves this folder on 127.0.0.1:3172 and records the three recipe frames with
// Playwright chromium (deviceScaleFactor 1, reducedMotion "reduce"), plus a 2x crop of each chart card's
// lower half (deviceScaleFactor 2, clipped to the card).
// Run from PowerShell at the worktree root:
//   node design-research/owner-composition-exploration-r04/directions/light-study/capture.mjs
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "evidence");
const PORT = 3172;
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

const RECIPES = ["a", "b", "c"];
const FACES = [
  ['400 16px "Readex Pro"', "مرحبا"],
  ['500 16px "Readex Pro"', "مرحبا"],
  ['400 16px "Readex Pro"', "0123 EN"],
  ['500 16px "Readex Pro"', "0123"],
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const log = [];

async function shoot(recipe, scale) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: scale,
    reducedMotion: "reduce",
    colorScheme: "dark",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  });
  await page.goto(`${ORIGIN}/index.html?recipe=${recipe}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__lightstudy?.ready === true);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  const result = await page.evaluate((faces) => {
    const el = document.documentElement;
    const card = document.querySelector(".chart").getBoundingClientRect();
    return {
      recipeApplied: el.dataset.recipe,
      fonts: Object.fromEntries(faces.map(([spec, sample]) => [`${spec} ${sample}`, document.fonts.check(spec, sample)])),
      loadedFaces: [...new Set([...document.fonts].filter((f) => f.status === "loaded").map((f) => `${f.family.replace(/"/g, "")} ${f.weight}`))].sort(),
      overflowX: el.scrollWidth - el.clientWidth,
      overflowY: el.scrollHeight - el.clientHeight,
      chart: { x: card.x, y: card.y, width: card.width, height: card.height },
      figures: window.__lightstudy.figures,
      checks: window.__lightstudy.checks,
    };
  }, FACES);
  let name;
  if (scale === 1) {
    name = `light-${recipe}-ar-1440x900`;
    await page.screenshot({ path: join(OUT, `${name}.png`) });
  } else {
    name = `light-${recipe}-chart-2x`;
    const c = result.chart;
    const half = Math.floor(c.height / 2);
    await page.screenshot({
      path: join(OUT, `${name}.png`),
      clip: { x: Math.floor(c.x), y: Math.floor(c.y + c.height - half), width: Math.ceil(c.width), height: Math.ceil(half) },
    });
  }
  const entry = {
    frame: name,
    recipe,
    deviceScaleFactor: scale,
    recipeApplied: result.recipeApplied,
    fontsOk: Object.values(result.fonts).every(Boolean),
    fonts: result.fonts,
    loadedFaces: result.loadedFaces,
    overflowX: result.overflowX,
    overflowY: result.overflowY,
    chartCard: result.chart,
    figures: result.figures,
    checks: result.checks,
    errors,
  };
  log.push(entry);
  console.log(`${name.padEnd(24)} recipe=${result.recipeApplied} overflowX=${entry.overflowX} overflowY=${entry.overflowY} fonts=${entry.fontsOk ? "ok" : "MISSING"} errors=${errors.length}`);
  await context.close();
}

try {
  for (const r of RECIPES) await shoot(r, 1);
  for (const r of RECIPES) await shoot(r, 2);
} finally {
  await browser.close();
  server.close();
}
await writeFile(join(OUT, "capture-log.json"), `${JSON.stringify({ capturedAt: new Date().toISOString(), port: PORT, frames: log }, null, 2)}\n`);
const bad = log.filter((e) => e.overflowX > 0 || e.overflowY > 0 || !e.fontsOk || e.errors.length || e.recipeApplied !== e.recipe || e.checks.overshoot || e.checks.drawnMax !== e.checks.peak);
console.log(bad.length ? `\n${bad.length} frame(s) need attention.` : "\nAll frames: recipe applied, no overflow, fonts loaded, no errors, line checks pass.");
