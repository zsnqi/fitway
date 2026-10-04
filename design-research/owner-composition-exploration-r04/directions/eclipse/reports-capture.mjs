// Eclipse Reports capture (run owner_reports_r04_s10). Serves this folder on 127.0.0.1 (port 3176 unless --port=N; never
// 3173, which is capture.mjs's, or 3174), renders the Reports frames with Playwright chromium (a fresh context per frame,
// reduced motion), checks them, and composes the review sheets. It never writes into this repository: outDir is required.
//   node design-research/owner-composition-exploration-r04/directions/eclipse/reports-capture.mjs <outDir> [--port=3176]
// Writes <outDir>/frames/*.png, <outDir>/sheets/*.png and <outDir>/reports-log.json, and exits 1 if a check fails:
// a console message or page error, a font file fetched twice in one load, a request off the page's origin, a horizontal
// page scroll, a layout shift after the first paint (input-driven shifts excluded), a clipped or spilling element, a
// value table that does not fit its card on a phone, or a dialog panel outside the viewport.
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_ARG = process.argv.slice(2).find((a) => !a.startsWith("--"));
if (!OUT_ARG) throw new Error("reports-capture.mjs needs an output folder outside the repository");
const OUT = resolve(OUT_ARG);
if ((OUT + sep).toLowerCase().startsWith(resolve(HERE, "../../../..").toLowerCase() + sep)) throw new Error("the output folder must be outside the repository worktree");
const PORT = Number((process.argv.find((a) => a.startsWith("--port=")) || "--port=3176").slice(7));
if (PORT === 3173 || PORT === 3174) throw new Error("port 3173 is capture.mjs's and 3174 is reserved");
const ORIGIN = `http://127.0.0.1:${PORT}`;
const FR = join(OUT, "frames"), SH = join(OUT, "sheets");
await mkdir(FR, { recursive: true });
await mkdir(SH, { recursive: true });
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".png": "image/png", ".json": "application/json", ".woff2": "font/woff2" };
const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", ORIGIN);
  const file = normalize(join(HERE, decodeURIComponent(url.pathname === "/" ? "/reports.html" : url.pathname)));
  if (!file.startsWith(HERE + sep)) { res.writeHead(403).end(); return; }
  try { const body = await readFile(file); res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream", "cache-control": "no-store" }); res.end(body); }
  catch { res.writeHead(404).end("not found"); }
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
const browser = await chromium.launch();
const log = { frames: {}, phone: {}, failures: [] };

const INIT = `(() => { window.__cls = 0; window.__shifts = [];
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) { if (e.hadRecentInput) continue; window.__cls += e.value; window.__shifts.push(+e.value.toFixed(5)); } }).observe({ type: "layout-shift", buffered: true }); } catch (e) {}
})();`;
// Visible problems: a horizontal page scroll, an element outside the viewport's width, a row that overflows its box.
const PROBLEMS = () => {
  const de = document.documentElement, vw = de.clientWidth, out = [];
  if (de.scrollWidth > vw) out.push(`page scrolls sideways by ${de.scrollWidth - vw}px`);
  for (const el of document.querySelectorAll("body *")) {
    if (el.closest("[hidden], .sr-only, dialog:not([open]), .rail, .heat-scroll")) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const r = el.getBoundingClientRect();
    if (r.width && (r.right > vw + 0.5 || r.left < -0.5)) out.push(`outside the viewport: ${el.id ? "#" + el.id : el.className || el.tagName} ${Math.round(r.left)}..${Math.round(r.right)}`);
  }
  for (const el of document.querySelectorAll(".stat-head, .stat-foot, .stat-value, .head-meta, .pattern-head, .days-head, .dlg-foot, .field-row, .file-line, .seg, .table-wrap")) {
    if (el.closest("[hidden], dialog:not([open])")) continue;
    if (el.scrollWidth > el.clientWidth + 1) out.push(`overflows its box: ${el.className} by ${el.scrollWidth - el.clientWidth}px`);
  }
  const t = document.querySelector("#days-table"), w = document.querySelector("#days-wrap");
  if (t && w && t.getBoundingClientRect().width > w.clientWidth + 0.5) out.push(`the day table is wider than its card (${Math.round(t.getBoundingClientRect().width)} > ${w.clientWidth})`);
  const p = document.querySelector("dialog[open] .dlg-panel");
  if (p) { const b = p.getBoundingClientRect(); if (b.left < -0.5 || b.right > vw + 0.5 || b.top < -0.5 || b.bottom > innerHeight + 0.5) out.push("a dialog panel leaves the viewport"); }
  return out.slice(0, 12);
};

async function open(q, { width = 1440, height = 900, scale = 1, phone = false, motion = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, isMobile: phone, hasTouch: phone, reducedMotion: motion ? "no-preference" : "reduce", colorScheme: "dark" });
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
  await page.goto(`${ORIGIN}/${q.startsWith("index.html") ? q : "reports.html?" + q}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__reports?.ready === true || window.__eclipse?.ready === true);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  return { context, page, errors, fonts, off };
}
async function finish(name, o, extra = {}) {
  const { page, errors, fonts, off } = o;
  const problems = await page.evaluate(PROBLEMS);
  const cls = await page.evaluate(() => +window.__cls.toFixed(5));
  const maxFont = Math.max(0, ...fonts.values());
  const rec = { errors, maxFontFetch: maxFont, offOrigin: off, cls, problems, ...extra };
  log.frames[name] = rec;
  const bad = [];
  if (errors.length) bad.push("errors");
  if (maxFont > 1) bad.push("font fetched twice");
  if (off.length) bad.push("off-origin request");
  if (cls > 0) bad.push("layout shift");
  if (problems.length) bad.push(problems.join("; "));
  if (bad.length) log.failures.push(`${name}: ${bad.join(" | ")}`);
  return rec;
}
async function shot(name, q, { act, el, clip, full = false, ...opts } = {}) {
  const o = await open(q, opts);
  if (act) await act(o.page);
  await o.page.waitForTimeout(120);
  const path = join(FR, name + ".png");
  let box = null;
  if (el) { const loc = o.page.locator(el).first(); box = await loc.boundingBox(); await loc.screenshot({ path }); }
  else await o.page.screenshot({ path, fullPage: full, clip });
  const rec = await finish(name, o, { q, box, cssW: box ? Math.round(box.width) : clip ? Math.round(clip.width) : null });
  await o.context.close();
  return rec;
}
const kbFocus = async (page, sel) => { await page.focus(sel); await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Tab"); };

const LANGS = ["ar", "en"];
const STATES = [
  ["full", "", "Last 4 weeks (default): 26 Aug - 22 Sep, week over week comparable"],
  ["short", "state=short", "Short history: readings since 13 Sep; week over week has no comparison"],
  ["7d", "range=7d", "Last 7 days: 16 - 22 Sep, Thursday's camera gap reads as no data"],
  ["custom", "from=2026-09-01&to=2026-09-10", "A custom period: 1 - 10 Sep"],
  ["empty", "from=2026-07-01&to=2026-07-31", "A period before the readings began: empty states"],
  ["numbers", "", "Numbers switched on"],
];
try {
  /* ---- the whole page in each state (1440x900), first screen and full page */
  for (const lang of LANGS) {
    for (const [id, q, caption] of STATES) {
      const act = id === "numbers" ? (p) => p.click("#numbers") : null;
      const qq = `lang=${lang}${q ? "&" + q : ""}`;
      await shot(`page-${id}-${lang}`, qq, { act });
      await shot(`page-${id}-${lang}-full`, qq, { act, full: true });
      log.frames[`page-${id}-${lang}`].caption = caption;
    }
    for (const [w, h] of [[1280, 800], [1024, 640]]) await shot(`page-full-${lang}-${w}`, `lang=${lang}`, { width: w, height: h, full: true });
  }
  /* ---- the pattern: closed, no data and zero side by side (short history), 2x, with the cells to ring */
  for (const lang of LANGS) {
    const o = await open(`lang=${lang}&state=short`, { scale: 2 });
    const rings = await o.page.evaluate(() => {
      const base = document.querySelector("#pattern").getBoundingClientRect();
      const rel = (el) => { const b = el.getBoundingClientRect(); return { x: b.left - base.left, y: b.top - base.top, w: b.width, h: b.height }; };
      return { w: base.width, h: base.height, closed: rel(document.querySelector(".hc.closed")), nodata: rel(document.querySelector(".hc.nodata")), zero: rel(document.querySelector(".hc.zero")), low: rel(document.querySelector('.hc.v[data-r="6"][data-c0="1"]')) };
    });
    await o.page.locator("#pattern").screenshot({ path: join(FR, `pattern-short-${lang}-2x.png`) });
    await finish(`pattern-short-${lang}-2x`, o, { rings });
    await o.context.close();
    await shot(`pattern-tip-${lang}-2x`, `lang=${lang}&range=7d`, { scale: 2, el: "#pattern", act: (p) => p.evaluate(() => window.__reports.showCell(4, 5)) });
    await shot(`pattern-tip-zero-${lang}-2x`, `lang=${lang}`, { scale: 2, el: "#pattern", act: (p) => p.evaluate(() => window.__reports.showCell(6, 0)) });
    await shot(`pattern-numbers-${lang}-2x`, `lang=${lang}&state=short`, { scale: 2, el: "#pattern", act: (p) => p.click("#numbers") });
  }
  /* ---- week over week in both history states */
  for (const lang of LANGS) for (const st of ["full", "short"]) await shot(`wow-${st}-${lang}-2x`, `lang=${lang}${st === "short" ? "&state=short" : ""}`, { scale: 2, el: "#card-trend" });
  /* ---- the table's states */
  const tableClip = async (p, rows = 7) => p.evaluate((n) => { const t = document.querySelector("#days"); t.scrollIntoView({ block: "start" }); const b = t.getBoundingClientRect(); const r = document.querySelectorAll("#days-table tbody tr:not(.note-row)")[n - 1]; return { x: b.left, y: b.top, width: b.width, height: (r ? r.getBoundingClientRect().bottom : b.bottom) - b.top + 10 }; }, rows);
  for (const lang of LANGS) {
    const T = async (name, q, act, rows = 7) => {
      const o = await open(`lang=${lang}${q}`, { scale: 2 });
      if (act) await act(o.page);
      await o.page.waitForTimeout(100);
      const clip = await tableClip(o.page, rows);
      await o.page.screenshot({ path: join(FR, `${name}-${lang}-2x.png`), clip });
      await finish(`${name}-${lang}-2x`, o, { cssW: Math.round(clip.width) });
      await o.context.close();
    };
    await T("table-default", "");
    await T("table-hover", "", async (p) => { const r = await p.$$("#days-table tbody tr"); await r[2].hover(); });
    await T("table-focus", "", async (p) => { await kbFocus(p, '[data-sort="peak"]'); });
    await T("table-sorted", "", async (p) => { await p.click('[data-sort="peak"]'); await p.mouse.move(5, 5); });
    await T("table-gap-highest", "&range=7d", null, 7);
    await T("table-before-history", "&state=short", async (p) => { await p.evaluate(() => window.__reports.setRange("28d")); }, 12);
    await T("table-empty", "&from=2026-07-01&to=2026-07-31", null, 1);
  }
  /* ---- the form's states: the segmented control, the switch, buttons and fields */
  for (const lang of LANGS) {
    const headClip = async (p) => p.evaluate(() => { const b = document.querySelector(".head-meta").getBoundingClientRect(); return { x: b.left - 12, y: b.top - 12, width: b.width + 24, height: b.height + 24 }; });
    const H = async (name, act) => { const o = await open(`lang=${lang}`, { scale: 2 }); if (act) await act(o.page); await o.page.waitForTimeout(80); const clip = await headClip(o.page); await o.page.screenshot({ path: join(FR, `${name}-${lang}-2x.png`), clip }); await finish(`${name}-${lang}-2x`, o, { cssW: Math.round(clip.width) }); await o.context.close(); };
    await H("seg-default");
    await H("seg-hover", (p) => p.hover('.seg-b[data-range="7d"]'));
    await H("seg-focus", (p) => kbFocus(p, '.seg-b[data-range="custom"]'));
    await H("seg-selected-7d", async (p) => { await p.click('.seg-b[data-range="7d"]'); await p.mouse.move(5, 5); });
    const toolClip = async (p) => p.evaluate(() => { const b = document.querySelector(".pattern-tools").getBoundingClientRect(); return { x: b.left - 12, y: b.top - 12, width: b.width + 24, height: b.height + 24 }; });
    const S = async (name, act) => { const o = await open(`lang=${lang}`, { scale: 2 }); if (act) await act(o.page); await o.page.waitForTimeout(260); const clip = await toolClip(o.page); await o.page.screenshot({ path: join(FR, `${name}-${lang}-2x.png`), clip }); await finish(`${name}-${lang}-2x`, o, { cssW: Math.round(clip.width) }); await o.context.close(); };
    await S("switch-off");
    await S("switch-hover", (p) => p.hover("#numbers"));
    await S("switch-focus", (p) => kbFocus(p, "#numbers"));
    await S("switch-on", async (p) => { await p.click("#numbers"); await p.mouse.move(5, 5); });
    const btnClip = async (p) => p.evaluate(() => { document.querySelector("#days").scrollIntoView({ block: "start" }); const c = document.querySelector("#table-export").getBoundingClientRect(); return { x: c.left - 16, y: c.top - 16, width: c.width + 32, height: c.height + 32 }; });
    const B = async (name, act) => { const o = await open(`lang=${lang}`, { scale: 2 }); if (act) await act(o.page); await o.page.waitForTimeout(80); const clip = await btnClip(o.page); await o.page.screenshot({ path: join(FR, `${name}-${lang}-2x.png`), clip }); await finish(`${name}-${lang}-2x`, o, { cssW: Math.round(clip.width) }); await o.context.close(); };
    await B("button-default");
    await B("button-hover", async (p) => { await p.evaluate(() => document.querySelector("#days").scrollIntoView({ block: "start" })); await p.hover("#table-export"); });
    await B("button-focus", (p) => kbFocus(p, "#table-export"));
    // The shared picker: keyboard focus, hover and a start alone (PCK-2, PCK-7).
    const F = async (name, act) => { const o = await open(`lang=${lang}&dialog=range`, { scale: 2 }); if (act) await act(o.page); await o.page.waitForTimeout(120); const loc = o.page.locator("#range-form"); const bx = await loc.boundingBox(); await loc.screenshot({ path: join(FR, `${name}-${lang}-2x.png`) }); await finish(`${name}-${lang}-2x`, o, { cssW: Math.round(bx.width) }); await o.context.close(); };
    await F("picker-focus");
    await F("picker-hover", async (p) => { await p.evaluate(() => document.activeElement.blur()); await p.hover('#range-picker [data-dn="20708"]'); });
    await F("picker-start", async (p) => { await p.click('#range-picker [data-dn="20708"]'); });
  }
  /* ---- the dialog's states */
  for (const lang of LANGS) {
    await shot(`dialog-range-${lang}`, `lang=${lang}&dialog=range`);
    await shot(`dialog-export-${lang}`, `lang=${lang}&dialog=export`);
    const D = async (name, q, act) => { const o = await open(`lang=${lang}&dialog=export${q}`, { scale: 2 }); await act(o.page); const loc = o.page.locator("#export-form"); const bx = await loc.boundingBox(); await loc.screenshot({ path: join(FR, `${name}-${lang}-2x.png`) }); await finish(`${name}-${lang}-2x`, o, { cssW: Math.round(bx.width), state: await o.page.evaluate(() => window.__reports.export.state), focus: await o.page.evaluate(() => document.activeElement.id || document.activeElement.textContent.trim()) }); await o.context.close(); };
    await D("export-idle", "", async () => {});
    await D("export-working", "", async (p) => { await p.evaluate(() => { window.__reports.export.hold = true; }); await p.click("#export-go"); await p.waitForTimeout(500); });
    await D("export-done", "", async (p) => { await p.click("#export-go"); await p.waitForFunction(() => window.__reports.export.state === "done"); await p.waitForTimeout(60); });
    await D("export-failed", "&export=fail", async (p) => { await p.click("#export-go"); await p.waitForFunction(() => window.__reports.export.state === "failed"); await p.waitForTimeout(60); });
    await D("export-one-day", "", async (p) => { await p.click('#export-picker [data-dn="20708"]'); });
  }
  /* ---- the early phone check: the table, the date-range form and the export dialog at 390x844 and 320x568 */
  for (const [w, h] of [[390, 844], [320, 568]]) {
    for (const lang of LANGS) {
      const P = async (name, q, act) => {
        const o = await open(`lang=${lang}${q}`, { width: w, height: h, scale: 2, phone: true });
        if (act) await act(o.page);
        await o.page.waitForTimeout(150);
        await o.page.screenshot({ path: join(FR, `phone-${w}-${name}-${lang}.png`) });
        const m = await o.page.evaluate(() => {
          const de = document.documentElement, t = document.querySelector("#days-table"), wrap = document.querySelector("#days-wrap");
          const small = [];
          const scope = document.querySelector("dialog[open]") || document;
          for (const el of scope.querySelectorAll("#days-table button, .seg-b, .rbtn, .icon-btn, .field-input, .switch")) {
            if (el.closest("[hidden]")) continue;
            const b = el.getBoundingClientRect();
            if (!b.width || b.bottom < 0 || b.top > innerHeight) continue;
            const hit = el.matches(".seg-b") ? b.height + 8 : b.height; // a segment's hit area reaches the control's 44 px
            if (hit < 43.5 || b.width < 43.5) small.push(`${el.className} ${Math.round(b.width)}x${Math.round(hit)}`);
          }
          return { docScrollW: de.scrollWidth, clientW: de.clientWidth, tableW: t ? Math.round(t.getBoundingClientRect().width) : null, wrapW: wrap ? wrap.clientWidth : null, smallTargets: small };
        });
        const rec = await finish(`phone-${w}-${name}-${lang}`, o, m);
        log.phone[`${w}-${name}-${lang}`] = { ...m, problems: rec.problems };
        await o.context.close();
      };
      await P("table", "", (p) => p.evaluate(() => document.querySelector("#days").scrollIntoView({ block: "start" })));
      await P("table-sorted", "", async (p) => { await p.evaluate(() => document.querySelector("#days").scrollIntoView({ block: "start" })); await p.selectOption("#dl-sort", "entries-desc"); });
      await P("range-form", "", null);
      await P("range-dialog", "&dialog=range", null);
      await P("range-dialog-start", "&dialog=range", async (p) => { await p.locator('#range-picker [data-dn="20708"]').tap(); });
      await P("export-dialog", "&dialog=export", null);
      await P("export-done", "&dialog=export", async (p) => { await p.click("#export-go"); await p.waitForFunction(() => window.__reports.export.state === "done"); });
    }
  }
  /* ---- the Daily page: its rail now links to Reports (nothing else changed) */
  for (const lang of LANGS) {
    const o = await open(`index.html?lang=${lang}&tuner=0`);
    const link = await o.page.evaluate(() => document.querySelector("#reports-link").getAttribute("href"));
    await o.page.click("#brand");
    await o.page.mouse.move(720, 40);
    await o.page.focus("#reports-link");
    await o.page.keyboard.press("Shift+Tab"); await o.page.keyboard.press("Tab");
    await o.page.waitForTimeout(150);
    await o.page.screenshot({ path: join(FR, `daily-rail-link-${lang}.png`) });
    await finish(`daily-rail-link-${lang}`, o, { href: link });
    await o.context.close();
  }
} finally {
  await browser.close();
  server.close();
}

/* ---- sheets: plain HTML pages of the frames, captioned, rendered to PNG */
const img = (f, w) => `<img src="${pathToFileURL(join(FR, f + ".png")).href}" style="width:${w}px">`;
// A 2x crop shows at up to its full resolution (twice its CSS size), within the column width given.
const fig = (f, w, cap) => { const k = log.frames[f] && log.frames[f].cssW; return `<figure>${img(f, k ? Math.min(w, 2 * k) : w)}<figcaption>${cap}</figcaption></figure>`; };
const CSS = `body{margin:0;padding:32px;background:#0b0b0c;color:#e9e6e5;font:14px/1.45 "Segoe UI",system-ui,sans-serif}h1{font-size:22px;font-weight:600;margin:0 0 6px}p.lead{margin:0 0 24px;color:#a9a3a5;max-width:1100px}
.g{display:grid;gap:22px 26px;align-items:start}figure{margin:0}figcaption{margin-top:7px;color:#a9a3a5;font-size:13px}figcaption b{color:#e9e6e5;font-weight:600}img{display:block;border:1px solid #2a2829;border-radius:6px}
h2{font-size:16px;font-weight:600;margin:30px 0 12px;color:#e9e6e5}.ring{position:absolute;border:2px solid #4fd1ff;border-radius:10px}.tag{position:absolute;background:#4fd1ff;color:#041018;font:600 12px/1 "Segoe UI";padding:4px 7px;border-radius:5px;white-space:nowrap}.rel{position:relative}`;
async function sheet(name, title, lead, body, width = 1800) {
  const html = `<!doctype html><meta charset="utf-8"><style>${CSS}</style><h1>${title}</h1><p class="lead">${lead}</p>${body}`;
  const file = join(SH, name + ".html");
  await writeFile(file, html);
  const b = await chromium.launch();
  const c = await b.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  const p = await c.newPage();
  await p.goto(pathToFileURL(file).href, { waitUntil: "load" });
  await p.screenshot({ path: join(SH, name + ".png"), fullPage: true });
  await b.close();
}
const L2 = (f) => ["ar", "en"].map((l) => f(l)).join("");
await sheet("01-pages-first-screen", "Reports, 1440x900: every state (first screen)", "Arabic on the left, English on the right. The same glass, lights, type, rail and header as the Daily page. Synthetic data; the concept label stays visible.",
  `<div class="g" style="grid-template-columns:repeat(2,860px)">${STATES.map(([id, , cap]) => L2((l) => fig(`page-${id}-${l}`, 860, `<b>${id}</b> · ${l.toUpperCase()} · ${cap}`))).join("")}</div>`);
await sheet("02-pages-full", "Reports, 1440x900: the whole page (default and short history)", "Full-page captures: header, the period's four figures, the weekday x hour pattern, and the day-by-day table with CSV export.",
  `<div class="g" style="grid-template-columns:repeat(4,430px)">${["full", "short"].map((id) => L2((l) => fig(`page-${id}-${l}-full`, 430, `<b>${id}</b> · ${l.toUpperCase()}`))).join("")}</div>`, 1880);
const rings = (l) => { const r = log.frames[`pattern-short-${l}-2x`].rings, k = 900 / r.w; const ring = (b, n) => `<i class="ring" style="left:${b.x * k - 3}px;top:${b.y * k - 3}px;width:${b.w * k + 6}px;height:${b.h * k + 6}px"></i><i class="tag" style="left:${b.x * k + b.w * k / 2 - 9}px;top:${b.y * k - 22}px">${n}</i>`; return `<figure><div class="rel">${img(`pattern-short-${l}-2x`, 900)}${ring(r.closed, 1)}${ring(r.nodata, 2)}${ring(r.zero, 3)}${ring(r.low, 4)}</div><figcaption><b>${l.toUpperCase()}</b> · <b>1</b> closed · <b>2</b> no data · <b>3</b> genuine zero · <b>4</b> low, not zero. Short history: Friday before 2 PM closed (flat, the word); Thursday 10 AM - 2 PM no data (dotted, the words; a camera gap on the only Thursday); Saturday 6-7 AM a genuine zero (outlined, "0"). The rings are added on this sheet only.</figcaption></figure>`; };
await sheet("03-pattern-closed-nodata-zero", "The pattern: closed, no data and genuine zero, side by side", "Each reads differently in pixels and in text: closed and no data are merged cells with their words, zero is an outlined cell with 0, and every value is its cell's text (the grid is a real table). Hover, keyboard focus and a tap show the same readout.",
  `<div class="g" style="grid-template-columns:900px 900px">${rings("ar")}${rings("en")}${L2((l) => fig(`pattern-tip-${l}-2x`, 900, `<b>${l.toUpperCase()}</b> · readout on the no-data cells (last 7 days)`))}${L2((l) => fig(`pattern-tip-zero-${l}-2x`, 900, `<b>${l.toUpperCase()}</b> · readout on the genuine zero`))}${L2((l) => fig(`pattern-numbers-${l}-2x`, 900, `<b>${l.toUpperCase()}</b> · numbers switched on (cells mixed 80% with the card so chalk text keeps 4.7:1)`))}</div>`, 1880);
await sheet("04-week-over-week", "Week over week in both history states", "Last seven complete days (16 - 22 Sep) against the seven before, compared only when both have readings for 80% of their open minutes. Short history shows an honest empty state and no comparison value.",
  `<div class="g" style="grid-template-columns:repeat(2,628px)">${["full", "short"].map((s) => L2((l) => fig(`wow-${s}-${l}-2x`, 628, `<b>${s === "full" ? "enough history" : "short history"}</b> · ${l.toUpperCase()}`))).join("")}</div>`, 1840);
const TABLE = [["table-default", "default (newest first)"], ["table-hover", "hover on a row"], ["table-focus", "keyboard focus on a sortable header"], ["table-sorted", "selected: sorted by peak (aria-sort)"], ["table-gap-highest", "a camera gap and the period's highest peak, in words"], ["table-before-history", "days before the readings began: one merged row"], ["table-empty", "empty: a period with no readings, and the way back"]];
await sheet("05-table-states", "The table: states", "The system's data table, in Arabic (left) and English (right).", `<div class="g" style="grid-template-columns:repeat(2,880px)">${TABLE.map(([f, cap]) => L2((l) => fig(`${f}-${l}-2x`, 880, `<b>${cap}</b> · ${l.toUpperCase()}`))).join("")}</div>`);
const FORM = [["seg-default", "segmented: default, the selected period lifted"], ["seg-hover", "segmented: hover"], ["seg-focus", "segmented: keyboard focus"], ["seg-selected-7d", "segmented: another selection"], ["switch-off", "switch: off"], ["switch-hover", "switch: hover"], ["switch-focus", "switch: keyboard focus"], ["switch-on", "switch: on"], ["button-default", "button: default"], ["button-hover", "button: hover"], ["button-focus", "button: keyboard focus"]];
const FIELDS = [["picker-focus", "picker: focus on the chosen end"], ["picker-hover", "picker: hover"], ["picker-start", "picker: start alone"], ["export-working", "picker and primary button: disabled while working"]];
await sheet("06-form-states", "The form: states", "Controls are 44 px tall. Focus is a 2 px chalk ring; the date grid uses a 2 px offset. Dates are picked with the shared picker, never typed.",
  `<h2>Controls</h2><div class="g" style="grid-template-columns:repeat(2,860px)">${FORM.map(([f, cap]) => L2((l) => fig(`${f}-${l}-2x`, 860, `<b>${cap}</b> · ${l.toUpperCase()}`))).join("")}</div><h2>Fields</h2><div class="g" style="grid-template-columns:repeat(2,560px)">${FIELDS.map(([f, cap]) => L2((l) => fig(`${f}-${l}-2x`, 560, `<b>${cap}</b> · ${l.toUpperCase()}`))).join("")}</div>`, 1800);
const DLG = [["export-idle", "export: ready (focus on the primary action)"], ["export-one-day", "export: a start alone is a one-day file"], ["export-working", "export: working (busy, picker disabled, focus on Cancel)"], ["export-done", "export: done (a real CSV, saved from the page)"], ["export-failed", "export: failed (role=alert, focus on Try again)"]];
await sheet("07-dialog-states", "The dialog: states", "One pattern: showModal, a scrim and a glass panel; focus goes in, stays in (Tab wraps), Escape and the scrim close it, and focus returns to the control that opened it.",
  `<div class="g" style="grid-template-columns:repeat(2,860px)">${L2((l) => fig(`dialog-range-${l}`, 860, `<b>date range, over the page</b> · ${l.toUpperCase()}`))}${L2((l) => fig(`dialog-export-${l}`, 860, `<b>export, over the page</b> · ${l.toUpperCase()}`))}</div><div class="g" style="grid-template-columns:repeat(2,560px);margin-top:22px">${DLG.map(([f, cap]) => L2((l) => fig(`${f}-${l}-2x`, 560, `<b>${cap}</b> · ${l.toUpperCase()}`))).join("")}</div>`);
for (const [w, h] of [[390, 844], [320, 568]]) {
  const P = [["table", "table (recomposed: notes fold into their own row)"], ["table-sorted", "table sorted by entries"], ["range-form", "date range: the segmented control"], ["range-dialog", "date range: bottom sheet"], ["range-dialog-start", "date range: start alone"], ["export-dialog", "export: bottom sheet"], ["export-done", "export: done"]];
  await sheet(`08-phone-${w}`, `Phone feasibility check, ${w}x${h}`, "The table, form and dialog system only (not a phone design of Reports). The rail is set aside below 721 px for this check. isMobile, 2x.",
    `<div class="g" style="grid-template-columns:repeat(4,${w}px)">${P.map(([f, cap]) => L2((l) => fig(`phone-${w}-${f}-${l}`, w, `<b>${cap}</b> · ${l.toUpperCase()}`))).join("")}</div>`, w * 4 + 26 * 3 + 64);
}
await sheet("09-daily-links-to-reports", "The Daily page: the rail's Reports item is now a link", "The rail open with keyboard focus on Reports. Its href carries the language; on Reports the Daily item links back. Every Daily still frame capture.mjs records is compared byte for byte with 8926193 separately.",
  `<div class="g" style="grid-template-columns:repeat(2,860px)">${L2((l) => fig(`daily-rail-link-${l}`, 860, `<b>${l.toUpperCase()}</b> · href ${log.frames[`daily-rail-link-${l}`].href}`))}</div>`);

await writeFile(join(OUT, "reports-log.json"), JSON.stringify(log, null, 1));
console.log(`frames ${Object.keys(log.frames).length}; failures ${log.failures.length}`);
for (const f of log.failures) console.log("  " + f);
for (const [k, v] of Object.entries(log.phone)) console.log(`phone ${k}: doc ${v.docScrollW}/${v.clientW}, table ${v.tableW}/${v.wrapW}, small targets ${v.smallTargets.length ? v.smallTargets.join(", ") : "none"}`);
process.exitCode = log.failures.length ? 1 : 0;
