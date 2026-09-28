// The placement and pin definitions are the verifier's; layout adds measurements without acceptance thresholds.
export const realErrors = d => (d.errors || []).filter(e =>
  !(d.fonts === 'fallback' && e.includes('Failed to load resource: net::ERR_FAILED')));
export const pointDistance = (l, t, w, h, x, y) => Math.hypot(Math.max(l - x, 0, x - l - w), Math.max(t - y, 0, y - t - h));
export function anchorOf(r, snap) {
  if (r.kind === 'gap') return { x: r.x, y: snap.gapY };
  if (r.mx != null && r.mform !== 'gap') return { x: r.mx, y: r.my };
  return { x: r.x, y: 14 + (r.H - 36 - 14) * 0.35 };
}
export const modeOf = (r, a) => Math.abs(r.l - a.x - 12) < 0.05 ? 'R' :
  Math.abs(r.r - a.x + 12) < 0.05 ? 'L' : Math.abs((r.l + r.r) / 2 - a.x) < 0.05 ? 'C' : 'clamped';
export const quantile = (a, p) => {
  const s = a.slice().sort((x, y) => x - y);
  return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : null;
};

export const REST_EXTRAS = `window.__restExtra = () => {
  const plot = document.querySelector('#plot'), pr = plot.getBoundingClientRect();
  const tip = document.querySelector('#tip'), b = tip.getBoundingClientRect();
  const core = document.querySelector('#sel .sg-core');
  let ring = null;
  if (core) {
    const c = core.getBoundingClientRect();
    ring = { l: c.left - pr.left, t: c.top - pr.top, w: c.width, h: c.height,
      x: c.left + c.width / 2 - pr.left, y: c.top + c.height / 2 - pr.top, radius: c.width / 2 };
  }
  const axis = [...plot.querySelectorAll('svg > path')].find(p => p.getAttribute('stroke') === 'rgba(255,255,255,0.13)');
  if (!axis) throw new Error('Cannot measure the time axis');
  const label = plot.querySelector('.ax-x');
  return { ring, axisY: axis.getBoundingClientRect().top - pr.top,
    labelY: label ? label.getBoundingClientRect().top - pr.top : null };
};`;

// The API rounds response fractions to 0.001. Recover its unrounded curve from the API's time constants,
// verify it against chart.response(), then use the reference 0.01-ms scan for the per-frame allowance.
export async function readResponse(page) {
  const api = await page.evaluate(() => ({ timings: window.__eclipse.chart.timings,
    response: window.__eclipse.chart.response([0, 33, 66, 100, 133, 200, 266, 400, 800]) }));
  const { tau1: a, tau2: b } = api.timings;
  if (!(a > 0 && b > 0 && a !== b)) throw new Error('Invalid chart response time constants');
  const spring = t => {
    const r1 = -1 / a, r2 = -1 / b, B = -r1 / (r2 - r1), A = 1 - B;
    return A * Math.exp(r1 * t) + B * Math.exp(r2 * t);
  };
  for (const r of api.response) if (Math.abs(r.fraction - (1 - spring(r.ms))) > 0.000500001)
    throw new Error('chart.response() differs from its declared response curve');
  let maxFrac = 0;
  for (let t = 0; t < 800; t += 0.01) maxFrac = Math.max(maxFrac, spring(t) - spring(t + 1000 / 60));
  return { ...api, maxFrac };
}

export function decorateRest(d) {
  for (const s of d.snaps) for (const r of s.rows) {
    if (r.hidden) continue;
    const a = anchorOf(r, s);
    r.mode = modeOf(r, a);
    const above = a.y - r.h - 10;
    const hasAbove = above >= 2 && above + r.h <= r.H - 2;
    const below = Math.max(2, Math.min(r.H - r.h - 2, a.y + 12));
    const origin = hasAbove ? above : below;
    const centered = Math.max(2, Math.min(r.W - r.w - 2, a.x - r.w / 2));
    r.candidate = ['R', 'L'].includes(r.mode) ? `${r.mode}-${r.t < a.y ? 'above' : 'below'}` :
      Math.abs(r.sl - centered) < 0.011 ?
        Math.abs(r.st - origin) < 0.011 ? hasAbove ? 'a' : 'b' : `${hasAbove ? 'a' : 'b'}+${r.st < origin ? 'up' : 'down'}` : 'clamped';
  }
  return d;
}
