// The FITWAY mark and its drafting construction (after reference B), as a function of film time t.
// Geometry: mark-geometry.json, fitted to brand/fitway-logo.png (mark-fit/: RMS 0.27 px, max 1.40 px at 1024).
// The construction draws the fitted circles (centre and base radius) and the 45-degree lines; the fill is the
// measured outline. A stroke arrives in FITWAY red while it is being drawn and relaxes to chalk (BRIEF: one accent).
import { BAR, BEAT, prog, clamp01, EASE, lmix } from './eclipse.js';

const T0 = 14 * BAR;          // bar 15 downbeat, 26.25 s: the cut in from the laptop's end point
const S16 = BEAT / 4;         // a 16th, 0.1171875 s
const T_LOCK = 15 * BAR;      // bar 16 downbeat, 28.125 s: the construction clears, the lockup assembles
const RELAX = 0.12;           // red -> chalk after a stroke completes (so only the stroke being drawn is red)

export const MARK_STYLE = `<style>
  .cl { fill: none; stroke-linecap: round; vector-effect: non-scaling-stroke; }
</style>`;

let GEO = null;
export async function loadMark() {
  if (!GEO) GEO = await (await fetch('./mark-geometry.json')).json();
  return GEO;
}

// Mark units (the 1024 box) -> screen, for the construction (big, centred on the ring's centre) and the lockup.
const C = { x: 513.44, y: 510.67 };            // the outer ring's centre
const BIG = 680 / (2 * 393.21);                // the ring's outer diameter is 680 px during construction
export const LOCK = (() => {
  // Lockup, setting B of the lockup sheet: the mark's ring height = 2.3 x the name's cap height, gap 0.42 x the
  // ring height, Readex Pro 500 at 0.12 em; lockup about 41% of the frame's width, centred a little above centre.
  const size = 112;                  // wordmark px
  const cap = size * 0.7;            // Readex Pro cap height (measured in marksheet.html: 0.70 em)
  const ringH = 2.3 * cap;           // 180 px
  const s = ringH / (2 * 393.21);
  const gap = 0.42 * ringH;
  const wordW = 506;                 // measured "FITWAY" at 112 px, 0.12 em, minus the last letter's tracking
  const total = ringH + gap + wordW;
  const left = 960 - total / 2;
  const cy = 520;
  return { size, s, ringH, gap, total, markCx: left + ringH / 2, cy, wordX: left + ringH + gap, baseline: cy + cap / 2 };
})();

/** Where the mark sits at time t: construction placement until bar 16, then an eased move to the lockup, then the
 *  lockup's slow push (8% across the 3.5 s hold, so the hold builds rather than sits). */
export function markPlace(t) {
  const p = prog(t, T_LOCK, T_LOCK + 0.42, EASE.cam);
  const s = lmix(BIG, LOCK.s, p);
  const x = 960 + (LOCK.markCx - 960) * p;
  const y = 540 + (LOCK.cy - 540) * p;
  const push = lmix(1, 1.08, prog(t, T_LOCK + 0.42, 32, (u) => u));
  return { s: s * push, x: 960 + (x - 960) * push, y: 540 + (y - 540) * push, push };
}

// One construction stroke: start, duration (in 16ths from bar 15), and its element.
function strokes(g) {
  const out = [];
  const add = (at, dur, el) => out.push({ at: T0 + at * S16, dur: dur * S16, el });
  const circle = (k) => g.circles[k];
  const lineEl = (name, len = 2400) => {
    const L = g.lines[name], th = (L.angle * Math.PI) / 180, n = [Math.cos(th), Math.sin(th)], t = [-n[1], n[0]];
    // centre the segment on the point nearest the ring's centre
    const d = n[0] * C.x + n[1] * C.y - L.c;
    const p = [C.x - n[0] * d, C.y - n[1] * d];
    return { kind: 'line', a: [p[0] - t[0] * len / 2, p[1] - t[1] * len / 2], b: [p[0] + t[0] * len / 2, p[1] + t[1] * len / 2] };
  };
  const cutEl = (name, near, half = 90) => {
    const L = g.lines[name], th = (L.angle * Math.PI) / 180, n = [Math.cos(th), Math.sin(th)], t = [-n[1], n[0]];
    const d = n[0] * near[0] + n[1] * near[1] - L.c;
    const p = [near[0] - n[0] * d, near[1] - n[1] * d];
    return { kind: 'line', a: [p[0] - t[0] * half, p[1] - t[1] * half], b: [p[0] + t[0] * half, p[1] + t[1] * half] };
  };
  const D = g.dot;
  const BAND = 560; // the chevron's band lines run this far either side of the ring's centre (mark units)
  // 1. the reading's own circle (the dot is already there, red: the reading from the laptop); no centre crosses, which read as crop marks
  add(0, 2, { kind: 'circle', cx: D.cx, cy: D.cy, r: D.r + 14, from: -90 });
  // 2. compass sweeps: the ring, then the inner arcs' circles, each from the opening
  add(1.5, 3.5, { kind: 'circle', ...circle('RO'), from: 135 });
  add(2.5, 3.5, { kind: 'circle', ...circle('RI'), from: 135 });
  add(3.5, 3, { kind: 'circle', ...circle('AO2'), from: 135 });
  add(4.5, 3, { kind: 'circle', ...circle('AI2'), from: 135 });
  add(5, 3, { kind: 'circle', ...circle('AI3'), from: 135 });
  // 3. the chevron's bands, as long lines past the ring
  add(6, 2, lineEl('u1', 2 * BAND)); add(6.5, 2, lineEl('u2', 2 * BAND)); add(7, 2, lineEl('l1', 2 * BAND)); add(7.5, 2, lineEl('l2', 2 * BAND));
  // 4. the cuts: the opening in the ring, the inner arcs' ends, the arm's end
  const nr = g.nodes;
  add(8.5, 1.5, cutEl('g1', nr.ring[0], 70)); add(9, 1.5, cutEl('g2', nr.ring[1], 70));
  add(9.5, 1.5, cutEl('c2a', nr.arc2[0], 70)); add(10, 1.5, cutEl('c2b', nr.arc2[2], 70));
  add(10.5, 1.5, cutEl('c3', nr.arc3[0], 70)); add(11, 1.5, cutEl('capL', nr.arms[4], 60));
  return out;
}
const NODE_AT = 11.5, FILL_AT = { ring: 12, arc2: 13, arc3: 13.5, armU: 14, armL: 14, dot: 15 };

function strokeSVG(st, t, X, s) {
  const p = clamp01((t - st.at) / st.dur);
  if (p <= 0) return '';
  const e = EASE.outSoft(p);
  const since = t - (st.at + st.dur);
  const red = since < 0 ? 1 : 1 - clamp01(since / RELAX);
  const col = mixHex('#f5f3f2', '#ff2946', red);
  const op = (0.34 + 0.66 * red).toFixed(3);
  const w = (1.25 + 0.5 * red).toFixed(2);
  const el = st.el;
  const attrs = `class="cl" stroke="${col}" stroke-opacity="${op}" stroke-width="${w}"`;
  if (el.kind === 'circle') {
    const cx = X(el.cx, el.cy), r = el.r * s, c = 2 * Math.PI * r;
    return `<circle ${attrs} cx="${cx[0].toFixed(2)}" cy="${cx[1].toFixed(2)}" r="${r.toFixed(2)}" stroke-dasharray="${(c * e).toFixed(2)} ${c.toFixed(2)}" transform="rotate(${el.from} ${cx[0].toFixed(2)} ${cx[1].toFixed(2)})"/>`;
  }
  if (el.kind === 'line') {
    const a = X(...el.a), b = X(...el.b);
    const m = [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e];
    return `<line ${attrs} x1="${a[0].toFixed(2)}" y1="${a[1].toFixed(2)}" x2="${m[0].toFixed(2)}" y2="${m[1].toFixed(2)}"/>`;
  }
  if (el.kind === 'cross') {
    const c = X(el.cx, el.cy), r = el.r * e;
    return `<path ${attrs} d="M${(c[0] - r).toFixed(2)} ${c[1].toFixed(2)}H${(c[0] + r).toFixed(2)}M${c[0].toFixed(2)} ${(c[1] - r).toFixed(2)}V${(c[1] + r).toFixed(2)}"/>`;
  }
  return '';
}

/** The whole film-layer drawing at time t (bars 15-17): construction, fills, and the mark's move to the lockup. */
export function constructionSVG(g, t) {
  const P = markPlace(t);
  const X = (x, y) => [P.x + (x - C.x) * P.s, P.y + (y - C.y) * P.s];
  const clear = 1 - prog(t, T_LOCK, T_LOCK + 0.5, EASE.outSoft); // the construction clears as the lockup assembles
  let s = '';
  if (clear > 0) {
    s += `<g opacity="${clear.toFixed(3)}">`;
    for (const st of strokes(g)) s += strokeSVG(st, t, X, P.s);
    // intersection nodes: small hollow rings, one per 32nd
    const nodes = [...g.nodes.ring, ...g.nodes.arc2, ...g.nodes.arc3, ...g.nodes.arms.slice(0, 4)];
    nodes.forEach((n, i) => {
      const at = T0 + (NODE_AT + i * 0.25) * S16;
      if (t < at) return;
      const q = EASE.outSoft(clamp01((t - at) / (2 * S16)));
      const c = X(n[0], n[1]);
      s += `<circle class="cl" cx="${c[0].toFixed(2)}" cy="${c[1].toFixed(2)}" r="${(4.5 * q).toFixed(2)}" stroke="#f5f3f2" stroke-opacity="0.6" stroke-width="1.25"/>`;
    });
    s += '</g>';
  }
  s += markGroup(g, t, P);
  return s;
}

/** The filled mark: each piece fills when its outline is complete; the dot is the reading, red until the mark is
 *  whole, then it relaxes to the mark's white. */
export function markGroup(g, t, P = markPlace(t)) {
  const tr = `translate(${P.x.toFixed(3)} ${P.y.toFixed(3)}) scale(${P.s.toFixed(5)}) translate(${-C.x} ${-C.y})`;
  let s = `<g transform="${tr}">`;
  for (const k of ['ring', 'arc2', 'arc3', 'armU', 'armL']) {
    const at = T0 + FILL_AT[k] * S16;
    const o = prog(t, at, at + 0.1);
    if (o > 0) s += `<path d="${g.paths[k]}" fill="#ffffff" fill-opacity="${o.toFixed(3)}"/>`;
  }
  const dAt = T0 + FILL_AT.dot * S16;
  const white = prog(t, dAt, dAt + RELAX);
  const D = g.dot;
  if (t >= T0 - 1) s += `<circle cx="${D.cx}" cy="${D.cy}" r="${D.r}" fill="${mixHex('#ff2946', '#ffffff', white)}"/>`;
  return s + '</g>';
}

function mixHex(a, b, p) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * clamp01(p)).toString(16).padStart(2, '0')).join('');
}
