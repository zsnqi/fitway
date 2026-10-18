// Eclipse Settings capture (DECISIONS items 49, 77-79). Serves this folder on 127.0.0.1 (port 3190 unless --port=N;
// other rounds hold 3173-3189), renders the Settings frames with the worktree's Playwright chromium (a fresh context
// per frame, reduced motion; 720 px and below a touch phone with overlay scrollbars), checks each one, and writes them
// numbered the same way in both languages. It never writes into this repository: the output folder is required and
// must be outside it.
//   node design-research/owner-composition-exploration-r04/directions/eclipse/settings-capture.mjs <outDir> [--port=3190] [--only=1,2,3,4,5] [--lang=ar|en] [--match=<part of a frame's name>]
// Writes <outDir>/crops/<n>-<nn>-<what>-<size>-<lang>.png and <outDir>/settings-log.json:
//   1-  the page at rest: 1440 x 900 and 390 x 844 (the first screen and the whole page), 1024 x 768 and 768 x 1024
//       (the first screen); each part of the sheet and the history at 1440, cropped with a strip of its neighbours;
//       each of the phone's three cards at 390
//   2-  (part 2) each value in edit; 3- (part 3) each state; 4- (part 3) the range cases; 5- the phone's flows
// It exits 1 if a check fails: a console message or page error, a font file fetched twice in one load, a request off
// the page's origin, a layout shift after the first paint, a sideways page scroll, an element outside the viewport's
// width, a box whose content spills, an interactive target under 44 px, the sheet and the history not starting on one
// line or not ending on one edge from 1024 px, or a level's people that differ from bandFor's counting
// (packages/api/src/occupancy/bands.ts) for any capacity and limits the check draws.
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
  for (const el of document.querySelectorAll(".head, .set-tools, .set-grid, .set-sheet, .set-sec, .set-head, .set-title, .set-dl, .set-row, .set-row > dt, .set-row > dd, .set-panel, .log-head, .log-list, .log-rec, .log-body, .log-chgs, .log-why, .log-meta, .dlg-panel, .dlg-head, .dlg-foot, .alert")) {
    if (el.closest("[hidden], dialog:not([open])")) continue;
    if (getComputedStyle(el).display === "none" || !el.getClientRects().length) continue;
    // «عرض الكل» reaches 12 px past its words into the card's padding (Access's link), by design.
    const allow = el.matches(".log-head") ? 12 : 0;
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
    const sizes = [["01", "rest", 1440, 900, false], ["02", "rest-whole", 1440, 900, true], ["03", "rest", 390, 844, false], ["04", "rest-whole", 390, 844, true], ["05", "rest", 1024, 768, false], ["06", "rest", 768, 1024, false]];
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
      // From 1024 px the sheet and the history start on one line and end on one edge.
      if (w >= 1024) {
        const [s, p] = [await box(o.page, "#sheet"), await box(o.page, "#panel")];
        if (Math.abs(s.y - p.y) > 0.5) o.checks.push(`sheet and history start ${s.y} / ${p.y}`);
        if (Math.abs(s.y + s.h - (p.y + p.h)) > 0.5) o.checks.push(`sheet and history end ${s.y + s.h} / ${p.y + p.h}`);
        o.notes.sheet = s; o.notes.panel = p;
      }
      o.notes.pageHeight = await o.page.evaluate(() => document.documentElement.scrollHeight);
      // Every value starts on one edge across the sheet's three parts (the label column, --lab).
      o.notes.valueStarts = await o.page.evaluate((rtl) => [...new Set([...document.querySelectorAll(".set-row > dd")].map((d) => Math.round(rtl ? d.getBoundingClientRect().right : d.getBoundingClientRect().left)))], lang === "ar");
      if (o.notes.valueStarts.length > 1) o.checks.push(`values start on ${o.notes.valueStarts.length} edges: ${o.notes.valueStarts.join(", ")}`);
      await finish(name, o);
      await o.context.close();
    }
    // Each part at 1440 with a strip of its neighbours, and each of the phone's cards.
    const parts = [["07", "crowd", "#sec-crowd"], ["08", "hours", "#sec-hours"], ["09", "business-day", "#sec-day"], ["10", "history", "#panel"]];
    {
      const o = await open(q(), { width: 1440, height: 900 });
      for (const [nn, what, sel] of parts) {
        const name = frameName(`1-${nn}`, what, 1440, lang);
        if (wanted(name)) await crop(o.page, sel, path(name), 24);
      }
      await finish(frameName("1-07", "parts", 1440, lang), o);
      await o.context.close();
    }
    {
      const o = await open(q(), { width: 390, height: 844 });
      for (const [nn, what, sel] of [["11", "crowd", "#sec-crowd"], ["12", "hours", "#sec-hours"], ["13", "business-day", "#sec-day"], ["14", "head-and-history-link", ".head"]]) {
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

await writeFile(join(OUT, "settings-log.json"), JSON.stringify(log, null, 2));
await browser.close();
server.close();
console.log(log.failures.length ? `FAIL ${log.failures.length}\n${log.failures.join("\n")}` : `OK ${Object.keys(log.frames).length} frames`);
process.exit(log.failures.length ? 1 : 0);
