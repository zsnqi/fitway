// Verifier's still-frame renders for Eclipse Round 7 step 1 (adapted from the coordinator's static.mjs).
// Renders the 23 still frames with (a) reducedMotion "reduce" and (b) ?motion=off with motion allowed, plus the
// by-design frames (hover AR/EN for marker A and B, tuner-open) and the two derived levels-* frames.
// Usage: node static7.mjs <outDir> [modes=reduce,off]   (env BASE overrides the page URL, for the control run)
import { chromium } from "file:///D:/Projects/fitway-worktrees/owner-design-exploration-r04/node_modules/@playwright/test/index.mjs";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
const BASE = process.env.BASE ?? "file:///D:/Projects/fitway-worktrees/owner-design-exploration-r04/design-research/owner-composition-exploration-r04/directions/eclipse/index.html";
const REF = "C:/Users/PCFORC~1/AppData/Local/Temp/claude/D--Projects-fitway-worktrees-owner-design-exploration-r04/d329255d-7158-42d6-8349-b9c7d39168a4/scratchpad/eclipse-v3-user-copy/evidence";
const EVID = "D:/Projects/fitway-worktrees/owner-design-exploration-r04/design-research/owner-composition-exploration-r04/directions/eclipse/evidence";
const OUT = process.argv[2];
const MODES = (process.argv[3] ?? "reduce,off").split(",");
const EXTRA = process.env.EXTRA !== "0";
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
if (EXTRA) {
  F.push({ name: "daily-ar-1440x900-hover", q: "lang=ar&tuner=0", act: "hover", byDesign: true, evid: "daily-ar-1440x900-hover" });
  F.push({ name: "daily-en-1440x900-hover", q: "lang=en&tuner=0", act: "hover", byDesign: true, evid: "daily-en-1440x900-hover" });
  F.push({ name: "daily-ar-1440x900-hover-b", q: "lang=ar&tuner=0&marker=b", act: "hover", byDesign: true, evid: "daily-ar-1440x900-hover-b" });
  F.push({ name: "daily-en-1440x900-hover-b", q: "lang=en&tuner=0&marker=b", act: "hover", byDesign: true, evid: "daily-en-1440x900-hover-b" });
  F.push({ name: "daily-ar-1440x900-tuner-open", q: "lang=ar", act: "tuner", byDesign: true, evid: "daily-ar-1440x900-tuner-open" });
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
    await p.goto(`${BASE}?${f.q}${mode === "off" ? "&motion=off" : ""}`, { waitUntil: "networkidle" });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(900);
    if (f.act === "rail") { await p.click("#brand"); await p.mouse.move(720, 40); await p.waitForTimeout(700); }
    if (f.act === "details") { await p.click("#details-btn"); await p.mouse.move(720, 40); await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(700); }
    if (f.act === "hover") { const pt = await p.evaluate(() => window.__eclipse.minuteClient(window.__eclipse.figures.peakM)); await p.mouse.move(pt.x, pt.y); await p.waitForTimeout(700); }
    if (f.act === "tuner") { await p.click(".tuner-toggle"); await p.mouse.move(1150, 20); await p.waitForTimeout(700); }
    if (f.hide) { await p.addStyleTag({ content: HIDE_CONTENT }); await p.waitForTimeout(120); }
    const opts = { path: `${OUT}/${mode}-${f.name}.png`, fullPage: Boolean(f.full) };
    if (f.clip) {
      const r = await p.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }, f.clip);
      opts.clip = { x: Math.floor(r.x), y: Math.floor(r.y), width: Math.ceil(r.width), height: Math.ceil(r.height) };
    }
    await p.screenshot(opts);
    const anims = await p.evaluate(() => document.getAnimations().map((a) => `${a.constructor.name}:${a.animationName ?? a.id ?? ""}:${a.effect?.target?.className?.baseVal ?? a.effect?.target?.className ?? ""}`));
    const marker = await p.evaluate(() => window.__eclipse?.chart?.marker ?? null);
    rows.push({ mode, name: f.name, file: opts.path, ref: `${REF}/${f.name}.png`, evid: f.evid ? `${EVID}/${f.evid}.png` : null, byDesign: Boolean(f.byDesign), marker, errors, anims });
    await ctx.close();
  }
}
// levels-* (derived from preset-recommended 2x crops, with capture.mjs's own levels() math, copied verbatim).
async function levels(pngPath, outPath) {
  const ctx = await b.newContext({ viewport: { width: 400, height: 300 }, reducedMotion: "reduce", colorScheme: "dark" });
  const page = await ctx.newPage();
  const b64 = readFileSync(pngPath).toString("base64");
  const res = await page.evaluate(async (src) => {
    const img = new Image(); img.src = src; await img.decode();
    const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const g = c.getContext("2d"); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height); const px = d.data;
    const lum = new Float32Array(c.width * c.height); const reds = [];
    for (let i = 0, p = 0; p < lum.length; i += 4, p++) { const r = px[i], gg = px[i + 1], b = px[i + 2]; lum[p] = 0.2126 * r + 0.7152 * gg + 0.0722 * b; if (r > gg + 30) reds.push(lum[p]); }
    const sorted = [...lum].sort((a, b) => a - b); const bg = sorted[Math.floor(sorted.length * 0.3)];
    reds.sort((a, b) => a - b); const top = reds.length ? reds[Math.floor(reds.length * 0.97)] : sorted[sorted.length - 1];
    const cuts = [0.05, 0.14, 0.26, 0.4, 0.55, 0.72, 0.88];
    const pal = [[0, 0, 0], [70, 4, 4], [128, 10, 8], [190, 50, 4], [228, 120, 0], [240, 200, 0], [200, 255, 128], [255, 255, 255]];
    for (let i = 0, p = 0; p < lum.length; i += 4, p++) { const t = (lum[p] - bg) / Math.max(1, top - bg); let k = 0; while (k < cuts.length && t >= cuts[k]) k++; px[i] = pal[k][0]; px[i + 1] = pal[k][1]; px[i + 2] = pal[k][2]; px[i + 3] = 255; }
    g.putImageData(d, 0, 0); return c.toDataURL("image/png");
  }, `data:image/png;base64,${b64}`);
  writeFileSync(outPath, Buffer.from(res.split(",")[1], "base64"));
  await ctx.close();
}
for (const mode of MODES) {
  for (const [src, name] of [["preset-recommended-nowcard-2x", "levels-nowcard"], ["preset-recommended-chart-2x", "levels-chart"]]) {
    const file = `${OUT}/${mode}-${name}.png`;
    await levels(`${OUT}/${mode}-${src}.png`, file);
    rows.push({ mode, name, file, ref: `${REF}/${name}.png`, evid: null, byDesign: false, derived: true, errors: [], anims: [] });
  }
}
await b.close();
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(rows, null, 1));
console.log("rendered", rows.length);
