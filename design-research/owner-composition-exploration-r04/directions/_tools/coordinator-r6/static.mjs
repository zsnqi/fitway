// Coordinator's independent still-frame check for Eclipse Round 6.
// Renders the still frames from the current eclipse/ code with (a) reducedMotion "reduce" and (b) ?motion=off with
// motion allowed, and writes a manifest pairing each render with the pre-motion reference PNG.
// Usage: node static.mjs <outDir> [modes=reduce,off]
import { chromium } from "file:///D:/Projects/fitway-worktrees/owner-design-exploration-r04/node_modules/@playwright/test/index.mjs";
import { mkdirSync, writeFileSync } from "node:fs";
const BASE = process.env.BASE ?? "file:///D:/Projects/fitway-worktrees/owner-design-exploration-r04/design-research/owner-composition-exploration-r04/directions/eclipse/index.html";
const REF = "C:/Users/PCFORC~1/AppData/Local/Temp/claude/D--Projects-fitway-worktrees-owner-design-exploration-r04/d329255d-7158-42d6-8349-b9c7d39168a4/scratchpad/eclipse-v3-user-copy/evidence";
const OUT = process.argv[2];
const MODES = (process.argv[3] ?? "reduce,off").split(",");
mkdirSync(OUT, { recursive: true });
const HIDE_CONTENT = ".lit > :not(.lamp) { visibility: hidden !important; }";
const F = [
  { name: "daily-ar-1440x900", q: "lang=ar&tuner=0" },
  { name: "daily-en-1440x900", q: "lang=en&tuner=0" },
  { name: "daily-ar-1440x900-rail-open", q: "lang=ar&tuner=0", act: "rail" },
  { name: "daily-en-1440x900-rail-open", q: "lang=en&tuner=0", act: "rail" },
  { name: "daily-ar-1440x900-delayed", q: "lang=ar&state=delayed&tuner=0" },
  { name: "daily-ar-1440x900-nohistory", q: "lang=ar&state=nohistory&tuner=0" },
  { name: "daily-ar-1440x900-details", q: "lang=ar&tuner=0", act: "details", full: true },
  { name: "daily-en-nowcard-2x", q: "lang=en&tuner=0", scale: 2, clip: "#card-now" },
];
for (const id of ["v2", "a-like", "recommended"]) {
  const q = `lang=ar&tuner=0&preset=${id}`;
  F.push({ name: `preset-${id}-ar-1440x900`, q });
  F.push({ name: `preset-${id}-nowcard-2x`, q, scale: 2, clip: "#card-now" });
  F.push({ name: `preset-${id}-chart-2x`, q, scale: 2, clip: ".chart" });
  F.push({ name: `preset-${id}-nowcard-light`, q, clip: "#card-now", hide: true });
  F.push({ name: `preset-${id}-chart-light`, q, clip: ".chart", hide: true });
}
const b = await chromium.launch();
const rows = [];
for (const mode of MODES) {
  for (const f of F) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: f.scale ?? 1, reducedMotion: mode === "reduce" ? "reduce" : "no-preference", colorScheme: "dark" });
    const p = await ctx.newPage();
    const errors = [];
    p.on("pageerror", (e) => errors.push(String(e)));
    p.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });
    await p.goto(`${BASE}?${f.q}${mode === "off" ? "&motion=off" : ""}`);
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(900);
    if (f.act === "rail") { await p.click("#brand"); await p.mouse.move(720, 40); await p.waitForTimeout(700); }
    if (f.act === "details") { await p.click("#details-btn"); await p.mouse.move(720, 40); await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(700); }
    if (f.hide) { await p.addStyleTag({ content: HIDE_CONTENT }); await p.waitForTimeout(120); }
    const opts = { path: `${OUT}/${mode}-${f.name}.png`, fullPage: Boolean(f.full) };
    if (f.clip) {
      const r = await p.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }, f.clip);
      opts.clip = { x: Math.floor(r.x), y: Math.floor(r.y), width: Math.ceil(r.width), height: Math.ceil(r.height) };
    }
    await p.screenshot(opts);
    const anims = await p.evaluate(() => document.getAnimations().map((a) => `${a.constructor.name}:${a.animationName ?? a.id ?? ""}:${a.effect?.target?.className?.baseVal ?? a.effect?.target?.className ?? ""}`));
    rows.push({ mode, name: f.name, file: opts.path, ref: `${REF}/${f.name}.png`, errors, anims });
    await ctx.close();
  }
}
await b.close();
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(rows, null, 1));
console.log("rendered", rows.length);
