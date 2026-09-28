// Adapted from rule3dig.mjs: the verifier's final, rendered-geometry classification supersedes
// analyze-sweep.mjs's ideal-coordinate comparison (which has 196 false positives in its saved reference).
import { readdir, readFile } from 'node:fs/promises';
import { pointDistance as dist, anchorOf } from './geometry.mjs';

export async function analyzeMinimal(OUT, ver, base) {
  const R = { total: 0, unchanged: 0, unchangedMismatch: 0, counts: {}, disagree: [],
    shiftExcess: { max: 0, at: null, over02: 0 }, wrongDir: [], notCentred: 0, heightRounded: 0,
    largestShift: { v: 0, at: null }, byView: {} };
  let disagreeCount = 0, wrongDirCount = 0;
  for (const f of (await readdir(`${OUT}/sweep/${ver}`)).sort()) {
    const h = JSON.parse(await readFile(`${OUT}/sweep/${ver}/${f}`, 'utf8'));
    const b = JSON.parse(await readFile(`${OUT}/sweep/${base}/${f}`, 'utf8'));
    const view = f.slice(0, -5).split('-').pop();
    if (h.snaps.length !== b.snaps.length) throw new Error('Baseline snapshot coverage differs');
    for (let i = 0; i < h.snaps.length; i++) {
      const hs = h.snaps[i], bs = b.snaps[i], bm = new Map(bs.rows.map(r => [r.key, r]));
      if (hs.nowM !== bs.nowM) throw new Error('Baseline minute differs');
      for (const r of hs.rows) {
        const o = bm.get(r.key);
        if (!o || r.hidden || o.hidden) continue;
        if (o.d >= 11) {
          R.unchanged++;
          if (Math.abs(r.sl - o.sl) > 0.0101 || Math.abs(r.st - o.st) > 0.0101) R.unchangedMismatch++;
          continue;
        }
        R.total++;
        const a = anchorOf(r, hs), W = r.W, H = r.H, tw = r.w, th = r.h;
        const left = Math.max(2, Math.min(W - tw - 2, a.x - tw / 2));
        if (Math.abs(r.sl - left) > 0.011) R.notCentred++;
        const topA = a.y - th - 10, hasA = topA >= 2 && topA + th <= H - 2;
        const topB = Math.max(2, Math.min(H - th - 2, a.y + 12)), origin = hasA ? topA : topB;
        let got;
        if (Math.abs(r.st - topA) <= 0.011 && hasA) got = 'a';
        else if (Math.abs(r.st - topB) <= 0.011 && !hasA) got = 'b';
        else if (Math.abs(r.st - (a.y - Math.round(th) - 10)) <= 0.011) { got = 'a(rounded height)'; R.heightRounded++; }
        else got = (hasA ? 'a' : 'b') + (r.st < origin ? 'c-up' : 'c-down');
        R.counts[got] = (R.counts[got] || 0) + 1;
        (R.byView[view] ||= {})[got] = (R.byView[view][got] || 0) + 1;
        const dBase = dist(left, origin, tw, th, r.ex, r.ey);
        const disagreement = message => { disagreeCount++; if (R.disagree.length < 20) R.disagree.push({ f, minute: hs.nowM, key: r.key, got, ...message }); };
        if (got === 'a' || got === 'b') { if (dBase < 10.95) disagreement({ dBase, rendered: r.d }); continue; }
        if (got.startsWith('a(')) continue;
        if (dBase >= 11.05) disagreement({ reason: 'shift although base clears', dBase, shift: r.st - origin });
        const excess = r.d - 11;
        if (excess > R.shiftExcess.max) R.shiftExcess = { ...R.shiftExcess, max: +excess.toFixed(4), at: `${f} ${hs.nowM}:${r.key}` };
        if (excess > 0.2) R.shiftExcess.over02++;
        const dx = Math.max(left - r.ex, 0, r.ex - left - tw), need = Math.sqrt(Math.max(0, 121 - dx * dx));
        const up = r.ey - need - th, down = r.ey + need, okUp = up >= 2, okDown = down <= H - th - 2;
        const preference = okUp && okDown ? Math.abs(up - origin) <= Math.abs(down - origin) + 0.05 ?
          Math.abs(Math.abs(up - origin) - Math.abs(down - origin)) < 0.5 ? 'tie' : 'up' : 'down' : okUp ? 'up' : okDown ? 'down' : 'none';
        const direction = got.endsWith('up') ? 'up' : 'down';
        if (preference !== 'tie' && preference !== direction) {
          wrongDirCount++; if (R.wrongDir.length < 20) R.wrongDir.push({ f, minute: hs.nowM, key: r.key, got, preference });
        }
        const shift = r.st - origin;
        if (Math.abs(shift) > Math.abs(R.largestShift.v)) R.largestShift = { v: +shift.toFixed(2), at: `${f} ${hs.nowM}:${r.key}` };
      }
    }
  }
  R.counts = { unchanged: R.unchanged, ...R.counts };
  R.disagreeCount = disagreeCount; R.wrongDirCount = wrongDirCount;
  R.mismatchCount = R.unchangedMismatch + disagreeCount + wrongDirCount + R.notCentred + R.heightRounded + R.shiftExcess.over02;
  return R;
}
