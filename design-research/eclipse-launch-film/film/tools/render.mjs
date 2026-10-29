// The film's frame renderer: HyperFrames' own render model (a paused GSAP timeline seeked to frame / fps on an integer
// grid, then captured), run with the Playwright Chromium already on the machine, so frames can be rendered one by one
// for review and in parallel chunks for the master. Every frame is a pure function of its number, so workers seek in any
// order. Motion blur, where a move passes 12 px/f, is real sub-frame accumulation (--blur): the sub-frames never cross a
// hard cut (FILM.CUTS), and are averaged in linear float, quantised once.
//
//   node tools/render.mjs --frames 0,225,281-283 [--out ../out/film/frames]   PNG stills for review
//   node tools/render.mjs --all [--workers 3] [--blur auto|none]                every frame of the film
// Frames land in <out>/f0000.png. Needs build/ (node tools/textures.mjs) and npm install (setup.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { chromium, GL_ARGS, serve, ROOT, openFilm, seek } from './browser.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const has = (k) => args.includes(k);
const OUT = path.resolve(opt('--out', path.join(ROOT, '..', 'out', 'film', 'frames')));
const WORKERS = Number(opt('--workers', 3));
const BLUR = opt('--blur', 'none');
fs.mkdirSync(OUT, { recursive: true });

// The timeline, read in Node exactly as the browser reads it.
globalThis.window = globalThis;
await import(path.join(ROOT, 'motion.js'));
await import(path.join(ROOT, 'timeline.js'));
const { TOTAL, CUTS, ACT } = globalThis.FILM;

const parse = (s) => s.split(',').flatMap((p) => { const [a, b] = p.split('-').map(Number); return b == null ? [a] : Array.from({ length: b - a + 1 }, (_, i) => a + i); });
let frames = has('--all') ? Array.from({ length: TOTAL }, (_, i) => i) : parse(opt('--frames', '0'));
frames = [...new Set(frames)].filter((f) => f >= 0 && f < TOTAL).sort((a, b) => a - b);
if (has('--missing')) frames = frames.filter((f) => !fs.existsSync(path.join(OUT, `f${String(f).padStart(4, '0')}.png`)));

// Motion blur: frames whose fastest element passes 12 px/f get K sub-samples across a 180-degree shutter, clamped to the
// shot (never across a cut). The ranges are the film's fast moves, measured on a sharp render (REVIEW.md).
const BLUR_RANGES = BLUR === 'none' ? [] : JSON.parse(fs.readFileSync(path.join(ROOT, 'blur.json'), 'utf8')).ranges;
const blurK = (f) => { for (const r of BLUR_RANGES) if (f >= r.from && f <= r.to) return r.k; return 1; };
const shotOf = (f) => { let a = 0, z = TOTAL; for (const c of [0, ...CUTS, TOTAL]) { if (c <= f) a = c; else { z = c; break; } } return [a, z]; };

const { server, port } = await serve();
const base = `http://127.0.0.1:${port}`;
const clock = () => Number(process.hrtime.bigint() / 1000000n); // progress log only, never the picture
const t0 = clock();
let done = 0;
const browsers = [];
async function worker(list) {
  if (!list.length) return;
  const browser = await chromium.launch({ args: GL_ARGS }); // one browser (and GPU process) per worker
  browsers.push(browser);
  const { ctx, page } = await openFilm(browser, base);
  page.setDefaultTimeout(240000); // a device frame (three.js on SwiftShader at 2x) can take many seconds under load
  console.log(`render: worker ready at ${((clock() - t0) / 1000).toFixed(0)} s (${list.length} frames from f${list[0]})`);
  for (const f of list) {
    try { await one(page, f); } catch (e) { console.error(`render: f${f} failed (${e.message.split('\n')[0]}); rerun with --missing`); }
  }
  await ctx.close();
}
async function one(page, f) {
  {
    const file = path.join(OUT, `f${String(f).padStart(4, '0')}.png`);
    const k = blurK(f);
    if (k <= 1) {
      await seek(page, f);
      await page.screenshot({ path: file, type: 'png' });
    } else {
      // K sub-samples centred on the frame across a 180-degree shutter (+-0.25 f), clamped inside the shot
      const [a, z] = shotOf(f);
      const subs = [];
      for (let i = 0; i < k; i++) {
        const x = Math.min(z - 0.001, Math.max(a, f + (i + 0.5) / k * 0.5 - 0.25));
        await seek(page, x);
        subs.push(await page.screenshot({ type: 'png' }));
      }
      const dir = path.join(OUT, 'sub', String(f));
      fs.mkdirSync(dir, { recursive: true });
      subs.forEach((b, i) => fs.writeFileSync(path.join(dir, `s${i}.png`), b));
      const py = spawnSync(process.env.CINETIC_PY || '/home/user/.venvs/cinetic/bin/python', [path.join(ROOT, 'tools', 'average.py'), dir, file], { encoding: 'utf8' });
      if (py.status !== 0) throw new Error(`average.py failed: ${py.stderr}`);
      fs.rmSync(dir, { recursive: true, force: true });
    }
    done++;
    if (done % 20 === 0 || done === frames.length) {
      const s = (clock() - t0) / 1000;
      process.stdout.write(`render: ${done}/${frames.length} frames, ${s.toFixed(0)} s (${(s / done).toFixed(2)} s/frame)\n`);
    }
  }
}
try {
  // blocks of 24 neighbouring frames dealt round-robin, so the slow device frames are shared by every worker
  const n = Math.max(1, Math.min(WORKERS, frames.length));
  const lists = Array.from({ length: n }, () => []);
  for (let i = 0; i < frames.length; i += 24) lists[(i / 24) % n].push(...frames.slice(i, i + 24));
  await Promise.all(lists.map((l) => worker(l)));
} finally {
  await Promise.all(browsers.map((b) => b.close()));
  server.close();
}
console.log(`render: ${frames.length} frames -> ${OUT} in ${((clock() - t0) / 1000).toFixed(0)} s`);
