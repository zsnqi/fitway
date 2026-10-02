// Eclipse, step 4's states round (K-02 for Reports, K-38): renders Reports' page states in the three options from
// file:// URLs (or over HTTP with --base=<url of this folder>) with Playwright chromium (a fresh context per page, device
// scale 2, reduced motion, a touch phone at 720 px and below), writes numbered frames, checks the phone's title row at
// 320 px, measures what moves when the payload arrives (loading) and when the retry arrives (error), and follows the
// error's alert and retry from the state's first painted frame. It never writes into this repository.
//   node design-research/owner-composition-exploration-r04/directions/eclipse/states-capture.mjs <outDir> [--base=http://localhost:3176/] [--only=frames,k38,shift,alert,sheets]
// Writes, under <outDir>:
//   frames/<option>/<NN>-<state>-<width>-<lang>.png        the first screen (1440 x 900, 1024 x 768, 768 x 1024,
//                                                          390 x 844, 320 x 640)
//   frames/<option>/<NN>-<state>-390-<lang>-page.png       the whole page at 390
//   frames/live/00-live-<width>-<lang>.png                 the live page without an option, for reference
//   k38/<option>/<NN>-<state>-320-<lang>.png               the header at 320 x 640 (and k38/live/ for the page now)
//   sheets/<NN>-<state>-<lang>.png                         the three options side by side, every width, scaled
//   states-log.json                                        measurements, lights, overflow, console errors
// The same NN names a state in every option, so a frame compares with its namesake: 01 live, 02 loading, 03 closed,
// 04 delayed, 05 offline (unavailable), 06 pending, 07 error. Exits 1 on a console or page error or a sideways scroll.
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const OUT_ARG = args.find((a) => !a.startsWith("--"));
if (!OUT_ARG) throw new Error("usage: states-capture.mjs <outDir> [--base=<url>] [--only=frames,k38,shift,alert,sheets]");
const OUT = resolve(OUT_ARG);
const REPO = resolve(HERE, "../../../..");
if ((OUT + sep).toLowerCase().startsWith(REPO.toLowerCase() + sep)) throw new Error(`${OUT} must be outside the repository worktree`);
const ONLY = (args.find((x) => x.startsWith("--only=")) || "").slice(7);
const part = (k) => !ONLY || ONLY.split(",").includes(k);
const BASE = (args.find((x) => x.startsWith("--base=")) || "").slice(7);

const OPTS = ["a", "b", "c"];
const LANGS = ["ar", "en"];
const SIZES = { 1440: 900, 1024: 768, 768: 1024, 390: 844, 320: 640 };
// [number, name in the file, ?state=]
const STATES = [["01", "live", ""], ["02", "loading", "loading"], ["03", "closed", "closed"], ["04", "delayed", "delayed"], ["05", "offline", "unavailable"], ["06", "pending", "pending"], ["07", "error", "error"]];
const log = { base: BASE || "file://", frames: {}, k38: {}, shift: {}, alert: {}, failures: [] };
const fail = (m) => { log.failures.push(m); console.log("FAIL", m); };
const browser = await chromium.launch();

const url = (q) => `${BASE ? new URL("reports.html", BASE).href : pathToFileURL(join(HERE, "reports.html")).href}?${q}`;
const query = (lang, opt, state, extra = "") => [`lang=${lang}`, opt ? `option=${opt}` : "", state ? `state=${state}` : "", extra].filter(Boolean).join("&");
async function open(q, width, height, { init } = {}) {
  const phone = width <= 720;
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, isMobile: phone, hasTouch: phone, reducedMotion: "reduce", colorScheme: "dark" });
  if (init) await context.addInitScript(init);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(`console ${m.type()}: ${m.text()}`); });
  await page.goto(url(q));
  await page.waitForFunction(() => window.__reports?.ready === true);
  await page.evaluate(() => document.fonts.ready);
  // Past the skeleton's 300 ms delay (it is held without ?arrive), and the alert's 50 ms write.
  await page.waitForTimeout(450);
  return { context, page, errors };
}
const facts = () => {
  const de = document.documentElement, pat = document.querySelector("#pattern");
  return {
    phase: window.__reports.phase, shown: window.__reports.shown,
    lit: pat.classList.contains("lit") && !pat.hidden,
    overflowX: de.scrollWidth - de.clientWidth,
    pageHeight: de.scrollHeight,
    focus: document.activeElement ? (document.activeElement.id || document.activeElement.className || document.activeElement.tagName) : null,
    busy: [...document.querySelectorAll("[aria-busy='true']")].map((e) => e.id),
  };
};

/* ------------------------------------------------------------------ frames */
if (part("frames")) {
  const jobs = [];
  for (const lang of LANGS) for (const w of Object.keys(SIZES).map(Number)) jobs.push({ dir: "live", file: `00-live-${w}-${lang}`, q: query(lang), w });
  for (const opt of OPTS) for (const [nn, name, st] of STATES) for (const lang of LANGS) for (const w of Object.keys(SIZES).map(Number)) {
    jobs.push({ dir: opt, file: `${nn}-${name}-${w}-${lang}`, q: query(lang, opt, st), w, full: w === 390 });
  }
  for (const j of jobs) {
    const dir = join(OUT, "frames", j.dir);
    await mkdir(dir, { recursive: true });
    const { context, page, errors } = await open(j.q, j.w, SIZES[j.w]);
    await page.screenshot({ path: join(dir, `${j.file}.png`) });
    if (j.full) await page.screenshot({ path: join(dir, `${j.file}-page.png`), fullPage: true });
    const f = await page.evaluate(facts);
    log.frames[`${j.dir}/${j.file}`] = f;
    if (f.overflowX > 0) fail(`${j.dir}/${j.file}: sideways scroll ${f.overflowX}px`);
    errors.forEach((e) => fail(`${j.dir}/${j.file}: ${e}`));
    await context.close();
  }
  console.log("frames", jobs.length);
}

/* ------------------------------------------------------------------ K-38: the title row at 320 px */
const K38 = () => {
  // Page coordinates: a state that moves focus may scroll the page, which is not the title moving.
  const r = (el) => { if (!el || el.hidden || !el.getClientRects().length) return null; const b = el.getBoundingClientRect(); return { l: +b.left.toFixed(2), r: +b.right.toFixed(2), t: +(b.top + scrollY).toFixed(2), b: +(b.bottom + scrollY).toFixed(2), w: +b.width.toFixed(2), vt: +b.top.toFixed(2) }; };
  const h1 = document.querySelector(".head h1");
  // The title's ink: a range over its text, so a box narrower than the word shows as overflow.
  const rg = document.createRange(); rg.selectNodeContents(h1);
  const ink = rg.getBoundingClientRect();
  const status = document.querySelector("#ops-btn:not([hidden])") || document.querySelector(".hb-load");
  const box = r(h1), st = r(status), menu = r(document.querySelector("#menu-btn"));
  const rtl = document.dir === "rtl";
  // The room between the title's ink and the status (or the menu, where the status has its own row).
  const near = st && Math.abs(st.t - box.t) < 30 ? st : menu;
  const gap = rtl ? ink.left - near.r : near.l - ink.right;
  // The actions' own box against what it holds: a status wider than its room spills out of it.
  const acts = document.querySelector(".head-acts");
  let actsSpill = 0;
  if (getComputedStyle(acts).display !== "contents") {
    const a = acts.getBoundingClientRect();
    const kids = [...acts.children].filter((k) => !k.hidden && getComputedStyle(k).position !== "absolute" && k.getClientRects().length).map((k) => k.getBoundingClientRect());
    actsSpill = Math.max(0, ...kids.map((k) => Math.max(a.left - k.left, k.right - a.right)));
  }
  return {
    scrolled: scrollY, actsSpill: +actsSpill.toFixed(2), title: box, titleInk: { l: +ink.left.toFixed(2), r: +ink.right.toFixed(2), w: +ink.width.toFixed(2) }, inkPastBox: +Math.max(0, box.l - ink.left, ink.right - box.r).toFixed(2), status: st, menu, gapToNeighbour: +gap.toFixed(2), header: r(document.querySelector(".head")), overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth };
};
if (part("k38")) {
  for (const opt of [null, ...OPTS]) for (const lang of LANGS) {
    const per = {};
    for (const [nn, name, st] of opt ? STATES : [STATES[0]]) {
      const dir = join(OUT, "k38", opt || "live");
      await mkdir(dir, { recursive: true });
      const { context, page, errors } = await open(query(lang, opt, st), 320, 640);
      await page.screenshot({ path: join(dir, `${nn}-${name}-320-${lang}.png`), clip: { x: 0, y: 0, width: 320, height: 190 } });
      per[name] = await page.evaluate(K38);
      if (per[name].overflowX > 0) fail(`k38 ${opt}/${name}/${lang}: sideways scroll`);
      // The page as it is now (no option) is the baseline K-38 describes: recorded, not failed.
      const flag = opt ? fail : (m) => (log.baseline ||= []).push(m);
      if (per[name].inkPastBox > 0.5) flag(`k38 ${opt || "live"}/${name}/${lang}: the title's ink runs ${per[name].inkPastBox}px past its box`);
      if (per[name].gapToNeighbour < 8) flag(`k38 ${opt || "live"}/${name}/${lang}: ${per[name].gapToNeighbour}px between the title and its neighbour`);
      if (opt && per[name].actsSpill > 0.5) fail(`k38 ${opt}/${name}/${lang}: the status spills ${per[name].actsSpill}px out of its room`);
      if (per[name].scrolled > 0) fail(`k38 ${opt || "live"}/${name}/${lang}: the page opened scrolled ${per[name].scrolled}px (focus off the first screen)`);
      errors.forEach((e) => fail(`k38 ${opt}/${name}/${lang}: ${e}`));
      await context.close();
    }
    const titles = Object.values(per).map((x) => x.title);
    const moved = Math.max(...titles.map((t) => Math.abs(t.l - titles[0].l)), ...titles.map((t) => Math.abs(t.r - titles[0].r)), ...titles.map((t) => Math.abs(t.t - titles[0].t)));
    log.k38[`${opt || "live"}-${lang}`] = { titleMovesAcrossStates: +moved.toFixed(2), states: per };
    if (opt && moved > 0.01) fail(`k38 ${opt}/${lang}: the title moves ${moved.toFixed(2)}px across the states`);
  }
  console.log("k38 done");
}

/* ------------------------------------------------------------------ what moves on arrival */
const LS_INIT = () => {
  window.__ls = [];
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__ls.push({ t: e.startTime, v: e.value, input: e.hadRecentInput }))).observe({ type: "layout-shift", buffered: true }); } catch (e) { /* no observer */ }
};
const BOXES = () => {
  // The header's status: the loading words while they stand in for the control, else the control.
  const sel = { status: ".hb-load", title: ".head h1", sub: "#sub", tools: ".rp-tools", period: "#card-period", trend: "#card-trend", pattern: "#pattern", patternHead: ".pattern-head", plate: "#heat-plate", day: "#pday", days: "#days", daysHead: ".days-head" };
  const out = {};
  for (const [k, s] of Object.entries(sel)) {
    const el = k === "status" ? document.querySelector(".hb-load") || document.querySelector("#ops-btn") : document.querySelector(s);
    if (!el || el.closest("[hidden]") || !el.getClientRects().length) continue;
    const b = el.getBoundingClientRect();
    out[k] = { x: b.left, y: b.top + scrollY, w: b.width, h: b.height, inView: b.top < innerHeight };
  }
  return out;
};
const diff = (a, b) => {
  let max = 0, inView = 0;
  const moved = {};
  for (const k of Object.keys(a)) {
    if (!b[k]) continue;
    const d = Math.max(Math.abs(a[k].x - b[k].x), Math.abs(a[k].y - b[k].y), Math.abs(a[k].w - b[k].w), Math.abs(a[k].h - b[k].h));
    if (d > 0.01) moved[k] = +d.toFixed(2);
    max = Math.max(max, d);
    if (a[k].inView) inView = Math.max(inView, d);
  }
  return { max: +max.toFixed(2), maxInFirstScreen: +inView.toFixed(2), moved, appeared: Object.keys(b).filter((k) => !a[k]), left: Object.keys(a).filter((k) => !b[k]) };
};
if (part("shift")) {
  for (const opt of OPTS) for (const lang of LANGS) for (const w of Object.keys(SIZES).map(Number)) {
    // Loading: the payload arrives 1.6 s after the page opened (the skeleton shown from 300 ms).
    {
      const { context, page, errors } = await open(query(lang, opt, "loading", "arrive=1600"), w, SIZES[w], { init: LS_INIT });
      const before = await page.evaluate(BOXES);
      const t0 = await page.evaluate(() => performance.now());
      await page.waitForFunction(() => window.__reports.phase === "ready", null, { timeout: 5000 });
      await page.waitForTimeout(300);
      const after = await page.evaluate(BOXES);
      const cls = await page.evaluate((t) => window.__ls.filter((e) => e.t > t).reduce((s, e) => s + e.v, 0), t0);
      log.shift[`${opt}-loading-${w}-${lang}`] = { ...diff(before, after), cls: +cls.toFixed(4) };
      errors.forEach((e) => fail(`shift ${opt}/loading/${w}/${lang}: ${e}`));
      await context.close();
    }
    // Error: the one retry, which arrives into live 1.2 s after it is pressed.
    {
      const { context, page, errors } = await open(query(lang, opt, "error"), w, SIZES[w], { init: LS_INIT });
      const before = await page.evaluate(BOXES);
      const t0 = await page.evaluate(() => performance.now());
      await page.click("#retry");
      await page.waitForFunction(() => window.__reports.phase === "ready", null, { timeout: 5000 });
      await page.waitForTimeout(300);
      const after = await page.evaluate(BOXES);
      const cls = await page.evaluate((t) => window.__ls.filter((e) => e.t > t).reduce((s, e) => s + e.v, 0), t0);
      log.shift[`${opt}-retry-${w}-${lang}`] = { ...diff(before, after), cls: +cls.toFixed(4) };
      errors.forEach((e) => fail(`shift ${opt}/retry/${w}/${lang}: ${e}`));
      await context.close();
    }
  }
  console.log("shift done");
}

/* ------------------------------------------------------------------ the error's alert, from its first painted frame */
// Every frame from the first records the alert's sentence and the retry: the first must already hold the sentence, and
// nothing may move after it. The retry then runs (Enter, as focus is on it) and must keep its box; the alert region is
// written once, and the retry's name follows its label.
const ALERT_INIT = () => {
  window.__fr = [];
  const box = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((x) => +x.toFixed(2)); };
  const tick = () => {
    const b = document.querySelector("#retry"), s = document.querySelector(".rp-alert .stat-say, .rp-msg .stat-say");
    if (b) window.__fr.push({ t: Math.round(performance.now()), retry: box(b), say: box(s), text: (s?.textContent || "").trim().length });
    if (performance.now() < 3000) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
if (part("alert")) {
  for (const opt of OPTS) for (const lang of LANGS) for (const w of Object.keys(SIZES).map(Number)) {
    const { context, page, errors } = await open(query(lang, opt, "error"), w, SIZES[w], { init: ALERT_INIT });
    const fr = await page.evaluate(() => window.__fr);
    const last = fr[fr.length - 1], same = (x, y) => JSON.stringify(x) === JSON.stringify(y);
    const moved = fr.filter((f) => !same(f.retry, last.retry) || !same(f.say, last.say)).length;
    const name0 = (await page.locator("#retry").ariaSnapshot()).trim();
    const alert = await page.evaluate(() => [...document.querySelectorAll(".rp-alert [role=alert], .rp-msg [role=alert]")].map((e) => e.textContent));
    const focus = await page.evaluate(() => document.activeElement?.id || null);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(150);
    const during = await page.evaluate(() => { const r = document.querySelector("#retry").getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((x) => +x.toFixed(2)); });
    const name1 = (await page.locator("#retry").ariaSnapshot()).trim();
    const k = `${opt}-${lang}-${w}`;
    log.alert[k] = { frames: fr.length, firstFrameText: fr[0].text, framesThatDiffer: moved, retry: last.retry, retrying: during, focus, alert, name: [name0, name1] };
    if (!fr[0].text) fail(`alert ${k}: the first frame has no sentence`);
    if (moved) fail(`alert ${k}: the sentence or the retry moved after the first frame`);
    if (!same(during, last.retry)) fail(`alert ${k}: the retry changed its box while it runs ${JSON.stringify(last.retry)} -> ${JSON.stringify(during)}`);
    if (focus !== "retry") fail(`alert ${k}: focus is ${focus}, not the retry`);
    if (alert.length !== 1 || !alert[0]) fail(`alert ${k}: alert regions ${JSON.stringify(alert)}`);
    errors.forEach((e) => fail(`alert ${k}: ${e}`));
    await context.close();
  }
  console.log("alert done");
}

/* ------------------------------------------------------------------ comparison sheets */
if (part("sheets")) {
  const dir = join(OUT, "sheets");
  await mkdir(dir, { recursive: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await context.newPage();
  for (const [nn, name] of STATES) for (const lang of LANGS) {
    const img = (opt, w) => pathToFileURL(join(OUT, "frames", opt, `${nn}-${name}-${w}-${lang}.png`)).href;
    const col = (opt) => `<div class="col"><h2>${opt.toUpperCase()}</h2><img class="w1440" src="${img(opt, 1440)}"><div class="row"><img class="w768" src="${img(opt, 768)}"><img class="w390" src="${img(opt, 390)}"></div></div>`;
    const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:16px;background:#222;color:#eee;font:14px system-ui}h1{margin:0 0 12px;font-size:18px}.cols{display:flex;gap:16px}.col{width:512px}h2{margin:0 0 8px;font-size:16px}img{display:block}.w1440{width:512px}.row{display:flex;gap:8px;margin-top:8px;align-items:flex-start}.w768{width:300px}.w390{width:204px}</style>
      <h1>${nn} ${name} · ${lang}</h1><div class="cols">${OPTS.map(col).join("")}</div>`;
    const sheet = join(dir, "_sheet.html");
    await writeFile(sheet, html);
    await page.goto(pathToFileURL(sheet).href, { waitUntil: "load" });
    await page.screenshot({ path: join(dir, `${nn}-${name}-${lang}.png`), fullPage: true });
  }
  await context.close();
  console.log("sheets done");
}

await writeFile(join(OUT, "states-log.json"), JSON.stringify(log, null, 1));
await browser.close();
console.log(log.failures.length ? `${log.failures.length} failure(s)` : "no failures");
process.exit(log.failures.length ? 1 : 0);
