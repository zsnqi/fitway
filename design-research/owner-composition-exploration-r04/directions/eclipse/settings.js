/* Eclipse Settings: FITWAY Owner Settings concept (the fifth Eclipse page). Synthetic data only; not production.
 * It answers "what shapes the gym and the visitors' page, and how do I change one value safely": the five values the
 * owner edits (capacity, the three crowd-level limits, the weekly hours, the end of the business day and the reset
 * buffer) on one sheet, beside the settings history with its reasons (arrangement ب, DECISIONS item 77). On «تعديل»
 * the panel becomes that part's editor and the part reads «قيد التعديل» (part 2 of this round); a save asks first,
 * listing each change from → to (part 3). Complete at first paint: no intro, no rolling digits (item 4). Nothing is
 * lit (LGT-6 allows none): a setting is not a reading.
 * The data follows the owner Settings contract (packages/api/src/settings/contracts.ts): one versioned snapshot, the
 * five editable axes submitted together; the five read-only values (time zone, push, fresh, stale, poll) are never
 * shown but as «توقيت الرياض» beside the hours (item 49). Each crowd level also reads in people, computed from capacity
 * the way bandFor counts (packages/api/src/occupancy/bands.ts: a level holds every count whose percent is at or under
 * its limit). The history names each change from → to by comparing each saved version with the one before it (item
 * 49; a Product/Spec amendment), with the reason only where one was given.
 * The synthetic history is Activity log's eight settings records (activity.js, versions 2 to 9: the same dates, owners
 * and reasons), each given the change its reason describes; the current snapshot agrees with Daily (Wednesday 6:00 AM
 * to 1:00 AM, levels at 24, 48 and 68 people) and with Activity log's resets five minutes after each closing.
 * Query: lang=ar|en; ops=delayed|closed|offline (the frame's status, for review); motion=off. Later parts add the
 * editor's, the dialogs' and the states' switches.
 * Western digits only: numbers are printed with String(), never Intl or toLocaleString. A classic script (no modules
 * and no fetch), so the page works from file:// too. */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const LANG = root.lang === "en" ? "en" : "ar";
  const RTL = LANG === "ar";
  const params = new URLSearchParams(location.search);
  // A middle dot between two parts of a line is silent; a screen reader hears this comma instead (decision 25).
  const SR_SEP = `<span class="sr-only">${RTL ? "، " : ", "}</span>`;
  const PAGE = root.dataset.page || "live";
  // The first payload: "ready", "loading", "error", or "retrying". Part 3 draws Loading and Error (the shell is here).
  let phase = PAGE === "loading" ? "loading" : PAGE === "error" ? "error" : "ready";

  /* ------------------------------------------------------------------ copy */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const bdi = (s) => `<bdi>${s}</bdi>`;
  const ltr = (s) => `<bdi dir="ltr">${s}</bdi>`;
  const nw = (html) => `<span class="nw">${html}</span>`;
  // Whole numbers, Western digits, a comma for thousands in both languages (NUM-1, NUM-4).
  const fmtInt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  // Arabic counted nouns by the number's last two digits (فصحى مبسطة): 1 and 2 have their own forms; 3-10 the plural;
  // 11-99 the accusative singular; a round hundred the genitive singular («100 شخص», «120 شخصًا», «103 أشخاص»).
  const arCount = (n, one, two, few, many, hundred) => {
    if (n === 1) return one;
    if (n === 2) return two;
    const t = n % 100;
    if (n >= 100 && (t === 0 || t === 1 || t === 2)) return `${ltr(fmtInt(n))} ${hundred}`;
    if (t >= 3 && t <= 10) return `${ltr(fmtInt(n))} ${few}`;
    return `${ltr(fmtInt(n))} ${many}`;
  };
  const COPY = {
    ar: {
      docTitle: "الإعدادات · FITWAY (مفهوم)",
      title: "الإعدادات",
      history: "سجل الإعدادات",
      historyName: "سجل الإعدادات في سجل النشاط",
      sec: { crowd: "الزحام", hours: "ساعات العمل", day: "يوم العمل" },
      hoursUnit: "توقيت الرياض",
      edit: "تعديل",
      // The visible word, then the part it edits (WCAG 2.5.3).
      editName: (s) => `تعديل ${s}`,
      editing: "قيد التعديل",
      capacity: "السعة",
      levels: ["هادئ", "متوسط", "مزدحم", "شديد الازدحام"],
      upTo: "حتى",
      above: "فوق",
      people: (n) => (n === 0 ? `${ltr("0")} أشخاص` : arCount(n, "شخص واحد", "شخصان", "أشخاص", "شخصًا", "شخص")),
      orMore: (n) => `${COPY.ar.people(n)} فأكثر`,
      // A level no whole count reaches (its limit holds no more people than the level under it): part 3's range case.
      noCount: "لا يبلغه أي عدد",
      emptyOnly: "الصالة خالية فقط",
      days: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
      closed: "مغلق",
      allDay: (n) => `${ltr(n)} ساعة`,
      dayEnd: "نهاية يوم العمل",
      reset: "تصفير العدد",
      minutes: (n) => (n === 0 ? "" : arCount(n, "دقيقة واحدة", "دقيقتان", "دقائق", "دقيقة", "دقيقة")),
      resetAfter: (n) => (n === 0 ? "عند الإغلاق" : `${COPY.ar.minutes(n)} بعد الإغلاق`),
      // The settings history (from 1024 px, the panel beside the sheet; 721-1023 px under it).
      logTitle: "سجل الإعدادات",
      logAll: "عرض الكل",
      logAllName: "عرض كل سجلات الإعدادات في سجل النشاط",
      logEmpty: "لا تغييرات بعد",
      today: "اليوم",
      yesterday: "أمس",
      months: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
      // A change, as the history names it: what, then from → to. Hours name their days and the end that changed.
      chg: {
        capacity: "السعة",
        limit: (lv) => lv,
        dayEnd: "نهاية يوم العمل",
        reset: "تصفير العدد",
        open: (d) => `فتح ${d}`,
        close: (d) => `إغلاق ${d}`,
        hours: (d) => `ساعات ${d}`,
        every: "كل الأيام",
        except: (d) => `كل الأيام عدا ${d}`,
        run: (a, b) => `${a} إلى ${b}`,
        list: (xs) => xs.join(" و"),
        // Said in full to assistive technology: «إغلاق الخميس: من 1:00 ص إلى 2:00 ص».
        said: (what, a, b) => `${what}: من ${a} إلى ${b}`,
      },
      quote: (s) => `«${s}»`,
    },
    en: {
      docTitle: "Settings · FITWAY (concept)",
      title: "Settings",
      history: "Settings history",
      historyName: "Settings history in the Activity log",
      sec: { crowd: "Crowd", hours: "Opening hours", day: "Business day" },
      hoursUnit: "Riyadh time",
      edit: "Edit",
      editName: (s) => `Edit ${s.toLowerCase()}`,
      editing: "Editing",
      capacity: "Capacity",
      levels: ["Quiet", "Moderate", "Busy", "Packed"],
      upTo: "up to",
      above: "above",
      people: (n) => (n === 1 ? `${ltr("1")} person` : `${ltr(fmtInt(n))} people`),
      // "69+ people": "69 people or more" does not fit the sheet beside "above 57%" at 1024 px (measured 316 of 307 px).
      orMore: (n) => `${ltr(`${fmtInt(n)}+`)} people`,
      noCount: "No count reaches it",
      emptyOnly: "Only when empty",
      days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      closed: "Closed",
      allDay: (n) => `${n} hours`,
      // Under its part's heading "Business day"; the history names it in full (chg.dayEnd).
      dayEnd: "Ends",
      reset: "Count reset",
      minutes: (n) => (n === 1 ? "1 minute" : `${fmtInt(n)} minutes`),
      resetAfter: (n) => (n === 0 ? "At closing" : `${COPY.en.minutes(n)} after closing`),
      logTitle: "Settings history",
      logAll: "View all",
      logAllName: "View all settings records in the Activity log",
      logEmpty: "No changes yet",
      today: "Today",
      yesterday: "Yesterday",
      months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      chg: {
        capacity: "Capacity",
        limit: (lv) => lv,
        dayEnd: "Business day ends",
        reset: "Count reset",
        open: (d, one) => (one ? `${d} opening` : `Opening, ${d}`),
        close: (d, one) => (one ? `${d} closing` : `Closing, ${d}`),
        hours: (d, one) => (one ? `${d} hours` : `Hours, ${d}`),
        every: "every day",
        except: (d) => `every day except ${d}`,
        run: (a, b) => `${a} to ${b}`,
        list: (xs) => (xs.length === 2 ? `${xs[0]} and ${xs[1]}` : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`),
        said: (what, a, b) => `${what}: from ${a} to ${b}`,
      },
      quote: (s) => `“${s}”`,
    },
  };
  const L = Object.assign(COPY[LANG], EclipseFrame.copy[LANG]);
  const say = (text) => { const el = $("#say"); el.textContent = ""; requestAnimationFrame(() => { el.textContent = text; }); };

  /* ------------------------------------------------------------------ time
   * The contract's wall times are 24-hour HH:mm in gym time (Riyadh); the page writes them on a 12-hour clock with
   * «ص / م» or AM / PM (DAT-1). A closing time at or before its opening time is the next calendar day (SPEC; ADR-004):
   * equal means open around the clock. */
  const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const hm = (s) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
  const fmtClock = (mins) => {
    const h = Math.floor(mins / 60) % 24, m = mins % 60;
    return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${RTL ? (h >= 12 ? "م" : "ص") : h >= 12 ? "PM" : "AM"}`;
  };
  const clockOf = (s) => fmtClock(hm(s));
  const timeText = (mins) => nw(bdi(fmtClock(mins)));
  const DASH = "–";
  const rangeText = (d) => nw(`${bdi(clockOf(d.open))} ${DASH} ${bdi(clockOf(d.close))}`);

  /* ---------------------------------------------------- the crowd levels in people (bandFor's counting)
   * A level holds every whole count whose percent of capacity is at or under its limit, so its last count is the
   * largest n with (n / capacity) × 100 <= limit, computed in the same floating point bandFor uses: 20% of 120 is up to
   * 24 people; 24% of 120 up to 28 (item 49's "up to 29" was its example's shape). Packed is every count above Busy. */
  const lastCount = (cap, pct) => {
    let n = Math.floor((pct * cap) / 100);
    while (((n + 1) / cap) * 100 <= pct) n++;
    while (n > 0 && (n / cap) * 100 > pct) n--;
    return n;
  };

  /* ------------------------------------------------------------ the gym's settings (synthetic, from the contract)
   * Version 1 is the snapshot the gym started with (it has no record: the log begins with the first owner change);
   * each later version is the one before it with one owner change applied, written by the owner and at the time
   * Activity log records it (activity.js, settings_updated, versions 2-9), with its reason as typed. */
  const H = (open, close) => ({ open, close });
  const week = (f) => Object.fromEntries(DAYS.map((d, i) => [d, f(d, i)]));
  const clone = (s) => JSON.parse(JSON.stringify(s));
  const V1 = {
    capacity: 120,
    thresholds: { quietMaxPercent: 20, moderateMaxPercent: 40, busyMaxPercent: 57 },
    weeklySchedule: week((d) => (d === "fri" ? H("16:00", "01:00") : H("06:00", "01:00"))),
    businessDayBoundary: "03:00",
    resetBufferMinutes: 30,
  };
  const R = (ar, en) => ({ ar, en });
  const CHANGES = [
    // [date, time (gym-local), owner, reason, change]
    ["2025-12-28", "16:20", "o1", R("ساعات العمل الشتوية", "Winter opening hours"), (s) => { for (const d of DAYS) s.weeklySchedule[d].close = "00:00"; }],
    ["2026-02-15", "22:40", "o2", R("ساعات رمضان", "Ramadan hours"), (s) => { for (const d of DAYS) s.weeklySchedule[d] = d === "fri" ? H("21:00", "02:00") : H("20:00", "02:00"); }],
    // As typed: Noura's Arabic, in both languages (activity.js keeps it so).
    ["2026-03-22", "13:05", "o2", { raw: "رجعنا لساعات العمل المعتادة بعد العيد", lang: "ar" }, (s) => { for (const d of DAYS) s.weeklySchedule[d] = d === "fri" ? H("16:00", "01:00") : H("06:00", "01:00"); }],
    ["2026-08-16", "11:20", "o1", R("التصفير بعد الإغلاق بخمس دقائق", "Reset five minutes after closing"), (s) => { s.resetBufferMinutes = 5; }],
    ["2026-09-04", "15:15", "o1", null, (s) => { s.businessDayBoundary = "04:00"; }],
    ["2026-09-16", "10:05", "o2", R("ساعات الجمعة الجديدة: من 2 م", "New Friday hours: from 2 PM"), (s) => { s.weeklySchedule.fri.open = "14:00"; }],
    // After midnight: Saturday 19 September, 12:22 AM.
    ["2026-09-19", "00:22", "o2", R("ساعات نهاية الأسبوع", "Weekend hours"), (s) => { s.weeklySchedule.sat.open = "08:00"; }],
    ["2026-09-23", "11:32", "o1", R("الإغلاق يوم الخميس الساعة 2 ص", "Thursday closing moved to 2 AM"), (s) => { s.weeklySchedule.thu.close = "02:00"; }],
  ];
  const OWNER_NAMES = { o1: "فهد", o2: "نورة" };   // the one stored string each owner typed (DECISIONS item 32)
  // Every version, oldest first: { version, date, mins, by, reason, editable }.
  const versions = [{ version: 1, date: null, mins: null, by: null, reason: null, editable: clone(V1) }];
  for (const [date, time, by, reason, apply] of CHANGES) {
    const next = clone(versions[versions.length - 1].editable);
    apply(next);
    versions.push({ version: versions.length + 1, date, mins: hm(time), by, reason, editable: next });
  }
  // The snapshot the page loaded (settings.read): the latest version and its five read-only values, never shown but
  // as «توقيت الرياض» beside the hours (item 49).
  const current = () => versions[versions.length - 1];
  const OPERATIONAL = { timezone: "Asia/Riyadh", pushIntervalSeconds: 20, freshForSeconds: 90, operationalStaleAfterSeconds: 180, publicPollSeconds: 60 };

  /* ------------------------------------------------------- what changed, from → to (the history's words)
   * One version against the one before it. The order follows the sheet: capacity, the three limits, the hours, the end
   * of the business day, the reset. Days whose hours changed the same way share one line: all seven «كل الأيام», six
   * «كل الأيام عدا الجمعة», a run of three or more «الأحد إلى الأربعاء», otherwise named with «و». One end changed names
   * that end («إغلاق الخميس»); both ends, a closed day opened or an open day closed, the day's hours («ساعات الجمعة»).
   * A value keeps its unit once, after the new value: «السعة: 100 ← 120 شخصًا». Part 3's confirmation lists the same
   * lines. */
  function daysName(idx) {
    const C = L.chg, name = (i) => L.days[i];
    if (idx.length === 7) return { text: C.every, one: false };
    if (idx.length === 6) return { text: C.except(name([0, 1, 2, 3, 4, 5, 6].find((i) => !idx.includes(i)))), one: false };
    if (idx.length === 1) return { text: name(idx[0]), one: true };
    const run = idx.every((v, k) => k === 0 || v === idx[k - 1] + 1);
    if (run && idx.length >= 3) return { text: C.run(name(idx[0]), name(idx[idx.length - 1])), one: false };
    return { text: C.list(idx.map(name)), one: false };
  }
  const dayText = (d) => (d ? rangeText(d) : L.closed);
  const daySaid = (d) => (d ? `${clockOf(d.open)} ${DASH} ${clockOf(d.close)}` : L.closed);
  function changes(a, b) {
    const out = [];
    const line = (what, from, to, fromSaid, toSaid) => out.push({ what, from, to, said: L.chg.said(what, fromSaid, toSaid) });
    if (a.capacity !== b.capacity) {
      line(L.chg.capacity, ltr(fmtInt(a.capacity)), L.people(b.capacity), fmtInt(a.capacity), L.people(b.capacity).replace(/<[^>]+>/g, ""));
    }
    const T = ["quietMaxPercent", "moderateMaxPercent", "busyMaxPercent"];
    T.forEach((k, i) => {
      if (a.thresholds[k] !== b.thresholds[k]) line(L.chg.limit(L.levels[i]), ltr(`${a.thresholds[k]}%`), ltr(`${b.thresholds[k]}%`), `${a.thresholds[k]}%`, `${b.thresholds[k]}%`);
    });
    // The hours: each day's kind of change, then days that changed the same way grouped.
    const groups = new Map();
    DAYS.forEach((d, i) => {
      const x = a.weeklySchedule[d], y = b.weeklySchedule[d];
      if (JSON.stringify(x) === JSON.stringify(y)) return;
      let kind, from, to, fromSaid, toSaid;
      if (x && y && x.open === y.open) { kind = "close"; from = timeText(hm(x.close)); to = timeText(hm(y.close)); fromSaid = clockOf(x.close); toSaid = clockOf(y.close); }
      else if (x && y && x.close === y.close) { kind = "open"; from = timeText(hm(x.open)); to = timeText(hm(y.open)); fromSaid = clockOf(x.open); toSaid = clockOf(y.open); }
      else { kind = "hours"; from = dayText(x); to = dayText(y); fromSaid = daySaid(x); toSaid = daySaid(y); }
      const key = `${kind}|${fromSaid}|${toSaid}`;
      if (!groups.has(key)) groups.set(key, { kind, from, to, fromSaid, toSaid, idx: [] });
      groups.get(key).idx.push(i);
    });
    for (const g of groups.values()) {
      const n = daysName(g.idx);
      line(L.chg[g.kind](n.text, n.one), g.from, g.to, g.fromSaid, g.toSaid);
    }
    if (a.businessDayBoundary !== b.businessDayBoundary) {
      line(L.chg.dayEnd, timeText(hm(a.businessDayBoundary)), timeText(hm(b.businessDayBoundary)), clockOf(a.businessDayBoundary), clockOf(b.businessDayBoundary));
    }
    if (a.resetBufferMinutes !== b.resetBufferMinutes) {
      const plain = (n) => L.resetAfter(n).replace(/<[^>]+>/g, "");
      // The new value carries the unit and «بعد الإغلاق»; the old one only its number (or «عند الإغلاق»).
      const fromHtml = a.resetBufferMinutes === 0 ? L.resetAfter(0) : ltr(fmtInt(a.resetBufferMinutes));
      line(L.chg.reset, fromHtml, nw(L.resetAfter(b.resetBufferMinutes)), plain(a.resetBufferMinutes), plain(b.resetBufferMinutes));
    }
    return out;
  }

  /* ---------------------------------------------------------------- motion */
  const URL_OFF = params.get("motion") === "off";
  const mqReduce = matchMedia("(prefers-reduced-motion: reduce)");
  const motionOn = () => !URL_OFF && !mqReduce.matches;
  root.dataset.motion = motionOn() ? "on" : "off";
  const M = window.EclipseMotion;

  /* ---------------------------------------------------------------- shell */
  const NOW_MIN = 19 * 60 + 42;                    // the concept's now: Wednesday 23 September 2026, 7:42 PM
  const TODAY_KEY = "wed";
  const SVG_ERR = EclipseFrame.icons.error;
  const todayHours = () => current().editable.weeklySchedule[TODAY_KEY];
  const OPS_STATES = {
    live: (m = NOW_MIN) => ({ cls: "", mark: '<span class="dot" aria-hidden="true"></span>', word: L.live, line: `${L.lastReading} ${timeText(m)}` }),
    delayed: (m = NOW_MIN - 13) => ({ cls: "is-delayed", mark: EclipseFrame.icons.clock, word: L.delayed, line: `${L.lastReading} ${timeText(m)}` }),
    closed: () => ({ cls: "is-closed", mark: '<span class="dot ring" aria-hidden="true"></span>', word: L.closed, line: L.opens(timeText(hm(todayHours()?.open ?? "06:00"))) }),
    offline: () => ({ cls: "is-off", mark: EclipseFrame.icons.offline, word: L.offline, line: L.noCount }),
    error: () => ({ cls: "is-err", mark: SVG_ERR, word: L.errorWord, line: L.errorLine }),
  };
  const OPS = ["delayed", "closed", "offline"].includes(params.get("ops")) ? params.get("ops") : "live";
  const keep = new URLSearchParams({ lang: LANG });
  if (URL_OFF) keep.set("motion", "off");
  const LOG_HREF = `activity.html?kind=settings&${keep}`;
  let openDlg = null;
  const frame = EclipseFrame.init({
    L, RTL, motionOn, Motion: M, URL_OFF,
    links: { daily: `index.html?${keep}`, reports: `reports.html?${keep}`, activity: `activity.html?${keep}`, access: `access.html?${keep}` },
    extraLinks: { "#history-link": LOG_HREF },
    isDialogOpen: () => !!openDlg,
    status: {
      phase: () => phase, key: (p) => (p === "error" || p === "retrying" ? "error" : OPS),
      states: OPS_STATES, reserveMinute: 644,
      hours: () => { const t = todayHours(); return t ? `${L.hours} ${rangeText(t)}` : L.closed; },
    },
  });
  $("#history-link").setAttribute("aria-label", L.historyName);

  /* ---------------------------------------------------------------- the sheet
   * Three parts, each a heading with its «تعديل» at the head's end, then its values as one definition list whose labels
   * share one column across the sheet, so every value starts on one edge. The crowd: capacity, then the four levels,
   * each its level's four bars (CHP-5, the key the visitors' page and Daily use), «حتى 20%» and the people it holds.
   * The hours: the week from Sunday, each day's opening and closing in their own columns (a closing time before the
   * opening is the night after, as every opening-hours list writes it), or «مغلق». The business day: its end and the
   * reset. Nothing is lit; nothing on the sheet is a reading. */
  const LEVEL_BARS = (lv) => `<span class="lvl-bars" aria-hidden="true">${[0, 1, 2, 3].map((i) => `<i${i <= lv ? ' class="on"' : ""}></i>`).join("")}</span>`;
  const editBtn = (sec) => `<button class="rbtn set-edit" type="button" data-edit="${sec}" aria-label="${esc(L.editName(L.sec[sec]))}">${L.edit}</button>`;
  const head = (sec, extra = "") => `<div class="set-head">
      <h2 class="set-title" id="${sec}-title" tabindex="-1"><span class="set-name">${L.sec[sec]}</span>${extra}</h2>
      ${editBtn(sec)}
    </div>`;
  const row = (dt, dd, cls = "") => `<div class="set-row${cls ? ` ${cls}` : ""}"><dt>${dt}</dt><dd>${dd}</dd></div>`;
  function crowdHTML(s) {
    const cap = s.capacity, t = s.thresholds;
    const lims = [t.quietMaxPercent, t.moderateMaxPercent, t.busyMaxPercent];
    const last = lims.map((p) => lastCount(cap, p));
    const ppl = (i) => {
      if (i === 3) return L.orMore(last[2] + 1);
      if (i === 0 && last[0] === 0) return L.emptyOnly;
      if (i > 0 && last[i] === last[i - 1]) return L.noCount;
      return L.people(last[i]);
    };
    const lvRow = (i) => row(
      `${LEVEL_BARS(i)}<span>${L.levels[i]}</span>`,
      `<span class="v-q">${i === 3 ? L.above : L.upTo}</span><span class="v-n">${ltr(`${lims[Math.min(i, 2)]}%`)}</span>${SR_SEP}<span class="v-p">${nw(ppl(i))}</span>`,
      "is-level");
    return `${head("crowd")}
    <dl class="set-dl dl-crowd">
      ${row(L.capacity, `<span class="v-n v-cap">${nw(L.people(cap))}</span>`, "is-cap")}
      ${[0, 1, 2, 3].map(lvRow).join("")}
    </dl>`;
  }
  function hoursHTML(s) {
    const unit = `<span class="set-unit">${SR_SEP}${L.hoursUnit}</span>`;
    const dayRow = (d, i) => {
      const h = s.weeklySchedule[d];
      if (!h) return row(L.days[i], `<span class="v-closed">${L.closed}</span>`, "is-closed");
      const allDay = h.open === h.close;
      return row(L.days[i],
        `<span class="v-n v-t">${bdi(clockOf(h.open))}</span><span class="v-dash" aria-hidden="true">${DASH}</span><span class="sr-only">${RTL ? " إلى " : " to "}</span>` +
        `<span class="v-n v-t">${bdi(clockOf(h.close))}</span>${allDay ? `${SR_SEP}<span class="v-note">${L.allDay(24)}</span>` : ""}`);
    };
    return `${head("hours", unit)}
    <dl class="set-dl dl-hours">${DAYS.map(dayRow).join("")}</dl>`;
  }
  function dayHTML(s) {
    return `${head("day")}
    <dl class="set-dl dl-day">
      ${row(L.dayEnd, `<span class="v-n">${timeText(hm(s.businessDayBoundary))}</span>`)}
      ${row(L.reset, `<span class="v-n">${nw(L.resetAfter(s.resetBufferMinutes))}</span>`)}
    </dl>`;
  }

  /* ---------------------------------------------------------------- the settings history (the panel)
   * The latest eight records, newest first (eight, as Access's records card, end the panel level with the sheet at
   * 1440), each: what changed, from → to, a line per change (chalk figures, the arrow along the reading line); the reason
   * as typed, in quotation marks, only where one was given; who and when at the record's far end. «عرض الكل» opens the
   * settings records in Activity log (OWN-A9). */
  const LOG_N = 8;
  const DAY0 = Date.UTC(2026, 8, 23) / 864e5;                  // the concept's today: Wednesday 23 September 2026
  const dayOf = (iso) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 864e5;
  function whenHTML(v) {
    const d = dayOf(v.date);
    if (d === DAY0) return nw(`${L.today} ${timeText(v.mins)}`);
    if (d === DAY0 - 1) return nw(`${L.yesterday} ${timeText(v.mins)}`);
    const y = +v.date.slice(0, 4), m = +v.date.slice(5, 7) - 1, day = +v.date.slice(8, 10);
    return nw(`${bdi(day)} ${L.months[m]}${y !== 2026 ? ` ${bdi(y)}` : ""}`);
  }
  const ARROW = `<svg class="log-arw mirror" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h13.5M13.5 7l5 5-5 5"/></svg>`;
  function recordHTML(v, prev) {
    // The changes share two columns, so a record's figures start on one edge whatever its labels' lengths.
    const lines = changes(prev.editable, v.editable).map((c) =>
      `<span class="log-what" aria-hidden="true">${c.what}</span>` +
      `<span class="log-fig" aria-hidden="true"><span class="log-from">${c.from}</span><span class="log-to">${ARROW}${c.to}</span></span>` +
      `<span class="sr-only">${esc(c.said)}</span>`).join("");
    const reason = v.reason ? (v.reason.raw ?? v.reason[LANG]) : null;
    const why = reason ? `<p class="log-why"><q><bdi dir="auto">${esc(reason)}</bdi></q></p>` : "";
    return `<li class="log-rec"><div class="log-body"><div class="log-chgs">${lines}</div>${why}</div>` +
      `<p class="log-meta">${SR_SEP}${bdi(esc(OWNER_NAMES[v.by]))}<span class="sep" aria-hidden="true">·</span>${SR_SEP}${whenHTML(v)}</p></li>`;
  }
  function panelHTML() {
    const recs = versions.slice(1).map((v, i) => [v, versions[i]]).reverse().slice(0, LOG_N);
    const list = recs.length ? `<ol class="log-list">${recs.map(([v, p]) => recordHTML(v, p)).join("")}</ol>` : `<p class="log-none">${L.logEmpty}</p>`;
    return `<div class="log-head">
        <h2 class="set-title" id="log-title" tabindex="-1"><span class="set-name">${L.logTitle}</span></h2>
        <a class="acc-all set-all" id="log-all" href="${LOG_HREF}" aria-label="${esc(L.logAllName)}"><span>${L.logAll}</span><svg class="mirror" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M10 7l5 5-5 5"/></svg></a>
      </div>${list}`;
  }

  /* ---------------------------------------------------------------- render */
  const secEl = { crowd: $("#sec-crowd"), hours: $("#sec-hours"), day: $("#sec-day") };
  const panelEl = $("#panel");
  function renderSheet() {
    const s = current().editable;
    secEl.crowd.innerHTML = crowdHTML(s);
    secEl.hours.innerHTML = hoursHTML(s);
    secEl.day.innerHTML = dayHTML(s);
  }
  function renderPanel() { panelEl.innerHTML = panelHTML(); }
  function renderAll() {
    renderSheet();
    renderPanel();
    frame.refreshStatus();
    root.dataset.phase = phase;
  }

  /* ---------------------------------------------------------------- start */
  renderAll();
  // Hooks for the capture script. They expose state, never anything a visitor could be identified by (there is none).
  window.__settings = {
    ready: true,
    get phase() { return phase; },
    get version() { return current().version; },
    get editable() { return clone(current().editable); },
    get operational() { return { ...OPERATIONAL }; },
    people: (cap, pct) => lastCount(cap, pct),
    changes: (a, b) => changes(versions[a - 1].editable, versions[b - 1].editable).map((c) => c.said),
  };
})();
