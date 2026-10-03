// Eclipse, the pages' states as decided (K-02, DECISIONS item 14: Reports takes the options round's A with C's error;
// K-38, A's 320 title row; the status slot on both pages). Renders Reports' and Daily's states from file:// URLs (or
// over HTTP with --base=<url of this folder>) with Playwright chromium (a fresh context per page, device scale 2,
// reduced motion, a touch phone at 720 px and below), writes numbered frames and crops of the header's status, and
// measures the status's slot and control. It never writes into this repository.
//   node design-research/owner-composition-exploration-r04/directions/eclipse/states-capture.mjs <outDir> [--base=http://localhost:3176/] [--only=frames,crops,status,shift,alert]
// Writes, under <outDir>:
//   frames/<reports|daily>/<NN>-<state>-<width>-<lang>.png     the first screen (1440 x 900, 1024 x 768, 768 x 1024,
//                                                              390 x 844, 320 x 640)
//   frames/<reports|daily>/<NN>-<state>-390-<lang>-page.png    the whole page at 390
//   crops/<page>-<state>-<width>-<lang>-<rest|hover|focus>.png the header's status at 1024 and 768, scale 2
//   states-log.json                                            measurements, lights, overflow, console errors
// Reports: 01 live, 02 loading, 03 closed, 04 delayed, 05 offline (unavailable), 06 pending, 07 error. Daily: 01 live,
// 02 delayed, 03 nohistory, 04 loading, 05 closed, 06 offline (unavailable), 07 error. Exits 1 on a console or page
// error, a sideways scroll, or a status check that fails.
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const OUT_ARG = args.find((a) => !a.startsWith("--"));
if (!OUT_ARG) throw new Error("usage: states-capture.mjs <outDir> [--base=<url>] [--only=frames,crops,status,shift,alert]");
const OUT = resolve(OUT_ARG);
const REPO = resolve(HERE, "../../../..");
if ((OUT + sep).toLowerCase().startsWith(REPO.toLowerCase() + sep)) throw new Error(`${OUT} must be outside the repository worktree`);
const ONLY = (args.find((x) => x.startsWith("--only=")) || "").slice(7);
const part = (k) => !ONLY || ONLY.split(",").includes(k);
const BASE = (args.find((x) => x.startsWith("--base=")) || "").slice(7);

const LANGS = ["ar", "en"];
const SIZES = { 1440: 900, 1024: 768, 768: 1024, 390: 844, 320: 640 };
const WIDE = [1440, 1024, 768];
// [number, name in the file, ?state=]
const PAGES = {
  reports: { file: "reports.html", extra: "", ready: () => window.__reports?.ready === true,
    states: [["01", "live", ""], ["02", "loading", "loading"], ["03", "closed", "closed"], ["04", "delayed", "delayed"], ["05", "offline", "unavailable"], ["06", "pending", "pending"], ["07", "error", "error"]] },
  daily: { file: "index.html", extra: "tuner=0", ready: () => window.__eclipse?.ready === true,
    states: [["01", "live", ""], ["02", "delayed", "delayed"], ["03", "nohistory", "nohistory"], ["04", "loading", "loading"], ["05", "closed", "closed"], ["06", "offline", "unavailable"], ["07", "error", "error"]] },
};
const log = { base: BASE || "file://", frames: {}, status: {}, shift: {}, alert: {}, crops: {}, failures: [] };
const fail = (m) => { log.failures.push(m); console.log("FAIL", m); };
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();

const url = (pg, q) => `${BASE ? new URL(PAGES[pg].file, BASE).href : pathToFileURL(join(HERE, PAGES[pg].file)).href}?${q}`;
const query = (pg, lang, state, extra = "") => [`lang=${lang}`, state ? `state=${state}` : "", PAGES[pg].extra, extra].filter(Boolean).join("&");
async function open(pg, q, width, height, { init } = {}) {
  const phone = width <= 720;
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, isMobile: phone, hasTouch: phone, reducedMotion: "reduce", colorScheme: "dark" });
  if (init) await context.addInitScript(init);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(`console ${m.type()}: ${m.text()}`); });
  await page.goto(url(pg, q));
  await page.waitForFunction(PAGES[pg].ready);
  await page.evaluate(() => document.fonts.ready);
  // Past the skeleton's 300 ms delay (it is held without ?arrive), and the alert's 50 ms write.
  await page.waitForTimeout(450);
  return { context, page, errors };
}
const facts = () => {
  const de = document.documentElement, pat = document.querySelector("#pattern");
  return {
    phase: window.__reports?.phase ?? window.__eclipse?.phase ?? null,
    lit: pat ? pat.classList.contains("lit") && !pat.hidden : null,
    overflowX: de.scrollWidth - de.clientWidth,
    pageHeight: de.scrollHeight,
    focus: document.activeElement ? (document.activeElement.id || document.activeElement.className || document.activeElement.tagName) : null,
  };
};

/* ------------------------------------------------------------------ frames */
if (part("frames")) {
  let n = 0;
  for (const pg of Object.keys(PAGES)) for (const [nn, name, st] of PAGES[pg].states) for (const lang of LANGS) for (const w of Object.keys(SIZES).map(Number)) {
    const dir = join(OUT, "frames", pg), file = `${nn}-${name}-${w}-${lang}`;
    await mkdir(dir, { recursive: true });
    const { context, page, errors } = await open(pg, query(pg, lang, st), w, SIZES[w]);
    await page.screenshot({ path: join(dir, `${file}.png`) });
    if (w === 390) await page.screenshot({ path: join(dir, `${file}-page.png`), fullPage: true });
    const f = await page.evaluate(facts);
    log.frames[`${pg}/${file}`] = f;
    if (f.overflowX > 0) fail(`${pg}/${file}: sideways scroll ${f.overflowX}px`);
    errors.forEach((e) => fail(`${pg}/${file}: ${e}`));
    await context.close();
    n++;
  }
  console.log("frames", n);
}

/* ------------------------------------------------------------------ the status: slot, control, fill, ring, target */
// From 721 px: the slot keeps one box in every state; the control is the drawn box (its fill on hover and while open,
// its ring), as wide as its own status with HDR-3's padding (12 + its 1 px edge), at least 44 px tall, at the slot's
// inline end; a point in the slot outside the control is not the control.
const STATUS = () => {
  const rect = (el) => { if (!el || !el.getClientRects().length) return null; const b = el.getBoundingClientRect(); return { l: +b.left.toFixed(2), r: +b.right.toFixed(2), t: +b.top.toFixed(2), b: +b.bottom.toFixed(2), w: +b.width.toFixed(2), h: +b.height.toFixed(2) }; };
  const slot = document.querySelector("#ops-slot"), btn = document.querySelector("#ops-btn"), load = document.querySelector(".hb-load");
  const rtl = document.dir === "rtl";
  const out = { reserve: document.querySelector("#ops-res").textContent, slot: rect(slot), btn: btn.hidden ? null : rect(btn), load: rect(load), title: rect(document.querySelector(".head h1")), sub: rect(document.querySelector("#sub")), head: rect(document.querySelector(".head")) };
  if (out.btn) {
    // The status's ink: from the mark's start to the chevron's end.
    const st = btn.querySelector(".hb-state"), ch = btn.querySelector(".hb-chev");
    const kids = [...st.children].filter((k) => !k.classList.contains("sr-only") && k.getClientRects().length).map((k) => k.getBoundingClientRect());
    const cr = ch.getClientRects().length ? ch.getBoundingClientRect() : null;
    const inkL = Math.min(...kids.map((k) => k.left), cr ? cr.left : Infinity), inkR = Math.max(...kids.map((k) => k.right), cr ? cr.right : -Infinity);
    out.padStart = +(rtl ? out.btn.r - inkR : inkL - out.btn.l).toFixed(2);
    out.padEnd = +(rtl ? inkL - out.btn.l : out.btn.r - inkR).toFixed(2);
    // A point in the slot past the control's inline start, on its line: what the pointer finds there.
    const x = rtl ? out.btn.r + 6 : out.btn.l - 6, y = (out.btn.t + out.btn.b) / 2;
    const inSlot = rtl ? x < out.slot.r : x > out.slot.l;
    const hitEl = inSlot ? document.elementFromPoint(x, y) : null;
    out.slotBeyondControl = +(out.slot.w - out.btn.w).toFixed(2);
    out.pointerOutsideControlHitsIt = Boolean(hitEl && hitEl.closest("#ops-btn"));
    out.endEdge = rtl ? out.btn.l : out.btn.r;
    out.slotEnd = rtl ? out.slot.l : out.slot.r;
    const cs = getComputedStyle(btn);
    out.outlineOffset = cs.outlineOffset;
  }
  return out;
};
if (part("status")) {
  for (const pg of Object.keys(PAGES)) for (const lang of LANGS) for (const w of WIDE) {
    const per = {};
    for (const [, name, st] of PAGES[pg].states) {
      const { context, page, errors } = await open(pg, query(pg, lang, st), w, SIZES[w]);
      per[name] = await page.evaluate(STATUS);
      errors.forEach((e) => fail(`status ${pg}/${name}/${w}/${lang}: ${e}`));
      await context.close();
    }
    const key = `${pg}-${w}-${lang}`;
    const vals = Object.values(per);
    const spreadOf = (xs, f) => +(Math.max(...xs.map(f)) - Math.min(...xs.map(f))).toFixed(2);
    const spread = (f) => spreadOf(vals, f);
    // The slot's own box is compared among states of one moment (the same unseen copies: on Daily, closed and
    // unavailable are other moments of the day, with another last reading); what stands beside it, in every state.
    const moments = Object.values(Object.groupBy(vals, (v) => v.reserve));
    const s = { slotX: Math.max(...moments.map((g) => spreadOf(g, (v) => v.slot.l))), slotW: Math.max(...moments.map((g) => spreadOf(g, (v) => v.slot.w))), slotEnd: spread((v) => (lang === "ar" ? v.slot.l : v.slot.r)), title: spread((v) => v.title.l) + spread((v) => v.title.w), sub: spread((v) => v.sub.l) + spread((v) => v.sub.w) + spread((v) => v.sub.t), head: spread((v) => v.head.t) + spread((v) => v.head.h) };
    log.status[key] = { spreads: s, moments: moments.length, states: per };
    for (const [k, v] of Object.entries(s)) if (v > 0.01) fail(`status ${key}: ${k} moves ${v}px across the states`);
    for (const [name, v] of Object.entries(per)) {
      if (!v.btn) continue;
      if (v.btn.h < 44) fail(`status ${key}/${name}: the control is ${v.btn.h}px tall`);
      if (Math.abs(v.padStart - 13) > 0.6 || Math.abs(v.padEnd - 13) > 0.6) fail(`status ${key}/${name}: padding ${v.padStart} / ${v.padEnd} (expected 12 + the 1 px edge)`);
      if (Math.abs(v.endEdge - v.slotEnd) > 0.01) fail(`status ${key}/${name}: the control's end is ${v.endEdge}, the slot's ${v.slotEnd}`);
      if (v.pointerOutsideControlHitsIt) fail(`status ${key}/${name}: the slot past the control still opens it`);
    }
  }
  console.log("status done");
}

/* ------------------------------------------------------------------ crops of the status: rest, hover, focus */
if (part("crops")) {
  const dir = join(OUT, "crops");
  await mkdir(dir, { recursive: true });
  const want = { reports: ["live", "closed", "error"], daily: ["live", "closed"] };
  for (const pg of Object.keys(want)) for (const name of want[pg]) for (const lang of LANGS) for (const w of [1024, 768]) {
    const st = PAGES[pg].states.find((x) => x[1] === name)[2];
    for (const mode of ["rest", "hover", "focus"]) {
      const { context, page, errors } = await open(pg, query(pg, lang, st), w, SIZES[w]);
      if (mode === "hover") await page.hover("#ops-btn");
      if (mode === "focus") {
        await page.keyboard.press("Shift");
        await page.evaluate(() => document.querySelector("#ops-btn").focus());
      }
      await page.waitForTimeout(100);
      const box = await page.evaluate(() => {
        // The header has no concept label since DECISIONS item 15: the crop is the slot and the header's own height.
        const s = document.querySelector("#ops-slot").getBoundingClientRect(), h = document.querySelector(".head").getBoundingClientRect();
        const l = s.left - 24, r = s.right + 24;
        return { x: Math.max(0, l), y: Math.max(0, h.top - 12), width: Math.min(innerWidth, r) - Math.max(0, l), height: Math.max(s.bottom, h.bottom) - h.top + 36, fv: document.querySelector("#ops-btn").matches(":focus-visible") };
      });
      if (mode === "focus" && !box.fv) fail(`crops ${pg}/${name}/${w}/${lang}: the control is not :focus-visible`);
      const file = `${pg}-${name}-${w}-${lang}-${mode}.png`;
      await page.screenshot({ path: join(dir, file), clip: { x: box.x, y: box.y, width: box.width, height: box.height } });
      log.crops[file] = await page.evaluate(STATUS);
      errors.forEach((e) => fail(`crops ${file}: ${e}`));
      await context.close();
    }
  }
  console.log("crops done");
}

/* ------------------------------------------------------------------ what moves on arrival and on the retry */
const LS_INIT = () => {
  window.__ls = [];
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__ls.push({ t: e.startTime, v: e.value, input: e.hadRecentInput }))).observe({ type: "layout-shift", buffered: true }); } catch (e) { /* no observer */ }
};
const BOXES = () => {
  const sel = { slot: "#ops-slot", title: ".head h1", sub: "#sub", head: ".head", cards: "#cards", tools: ".rp-tools" };
  const out = {};
  for (const [k, s] of Object.entries(sel)) {
    const el = document.querySelector(s);
    if (!el || el.closest("[hidden]") || !el.getClientRects().length) continue;
    const b = el.getBoundingClientRect();
    out[k] = { x: b.left, y: b.top + scrollY, w: b.width, h: b.height };
  }
  // The status's drawn words: the loading words, else the control.
  const st = document.querySelector(".hb-load") || document.querySelector("#ops-btn");
  const b = st.getBoundingClientRect();
  out.statusEnd = { x: document.dir === "rtl" ? b.left : b.right, y: b.top + scrollY, w: 0, h: b.height };
  return out;
};
const diff = (a, b) => {
  let max = 0;
  const moved = {};
  for (const k of Object.keys(a)) {
    if (!b[k]) continue;
    const d = Math.max(Math.abs(a[k].x - b[k].x), Math.abs(a[k].y - b[k].y), Math.abs(a[k].w - b[k].w), Math.abs(a[k].h - b[k].h));
    if (d > 0.01) moved[k] = +d.toFixed(2);
    max = Math.max(max, d);
  }
  return { max: +max.toFixed(2), moved };
};
if (part("shift")) {
  for (const pg of Object.keys(PAGES)) for (const lang of LANGS) for (const w of Object.keys(SIZES).map(Number)) {
    // Loading: the payload arrives 1.6 s after the page opened (the skeleton shown from 300 ms).
    for (const kind of ["loading", "retry"]) {
      const { context, page, errors } = await open(pg, query(pg, lang, kind === "loading" ? "loading" : "error", kind === "loading" ? "arrive=1600" : ""), w, SIZES[w], { init: LS_INIT });
      const before = await page.evaluate(BOXES);
      const t0 = await page.evaluate(() => performance.now());
      if (kind === "retry") await page.click("#retry");
      await page.waitForFunction(() => (window.__reports ? window.__reports.phase : window.__eclipse.phase) === "ready", null, { timeout: 5000 });
      await page.waitForTimeout(300);
      const after = await page.evaluate(BOXES);
      const cls = await page.evaluate((t) => window.__ls.filter((e) => e.t > t).reduce((s, e) => s + e.v, 0), t0);
      const d = diff(before, after);
      // The status's own place (from 721 px; a phone draws the badge alone, unchanged by this round).
      const statusMoved = w > 720 ? Math.max(d.moved.slot || 0, d.moved.statusEnd || 0, d.moved.title || 0, d.moved.sub || 0, d.moved.head || 0) : null;
      log.shift[`${pg}-${kind}-${w}-${lang}`] = { ...d, cls: +cls.toFixed(4), statusMoved };
      if (statusMoved > 0.01) fail(`shift ${pg}/${kind}/${w}/${lang}: the header's status moved ${statusMoved}px`);
      errors.forEach((e) => fail(`shift ${pg}/${kind}/${w}/${lang}: ${e}`));
      await context.close();
    }
  }
  console.log("shift done");
}

/* ------------------------------------------------------------------ Reports' error: the page's message */
if (part("alert")) {
  for (const lang of LANGS) for (const w of Object.keys(SIZES).map(Number)) for (const q of ["", "from=2025-12-20&to=2026-01-10", "range=7d"]) {
    const { context, page, errors } = await open("reports", query("reports", lang, "error", q), w, SIZES[w]);
    const r = await page.evaluate(() => ({ text: document.querySelector(".rp-msg .stat-say")?.textContent.trim(), sub: document.querySelector("#sub").textContent.trim(), cards: !document.querySelector("#cards").hidden, pattern: !document.querySelector("#pattern").hidden, focus: document.activeElement?.id }));
    log.alert[`${lang}-${w}-${q || "28d"}`] = r;
    if (r.cards || r.pattern) fail(`alert ${lang}/${w}/${q}: the cards or the pattern still show`);
    if (r.focus !== "retry") fail(`alert ${lang}/${w}/${q}: focus is ${r.focus}`);
    errors.forEach((e) => fail(`alert ${lang}/${w}: ${e}`));
    await context.close();
  }
  console.log("alert done");
}

await writeFile(join(OUT, "states-log.json"), JSON.stringify(log, null, 1));
await browser.close();
console.log(log.failures.length ? `${log.failures.length} failure(s)` : "no failures");
process.exit(log.failures.length ? 1 : 0);
