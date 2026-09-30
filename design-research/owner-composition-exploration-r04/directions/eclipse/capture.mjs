// Eclipse capture (v3 lights, Round 6 motion). Serves this folder on 127.0.0.1:3173 and records the frames with
// Playwright chromium (fresh context per frame, so no stored tuning; deviceScaleFactor 1 unless a 2x crop;
// reducedMotion "reduce" for the still frames). Frames use ?tuner=0 unless they are about the tuner. Preset frames use
// ?tuner=0&preset=<id>.
// It also measures the lights (OKLab L relative to each card's own dark base, on light-only 1x captures with the
// card content hidden), renders ../light-study recipe A read-only as a calibration, and checks the tuner from file://
// (keyboard, presets, drag, copy, reset, ?tuner=0, the Motion group, and a crowd-level change with motion on).
// Static guard: the still frames (reduced motion) and the ?motion=off frames must equal the pre-motion frames
// (evidence/pre-motion-hashes.json), except the frames in EXPECTED_TO_CHANGE (since the lane round: every frame that shows
// the chart's plot, each with its reason), which must instead equal 8ae88f3 everywhere outside the plot element
// (evidence/lane-outside-plot.json); any other difference sets exit code 1.
// Round 6 checks (motion part, reducedMotion "no-preference" unless noted): the page with motion on, once at rest
// (after the first-open intro, or at once on a reload), equals the still frame and only the live pulse runs; the chart's stops (half hours, the peak, the latest
// reading, the missing span), the marker's distance to what it describes at every stop (AR and EN, against the SVG
// path's own geometry), pointer snapping, keyboard stepping, the follow staying on the curve, the digit roll (direction,
// transform only, never opacity on a glyph), the live region, a crowd-level change, the live tail, the delayed state
// and the rail. Held 2x motion frames and a contact sheet are written as motion-*.png. Any failed check sets exit 1.
// Round 7 step 2 (form B, the hollow ring, only; the smooth follow): hover stills (-hover, AR and EN, form B),
// marker-variants-ar-3x.png (B at the line, the peak, the latest reading live and delayed, still ahead, the missing span
// with the lit dots, and still ahead without history), the chart checks (the latest stop shows the latest reading and is
// never called an average), that form A and its switch are gone, the hover speed control, and the follow: held at
// times after a new target, the marker stays on the drawn curve, covers the clip's share of the distance, is not a
// straight hop, and moves at once where no drawn track joins two stops (the tooltip then eases).
// Round 7 step 3 (the first-open intro): every page opened with motion on is a tab's first open, so it plays the intro;
// open() waits for it to end, and the checks that follow start from the still page. The first-paint check is now the
// intro's: on a first open the intro plays and ends exactly at the still frame (AR and EN, live, delayed and no
// history), and a reload in the same tab has no intro at all. The intro part also checks when it plays (a second tab,
// reduced motion, ?motion=off, the tuner's Motion switch, Replay intro, the intro speed), that it yields at once to a
// hover, keys, the rail, a tap, a new reading and a resize (at 100 and 400 ms), that no box moves, no glyph fades, no
// long task runs and no font loads during it, and writes held 2x frames on intro-*.png sheets. The intro fix round:
// every surface is present and unchanged at the first paint and at the intro's first frame, with nothing running but
// the intro's content transforms and the pulse; the end after the held frames sets the exit code; and with the font
// files held 600 ms there is no intro and the answers are in view within 250 ms of the first paint (held 50 ms, it plays).
// The follow-up round after step 3: (1) the chart checks also measure the tooltip at every stop (one width per page,
// the widest tooltip that shows a number plus 2px, rounded up, the number at the same place against the hairline, no wrap
// and no clip); (2) every exact-hash
// comparison recaptures a frame that differs, the same way in a fresh context, and counts it as a difference only if it
// differs in the next attempt too (Chromium's glyph raster is not always byte-identical between runs; there is still
// no tolerance). Each comparison's attempts are in the log (motion.recaptures); one that differed once is noise.
// Repair 1 of the follow-up round: when a comparison's reference was rendered in this run (not a committed hash), a
// difference re-renders the reference and the compared frame, each in a fresh context, and the pair counts as a
// difference only if it differs again; each attempt logs its expected and actual hash.
// The lane round (2026-09-28; the user's decision, run owner_lane_r04_s04): the tooltip lives in a fixed lane at the top of
// the plot (its top 2px below the plot's top, its height the tallest tooltip among the chart's stops), centred on its stop and
// kept 2px inside the plot, with a connector to its mark; the scale starts lower. The chart checks replace the floating-
// placement checks (the side, the number's start against the hairline) with the lane's rules, at each page's own snapshot:
// the box's top is the lane's top at every stop; its x is its stop's x less half its width, clamped 2px inside the plot
// (0.01px); it lies inside the plot, the card and the lane, with no wrap and no clip; its connector meets the box and the mark
// (0.5px); and nothing else is painted in the lane (the top edge of every painted mark, the lines sampled every 1px, and the
// selected marker's glow, against the lane's bottom). Every other check is kept. Every frame that shows the plot changes, so
// EXPECTED_TO_CHANGE lists them (each with its reason), the checks that settle to a still frame compare with this run's
// reduced-motion frame for them, and each must equal 8ae88f3 outside the plot element. The other snapshots, every viewport,
// the fonts and the motion are swept by the lane round's probes, outside this file.
// Run from PowerShell at the worktree root:
//   node design-research/owner-composition-exploration-r04/directions/eclipse/capture.mjs [outDir] [--intro-frames=<dir>]
// --intro-frames=<dir> also writes every full-size held 2x intro frame there (they are large; they are not evidence).
// --plant=always|once (a negative control, into a local scratch outDir under the real system temp directory only;
// every output folder is checked): a 1px chalk dot is painted into the compared frame of every exact comparison, at (720, 450) or the
// nearest pixel inside a smaller frame, never into a reference, so a reference rendered in the same run stays clean;
// with "once" only the first attempt is planted, so a recapture is clean (the noise path).
// outDir defaults to evidence/. The static guard compares with evidence/pre-motion-hashes.json, which was rendered on
// the original Windows machine; on another machine (fonts render differently) pass a scratch outDir, and expect that
// guard to fail, so never let such a run rewrite evidence/.
// Add --motion-only to record only the motion part (the log is then printed, not written).
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { realpathSync, statSync } from "node:fs";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, normalize, resolve, sep } from "node:path";
import { crc32, deflateSync, inflateSync } from "node:zlib";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_ARG = process.argv.slice(2).find((a) => !a.startsWith("--"));
const OUT = OUT_ARG ? resolve(OUT_ARG) : join(HERE, "evidence");
const PORT = 3173;
const ORIGIN = `http://127.0.0.1:${PORT}`;
const FILE_URL = pathToFileURL(join(HERE, "index.html")).href;
const LIGHT_STUDY_URL = pathToFileURL(join(HERE, "..", "light-study", "index.html")).href;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".json": "application/json",
  ".woff2": "font/woff2",
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", ORIGIN);
  const path = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const file = normalize(join(HERE, path));
  if (!file.startsWith(HERE + sep)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream", "cache-control": "no-store" });
    res.end(body);
  } catch {
    res.writeHead(404).end("not found");
  }
});
await new Promise((resolve) => server.listen(PORT, "127.0.0.1", resolve));

const FRAMES = [
  { name: "daily-ar-1440x900", q: "lang=ar&tuner=0" },
  { name: "daily-en-1440x900", q: "lang=en&tuner=0" },
  // Round 7 step 2: the hover frames show form B, the only form (the step-1 -hover-b frames showed the same at the peak).
  { name: "daily-ar-1440x900-hover", q: "lang=ar&tuner=0", act: "hover-peak" },
  { name: "daily-en-1440x900-hover", q: "lang=en&tuner=0", act: "hover-peak" },
  { name: "daily-ar-1440x900-rail-open", q: "lang=ar&tuner=0", act: "rail-open" },
  { name: "daily-en-1440x900-rail-open", q: "lang=en&tuner=0", act: "rail-open" },
  { name: "daily-ar-1440x900-delayed", q: "lang=ar&state=delayed&tuner=0" },
  { name: "daily-ar-1440x900-nohistory", q: "lang=ar&state=nohistory&tuner=0" },
  { name: "daily-ar-1440x900-details", q: "lang=ar&tuner=0", act: "details", full: true },
  { name: "daily-ar-1440x900-tuner-open", q: "lang=ar", act: "tuner-open" },
];
// These change by design. Since the lane round (2026-09-28) that is every frame that shows the chart's plot: the tooltip
// lives in a lane at the top of the plot, so the scale starts lower (the lane's height plus a gap, per state), and the
// chart is redrawn inside the plot element. Nothing outside the plot element changes: evidence/lane-outside-plot.json holds
// 8ae88f3's frames with the plot's pixel box zeroed (and, with the rail open, the rail's box, whose glass blurs the plot
// behind it), and each of these frames must equal it (shot(), "outsidePlot"). The level map has no such comparison.
// Earlier reasons stay: the hover frame (Round 6: the tooltip's value is the line's own; Round 7: marker form B, the hollow
// ring, replaces the reading sight; the follow-up round: the tooltip's one width) and the tuner (Round 6: its Motion group;
// Round 7 step 2: the hover speed). The English hover frame has no pre-motion frame. Frames that show no plot (the Inside now
// crops, the light-only crops of the chart) are unchanged and are not listed.
const LANE_REST = "the lane round: the plot's scale starts lower (an 89 px tooltip lane is reserved at the top of the plot, 8 px above the \"80\" label); nothing outside the plot element changes";
const LANE_CROP = "the lane round: the chart card at 2x, with the plot's scale starting lower (89 px lane); the lights and the card outside the plot are unchanged";
const EXPECTED_TO_CHANGE = {
  "daily-ar-1440x900": LANE_REST,
  "daily-en-1440x900": LANE_REST,
  "daily-ar-1440x900-hover": "the lane round: the peak's tooltip sits in the lane at the top of the plot, with its connector to the ring, and the scale starts lower (89 px lane); earlier: marker form B (the hollow ring), the tooltip's one width",
  "daily-en-1440x900-hover": "the lane round: the peak's tooltip sits in the lane at the top of the plot, with its connector to the ring, and the scale starts lower (89 px lane); it has no pre-motion frame",
  "daily-ar-1440x900-rail-open": LANE_REST,
  "daily-en-1440x900-rail-open": LANE_REST,
  "daily-ar-1440x900-delayed": "the lane round: the plot's scale starts lower (a 109 px tooltip lane: the delayed latest tooltip has a fourth row); nothing outside the plot element changes",
  "daily-ar-1440x900-nohistory": "the lane round: the plot's scale starts lower (a 69 px tooltip lane: without history no tooltip has the usual row); nothing outside the plot element changes",
  "daily-ar-1440x900-details": LANE_REST,
  "daily-ar-1440x900-tuner-open": "the lane round: the plot's scale starts lower (89 px lane); earlier: Round 6, the tuner's Motion group; Round 7 step 2, its hover speed (the step-1 Marker group is gone); Round 7 step 3, the intro speed and Replay intro",
  "preset-v2-ar-1440x900": LANE_REST,
  "preset-a-like-ar-1440x900": LANE_REST,
  "preset-recommended-ar-1440x900": LANE_REST,
  "preset-v2-chart-2x": LANE_CROP,
  "preset-a-like-chart-2x": LANE_CROP,
  "preset-recommended-chart-2x": LANE_CROP,
  "levels-chart": "the lane round: the brightness-level map of preset-recommended-chart-2x, which changes (the plot's scale starts lower)",
};
const MARKERS = ["b"];
const PRESETS = ["v2", "a-like", "recommended"];
const OVERFLOW_ONLY = [
  { name: "daily-ar-1280x800", q: "lang=ar&tuner=0" },
  { name: "daily-en-1280x800", q: "lang=en&tuner=0" },
];
const FACES = [
  ['400 16px "Readex Pro"', "مرحبا"],
  ['500 16px "Readex Pro"', "مرحبا"],
  ['400 16px "Readex Pro"', "Today 0123"],
  ['500 16px "Readex Pro"', "0123"],
];
const HIDE_CONTENT = ".lit > :not(.lamp) { visibility: hidden !important; }";
const HIDE_PULSE = ".ping { visibility: hidden !important; }";

const MOTION_ONLY = process.argv.includes("--motion-only");
const INTRO_FRAMES = (process.argv.find((a) => a.startsWith("--intro-frames=")) || "").slice("--intro-frames=".length) || null;
const PLANT = (process.argv.find((a) => a.startsWith("--plant=")) || "").slice("--plant=".length) || null;
if (PLANT && !["once", "always"].includes(PLANT)) throw new Error("--plant takes once or always");
// A planted run may write only below the real system temp directory. Resolve existing ancestors through
// junctions and short names before checking whole path segments; never normalize a UNC/device path into a drive.
const realish = (p) => {
  const rest = [];
  for (let cur = resolve(p); ; ) {
    try { return join(realpathSync.native(cur), ...rest); } catch (error) { if (error.code !== "ENOENT") throw new Error(`Cannot resolve planted output path: ${p} (${error.code})`); const up = dirname(cur); if (up === cur) throw new Error(`Cannot resolve planted output path: ${p}`); rest.unshift(basename(cur)); cur = up; }
  }
};
const pathKey = (p) => (process.platform === "win32" ? realish(p).toLowerCase() : realish(p));
if (PLANT) {
  const temp = pathKey(tmpdir());
  const worktree = pathKey(resolve(HERE, "../../../.."));
  const outputs = [["outDir", OUT_ARG], ["--intro-frames", INTRO_FRAMES]].filter(([, p]) => p != null);
  if (!OUT_ARG) throw new Error("--plant requires an explicit scratch outDir inside the system temp directory");
  for (const [name, raw] of outputs) {
    if (!/^[a-z]:[\\/]/i.test(raw) || raw.startsWith("\\\\")) {
      throw new Error(`--plant ${name} must be a local absolute drive path, not a relative, UNC or device path: ${raw}`);
    }
    const out = pathKey(raw);
    if (out === worktree || out.startsWith(worktree + sep)) {
      throw new Error(`--plant ${name} must not resolve inside the repository worktree (${worktree}): ${raw}`);
    }
    // TEMP/TMP can point into a different checkout. Query Git from the nearest existing
    // ancestor before creating any directory, including through junctions and short names.
    let ancestor = realish(raw);
    for (;;) {
      try { realpathSync.native(ancestor); if (!statSync(ancestor).isDirectory()) ancestor = dirname(ancestor); break; }
      catch (error) { if (error.code !== "ENOENT") throw error; ancestor = dirname(ancestor); }
    }
    let gitRoot = null;
    for (let cwd = ancestor; ; cwd = dirname(cwd)) {
      try { gitRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd, encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"] }).trim(); break; }
      catch (error) {
        // Git cannot show a working-tree root from inside .git; keep checking its parents.
        if (error.status !== 128 || !/not a git repository|must be run in a work tree/i.test(String(error.stderr))) throw new Error(`Cannot check Git working tree for planted output: ${raw}`);
      }
      if (dirname(cwd) === cwd) break;
    }
    if (gitRoot) {
      const tree = pathKey(gitRoot);
      if (out === tree || out.startsWith(tree + sep)) throw new Error(`--plant ${name} must not resolve inside any Git working tree (${tree}): ${raw}`);
    }
    if (!out.startsWith(temp + sep)) {
      throw new Error(`--plant ${name} must resolve inside the system temp directory (${temp}): ${raw}`);
    }
  }
}
await mkdir(OUT, { recursive: true });
// v2 file names that v3 replaced with preset-recommended-* crops.
for (const stale of ["daily-ar-chart-2x.png", "daily-ar-nowcard-2x.png"]) await rm(join(OUT, stale), { force: true });
const browser = await chromium.launch();
const log = [];
const PRE = JSON.parse(await readFile(join(HERE, "evidence", "pre-motion-hashes.json"), "utf8")).frames;
const OUTSIDE_PLOT = JSON.parse(await readFile(join(HERE, "evidence", "lane-outside-plot.json"), "utf8")).frames;
// The frames the lane leaves alone keep their committed hash as the reference. For the ones it changes, the reference is
// this run's reduced-motion frame (rendered again on a difference), as for the frames that already changed by design.
const PRE_REF = Object.fromEntries(Object.entries(PRE).filter(([k]) => !EXPECTED_TO_CHANGE[k]));
const sha = (buf) => createHash("sha256").update(buf).digest("hex");
const identity = { staticFrames: {}, motionOffFrames: {}, firstOpen: {}, reload: {}, liveUpdateEndsAtCanonical: null };
const stillBuffers = {}; // this run's still frames, for frames with no pre-motion hash (or one that changes by design)

// Local fonts use the same files in every browser. Holds apply to each woff2
// response, including preloads, so the 50/600 ms checks still exercise the cap.
async function serveFont(route, delayMs, held) {
  const at = performance.now();
  if (delayMs > 0) await new Promise((res) => setTimeout(res, delayMs));
  held.push({ url: route.request().url(), heldMs: Math.round(performance.now() - at) });
  await route.continue();
}
async function newPage({ width = 1440, height = 900, scale = 1, motion = false, touch = false, fontDelayMs = 0 } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, reducedMotion: motion ? "no-preference" : "reduce", colorScheme: "dark", hasTouch: touch });
  const heldFonts = [];
  if (fontDelayMs) await context.route(/\/fonts\/[^/?]+\.woff2(?:\?|$)/, (route) => serveFont(route, fontDelayMs, heldFonts));
  const page = await context.newPage();
  const requests = [];
  page.on("request", (r) => requests.push(r.url()));
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });
  return { context, page, errors, heldFonts, requests };
}
// Round 7 step 3: a fresh context is a tab's first open, so with motion on the intro plays; wait for it to end (it ends
// at the still page), so every check below starts from the page at rest.
const introSettled = (page) => page.waitForFunction(() => !["pending", "running"].includes(window.__eclipse?.intro?.state), null, { timeout: 15000 });
async function open(q, opts = {}, base = `${ORIGIN}/index.html`) {
  const { context, page, errors } = await newPage(opts);
  await page.goto(`${base}?${q}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__eclipse?.ready === true);
  await page.evaluate(() => document.fonts.ready);
  await introSettled(page);
  await page.waitForTimeout(150);
  return { context, page, errors };
}
const rectOf = (page, sel) => page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }, sel);
const clipOf = (b) => ({ x: Math.floor(b.x), y: Math.floor(b.y), width: Math.ceil(b.width), height: Math.ceil(b.height) });

async function act(page, frame) {
  if (frame.act === "rail-open") {
    await page.click("#brand");
    await page.mouse.move(720, 40);
  }
  if (frame.act === "details") {
    await page.click("#details-btn");
    await page.mouse.move(720, 40);
    await page.evaluate(() => window.scrollTo(0, 0));
  }
  if (frame.act === "hover-peak") {
    const pt = await page.evaluate(() => window.__eclipse.minuteClient(window.__eclipse.figures.peakM));
    await page.mouse.move(pt.x, pt.y);
  }
  if (frame.act === "tuner-open") {
    await page.click(".tuner-toggle");
    await page.mouse.move(1150, 20);
  }
}

async function inspect(page) {
  return page.evaluate((faces) => {
    const el = document.documentElement;
    const text = [...document.body.childNodes].filter((n) => !(n.classList && n.classList.contains("tuner"))).map((n) => n.innerText || n.textContent || "").join("\n");
    // Anything inside a card that pokes past the card's inline edges.
    const spill = [];
    document.querySelectorAll(".card").forEach((card) => {
      const c = card.getBoundingClientRect();
      card.querySelectorAll(":scope *:not(.lamp):not(.lamp *):not(svg *)").forEach((n) => {
        const r = n.getBoundingClientRect();
        if (!r.width || n.closest(".sr-only") || n.closest(".scroller")) return;
        if (r.left < c.left - 0.5 || r.right > c.right + 0.5) spill.push(`${card.id || card.className.split(" ")[1]}: ${n.className || n.tagName}`);
      });
    });
    const hit = document.getElementById("plot-hit");
    const cr = document.querySelector(".chart").getBoundingClientRect();
    return {
      chartRect: { x: cr.x, y: cr.y, width: cr.width, height: cr.height },
      lang: el.lang,
      dir: el.dir,
      state: el.dataset.state,
      tunerPresent: Boolean(document.querySelector(".tuner")),
      fonts: Object.fromEntries(faces.filter(([, sample]) => el.lang === "ar" || !/[؀-ۿ]/.test(sample)).map(([spec, sample]) => [`${spec} ${sample}`, document.fonts.check(spec, sample)])),
      loadedFaces: [...new Set([...document.fonts].filter((f) => f.status === "loaded").map((f) => `${f.family.replace(/"/g, "")} ${f.weight}`))].sort(),
      overflowX: el.scrollWidth - el.clientWidth,
      overflowY: el.scrollHeight - el.clientHeight,
      spill: [...new Set(spill)],
      easternDigits: /[٠-٩۰-۹]/.test(text),
      enDashInArabic: el.lang === "ar" && /–/.test(text),
      railExpanded: document.getElementById("brand").getAttribute("aria-expanded"),
      detailsExpanded: document.getElementById("details-btn").getAttribute("aria-expanded"),
      tipVisible: !document.getElementById("tip").hidden,
      tipText: document.getElementById("tip").innerText.replace(/\s+/g, " ").trim(),
      valuetext: hit.getAttribute("aria-valuetext"),
      figures: window.__eclipse.figures,
      checks: window.__eclipse.checks,
    };
  }, FACES);
}

function record(name, extra, result, errors) {
  const entry = { frame: name, ...extra, fontsOk: Object.values(result.fonts).every(Boolean), ...result, errors };
  log.push(entry);
  console.log(`${name.padEnd(36)} ${String(extra.viewport).padEnd(9)} ovX=${entry.overflowX} ovY=${entry.overflowY} spill=${entry.spill.length} fonts=${entry.fontsOk ? "ok" : "MISSING"} errors=${errors.length}${entry.tipVisible ? ` tip="${entry.tipText}"` : ""}`);
  return entry;
}

/* ------------------------------------------------------------------ light measurement
 * OKLab L of every pixel of a light-only 1x capture (card content hidden), relative to the card's own base: the
 * median L of an unlit region (chart: the middle of its upper part; Inside now: inside the disc). The 1px border
 * and the 2px just inside it are left out. Peaks and fade heights use a 5x5 box blur so the grain does not
 * decide them; the area percentages and the row/column profiles use unblurred pixels. */
async function measure(png, kind, rtl) {
  const { context, page } = await newPage({ width: 400, height: 300 });
  const src = `data:image/png;base64,${png.toString("base64")}`;
  const out = await page.evaluate(async ({ src, kind, rtl }) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const w = img.naturalWidth, h = img.naturalHeight;
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const g = c.getContext("2d");
    g.drawImage(img, 0, 0);
    const px = g.getImageData(0, 0, w, h).data;
    const lin = new Float32Array(256);
    for (let i = 0; i < 256; i++) { const v = i / 255; lin[i] = v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
    const L = new Float32Array(w * h);
    for (let p = 0, i = 0; p < w * h; p++, i += 4) {
      const r = lin[px[i]], gg = lin[px[i + 1]], b = lin[px[i + 2]];
      const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * gg + 0.0514459929 * b);
      const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * gg + 0.1073969566 * b);
      const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * gg + 0.6299787005 * b);
      L[p] = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
    }
    const RAD = 24;
    const inside = (x, y, inset = 2) => {
      const x0 = inset, y0 = inset, x1 = w - 1 - inset, y1 = h - 1 - inset, r = RAD - inset;
      if (x < x0 || x > x1 || y < y0 || y > y1) return false;
      const cx = x < x0 + r ? x0 + r : x > x1 - r ? x1 - r : x;
      const cy = y < y0 + r ? y0 + r : y > y1 - r ? y1 - r : y;
      return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
    };
    const med = (arr) => { const a = [...arr].sort((p, q) => p - q); return a[Math.floor(a.length / 2)]; };
    const region = (fx0, fx1, fy0, fy1) => { const o = []; for (let y = Math.round(fy0 * h); y < Math.round(fy1 * h); y++) for (let x = Math.round(fx0 * w); x < Math.round(fx1 * w); x++) o.push(L[y * w + x]); return o; };
    const B = new Float32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let s = 0, n = 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= w || Y >= h) continue; s += L[Y * w + X]; n++; }
      B[y * w + x] = s / n;
    }
    const r3 = (v) => Math.round(v * 1000) / 1000;
    const r1 = (v) => Math.round(v * 1000) / 10;
    const litX = (f) => (rtl ? f : 1 - f); // a fraction measured from the lit (inline-end) side, as an image fraction
    if (kind === "chart") {
      const base = med(region(0.3, 0.7, 0.06, 0.3));
      let n = 0, dark = 0, haze = 0, lit = 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (!inside(x, y)) continue;
        const d = L[y * w + x] - base; n++;
        if (d < 0.02) dark++; else if (d < 0.1) haze++; else lit++;
      }
      // Height above the bottom edge (fraction of the card) at which the light has faded below +0.02 for good.
      const fadeAt = (x) => {
        let top = h - 3;
        for (let y = h - 3; y > 2; y--) { if (!inside(x, y, 3)) continue; if (B[y * w + x] - base >= 0.02) top = y; else if (top - y > 12) break; }
        return (h - top) / h;
      };
      const cols = [];
      for (let f = 0.02; f <= 0.981; f += 0.01) cols.push(fadeAt(Math.round(f * (w - 1))));
      const peak = (fx0, fx1) => { let m = 0; for (let y = Math.round(0.7 * h); y < h - 2; y++) for (let x = Math.round(fx0 * w); x < Math.round(fx1 * w); x++) { if (inside(x, y, 3)) m = Math.max(m, B[y * w + x]); } return m; };
      const endPeak = rtl ? peak(0, 0.2) : peak(0.8, 1), startPeak = rtl ? peak(0.8, 1) : peak(0, 0.2);
      return {
        base: r3(base),
        pureDarkPct: r1(dark / n), hazePct: r1(haze / n), litPct: r1(lit / n),
        fadeToBlackPctOfHeight: {
          middle: r1(fadeAt(Math.round(w / 2))),
          inlineEndCorner: r1(fadeAt(Math.round(litX(0.03) * (w - 1)))),
          inlineStartCorner: r1(fadeAt(Math.round(litX(0.97) * (w - 1)))),
          min: r1(Math.min(...cols)), median: r1(med(cols)), max: r1(Math.max(...cols)),
        },
        lowerCornerPeakL: { inlineEnd: r3(endPeak), inlineStart: r3(startPeak) },
      };
    }
    // Inside now: rows at 0.95 and 0.98 of the card height, 20 points from the far corner to the lit corner
    // (5%-95% of the width, inside the rounded corners), and a column 4% in from the lit side, 19 points from
    // near the top to near the bottom. Each point is the mean of a 3x1 window.
    const base = med(region(0.35, 0.65, 0.15, 0.45));
    const at = (fx, fy) => { const x = Math.round(fx * (w - 1)), y = Math.round(fy * (h - 1)); return (L[y * w + x - 1] + L[y * w + x] + L[y * w + x + 1]) / 3; };
    const row = (fy) => Array.from({ length: 20 }, (_, i) => { const f = 0.05 + (0.9 * i) / 19; return { fromFarCorner: Math.round(f * 100) / 100, L: r3(at(litX(1 - f), fy)) }; });
    const col = Array.from({ length: 19 }, (_, i) => { const fy = 0.05 + (0.9 * i) / 18; return { y: Math.round(fy * 100) / 100, L: r3(at(litX(0.04), fy)) }; });
    let peakL = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (inside(x, y, 3)) peakL = Math.max(peakL, B[y * w + x]);
    return { base: r3(base), peakL: r3(peakL), rowAt098: row(0.98), rowAt095: row(0.95), inlineEndSideColumn: col };
  }, { src, kind, rtl });
  await context.close();
  return out;
}

// Brightness-level map: Rec. 709 luma, normalised between the flat card and the brightest red light pixel,
// then thresholded into bands (black, dark red, red, orange, amber, yellow, pale green, white).
async function levels(pngPath, outPath) {
  const { context, page } = await newPage({ width: 400, height: 300 });
  const b64 = (await readFile(pngPath)).toString("base64");
  const res = await page.evaluate(async (src) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const g = c.getContext("2d");
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height);
    const px = d.data;
    const lum = new Float32Array(c.width * c.height);
    const reds = [];
    for (let i = 0, p = 0; p < lum.length; i += 4, p++) {
      const r = px[i], gg = px[i + 1], b = px[i + 2];
      lum[p] = 0.2126 * r + 0.7152 * gg + 0.0722 * b;
      if (r > gg + 30) reds.push(lum[p]);
    }
    const sorted = [...lum].sort((a, b) => a - b);
    const bg = sorted[Math.floor(sorted.length * 0.3)];
    reds.sort((a, b) => a - b);
    const top = reds.length ? reds[Math.floor(reds.length * 0.97)] : sorted[sorted.length - 1];
    const cuts = [0.05, 0.14, 0.26, 0.4, 0.55, 0.72, 0.88];
    const pal = [[0, 0, 0], [70, 4, 4], [128, 10, 8], [190, 50, 4], [228, 120, 0], [240, 200, 0], [200, 255, 128], [255, 255, 255]];
    for (let i = 0, p = 0; p < lum.length; i += 4, p++) {
      const t = (lum[p] - bg) / Math.max(1, top - bg);
      let k = 0;
      while (k < cuts.length && t >= cuts[k]) k++;
      px[i] = pal[k][0]; px[i + 1] = pal[k][1]; px[i + 2] = pal[k][2]; px[i + 3] = 255;
    }
    g.putImageData(d, 0, 0);
    return { url: c.toDataURL("image/png"), bg, top };
  }, `data:image/png;base64,${b64}`);
  await writeFile(outPath, Buffer.from(res.url.split(",")[1], "base64"));
  await context.close();
  return { bg: Math.round(res.bg * 10) / 10, top: Math.round(res.top * 10) / 10 };
}

// The follow-up round after step 3 (user-agreed): Chromium's glyph raster is not always byte-identical between runs, so
// a frame whose hash differs from its expected value is captured again, the same way, in a fresh context (`again`),
// and it counts as a difference only if it differs in that next attempt too. There is no tolerance: every attempt is
// compared exactly. Every comparison is logged with its attempts; one that differed once and then matched is noise.
const recaptures = [];
// The negative control (--plant): a 1px chalk dot painted into a PNG (8-bit RGB or RGBA, as Playwright writes them) at
// (720, 450), or the nearest pixel inside a smaller frame; black where that pixel is chalk already. Only the hash that
// is compared uses it; the frame written and any reference stay clean.
// Decodes an 8-bit RGB or RGBA PNG (as Playwright writes them) to its pixels.
function decodePng(png, who) {
  const chunks = [];
  for (let o = 8; o < png.length; ) { const len = png.readUInt32BE(o); chunks.push({ type: png.toString("latin1", o + 4, o + 8), data: png.subarray(o + 8, o + 8 + len) }); o += 12 + len; }
  const ihdr = chunks[0].data, w = ihdr.readUInt32BE(0), h = ihdr.readUInt32BE(4), ct = ihdr[9];
  if (ihdr[8] !== 8 || ![2, 6].includes(ct) || ihdr[12] !== 0) throw new Error(`${who}: unexpected PNG format`);
  const bpp = ct === 6 ? 4 : 3, stride = w * bpp;
  const raw = inflateSync(Buffer.concat(chunks.filter((c) => c.type === "IDAT").map((c) => c.data)));
  const px = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = y * (stride + 1) + 1, row = y * stride, prev = row - stride;
    for (let i = 0; i < stride; i++) {
      const x = raw[src + i], a = i >= bpp ? px[row + i - bpp] : 0, b = y ? px[prev + i] : 0, c = y && i >= bpp ? px[prev + i - bpp] : 0;
      let v = x;
      if (f === 1) v = x + a; else if (f === 2) v = x + b; else if (f === 3) v = x + ((a + b) >> 1);
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); }
      px[row + i] = v & 255;
    }
  }
  return { chunks, ihdr, w, h, bpp, stride, px };
}
// The lane round (2026-09-28): the frames the lane changes must be identical to 8ae88f3 everywhere outside the plot
// element. The hash is SHA-256 of the frame's size and pixels with the plot's pixel box (whole pixels, covering the
// plot's fractional edges) zeroed; evidence/lane-outside-plot.json holds it for 8ae88f3's committed frames. In the frames
// with the rail open, the rail's own box is zeroed too: its translucent glass blurs the plot behind it, so the changed plot
// shows through it (measured: at most 1/255, about 2,600 pixels, all inside the rail's box).
function outsidePlotHash(png, boxes) {
  const { w, h, bpp, stride, px } = decodePng(png, "outsidePlotHash");
  const p = Buffer.from(px);
  for (const box of boxes) for (let y = Math.max(0, box.y0); y < Math.min(h, box.y1); y++) p.fill(0, y * stride + Math.max(0, box.x0) * bpp, y * stride + Math.min(w, box.x1) * bpp);
  return sha(Buffer.concat([Buffer.from(`${w}x${h}x${bpp}`), p]));
}
function plantDot(png) {
  const { chunks, ihdr, w, h, bpp, stride, px } = decodePng(png, "plantDot");
  const at = Math.min(450, h - 1) * stride + Math.min(720, w - 1) * bpp;
  const chalk = [0xf5, 0xf3, 0xf2], same = chalk.every((v, i) => px[at + i] === v);
  chalk.forEach((v, i) => { px[at + i] = same ? 0 : v; });
  if (bpp === 4) px[at + 3] = 255;
  const filtered = Buffer.alloc(h * (stride + 1));
  for (let y = 0; y < h; y++) px.copy(filtered, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  const chunk = (type, data) => { const t = Buffer.from(type, "latin1"), len = Buffer.alloc(4), crc = Buffer.alloc(4); len.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(Buffer.concat([t, data]))); return Buffer.concat([len, t, data, crc]); };
  return Buffer.concat([png.subarray(0, 8), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(filtered)), chunk("IEND", Buffer.alloc(0))]);
}
const planted = (attempt) => PLANT === "always" || (PLANT === "once" && attempt === 1);
// `expected` is a committed hash (or hashes), or the hash of a reference rendered in this run; for the latter pass
// `reference`, which renders it again in a fresh context. On a difference: with `reference`, the reference and the
// compared frame (`again`) are both rendered again and the new pair is compared; without it, only the compared frame
// is rendered again and compared with the committed hash. It counts as a difference only if it differs in that next
// attempt too. Each attempt logs its expected and actual hash (the actual one with the plant, when planted).
async function exact(label, buf, expected, again = null, reference = null, hashOf = sha) {
  const perAttempt = [];
  const compare = (want, b) => {
    const n = perAttempt.length + 1, plant = planted(n), actual = hashOf(plant ? plantDot(b) : b);
    const match = want.includes(actual);
    perAttempt.push({ attempt: n, expected: want.map((h) => h.slice(0, 16)).join(" or "), actual: actual.slice(0, 16), match, ...(plant ? { planted: true } : {}) });
    return match;
  };
  let want = [].concat(expected).filter(Boolean);
  let final = buf;
  let identical = compare(want, buf);
  if (!identical && again) {
    if (reference) want = [hashOf(await reference())];
    final = await again();
    identical = compare(want, final);
    if (reference) perAttempt[1].referenceRenderedAgain = true;
  }
  const attempts = perAttempt.length;
  const entry = { label, reference: reference ? "rendered in this run (both sides rendered again on a difference)" : "committed", attempts, identical, noise: attempts > 1 && identical, differedTwice: attempts > 1 && !identical, hashes: perAttempt.map((x) => x.actual), perAttempt };
  recaptures.push(entry);
  return { identical, attempts, noise: entry.noise, buf: final, perAttempt };
}
// A fresh capture of a frame, for `again`: open it as the first attempt did, `prep` the page, then screenshot.
const recapture = (q, openOpts, prep, shotOpts = {}) => async () => {
  const s = await open(q, openOpts);
  if (prep) await prep(s.page);
  const buf = await s.page.screenshot(typeof shotOpts === "function" ? await shotOpts(s.page) : shotOpts);
  await s.context.close();
  return buf;
};
// The reference for "the page settles to its still frame": the committed pre-motion hash, or, for a frame the lane changes,
// this run's reduced-motion frame, which is rendered again (its own fresh context) on a difference.
async function stillRef(name, q, prep = null, shotOpts = {}) {
  if (PRE_REF[name]) return { expected: PRE_REF[name], reference: null };
  const reference = recapture(q, {}, prep, shotOpts);
  return { expected: sha(stillBuffers[name] || (await reference())), reference };
}
// The pixel boxes to leave out of the comparison with 8ae88f3 in a screenshot of `opts` (whole pixels covering their fractional
// edges): the plot element, and the open rail.
const plotBoxes = (page, opts = {}) => page.evaluate((o) => {
  const d = window.devicePixelRatio, cx = o.clip ? o.clip.x : 0, cy = o.clip ? o.clip.y : 0;
  const box = (el) => { const b = el.getBoundingClientRect(); return { x0: Math.floor((b.left + scrollX - cx) * d), y0: Math.floor((b.top + scrollY - cy) * d), x1: Math.ceil((b.right + scrollX - cx) * d), y1: Math.ceil((b.bottom + scrollY - cy) * d) }; };
  const out = [box(document.querySelector("#plot"))];
  const rail = document.querySelector("#rail");
  if (rail && rail.dataset.open === "true") out.push(box(rail));
  return out;
}, opts);
// A written evidence frame; if it is one of the pre-motion frames, its bytes are compared with the recorded hash
// (equal hashes mean identical pixels), with one recapture (`again`) on a difference. The frame written is the last
// attempt. Frames that change by design are not recaptured.
async function shot(page, name, opts = {}, again = null) {
  let buf = await page.screenshot(opts);
  if (PRE[name]) {
    const m = await exact(`static ${name}`, buf, PRE[name], EXPECTED_TO_CHANGE[name] ? null : again);
    buf = m.buf;
    identity.staticFrames[name] = { identical: m.identical, attempts: m.attempts, ...(m.noise ? { noise: true } : {}), ...(EXPECTED_TO_CHANGE[name] ? { expectedToChange: EXPECTED_TO_CHANGE[name] } : {}) };
  }
  // A frame the lane changes must still equal 8ae88f3 everywhere outside the plot element (same box, same pixels).
  if (EXPECTED_TO_CHANGE[name] && OUTSIDE_PLOT[name]) {
    const want = OUTSIDE_PLOT[name];
    const boxes = await plotBoxes(page, opts);
    const sameBox = JSON.stringify(boxes) === JSON.stringify(want.boxes);
    const hashOf = (b) => outsidePlotHash(b, boxes);
    const o = await exact(`outside the plot ${name}`, buf, want.sha, again, null, hashOf);
    identity.staticFrames[name] = { identical: false, attempts: 1, ...(identity.staticFrames[name] || {}), expectedToChange: EXPECTED_TO_CHANGE[name], outsidePlot: { identical: sameBox && o.identical, boxesSameAs8ae88f3: sameBox, attempts: o.attempts, ...(o.noise ? { noise: true } : {}) } };
  }
  await writeFile(join(OUT, `${name}.png`), buf);
  stillBuffers[name] = buf;
  return buf;
}
// The level maps are computed from a 2x crop that `shot` has already compared (and recaptured if it differed).
// On a difference the map is computed again from its crop in a fresh context (the compared side only: its hash is committed).
async function hashFile(name, crop) {
  if (!PRE[name]) return;
  const m = await exact(`static ${name} (from its crop)`, await readFile(join(OUT, `${name}.png`)), PRE[name], EXPECTED_TO_CHANGE[name] ? null : async () => {
    const tmp = join(OUT, `${name}.again.png`);
    await levels(join(OUT, `${crop}.png`), tmp);
    const b = await readFile(tmp);
    await rm(tmp, { force: true });
    return b;
  }, null);
  identity.staticFrames[name] = { identical: m.identical, attempts: m.attempts, ...(m.noise ? { noise: true } : {}), ...(EXPECTED_TO_CHANGE[name] ? { expectedToChange: EXPECTED_TO_CHANGE[name] } : {}) };
}

/* ------------------------------------------------------------------ motion helpers
 * Contexts with reducedMotion "no-preference". Animations are held at exact times through Document.getAnimations()
 * and the page's own seeks (window.__eclipse.chart.seekFollow, window.__eclipse.motion.seekLive), so every held frame
 * is deterministic. */
async function pixelDiff(a, b) {
  const { context, page } = await newPage({ width: 400, height: 300 });
  const out = await page.evaluate(async ([sa, sb]) => {
    const load = async (s) => { const i = new Image(); i.src = s; await i.decode(); const c = document.createElement("canvas"); c.width = i.naturalWidth; c.height = i.naturalHeight; const g = c.getContext("2d"); g.drawImage(i, 0, 0); return { d: g.getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height }; };
    const A = await load(sa), B = await load(sb);
    if (A.w !== B.w || A.h !== B.h) return { sizeMismatch: [A.w, A.h, B.w, B.h] };
    let changed = 0, x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1, maxD = 0;
    for (let p = 0, i = 0; p < A.w * A.h; p++, i += 4) {
      const d = Math.max(Math.abs(A.d[i] - B.d[i]), Math.abs(A.d[i + 1] - B.d[i + 1]), Math.abs(A.d[i + 2] - B.d[i + 2]));
      if (d > 0) { changed++; maxD = Math.max(maxD, d); const x = p % A.w, y = (p / A.w) | 0; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    }
    return { changedPixels: changed, maxChannelDiff: maxD, bbox: changed ? { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 } : null };
  }, [`data:image/png;base64,${a.toString("base64")}`, `data:image/png;base64,${b.toString("base64")}`]);
  await context.close();
  return out;
}
// Pause every finite animation on the page (the endless live pulse keeps running; it is hidden in the held frames).
const pauseAll = (page) => page.evaluate(() => document.getAnimations().forEach((a) => { if (a.effect?.getComputedTiming().iterations !== Infinity) a.pause(); }));
const holdAt = (page, ms) => page.evaluate((t) => document.getAnimations().forEach((a) => { if (a.effect?.getComputedTiming().iterations === Infinity) return; a.pause(); a.currentTime = t; }), ms);
const releaseAll = async (page) => { await page.evaluate(() => { document.getAnimations().forEach((a) => a.play()); window.__eclipse.motion.settle(); }); await page.waitForTimeout(350); };
const mshots = [];
// A captioned grid of frames (the strips), written at the frames' own pixel size.
async function sheet(name, title, cells, cols) {
  const { context, page } = await newPage({ width: 1600, height: 1000 });
  // A cell may be enlarged (zoom, nearest-neighbour) when its subject is tiny, like the level bars.
  const items = cells.map((c) => `<figure><img src="data:image/png;base64,${c.buf.toString("base64")}"${c.zoom ? ` style="zoom:${c.zoom};image-rendering:pixelated"` : ""}><figcaption>${c.caption}</figcaption></figure>`).join("");
  await page.setContent(`<!doctype html><html><head><style>
    body { margin: 0; padding: 16px; background: #161616; color: #cfcfcf; font: 22px/1.3 "Segoe UI", system-ui, sans-serif; width: max-content; }
    h1 { margin: 0 0 12px; font-size: 24px; font-weight: 600; color: #eee; max-width: 1500px; }
    .g { display: grid; grid-template-columns: repeat(${cols}, max-content); gap: 18px 16px; }
    figure { margin: 0; } img { display: block; } figcaption { margin-top: 6px; max-width: 700px; }
  </style></head><body><h1>${title}</h1><div class="g">${items}</div></body></html>`);
  await page.waitForTimeout(150);
  await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: true });
  await context.close();
  mshots.push({ name, caption: title });
}
async function mshot(page, name, caption, opts = {}) {
  await page.waitForTimeout(40);
  const buf = await page.screenshot({ path: join(OUT, `${name}.png`), ...opts });
  mshots.push({ name, caption });
  return buf;
}
// Every animation on the page as the browser runs it (target, properties, timing, whether the target holds text).
const listAnimations = (page) => page.evaluate(() => document.getAnimations().map((a) => {
  const e = a.effect, t = e && e.getTiming ? e.getTiming() : {};
  const el = e && e.target;
  const target = el ? `${el.id ? `#${el.id}` : `${el.tagName.toLowerCase()}.${[...el.classList].join(".")}`}${e.pseudoElement || ""}` : "(clock)";
  const keyframes = e && e.getKeyframes ? e.getKeyframes() : [];
  const props = [...new Set(keyframes.flatMap((k) => Object.keys(k).filter((x) => !["offset", "easing", "composite", "computedOffset"].includes(x))))];
  return { target, holdsText: Boolean(el && el.textContent && el.textContent.trim()), text: el ? (el.textContent || "").trim().slice(0, 24) : "", kind: a.animationName ? `css @keyframes ${a.animationName}` : "web animation", properties: props, durationMs: t.duration, delayMs: t.delay, easing: t.easing, iterations: t.iterations, keyframes: keyframes.map((k) => Object.fromEntries(Object.entries(k).filter(([x]) => !["composite", "computedOffset", "easing"].includes(x)))) };
}));
const glyphOpacity = (anims) => anims.filter((a) => a.holdsText && a.properties.includes("opacity"));

/* The marker against what it describes, from the rendered DOM only: the marker's centre is its transform in the
 * chart's SVG (cross-checked against the core's rendered box); the line and the usual line are their own SVG paths
 * (arc-length search with getPointAtLength, refined); the peak is the peak ring's centre; the missing span is the
 * dotted mark on the axis. */
const measureMarker = (page) => page.evaluate(() => {
  const svg = document.querySelector("#plot-svg svg");
  const mark = document.querySelector("#sel .sg-mark");
  const tip = document.getElementById("tip");
  const out = { tip: tip.hidden ? null : tip.innerText.replace(/\s+/g, " ").trim(), valuetext: document.getElementById("plot-hit").getAttribute("aria-valuetext") };
  if (!mark) return { ...out, marker: null };
  const m = mark.transform.baseVal.consolidate().matrix;
  const c = { x: m.e, y: m.f };
  const core = mark.querySelector(".sg-core");
  if (core) { const r = core.getBoundingClientRect(), s = svg.getBoundingClientRect(); out.coreRenderedOffsetPx = Math.round(Math.hypot(r.x + r.width / 2 - s.x - c.x, r.y + r.height / 2 - s.y - c.y) * 1000) / 1000; }
  out.form = mark.dataset.form;
  out.markerForm = mark.dataset.marker || null;
  // Nothing above the point (Round 7): no guide line or tick above the marker's top.
  out.drawnAbovePoint = [...document.querySelectorAll("#sel path, #sel rect, #sel line")].filter((n) => !n.closest(".sg-mark")).some((n) => { const b = n.getBBox(); return b.y < c.y - 12 && b.height > 0; });
  out.marker ={ x: Math.round(c.x * 100) / 100, y: Math.round(c.y * 100) / 100 };
  const nearest = (path) => {
    const L = path.getTotalLength();
    let best = Infinity, bl = 0;
    for (let l = 0; l <= L; l += 1) { const p = path.getPointAtLength(l); if (Math.abs(p.x - c.x) > 12) continue; const d = Math.hypot(p.x - c.x, p.y - c.y); if (d < best) { best = d; bl = l; } }
    if (!Number.isFinite(best)) return null;
    let a = Math.max(0, bl - 1.5), b = Math.min(L, bl + 1.5);
    const dist = (l) => { const p = path.getPointAtLength(l); return Math.hypot(p.x - c.x, p.y - c.y); };
    for (let i = 0; i < 60; i++) { const m1 = a + (b - a) / 3, m2 = b - (b - a) / 3; if (dist(m1) < dist(m2)) b = m2; else a = m1; }
    return dist((a + b) / 2);
  };
  const r3 = (v) => (v == null ? null : Math.round(v * 1000) / 1000);
  const form = mark.dataset.form;
  if (form === "line") {
    const ds = [...svg.querySelectorAll('path[id^="ln-"]')].map(nearest).filter((d) => d != null);
    out.target = "today's line (SVG path)"; out.distancePx = r3(Math.min(...ds));
    const end = document.getElementById("end-dot");
    if (end) out.toEndPointPx = r3(Math.hypot(Number(end.getAttribute("cx")) - c.x, Number(end.getAttribute("cy")) - c.y));
  } else if (form === "peak") {
    const pk = document.getElementById("pk-dot");
    out.target = "peak ring centre"; out.distancePx = r3(Math.hypot(Number(pk.getAttribute("cx")) - c.x, Number(pk.getAttribute("cy")) - c.y));
  } else if (form === "drop") {
    // On the way up to the peak ring: straight above the peak's minute, between the line and the ring.
    const pk = document.getElementById("pk-dot");
    out.target = "the peak's dotted drop (straight above the peak's minute)"; out.distancePx = r3(Math.abs(Number(pk.getAttribute("cx")) - c.x));
  } else if (form === "usual") {
    out.target = "usual line (SVG path)"; out.distancePx = r3(nearest(document.getElementById("us-ahead")));
  } else if (form === "gap") {
    const dots = [...svg.querySelectorAll("circle")].filter((n) => n.getAttribute("r") === "1");
    const xs = dots.map((n) => Number(n.getAttribute("cx"))), cy = Number(dots[0].getAttribute("cy"));
    const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
    out.target = "the dotted mark of the missing span, on the axis"; out.distancePx = r3(Math.hypot(mid - c.x, cy - c.y));
    out.dots = dots.length;
  }
  return out;
});

/* The tooltip at a stop, as rendered (the lane round, 2026-09-28): whether it shows a number, its drawn width, its content's own
 * width (the same box with no set width), its box in plot pixels (left, top, height), the stop's x, whether any row wraps (a
 * row taller than one line) or clips, whether it lies inside the plot and the chart card, and its connector: where the line
 * starts and ends, where the pointer's tip is, and where the mark's top edge is (the ring's outer edge, the lit dots, or the
 * tick), all read from the DOM's own attributes. */
const measureTip = (page, stopX) => page.evaluate((sx) => {
  const tip = document.getElementById("tip"), plot = document.getElementById("plot");
  if (tip.hidden) return null;
  const pr = plot.getBoundingClientRect(), r = tip.getBoundingClientRect(), card = document.querySelector(".chart").getBoundingClientRect();
  const rows = [...tip.children].map((c) => ({ h: c.getBoundingClientRect().height, sw: c.scrollWidth, cw: c.clientWidth, lh: parseFloat(getComputedStyle(c).lineHeight) || 0, fs: parseFloat(getComputedStyle(c).fontSize) }));
  const w0 = tip.style.width, m0 = tip.style.minWidth;
  tip.style.width = "max-content"; tip.style.minWidth = "0px";
  const natural = tip.getBoundingClientRect().width;
  tip.style.width = w0; tip.style.minWidth = m0;
  const r2 = (v) => Math.round(v * 100) / 100, r3 = (v) => Math.round(v * 1000) / 1000;
  const num = /-?\d+(?:\.\d+)?/g;
  // The mark's top edge, from its own attributes.
  let markTop = null;
  const mk = document.querySelector("#sel .sg-mark"), tk = document.querySelector("#sel .sg-tick");
  if (mk) {
    const m = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(mk.getAttribute("transform")), core = mk.querySelector(".sg-core"), dot = mk.querySelector("circle");
    markTop = core ? Number(m[2]) - (Number(core.getAttribute("r")) + Number(core.getAttribute("stroke-width")) / 2) : Number(m[2]) - Number(dot.getAttribute("r"));
  } else if (tk) markTop = tk.getAttribute("d").match(num).map(Number)[1];
  const line = document.querySelector("#conn .cn-line"), head = document.querySelector("#conn .cn-head");
  let conn = null;
  if (line && (line.getAttribute("d") || head.getAttribute("d"))) {
    // The connector as painted (the lane fix round; before it, only the path's endpoints were read, which said 0px while the
    // last dash or dot stopped up to 3.5px short): each dash or dot from the path, the dash pattern and the cap (a round cap
    // adds half the stroke width at both ends of every dash), the topmost against the box's painted bottom edge at the
    // connector's column (straight, or up the rounded corner), the lowest against the pointer's base, and the pointer's tip
    // against the mark's painted outline (the ring's outer edge, the nearest lit dot, or the tick's top). Signed: a gap
    // is positive, an overlap negative; the check below takes the absolute value.
    const segs = [...(line.getAttribute("d") || "").matchAll(/M(-?[\d.]+),(-?[\d.]+)V(-?[\d.]+)/g)].map((m) => ({ x: Number(m[1]), y1: Number(m[2]), y2: Number(m[3]) }));
    const hd = head.getAttribute("d").match(num).map(Number), tipX = hd[4], tipY = hd[5], baseY = hd[1];
    const x = segs.length ? segs[0].x : tipX;
    const sw = Number(line.getAttribute("stroke-width")) || 1, cap = line.getAttribute("stroke-linecap") === "round" ? sw / 2 : 0;
    const da = (line.getAttribute("stroke-dasharray") || "").match(num)?.map(Number);
    const dashes = [];
    segs.forEach((s, si) => {
      const len = Math.abs(s.y2 - s.y1), dir = Math.sign(s.y2 - s.y1) || 1, list = [];
      if (!da) list.push([0, len]);
      else for (let k = 0; k * (da[0] + da[1]) < len - 1e-9; k++) list.push([k * (da[0] + da[1]), Math.min(k * (da[0] + da[1]) + da[0], len)]);
      list.forEach(([a, b]) => dashes.push({ lo: Math.min(s.y1 + dir * a, s.y1 + dir * b) - cap, hi: Math.max(s.y1 + dir * a, s.y1 + dir * b) + cap, a, b, si }));
    });
    const R = parseFloat(getComputedStyle(tip).borderBottomLeftRadius) || 0, bl = r.left - pr.left, br = r.right - pr.left, inset = Math.min(x - bl, br - x);
    const boxBottom = (r.bottom - pr.top) - (inset < R ? R - Math.sqrt(Math.max(0, R * R - (R - Math.max(0, inset)) ** 2)) : 0);
    const gaps = [], pitches = [];
    for (let i = 0; i + 1 < dashes.length; i++) if (dashes[i].si === dashes[i + 1].si) { gaps.push(dashes[i + 1].a - dashes[i].b); pitches.push(dashes[i + 1].a - dashes[i].a); }
    let toMark = null, nearestDx = null, lit = null;
    if (mk) {
      const m = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(mk.getAttribute("transform")), tx = Number(m[1]), ty = Number(m[2]), core = mk.querySelector(".sg-core");
      if (core) toMark = Math.hypot(tipX - tx, tipY - ty) - (Number(core.getAttribute("r")) + Number(core.getAttribute("stroke-width")) / 2);
      else {
        lit = mk.querySelectorAll("circle").length;
        let best = Infinity;
        mk.querySelectorAll("circle").forEach((c) => { const cx = tx + Number(c.getAttribute("cx") || 0), cy = ty + Number(c.getAttribute("cy") || 0), dd = Math.hypot(tipX - cx, tipY - cy) - Number(c.getAttribute("r")); if (dd < best) { best = dd; nearestDx = tipX - cx; } });
        // With no lit dot (the span is narrower than 4px, at phone width) there is nothing to touch: the tip is read against
        // where the top of a lit dot on the axis would be.
        toMark = best === Infinity ? ty - 1.25 - tipY : best;
      }
    } else if (tk) {
      const v = tk.getAttribute("d").match(num).map(Number);
      toMark = Math.hypot(Math.max(0, Math.abs(tipX - v[0]) - 0.5), tipY < v[1] ? v[1] - tipY : tipY > v[2] ? tipY - v[2] : 0);
    }
    const top = dashes.length ? Math.min(...dashes.map((z) => z.lo)) : null, bottom = dashes.length ? Math.max(...dashes.map((z) => z.hi)) : null;
    // (At the peak the line is cut around the tag, and the pointer may stand alone below it: no segment starts at the pointer's base, so there is no base to meet.)
    const dashedForm = da && !cap;
    conn = { x, lineTop: top, tipY, markTop, style: da ? (cap ? "dotted" : "dashed") : "solid", pattern: line.getAttribute("stroke-dasharray") || null, cap: cap ? "round" : "butt", painted: dashes.length,
      boxBottom: r3(boxBottom), gapToBox: r3(top == null ? hd[1] - boxBottom : top - boxBottom), gapToBase: r3(bottom == null || !segs.some((z) => Math.abs(z.y1 - baseY) < 0.006) ? 0 : baseY - bottom), gapToMark: r3(toMark),
      litDots: lit, nearestDotDx: r3(nearestDx),
      dashGap: dashedForm && gaps.length ? { min: r3(Math.min(...gaps)), max: r3(Math.max(...gaps)) } : null,
      dotPitch: da && cap && pitches.length ? { min: r3(Math.min(...pitches)), max: r3(Math.max(...pitches)) } : null };
  }
  return { width: r2(r.width), natural: r2(natural), numbered: !!(tip.querySelector(".tip-v") || tip.querySelector(".tip-u")),
    left: r3(r.left - pr.left), top: r3(r.top - pr.top), height: r3(r.height), stopX: r3(sx - pr.left), plotW: plot.clientWidth,
    insidePlot: r.left - pr.left >= 2 - 0.01 && r.right - pr.left <= plot.clientWidth - 2 + 0.01 && r.top >= pr.top,
    insideCard: r.left >= card.left && r.right <= card.right && r.top >= card.top && r.bottom <= card.bottom,
    clipped: tip.scrollWidth > tip.clientWidth || rows.some((x) => x.sw > x.cw + 0.5), wrapped: rows.some((x) => x.h > 1.9 * Math.max(x.lh, x.fs * 1.25)), conn };
}, stopX);

/* The lane is reserved (the lane round): nothing but the tooltip is drawn in the band from the plot's top to the lane's bottom.
 * With nothing selected, the top edge of every painted mark of the page's current snapshot, in plot pixels: today's line and
 * the usual line (path boxes, less the stroke's half width, which covers round caps), the peak ring (with its stroke), drop and
 * tag, the end point with its halo, the pulse, the grid, the axis dots, the fine lines under the line, and the scale's and
 * axes' label boxes; the selected marker's ring glow is added per stop (three blur sigmas beyond its edge). The lines are also
 * sampled along their paths every 1px. */
const laneMarks = (page) => page.evaluate(() => {
  window.__eclipse.chart.clear();
  const plot = document.getElementById("plot"), pr = plot.getBoundingClientRect(), marks = [];
  const add = (name, y) => { if (Number.isFinite(y)) marks.push({ name, top: Math.round(y * 100) / 100 }); };
  document.querySelectorAll('#plot-svg path[id^="ln-"]').forEach((p) => add(p.id, p.getBBox().y - 1.5));
  document.querySelectorAll('#plot-svg path[id^="us-"]').forEach((p) => add(p.id, p.getBBox().y - 0.75));
  const pk = document.getElementById("pk-dot"); if (pk) add("peak ring", Number(pk.getAttribute("cy")) - Number(pk.getAttribute("r")) - Number(pk.getAttribute("stroke-width")) / 2);
  const dr = document.getElementById("pk-drop"); if (dr) add("peak drop", dr.getBBox().y);
  const tg = document.getElementById("peak-tag"); if (tg) add("peak tag", tg.getBoundingClientRect().top - pr.top);
  const eh = document.getElementById("end-halo"), ed = document.getElementById("end-dot");
  if (eh) add("end halo", Number(eh.getAttribute("cy")) - Number(eh.getAttribute("r")) - 0.5);
  if (ed) add("end point", Number(ed.getAttribute("cy")) - Number(ed.getAttribute("r")) - 1);
  const ping = document.querySelector(".ping"); if (ping) add("pulse", Number(ping.style.top.replace("px", "")) - 14);
  document.querySelectorAll("#plot-svg path[stroke^='rgba(255,255,255']").forEach((p) => { const m = /M[-\d.]+,([-\d.]+)/.exec(p.getAttribute("d")); if (m) add("grid", Number(m[1]) - 0.5); });
  document.querySelectorAll("#plot-svg circle").forEach((c) => { if (!["pk-dot", "end-halo", "end-dot"].includes(c.id)) add("axis dot", Number(c.getAttribute("cy")) - Number(c.getAttribute("r"))); });
  let hair = Infinity; document.querySelectorAll('#plot-svg rect[fill="url(#hair)"]').forEach((r) => { hair = Math.min(hair, Number(r.getAttribute("y"))); }); if (hair < Infinity) add("fine lines", hair);
  document.querySelectorAll(".ax-y, .ax-x").forEach((e) => add(`label ${e.textContent}`, e.getBoundingClientRect().top - pr.top));
  marks.sort((a, b) => a.top - b.top);
  let y = Infinity;
  document.querySelectorAll('#plot-svg path[id^="ln-"], #plot-svg path[id^="us-"]').forEach((p) => { const L = p.getTotalLength(); for (let s = 0; s <= L; s += 1) y = Math.min(y, p.getPointAtLength(s).y); y = Math.min(y, p.getPointAtLength(L).y); });
  return { lane: window.__eclipse.chart.lane, highest: marks.slice(0, 3), sampledLineTop: Math.round((y - 1.5) * 100) / 100 };
});

/* ------------------------------------------------------------------ Round 6 checks */
async function chartChecks(lang, state = "live", marker = "b") {
  const q = `lang=${lang}&state=${state}&tuner=0`;
  const { context, page, errors } = await open(q); // reduced motion: every selection is at rest at once
  const res = { url: `index.html?${q}`, marker, markerReported: await page.evaluate(() => window.__eclipse.chart.marker), errors };
  res.stops = await page.evaluate(() => window.__eclipse.chart.stops);
  res.lineSegments = await page.evaluate(() => document.querySelectorAll('#plot-svg path[id^="ln-"]').length);
  const f = await page.evaluate(() => window.__eclipse.figures);
  // Coverage: every half hour from 6:00 AM to 1:00 AM is a stop, or folded into the peak or the latest reading
  // (within 10 minutes), or inside the missing span (2:14-2:31 PM).
  const keys = new Set(res.stops.map((s) => s.key));
  const cover = [];
  for (let m = 0; m <= 1140; m += 30) {
    const how = keys.has(`h${m}`) ? "stop" : Math.abs(m - f.peakM) < 10 ? "folded into the peak" : Math.abs(m - f.last) < 10 ? "folded into the latest reading" : m >= 494 && m <= 511 && m <= f.last ? "inside the missing span" : "MISSING";
    cover.push({ m, how });
  }
  res.halfHourCoverage = cover.filter((c) => c.how !== "stop");
  res.everyHalfHourAccountedFor = cover.every((c) => c.how !== "MISSING");
  res.gapStops = res.stops.filter((s) => s.kind === "gap").length;
  res.normalStopsInsideGap = res.stops.filter((s) => s.kind !== "gap" && s.m >= 494 && s.m <= 511).length;
  res.peakStop = res.stops.find((s) => s.key === "peak") || null;
  res.latestStop = res.stops.find((s) => s.key === "latest") || null;
  // Round 7 decision 1: the latest stop shows the latest reading (the Inside now card's number), never the line's value.
  res.latestShowsReading = Boolean(res.latestStop) && res.latestStop.value === f.now;
  // The marker at every stop.
  res.perStop = [];
  for (const s of res.stops) {
    await page.evaluate((k) => window.__eclipse.chart.select(k), s.key);
    res.perStop.push({ key: s.key, kind: s.kind, time: s.time, value: s.value, ...(await measureMarker(page)), tipBox: await measureTip(page, s.clientX) });
  }
  // The tooltip: one width at every stop (the follow-up round after step 3), and, since the lane round (2026-09-28), the lane
  // rules: the box's top is the lane's top at every stop; its x is its stop's x less half its width, kept 2px inside the
  // plot; it lies inside the plot and the card and its lane, with nothing wrapped or clipped; its connector meets the box
  // and the mark (0.5px); and nothing else is painted in the lane. (The other snapshots are swept by the lane probes.)
  {
    const boxes = res.perStop.map((p) => p.tipBox).filter(Boolean);
    // The width is set by the widest tooltip that shows a number; only the missing-span stop (no number) may grow past it.
    const fixedBoxes = res.perStop.filter((p) => p.tipBox && p.kind !== "gap").map((p) => p.tipBox);
    const grown = res.perStop.filter((p) => p.tipBox && p.kind === "gap").map((p) => p.tipBox);
    res.tooltip = { widths: [...new Set(fixedBoxes.map((b) => b.width))], gapWidths: [...new Set(grown.map((b) => b.width))], widestContent: Math.max(...boxes.filter((b) => b.numbered).map((b) => b.natural)), clipped: res.perStop.filter((p) => p.tipBox?.clipped).map((p) => p.key), wrapped: res.perStop.filter((p) => p.tipBox?.wrapped).map((p) => p.key) };
    // Repair 1 of the follow-up round (the user's decision, 2026-09-27): the width follows the chart, the widest
    // tooltip that shows a number among the page's current stops, plus 2px, rounded up (as the page measured it).
    res.tooltip.ruleWidth = Math.ceil(res.tooltip.widestContent + 2);
    res.tooltip.measuredByPage = await page.evaluate(() => window.__eclipse.chart.tipWidth);
    // The lane.
    const lm = await laneMarks(page);
    const lane = lm.lane, tops = [...new Set(boxes.map((b) => b.top))];
    const clampLeft = (b) => Math.max(2, Math.min(b.plotW - b.width - 2, b.stopX - b.width / 2));
    const xErr = boxes.length ? Math.max(...boxes.map((b) => Math.abs(b.left - clampLeft(b)))) : null;
    const conns = res.perStop.filter((p) => p.tipBox && p.tipBox.conn).map((p) => ({ key: p.key, ...p.tipBox.conn, boxLeft: p.tipBox.left, boxW: p.tipBox.width }));
    const ringGlowTop = (p) => (p.marker ? p.marker.y - (p.form === "usual" ? 7.2 : p.form === "gap" ? 7 : 6.5 + 1.75 + 3 * 2.4) : null);
    const selectedTops = res.perStop.map(ringGlowTop).filter((v) => v != null);
    res.tooltip.lane = {
      top: lane.top, bottom: lane.bottom, height: lane.height, gapToScale: lane.gap, scaleStartsAtPx: lane.scaleTop,
      tallestTooltipPx: Math.max(...boxes.map((b) => b.height)), lowestTooltipBottomPx: Math.max(...boxes.map((b) => b.top + b.height)),
      distinctTops: tops, topsEqual: tops.length === 1 && Math.abs(tops[0] - lane.top) <= 0.01,
      maxXErrPx: xErr == null ? null : Math.round(xErr * 1000) / 1000, xOk: xErr != null && xErr <= 0.01,
      insidePlot: boxes.every((b) => b.insidePlot), insideCard: boxes.every((b) => b.insideCard),
      highestMarks: lm.highest, sampledLineTopPx: lm.sampledLineTop,
      smallestGapToHighestMarkPx: Math.round((Math.min(lm.highest[0].top, lm.sampledLineTop, ...selectedTops) - lane.bottom) * 100) / 100,
      // Painted extent (the lane fix round): the gaps are between what is painted, the first and last dash or dot with its cap.
      connector: { stops: conns.length, styles: [...new Set(conns.map((c) => c.style))],
        maxGapToBoxPx: Math.max(...conns.map((c) => Math.abs(c.gapToBox))), maxGapToPointerBasePx: Math.max(...conns.map((c) => Math.abs(c.gapToBase))), maxGapToMarkPx: Math.max(...conns.map((c) => Math.abs(c.gapToMark))),
        dashGapPx: conns.some((c) => c.dashGap) ? { min: Math.min(...conns.filter((c) => c.dashGap).map((c) => c.dashGap.min)), max: Math.max(...conns.filter((c) => c.dashGap).map((c) => c.dashGap.max)) } : null,
        dotPitchPx: conns.some((c) => c.dotPitch) ? { min: Math.min(...conns.filter((c) => c.dotPitch).map((c) => c.dotPitch.min)), max: Math.max(...conns.filter((c) => c.dotPitch).map((c) => c.dotPitch.max)) } : null,
        missingSpanLitDots: conns.filter((c) => c.litDots != null).map((c) => c.litDots),
        xInsideBox: conns.every((c) => c.x >= c.boxLeft && c.x <= c.boxLeft + c.boxW) },
    };
    const L = res.tooltip.lane;
    L.reserved = L.smallestGapToHighestMarkPx >= 0 && L.lowestTooltipBottomPx <= lane.bottom + 0.01 && L.tallestTooltipPx <= lane.height;
    const C = L.connector;
    C.patternOk = (!C.dashGapPx || (C.dashGapPx.min >= 2.5 && C.dashGapPx.max <= 3.5)) && (!C.dotPitchPx || (C.dotPitchPx.min >= 3.5 && C.dotPitchPx.max <= 4.5));
    L.connectorMeets = conns.length === boxes.length && C.maxGapToBoxPx <= 0.5 && C.maxGapToPointerBasePx <= 0.5 && C.maxGapToMarkPx <= 0.5 && C.patternOk && C.xInsideBox;
    L.pass = L.topsEqual && L.xOk && L.insidePlot && L.insideCard && L.reserved && L.connectorMeets;
    res.tooltip.pass = boxes.length === res.perStop.length && res.tooltip.widths.length === 1 && res.tooltip.widths[0] === res.tooltip.ruleWidth && res.tooltip.measuredByPage.widthPx === res.tooltip.ruleWidth && res.tooltip.widestContent <= res.tooltip.widths[0] && grown.every((b) => b.width >= res.tooltip.widths[0] && b.width >= b.natural - 0.01) && !res.tooltip.clipped.length && !res.tooltip.wrapped.length && L.pass;
  }
  const on = (kinds) => res.perStop.filter((p) => kinds.includes(p.kind) && p.distancePx != null).map((p) => p.distancePx);
  res.maxDistancePx = {
    lineStops: Math.max(...on(["read", "zero", "latest"])),
    peak: Math.max(...on(["peak"])),
    usualLine: on(["ahead", "wait"]).length ? Math.max(...on(["ahead", "wait"])) : null,
    gapMark: on(["gap"]).length ? Math.max(...on(["gap"])) : null,
  };
  res.maxCoreRenderedOffsetPx = Math.max(...res.perStop.filter((p) => p.coreRenderedOffsetPx != null).map((p) => p.coreRenderedOffsetPx));
  res.aheadWithoutMarker = res.perStop.filter((p) => (p.kind === "ahead" || p.kind === "wait") && !p.marker).length;
  res.wrongForm = res.perStop.filter((p) => p.marker && p.markerForm !== (p.kind === "gap" ? "gap" : marker)).map((p) => p.key);
  res.drawnAbovePoint = res.perStop.filter((p) => p.drawnAbovePoint).map((p) => p.key);
  const latestAt = res.perStop.find((p) => p.key === "latest");
  res.latestText = latestAt ? { tip: latestAt.tip, valuetext: latestAt.valuetext } : null;
  res.latestNotCalledAverage = Boolean(latestAt) && !/average|المتوسط/.test(latestAt.valuetext) && latestAt.valuetext.includes(String(f.now));
  // Pointer snapping (a mouse over the chart): on each half-hour stop, 6px beside the peak and the latest reading,
  // in the middle of the missing span, and 40px past the last stop.
  await page.evaluate(() => window.__eclipse.chart.clear());
  const pr = await rectOf(page, "#plot");
  const y = pr.y + pr.height * 0.5;
  const dir = lang === "ar" ? -1 : 1;
  const probes = [
    { label: "on 6:00 PM", x: res.stops.find((s) => s.key === "h720").clientX, expect: "h720" },
    { label: "6px before the peak (in time)", x: res.peakStop.clientX - 6 * dir, expect: "peak" },
    { label: "6px after the peak", x: res.peakStop.clientX + 6 * dir, expect: "peak" },
    { label: "6px after the latest reading", x: res.latestStop.clientX + 6 * dir, expect: "latest" },
    { label: "middle of the missing span", x: (res.stops.find((s) => s.key === "gap") || { clientX: 0 }).clientX, expect: state === "live" ? "gap" : "gap" },
    { label: "on 9:00 PM", x: res.stops.find((s) => s.key === "h900").clientX, expect: "h900" },
    { label: "40px past closing time", x: res.stops[res.stops.length - 1].clientX + 40 * dir, expect: null },
  ];
  res.pointer = [];
  for (const p of probes) {
    await page.mouse.move(p.x, y);
    await page.waitForTimeout(30);
    const got = await page.evaluate(() => window.__eclipse.chart.selected);
    res.pointer.push({ ...p, x: Math.round(p.x * 10) / 10, got, pass: got === p.expect });
  }
  await page.mouse.move(720, 20);
  // Keyboard: Tab to the chart (the latest reading), then earlier x4, later x2, Home, End, and later x1.
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press("Tab");
    if (await page.evaluate(() => document.activeElement?.id === "plot-hit")) break;
  }
  const later = lang === "ar" ? "ArrowLeft" : "ArrowRight", earlier = lang === "ar" ? "ArrowRight" : "ArrowLeft";
  const order = res.stops.map((s) => s.key);
  const seq = [];
  const read = async (key) => seq.push({ key, selected: await page.evaluate(() => window.__eclipse.chart.selected), focusVisible: await page.evaluate(() => document.activeElement?.matches(":focus-visible")), valuetext: await page.evaluate(() => document.getElementById("plot-hit").getAttribute("aria-valuetext")) });
  await read("focus");
  for (const k of [earlier, earlier, earlier, earlier, later, later, "Home", "End", later]) { await page.keyboard.press(k); await read(k); }
  const idx = (k) => order.indexOf(k);
  const expectIdx = [idx("latest")];
  for (const d of [-1, -1, -1, -1, 1, 1]) expectIdx.push(expectIdx[expectIdx.length - 1] + d);
  expectIdx.push(0, idx("latest"), idx("latest") + 1);
  res.keyboard = { later, earlier, steps: seq, pass: seq.every((s, i) => idx(s.selected) === expectIdx[i]) && seq[0].focusVisible === true };
  await context.close();
  res.pass = res.tooltip.pass && res.latestShowsReading && res.latestNotCalledAverage && res.markerReported === marker && res.wrongForm.length === 0 && res.drawnAbovePoint.length === 0 && res.everyHalfHourAccountedFor &&res.gapStops === (f.last > 511 ? 1 : 0) && res.normalStopsInsideGap === 0 && res.lineSegments === 2 &&
    res.peakStop && res.peakStop.value === f.peak && res.latestStop && res.latestStop.m === f.last &&
    res.maxDistancePx.lineStops <= 0.5 && res.maxDistancePx.peak <= 0.5 && (res.maxDistancePx.usualLine == null || res.maxDistancePx.usualLine <= 0.5) && (res.maxDistancePx.gapMark == null || res.maxDistancePx.gapMark <= 0.5) &&
    res.maxCoreRenderedOffsetPx <= 0.5 && (state !== "nohistory" || res.perStop.filter((p) => p.kind === "ahead").every((p) => !p.marker)) &&
    res.pointer.every((p) => p.pass) && res.keyboard.pass && errors.length === 0;
  return res;
}

/* ------------------------------------------------------------------ Round 7 step 2: form B only
 * B's variants on one enlarged sheet (reduced motion, 3x, tight crops, the tooltip hidden so the shapes can be judged),
 * and that form A and its switch are gone: no Marker group in the tuner, ?marker=a is ignored, no setMarker; plus the
 * hover speed control (its own row in the Motion group, kept in the motion key, ignored with ?tuner=0). */
async function markerChecks() {
  const out = {};
  const cols = [
    ["live", "h660", "on the line, 5:00 PM"],
    ["live", "peak", "the peak, 6:29 PM"],
    ["live", "latest", "the latest reading (live)"],
    ["delayed", "latest", "the latest reading (delayed, stale)"],
    ["live", "h900", "still ahead, 9:00 PM"],
    ["live", "gap", "the missing span (lit dots)"],
    ["nohistory", "h900", "still ahead, no history"],
  ];
  const cells = [];
  for (const [state, key, caption] of cols) {
    const { context, page, errors } = await open(`lang=ar&state=${state}&tuner=0`, { scale: 3 });
    await page.addStyleTag({ content: ".tip { visibility: hidden !important; }" });
    await page.evaluate((k) => window.__eclipse.chart.select(k), key);
    const c = await page.evaluate((k) => {
      const s = document.querySelector("#plot-svg svg").getBoundingClientRect();
      const m = document.querySelector("#sel .sg-mark") || document.querySelector("#sel .sg-tick");
      let x, y;
      if (m.classList.contains("sg-mark")) { const t = m.transform.baseVal.consolidate().matrix; x = t.e; y = t.f; } else { const b = m.getBBox(); x = b.x + b.width / 2; y = b.y + b.height / 2; }
      if (k === "peak") y += 10; // the ring and the line under it
      return { x: s.x + x, y: s.y + y };
    }, key);
    const W = 110, H = 76;
    cells.push({ buf: await page.screenshot({ clip: { x: Math.round(c.x - W / 2), y: Math.round(c.y - H / 2), width: W, height: H } }), caption, errors });
    await context.close();
  }
  {
    const { context, page } = await newPage({ width: 2400, height: 200 });
    await page.setContent(`<!doctype html><html><head><style>
      body { margin: 0; padding: 18px; background: #161616; color: #cfcfcf; font: 15px/1.35 "Segoe UI", system-ui, sans-serif; width: max-content; }
      h1 { margin: 0 0 4px; font-size: 19px; font-weight: 600; color: #eee; } p { margin: 0 0 14px; color: #a9a9a9; max-width: 1900px; }
      .g { display: grid; grid-template-columns: repeat(${cols.length}, max-content); gap: 14px 12px; align-items: start; }
      figure { margin: 0; } img { display: block; } figcaption { margin-top: 5px; max-width: 330px; }
    </style></head><body><h1>Chart marker B, the hollow ring, and its variants (Eclipse concept, synthetic data), Arabic, 3x</h1>
    <p>Tight crops of the real page at rest (reduced motion); the tooltip is hidden here so only the shapes show. Nothing is drawn above the point; the thin hairline below runs to the time axis. The missing span keeps the lit dots.</p>
    <div class="g">${cells.map((c) => `<figure><img src="data:image/png;base64,${c.buf.toString("base64")}"><figcaption>${c.caption}</figcaption></figure>`).join("")}</div></body></html>`);
    await page.waitForTimeout(150);
    await page.screenshot({ path: join(OUT, "marker-variants-ar-3x.png"), fullPage: true });
    await context.close();
  }
  out.variantErrors = cells.flatMap((c) => c.errors);
  {
    const { context, page, errors } = await newPage();
    const ready = async (url) => { await page.goto(url, { waitUntil: "networkidle" }); await page.waitForFunction(() => window.__eclipse?.ready === true); };
    await ready(`${FILE_URL}?lang=ar&marker=a`);
    await page.evaluate(() => window.__eclipse.chart.select("h660"));
    const r = {
      reported: await page.evaluate(() => window.__eclipse.chart.marker),
      shown: await page.evaluate(() => document.querySelector("#sel .sg-mark")?.dataset.marker || null),
      setMarker: await page.evaluate(() => typeof window.__eclipse.chart.setMarker),
      markerGroup: await page.evaluate(() => Boolean(document.querySelector(".tuner-marker"))),
    };
    await page.click(".tuner-toggle");
    r.speedRow = await page.evaluate(() => ({ label: document.querySelector("label[for=t-mo-speed]")?.textContent.trim(), out: document.querySelector("output[for=t-mo-speed]")?.textContent, value: document.getElementById("t-mo-speed")?.value }));
    await page.evaluate(() => { const i = document.getElementById("t-mo-speed"); i.value = "1.5"; i.dispatchEvent(new Event("input")); });
    r.afterSet = await page.evaluate(() => ({ speed: window.__eclipse.motion.options.hoverSpeed, stored: localStorage.getItem("fitway.eclipse.v3.motion"), tau1: window.__eclipse.chart.timings.tau1 }));
    await ready(`${FILE_URL}?lang=ar`);
    r.afterReload = await page.evaluate(() => window.__eclipse.motion.options.hoverSpeed);
    await ready(`${FILE_URL}?lang=ar&tuner=0`);
    r.tunerOffIgnoresStored = await page.evaluate(() => window.__eclipse.motion.options.hoverSpeed);
    await page.evaluate(() => localStorage.removeItem("fitway.eclipse.v3.motion"));
    r.errors = errors;
    r.pass = r.reported === "b" && r.shown === "b" && r.setMarker === "undefined" && !r.markerGroup && /Hover speed/.test(r.speedRow.label || "") && r.speedRow.value === "1" &&
      r.afterSet.speed === 1.5 && JSON.parse(r.afterSet.stored || "{}").hoverSpeed === 1.5 && r.afterSet.tau1 === 60 && r.afterReload === 1.5 && r.tunerOffIgnoresStored === 1 && errors.length === 0;
    out.formAGoneAndSpeed = r;
    await context.close();
  }
  out.pass = out.variantErrors.length === 0 && out.formAGoneAndSpeed.pass;
  console.log(`marker: variants sheet written; form A gone and hover speed ${out.formAGoneAndSpeed.pass ? "pass" : "FAIL"}`);
  return out;
}

/* ------------------------------------------------------------------ Round 7 step 3: the first-open intro
 * Every fresh context is a new browser tab, so its first open plays the intro (with motion on). */
const INTRO_PAGES = [
  ["daily-ar-1440x900", "lang=ar&tuner=0"], ["daily-en-1440x900", "lang=en&tuner=0"],
  ["daily-ar-1440x900-delayed", "lang=ar&state=delayed&tuner=0"], ["daily-ar-1440x900-nohistory", "lang=ar&state=nohistory&tuner=0"],
  ["daily-en-1440x900-delayed", "lang=en&state=delayed&tuner=0"], ["daily-en-1440x900-nohistory", "lang=en&state=nohistory&tuner=0"],
];
// The page's rest DOM without the live pulse (the one element motion keeps at rest), and the same page with ?motion=off
// (the language link carries the page's own query, so ?motion=off appears in it; that is the only expected difference).
const restDom = (page) => page.evaluate(() => { const c = document.querySelector(".page").cloneNode(true); c.querySelectorAll(".ping").forEach((n) => n.remove()); return c.outerHTML; });
async function motionOffDom(q) {
  const off = await open(`${q}&motion=off`, { motion: true });
  const d = await off.page.evaluate(() => document.querySelector(".page").outerHTML.replaceAll("&amp;motion=off", ""));
  await off.context.close();
  return d;
}
// Every trace of the intro from the document's start: its rolling slots and line dashes, font loads, long tasks and
// frame times (an init script, so it runs again on a reload). Two surface probes too: at the first frame once the page's
// script has run (the first paint) and at the intro's first frame, every surface (the cards, the lights, the wash, the
// rail) as its computed style stands then, with every animation running; `surfaceProbe` below judges them against rest.
// It also notes the first frame at which the four answers are in view (no clipped slot is waiting in them).
const INTRO_PROBE = () => {
  const P = (window.__introProbe = { slotsSeen: 0, dashSeen: 0, fontLoads: [], long: [], frames: [], firstPaint: null, introFirstFrame: null, answersInViewAt: null });
  const SURF = ".card, .lamp, .lamp-in, .lamp-rim, .wash, .wash-light, .rail";
  const snap = (t) => ({
    t: Math.round(t), sinceStartMs: window.__eclipse?.intro?.startedAt != null ? Math.round(t - window.__eclipse.intro.startedAt) : null, state: window.__eclipse?.intro?.state || null,
    surfaces: [...document.querySelectorAll(SURF)].map((n) => { const s = getComputedStyle(n); return `${n.className}|${s.display}|${s.visibility}|${s.opacity}|${s.transform}|${s.clipPath}|${s.filter}`; }),
    animations: document.getAnimations().map((a) => { const e = a.effect, el = e && e.target; return { target: el ? `${el.tagName.toLowerCase()}.${[...el.classList].join(".")}` : "(clock)", kind: a.animationName ? `css @keyframes ${a.animationName}` : "web animation", properties: [...new Set((e?.getKeyframes?.() || []).flatMap((k) => Object.keys(k).filter((x) => !["offset", "easing", "composite", "computedOffset"].includes(x))))] }; }),
  });
  const waiting = () => ["#now-v", "#peak-v", "#entries-v", "#busy-v"].some((s) => { const n = document.querySelector(s); return !n || !n.textContent.trim() || (window.__eclipse?.intro?.state === "pending" && n.querySelector(".roll-slot")); });
  const look = (t) => {
    if (!window.__eclipse || !document.querySelector(".card")) return;
    if (!P.firstPaint) P.firstPaint = snap(t);
    if (!P.introFirstFrame && window.__eclipse.intro?.state === "running") P.introFirstFrame = snap(t);
    if (P.answersInViewAt == null && !waiting()) P.answersInViewAt = Math.round(t);
  };
  new MutationObserver((ms) => {
    for (const m of ms) {
      if (m.type === "attributes" && m.target.getAttribute("stroke-dasharray")) P.dashSeen++;
      for (const n of m.addedNodes || []) if (n.nodeType === 1 && (n.matches(".roll-slot") || n.querySelector(".roll-slot"))) P.slotsSeen++;
    }
  }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ["stroke-dasharray"] });
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => P.long.push({ start: Math.round(e.startTime), ms: Math.round(e.duration) }))).observe({ type: "longtask", buffered: true }); } catch (e) { P.longUnsupported = true; }
  if (document.fonts) document.fonts.addEventListener("loading", () => P.fontLoads.push(Math.round(performance.now())));
  const tick = (t) => { P.frames.push(t); try { look(performance.now()); } catch (e) { P.lookError = String(e); } if (P.frames.length < 4000) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
};
// The surface probes against the page at rest (the same page after the intro): every surface present and unchanged
// (display, visibility, opacity, transform, clip and filter as at rest, never hidden or transparent when shown), and nothing
// running but the intro's content transforms (a transform on an answer's rolling digits, or the intro's clocks, which
// have no target and no keyframes) and the live pulse.
const surfaceProbe = async (page) => {
  const rest = await page.evaluate(() => [...document.querySelectorAll(".card, .lamp, .lamp-in, .lamp-rim, .wash, .wash-light, .rail")].map((n) => { const s = getComputedStyle(n); return `${n.className}|${s.display}|${s.visibility}|${s.opacity}|${s.transform}|${s.clipPath}|${s.filter}`; }));
  const P = await page.evaluate(() => ({ firstPaint: window.__introProbe?.firstPaint || null, introFirstFrame: window.__introProbe?.introFirstFrame || null, lookError: window.__introProbe?.lookError || null }));
  const allowed = (a) => (a.kind === "css @keyframes ping") || (a.kind === "web animation" && ((a.target === "(clock)" && a.properties.length === 0) || (/^span\.roll-new/.test(a.target) && a.properties.join() === "transform")));
  const judge = (s) => {
    if (!s) return { seen: false, pass: false };
    // As at rest (the collapsed details card is display: none at rest too), and never hidden or transparent where the
    // rest page shows it.
    const bad = s.surfaces.filter((v, i) => { const [, display, visibility, opacity] = v.split("|"); return v !== rest[i] || (display !== "none" && (visibility !== "visible" || Number(opacity) === 0)); });
    const others = s.animations.filter((a) => !allowed(a));
    return { seen: true, t: s.t, sinceStartMs: s.sinceStartMs, state: s.state, surfaces: s.surfaces.length, restSurfaces: rest.length, hiddenOrChanged: bad.slice(0, 6), animations: s.animations.length, notAllowed: others.slice(0, 6), pass: s.surfaces.length === rest.length && rest.length > 0 && bad.length === 0 && others.length === 0 };
  };
  const out = { firstPaint: judge(P.firstPaint), introFirstFrame: judge(P.introFirstFrame), lookError: P.lookError };
  out.pass = out.firstPaint.pass && out.introFirstFrame.pass && !out.lookError;
  return out;
};
const introPerf = (page) => page.evaluate(() => {
  const I = window.__eclipse.intro, P = window.__introProbe || {};
  const a = I.startedAt, b = I.endedAt, within = (t) => a != null && b != null && t >= a && t <= b;
  const fr = (P.frames || []).filter(within);
  let gap = 0;
  for (let i = 1; i < fr.length; i++) gap = Math.max(gap, fr[i] - fr[i - 1]);
  return {
    state: I.state, played: I.played, firstOpen: I.firstOpen, reason: I.reason, yieldedBy: I.yieldedBy, fontWaitMs: I.fontWaitMs,
    measuredMs: a != null && b != null ? Math.round(b - a) : null, expectedMs: I.timings.totalMs, slotsSeen: P.slotsSeen, dashSeen: P.dashSeen,
    longTasksDuringIntro: (P.long || []).filter((l) => within(l.start) || (a != null && l.start < a && l.start + l.ms > a)), longTaskObserver: !P.longUnsupported,
    fontLoadsDuringIntro: (P.fontLoads || []).filter(within), framesDuringIntro: fr.length, maxFrameGapMs: Math.round(gap * 10) / 10,
  };
});
// What the page holds at a moment: the boxes that must never move, the answers' text, the live region, the chart's
// screen-reader text, how the line is drawn, and every animation with its properties.
const introProbeNow = (page) => page.evaluate(() => {
  const R = (n) => { const r = n.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map((v) => Math.round(v * 100) / 100).join(","); };
  const boxes = [...document.querySelectorAll(".head, #status, .card, .stat-head, .stat-value, .stat-value > *, .stat-foot, .stat-note, .chart-head, #plot, #plot-labels > *, .rail")].map(R);
  const props = (a) => [...new Set((a.effect?.getKeyframes?.() || []).flatMap((k) => Object.keys(k).filter((x) => !["offset", "easing", "composite", "computedOffset"].includes(x))))];
  return {
    state: window.__eclipse.intro.state, boxes,
    answers: ["#now-v", "#peak-v", "#entries-v", "#busy-v"].map((s) => document.querySelector(s).textContent),
    liveRegion: document.getElementById("live-say").textContent, valuetext: document.getElementById("plot-hit").getAttribute("aria-valuetext"),
    line: [...document.querySelectorAll('#plot-svg path[id^="ln-"]')].map((p) => (p.getAttribute("visibility") === "hidden" ? "hidden" : p.getAttribute("stroke-dasharray") ? `dash ${p.getAttribute("stroke-dasharray").split(" ")[0]}` : "whole")),
    lineParts: document.querySelectorAll('#plot-svg path[id^="ln-"]').length,
    animations: document.getAnimations().map((a) => { const el = a.effect && a.effect.target; return { target: el ? `${el.tagName.toLowerCase()}.${[...el.classList].join(".")}` : "(clock)", text: el ? el.textContent.trim() : "", properties: props(a) }; }),
  };
});
// A captioned sheet of intro frames, each drawn at `width` px (the browser scales the 2x frames down smoothly).
async function introSheet(name, title, cells, cols, width) {
  const { context, page } = await newPage({ width: 1600, height: 1000 });
  const items = cells.map((c) => `<figure><img src="data:image/png;base64,${c.buf.toString("base64")}" style="width:${c.width || width}px"><figcaption>${c.caption}</figcaption></figure>`).join("");
  await page.setContent(`<!doctype html><html><head><style>
    body { margin: 0; padding: 16px; background: #161616; color: #cfcfcf; font: 15px/1.35 "Segoe UI", system-ui, sans-serif; width: max-content; }
    h1 { margin: 0 0 12px; font-size: 17px; font-weight: 600; color: #eee; max-width: ${cols * (width + 14)}px; }
    .g { display: grid; grid-template-columns: repeat(${cols}, max-content); gap: 14px 14px; align-items: start; }
    figure { margin: 0; } img { display: block; } figcaption { margin-top: 5px; max-width: ${width}px; }
  </style></head><body><h1>${title}</h1><div class="g">${items}</div></body></html>`);
  await page.waitForTimeout(150);
  await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: true });
  await context.close();
  return `${name}.png`;
}
// Held frames of one page's intro at 2x: each part held at `times` ms after the start, then released to its end, which
// is compared with this run's reduced-motion 2x frame. `crops` names 2x clips taken at some of the times.
async function introHeld(lang, state, times, crops = null) {
  const q = `lang=${lang}&state=${state}&tuner=0`;
  // One held sequence: each part held at every time in `times`, then released to its end. `keep` writes the frames.
  const heldRun = async (keep) => {
    const { context, page, errors } = await newPage({ motion: true, scale: 2 });
    await page.goto(`${ORIGIN}/index.html?${q}`);
    await page.waitForFunction(() => ["running", "done", "off"].includes(window.__eclipse?.intro?.state), null, { timeout: 15000 });
    const held = await page.evaluate(() => window.__eclipse.intro.seek(0));
    await page.addStyleTag({ content: HIDE_PULSE });
    const fontsIn = await page.evaluate(() => ["400", "500"].every((w) => document.fonts.check(`${w} 46px "Readex Pro"`, "0123456789 العربية")));
    const frames = [], clips = [];
    for (const t of times) {
      await page.evaluate((ms) => window.__eclipse.intro.seek(ms), t);
      await page.waitForTimeout(40);
      const buf = await page.screenshot();
      frames.push({ t, buf, at: await introProbeNow(page) });
      if (keep && INTRO_FRAMES) { await mkdir(INTRO_FRAMES, { recursive: true }); await writeFile(join(INTRO_FRAMES, `intro-${lang}-${state}-${String(t).padStart(4, "0")}ms-2x.png`), buf); }
      if (keep && crops) for (const c of crops.filter((k) => k.times.includes(t))) clips.push({ name: c.name, t, buf: await page.screenshot({ clip: await c.clip(page) }) });
    }
    await page.evaluate(() => window.__eclipse.intro.release());
    await introSettled(page);
    await page.waitForTimeout(120);
    const endBuf = await page.screenshot();
    const end = await introProbeNow(page);
    if (keep && INTRO_FRAMES) await writeFile(join(INTRO_FRAMES, `intro-${lang}-${state}-end-2x.png`), endBuf);
    if (keep && crops) for (const c of crops.filter((k) => k.times.includes("end"))) clips.push({ name: c.name, t: "end", buf: await page.screenshot({ clip: await c.clip(page) }) });
    const yieldedBy = await page.evaluate(() => window.__eclipse.intro.yieldedBy);
    await context.close();
    return { held, fontsIn, frames, clips, endBuf, end, yieldedBy, errors };
  };
  const first = await heldRun(true);
  const { held, fontsIn, frames, clips, endBuf, end, yieldedBy, errors } = first;
  // The end state is judged on an intro that plays by itself, as the owner sees it, and on the end after the held
  // frames, each against this page's reduced-motion 2x frame. At 2x the raster of one glyph («6-8» in Arabic, a few
  // dozen fringe pixels, max 32-84/255) is bistable on this machine, in reduced-motion frames with no intro too; so when
  // an end differs, one more still and one more of that end are rendered, every hash is kept, and the end passes only if
  // one of its renderings equals a still rendering of the page. Both ends set the exit code.
  const still2x = async () => { const s = await open(q, { scale: 2 }); const buf = await s.page.screenshot(); await s.context.close(); return buf; };
  const natural2x = async () => {
    const n = await newPage({ motion: true, scale: 2 });
    await n.page.goto(`${ORIGIN}/index.html?${q}`);
    await n.page.waitForFunction(() => window.__eclipse?.intro?.state === "done" || window.__eclipse?.intro?.state === "off", null, { timeout: 15000 });
    await n.page.addStyleTag({ content: HIDE_PULSE });
    await n.page.waitForTimeout(120);
    const buf = await n.page.screenshot();
    const run = await n.page.evaluate(() => ({ played: window.__eclipse.intro.played, yieldedBy: window.__eclipse.intro.yieldedBy }));
    await n.context.close();
    return { buf, run };
  };
  const stillBuf = await still2x();
  const nat = [await natural2x()];
  const natM = await exact(`intro held 2x ${lang} ${state}, played by itself`, nat[0].buf, sha(stillBuf), async () => { const x = await natural2x(); nat.push(x); return x.buf; }, still2x);
  const naturalIdentical = nat.every((x) => x.run.played && x.run.yieldedBy === "complete") && natM.identical;
  const natural = { runs: nat.map((x) => ({ ...x.run, sha: sha(x.buf).slice(0, 16) })), stills: natM.perAttempt.map((x) => x.expected), stillsAgree: new Set(natM.perAttempt.map((x) => x.expected)).size === 1 };
  const heldEnds = [{ sha: sha(endBuf), yieldedBy, errors: errors.length }];
  const endM = await exact(`intro held 2x ${lang} ${state}, end after the holds`, endBuf, sha(stillBuf), async () => {
    const again = await heldRun(false);
    heldEnds.push({ sha: sha(again.endBuf), yieldedBy: again.yieldedBy, errors: again.errors.length });
    errors.push(...again.errors);
    return again.endBuf;
  }, still2x);
  const endIdentical = endM.identical;
  const r = {
    url: `index.html?${q}`, held, fontsLoadedAtStart: fontsIn, yieldedBy,
    naturalEndIdenticalToStill2x: naturalIdentical, naturalRuns: natural, naturalPixelDiff: sha(nat[0].buf) === sha(stillBuf) ? null : await pixelDiff(nat[0].buf, stillBuf),
    heldEndIdenticalToStill2x: endIdentical, heldEndRuns: heldEnds.map((x) => ({ ...x, sha: x.sha.slice(0, 16) })), heldEndPixelDiff: sha(endBuf) === sha(stillBuf) ? null : await pixelDiff(endBuf, stillBuf),
    frames: frames.map((fr) => ({ ms: fr.t, line: fr.at.line, answers: fr.at.answers, animations: fr.at.animations.length })),
    boxesNeverMove: frames.every((fr) => fr.at.boxes.join("|") === end.boxes.join("|")),
    boxesThatMoved: frames.flatMap((fr) => fr.at.boxes.map((b, i) => (b === end.boxes[i] ? null : { ms: fr.t, i, during: b, rest: end.boxes[i] })).filter(Boolean)).slice(0, 10),
    answersFinalThroughout: frames.every((fr) => fr.at.answers.join("|") === end.answers.join("|")),
    liveRegionSilent: frames.every((fr) => fr.at.liveRegion === "") && end.liveRegion === "",
    chartTextFinalThroughout: frames.every((fr) => fr.at.valuetext === end.valuetext),
    glyphOpacity: frames.flatMap((fr) => fr.at.animations.filter((a) => a.properties.includes("opacity")).map((a) => `${fr.t} ms ${a.target}`)),
    textAnimationProperties: [...new Set(frames.flatMap((fr) => fr.at.animations.filter((a) => a.text).flatMap((a) => a.properties)))],
    lineNeverBridged: frames.every((fr) => fr.at.lineParts === 2),
    errors,
  };
  r.pass = held && fontsIn && naturalIdentical && endIdentical && r.boxesNeverMove && r.answersFinalThroughout && r.liveRegionSilent && r.chartTextFinalThroughout && r.glyphOpacity.length === 0 &&
    ["", "transform"].includes(r.textAnimationProperties.join()) && r.lineNeverBridged && errors.length === 0;
  return { r, frames, endBuf, clips };
}
async function captureIntro() {
  const out = { firstOpen: identity.firstOpen, reload: identity.reload };
  // 1. First open, then a reload in the same tab (AR and EN; live, delayed and no history).
  for (const [name, q] of INTRO_PAGES) {
    let stillSha = PRE_REF[name] || null, against = "pre-motion frame";
    const stillAgain = PRE_REF[name] ? null : async () => { const s = await open(q); const b = await s.page.screenshot(); await s.context.close(); return b; };
    if (!stillSha) { stillSha = sha(await stillAgain()); against = "this run's reduced-motion frame"; }
    const { context, page, errors } = await newPage({ motion: true });
    await context.addInitScript(INTRO_PROBE);
    await page.goto(`${ORIGIN}/index.html?${q}`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => window.__eclipse?.ready === true);
    await introSettled(page);
    await page.waitForTimeout(150);
    const perf = await introPerf(page);
    const surfaces = await surfaceProbe(page);
    const after = await listAnimations(page);
    const dom = await restDom(page);
    await page.addStyleTag({ content: HIDE_PULSE });
    await page.waitForTimeout(60);
    const endBuf = await page.screenshot();
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForFunction(() => window.__eclipse?.ready === true);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(150);
    const rPerf = await introPerf(page);
    const rAnims = await listAnimations(page);
    const rDom = await restDom(page);
    await page.addStyleTag({ content: HIDE_PULSE });
    await page.waitForTimeout(60);
    const reloadBuf = await page.screenshot();
    await context.close();
    // On a difference, the first open (and its reload) is run once more in a fresh context, and the frame compared again;
    // a recaptured end counts only if that first open played its intro to the end.
    let rerun = null;
    const again = async () => {
      if (rerun) return rerun;
      const n = await newPage({ motion: true });
      await n.page.goto(`${ORIGIN}/index.html?${q}`, { waitUntil: "networkidle" });
      await n.page.waitForFunction(() => window.__eclipse?.ready === true);
      await introSettled(n.page);
      await n.page.waitForTimeout(150);
      const ran = await n.page.evaluate(() => window.__eclipse.intro.played && window.__eclipse.intro.yieldedBy === "complete");
      await n.page.addStyleTag({ content: HIDE_PULSE });
      await n.page.waitForTimeout(60);
      const e = await n.page.screenshot();
      await n.page.reload({ waitUntil: "networkidle" });
      await n.page.waitForFunction(() => window.__eclipse?.ready === true);
      await n.page.evaluate(() => document.fonts.ready);
      await n.page.waitForTimeout(150);
      const noIntro = await n.page.evaluate(() => !window.__eclipse.intro.played);
      await n.page.addStyleTag({ content: HIDE_PULSE });
      await n.page.waitForTimeout(60);
      const r = await n.page.screenshot();
      await n.context.close();
      rerun = { end: ran ? e : Buffer.from("the intro did not play to its end"), reload: noIntro ? r : Buffer.from("the reload played an intro") };
      return rerun;
    };
    const endM = await exact(`intro first open end ${name}`, endBuf, stillSha, async () => (await again()).end, stillAgain);
    const reloadM = await exact(`intro reload ${name}`, reloadBuf, stillSha, async () => (await again()).reload, stillAgain);
    const domOff = await motionOffDom(q);
    const live = !q.includes("delayed");
    const pulseOnly = (list) => (live ? list.length === 1 && list[0].kind === "css @keyframes ping" : list.length === 0);
    const fo = {
      url: `index.html?${q}`, against, played: perf.played, reason: perf.reason, yieldedBy: perf.yieldedBy, measuredMs: perf.measuredMs, expectedMs: perf.expectedMs, fontWaitMs: perf.fontWaitMs,
      introElementsSeen: { slots: perf.slotsSeen, dashes: perf.dashSeen }, endIdenticalToStill: endM.identical, endAttempts: endM.attempts, ...(endM.noise ? { endNoise: true } : {}), onlyThePulseAfter: pulseOnly(after),
      animationsAfter: after.map((a) => `${a.kind} on ${a.target}`), domEqualsMotionOff: dom === domOff,
      longTasksDuringIntro: perf.longTasksDuringIntro, longTaskObserver: perf.longTaskObserver, fontLoadsDuringIntro: perf.fontLoadsDuringIntro, framesDuringIntro: perf.framesDuringIntro, maxFrameGapMs: perf.maxFrameGapMs,
      surfacesAtFirstFrames: surfaces, errors,
    };
    fo.pass = fo.played && fo.yieldedBy === "complete" && fo.endIdenticalToStill && fo.onlyThePulseAfter && fo.domEqualsMotionOff && fo.longTasksDuringIntro.length === 0 && fo.fontLoadsDuringIntro.length === 0 && surfaces.pass && errors.length === 0;
    identity.firstOpen[name] = fo;
    const rl = { played: rPerf.played, state: rPerf.state, reason: rPerf.reason, introElementsSeen: rPerf.slotsSeen + rPerf.dashSeen, identicalToStill: reloadM.identical, attempts: reloadM.attempts, ...(reloadM.noise ? { noise: true } : {}), onlyThePulse: pulseOnly(rAnims), animationsOnLoad: rAnims.map((a) => `${a.kind} on ${a.target}`), domEqualsMotionOff: rDom === domOff };
    rl.pass = !rl.played && rl.state === "off" && rl.introElementsSeen === 0 && rl.identicalToStill && rl.onlyThePulse && rl.domEqualsMotionOff;
    identity.reload[name] = rl;
    console.log(`intro ${name}: first open ${fo.pass ? "pass" : "FAIL"} (${fo.measuredMs} ms, fonts ${fo.fontWaitMs} ms, end = still ${fo.endIdenticalToStill}, surfaces at first paint ${surfaces.firstPaint.pass} and at the intro's first frame ${surfaces.introFirstFrame.pass}); reload ${rl.pass ? "pass" : "FAIL"} (no intro ${!rl.played}, = still ${rl.identicalToStill})`);
  }

  // 1b. Slow fonts (user decision, 2026-09-26: the wait for the fonts is capped at 200 ms from the first paint). Each
  //     font file held 600 ms: no intro, the answers in view within 250 ms of the first paint, and the page, once its
  //     fonts are in, has the ?motion=off DOM and is the still frame. Held 50 ms: the intro plays. (AR and EN, live; the
  //     local files are held at their response, including their preloads.)
  const slowFonts = {};
  for (const [lang, name] of [["ar", "daily-ar-1440x900"], ["en", "daily-en-1440x900"]]) {
    const q = `lang=${lang}&tuner=0`;
    const domOff = await motionOffDom(q);
    for (const delay of [600, 50]) {
      const { context, page, errors, heldFonts, requests } = await newPage({ motion: true, fontDelayMs: delay });
      await context.addInitScript(INTRO_PROBE);
      await page.goto(`${ORIGIN}/index.html?${q}`, { waitUntil: "networkidle" });
      await page.waitForFunction(() => window.__eclipse?.ready === true);
      await introSettled(page);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(150);
      const s = await page.evaluate(() => {
        const I = window.__eclipse.intro, P = window.__introProbe || {}, fp = performance.getEntriesByName("first-paint")[0];
        return { played: I.played, state: I.state, reason: I.reason, yieldedBy: I.yieldedBy, fontWaitMs: I.fontWaitMs, firstPaintMs: fp ? Math.round(fp.startTime) : null, answersInViewAtMs: P.answersInViewAt, introEverRan: Boolean(P.introFirstFrame), fontsInAtEnd: ["400", "500"].every((w) => document.fonts.check(`${w} 46px "Readex Pro"`, "0123456789 العربية")) };
      });
      s.answersInViewAfterFirstPaintMs = s.firstPaintMs != null && s.answersInViewAtMs != null ? s.answersInViewAtMs - s.firstPaintMs : null;
      s.domEqualsMotionOff = (await restDom(page)) === domOff;
      await page.addStyleTag({ content: HIDE_PULSE });
      await page.waitForTimeout(60);
      const ref = await stillRef(name, q);
      const endM = await exact(`intro slow fonts ${lang}@${delay}ms end`, await page.screenshot(), ref.expected, async () => {
        const n = await newPage({ motion: true, fontDelayMs: delay });
        await n.page.goto(`${ORIGIN}/index.html?${q}`, { waitUntil: "networkidle" });
        await n.page.waitForFunction(() => window.__eclipse?.ready === true);
        await introSettled(n.page);
        await n.page.evaluate(() => document.fonts.ready);
        await n.page.waitForTimeout(150);
        await n.page.addStyleTag({ content: HIDE_PULSE });
        await n.page.waitForTimeout(60);
        const b = await n.page.screenshot();
        await n.context.close();
        return b;
      }, ref.reference);
      s.endIdenticalToStill = endM.identical;
      s.endAttempts = endM.attempts;
      s.onlyLocalFonts = await page.evaluate((origin) => performance.getEntriesByType("resource")
        .filter((e) => /\.woff2(?:\?|$)/.test(e.name))
        .every((e) => new URL(e.name).origin === origin), ORIGIN);
      s.onlyLocalFonts = s.onlyLocalFonts && requests.every((url) => new URL(url).origin === ORIGIN)
        && ["arabic", "latin"].every((subset) => requests.includes(`${ORIGIN}/fonts/readex-pro-${subset}.woff2`));
      s.requests = requests;
      s.heldFonts = heldFonts;
      s.localHoldsExercised = heldFonts.length >= 2 && heldFonts.every((f) => f.heldMs >= delay - 1);
      s.errors = errors;
      await context.close();
      s.pass = delay === 600
        ? !s.played && !s.introEverRan && s.reason === "first open in this tab" && s.yieldedBy === "fonts late" && s.answersInViewAfterFirstPaintMs != null && s.answersInViewAfterFirstPaintMs <= 250 && s.domEqualsMotionOff && s.endIdenticalToStill && s.fontsInAtEnd && s.onlyLocalFonts && s.localHoldsExercised && errors.length === 0
        : s.played && s.yieldedBy === "complete" && s.domEqualsMotionOff && s.endIdenticalToStill && s.onlyLocalFonts && s.localHoldsExercised && errors.length === 0;
      slowFonts[`${lang}@${delay}ms`] = s;
    }
  }
  slowFonts.pass = Object.values(slowFonts).every((v) => v.pass);
  out.slowFonts = slowFonts;
  console.log(`intro slow fonts: ${slowFonts.pass ? "pass" : "FAIL"} (${Object.entries(slowFonts).filter(([k]) => k !== "pass").map(([k, v]) => `${k} played ${v.played} by ${v.yieldedBy}, answers in view ${v.answersInViewAfterFirstPaintMs} ms after first paint, DOM = motion=off ${v.domEqualsMotionOff}, = still ${v.endIdenticalToStill}`).join("; ")})`);

  // 2. When it plays.
  const when = {};
  {
    const { context, page, errors } = await newPage({ motion: true });
    const state = (p) => p.evaluate(() => { const I = window.__eclipse.intro; return { played: I.played, state: I.state, reason: I.reason, fontWaitMs: I.fontWaitMs }; });
    const go = async (p, q) => { await p.goto(`${ORIGIN}/index.html?${q}`, { waitUntil: "networkidle" }); await p.waitForFunction(() => window.__eclipse?.ready === true); await introSettled(p); return state(p); };
    when.newTab = await go(page, "lang=ar&tuner=0");
    when.reloadSameTab = (await page.reload({ waitUntil: "networkidle" }), await page.waitForFunction(() => window.__eclipse?.ready === true), await state(page));
    // Coming back in the same tab: the language link, then the other language's link back.
    await Promise.all([page.waitForURL(/lang=en/), page.click("#lang-link")]);
    await page.waitForLoadState("networkidle");
    await page.waitForFunction(() => window.__eclipse?.ready === true && window.__eclipse.lang === "en");
    when.sameTabLanguageLink = await state(page);
    const tab2 = await context.newPage();
    tab2.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    when.secondTab = await go(tab2, "lang=ar&tuner=0");
    // The tuner's Motion switch off (kept in localStorage, which the context's tabs share): a new tab has no intro,
    // and ?tuner=0 ignores the stored switch.
    const tab3 = await context.newPage();
    await go(tab3, "lang=ar");
    await tab3.evaluate(() => window.__eclipse.motion.set({ motion: false }));
    const tab4 = await context.newPage();
    when.newTabWithMotionSwitchOff = await go(tab4, "lang=ar");
    const tab5 = await context.newPage();
    when.newTabWithSwitchOffButTunerOff = await go(tab5, "lang=ar&tuner=0");
    await tab5.evaluate(() => localStorage.removeItem("fitway.eclipse.v3.motion"));
    when.errors = errors;
    await context.close();
  }
  {
    const r = await open("lang=ar&tuner=0");
    when.reducedMotion = await r.page.evaluate(() => { const I = window.__eclipse.intro; return { played: I.played, state: I.state, reason: I.reason, firstOpen: I.firstOpen }; });
    await r.context.close();
    const o = await open("lang=ar&tuner=0&motion=off", { motion: true });
    when.motionOffUrl = await o.page.evaluate(() => { const I = window.__eclipse.intro; return { played: I.played, state: I.state, reason: I.reason, firstOpen: I.firstOpen }; });
    await o.context.close();
  }
  // Replay intro and the intro speed, from the tuner (motion on). Each replay ends at the still page.
  {
    const { context, page, errors } = await newPage({ motion: true });
    await page.goto(`${ORIGIN}/index.html?lang=ar`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => window.__eclipse?.ready === true);
    await introSettled(page);
    await page.click(".tuner-toggle");
    const row = () => page.evaluate(() => ({ label: document.querySelector("label[for=t-mo-intro]")?.textContent.trim(), out: document.querySelector("output[for=t-mo-intro]")?.textContent, value: document.getElementById("t-mo-intro")?.value, replay: document.getElementById("t-mo-replay")?.textContent.trim(), replayDisabled: document.getElementById("t-mo-replay")?.disabled }));
    const r = { row: await row() };
    const replay = async () => {
      await page.click("#t-mo-replay");
      await page.waitForFunction(() => ["running", "done"].includes(window.__eclipse.intro.state));
      const running = await page.evaluate(() => window.__eclipse.intro.state);
      await introSettled(page);
      return { sawRunning: running === "running", ...(await page.evaluate(() => { const I = window.__eclipse.intro; return { count: I.count, yieldedBy: I.yieldedBy, measuredMs: Math.round(I.endedAt - I.startedAt), expectedMs: I.timings.totalMs, speed: I.timings.speed }; })) };
    };
    r.replay1x = await replay();
    const hideTuner = await page.addStyleTag({ content: `${HIDE_PULSE} .tuner { visibility: hidden !important; }` });
    await page.mouse.move(720, 20);
    await page.waitForTimeout(80);
    const replayRef = await stillRef("daily-ar-1440x900", "lang=ar&tuner=0");
    const replayM = await exact("intro replay end", await page.screenshot(), replayRef.expected, async () => {
      const n = await newPage({ motion: true });
      await n.page.goto(`${ORIGIN}/index.html?lang=ar`, { waitUntil: "networkidle" });
      await n.page.waitForFunction(() => window.__eclipse?.ready === true);
      await introSettled(n.page);
      await n.page.click(".tuner-toggle");
      await n.page.click("#t-mo-replay");
      await n.page.waitForFunction(() => ["running", "done"].includes(window.__eclipse.intro.state));
      await introSettled(n.page);
      await n.page.addStyleTag({ content: `${HIDE_PULSE} .tuner { visibility: hidden !important; }` });
      await n.page.mouse.move(720, 20);
      await n.page.waitForTimeout(80);
      const b = await n.page.screenshot();
      await n.context.close();
      return b;
    }, replayRef.reference);
    r.replayEndIdenticalToStill = replayM.identical;
    r.replayEndAttempts = replayM.attempts;
    await hideTuner.evaluate((n) => n.remove());
    const setSpeed = (v) => page.evaluate((x) => { const i = document.getElementById("t-mo-intro"); i.value = String(x); i.dispatchEvent(new Event("input")); }, v);
    await setSpeed(0.5);
    r.at05 = { out: (await row()).out, ...(await replay()) };
    await setSpeed(2);
    r.at2 = { out: (await row()).out, ...(await replay()) };
    r.stored = await page.evaluate(() => JSON.parse(localStorage.getItem("fitway.eclipse.v3.motion") || "{}"));
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForFunction(() => window.__eclipse?.ready === true);
    r.afterReload = await page.evaluate(() => ({ introSpeed: window.__eclipse.motion.options.introSpeed, played: window.__eclipse.intro.played }));
    await page.goto(`${ORIGIN}/index.html?lang=ar&tuner=0`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => window.__eclipse?.ready === true);
    r.tunerOffIgnoresStored = await page.evaluate(() => window.__eclipse.motion.options.introSpeed);
    await page.evaluate(() => localStorage.removeItem("fitway.eclipse.v3.motion"));
    r.errors = errors;
    await context.close();
    // With reduced motion, Replay intro is disabled and does nothing.
    const red = await open("lang=ar");
    await red.page.click(".tuner-toggle");
    r.reducedMotion = await red.page.evaluate(() => ({ replayDisabled: document.getElementById("t-mo-replay").disabled, replayReturns: window.__eclipse.intro.replay(), state: window.__eclipse.intro.state }));
    await red.context.close();
    const near = (a, b) => Math.abs(a - b) <= Math.max(60, b * 0.12);
    r.pass = /Intro speed/.test(r.row.label || "") && r.row.value === "1" && /1\.00× · 1171 ms/.test(r.row.out || "") && /Replay intro/.test(r.row.replay || "") && !r.row.replayDisabled &&
      r.replay1x.sawRunning && r.replay1x.yieldedBy === "complete" && r.replay1x.count === 2 && near(r.replay1x.measuredMs, 1171) && r.replayEndIdenticalToStill &&
      r.at05.out === "0.50× · 2342 ms" && near(r.at05.measuredMs, 2342) && r.at2.out === "2.00× · 586 ms" && near(r.at2.measuredMs, 586) &&
      r.stored.introSpeed === 2 && r.afterReload.introSpeed === 2 && r.afterReload.played === false && r.tunerOffIgnoresStored === 1 &&
      r.reducedMotion.replayDisabled && r.reducedMotion.replayReturns === false && r.reducedMotion.state === "off" && errors.length === 0;
    when.replayAndSpeed = r;
  }
  when.pass = when.newTab.played && !when.reloadSameTab.played && when.reloadSameTab.reason === "already opened in this tab" && !when.sameTabLanguageLink.played &&
    when.secondTab.played && !when.newTabWithMotionSwitchOff.played && when.newTabWithMotionSwitchOff.reason === "motion switch off" && when.newTabWithSwitchOffButTunerOff.played &&
    !when.reducedMotion.played && when.reducedMotion.reason === "reduced motion" && !when.motionOffUrl.played && when.motionOffUrl.reason === "motion=off" &&
    when.replayAndSpeed.pass && when.errors.length === 0;
  out.whenItPlays = when;
  console.log(`intro when it plays: ${when.pass ? "pass" : "FAIL"} (new tab ${when.newTab.played}, reload ${when.reloadSameTab.played}, same-tab link ${when.sameTabLanguageLink.played}, second tab ${when.secondTab.played}, switch off ${when.newTabWithMotionSwitchOff.played}, reduced ${when.reducedMotion.played}, motion=off ${when.motionOffUrl.played}; replay ${when.replayAndSpeed.replay1x.measuredMs} ms, 0.5x ${when.replayAndSpeed.at05.measuredMs} ms, 2x ${when.replayAndSpeed.at2.measuredMs} ms)`);

  // 3. It yields at once: a hover, keys, the rail, a tap, a new reading and a resize, at 100 and 400 ms into it (AR,
  //    live). The owner sees the still page at once, with the action's own result; nothing waits and nothing is lost.
  const yields = {};
  const yieldCells = [];
  {
    const railRef = await stillRef("daily-ar-1440x900-rail-open", "lang=ar&tuner=0", async (p) => { await act(p, { act: "rail-open" }); await p.waitForTimeout(200); });
    let canonStep = null, canonStepDom = null, canon1280 = null;
    // The reference for the resize: a fresh 1280x800 page, rendered in this run (so rendered again on a difference).
    const fresh1280 = async () => { const c = await open("lang=ar&tuner=0", { width: 1280, height: 800 }); const b = await c.page.screenshot(); await c.context.close(); return b; };
    {
      const b = await open("lang=ar&tuner=0");
      await b.page.evaluate(() => window.__eclipse.motion.step());
      await b.page.waitForTimeout(100);
      canonStep = await b.page.screenshot();
      canonStepDom = await b.page.evaluate(() => document.querySelector(".page").outerHTML);
      await b.context.close();
      canon1280 = await fresh1280();
    }
    // A recapture of the rail or resize frame: the same action at the same moment of a fresh first open.
    const yieldAgain = (action, at) => async () => {
      const n = await newPage({ motion: true });
      await n.page.goto(`${ORIGIN}/index.html?lang=ar&tuner=0`);
      await n.page.waitForFunction(() => window.__eclipse?.intro?.state === "running", null, { timeout: 15000 });
      await n.page.waitForFunction((t) => performance.now() - window.__eclipse.intro.startedAt >= t, at, { polling: 5 });
      if (action === "rail") await n.page.click("#brand");
      if (action === "resize") await n.page.setViewportSize({ width: 1280, height: 800 });
      await n.page.waitForTimeout(750);
      await n.page.addStyleTag({ content: HIDE_PULSE });
      if (action === "rail") { await n.page.mouse.move(720, 40); await n.page.waitForTimeout(300); } else await n.page.waitForTimeout(60);
      const b = await n.page.screenshot();
      await n.context.close();
      return b;
    };
    for (const action of ["hover", "keys", "rail", "tap", "reading", "resize"]) {
      for (const at of [100, 400]) {
        const { context, page, errors } = await newPage({ motion: true, touch: action === "tap" });
        await page.goto(`${ORIGIN}/index.html?lang=ar&tuner=0`);
        await page.waitForFunction(() => window.__eclipse?.intro?.state === "running", null, { timeout: 15000 });
        await page.waitForFunction((t) => performance.now() - window.__eclipse.intro.startedAt >= t, at, { polling: 5 });
        const stop = await page.evaluate(() => window.__eclipse.chart.stops.find((s) => s.key === "h720"));
        const pr = await rectOf(page, "#plot");
        const r = { action, at };
        if (action === "hover") await page.mouse.move(stop.clientX, pr.y + pr.height * 0.5);
        if (action === "keys") {
          // A key anywhere settles it; then the keyboard path: Tab to the chart (the latest reading) and one arrow earlier.
          await page.keyboard.press("ArrowLeft");
          r.afterFirstKey = await page.evaluate(() => ({ state: window.__eclipse.intro.state, yieldedBy: window.__eclipse.intro.yieldedBy }));
          for (let i = 0; i < 40 && !(await page.evaluate(() => document.activeElement?.id === "plot-hit")); i++) await page.keyboard.press("Tab");
          await page.keyboard.press("ArrowRight");
        }
        if (action === "rail") await page.click("#brand");
        if (action === "tap") await page.touchscreen.tap(stop.clientX, pr.y + pr.height * 0.5);
        if (action === "reading") r.step = await page.evaluate(() => window.__eclipse.motion.step());
        if (action === "resize") await page.setViewportSize({ width: 1280, height: 800 });
        await page.waitForTimeout(50);
        const moment = await page.screenshot();
        r.settled = await page.evaluate(() => { const I = window.__eclipse.intro; return { state: I.state, yieldedBy: I.yieldedBy, settledAtMs: Math.round(I.endedAt - I.startedAt) }; });
        r.answersAtRest = await page.evaluate(() => ["#now-v", "#peak-v", "#entries-v", "#busy-v"].every((s) => !document.querySelector(s).querySelector(".roll-slot") || window.__eclipse.motion.rolling > 0));
        r.chartWhole = await page.evaluate(() => [...document.querySelectorAll('#plot-svg path[id^="ln-"]')].every((p) => !p.hasAttribute("stroke-dasharray") && !p.hasAttribute("visibility")) && !document.getElementById("intro-hair"));
        yieldCells.push({ buf: moment, caption: `${action} at ${at} ms: 50 ms later (intro settled at ${r.settled.settledAtMs} ms by ${r.settled.yieldedBy})` });
        await page.waitForTimeout(700);
        if (action === "hover" || action === "tap" || action === "keys") {
          const m = await measureMarker(page);
          r.selected = await page.evaluate(() => window.__eclipse.chart.selected);
          r.marker = { form: m.form, distancePx: m.distancePx, tip: m.tip };
          const expect = action === "keys" ? await page.evaluate(() => { const s = window.__eclipse.chart.stops; return s[s.findIndex((x) => x.key === "latest") - 1].key; }) : "h720";
          r.pass = r.selected === expect && m.distancePx != null && m.distancePx <= 0.5 && Boolean(m.tip);
          if (action === "keys") r.pass = r.pass && r.afterFirstKey.state === "done" && r.afterFirstKey.yieldedBy === "keydown";
        }
        if (action === "rail") {
          await page.addStyleTag({ content: HIDE_PULSE });
          await page.mouse.move(720, 40);
          await page.waitForTimeout(300);
          r.railOpen = await page.evaluate(() => document.getElementById("brand").getAttribute("aria-expanded"));
          const m = await exact(`intro yields to the rail at ${at} ms, settled`, await page.screenshot(), railRef.expected, yieldAgain("rail", at), railRef.reference);
          r.settledIdenticalToStill = m.identical;
          r.attempts = m.attempts;
          r.pass = r.railOpen === "true" && r.settledIdenticalToStill;
        }
        if (action === "reading") {
          await page.mouse.move(720, 30);
          r.figures = await page.evaluate(() => { const f = window.__eclipse.figures; return { last: f.last, entries: f.entries, now: f.now }; });
          r.domEqualsCanonical = (await page.evaluate(() => { const c = document.querySelector(".page").cloneNode(true); c.querySelectorAll(".ping").forEach((n) => n.remove()); return c.outerHTML; })) === canonStepDom;
          await page.addStyleTag({ content: HIDE_PULSE });
          await page.waitForTimeout(60);
          r.pixelDiffFromCanonical = await pixelDiff(await page.screenshot(), canonStep);
          r.pass = r.step?.reading === true && r.figures.last === 823 && r.domEqualsCanonical;
        }
        if (action === "resize") {
          await page.addStyleTag({ content: HIDE_PULSE });
          await page.waitForTimeout(60);
          const buf = await page.screenshot();
          const m = await exact(`intro yields to a resize at ${at} ms`, buf, sha(canon1280), yieldAgain("resize", at), fresh1280);
          r.identicalToFresh1280 = m.identical;
          r.attempts = m.attempts;
          if (!r.identicalToFresh1280) r.pixelDiffFromFresh1280 = await pixelDiff(buf, canon1280);
          r.pass = r.identicalToFresh1280;
        }
        r.pass = Boolean(r.pass) && r.settled.state === "done" && r.chartWhole && r.answersAtRest && errors.length === 0 && (action !== "reading" || r.settled.yieldedBy === "new reading") && (action !== "resize" || r.settled.yieldedBy === "resize");
        r.errors = errors;
        yields[`${action}@${at}`] = r;
        await context.close();
      }
    }
  }
  yields.pass = Object.values(yields).every((v) => v.pass);
  out.yields = yields;
  console.log(`intro yields: ${yields.pass ? "pass" : "FAIL"} (${Object.entries(yields).filter(([k]) => k !== "pass").map(([k, v]) => `${k} ${v.pass ? "ok" : "FAIL"} by ${v.settled.yieldedBy} at ${v.settled.settledAtMs} ms`).join("; ")})`);

  // 4. Held 2x frames and the sheets. Live: 0, 86, 171, 286, 500, 714 and 1000 ms and the end; delayed and no history:
  //    the start, the middle and the end. Extra 2x details: the answers rolling, and the line landing.
  const held = {};
  const TIMES = [0, 86, 171, 286, 500, 714, 1000];
  const crops = [
    { name: "answers", times: [0, 86, 171, 286, 400], clip: async (p) => clipOf(await rectOf(p, "#cards")) },
    { name: "landing", times: [857, 914, 943, 1000, 1086, "end"], clip: (p) => p.evaluate(() => {
      const s = document.querySelector("#plot-svg svg").getBoundingClientRect(), e = document.getElementById("end-dot"), k = document.getElementById("pk-dot");
      const ex = s.x + Number(e.getAttribute("cx")), ey = s.y + Number(e.getAttribute("cy")), kx = s.x + Number(k.getAttribute("cx")), ky = s.y + Number(k.getAttribute("cy"));
      const x0 = Math.min(ex, kx) - 70, x1 = Math.max(ex, kx) + 70;
      return { x: Math.round(x0), y: Math.round(ky - 46), width: Math.round(x1 - x0), height: Math.round(ey - ky + 80) };
    }) },
  ];
  const liveAr = await introHeld("ar", "live", [...new Set([...TIMES, 400, 857, 914, 943, 1086])].sort((a, b) => a - b), crops);
  const liveEn = await introHeld("en", "live", TIMES);
  held.ar = liveAr.r; held.en = liveEn.r;
  const contact = [];
  for (const t of TIMES) {
    for (const h of [liveAr, liveEn]) contact.push({ buf: h.frames.find((fr) => fr.t === t).buf, caption: `${h === liveAr ? "AR" : "EN"} · ${t} ms` });
  }
  contact.push({ buf: liveAr.endBuf, caption: `AR · settled end (after these holds = 2x still frame: ${liveAr.r.heldEndIdenticalToStill2x}; played by itself: ${liveAr.r.naturalEndIdenticalToStill2x})` }, { buf: liveEn.endBuf, caption: `EN · settled end (after these holds = 2x still frame: ${liveEn.r.heldEndIdenticalToStill2x}; played by itself: ${liveEn.r.naturalEndIdenticalToStill2x})` });
  const sheets = [];
  sheets.push(await introSheet("intro-contact-sheet", "First-open intro (Round 7 step 3), live, AR and EN, 1440×900 at 2x, held at times after its start (concept, synthetic data). The answers roll into place (settled by 400 ms); the line draws from opening to now (914 ms), then the end point and the peak land (to 1171 ms). The surfaces, lights, labels, grid, axes and usual line never move.", contact, 2, 720));
  const states = [];
  for (const lang of ["ar", "en"]) {
    for (const state of ["delayed", "nohistory"]) {
      const h = await introHeld(lang, state, [0, 457]);
      held[`${lang}-${state}`] = h.r;
      states.push({ buf: h.frames[0].buf, caption: `${lang.toUpperCase()} ${state} · start (0 ms)` }, { buf: h.frames[1].buf, caption: `${lang.toUpperCase()} ${state} · middle (457 ms)` }, { buf: h.endBuf, caption: `${lang.toUpperCase()} ${state} · end (= 2x still frame, played by itself: ${h.r.naturalEndIdenticalToStill2x}; after these holds: ${h.r.heldEndIdenticalToStill2x})` });
    }
  }
  sheets.push(await introSheet("intro-states-2x", "First-open intro while delayed and with no history, AR and EN, 2x: the start, the middle and the end. While delayed the stale Inside now number and its age stay still (a stale card never moves) and the grey end point appears at once; with no history there is no usual line.", states, 3, 720));
  const detail = [
    ...liveAr.clips.filter((c) => c.name === "answers").map((c) => ({ buf: c.buf, caption: `The answers at ${c.t} ms (AR, 2x)`, width: 1320 })),
    ...liveAr.clips.filter((c) => c.name === "landing").map((c) => ({ buf: c.buf, caption: `The landing at ${c.t === "end" ? "the end" : `${c.t} ms`}: the line reaches now at 914 ms, then the end point swells out of its tip and the peak ring swells in (AR, 2x)` })),
  ];
  sheets.push(await introSheet("intro-detail-ar-2x", "First-open intro details, AR, 2x: the four answers entering their final place (the digit roll, from below, inside the digits' own box), and the line landing on now.", detail, 1, 660));
  sheets.push(await introSheet("intro-yield-ar", "The intro yields at once (AR, live, 1x): each frame is 50 ms after the owner's action at 100 or 400 ms into the intro. The page is complete and the action's own result has begun.", yieldCells, 4, 480));
  held.pass = Object.values(held).every((v) => v.pass);
  out.held = held;
  out.sheets = sheets;
  console.log(`intro held frames: ${held.pass ? "pass" : "FAIL"} (${Object.entries(held).filter(([k]) => k !== "pass").map(([k, v]) => `${k} end=still ${v.naturalEndIdenticalToStill2x} (after holds ${v.heldEndIdenticalToStill2x}), boxes still ${v.boxesNeverMove}`).join("; ")})`);
  out.pass = Object.values(identity.firstOpen).every((v) => v.pass) && Object.values(identity.reload).every((v) => v.pass) && slowFonts.pass && when.pass && yields.pass && held.pass;
  return out;
}

async function captureMotion() {
  const M = {};
  // Motion frames from earlier runs (other names and times) would no longer match: start clean.
  for (const f of await readdir(OUT)) if (/^(motion|intro)-.*\.png$/.test(f)) await rm(join(OUT, f), { force: true });
  {
    const { context, page } = await open("lang=ar&tuner=0", { motion: true });
    M.spec = await page.evaluate(() => window.__eclipse.motion.spec());
    await context.close();
  }

  // 1. ?motion=off without reduced motion: every still frame equals its pre-motion frame; the frames that change by
  //    design (and the new English hover frame) equal this run's reduced-motion frame instead.
  for (const frame of FRAMES) {
    if (frame.act === "tuner-open") continue;
    const q = `${frame.q}&motion=off`;
    const { context, page, errors } = await open(q, { motion: true });
    await act(page, frame);
    await page.waitForTimeout(200);
    const buf = await page.screenshot({ fullPage: Boolean(frame.full) });
    let still = stillBuffers[frame.name];
    if (!still) { try { still = await readFile(join(OUT, `${frame.name}.png`)); } catch { still = null; } }
    const against = PRE[frame.name] && !EXPECTED_TO_CHANGE[frame.name] ? "pre-motion frame" : "this run's reduced-motion frame";
    const again = recapture(q, { motion: true }, async (p) => { await act(p, frame); await p.waitForTimeout(200); }, { fullPage: Boolean(frame.full) });
    const m = against === "pre-motion frame"
      ? await exact(`?motion=off ${frame.name}`, buf, PRE[frame.name], again)
      : await exact(`?motion=off ${frame.name}`, buf, still && sha(still), again, recapture(frame.q, {}, async (p) => { await act(p, frame); await p.waitForTimeout(200); }, { fullPage: Boolean(frame.full) }));
    const identical = m.identical;
    identity.motionOffFrames[frame.name] = { url: `index.html?${q}`, reducedMotion: "no-preference", against, identical, attempts: m.attempts, ...(m.noise ? { noise: true } : {}), dataMotion: await page.evaluate(() => document.documentElement.dataset.motion), errors };
    await context.close();
  }

  // 2. Round 7 step 3, the first-open intro: on a tab's first open (a fresh context) it plays and ends exactly at the
  //    still frame, with only the live pulse running after it (none while delayed) and the DOM equal to the ?motion=off
  //    DOM; a reload in the same tab has no intro at all and is the still frame at once. Then when it plays, how it
  //    yields, its held 2x frames and its sheets (see captureIntro).
  M.intro = await captureIntro();

  // 3. The chart: stops, the marker at every stop (AR and EN; delayed and no history in AR), pointer and keyboard.
  //    Round 7 step 2: form B only; the latest stop shows the latest reading.
  M.chart = {};
  for (const mk of MARKERS) {
    const s = "";
    M.chart[`ar${s}`] = await chartChecks("ar", "live", mk);
    M.chart[`en${s}`] = await chartChecks("en", "live", mk);
    M.chart[`arDelayed${s}`] = await chartChecks("ar", "delayed", mk);
    M.chart[`arNoHistory${s}`] = await chartChecks("ar", "nohistory", mk);
    M.chart[`enDelayed${s}`] = await chartChecks("en", "delayed", mk);
    M.chart[`enNoHistory${s}`] = await chartChecks("en", "nohistory", mk);
  }
  // The follow-up round after step 3 (the 127 px round): the tooltip has one width on every page, in both languages and
  // every state, except the missing-span stop, which may grow; the widest tooltip that shows a number fits in it.
  {
    const pages = Object.values(M.chart);
    const widths = [...new Set(pages.flatMap((v) => v.tooltip.widths))];
    const widest = Math.max(...pages.map((v) => v.tooltip.widestContent));
    const at = Object.entries(M.chart).flatMap(([k, v]) => v.perStop.filter((p) => p.tipBox?.numbered && p.tipBox.natural === widest).map((p) => `${k} ${p.key}`));
    M.tooltipWidth = { widths, gapWidths: [...new Set(pages.flatMap((v) => v.tooltip.gapWidths))], widestNumberedContentPx: widest, widestContentPx: widest, widestAt: at, marginPx: widths.length === 1 ? Math.round((widths[0] - widest) * 100) / 100 : null, pass: widths.length === 1 && widest <= widths[0] && pages.every((v) => v.tooltip.pass) };
    // The lane round: the lane's rules, per page (AR and EN; live, delayed and no history) at the page's own snapshot.
    M.tooltipLane = { pages: Object.fromEntries(Object.entries(M.chart).map(([k, v]) => [k, v.tooltip.lane])), pass: Object.values(M.chart).every((v) => v.tooltip.lane.pass) };
  }

  // 3b. Round 7 step 2: B's variants, form A gone, the hover speed.
  M.marker = await markerChecks();

  // 4. The follow (Round 7 step 2) stays on the curve: held at times after a new target, the marker is on today's line
  //    (or the usual line, or the peak's dotted drop, straight above the peak's minute); it covers the clip's share of
  //    the distance within 0.07 (the covered arc length is read from the page's own response); it is not a straight
  //    hop. Where no drawn track joins two stops, the marker is at once on its new stop and only the tooltip eases.
  //    Held 2x frames are written.
  const follow = {};
  {
    const cells = [];
    for (const lang of ["ar", "en"]) {
      const { context, page, errors } = await open(`lang=${lang}&tuner=0`, { motion: true, scale: 2 });
      await page.addStyleTag({ content: HIDE_PULSE });
      const response = await page.evaluate(() => window.__eclipse.chart.response());
      const runs = [];
      for (const [a, b] of [["h660", "h690"], ["h720", "peak"], ["h630", "h600"], ["h870", "h900"]]) {
        await page.evaluate((k) => { window.__eclipse.chart.clear(); window.__eclipse.chart.select(k); }, a);
        const start = await measureMarker(page);
        await page.evaluate((k) => window.__eclipse.chart.select(k), b);
        const state = await page.evaluate(() => window.__eclipse.chart.follow);
        await page.evaluate(() => window.__eclipse.chart.seekFollow(5000));
        const end = await measureMarker(page);
        const pr = await rectOf(page, "#plot");
        const crop = { x: Math.round(pr.x + (start.marker.x + end.marker.x) / 2 - 170), y: Math.round(pr.y + (start.marker.y + end.marker.y) / 2 - 150), width: 340, height: 260 };
        const shots = [];
        const samples = [];
        for (const ms of [33, 66, 100, 200, 400]) {
          await page.evaluate((t) => window.__eclipse.chart.seekFollow(t), ms);
          const m = await measureMarker(page);
          samples.push({ ms, marker: m.marker, form: m.form, markerForm: m.markerForm, distancePx: m.distancePx, drawnAbovePoint: m.drawnAbovePoint });
          if (lang === "ar" && runs.length < 2 && ms <= 200) shots.push({ buf: await page.screenshot({ clip: crop }), caption: `${a} to ${b}: ${ms} ms after the new target` });
        }
        if (shots.length) cells.push(...shots, { buf: await page.screenshot({ clip: crop }), caption: `${a} to ${b}: 400 ms` });
        await page.evaluate(() => { window.__eclipse.chart.releaseFollow(); window.__eclipse.motion.settle(); });
        const seg = (p) => { const A = start.marker, B = end.marker; const vx = B.x - A.x, vy = B.y - A.y, L = Math.hypot(vx, vy) || 1; return Math.abs((p.x - A.x) * vy - (p.y - A.y) * vx) / L; };
        runs.push({ from: a, to: b, followed: state.marker, start: start.marker, end: end.marker, samples, maxDistanceFromTrackPx: Math.max(...samples.map((s) => (s.distancePx == null ? Infinity : s.distancePx)), 0), maxOffStraightSegmentPx: Math.round(Math.max(...samples.map((s) => seg(s.marker))) * 100) / 100 });
      }
      // No drawn track joins these: the marker is on its new stop at once; the tooltip eases.
      const cut = [];
      for (const [a, b] of [["latest", "h840"], ["h480", "gap"], ["gap", "h540"]]) {
        await page.evaluate((k) => { window.__eclipse.chart.clear(); window.__eclipse.chart.select(k); }, a);
        await page.evaluate((k) => window.__eclipse.chart.select(k), b);
        const st = await page.evaluate(() => window.__eclipse.chart.follow);
        const m = await measureMarker(page);
        cut.push({ from: a, to: b, markerFollowed: st.marker, tooltipEases: st.tooltip, markerOnTargetPx: m.distancePx, form: m.form });
        await page.evaluate(() => window.__eclipse.motion.settle());
      }
      const ref = [0.19, 0.43, 0.6, 0.72, 0.87, 0.95];
      const fit = response.slice(0, 6).map((r, i) => Math.abs(r.fraction - ref[i]));
      follow[lang] = { response, maxDeviationFromClip: Math.round(Math.max(...fit) * 1000) / 1000, runs, cutsInstead: cut, errors,
        pass: Math.max(...fit) <= 0.07 && runs.every((r) => r.followed && r.maxDistanceFromTrackPx <= 0.5 && r.samples.every((s) => s.markerForm === "b" && !s.drawnAbovePoint)) &&
          runs.filter((r) => r.to !== "peak").some((r) => r.maxOffStraightSegmentPx > 0.5) && cut.every((c) => !c.markerFollowed && c.tooltipEases && (c.markerOnTargetPx == null || c.markerOnTargetPx <= 0.5)) && errors.length === 0 };
      await context.close();
    }
    await sheet("motion-follow-ar-2x", "Marker B following its stop along the curve (Round 7 step 2), AR, 2x, held at times after the new target: 0.19 of the way at 33 ms, 0.43 at 66, 0.60 at 100, 0.87 at 200, settled by 400. One fixed crop per run.", cells, 5);
  }
  M.follow = follow;

  // 5. Numbers roll and level bars (AR and EN): a crowd-level change down and up across a boundary (the tuner's
  //    simulation on the Inside now card), and a new reading (Entries and the times). Every animation is listed:
  //    digits move by transform only (the slot's width may ease), bars by scaleY; no glyph ever animates opacity.
  {
    const roll = {};
    for (const lang of ["ar", "en"]) {
      const { context, page, errors } = await open(`lang=${lang}&tuner=0`, { motion: true, scale: 2 });
      await page.addStyleTag({ content: HIDE_PULSE });
      const card = clipOf(await rectOf(page, "#card-now"));
      const nowClip = { x: card.x + 8, y: card.y + 52, width: card.width - 16, height: card.height - 56 };
      const ent = clipOf(await rectOf(page, "#card-entries"));
      const entClip = { x: ent.x + 8, y: ent.y + 52, width: ent.width - 16, height: 64 };
      const st = clipOf(await rectOf(page, "#status"));
      const stClip = { x: st.x - 4, y: st.y - 4, width: st.width + 8, height: st.height + 8 };
      const cells = [], barCells = [];
      const r = { errors };
      cells.push({ buf: await page.screenshot({ clip: nowClip }), caption: "Inside now 49, Busy (before)" });
      // Down across Busy/Moderate: 49 -> 48.
      r.down = await page.evaluate(() => window.__eclipse.motion.crowd(-1));
      await pauseAll(page);
      r.downAnimations = await listAnimations(page);
      for (const t of [30, 70, 140]) { await holdAt(page, t); await page.waitForTimeout(30); cells.push({ buf: await page.screenshot({ clip: nowClip }), caption: `49 to 48, ${t} ms (down)` }); }
      await releaseAll(page);
      cells.push({ buf: await page.screenshot({ clip: nowClip }), caption: "48, Moderate (at rest)" });
      r.afterDown = await page.evaluate(() => ({ value: document.getElementById("now-v").innerHTML, foot: document.getElementById("now-foot").innerHTML, say: document.getElementById("live-say").textContent }));
      // Up across Moderate/Busy (48 -> 49), then Busy/Packed (49 -> 69): bars filling, held.
      // The bars are 3px wide: their cells are enlarged 4x (nearest-neighbour), with the whole chip once for the word.
      const bars = clipOf(await rectOf(page, "#now-foot .bars"));
      const barsClip = { x: bars.x - 5, y: bars.y - 5, width: bars.width + 10, height: bars.height + 10 };
      const chipShot = async (caption) => { const c = clipOf(await rectOf(page, "#now-foot .level")); barCells.push({ buf: await page.screenshot({ clip: { x: c.x - 6, y: c.y - 6, width: c.width + 12, height: c.height + 12 } }), caption, zoom: 2 }); };
      await chipShot("Moderate (before), whole chip");
      r.up = await page.evaluate(() => window.__eclipse.motion.crowd(1));
      await pauseAll(page);
      r.upAnimations = await listAnimations(page);
      for (const t of [20, 60, 110, 200]) { await holdAt(page, t); await page.waitForTimeout(30); barCells.push({ buf: await page.screenshot({ clip: barsClip }), caption: `Moderate to Busy: the third bar fills, ${t} ms`, zoom: 4 }); }
      await releaseAll(page);
      await chipShot("Busy (at rest): the word swapped at once");
      r.up2 = await page.evaluate(() => window.__eclipse.motion.crowd(1));
      await pauseAll(page);
      for (const t of [20, 60, 110]) { await holdAt(page, t); await page.waitForTimeout(30); barCells.push({ buf: await page.screenshot({ clip: barsClip }), caption: `Busy to Packed: the fourth bar fills, ${t} ms`, zoom: 4 }); }
      await holdAt(page, 70); await page.waitForTimeout(30);
      cells.push({ buf: await page.screenshot({ clip: nowClip }), caption: "49 to 69, 70 ms (only the tens digit moves)" });
      await releaseAll(page);
      await chipShot("Packed (at rest)");
      r.up2Say = await page.evaluate(() => document.getElementById("live-say").textContent);
      await page.evaluate(() => window.__eclipse.motion.reset());
      await page.waitForTimeout(400);
      // A new reading: 7:42 -> 7:43, Entries 332 -> 333.
      r.step = await page.evaluate(() => window.__eclipse.motion.step());
      await pauseAll(page);
      r.stepAnimations = await listAnimations(page);
      await holdAt(page, 70); await page.waitForTimeout(30);
      cells.push({ buf: await page.screenshot({ clip: entClip }), caption: "Entries 332 to 333, 70 ms" });
      cells.push({ buf: await page.screenshot({ clip: stClip }), caption: "Last reading 7:42 to 7:43, 70 ms" });
      await releaseAll(page);
      r.stepSay = await page.evaluate(() => document.getElementById("live-say").textContent);
      r.restAfterStep = await page.evaluate(() => ({ nowV: document.getElementById("now-v").innerHTML, entries: document.getElementById("entries-v").innerHTML, status: document.querySelector("#status bdi").innerHTML, rollLeft: document.querySelectorAll(".roll-slot, .roll-run, .lv-fill").length }));
      const all = [...r.downAnimations, ...r.upAnimations, ...r.stepAnimations];
      const digits = all.filter((a) => /roll-(new|old)/.test(a.target));
      const firstY = (a) => { const m = /translateY\((-?[\d.]+)px\)/.exec(a.keyframes[0].transform || ""); return m ? Number(m[1]) : 0; };
      r.checks = {
        glyphOpacityAnimations: glyphOpacity(all).map((a) => a.target),
        digitProperties: [...new Set(digits.flatMap((a) => a.properties))],
        slotProperties: [...new Set(all.filter((a) => /roll-slot/.test(a.target)).flatMap((a) => a.properties))],
        barProperties: [...new Set(all.filter((a) => /lv-fill/.test(a.target)).flatMap((a) => a.properties))],
        // Rising: the new digit starts below (positive translateY); falling: above (negative).
        downNewDigitStartsAbove: r.downAnimations.filter((a) => /roll-new/.test(a.target)).every((a) => firstY(a) < 0),
        upNewDigitStartsBelow: [...r.upAnimations, ...r.stepAnimations].filter((a) => /roll-new/.test(a.target)).every((a) => firstY(a) > 0),
        digitsThatMovedOnDown: r.downAnimations.filter((a) => /roll-new/.test(a.target)).map((a) => a.text),
        digitsThatMovedOnStep: r.stepAnimations.filter((a) => /roll-new/.test(a.target)).map((a) => a.text),
        barsThatChangedOnDown: r.downAnimations.filter((a) => /lv-fill/.test(a.target)).length,
        rollMs: [...new Set(digits.map((a) => a.durationMs))],
      };
      r.pass = r.checks.glyphOpacityAnimations.length === 0 && r.checks.digitProperties.join() === "transform" && ["", "width"].includes(r.checks.slotProperties.join()) && r.checks.barProperties.join() === "transform" &&
        r.checks.downNewDigitStartsAbove && r.checks.upNewDigitStartsBelow && r.checks.digitsThatMovedOnDown.join() === "8" && r.checks.digitsThatMovedOnStep.length >= 2 && r.checks.barsThatChangedOnDown === 1 &&
        r.afterDown.value === "48" && /متوسط|Moderate/.test(r.afterDown.foot) && (r.afterDown.foot.match(/class="on"/g) || []).length === 2 && /48/.test(r.afterDown.say) && /69/.test(r.up2Say) && /333/.test(r.stepSay) &&
        r.restAfterStep.rollLeft === 0 && r.restAfterStep.entries === "333" && errors.length === 0;
      roll[lang] = r;
      if (lang === "ar") {
        await sheet("motion-roll-ar-2x", "Digits roll, AR, 2x: only the changed digit moves, down when the value falls and up when it rises, inside the digits' own box; no fade.", cells, 3);
        await sheet("motion-bars-ar-2x", "Crowd-level bars, AR, 2x: each bar that changes fills from the bottom (scaleY, 200 ms); the level word swaps at once. Bar cells are enlarged 4x, chip cells 2x (nearest-neighbour).", barCells, 5);
      } else {
        await sheet("motion-roll-en-2x", "Digits roll, EN, 2x.", cells, 3);
      }
      await context.close();
    }
    M.roll = roll;
  }

  // 6. Live: one simulated new reading (the next minute of the same seeded day). The tail morph held at 2x, and the
  //    settled page against the same reading applied without motion (pixels and DOM).
  {
    const { context, page, errors } = await open("lang=ar&tuner=0", { motion: true, scale: 2 });
    await page.addStyleTag({ content: HIDE_PULSE });
    await page.mouse.move(720, 30);
    // A tight crop around the end point (a minute is about 1px wide), enlarged 3x in the sheet.
    const tailClip = await page.evaluate(() => {
      const e = document.getElementById("end-dot").getBoundingClientRect();
      const cx = e.x + e.width / 2, cy = e.y + e.height / 2;
      return { x: Math.round(cx - 70), y: Math.round(cy - 45), width: 110, height: 90 };
    });
    const cells = [{ buf: await page.screenshot({ clip: tailClip }), caption: "Before (7:42)", zoom: 3 }];
    const step = await page.evaluate(() => window.__eclipse.motion.step());
    await pauseAll(page);
    const T = await page.evaluate(() => window.__eclipse.motion.timings.morph);
    for (const t of [70, 140]) {
      await holdAt(page, t);
      await page.evaluate((x) => window.__eclipse.motion.seekLive(x), t / T);
      await page.waitForTimeout(30);
      cells.push({ buf: await page.screenshot({ clip: tailClip }), caption: `${t} ms of ${T}`, zoom: 3 });
    }
    await page.evaluate(() => window.__eclipse.motion.seekLive(1));
    await releaseAll(page);
    cells.push({ buf: await page.screenshot({ clip: tailClip }), caption: "After (7:43)", zoom: 3 });
    await sheet("motion-live-ar-tail-2x", "A new reading extends the line by one minute, AR, 2x, around the end point (enlarged 3x): only the last 15-30 minutes of the centred average morph (it is cut at the latest reading); nothing earlier moves.", cells, 4);
    await context.close();
    const a = await open("lang=ar&tuner=0", { motion: true });
    await a.page.mouse.move(720, 30);
    await a.page.evaluate(() => window.__eclipse.motion.step());
    await a.page.waitForTimeout(700);
    await a.page.addStyleTag({ content: HIDE_PULSE });
    await a.page.waitForTimeout(60);
    const settledBuf = await a.page.screenshot();
    const domAfter = await a.page.evaluate(() => { const c = document.querySelector(".page").cloneNode(true); c.querySelectorAll(".ping").forEach((n) => n.remove()); return c.outerHTML; });
    await a.context.close();
    const b = await open("lang=ar&tuner=0");
    await b.page.evaluate(() => window.__eclipse.motion.step());
    await b.page.waitForTimeout(100);
    const canon = await b.page.screenshot();
    const domCanon = await b.page.evaluate(() => document.querySelector(".page").outerHTML);
    await b.context.close();
    identity.liveUpdateEndsAtCanonical = { identicalWithPulseHidden: sha(settledBuf) === sha(canon), pixelDiff: await pixelDiff(settledBuf, canon), domEqual: domAfter === domCanon };
    M.live = { step, morphMs: T, errors: [...errors, ...a.errors, ...b.errors] };
  }

  // 7. Delayed: nothing looks live. No pulse, nothing running at rest; a simulated minute passes with no reading: the
  //    line does not move, only "minutes ago" rolls (transform), and then nothing runs.
  {
    const { context, page, errors } = await open("lang=ar&state=delayed&tuner=0", { motion: true });
    const before = await page.evaluate(() => ({ figures: window.__eclipse.figures, pulse: Boolean(document.querySelector(".ping")), running: document.getAnimations().filter((a) => a.playState === "running").length, meta: document.getElementById("now-meta").innerText.trim() }));
    const r = await page.evaluate(() => window.__eclipse.motion.step());
    const during = await listAnimations(page);
    const liveMorph = await page.evaluate(() => window.__eclipse.motion.liveActive);
    const crowd = await page.evaluate(() => window.__eclipse.motion.crowd(-1));
    await page.waitForTimeout(450);
    const after = await page.evaluate(() => ({ figures: window.__eclipse.figures, pulse: Boolean(document.querySelector(".ping")), running: document.getAnimations().filter((a) => a.playState === "running").length, meta: document.getElementById("now-meta").innerText.trim(), say: document.getElementById("live-say").textContent }));
    const d = { pulseAtRest: before.pulse, runningAnimationsAtRest: before.running, metaBefore: before.meta, step: r, lastBefore: before.figures.last, lastAfter: after.figures.last, nowBefore: before.figures.nowM, nowAfter: after.figures.nowM, rightAfterTheMinute: during.map((a) => `${a.target} ${a.properties.join("+")}`), liveMorph, crowdSimulation: crowd, pulseAfter: after.pulse, runningAnimations450msAfter: after.running, metaAfter: after.meta, liveRegion: after.say, errors };
    d.pass = !d.pulseAtRest && d.runningAnimationsAtRest === 0 && d.lastAfter === d.lastBefore && d.nowAfter === d.nowBefore + 1 && !liveMorph &&
      during.length > 0 && during.every((a) => /roll-(new|old|slot)/.test(a.target) && !a.properties.includes("opacity")) && crowd === null &&
      !d.pulseAfter && d.runningAnimations450msAfter === 0 && d.metaAfter !== d.metaBefore && d.liveRegion === "" && errors.length === 0;
    M.delayed = d;
    await context.close();
  }

  // 8. The rail mid-transition (opening at 100 ms of 240; closing at 90 ms of 200), AR and EN. The names are uncovered
  //    by a clip, never faded; the settled open rail equals the still frame.
  {
    const rail = {};
    for (const lang of ["ar", "en"]) {
      const { context, page, errors } = await open(`lang=${lang}&tuner=0`, { motion: true });
      await page.addStyleTag({ content: HIDE_PULSE });
      await page.click("#brand");
      await pauseAll(page);
      const anims = await listAnimations(page);
      await holdAt(page, 100);
      await mshot(page, `motion-rail-${lang}-open-0100ms`, `Rail ${lang.toUpperCase()} opening, 100 of 240 ms`);
      rail[`${lang}Open`] = { railWidth: await page.evaluate(() => getComputedStyle(document.getElementById("rail")).width), animatedProperties: [...new Set(anims.flatMap((a) => a.properties))], nameAnimations: anims.filter((a) => /rail-name/.test(a.target)).map((a) => a.properties.join("+")), glyphOpacityAnimations: glyphOpacity(anims).map((a) => a.target), durationsMs: [...new Set(anims.map((a) => a.durationMs))] };
      await releaseAll(page);
      await page.mouse.move(720, 40);
      await page.waitForTimeout(300);
      if (lang === "ar") {
        const railRef = await stillRef("daily-ar-1440x900-rail-open", "lang=ar&tuner=0", async (p) => { await act(p, { act: "rail-open" }); await p.waitForTimeout(200); });
        const railM = await exact("rail AR open, settled", await page.screenshot(), railRef.expected, recapture("lang=ar&tuner=0", { motion: true }, async (p) => {
          await p.addStyleTag({ content: HIDE_PULSE });
          await p.click("#brand");
          await p.mouse.move(720, 40);
          await p.waitForTimeout(700);
        }), railRef.reference);
        rail.arOpenSettledIdenticalToStatic = railM.identical;
        rail.arOpenSettledAttempts = railM.attempts;
        await page.click("#brand");
        await pauseAll(page);
        const closeAnims = await listAnimations(page);
        await holdAt(page, 90);
        await mshot(page, "motion-rail-ar-close-0090ms", "Rail AR closing, 90 of 200 ms");
        rail.arClose = { animatedProperties: [...new Set(closeAnims.flatMap((a) => a.properties))], glyphOpacityAnimations: glyphOpacity(closeAnims).map((a) => a.target) };
        await releaseAll(page);
      }
      rail[`${lang}Errors`] = errors;
      await context.close();
    }
    rail.pass = rail.arOpenSettledIdenticalToStatic && ["arOpen", "enOpen"].every((k) => rail[k].glyphOpacityAnimations.length === 0 && rail[k].nameAnimations.every((p) => p === "clipPath")) && rail.arClose.glyphOpacityAnimations.length === 0 && rail.arErrors.length === 0 && rail.enErrors.length === 0;
    M.rail = rail;
  }

  // 9. Contact sheet of the motion frames.
  {
    const { context, page } = await newPage({ width: 1440, height: 900 });
    const items = [];
    for (const s of mshots) items.push({ ...s, src: `data:image/png;base64,${(await readFile(join(OUT, `${s.name}.png`))).toString("base64")}` });
    await page.setContent(`<!doctype html><html><head><style>
      body { margin: 0; padding: 16px; background: #111; color: #ccc; font: 12px/1.3 "Segoe UI", system-ui, sans-serif; }
      h1 { margin: 0 0 10px; font-size: 14px; font-weight: 600; color: #eee; }
      .g { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
      figure { margin: 0; } img { display: block; width: 100%; height: 260px; object-fit: contain; background: #000; border: 1px solid #333; }
      figcaption { margin-top: 4px; }
    </style></head><body><h1>Eclipse Round 6 motion, held frames (concept, synthetic data). The only load motion is the first-open intro (Round 7 step 3), on its own sheet, intro-contact-sheet.png.</h1><div class="g">${items.map((i) => `<figure><img src="${i.src}"><figcaption>${i.caption}</figcaption></figure>`).join("")}</div></body></html>`);
    await page.waitForTimeout(200);
    await page.screenshot({ path: join(OUT, "motion-contact-sheet.png"), fullPage: true });
    await context.close();
  }

  M.frames = mshots.map((s) => `${s.name}.png`).concat(["motion-contact-sheet.png"], M.intro.sheets);
  Object.assign(motionLog, M);
  const c = M.chart;
  const fo = Object.values(identity.firstOpen), rl = Object.values(identity.reload);
  console.log(`motion: off-frames identical ${Object.values(identity.motionOffFrames).filter((v) => v.identical).length}/${Object.keys(identity.motionOffFrames).length}; intro end = still frame ${fo.filter((v) => v.endIdenticalToStill).length}/${fo.length}, reload without intro = still frame ${rl.filter((v) => v.pass).length}/${rl.length}; live ends at canonical ${identity.liveUpdateEndsAtCanonical?.identicalWithPulseHidden} (DOM ${identity.liveUpdateEndsAtCanonical?.domEqual})`);
  for (const k of Object.keys(c)) console.log(`chart ${k}: ${c[k].pass ? "pass" : "FAIL"}; stops ${c[k].stops.length}; marker max distance line ${c[k].maxDistancePx.lineStops} px, peak ${c[k].maxDistancePx.peak}, usual ${c[k].maxDistancePx.usualLine}, gap ${c[k].maxDistancePx.gapMark}; pointer ${c[k].pointer.filter((p) => p.pass).length}/${c[k].pointer.length}; keyboard ${c[k].keyboard.pass}`);
  console.log(`tooltip: ${M.tooltipWidth.pass ? "pass" : "FAIL"}; width ${M.tooltipWidth.widths.join("/")} px on every page (the missing-span stop ${M.tooltipWidth.gapWidths.join("/")} px), widest numbered content ${M.tooltipWidth.widestContentPx} px (${M.tooltipWidth.widestAt.join(", ")})`);
  console.log(`tooltip lane: ${M.tooltipLane.pass ? "pass" : "FAIL"}; ${Object.entries(M.tooltipLane.pages).map(([k, L]) => `${k} top ${L.top} px, height ${L.height} px, scale starts at ${L.scaleStartsAtPx} px, smallest gap to the highest mark ${L.smallestGapToHighestMarkPx} px, x error ${L.maxXErrPx} px, connector to box ${L.connector.maxGapToBoxPx} px and to mark ${L.connector.maxGapToMarkPx} px`).join("; ")}`);
  console.log(`follow: ${Object.entries(M.follow).map(([k, v]) => `${k} ${v.pass}`).join(", ")}; roll: ar ${M.roll.ar.pass}, en ${M.roll.en.pass}; delayed ${M.delayed.pass}; rail ${M.rail.pass}`);
}

const lights = {};
let calibration = null;
let tunerCheck = null;
const motionLog = {};
try {
  if (!MOTION_ONLY) {
  for (const frame of FRAMES) {
    const { context, page, errors } = await open(frame.q);
    await act(page, frame);
    await page.waitForTimeout(200);
    const result = await inspect(page);
    await shot(page, frame.name, { fullPage: Boolean(frame.full) }, recapture(frame.q, {}, async (p) => { await act(p, frame); await p.waitForTimeout(200); }, { fullPage: Boolean(frame.full) }));
    record(frame.name, { url: `index.html?${frame.q}`, viewport: "1440x900", deviceScaleFactor: 1, fullPage: Boolean(frame.full), act: frame.act ?? null }, result, errors);
    await context.close();
  }

  // Per preset: the AR frame, 2x crops of both lit cards, and light-only 1x captures that are measured.
  for (const id of PRESETS) {
    const q = `lang=ar&tuner=0&preset=${id}`;
    {
      const { context, page, errors } = await open(q);
      const result = await inspect(page);
      await shot(page, `preset-${id}-ar-1440x900`, {}, recapture(q, {}));
      const applied = await page.evaluate(() => Object.fromEntries(["--now-int", "--now-core", "--now-disc-size", "--now-disc-x", "--now-soft", "--now-rim", "--now-far", "--now-end", "--chart-int", "--chart-fade", "--chart-side", "--chart-balance", "--chart-soft", "--wash-int", "--grain-o"].map((v) => [v, getComputedStyle(document.documentElement).getPropertyValue(v).trim()])));
      record(`preset-${id}-ar-1440x900`, { url: `index.html?${q}`, viewport: "1440x900", deviceScaleFactor: 1, appliedLightSettings: applied }, result, errors);
      await page.addStyleTag({ content: HIDE_CONTENT });
      await page.waitForTimeout(80);
      const hidden = async (p) => { await p.addStyleTag({ content: HIDE_CONTENT }); await p.waitForTimeout(80); };
      const now = await shot(page, `preset-${id}-nowcard-light`, { clip: clipOf(await rectOf(page, "#card-now")) }, recapture(q, {}, hidden, async (p) => ({ clip: clipOf(await rectOf(p, "#card-now")) })));
      const chart = await shot(page, `preset-${id}-chart-light`, { clip: clipOf(await rectOf(page, ".chart")) }, recapture(q, {}, hidden, async (p) => ({ clip: clipOf(await rectOf(p, ".chart")) })));
      lights[id] = { settings: applied, chart: await measure(chart, "chart", true), insideNow: await measure(now, "now", true) };
      await context.close();
    }
    {
      const { context, page, errors } = await open(q, { scale: 2 });
      for (const [sel, part] of [["#card-now", "nowcard"], [".chart", "chart"]]) {
        const box = await rectOf(page, sel);
        await shot(page, `preset-${id}-${part}-2x`, { clip: clipOf(box) }, recapture(q, { scale: 2 }, null, async (p) => ({ clip: clipOf(await rectOf(p, sel)) })));
      }
      if (id === "recommended") {
        log.push({ frame: "levels", levelsNowcard: await levels(join(OUT, "preset-recommended-nowcard-2x.png"), join(OUT, "levels-nowcard.png")), levelsChart: await levels(join(OUT, "preset-recommended-chart-2x.png"), join(OUT, "levels-chart.png")), errors });
        await hashFile("levels-nowcard", "preset-recommended-nowcard-2x");
        await hashFile("levels-chart", "preset-recommended-chart-2x");
      }
      await context.close();
    }
    const m = lights[id];
    console.log(`light ${id.padEnd(12)} chart dark/haze/lit ${m.chart.pureDarkPct}/${m.chart.hazePct}/${m.chart.litPct} fade ${m.chart.fadeToBlackPctOfHeight.min}-${m.chart.fadeToBlackPctOfHeight.max}% corners ${m.chart.lowerCornerPeakL.inlineEnd}/${m.chart.lowerCornerPeakL.inlineStart} | now peak ${m.insideNow.peakL}`);
  }

  // LTR mirror of the Inside now card, 2x (Recommended).
  {
    const { context, page, errors } = await open("lang=en&tuner=0", { scale: 2 });
    const box = await rectOf(page, "#card-now");
    await shot(page, "daily-en-nowcard-2x", { clip: clipOf(box) }, recapture("lang=en&tuner=0", { scale: 2 }, null, async (p) => ({ clip: clipOf(await rectOf(p, "#card-now")) })));
    await context.close();
    const l = await open("lang=en&tuner=0");
    await l.page.addStyleTag({ content: HIDE_CONTENT });
    await l.page.waitForTimeout(80);
    const png = await l.page.screenshot({ clip: clipOf(await rectOf(l.page, "#card-now")) });
    lights.recommendedLtrInsideNow = await measure(png, "now", false);
    log.push({ frame: "daily-en-nowcard-2x", viewport: "1440x900", deviceScaleFactor: 2, clip: box, errors: [...errors, ...l.errors] });
    await l.context.close();
  }

  // Calibration: light-study recipe A rendered read-only from file://, content hidden, same measurement.
  {
    const { context, page, errors } = await newPage();
    await page.goto(`${LIGHT_STUDY_URL}?recipe=a`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({ content: HIDE_CONTENT });
    await page.waitForTimeout(150);
    const png = await page.screenshot({ clip: clipOf(await rectOf(page, ".lit-bottom")) });
    calibration = { lightStudyA: { source: "../light-study/index.html?recipe=a (read-only, content hidden)", chart: await measure(png, "chart", true), errors } };
    await context.close();
  }
  } // end of the static part (skipped with --motion-only)

  // The tuner from file:// (no server): change one control by keyboard, confirm the custom property and the
  // rendered pixels change, Copy values gives valid JSON (clipboard path and textarea fallback), the value
  // persists across a reload, ?tuner=0 shows no tuner and ignores the stored value, and Reset restores it.
  {
    const { context, page, errors } = await newPage();
    await context.addInitScript(() => {
      window.__copied = null;
      const mode = () => sessionStorage.getItem("clipMode") || "ok";
      Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: (t) => (mode() === "fail" ? Promise.reject(new Error("blocked")) : ((window.__copied = t), Promise.resolve())) } });
    });
    await page.goto(`${FILE_URL}?lang=ar`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => window.__eclipse?.ready === true);
    const cssVar = (v) => page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), v);
    const cardClip = clipOf(await rectOf(page, "#card-now"));
    const shotCard = () => page.screenshot({ clip: cardClip });
    const t = { url: `${FILE_URL}?lang=ar`, protocol: await page.evaluate(() => location.protocol) };
    t.collapsedByDefault = await page.evaluate(() => ({ toggle: Boolean(document.querySelector(".tuner-toggle")), expanded: document.querySelector(".tuner-toggle").getAttribute("aria-expanded"), panelHidden: document.getElementById("tuner-panel").hidden }));
    t.toggleRect = await rectOf(page, ".tuner-toggle");
    t.before = { "--now-int": await cssVar("--now-int") };
    const pngBefore = await shotCard();
    await page.click(".tuner-toggle");
    await page.focus("#t-nowInt");
    for (let i = 0; i < 6; i++) await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(80);
    t.after = { "--now-int": await cssVar("--now-int"), inputValue: await page.inputValue("#t-nowInt"), output: await page.textContent("#tuner-panel output[for='t-nowInt']") };
    const pngAfter = await shotCard();
    t.pixelsChanged = await (async () => {
      const { context: c2, page: p2 } = await newPage({ width: 400, height: 300 });
      const diff = await p2.evaluate(async ([a, b]) => {
        const load = async (s) => { const i = new Image(); i.src = s; await i.decode(); const c = document.createElement("canvas"); c.width = i.naturalWidth; c.height = i.naturalHeight; const g = c.getContext("2d"); g.drawImage(i, 0, 0); return g.getImageData(0, 0, c.width, c.height).data; };
        const A = await load(a), B = await load(b);
        let changed = 0, sum = 0;
        for (let i = 0; i < A.length; i += 4) { const d = Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]); sum += d; if (d > 6) changed++; }
        return { changedPixels: changed, meanAbsRgbDiff: Math.round((sum / (A.length / 4)) * 100) / 100 };
      }, [`data:image/png;base64,${pngBefore.toString("base64")}`, `data:image/png;base64,${pngAfter.toString("base64")}`]);
      await c2.close();
      return diff;
    })();
    await page.click("text=نسخ القيم");
    await page.waitForTimeout(80);
    const copied = await page.evaluate(() => window.__copied);
    try { const j = JSON.parse(copied); t.copyClipboard = { validJson: true, preset: j.preset, nowInt: j.values.nowInt, cssNowInt: j.css["--now-int"], keys: Object.keys(j.values).length, status: await page.textContent(".tuner-status") }; } catch (e) { t.copyClipboard = { validJson: false, error: String(e) }; }
    await page.evaluate(() => sessionStorage.setItem("clipMode", "fail"));
    await page.click("text=نسخ القيم");
    await page.waitForTimeout(80);
    const fb = await page.evaluate(() => { const ta = document.querySelector(".tuner-json"); return { visible: !ta.hidden, value: ta.value, status: document.querySelector(".tuner-status").textContent, focused: document.activeElement === ta }; });
    try { JSON.parse(fb.value); t.copyFallback = { textareaVisible: fb.visible, validJson: true, focused: fb.focused, status: fb.status }; } catch (e) { t.copyFallback = { textareaVisible: fb.visible, validJson: false, error: String(e) }; }
    await page.keyboard.press("Escape");
    t.escapeCloses = await page.evaluate(() => ({ panelHidden: document.getElementById("tuner-panel").hidden, focusOnToggle: document.activeElement === document.querySelector(".tuner-toggle") }));
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForFunction(() => window.__eclipse?.ready === true);
    t.persistedAfterReload = { "--now-int": await cssVar("--now-int"), tunerValue: await page.evaluate(() => window.__tuner.values.nowInt) };
    await page.goto(`${FILE_URL}?lang=ar&tuner=0`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => window.__eclipse?.ready === true);
    t.tunerOff = { tunerElement: await page.evaluate(() => Boolean(document.querySelector(".tuner"))), "--now-int": await cssVar("--now-int") };
    await page.goto(`${FILE_URL}?lang=ar`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => window.__eclipse?.ready === true);
    await page.click(".tuner-toggle");
    await page.click("text=إعادة المقترح");
    t.reset = { "--now-int": await cssVar("--now-int"), preset: await page.evaluate(() => window.__tuner.snapshot().preset), inlineOverrides: await page.evaluate(() => document.documentElement.getAttribute("style") || "") };
    // Presets: v2 applies its own values; Recommended returns to the stylesheet's defaults.
    await page.click("button[data-preset='v2']");
    t.presetV2 = { preset: await page.evaluate(() => window.__tuner.snapshot().preset), "--now-int": await cssVar("--now-int"), expected: String(await page.evaluate(() => window.__tuner.presets.v2.nowInt)) };
    await page.click("button[data-preset='recommended']");
    t.presetRecommended = { preset: await page.evaluate(() => window.__tuner.snapshot().preset), "--now-int": await cssVar("--now-int"), inlineOverrides: await page.evaluate(() => document.documentElement.getAttribute("style") || "") };
    // Drag: the toggle and the panel move together by the pointer's distance; a drag never presses the toggle; Home
    // on the grip returns the unit to its original spot.
    {
      await page.keyboard.press("Escape");
      const r0 = await rectOf(page, ".tuner-toggle");
      const open0 = await page.evaluate(() => document.querySelector(".tuner-toggle").getAttribute("aria-expanded"));
      await page.mouse.move(r0.x + r0.width / 2, r0.y + r0.height / 2);
      await page.mouse.down();
      await page.mouse.move(r0.x + r0.width / 2 - 200, r0.y + r0.height / 2 + 120, { steps: 8 });
      await page.mouse.up();
      await page.waitForTimeout(60);
      const r1 = await rectOf(page, ".tuner-toggle");
      const open1 = await page.evaluate(() => document.querySelector(".tuner-toggle").getAttribute("aria-expanded"));
      const stored = await page.evaluate(() => localStorage.getItem("fitway.eclipse.v3.tuner-pos"));
      await page.click(".tuner-toggle");
      await page.focus(".tuner-grip");
      await page.keyboard.press("Home");
      await page.waitForTimeout(60);
      const r2 = await rectOf(page, ".tuner-toggle"); // the panel stays open for the Motion group below
      t.drag = { moved: { dx: Math.round(r1.x - r0.x), dy: Math.round(r1.y - r0.y) }, expanded: [open0, open1], storedPosition: stored, homeReturns: Math.abs(r2.x - r0.x) < 1 && Math.abs(r2.y - r0.y) < 1 };
      t.drag.pass = Math.abs(t.drag.moved.dx + 200) <= 1 && Math.abs(t.drag.moved.dy - 120) <= 1 && open0 === open1 && Boolean(stored) && t.drag.homeReturns;
    }
    // The Motion group (Round 6): "New reading", "Reset readings", the crowd-level buttons and the Motion switch; no
    // "Replay load", pointer-follow, "switch on at load" or crowd-light controls remain. This context has reduced
    // motion, so the switch is disabled with a note and every change is instant. The switch's stored choice lives in
    // its own key, persists across a reload and is ignored with ?tuner=0.
    {
      const m = {};
      m.defaults = await page.evaluate(() => window.__eclipse.motion.defaults);
      m.group = await page.evaluate(() => ({ present: Boolean(document.querySelector(".tuner-motion")), switches: [...document.querySelectorAll(".tuner-motion input[type=checkbox]")].map((b) => ({ id: b.id, checked: b.checked, disabled: b.disabled })), buttons: [...document.querySelectorAll(".tuner-motion button")].map((b) => b.textContent.trim()), note: document.querySelector(".tuner-motion .t-note")?.textContent || "" }));
      // Round 5's "Replay load" stays gone; Round 7 step 3's "Replay intro" is the first-open intro's own control.
      m.noObsoleteControls = !m.group.buttons.some((b) => /Replay load|إعادة حركة/.test(b)) && m.group.switches.length === 1;
      m.introControls = await page.evaluate(() => ({ speed: document.getElementById("t-mo-intro")?.value, out: document.querySelector("output[for=t-mo-intro]")?.textContent, replay: document.getElementById("t-mo-replay")?.textContent.trim(), replayDisabledWithReducedMotion: document.getElementById("t-mo-replay")?.disabled }));
      const before = await page.evaluate(() => window.__eclipse.figures);
      await page.click("text=قراءة جديدة");
      await page.waitForTimeout(80);
      const after = await page.evaluate(() => window.__eclipse.figures);
      m.newReading = { lastBefore: before.last, lastAfter: after.last, entriesBefore: before.entries, entriesAfter: after.entries, statusTime: await page.evaluate(() => document.querySelector("#status bdi").textContent), latestAfter: await page.evaluate(() => window.__eclipse.motion.latest), tunerStatus: await page.textContent(".t-latest") };
      await page.click("text=مستوى أدنى");
      await page.waitForTimeout(60);
      m.levelDown = { value: await page.textContent("#now-v"), level: await page.evaluate(() => document.querySelector("#now-foot .level").textContent), tunerStatus: await page.textContent(".t-latest"), say: await page.textContent("#live-say") };
      await page.click("text=مستوى أعلى");
      await page.waitForTimeout(60);
      m.levelUp = { value: await page.textContent("#now-v"), level: await page.evaluate(() => document.querySelector("#now-foot .level").textContent) };
      await page.evaluate(() => window.__eclipse.motion.set({ motion: false }));
      m.stored = await page.evaluate(() => ({ motion: localStorage.getItem("fitway.eclipse.v3.motion"), lightsKeyStillSeparate: localStorage.getItem("fitway.eclipse.v3.lights") !== null }));
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForFunction(() => window.__eclipse?.ready === true);
      m.persistedAfterReload = await page.evaluate(() => ({ motion: window.__eclipse.motion.options.motion, dayRestartsAt: window.__eclipse.figures.last }));
      await page.goto(`${FILE_URL}?lang=ar&tuner=0`, { waitUntil: "networkidle" });
      await page.waitForFunction(() => window.__eclipse?.ready === true);
      m.tunerOffIgnoresStored = await page.evaluate(() => window.__eclipse.motion.options.motion === window.__eclipse.motion.defaults.motion);
      await page.evaluate(() => localStorage.removeItem("fitway.eclipse.v3.motion"));
      m.pass = m.group.present && m.noObsoleteControls && m.group.switches[0]?.id === "t-mo-motion" && m.group.switches[0]?.disabled === true && Boolean(m.group.note) &&
        m.introControls.speed === "1" && /Replay intro/.test(m.introControls.replay || "") && m.introControls.replayDisabledWithReducedMotion === true &&
        m.newReading.lastAfter === m.newReading.lastBefore + 1 && m.newReading.statusTime === m.newReading.latestAfter &&
        m.levelDown.value === "48" && /متوسط/.test(m.levelDown.level) && /48/.test(m.levelDown.say) && m.levelUp.value === "49" && /مزدحم/.test(m.levelUp.level) &&
        JSON.parse(m.stored.motion || "{}").motion === false && m.stored.lightsKeyStillSeparate && m.persistedAfterReload.motion === false && m.tunerOffIgnoresStored;
      t.motionGroup = m;
    }
    t.errors = errors;
    // Expectations follow the stylesheet's default (the Recommended values change when the user's tuning is
    // adopted): six ArrowDown steps of 0.05 lower --now-int by 0.3 from whatever the default is.
    const def = t.before["--now-int"];
    const exp = String(Math.round((Number(def) - 0.3) * 100) / 100);
    t.expected = { default: def, afterSixSteps: exp };
    t.pass = t.collapsedByDefault.expanded === "false" && t.collapsedByDefault.panelHidden && def !== "" && t.after["--now-int"] === exp && t.pixelsChanged.changedPixels > 100 &&
      t.copyClipboard.validJson && t.copyClipboard.nowInt === Number(exp) && t.copyFallback.validJson && t.copyFallback.textareaVisible && t.escapeCloses.panelHidden &&
      t.persistedAfterReload["--now-int"] === exp && !t.tunerOff.tunerElement && t.tunerOff["--now-int"] === def && t.reset["--now-int"] === def && t.reset.preset === "recommended" &&
      t.presetV2.preset === "v2" && t.presetV2["--now-int"] === t.presetV2.expected && t.presetRecommended.preset === "recommended" && t.presetRecommended["--now-int"] === def && t.drag.pass && errors.length === 0;
    await context.close();
    // With motion (no reduced motion), still from file://: the tuner's crowd-level buttons roll the Inside now number
    // (transform only) and change the bars; nothing on the page ever moves a light.
    {
      const { context: c3, page: p3, errors: e3 } = await newPage({ motion: true });
      await p3.goto(`${FILE_URL}?lang=ar`, { waitUntil: "networkidle" });
      await p3.waitForFunction(() => window.__eclipse?.ready === true);
      await introSettled(p3); // a new tab: the first-open intro plays first (from file:// too)
      const introFromFile = await p3.evaluate(() => ({ played: window.__eclipse.intro.played, yieldedBy: window.__eclipse.intro.yieldedBy }));
      await p3.click(".tuner-toggle");
      await p3.click("text=مستوى أدنى");
      const anims = await listAnimations(p3);
      const r = { introFromFile, motionOn: await p3.evaluate(() => window.__eclipse.motion.on), animations: anims.map((a) => `${a.target} ${a.properties.join("+")}`), lightAnimations: anims.filter((a) => /lamp|wash/.test(a.target)).length, glyphOpacity: glyphOpacity(anims).length };
      await p3.waitForTimeout(500);
      r.value = await p3.textContent("#now-v");
      r.errors = e3;
      r.pass = r.motionOn && anims.some((a) => /roll-new/.test(a.target)) && anims.some((a) => /lv-fill/.test(a.target)) && r.lightAnimations === 0 && r.glyphOpacity === 0 && r.value === "48" && e3.length === 0;
      t.crowdFromFile = r;
      await c3.close();
    }
    tunerCheck = t;
    console.log(`tuner file:// check: ${t.pass ? "pass" : "FAIL"} (--now-int ${t.before["--now-int"]} -> ${t.after["--now-int"]}, changed px ${t.pixelsChanged.changedPixels}, copy ${t.copyClipboard.validJson}/${t.copyFallback.validJson}, presets ${t.presetV2.preset}/${t.presetRecommended.preset}, drag ${t.drag.pass}); motion group: ${t.motionGroup.pass ? "pass" : "FAIL"}; crowd change from file:// with motion: ${t.crowdFromFile.pass ? "pass" : "FAIL"}`);
  }

  if (!MOTION_ONLY) {
    for (const frame of OVERFLOW_ONLY) {
      const { context, page, errors } = await open(frame.q, { width: 1280, height: 800 });
      const result = await inspect(page);
      record(frame.name, { url: `index.html?${frame.q}`, viewport: "1280x800", screenshot: false }, result, errors);
      await context.close();
    }
  }

  await captureMotion();
} finally {
  await browser.close();
  server.close();
}

const targets = {
  chart: "pure dark >= ~75%, dim haze <= 15%, light fades to black within ~15-35% of the card height (NEXT-DIRECTION-BRIEF Round 5 section 2)",
  insideNowReference: "reference light 4 at y=0.98: far corner 0.45, middle 0.19-0.30, lit corner 0.74-0.79; at y=0.95 the middle 0.15 (coordinator's measurement)",
  markerToLine: "<= 0.5 px at every stop (NEXT-DIRECTION-BRIEF Round 6 decision 5, coordinator's target)",
};
const allTrue = (o, k) => Object.values(o).every((v) => v[k] === true || (v.expectedToChange && (!v.outsidePlot || v.outsidePlot.identical)));
const motionSummary = {
  method: "Pre-motion frames: evidence/pre-motion-hashes.json (SHA-256 of the v3 frames before motion). The capture is byte-deterministic, so equal hashes mean identical pixels.",
  staticFramesIdentical: MOTION_ONLY ? "not run (--motion-only)" : allTrue(identity.staticFrames, "identical"),
  motionOffFramesIdentical: allTrue(identity.motionOffFrames, "identical"),
  introEndsAtStillFrame: allTrue(identity.firstOpen, "endIdenticalToStill"),
  introEndsAtMotionOffDom: allTrue(identity.firstOpen, "domEqualsMotionOff"),
  onlyThePulseRunsAfterIntro: allTrue(identity.firstOpen, "onlyThePulseAfter"),
  reloadHasNoIntroAndIsStillFrame: allTrue(identity.reload, "pass"),
  liveUpdateEndsAtCanonical: identity.liveUpdateEndsAtCanonical,
  // The follow-up round after step 3: each exact-hash comparison, with its attempts.
  recaptures: {
    rule: "a frame whose hash differs from its expected value is captured again, the same way, in a fresh context; when the expected value is a reference rendered in this run, that reference is rendered again too, in its own fresh context, and the new pair is compared; it counts as a difference only if it differs in that next attempt too (no tolerance); every attempt logs its expected and actual hash",
    plant: PLANT,
    // The negative control's reach: comparisons whose first attempt was planted and differed.
    plantReached: PLANT ? recaptures.filter((v) => v.perAttempt[0].planted && !v.perAttempt[0].match).length : null,
    plantNotReached: PLANT ? recaptures.filter((v) => !(v.perAttempt[0].planted && !v.perAttempt[0].match)).map((v) => v.label) : null,
    sameRunReferences: recaptures.filter((v) => v.reference !== "committed").map((v) => v.label),
    comparisons: recaptures.length,
    firstAttempt: recaptures.filter((v) => v.attempts === 1 && v.identical).length,
    noise: recaptures.filter((v) => v.noise).map((v) => v.label),
    differedTwice: recaptures.filter((v) => v.differedTwice).map((v) => v.label),
    differedWithoutRecapture: recaptures.filter((v) => !v.identical && v.attempts === 1).map((v) => v.label),
    entries: recaptures,
  },
  tooltipWidth: motionLog.tooltipWidth ?? null,
  tooltipLane: motionLog.tooltipLane ?? null,
  markerMaxDistancePx: motionLog.chart ? Object.fromEntries(Object.entries(motionLog.chart).map(([k, v]) => [k, v.maxDistancePx])) : null,
  identity,
  ...motionLog,
};
if (MOTION_ONLY) console.log(JSON.stringify({ ...motionSummary, identity: undefined, spec: undefined, chart: undefined }, null, 1));
else await writeFile(join(OUT, "capture-log.json"), `${JSON.stringify({ capturedAt: new Date().toISOString(), port: PORT, motion: motionSummary, lightMeasurement: { method: "OKLab L relative to the card's own base on light-only 1x captures (content hidden); see capture.mjs measure()", targets, presets: lights, calibration }, tunerFileCheck: tunerCheck, frames: log }, null, 2)}\n`);
const bad = log.filter((e) => e.fontsOk === false || e.overflowX > 0 || (e.overflowY > 0 && !e.fullPage) || (e.spill && e.spill.length) || (e.errors && e.errors.length) || e.easternDigits || e.enDashInArabic || (e.checks && (e.checks.overshoot || !e.checks.withinAverage || !e.checks.zeroKept || !e.checks.lineStopsAtGap || !e.checks.lineEndsAtLast || Math.abs(e.checks.crestMinusPeakMinutes) > 5)));
console.log(bad.length ? `\n${bad.length} frame(s) need attention: ${bad.map((e) => e.frame).join(", ")}` : "\nAll frames: no overflow or spill, fonts loaded, no errors, Western digits only, line checks pass.");
if (!tunerCheck?.pass) console.log("Tuner file:// check did not pass; see tunerFileCheck in the log.");
if (!tunerCheck?.motionGroup?.pass) console.log("Tuner Motion group check did not pass; see tunerFileCheck.motionGroup.");
if (!tunerCheck?.crowdFromFile?.pass) console.log("Tuner crowd change from file:// with motion did not pass; see tunerFileCheck.crowdFromFile.");
// The static guard: with reduced motion (the still frames) and with ?motion=off, every frame except the ones that change
// by design must equal its pre-motion frame. A difference fails the run (exit code 1).
// The lane round: a frame the lane changes must still equal 8ae88f3 outside the plot element (and must have been compared).
const changed = Object.entries(identity.staticFrames).filter(([k, v]) => (!v.identical && !v.expectedToChange) || (v.expectedToChange && ((v.outsidePlot && !v.outsidePlot.identical) || (OUTSIDE_PLOT[k] && !v.outsidePlot)))).map(([k]) => k);
const changedOff = Object.entries(identity.motionOffFrames).filter(([, v]) => !v.identical).map(([k]) => k);
// Round 7 step 3: the first-paint rule is now the intro's. A first open plays it and ends exactly at the still frame
// (pixels and DOM, only the pulse running after it); a reload in the same tab has no intro and is the still frame.
const firstPaintBad = [
  ...Object.entries(identity.firstOpen).filter(([, v]) => !v.pass).map(([k]) => `${k} (first open)`),
  ...Object.entries(identity.reload).filter(([, v]) => !v.pass).map(([k]) => `${k} (reload)`),
];
const compared = Object.values(identity.staticFrames);
if (!MOTION_ONLY) console.log(changed.length ? `STATIC GUARD FAILED (reduced motion): ${changed.join(", ")}` : `Static guard, reduced motion: ${compared.filter((v) => v.identical).length} of ${compared.length} pre-motion frames identical; the other ${compared.filter((v) => !v.identical).length} change by design (${Object.keys(EXPECTED_TO_CHANGE).join(", ")}); of those, ${compared.filter((v) => v.outsidePlot?.identical).length} of ${compared.filter((v) => v.outsidePlot).length} are identical to 8ae88f3 everywhere outside the plot element.`);
console.log(changedOff.length ? `STATIC GUARD FAILED (?motion=off): ${changedOff.join(", ")}` : `Static guard, ?motion=off: all ${Object.keys(identity.motionOffFrames).length} frames identical (pre-motion frame, or this run's still frame for the frames that change by design).`);
console.log(firstPaintBad.length ? `INTRO END STATE OR RELOAD FAILED: ${firstPaintBad.join(", ")}` : `First open with motion on: the intro plays and ends identical to the still frame, only the live pulse runs after it; a same-tab reload has no intro and is the still frame (${Object.keys(identity.firstOpen).length} pages each).`);
console.log(`Recaptures: ${recaptures.length} exact comparisons; ${recaptures.filter((v) => v.attempts === 1 && v.identical).length} matched at once; noise (differed once, then matched) ${recaptures.filter((v) => v.noise).length}${recaptures.some((v) => v.noise) ? ` (${recaptures.filter((v) => v.noise).map((v) => v.label).join(", ")})` : ""}; differed twice ${recaptures.filter((v) => v.differedTwice).length}${recaptures.some((v) => v.differedTwice) ? ` (${recaptures.filter((v) => v.differedTwice).map((v) => v.label).join(", ")})` : ""}.`);
const round6 = motionLog.chart ? [motionLog.tooltipWidth?.pass, motionLog.tooltipLane?.pass, ...Object.values(motionLog.chart).map((v) => v.pass), ...Object.values(motionLog.follow).map((v) => v.pass), motionLog.marker?.pass, motionLog.roll.ar.pass, motionLog.roll.en.pass, motionLog.delayed.pass, motionLog.rail.pass, identity.liveUpdateEndsAtCanonical?.domEqual] : [false];
if (round6.some((v) => !v)) console.log("A Round 6 or Round 7 check did not pass; see motion.chart, follow, marker, roll, delayed, rail and liveUpdateEndsAtCanonical in the log.");
const introOk = Boolean(motionLog.intro?.pass);
if (!introOk) console.log("An intro check did not pass; see motion.intro (slowFonts, whenItPlays, yields, held) and motion.identity.firstOpen / reload in the log.");
if (changed.length || changedOff.length || firstPaintBad.length || round6.some((v) => !v) || !introOk || !tunerCheck?.pass || !tunerCheck?.motionGroup?.pass || !tunerCheck?.crowdFromFile?.pass || bad.length) process.exitCode = 1;
