// Adapted from the independent verifier's hover.mjs, 2026-09-28. Definitions retained.
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium, openPage, MEASURE_FN } from './browser.mjs';
import { SNAPSHOTS, FRAME_MS as H } from './constants.mjs';
const FRAME_FN = `window.__vf = function () {
  const plot = document.querySelector("#plot"), tip = document.querySelector("#tip"), pr = plot.getBoundingClientRect();
  if (tip.hidden) return null;
  const b = tip.getBoundingClientRect();
  return [+(b.left - pr.left).toFixed(4), +(b.top - pr.top).toFixed(4), +b.width.toFixed(4), +b.height.toFixed(4), tip.textContent];
};`;
export async function collectHover(browser, job) {
  const { OUT, ver, origin, plant, ...j } = job;
  j.ver = ver;
  const file = `${OUT}/hover/${j.ver}/${j.lang}-${j.state}-${j.fonts}.json`;
  await mkdir(`${OUT}/hover/${j.ver}`, { recursive: true });
  const { context, page, errors, fontOk } = await openPage(browser, { origin, plant, ver: j.ver, lang: j.lang, state: j.state, fonts: j.fonts, motion: true, vt: true });
  await page.evaluate(FRAME_FN);
  const out = [];
  for (const snap of SNAPSHOTS) {
    await page.evaluate(async (snap) => { const E = window.__eclipse; while (E.figures.nowM < snap) { E.motion.step(); E.motion.settle(); } }, snap);
    const res = await page.evaluate(async ({ H }) => {
      const E = window.__eclipse, ch = E.chart, stops = ch.stops.map((s) => s.key), tr = [];
      const pl = document.querySelector("#plot").getBoundingClientRect().left, xs = ch.stops.map((s) => +(s.clientX - pl).toFixed(3));
      const tick = async (n) => { for (let i = 0; i < n; i++) await window.__vt.tick(H); };
      for (let i = 0; i < stops.length; i++) for (const dlt of [-3, -2, -1, 1, 2, 3]) {
        const k = i + dlt;
        if (k < 0 || k >= stops.length) continue;
        let err = null;
        ch.clear(); await tick(2);
        try { ch.select(stops[i]); } catch (e) { err = String(e); }
        await tick(10);
        const pre = window.__vf();
        try { ch.select(stops[k]); } catch (e) { err = String(e); }
        const f0 = window.__vf();
        const frames = [];
        for (let n = 0; n < 61; n++) { try { await window.__vt.tick(H); } catch (e) { err = String(e); } frames.push(window.__vf()); }
        const active = ch.followActive;
        ch.clear(); await tick(1);
        try { ch.select(stops[k]); } catch (e) { err = String(e); }
        const rest = window.__vf();
        const mk = document.querySelector("#sel .sg-mark"), mm = mk && /translate\(([-\d.]+) ([-\d.]+)\)/.exec(mk.getAttribute("transform"));
        tr.push({ from: stops[i], to: stops[k], dlt, xFrom: xs[i], xTo: mm ? Number(mm[1]) : xs[k], pre, f0, frames, rest, active, err });
      }
      ch.clear();
      return tr;
    }, { H });
    out.push({ snap, transitions: res });
  }
  await writeFile(file, JSON.stringify({ ...j, fontOk, errors, out }));
  await context.close();
  return file;
}
