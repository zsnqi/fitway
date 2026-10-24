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
// control that leaves its card on any side; a window's title cut with «…» or by a box that clips it; the records' words are measured for spills with that control set aside (its 12 px
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
  // A window's title is never cut: not with «…», and not by a box that clips it (the head, the panel, the window).
  for (const h of document.querySelectorAll("dialog[open] .dlg-head h2")) {
    if (h.closest("[hidden]")) continue;
    for (const el of [h, ...h.querySelectorAll("*")]) {
      if (!el.getClientRects().length) continue;
      const cs = getComputedStyle(el), r = el.getBoundingClientRect();
      if (cs.textOverflow === "ellipsis" && cs.overflowX !== "visible" && el.scrollWidth > el.clientWidth + 0.5) out.push(`a window's title is cut with «…»: ${el.className || el.tagName} by ${el.scrollWidth - el.clientWidth}px`);
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
const press = (o, sel, phone) => (phone ? o.page.tap(sel) : o.page.click(sel));
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
        await o.page.tap(".st-discard"); await o.page.waitForTimeout(80);
        const r = await o.page.evaluate(() => ({ open: !!document.querySelector("dialog[open]"), focus: document.activeElement === document.querySelector('[data-edit="crowd"]'), cap: window.__settings.editable.capacity }));
        if (r.open || !r.focus || r.cap !== 120) o.checks.push(`close without saving: ${JSON.stringify(r)}`);
      }],
      ["12", "crowd-confirm", "", async (o) => { await saveFrom(o, "crowd", CROWD_ONE, true); await checkConfirm(o, "crowd", true); }],
      ["13", "crowd-reason-typed", "", async (o) => { await saveFrom(o, "crowd", CROWD_ONE, true); await o.page.tap("#st-crowd-reason"); await o.page.keyboard.type(WHY[lang]); }],
      ["14", "crowd-working", "hold=1", async (o) => { await saveFrom(o, "crowd", CROWD_ONE, true); await o.page.tap("#st-crowd .st-do"); await o.page.waitForTimeout(120); }],
      ["15", "crowd-done", "", async (o) => { await saveFrom(o, "crowd", CROWD_ONE, true); await applyNow(o, "crowd", true); await checkDone(o, "crowd", 390); }],
      ["16", "hours-confirm", "", async (o) => { await saveFrom(o, "hours", async (x) => { await x.page.tap("#ed-fri-sw"); }, true); await checkConfirm(o, "hours", true); }],
      ["17", "hours-done", "", async (o) => { await saveFrom(o, "hours", async (x) => { await x.page.tap("#ed-fri-sw"); }, true); await applyNow(o, "hours", true); await checkDone(o, "hours", 390); }],
      ["18", "crowd-back-to-editor", "", async (o) => {
        await saveFrom(o, "crowd", CROWD_ONE, true); await o.page.tap("#st-crowd .st-back"); await o.page.waitForTimeout(80);
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

await writeFile(join(OUT, "settings-log.json"), JSON.stringify(log, null, 2));
await browser.close();
server.close();
console.log(log.failures.length ? `FAIL ${log.failures.length}\n${log.failures.join("\n")}` : `OK ${Object.keys(log.frames).length} frames`);
process.exit(log.failures.length ? 1 : 0);
