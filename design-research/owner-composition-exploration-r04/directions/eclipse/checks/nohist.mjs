// Adapted from the independent verifier's nohist.mjs, 2026-09-28. Definitions retained.
import { mkdir, writeFile } from 'node:fs/promises';
import { openPage } from './browser.mjs';
import { FRAME_MS as H } from './constants.mjs';
export async function collectNohist(browser, { OUT, ver, origin, plant, lang, state, motion }) {
await mkdir(`${OUT}/nohist/${ver}`, { recursive: true });
  const { context, page, errors } = await openPage(browser, { origin, plant, ver, lang, state, motion, vt: motion });
  const tick = (n) => (motion ? page.evaluate(async ({ n, H }) => { for (let i = 0; i < n; i++) await window.__vt.tick(H); }, { n, H }) : Promise.resolve());
  const snap = () => page.evaluate(() => { const t = document.querySelector("#tip"), pr = document.querySelector("#plot").getBoundingClientRect(); if (t.hidden) return { hidden: true, sel: window.__eclipse.chart.selected }; const b = t.getBoundingClientRect(); return { sel: window.__eclipse.chart.selected, text: t.textContent, l: +(b.left - pr.left).toFixed(3), t: +(b.top - pr.top).toFixed(3) }; });
  // rest map: every stop placed at rest (tip hidden first -> instant)
  const rest = await page.evaluate(() => { const ch = window.__eclipse.chart, m = {}; const pr = document.querySelector("#plot").getBoundingClientRect(); for (const s of ch.stops) { ch.clear(); ch.select(s.key); const t = document.querySelector("#tip"), b = t.getBoundingClientRect(); m[s.key] = { text: t.textContent, l: +(b.left - pr.left).toFixed(3), t: +(b.top - pr.top).toFixed(3), x: s.clientX }; } ch.clear(); return m; });
  const hit = await page.evaluate(() => { const b = document.querySelector("#plot-hit").getBoundingClientRect(); return { x: b.left, y: b.top + b.height / 2, w: b.width }; });
  const checks = [];
  const judge = (label, s) => {
    if (s.hidden) { checks.push({ label, ok: false, why: "hidden" }); return; }
    const r = rest[s.sel];
    const owner = Object.entries(rest).find(([, v]) => Math.abs(v.l - s.l) < 0.02 && Math.abs(v.t - s.t) < 0.02 && v.text === s.text);
    const ok = r && r.text === s.text && Math.abs(r.l - s.l) < 0.02 && Math.abs(r.t - s.t) < 0.02;
    checks.push({ label, sel: s.sel, ok, textMatchesSel: r ? r.text === s.text : null, placedFor: owner ? owner[0] : null, got: [s.l, s.t], want: r ? [r.l, r.t] : null });
  };
  // (1) a fast pointer sweep across the whole chart and back, one frame per move
  const keys = Object.keys(rest).sort((a, b) => rest[a].x - rest[b].x);
  const x0 = rest[keys[0]].x - 4, x1 = rest[keys[keys.length - 1]].x + 4;
  for (const [a, b] of [[x0, x1], [x1, x0]]) {
    const n = Math.ceil(Math.abs(b - a) / 6);
    for (let i = 0; i <= n; i++) { await page.mouse.move(a + ((b - a) * i) / n, hit.y); await tick(1); }
    await tick(90);
    judge(`sweep-end ${a < b ? "fwd" : "back"}`, await snap());
  }
  // (2) stop by stop with the pointer, settling at each
  for (const k of keys) { await page.mouse.move(rest[k].x, hit.y); await tick(60); judge(`pointer ${k}`, await snap()); }
  for (const k of keys.slice().reverse()) { await page.mouse.move(rest[k].x, hit.y); await tick(60); judge(`pointer-back ${k}`, await snap()); }
  // (3) keyboard: focus, Home, then later-direction keys through every stop, then back
  await page.mouse.move(5, 5);
  await tick(5);
  await page.focus("#plot-hit");
  await tick(30);
  const later = lang === "ar" ? "ArrowLeft" : "ArrowRight", earlier = lang === "ar" ? "ArrowRight" : "ArrowLeft";
  await page.keyboard.press("Home"); await tick(60); judge("key Home", await snap());
  for (let i = 0; i < keys.length + 1; i++) { await page.keyboard.press(later); await tick(60); judge(`key later ${i}`, await snap()); }
  for (let i = 0; i < keys.length + 1; i++) { await page.keyboard.press(earlier); await tick(60); judge(`key earlier ${i}`, await snap()); }
  // quick key presses without settling, then settle
  for (let i = 0; i < 10; i++) { await page.keyboard.press(later); await tick(2); }
  await tick(90); judge("key quick", await snap());
  const bad = checks.filter((c) => !c.ok);
  const rec = { ver, lang, state, motion, errors, checks: checks.length, bad: bad.length, badExamples: bad.slice(0, 8) };
  await writeFile(`${OUT}/nohist/${ver}/${lang}-${state}-${motion ? "on" : "off"}.json`, JSON.stringify({ rec, checks, rest }, null, 1));
  await context.close();
  return rec;
}
