// Adapted from the independent verifier's analyze-hover.mjs, 2026-09-28. Definitions retained.
import { readdir, readFile } from 'node:fs/promises';
import { realErrors } from './geometry.mjs';
export async function analyzeHover(OUT, vers, maxFrac) {
const HF = 1000 / 60;
const modeOf = (b, x) => (Math.abs(b[0] - (x + 12)) < 0.06 ? "R" : Math.abs(b[0] + b[2] - (x - 12)) < 0.06 ? "L" : Math.abs(b[0] + b[2] / 2 - x) < 0.06 ? "C" : "other");
const pinX = (b, m) => (m === "L" ? b[0] + b[2] : m === "R" ? b[0] : b[0] + b[2] / 2);
const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : null; };

const res = {};
const settleBy = {};
for (const ver of vers) {
  const R = (res[ver] = { transitions: 0, moved: 0, errors: 0, pageErrors: [], settleMismatch: 0, notSettled: 0, stj: 0, allowViol: 0, worst: { ratio: 0 }, textMid: 0, gap: { transitions: 0, allowViol: 0, stj: 0, settleMismatch: 0, worst: { ratio: 0 }, examples: [] }, examples: { stj: [], allow: [], settle: [] }, byState: {} });
  settleBy[ver] = new Map();
  let files = [];
  try { files = (await readdir(`${OUT}/hover/${ver}`)).filter((f) => f.endsWith(".json")); } catch {}
  for (const f of files) {
    const d = JSON.parse(await readFile(`${OUT}/hover/${ver}/${f}`, "utf8"));
    const cfg = f.replace(".json", "");
    d.errors = realErrors(d);
    if (d.errors.length) R.pageErrors.push({ cfg, n: d.errors.length, first: d.errors[0] });
    const BS = (R.byState[d.state] ||= { settle: [], stj: 0, allowViol: 0 });
    for (const sn of d.out) for (const t of sn.transitions) {
      R.transitions++;
      const isGap = t.from === "gap" || t.to === "gap";
      if (isGap) R.gap.transitions++;
      if (t.err) R.errors++;
      const fr = t.frames, last = fr[fr.length - 1];
      if (!t.rest || !last || Math.abs(last[0] - t.rest[0]) > 0.011 || Math.abs(last[1] - t.rest[1]) > 0.011) {
        R.settleMismatch++; if (isGap) R.gap.settleMismatch++;
        if (R.examples.settle.length < 20) R.examples.settle.push({ cfg, snap: sn.snap, from: t.from, to: t.to, last: last && last.slice(0, 2), rest: t.rest && t.rest.slice(0, 2) });
      }
      if (t.active) R.notSettled++;
      if (!t.pre || fr.some((x) => !x)) continue;
      if (fr.some((x) => x[4] !== fr[0][4])) R.textMid++;
      const m = modeOf(t.rest || last, t.xTo);
      const P = [t.pre, ...fr].map((b) => ({ x: pinX(b, m === "other" ? "C" : m), y: b[1] })), end = P[P.length - 1];
      const D = Math.hypot(end.x - P[0].x, end.y - P[0].y), allow = maxFrac * D + 0.5;
      const stepv = [], distv = [];
      for (let i = 1; i < P.length; i++) { stepv.push(Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y)); distv.push(Math.hypot(P[i].x - end.x, P[i].y - end.y)); }
      stepv.forEach((s, i) => {
        const ratio = s / allow;
        if (s > allow) { R.allowViol++; BS.allowViol++; if (isGap) R.gap.allowViol++; if (R.examples.allow.length < 20) R.examples.allow.push({ cfg, snap: sn.snap, from: t.from, to: t.to, frame: i, step: +s.toFixed(3), allow: +allow.toFixed(3) }); }
        if (ratio > R.worst.ratio) R.worst = { ratio: +ratio.toFixed(4), cfg, snap: sn.snap, from: t.from, to: t.to, frame: i, step: +s.toFixed(3), allow: +allow.toFixed(3) };
        if (isGap && ratio > R.gap.worst.ratio) R.gap.worst = { ratio: +ratio.toFixed(4), cfg, snap: sn.snap, from: t.from, to: t.to, frame: i, step: +s.toFixed(3), allow: +allow.toFixed(3) };
      });
      let run = 0;
      for (let i = 0; i < stepv.length; i++) {
        const dPrev = i === 0 ? D : distv[i - 1];
        if (stepv[i] < 0.05 && dPrev > 1) run++;
        else { if (run >= 2 && stepv[i] > 3) { R.stj++; BS.stj++; if (isGap) { R.gap.stj++; if (R.gap.examples.length < 10) R.gap.examples.push({ cfg, snap: sn.snap, from: t.from, to: t.to, frame: i, jump: +stepv[i].toFixed(2), stalled: run }); } if (R.examples.stj.length < 20) R.examples.stj.push({ cfg, snap: sn.snap, from: t.from, to: t.to, frame: i, jump: +stepv[i].toFixed(2), stalled: run }); } run = 0; }
      }
      let n = distv.length;
      while (n > 0 && distv[n - 1] <= 0.1) n--;
      const ms = n * HF;
      if (D > 0.5) { R.moved++; BS.settle.push(ms); settleBy[ver].set(`${cfg}|${sn.snap}|${t.from}|${t.to}`, { ms, gap: isGap }); }
    }
  }
  const all = [...settleBy[ver].values()].map((v) => v.ms), nongap = [...settleBy[ver].values()].filter((v) => !v.gap).map((v) => v.ms), gapv = [...settleBy[ver].values()].filter((v) => v.gap).map((v) => v.ms);
  R.settle = { n: all.length, median: q(all, 0.5), p90: q(all, 0.9), max: q(all, 1), nonGap: { median: q(nongap, 0.5), p90: q(nongap, 0.9) }, gap: { n: gapv.length, median: q(gapv, 0.5), p90: q(gapv, 0.9), max: q(gapv, 1) } };
  for (const [s, v] of Object.entries(R.byState)) { R.byState[s] = { median: q(v.settle, 0.5), p90: q(v.settle, 0.9), n: v.settle.length, stj: v.stj, allowViol: v.allowViol }; }
}
// paired comparison against the baseline
const baseV = vers[0];
for (const ver of vers.slice(1)) {
  let slower = 0, paired = 0, onlyHere = 0;
  const a = [], b = [];
  for (const [k, v] of settleBy[ver]) {
    const bv = settleBy[baseV].get(k);
    if (!bv) { onlyHere++; continue; }
    paired++; a.push(bv.ms); b.push(v.ms);
    if (v.ms > bv.ms + HF + 1e-6) slower++;
  }
  res[ver].vsBase = { base: baseV, paired, onlyHere, slowerByMoreThanOneFrame: slower, pairedBase: { median: q(a, 0.5), p90: q(a, 0.9) }, pairedThis: { median: q(b, 0.5), p90: q(b, 0.9) } };
}
return { maxFrac, res };
}
