// Coordinator's independent hover check. For every stop: the marker's rendered centre (from the DOM) against the
// drawn SVG paths sampled densely (min Euclidean distance), the tooltip number against the value read back from the
// marker's height on the y axis labels, snapping by pointer, keyboard order, and the glide staying on the curve.
import { chromium } from "file:///D:/Projects/fitway-worktrees/owner-design-exploration-r04/node_modules/@playwright/test/index.mjs";
import { writeFileSync } from "node:fs";
const BASE = "file:///D:/Projects/fitway-worktrees/owner-design-exploration-r04/design-research/owner-composition-exploration-r04/directions/eclipse/index.html";
const OUT = process.argv[2];
const b = await chromium.launch();
const res = {};

// In-page helpers, installed once per page.
const HELPERS = () => {
  const svg = document.querySelector("#plot-svg svg");
  const samples = new Map();
  window.__c = {
    pts(path) {
      if (samples.has(path)) return samples.get(path);
      const L = path.getTotalLength(), out = [];
      for (let l = 0; l <= L; l += 0.2) { const p = path.getPointAtLength(l); out.push([p.x, p.y]); }
      samples.set(path, out); return out;
    },
    dist(x, y, paths) {
      let best = Infinity;
      for (const p of paths) for (const [px, py] of this.pts(p)) { const d = Math.hypot(px - x, py - y); if (d < best) best = d; }
      return best;
    },
    yAtX(x, paths) { // the drawn line's y at x (nearest sample in x)
      let best = null, bd = Infinity;
      for (const p of paths) for (const [px, py] of this.pts(p)) { const d = Math.abs(px - x); if (d < bd) { bd = d; best = py; } }
      return bd < 0.3 ? best : null;
    },
    axis() {
      const ys = [...document.querySelectorAll("#plot-labels .ax-y")].map((s) => ({ v: Number(s.textContent.trim()), y: parseFloat(s.style.top) }));
      const a = ys.find((s) => s.v === 0), z = ys.find((s) => s.v === 80);
      return (y) => (80 * (a.y - y)) / (a.y - z.y);
    },
    marker() {
      const mk = document.querySelector("#sel .sg-mark");
      if (!mk) return null;
      const m = /translate\(([-\d.]+)[ ,]+([-\d.]+)\)/.exec(mk.getAttribute("transform"));
      // cross-check with the core's rendered box
      const core = mk.querySelector(".sg-core"), sr = document.querySelector("#plot-svg svg").getBoundingClientRect();
      let cx = null, cy = null;
      if (core) { const r = core.getBoundingClientRect(); cx = r.x + r.width / 2 - sr.x; cy = r.y + r.height / 2 - sr.y; }
      return { form: mk.dataset.form, x: Number(m[1]), y: Number(m[2]), cx, cy };
    },
  };
};

async function open(q, motion) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: motion ? "no-preference" : "reduce", colorScheme: "dark" });
  const p = await ctx.newPage();
  const errors = []; p.on("pageerror", (e) => errors.push(String(e)));
  await p.goto(`${BASE}?${q}`); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600);
  await p.evaluate(HELPERS);
  return { ctx, p, errors };
}

for (const lang of ["ar", "en"]) for (const state of ["live", "nohistory", "delayed"]) {
  const q = `lang=${lang}&tuner=0${state === "live" ? "" : `&state=${state}`}`;
  const { ctx, p, errors } = await open(q, false);
  const rows = await p.evaluate(() => {
    const C = window.__c, val = C.axis();
    const lines = [...document.querySelectorAll('#plot-svg path[id^="ln-"]')], usual = [...document.querySelectorAll("#us-ahead, #us-past")];
    const pk = document.getElementById("pk-dot"), end = document.getElementById("end-dot");
    return window.__eclipse.chart.stops.map((st) => {
      window.__eclipse.chart.select(st.key);
      const mk = C.marker();
      const tipEl = document.getElementById("tip");
      const tipV = tipEl.querySelector(".tip-v")?.textContent.trim() ?? null;
      const row = { key: st.key, kind: st.kind, time: st.time, apiValue: st.value, tipV, tipTime: tipEl.querySelector(".tip-t")?.innerText.replace(/\s+/g, " ").trim(), tipHidden: tipEl.hidden, form: mk?.form ?? null };
      if (!mk) return row;
      row.x = +mk.x.toFixed(2); row.y = +mk.y.toFixed(2);
      row.coreVsTransform = mk.cx == null ? null : +Math.hypot(mk.cx - mk.x, mk.cy - mk.y).toFixed(3);
      if (mk.form === "line" || mk.form === "drop") {
        row.distToLine = +C.dist(mk.x, mk.y, lines).toFixed(3);
        const ly = C.yAtX(mk.x, lines);
        row.valueFromLineY = ly == null ? null : +val(ly).toFixed(2);
        row.valueFromMarkerY = +val(mk.y).toFixed(2);
      } else if (mk.form === "peak") {
        row.distToPeakDot = +Math.hypot(mk.x - Number(pk.getAttribute("cx")), mk.y - Number(pk.getAttribute("cy"))).toFixed(3);
        row.valueFromMarkerY = +val(mk.y).toFixed(2);
      } else if (mk.form === "usual") {
        row.distToUsual = +C.dist(mk.x, mk.y, usual).toFixed(3);
        row.valueFromMarkerY = +val(mk.y).toFixed(2);
      }
      if (st.kind === "latest" && end) row.distToEndDot = +Math.hypot(mk.x - Number(end.getAttribute("cx")), mk.y - Number(end.getAttribute("cy"))).toFixed(3);
      return row;
    });
  });
  // Pointer snapping: sweep the plot every 3px.
  const snap = await (async () => {
    const box = await p.evaluate(() => { const r = document.getElementById("plot-hit").getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
    const stops = await p.evaluate(() => window.__eclipse.chart.stops.map((s) => ({ key: s.key, kind: s.kind, x: s.clientX })));
    const bad = []; let n = 0;
    for (let x = box.x + 1; x < box.x + box.w - 1; x += 3) {
      await p.mouse.move(x, box.y + box.h / 2); n++;
      const k = await p.evaluate(() => window.__eclipse.chart.selected);
      const near = stops.slice().sort((a, c) => Math.abs(a.x - x) - Math.abs(c.x - x))[0];
      const magnet = stops.filter((s) => (s.kind === "peak" || s.kind === "latest") && Math.abs(s.x - x) <= 10).sort((a, c) => Math.abs(a.x - x) - Math.abs(c.x - x))[0];
      const expect = magnet ? magnet.key : near.key;
      const lo = Math.min(...stops.map((s) => s.x)) - 16, hi = Math.max(...stops.map((s) => s.x)) + 16;
      if (x < lo || x > hi) { if (k !== null) bad.push({ x: +x.toFixed(1), got: k, expect: null }); continue; }
      if (k !== expect) bad.push({ x: +x.toFixed(1), got: k, expect });
    }
    await p.mouse.move(700, 880);
    return { samples: n, mismatches: bad.slice(0, 12), mismatchCount: bad.length };
  })();
  // Keyboard: Home, then the later arrow through every stop.
  const keys = await (async () => {
    await p.focus("#plot-hit");
    await p.keyboard.press("Home");
    const order = [await p.evaluate(() => window.__eclipse.chart.selected)];
    const later = lang === "ar" ? "ArrowLeft" : "ArrowRight";
    const n = await p.evaluate(() => window.__eclipse.chart.stops.length);
    for (let i = 0; i < n + 1; i++) { await p.keyboard.press(later); order.push(await p.evaluate(() => window.__eclipse.chart.selected)); }
    const expected = await p.evaluate(() => window.__eclipse.chart.stops.map((s) => s.key));
    await p.keyboard.press("End");
    const end = await p.evaluate(() => window.__eclipse.chart.selected);
    return { orderMatches: JSON.stringify(order.slice(0, expected.length)) === JSON.stringify(expected), lastRepeats: order[order.length - 1] === expected[expected.length - 1], endKey: end };
  })();
  res[`${lang}-${state}`] = { rows, snap, keys, errors };
  await ctx.close();
}

// Glide along the curve (motion on): sample the marker every animation frame between pairs of stops.
for (const lang of ["ar", "en"]) {
  const { ctx, p, errors } = await open(`lang=${lang}&tuner=0`, true);
  const pairs = await p.evaluate(() => {
    const s = window.__eclipse.chart.stops, k = (kind) => s.findIndex((x) => x.kind === kind);
    const iP = k("peak"), iL = k("latest"), iG = k("gap");
    return [[s[20].key, s[21].key], [s[iP - 1].key, s[iP].key], [s[iP].key, s[iP + 1].key], [s[iL - 1].key, s[iL].key], [s[iL].key, s[iL - 1].key], [s[iG - 1].key, s[iG].key], [s[iG - 1].key, s[iG + 1].key], [s[iL].key, s[iL + 1].key], [s[5].key, s[6].key]];
  });
  const glides = [];
  for (const [a, c] of pairs) {
    const r = await p.evaluate(async ([a, c]) => {
      const C = window.__c;
      window.__eclipse.chart.select(a);
      await new Promise((r) => setTimeout(r, 300));
      const lines = [...document.querySelectorAll('#plot-svg path[id^="ln-"]')], usual = [...document.querySelectorAll("#us-ahead, #us-past")];
      const pk = document.getElementById("pk-dot"), pkx = Number(pk.getAttribute("cx")), pky = Number(pk.getAttribute("cy"));
      const t0 = performance.now();
      window.__eclipse.chart.select(c);
      const started = window.__eclipse.chart.glideActive;
      const S = [];
      await new Promise((res) => {
        const tick = () => {
          const mk = C.marker();
          if (mk) S.push({ t: performance.now() - t0, form: mk.form, x: mk.x, y: mk.y });
          if (performance.now() - t0 < 260) requestAnimationFrame(tick); else res();
        };
        requestAnimationFrame(tick);
      });
      let maxOff = 0, lastMove = 0, prev = null;
      for (const s of S) {
        let d;
        if (s.form === "line") d = C.dist(s.x, s.y, lines);
        else if (s.form === "usual") d = C.dist(s.x, s.y, usual);
        else if (s.form === "drop" || s.form === "peak") d = Math.abs(s.x - pkx) < 0.05 ? 0 : C.dist(s.x, s.y, lines); // on the vertical drop into the ring
        else d = 0;
        maxOff = Math.max(maxOff, d);
        if (prev && Math.hypot(s.x - prev.x, s.y - prev.y) > 0.01) lastMove = s.t;
        prev = s;
      }
      return { from: a, to: c, glided: started, frames: S.length, settledByMs: Math.round(lastMove), maxDistFromTrackPx: +maxOff.toFixed(3), forms: [...new Set(S.map((s) => s.form))] };
    }, [a, c]);
    glides.push(r);
  }
  res[`glide-${lang}`] = { glides, errors };
  await ctx.close();
}
await b.close();
writeFileSync(`${OUT}/hover.json`, JSON.stringify(res, null, 1));
// Summary
for (const [k, v] of Object.entries(res)) {
  if (k.startsWith("glide")) { console.log(k, JSON.stringify(v.glides.map((g) => `${g.from}->${g.to}: glided=${g.glided} ${g.settledByMs}ms off=${g.maxDistFromTrackPx} ${g.forms.join("/")}`)), "errors", v.errors.length); continue; }
  const rows = v.rows;
  const maxLine = Math.max(0, ...rows.filter((r) => r.distToLine != null).map((r) => r.distToLine));
  const maxUs = Math.max(0, ...rows.filter((r) => r.distToUsual != null).map((r) => r.distToUsual));
  const valMis = rows.filter((r) => r.tipV != null && r.valueFromLineY != null && Math.abs(Number(r.tipV) - r.valueFromLineY) > 0.55).map((r) => `${r.key}:${r.tipV}vs${r.valueFromLineY}`);
  console.log(k, "stops", rows.length, "maxDistToLine", maxLine, "maxDistToUsual", maxUs, "peak", JSON.stringify(rows.filter((r) => r.kind === "peak").map((r) => [r.form, r.distToPeakDot, r.tipV])), "latest", JSON.stringify(rows.filter((r) => r.kind === "latest").map((r) => [r.form, r.distToEndDot, r.tipV, r.valueFromMarkerY])), "gap", JSON.stringify(rows.filter((r) => r.kind === "gap").map((r) => [r.form, r.tipTime])), "valueMismatch", valMis.length ? valMis.join(" ") : "none", "noMarker", rows.filter((r) => !r.form).map((r) => r.key).join(",") || "none", "snapMismatch", v.snap.mismatchCount, "/", v.snap.samples, "keys", JSON.stringify(v.keys), "errors", v.errors.length);
}
