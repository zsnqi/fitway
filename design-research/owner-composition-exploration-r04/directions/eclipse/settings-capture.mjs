// Eclipse Settings capture (DECISIONS items 49, 78-80). Serves this folder on 127.0.0.1 (port 3190 unless --port=N;
// other rounds hold 3173-3189), renders the Settings frames with the worktree's Playwright chromium (a fresh context
// per frame, reduced motion; 720 px and below a touch phone with overlay scrollbars), checks each one, and writes them
// numbered the same way in both languages. It never writes into this repository: the output folder is required and
// must be outside it.
//   node design-research/owner-composition-exploration-r04/directions/eclipse/settings-capture.mjs <outDir> [--port=3190] [--only=1,2,3,4,5] [--lang=ar|en] [--match=<part of a frame's name>]
// Writes <outDir>/crops/<n>-<nn>-<what>-<size>-<lang>.png and <outDir>/settings-log.json:
//   1-  the page at rest (arrangement ج): 1440 x 900 and 390 x 844 (the first screen and the whole page), 1024 x 768
//       (the whole page) and 768 x 1024 (the first screen); each card at 1440, cropped with a strip of its neighbours;
//       each of the phone's three cards and its header at 390
//   2-  each value in edit: each card's window at 1440 x 900, 1024 x 768 and 390 x 844 (the phone's sheet), then each
//       window's cases cropped to the window: the people following capacity, every sentence about a value that looks
//       like a mistake, the refusals on «حفظ», a day closed, «24 ساعة», every day closed, the keyboard's rings, capacity
//       at the contract's largest
//   3- (part 3) each state; 4- (part 3) the range cases; 5- the phone's flows step by step (5-01…10 the editing steps;
//       part 3 adds the rest)
// It exits 1 if a check fails: a console message or page error, a font file fetched twice in one load, a request off
// the page's origin, a layout shift after the first paint, a sideways page scroll, an element outside the viewport's
// width, a box whose content spills, an interactive target under 44 px; from 1024 px, the two cards of a row not
// starting and ending on one line, or the crowd's level rules not meeting the hours' last four rules across the
// gutter; a card whose values start on more than one edge; or a level's people that differ from bandFor's counting
// (packages/api/src/occupancy/bands.ts) for any capacity and limits the check draws. In edit (2- and 5-): the page
// behind moving when a window opens or closes, focus not starting in the window or not returning to the card's «تعديل»,
// a day of the week not on one line from 721 px, a window that closes on a scrim tap with something typed.
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_ARG = process.argv.slice(2).find((a) => !a.startsWith("--"));
if (!OUT_ARG) throw new Error("settings-capture.mjs needs an output folder outside the repository");
const OUT = resolve(OUT_ARG);
if ((OUT + sep).toLowerCase().startsWith(resolve(HERE, "../../../..").toLowerCase() + sep)) throw new Error("the output folder must be outside the repository worktree");
const PORT = Number((process.argv.find((a) => a.startsWith("--port=")) || "--port=3190").slice(7));
if (PORT >= 3173 && PORT <= 3189) throw new Error("ports 3173-3189 belong to other rounds");
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) || "").slice(7).split(",").filter(Boolean);
const want = (n) => !ONLY.length || ONLY.includes(String(n));
const LANGS_ARG = (process.argv.find((a) => a.startsWith("--lang=")) || "").slice(7);
const LANGS = LANGS_ARG ? [LANGS_ARG] : ["ar", "en"];
const MATCH = (process.argv.find((a) => a.startsWith("--match=")) || "").slice(8);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const CROPS = join(OUT, "crops");
await mkdir(CROPS, { recursive: true });
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".png": "image/png", ".json": "application/json", ".woff2": "font/woff2" };
const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", ORIGIN);
  const file = normalize(join(HERE, decodeURIComponent(url.pathname === "/" ? "/settings.html" : url.pathname)));
  if (!file.startsWith(HERE + sep)) { res.writeHead(403).end(); return; }
  try { const body = await readFile(file); res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream", "cache-control": "no-store" }); res.end(body); }
  catch { res.writeHead(404).end("not found"); }
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
const browser = await chromium.launch();
const log = { frames: {}, failures: [] };

const INIT = `(() => { window.__cls = 0;
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) { if (!e.hadRecentInput) window.__cls += e.value; } }).observe({ type: "layout-shift", buffered: true }); } catch (e) {}
})();`;
// Visible problems: a sideways page scroll, an element outside the viewport's width, a box whose content spills, and an
// interactive target under 44 px (on screen, not hidden).
const PROBLEMS = () => {
  const de = document.documentElement, vw = de.clientWidth, out = [];
  if (de.scrollWidth > vw) out.push(`page scrolls sideways by ${de.scrollWidth - vw}px`);
  for (const el of document.querySelectorAll("body *")) {
    if (el.closest("[hidden], .sr-only, dialog:not([open]), .rail, .hb-res")) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const r = el.getBoundingClientRect();
    if (r.width && (r.right > vw + 0.5 || r.left < -0.5)) out.push(`outside the viewport: ${el.id ? "#" + el.id : el.className?.baseVal ?? el.className ?? el.tagName} ${Math.round(r.left)}..${Math.round(r.right)}`);
  }
  for (const el of document.querySelectorAll(".head, .set-tools, .set-grid, .set-card, .set-head, .set-title, .set-figs, .set-fig, .set-fig > dd, .set-sub, .set-dl, .set-row, .set-row > dt, .set-row > dd, .log-list, .log-rec, .log-body, .log-chgs, .log-why, .log-meta, .dlg-panel, .dlg-head, .dlg-body, .dlg-foot, .alert, .ed-fig, .ed-line, .ed-list, .ed-row, .ed-warn, .field-err")) {
    if (el.closest("[hidden], dialog:not([open])")) continue;
    if (getComputedStyle(el).display === "none" || !el.getClientRects().length) continue;
    // «عرض الكل» reaches 12 px past its words into the card's padding (Access's link), by design.
    const allow = el.matches(".set-log .set-head") ? 12 : 0;
    if (el.scrollWidth > el.clientWidth + allow + 1) out.push(`spills: ${el.className || el.tagName} by ${el.scrollWidth - el.clientWidth}px`);
  }
  const scope = document.querySelector("dialog[open]") || document;
  for (const el of scope.querySelectorAll("button, a[href], select, input:not([type=hidden]), textarea")) {
    if (el.closest("[hidden], .rail, .sr-only") || el.matches(".skip, .rail-item")) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || r.bottom < 0 || r.top > innerHeight) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    if (r.height < 43.5 || r.width < 43.5) out.push(`small target: ${el.id ? "#" + el.id : el.className || el.tagName} ${Math.round(r.width)}x${Math.round(r.height)}`);
  }
  return [...new Set(out)].slice(0, 12);
};

async function open(q, { width = 1440, height = 900, scale = 1, phone = width <= 720 } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, isMobile: phone, hasTouch: phone, reducedMotion: "reduce", colorScheme: "dark" });
  await context.addInitScript(INIT);
  const page = await context.newPage();
  const errors = [], fonts = new Map(), off = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => errors.push("console " + m.type() + ": " + m.text()));
  page.on("request", (r) => {
    const u = r.url();
    if (!u.startsWith(ORIGIN) && !u.startsWith("blob:") && !u.startsWith("data:")) off.push(u);
    if (/\/fonts\/[^/?]+\.woff2/.test(u)) fonts.set(u, (fonts.get(u) || 0) + 1);
  });
  await page.goto(`${ORIGIN}/settings.html?${q}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__settings?.ready === true);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(120);
  const cls0 = await page.evaluate(() => +window.__cls.toFixed(5));
  return { context, page, errors, fonts, off, cls0, checks: [], notes: {} };
}
async function finish(name, o, extra = {}) {
  const { page, errors, fonts, off, cls0, checks, notes } = o;
  const found = await page.evaluate(PROBLEMS);
  const maxFont = Math.max(0, ...fonts.values());
  const rec = { errors, maxFontFetch: maxFont, offOrigin: off, clsAtRest: cls0, problems: found, checks, notes, ...extra };
  log.frames[name] = rec;
  const bad = [];
  if (errors.length) bad.push("errors: " + errors.join(" / "));
  if (maxFont > 1) bad.push("font fetched twice");
  if (off.length) bad.push("off-origin request");
  if (cls0 > 0) bad.push(`layout shift at rest ${cls0}`);
  if (found.length) bad.push(found.join("; "));
  if (checks.length) bad.push(checks.join("; "));
  if (bad.length) log.failures.push(`${name}: ${bad.join(" | ")}`);
  return rec;
}
const path = (name) => join(CROPS, name + ".png");
const box = (page, sel) => page.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; }, sel);
// An element with a strip of its neighbours: `pad` px around it, inside the page.
async function crop(page, sel, file, pad = 24) {
  const b = await box(page, sel);
  if (!b) return null;
  const size = await page.evaluate(() => ({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight }));
  const x = Math.max(0, b.x - pad), y = Math.max(0, b.y - pad);
  const clip = { x, y, width: Math.min(size.w - x, b.w + pad * 2), height: Math.min(size.h - y, b.h + pad * 2) };
  await page.screenshot({ path: file, clip, fullPage: true });
  return clip;
}
const frameName = (n, what, size, lang) => `${n}-${what}-${size}-${lang}`;
const wanted = (name) => !MATCH || name.includes(MATCH);

/* bandFor (packages/api/src/occupancy/bands.ts), as written there: a count's percent of capacity, at or under a limit. */
const bandFor = (count, cap, t) => { const p = (count / cap) * 100; return p <= t[0] ? 0 : p <= t[1] ? 1 : p <= t[2] ? 2 : 3; };

for (const lang of LANGS) {
  const q = (extra = "") => `lang=${lang}${extra ? `&${extra}` : ""}`;

  /* ---------------------------------------------------------------- 1- the page at rest */
  if (want(1)) {
    const sizes = [["01", "rest", 1440, 900, false], ["02", "rest-whole", 1440, 900, true], ["03", "rest", 390, 844, false], ["04", "rest-whole", 390, 844, true], ["05", "rest-whole", 1024, 768, true], ["06", "rest", 768, 1024, false]];
    for (const [nn, what, w, h, full] of sizes) {
      const name = frameName(`1-${nn}`, what, w, lang);
      if (!wanted(name)) continue;
      const o = await open(q(), { width: w, height: h });
      // The whole page: the window grown to the page's height, so the phone's fixed bar stands at the page's foot, as it
      // does once the page is scrolled to its end (a full-page capture would draw it over the middle).
      if (full) {
        const ph = await o.page.evaluate(() => document.documentElement.scrollHeight);
        await o.page.setViewportSize({ width: w, height: Math.max(h, ph) });
        await o.page.waitForTimeout(80);
      }
      await o.page.screenshot({ path: path(name) });
      // From 1024 px the two cards of a row start and end on one line, and the crowd's level rules meet the hours' last
      // four rules across the gutter (one module, --row, in every card).
      if (w >= 1024) {
        const c = {};
        for (const k of ["crowd", "hours", "day", "log"]) c[k] = await box(o.page, `#card-${k}`);
        for (const [a, b] of [["crowd", "hours"], ["day", "log"]]) {
          if (Math.abs(c[a].y - c[b].y) > 0.5) o.checks.push(`${a} and ${b} start ${c[a].y} / ${c[b].y}`);
          if (Math.abs(c[a].y + c[a].h - (c[b].y + c[b].h)) > 0.5) o.checks.push(`${a} and ${b} end ${c[a].y + c[a].h} / ${c[b].y + c[b].h}`);
        }
        const rules = await o.page.evaluate(() => ({
          levels: [...document.querySelectorAll("#card-crowd .dl-levels .set-row")].map((r) => r.getBoundingClientRect().top),
          hours: [...document.querySelectorAll("#card-hours .dl-hours .set-row")].map((r) => r.getBoundingClientRect().top).slice(-4),
          // Each card's first rule, under its head: one line across the row.
          firsts: ["#card-crowd .set-fig", "#card-hours .set-row", "#card-day .set-fig", "#card-log .log-rec"].map((s) => document.querySelector(s).getBoundingClientRect().top),
        }));
        rules.levels.forEach((y, i) => { if (Math.abs(y - rules.hours[i]) > 0.5) o.checks.push(`level rule ${i} at ${y}, hours rule at ${rules.hours[i]}`); });
        if (Math.abs(rules.firsts[0] - rules.firsts[1]) > 0.5 || Math.abs(rules.firsts[2] - rules.firsts[3]) > 0.5) o.checks.push(`first rules ${rules.firsts.join(" / ")}`);
        o.notes.cards = c; o.notes.rules = rules;
      }
      o.notes.pageHeight = await o.page.evaluate(() => document.documentElement.scrollHeight);
      // In each card a list's values start on one edge (its label column, --lab).
      o.notes.valueStarts = await o.page.evaluate((rtl) => Object.fromEntries([...document.querySelectorAll(".set-card")].map((c) => [c.id, [...new Set([...c.querySelectorAll(".set-row > dd")].map((d) => Math.round(rtl ? d.getBoundingClientRect().right : d.getBoundingClientRect().left)))]])), lang === "ar");
      for (const [id, edges] of Object.entries(o.notes.valueStarts)) if (edges.length > 1) o.checks.push(`${id} values start on ${edges.length} edges: ${edges.join(", ")}`);
      await finish(name, o);
      await o.context.close();
    }
    // Each card at 1440 with a strip of its neighbours, and each of the phone's cards.
    const parts = [["07", "crowd", "#card-crowd"], ["08", "hours", "#card-hours"], ["09", "business-day", "#card-day"], ["10", "history", "#card-log"]];
    {
      const o = await open(q(), { width: 1440, height: 900 });
      for (const [nn, what, sel] of parts) {
        const name = frameName(`1-${nn}`, what, 1440, lang);
        if (wanted(name)) await crop(o.page, sel, path(name), 24);
      }
      await finish(frameName("1-07", "cards", 1440, lang), o);
      await o.context.close();
    }
    {
      const o = await open(q(), { width: 390, height: 844 });
      for (const [nn, what, sel] of [["11", "crowd", "#card-crowd"], ["12", "hours", "#card-hours"], ["13", "business-day", "#card-day"], ["14", "head-and-history-link", ".head"]]) {
        const name = frameName(`1-${nn}`, what, 390, lang);
        if (!wanted(name)) continue;
        if (sel === ".head") await o.page.screenshot({ path: path(name), clip: { x: 0, y: 0, width: 390, height: 140 } });
        else await crop(o.page, sel, path(name), 16);
      }
      await finish(frameName("1-11", "cards", 390, lang), o);
      await o.context.close();
    }
    // The people per level against bandFor, for capacities from 1 to the contract's largest and limits at their tightest
    // and widest: the last count each level holds is the largest count bandFor puts in it.
    if (lang === "ar") {
      const o = await open(q(), { width: 1440, height: 900 });
      const caps = [1, 2, 3, 7, 10, 33, 99, 100, 101, 120, 140, 150, 333, 999, 1000, 12345, 2147483647];
      const lims = [[0, 1, 2], [20, 40, 57], [24, 48, 68], [33, 66, 99], [97, 98, 99], [98, 99, 100], [0, 50, 100], [1, 2, 100]];
      let tried = 0;
      for (const cap of caps) for (const t of lims) {
        const got = await o.page.evaluate(([c, l]) => l.map((p) => window.__settings.people(c, p)), [cap, t]);
        for (let lv = 0; lv < 3; lv++) {
          const n = got[lv];
          tried++;
          // n itself is at or under the level's limit, n + 1 is above it (bandFor puts it in a higher level).
          if (!(n / cap * 100 <= t[lv]) || bandFor(n + 1, cap, t) <= lv) o.checks.push(`people ${cap} ${t.join("/")} level ${lv}: ${n}`);
        }
      }
      o.notes.peopleCases = tried;
      await finish("1-people-against-bandFor", o);
      await o.context.close();
    }
  }
}

/* ------------------------------------------------------------------ the editor (2- and 5-) */
const CARDS = ["crowd", "hours", "day", "log"];
const cardBoxes = (page) => page.evaluate((ks) => ks.map((k) => { const e = document.querySelector(`#card-${k}`); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((v) => +v.toFixed(2)); }), CARDS);
const moved = (a, b) => a.some((x, i) => x && b[i] && x.some((v, j) => Math.abs(v - b[i][j]) > 0.01));
// Opens a card's window by its «تعديل» (a tap on a phone), checking that nothing behind it moved and focus is inside.
async function editOpen(o, sec, phone) {
  // The card's «تعديل» brought into view first (a tap scrolls to it), so only the window's own effect is measured.
  await o.page.locator(`[data-edit="${sec}"]`).scrollIntoViewIfNeeded();
  const before = await cardBoxes(o.page);
  if (phone) await o.page.tap(`[data-edit="${sec}"]`); else await o.page.click(`[data-edit="${sec}"]`);
  await o.page.waitForFunction(() => document.querySelector("dialog[open] .dlg-panel"));
  await o.page.waitForTimeout(60);
  const after = await cardBoxes(o.page);
  if (moved(before, after)) o.checks.push(`${sec}: the page behind moved when its window opened`);
  const inside = await o.page.evaluate(() => !!document.activeElement?.closest("dialog[open]"));
  if (!inside) o.checks.push(`${sec}: focus did not start in the window`);
  o.notes.before = before;
  return before;
}
async function editClose(o, sec) {
  await o.page.keyboard.press("Escape");
  await o.page.waitForTimeout(80);
  const after = await cardBoxes(o.page);
  const out = [];
  if (moved(o.notes.before, after)) out.push(`${sec}: the page behind moved when its window closed`);
  const back = await o.page.evaluate((s) => document.activeElement === document.querySelector(`[data-edit="${s}"]`), sec);
  if (!back) out.push(`${sec}: focus did not return to its «تعديل»`);
  return out;
}
// The window, cropped with a strip of the page around it.
const PANEL = "dialog[open] .dlg-panel";
async function shotPanel(o, name, pad = 24) {
  const b = await o.page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }, PANEL);
  const vw = await o.page.evaluate(() => [innerWidth, innerHeight]);
  const x = Math.max(0, b.x - pad), y = Math.max(0, b.y - pad);
  await o.page.screenshot({ path: path(name), clip: { x, y, width: Math.min(vw[0] - x, b.w + pad * 2), height: Math.min(vw[1] - y, b.h + pad * 2) } });
}
const fill = (o, sel, value) => o.page.fill(sel, value);
const leave = (o) => o.page.evaluate(() => document.activeElement?.blur());
// Each day of the week on one line (from 721 px): every row as tall as the window's module, 57 px.
async function weekOneLine(o) {
  const hs = await o.page.evaluate(() => [...document.querySelectorAll(".ed-day")].map((r) => +r.getBoundingClientRect().height.toFixed(2)));
  if (hs.some((h) => Math.abs(h - 57) > 0.5)) o.checks.push(`a day of the week is not on one line: ${hs.join(", ")}`);
  o.notes.weekRows = hs;
}

for (const lang of LANGS) {
  const q = (extra = "") => `lang=${lang}${extra ? `&${extra}` : ""}`;
  if (want(2)) {
    // Each window at rest, opened by its «تعديل», at 1440, 1024 and 390, then closed with Escape.
    const sizes = [["1440", 1440, 900, 0], ["1024", 1024, 768, 3], ["390", 390, 844, 6]];
    for (const [size, w, h, base] of sizes) {
      for (const [k, sec] of ["crowd", "hours", "day"].entries()) {
        const name = frameName(`2-${String(base + k + 1).padStart(2, "0")}`, `${sec === "day" ? "business-day" : sec}-window`, size, lang);
        if (!wanted(name)) continue;
        const o = await open(q(), { width: w, height: h });
        await editOpen(o, sec, w <= 720);
        if (sec === "hours" && w > 720) await weekOneLine(o);
        await o.page.screenshot({ path: path(name) });
        await finish(name, o);
        const closing = await editClose(o, sec);
        if (closing.length) log.failures.push(`${name} (closed): ${closing.join("; ")}`);
        await o.context.close();
      }
    }
    // The cases, each cropped to its window at 1440.
    const cases = [
      ["10", "crowd-people-follow-capacity", "crowd", async (o) => { await fill(o, "#ed-cap", "140"); }],
      ["11", "crowd-capacity-sentence-low", "crowd", async (o) => { await fill(o, "#ed-cap", "5"); await leave(o); }],
      ["12", "crowd-capacity-sentence-high", "crowd", async (o) => { await fill(o, "#ed-cap", "300"); await leave(o); }],
      ["13", "crowd-refusals", "crowd", async (o) => { await fill(o, "#ed-cap", ""); await fill(o, "#ed-lv1", "15"); await fill(o, "#ed-lv2", "120"); await o.page.click(".ed-save"); }],
      ["14", "crowd-capacity-largest", "crowd", async (o) => { await fill(o, "#ed-cap", "2147483647"); await leave(o); }],
      ["15", "hours-closed-24h-sentences", "hours", async (o) => { await o.page.click("#ed-fri-sw"); await fill(o, "#ed-thu-close", "11"); await o.page.selectOption("#ed-thu-close-ap", "pm"); await fill(o, "#ed-sat-close", "8"); await leave(o); }],
      ["16", "hours-every-day-closed", "hours", async (o) => { for (const d of ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]) await o.page.click(`#ed-${d}-sw`); }],
      ["17", "hours-refusals", "hours", async (o) => { await fill(o, "#ed-mon-open", ""); await fill(o, "#ed-tue-close", "25:00"); await o.page.click(".ed-save"); }],
      ["18", "business-day-sentences", "day", async (o) => { await fill(o, "#ed-end", "130"); await leave(o); await fill(o, "#ed-reset", "400"); await leave(o); }],
      ["19", "business-day-refusals", "day", async (o) => { await fill(o, "#ed-end", "4:7"); await fill(o, "#ed-reset", "5.5"); await o.page.click(".ed-save"); }],
      ["20", "hours-keyboard-rings", "hours", async (o) => { await o.page.keyboard.press("Tab"); }],
      ["21", "crowd-keyboard-ring", "crowd", async (o) => { await o.page.keyboard.press("Shift+Tab"); await o.page.keyboard.press("Shift+Tab"); }],
    ];
    for (const [nn, what, sec, act] of cases) {
      const name = frameName(`2-${nn}`, what, 1440, lang);
      if (!wanted(name)) continue;
      const o = await open(q(), { width: 1440, height: 900 });
      // The keyboard's rings: the window opened from its «تعديل» with Enter, so focus moves by key.
      if (what.includes("keyboard")) { await o.page.focus(`[data-edit="${sec}"]`); await o.page.keyboard.press("Enter"); await o.page.waitForTimeout(80); }
      else await editOpen(o, sec, false);
      await act(o);
      await o.page.waitForTimeout(60);
      await shotPanel(o, name);
      // A scrim tap with something typed keeps the window, and what is typed.
      if (nn === "10") {
        await o.page.mouse.click(40, 860);
        await o.page.waitForTimeout(60);
        const kept = await o.page.evaluate(() => !!document.querySelector("dialog[open]") && document.querySelector("#ed-cap").value === "140");
        if (!kept) o.checks.push("a scrim tap closed a window with something typed");
      }
      await finish(name, o);
      await o.context.close();
    }
  }

  /* 5- the phone's flows, step by step: the editing steps (part 3 adds the confirmation, working, done, the refusals,
   * the conflict view and leaving). Each step is the whole 390 x 844 screen. */
  if (want(5)) {
    const steps = [
      ["01", "crowd-tap-edit", "crowd", null],
      ["02", "crowd-capacity-typed", "crowd", async (o) => { await fill(o, "#ed-cap", "140"); }],
      ["03", "crowd-capacity-sentence", "crowd", async (o) => { await fill(o, "#ed-cap", "50"); await leave(o); }],
      ["04", "crowd-save-refused", "crowd", async (o) => { await fill(o, "#ed-lv1", "15"); await o.page.tap(".ed-save"); }],
      ["05", "crowd-cancel-back", "crowd", async (o) => { await fill(o, "#ed-cap", "140"); await o.page.tap(".ed-cancel"); }],
      ["06", "hours-tap-edit", "hours", null],
      ["07", "hours-friday-closed", "hours", async (o) => { await o.page.tap("#ed-fri-sw"); }],
      ["08", "hours-24h-and-sentences", "hours", async (o) => { await fill(o, "#ed-sat-close", "8"); await leave(o); await o.page.evaluate(() => { const b = document.querySelector("dialog[open] .dlg-body"); b.scrollTop = b.scrollHeight; }); }],
      ["09", "business-day-tap-edit", "day", null],
      ["10", "business-day-sentences", "day", async (o) => { await fill(o, "#ed-end", "130"); await leave(o); await fill(o, "#ed-reset", "400"); await leave(o); }],
    ];
    for (const [nn, what, sec, act] of steps) {
      const name = frameName(`5-${nn}`, what, 390, lang);
      if (!wanted(name)) continue;
      const o = await open(q(), { width: 390, height: 844 });
      await editOpen(o, sec, true);
      if (act) await act(o);
      await o.page.waitForTimeout(60);
      if (nn === "05") {
        const back = await o.page.evaluate(() => !document.querySelector("dialog[open]") && document.activeElement === document.querySelector('[data-edit="crowd"]'));
        if (!back) o.checks.push("Cancel did not close the sheet and return focus to «تعديل»");
        const kept = await o.page.evaluate(() => window.__settings.editable.capacity);
        if (kept !== 120) o.checks.push(`Cancel kept a typed value: capacity ${kept}`);
      }
      await o.page.screenshot({ path: path(name) });
      await finish(name, o);
      await o.context.close();
    }
  }
}

await writeFile(join(OUT, "settings-log.json"), JSON.stringify(log, null, 2));
await browser.close();
server.close();
console.log(log.failures.length ? `FAIL ${log.failures.length}\n${log.failures.join("\n")}` : `OK ${Object.keys(log.frames).length} frames`);
process.exit(log.failures.length ? 1 : 0);
