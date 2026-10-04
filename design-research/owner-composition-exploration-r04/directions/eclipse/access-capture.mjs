// Eclipse Access capture. Serves this folder on 127.0.0.1 (port 3177 unless --port=N; never 3173, capture.mjs's, 3174,
// reserved, or 3176, Activity log's), renders the Access frames with the worktree's Playwright chromium (a fresh context
// per frame, reduced motion), checks each one, and writes them numbered the same way in both languages. It never writes
// into this repository: the output folder is required and must be outside it.
//   node design-research/owner-composition-exploration-r04/directions/eclipse/access-capture.mjs <outDir> [--port=3177] [--only=1,2,3,4,5] [--lang=ar|en] [--match=<part of a frame's name>]
// Writes <outDir>/crops/<n>-<nn>-<what>-<size>-<lang>.png and <outDir>/access-log.json:
//   1-  the page at rest at each designed size (1440 x 900, 768 x 1024, 390 x 844), the first screen and the whole page
//   2-  each state: loading and its arrival, error (first load) and its retry, the PIN never set and deactivated, one
//       active owner, many owners; every action's confirmation, working, done, failure and each refusal (1440)
//   3-  the range, cropped to the element with a strip of its neighbours, at the three designed sizes
//   4-  the phone's flows step by step (390 x 844, touch): every dialog as the phone shows it
//   5-  the checked sizes: 320 x 568, 1024 x 768, the 200% zoom of 1440 x 900 (720 x 450 at 2x), and file://
// It exits 1 if a check fails: a console message or page error, a font file fetched twice in one load, a request off
// the page's origin, a layout shift after the first paint before any input, a sideways page scroll, an element outside
// the viewport's width, a box whose content spills, an interactive target under 44 px, or a secret left behind: the PIN
// still anywhere in the page (the DOM, the hooks, the URL) once its view closed, or a password still in a field or the
// DOM once its change succeeded.
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
const PORT = Number((process.argv.find((a) => a.startsWith("--port=")) || "--port=3177").slice(7));
if ([3173, 3174, 3176].includes(PORT)) throw new Error("ports 3173, 3174 and 3176 belong to other captures and writers");
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
  for (const el of document.querySelectorAll(".head, .acc-tools, .acc-head, .acc-id, .acc-title, .acc-acts, .prs, .prs-id, .prs-line, .prs-mail, .prs-acts, .done, .acc-alert, .acc-msg, .dlg-panel, .dlg-head, .dlg-body, .dlg-foot, .acc-sec, .acc-digits, .acc-field, .acc-box, .alert")) {
    if (el.closest("[hidden], dialog:not([open])")) continue;
    if (el.matches(".dlg-body")) continue;                  // a dialog's body may scroll inside a short sheet
    if (el.scrollWidth > el.clientWidth + 1) out.push(`spills: ${el.className} by ${el.scrollWidth - el.clientWidth}px`);
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
  await page.goto(file ? `${FILE_BASE}?${q}` : `${ORIGIN}/access.html?${q}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__access?.ready === true);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(120);
  const cls0 = await page.evaluate(() => +window.__cls.toFixed(5));
  return { context, page, errors, fonts, off, cls0, secrets: [], checks: [] };
}
async function finish(name, o, extra = {}, { problems = true } = {}) {
  const { page, errors, fonts, off, cls0, secrets, checks } = o;
  const found = problems ? await page.evaluate(PROBLEMS) : [];
  const cls = await page.evaluate(() => +window.__cls.toFixed(5));
  const maxFont = Math.max(0, ...fonts.values());
  const rec = { errors, maxFontFetch: maxFont, offOrigin: off, clsAtRest: cls0, clsAfter: cls, problems: found, secrets, checks, ...extra };
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
  1440: { width: 1440, height: 900 }, 768: { width: 768, height: 1024 }, 390: { width: 390, height: 844, scale: 2, phone: true },
  320: { width: 320, height: 568, scale: 2, phone: true }, 1024: { width: 1024, height: 768 }, zoom: { width: 720, height: 450, scale: 2 },
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
// A crop of an element in page coordinates (so a tall one is never cut at the viewport), with a strip of what stands
// around it: pad px on every side, within the page.
const around = (sel, pad = 24) => async (page) => page.evaluate(([s, p]) => {
  const els = s.split("||").map((x) => document.querySelector(x)).filter(Boolean);
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

/* ---- steps */
const wait = (p, ms) => p.waitForTimeout(ms);
const press = async (p, sel, phone) => { if (phone) await p.tap(sel); else await p.click(sel); };
// After an action: the synthetic answer arrives at 700 ms; the one-time view ignores a press in its first 700 ms.
const ANSWER = 1000, VIEW_GUARD = 800;
const REASON = {
  ar: "انتهى عقد موظف الفترة المسائية اليوم، وكان يعرف رمز مكتب الاستقبال الحالي، فعطّلته على الفور حتى لا يُستخدم بعد أن يغادر. سأنشئ رمزًا جديدًا صباح الغد وأسلّمه بنفسي لموظفي الاستقبال، وحتى ذلك الحين لا يدخل أحد إلى شاشة المكتب إلا عبر حسابي.",
  en: "The evening employee's contract ended today and he knew the current front desk PIN, so I turned it off right away so it can't be used after he leaves. I will create a new PIN tomorrow morning and give it to the desk staff myself, in person.",
};
const SHORT = { ar: "عادت إلى الدراسة", en: "Back to university" };
const NEWBIE = { name: { ar: "سارة", en: "سارة" }, email: "sara.alotaibi@example.com" };
const PW = "correct-horse-battery-staple";
const NEW_PW = "a-new-password-for-noura";
// The secret checks: read the PIN while its view shows (its one view), then, once it closed, look for it everywhere.
const readPin = (p) => p.evaluate(() => (document.querySelector("#pin-say")?.textContent || "").replace(/\D/g, ""));
async function pinGone(o, pin) {
  if (!/^\d{8}$/.test(pin)) { o.secrets.push(`the view showed no 8-digit PIN (${pin.length})`); return; }
  const left = await o.page.evaluate((x) => {
    const where = [];
    if (document.documentElement.outerHTML.includes(x) || document.body.innerText.includes(x)) where.push("DOM");
    if (JSON.stringify(window.__access).includes(x)) where.push("hooks");
    if (location.href.includes(x)) where.push("URL");
    if ([...document.querySelectorAll("input, textarea")].some((i) => i.value.includes(x))) where.push("a field");
    return where;
  }, pin);
  if (left.length) o.secrets.push(`PIN still in ${left.join(", ")}`);
}
async function passwordGone(o, pw) {
  const left = await o.page.evaluate((x) => [...document.querySelectorAll("input, textarea")].some((i) => i.value === x) || document.documentElement.outerHTML.includes(x), pw);
  if (left) o.secrets.push("a password is still in the page after its change succeeded");
}

try {
  /* ---- 1: the page at rest at each designed size */
  if (want(1)) for (const lang of LANGS) {
    for (const [n, size] of [["01", 1440], ["02", 768], ["03", 390]]) await shot(`1-${n}-rest-${size}-${lang}`, `lang=${lang}`, SIZES[size]);
    for (const [n, size] of [["04", 1440], ["05", 768], ["06", 390]]) await shot(`1-${n}-rest-full-${size}-${lang}`, `lang=${lang}`, { ...SIZES[size], scale: 1, full: true });
  }

  /* ---- 2: each state. The page's own states at 1440 and 390; every action's steps at 1440 (4 has the phone's). */
  if (want(2)) for (const lang of LANGS) {
    const L = `lang=${lang}`;
    for (const size of [1440, 390]) {
      const S = SIZES[size], ph = Boolean(S.phone);
      await shot(`2-01-loading-${size}-${lang}`, `${L}&state=loading`, { ...S, act: (p) => wait(p, 450) });
      await shot(`2-02-loading-arrived-${size}-${lang}`, `${L}&state=loading&arrive=700`, { ...S, act: (p) => wait(p, 1400), clsMustBeZero: true });
      await shot(`2-03-error-${size}-${lang}`, `${L}&state=error`, S);
      await shot(`2-04-error-retrying-${size}-${lang}`, `${L}&state=error`, { ...S, act: async (p) => { await press(p, "#retry", ph); await wait(p, 300); } });
      await shot(`2-05-error-retried-${size}-${lang}`, `${L}&state=error`, { ...S, act: async (p) => { await p.keyboard.press("Enter"); await wait(p, 1500); } });
      await shot(`2-06-pin-never-set-${size}-${lang}`, `${L}&pin=none`, S);
      await shot(`2-07-pin-deactivated-${size}-${lang}`, `${L}&pin=off`, S);
      await shot(`2-08-one-active-owner-${size}-${lang}`, `${L}&owners=last`, S);
      await shot(`2-09-many-owners-${size}-${lang}`, `${L}&owners=many`, { ...S, scale: 1, full: true });
    }
    const S = SIZES[1440];
    // The PIN: change (a confirmation, working, the one-time view, done); create (working, the view, done); deactivate
    // (the confirmation with its reason: empty, refused for no reason, typed, working, done).
    await shot(`2-10-pin-change-confirm-1440-${lang}`, L, { ...S, act: (p) => p.click('[data-key="pinChange"]') });
    await shot(`2-11-pin-change-working-1440-${lang}`, `${L}&hold=1`, { ...S, act: async (p) => { await p.click('[data-key="pinChange"]'); await p.click("#pin-confirm .acc-do"); } });
    await shot(`2-12-pin-view-after-change-1440-${lang}`, L, { ...S, act: async (p) => { await p.click('[data-key="pinChange"]'); await p.click("#pin-confirm .acc-do"); await wait(p, ANSWER); } });
    await shot(`2-13-pin-change-done-1440-${lang}`, L, { ...S, act: async (p, o) => { await p.click('[data-key="pinChange"]'); await p.click("#pin-confirm .acc-do"); await wait(p, ANSWER); const pin = await readPin(p); await p.keyboard.press("Escape"); await p.keyboard.press("Escape"); await p.mouse.click(40, 860); await wait(p, VIEW_GUARD); if (!(await p.evaluate(() => window.__access.viewOpen && document.querySelector("#dlg-pin").open))) o.checks.push("the one-time view closed without I've saved it"); await p.click("#pin-saved"); await wait(p, 200); await pinGone(o, pin); } });
    await shot(`2-14-pin-create-working-1440-${lang}`, `${L}&pin=none&hold=1`, { ...S, act: (p) => p.click('[data-key="pinCreate"]') });
    await shot(`2-15-pin-view-after-create-1440-${lang}`, `${L}&pin=none`, { ...S, act: async (p) => { await p.click('[data-key="pinCreate"]'); await wait(p, ANSWER); } });
    await shot(`2-16-pin-create-done-1440-${lang}`, `${L}&pin=none`, { ...S, act: async (p, o) => { await p.click('[data-key="pinCreate"]'); await wait(p, ANSWER); const pin = await readPin(p); await wait(p, VIEW_GUARD); await p.click("#pin-saved"); await wait(p, 200); await pinGone(o, pin); } });
    await shot(`2-17-pin-off-confirm-1440-${lang}`, L, { ...S, act: (p) => p.click('[data-key="pinOff"]') });
    await shot(`2-18-pin-off-no-reason-1440-${lang}`, L, { ...S, act: async (p) => { await p.click('[data-key="pinOff"]'); await p.click("#pinoff .acc-do"); } });
    await shot(`2-19-pin-off-working-1440-${lang}`, `${L}&hold=1`, { ...S, act: async (p) => { await p.click('[data-key="pinOff"]'); await p.fill("#pinoff-reason", SHORT[lang]); await p.click("#pinoff .acc-do"); } });
    await shot(`2-20-pin-off-done-1440-${lang}`, L, { ...S, act: async (p) => { await p.click('[data-key="pinOff"]'); await p.fill("#pinoff-reason", SHORT[lang]); await p.click("#pinoff .acc-do"); await wait(p, ANSWER); } });
    // The owners: add (empty, every field refused, typed with the password shown, working, done); reset; deactivate;
    // reactivate; change my password.
    await shot(`2-21-add-empty-1440-${lang}`, L, { ...S, act: (p) => p.click('[data-key="add"]') });
    await shot(`2-22-add-invalid-1440-${lang}`, L, { ...S, act: async (p) => { await p.click('[data-key="add"]'); await p.fill("#add-email", "sara@"); await p.fill("#add-pw", "short"); await p.click("#add .acc-do"); } });
    const typeNew = async (p) => { await p.click('[data-key="add"]'); await p.fill("#add-name", NEWBIE.name[lang]); await p.fill("#add-email", NEWBIE.email); await p.fill("#add-pw", PW); };
    await shot(`2-23-add-typed-shown-1440-${lang}`, L, { ...S, act: async (p) => { await typeNew(p); await p.click("#add .pw-eye"); } });
    await shot(`2-24-add-working-1440-${lang}`, `${L}&hold=1`, { ...S, act: async (p) => { await typeNew(p); await p.click("#add .acc-do"); } });
    await shot(`2-25-add-done-1440-${lang}`, L, { ...S, act: async (p, o) => { await typeNew(p); await p.click("#add .acc-do"); await wait(p, ANSWER); await passwordGone(o, PW); } });
    await shot(`2-26-reset-1440-${lang}`, L, { ...S, act: async (p) => { await p.click('[data-key="reset:o2"]'); await p.fill("#reset-pw", NEW_PW); } });
    await shot(`2-27-reset-done-1440-${lang}`, L, { ...S, act: async (p, o) => { await p.click('[data-key="reset:o2"]'); await p.fill("#reset-pw", NEW_PW); await p.click("#reset .acc-do"); await wait(p, ANSWER); await passwordGone(o, NEW_PW); } });
    await shot(`2-28-off-typed-1440-${lang}`, L, { ...S, act: async (p) => { await p.click('[data-key="off:o2"]'); await p.fill("#off-reason", SHORT[lang]); } });
    await shot(`2-29-off-working-1440-${lang}`, `${L}&hold=1`, { ...S, act: async (p) => { await p.click('[data-key="off:o2"]'); await p.fill("#off-reason", SHORT[lang]); await p.click("#off .acc-do"); } });
    await shot(`2-30-off-done-1440-${lang}`, L, { ...S, act: async (p) => { await p.click('[data-key="off:o2"]'); await p.fill("#off-reason", SHORT[lang]); await p.click("#off .acc-do"); await wait(p, ANSWER); } });
    await shot(`2-31-on-confirm-1440-${lang}`, L, { ...S, act: (p) => p.click('[data-key="on:o3"]') });
    await shot(`2-32-on-done-1440-${lang}`, L, { ...S, act: async (p) => { await p.click('[data-key="on:o3"]'); await p.click("#on .acc-do"); await wait(p, ANSWER); } });
    await shot(`2-33-mine-1440-${lang}`, L, { ...S, act: async (p) => { await p.click('[data-key="mine:o1"]'); await p.fill("#mine-current", PW); await p.fill("#mine-new", NEW_PW); } });
    await shot(`2-34-mine-done-1440-${lang}`, L, { ...S, act: async (p, o) => { await p.click('[data-key="mine:o1"]'); await p.fill("#mine-current", PW); await p.fill("#mine-new", NEW_PW); await p.click("#mine .acc-do"); await wait(p, ANSWER); await passwordGone(o, NEW_PW); await passwordGone(o, PW); } });
    await shot(`2-35-failed-1440-${lang}`, `${L}&fail=1`, { ...S, act: async (p) => { await p.click('[data-key="off:o2"]'); await p.fill("#off-reason", SHORT[lang]); await p.click("#off .acc-do"); await wait(p, ANSWER); } });
    await shot(`2-36-create-failed-1440-${lang}`, `${L}&pin=none&fail=1`, { ...S, act: async (p) => { await p.click('[data-key="pinCreate"]'); await wait(p, ANSWER); } });
    // Each refusal the contract can return, in its own words; the form kept as typed.
    const R = (code) => `${L}&refuse=${code}`;
    await shot(`2-40-refuse-pin-already-active-1440-${lang}`, `${R("staff_pin_already_active")}&pin=none`, { ...S, act: async (p) => { await p.click('[data-key="pinCreate"]'); await wait(p, ANSWER); } });
    await shot(`2-41-refuse-pin-not-active-change-1440-${lang}`, R("staff_pin_not_active"), { ...S, act: async (p) => { await p.click('[data-key="pinChange"]'); await p.click("#pin-confirm .acc-do"); await wait(p, ANSWER); } });
    await shot(`2-42-refuse-pin-not-active-off-1440-${lang}`, R("staff_pin_not_active"), { ...S, act: async (p) => { await p.click('[data-key="pinOff"]'); await p.fill("#pinoff-reason", SHORT[lang]); await p.click("#pinoff .acc-do"); await wait(p, ANSWER); } });
    const offWith = (code) => shot(`2-${{ owner_self_deactivation: 43, owner_last_active: 44, owner_already_inactive: 45, not_an_owner: 51, reason_required: 52 }[code]}-refuse-${code.replaceAll("_", "-")}-1440-${lang}`, R(code), { ...S, act: async (p) => { await p.click('[data-key="off:o2"]'); await p.fill("#off-reason", SHORT[lang]); await p.click("#off .acc-do"); await wait(p, ANSWER); } });
    for (const code of ["owner_self_deactivation", "owner_last_active", "owner_already_inactive", "not_an_owner", "reason_required"]) await offWith(code);
    await shot(`2-46-refuse-owner-already-inactive-reset-1440-${lang}`, R("owner_already_inactive"), { ...S, act: async (p) => { await p.click('[data-key="reset:o2"]'); await p.fill("#reset-pw", NEW_PW); await p.click("#reset .acc-do"); await wait(p, ANSWER); } });
    await shot(`2-47-refuse-owner-already-active-1440-${lang}`, R("owner_already_active"), { ...S, act: async (p) => { await p.click('[data-key="on:o3"]'); await p.click("#on .acc-do"); await wait(p, ANSWER); } });
    const addAs = (email) => async (p) => { await p.click('[data-key="add"]'); await p.fill("#add-name", NEWBIE.name[lang]); await p.fill("#add-email", email); await p.fill("#add-pw", PW); await p.click("#add .acc-do"); await wait(p, ANSWER); };
    await shot(`2-48-refuse-email-taken-active-1440-${lang}`, L, { ...S, act: addAs("Noura@example.com") });
    await shot(`2-49-refuse-email-taken-deactivated-1440-${lang}`, L, { ...S, act: addAs("omar.alharbi@example.com") });
    await shot(`2-50-refuse-email-taken-elsewhere-1440-${lang}`, R("owner_email_taken"), { ...S, act: addAs(NEWBIE.email) });
    await shot(`2-53-refuse-current-password-1440-${lang}`, R("current_password_incorrect"), { ...S, act: async (p) => { await p.click('[data-key="mine:o1"]'); await p.fill("#mine-current", "not-my-password"); await p.fill("#mine-new", NEW_PW); await p.click("#mine .acc-do"); await wait(p, ANSWER); } });
  }

  /* ---- 3: the range, each element against its whole range, cropped with a strip of its neighbours */
  if (want(3)) for (const lang of LANGS) for (const size of [1440, 768, 390]) {
    const S = SIZES[size], L = `lang=${lang}`, ph = Boolean(S.phone);
    const desk = around("#desk", 16), owners = around("#owners", 16), panel = aroundFixed("dialog[open] .dlg-panel:not([hidden])", 16);
    await shot(`3-01-pin-never-set-${size}-${lang}`, `${L}&pin=none`, { ...S, clip: desk });
    await shot(`3-02-pin-active-${size}-${lang}`, L, { ...S, clip: desk });
    await shot(`3-03-pin-deactivated-${size}-${lang}`, `${L}&pin=off`, { ...S, clip: desk });
    await shot(`3-04-pin-view-${size}-${lang}`, `${L}&pin=none`, { ...S, act: async (p) => { await press(p, '[data-key="pinCreate"]', ph); await wait(p, ANSWER); }, clip: panel });
    await shot(`3-05-owners-one-active-${size}-${lang}`, `${L}&owners=last`, { ...S, clip: owners });
    await shot(`3-06-owners-several-${size}-${lang}`, L, { ...S, clip: owners });
    await shot(`3-07-owners-many-${size}-${lang}`, `${L}&owners=many`, { ...S, clip: owners });
    await shot(`3-08-longest-names-emails-${size}-${lang}`, `${L}&case=long`, { ...S, clip: owners });
    await shot(`3-09-shortest-names-emails-${size}-${lang}`, `${L}&case=short`, { ...S, clip: owners });
    await shot(`3-10-reason-240-${size}-${lang}`, L, { ...S, act: async (p) => { await press(p, '[data-key="pinOff"]', ph); await p.fill("#pinoff-reason", REASON[lang]); }, clip: panel });
    await shot(`3-11-reason-left-${size}-${lang}`, L, { ...S, act: async (p) => { await press(p, '[data-key="off:o2"]', ph); await p.fill("#off-reason", REASON[lang].slice(0, 228)); }, clip: panel });
    await shot(`3-12-done-longest-name-${size}-${lang}`, `${L}&case=long`, { ...S, act: async (p) => { await press(p, '[data-key="off:o2"]', ph); await p.fill("#off-reason", SHORT[lang]); await press(p, "#off .acc-do", ph); await wait(p, ANSWER); }, clip: around('.prs[data-id="o2"]', 16) });
    await shot(`3-13-dialog-longest-name-${size}-${lang}`, `${L}&case=long`, { ...S, act: async (p) => { await press(p, '[data-key="reset:o2"]', ph); await p.fill("#reset-pw", NEW_PW); await press(p, "#reset .pw-eye", ph); }, clip: panel });
    await shot(`3-14-refusal-longest-name-${size}-${lang}`, `${L}&case=long&refuse=owner_already_inactive`, { ...S, act: async (p) => { await press(p, '[data-key="off:o2"]', ph); await p.fill("#off-reason", SHORT[lang]); await press(p, "#off .acc-do", ph); await wait(p, ANSWER); }, clip: panel });
    await shot(`3-15-done-pin-${size}-${lang}`, `${L}&pin=none`, { ...S, act: async (p) => { await press(p, '[data-key="pinCreate"]', ph); await wait(p, ANSWER + VIEW_GUARD); await press(p, "#pin-saved", ph); await wait(p, 200); }, clip: desk });
    if (!ph) {
      // Keyboard: the ring on a row's quiet removal, and on the done sentence that focus moves to after a change by key.
      await shot(`3-16-focus-quiet-button-${size}-${lang}`, L, { ...S, act: async (p) => { await p.focus('[data-key="reset:o2"]'); await p.keyboard.press("Tab"); }, clip: around('.prs[data-id="o2"]', 16) });
      await shot(`3-17-focus-done-by-key-${size}-${lang}`, L, { ...S, act: async (p) => { await p.focus('[data-key="on:o3"]'); await p.keyboard.press("Enter"); await wait(p, 100); await p.keyboard.press("Tab"); await p.keyboard.press("Enter"); await wait(p, ANSWER); }, clip: around('.prs[data-id="o3"]', 16) });
      await shot(`3-18-focus-pin-view-by-key-${size}-${lang}`, L, { ...S, act: async (p) => { await p.focus('[data-key="pinChange"]'); await p.keyboard.press("Enter"); await wait(p, 100); await p.keyboard.press("Tab"); await p.keyboard.press("Enter"); await wait(p, ANSWER); await p.keyboard.press("Enter"); await p.keyboard.press("Tab"); }, clip: panel });
    }
  }

  /* ---- 4: the phone's flows, step by step (390 x 844, touch): every dialog as the phone shows it */
  if (want(4)) for (const lang of LANGS) {
    const S = SIZES[390], L = `lang=${lang}`;
    const tap = (p, sel) => p.tap(sel);
    // Change the PIN: the confirmation, working, the one-time view (a tap outside does nothing), done.
    await shot(`4-01-pin-change-confirm-390-${lang}`, L, { ...S, act: (p) => tap(p, '[data-key="pinChange"]') });
    await shot(`4-02-pin-change-working-390-${lang}`, `${L}&hold=1`, { ...S, act: async (p) => { await tap(p, '[data-key="pinChange"]'); await tap(p, "#pin-confirm .acc-do"); } });
    await shot(`4-03-pin-view-390-${lang}`, L, { ...S, act: async (p, o) => { await tap(p, '[data-key="pinChange"]'); await tap(p, "#pin-confirm .acc-do"); await wait(p, ANSWER); await p.touchscreen.tap(195, 120); await wait(p, 150); if (!(await p.evaluate(() => window.__access.viewOpen && document.querySelector("#dlg-pin").open))) o.checks.push("a tap outside closed the one-time view"); } });
    await shot(`4-04-pin-change-done-390-${lang}`, L, { ...S, act: async (p, o) => { await tap(p, '[data-key="pinChange"]'); await tap(p, "#pin-confirm .acc-do"); await wait(p, ANSWER); const pin = await readPin(p); await wait(p, VIEW_GUARD); await tap(p, "#pin-saved"); await wait(p, 200); await pinGone(o, pin); } });
    // Create a PIN when none is active: working, then the view as the phone shows it.
    await shot(`4-05-pin-create-working-390-${lang}`, `${L}&pin=none&hold=1`, { ...S, act: (p) => tap(p, '[data-key="pinCreate"]') });
    await shot(`4-06-pin-create-view-390-${lang}`, `${L}&pin=none`, { ...S, act: async (p) => { await tap(p, '[data-key="pinCreate"]'); await wait(p, ANSWER); } });
    // Deactivate the PIN: the sheet, the reason refused while empty, typed, done.
    await shot(`4-07-pin-off-sheet-390-${lang}`, L, { ...S, act: (p) => tap(p, '[data-key="pinOff"]') });
    await shot(`4-08-pin-off-no-reason-390-${lang}`, L, { ...S, act: async (p) => { await tap(p, '[data-key="pinOff"]'); await tap(p, "#pinoff .acc-do"); } });
    await shot(`4-09-pin-off-typed-390-${lang}`, L, { ...S, act: async (p) => { await tap(p, '[data-key="pinOff"]'); await p.fill("#pinoff-reason", REASON[lang]); } });
    await shot(`4-10-pin-off-done-390-${lang}`, L, { ...S, act: async (p) => { await tap(p, '[data-key="pinOff"]'); await p.fill("#pinoff-reason", SHORT[lang]); await tap(p, "#pinoff .acc-do"); await wait(p, ANSWER); } });
    // Add an owner: the sheet, every field refused, typed with the password shown, a taken email, done.
    await shot(`4-11-add-sheet-390-${lang}`, L, { ...S, act: (p) => tap(p, '[data-key="add"]') });
    await shot(`4-12-add-invalid-390-${lang}`, L, { ...S, act: async (p) => { await tap(p, '[data-key="add"]'); await tap(p, "#add .acc-do"); } });
    await shot(`4-13-add-typed-shown-390-${lang}`, L, { ...S, act: async (p) => { await tap(p, '[data-key="add"]'); await p.fill("#add-name", NEWBIE.name[lang]); await p.fill("#add-email", NEWBIE.email); await p.fill("#add-pw", PW); await tap(p, "#add .pw-eye"); } });
    await shot(`4-14-add-email-taken-390-${lang}`, L, { ...S, act: async (p) => { await tap(p, '[data-key="add"]'); await p.fill("#add-name", NEWBIE.name[lang]); await p.fill("#add-email", "omar.alharbi@example.com"); await p.fill("#add-pw", PW); await tap(p, "#add .acc-do"); await wait(p, ANSWER); } });
    await shot(`4-15-add-done-390-${lang}`, L, { ...S, act: async (p, o) => { await tap(p, '[data-key="add"]'); await p.fill("#add-name", NEWBIE.name[lang]); await p.fill("#add-email", NEWBIE.email); await p.fill("#add-pw", PW); await tap(p, "#add .acc-do"); await wait(p, ANSWER); await passwordGone(o, PW); } });
    // A row's dialogs: reset, deactivate (and a refusal the form cannot fix), reactivate, change my password.
    await shot(`4-16-reset-sheet-390-${lang}`, L, { ...S, act: async (p) => { await tap(p, '[data-key="reset:o2"]'); await p.fill("#reset-pw", NEW_PW); } });
    await shot(`4-17-reset-done-390-${lang}`, L, { ...S, act: async (p) => { await tap(p, '[data-key="reset:o2"]'); await p.fill("#reset-pw", NEW_PW); await tap(p, "#reset .acc-do"); await wait(p, ANSWER); } });
    await shot(`4-18-off-sheet-390-${lang}`, L, { ...S, act: async (p) => { await tap(p, '[data-key="off:o2"]'); await p.fill("#off-reason", SHORT[lang]); } });
    await shot(`4-19-off-working-390-${lang}`, `${L}&hold=1`, { ...S, act: async (p) => { await tap(p, '[data-key="off:o2"]'); await p.fill("#off-reason", SHORT[lang]); await tap(p, "#off .acc-do"); } });
    await shot(`4-20-off-refused-390-${lang}`, `${L}&refuse=owner_already_inactive`, { ...S, act: async (p) => { await tap(p, '[data-key="off:o2"]'); await p.fill("#off-reason", SHORT[lang]); await tap(p, "#off .acc-do"); await wait(p, ANSWER); } });
    await shot(`4-21-off-failed-390-${lang}`, `${L}&fail=1`, { ...S, act: async (p) => { await tap(p, '[data-key="off:o2"]'); await p.fill("#off-reason", SHORT[lang]); await tap(p, "#off .acc-do"); await wait(p, ANSWER); } });
    await shot(`4-22-off-done-390-${lang}`, L, { ...S, act: async (p) => { await tap(p, '[data-key="off:o2"]'); await p.fill("#off-reason", SHORT[lang]); await tap(p, "#off .acc-do"); await wait(p, ANSWER); } });
    await shot(`4-23-on-sheet-390-${lang}`, L, { ...S, act: (p) => tap(p, '[data-key="on:o3"]') });
    await shot(`4-24-on-done-390-${lang}`, L, { ...S, act: async (p) => { await tap(p, '[data-key="on:o3"]'); await tap(p, "#on .acc-do"); await wait(p, ANSWER); } });
    await shot(`4-25-mine-sheet-390-${lang}`, L, { ...S, act: async (p) => { await tap(p, '[data-key="mine:o1"]'); await p.fill("#mine-current", PW); await p.fill("#mine-new", NEW_PW); } });
    await shot(`4-26-mine-refused-390-${lang}`, `${L}&refuse=current_password_incorrect`, { ...S, act: async (p) => { await tap(p, '[data-key="mine:o1"]'); await p.fill("#mine-current", "not-my-password"); await p.fill("#mine-new", NEW_PW); await tap(p, "#mine .acc-do"); await wait(p, ANSWER); } });
    await shot(`4-27-mine-done-390-${lang}`, L, { ...S, act: async (p, o) => { await tap(p, '[data-key="mine:o1"]'); await p.fill("#mine-current", PW); await p.fill("#mine-new", NEW_PW); await tap(p, "#mine .acc-do"); await wait(p, ANSWER); await passwordGone(o, NEW_PW); } });
  }

  /* ---- 5: the checked sizes, and file:// */
  if (want(5)) for (const lang of LANGS) {
    const L = `lang=${lang}`;
    await shot(`5-01-rest-320-${lang}`, L, { ...SIZES[320], scale: 1, full: true });
    await shot(`5-02-rest-1024-${lang}`, L, SIZES[1024]);
    await shot(`5-03-rest-zoom200-${lang}`, L, { ...SIZES.zoom, full: true, scale: 1 });
    await shot(`5-04-rest-file-1440-${lang}`, L, { ...SIZES[1440], file: true });
    await shot(`5-05-pin-view-320-${lang}`, `${L}&pin=none`, { ...SIZES[320], act: async (p) => { await p.tap('[data-key="pinCreate"]'); await wait(p, ANSWER); } });
    await shot(`5-06-reason-240-320-${lang}`, L, { ...SIZES[320], act: async (p) => { await p.tap('[data-key="pinOff"]'); await p.fill("#pinoff-reason", REASON[lang]); } });
    await shot(`5-07-add-invalid-zoom200-${lang}`, L, { ...SIZES.zoom, act: async (p) => { await p.click('[data-key="add"]'); await p.click("#add .acc-do"); } });
    await shot(`5-08-longest-320-${lang}`, `${L}&case=long`, { ...SIZES[320], scale: 1, full: true });
    await shot(`5-09-offline-320-${lang}`, `${L}&ops=offline`, { ...SIZES[320], clip: { x: 0, y: 0, width: 320, height: 140 } });
    await shot(`5-10-pin-view-file-1440-${lang}`, `${L}&pin=none`, { ...SIZES[1440], file: true, act: async (p) => { await p.click('[data-key="pinCreate"]'); await wait(p, ANSWER); } });
  }
} finally {
  await browser.close();
  server.close();
  await writeFile(join(OUT, "access-log.json"), JSON.stringify(log, null, 2));
  console.log(`${Object.keys(log.frames).length} frames, ${log.failures.length} failing`);
  for (const f of log.failures) console.log("  " + f);
  if (log.failures.length) process.exitCode = 1;
}
