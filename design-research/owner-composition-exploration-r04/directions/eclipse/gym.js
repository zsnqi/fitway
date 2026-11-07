/* Eclipse: the one gym every page describes. Concept only, synthetic data.
 * Today, Reports, Activity, Access, Settings and the public page read their shared figures from here and keep no copy:
 * the capacity and level limits, the hours (now and as Settings' history had them), the moment, the week's rhythm, the
 * settings changes, the camera outages, the seeded minute simulation behind every reading, and the busiest hour of a span
 * of days (Today's and Reports' Last 7 days name it from here). A capacity or limits the
 * owner saved in this browser (demo-store.js) are in force here; the hours and every reading stay the gym's.
 * A classic script, so a page works from file:// too. Minutes count from 6:00 AM of the business day, as on Today.
 * Numbers stay numbers here; each page prints them in its own language. */
window.EclipseGym = (() => {
  "use strict";
  const toDn = (iso) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 864e5;
  const wdOf = (dn) => new Date(dn * 864e5).getUTCDay();

  /* ---------------------------------------------------------- capacity and levels */
  // As the gym's history has them: Settings' first version and the export's past rows keep these.
  const RECORDED = { capacity: 120, limits: [25, 50, 75] };        // limits: percent of capacity
  // In force: what the owner last saved, else the recorded ones. A count never changes; only the level it reads as.
  const SAVED = window.EclipseDemo ? window.EclipseDemo.settings() : null;
  const CAPACITY = SAVED ? SAVED.capacity : RECORDED.capacity;
  const LIMITS = SAVED ? [SAVED.thresholds.quietMaxPercent, SAVED.thresholds.moderateMaxPercent, SAVED.thresholds.busyMaxPercent] : RECORDED.limits;
  /* A level holds every whole count whose percent of capacity is at or under its limit, so its last count is the largest
   * n with (n / capacity) × 100 <= limit, computed in the same floating point bandFor uses
   * (packages/api/src/occupancy/bands.ts): 25% of 120 is up to 30 people; 24% of 120 up to 28. */
  const lastCount = (cap, pct) => {
    let n = Math.floor((pct * cap) / 100);
    while (((n + 1) / cap) * 100 <= pct) n++;
    while (n > 0 && (n / cap) * 100 > pct) n--;
    return n;
  };
  const PEOPLE = LIMITS.map((p) => lastCount(CAPACITY, p));        // 30, 60, 90 at the recorded ones
  // A level holds every count at or under its limit; Packed is every count above Busy.
  const levelOf = (v) => (v <= PEOPLE[0] ? 0 : v <= PEOPLE[1] ? 1 : v <= PEOPLE[2] ? 2 : 3);
  const LEVELS = ["quiet", "moderate", "busy", "packed"];
  // The level a count read as under the recorded capacity and limits: what a past row of the export carries.
  const RECORDED_PEOPLE = RECORDED.limits.map((p) => lastCount(RECORDED.capacity, p));
  const recordedLevelOf = (v) => (v <= RECORDED_PEOPLE[0] ? 0 : v <= RECORDED_PEOPLE[1] ? 1 : v <= RECORDED_PEOPLE[2] ? 2 : 3);

  /* ---------------------------------------------------------- the moment */
  const NOW = {
    date: "2026-09-23", dn: toDn("2026-09-23"), weekday: "wed",
    hour: 19, min: 42,
    clock: 19 * 60 + 42, // minutes since midnight
    minute: 822,         // minutes since 6:00 AM
    count: 70,
    delayedBy: 13,       // Delayed's last reading, 7:29 PM
  };

  /* ---------------------------------------------------------- the week's rhythm
   * The usual number inside for each open hour. Hours run from the opening hour; an hour past 23 is after midnight
   * (24 is the 12 AM hour, 25 the 1 AM hour). `close` is the hour the gym shuts: 25 is 1:00 AM. */
  const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const WEEK = {
    sun: { open: 6, close: 25, usual: [14, 21, 23, 17, 13, 19, 31, 44, 54, 60, 62, 64, 67, 72, 76, 80, 74, 61, 39] },
    mon: { open: 6, close: 25, usual: [18, 30, 34, 26, 17, 14, 19, 27, 36, 46, 57, 66, 69, 64, 56, 49, 44, 37, 26] },
    tue: { open: 6, close: 25, usual: [11, 19, 23, 20, 14, 16, 21, 30, 41, 51, 61, 65, 68, 70, 67, 63, 60, 47, 31] },
    wed: { open: 6, close: 25, usual: [12, 15, 19, 27, 38, 44, 40, 31, 28, 34, 43, 52, 60, 66, 71, 68, 58, 49, 33] },
    thu: { open: 6, close: 26, usual: [9, 18, 22, 20, 17, 21, 26, 33, 41, 46, 49, 56, 62, 64, 68, 71, 75, 66, 44, 22] },
    fri: { open: 14, close: 25, usual: [19, 26, 30, 34, 37, 41, 46, 44, 39, 31, 24] },
    sat: { open: 8, close: 25, usual: [11, 13, 16, 23, 36, 49, 56, 52, 48, 47, 51, 57, 63, 66, 62, 60, 41] },
  };
  // Saturday's 6 AM and 7 AM hours, which the gym still opened until Settings' change of 19 September.
  const SAT_EARLY = [8, 9];

  /* ---------------------------------------------------------- Settings' history
   * Each saved version after the first: when an owner saved it (gym-local), who, and the reason as typed. Settings says
   * what each one changed; Activity lists them; the export stamps each reading with the version in force. Capacity and
   * the level limits have stood since version 1. */
  const R = (ar, en) => ({ ar, en });
  const CHANGES = [
    { ver: 2, date: "2025-12-28", time: "16:20:05", by: "o1", reason: R("ساعات العمل الشتوية", "Winter opening hours") },
    { ver: 3, date: "2026-02-15", time: "22:40:18", by: "o2", reason: R("ساعات رمضان", "Ramadan hours") },
    // As typed: Noura's Arabic, in both languages.
    { ver: 4, date: "2026-03-22", time: "13:05:51", by: "o2", reason: { raw: "رجعنا لساعات العمل المعتادة بعد العيد", lang: "ar" } },
    { ver: 5, date: "2026-08-16", time: "11:20:12", by: "o1", reason: R("التصفير بعد الإغلاق بخمس دقائق", "Reset five minutes after closing") },
    { ver: 6, date: "2026-09-04", time: "15:15:26", by: "o1", reason: null },
    { ver: 7, date: "2026-09-16", time: "10:05:59", by: "o2", reason: R("ساعات الجمعة الجديدة: من 2 م", "New Friday hours: from 2 PM") },
    // After midnight: Saturday 19 September, 12:22 AM.
    { ver: 8, date: "2026-09-19", time: "00:22:10", by: "o2", reason: R("ساعات نهاية الأسبوع", "Weekend hours") },
    { ver: 9, date: "2026-09-23", time: "11:32:17", by: "o1", reason: R("الإغلاق يوم الخميس الساعة 2 ص", "Thursday closing moved to 2 AM") },
  ];
  const versionStart = CHANGES.map((c) => {
    const [h, m] = c.time.split(":").map(Number);
    return { ver: c.ver, at: toDn(c.date) * 1440 + h * 60 + m };
  });
  // The settings version in force at minute m (since 6:00 AM) of business day dn.
  function versionAt(dn, m) {
    const at = dn * 1440 + 360 + m;
    let ver = 1;
    for (const v of versionStart) if (at >= v.at) ver = v.ver;
    return ver;
  }

  /* ---------------------------------------------------------- the hours of a day
   * The hours as Settings' history had them on that day: Friday from 4 PM before the change of 16 September, Saturday
   * from 6 AM before the change of 19 September, and Thursday to 1 AM before the change of 23 September, so a reading
   * never sits in a closed hour. */
  const FRI_FROM_2PM = toDn("2026-09-16"), SAT_FROM_8AM = toDn("2026-09-19"), THU_TO_2AM = toDn("2026-09-24");
  function hoursOn(dn) {
    const day = WEEKDAYS[wdOf(dn)], D = WEEK[day];
    let { open, close, usual } = D;
    if (day === "fri" && dn < FRI_FROM_2PM) { open = 16; usual = usual.slice(2); }
    if (day === "sat" && dn < SAT_FROM_8AM) { open = 6; usual = SAT_EARLY.concat(usual); }
    if (day === "thu" && dn < THU_TO_2AM) { close = 25; usual = usual.slice(0, -1); }
    return { day, open, close, usual, openM: (open - 6) * 60, closeM: (close - 6) * 60 };
  }

  /* ---------------------------------------------------------- outages
   * Open minutes with no reading, minutes since 6:00 AM, inclusive. Today's own gap is Today's (2:14 PM to 2:31 PM). */
  const OUTAGES = { [toDn("2026-09-17")]: [[240, 479]], [toDn("2026-08-31")]: [[252, 280]] };

  /* ---------------------------------------------------------- the simulation
   * A whole-person count process, one step a minute: entries ~ Poisson, exits ~ Binomial(occupancy, about 1/64). Its
   * target comes from the week's rhythm: a line through the hours' middles, so an hour's mean is the table's figure,
   * with the opening's first quiet minutes and the rush out before closing inside that mean. Each day then keeps its
   * own weather: a seasonal rise and a busier last week, its own morning and evening strength, a shift of a few
   * minutes, and a class or two that fills or empties the floor for half an hour. */
  const FIRST_DAY = toDn("2026-08-02"), BUSIER_FROM = toDn("2026-09-16");
  const QUIET = 10;              // open, nobody inside yet
  const CLOSING = 25;            // the rush out before closing, in minutes
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const ss = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
  const edges = (m, H) => ss((m - H.openM - (QUIET - 1)) / 22) * (0.08 + 0.92 * ss((H.closeM - m) / CLOSING));
  // A line through the hours' middles, flat beyond the first and the last.
  function lineAt(knots, H, m) {
    const u = (m - H.openM) / 60 - 0.5, i = Math.floor(u);
    if (i < 0) return knots[0];
    if (i >= knots.length - 1) return knots[knots.length - 1];
    return knots[i] + (knots[i + 1] - knots[i]) * (u - i);
  }
  // The line's heights, raised where the edges cut an hour, so each hour's mean under the edges is the table's figure.
  const knotCache = new Map();
  function knotsFor(H) {
    const key = `${H.day}-${H.open}-${H.close}`;
    if (knotCache.has(key)) return knotCache.get(key);
    const knots = H.usual.slice();
    for (let pass = 0; pass < 10; pass++) {
      H.usual.forEach((u, i) => {
        let s = 0;
        for (let m = H.openM + i * 60; m < H.openM + (i + 1) * 60; m++) s += lineAt(knots, H, m) * edges(m, H);
        knots[i] += u - s / 60;
      });
    }
    knotCache.set(key, knots);
    return knots;
  }
  // The seeds are chosen, not drawn. Today's gives the moment's reading: 70 inside at 7:42 PM and at Delayed's 7:29 PM, on a
  // line that reaches it from an evening's climb, with the day's peak before it. The other days' keeps each weekday's last
  // four days within the rhythm hour by hour, and no peak figure in the last 28 days repeated more than twice.
  const TODAY_SEED = 3315, DAYS_SEED = 262;
  function simulate(dn) {
    const H = hoursOn(dn), knots = knotsFor(H);
    const salt = dn === NOW.dn ? TODAY_SEED : DAYS_SEED;
    const j = mulberry32(40000 + dn + salt), rnd = mulberry32(90001 + dn + salt);
    const season = 0.985 + 0.0016 * (dn - FIRST_DAY - 38) + (dn >= BUSIER_FROM ? 0.03 : 0);
    const whole = season * (0.965 + 0.08 * j());
    const am = whole * (0.92 + 0.16 * j()), pm = whole * (0.95 + 0.1 * j());
    const shift = Math.round(24 * (j() - 0.5));
    const classes = [];
    for (let i = 0, n = 1 + Math.floor(j() * 3); i < n; i++) {
      classes.push({ at: H.openM + 60 + j() * (H.closeM - H.openM - 120), w: 16 + j() * 20, a: (j() < 0.5 ? -1 : 1) * (2.5 + j() * 5.5) });
    }
    const target = (m) => {
      const k = ss((m - 420) / 240);
      let v = lineAt(knots, H, m + shift) * (am + (pm - am) * k);
      for (const c of classes) { const z = (m - c.at) / c.w; v += c.a * Math.exp(-0.5 * z * z); }
      return Math.max(0, v) * edges(m, H);
    };
    const poisson = (l) => { if (l <= 0) return 0; const lim = Math.exp(-l); let k = 0, q = 1; do { k++; q *= rnd(); } while (q > lim); return k - 1; };
    const occ = new Array(H.closeM).fill(null), ent = new Array(H.closeM).fill(0), ext = new Array(H.closeM).fill(0);
    let o = 0, prevT = 0;
    for (let m = H.openM; m < H.closeM; m++) {
      const z = m - H.openM, T = z < QUIET ? 0 : target(m);
      let lam = z < QUIET ? 0 : Math.max(0, T - prevT * (63 / 64) + (2 / 64) * (T - o));
      if (z === QUIET) lam = Math.max(lam, 1.2);
      // Above the target the floor empties a little faster, and much faster in the rush out before closing.
      const pull = o > T ? ((o - T) * (H.closeM - m <= CLOSING + 5 ? 0.2 : 2 / 64)) / o : 0;
      const pOut = 1 / 64 + pull;
      let x = 0;
      for (let i = 0; i < o; i++) if (rnd() < pOut) x++;
      const e = poisson(lam);
      o = o - x + e;
      occ[m] = o; ent[m] = e; ext[m] = x; prevT = T;
    }
    return { occ, ent, ext };
  }
  const simulated = new Map();
  function day(dn) {
    if (!simulated.has(dn)) simulated.set(dn, simulate(dn));
    return simulated.get(dn);
  }
  // The count the edge held as the gym closed that business day (the scheduled reset's prior).
  const closingCount = (dn) => { const H = hoursOn(dn); return day(dn).occ[H.closeM - 1]; };

  /* ---------------------------------------------------------- the busiest hour of a span (GLO-12)
   * The one-hour slot, on the hour, with the highest average inside over complete days: for each hour, the mean of each
   * day's average inside where that day was open and read (its outages, and any span a page has not received, `unread`,
   * left out), then the hour with the highest mean; a tie keeps the earlier hour. Today's "Last 7 days" and Reports'
   * Last 7 days ask it for the same seven days, so they name one hour. Returns { hour, from, to, mean } (minutes since
   * 6:00 AM), or null when no day was read. */
  function busiestHour(dns, unread = {}) {
    const hours = Math.ceil(Math.max(0, ...dns.map((dn) => hoursOn(dn).closeM)) / 60);
    let best = null;
    for (let h = 0; h < hours; h++) {
      const means = [];
      for (const dn of dns) {
        const occ = day(dn).occ, gaps = (OUTAGES[dn] || []).concat(unread[dn] || []);
        let s = 0, n = 0;
        for (let m = h * 60; m < h * 60 + 60; m++) if (occ[m] != null && !gaps.some(([a, b]) => m >= a && m <= b)) { s += occ[m]; n++; }
        if (n) means.push(s / n);
      }
      const mean = means.reduce((a, b) => a + b, 0) / means.length;
      if (means.length && (!best || mean > best.mean)) best = { hour: h, from: h * 60, to: h * 60 + 60, mean };
    }
    return best;
  }

  return {
    toDn, wdOf, RECORDED, CAPACITY, LIMITS, PEOPLE, lastCount, levelOf, recordedLevelOf, LEVELS, NOW, WEEKDAYS, WEEK, CHANGES, versionAt,
    hoursOn, OUTAGES, FIRST_DAY, LAST_FULL: NOW.dn - 1, DAY: WEEK.wed.close * 60 - WEEK.wed.open * 60, day, closingCount, busiestHour,
  };
})();
