// Coordinator's real-time recordings of Eclipse Round 6 with motion on (Playwright video, 1440x900), plus slow-motion
// copies (document timeline at 0.2x through CDP) for close inspection. Writes element boxes for the frame analysis.
import { chromium } from "file:///D:/Projects/fitway-worktrees/owner-design-exploration-r04/node_modules/@playwright/test/index.mjs";
import { renameSync, writeFileSync, mkdirSync } from "node:fs";
const BASE = "file:///D:/Projects/fitway-worktrees/owner-design-exploration-r04/design-research/owner-composition-exploration-r04/directions/eclipse/index.html";
const OUT = process.argv[2];
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const log = {};
const box = (p, s) => p.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; }, s);
// A persistent context keeps the HTTP cache, so after one warm-up visit the recordings show a warm page (like the
// user's own browser); the cold load is recorded in a fresh context.
const CTX_OPTS = { viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference", colorScheme: "dark", recordVideo: { dir: OUT, size: { width: 1440, height: 900 } } };
const persistent = await chromium.launchPersistentContext(`${OUT}/profile`, CTX_OPTS);
{ const w = await persistent.newPage(); for (const l of ["ar", "en"]) await w.goto(`${BASE}?lang=${l}&tuner=0`, { waitUntil: "networkidle" }); await w.close(); }
async function rec(name, q, act, { slow = 0, warm = true } = {}) {
  const ctx = warm ? persistent : await b.newContext(CTX_OPTS);
  const p = await ctx.newPage();
  const errors = []; p.on("pageerror", (e) => errors.push(String(e)));
  const t0 = Date.now();
  const marks = [];
  const mark = (label) => marks.push({ label, ms: Date.now() - t0 });
  await p.goto(`${BASE}?${q}`, { waitUntil: "networkidle" });
  mark("loaded");
  if (slow) { const cdp = await ctx.newCDPSession(p); await cdp.send("Animation.enable"); await cdp.send("Animation.setPlaybackRate", { playbackRate: slow }); }
  const boxes = { now: await box(p, "#now-v"), entries: await box(p, "#entries-v"), foot: await box(p, "#now-foot"), plot: await box(p, "#plot"), rail: await box(p, "#rail"), status: await box(p, "#status"), cards: await box(p, "main") };
  await act(p, mark);
  const path = await p.video().path();
  await p.close();
  if (!warm) await ctx.close();
  renameSync(path, `${OUT}/${name}.webm`);
  log[name] = { marks, boxes, errors, slow };
}
const ev = (p, fn) => p.evaluate(fn);
const live = async (p, mark) => {
  await p.waitForTimeout(1200);
  for (let i = 0; i < 3; i++) { mark(`step${i}`); await ev(p, () => window.__eclipse.motion.step()); await p.waitForTimeout(1300); }
  mark("crowdUp"); await ev(p, () => window.__eclipse.motion.crowd(1)); await p.waitForTimeout(1300);
  mark("crowdDown"); await ev(p, () => window.__eclipse.motion.crowd(-1)); await p.waitForTimeout(1300);
  mark("crowdDown2"); await ev(p, () => window.__eclipse.motion.crowd(-1)); await p.waitForTimeout(1300);
  mark("crowdUp2"); await ev(p, () => window.__eclipse.motion.crowd(1)); await p.waitForTimeout(1300);
};
const hover = async (p, mark) => {
  await p.waitForTimeout(800);
  const pl = await box(p, "#plot-hit");
  const y = pl.y + pl.h * 0.5;
  mark("sweep"); await p.mouse.move(pl.x + 5, y); await p.mouse.move(pl.x + pl.w - 5, y, { steps: 120 }); await p.waitForTimeout(600);
  const st = await ev(p, () => window.__eclipse.chart.stops.map((s) => ({ key: s.key, x: s.clientX })));
  const at = (k) => st.find((s) => s.key === k).x;
  mark("jumps");
  for (const k of ["h690", "peak", "h780", "h810", "latest", "h810", "peak", "h660"]) { await p.mouse.move(at(k), y); await p.waitForTimeout(450); }
  mark("slowAcross"); await p.mouse.move(at("h600"), y, { steps: 6 }); await p.mouse.move(at("h450"), y, { steps: 60 }); await p.waitForTimeout(500);
  mark("gap"); await p.mouse.move(at("gap"), y, { steps: 10 }); await p.waitForTimeout(700);
  mark("ahead"); await p.mouse.move(at("h900"), y, { steps: 30 }); await p.waitForTimeout(700);
  mark("leave"); await p.mouse.move(pl.x + pl.w / 2, pl.y + pl.h + 120); await p.waitForTimeout(800);
};
const keys = (later, earlier) => async (p, mark) => {
  await p.waitForTimeout(800);
  await p.focus("#plot-hit"); mark("focus"); await p.waitForTimeout(600);
  for (let i = 0; i < 8; i++) { await p.keyboard.press(earlier); await p.waitForTimeout(380); }
  mark("later"); for (let i = 0; i < 5; i++) { await p.keyboard.press(later); await p.waitForTimeout(380); }
  mark("home"); await p.keyboard.press("Home"); await p.waitForTimeout(600);
  mark("end"); await p.keyboard.press("End"); await p.waitForTimeout(600);
  await p.keyboard.press("Escape"); await p.waitForTimeout(500);
};
const rail = async (p, mark) => {
  await p.waitForTimeout(800);
  for (let i = 0; i < 2; i++) { mark("open"); await p.click("#brand"); await p.mouse.move(720, 450); await p.waitForTimeout(1000); mark("close"); await p.click("#brand"); await p.mouse.move(720, 450); await p.waitForTimeout(1000); }
};
const delayed = async (p, mark) => {
  await p.waitForTimeout(3000);
  mark("minute"); await ev(p, () => window.__eclipse.motion.step()); await p.waitForTimeout(1500);
  mark("minute2"); await ev(p, () => window.__eclipse.motion.step()); await p.waitForTimeout(1500);
};

await rec("load-ar-cold", "lang=ar&tuner=0", async (p) => { await p.waitForTimeout(2500); }, { warm: false });
await rec("load-ar", "lang=ar&tuner=0", async (p) => { await p.waitForTimeout(2500); });
await rec("load-en", "lang=en&tuner=0", async (p) => { await p.waitForTimeout(2500); });
await rec("live-ar", "lang=ar&tuner=0", live);
await rec("live-en", "lang=en&tuner=0", live);
await rec("hover-ar", "lang=ar&tuner=0", hover);
await rec("hover-en", "lang=en&tuner=0", hover);
await rec("keys-ar", "lang=ar&tuner=0", keys("ArrowLeft", "ArrowRight"));
await rec("rail-ar", "lang=ar&tuner=0", rail);
await rec("rail-en", "lang=en&tuner=0", rail);
await rec("delayed-ar", "lang=ar&state=delayed&tuner=0", delayed);
await rec("slow-live-ar", "lang=ar&tuner=0", async (p, mark) => {
  await p.waitForTimeout(800);
  mark("step"); await ev(p, () => window.__eclipse.motion.step()); await p.waitForTimeout(2500);
  mark("crowdUp"); await ev(p, () => window.__eclipse.motion.crowd(1)); await p.waitForTimeout(2500);
  mark("crowdDown"); await ev(p, () => window.__eclipse.motion.crowd(-1)); await p.waitForTimeout(2500);
}, { slow: 0.2 });
await rec("slow-keys-ar", "lang=ar&tuner=0", async (p, mark) => {
  await p.waitForTimeout(800);
  await p.focus("#plot-hit"); await p.waitForTimeout(500);
  for (const k of ["ArrowRight", "ArrowRight", "ArrowRight", "ArrowRight", "ArrowLeft", "ArrowLeft"]) { mark(k); await p.keyboard.press(k); await p.waitForTimeout(1400); }
}, { slow: 0.2 });
await persistent.close();
await b.close();
writeFileSync(`${OUT}/video-log.json`, JSON.stringify(log, null, 1));
console.log(JSON.stringify(Object.fromEntries(Object.entries(log).map(([k, v]) => [k, { marks: v.marks.length, errors: v.errors }]))));
