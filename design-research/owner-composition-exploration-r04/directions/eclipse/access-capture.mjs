// Eclipse Access capture, the fix round (DECISIONS item 34). Serves this folder on 127.0.0.1 (port 3176 unless
// --port=N; never 3173, capture.mjs's, or 3174, reserved), renders the Access frames with the worktree's Playwright
// chromium (a fresh context per frame, reduced motion), checks each one, and writes them numbered the same way in both
// languages. It never writes into this repository: the output folder is required and must be outside it.
//   node design-research/owner-composition-exploration-r04/directions/eclipse/access-capture.mjs <outDir> [--port=3176] [--only=1,2,3,4,5] [--lang=ar|en] [--match=<part of a frame's name>]
// Writes <outDir>/crops/<n>-<nn>-<what>-<size>-<lang>.png and <outDir>/access-log.json:
//   1-  the page at rest at each size: 1440 x 900, 1024 x 768, 768 x 1024 and 390 x 844 (the first screen), and the
//       whole page at 1440 and 390
//   2-  each changed element against its range, at 1440, 1024, 768 and 390: the access records card (its records, a
//       change's record on top, none yet, its own failure, loading, the longest names; on a phone the way to the
//       records instead), the front desk's card in each state of its code, the owners (actions under each name; one
//       active, the longest and shortest names), the page's loading arrival (no shift) and first-load error with the
//       two halves, the quiet button (hover, focus), the code field (empty, typed, each
//       refusal), the one-time view (the shortest code, sixteen mixed and sixteen of the widest characters, copied, not
//       copied, saving, failed, refused), and every dialog as the phone shows it
//   3-  the code's change step by step at 1440 and 390: typed, the one-time view, copied, "I've saved it" (saving, then
//       done with the record on top), and "Cancel change" (nothing changed); then the same for creating a code
//   4-  deactivate and reactivate among eight owners, before and after, at 1440, 768 and 390: the row keeps its place
//   5-  the checked sizes: 320 x 568, the 200% zoom of 1440 x 900 (720 x 450 at 2x), 721 x 1024 and file://, with the
//       dialogs that change most with width
// It exits 1 if a check fails: a console message or page error, a font file fetched twice in one load, a request off
// the page's origin, a layout shift after the first paint before any input, a sideways page scroll, an element outside
// the viewport's width, a box whose content spills, an interactive target under 44 px, a row that moved, a record not
// on top, a cancel that changed something, or a secret left behind: the typed code anywhere in the page (the DOM, the
// hooks, the URL, a field) once its view closed, or a password still in a field or the DOM once its change succeeded.
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_ARG = process.argv.slice(2).find((a) => !a.startsWith("--"));
if (!OUT_ARG) throw new Error("access-capture.mjs needs an output folder outside the repository");
const OUT = resolve(OUT_ARG);
if ((OUT + sep).toLowerCase().startsWith(resolve(HERE, "../../../..").toLowerCase() + sep)) throw new Error("the output folder must be outside the repository worktree");
const PORT = Number((process.argv.find((a) => a.startsWith("--port=")) || "--port=3176").slice(7));
if ([3173, 3174].includes(PORT)) throw new Error("ports 3173 and 3174 belong to other captures");
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) || "").slice(7).split(",").filter(Boolean);
const want = (n) => !ONLY.length || ONLY.includes(String(n));
const LANGS_ARG = (process.argv.find((a) => a.startsWith("--lang=")) || "").slice(7);
const LANGS = LANGS_ARG ? [LANGS_ARG] : ["ar", "en"];
// Only the frames whose name contains this (to re-shoot a few after a change).
const MATCH = (process.argv.find((a) => a.startsWith("--match=")) || "").slice(8);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const FILE_BASE = pathToFileURL(join(HERE, "access.html")).href;
const CROPS = join(OUT, "crops");
await mkdir(CROPS, { recursive: true });
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".png": "image/png", ".json": "application/json", ".woff2": "font/woff2" };
const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", ORIGIN);
  const file = normalize(join(HERE, decodeURIComponent(url.pathname === "/" ? "/access.html" : url.pathname)));
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
    if (el.closest("[hidden], .sr-only, dialog:not([open]), .rail, .hb-res, .acc-user")) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const r = el.getBoundingClientRect();
    if (r.width && (r.right > vw + 0.5 || r.left < -0.5)) out.push(`outside the viewport: ${el.id ? "#" + el.id : el.className?.baseVal ?? el.className ?? el.tagName} ${Math.round(r.left)}..${Math.round(r.right)}`);
  }
  for (const el of document.querySelectorAll(".head, .acc-tools, .acc-grid, .acc-keys, .acc-head, .acc-id, .acc-title, .acc-acts, .prs, .prs-id, .prs-line, .prs-mail, .prs-acts, .rec-list, .rec-a, .rec-txt, .done, .acc-alert, .acc-msg, .dlg-panel, .dlg-head, .dlg-body, .dlg-foot, .acc-sec, .acc-code, .acc-field, .acc-box, .alert")) {
    if (el.closest("[hidden], dialog:not([open])")) continue;
    if (el.matches(".dlg-body")) continue;                  // a dialog's body may scroll inside a short sheet
    if (getComputedStyle(el).display === "none" || !el.getClientRects().length) continue;
    // The records' links reach 12 px past the text on each side by design ("View all" and each row's hover and ring),
    // into the card's 24 px padding; anything beyond that is a spill.
    const allow = el.matches(".rec-head, .rec-list") ? 12 : 0;
    if (el.scrollWidth > el.clientWidth + allow + 1) out.push(`spills: ${el.className} by ${el.scrollWidth - el.clientWidth}px`);
  }
  const scope = document.querySelector("dialog[open]") || document;
  for (const el of scope.querySelectorAll("button, a[href], select, input:not([type=hidden]), textarea")) {
    if (el.closest("[hidden], .rail, .sr-only") || el.matches(".skip, .rail-item, .acc-user")) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || r.bottom < 0 || r.top > innerHeight) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    if (r.height < 43.5 || r.width < 43.5) out.push(`small target: ${el.id ? "#" + el.id : el.className || el.tagName} ${Math.round(r.width)}x${Math.round(r.height)}`);
  }
  return [...new Set(out)].slice(0, 12);
};

async function open(q, { width = 1440, height = 900, scale = 1, phone = false, file = false, clipboard = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, isMobile: phone, hasTouch: phone, reducedMotion: "reduce", colorScheme: "dark" });
  if (clipboard && !file) await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: ORIGIN });
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
  await page.goto(file ? `${FILE_BASE}?${q}` : `${ORIGIN}/access.html?${q}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__access?.ready === true);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(120);
  const cls0 = await page.evaluate(() => +window.__cls.toFixed(5));
  return { context, page, errors, fonts, off, cls0, secrets: [], checks: [], notes: {} };
}
async function finish(name, o, extra = {}, { problems = true } = {}) {
  const { page, errors, fonts, off, cls0, secrets, checks, notes } = o;
  const found = problems ? await page.evaluate(PROBLEMS) : [];
  const cls = await page.evaluate(() => +window.__cls.toFixed(5));
  const maxFont = Math.max(0, ...fonts.values());
  const rec = { errors, maxFontFetch: maxFont, offOrigin: off, clsAtRest: cls0, clsAfter: cls, problems: found, secrets, checks, notes, ...extra };
  log.frames[name] = rec;
  const bad = [];
  if (errors.length) bad.push("errors: " + errors.join(" / "));
  if (maxFont > 1) bad.push("font fetched twice");
  if (off.length) bad.push("off-origin request");
  if (cls0 > 0) bad.push(`layout shift at rest ${cls0}`);
  if (extra.clsMustBeZero && cls > 0) bad.push(`layout shift ${cls}`);
  if (found.length) bad.push(found.join("; "));
  if (secrets.length) bad.push("secret left behind: " + secrets.join("; "));
  if (checks.length) bad.push(checks.join("; "));
  if (bad.length) log.failures.push(`${name}: ${bad.join(" | ")}`);
  return rec;
}
const path = (name) => join(CROPS, name + ".png");
const SIZES = {
  1440: { width: 1440, height: 900 }, 1024: { width: 1024, height: 768 }, 768: { width: 768, height: 1024 },
  390: { width: 390, height: 844, scale: 2, phone: true }, 320: { width: 320, height: 568, scale: 2, phone: true },
  zoom: { width: 720, height: 450, scale: 2 },
};
async function shot(name, q, { act, full = false, clip, problems = true, clsMustBeZero = false, ...opts } = {}) {
  if (MATCH && !MATCH.split(",").some((m) => name.includes(m))) return null;
  const o = await open(q, opts);
  if (act) await act(o.page, o);
  await o.page.waitForTimeout(120);
  const c = typeof clip === "function" ? await clip(o.page) : clip;
  const inView = Boolean(c && c.viewport);
  const cc = c ? { x: c.x, y: c.y, width: c.width, height: c.height } : undefined;
  await o.page.screenshot({ path: path(name), fullPage: full || (Boolean(c) && !inView), clip: cc });
  const rec = await finish(name, o, { q, clsMustBeZero }, { problems });
  await o.context.close();
  return rec;
}
// A crop of elements in page coordinates (so a tall one is never cut at the viewport), with a strip of what stands
// around them: pad px on every side, within the page.
const around = (sel, pad = 24) => async (page) => page.evaluate(([s, p]) => {
  const els = s.split("||").map((x) => document.querySelector(x)).filter((e) => e && e.getClientRects().length);
  if (!els.length) throw new Error("no element for " + s);
  const rs = els.map((e) => e.getBoundingClientRect());
  const x0 = Math.max(0, Math.min(...rs.map((r) => r.left)) - p), x1 = Math.min(document.documentElement.clientWidth, Math.max(...rs.map((r) => r.right)) + p);
  const y0 = Math.max(0, Math.min(...rs.map((r) => r.top)) + scrollY - p), y1 = Math.max(...rs.map((r) => r.bottom)) + scrollY + p;
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}, [sel, pad]);
// A crop of a dialog's panel in viewport coordinates: the dialog is fixed, and a full-page capture enlarges the
// viewport, which moves a bottom sheet away from the box measured before it.
const aroundFixed = (sel, pad = 16) => async (page) => page.evaluate(([s, p]) => {
  const e = document.querySelector(s);
  if (!e) throw new Error("no element for " + s);
  const r = e.getBoundingClientRect(), vw = document.documentElement.clientWidth, vh = innerHeight;
  const x0 = Math.max(0, r.left - p), y0 = Math.max(0, r.top - p), x1 = Math.min(vw, r.right + p), y1 = Math.min(vh, r.bottom + p);
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0, viewport: true };
}, [sel, pad]);
const PANEL = "dialog[open] .dlg-panel:not([hidden])";

/* ---- steps */
const wait = (p, ms) => p.waitForTimeout(ms);
const press = async (p, sel, phone) => { if (phone) await p.tap(sel); else await p.click(sel); };
// After an action: the synthetic answer arrives at 700 ms; "I've saved it" ignores a press in the view's first 700 ms.
const ANSWER = 1000, VIEW_GUARD = 800;
const SHORT = { ar: "عادت إلى الدراسة", en: "Back to university" };
const NEWBIE = { name: { ar: "سارة", en: "سارة" }, email: "sara.alotaibi@example.com" };
const PW = "correct-horse-battery-staple";
const NEW_PW = "a-new-password-for-noura";
// The codes: the shortest the field takes, a usual one, sixteen mixed, sixteen of the widest letters.
const CODE = { short: "desk2026", usual: "Fitway2026", mixed16: "FitwayRiyadh2026", wide16: "WWWWWWWWWWWWWWWW" };
// The code's two steps: typed, then the one-time view.
async function typeCode(p, code, ph, mode = "change") {
  await press(p, `[data-key="${mode === "create" ? "pinCreate" : "pinChange"}"]`, ph);
  await p.fill("#pin-code", code);
}
async function toView(p, code, ph, mode) { await typeCode(p, code, ph, mode); await press(p, "#pin-confirm .acc-do", ph); }
// Once the view closed, the typed code is nowhere: not in the DOM, the hooks, the URL or a field.
async function codeGone(o, code) {
  const left = await o.page.evaluate((x) => {
    const where = [];
    if (document.documentElement.outerHTML.includes(x) || document.body.innerText.includes(x)) where.push("DOM");
    if (JSON.stringify(window.__access).includes(x)) where.push("hooks");
    if (location.href.includes(x)) where.push("URL");
    if ([...document.querySelectorAll("input, textarea")].some((i) => i.value.includes(x))) where.push("a field");
    return where;
  }, code);
  if (left.length) o.secrets.push(`code still in ${left.join(", ")}`);
}
async function passwordGone(o, pw) {
  const left = await o.page.evaluate((x) => [...document.querySelectorAll("input, textarea")].some((i) => i.value === x) || document.documentElement.outerHTML.includes(x), pw);
  if (left) o.secrets.push("a password is still in the page after its change succeeded");
}
// A row's place among the owners, before and after a change: it must not move.
const rowIndex = (p, id) => p.evaluate((x) => window.__access.owners.findIndex((o) => o.id === x), id);
const rowTop = (p, id) => p.evaluate((x) => Math.round(document.querySelector(`.prs[data-id="${x}"]`).getBoundingClientRect().top + scrollY), id);

try {
  /* ---- 1: the page at rest at each size */
  if (want(1)) for (const lang of LANGS) {
    const L = `lang=${lang}`;
    for (const [n, size] of [["01", 1440], ["02", 1024], ["03", 768], ["04", 390]]) await shot(`1-${n}-rest-${size}-${lang}`, L, SIZES[size]);
    await shot(`1-05-rest-full-1440-${lang}`, L, { ...SIZES[1440], full: true });
    await shot(`1-06-rest-full-390-${lang}`, L, { ...SIZES[390], scale: 1, full: true });
  }

  /* ---- 2: each changed element against its range */
  if (want(2)) for (const lang of LANGS) {
    const L = `lang=${lang}`;
    for (const size of [1440, 1024, 768, 390]) {
      const S = SIZES[size], ph = Boolean(S.phone);
      const rec = around("#records", 16), desk = around("#desk", 16), owners = around("#owners", 16), panel = aroundFixed(PANEL, 16);
      // The records card (from 721 px); on a phone the way to the records under the header instead.
      if (!ph) {
        await shot(`2-01-records-${size}-${lang}`, L, { ...S, clip: rec });
        await shot(`2-02-records-after-a-change-${size}-${lang}`, L, { ...S, act: async (p, o) => { await press(p, '[data-key="off:o2"]', ph); await p.fill("#off-reason", SHORT[lang]); await press(p, "#off .acc-do", ph); await wait(p, ANSWER); await p.mouse.move(0, 0); const r = await p.evaluate(() => window.__access.records); if (r.acts[0] !== "off" || r.ids.length !== 8) o.checks.push(`the change's record is not on top: ${JSON.stringify(r)}`); }, clip: around("#records||#owners", 16) });
        await shot(`2-03-records-none-${size}-${lang}`, `${L}&records=none`, { ...S, clip: rec });
        await shot(`2-04-records-error-${size}-${lang}`, `${L}&records=error`, { ...S, clip: rec });
        await shot(`2-05-records-retried-${size}-${lang}`, `${L}&records=error`, { ...S, act: async (p) => { await p.click("#rec-retry"); await wait(p, 1500); await p.mouse.move(0, 0); }, clip: rec });
        await shot(`2-06-records-loading-${size}-${lang}`, `${L}&state=loading`, { ...S, act: (p) => wait(p, 450) });
        await shot(`2-07-records-longest-names-${size}-${lang}`, `${L}&case=long`, { ...S, clip: rec });
        await shot(`2-08-records-row-hover-${size}-${lang}`, L, { ...S, act: async (p) => { await p.hover('.rec-a[data-record="42"]'); }, clip: rec });
        await shot(`2-09-records-row-focus-${size}-${lang}`, L, { ...S, act: async (p) => { await p.focus("#rec-all"); await p.keyboard.press("Tab"); }, clip: rec });
      } else {
        await shot(`2-01-records-link-${size}-${lang}`, L, { ...S, clip: around(".head||#tools", 16) });
      }
      // The front desk's card in each state of its code: the quiet button's box beside "Change code"; "Create code".
      await shot(`2-10-desk-active-${size}-${lang}`, L, { ...S, clip: desk });
      await shot(`2-11-desk-never-set-${size}-${lang}`, `${L}&pin=none`, { ...S, clip: desk });
      await shot(`2-12-desk-deactivated-${size}-${lang}`, `${L}&pin=off`, { ...S, clip: desk });
      // The owners: each person's actions under the name; the quiet button's box on every active row.
      await shot(`2-13-owners-${size}-${lang}`, L, { ...S, clip: owners });
      await shot(`2-14-owners-one-active-${size}-${lang}`, `${L}&owners=last`, { ...S, clip: owners });
      await shot(`2-15-owners-longest-${size}-${lang}`, `${L}&case=long`, { ...S, clip: owners });
      await shot(`2-16-owners-shortest-${size}-${lang}`, `${L}&case=short`, { ...S, clip: owners });
      // The page's own states with the two halves: the loading's arrival moves nothing; the first load's failure is one
      // message in place of both halves, and its retry arrives.
      await shot(`2-19-loading-arrived-${size}-${lang}`, `${L}&state=loading&arrive=700`, { ...S, act: (p) => wait(p, 1400), clsMustBeZero: true });
      await shot(`2-27-page-error-${size}-${lang}`, `${L}&state=error`, S);
      await shot(`2-28-page-error-retried-${size}-${lang}`, `${L}&state=error`, { ...S, act: async (p) => { await p.keyboard.press("Enter"); await wait(p, 1500); } });
      // The quiet button: hover (not on touch) and the keyboard's ring.
      if (!ph) await shot(`2-17-quiet-hover-${size}-${lang}`, L, { ...S, act: (p) => p.hover('[data-key="off:o2"]'), clip: around('.prs[data-id="o2"]', 16) });
      await shot(`2-18-quiet-focus-${size}-${lang}`, L, { ...S, act: async (p) => { await p.focus('[data-key="reset:o2"]'); await p.keyboard.press("Tab"); }, clip: around('.prs[data-id="o2"]', 16) });
      // The code field: empty, typed, each refusal; the create form's title.
      await shot(`2-20-code-empty-${size}-${lang}`, L, { ...S, act: (p) => press(p, '[data-key="pinChange"]', ph), clip: panel });
      await shot(`2-21-code-typed-${size}-${lang}`, L, { ...S, act: (p) => typeCode(p, CODE.usual, ph), clip: panel });
      await shot(`2-22-code-refused-empty-${size}-${lang}`, L, { ...S, act: async (p) => { await press(p, '[data-key="pinChange"]', ph); await press(p, "#pin-confirm .acc-do", ph); }, clip: panel });
      await shot(`2-23-code-refused-letters-${size}-${lang}`, L, { ...S, act: async (p) => { await typeCode(p, "رمز2026abc", ph); await press(p, "#pin-confirm .acc-do", ph); }, clip: panel });
      await shot(`2-24-code-refused-short-${size}-${lang}`, L, { ...S, act: async (p) => { await typeCode(p, "abc12", ph); await press(p, "#pin-confirm .acc-do", ph); }, clip: panel });
      await shot(`2-25-code-arabic-digits-${size}-${lang}`, L, { ...S, act: async (p, o) => { await press(p, '[data-key="pinChange"]', ph); await p.locator("#pin-code").pressSequentially("desk٢٠٢٦"); const v = await p.inputValue("#pin-code"); if (v !== "desk2026") o.checks.push(`Arabic-Indic digits not made Western: ${v}`); }, clip: panel });
      await shot(`2-26-code-create-${size}-${lang}`, `${L}&pin=none`, { ...S, act: (p) => typeCode(p, CODE.usual, ph, "create"), clip: panel });
      // The one-time view across the codes' range, and its states.
      for (const [n, k] of [["30", "short"], ["31", "usual"], ["32", "mixed16"], ["33", "wide16"]]) {
        await shot(`2-${n}-view-${k}-${size}-${lang}`, L, { ...S, act: async (p, o) => { await toView(p, CODE[k], ph); o.notes.codeFont = await p.evaluate(() => { const e = document.querySelector("#pin-code-shown"); return [getComputedStyle(e).fontSize, Math.round(e.getBoundingClientRect().height)]; }); }, clip: panel });
      }
      await shot(`2-34-view-copied-${size}-${lang}`, L, { ...S, clipboard: true, act: async (p, o) => { await toView(p, CODE.usual, ph); await press(p, "#pin-copy", ph); await wait(p, 150); const got = await p.evaluate(() => navigator.clipboard.readText().catch(() => "?")); if (got !== CODE.usual) o.checks.push(`the clipboard holds ${got}`); }, clip: panel });
      await shot(`2-35-view-not-copied-${size}-${lang}`, L, { ...S, act: async (p) => { await toView(p, CODE.usual, ph); await p.evaluate(() => { navigator.clipboard.writeText = () => Promise.reject(new Error("denied")); document.execCommand = () => false; }); await press(p, "#pin-copy", ph); await wait(p, 150); }, clip: panel });
      await shot(`2-36-view-saving-${size}-${lang}`, `${L}&hold=1`, { ...S, act: async (p) => { await toView(p, CODE.usual, ph); await wait(p, VIEW_GUARD); await press(p, "#pin-saved", ph); }, clip: panel });
      await shot(`2-37-view-failed-${size}-${lang}`, `${L}&fail=1`, { ...S, act: async (p) => { await toView(p, CODE.usual, ph); await wait(p, VIEW_GUARD); await press(p, "#pin-saved", ph); await wait(p, ANSWER); }, clip: panel });
      await shot(`2-38-view-refused-${size}-${lang}`, `${L}&refuse=staff_pin_not_active`, { ...S, act: async (p) => { await toView(p, CODE.usual, ph); await wait(p, VIEW_GUARD); await press(p, "#pin-saved", ph); await wait(p, ANSWER); }, clip: panel });
      await shot(`2-39-view-create-${size}-${lang}`, `${L}&pin=none`, { ...S, act: (p) => toView(p, CODE.usual, ph, "create"), clip: panel });
    }
    // Every dialog as the phone shows it (390 x 844, touch), whole screen.
    const S = SIZES[390], tap = (p, sel) => p.tap(sel);
    await shot(`2-40-phone-code-form-390-${lang}`, L, { ...S, act: (p) => typeCode(p, CODE.usual, true) });
    await shot(`2-41-phone-code-view-390-${lang}`, L, { ...S, act: (p) => toView(p, CODE.usual, true) });
    await shot(`2-42-phone-pin-off-390-${lang}`, L, { ...S, act: async (p) => { await tap(p, '[data-key="pinOff"]'); await p.fill("#pinoff-reason", SHORT[lang]); } });
    await shot(`2-43-phone-add-390-${lang}`, L, { ...S, act: async (p) => { await tap(p, '[data-key="add"]'); await p.fill("#add-name", NEWBIE.name[lang]); await p.fill("#add-email", NEWBIE.email); await p.fill("#add-pw", PW); } });
    await shot(`2-44-phone-reset-390-${lang}`, L, { ...S, act: async (p) => { await tap(p, '[data-key="reset:o2"]'); await p.fill("#reset-pw", NEW_PW); } });
    await shot(`2-45-phone-off-390-${lang}`, L, { ...S, act: async (p) => { await tap(p, '[data-key="off:o2"]'); await p.fill("#off-reason", SHORT[lang]); } });
    await shot(`2-46-phone-on-390-${lang}`, L, { ...S, act: (p) => tap(p, '[data-key="on:o3"]') });
    await shot(`2-47-phone-mine-390-${lang}`, L, { ...S, act: async (p) => { await tap(p, '[data-key="mine:o1"]'); await p.fill("#mine-current", PW); await p.fill("#mine-new", NEW_PW); } });
    await shot(`2-48-phone-code-create-390-${lang}`, `${L}&pin=none`, { ...S, act: (p) => typeCode(p, CODE.usual, true, "create") });
    await shot(`2-49-phone-added-390-${lang}`, L, { ...S, act: async (p, o) => { await tap(p, '[data-key="add"]'); await p.fill("#add-name", NEWBIE.name[lang]); await p.fill("#add-email", NEWBIE.email); await p.fill("#add-pw", PW); await tap(p, "#add .acc-do"); await wait(p, ANSWER); await passwordGone(o, PW); } });
  }

  /* ---- 3: the code's change step by step, at 1440 and 390 */
  if (want(3)) for (const lang of LANGS) for (const size of [1440, 390]) {
    const S = SIZES[size], ph = Boolean(S.phone), L = `lang=${lang}`;
    const viewOpen = (p) => p.evaluate(() => window.__access.viewOpen && document.querySelector("#dlg-pin").open);
    await shot(`3-01-change-typed-${size}-${lang}`, L, { ...S, act: (p) => typeCode(p, CODE.usual, ph) });
    // The view: Escape (twice) and a tap or click outside leave it open, the code still there.
    await shot(`3-02-change-view-${size}-${lang}`, L, { ...S, act: async (p, o) => { await toView(p, CODE.usual, ph); await p.keyboard.press("Escape"); await p.keyboard.press("Escape"); if (ph) await p.touchscreen.tap(195, 60); else await p.mouse.click(40, 860); await wait(p, 150); if (!(await viewOpen(p))) o.checks.push("the view closed without one of its actions"); } });
    await shot(`3-03-change-copied-${size}-${lang}`, L, { ...S, clipboard: true, act: async (p) => { await toView(p, CODE.usual, ph); await press(p, "#pin-copy", ph); await wait(p, 150); } });
    await shot(`3-04-change-saving-${size}-${lang}`, `${L}&hold=1`, { ...S, act: async (p) => { await toView(p, CODE.usual, ph); await wait(p, VIEW_GUARD); await press(p, "#pin-saved", ph); } });
    await shot(`3-05-change-saved-${size}-${lang}`, L, { ...S, act: async (p, o) => { await toView(p, CODE.usual, ph); await wait(p, VIEW_GUARD); await press(p, "#pin-saved", ph); await wait(p, ANSWER); await codeGone(o, CODE.usual); const r = await p.evaluate(() => window.__access.records.acts[0]); if (r !== "pinChange") o.checks.push(`the change's record is not on top (${r})`); await p.mouse.move(0, 0); } });
    await shot(`3-06-change-cancelled-${size}-${lang}`, L, { ...S, act: async (p, o) => { await toView(p, CODE.usual, ph); await press(p, "#pin-undo", ph); await wait(p, 300); await codeGone(o, CODE.usual); const st = await p.evaluate(() => ({ open: document.querySelector("#dlg-pin").open, notice: window.__access.notice, top: window.__access.records.ids[0], desk: window.__access.desk, focus: document.activeElement?.dataset?.key })); if (st.open || st.notice || st.top !== 54 || st.desk !== "active") o.checks.push(`cancel changed something: ${JSON.stringify(st)}`); o.notes.focus = st.focus; } });
    await shot(`3-07-create-typed-${size}-${lang}`, `${L}&pin=none`, { ...S, act: (p) => typeCode(p, CODE.short, ph, "create") });
    await shot(`3-08-create-view-${size}-${lang}`, `${L}&pin=none`, { ...S, act: (p) => toView(p, CODE.short, ph, "create") });
    await shot(`3-09-create-saved-${size}-${lang}`, `${L}&pin=none`, { ...S, act: async (p, o) => { await toView(p, CODE.short, ph, "create"); await wait(p, VIEW_GUARD); await press(p, "#pin-saved", ph); await wait(p, ANSWER); await codeGone(o, CODE.short); await p.mouse.move(0, 0); } });
    await shot(`3-10-create-cancelled-${size}-${lang}`, `${L}&pin=none`, { ...S, act: async (p, o) => { await toView(p, CODE.short, ph, "create"); await press(p, "#pin-undo", ph); await wait(p, 300); await codeGone(o, CODE.short); const d = await p.evaluate(() => window.__access.desk); if (d !== "none") o.checks.push(`cancel created a code (${d})`); } });
  }

  /* ---- 4: deactivate and reactivate among eight owners, before and after: the row keeps its place */
  if (want(4)) for (const lang of LANGS) for (const size of [1440, 768, 390]) {
    const S = SIZES[size], ph = Boolean(S.phone), L = `lang=${lang}&owners=many`;
    const full = { ...S, scale: 1, full: true };
    await shot(`4-01-eight-before-${size}-${lang}`, L, full);
    await shot(`4-02-deactivate-dialog-${size}-${lang}`, L, { ...S, act: async (p) => { await p.locator('[data-key="off:o5"]').scrollIntoViewIfNeeded(); await press(p, '[data-key="off:o5"]', ph); await p.fill("#off-reason", SHORT[lang]); } });
    await shot(`4-03-deactivated-after-${size}-${lang}`, L, { ...full, act: async (p, o) => {
      const i0 = await rowIndex(p, "o5"), y0 = await rowTop(p, "o5");
      await p.locator('[data-key="off:o5"]').scrollIntoViewIfNeeded(); await press(p, '[data-key="off:o5"]', ph); await p.fill("#off-reason", SHORT[lang]); await press(p, "#off .acc-do", ph); await wait(p, ANSWER);
      const i1 = await rowIndex(p, "o5"), y1 = await rowTop(p, "o5");
      if (i0 !== i1 || y0 !== y1) o.checks.push(`the row moved: index ${i0}->${i1}, y ${y0}->${y1}`);
      o.notes.row = { i0, i1, y0, y1 };
      // The whole page from its top, so the fixed rail and bar stand where they do at rest.
      await p.mouse.move(0, 0);
      await p.evaluate(() => scrollTo(0, 0));
    } });
    await shot(`4-04-deactivated-after-view-${size}-${lang}`, L, { ...S, act: async (p) => { await p.locator('[data-key="off:o5"]').scrollIntoViewIfNeeded(); await press(p, '[data-key="off:o5"]', ph); await p.fill("#off-reason", SHORT[lang]); await press(p, "#off .acc-do", ph); await wait(p, ANSWER); await p.mouse.move(0, 0); } });
    await shot(`4-05-reactivated-after-${size}-${lang}`, L, { ...full, act: async (p, o) => {
      const i0 = await rowIndex(p, "o7"), y0 = await rowTop(p, "o7");
      await p.locator('[data-key="on:o7"]').scrollIntoViewIfNeeded(); await press(p, '[data-key="on:o7"]', ph); await press(p, "#on .acc-do", ph); await wait(p, ANSWER);
      const i1 = await rowIndex(p, "o7"), y1 = await rowTop(p, "o7");
      if (i0 !== i1 || y0 !== y1) o.checks.push(`the row moved: index ${i0}->${i1}, y ${y0}->${y1}`);
      o.notes.row = { i0, i1, y0, y1 };
      // The whole page from its top, so the fixed rail and bar stand where they do at rest.
      await p.mouse.move(0, 0);
      await p.evaluate(() => scrollTo(0, 0));
    } });
    await shot(`4-06-reactivated-after-view-${size}-${lang}`, L, { ...S, act: async (p) => { await p.locator('[data-key="on:o7"]').scrollIntoViewIfNeeded(); await press(p, '[data-key="on:o7"]', ph); await press(p, "#on .acc-do", ph); await wait(p, ANSWER); await p.mouse.move(0, 0); } });
  }

  /* ---- 5: the checked sizes, and file:// */
  if (want(5)) for (const lang of LANGS) {
    const L = `lang=${lang}`;
    await shot(`5-01-rest-320-${lang}`, L, { ...SIZES[320], scale: 1, full: true });
    await shot(`5-02-rest-zoom200-${lang}`, L, { ...SIZES.zoom, full: true, scale: 1 });
    await shot(`5-03-rest-file-1440-${lang}`, L, { ...SIZES[1440], file: true });
    await shot(`5-04-rest-721-${lang}`, L, { width: 721, height: 1024 });
    await shot(`5-05-code-form-refused-320-${lang}`, L, { ...SIZES[320], act: async (p) => { await typeCode(p, "abc12", true); await p.tap("#pin-confirm .acc-do"); } });
    await shot(`5-06-view-wide16-320-${lang}`, L, { ...SIZES[320], act: (p) => toView(p, CODE.wide16, true) });
    await shot(`5-07-view-mixed16-320-${lang}`, L, { ...SIZES[320], act: (p) => toView(p, CODE.mixed16, true) });
    await shot(`5-08-view-zoom200-${lang}`, L, { ...SIZES.zoom, act: (p) => toView(p, CODE.usual, false) });
    await shot(`5-09-view-copied-file-1440-${lang}`, L, { ...SIZES[1440], file: true, act: async (p, o) => { await toView(p, CODE.usual, false); await p.click("#pin-copy"); await wait(p, 150); const st = await p.evaluate(() => document.querySelector("#pin-copy").dataset.state); if (st !== "1") o.checks.push(`copy from file:// did not report copied (${st})`); } });
    await shot(`5-10-saved-file-1440-${lang}`, L, { ...SIZES[1440], file: true, act: async (p, o) => { await toView(p, CODE.usual, false); await wait(p, VIEW_GUARD); await p.click("#pin-saved"); await wait(p, ANSWER); await codeGone(o, CODE.usual); await p.mouse.move(0, 0); } });
    await shot(`5-11-eight-owners-320-${lang}`, `${L}&owners=many`, { ...SIZES[320], scale: 1, full: true });
  }
} finally {
  await browser.close();
  server.close();
  await writeFile(join(OUT, "access-log.json"), JSON.stringify(log, null, 2));
  console.log(`${Object.keys(log.frames).length} frames, ${log.failures.length} failing`);
  for (const f of log.failures) console.log("  " + f);
  if (log.failures.length) process.exitCode = 1;
}
