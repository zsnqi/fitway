/* FITWAY light study. Concept only, synthetic data, Arabic RTL, static.
 * The data logic (seeded minute simulation, day constants, monotone interpolation) is reused from
 * ../backlight/app.js. Everything else here is new. Western digits only: numbers are printed with
 * String(), never Intl or toLocaleString. */
(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);

  /* ------------------------------------------------------------ day constants */
  const DAY = 1140;               // 6:00 AM to 1:00 AM next day, gym time (Riyadh)
  const YMAX = 80;                // chart scale (capacity is owner-private and not drawn)
  const GAP0 = 494, GAP1 = 511;   // no reading 2:14 PM - 2:31 PM
  const ZERO_END = 9;             // open, nobody inside 6:00 AM - 6:09 AM
  const NOW = 822;                // 7:42 PM, also the latest reading
  const SEED = 15983;

  /* -------------------------------------------------------------- simulation */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const ss = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
  const bump = (m, mu, sl, sr) => { const z = (m - mu) / (m < mu ? sl : sr); return Math.exp(-0.5 * z * z); };
  function target(m, p) {
    if (m < 10) return 0;
    const ramp = ss((m - 9) / 22);
    const base = 7 * ss((m - 10) / 60) * (1 - ss((m - 1000) / 140));
    return ramp * (p.am * bump(m, p.amAt, 34, 44) + p.mid * bump(m, 420, 70, 70) + p.pm * bump(m, p.pmAt, 105, 125)) + base;
  }
  // Whole-person count process: entries ~ Poisson(lambda), exits ~ Binomial(occupancy, 1/64), one step per minute.
  function simulateDay(seed, p) {
    const rnd = mulberry32(seed);
    const poisson = (l) => { if (l <= 0) return 0; const lim = Math.exp(-l); let k = 0, q = 1; do { k++; q *= rnd(); } while (q > lim); return k - 1; };
    const occ = new Array(DAY).fill(0), ent = new Array(DAY).fill(0);
    let o = 0, prevT = 0;
    for (let m = 0; m < DAY; m++) {
      const T = target(m, p);
      let lam = m < 10 ? 0 : Math.max(0, T - prevT * (63 / 64));
      if (m === 10) lam = Math.max(lam, 1.2);
      let x = 0;
      for (let i = 0; i < o; i++) if (rnd() < 1 / 64) x++;
      const e = poisson(lam);
      o = o - x + e;
      occ[m] = o; ent[m] = e; prevT = T;
    }
    return { occ, ent };
  }
  const today = simulateDay(SEED, { am: 22, amAt: 82, mid: 8, pm: 53, pmAt: 752 });
  const PAST_WED = [
    { f: 0.78, a: 0.95, at: 762 },
    { f: 0.74, a: 1.0, at: 747 },
    { f: 0.8, a: 0.98, at: 757 },
    { f: 0.76, a: 1.03, at: 752 },
  ].map((w, i) => simulateDay(SEED + 1000 * (i + 1), { am: 22 * w.a, amAt: 82, mid: 8, pm: 53 * w.f, pmAt: w.at }));
  const RECENT = [
    simulateDay(SEED + 11, { am: 22 * 0.9, amAt: 84, mid: 8, pm: 53 * 0.78, pmAt: 740 }),
    simulateDay(SEED + 12, { am: 22 * 0.35, amAt: 100, mid: 8 * 0.6, pm: 53 * 0.85, pmAt: 800 }),
    simulateDay(SEED + 13, { am: 22 * 0.8, amAt: 90, mid: 8, pm: 53 * 0.9, pmAt: 760 }),
    simulateDay(SEED + 14, { am: 22 * 1.05, amAt: 80, mid: 8, pm: 53 * 1.02, pmAt: 750 }),
    simulateDay(SEED + 15, { am: 22 * 1.0, amAt: 82, mid: 8, pm: 53 * 1.05, pmAt: 755 }),
    simulateDay(SEED + 16, { am: 22 * 0.95, amAt: 82, mid: 8, pm: 53 * 0.95, pmAt: 748 }),
  ];

  /* ------------------------------------------------------------ today's truth */
  const occ = today.occ;
  const obs = (m) => m >= 0 && m <= NOW && (m < GAP0 || m > GAP1);
  let peak = -1, peakM = -1, entries = 0;
  for (let m = 0; m <= NOW; m++) {
    if (!obs(m)) continue;
    entries += today.ent[m];
    if (occ[m] > peak) { peak = occ[m]; peakM = m; }
  }
  const LEVELS = ["هادئ", "متوسط", "مزدحم", "شديد الازدحام"];
  const levelOf = (v) => (v <= 24 ? 0 : v <= 48 ? 1 : v <= 68 ? 2 : 3);

  // Busiest time: the busiest 2-hour window over the last 7 days (six full days plus today so far).
  const busiest = (() => {
    const hourMean = [];
    for (let h = 0; h < 19; h++) {
      const vals = RECENT.map((d) => { let s = 0; for (let m = h * 60; m < h * 60 + 60; m++) s += d.occ[m]; return s / 60; });
      let s = 0, n = 0;
      for (let m = h * 60; m < h * 60 + 60 && m <= NOW; m++) if (obs(m)) { s += occ[m]; n++; }
      if (n) vals.push(s / n);
      hourMean.push(vals.reduce((a, b) => a + b, 0) / vals.length);
    }
    let best = -1, bh = 0;
    for (let h = 0; h < 18; h++) { const v = (hourMean[h] + hourMean[h + 1]) / 2; if (v > best) { best = v; bh = h; } }
    return { from: bh * 60, to: bh * 60 + 120, avg: Math.round(best) };
  })();

  /* ------------------------------------------------------------ time format */
  function clock(m) {
    const abs = (((360 + m) % 1440) + 1440) % 1440;
    const h = Math.floor(abs / 60);
    return { h12: ((h + 11) % 12) + 1, mm: abs % 60, pm: h >= 12 };
  }
  const sfx = (pm) => (pm ? "م" : "ص");
  const fmtTime = (m) => { const c = clock(m); return `${c.h12}:${String(c.mm).padStart(2, "0")} ${sfx(c.pm)}`; };
  const fmtHour = (m) => { const c = clock(m); return `${c.h12} ${sfx(c.pm)}`; };
  const bdi = (s) => `<bdi>${s}</bdi>`;
  // Arabic ranges use a plain ASCII hyphen; an en dash would reverse the range.
  const range = (a, b) => `${bdi(a)} - ${bdi(b)}`;
  function hourRange(a, b) {
    const A = clock(a), B = clock(b);
    return A.pm === B.pm ? bdi(`${A.h12}-${B.h12} ${sfx(A.pm)}`) : range(fmtHour(a), fmtHour(b));
  }

  /* ---------------------------------------------------- monotone interpolation */
  // Monotone cubic Hermite: passes through every point and never overshoots.
  function monotone(xs, ys) {
    const n = xs.length, h = [], s = [], t = new Array(n).fill(0);
    for (let i = 0; i < n - 1; i++) { h[i] = xs[i + 1] - xs[i]; s[i] = (ys[i + 1] - ys[i]) / h[i]; }
    for (let i = 1; i < n - 1; i++) {
      const p = (s[i - 1] * h[i] + s[i] * h[i - 1]) / (h[i - 1] + h[i]);
      t[i] = (Math.sign(s[i - 1]) + Math.sign(s[i])) * Math.min(Math.abs(s[i - 1]), Math.abs(s[i]), 0.5 * Math.abs(p)) || 0;
    }
    if (n === 2) { t[0] = t[1] = s[0]; }
    else if (n > 2) { t[0] = (3 * s[0] - t[1]) / 2; t[n - 1] = (3 * s[n - 2] - t[n - 2]) / 2; }
    const at = (x) => {
      if (n === 1) return ys[0];
      let i = 0;
      while (i < n - 2 && x > xs[i + 1]) i++;
      const hh = h[i], u = (x - xs[i]) / hh, u2 = u * u, u3 = u2 * u;
      return (2 * u3 - 3 * u2 + 1) * ys[i] + (u3 - 2 * u2 + u) * hh * t[i] + (-2 * u3 + 3 * u2) * ys[i + 1] + (u3 - u2) * hh * t[i + 1];
    };
    const path = (X, Y) => {
      let d = `M${X(xs[0]).toFixed(2)},${Y(ys[0]).toFixed(2)}`;
      for (let i = 0; i < n - 1; i++) {
        const hh = h[i];
        d += `C${X(xs[i] + hh / 3).toFixed(2)},${Y(ys[i] + (t[i] * hh) / 3).toFixed(2)} ${X(xs[i + 1] - hh / 3).toFixed(2)},${Y(ys[i + 1] - (t[i + 1] * hh) / 3).toFixed(2)} ${X(xs[i + 1]).toFixed(2)},${Y(ys[i + 1]).toFixed(2)}`;
      }
      return d;
    };
    return { xs, ys, at, path };
  }

  // Line points: the reading every 30 minutes, plus the true peak, the end of the zero span, both edges
  // of the missing span and the latest reading (so the gap and the line's end are drawn where they are).
  const knotSet = new Set();
  for (let m = 0; m <= NOW; m += 30) if (obs(m)) knotSet.add(m);
  [ZERO_END, peakM, GAP0 - 1, GAP1 + 1, NOW].forEach((m) => { if (obs(m)) knotSet.add(m); });
  const knots = [...knotSet].sort((a, b) => a - b);
  const segments = [];
  knots.forEach((m, i) => {
    if (i === 0 || (knots[i - 1] < GAP0 && m > GAP1)) segments.push([]);
    segments[segments.length - 1].push(m);
  });
  const splines = segments.map((seg) => monotone(seg, seg.map((m) => occ[m])));

  // Usual Wednesday: average of the last 4 Wednesdays around each half hour.
  const usualKnots = [];
  for (let m = 0; m <= 1110; m += 30) usualKnots.push(m);
  usualKnots.push(DAY - 1);
  const usualVals = usualKnots.map((m) => {
    let sum = 0, n = 0;
    for (const d of PAST_WED) for (let w = Math.max(0, m - 15); w <= Math.min(DAY - 1, m + 15); w++) { sum += d.occ[w]; n++; }
    return sum / n;
  });
  const usual = monotone(usualKnots, usualVals);

  // Self-check: the drawn maximum equals the stated peak, and no segment overshoots its readings.
  const checks = (() => {
    let drawnMax = -Infinity, overshoot = 0;
    splines.forEach((sp) => {
      for (let i = 0; i < sp.xs.length - 1; i++) {
        const lo = Math.min(sp.ys[i], sp.ys[i + 1]) - 1e-9, hi = Math.max(sp.ys[i], sp.ys[i + 1]) + 1e-9;
        for (let k = 0; k <= 60; k++) {
          const y = sp.at(sp.xs[i] + ((sp.xs[i + 1] - sp.xs[i]) * k) / 60);
          if (y < lo || y > hi) overshoot++;
          drawnMax = Math.max(drawnMax, y);
        }
      }
    });
    return { peak, peakM, drawnMax: Math.round(drawnMax * 1000) / 1000, overshoot, segments: segments.length, lastKnot: knots[knots.length - 1] };
  })();

  /* -------------------------------------------------------------------- page */
  const levelChip = (v) => {
    const li = levelOf(v);
    return `<span class="bars" aria-hidden="true">${[0, 1, 2, 3].map((i) => `<i class="${i <= li ? "on" : ""}"></i>`).join("")}</span>${LEVELS[li]}`;
  };
  $("#sub").innerHTML = `الأربعاء ${bdi("23")} سبتمبر ${bdi("2026")}<span class="sep" aria-hidden="true">·</span>ساعات العمل ${range(fmtTime(0), fmtTime(DAY))}`;
  $("#status").innerHTML = `<span class="dot" aria-hidden="true"></span><span class="strong">مباشر</span><span>· آخر قراءة ${bdi(fmtTime(NOW))}</span>`;
  $("#now-meta").innerHTML = bdi(fmtTime(NOW));
  $("#now-v").textContent = String(occ[NOW]);
  $("#now-level").innerHTML = levelChip(occ[NOW]);
  $("#peak-meta").innerHTML = bdi(fmtTime(peakM));
  $("#peak-v").textContent = String(peak);
  $("#peak-level").innerHTML = levelChip(peak);
  $("#entries-v").textContent = String(entries);
  $("#busy-v").innerHTML = hourRange(busiest.from, busiest.to);
  $("#busy-note").innerHTML = `نحو ${bdi(busiest.avg)} في الصالة في المتوسط`;

  /* ------------------------------------------------------------------- chart */
  const plot = $("#plot"), svgHost = $("#plot-svg"), labels = $("#plot-labels");
  const f = (n) => n.toFixed(2);

  function render() {
    const W = Math.round(plot.clientWidth), H = Math.round(plot.clientHeight);
    const yl = 38;                          // y labels sit on the inline-start (right) side
    const xr = W - yl, xl = 2;              // 6:00 AM on the right, 1:00 AM on the left
    const yt = 14, yb = H - 36;
    const X = (m) => xr - (m / DAY) * (xr - xl);
    const Y = (v) => yb - (v / YMAX) * (yb - yt);
    const s = [];
    s.push(`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false"><defs>
      <linearGradient id="hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff2946" stop-opacity="0.5"/><stop offset="0.45" stop-color="#ff2946" stop-opacity="0.16"/><stop offset="1" stop-color="#ff2946" stop-opacity="0"/></linearGradient>
      <clipPath id="past"><rect x="${f(X(NOW))}" y="0" width="${f(W - X(NOW))}" height="${H}"/></clipPath>
    </defs>`);

    // Faint horizontal grid. The time axis (0) is a touch stronger and breaks into dots over the missing span.
    [20, 40, 60, 80].forEach((v) => s.push(`<path d="M${xl},${Math.round(Y(v)) + 0.5}H${xr}" stroke="rgba(255,255,255,0.055)" stroke-width="1"/>`));
    const by = Math.round(yb) + 0.5, ga = X(GAP0 - 0.5), gb = X(GAP1 + 0.5);
    s.push(`<path d="M${xl},${by}H${f(gb)}M${f(ga)},${by}H${xr}" stroke="rgba(255,255,255,0.13)" stroke-width="1"/>`);
    for (let x = gb + 2.5; x <= ga - 1.5; x += 4) s.push(`<circle cx="${f(x)}" cy="${by}" r="1" fill="rgba(245,243,242,0.62)"/>`);

    // Fine vertical lines, every 6px from the start of the day, from the line down, fading out halfway.
    // None inside the missing span and none after now.
    const segOf = (m) => segments.findIndex((seg) => m >= seg[0] && m <= seg[seg.length - 1]);
    for (let x = Math.floor(xr); x >= X(NOW); x -= 6) {
      const m = ((xr - (x + 0.5)) / (xr - xl)) * DAY;
      const si = segOf(m);
      if (si < 0) continue;
      const v = splines[si].at(m);
      if (v < 0.75) continue;
      const top = Y(v) + 2.5, len = (yb - Y(v)) * 0.5 - 2.5;
      if (len > 1) s.push(`<rect x="${x}" y="${f(top)}" width="1" height="${f(len)}" fill="url(#hair)"/>`);
    }

    // Usual Wednesday: dashed, up to now only.
    s.push(`<path d="${usual.path(X, Y)}" fill="none" stroke="rgba(245,243,242,0.55)" stroke-width="1.5" stroke-dasharray="3.5 4.5" stroke-linecap="round" clip-path="url(#past)"/>`);

    // Peak guide and marker.
    const px = Math.round(X(peakM)) + 0.5, py = Y(peak);
    s.push(`<path d="M${px},${yt}V${by - 0.5}" stroke="rgba(245,243,242,0.3)" stroke-width="1"/>`);

    // Today: thick bright red line, round caps where it stops for the missing span.
    splines.forEach((sp) => s.push(`<path d="${sp.path(X, Y)}" fill="none" stroke="#ff2946" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`));

    s.push(`<circle cx="${px}" cy="${f(py)}" r="5.2" fill="#0f0e0f" stroke="#f5f3f2" stroke-width="2"/>`);
    // Latest reading (now): the end of the line.
    const ex = X(NOW), ey = Y(occ[NOW]);
    s.push(`<circle cx="${f(ex)}" cy="${f(ey)}" r="9" fill="none" stroke="rgba(255,41,70,0.32)" stroke-width="1"/><circle cx="${f(ex)}" cy="${f(ey)}" r="4.4" fill="#ff2946" stroke="#0f0e0f" stroke-width="2"/>`);
    s.push(`</svg>`);
    svgHost.innerHTML = s.join("");

    // HTML labels (so bidi and fonts behave), placed on the same geometry.
    const lab = [];
    [0, 20, 40, 60, 80].forEach((v) => lab.push(`<span class="ax-y" style="right:0;top:${f(Y(v))}px;transform:translateY(-50%)">${bdi(String(v))}</span>`));
    for (let h = 0; h <= 18; h += 2) lab.push(`<span class="ax-x" style="left:${f(X(h * 60))}px;top:${f(yb + 12)}px;transform:translateX(-50%)">${bdi(fmtHour(h * 60))}</span>`);
    lab.push(`<span class="ax-x" style="left:${f(X(DAY))}px;top:${f(yb + 12)}px">${bdi(fmtHour(DAY))}</span>`);
    // Static tooltip at the peak, beside the guide on the earlier (right) side.
    lab.push(`<div class="tip" style="left:${f(px + 10)}px;top:${f(yt)}px">
      <div class="tip-top"><span class="tip-v">${bdi(String(peak))}</span><span class="tip-l">${LEVELS[levelOf(peak)]}</span></div>
      <div class="tip-t">الذروة · ${bdi(fmtTime(peakM))}</div></div>`);
    labels.innerHTML = lab.join("");
  }

  $("#chart-summary").textContent =
    `مخطط خطي لعدد الموجودين تقريبًا اليوم، من الفتح الساعة ${fmtTime(0)} حتى آخر قراءة الساعة ${fmtTime(NOW)}. ` +
    `الصالة مفتوحة وخالية من ${fmtTime(0)} - ${fmtTime(ZERO_END)}. لا قراءة من ${fmtTime(GAP0)} - ${fmtTime(GAP1)}. ` +
    `ذروة اليوم ${peak} الساعة ${fmtTime(peakM)} (${LEVELS[levelOf(peak)]}). آخر قراءة ${occ[NOW]} (${LEVELS[levelOf(occ[NOW])]}). ` +
    `يظهر خط متقطع لمتوسط آخر 4 أيام أربعاء، وهو ليس توقعًا. بقية اليوم لم تأتِ بعد.`;

  render();
  window.__lightstudy = {
    ready: false,
    recipe: document.documentElement.dataset.recipe,
    figures: { now: occ[NOW], peak, peakM, entries, busiest, usualNow: Math.round(usual.at(NOW)) },
    checks,
  };
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { render(); window.__lightstudy.ready = true; });
})();
