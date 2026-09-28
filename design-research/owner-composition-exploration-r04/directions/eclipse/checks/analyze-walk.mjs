// Adapted from the independent verifier's analyze-walk.mjs, 2026-09-28. Definitions retained.
import { readdir, readFile } from 'node:fs/promises';
import { realErrors } from './geometry.mjs';
export async function analyzeWalk(OUT, ver, restVer = ver, maxFrac) {
const HF = 1000 / 60;
const U = (f) => (f && f[0] != null ? { l: f[0], t: f[1], w: f[2], h: f[3], mx: f[4], my: f[5], ex: f[6], ey: f[7], fa: f[8], la: f[9], ti: f[10] } : null);
const modeOf = (b, x) => (x == null ? "?" : Math.abs(b.l - (x + 12)) < 0.06 ? "R" : Math.abs(b.l + b.w - (x - 12)) < 0.06 ? "L" : Math.abs(b.l + b.w / 2 - x) < 0.06 ? "C" : "other");
const pinX = (b, m) => (m === "L" ? b.l + b.w : m === "R" ? b.l : b.l + b.w / 2);

const sweeps = {};
async function sweep(cfg) {
  if (sweeps[cfg] !== undefined) return sweeps[cfg];
  try {
    const d = JSON.parse(await readFile(`${OUT}/sweep/${restVer}/${cfg}-1440x900.json`, "utf8"));
    const m = new Map();
    for (const s of d.snaps) m.set(s.nowM, new Map(s.rows.map((r) => [r.key, r])));
    sweeps[cfg] = m;
  } catch (error) { throw new Error(`Missing rest reference: ${cfg}`, { cause: error }); }
  return sweeps[cfg];
}
const S = { ver, maxFrac, steps: 0, restChangedCases: 0, restChangedCovered: 0, casesMoved: 0, allowViol: 0, worst: { ratio: 0 }, stj: 0, still: 0, settleMismatch: 0, notSettled: 0, textMid: 0, appearLate: 0, errors: [], rule5: { steps: 0, frames: 0, maxDev: 0, viol: 0, worst: null, byMode: {}, centerSteps: 0, centerMaxDev: 0 }, settleMs: [], examples: { allow: [], stj: [], still: [], settle: [], rule5: [], text: [] }, byConfig: {} };
const cfgs = (await readdir(`${OUT}/walk/${ver}`)).sort();
for (const cfg of cfgs) {
  const sw = await sweep(cfg);
  const B = (S.byConfig[cfg] = { steps: 0, cases: 0, allowViol: 0, worst: 0, stj: 0, still: 0, settleMismatch: 0, rule5Viol: 0, rule5Steps: 0 });
  for (const kf of (await readdir(`${OUT}/walk/${ver}/${cfg}`)).sort()) {
    const d = JSON.parse(await readFile(`${OUT}/walk/${ver}/${cfg}/${kf}`, "utf8"));
    const key = kf.replace(".json", "");
    const realErr = d.errors.filter((e) => !(d.fonts === "fallback" && e.includes("Failed to load resource: net::ERR_FAILED"))); if (realErr.length) S.errors.push({ cfg, key, errors: realErr.slice(0, 3), n: realErr.length });
    for (const st of d.steps) {
      S.steps++; B.steps++;
      const pre = U(st.pre), post = U(st.post);
      const r0 = sw?.get(st.s)?.get(key), r1 = sw?.get(st.s + 1)?.get(key);
      const selPre = st.sel0 === key;
      // the rest placement before and after (reduced-motion sweep)
      const changed = r0 && r1 && (Math.abs(r0.l - r1.l) > 0.01 || Math.abs(r0.t - r1.t) > 0.01);
      if (changed) { S.restChangedCases++; B.cases++; if (selPre) S.restChangedCovered++; }
      if (!selPre) continue;
      // settled equals rest
      if (r1) {
        if (!post || Math.abs(post.l - r1.l) > 0.011 || Math.abs(post.t - r1.t) > 0.011) { S.settleMismatch++; B.settleMismatch++; if (S.examples.settle.length < 20) S.examples.settle.push({ cfg, key, s: st.s, post: post && [post.l, post.t], rest: [r1.l, r1.t] }); }
      } else if (post) { S.settleMismatch++; B.settleMismatch++; if (S.examples.settle.length < 20) S.examples.settle.push({ cfg, key, s: st.s, post: [post.l, post.t], rest: "none (stop gone)" }); }
      if (post && (post.fa || post.la)) S.notSettled++;
      if (!st.frames) continue;
      const fr = st.frames.map(U);
      if (!pre || !post) { if (post && !fr[0]) S.appearLate++; if (!post && fr[0]) S.appearLate++; continue; }
      // text changes at once: every frame shows the same text as the first
      if (fr.some((f) => f && f.ti !== fr[0].ti)) { S.textMid++; if (S.examples.text.length < 10) S.examples.text.push({ cfg, key, s: st.s }); }
      const mPost = modeOf(post, post.mx ?? r1?.x), mPre = modeOf(pre, pre.mx ?? r0?.x);
      const pin = (b) => ({ x: pinX(b, mPost === "other" ? "C" : mPost), y: b.t });
      const P = [pre, ...fr].map(pin), end = P[P.length - 1];
      const D = Math.hypot(end.x - P[0].x, end.y - P[0].y);
      if (D > 0.01) { S.casesMoved++; }
      const allow = maxFrac * D + 0.5;
      const stepv = [], distv = [];
      for (let i = 1; i < P.length; i++) { stepv.push(Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y)); distv.push(Math.hypot(P[i].x - end.x, P[i].y - end.y)); }
      stepv.forEach((s, i) => {
        if (s > allow) { S.allowViol++; B.allowViol++; if (S.examples.allow.length < 30) S.examples.allow.push({ cfg, key, s: st.s, frame: i, step: +s.toFixed(3), allow: +allow.toFixed(3), D: +D.toFixed(3), modes: `${mPre}>${mPost}` }); }
        const ratio = s / allow; if (ratio > S.worst.ratio) S.worst = { ratio: +ratio.toFixed(4), cfg, key, s: st.s, frame: i, step: +s.toFixed(3), allow: +allow.toFixed(3), D: +D.toFixed(3) };
        if (ratio > B.worst) B.worst = +ratio.toFixed(4);
      });
      // stall then jump, and a still frame
      let run = 0;
      for (let i = 0; i < stepv.length; i++) {
        if (stepv[i] < 0.05 && (i === 0 ? Math.hypot(P[0].x - end.x, P[0].y - end.y) : distv[i - 1]) > 1) run++;
        else { if (run >= 2 && stepv[i] > 3) { S.stj++; B.stj++; if (S.examples.stj.length < 20) S.examples.stj.push({ cfg, key, s: st.s, frame: i }); } run = 0; }
        if (i + 1 < stepv.length && stepv[i] < 0.02 && distv[i] > 0.3 && stepv[i + 1] > 0.1) { S.still++; B.still++; if (S.examples.still.length < 20) S.examples.still.push({ cfg, key, s: st.s, frame: i, dist: +distv[i].toFixed(3) }); }
      }
      // a still frame exactly at the morph's end: moving before and after, not at the frame where the clock ends
      const eI = fr.findIndex((f, i) => i > 0 && f.la === 0 && fr[i - 1].la === 1);
      if (eI > 0) for (const i of [eI - 1, eI, eI + 1]) if (i > 0 && i + 1 < stepv.length && stepv[i - 1] > 0.05 && stepv[i] < 0.02 && stepv[i + 1] > 0.05 && distv[i] > 0.3) { S.stillAtMorphEnd = (S.stillAtMorphEnd || 0) + 1; (S.examples.stillEnd ||= []).length < 10 && S.examples.stillEnd.push({ cfg, key, s: st.s, frame: i }); }
      // a delayed start: motionless from the reading for 2+ frames while more than 1 px from rest, then moving
      let k0 = 0;
      while (k0 < stepv.length && stepv[k0] < 0.05 && (k0 === 0 ? D : distv[k0 - 1]) > 1) k0++;
      if (k0 >= 2 && k0 < stepv.length) { S.delayedStart = (S.delayedStart || 0) + 1; (S.delayedFrames ||= []).push(k0); if ((S.examples.delayed ||= []).length < 12) S.examples.delayed.push({ cfg, key, s: st.s, stillFrames: k0, firstStep: +stepv[k0].toFixed(2), allow: +allow.toFixed(2), D: +D.toFixed(1), modes: `${mPre}>${mPost}` }); }
      let n = distv.length;
      while (n > 0 && distv[n - 1] <= 0.1) n--;
      if (D > 0.5) S.settleMs.push(+(n * HF).toFixed(1));
      // rule 5: width change with the side mode kept
      if (st.tipW0 !== st.tipW1) {
        if (mPre === mPost && (mPre === "R" || mPre === "L")) {
          S.rule5.steps++; B.rule5Steps++;
          let worst = 0;
          for (const f of [pre, ...fr]) {
            const x = f.mx ?? r1?.x; const edge = mPre === "R" ? f.l - x : x - (f.l + f.w);
            const dev = Math.abs(edge - 12); S.rule5.frames++;
            if (dev > worst) worst = dev;
          }
          (S.rule5.byMode[mPre] ||= { steps: 0, maxDev: 0 }).steps++;
          S.rule5.byMode[mPre].maxDev = Math.max(S.rule5.byMode[mPre].maxDev, worst);
          if (worst > S.rule5.maxDev) { S.rule5.maxDev = +worst.toFixed(4); S.rule5.worst = { cfg, key, s: st.s, mode: mPre, tipW: [st.tipW0, st.tipW1] }; }
          if (worst > 0.5) { S.rule5.viol++; B.rule5Viol++; if (S.examples.rule5.length < 20) S.examples.rule5.push({ cfg, key, s: st.s, mode: mPre, worst: +worst.toFixed(3) }); }
        } else if (mPre === mPost && mPre === "C") {
          S.rule5.centerSteps++;
          for (const f of [pre, ...fr]) { const x = f.mx ?? r1?.x; S.rule5.centerMaxDev = Math.max(S.rule5.centerMaxDev, Math.abs(f.l + f.w / 2 - x)); }
        }
      }
    }
  }
}
const sm = S.settleMs.slice().sort((a, b) => a - b);
S.settleStats = { n: sm.length, median: sm[Math.floor(sm.length / 2)], p90: sm[Math.floor(sm.length * 0.9)], max: sm[sm.length - 1] };
delete S.settleMs;
return S;
}
