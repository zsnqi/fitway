// Eclipse Reports, the phone options round (step 4): renders phase B's phone (no ?opt) and the three options (?opt=a|b|c)
// from file:// URLs with Playwright chromium (a fresh context per page, reduced motion, a touch phone below 721 px),
// measures them, and composes the review sheets. It never writes into this repository: outDir is required.
//   node design-research/owner-composition-exploration-r04/directions/eclipse/reports-options-capture.mjs <outDir>
// Writes <outDir>/frames/*.png, <outDir>/sheets/*.png and <outDir>/options-log.json; exits 1 on a console error, a page
// error or a document that scrolls sideways.
// A "page" frame is the whole page drawn in one viewport as tall as the document, so the bar sits at the page's end and
// nothing sticky floats mid-page; the measurements are taken at the real phone height first (390 x 844, 320 x 568).
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_ARG = process.argv.slice(2).find((a) => !a.startsWith("--"));
if (!OUT_ARG) throw new Error("reports-options-capture.mjs needs an output folder outside the repository");
const OUT = resolve(OUT_ARG);
if ((OUT + sep).toLowerCase().startsWith(resolve(HERE, "../../../..").toLowerCase() + sep)) throw new Error("the output folder must be outside the repository worktree");
const FR = join(OUT, "frames"), SH = join(OUT, "sheets");
await mkdir(FR, { recursive: true });
await mkdir(SH, { recursive: true });
const PAGE = pathToFileURL(join(HERE, "reports.html")).href;
const browser = await chromium.launch();
const log = { page: PAGE, frames: {}, measures: {}, failures: [] };

const STATES = { "28d": "", "7d": "range=7d", empty: "from=2026-07-01&to=2026-07-31" };
const OPTS = ["a", "b", "c"];
const NAMES = { before: "Phase B (9309382)", a: "A · the week in blocks", b: "B · one day at a time", c: "C · the week as a timetable" };
const STATE_NAMES = { "28d": "Last 28 days (default)", "7d": "Last 7 days, Thursday's camera gap", empty: "empty July (1 – 31 Jul)" };

async function open(opt, lang, state, { width = 390, height = 844, scale = 1 } = {}) {
  const phone = width <= 720;
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, isMobile: phone, hasTouch: phone, reducedMotion: "reduce", colorScheme: "dark" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(`console ${m.type()}: ${m.text()}`); });
  const q = [`lang=${lang}`, STATES[state], opt === "before" ? "" : `opt=${opt}`].filter(Boolean).join("&");
  await page.goto(`${PAGE}?${q}`);
  await page.waitForFunction(() => window.__reports?.ready === true);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  return { context, page, errors, q };
}

/* The measurements: the page's height, the pattern's unit, every target's size, sideways scroll, and every date, time,
 * range and no-readings phrase checked for a line break inside it. */
const MEASURE = () => {
  const de = document.documentElement, vis = (el) => { if (el.closest("[hidden], dialog:not([open]), .sr-only")) return false; const cs = getComputedStyle(el); if (cs.display === "none" || cs.visibility === "hidden" || cs.clipPath === "inset(50%)") return false; const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
  const r1 = (x) => Math.round(x * 10) / 10;
  const box = (el) => { const b = el.getBoundingClientRect(); return [r1(b.width), r1(b.height)]; };
  // Lines a phrase occupies: its text's line boxes, clustered by their vertical centres.
  const lines = (el) => {
    const rg = document.createRange(); rg.selectNodeContents(el);
    const cs = [...rg.getClientRects()].filter((r) => r.width > 0.5).map((r) => (r.top + r.bottom) / 2).sort((a, b) => a - b);
    let n = 0, last = -1e9; for (const c of cs) { if (c - last > 7) { n++; last = c; } } return n;
  };
  const phrases = [...document.querySelectorAll("main .nw, main .gapnote .w, main .gapnote .rg, main .hc .run, main .hb-run .rg, main .hb-run .w, main .wk-n, main .bh-s, main .bh-r, main .hh-t, main .dl-pt, #heat-tip .tip-t span")].filter(vis);
  const broken = phrases.filter((el) => lines(el) > 1).map((el) => `${el.className || el.tagName}: ${el.textContent.trim().slice(0, 40)}`);
  // Targets: everything a finger or a key reaches in the page's content (the frame's bar and header are the frame's).
  const tsel = "main button, main a[href], main select, main [role=radio], main [role=switch], main [role=gridcell][tabindex], main .seg-b";
  const targets = [...document.querySelectorAll(tsel)].filter(vis).map((el) => {
    const b = el.getBoundingClientRect();
    const name = el.id ? "#" + el.id : el.matches("[role=gridcell]") ? "cell" : el.matches(".wk-b") ? "day" : (el.className || el.tagName).toString().split(" ")[0];
    return { name, w: r1(b.width), h: r1(b.height), cell: el.matches("[role=gridcell]") };
  });
  const small = targets.filter((t) => t.w < 43.5 || t.h < 43.5);
  const smallNames = [...new Set(small.map((t) => `${t.name} ${t.w}x${t.h}`))];
  // The pattern's unit, by option.
  const unit = {};
  const hc = [...document.querySelectorAll("#pattern .hc.v")].filter(vis);
  if (hc.length) { const ws = hc.map((x) => x.getBoundingClientRect().width); unit.cell = [r1(Math.min(...ws)), r1(hc[0].getBoundingClientRect().height)]; }
  const plate = document.querySelector("#heat-plate");
  if (plate && vis(plate) && plate.scrollWidth > plate.clientWidth + 1) {
    const day = document.querySelector("#heat .hd");
    const cw = hc.length ? hc[0].getBoundingClientRect().width + 4 : 48;
    unit.window = r1((plate.clientWidth - (day ? day.getBoundingClientRect().width + 8 : 0)) / cw);
  }
  const wk = [...document.querySelectorAll(".wk-b")].filter(vis);
  if (wk.length) unit.dayButton = box(wk[0]);
  const hb = [...document.querySelectorAll(".hb tr")].filter(vis);
  if (hb.length) { unit.hourRow = r1(hb[0].getBoundingClientRect().height); unit.hourRows = hb.length; const bars = [...document.querySelectorAll(".hb-bar")].map((x) => x.getBoundingClientRect().width); unit.longestBar = bars.length ? r1(Math.max(...bars)) : 0; }
  const sec = (s) => { const el = document.querySelector(s); return el && vis(el) ? box(el) : null; };
  // Spill: a table wider than its card, a box whose content passes its edge, or two parts of a list item that overlap.
  const spill = [];
  const t = document.querySelector("#days-table"), wrap = document.querySelector("#days-wrap");
  if (t && wrap && vis(t) && t.getBoundingClientRect().width > wrap.clientWidth + 0.5) spill.push(`day table ${r1(t.getBoundingClientRect().width)} > ${wrap.clientWidth}`);
  for (const el of document.querySelectorAll("main .dl-more, main .dl-pt, main .dl-day, main .dl-pk, main .hb-run, main .hb-c, main .opt-sortrow, main .wk-strip, main .mv, main .pattern-head, main .days-head, main .seg, main .table-empty")) {
    if (vis(el) && el.scrollWidth > el.clientWidth + 1) spill.push(`${el.className} by ${el.scrollWidth - el.clientWidth}`);
  }
  const hit = (a, b) => { const x = a.getBoundingClientRect(), y = b.getBoundingClientRect(); return x.left < y.right - 0.5 && y.left < x.right - 0.5 && x.top < y.bottom - 0.5 && y.top < x.bottom - 0.5; };
  for (const li of document.querySelectorAll("main .dli")) {
    const q = (s) => li.querySelector(s);
    if (q(".dl-more") && q(".dl-pt") && hit(q(".dl-more"), q(".dl-pt"))) spill.push(`overlap in a day: ${li.querySelector(".dl-day")?.textContent}`);
    if (q(".dl-day") && q(".dl-pk") && hit(q(".dl-day"), q(".dl-pk"))) spill.push(`overlap in a day: ${li.querySelector(".dl-day")?.textContent}`);
  }
  // Anything inside a card that passes the card's own edge (clipped, so it never shows as page scroll).
  for (const card of document.querySelectorAll("#pattern, #days")) {
    const cb = card.getBoundingClientRect();
    for (const el of card.querySelectorAll(".flag, .pv, .pt, .mbar, .dl-pv, .hb-v, .wk-b, .rbtn, .sort")) {
      if (!vis(el) || el.closest(".heat-plate")) continue;
      const b = el.getBoundingClientRect();
      if (b.left < cb.left - 0.5 || b.right > cb.right + 0.5) spill.push(`${el.className} outside its card`);
    }
  }
  return {
    pageH: de.scrollHeight, scrollW: de.scrollWidth, innerW: innerWidth, sideways: de.scrollWidth > innerWidth,
    pattern: sec("#pattern"), days: sec("#days"), unit,
    patternBottom: Math.round(document.querySelector("#pattern").getBoundingClientRect().bottom + scrollY), fold: innerHeight,
    phrases: phrases.length, broken, spill: [...new Set(spill)].slice(0, 12),
    targets: targets.length, gridcells: targets.filter((t) => t.cell).length, small: smallNames,
  };
};

async function measure(opt, lang, state, width) {
  const height = width === 320 ? 568 : width === 768 ? 1024 : 844;
  const o = await open(opt, lang, state, { width, height });
  const m = await o.page.evaluate(MEASURE);
  m.errors = o.errors;
  log.measures[`${opt}-${width}-${lang}-${state}`] = m;
  if (o.errors.length) log.failures.push(`${opt}-${width}-${lang}-${state}: ${o.errors.join(" | ")}`);
  if (m.sideways) log.failures.push(`${opt}-${width}-${lang}-${state}: the page scrolls sideways (${m.scrollW} > ${m.innerW})`);
  // A touch phone widens its layout viewport to fit content that overflows, which would hide a sideways scroll.
  if (m.innerW !== width) log.failures.push(`${opt}-${width}-${lang}-${state}: the layout viewport widened to ${m.innerW}`);
  // Phase B's own spill and breaks are the before, recorded as found; an option's fail the run.
  if (opt !== "before" && (m.spill.length || m.broken.length)) log.failures.push(`${opt}-${width}-${lang}-${state}: ${[...m.spill, ...m.broken.map((b) => "broken " + b)].join("; ")}`);
  await o.context.close();
  return m;
}

// The whole page in one viewport as tall as the document.
async function pageFrame(name, opt, lang, state, { width = 390, height = 844 } = {}) {
  const o = await open(opt, lang, state, { width, height });
  const H = await o.page.evaluate(() => document.documentElement.scrollHeight);
  await o.page.setViewportSize({ width, height: H });
  await o.page.waitForTimeout(200);
  const path = join(FR, name + ".png");
  await o.page.screenshot({ path });
  log.frames[name] = { q: o.q, width, cssH: H, errors: o.errors };
  await o.context.close();
  return path;
}
// An element at 2x, after an action (a readout opened, another day chosen, the hours moved).
async function detail(name, opt, lang, state, el, act, { width = 390 } = {}) {
  const o = await open(opt, lang, state, { width, height: 844, scale: 2 });
  if (act) await act(o.page);
  await o.page.waitForTimeout(200);
  // Drawn in a viewport as tall as the document, so the bar and the table's sticky head stay where they belong.
  const H = await o.page.evaluate(() => document.documentElement.scrollHeight);
  await o.page.setViewportSize({ width, height: H });
  await o.page.waitForTimeout(200);
  const path = join(FR, name + ".png");
  await o.page.locator(el).screenshot({ path });
  log.frames[name] = { q: o.q, width, el, errors: o.errors };
  await o.context.close();
  return path;
}
// The pattern and the day table as one continuous crop (2x): from the pattern's top to the table's end, or to `upto`
// CSS px into the table.
async function cards(name, opt, lang, state, { width = 390, upto = null } = {}) {
  const o = await open(opt, lang, state, { width, height: 844, scale: 2 });
  const H = await o.page.evaluate(() => document.documentElement.scrollHeight);
  await o.page.setViewportSize({ width, height: H });
  await o.page.waitForTimeout(200);
  const clip = await o.page.evaluate((u) => {
    const p = document.querySelector("#pattern").getBoundingClientRect(), d = document.querySelector("#days").getBoundingClientRect();
    const bottom = u ? Math.min(d.bottom, d.top + u) : d.bottom;
    return { x: 0, y: Math.floor(p.top - 12), width: document.documentElement.clientWidth, height: Math.ceil(bottom - p.top + 24) };
  }, upto);
  const path = join(FR, name + ".png");
  await o.page.screenshot({ path, clip });
  log.frames[name] = { q: o.q, width, clip, errors: o.errors };
  await o.context.close();
  return path;
}

/* ---- sheets: tall frames cut into slices side by side, drawn at a scale, each tile labelled. */
async function sheet(name, title, rows, { scale = 0.5, sliceH = 1700 } = {}) {
  const p = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  let html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:24px;background:#161516;color:#e9e6e5;font:13px/1.45 system-ui,sans-serif}
  h1{margin:0 0 4px;font-size:18px;font-weight:600}.note{margin:0 0 18px;color:#a9a3a5;max-width:1100px}
  .row{display:flex;gap:36px;align-items:flex-start;margin-block:0 30px}.row>h2{writing-mode:vertical-rl;transform:rotate(180deg);margin:0;font-size:14px;font-weight:600;color:#f2efee}
  figure{margin:0}figcaption{margin-bottom:6px;color:#a9a3a5;max-width:240px}figcaption b{color:#f2efee;font-weight:600}
  .sl{display:flex;gap:6px;align-items:flex-start}.s{background-repeat:no-repeat;border:1px solid #2e2b2c;border-radius:4px}</style>
  <h1>${esc(title)}</h1>`;
  for (const row of rows) {
    if (row.note) { html += `<p class="note">${row.note}</p>`; continue; }
    html += `<div class="row">${row.title ? `<h2>${esc(row.title)}</h2>` : ""}`;
    for (const t of row.tiles) {
      const png = await readFile(t.src);
      const d = [png.readUInt32BE(16), png.readUInt32BE(20)];
      const dpr = t.dpr || 1, w = d[0] / dpr, h = d[1] / dpr, s = t.scale || scale, sh = t.sliceH || sliceH;
      let sl = "";
      for (let k = 0; k * sh < h; k++) {
        const hh = Math.min(sh, h - k * sh);
        sl += `<div class="s" style="width:${w * s}px;height:${hh * s}px;background-image:url('${pathToFileURL(t.src).href}');background-size:${w * s}px ${h * s}px;background-position:0 ${-k * sh * s}px"></div>`;
      }
      html += `<figure><figcaption>${t.label}</figcaption><div class="sl">${sl}</div></figure>`;
    }
    html += `</div>`;
  }
  const file = join(SH, name + ".html");
  await writeFile(file, html);
  await p.goto(pathToFileURL(file).href);
  await p.waitForTimeout(500);
  await p.screenshot({ path: join(SH, name + ".png"), fullPage: true });
  await p.close();
}

try {
  /* ---- measurements: phase B and every option, 390 and 320, AR and EN, in the three states; 768 for the tablet. */
  for (const opt of ["before", ...OPTS]) {
    for (const width of [390, 320]) for (const lang of ["ar", "en"]) for (const state of Object.keys(STATES)) await measure(opt, lang, state, width);
    await measure(opt, "ar", "28d", 768);
  }
  /* ---- frames */
  const F = {};
  for (const opt of ["before", ...OPTS]) {
    for (const lang of ["ar", "en"]) for (const state of Object.keys(STATES)) {
      if (opt === "before" && (lang === "en" || state === "7d")) continue;
      F[`${opt}-390-${lang}-${state}`] = await pageFrame(`${opt}-390-${lang}-${state}`, opt, lang, state);
    }
    F[`${opt}-768-ar-28d`] = await pageFrame(`${opt}-768-ar-28d`, opt, "ar", "28d", { width: 768, height: 1024 });
  }
  // The step each option keeps one tap away.
  F["a-detail"] = await detail("a-390-ar-28d-readout-2x", "a", "ar", "28d", "#pattern", (p) => p.evaluate(() => window.__reports.showCell(4, 12)));
  F["a-detail-7d"] = await detail("a-390-ar-7d-readout-2x", "a", "ar", "7d", "#pattern", (p) => p.evaluate(() => window.__reports.showCell(4, 6)));
  F["b-detail"] = await detail("b-390-ar-28d-friday-2x", "b", "ar", "28d", "#pattern", (p) => p.click('#opt-b [data-wd="5"]'));
  F["b-detail-list"] = await detail("b-390-ar-28d-all-days-2x", "b", "ar", "28d", "#days", async (p) => { await p.click("#opt-more"); });
  F["c-detail"] = await detail("c-390-ar-28d-morning-2x", "c", "ar", "28d", "#pattern", (p) => p.evaluate(() => { const pl = document.querySelector("#heat-plate"); pl.scrollLeft = 0; }));
  F["c-detail-7d"] = await detail("c-390-ar-7d-gap-2x", "c", "ar", "7d", "#pattern", (p) => p.evaluate(() => window.__reports.showCell(4, 5)));
  F["c-detail-table"] = await detail("c-390-ar-28d-average-2x", "c", "ar", "28d", "#days", (p) => p.click('#opt-measure [data-measure="avg"]'));

  /* ---- sheets */
  const H = (k) => log.measures[k]?.pageH;
  const lab = (opt, w, lang, state, extra = "") => `<b>${NAMES[opt]}</b><br>${w} · ${lang.toUpperCase()} · ${STATE_NAMES[state]}${extra}`;
  // The comparison: the pattern and the day table (its first 640 px in the default period, all of it when empty), then
  // each whole page drawn to one scale, so the lengths compare at a glance.
  const ALL = ["before", ...OPTS];
  for (const o of ALL) {
    F[`${o}-cards-28d`] = await cards(`${o}-390-ar-28d-pattern-and-table-2x`, o, "ar", "28d", { upto: 640 });
    F[`${o}-cards-empty`] = await cards(`${o}-390-ar-empty-pattern-and-table-2x`, o, "ar", "empty");
  }
  const pat = (k) => log.measures[k]?.pattern?.[1];
  await sheet("00-comparison-390-ar", "Reports on the phone: phase B, then three options · 390 × 844 · Arabic", [
    { note: "Columns: phase B (the before), then options A, B and C. Rows: the busy-times card and the day table in the default period (the table's first 640 px); the same in an empty July; each whole page in the default period, all drawn to one scale (the bar at the page's end)." },
    { title: "Last 28 days", tiles: ALL.map((o) => ({ src: F[`${o}-cards-28d`], dpr: 2, scale: 0.62, sliceH: 9999, label: lab(o, 390, "ar", "28d", `<br>busy times ${pat(`${o}-390-ar-28d`)} px tall`) })) },
    { title: "Empty July", tiles: ALL.map((o) => ({ src: F[`${o}-cards-empty`], dpr: 2, scale: 0.62, sliceH: 9999, label: lab(o, 390, "ar", "empty", `<br>busy times ${pat(`${o}-390-ar-empty`)} px tall`) })) },
    { title: "Whole page", tiles: ALL.map((o) => ({ src: F[`${o}-390-ar-28d`], scale: 0.16, sliceH: 99999, label: `<b>${NAMES[o]}</b><br>${H(`${o}-390-ar-28d`)} px` })) },
  ]);
  for (const o of OPTS) {
    const det = o === "a" ? [["a-detail", "the readout on a tap: Thursday 6 – 9 PM, its three hours"], ["a-detail-7d", "7 days: Thursday 12 – 3 PM, the camera gap inside the block"]]
      : o === "b" ? [["b-detail", "Friday chosen: closed until 2 PM, in one row"], ["b-detail-list", "the list with all 28 days shown"]]
      : [["c-detail", "the hours moved to the morning"], ["c-detail-7d", "7 days: moved to Thursday's camera gap, its readout"], ["c-detail-table", "the table showing the average"]];
    await sheet(`opt-${o}`, `${NAMES[o]}: 390 AR and EN in three states, the tablet, and the step kept one tap away`, [
      { title: "390 AR", tiles: Object.keys(STATES).map((s) => ({ src: F[`${o}-390-ar-${s}`], label: lab(o, 390, "ar", s, ` · ${H(`${o}-390-ar-${s}`)} px`) })) },
      { title: "390 EN", tiles: Object.keys(STATES).map((s) => ({ src: F[`${o}-390-en-${s}`], label: lab(o, 390, "en", s, ` · ${H(`${o}-390-en-${s}`)} px`) })) },
      { title: "768 AR", tiles: [{ src: F[`${o}-768-ar-28d`], label: lab(o, 768, "ar", "28d"), scale: 0.36, sliceH: 2400 }, ...det.map(([k, l]) => ({ src: F[k], label: `<b>${NAMES[o]}</b><br>390 · AR · 2x · ${l}`, dpr: 2, scale: 0.6, sliceH: 3000 }))] },
    ], { scale: 0.42, sliceH: 1600 });
  }
} finally {
  await writeFile(join(OUT, "options-log.json"), JSON.stringify(log, null, 1));
  await browser.close();
}
if (log.failures.length) { console.error(log.failures.join("\n")); process.exit(1); }
console.log("ok", Object.keys(log.frames).length, "frames,", Object.keys(log.measures).length, "measured pages");
