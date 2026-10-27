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
//   3-  each state, at 1440 x 900 (cropped to the window) and 390 x 844 (the whole screen): the confirmation (one
//       change with the people that follow, every crowd value, the hours, the business day, a reason at 240), working,
//       done (the whole page; the hours at 1024 in its tight form), each refusal (400, 401, 403), the failure (500),
//       the conflict view in its three forms (apply, nothing left to apply, no longer fits), the question before
//       closing with something typed, Loading, Error and its retry; a folded history record's window (DECISIONS item
//       83) with the widest record ج writes, the week's seven days and 240 characters, at 1440 and 390, and the record
//       of every kind of change at 1440
//   4-  the range cases, each cropped to its element with a strip of its neighbours: capacity 1 (1440, 390) and the
//       contract's largest (1440, 390, 1024), the limits at their tightest and widest, every day closed, one day
//       closed, opening equal to closing, the business day's end and the reset at their bounds, a history with no
//       record, one, a record of every kind of change with a reason of 240 characters (its row), and the week's record
//       folded at 1440 and 1024, the confirmation's people at capacity 1 and at the tightest limits
//   5-  the phone's flows step by step: 5-01…10 the editing steps (part 2), then «إلغاء» with something typed asking
//       first, the confirmation, the reason, working, done, the hours' done under its head, back to the editor, the
//       conflict view and applying from it, each refusal, the failure
//   6-  decision 81 (DECISIONS item 81): the hours' copy (6-01..03 at 1440 and 6-04..06 at 390: the step, after the copy, the
//       confirmation that follows; 6-07 no tick, 6-08 a refused week, 6-09 every day closed, 6-10 Friday closed, 6-11 the tool's
//       keyboard ring, 6-12 a box's ring, 6-13 the source changed) and the acceptance checks of OWN-S28 and OWN-S29 (6-20..34, no
//       frames): the tool's geometry, the step's rows and edges, the ways out, the Ramadan flow through the confirmation and the
//       record, forced colours, the phone's history (cards, records, loading against arrived at 390, 320 and 1440, the fold, the
//       sheet, a record with no reason, the page from 721 px). Added to 1- (1-15..18 the phone's history card) and 3- (3-23..25).
// It exits 1 if a check fails: a console message or page error, a font file fetched twice in one load, a request off
// the page's origin, a layout shift after the first paint, a sideways page scroll, an element outside the viewport's
// width, a box whose content spills, an interactive target under 44 px; from 1024 px, the two cards of a row not
// starting and ending on one line, or the crowd's level rules not meeting the hours' last four rules across the
// gutter; a card whose values start on more than one edge; or a level's people that differ from bandFor's counting
// (packages/api/src/occupancy/bands.ts) for any capacity and limits the check draws. In edit (2- and 5-): the page
// behind moving when a window opens or closes, focus not starting in the window or not returning to the card's «تعديل»,
// a day of the week not on one line from 721 px, a window that closes on a scrim tap with something typed. After «حفظ»
// (3- and 5-): «حفظ» not leading to the confirmation, focus not on the reason (from 721 px) or the title (a phone), a
// value card that grows from 721 px when its done line arrives, focus not on the done line, a refusal that leaves the
// action, a conflict view that names someone, a window that closes with something typed without asking first. The
// history (1- and 4-): a record cut short with «…» that is not folded (no control to open it whole), a folded record's
// control that leaves its card on any side; a window's title cut with «…», by its own box (the h2 or an element inside it) or by a box that clips it; the records' words are measured for spills with that control set aside (its 12 px
// reach into the card's padding is by design), and text cut with «…» is judged by the box that cuts it. A record's window
// (3-): the page behind moving as it opens or closes, focus not in it or not back on the record's control after
// Escape, the widest record's window scrolling at 1440 x 900 or 390 x 844.
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
  // Text cut short on purpose with «…» (a history record's name or reason on its one line) is clipped by its own box:
  // what lies past that box is never painted, so only the box is judged here, and the fold check below makes sure the
  // whole text has a way to it. Any other clipping (a dialog, the page) still counts.
  const cutBy = (el) => { for (let a = el; a && a !== document.body; a = a.parentElement) { const s = getComputedStyle(a); if (s.textOverflow === "ellipsis" && s.overflowX !== "visible") return a; } return null; };
  for (const el of document.querySelectorAll("body *")) {
    if (el.closest("[hidden], .sr-only, dialog:not([open]), .rail, .hb-res")) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const r = el.getBoundingClientRect();
    if (!r.width || (r.right <= vw + 0.5 && r.left >= -0.5)) continue;
    const clip = cutBy(el.parentElement), cr = clip && clip.getBoundingClientRect();
    if (clip && cr.right <= vw + 0.5 && cr.left >= -0.5) continue;
    out.push(`outside the viewport: ${el.id ? "#" + el.id : el.className?.baseVal ?? el.className ?? el.tagName} ${Math.round(r.left)}..${Math.round(r.right)}`);
  }
  // A folded record's control reaches 12 px past the record's words into the card's padding, by design (Access's row):
  // it is set aside while the boxes are measured, so the records' own words are judged with no allowance, and it must
  // stay inside its card.
  for (const b of document.querySelectorAll(".log-open:not([hidden])")) {
    const r = b.getBoundingClientRect(), c = b.closest(".set-card")?.getBoundingClientRect();
    if (r.width && c && (r.left < c.left - 0.5 || r.right > c.right + 0.5 || r.top < c.top - 0.5 || r.bottom > c.bottom + 0.5)) out.push(`a record's control leaves its card: ${Math.round(r.left)}..${Math.round(r.right)} x ${Math.round(r.top)}..${Math.round(r.bottom)} in ${Math.round(c.left)}..${Math.round(c.right)} x ${Math.round(c.top)}..${Math.round(c.bottom)}`);
  }
  // A window's title is never cut: not with «…», not by its own box (the h2 or an element inside it), and not by a box
  // that clips it (the head, the panel, the window).
  for (const h of document.querySelectorAll("dialog[open] .dlg-head h2")) {
    if (h.closest("[hidden]")) continue;
    for (const el of [h, ...h.querySelectorAll("*")]) {
      // Words only a screen reader gets (.sr-only, 1 px by design) are not the title a person reads.
      if (!el.getClientRects().length || el.closest(".sr-only")) continue;
      const cs = getComputedStyle(el), r = el.getBoundingClientRect();
      // Text clipped by its own box, with «…» or without: the title (h2) itself and each element inside it.
      const cutX = cs.overflowX !== "visible" && el.scrollWidth > el.clientWidth + 0.5, cutY = cs.overflowY !== "visible" && el.scrollHeight > el.clientHeight + 0.5;
      if (cutX && cs.textOverflow === "ellipsis") out.push(`a window's title is cut with «…»: ${el.className || el.tagName} by ${el.scrollWidth - el.clientWidth}px`);
      else if (cutX || cutY) out.push(`a window's title is cut by its own box: ${el.className || el.tagName} by ${cutX ? el.scrollWidth - el.clientWidth + "px across" : el.scrollHeight - el.clientHeight + "px down"}`);
      for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
        const as = getComputedStyle(a);
        if (as.overflowX === "visible" && as.overflowY === "visible") continue;
        const ar = a.getBoundingClientRect();
        if (r.left < ar.left - 0.5 || r.right > ar.right + 0.5 || r.top < ar.top - 0.5 || r.bottom > ar.bottom + 0.5) { out.push(`a window's title is clipped by ${a.className || a.tagName}: ${el.className || el.tagName}`); break; }
      }
    }
  }
  const aside = [...document.querySelectorAll(".log-open")].map((b) => [b, b.style.display]);
  aside.forEach(([b]) => { b.style.display = "none"; });
  for (const el of document.querySelectorAll(".head, .set-tools, .set-grid, .set-card, .set-head, .set-title, .set-figs, .set-fig, .set-fig > dd, .set-sub, .set-dl, .set-row, .set-row > dt, .set-row > dd, .log-box, .log-list, .log-rec, .log-fig, .log-meta, .dlg-panel, .dlg-head, .dlg-body, .dlg-foot, .alert, .ed-fig, .ed-line, .ed-list, .ed-row, .ed-warn, .field-err")) {
    if (el.closest("[hidden], dialog:not([open])")) continue;
    if (getComputedStyle(el).display === "none" || !el.getClientRects().length) continue;
    // «عرض الكل» reaches 12 px past its words into the card's padding (Access's link), by design.
    const allow = el.matches(".set-log .set-head") ? 12 : 0;
    if (el.scrollWidth > el.clientWidth + allow + 1) out.push(`spills: ${el.className || el.tagName} by ${el.scrollWidth - el.clientWidth}px`);
  }
  aside.forEach(([b, d]) => { b.style.display = d; });
  // A history record cut short with «…» (its name or its reason) is folded: its control opens it whole (DECISIONS item 83).
  for (const li of document.querySelectorAll(".log-rec:not(.is-ph)")) {
    if (!li.getClientRects().length) continue;
    const cut = [...li.querySelectorAll(".log-what, .log-why")].some((e) => e.getClientRects().length && e.scrollWidth > e.clientWidth + 0.5);
    const open = li.querySelector(".log-open");
    if (cut && (!open || open.hidden)) out.push(`a record cut short is not folded: v${li.dataset.v}`);
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
    // The phone's history card (DECISIONS item 81, OWN-S29): arrived, loading, the week's record folded short, a record with no reason.
    for (const [nn, what, extra] of [["15", "history", ""], ["16", "history-loading", "state=loading"], ["17", "history-week-folded", "log=week"], ["18", "history-no-reason", "case=low"]]) {
      const name = frameName(`1-${nn}`, what, 390, lang);
      if (!wanted(name)) continue;
      const o = await open(q(extra), { width: 390, height: 844 });
      await crop(o.page, "#card-log", path(name), 16);
      await finish(name, o);
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
  // The window's panel in view: the editor's, or the step that took its place (the editor waits hidden behind it).
  const b = await o.page.evaluate((s) => { const r = [...document.querySelectorAll(s)].find((p) => !p.hidden).getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }, PANEL);
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

  /* 5- the phone's flows, step by step: the editing steps (01-10, part 2's; 05 now asks first, the coordinator's ruling
   * given to part 3). Each step is the whole 390 x 844 screen. */
  if (want(5)) {
    const steps = [
      ["01", "crowd-tap-edit", "crowd", null],
      ["02", "crowd-capacity-typed", "crowd", async (o) => { await fill(o, "#ed-cap", "140"); }],
      ["03", "crowd-capacity-sentence", "crowd", async (o) => { await fill(o, "#ed-cap", "50"); await leave(o); }],
      ["04", "crowd-save-refused", "crowd", async (o) => { await fill(o, "#ed-lv1", "15"); await o.page.tap(".ed-save"); }],
      ["05", "crowd-cancel-asks-first", "crowd", async (o) => { await fill(o, "#ed-cap", "140"); await o.page.tap(".ed-cancel"); }],
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
      // «إلغاء» with something typed asks first (the coordinator's ruling): the sheet stays, with the question, focus on
      // «متابعة التعديل»; nothing is saved.
      if (nn === "05") {
        const asked = await o.page.evaluate(() => window.__settings.step === "discard" && !!document.querySelector("dialog[open]") && document.activeElement?.matches(".st-back"));
        if (!asked) o.checks.push("Cancel with something typed did not ask first");
        const kept = await o.page.evaluate(() => window.__settings.editable.capacity);
        if (kept !== 120) o.checks.push(`Cancel kept a typed value: capacity ${kept}`);
      }
      await o.page.screenshot({ path: path(name) });
      await finish(name, o);
      await o.context.close();
    }
  }
}

/* ------------------------------------------------------------------ the dialogs, the states and the range (3-, 4-, 5-)
 * part 3. A step after «حفظ» is reached the way the owner reaches it: the card's «تعديل», the values, «حفظ». */
const saveFrom = async (o, sec, act, phone) => {
  await editOpen(o, sec, phone);
  await act(o);
  await leave(o);
  if (phone) await o.page.tap(`#ed-${sec} .ed-save`); else await o.page.click(`#ed-${sec} .ed-save`);
  await o.page.waitForTimeout(80);
};
// A step holds a pointer's clicks for 500 ms after it appears (OWN-S16), so a press on a step's button waits it out.
const STEP_HOLD = 540;
const press = async (o, sel, phone) => { if (sel.includes(".st-")) await o.page.waitForTimeout(STEP_HOLD); return phone ? o.page.tap(sel) : o.page.click(sel); };
const applyNow = async (o, sec, phone, wait = 900) => { await press(o, `#st-${sec} .st-do`, phone); await o.page.waitForTimeout(wait); };
const step = (o) => o.page.evaluate(() => window.__settings.step);
// «حفظ» leads to the confirmation, focused on the reason from 721 px and on its title on a phone; it lists the changes
// the record will name and, for the crowd, the people each level holds.
async function checkConfirm(o, sec, phone) {
  const r = await o.page.evaluate((s) => {
    const st = document.querySelector(`#st-${s}`);
    return { step: window.__settings.step, rows: st.querySelectorAll(".cf-list:not(.cf-ppl) > .cf-row").length,
      ppl: [...st.querySelectorAll(".cf-ppl > .cf-row .sr-only")].map((e) => e.textContent), focus: document.activeElement?.id || document.activeElement?.tagName };
  }, sec);
  if (r.step !== "confirm") o.checks.push(`${sec}: «حفظ» did not lead to the confirmation (${r.step})`);
  const want = phone ? `st-${sec}-title` : `st-${sec}-reason`;
  if (r.focus !== want) o.checks.push(`${sec}: the confirmation focused ${r.focus}, not ${want}`);
  o.notes.confirm = r;
  return r;
}
const CROWD_ONE = async (o) => { await fill(o, "#ed-cap", "140"); };
const CROWD_ALL = async (o) => { await fill(o, "#ed-cap", "140"); await fill(o, "#ed-lv0", "25"); await fill(o, "#ed-lv1", "50"); await fill(o, "#ed-lv2", "75"); };
const HOURS_SOME = async (o) => {
  for (const d of ["sun", "mon", "tue"]) { await fill(o, `#ed-${d}-close`, "12"); await o.page.selectOption(`#ed-${d}-close-ap`, "am"); }
  await fill(o, "#ed-wed-open", "7");
  await o.page.click("#ed-fri-sw");
};
const DAY_BOTH = async (o) => { await fill(o, "#ed-end", "5"); await fill(o, "#ed-reset", "15"); };
const WHY = { ar: "توسعة صالة الأوزان", en: "The weights room is bigger" };
const R240 = { ar: "وسّعنا الصالة وافتتحنا منطقة الأوزان الحرة، فرفعنا السعة إلى 140 شخصًا وعدّلنا حدود المستويات لتناسبها، وقدّمنا الإغلاق إلى منتصف الليل في أول الأسبوع، وأغلقنا الجمعة للصيانة الدورية حتى نهاية الشهر، ونقلنا التصفير إلى ربع ساعة بعد الإغلاق.",
  en: "We expanded the gym and opened the free-weights area, so capacity goes to 140 and the levels follow it; we close at midnight early in the week, Friday is closed for maintenance until month end, and the count resets 15 minutes after closing." };
// The done line: the window gone, focus on the line, and from 721 px no value card grown by it (its head keeps 44 px).
async function checkDone(o, sec, w) {
  const r = await o.page.evaluate(() => { const n = document.querySelector("#notice"); const h = n?.parentElement; return n ? { mode: h.dataset.done, head: +h.getBoundingClientRect().height.toFixed(2), focus: document.activeElement === n, open: !!document.querySelector("dialog[open]") } : null; });
  if (!r) { o.checks.push(`${sec}: no done line after applying`); return; }
  if (r.open) o.checks.push(`${sec}: the window stayed open after applying`);
  if (!r.focus) o.checks.push(`${sec}: focus is not on the done line`);
  if (w > 720 && r.head > 44.5) o.checks.push(`${sec}: its card grew by its done line at ${w} px (${r.mode}, head ${r.head})`);
  o.notes.done = r;
}

for (const lang of LANGS) {
  const q = (extra = "") => `lang=${lang}${extra ? `&${extra}` : ""}`;
  const why = (o) => fill(o, "#st-crowd-reason", WHY[lang]);
  if (want(3)) {
    // Each state at 1440 (cropped to its window, or the page) and at 390 (the whole screen).
    const states = [
      ["01", "confirm-crowd-one-change", "", async (o, ph) => { await saveFrom(o, "crowd", CROWD_ONE, ph); await checkConfirm(o, "crowd", ph); }],
      ["02", "confirm-crowd-every-value", "", async (o, ph) => {
        await saveFrom(o, "crowd", CROWD_ALL, ph);
        const r = await checkConfirm(o, "crowd", ph);
        if (r.rows !== 4) o.checks.push(`crowd: ${r.rows} changes listed, not 4`);
        if (r.ppl.length !== 3) o.checks.push(`crowd: ${r.ppl.length} people lines, not 3`);
      }],
      ["03", "confirm-hours", "", async (o, ph) => { await saveFrom(o, "hours", HOURS_SOME, ph); await checkConfirm(o, "hours", ph); }],
      ["04", "confirm-business-day", "", async (o, ph) => { await saveFrom(o, "day", DAY_BOTH, ph); await checkConfirm(o, "day", ph); }],
      ["05", "confirm-reason-240", "", async (o, ph) => {
        await saveFrom(o, "crowd", CROWD_ONE, ph);
        await fill(o, "#st-crowd-reason", R240[lang]);
        const left = await o.page.evaluate(() => ({ n: document.querySelector("#st-crowd-reason").value.length, shown: !document.querySelector("#st-crowd-reason-left").hidden }));
        if (left.n > 240 || !left.shown) o.checks.push(`reason: ${left.n} characters, counter ${left.shown ? "shown" : "hidden"}`);
        o.notes.reason = left;
      }],
      ["06", "working", "hold=1", async (o, ph) => {
        await saveFrom(o, "crowd", CROWD_ONE, ph);
        await press(o, "#st-crowd .st-do", ph);
        await o.page.waitForTimeout(120);
        const r = await o.page.evaluate(() => ({ busy: window.__settings.busy, focus: !!document.activeElement?.matches(".st-do"), off: document.querySelector("#st-crowd .st-back").getAttribute("aria-disabled") }));
        if (!r.busy || !r.focus || r.off !== "true") o.checks.push(`working: ${JSON.stringify(r)}`);
        // Escape waits while it works.
        await o.page.keyboard.press("Escape");
        await o.page.waitForTimeout(60);
        if ((await step(o)) !== "confirm") o.checks.push("working: Escape left the confirmation");
      }],
      ["07", "done", "", async (o, ph, w) => { await saveFrom(o, "crowd", CROWD_ONE, ph); await why(o); await applyNow(o, "crowd", ph); await checkDone(o, "crowd", w); }, "page"],
      ["08", "refused-400", "refuse=bad_request", async (o, ph) => { await saveFrom(o, "crowd", CROWD_ONE, ph); await applyNow(o, "crowd", ph); }],
      ["09", "refused-401", "refuse=unauthorized", async (o, ph) => { await saveFrom(o, "crowd", CROWD_ONE, ph); await applyNow(o, "crowd", ph); }],
      ["10", "refused-403", "refuse=forbidden", async (o, ph) => { await saveFrom(o, "crowd", CROWD_ONE, ph); await applyNow(o, "crowd", ph); }],
      ["11", "failed-500", "fail=1", async (o, ph) => { await saveFrom(o, "crowd", CROWD_ONE, ph); await applyNow(o, "crowd", ph); }],
      ["12", "conflict", "refuse=settings_version_conflict", async (o, ph) => { await saveFrom(o, "crowd", CROWD_ONE, ph); await why(o); await applyNow(o, "crowd", ph); }],
      ["13", "conflict-nothing-to-apply", "refuse=settings_version_conflict", async (o, ph) => { await saveFrom(o, "crowd", async (x) => { await fill(x, "#ed-cap", "150"); }, ph); await applyNow(o, "crowd", ph); }],
      ["14", "conflict-no-longer-fits", "refuse=settings_version_conflict&other=limits", async (o, ph) => { await saveFrom(o, "crowd", async (x) => { await fill(x, "#ed-lv1", "50"); }, ph); await applyNow(o, "crowd", ph); }],
      ["15", "close-asks-first", "", async (o, ph) => {
        await editOpen(o, "crowd", ph); await fill(o, "#ed-cap", "140"); await leave(o);
        await o.page.keyboard.press("Escape"); await o.page.waitForTimeout(80);
        if ((await step(o)) !== "discard") o.checks.push("Escape with something typed did not ask first");
      }],
      ["16", "loading", "state=loading", null, "page"],
      ["17", "error", "state=error", null, "page"],
      ["18", "error-retrying", "state=error", async (o) => { await o.page.click("#retry"); await o.page.waitForTimeout(100); }, "page"],
    ];
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      const ph = w <= 720;
      for (const [nn, what, extra, act, kind] of states) {
        const name = frameName(`3-${nn}`, what, w, lang);
        if (!wanted(name)) continue;
        const o = await open(q(extra), { width: w, height: h });
        if (act) await act(o, ph, w);
        await o.page.waitForTimeout(80);
        // The conflict view names no one (DECISIONS item 78).
        if (what.startsWith("conflict")) {
          const named = await o.page.evaluate(() => /فهد|نورة|سارة|Fahad|Noura|Sara/.test(document.querySelector("dialog[open]")?.textContent || ""));
          if (named) o.checks.push("the conflict view names someone");
          const st = await step(o);
          if (st !== "conflict") o.checks.push(`not the conflict view: ${st}`);
        }
        if (what.startsWith("refused") && (await o.page.evaluate(() => !document.querySelector("dialog[open] .st-do")?.hidden))) o.checks.push("a refusal left the action");
        if (kind === "page" || ph) await o.page.screenshot({ path: path(name) });
        else await shotPanel(o, name);
        await finish(name, o);
        await o.context.close();
      }
    }
    // A folded history record's window (DECISIONS item 83): from 1440 by its control, with the page behind and focus
    // checked; on a phone, where the history waits for its own round (item 81), by `?record=latest`. The widest record ج
    // writes (the week's seven days, 240 characters) does not scroll at 1440 x 900 or 390 x 844.
    for (const [nn, what, extra, w, h, widest] of [["20", "record-window-week", "log=week", 1440, 900, true], ["21", "record-window-week", "log=week&record=latest", 390, 844, true], ["22", "record-window-every-change", "log=every", 1440, 900, false]]) {
      const rname = frameName(`3-${nn}`, what, w, lang);
      if (!wanted(rname)) continue;
      const o = await open(q(extra), { width: w, height: h });
      if (w > 720) {
        const ctl = o.page.locator(".log-rec .log-open:not([hidden])").first();
        await ctl.scrollIntoViewIfNeeded();
        const before = await cardBoxes(o.page);
        await ctl.click();
        await o.page.waitForTimeout(80);
        if (moved(before, await cardBoxes(o.page))) o.checks.push("the page behind moved as the record's window opened");
        if (!(await o.page.evaluate(() => document.querySelector("#dlg-rec").contains(document.activeElement)))) o.checks.push("focus is not in the record's window");
        await shotPanel(o, rname);
        o.notes.panel = await o.page.evaluate(() => { const b = document.querySelector("#dlg-rec .dlg-body"); return { scroll: b.scrollHeight, client: b.clientHeight, width: document.querySelector("#dlg-rec .dlg-panel").getBoundingClientRect().width }; });
        await o.page.keyboard.press("Escape");
        await o.page.waitForTimeout(80);
        if (moved(before, await cardBoxes(o.page))) o.checks.push("the page behind moved as the record's window closed");
        if (!(await o.page.evaluate(() => !document.querySelector("#dlg-rec").open && document.activeElement?.matches(".log-open")))) o.checks.push("Escape did not close the record's window back to its control");
      } else {
        await o.page.waitForTimeout(80);
        o.notes.panel = await o.page.evaluate(() => { const b = document.querySelector("#dlg-rec .dlg-body"); return { scroll: b.scrollHeight, client: b.clientHeight }; });
        await o.page.screenshot({ path: path(rname) });
      }
      if (widest && o.notes.panel.scroll > o.notes.panel.client + 1) o.checks.push(`the week's record scrolls in its window (${o.notes.panel.scroll} of ${o.notes.panel.client})`);
      await finish(rname, o);
      await o.context.close();
    }
    // The phone's history (DECISIONS item 81): a folded record's sheet opened from the card (3-23); after a copy and a save on a
    // phone, the new record at the top of the history with its reason (3-24, the whole page) and its sheet, the same four lines
    // as the confirmation (3-25).
    {
      const n23 = frameName("3-23", "record-sheet-from-card", 390, lang);
      if (wanted(n23)) {
        const o = await open(q("log=week"), { width: 390, height: 844 });
        await o.page.locator("#card-log .log-rec .log-open").first().scrollIntoViewIfNeeded();
        await o.page.tap("#card-log .log-rec .log-open"); await o.page.waitForTimeout(120);
        await o.page.screenshot({ path: path(n23) });
        await finish(n23, o);
        await o.context.close();
      }
      const n24 = frameName("3-24", "done-history-after-copy", 390, lang), n25 = frameName("3-25", "new-record-sheet", 390, lang);
      if (wanted(n24) || wanted(n25)) {
        const o = await open(q(), { width: 390, height: 844 });
        await editOpen(o, "hours", true);
        await fill(o, "#ed-sun-open", "8"); await o.page.selectOption("#ed-sun-open-ap", "pm"); await fill(o, "#ed-sun-close", "2"); await o.page.selectOption("#ed-sun-close-ap", "am");
        await o.page.tap("#ed-copy"); await o.page.waitForTimeout(STEP_HOLD);
        await o.page.tap('.cp-row[data-day="fri"]');
        await press(o, "#st-hours .st-do", true); await o.page.waitForTimeout(80);
        await fill(o, "#ed-fri-open", "9"); await o.page.selectOption("#ed-fri-open-ap", "pm"); await fill(o, "#ed-fri-close", "2"); await o.page.selectOption("#ed-fri-close-ap", "am");
        await leave(o);
        await o.page.tap("#ed-hours .ed-save"); await o.page.waitForTimeout(100);
        await fill(o, "#st-hours-reason", lang === "ar" ? "ساعات رمضان" : "Ramadan hours");
        await applyNow(o, "hours", true);
        const top = await o.page.evaluate(() => { const li = document.querySelector("#card-log .log-rec"); return { v: li.dataset.v, short: li.classList.contains("is-short"), why: li.querySelector(".log-why")?.textContent || "", ver: window.__settings.version }; });
        if (!top.short || top.v !== String(top.ver) || !top.why.includes(lang === "ar" ? "ساعات رمضان" : "Ramadan hours")) o.checks.push(`the new record on a phone: ${JSON.stringify(top)}`);
        const ph = await o.page.evaluate(() => document.documentElement.scrollHeight);
        await o.page.setViewportSize({ width: 390, height: Math.max(844, ph) }); await o.page.waitForTimeout(100);
        await o.page.screenshot({ path: path(n24) });
        await o.page.setViewportSize({ width: 390, height: 844 }); await o.page.waitForTimeout(100);
        await o.page.locator("#card-log .log-rec .log-open").first().scrollIntoViewIfNeeded();
        await o.page.tap("#card-log .log-rec .log-open"); await o.page.waitForTimeout(150);
        const said = await o.page.evaluate(() => [...document.querySelectorAll("#dlg-rec .cf-row:not(.is-why) .sr-only")].length);
        if (said !== 4) o.checks.push(`the new record's sheet lists ${said} changes, not 4`);
        await o.page.screenshot({ path: path(n25) });
        await finish(n24, o);
        await o.context.close();
      }
    }
    // Done at 1024 for the hours: the head's tight form (the name over «توقيت الرياض», the line over its link).
    const name = frameName("3-19", "done-hours", 1024, lang);
    if (wanted(name)) {
      const o = await open(q(), { width: 1024, height: 768 });
      await saveFrom(o, "hours", async (x) => { await x.page.click("#ed-fri-sw"); }, false);
      await applyNow(o, "hours", false);
      await checkDone(o, "hours", 1024);
      await o.page.screenshot({ path: path(name) });
      await finish(name, o);
      await o.context.close();
    }
  }

  if (want(4)) {
    // The range, each element with a strip of its neighbours.
    const cases = [
      ["01", "capacity-1", "case=cap1", "#card-crowd", 1440],
      ["02", "capacity-largest", "case=capmax", "#card-crowd", 1440],
      ["03", "limits-tightest", "case=tight", "#card-crowd", 1440],
      ["04", "limits-widest", "case=wide", "#card-crowd", 1440],
      ["05", "capacity-largest", "case=capmax", "#card-crowd", 390],
      ["06", "capacity-1", "case=cap1", "#card-crowd", 390],
      ["07", "every-day-closed", "case=closed", "#card-hours", 1440],
      ["08", "friday-closed", "case=friday", "#card-hours", 1440],
      ["09", "opening-equals-closing", "case=allday", "#card-hours", 1440],
      ["10", "business-day-lowest", "case=low", "#card-day", 1440],
      ["11", "business-day-highest", "case=high", "#card-day", 1440],
      ["12", "business-day-highest", "case=high", "#card-day", 390],
      ["13", "history-none", "log=none", "#card-log", 1440],
      ["14", "history-one", "log=one", "#card-log", 1440],
      ["15", "history-every-change-reason-240", "log=every", ".set-grid", 1440],
      ["18", "capacity-largest", "case=capmax", "#card-crowd", 1024],
      ["19", "history-week-folded", "log=week", "#card-log", 1440],
      ["20", "history-week-folded", "log=week", "#card-log", 1024],
    ];
    for (const [nn, what, extra, sel, w] of cases) {
      const name = frameName(`4-${nn}`, what, w, lang);
      if (!wanted(name)) continue;
      const o = await open(q(extra), { width: w, height: w <= 720 ? 844 : 900 });
      await crop(o.page, sel, path(name), w <= 720 ? 16 : 24);
      o.notes.cards = await cardBoxes(o.page);
      await finish(name, o);
      await o.context.close();
    }
    // The confirmation's people at the range's ends: capacity 120 → 1 (two levels no count reaches), and the limits at
    // their tightest.
    const confirms = [
      ["16", "confirm-capacity-1", async (o) => { await fill(o, "#ed-cap", "1"); }],
      ["17", "confirm-limits-tightest", async (o) => { await fill(o, "#ed-lv0", "0"); await fill(o, "#ed-lv1", "1"); await fill(o, "#ed-lv2", "2"); }],
    ];
    for (const [nn, what, act] of confirms) {
      const name = frameName(`4-${nn}`, what, 1440, lang);
      if (!wanted(name)) continue;
      const o = await open(q(), { width: 1440, height: 900 });
      await saveFrom(o, "crowd", act, false);
      await checkConfirm(o, "crowd", false);
      await shotPanel(o, name);
      await finish(name, o);
      await o.context.close();
    }
  }

  if (want(5)) {
    // The rest of the phone's flows, after the editing steps: each the whole 390 x 844 screen, reached by touch.
    const flows = [
      ["11", "crowd-close-without-saving", "", async (o) => {
        await editOpen(o, "crowd", true); await fill(o, "#ed-cap", "140"); await leave(o);
        await o.page.tap(".ed-cancel"); await o.page.waitForTimeout(80);
        await o.page.waitForTimeout(STEP_HOLD); await o.page.tap(".st-discard"); await o.page.waitForTimeout(80);
        const r = await o.page.evaluate(() => ({ open: !!document.querySelector("dialog[open]"), focus: document.activeElement === document.querySelector('[data-edit="crowd"]'), cap: window.__settings.editable.capacity }));
        if (r.open || !r.focus || r.cap !== 120) o.checks.push(`close without saving: ${JSON.stringify(r)}`);
      }],
      ["12", "crowd-confirm", "", async (o) => { await saveFrom(o, "crowd", CROWD_ONE, true); await checkConfirm(o, "crowd", true); }],
      ["13", "crowd-reason-typed", "", async (o) => { await saveFrom(o, "crowd", CROWD_ONE, true); await o.page.tap("#st-crowd-reason"); await o.page.keyboard.type(WHY[lang]); }],
      ["14", "crowd-working", "hold=1", async (o) => { await saveFrom(o, "crowd", CROWD_ONE, true); await o.page.waitForTimeout(STEP_HOLD); await o.page.tap("#st-crowd .st-do"); await o.page.waitForTimeout(120); }],
      ["15", "crowd-done", "", async (o) => { await saveFrom(o, "crowd", CROWD_ONE, true); await applyNow(o, "crowd", true); await checkDone(o, "crowd", 390); }],
      ["16", "hours-confirm", "", async (o) => { await saveFrom(o, "hours", async (x) => { await x.page.tap("#ed-fri-sw"); }, true); await checkConfirm(o, "hours", true); }],
      ["17", "hours-done", "", async (o) => { await saveFrom(o, "hours", async (x) => { await x.page.tap("#ed-fri-sw"); }, true); await applyNow(o, "hours", true); await checkDone(o, "hours", 390); }],
      ["18", "crowd-back-to-editor", "", async (o) => {
        await saveFrom(o, "crowd", CROWD_ONE, true); await o.page.waitForTimeout(STEP_HOLD); await o.page.tap("#st-crowd .st-back"); await o.page.waitForTimeout(80);
        const r = await o.page.evaluate(() => ({ step: window.__settings.step, cap: document.querySelector("#ed-cap").value }));
        if (r.step !== "edit" || r.cap !== "140") o.checks.push(`back to the editor: ${JSON.stringify(r)}`);
      }],
      ["19", "crowd-conflict", "refuse=settings_version_conflict", async (o) => { await saveFrom(o, "crowd", CROWD_ONE, true); await applyNow(o, "crowd", true); }],
      ["20", "crowd-conflict-applied", "refuse=settings_version_conflict", async (o) => { await saveFrom(o, "crowd", CROWD_ONE, true); await applyNow(o, "crowd", true); await applyNow(o, "crowd", true); await checkDone(o, "crowd", 390); }],
      ["21", "crowd-refused-400", "refuse=bad_request", async (o) => { await saveFrom(o, "crowd", CROWD_ONE, true); await applyNow(o, "crowd", true); }],
      ["22", "crowd-refused-401", "refuse=unauthorized", async (o) => { await saveFrom(o, "crowd", CROWD_ONE, true); await applyNow(o, "crowd", true); }],
      ["23", "crowd-refused-403", "refuse=forbidden", async (o) => { await saveFrom(o, "crowd", CROWD_ONE, true); await applyNow(o, "crowd", true); }],
      ["24", "crowd-failed-500", "fail=1", async (o) => { await saveFrom(o, "crowd", CROWD_ONE, true); await applyNow(o, "crowd", true); }],
    ];
    for (const [nn, what, extra, act] of flows) {
      const name = frameName(`5-${nn}`, what, 390, lang);
      if (!wanted(name)) continue;
      const o = await open(q(extra), { width: 390, height: 844 });
      await act(o);
      await o.page.waitForTimeout(80);
      await o.page.screenshot({ path: path(name) });
      await finish(name, o);
      await o.context.close();
    }
  }
}

/* ------------------------------------------------------------------ 6- decision 81: copying one day's hours, and the history on a phone
 * 6-01..03 the copy at 1440 (the step, after the copy, the confirmation that follows), 6-04..06 the same at 390, 6-07 no
 * tick, 6-08 a refused week, 6-09 every day closed, 6-10 Friday closed, 6-11 the tool's keyboard ring, 6-12 a box's ring;
 * 6-13 the source changed; 6-20..39 the acceptance checks of OWN-S28 / OWN-S29 (checks only, no frame). */
const SUN = async (o) => { await fill(o, "#ed-sun-open", "8"); await o.page.selectOption("#ed-sun-open-ap", "pm"); await fill(o, "#ed-sun-close", "2"); await o.page.selectOption("#ed-sun-close-ap", "am"); };
const FRI = async (o) => { await fill(o, "#ed-fri-open", "9"); await o.page.selectOption("#ed-fri-open-ap", "pm"); await fill(o, "#ed-fri-close", "2"); await o.page.selectOption("#ed-fri-close-ap", "am"); };
const tapOrClick = (o, sel, ph) => (ph ? o.page.tap(sel) : o.page.click(sel));
const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
const T6 = {
  ar: { tool: "نسخ الساعات إلى أيام أخرى", title: "نسخ الساعات", none: "اختر يومًا واحدًا على الأقل", said: "نُسخت ساعات الأحد إلى 5 أيام.", bad: "اكتب الوقت هكذا: 6:30", confirm: "تطبيق تغييرات ساعات العمل؟",
    rec: "ساعات الأحد إلى الأربعاء و3 تغييرات أخرى", whats: ["ساعات الأحد إلى الأربعاء", "فتح الخميس", "ساعات الجمعة", "ساعات السبت"], why: "ساعات رمضان", closed: "مغلق", sun: "الأحد" },
  en: { tool: "Copy hours to other days", title: "Copy hours", none: "Choose at least one day", said: "Sunday's hours copied to 5 days.", bad: "Enter a time like 6:30", confirm: "Apply these opening hours changes?",
    rec: "Hours, Sunday to Wednesday and 3 more", whats: ["Hours, Sunday to Wednesday", "Thursday opening", "Friday hours", "Saturday hours"], why: "Ramadan hours", closed: "Closed", sun: "Sunday" },
};
const hoursOpen = async (o, ph) => { await editOpen(o, "hours", ph); };
const stepNow = (o) => o.page.evaluate(() => ({ step: window.__settings.step, focus: document.activeElement?.id || document.activeElement?.className || document.activeElement?.tagName }));
const week = (o) => o.page.evaluate(() => ["sun", "mon", "tue", "wed", "thu", "fri", "sat"].map((d) => ({ d, on: document.querySelector(`#ed-${d}-sw`).getAttribute("aria-checked"), o: document.querySelector(`#ed-${d}-open`).value + " " + document.querySelector(`#ed-${d}-open-ap`).value, c: document.querySelector(`#ed-${d}-close`).value + " " + document.querySelector(`#ed-${d}-close-ap`).value })));
const colGeom = (o) => o.page.evaluate(() => [...document.querySelectorAll("#ed-hours .tf, #ed-hours .ed-note, #ed-hours .ed-closed")].map((e) => { const r = e.getBoundingClientRect(); return [e.className.split(" ")[0] + (e.dataset.tf || e.id || ""), +r.left.toFixed(2), +r.width.toFixed(2)]; }));
const noAnim = (o) => o.page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length);
const hold = (o) => o.page.waitForTimeout(STEP_HOLD);
const rtlOf = (lang) => lang === "ar";

for (const lang of LANGS) {
  const q = (extra = "") => `lang=${lang}${extra ? `&${extra}` : ""}`;
  const t = T6[lang], rtl = rtlOf(lang);
  if (want(6)) {
    // ---- the frames, at 1440 and 390: the step (Sunday 8 PM - 2 AM to every day but Friday), after the copy, the confirmation
    for (const [w, h, base] of [[1440, 900, 1], [390, 844, 4]]) {
      const ph = w <= 720, size = String(w);
      const n1 = frameName(`6-${String(base).padStart(2, "0")}`, "copy-step", size, lang), n2 = frameName(`6-${String(base + 1).padStart(2, "0")}`, "after-copy", size, lang), n3 = frameName(`6-${String(base + 2).padStart(2, "0")}`, "confirm-after-copy", size, lang);
      if (!wanted(n1) && !wanted(n2) && !wanted(n3)) continue;
      const o = await open(q(), { width: w, height: h });
      const before = await (async () => { await hoursOpen(o, ph); await SUN(o); return cardBoxes(o.page); })();
      const colsBefore = await colGeom(o);
      await tapOrClick(o, "#ed-copy", ph); await o.page.waitForTimeout(80);
      await hold(o);
      if ((await stepNow(o)).step !== "copy") o.checks.push("the tool did not open the copy step");
      await tapOrClick(o, '.cp-row[data-day="fri"]', ph); await o.page.waitForTimeout(40);
      const ticks = await o.page.evaluate(() => [...document.querySelectorAll(".cp-chk")].map((c) => c.value + ":" + c.checked).join(","));
      if (ticks !== "mon:true,tue:true,wed:true,thu:true,fri:false,sat:true") o.checks.push(`ticks ${ticks}`);
      if (ph) await o.page.screenshot({ path: path(n1) }); else await shotPanel(o, n1);
      await press(o, "#st-hours .st-do", ph); await o.page.waitForTimeout(80);
      const st = await stepNow(o);
      if (st.step !== "edit" || st.focus !== "ed-copy") o.checks.push(`after the copy: ${JSON.stringify(st)}`);
      const wk = await week(o);
      for (const d of wk) {
        const want = d.d === "fri" ? "2 pm|1 am" : "8 pm|2 am";
        const got = `${d.o.split(" ")[0] === "2:00" ? "2" : d.o.split(" ")[0].replace(":00", "")} ${d.o.split(" ")[1]}|${d.c.split(" ")[0].replace(":00", "")} ${d.c.split(" ")[1]}`;
        if (got !== want) o.checks.push(`${d.d} after the copy: ${d.o} / ${d.c}`);
      }
      const cols = await colGeom(o);
      const moveX = Math.max(...cols.map((c, i) => Math.max(Math.abs(c[1] - colsBefore[i][1]), Math.abs(c[2] - colsBefore[i][2]))));
      if (moveX > 0.01) o.checks.push(`the columns moved ${moveX}px after the copy`);
      const afterBoxes = await cardBoxes(o.page);
      if (moved(before, afterBoxes)) o.checks.push("the page behind moved during the copy");
      o.notes.colsMoved = moveX;
      o.notes.said = await o.page.evaluate(() => document.querySelector("#say").textContent);
      if (o.notes.said !== t.said) o.checks.push(`said «${o.notes.said}»`);
      if (ph) await o.page.screenshot({ path: path(n2) }); else await shotPanel(o, n2);
      await FRI(o);
      await leave(o);
      await tapOrClick(o, "#ed-hours .ed-save", ph); await o.page.waitForTimeout(100);
      await checkConfirm(o, "hours", ph);
      if (ph) await o.page.screenshot({ path: path(n3) }); else await shotPanel(o, n3);
      await finish(n1, o);
      await o.context.close();
    }
    // ---- 6-07 no tick, 6-08 a refused week, 6-09 every day closed, 6-10 Friday closed, 6-11 / 6-12 the keyboard's rings, 6-13 the source changed
    const singles = [
      ["07", "copy-none", "", async (o) => {
        await hoursOpen(o, false); await o.page.click("#ed-copy"); await o.page.waitForTimeout(60); await hold(o);
        for (const d of ["mon", "tue", "wed", "thu", "fri", "sat"]) await o.page.click(`.cp-row[data-day="${d}"]`);
        await hold(o); await o.page.click("#st-hours .st-do"); await o.page.waitForTimeout(80);
        const r = await o.page.evaluate(() => ({ err: document.querySelector("#cp-err").hidden ? "" : document.querySelector("#cp-err").textContent, focus: document.activeElement.id, d: document.activeElement.getAttribute("aria-describedby"), step: window.__settings.step }));
        o.notes.none = r;
        if (r.err !== t.none || r.focus !== "cp-mon" || !String(r.d).startsWith("cp-err") || r.step !== "copy") o.checks.push(`no tick: ${JSON.stringify(r)}`);
      }],
      ["08", "copy-invalid-week", "", async (o) => {
        await hoursOpen(o, false); await fill(o, "#ed-sun-open", "25"); await o.page.click("#ed-copy"); await o.page.waitForTimeout(80);
        const r = await o.page.evaluate(() => ({ err: document.querySelector("#ed-sun-err").hidden ? "" : document.querySelector("#ed-sun-err").textContent.trim(), focus: document.activeElement.id, step: window.__settings.step }));
        o.notes.invalid = r;
        if (r.err !== t.bad || r.focus !== "ed-sun-open" || r.step !== "edit") o.checks.push(`refused week: ${JSON.stringify(r)}`);
      }],
      ["09", "copy-every-day-closed", "case=closed", async (o) => {
        await hoursOpen(o, false);
        const before = await stepNow(o);
        const dis = await o.page.evaluate(() => document.querySelector("#ed-copy").getAttribute("aria-disabled"));
        await o.page.click("#ed-copy", { force: true }); await o.page.waitForTimeout(80);
        o.notes.closed = { dis, before, after: await stepNow(o) };
        if (dis !== "true" || (await stepNow(o)).step !== "edit") o.checks.push(`every day closed: ${JSON.stringify(o.notes.closed)}`);
      }],
      ["10", "copy-friday-closed", "case=friday", async (o) => {
        await hoursOpen(o, false); await o.page.click("#ed-copy"); await o.page.waitForTimeout(80);
        const r = await o.page.evaluate(() => ({ opts: [...document.querySelectorAll("#cp-src option")].map((x) => x.value).join(","), fri: { on: document.querySelector("#cp-fri").checked, closed: document.querySelector('.cp-row[data-day="fri"] .cp-closed')?.textContent } }));
        o.notes.fridayClosed = r;
        if (r.opts !== "sun,mon,tue,wed,thu,sat" || r.fri.on || r.fri.closed !== t.closed) o.checks.push(`Friday closed: ${JSON.stringify(r)}`);
      }],
      ["11", "tool-keyboard-ring", "", async (o) => {
        await hoursOpen(o, false);
        await o.page.focus("#ed-sat-close-ap"); await o.page.keyboard.press("Tab"); await o.page.waitForTimeout(60);
        const r = await o.page.evaluate(() => { const b = document.querySelector("#ed-copy"), c = getComputedStyle(b), body = document.querySelector("#ed-hours .dlg-body").getBoundingClientRect(), bb = b.getBoundingClientRect(); return { focus: document.activeElement === b, ring: c.outlineStyle + " " + c.outlineWidth, offset: c.outlineOffset, inside: bb.top >= body.top && bb.bottom <= body.bottom && bb.left >= body.left && bb.right <= body.right, h: bb.height }; });
        o.notes.ring = r;
        if (!r.focus || r.offset !== "-2px" || r.ring !== "solid 2px" || !r.inside || Math.abs(r.h - 44) > 0.01) o.checks.push(`the tool's ring: ${JSON.stringify(r)}`);
      }],
      ["12", "box-keyboard-ring", "", async (o) => {
        await hoursOpen(o, false);
        await o.page.focus("#ed-copy"); await o.page.keyboard.press("Enter"); await o.page.waitForTimeout(80);
        await o.page.keyboard.press("Tab"); await o.page.keyboard.press("Tab"); await o.page.keyboard.press("Space"); await o.page.waitForTimeout(40);
        const r = await o.page.evaluate(() => ({ focus: document.activeElement.id, tue: document.querySelector("#cp-tue")?.checked, ring: getComputedStyle(document.querySelector('.cp-row[data-day="tue"] .cp-box')).outlineWidth }));
        o.notes.boxRing = r;
        if (r.focus !== "cp-tue" || r.tue !== false || r.ring !== "2px") o.checks.push(`a box's ring: ${JSON.stringify(r)}`);
      }],
      ["13", "copy-source-monday", "", async (o) => {
        await hoursOpen(o, false); await o.page.click("#ed-copy"); await o.page.waitForTimeout(60); await hold(o);
        await o.page.click('.cp-row[data-day="fri"]');
        await o.page.selectOption("#cp-src", "mon"); await o.page.waitForTimeout(40);
        const r = await o.page.evaluate(() => [...document.querySelectorAll(".cp-chk")].map((c) => c.value + ":" + c.checked).join(","));
        if (r !== "sun:true,tue:true,wed:true,thu:true,fri:false,sat:true") o.checks.push(`source Monday: ${r}`);
      }],
    ];
    for (const [nn, what, extra, act] of singles) {
      const name = frameName(`6-${nn}`, what, 1440, lang);
      if (!wanted(name)) continue;
      const o = await open(q(extra), { width: 1440, height: 900 });
      await act(o);
      await shotPanel(o, name);
      await finish(name, o);
      await o.context.close();
    }
  }

  /* ---- 6-20.. the acceptance checks of OWN-S28 (no frames) */
  if (want(6) && wanted("6-20")) {
    // 1, 2: the tool's geometry at 1440 and 390 and the window's height, 1024 unscrolled
    for (const [w, h, ph] of [[1440, 900, false], [390, 844, true], [1024, 768, false]]) {
      const o = await open(q(), { width: w, height: h });
      await hoursOpen(o, ph);
      const g = await o.page.evaluate((rtl) => {
        const r = (s) => document.querySelector(s).getBoundingClientRect(), edge = (b) => (rtl ? b.right : b.left);
        const body = document.querySelector("#ed-hours .dlg-body");
        return { block: r(".ed-copy").height, btn: r("#ed-copy").height, words: edge(document.querySelector("#ed-copy > svg").getBoundingClientRect()), day: edge(r("#ed-sun-name")), gap: r(".ed-copy").top - r("#ed-sat").bottom, body: body.getBoundingClientRect().height, scroll: body.scrollHeight - body.clientHeight, panel: r("#ed-hours").height, tf: [...document.querySelectorAll("#ed-hours .tf")].map((e) => +e.getBoundingClientRect().width.toFixed(2)) };
      }, rtl);
      o.notes.tool = g;
      if (Math.abs(g.block - 57) > 0.01 || Math.abs(g.btn - 44) > 0.01 || Math.abs(g.words - g.day) > 0.5 || Math.abs(g.gap) > 0.01) o.checks.push(`the tool: ${JSON.stringify(g)}`);
      if (g.scroll > 1) o.checks.push(`the hours window scrolls ${g.scroll}px at ${w}`);
      if (lang === "ar" && w === 1440 && Math.abs(g.body - 494) > 0.5) o.checks.push(`body ${g.body}, not 494`);
      if (lang === "ar" && w === 390 && (Math.abs(g.body - 634) > 0.5 || Math.abs(g.panel - 775) > 0.5)) o.checks.push(`sheet ${g.panel} / body ${g.body}, not 775 / 634`);
      const widths = new Set(g.tf);
      if (widths.size !== 1) o.checks.push(`time fields differ: ${[...widths].join(", ")}`);
      const want = (w > 720 ? (rtl ? 125.92 : 128.03) : (rtl ? 113.92 : 116.03));
      if (Math.abs(g.tf[0] - want) > 0.05) o.checks.push(`time field ${g.tf[0]}, not ${want}`);
      await finish(frameName("6-20", `tool-geometry-${w}`, "", lang), o);
      await o.context.close();
    }
    // 3, 4, 6, 13, 15, 17: opens in the same dialog, focus, rows and edges, ways out, motion
    for (const [w, h, ph] of [[1440, 900, false], [390, 844, true]]) {
      const o = await open(q(), { width: w, height: h });
      await hoursOpen(o, ph);
      const boxes0 = await cardBoxes(o.page);
      const dlg0 = await o.page.evaluate(() => { window.__d = document.querySelector("dialog[open]"); window.__sc = document.querySelector("dialog[open] .dlg-scrim"); return window.__d.id; });
      await tapOrClick(o, "#ed-copy", ph);
      const anim = await noAnim(o);
      await o.page.waitForTimeout(60);
      const r = await o.page.evaluate(() => ({ same: document.querySelector("dialog[open]") === window.__d && document.querySelector("dialog[open] .dlg-scrim") === window.__sc, edHidden: document.querySelector("#ed-hours").hidden && document.querySelector("#ed-hours").isConnected, step: window.__settings.step, w: document.querySelector("#st-hours").getBoundingClientRect().width, h: document.querySelector("#st-hours").getBoundingClientRect().height, focus: document.activeElement.id, scroll: document.querySelector("#st-hours .dlg-body").scrollHeight - document.querySelector("#st-hours .dlg-body").clientHeight }));
      o.notes.open = { ...r, anim };
      if (!r.same || !r.edHidden || r.step !== "copy" || (!ph && Math.abs(r.w - 520) > 0.5)) o.checks.push(`the step: ${JSON.stringify(r)}`);
      if (r.focus !== (ph ? "st-hours-title" : "cp-src")) o.checks.push(`step focus ${r.focus}`);
      if (anim) o.checks.push(`${anim} animations running as the step opened (reduced motion)`);
      if (!ph && Math.abs(r.h - 593) > 0.5) o.checks.push(`step ${r.h} tall, not 593`);
      if (ph && lang === "ar" && Math.abs(r.h - 568) > 0.5) o.checks.push(`sheet ${r.h} tall, not 568`);
      if (r.scroll > 1) o.checks.push(`the step scrolls ${r.scroll}px`);
      const e = await o.page.evaluate((rtl) => {
        const edge = (b) => (rtl ? b.right : b.left), rows = [...document.querySelectorAll(".cp-row")];
        const src = edge(document.querySelector(".cp-rng").getBoundingClientRect());
        const opens = rows.map((x) => x.querySelector(".v-od")).filter(Boolean).map((x) => edge(x.getBoundingClientRect()));
        const closes = rows.map((x) => x.querySelector(".cp-c")).filter(Boolean).map((x) => edge(x.getBoundingClientRect()));
        return { rows: rows.length, hs: rows.map((x) => +x.getBoundingClientRect().height.toFixed(2)), src, openSpread: Math.max(...opens.map((v) => Math.abs(v - src))), closeSpread: Math.max(...closes) - Math.min(...closes), closeEdge: closes[0] };
      }, rtl);
      o.notes.edges = e;
      if (e.rows !== 6 || e.hs.some((x) => Math.abs(x - 48) > 0.01) || e.openSpread > 0.01 || e.closeSpread > 0.01) o.checks.push(`rows/edges: ${JSON.stringify(e)}`);
      if (w === 1440 && e.src !== (rtl ? 811.5 : 613.5)) o.checks.push(`source edge ${e.src}, not ${rtl ? 811.5 : 613.5}`);
      // 13: Escape and «رجوع» return, Tab stays inside, a scrim tap does nothing, Enter on a box copies
      await o.page.keyboard.press("Escape"); await o.page.waitForTimeout(60);
      let s = await stepNow(o);
      if (s.step !== "edit" || s.focus !== "ed-copy") o.checks.push(`Escape: ${JSON.stringify(s)}`);
      if ((await noAnim(o)) !== 0) o.checks.push("animations running as the step returned");
      await tapOrClick(o, "#ed-copy", ph); await o.page.waitForTimeout(60);
      await hold(o); await tapOrClick(o, "#st-hours .st-back", ph); await o.page.waitForTimeout(60);
      s = await stepNow(o);
      if (s.step !== "edit" || s.focus !== "ed-copy" || (await o.page.evaluate(() => window.__settings.dirty()))) o.checks.push(`رجوع: ${JSON.stringify(s)}`);
      await tapOrClick(o, "#ed-copy", ph); await o.page.waitForTimeout(60);
      if (!ph) {
        await o.page.mouse.click(40, 860); await o.page.waitForTimeout(60);
        if ((await stepNow(o)).step !== "copy") o.checks.push("a scrim tap left the step");
        const inside = [];
        for (let i = 0; i < 12; i++) { await o.page.keyboard.press("Tab"); inside.push(await o.page.evaluate(() => !!document.activeElement.closest("#st-hours"))); }
        for (let i = 0; i < 14; i++) { await o.page.keyboard.press("Shift+Tab"); inside.push(await o.page.evaluate(() => !!document.activeElement.closest("#st-hours"))); }
        if (inside.includes(false)) o.checks.push("Tab left the step");
      }
      // Enter on a box copies
      await o.page.focus("#cp-mon"); await o.page.keyboard.press("Enter"); await o.page.waitForTimeout(80);
      s = await stepNow(o);
      if (s.step !== "edit") o.checks.push(`Enter on a box: ${JSON.stringify(s)}`);
      if (!ph) {
        // Enter on the list field copies too
        await o.page.click("#ed-copy"); await o.page.waitForTimeout(60); await hold(o); await o.page.focus("#cp-src"); await o.page.keyboard.press("Enter"); await o.page.waitForTimeout(80);
        if ((await stepNow(o)).step !== "edit") o.checks.push("Enter on the list field did not copy");
      }
      if (moved(boxes0, await cardBoxes(o.page))) o.checks.push("the page behind moved");
      await finish(frameName("6-21", `step-behaviour-${w}`, "", lang), o);
      await o.context.close();
    }
    // 13: the close button (nothing typed closes; typed asks, «متابعة التعديل» returns to the tool)
    {
      const o = await open(q(), { width: 1440, height: 900 });
      await hoursOpen(o, false); await o.page.click("#ed-copy"); await o.page.waitForTimeout(60); await hold(o);
      await hold(o); await o.page.click("#st-hours .dlg-x"); await o.page.waitForTimeout(80);
      if (await o.page.evaluate(() => !!document.querySelector("dialog[open]"))) o.checks.push("the close button did not close an untouched window from the step");
      await hoursOpen(o, false); await fill(o, "#ed-mon-open", "7"); await leave(o);
      await o.page.click("#ed-copy"); await o.page.waitForTimeout(60); await hold(o);
      await hold(o); await o.page.click("#st-hours .dlg-x"); await o.page.waitForTimeout(80);
      let s = await stepNow(o);
      if (s.step !== "discard") o.checks.push(`the close button with something typed: ${s.step}`);
      await hold(o); await o.page.click("#st-hours .st-back"); await o.page.waitForTimeout(80);
      s = await stepNow(o);
      if (s.step !== "edit" || s.focus !== "ed-copy") o.checks.push(`متابعة التعديل: ${JSON.stringify(s)}`);
      await finish(frameName("6-22", "step-close", "", lang), o);
      await o.context.close();
    }
    // 5: the first choice, 11 (also in 6-08), 10, 7, 8, 9: the source, no tick, source change, the copy and the columns
    {
      const o = await open(q(), { width: 1440, height: 900 });
      await hoursOpen(o, false);
      await o.page.click("#ed-copy"); await o.page.waitForTimeout(60); await hold(o);
      const a = await o.page.evaluate(() => ({ opts: [...document.querySelectorAll("#cp-src option")].map((x) => x.value).join(","), sel: document.querySelector("#cp-src").value }));
      if (a.opts !== "sun,mon,tue,wed,thu,fri,sat" || a.sel !== "sun") o.checks.push(`untouched: ${JSON.stringify(a)}`);
      await o.page.keyboard.press("Escape"); await o.page.waitForTimeout(60);
      await fill(o, "#ed-fri-open", "5"); await o.page.click("#ed-copy"); await o.page.waitForTimeout(60); await hold(o);
      const b = await o.page.evaluate(() => document.querySelector("#cp-src").value);
      if (b !== "fri") o.checks.push(`typed in Friday: ${b}`);
      await finish(frameName("6-23", "first-choice", "", lang), o);
      await o.context.close();
    }
    {
      const o = await open(q(), { width: 1440, height: 900 });
      await hoursOpen(o, false); await o.page.click("#ed-copy"); await o.page.waitForTimeout(60); await hold(o);
      // 10: one tick after none leaves the refusal
      for (const d of ["mon", "tue", "wed", "thu", "fri", "sat"]) await o.page.click(`.cp-row[data-day="${d}"]`);
      await hold(o); await o.page.click("#st-hours .st-do"); await o.page.waitForTimeout(60);
      await o.page.click('.cp-row[data-day="sat"]'); await o.page.waitForTimeout(60);
      const r = await o.page.evaluate(() => ({ hidden: document.querySelector("#cp-err").hidden, d: document.querySelector("#cp-mon").getAttribute("aria-describedby") }));
      if (!r.hidden || String(r.d).includes("cp-err")) o.checks.push(`a tick after no tick: ${JSON.stringify(r)}`);
      await finish(frameName("6-24", "tick-clears-refusal", "", lang), o);
      await o.context.close();
    }
    {
      // 8, 9, 14: the Ramadan flow: copy, Friday typed, «حفظ», the confirmation's four lines, the record
      const o = await open(q(), { width: 1440, height: 900 });
      await hoursOpen(o, false);
      const v0 = await o.page.evaluate(() => window.__settings.version);
      await SUN(o); await leave(o);
      const cols0 = await colGeom(o);
      await o.page.click("#ed-copy"); await o.page.waitForTimeout(60); await hold(o);
      await o.page.click('.cp-row[data-day="fri"]');
      await hold(o); await o.page.click("#st-hours .st-do"); await o.page.waitForTimeout(100);
      const wk = await week(o), s = await stepNow(o);
      const exp = wk.every((d) => (d.d === "fri" ? d.o === "2:00 pm" && d.c === "1:00 am" : d.o === "8:00 pm" && d.c === "2:00 am"));
      if (!exp || s.focus !== "ed-copy") o.checks.push(`the copy: ${JSON.stringify(wk)} ${JSON.stringify(s)}`);
      const w1 = await o.page.evaluate(() => [...document.querySelectorAll("#ed-hours .tf")].map((e) => +e.getBoundingClientRect().width.toFixed(2)));
      if (new Set(w1).size !== 1) o.checks.push(`widths after: ${[...new Set(w1)].join(",")}`);
      const cols1 = await colGeom(o);
      o.notes.colsDiff = Math.max(...cols1.map((c, i) => Math.abs(c[1] - cols0[i][1])));
      await FRI(o); await leave(o);
      await o.page.click("#ed-hours .ed-save"); await o.page.waitForTimeout(100);
      const cf = await o.page.evaluate(() => ({ title: document.querySelector("#st-hours-title").textContent.trim(), step: window.__settings.step, whats: [...document.querySelectorAll("#st-hours .cf-list:not(.cf-ppl) > .cf-row")].map((li) => li.querySelector(".cf-what").textContent.trim()), said: [...document.querySelectorAll("#st-hours .cf-list:not(.cf-ppl) > .cf-row .sr-only")].map((x) => x.textContent.trim()), ver: window.__settings.version }));
      o.notes.confirm4 = cf;
      if (cf.title !== t.confirm || cf.step !== "confirm" || cf.whats.join("|") !== t.whats.join("|") || cf.ver !== v0) o.checks.push(`the confirmation: ${JSON.stringify(cf)}`);
      await fill(o, "#st-hours-reason", t.why);
      await applyNow(o, "hours", false);
      const rec = await o.page.evaluate(() => { const li = document.querySelector("#card-log .log-rec"); return { what: li.querySelector(".log-what").textContent.replace(/\s+/g, " ").trim(), short: li.classList.contains("is-short"), folded: li.classList.contains("is-folded"), ver: window.__settings.version, v: li.dataset.v }; });
      o.notes.record = rec;
      if (rec.what !== t.rec || !rec.folded || rec.ver !== v0 + 1) o.checks.push(`the record: ${JSON.stringify(rec)}`);
      await o.page.click("#card-log .log-rec:first-child .log-open"); await o.page.waitForTimeout(100);
      const said2 = await o.page.evaluate(() => [...document.querySelectorAll("#dlg-rec .cf-row:not(.is-why) .sr-only")].map((x) => x.textContent.trim()));
      if (said2.join("|") !== cf.said.join("|")) o.checks.push(`the record's window lists ${JSON.stringify(said2)} not ${JSON.stringify(cf.said)}`);
      await finish(frameName("6-25", "ramadan-flow", "", lang), o);
      await o.context.close();
    }
    // 13 (the hold): a double press of the tool at 390 and 320 leaves Saturday's box ticked (the second tap lands on its row,
    // within the step's 500 ms), and a tap after the hold toggles it; at 320 × 568 the step and the editor scroll
    for (const [w, h] of [[390, 844], [320, 568]]) {
      const o = await open(q(), { width: w, height: h });
      await hoursOpen(o, true);
      await o.page.evaluate(() => { const b = document.querySelector("#ed-hours .dlg-body"); b.scrollTop = b.scrollHeight; });
      const ed = await o.page.evaluate(() => { const b = document.querySelector("#ed-hours .dlg-body"); return b.scrollHeight - b.clientHeight; });
      const r = await o.page.evaluate(() => { const b = document.querySelector("#ed-copy").getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
      await o.page.touchscreen.tap(r.x, r.y); await o.page.waitForTimeout(90); await o.page.touchscreen.tap(r.x, r.y); await o.page.waitForTimeout(150);
      const a = await o.page.evaluate(() => ({ step: window.__settings.step, ticks: [...document.querySelectorAll(".cp-chk")].map((c) => c.checked).join(",") }));
      const stepScroll = await o.page.evaluate(() => { const b = document.querySelector("#st-hours .dlg-body"); return b.scrollHeight - b.clientHeight; });
      o.notes.doublePress = { ...a, editorScroll: ed, stepScroll };
      if (a.step !== "copy" || a.ticks !== "true,true,true,true,true,true") o.checks.push(`a double press of the tool: ${JSON.stringify(a)}`);
      await hold(o);
      await o.page.evaluate(() => { const b = document.querySelector("#st-hours .dlg-body"); b.scrollTop = 0; });
      await o.page.tap('.cp-row[data-day="mon"]'); await o.page.waitForTimeout(60);
      if (await o.page.evaluate(() => document.querySelector("#cp-mon").checked)) o.checks.push("a tap after the hold did not toggle its box");
      await finish(frameName("6-27", `double-press-${w}`, "", lang), o);
      await o.context.close();
    }
    // 11 (as 6-08), 12 (as 6-09): done in the frames. 16: forced colours
    {
      const o = await open(q(), { width: 1440, height: 900 });
      await o.page.emulateMedia({ forcedColors: "active" });
      await hoursOpen(o, false); await o.page.click("#ed-copy"); await o.page.waitForTimeout(60); await hold(o);
      await o.page.click('.cp-row[data-day="fri"]'); await o.page.waitForTimeout(40);
      const r = await o.page.evaluate(() => {
        const probe = (c) => { const p = document.createElement("i"); p.style.color = c; document.body.appendChild(p); const v = getComputedStyle(p).color; p.remove(); return v; };
        const on = getComputedStyle(document.querySelector('.cp-row[data-day="mon"] .cp-box')), off = getComputedStyle(document.querySelector('.cp-row[data-day="fri"] .cp-box'));
        return { onBg: on.backgroundColor, offBg: off.backgroundColor, canvas: probe("Canvas"), text: probe("CanvasText"), frame: getComputedStyle(document.querySelector(".cp-sel")).borderTopColor, selOpacity: getComputedStyle(document.querySelector("#cp-src")).opacity };
      });
      o.notes.forced = r;
      if (r.onBg !== r.text || r.offBg !== r.canvas || r.frame !== r.text || r.selOpacity !== "0") o.checks.push(`forced colours: ${JSON.stringify(r)}`);
      await finish(frameName("6-26", "forced-colours", "", lang), o);
      await o.context.close();
    }
  }

  /* ---- 6-30.. the phone's history (OWN-S29) */
  if (want(6) && wanted("6-30")) {
    // 18: the page at 390 x 844, the cards' boxes and records; the link stays (the coordinator's departure), so every top
    // is the spec's plus the link's block.
    {
      const o = await open(q(), { width: 390, height: 844 });
      const g = await o.page.evaluate(() => {
        const b = (s) => { const r = document.querySelector(s).getBoundingClientRect(); return [+(r.top + scrollY).toFixed(2), +r.height.toFixed(2)]; };
        return { link: !!document.querySelector("#history-link"), cards: ["crowd", "hours", "day", "log"].map((k) => b(`#card-${k}`)), recs: [...document.querySelectorAll("#card-log .log-rec")].map((li) => { const r = li.getBoundingClientRect(); return [+(r.top + scrollY).toFixed(2), +r.height.toFixed(2)]; }), page: document.documentElement.scrollHeight, folded: document.querySelectorAll("#card-log .log-rec.is-folded").length };
      });
      o.notes.phone = g;
      const dy = g.cards[0][0] - 84;
      const wantC = [[84, 395], [495, 370], [881, 256], [1153, 375]];
      g.cards.forEach((c, i) => { if (Math.abs(c[0] - dy - wantC[i][0]) > 0.5 || Math.abs(c[1] - wantC[i][1]) > 0.5) o.checks.push(`card ${i}: ${c} (link offset ${dy}), want ${wantC[i]}`); });
      g.recs.forEach((r, i) => { if (Math.abs(r[1] - 99) > 0.01 || Math.abs(r[0] - dy - [1226, 1325, 1424][i]) > 0.5) o.checks.push(`record ${i}: ${r}`); });
      if (Math.abs(g.page - dy - 1654) > 1) o.checks.push(`page ${g.page}, want ${1654 + dy}`);
      if (g.folded) o.checks.push(`${g.folded} records fold at 390 by default`);
      await finish(frameName("6-30", "phone-geometry", 390, lang), o);
      await o.context.close();
    }
    // 19: loading and arrived give the same boxes, at 390, 320 and 1440, for each history
    for (const [w, h] of [[390, 844], [320, 568], [1440, 900]]) {
      for (const hist of ["", "log=week", "log=none", "log=one"]) {
        const o = await open(q(`state=loading${hist ? `&${hist}` : ""}`), { width: w, height: h });
        const grab = () => o.page.evaluate(() => {
          const b = (e) => { const r = e.getBoundingClientRect(); return [+(r.left + scrollX).toFixed(2), +(r.top + scrollY).toFixed(2), +r.width.toFixed(2), +r.height.toFixed(2)]; };
          const out = {};
          ["crowd", "hours", "day", "log"].forEach((k) => { out["card-" + k] = b(document.querySelector(`#card-${k}`)); });
          out.title = b(document.querySelector("#log-title")); out.all = b(document.querySelector("#log-all")); out.box = b(document.querySelector("#card-log .log-box"));
          [...document.querySelectorAll("#card-log .log-rec")].forEach((li, i) => { out["rec" + i] = b(li); });
          out.page = [document.documentElement.scrollHeight];
          return out;
        });
        await o.page.waitForTimeout(700);
        const a = await grab();
        await o.page.evaluate(() => window.__settings.arrive()); await o.page.waitForTimeout(200);
        const z = await grab();
        const n = Math.min(...[a, z].map((x) => Object.keys(x).filter((k) => k.startsWith("rec")).length));
        let worst = 0;
        for (const k of Object.keys(a)) { if (k.startsWith("rec") && !z[k]) continue; if (!z[k]) continue; worst = Math.max(worst, ...a[k].map((v, i) => Math.abs(v - z[k][i]))); }
        const cls = await o.page.evaluate(() => +window.__cls.toFixed(5));
        o.notes.arrival = { worst, cls, recs: n, log: z["card-log"] };
        if (worst > 0.5) o.checks.push(`loading → arrived moved ${worst}px (${w}, ${hist || "default"})`);
        if (cls > 0) o.checks.push(`layout shift ${cls} on arrival (${w}, ${hist || "default"})`);
        if (w === 320 && lang === "ar" && !hist) o.notes.at320 = { card: z["card-log"], recs: [a.rec0?.[1], a.rec1?.[1], a.rec2?.[1]] };
        await finish(frameName("6-31", `arrival-${hist || "default"}`, w, lang), o);
        await o.context.close();
      }
    }
    // 20: default folds nothing at 390; log=week folds the first short; a tap opens the sheet, focus on its title, unscrolled; Escape returns
    {
      const o = await open(q("log=week"), { width: 390, height: 844 });
      const f = await o.page.evaluate(() => { const li = document.querySelector("#card-log .log-rec"); return { short: li.classList.contains("is-short"), chev: !li.querySelector(".log-open").hidden }; });
      if (!f.short || !f.chev) o.checks.push(`log=week: ${JSON.stringify(f)}`);
      await o.page.locator("#card-log .log-rec .log-open").first().scrollIntoViewIfNeeded();
      await o.page.tap("#card-log .log-rec .log-open"); await o.page.waitForTimeout(120);
      const r = await o.page.evaluate(() => { const d = document.querySelector("#dlg-rec"), p = d.querySelector(".dlg-panel").getBoundingClientRect(), b = d.querySelector(".dlg-body"); return { open: d.open, focus: document.activeElement.id, body: b.clientHeight, scroll: b.scrollHeight - b.clientHeight, sheet: Math.abs(p.bottom - innerHeight) < 1 && Math.abs(p.width - innerWidth) < 1 }; });
      o.notes.sheet = r;
      if (!r.open || r.focus !== "rec-title" || r.scroll > 1 || !r.sheet || (lang === "ar" && Math.abs(r.body - 662) > 1)) o.checks.push(`the record sheet: ${JSON.stringify(r)}`);
      await o.page.keyboard.press("Escape"); await o.page.waitForTimeout(100);
      if (!(await o.page.evaluate(() => !document.querySelector("#dlg-rec").open && document.activeElement?.matches(".log-open")))) o.checks.push("Escape did not return focus to the record's control");
      await finish(frameName("6-32", "record-sheet-from-card", 390, lang), o);
      await o.context.close();
    }
    // 21: a record without a reason (case=low) puts who and when 39 px below its top, the third line empty, 99 px each
    {
      const o = await open(q("case=low"), { width: 390, height: 844 });
      const r = await o.page.evaluate(() => { const li = document.querySelector("#card-log .log-rec"), m = li.querySelector(".log-meta").getBoundingClientRect(), t = li.getBoundingClientRect(); return { y: +(m.top - t.top).toFixed(2), hs: [...document.querySelectorAll("#card-log .log-rec")].map((x) => +x.getBoundingClientRect().height.toFixed(2)), why: !!li.querySelector(".log-why") }; });
      o.notes.noReason = r;
      if (r.why || Math.abs(r.y - 39) > 0.5 || r.hs.some((x) => Math.abs(x - 99) > 0.01)) o.checks.push(`no reason: ${JSON.stringify(r)}`);
      await finish(frameName("6-33", "no-reason", 390, lang), o);
      await o.context.close();
    }
    // 22: from 721 px nothing moved
    for (const [w, h, page] of [[1440, 900, 900], [1024, 768, 891], [768, 1024, 1663]]) {
      const o = await open(q(), { width: w, height: h });
      const r = await o.page.evaluate(() => ({ page: document.documentElement.scrollHeight, log: document.querySelector("#card-log").getBoundingClientRect().height, recs: [...document.querySelectorAll("#card-log .log-rec")].map((x) => +x.getBoundingClientRect().height.toFixed(2)), rows: ["#card-crowd", "#card-day"].map((s) => +document.querySelector(s).getBoundingClientRect().height.toFixed(2)) }));
      o.notes.wide = r;
      if (r.page !== page || Math.abs(r.log - 313) > 0.01 || r.recs.some((x) => Math.abs(x - 73) > 0.01)) o.checks.push(`${w}: ${JSON.stringify(r)}`);
      await finish(frameName("6-34", "wide-unchanged", w, lang), o);
      await o.context.close();
    }
  }
}

await writeFile(join(OUT, "settings-log.json"), JSON.stringify(log, null, 2));
await browser.close();
server.close();
console.log(log.failures.length ? `FAIL ${log.failures.length}\n${log.failures.join("\n")}` : `OK ${Object.keys(log.frames).length} frames`);
process.exit(log.failures.length ? 1 : 0);
