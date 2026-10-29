// Real Eclipse screens in the film: each page is loaded from vendor/eclipse/ in a same-origin iframe at its own
// capture size, and the film camera is one transform on the iframe's wrapper. State is set on the page's own DOM
// (the same elements, ids and attributes Eclipse's first-open intro drives), never redrawn.

export const BPM = 128;
export const BEAT = 60 / BPM;          // 0.46875 s
export const BAR = BEAT * 4;           // 1.875 s
export const fr = (t) => Math.round(t * 60);
export const barBeat = (t) => {
  const bar = Math.floor(t / BAR) + 1;
  const beat = Math.floor((t - (bar - 1) * BAR) / BEAT + 1e-9) + 1;
  return { bar, beat };
};

// Eclipse's own easings (motion.js / daily.js), so a still shows a real in-between, not an invented one.
export const bez = (x1, y1, x2, y2) => (t) => {
  if (t <= 0) return 0; if (t >= 1) return 1;
  let u = t;
  for (let i = 0; i < 12; i++) {
    const x = 3 * x1 * u * (1 - u) ** 2 + 3 * x2 * u * u * (1 - u) + u ** 3 - t;
    const dx = 3 * x1 * (1 - u) ** 2 + 6 * (x2 - x1) * u * (1 - u) + 3 * (1 - x2) * u * u;
    if (Math.abs(dx) < 1e-6) break;
    u = Math.min(1, Math.max(0, u - x / dx));
  }
  return 3 * y1 * u * (1 - u) ** 2 + 3 * y2 * u * u * (1 - u) + u ** 3;
};
export const EASE = {
  roll: bez(0.25, 1, 0.5, 1),        // Eclipse "state": digits roll, a decisive start and a soft landing
  introLine: bez(0.3, 0.2, 0.4, 1),  // Eclipse's intro line: a firm start, an even day, a soft landing into now
  cam: bez(0.48, 0.1, 0, 0.9),       // cinetic camera
  outSoft: bez(0.22, 1, 0.36, 1),    // cinetic gentle settle (type)
};
export const clamp01 = (v) => Math.min(1, Math.max(0, v));
export const prog = (t, a, b, e = (x) => x) => e(clamp01((t - a) / (b - a)));
export const lmix = (a, b, p) => Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * p);

export async function loadPage(parent, { page, lang = 'en', w = 1600, h = 900, query = '' }) {
  // 1600x900 is a real Eclipse layout (its first screen is fixed to the viewport from 1200 px) and exactly 16:9, so a
  // wide shot at 1.2x fills the frame with no pillar cutting the page wash.
  const cam = document.createElement('div');
  cam.className = 'cam';
  const frame = document.createElement('iframe');
  frame.width = w; frame.height = h;
  frame.setAttribute('scrolling', 'no');
  cam.append(frame);
  parent.append(cam);
  const loaded = new Promise((r) => frame.addEventListener('load', r, { once: true }));
  frame.src = `/vendor/eclipse/${page}?lang=${lang}&motion=off${query}`;
  await loaded;
  const doc = frame.contentDocument, win = frame.contentWindow;
  await doc.fonts.ready;
  await raf(win); await raf(win); await wait(250);
  return { cam, frame, doc, win };
}
export const raf = (win = window) => new Promise((r) => win.requestAnimationFrame(() => r()));
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** The film camera: page point (px, py) lands on screen point (sx, sy) at scale k. */
export function camera(cam, k, px, py, sx = 960, sy = 540) {
  cam.style.transform = `translate(${(sx - k * px).toFixed(3)}px, ${(sy - k * py).toFixed(3)}px) scale(${k.toFixed(5)})`;
}

const SVGNS = 'http://www.w3.org/2000/svg';

/** Daily, part way through Eclipse's own first-open intro (daily.js "the first-open intro"):
 *  line: 0..1 of the minutes from opening to the latest reading; the missing span stays a gap (each part is its
 *  own path, never joined); mark: 0..1 of the end point's and the peak ring's swell (0.34 -> 1);
 *  answers: { now, peak, entries, busy } 0..1 each, the digit roll from below inside the digits' ink box
 *  (0 = out of sight, 1 = in place; never a count-up). pulse: 0..1 of the live ring's 5 s cycle, or null. */
export function dailyState(doc, { line = 1, mark = 1, answers = {}, pulse = null } = {}) {
  const svg = doc.getElementById('ln-0').ownerSVGElement; // the plot's own SVG (the first SVG in .chart is an icon)
  const end = doc.getElementById('end-dot');
  const ex = Number(end.getAttribute('cx'));
  const paths = [...doc.querySelectorAll('[id^="ln-"]')].filter((p) => /^ln-\d+$/.test(p.id));
  const x0 = paths[0].getPointAtLength(0).x;
  const xt = x0 + (ex - x0) * clamp01(line);
  const landed = line >= 1;
  for (const p of paths) {
    const total = p.getTotalLength();
    const sx = p.getPointAtLength(0).x, exx = p.getPointAtLength(total).x;
    p.removeAttribute('visibility'); p.removeAttribute('stroke-dasharray');
    if (landed || xt >= exx) continue;
    if (xt <= sx) { p.setAttribute('visibility', 'hidden'); continue; }
    let lo = 0, hi = total;
    for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (p.getPointAtLength(mid).x < xt) lo = mid; else hi = mid; }
    p.setAttribute('stroke-dasharray', `${lo.toFixed(2)} ${(total + 16).toFixed(2)}`);
  }
  // The fine vertical lines under the line are uncovered with it.
  let cp = doc.getElementById('film-hair');
  const defs = svg.querySelector('defs') || svg.insertBefore(doc.createElementNS(SVGNS, 'defs'), svg.firstChild);
  if (!cp) {
    cp = doc.createElementNS(SVGNS, 'clipPath'); cp.id = 'film-hair';
    const r = doc.createElementNS(SVGNS, 'rect'); r.id = 'film-hair-r'; r.setAttribute('y', '-50'); r.setAttribute('height', '5000');
    cp.append(r); defs.append(cp);
  }
  const hr = doc.getElementById('film-hair-r');
  hr.setAttribute('x', String(x0 - 20)); hr.setAttribute('width', String(landed ? 99999 : Math.max(0, xt - x0 + 20)));
  svg.querySelectorAll('rect[fill="url(#hair)"]').forEach((r) => r.setAttribute('clip-path', 'url(#film-hair)'));
  // The end point and the peak ring swell from the tip's size (0.34) to 1 once the line has arrived.
  const swell = (el, s) => {
    if (!el) return;
    if (!landed || mark <= 0) { el.setAttribute('visibility', 'hidden'); return; }
    el.removeAttribute('visibility');
    const cx = Number(el.getAttribute('cx')), cy = Number(el.getAttribute('cy'));
    el.setAttribute('transform', `translate(${cx} ${cy}) scale(${s.toFixed(4)}) translate(${-cx} ${-cy})`);
  };
  const s = 0.34 + 0.66 * EASE.roll(clamp01(mark));
  swell(doc.getElementById('end-halo'), s);
  swell(end, s);
  swell(doc.getElementById('pk-dot'), s);
  const drop = doc.getElementById('pk-drop');
  if (drop) drop.setAttribute('visibility', landed && mark > 0 ? 'visible' : 'hidden');
  const tag = doc.getElementById('peak-tag');
  if (tag) tag.style.visibility = landed && mark > 0 ? 'visible' : 'hidden';
  // The live pulse (MOT-7): a 1 px ring from 9.5 px to 28 px across, opacity 0.4 -> 0, visible for 48% of 5 s.
  doc.getElementById('film-ping')?.remove();
  if (landed && mark >= 1 && pulse != null && pulse < 0.48) {
    const q = bez(0.22, 0.61, 0.36, 1)(pulse / 0.48);
    const c = doc.createElementNS(SVGNS, 'circle'); c.id = 'film-ping';
    c.setAttribute('cx', end.getAttribute('cx')); c.setAttribute('cy', end.getAttribute('cy'));
    c.setAttribute('r', String(((9.5 + (28 - 9.5) * q) / 2).toFixed(2)));
    c.setAttribute('fill', 'none'); c.setAttribute('stroke', '#ff2946'); c.setAttribute('stroke-width', '1');
    c.setAttribute('opacity', (0.4 * (1 - q)).toFixed(3));
    end.parentNode.insertBefore(c, end);
  }
  for (const [id, key] of [['now-v', 'now'], ['peak-v', 'peak'], ['entries-v', 'entries'], ['busy-v', 'busy']]) {
    const p = answers[key];
    if (p == null) continue;
    roll(doc.getElementById(id), p);
  }
  return { x0, ex, xt };
}

/** A value rolling into place from below inside its own ink box (Eclipse MOT-2 / MOT-10). p: 0 hidden .. 1 home. */
export function roll(el, p) {
  if (!el) return;
  if (!el.querySelector(':scope > .film-roll')) {
    const span = el.ownerDocument.createElement('span');
    span.className = 'film-roll';
    span.style.display = 'inline-block';
    while (el.firstChild) span.append(el.firstChild);
    el.append(span);
    el.style.display = 'inline-block';
    el.style.clipPath = 'inset(0 -0.3em 0 -0.3em)';
  }
  const span = el.querySelector(':scope > .film-roll');
  const h = el.getBoundingClientRect().height;
  span.style.transform = `translateY(${((1 - EASE.roll(clamp01(p))) * h).toFixed(2)}px)`;
}

/** Reports' pattern part way through the film's fill: rows[wd] is 0..1 of that weekday's hours shown, in time order
 *  (a cell shows once the fill front passes its centre). Unfilled cells look as Eclipse's own loading pattern does
 *  (an empty plate); the data light comes on only with a complete pattern (LGT-11: at once, never fading). */
export function reportsFill(doc, rows, { light = false, busiest = true } = {}) {
  const pattern = doc.getElementById('pattern');
  pattern.classList.toggle('lit', light);
  pattern.classList.toggle('lit-chart', light);
  const cells = [...doc.querySelectorAll('#heat td.hc')];
  for (const td of cells) {
    const wd = Number(td.dataset.r), c0 = Number(td.dataset.c0), c1 = Number(td.dataset.c1);
    const f = rows[wd] ?? 1;
    const shown = (c0 + 0.5) / 19 <= f && (c1 + 0.5) / 19 <= f + 1e-9 || f >= 1;
    td.style.visibility = shown ? 'visible' : 'hidden';
    if (td.classList.contains('is-top')) td.classList.toggle('film-no-top', !busiest);
  }
  let st = doc.getElementById('film-style');
  if (!st) { st = doc.createElement('style'); st.id = 'film-style'; doc.head.append(st); }
  st.textContent = `.hc.is-top.film-no-top::after{display:none}`;
}

/** The hook's isolation: before the drop, only today's line, its fine vertical lines and the faint usual line show on
 *  the black stage; every surface, label, grid line and light appears at once on the drop's cut (bar 3). */
export function isolateLine(doc, on = true) {
  let st = doc.getElementById('film-isolate');
  if (!st) { st = doc.createElement('style'); st.id = 'film-isolate'; doc.head.append(st); }
  st.textContent = on ? `body *:not(#plot-svg, #plot-svg *) { visibility: hidden !important; } #plot-svg { visibility: visible !important; }` : '';
  const svg = doc.getElementById('ln-0').ownerSVGElement;
  // the grid, the time axis and the missing span's dots: hidden with the rest of the chrome
  svg.querySelectorAll('path[stroke^="rgba(255,255,255"], circle[r="1"]').forEach((el) => {
    if (on) el.setAttribute('visibility', 'hidden'); else el.removeAttribute('visibility');
  });
}
