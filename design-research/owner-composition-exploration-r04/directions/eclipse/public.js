/* FITWAY public crowd page, public-redesign-r01 direction 4: the gym's instrument cluster. Concept only, synthetic data.
 *
 * The dial is a tachometer for the crowd: a 270-degree ring of four arcs in reading order (Quiet, Moderate, Busy,
 * Packed), the lower arcs deep red, the current arc #FF2946, the higher arcs graphite outlines; one chalk needle stands
 * at the middle of the current arc; the red corona glows behind the lit sweep with the dark face in front of it (the
 * Eclipse light); the level word and the count sit on the face. The usual day is the second instrument: one red line
 * over fine vertical graduations, a chalk now-mark, the usual peak ringed.
 *
 * Truth: the needle, the arcs and the corona come from the band only (whole arcs; the needle at an arc's middle, never
 * at the percentage); the written word is always shown on the face; the arcs run in reading direction; the dial has one
 * accessible name and hides its parts. The percentage is one readout and the page reads whole without it (?pct=off).
 * Times are gym time (Riyadh), 12-hour with «ص/م», Western digits. Every value below is a fixture, not FITWAY truth.
 *
 * Motion: the Owner Daily first-open intro (DESIGN-SPEC MOT-10), once per tab, on one clock: the needle sweeps from the
 * start of Quiet to the level as the arcs and the corona light behind it, and the count's digits roll into place
 * (400 ms); the day's line draws from opening to closing with its graduations (914 ms); then now and the peak land
 * (257 ms from 914). No glyph changes opacity. Reduced motion or ?motion=off: no intro; the page at rest is identical.
 * ?hold=<ms> holds the intro at that moment, for captures only. */
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
    // The usual Wednesday, percent, on each hour from 6:00 AM (index 0) to 1:00 AM (index 19). Peak 9:00 PM.
    usual: [8, 20, 26, 22, 16, 13, 14, 16, 17, 19, 25, 33, 44, 54, 63, 71, 66, 48, 27, 8],
  };
  // ?level=0..3: another fixture reading at the same minute, for checking the four words only (never a control).
  const FIX = [{ count: 18, pct: 15 }, { count: 45, pct: 38 }, { count: 70, pct: 58 }, { count: 102, pct: 85 }];
  const lv = params.has("level") ? Math.min(3, Math.max(0, Number(params.get("level")) | 0)) : 2;
  const READING = { at: 19 * 60 + 41, ...FIX[lv] };
  const bandOf = (pct) => (pct <= 25 ? 0 : pct <= 50 ? 1 : pct <= 75 ? 2 : 3);
  READING.band = bandOf(READING.pct);

  const STR = {
    ar: {
      other: { name: "English", lang: "en" },
      bands: ["هادئ", "متوسط", "مزدحم", "شديد الازدحام"],
      now: "الازدحام الآن",
      mark: (b) => `مستوى الازدحام: ${b}`,
      count: "داخل الصالة الآن · تقريبًا",
      live: "مباشر",
      last: (t) => `آخر قراءة ${t}`,
      open: "مفتوح",
      until: (t) => `حتى ${t}`,
      pct: "نسبة الامتلاء",
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
      live: "Live",
      last: (t) => `Last reading ${t}`,
      open: "Open",
      until: (t) => `until ${t}`,
      pct: "Occupancy",
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
  const time = (min) => `<bdi class="num">${clock(min)}</bdi>`;
  const f = (n) => n.toFixed(2);

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
  const hourRows = [];
  for (let h = DAY.open; h <= DAY.close; h += 60) {
    hourRows.push(`<tr><th scope="row">${clock(h)}</th><td>${L.bands[bandOf(DAY.usual[(h - DAY.open) / 60])]}</td></tr>`);
  }
  const cluster = document.getElementById("cluster");
  cluster.innerHTML = `
    <section class="dial" id="dial" aria-labelledby="level">
      <i class="corona" id="corona" aria-hidden="true"></i>
      <svg id="dial-svg" role="img" aria-label="${L.mark(word)}" focusable="false"></svg>
      <div class="face">
        <h1 class="word${READING.band === 3 && !en ? " is-long" : ""}" id="level"><span class="sr-only">${L.now}: </span>${word}</h1>
        <p class="count"><b class="roll"><span><bdi class="num">${READING.count}</bdi></span></b> ${L.count}</p>
      </div>
      <span class="end" id="end-0" aria-hidden="true">${L.bands[0]}</span>
      <span class="end" id="end-3" aria-hidden="true">${L.bands[3]}</span>
    </section>
    <dl class="band">
      <div class="ro"><dt>${L.last(time(READING.at))}</dt><dd><span class="live"><i aria-hidden="true"></i>${L.live}</span></dd></div>
      <div class="ro"><dt>${L.until(time(DAY.close))}</dt><dd>${L.open}</dd></div>
      <div class="ro ro-pct"><dt>${L.pct}</dt><dd><span class="roll"><span><bdi class="num">${READING.pct}%</bdi></span></span></dd></div>
    </dl>
    <section class="day" aria-labelledby="day-title">
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

  const SVGNS = "http://www.w3.org/2000/svg";

  /* ---- the dial. t runs 0..1 along the sweep in reading order: from the lower right over the top to the lower left in
   * Arabic, mirrored in English. theta is the screen angle in degrees, counter-clockwise from 3 o'clock. */
  const dialEl = document.getElementById("dial");
  const dialSvg = document.getElementById("dial-svg");
  const corona = document.getElementById("corona");
  const SWEEP = 270, GAP = 3; // degrees; GAP between two arcs
  const theta = (t) => (en ? 225 - SWEEP * t : -45 + SWEEP * t);
  const conicOf = (t) => (((90 - theta(t)) % 360) + 360) % 360; // a conic gradient's angle: clockwise from 12 o'clock
  const T_NEEDLE = (READING.band + 0.5) / 4; // the middle of the level's arc
  const T_LIT = (READING.band + 1) / 4; // the end of the level's arc
  let dg = null;

  function drawDial() {
    const W = dialEl.clientWidth, H = dialEl.clientHeight;
    if (!W || !H) return;
    const R = W / 2, cx = W / 2, cy = R;
    const pt = (r, t) => { const a = (theta(t) * Math.PI) / 180; return [cx + r * Math.cos(a), cy - r * Math.sin(a)]; };
    const ring = (r1, r2, t0, t1) => {
      const n = Math.max(2, Math.ceil(((t1 - t0) * SWEEP) / 1.5));
      const outer = [], inner = [];
      for (let i = 0; i <= n; i++) { const t = t0 + ((t1 - t0) * i) / n; outer.push(pt(r2, t)); inner.unshift(pt(r1, t)); }
      return `M${[...outer, ...inner].map(([x, y]) => `${f(x)} ${f(y)}`).join("L")}Z`;
    };
    const g = GAP / 2 / SWEEP;
    const r1 = 0.8 * R, r2 = 0.87 * R;
    let arcs = "", bed = "";
    for (let i = 0; i < 4; i++) {
      const d = ring(r1, r2, i / 4 + g, (i + 1) / 4 - g);
      bed += `<path class="arc-bed" d="${d}"/>`;
      if (i <= READING.band) arcs += `<path class="arc ${i < READING.band ? "is-done" : "is-cur"}" d="${d}"/>`;
    }
    // Graduations: eight to an arc; the five arc boundaries are the long ones.
    let ticks = "";
    for (let k = 0; k <= 32; k++) {
      const t = k / 32, major = k % 8 === 0;
      const [x1, y1] = pt(major ? 0.9 * R : 0.935 * R, t), [x2, y2] = pt(R, t);
      ticks += `<line class="tick${major ? " is-major" : ""}" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}"/>`;
    }
    // The needle: a tapered chalk blade from inside the arcs out to the graduations' outer edge, drawn along +x and
    // turned to the level's angle (SVG turns clockwise, so the screen angle is negated).
    const n0 = 0.64 * R, n1 = 1.0 * R, w0 = Math.max(3, 0.024 * R), w1 = Math.max(1, 0.006 * R);
    const blade = `M${f(n0)} ${f(-w0)}L${f(n1)} ${f(-w1)}L${f(n1)} ${f(w1)}L${f(n0)} ${f(w0)}Z`;
    dialSvg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    dialSvg.innerHTML = `
      <defs><clipPath id="sweep-clip"><path id="sweep-path" d=""/></clipPath></defs>
      <g aria-hidden="true">${ticks}${bed}<g clip-path="url(#sweep-clip)">${arcs}</g>
        <g id="needle"><path class="needle-edge" d="${blade}"/><path class="needle" d="${blade}"/></g></g>`;
    // The two end words, centred under the ring's two ends.
    const [xs] = pt((r1 + r2) / 2, 0), [xe] = pt((r1 + r2) / 2, 1);
    document.getElementById("end-0").style.left = `${f(xs)}px`;
    document.getElementById("end-3").style.left = `${f(xe)}px`;
    dg = { R, cx, cy, pt };
    setSweep(1);
    if (intro.state === "pending" || intro.state === "running" || intro.state === "held") frame(intro.t);
  }

  // The sweep at progress p (0..1, already eased): the needle's angle, the lit arcs' clip and the corona's span.
  function setSweep(p) {
    if (!dg) return;
    const { R, cx, cy, pt } = dg;
    const tn = T_NEEDLE * p, tl = T_LIT * p;
    document.getElementById("needle").setAttribute("transform", `translate(${f(cx)} ${f(cy)}) rotate(${f(-theta(tn))})`);
    // The clip: a wedge from the centre over the swept angle (a hair before the start, so the first arc is whole).
    const wedge = [[cx, cy]];
    const t0 = -0.01, n = Math.max(2, Math.ceil(((tl - t0) * SWEEP) / 2));
    for (let i = 0; i <= n; i++) wedge.push(pt(1.2 * R, t0 + ((tl - t0) * i) / n));
    document.getElementById("sweep-path").setAttribute("d", tl > 0 ? `M${wedge.map(([x, y]) => `${f(x)} ${f(y)}`).join("L")}Z` : "M0 0Z");
    // The corona: clockwise from the earlier of the two ends; soft for 10 degrees at each end.
    const a = conicOf(0), b = conicOf(tl), span = SWEEP * tl;
    const from = en ? a : b; // English runs clockwise from the start; Arabic counter-clockwise, so from its end
    corona.style.setProperty("--c-from", `${f(from - 5)}deg`);
    corona.style.setProperty("--c-span", `${f(span + 10)}deg`);
    corona.style.setProperty("--c-soft", `${f(Math.min(10, (span + 10) / 2))}deg`);
    corona.style.visibility = tl > 0 ? "" : "hidden";
    // The hottest point: on the current arc, where the needle stands.
    const [hx, hy] = pt(0.835 * R, tn);
    const box = 2.84 * R, ox = cx - 1.42 * R, oy = cy - 1.42 * R;
    corona.style.setProperty("--hot-x", `${f(((hx - ox) / box) * 100)}%`);
    corona.style.setProperty("--hot-y", `${f(((hy - oy) / box) * 100)}%`);
  }

  /* ---- the usual day, drawn at the plot's own pixel size (and again on a resize) */
  const plot = document.getElementById("plot");
  const aNow = document.getElementById("a-now");
  let geo = null;

  function drawDay() {
    const W = plot.clientWidth, H = plot.clientHeight;
    if (!W || !H) return;
    const cs = getComputedStyle(root);
    const tagH = parseFloat(cs.getPropertyValue("--small-lh")) || 20;
    const top = tagH + 14; // room above the peak for its label
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
    let hours = "";
    for (let mm = 60; mm < SPAN; mm += 60) hours += `<line class="u-hour" x1="${f(X(mm))}" y1="${H}" x2="${f(X(mm))}" y2="${H + 5}"/>`;
    plot.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" focusable="false">
        <defs>
          <linearGradient id="u-fade" gradientUnits="userSpaceOnUse" x1="0" y1="${top}" x2="0" y2="${H}">
            <stop offset="0" stop-color="#e51935" stop-opacity=".66"/>
            <stop offset=".55" stop-color="#e51935" stop-opacity=".28"/>
            <stop offset="1" stop-color="#e51935" stop-opacity=".07"/>
          </linearGradient>
          <pattern id="u-hatch" patternUnits="userSpaceOnUse" x="${en ? 0 : f(W % gap)}" y="0" width="${gap}" height="${H}">
            <rect x="0" y="0" width="1" height="${H}" fill="url(#u-fade)"/>
          </pattern>
          <clipPath id="u-clip"><rect id="u-clip-r" x="-8" y="-40" width="${W + 16}" height="${H + 48}"/></clipPath>
        </defs>
        <line class="u-base" x1="0" y1="${H - 0.5}" x2="${W}" y2="${H - 0.5}"/>
        ${hours}
        <path class="u-hatch" d="${area}" clip-path="url(#u-clip)"/>
        <path class="u-line" id="u-line" d="${line}"/>
        <line class="u-now-l" id="u-now-l" x1="${f(nx)}" y1="${H}" x2="${f(nx)}" y2="${f(ny + 6)}"/>
        <circle class="u-dot" id="u-dot" cx="${f(nx)}" cy="${f(ny)}" r="5.5"/>
        <circle class="u-pk" id="u-pk" cx="${f(px)}" cy="${f(py)}" r="4.5"/>
      </svg>
      <span class="tag" id="pk-tag" style="left:${f(px)}px;top:${f(py - 10)}px">${L.peak(time(DAY.open + PEAK_M))}</span>`;
    // Keep the peak's label inside the plot.
    const tag = document.getElementById("pk-tag");
    const tw = tag.offsetWidth;
    tag.style.left = `${f(Math.min(Math.max(px, tw / 2), W - tw / 2))}px`;
    // Now's word on the axis, under the now-mark, kept inside the plot.
    const aw = aNow.offsetWidth;
    aNow.style.left = `${f(Math.min(Math.max(nx, aw / 2), W - aw / 2))}px`;
    const path = document.getElementById("u-line");
    geo = { W, H, path, total: path.getTotalLength(), x0: X(0) };
    if (intro.state === "pending" || intro.state === "running" || intro.state === "held") frame(intro.t);
  }

  /* ---- the intro (MOT-10's sequence, on one clock) */
  const T = { roll: 400, line: 914, land: 257 };
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
  const rolls = () => cluster.querySelectorAll(".roll");
  const landEls = () => ["u-now-l", "u-dot", "u-pk"].map((id) => document.getElementById(id)).filter(Boolean);
  const tagEls = () => [document.getElementById("pk-tag"), aNow].filter(Boolean);

  function frame(t) {
    intro.t = t;
    // 1. The needle sweeps to the level as the arcs and the corona light behind it; the digits roll up into place.
    const pr = easeState(clamp01(t / T.roll));
    setSweep(pr);
    rolls().forEach((r) => {
      r.style.clipPath = "inset(0 -0.3em)";
      r.firstElementChild.style.transform = `translateY(${f((1 - pr) * 100)}%)`;
    });
    if (!geo) return;
    // 2. The day's line draws from opening to closing; its graduations are uncovered up to its tip.
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
    // 3. Now and the peak land: the points swell from the tip's size; their words appear with them.
    const landed = t >= T.line;
    const pm = easeState(clamp01((t - T.line) / T.land));
    const s = 0.34 + 0.66 * pm;
    landEls().forEach((el) => {
      el.style.visibility = landed ? "" : "hidden";
      if (el.tagName !== "circle") return;
      const cx = Number(el.getAttribute("cx")), cy = Number(el.getAttribute("cy"));
      el.setAttribute("transform", landed && pm < 1 ? `translate(${f(cx)} ${f(cy)}) scale(${s.toFixed(4)}) translate(${f(-cx)} ${f(-cy)})` : "");
    });
    tagEls().forEach((el) => { el.style.clipPath = landed ? "" : "inset(50%)"; });
  }
  function clear() {
    setSweep(1);
    rolls().forEach((r) => { r.style.clipPath = ""; r.firstElementChild.style.transform = ""; });
    if (geo) { geo.path.style.strokeDasharray = ""; geo.path.style.visibility = ""; }
    const r = document.getElementById("u-clip-r");
    if (r && geo) { r.setAttribute("x", "-8"); r.setAttribute("width", f(geo.W + 16)); }
    landEls().forEach((el) => { el.style.visibility = ""; el.removeAttribute("transform"); });
    tagEls().forEach((el) => { el.style.clipPath = ""; });
  }
  function endIntro(reason) {
    if (intro.state === "off" || intro.state === "done") return;
    cancelAnimationFrame(intro.raf);
    intro.state = "done";
    intro.reason = reason;
    clear();
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
    first = sessionStorage.getItem("fitway.public.d4.intro") == null;
    sessionStorage.setItem("fitway.public.d4.intro", "1");
  } catch (e) { first = false; }
  if (hold != null) { intro.state = "held"; intro.reason = "hold"; }
  else if (first && !reduce) { intro.state = "pending"; intro.reason = "first open in this tab"; }
  else intro.reason = reduce ? "reduced motion" : "already opened in this tab";

  drawDial();
  drawDay();
  if (intro.state === "pending" || intro.state === "held") frame(hold ?? 0);

  // Fonts settle the geometry; the intro waits for them, at most 200 ms (as the Owner Daily's does), or there is none.
  const fontsLate = new Promise((res) => setTimeout(() => res(false), 200));
  Promise.race([(window.publicFonts || document.fonts.ready).then(() => true), fontsLate]).then((ok) => {
    drawDial();
    drawDay();
    if (intro.state !== "pending") return;
    if (!ok || document.hidden) { endIntro(ok ? "hidden" : "fonts late"); return; }
    requestAnimationFrame((now) => { intro.state = "running"; intro.start = now; intro.raf = requestAnimationFrame(loop); });
  });
  // Any press or key settles a playing intro at once (nothing waits for it).
  ["pointerdown", "keydown", "wheel"].forEach((type) => addEventListener(type, () => endIntro("action"), { passive: true }));

  const sizes = new Map();
  const ro = new ResizeObserver((entries) => {
    let changed = false;
    entries.forEach((e) => {
      const w = Math.round(e.contentRect.width), h = Math.round(e.contentRect.height), k = `${w}x${h}`;
      if (sizes.get(e.target) !== k) { if (sizes.has(e.target)) changed = true; sizes.set(e.target, k); }
    });
    if (!changed) return;
    if (intro.state === "running" || intro.state === "pending") endIntro("resize");
    drawDial();
    drawDay();
  });
  ro.observe(plot);
  ro.observe(dialEl);

  document.title = "FITWAY";
  window.__public = { ready: true, intro };
})();
