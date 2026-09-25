/* Eclipse: FITWAY Owner Daily concept. Synthetic data only; not production.
 * Query: lang=ar|en (default ar), state=live|delayed|nohistory (default live), motion=off (final states at once).
 * The data logic (seeded minute simulation, day constants, monotone interpolation) is reused from
 * ../light-study/app.js, which took it from ../backlight/app.js. Western digits only: numbers are printed with
 * String(), never Intl or toLocaleString.
 * Motion (Round 5 section 4) lives in the "motion" section at the end. It only ever animates toward today's final
 * state: with prefers-reduced-motion or ?motion=off the page renders exactly as it did without motion. */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const root = document.documentElement;
  const LANG = root.lang === "en" ? "en" : "ar";
  const RTL = LANG === "ar";
  const STATE = root.dataset.state || "live";
  const HAS_HISTORY = STATE !== "nohistory";

  /* ------------------------------------------------------------------ copy */
  const arMin = (n) => (n === 1 ? "دقيقة" : n === 2 ? "دقيقتين" : n % 100 >= 3 && n % 100 <= 10 ? `${n} دقائق` : `${n} دقيقة`);
  const COPY = {
    ar: {
      skip: "انتقل إلى المحتوى",
      concept: "مفهوم استكشافي · بيانات افتراضية",
      railLabel: "الأقسام",
      brand: "FITWAY، أسماء الأقسام",
      nav: { daily: "اليومي", reports: "التقارير", access: "الوصول", activity: "سجل النشاط", operations: "التشغيل", monitoring: "شاشة المراقبة", lang: "English", settings: "الإعدادات", signout: "تسجيل الخروج" },
      langAria: "التبديل إلى اللغة الإنجليزية",
      langGlyph: "EN",
      docTitle: "اليوم · FITWAY (مفهوم)",
      title: "اليوم",
      date: `الأربعاء <bdi>23</bdi> سبتمبر <bdi>2026</bdi>`,
      hours: "ساعات العمل",
      live: "مباشر",
      delayed: "متأخر",
      lastReading: "آخر قراءة",
      glance: "اليوم باختصار",
      nowTitle: "داخل الصالة الآن",
      staleTitle: "آخر قراءة",
      approx: "تقريبًا",
      ago: (n) => `قبل ${arMin(n)}`,
      peakTitle: "ذروة اليوم",
      // Coordinator update (user decision): no "estimated crossings, not members" caption; the name carries it.
      entriesTitle: "مرات الدخول",
      busiestTitle: "أكثر الأوقات ازدحامًا",
      busiestMeta: `آخر <bdi>7</bdi> أيام`,
      busiestNote: (n) => `المتوسط ${n}`,
      cmp: { busier: "أعلى من المعتاد", quieter: "أهدأ من المعتاد", same: "قريب من المعتاد" },
      chartTitle: "ازدحام اليوم",
      keyLine: `متوسط كل <bdi>30</bdi> دقيقة`,
      keyUsual: "الأربعاء المعتاد",
      noHistory: "لا يكفي السجل للمقارنة بعد",
      details: "عرض التفاصيل",
      hideDetails: "إخفاء التفاصيل",
      peakTag: "الذروة",
      levels: ["هادئ", "متوسط", "مزدحم", "شديد الازدحام"],
      ro: { usual: "المعتاد", peak: "الذروة", latest: "آخر قراءة", empty: "الصالة خالية", noReading: "لا قراءة", noReadingYet: "لا قراءة بعد", ahead: "لم يحن بعد", inside: "داخل الصالة" },
      chartAria: "ازدحام اليوم حسب الوقت",
      keys: "استخدم مفتاحي السهمين للتنقل كل 5 دقائق، ومع Shift كل دقيقة. Home لوقت الفتح، وEnd لآخر قراءة.",
      detailsTitle: "التفاصيل",
      coverageTitle: "تغطية البيانات",
      cov: { read: "فيها قراءة", zero: "مفتوحة وخالية", miss: "لا قراءة", wait: "لا قراءة بعد", ahead: "لم يحن بعد", line: "الخط", usual: "الأربعاء المعتاد" },
      covReadVal: (a, b) => `${a} من ${b} دقيقة`,
      covLineVal: `متوسط <bdi>30</bdi> دقيقة حول كل نقطة: <bdi>15</bdi> قبلها و<bdi>15</bdi> بعدها، والأقرب أثقل وزنًا`,
      usualEntries: (n) => `المعتاد ${n}`,
      covUsualVal: `متوسط <bdi>26</bdi> أغسطس و<bdi>2</bdi> و<bdi>9</bdi> و<bdi>16</bdi> سبتمبر`,
      covUsualNone: `المسجّل يوم أربعاء واحد (<bdi>16</bdi> سبتمبر)`,
      minutesTitle: "دقيقة بدقيقة",
      minutesAria: "قراءات اليوم دقيقة بدقيقة",
      cols: ["الوقت", "داخل الصالة", `متوسط <bdi>30</bdi> دقيقة`, "ملاحظة"],
      notes: { miss: "لا قراءة", zero: "خالية", peak: "الذروة", latest: "آخر قراءة" },
    },
    en: {
      skip: "Skip to content",
      concept: "Exploration concept · synthetic data",
      railLabel: "Sections",
      brand: "FITWAY, section names",
      nav: { daily: "Daily", reports: "Reports", access: "Access", activity: "Activity log", operations: "Operations", monitoring: "Monitoring", lang: "العربية", settings: "Settings", signout: "Sign out" },
      langAria: "Switch to Arabic",
      langGlyph: "AR",
      docTitle: "Today · FITWAY (concept)",
      title: "Today",
      date: "Wednesday, 23 September 2026",
      hours: "Open",
      live: "Live",
      delayed: "Delayed",
      lastReading: "Last reading",
      glance: "Today at a glance",
      nowTitle: "Inside now",
      staleTitle: "Last reading",
      approx: "approx.",
      ago: (n) => `${n} min ago`,
      peakTitle: "Today's peak",
      entriesTitle: "Entries",
      busiestTitle: "Busiest time",
      busiestMeta: "Last 7 days",
      busiestNote: (n) => `Average ${n}`,
      cmp: { busier: "Busier than usual", quieter: "Quieter than usual", same: "About usual" },
      chartTitle: "Today's crowd",
      keyLine: "30-min average",
      keyUsual: "Usual Wednesday",
      noHistory: "Not enough history to compare yet",
      details: "View details",
      hideDetails: "Hide details",
      peakTag: "Peak",
      levels: ["Quiet", "Moderate", "Busy", "Packed"],
      ro: { usual: "Usual", peak: "Peak", latest: "Latest", empty: "Empty", noReading: "No reading", noReadingYet: "No reading yet", ahead: "Still ahead", inside: "inside" },
      chartAria: "Today's crowd by time",
      keys: "Use the arrow keys to move 5 minutes, or 1 minute with Shift. Home goes to opening time and End to the latest reading.",
      detailsTitle: "Details",
      coverageTitle: "Data coverage",
      cov: { read: "With a reading", zero: "Open, nobody inside", miss: "No reading", wait: "No reading yet", ahead: "Still ahead", line: "The line", usual: "Usual Wednesday" },
      covReadVal: (a, b) => `${a} of ${b} minutes`,
      covLineVal: "Average of the 30 minutes around each point: 15 before and 15 after, weighted toward the middle",
      usualEntries: (n) => `Usual ${n}`,
      covUsualVal: "Average of 26 Aug and 2, 9 and 16 Sep",
      covUsualNone: "Only 1 past Wednesday recorded (16 Sep)",
      minutesTitle: "Minute by minute",
      minutesAria: "Today's readings, minute by minute",
      cols: ["Time", "Inside", "30-min average", "Note"],
      notes: { miss: "No reading", zero: "Empty", peak: "Peak", latest: "Latest reading" },
    },
  };
  const L = COPY[LANG];

  /* ------------------------------------------------------------ day constants */
  const DAY = 1140;               // 6:00 AM to 1:00 AM next day, gym time (Riyadh)
  const YMAX = 80;                // chart scale (capacity is owner-private and not drawn)
  const GAP0 = 494, GAP1 = 511;   // no reading 2:14 PM - 2:31 PM
  const ZERO_END = 9;             // open, nobody inside 6:00 AM - 6:09 AM
  const NOW = 822;                // 7:42 PM
  const STALE_LAST = 809;         // delayed state: last reading 7:29 PM
  const WIN = 30;                 // the line: centred 30-minute average (15 before, 15 after)
  const SEED = 15983;

  /* ------------------------------------------------------------ time format */
  function clock(m) {
    const abs = (((360 + m) % 1440) + 1440) % 1440;
    const h = Math.floor(abs / 60);
    return { h12: ((h + 11) % 12) + 1, mm: abs % 60, pm: h >= 12 };
  }
  const suffix = (pm) => (RTL ? (pm ? "م" : "ص") : pm ? "PM" : "AM");
  const fmtTime = (m) => { const c = clock(m); return `${c.h12}:${String(c.mm).padStart(2, "0")} ${suffix(c.pm)}`; };
  const fmtHour = (m) => { const c = clock(m); return `${c.h12} ${suffix(c.pm)}`; };
  const bdi = (s) => `<bdi>${s}</bdi>`;
  const tb = (m) => bdi(fmtTime(m));
  // Arabic ranges use a plain ASCII hyphen: an en dash would reverse the range. English uses an en dash.
  const DASH = RTL ? "-" : "–";
  const range = (a, b) => `${bdi(a)} ${DASH} ${bdi(b)}`;
  const timeRange = (a, b) => range(fmtTime(a), fmtTime(b));
  const plainRange = (a, b) => `${a} ${DASH} ${b}`;
  function hourRange(a, b) {
    const A = clock(a), B = clock(b);
    return A.pm === B.pm ? bdi(`${A.h12}${DASH}${B.h12} ${suffix(A.pm)}`) : range(fmtHour(a), fmtHour(b));
  }

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
  // The whole synthetic day is simulated up front; readings after "now" are only revealed one minute at a time by
  // the tuner's "New reading" (motion section), so a simulated live update never invents a point.
  const today = simulateDay(SEED, { am: 22, amAt: 82, mid: 8, pm: 53, pmAt: 752 });
  // The last 4 Wednesdays (16, 9, 2 Sep and 26 Aug). Complete days.
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

  const occ = today.occ;
  const levelOf = (v) => (v <= 24 ? 0 : v <= 48 ? 1 : v <= 68 ? 2 : 3);

  // The line: a centred 30-minute average. At each observed minute it is the mean of the readings from 15 minutes
  // before to 15 minutes after, with the window cut short at opening, at both edges of the missing span and at the
  // latest reading, so it never reads across the gap or into the future. The genuine zero span (6:00-6:09 AM) is
  // its own segment and stays exactly zero.
  const HALF = WIN / 2;
  // Triangular weights inside the same 15-before/15-after window (the middle minute counts most). A plain box mean
  // puts this day's crest at 6:38 PM, 9 minutes after the true 6:29 PM peak, because the peak is a spike on a
  // broad plateau; the triangular weights put it at 6:31 PM. It is still shape-preserving and never overshoots.
  const centred = (series, m, lo, hi) => {
    let s = 0, n = 0;
    for (let w = Math.max(lo, m - HALF); w <= Math.min(hi, m + HALF); w++) { const k = HALF + 1 - Math.abs(w - m); s += series[w] * k; n += k; }
    return n ? s / n : null;
  };
  // Usual Wednesday: the same centred average on each of the last 4 Wednesdays (whole days), then averaged.
  const pastAvg = PAST_WED.map((d) => d.occ.map((_, m) => centred(d.occ, m, 0, DAY - 1)));
  const usualSeries = new Array(DAY).fill(0).map((_, m) => pastAvg.reduce((a, s) => a + s[m], 0) / pastAvg.length);

  /* ---------------------------------------------------- monotone interpolation */
  // Monotone cubic Hermite (Fritsch-Carlson style): passes through every point and never overshoots them.
  function monotone(xs, ys) {
    const n = xs.length, h = [], s = [], t = new Array(n).fill(0);
    for (let i = 0; i < n - 1; i++) { h[i] = xs[i + 1] - xs[i]; s[i] = (ys[i + 1] - ys[i]) / h[i]; }
    for (let i = 1; i < n - 1; i++) {
      const p = (s[i - 1] * h[i] + s[i] * h[i - 1]) / (h[i - 1] + h[i]);
      t[i] = (Math.sign(s[i - 1]) + Math.sign(s[i])) * Math.min(Math.abs(s[i - 1]), Math.abs(s[i]), 0.5 * Math.abs(p)) || 0;
    }
    if (n === 2) { t[0] = t[1] = s[0]; }
    else if (n > 2) {
      // End tangents clamped so the first and last pieces stay monotone too.
      t[0] = (3 * s[0] - t[1]) / 2; t[n - 1] = (3 * s[n - 2] - t[n - 2]) / 2;
      if (Math.sign(t[0]) !== Math.sign(s[0])) t[0] = 0; else if (Math.abs(t[0]) > 3 * Math.abs(s[0])) t[0] = 3 * s[0];
      if (Math.sign(t[n - 1]) !== Math.sign(s[n - 2])) t[n - 1] = 0; else if (Math.abs(t[n - 1]) > 3 * Math.abs(s[n - 2])) t[n - 1] = 3 * s[n - 2];
    }
    const at = (x) => {
      if (n === 1) return ys[0];
      let i = 0;
      while (i < n - 2 && x > xs[i + 1]) i++;
      const hh = h[i], u = (x - xs[i]) / hh, u2 = u * u, u3 = u2 * u;
      return (2 * u3 - 3 * u2 + 1) * ys[i] + (u3 - 2 * u2 + u) * hh * t[i] + (-2 * u3 + 3 * u2) * ys[i + 1] + (u3 - u2) * hh * t[i + 1];
    };
    // The path through the points; `upTo` (a point index) stops it early, which the live update uses to keep the
    // unchanged part of the line exactly as drawn.
    const path = (X, Y, upTo = n - 1) => {
      let d = `M${X(xs[0]).toFixed(2)},${Y(ys[0]).toFixed(2)}`;
      for (let i = 0; i < Math.min(upTo, n - 1); i++) {
        const hh = h[i];
        d += `C${X(xs[i] + hh / 3).toFixed(2)},${Y(ys[i] + (t[i] * hh) / 3).toFixed(2)} ${X(xs[i + 1] - hh / 3).toFixed(2)},${Y(ys[i + 1] - (t[i + 1] * hh) / 3).toFixed(2)} ${X(xs[i + 1]).toFixed(2)},${Y(ys[i + 1]).toFixed(2)}`;
      }
      return d;
    };
    return { xs, ys, at, path };
  }

  // Line points: the average every 10 minutes, plus the end of the zero span, both edges of the missing span and
  // the latest reading, so the line stops exactly where the readings stop.
  const STEP = 10;
  const usualKnots = [];
  for (let m = 0; m <= DAY - 10; m += STEP) usualKnots.push(m);
  usualKnots.push(DAY - 1);
  const usual = monotone(usualKnots, usualKnots.map((m) => usualSeries[m]));
  const usualAt = (m) => Math.round(usual.at(Math.min(DAY - 1, Math.max(0, m))));

  /* ------------------------------------------------------------ today's truth
   * Everything that depends on the latest reading and on now, so a simulated new reading (motion section) can
   * recompute it. The page opens on 7:42 PM (live) or on 7:29 PM read at 7:42 PM (delayed). */
  function compute(last, nowM) {
    const obs = (m) => m >= 0 && m <= last && (m < GAP0 || m > GAP1);
    let peak = -1, peakM = -1, entries = 0, observed = 0;
    for (let m = 0; m <= last; m++) {
      if (!obs(m)) continue;
      observed++;
      entries += today.ent[m];
      if (occ[m] > peak) { peak = occ[m]; peakM = m; }
    }
    // Window bounds for minute m. After the zero span the window may still reach back into it: those zeros are
    // real readings. The window never crosses the missing span and never passes the latest reading.
    const spanOf = (m) => (m <= ZERO_END ? [0, ZERO_END] : m < GAP0 ? [0, Math.min(GAP0 - 1, last)] : [GAP1 + 1, last]);
    const avg = new Array(DAY).fill(null);
    for (let m = 0; m <= last; m++) {
      if (!obs(m)) continue;
      const [lo, hi] = spanOf(m);
      avg[m] = centred(occ, m, lo, hi);
    }
    // Where the average crests in the evening, for the capture log (it should sit at the true peak).
    let crestM = -1, crestV = -1;
    for (let m = 600; m <= last; m++) if (avg[m] != null && avg[m] > crestV) { crestV = avg[m]; crestM = m; }

    // Usual entries by the latest reading: the last 4 Wednesdays' entries up to the same minute, averaged.
    const usualEntries = Math.round(PAST_WED.reduce((a, d) => a + d.ent.slice(0, last + 1).reduce((x, y) => x + y, 0), 0) / PAST_WED.length);

    // Busiest time: the busiest 2-hour window over the last 7 days (six full days plus today so far).
    const busiest = (() => {
      const hourMean = [];
      for (let h = 0; h < 19; h++) {
        const vals = RECENT.map((d) => { let s = 0; for (let m = h * 60; m < h * 60 + 60; m++) s += d.occ[m]; return s / 60; });
        let s = 0, n = 0;
        for (let m = h * 60; m < h * 60 + 60 && m <= last; m++) if (obs(m)) { s += occ[m]; n++; }
        if (n) vals.push(s / n);
        hourMean.push(vals.reduce((a, b) => a + b, 0) / vals.length);
      }
      let best = -1, bh = 0;
      for (let h = 0; h < 18; h++) { const v = (hourMean[h] + hourMean[h + 1]) / 2; if (v > best) { best = v; bh = h; } }
      return { from: bh * 60, to: bh * 60 + 120, avg: Math.round(best) };
    })();

    const knotSet = new Set();
    for (let m = 0; m <= last; m += STEP) if (obs(m)) knotSet.add(m);
    // The evening crest of the average is a point too, so the drawn crest is the average's crest.
    [ZERO_END, GAP0 - 1, GAP1 + 1, last, crestM].forEach((m) => { if (obs(m)) knotSet.add(m); });
    const knots = [...knotSet].sort((a, b) => a - b);
    const segments = [];
    knots.forEach((m, i) => {
      if (i === 0 || (knots[i - 1] < GAP0 && m > GAP1)) segments.push([]);
      segments[segments.length - 1].push(m);
    });
    const splines = segments.map((seg) => monotone(seg, seg.map((m) => avg[m])));
    const lineAt = (m) => { const i = segments.findIndex((s) => m >= s[0] && m <= s[s.length - 1]); return i < 0 ? null : splines[i].at(m); };

    // Busier or quieter than usual: the line's value at the latest reading (the mean of the last 15 minutes) against
    // the last 4 Wednesdays over the same minutes. It needs a difference of at least 3 people and at least 10%.
    let compare = null, usualLatest = null;
    if (HAS_HISTORY && STATE === "live") {
      // Same window and weights as the line's end point, cut at the same minute.
      usualLatest = PAST_WED.reduce((acc, d) => acc + centred(d.occ, last, 0, last), 0) / PAST_WED.length;
      const a = avg[last], u = usualLatest, diff = a - u, rel = diff / Math.max(1, u);
      compare = diff >= 3 && rel >= 0.1 ? "busier" : diff <= -3 && rel <= -0.1 ? "quieter" : "same";
    }

    // Self-checks for the capture log.
    const checks = (() => {
      let drawnMax = -Infinity, drawnMin = Infinity, overshoot = 0;
      splines.forEach((sp) => {
        for (let i = 0; i < sp.xs.length - 1; i++) {
          const lo = Math.min(sp.ys[i], sp.ys[i + 1]) - 1e-9, hi = Math.max(sp.ys[i], sp.ys[i + 1]) + 1e-9;
          for (let k = 0; k <= 40; k++) {
            const y = sp.at(sp.xs[i] + ((sp.xs[i + 1] - sp.xs[i]) * k) / 40);
            if (y < lo || y > hi) overshoot++;
            drawnMax = Math.max(drawnMax, y); drawnMin = Math.min(drawnMin, y);
          }
        }
      });
      let avgMax = -Infinity, avgMin = Infinity;
      avg.forEach((v) => { if (v != null) { avgMax = Math.max(avgMax, v); avgMin = Math.min(avgMin, v); } });
      let zeroKept = true;
      for (let m = 0; m <= ZERO_END; m++) if (Math.abs(lineAt(m)) > 1e-9 || occ[m] !== 0) zeroKept = false;
      const r3 = (v) => Math.round(v * 1000) / 1000;
      return {
        peak, peakM, overshoot, drawnMax: r3(drawnMax), drawnMin: r3(drawnMin), avgMax: r3(avgMax), avgMin: r3(avgMin),
        withinAverage: drawnMax <= avgMax + 1e-9 && drawnMin >= avgMin - 1e-9,
        zeroKept,
        segments: segments.map((s) => [s[0], s[s.length - 1]]),
        lineStopsAtGap: segments.length === 2 && segments[0][segments[0].length - 1] === GAP0 - 1 && segments[1][0] === GAP1 + 1,
        lineEndsAtLast: knots[knots.length - 1] === last,
        crestM, crest: r3(crestV), crestMinusPeakMinutes: crestM - peakM,
      };
    })();

    return { last, nowM, obs, peak, peakM, entries, observed, avg, crestM, usualEntries, busiest, knots, segments, splines, lineAt, compare, usualLatest, checks };
  }
  const START = { last: STATE === "delayed" ? STALE_LAST : NOW, nowM: NOW };
  let M = compute(START.last, START.nowM);

  /* ---------------------------------------------------------------- icons */
  const ICON = {
    clock: `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.2"/><path d="M12 7.6V12l3 2"/></svg>`,
    up: `<svg class="trend" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 16.5l5.2-5.2 3.6 3.6L20 7.7"/><path d="M14.6 7.7H20v5.4"/></svg>`,
    down: `<svg class="trend" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7.5l5.2 5.2 3.6-3.6L20 16.3"/><path d="M14.6 16.3H20v-5.4"/></svg>`,
    same: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 9.5h14M5 14.5h14"/></svg>`,
    info: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.4"/><path d="M12 11v5.2M12 7.8v.2"/></svg>`,
  };

  /* ------------------------------------------------------------ motion settings
   * Read before anything renders. Motion is on unless the system asks for reduced motion, the URL says
   * ?motion=off, or the tuner's stored choice turned it off (stored choices are ignored with ?tuner=0).
   * The inline script in index.html applies the same rule before first paint. */
  const params = new URLSearchParams(location.search);
  const URL_OFF = params.get("motion") === "off";
  const TUNER_OFF = params.get("tuner") === "0";
  const MOTION_STORE = "fitway.eclipse.v3.motion";
  const MOTION_DEFAULTS = { motion: true, follow: true, followChart: false, switchOn: true, crowd: false };
  const mqReduce = matchMedia("(prefers-reduced-motion: reduce)");
  const mqFine = matchMedia("(hover: hover) and (pointer: fine)");
  let opts = (() => {
    const o = { ...MOTION_DEFAULTS };
    if (TUNER_OFF) return o;
    try {
      const raw = JSON.parse(localStorage.getItem(MOTION_STORE));
      if (raw && typeof raw === "object") Object.keys(o).forEach((k) => { if (typeof raw[k] === "boolean") o[k] = raw[k]; });
    } catch (e) { /* storage unavailable: defaults */ }
    return o;
  })();
  const motionOn = () => opts.motion && !URL_OFF && !mqReduce.matches;
  root.dataset.motion = motionOn() ? "on" : "off";

  /* ---------------------------------------------------------------- shell */
  document.title = L.docTitle;
  document.querySelectorAll("[data-t]").forEach((el) => { const v = L[el.dataset.t]; if (typeof v === "string") el.innerHTML = v; });
  const rail = $("#rail"), brand = $("#brand");
  rail.setAttribute("aria-label", L.railLabel);
  brand.setAttribute("aria-label", L.brand);
  document.querySelectorAll(".rail-item[data-nav]").forEach((a) => {
    const key = a.dataset.nav, name = L.nav[key];
    $(".rail-name", a).textContent = name;
    a.setAttribute("aria-label", key === "lang" ? L.langAria : name);
    if (a.hasAttribute("data-inert")) a.addEventListener("click", (e) => e.preventDefault());
  });
  $("#lang-glyph").textContent = L.langGlyph;
  $("#lang-glyph").setAttribute("lang", "en");
  {
    const p = new URLSearchParams(location.search);
    p.set("lang", RTL ? "en" : "ar");
    const link = $("#lang-link");
    link.setAttribute("href", `?${p.toString()}`);
    link.setAttribute("hreflang", RTL ? "en" : "ar");
    $(".rail-name", link).setAttribute("lang", RTL ? "en" : "ar");
  }
  let railOpen = false;
  const setRail = (open) => {
    if (open === railOpen) return;
    railOpen = open;
    brand.setAttribute("aria-expanded", String(open));
    animateRail(open); // motion section; without motion it only switches data-open
  };
  brand.addEventListener("click", () => setRail(!railOpen));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && railOpen) { setRail(false); brand.focus(); } });
  document.addEventListener("pointerdown", (e) => { if (railOpen && !rail.contains(e.target)) setRail(false); });

  $("#sub").innerHTML = `${L.date}<span class="sep" aria-hidden="true">·</span>${L.hours} ${timeRange(0, DAY)}`;

  const status = $("#status");
  if (STATE === "delayed") {
    status.classList.add("is-delayed");
    status.innerHTML = `${ICON.clock}<span class="strong">${L.delayed}</span><span>· ${L.lastReading} ${tb(M.last)}</span>`;
  } else {
    status.innerHTML = `<span class="dot" aria-hidden="true"></span><span class="strong">${L.live}</span><span>· ${L.lastReading} ${tb(M.last)}</span>`;
  }

  /* ---------------------------------------------------------------- cards */
  const levelChip = (v) => {
    const li = levelOf(v);
    return `<span class="level"><span class="bars" aria-hidden="true">${[0, 1, 2, 3].map((i) => `<i class="${i <= li ? "on" : ""}"></i>`).join("")}</span>${L.levels[li]}</span>`;
  };
  // The chip shows only a clear difference; about usual shows nothing.
  const cmpChip = (c) => (c === "busier" || c === "quieter"
    ? `<span class="cmp cmp-${c}">${c === "busier" ? ICON.up : c === "quieter" ? ICON.down : ICON.same}${L.cmp[c]}</span>`
    : "");
  const cardNow = $("#card-now");
  $("#now-v").textContent = String(occ[M.last]);
  if (STATE === "delayed") {
    cardNow.classList.add("is-stale");
    $("#now-label").innerHTML = `${L.staleTitle} ${tb(M.last)}`;
    $("#now-meta").classList.add("warn");
    $("#now-meta").innerHTML = `${ICON.clock}<span>${L.ago(M.nowM - M.last)}</span>`;
  } else {
    $("#now-label").textContent = L.nowTitle;
    $("#now-meta").innerHTML = `<span class="live-dot" aria-hidden="true"></span>${tb(M.last)}`;
  }
  $("#now-foot").innerHTML = levelChip(occ[M.last]) + cmpChip(M.compare);
  $("#peak-meta").innerHTML = tb(M.peakM);
  $("#peak-v").textContent = String(M.peak);
  $("#peak-foot").innerHTML = levelChip(M.peak);
  $("#entries-v").textContent = String(M.entries);
  $("#entries-usual").innerHTML = HAS_HISTORY ? L.usualEntries(bdi(M.usualEntries)) : "";
  $("#busy-meta").innerHTML = `<span>${L.busiestMeta}</span>`;
  $("#busy-v").innerHTML = hourRange(M.busiest.from, M.busiest.to);
  $("#busy-note").innerHTML = L.busiestNote(bdi(M.busiest.avg));
  $("#cards").setAttribute("aria-labelledby", "cards-title");

  // After a simulated new reading: only the values that changed are replaced, each with a quick cross-fade.
  const norm = (() => { const t = document.createElement("template"); return (html) => { t.innerHTML = html; return t.innerHTML; }; })();
  function updateCards() {
    const set = (el, html) => { if (el && el.innerHTML !== norm(html)) swap(el, html); };
    set($("#status bdi"), fmtTime(M.last));
    set($("#now-v"), String(occ[M.last]));
    if (STATE === "delayed") set($("#now-meta span"), L.ago(M.nowM - M.last));
    else set($("#now-meta bdi"), fmtTime(M.last));
    set($("#now-foot"), levelChip(occ[M.last]) + cmpChip(M.compare));
    set($("#peak-meta bdi"), fmtTime(M.peakM));
    set($("#peak-v"), String(M.peak));
    set($("#peak-foot"), levelChip(M.peak));
    set($("#entries-v"), String(M.entries));
    if (HAS_HISTORY) set($("#entries-usual bdi"), String(M.usualEntries));
    set($("#busy-v"), hourRange(M.busiest.from, M.busiest.to));
    set($("#busy-note bdi"), String(M.busiest.avg));
  }

  /* --------------------------------------------------------------- legend */
  $("#key").innerHTML = `<li><span class="sw sw-line" aria-hidden="true"></span><span>${L.keyLine}</span></li>` +
    (HAS_HISTORY
      ? `<li><span class="sw sw-usual" aria-hidden="true"></span><span>${L.keyUsual}</span></li>`
      : `<li class="key-note">${ICON.info}<span>${L.noHistory}</span></li>`);
  $("#key").setAttribute("aria-label", L.chartTitle);

  /* ---------------------------------------------------------------- chart */
  const plot = $("#plot"), svgHost = $("#plot-svg"), labels = $("#plot-labels"), tip = $("#tip"), hit = $("#plot-hit");
  const f = (n) => n.toFixed(2);
  let geo = null;
  let sel = null; // selected minute, or null
  const endPoint = () => (geo ? { x: geo.X(M.last), y: geo.Y(M.avg[M.last]) } : null);
  // Fine vertical lines every 6px from opening time, from the line down, fading out halfway. None inside the missing
  // span, none after the latest reading. `valueAt` is the line, or during a live update the morphing line.
  function hairlines(from, to, valueAt) {
    const { X, Y, yb, span } = geo;
    const dir = RTL ? -1 : 1, out = [];
    for (let i = 0; ; i++) {
      const x = Math.round(X(0)) + dir * (6 * i) + (RTL ? -1 : 0);
      const m = ((x + 0.5 - X(0)) * dir / span) * DAY;
      if (m > to) break;
      if (m < from) continue;
      const v = valueAt(m);
      if (v == null || v < 0.75) continue;
      const top = Y(v) + 2.5, len = (yb - Y(v)) * 0.5 - 2.5;
      if (len > 1) out.push(`<rect x="${x}" y="${f(top)}" width="1" height="${f(len)}" fill="url(#hair)"/>`);
    }
    return out.join("");
  }

  function render() {
    const W = Math.round(plot.clientWidth), H = Math.round(plot.clientHeight);
    if (!W || !H) return;
    const { last, nowM, peak, peakM, avg, splines, lineAt } = M;
    const gut = 40;                           // y labels sit on the inline-start side
    const span = W - gut - 6;
    const x0 = RTL ? W - gut : gut;           // opening time
    const X = (m) => (RTL ? x0 - (m / DAY) * span : x0 + (m / DAY) * span);
    const yt = 14, yb = H - 36;
    const Y = (v) => yb - (v / YMAX) * (yb - yt);
    geo = { W, H, X, Y, yt, yb, span };
    const xL = Math.min(X(0), X(DAY)), xR = Math.max(X(0), X(DAY));
    const band = (a, b) => { const l = Math.min(X(a), X(b)), r = Math.max(X(a), X(b)); return `x="${f(l)}" y="0" width="${f(r - l)}" height="${H}"`; };
    geo.band = band;

    const s = [];
    s.push(`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false"><defs>
      <linearGradient id="hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff2946" stop-opacity="0.46"/><stop offset="0.45" stop-color="#ff2946" stop-opacity="0.15"/><stop offset="1" stop-color="#ff2946" stop-opacity="0"/></linearGradient>
      <clipPath id="c-past"><rect id="c-past-r" ${band(-8, nowM)}/></clipPath>
      <clipPath id="c-ahead"><rect id="c-ahead-r" ${band(nowM, DAY + 8)}/></clipPath>
    </defs>`);

    // Faint horizontal grid. The time axis (0) is a touch stronger and breaks into dots over the missing span.
    [20, 40, 60, 80].forEach((v) => s.push(`<path d="M${f(xL)},${Math.round(Y(v)) + 0.5}H${f(xR)}" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>`));
    const by = Math.round(Y(0)) + 0.5;
    const ga = X(GAP0 - 0.5), gb = X(GAP1 + 0.5), gl = Math.min(ga, gb), gr = Math.max(ga, gb);
    if (last >= GAP0) {
      s.push(`<path d="M${f(xL)},${by}H${f(gl)}M${f(gr)},${by}H${f(xR)}" stroke="rgba(255,255,255,0.13)" stroke-width="1"/>`);
      for (let x = gl + 2.5; x <= gr - 1.5; x += 4) s.push(`<circle cx="${f(x)}" cy="${by}" r="1" fill="rgba(245,243,242,0.62)"/>`);
    } else {
      s.push(`<path d="M${f(xL)},${by}H${f(xR)}" stroke="rgba(255,255,255,0.13)" stroke-width="1"/>`);
    }

    s.push(hairlines(-Infinity, last, lineAt));

    // Usual Wednesday (dashed): up to now, then fainter to closing time.
    if (HAS_HISTORY) {
      const d = usual.path(X, Y);
      s.push(`<path id="us-past" d="${d}" fill="none" stroke="rgba(245,243,242,0.55)" stroke-width="1.5" stroke-dasharray="3.5 4.5" stroke-linecap="round" clip-path="url(#c-past)"/>`);
      s.push(`<path id="us-ahead" d="${d}" fill="none" stroke="rgba(245,243,242,0.24)" stroke-width="1.5" stroke-dasharray="3.5 4.5" stroke-linecap="round" clip-path="url(#c-ahead)"/>`);
    }

    // Today: the 30-minute average, thick and bright, with round caps where it stops.
    splines.forEach((sp, i) => s.push(`<path id="ln-${i}" d="${sp.path(X, Y)}" fill="none" stroke="#ff2946" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`));

    // The true peak: its own marker, joined to the line by a faint dotted drop.
    const px = X(peakM), py = Y(peak), ly = Y(lineAt(peakM));
    if (ly - py > 14) s.push(`<path id="pk-drop" d="M${f(px)},${f(py + 7)}V${f(ly - 4)}" stroke="rgba(245,243,242,0.4)" stroke-width="1" stroke-dasharray="1.5 3" stroke-linecap="round"/>`);
    s.push(`<circle class="peak-dot" id="pk-dot" cx="${f(px)}" cy="${f(py)}" r="4.6" fill="#0f0e0f" stroke="#f5f3f2" stroke-width="2"/>`);

    // The end of the line: live has a red end point with a thin halo; delayed ends on a neutral point.
    const ex = X(last), ey = Y(avg[last]);
    s.push(STATE === "delayed"
      ? `<circle id="end-dot" cx="${f(ex)}" cy="${f(ey)}" r="4.4" fill="#8f898b" stroke="#0f0e0f" stroke-width="2"/>`
      : `<circle id="end-halo" cx="${f(ex)}" cy="${f(ey)}" r="9" fill="none" stroke="rgba(255,41,70,0.32)" stroke-width="1"/><circle id="end-dot" cx="${f(ex)}" cy="${f(ey)}" r="4.4" fill="#ff2946" stroke="#0f0e0f" stroke-width="2"/>`);
    s.push(`<g id="sel"></g></svg>`);
    svgHost.innerHTML = s.join("");

    // HTML labels (so bidi and fonts behave), placed on the same geometry.
    const lab = [];
    [0, 20, 40, 60, 80].forEach((v) => lab.push(`<span class="ax-y" style="inset-inline-start:0;top:${f(Y(v))}px;transform:translateY(-50%)">${bdi(String(v))}</span>`));
    for (let h = 0; h <= 18; h += 2) lab.push(`<span class="ax-x" style="left:${f(X(h * 60))}px;top:${f(yb + 13)}px;transform:translateX(-50%)">${bdi(fmtHour(h * 60))}</span>`);
    lab.push(`<span class="ax-x" style="left:${f(X(DAY))}px;top:${f(yb + 13)}px;transform:translateX(${RTL ? "0" : "-100%"})">${bdi(fmtHour(DAY))}</span>`);
    lab.push(`<span class="peak-tag" id="peak-tag" style="left:${f(px)}px;top:${f(py - 12)}px;transform:translate(-50%,-100%)">${L.peakTag}<b>${bdi(String(peak))}</b></span>`);
    labels.innerHTML = lab.join("");
    guide.x = null; // the selection is redrawn in place, without a glide
    drawSelection();
    afterRender(); // motion section: keeps a running load sequence and the live pulse attached to the new chart
  }

  /* ------------------------------------------------------ chart inspection */
  const kindAt = (m) => (m > M.nowM ? "ahead" : m > M.last ? "wait" : m >= GAP0 && m <= GAP1 ? "miss" : m <= ZERO_END ? "zero" : "read");
  const sepc = RTL ? "، " : ", ";
  function valueText(m) {
    const k = kindAt(m), t = fmtTime(m);
    if (k === "miss") return `${t}${sepc}${L.ro.noReading} (${plainRange(fmtTime(GAP0), fmtTime(GAP1))})`;
    if (k === "wait") return `${t}${sepc}${L.ro.noReadingYet}`;
    if (k === "ahead") return `${t}${sepc}${L.ro.ahead}${HAS_HISTORY ? `${sepc}${L.ro.usual} ${usualAt(m)}` : ""}`;
    if (k === "zero") return `${t}${sepc}0${sepc}${L.ro.empty}`;
    const v = occ[m];
    let out = `${t}${sepc}${v} ${L.ro.inside}${sepc}${L.levels[levelOf(v)]}`;
    if (m === M.peakM) out += `${sepc}${L.ro.peak}`;
    if (m === M.last) out += `${sepc}${L.ro.latest}`;
    if (HAS_HISTORY) out += `${sepc}${L.ro.usual} ${usualAt(m)}`;
    return out;
  }

  // The guide line and the tooltip glide to a new minute (pointer or keyboard) instead of jumping. At rest they
  // sit exactly where the static page puts them: the glide is a transform that runs out to none.
  const guide = { x: null, y: null, anim: [], tipAnim: null };
  function drawSelection() {
    const g = $("#sel");
    const peakTag = $("#peak-tag");
    if (!geo || !g) return;
    if (sel == null) {
      g.innerHTML = "";
      guide.x = guide.y = null;
      guide.anim = [];
      hideTip();
      if (peakTag) peakTag.classList.remove("is-covered");
      return;
    }
    const { X, Y, yt, yb, W, H } = geo;
    const m = sel, k = kindAt(m), x = X(m);
    const onPoint = k === "read" || k === "zero";
    const v = onPoint ? occ[m] : null;
    // Where the guide and the tip are on screen right now (mid-glide included), before they move.
    const glide = motionOn() && guide.x != null && !tip.hidden && !tipHiding;
    const fromX = glide ? guide.x + currentOffset(guide.anim[0], "x") : null;
    const fromY = glide && guide.y != null ? guide.y + currentOffset(guide.anim[1], "y") : null;
    const tipFrom = glide ? tip.getBoundingClientRect() : null;
    guide.anim.forEach((a) => a && a.cancel());
    guide.anim = [];

    let out = `<path d="M${f(Math.round(x) + 0.5)},${yt}V${yb}" stroke="rgba(245,243,242,${onPoint ? 0.42 : 0.3})" stroke-width="1"${onPoint ? "" : ' stroke-dasharray="2 3"'}/>`;
    if (onPoint) out += `<circle cx="${f(x)}" cy="${f(Y(v))}" r="5.2" fill="#0f0e0f" stroke="#f5f3f2" stroke-width="2"/><circle cx="${f(x)}" cy="${f(Y(v))}" r="2" fill="#ff2946"/>`;
    g.innerHTML = out;

    const flag = m === M.peakM && k === "read" ? L.ro.peak : m === M.last && k === "read" ? L.ro.latest : "";
    const usualRow = HAS_HISTORY && k !== "miss" && k !== "zero" ? `<div class="tip-u"><span class="sw sw-usual" aria-hidden="true"></span><span>${L.ro.usual} ${bdi(usualAt(m))}</span></div>` : "";
    let html = `<div class="tip-t">${tb(m)}${flag ? `<span class="tip-flag">${flag}</span>` : ""}</div>`;
    if (k === "read") html += `<div class="tip-main"><span class="tip-v">${bdi(v)}</span><span class="tip-l">${L.levels[levelOf(v)]}</span></div>${usualRow}`;
    else if (k === "zero") html += `<div class="tip-main"><span class="tip-v">${bdi(0)}</span><span class="tip-l">${L.ro.empty}</span></div>`;
    else if (k === "miss") html += `<div class="tip-main"><span class="tip-word">${L.ro.noReading}</span></div><div class="tip-u"><span>${timeRange(GAP0, GAP1)}</span></div>`;
    else if (k === "wait") html += `<div class="tip-main"><span class="tip-word">${L.ro.noReadingYet}</span></div>`;
    else html += `<div class="tip-main"><span class="tip-word">${L.ro.ahead}</span></div>${usualRow}`;
    const appearing = tip.hidden || tipHiding;
    showTip(html);

    // Beside the guide, on the earlier side of the day when it fits; its bottom just above the point.
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    const py = onPoint ? Y(v) : yt + (yb - yt) * 0.35;
    const earlierRight = RTL;
    let left = earlierRight ? x + 12 : x - 12 - tw;
    if (left < 2 || left + tw > W - 2) left = earlierRight ? x - 12 - tw : x + 12;
    left = Math.max(2, Math.min(W - tw - 2, left));
    let top = py - th - 10;
    if (top < 0) top = Math.min(py + 12, H - th);
    tip.style.left = `${f(left)}px`;
    tip.style.top = `${f(top)}px`;

    if (glide) glideSelection(g, x, fromX, onPoint ? Y(v) : null, fromY, tipFrom);
    else if (appearing && motionOn()) tipAppear();
    guide.x = x;
    guide.y = onPoint ? Y(v) : null;

    if (peakTag) {
      const pr = plot.getBoundingClientRect(), b = peakTag.getBoundingClientRect();
      const r = { l: left - 4, r: left + tw + 4, t: top - 4, b: top + th + 4 };
      const covered = !(b.right - pr.left < r.l || b.left - pr.left > r.r || b.bottom - pr.top < r.t || b.top - pr.top > r.b);
      peakTag.classList.toggle("is-covered", covered);
    }
    hit.setAttribute("aria-valuenow", String(m));
    hit.setAttribute("aria-valuetext", valueText(m));
  }

  // Slider semantics for keyboard inspection. The same readout follows the pointer, a tap, or the arrow keys.
  hit.setAttribute("aria-label", L.chartAria);
  hit.setAttribute("aria-valuemin", "0");
  hit.setAttribute("aria-valuemax", String(DAY));
  hit.setAttribute("aria-valuenow", String(M.last));
  hit.setAttribute("aria-valuetext", valueText(M.last));
  $("#chart-keys").textContent = L.keys;
  const minuteAt = (clientX) => {
    const pr = plot.getBoundingClientRect();
    const x = clientX - pr.left;
    const x0 = geo.X(0), x1 = geo.X(DAY);
    return ((x - x0) / (x1 - x0)) * DAY;
  };
  const pick = (clientX) => {
    if (!geo) return;
    const m = Math.round(minuteAt(clientX));
    sel = m < 0 || m > DAY ? null : m;
    drawSelection();
  };
  let pinned = false;
  hit.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse" && !pinned) pick(e.clientX); });
  hit.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse" && !pinned && document.activeElement !== hit) { sel = null; drawSelection(); } });
  hit.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") { pinned = true; pick(e.clientX); } });
  hit.addEventListener("focus", () => { if (sel == null) { sel = M.last; drawSelection(); } });
  hit.addEventListener("blur", () => { pinned = false; sel = null; drawSelection(); });
  hit.addEventListener("keydown", (e) => {
    let m = sel ?? M.last;
    const step = e.shiftKey ? 1 : 5;
    const later = RTL ? "ArrowLeft" : "ArrowRight", earlier = RTL ? "ArrowRight" : "ArrowLeft";
    if (e.key === later || e.key === "ArrowUp") m += step;
    else if (e.key === earlier || e.key === "ArrowDown") m -= step;
    else if (e.key === "PageUp") m += 60;
    else if (e.key === "PageDown") m -= 60;
    else if (e.key === "Home") m = 0;
    else if (e.key === "End") m = M.last;
    else if (e.key === "Escape") { sel = null; drawSelection(); return; }
    else return;
    e.preventDefault();
    sel = Math.max(0, Math.min(DAY, m));
    drawSelection();
  });

  // Text equivalent of the chart.
  function summary() {
    const { last, nowM, peak, peakM } = M;
    return RTL
      ? `مخطط خطي لمتوسط كل 30 دقيقة لعدد الموجودين تقريبًا اليوم، من الفتح الساعة ${fmtTime(0)} حتى آخر قراءة الساعة ${fmtTime(last)}. ` +
        `الصالة مفتوحة وخالية من ${plainRange(fmtTime(0), fmtTime(ZERO_END))}. لا قراءة من ${plainRange(fmtTime(GAP0), fmtTime(GAP1))}. ` +
        `أعلى قراءة ${peak} الساعة ${fmtTime(peakM)} (${L.levels[levelOf(peak)]}). آخر قراءة ${occ[last]} الساعة ${fmtTime(last)} (${L.levels[levelOf(occ[last])]}).` +
        (STATE === "delayed" ? ` البيانات متأخرة، لا قراءة جديدة منذ ${arMin(nowM - last)}.` : "") +
        (HAS_HISTORY ? ` يظهر خط متقطع للأربعاء المعتاد، متوسط آخر 4 أيام أربعاء، حتى وقت الإغلاق.` : ` ${L.noHistory}.`) +
        ` بقية اليوم من ${plainRange(fmtTime(nowM + 1), fmtTime(DAY))} لم يحن بعد. كل الدقائق في عرض التفاصيل.`
      : `Line chart of the 30-minute average of the approximate number of people inside today, from opening at ${fmtTime(0)} to the latest reading at ${fmtTime(last)}. ` +
        `Open with nobody inside ${plainRange(fmtTime(0), fmtTime(ZERO_END))}. No reading ${plainRange(fmtTime(GAP0), fmtTime(GAP1))}. ` +
        `Highest reading ${peak} at ${fmtTime(peakM)} (${L.levels[levelOf(peak)]}). Latest reading ${occ[last]} at ${fmtTime(last)} (${L.levels[levelOf(occ[last])]}).` +
        (STATE === "delayed" ? ` Data is delayed: no new reading for ${nowM - last} minutes.` : "") +
        (HAS_HISTORY ? " A dashed line shows the usual Wednesday, the average of the last 4 Wednesdays, through to closing time." : ` ${L.noHistory}.`) +
        ` The rest of the day, ${plainRange(fmtTime(nowM + 1), fmtTime(DAY))}, is still ahead. Every minute is listed under View details.`;
  }
  $("#chart-summary").textContent = summary();

  /* -------------------------------------------------------------- details */
  const detailsBtn = $("#details-btn"), details = $("#details");
  let built = false;
  const minText = (n) => (RTL ? arMin(n) : `${n} min`);
  function buildDetails() {
    if (built) return;
    built = true;
    const { last, nowM, peakM, observed, avg, obs } = M;
    const pct = (m) => `${((m / DAY) * 100).toFixed(3)}%`;
    const seg = (cls, a, b) => `<span class="${cls}" style="inset-inline-start:${pct(a)};width:${pct(b - a)}"></span>`;
    const strip = [seg("s-zero", 0, ZERO_END + 1), seg("s-read", ZERO_END + 1, GAP0), seg("s-miss", GAP0, GAP1 + 1), seg("s-read", GAP1 + 1, last + 1)];
    if (STATE === "delayed") strip.push(seg("s-wait", last + 1, nowM + 1));
    strip.push(seg("s-ahead", nowM + 1, DAY));
    const axis = [0, 360, 720, DAY].map((m, i, a) => `<span class="${i === 0 ? "first" : i === a.length - 1 ? "last" : ""}" style="inset-inline-start:${pct(m)}">${bdi(fmtHour(m))}</span>`).join("");
    const facts = [];
    const fact = (k, dt, dd) => facts.push(`<div><dt><span class="k ${k}" aria-hidden="true"></span>${dt}</dt><dd>${dd}</dd></div>`);
    fact("k-read", L.cov.read, L.covReadVal(bdi(observed), bdi(last + 1)));
    fact("k-zero", L.cov.zero, `${timeRange(0, ZERO_END)}`);
    fact("k-miss", L.cov.miss, `${timeRange(GAP0, GAP1)} · ${bdi(minText(GAP1 - GAP0 + 1))}`);
    if (STATE === "delayed") fact("k-wait", L.cov.wait, `${timeRange(last + 1, nowM)} · ${bdi(minText(nowM - last))}`);
    fact("k-ahead", L.cov.ahead, timeRange(nowM + 1, DAY));
    fact("k-none", L.cov.line, L.covLineVal);
    fact("k-none", L.cov.usual, HAS_HISTORY ? L.covUsualVal : L.covUsualNone);
    $("#coverage").innerHTML = `<h3>${L.coverageTitle}</h3><div class="strip" aria-hidden="true">${strip.join("")}</div><div class="strip-axis" aria-hidden="true">${axis}</div><dl class="facts">${facts.join("")}</dl>`;

    const rows = [];
    for (let m = 0; m <= last; m++) {
      const miss = !obs(m);
      const note = miss ? L.notes.miss : m <= ZERO_END ? L.notes.zero : m === peakM ? L.notes.peak : m === last ? L.notes.latest : "";
      rows.push(`<tr class="${miss ? "miss" : m === peakM ? "peak" : ""}"><td>${tb(m)}</td><td class="n">${miss ? '<span aria-hidden="true">-</span>' : bdi(occ[m])}</td><td>${miss ? "" : bdi(avg[m].toFixed(1))}</td><td>${note}</td></tr>`);
    }
    $("#minutes").innerHTML = `<h3 id="minutes-title">${L.minutesTitle}</h3>
      <div class="scroller" tabindex="0" role="region" aria-labelledby="minutes-title">
        <table class="minutes-table"><caption class="sr-only">${L.minutesAria}</caption>
        <thead><tr>${L.cols.map((c) => `<th scope="col">${c}</th>`).join("")}</tr></thead>
        <tbody>${rows.join("")}</tbody></table>
      </div>`;
  }
  const detailsLabel = $("span", detailsBtn);
  detailsBtn.addEventListener("click", () => {
    const open = details.hidden;
    if (open) buildDetails();
    details.hidden = !open;
    detailsBtn.setAttribute("aria-expanded", String(open));
    detailsLabel.textContent = open ? L.hideDetails : L.details;
    if (open) details.scrollIntoView({ behavior: motionOn() ? "smooth" : "auto", block: "start" });
  });

  /* ================================================================ motion
   * Round 5 section 4. Transform and opacity only, except the line itself (its drawn length) and the live tail
   * (its shape), which are SVG geometry by nature. Everything runs out to the static page's final state: at rest
   * no inline style, attribute or extra element from this section remains (the live pulse is the one exception,
   * and only while live). */
  const EASE = {
    enter: "cubic-bezier(0.22, 1, 0.36, 1)",     // cards and chart arrive: quick start, long quiet settle
    draw: "cubic-bezier(0.5, 0, 0.2, 1)",        // the line: under way at once, then a long ease into now
    reveal: "cubic-bezier(0.22, 1, 0.36, 1)",    // end point and peak marker
    slide: "cubic-bezier(0.22, 1, 0.36, 1)",     // a light slides into place: decisive start, long gentle settle (quint-out)
    rise: "cubic-bezier(0.5, 0, 0.2, 1)",        // the chart's light rises on the line's own curve, so they arrive together
    swap: "cubic-bezier(0.2, 0.7, 0.2, 1)",      // number cross-fade
    morph: "cubic-bezier(0.4, 0, 0.2, 1)",       // live tail
    rail: "cubic-bezier(0.22, 1, 0.36, 1)",      // rail opens
    railClose: "cubic-bezier(0.4, 0, 0.2, 1)",   // rail closes
    glide: "cubic-bezier(0.22, 1, 0.36, 1)",     // tooltip and guide
  };
  const T = {
    cardStagger: 60, cardDur: 620, cardRise: 14,
    chartDelay: 200, chartDur: 700, chartRise: 18,
    drawDelay: 560, drawDur: 1100,
    endDotDur: 320, peakGap: 80, peakDur: 420,
    // Lights entrance (see lightsEnter). Opacity curves are [progress along the movement, share of the rest opacity];
    // null means the light only moves.
    nowDelay: 380, nowSlide: 1400, nowFrom: 0.5, nowOpacity: null,
    chartLightDelay: 560, chartLightRise: 1350, chartLightDrop: 0.5, chartOpacity: [[0, 0], [0.25, 0.8]],
    washDelay: 60, washDur: 1700, washDrift: [120, 60], washOpacity: [[0, 0], [0.3, 0.5], [0.6, 0.85]],
    rimLag: 90, rimOpacity: [[0, 0], [0.35, 0.45], [0.7, 0.9]],
    swapIn: 200, swapOut: 140,
    morphDur: 700,
    railOpen: 300, railClose: 240, railNamesOut: 110, railDist: 156,
    glideMin: 140, glideMax: 320,
    tipIn: 120, tipOut: 90,
  };
  const played = []; // every animation this section started, so motion off can finish them at once

  // A clock: an animation with no target and no keyframes, whose eased progress drives the SVG line work.
  const clockAnim = (timing) => { const a = new Animation(new KeyframeEffect(null, [], timing), document.timeline); a.play(); return a; };
  function track(a) { played.push(a); a.finished.catch(() => {}).then(() => { const i = played.indexOf(a); if (i >= 0) played.splice(i, 1); }); return a; }
  // Offset still left on a glide (the transform keyframe runs from `from` to 0 with the easing applied).
  function currentOffset(a, axis) {
    if (!a || !a._from) return 0;
    const p = a.effect.getComputedTiming().progress;
    return p == null ? 0 : a._from[axis] * (1 - p);
  }

  /* ---- numbers: a quick cross-fade (never a count) */
  function swap(el, html) {
    if (!motionOn() || !el.isConnected || !el.offsetParent) { el.innerHTML = html; return; }
    const ghost = el.cloneNode(true);
    ghost.removeAttribute("id");
    ghost.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
    ghost.setAttribute("aria-hidden", "true");
    ghost.classList.add("x-ghost");
    Object.assign(ghost.style, { position: "absolute", left: `${el.offsetLeft}px`, top: `${el.offsetTop}px`, width: `${el.offsetWidth}px`, height: `${el.offsetHeight}px`, margin: "0", pointerEvents: "none" });
    el.after(ghost);
    el.innerHTML = html;
    track(el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: T.swapIn, easing: EASE.swap }));
    const out = track(ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: T.swapOut, easing: "ease-out", fill: "forwards" }));
    out.finished.catch(() => {}).then(() => ghost.remove());
  }

  /* ---- tooltip and guide: fade in once, then glide */
  let tipHiding = false;
  function showTip(html) {
    if (tipHiding && guide.tipAnim) { guide.tipAnim.cancel(); guide.tipAnim = null; }
    tipHiding = false;
    tip.innerHTML = html;
    tip.hidden = false;
  }
  function hideTip() {
    if (tip.hidden || tipHiding) return;
    if (!motionOn()) { tip.hidden = true; return; }
    tipHiding = true;
    const a = track(tip.animate([{ opacity: 1 }, { opacity: 0 }], { duration: T.tipOut, easing: "ease-out", fill: "forwards" }));
    guide.tipAnim = a;
    a.finished.then(() => { if (tipHiding) { tip.hidden = true; tipHiding = false; } a.cancel(); }).catch(() => {});
  }
  function tipAppear() {
    track(tip.animate([{ opacity: 0 }, { opacity: 1 }], { duration: T.tipIn, easing: "ease-out" }));
  }
  function glideSelection(g, x, fromX, y, fromY, tipFrom) {
    const dist = Math.abs(fromX - x);
    if (dist < 0.01 && (fromY == null || y == null || Math.abs(fromY - y) < 0.01)) return;
    const duration = Math.round(Math.min(T.glideMax, T.glideMin + dist * 0.12));
    const o = { duration, easing: EASE.glide };
    // Guide line: along x only. The point: along x and y (it rides the reading, not the average).
    const line = g.firstElementChild;
    const gx = fromX - x;
    const a = track(line.animate([{ transform: `translate(${gx}px, 0px)` }, { transform: "none" }], o));
    a._from = { x: gx, y: 0 };
    const b = [];
    if (y != null) {
      const dy = fromY == null ? 0 : fromY - y;
      [...g.querySelectorAll("circle")].forEach((c) => {
        const an = track(c.animate([{ transform: `translate(${gx}px, ${dy}px)` }, { transform: "none" }], o));
        an._from = { x: gx, y: dy };
        b.push(an);
      });
    }
    guide.anim = [a, b[0] || null, ...b.slice(1)];
    if (guide.tipAnim) { guide.tipAnim.cancel(); guide.tipAnim = null; }
    const to = tip.getBoundingClientRect();
    const tx = tipFrom.left - to.left, ty = tipFrom.top - to.top;
    if (Math.abs(tx) + Math.abs(ty) > 0.25) guide.tipAnim = track(tip.animate([{ transform: `translate(${tx}px, ${ty}px)` }, { transform: "none" }], o));
  }

  /* ---- load: cards and chart enter once, the line draws from opening to now, then the peak marker appears;
   * the lights switch on after the cards (optional). One timeline, so it can be replayed and seeked. */
  const intro = { anims: [], clock: null, raf: 0, active: false, paused: false, started: false, hairs: null, nowPath: null, chartDrop: 0 };
  const chartCard = $(".chart");
  function introHide() {
    // The end point and the peak marker wait for the line (they are revealed by their own animations).
    ["#end-dot", "#end-halo", "#pk-dot", "#pk-drop", "#peak-tag"].forEach((s) => { const n = $(s); if (n) n.style.opacity = "0"; });
  }
  function introBindChart() {
    // (Re)attach the chart parts of the load sequence to the current chart DOM, in step with the clock.
    if (!intro.active) return;
    intro.anims.filter((a) => a._chart).forEach((a) => a.cancel());
    intro.anims = intro.anims.filter((a) => !a._chart);
    const t = intro.clock.currentTime;
    const endAt = T.drawDelay + T.drawDur, peakAt = endAt + T.peakGap;
    const add = (sel, kf, delay, dur, prep) => {
      const n = $(sel);
      if (!n) return;
      if (prep) prep(n);
      n.style.removeProperty("opacity");
      const a = n.animate(kf, { duration: dur, delay, easing: EASE.reveal, fill: "backwards" });
      a._chart = true;
      a.currentTime = t;
      if (intro.paused) a.pause();
      intro.anims.push(track(a));
    };
    const box = (n) => { n.style.transformBox = "fill-box"; n.style.transformOrigin = "center"; };
    add("#end-halo", [{ opacity: 0, scale: "0.4" }, { opacity: 1, scale: "1" }], endAt, T.endDotDur, box);
    add("#end-dot", [{ opacity: 0, scale: "0.4" }, { opacity: 1, scale: "1" }], endAt, T.endDotDur, box);
    add("#pk-drop", [{ opacity: 0 }, { opacity: 1 }], peakAt, T.peakDur);
    add("#pk-dot", [{ opacity: 0, scale: "0.5" }, { opacity: 1, scale: "1" }], peakAt, T.peakDur, box);
    add("#peak-tag", [{ opacity: 0, translate: "0 5px" }, { opacity: 1, translate: "0 0" }], peakAt, T.peakDur);
    intro.hairs = null;
    applyDraw();
  }
  // The line's drawn length follows a minute that runs from opening to the latest reading; the fine vertical
  // lines appear behind it with a short soft edge.
  const lenTables = new WeakMap();
  function lengthTable(path) {
    let t = lenTables.get(path);
    if (t) return t;
    const total = path.getTotalLength(), n = Math.max(32, Math.ceil(total / 3)), xs = new Float64Array(n + 1), ls = new Float64Array(n + 1);
    for (let i = 0; i <= n; i++) { const l = (total * i) / n; ls[i] = l; xs[i] = path.getPointAtLength(l).x; }
    t = { total, xs, ls, n };
    lenTables.set(path, t);
    return t;
  }
  function lengthAtX(t, x) {
    const dir = RTL ? -1 : 1;
    if ((x - t.xs[0]) * dir <= 0) return 0;
    if ((x - t.xs[t.n]) * dir >= 0) return t.total;
    let lo = 0, hi = t.n;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if ((t.xs[mid] - x) * dir < 0) lo = mid; else hi = mid; }
    const k = (x - t.xs[lo]) / (t.xs[hi] - t.xs[lo] || 1);
    return t.ls[lo] + k * (t.ls[hi] - t.ls[lo]);
  }
  function applyDraw() {
    if (!intro.active || !geo) return;
    const p = intro.clock.effect.getComputedTiming().progress ?? 0;
    const done = p >= 1;
    const head = p * M.last, hx = geo.X(head), dir = RTL ? -1 : 1;
    M.segments.forEach((seg, i) => {
      const path = $(`#ln-${i}`);
      if (!path) return;
      if (done || head >= seg[seg.length - 1]) { path.removeAttribute("stroke-dasharray"); path.removeAttribute("visibility"); return; }
      if (head <= seg[0]) { path.setAttribute("visibility", "hidden"); return; }
      const t = lengthTable(path), l = lengthAtX(t, hx);
      path.removeAttribute("visibility");
      path.setAttribute("stroke-dasharray", `${l.toFixed(2)} ${(t.total + 10).toFixed(2)}`);
    });
    if (!intro.hairs) intro.hairs = [...svgHost.querySelectorAll('rect[fill="url(#hair)"]')].map((r) => ({ r, x: Number(r.getAttribute("x")) }));
    intro.hairs.forEach(({ r, x }) => {
      if (done) { r.removeAttribute("opacity"); return; }
      const behind = (hx - x) * dir; // px behind the head
      const o = behind <= 0 ? 0 : Math.min(1, behind / 36);
      if (o >= 1) r.removeAttribute("opacity"); else r.setAttribute("opacity", o.toFixed(3));
    });
  }
  function introLoop() {
    intro.raf = 0;
    if (!intro.active) return;
    applyDraw();
    // Done when every part has run out (a seeked, paused sequence never ends on its own).
    if (!intro.paused && [intro.clock, ...intro.anims].every((a) => a.playState === "finished")) { introCleanup(); startPulse(); return; }
    intro.raf = requestAnimationFrame(introLoop);
  }
  function introCleanup() {
    const wasActive = intro.active;
    cancelAnimationFrame(intro.raf);
    intro.raf = 0;
    intro.active = false;
    intro.anims.forEach((a) => a.cancel());
    intro.anims = [];
    if (intro.clock) intro.clock.cancel();
    intro.clock = null;
    intro.hairs = null;
    // Back to the static chart exactly: no dash, no opacity, no inline styles on the revealed marks.
    M.segments.forEach((_, i) => { const p = $(`#ln-${i}`); if (p) { p.removeAttribute("stroke-dasharray"); p.removeAttribute("visibility"); } });
    svgHost.querySelectorAll('rect[fill="url(#hair)"][opacity]').forEach((r) => r.removeAttribute("opacity"));
    ["#end-dot", "#end-halo", "#pk-dot", "#pk-drop", "#peak-tag"].forEach((s) => { const n = $(s); if (n) { n.style.removeProperty("opacity"); n.style.removeProperty("transform-box"); n.style.removeProperty("transform-origin"); if (!n.getAttribute("style")) n.removeAttribute("style"); } });
    delete root.dataset.intro;
    delete root.dataset.lights;
    lightsRest();
    if (wasActive) render(); // the canonical chart markup, exactly as the static page draws it
  }

  /* ---- lights: the load entrance (the tuner's "switch on at load"). Transform and opacity only; each light runs
   * out to exactly its rest geometry, and no pixel is ever brighter than it is at rest.
   *   Inside now: the light slides in behind the disc. The disc, the mask on .lamp-in, stays fixed; the light layer
   *     behind it (the light and its grain) starts out beyond the lit bottom corner, on the axis that runs from that
   *     corner to the disc's centre, and slides along it into place. The crescent grows out of the lit corner along
   *     the disc's arc, and the thin bottom rim and the far-corner glow arrive with it; the disc's edge takes shape as
   *     the light reaches it. It is the pointer-follow light's own mechanism: the layer is larger than the card by
   *     --lp, so no edge is ever exposed. It only moves; it does not fade.
   *     Why from beyond the corner and not from the disc's centre: a light that starts toward the disc's centre
   *     passes over the crescent on its way out, so the crescent is brighter than at rest for most of the way (about
   *     7,000 pixels of the card; it would have to stay below about 20% opacity to avoid that, which is a fade
   *     again). Coming in from beyond the corner, every pixel only ever brightens (measured; see README).
   *   Chart card: the U rises from under the bottom edge on the line's own curve, starting with it, so light and
   *     data arrive together; it settles a moment after the line reaches now.
   *   Page wash: drifts in from its corner (the inline-start top corner, off the page) while it brightens.
   *   Rims: each lit border (and the rail's rim, for the wash) catches the light a beat after it arrives. */
  function nowPath() {
    const lamp = $("#card-now .lamp");
    const W = lamp.clientWidth, H = lamp.clientHeight;
    const cs = getComputedStyle(root);
    const n = (v, d) => { const x = parseFloat(cs.getPropertyValue(v)); return Number.isFinite(x) ? x : d; };
    // The disc, as the lighting section draws it: centre measured from the lit side, lowest point --now-rim above
    // the bottom edge. So the path follows the light settings, including the tuner's.
    const rx = (n("--now-disc-size", 77) / 100) * W, ry = rx * n("--now-disc-aspect", 0.7);
    const cx = (n("--now-disc-x", 67) / 100) * W, cy = H - (n("--now-rim", 8) / 100) * H - ry;
    // The axis from the lit bottom corner to the disc's centre; the light starts nowFrom of that distance beyond the
    // corner (away from the disc) and slides along it.
    const vx = cx, vy = cy - H, len = Math.hypot(vx, vy) || 1, dist = len * T.nowFrom;
    const dx = -(RTL ? 1 : -1) * (vx / len) * dist, dy = -(vy / len) * dist;
    return { dx: Math.round(dx * 10) / 10, dy: Math.round(dy * 10) / 10, lp: Math.ceil(Math.abs(dist)) + 8 };
  }
  function lightsEnter(add) {
    const light = (card) => ({ card, lampIn: $(".lamp-in", card), rim: $(".lamp-rim", card) });
    const now = light($("#card-now")), chart = light(chartCard);
    const layers = (l, kf, o) => ["::before", "::after"].forEach((pe) => add(l.lampIn, kf, { ...o, pseudoElement: pe }));
    // Opacity along a curve of [progress, share of the rest value] pairs. It shares the movement's timing and easing,
    // so each share belongs to a place along the way; the rest value is read first, so a tuned or crowd opacity holds.
    const ramp = (el, curve, o, pe) => {
      if (!curve) return;
      const base = parseFloat(getComputedStyle(el, pe || null).opacity) || 1;
      add(el, [...curve.map(([offset, v]) => ({ offset, opacity: +(base * v).toFixed(4) })), { offset: 1, opacity: base }], pe ? { ...o, pseudoElement: pe } : o);
    };

    // Inside now. A pointer that reached the card before the load began lets go of the light first (the follow
    // stays off until the load ends), so only the entrance moves it.
    resetPeeks();
    const p = nowPath();
    now.card.classList.add("is-entering");
    now.card.style.setProperty("--enter-lp", `${p.lp}px`);
    const slide = { duration: T.nowSlide, delay: T.nowDelay, easing: EASE.slide };
    layers(now, [{ transform: `translate(${p.dx}px, ${p.dy}px)` }, { transform: "translate(0px, 0px)" }], slide);
    ramp(now.lampIn, T.nowOpacity, slide);
    ramp(now.rim, T.rimOpacity, { ...slide, delay: T.nowDelay + T.rimLag });

    // Chart card.
    const drop = Math.round(chart.lampIn.clientHeight * T.chartLightDrop);
    const rise = { duration: T.chartLightRise, delay: T.chartLightDelay, easing: EASE.rise };
    layers(chart, [{ transform: `translate(0px, ${drop}px)` }, { transform: "translate(0px, 0px)" }], rise);
    ramp(chart.lampIn, T.chartOpacity, rise);
    ramp(chart.rim, T.rimOpacity, { ...rise, delay: T.chartLightDelay + T.rimLag });

    // Page wash, from its corner; the rail's rim catches it.
    const [wx, wy] = T.washDrift;
    const drift = { duration: T.washDur, delay: T.washDelay, easing: EASE.slide };
    add($(".wash-light"), [{ transform: `translate(${RTL ? wx : -wx}px, ${-wy}px)` }, { transform: "translate(0px, 0px)" }], drift);
    ramp($(".wash"), T.washOpacity, drift);
    ramp(rail, T.rimOpacity, { ...drift, delay: T.washDelay + T.rimLag + 120 }, "::after");
    intro.nowPath = p;
    intro.chartDrop = drop;
  }
  function lightsRest() {
    const c = $("#card-now");
    c.classList.remove("is-entering");
    c.style.removeProperty("--enter-lp");
    if (!c.getAttribute("style")) c.removeAttribute("style");
  }
  function startIntro() {
    finishIntro();
    stopPulse();
    if (!motionOn()) { introCleanup(); return; }
    intro.active = true;
    intro.paused = false;
    intro.started = true;
    const anims = [];
    const add = (el, kf, o) => { const a = el.animate(kf, { fill: "backwards", ...o }); anims.push(track(a)); return a; };
    [...document.querySelectorAll(".cards > .card")].forEach((el, i) => add(el,
      [{ opacity: 0, transform: `translateY(${T.cardRise}px)` }, { opacity: 1, transform: "none" }],
      { duration: T.cardDur, delay: i * T.cardStagger, easing: EASE.enter }));
    add(chartCard, [{ opacity: 0, transform: `translateY(${T.chartRise}px)` }, { opacity: 1, transform: "none" }],
      { duration: T.chartDur, delay: T.chartDelay, easing: EASE.enter });
    if (opts.switchOn) lightsEnter(add);
    // The clock is an empty animation: its eased progress is the line's head.
    intro.clock = track(clockAnim({ duration: T.drawDur, delay: T.drawDelay, easing: EASE.draw, fill: "both" }));
    intro.anims = anims;
    introHide();
    introBindChart();
    delete root.dataset.intro;
    delete root.dataset.lights;
    intro.raf = requestAnimationFrame(introLoop);
  }
  function finishIntro() { if (intro.active) { introCleanup(); } }
  // For evidence and the tuner: hold the load sequence at a moment (ms from its start).
  function seekIntro(ms) {
    if (!intro.active) return false;
    intro.paused = true;
    [intro.clock, ...intro.anims].forEach((a) => { a.pause(); a.currentTime = ms; });
    applyDraw();
    return true;
  }
  const introTotal = () => Math.max(T.drawDelay + T.drawDur + T.peakGap + T.peakDur, opts.switchOn
    ? Math.max(T.nowDelay + T.rimLag + T.nowSlide, T.chartLightDelay + T.rimLag + T.chartLightRise, T.washDelay + T.rimLag + 120 + T.washDur)
    : 0);

  /* ---- live: the pulse on the line's end point (live state only; never while delayed) */
  let ping = null;
  function startPulse() {
    if (!motionOn() || STATE === "delayed" || intro.active) return;
    if (!ping) { ping = document.createElement("span"); ping.className = "ping"; ping.setAttribute("aria-hidden", "true"); plot.insertBefore(ping, tip); }
    placePing();
    ping.classList.add("is-on");
  }
  function stopPulse() { if (ping) { ping.remove(); ping = null; } }
  function placePing(pt) {
    if (!ping) return;
    const p = pt || endPoint();
    if (!p) return;
    ping.style.left = `${f(p.x)}px`;
    ping.style.top = `${f(p.y)}px`;
  }

  /* ---- live: a new reading extends the line. The centred average is cut at the latest reading, so when a reading
   * arrives the last ~15 minutes of the average legitimately change: only that tail morphs, in place, while it
   * extends to the new point. Everything earlier is untouched. */
  const liveRun = { clock: null, raf: 0, from: null, to: null, K: 0, seg: 0, body: "", oldEnd: null };
  function stepReading() {
    finishLive();
    const from = M;
    if (from.nowM >= DAY - 1) return null;
    const reading = STATE !== "delayed"; // delayed: the minute passes and no reading arrives
    const to = compute(reading ? from.last + 1 : from.last, from.nowM + 1);
    M = to;
    updateCards();
    $("#chart-summary").textContent = summary();
    if (!details.hidden) { built = false; buildDetails(); } else built = false;
    applyCrowd();
    const canMorph = reading && motionOn() && geo && !intro.active && from.segments.length === to.segments.length;
    if (!canMorph) { render(); return { reading, morph: false }; }
    // The first minute where the drawn line changes; the tail starts at the line point before it.
    const si = to.segments.length - 1, segNew = to.segments[si];
    let m0 = from.last;
    for (let m = segNew[0]; m <= from.last; m++) { if (Math.abs(from.lineAt(m) - to.lineAt(m)) > 1e-7) { m0 = m; break; } }
    let ki = 0;
    while (ki < segNew.length - 1 && segNew[ki + 1] <= m0) ki++;
    liveRun.from = from; liveRun.to = to; liveRun.seg = si; liveRun.K = segNew[ki];
    liveRun.body = to.splines[si].path(geo.X, geo.Y, ki);
    liveRun.peakMoved = from.peakM !== to.peakM;
    liveRun.clock = track(clockAnim({ duration: T.morphDur, easing: EASE.morph, fill: "both" }));
    const run = liveRun.clock;
    applyMorph();
    run.finished.then(() => { if (liveRun.clock === run) finishLive(); }).catch(() => {});
    liveRun.raf = requestAnimationFrame(liveLoop);
    return { reading, morph: true, from: from.last, to: to.last, firstChangedMinute: m0, tailFrom: liveRun.K, tailFromTime: fmtTime(liveRun.K) };
  }
  function morphValue(m, t) {
    const { from, to, K } = liveRun;
    const end = from.last + (to.last - from.last) * t;
    if (m < K) return to.lineAt(m);
    const u = end > K ? (m - K) / (end - K) : 1;
    const mo = K + u * (from.last - K), mn = K + u * (to.last - K);
    return from.lineAt(mo) + (to.lineAt(mn) - from.lineAt(mo)) * t;
  }
  function applyMorph() {
    if (!liveRun.clock || !geo) return;
    const t = liveRun.clock.effect.getComputedTiming().progress ?? 0;
    const { from, to, K, seg, body } = liveRun, { X, Y } = geo;
    const end = from.last + (to.last - from.last) * t;
    const n = Math.max(24, Math.ceil((end - K) * 4));
    let d = body;
    for (let i = 1; i <= n; i++) { const m = K + ((end - K) * i) / n; d += `L${f(X(m))},${f(Y(morphValue(m, t)))}`; }
    const path = $(`#ln-${seg}`);
    if (path) path.setAttribute("d", d);
    // The fine vertical lines of the tail follow the morphing line (same place in the paint order as the static ones:
    // under the usual line and today's line).
    const dir = RTL ? -1 : 1;
    svgHost.querySelectorAll('rect[fill="url(#hair)"]').forEach((r) => { const x = Number(r.getAttribute("x")); const m = ((x + 0.5 - X(0)) * dir / geo.span) * DAY; if (m >= K) r.remove(); });
    const above = $("#us-past") || $("#ln-0");
    if (above) above.insertAdjacentHTML("beforebegin", hairlines(K, end, (m) => morphValue(m, t)));
    // The end point rides the end of the line; "now" moves with it.
    const ex = X(end), ey = Y(morphValue(end, t));
    ["#end-halo", "#end-dot"].forEach((s) => { const c = $(s); if (c) { c.setAttribute("cx", f(ex)); c.setAttribute("cy", f(ey)); } });
    placePing({ x: ex, y: ey });
    const nowT = from.nowM + (to.nowM - from.nowM) * t;
    const pr = $("#c-past-r"), ar = $("#c-ahead-r");
    const setBand = (r, a, b) => { if (!r) return; const l = Math.min(X(a), X(b)), rr = Math.max(X(a), X(b)); r.setAttribute("x", f(l)); r.setAttribute("width", f(rr - l)); };
    setBand(pr, -8, nowT);
    setBand(ar, nowT, DAY + 8);
  }
  function liveLoop() { liveRun.raf = 0; if (!liveRun.clock) return; applyMorph(); liveRun.raf = requestAnimationFrame(liveLoop); }
  function finishLive() {
    if (!liveRun.clock) return;
    cancelAnimationFrame(liveRun.raf);
    liveRun.raf = 0;
    const moved = liveRun.peakMoved;
    liveRun.clock.cancel();
    liveRun.clock = null;
    render(); // the canonical chart for the new reading; identical to the morph's last frame
    if (moved && motionOn()) ["#pk-dot", "#pk-drop", "#peak-tag"].forEach((s) => { const n = $(s); if (n) track(n.animate([{ opacity: 0 }, { opacity: 1 }], { duration: T.peakDur, easing: EASE.reveal })); });
  }
  function seekLive(fraction) {
    if (!liveRun.clock) return false;
    cancelAnimationFrame(liveRun.raf);
    liveRun.raf = 0;
    liveRun.clock.pause();
    liveRun.clock.currentTime = T.morphDur * fraction;
    applyMorph();
    return true;
  }
  function resetReadings() {
    finishLive();
    M = compute(START.last, START.nowM);
    updateCards();
    $("#chart-summary").textContent = summary();
    built = false;
    if (!details.hidden) buildDetails();
    applyCrowd();
    render();
  }

  /* ---- rail: opens with transform and opacity only. Its width switches at once (never animated); during the
   * change the rail's own surface steps aside for three pieces: a fixed start cap, a middle that scales from the
   * inline-start, and an end cap that slides. The names fade in behind the end cap. */
  const railRun = { anims: [], surface: null, open: false };
  function animateRail(open) {
    finishRail();
    if (!motionOn()) { rail.dataset.open = String(open); return; }
    const s = document.createElement("i");
    s.className = "rail-surface";
    s.setAttribute("aria-hidden", "true");
    s.innerHTML = '<i class="rs-shadow"></i><i class="rs-start"><i></i></i><i class="rs-mid"><i></i></i><i class="rs-end"><i></i></i>';
    rail.prepend(s);
    rail.classList.add("is-morph");
    rail.dataset.open = "true";
    railRun.surface = s;
    railRun.open = open;
    const [shadow, start, mid, end] = s.children;
    const d = (RTL ? -1 : 1) * T.railDist;
    const o = open ? { duration: T.railOpen, easing: EASE.rail, fill: "both" } : { duration: T.railClose, easing: EASE.railClose, fill: "both" };
    const kf = (a, b) => (open ? [a, b] : [b, a]);
    const an = [];
    an.push(end.animate(kf({ transform: "translateX(0px)" }, { transform: `translateX(${d}px)` }), o));
    an.push(mid.animate(kf({ transform: "scaleX(0)" }, { transform: "scaleX(1)" }), o));
    an.push(shadow.animate(kf({ opacity: 0 }, { opacity: 1 }), o));
    [start, mid, end].forEach((p) => an.push(p.firstElementChild.animate(kf({ opacity: 0 }, { opacity: 1 }), o)));
    if (!open) rail.querySelectorAll(".rail-name").forEach((n) => an.push(n.animate([{ opacity: 1 }, { opacity: 0 }], { duration: T.railNamesOut, easing: "ease-out", fill: "forwards" })));
    railRun.anims = an.map(track);
    const run = railRun.anims;
    Promise.all(run.map((a) => a.finished)).then(() => { if (railRun.anims === run) finishRail(); }).catch(() => {});
  }
  function finishRail() {
    if (!railRun.surface) return;
    const anims = railRun.anims;
    railRun.anims = [];
    anims.forEach((a) => a.cancel());
    railRun.surface.remove();
    railRun.surface = null;
    rail.classList.remove("is-morph");
    rail.dataset.open = String(railRun.open);
  }

  /* ---- lights: follow the pointer (desktop only). The light behind the disc shifts a few pixels toward the
   * pointer, as if it peeks around the disc; the disc stays. It moves by a transform on the light layer (with a
   * transition), never by rewriting the gradients. The chart card does not follow by default: see README. */
  const PEEK = { now: { x: 10, y: 7 }, chart: { x: 6, y: 4 }, returnMs: 900 };
  // Not while the load entrance moves the same layer.
  const followable = (card) => motionOn() && opts.follow && mqFine.matches && !intro.active && (card.id === "card-now" || opts.followChart);
  function peekTo(card, dx, dy) {
    card.style.setProperty("--peek-x", `${f(dx)}px`);
    card.style.setProperty("--peek-y", `${f(dy)}px`);
  }
  function peekRest(card, now) {
    clearTimeout(card._peekOff);
    const off = () => { card.classList.remove("is-peek"); card.style.removeProperty("--peek-x"); card.style.removeProperty("--peek-y"); if (!card.getAttribute("style")) card.removeAttribute("style"); };
    if (now) { off(); return; }
    peekTo(card, 0, 0);
    card._peekOff = setTimeout(off, PEEK.returnMs + 60);
  }
  document.querySelectorAll(".lit").forEach((card) => {
    let raf = 0, px = 0, py = 0;
    const move = () => {
      raf = 0;
      if (!card.classList.contains("is-peek")) return;
      const r = card.getBoundingClientRect(), lim = card.id === "card-now" ? PEEK.now : PEEK.chart;
      const nx = Math.max(-1, Math.min(1, ((px - r.left) / r.width) * 2 - 1));
      const ny = Math.max(-1, Math.min(1, ((py - r.top) / r.height) * 2 - 1));
      peekTo(card, nx * lim.x, ny * lim.y);
    };
    card.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse" || !followable(card)) return;
      clearTimeout(card._peekOff);
      if (!card.classList.contains("is-peek")) { card.classList.add("is-peek"); peekTo(card, 0, 0); }
      px = e.clientX; py = e.clientY;
      if (!raf) raf = requestAnimationFrame(move);
    });
    card.addEventListener("pointerleave", () => { if (card.classList.contains("is-peek")) peekRest(card, !motionOn()); });
  });

  /* ---- lights: optional, "Inside now" dimmer when quiet and at full strength when busy (tuner toggle, off by
   * default). The number and the level chip still carry the truth. */
  const CROWD_OPACITY = [0.42, 0.7, 1, 1];
  let crowdPreview = null; // tuner preview of a level, or null for the real one
  function applyCrowd() {
    const card = $("#card-now");
    if (!opts.crowd) { delete root.dataset.crowd; card.style.removeProperty("--crowd-o"); if (!card.getAttribute("style")) card.removeAttribute("style"); return; }
    const lvl = crowdPreview ?? levelOf(occ[M.last]);
    root.dataset.crowd = "on";
    card.style.setProperty("--crowd-o", String(CROWD_OPACITY[lvl]));
  }

  /* ---- switching motion on and off at runtime (tuner) */
  function setOptions(next, persist = true) {
    const was = motionOn();
    Object.keys(MOTION_DEFAULTS).forEach((k) => { if (typeof next[k] === "boolean") opts[k] = next[k]; });
    if (persist && !TUNER_OFF) { try { localStorage.setItem(MOTION_STORE, JSON.stringify(opts)); } catch (e) { /* storage unavailable */ } }
    const on = motionOn();
    root.dataset.motion = on ? "on" : "off";
    if (was && !on) {
      finishIntro(); finishLive(); finishRail(); stopPulse();
      played.slice().forEach((a) => { try { a.finish(); } catch (e) { a.cancel(); } });
      document.querySelectorAll(".lit").forEach((c) => peekRest(c, true));
    }
    if (on && !was && !intro.active) startPulse();
    if (!opts.follow || !opts.followChart) document.querySelectorAll(".lit").forEach((c) => { if (!followable(c)) peekRest(c, true); });
    applyCrowd();
  }
  mqReduce.addEventListener("change", () => setOptions({}, false));

  function afterRender() {
    if (intro.active) { introHide(); introBindChart(); }
    placePing();
  }

  /* ------------------------------------------------------------ lifecycle */
  new ResizeObserver(() => render()).observe(plot);
  render();
  window.__eclipse = {
    ready: false,
    lang: LANG,
    state: STATE,
    get figures() {
      const { last, nowM, peak, peakM, entries, observed, busiest, compare, avg, usualLatest, usualEntries, crestM } = M;
      return { now: occ[last], last, nowM, peak, peakM, entries, observed, busiest, compare, avgNow: Math.round(avg[last] * 10) / 10, usualLatest: usualLatest == null ? null : Math.round(usualLatest * 10) / 10, usualEntries, crestM };
    },
    get checks() { return M.checks; },
    minuteClient(m) {
      const pr = plot.getBoundingClientRect();
      const k = kindAt(m);
      const y = k === "read" || k === "zero" ? geo.Y(occ[m]) : (geo.yt + geo.yb) / 2;
      return { x: pr.left + geo.X(m), y: pr.top + y };
    },
    motion: {
      get on() { return motionOn(); },
      get options() { return { ...opts }; },
      defaults: { ...MOTION_DEFAULTS },
      get urlOff() { return URL_OFF; },
      get systemReduced() { return mqReduce.matches; },
      get introActive() { return intro.active; },
      get introStarted() { return intro.started; },
      get liveActive() { return Boolean(liveRun.clock); },
      get latest() { return fmtTime(M.last); },
      get atStart() { return M.last === START.last && M.nowM === START.nowM; },
      introTotal,
      timings: T,
      easings: EASE,
      // Every motion, as built above (for the capture log and the README).
      spec: () => [
        { motion: "Load: stat cards enter", animates: "opacity 0 to 1, transform translateY(14px) to none", delayMs: [0, 1, 2, 3].map((i) => i * T.cardStagger), durationMs: T.cardDur, easing: EASE.enter, note: "reading order (Inside now first)" },
        { motion: "Load: chart card enters", animates: "opacity 0 to 1, transform translateY(18px) to none", delayMs: T.chartDelay, durationMs: T.chartDur, easing: EASE.enter },
        { motion: "Load: the line draws from opening to now", animates: "SVG stroke-dasharray (drawn length) of today's line; fine vertical lines opacity behind the head (36px soft edge)", delayMs: T.drawDelay, durationMs: T.drawDur, easing: EASE.draw },
        { motion: "Load: end point appears (when the line reaches now)", animates: "opacity 0 to 1, scale 0.4 to 1", delayMs: T.drawDelay + T.drawDur, durationMs: T.endDotDur, easing: EASE.reveal },
        { motion: "Load: peak marker appears (after the line)", animates: "opacity 0 to 1; ring scale 0.5 to 1; label translate 0 5px to 0", delayMs: T.drawDelay + T.drawDur + T.peakGap, durationMs: T.peakDur, easing: EASE.reveal },
        ...(() => {
          const e = intro.nowPath || nowPath();
          const drop = intro.chartDrop || Math.round($(".chart .lamp-in").clientHeight * T.chartLightDrop);
          const tg = "lights entrance: the tuner's \"switch on at load\", on by default";
          const curve = (c) => `opacity along the movement's own progress (same timing and easing): ${[...c, [1, 1]].map(([p, v]) => `${Math.round(p * 100)}%: ${v}`).join(", ")} of the rest value`;
          return [
            { motion: "Load: Inside now light slides in behind the fixed disc, out of the lit corner", animates: `transform translate(${e.dx}px, ${e.dy}px) to translate(0px, 0px) on the light layer and its grain (.lamp-in ::before and ::after, overscan --lp ${e.lp}px); the disc (the mask on .lamp-in) stays; no opacity change${T.nowOpacity ? ` (${curve(T.nowOpacity)})` : ""}`, delayMs: T.nowDelay, durationMs: T.nowSlide, easing: EASE.slide, note: `${tg}; the light starts ${Math.round(T.nowFrom * 100)}% of the corner-to-disc-centre distance beyond the lit corner, on that axis (computed from the light settings)` },
            { motion: "Load: Inside now lit border catches the light", animates: `${curve(T.rimOpacity)}, on .lamp-rim`, delayMs: T.nowDelay + T.rimLag, durationMs: T.nowSlide, easing: EASE.slide },
            { motion: "Load: chart light rises from under the bottom edge with the line", animates: `transform translate(0px, ${drop}px) to translate(0px, 0px) on the light layer and its grain (${Math.round(T.chartLightDrop * 100)}% of the card height); the disc stays`, delayMs: T.chartLightDelay, durationMs: T.chartLightRise, easing: EASE.rise, note: "starts with the line (same delay) and settles just after it reaches now" },
            { motion: "Load: chart light brightens as it rises", animates: `${curve(T.chartOpacity)}, on .lamp-in`, delayMs: T.chartLightDelay, durationMs: T.chartLightRise, easing: EASE.rise },
            { motion: "Load: chart lit border catches the light", animates: `${curve(T.rimOpacity)}, on .lamp-rim`, delayMs: T.chartLightDelay + T.rimLag, durationMs: T.chartLightRise, easing: EASE.rise },
            { motion: "Load: page wash drifts in from its corner", animates: `transform translate(${RTL ? T.washDrift[0] : -T.washDrift[0]}px, ${-T.washDrift[1]}px) to translate(0px, 0px) on .wash-light; ${curve(T.washOpacity)}, on .wash`, delayMs: T.washDelay, durationMs: T.washDur, easing: EASE.slide },
            { motion: "Load: the rail's rim catches the wash", animates: `${curve(T.rimOpacity)}, on .rail::after`, delayMs: T.washDelay + T.rimLag + 120, durationMs: T.washDur, easing: EASE.slide },
          ];
        })(),
        { motion: "Live: end-point pulse (live state only; none while delayed)", animates: "a ring: opacity 0.7 to 0, transform scale 0.28 to 1 (9px to 32px)", delayMs: 400, durationMs: 3600, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)", note: "infinite, the ring is visible for the first 62% of each 3.6s cycle; HTML layer, composited" },
        { motion: "Live: new reading, tail morph and extension", animates: "SVG path d of the last ~15-30 minutes only (from the last line point before the first changed minute), end point cx/cy, the tail's fine lines, the now clip", delayMs: 0, durationMs: T.morphDur, easing: EASE.morph },
        { motion: "Numbers: cross-fade", animates: "new value opacity 0 to 1; old value (a copy) opacity 1 to 0", delayMs: 0, durationMs: [T.swapIn, T.swapOut], easing: [EASE.swap, "ease-out"] },
        { motion: "Tooltip and guide follow (pointer and keyboard)", animates: "transform translate from the previous position to none", delayMs: 0, durationMs: [T.glideMin, T.glideMax], easing: EASE.glide, note: "140ms plus 0.12ms per px moved, at most 320ms; the tooltip fades in 120ms and out 90ms" },
        { motion: "Rail opens", animates: "end cap transform translateX(0 to 156px, inline-end), middle transform scaleX(0 to 1) from the inline-start, surface opacity 0.7 to 0.94 (a layer's opacity), shadow layer opacity 0 to 1; names opacity + translateX(6px) with 80ms delay, 240ms", delayMs: 0, durationMs: T.railOpen, easing: EASE.rail, note: "width switches at once and is never animated" },
        { motion: "Rail closes", animates: "the same in reverse; names opacity 1 to 0 in 110ms", delayMs: 0, durationMs: T.railClose, easing: EASE.railClose },
        { motion: "Lights follow the pointer (desktop, fine pointer only; Inside now; chart card off by default)", animates: "transform translate on the light and grain layers (overscan --lp 24px), at most 10px x 7px (chart 6px x 4px); nothing is promoted to its own layer at rest, so a pointer at the card centre (offset 0) leaves the light where it is", delayMs: 0, durationMs: 900, easing: "cubic-bezier(0.22, 1, 0.36, 1)", note: "CSS transition, restarted per frame while the pointer moves; returns to rest in 900ms on leave" },
        { motion: "Light follows crowd (toggle, off by default)", animates: "opacity of the Inside now light: Quiet 0.42, Moderate 0.7, Busy 1, Packed 1", delayMs: 0, durationMs: 1200, easing: "cubic-bezier(0.45, 0, 0.25, 1)" },
      ],
      settle: () => { finishLive(); finishRail(); if (intro.active) { introCleanup(); startPulse(); } },
      set: (o) => setOptions(o),
      replay: () => { resetPeeks(); render(); startIntro(); },
      seek: seekIntro,
      step: stepReading,
      seekLive,
      reset: resetReadings,
      previewCrowd: (lvl) => { crowdPreview = lvl == null ? null : Math.max(0, Math.min(3, lvl)); applyCrowd(); },
    },
  };
  function resetPeeks() { document.querySelectorAll(".lit").forEach((c) => peekRest(c, true)); }
  applyCrowd();
  // The load sequence starts once the fonts are in (or after 1.2s at most, if they are slow), so it plays on the
  // final text. Without motion nothing waits. The other script's subset of Readex Pro is fetched up front too (the
  // rail's language item is written in it), so opening the rail never swaps a font mid-way; this changes no pixel.
  if (document.fonts && document.fonts.load) ["400", "500"].forEach((w) => document.fonts.load(`${w} 16px "Readex Pro"`, RTL ? "English FITWAY" : "العربية").catch(() => {}));
  let begun = false;
  const begin = () => {
    if (begun) return;
    begun = true;
    if (motionOn()) startIntro();
  };
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { render(); window.__eclipse.ready = true; begin(); });
  setTimeout(begin, 1200);
})();
