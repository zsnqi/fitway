// The one browser setup every tool shares: the Playwright Chromium already on the machine, software GL for three.js.
import { createRequire } from 'node:module';
import { serve, ROOT } from './serve.mjs';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = createRequire(`${ROOT}/../storyboard/src/`)('playwright'); }
export const { chromium } = pw;
// CPU raster: every tile is complete when the frame is captured (GPU raster on SwiftShader left missing or stale tiles
// on single frames under large scale transforms: a black band at f223 in the first review render).
const BASE_ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'];
export const GL_ARGS = [...BASE_ARGS, '--disable-gpu-rasterization', '--disable-zero-copy'];
// The device act shows no page tiles (only the three.js canvas and the copy), so it may keep GPU raster, which reads the
// WebGL canvas back far faster than the CPU path.
export const GL_ARGS_DEVICES = BASE_ARGS;
/** Seek the film to frame f and wait until the page and every iframe have painted it. */
export async function seek(page, f) {
  await page.evaluate(async (x) => {
    window.__film.seek(x);
    const frames = [window, ...[...document.querySelectorAll('iframe')].map((i) => i.contentWindow)];
    await Promise.all(frames.map((w) => new Promise((r) => w.requestAnimationFrame(() => w.requestAnimationFrame(r)))));
  }, f);
}
export { serve, ROOT };

/** Open the film at index.html in a new 1920x1080 page and wait until it has booted. */
export async function openFilm(browser, base) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('page error:', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.error('console:', m.text()); });
  await page.goto(`${base}/index.html${process.env.FILM_QUERY || ''}`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.body.dataset.ready === '1' || document.body.dataset.error, null, { timeout: 300000 });
  const err = await page.evaluate(() => document.body.dataset.error);
  if (err) throw new Error(`film boot failed: ${err}`);
  return { ctx, page };
}
