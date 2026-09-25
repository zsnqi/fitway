/* Backlight — FITWAY Owner Daily concept. Synthetic data only; not production.
 * Query params: lang=ar|en (default ar), state=live|delayed|nohistory|closed|loading (default live), motion=off.
 * Every figure on the page is derived from one seeded minute simulation below. Western digits only:
 * numbers are printed with String(), never Intl or toLocaleString. */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const params = new URLSearchParams(location.search);
  const LANG = params.get("lang") === "en" ? "en" : "ar";
  const STATES = ["live", "delayed", "nohistory", "closed", "loading"];
  const STATE = STATES.includes(params.get("state")) ? params.get("state") : "live";
  const MOTION_OFF = params.get("motion") === "off";
  const RTL = LANG === "ar";
  const root = document.documentElement;
  root.lang = LANG;
  root.dir = RTL ? "rtl" : "ltr";
  if (MOTION_OFF) root.classList.add("no-motion");

  /* ---------------------------------------------------------------- copy */
  const arMin = (n) => {
    if (n === 1) return "دقيقة واحدة";
    if (n === 2) return "دقيقتان";
    const r = n % 100;
    return r >= 3 && r <= 10 ? `${n} دقائق` : `${n} دقيقة`;
  };
  const COPY = {
    en: {
      skip: "Skip to content",
      concept: "Exploration concept · synthetic data",
      railLabel: "Sections",
      brand: "FITWAY, section names",
      nav: { daily: "Daily", reports: "Reports", access: "Access", activity: "Activity Log", operations: "Operations", settings: "Settings", monitoring: "Monitoring", lang: "العربية", signout: "Sign out" },
      langAria: "Switch to Arabic",
      langGlyph: "ع",
      docTitle: "Today · FITWAY (concept)",
      title: "Today",
      date: "Wednesday 23 September 2026",
      hours: "Open",
      live: "Live",
      delayed: "Delayed",
      lastReading: "Last reading",
      closed: "Closed",
      opens: "Opens",
      loading: "Loading today's readings",
      glance: "Today at a glance",
      nowTitle: "Inside now",
      approx: "approx.",
      capacity: "Capacity",
      staleNote: (n) => `No new reading for ${n} min`,
      peakTitle: "Today's peak",
      entriesTitle: "Entries so far",
      entriesNote: "Estimated walk-ins, not unique members",
      busiestTitle: "Busiest time",
      busiestMeta: "Last 7 days",
      busiestNote: (n) => `About ${n} inside on average`,
      notOpen: "Not open yet",
      opensAt: (t) => `Opens at ${t}`,
      noReadings: "No readings yet",
      chartTitle: "Today's crowd",
      busier: "Busier than a usual Wednesday",
      quieter: "Quieter than a usual Wednesday",
      same: "About the same as a usual Wednesday",
      compareSub: (n, u) => `Now ${n}, usually about ${u} at this time`,
      compareSubStale: (t, n, u) => `At ${t}: ${n}, usually about ${u}`,
      noHistory: "Not enough history to compare yet",
      noHistorySub: "The usual line needs 4 past Wednesdays. There is 1 so far.",
      closedCompare: (t) => `The gym opens at ${t}`,
      legendToday: "Today",
      legendUsual: "Usual Wednesday",
      legendUsualNote: "avg. of the last 4, not a forecast",
      legendMissing: "No reading",
      legendUsualNone: "Usual line: not enough history",
      details: "View details",
      stillAhead: "Still ahead",
      nowLabel: "Now",
      noReading: "No reading",
      lastTag: "Last reading",
      peakTag: "Peak",
      capacityTag: "Capacity 80",
      levels: ["Quiet", "Moderate", "Busy", "Packed"],
      chartAria: "Today's crowd, by time",
      keys: "Use the left and right arrow keys to move between readings. Home goes to opening time and End to the latest reading.",
      ro: { usual: "Usual Wednesday", pastUsual: "Past Wednesdays, about", ahead: "Still ahead", nobody: "Open, nobody inside", noReading: "No reading", peak: "Peak", latest: "Latest", inside: "inside" },
      detailsTitle: "Details",
      coverageTitle: "Data coverage",
      coverageLead: "What the chart has for today.",
      cov: { read: "With a reading", zero: "Open, nobody inside", miss: "No reading", wait: "Waiting for data", ahead: "Still ahead", line: "How the line is drawn", usual: "Usual Wednesday" },
      covReadVal: (a, b) => `${a} of ${b} minutes so far`,
      covMissNote: "Entries in this time are not counted.",
      covLineVal: (t) => `It passes through the reading every 15 minutes, plus ${t}, the morning, midday and day highs, both edges of the gap, and the latest reading.`,
      covUsualVal: "Average of the last 4 Wednesdays (26 Aug, 2, 9 and 16 Sep), per 15 minutes. Synthetic.",
      covUsualNone: "Only 1 past Wednesday is recorded (16 Sep). The line appears once there are 4.",
      minutesTitle: "Minute by minute",
      minutesLead: "Every minute from opening to the latest reading.",
      minutesAria: "Today's readings, minute by minute",
      cols: ["Time", "Inside", "Crowd level", "Note"],
      notes: { miss: "No reading", zero: "Open, nobody inside", peak: "Today's peak", latest: "Latest reading" },
      heatTitle: "Last 7 days, by hour",
      heatLead: "Average number inside during each hour.",
      heatLegend: { part: "Some minutes without a reading", ahead: "Still ahead" },
      heatAhead: "Still ahead",
      heatPart: "some minutes without a reading",
      days: { 16: "Wed 16", 17: "Thu 17", 18: "Fri 18", 19: "Sat 19", 20: "Sun 20", 21: "Mon 21", 22: "Tue 22", 23: "Wed 23" },
      today: "today",
    },
    ar: {
      skip: "انتقل إلى المحتوى",
      concept: "مفهوم استكشافي · بيانات افتراضية",
      railLabel: "الأقسام",
      brand: "FITWAY، أسماء الأقسام",
      nav: { daily: "اليومي", reports: "التقارير", access: "الوصول", activity: "سجل النشاط", operations: "التشغيل", settings: "الإعدادات", monitoring: "المراقبة", lang: "English", signout: "تسجيل الخروج" },
      langAria: "التبديل إلى اللغة الإنجليزية",
      langGlyph: "EN",
      docTitle: "اليوم · FITWAY (مفهوم)",
      title: "اليوم",
      date: "الأربعاء 23 سبتمبر 2026",
      hours: "ساعات العمل",
      live: "مباشر",
      delayed: "متأخر",
      lastReading: "آخر قراءة",
      closed: "مغلقة",
      opens: "تفتح",
      loading: "جارٍ تحميل قراءات اليوم",
      glance: "اليوم باختصار",
      nowTitle: "داخل الصالة الآن",
      approx: "تقريبًا",
      capacity: "السعة",
      staleNote: (n) => `لا قراءة جديدة منذ ${arMin(n)}`,
      peakTitle: "ذروة اليوم",
      entriesTitle: "الدخول حتى الآن",
      entriesNote: "تقدير لمرات الدخول، لا لعدد الأعضاء",
      busiestTitle: "أكثر الأوقات ازدحامًا",
      busiestMeta: "آخر 7 أيام",
      busiestNote: (n) => `نحو ${n} في المتوسط`,
      notOpen: "لم تفتح بعد",
      opensAt: (t) => `تفتح الساعة ${t}`,
      noReadings: "لا قراءات بعد",
      chartTitle: "ازدحام اليوم",
      busier: "أكثر ازدحامًا من الأربعاء المعتاد",
      quieter: "أهدأ من الأربعاء المعتاد",
      same: "قريب من الأربعاء المعتاد",
      compareSub: (n, u) => `الآن ${n}، والمعتاد نحو ${u} في مثل هذا الوقت`,
      compareSubStale: (t, n, u) => `الساعة ${t}: ${n}، والمعتاد نحو ${u}`,
      noHistory: "لا يكفي السجل للمقارنة بعد",
      noHistorySub: "يحتاج خط المعتاد إلى 4 أيام أربعاء سابقة، والمسجّل حتى الآن يوم واحد.",
      closedCompare: (t) => `تفتح الصالة الساعة ${t}`,
      legendToday: "اليوم",
      legendUsual: "الأربعاء المعتاد",
      legendUsualNote: "متوسط آخر 4 أسابيع، وليس توقعًا",
      legendMissing: "لا قراءة",
      legendUsualNone: "خط المعتاد: السجل غير كافٍ",
      details: "عرض التفاصيل",
      stillAhead: "بقية اليوم",
      nowLabel: "الآن",
      noReading: "لا قراءة",
      lastTag: "آخر قراءة",
      peakTag: "الذروة",
      capacityTag: "السعة 80",
      levels: ["هادئ", "متوسط", "مزدحم", "شديد الازدحام"],
      chartAria: "ازدحام اليوم حسب الوقت",
      keys: "استخدم مفتاحي السهم الأيمن والأيسر للتنقل بين القراءات. ينقلك Home إلى وقت الفتح، وEnd إلى آخر قراءة.",
      ro: { usual: "الأربعاء المعتاد", pastUsual: "أيام الأربعاء السابقة، نحو", ahead: "لم يحن بعد", nobody: "مفتوحة وخالية", noReading: "لا قراءة", peak: "الذروة", latest: "الأحدث", inside: "في الداخل" },
      detailsTitle: "التفاصيل",
      coverageTitle: "تغطية البيانات",
      coverageLead: "ما يتوفر للمخطط اليوم.",
      cov: { read: "فيها قراءة", zero: "مفتوحة وخالية", miss: "لا قراءة", wait: "بانتظار البيانات", ahead: "بقية اليوم", line: "كيف يُرسم الخط", usual: "الأربعاء المعتاد" },
      covReadVal: (a, b) => `${a} من ${b} دقيقة حتى الآن`,
      covMissNote: "لا يُحتسب الدخول خلال هذه المدة.",
      covLineVal: (t) => `يمر بالقراءة كل 15 دقيقة، وبقراءة ${t}، وبأعلى قراءة صباحًا وظهرًا وفي اليوم كله، وبطرفَي الانقطاع، وبآخر قراءة.`,
      covUsualVal: "متوسط آخر 4 أيام أربعاء (26 أغسطس، و2 و9 و16 سبتمبر)، لكل 15 دقيقة. بيانات افتراضية.",
      covUsualNone: "المسجّل يوم أربعاء واحد فقط (16 سبتمبر). يظهر الخط عندما تكتمل 4 أيام.",
      minutesTitle: "دقيقة بدقيقة",
      minutesLead: "كل دقيقة من الفتح حتى آخر قراءة.",
      minutesAria: "قراءات اليوم دقيقة بدقيقة",
      cols: ["الوقت", "داخل الصالة", "مستوى الازدحام", "ملاحظة"],
      notes: { miss: "لا قراءة", zero: "مفتوحة وخالية", peak: "ذروة اليوم", latest: "آخر قراءة" },
      heatTitle: "آخر 7 أيام حسب الساعة",
      heatLead: "متوسط عدد الموجودين في كل ساعة.",
      heatLegend: { part: "بعض الدقائق بلا قراءة", ahead: "بقية اليوم" },
      heatAhead: "بقية اليوم",
      heatPart: "بعض الدقائق بلا قراءة",
      days: { 16: "الأربعاء 16", 17: "الخميس 17", 18: "الجمعة 18", 19: "السبت 19", 20: "الأحد 20", 21: "الاثنين 21", 22: "الثلاثاء 22", 23: "الأربعاء 23" },
      today: "اليوم",
    },
  };
  const L = COPY[LANG];
  const minText = (n) => (LANG === "ar" ? arMin(n) : `${n} min`);

  /* ----------------------------------------------------------- time format */
  const DAY = 1140; // 6:00 AM to 1:00 AM next day, gym time (Riyadh)
  const CAP = 80;   // owner-private capacity
  function clock(m) {
    const abs = (((360 + m) % 1440) + 1440) % 1440;
    const h = Math.floor(abs / 60);
    return { h12: ((h + 11) % 12) + 1, mm: abs % 60, pm: h >= 12 };
  }
  const suffix = (pm) => (LANG === "ar" ? (pm ? "م" : "ص") : pm ? "PM" : "AM");
  const fmtTime = (m) => { const c = clock(m); return `${c.h12}:${String(c.mm).padStart(2, "0")} ${suffix(c.pm)}`; };
  const fmtHour = (m) => { const c = clock(m); return `${c.h12} ${suffix(c.pm)}`; };
  const bdi = (s) => `<bdi>${s}</bdi>`;
  const tb = (m) => bdi(fmtTime(m));
  // Ranges always use a plain ASCII hyphen; an en dash would reverse the range in Arabic.
  const range = (a, b) => `${bdi(a)} - ${bdi(b)}`;
  const timeRange = (a, b) => range(fmtTime(a), fmtTime(b));
  function hourRange(a, b) {
    const A = clock(a), B = clock(b);
    if (A.pm === B.pm) return bdi(`${A.h12}-${B.h12} ${suffix(A.pm)}`);
    return range(fmtHour(a), fmtHour(b));
  }
  const plainRange = (a, b) => `${a} - ${b}`;

  /* ------------------------------------------------------------ simulation */
  // Whole-person count process, one step per minute: entries ~ Poisson(lambda), exits ~ Binomial(occupancy, 1/64).
  // lambda follows a target day shape. Seed 15983 was chosen offline because it lands the brief's shape.
  const SEED = 15983;
  const GAP0 = 494, GAP1 = 511;   // no reading 2:14 PM - 2:31 PM
  const ZERO_END = 9;             // open, nobody inside 6:00 AM - 6:09 AM
  const NOW = 822;                // 7:42 PM
  const STALE_LAST = 809;         // delayed state: last reading 7:29 PM

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
  const TODAY_P = { am: 22, amAt: 82, mid: 8, pm: 53, pmAt: 752 };
  const today = simulateDay(SEED, TODAY_P);
  // The last 4 Wednesdays (16, 9, 2 Sep and 26 Aug). Complete days.
  const PAST_WED = [
    { d: 16, f: 0.78, a: 0.95, at: 762 },
    { d: 9, f: 0.74, a: 1.0, at: 747 },
    { d: 2, f: 0.8, a: 0.98, at: 757 },
    { d: 26, f: 0.76, a: 1.03, at: 752 },
  ].map((w, i) => simulateDay(SEED + 1000 * (i + 1), { am: 22 * w.a, amAt: 82, mid: 8, pm: 53 * w.f, pmAt: w.at }));
  // Other recent days for the weekly heatmap (Thu 17 to Tue 22).
  const RECENT = {
    17: simulateDay(SEED + 11, { am: 22 * 0.9, amAt: 84, mid: 8, pm: 53 * 0.78, pmAt: 740 }),
    18: simulateDay(SEED + 12, { am: 22 * 0.35, amAt: 100, mid: 8 * 0.6, pm: 53 * 0.85, pmAt: 800 }),
    19: simulateDay(SEED + 13, { am: 22 * 0.8, amAt: 90, mid: 8, pm: 53 * 0.9, pmAt: 760 }),
    20: simulateDay(SEED + 14, { am: 22 * 1.05, amAt: 80, mid: 8, pm: 53 * 1.02, pmAt: 750 }),
    21: simulateDay(SEED + 15, { am: 22 * 1.0, amAt: 82, mid: 8, pm: 53 * 1.05, pmAt: 755 }),
    22: simulateDay(SEED + 16, { am: 22 * 0.95, amAt: 82, mid: 8, pm: 53 * 0.95, pmAt: 748 }),
    16: PAST_WED[0],
  };

  /* --------------------------------------------------------- today's truth */
  const HAS_HISTORY = STATE !== "nohistory";
  const nowM = STATE === "closed" ? -20 : NOW;                 // closed: 5:40 AM, before opening
  const last = STATE === "delayed" ? STALE_LAST : STATE === "closed" || STATE === "loading" ? -1 : NOW;
  const occ = today.occ;
  const obs = (m) => m >= 0 && m <= last && (m < GAP0 || m > GAP1);
  const levelOf = (v) => (v <= 24 ? 0 : v <= 48 ? 1 : v <= 68 ? 2 : 3);

  let peak = -1, peakM = -1, entries = 0, observed = 0;
  for (let m = 0; m <= last; m++) {
    if (!obs(m)) continue;
    observed++;
    entries += today.ent[m];
    if (occ[m] > peak) { peak = occ[m]; peakM = m; }
  }
  const maxIn = (a, b) => { let v = -1, at = -1; for (let m = a; m <= Math.min(b, last); m++) if (obs(m) && occ[m] > v) { v = occ[m]; at = m; } return { v, at }; };

  // Plotted points: the reading every 15 minutes, plus the last zero minute, the morning and midday highs, the peak,
  // both edges of the gap, and the latest reading.
  const STEP = 15;
  const knotSet = new Set();
  for (let m = 0; m <= last; m += STEP) if (obs(m)) knotSet.add(m);
  // The morning and midday highs are plotted too, so the text equivalent and the line agree.
  const amHigh = maxIn(30, 200), mdHigh = maxIn(300, 480);
  [ZERO_END, amHigh.at, mdHigh.at, peakM, GAP0 - 1, GAP1 + 1, last].forEach((m) => { if (obs(m)) knotSet.add(m); });
  const knots = [...knotSet].sort((a, b) => a - b);
  const segments = [];
  knots.forEach((m, i) => {
    if (i === 0 || (knots[i - 1] < GAP0 && m > GAP1)) segments.push([]);
    segments[segments.length - 1].push(m);
  });
  // Points reachable by hover, keyboard and tap: every plotted reading, plus the minutes with no reading on the same grid (5-minute slots).
  const nav = knots.map((m) => ({ m, v: occ[m], kind: occ[m] === 0 ? "zero" : "read" }));
  for (let m = GAP0; m <= GAP1; m++) if (m % 5 === 0 && m <= last) nav.push({ m, kind: "miss" });
  nav.sort((a, b) => a.m - b.m);

  /* ------------------------------------------------ monotone interpolation */
  // Steffen / Fritsch-Carlson-style monotone cubic Hermite: passes through every point, no overshoot.
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
  const splines = segments.map((seg) => monotone(seg, seg.map((m) => occ[m])));

  // Usual Wednesday: average of the 4 past Wednesdays over each 15-minute slot.
  const usualKnots = [];
  for (let m = 0; m <= 1125; m += 15) usualKnots.push(m);
  usualKnots.push(DAY - 1);
  const usualVals = usualKnots.map((m) => {
    let sum = 0, n = 0;
    for (const d of PAST_WED) for (let w = Math.max(0, m - 7); w <= Math.min(DAY - 1, m + 7); w++) { sum += d.occ[w]; n++; }
    return sum / n;
  });
  const usual = monotone(usualKnots, usualVals);
  const usualAt = (m) => Math.round(usual.at(m));

  // Busier or quieter: the latest reading against the usual line at the same minute (what the chart shows at the now marker).
  // It needs a difference of at least 3 people and 10% to call it either way.
  let compare = null;
  if (HAS_HISTORY && last >= 0) {
    const diff = occ[last] - usual.at(last), rel = diff / Math.max(1, usual.at(last));
    compare = diff >= 3 && rel >= 0.1 ? "busier" : diff <= -3 && rel <= -0.1 ? "quieter" : "same";
  }

  // Self-checks for the capture log: drawn maximum equals the stated peak; no overshoot anywhere.
  const checks = (() => {
    let drawnMax = -Infinity, drawnMaxAt = -1, overshoot = 0;
    splines.forEach((sp) => {
      for (let i = 0; i < sp.xs.length - 1; i++) {
        const lo = Math.min(sp.ys[i], sp.ys[i + 1]) - 1e-9, hi = Math.max(sp.ys[i], sp.ys[i + 1]) + 1e-9;
        for (let k = 0; k <= 60; k++) {
          const x = sp.xs[i] + ((sp.xs[i + 1] - sp.xs[i]) * k) / 60, y = sp.at(x);
          if (y < lo || y > hi) overshoot++;
          if (y > drawnMax) { drawnMax = y; drawnMaxAt = x; }
        }
      }
    });
    return { peak, peakM, drawnMax: Math.round(drawnMax * 1000) / 1000, drawnMaxAt, overshoot, lastKnot: knots[knots.length - 1] ?? null, last, segments: segments.length };
  })();

  /* --------------------------------------------------------- week heatmap */
  const heatDays = STATE === "closed" ? [16, 17, 18, 19, 20, 21, 22] : [17, 18, 19, 20, 21, 22, 23];
  const heatRows = heatDays.map((d) => {
    const cells = [];
    for (let h = 0; h < 19; h++) {
      const a = h * 60, b = a + 59;
      if (d === 23) {
        if (a > last) { cells.push({ ahead: true }); continue; }
        let sum = 0, n = 0;
        for (let m = a; m <= Math.min(b, last); m++) if (obs(m)) { sum += occ[m]; n++; }
        cells.push({ v: n ? sum / n : null, part: n < 60 });
      } else {
        const day = RECENT[d];
        let sum = 0;
        for (let m = a; m <= b; m++) sum += day.occ[m];
        cells.push({ v: sum / 60, part: false });
      }
    }
    return { d, cells };
  });
  const busiest = (() => {
    const hourMean = [];
    for (let h = 0; h < 19; h++) {
      const vals = heatRows.map((r) => r.cells[h]).filter((c) => !c.ahead && c.v != null).map((c) => c.v);
      hourMean.push(vals.reduce((x, y) => x + y, 0) / vals.length);
    }
    let best = -1, bh = 0;
    for (let h = 0; h < 18; h++) { const v = (hourMean[h] + hourMean[h + 1]) / 2; if (v > best) { best = v; bh = h; } }
    return { from: bh * 60, to: bh * 60 + 120, avg: Math.round(best) };
  })();

  /* ---------------------------------------------------------------- shell */
  document.title = L.docTitle;
  document.querySelectorAll("[data-t]").forEach((el) => { const v = L[el.dataset.t]; if (typeof v === "string") el.textContent = v; });
  $("#rail").setAttribute("aria-label", L.railLabel);
  const brand = $("#brand");
  brand.setAttribute("aria-label", L.brand);
  document.querySelectorAll(".rail-item").forEach((a) => {
    const key = a.dataset.nav, name = L.nav[key];
    $(".rail-label", a).textContent = name;
    $(".flyout", a).textContent = name;
    a.setAttribute("aria-label", key === "lang" ? L.langAria : name);
    if (a.hasAttribute("data-inert")) a.addEventListener("click", (e) => e.preventDefault());
  });
  $(".glyph").textContent = L.langGlyph;
  {
    const p = new URLSearchParams(location.search);
    p.set("lang", LANG === "ar" ? "en" : "ar");
    $("#lang-link").setAttribute("href", `?${p.toString()}`);
    $("#lang-link .rail-label").setAttribute("lang", LANG === "ar" ? "en" : "ar");
    $("#lang-link .flyout").setAttribute("lang", LANG === "ar" ? "en" : "ar");
  }
  const app = $("#app");
  brand.addEventListener("click", () => {
    const open = app.dataset.rail !== "expanded";
    app.dataset.rail = open ? "expanded" : "collapsed";
    brand.setAttribute("aria-expanded", String(open));
  });

  $("#top-sub").innerHTML = `${L.date}<span class="sep" aria-hidden="true">·</span>${L.hours} ${timeRange(0, DAY)}`;

  const ICON = {
    clock: `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.2"/><path d="M12 7.6V12l3 2"/></svg>`,
    moon: `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M19.2 14.6A7.6 7.6 0 1 1 9.4 4.8a6.2 6.2 0 0 0 9.8 9.8z"/></svg>`,
    wait: `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.2" stroke-dasharray="3 3.4"/></svg>`,
    up: `<svg class="trend" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16.5l5.2-5.2 3.6 3.6L20 7.7"/><path d="M14.6 7.7H20v5.4"/></svg>`,
    down: `<svg class="trend" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7.5l5.2 5.2 3.6-3.6L20 16.3"/><path d="M14.6 16.3H20v-5.4"/></svg>`,
    same: `<svg class="flat" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9.5h14M5 14.5h14"/></svg>`,
    info: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.4"/><path d="M12 11v5.2M12 7.8v.2"/></svg>`,
  };

  const levelChip = (v) => {
    const li = levelOf(v);
    return `<span class="level"><span class="bars" aria-hidden="true">${[0, 1, 2, 3].map((i) => `<i class="${i <= li ? "on" : ""}"></i>`).join("")}</span>${L.levels[li]}</span>`;
  };

  // Status pill (page-level live indicator)
  const status = $("#status");
  status.dataset.state = STATE === "nohistory" ? "live" : STATE;
  if (STATE === "live" || STATE === "nohistory") status.innerHTML = `<span class="dot" aria-hidden="true"></span><span>${L.live}</span><span class="muted">· ${tb(last)}</span>`;
  else if (STATE === "delayed") status.innerHTML = `${ICON.clock}<span>${L.delayed}</span><span class="muted">· ${L.lastReading} ${tb(last)}</span>`;
  else if (STATE === "closed") status.innerHTML = `${ICON.moon}<span>${L.closed}</span><span class="muted">· ${L.opens} ${tb(0)}</span>`;
  else status.innerHTML = `${ICON.wait}<span>${L.loading}</span>`;

  /* ---------------------------------------------------------------- cards */
  const card = (head, value, foot, extra = "") => `${head}${value}${foot ? `<div class="stat-foot">${foot}</div>` : ""}${extra}`;
  const head = (label, meta) => `<div class="stat-head"><h3 class="stat-label">${label}</h3>${meta ? `<span class="stat-meta">${meta}</span>` : ""}</div>`;
  const numValue = (n, unit) => `<p class="stat-value"><span class="num">${n}</span>${unit ? `<span class="unit">${unit}</span>` : ""}</p>`;
  const wordValue = (w, quiet) => `<p class="stat-value"><span class="word${quiet ? " quiet" : ""}">${w}</span></p>`;
  const meter = (v) => {
    const ticks = [24, 48, 68].map((t) => `<i class="meter-tick" style="inset-inline-start:calc(${((t / CAP) * 100).toFixed(2)}% - 1px)"></i>`).join("");
    return `<div class="meter" aria-hidden="true"><div class="meter-track"><div class="meter-fill" style="width:${((v / CAP) * 100).toFixed(2)}%"></div>${ticks}</div></div><span class="stat-meta">${L.capacity} ${bdi("80")}</span>`;
  };
  const sk = (w, h) => `<span class="sk" style="width:${w};height:${h}px"></span>`;

  const cNow = $("#card-now"), cPeak = $("#card-peak"), cEnt = $("#card-entries"), cBus = $("#card-busiest");
  if (STATE === "loading") {
    [cNow, cPeak, cEnt, cBus].forEach((c, i) => {
      c.innerHTML = `${head([L.nowTitle, L.peakTitle, L.entriesTitle, L.busiestTitle][i])}${sk(i ? "46%" : "38%", i ? 40 : 56)}${sk("64%", 12)}`;
      c.setAttribute("aria-busy", "true");
    });
  } else if (STATE === "closed") {
    cNow.innerHTML = card(head(L.nowTitle), wordValue(L.closed), `<p class="stat-note">${L.opensAt(tb(0))}</p>`);
    cPeak.innerHTML = card(head(L.peakTitle), wordValue(L.noReadings, true), `<p class="stat-note">${L.opensAt(tb(0))}</p>`);
    cEnt.innerHTML = card(head(L.entriesTitle), wordValue(L.noReadings, true), `<p class="stat-note">${L.entriesNote}</p>`);
  } else {
    const v = occ[last];
    if (STATE === "delayed") {
      cNow.classList.add("is-stale");
      cNow.innerHTML = card(head(`${L.lastReading} ${tb(last)}`, `<span class="warn">${ICON.clock}${L.staleNote(nowM - last)}</span>`), numValue(v, L.approx), `${levelChip(v)}${meter(v)}`);
    } else {
      cNow.innerHTML = card(head(L.nowTitle, tb(last)), numValue(v, L.approx), `${levelChip(v)}${meter(v)}`);
    }
    cPeak.innerHTML = card(head(L.peakTitle, tb(peakM)), numValue(peak), levelChip(peak));
    cEnt.innerHTML = card(head(L.entriesTitle), numValue(entries), `<p class="stat-note">${L.entriesNote}</p>`);
  }
  if (STATE !== "loading") {
    cBus.innerHTML = card(head(L.busiestTitle, L.busiestMeta), wordValue(hourRange(busiest.from, busiest.to)), `<p class="stat-note">${L.busiestNote(bdi(busiest.avg))}</p>`);
  }

  /* ------------------------------------------------------ compare + legend */
  const cmp = $("#compare");
  if (STATE === "loading") cmp.innerHTML = sk("340px", 14);
  else if (STATE === "closed") { cmp.classList.add("neutral"); cmp.innerHTML = `<span class="cmp-main">${ICON.moon.replace('class="ico"', "")}<span>${L.closedCompare(tb(0))}</span></span>`; }
  else if (!HAS_HISTORY) { cmp.classList.add("neutral"); cmp.innerHTML = `<span class="cmp-main">${ICON.info}<span>${L.noHistory}</span></span><span class="sub">${L.noHistorySub}</span>`; }
  else {
    const ic = compare === "busier" ? ICON.up : compare === "quieter" ? ICON.down : ICON.same;
    const sub = STATE === "delayed" ? L.compareSubStale(tb(last), bdi(occ[last]), bdi(usualAt(last))) : L.compareSub(bdi(occ[last]), bdi(usualAt(last)));
    cmp.innerHTML = `<span class="cmp-main">${ic}<span>${L[compare]}</span></span><span class="sub">${sub}</span>`;
  }
  const legend = [];
  if (STATE !== "loading") {
    legend.push(`<li><span class="sw sw-today" aria-hidden="true"></span>${L.legendToday}</li>`);
    if (HAS_HISTORY) legend.push(`<li><span class="sw sw-usual" aria-hidden="true"></span>${L.legendUsual}<span class="note">(${L.legendUsualNote.replace("4", bdi("4"))})</span></li>`);
    else legend.push(`<li><span class="sw sw-none" aria-hidden="true"></span>${L.legendUsualNone}</li>`);
    if (last >= GAP0) legend.push(`<li><span class="sw sw-miss" aria-hidden="true"></span>${L.legendMissing}</li>`);
  }
  $("#legend").innerHTML = legend.join("");
  if (STATE === "loading") $("#details-btn").hidden = true;

  /* ---------------------------------------------------------------- chart */
  const plot = $("#plot"), svgHost = $("#plot-svg"), labels = $("#plot-labels"), readout = $("#readout"), hit = $("#plot-hit");
  const G = { padS: 46, padE: 112, padT: 46, padB: 30 };
  let geo = null;
  let sel = null; // index into nav, or { future: m }

  function render() {
    const W = Math.round(plot.clientWidth), H = Math.round(plot.clientHeight);
    if (!W || !H) return;
    const x0 = G.padS, x1 = W - G.padE, yt = G.padT, yb = H - G.padB;
    const X = (m) => x0 + (m / DAY) * (x1 - x0);
    const Y = (v) => yb - (v / CAP) * (yb - yt);
    const mx = (x) => (RTL ? W - x : x);
    geo = { W, H, x0, x1, yt, yb, X, Y, mx };
    const f = (n) => n.toFixed(2);
    const s = [];
    s.push(`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">`);
    s.push(`<defs>
      <linearGradient id="g-area" gradientUnits="userSpaceOnUse" x1="0" y1="${yt}" x2="0" y2="${yb}"><stop offset="0" stop-color="#f2283b" stop-opacity="0.2"/><stop offset="1" stop-color="#f2283b" stop-opacity="0"/></linearGradient>
      <linearGradient id="g-hair" gradientUnits="userSpaceOnUse" x1="0" y1="${yt}" x2="0" y2="${yb}"><stop offset="0" stop-color="#f2283b" stop-opacity="0.75"/><stop offset="0.55" stop-color="#f2283b" stop-opacity="0.3"/><stop offset="1" stop-color="#f2283b" stop-opacity="0.04"/></linearGradient>
      <pattern id="p-miss" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="1.1" height="5" fill="rgba(200,202,210,0.36)"/></pattern>
      <pattern id="p-wait" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="1.1" height="5" fill="rgba(227,162,26,0.5)"/></pattern>
      <pattern id="p-ahead" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="0.75" fill="rgba(255,255,255,0.13)"/></pattern>
      <clipPath id="c-past"><rect x="0" y="0" width="${f(X(Math.max(0, nowM)))}" height="${H}"/></clipPath>
      <clipPath id="c-future"><rect x="${f(X(Math.max(0, nowM)))}" y="0" width="${W}" height="${H}"/></clipPath>
    </defs>`);
    s.push(`<g${RTL ? ` transform="matrix(-1 0 0 1 ${W} 0)"` : ""}>`);

    // Still ahead: everything after now.
    const aheadFrom = X(Math.max(0, Math.min(DAY, nowM)));
    if (STATE !== "loading") {
      s.push(`<rect x="${f(aheadFrom)}" y="${yt}" width="${f(x1 - aheadFrom)}" height="${yb - yt}" fill="rgba(255,255,255,0.02)"/>`);
      s.push(`<rect x="${f(aheadFrom)}" y="${yt}" width="${f(x1 - aheadFrom)}" height="${yb - yt}" fill="url(#p-ahead)"/>`);
    }
    // Waiting for data (delayed only): between the last reading and now.
    if (STATE === "delayed") {
      const a = X(last + 0.5), b = X(nowM);
      s.push(`<rect x="${f(a)}" y="${yt}" width="${f(b - a)}" height="${yb - yt}" fill="rgba(227,162,26,0.06)"/><rect x="${f(a)}" y="${yt}" width="${f(b - a)}" height="${yb - yt}" fill="url(#p-wait)"/>`);
    }
    // No reading: the missing span.
    if (last >= GAP0) {
      const a = X(GAP0 - 0.5), b = X(GAP1 + 0.5);
      s.push(`<rect x="${f(a)}" y="${yt}" width="${f(b - a)}" height="${yb - yt}" fill="rgba(200,202,210,0.05)"/><rect x="${f(a)}" y="${yt}" width="${f(b - a)}" height="${yb - yt}" fill="url(#p-miss)"/>`);
      s.push(`<path d="M${f(a)},${yt}V${yb}M${f(b)},${yt}V${yb}" stroke="rgba(200,202,210,0.35)" stroke-width="1" stroke-dasharray="2 3"/>`);
    }
    // Crowd-level guides and capacity.
    [24, 48, 68].forEach((v) => s.push(`<path d="M${x0},${f(Y(v))}H${x1}" stroke="rgba(255,255,255,0.085)" stroke-width="1" stroke-dasharray="2 5" shape-rendering="crispEdges"/>`));
    s.push(`<path d="M${x0},${f(Y(CAP))}H${x1}" stroke="rgba(255,255,255,0.07)" stroke-width="1" shape-rendering="crispEdges"/>`);
    s.push(`<path d="M${x0},${f(Y(0))}H${x1}" stroke="rgba(255,255,255,0.18)" stroke-width="1" shape-rendering="crispEdges"/>`);
    for (let h = 0; h <= 19; h++) s.push(`<path d="M${f(X(h * 60))},${yb}v${h % 2 ? 3 : 5}" stroke="rgba(255,255,255,${h % 2 ? 0.12 : 0.22})" stroke-width="1" shape-rendering="crispEdges"/>`);
    // Crowd-level ruler at the inline end.
    const rx = x1 + 16;
    [[0, 24, 0.16], [24, 48, 0.3], [48, 68, 0.5], [68, 80, 0.78]].forEach(([a, b, o]) => s.push(`<rect x="${rx}" y="${f(Y(b) + 2)}" width="2" height="${f(Y(a) - Y(b) - 4)}" rx="1" fill="rgba(229,25,53,${o})"/>`));

    if (STATE !== "loading") {
      // Usual Wednesday (dashed): past average, drawn dimmer after now so it never reads as today's forecast.
      if (HAS_HISTORY) {
        const d = usual.path(X, Y);
        s.push(`<path d="${d}" fill="none" stroke="rgba(244,242,241,0.6)" stroke-width="1.5" stroke-dasharray="4 5" stroke-linecap="round" clip-path="url(#c-past)"/>`);
        s.push(`<path d="${d}" fill="none" stroke="rgba(244,242,241,0.3)" stroke-width="1.3" stroke-dasharray="3 6" stroke-linecap="round" clip-path="url(#c-future)"/>`);
      }
      // Today: area, fine vertical lines at every 10-minute reading, then the line.
      splines.forEach((sp) => {
        const a = sp.xs[0], b = sp.xs[sp.xs.length - 1];
        s.push(`<path d="${sp.path(X, Y)}L${f(X(b))},${f(Y(0))}L${f(X(a))},${f(Y(0))}Z" fill="url(#g-area)"/>`);
      });
      knots.forEach((m) => {
        if (occ[m] <= 0) return;
        s.push(`<path d="M${f(X(m))},${f(Y(0))}V${f(Y(occ[m]) + 2)}" stroke="url(#g-hair)" stroke-width="1"/>`);
      });
      splines.forEach((sp) => s.push(`<path d="${sp.path(X, Y)}" fill="none" stroke="#f2283b" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`));
      // Ends of the line at the gap, so the break reads as deliberate.
      if (last > GAP1) [GAP0 - 1, GAP1 + 1].forEach((m) => s.push(`<circle cx="${f(X(m))}" cy="${f(Y(occ[m]))}" r="2.6" fill="#f2283b"/>`));
      // Peak marker.
      if (peakM >= 0) s.push(`<circle class="peak-dot" cx="${f(X(peakM))}" cy="${f(Y(peak))}" r="3.4" fill="#f4f2f1"/>`);
      // Now line and the latest reading.
      if (nowM >= 0) {
        const nx = X(nowM);
        s.push(STATE === "delayed"
          ? `<path d="M${f(nx)},${yt - 6}V${yb}" stroke="rgba(227,162,26,0.75)" stroke-width="1.2" stroke-dasharray="3 3"/>`
          : `<path d="M${f(nx)},${yt - 6}V${yb}" stroke="rgba(244,242,241,0.42)" stroke-width="1"/>`);
      }
      if (last >= 0) {
        const ex = X(last), ey = Y(occ[last]);
        s.push(STATE === "delayed"
          ? `<circle cx="${f(ex)}" cy="${f(ey)}" r="5" fill="#101013" stroke="#928c8e" stroke-width="2"/>`
          : `<circle cx="${f(ex)}" cy="${f(ey)}" r="12" fill="rgba(242,40,59,0.16)"/><circle cx="${f(ex)}" cy="${f(ey)}" r="5.2" fill="#f2283b" stroke="#0d0d10" stroke-width="2"/>`);
      }
    }
    s.push(`<g id="sel"></g></g></svg>`);
    svgHost.innerHTML = s.join("");

    // Labels (HTML, so bidi and fonts behave), positioned on the mirrored geometry.
    const lab = [];
    const place = (cls, html, xL, y, anchor = "mid", vy = "-50%") => {
      const x = mx(xL);
      const tx = anchor === "mid" ? "-50%" : (anchor === "before") !== RTL ? "-100%" : "0";
      lab.push(`<span class="${cls}" style="left:${f(x)}px;top:${f(y)}px;transform:translate(${tx},${vy})">${html}</span>`);
    };
    [0, 24, 48, 68].forEach((v) => place("ax-y", bdi(String(v)), x0 - 12, Y(v), "before"));
    [[0, 24], [24, 48], [48, 68], [68, 80]].forEach(([a, b], i) => place("lvl", L.levels[i], rx + 12, (Y(a) + Y(b)) / 2, "after"));
    place("cap", L.capacityTag.replace("80", bdi("80")), x0 + 2, Y(CAP) - 11, "after");
    for (let h = 0; h <= 18; h += 2) place("ax-x", bdi(fmtHour(h * 60)), X(h * 60), yb + 17);
    place("ax-x", bdi(fmtHour(DAY)), X(DAY), yb + 17);
    if (STATE !== "loading") {
      const aheadW = x1 - aheadFrom;
      if (aheadW > 110) place("ahead", STATE === "closed" ? L.opensAt(tb(0)) : L.stillAhead, aheadFrom + aheadW / 2, yt + 20);
      if (last >= GAP0) place("tag miss", L.noReading, X((GAP0 + GAP1) / 2), yt + 20);
      if (nowM >= 0) {
        place(STATE === "delayed" ? "tag delayed" : "tag", STATE === "delayed"
          ? `${ICON.clock}${L.nowLabel} ${tb(nowM)}<span class="tag-sub">· ${L.lastTag} ${tb(last)}</span>`
          : `<span class="dot" aria-hidden="true"></span>${L.nowLabel} ${tb(nowM)}`, X(nowM), yt - 22);
      }
      if (peakM >= 0) place("peak-tag", `${L.peakTag} <b>${bdi(peak)}</b> · ${tb(peakM)}`, X(peakM), Y(peak) - 18);
    } else {
      lab.push(`<div class="loading-note"><span>${ICON.wait.replace('class="ico"', 'class="ico" width="16" height="16"')}${L.loading}</span></div>`);
    }
    labels.innerHTML = lab.join("");
    drawSelection();
  }

  /* ------------------------------------------------------ chart inspection */
  const valueText = (p) => {
    if (p.kind === "miss") return `${fmtTime(p.m)}, ${L.ro.noReading} (${plainRange(fmtTime(GAP0), fmtTime(GAP1))})`;
    const lvl = L.levels[levelOf(p.v)];
    let t = LANG === "ar" ? `${fmtTime(p.m)}، ${p.v} ${L.ro.inside}، ${lvl}` : `${fmtTime(p.m)}, ${p.v} ${L.ro.inside}, ${lvl}`;
    if (p.kind === "zero") t += LANG === "ar" ? `، ${L.ro.nobody}` : `, ${L.ro.nobody}`;
    if (p.m === peakM) t += LANG === "ar" ? `، ${L.ro.peak}` : `, ${L.ro.peak}`;
    if (HAS_HISTORY) t += LANG === "ar" ? `. ${L.ro.usual} ${usualAt(p.m)}.` : `. ${L.ro.usual} ${usualAt(p.m)}.`;
    return t;
  };

  function drawSelection() {
    const g = $("#sel");
    if (!geo || !g) return;
    const { X, Y, yt, yb, mx } = geo;
    if (sel == null) { g.innerHTML = ""; readout.hidden = true; labels.querySelectorAll(".is-covered").forEach((e) => e.classList.remove("is-covered")); return; }
    const p = typeof sel === "number" ? nav[sel] : { m: sel.future, kind: "ahead" };
    const x = X(p.m);
    let out = "";
    if (p.kind === "read" || p.kind === "zero") {
      const y = Y(p.v);
      out += `<path d="M${x.toFixed(2)},${yt}V${yb}" stroke="rgba(244,242,241,0.5)" stroke-width="1"/>`;
      out += `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="8" fill="#0e0e11" stroke="#f4f2f1" stroke-width="2"/><circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="3.2" fill="#f2283b"/>`;
    } else {
      out += `<path d="M${x.toFixed(2)},${yt}V${yb}" stroke="rgba(244,242,241,0.45)" stroke-width="1" stroke-dasharray="3 4"/>`;
    }
    g.innerHTML = out;

    // Readout
    let html = "";
    if (p.kind === "miss") {
      html = `<div class="ro-time">${tb(p.m)}</div><div class="ro-main"><span class="ro-word">${L.ro.noReading}</span></div><div class="ro-usual">${timeRange(GAP0, GAP1)}</div>`;
    } else if (p.kind === "ahead") {
      html = `<div class="ro-time">${tb(p.m)}</div><div class="ro-main"><span class="ro-word">${L.ro.ahead}</span></div>` +
        (HAS_HISTORY ? `<div class="ro-usual">${L.ro.pastUsual} ${bdi(usualAt(p.m))}</div>` : "");
    } else {
      const flag = p.m === peakM ? `<span class="ro-flag">${L.ro.peak}</span>` : p.m === last ? `<span class="ro-flag">${L.ro.latest}</span>` : "";
      html = `<div class="ro-time">${tb(p.m)}${flag}</div><div class="ro-main"><span class="ro-num tnum">${bdi(p.v)}</span>${levelChip(p.v)}</div>` +
        (p.kind === "zero" ? `<div class="ro-usual">${L.ro.nobody}</div>` : HAS_HISTORY ? `<div class="ro-usual">${L.ro.usual} ${bdi(usualAt(p.m))}</div>` : "");
    }
    readout.innerHTML = html;
    readout.hidden = false;
    const rw = readout.offsetWidth, rh = readout.offsetHeight;
    const px = mx(x), py = p.kind === "read" || p.kind === "zero" ? Y(p.v) : yt + 60;
    let left = px - rw / 2, top = py - rh - 18;
    if (top < 0) top = Math.min(py + 18, geo.H - rh);
    left = Math.max(4, Math.min(geo.W - rw - 4, left));
    readout.style.left = `${left}px`;
    readout.style.top = `${top}px`;
    // Hide static labels the readout would cover.
    const r = { l: left - 6, r: left + rw + 6, t: top - 6, b: top + rh + 6 };
    const pr = plot.getBoundingClientRect();
    labels.querySelectorAll(".tag, .peak-tag, .ahead, .cap").forEach((el) => {
      const b = el.getBoundingClientRect();
      const hitR = !(b.right - pr.left < r.l || b.left - pr.left > r.r || b.bottom - pr.top < r.t || b.top - pr.top > r.b);
      el.classList.toggle("is-covered", hitR);
    });
    const peakDot = svgHost.querySelector(".peak-dot");
    if (peakDot) peakDot.style.opacity = p.m === peakM ? "0" : "";
    if (typeof sel === "number") {
      hit.setAttribute("aria-valuenow", String(sel));
      hit.setAttribute("aria-valuetext", valueText(p));
    }
  }

  // Slider semantics for keyboard inspection.
  hit.setAttribute("aria-label", L.chartAria);
  hit.setAttribute("aria-valuemin", "0");
  hit.setAttribute("aria-valuemax", String(Math.max(0, nav.length - 1)));
  if (!nav.length) { hit.removeAttribute("role"); hit.removeAttribute("tabindex"); hit.setAttribute("aria-hidden", "true"); }
  else {
    hit.setAttribute("aria-valuenow", String(nav.length - 1));
    hit.setAttribute("aria-valuetext", valueText(nav[nav.length - 1]));
  }
  const nearest = (m) => {
    let bi = 0, bd = Infinity;
    nav.forEach((p, i) => { const d = Math.abs(p.m - m); if (d < bd) { bd = d; bi = i; } });
    return bi;
  };
  const minuteAt = (clientX) => {
    const pr = plot.getBoundingClientRect();
    let xL = clientX - pr.left;
    if (RTL) xL = geo.W - xL;
    return ((xL - geo.x0) / (geo.x1 - geo.x0)) * DAY;
  };
  const pick = (clientX) => {
    if (!geo || !nav.length && nowM < 0) return;
    const m = minuteAt(clientX);
    if (m < -10 || m > DAY + 10) { sel = null; }
    else if (m > nowM + 2 || !nav.length) sel = { future: Math.max(nowM + 1, Math.min(DAY - 1, Math.round(m / 15) * 15)) };
    else sel = nearest(m);
    drawSelection();
  };
  let pinned = false;
  hit.addEventListener("pointermove", (e) => { if (e.pointerType !== "touch" && !pinned) pick(e.clientX); });
  hit.addEventListener("pointerleave", (e) => { if (e.pointerType !== "touch" && !pinned && document.activeElement !== hit) { sel = null; drawSelection(); } });
  hit.addEventListener("pointerdown", (e) => { if (e.pointerType === "touch" || e.pointerType === "pen") { pinned = true; pick(e.clientX); } });
  hit.addEventListener("focus", () => { if (sel == null && nav.length) { sel = nav.length - 1; drawSelection(); } });
  hit.addEventListener("blur", () => { pinned = false; sel = null; drawSelection(); });
  hit.addEventListener("keydown", (e) => {
    if (!nav.length) return;
    let i = typeof sel === "number" ? sel : nav.length - 1;
    const later = RTL ? "ArrowLeft" : "ArrowRight", earlier = RTL ? "ArrowRight" : "ArrowLeft";
    if (e.key === later || e.key === "ArrowUp") i = Math.min(nav.length - 1, i + 1);
    else if (e.key === earlier || e.key === "ArrowDown") i = Math.max(0, i - 1);
    else if (e.key === "Home") i = 0;
    else if (e.key === "End") i = nav.length - 1;
    else if (e.key === "PageUp") i = Math.min(nav.length - 1, i + 4);
    else if (e.key === "PageDown") i = Math.max(0, i - 4);
    else if (e.key === "Escape") { sel = null; drawSelection(); return; }
    else return;
    e.preventDefault();
    sel = i;
    drawSelection();
  });

  // Text equivalent of the chart.
  (() => {
    let t = "";
    if (STATE === "loading") t = L.loading;
    else if (STATE === "closed") t = LANG === "ar"
      ? `الصالة مغلقة الآن، وتفتح الساعة ${fmtTime(0)}. لا قراءات لليوم بعد.${HAS_HISTORY ? " يظهر خط متقطع لمتوسط آخر 4 أيام أربعاء، وهو ليس توقعًا." : ""}`
      : `The gym is closed and opens at ${fmtTime(0)}. No readings yet today.${HAS_HISTORY ? " A dashed line shows the average of the last 4 Wednesdays; it is not a forecast." : ""}`;
    else {
      const am = amHigh, md = mdHigh;
      t = LANG === "ar"
        ? `مخطط خطي لعدد الموجودين تقريبًا اليوم، من الفتح الساعة ${fmtTime(0)} حتى آخر قراءة الساعة ${fmtTime(last)}. الصالة مفتوحة وخالية من ${plainRange(fmtTime(0), fmtTime(ZERO_END))}. أعلى قراءة صباحًا ${am.v} الساعة ${fmtTime(am.at)}، وظهرًا ${md.v} الساعة ${fmtTime(md.at)}. لا قراءة من ${plainRange(fmtTime(GAP0), fmtTime(GAP1))}. ذروة اليوم ${peak} الساعة ${fmtTime(peakM)} (${L.levels[levelOf(peak)]}). آخر قراءة ${occ[last]} الساعة ${fmtTime(last)} (${L.levels[levelOf(occ[last])]}).${STATE === "delayed" ? ` البيانات متأخرة، ولم تصل قراءة جديدة منذ ${arMin(nowM - last)}.` : ""}${HAS_HISTORY ? " يظهر خط متقطع لمتوسط آخر 4 أيام أربعاء، وهو ليس توقعًا." : " لا يكفي السجل لعرض خط المعتاد."} بقية اليوم من ${plainRange(fmtTime(nowM + 1), fmtTime(DAY))} لم تأتِ بعد. جميع الدقائق في عرض التفاصيل.`
        : `Line chart of the approximate number of people inside today, from opening at ${fmtTime(0)} to the latest reading at ${fmtTime(last)}. Open with nobody inside ${plainRange(fmtTime(0), fmtTime(ZERO_END))}. Morning high ${am.v} at ${fmtTime(am.at)}; midday high ${md.v} at ${fmtTime(md.at)}. No reading ${plainRange(fmtTime(GAP0), fmtTime(GAP1))}. Today's peak ${peak} at ${fmtTime(peakM)} (${L.levels[levelOf(peak)]}). Latest ${occ[last]} at ${fmtTime(last)} (${L.levels[levelOf(occ[last])]}).${STATE === "delayed" ? ` Data is delayed: no new reading for ${nowM - last} minutes.` : ""}${HAS_HISTORY ? " A dashed line shows the average of the last 4 Wednesdays; it is not a forecast." : " Not enough history for the usual line."} The rest of the day, ${plainRange(fmtTime(nowM + 1), fmtTime(DAY))}, is still ahead. Every minute is listed under View details.`;
    }
    $("#chart-summary").textContent = t;
  })();

  /* -------------------------------------------------------------- details */
  const detailsBtn = $("#details-btn"), details = $("#details");
  let detailsBuilt = false;
  function buildDetails() {
    if (detailsBuilt) return;
    detailsBuilt = true;
    const pct = (m) => `${((m / DAY) * 100).toFixed(3)}%`;
    const seg = (cls, a, b) => `<span class="${cls}" style="inset-inline-start:${pct(a)};width:${pct(b - a)}"></span>`;
    // Coverage
    const strip = [];
    if (last >= 0) {
      strip.push(seg("s-zero", 0, ZERO_END + 1));
      if (last >= GAP0) {
        strip.push(seg("s-read", ZERO_END + 1, GAP0), seg("s-miss", GAP0, GAP1 + 1));
        if (last > GAP1) strip.push(seg("s-read", GAP1 + 1, last + 1));
      } else strip.push(seg("s-read", ZERO_END + 1, last + 1));
      if (STATE === "delayed") strip.push(seg("s-wait", last + 1, nowM + 1));
    }
    strip.push(seg("s-ahead", Math.max(0, nowM + 1), DAY));
    const axis = [0, 360, 720, DAY].map((m, i, a) => `<span class="${i === 0 ? "first" : i === a.length - 1 ? "last" : ""}" style="inset-inline-start:${pct(m)}">${bdi(fmtHour(m))}</span>`).join("");
    const facts = [];
    const fact = (k, dt, dd) => facts.push(`<div><dt><span class="k ${k}" aria-hidden="true"></span>${dt}</dt><dd>${dd}</dd></div>`);
    if (last >= 0) {
      fact("k-read", L.cov.read, L.covReadVal(bdi(observed), bdi(last + 1)));
      fact("k-zero", L.cov.zero, `${timeRange(0, ZERO_END)} <span class="muted">(${bdi(minText(ZERO_END + 1))})</span>`);
      if (last >= GAP0) fact("k-miss", L.cov.miss, `${timeRange(GAP0, GAP1)} (${bdi(minText(GAP1 - GAP0 + 1))})<small>${L.covMissNote}</small>`);
      if (STATE === "delayed") fact("k-wait", L.cov.wait, `${timeRange(last + 1, nowM)} (${bdi(minText(nowM - last))})`);
    }
    fact("k-ahead", L.cov.ahead, timeRange(Math.max(0, nowM + 1), DAY));
    fact("k-none", L.cov.line, L.covLineVal(tb(ZERO_END)));
    fact("k-none", L.cov.usual, HAS_HISTORY ? L.covUsualVal : L.covUsualNone);
    $("#coverage").innerHTML = `<h3>${L.coverageTitle}</h3><p class="lead">${L.coverageLead}</p>
      <div class="strip" aria-hidden="true">${strip.join("")}</div><div class="strip-axis" aria-hidden="true">${axis}</div>
      <dl class="facts">${facts.join("")}</dl>`;

    // Minute table
    const rows = [];
    for (let m = 0; m <= last; m++) {
      const miss = !obs(m);
      const note = miss ? L.notes.miss : m <= ZERO_END ? L.notes.zero : m === peakM ? L.notes.peak : m === last ? L.notes.latest : "";
      rows.push(`<tr class="${miss ? "miss" : m === peakM ? "peak" : ""}"><td>${tb(m)}</td><td class="n">${miss ? '<span aria-hidden="true">—</span>' : bdi(occ[m])}</td><td>${miss ? "" : levelChip(occ[m])}</td><td>${note}</td></tr>`);
    }
    $("#minutes").innerHTML = `<h3 id="minutes-title">${L.minutesTitle}</h3><p class="lead">${L.minutesLead}</p>
      <div class="scroller" tabindex="0" role="region" aria-labelledby="minutes-title">
        <table class="minutes-table"><caption class="sr-only">${L.minutesAria}</caption>
        <thead><tr>${L.cols.map((c) => `<th scope="col">${c}</th>`).join("")}</tr></thead>
        <tbody>${rows.length ? rows.join("") : `<tr><td colspan="4">${L.noReadings}</td></tr>`}</tbody></table>
      </div>`;

    // Heatmap
    const alpha = (v) => 0.07 + 0.88 * Math.pow(Math.min(1, v / 68), 1.1);
    const cell = (c) => {
      if (c.ahead) return `<td class="ahead"><span class="sr-only">${L.heatAhead}</span></td>`;
      if (c.v == null) return `<td class="ahead"><span class="sr-only">${L.noReading}</span></td>`;
      const v = Math.round(c.v);
      return `<td class="${c.part ? "part" : ""}" style="background:rgba(229,25,53,${alpha(c.v).toFixed(3)})">${bdi(v)}${c.part ? `<span class="sr-only"> (${L.heatPart})</span>` : ""}</td>`;
    };
    const hoursHead = Array.from({ length: 19 }, (_, h) => `<th scope="col">${h % 2 ? `<span class="sr-only">${bdi(fmtHour(h * 60))}</span>` : bdi(fmtHour(h * 60))}</th>`).join("");
    const body = heatRows.map((r) => `<tr><th scope="row" class="${r.d === 23 ? "today" : ""}">${L.days[r.d].replace(/\d+/, (n) => bdi(n))}${r.d === 23 ? ` · ${L.today}` : ""}</th>${r.cells.map(cell).join("")}</tr>`).join("");
    const ramp = [6, 20, 36, 56, 74].map((v) => `<i style="background:rgba(229,25,53,${alpha(v).toFixed(3)})"></i>`).join("");
    $("#heat").innerHTML = `<h3 id="heat-title">${L.heatTitle}</h3><p class="lead">${L.heatLead}</p>
      <div class="heat-wrap"><table class="heat" aria-labelledby="heat-title"><thead><tr><td class="corner"></td>${hoursHead}</tr></thead><tbody>${body}</tbody></table></div>
      <div class="heat-legend"><span class="ramp">${L.levels[0]}${ramp}${L.levels[3]}</span>
      <span class="item"><span class="swatch-part" aria-hidden="true"></span>${L.heatLegend.part}</span>
      <span class="item"><span class="swatch-ahead" aria-hidden="true"></span>${L.heatLegend.ahead}</span></div>`;
  }
  detailsBtn.addEventListener("click", () => {
    const open = details.hidden;
    if (open) buildDetails();
    details.hidden = !open;
    detailsBtn.setAttribute("aria-expanded", String(open));
    if (open) details.scrollIntoView({ behavior: MOTION_OFF || matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  });

  /* ------------------------------------------------------------ lifecycle */
  new ResizeObserver(() => render()).observe(plot);
  render();

  window.__backlight = {
    ready: false,
    lang: LANG,
    state: STATE,
    figures: { now: last >= 0 ? occ[last] : null, last, nowM, peak, peakM, entries, observed, busiest, compare, usualNow: last >= 0 ? usualAt(last) : null },
    checks,
    navLength: nav.length,
    peakIndex: nav.findIndex((p) => p.m === peakM),
    latestIndex: nav.length - 1,
    pointClient(i) {
      const p = nav[i], pr = plot.getBoundingClientRect();
      return { x: pr.left + geo.mx(geo.X(p.m)), y: pr.top + geo.Y(p.v ?? 0) };
    },
    minuteClient(m) {
      const pr = plot.getBoundingClientRect();
      return { x: pr.left + geo.mx(geo.X(m)), y: pr.top + (geo.yt + geo.yb) / 2 };
    },
  };
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { render(); window.__backlight.ready = true; });
})();
