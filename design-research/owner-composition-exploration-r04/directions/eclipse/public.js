/* FITWAY public crowd page, public-redesign-r01 direction 3: the gym's status page. Concept only, synthetic data.
 *
 * One lit card states the answer (the band word, the four-step mark, a ruled ledger of the count, the percentage, the
 * opening hours and the last reading); one plain card holds the usual day as a single red line over a fine hatch,
 * labelled only at its ends, with now and the usual peak on it.
 *
 * Truth: the mark comes from the band only (whole steps, never the percentage); its written word is always shown;
 * its steps run in reading direction; it has one accessible name and hides its parts. The percentage is one ledger
 * row and the page reads whole without it (?pct=off). Times are gym time (Riyadh), 12-hour with «ص/م», Western digits.
 * Every value below is a fixture, not measured FITWAY truth.
 *
 * Motion: the Owner Daily first-open intro (DESIGN-SPEC MOT-10), once per tab, on one clock: the digits roll into
 * place (400 ms), the mark's steps fill in reading order (200 ms, 50 ms apart), the line draws from opening to
 * closing with its hatch (914 ms), then now and the peak land (257 ms from 914). No glyph changes opacity; the lights
 * never move. Reduced motion or ?motion=off: no intro; the page at rest is identical. ?hold=<ms> holds the intro at
 * that moment, for captures only. */
(() => {
  "use strict";
  const root = document.documentElement;
  const en = root.lang === "en";
  const params = new URLSearchParams(location.search);

  // Synthetic fixtures, all in gym time. A Wednesday evening: open 6:00 AM to 1:00 AM; the live reading arrived at
  // 7:41 PM. About 70 inside of a hidden 120 is 58%, which is Busy (quiet <= 25, moderate <= 50, busy <= 75).
  const DAY = {
    open: 6 * 60, // minutes since midnight
    close: 25 * 60, // 1:00 AM, the next morning
    // The usual Wednesday, percent, on each hour from 6:00 AM (index 0) to 1:00 AM (index 19). Peak 10:00 PM.
    usual: [8, 22, 26, 20, 16, 14, 15, 17, 18, 20, 26, 34, 44, 52, 60, 66, 70, 58, 34, 8],
  };
  const READING = { at: 19 * 60 + 41, count: 70, pct: 58 };
  const bandOf = (pct) => (pct <= 25 ? 0 : pct <= 50 ? 1 : pct <= 75 ? 2 : 3);
  READING.band = bandOf(READING.pct);

  const STR = {
    ar: {
      other: { name: "English", lang: "en" },
      bands: ["هادئ", "متوسط", "مزدحم", "شديد الازدحام"],
      now: "الازدحام الآن",
      mark: (b) => `مستوى الازدحام: ${b}`,
      count: "داخل الصالة الآن · تقريبًا",
      pct: "نسبة الامتلاء",
      hours: "الدوام اليوم",
      openUntil: (t) => `مفتوح حتى ${t}`,
      last: "آخر قراءة",
      live: "مباشر",
      day: "ازدحام الأربعاء المعتاد",
      nowWord: "الآن",
      peak: (t) => `الذروة ${t}`,
      hour: "الساعة", usualCol: "المعتاد",
      am: "ص", pm: "م",
    },
    en: {
      other: { name: "العربية", lang: "ar" },
      bands: ["Quiet", "Moderate", "Busy", "Packed"],
      now: "Crowd now",
      mark: (b) => `Crowd level: ${b}`,
      count: "Inside now · approx.",
      pct: "Occupancy",
      hours: "Today",
      openUntil: (t) => `Open until ${t}`,
      last: "Last reading",
      live: "Live",
      day: "A usual Wednesday",
      nowWord: "Now",
      peak: (t) => `Peak ${t}`,
      hour: "Hour", usualCol: "Usual",
      am: "AM", pm: "PM",
    },
  };
  const L = STR[en ? "en" : "ar"];

  // A 12-hour time in gym time, Western digits, «ص/م» or AM/PM. Minutes may pass midnight (1:00 AM is 25 * 60).
  const clock = (min) => {
    const h = Math.floor(min / 60) % 24, m = String(min % 60).padStart(2, "0");
    return `${h % 12 || 12}:${m} ${h < 12 ? L.am : L.pm}`;
  };
  // A number the intro rolls: its digits in an inner span, the window is the number's own line.
  const roll = (text) => `<bdi class="num roll"><span>${text}</span></bdi>`;
  const time = (min) => `<bdi class="num">${clock(min)}</bdi>`;

  /* ---- the usual curve: a monotone cubic through the hourly points (Fritsch-Carlson), so it never overshoots a
   * value the data does not have. Takes minutes since opening, returns percent. */
  const usualAt = (() => {
    const y = DAY.usual, n = y.length, d = [], m = [];
    for (let i = 0; i < n - 1; i++) d.push(y[i + 1] - y[i]);
    m[0] = d[0];
    m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
    for (let i = 0; i < n - 1; i++) {
      if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
      const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
      if (s > 9) { const k = 3 / Math.sqrt(s); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; }
    }
    return (min) => {
      const x = Math.min(Math.max(min / 60, 0), n - 1);
      const i = Math.min(Math.floor(x), n - 2), u = x - i;
      const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u;
      const h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
      return h00 * y[i] + h10 * m[i] + h01 * y[i + 1] + h11 * m[i + 1];
    };
  })();
  const SPAN = DAY.close - DAY.open;
  const NOW_M = READING.at - DAY.open;
  const PEAK_M = (() => { let best = 0; for (let mm = 0; mm <= SPAN; mm += 5) if (usualAt(mm) > usualAt(best)) best = mm; return best; })();

  /* ---- the page */
  const word = L.bands[READING.band];
  const steps = L.bands.map((_, i) => {
    const s = i < READING.band ? "done" : i === READING.band ? "cur" : "next";
    return `<i class="step is-${s}"></i>`;
  }).join("");
  const hourRows = [];
  for (let h = DAY.open; h <= DAY.close; h += 60) {
    hourRows.push(`<tr><th scope="row">${clock(h)}</th><td>${L.bands[bandOf(DAY.usual[(h - DAY.open) / 60])]}</td></tr>`);
  }

  const board = document.getElementById("board");
  board.innerHTML = `
    <section class="card now lit lit-card" aria-labelledby="level">
      <span class="lamp" aria-hidden="true"><span class="lamp-in"></span><span class="lamp-rim"></span></span>
      <h1 class="word" id="level"><span class="sr-only">${L.now}: </span>${word}</h1>
      <div class="mark" role="img" aria-label="${L.mark(word)}">${steps}</div>
      <p class="ends" aria-hidden="true"><span>${L.bands[0]}</span><span>${L.bands[3]}</span></p>
      <dl class="facts">
        <div class="row"><dt>${L.last}</dt><dd><span class="live"><i aria-hidden="true"></i>${L.live}</span> <span class="roll"><span>· <bdi class="num">${clock(READING.at)}</bdi></span></span></dd></div>
        <div class="row"><dt>${L.count}</dt><dd>${roll(READING.count)}</dd></div>
        <div class="row row-pct"><dt>${L.pct}</dt><dd>${roll(`${READING.pct}%`)}</dd></div>
        <div class="row"><dt>${L.hours}</dt><dd>${L.openUntil(time(DAY.close))}</dd></div>
      </dl>
    </section>
    <section class="card day" aria-labelledby="day-title">
      <h2 id="day-title">${L.day}</h2>
      <div class="plot" id="plot" aria-hidden="true"></div>
      <div class="axis" aria-hidden="true">
        <span class="a-start">${time(DAY.open)}</span>
        <span class="a-now" id="a-now">${L.nowWord}</span>
        <span class="a-end">${time(DAY.close)}</span>
      </div>
      <div class="sr-only"><table><caption>${L.day}</caption><thead><tr><th scope="col">${L.hour}</th><th scope="col">${L.usualCol}</th></tr></thead><tbody>${hourRows.join("")}</tbody></table></div>
    </section>`;

  // The language link names the other language in that language.
  const lang = document.getElementById("lang");
  lang.textContent = L.other.name;
  lang.lang = L.other.lang;
  lang.hreflang = L.other.lang;
  const other = new URL(location.href);
  other.searchParams.set("lang", L.other.lang);
  other.searchParams.delete("hold");
  lang.href = other.search;

  /* ---- the usual line, drawn at the plot's own pixel size (and again on a resize) */
  const SVGNS = "http://www.w3.org/2000/svg";
  const plot = document.getElementById("plot");
  const aNow = document.getElementById("a-now");
  const f = (n) => n.toFixed(2);
  let geo = null;

  function draw() {
    const W = plot.clientWidth, H = plot.clientHeight;
    if (!W || !H) return;
    const cs = getComputedStyle(root);
    const tagH = parseFloat(cs.getPropertyValue("--small-lh")) || 20;
    const top = tagH + 12; // room above the peak for its label
    const peakV = usualAt(PEAK_M);
    const X = (mm) => { const r = mm / SPAN; return en ? r * W : (1 - r) * W; };
    const Y = (v) => H - (v / peakV) * (H - top);
    const pts = [];
    for (let mm = 0; mm <= SPAN; mm += 5) pts.push([X(mm), Y(usualAt(mm))]);
    const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${f(x)} ${f(y)}`).join("");
    const area = `${line}L${f(X(SPAN))} ${H}L${f(X(0))} ${H}Z`;
    const gap = W >= 600 ? 5 : 4;
    const nx = X(NOW_M), ny = Y(usualAt(NOW_M));
    const px = X(PEAK_M), py = Y(peakV);
    plot.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" focusable="false">
        <defs>
          <linearGradient id="u-fade" gradientUnits="userSpaceOnUse" x1="0" y1="${top}" x2="0" y2="${H}">
            <stop offset="0" stop-color="#e51935" stop-opacity=".62"/>
            <stop offset=".55" stop-color="#e51935" stop-opacity=".26"/>
            <stop offset="1" stop-color="#e51935" stop-opacity=".06"/>
          </linearGradient>
          <pattern id="u-hatch" patternUnits="userSpaceOnUse" x="${en ? 0 : f(W % gap)}" y="0" width="${gap}" height="${H}">
            <rect x="0" y="0" width="1" height="${H}" fill="url(#u-fade)"/>
          </pattern>
          <clipPath id="u-clip"><rect id="u-clip-r" x="${-8}" y="${-40}" width="${W + 16}" height="${H + 48}"/></clipPath>
        </defs>
        <line class="u-base" x1="0" y1="${H - 0.5}" x2="${W}" y2="${H - 0.5}"/>
        <path class="u-hatch" d="${area}" clip-path="url(#u-clip)"/>
        <path class="u-line" id="u-line" d="${line}"/>
        <line class="u-now-l" id="u-now-l" x1="${f(nx)}" y1="${H}" x2="${f(nx)}" y2="${f(ny + 7)}"/>
        <circle class="u-halo" id="u-halo" cx="${f(nx)}" cy="${f(ny)}" r="11"/>
        <circle class="u-dot" id="u-dot" cx="${f(nx)}" cy="${f(ny)}" r="5.5"/>
        <circle class="u-pk" id="u-pk" cx="${f(px)}" cy="${f(py)}" r="4.5"/>
      </svg>
      <span class="tag" id="pk-tag" style="left:${f(px)}px;top:${f(py - 10)}px">${L.peak(time(DAY.open + PEAK_M))}</span>`;
    // Keep the peak's label inside the plot.
    const tag = document.getElementById("pk-tag");
    const tw = tag.offsetWidth;
    tag.style.left = `${f(Math.min(Math.max(px, tw / 2), W - tw / 2))}px`;
    // Now's word on the axis, under the now point, kept inside the plot.
    const aw = aNow.offsetWidth;
    aNow.style.left = `${f(Math.min(Math.max(nx, aw / 2), W - aw / 2))}px`;
    const path = document.getElementById("u-line");
    geo = { W, H, path, total: path.getTotalLength(), x0: X(0) };
    if (intro.state === "pending" || intro.state === "running" || intro.state === "held") frame(intro.t);
  }

  /* ---- the intro (MOT-10's sequence, on one clock) */
  const T = { roll: 400, step: 200, stepGap: 50, line: 914, land: 257 };
  const TOTAL = T.line + T.land;
  const intro = { state: "off", t: 0, start: 0, raf: 0, reason: "" };
  // cubic-bezier(x1, y1, x2, y2) as a function of time progress.
  const bezier = (x1, y1, x2, y2) => {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (u) => ((ax * u + bx) * u + cx) * u, sy = (u) => ((ay * u + by) * u + cy) * u;
    const dx = (u) => (3 * ax * u + 2 * bx) * u + cx;
    return (p) => {
      if (p <= 0) return 0;
      if (p >= 1) return 1;
      let u = p;
      for (let i = 0; i < 8; i++) { const e = sx(u) - p, d = dx(u); if (Math.abs(e) < 1e-5 || !d) break; u -= e / d; }
      return sy(Math.min(Math.max(u, 0), 1));
    };
  };
  const easeState = bezier(0.25, 1, 0.5, 1);
  const easeLine = bezier(0.3, 0.2, 0.4, 1);
  const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
  const rolls = () => board.querySelectorAll(".roll");
  const stepEls = () => board.querySelectorAll(".step");
  const landEls = () => ["u-now-l", "u-halo", "u-dot", "u-pk"].map((id) => document.getElementById(id)).filter(Boolean);
  const tagEls = () => [document.getElementById("pk-tag"), aNow].filter(Boolean);

  function frame(t) {
    intro.t = t;
    // 1. The digits roll up into their own line.
    const pr = easeState(clamp01(t / T.roll));
    rolls().forEach((r) => {
      r.style.clipPath = "inset(0 -0.3em)";
      r.firstElementChild.style.transform = `translateY(${f((1 - pr) * 100)}%)`;
    });
    // 2. The mark's steps fill in reading order.
    stepEls().forEach((s, i) => { s.style.transform = `scaleX(${easeState(clamp01((t - i * T.stepGap) / T.step)).toFixed(4)})`; });
    if (!geo) return;
    // 3. The line draws from opening to closing; the hatch is uncovered up to its tip.
    const pl = easeLine(clamp01(t / T.line));
    const len = pl * geo.total;
    geo.path.style.strokeDasharray = pl >= 1 ? "" : `${f(len)} ${f(geo.total + 16)}`;
    geo.path.style.visibility = len > 0.5 ? "" : "hidden";
    const tip = len > 0 ? geo.path.getPointAtLength(len).x : geo.x0;
    const r = document.getElementById("u-clip-r");
    if (r) {
      const a = en ? -8 : tip, b = en ? tip : geo.W + 8;
      r.setAttribute("x", f(pl >= 1 ? -8 : a));
      r.setAttribute("width", f(pl >= 1 ? geo.W + 16 : Math.max(b - a, 0)));
    }
    // 4. Now and the peak land: they swell from the tip's size; their words appear with them.
    const landed = t >= T.line;
    const pm = easeState(clamp01((t - T.line) / T.land));
    const s = 0.34 + 0.66 * pm;
    landEls().forEach((el) => {
      el.style.visibility = landed ? "" : "hidden";
      const cx = Number(el.getAttribute("cx") ?? el.getAttribute("x1")), cy = Number(el.getAttribute("cy") ?? el.getAttribute("y2"));
      el.setAttribute("transform", landed && pm < 1 && el.tagName === "circle" ? `translate(${f(cx)} ${f(cy)}) scale(${s.toFixed(4)}) translate(${f(-cx)} ${f(-cy)})` : "");
    });
    tagEls().forEach((el) => { el.style.clipPath = landed ? "" : "inset(50%)"; });
  }
  function clear() {
    rolls().forEach((r) => { r.style.clipPath = ""; r.firstElementChild.style.transform = ""; });
    stepEls().forEach((s) => { s.style.transform = ""; });
    if (geo) { geo.path.style.strokeDasharray = ""; geo.path.style.visibility = ""; }
    const r = document.getElementById("u-clip-r");
    if (r && geo) { r.setAttribute("x", "-8"); r.setAttribute("width", f(geo.W + 16)); }
    landEls().forEach((el) => { el.style.visibility = ""; el.removeAttribute("transform"); });
    tagEls().forEach((el) => { el.style.clipPath = ""; });
  }
  function endIntro(reason) {
    if (intro.state === "off" || intro.state === "done") return;
    cancelAnimationFrame(intro.raf);
    clear();
    intro.state = "done";
    intro.reason = reason;
  }
  function loop(now) {
    if (intro.state !== "running") return;
    const t = now - intro.start;
    if (t >= TOTAL) { endIntro("complete"); return; }
    frame(t);
    intro.raf = requestAnimationFrame(loop);
  }

  // Once per tab, and never with reduced motion or ?motion=off. The start state is set before the first paint.
  const hold = params.has("hold") ? Math.max(0, Number(params.get("hold")) || 0) : null;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || params.get("motion") === "off";
  let first = false;
  try {
    first = sessionStorage.getItem("fitway.public.d3.intro") == null;
    sessionStorage.setItem("fitway.public.d3.intro", "1");
  } catch (e) { first = false; }
  if (hold != null) { intro.state = "held"; intro.reason = "hold"; }
  else if (first && !reduce) { intro.state = "pending"; intro.reason = "first open in this tab"; }
  else intro.reason = reduce ? "reduced motion" : "already opened in this tab";

  draw();
  if (intro.state === "pending" || intro.state === "held") frame(hold ?? 0);

  // Fonts settle the geometry; the intro waits for them, at most 300 ms, or there is none (the still page at once).
  const fontsLate = new Promise((res) => setTimeout(() => res(false), 300));
  Promise.race([(window.publicFonts || document.fonts.ready).then(() => true), fontsLate]).then((ok) => {
    draw();
    if (intro.state !== "pending") return;
    if (!ok || document.hidden) { endIntro(ok ? "hidden" : "fonts late"); return; }
    requestAnimationFrame((now) => { intro.state = "running"; intro.start = now; intro.raf = requestAnimationFrame(loop); });
  });

  let lastW = plot.clientWidth;
  new ResizeObserver(() => {
    if (plot.clientWidth === lastW) return;
    lastW = plot.clientWidth;
    if (intro.state === "running" || intro.state === "pending") endIntro("resize");
    draw();
  }).observe(plot);

  document.title = "FITWAY";
  window.__public = { ready: true, intro };
})();
