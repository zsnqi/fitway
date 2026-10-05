// Eclipse interaction motion capture (DECISIONS item 36, motion.js). Serves this folder on 127.0.0.1 (port 3176 unless
// --port=N; never 3173 or 3174) and records, with the worktree's Playwright chromium, each moment the round designed, in
// both languages, numbered the same in both:
//   1-dialog   a dialog opens and closes (Reports' export dialog): opened, closed with Escape, then closed while it
//              opens and opened again while it closes, closed by the scrim; the period dialog (the date picker) too; 1440 x 900, 768 x 1024 (the dialog), 390 x 844 (the sheet) and
//              the 200% zoom of 1440 x 900 (720 x 450 at 2x)
//   2-button   a press: "Export CSV" to "Preparing…" (the label rolls), a fast double press (one run), a failure (the
//              panel settles around its alert, "Try again"), and the retry to done; 1440 and 390
//   3-done     the export's done state: the panel settles, the file line glides, the mark draws, the words rise;
//              1440, 768, 390 and the 200% zoom
//   4-popover  the header status's details (from 721 px) and the phone's menu: open and close, by pointer and by key;
//              1440 and 390
//   5-copy     Access's code change: Continue (the view takes the form's place), «نسخ» to «نُسخ», then "I've saved it"
//              and the done line; 1440 and 390
//   6-row      Access: deactivate an owner, then reactivate another: the dialog leaves, the row changes under it, the
//              done line arrives on the row; 1440 and 390
//   7-retry    Daily's first load failed: "Try again" → "Trying again…"; 1440 and 390
//   8-activity Activity log: the dates dialog opens and closes; "Show older" → "Loading older…"; 1440 and 390
//   9-export   the export's done moment in its three variants (?done=0|1|2, DECISIONS item 38), and
//   10-row     Access's row after a deactivation and a reactivation in its two options (?row=0|1): see "9 and 10" below
//              (moments 1-8 run with ?done=0 and ?row=0, the pages as built)
//   11-records Access's records card: a new record arrives with the done line, in both row options, and its range (every
//              kind of change, a record that wraps, the first record, the card's failure, Cancel change, a second change
//              before the first has settled): see "11" below
// For each moment, size and language it writes to <outDir>:
//   N-<moment>-<size>-<lang>.webm  recorded in real time (the page's own timing, with every wait it needs)
//   N-<moment>-<size>-<lang>.png   a filmstrip per beat: every movement frozen on its first frame (motion.js
//                                  capture.freeze), then seeked to fixed steps, and the frame 200 ms after it ends
//   R-N-<moment>-<size>-<lang>.png the reduced-motion end state of each beat beside the animated one, with the count of
//                                  pixels that differ
// and motion-log.json. From file:// it runs moments 1, 3 and 6 at 1440 in both languages (F- rows in the log, strips
// F-N-...). It exits 1 if a check fails: a console message or page error; anything motion.js added still in the page
// at rest (an element, a class, an inline style, a running animation); a layout shift while anything moves; a dialog
// scrolled while it moves (a focus into a panel still moving cancels the movement out); focus not
// moved by the action itself (before any frame); a reduced-motion end state that differs from the animated one (more
// than four pixels, or any pixel by more than 24 levels: a ring's anti-aliasing redrawn is raster noise; a text selection
// a double press made is noted and cleared first); a
// done state shown before its work finished; two runs from a double press.
//   node design-research/owner-composition-exploration-r04/directions/eclipse/motion-capture.mjs <outDir> [--port=3176] [--only=1,3] [--lang=ar|en] [--size=d,t,p,z,l] [--video=0] [--file=0]
import { createServer } from "node:http";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_ARG = process.argv.slice(2).find((a) => !a.startsWith("--"));
if (!OUT_ARG) throw new Error("motion-capture.mjs needs an output folder outside the repository");
const OUT = resolve(OUT_ARG);
if ((OUT + sep).toLowerCase().startsWith(resolve(HERE, "../../../..").toLowerCase() + sep)) throw new Error("the output folder must be outside the repository worktree");
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const PORT = Number(arg("port", "3176"));
if ([3173, 3174].includes(PORT)) throw new Error("ports 3173 and 3174 belong to other captures");
const ONLY = arg("only", "").split(",").filter(Boolean);
const LANGS = arg("lang", "") ? [arg("lang", "")] : ["ar", "en"];
const SIZE_KEYS = arg("size", "d,t,p,z,l").split(",");
const VIDEO = arg("video", "1") !== "0";
const FILE_RUN = arg("file", "1") !== "0";
const ORIGIN = `http://127.0.0.1:${PORT}`;
const FILE_ORIGIN = pathToFileURL(HERE).href;
await mkdir(OUT, { recursive: true });
const VID_TMP = join(OUT, "_video");

const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".png": "image/png", ".json": "application/json", ".woff2": "font/woff2" };
const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", ORIGIN);
  const file = normalize(join(HERE, decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname)));
  if (!file.startsWith(HERE + sep)) { res.writeHead(403).end(); return; }
  try { const body = await readFile(file); res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream", "cache-control": "no-store" }); res.end(body); }
  catch { res.writeHead(404).end("not found"); }
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
const browser = await chromium.launch();
const log = { frames: {}, failures: [] };
const fail = (key, what) => { log.failures.push(`${key}: ${what}`); console.log(`  FAIL ${key}: ${what}`); };

const SIZES = { d: { w: 1440, h: 900, s: 1, name: "1440" }, t: { w: 768, h: 1024, s: 1, name: "768" }, p: { w: 390, h: 844, s: 1, name: "390" }, z: { w: 720, h: 450, s: 2, name: "z200" }, l: { w: 1024, h: 900, s: 1, name: "1024" } };

// Every layout shift is kept with its time, whatever started it (a shift while something moves is a jump).
const INIT = `(() => { window.__shifts = [];
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__shifts.push({ t: e.startTime, v: e.value, input: e.hadRecentInput, nodes: (e.sources || []).map((s) => s.node && (s.node.id || s.node.className || s.node.nodeName)).join(" ") }); }).observe({ type: "layout-shift", buffered: true }); } catch (e) {}
})();`;
// What motion.js might leave behind at rest: its elements and classes, an inline style it set, a running animation.
const LEFTOVERS = () => {
  const out = [];
  const marks = document.querySelectorAll(".m-ghost, .m-shade, .m-surface, .m-rolling, .m-roll, .m-reflow, .m-noshadow, .m-held, .m-edge, .m-skirt, .m-cap");
  if (marks.length) out.push(`${marks.length} motion element(s) or class(es)`);
  // Only where motion.js moves things (a page's own inline layout, such as Daily's axis labels, is the page's).
  for (const el of document.querySelectorAll("dialog [style], dialog[style], .fw-pop[style], .fw-pop [style], .rb-stack [style], .acc-card[style], .acc-card [style], .acc-keys[style], #grid > [style], .dlg-panel[style]")) {
    const st = el.getAttribute("style");
    if (/clip-path|stroke-dash|translateY|translate\(|scaleY/.test(st) && !el.closest("#export-progress, #heat-tip, .cx-tip")) out.push(`inline style on ${el.id || el.className}: ${st}`);
  }
  const running = document.getAnimations().filter((a) => !(a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest(".ping")));
  if (running.length) out.push(`${running.length} animation(s) running`);
  if (window.EclipseMotion && window.EclipseMotion.running) out.push(`${window.EclipseMotion.running} movement(s) open`);
  return out;
};

async function open(size, lang, url, { video = false, reduced = false, file = false } = {}) {
  const S = SIZES[size];
  const ctx = await browser.newContext({
    viewport: { width: S.w, height: S.h }, deviceScaleFactor: S.s, reducedMotion: reduced ? "reduce" : "no-preference",
    ...(video ? { recordVideo: { dir: VID_TMP, size: { width: Math.min(S.w, 1440), height: Math.min(S.h, 1024) } } } : {}),
  });
  await ctx.addInitScript(INIT);
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (["error", "warning"].includes(m.type())) errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  const base = file ? FILE_ORIGIN : ORIGIN;
  // Windows can run out of socket buffers after many loads (ERR_NO_BUFFER_SPACE): one more try after a short pause.
  const href = `${base}/${url}${url.includes("?") ? "&" : "?"}lang=${lang}`;
  try { await page.goto(href); } catch (e) { if (!/ERR_NO_BUFFER_SPACE/.test(String(e))) throw e; await new Promise((r) => setTimeout(r, 2000)); await page.goto(href); }
  await page.waitForFunction(() => document.fonts.status === "loaded" && window.EclipseMotion);
  await page.waitForTimeout(350);
  return { ctx, page, errors };
}
const freeze = (p) => p.evaluate(() => window.EclipseMotion.capture.freeze());
const seek = (p, t) => p.evaluate((x) => window.EclipseMotion.capture.seek(x), t);
const release = (p) => p.evaluate(() => window.EclipseMotion.capture.release());
const shiftsSince = (p, t0) => p.evaluate((t) => window.__shifts.filter((s) => s.t >= t), t0);
const now = (p) => p.evaluate(() => performance.now());

/* ---- the moments. Each beat: page, a setup that runs in real time, the action (trigger), the steps of its filmstrip
 * (ms after the action), the region shown (a function of the page), and the check after it. Beats run in order on one
 * page; a moment's video plays them all in real time. */
const dialogRect = (sel) => async (p) => p.evaluate((s) => {
  const vw = innerWidth, vh = innerHeight;
  const el = document.querySelector(s);
  if (!el || !el.getClientRects().length) return null;
  const r = el.getBoundingClientRect(), pad = 24;
  const x = Math.max(0, r.left - pad), y = Math.max(0, r.top - pad);
  return { x, y, width: Math.min(vw, r.right + pad) - x, height: Math.min(vh, r.bottom + pad) - y };
}, sel);
const whole = async (p) => p.evaluate(() => ({ x: 0, y: 0, width: innerWidth, height: innerHeight }));
// The open dialog's panel (or its leaving copy), from its layout box (the movement's transforms aside), with room for
// the rise and the shadow; on a phone, and when none is open, the whole screen.
const dlgClip = async (p) => p.evaluate(() => {
  const vw = innerWidth, vh = innerHeight;
  const panel = [...document.querySelectorAll("dialog[open] > .dlg-panel")].find((x) => !x.hidden && x.offsetWidth);
  if (!panel || vw <= 720) return null;
  const d = panel.parentElement.getBoundingClientRect();
  const x = Math.max(0, d.left + panel.offsetLeft - 32), y = Math.max(0, d.top + panel.offsetTop - 28);
  return { x, y, width: Math.min(vw, d.left + panel.offsetLeft + panel.offsetWidth + 32) - x, height: Math.min(vh, d.top + panel.offsetTop + panel.offsetHeight + 44) - y };
});
// The done line and the row it sits on (from 721 px), with room around them.
const noticeClip = async (p) => p.evaluate(() => {
  const n = document.querySelector("#notice");
  if (!n || innerWidth <= 720) return null;
  const host = n.closest(".acc-card") || n, r = host.getBoundingClientRect(), vw = innerWidth, vh = innerHeight;
  const x = Math.max(0, r.left - 24), y = Math.max(0, r.top - 24);
  return { x, y, width: Math.min(vw, r.right + 24) - x, height: Math.min(vh, r.bottom + 24) - y };
});
const region = (x, y, w, h) => async (p) => p.evaluate(([a, b, c, d]) => ({ x: a, y: b, width: Math.min(c, innerWidth - a), height: Math.min(d, innerHeight - b) }), [x, y, w, h]);
const topBand = (h) => async (p) => p.evaluate((hh) => ({ x: 0, y: 0, width: innerWidth, height: Math.min(hh, innerHeight) }), h);

const STEPS = {
  dlgIn: [0, 33, 66, 100, 160, 240, 340], dlgOut: [0, 33, 66, 120, 220], sheetIn: [0, 33, 66, 100, 170, 250, 340], sheetOut: [0, 40, 80, 140, 240],
  roll: [0, 40, 80, 140, 200, 280], reflow: [0, 50, 100, 170, 260, 420], done: [0, 100, 200, 300, 400, 500, 600, 700],
  pop: [0, 33, 66, 100, 150, 200], popOut: [0, 33, 70, 140], line: [0, 100, 200, 280, 360, 440, 500],
};
const isPhone = (size) => size === "p" || size === "z";

const MOMENTS = {
  1: { name: "dialog", page: "reports.html?done=0", sizes: ["d", "t", "p", "z"], beats: (size) => [
    { label: "open", focus0: "#dlg-export:not(.m-ghost) *", trigger: (p) => p.click("#export-btn"), steps: isPhone(size) ? STEPS.sheetIn : STEPS.dlgIn, clip: dlgClip,
      check: async (p) => (await p.evaluate(() => document.activeElement && document.activeElement.id)) },
    { label: "close (Escape)", focus0: "#export-btn", trigger: (p) => p.keyboard.press("Escape"), steps: isPhone(size) ? STEPS.sheetOut : STEPS.dlgOut, clip: dlgClip,
      check: async (p) => (await p.evaluate(() => document.activeElement && document.activeElement.id)) },
    { label: "closed while it opens (at 80 ms), opened again while it closes (40 ms later)", trigger: async (p, frozen) => {
      await p.click("#export-btn");
      if (frozen) { await seek(p, 80); } else await p.waitForTimeout(80);
      await p.keyboard.press("Escape");
      if (frozen) { await seek(p, 40); } else await p.waitForTimeout(40);
      await p.click("#export-btn");
    }, steps: isPhone(size) ? [0, 33, 66, 120, 200, 300] : [0, 16, 33, 66, 120, 240], clip: dlgClip },
    { label: "close (the scrim)", trigger: (p) => p.mouse.click(8, 8), steps: isPhone(size) ? STEPS.sheetOut : STEPS.dlgOut, clip: dlgClip },
    { label: "the period dialog (the date picker, focus on a day) opens", focus0: "#dlg-range .dp-day", trigger: (p) => p.click('#range-seg [data-range="custom"]'), steps: isPhone(size) ? STEPS.sheetIn : STEPS.dlgIn, clip: dlgClip },
    { label: "and closes (Escape)", trigger: (p) => p.keyboard.press("Escape"), steps: isPhone(size) ? STEPS.sheetOut : STEPS.dlgOut, clip: dlgClip },
  ] },
  2: { name: "button", page: "reports.html?export=fail&done=0", sizes: ["d", "p"], beats: () => [
    { label: "press: Export CSV → Preparing…", setup: async (p) => { await p.click("#export-btn"); await p.waitForTimeout(450); await p.evaluate(() => { const e = window.__reports.export; e.hold = true; e.revealDelay = 2e9; }); },
      trigger: (p) => p.click("#export-go"), steps: STEPS.roll, clip: dlgClip,
      check: async (p) => { const s = await p.evaluate(() => window.__reports.export.state); return s === "working" ? null : `state ${s} after the press`; } },
    { label: "after 300 ms of work: the panel settles around the progress line", setup: async (p) => { await p.waitForTimeout(100); },
      trigger: (p) => p.evaluate(() => window.__reports.export.reveal()), steps: STEPS.reflow, clip: dlgClip },
    { label: "failed: the panel settles around its alert; Preparing… → Try again (with it, at once)", setup: async (p) => { await p.waitForTimeout(450); },
      trigger: async (p) => { await p.evaluate(() => { window.__reports.export.hold = false; }); await p.waitForFunction(() => window.__reports.export.state === "failed"); },
      steps: STEPS.reflow, clip: dlgClip },
    { label: "a fast double press on Try again: Preparing… (one run), the alert steps aside", setup: async (p) => { await p.waitForTimeout(500); await p.evaluate(() => { const e = window.__reports.export; e.hold = true; e.revealDelay = 2e9; window.__run0 = e.run; }); },
      trigger: async (p) => { await p.dblclick("#export-go"); }, steps: STEPS.reflow, clip: dlgClip,
      check: async (p) => { const [s, runs] = await p.evaluate(() => [window.__reports.export.state, window.__reports.export.run - window.__run0]); return s === "working" && runs === 1 ? null : `state ${s}, ${runs} run(s) from a double press`; } },
    { label: "then done", setup: async (p) => { await p.waitForTimeout(300); },
      trigger: async (p) => { await p.evaluate(() => { window.__reports.export.hold = false; }); await p.waitForFunction(() => window.__reports.export.state === "done"); },
      steps: STEPS.done, clip: dlgClip },
  ] },
  3: { name: "done", page: "reports.html?done=0", sizes: ["d", "t", "p", "z"], beats: () => [
    { label: "the export finishes", focus0: "#export-save", setup: async (p) => { await p.click("#export-btn"); await p.waitForTimeout(450); await p.evaluate(() => { window.__reports.export.revealDelay = 2e9; }); await p.click("#export-go"); await p.waitForTimeout(150); },
      trigger: async (p) => { await p.waitForFunction(() => window.__reports.export.state === "done"); },
      steps: STEPS.done, clip: dlgClip,
      check: async (p) => { const f = await p.evaluate(() => document.activeElement.id); return f === "export-save" ? null : `focus on ${f}, not the file's Save`; } },
    { label: "closed with Done", trigger: (p) => p.click("#export-cancel"), steps: STEPS.dlgOut, clip: dlgClip },
  ] },
  4: { name: "popover", page: "reports.html?done=0", sizes: ["d", "p"], beats: (size) => (size === "d" ? [
    { label: "the status's details open (pointer)", trigger: (p) => p.click("#ops-btn"), steps: STEPS.pop, clip: region(0, 0, 760, 340) },
    { label: "and close (Escape)", focus0: "#ops-btn", trigger: (p) => p.keyboard.press("Escape"), steps: STEPS.popOut, clip: region(0, 0, 760, 340),
      check: async (p) => { const f = await p.evaluate(() => document.activeElement.id); return f === "ops-btn" ? null : `focus on ${f} after Escape`; } },
    { label: "open by key (Enter), close by a press outside", trigger: async (p) => { await p.keyboard.press("Enter"); }, steps: STEPS.pop, clip: region(0, 0, 760, 340) },
    { label: "a press outside", trigger: (p) => p.mouse.click(720, 40), steps: STEPS.popOut, clip: region(0, 0, 760, 340) },
  ] : [
    { label: "the menu opens", trigger: (p) => p.click("#menu-btn"), steps: STEPS.pop, clip: topBand(330) },
    { label: "and closes (Escape)", focus0: "#menu-btn", trigger: (p) => p.keyboard.press("Escape"), steps: STEPS.popOut, clip: topBand(330),
      check: async (p) => { const f = await p.evaluate(() => document.activeElement.id); return f === "menu-btn" ? null : `focus on ${f} after Escape`; } },
    { label: "the status badge's details", trigger: (p) => p.click("#ops-btn"), steps: STEPS.pop, clip: topBand(330) },
    { label: "the menu while the details are open: one closes, one opens", trigger: (p) => p.click("#menu-btn"), steps: STEPS.pop, clip: topBand(330) },
  ]) },
  5: { name: "copy", page: "access.html?row=0", sizes: ["d", "p"], beats: () => [
    { label: "Continue: the view takes the form's place", setup: async (p) => { await p.click('[data-act="pinChange"]'); await p.waitForTimeout(450); await p.fill("#pin-code", "Desk2026Front"); },
      trigger: (p) => p.click("#pin-confirm .acc-do"), steps: STEPS.reflow, clip: dlgClip },
    { label: "Copy → Copied («نسخ» → «نُسخ»)", setup: async (p) => { await p.waitForTimeout(600); },
      trigger: (p) => p.click("#pin-copy"), steps: STEPS.roll, clip: dialogRect("#pin-secret"),
      check: async (p) => { const s = await p.evaluate(() => document.querySelector("#pin-copy").dataset.state); return s === "1" ? null : "not copied"; } },
    { label: "a second press on Copied: nothing moves", trigger: (p) => p.click("#pin-copy"), steps: [0, 60, 120], clip: dialogRect("#pin-secret") },
    { label: "I've saved it → Saving…", setup: async (p) => { await p.waitForTimeout(300); await p.evaluate(() => { window.__access.hold = true; }); },
      trigger: (p) => p.click("#pin-saved"), steps: STEPS.roll, clip: dlgClip },
    { label: "saved: the view leaves (no code in its picture), the done line arrives on the front desk", focus0: "#notice", setup: async (p) => { await p.waitForTimeout(200); },
      trigger: async (p) => { await p.evaluate(() => { window.__access.hold = false; window.__access.answer(); }); }, steps: STEPS.line, clip: [dlgClip, noticeClip],
      check: async (p) => { const f = await p.evaluate(() => [document.activeElement.id, document.body.innerHTML.includes("Desk2026Front")]); return f[0] === "notice" && !f[1] ? null : `focus ${f[0]}, code left in the page: ${f[1]}`; } },
  ] },
  6: { name: "row", page: "access.html?row=0", sizes: ["d", "p"], beats: () => [
    { label: "Deactivate → Deactivating…", setup: async (p) => { await p.click('[data-act="off"][data-id="o2"]'); await p.waitForTimeout(450); await p.evaluate(() => { window.__access.hold = true; }); },
      trigger: (p) => p.click("#off .acc-do"), steps: STEPS.roll, clip: dlgClip },
    { label: "done: the dialog leaves, the row has changed under it, its done line arrives", focus0: "#notice", setup: async (p) => { await p.waitForTimeout(200); },
      trigger: async (p) => { await p.evaluate(() => { window.__access.hold = false; window.__access.answer(); }); }, steps: STEPS.line, clip: [dlgClip, noticeClip],
      check: async (p) => { const f = await p.evaluate(() => [document.activeElement.id, window.__access.owners.find((o) => o.id === "o2").active]); return f[0] === "notice" && f[1] === false ? null : `focus ${f[0]}, Noura active ${f[1]}`; } },
    { label: "Reactivate another owner, by a fast double press on the action (one run)", setup: async (p) => { await p.waitForTimeout(500); await p.click('[data-act="on"][data-id="o3"]'); await p.waitForTimeout(450); await p.evaluate(() => { window.__access.hold = true; }); },
      trigger: async (p) => { await p.dblclick("#on .acc-do"); }, steps: STEPS.roll, clip: dlgClip },
    { label: "done", setup: async (p) => { await p.waitForTimeout(200); },
      trigger: async (p) => { await p.evaluate(() => { window.__access.hold = false; window.__access.answer(); }); }, steps: STEPS.line, clip: [dlgClip, noticeClip],
      check: async (p) => { const r = await p.evaluate(() => window.__access.records.acts.slice(0, 3).join(",")); return r === "on,off,pinCreate" || r.startsWith("on,off") ? null : `the records' top: ${r} (one run each)`; } },
  ] },
  7: { name: "retry", page: "index.html?state=error", sizes: ["d", "p"], beats: () => [
    { label: "Daily's first load failed: Try again → Trying again…", setup: async (p) => { await p.locator("#retry").scrollIntoViewIfNeeded(); },
      trigger: (p) => p.click("#retry"), steps: STEPS.roll, clip: dialogRect("#retry") },
  ] },
  8: { name: "activity", page: "activity.html?older=hold", sizes: ["d", "p"], beats: (size) => [
    { label: "the dates dialog opens", focus0: "#dlg-dates .dp-day", trigger: (p) => p.click("#dates-btn"), steps: isPhone(size) ? STEPS.sheetIn : STEPS.dlgIn, clip: dlgClip },
    { label: "and closes (Escape)", trigger: (p) => p.keyboard.press("Escape"), steps: isPhone(size) ? STEPS.sheetOut : STEPS.dlgOut, clip: dlgClip },
    { label: "Show older → Loading older…", setup: async (p) => { await p.locator("#older").scrollIntoViewIfNeeded(); await p.waitForTimeout(150); },
      trigger: (p) => p.click("#older"), steps: STEPS.roll, clip: dialogRect("#older") },
  ] },
};

// The smallest region holding every region a beat names, before and after its action (the whole screen if none).
async function unionClip(p, rects) {
  const r = rects.filter(Boolean);
  if (!r.length) return whole(p);
  const x = Math.min(...r.map((a) => a.x)), y = Math.min(...r.map((a) => a.y));
  const X = Math.max(...r.map((a) => a.x + a.width)), Y = Math.max(...r.map((a) => a.y + a.height));
  return { x: Math.floor(x), y: Math.floor(y), width: Math.ceil(X - Math.floor(x)), height: Math.ceil(Y - Math.floor(y)) };
}

/* ---- composing a filmstrip and an end-state comparison in a page */
// Each frame shown at a size that keeps a dialog's words readable (a full screen smaller).
const frameScale = (w) => (w > 1000 ? 0.4 : w > 600 ? 0.55 : 0.75);
async function compose(path, rows) {
  const p = await browser.newPage();
  const html = rows.map((r) => `<div class="row"><p>${r.label}</p><div class="fr">${r.frames.map((f) => `<figure><img src="data:image/png;base64,${f.png}" style="width:${Math.round(f.w * (f.s || frameScale(f.w)))}px"><figcaption>${f.t}</figcaption></figure>`).join("")}</div></div>`).join("");
  await p.setContent(`<style>body{margin:0;padding:12px;background:#1b1b1d;color:#cfcfcf;font:13px/1.4 system-ui,sans-serif;width:max-content}
    .row{margin-bottom:14px}.row p{margin:0 0 6px}.fr{display:flex;gap:8px;align-items:flex-start}figure{margin:0}figcaption{font-size:12px;color:#9a9a9a;margin-top:3px}
    img{display:block;outline:1px solid #333}</style>${html}`);
  await p.waitForFunction(() => [...document.images].every((i) => i.complete));
  await p.screenshot({ path, fullPage: true });
  await p.close();
}
async function pixelDiff(a, b) {
  const p = await browser.newPage();
  const n = await p.evaluate(async ([x, y]) => {
    const load = (s) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = `data:image/png;base64,${s}`; });
    const [A, B] = await Promise.all([load(x), load(y)]);
    if (A.width !== B.width || A.height !== B.height) return -1;
    const c = new OffscreenCanvas(A.width, A.height), g = c.getContext("2d");
    g.drawImage(A, 0, 0); const da = g.getImageData(0, 0, A.width, A.height).data;
    g.clearRect(0, 0, A.width, A.height); g.drawImage(B, 0, 0); const db = g.getImageData(0, 0, A.width, A.height).data;
    let k = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, max = 0;
    for (let i = 0; i < da.length; i += 4) {
      const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]));
      if (d > 2) { k++; const p = i / 4, x = p % A.width, y = (p - x) / A.width; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); max = Math.max(max, d); }
    }
    return k ? { n: k, box: [x0, y0, x1, y1], max } : 0;
  }, [a, b]);
  await p.close();
  return n;
}

/* ---- one moment at one size and language: the filmstrip run, the video run, the reduced-motion run */
async function runMoment(n, size, lang, { file = false } = {}) {
  const M = MOMENTS[n], S = SIZES[size];
  const key = `${file ? "F-" : ""}${n}-${M.name}-${S.name}-${lang}`;
  console.log(key);
  const entry = { beats: [] };
  log.frames[key] = entry;
  const beats = M.beats(size);
  // Filmstrip run: each beat frozen at its action and seeked.
  const animatedEnds = [];
  {
    const { ctx, page, errors } = await open(size, lang, M.page, { file });
    const rows = [];
    for (const b of beats) {
      if (b.setup) await b.setup(page);
      const clipFns = Array.isArray(b.clip) ? b.clip : [b.clip];
      const rects = [];
      for (const fn of clipFns) rects.push(await fn(page));
      await freeze(page);
      const t0 = await now(page);
      await b.trigger(page, true);
      for (const fn of clipFns) rects.push(await fn(page));
      const clip = await unionClip(page, rects);
      // Focus has moved on the action's own first frame, before anything has moved (every movement is still frozen at 0).
      if (b.focus0) {
        const at = await page.evaluate((sel) => { const a = document.activeElement; return a && a.matches(sel) ? null : (a ? a.id || a.className || a.tagName : "none"); }, b.focus0);
        if (at) fail(key, `${b.label}: on the first frame focus is on ${at}, not ${b.focus0}`);
      }
      // A dialog scrolled while it moves (a focus that reached into a panel still off its place) cancels the movement out.
      const scrolledDlg = await page.evaluate(() => [...document.querySelectorAll("dialog")].filter((d) => d.scrollTop || d.scrollLeft).map((d) => d.id));
      if (scrolledDlg.length) fail(key, `${b.label}: a dialog scrolled while it moves (${scrolledDlg.join(", ")})`);
      const frames = [];
      for (const t of b.steps) {
        await seek(page, t);
        frames.push({ t: `${t} ms`, png: (await page.screenshot({ clip })).toString("base64"), w: clip.width * S.s });
      }
      await release(page);
      await page.waitForFunction(() => !window.EclipseMotion.running, null, { timeout: 4000 }).catch(() => {});
      await page.waitForTimeout(200);
      const sel = await page.evaluate(() => { const t = String(getSelection()); getSelection().removeAllRanges(); return t; });
      const end = (await page.screenshot({ clip })).toString("base64");
      frames.push({ t: "200 ms after", png: end, w: clip.width * S.s });
      animatedEnds.push({ label: b.label, png: end, clip, w: clip.width * S.s });
      rows.push({ label: b.label, frames });
      const shifts = (await shiftsSince(page, t0)).filter((s) => s.v > 0.0001);
      const left = await page.evaluate(LEFTOVERS);
      const problem = b.check ? await b.check(page) : null;
      entry.beats.push({ label: b.label, shifts, left, check: problem, ...(sel ? { selection: sel } : {}) });
      if (shifts.length) fail(key, `${b.label}: layout shift ${shifts.map((s) => `${s.v.toFixed(4)} (${s.nodes})`).join(", ")}`);
      if (left.length) fail(key, `${b.label}: left at rest: ${left.join("; ")}`);
      if (typeof problem === "string" && b.label && !["open", "close (Escape)"].includes(b.label)) fail(key, `${b.label}: ${problem}`);
    }
    if (errors.length) fail(key, `console: ${errors.join(" | ")}`);
    await compose(join(OUT, `${key}.png`), rows);
    await ctx.close();
  }
  // Real-time video run (not from file://).
  if (VIDEO && !file) {
    const { ctx, page, errors } = await open(size, lang, M.page, { video: true });
    for (const b of beats) {
      if (b.setup) await b.setup(page);
      await b.trigger(page, false);
      await page.waitForTimeout(Math.max(...b.steps) + 450);
    }
    await page.waitForTimeout(400);
    const vpath = await page.video().path();
    await ctx.close();
    await rename(vpath, join(OUT, `${key}.webm`));
    if (errors.length) fail(key, `video run console: ${errors.join(" | ")}`);
  }
  // Reduced motion: every beat's end state at once, beside the animated one.
  {
    const { ctx, page, errors } = await open(size, lang, M.page, { reduced: true, file });
    const rows = [];
    const on = await page.evaluate(() => window.EclipseMotion.on());
    if (on) fail(key, "reduced motion left motion on");
    for (const [i, b] of beats.entries()) {
      if (b.setup) await b.setup(page);
      const t0 = await now(page);
      await b.trigger(page, false);
      await page.waitForTimeout(60);
      // A text selection is the reader's, not the page's state: it is noted and cleared before the comparison (a double
      // press can select a word where the press landed after the page moved under it).
      const selected = await page.evaluate(() => { const t = String(getSelection()); getSelection().removeAllRanges(); return t; });
      if (selected) entry.beats[i].reducedSelection = selected;
      const a = animatedEnds[i];
      const red = (await page.screenshot({ clip: a.clip })).toString("base64");
      const dd = await pixelDiff(a.png, red), diff = dd ? dd.n : 0;
      const running = await page.evaluate(() => document.getAnimations().filter((x) => !(x.effect && x.effect.target && x.effect.target.closest && x.effect.target.closest(".ping"))).length);
      entry.beats[i].reduced = { diff, where: dd ? dd.box : null, maxDelta: dd ? dd.max : 0, running, shifts: (await shiftsSince(page, t0)).filter((s) => s.v > 0.0001).length };
      // A few pixels a few levels apart (a ring's anti-aliasing redrawn) are raster noise; anything more is a real difference.
      if (diff > 4 || (dd && dd.max > 24)) fail(key, `${b.label}: the reduced-motion end differs from the animated end in ${diff} pixel(s) at ${dd.box} (largest channel difference ${dd.max})`);
      if (running) fail(key, `${b.label}: ${running} animation(s) with reduced motion`);
      rows.push({ label: `${b.label}: animated end (left), reduced motion (right), ${diff} px differ`, frames: [{ t: "animated, 200 ms after", png: a.png, w: a.w }, { t: "reduced motion, at once", png: red, w: a.w }] });
    }
    if (errors.length) fail(key, `reduced run console: ${errors.join(" | ")}`);
    await compose(join(OUT, `R-${key}.png`), rows);
    await ctx.close();
  }
}

/* ---- 9 and 10 (DECISIONS item 38): the variants the user compares on the live site, each chosen by its URL parameter
 * (which also hides the page's trial switch):
 *   9-export   the export's done moment: ?done=0 as built, 1 the mark draws while the window shrinks, 2 the calendar is
 *              cut away by the window's moving edge, then the mark draws as built
 *   10-row     Access's row after a deactivation (off) and a reactivation (on): ?row=0 as built, 1 the row changes once
 *              the window has gone
 * At 1440 and 390 in Arabic: each variant's real-time video (N-<moment>-v<V>-<size>-ar.webm, the moment from the press
 * to its rest), one sheet comparing the variants frame by frame every 50 ms from the press of Export or of the
 * confirmation to 200 ms after the last movement (N-<moment>[-<act>]-<size>-ar.png; the file is ready at 400 ms and the
 * answer comes at 700 ms, as the sample's own timing has them), and R-N-... the reduced-motion end state beside each
 * variant's animated end; for the export also the range sheet (N-export-range-<size>-ar.png: a failure and its retry,
 * the window closed 100 ms into the movement, the widest file line). In English, and at 768 in both languages, stills
 * only: two frames into the result and the end (N-<moment>[-<act>]-<size>-<lang>.png). It fails a variant whose end
 * differs from variant 0's, a reduced-motion end that differs from the animated one, the trial switch or an animation
 * with reduced motion, focus not moved on the result's own first frame, a done state shown before the file exists, a
 * layout shift while anything moves, anything left at rest, and a console message. */
const VARIANTS = {
  9: { name: "export", values: ["0", "1", "2"], param: "done", page: "reports.html", at: 400, until: 1250, acts: [null] },
  10: { name: "row", values: ["0", "1"], param: "row", page: "access.html", at: 700, until: 1600, acts: ["off", "on"] },
  11: { name: "records", values: ["0", "1"], param: "row", page: "access.html", at: 700, until: 1600, acts: ["off"] },
};
const ROW_ID = { off: "o2", on: "o3" };
const vScale = (size, n) => (size === "p" ? 0.5 : n === "10" ? 0.3 : n === "11" ? 0.5 : 0.4);
// The region a moment is seen in: the export's panel at its tallest (from 721 px), the records card, or the whole screen.
async function vClip(p, n, size) { return n === "9" && size === "d" ? (await dlgClip(p)) || whole(p) : n === "11" ? (await recClip(p)) || whole(p) : whole(p); }
// Up to the press: the export's dialog opened, its file held so the result comes when the capture says; Access's
// confirmation opened, its answer held.
async function vSetup(p, n, act) {
  if (n === "9") {
    await p.click("#export-btn");
    await p.waitForTimeout(500);
    await p.evaluate(() => { const e = window.__reports.export; e.revealDelay = 2e9; e.hold = true; });
  } else {
    await p.click(`[data-act="${act}"][data-id="${ROW_ID[act]}"]`);
    await p.waitForTimeout(500);
    await p.evaluate(() => { window.__access.hold = true; });
  }
}
const vPress = (p, n, act) => (n === "9" ? p.click("#export-go") : p.click(`#${act} .acc-do`));
async function vResult(p, n) {
  if (n === "9") { await p.evaluate(() => { window.__reports.export.hold = false; }); await p.waitForFunction(() => window.__reports.export.state === "done"); }
  else await p.evaluate(() => { window.__access.hold = false; window.__access.answer(); });
}
const vFocus = (n) => (n === "9" ? "export-save" : "notice");
const vRest = async (p) => { await release(p); await p.waitForFunction(() => !window.EclipseMotion.running, null, { timeout: 5000 }).catch(() => {}); await p.waitForTimeout(200); };
const vFrame = async (p, t, clip, size, n) => ({ t, png: (await p.screenshot({ clip })).toString("base64"), w: clip.width * SIZES[size].s, s: vScale(size, n) });

// The records card (from 721 px), with room around it; none on a phone, where the card is not shown.
const recClip = async (p) => p.evaluate(() => {
  const el = document.querySelector("#records");
  if (!el || !el.getClientRects().length) return null;
  const r = el.getBoundingClientRect(), vw = innerWidth, vh = innerHeight;
  const x = Math.max(0, Math.floor(r.left - 16)), y = Math.max(0, Math.floor(r.top - 16));
  return { x, y, width: Math.min(vw, Math.ceil(r.right + 16)) - x, height: Math.min(vh, Math.ceil(r.bottom + 24)) - y };
});

// One variant's moment, frozen and seeked: frames at the given steps from the press (before `at`, the press's own
// movements; from `at`, the result's), then its rest. Returns the frames, the end and the region.
async function vTimeline(n, size, lang, v, act, steps, { url = null } = {}) {
  const V = VARIANTS[n];
  const key = `${n}-${V.name}${act ? `-${act}` : ""}-v${v}-${SIZES[size].name}-${lang}${url ? " (" + url + ")" : ""}`;
  const { ctx, page, errors } = await open(size, lang, url || `${V.page}?${V.param}=${v}`);
  await vSetup(page, n, act);
  const clip = await vClip(page, n, size);
  await freeze(page);
  const t0 = await now(page);
  await vPress(page, n, act);
  const frames = [];
  let after = false;
  for (const t of steps) {
    if (t >= V.at && !after) {
      after = true;
      await release(page);
      await page.waitForFunction(() => !window.EclipseMotion.running, null, { timeout: 4000 }).catch(() => {});
      await freeze(page);
      await vResult(page, n);
      const f = await page.evaluate(() => document.activeElement && document.activeElement.id);
      if (f !== vFocus(n)) fail(key, `focus on ${f} on the result's first frame, not #${vFocus(n)}`);
    }
    if (!after && n === "9" && await page.evaluate(() => !document.querySelector("#export-done").hidden)) fail(key, `the done state shown at ${t} ms, before the file exists`);
    await seek(page, after ? t - V.at : t);
    frames.push(await vFrame(page, `${t} ms`, clip, size, n));
  }
  if (!after) { await release(page); await vResult(page, n); }
  await vRest(page);
  const end = (await page.screenshot({ clip })).toString("base64");
  const shifts = (await shiftsSince(page, t0)).filter((x) => x.v > 0.0001);
  const left = await page.evaluate(LEFTOVERS);
  if (shifts.length) fail(key, `layout shift ${shifts.map((x) => `${x.v.toFixed(4)} (${x.nodes})`).join(", ")}`);
  if (left.length) fail(key, `left at rest: ${left.join("; ")}`);
  if (errors.length) fail(key, `console: ${errors.join(" | ")}`);
  log.frames[key] = { shifts, left };
  await ctx.close();
  return { frames, end, clip, w: clip.width * SIZES[size].s };
}
// A variant in real time, from the press to its rest (both actions on Access).
async function vVideo(n, size, lang, v) {
  const V = VARIANTS[n];
  const key = `${n}-${V.name}-v${v}-${SIZES[size].name}-${lang}`;
  const { ctx, page, errors } = await open(size, lang, `${V.page}?${V.param}=${v}`, { video: true });
  for (const act of V.acts) {
    if (n === "9") { await page.click("#export-btn"); await page.waitForTimeout(700); await page.evaluate(() => { window.__reports.export.revealDelay = 2e9; }); await page.click("#export-go"); }
    else { await page.click(`[data-act="${act}"][data-id="${ROW_ID[act]}"]`); await page.waitForTimeout(700); await page.click(`#${act} .acc-do`); }
    await page.waitForTimeout(V.until + 700);
  }
  const vpath = await page.video().path();
  await ctx.close();
  await rename(vpath, join(OUT, `${key}.webm`));
  if (errors.length) fail(key, `video run console: ${errors.join(" | ")}`);
}
// A variant's end with reduced motion (every variant is then the page as built, with no switch).
async function vReduced(n, size, lang, v, act, clip) {
  const V = VARIANTS[n], key = `R-${n}-${V.name}-v${v}-${SIZES[size].name}-${lang}`;
  const { ctx, page, errors } = await open(size, lang, `${V.page}?${V.param}=${v}`, { reduced: true });
  await vSetup(page, n, act);
  await vPress(page, n, act);
  await page.waitForTimeout(100);
  await vResult(page, n);
  await page.waitForTimeout(100);
  const png = (await page.screenshot({ clip })).toString("base64");
  const running = await page.evaluate(() => document.getAnimations().filter((x) => !(x.effect && x.effect.target && x.effect.target.closest && x.effect.target.closest(".ping"))).length);
  if (running) fail(key, `${running} animation(s) with reduced motion`);
  if (errors.length) fail(key, `console: ${errors.join(" | ")}`);
  await ctx.close();
  return png;
}
// Without the parameter, the trial switch is shown, and not with reduced motion.
async function vSwitch(n, size, lang) {
  const V = VARIANTS[n], key = `${n}-${V.name}-switch-${SIZES[size].name}-${lang}`;
  for (const reduced of [false, true]) {
    const { ctx, page } = await open(size, lang, V.page, { reduced });
    const shown = await page.evaluate(() => { const s = document.querySelector(".m-trial"); return Boolean(s && !s.hidden && s.getClientRects().length); });
    if (shown === reduced) fail(key, `the trial switch ${shown ? "shown" : "not shown"}${reduced ? " with reduced motion" : ""}`);
    await ctx.close();
  }
}
const steps50 = (to) => Array.from({ length: Math.floor(to / 50) + 1 }, (_, i) => i * 50);
async function vSame(key, what, a, b) {
  const d = await pixelDiff(a, b), k = d ? d.n : 0;
  if (k > 4 || (d && d.max > 24)) fail(key, `${what}: ${k} pixel(s) differ at ${d.box} (largest channel difference ${d.max})`);
  return k;
}

async function runVariants(n) {
  const V = VARIANTS[n];
  for (const lang of LANGS) for (const size of ["d", "p", "t"]) {
    if (!SIZE_KEYS.includes(size)) continue;
    const full = lang === "ar" && size !== "t";
    for (const act of V.acts) {
      const base = `${n}-${V.name}${act ? `-${act}` : ""}-${SIZES[size].name}-${lang}`;
      console.log(base);
      // Arabic at 1440 and 390: every 50 ms; English and 768: two frames into the result, and the end.
      const steps = full ? steps50(V.until) : [V.at + 150, V.at + 300];
      const runs = {};
      for (const v of V.values) runs[v] = await vTimeline(n, size, lang, v, act, steps);
      for (const v of V.values.slice(1)) await vSame(base, `${V.param}=${v}'s end against ${V.param}=${V.values[0]}'s`, runs[V.values[0]].end, runs[v].end);
      // The sheet: the variants in rows, in blocks of up to 13 steps, so a column is one moment in every variant.
      const all = (v) => [...runs[v].frames, { t: "200 ms after", png: runs[v].end, w: runs[v].w, s: vScale(size, n) }];
      const per = full ? 13 : steps.length + 1, rows = [];
      for (let i = 0; i < all(V.values[0]).length; i += per) for (const v of V.values) rows.push({ label: `${V.param}=${v}`, frames: all(v).slice(i, i + per) });
      await compose(join(OUT, `${base}.png`), rows);
      if (!full) continue;
      const rrows = [];
      for (const v of V.values) {
        const red = await vReduced(n, size, lang, v, act, runs[v].clip);
        const k = await vSame(`R-${base}`, `${V.param}=${v}: the reduced-motion end against the animated end`, runs[v].end, red);
        rrows.push({ label: `${V.param}=${v}: animated end (left), reduced motion (right), ${k} px differ`, frames: [{ t: "animated, 200 ms after", png: runs[v].end, w: runs[v].w, s: vScale(size, n) }, { t: "reduced motion, at once", png: red, w: runs[v].w, s: vScale(size, n) }] });
      }
      await compose(join(OUT, `R-${base}.png`), rrows);
    }
    if (!full) continue;
    await vSwitch(n, size, lang);
    if (VIDEO) for (const v of V.values) await vVideo(n, size, lang, v);
    if (n === "9") await runExportRange(size, lang);
  }
}

// The export's range, per variant: a failure and its retry, the window closed 100 ms into the movement (Escape), and
// the widest file line (the whole history, 74,880 rows).
async function runExportRange(size, lang) {
  const V = VARIANTS[9], key = `9-export-range-${SIZES[size].name}-${lang}`;
  console.log(key);
  const rows = [], doneSteps = [0, 50, 100, 150, 200, 300, 450, 700];
  for (const v of V.values) {
    {
      const { ctx, page, errors } = await open(size, lang, `reports.html?export=fail&done=${v}`);
      await page.click("#export-btn");
      await page.waitForTimeout(500);
      const clip = await vClip(page, "9", size);
      await page.evaluate(() => { window.__reports.export.revealDelay = 2e9; });
      await page.click("#export-go");
      await page.waitForFunction(() => window.__reports.export.state === "failed");
      await page.waitForTimeout(600);
      const frames = [await vFrame(page, "failed: Try again", clip, size, "9")];
      await page.evaluate(() => { window.__reports.export.hold = true; });
      await page.click("#export-go");
      await page.waitForTimeout(600);
      await freeze(page);
      await vResult(page, "9");
      for (const t of doneSteps) { await seek(page, t); frames.push(await vFrame(page, `${t} ms`, clip, size, "9")); }
      await vRest(page);
      frames.push(await vFrame(page, "200 ms after", clip, size, "9"));
      const left = await page.evaluate(LEFTOVERS);
      if (left.length) fail(key, `done=${v}, the retry: left at rest: ${left.join("; ")}`);
      if (errors.length) fail(key, `done=${v}, the retry: console: ${errors.join(" | ")}`);
      rows.push({ label: `done=${v}: a failure, then Try again (ms from the file being ready)`, frames });
      await ctx.close();
    }
    {
      const { ctx, page, errors } = await open(size, lang, `reports.html?done=${v}`);
      await vSetup(page, "9");
      const clip = await vClip(page, "9", size);
      await vPress(page, "9");
      await page.waitForTimeout(150);
      await freeze(page);
      await vResult(page, "9");
      await seek(page, 100);
      const frames = [await vFrame(page, "100 ms in", clip, size, "9")];
      await page.keyboard.press("Escape");
      for (const t of [0, 40, 80, 140, 240]) { await seek(page, t); frames.push(await vFrame(page, `Escape + ${t} ms`, clip, size, "9")); }
      await vRest(page);
      frames.push(await vFrame(page, "200 ms after", clip, size, "9"));
      const f = await page.evaluate(() => document.activeElement && document.activeElement.id), left = await page.evaluate(LEFTOVERS);
      if (f !== "export-btn") fail(key, `done=${v}, closed mid-movement: focus on ${f}, not the export button`);
      if (left.length) fail(key, `done=${v}, closed mid-movement: left at rest: ${left.join("; ")}`);
      if (errors.length) fail(key, `done=${v}, closed mid-movement: console: ${errors.join(" | ")}`);
      rows.push({ label: `done=${v}: closed with Escape 100 ms after the file is ready`, frames });
      await ctx.close();
    }
    {
      const r = await vTimeline("9", size, lang, v, null, doneSteps.map((t) => V.at + t), { url: `reports.html?from=2026-08-02&to=2026-09-22&done=${v}` });
      rows.push({ label: `done=${v}: the widest file line (2 August to 22 September, 74,880 rows; ms from the file being ready)`, frames: [...r.frames.map((f) => ({ ...f, t: `${parseInt(f.t, 10) - V.at} ms` })), { t: "200 ms after", png: r.end, w: r.w, s: vScale(size, "9") }] });
    }
  }
  await compose(join(OUT, `${key}.png`), rows);
}

/* ---- 11 (DECISIONS item 38): Access's records card. A change writes its record, which arrives at the top of the card
 * in the same movement as the done line: the records below slide down, the new one is uncovered and its words rise when
 * the done line's do, the oldest of the eight leaves under the card's bottom edge. It follows the row option (?row=0|1).
 * At 1440 in Arabic: a deactivation in each row option, frame by frame every 50 ms from the press of the confirmation
 * to 200 ms after the last movement (11-records-off-1440-ar.png; the answer comes at 700 ms), each option's real-time
 * video (11-records-v<V>-1440-ar.webm, the whole page), and R-11-... the reduced-motion end beside each animated end;
 * then the range (11-records-range-1440-ar.png, ms from the answer): every kind of change, a record that wraps (the card
 * grows), a wrapped record leaving (it shrinks), the first record into an empty card, the card's own failure and Cancel
 * change (nothing in the card moves, its end equals its start), and a second change landing 150 ms into the first. In
 * English at 1440, and at 1024 in both languages, end states only (the deactivation's two options and the range).
 * It fails: an end that differs between the options or from its reduced-motion end, focus not on the done line on the
 * result's first frame (on the code's button after Cancel change), records that are not the ones the change wrote, any
 * movement in the card where nothing arrives, a layout shift, anything left at rest, a console message. */
const REC_CASES = [
  { id: "pinCreate", label: "a code created (?pin=none: four records, the card grows by one)", q: "pin=none", act: "pinCreate" },
  { id: "pinChange", label: "the code changed", act: "pinChange" },
  { id: "pinOff", label: "the code deactivated", act: "pinOff" },
  { id: "add", label: "an owner added", act: "add" },
  { id: "reset", label: "a password reset", act: "reset:o2" },
  { id: "mine", label: "one's own password changed", act: "mine:o1" },
  { id: "on", label: "an owner reactivated", act: "on:o3", rows: true },
  { id: "grow", label: "a record that wraps (?case=long): the card grows", q: "case=long", act: "off:o2", rows: true },
  { id: "shrink", label: "a wrapped record leaves (?case=long, after two changes made at once): the card shrinks", q: "case=long", pre: ["add", "pinOff"], act: "off:n4", rows: true },
  { id: "none", label: "?records=none: the first record replaces the \"none yet\" line", q: "records=none", act: "off:o2", rows: true },
  { id: "error", label: "?records=error: nothing arrives, the card is unchanged", q: "records=error", act: "off:o2", rows: true, still: true },
  { id: "cancel", label: "Cancel change in the code's view: no record, nothing moves", act: "pinChange", cancel: true, still: true },
  { id: "second", label: "a second change (Reactivate) lands 150 ms into the first (the review's hold allows it)", act: "off:o2", then: "on:o3", at: 150 },
];
const REC_STEPS = { 0: [0, 100, 150, 200, 250, 300, 400], 1: [0, 220, 300, 350, 400, 500, 600] };
// A change as the owner makes it: its window opened and filled; returns the confirming press.
async function recPrepare(p, spec) {
  const [act, id] = spec.split(":");
  await p.evaluate((s) => document.querySelector(s).click(), id ? `[data-act="${act}"][data-id="${id}"]` : `[data-act="${act}"]`);
  await p.waitForTimeout(500);
  if (act === "pinChange" || act === "pinCreate") { await p.fill("#pin-code", "Desk2026Front"); await p.click("#pin-confirm .acc-do"); await p.waitForTimeout(600); return "#pin-saved"; }
  if (act === "add") { await p.fill("#add-name", "Reem"); await p.fill("#add-email", "reem.new@example.com"); await p.fill("#add-pw", "a-strong-password-1"); }
  if (act === "reset") await p.fill("#reset-pw", "a-strong-password-1");
  if (act === "mine") { await p.fill("#mine-current", "old-password-123"); await p.fill("#mine-new", "a-strong-password-1"); }
  return act === "pinOff" ? "#pinoff .acc-do" : `#${act} .acc-do`;
}
// A second change made while the first still moves: its window opened, confirmed and answered at once.
async function recSecond(p, spec) {
  const sel = await recPrepare(p, spec);
  await p.evaluate((s) => { window.__access.hold = true; document.querySelector(s).click(); window.__access.hold = false; window.__access.answer(); }, sel);
}
// One case in one row option: frames from the answer (none for an end state), its end, and its checks.
async function recCase(c, size, lang, v, steps, { reduced = false } = {}) {
  const key = `11-records-${c.id}-v${v}-${SIZES[size].name}-${lang}${reduced ? "-reduced" : ""}`;
  const { ctx, page, errors } = await open(size, lang, `access.html?row=${v}${c.q ? `&${c.q}` : ""}`, { reduced });
  // Earlier changes at once (motion off for them only).
  for (const spec of c.pre || []) {
    await page.evaluate(() => window.EclipseMotion.setGate(() => false));
    const sel = await recPrepare(page, spec);
    await page.evaluate(() => { window.__access.hold = true; });
    await page.click(sel);
    await page.evaluate(() => { window.__access.hold = false; window.__access.answer(); });
    await page.waitForTimeout(100);
    await page.evaluate(() => window.EclipseMotion.setGate(() => true));
  }
  // The card before the change, at rest (before its window opens and dims the page).
  const ids0 = await page.evaluate(() => window.__access.records.ids.join(","));
  const before = await recClip(page);
  const start = before ? (await page.screenshot({ clip: before })).toString("base64") : null;
  const press = await recPrepare(page, c.act);
  await page.evaluate(() => { window.__access.hold = true; });
  if (!c.cancel) { await page.click(press); await page.waitForTimeout(300); }
  if (!reduced) await freeze(page);
  const t0 = await now(page);
  if (c.cancel) await page.click("#pin-undo");
  else await page.evaluate(() => { window.__access.hold = false; window.__access.answer(); });
  const want = c.cancel ? '[data-act="pinChange"]' : "#notice";
  const f = await page.evaluate((s) => { const a = document.activeElement; return a && a.matches(s) ? null : (a ? a.id || a.className || a.tagName : "none"); }, want);
  if (f) fail(key, `focus on ${f} on the result's first frame, not ${want}`);
  const clip = await unionClip(page, [before, await recClip(page)]);
  // Where nothing arrives, nothing in the card moves: no movement and no copy in it from the first frame.
  if (c.still) {
    const moving = await page.evaluate(() => document.querySelectorAll("#records .m-edge, #records .m-cap, #records .m-skirt, #records .m-ghost").length +
      document.getAnimations().filter((a) => a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest("#records")).length);
    if (moving) fail(key, `${moving} movement(s) or copies in the records card, where nothing arrives`);
  }
  const frames = [];
  let last = 0, second = false;
  const shot = async (t) => frames.push({ t, png: (await page.screenshot({ clip })).toString("base64"), w: clip.width * SIZES[size].s, s: 0.4 });
  for (const t of steps) {
    if (c.then && !second && t >= c.at) {
      second = true;
      await seek(page, c.at);
      last = c.at;
      await recSecond(page, c.then);
      await shot(`${c.at} ms: the second`);
    }
    if (second) await page.evaluate((x) => window.EclipseMotion.capture.advance(x), t - last);
    else await seek(page, t);
    last = t;
    await shot(`${t} ms`);
  }
  if (c.then && !second) { if (!reduced) await seek(page, c.at); await recSecond(page, c.then); }
  if (!reduced) await vRest(page);
  else await page.waitForTimeout(150);
  const end = (await page.screenshot({ clip })).toString("base64");
  const ids = await page.evaluate(() => window.__access.records.ids);
  // The records: unchanged after Cancel change; the new one on top otherwise (the card's failure shows none of them).
  if (c.cancel && ids.join(",") !== ids0) fail(key, `the records changed: ${ids0} → ${ids.join(",")}`);
  if (!c.still && (ids0.split(",").includes(String(ids[0])) || (ids0 && ids[c.then ? 2 : 1] !== +ids0.split(",")[0]))) fail(key, `the new record is not on top: ${ids0} → ${ids.join(",")}`);
  if (c.still && start && clip.width === before.width && clip.height === before.height) await vSame(key, "the records card's end against its start", start, end);
  // With reduced motion the page changes at once by design, so a shift is checked only where things move.
  const shifts = reduced ? [] : (await shiftsSince(page, t0)).filter((x) => x.v > 0.0001);
  const left = await page.evaluate(LEFTOVERS);
  if (shifts.length) fail(key, `layout shift ${shifts.map((x) => `${x.v.toFixed(4)} (${x.nodes})`).join(", ")}`);
  if (left.length) fail(key, `left at rest: ${left.join("; ")}`);
  if (reduced) {
    const running = await page.evaluate(() => document.getAnimations().filter((x) => !(x.effect && x.effect.target && x.effect.target.closest && x.effect.target.closest(".ping"))).length);
    if (running) fail(key, `${running} animation(s) with reduced motion`);
  }
  if (errors.length) fail(key, `console: ${errors.join(" | ")}`);
  log.frames[key] = { shifts, left, ids: ids.join(",") };
  await ctx.close();
  return { frames, end, clip, w: clip.width * SIZES[size].s };
}
async function runRecords() {
  const V = VARIANTS[11];
  for (const lang of LANGS) for (const size of ["d", "l"]) {
    if (!SIZE_KEYS.includes(size)) continue;
    const full = lang === "ar" && size === "d";
    const base = `11-records-off-${SIZES[size].name}-${lang}`;
    console.log(base);
    // The deactivation in each row option: every 50 ms in Arabic at 1440, else two frames into the result and the end.
    const steps = full ? steps50(V.until) : [V.at + 150, V.at + 300];
    const runs = {};
    for (const v of V.values) runs[v] = await vTimeline("11", size, lang, v, "off", steps);
    await vSame(base, "row=1's end against row=0's", runs["0"].end, runs["1"].end);
    const all = (v) => [...runs[v].frames, { t: "200 ms after", png: runs[v].end, w: runs[v].w, s: vScale(size, "11") }];
    const per = full ? 13 : steps.length + 1, rows = [];
    for (let i = 0; i < all("0").length; i += per) for (const v of V.values) rows.push({ label: `row=${v}`, frames: all(v).slice(i, i + per) });
    await compose(join(OUT, `${base}.png`), rows);
    const rrows = [];
    for (const v of V.values) {
      const red = await vReduced("11", size, lang, v, "off", runs[v].clip);
      const k = await vSame(`R-${base}`, `row=${v}: the reduced-motion end against the animated end`, runs[v].end, red);
      rrows.push({ label: `row=${v}: animated end (left), reduced motion (right), ${k} px differ`, frames: [{ t: "animated, 200 ms after", png: runs[v].end, w: runs[v].w, s: vScale(size, "11") }, { t: "reduced motion, at once", png: red, w: runs[v].w, s: vScale(size, "11") }] });
    }
    await compose(join(OUT, `R-${base}.png`), rrows);
    if (full && VIDEO) for (const v of V.values) await vVideo("11", size, lang, v);
    // The range: in Arabic at 1440 frame by frame; elsewhere its ends.
    const key = `11-records-range-${SIZES[size].name}-${lang}`;
    console.log(key);
    const rangeRows = [], redRows = [];
    for (const c of REC_CASES) for (const v of c.rows ? V.values : ["0"]) {
      const r = await recCase(c, size, lang, v, full ? (c.then ? [0, 100, 200, 250, 300, 400, 500, 650] : REC_STEPS[v]) : []);
      const red = await recCase(c, size, lang, v, [], { reduced: true });
      const same = r.clip.width === red.clip.width && r.clip.height === red.clip.height;
      if (!same) fail(`R-${key}`, `${c.id}, row=${v}: the reduced-motion end's region differs from the animated one's`);
      const k = same ? await vSame(`R-${key}`, `${c.id}, row=${v}: the reduced-motion end against the animated end`, r.end, red.end) : "-";
      const label = `${c.label}${c.rows ? `, row=${v}` : ""}`;
      rangeRows.push({ label: full ? `${label} (ms from the answer)` : label, frames: [...r.frames, { t: full ? "200 ms after" : label.slice(0, 44), png: r.end, w: r.w, s: full ? 0.4 : 0.32 }] });
      redRows.push({ label: `${label}: animated end (left), reduced motion (right), ${k} px differ`, frames: [{ t: "animated", png: r.end, w: r.w, s: 0.32 }, { t: "reduced motion", png: red.end, w: red.w, s: 0.32 }] });
    }
    if (full) await compose(join(OUT, `${key}.png`), rangeRows);
    else {
      // End states only: five cases to a row.
      const packed = [];
      for (let i = 0; i < rangeRows.length; i += 5) packed.push({ label: `cases ${i + 1}-${Math.min(i + 5, rangeRows.length)}`, frames: rangeRows.slice(i, i + 5).flatMap((r) => r.frames) });
      await compose(join(OUT, `${key}.png`), packed);
    }
    await compose(join(OUT, `R-${key}.png`), redRows);
  }
}


try {
  for (const n of Object.keys(MOMENTS)) {
    if (ONLY.length && !ONLY.includes(n)) continue;
    for (const size of MOMENTS[n].sizes) {
      if (!SIZE_KEYS.includes(size)) continue;
      for (const lang of LANGS) await runMoment(n, size, lang);
    }
  }
  for (const n of Object.keys(VARIANTS)) if (n !== "11" && (!ONLY.length || ONLY.includes(n))) await runVariants(n);
  if (!ONLY.length || ONLY.includes("11")) await runRecords();
  if (FILE_RUN) for (const n of ["1", "3", "6"]) {
    if (ONLY.length && !ONLY.includes(n)) continue;
    for (const lang of LANGS) await runMoment(n, "d", lang, { file: true });
  }
} finally {
  await writeFile(join(OUT, "motion-log.json"), JSON.stringify(log, null, 1));
  await rm(VID_TMP, { recursive: true, force: true });
  await browser.close();
  server.close();
}
console.log(log.failures.length ? `${log.failures.length} failure(s)` : "all checks passed");
process.exit(log.failures.length ? 1 : 0);
