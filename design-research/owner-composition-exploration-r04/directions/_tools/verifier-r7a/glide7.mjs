// Verifier: the glide along the curve with motion on, both marker forms, AR and EN. Samples the marker every animation
// frame between pairs of stops (programmatic select, then pointer moves), measures its distance to the drawn track,
// whether it is a straight hop, the form attribute each frame, anything non-round drawn above the point, and the
// settle time. Also the live tail morph with the latest stop selected (halo, marker on the morphing end).
// Usage: node glide7.mjs <outDir>
import { chromium } from "file:///D:/Projects/fitway-worktrees/owner-design-exploration-r04/node_modules/@playwright/test/index.mjs";
import { writeFileSync, mkdirSync } from "node:fs";
const BASE = process.env.BASE ?? "file:///D:/Projects/fitway-worktrees/owner-design-exploration-r04/design-research/owner-composition-exploration-r04/directions/eclipse/index.html";
const OUT = process.argv[2];
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const res = {};
const HELPERS = () => {
  const samples = new Map();
  window.__v = {
    pts(path) { const key = path.getAttribute("d"); if (samples.has(key)) return samples.get(key); const L = path.getTotalLength(), out = []; for (let l = 0; l <= L; l += 0.2) { const p = path.getPointAtLength(l); out.push([p.x, p.y]); } samples.set(key, out); return out; },
    dist(x, y, paths) { let best = Infinity; for (const p of paths) for (const [px, py] of this.pts(p)) { const d = Math.hypot(px - x, py - y); if (d < best) best = d; } return best; },
    snap() {
      const mk = document.querySelector("#sel .sg-mark");
      if (!mk) return null;
      const m = /translate\(([-\d.]+)[ ,]+([-\d.]+)\)/.exec(mk.getAttribute("transform"));
      const x = +m[1], y = +m[2];
      const svg = document.querySelector("#plot-svg svg");
      let above = 0;
      for (const n of document.querySelectorAll("#sel rect, #sel path, #sel line, #sel-under rect, #sel-under path")) {
        if (n.closest("defs, mask, filter")) continue;
        const bb = n.getBBox(); const c = n.getCTM(); if (!c) continue;
        const top = bb.y * c.d + c.f; // translate-only transforms here
        if (top < y - 1) above++;
      }
      return { x, y, form: mk.dataset.form, marker: mk.dataset.marker, above, under: document.getElementById("sel-under")?.childElementCount ?? null, halo: document.getElementById("end-halo")?.getAttribute("visibility") ?? null };
    },
  };
};
for (const form of ["a", "b"]) for (const lang of ["ar", "en"]) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference", colorScheme: "dark" });
  const p = await ctx.newPage();
  const errors = []; p.on("pageerror", (e) => errors.push(String(e))); p.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await p.goto(`${BASE}?lang=${lang}&tuner=0&marker=${form}`, { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  await p.evaluate(HELPERS);
  const pairs = await p.evaluate(() => {
    const s = window.__eclipse.chart.stops, k = (kind) => s.findIndex((x) => x.kind === kind);
    const iP = k("peak"), iL = k("latest"), iG = k("gap");
    return [[s[20].key, s[21].key], [s[21].key, s[20].key], [s[iP - 1].key, s[iP].key], [s[iP].key, s[iP + 1].key], [s[iP + 1].key, s[iP].key], [s[iL - 1].key, s[iL].key], [s[iL].key, s[iL - 1].key], [s[iG - 1].key, s[iG].key], [s[iG - 1].key, s[iG + 1].key], [s[iL].key, s[iL + 1].key], [s[iL + 1].key, s[iL + 2].key], [s[5].key, s[6].key], [s[5].key, s[8].key]];
  });
  const glides = [];
  for (const [a, c] of pairs) {
    const r = await p.evaluate(async ([a, c]) => {
      const V = window.__v;
      window.__eclipse.chart.select(a);
      await new Promise((r) => setTimeout(r, 350));
      const lines = [...document.querySelectorAll('#plot-svg path[id^="ln-"]')], usual = [...document.querySelectorAll("#us-ahead, #us-past")];
      const pk = document.getElementById("pk-dot"), pkx = +pk.getAttribute("cx");
      const start = V.snap();
      const t0 = performance.now();
      window.__eclipse.chart.select(c);
      const started = window.__eclipse.chart.glideActive;
      const S = [];
      await new Promise((res) => { const tick = () => { const s = V.snap(); if (s) S.push({ t: performance.now() - t0, ...s }); if (performance.now() - t0 < 320) requestAnimationFrame(tick); else res(); }; requestAnimationFrame(tick); });
      const end = S[S.length - 1];
      let maxOff = 0, lastMove = 0, prev = start, maxOffStraight = 0, maxAbove = 0, wrong = 0;
      for (const s of S) {
        let d;
        if (s.form === "line") d = V.dist(s.x, s.y, lines);
        else if (s.form === "usual") d = V.dist(s.x, s.y, usual);
        else if (s.form === "drop" || s.form === "peak") d = Math.abs(s.x - pkx) < 0.05 ? 0 : V.dist(s.x, s.y, lines);
        else d = 0;
        maxOff = Math.max(maxOff, d);
        if (prev && Math.hypot(s.x - prev.x, s.y - prev.y) > 0.01) lastMove = s.t;
        prev = s;
        if (start && end) { const ax = start.x, ay = start.y, bx = end.x, by = end.y, L = Math.hypot(bx - ax, by - ay) || 1; maxOffStraight = Math.max(maxOffStraight, Math.abs((bx - ax) * (ay - s.y) - (ax - s.x) * (by - ay)) / L); }
        maxAbove = Math.max(maxAbove, s.above);
        if (s.marker !== document.querySelector("#sel .sg-mark")?.dataset.marker) wrong++;
      }
      return { from: a, to: c, glided: started, frames: S.length, settledByMs: Math.round(lastMove), maxDistFromTrackPx: +maxOff.toFixed(3), maxOffStraightPx: +maxOffStraight.toFixed(2), forms: [...new Set(S.map((s) => s.form))], markers: [...new Set(S.map((s) => s.marker))], nonRoundAbovePointFrames: S.filter((s) => s.above > 0).length, halo: [...new Set(S.map((s) => s.halo))] };
    }, [a, c]);
    glides.push(r);
  }
  // live tail morph with the latest stop selected
  const live = await p.evaluate(async () => {
    const V = window.__v;
    window.__eclipse.chart.select("latest");
    await new Promise((r) => setTimeout(r, 350));
    const before = V.snap();
    window.__eclipse.motion.step();
    const t0 = performance.now(), S = [];
    await new Promise((res) => { const tick = () => { const s = V.snap(); const lines = [...document.querySelectorAll('#plot-svg path[id^="ln-"]')]; const e = document.getElementById("end-dot"); if (s) S.push({ t: Math.round(performance.now() - t0), d: +V.dist(s.x, s.y, lines).toFixed(3), toEnd: e ? +Math.hypot(s.x - +e.getAttribute("cx"), s.y - +e.getAttribute("cy")).toFixed(3) : null, halo: s.halo, key: window.__eclipse.chart.selected }); if (performance.now() - t0 < 450) requestAnimationFrame(tick); else res(); }; requestAnimationFrame(tick); });
    const after = V.snap();
    window.__eclipse.motion.reset?.();
    return { before, after, frames: S.length, maxDistToLine: Math.max(...S.map((s) => s.d)), maxToEnd: Math.max(...S.map((s) => s.toEnd ?? 0)), haloStates: [...new Set(S.map((s) => s.halo))], haloVisibleFrames: S.filter((s) => s.halo !== "hidden").map((s) => s.t), keys: [...new Set(S.map((s) => s.key))] };
  });
  res[`${form}-${lang}`] = { glides, live, errors };
  await ctx.close();
  console.log(form, lang, JSON.stringify(glides.map((g) => `${g.from}->${g.to}:${g.glided ? "glide" : "cut"} ${g.settledByMs}ms off=${g.maxDistFromTrackPx} straight=${g.maxOffStraightPx} ${g.forms.join("/")} ${g.markers.join("")} above=${g.nonRoundAbovePointFrames}`)), "live", JSON.stringify({ frames: live.frames, maxDistToLine: live.maxDistToLine, maxToEnd: live.maxToEnd, halo: live.haloStates, haloVisibleFrames: live.haloVisibleFrames.length, after: live.after?.halo }), "errors", errors.length);
}
await b.close();
writeFileSync(`${OUT}/glide.json`, JSON.stringify(res, null, 1));
