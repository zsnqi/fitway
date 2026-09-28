import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { openPage } from './browser.mjs';
import { anchorOf, pointDistance, quantile } from './geometry.mjs';
import { FRAME_MS } from './constants.mjs';

export async function collectFarMoves(browser, { OUT, ver, origin }) {
  const rows = [];
  for (const lang of ['ar', 'en']) {
    const { page, context, errors } = await openPage(browser, { origin, ver, lang, state: 'live', motion: true, vt: true });
    await page.focus('#plot-hit');
    for (const key of ['Home', 'End']) {
      // The reference records 50 frames after the key; frame 0 is retained separately to show the ring's jump.
      const before = await page.evaluate(() => {
        const pr = document.querySelector('#plot').getBoundingClientRect(), b = document.querySelector('#tip').getBoundingClientRect();
        const core = document.querySelector('#sel .sg-core')?.getBoundingClientRect();
        return { box: [b.left - pr.left, b.top - pr.top], ring: core ? [core.left + core.width / 2 - pr.left, core.top + core.height / 2 - pr.top] : null };
      });
      await page.keyboard.press(key);
      const frames = await page.evaluate(async H => {
        const frames = [], plot = document.querySelector('#plot');
        for (let i = 0; i < 50; i++) {
          await window.__vt.tick(H);
          const pr = plot.getBoundingClientRect(), b = document.querySelector('#tip').getBoundingClientRect();
          const core = document.querySelector('#sel .sg-core')?.getBoundingClientRect();
          frames.push({ box: [+(b.left - pr.left).toFixed(2), +(b.top - pr.top).toFixed(2)],
            ring: core ? [core.left + core.width / 2 - pr.left, core.top + core.height / 2 - pr.top] : null });
        }
        return frames;
      }, FRAME_MS);
      const steps = frames.slice(1).map((f, i) => Math.hypot(f.box[0] - frames[i].box[0], f.box[1] - frames[i].box[1]));
      rows.push({ lang, key, before, frames, steps, maxStep: +Math.max(...steps).toFixed(2), framesMoving: steps.filter(s => s > 0.05).length });
    }
    if (errors.length) throw new Error(`Home/End page errors: ${errors.join('; ')}`);
    await context.close();
  }
  await mkdir(`${OUT}/layout`, { recursive: true });
  await writeFile(`${OUT}/layout/${ver}-home-end.json`, JSON.stringify(rows));
  return rows;
}

export async function analyzeLayout(OUT, ver, farMoves) {
  const summary = { boxes: 0, withRing: 0, overOwnRing: 0, belowAxis: 0, doesNotBelong: 0,
    verticalGap: {}, anchorVerticalGap: {}, reversals: 0, byConfig: {}, controls: [], farMoves };
  const allGaps = [], pointGaps = [], reversalRows = [];
  for (const file of (await readdir(`${OUT}/sweep/${ver}`)).sort()) {
    const d = JSON.parse(await readFile(`${OUT}/sweep/${ver}/${file}`, 'utf8'));
    const c = { boxes: 0, withRing: 0, overOwnRing: 0, belowAxis: 0, doesNotBelong: 0, reversals: 0 };
    const history = new Map();
    if (d.plantEvidence) summary.controls.push({ config: file, ...d.plantEvidence });
    for (const snap of d.snaps) for (const r of snap.rows) {
      if (r.hidden) continue;
      c.boxes++;
      if (r.ring) {
        c.withRing++;
        if (pointDistance(r.l, r.t, r.w, r.h, r.ring.x, r.ring.y) < r.ring.radius + 2) c.overOwnRing++;
        pointGaps.push(Math.max(r.t - r.ring.y, r.ring.y - r.b));
      }
      if (r.b > r.axisY) c.belowAxis++;
      if (!['L', 'R'].includes(r.mode) && !(r.x >= r.l + 24 && r.x <= r.r - 24)) c.doesNotBelong++;
      const a = anchorOf(r, snap);
      allGaps.push(Math.max(r.t - a.y, a.y - r.b));
      // Use the placement mode (side/centred, above/below/shift), and collapse equal consecutive modes.
      const mode = ['R', 'L'].includes(r.mode) ? r.candidate : `${r.mode}:${r.candidate}`;
      const h = history.get(r.key) || [];
      if (!h.length || h[h.length - 1].mode !== mode) {
        h.push({ minute: snap.nowM, mode });
        if (h.length >= 3) {
          const [a0, b, a1] = h.slice(-3);
          // Start of the departure from A, rather than when A first appeared during the day.
          if (a0.mode === a1.mode && a1.minute - b.minute <= 30) {
            c.reversals++; reversalRows.push({ config: file, key: r.key, from: a0.mode, via: b.mode, at: [b.minute, a1.minute] });
          }
        }
        history.set(r.key, h);
      }
    }
    summary.byConfig[file.slice(0, -5)] = c;
    for (const k of Object.keys(c)) summary[k] += c[k];
  }
  const stats = values => ({ n: values.length, min: values.reduce((a, b) => Math.min(a, b), Infinity),
    max: values.reduce((a, b) => Math.max(a, b), -Infinity), median: quantile(values, 0.5), p90: quantile(values, 0.9) });
  summary.verticalGap = stats(pointGaps);
  summary.anchorVerticalGap = stats(allGaps);
  await writeFile(`${OUT}/layout/${ver}-reversals.json`, JSON.stringify(reversalRows));
  return summary;
}
