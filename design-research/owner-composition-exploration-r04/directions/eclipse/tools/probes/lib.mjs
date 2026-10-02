// Maintained Eclipse harness. Provenance and compatibility differences: README.md.
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { existsSync, realpathSync, lstatSync, readlinkSync } from "node:fs";
import { readFile, mkdir, writeFile, stat } from "node:fs/promises";
import { dirname, resolve, relative, isAbsolute, extname, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";

const kit = dirname(fileURLToPath(import.meta.url));
let enclosing = kit;
while (!existsSync(resolve(enclosing, "package.json"))) {
  const parent = dirname(enclosing);
  if (parent === enclosing) throw new Error("No enclosing worktree package.json");
  enclosing = parent;
}
const require = createRequire(resolve(enclosing, "package.json"));
export const { chromium } = require("@playwright/test");
export const WORKTREE = enclosing;
export const E = resolve(process.env.PROBE_ECLIPSE || resolve(kit, "../.."));
export const ROOT = E;
export const OUT = resolve(process.env.PROBE_OUT || "D:/fitway-temp/eclipse-probes");
export const FRAMES = OUT;
export const PORT = Number(process.env.PROBE_PORT || 3178);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) throw new Error("Invalid PROBE_PORT");
export const ORIGIN = `http://127.0.0.1:${PORT}`;
const variantsRoot = process.env.PROBE_VARIANTS_ROOT && resolve(process.env.PROBE_VARIANTS_ROOT);
const eclipseRelative = relative(WORKTREE, resolve(kit, "../.."));
const inside = (base, path) => {
  const rel = relative(base, path);
  return !isAbsolute(rel) && rel !== ".." && !rel.startsWith(`..${sep}`);
};

// Resolve existing ancestors so junctions/symlinks cannot hide a repository target.
function canonical(path, seen = new Set()) {
  let ancestor = resolve(path);
  let info;
  while (!info) {
    try { info = lstatSync(ancestor); }
    catch (error) {
      if (!["ENOENT", "ENOTDIR"].includes(error.code)) throw error;
      const parent = dirname(ancestor);
      if (parent === ancestor) throw new Error(`Cannot resolve output: ${path}`);
      ancestor = parent;
    }
  }
  if (info.isSymbolicLink()) {
    if (seen.has(ancestor)) throw new Error(`Output link cycle: ${path}`);
    seen.add(ancestor);
    const target = resolve(dirname(ancestor), readlinkSync(ancestor));
    return resolve(canonical(target, seen), relative(ancestor, resolve(path)));
  }
  return resolve(realpathSync(ancestor), relative(ancestor, resolve(path)));
}
export function assertOutsideGit(path) {
  const target = canonical(path);
  for (let dir = target;; dir = dirname(dir)) {
    if (existsSync(resolve(dir, ".git"))) throw new Error(`Refusing output inside git working tree: ${path}`);
    if (dirname(dir) === dir) return target;
  }
}
assertOutsideGit(OUT);
export async function outputPath(name) {
  const target = resolve(OUT, name);
  if (target === OUT || !inside(OUT, target)) throw new Error(`Output must be a file inside PROBE_OUT: ${name}`);
  assertOutsideGit(OUT);
  assertOutsideGit(target);
  if (!inside(canonical(OUT), canonical(target))) throw new Error(`Output escapes PROBE_OUT through a link: ${name}`);
  await mkdir(dirname(target), { recursive: true });
  assertOutsideGit(target);
  return target;
}
export const sha = (b) => createHash("sha256").update(b).digest("hex");
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function heldDelay(ms, pending) {
  return new Promise((done) => {
    const release = () => { clearTimeout(timer); pending.delete(release); done(); };
    const timer = setTimeout(release, ms);
    pending.add(release);
  });
}
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".png": "image/png", ".json": "application/json", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8", ".svg": "image/svg+xml" };
export const SRV = { cc: process.env.CACHE_CONTROL ?? "no-store", cond: false, fontHold: null, scriptDelay: 0, hook: null, fp: null };
export const SERVER_LOG = [];
export const setServerHook = (fn) => { SRV.hook = fn; };
export const subsetOf = (url) => /readex-pro-([\w-]+)\.woff2/.exec(url)?.[1] ?? null;
export function armFp() {
  let resolveFp;
  const promise = new Promise((r) => { resolveFp = r; });
  const fp = { promise, resolve: (epoch) => { fp.epoch = epoch; resolveFp(epoch); }, epoch: null };
  SRV.fp = fp;
  return fp;
}

// One server implementation for direct Eclipse URLs and named variant URLs.
export async function startServer({ dir = E, port = PORT, variants = {}, behavior = SRV } = {}) {
  const baseDir = resolve(dir);
  const origin = `http://127.0.0.1:${port}`;
  const hung = new Set();
  const sockets = new Set();
  const pending = new Set();
  let closing = false, releaseFirstPaint;
  const closed = new Promise((done) => { releaseFirstPaint = done; });
  const server = createServer(async (rq, res) => {
    const t0 = performance.now() + performance.timeOrigin;
    const entry = { t0, path: null, status: null, heldMs: 0 };
    SERVER_LOG.push(entry);
    const send = (status, headers = {}, body = "") => {
      entry.status = status;
      entry.t1 = performance.now() + performance.timeOrigin;
      entry.heldMs = entry.t1 - t0;
      if (!res.destroyed) res.writeHead(status, headers).end(body);
    };
    try {
      const url = new URL(rq.url ?? "/", origin);
      entry.path = url.pathname;
      entry.inm = rq.headers["if-none-match"] || null;
      entry.ims = rq.headers["if-modified-since"] || null;
      if (url.pathname === "/other.html") return send(200, { "content-type": TYPES[".html"] }, "<!doctype html><title>other</title><p>other page</p>");
      const hook = behavior.hook?.(url.pathname);
      if (hook === "404") return send(404, {}, "not found");
      if (hook === "hang") { entry.status = "hang"; hung.add(res); res.once("close", () => hung.delete(res)); return; }
      const decoded = decodeURIComponent(url.pathname);
      const parts = decoded.split("/").filter(Boolean);
      if (decoded.includes("\\") || parts.some((p) => p === ".." || p === "." || p.includes("\0"))) return send(403);
      let base = baseDir;
      const variant = parts[0];
      if (Object.hasOwn(variants, variant)) { base = resolve(variants[parts.shift()]); }
      else if (variant === "current") { parts.shift(); }
      else if (variantsRoot && variant && /^[A-Za-z0-9_-]+$/.test(variant) && existsSync(resolve(variantsRoot, variant, eclipseRelative))) {
        base = resolve(variantsRoot, parts.shift(), eclipseRelative);
      }
      const file = resolve(base, parts.join(sep) || "index.html");
      if (!inside(base, file)) return send(403);
      // Serve only the selected tree, including when a file is a symlink.
      if (!inside(realpathSync(base), realpathSync(file))) return send(403);
      const body = await readFile(file);
      const st = await stat(file);
      if (closing) { entry.status = "cancelled"; return; }
      if (/\.woff2$/.test(file) && behavior.fontHold != null) {
        const h = behavior.fontHold;
        if (typeof h === "number") await heldDelay(h, pending);
        else if (h.afterFp != null) {
          if (!behavior.fp) throw new Error("armFp() required for afterFp font hold");
          const epoch = await Promise.race([behavior.fp.promise, closed]);
          if (closing) { entry.status = "cancelled"; return; }
          const wait = epoch + h.afterFp - (performance.now() + performance.timeOrigin);
          if (wait > 0) await heldDelay(wait, pending);
          entry.fpEpoch = epoch;
        } else { const subset = subsetOf(file); if (subset && h[subset]) await heldDelay(h[subset], pending); }
      }
      if (closing) { entry.status = "cancelled"; return; }
      if (/app\.js$/.test(file) && behavior.scriptDelay) await heldDelay(behavior.scriptDelay, pending);
      if (closing) { entry.status = "cancelled"; return; }
      const headers = { "content-type": TYPES[extname(file)] ?? "application/octet-stream" };
      if (behavior.cc && behavior.cc !== "none") headers["cache-control"] = behavior.cc;
      if (behavior.cond) {
        const etag = `"${sha(body).slice(0, 16)}"`;
        const lm = new Date(Math.floor(st.mtimeMs / 1000) * 1000).toUTCString();
        if (behavior.cond !== "lm") headers.etag = etag;
        if (behavior.cond !== "etag") headers["last-modified"] = lm;
        const byEtag = headers.etag && entry.inm === etag;
        const byDate = headers["last-modified"] && !entry.inm && entry.ims && new Date(entry.ims) >= new Date(lm);
        if (byEtag || byDate) return send(304, headers);
      }
      send(200, headers, body);
    } catch (error) { entry.err = String(error); send(404, {}, "not found"); }
  });
  server.on("connection", (socket) => { sockets.add(socket); socket.once("close", () => sockets.delete(socket)); });
  const close = server.close.bind(server);
  server.close = (cb) => {
    closing = true;
    releaseFirstPaint();
    for (const release of pending) release();
    for (const res of hung) res.destroy();
    for (const socket of sockets) socket.destroy();
    return close(cb);
  };
  await new Promise((done, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => { server.removeListener("error", reject); done(); });
  });
  return server;
}
export const serve = (dir = E, port = PORT, { cache = "no-store", ...options } = {}) => startServer({ ...options, dir, port, behavior: { ...SRV, cc: cache } });
export const LOCAL_FONT_RE = new RegExp(`^http://127\\.0\\.0\\.1:${PORT}/(?:[^/]+/)?fonts/[^/?]+\\.woff2(\\?|$)`);
export const launch = (opts = {}) => chromium.launch(opts);
// Legacy compatibility: fonts are local; these source helpers were already no-ops.
export async function warmFonts() { return 0; }
export const fontSubsets = () => ({});
export async function newPage(browser, { width = 1440, height = 900, scale = 1, motion = true, fontCache = true, fontDelayMs = 0, initScript = null } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, reducedMotion: motion ? "no-preference" : "reduce", colorScheme: "dark" });
  const heldLog = [], errors = [], requests = [];
  const pending = new Set();
  let closed = false;
  context.on("close", () => { closed = true; for (const release of pending) release(); });
  try {
    if (fontDelayMs || !fontCache) await context.route(LOCAL_FONT_RE, async (route) => {
      if (closed) return;
      const url = route.request().url();
      const want = typeof fontDelayMs === "function" ? fontDelayMs(url) : fontDelayMs;
      const at = Date.now();
      if (want > 0) await heldDelay(want, pending);
      heldLog.push({ url, subset: subsetOf(url), heldMs: Date.now() - at, want });
      if (!closed) await route.continue();
    });
    if (initScript) await context.addInitScript(initScript);
    const page = await context.newPage();
    page.on("request", (r) => requests.push(r.url()));
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    page.on("console", (m) => errors.push(`console.${m.type()}: ${m.text()}`));
    return { context, page, errors, heldLog, requests };
  } catch (error) { await context.close(); throw error; }
}
export const urlOf = (variant = "", q = "", page = "index.html") => `${ORIGIN}/${variant ? `${encodeURIComponent(variant)}/` : ""}${page}${q ? `?${q}` : ""}`;
export const Q = (lang, state = "live", extra = "tuner=0") => `lang=${lang}${state === "live" ? "" : `&state=${state}`}${extra ? `&${extra}` : ""}`;
export const introSettled = (page, timeout = 15000) => page.waitForFunction(() => window.__eclipse?.intro && !["pending", "running"].includes(window.__eclipse.intro.state), null, { timeout });
export const introRunning = (page, timeout = 15000) => page.waitForFunction(() => ["running", "done", "off"].includes(window.__eclipse?.intro?.state), null, { timeout });
async function ready(page) {
  await page.waitForFunction(() => window.__reports?.ready === true || window.__eclipse?.ready === true, null, { timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
  if (await page.evaluate(() => Boolean(window.__eclipse?.intro))) await introSettled(page);
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
}
export async function openReports(browser, url, { motion = false, ...options } = {}) {
  const result = await newPage(browser, { ...options, motion });
  try { await result.page.goto(url, { waitUntil: "load" }); await ready(result.page); return result; }
  catch (error) { await result.context.close(); throw error; }
}
export async function open(browser, { page: pg = "index.html", lang = "ar", width = 1440, height = 900, motion = false, intro = false, q = "", dpr = 1, transport = "http", variant = "" } = {}) {
  if (!["http", "file"].includes(transport)) throw new Error("transport must be http or file");
  if (!inside(E, resolve(E, pg))) throw new Error("Page escapes PROBE_ECLIPSE");
  const query = new URLSearchParams(q);
  query.set("lang", lang);
  if (pg === "index.html") query.set("tuner", "0");
  const url = transport === "file" ? `${pathToFileURL(resolve(E, pg)).href}?${query}` : urlOf(variant, query.toString(), pg);
  const initScript = intro ? null : () => { try { sessionStorage.setItem("fitway.eclipse.v3.intro", "1"); } catch {} };
  return openReports(browser, url, { width, height, motion, scale: dpr, initScript });
}
export async function shot(page, name, options = {}) {
  if (Object.hasOwn(options, "path")) throw new Error("Use the shot name to choose a guarded output path");
  return page.screenshot({ ...options, path: await outputPath(`${name}.png`) });
}
export async function writeJson(path, obj) { await writeFile(await outputPath(path), `${JSON.stringify(obj, null, 1)}\n`, "utf8"); }
export const HIDE_PULSE = ".ping { visibility: hidden !important; }";
export const holdBySubset = (spec) => (url) => spec[subsetOf(url)] || 0;
export function holdProof(heldLog, spec) {
  const files = heldLog.filter((h) => h.subset);
  const perSubset = Object.fromEntries(Object.keys(spec).map((s) => [s, files.filter((h) => h.subset === s).map((h) => h.heldMs)]));
  const ok = files.some((h) => h.want > 0) && Object.entries(spec).every(([s, ms]) => perSubset[s].length > 0 && perSubset[s].every((x) => x >= ms - 2));
  return { perSubset, ok };
}
export const med = (v) => { const s = v.filter((x) => x != null && !Number.isNaN(x)).sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : null; };
export const rng = (v) => { const s = v.filter((x) => x != null && !Number.isNaN(x)); return s.length ? `${med(s).toFixed(1)} [${Math.min(...s).toFixed(1)}-${Math.max(...s).toFixed(1)}]` : "-"; };

// Browser-side function: call page.evaluate(overflowProbe).
export const overflowProbe = () => {
  const de = document.documentElement, vw = de.clientWidth;
  const out = { docScrollW: de.scrollWidth, clientW: vw, hScroll: de.scrollWidth > vw };
  const clipped = [];
  for (const el of document.querySelectorAll("body *")) {
    if (el.closest("[hidden], .sr-only, dialog:not([open]), .rail")) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    if (el.classList.contains("hv") && !el.closest(".show-n") && el.closest(".hc.v")) continue;
    if (el.classList.contains("run") && el.closest(".is-one")) continue;
    if ((cs.overflow === "hidden" || cs.overflowX === "hidden" || cs.textOverflow === "ellipsis") && el.scrollWidth > el.clientWidth + 1 && el.children.length === 0) clipped.push({ el: el.className || el.tagName, sw: el.scrollWidth, cw: el.clientWidth });
    const r = el.getBoundingClientRect();
    if (r.width && (r.right > vw + 0.5 || r.left < -0.5) && !el.closest(".heat-scroll")) clipped.push({ el: (el.id ? "#" + el.id : "") + "." + String(el.className).split(" ")[0], spill: [Math.round(r.left), Math.round(r.right)] });
  }
  for (const el of document.querySelectorAll(".stat-head, .stat-foot, .stat-value, .head-meta, .pattern-head, .days-head, .dlg-foot, .field-row, .file-line")) {
    if (el.closest("[hidden], dialog:not([open])")) continue;
    if (el.scrollWidth > el.clientWidth + 1) clipped.push({ el: el.className, overflow: el.scrollWidth - el.clientWidth });
  }
  out.problems = clipped.slice(0, 20);
  return out;
};
export { geometryProbe } from "./geom.mjs";
export { accessibilityProbe } from "./a11y.mjs";
