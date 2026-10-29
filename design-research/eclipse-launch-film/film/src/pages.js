// The real Eclipse screens in the film. Each page is loaded from vendor/eclipse/ (the pinned snapshot) in a same-origin
// iframe at a real Eclipse layout (1600x900, exactly 16:9), and the film camera is one transform on the iframe's wrapper.
// State is set on the page's own DOM (the same elements, ids and attributes Eclipse's first-open intro drives), never
// redrawn. Every function here is a pure function of the values it is given: the film calls them on every frame with
// values computed from t, so a frame never depends on the frame before it.
const { E, clamp } = window.MOTION;
const SVGNS = 'http://www.w3.org/2000/svg';

export const PAGE_W = 1600;
export const PAGE_H = 900;
export const raf = (win = window) => new Promise((r) => win.requestAnimationFrame(() => r()));
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Load one Eclipse page into `layer`. Returns { id, wrap, frame, doc, win }. */
export async function loadPage(layer, id, src, { w = PAGE_W, h = PAGE_H } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'cam';
  wrap.dataset.page = id;
  wrap.style.width = `${w}px`;
  wrap.style.height = `${h}px`;
  const frame = document.createElement('iframe');
  frame.width = String(w);
  frame.height = String(h);
  frame.setAttribute('scrolling', 'no');
  frame.setAttribute('tabindex', '-1');
  frame.setAttribute('aria-hidden', 'true');
  wrap.append(frame);
  layer.append(wrap);
  const loaded = new Promise((r) => frame.addEventListener('load', r, { once: true }));
  frame.src = src;
  await loaded;
  const doc = frame.contentDocument, win = frame.contentWindow;
  // Wall-clock motion would make frames depend on render speed: the film drives every change itself.
  const st = doc.createElement('style');
  st.id = 'film-still';
  st.textContent = '*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}html{scrollbar-width:none}';
  doc.head.append(st);
  await doc.fonts.ready;
  await raf(win); await raf(win); await wait(150);
  return { id, wrap, frame, doc, win };
}

export const rectOf = (doc, sel) => {
  const el = typeof sel === 'string' ? doc.querySelector(sel) : sel;
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2, r: r.left + r.width, b: r.top + r.height };
};

// ------------------------------------------------------------------------------------------------ Daily

/** Today's line, measured once: the parts (each its own path, so the missing span stays a gap), the opening's x, the
 *  latest reading's x and a lookup of the line's y by page x (null inside the gap). */
export function measureLine(doc) {
  const paths = [...doc.querySelectorAll('[id^="ln-"]')].filter((p) => /^ln-\d+$/.test(p.id));
  const svg = paths[0].ownerSVGElement;
  const end = doc.getElementById('end-dot');
  const ex = Number(end.getAttribute('cx'));
  const x0 = paths[0].getPointAtLength(0).x;
  const m = svg.getScreenCTM();
  const toPage = (pt) => ({ x: m.a * pt.x + m.c * pt.y + m.e, y: m.b * pt.x + m.d * pt.y + m.f });
  const parts = paths.map((p) => {
    const total = p.getTotalLength();
    const pts = [];
    for (let l = 0; l <= total; l += 1.5) pts.push(p.getPointAtLength(l));
    pts.push(p.getPointAtLength(total));
    return { p, total, sx: pts[0].x, exx: pts[pts.length - 1].x, pts };
  });
  /** y (svg units) of the line at svg x, or null in the gap / outside the line. */
  const yAt = (x) => {
    for (const part of parts) {
      if (x < part.sx || x > part.exx) continue;
      const pts = part.pts;
      for (let i = 1; i < pts.length; i++) if (pts[i].x >= x) { const a = pts[i - 1], b = pts[i]; const u = (x - a.x) / ((b.x - a.x) || 1); return a.y + (b.y - a.y) * u; }
    }
    return null;
  };
  return { paths, parts, svg, end, ex, x0, toPage, yAt, ctm: m };
}

/** Daily, part way through Eclipse's own first-open intro (daily.js), driven by the film:
 *  line: 0..1 of the way from the opening to the latest reading (each part is its own path: the gap is never bridged);
 *  markEnd / markPeak: 0..1 of the end point's and the peak ring's swell (0.34 -> 1, Eclipse's state curve);
 *  answers: { now, peak, entries, busy } 0..1, the digit roll from below inside the digits' ink box (never a count-up);
 *  bars: 0..1 of each level bar's fill (MOT-3); pulse: 0..1 of the live pulse's 5 s cycle, or null. */
export function dailyState(doc, L, { line = 1, markEnd = 1, markPeak = 1, answers = {}, bars = null, pulse = null } = {}) {
  const xt = L.x0 + (L.ex - L.x0) * clamp(line);
  const landed = line >= 1;
  for (const part of L.parts) {
    const p = part.p;
    if (landed || xt >= part.exx) { p.removeAttribute('visibility'); p.removeAttribute('stroke-dasharray'); continue; }
    if (xt <= part.sx) { p.setAttribute('visibility', 'hidden'); continue; }
    p.removeAttribute('visibility');
    let lo = 0, hi = part.total;
    for (let i = 0; i < 36; i++) { const mid = (lo + hi) / 2; if (p.getPointAtLength(mid).x < xt) lo = mid; else hi = mid; }
    p.setAttribute('stroke-dasharray', `${lo.toFixed(2)} ${(part.total + 16).toFixed(2)}`);
  }
  // The fine vertical lines under the line are uncovered with it (one clip, as Eclipse's intro does).
  let cp = doc.getElementById('film-hair');
  if (!cp) {
    const defs = L.svg.querySelector('defs') || L.svg.insertBefore(doc.createElementNS(SVGNS, 'defs'), L.svg.firstChild);
    cp = doc.createElementNS(SVGNS, 'clipPath'); cp.id = 'film-hair';
    const r = doc.createElementNS(SVGNS, 'rect'); r.id = 'film-hair-r'; r.setAttribute('y', '-50'); r.setAttribute('height', '5000');
    cp.append(r); defs.append(cp);
    L.svg.querySelectorAll('rect[fill="url(#hair)"]').forEach((el) => el.setAttribute('clip-path', 'url(#film-hair)'));
  }
  const hr = doc.getElementById('film-hair-r');
  hr.setAttribute('x', String(L.x0 - 20));
  hr.setAttribute('width', String(landed ? 99999 : Math.max(0, xt - L.x0 + 20)));
  const swell = (el, m) => {
    if (!el) return;
    if (!landed || m <= 0) { el.setAttribute('visibility', 'hidden'); return; }
    el.removeAttribute('visibility');
    const s = 0.34 + 0.66 * E.state(clamp(m));
    const cx = Number(el.getAttribute('cx')), cy = Number(el.getAttribute('cy'));
    el.setAttribute('transform', `translate(${cx} ${cy}) scale(${s.toFixed(4)}) translate(${-cx} ${-cy})`);
  };
  swell(doc.getElementById('end-halo'), markEnd);
  swell(L.end, markEnd);
  swell(doc.getElementById('pk-dot'), markPeak);
  const peakOn = landed && markPeak > 0;
  const drop = doc.getElementById('pk-drop');
  if (drop) drop.setAttribute('visibility', peakOn ? 'visible' : 'hidden');
  const tag = doc.getElementById('peak-tag');
  if (tag) tag.style.visibility = peakOn ? 'visible' : 'hidden';
  // The live pulse (MOT-7): a 1 px ring from inside the end point to just past its halo, opacity 0.4 -> 0, visible for
  // the first 48% of each 5 s cycle. Only while live, only after the end point has swollen.
  doc.getElementById('film-ping')?.remove();
  if (landed && markEnd >= 1 && pulse != null && pulse < 0.48) {
    const q = E.ping(pulse / 0.48);
    const c = doc.createElementNS(SVGNS, 'circle'); c.id = 'film-ping';
    c.setAttribute('cx', L.end.getAttribute('cx')); c.setAttribute('cy', L.end.getAttribute('cy'));
    c.setAttribute('r', ((9.5 + (28 - 9.5) * q) / 2).toFixed(3));
    c.setAttribute('fill', 'none'); c.setAttribute('stroke', '#ff2946'); c.setAttribute('stroke-width', '1');
    c.setAttribute('opacity', (0.4 * (1 - q)).toFixed(4));
    L.end.parentNode.insertBefore(c, L.end);
  }
  for (const [id, key] of [['now-v', 'now'], ['peak-v', 'peak'], ['entries-v', 'entries'], ['busy-v', 'busy']]) {
    if (answers[key] != null) roll(doc.getElementById(id), answers[key]);
  }
  if (bars) levelBars(doc, bars);
  return { xt };
}

/** A value rolling into place from below inside its own ink box (Eclipse MOT-2 / MOT-10). p: 0 hidden .. 1 home. */
export function roll(el, p, dir = 1) {
  if (!el) return;
  if (!el.querySelector(':scope > .film-roll')) {
    const span = el.ownerDocument.createElement('span');
    span.className = 'film-roll';
    span.style.display = 'inline-block';
    while (el.firstChild) span.append(el.firstChild);
    el.append(span);
    el.style.display = 'inline-block';
    el.style.clipPath = 'inset(0 -0.3em 0 -0.3em)';
    el.dataset.filmH = String(el.getBoundingClientRect().height);
  }
  const span = el.querySelector(':scope > .film-roll');
  const h = Number(el.dataset.filmH) || el.getBoundingClientRect().height;
  span.style.transform = `translateY(${(dir * (1 - E.state(clamp(p))) * h).toFixed(2)}px)`;
}

/** The level badge's red bars filling from the bottom, 200 ms each, 50 ms apart (Eclipse MOT-3). p[i]: 0..1 per bar. */
export function levelBars(doc, p) {
  const on = [...doc.querySelectorAll('#now-foot .level .bars i')];
  let k = 0;
  for (const b of on) {
    const lit = b.classList.contains('on') || b.dataset.filmOn === '1';
    if (!lit) continue;
    if (b.dataset.filmOn !== '1') { b.dataset.filmOn = '1'; b.classList.remove('on'); b.style.position = 'relative'; const fill = doc.createElement('b'); fill.className = 'lv-fill'; b.append(fill); }
    const fill = b.querySelector('.lv-fill');
    fill.style.transform = `scaleY(${E.state(clamp(p[k] ?? 1)).toFixed(4)})`;
    k++;
  }
}

/** The hook's isolation: before the drop only today's line, its fine vertical lines and the faint usual line show on the
 *  black stage; every surface, label, grid line and light appears at once on the drop's cut. */
export function isolateLine(doc, L, on) {
  let st = doc.getElementById('film-isolate');
  if (!st) { st = doc.createElement('style'); st.id = 'film-isolate'; doc.head.append(st); }
  const want = on ? 'body *:not(#plot-svg, #plot-svg *) { visibility: hidden !important; } #plot-svg { visibility: visible !important; } body, .page { background: #070707 !important; }' : '';
  if (st.textContent !== want) st.textContent = want;
  if (L.isolated === on) return;
  L.isolated = on;
  // the grid, the time axis and the missing span's dots: hidden with the rest of the chrome
  L.svg.querySelectorAll('path[stroke^="rgba(255,255,255"], circle[r="1"]').forEach((el) => {
    if (on) el.setAttribute('visibility', 'hidden'); else el.removeAttribute('visibility');
  });
}

// ------------------------------------------------------------------------------------------------ Reports

/** Reports' pattern part way through the film's fill: rows[wd] is 0..1 of that weekday's hours shown, in time order (a
 *  cell shows once the fill front passes its centre). Unfilled cells are Eclipse's own empty plate; the data light comes
 *  on only with a complete pattern (LGT-11: at once, never fading). Returns the cells, for the handover test. */
export function reportsFill(doc, rows, { light = false, busiest = true } = {}) {
  const pattern = doc.getElementById('pattern');
  pattern.classList.toggle('lit', light);
  pattern.classList.toggle('lit-chart', light);
  for (const td of doc.querySelectorAll('#heat td.hc')) {
    const wd = Number(td.dataset.r), c0 = Number(td.dataset.c0), c1 = Number(td.dataset.c1);
    const f = rows[wd] ?? 1;
    const shown = f >= 1 || ((c0 + 0.5) / 19 <= f && (c1 + 0.5) / 19 <= f + 1e-9);
    const v = shown ? 'visible' : 'hidden';
    if (td.style.visibility !== v) td.style.visibility = v;
    if (td.classList.contains('is-top')) td.classList.toggle('film-no-top', !busiest);
  }
  let st = doc.getElementById('film-style');
  if (!st) { st = doc.createElement('style'); st.id = 'film-style'; st.textContent = '.hc.is-top.film-no-top::after{display:none}'; doc.head.append(st); }
}

/** Reports' period, as a function of the frame: the page renders the period it is given (its own setRange), once. */
export function reportsRange(win, kind) {
  const R = win.__reports;
  if (R && R.range.kind !== kind) R.setRange(kind);
}

/** The press (Eclipse MOT-20): seated at once, 3% travel (6% for a small square) with one step of light; released, the
 *  light fades over 120 ms and the travel settles back over 240 ms. f, seat and release in frames. */
export function press(el, f, seat, release, { scale = 0.97, light = 'rgba(245, 243, 242, 0.1)', inset = true } = {}) {
  if (!el) return;
  let depth = 0, glow = 0;
  if (f >= seat && f < release) { depth = 1; glow = 1; }
  else if (f >= release) { depth = 1 - E.pressBack(clamp((f - release) / 14.4)); glow = 1 - E.pressFade(clamp((f - release) / 7.2)); }
  if (depth <= 0.0005 && glow <= 0.0005) { el.style.removeProperty('scale'); el.style.removeProperty('box-shadow'); return; }
  el.style.scale = String(1 - (1 - scale) * depth);
  const a = Number((light.match(/[\d.]+\)$/) || ['0.1)'])[0].slice(0, -1)) * glow;
  const col = light.replace(/[\d.]+\)$/, `${a.toFixed(4)})`);
  el.style.boxShadow = inset ? `inset 0 0 0 100vmax ${col}` : '';
}

/** Uncover an element by a moving edge from its inline start (Eclipse never fades words). p: 0 hidden .. 1 shown. */
export function edgeReveal(el, p, rtl = false) {
  if (!el) return;
  const q = clamp(p);
  if (q >= 1) { el.style.removeProperty('clip-path'); el.style.removeProperty('visibility'); return; }
  if (q <= 0) { el.style.visibility = 'hidden'; return; }
  el.style.removeProperty('visibility');
  const cut = ((1 - q) * 100).toFixed(2);
  el.style.clipPath = rtl ? `inset(-20% 0 -20% ${cut}%)` : `inset(-20% ${cut}% -20% -2%)`;
}
