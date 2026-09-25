// Coordinator's independent motion checks (motion on): first paint, animations at load, digit roll (no glyph
// opacity, direction, live region, plain markup after), level bars, delayed, and the header chip after a live update.
import { chromium } from "file:///D:/Projects/fitway-worktrees/owner-design-exploration-r04/node_modules/@playwright/test/index.mjs";
import { writeFileSync } from "node:fs";
const BASE = process.env.BASE ?? "file:///D:/Projects/fitway-worktrees/owner-design-exploration-r04/design-research/owner-composition-exploration-r04/directions/eclipse/index.html";
const REF = "C:/Users/PCFORC~1/AppData/Local/Temp/claude/D--Projects-fitway-worktrees-owner-design-exploration-r04/d329255d-7158-42d6-8349-b9c7d39168a4/scratchpad/eclipse-v3-user-copy/evidence";
const OUT = process.argv[2];
const b = await chromium.launch();
const res = { firstPaint: [], roll: {}, bars: {}, delayed: {}, chip: {} };
const newPage = async (scale = 1) => {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: scale, reducedMotion: "no-preference", colorScheme: "dark" });
  const p = await ctx.newPage(); const errors = []; p.on("pageerror", (e) => errors.push(String(e))); p.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  return { ctx, p, errors };
};
const animList = () => document.getAnimations().map((a) => {
  const t = a.effect?.target; const kf = a.effect?.getKeyframes?.() ?? [];
  return { type: a.constructor.name, name: a.animationName ?? null, target: t ? `${t.tagName}#${t.id}.${(t.className?.baseVal ?? t.className ?? "").toString().replace(/\s+/g, ".")}` : null, pseudo: a.effect?.pseudoElement ?? null, props: [...new Set(kf.flatMap((k) => Object.keys(k).filter((x) => !["offset", "easing", "composite", "computedOffset"].includes(x))))], text: t ? (t.textContent ?? "").trim().slice(0, 12) : "", state: a.playState };
});

// 1. First paint with motion on: what is visible at DOMContentLoaded, animations at load, settled frame vs still.
for (const [name, q] of [["daily-ar-1440x900", "lang=ar&tuner=0"], ["daily-en-1440x900", "lang=en&tuner=0"], ["daily-ar-1440x900-delayed", "lang=ar&state=delayed&tuner=0"], ["daily-ar-1440x900-nohistory", "lang=ar&state=nohistory&tuner=0"]]) {
  const { ctx, p, errors } = await newPage();
  await p.goto(`${BASE}?${q}`, { waitUntil: "commit" });
  await p.waitForSelector("#now-v", { state: "attached" });
  const early = await p.evaluate(() => ({ fontsStatus: document.fonts.status, nowText: document.getElementById("now-v")?.textContent, hidden: [...document.querySelectorAll("main *, .card")].filter((e) => { const s = getComputedStyle(e); return s.visibility === "hidden" || s.opacity === "0"; }).map((e) => e.id || e.className).slice(0, 10) }));
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
  const anims = await p.evaluate(animList);
  await p.addStyleTag({ content: ".ping{visibility:hidden!important}" }); await p.waitForTimeout(120);
  await p.screenshot({ path: `${OUT}/on-${name}.png` });
  res.firstPaint.push({ name, file: `${OUT}/on-${name}.png`, ref: `${REF}/${name}.png`, early, anims, errors });
  await ctx.close();
}

// 2. Digit roll on a new reading, sampled every frame.
for (const lang of ["ar", "en"]) {
  const { ctx, p, errors } = await newPage();
  await p.goto(`${BASE}?lang=${lang}&tuner=0`); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
  const r = await p.evaluate(async (animListSrc) => {
    const animList = eval(animListSrc);
    const ids = ["now-v", "entries-v"];
    const before = Object.fromEntries(ids.map((i) => [i, document.getElementById(i).innerHTML]));
    const beforeText = Object.fromEntries(ids.map((i) => [i, document.getElementById(i).textContent]));
    const stepRes = window.__eclipse.motion.step();
    const t0 = performance.now();
    const frames = [], opacityHits = [], animsSeen = new Map();
    await new Promise((res) => {
      const tick = () => {
        const t = performance.now() - t0;
        document.querySelectorAll(".roll-slot, .roll-new, .roll-old, .roll-run, #now-v, #entries-v, #now-foot, #now-foot *").forEach((e) => {
          let n = e, o = 1; while (n && n !== document.body) { o *= Number(getComputedStyle(n).opacity); n = n.parentElement; }
          if (o < 0.999 && (e.textContent ?? "").trim()) opacityHits.push({ t: Math.round(t), el: e.className || e.id, o: +o.toFixed(3) });
        });
        animList().forEach((a) => animsSeen.set(`${a.target}|${a.props}|${a.pseudo}|${a.name}`, a));
        const slots = [...document.querySelectorAll(".roll-slot")].map((s) => ({ nw: getComputedStyle(s.querySelector(".roll-new")).transform, old: getComputedStyle(s.querySelector(".roll-old")).transform, nwText: s.querySelector(".roll-new").textContent, oldText: s.querySelector(".roll-old").textContent, w: +s.getBoundingClientRect().width.toFixed(2) }));
        frames.push({ t: Math.round(t), slots });
        if (t < 500) requestAnimationFrame(tick); else res();
      };
      requestAnimationFrame(tick);
    });
    const after = Object.fromEntries(ids.map((i) => [i, document.getElementById(i).innerHTML]));
    return { stepRes, beforeText, afterText: Object.fromEntries(ids.map((i) => [i, document.getElementById(i).textContent])), afterIsPlain: Object.values(after).every((h) => !/roll-/.test(h)), beforeHtml: before, afterHtml: after, liveSay: document.getElementById("live-say").textContent, opacityHits: opacityHits.slice(0, 10), opacityHitCount: opacityHits.length, anims: [...animsSeen.values()], frames: frames.filter((f) => f.slots.length).slice(0, 3).concat(frames.filter((f) => f.slots.length).slice(-1)), rollFrames: frames.filter((f) => f.slots.length).length };
  }, `(${animList.toString()})`);
  // a falling value: crowd down
  const down = await p.evaluate(async () => {
    const before = document.getElementById("now-v").textContent;
    const c = window.__eclipse.motion.crowd(-1);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const slots = [...document.querySelectorAll("#now-v .roll-slot")].map((s) => ({ nwT: getComputedStyle(s.querySelector(".roll-new")).transform, oldT: getComputedStyle(s.querySelector(".roll-old")).transform, nw: s.querySelector(".roll-new").textContent, old: s.querySelector(".roll-old").textContent }));
    const word = document.querySelector("#now-foot .level")?.textContent.trim();
    await new Promise((r) => setTimeout(r, 500));
    return { before, c, slots, wordAtOnce: word, after: document.getElementById("now-v").textContent, liveSay: document.getElementById("live-say").textContent };
  });
  res.roll[lang] = { ...r, down, errors };
  await ctx.close();
}

// 3. Level bars up and down: animations and the level word.
{
  const { ctx, p, errors } = await newPage();
  await p.goto(`${BASE}?lang=ar&tuner=0`); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
  const r = await p.evaluate(async (animListSrc) => {
    const animList = eval(animListSrc);
    const out = [];
    for (const dir of [1, -1, -1, 1]) {
      const wordBefore = document.querySelector("#now-foot .level")?.textContent.trim();
      const c = window.__eclipse.motion.crowd(dir);
      const wordNow = document.querySelector("#now-foot .level")?.textContent.trim();
      const anims = animList().filter((a) => /now-foot|lv-/.test(a.target ?? "") || /lv-/.test(a.target ?? ""));
      let opacityHits = 0;
      const t0 = performance.now();
      await new Promise((res) => { const tick = () => { document.querySelectorAll("#now-foot, #now-foot *").forEach((e) => { if (Number(getComputedStyle(e).opacity) < 0.999) opacityHits++; }); if (performance.now() - t0 < 450) requestAnimationFrame(tick); else res(); }; requestAnimationFrame(tick); });
      out.push({ dir, c, wordBefore, wordNow, anims, opacityHits, plainAfter: !/lv-anim|lv-fill/.test(document.getElementById("now-foot").innerHTML) });
    }
    return out;
  }, `(${animList.toString()})`);
  res.bars = { r, errors };
  await ctx.close();
}

// 4. Delayed: nothing runs at rest; a minute passing moves only what?
{
  const { ctx, p, errors } = await newPage();
  await p.goto(`${BASE}?lang=ar&state=delayed&tuner=0`); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
  const rest = await p.evaluate(animList);
  const r = await p.evaluate(async (animListSrc) => {
    const animList = eval(animListSrc);
    const s = window.__eclipse.motion.step();
    const seen = new Map();
    const t0 = performance.now();
    await new Promise((res) => { const tick = () => { animList().forEach((a) => seen.set(`${a.target}|${a.props}`, a)); if (performance.now() - t0 < 500) requestAnimationFrame(tick); else res(); }; requestAnimationFrame(tick); });
    return { step: s, anims: [...seen.values()], crowd: window.__eclipse.motion.crowd(1), ping: Boolean(document.querySelector(".ping")) };
  }, `(${animList.toString()})`);
  await p.waitForTimeout(3000);
  res.delayed = { restAnims: rest, afterStep: r, restAnimsLater: await p.evaluate(animList), errors };
  await ctx.close();
}

// 5. Header status chip before and after a live update (2x crops).
{
  const { ctx, p, errors } = await newPage(2);
  await p.goto(`${BASE}?lang=ar&tuner=0`); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
  const sel = await p.evaluate(() => { const c = document.querySelector("header .status, .status-chip, #status, header [class*=chip]"); return c ? (c.id ? `#${c.id}` : `.${[...c.classList].join(".")}`) : null; });
  res.chip.selector = sel;
  if (sel) {
    const box = await p.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: Math.floor(r.x) - 4, y: Math.floor(r.y) - 4, width: Math.ceil(r.width) + 8, height: Math.ceil(r.height) + 8 }; }, sel);
    await p.screenshot({ path: `${OUT}/chip-before-2x.png`, clip: box });
    res.chip.htmlBefore = await p.evaluate((s) => document.querySelector(s).outerHTML, sel);
    await p.evaluate(() => window.__eclipse.motion.step()); await p.waitForTimeout(900);
    await p.screenshot({ path: `${OUT}/chip-after-2x.png`, clip: box });
    res.chip.htmlAfter = await p.evaluate((s) => document.querySelector(s).outerHTML, sel);
    await p.evaluate(() => window.__eclipse.motion.reset()); await p.waitForTimeout(900);
    await p.screenshot({ path: `${OUT}/chip-reset-2x.png`, clip: box });
    res.chip.htmlReset = await p.evaluate((s) => document.querySelector(s).outerHTML, sel);
    await p.screenshot({ path: `${OUT}/page-after-reset.png` });
  }
  res.chip.errors = errors;
  await ctx.close();
}
await b.close();
writeFileSync(`${OUT}/motion.json`, JSON.stringify(res, null, 1));
console.log("done");
