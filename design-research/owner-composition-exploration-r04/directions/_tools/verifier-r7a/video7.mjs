// Verifier: real-time recordings (Playwright video, 1440x900, motion on) of a hover sweep with each marker form, plus
// 0.2x slow-motion keyboard steps (CDP Animation.setPlaybackRate), adapted from the coordinator's video.mjs.
import { chromium } from "file:///D:/Projects/fitway-worktrees/owner-design-exploration-r04/node_modules/@playwright/test/index.mjs";
import { renameSync, writeFileSync, mkdirSync } from "node:fs";
const BASE = "file:///D:/Projects/fitway-worktrees/owner-design-exploration-r04/design-research/owner-composition-exploration-r04/directions/eclipse/index.html";
const OUT = process.argv[2];
mkdirSync(OUT, { recursive: true });
const log = {};
const box = (p, s) => p.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; }, s);
const CTX_OPTS = { viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference", colorScheme: "dark", recordVideo: { dir: OUT, size: { width: 1440, height: 900 } } };
const persistent = await chromium.launchPersistentContext(`${OUT}/profile`, CTX_OPTS);
{ const w = await persistent.newPage(); for (const l of ["ar", "en"]) await w.goto(`${BASE}?lang=${l}&tuner=0`, { waitUntil: "networkidle" }); await w.close(); }
async function rec(name, q, act, { slow = 0 } = {}) {
  const p = await persistent.newPage();
  const errors = []; p.on("pageerror", (e) => errors.push(String(e)));
  const t0 = Date.now(); const marks = []; const mark = (label) => marks.push({ label, ms: Date.now() - t0 });
  await p.goto(`${BASE}?${q}`, { waitUntil: "networkidle" });
  mark("loaded");
  if (slow) { const cdp = await persistent.newCDPSession(p); await cdp.send("Animation.enable"); await cdp.send("Animation.setPlaybackRate", { playbackRate: slow }); }
  const boxes = { plot: await box(p, "#plot") };
  await act(p, mark);
  const path = await p.video().path();
  await p.close();
  renameSync(path, `${OUT}/${name}.webm`);
  log[name] = { marks, boxes, errors, slow };
}
const hover = async (p, mark) => {
  await p.waitForTimeout(2200); // past the VP8 quality ramp
  const pl = await box(p, "#plot-hit");
  const y = pl.y + pl.h * 0.5;
  const st = await p.evaluate(() => window.__eclipse.chart.stops.map((s) => ({ key: s.key, x: s.clientX })));
  const at = (k) => st.find((s) => s.key === k).x;
  mark("sweep"); await p.mouse.move(at("h600"), y); await p.mouse.move(at("latest"), y, { steps: 50 }); await p.waitForTimeout(600);
  mark("jumps"); for (const k of ["h690", "peak", "h780", "latest", "h810", "peak", "h660"]) { await p.mouse.move(at(k), y); await p.waitForTimeout(450); }
  mark("gap"); await p.mouse.move(at("gap"), y, { steps: 8 }); await p.waitForTimeout(600);
  mark("ahead"); await p.mouse.move(at("h900"), y, { steps: 20 }); await p.waitForTimeout(600);
  mark("leave"); await p.mouse.move(pl.x + pl.w / 2, pl.y + pl.h + 120); await p.waitForTimeout(600);
};
const slowKeys = (later, earlier) => async (p, mark) => {
  await p.waitForTimeout(2200);
  await p.evaluate(() => window.__eclipse.chart.select("h660")); await p.waitForTimeout(300);
  await p.focus("#plot-hit");
  for (const k of [later, later, later, later, earlier]) { mark(k); await p.keyboard.press(k); await p.waitForTimeout(1300); }
};
for (const form of ["a", "b"]) {
  await rec(`hover-ar-${form}`, `lang=ar&tuner=0&marker=${form}`, hover);
  await rec(`hover-en-${form}`, `lang=en&tuner=0&marker=${form}`, hover);
  await rec(`slow-keys-ar-${form}`, `lang=ar&tuner=0&marker=${form}`, slowKeys("ArrowLeft", "ArrowRight"), { slow: 0.2 });
}
await persistent.close();
writeFileSync(`${OUT}/video-log.json`, JSON.stringify(log, null, 1));
console.log(JSON.stringify(Object.fromEntries(Object.entries(log).map(([k, v]) => [k, { marks: v.marks.map((m) => `${m.label}@${m.ms}`).join(" "), errors: v.errors }]))));
