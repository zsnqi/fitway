/* Eclipse: FITWAY Owner Daily concept. Synthetic data only; not production.
 * Query: lang=ar|en (default ar), state=live|delayed|nohistory (default live), motion=off (every change instant).
 * The data logic (seeded minute simulation, day constants, monotone interpolation) is reused from
 * ../light-study/app.js, which took it from ../backlight/app.js. Western digits only: numbers are printed with
 * String(), never Intl or toLocaleString.
 * Motion (Round 6) lives in the "motion" section at the end. The page is complete at first paint; something moves
 * only when the data changes or the owner acts. The one exception is the first-open intro (Round 7 step 3): on the
 * first open in a browser tab the numbers roll into place and the line draws once, then the page is exactly its still
 * self. With prefers-reduced-motion or ?motion=off every change is instant, there is no intro, and the page at rest is
 * the same either way. */
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
      keys: "استخدم مفتاحي السهمين للتنقل بين نقاط كل نصف ساعة، ومنها الذروة وآخر قراءة. Home لوقت الفتح، وEnd لآخر قراءة.",
      avgInside: (v) => `${v} داخل الصالة في المتوسط`,
      crowdIs: (l) => `الازدحام ${l}`,
      say: (v, l, e) => `داخل الصالة الآن ${v} تقريبًا، ${l}. مرات الدخول ${e}.`,
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
      keys: "Use the arrow keys to move between the half-hour points, including the peak and the latest reading. Home goes to opening time and End to the latest reading.",
      avgInside: (v) => `${v} inside on average`,
      crowdIs: (l) => l,
      say: (v, l, e) => `Inside now about ${v}, ${l}. Entries ${e}.`,
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
   * Motion is on unless the system asks for reduced motion, the URL says ?motion=off, or the tuner's stored
   * choice turned it off (stored choices are ignored with ?tuner=0). Nothing waits for it: the page is complete at
   * first paint either way. */
  const params = new URLSearchParams(location.search);
  const URL_OFF = params.get("motion") === "off";
  const TUNER_OFF = params.get("tuner") === "0";
  // The tuner's Motion group keeps three values in this key: the Motion switch; the hover speed (Round 7 step 2), a
  // multiplier on the chart marker's follow (1 is the reference clip's feel; 2 settles twice as fast); and the intro
  // speed (Round 7 step 3), a multiplier on the first-open intro (1 is the designed length; 2 plays it twice as fast).
  const MOTION_STORE = "fitway.eclipse.v3.motion";
  const MOTION_DEFAULTS = { motion: true, hoverSpeed: 1, introSpeed: 1 };
  const HOVER_SPEED = { min: 0.5, max: 2 };
  const clampSpeed = (v) => Math.min(HOVER_SPEED.max, Math.max(HOVER_SPEED.min, v));
  const INTRO_SPEED = { min: 0.5, max: 2 };
  const clampIntroSpeed = (v) => Math.min(INTRO_SPEED.max, Math.max(INTRO_SPEED.min, v));
  const mqReduce = matchMedia("(prefers-reduced-motion: reduce)");
  let opts = (() => {
    const o = { ...MOTION_DEFAULTS };
    if (TUNER_OFF) return o;
    try {
      const raw = JSON.parse(localStorage.getItem(MOTION_STORE));
      if (raw && typeof raw.motion === "boolean") o.motion = raw.motion;
      if (raw && Number.isFinite(raw.hoverSpeed)) o.hoverSpeed = clampSpeed(raw.hoverSpeed);
      if (raw && Number.isFinite(raw.introSpeed)) o.introSpeed = clampIntroSpeed(raw.introSpeed);
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
    endIntro("rail"); // the intro yields to the owner: it settles at once (motion section)
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
  // The tuner can simulate a crowd-level change on the Inside now card (a value across the nearest level boundary);
  // null means the card shows the latest reading. A new reading or "Reset readings" clears it.
  let crowdShown = null;
  const shownNow = () => (crowdShown == null ? occ[M.last] : crowdShown);
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

  // After a live change only the values that changed move: digits roll, level bars fill or empty, and words swap
  // at once (motion section). Everything ends on exactly the markup the page renders at load.
  function updateCards(prev) {
    const dt = Math.sign(M.last - prev.last);
    rollTo($("#status bdi"), fmtTime(M.last), dt);
    rollTo($("#now-v"), String(shownNow()));
    if (STATE === "delayed") rollTo($("#now-meta span"), L.ago(M.nowM - M.last));
    else rollTo($("#now-meta bdi"), fmtTime(M.last), dt);
    setFoot($("#now-foot"), shownNow(), cmpChip(M.compare));
    rollTo($("#peak-meta bdi"), fmtTime(M.peakM), Math.sign(M.peakM - prev.peakM));
    rollTo($("#peak-v"), String(M.peak));
    setFoot($("#peak-foot"), M.peak, "");
    rollTo($("#entries-v"), String(M.entries));
    if (HAS_HISTORY) rollTo($("#entries-usual bdi"), String(M.usualEntries));
    rollTo($("#busy-v"), hourRange(M.busiest.from, M.busiest.to));
    rollTo($("#busy-note bdi"), String(M.busiest.avg));
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
    peakTagBox = null;
    buildStops();
    restoreSelection(); // the selection, if any, redrawn at rest on the new chart (no follow)
    placePing();
    introAfterRender(W, H); // the first-open intro, if it is waiting or playing, on the new chart (motion section)
  }

  /* ------------------------------------------------------ chart inspection
   * Round 6: the reading snaps to stops. A stop every half hour from opening (6:00 AM) to closing (1:00 AM), aligned
   * with the drawn line, plus two of their own: the true peak and the latest reading. A half-hour stop within FOLD
   * minutes of either is folded into it (the peak at 6:29 PM takes the 6:30 PM stop). The missing span has one stop
   * of its own, "no reading", and no normal stop. Values are the line's own (the centred average it draws, never a
   * raw minute), except at the peak, whose marker is the true reading. After now a stop shows "still ahead" and the
   * usual value. Minute detail stays in View details. */
  const FOLD = 10;    // minutes
  const MAGNET = 10;  // px: the pointer takes the peak or the latest reading when this close to it
  let stops = [];
  let sel = null;     // the selected stop, or null
  function buildStops() {
    const { last, nowM, peakM, segments, lineAt } = M;
    const { X } = geo;
    const segOf = (m) => segments.findIndex((sg) => m >= sg[0] && m <= sg[sg.length - 1]);
    const specials = peakM >= 0 ? [peakM, last] : [last];
    const out = [];
    for (let m = 0; m <= DAY; m += 30) {
      if (m <= last && m >= GAP0 && m <= GAP1) continue;                 // inside the missing span
      if (specials.some((sp) => Math.abs(sp - m) < FOLD)) continue;      // folded into the peak or the latest reading
      if (m <= last) {
        const sg = segOf(m);
        if (sg < 0) continue;
        out.push({ key: `h${m}`, kind: m <= ZERO_END ? "zero" : "read", m, x: X(m), value: m <= ZERO_END ? 0 : Math.round(lineAt(m)), track: `L${sg}`, lift: 0 });
      } else {
        // After the latest reading: no reading yet (delayed, before now) or still ahead. The only value is the usual one.
        out.push({ key: `h${m}`, kind: m <= nowM ? "wait" : "ahead", m, x: X(Math.min(m, DAY - 1)), value: HAS_HISTORY ? usualAt(m) : null, track: HAS_HISTORY ? "U" : null, lift: 0 });
      }
    }
    if (last > GAP1) {
      // Centred on the dotted mark as render() draws it (dots every 4px from 2.5px inside the span), so the brackets
      // frame what the eye sees.
      const gl = Math.min(X(GAP0 - 0.5), X(GAP1 + 0.5)), gr = Math.max(X(GAP0 - 0.5), X(GAP1 + 0.5));
      const first = gl + 2.5, lastDot = first + 4 * Math.floor((gr - 1.5 - first) / 4);
      out.push({ key: "gap", kind: "gap", m: (GAP0 + GAP1) / 2, x: (first + lastDot) / 2, w: lastDot - first + 2, value: null, track: null, lift: 0 });
    }
    if (peakM >= 0) out.push({ key: "peak", kind: "peak", m: peakM, x: X(peakM), value: M.peak, track: `L${segOf(peakM)}`, lift: 1 });
    // Round 7 decision 1: the latest stop shows the latest reading itself, the same number as the Inside now card
    // (live 49, Busy at 7:42 PM; while delayed, the stale reading the delayed card shows), not the line's value there.
    // The marker still sits on the line's end point.
    out.push({ key: "latest", kind: "latest", m: last, x: X(last), value: occ[last], track: `L${segOf(last)}`, lift: 0 });
    out.sort((a, b) => a.m - b.m || (a.kind === "peak" ? -1 : b.kind === "peak" ? 1 : 0));
    out.forEach((st, i) => { st.i = i; });
    stops = out;
    measureTipWidth();
  }
  const stopBy = (key) => stops.find((st) => st.key === key) || null;

  const sepc = RTL ? "، " : ", ";
  function valueText(st) {
    const t = fmtTime(Math.round(st.m));
    const u = HAS_HISTORY ? `${sepc}${L.ro.usual} ${usualAt(st.m)}` : "";
    const lvl = (v) => L.crowdIs(L.levels[levelOf(v)]);
    switch (st.kind) {
      case "gap": return `${plainRange(fmtTime(GAP0), fmtTime(GAP1))}${sepc}${L.ro.noReading}`;
      case "wait": return `${t}${sepc}${L.ro.noReadingYet}${u}`;
      case "ahead": return `${t}${sepc}${L.ro.ahead}${u}`;
      case "zero": return `${t}${sepc}0${sepc}${L.ro.empty}`;
      case "peak": return `${t}${sepc}${L.ro.peak} ${st.value}${sepc}${lvl(st.value)}${u}`;
      // The latest reading itself, never called an average; while delayed, how old it is.
      case "latest": return `${t}${sepc}${L.ro.latest}${STATE === "delayed" ? ` ${L.ago(M.nowM - M.last)}` : ""}${sepc}${st.value} ${L.ro.inside}${sepc}${lvl(st.value)}${u}`;
      default: return `${t}${sepc}${L.avgInside(st.value)}${sepc}${lvl(st.value)}${u}`;
    }
  }
  function tipHTML(st) {
    if (st.kind === "gap") return `<div class="tip-t">${timeRange(GAP0, GAP1)}</div><div class="tip-main"><span class="tip-word">${L.ro.noReading}</span></div>`;
    const usualRow = HAS_HISTORY && st.kind !== "zero" ? `<div class="tip-u"><span class="sw sw-usual" aria-hidden="true"></span><span>${L.ro.usual} ${bdi(usualAt(st.m))}</span></div>` : "";
    const flag = st.kind === "peak" ? L.ro.peak : st.kind === "latest" ? L.ro.latest : "";
    // One start-aligned arrangement for every tooltip: at the peak and the latest the label chip comes first, then
    // the time; the number then its word, as at every other stop, so the number never moves between ends.
    let html = `<div class="tip-t">${flag ? `<span class="tip-flag">${flag}</span>` : ""}${tb(st.m)}</div>`;
    if (st.kind === "zero") html += `<div class="tip-main"><span class="tip-v">${bdi(0)}</span><span class="tip-l">${L.ro.empty}</span></div>`;
    else if (st.kind === "wait") html += `<div class="tip-main"><span class="tip-word">${L.ro.noReadingYet}</span></div>${usualRow}`;
    else if (st.kind === "ahead") html += `<div class="tip-main"><span class="tip-word">${L.ro.ahead}</span></div>${usualRow}`;
    else if (st.kind === "latest" && STATE === "delayed") {
      // The stale reading, treated as the delayed card treats it: a muted number and how old it is, in the delayed colour.
      html += `<div class="tip-main is-stale"><span class="tip-v">${bdi(st.value)}</span><span class="tip-l">${L.levels[levelOf(st.value)]}</span></div>` +
        `<div class="tip-ago">${ICON.clock}<span>${L.ago(M.nowM - M.last)}</span></div>${usualRow}`;
    }
    else html += `<div class="tip-main"><span class="tip-v">${bdi(st.value)}</span><span class="tip-l">${L.levels[levelOf(st.value)]}</span></div>${usualRow}`;
    return html;
  }

  /* ---- the tooltip's width (the user's decision, 2026-09-27): the widest tooltip that shows a number among the
   * chart's current stops, plus 2px, rounded up to a whole pixel (--tip-w on #tip). A tooltip shows a number when it
   * has a value or the usual row: every stop but the missing span, and, without history, still ahead and no reading
   * yet. So within one snapshot every numbered tooltip has one width and its number starts at one place against the
   * hairline; the width changes only when the stops or their text change (the first render, a new reading, a state
   * change, a resize, a language switch, which reloads the page), at the moment the content changes anyway, or when a
   * web font finishes loading, which replaces a fallback-font measurement. It is measured on hidden copies in one
   * size-contained, aria-hidden, visibility-hidden box (out of the accessibility tree), never on the live tooltip, so
   * nothing on screen moves. The missing-span stop alone may be wider (min-width: max-content). At the page's own
   * 7:42 PM snapshot it is 127px in AR and EN, live, delayed and no history (the widest: the Arabic latest reading,
   * 124.84px in Readex Pro). */
  const tipMeasure = document.createElement("div");
  tipMeasure.className = "tip-measure";
  tipMeasure.setAttribute("aria-hidden", "true");
  plot.appendChild(tipMeasure);
  let tipWKey = null, tipW = null, fontGen = 0;
  const tipMeasured = { widthPx: null, widestPx: null, widestKey: null, numbered: 0, measures: 0, ms: 0 };
  function measureTipWidth() {
    const numbered = stops.filter((st) => st.kind !== "gap" && (HAS_HISTORY || (st.kind !== "wait" && st.kind !== "ahead")));
    const parts = numbered.map((st) => `<div class="tip">${tipHTML(st)}</div>`);
    const key = `${fontGen}|${parts.join("")}`;
    if (key === tipWKey) return;
    tipWKey = key;
    const t0 = performance.now();
    tipMeasure.innerHTML = parts.join("");
    let widest = 0, at = -1;
    [...tipMeasure.children].forEach((c, i) => { const w = c.getBoundingClientRect().width; if (w > widest) { widest = w; at = i; } });
    tipMeasure.textContent = "";
    const w = Math.ceil(widest + 2);
    Object.assign(tipMeasured, { widthPx: w, widestPx: widest, widestKey: at >= 0 ? numbered[at].key : null, numbered: numbered.length, measures: tipMeasured.measures + 1, ms: performance.now() - t0 });
    if (w === tipW) return;
    tipW = w;
    tip.style.setProperty("--tip-w", `${w}px`);
    tipSize = null; // placeTip reads the box's real width again
  }
  // A web font that finishes loading replaces a measurement made with the fallback font; a shown tooltip is placed
  // again, at rest, by its new width.
  if (document.fonts && document.fonts.addEventListener) {
    document.fonts.addEventListener("loadingdone", () => {
      if (!geo) return;
      fontGen++;
      const before = tipW;
      measureTipWidth();
      if (tipW !== before && sel && !tip.hidden) restoreSelection();
    });
  }

  /* ---- track geometry: the marker sits on the SVG paths as drawn, never on a separate formula. Round 7 step 2 (F5):
   * each path's table is read from its own `d` (the M, C and L commands this page writes, in absolute coordinates) and
   * evaluated as the same cubic Béziers the browser draws, so building it costs well under a millisecond, and a
   * point for a given time is solved exactly on the drawn curve. Before, the table was sampled with getPointAtLength,
   * which blocked the main thread for about 180 ms the first time the usual line was needed. */
  const tables = new WeakMap();
  const trackPath = (track) => (track === "U" ? $("#us-ahead") : track ? $(`#ln-${track.slice(1)}`) : null);
  function parsePath(d) {
    const segs = [];
    let cx = 0, cy = 0;
    for (const [, cmd, body] of d.matchAll(/([MCL])([^MCL]*)/g)) {
      const n = body.trim().split(/[\s,]+/).filter(Boolean).map(Number);
      if (cmd === "M") { cx = n[0]; cy = n[1]; continue; }
      const k = cmd === "C" ? 6 : 2;
      for (let i = 0; i + k <= n.length; i += k) {
        const s = cmd === "C"
          ? [cx, cy, n[i], n[i + 1], n[i + 2], n[i + 3], n[i + 4], n[i + 5]]
          : [cx, cy, cx, cy, n[i], n[i + 1], n[i], n[i + 1]]; // a line: evaluated linearly below
        s.line = cmd === "L";
        segs.push(s);
        cx = n[i + k - 2]; cy = n[i + k - 1];
      }
    }
    return segs;
  }
  // The point at parameter u = segment index + t on the drawn geometry.
  function evalAt(segs, u) {
    const i = Math.min(segs.length - 1, Math.max(0, Math.floor(u))), t = Math.min(1, Math.max(0, u - i)), s = segs[i];
    if (s.line) return { x: s[0] + (s[6] - s[0]) * t, y: s[1] + (s[7] - s[1]) * t };
    const a = (1 - t) * (1 - t) * (1 - t), b = 3 * (1 - t) * (1 - t) * t, c = 3 * (1 - t) * t * t, e = t * t * t;
    return { x: a * s[0] + b * s[2] + c * s[4] + e * s[6], y: a * s[1] + b * s[3] + c * s[5] + e * s[7] };
  }
  function table(path) {
    let t = tables.get(path);
    if (t && t.d === path.getAttribute("d")) return t;
    const d = path.getAttribute("d"), segs = parsePath(d);
    const us = [], xs = [], ys = [], ls = [];
    let l = 0, px = null, py = null;
    segs.forEach((s, i) => {
      const k = Math.max(4, Math.ceil(Math.hypot(s[6] - s[0], s[7] - s[1]) * 1.5)); // about every 0.7 px
      for (let j = i === 0 ? 0 : 1; j <= k; j++) {
        const u = i + j / k, p = evalAt(segs, u);
        if (px != null) l += Math.hypot(p.x - px, p.y - py);
        us.push(u); xs.push(p.x); ys.push(p.y); ls.push(l);
        px = p.x; py = p.y;
      }
    });
    const n = us.length - 1;
    t = { path, d, segs, us, xs, ys, ls, n, total: l, dir: xs[n] >= xs[0] ? 1 : -1 };
    tables.set(path, t);
    return t;
  }
  // The parameter where the path reaches x, solved on the curve itself (x runs one way along the path: the curve is a
  // function of time), and its arc length.
  function uAtX(t, x) {
    const { xs, us, n, dir } = t;
    if ((x - xs[0]) * dir <= 0) return 0;
    if ((x - xs[n]) * dir >= 0) return us[n];
    let lo = 0, hi = n;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if ((xs[mid] - x) * dir < 0) lo = mid; else hi = mid; }
    let a = us[lo], b = us[hi];
    for (let i = 0; i < 48; i++) { const mid = (a + b) / 2; if ((evalAt(t.segs, mid).x - x) * dir < 0) a = mid; else b = mid; }
    return (a + b) / 2;
  }
  function lengthOfU(t, u) {
    const { us, ls, n } = t;
    if (u <= us[0]) return 0;
    if (u >= us[n]) return t.total;
    let lo = 0, hi = n;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (us[mid] < u) lo = mid; else hi = mid; }
    return ls[lo] + (ls[hi] - ls[lo]) * ((u - us[lo]) / (us[hi] - us[lo] || 1));
  }
  function uOfLength(t, l) {
    const { us, ls, n } = t;
    if (l <= 0) return 0;
    if (l >= t.total) return us[n];
    let lo = 0, hi = n;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (ls[mid] < l) lo = mid; else hi = mid; }
    return us[lo] + (us[hi] - us[lo]) * ((l - ls[lo]) / (ls[hi] - ls[lo] || 1));
  }
  const peakPoint = () => { const d = $("#pk-dot"); return d ? { x: Number(d.getAttribute("cx")), y: Number(d.getAttribute("cy")) } : null; };
  // Where the marker rests for a stop: { x, y, lift, ly (the line under it), track, l (arc length on the track) }, or
  // null when there is nothing to sit on (still ahead without history).
  function restPoint(st) {
    if (!st || !geo) return null;
    if (st.kind === "gap") return { x: st.x, y: Math.round(geo.Y(0)) + 0.5, lift: 0, track: null };
    const path = trackPath(st.track);
    if (!path) return null;
    const t = table(path);
    if (st.kind === "peak") {
      const pk = peakPoint(), u = uAtX(t, pk.x), base = evalAt(t.segs, u);
      return { x: pk.x, y: pk.y, lift: 1, ly: base.y, track: st.track, l: lengthOfU(t, u) };
    }
    const u = uAtX(t, st.x), p = evalAt(t.segs, u);
    return { x: p.x, y: p.y, lift: 0, ly: p.y, track: st.track, l: lengthOfU(t, u) };
  }

  /* ---- the marker (Round 7): form B, the hollow ring, chosen by the user after step 1. Nothing above the point (no
   * guide, no level ticks); below it, that moment's own thin hairline runs down to the time axis.
   *   On the line: a ring with a dark centre (the card's own colour) and a FITWAY-red edge with a soft red glow, so
   *     the line passes behind it and stops at its edge.
   *   Peak: the ring takes the peak ring's place (it covers it); no dot inside.
   *   Latest, live: the end point's thin halo steps aside while the ring sits on it (a ring inside a second ring would
   *     read as a target). Delayed: the latest reading is stale, so the ring takes the end point's neutral grey and
   *     has no glow.
   *   After now: a hollow chalk ring on the usual line, never red, with no glow; a dashed chalk hairline below.
   *     Without history there is no usual line and no marker, only a short tick on the time axis.
   *   Missing span: never a point (data-marker="gap"). The dotted mark on the axis lights up in chalk, with a faint
   *     chalk light (the lit bead's variant, kept by the user when form A was removed).
   * While the marker follows, only its position changes: the same elements are moved, not rebuilt. */
  const RED = "#ff2946", CHALK = "#f5f3f2", CARD = "#0f0e0f", STALE = "#8f898b";
  const MK = { r: 6.5, edge: 1.5, lit: 10, aheadR: 6.5 };
  let painted = null; // what #sel holds: { key } when its elements can be moved in place
  // Is the marker on the line's end point? Measured against the end point as drawn (a live update moves it).
  function onEndPoint(pt) {
    const e = $("#end-dot");
    return Boolean(e) && Math.hypot(pt.x - Number(e.getAttribute("cx")), pt.y - Number(e.getAttribute("cy"))) < 1.5;
  }
  // The stationary marks that the ring replaces (the chalk peak ring and the end point's thin halo) step aside, at once
  // and with no fade, on the first frame at which the ring's outer edge would touch or overlap the mark's outer extent
  // (centre distance < the ring's outer radius + the mark's), and come back on the first frame it is beyond that, or
  // when the selection clears. Symmetric, and the same whether the ring follows, steps by keys or rides a live update:
  // a ring overlapping a second ring off-centre, or sitting inside a halo, would read as two rings or a target.
  // One case is left as drawn: a mark lying wholly under the ring's opaque centre (the peak ring with the ring on it,
  // within 0.15 px) is already replaced and cannot show, and leaving it keeps the rest frames exactly as before.
  const REPLACED = ["#pk-dot", "#end-halo"];
  function stepAside(pt) {
    const R = MK.r + MK.edge / 2, inner = MK.r - MK.edge / 2;
    REPLACED.forEach((id) => {
      const el = $(id);
      if (!el) return;
      const outer = Number(el.getAttribute("r")) + Number(el.getAttribute("stroke-width") || 0) / 2;
      const d = pt ? Math.hypot(pt.x - Number(el.getAttribute("cx")), pt.y - Number(el.getAttribute("cy"))) : Infinity;
      const near = d < R + outer && d + outer > inner;
      if (near) el.setAttribute("visibility", "hidden"); else el.removeAttribute("visibility");
    });
  }
  function paintMarker(pt, st, rebuild = false) {
    const g = $("#sel");
    if (!g || !geo || !st) return;
    follow.at = pt;
    const { yb } = geo;
    const axis = Math.round(geo.Y(0)) + 0.5;
    const form = st.kind === "gap" ? "gap" : !pt ? "none" : pt.track === "U" ? "usual" : "line";
    const x = pt ? pt.x : st.x, gx = Math.round(x) + 0.5;
    const lift = pt ? pt.lift || 0 : 0;
    const onEnd = form === "line" && lift === 0 && onEndPoint(pt);
    stepAside(form === "line" || form === "usual" ? pt : null);
    const stale = onEnd && STATE === "delayed";
    let ay, key, html = null;
    if (form === "line") {
      const ly = pt.ly == null ? pt.y : pt.ly, top = ly + MK.lit, lit = yb - top > 1;
      const dataForm = lift >= 1 ? "peak" : lift > 0 ? "drop" : "line";
      key = `line|${stale}|${lit}`;
      const at = `translate(${f(pt.x)} ${f(pt.y)})`;
      if (!rebuild && painted && painted.key === key && g.firstChild) {
        const r = g.querySelector(".sg-lit"), m = g.querySelector(".sg-mark");
        if (r) { r.setAttribute("x", String(gx - 0.5)); r.setAttribute("y", f(top)); r.setAttribute("height", f(yb - top)); }
        m.setAttribute("transform", at);
        m.dataset.form = dataForm;
      } else {
        const hot = stale ? STALE : RED, color = stale ? "#c9c3c4" : RED, a0 = stale ? 0.5 : 0.78;
        const hair = lit ? `<linearGradient id="sel-lit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity="${a0}"/><stop offset="1" stop-color="${color}" stop-opacity="0.1"/></linearGradient><rect class="sg-lit" x="${gx - 0.5}" y="${f(top)}" width="1" height="${f(yb - top)}" fill="url(#sel-lit)"/>` : "";
        const glow = stale ? "" : `<circle r="${MK.r}" fill="none" stroke="${RED}" stroke-width="3.5" opacity="0.55" filter="url(#sel-soft)"/>`;
        html = hair + `<filter id="sel-soft" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="2.4"/></filter>` +
          `<g class="sg-mark" data-form="${dataForm}" data-marker="b" transform="${at}">${glow}<circle class="sg-core" r="${MK.r}" fill="${CARD}" stroke="${hot}" stroke-width="${MK.edge}"/></g>`;
      }
      ay = pt.y;
    } else if (form === "usual") {
      key = "usual";
      const d = `M${gx},${f(pt.y + MK.aheadR + 3)}V${yb}`, at = `translate(${f(pt.x)} ${f(pt.y)})`;
      if (!rebuild && painted && painted.key === key && g.firstChild) {
        g.querySelector(".sg-drop").setAttribute("d", d);
        g.querySelector(".sg-mark").setAttribute("transform", at);
      } else {
        html = `<path class="sg-drop" d="${d}" fill="none" stroke="rgba(245,243,242,0.3)" stroke-width="1" stroke-dasharray="2 3"/>` +
          `<g class="sg-mark" data-form="usual" data-marker="b" transform="${at}"><circle class="sg-core" r="${MK.aheadR}" fill="${CARD}" stroke="rgba(245,243,242,0.85)" stroke-width="1.25"/></g>`;
      }
      ay = pt.y;
    } else if (form === "gap") {
      key = "gap";
      // The dotted mark as render() draws it: dots every 4px from 2.5px inside the span, lit in chalk.
      const gl = Math.min(geo.X(GAP0 - 0.5), geo.X(GAP1 + 0.5)), gr = Math.max(geo.X(GAP0 - 0.5), geo.X(GAP1 + 0.5));
      const dots = [];
      for (let dx = gl + 2.5; dx <= gr - 1.5; dx += 4) dots.push(dx - st.x);
      const h = st.w / 2;
      html = `<radialGradient id="sel-chalk"><stop offset="0" stop-color="${CHALK}" stop-opacity="0.2"/><stop offset="1" stop-color="${CHALK}" stop-opacity="0"/></radialGradient>` +
        `<g class="sg-mark" data-form="gap" data-marker="gap" transform="translate(${f(st.x)} ${axis})"><ellipse rx="${f(h + 9)}" ry="7" fill="url(#sel-chalk)"/>${dots.map((dd) => `<circle cx="${f(dd)}" r="1.25" fill="${CHALK}"/>`).join("")}</g>`;
      // The tooltip sits above both ends of the line at the gap, so it never covers them.
      ay = Math.min(geo.Y(M.lineAt(GAP0 - 1)), geo.Y(M.lineAt(GAP1 + 1))) - 12;
    } else {
      key = "none";
      // Still ahead without history: no usual line, so no marker; only a short tick on the time axis.
      html = `<path class="sg-tick" d="M${gx},${axis - 3.5}V${axis + 4.5}" stroke="rgba(245,243,242,0.6)" stroke-width="1"/>`;
      ay = geo.yt + (yb - geo.yt) * 0.35;
    }
    if (html != null) { g.innerHTML = html; painted = { key: form === "line" || form === "usual" ? key : null }; }
    placeTip(x, ay, st.kind === "ahead" || st.kind === "wait");
  }
  function clearMarker() {
    const g = $("#sel");
    if (g) g.innerHTML = "";
    painted = null;
    stepAside(null);
  }
  // Beside the hairline, earlier before now and later after it when that side fits, with a fallback that clears
  // the end point by 11px. While the marker follows, the tooltip rides with it; side and placement-mode changes
  // ease on the follow's curve (the offset below, see "follow" in the motion section).
  let tipSize = null, peakTagBox = null, tipShown = null; // last drawn position, placement mode and avoidance mode
  function placeTip(x, py, later = false) {
    const { W, H } = geo;
    // The box's rendered width for the content it shows (the missing-span stop may be wider than --tip-w): measured
    // again whenever the content changes (tipSize is cleared then), unrounded so the 12px gap holds at any width.
    if (!tipSize) tipSize = { tw: tip.getBoundingClientRect().width, th: tip.offsetHeight };
    const { tw, th } = tipSize;
    const right = RTL !== later; // the earlier side is on the right in Arabic
    let left = right ? x + 12 : x - 12 - tw;
    let side = right;
    if (left < 2 || left + tw > W - 2) { left = right ? x - 12 - tw : x + 12; side = !right; }
    left = Math.max(2, Math.min(W - tw - 2, left));
    let top = py - th - 10, below = false;
    if (top < 0) { top = Math.min(py + 12, H - th); below = true; }
    let mode = `${side}|${below}`;
    // Preserve the usual placement unless its box enters the end point's 9px halo plus 2px clearance.
    // The clearance also applies to delayed and no-history states, where the halo is not drawn.
    const end = $("#end-dot");
    if (end) {
      const ex = Number(end.getAttribute("cx")), ey = Number(end.getAttribute("cy"));
      const distance = (l, t) => Math.hypot(Math.max(l - ex, 0, ex - l - tw), Math.max(t - ey, 0, ey - t - th));
      // Near the boundary, test the browser's exact rounded rectangle so a placement that already
      // clears the halo remains pixel-identical. The temporary coordinates cannot paint within this task.
      let overlaps = distance(left, top) < 11.05;
      if (overlaps) {
        const oldLeft = tip.style.left, oldTop = tip.style.top;
        tip.style.left = `${f(left)}px`;
        tip.style.top = `${f(top)}px`;
        const box = tip.getBoundingClientRect(), dot = end.getBoundingClientRect();
        const dotX = dot.left + dot.width / 2, dotY = dot.top + dot.height / 2;
        overlaps = Math.hypot(Math.max(box.left - dotX, 0, dotX - box.right), Math.max(box.top - dotY, 0, dotY - box.bottom)) < 11;
        tip.style.left = oldLeft;
        tip.style.top = oldTop;
      }
      if (overlaps) {
        left = Math.max(2, Math.min(W - tw - 2, x - tw / 2));
        const above = py - th - 10, hasAbove = above >= 2 && above + th <= H - 2;
        top = hasAbove ? above : Math.max(2, Math.min(H - th - 2, py + 12));
        mode = hasAbove ? "center-above" : "center-below";
        if (distance(left, top) < 11) {
          const dx = Math.max(left - ex, 0, ex - left - tw);
          const dy = Math.sqrt(121 - dx * dx) + 0.02; // account for CSS pixel rounding
          const up = ey - dy - th, down = ey + dy;
          const choices = [];
          if (up >= 2) choices.push({ top: up, mode: "shift-up" });
          if (down <= H - th - 2) choices.push({ top: down, mode: "shift-down" });
          choices.sort((a, b) => Math.abs(a.top - top) - Math.abs(b.top - top) || (a.mode === "shift-up" ? -1 : 1));
          if (!choices.length) throw new Error(`No clear tooltip placement for ${sel?.key ?? "unknown"}`);
          const chosen = choices[0];
          top = chosen.top;
          mode = chosen.mode;
        }
      }
    }
    if (tipShown && (tipForce || tipShown.mode !== mode)) tipJump(tipShown.left - left, tipShown.top - top, tipForce);
    let off = tipOffset();
    let L0 = left + off.x, T0 = top + off.y;
    // When a bent path clears the end point, hand its displayed position back to the follow spring
    // so it eases to the resting box rather than snapping across the last part of the clearance.
    const endX = end ? Number(end.getAttribute("cx")) : 0, endY = end ? Number(end.getAttribute("cy")) : 0;
    const endDistance = (l, t) => Math.hypot(Math.max(l - endX, 0, endX - l - tw), Math.max(t - endY, 0, endY - t - th));
    if (end && (follow.route || follow.tip || tipShown?.avoiding) && tipShown?.avoiding && endDistance(L0, T0) >= 11) {
      tipJump(tipShown.left - left, tipShown.top - top, null);
      off = tipOffset();
      L0 = left + off.x;
      T0 = top + off.y;
    }
    // The follow can pass through the end point even when both resting boxes clear it. Bend that
    // intermediate path by the smallest available displacement, without moving either rest box.
    let avoiding = false, avoidMode = null;
    if (end && (follow.route || follow.tip || tipShown?.avoiding)) {
      const ex = endX, ey = endY;
      const dx = Math.max(L0 - ex, 0, ex - L0 - tw);
      const dy = Math.max(T0 - ey, 0, ey - T0 - th);
      if (Math.hypot(dx, dy) < 11) {
        const clearY = Math.sqrt(121 - dx * dx) + 0.06;
        const clearX = Math.sqrt(121 - dy * dy) + 0.06;
        const choices = [
          { x: L0, y: ey - clearY - th, order: 0 },
          { x: L0, y: ey + clearY, order: 1 },
          { x: ex - clearX - tw, y: T0, order: 2 },
          { x: ex + clearX, y: T0, order: 3 },
        ].filter((p) => p.x >= 2 && p.x + tw <= W - 2 && p.y >= 2 && p.y + th <= H - 2);
        if (!choices.length) throw new Error(`No clear moving tooltip placement for ${sel?.key ?? "unknown"}`);
        choices.sort((a, b) => {
          if (tipShown?.avoiding && choices.some((p) => p.order === tipShown.avoidMode)) {
            if (a.order === tipShown.avoidMode) return -1;
            if (b.order === tipShown.avoidMode) return 1;
          }
          return Math.hypot(a.x - L0, a.y - T0) - Math.hypot(b.x - L0, b.y - T0) || a.order - b.order;
        });
        L0 = choices[0].x;
        T0 = choices[0].y;
        avoiding = true;
        avoidMode = choices[0].order;
      }
    }
    tip.style.left = `${f(L0)}px`;
    tip.style.top = `${f(T0)}px`;
    // The tooltip's displayed velocity (px/ms), handed to it when the marker jumps.
    const tn = nowMs(), dtv = tn - tipVel.t;
    if (!tipShown || dtv >= 50) tipVel = { x: 0, y: 0, t: tn };
    else if (dtv > 0) tipVel = { x: (L0 - tipShown.left) / dtv, y: (T0 - tipShown.top) / dtv, t: tn };
    tipShown = { left: L0, top: T0, mode, avoiding, avoidMode };
    if (!peakTagBox) {
      const peakTag = $("#peak-tag");
      if (peakTag) { const pr = plot.getBoundingClientRect(), b = peakTag.getBoundingClientRect(); peakTagBox = { l: b.left - pr.left, r: b.right - pr.left, t: b.top - pr.top, b: b.bottom - pr.top }; }
    }
    if (peakTagBox) {
      const b = peakTagBox, r = { l: L0 - 4, r: L0 + tw + 4, t: T0 - 4, b: T0 + th + 4 };
      const covered = !(b.r < r.l || b.l > r.r || b.b < r.t || b.t > r.b);
      $("#peak-tag").classList.toggle("is-covered", covered);
    }
  }
  function selectStop(st, instant = false) {
    endIntro("chart"); // a hover, a tap, a key or focus on the chart: the intro settles at once first (motion section)
    if (!st) { clearSelection(); return; }
    if (sel && sel.key === st.key && !instant) return;
    const moving = !instant && !tip.hidden && motionOn();
    if (!moving) stopFollow();
    const prev = sel;
    sel = st;
    tip.innerHTML = tipHTML(st); // text and numbers change at once, then the tooltip travels: no cross-fade
    tip.hidden = false;
    tipSize = null;
    hit.setAttribute("aria-valuenow", String(Math.round(st.m)));
    hit.setAttribute("aria-valuetext", valueText(st));
    const to = restPoint(st);
    if (moving) followTo(to, st, prev);
    else { tipShown = null; paintMarker(to, st, true); }
  }
  function clearSelection() {
    stopFollow();
    sel = null;
    clearMarker();
    tip.hidden = true;
    tipShown = null;
    const peakTag = $("#peak-tag");
    if (peakTag) peakTag.classList.remove("is-covered");
  }
  function restoreSelection() {
    stopFollow();
    tipSize = null;
    const latest = stopBy("latest");
    if (latest && !sel) { hit.setAttribute("aria-valuenow", String(latest.m)); hit.setAttribute("aria-valuetext", valueText(latest)); }
    if (!sel) return;
    const st = stopBy(sel.key);
    if (!st) { clearSelection(); return; }
    selectStop(st, true);
  }

  // Slider semantics for keyboard inspection. The same readout follows the pointer, a tap, or the arrow keys.
  hit.setAttribute("aria-label", L.chartAria);
  hit.setAttribute("aria-valuemin", "0");
  hit.setAttribute("aria-valuemax", String(DAY));
  hit.setAttribute("aria-valuenow", String(M.last));
  $("#chart-keys").textContent = L.keys;
  // The pointer snaps to the nearest stop; the peak and the latest reading also win whenever the pointer is within
  // MAGNET px of them. Beyond the first and last stop by more than 16px, nothing is selected.
  function stopAt(clientX) {
    if (!geo || !stops.length) return null;
    const x = clientX - plot.getBoundingClientRect().left;
    const xs = stops.map((st) => st.x), lo = Math.min(...xs) - 16, hi = Math.max(...xs) + 16;
    if (x < lo || x > hi) return null;
    let best = null, bd = Infinity, pull = null, pd = Infinity;
    stops.forEach((st) => {
      const d = Math.abs(st.x - x);
      if (d < bd) { bd = d; best = st; }
      if ((st.kind === "peak" || st.kind === "latest") && d <= MAGNET && d < pd) { pd = d; pull = st; }
    });
    return pull || best;
  }
  let pinned = false;
  hit.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse" && !pinned) selectStop(stopAt(e.clientX)); });
  hit.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse" && !pinned && document.activeElement !== hit) clearSelection(); });
  hit.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") { pinned = true; selectStop(stopAt(e.clientX)); } });
  hit.addEventListener("focus", () => { if (!sel) selectStop(stopBy("latest"), true); });
  hit.addEventListener("blur", () => { pinned = false; clearSelection(); });
  hit.addEventListener("keydown", (e) => {
    if (!stops.length) return;
    const latest = stopBy("latest").i;
    const i = sel ? sel.i : latest;
    const later = RTL ? "ArrowLeft" : "ArrowRight", earlier = RTL ? "ArrowRight" : "ArrowLeft";
    let j;
    if (e.key === later || e.key === "ArrowUp") j = i + 1;
    else if (e.key === earlier || e.key === "ArrowDown") j = i - 1;
    else if (e.key === "PageUp") j = i + 4;
    else if (e.key === "PageDown") j = i - 4;
    else if (e.key === "Home") j = 0;
    else if (e.key === "End") j = latest;
    else if (e.key === "Escape") { clearSelection(); return; }
    else return;
    e.preventDefault();
    selectStop(stops[Math.max(0, Math.min(stops.length - 1, j))]);
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
    // Round 6: nothing animates that is not data or a direct result of the owner's action; the jump is instant.
    if (open) details.scrollIntoView({ behavior: "auto", block: "start" });
  });

  /* ================================================================ motion
   * Round 6: motion carries information and decoration never moves. The page is complete at first paint: no load
   * sequence, and the lights never move. The one exception (Round 7 step 3) is the first-open intro, once per browser
   * tab: the answers roll into place and the line draws once, then the page is its still self (see "the first-open
   * intro" below). Otherwise something moves only when the data changes (a new reading:
   * the changed digits roll, level bars fill or empty, the line's tail extends) or when the owner acts (the chart's
   * marker follows its stop along the curve, the rail opens). No glyph ever changes opacity: numbers roll inside a
   * clip, words swap at once, and the tooltip appears, changes and leaves at once (then travels with the marker). With prefers-reduced-motion,
   * ?motion=off or the tuner's Motion switch, every change is instant. At rest no inline style, attribute or extra
   * element from this section remains (the live pulse is the one exception, and only while live). */
  const EASE = {
    roll: "cubic-bezier(0.25, 1, 0.5, 1)",       // digits: decisive start, soft landing (quart out)
    bar: "cubic-bezier(0.25, 1, 0.5, 1)",        // a level bar fills or empties
    morph: "cubic-bezier(0.4, 0, 0.2, 1)",       // the live tail (a data transition: symmetric)
    rail: "cubic-bezier(0.22, 1, 0.36, 1)",      // rail opens
    railClose: "cubic-bezier(0.4, 0, 0.2, 1)",   // rail closes
    introLine: "cubic-bezier(0.3, 0.2, 0.4, 1)", // the intro's line: a firm start, an even day, a soft landing into now
  };
  const T = {
    roll: 280,
    bar: 200, barStagger: 50,
    morph: 280,
    railOpen: 240, railClose: 200, railDist: 156, railReveal: 12,
    pulse: 5000,
  };
  const played = []; // every animation this section started, so motion off can finish them at once
  function track(a) { played.push(a); a.finished.catch(() => {}).then(() => { const i = played.indexOf(a); if (i >= 0) played.splice(i, 1); }); return a; }
  // A clock: an animation with no target and no keyframes, whose eased progress drives SVG geometry.
  const clockAnim = (timing) => { const a = new Animation(new KeyframeEffect(null, [], timing), document.timeline); a.play(); return a; };
  const norm = (() => { const t = document.createElement("template"); return (html) => { t.innerHTML = html; return t.innerHTML; }; })();

  /* ---- numbers roll by digit (odometer). Only the digits that change move: up when the value rises, down when it
   * falls, inside a clip the size of the digits' own ink box, so a digit never fades and two digits never overlap. The number is
   * restructured only for the roll: each changed digit becomes a slot holding the old and the new digit, and the
   * numeric run is an LTR isolate so bidi order holds in Arabic. At the end the element gets back exactly its
   * plain markup. Readex Pro has no tabular figures (its digit widths do not change with tabular-nums), so a slot
   * eases its width from the old digit's to the new digit's over the same roll instead of jumping. */
  const rolls = new Map(); // element -> { anims, html }
  const NUM = /\d+(?:[:.,]\d+)*/g;
  const numValue = (s) => Number(s.replace(/\D/g, "")) || 0;
  function finishRoll(el) {
    const r = rolls.get(el);
    if (!r) return;
    rolls.delete(el);
    r.anims.forEach((a) => a.cancel());
    el.innerHTML = r.html;
  }
  // The markup with every text emptied: two contents with the same shape differ only in their text.
  const shapeOf = (nodes) => {
    const c = document.createElement("div");
    c.append(...[...nodes].map((n) => n.cloneNode(true)));
    const w = document.createTreeWalker(c, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) n.nodeValue = "";
    return c.innerHTML;
  };
  const textNodes = (node) => { const out = [], w = document.createTreeWalker(node, NodeFilter.SHOW_TEXT); for (let n = w.nextNode(); n; n = w.nextNode()) out.push(n); return out; };
  function rollTo(el, html, dir = 0) {
    if (!el) return;
    finishRoll(el);
    if (el.innerHTML === norm(html)) return;
    if (!motionOn() || !el.isConnected || !el.getClientRects().length) { el.innerHTML = html; return; }
    const tpl = document.createElement("template");
    tpl.innerHTML = html;
    if (shapeOf(el.childNodes) !== shapeOf(tpl.content.childNodes)) { el.innerHTML = html; return; }
    const olds = textNodes(el), news = textNodes(tpl.content);
    const slots = [];
    olds.forEach((t, i) => {
      const a = t.nodeValue, b = news[i].nodeValue;
      if (a !== b) t.replaceWith(rollFragment(a, b, dir, slots));
    });
    const o = { duration: T.roll, easing: EASE.roll };
    const anims = [];
    slots.forEach(({ slot, nw, old, up }) => {
      const wOld = old.getBoundingClientRect().width, wNew = nw.getBoundingClientRect().width;
      // The window is the digits' own ink box (cap line to baseline, plus a hair), not the taller line box, so a
      // digit enters at the baseline and leaves at the cap line; it travels exactly the window's height.
      const w = digitWindow(slot, nw);
      slot.style.clipPath = `inset(${f(w.top)}px -0.3em ${f(w.bottom)}px -0.3em)`;
      const d = (up ? 1 : -1) * w.height;
      anims.push(nw.animate([{ transform: `translateY(${f(d)}px)` }, { transform: "translateY(0px)" }], o));
      anims.push(old.animate([{ transform: "translateY(0px)" }, { transform: `translateY(${f(-d)}px)` }], { ...o, fill: "forwards" }));
      if (Math.abs(wOld - wNew) > 0.01) anims.push(slot.animate([{ width: `${wOld}px` }, { width: `${wNew}px` }], o));
    });
    anims.forEach(track);
    const run = { anims, html };
    rolls.set(el, run);
    Promise.all(anims.map((a) => a.finished)).then(() => { if (rolls.get(el) === run) finishRoll(el); }).catch(() => {});
  }
  // The ink box of the digits in this slot: the baseline is measured in place (a zero-size probe on it), the digits'
  // ascent and descent come from the font itself (canvas measureText of 0-9), with 0.08em to spare on each side.
  const measureCtx = document.createElement("canvas").getContext("2d");
  // The intro passes the slot's own text too, so a time's «م» (whose tail drops below the digits) fits the window.
  function digitWindow(slot, nw, extra = "") {
    const cs = getComputedStyle(nw), size = parseFloat(cs.fontSize);
    measureCtx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const m = measureCtx.measureText(`0123456789${extra}`);
    const probe = document.createElement("i");
    probe.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline";
    nw.append(probe);
    const base = probe.getBoundingClientRect().top - slot.getBoundingClientRect().top;
    probe.remove();
    const h = slot.getBoundingClientRect().height, pad = 0.08 * size;
    // (For the intro the window may reach past the slot's line box, where a tail like «م»'s can hang.)
    const t0 = base - m.actualBoundingBoxAscent - pad, b0 = base + m.actualBoundingBoxDescent + pad;
    const top = extra ? t0 : Math.max(0, t0), bottom = extra ? b0 : Math.min(h, b0);
    return { top, bottom: h - bottom, height: bottom - top };
  }
  // The old and new text of one text node: words and separators take the new text at once; each numeric run is
  // compared digit by digit from the right, and every digit that differs becomes a rolling slot.
  function rollFragment(a, b, dir, slots) {
    const split = (s) => { const out = []; let i = 0; for (const m of s.matchAll(NUM)) { if (m.index > i) out.push({ num: false, s: s.slice(i, m.index) }); out.push({ num: true, s: m[0] }); i = m.index + m[0].length; } if (i < s.length) out.push({ num: false, s: s.slice(i) }); return out; };
    const ta = split(a).filter((x) => x.num), tbs = split(b);
    const frag = document.createDocumentFragment();
    if (ta.length !== tbs.filter((x) => x.num).length) { frag.append(b); return frag; }
    let k = 0;
    tbs.forEach((tok) => {
      if (!tok.num) { frag.append(tok.s); return; }
      const A = ta[k++].s, B = tok.s;
      if (A === B) { frag.append(B); return; }
      const up = dir ? dir > 0 : numValue(B) >= numValue(A);
      const run = document.createElement("span");
      run.className = "roll-run";
      const n = Math.max(A.length, B.length);
      let plain = "";
      const flush = () => { if (plain) { run.append(plain); plain = ""; } };
      for (let i = 0; i < n; i++) {
        const ca = A[i - (n - A.length)] || "", cb = B[i - (n - B.length)] || "";
        if (ca === cb) { plain += cb; continue; }
        flush();
        const slot = document.createElement("span"), nw = document.createElement("span"), old = document.createElement("span");
        slot.className = "roll-slot"; nw.className = "roll-new"; old.className = "roll-old";
        old.setAttribute("aria-hidden", "true");
        nw.textContent = cb; old.textContent = ca;
        slot.append(nw, old);
        run.append(slot);
        slots.push({ slot, nw, old, up });
      }
      flush();
      frag.append(run);
    });
    return frag;
  }

  /* ---- the crowd-level chip never cross-fades: each bar that changes fills (or empties) on its own with a short
   * scaleY from the bottom, lower bars first when the level rises and upper bars first when it falls; the level
   * word swaps at once. The comparison chip appears or leaves at once. */
  const feet = new Map(); // foot element -> { anims, html }
  function finishFoot(foot) {
    const r = feet.get(foot);
    if (!r) return;
    feet.delete(foot);
    r.anims.forEach((a) => a.cancel());
    foot.innerHTML = r.html;
  }
  function setFoot(foot, v, cmp) {
    if (!foot) return;
    finishFoot(foot);
    const html = levelChip(v) + cmp;
    if (foot.innerHTML === norm(html)) return;
    const chip = $(".level", foot);
    if (!motionOn() || !chip || !foot.getClientRects().length) { foot.innerHTML = html; return; }
    const li = levelOf(v);
    chip.lastChild.nodeValue = L.levels[li];
    foot.querySelectorAll(".cmp").forEach((n) => n.remove());
    if (cmp) chip.insertAdjacentHTML("afterend", cmp);
    const bars = [...chip.querySelectorAll(".bars i")];
    const changed = bars.map((b, i) => ({ b, i, on: i <= li })).filter(({ b, on }) => b.classList.contains("on") !== on);
    const rising = changed.length && changed[0].on;
    const order = rising ? changed : changed.slice().reverse();
    const anims = order.map(({ b, on }, k) => {
      b.classList.remove("on");
      b.classList.add("lv-anim");
      const fill = document.createElement("b");
      fill.className = "lv-fill";
      b.append(fill);
      return track(fill.animate([{ transform: `scaleY(${on ? 0 : 1})` }, { transform: `scaleY(${on ? 1 : 0})` }], { duration: T.bar, delay: k * T.barStagger, easing: EASE.bar, fill: "both" }));
    });
    const run = { anims, html };
    feet.set(foot, run);
    if (!anims.length) { finishFoot(foot); return; }
    Promise.all(anims.map((a) => a.finished)).then(() => { if (feet.get(foot) === run) finishFoot(foot); }).catch(() => {});
  }

  /* ---- screen readers hear the new figures once per change, through one polite live region (never per digit:
   * the rolling digits' old copies are hidden from assistive technology). */
  const liveSay = $("#live-say");
  const announce = () => { if (liveSay) liveSay.textContent = L.say(shownNow(), L.levels[levelOf(shownNow())], M.entries); };

  /* ---- the smooth follow (Round 7 step 2; it replaces the Round 6 glide of 120-150 ms). The marker, its hairline and
   * the tooltip chase their target along the drawn curve itself, x and y together, with the reference clip's feel: a
   * fast start and a long, soft landing, time-based and independent of distance.
   *   Response: two first-order lags in series (an overdamped spring), tau 90 ms and 15 ms at the default hover speed.
   *     From rest it covers 0.19 of a step at 33 ms, 0.43 at 66, 0.60 at 100, 0.73 at 133, 0.87 at 200, 0.94 at 266
   *     and 0.99 at 400 ms: the clip's figures (0.19, 0.43, 0.60, 0.72, 0.87, 0.95, settled) within 0.012.
   *   No restart: the state (position and velocity) is kept when a new target arrives; only the target moves. A quick
   *     sweep over several stops is one continuous movement, and it never overshoots a target it approaches.
   *   The route: along today's line (or the usual line) by arc length, and between the line and the peak ring up the
   *     peak's dotted drop. It is rebuilt from the marker's current place at each new target, carrying the velocity.
   *   Where no drawn track joins the two stops (across the missing span, from the latest reading into the future,
   *     onto or off the gap stop), the marker moves at once, never off the line and never across the gap, while the
   *     tooltip keeps its place and eases into its new one on the same curve. The same easing takes the tooltip
   *     across when it changes side.
   *   Far moves (more than 6 hours of the day, such as Home or End from far away): the marker and the tooltip both
   *     move at once, as on a first appearance, rather than racing across the whole chart in 400 ms. A sweep of the
   *     pointer never reaches this, because the marker trails the pointer by far less.
   *   The hover speed (tuner) divides both time constants. Positions are exact functions of the time since the last
   *   target, so frame rate never changes the path. */
  const FOLLOW = { tau1: 90, tau2: 15, jumpMinutes: 360, ext: 160, settlePx: 0.1, settleV: 0.003 };
  const follow = { raf: 0, route: null, stop: null, t0: 0, e0: 0, v0: 0, tip: null, hold: null, snap: null, tLast: 0, at: null, settle: false };
  let tipForce = null; // set just before a jump: the tooltip's displayed velocity, for the next placeTip
  let tipVel = { x: 0, y: 0, t: 0, left: 0, top: 0 };
  const nowMs = () => (follow.hold != null ? follow.hold : performance.now());
  const taus = () => { const k = opts.hoverSpeed || 1; return [FOLLOW.tau1 / k, FOLLOW.tau2 / k]; };
  // The follow's response to a step, from error e0 and velocity v0 (px, px/ms), after dt ms: exact, so any frame rate
  // lands on the same path.
  function spring(e0, v0, dt) {
    const [a, b] = taus(), r1 = -1 / a, r2 = -1 / b;
    const B = (v0 - r1 * e0) / (r2 - r1), A = e0 - B, x1 = Math.exp(r1 * dt), x2 = Math.exp(r2 * dt);
    return { e: A * x1 + B * x2, v: A * r1 * x1 + B * r2 * x2 };
  }
  const lineLeg = (t, l0, l1) => ({ kind: "line", t, l0, dir: Math.sign(l1 - l0) || 1, len: Math.abs(l1 - l0) });
  const dropLeg = (pk, base, a, b) => ({ kind: "drop", pk, base, a, dir: Math.sign(b - a) || 1, H: base.y - pk.y, len: Math.abs(b - a) * (base.y - pk.y) });
  function legAt(leg, d) {
    d = Math.max(0, Math.min(leg.len, d));
    if (leg.kind === "line") { const l = leg.l0 + leg.dir * d, p = evalAt(leg.t.segs, uOfLength(leg.t, l)); return { x: p.x, y: p.y, lift: 0, ly: p.y, l }; }
    const lift = leg.a + (leg.dir * d) / leg.H;
    return { x: leg.pk.x, y: leg.base.y + (leg.pk.y - leg.base.y) * lift, lift, ly: leg.base.y, l: leg.lPk };
  }
  // From the marker's current place to a stop's rest point, on one track: [back extension] legs [forward extension].
  // The extensions carry on along the same track, so a marker moving away from a new target turns back on the line.
  function buildRoute(cur, to) {
    if (!cur || !to || !cur.track || cur.track !== to.track) return null;
    const path = trackPath(cur.track);
    if (!path) return null;
    const t = table(path);
    const lOf = (p) => (p.l != null && p.lift === 0 ? p.l : lengthOfU(t, uAtX(t, p.x)));
    let pk = null, base = null, lPk = 0;
    if (cur.lift > 0 || to.lift > 0) { pk = peakPoint(); const u = uAtX(t, pk.x); base = evalAt(t.segs, u); lPk = lengthOfU(t, u); }
    const lc = cur.lift > 0 ? lPk : lOf(cur), lt = to.lift > 0 ? lPk : lOf(to);
    const drop = (a, b) => ({ ...dropLeg(pk, base, a, b), lPk });
    let legs = [];
    if (cur.lift > 0 && to.lift > 0) legs.push(drop(cur.lift, to.lift));
    else {
      if (cur.lift > 0) legs.push(drop(cur.lift, 0));
      legs.push(lineLeg(t, lc, lt));
      if (to.lift > 0) legs.push(drop(0, to.lift));
    }
    const main = legs.filter((g) => g.len > 1e-6);
    if (!main.length) main.push(legs[0]);
    const first = main[0], last = main[main.length - 1];
    const lineExt = (l0, dir) => { const bound = dir > 0 ? t.total : 0; return lineLeg(t, l0, l0 + dir * Math.min(FOLLOW.ext, Math.abs(bound - l0))); };
    let back = null, fwd = null;
    if (first.kind === "line") back = lineExt(lc, -first.dir);
    else if (first.dir < 0) back = drop(cur.lift, 1);
    else if (cur.lift > 0) back = drop(cur.lift, 0);
    if (last.kind === "line") fwd = lineExt(lt, last.dir);
    const R = main.reduce((s, g) => s + g.len, 0);
    return { track: cur.track, legs: main, back: back && back.len > 1e-6 ? back : null, fwd: fwd && fwd.len > 1e-6 ? fwd : null, R };
  }
  function pointAtS(r, s) {
    let p;
    if (s < 0) p = r.back ? legAt(r.back, -s) : legAt(r.legs[0], 0);
    else if (s > r.R) p = r.fwd ? legAt(r.fwd, s - r.R) : legAt(r.legs[r.legs.length - 1], r.legs[r.legs.length - 1].len);
    else { let d = s, i = 0; while (i < r.legs.length - 1 && d > r.legs[i].len) { d -= r.legs[i].len; i++; } p = legAt(r.legs[i], d); }
    return { ...p, track: r.track };
  }
  // The direction the route runs at s (what "forward" means there), to carry the velocity into a new route.
  function dirAt(r, s) {
    if (s < 0 && r.back) return { kind: r.back.kind, dir: -r.back.dir };
    if (s > r.R && r.fwd) return { kind: r.fwd.kind, dir: r.fwd.dir };
    let d = s, i = 0;
    while (i < r.legs.length - 1 && d > r.legs[i].len) { d -= r.legs[i].len; i++; }
    return { kind: r.legs[i].kind, dir: r.legs[i].dir };
  }
  function followState(now) {
    const r = follow.route, st = spring(follow.e0, follow.v0, Math.max(0, now - follow.t0));
    let s = r.R + st.e, v = st.v;
    const lo = r.back ? -r.back.len : 0, hi = r.R + (r.fwd ? r.fwd.len : 0);
    if (s < lo || s > hi) { s = Math.min(hi, Math.max(lo, s)); v = 0; follow.t0 = now; follow.e0 = s - r.R; follow.v0 = 0; }
    return { s, v, e: s - r.R };
  }
  function tipState(now) {
    const o = follow.tip, dt = Math.max(0, now - o.t0), x = spring(o.ox, o.vx, dt), y = spring(o.oy, o.vy, dt);
    return { x: x.e, y: y.e, vx: x.v, vy: y.v };
  }
  function tipOffset() { return follow.tip ? tipState(nowMs()) : { x: 0, y: 0 }; }
  // The tooltip keeps where it was drawn (dx, dy from its new place) and eases in. A side flip keeps its own velocity;
  // a jump of the marker hands it the tooltip's displayed velocity.
  function tipJump(dx, dy, vel) {
    if (!motionOn() || tip.hidden || Math.hypot(dx, dy) < 0.05) return;
    const now = nowMs(), cur = follow.tip ? tipState(now) : { vx: 0, vy: 0 };
    follow.tip = { t0: now, ox: dx, oy: dy, vx: vel ? vel.x : cur.vx, vy: vel ? vel.y : cur.vy };
    loopFollow();
  }
  function loopFollow() { if (!follow.raf && follow.hold == null) follow.raf = requestAnimationFrame(followFrame); }
  function followTo(to, st, prev) {
    const now = nowMs();
    let cur = follow.at, v = 0, r0 = follow.route;
    if (r0) { const s = followState(now); cur = pointAtS(r0, s.s); v = s.v; }
    follow.stop = st;
    follow.tLast = now;
    const far = Math.abs((to ? to.x : st.x) - (cur ? cur.x : prev ? prev.x : st.x)) > (FOLLOW.jumpMinutes / DAY) * geo.span;
    if (far) { follow.route = null; follow.tip = null; tipShown = null; paintMarker(to, st, true); return; }
    const r = buildRoute(cur, to);
    if (r && r.R > 0.05) {
      let v0 = 0;
      if (r0) { const a = dirAt(r0, followState(now).s), b = r.legs[0]; if (a.kind === b.kind) v0 = v * a.dir * b.dir; }
      follow.route = r; follow.t0 = now; follow.e0 = -r.R; follow.v0 = v0;
      followFrame();
      return;
    }
    // No drawn track joins them, or it is far: the marker moves at once; the tooltip keeps its place and eases in.
    follow.route = null;
    tipForce = { x: tipVel.x, y: tipVel.y };
    paintMarker(to, st, true);
    tipForce = null;
    loopFollow();
  }
  function followFrame() {
    follow.raf = 0;
    if (!sel || tip.hidden) return;
    const now = nowMs();
    let moving = false;
    if (follow.route) {
      const s = followState(now);
      if (Math.abs(s.e) <= FOLLOW.settlePx && Math.abs(s.v) <= FOLLOW.settleV) { follow.route = null; follow.settle = true; }
      else { moving = true; paintMarker(pointAtS(follow.route, s.s), follow.stop); }
    }
    if (follow.tip) {
      const o = tipState(now);
      if (Math.hypot(o.x, o.y) <= FOLLOW.settlePx && Math.hypot(o.vx, o.vy) <= FOLLOW.settleV) follow.tip = null;
      else moving = true;
    }
    // At rest the marker is drawn exactly on its stop, the same as without motion.
    if (!follow.route) { paintMarker(restPoint(sel), sel, follow.settle); follow.settle = false; }
    if (moving) loopFollow();
  }
  // Ends the follow at once, with the marker and the tooltip at rest on the selected stop.
  function stopFollow() {
    const was = Boolean(follow.route || follow.tip || follow.hold != null);
    cancelAnimationFrame(follow.raf);
    follow.raf = 0;
    follow.route = null;
    follow.tip = null;
    follow.hold = null;
    follow.snap = null;
    if (was && sel && !tip.hidden) paintMarker(restPoint(sel), sel, true);
  }
  // Holds the follow at `ms` after its latest target (for held frames; it can be held again at another time), or
  // releases it.
  function seekFollow(ms) {
    if (!follow.snap) {
      if (!follow.route && !follow.tip) return false;
      follow.snap = { route: follow.route, t0: follow.t0, e0: follow.e0, v0: follow.v0, tip: follow.tip && { ...follow.tip }, tipShown };
    }
    const k = follow.snap;
    Object.assign(follow, { route: k.route, t0: k.t0, e0: k.e0, v0: k.v0, tip: k.tip && { ...k.tip } });
    tipShown = k.tipShown;
    cancelAnimationFrame(follow.raf);
    follow.raf = 0;
    follow.hold = follow.tLast + ms;
    followFrame();
    return true;
  }
  function releaseFollow() {
    if (follow.hold == null) return;
    follow.hold = null;
    if (follow.snap) { const k = follow.snap; Object.assign(follow, { route: k.route, t0: k.t0, e0: k.e0, v0: k.v0, tip: k.tip }); follow.snap = null; }
    loopFollow();
  }
  // A new hover speed takes effect from now, from where the marker and tooltip are.
  function rebaseFollow() {
    const now = nowMs();
    if (follow.route) { const s = followState(now); follow.t0 = now; follow.e0 = s.e; follow.v0 = s.v; }
    if (follow.tip) { const o = tipState(now); follow.tip = { t0: now, ox: o.x, oy: o.y, vx: o.vx, vy: o.vy }; }
  }

  /* ---- live: the pulse on the line's end point (live state only; never while delayed). Calmer than Round 5: one
   * thin ring every 5 s, from inside the end point to just past its halo, at 40% at most. */
  let ping = null;
  function startPulse() {
    if (!motionOn() || STATE === "delayed") return;
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

  /* ---- live: a new reading extends the line; it never redraws. The centred average is cut at the latest reading,
   * so when a reading arrives the last ~15 minutes of the average legitimately change: only that tail morphs, in
   * place, while it extends to the new point (280 ms). Everything earlier is untouched. The changed digits roll and
   * the level bars change at the same moment. */
  const liveRun = { clock: null, raf: 0, from: null, to: null, K: 0, seg: 0, body: "" };
  function stepReading() {
    endIntro("new reading"); // a reading during the intro is never lost: the intro settles at once, then the reading lands
    finishLive();
    stopFollow();
    const from = M;
    if (from.nowM >= DAY - 1) return null;
    const reading = STATE !== "delayed"; // delayed: the minute passes and no reading arrives
    const to = compute(reading ? from.last + 1 : from.last, from.nowM + 1);
    M = to;
    if (reading) crowdShown = null;
    updateCards(from);
    if (reading) announce();
    $("#chart-summary").textContent = summary();
    built = false;
    if (!details.hidden) buildDetails();
    const canMorph = reading && motionOn() && geo && from.segments.length === to.segments.length;
    if (!canMorph) { render(); return { reading, morph: false }; }
    // The stops for the new reading (the geometry's scale is unchanged); a selected stop keeps its key.
    buildStops();
    if (sel) { const st = stopBy(sel.key); if (st) { sel = st; tip.innerHTML = tipHTML(st); tipSize = null; hit.setAttribute("aria-valuetext", valueText(st)); } }
    // The first minute where the drawn line changes; the tail starts at the line point before it.
    const si = to.segments.length - 1, segNew = to.segments[si];
    let m0 = from.last;
    for (let m = segNew[0]; m <= from.last; m++) { if (Math.abs(from.lineAt(m) - to.lineAt(m)) > 1e-7) { m0 = m; break; } }
    let ki = 0;
    while (ki < segNew.length - 1 && segNew[ki + 1] <= m0) ki++;
    liveRun.from = from; liveRun.to = to; liveRun.seg = si; liveRun.K = segNew[ki];
    liveRun.body = to.splines[si].path(geo.X, geo.Y, ki);
    liveRun.clock = track(clockAnim({ duration: T.morph, easing: EASE.morph, fill: "both" }));
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
    if (path) { path.setAttribute("d", d); tables.delete(path); }
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
    const setBand = (r, a, b) => { if (!r) return; const l = Math.min(X(a), X(b)), rr = Math.max(X(a), X(b)); r.setAttribute("x", f(l)); r.setAttribute("width", f(rr - l)); };
    setBand($("#c-past-r"), -8, nowT);
    setBand($("#c-ahead-r"), nowT, DAY + 8);
    // A selected stop on the moving tail stays on the line.
    if (sel && sel.track === `L${seg}` && (sel.kind === "latest" || (sel.kind === "read" && sel.m >= K))) {
      const m = sel.kind === "latest" ? end : sel.m, y = Y(morphValue(m, t));
      paintMarker({ x: X(m), y, lift: 0, ly: y, track: sel.track }, sel);
    } else if (sel) {
      // The selected content may have widened at the new reading; keep its edge beside the hairline
      // while the end point moves, even when the selected stop itself is stationary.
      paintMarker(restPoint(sel), sel);
    }
  }
  function liveLoop() { liveRun.raf = 0; if (!liveRun.clock) return; applyMorph(); liveRun.raf = requestAnimationFrame(liveLoop); }
  function finishLive() {
    if (!liveRun.clock) return;
    cancelAnimationFrame(liveRun.raf);
    liveRun.raf = 0;
    liveRun.clock.cancel();
    liveRun.clock = null;
    render(); // the canonical chart for the new reading; identical to the morph's last frame
  }
  function seekLive(fraction) {
    if (!liveRun.clock) return false;
    cancelAnimationFrame(liveRun.raf);
    liveRun.raf = 0;
    liveRun.clock.pause();
    liveRun.clock.currentTime = T.morph * fraction;
    applyMorph();
    return true;
  }
  function resetReadings() {
    endIntro("reset readings");
    finishLive();
    const from = M;
    M = compute(START.last, START.nowM);
    crowdShown = null;
    updateCards(from);
    announce();
    $("#chart-summary").textContent = summary();
    built = false;
    if (!details.hidden) buildDetails();
    render();
  }
  // Tuner: a crowd-level change on the Inside now card, across the nearest level boundary by the smallest step
  // (Busy 49 goes down to Moderate 48, or up to Packed 69). Live only: a delayed card never moves.
  function crowdStep(dir) {
    if (STATE === "delayed") return null;
    endIntro("crowd change");
    const v = shownNow(), li = levelOf(v);
    const next = dir > 0 ? (li >= 3 ? null : [25, 49, 69][li]) : (li <= 0 ? null : [24, 48, 68][li - 1]);
    if (next == null) return null;
    crowdShown = next === occ[M.last] ? null : next;
    rollTo($("#now-v"), String(next));
    setFoot($("#now-foot"), next, cmpChip(M.compare));
    announce();
    return { from: v, to: next, level: L.levels[levelOf(next)], fromLevel: L.levels[li] };
  }

  /* ---- rail: opens with transforms (the width switches at once and is never animated). During the change the
   * rail's own surface steps aside for three pieces: a fixed start cap, a middle that scales from the inline-start,
   * and an end cap that slides. The section names never fade: the moving end cap uncovers them (a clip on each name
   * that keeps 12px inside the moving edge, on the same timing and curve), and covers them again on close. */
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
    // Each name is uncovered by the moving edge. The keyframe offsets are points along the eased progress, which is
    // exactly where the end cap is (it moves linearly in eased progress), so name and edge stay locked together.
    const rr = rail.getBoundingClientRect(), closedW = rr.width - T.railDist; // the collapsed rail's width (80px)
    rail.querySelectorAll(".rail-name").forEach((n) => {
      const b = n.getBoundingClientRect();
      const a = RTL ? rr.right - b.right : b.left - rr.left, w = b.width; // the name's inline-start offset in the rail
      const p0 = Math.min(1, Math.max(0, (a + T.railReveal - closedW) / T.railDist));
      const p1 = Math.min(1, Math.max(p0, (a + w + T.railReveal - closedW) / T.railDist));
      // Fully hidden: the whole name and its 8px bleed are cut from the inline-end side. Shown: nothing is cut.
      const clip = (hidden) => { const e = f(hidden ? w + 8 : -8); return RTL ? `inset(-8px -8px -8px ${e}px)` : `inset(-8px ${e}px -8px -8px)`; };
      const frames = [{ offset: 0, clipPath: clip(1) }, { offset: p0, clipPath: clip(1) }, { offset: p1, clipPath: clip(0) }, { offset: 1, clipPath: clip(0) }];
      an.push(n.animate(open ? frames : frames.map((k) => ({ ...k, offset: 1 - k.offset })).reverse(), o));
    });
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

  /* ---- the first-open intro (Round 7 step 3; it amends Round 6 §1, "No load motion").
   * When: only on the first open of the page in a browser tab. A flag in sessionStorage (interface state, never visitor
   *   data) marks the tab as having opened the page, so F5, a reload, the language link or coming back in the same tab
   *   never play it; a new tab or a new browser session starts with empty session storage and plays it. If storage is
   *   unavailable there is no intro (fail safe). There is none with reduced motion, ?motion=off or the tuner's Motion
   *   switch off, and the flag is still set then: the intro belongs to the tab's first open only.
   * What is still: every surface (the cards and their lights, the wash, the rail), every label, unit, time of day and
   *   reference value (usual, average), the chart's grid, axes and legend, and the usual Wednesday line are present from
   *   the first paint and never move.
   * What moves, content only:
   *   1. The four answers (Inside now, Today's peak, Entries, Busiest time) roll into place with the page's own digit
   *      roll (280 ms, from below, inside the digits' ink box). It is a reveal of the current reading, not a count-up:
   *      each value enters its final place, no zero or intermediate value is ever drawn, and the DOM text is the final
   *      value from the first paint. While delayed, the stale Inside now number stays still (a stale card never moves).
   *   2. Today's line draws once, by minutes since open, from opening to the latest reading (640 ms, a soft landing),
   *      and its fine vertical lines are uncovered with it. It draws in time order, so right to left in Arabic. The
   *      missing span stays a gap throughout: each part of the line is its own path and is never joined.
   *   3. When the line arrives, the end point swells out of the line's tip (live; while delayed the grey point simply
   *      appears), and the peak ring swells into place with its dotted drop and its label (180 ms). The pulse starts then.
   *   About 820 ms in all at 1× (the tuner's intro speed divides every duration). Transform, clip and draw only: no glyph
   *   changes opacity, no element's box changes, and nothing is announced (the live region is untouched).
   * When it starts: once the page's fonts are loaded (no font swaps mid-intro) and the tab is visible. Until then the
   *   numbers wait out of sight and the line is not drawn; if the fonts are not in within 200 ms of the first paint
   *   (user decision, 2026-09-26; it replaces a 1 s cap), there is no intro: the still page shows at once, its numbers
   *   in the fallback font until the font arrives, as on a page without an intro. The tab's flag is already set then.
   * How it yields: any action (a pointer press or a key anywhere, the wheel, a hover, tap, key or focus on the chart, the
   *   rail), a new reading, a crowd change, a resize, leaving the tab, or motion switched off settles it at once to the
   *   still page, and the action then happens as it would have anyway. Nothing waits for the intro and nothing is lost.
   *   A tab opened in the background keeps its intro waiting until the tab is first shown.
   * At the end the page is exactly the still page: every element, attribute and style the intro added is removed. */
  const INTRO_STORE = "fitway.eclipse.v3.intro";
  // ms at 1×; the numbers use the digit roll's own T.roll. fontCap is not scaled: it counts from the first paint.
  const INTRO_T = { line: 640, mark: 180, fontCap: 200 };
  // A whole value: 49, 332, or a time with its own AM/PM (6-8 م, 6–8 PM), which is part of the value, unlike a unit.
  const INTRO_NUM = /\d+(?:[-–:.,]\d+)*(?: (?:ص|م|AM|PM)(?![\p{L}]))?/gu;
  // The peak's label waits by an empty clip, like the answers' slots: out of sight, but still in the accessibility tree
  // (visibility or display would remove it), and never by opacity.
  const INTRO_HIDE = ";clip-path:inset(50%)";
  const SVGNS = "http://www.w3.org/2000/svg";
  const intro = { state: "off", firstOpen: false, played: false, count: 0, reason: "", yieldedBy: null, nums: [], run: null, tagStyle: null, fontWaitMs: null, startedAt: null, endedAt: null };
  const introTotal = (k = opts.introSpeed || 1) => (Math.max(T.roll, INTRO_T.line) + INTRO_T.mark) / k;
  function introDecide() {
    let first = false;
    try {
      first = sessionStorage.getItem(INTRO_STORE) == null;
      sessionStorage.setItem(INTRO_STORE, "1");
      if (sessionStorage.getItem(INTRO_STORE) !== "1") throw new Error("not kept");
    } catch (e) { intro.reason = "session storage unavailable"; return; }
    intro.firstOpen = first;
    if (!first) { intro.reason = "already opened in this tab"; return; }
    if (!motionOn()) { intro.reason = URL_OFF ? "motion=off" : mqReduce.matches ? "reduced motion" : "motion switch off"; return; }
    intro.reason = "first open in this tab";
    introPark();
  }
  // Each answer's value becomes one rolling slot (the digit roll's own slot: the value in flow, so its box is final),
  // clipped out of sight. It inherits the text's own direction, so «6-8 م» keeps its order. Its text is the final value
  // throughout, so assistive technology reads the final value from the first paint.
  function introPark() {
    intro.state = "pending";
    const targets = [STATE === "delayed" ? null : $("#now-v"), $("#peak-v"), $("#entries-v"), $("#busy-v")].filter(Boolean);
    intro.nums = targets.map((el) => {
      const html = el.innerHTML, slots = [];
      textNodes(el).forEach((t) => {
        const s = t.nodeValue, frag = document.createDocumentFragment();
        let i = 0, any = false;
        for (const m of s.matchAll(INTRO_NUM)) {
          any = true;
          if (m.index > i) frag.append(s.slice(i, m.index));
          const slot = document.createElement("span"), nw = document.createElement("span");
          slot.className = "roll-slot"; nw.className = "roll-new";
          slot.style.clipPath = "inset(0 0 100% 0)"; // out of sight until the roll starts: a clip, never opacity
          nw.textContent = m[0];
          slot.append(nw); frag.append(slot);
          slots.push({ slot, nw });
          i = m.index + m[0].length;
        }
        if (!any) return;
        if (i < s.length) frag.append(s.slice(i));
        t.replaceWith(frag);
      });
      return { el, html, slots };
    });
  }
  // Waits for a visible tab and the page's fonts (both weights, both scripts), then starts on the next frame. The wait
  // for the fonts is capped at INTRO_T.fontCap from the first paint (or from now, if the page has not painted yet, which
  // is earlier); past it, there is no intro and the still page shows at once (endIntro).
  async function introWait() {
    if (document.visibilityState !== "visible") {
      await new Promise((res) => { const on = () => { if (document.visibilityState === "visible") { document.removeEventListener("visibilitychange", on); res(); } }; document.addEventListener("visibilitychange", on); });
    }
    if (intro.state !== "pending") return;
    let tv = performance.now();
    try { const p = performance.getEntriesByType("paint")[0]; if (p && p.startTime < tv) tv = p.startTime; } catch (e) { /* no paint timing */ }
    const sample = "العربية FITWAY 0123456789";
    const fontsIn = document.fonts
      ? Promise.all(["400", "500"].map((w) => document.fonts.load(`${w} 16px "Readex Pro"`, sample))).then(() => document.fonts.ready)
      : Promise.resolve();
    const cap = new Promise((res) => setTimeout(() => res(false), Math.max(0, tv + INTRO_T.fontCap - performance.now())));
    const ok = await Promise.race([fontsIn.then(() => true, () => false), cap]);
    intro.fontWaitMs = Math.round(performance.now() - tv);
    if (intro.state !== "pending") return;
    if (!ok) { endIntro("fonts late"); return; }
    render(); // measured with the final font (the header's text sets the chart's height); the pre-state is kept
    await new Promise((res) => requestAnimationFrame(() => res()));
    if (intro.state === "pending") introStart();
  }
  function introStart() {
    if (!geo) { endIntro("no chart"); return; }
    const k = opts.introSpeed || 1;
    const d = { roll: T.roll / k, line: INTRO_T.line / k, mark: INTRO_T.mark / k };
    intro.state = "running";
    intro.played = true;
    intro.count++;
    intro.startedAt = performance.now();
    const anims = [];
    // 1. The numbers: the digit roll, from below into the digits' ink box (measured now, with the final font).
    intro.nums.forEach(({ slots }) => slots.forEach(({ slot, nw }) => {
      const w = digitWindow(slot, nw, nw.textContent);
      slot.style.clipPath = `inset(${f(w.top)}px -0.3em ${f(w.bottom)}px -0.3em)`;
      anims.push(nw.animate([{ transform: `translateY(${f(w.height)}px)` }, { transform: "translateY(0px)" }], { duration: d.roll, easing: EASE.roll, fill: "both" }));
    }));
    // 2 and 3. The chart: clocks whose eased progress draws the line, then lands the end point and the peak.
    const line = clockAnim({ duration: d.line, easing: EASE.introLine, fill: "both" });
    const mark = clockAnim({ duration: d.mark, delay: d.line, easing: EASE.roll, fill: "both" });
    anims.push(line, mark);
    const run = { anims: anims.map(track), line, mark, W: geo.W, H: geo.H, d, raf: 0, held: false };
    intro.run = run;
    introChartSetup();
    introChartFrame();
    run.raf = requestAnimationFrame(introLoop);
    Promise.all(anims.map((a) => a.finished)).then(() => { if (intro.run === run) endIntro("complete"); }).catch(() => {});
  }
  function introLoop() {
    const run = intro.run;
    if (!run) return;
    run.raf = 0;
    introChartFrame();
    if (!run.held) run.raf = requestAnimationFrame(introLoop);
  }
  // The chart as the intro holds it, on whatever render() last drew: the hairlines take one clip, the rest is attributes.
  function introChartSetup() {
    const svg = svgHost.querySelector("svg");
    if (!svg || !geo) return;
    if (!$("#intro-hair")) {
      const cp = document.createElementNS(SVGNS, "clipPath"), r = document.createElementNS(SVGNS, "rect");
      cp.setAttribute("id", "intro-hair");
      r.setAttribute("id", "intro-hair-r");
      r.setAttribute("x", "0"); r.setAttribute("y", "0"); r.setAttribute("width", "0"); r.setAttribute("height", String(geo.H));
      cp.append(r);
      svg.querySelector("defs").append(cp);
    }
    svg.querySelectorAll('rect[fill="url(#hair)"]').forEach((r) => r.setAttribute("clip-path", "url(#intro-hair)"));
    const tag = $("#peak-tag");
    if (tag) { const s = tag.getAttribute("style") || ""; intro.tagStyle = s.endsWith(INTRO_HIDE) ? s.slice(0, -INTRO_HIDE.length) : s; }
  }
  const introProgress = (a) => { const p = a.effect.getComputedTiming().progress; return p == null ? 0 : p; };
  function introChartFrame(pl, pm) {
    if (!geo) return;
    if (pl == null) { const run = intro.run; pl = run ? introProgress(run.line) : 0; pm = run ? introProgress(run.mark) : 0; }
    const { X } = geo, landed = pl >= 1;
    const m = pl * M.last; // the minute the line has reached, in minutes since open
    // Today's line, part by part: each part is drawn up to that minute along its own path (a dash as long as the path
    // is to that minute), so the drawn front is a round-capped tip, and the missing span between the parts is never drawn.
    M.segments.forEach((sg, i) => {
      const path = $(`#ln-${i}`);
      if (!path) return;
      if (landed || m >= sg[sg.length - 1]) { path.removeAttribute("stroke-dasharray"); path.removeAttribute("visibility"); return; }
      if (m <= sg[0]) { path.setAttribute("visibility", "hidden"); path.removeAttribute("stroke-dasharray"); return; }
      const t = table(path), l = lengthOfU(t, uAtX(t, X(m)));
      path.removeAttribute("visibility");
      path.setAttribute("stroke-dasharray", `${f(l)} ${f(t.total + 16)}`);
    });
    // The fine vertical lines under it are uncovered up to the same minute.
    const hr = $("#intro-hair-r");
    if (hr) { const a = X(-8), b = X(landed ? DAY + 8 : m), l = Math.min(a, b); hr.setAttribute("x", f(l)); hr.setAttribute("width", f(Math.max(a, b) - l)); }
    // The end point: while live it swells out of the line's tip (the tip's own size, 0.34, to 1); a stale point appears.
    const about = (c, s) => { const x = Number(c.getAttribute("cx")), y = Number(c.getAttribute("cy")); return `translate(${f(x)} ${f(y)}) scale(${s.toFixed(4)}) translate(${f(-x)} ${f(-y)})`; };
    const show = (c, s) => {
      if (!c) return;
      if (!landed) { c.setAttribute("visibility", "hidden"); c.removeAttribute("transform"); return; }
      c.removeAttribute("visibility");
      if (s == null || pm >= 1) c.removeAttribute("transform"); else c.setAttribute("transform", about(c, s));
    };
    const endScale = STATE === "delayed" ? null : 0.34 + 0.66 * pm;
    show($("#end-halo"), endScale);
    show($("#end-dot"), endScale);
    // The peak: its ring swells into place from the same small size; its dotted drop and its label appear with it.
    show($("#pk-dot"), 0.34 + 0.66 * pm);
    show($("#pk-drop"), null);
    const tag = $("#peak-tag");
    if (tag && intro.tagStyle != null) {
      const s = tag.getAttribute("style");
      if (!landed && s === intro.tagStyle) tag.setAttribute("style", intro.tagStyle + INTRO_HIDE);
      else if (landed && s === intro.tagStyle + INTRO_HIDE) tag.setAttribute("style", intro.tagStyle);
    }
  }
  function introChartClear() {
    const svg = svgHost.querySelector("svg");
    if (svg) {
      svg.querySelectorAll('rect[clip-path="url(#intro-hair)"]').forEach((r) => r.removeAttribute("clip-path"));
      const cp = svg.querySelector("#intro-hair");
      if (cp) cp.remove();
      svg.querySelectorAll('path[id^="ln-"]').forEach((p) => { p.removeAttribute("stroke-dasharray"); p.removeAttribute("visibility"); });
      ["#end-halo", "#end-dot", "#pk-dot", "#pk-drop"].forEach((s) => { const n = $(s); if (n) { n.removeAttribute("visibility"); n.removeAttribute("transform"); } });
    }
    const tag = $("#peak-tag");
    if (tag && intro.tagStyle != null && tag.getAttribute("style") === intro.tagStyle + INTRO_HIDE) tag.setAttribute("style", intro.tagStyle);
    intro.tagStyle = null;
  }
  // After every render(): a waiting intro keeps its start state; a playing one keeps its frame on a redraw of the same
  // size, and settles at once on a real resize.
  function introAfterRender(W, H) {
    if (intro.state === "pending") { introChartSetup(); introChartFrame(0, 0); return; }
    if (intro.state !== "running" || !intro.run) return;
    if (W !== intro.run.W || H !== intro.run.H) { endIntro("resize"); return; }
    introChartSetup();
    introChartFrame();
  }
  // Settles the intro at once: the still page, exactly. Safe to call at any time; it does nothing when no intro is on.
  function endIntro(reason) {
    if (intro.state !== "pending" && intro.state !== "running") return;
    const run = intro.run;
    intro.run = null;
    if (run) { cancelAnimationFrame(run.raf); run.anims.forEach((a) => a.cancel()); }
    intro.nums.forEach(({ el, html }) => { el.innerHTML = html; });
    intro.nums = [];
    introChartClear();
    intro.state = "done";
    intro.yieldedBy = reason;
    intro.endedAt = performance.now();
    startPulse();
  }
  // Any action by the owner settles the intro before the action is handled (capture phase), so nothing ever meets a
  // half-drawn page and nothing is blocked.
  ["pointerdown", "keydown", "wheel"].forEach((type) => addEventListener(type, (e) => endIntro(e.type), { capture: true, passive: true }));
  // Leaving the tab mid-intro settles it too, so coming back never finds a half-drawn page. (A tab opened in the
  // background keeps its intro waiting until it is first shown; see introWait.)
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") endIntro("hidden"); });
  // Tuner: replay the intro on the page as it is now (the current reading). Not while motion is off.
  function replayIntro() {
    if (!motionOn()) return false;
    settleAll();
    clearSelection();
    stopPulse();
    introPark();
    render(); // the chart's start state
    introStart();
    return true;
  }
  // Held frames: every part of the intro held at `ms` after its start (it can be held again at another time).
  function seekIntro(ms) {
    const run = intro.run;
    if (!run) return false;
    run.held = true;
    cancelAnimationFrame(run.raf);
    run.raf = 0;
    run.anims.forEach((a) => { a.pause(); a.currentTime = ms; });
    introChartFrame();
    return true;
  }
  function releaseIntro() {
    const run = intro.run;
    if (!run || !run.held) return false;
    run.held = false;
    run.anims.forEach((a) => { if (a.currentTime >= a.effect.getComputedTiming().endTime) a.finish(); else a.play(); });
    if (intro.run === run) run.raf = requestAnimationFrame(introLoop);
    return true;
  }

  /* ---- switching motion on and off at runtime (tuner) */
  function settleAll() {
    endIntro("settle");
    finishLive(); stopFollow(); finishRail();
    [...rolls.keys()].forEach(finishRoll);
    [...feet.keys()].forEach(finishFoot);
  }
  function setOptions(next, persist = true) {
    const was = motionOn();
    if (Number.isFinite(next.hoverSpeed)) { rebaseFollow(); opts.hoverSpeed = clampSpeed(next.hoverSpeed); }
    // A new intro speed applies to the next intro (a replay, or the next first open), never to one that is playing.
    if (Number.isFinite(next.introSpeed)) opts.introSpeed = clampIntroSpeed(next.introSpeed);
    if (typeof next.motion === "boolean") opts.motion = next.motion;
    if (persist && !TUNER_OFF) { try { localStorage.setItem(MOTION_STORE, JSON.stringify(opts)); } catch (e) { /* storage unavailable */ } }
    const on = motionOn();
    root.dataset.motion = on ? "on" : "off";
    if (was && !on) {
      settleAll();
      stopPulse();
      played.slice().forEach((a) => { try { a.finish(); } catch (e) { a.cancel(); } });
    }
    if (on && !was) startPulse();
  }
  mqReduce.addEventListener("change", () => setOptions({}, false));

  /* ------------------------------------------------------------ lifecycle
   * Rendered at once. Without an intro nothing is hidden while the fonts load. On a tab's first open (the intro), the
   * four answers wait out of sight and the line is not drawn until the fonts are in, and then the intro plays; if the
   * fonts are not in within 200 ms of the first paint there is no intro and the still page shows at once. Every other
   * part of the page is complete at first paint. The chart is measured again when the fonts arrive
   * (the header's text sets the chart's height) and whenever its box changes. */
  new ResizeObserver(() => render()).observe(plot);
  introDecide();
  render();
  if (intro.state !== "pending") startPulse(); // with an intro, the pulse starts when the end point has landed
  window.__eclipse = {
    ready: false,
    lang: LANG,
    state: STATE,
    get figures() {
      const { last, nowM, peak, peakM, entries, observed, busiest, compare, avg, usualLatest, usualEntries, crestM } = M;
      return { now: occ[last], shownNow: shownNow(), last, nowM, peak, peakM, entries, observed, busiest, compare, avgNow: Math.round(avg[last] * 10) / 10, usualLatest: usualLatest == null ? null : Math.round(usualLatest * 10) / 10, usualEntries, crestM };
    },
    get checks() { return M.checks; },
    minuteClient(m) {
      const pr = plot.getBoundingClientRect();
      const k = m > M.last ? "after" : m >= GAP0 && m <= GAP1 ? "miss" : "read";
      const y = k === "read" ? geo.Y(occ[m]) : (geo.yt + geo.yb) / 2;
      return { x: pr.left + geo.X(m), y: pr.top + y };
    },
    // The chart's stops and the marker, for the capture checks.
    chart: {
      get stops() {
        const pr = plot.getBoundingClientRect();
        return stops.map((st) => ({ key: st.key, kind: st.kind, m: st.m, time: st.kind === "gap" ? plainRange(fmtTime(GAP0), fmtTime(GAP1)) : fmtTime(Math.round(st.m)), value: st.value, track: st.track, clientX: pr.left + st.x }));
      },
      select: (key) => { const st = stopBy(key); if (!st) return null; selectStop(st); return hit.getAttribute("aria-valuetext"); },
      clear: () => clearSelection(),
      get selected() { return sel ? sel.key : null; },
      // The tooltip's width as last measured from the chart's current stops (px), the widest numbered tooltip's own
      // width and stop, how many numbered stops were measured, how many measurements have run on this page, and how long
      // the last one took (ms).
      get tipWidth() { return { ...tipMeasured }; },
      // The marker's form: always "b", the hollow ring (form A was removed in Round 7 step 2).
      get marker() { return "b"; },
      // The smooth follow (Round 7 step 2), for the capture checks.
      get followActive() { return Boolean(follow.route || follow.tip); },
      get follow() { return { marker: Boolean(follow.route), tooltip: Boolean(follow.tip), held: follow.hold != null, route: follow.route ? Math.round(follow.route.R * 100) / 100 : null }; },
      seekFollow,
      releaseFollow,
      // The follow's response to one step from rest, as fractions of the distance at the given times (ms).
      response: (times = [33, 66, 100, 133, 200, 266, 400]) => times.map((t) => ({ ms: t, fraction: Math.round((1 - spring(1, 0, t).e) * 1000) / 1000 })),
      get timings() { const [a, b] = taus(); return { tau1: a, tau2: b, hoverSpeed: opts.hoverSpeed, jumpMinutes: FOLLOW.jumpMinutes, settlePx: FOLLOW.settlePx, fold: FOLD, magnet: MAGNET }; },
    },
    motion: {
      get on() { return motionOn(); },
      get options() { return { ...opts }; },
      defaults: { ...MOTION_DEFAULTS },
      get urlOff() { return URL_OFF; },
      get systemReduced() { return mqReduce.matches; },
      get liveActive() { return Boolean(liveRun.clock); },
      get rolling() { return rolls.size + feet.size; },
      get latest() { return fmtTime(M.last); },
      get atStart() { return M.last === START.last && M.nowM === START.nowM && crowdShown == null; },
      get canCrowd() { return STATE !== "delayed"; },
      timings: T,
      easings: EASE,
      // Every motion, as built above (for the capture log and the README).
      spec: () => [
        { motion: "Load", animates: "nothing but the first-open intro: the surfaces, lights, labels, grid, axes and usual line are complete at first paint (no stagger, no rise, no light entrance)", note: "a reload or a return in the same tab has no intro; only the live pulse runs at rest, and only while live" },
        { motion: "First-open intro (Round 7 step 3): the answers", animates: "transform translateY of each answer's numeric expression (Inside now, Today's peak, Entries, Busiest time), from below into the digits' ink box, clipped to it: the digit roll entering the final value; while delayed the stale Inside now number is still", delayMs: 0, durationMs: T.roll / (opts.introSpeed || 1), easing: EASE.roll, note: "only on the first open in a tab; no count-up and no intermediate value; the DOM text is final from the first paint; nothing is announced" },
        { motion: "First-open intro: the line", animates: "stroke-dasharray of today's line parts, drawn by minutes since open from opening to the latest reading (right to left in Arabic), and one clip uncovering the fine vertical lines to the same minute", delayMs: 0, durationMs: INTRO_T.line / (opts.introSpeed || 1), easing: EASE.introLine, note: "the missing span stays a gap throughout; the grid, axes and usual line are still from the first paint" },
        { motion: "First-open intro: the end point and the peak", animates: "SVG transform scale: the live end point and halo from the line tip's size (0.34) to 1, the peak ring from the same 0.34 to 1; the stale end point, the peak's drop and its label appear at once when the line arrives", delayMs: INTRO_T.line / (opts.introSpeed || 1), durationMs: INTRO_T.mark / (opts.introSpeed || 1), easing: EASE.roll, note: `about ${Math.round(introTotal())} ms in all; it settles at once on any action, a new reading or a resize; the pulse starts when it ends` },
        { motion: "Lights", animates: "nothing, ever", note: "no entrance, no pointer-follow, no crowd-dependent light" },
        { motion: "Numbers: digit roll", animates: "transform translateY of the changed digits only, by the height of the digits' ink box (the new digit from below when rising, from above when falling; the old one leaves the other way), clipped to that ink box; the slot's width eases from the old digit's width to the new one's (Readex Pro has no tabular figures)", delayMs: 0, durationMs: T.roll, easing: EASE.roll, note: "no opacity on any glyph; words swap at once; plain markup restored at the end" },
        { motion: "Crowd level: bars", animates: "transform scaleY (from the bottom) of a red fill in each bar that changes", delayMs: `0, +${T.barStagger} per further bar (lower bars first when rising, upper first when falling)`, durationMs: T.bar, easing: EASE.bar, note: "the level word swaps at once" },
        { motion: "Chart: the marker follows its stop (Round 7 step 2)", animates: "SVG geometry each frame along the drawn path (the ring B and its lit hairline, moved in place); the tooltip's left/top ride with it", delayMs: 0, durationMs: "about 400 ms to settle, whatever the distance", easing: `two first-order lags in series, tau ${FOLLOW.tau1} ms and ${FOLLOW.tau2} ms, divided by the hover speed (${opts.hoverSpeed})`, note: `no restart: a new target keeps the position and velocity; at once (the marker) across the missing span, into the future, onto or off the gap stop, or more than ${FOLLOW.jumpMinutes} minutes away, while the tooltip eases into its new place; the tooltip's text changes at once and it appears and leaves at once` },
        { motion: "Live: new reading, tail morph and extension", animates: "SVG path d of the last ~15-30 minutes only, end point cx/cy, the tail's fine lines, the now clip", delayMs: 0, durationMs: T.morph, easing: EASE.morph },
        { motion: "Live: end-point pulse (live state only; none while delayed)", animates: "a 1px ring: opacity 0.4 to 0, transform scale 0.34 to 1 (9.5px to 28px)", delayMs: 1000, durationMs: T.pulse, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)", note: "infinite; the ring is visible for the first 48% of each 5 s cycle" },
        { motion: "Rail opens", animates: "end cap translateX (0 to 156px, inline-end), middle scaleX (0 to 1) from the inline-start, darker surface layers and shadow opacity 0 to 1 (no text); each name uncovered by a clip-path that follows the end cap", delayMs: 0, durationMs: T.railOpen, easing: EASE.rail, note: "the width switches at once and is never animated; names never fade" },
        { motion: "Rail closes", animates: "the same in reverse", delayMs: 0, durationMs: T.railClose, easing: EASE.railClose },
      ],
      settle: () => settleAll(),
      set: (o) => setOptions(o),
      step: stepReading,
      seekLive,
      reset: resetReadings,
      crowd: crowdStep,
    },
    // The first-open intro (Round 7 step 3), for the tuner and the capture checks.
    intro: {
      get state() { return intro.state; },   // "off" (no intro on this open), "pending", "running" or "done"
      get firstOpen() { return intro.firstOpen; },
      get played() { return intro.played; },  // started on this page (on the first open, or by a replay)
      get count() { return intro.count; },
      get reason() { return intro.reason; },
      get yieldedBy() { return intro.yieldedBy; }, // "complete", or what settled it early
      get fontWaitMs() { return intro.fontWaitMs; },
      get startedAt() { return intro.startedAt; },
      get endedAt() { return intro.endedAt; },
      get timings() { const k = opts.introSpeed || 1; return { speed: k, rollMs: T.roll / k, lineMs: INTRO_T.line / k, markMs: INTRO_T.mark / k, totalMs: introTotal(k), fontCapMs: INTRO_T.fontCap, easings: { roll: EASE.roll, line: EASE.introLine, mark: EASE.roll } }; },
      totalMs: (k) => introTotal(k),
      replay: replayIntro,
      seek: seekIntro,
      release: releaseIntro,
      settle: () => endIntro("script"),
    },
  };
  if (intro.state === "pending") introWait().catch(() => endIntro("error"));
  // The other script's subset of Readex Pro is fetched up front too (the rail's language item is written in it), so
  // opening the rail never swaps a font mid-way; this changes no pixel.
  if (document.fonts && document.fonts.load) ["400", "500"].forEach((w) => document.fonts.load(`${w} 16px "Readex Pro"`, RTL ? "English FITWAY" : "العربية").catch(() => {}));
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { render(); window.__eclipse.ready = true; });
})();
