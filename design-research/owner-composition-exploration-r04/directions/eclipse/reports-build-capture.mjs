// Eclipse Reports, step 4's build (the user's pick of 2026-10-01, option B): renders the page from file:// URLs with
// Playwright chromium (a fresh context per page, reduced motion, a touch phone at 720 px and below), measures it, checks
// it against the earlier commits, and composes the review sheets. It never writes into this repository.
//   node design-research/owner-composition-exploration-r04/directions/eclipse/reports-build-capture.mjs <outDir>
//        --phaseb=<a copy of this folder at 9309382> --before=<a copy of this folder at aa509b9>
// (`git archive <sha> <this folder> | tar -x` makes each copy.) Writes <outDir>/frames/*.png, <outDir>/sheets/*.png and
// <outDir>/build-log.json; exits 1 on a console error, a page error, a sideways scroll, a target under 44 px, a broken
// date, time, range or no-readings phrase, a moved status box, a missing focus ring, a Daily frame that is not
// byte-identical to aa509b9, or a 1440 Reports frame that differs from aa509b9 outside "Last 7 days".
// A "page" frame is the whole page drawn in one viewport as tall as the document, so the bar sits at the page's end and
// nothing sticky floats mid-page; every measurement is taken at the real viewport first.
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const OUT_ARG = args.find((a) => !a.startsWith("--"));
const opt = (k) => { const a = args.find((x) => x.startsWith(`--${k}=`)); return a ? resolve(a.slice(k.length + 3)) : null; };
const PHASEB = opt("phaseb"), BEFORE = opt("before");
if (!OUT_ARG || !PHASEB || !BEFORE) throw new Error("usage: reports-build-capture.mjs <outDir> --phaseb=<9309382 copy> --before=<aa509b9 copy>");
const OUT = resolve(OUT_ARG);
const REPO = resolve(HERE, "../../../..");
for (const p of [OUT, PHASEB, BEFORE]) if ((p + sep).toLowerCase().startsWith(REPO.toLowerCase() + sep)) throw new Error(`${p} must be outside the repository worktree`);
const FR = join(OUT, "frames"), SH = join(OUT, "sheets");
await mkdir(FR, { recursive: true });
await mkdir(SH, { recursive: true });
const SRC = { build: HERE, phaseb: PHASEB, before: BEFORE };
const browser = await chromium.launch();
const log = { frames: {}, measures: {}, focus: {}, status: {}, heights: {}, daily: {}, r1440: {}, failures: [] };
const fail = (m) => log.failures.push(m);

const STATES = { "28d": "", "7d": "range=7d", short: "state=short", empty: "from=2026-07-01&to=2026-07-31" };
const STATE_NAMES = { "28d": "Last 28 days (default)", "7d": "Last 7 days · Thursday's camera gap", short: "short history (readings since 13 Sep)", empty: "empty July (1 – 31 Jul)", friday: "Friday chosen", list: "the day list shown whole", range: "the range dialog", export: "the export dialog", sorted: "the table sorted by peak" };
const SIZES = { 1440: 900, 1024: 768, 768: 1024, 720: 450, 390: 844, 320: 640 };

async function open(src, q, { width = 390, height = SIZES[width] || 844, scale = 1, file = "reports.html" } = {}) {
  const phone = width <= 720;
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, isMobile: phone, hasTouch: phone, reducedMotion: "reduce", colorScheme: "dark" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(`console ${m.type()}: ${m.text()}`); });
  await page.goto(`${pathToFileURL(join(SRC[src], file)).href}?${q}`);
  if (file === "reports.html") await page.waitForFunction(() => window.__reports?.ready === true);
  else await page.waitForFunction(() => document.fonts.status === "loaded");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  return { context, page, errors };
}
const q = (lang, state, extra = "") => [`lang=${lang}`, STATES[state] ?? "", extra].filter(Boolean).join("&");
const ACTS = {
  friday: (p) => p.evaluate(() => window.__reports.pickDay(5)),
  list: (p) => p.evaluate(() => window.__reports.showAllDays()),
  sorted: (p) => p.click('#days-table [data-sort="peak"]'),
};

/* ------------------------------------------------------------------ measurements */
const MEASURE = () => {
  const de = document.documentElement;
  const vis = (el) => { if (el.closest("[hidden], dialog:not([open]), .sr-only, [inert]")) return false; const cs = getComputedStyle(el); if (cs.display === "none" || cs.visibility === "hidden" || cs.clipPath === "inset(50%)") return false; const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
  const r1 = (x) => Math.round(x * 10) / 10;
  // Lines a phrase occupies: its text's line boxes, clustered by their vertical centres.
  const lines = (el) => {
    const rg = document.createRange(); rg.selectNodeContents(el);
    const cs = [...rg.getClientRects()].filter((r) => r.width > 0.5).map((r) => (r.top + r.bottom) / 2).sort((a, b) => a - b);
    let n = 0, last = -1e9; for (const c of cs) { if (c - last > 7) { n++; last = c; } } return n;
  };
  const scope = document.querySelector("dialog[open]") || document;
  // (The peak's meta on a phone, a day and a time on lines of their own, and the export's file name, which breaks only
  // between its parts, are checked through their .nw parts.)
  const phraseSel = ".nw, .gapnote .w, .gapnote .rg, .hc .run, .hb-run .rg, .hb-run .w, .hb-h, .hb-v, .wk-n, .dl-pt, .dl-chunk, #heat-tip .tip-t span";
  const phrases = [...scope.querySelectorAll(phraseSel)].filter(vis);
  const broken = phrases.filter((el) => lines(el) > 1).map((el) => `${el.className || el.tagName}: ${el.textContent.trim().slice(0, 48)}`);
  // Targets: everything a finger or a key reaches (the pattern's grid cells are reported apart).
  const tsel = "button, a[href], select, input, [role=radio], [role=switch], [role=menuitem], [role=gridcell][tabindex]";
  const all = [...scope.querySelectorAll(tsel)].filter((el) => vis(el) && !el.closest(".skip"));
  const targets = all.filter((el) => !el.matches("[role=gridcell]")).map((el) => {
    const b = el.getBoundingClientRect();
    const name = el.id ? "#" + el.id : el.matches(".wk-b") ? `day ${el.dataset.wd}` : el.matches(".tb-item") ? `bar ${el.dataset.tab}` : el.matches(".rail-item") ? `rail ${el.dataset.nav || "brand"}` : el.matches(".seg-b") ? `seg ${el.dataset.range}` : el.matches(".sort") ? `sort ${el.dataset.sort}` : (el.className || el.tagName).toString().split(" ")[0];
    return { name, w: r1(b.width), h: r1(b.height) };
  });
  const small = targets.filter((t) => t.w < 44 - 0.05 || t.h < 44 - 0.05).map((t) => `${t.name} ${t.w}x${t.h}`);
  const cells = all.filter((el) => el.matches("[role=gridcell]")).map((el) => el.getBoundingClientRect());
  const cell = cells.length ? [r1(Math.min(...cells.map((b) => b.width))), r1(Math.min(...cells.map((b) => b.height)))] : null;
  // Spill: a box whose content passes its own edge, a table wider than its card, a list item's parts overlapping.
  const spill = [];
  for (const el of document.querySelectorAll(".stat-head, .stat-foot, .stat-value, .head-meta, .pattern-head, .days-head, .dlg-foot, .field-row, .file-line, .seg, .wk-strip, .wk-b, .hb-c, .hb-run, .dl-sortrow, .dli, .dl-more, .pday-empty, .table-empty")) {
    if (vis(el) && el.scrollWidth > el.clientWidth + 1) spill.push(`${el.className.toString().split(" ")[0]} by ${el.scrollWidth - el.clientWidth}`);
  }
  const t = document.querySelector("#days-table"), w = document.querySelector("#days-wrap");
  if (t && w && vis(t) && t.getBoundingClientRect().width > w.clientWidth + 0.5) spill.push(`day table ${r1(t.getBoundingClientRect().width)} > ${w.clientWidth}`);
  const hit = (a, b) => { const x = a.getBoundingClientRect(), y = b.getBoundingClientRect(); return x.left < y.right - 0.5 && y.left < x.right - 0.5 && x.top < y.bottom - 0.5 && y.top < x.bottom - 0.5; };
  for (const li of document.querySelectorAll(".dli")) {
    const g = (s) => li.querySelector(s);
    if (vis(li) && g(".dl-more") && g(".dl-pt") && hit(g(".dl-more"), g(".dl-pt"))) spill.push(`overlap in ${g(".dl-day")?.textContent}`);
    if (vis(li) && g(".dl-day") && g(".dl-pk") && hit(g(".dl-day"), g(".dl-pk"))) spill.push(`overlap in ${g(".dl-day")?.textContent}`);
  }
  const vw = de.clientWidth;
  for (const el of document.querySelectorAll("main *, .tabbar *, dialog[open] *")) {
    if (!vis(el) || el.closest(".heat-scroll, .md")) continue;
    const b = el.getBoundingClientRect();
    if (b.right > vw + 0.5 || b.left < -0.5) { spill.push(`outside the viewport: ${el.id ? "#" + el.id : el.className || el.tagName}`); break; }
  }
  const box = (s) => { const el = document.querySelector(s); if (!el || !vis(el)) return null; const b = el.getBoundingClientRect(); return { top: r1(b.top + scrollY), bottom: r1(b.bottom + scrollY), w: r1(b.width), h: r1(b.height) }; };
  const wk = [...document.querySelectorAll(".wk-b")].filter(vis).map((el) => el.getBoundingClientRect());
  const hb = [...document.querySelectorAll(".hb tr")].filter(vis);
  return {
    pageH: de.scrollHeight, scrollW: de.scrollWidth, innerW: innerWidth, sideways: de.scrollWidth > innerWidth,
    fold: innerHeight, pattern: box("#pattern"), days: box("#days"), glance: box("#cards"), tools: box(".rp-tools"),
    strip: box(".wk-strip"), hours: box("#hb"), dayButton: wk.length ? [r1(Math.min(...wk.map((b) => b.width))), r1(Math.min(...wk.map((b) => b.height)))] : null,
    hourRows: hb.length, form: document.querySelector("#pattern")?.dataset.form, list: document.querySelector("#days")?.dataset.form,
    phrases: phrases.length, broken, targets: targets.length, small, cell, spill: [...new Set(spill)].slice(0, 12),
  };
};
async function measure(src, lang, state, width, { act = null, extra = "", key = null } = {}) {
  const o = await open(src, q(lang, state, extra), { width });
  if (act) { await ACTS[act](o.page); await o.page.waitForTimeout(120); }
  const m = await o.page.evaluate(MEASURE);
  m.errors = o.errors;
  const k = key || `${src}-${width}-${lang}-${act || state}`;
  log.measures[k] = m;
  if (src === "build") {
    if (o.errors.length) fail(`${k}: ${o.errors.join(" | ")}`);
    if (m.sideways) fail(`${k}: the page scrolls sideways (${m.scrollW} > ${m.innerW})`);
    if (m.innerW !== width) fail(`${k}: the layout viewport widened to ${m.innerW}`);
    if (m.small.length) fail(`${k}: targets under 44 px: ${m.small.join(", ")}`);
    if (m.broken.length) fail(`${k}: broken inside: ${m.broken.join("; ")}`);
    if (m.spill.length) fail(`${k}: ${m.spill.join("; ")}`);
  }
  await o.context.close();
  return m;
}

/* ---- the status box (HDR-6): each of Daily's five statuses written into Reports' header, the box measured. */
async function statusBoxes(width, lang) {
  const words = {};
  for (const st of ["live", "delayed", "closed", "unavailable", "error"]) {
    const d = await open("build", `lang=${lang}&state=${st}&tuner=0`, { width, file: "index.html" });
    await d.page.waitForTimeout(400);
    words[st] = await d.page.evaluate(() => ({ cls: document.querySelector("#ops-btn").className, html: document.querySelector("#ops-btn-state").innerHTML }));
    await d.context.close();
  }
  const o = await open("build", `lang=${lang}`, { width });
  const rows = {};
  for (const [st, w] of Object.entries(words)) {
    rows[st] = await o.page.evaluate((w) => {
      const b = document.querySelector("#ops-btn"); b.className = w.cls; document.querySelector("#ops-btn-state").innerHTML = w.html;
      const r = (s) => { const e = document.querySelector(s).getBoundingClientRect(); return [Math.round(e.left * 10) / 10, Math.round(e.right * 10) / 10, Math.round(e.top * 10) / 10, Math.round(e.bottom * 10) / 10]; };
      return { badge: r("#ops-btn"), meta: r(".head-meta"), title: r(".head-titles"), tools: r(".rp-tools") };
    }, w);
  }
  await o.context.close();
  // The box keeps its anchored edge (inline end: right in English, left in Arabic) and its top; nothing under it moves.
  // (The title's box narrowing at 320 px in Arabic beside a wide status is K-38, recorded, not failed here.)
  const anchor = (b) => (lang === "ar" ? b[0] : b[1]);
  const spread = (f) => { const v = Object.values(rows).map(f); return Math.round((Math.max(...v) - Math.min(...v)) * 10) / 10; };
  const res = { anchorSpread: spread((x) => anchor(x.badge)), topSpread: spread((x) => x.badge[2]), heightSpread: spread((x) => x.badge[3] - x.badge[2]), toolsSpread: spread((x) => x.tools[2]), titleSpread: spread((x) => x.title[2]), titleWidthSpread: spread((x) => x.title[1] - x.title[0]), widths: Object.fromEntries(Object.entries(rows).map(([k, v]) => [k, Math.round((v.badge[1] - v.badge[0]) * 10) / 10])) };
  log.status[`${width}-${lang}`] = res;
  if (res.anchorSpread > 0.5 || res.topSpread > 0.5 || res.heightSpread > 0.5 || res.toolsSpread > 0.5 || res.titleSpread > 0.5) fail(`status ${width}-${lang}: the box moves ${JSON.stringify(res)}`);
}

/* ---- focus: every Tab stop in order, with its ring; and the keyboard of the strip, the list, the menu and the dialogs. */
const RING = () => {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  // The ring's host: the select's frame for the list's sort, a rail item's tile (the frame's FOC-4), else the element.
  const host = el.matches("#dl-sort") ? el.closest(".dl-sort") : el.matches(".rail-item") ? el.querySelector(".tile") : el;
  const cs = getComputedStyle(host);
  const ring = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2 ? `${cs.outlineWidth} ${cs.outlineColor} @${cs.outlineOffset}` : null;
  const b = host.getBoundingClientRect();
  const name = el.id ? "#" + el.id : el.matches(".wk-b") ? `day ${el.dataset.wd}` : el.matches(".tb-item") ? `bar ${el.dataset.tab}` : el.matches(".rail-item") ? `rail ${el.dataset.nav || "brand"}` : el.matches(".seg-b") ? `seg ${el.dataset.range}` : el.matches(".sort") ? `sort ${el.dataset.sort}` : el.matches(".hc") ? "grid" : el.matches(".fw-mi") ? `menu ${el.id}` : (el.className || el.tagName).toString().split(" ")[0];
  const inView = b.top >= -1 && b.bottom <= innerHeight + 1 && b.left >= -1 && b.right <= innerWidth + 1;
  return { name, ring, inView };
};
async function focusCensus(width, lang) {
  const o = await open("build", `lang=${lang}`, { width });
  const p = o.page, out = { stops: [], checks: {} };
  await p.keyboard.press("Tab");
  for (let i = 0; i < 70; i++) {
    const r = await p.evaluate(RING);
    if (!r) break;
    if (out.stops.length && out.stops[0].name === r.name && i > 3) break;
    out.stops.push(r);
    await p.keyboard.press("Tab");
  }
  const noRing = out.stops.filter((s) => !s.ring && s.name !== ".skip" && s.name !== "skip").map((s) => s.name);
  if (noRing.length) fail(`focus ${width}-${lang}: no visible ring on ${noRing.join(", ")}`);
  const tabTo = async (pred, max = 70) => { for (let i = 0; i < max; i++) { await p.keyboard.press("Tab"); if (await p.evaluate(pred)) return true; } return false; };
  const restart = async () => { await p.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); }); await p.focus(".skip"); };
  const C = out.checks;
  // The week strip (below 1024 px): one Tab stop; the arrow keys move between days (the next day is to the left in Arabic).
  if (width < 1024) {
    await restart();
    C.strip = { reached: await tabTo(() => document.activeElement?.matches(".wk-b")) };
    const before = await p.evaluate(() => +document.activeElement.dataset.wd);
    await p.keyboard.press(lang === "ar" ? "ArrowLeft" : "ArrowRight");
    const a1 = await p.evaluate(() => ({ wd: +document.activeElement.dataset.wd, checked: document.activeElement.getAttribute("aria-checked"), caption: document.querySelector("#hb caption").textContent, ring: getComputedStyle(document.activeElement).outlineStyle !== "none" }));
    await p.keyboard.press("End");
    const a2 = await p.evaluate(() => +document.activeElement.dataset.wd);
    await p.keyboard.press("Home");
    const a3 = await p.evaluate(() => +document.activeElement.dataset.wd);
    await p.keyboard.press("Tab");
    const after = await p.evaluate(() => document.activeElement.matches(".wk-b"));
    Object.assign(C.strip, { from: before, next: a1.wd, nextChecked: a1.checked, caption: a1.caption, ring: a1.ring, end: a2, home: a3, oneStop: !after });
    if (!C.strip.reached || a1.wd !== (before + 1) % 7 || a1.checked !== "true" || a2 !== 6 || a3 !== 0 || after || !a1.ring) fail(`focus ${width}-${lang}: the strip's keys ${JSON.stringify(C.strip)}`);
  }
  // The list's sort and "Show all days" (720 px and below).
  if (width <= 720) {
    await restart();
    C.sort = { reached: await tabTo(() => document.activeElement?.id === "dl-sort") };
    C.sort.ring = (await p.evaluate(RING))?.ring || null;
    C.all = { reached: await tabTo(() => document.activeElement?.id === "dl-all") };
    C.all.ring = (await p.evaluate(RING))?.ring || null;
    await p.keyboard.press("Enter");
    await p.waitForTimeout(100);
    C.all.after = await p.evaluate(() => ({ focus: document.activeElement.id, expanded: document.querySelector("#dl-all").getAttribute("aria-expanded"), items: document.querySelectorAll(".dli").length }));
    await p.keyboard.press("Enter");
    await p.waitForTimeout(100);
    C.all.collapsed = await p.evaluate(() => { const b = document.querySelector("#dl-all").getBoundingClientRect(); return { focus: document.activeElement.id, items: document.querySelectorAll(".dli").length, buttonInView: b.top >= 0 && b.bottom <= innerHeight }; });
    if (!C.sort.reached || !C.sort.ring || !C.all.reached || !C.all.ring || C.all.after.focus !== "dl-all" || C.all.after.expanded !== "true" || C.all.collapsed.focus !== "dl-all" || !C.all.collapsed.buttonInView) fail(`focus ${width}-${lang}: the list's controls ${JSON.stringify({ sort: C.sort, all: C.all })}`);
    // The menu: opens from the keyboard, focus inside, Escape closes and returns focus.
    await restart();
    C.menu = { reached: await tabTo(() => document.activeElement?.id === "menu-btn") };
    await p.keyboard.press("Enter");
    await p.waitForTimeout(250);
    C.menu.inside = await p.evaluate(() => Boolean(document.activeElement.closest("#menu-pop")));
    C.menu.ring = (await p.evaluate(RING))?.ring || null;
    await p.keyboard.press("ArrowDown");
    C.menu.moved = await p.evaluate(() => document.activeElement.id);
    await p.keyboard.press("Escape");
    await p.waitForTimeout(250);
    C.menu.back = await p.evaluate(() => document.activeElement.id);
    if (!C.menu.reached || !C.menu.inside || !C.menu.ring || C.menu.back !== "menu-btn") fail(`focus ${width}-${lang}: the menu ${JSON.stringify(C.menu)}`);
  }
  // The dialogs: the range dialog from the period control, the export from its button; focus in, kept in, Escape out.
  for (const [k, sel, pred] of [["range", '.seg-b[data-range="custom"]', () => document.activeElement?.matches('.seg-b[data-range="custom"]')], ["export", "#export-btn", () => document.activeElement?.id === "export-btn"]]) {
    await restart();
    const c = { reached: await tabTo(pred) };
    await p.keyboard.press("Enter");
    await p.waitForTimeout(400);
    c.first = await p.evaluate(RING);
    const seen = [];
    for (let i = 0; i < 8; i++) { await p.keyboard.press("Tab"); const r = await p.evaluate(() => ({ inside: Boolean(document.activeElement.closest("dialog[open]")) })); seen.push(r.inside); const g = await p.evaluate(RING); if (g && !g.ring) c.noRing = (c.noRing || []).concat(g.name); }
    c.keptInside = seen.every(Boolean);
    await p.keyboard.press("Escape");
    await p.waitForTimeout(400);
    c.back = await p.evaluate((s) => document.activeElement?.matches(s), sel);
    C[k] = c;
    if (!c.reached || !c.first?.ring || !c.keptInside || !c.back || c.noRing) fail(`focus ${width}-${lang}: the ${k} dialog ${JSON.stringify(c)}`);
  }
  out.order = out.stops.map((s) => s.name).join(" > ");
  log.focus[`${width}-${lang}`] = out;
  await o.context.close();
}

/* ------------------------------------------------------------------ frames */
async function pageFrame(name, src, query, { width = 390, scale = 1, act = null, first = false } = {}) {
  const o = await open(src, query, { width, scale });
  if (act) { await ACTS[act](o.page); await o.page.waitForTimeout(150); }
  const H = await o.page.evaluate(() => document.documentElement.scrollHeight);
  if (!first) { await o.page.setViewportSize({ width, height: H }); await o.page.waitForTimeout(200); }
  const path = join(FR, name + ".png");
  await o.page.screenshot({ path });
  log.frames[name] = { src, q: query, width, scale, cssH: first ? SIZES[width] : H, errors: o.errors };
  if (src === "build" && o.errors.length) fail(`${name}: ${o.errors.join(" | ")}`);
  await o.context.close();
  return path;
}
// A dialog as the owner sees it: the viewport at the size's own height (a bottom sheet on a phone).
async function dialogFrame(name, lang, dlg, width, scale) {
  const o = await open("build", `lang=${lang}&dialog=${dlg}`, { width, scale });
  await o.page.waitForTimeout(300);
  const path = join(FR, name + ".png");
  await o.page.screenshot({ path });
  log.frames[name] = { src: "build", q: `lang=${lang}&dialog=${dlg}`, width, scale, cssH: SIZES[width], errors: o.errors };
  if (o.errors.length) fail(`${name}: ${o.errors.join(" | ")}`);
  await o.context.close();
  return path;
}
async function elFrame(name, src, query, sel, { width = 1440, scale = 2 } = {}) {
  const o = await open(src, query, { width, scale });
  const path = join(FR, name + ".png");
  await o.page.locator(sel).screenshot({ path });
  log.frames[name] = { src, q: query, width, scale, el: sel };
  await o.context.close();
  return path;
}

/* ---- sheets: tall frames cut into slices side by side, drawn at a scale, each tile labelled. */
async function sheet(name, title, rows, { scale = 0.5, sliceH = 1700 } = {}) {
  const p = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  let html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:24px;background:#161516;color:#e9e6e5;font:13px/1.45 system-ui,sans-serif}
  h1{margin:0 0 4px;font-size:18px;font-weight:600}.note{margin:0 0 18px;color:#a9a3a5;max-width:1200px}
  .row{display:flex;flex-wrap:wrap;gap:28px 30px;align-items:flex-start;margin-block:0 30px}.row>h2{writing-mode:vertical-rl;transform:rotate(180deg);margin:0;font-size:14px;font-weight:600;color:#f2efee}
  figure{margin:0}figcaption{margin-bottom:6px;color:#a9a3a5;max-width:260px}figcaption b{color:#f2efee;font-weight:600}
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
  await p.waitForTimeout(600);
  await p.screenshot({ path: join(SH, name + ".png"), fullPage: true });
  await p.close();
}

/* ---- pixel comparison: two PNGs decoded in a page; the box of every pixel that differs. */
async function diffBox(a, b) {
  const p = await browser.newPage();
  const [da, db] = [await readFile(a), await readFile(b)].map((x) => `data:image/png;base64,${x.toString("base64")}`);
  const r = await p.evaluate(async ([da, db]) => {
    const load = (s) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = s; });
    const [A, B] = await Promise.all([load(da), load(db)]);
    if (A.width !== B.width || A.height !== B.height) return { size: [A.width, A.height, B.width, B.height] };
    const c = (img) => { const cv = document.createElement("canvas"); cv.width = img.width; cv.height = img.height; const x = cv.getContext("2d"); x.drawImage(img, 0, 0); return x.getImageData(0, 0, img.width, img.height).data; };
    const pa = c(A), pb = c(B);
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, n = 0;
    for (let i = 0; i < pa.length; i += 4) if (pa[i] !== pb[i] || pa[i + 1] !== pb[i + 1] || pa[i + 2] !== pb[i + 2]) { const k = i / 4, x = k % A.width, y = (k - x) / A.width; n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return n ? { n, box: [x0, y0, x1, y1] } : { n: 0 };
  }, [da, db]);
  await p.close();
  return r;
}
const sha = async (f) => createHash("sha256").update(await readFile(f)).digest("hex").slice(0, 16);

try {
  /* ---- 1. measurements: every size, AR and EN, the four states; the build's interactions; phase B's heights. */
  for (const width of Object.keys(SIZES).map(Number)) for (const lang of ["ar", "en"]) {
    for (const state of Object.keys(STATES)) await measure("build", lang, state, width);
    if (width < 1024) await measure("build", lang, "28d", width, { act: "friday" });
    if (width <= 720) await measure("build", lang, "28d", width, { act: "list" });
    for (const dlg of ["range", "export"]) await measure("build", lang, "28d", width, { extra: `dialog=${dlg}`, key: `build-${width}-${lang}-${dlg}` });
  }
  for (const width of [390, 768]) for (const lang of ["ar", "en"]) for (const state of Object.keys(STATES)) {
    const a = await measure("phaseb", lang, state, width), b = log.measures[`build-${width}-${lang}-${state}`];
    log.heights[`${width}-${lang}-${state}`] = { phaseB: a.pageH, build: b.pageH, change: b.pageH - a.pageH, patternB: a.pattern?.h ?? null, pattern: b.pattern?.h ?? null, daysB: a.days?.h ?? null, days: b.days?.h ?? null };
  }
  for (const lang of ["ar", "en"]) {
    for (const width of [1440, 1024, 768, 720, 390, 320]) await statusBoxes(width, lang);
    for (const width of [1440, 768, 390]) await focusCensus(width, lang);
  }

  /* ---- 2. non-regression: Daily byte-identical to aa509b9; Reports at 1440 differing only inside "Last 7 days". */
  const tmp = join(OUT, "compare");
  await mkdir(tmp, { recursive: true });
  for (const width of [1440, 768, 390]) for (const lang of ["ar", "en"]) for (const st of ["live", "delayed", "nohistory", "loading", "closed", "unavailable", "error"]) {
    const h = {};
    for (const src of ["before", "build"]) {
      const o = await open(src, `lang=${lang}&state=${st}&tuner=0`, { width, file: "index.html" });
      await o.page.waitForTimeout(500);
      const H = await o.page.evaluate(() => document.documentElement.scrollHeight);
      await o.page.setViewportSize({ width, height: H });
      await o.page.waitForTimeout(300);
      const f = join(tmp, `daily-${src}-${width}-${lang}-${st}.png`);
      await o.page.screenshot({ path: f });
      h[src] = await sha(f);
      await o.context.close();
    }
    log.daily[`${width}-${lang}-${st}`] = h.before === h.build ? `identical ${h.build}` : `DIFFERS ${h.before} ${h.build}`;
    if (h.before !== h.build) fail(`Daily ${width}-${lang}-${st} is not byte-identical to aa509b9`);
  }
  for (const lang of ["ar", "en"]) for (const state of Object.keys(STATES)) {
    const f = {};
    let card = null;
    for (const src of ["before", "build"]) {
      const o = await open(src, q(lang, state), { width: 1440 });
      const H = await o.page.evaluate(() => document.documentElement.scrollHeight);
      await o.page.setViewportSize({ width: 1440, height: H });
      await o.page.waitForTimeout(250);
      f[src] = join(tmp, `reports-${src}-1440-${lang}-${state}.png`);
      await o.page.screenshot({ path: f[src] });
      if (src === "build") card = await o.page.evaluate(() => { const b = document.querySelector("#card-trend").getBoundingClientRect(); return [Math.floor(b.left), Math.floor(b.top + scrollY), Math.ceil(b.right), Math.ceil(b.bottom + scrollY)]; });
      await o.context.close();
    }
    const d = await diffBox(f.before, f.build);
    const inside = d.n === 0 || (d.box && d.box[0] >= card[0] && d.box[1] >= card[1] && d.box[2] <= card[2] && d.box[3] <= card[3]);
    log.r1440[`${lang}-${state}`] = { ...d, card, inside };
    if (!inside) fail(`Reports 1440 ${lang} ${state} differs outside "Last 7 days": ${JSON.stringify(d)} vs card ${card}`);
  }

  /* ---- 3. frames */
  const F = {};
  const L = (lang) => lang.toUpperCase();
  for (const lang of ["ar", "en"]) {
    // 390 and 768: phase B against the build, the first screen and the whole page, in 28 days.
    for (const [width, scale] of [[390, 2], [768, 1]]) for (const src of ["phaseb", "build"]) {
      F[`${src}-${width}-${lang}-first`] = await pageFrame(`${src}-${width}-${lang}-28d-first-screen`, src, q(lang, "28d"), { width, scale, first: true });
      F[`${src}-${width}-${lang}-page`] = await pageFrame(`${src}-${width}-${lang}-28d-page`, src, q(lang, "28d"), { width, scale });
    }
    // 390 and 768: the build's states.
    for (const [width, scale] of [[390, 2], [768, 1]]) {
      for (const state of ["7d", "short", "empty"]) F[`build-${width}-${lang}-${state}`] = await pageFrame(`build-${width}-${lang}-${state}-page`, "build", q(lang, state), { width, scale });
      F[`build-${width}-${lang}-friday`] = await pageFrame(`build-${width}-${lang}-friday-page`, "build", q(lang, "28d"), { width, scale, act: "friday" });
      F[`build-${width}-${lang}-list`] = width <= 720 ? await pageFrame(`build-${width}-${lang}-all-days-page`, "build", q(lang, "28d"), { width, scale, act: "list" })
        : await pageFrame(`build-${width}-${lang}-sorted-page`, "build", q(lang, "28d"), { width, scale, act: "sorted" });
      for (const dlg of ["range", "export"]) F[`build-${width}-${lang}-${dlg}`] = await dialogFrame(`build-${width}-${lang}-${dlg}-dialog`, lang, dlg, width, scale);
    }
    // "Last 7 days" at 1440: aa509b9 against the build (Q17 removed).
    for (const src of ["before", "build"]) F[`card-${src}-${lang}`] = await elFrame(`${src}-1440-${lang}-last-7-days-card-2x`, src, q(lang, "28d"), "#card-trend");
    F[`page1440-${lang}`] = await pageFrame(`build-1440-${lang}-28d-first-screen`, "build", q(lang, "28d"), { width: 1440, first: true });
    // Spot frames: 320, 1024 and 720 × 450 (the 200% zoom of 1440).
    F[`build-320-${lang}`] = await pageFrame(`build-320-${lang}-28d-page`, "build", q(lang, "28d"), { width: 320, scale: 2 });
    F[`build-320-${lang}-empty`] = await pageFrame(`build-320-${lang}-empty-page`, "build", q(lang, "empty"), { width: 320, scale: 2 });
    F[`build-1024-${lang}`] = await pageFrame(`build-1024-${lang}-28d-first-screen`, "build", q(lang, "28d"), { width: 1024, first: true });
    F[`build-720-${lang}`] = await pageFrame(`build-720-${lang}-28d-page`, "build", q(lang, "28d"), { width: 720 });
  }
  // The strip and the bars in close-up (2x): the options round (aa509b9, ?opt=b) against the build.
  for (const lang of ["ar", "en"]) for (const [src, extra] of [["before", "opt=b"], ["build", ""]]) {
    F[`strip-${src}-${lang}`] = await elFrame(`${src}-390-${lang}-28d-pattern-2x`, src, q(lang, "28d", extra), "#pattern", { width: 390, scale: 2 });
  }

  /* ---- 4. sheets */
  const H = (k) => log.measures[k]?.pageH;
  const NAME = { phaseb: "Phase B (9309382)", build: "Build (option B)" };
  const head = (src, w, lang, what) => `<b>${NAME[src]}</b><br>${w} · ${L(lang)} · Last 28 days · ${what}`;
  for (const [width, n] of [[390, "1"], [768, "3a"]]) {
    await sheet(`0${n}-${width}-phase-b-and-build`, `Reports at ${width}: phase B (9309382) and the build, Arabic and English, Last 28 days`, [
      { note: `Each pair: phase B, then the build. The first screen is the ${width} × ${SIZES[width]} viewport; the whole page is drawn in one viewport as tall as the document, so the bar sits at the page's end. Page heights: AR ${H(`phaseb-${width}-ar-28d`)} → ${H(`build-${width}-ar-28d`)} px, EN ${H(`phaseb-${width}-en-28d`)} → ${H(`build-${width}-en-28d`)} px.` },
      ...["ar", "en"].map((lang) => ({ title: L(lang), tiles: ["phaseb", "build"].flatMap((src) => [
        { src: F[`${src}-${width}-${lang}-first`], dpr: width === 390 ? 2 : 1, scale: width === 390 ? 0.5 : 0.36, sliceH: 99999, label: head(src, width, lang, "first screen") },
        { src: F[`${src}-${width}-${lang}-page`], dpr: width === 390 ? 2 : 1, scale: width === 390 ? 0.3 : 0.2, sliceH: width === 390 ? 1450 : 2700, label: head(src, width, lang, `whole page, ${H(`${src}-${width}-${lang}-28d`)} px`) },
      ]) })),
    ], {});
  }
  for (const [width, n] of [[390, "2"], [768, "3b"]]) {
    const states = ["7d", "short", "empty", "friday", "list", "range", "export"];
    const label = (lang, s) => `<b>${width} · ${L(lang)} · ${STATE_NAMES[s === "list" && width > 720 ? "sorted" : s]}</b>${["range", "export"].includes(s) ? `<br>the ${width} × ${SIZES[width]} viewport` : `<br>${H(`build-${width}-${lang}-${s}`) || H(`build-${width}-${lang}-28d`)} px`}`;
    await sheet(`0${n}-${width}-states`, `Reports at ${width}, the build: states, another weekday, ${width <= 720 ? "the day list shown whole" : "the table sorted"}, and the dialogs`, [
      { note: width <= 720 ? "Last 7 days opens on Thursday, the day of the highest peak (no hour has 3 days, so none is the busiest); every bar is hatched because each slot is one day. The short history has readings since 13 September. Empty July says its sentence once, in the busy-times card with the way back; day by day steps aside. Friday is closed until 2 PM, one worded row. The dialogs are bottom sheets." : "At 768 the hours stand as columns; the day table keeps phase B's form (sorted by peak in its tile). Empty July: one sentence in the busy-times card, day by day steps aside. The dialogs are centred panels." },
      ...["ar", "en"].map((lang) => ({ title: L(lang), tiles: states.map((s) => ({ src: F[`build-${width}-${lang}-${s}`], dpr: width === 390 ? 2 : 1, scale: width === 390 ? 0.3 : 0.24, sliceH: width === 390 ? 1700 : 2700, label: label(lang, s) })) })),
    ], {});
  }
  await sheet("04-1440-last-7-days-card", `"Last 7 days" at 1440, before (aa509b9) and after the Q17 removal`, [
    { note: "Only this card changes at 1440 (the whole page compared pixel by pixel with aa509b9 in four states, AR and EN). The card keeps 166 px." },
    ...["ar", "en"].map((lang) => ({ title: L(lang), tiles: [["before", `before (aa509b9): ${lang === "ar" ? "«مقابل 9 – 15 سبتمبر»" : "“vs 9 – 15 Sep”"}`], ["build", "after: the value and its measure"]].map(([src, l]) => ({ src: F[`card-${src}-${lang}`], dpr: 2, scale: 1, sliceH: 9999, label: `<b>1440 · ${L(lang)} · Last 28 days</b><br>${l}` })) })),
  ], {});
  await sheet("05-spot-frames-320-1024-720", "Spot frames: 320, 1024 and 720 × 450 (the 200% zoom of 1440)", [
    ...["ar", "en"].map((lang) => ({ title: L(lang), tiles: [
      { src: F[`build-320-${lang}`], dpr: 2, scale: 0.3, sliceH: 1600, label: `<b>320 · ${L(lang)} · Last 28 days</b><br>${H(`build-320-${lang}-28d`)} px` },
      { src: F[`build-320-${lang}-empty`], dpr: 2, scale: 0.3, sliceH: 1600, label: `<b>320 · ${L(lang)} · empty July</b>` },
      { src: F[`build-1024-${lang}`], scale: 0.4, sliceH: 9999, label: `<b>1024 · ${L(lang)} · Last 28 days</b><br>first screen (1440's grid form)` },
      { src: F[`build-720-${lang}`], scale: 0.3, sliceH: 1800, label: `<b>720 × 450 · ${L(lang)} · Last 28 days</b><br>the phone frame, ${H(`build-720-${lang}-28d`)} px` },
    ] })),
  ], {});
  await sheet("06-390-strip-and-bars-before-after", "The week strip and the bars at 390 (2x): the options round's B (aa509b9) and the build", [
    { note: "Before: each weekday's busiest hour as one small bar, nearly equal; the quiet hours' bars in the ramp's darkest tones. After: each weekday carries its own hours in miniature on the bars' scale (Friday opens at 2 PM; Saturday's morning and its lower evening); every bar keeps a 1 px FITWAY-red edge, its number printed at its end." },
    ...["ar", "en"].map((lang) => ({ title: L(lang), tiles: [["before", "options round (aa509b9, ?opt=b)"], ["build", "build"]].map(([src, l]) => ({ src: F[`strip-${src}-${lang}`], dpr: 2, scale: 0.85, sliceH: 9999, label: `<b>390 · ${L(lang)} · Last 28 days</b><br>${l}` })) })),
  ], {});
} finally {
  await writeFile(join(OUT, "build-log.json"), JSON.stringify(log, null, 1));
  await browser.close();
}
if (log.failures.length) { console.error(log.failures.join("\n")); process.exit(1); }
console.log("ok", Object.keys(log.frames).length, "frames,", Object.keys(log.measures).length, "measured pages");
