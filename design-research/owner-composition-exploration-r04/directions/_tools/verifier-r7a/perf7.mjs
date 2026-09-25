// Verifier: frame cost of a selection change (motion on): JS time of select(), time to the next two animation frames,
// and rAF intervals during a glide; current code (A, B) against the Round 6 copy (BASE2).
import { chromium } from "file:///D:/Projects/fitway-worktrees/owner-design-exploration-r04/node_modules/@playwright/test/index.mjs";
import { writeFileSync } from "node:fs";
const CUR = "file:///D:/Projects/fitway-worktrees/owner-design-exploration-r04/design-research/owner-composition-exploration-r04/directions/eclipse/index.html";
const OLD = "file:///C:/Users/PCFORC~1/AppData/Local/Temp/claude/D--Projects-fitway-worktrees-owner-design-exploration-r04/8f6a215f-9d39-4251-a39f-d9ed1baf14d0/scratchpad/eclipse-before-r7a/index.html";
const OUT = process.argv[2];
const b = await chromium.launch();
const res = {};
for (const [label, base, q] of [["r6", OLD, ""], ["a", CUR, "&marker=a"], ["b", CUR, "&marker=b"]]) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference", colorScheme: "dark" });
  const p = await ctx.newPage();
  await p.goto(`${base}?lang=ar&tuner=0${q}`, { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600);
  const r = await p.evaluate(async () => {
    const raf = () => new Promise((r) => requestAnimationFrame(() => r(performance.now())));
    const out = [];
    for (const [a, c] of [["latest", "h840"], ["h840", "latest"], ["h600", "h630"], ["h480", "gap"], ["gap", "h540"], ["h630", "h600"], ["latest", "h840"], ["h600", "h630"]]) {
      window.__eclipse.chart.select(a); await new Promise((r) => setTimeout(r, 400)); await raf();
      const t0 = performance.now(); window.__eclipse.chart.select(c); const t1 = performance.now();
      const f1 = await raf(); const f2 = await raf();
      const iv = []; let last = f2; for (let i = 0; i < 10; i++) { const t = await raf(); iv.push(Math.round(t - last)); last = t; }
      out.push({ from: a, to: c, selectMs: +(t1 - t0).toFixed(1), firstFrameMs: Math.round(f1 - t0), secondFrameMs: Math.round(f2 - t0), nextIntervals: iv });
    }
    return out;
  });
  res[label] = r;
  await ctx.close();
  console.log(label, JSON.stringify(r.map((x) => `${x.from}->${x.to} js${x.selectMs} f1=${x.firstFrameMs} f2=${x.secondFrameMs} iv=${Math.max(...x.nextIntervals)}`)));
}
await b.close();
writeFileSync(`${OUT}/perf.json`, JSON.stringify(res, null, 1));
