// Eclipse Activity log capture. Serves this folder on 127.0.0.1 (port 3176 unless --port=N; never 3173, which is
// capture.mjs's, or 3174), renders the Activity log frames with the worktree's Playwright chromium (a fresh context per
// frame, reduced motion), checks each one, and writes them numbered the same way in both languages. It never writes
// into this repository: the output folder is required and must be outside it.
//   node design-research/owner-composition-exploration-r04/directions/eclipse/activity-capture.mjs <outDir> [--port=3176] [--only=1,2,30,7]
// Writes <outDir>/crops/<n>-<nn>-<what>-<size>-<lang>.png and <outDir>/activity-log.json:
//   1-  the page at rest at each designed size (1440 x 900, 768 x 1024, 390 x 844), the first screen and the whole page
//   2-  each state: loading, error (first load) and its retry, filtered-empty, log-empty, "Show older" working and
//       failed, the end line, refresh working and failed, the arrivals from Access and Settings, the date picker, the
//       search open, the resets' kind
//   3-  the range, cropped to the element with a strip of its neighbours, at the three designed sizes; 3-30 the phone's
//       title beside every status on Daily, Reports and Activity log at 320, 360, 390 and 720 (the header cropped)
//   4-  the phone's touch flows, step by step (390 x 844, touch), Reports' custom period included
//   5-  the checked sizes: 320 x 568, 1024 x 768, the 200% zoom of 1440 x 900 (720 x 450 at 2x), and file://
//   7-  the date picker in every state, on Activity log and on Reports' custom period, at 1440, 768, 390 and 320
// It exits 1 if a check fails: a console message or page error, a font file fetched twice in one load, a request off
// the page's origin, a layout shift after the first paint (input-driven shifts excluded), a sideways page scroll, an
// element outside the viewport's width, a box whose content spills, or an interactive target under 44 px.
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_ARG = process.argv.slice(2).find((a) => !a.startsWith("--"));
if (!OUT_ARG) throw new Error("activity-capture.mjs needs an output folder outside the repository");
const OUT = resolve(OUT_ARG);
if ((OUT + sep).toLowerCase().startsWith(resolve(HERE, "../../../..").toLowerCase() + sep)) throw new Error("the output folder must be outside the repository worktree");
const PORT = Number((process.argv.find((a) => a.startsWith("--port=")) || "--port=3176").slice(7));
if (PORT === 3173 || PORT === 3174) throw new Error("port 3173 is capture.mjs's and 3174 is reserved");
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) || "").slice(7).split(",").filter(Boolean);
const want = (n) => !ONLY.length || ONLY.includes(String(n));
const ORIGIN = `http://127.0.0.1:${PORT}`;
const FILE_BASE = pathToFileURL(join(HERE, "activity.html")).href;
const CROPS = join(OUT, "crops");
await mkdir(CROPS, { recursive: true });
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".png": "image/png", ".json": "application/json", ".woff2": "font/woff2" };
const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", ORIGIN);
  const file = normalize(join(HERE, decodeURIComponent(url.pathname === "/" ? "/activity.html" : url.pathname)));
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
    if (r.width && (r.right > vw + 0.5 || r.left < -0.5)) out.push(`outside the viewport: ${el.id ? "#" + el.id : el.className || el.tagName} ${Math.round(r.left)}..${Math.round(r.right)}`);
  }
  for (const el of document.querySelectorAll(".ac-tools, .ac-find-panel, .ac-loaded, .dp-ends, .dp-end, .dp-end-v, .dp-nav, .rec, .rec-main, .rec-what, .rec-fig, .rec-why, .day-h, .ac-tail, .ac-end, .ac-empty, .ac-msg, .head, .dlg-panel, .dlg-foot, .field-row")) {
    if (el.closest("[hidden], dialog:not([open])")) continue;
    if (el.scrollWidth > el.clientWidth + 1) out.push(`spills: ${el.className} by ${el.scrollWidth - el.clientWidth}px`);
  }
  const scope = document.querySelector("dialog[open]") || document;
  for (const el of scope.querySelectorAll("button, a[href], select, input")) {
    if (el.closest("[hidden], .rail, .sr-only") || el.matches(".skip, .rail-item")) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || r.bottom < 0 || r.top > innerHeight) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    const box = el.closest(".ac-sel") ? el.closest(".ac-sel").getBoundingClientRect() : r;
    if (box.height < 43.5 || box.width < 43.5) out.push(`small target: ${el.id ? "#" + el.id : el.className || el.tagName} ${Math.round(box.width)}x${Math.round(box.height)}`);
  }
  return [...new Set(out)].slice(0, 12);
};

async function open(q, { width = 1440, height = 900, scale = 1, phone = false, file = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, isMobile: phone, hasTouch: phone, reducedMotion: "reduce", colorScheme: "dark" });
  await context.addInitScript(INIT);
  const page = await context.newPage();
  const errors = [], fonts = new Map(), off = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => errors.push("console " + m.type() + ": " + m.text()));
  page.on("request", (r) => {
    const u = r.url();
    if (!file && !u.startsWith(ORIGIN) && !u.startsWith("blob:") && !u.startsWith("data:")) off.push(u);
    if (file && !u.startsWith("file:") && !u.startsWith("data:")) off.push(u);
    if (/\/fonts\/[^/?]+\.woff2/.test(u)) fonts.set(u, (fonts.get(u) || 0) + 1);
  });
  const page0 = q.startsWith("index.html") || q.startsWith("reports.html") ? q : `activity.html?${q}`;
  await page.goto(file ? `${FILE_BASE}?${q}` : `${ORIGIN}/${page0}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__activity?.ready === true || window.__reports?.ready === true || window.__eclipse?.ready === true);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(120);
  return { context, page, errors, fonts, off };
}
async function finish(name, o, extra = {}, { problems = true } = {}) {
  const { page, errors, fonts, off } = o;
  const found = problems ? await page.evaluate(PROBLEMS) : [];
  const cls = await page.evaluate(() => +window.__cls.toFixed(5));
  const maxFont = Math.max(0, ...fonts.values());
  const rec = { errors, maxFontFetch: maxFont, offOrigin: off, cls, problems: found, ...extra };
  log.frames[name] = rec;
  const bad = [];
  if (errors.length) bad.push("errors: " + errors.join(" / "));
  if (maxFont > 1) bad.push("font fetched twice");
  if (off.length) bad.push("off-origin request");
  if (cls > 0) bad.push(`layout shift ${cls}`);
  if (found.length) bad.push(found.join("; "));
  if (bad.length) log.failures.push(`${name}: ${bad.join(" | ")}`);
  return rec;
}
const path = (name) => join(CROPS, name + ".png");
const SIZES = { 1440: { width: 1440, height: 900 }, 768: { width: 768, height: 1024 }, 390: { width: 390, height: 844, scale: 2, phone: true } };
const LANGS = ["ar", "en"];
async function shot(name, q, { act, full = false, clip, ...opts } = {}) {
  const o = await open(q, opts);
  if (act) await act(o.page);
  await o.page.waitForTimeout(150);
  const c = typeof clip === "function" ? await clip(o.page) : clip;
  await o.page.screenshot({ path: path(name), fullPage: full, clip: c });
  const rec = await finish(name, o, { q });
  await o.context.close();
  return rec;
}
// A crop of the log around the given records, in page coordinates (so a tall group is never cut at the viewport), with
// the whole record or day heading before and after it as the strip of neighbours.
const around = (sel) => async (page) => page.evaluate((s) => {
  const els = [...document.querySelectorAll(s)];
  if (!els.length) throw new Error("no element for " + s);
  const seq = [...document.querySelectorAll(".day-h, .rec, .ac-tail, .ac-end")];
  const idx = els.map((e) => seq.indexOf(e)).sort((x, y) => x - y);
  const first = seq[Math.max(0, idx[0] - 1)], last = seq[Math.min(seq.length - 1, idx[idx.length - 1] + 1)];
  const card = document.querySelector("#log").getBoundingClientRect();
  const y0 = first.getBoundingClientRect().top + scrollY - 8, y1 = last.getBoundingClientRect().bottom + scrollY + 8;
  const x0 = Math.max(0, card.left - 8), x1 = Math.min(innerWidth, card.right + 8);
  return { x: x0, y: Math.max(0, y0), width: x1 - x0, height: y1 - Math.max(0, y0) };
}, sel);
const rec = (id) => `.rec[data-id="${id}"]`;
const recAt = async (page, date, time) => page.evaluate(([d, t]) => {
  const r = window.__activity.view.entries.find((e) => e.utc && new Date(e.ms + 3 * 3600e3).toISOString().slice(0, 16) === `${d}T${t}`);
  return r ? r.id : null;
}, [date, time]);
const tapOrClick = (o, sel, phone) => (phone ? o.page.tap(sel) : o.page.click(sel));

try {
  const dn = (iso) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 864e5;
  const day = (iso) => `.dp-day[data-dn="${dn(iso)}"]`;
  const press = (o, sel, phone) => (phone ? o.tap(sel) : o.click(sel));

  /* ---- 1: the page at rest at each designed size */
  if (want(1)) for (const lang of LANGS) {
    for (const [n, size] of [["01", 1440], ["02", 768], ["03", 390]]) await shot(`1-${n}-rest-${size}-${lang}`, `lang=${lang}`, SIZES[size]);
    for (const [n, size] of [["04", 1440], ["05", 768], ["06", 390]]) await shot(`1-${n}-rest-full-${size}-${lang}`, `lang=${lang}`, { ...SIZES[size], scale: 1, full: true });
  }

  /* ---- 2: each state, at 1440 and 390 */
  if (want(2)) for (const lang of LANGS) for (const size of [1440, 390]) {
    const S = SIZES[size], ph = Boolean(S.phone), L = `lang=${lang}`;
    const end = async (p) => { await p.evaluate(() => { const t = document.querySelector(".ac-tail, .ac-end"); t.scrollIntoView({ block: "center" }); }); };
    await shot(`2-01-loading-${size}-${lang}`, `${L}&state=loading`, { ...S, act: (p) => p.waitForTimeout(450) });
    await shot(`2-02-error-${size}-${lang}`, `${L}&state=error`, S);
    await shot(`2-03-error-retrying-${size}-${lang}`, `${L}&state=error`, { ...S, act: async (p) => { await press(p, "#retry", ph); await p.waitForTimeout(300); } });
    await shot(`2-04-error-dates-${size}-${lang}`, `${L}&state=error&from=2026-09-16&to=2026-09-22`, S);
    await shot(`2-05-filtered-empty-${size}-${lang}`, `${L}&kind=count&person=o2`, S);
    await shot(`2-06-log-empty-${size}-${lang}`, `${L}&state=empty`, S);
    await shot(`2-07-older-working-${size}-${lang}`, `${L}&older=hold`, { ...S, act: async (p) => { await end(p); await press(p, "#older", ph); await p.waitForTimeout(200); } });
    await shot(`2-08-older-failed-${size}-${lang}`, `${L}&older=fail`, { ...S, act: async (p) => { await end(p); await press(p, "#older", ph); await p.waitForTimeout(900); await end(p); } });
    await shot(`2-09-older-loaded-${size}-${lang}`, L, { ...S, act: async (p) => { await end(p); await press(p, "#older", ph); await p.waitForTimeout(900); } });
    await shot(`2-10-end-line-${size}-${lang}`, L, { ...S, act: async (p) => { await p.evaluate(() => window.__activity.loadAll()); await end(p); } });
    await shot(`2-11-refresh-working-${size}-${lang}`, `${L}&refresh=hold`, { ...S, act: async (p) => { await press(p, "#refresh", ph); await p.waitForTimeout(150); } });
    await shot(`2-12-refresh-failed-${size}-${lang}`, `${L}&refresh=fail`, { ...S, act: async (p) => { await press(p, "#refresh", ph); await p.waitForTimeout(1000); } });
    await shot(`2-13-arrival-access-${size}-${lang}`, `${L}&kind=access`, S);
    await shot(`2-14-arrival-owner-${size}-${lang}`, `${L}&person=o2`, S);
    await shot(`2-15-arrival-settings-${size}-${lang}`, `${L}&kind=settings`, S);
    await shot(`2-16-dates-picker-${size}-${lang}`, L, { ...S, act: async (p) => { await press(p, "#dates-btn", ph); await p.waitForTimeout(300); } });
    await shot(`2-17-search-open-${size}-${lang}`, `${L}&reason=${lang === "ar" ? "ساعات" : "hours"}`, S);
    await shot(`2-18-resets-kind-${size}-${lang}`, `${L}&kind=count`, S);
  }

  /* ---- 3: the range, each element against its whole range, cropped with a strip of its neighbours */
  if (want(3)) for (const lang of LANGS) for (const size of [1440, 768, 390]) {
    const S = SIZES[size], L = `lang=${lang}`;
    const crop = async (name, q, find) => {
      const o = await open(q, S);
      await o.page.evaluate(() => window.__activity.loadAll());
      const ids = await find(o.page);
      const sel = ids.map(rec).join(", ");
      // A crop is of the records: the phone's fixed bar (which the list scrolls under) is set aside for it.
      await o.page.addStyleTag({ content: ".tabbar { visibility: hidden !important; }" });
      await o.page.waitForTimeout(80);
      const c = await around(sel)(o.page);
      await o.page.screenshot({ path: path(name), clip: c, fullPage: true });
      await finish(name, o, { q, ids });
      await o.context.close();
    };
    const at = (pairs) => async (p) => { const out = []; for (const [d, t] of pairs) { const id = await recAt(p, d, t); if (id) out.push(id); } return out; };
    await crop(`3-01-reset-and-not-recorded-${size}-${lang}`, L, at([["2026-09-06", "01:05"], ["2026-09-05", "01:05"]]));
    await crop(`3-02-after-midnight-calendar-day-${size}-${lang}`, L, at([["2026-09-19", "01:05"], ["2026-09-19", "00:22"]]));
    await crop(`3-03-longest-reason-${size}-${lang}`, L, at([["2026-09-21", "18:02"]]));
    await crop(`3-04-shortest-reason-${size}-${lang}`, L, at([["2026-06-01", "09:48"]]));
    await crop(`3-05-reason-other-language-${size}-${lang}`, L, at([[lang === "ar" ? "2026-09-14" : "2026-03-22", lang === "ar" ? "13:20" : "13:05"]]));
    await crop(`3-06-access-all-seven-${size}-${lang}`, `${L}&kind=access`, async (p) => p.evaluate(() => window.__activity.view.entries.map((e) => e.id)));
    await crop(`3-07-settings-${size}-${lang}`, `${L}&kind=settings`, async (p) => p.evaluate(() => window.__activity.view.entries.map((e) => e.id)));
    await crop(`3-08-widest-figures-${size}-${lang}`, `${L}&case=wide`, at([["2026-09-23", "01:05"], ["2026-09-22", "01:05"]]));
    await crop(`3-09-two-owners-named-${size}-${lang}`, L, at([["2026-09-16", "10:05"], ["2026-09-14", "13:20"], ["2026-09-07", "09:31"]]));
    await crop(`3-10-no-reason-${size}-${lang}`, L, at([["2026-09-07", "09:28"], ["2026-09-04", "15:15"]]));
    // Today and yesterday, and the previous year with the end line.
    await shot(`3-14-today-yesterday-${size}-${lang}`, L, { ...S, clip: async (p) => p.evaluate(() => { const a = document.querySelector(".day:nth-child(2) .day-h"); const card = document.querySelector("#log").getBoundingClientRect(); const b = a.getBoundingClientRect(); return { x: Math.max(0, card.left - 8), y: card.top - 8, width: Math.min(innerWidth, card.right + 8) - Math.max(0, card.left - 8), height: Math.min(innerHeight, b.bottom + 60) - card.top + 8 }; }) });
    await shot(`3-15-previous-year-end-${size}-${lang}`, L, { ...S, act: (p) => p.evaluate(() => { window.__activity.loadAll(); document.querySelector(".ac-end").scrollIntoView({ block: "end" }); }), clip: async (p) => p.evaluate(() => { const card = document.querySelector("#log").getBoundingClientRect(); const days = [...document.querySelectorAll(".day")]; const b = days[days.length - 3].getBoundingClientRect(); const e = document.querySelector(".ac-end").getBoundingClientRect(); const top = Math.max(0, b.top - 8); return { x: Math.max(0, card.left - 8), y: top, width: Math.min(innerWidth, card.right + 8) - Math.max(0, card.left - 8), height: Math.min(innerHeight, e.bottom + 16) - top }; }) });
    // The controls: every filter in force; a range across two years; the search open with words in it; the longest and
    // the shortest dates on the dates button.
    const tools = async (p) => p.evaluate(() => { const a = document.querySelector(".ac-tools").getBoundingClientRect(); const m = document.querySelector("#find"); const b = m.hidden ? a : m.getBoundingClientRect(); const l = document.querySelector("#log").getBoundingClientRect(); return { x: 0, y: Math.max(0, a.top - 12), width: innerWidth, height: Math.min(innerHeight, Math.max(a.bottom, b.bottom, l.top + 60)) - Math.max(0, a.top - 12) }; });
    const word = lang === "ar" ? "ساعات" : "hours";
    await shot(`3-16-filters-all-set-${size}-${lang}`, `${L}&kind=settings&person=o2&from=2026-09-01&to=2026-09-20&reason=${word}`, { ...S, clip: tools });
    await shot(`3-17-dates-across-years-${size}-${lang}`, `${L}&from=2025-12-28&to=2026-01-05`, { ...S, clip: tools });
    await shot(`3-18-search-open-words-${size}-${lang}`, `${L}&reason=${word}`, { ...S, clip: tools });
    await shot(`3-19-search-closed-words-${size}-${lang}`, `${L}&reason=${word}`, { ...S, act: (p) => p.click("#find-btn"), clip: tools });
    await shot(`3-20-dates-one-day-${size}-${lang}`, `${L}&from=2026-05-01&to=2026-05-01`, { ...S, clip: tools });
    // Keyboard focus in the controls (FOC-1, FOC-2), and on a pointer screen a record's lift (TBL-2).
    await shot(`3-21-focus-dates-${size}-${lang}`, L, { ...S, act: async (p) => { await p.focus("#person"); await p.keyboard.press("Tab"); }, clip: tools });
    await shot(`3-22-focus-magnifier-${size}-${lang}`, L, { ...S, act: async (p) => { await p.focus("#dates-btn"); await p.keyboard.press("Tab"); }, clip: tools });
    await shot(`3-23-focus-kind-${size}-${lang}`, L, { ...S, act: async (p) => { await p.focus('.seg-b[data-kind="count"]'); await p.keyboard.press("Shift+Tab"); await p.keyboard.press("Tab"); }, clip: tools });
    await shot(`3-24-escape-closes-search-${size}-${lang}`, `${L}&find=1`, { ...S, act: async (p) => { await p.focus("#reason"); await p.keyboard.type(lang === "ar" ? "رمز" : "PIN"); await p.keyboard.press("Escape"); }, clip: tools });
    if (!S.phone) await shot(`3-25-row-hover-${size}-${lang}`, L, { ...S, act: async (p) => { await p.hover(".day:nth-child(1) .rec:nth-child(1)"); }, clip: around(".day:nth-child(1) .rec:nth-child(1)") });
    // F2: where focus lands after "Show older" (by key) and after a retry: each shows its ring.
    await shot(`3-26-focus-after-older-${size}-${lang}`, L, { ...S, act: async (p) => { await p.evaluate(() => document.querySelector(".ac-tail").scrollIntoView({ block: "center" })); await p.focus("#older"); await p.keyboard.press("Enter"); await p.waitForTimeout(900); } });
    await shot(`3-27-focus-after-retry-${size}-${lang}`, `${L}&state=error`, { ...S, act: async (p) => { await p.keyboard.press("Enter"); await p.waitForTimeout(1500); } });
  }

  /* ---- 3-30: the phone's title beside every status, on every page, at 320, 360, 390 and 720 (the header cropped). The
   * header's height and the title's box are logged for each, so a status that changes moves nothing. */
  if (want(30)) for (const lang of LANGS) for (const w of [320, 360, 390, 720]) for (const [pg, tag, states] of [
    ["index.html", "daily", ["live", "delayed", "closed", "unavailable", "loading", "error"]],
    ["reports.html", "reports", ["live", "delayed", "closed", "unavailable", "loading", "error"]],
    ["activity.html", "activity", ["live", "ops=delayed", "ops=closed", "ops=offline", "state=loading", "state=error"]],
  ]) {
    const heads = [];
    for (const st of states) {
      const sq = st.includes("=") ? st : `state=${st}`;
      const q = pg === "activity.html" ? `lang=${lang}&${sq}` : `${pg}?lang=${lang}&tuner=0&motion=off&${sq}`;
      const name = `3-30-title-${tag}-${st.replace(/^(ops|state)=/, "")}-${w}-${lang}`;
      const o = await open(q, { width: w, height: 640, scale: 2, phone: true });
      if (st.endsWith("loading")) await o.page.waitForTimeout(450);
      const m = await o.page.evaluate(() => { const h = document.querySelector(".head").getBoundingClientRect(), t = document.querySelector(".head h1").getBoundingClientRect(); return { head: +h.height.toFixed(2), title: [+t.left.toFixed(2), +t.top.toFixed(2), +t.width.toFixed(2), +t.height.toFixed(2)], lines: Math.round(t.height / 28.5) }; });
      heads.push(m);
      await o.page.screenshot({ path: path(name), clip: await o.page.evaluate(() => { const h = document.querySelector(".head").getBoundingClientRect(); return { x: 0, y: 0, width: innerWidth, height: h.bottom + 12 }; }) });
      await finish(name, o, { q, ...m });
      await o.context.close();
    }
    const one = heads.every((h) => h.lines === 1), same = heads.every((h) => h.head === heads[0].head && h.title.join() === heads[0].title.join());
    log.frames[`3-30-title-${tag}-${w}-${lang}`] = { one, same, heads };
    if (!one || !same) log.failures.push(`3-30 ${tag} ${w} ${lang}: title on one line ${one}, the header unmoved ${same}`);
  }

  /* ---- 4: the phone's touch flows, step by step (390 x 844, touch) */
  if (want(4)) for (const lang of LANGS) {
    const S = SIZES[390], L = `lang=${lang}`;
    const flow = async (prefix, q, steps, size = S, tag = "390") => {
      const o = await open(q, size);
      let i = 0;
      for (const [label, act] of steps) {
        i++;
        if (act) await act(o.page);
        await o.page.waitForTimeout(280);
        const name = `${prefix}-${String.fromCharCode(96 + i)}-${label}-${tag}-${lang}`;
        await o.page.screenshot({ path: path(name) });
        await finish(name, o, { q, step: label });
      }
      await o.context.close();
    };
    await flow("4-01-kinds", L, [["rest", null], ["tap-access", (p) => p.tap('.seg-b[data-kind="access"]')], ["tap-resets", (p) => p.tap('.seg-b[data-kind="count"]')]]);
    await flow("4-02-person", L, [["tap-select", (p) => p.tap("#person")], ["chose-noura", (p) => p.selectOption("#person", "o2")]]);
    await flow("4-03-search", L, [["tap-magnifier", (p) => p.tap("#find-btn")], ["typed", async (p) => { await p.type("#reason", lang === "ar" ? "ساعات" : "hours", { delay: 30 }); await p.waitForTimeout(600); }], ["search-key", async (p) => { await p.press("#reason", "Enter"); }], ["tap-magnifier-closes", (p) => p.tap("#find-btn")], ["reopen-clear", async (p) => { await p.tap("#find-btn"); await p.tap("#reason-clear"); }]]);
    await flow("4-04-dates", L, [
      ["tap-dates", (p) => p.tap("#dates-btn")],
      ["tap-start", (p) => p.tap(day("2026-09-16"))],
      ["tap-end", (p) => p.tap(day("2026-09-22"))],
      ["shown", (p) => p.tap('#dates-form [type="submit"]')],
      ["reopen", (p) => p.tap("#dates-btn")],
      ["tap-earlier-start", (p) => p.tap(day("2026-09-10"))],
      ["tap-before-it-swaps", (p) => p.tap(day("2026-09-03"))],
      ["clear", (p) => p.tap("#dates-clear")],
      ["all-dates", (p) => p.tap('#dates-form [type="submit"]')],
    ]);
    await flow("4-05-dates-months", L, [
      ["tap-dates", (p) => p.tap("#dates-btn")],
      ["back-a-month", (p) => p.tap('.dp-step[data-step="-1"]')],
      ["tap-start", (p) => p.tap(day("2026-08-28"))],
      ["forward", (p) => p.tap('.dp-step[data-step="1"]')],
      ["tap-end", (p) => p.tap(day("2026-09-04"))],
      ["shown", (p) => p.tap('#dates-form [type="submit"]')],
    ]);
    await flow("4-06-older", `${L}&older=hold`, [["at-the-end", (p) => p.evaluate(() => document.querySelector(".ac-tail").scrollIntoView({ block: "center" }))], ["tap-working", (p) => p.tap("#older")]]);
    await flow("4-07-older", L, [["tap", async (p) => { await p.evaluate(() => document.querySelector(".ac-tail").scrollIntoView({ block: "center" })); await p.tap("#older"); await p.waitForTimeout(900); }], ["all-loaded-end", async (p) => { for (let k = 0; k < 4; k++) { const b = await p.$("#older"); if (!b) break; await b.scrollIntoViewIfNeeded(); await p.tap("#older"); await p.waitForTimeout(900); } await p.evaluate(() => document.querySelector(".ac-end").scrollIntoView({ block: "center" })); }]]);
    await flow("4-08-refresh", `${L}&refresh=hold`, [["tap-working", (p) => p.tap("#refresh")]]);
    // Reports' custom period, the same picker on the phone.
    await flow("4-09-reports-period", `reports.html?lang=${lang}&tuner=0&motion=off`, [
      ["tap-other", (p) => p.tap('.seg-b[data-range="custom"]')],
      ["tap-start", (p) => p.tap(day("2026-09-01"))],
      ["tap-end", (p) => p.tap(day("2026-09-14"))],
      ["shown", (p) => p.tap('#range-form [type="submit"]')],
    ]);
  }

  /* ---- 5: the checked sizes, and file:// */
  if (want(5)) for (const lang of LANGS) {
    const L = `lang=${lang}`;
    await shot(`5-01-320-${lang}`, L, { width: 320, height: 568, scale: 2, phone: true });
    await shot(`5-02-320-full-${lang}`, L, { width: 320, height: 568, phone: true, full: true });
    await shot(`5-03-320-filters-${lang}`, `${L}&find=1&kind=settings&person=o1&from=2025-12-28&to=2026-01-05`, { width: 320, height: 568, scale: 2, phone: true });
    await shot(`5-04-320-picker-${lang}`, L, { width: 320, height: 568, scale: 2, phone: true, act: async (p) => { await p.tap("#dates-btn"); await p.waitForTimeout(300); await p.tap(day("2026-09-16")); await p.tap(day("2026-09-22")); } });
    await shot(`5-05-320-widest-${lang}`, `${L}&case=wide`, { width: 320, height: 568, scale: 2, phone: true });
    await shot(`5-06-1024-${lang}`, L, { width: 1024, height: 768 });
    await shot(`5-07-1024-full-${lang}`, L, { width: 1024, height: 768, full: true });
    await shot(`5-08-zoom200-${lang}`, L, { width: 720, height: 450, scale: 2 });
    await shot(`5-09-zoom200-full-${lang}`, L, { width: 720, height: 450, full: true });
    await shot(`5-10-file-1440-${lang}`, L, { width: 1440, height: 900, file: true });
    await shot(`5-11-tablet-rail-open-${lang}`, L, { width: 768, height: 1024, act: async (p) => { await p.click("#brand"); await p.waitForTimeout(300); } });
    await shot(`5-12-1440-widest-${lang}`, `${L}&case=wide`, { width: 1440, height: 900 });
    await shot(`5-13-zoom200-picker-${lang}`, L, { width: 720, height: 450, scale: 2, act: async (p) => { await p.click("#dates-btn"); await p.waitForTimeout(300); } });
    await shot(`5-14-file-picker-390-${lang}`, L, { ...SIZES[390], file: true, act: async (p) => { await p.tap("#dates-btn"); await p.waitForTimeout(300); } });
    await shot(`5-15-1024-refresh-failed-${lang}`, `${L}&refresh=fail`, { width: 1024, height: 768, act: async (p) => { await p.click("#refresh"); await p.waitForTimeout(1000); } });
    await shot(`5-16-320-refresh-failed-${lang}`, `${L}&refresh=fail`, { width: 320, height: 568, scale: 2, phone: true, act: async (p) => { await p.tap("#refresh"); await p.waitForTimeout(1000); } });
    await shot(`5-17-320-loading-${lang}`, `${L}&state=loading`, { width: 320, height: 568, scale: 2, phone: true, act: (p) => p.waitForTimeout(450) });
  }

  /* ---- 7: the date picker, every state, on Activity log and on Reports' custom period, at 1440, 768, 390 and 320. The
   * dialog's panel is cropped (the whole sheet on a phone). */
  if (want(7)) for (const lang of LANGS) for (const size of [1440, 768, 390, 320]) {
    const S = size === 320 ? { width: 320, height: 568, scale: 2, phone: true } : SIZES[size], ph = Boolean(S.phone), L = `lang=${lang}`;
    const panel = async (p) => p.evaluate(() => { const r = document.querySelector("dialog[open] .dlg-panel").getBoundingClientRect(); return { x: Math.max(0, r.left - 12), y: Math.max(0, r.top - 12), width: Math.min(innerWidth, r.right + 12) - Math.max(0, r.left - 12), height: Math.min(innerHeight, r.bottom + 12) - Math.max(0, r.top - 12) }; });
    const pk = async (name, q, acts, pg = "activity") => {
      await shot(`7-${name}-${size}-${lang}`, q, { ...S, clip: panel, act: async (p) => {
        if (pg === "activity") await press(p, "#dates-btn", ph); else await p.evaluate(() => window.__reports.openRange());
        await p.waitForTimeout(300);
        for (const a of acts) { await a(p); await p.waitForTimeout(80); }
      } });
    };
    const tapDay = (iso) => (p) => press(p, day(iso), ph);
    const step = (k) => (p) => press(p, `.dp-step[data-step="${k}"]`, ph);
    const hover = (iso) => (p) => p.hover(day(iso));
    await pk("01-empty", L, []);
    await pk("02-start-picked", L, [tapDay("2026-09-12")]);
    if (!ph) await pk("03-hover-forward", L, [tapDay("2026-09-12"), hover("2026-09-17")]);
    if (!ph) await pk("04-hover-before-start", L, [tapDay("2026-09-12"), hover("2026-09-08")]);
    await pk("05-reversed-tap-swaps", L, [tapDay("2026-09-12"), tapDay("2026-09-08")]);
    await pk("06-range-one-month", `${L}&from=2026-09-16&to=2026-09-22`, []);
    await pk("07-single-day", L, [tapDay("2026-09-09"), tapDay("2026-09-09")]);
    await pk("08-across-months-end-month", `${L}&from=2026-08-28&to=2026-09-04`, []);
    await pk("09-across-months-start-month", `${L}&from=2026-08-28&to=2026-09-04`, [step(-1)]);
    await pk("10-across-years-january", `${L}&from=2025-12-28&to=2026-01-05`, []);
    await pk("11-across-years-december", `${L}&from=2025-12-28&to=2026-01-05`, [step(-1)]);
    await pk("12-first-month", `${L}&from=2025-09-24&to=2025-09-30`, []);
    await pk("13-today-chosen", L, [tapDay("2026-09-23")]);
    await pk("14-shortest-dates", `${L}&from=2026-05-01&to=2026-05-05`, []);
    await pk("15-focus-ring-day", `${L}&from=2026-09-16&to=2026-09-22`, [(p) => p.keyboard.press("ArrowDown"), (p) => p.keyboard.press(lang === "ar" ? "ArrowLeft" : "ArrowRight")]);
    await pk("16-focus-ring-chosen-end", `${L}&from=2026-09-16&to=2026-09-22`, [(p) => p.keyboard.press("ArrowRight"), (p) => p.keyboard.press("ArrowLeft")]);
    await pk("17-page-up-previous-month", `${L}&from=2026-09-16&to=2026-09-22`, [(p) => p.keyboard.press("PageUp")]);
    await pk("18-focus-ring-arrow", L, [(p) => p.keyboard.press("Shift+Tab"), (p) => p.keyboard.press("Shift+Tab")]);
    await pk("19-after-clear", `${L}&from=2026-09-16&to=2026-09-22`, [(p) => press(p, "#dates-clear", ph)]);
    await pk("20-reports-period", `reports.html?${L}&tuner=0&motion=off`, [], "reports");
    await pk("21-reports-start-picked", `reports.html?${L}&tuner=0&motion=off`, [tapDay("2026-09-07")], "reports");
    await pk("22-reports-first-month", `reports.html?${L}&tuner=0&motion=off`, [step(-1)], "reports");
    await pk("23-reports-short-history", `reports.html?${L}&tuner=0&motion=off&state=short&range=7d`, [], "reports");
  }

  /* ---- the Daily and Reports pages: the rail's and the bar's Activity log item link here */
  if (want(6)) for (const lang of LANGS) for (const pg of ["index.html", "reports.html"]) {
    const o = await open(`${pg}?lang=${lang}&tuner=0`);
    const hrefs = await o.page.evaluate(() => ({ rail: document.querySelector("#activity-link").getAttribute("href"), bar: document.querySelector("#tab-activity").getAttribute("href") }));
    await finish(`6-${pg === "index.html" ? "01-daily" : "02-reports"}-links-${lang}`, o, hrefs, { problems: false });
    if (!hrefs.rail.startsWith(`activity.html?lang=${lang}`) || !hrefs.bar.startsWith(`activity.html?lang=${lang}`)) log.failures.push(`${pg} ${lang}: the Activity log links are ${hrefs.rail} and ${hrefs.bar}`);
    await o.context.close();
  }
} finally {
  await browser.close();
  server.close();
}

await writeFile(join(OUT, "activity-log.json"), JSON.stringify(log, null, 1));
console.log(`frames ${Object.keys(log.frames).length}; failures ${log.failures.length}`);
for (const f of log.failures) console.log("  " + f);
process.exitCode = log.failures.length ? 1 : 0;
