// Adapted from the independent verifier's lib.mjs, 2026-09-28. Definitions retained.
import { createRequire } from 'node:module';
import { plantPage } from './plants.mjs';
const require = createRequire(import.meta.url);
export const { chromium } = require('@playwright/test');
const FONT_CACHE = new Map();
async function serveFont(route) {
  const url = route.request().url();
  let hit = FONT_CACHE.get(url);
  if (!hit) {
    const resp = await route.fetch();
    const headers = Object.fromEntries(Object.entries(resp.headers()).filter(([k]) => !["content-encoding", "content-length", "transfer-encoding"].includes(k.toLowerCase())));
    hit = { status: resp.status(), headers, body: await resp.body() };
    if (resp.ok()) FONT_CACHE.set(url, hit);
  }
  await route.fulfill(hit);
}

// Virtual time: performance.now, requestAnimationFrame and target-less Animation clocks advance only on __vt.tick(ms).
export const VT_INIT = `(() => {
  const V = { t: 1000, id: 0, anims: new Set(), raf: new Map() };
  performance.now = () => V.t;
  window.requestAnimationFrame = (cb) => { const id = ++V.id; V.raf.set(id, cb); return id; };
  window.cancelAnimationFrame = (id) => { V.raf.delete(id); };
  const N = window.Animation;
  class VA extends N {
    play() { N.prototype.play.call(this); N.prototype.pause.call(this); if (!this.__v) { this.__v = { start: V.t, held: false }; V.anims.add(this); } this.currentTime = Math.max(0, V.t - this.__v.start); }
    pause() { if (this.__v) this.__v.held = true; N.prototype.pause.call(this); }
    cancel() { V.anims.delete(this); N.prototype.cancel.call(this); }
    finish() { V.anims.delete(this); N.prototype.finish.call(this); }
  }
  window.Animation = VA;
  V.advance = (ms) => {
    V.t += ms;
    for (const a of [...V.anims]) {
      if (a.__v.held) continue;
      const end = a.effect.getComputedTiming().endTime, ct = V.t - a.__v.start;
      if (ct >= end) { V.anims.delete(a); N.prototype.finish.call(a); } else a.currentTime = ct;
    }
  };
  V.runRaf = () => { const cbs = [...V.raf.values()]; V.raf.clear(); for (const cb of cbs) cb(V.t); };
  V.tick = async (ms) => { V.advance(ms); for (let i = 0; i < 6; i++) await null; V.runRaf(); for (let i = 0; i < 6; i++) await null; };
  window.__vt = V;
})();`;

export async function openPage(browser, { ver, lang = "ar", state = "live", width = 1440, height = 900, motion = false, fonts = "web", vt = false, extra = "", origin, plant = null }) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: motion ? "no-preference" : "reduce", colorScheme: "dark" });
  if (fonts === "web") await context.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (r) => serveFont(r));
  else await context.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (r) => r.abort());
  // No first-open intro: the tab has been opened before.
  await context.addInitScript(() => { try { sessionStorage.setItem("fitway.eclipse.v3.intro", "1"); } catch (e) {} });
  if (vt) await context.addInitScript(VT_INIT);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });
  const q = `lang=${lang}&state=${state}&tuner=0${extra}`;
  await page.goto(`${origin}/index.html?${q}`, { waitUntil: fonts === "web" ? "networkidle" : "load" });
  await page.waitForFunction(() => window.__eclipse?.ready === true);
  await page.evaluate(() => document.fonts.ready);
  const fontOk = await page.evaluate(() => document.fonts.check('500 16px "Readex Pro"', "0123") && [...document.fonts].some((f) => f.family.includes("Readex") && f.status === "loaded"));
  if (fonts === 'web' && !fontOk) throw new Error('Readex Pro web font did not load; the web-font case cannot use fallback');
  await plantPage(page, plant);
  return { context, page, errors, fontOk };
}

// In-page measurement of the tooltip and its geometry (plot-relative), usable in page.evaluate.
export const MEASURE_FN = `window.__vm = function () {
  const plot = document.querySelector("#plot"), tip = document.querySelector("#tip"), pr = plot.getBoundingClientRect();
  const end = document.querySelector("#end-dot"), eb = end.getBoundingClientRect();
  const ex = eb.left + eb.width / 2 - pr.left, ey = eb.top + eb.height / 2 - pr.top;
  const out = { W: Math.round(plot.clientWidth), H: Math.round(plot.clientHeight), ex, ey, ecx: Number(end.getAttribute("cx")), ecy: Number(end.getAttribute("cy")), hidden: tip.hidden };
  if (tip.hidden) return out;
  const b = tip.getBoundingClientRect();
  out.l = b.left - pr.left; out.t = b.top - pr.top; out.w = b.width; out.h = b.height; out.r = out.l + out.w; out.b = out.t + out.h;
  out.sl = parseFloat(tip.style.left); out.st = parseFloat(tip.style.top);
  const dx = Math.max(out.l - ex, 0, ex - out.r), dy = Math.max(out.t - ey, 0, ey - out.b);
  out.d = Math.hypot(dx, dy);
  const mk = document.querySelector("#sel .sg-mark");
  if (mk) { const m = /translate\\(([-\\d.]+) ([-\\d.]+)\\)/.exec(mk.getAttribute("transform")); if (m) { out.mx = Number(m[1]); out.my = Number(m[2]); } out.mform = mk.dataset.form; }
  const lit = document.querySelector("#sel .sg-lit"); if (lit) out.hx = Number(lit.getAttribute("x"));
  const v = tip.querySelector(".tip-v");
  if (v) { const vb = v.getBoundingClientRect(); out.vs = (document.documentElement.dir === "rtl" ? vb.right : vb.left) - pr.left; }
  out.text = tip.textContent;
  out.tipw = tip.style.getPropertyValue("--tip-w");
  out.sw = tip.scrollWidth; out.cw = tip.clientWidth; out.sh = tip.scrollHeight; out.ch = tip.clientHeight;
  out.sel = window.__eclipse.chart.selected;
  return out;
};
// The tooltip's natural (max-content) size for the content it shows now: an independent clone, removed at once.
window.__vnat = function () {
  const plot = document.querySelector("#plot"), tip = document.querySelector("#tip");
  const c = tip.cloneNode(true); c.removeAttribute("id"); c.hidden = false;
  c.style.cssText = "position:absolute;left:0;top:0;visibility:hidden;width:max-content;min-width:0";
  plot.appendChild(c); const b = c.getBoundingClientRect(); c.remove();
  return { nw: b.width, nh: b.height, numbered: Boolean(tip.querySelector(".tip-v, .tip-u")) };
};`;
