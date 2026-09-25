// Verifier: the live tail morph (held at fractions) and the rail open/close (held at times), current code against the
// Round 6 copy, pixel for pixel (pulse hidden), plus the animation lists.
import { chromium } from "file:///D:/Projects/fitway-worktrees/owner-design-exploration-r04/node_modules/@playwright/test/index.mjs";
import { writeFileSync, mkdirSync } from "node:fs";
const CUR = "file:///D:/Projects/fitway-worktrees/owner-design-exploration-r04/design-research/owner-composition-exploration-r04/directions/eclipse/index.html";
const OLD = "file:///C:/Users/PCFORC~1/AppData/Local/Temp/claude/D--Projects-fitway-worktrees-owner-design-exploration-r04/8f6a215f-9d39-4251-a39f-d9ed1baf14d0/scratchpad/eclipse-before-r7a/index.html";
const OUT = process.argv[2]; mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const res = {};
for (const [label, base] of [["cur", CUR], ["r6", OLD]]) for (const lang of ["ar", "en"]) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference", colorScheme: "dark", deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto(`${base}?lang=${lang}&tuner=0`, { waitUntil: "networkidle" }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  await p.addStyleTag({ content: ".ping{visibility:hidden!important}" });
  const plot = await p.evaluate(() => { const r = document.getElementById("plot").getBoundingClientRect(); return { x: Math.floor(r.x), y: Math.floor(r.y), width: Math.ceil(r.width), height: Math.ceil(r.height) }; });
  const r = { tail: [], rail: [] };
  await p.evaluate(() => window.__eclipse.motion.step());
  for (const f of [0, 0.25, 0.5, 0.75, 1]) {
    await p.evaluate((f) => window.__eclipse.motion.seekLive(f), f); await p.waitForTimeout(60);
    const file = `${OUT}/${label}-${lang}-tail-${f}.png`;
    await p.screenshot({ path: file, clip: plot });
    const svg = await p.evaluate(() => document.querySelector("#plot-svg svg").outerHTML.replace('<g id="sel-under"></g>', ""));
    r.tail.push({ f, file, svgLen: svg.length, svg });
  }
  await p.evaluate(() => window.__eclipse.motion.settle()); await p.waitForTimeout(300);
  // rail: open, held
  await p.click("#brand");
  r.railAnims = await p.evaluate(() => document.getAnimations().map((a) => ({ target: `${a.effect?.target?.tagName}.${(a.effect?.target?.className?.baseVal ?? a.effect?.target?.className ?? "").toString()}`, props: [...new Set((a.effect?.getKeyframes?.() ?? []).flatMap((k) => Object.keys(k).filter((x) => !["offset", "easing", "composite", "computedOffset"].includes(x))))], dur: a.effect?.getTiming?.().duration, easing: a.effect?.getTiming?.().easing })).filter((a) => !/ping/.test(a.target)));
  for (const t of [40, 90]) {
    await p.evaluate((t) => document.getAnimations().forEach((a) => { if (!/ping/.test(a.effect?.target?.className ?? "")) { a.pause(); a.currentTime = t; } }), t);
    await p.waitForTimeout(60);
    const file = `${OUT}/${label}-${lang}-rail-open-${t}.png`;
    await p.screenshot({ path: file });
    r.rail.push({ t, file });
  }
  res[`${label}-${lang}`] = r;
  await ctx.close();
}
await b.close();
// strip svg bodies for size, keep equality
const cmp = {};
for (const lang of ["ar", "en"]) {
  const a = res[`cur-${lang}`], o = res[`r6-${lang}`];
  cmp[lang] = { tailSvgEqual: a.tail.map((x, i) => x.svg === o.tail[i].svg), railAnimsEqual: JSON.stringify(a.railAnims) === JSON.stringify(o.railAnims), railAnims: a.railAnims, pairs: a.tail.map((x, i) => [x.file, o.tail[i].file]).concat(a.rail.map((x, i) => [x.file, o.rail[i].file])) };
}
writeFileSync(`${OUT}/unchanged.json`, JSON.stringify(cmp, null, 1));
console.log(JSON.stringify(Object.fromEntries(Object.entries(cmp).map(([k, v]) => [k, { tailSvgEqual: v.tailSvgEqual, railAnimsEqual: v.railAnimsEqual, railAnimCount: v.railAnims.length }]))));
