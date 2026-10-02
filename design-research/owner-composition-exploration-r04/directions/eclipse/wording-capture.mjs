// Eclipse, step 4's wording round (the user's decisions 9-13 of 2026-10-02): renders Daily and Reports from file:// URLs
// with Playwright chromium (a fresh context per page, reduced motion, a touch phone at 720 px and below), measures them at
// 1440, 1279, 1200, 1024, 768, 720, 390 and 320 in Arabic and English, measures the contrast of every changed sentence,
// compares Daily and Reports with e8461a5 frame by frame, and composes one numbered before-and-after image per decision.
// It never writes into this repository.
//   node design-research/owner-composition-exploration-r04/directions/eclipse/wording-capture.mjs <outDir>
//        --before=<a copy of this folder at e8461a5>
// (`git archive e8461a5 <this folder> | tar -x` makes the copy.) The concept's data has no whole day without readings;
// `day17=1` frames serve reports.js with 17 September's missing span set to the whole day (in memory, both versions), as
// the options round did. Writes <outDir>/evidence/*.png, <outDir>/compare/*.png and <outDir>/wording-log.json; exits 1 on
// a console or page error, a sideways scroll, a target under 44 px, a broken date, time or phrase, a moved status box, a
// sentence under 4.5:1, or a frame that differs from e8461a5 outside the changed sentences, rows and lists.
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const OUT_ARG = args.find((a) => !a.startsWith("--"));
const opt = (k) => { const a = args.find((x) => x.startsWith(`--${k}=`)); return a ? resolve(a.slice(k.length + 3)) : null; };
const BEFORE = opt("before");
const ONLY = (args.find((x) => x.startsWith("--only=")) || "").slice(7);
const part = (k) => !ONLY || ONLY.split(",").includes(k);
if (!OUT_ARG || !BEFORE) throw new Error("usage: wording-capture.mjs <outDir> --before=<e8461a5 copy>");
const OUT = resolve(OUT_ARG);
const REPO = resolve(HERE, "../../../..");
for (const p of [OUT, BEFORE]) if ((p + sep).toLowerCase().startsWith(REPO.toLowerCase() + sep)) throw new Error(`${p} must be outside the repository worktree`);
const EV = join(OUT, "evidence"), CMP = join(OUT, "compare"), TMP = join(OUT, "crops");
for (const d of [EV, CMP, TMP]) await mkdir(d, { recursive: true });
const SRC = { build: HERE, before: BEFORE };
const browser = await chromium.launch();
const log = { measures: {}, status: {}, contrast: {}, frames: {}, evidence: {}, failures: [] };
const fail = (m) => log.failures.push(m);

const SIZES = { 1440: 900, 1279: 800, 1200: 800, 1024: 768, 768: 1024, 720: 450, 390: 844, 320: 640 };
const R_STATES = { "28d": "", "7d": "range=7d", short: "state=short", empty: "from=2026-07-01&to=2026-07-31", day17: "range=7d&day17=1", pre12: "state=short&from=2026-09-12&to=2026-09-22" };
const D_STATES = ["live", "delayed", "nohistory", "loading", "closed", "unavailable", "error"];

async function open(src, query, { width = 390, height = SIZES[width] || 844, scale = 1, file = "reports.html" } = {}) {
  const phone = width <= 720;
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, isMobile: phone, hasTouch: phone, reducedMotion: "reduce", colorScheme: "dark" });
  if (/(^|&)day17=1/.test(query)) {
    await context.route("**/reports.js", async (route) => {
      const js = readFileSync(join(SRC[src], "reports.js"), "utf8");
      const out = js.replace('const MISSING = { [toDn("2026-09-17")]: [[240, 479]]', 'const MISSING = { [toDn("2026-09-17")]: [[0, 1139]]');
      if (out === js) throw new Error("MISSING not found");
      await route.fulfill({ body: out, contentType: "text/javascript; charset=utf-8" });
    });
  }
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(`console ${m.type()}: ${m.text()}`); });
  await page.goto(`${pathToFileURL(join(SRC[src], file)).href}?${query}`);
  if (file === "reports.html") await page.waitForFunction(() => window.__reports?.ready === true);
  else await page.waitForFunction(() => window.__eclipse?.ready === true);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(file === "index.html" ? 450 : 150);
  return { context, page, errors };
}
const rq = (lang, state) => [`lang=${lang}`, R_STATES[state]].filter(Boolean).join("&");
const dq = (lang, state) => `lang=${lang}&state=${state}&tuner=0`;
const ACTS = {
  list: () => window.__reports.showAllDays(),
  details: () => { const b = document.querySelector("#details-btn"); if (b && !b.disabled && !b.hidden && document.querySelector("#details").hidden) b.click(); },
  gap: () => window.__eclipse.chart.select("gap"),
  minuteGap: () => { const b = document.querySelector("#details-btn"); if (b && !b.disabled && !b.hidden && document.querySelector("#details").hidden) b.click(); const r = document.querySelector("#minutes tr.none"); const sc = document.querySelector("#minutes .scroller"); if (r && sc) sc.scrollTop = r.offsetTop - sc.clientHeight / 2; },
  minuteLast: () => { const b = document.querySelector("#details-btn"); if (b && !b.disabled && !b.hidden && document.querySelector("#details").hidden) b.click(); const rows = document.querySelectorAll("#minutes tr.none"); const r = rows[rows.length - 1]; const sc = document.querySelector("#minutes .scroller"); if (r && sc) sc.scrollTop = r.offsetTop - sc.clientHeight / 2; },
};
const act = async (p, a) => { if (!a) return; if (a.startsWith("hover:")) await p.hover(a.slice(6)); else if (a.startsWith("day")) await p.evaluate((d) => window.__reports.pickDay(d), +a.slice(3)); else await p.evaluate(ACTS[a]); await p.waitForTimeout(250); };

/* ------------------------------------------------------------------ measurements */
const MEASURE = () => {
  const de = document.documentElement;
  const vis = (el) => { if (el.closest("[hidden], dialog:not([open]), .sr-only, [inert], .tip-measure")) return false; const cs = getComputedStyle(el); if (cs.display === "none" || cs.visibility === "hidden") return false; const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
  const r1 = (x) => Math.round(x * 10) / 10;
  const lines = (el) => {
    const rg = document.createRange(); rg.selectNodeContents(el);
    const cs = [...rg.getClientRects()].filter((r) => r.width > 0.5).map((r) => (r.top + r.bottom) / 2).sort((a, b) => a - b);
    let n = 0, last = -1e9; for (const c of cs) { if (c - last > 7) { n++; last = c; } } return n;
  };
  const scope = document.querySelector("dialog[open]") || document;
  // A sentence may wrap between its groups; each group (.nw: an end with its preposition, a duration, a date), the words
  // (.w) and each end alone (.rg) never break; nor do a single day's date and words, or a coverage label.
  const phraseSel = ".nw, .gapnote .w, .gapnote .rg, .hc .run, .hb-h, .hb-v, .wk-n, .dl-pt, #heat-tip .tip-t span, .tip-span .nw, .is-none-day .dl-day, .is-none-day .dl-more, .is-none-day .dd, .is-none-day .c-none, .facts dt, .facts dd .nw, #tip .tip-word";
  const phrases = [...scope.querySelectorAll(phraseSel)].filter(vis);
  const broken = phrases.filter((el) => lines(el) > 1).map((el) => `${el.className || el.tagName}: ${el.textContent.trim().slice(0, 48)}`);
  const tsel = "button, a[href], select, input, [role=radio], [role=switch], [role=menuitem], [role=gridcell][tabindex]";
  const all = [...scope.querySelectorAll(tsel)].filter((el) => vis(el) && !el.closest(".skip") && !el.disabled);
  const targets = all.filter((el) => !el.matches("[role=gridcell]")).map((el) => { const b = el.getBoundingClientRect(); return { name: el.id ? "#" + el.id : (el.className || el.tagName).toString().split(" ")[0], w: r1(b.width), h: r1(b.height) }; });
  const small = targets.filter((t) => t.w < 44 - 0.05 || t.h < 44 - 0.05).map((t) => `${t.name} ${t.w}x${t.h}`);
  const spill = [];
  for (const el of document.querySelectorAll(".dli, .dl-more, .hb-run, .facts > div, .facts dd, #tip")) if (vis(el) && el.scrollWidth > el.clientWidth + 1) spill.push(`${el.className.toString().split(" ")[0] || el.tagName} by ${el.scrollWidth - el.clientWidth}`);
  const tip = document.querySelector("#tip"), plot = document.querySelector("#plot-hit");
  if (tip && plot && vis(tip)) { const t = tip.getBoundingClientRect(), p = plot.getBoundingClientRect(); if (t.left < p.left - 0.5 || t.right > p.right + 0.5) spill.push("tooltip outside the plot"); }
  const vw = de.clientWidth;
  for (const el of document.querySelectorAll("main *, .tabbar *")) {
    if (!vis(el) || el.closest(".heat-scroll, .scroller, .tip-measure")) continue;
    const b = el.getBoundingClientRect();
    if (b.right > vw + 0.5 || b.left < -0.5) { spill.push(`outside the viewport: ${el.id ? "#" + el.id : el.className || el.tagName}`); break; }
  }
  // The changed sentences as they render: their text, lines and style.
  const st = (el) => { const cs = getComputedStyle(el); return `${cs.fontSize}/${cs.color}`; };
  // (A single day's date and words are two styles by decision 10, each checked as its own sentence. A part counts when it
  // holds text of its own, not only the spaces between its children.)
  const own = (e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  const sentences = [...document.querySelectorAll(".gapnote, .is-none-day .dl-day, .is-none-day .dl-more, .is-none-day .dd, .is-none-day .c-none, .facts dd.is-span, #tip .tip-span, .heat-tip .tip-span")].filter(vis).map((el) => {
    const parts = [el, ...el.querySelectorAll("*")].filter((e) => vis(e) && own(e));
    return { text: el.textContent.replace(/\s+/g, " ").trim().slice(0, 80), lines: lines(el), styles: [...new Set(parts.map(st))] };
  });
  return { pageH: de.scrollHeight, scrollW: de.scrollWidth, innerW: innerWidth, sideways: de.scrollWidth > innerWidth, phrases: phrases.length, broken, targets: targets.length, small, spill: [...new Set(spill)].slice(0, 12), sentences };
};
async function measure(file, lang, state, width, a = null) {
  const query = file === "reports.html" ? rq(lang, state) : dq(lang, state);
  const o = await open("build", query, { width, file });
  await act(o.page, a);
  const m = await o.page.evaluate(MEASURE);
  m.errors = o.errors;
  const k = `${file === "reports.html" ? "reports" : "daily"}-${width}-${lang}-${state}${a ? "-" + a : ""}`;
  log.measures[k] = m;
  if (o.errors.length) fail(`${k}: ${o.errors.join(" | ")}`);
  if (m.sideways) fail(`${k}: the page scrolls sideways (${m.scrollW} > ${m.innerW})`);
  if (m.innerW !== width) fail(`${k}: the layout viewport widened to ${m.innerW}`);
  if (m.small.length) fail(`${k}: targets under 44 px: ${m.small.join(", ")}`);
  if (m.broken.length) fail(`${k}: broken inside: ${m.broken.join("; ")}`);
  if (m.spill.length) fail(`${k}: ${m.spill.join("; ")}`);
  for (const s of m.sentences) if (s.styles.length > 1) fail(`${k}: two styles in «${s.text}»: ${s.styles.join(", ")}`);
  await o.context.close();
}
/* ---- the status box (HDR-6): each of Daily's five statuses written into Reports' header (the round's single-day frame). */
async function statusBoxes(width, lang) {
  const words = {};
  for (const st of ["live", "delayed", "closed", "unavailable", "error"]) {
    const d = await open("build", dq(lang, st), { width, file: "index.html" });
    words[st] = await d.page.evaluate(() => ({ cls: document.querySelector("#ops-btn").className, html: document.querySelector("#ops-btn-state").innerHTML }));
    await d.context.close();
  }
  const o = await open("build", rq(lang, "day17"), { width });
  const rows = {};
  for (const [st, w] of Object.entries(words)) {
    rows[st] = await o.page.evaluate((w) => {
      const b = document.querySelector("#ops-btn"); b.className = w.cls; document.querySelector("#ops-btn-state").innerHTML = w.html;
      const r = (s) => { const e = document.querySelector(s).getBoundingClientRect(); return [Math.round(e.left * 10) / 10, Math.round(e.right * 10) / 10, Math.round(e.top * 10) / 10, Math.round(e.bottom * 10) / 10]; };
      return { badge: r("#ops-btn"), title: r(".head-titles"), tools: r(".rp-tools") };
    }, w);
  }
  await o.context.close();
  const anchor = (b) => (lang === "ar" ? b[0] : b[1]);
  const spread = (f) => { const v = Object.values(rows).map(f); return Math.round((Math.max(...v) - Math.min(...v)) * 10) / 10; };
  const res = { anchorSpread: spread((x) => anchor(x.badge)), topSpread: spread((x) => x.badge[2]), heightSpread: spread((x) => x.badge[3] - x.badge[2]), toolsSpread: spread((x) => x.tools[2]), titleSpread: spread((x) => x.title[2]) };
  log.status[`${width}-${lang}`] = res;
  if (Object.values(res).some((v) => v > 0.5)) fail(`status ${width}-${lang}: the box moves ${JSON.stringify(res)}`);
}

/* ---- contrast: each changed sentence's text colour against the background behind it, from rendered pixels (the most
 * common colour in the element's box, which is its ground: the glyphs cover a small part of it). WCAG 2.x ratio. */
async function contrast(name, file, query, width, sel, a = null) {
  const o = await open("build", query, { width, file, scale: 2 });
  await act(o.page, a);
  const el = o.page.locator(sel).first();
  await el.scrollIntoViewIfNeeded();
  const info = await el.evaluate((e) => { const parts = [...e.querySelectorAll(".w, .rg, .dl-more, .c-none, .tip-word, .nw")]; const all = [e, ...parts].map((x) => getComputedStyle(x)); return { colors: [...new Set(all.slice(parts.length ? 1 : 0).map((c) => c.color))], sizes: [...new Set(all.slice(parts.length ? 1 : 0).map((c) => c.fontSize))], text: e.textContent.replace(/\s+/g, " ").trim().slice(0, 60) }; });
  const png = await el.screenshot();
  const p = await browser.newPage();
  const bg = await p.evaluate(async (d) => {
    const i = new Image(); await new Promise((ok) => { i.onload = ok; i.src = d; });
    const c = document.createElement("canvas"); c.width = i.width; c.height = i.height; const x = c.getContext("2d"); x.drawImage(i, 0, 0);
    const px = x.getImageData(0, 0, i.width, i.height).data, n = new Map();
    for (let k = 0; k < px.length; k += 4) { const key = `${px[k]},${px[k + 1]},${px[k + 2]}`; n.set(key, (n.get(key) || 0) + 1); }
    return [...n.entries()].sort((a, b) => b[1] - a[1])[0][0].split(",").map(Number);
  }, `data:image/png;base64,${png.toString("base64")}`);
  await p.close();
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const rgb = (s) => s.match(/[\d.]+/g).map(Number);
  const ratios = info.colors.map((c) => { const [r, g, b, al = 1] = rgb(c); const t = [r, g, b].map((v, j) => v * al + bg[j] * (1 - al)); const L1 = lum(t), L2 = lum(bg); return { color: c, ratio: Math.round(((Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)) * 100) / 100 }; });
  log.contrast[name] = { ...info, background: `rgb(${bg.join(", ")})`, ratios };
  for (const r of ratios) if (r.ratio < 4.5) fail(`contrast ${name}: ${r.color} on rgb(${bg}) is ${r.ratio}`);
  await o.context.close();
}

/* ---- frame comparison with e8461a5: the box of every pixel that differs. */
async function diffBox(a, b) {
  const p = await browser.newPage();
  const [da, db] = [await readFile(a), await readFile(b)].map((x) => `data:image/png;base64,${x.toString("base64")}`);
  const r = await p.evaluate(async ([da, db]) => {
    const load = (s) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = s; });
    const [A, B] = await Promise.all([load(da), load(db)]);
    if (A.width !== B.width || A.height !== B.height) return { size: [A.width, A.height, B.width, B.height] };
    const c = (img) => { const cv = document.createElement("canvas"); cv.width = img.width; cv.height = img.height; const x = cv.getContext("2d"); x.drawImage(img, 0, 0); return x.getImageData(0, 0, img.width, img.height).data; };
    const pa = c(A), pb = c(B);
    let n = 0, noise = 0; const boxes = []; let cur = null;
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
// The places this round may change: the sentences, the rows and items that hold them, the tooltips and the coverage rows.
const phraseBoxes = () => [...document.querySelectorAll(".gapnote, .is-none-day, .dli.is-none, tr.is-none, tr.none, .hb-run, .tip-span, .facts dd.is-span, #tip:not([hidden]), .heat-tip:not([hidden])")].map((e) => { const r = (e.closest("td, li, tr, #tip, .heat-tip, .facts > div") || e).getBoundingClientRect(); return [Math.floor(r.left), Math.floor(r.top), Math.ceil(r.right), Math.ceil(r.bottom)]; }).filter((b) => b[2] > b[0]);
async function pair(name, file, query, width, a = null, hover = null) {
  const f = {}, boxes = [];
  for (const src of ["before", "build"]) {
    const o = await open(src, query, { width, file });
    await act(o.page, a);
    const H = await o.page.evaluate(() => document.documentElement.scrollHeight);
    await o.page.setViewportSize({ width, height: H });
    await o.page.waitForTimeout(250);
    await act(o.page, a && (a.startsWith("minute") || a === "gap") ? a : null);
    if (hover) { await o.page.hover(hover); await o.page.waitForTimeout(200); }
    f[src] = join(CMP, `${name}-${src}.png`);
    await o.page.screenshot({ path: f[src] });
    boxes.push(...(await o.page.evaluate(phraseBoxes)));
    if (src === "build" && o.errors.length) fail(`${name}: ${o.errors.join(" | ")}`);
    await o.context.close();
  }
  const d = await diffBox(f.before, f.build);
  const inside = d.n === 0 || (d.boxes && d.boxes.every((x) => boxes.some((b) => x[0] >= b[0] - 1 && x[1] >= b[1] - 1 && x[2] <= b[2] + 1 && x[3] <= b[3] + 1)));
  log.frames[name] = { n: d.n, noise: d.noise, size: d.size || null, regions: d.boxes || [], inside };
  if (!inside) fail(`${name} differs from e8461a5 outside the changed sentences: ${JSON.stringify(d.size || d.boxes)}`);
}

/* ---- evidence: element crops at 2x, composed with only the numbers drawn on them. */
async function crop(name, src, query, { width = 390, scale = 2, sel, a = null, clip = null, arg = null, file = "reports.html" } = {}) {
  const o = await open(src, query, { width, scale, file });
  await act(o.page, a);
  const H = await o.page.evaluate(() => document.documentElement.scrollHeight);
  await o.page.setViewportSize({ width, height: Math.max(H, SIZES[width] || 844) });
  await o.page.waitForTimeout(250);
  if (a === "gap") await act(o.page, a);
  const path = join(TMP, `${name}-${src}.png`);
  if (clip) await o.page.screenshot({ path, clip: await o.page.evaluate(clip, arg) });
  else await o.page.locator(sel).first().screenshot({ path });
  if (src === "build" && o.errors.length) fail(`${name}: ${o.errors.join(" | ")}`);
  await o.context.close();
  return path;
}
async function compose(name, a, b, stack = "column") {
  const p = await browser.newPage({ viewport: { width: 400, height: 300 }, deviceScaleFactor: 1 });
  const size = async (f) => { const png = await readFile(f); return [png.readUInt32BE(16), png.readUInt32BE(20)]; };
  const [sa, sb] = [await size(a), await size(b)];
  const fig = (f, s, n) => `<figure><b>${n}</b><img src="${pathToFileURL(f).href}" style="width:${s[0]}px;height:${s[1]}px"></figure>`;
  const html = `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#262324}body{display:inline-flex;flex-direction:${stack === "side" ? "row" : "column"};gap:24px;padding:24px;align-items:flex-start}
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
  log.evidence[name] = { out, size: [box.width, box.height] };
  return out;
}
async function evidence() {
  const both = async (name, query, opts, stack) => compose(name, await crop(name, "before", query, opts), await crop(name, "build", query, opts), stack);
  // Decision 9: Daily's minute table at its no-readings row (390 AR), and Reports' full-width row at 768 AR (the days before
  // the readings began, in the short history).
  const minuteRow = () => { const tr = document.querySelector("#minutes tr.none"); tr.scrollIntoView({ block: "center" }); const t = tr.closest("table").getBoundingClientRect(), r = tr.getBoundingClientRect(); return { x: t.left, y: r.top + scrollY - 37, width: t.width, height: r.height + 74 }; };
  await both("9a-minute-table-390-ar", dq("ar", "live"), { file: "index.html", clip: minuteRow, a: "details" });
  const fullRow = () => { const tr = document.querySelector("#days-table tr.is-none"); const r = tr.getBoundingClientRect(), p = tr.previousElementSibling?.getBoundingClientRect() || r; return { x: r.left, y: p.top + scrollY, width: r.width, height: r.bottom - p.top }; };
  const fullRow400 = () => { const tr = document.querySelector("#days-table tr.is-none"); const r = tr.getBoundingClientRect(), p = tr.previousElementSibling?.getBoundingClientRect() || r; const w = Math.min(400, r.width); return { x: r.right - w, y: p.top + scrollY, width: w, height: r.bottom - p.top }; };
  await both("9b-full-width-row-768-ar", rq("ar", "short"), { width: 768, clip: fullRow400 });
  // Decision 10: the whole day without readings (17 September), the day list at 390 AR and EN, and the table row at 768 AR.
  const around17 = (list) => { const rows = [...document.querySelectorAll(list ? "#day-list > li" : "#days-table tbody > tr")]; const i = rows.findIndex((x) => /(^|\D)17(\D|$)/.test((x.querySelector(".dl-day, th") || x).textContent)); const a = rows[i - 1].getBoundingClientRect(), z = rows[i + 1].getBoundingClientRect(), card = document.querySelector(list ? "#days" : "#days-table").getBoundingClientRect(); const w = list ? card.width : Math.min(400, card.width); return { x: list ? card.left : card.right - w, y: a.top + scrollY - 4, width: w, height: z.bottom - a.top + 8 }; };
  await both("10a-single-day-list-390-ar", rq("ar", "day17"), { clip: around17, arg: true });
  await both("10b-single-day-list-390-en", rq("en", "day17"), { clip: around17, arg: true });
  await both("10c-single-day-row-768-ar", rq("ar", "day17"), { width: 768, clip: around17, arg: false });
  // Decision 11: the one day before the readings began (12 September), the day list at 390 AR, all days shown.
  const tail = () => { const li = [...document.querySelectorAll("#day-list > li")]; const a = li[li.length - 3].getBoundingClientRect(), z = li[li.length - 1].getBoundingClientRect(), card = document.querySelector("#days").getBoundingClientRect(); return { x: card.left, y: a.top + scrollY - 4, width: card.width, height: z.bottom - a.top + 8 }; };
  await both("11-before-readings-day-390-ar", rq("ar", "pre12"), { clip: tail, a: "list" });
  // Decision 12: the waiting tooltip, 390 AR and EN.
  const tipClip = () => { const tip = document.querySelector("#tip").getBoundingClientRect(); const card = document.querySelector("#plot-hit").closest("section").getBoundingClientRect(); return { x: card.left, y: tip.top + scrollY - 14, width: card.width, height: card.bottom - tip.top + 14 }; };
  await both("12a-waiting-tooltip-390-ar", dq("ar", "unavailable"), { file: "index.html", clip: tipClip, a: "gap" });
  await both("12b-waiting-tooltip-390-en", dq("en", "unavailable"), { file: "index.html", clip: tipClip, a: "gap" });
  // Decision 13: the coverage list, 390 AR and 320 AR (delayed, so the "no readings yet" span shows too).
  const covClip = () => { const cov = document.querySelector("#coverage"), rows = [...cov.querySelectorAll(".facts > div")]; const h = cov.querySelector("h3").getBoundingClientRect(), last = rows.find((r) => r.querySelector(".k-ahead")).getBoundingClientRect(), c = cov.getBoundingClientRect(); const x = Math.max(0, c.left - 16), r = Math.min(innerWidth, c.right + 16); return { x, y: h.top + scrollY - 12, width: r - x, height: last.bottom - h.top + 24 }; };
  await both("13a-coverage-390-ar", dq("ar", "delayed"), { file: "index.html", clip: covClip, a: "details" });
  await both("13b-coverage-320-ar", dq("ar", "delayed"), { width: 320, file: "index.html", clip: covClip, a: "details" });
}

try {
  if (part("measure")) for (const width of Object.keys(SIZES).map(Number)) for (const lang of ["ar", "en"]) {
    for (const state of Object.keys(R_STATES)) await measure("reports.html", lang, state, width);
    if (width <= 720) for (const state of ["28d", "short", "day17", "pre12"]) await measure("reports.html", lang, state, width, "list");
    if (width < 1280) for (let d = 0; d < 7; d++) await measure("reports.html", lang, "28d", width, `day${d}`);
    for (const state of ["live", "delayed", "unavailable", "closed"]) await measure("index.html", lang, state, width, state === "unavailable" || state === "closed" ? null : "details");
    for (const state of ["live", "unavailable"]) await measure("index.html", lang, state, width, "gap");
  }
  if (part("status")) for (const lang of ["ar", "en"]) for (const width of Object.keys(SIZES).map(Number)) await statusBoxes(width, lang);
  if (part("contrast")) {
    await contrast("daily-minute-row-ar", "index.html", dq("ar", "live"), 390, "#minutes tr.none td", "minuteGap");
    await contrast("daily-coverage-miss-ar", "index.html", dq("ar", "delayed"), 390, "#coverage .facts dd.is-span", "details");
    await contrast("daily-waiting-tip-ar", "index.html", dq("ar", "unavailable"), 390, "#tip", "gap");
    await contrast("daily-gap-tip-ar", "index.html", dq("ar", "live"), 390, "#tip", "gap");
    await contrast("reports-full-row-768-ar", "reports.html", rq("ar", "short"), 768, "#days-table td.c-none");
    await contrast("reports-day-row-768-ar", "reports.html", rq("ar", "day17"), 768, "#days-table tr.is-none-day td.c-none");
    await contrast("reports-day-item-390-ar", "reports.html", rq("ar", "day17"), 390, "#day-list .is-none-day .dl-more");
    await contrast("reports-run-item-390-ar", "reports.html", rq("ar", "short"), 390, "#day-list .dli.is-none", "list");
    for (let d = 0; d < 7; d++) {
      const o = await open("build", rq("ar", "28d"), { width: 390 });
      await act(o.page, `day${d}`);
      const kinds = await o.page.evaluate(() => [...document.querySelectorAll(".hb-run")].map((e) => e.className));
      await o.context.close();
      for (const k of new Set(kinds)) { const c = k.includes("closed") ? "closed" : "none"; if (!log.contrast[`reports-hour-run-${c}-390-ar`]) await contrast(`reports-hour-run-${c}-390-ar`, "reports.html", rq("ar", "28d"), 390, `.hb-run.is-${c}`, `day${d}`); }
    }
    for (const c of ["closed", "nodata"]) await contrast(`reports-heat-tip-${c}-1440-ar`, "reports.html", rq("ar", c === "nodata" ? "7d" : "28d"), 1440, "#heat-tip", `hover:.hc.${c}`);
  }
  if (part("compare")) {
    for (const width of [1440, 768, 390]) for (const lang of ["ar", "en"]) for (const st of D_STATES) {
      const k = `daily-${width}-${lang}-${st}`;
      await pair(k, "index.html", dq(lang, st), width);
      if (!["loading", "error", "closed", "unavailable"].includes(st)) {
        await pair(`${k}-details`, "index.html", dq(lang, st), width, "details");
        await pair(`${k}-details-gap-row`, "index.html", dq(lang, st), width, "minuteGap");
        await pair(`${k}-details-last-row`, "index.html", dq(lang, st), width, "minuteLast");
      }
      if (["live", "delayed", "unavailable"].includes(st)) await pair(`${k}-gap-tooltip`, "index.html", dq(lang, st), width, "gap");
    }
    for (const width of [1440, 1024, 768, 390, 320]) for (const lang of ["ar", "en"]) {
      for (const state of Object.keys(R_STATES)) await pair(`reports-${width}-${lang}-${state}`, "reports.html", rq(lang, state), width);
      if (width <= 720) for (const state of ["28d", "short", "pre12"]) await pair(`reports-${width}-${lang}-${state}-list`, "reports.html", rq(lang, state), width, "list");
      if (width < 1280) for (let d = 0; d < 7; d++) await pair(`reports-${width}-${lang}-28d-day${d}`, "reports.html", rq(lang, "28d"), width, `day${d}`);
      if (width === 1440) for (const c of ["closed", "nodata"]) await pair(`reports-1440-${lang}-tip-${c}`, "reports.html", rq(lang, c === "nodata" ? "7d" : "28d"), width, null, `.hc.${c}`);
    }
  }
  if (part("evidence")) await evidence();
} finally {
  await writeFile(join(OUT, ONLY ? `wording-log-${ONLY.replace(/,/g, "-")}.json` : "wording-log.json"), JSON.stringify(log, null, 1));
  await browser.close();
}
if (log.failures.length) { console.error(log.failures.join("\n")); process.exit(1); }
console.log("ok", Object.keys(log.measures).length, "measured pages,", Object.keys(log.frames).length, "frames compared,", Object.keys(log.evidence).length, "evidence images");
