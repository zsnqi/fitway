// Verifier's marker geometry for Eclipse Round 7 step 1, both forms (A, B), AR and EN, live / nohistory / delayed.
// For every stop (reduced motion, so the marker is at rest at once): the marker element, its centre from the DOM
// transform and from the rendered core box, its distance to the drawn SVG paths sampled every 0.2 px, the peak and
// end point, the elements drawn (to find guides or ticks), the hairline, the tooltip, and two 3x screenshots of the
// region around it (marker shown / marker hidden, tooltip hidden in both) for a pixel-level check in Python.
// Usage: node geom7.mjs <outDir> [forms=a,b] [langs=ar,en] [states=live,nohistory,delayed]
import { chromium } from "file:///D:/Projects/fitway-worktrees/owner-design-exploration-r04/node_modules/@playwright/test/index.mjs";
import { writeFileSync, mkdirSync } from "node:fs";
const BASE = process.env.BASE ?? "file:///D:/Projects/fitway-worktrees/owner-design-exploration-r04/design-research/owner-composition-exploration-r04/directions/eclipse/index.html";
const OUT = process.argv[2];
const FORMS = (process.argv[3] ?? "a,b").split(",");
const LANGS = (process.argv[4] ?? "ar,en").split(",");
const STATES = (process.argv[5] ?? "live,nohistory,delayed").split(",");
const SHIFT = Number(process.env.SHIFT ?? 0); // control: move the drawn marker by this many px in x and y after painting
mkdirSync(`${OUT}/px`, { recursive: true });
const S = 3, HALF = 50;
const b = await chromium.launch();
const res = {};
const HELPERS = () => {
  const samples = new Map();
  window.__v = {
    pts(path) {
      if (samples.has(path)) return samples.get(path);
      const L = path.getTotalLength(), out = [];
      for (let l = 0; l <= L; l += 0.2) { const p = path.getPointAtLength(l); out.push([p.x, p.y]); }
      const e = path.getPointAtLength(L); out.push([e.x, e.y]);
      samples.set(path, out); return out;
    },
    dist(x, y, paths) { let best = Infinity; for (const p of paths) for (const [px, py] of this.pts(p)) { const d = Math.hypot(px - x, py - y); if (d < best) best = d; } return best; },
    near(x, y, paths, r) { const o = []; for (const p of paths) for (const [px, py] of this.pts(p)) if (Math.abs(px - x) < r && Math.abs(py - y) < r) o.push([+px.toFixed(3), +py.toFixed(3)]); return o; },
  };
};
for (const form of FORMS) for (const lang of LANGS) for (const state of STATES) {
  const key = `${form}-${lang}-${state}`;
  const q = `lang=${lang}&tuner=0&marker=${form}${state === "live" ? "" : `&state=${state}`}`;
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: S, reducedMotion: "reduce", colorScheme: "dark" });
  const p = await ctx.newPage();
  const errors = []; p.on("pageerror", (e) => errors.push(String(e))); p.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await p.goto(`${BASE}?${q}`, { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  await p.evaluate(HELPERS);
  await p.addStyleTag({ content: ".tip { visibility: hidden !important; }" });
  const api = await p.evaluate(() => ({ marker: window.__eclipse.chart.marker, markerFromUrl: window.__eclipse.chart.markerFromUrl, n: window.__eclipse.chart.stops.length }));
  const stops = await p.evaluate(() => window.__eclipse.chart.stops);
  const rows = [];
  for (const st of stops) {
    const row = await p.evaluate(([k, SHIFT]) => {
      const V = window.__v;
      const svg = document.querySelector("#plot-svg svg"), sr = svg.getBoundingClientRect();
      window.__eclipse.chart.select(k);
      const mk = document.querySelector("#sel .sg-mark");
      if (mk && SHIFT) { const m = /translate\(([-\d.]+)[ ,]+([-\d.]+)\)/.exec(mk.getAttribute("transform")); mk.setAttribute("transform", `translate(${+m[1] + SHIFT} ${+m[2] + SHIFT})`); }
      const tip = document.getElementById("tip");
      const lines = [...document.querySelectorAll('#plot-svg path[id^="ln-"]')], usual = [...document.querySelectorAll("#us-ahead, #us-past")];
      const pk = document.getElementById("pk-dot"), end = document.getElementById("end-dot"), halo = document.getElementById("end-halo");
      const axisY = Math.round(parseFloat(svg.getAttribute("height")) - 36) + 0.5; // render(): yb = H - 36, axis = round(Y(0)) + 0.5
      const kids = [...document.querySelectorAll("#sel *, #sel-under *")].filter((n) => !["defs", "stop", "linearGradient", "radialGradient", "filter", "feGaussianBlur", "feComponentTransfer", "feFuncA", "mask"].includes(n.tagName) && !n.closest("defs, mask, filter"));
      const els = kids.map((n) => {
        let bb = null; try { const bx = n.getBBox(); const ctm = n.getCTM(), sctm = svg.getCTM ? svg.getCTM() : null; bb = { x: bx.x, y: bx.y, w: bx.width, h: bx.height }; if (ctm) { const pt = svg.createSVGPoint(); pt.x = bx.x; pt.y = bx.y; const a = pt.matrixTransform(ctm); pt.x = bx.x + bx.width; pt.y = bx.y + bx.height; const c = pt.matrixTransform(ctm); const inv = svg.getScreenCTM().inverse(); bb = { x: a.x, y: a.y, w: c.x - a.x, h: c.y - a.y }; } } catch (e) { /* */ }
        const cs = getComputedStyle(n);
        return { tag: n.tagName, cls: n.getAttribute("class"), parent: n.parentElement.id || n.parentElement.getAttribute("class"), fill: n.getAttribute("fill"), stroke: n.getAttribute("stroke"), strokeWidth: n.getAttribute("stroke-width"), r: n.getAttribute("r"), opacity: n.getAttribute("opacity"), filter: n.getAttribute("filter"), dash: n.getAttribute("stroke-dasharray"), bbox: bb, vis: cs.visibility };
      });
      const out = { key: k, tipHidden: tip.hidden, tipText: tip.innerText.replace(/\s+/g, " ").trim(), tipV: tip.querySelector(".tip-v")?.textContent.trim() ?? null, haloVisibility: halo ? halo.getAttribute("visibility") : "no-halo", els, axisY, svgLeft: sr.x, svgTop: sr.y };
      if (!mk) { const tick = document.querySelector("#sel .sg-tick"); out.tick = tick ? tick.getAttribute("d") : null; return out; }
      const m = /translate\(([-\d.]+)[ ,]+([-\d.]+)\)/.exec(mk.getAttribute("transform"));
      const x = Number(m[1]), y = Number(m[2]);
      const core = mk.querySelector(".sg-core");
      let cx = null, cy = null, coreR = null;
      if (core) { const r = core.getBoundingClientRect(); cx = r.x + r.width / 2 - sr.x; cy = r.y + r.height / 2 - sr.y; coreR = core.getAttribute("r"); }
      Object.assign(out, { form: mk.dataset.form, markerAttr: mk.dataset.marker, x, y, cx, cy, coreR, coreFill: core?.getAttribute("fill"), coreStroke: core?.getAttribute("stroke"), coreStrokeW: core?.getAttribute("stroke-width") });
      out.coreVsTransform = cx == null ? null : Math.hypot(cx - x, cy - y);
      out.distLine = V.dist(x, y, lines);
      out.distUsual = usual.length ? V.dist(x, y, usual) : null;
      if (pk) out.distPeakDot = Math.hypot(x - +pk.getAttribute("cx"), y - +pk.getAttribute("cy"));
      if (end) out.distEndDot = Math.hypot(x - +end.getAttribute("cx"), y - +end.getAttribute("cy"));
      out.pathNear = V.near(x, y, out.form === "usual" ? usual : lines, 55);
      out.peakDot = pk ? [+pk.getAttribute("cx"), +pk.getAttribute("cy")] : null;
      out.endDot = end ? [+end.getAttribute("cx"), +end.getAttribute("cy")] : null;
      return out;
    }, [st.key, SHIFT]);
    // pixel clips
    const cxp = row.x ?? (st.clientX - row.svgLeft);
    const cyp = row.y ?? row.axisY;
    const clip = { x: Math.round(row.svgLeft + cxp - HALF), y: Math.round(row.svgTop + cyp - HALF), width: 2 * HALF, height: 2 * HALF };
    row.clip = clip;
    const base = `${OUT}/px/${key}-${st.key}`;
    await p.screenshot({ path: `${base}-on.png`, clip });
    await p.addStyleTag({ content: "#sel, #sel-under { visibility: hidden !important; }" }).then((h) => p.evaluate((el) => { el.id = "__hide"; }, h));
    await p.screenshot({ path: `${base}-off.png`, clip });
    // column from the marker to below the axis, 8px wide, for the hairline
    const colClip = { x: Math.round(row.svgLeft + cxp - 4), y: Math.round(row.svgTop + cyp - 60), width: 8, height: Math.max(8, Math.round(row.axisY - cyp + 68)) };
    row.colClip = colClip;
    await p.screenshot({ path: `${base}-coloff.png`, clip: colClip });
    await p.evaluate(() => document.getElementById("__hide").remove());
    await p.screenshot({ path: `${base}-colon.png`, clip: colClip });
    rows.push({ ...row, kind: st.kind, time: st.time, apiValue: st.value, track: st.track });
  }
  await p.evaluate(() => window.__eclipse.chart.clear());
  const afterClear = await p.evaluate(() => ({ sel: document.getElementById("sel").innerHTML.length, under: document.getElementById("sel-under").innerHTML.length, halo: document.getElementById("end-halo")?.getAttribute("visibility") ?? "no-halo" }));
  res[key] = { q, api, errors, afterClear, rows };
  await ctx.close();
  console.log(key, rows.length, "errors", errors.length);
}
await b.close();
writeFileSync(`${OUT}/geom.json`, JSON.stringify(res));
console.log("done");
