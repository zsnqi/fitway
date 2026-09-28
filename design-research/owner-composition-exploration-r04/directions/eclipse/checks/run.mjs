#!/usr/bin/env node
import { mkdtemp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { CHECKS, configurations, configName } from './constants.mjs';
import { ROOT, git, commit, prepareOut, archiveRevision, serve } from './archive.mjs';
import { runPool } from './pool.mjs';
import { chromium } from './browser.mjs';
import { analyzeRest } from './analyze-rest.mjs';
import { analyzeMinimal } from './minimal-change.mjs';
import { analyzeWalk } from './analyze-walk.mjs';
import { analyzeHover } from './analyze-hover.mjs';
import { analyzeGap } from './analyze-gap.mjs';
import { collectFarMoves, analyzeLayout } from './layout.mjs';
import { collectQuality } from './quality.mjs';
import { collectGuard } from './guard.mjs';
import { collectFrames } from './frames.mjs';
import { report } from './report.mjs';

const HELP = 'node E/checks/run.mjs <check...|all> --rev <sha> [--base <sha>] [--workers N] [--out <dir>] [--frames] [--plant <check>]';
function options(args) {
  const o = { checks: [], workers: 4, frames: false, plant: null };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--help' || a === '-h') { console.log(`${HELP}\nChecks: ${CHECKS.join(', ')}`); process.exit(0); }
    if (a === '--frames') { o.frames = true; continue; }
    if (['--rev', '--base', '--workers', '--out', '--plant'].includes(a)) {
      const v = args[++i]; if (!v || v.startsWith('--')) throw new Error(`Missing value for ${a}`);
      o[a.slice(2)] = a === '--workers' ? Number(v) : v; continue;
    }
    if (a === 'all') o.checks.push(...CHECKS);
    else if (CHECKS.includes(a)) o.checks.push(a);
    else throw new Error(`Unknown argument: ${a}`);
  }
  o.checks = CHECKS.filter(c => o.checks.includes(c));
  if (!o.rev || !o.checks.length) throw new Error(HELP);
  if (!Number.isInteger(o.workers) || o.workers < 1 || o.workers > 48) throw new Error('--workers must be an integer from 1 to 48');
  if (o.plant && !o.checks.includes(o.plant)) throw new Error('--plant must name a selected check');
  return o;
}

async function main() {
  const o = options(process.argv.slice(2)), started = performance.now();
  const before = git(['status', '--short']);
  const candidateSha = commit(o.rev), baseSha = o.base ? commit(o.base) : null;
  const out = await prepareOut(o.out || await mkdtemp(path.join(tmpdir(), 'eclipse-checks-')));
  const OUT = path.join(out, 'raw'); await mkdir(OUT);
  process.env.FITWAY_RUN_ID ||= `eclipse-checks-${process.pid}`;
  const servers = [], timing = { workers: o.workers, stages: {}, totalMs: null };
  const summary = { schemaVersion: 1, rev: candidateSha, base: baseSha, checks: {}, referenceDifferences: [] };
  let browser;
  console.log(`Eclipse checks: ${out}`);
  const stage = async (name, action) => { const t = performance.now(); const r = await action(); timing.stages[name] = performance.now() - t; return r; };
  try {
    const candidate = await archiveRevision(out, candidateSha, 'candidate');
    const cs = await serve(candidate.directory); servers.push(cs.server); Object.assign(candidate, cs);
    let base = null;
    if (baseSha) { base = await archiveRevision(out, baseSha, 'base'); const bs = await serve(base.directory); servers.push(bs.server); Object.assign(base, bs); }
    const has = c => o.checks.includes(c);
    const needsRest = has('rest') || has('readings') || has('width') || has('layout');
    const configs = configurations(has('rest') || has('layout') ? undefined : [[1440, 900]]);
    const payload = (version, c, plant = null) => ({ OUT, ver: version.ver, origin: version.origin, ...c, plant });
    if (needsRest) {
      const jobs = configs.map(c => ({ kind: 'rest', payload: payload(candidate, c, ['rest', 'layout'].includes(o.plant) ? o.plant : null) }));
      if (has('rest') && base) jobs.push(...configs.map(c => ({ kind: 'rest', payload: payload(base, c) })));
      await stage('rest', () => runPool(jobs, o.workers, 'rest'));
      const R = await analyzeRest(OUT, candidate.ver, has('rest') && base ? base.ver : null);
      if (has('rest') && base) {
        R.rule3IdealCoordinateDiagnostic = R.rule3;
        R.rule3 = await analyzeMinimal(OUT, candidate.ver, base.ver);
      }
      // Completeness and web-font readiness are evidence gates, not optional reductions of the matrix.
      const coverage = Object.keys(R.configs).length === configs.length && configs.every(config => {
        const measured = R.configs[configName(config)];
        return measured?.snaps === 318 && (config.fonts === 'fallback' ? !measured.fontOk : measured.fontOk);
      });
      if (!coverage) throw new Error('Incomplete rest snapshot, configuration or font coverage; dependent checks cannot pass');
      const first = JSON.parse(await readFile(path.join(OUT, 'sweep', candidate.ver, `${configName(configs[0])}.json`), 'utf8'));
      summary.response = first.response;
      if (has('rest')) summary.checks.rest = { pass: coverage && !R.errors.length && !R.rule1.snapErr && !R.rule1.tipWMismatchSnaps && !R.rule1.widthNotTipW &&
        !R.rule1.clip && !R.rule1.wrap && !R.rule1.outside && !R.rule2.violations && !R.rule3.mismatchCount,
        coverage, ...R };
    }
    const jobs = [];
    if (has('readings') || has('width')) jobs.push(...configurations([[1440, 900]]).map(c => ({ kind: 'walk', payload: payload(candidate, c, ['readings', 'width'].includes(o.plant) ? o.plant : null) })));
    if (has('hover') || has('gap')) {
      for (const version of has('hover') && base ? [base, candidate] : [candidate])
        jobs.push(...configurations([[1440, 900]]).map(c => ({ kind: 'hover', payload: payload(version, c, version === candidate && ['hover', 'gap'].includes(o.plant) ? o.plant : null) })));
    }
    if (has('nohist')) for (const lang of ['ar', 'en']) for (const state of ['live', 'delayed', 'nohistory']) for (const motion of [true, false])
      jobs.push({ kind: 'nohist', payload: payload(candidate, { lang, state, motion }, o.plant === 'nohist' ? o.plant : null) });
    await stage('motion-and-nohistory', () => runPool(jobs, o.workers, 'motion'));
    if (has('readings') || has('width')) {
      const W = await analyzeWalk(OUT, candidate.ver, candidate.ver, summary.response.maxFrac);
      if (has('readings')) summary.checks.readings = { pass: W.restChangedCovered === W.restChangedCases && W.steps === 159768 &&
        !W.errors.length && !W.allowViol && !(W.stillAtMorphEnd || 0) && !W.settleMismatch && !W.notSettled && !W.textMid, ...W };
      if (has('width')) summary.checks.width = { pass: W.steps === 159768 && !W.errors.length && !W.rule5.viol, ...W.rule5 };
    }
    if (has('hover') || has('gap')) {
      // Hover can run without rest; its allowance is calibrated from the same chart API on the measured revision.
      if (!summary.response) {
        const { openPage } = await import('./browser.mjs'); const { readResponse } = await import('./geometry.mjs');
        browser = await chromium.launch(); const p = await openPage(browser, { ...candidate, motion: false });
        summary.response = await readResponse(p.page); await p.context.close(); await browser.close(); browser = null;
      }
      const H = await analyzeHover(OUT, has('hover') && base ? [base.ver, candidate.ver] : [candidate.ver], summary.response.maxFrac);
      const r = H.res[candidate.ver], paired = r.vsBase;
      const G = await analyzeGap(OUT, candidate.ver, summary.response.maxFrac);
      const otherHoverViolations = r.allowViol - r.gap.allowViol;
      const baseCoverage = !base || !has('hover') ||
        (H.res[base.ver].transitions === 13416 && H.res[base.ver].errors === 0 &&
          H.res[base.ver].pageErrors.length === 0 && paired?.paired === r.settle.n && paired.onlyHere === 0);
      if (has('hover')) summary.checks.hover = { pass: r.transitions === 13416 && !r.errors && !r.pageErrors.length && !r.settleMismatch && !r.notSettled && !r.stj &&
        !otherHoverViolations && !G.cornerViol && !r.textMid && baseCoverage &&
        (!paired || paired.pairedThis.median <= paired.pairedBase.median + 1e-6 && paired.pairedThis.p90 <= paired.pairedBase.p90 + 1e-6),
        ...r, gapCorner: G, otherHoverViolations, pinnedEdgeGapDiagnostic: r.gap.allowViol, baseCoverage };
      if (has('gap')) summary.checks.gap = { pass: G.transitions === 720 && !G.errors && !G.pageErrors.length && !G.cornerViol && !G.stj && !G.settledMismatch,
        ...G };
    }
    if (has('nohist')) {
      const files = (await readdir(`${OUT}/nohist/${candidate.ver}`)).sort();
      const rows = await Promise.all(files.map(async f => JSON.parse(await readFile(`${OUT}/nohist/${candidate.ver}/${f}`, 'utf8')).rec));
      const r = { runs: rows.length, checks: rows.reduce((n, r) => n + r.checks, 0), errors: rows.reduce((n, r) => n + r.errors.length, 0), wrong: rows.reduce((n, r) => n + r.bad, 0), rows };
      // The supplied nohist.mjs and its saved 8ae88f3 summary produce 1,976, not the brief's 1,992.
      summary.checks.nohist = { pass: r.runs === 12 && r.checks === 1976 && !r.errors && !r.wrong, ...r };
    }
    if (has('layout') || o.frames) {
      browser = await chromium.launch();
      if (has('layout')) {
        const far = await stage('home-end', () => collectFarMoves(browser, { OUT, ...candidate }));
        const L = await analyzeLayout(OUT, candidate.ver, far);
        summary.checks.layout = { pass: !L.controls.some(c => c.detected), measuredOnly: true, ...L };
      }
      if (o.frames) summary.frames = await stage('frames', () => collectFrames(browser, out, candidate, o.checks));
      await browser.close(); browser = null;
    }
    if (has('guard')) {
      const reserved = await serve(candidate.directory); const port = reserved.port;
      await new Promise(resolve => reserved.server.close(resolve));
      summary.checks.guard = await stage('guard', () => collectGuard(OUT, candidate, port, o.plant));
    }
    // Every fake-clock browser and the capture subprocesses have exited before real-time measurements start.
    if (has('quality')) {
      browser = await chromium.launch();
      summary.checks.quality = await stage('quality', () => collectQuality(browser, OUT, candidate, base, o.plant));
      await browser.close(); browser = null;
    }
  } catch (error) { summary.infrastructureError = error.stack || String(error); console.error(summary.infrastructureError); }
  finally {
    if (browser) await browser.close().catch(() => {});
    for (const server of servers) await new Promise(resolve => server.close(resolve));
  }
  if (git(['status', '--short']) !== before) summary.infrastructureError = 'Harness changed git status --short';
  summary.pass = !summary.infrastructureError && o.checks.every(c => summary.checks[c]?.pass);
  await report(out, summary);
  await mkdir(path.join(out, 'results'));
  for (const [check, result] of Object.entries(summary.checks))
    await writeFile(path.join(out, 'results', `${check}.json`), JSON.stringify(result, null, 2) + '\n');
  await writeFile(path.join(out, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
  timing.totalMs = performance.now() - started;
  await writeFile(path.join(out, 'timing.json'), JSON.stringify(timing, null, 2) + '\n');
  console.log(`${summary.pass ? 'PASS' : 'FAIL'} ${o.checks.join(', ')} in ${(timing.totalMs / 1000).toFixed(2)} s; ${path.join(out, 'REPORT.md')}`);
  if (!summary.pass) process.exitCode = 1;
}
main().catch(error => { console.error(error.stack || String(error)); process.exitCode = 1; });
