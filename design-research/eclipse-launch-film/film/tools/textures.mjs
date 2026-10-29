// The device moment's screens: the real Daily page, English, captured at the laptop's and the phone's own sizes from the
// pinned snapshot (BRIEF: the laptop at 1440x900, the phone at 390x844, first screen). Writes build/tex-laptop.png,
// build/tex-phone.png and build/textures.json (the laptop page's live end point, for the match cut into the mark).
import fs from 'node:fs';
import path from 'node:path';
import { chromium, GL_ARGS, serve, ROOT } from './browser.mjs';

const BUILD = path.join(ROOT, 'build');
fs.mkdirSync(BUILD, { recursive: true });
const { server, port } = await serve();
const base = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ args: GL_ARGS });
const meta = { w: 1440, h: 900 };
try {
  for (const [name, vp, dsf, extra] of [['laptop', { width: 1440, height: 900 }, 2, {}], ['phone', { width: 390, height: 844 }, 3, { isMobile: true, hasTouch: true }]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: dsf, reducedMotion: 'reduce', ...extra });
    const page = await ctx.newPage();
    await page.goto(`${base}/vendor/eclipse/index.html?lang=en&motion=off`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(BUILD, `tex-${name}.png`) });
    if (name === 'laptop') {
      meta.end = await page.evaluate(() => {
        const e = document.getElementById('end-dot').getBoundingClientRect();
        return { x: e.left + e.width / 2, y: e.top + e.height / 2, r: e.width / 2 };
      });
    }
    await ctx.close();
    console.log(`textures: ${name}`);
  }
  fs.writeFileSync(path.join(BUILD, 'textures.json'), JSON.stringify(meta, null, 1));
} finally {
  await browser.close();
  server.close();
}
