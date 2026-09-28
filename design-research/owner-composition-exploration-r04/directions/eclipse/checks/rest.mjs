// Adapted from the independent verifier's sweep.mjs, 2026-09-28. Definitions retained.
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium, openPage, MEASURE_FN } from './browser.mjs';
import { SNAPSHOTS, FRAME_MS as H } from './constants.mjs';
import { REST_EXTRAS, decorateRest, readResponse } from './geometry.mjs';
export async function collectRest(browser, job) {
  const { OUT, ver, origin, plant, ...c } = job;
  c.ver = ver;
  const name = `${c.lang}-${c.state}-${c.fonts}-${c.width}x${c.height}`;
  const file = `${OUT}/sweep/${ver}/${name}.json`;
  await mkdir(`${OUT}/sweep/${ver}`, { recursive: true });
  const { context, page, errors, fontOk } = await openPage(browser, { origin, plant, ver, ...c, motion: false, vt: true });
  await page.evaluate(MEASURE_FN); await page.evaluate(REST_EXTRAS);
  const snaps = [];
  for (;;) {
    const snap = await page.evaluate(() => {
      const E = window.__eclipse, ch = E.chart;
      const plot = document.querySelector("#plot"), pr = plot.getBoundingClientRect();
      const ln0 = document.querySelector("#ln-0"), ln1 = document.querySelector("#ln-1");
      let gapY = null;
      if (ln0 && ln1) { const a = ln0.getPointAtLength(ln0.getTotalLength()), b = ln1.getPointAtLength(0); gapY = Math.min(a.y, b.y) - 12; }
      const rows = [];
      let err = null;
      for (const s of ch.stops) {
        try { ch.select(s.key); } catch (e) { err = String(e); }
        const m = window.__vm(), extra = window.__restExtra(), n = window.__vnat();
        Object.assign(m, extra);
        rows.push({ key: s.key, kind: s.kind, x: s.clientX - pr.left, ...m, ...n });
      }
      ch.clear();
      const f = E.figures;
      return { nowM: f.nowM, last: f.last, tipW: ch.tipWidth.widthPx, gapY, rows, err };
    });
    snaps.push(snap);
    if (snap.nowM >= 1139) break;
    const r = await page.evaluate(() => { try { return window.__eclipse.motion.step(); } catch (e) { return { error: String(e) }; } });
    if (r && r.error) { errors.push(`step: ${r.error}`); break; }
  }
  const response = await readResponse(page);
  const plantEvidence = await page.evaluate(() => window.__plantEvidence || null);
  await writeFile(file, JSON.stringify(decorateRest({ ver, ...c, fontOk, errors, response, plantEvidence, snaps })));
  await context.close();
  return file;
}
