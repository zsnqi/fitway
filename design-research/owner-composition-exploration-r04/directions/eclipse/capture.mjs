// Eclipse capture (v3 lights, Round 6 motion). Serves this folder on 127.0.0.1:3173 and records the frames with
// Playwright chromium (fresh context per frame, so no stored tuning; deviceScaleFactor 1 unless a 2x crop;
// reducedMotion "reduce" for the still frames). Frames use ?tuner=0 unless they are about the tuner. Preset frames use
// ?tuner=0&preset=<id>.
// It also measures the lights (OKLab L relative to each card's own dark base, on light-only 1x captures with the
// card content hidden), renders ../light-study recipe A read-only as a calibration, and checks the tuner from file://
// (keyboard, presets, drag, copy, reset, ?tuner=0, the Motion group, and a crowd-level change with motion on).
// Static guard: the still frames (reduced motion) and the ?motion=off frames must equal the pre-motion frames
// (evidence/pre-motion-hashes.json), except daily-ar-1440x900-tuner-open and daily-ar-1440x900-hover, which change by
// design; any other difference sets exit code 1.
// Round 6 checks (motion part, reducedMotion "no-preference" unless noted): the first settled paint with motion on
// equals the still frame and only the live pulse runs on load; the chart's stops (half hours, the peak, the latest
// reading, the missing span), the marker's distance to what it describes at every stop (AR and EN, against the SVG
// path's own geometry), pointer snapping, keyboard stepping, the glide staying on the curve, the digit roll (direction,
// transform only, never opacity on a glyph), the live region, a crowd-level change, the live tail, the delayed state
// and the rail. Held 2x motion frames and a contact sheet are written as motion-*.png. Any failed check sets exit 1.
// Round 7 (the marker's two forms, A the lit bead and B the hollow ring): hover stills for both (-hover and -hover-b,
// AR and EN), marker-compare-ar-3x.png (both forms side by side at the line, the peak, the latest reading live and
// delayed, still ahead, the missing span, and still ahead without history), the chart checks and the held glide frames
// for both forms (nothing drawn above the point), and the switch (?marker=a|b, the tuner's buttons, its storage key).
// Run from PowerShell at the worktree root:
//   node design-research/owner-composition-exploration-r04/directions/eclipse/capture.mjs
// Add --motion-only to record only the motion part (the log is then printed, not written).
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, extname, join, normalize, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "evidence");
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
  { name: "daily-ar-1440x900-hover", q: "lang=ar&tuner=0", act: "hover-peak" },
  { name: "daily-en-1440x900-hover", q: "lang=en&tuner=0", act: "hover-peak" },
  // Round 7: marker form B (the hover frames above are form A, the default).
  { name: "daily-ar-1440x900-hover-b", q: "lang=ar&tuner=0&marker=b", act: "hover-peak" },
  { name: "daily-en-1440x900-hover-b", q: "lang=en&tuner=0&marker=b", act: "hover-peak" },
  { name: "daily-ar-1440x900-rail-open", q: "lang=ar&tuner=0", act: "rail-open" },
  { name: "daily-en-1440x900-rail-open", q: "lang=en&tuner=0", act: "rail-open" },
  { name: "daily-ar-1440x900-delayed", q: "lang=ar&state=delayed&tuner=0" },
  { name: "daily-ar-1440x900-nohistory", q: "lang=ar&state=nohistory&tuner=0" },
  { name: "daily-ar-1440x900-details", q: "lang=ar&tuner=0", act: "details", full: true },
  { name: "daily-ar-1440x900-tuner-open", q: "lang=ar", act: "tuner-open" },
];
// These change by design: the hover frame (Round 6: the tooltip's value is the line's own; Round 7: marker form A, the
// lit bead, replaces the reading sight) and the tuner (Round 6: its Motion group; Round 7: its Marker group). The
// English hover frame and the -hover-b frames have no pre-motion frame.
const EXPECTED_TO_CHANGE = {
  "daily-ar-1440x900-hover": "Round 7: marker form A (the lit bead) replaces the Round 6 reading sight; the value at the peak stop is unchanged (62)",
  "daily-ar-1440x900-tuner-open": "Round 6: the tuner's Motion group; Round 7: its Marker group (A / B)",
};
const MARKERS = ["a", "b"];
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
await mkdir(OUT, { recursive: true });
// v2 file names that v3 replaced with preset-recommended-* crops.
for (const stale of ["daily-ar-chart-2x.png", "daily-ar-nowcard-2x.png"]) await rm(join(OUT, stale), { force: true });
const browser = await chromium.launch();
const log = [];
const PRE = JSON.parse(await readFile(join(OUT, "pre-motion-hashes.json"), "utf8")).frames;
const sha = (buf) => createHash("sha256").update(buf).digest("hex");
const identity = { staticFrames: {}, motionOffFrames: {}, motionFirstPaint: {}, liveUpdateEndsAtCanonical: null };
const stillBuffers = {}; // this run's still frames, for frames with no pre-motion hash (or one that changes by design)

async function newPage({ width = 1440, height = 900, scale = 1, motion = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, reducedMotion: motion ? "no-preference" : "reduce", colorScheme: "dark" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });
  return { context, page, errors };
}
async function open(q, opts = {}, base = `${ORIGIN}/index.html`) {
  const { context, page, errors } = await newPage(opts);
  await page.goto(`${base}?${q}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__eclipse?.ready === true);
  await page.evaluate(() => document.fonts.ready);
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

// A written evidence frame; if it is one of the pre-motion frames, its bytes are compared with the recorded hash
// (the capture is byte-deterministic on this machine, so equal hashes mean identical pixels).
async function shot(page, name, opts = {}) {
  const buf = await page.screenshot({ path: join(OUT, `${name}.png`), ...opts });
  stillBuffers[name] = buf;
  if (PRE[name]) identity.staticFrames[name] = { identical: sha(buf) === PRE[name], ...(EXPECTED_TO_CHANGE[name] ? { expectedToChange: EXPECTED_TO_CHANGE[name] } : {}) };
  return buf;
}
async function hashFile(name) {
  if (PRE[name]) identity.staticFrames[name] = { identical: sha(await readFile(join(OUT, `${name}.png`))) === PRE[name] };
}

/* ------------------------------------------------------------------ motion helpers
 * Contexts with reducedMotion "no-preference". Animations are held at exact times through Document.getAnimations()
 * and the page's own seeks (window.__eclipse.chart.seekGlide, window.__eclipse.motion.seekLive), so every held frame
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

/* ------------------------------------------------------------------ Round 6 checks */
async function chartChecks(lang, state = "live", marker = "a") {
  const q = `lang=${lang}&state=${state}&tuner=0&marker=${marker}`;
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
  // The marker at every stop.
  res.perStop = [];
  for (const s of res.stops) {
    await page.evaluate((k) => window.__eclipse.chart.select(k), s.key);
    res.perStop.push({ key: s.key, kind: s.kind, time: s.time, value: s.value, ...(await measureMarker(page)) });
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
  res.wrongForm = res.perStop.filter((p) => p.marker && p.markerForm !== marker).map((p) => p.key);
  res.drawnAbovePoint = res.perStop.filter((p) => p.drawnAbovePoint).map((p) => p.key);
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
  res.pass = res.markerReported === marker && res.wrongForm.length === 0 && res.drawnAbovePoint.length === 0 && res.everyHalfHourAccountedFor &&res.gapStops === (f.last > 511 ? 1 : 0) && res.normalStopsInsideGap === 0 && res.lineSegments === 2 &&
    res.peakStop && res.peakStop.value === f.peak && res.latestStop && res.latestStop.m === f.last &&
    res.maxDistancePx.lineStops <= 0.5 && res.maxDistancePx.peak <= 0.5 && (res.maxDistancePx.usualLine == null || res.maxDistancePx.usualLine <= 0.5) && (res.maxDistancePx.gapMark == null || res.maxDistancePx.gapMark <= 0.5) &&
    res.maxCoreRenderedOffsetPx <= 0.5 && (state !== "nohistory" || res.perStop.filter((p) => p.kind === "ahead").every((p) => !p.marker)) &&
    res.pointer.every((p) => p.pass) && res.keyboard.pass && errors.length === 0;
  return res;
}

/* ------------------------------------------------------------------ Round 7: the marker's two forms
 * An enlarged side-by-side of A and B (reduced motion, 3x, tight crops, the tooltip hidden so the shapes can be
 * judged), and the switch: ?marker=a|b, the default, the tuner's buttons, its own storage key, ?tuner=0, and a
 * shown marker repainted in place when the form changes. */
async function markerChecks() {
  const out = {};
  const cols = [
    ["live", "h660", "on the line, 5:00 PM"],
    ["live", "peak", "the peak, 6:29 PM"],
    ["live", "latest", "the latest reading (live)"],
    ["delayed", "latest", "the latest reading (delayed, stale)"],
    ["live", "h900", "still ahead, 9:00 PM"],
    ["live", "gap", "the missing span"],
    ["nohistory", "h900", "still ahead, no history"],
  ];
  const cells = { a: [], b: [] };
  for (const mk of MARKERS) {
    for (const [state, key, caption] of cols) {
      const { context, page, errors } = await open(`lang=ar&state=${state}&tuner=0&marker=${mk}`, { scale: 3 });
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
      cells[mk].push({ buf: await page.screenshot({ clip: { x: Math.round(c.x - W / 2), y: Math.round(c.y - H / 2), width: W, height: H } }), caption, errors });
      await context.close();
    }
  }
  {
    const { context, page } = await newPage({ width: 2400, height: 200 });
    const row = (mk, label) => `<div class="lab">${label}</div>${cells[mk].map((c) => `<figure><img src="data:image/png;base64,${c.buf.toString("base64")}"><figcaption>${c.caption}</figcaption></figure>`).join("")}`;
    await page.setContent(`<!doctype html><html><head><style>
      body { margin: 0; padding: 18px; background: #161616; color: #cfcfcf; font: 15px/1.35 "Segoe UI", system-ui, sans-serif; width: max-content; }
      h1 { margin: 0 0 4px; font-size: 19px; font-weight: 600; color: #eee; } p { margin: 0 0 14px; color: #a9a9a9; max-width: 1900px; }
      .g { display: grid; grid-template-columns: 150px repeat(${cols.length}, max-content); gap: 14px 12px; align-items: start; }
      .lab { padding-top: 90px; font-size: 16px; color: #eee; } figure { margin: 0; } img { display: block; } figcaption { margin-top: 5px; max-width: 330px; }
    </style></head><body><h1>Chart marker: A and B side by side (Eclipse concept, synthetic data), Arabic, 3x</h1>
    <p>Tight crops of the real page at rest (reduced motion); the tooltip is hidden here so only the shapes show. Nothing is drawn above the point; the thin hairline below runs to the time axis.</p>
    <div class="g">${row("a", "A · lit bead")}${row("b", "B · hollow ring")}</div></body></html>`);
    await page.waitForTimeout(150);
    await page.screenshot({ path: join(OUT, "marker-compare-ar-3x.png"), fullPage: true });
    await context.close();
  }
  out.compareErrors = [...cells.a, ...cells.b].flatMap((c) => c.errors);
  // The switch, from file:// (the tuner's own world): default A; the tuner's B button sets the form, stores it in its
  // own key and repaints a shown marker in place; a reload keeps B; ?marker=a wins over the stored B and is not
  // stored; ?tuner=0 ignores the stored B.
  {
    const { context, page, errors } = await newPage();
    const ready = async (url) => { await page.goto(url, { waitUntil: "networkidle" }); await page.waitForFunction(() => window.__eclipse?.ready === true); };
    const form = () => page.evaluate(() => window.__eclipse.chart.marker);
    const shown = () => page.evaluate(() => document.querySelector("#sel .sg-mark")?.dataset.marker || null);
    await ready(`${FILE_URL}?lang=ar`);
    const s = { defaultForm: await form(), buttons: await page.evaluate(() => [...document.querySelectorAll(".tuner-marker button")].map((b) => ({ marker: b.dataset.marker, pressed: b.getAttribute("aria-pressed"), text: b.textContent.trim() }))), legend: await page.evaluate(() => document.querySelector(".tuner-marker legend")?.textContent.trim()) };
    await page.evaluate(() => window.__eclipse.chart.select("h660"));
    s.shownBefore = await shown();
    await page.click(".tuner-toggle");
    await page.click(".tuner-marker button[data-marker='b']");
    s.afterClick = { form: await form(), shown: await shown(), stillSelected: await page.evaluate(() => window.__eclipse.chart.selected), stored: await page.evaluate((k) => localStorage.getItem(k), await page.evaluate(() => window.__eclipse.chart.markerStore)), pressed: await page.evaluate(() => document.querySelector(".tuner-marker button[data-marker='b']").getAttribute("aria-pressed")) };
    await ready(`${FILE_URL}?lang=ar`);
    s.afterReload = await form();
    await ready(`${FILE_URL}?lang=ar&marker=a`);
    s.urlWins = { form: await form(), fromUrl: await page.evaluate(() => window.__eclipse.chart.markerFromUrl), storedStill: await page.evaluate(() => localStorage.getItem("fitway.eclipse.v3.marker")) };
    await ready(`${FILE_URL}?lang=ar&tuner=0`);
    s.tunerOffIgnoresStored = await form();
    await page.evaluate(() => localStorage.removeItem("fitway.eclipse.v3.marker"));
    s.errors = errors;
    s.pass = s.defaultForm === "a" && s.buttons.length === 2 && s.buttons[0].pressed === "true" && /Marker: A \/ B/.test(s.legend || "") && s.shownBefore === "a" &&
      s.afterClick.form === "b" && s.afterClick.shown === "b" && s.afterClick.stillSelected === "h660" && s.afterClick.stored === "b" && s.afterClick.pressed === "true" &&
      s.afterReload === "b" && s.urlWins.form === "a" && s.urlWins.fromUrl === "a" && s.urlWins.storedStill === "b" && s.tunerOffIgnoresStored === "a" && errors.length === 0;
    out.switch = s;
    await context.close();
  }
  out.pass = out.compareErrors.length === 0 && out.switch.pass;
  console.log(`marker: compare sheet written; switch ${out.switch.pass ? "pass" : "FAIL"}`);
  return out;
}

async function captureMotion() {
  const M = {};
  // Motion frames from earlier runs (other names and times) would no longer match: start clean.
  for (const f of await readdir(OUT)) if (/^motion-.*\.png$/.test(f)) await rm(join(OUT, f), { force: true });
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
    const identical = against === "pre-motion frame" ? sha(buf) === PRE[frame.name] : Boolean(still) && sha(buf) === sha(still);
    identity.motionOffFrames[frame.name] = { url: `index.html?${q}`, reducedMotion: "no-preference", against, identical, dataMotion: await page.evaluate(() => document.documentElement.dataset.motion), errors };
    await context.close();
  }

  // 2. Motion on: the first settled paint (fonts in, the live pulse hidden) equals the still frame; on load nothing
  //    runs but the live pulse (none at all while delayed); the DOM equals the ?motion=off DOM.
  for (const [name, q] of [["daily-ar-1440x900", "lang=ar&tuner=0"], ["daily-en-1440x900", "lang=en&tuner=0"], ["daily-ar-1440x900-delayed", "lang=ar&state=delayed&tuner=0"], ["daily-ar-1440x900-nohistory", "lang=ar&state=nohistory&tuner=0"]]) {
    const { context, page, errors } = await open(q, { motion: true });
    const onLoad = await listAnimations(page);
    const state = await page.evaluate(() => ({ dataMotion: document.documentElement.dataset.motion, pendingAttributes: ["intro", "lights"].filter((k) => k in document.documentElement.dataset), hiddenCards: [...document.querySelectorAll(".card, .lamp, .wash")].filter((n) => getComputedStyle(n).opacity !== "1" || getComputedStyle(n).visibility !== "visible").length, pulse: Boolean(document.querySelector(".ping.is-on")) }));
    const dom = await page.evaluate(() => { const c = document.querySelector(".page").cloneNode(true); c.querySelectorAll(".ping").forEach((n) => n.remove()); return c.outerHTML; });
    await page.addStyleTag({ content: HIDE_PULSE });
    await page.waitForTimeout(60);
    const noPulse = await page.screenshot();
    await context.close();
    const off = await open(`${q}&motion=off`, { motion: true });
    // The language link carries the page's own query, so ?motion=off appears in it; that is the only expected difference.
    const domOff = await off.page.evaluate(() => document.querySelector(".page").outerHTML.replaceAll("&amp;motion=off", ""));
    await off.context.close();
    const live = !q.includes("delayed");
    identity.motionFirstPaint[name] = {
      url: `index.html?${q}`, ...state, errors,
      animationsOnLoad: onLoad.map((a) => `${a.kind} on ${a.target}`),
      onlyThePulse: live ? onLoad.length === 1 && onLoad[0].kind === "css @keyframes ping" : onLoad.length === 0,
      identicalWithPulseHidden: sha(noPulse) === PRE[name],
      domEqualsMotionOff: dom === domOff,
    };
  }

  // 3. The chart: stops, the marker at every stop (AR and EN; delayed and no history in AR), pointer and keyboard.
  //    Round 7: both marker forms, A (lit bead) and B (hollow ring).
  M.chart = {};
  for (const mk of MARKERS) {
    const s = mk === "a" ? "" : "B";
    M.chart[`ar${s}`] = await chartChecks("ar", "live", mk);
    M.chart[`en${s}`] = await chartChecks("en", "live", mk);
    M.chart[`arDelayed${s}`] = await chartChecks("ar", "delayed", mk);
    M.chart[`arNoHistory${s}`] = await chartChecks("ar", "nohistory", mk);
    M.chart[`enDelayed${s}`] = await chartChecks("en", "delayed", mk);
    M.chart[`enNoHistory${s}`] = await chartChecks("en", "nohistory", mk);
  }

  // 3b. Round 7: the two marker forms side by side, and the switch.
  M.marker = await markerChecks();

  // 4. The glide stays on the curve: held at time fractions between two stops, the marker is on today's line (or on
  //    the peak's dotted drop, straight above the peak's minute); it is not a straight hop (its largest distance from
  //    the straight segment between the two stops). Held 2x frames are written.
  //    Round 7: both marker forms; the held frames for each (the glide itself is still Round 6's).
  const glide = {};
  for (const mk of MARKERS) {
    const cells = [];
    for (const lang of ["ar", "en"]) {
      const { context, page, errors } = await open(`lang=${lang}&tuner=0&marker=${mk}`, { motion: true, scale: 2 });
      await page.addStyleTag({ content: HIDE_PULSE });
      const runs = [];
      for (const [a, b, fracs] of [["h660", "h690", [0.04, 0.12, 0.3]], ["h720", "peak", [0.04, 0.12, 0.3]], ["h630", "h600", [0.12, 0.3]], ["h870", "h900", [0.2]]]) {
        await page.evaluate((k) => { window.__eclipse.chart.clear(); window.__eclipse.chart.select(k); }, a);
        const start = await measureMarker(page);
        await page.evaluate((k) => window.__eclipse.chart.select(k), b);
        const active = await page.evaluate(() => window.__eclipse.chart.glideActive);
        await page.evaluate(() => window.__eclipse.chart.seekGlide(1));
        const end = await measureMarker(page);
        // One fixed crop per run, centred between the two stops, so the frames read as one movement.
        const pr = await rectOf(page, "#plot");
        const crop = { x: Math.round(pr.x + (start.marker.x + end.marker.x) / 2 - 170), y: Math.round(pr.y + (start.marker.y + end.marker.y) / 2 - 120), width: 340, height: 230 };
        const shots = [];
        if (lang === "ar" && runs.length < 2) shots.push({ buf: await page.screenshot({ clip: crop }), caption: `${a} to ${b}: at ${b}` });
        const samples = [];
        for (const fr of fracs) {
          await page.evaluate((x) => window.__eclipse.chart.seekGlide(x), fr);
          const m = await measureMarker(page);
          samples.push({ timeFraction: fr, marker: m.marker, form: m.form, markerForm: m.markerForm, distancePx: m.distancePx, drawnAbovePoint: m.drawnAbovePoint });
          if (lang === "ar" && runs.length < 2) shots.unshift({ buf: await page.screenshot({ clip: crop }), caption: `${a} to ${b}: ${Math.round(fr * 100)}% of the time` });
        }
        // Order: the held moments first (earliest first), then the arrival.
        if (shots.length) cells.push(...shots.slice(0, -1).reverse(), shots[shots.length - 1]);
        await page.evaluate(() => window.__eclipse.motion.settle());
        // Largest distance of a sample from the straight segment start-end (a straight hop would be ~0).
        const seg = (p) => { const A = start.marker, B = end.marker; const vx = B.x - A.x, vy = B.y - A.y, L = Math.hypot(vx, vy) || 1; return Math.abs((p.x - A.x) * vy - (p.y - A.y) * vx) / L; };
        const offStraight = Math.max(...samples.map((s) => seg(s.marker)));
        runs.push({ from: a, to: b, glided: active, start: start.marker, end: end.marker, samples, maxDistanceFromTrackPx: Math.max(...samples.map((s) => (s.distancePx == null ? Infinity : s.distancePx)), 0), maxOffStraightSegmentPx: Math.round(offStraight * 100) / 100 });
      }
      // The latest reading into the future, and across the missing span: no drawn track joins them, so no glide.
      const cut = [];
      for (const [a, b] of [["latest", "h840"], ["h480", "gap"], ["gap", "h540"]]) {
        await page.evaluate((k) => { window.__eclipse.chart.clear(); window.__eclipse.chart.select(k); }, a);
        await page.evaluate((k) => window.__eclipse.chart.select(k), b);
        cut.push({ from: a, to: b, glided: await page.evaluate(() => window.__eclipse.chart.glideActive) });
        await page.evaluate(() => window.__eclipse.motion.settle());
      }
      const key = mk === "a" ? lang : `${lang}B`;
      glide[key] = { marker: mk, runs, cutsInstead: cut, errors, pass: runs.every((r) => r.glided && r.maxDistanceFromTrackPx <= 0.5 && r.samples.every((s) => s.markerForm === mk && !s.drawnAbovePoint)) && runs.filter((r) => r.to !== "peak").some((r) => r.maxOffStraightSegmentPx > 0.5) && cut.every((c) => !c.glided) && errors.length === 0 };
      await context.close();
    }
    const name = mk === "a" ? "A, the lit bead" : "B, the hollow ring";
    await sheet(`motion-glide-ar-${mk}-2x`, `Marker ${name}, gliding along the curve between stops (the Round 6 glide, kept for now), AR, 2x, held at a share of its 120-150 ms (quart-out, so most of the distance is covered early). One fixed crop per run.`, cells, 4);
  }
  M.glide = glide;

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
        rail.arOpenSettledIdenticalToStatic = sha(await page.screenshot()) === PRE["daily-ar-1440x900-rail-open"];
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
    </style></head><body><h1>Eclipse Round 6 motion, held frames (concept, synthetic data). The page itself has no load motion.</h1><div class="g">${items.map((i) => `<figure><img src="${i.src}"><figcaption>${i.caption}</figcaption></figure>`).join("")}</div></body></html>`);
    await page.waitForTimeout(200);
    await page.screenshot({ path: join(OUT, "motion-contact-sheet.png"), fullPage: true });
    await context.close();
  }

  M.frames = mshots.map((s) => `${s.name}.png`).concat(["motion-contact-sheet.png"]);
  Object.assign(motionLog, M);
  const c = M.chart;
  console.log(`motion: off-frames identical ${Object.values(identity.motionOffFrames).filter((v) => v.identical).length}/${Object.keys(identity.motionOffFrames).length}; first paint identical ${Object.values(identity.motionFirstPaint).filter((v) => v.identicalWithPulseHidden).length}/${Object.keys(identity.motionFirstPaint).length}, only the pulse on load ${Object.values(identity.motionFirstPaint).every((v) => v.onlyThePulse)}; live ends at canonical ${identity.liveUpdateEndsAtCanonical?.identicalWithPulseHidden} (DOM ${identity.liveUpdateEndsAtCanonical?.domEqual})`);
  for (const k of Object.keys(c)) console.log(`chart ${k}: ${c[k].pass ? "pass" : "FAIL"}; stops ${c[k].stops.length}; marker max distance line ${c[k].maxDistancePx.lineStops} px, peak ${c[k].maxDistancePx.peak}, usual ${c[k].maxDistancePx.usualLine}, gap ${c[k].maxDistancePx.gapMark}; pointer ${c[k].pointer.filter((p) => p.pass).length}/${c[k].pointer.length}; keyboard ${c[k].keyboard.pass}`);
  console.log(`glide: ${Object.entries(M.glide).map(([k, v]) => `${k} ${v.pass}`).join(", ")}; roll: ar ${M.roll.ar.pass}, en ${M.roll.en.pass}; delayed ${M.delayed.pass}; rail ${M.rail.pass}`);
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
    await shot(page, frame.name, { fullPage: Boolean(frame.full) });
    record(frame.name, { url: `index.html?${frame.q}`, viewport: "1440x900", deviceScaleFactor: 1, fullPage: Boolean(frame.full), act: frame.act ?? null }, result, errors);
    await context.close();
  }

  // Per preset: the AR frame, 2x crops of both lit cards, and light-only 1x captures that are measured.
  for (const id of PRESETS) {
    const q = `lang=ar&tuner=0&preset=${id}`;
    {
      const { context, page, errors } = await open(q);
      const result = await inspect(page);
      await shot(page, `preset-${id}-ar-1440x900`);
      const applied = await page.evaluate(() => Object.fromEntries(["--now-int", "--now-core", "--now-disc-size", "--now-disc-x", "--now-soft", "--now-rim", "--now-far", "--now-end", "--chart-int", "--chart-fade", "--chart-side", "--chart-balance", "--chart-soft", "--wash-int", "--grain-o"].map((v) => [v, getComputedStyle(document.documentElement).getPropertyValue(v).trim()])));
      record(`preset-${id}-ar-1440x900`, { url: `index.html?${q}`, viewport: "1440x900", deviceScaleFactor: 1, appliedLightSettings: applied }, result, errors);
      await page.addStyleTag({ content: HIDE_CONTENT });
      await page.waitForTimeout(80);
      const now = await shot(page, `preset-${id}-nowcard-light`, { clip: clipOf(await rectOf(page, "#card-now")) });
      const chart = await shot(page, `preset-${id}-chart-light`, { clip: clipOf(await rectOf(page, ".chart")) });
      lights[id] = { settings: applied, chart: await measure(chart, "chart", true), insideNow: await measure(now, "now", true) };
      await context.close();
    }
    {
      const { context, page, errors } = await open(q, { scale: 2 });
      for (const [sel, part] of [["#card-now", "nowcard"], [".chart", "chart"]]) {
        const box = await rectOf(page, sel);
        await shot(page, `preset-${id}-${part}-2x`, { clip: clipOf(box) });
      }
      if (id === "recommended") {
        log.push({ frame: "levels", levelsNowcard: await levels(join(OUT, "preset-recommended-nowcard-2x.png"), join(OUT, "levels-nowcard.png")), levelsChart: await levels(join(OUT, "preset-recommended-chart-2x.png"), join(OUT, "levels-chart.png")), errors });
        await hashFile("levels-nowcard");
        await hashFile("levels-chart");
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
    await shot(page, "daily-en-nowcard-2x", { clip: clipOf(box) });
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
      m.noObsoleteControls = !m.group.buttons.some((b) => /Replay|إعادة حركة/.test(b)) && m.group.switches.length === 1;
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
      await p3.click(".tuner-toggle");
      await p3.click("text=مستوى أدنى");
      const anims = await listAnimations(p3);
      const r = { motionOn: await p3.evaluate(() => window.__eclipse.motion.on), animations: anims.map((a) => `${a.target} ${a.properties.join("+")}`), lightAnimations: anims.filter((a) => /lamp|wash/.test(a.target)).length, glyphOpacity: glyphOpacity(anims).length };
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
const allTrue = (o, k) => Object.values(o).every((v) => v[k] === true || v.expectedToChange);
const motionSummary = {
  method: "Pre-motion frames: evidence/pre-motion-hashes.json (SHA-256 of the v3 frames before motion). The capture is byte-deterministic, so equal hashes mean identical pixels.",
  staticFramesIdentical: MOTION_ONLY ? "not run (--motion-only)" : allTrue(identity.staticFrames, "identical"),
  motionOffFramesIdentical: allTrue(identity.motionOffFrames, "identical"),
  firstPaintWithMotionIdenticalWithPulseHidden: allTrue(identity.motionFirstPaint, "identicalWithPulseHidden"),
  onlyThePulseRunsOnLoad: allTrue(identity.motionFirstPaint, "onlyThePulse"),
  firstPaintDomEqualsMotionOff: allTrue(identity.motionFirstPaint, "domEqualsMotionOff"),
  liveUpdateEndsAtCanonical: identity.liveUpdateEndsAtCanonical,
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
const changed = Object.entries(identity.staticFrames).filter(([, v]) => !v.identical && !v.expectedToChange).map(([k]) => k);
const changedOff = Object.entries(identity.motionOffFrames).filter(([, v]) => !v.identical).map(([k]) => k);
const firstPaintBad = Object.entries(identity.motionFirstPaint).filter(([, v]) => !v.identicalWithPulseHidden || !v.onlyThePulse || !v.domEqualsMotionOff || v.hiddenCards).map(([k]) => k);
const compared = Object.values(identity.staticFrames);
if (!MOTION_ONLY) console.log(changed.length ? `STATIC GUARD FAILED (reduced motion): ${changed.join(", ")}` : `Static guard, reduced motion: ${compared.filter((v) => v.identical).length} of ${compared.length} pre-motion frames identical; the other ${compared.filter((v) => !v.identical).length} change by design (${Object.keys(EXPECTED_TO_CHANGE).join(", ")}).`);
console.log(changedOff.length ? `STATIC GUARD FAILED (?motion=off): ${changedOff.join(", ")}` : `Static guard, ?motion=off: all ${Object.keys(identity.motionOffFrames).length} frames identical (pre-motion frame, or this run's still frame for the frames that change by design).`);
console.log(firstPaintBad.length ? `FIRST PAINT WITH MOTION FAILED: ${firstPaintBad.join(", ")}` : `First paint with motion on: identical to the still frames, only the live pulse runs (${Object.keys(identity.motionFirstPaint).length} pages).`);
const round6 = motionLog.chart ? [...Object.values(motionLog.chart).map((v) => v.pass), ...Object.values(motionLog.glide).map((v) => v.pass), motionLog.marker?.pass, motionLog.roll.ar.pass, motionLog.roll.en.pass, motionLog.delayed.pass, motionLog.rail.pass, identity.liveUpdateEndsAtCanonical?.domEqual] : [false];
if (round6.some((v) => !v)) console.log("A Round 6 or Round 7 check did not pass; see motion.chart, glide, marker, roll, delayed, rail and liveUpdateEndsAtCanonical in the log.");
if (changed.length || changedOff.length || firstPaintBad.length || round6.some((v) => !v) || !tunerCheck?.pass || !tunerCheck?.motionGroup?.pass || !tunerCheck?.crowdFromFile?.pass || bad.length) process.exitCode = 1;
