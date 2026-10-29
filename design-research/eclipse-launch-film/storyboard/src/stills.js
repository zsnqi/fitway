// The style stills. Each one is the key frame of one beat, built from the real Eclipse page in an iframe (the film
// camera is one transform on it) plus the film's own layer (copy, the drafting construction). Every value that moves
// is computed from the beat's time t on the 128 BPM grid; nothing here is random.
import { loadPage, camera, dailyState, reportsFill, EASE, prog, lmix, clamp01, BAR, BEAT, wait } from './eclipse.js';
import { loadMark, constructionSVG, markGroup, MARK_STYLE } from './mark.js';

const b = (bar, beat = 1, sub = 0) => (bar - 1) * BAR + (beat - 1) * BEAT + sub * (BEAT / 4); // time of bar.beat.16th

// ---- The film's clocks (seconds). The shot list in TREATMENT.md uses the same numbers.
export const CLOCK = {
  line: { t0: 0, t1: b(5), m0: 520, m1: 822 },   // the line is mid-draw on frame 0 (3:40 PM) and lands at 7:42 PM on bar 5
  answers: { now: b(3, 2), peak: b(3, 2, 1), entries: b(3, 2, 2), busy: b(3, 2, 3), dur: 0.4 }, // Eclipse's 400 ms roll
  insert: { in: b(3, 2), out: b(4) },            // punch-in on Inside now
  mark: { t0: b(5), dur: BEAT },                 // the end point and the peak swell (257 ms in Eclipse; one beat here)
  fill: { t0: b(8), row: BEAT, step: BEAT / 2 }, // each weekday's hours fill in one beat; rows start an 8th apart
  busiest: b(9),                                 // the light comes on, the busiest is marked and named
};
const LAST = 822; // minutes from opening (6:00 AM) to the latest reading (7:42 PM)
const lineFrac = (t) => (CLOCK.line.m0 + (CLOCK.line.m1 - CLOCK.line.m0) * EASE.introLine(prog(t, CLOCK.line.t0, CLOCK.line.t1))) / LAST;

// ---- The film's copy: one role, one anchor (film.css). Fragments are fully resolved on these key frames.
async function copy(stage, words) {
  const el = document.createElement('div');
  el.className = 'copy';
  el.textContent = words;
  stage.append(el);
  await document.fonts.ready;
  // Put the baseline on --copy-baseline: measure the face's ascent at this size.
  const cs = getComputedStyle(document.documentElement);
  const size = parseFloat(cs.getPropertyValue('--copy-size'));
  const base = parseFloat(cs.getPropertyValue('--copy-baseline'));
  const c = document.createElement('canvas').getContext('2d');
  c.font = `500 ${size}px "Readex Pro"`;
  const m = c.measureText(words);
  const half = (size - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2;
  el.style.top = `${(base - m.fontBoundingBoxAscent - half).toFixed(2)}px`;
  return el;
}

const pageRect = (doc, sel) => { const r = doc.querySelector(sel).getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2 }; };

export const STILLS = {
  // 01 Hook. Frame 0 is already moving: the day's line is mid-draw on the dark chart, seen at macro, so the frame
  // reads as black with one red line. The faint dashed usual line runs ahead; the honest gap at 2 PM is behind.
  async '01'(stage, t) {
    const { cam, doc } = await loadPage(stage, { page: 'index.html' });
    const st = dailyState(doc, { line: lineFrac(t), mark: 0, answers: { now: 0, peak: 0, entries: 0, busy: 0 } });
    const tip = tipPoint(doc, st.xt);
    const k = lmix(6.2, 3.0, prog(t, 0, b(3), EASE.cam)); // a slow pull-back across bars 1-2
    camera(cam, k, tip.x, tip.y, 1250, 430);
    await copy(stage, 'Every day has a shape.');
  },
  // 02 The drop: a hard cut wide, the whole Daily screen at 1.2x; the line keeps drawing; the answers wait out of
  // sight (Eclipse's intro) and roll in from the next beat.
  async '02'(stage, t) {
    const { cam, doc } = await loadPage(stage, { page: 'index.html' });
    dailyState(doc, { line: lineFrac(t), mark: 0, answers: answersAt(t) });
    camera(cam, 1.2, 720, 450, 960, 540);
  },
  // 03 Punch-in insert on the same render: Inside now fills the frame edge to edge while 49 rolls into place.
  async '03'(stage, t) {
    const { cam, doc } = await loadPage(stage, { page: 'index.html' });
    dailyState(doc, { line: lineFrac(t), mark: 0, answers: answersAt(t) });
    const r = pageRect(doc, '#card-now');
    const left = r.x - 12, right = r.x + r.w + 8.5; // the gutters either side of the card
    const k = 1920 / (right - left);
    camera(cam, k, left, r.cy, 0, 540);
  },
  // 04 The line lands on now: the reading swells into its ring, the peak ring lands with its label, the pulse runs.
  async '04'(stage, t) {
    const { cam, doc } = await loadPage(stage, { page: 'index.html' });
    const pulse = (t - (CLOCK.mark.t0 + CLOCK.mark.dur)) / 5;
    dailyState(doc, { line: 1, mark: prog(t, CLOCK.mark.t0, CLOCK.mark.t0 + CLOCK.mark.dur), answers: {}, pulse: pulse >= 0 ? pulse % 1 : null });
    const e = pageRect(doc, '#end-dot');
    const k = lmix(1.2, 3.1, prog(t, b(5), b(7), EASE.cam)); // a push toward now through bars 5-6
    camera(cam, k, e.cx, e.cy, 1180, 560);
  },
  // 05 Reports, wide: the pattern fills on the grid, a weekday per 8th, each in time order.
  async '05'(stage, t) {
    const { cam, doc } = await loadPage(stage, { page: 'reports.html', h: 846 });
    reportsFill(doc, fillRows(t), { light: false, busiest: false });
    hideBusiestName(doc, true);
    camera(cam, 1.2, 720, 423, 960, 540);
  },
  // 06 The busiest hour: the light comes on at once with the complete pattern, a ring draws round the busiest
  // reading, the subtitle names it; the camera has pushed in a little; the copy sits below the card.
  async '06'(stage, t) {
    const { cam, doc } = await loadPage(stage, { page: 'reports.html', h: 846 });
    reportsFill(doc, fillRows(t), { light: true, busiest: true });
    hideBusiestName(doc, false);
    const k = 1.55;
    camera(cam, k, 140, 330, 0, 0);
    const top = doc.querySelector('#heat td.hc.is-top').getBoundingClientRect();
    // The marker sits 5 px in from the cell's inline-end top corner (reports.css .is-top::after).
    const mx = top.right - 5 - 2.5, my = top.top + 5 + 2.5;
    ringOver(stage, (mx - 140) * k, (my - 330) * k, 7.5 * k, prog(t, CLOCK.busiest, CLOCK.busiest + BEAT, EASE.outSoft));
    await copy(stage, 'Every week, a rhythm.');
  },
  // 07 The montage, one beat per page: the same tight frame on every page, so the rail (the mark at its top, the red
  // tile stepping down it) holds still while the page cuts under it. Activity log.
  async '07'(stage, t) {
    const { cam } = await loadPage(stage, { page: 'activity.html' });
    camera(cam, 1920 / 720, 0, 0, 0, 0);
  },
  // 08 The switch: the real ?lang=ar render, wide. Every block has crossed to its mirrored place; the chart runs
  // right to left, so now is on the left.
  async '08'(stage, t) {
    const { cam } = await loadPage(stage, { page: 'index.html', lang: 'ar' });
    camera(cam, 1.2, 720, 450, 960, 540);
  },
  // 11 The construction: the reading's dot is where the end point was; drafting lines build the mark around it.
  async '11'(stage, t) {
    const geo = await loadMark();
    stage.insertAdjacentHTML('beforeend', `<svg class="layer" viewBox="0 0 1920 1080" width="1920" height="1080">${MARK_STYLE}${constructionSVG(geo, t)}</svg>`);
  },
  // 12 The lockup and the poster frame.
  async '12'(stage, t) {
    const geo = await loadMark();
    stage.insertAdjacentHTML('beforeend', `<svg class="layer" viewBox="0 0 1920 1080" width="1920" height="1080">${MARK_STYLE}${constructionSVG(geo, t)}</svg>`);
    await lockupWord(stage, geo, t);
  },
};

// ---- helpers
function answersAt(t) {
  const a = CLOCK.answers, o = {};
  for (const k of ['now', 'peak', 'entries', 'busy']) o[k] = prog(t, a[k], a[k] + a.dur);
  return o;
}
function tipPoint(doc, xt) {
  for (const p of doc.querySelectorAll('[id^="ln-"]')) {
    if (!/^ln-\d+$/.test(p.id) || p.getAttribute('visibility') === 'hidden') continue;
    const da = p.getAttribute('stroke-dasharray');
    if (!da) continue;
    const l = parseFloat(da);
    const pt = p.getPointAtLength(l);
    const m = p.getScreenCTM();
    return { x: m.a * pt.x + m.c * pt.y + m.e, y: m.b * pt.x + m.d * pt.y + m.f };
  }
  const e = doc.getElementById('end-dot').getBoundingClientRect();
  return { x: e.left + e.width / 2, y: e.top + e.height / 2 };
}
function fillRows(t) {
  const f = CLOCK.fill, rows = [];
  for (let wd = 0; wd < 7; wd++) rows[wd] = prog(t, f.t0 + wd * f.step, f.t0 + wd * f.step + f.row);
  return rows;
}
function hideBusiestName(doc, hide) {
  const parts = doc.querySelectorAll('#pattern-sub .ps-part, #pattern-sub .sep');
  parts.forEach((p, i) => { if (i > 0) p.style.visibility = hide ? 'hidden' : 'visible'; });
}
// The signature move, film layer: a chalk drafting ring drawn round a reading (p 0..1 of the stroke).
function ringOver(stage, x, y, r, p) {
  const c = 2 * Math.PI * r;
  stage.insertAdjacentHTML('beforeend', `<svg class="layer" viewBox="0 0 1920 1080" width="1920" height="1080" style="pointer-events:none">
    <circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${r.toFixed(2)}" fill="none" stroke="#f5f3f2" stroke-opacity="0.9" stroke-width="2"
      stroke-dasharray="${(c * clamp01(p)).toFixed(2)} ${c.toFixed(2)}" transform="rotate(-135 ${x.toFixed(2)} ${y.toFixed(2)})"/></svg>`);
}
async function lockupWord(stage, geo, t) {
  const el = document.createElement('div');
  el.className = 'wordmark';
  el.textContent = 'FITWAY';
  stage.append(el);
  await document.fonts.ready;
  const L = geo.lockup;
  el.style.fontSize = `${L.size}px`;
  el.style.position = 'absolute';
  el.style.left = `${L.wordX}px`;
  const c = document.createElement('canvas').getContext('2d');
  c.font = `500 ${L.size}px "Readex Pro"`;
  const m = c.measureText('FITWAY');
  const half = (L.size - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2;
  el.style.top = `${(L.baseline - m.fontBoundingBoxAscent - half).toFixed(2)}px`;
}

// ---- boot: still.html?id=NN
const params = new URLSearchParams(location.search);
const id = params.get('id');
const list = await (await fetch('./stills.json')).json();
const meta = list.find((s) => s.id === id);
const stage = document.querySelector('.stage');
await document.fonts.load('500 68px "Readex Pro"');
await document.fonts.load('400 68px "Readex Pro"');
await STILLS[id](stage, Number(params.get('t') ?? meta.t));
await wait(300);
document.body.dataset.ready = '1';
