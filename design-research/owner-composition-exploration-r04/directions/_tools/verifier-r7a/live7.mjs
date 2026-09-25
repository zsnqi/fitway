// Verifier: a new reading while the latest stop is selected (motion on), per frame: the selected key, the marker's
// position against the end point and the line, and the end halo; then at rest. Also latest->h840 cut timing.
import { chromium } from "file:///D:/Projects/fitway-worktrees/owner-design-exploration-r04/node_modules/@playwright/test/index.mjs";
import { writeFileSync, mkdirSync } from "node:fs";
const BASE = process.env.BASE ?? "file:///D:/Projects/fitway-worktrees/owner-design-exploration-r04/design-research/owner-composition-exploration-r04/directions/eclipse/index.html";
const OUT = process.argv[2]; mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const res = {};
for (const form of ["a", "b"]) for (const lang of ["ar", "en"]) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference", colorScheme: "dark" });
  const p = await ctx.newPage(); const errors = []; p.on("pageerror", (e) => errors.push(String(e)));
  await p.goto(`${BASE}?lang=${lang}&tuner=0&marker=${form}`, { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  const r = await p.evaluate(async () => {
    const snap = (t0) => {
      const mk = document.querySelector("#sel .sg-mark"); const e = document.getElementById("end-dot"); const h = document.getElementById("end-halo");
      let x = null, y = null; if (mk) { const m = /translate\(([-\d.]+)[ ,]+([-\d.]+)\)/.exec(mk.getAttribute("transform")); x = +m[1]; y = +m[2]; }
      return { t: Math.round(performance.now() - t0), key: window.__eclipse.chart.selected, x, y, end: e ? [+e.getAttribute("cx"), +e.getAttribute("cy")] : null, toEnd: mk && e ? +Math.hypot(x - +e.getAttribute("cx"), y - +e.getAttribute("cy")).toFixed(3) : null, halo: h ? (h.getAttribute("visibility") ?? "visible") : "none", form: mk?.dataset.form ?? null, under: document.getElementById("sel-under")?.childElementCount ?? null };
    };
    const out = {};
    // 1. a cut: latest -> h840
    window.__eclipse.chart.select("latest"); await new Promise((r) => setTimeout(r, 400));
    let t0 = performance.now(); window.__eclipse.chart.select("h840"); const cut = [];
    await new Promise((res) => { const tick = () => { cut.push(snap(t0)); if (performance.now() - t0 < 300) requestAnimationFrame(tick); else res(); }; requestAnimationFrame(tick); });
    out.cut = cut.filter((s, i) => i === 0 || s.x !== cut[i - 1].x || s.y !== cut[i - 1].y);
    // 2. a new reading with latest selected
    window.__eclipse.chart.select("latest"); await new Promise((r) => setTimeout(r, 400));
    const before = snap(performance.now());
    t0 = performance.now(); const stepRes = window.__eclipse.motion.step(); const S = [];
    await new Promise((res) => { const tick = () => { S.push(snap(t0)); if (performance.now() - t0 < 700) requestAnimationFrame(tick); else res(); }; requestAnimationFrame(tick); });
    out.step = { stepRes, before, frames: S, rest: snap(t0) };
    return out;
  });
  res[`${form}-${lang}`] = { ...r, errors };
  await ctx.close();
  const f = r.step.frames;
  console.log(form, lang, "cut changes", JSON.stringify(r.cut.map((s) => [s.t, s.key, s.form, s.x, s.y])), "| before", JSON.stringify([r.step.before.key, r.step.before.toEnd, r.step.before.halo]), "| frames", f.length, "halo-visible frames with key latest", f.filter((s) => s.key === "latest" && s.halo === "visible").map((s) => s.t).join(","), "| maxToEnd", Math.max(...f.map((s) => s.toEnd ?? -1)), "| rest", JSON.stringify([r.step.rest.key, r.step.rest.toEnd, r.step.rest.halo, r.step.rest.form]), "errors", errors.length);
}
await b.close();
writeFileSync(`${OUT}/live.json`, JSON.stringify(res, null, 1));
