// Adapted from the independent verifier's analyze-sweep.mjs, 2026-09-28. Definitions retained.
import { readdir, readFile } from 'node:fs/promises';
import { realErrors } from './geometry.mjs';
export async function analyzeRest(OUT, ver, base = null) {
const files = (await readdir(`${OUT}/sweep/${ver}`)).filter((f) => f.endsWith(".json")).sort();
const R = { ver, base, configs: {}, rule2: { min: Infinity, at: null, violations: 0, byView: {} }, rule1: {}, rule3: { counts: {}, maxDev: {}, largestShift: { v: 0, at: null }, mismatches: [] }, errors: [] };
const anchorOf = (r, snap) => {
  if (r.kind === "gap") return { x: r.x, y: snap.gapY };
  if (r.mx != null && r.mform !== "gap") return { x: r.mx, y: r.my };
  return { x: r.x, y: 14 + (r.H - 36 - 14) * 0.35 }; // still ahead without history: no marker
};
const dist = (l, t, w, h, ex, ey) => Math.hypot(Math.max(l - ex, 0, ex - l - w), Math.max(t - ey, 0, ey - t - h));
const modeOf = (r, a) => {
  if (Math.abs(r.l - (a.x + 12)) < 0.05) return "R";
  if (Math.abs(r.r - (a.x - 12)) < 0.05) return "L";
  if (Math.abs((r.l + r.r) / 2 - a.x) < 0.05) return "C";
  return "clamped";
};
for (const f of files) {
  const d = JSON.parse(await readFile(`${OUT}/sweep/${ver}/${f}`, "utf8"));
  const name = f.replace(".json", ""), view = `${d.width}x${d.height}`;
  d.errors = realErrors(d);
  if (d.errors.length) R.errors.push({ name, errors: d.errors.slice(0, 5), n: d.errors.length });
  let bd = null;
  if (base) { try { bd = JSON.parse(await readFile(`${OUT}/sweep/${base}/${f}`, "utf8")); } catch (error) { throw new Error(`Missing baseline rest: ${f}`, { cause: error }); } }
  const c = { fontOk: d.fontOk, snaps: d.snaps.length, rows: 0, minD: Infinity, minAt: null, viol: 0, tipW742: d.snaps[0].tipW, tipWMismatch: 0, widthNotTipW: 0, clip: 0, wrap: 0, outside: 0, spreadMax: 0, spreadAt: null, modes: {}, snapErr: 0 };
  for (let si = 0; si < d.snaps.length; si++) {
    const s = d.snaps[si];
    if (s.err) c.snapErr++;
    // rule 1: independent width
    const numbered = s.rows.filter((r) => r.numbered);
    const want = Math.ceil(Math.max(...numbered.map((r) => r.nw)) + 2);
    if (want !== s.tipW) c.tipWMismatch++;
    const groups = {};
    for (const r of s.rows) {
      if (r.hidden) continue;
      c.rows++;
      if (r.numbered && Math.abs(r.w - s.tipW) > 0.01) c.widthNotTipW++;
      if (r.sw > r.cw || r.w < r.nw - 0.01) c.clip++;
      if (Math.abs(r.h - r.nh) > 0.01) c.wrap++;
      if (r.l < -0.01 || r.t < -0.01 || r.r > r.W + 0.01 || r.b > r.H + 0.01) c.outside++;
      if (r.d < c.minD) { c.minD = r.d; c.minAt = `${s.nowM}:${r.key}`; }
      if (r.d < 11) c.viol++;
      const a = anchorOf(r, s), m = modeOf(r, a);
      c.modes[m] = (c.modes[m] || 0) + 1;
      if (r.vs != null) { const off = r.vs - a.x; (groups[m] ||= []).push(off); }
    }
    for (const [m, offs] of Object.entries(groups)) { const sp = Math.max(...offs) - Math.min(...offs); if (sp > c.spreadMax) { c.spreadMax = sp; c.spreadAt = `${s.nowM}:${m}`; } }
    // rule 3
    if (bd) {
      const bs = bd.snaps[si];
      if (!bs || bs.nowM !== s.nowM) continue;
      const bmap = new Map(bs.rows.map((r) => [r.key, r]));
      for (const r of s.rows) {
        const b = bmap.get(r.key);
        if (!b || r.hidden || b.hidden) continue;
        let cand, dl, dt, shift = 0;
        if (b.d >= 11) {
          cand = "unchanged"; dl = Math.abs(r.sl - b.sl); dt = Math.abs(r.st - b.st);
          if (dl > 0.0101 || dt > 0.0101) R.rule3.mismatches.push({ name, s: s.nowM, key: r.key, cand, style: [r.sl, r.st, b.sl, b.st], rendered: [r.l, r.t, b.l, b.t] });
        } else {
          const a = anchorOf(r, s), W = r.W, H = r.H, tw = r.w, th = r.h;
          const left = Math.max(2, Math.min(W - tw - 2, a.x - tw / 2));
          const above = a.y - th - 10, hasAbove = above >= 2 && above + th <= H - 2;
          let top = hasAbove ? above : Math.max(2, Math.min(H - th - 2, a.y + 12));
          cand = hasAbove ? "a" : "b";
          if (dist(left, top, tw, th, r.ex, r.ey) < 11) {
            const dx = Math.max(left - r.ex, 0, r.ex - left - tw), need = Math.sqrt(Math.max(0, 121 - dx * dx));
            const up = r.ey - need - th, dn = r.ey + need, ch = [];
            if (up >= 2) ch.push({ top: up, m: "c-up" });
            if (dn <= H - th - 2) ch.push({ top: dn, m: "c-down" });
            ch.sort((p, q) => Math.abs(p.top - top) - Math.abs(q.top - top) || (p.m === "c-up" ? -1 : 1));
            if (!ch.length) { cand = "none"; } else { shift = ch[0].top - top; top = ch[0].top; cand = `${cand}${ch[0].m}`; }
          }
          dl = Math.abs(r.sl - left); dt = Math.abs(r.st - top);
          const tol = cand.includes("c-") ? 0.06 : 0.011;
          if (dl > tol || dt > tol) R.rule3.mismatches.push({ name, s: s.nowM, key: r.key, cand, got: [r.sl, r.st], want: [+left.toFixed(3), +top.toFixed(3)], anchor: a, box: [tw, th], end: [r.ex, r.ey] });
          if (Math.abs(shift) > Math.abs(R.rule3.largestShift.v)) R.rule3.largestShift = { v: shift, at: `${name} ${s.nowM}:${r.key}` };
        }
        R.rule3.counts[cand] = (R.rule3.counts[cand] || 0) + 1;
        R.rule3.maxDev[cand] = Math.max(R.rule3.maxDev[cand] || 0, dl, dt);
      }
    }
  }
  R.configs[name] = c;
  if (c.minD < R.rule2.min) { R.rule2.min = c.minD; R.rule2.at = `${name} ${c.minAt}`; }
  R.rule2.violations += c.viol;
  const bv = (R.rule2.byView[view] ||= { min: Infinity, viol: 0, rows: 0 });
  bv.min = Math.min(bv.min, c.minD); bv.viol += c.viol; bv.rows += c.rows;
}
const cs = Object.values(R.configs);
R.rule1 = { tipW742: Object.fromEntries(Object.entries(R.configs).map(([k, v]) => [k, v.tipW742])), tipWMismatchSnaps: cs.reduce((s, c) => s + c.tipWMismatch, 0), widthNotTipW: cs.reduce((s, c) => s + c.widthNotTipW, 0), clip: cs.reduce((s, c) => s + c.clip, 0), wrap: cs.reduce((s, c) => s + c.wrap, 0), outside: cs.reduce((s, c) => s + c.outside, 0), spreadMax: Math.max(...cs.map((c) => c.spreadMax)), spreadAt: Object.entries(R.configs).sort((a, b) => b[1].spreadMax - a[1].spreadMax)[0].map((x) => (typeof x === "string" ? x : x.spreadAt)).join(" "), snapErr: cs.reduce((s, c) => s + c.snapErr, 0), fontOk: Object.fromEntries(Object.entries(R.configs).map(([k, v]) => [k, v.fontOk])) };
R.rule3.mismatchCount = R.rule3.mismatches.length;
R.rule3.mismatches = R.rule3.mismatches.slice(0, 40);
return R;
}
