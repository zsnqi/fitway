import { mkdir, writeFile } from 'node:fs/promises';
import { openPage } from './browser.mjs';
import { scenario } from './quality-scenario.mjs';

// State order, input sequence, dwell times and accessibility phases are the reference probes' definitions.
async function accessibility(browser, version, lang, state, plant = false) {
  const { page, context, errors } = await openPage(browser, { ...version, lang, state, motion: false });
  const s = {};
  if (plant) await page.evaluate(() => document.querySelector('#details-btn span').textContent += ' PLANTED');
  s.idle = await page.locator('body').ariaSnapshot();
  await page.focus('#plot-hit'); s.focus = await page.locator('body').ariaSnapshot();
  for (let i = 0; i < 5; i++) await page.keyboard.press(lang === 'ar' ? 'ArrowRight' : 'ArrowLeft');
  s.keys = await page.locator('body').ariaSnapshot();
  await page.keyboard.press('Home'); s.home = await page.locator('body').ariaSnapshot();
  await page.evaluate(() => { for (let i = 0; i < 3; i++) window.__eclipse.motion.step(); });
  s.reading = await page.locator('body').ariaSnapshot();
  s.slider = await page.evaluate(() => [...document.querySelector('#plot-hit').attributes].map(a => `${a.name}=${a.value}`).join(' | '));
  s.hiddenMeasure = await page.evaluate(() => {
    const m = document.querySelector('.tip-measure');
    return m ? { ariaHidden: m.getAttribute('aria-hidden'), children: m.children.length } : null;
  });
  await page.evaluate(() => document.querySelector('#details-btn span').textContent += ' x');
  s.labelControl = await page.locator('body').ariaSnapshot();
  s.labelDetected = s.labelControl !== s.reading;
  s.errors = errors;
  await context.close();
  return s;
}

export async function collectQuality(browser, OUT, candidate, base, plant) {
  const rows = {}, trees = {}, diffs = [];
  let consoleErrors = 0, longFrames = 0, gapMax = 0, unsupported = 0, labelControls = 0, hiddenMeasureErrors = 0;
  for (const lang of ['ar', 'en']) for (const state of ['live', 'delayed', 'nohistory']) {
    console.log(`quality (alone): ${lang}-${state}`);
    const { page, context, errors } = await openPage(browser, { ...candidate, lang, state, motion: true });
    const r = await scenario(page, { control: plant === 'quality' && lang === 'ar' && state === 'live' });
    rows[`${lang}-${state}`] = { ...r, errors };
    consoleErrors += errors.length; longFrames += r.loaf50; gapMax = Math.max(gapMax, r.gapMax);
    if (r.noLoaf) unsupported++;
    await context.close();
    const tree = await accessibility(browser, candidate, lang, state, plant === 'quality');
    trees[`${candidate.ver}|${lang}|${state}`] = tree;
    consoleErrors += tree.errors.length;
    labelControls += Number(tree.labelDetected);
    if (!tree.hiddenMeasure || tree.hiddenMeasure.ariaHidden !== 'true') hiddenMeasureErrors++;
    if (base) {
      const b = await accessibility(browser, base, lang, state);
      trees[`${base.ver}|${lang}|${state}`] = b;
      consoleErrors += b.errors.length;
      for (const phase of ['idle', 'focus', 'keys', 'home', 'reading', 'slider'])
        if (b[phase] !== tree[phase]) diffs.push({ lang, state, phase, base: b[phase], candidate: tree[phase] });
    }
  }
  console.log('quality (alone): planted 90-ms task and layout shift');
  const { page, context, errors } = await openPage(browser, { ...candidate, lang: 'ar', state: 'live', motion: true });
  const control = { ...await scenario(page, { control: true, lsControl: true }), errors };
  await context.close();
  const controlDetected = control.loafMax >= 90 && control.gapMax > 50.1 && control.lsEntries > 0;
  const cls = Object.values(rows).map(r => r.cls);
  const summary = { runs: 6, consoleErrors, longFrames, gapMax, gapLimit: 50.1, unsupported,
    cls: { min: Math.min(...cls), max: Math.max(...cls) }, accessibilityDifferences: base ? diffs.length : null,
    labelControls, hiddenMeasureErrors, controlDetected,
    control: { longFrameMs: control.loafMax, gapMs: control.gapMax, cls: control.cls, shiftSources: control.raw.ls.length } };
  summary.pass = !consoleErrors && !longFrames && gapMax <= 50.100001 && !unsupported &&
    !hiddenMeasureErrors && !diffs.length && labelControls === 6 && controlDetected;
  await mkdir(`${OUT}/quality`, { recursive: true });
  await writeFile(`${OUT}/quality/rows.json`, JSON.stringify({ rows, control }, null, 2));
  await writeFile(`${OUT}/quality/accessibility.json`, JSON.stringify({ trees, diffs }, null, 2));
  return summary;
}
