import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { openPage } from './browser.mjs';
import { renderSheet } from './forensics-sheet.mjs';
import { FRAME_MS } from './constants.mjs';

export async function collectFrames(browser, out, version, checks) {
  const directory = path.join(out, 'frames'); await mkdir(directory);
  const manifest = { keyFrames: [], strips: [], sheets: [] };
  const nameOf = c => `${c.lang}-${c.state}-${c.width}x${c.height}`;
  for (const [width, height] of [[1440, 900], [390, 844]]) for (const lang of ['ar', 'en']) {
    const cells = [];
    for (const state of ['live', 'delayed', 'nohistory']) {
      const config = { ...version, width, height, lang, state, motion: false, vt: true };
      const { page, context } = await openPage(browser, config);
      await page.evaluate(() => window.__eclipse.chart.select('latest'));
      const file = `${nameOf(config)}-742-latest.png`;
      await page.screenshot({ path: path.join(directory, file) });
      const frame = { file: `frames/${file}`, width, height, lang, state, snapshot: 822, stop: 'latest', motion: 'reduced', fonts: 'web' };
      manifest.keyFrames.push(frame); cells.push({ img: file, caption: `${lang} ${state} · 7:42 PM · latest` });
      if (state === 'live') {
        await page.evaluate(() => { while (window.__eclipse.figures.nowM < 1138) window.__eclipse.motion.step(); window.__eclipse.chart.select('h1110'); });
        const late = `${nameOf(config)}-closing-h1110.png`;
        await page.screenshot({ path: path.join(directory, late) });
        manifest.keyFrames.push({ ...frame, file: `frames/${late}`, snapshot: 1138, stop: 'h1110' });
        cells.push({ img: late, caption: `${lang} live · closing · h1110` });
      }
      await context.close();
    }
    const sheet = `${lang}-${width}x${height}-states.png`;
    const result = await renderSheet(browser, { title: `${lang.toUpperCase()} ${width}×${height} key frames`, cols: 2, cellWidth: width === 390 ? 390 : 720, cells }, path.join(directory, sheet), { baseDir: directory });
    if (result.missing.length) throw new Error('Missing key frame on sheet');
    manifest.sheets.push({ file: `frames/${sheet}`, ...result, out: undefined });
  }
  const sequences = [
    { check: 'readings', state: 'live', snap: 1013, from: 'h1140', reading: true },
    { check: 'width', state: 'nohistory', snap: 947, from: 'h960', reading: true },
    { check: 'hover', state: 'live', snap: 930, from: 'h810', to: 'h840' },
    { check: 'gap', state: 'live', snap: 883, from: 'gap', to: 'h480' },
    { check: 'layout', state: 'live', snap: 822, from: 'h0', to: 'h1140' },
  ].filter(s => checks.includes(s.check));
  for (const s of sequences) for (const lang of ['ar', 'en']) {
    const { page, context } = await openPage(browser, { ...version, lang, state: s.state, motion: true, vt: true });
    await page.evaluate(async ({ s, H }) => {
      const E = window.__eclipse;
      while (E.figures.nowM < s.snap) { E.motion.step(); E.motion.settle(); }
      E.chart.select(s.from); for (let i = 0; i < 90; i++) await window.__vt.tick(H);
    }, { s, H: FRAME_MS });
    const clip = await page.evaluate(() => {
      const b = document.querySelector('#plot').getBoundingClientRect();
      return { x: b.left, y: b.top, width: b.width, height: b.height };
    });
    const cells = [], frames = [];
    const shot = async (label, at) => {
      const file = `${s.check}-${lang}-${s.snap}-${label}.png`;
      await page.screenshot({ path: path.join(directory, file), clip });
      const geometry = await page.evaluate(() => {
        const pr = document.querySelector('#plot').getBoundingClientRect(), b = document.querySelector('#tip').getBoundingClientRect();
        return { l: b.left - pr.left, t: b.top - pr.top, w: b.width, h: b.height };
      });
      frames.push({ file: `frames/${file}`, at, ...geometry });
      cells.push({ img: file, caption: `${lang} ${s.check} · ${label} · x=${geometry.l.toFixed(2)}, y=${geometry.t.toFixed(2)}` });
    };
    await shot('pre', 0);
    await page.evaluate(s => s.reading ? window.__eclipse.motion.step() : window.__eclipse.chart.select(s.to), s);
    let at = 0;
    for (const n of [1, 2, 3, 6, 12, 18, 24, 30, 42, 61]) {
      await page.evaluate(async ({ n, H }) => { for (let i = 0; i < n; i++) await window.__vt.tick(H); }, { n: n - at, H: FRAME_MS });
      at = n; await shot(`f${String(n).padStart(2, '0')}`, n * FRAME_MS);
    }
    await context.close();
    const file = `${s.check}-${lang}-strip.png`;
    const result = await renderSheet(browser, { title: `${lang} ${s.check}: snapshot ${s.snap}, ${s.from}${s.reading ? ' + reading' : ` → ${s.to}`}`, cols: 3, cellWidth: 460, cells }, path.join(directory, file), { baseDir: directory });
    if (result.missing.length) throw new Error('Missing motion frame on strip');
    manifest.strips.push({ ...s, lang, frames, sheet: `frames/${file}` });
    manifest.sheets.push({ file: `frames/${file}`, ...result, out: undefined });
  }
  await writeFile(path.join(directory, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}
