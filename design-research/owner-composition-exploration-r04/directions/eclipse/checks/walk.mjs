// Adapted from the independent verifier's walk.mjs, 2026-09-28. Definitions retained.
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium, openPage, MEASURE_FN } from './browser.mjs';
import { SNAPSHOTS, FRAME_MS as H } from './constants.mjs';
const FRAMES = 61;
const FRAME_FN = `window.__vf = function () {
  const plot = document.querySelector("#plot"), tip = document.querySelector("#tip"), pr = plot.getBoundingClientRect();
  const end = document.querySelector("#end-dot"), eb = end.getBoundingClientRect();
  const o = { ex: eb.left + eb.width / 2 - pr.left, ey: eb.top + eb.height / 2 - pr.top, hid: tip.hidden ? 1 : 0, sel: window.__eclipse.chart.selected };
  if (!tip.hidden) {
    const b = tip.getBoundingClientRect();
    o.l = b.left - pr.left; o.t = b.top - pr.top; o.w = b.width; o.h = b.height;
    o.text = tip.textContent;
    const mk = document.querySelector("#sel .sg-mark");
    if (mk) { const m = /translate\\(([-\\d.]+) ([-\\d.]+)\\)/.exec(mk.getAttribute("transform")); if (m) { o.mx = Number(m[1]); o.my = Number(m[2]); } }
  }
  o.fa = window.__eclipse.chart.followActive ? 1 : 0; o.la = window.__eclipse.motion.liveActive ? 1 : 0;
  return o;
};`;
export async function collectWalk(browser, job) {
  const { OUT, ver, origin, plant, captureMinutes, ...j } = job;
  j.ver = ver;
  const dir = `${OUT}/walk/${ver}/${j.lang}-${j.state}-${j.fonts}`;
  const file = `${dir}/${j.key}.json`;
  await mkdir(dir, { recursive: true });
  const { context, page, errors, fontOk } = await openPage(browser, { origin, plant, ver, lang: j.lang, state: j.state, fonts: j.fonts, motion: true, vt: true });
  await page.evaluate(FRAME_FN);
  await page.evaluate(minutes => { window.__captureMinutes = minutes ? new Set(minutes) : null; }, captureMinutes || null);
  const steps = [];
  let present = 0;
  for (;;) {
    const r = await page.evaluate(async ({ key, FRAMES, H }) => {
      const E = window.__eclipse, ch = E.chart;
      let selectedNow = false;
      if (ch.selected !== key && ch.stops.some((s) => s.key === key)) { ch.select(key); selectedNow = true; for (let i = 0; i < 90; i++) await window.__vt.tick(H); }
      const s0 = E.figures;
      const pre = window.__vf();
      const tipW0 = ch.tipWidth.widthPx;
      if (s0.nowM >= 1139) return { end: true, pre, nowM: s0.nowM };
      let err = null;
      try { E.motion.step(); } catch (e) { err = String(e); }
      const f0 = window.__vf();
      const frames = [];
      const captured = !window.__captureMinutes || window.__captureMinutes.has(s0.nowM);
      // The independent rest sweep identifies every geometry/text/width change. The clock still executes all
      // 61 frames on unchanged ticks, and the final position is always measured and checked against rest.
      for (let i = 0; i < FRAMES; i++) { await window.__vt.tick(H); if (captured || i === FRAMES - 1) frames.push(window.__vf()); }
      return { nowM: s0.nowM, last: s0.last, selectedNow, pre, f0, frames, captured, tipW0, tipW1: ch.tipWidth.widthPx, err };
    }, { key: j.key, FRAMES, H });
    if (r.end) break;
    if (r.err) errors.push(`step@${r.nowM}: ${r.err}`);
    if (r.pre.sel === j.key) present++;
    // Compact: only keep frames when the selected box existed before or after.
    const texts = [...new Set([r.pre, r.f0, ...r.frames].map((f) => f.text || ""))];
    const moved = [r.f0, ...r.frames].some((f) => f.hid !== r.pre.hid || (!f.hid && (Math.abs(f.l - r.pre.l) > 1e-3 || Math.abs(f.t - r.pre.t) > 1e-3 || Math.abs(f.w - r.pre.w) > 1e-3)));
    const keep = moved || r.tipW0 !== r.tipW1 || texts.length > 1;
    if (keep && !r.captured) throw new Error(`Rest plan omitted a changed tick: ${j.key}@${r.nowM}`);
    const pack = (f) => f.hid ? [null] : [+f.l.toFixed(4), +f.t.toFixed(4), +f.w.toFixed(4), +f.h.toFixed(4), f.mx ?? null, f.my ?? null, +f.ex.toFixed(3), +f.ey.toFixed(3), f.fa, f.la, texts.indexOf(f.text || "")];
    const lastF = r.frames[r.frames.length - 1];
    steps.push({ s: r.nowM, last: r.last, sel0: r.pre.sel, sel1: lastF.sel, tipW0: r.tipW0, tipW1: r.tipW1, moved, pre: pack(r.pre), post: pack(lastF), f0: keep ? pack(r.f0) : null, frames: keep ? r.frames.map(pack) : null, texts: keep ? texts : null, selectedNow: r.selectedNow });
  }
  await writeFile(file, JSON.stringify({ ver, ...j, fontOk, errors, steps }));
  await context.close();
  return file;
}
