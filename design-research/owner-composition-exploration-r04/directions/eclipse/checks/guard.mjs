import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, writeFile, symlink } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { ROOT, git, within } from './archive.mjs';
import { ECLIPSE } from './constants.mjs';
import { execFileSync } from 'node:child_process';

async function runCapture(script, args, cwd, env, log) {
  const result = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], { cwd, env: { ...process.env, ...env }, windowsHide: true });
    let output = '';
    child.stdout.on('data', b => { output += b; }); child.stderr.on('data', b => { output += b; });
    const timeout = setTimeout(() => child.kill(), 30 * 60 * 1000);
    child.on('error', reject);
    child.on('close', (code, signal) => { clearTimeout(timeout); resolve({ code, signal, output }); });
  });
  await writeFile(log, result.output);
  return result;
}

export async function collectGuard(OUT, version, port, plant) {
  if (process.platform !== 'win32') throw new Error('The reference capture guard requires Windows drive-path semantics');
  const root = path.join(OUT, 'guard');
  if (!within(root, tmpdir())) throw new Error('Guard output must be inside the system temp directory');
  await mkdir(root, { recursive: true });
  // Chromium's file:// calibration in capture.mjs fails on Windows at the very long scratch
  // path used by some task runners. Archive the *same revision* into a short system-temp root.
  const copyRoot = await mkdtemp(path.join(tmpdir(), 'ecg-'));
  const tar = path.join(copyRoot, 'source.tar');
  git(['archive', '--format=tar', `--output=${tar}`, version.ver, ECLIPSE,
    'design-research/owner-composition-exploration-r04/directions/light-study']);
  execFileSync('tar', ['-xf', tar, '-C', copyRoot], { windowsHide: true, stdio: 'pipe' });
  const copyDir = path.join(copyRoot, ECLIPSE);
  const source = await readFile(path.join(copyDir, 'capture.mjs'), 'utf8');
  if (!/const PORT = 3173;/.test(source)) throw new Error('Unrecognized capture port declaration');
  let copy = source.replace('const PORT = 3173;', `const PORT = ${port};`);
  // The only source control removes the any-Git-tree refusal from a temp copy. It cannot reach the real repo.
  if (plant === 'guard') {
    if (!copy.includes('if (gitRoot) {')) throw new Error('This revision has no any-Git-tree guard to plant');
    copy = copy.replace('if (gitRoot) {', 'if (false && gitRoot) {');
  }
  const script = path.join(copyDir, 'capture-check.mjs');
  await writeFile(script, copy);
  await symlink(path.join(ROOT, 'node_modules'), path.join(copyRoot, 'node_modules'), 'junction');
  const gitTree = path.join(root, 'gitrepo'), junction = path.join(root, 'junction'), tempPrefix = path.join(root, 'tp');
  await mkdir(gitTree, { recursive: true }); await mkdir(tempPrefix, { recursive: true });
  git(['init', '-q', gitTree]); await symlink(gitTree, junction, 'junction');
  const p = (...parts) => path.join(root, ...parts);
  // The reference plantguard.ps1 refusal list. The probes point only into this disposable output tree.
  const tests = [
    ['relative path', ['rel\\out'], path.join(copyRoot, 'rel')],
    ['UNC \\\\127.0.0.1\\c$', ['\\\\127.0.0.1\\c$\\Users\\PCFORC~1\\AppData\\Local\\Temp\\guard-unc-out'], p('unc-out')],
    ['device \\\\?\\C:', ['\\\\?\\C:\\Users\\PCFORC~1\\AppData\\Local\\Temp\\guard-device-out'], p('device-out')],
    ['device \\\\.\\C:', ['\\\\.\\C:\\Users\\PCFORC~1\\AppData\\Local\\Temp\\guard-device2-out'], p('device2-out')],
    ['UNC //127.0.0.1/c$', ['//127.0.0.1/c$/Users/PCFORC~1/AppData/Local/Temp/guard-unc2-out'], p('unc2-out')],
    ['intro-frames UNC', [p('ok-if'), '--intro-frames=\\\\127.0.0.1\\c$\\Users\\PCFORC~1\\AppData\\Local\\Temp\\guard-unc3-out'], p('ok-if')],
    ['TEMP prefix (tp vs tpx)', [p('tpx', 'out')], p('tpx'), tempPrefix],
    ['git tree inside temp', [path.join(gitTree, 'out')], path.join(gitTree, 'out')],
    ['git tree = TEMP', [path.join(gitTree, 'out2')], path.join(gitTree, 'out2'), gitTree],
    ['junction to git tree', [path.join(junction, 'out3')], path.join(gitTree, 'out3')],
    ['intro-frames in git tree', [p('ok-if2'), `--intro-frames=${path.join(gitTree, 'if')}`], p('ok-if2')],
    ['inside .git dir', [path.join(gitTree, '.git', 'zz')], path.join(gitTree, '.git', 'zz')],
    ['repo worktree (copy), TEMP normal', [path.join(copyRoot, 'zz', 'out')], path.join(copyRoot, 'zz')],
    ['repo worktree (copy) = TEMP', [path.join(copyRoot, 'zz2', 'out')], path.join(copyRoot, 'zz2'), copyRoot],
  ];
  const rows = [];
  for (const [name, args, probe, temp] of tests) {
    const before = existsSync(probe);
    const result = await runCapture(script, ['--plant=once', ...args], copyRoot, {
      PLAYWRIGHT_BROWSERS_PATH: p('nobrowsers'), ...(temp ? { TEMP: temp, TMP: temp } : {}),
    }, p(`${rows.length}-refusal.txt`));
    const after = existsSync(probe);
    const refused = result.code !== 0 && /Error: --plant .*?(must|requires)/.test(result.output) && !before && !after;
    rows.push({ name, exit: result.code, before, after, refused, message: result.output.split('\n').find(l => /^Error:/.test(l)) || null });
  }
  const valid = await runCapture(script, ['--plant=once', p('valid-scratch')], copyRoot, { PLAYWRIGHT_BROWSERS_PATH: p('nobrowsers') }, p('valid-scratch.txt'));
  const validPassesGuard = /browserType\.launch|Executable doesn.t exist/.test(valid.output) && existsSync(p('valid-scratch'));
  const captures = {};
  for (const mode of ['once', 'always']) {
    console.log(`guard: capture.mjs --plant=${mode} (temporary port ${port})`);
    const result = await runCapture(script, [`--plant=${mode}`, p(mode)], copyRoot, {}, p(`${mode}.txt`));
    let recaptures = null;
    try { recaptures = JSON.parse(await readFile(p(mode, 'capture-log.json'), 'utf8')).motion.recaptures; } catch {}
    captures[mode] = { exit: result.code, signal: result.signal, log: `raw/guard/${mode}.txt`,
      comparisons: recaptures?.comparisons ?? 0, reached: recaptures?.plantReached ?? 0,
      noise: recaptures?.noise.length ?? 0, repeatedMismatches: recaptures?.differedTwice.length ?? 0 };
  }
  const summary = { refusals: rows.length, refused: rows.filter(r => r.refused).length, rows, validPassesGuard, captures,
    shortRevisionCopy: copyRoot };
  summary.pass = summary.refused === tests.length && validPassesGuard && captures.once.exit === 0 && captures.once.noise > 0 &&
    captures.always.exit !== 0 && captures.always.exit !== null && captures.always.repeatedMismatches > 0;
  await writeFile(p('rows.json'), JSON.stringify(summary, null, 2));
  return summary;
}
