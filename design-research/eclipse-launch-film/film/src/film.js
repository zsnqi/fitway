// The Eclipse launch film, Station 2: the picture. One paused GSAP timeline (HyperFrames) drives one function, render(f),
// that sets every layer from the frame alone: the real Eclipse pages (iframes, camera = one transform per page), the
// device scene (three.js, bars 13-14), the film's own SVG layer (the busiest hour's ring, the construction, the mark) and
// the copy. Nothing is random and nothing depends on the frame before: workers can seek frames in any order.
import { loadPage, measureLine, dailyState, isolateLine, reportsFill, reportsRange, press, edgeReveal, roll, rectOf, PAGE_W, PAGE_H, wait } from './pages.js';
import { initDevices, renderDevices, endPointOnScreen } from './devices.js';
import { loadMark, setOrigin, constructionSVG, markPlace, LOCK, redStrokes } from './mark.js';
import { buildCopy, renderCopy, buildWordmark, renderWordmark } from './copy.js';

const M = window.MOTION, F = window.FILM;
const { E, clamp, prog, lmix, mix, FPS } = M;
const { CUE, MOVE, DUR, TOTAL, ACT } = F;
const $ = (s) => document.querySelector(s);

// ------------------------------------------------------------------------------------------------ camera
/** Page point (ax, ay) sits at screen point (sx, sy), k times its size. */
const shot = (k, ax, ay, sx, sy) => ({ k, ax, ay, sx, sy });
/** Blend two shots: anchors linearly, the scale in log space (cinetic camera.md §2). */
const lc = (A, B, t) => ({ k: lmix(A.k, B.k, t), ax: mix(A.ax, B.ax, t), ay: mix(A.ay, B.ay, t), sx: mix(A.sx, B.sx, t), sy: mix(A.sy, B.sy, t) });
/** Keep a page of PAGE_W x PAGE_H covering the frame (no window edge or void enters by accident). */
function cover(c, w = PAGE_W, h = PAGE_H) {
  const k = Math.max(c.k, 1920 / w, 1080 / h);
  const left = c.sx - c.ax * k, top = c.sy - c.ay * k;
  const x = Math.min(0, Math.max(1920 - w * k, left)), y = Math.min(0, Math.max(1080 - h * k, top));
  return { ...c, k, sx: c.sx + (x - left), sy: c.sy + (y - top) };
}
const place = (wrap, c, dy = 0) => { wrap.style.transform = `translate(${(c.sx - c.k * c.ax).toFixed(3)}px, ${(c.sy - c.k * c.ay + dy).toFixed(3)}px) scale(${c.k.toFixed(5)})`; };
const toScreen = (c, x, y) => ({ x: c.sx + (x - c.ax) * c.k, y: c.sy + (y - c.ay) * c.k });
const WIDE = shot(1.2, PAGE_W / 2, PAGE_H / 2, 960, 540); // a whole page at 1.2x: exactly the frame

// ------------------------------------------------------------------------------------------------ state
const S = {}; // pages, measurements and layers, filled by boot()
let last = null;

const visible = (el, on) => { const v = on ? 'visible' : 'hidden'; if (el.style.visibility !== v) el.style.visibility = v; };
const actOf = (f) => Object.entries(ACT).find(([, a]) => f >= a.from && f < a.from + a.dur)?.[0] ?? 'lockup';

// ------------------------------------------------------------------------------------------------ shots
const lineAt = (f) => F.lineMinute(f) / F.LINE.m1;

/** Where the hook's camera looks: the tip's x exactly, and the line's height averaged over the last half hour behind
 *  the tip, so the camera follows the day's shape and not every wiggle of it. */
function tipTarget(f) {
  const L = S.L, m = F.lineMinute(f);
  const xs = (mm) => L.x0 + (L.ex - L.x0) * (mm / F.LINE.m1);
  let sy = 0, n = 0;
  for (let k = 0; k <= 12; k++) { const y = L.yAt(xs(m - 30 + 2.5 * k)); if (y != null) { sy += y; n++; } }
  const p = L.toPage({ x: xs(m), y: n ? sy / n : L.yAt(xs(m)) ?? 0 });
  return p;
}

function dailyFull(f, extra = {}) {
  isolateLine(S.daily.doc, S.L, false);
  const pulse = f >= CUE.pulse ? (((f - CUE.pulse) / DUR.pulse) % 1) : null;
  dailyState(S.daily.doc, S.L, { line: 1, markEnd: 1, markPeak: 1, answers: { now: 1, peak: 1, entries: 1, busy: 1 }, bars: [1, 1, 1, 1], pulse, ...extra });
}

function renderDaily(f, F_) {
  const doc = S.daily.doc;
  if (F_ < CUE.drop) {
    isolateLine(doc, S.L, true);
    dailyState(doc, S.L, { line: lineAt(f), markEnd: 0, markPeak: 0, answers: { now: 0, peak: 0, entries: 0, busy: 0 }, bars: [0, 0, 0, 0] });
    const k = lmix(4.2, 2.4, prog(f, 0, CUE.drop, E.cam)); // a slow pull-back across bars 1-2, following the tip
    const t = tipTarget(f);
    place(S.daily.wrap, shot(k, t.x, t.y, 1240, 590));
    return;
  }
  isolateLine(doc, S.L, false);
  const answers = {};
  ['now', 'peak', 'entries', 'busy'].forEach((key, i) => { answers[key] = prog(f, CUE.answers[i] - 1, CUE.answers[i] - 1 + DUR.roll, (u) => u); });
  const bars = [0, 1, 2, 3].map((i) => prog(f, CUE.bars - 1 + i * DUR.barStagger, CUE.bars - 1 + i * DUR.barStagger + DUR.bar, (u) => u));
  const landed = F_ >= CUE.landing;
  const pulse = f >= CUE.pulse ? (((f - CUE.pulse) / DUR.pulse) % 1) : null;
  dailyState(doc, S.L, {
    line: landed ? 1 : lineAt(f),
    markEnd: prog(f, CUE.landing - 1, CUE.landing - 1 + DUR.swell, (u) => u),
    markPeak: prog(f, CUE.peakRing - 1, CUE.peakRing - 1 + DUR.swell, (u) => u),
    answers, bars, pulse,
  });
  let c;
  if (F_ < CUE.insert) {
    // the drop: the whole Daily screen at 1.2x, a hair of push toward Inside now
    const r = S.cardNow;
    c = lc(shot(1.2, r.cx, r.cy, r.cx * 1.2, r.cy * 1.2), shot(1.22, r.cx, r.cy, r.cx * 1.2, r.cy * 1.2), prog(f, CUE.drop, CUE.insert, E.dolly));
  } else if (F_ < CUE.wide) {
    // the insert: Inside now edge to edge, creeping 1.5% about the card
    c = shot(S.insert.k * lmix(1, 1.015, prog(f, CUE.insert, CUE.wide, E.linear)), S.cardNow.cx, S.cardNow.cy, S.insert.sx, S.insert.sy);
  } else {
    // back wide, then the push toward now: wide -> 2.2 (E.cam), then 2.2 -> 2.9 (E.dolly), the reading held on one point
    const pA = prog(f, MOVE.pushA.from, MOVE.pushA.to, E.cam);
    const pB = prog(f, MOVE.pushB.from, MOVE.pushB.to, E.dolly);
    c = cover(lc(lc(WIDE, S.now1, pA), S.now2, pB));
  }
  place(S.daily.wrap, c);
  S.dailyCam = c;
}

function renderReports(f, F_) {
  const { doc, win, wrap } = S.reports;
  reportsRange(win, F_ >= CUE.release ? '28d' : '7d');
  const seg = doc.querySelector('#range-seg .seg-b[data-range="28d"]');
  press(seg, f, CUE.press, CUE.release);
  // the period's figures roll in from below on the release, a 16th apart (Eclipse's changed-digit roll)
  // (only the figures the new period changes: the average and the entries; the highest peak is the same 76)
  S.reportsVals().forEach((el, i) => roll(el, F_ >= CUE.release ? prog(f, CUE.release - 1 + i * F.S16, CUE.release - 1 + i * F.S16 + DUR.roll, (u) => u) : 1));
  const rows = [0, 1, 2, 3, 4, 5, 6].map((wd) => prog(f, CUE.rows[wd] - 1, CUE.rows[wd] - 1 + DUR.fillRow, E.linear));
  const lit = F_ >= CUE.light;
  reportsFill(doc, rows, { light: lit, busiest: lit });
  // the busiest hour's name: uncovered by a moving edge after the ring has drawn (Eclipse never fades words)
  S.nameEls().forEach((el) => edgeReveal(el, prog(f, CUE.name - 1, CUE.name - 1 + 14, E.ui)));
  // camera: the wide while the period changes, then up to the pattern card, then a 2% creep under the refrain
  const up = prog(f, MOVE.reportsUp.from, MOVE.reportsUp.to, E.cam);
  const creep = lmix(1, 1.02, prog(f, MOVE.reportsUp.to, ACT.montage.from, E.linear));
  let c = lc(S.reportsWide, S.reportsCard, up);
  c = { ...c, k: c.k * creep };
  const dy = F_ < CUE.wipe ? 1080 * (1 - E.glide(prog(f, MOVE.wipe.from - 1, MOVE.wipe.to, (u) => u))) : 0;
  place(wrap, c, dy);
  // the chalk ring round the busiest hour (the signature: a ring drawn round the reading that matters)
  const ring = $('#busiest-ring');
  if (lit) {
    const m = toScreen(c, S.top.x, S.top.y);
    const r = 9 * c.k, len = 2 * Math.PI * r, p = E.outSoft(prog(f, CUE.light - 1, CUE.light - 1 + DUR.ring, (u) => u));
    ring.setAttribute('cx', m.x.toFixed(2)); ring.setAttribute('cy', (m.y + dy).toFixed(2)); ring.setAttribute('r', r.toFixed(2));
    ring.setAttribute('stroke-dasharray', `${(len * p).toFixed(2)} ${len.toFixed(2)}`);
    ring.setAttribute('transform', `rotate(-135 ${m.x.toFixed(2)} ${(m.y + dy).toFixed(2)})`);
    visible(ring, true);
  } else visible(ring, false);
}

function renderMontage(f, F_) {
  const i = CUE.montage.filter((c) => F_ >= c).length - 1; // which beat
  const page = [S.activity, S.access, S.settings, S.daily][i];
  for (const p of [S.activity, S.access, S.settings, S.daily]) visible(p.wrap, p === page);
  if (page === S.daily) dailyFull(f);
  const c = { ...S.montageShot, k: S.montageShot.k * lmix(1, 1.035, prog(f, ACT.montage.from, ACT.montage.from + ACT.montage.dur, E.linear)) };
  place(page.wrap, c);
}

function renderSwitch(f, F_) {
  const swap = F_ >= S.flip.swap;
  const en = S.daily, ar = S.dailyAR;
  visible(en.wrap, !swap); visible(ar.wrap, swap);
  if (!swap) dailyFull(f);
  // the AR key: seated in the wide (6% travel for a small square, one step of light), released on the next 8th
  press(S.langTile, f, CUE.seat - 7, CUE.flip, { scale: 0.94 });
  // every block travels to its mirrored slot; the words swap from the English render to the real ?lang=ar render at the
  // move's midpoint, when the blocks are fastest. Right-movers ride a little high and above, left-movers low.
  for (const blk of S.flip.blocks) {
    const e = E.smooth(prog(f, CUE.flip - 1 + blk.delay, CUE.flip - 1 + blk.delay + DUR.flip - 4, (u) => u));
    const arc = -Math.sign(blk.dx) * 26 * Math.sin(Math.PI * e);
    const elEN = blk.en, elAR = blk.ar;
    if (!swap) { elEN.style.translate = `${(blk.dx * e).toFixed(2)}px ${arc.toFixed(2)}px`; elEN.style.zIndex = blk.dx > 0 ? '3' : '2'; }
    else { elAR.style.translate = `${(-blk.dx * (1 - e)).toFixed(2)}px ${arc.toFixed(2)}px`; elAR.style.zIndex = blk.dx > 0 ? '3' : '2'; }
    if (swap) elEN.style.translate = ''; else elAR.style.translate = '';
  }
  const creep = lmix(1, 1.01, prog(f, CUE.flipLand, ACT.devices.from, E.linear));
  place((swap ? ar : en).wrap, { ...WIDE, k: 1.2 * creep });
}

function resetSwitch() {
  for (const blk of S.flip.blocks) { if (blk.en.style.translate) blk.en.style.translate = ''; if (blk.ar.style.translate) blk.ar.style.translate = ''; }
  press(S.langTile, 0, 1, 2);
}

// ------------------------------------------------------------------------------------------------ render(f)
export function render(fIn) {
  const f = clamp(fIn, 0, TOTAL - 1e-6);
  if (f === last) return;
  last = f;
  const F_ = Math.round(f); // discrete decisions read whole frames, so every motion-blur sub-sample agrees
  const act = actOf(F_);
  const ui = ['hook', 'drop', 'insert', 'landing', 'fill', 'busiest', 'montage', 'switch'].includes(act);
  visible(S.ui, ui);
  visible(S.gl, act === 'devices');
  visible(S.fx, act === 'busiest' || act === 'fill' || act === 'construct' || act === 'lockup');

  const onDaily = ['hook', 'drop', 'insert', 'landing'].includes(act);
  const onReports = act === 'fill' || act === 'busiest' || (act === 'landing' && F_ >= MOVE.wipe.from);
  if (act !== 'montage') {
    visible(S.daily.wrap, onDaily || act === 'switch');
    for (const p of [S.activity, S.access, S.settings]) visible(p.wrap, false);
  }
  visible(S.reports.wrap, onReports);
  if (act !== 'switch') {
    visible(S.dailyAR.wrap, false);
    resetSwitch(); // the switch's moves live on the pages' own blocks: undo them on every other frame
  }

  if (onDaily) renderDaily(f, F_);
  if (onReports) renderReports(f, F_);
  else visible($('#busiest-ring'), false);
  if (act === 'montage') renderMontage(f, F_);
  if (act === 'switch') renderSwitch(f, F_);
  if (act === 'devices') renderDevices(f);
  if (act === 'construct' || act === 'lockup') {
    S.fxBody.innerHTML = constructionSVG(f, S.endDot);
    renderWordmark(f, markPlace(f));
  } else {
    if (S.fxBody.firstChild) S.fxBody.innerHTML = '';
    renderWordmark(f, { push: 1 });
  }
  renderCopy(f);
}

// ------------------------------------------------------------------------------------------------ boot
export async function boot() {
  await Promise.all([document.fonts.load('500 80px "Readex Pro"'), document.fonts.load('400 80px "Readex Pro"')]);
  await document.fonts.ready;
  S.ui = $('#ui'); S.gl = $('#gl'); S.fx = $('#fx'); S.fxBody = $('#fx-body');
  const base = 'vendor/eclipse/';
  const q = '&motion=off';
  [S.daily, S.reports, S.activity, S.access, S.settings, S.dailyAR] = await Promise.all([
    loadPage(S.ui, 'daily', `${base}index.html?lang=en${q}`),
    loadPage(S.ui, 'reports', `${base}reports.html?lang=en${q}&range=7d`),
    loadPage(S.ui, 'activity', `${base}activity.html?lang=en${q}&kind=count`),
    loadPage(S.ui, 'access', `${base}access.html?lang=en${q}`),
    loadPage(S.ui, 'settings', `${base}settings.html?lang=en${q}`),
    loadPage(S.ui, 'dailyAR', `${base}index.html?lang=ar${q}`),
  ]);

  // Daily: the line, the reading, the frames that look at it
  const dd = S.daily.doc;
  S.L = measureLine(dd);
  S.cardNow = rectOf(dd, '#card-now');
  const end = rectOf(dd, '#end-dot');
  S.end = { x: end.cx, y: end.cy };
  S.insert = (() => {
    const r = S.cardNow, left = r.x - 12, k = 1920 / (r.w + 20);
    return { k, sx: (r.cx - left) * k, sy: 14 + (r.cy - r.y) * k };
  })();
  // the reading sits where Reports' first row (Sunday) will be, so the line hands over to the pattern
  const rd = S.reports.doc;
  const sunday = rectOf(rd, rd.querySelector('#heat td.hc[data-r="0"]').closest('tr'));
  const handY = sunday.cy * 1.2;
  S.now1 = shot(2.2, S.end.x, S.end.y, 1180, handY);
  S.now2 = shot(2.9, S.end.x, S.end.y, 1180, handY);
  S.handY = handY;

  // Reports: the wide, the pattern card's frame (the whole card, just right of the rail, under the glance row)
  reportsRange(S.reports.win, '28d');
  await wait(50);
  const card = rectOf(rd, '#pattern');
  const railR = rectOf(rd, '.rail').r;
  const kCard = 1920 / (card.r - railR + 2 * (card.x - railR));
  S.reportsWide = shot(1.2, 0, 0, 0, 0);
  S.reportsCard = shot(kCard, railR + 1, card.y, 0, 14.5 * kCard);
  const top = rd.querySelector('#heat td.hc.is-top').getBoundingClientRect();
  S.top = { x: top.right - 5 - 2.5, y: top.top + 5 + 2.5 }; // reports.css .is-top::after: 5 px in from the inline-end top corner
  S.reportsVals = () => ['#avg-body .num', '#entries-body .num', '#entries-body .stat-aside bdi'].map((q) => rd.querySelector(q)).filter(Boolean);
  S.nameEls = () => [...rd.querySelectorAll('#pattern-sub .ps-part, #pattern-sub .sep')].slice(1);
  reportsRange(S.reports.win, '7d');

  // The montage: one tight frame for all four pages, the mark at the rail's top held still (a frame whose edges slice no
  // line of text on any of the four pages; the widest such k).
  S.montageShot = montageFrame([S.activity, S.access, S.settings, S.daily]);

  // English to Arabic: the blocks and their mirrored slots
  const sel = ['.rail-slot', '.head-titles', '.head-meta', '#card-now', '#card-peak', '#card-entries', '#card-busiest'];
  const delays = [0, 1, 3, 2, 3, 4, 5];
  S.flip = { swap: CUE.flip + Math.round((DUR.flip - 4) / 2), blocks: sel.map((s, i) => {
    const en = dd.querySelector(s), ar = S.dailyAR.doc.querySelector(s);
    const a = en.getBoundingClientRect(), z = ar.getBoundingClientRect();
    en.style.position = en.style.position || ''; ar.style.position = ar.style.position || '';
    return { sel: s, en, ar, dx: (z.left + z.width / 2) - (a.left + a.width / 2), delay: delays[i] };
  }) };
  S.langTile = dd.querySelector('#lang-link .tile');

  // the copy and the wordmark
  buildCopy($('#words'));
  buildWordmark($('#words'), LOCK);

  // the devices (textures captured from the real pages by tools/textures.mjs) and the match cut's place
  const meta = await (await fetch('build/textures.json')).json();
  await initDevices(S.gl, { laptop: 'build/tex-laptop.png', phone: 'build/tex-phone.png' }, meta);
  await loadMark();
  S.endDot = endPointOnScreen(CUE.construct - 1);
  setOrigin(S.endDot);

  // HyperFrames: one paused timeline, registered last. A single linear clock drives render(); GSAP seeks it.
  const clock = { f: 0 };
  const tl = gsap.timeline({ paused: true });
  tl.fromTo(clock, { f: 0 }, { f: TOTAL, duration: TOTAL / FPS, ease: E.linear, onUpdate: () => render(clock.f) }, 0);
  window.addEventListener('hf-seek', (e) => render(e.detail.time * FPS));
  render(0);
  window.__film = {
    ready: true, render, seek: (f) => { tl.totalTime(f / FPS, false); render(f); },
    info: () => ({ endDot: S.endDot, montage: S.montageShot, handY: S.handY, now: S.end, insert: S.insert, reportsCard: S.reportsCard, red: (f) => redStrokes(f), flip: S.flip.blocks.map((b) => ({ sel: b.sel, dx: b.dx })) }),
  };
  return { tl }; // wrapped: a GSAP timeline is a thenable, and an async function would wait for it to finish
}

/** The montage's one frame: the rail and the title at the top left, the widest k at which no frame edge slices a line of
 *  text on any of the four pages (reference C's tight cut, no glyph sliced: storyboard REVIEW round 1). */
function montageFrame(pages) {
  const boxes = pages.map((p) => [...p.doc.querySelectorAll('body *')]
    .filter((e) => ((e.childElementCount === 0 && e.textContent.trim()) || e.matches('button, .rbtn, .seg, .icon-btn, select')) && p.win.getComputedStyle(e).visibility !== 'hidden')
    .filter((e) => !e.closest('.rail-slot, .sr-only'))
    .map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0 && r.top < PAGE_H));
  // a frame (left L, top T, scale k) whose four edges cut no line of text on any of the four pages; the rail whole
  // from its top past Access's tile (y 330), so the mark and the red tile stay in frame
  const cuts = (L, T, k) => {
    const R = L + 1920 / k, B = T + 1080 / k;
    return boxes.some((list) => list.some((r) => r.right > L && r.left < R && r.bottom > T && r.top < B
      && ((r.top < B && r.bottom > B) || (r.left < R && r.right > R) || (r.left < L && r.right > L) || (r.top < T && r.bottom > T))));
  };
  let best = null;
  for (let k = 3.0; k >= 1.6 && !best; k -= 0.01) {
    if (1080 / k < 330) continue;
    for (let T = 0; T <= 14 && !best; T += 1) for (let L = 0; L <= 14 && !best; L += 1) if (!cuts(L, T, k)) best = { k, L, T };
  }
  best = best || { k: 1.2, L: 0, T: 0 };
  const mark = rectOf(pages[0].doc, '.rail-item.brand .tile');
  return shot(best.k, mark.cx, mark.cy, (mark.cx - best.L) * best.k, (mark.cy - best.T) * best.k);
}

