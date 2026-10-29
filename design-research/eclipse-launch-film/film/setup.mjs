#!/usr/bin/env node
/**
 * setup.mjs: put every runtime file a render needs inside the project, so no render touches the network.
 * Runs after `npm install` (postinstall). Safe to re-run.
 *   vendor/gsap.min.js          GSAP, the HyperFrames timeline
 *   vendor/three/               three.js 0.169.0 (the device moment only) and the addons the scene imports
 *   vendor/eclipse -> ../../vendor/eclipse   the pinned Eclipse snapshot (scripts/fetch-eclipse.sh), read only
 *   fonts/readex-pro-latin.woff2  Readex Pro, Eclipse's own face (OFL), self-hosted from the snapshot
 *   assets/                     the FITWAY mark and its fitted geometry, from storyboard/src/
 *   scripts/                    cinetic's tools at the pinned clone (new-film.sh copies them; kept out of git)
 * Everything it writes is gitignored. Exit 1 when a source is missing.
 */
import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync, symlinkSync, lstatSync, readlinkSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const film = join(here, '..'); // design-research/eclipse-launch-film
const CINETIC = process.env.CINETIC_SKILL || '/home/user/leonxlnx/cinetic/skills/cinetic';
let missing = 0;
const need = (p, what) => { if (!existsSync(p)) { console.error(`setup: missing ${p} (${what})`); missing++; return false; } return true; };
const copy = (from, to) => { if (!need(from, 'source')) return; mkdirSync(dirname(to), { recursive: true }); copyFileSync(from, to); console.log(`setup: ${relative(here, to)}`); };

copy(join(here, 'node_modules/gsap/dist/gsap.min.js'), join(here, 'vendor/gsap.min.js'));
const three = join(here, 'node_modules/three');
if (need(three, 'npm install')) {
  copy(join(three, 'build/three.module.js'), join(here, 'vendor/three/three.module.js'));
  rmSync(join(here, 'vendor/three/addons'), { recursive: true, force: true });
  cpSync(join(three, 'examples/jsm'), join(here, 'vendor/three/addons'), { recursive: true });
  console.log('setup: vendor/three/addons');
}
// Eclipse: a link, never a copy, so the film always shows the pinned snapshot itself.
const ecl = join(film, 'vendor/eclipse');
if (need(join(ecl, 'index.html'), 'run scripts/fetch-eclipse.sh')) {
  const link = join(here, 'vendor/eclipse');
  mkdirSync(dirname(link), { recursive: true });
  let ok = false;
  try { ok = lstatSync(link).isSymbolicLink() && readlinkSync(link) === '../../vendor/eclipse'; } catch { /* absent */ }
  if (!ok) { rmSync(link, { recursive: true, force: true }); symlinkSync('../../vendor/eclipse', link); }
  console.log('setup: vendor/eclipse -> ../../vendor/eclipse');
  copy(join(ecl, 'fonts/readex-pro-latin.woff2'), join(here, 'fonts/readex-pro-latin.woff2'));
  copy(join(ecl, 'fonts/OFL.txt'), join(here, 'fonts/OFL-readex-pro.txt'));
}
copy(join(film, 'storyboard/src/fitway-mark.svg'), join(here, 'assets/fitway-mark.svg'));
copy(join(film, 'storyboard/src/mark-geometry.json'), join(here, 'assets/mark-geometry.json'));
// cinetic's scripts: new-film.sh copied them in; restore them from the pinned clone when they are absent.
if (!existsSync(join(here, 'scripts/lint-film.mjs')) && existsSync(join(CINETIC, 'scripts'))) {
  cpSync(join(CINETIC, 'scripts'), join(here, 'scripts'), { recursive: true, filter: (p) => !/(__pycache__|\/test(\/|$))/.test(p) });
  mkdirSync(join(here, 'scripts/library'), { recursive: true });
  copy(join(CINETIC, 'assets/library/techniques.json'), join(here, 'scripts/library/techniques.json'));
  console.log('setup: scripts/ (cinetic tools)');
}
process.exit(missing ? 1 : 0);
