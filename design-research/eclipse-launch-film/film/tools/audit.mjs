// layout-audit for this HyperFrames film: cinetic's scripts/layout-audit.sh renders a Remotion composition with an
// audit prop, which a HyperFrames project does not have, so this ports its rules onto the composition itself. For each
// COPY entry's resolved frame, mid-hold and last frame before it leaves (and f+1 of each, for speed), it measures every
// film text box ([data-text]) and fails: a box outside the safe area (96 px at the sides, 64 px top and bottom), readable
// text under 22 px, two text boxes overlapping, more film words readable at once than the calm pace allows (8), text
// faster than 20 px/f while it travels or 3 px/f while it is read (FILM.READ). Product strings (the real Eclipse pages)
// are not film words and count apart, as data-ui strings do in cinetic. Writes ../out/film/qa/layout-Film.json.
//   node tools/audit.mjs [--frames a,b,c]
import fs from 'node:fs';
import path from 'node:path';
import { chromium, GL_ARGS, serve, ROOT, openFilm, seek } from './browser.mjs';

globalThis.window = globalThis;
await import(path.join(ROOT, 'motion.js'));
await import(path.join(ROOT, 'timeline.js'));
const { COPY, READ, TOTAL } = globalThis.FILM;
const args = process.argv.slice(2);
const i = args.indexOf('--frames');
let frames = i >= 0 ? args[i + 1].split(',').map(Number) : COPY.flatMap((c) => { const end = Math.min(c.out, TOTAL) - 1; return [c.resolved, Math.floor((c.resolved + end) / 2), end]; });
frames = [...new Set(frames)].sort((a, b) => a - b);
const reading = (id, f) => (READ[id] || []).some(([a, z]) => f >= a && f < z);

const { server, port } = await serve();
const browser = await chromium.launch({ args: GL_ARGS });
const { page } = await openFilm(browser, `http://127.0.0.1:${port}`);
const measure = async (f) => {
  await seek(page, f);
  return page.evaluate(() => [...document.querySelectorAll('[data-text]')].map((el) => {
    let op = 1, vis = true;
    for (let e = el; e && e !== document.body; e = e.parentElement) { const cs = getComputedStyle(e); op *= Number(cs.opacity); if (cs.visibility === 'hidden' || cs.display === 'none') vis = false; }
    // the readable extent: the union of the glyph boxes that are inside their masks
    const ws = [...el.querySelectorAll('.w, .ltr')];
    const boxes = (ws.length ? ws : [el]).map((w) => {
      const r = w.getBoundingClientRect();
      const m = w.closest('.mask'); const mr = m ? m.getBoundingClientRect() : r;
      const top = Math.max(r.top, mr.top), bot = Math.min(r.bottom, mr.bottom);
      return { l: r.left, r: r.right, t: top, b: bot, shown: bot - top > 0.6 * r.height, text: w.textContent };
    }).filter((b) => b.shown);
    if (!boxes.length) return null;
    const x0 = Math.min(...boxes.map((b) => b.l)), x1 = Math.max(...boxes.map((b) => b.r));
    const y0 = Math.min(...boxes.map((b) => b.t)), y1 = Math.max(...boxes.map((b) => b.b));
    const m = new DOMMatrix(getComputedStyle(el).transform === 'none' ? undefined : getComputedStyle(el).transform);
    const px = parseFloat(getComputedStyle(el).fontSize) * Math.hypot(m.a, m.b);
    const words = boxes.map((b) => b.text).join(' ').trim().split(/\s+/).filter(Boolean).length;
    return { id: el.dataset.text, x: x0, y: y0, w: x1 - x0, h: y1 - y0, px, opacity: op, visible: vis && op > 0.05, words };
  }).filter(Boolean));
};
const issues = [];
const report = [];
try {
  for (const f of frames) {
    const a = (await measure(f)).filter((b) => b.visible);
    const z = f + 1 < TOTAL ? (await measure(f + 1)).filter((b) => b.visible) : [];
    const readable = a.filter((b) => b.opacity >= 0.5);
    for (const b of readable) {
      if (b.x < 96 || b.x + b.w > 1824 || b.y < 64 || b.y + b.h > 1016) issues.push({ frame: f, id: b.id, kind: 'safe', box: [b.x, b.y, b.w, b.h].map(Math.round) });
      if (b.px < 22) issues.push({ frame: f, id: b.id, kind: 'size', px: b.px });
      const n = z.find((q) => q.id === b.id);
      if (n) {
        b.speed = Math.hypot(n.x + n.w / 2 - (b.x + b.w / 2), n.y + n.h / 2 - (b.y + b.h / 2));
        const lim = reading(b.id, f) ? 3 : 20;
        if (b.speed > lim) issues.push({ frame: f, id: b.id, kind: 'speed', speed: +b.speed.toFixed(2), limit: lim });
      }
    }
    for (let p = 0; p < readable.length; p++) for (let q = p + 1; q < readable.length; q++) {
      const A = readable[p], B = readable[q];
      if (A.x < B.x + B.w && B.x < A.x + A.w && A.y < B.y + B.h && B.y < A.y + A.h) issues.push({ frame: f, kind: 'overlap', ids: [A.id, B.id] });
    }
    const words = readable.reduce((s, b) => s + b.words, 0);
    if (words > 8) issues.push({ frame: f, kind: 'words', words });
    report.push({ frame: f, boxes: readable.map((b) => ({ id: b.id, box: [b.x, b.y, b.w, b.h].map((v) => Math.round(v)), px: +b.px.toFixed(1), words: b.words, speed: b.speed == null ? null : +b.speed.toFixed(2), read: reading(b.id, f) })) });
  }
} finally {
  await browser.close();
  server.close();
}
const out = path.join(ROOT, '..', 'out', 'film', 'qa', 'layout-Film.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify({ tool: 'audit (layout-audit port)', frames, issues, report }, null, 1));
for (const r of report) console.log(`f${r.frame}: ${r.boxes.map((b) => `${b.id} ${b.box.join(',')} ${b.px}px ${b.words}w v=${b.speed}${b.read ? ' (read)' : ''}`).join(' | ') || '-'}`);
console.log(issues.length ? `layout-audit: ${issues.length} issue(s)\n${issues.map((x) => JSON.stringify(x)).join('\n')}` : 'layout-audit: 0 issues');
process.exit(issues.length ? 1 : 0);
