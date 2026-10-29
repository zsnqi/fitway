// One command renders the whole storyboard:  node render.mjs   (from storyboard/src/; npm install first, for three.js)
//   node render.mjs --only 01,04     render some stills only (the contact sheet is rebuilt from whatever is on disk)
//   node render.mjs --t 03=4.35      override one still's time (seconds) for a look between key frames
// Writes ../still-NN-<slug>.png (1920x1080), ../contact-sheet.png and ../mark-sheet.png. Needs Eclipse extracted
// into ../../vendor/eclipse/ (scripts/fetch-eclipse.sh). Uses the Playwright already on this machine; no network.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { serve, FILM_ROOT } from './serve.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const HERE = path.join(FILM_ROOT, 'storyboard', 'src');
const OUT = path.join(FILM_ROOT, 'storyboard');
const BUILD = path.join(HERE, 'build');
fs.mkdirSync(BUILD, { recursive: true });
// The supplied logo, for the mark sheet's overlay (the server only serves the film folder).
fs.copyFileSync(path.join(FILM_ROOT, '..', '..', 'brand', 'fitway-logo.png'), path.join(BUILD, 'logo.png'));

const args = process.argv.slice(2);
const only = (() => { const i = args.indexOf('--only'); return i >= 0 ? args[i + 1].split(',') : null; })();
const tOver = Object.fromEntries(args.flatMap((a, i) => (a === '--t' ? [args[i + 1].split('=')] : [])));
const STILLS = JSON.parse(fs.readFileSync(path.join(HERE, 'stills.json'), 'utf8'));
const DEVICE = new Set(['09', '10']);

if (!fs.existsSync(path.join(FILM_ROOT, 'vendor', 'eclipse', 'index.html'))) {
  console.error('vendor/eclipse/ is missing: run scripts/fetch-eclipse.sh first'); process.exit(1);
}

const { server, port } = await serve();
const base = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
try {
  // Textures for the device moment: the real Daily page, English, at the laptop's and the phone's own sizes.
  const needDevice = !only || only.some((id) => DEVICE.has(id));
  if (needDevice) {
    for (const [name, vp, dsf, extra] of [['laptop', { width: 1440, height: 900 }, 2, {}], ['phone', { width: 390, height: 844 }, 3, { isMobile: true, hasTouch: true }]]) {
      const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: dsf, reducedMotion: 'reduce', ...extra });
      const page = await ctx.newPage();
      await page.goto(`${base}/vendor/eclipse/index.html?lang=en&motion=off`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(BUILD, `tex-${name}.png`) });
      await ctx.close();
      console.log(`texture ${name}`);
    }
  }
  for (const s of STILLS) {
    if (only && !only.includes(s.id)) continue;
    const t = tOver[s.id] ?? s.t;
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => console.error(`still ${s.id}:`, e.message));
    const url = DEVICE.has(s.id) ? `${base}/storyboard/src/device.html?id=${s.id}&t=${t}` : `${base}/storyboard/src/still.html?id=${s.id}&t=${t}`;
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 120000 });
    const file = path.join(OUT, `still-${s.id}-${s.slug}.png`);
    await page.screenshot({ path: file });
    await ctx.close();
    console.log(`still ${s.id} ${s.slug} t=${t}`);
  }
  // The contact sheet: every still, labelled with its bar, beat, time and frame.
  {
    const ctx = await browser.newContext({ viewport: { width: 2400, height: 1500 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(`${base}/storyboard/src/sheet.html`, { waitUntil: 'load' });
    await page.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 60000 });
    await page.screenshot({ path: path.join(OUT, 'contact-sheet.png'), fullPage: true });
    await ctx.close();
    console.log('contact sheet');
  }
  if (!only || only.includes('mark')) {
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1500 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(`${base}/storyboard/src/marksheet.html`, { waitUntil: 'load' });
    await page.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 60000 });
    await page.screenshot({ path: path.join(OUT, 'mark-sheet.png'), fullPage: true });
    await ctx.close();
    console.log('mark sheet');
  }
} finally {
  await browser.close();
  server.close();
}
