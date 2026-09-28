// Adapted from the independent verifier's quality.mjs, 2026-09-28. Definitions retained.
const OBS = () => {
  window.__q = { loaf: [], ls: [], gaps: [], lt: [] };
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__q.loaf.push({ d: e.duration, b: e.blockingDuration, t: e.startTime, scripts: e.scripts.map(s => ({ invoker: s.invoker, sourceURL: s.sourceURL, forcedStyleAndLayoutDuration: s.forcedStyleAndLayoutDuration })) }))).observe({ type: "long-animation-frame", buffered: false }); } catch (e) { window.__q.noLoaf = String(e); }
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__q.ls.push({ v: e.value, r: e.hadRecentInput, t: e.startTime, sources: e.sources.map(s => ({ node: s.node?.id ? '#' + s.node.id : s.node?.className || s.node?.tagName || null, previous: s.previousRect.toJSON(), current: s.currentRect.toJSON() })) }))).observe({ type: "layout-shift", buffered: false }); } catch (e) {}
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__q.lt.push(e.duration))).observe({ type: "longtask", buffered: false }); } catch (e) {}
  let last = performance.now();
  const loop = (t) => { const g = t - last; last = t; window.__q.gaps.push(g); window.__q.raf = requestAnimationFrame(loop); };
  window.__q.raf = requestAnimationFrame(loop);
};
export async function scenario(page, { control = false, lsControl = false } = {}) {
  await page.evaluate(OBS);
  const hit = await page.evaluate(() => { const b = document.querySelector("#plot-hit").getBoundingClientRect(); return { x: b.left, y: b.top + b.height / 2, w: b.width }; });
  const xs = await page.evaluate(() => window.__eclipse.chart.stops.map((s) => s.clientX));
  xs.sort((a, b) => a - b);
  // pointer sweep across and back
  for (const x of [...xs, ...xs.slice().reverse()]) { await page.mouse.move(x, hit.y, { steps: 3 }); await page.waitForTimeout(30); }
  if (control) await page.evaluate(() => { setTimeout(() => { const t = performance.now(); while (performance.now() - t < 90) {} }, 0); });
  // readings with a stop selected, at a varied pace
  const keys = await page.evaluate(() => window.__eclipse.chart.stops.map((s) => s.key));
  for (const [i, k] of ["latest", "peak", "gap", keys[Math.floor(keys.length / 2)], keys[keys.length - 2]].entries()) {
    const x = xs[Math.min(xs.length - 1, [xs.length - 1, 0, 1, Math.floor(xs.length / 2), xs.length - 2][i])];
    await page.mouse.move(x, hit.y);
    await page.evaluate((k) => window.__eclipse.chart.select(k), k);
    for (let n = 0; n < 6; n++) { await page.evaluate(() => window.__eclipse.motion.step()); await page.waitForTimeout(n % 2 ? 120 : 420); }
  }
  // keyboard stepping
  await page.focus("#plot-hit");
  for (let n = 0; n < 12; n++) { await page.keyboard.press("ArrowRight"); await page.waitForTimeout(60); }
  await page.waitForTimeout(600);
  // readings with no recent input (more than 500 ms after the last key), a stop selected by the keyboard
  for (let n = 0; n < 8; n++) { await page.evaluate(() => window.__eclipse.motion.step()); await page.waitForTimeout(700); }
  if (lsControl) await page.evaluate(() => { const d = document.createElement("div"); d.style.height = "40px"; const m = document.querySelector("main") || document.body; m.prepend(d); });
  if (lsControl) await page.waitForTimeout(400);
  return page.evaluate(() => { cancelAnimationFrame(window.__q.raf); const q = window.__q; const g = q.gaps.slice(1); const ni = q.ls.filter((e) => !e.r); return { raw: { loaf: q.loaf, ls: q.ls, gaps: q.gaps, lt: q.lt }, loaf: q.loaf.length, loaf50: q.loaf.filter((e) => e.d > 50).length, loafMax: Math.max(0, ...q.loaf.map((e) => e.d)), noLoaf: q.noLoaf || null, lt: q.lt.length, ltMax: Math.max(0, ...q.lt), frames: g.length, gapMax: Math.max(0, ...g), gaps50: g.filter((x) => x > 50).length, cls: +q.ls.reduce((s, e) => s + e.v, 0).toFixed(5), lsEntries: q.ls.length, lsNoInput: ni.length, clsNoInput: +ni.reduce((s, e) => s + e.v, 0).toFixed(5) }; });
}
