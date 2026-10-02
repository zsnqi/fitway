// Eclipse Reports, step 4's fix round (the user's decisions of 2026-10-01 on the phone build): renders the page from
// file:// URLs with Playwright chromium (a fresh context per page, reduced motion, a touch phone at 720 px and below),
// measures it at 1440, 1279, 1200, 1024, 768, 720, 390 and 320 in Arabic and English, checks Daily and Reports at 1440
// against ff0e922, and composes one numbered before-and-after image per decision. It never writes into this repository.
//   node design-research/owner-composition-exploration-r04/directions/eclipse/reports-fixes-capture.mjs <outDir>
//        --before=<a copy of this folder at ff0e922>
// (`git archive ff0e922 <this folder> | tar -x` makes the copy.) Writes <outDir>/evidence/*.png, <outDir>/compare/*.png
// and <outDir>/fixes-log.json; exits 1 on a console error, a page error, a sideways scroll, a target under 44 px, a broken
// date, time or phrase, a moved status box, a missing focus ring or strip key, a Daily frame that differs from ff0e922
// outside its no-readings phrases, or a 1440 Reports frame that differs outside them.
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const OUT_ARG = args.find((a) => !a.startsWith("--"));
const opt = (k) => { const a = args.find((x) => x.startsWith(`--${k}=`)); return a ? resolve(a.slice(k.length + 3)) : null; };
const BEFORE = opt("before");
// --only=measure|compare|evidence runs one part (all three by default).
const ONLY = (args.find((x) => x.startsWith("--only=")) || "").slice(7);
const part = (k) => !ONLY || ONLY === k;
if (!OUT_ARG || !BEFORE) throw new Error("usage: reports-fixes-capture.mjs <outDir> --before=<ff0e922 copy>");
const OUT = resolve(OUT_ARG);
const REPO = resolve(HERE, "../../../..");
for (const p of [OUT, BEFORE]) if ((p + sep).toLowerCase().startsWith(REPO.toLowerCase() + sep)) throw new Error(`${p} must be outside the repository worktree`);
const EV = join(OUT, "evidence"), CMP = join(OUT, "compare"), TMP = join(OUT, "crops");
for (const d of [EV, CMP, TMP]) await mkdir(d, { recursive: true });
const SRC = { build: HERE, before: BEFORE };
const browser = await chromium.launch();
const log = { measures: {}, focus: {}, status: {}, card: {}, daily: {}, r1440: {}, evidence: {}, failures: [] };
const fail = (m) => log.failures.push(m);

const STATES = { "28d": "", "7d": "range=7d", short: "state=short", empty: "from=2026-07-01&to=2026-07-31" };
const SIZES = { 1440: 900, 1279: 800, 1200: 800, 1024: 768, 768: 1024, 720: 450, 390: 844, 320: 640 };

async function open(src, q, { width = 390, height = SIZES[width] || 844, scale = 1, file = "reports.html" } = {}) {
  const phone = width <= 720;
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, isMobile: phone, hasTouch: phone, reducedMotion: "reduce", colorScheme: "dark" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(`console ${m.type()}: ${m.text()}`); });
  await page.goto(`${pathToFileURL(join(SRC[src], file)).href}?${q}`);
  if (file === "reports.html") await page.waitForFunction(() => window.__reports?.ready === true);
  else await page.waitForFunction(() => window.__eclipse?.ready === true);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  return { context, page, errors };
}
const q = (lang, state, extra = "") => [`lang=${lang}`, STATES[state] ?? "", extra].filter(Boolean).join("&");
const ACTS = {
  friday: (p) => p.evaluate(() => window.__reports.pickDay(5)),
  list: (p) => p.evaluate(() => window.__reports.showAllDays()),
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
  // (Since the fix round a span in words is one sentence, the words first: its words (.w), each end with its preposition
  // (.nw) and each end alone (.rg) are checked; the sentence itself may wrap between them.)
  const phraseSel = ".nw, .gapnote .w, .gapnote .rg, .hc .run, .hb-h, .hb-v, .wk-n, .dl-pt, #heat-tip .tip-t span";
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
    if (!vis(el) || el.closest(".heat-scroll")) continue;
    const b = el.getBoundingClientRect();
    if (b.right > vw + 0.5 || b.left < -0.5) { spill.push(`outside the viewport: ${el.id ? "#" + el.id : el.className || el.tagName}`); break; }
  }
  const box = (s) => { const el = document.querySelector(s); if (!el || !vis(el)) return null; const b = el.getBoundingClientRect(); return { top: r1(b.top + scrollY), bottom: r1(b.bottom + scrollY), w: r1(b.width), h: r1(b.height) }; };
  const wk = [...document.querySelectorAll(".wk-b")].filter(vis).map((el) => el.getBoundingClientRect());
  const hb = [...document.querySelectorAll(".hb tr")].filter(vis);
  return {
    pageH: de.scrollHeight, scrollW: de.scrollWidth, innerW: innerWidth, sideways: de.scrollWidth > innerWidth,
    fold: innerHeight, pattern: box("#pattern"), days: box("#days"), glance: box("#cards"), tools: box(".rp-tools"),
    strip: box(".wk-strip"), hours: box("#hb"), patternBottomInFold: (() => { const el = document.querySelector("#pattern"); return el && vis(el) ? r1(innerHeight - el.getBoundingClientRect().bottom) : null; })(), dayButton: wk.length ? [r1(Math.min(...wk.map((b) => b.width))), r1(Math.min(...wk.map((b) => b.height)))] : null,
    hourRows: hb.length, form: document.querySelector("#pattern")?.dataset.form, list: document.querySelector("#days")?.dataset.form,
    phrases: phrases.length, broken, targets: targets.length, small, cell, spill: [...new Set(spill)].slice(0, 12),
  };
};
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
  // The week strip (below 1280 px since K-39): one Tab stop; the arrow keys move between days (the next day is to the left
  // in Arabic).
  if (width < 1280) {
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
    // The differing pixels as bands of rows (a gap of more than 4 rows starts a new band), each with its x extent. A pixel
    // differs when a channel moves by more than 1 level: Chromium's grain and blur may move a few pixels by one level
    // between two renders of the same page (counted apart, as "noise").
    let n = 0, noise = 0;
    const boxes = [];
    let cur = null;
    for (let y = 0; y < A.height; y++) {
      let rx0 = 1e9, rx1 = -1;
      for (let x = 0; x < A.width; x++) { const i = (y * A.width + x) * 4; const d = Math.max(Math.abs(pa[i] - pb[i]), Math.abs(pa[i + 1] - pb[i + 1]), Math.abs(pa[i + 2] - pb[i + 2])); if (d === 1) noise++; if (d > 1) { n++; if (x < rx0) rx0 = x; rx1 = x; } }
      if (rx1 < 0) continue;
      if (cur && y - cur[3] <= 5) { cur[0] = Math.min(cur[0], rx0); cur[2] = Math.max(cur[2], rx1); cur[3] = y; }
      else { cur = [rx0, y, rx1, y]; boxes.push(cur); }
    }
    return n ? { n, noise, boxes } : { n: 0, noise };
  }, [da, db]);
  await p.close();
  return r;
}
const sha = async (f) => createHash("sha256").update(await readFile(f)).digest("hex").slice(0, 16);

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
    if (width < 1280 && m.form !== "day" && state !== "empty") fail(`${k}: the pattern is not one day at a time`);
    if (width >= 1280 && m.form !== "week") fail(`${k}: the pattern is not the week grid`);
  }
  await o.context.close();
  return m;
}

/* ---- the day form from 1024 to 1279 px (K-39): the card's box, its strip's days and its fold, at the size's own height
 * and against a 1024 px fold (Q22's). */
async function cardAt(width, lang, height) {
  const o = await open("build", `lang=${lang}`, { width, height });
  const r = await o.page.evaluate(() => {
    const b = (s) => { const e = document.querySelector(s); if (!e) return null; const x = e.getBoundingClientRect(); return { top: Math.round((x.top + scrollY) * 10) / 10, bottom: Math.round((x.bottom + scrollY) * 10) / 10, w: Math.round(x.width * 10) / 10, h: Math.round(x.height * 10) / 10 }; };
    const wk = [...document.querySelectorAll(".wk-b")].map((e) => e.getBoundingClientRect());
    const cols = [...document.querySelectorAll("#hb tr:not(.hb-x)")].map((e) => e.getBoundingClientRect().width);
    return { form: document.querySelector("#pattern").dataset.form, card: b("#pattern"), strip: b(".wk-strip"), hours: b("#hb"), day: wk.length ? [Math.round(Math.min(...wk.map((x) => x.width)) * 10) / 10, Math.round(Math.min(...wk.map((x) => x.height)) * 10) / 10] : null, hourColumn: cols.length ? Math.round(Math.min(...cols) * 10) / 10 : null, fold: innerHeight };
  });
  r.inside = r.card ? Math.round((r.fold - r.card.bottom) * 10) / 10 : null;
  r.insideOf1024 = r.card ? Math.round((1024 - r.card.bottom) * 10) / 10 : null;
  log.card[`${width}x${height}-${lang}`] = r;
  await o.context.close();
}

/* ---- evidence: element crops at 2x (1x for the 1024 and 1279 cards), composed with only the numbers drawn on them. */
async function crop(name, src, query, { width = 390, scale = 2, sel, act = null, clip = null, height = null, file = "reports.html", pre = null } = {}) {
  const o = await open(src, query, { width, scale, file, height: height || SIZES[width] });
  if (pre) { await o.page.evaluate(pre); await o.page.waitForTimeout(250); }
  if (act) { await ACTS[act](o.page); await o.page.waitForTimeout(150); }
  // A tall document drawn in one viewport, so nothing sticky (the phone's bar) covers the crop.
  const H = await o.page.evaluate(() => document.documentElement.scrollHeight);
  await o.page.setViewportSize({ width, height: Math.max(H, SIZES[width] || 844) });
  await o.page.waitForTimeout(200);
  const path = join(TMP, `${name}-${src}.png`);
  if (clip) {
    const c = await o.page.evaluate(clip);
    await o.page.screenshot({ path, clip: c });
  } else await o.page.locator(sel).first().screenshot({ path });
  if (src === "build" && o.errors.length) fail(`${name}: ${o.errors.join(" | ")}`);
  await o.context.close();
  return path;
}
async function compose(name, a, b, { stack = "auto" } = {}) {
  const p = await browser.newPage({ viewport: { width: 400, height: 300 }, deviceScaleFactor: 1 });
  const size = async (f) => { const png = await readFile(f); return [png.readUInt32BE(16), png.readUInt32BE(20)]; };
  const [sa, sb] = [await size(a), await size(b)];
  const side = stack === "side" || (stack === "auto" && Math.max(sa[1], sb[1]) > Math.max(sa[0], sb[0]) * 1.1);
  // The number sits above its crop, so it never covers the page.
  const fig = (f, s, n) => `<figure><b>${n}</b><img src="${pathToFileURL(f).href}" style="width:${s[0]}px;height:${s[1]}px"></figure>`;
  const html = `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#262324}body{display:inline-flex;flex-direction:${side ? "row" : "column"};gap:24px;padding:24px;align-items:flex-start}
    figure{margin:0;display:flex;flex-direction:column;align-items:flex-start;gap:10px}img{display:block;outline:1px solid #3a3637}b{display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:#f5f3f2;color:#111;font:700 22px/1 system-ui,sans-serif}</style>${fig(a, sa, 1)}${fig(b, sb, 2)}`;
  const file = join(TMP, `${name}.html`);
  await writeFile(file, html);
  await p.goto(pathToFileURL(file).href);
  await p.waitForTimeout(300);
  const box = await p.evaluate(() => { const r = document.body.getBoundingClientRect(); return { x: 0, y: 0, width: Math.ceil(r.width), height: Math.ceil(r.height) }; });
  await p.setViewportSize({ width: box.width, height: box.height });
  const out = join(EV, `${name}.png`);
  await p.screenshot({ path: out, clip: box });
  await p.close();
  log.evidence[name] = { out, a, b, layout: side ? "side by side" : "1 over 2", size: [box.width, box.height] };
  return out;
}

try {
  /* ---- 1. measurements: every size, AR and EN, the four states; the strip's other day; the list shown whole; dialogs. */
  if (part("measure")) for (const width of Object.keys(SIZES).map(Number)) for (const lang of ["ar", "en"]) {
    for (const state of Object.keys(STATES)) await measure("build", lang, state, width);
    if (width < 1280) await measure("build", lang, "28d", width, { act: "friday" });
    if (width <= 720) await measure("build", lang, "28d", width, { act: "list" });
    if (width <= 720) await measure("build", lang, "short", width, { act: "list", key: `build-${width}-${lang}-short-list` });
    for (const dlg of ["range", "export"]) await measure("build", lang, "28d", width, { extra: `dialog=${dlg}`, key: `build-${width}-${lang}-${dlg}` });
  }
  if (part("measure")) for (const lang of ["ar", "en"]) {
    for (const width of Object.keys(SIZES).map(Number)) await statusBoxes(width, lang);
    for (const width of Object.keys(SIZES).map(Number)) await focusCensus(width, lang);
    for (const [width, height] of [[1024, 768], [1024, 1024], [1200, 800], [1200, 1024], [1279, 800], [1279, 1024]]) await cardAt(width, lang, height);
  }

  /* ---- 2. non-regression against ff0e922: Daily (whole pages; the details open; the gap's tooltip) and Reports at 1440.
   * A frame may differ only inside its no-readings and closed phrases (the boxes of .gapnote, .tip-span and the
   * tooltip, taken from both versions). */
  // (The empty period's button «عرض آخر 28 يومًا» is the fix round's one other change: its spacing.)
  const phraseBoxes = () => [...document.querySelectorAll(".gapnote, .tip-span, .tip-main:has(+ .tip-span), #tip:not([hidden]), .heat-tip:not([hidden]), .rbtn[data-range-go]")].map((e) => { const r = e.closest("td, li, #tip, .tip, .heat-tip")?.getBoundingClientRect() || e.getBoundingClientRect(); return [Math.floor(r.left), Math.floor(r.top), Math.ceil(r.right), Math.ceil(r.bottom)]; }).filter((b) => b[2] > b[0]);
  // (Boxes in the viewport's coordinates, as the screenshot is: opening Daily's details scrolls the window.)
  async function pair(name, file, query, width, { pre = null, arg = null } = {}) {
    const f = {}, boxes = [];
    for (const src of ["before", "build"]) {
      const o = await open(src, query, { width, file });
      if (file === "index.html") await o.page.waitForTimeout(500);
      if (pre) { await o.page.evaluate(pre, arg); await o.page.waitForTimeout(300); }
      const H = await o.page.evaluate(() => document.documentElement.scrollHeight);
      await o.page.setViewportSize({ width, height: H });
      if (pre && arg) { await o.page.evaluate(pre, arg); await o.page.waitForTimeout(200); }
      await o.page.waitForTimeout(300);
      f[src] = join(CMP, `${name}-${src}.png`);
      await o.page.screenshot({ path: f[src] });
      boxes.push(...(await o.page.evaluate(phraseBoxes)));
      if (src === "build" && o.errors.length) fail(`${name}: ${o.errors.join(" | ")}`);
      await o.context.close();
    }
    const d = await diffBox(f.before, f.build);
    const inside = d.n === 0 || (d.boxes && d.boxes.every((x) => boxes.some((b) => x[0] >= b[0] - 1 && x[1] >= b[1] - 1 && x[2] <= b[2] + 1 && x[3] <= b[3] + 1)));
    return { n: d.n, noise: d.noise, size: d.size || null, regions: d.boxes || [], inside, phraseBoxes: inside ? undefined : boxes };
  }
  if (part("compare")) for (const width of [1440, 768, 390]) for (const lang of ["ar", "en"]) for (const st of ["live", "delayed", "nohistory", "loading", "closed", "unavailable", "error"]) {
    const k = `${width}-${lang}-${st}`;
    log.daily[k] = await pair(`daily-${k}`, "index.html", `lang=${lang}&state=${st}&tuner=0`, width);
    log.daily[`${k}-details`] = await pair(`daily-${k}-details`, "index.html", `lang=${lang}&state=${st}&tuner=0`, width, { pre: () => { const b = document.querySelector("#details-btn"); if (b && !b.disabled && !b.hidden && document.querySelector("#details").hidden) b.click(); } });
    // The minute table scrolls inside its own region: its no-readings rows brought into view (the gap, and in Delayed the
    // span with no readings yet at its end).
    for (const [tag, which] of [["gap-row", "first"], ["last-row", "last"]]) log.daily[`${k}-details-${tag}`] = await pair(`daily-${k}-details-${tag}`, "index.html", `lang=${lang}&state=${st}&tuner=0`, width, { pre: (w) => { const b = document.querySelector("#details-btn"); if (b && !b.disabled && !b.hidden && document.querySelector("#details").hidden) b.click(); const rows = document.querySelectorAll("#minutes tr.none"); const r = w === "first" ? rows[0] : rows[rows.length - 1]; const sc = document.querySelector("#minutes .scroller"); if (r && sc) sc.scrollTop = r.offsetTop - sc.clientHeight / 2; else if (sc) sc.scrollTop = w === "first" ? 0 : sc.scrollHeight; }, arg: which });
    if (["live", "delayed"].includes(st)) log.daily[`${k}-gap-tooltip`] = await pair(`daily-${k}-gap-tooltip`, "index.html", `lang=${lang}&state=${st}&tuner=0`, width, { pre: () => window.__eclipse.chart.select("gap") });
  }
  for (const [k, v] of Object.entries(log.daily)) if (!v.inside) fail(`Daily ${k} differs from ff0e922 outside its phrases: ${JSON.stringify(v.regions)}`);
  if (part("compare")) for (const lang of ["ar", "en"]) for (const state of Object.keys(STATES)) {
    log.r1440[`${lang}-${state}`] = await pair(`reports-1440-${lang}-${state}`, "reports.html", q(lang, state), 1440);
    if (!log.r1440[`${lang}-${state}`].inside) fail(`Reports 1440 ${lang} ${state} differs outside its phrases: ${JSON.stringify(log.r1440[`${lang}-${state}`].regions)}`);
  }

  /* ---- 3. evidence, one numbered image per decision (1 = ff0e922, 2 = this round). */
  if (part("evidence")) await evidence();
} finally {
  await writeFile(join(OUT, ONLY ? `fixes-log-${ONLY}.json` : "fixes-log.json"), JSON.stringify(log, null, 1));
  await browser.close();
}
async function evidence() {
  const both = async (name, opts, stack) => compose(name, await crop(name, "before", opts.query, opts), await crop(name, "build", opts.query, opts), { stack });
  await both("1-week-strip-390-ar", { query: "lang=ar", sel: ".wk-strip" }, "column");
  await both("2-hour-bars-390-ar", { query: "lang=ar", sel: "#hb" }, "side");
  // Around the boundary between 16 and 15 September, where ff0e922's list opens its second 7 days with their dates.
  // The same days in both, from Thursday 17 to Monday 14 September.
  const around = () => { const li = [...document.querySelectorAll("#day-list > li.dli")]; const day = (n) => li.find((x) => x.querySelector(".dl-day") && new RegExp(`\\b${n}\\b`).test(x.querySelector(".dl-day").textContent)); const a = day(17).getBoundingClientRect(), z = day(14).getBoundingClientRect(), card = document.querySelector("#days").getBoundingClientRect(); return { x: card.left, y: a.top + scrollY - 8, width: card.width, height: z.bottom - a.top + 16 }; };
  await both("3-day-list-week-boundary-390-ar", { query: "lang=ar", clip: around, act: "list" }, "side");
  await both("4a-busy-times-1024-ar", { query: "lang=ar", width: 1024, scale: 1, sel: "#pattern" }, "column");
  await both("4b-busy-times-1279-ar", { query: "lang=ar", width: 1279, scale: 1, sel: "#pattern" }, "column");
  const gapItem = () => { const n = document.querySelector(".dl-note"); const li = n.closest("li").getBoundingClientRect(); return { x: li.left - 4, y: li.top + scrollY - 4, width: li.width + 8, height: li.height + 8 }; };
  await both("5a-no-readings-day-list-390-ar", { query: "lang=ar&range=7d", clip: gapItem }, "column");
  const minuteRow = () => { const tr = document.querySelector("#minutes tr.none"); tr.scrollIntoView({ block: "center" }); const t = tr.closest("table").getBoundingClientRect(), r = tr.getBoundingClientRect(); return { x: t.left, y: r.top + scrollY - 37, width: t.width, height: r.height + 74 }; };
  await both("5b-no-readings-daily-390-ar", { query: "lang=ar&tuner=0", file: "index.html", clip: minuteRow, pre: () => document.querySelector("#details-btn").click() }, "column");
  for (const lang of ["ar", "en"]) await both(`6-no-readings-320-${lang}`, { query: `lang=${lang}&range=7d`, width: 320, clip: gapItem }, "column");
  // Where the sentence does wrap: the day table's notes column at 768 (the row of Thursday 17 September).
  const noteRow = () => { const tr = document.querySelector("#days-table tr.has-note"); const r = tr.getBoundingClientRect(); return { x: r.left, y: r.top + scrollY, width: r.width, height: r.height }; };
  for (const lang of ["ar", "en"]) await both(`6c-wrap-notes-768-${lang}`, { query: `lang=${lang}&range=7d`, width: 768, clip: noteRow }, "column");
  await both("7-show-last-28-days-button-390-ar", { query: q("ar", "empty"), sel: ".pday-empty .rbtn" }, "column");
}
if (log.failures.length) { console.error(log.failures.join("\n")); process.exit(1); }
console.log("ok", Object.keys(log.measures).length, "measured pages,", Object.keys(log.daily).length, "Daily pairs,", Object.keys(log.evidence).length, "evidence images");
