// Eclipse v3 capture. Serves this folder on 127.0.0.1:3173 and records the frames with Playwright chromium
// (fresh context per frame, so no stored tuning; deviceScaleFactor 1 unless a 2x crop; reducedMotion "reduce").
// Frames use ?tuner=0 unless they are about the tuner. Preset frames use ?tuner=0&preset=<id>.
// It also measures the lights (OKLab L relative to each card's own dark base, on light-only 1x captures with the
// card content hidden), renders ../light-study recipe A read-only as a calibration, and checks the tuner from file://
// (keyboard, presets, drag, copy, reset, ?tuner=0, the Motion group, and "Replay load" with motion on).
// Static guard: the static frames (reduced motion) and the ?motion=off frames must equal the pre-motion frames
// (evidence/pre-motion-hashes.json); any difference, or a failed tuner check, sets exit code 1.
// Motion (Round 5 section 4), with reducedMotion "no-preference": the settled motion page against the pre-motion
// frames, and the motion evidence (motion-*.png): the load held at set times (AR and EN), 2x strips of the lights
// entering (Inside now, and the chart's lower corners), a brightness check (no light ever brighter than at rest), a
// live update, the light following the pointer (with a zero-offset check), the rail mid-transition, the tooltip
// glide, the delayed state, the "switch on at load" toggle, and a contact sheet. Every animation's timing, easing
// and animated properties are logged (motion.spec and motion.loadAnimationsAsRun in capture-log.json).
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
  { name: "daily-ar-1440x900-rail-open", q: "lang=ar&tuner=0", act: "rail-open" },
  { name: "daily-en-1440x900-rail-open", q: "lang=en&tuner=0", act: "rail-open" },
  { name: "daily-ar-1440x900-delayed", q: "lang=ar&state=delayed&tuner=0" },
  { name: "daily-ar-1440x900-nohistory", q: "lang=ar&state=nohistory&tuner=0" },
  { name: "daily-ar-1440x900-details", q: "lang=ar&tuner=0", act: "details", full: true },
  { name: "daily-ar-1440x900-tuner-open", q: "lang=ar", act: "tuner-open" },
];
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

const MOTION_ONLY = process.argv.includes("--motion-only");
await mkdir(OUT, { recursive: true });
// v2 file names that v3 replaces with preset-recommended-* crops.
for (const stale of ["daily-ar-chart-2x.png", "daily-ar-nowcard-2x.png"]) await rm(join(OUT, stale), { force: true });
const browser = await chromium.launch();
const log = [];
const PRE = JSON.parse(await readFile(join(OUT, "pre-motion-hashes.json"), "utf8")).frames;
const sha = (buf) => createHash("sha256").update(buf).digest("hex");
const identity = { staticFrames: {}, motionOffFrames: {}, motionSettled: {}, liveUpdateEndsAtCanonical: null };

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
  if (PRE[name]) identity.staticFrames[name] = { identical: sha(buf) === PRE[name], ...(name.endsWith("tuner-open") ? { expectedToChange: "the tuner panel gained its Motion group" } : {}) };
  return buf;
}
async function hashFile(name) {
  if (PRE[name]) identity.staticFrames[name] = { identical: sha(await readFile(join(OUT, `${name}.png`))) === PRE[name] };
}

/* ------------------------------------------------------------------ motion (Round 5 section 4)
 * Contexts with reducedMotion "no-preference". Animations are held at exact times through the page's own seek
 * (window.__eclipse.motion.seek / seekLive) and Document.getAnimations(), so every stepped frame is deterministic. */
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
// Hold every animation on the page at `ms` after it started; the endless live pulse is held at a fixed phase.
const holdAll = (page, ms, pulseAt = 1400) => page.evaluate(([t, p]) => {
  document.getAnimations().forEach((a) => {
    a.pause();
    a.currentTime = a.effect && a.effect.getComputedTiming().iterations === Infinity ? p : t;
  });
}, [ms, pulseAt]);
async function openMotion(q, opts = {}) {
  const o = await open(q, { ...opts, motion: true });
  await o.page.waitForFunction(() => window.__eclipse.motion.introStarted === true);
  return o;
}
const settled = (page) => page.waitForFunction(() => window.__eclipse.motion.introStarted && !window.__eclipse.motion.introActive, null, { timeout: 10000 });
const mshots = [];
async function mshot(page, name, caption, opts = {}) {
  await page.waitForTimeout(40);
  const buf = await page.screenshot({ path: join(OUT, `${name}.png`), ...opts });
  mshots.push({ name, caption });
  return buf;
}
// A captioned grid of frames (the strips), written at the frames' own pixel size.
async function sheet(name, title, cells, cols) {
  const { context, page } = await newPage({ width: 1600, height: 1000 });
  const items = cells.map((c) => `<figure><img src="data:image/png;base64,${c.buf.toString("base64")}"><figcaption>${c.caption}</figcaption></figure>`).join("");
  await page.setContent(`<!doctype html><html><head><style>
    body { margin: 0; padding: 16px; background: #161616; color: #cfcfcf; font: 22px/1.3 "Segoe UI", system-ui, sans-serif; width: max-content; }
    h1 { margin: 0 0 12px; font-size: 24px; font-weight: 600; color: #eee; max-width: 1300px; }
    .g { display: grid; grid-template-columns: repeat(${cols}, max-content); gap: 18px 16px; }
    figure { margin: 0; } img { display: block; } figcaption { margin-top: 6px; }
  </style></head><body><h1>${title}</h1><div class="g">${items}</div></body></html>`);
  await page.waitForTimeout(150);
  await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: true });
  await context.close();
  mshots.push({ name, caption: title });
}
// Every animation on the page as the browser runs it (target, properties, delay, duration, easing), for the log.
const listAnimations = (page) => page.evaluate(() => document.getAnimations().map((a) => {
  const e = a.effect, t = e && e.getTiming ? e.getTiming() : {};
  const target = e && e.target ? `${e.target.id ? `#${e.target.id}` : `${e.target.tagName.toLowerCase()}.${[...e.target.classList].join(".")}`}${e.pseudoElement || ""}` : "(clock: the line's head)";
  const keyframes = e && e.getKeyframes ? e.getKeyframes() : [];
  const props = [...new Set(keyframes.flatMap((k) => Object.keys(k).filter((x) => !["offset", "easing", "composite", "computedOffset"].includes(x))))];
  return { target, kind: a.animationName ? `css @keyframes ${a.animationName}` : "web animation", properties: props, delayMs: t.delay, durationMs: t.duration, easing: t.easing, iterations: t.iterations, keyframes: keyframes.map((k) => Object.fromEntries(Object.entries(k).filter(([x]) => !["composite", "computedOffset", "easing"].includes(x)))) };
}));

/* Brightness while the lights enter: each light is captured every 40 ms (1x, card content hidden, the cards' own
 * entrance held at its end so only the light changes) and compared with the same light at rest. Both images get a
 * 7x7 box blur (so the grain, which moves with the light, does not decide) and are compared as the cube root of
 * luminance (close to OKLab L). "Brighter than rest" means more than +0.01 on that scale. */
async function brightnessCheck(lang, overrides) {
  const { context, page, errors } = await openMotion(`lang=${lang}&tuner=0`);
  await settled(page);
  if (overrides) await page.evaluate((o) => Object.assign(window.__eclipse.motion.timings, o), overrides);
  await page.evaluate(() => window.__eclipse.motion.replay());
  await page.addStyleTag({ content: ".lit > :not(.lamp) { visibility: hidden !important; } html.m-wash .main, html.m-wash .rail-slot { visibility: hidden !important; }" });
  const T = await page.evaluate(() => window.__eclipse.motion.timings);
  const total = await page.evaluate(() => window.__eclipse.motion.introTotal());
  const clips = await page.evaluate(() => Object.fromEntries([["insideNow", "#card-now"], ["chart", ".chart"], ["wash", ".wash"]].map(([k, s]) => { const c = document.querySelector(s).getBoundingClientRect(); const y = Math.max(0, Math.floor(c.y)); return [k, { x: Math.floor(c.x), y, width: Math.ceil(c.width), height: Math.min(900 - y, Math.ceil(c.height)) }]; })));
  const from = { insideNow: T.nowDelay, chart: T.chartLightDelay, wash: T.washDelay };
  const shots = {};
  for (const k of Object.keys(clips)) {
    await page.evaluate((w) => document.documentElement.classList.toggle("m-wash", w), k === "wash");
    shots[k] = [];
    for (let t = from[k]; t <= total; t += 40) {
      await page.evaluate((ms) => { window.__eclipse.motion.seek(ms); document.querySelectorAll(".cards > .card, .chart").forEach((c) => c.getAnimations().forEach((an) => { an.currentTime = 1e6; })); }, t);
      shots[k].push([t, await page.screenshot({ clip: clips[k] })]);
    }
  }
  await page.evaluate(() => window.__eclipse.motion.settle());
  await page.waitForTimeout(300);
  const rest = {};
  for (const k of Object.keys(clips)) { await page.evaluate((w) => document.documentElement.classList.toggle("m-wash", w), k === "wash"); await page.waitForTimeout(60); rest[k] = await page.screenshot({ clip: clips[k] }); }
  await context.close();
  const res = {};
  const x = await newPage({ width: 400, height: 300 });
  for (const k of Object.keys(clips)) {
    res[k] = await x.page.evaluate(async ([list, restSrc]) => {
      const load = async (s) => { const i = new Image(); i.src = s; await i.decode(); const c = document.createElement("canvas"); c.width = i.naturalWidth; c.height = i.naturalHeight; const g = c.getContext("2d"); g.drawImage(i, 0, 0); return { d: g.getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height }; };
      const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      const blurL = ({ d, w, h }) => { const Y = new Float32Array(w * h); for (let p = 0, i = 0; p < w * h; p++, i += 4) Y[p] = 0.2126 * lin(d[i]) + 0.7152 * lin(d[i + 1]) + 0.0722 * lin(d[i + 2]); const B = new Float32Array(w * h); for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) { let s = 0, n = 0; for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const X = xx + dx, YY = y + dy; if (X < 0 || YY < 0 || X >= w || YY >= h) continue; s += Y[YY * w + X]; n++; } B[y * w + xx] = Math.cbrt(s / n); } return B; };
      const R = blurL(await load(restSrc));
      let worst = 0, worstAt = null, frames = 0, framesOver = 0;
      const everOver = new Uint8Array(R.length);
      for (const [t, src] of list) {
        const A = blurL(await load(src));
        let mx = 0, n = 0;
        for (let p = 0; p < A.length; p++) { const d = A[p] - R[p]; if (d > mx) mx = d; if (d > 0.01) { n++; everOver[p] = 1; } }
        frames++; if (n) framesOver++;
        if (mx > worst) { worst = mx; worstAt = t; }
      }
      let px = 0; for (const v of everOver) px += v;
      return { framesChecked: frames, framesWithAPixelBrighterThanRest: framesOver, pixelsEverBrighterThanRest: px, largestBrighteningL: Math.round(worst * 1000) / 1000, largestAtMs: worstAt };
    }, [shots[k].map(([t, b]) => [t, `data:image/png;base64,${b.toString("base64")}`]), `data:image/png;base64,${rest[k].toString("base64")}`]);
  }
  await x.context.close();
  return { lang, ...(overrides ? { overrides } : {}), stepMs: 40, tolerance: "+0.01 in cube-root luminance (about OKLab L), 7x7 blur", ...res, errors };
}

async function captureMotion() {
  const M = {};
  // Motion frames from earlier runs (other names and times) would no longer match: start clean.
  for (const f of await readdir(OUT)) if (/^motion-.*\.png$/.test(f)) await rm(join(OUT, f), { force: true });

  // The motion spec as built in app.js, and every animation as the browser runs it at the start of the load.
  {
    const { context, page } = await openMotion("lang=ar&tuner=0");
    await settled(page);
    M.spec = await page.evaluate(() => window.__eclipse.motion.spec());
    M.introTotalMs = await page.evaluate(() => window.__eclipse.motion.introTotal());
    await page.evaluate(() => { window.__eclipse.motion.replay(); window.__eclipse.motion.seek(0); });
    M.loadAnimationsAsRun = await listAnimations(page);
    await page.evaluate(() => window.__eclipse.motion.settle());
    await context.close();
  }

  // 1. ?motion=off without reduced motion: every frame except tuner-open equals the pre-motion frame.
  for (const frame of FRAMES) {
    if (frame.act === "tuner-open") continue;
    const q = `${frame.q}&motion=off`;
    const { context, page, errors } = await open(q, { motion: true });
    await act(page, frame);
    await page.waitForTimeout(200);
    const buf = await page.screenshot({ fullPage: Boolean(frame.full) });
    identity.motionOffFrames[frame.name] = { url: `index.html?${q}`, reducedMotion: "no-preference", identical: sha(buf) === PRE[frame.name], dataMotion: await page.evaluate(() => document.documentElement.dataset.motion), errors };
    await context.close();
  }

  // 2. Motion on, left to settle on its own: the frame equals the pre-motion frame once the live pulse (the one
  //    thing that keeps moving while live) is hidden, and the page's DOM equals the ?motion=off DOM.
  for (const [name, q] of [["daily-ar-1440x900", "lang=ar&tuner=0"], ["daily-en-1440x900", "lang=en&tuner=0"], ["daily-ar-1440x900-delayed", "lang=ar&state=delayed&tuner=0"], ["daily-ar-1440x900-nohistory", "lang=ar&state=nohistory&tuner=0"]]) {
    const { context, page, errors } = await openMotion(q);
    await settled(page);
    await page.waitForTimeout(400);
    const state = await page.evaluate(() => ({
      dataMotion: document.documentElement.dataset.motion,
      pendingLeft: document.documentElement.dataset.intro || document.documentElement.dataset.lights || null,
      entranceClassLeft: document.querySelectorAll(".is-entering").length,
      pulse: Boolean(document.querySelector(".ping.is-on")),
      runningAnimations: document.getAnimations().filter((a) => a.playState === "running").map((a) => (a.animationName ? `css:${a.animationName}` : `waapi:${a.effect?.target?.id || a.effect?.target?.className || "?"}`)),
    }));
    const withPulse = await page.screenshot();
    const dom = await page.evaluate(() => { const c = document.querySelector(".page").cloneNode(true); c.querySelectorAll(".ping").forEach((n) => n.remove()); return c.outerHTML; });
    await page.addStyleTag({ content: ".ping { visibility: hidden !important; }" });
    await page.waitForTimeout(60);
    const noPulse = await page.screenshot();
    await context.close();
    const off = await open(`${q}&motion=off`, { motion: true });
    // The language link carries the page's own query, so ?motion=off appears in it; that is the only expected difference.
    const domOff = await off.page.evaluate(() => document.querySelector(".page").outerHTML.replaceAll("&amp;motion=off", ""));
    await off.context.close();
    let pre = null;
    try { pre = await readFile(join(OUT, `${name}.png`)); } catch { /* static frame not captured yet */ }
    identity.motionSettled[name] = {
      url: `index.html?${q}`, ...state, errors,
      identicalWithPulseHidden: sha(noPulse) === PRE[name],
      pixelsThatDifferWithPulseShown: pre && sha(pre) === PRE[name] ? await pixelDiff(withPulse, pre) : "no pre-motion frame on disk to compare",
      domEqualsMotionOff: dom === domOff,
    };
  }

  // 3. The load sequence, held at set times (AR, and a few EN). The last time is the end of the sequence.
  for (const lang of ["ar", "en"]) {
    const { context, page, errors } = await openMotion(`lang=${lang}&tuner=0`);
    const total = M.introTotalMs;
    const times = lang === "ar" ? [0, 150, 300, 450, 600, 800, 1000, 1200, 1400, 1700, 2000, total] : [300, 600, 1000, 1400, total];
    const frames = [];
    for (const t of times) {
      await page.evaluate((ms) => window.__eclipse.motion.seek(ms), t);
      const name = `motion-load-${lang}-${String(t).padStart(4, "0")}ms`;
      const buf = await mshot(page, name, `Load ${lang.toUpperCase()}, ${t} ms${t === total ? " (end)" : ""}`);
      frames.push({ t, name, ...(t === total ? { identicalToStaticFrame: sha(buf) === PRE[`daily-${lang}-1440x900`] } : {}) });
    }
    M[`load_${lang}`] = { frames, errors };
    await context.close();
  }

  // 4. The lights entering, 2x. Inside now: the whole card at set times after its light starts. Chart: its two lower
  //    corners. The final frame is the settled page (the entrance's class removed), for comparison.
  for (const lang of ["ar", "en"]) {
    const { context, page, errors } = await openMotion(`lang=${lang}&tuner=0`, { scale: 2 });
    const T = await page.evaluate(() => window.__eclipse.motion.timings);
    const r = await page.evaluate(() => {
      const c = document.getElementById("card-now").getBoundingClientRect(), h = document.querySelector(".chart").getBoundingClientRect();
      const cw = 380, ch = 250; // each lower corner of the chart card, CSS px
      return {
        now: { x: Math.floor(c.x) - 4, y: Math.floor(c.y) - 4, width: Math.ceil(c.width) + 8, height: Math.ceil(c.height) + 8 },
        left: { x: Math.floor(h.x) - 4, y: Math.ceil(h.bottom) - ch, width: cw, height: ch + 4 },
        right: { x: Math.ceil(h.right) - cw + 4, y: Math.ceil(h.bottom) - ch, width: cw, height: ch + 4 },
      };
    });
    const endFirst = lang === "ar" ? ["left", "right"] : ["right", "left"]; // inline-end corner first
    const nowTimes = [0, 150, 300, 500, 800, 1200];
    const chartTimes = [0, 200, 400, 600, 900, 1300];
    const nowCells = [], chartCells = [];
    for (const dt of nowTimes) { await page.evaluate((ms) => window.__eclipse.motion.seek(ms), T.nowDelay + dt); await page.waitForTimeout(40); nowCells.push({ buf: await page.screenshot({ clip: r.now }), caption: `${dt} ms after the light starts (${T.nowDelay + dt} ms into the load)` }); }
    for (const dt of chartTimes) { await page.evaluate((ms) => window.__eclipse.motion.seek(ms), T.chartLightDelay + dt); await page.waitForTimeout(40); for (const side of endFirst) chartCells.push({ buf: await page.screenshot({ clip: r[side] }), caption: `${dt} ms, ${side === endFirst[0] ? "inline-end" : "inline-start"} corner` }); }
    await page.evaluate(() => window.__eclipse.motion.settle());
    await page.mouse.move(720, 30);
    await page.waitForTimeout(400);
    await page.addStyleTag({ content: ".ping { visibility: hidden !important; }" });
    await page.waitForTimeout(60);
    nowCells.push({ buf: await page.screenshot({ clip: r.now }), caption: "final (the settled page)" });
    for (const side of endFirst) chartCells.push({ buf: await page.screenshot({ clip: r[side] }), caption: `final, ${side === endFirst[0] ? "inline-end" : "inline-start"} corner` });
    await sheet(`motion-light-nowcard-${lang}-2x`, `Inside now light entering, ${lang.toUpperCase()}, 2x. It slides in behind the fixed disc, out of the lit corner (${T.nowSlide} ms from ${T.nowDelay} ms into the load).`, nowCells, 2);
    await sheet(`motion-light-chart-corners-${lang}-2x`, `Chart light rising with the line, ${lang.toUpperCase()}, 2x, lower corners (${T.chartLightRise} ms from ${T.chartLightDelay} ms; the line draws from ${T.drawDelay} ms for ${T.drawDur} ms).`, chartCells, 2);
    M[`lightStrips_${lang}`] = { nowTimesAfterStart: nowTimes, chartTimesAfterStart: chartTimes, errors };
    await context.close();
  }

  // 5. Never brighter than at rest: the real entrance (AR and EN), and, for the record, the same light started toward
  //    the disc's centre instead (the first proposal), which is brighter than rest over the crescent.
  M.brightness = { ar: await brightnessCheck("ar"), en: await brightnessCheck("en") };
  const cf = await brightnessCheck("ar", { nowFrom: -0.34 });
  const cfFade = await brightnessCheck("ar", { nowFrom: -0.34, nowOpacity: [[0, 0], [0.25, 0.3], [0.5, 0.62], [0.75, 0.88]] });
  M.brightness.counterfactualTowardDiscCentreAr = {
    note: "The Inside now light started 34% of the way from the lit corner toward the disc's centre (nowFrom -0.34) and slid out from there, everything else as built; then the same with its opacity rising along the way. Only the Inside now results apply.",
    slideOnly: cf.insideNow, slideWithFade: cfFade.insideNow, errors: [...cf.errors, ...cfFade.errors],
  };

  // 6. Live: one simulated new reading (the next minute of the same seeded day). Held before, during and after.
  {
    const run = async (scale) => {
      const { context, page, errors } = await openMotion("lang=ar&tuner=0", { scale });
      await settled(page);
      await page.mouse.move(720, 30);
      const tailClip = await page.evaluate(() => {
        const p = document.getElementById("plot").getBoundingClientRect();
        const e = window.__eclipse.minuteClient(window.__eclipse.figures.last);
        return { x: Math.round(e.x - 150), y: Math.round(p.top + 120), width: 300, height: Math.round(p.height - 120) };
      });
      const cardsClip = await page.evaluate(() => { const r = document.getElementById("cards").getBoundingClientRect(); return { x: Math.floor(r.x), y: Math.floor(r.y - 70), width: Math.ceil(r.width), height: Math.ceil(r.height + 70) }; });
      await holdAll(page, 0);
      const out = { errors };
      if (scale === 2) await mshot(page, "motion-live-ar-tail-before-2x", "Live tail, before (7:42)", { clip: tailClip });
      else await mshot(page, "motion-live-ar-cards-before", "Cards, before", { clip: cardsClip });
      out.step = await page.evaluate(() => { const r = window.__eclipse.motion.step(); document.getAnimations().forEach((a) => a.pause()); return r; });
      for (const t of [100, 350]) {
        await holdAll(page, t);
        await page.evaluate((f) => window.__eclipse.motion.seekLive(f), t / 700);
        if (scale === 2) await mshot(page, `motion-live-ar-tail-${String(t).padStart(4, "0")}ms-2x`, `Live tail, ${t} ms`, { clip: tailClip });
        else await mshot(page, `motion-live-ar-cards-${String(t).padStart(4, "0")}ms`, `Cards, ${t} ms (cross-fade)`, { clip: cardsClip });
      }
      await holdAll(page, 700);
      // Let the morph and the cross-fades run out, then hold the pulse at the same phase as before.
      await page.evaluate(() => { window.__eclipse.motion.seekLive(1); window.__eclipse.motion.settle(); document.getAnimations().forEach((a) => a.play()); });
      await page.waitForTimeout(400);
      await holdAll(page, 0);
      if (scale === 2) await mshot(page, "motion-live-ar-tail-after-2x", "Live tail, after (7:43)", { clip: tailClip });
      else await mshot(page, "motion-live-ar-cards-after", "Cards, after", { clip: cardsClip });
      out.figures = await page.evaluate(() => window.__eclipse.figures);
      if (scale === 1) {
        await page.addStyleTag({ content: ".ping { visibility: hidden !important; }" });
        await page.waitForTimeout(60);
        out.afterFull = await page.screenshot();
        out.domAfter = await page.evaluate(() => { const c = document.querySelector(".page").cloneNode(true); c.querySelectorAll(".ping").forEach((n) => n.remove()); return c.outerHTML; });
      }
      await context.close();
      return out;
    };
    const r1 = await run(1);
    const r2 = await run(2);
    // The same reading applied without motion (reduced motion): the settled live page must equal it.
    const { context, page } = await open("lang=ar&tuner=0");
    await page.evaluate(() => window.__eclipse.motion.step());
    await page.waitForTimeout(100);
    const canon = await page.screenshot();
    const domCanon = await page.evaluate(() => document.querySelector(".page").outerHTML);
    await context.close();
    identity.liveUpdateEndsAtCanonical = { identicalWithPulseHidden: sha(r1.afterFull) === sha(canon), pixelDiff: await pixelDiff(r1.afterFull, canon), domEqual: r1.domAfter === domCanon };
    M.live = { step: r1.step, figuresAfter: r1.figures, errors: [...r1.errors, ...r2.errors] };
  }

  // 7. The light follows the pointer: the Inside now card at rest, with the pointer at its exact centre (offset 0:
  //    nothing may move), and with the pointer at two places (2x). The zero-offset check runs in AR and EN.
  {
    const follow = {};
    for (const lang of ["ar", "en"]) {
      const { context, page, errors } = await openMotion(`lang=${lang}&tuner=0`, { scale: 2 });
      await settled(page);
      await page.mouse.move(720, 30);
      await page.waitForTimeout(300);
      const box = await rectOf(page, "#card-now");
      const clip = clipOf(box);
      const preName = lang === "ar" ? "preset-recommended-nowcard-2x" : "daily-en-nowcard-2x";
      const read = () => page.evaluate(() => ({ cls: document.getElementById("card-now").className, transform: getComputedStyle(document.querySelector("#card-now .lamp-in"), "::before").transform, peek: [getComputedStyle(document.getElementById("card-now")).getPropertyValue("--peek-x").trim(), getComputedStyle(document.getElementById("card-now")).getPropertyValue("--peek-y").trim()] }));
      const rest = lang === "ar" ? await mshot(page, "motion-follow-now-rest-2x", "Inside now, rest", { clip }) : await page.screenshot({ clip });
      const f = { restIdenticalToStatic: sha(rest) === PRE[preName], points: [] };
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 6 });
      await page.waitForTimeout(1300);
      const zero = await page.screenshot({ clip });
      f.zeroOffset = { ...(await read()), identicalToRest: sha(zero) === sha(rest), pixelDiff: await pixelDiff(zero, rest) };
      if (lang === "ar") {
        for (const p of [
          { id: "a", label: "pointer near the far top corner (top right in Arabic)", fx: 0.86, fy: 0.18 },
          { id: "b", label: "pointer by the lit corner (bottom left in Arabic)", fx: 0.1, fy: 0.86 },
        ]) {
          await page.mouse.move(box.x + box.width * p.fx, box.y + box.height * p.fy, { steps: 6 });
          await page.waitForTimeout(1300);
          await mshot(page, `motion-follow-now-${p.id}-2x`, `Inside now, ${p.label}`, { clip });
          f.points.push({ ...p, ...(await read()) });
        }
      }
      await page.mouse.move(720, 30, { steps: 4 });
      await page.waitForTimeout(1200);
      const back = await page.screenshot({ clip });
      f.afterLeaveIdenticalToStatic = sha(back) === PRE[preName];
      f.afterLeave = await read();
      f.errors = errors;
      follow[lang] = f;
      await context.close();
    }
    M.follow = follow;
  }

  // 8. The rail mid-transition (opening at 120 ms of 300; closing at 110 ms of 240), AR and EN.
  {
    const rail = {};
    for (const lang of ["ar", "en"]) {
      const { context, page, errors } = await openMotion(`lang=${lang}&tuner=0`);
      await settled(page);
      await page.click("#brand");
      await holdAll(page, 120);
      await mshot(page, `motion-rail-${lang}-open-0120ms`, `Rail ${lang.toUpperCase()} opening, 120 of 300 ms`);
      rail[`${lang}Open`] = await page.evaluate(() => ({ railWidth: getComputedStyle(document.getElementById("rail")).width, morph: document.getElementById("rail").classList.contains("is-morph"), animatedProps: [...new Set(document.getAnimations().filter((a) => a.effect?.target?.closest?.(".rail")).flatMap((a) => a.effect.getKeyframes().flatMap((k) => Object.keys(k).filter((x) => !["offset", "easing", "composite", "computedOffset"].includes(x)))))] }));
      await page.evaluate(() => document.getAnimations().forEach((a) => a.play()));
      await page.waitForTimeout(500);
      if (lang === "ar") {
        // Settled open rail against the static frame (same pointer spot; the live pulse hidden).
        await page.mouse.move(720, 40);
        await page.addStyleTag({ content: ".ping { visibility: hidden !important; }" });
        await page.waitForTimeout(300);
        const settledOpen = await page.screenshot();
        rail.arOpenSettledIdenticalToStatic = sha(settledOpen) === PRE["daily-ar-1440x900-rail-open"];
        let pre = null;
        try { pre = await readFile(join(OUT, "daily-ar-1440x900-rail-open.png")); } catch { /* not captured yet */ }
        if (pre && sha(pre) === PRE["daily-ar-1440x900-rail-open"]) rail.arOpenSettledPixelDiff = await pixelDiff(settledOpen, pre);
        await page.click("#brand");
        await holdAll(page, 110);
        await mshot(page, "motion-rail-ar-close-0110ms", "Rail AR closing, 110 of 240 ms");
        await page.evaluate(() => document.getAnimations().forEach((a) => a.play()));
        await page.waitForTimeout(500);
      }
      rail[`${lang}Errors`] = errors;
      await context.close();
    }
    M.rail = rail;
  }

  // 9. The tooltip glide: the guide held mid-glide after the keyboard jumps from the latest reading to 60 minutes
  //    earlier (PageDown).
  {
    const { context, page, errors } = await openMotion("lang=ar&tuner=0");
    await settled(page);
    await page.focus("#plot-hit");
    await page.waitForTimeout(300);
    await page.keyboard.press("PageDown");
    await holdAll(page, 90);
    await mshot(page, "motion-glide-ar-0090ms", "Tooltip glide (PageDown, 60 min), 90 ms");
    await page.evaluate(() => document.getAnimations().forEach((a) => a.play()));
    await page.waitForTimeout(500);
    M.glide = { valuetext: await page.evaluate(() => document.getElementById("plot-hit").getAttribute("aria-valuetext")), errors };
    await context.close();
  }

  // 10. Delayed: nothing looks live. No pulse during the load or at rest, nothing left running; a simulated minute
  //     passes with no reading and no line motion.
  {
    const { context, page, errors } = await openMotion("lang=ar&state=delayed&tuner=0");
    const duringLoad = await page.evaluate(() => Boolean(document.querySelector(".ping")));
    await settled(page);
    await page.waitForTimeout(400);
    const before = await page.evaluate(() => ({ figures: window.__eclipse.figures, pulse: Boolean(document.querySelector(".ping")), running: document.getAnimations().filter((a) => a.playState === "running").length }));
    const r = await page.evaluate(() => window.__eclipse.motion.step());
    // Right after the minute passes: only the "minutes ago" text cross-fades (a number update); no line motion.
    const during = await page.evaluate(() => ({ liveMorph: window.__eclipse.motion.liveActive, running: document.getAnimations().filter((a) => a.playState === "running").map((a) => a.effect?.target?.closest?.("#now-meta") ? "now-meta cross-fade" : a.effect?.target?.id || a.effect?.target?.className || "?") }));
    await page.waitForTimeout(400);
    const after = await page.evaluate(() => ({ figures: window.__eclipse.figures, pulse: Boolean(document.querySelector(".ping")), liveMorph: window.__eclipse.motion.liveActive, running: document.getAnimations().filter((a) => a.playState === "running").length, meta: document.getElementById("now-meta").innerText.trim() }));
    const d = { pulseDuringLoad: duringLoad, pulseAtRest: before.pulse, runningAnimationsAtRest: before.running, step: r, lastBefore: before.figures.last, lastAfter: after.figures.last, nowBefore: before.figures.nowM, nowAfter: after.figures.nowM, rightAfterTheMinute: during, pulseAfter: after.pulse, liveMorph: after.liveMorph, runningAnimations400msAfter: after.running, meta: after.meta, errors };
    d.pass = !d.pulseDuringLoad && !d.pulseAtRest && d.runningAnimationsAtRest === 0 && d.lastAfter === d.lastBefore && d.nowAfter === d.nowBefore + 1 && !during.liveMorph && during.running.every((x) => x === "now-meta cross-fade") &&
      !d.pulseAfter && !d.liveMorph && d.runningAnimations400msAfter === 0 && errors.length === 0;
    M.delayed = d;
    await context.close();
  }

  // 11. "Switch on at load" off (the tuner's stored choice): the cards and the line still enter, the lights do not
  //     move and are there from the start; switched back on, the replayed load runs the light entrance again.
  {
    const { context, page, errors } = await newPage({ motion: true });
    await context.addInitScript(() => { if (!sessionStorage.getItem("seeded")) { localStorage.setItem("fitway.eclipse.v3.motion", JSON.stringify({ switchOn: false })); sessionStorage.setItem("seeded", "1"); } });
    await page.goto(`${ORIGIN}/index.html?lang=ar`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => window.__eclipse?.motion?.introStarted === true);
    const lightAnims = () => page.evaluate(() => document.getAnimations().filter((a) => { const t = a.effect?.target; return t && (t.closest?.(".lamp") || t.closest?.(".wash") || (t.id === "rail" && a.effect.pseudoElement)); }).length);
    const off = { lightsHiddenBeforeStart: await page.evaluate(() => document.documentElement.dataset.lights || null), lightAnimations: await lightAnims(), entranceClass: await page.evaluate(() => document.querySelectorAll(".is-entering").length), introActive: await page.evaluate(() => window.__eclipse.motion.introActive) };
    await page.evaluate(() => { window.__eclipse.motion.set({ switchOn: true }); window.__eclipse.motion.replay(); });
    const on = { lightAnimations: await lightAnims(), entranceClass: await page.evaluate(() => document.querySelectorAll(".is-entering").length) };
    await page.evaluate(() => { window.__eclipse.motion.settle(); localStorage.removeItem("fitway.eclipse.v3.motion"); });
    M.switchOnAtLoad = { off, on, errors, pass: off.lightsHiddenBeforeStart === null && off.lightAnimations === 0 && off.entranceClass === 0 && on.lightAnimations > 0 && on.entranceClass === 1 && errors.length === 0 };
    await context.close();
  }

  // 12. Contact sheet of the motion frames.
  {
    const { context, page } = await newPage({ width: 1440, height: 900 });
    const items = [];
    for (const s of mshots) items.push({ ...s, src: `data:image/png;base64,${(await readFile(join(OUT, `${s.name}.png`))).toString("base64")}` });
    await page.setContent(`<!doctype html><html><head><style>
      body { margin: 0; padding: 16px; background: #111; color: #ccc; font: 12px/1.3 "Segoe UI", system-ui, sans-serif; }
      h1 { margin: 0 0 10px; font-size: 14px; font-weight: 600; color: #eee; }
      .g { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
      figure { margin: 0; } img { display: block; width: 100%; height: 200px; object-fit: contain; background: #000; border: 1px solid #333; }
      figcaption { margin-top: 4px; }
    </style></head><body><h1>Eclipse v3 motion, held frames (concept, synthetic data)</h1><div class="g">${items.map((i) => `<figure><img src="${i.src}"><figcaption>${i.caption}</figcaption></figure>`).join("")}</div></body></html>`);
    await page.waitForTimeout(200);
    await page.screenshot({ path: join(OUT, "motion-contact-sheet.png"), fullPage: true });
    await context.close();
  }

  M.frames = mshots.map((s) => `${s.name}.png`).concat(["motion-contact-sheet.png"]);
  Object.assign(motionLog, M);
  const b = M.brightness;
  console.log(`motion: off-frames identical ${Object.values(identity.motionOffFrames).filter((v) => v.identical).length}/${Object.keys(identity.motionOffFrames).length}; settled identical ${Object.values(identity.motionSettled).filter((v) => v.identicalWithPulseHidden).length}/${Object.keys(identity.motionSettled).length}; live ends at canonical ${identity.liveUpdateEndsAtCanonical?.identicalWithPulseHidden}; delayed ${M.delayed.pass}; switch on at load ${M.switchOnAtLoad.pass}; rail settled ${M.rail.arOpenSettledIdenticalToStatic}`);
  for (const lang of ["ar", "en"]) { const f = M.follow[lang]; console.log(`follow ${lang}: rest ${f.restIdenticalToStatic}, zero offset ${f.zeroOffset.identicalToRest} (${f.zeroOffset.pixelDiff.changedPixels} px, max ${f.zeroOffset.pixelDiff.maxChannelDiff}), after leave ${f.afterLeaveIdenticalToStatic}`); }
  for (const lang of ["ar", "en"]) console.log(`brightness ${lang}: ${["insideNow", "chart", "wash"].map((k) => `${k} ${b[lang][k].pixelsEverBrighterThanRest} px (max +${b[lang][k].largestBrighteningL})`).join(", ")}`);
  const c = b.counterfactualTowardDiscCentreAr;
  console.log(`brightness, counterfactual toward the disc's centre (AR): slide only ${c.slideOnly.pixelsEverBrighterThanRest} px (max +${c.slideOnly.largestBrighteningL}); with a fade ${c.slideWithFade.pixelsEverBrighterThanRest} px (max +${c.slideWithFade.largestBrighteningL})`);
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

  // Keyboard: the chart readout moves with the arrow keys (no screenshot).
  {
    const { context, page, errors } = await open("lang=ar&tuner=0");
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      if (await page.evaluate(() => document.activeElement?.id === "plot-hit")) break;
    }
    const steps = [];
    const read = async (key) => steps.push({ key, active: await page.evaluate(() => document.activeElement?.id), focusVisible: await page.evaluate(() => document.activeElement?.matches(":focus-visible")), valuetext: await page.evaluate(() => document.getElementById("plot-hit").getAttribute("aria-valuetext")), tip: await page.evaluate(() => document.getElementById("tip").innerText.replace(/\s+/g, " ").trim()) });
    await read("focus");
    await page.keyboard.press("ArrowRight"); await read("ArrowRight (earlier, RTL)");
    await page.keyboard.press("Home"); await read("Home");
    await page.keyboard.press("End"); await read("End");
    await page.keyboard.press("ArrowLeft"); await read("ArrowLeft (later, RTL)");
    log.push({ frame: "keyboard-ar", screenshot: false, steps, errors });
    console.log(`keyboard-ar: ${steps.map((s) => `${s.key} -> ${s.valuetext}`).join(" | ")}`);
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
      t.drag ={ moved: { dx: Math.round(r1.x - r0.x), dy: Math.round(r1.y - r0.y) }, expanded: [open0, open1], storedPosition: stored, homeReturns: Math.abs(r2.x - r0.x) < 1 && Math.abs(r2.y - r0.y) < 1 };
      t.drag.pass = Math.abs(t.drag.moved.dx + 200) <= 1 && Math.abs(t.drag.moved.dy - 120) <= 1 && open0 === open1 && Boolean(stored) && t.drag.homeReturns;
    }
    // The Motion group: a simulated reading advances the day by one minute; a switch persists in its own key
    // (not the light values' key) across a reload; ?tuner=0 ignores it. This context has reduced motion, so the
    // Motion switch is disabled with a note and the reading applies at once.
    {
      // Expectations follow the page's own defaults (window.__eclipse.motion.defaults), not fixed values.
      const m = {};
      m.defaults = await page.evaluate(() => window.__eclipse.motion.defaults);
      m.group = await page.evaluate(() => ({ present: Boolean(document.querySelector(".tuner-motion")), switches: [...document.querySelectorAll(".tuner-motion input[type=checkbox]")].map((b) => ({ id: b.id, checked: b.checked, disabled: b.disabled })), note: document.querySelector(".tuner-motion .t-note")?.textContent || "" }));
      m.switchesShowDefaults = m.group.switches.filter((s) => s.id !== "t-mo-motion").every((s) => s.checked === m.defaults[s.id.replace("t-mo-", "")]);
      const before = await page.evaluate(() => window.__eclipse.figures);
      await page.click("text=قراءة جديدة");
      await page.waitForTimeout(80);
      const after = await page.evaluate(() => window.__eclipse.figures);
      m.newReading = { lastBefore: before.last, lastAfter: after.last, nowBefore: before.now, nowAfter: after.now, entriesBefore: before.entries, entriesAfter: after.entries, statusTime: await page.evaluate(() => document.querySelector("#status bdi").textContent), latestAfter: await page.evaluate(() => window.__eclipse.motion.latest), tunerStatus: await page.textContent(".t-latest") };
      await page.click("label[for='t-mo-follow']");
      await page.click("label[for='t-mo-switchOn']");
      m.stored = await page.evaluate(() => ({ motion: localStorage.getItem("fitway.eclipse.v3.motion"), lightsKeyStillSeparate: localStorage.getItem("fitway.eclipse.v3.lights") !== null }));
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForFunction(() => window.__eclipse?.ready === true);
      m.persistedAfterReload = await page.evaluate(() => ({ follow: window.__eclipse.motion.options.follow, switchOn: window.__eclipse.motion.options.switchOn, followBox: document.getElementById("t-mo-follow").checked, switchOnBox: document.getElementById("t-mo-switchOn").checked, dayRestartsAt: window.__eclipse.figures.last }));
      await page.goto(`${FILE_URL}?lang=ar&tuner=0`, { waitUntil: "networkidle" });
      await page.waitForFunction(() => window.__eclipse?.ready === true);
      m.tunerOffIgnoresStored = await page.evaluate(() => { const o = window.__eclipse.motion.options, d = window.__eclipse.motion.defaults; return o.follow === d.follow && o.switchOn === d.switchOn; });
      const storedObj = JSON.parse(m.stored.motion || "{}");
      m.pass = m.group.present && m.group.switches.length === 5 && m.group.switches.find((s) => s.id === "t-mo-motion")?.disabled === true && Boolean(m.group.note) && m.switchesShowDefaults &&
        m.newReading.lastAfter === m.newReading.lastBefore + 1 && m.newReading.statusTime === m.newReading.latestAfter &&
        storedObj.follow === !m.defaults.follow && storedObj.switchOn === !m.defaults.switchOn && m.stored.lightsKeyStillSeparate &&
        m.persistedAfterReload.follow === !m.defaults.follow && m.persistedAfterReload.followBox === !m.defaults.follow &&
        m.persistedAfterReload.switchOn === !m.defaults.switchOn && m.persistedAfterReload.switchOnBox === !m.defaults.switchOn && m.tunerOffIgnoresStored;
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
    // With motion (no reduced motion), still from file://: the tuner's "Replay load" runs the load again, lights
    // included (the default "switch on at load").
    {
      const { context: c3, page: p3, errors: e3 } = await newPage({ motion: true });
      await p3.goto(`${FILE_URL}?lang=ar`, { waitUntil: "networkidle" });
      await p3.waitForFunction(() => window.__eclipse?.motion?.introStarted && !window.__eclipse.motion.introActive, null, { timeout: 10000 });
      await p3.click(".tuner-toggle");
      await p3.click("text=إعادة حركة الفتح");
      const r = await p3.evaluate(() => ({ introActive: window.__eclipse.motion.introActive, entranceClass: document.querySelectorAll(".is-entering").length, lightAnimations: document.getAnimations().filter((a) => { const x = a.effect?.target; return x && (x.closest?.(".lamp") || x.closest?.(".wash")); }).length, status: document.querySelector(".t-latest").textContent }));
      await p3.waitForFunction(() => !window.__eclipse.motion.introActive, null, { timeout: 10000 });
      r.settledAfter = await p3.evaluate(() => ({ entranceClass: document.querySelectorAll(".is-entering").length, pending: document.documentElement.dataset.lights || null }));
      r.errors = e3;
      r.pass = r.introActive && r.entranceClass === 1 && r.lightAnimations > 0 && r.settledAfter.entranceClass === 0 && !r.settledAfter.pending && e3.length === 0;
      t.replayFromFile = r;
      await c3.close();
    }
    tunerCheck = t;
    console.log(`tuner file:// check: ${t.pass ? "pass" : "FAIL"} (--now-int ${t.before["--now-int"]} -> ${t.after["--now-int"]}, changed px ${t.pixelsChanged.changedPixels}, copy ${t.copyClipboard.validJson}/${t.copyFallback.validJson}, presets ${t.presetV2.preset}/${t.presetRecommended.preset}, drag ${t.drag.pass}); motion group: ${t.motionGroup.pass ? "pass" : "FAIL"}; replay from file:// with motion: ${t.replayFromFile.pass ? "pass" : "FAIL"}`);
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
};
const allTrue = (o, k) => Object.values(o).every((v) => v[k] === true || v.expectedToChange);
const motionSummary = {
  method: "Pre-motion frames: evidence/pre-motion-hashes.json (SHA-256 of the v3 frames before motion). The capture is byte-deterministic, so equal hashes mean identical pixels.",
  staticFramesIdentical: MOTION_ONLY ? "not run (--motion-only)" : allTrue(identity.staticFrames, "identical"),
  motionOffFramesIdentical: allTrue(identity.motionOffFrames, "identical"),
  settledMotionFramesIdenticalWithPulseHidden: allTrue(identity.motionSettled, "identicalWithPulseHidden"),
  settledDomEqualsMotionOff: allTrue(identity.motionSettled, "domEqualsMotionOff"),
  liveUpdateEndsAtCanonical: identity.liveUpdateEndsAtCanonical,
  identity,
  ...motionLog,
};
if (MOTION_ONLY) console.log(JSON.stringify({ ...motionSummary, identity: undefined, spec: undefined }, null, 1));
else await writeFile(join(OUT, "capture-log.json"), `${JSON.stringify({ capturedAt: new Date().toISOString(), port: PORT, motion: motionSummary, lightMeasurement: { method: "OKLab L relative to the card's own base on light-only 1x captures (content hidden); see capture.mjs measure()", targets, presets: lights, calibration }, tunerFileCheck: tunerCheck, frames: log }, null, 2)}\n`);
const bad = log.filter((e) => e.fontsOk === false || e.overflowX > 0 || (e.overflowY > 0 && !e.fullPage && e.frame !== "keyboard-ar") || (e.spill && e.spill.length) || (e.errors && e.errors.length) || e.easternDigits || e.enDashInArabic || (e.checks && (e.checks.overshoot || !e.checks.withinAverage || !e.checks.zeroKept || !e.checks.lineStopsAtGap || !e.checks.lineEndsAtLast || Math.abs(e.checks.crestMinusPeakMinutes) > 5)));
console.log(bad.length ? `\n${bad.length} frame(s) need attention: ${bad.map((e) => e.frame).join(", ")}` : "\nAll frames: no overflow or spill, fonts loaded, no errors, Western digits only, line checks pass.");
if (!tunerCheck?.pass) console.log("Tuner file:// check did not pass; see tunerFileCheck in the log.");
if (!tunerCheck?.motionGroup?.pass) console.log("Tuner Motion group check did not pass; see tunerFileCheck.motionGroup.");
if (!tunerCheck?.replayFromFile?.pass) console.log("Tuner replay from file:// with motion did not pass; see tunerFileCheck.replayFromFile.");
// The static guard: with reduced motion (the static frames) and with ?motion=off, every frame except tuner-open
// must equal its pre-motion frame. A difference fails the run (exit code 1).
const changed = Object.entries(identity.staticFrames).filter(([, v]) => !v.identical && !v.expectedToChange).map(([k]) => k);
const changedOff = Object.entries(identity.motionOffFrames).filter(([, v]) => !v.identical).map(([k]) => k);
if (!MOTION_ONLY) console.log(changed.length ? `STATIC GUARD FAILED (reduced motion): ${changed.join(", ")}` : `Static guard, reduced motion: all ${Object.keys(identity.staticFrames).length - 1} frames identical to the pre-motion frames (tuner-open changes as expected).`);
console.log(changedOff.length ? `STATIC GUARD FAILED (?motion=off): ${changedOff.join(", ")}` : `Static guard, ?motion=off: all ${Object.keys(identity.motionOffFrames).length} frames identical to the pre-motion frames.`);
if (changed.length || changedOff.length || !tunerCheck?.pass || !tunerCheck?.motionGroup?.pass || !tunerCheck?.replayFromFile?.pass || bad.length) process.exitCode = 1;
