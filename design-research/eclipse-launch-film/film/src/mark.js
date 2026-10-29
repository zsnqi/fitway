// The FITWAY mark and its drafting construction (after reference B), as a function of the frame.
// Geometry: assets/mark-geometry.json, fitted to brand/fitway-logo.png (storyboard/src/mark-fit/: RMS 0.27 px at 1024).
// The construction draws the fitted circles and the 45-degree lines; the fill is the measured outline. A stroke arrives in
// FITWAY red as it starts and relaxes to chalk within a 16th and a half (FILM.CONSTRUCT.relax), so the red is the pen,
// never the drawing (BRIEF: one accent, one meaning). Timing is FILM.CONSTRUCT on bar 15's 16ths.
const { E, clamp, prog, lmix, b } = window.MOTION;
const { CUE, CONSTRUCT, DUR, MOVE, S16, TOTAL } = window.FILM;

export const C = { x: 513.44, y: 510.67 }; //           the outer ring's centre (mark units, the 1024 box)
export const BIG = 680 / (2 * 393.21); //              construction: the ring's outer diameter is 680 px
const T0 = CUE.construct; //                           bar 15, f1575
const T_LOCK = CUE.lockup; //                          bar 16, f1687
const at16 = (n) => T0 + n * S16; //                   fractional frame of a 16th of bar 15

/** Lockup, setting B of the lockup sheet (TREATMENT §7): the ring 2.3x the name's cap height, the gap 0.42x the ring,
 *  Readex Pro 500 at 0.12 em, about 42% of the frame's width, centred a little above the middle (y 520). */
export const LOCK = (() => {
  const size = 112, cap = size * 0.7, ringH = 2.3 * cap, s = ringH / (2 * 393.21), gap = 0.42 * ringH;
  const wordW = 506; // "FITWAY" at 112 px with 0.12 em tracking, less the last letter's tracking (measured, marksheet)
  const total = ringH + gap + wordW, left = 960 - total / 2, cy = 520;
  return { size, cap, s, ringH, gap, wordW, total, markCx: left + ringH / 2, cy, wordX: left + ringH + gap, baseline: cy + cap / 2 };
})();

let GEO = null;
let ORIGIN = { x: 960, y: 540 }; // where the construction's ring centre sits: set so the mark's dot lands on the reading
export async function loadMark() {
  if (!GEO) GEO = await (await fetch('assets/mark-geometry.json')).json();
  return GEO;
}
/** Place the construction so that the mark's dot sits exactly on the laptop's live end point at the cut (the match). */
export function setOrigin(dotScreen) {
  ORIGIN = { x: dotScreen.x - (GEO.dot.cx - C.x) * BIG, y: dotScreen.y - (GEO.dot.cy - C.y) * BIG };
  return ORIGIN;
}
export const origin = () => ORIGIN;

/** Where the mark sits on frame f: the construction placement until bar 16, then an eased move into the lockup, then the
 *  lockup's slow push (8% across the 3.5 s hold, so the hold builds rather than sits; TREATMENT §5 row 12). */
export function markPlace(f) {
  const p = prog(f, MOVE.lock.from - 1, MOVE.lock.to, E.cam);
  const s = lmix(BIG, LOCK.s, p);
  const x = ORIGIN.x + (LOCK.markCx - ORIGIN.x) * p;
  const y = ORIGIN.y + (LOCK.cy - ORIGIN.y) * p;
  const push = lmix(1, 1.08, prog(f, MOVE.lock.to, TOTAL, E.linear));
  return { s: s * push, x: 960 + (x - 960) * push, y: 540 + (y - 540) * push, push };
}

function strokeEls(g) {
  const lineAround = (name, half) => {
    const L = g.lines[name], th = (L.angle * Math.PI) / 180, n = [Math.cos(th), Math.sin(th)], t = [-n[1], n[0]];
    const d = n[0] * C.x + n[1] * C.y - L.c, p = [C.x - n[0] * d, C.y - n[1] * d];
    return { kind: 'line', a: [p[0] - t[0] * half, p[1] - t[1] * half], b: [p[0] + t[0] * half, p[1] + t[1] * half] };
  };
  const cutNear = (name, near, half) => {
    const L = g.lines[name], th = (L.angle * Math.PI) / 180, n = [Math.cos(th), Math.sin(th)], t = [-n[1], n[0]];
    const d = n[0] * near[0] + n[1] * near[1] - L.c, p = [near[0] - n[0] * d, near[1] - n[1] * d];
    return { kind: 'line', a: [p[0] - t[0] * half, p[1] - t[1] * half], b: [p[0] + t[0] * half, p[1] + t[1] * half] };
  };
  return CONSTRUCT.strokes.map((st) => {
    let el;
    if (st.id === 'dot') el = { kind: 'circle', cx: g.dot.cx, cy: g.dot.cy, r: g.dot.r + 14, from: -90 };
    else if (st.kind === 'circle') el = { kind: 'circle', ...g.circles[st.id], from: 135 };
    else if (st.kind === 'band') el = lineAround(st.id, 560);
    else el = cutNear(st.id, g.nodes[st.node[0]][st.node[1]], st.id === 'capL' ? 60 : 70);
    return { ...st, el, f0: at16(st.at), f1: at16(st.at + st.dur), relaxEnd: at16(st.at + CONSTRUCT.relax) };
  });
}

const RED = '#ff2946', CHALK = '#f5f3f2';
function mixHex(a, z, p) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pz = [1, 3, 5].map((i) => parseInt(z.slice(i, i + 2), 16));
  return '#' + pa.map((v, i) => Math.round(v + (pz[i] - v) * clamp(p)).toString(16).padStart(2, '0')).join('');
}

/** The film layer's SVG body on frame f (bars 15-17): the dot's swell, the construction, the fills, the move to the lockup.
 *  endDot: { x, y, r } the laptop's end point on screen at the cut (devices.js), so the swell starts from its size. */
export function constructionSVG(f, endDot) {
  const g = GEO;
  const P = markPlace(f);
  const X = (x, y) => [P.x + (x - C.x) * P.s, P.y + (y - C.y) * P.s];
  const clear = 1 - prog(f, T_LOCK - 1, T_LOCK + 30, E.outSoft); // the construction clears as the lockup assembles
  let s = '';
  if (clear > 0) {
    s += `<g opacity="${clear.toFixed(4)}">`;
    for (const st of strokeEls(g)) {
      const p = clamp((f - st.f0) / (st.f1 - st.f0));
      if (p <= 0) continue;
      const e = E.outSoft(p);
      const red = 1 - clamp((f - st.f0) / (st.relaxEnd - st.f0)); // red as the pen starts, chalk a 16th and a half later
      const attrs = `class="cl" stroke="${mixHex(CHALK, RED, red)}" stroke-opacity="${(0.34 + 0.66 * red).toFixed(3)}" stroke-width="${(1.25 + 0.5 * red).toFixed(2)}"`;
      const el = st.el;
      if (el.kind === 'circle') {
        const c = X(el.cx, el.cy), r = el.r * P.s, len = 2 * Math.PI * r;
        s += `<circle ${attrs} cx="${c[0].toFixed(2)}" cy="${c[1].toFixed(2)}" r="${r.toFixed(2)}" stroke-dasharray="${(len * e).toFixed(2)} ${len.toFixed(2)}" transform="rotate(${el.from} ${c[0].toFixed(2)} ${c[1].toFixed(2)})"/>`;
      } else {
        const a = X(...el.a), z = X(...el.b), m = [a[0] + (z[0] - a[0]) * e, a[1] + (z[1] - a[1]) * e];
        s += `<line ${attrs} x1="${a[0].toFixed(2)}" y1="${a[1].toFixed(2)}" x2="${m[0].toFixed(2)}" y2="${m[1].toFixed(2)}"/>`;
      }
    }
    // the nodes where the cuts meet the edges: small hollow rings, one per 32nd after the cuts
    const nodes = [...g.nodes.ring, ...g.nodes.arc2, ...g.nodes.arc3, ...g.nodes.arms.slice(0, 4)];
    nodes.forEach((n, i) => {
      const a = at16(11.5 + i * 0.25);
      if (f < a) return;
      const q = E.outSoft(clamp((f - a) / (2 * S16)));
      const c = X(n[0], n[1]);
      s += `<circle class="cl" cx="${c[0].toFixed(2)}" cy="${c[1].toFixed(2)}" r="${(4.5 * q).toFixed(2)}" stroke="${CHALK}" stroke-opacity="0.6" stroke-width="1.25"/>`;
    });
    s += '</g>';
  }
  return s + markGroup(f, P, endDot);
}

/** The filled mark: each piece fills when its outline is complete; the dot is the reading, red until the mark is whole,
 *  then it relaxes to the mark's white. On the cut it is the laptop's end point, same place, same size, and swells. */
function markGroup(f, P, endDot) {
  const g = GEO;
  let s = `<g transform="translate(${P.x.toFixed(3)} ${P.y.toFixed(3)}) scale(${P.s.toFixed(5)}) translate(${-C.x} ${-C.y})">`;
  for (const k of ['ring', 'arc2', 'arc3', 'armU', 'armL']) {
    const a = at16(CONSTRUCT.fills[k]);
    const o = prog(f, a - 1, a + 6, E.smooth);
    if (o > 0) s += `<path d="${g.paths[k]}" fill="#ffffff" fill-opacity="${o.toFixed(4)}"/>`;
  }
  // the reading stays red through the construction and relaxes to the mark's white as the mark moves into the lockup
  const white = prog(f, MOVE.lock.from + 6, MOVE.lock.to + 8, E.smooth);
  // the swell: from the end point's radius on screen to the mark's dot, 18 f on Eclipse's state curve
  const r0 = endDot ? endDot.r / P.s : g.dot.r;
  const r = r0 + (g.dot.r - r0) * E.state(clamp((f - (T0 - 1)) / DUR.dot));
  s += `<circle cx="${g.dot.cx}" cy="${g.dot.cy}" r="${r.toFixed(3)}" fill="${mixHex(RED, '#ffffff', white)}"/>`;
  return s + '</g>';
}

/** Red pixels the construction shows on frame f, as a share of strokes drawn (for the accent test in REVIEW). */
export function redStrokes(f) {
  return strokeEls(GEO).filter((st) => f >= st.f0 && f < st.relaxEnd).map((st) => st.id);
}
