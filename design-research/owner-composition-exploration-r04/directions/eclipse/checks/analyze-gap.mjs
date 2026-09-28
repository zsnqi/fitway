// Adapted from the independent verifier's gapdig.mjs: use the box-corner metric for the
// gap allowance, and retain pinned-edge violations as a diagnostic for width changes.
import { readdir, readFile } from 'node:fs/promises';
import { quantile } from './geometry.mjs';

export async function analyzeGap(OUT, ver, maxFrac) {
  const HF = 1000 / 60;
  const modeOf = (b, x) => Math.abs(b[0] - x - 12) < 0.06 ? 'R' :
    Math.abs(b[0] + b[2] - x + 12) < 0.06 ? 'L' : Math.abs(b[0] + b[2] / 2 - x) < 0.06 ? 'C' : 'other';
  const R = { transitions: 0, cornerViol: 0, pinViol: 0, pinOnlyWidth: 0,
    worstCorner: { ratio: 0 }, worstPin: { ratio: 0 }, modes: {},
    stj: 0, settledMismatch: 0, errors: 0, pageErrors: [], t99: [], t99gap: [] };
  for (const f of (await readdir(`${OUT}/hover/${ver}`)).sort()) {
    const d = JSON.parse(await readFile(`${OUT}/hover/${ver}/${f}`, 'utf8'));
    if (d.errors.length && !(d.fonts === 'fallback' && d.errors.every(e => e.includes('Failed to load resource: net::ERR_FAILED'))))
      R.pageErrors.push({ file: f, errors: d.errors });
    for (const sn of d.out) for (const t of sn.transitions) {
      const isGap = t.from === 'gap' || t.to === 'gap';
      if (t.err && isGap) R.errors++;
      if (!t.pre || t.frames.some(x => !x)) continue;
      const seq = [t.pre, ...t.frames], end = seq[seq.length - 1];
      const Dc = Math.hypot(end[0] - t.pre[0], end[1] - t.pre[1]);
      if (Dc > 0.5) {
        let n = seq.length - 1;
        while (n > 0 && Math.hypot(seq[n - 1][0] - end[0], seq[n - 1][1] - end[1]) <= 0.01 * Dc) n--;
        R.t99.push(n * HF);
        if (isGap) R.t99gap.push(n * HF);
      }
      if (!isGap) continue;
      R.transitions++;
      const mode = modeOf(t.rest || end, t.xTo);
      R.modes[mode] = (R.modes[mode] || 0) + 1;
      const pin = b => mode === 'L' ? b[0] + b[2] : mode === 'R' ? b[0] : b[0] + b[2] / 2;
      const Dp = Math.hypot(pin(end) - pin(t.pre), end[1] - t.pre[1]);
      let still = 0;
      for (let i = 1; i < seq.length; i++) {
        const sc = Math.hypot(seq[i][0] - seq[i - 1][0], seq[i][1] - seq[i - 1][1]);
        const ac = maxFrac * Dc + 0.5;
        const sp = Math.hypot(pin(seq[i]) - pin(seq[i - 1]), seq[i][1] - seq[i - 1][1]);
        const ap = maxFrac * Dp + 0.5;
        if (sc > ac) R.cornerViol++;
        if (sp > ap) { R.pinViol++; if (Math.abs(seq[i][2] - seq[i - 1][2]) > 0.5) R.pinOnlyWidth++; }
        if (sc / ac > R.worstCorner.ratio) R.worstCorner = {
          ratio: +(sc / ac).toFixed(4), step: +sc.toFixed(3), allowance: +ac.toFixed(3),
          file: f, minute: sn.snap, from: t.from, to: t.to, frame: i - 1,
        };
        if (sp / ap > R.worstPin.ratio) R.worstPin = {
          ratio: +(sp / ap).toFixed(4), step: +sp.toFixed(3), allowance: +ap.toFixed(3),
          file: f, minute: sn.snap, from: t.from, to: t.to, frame: i - 1,
        };
        const dPrev = Math.hypot(seq[i - 1][0] - end[0], seq[i - 1][1] - end[1]);
        if (sc < 0.05 && dPrev > 1) still++;
        else { if (still >= 2 && sc > 3) R.stj++; still = 0; }
      }
      if (!t.rest || Math.abs(end[0] - t.rest[0]) > 0.011 || Math.abs(end[1] - t.rest[1]) > 0.011) R.settledMismatch++;
    }
  }
  R.t99 = { median: quantile(R.t99, 0.5), p90: quantile(R.t99, 0.9), max: quantile(R.t99, 1) };
  R.t99gap = { median: quantile(R.t99gap, 0.5), p90: quantile(R.t99gap, 0.9), max: quantile(R.t99gap, 1) };
  return R;
}
