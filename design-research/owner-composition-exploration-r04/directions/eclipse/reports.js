/* Eclipse Reports: FITWAY Owner Reports concept (the second Eclipse page). Synthetic data only; not production.
 * Query: lang=ar|en (default ar), state=full|short (default full), range=7d|28d (default 28d) or from=YYYY-MM-DD&to=YYYY-MM-DD,
 * dialog=range|export (open a dialog at load), export=fail (the first export attempt fails), motion=off.
 * Reports answers "how does my gym usually behave, and which way is it going?": the weekday x hour pattern, the period's
 * figures, day by day, the last 7 days against the 7 before, and the minute CSV. It is complete at first paint (no intro;
 * user 2026-10-01, Q12). The same gym as the Daily page: 6:00 AM to 1:00 AM (Friday 2:00 PM to 1:00 AM),
 * Riyadh time, the same crowd levels and capacity. Step 4 (run owner_reports_r04_s20): the frame (body[data-frame], the
 * header's status at every size, Operations out of the rail) and the page recomposed at 1440 with the review's fixes.
 * Step 4 phase B: the user's refinements at 1440 (the minute export at the controls' far end, a preset's subtitle
 * without its length). Step 4's build (the user's pick of 2026-10-01, option B, "one day at a time"): below 1280 px the
 * pattern shows one weekday at a time (1024-1279 since the user's K-39 decision), chosen from a week strip of one bar a
 * day; below 721 px the day table is a list, 7 days and then all, one plain run of days. The week card's baseline
 * («مقابل …» / "vs …") is gone (Q17, rejected by the user on 2026-10-01). A span with no readings, or closed, is one
 * sentence with the words first: «لا قراءات من 10:00 ص إلى 2:00 م» (decision 8, user 2026-10-01).
 * Western digits only: numbers are printed with String(), never Intl or toLocaleString. A classic script (no modules and
 * no fetch), so the page works from file:// too. */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  // The day table's parts shared with the component sheet (K5): a sortable column's header, a day's row header and the
  // single-day exception, so the sheet's specimen is built by the page's own components.
  const SORT_ICO = `<svg class="sort-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5.5v13M7.5 14l4.5 4.5 4.5-4.5"/></svg>`;
  const sortHead = (label, cls, attrs = "", btnAttrs = "") => `<th scope="col" role="columnheader" class="${cls}"${attrs}><button class="sort" type="button"${btnAttrs}><span>${label}</span>${SORT_ICO}</button></th>`;
  // A day's row header: its weekday, then its date («22 سبتمبر» / "22 Sep", HTML), which never breaks inside (DAT-4).
  const dayHead = (wd, date) => `<th scope="row" role="rowheader" class="c-day"><span class="dd"><span class="wd">${wd}</span> <span class="dt"><span class="nw">${date}</span></span></span></th>`;
  // A single day without readings: its date, then its words in one cell across the other columns. Every column's text
  // starts at its start edge in English (decision 16) and on the physical right in Arabic (TBL-1), so the words start
  // where the peak's header starts in both languages with no correction.
  const dayNoneRow = (head, words, edge = false) => `<tr role="row" class="is-none-day${edge ? " wk-edge" : ""}">${head}<td role="cell" colspan="4" class="c-none"><span class="day-none-word">${words}</span></td></tr>`;
  // Decision 16 (user 2026-10-03): the peak's figure stands in a slot as wide as the column's widest figure, so the time
  // beside it starts on one line in every row, whatever the figure's width (9, 55, 120): in English, where the figure
  // starts on the column's left edge, always; in Arabic, where figures share the right edge (TBL-1), whenever the figures
  // differ in width (decision 23). A column with equal-width figures is unchanged. Readex Pro's digits differ in width
  // (tabular-nums changes nothing in this font), so the slot is measured, and again once the fonts are in.
  const fitSlots = (table) => {
    if (!table) return;
    // Restore natural columns before measuring them; only the tablet's day table transfers room from Notes (decision 22).
    table.querySelector("colgroup[data-peak-room]")?.remove();
    table.style.tableLayout = "";
    const rtl = table.closest('[dir="rtl"]') != null;
    const cols = new Map();
    for (const tr of table.rows) {
      let i = 0;
      for (const cell of tr.cells) {
        const fig = cell.querySelector(".pv");
        if (fig && fig.firstElementChild) { if (!cols.has(i)) cols.set(i, []); cols.get(i).push(fig); }
        i += cell.colSpan || 1;
      }
    }
    for (const figs of cols.values()) for (const f of figs) f.style.minWidth = "";
    const tablet = table.classList.contains("days-table") && innerWidth >= 721 && innerWidth <= 1023;
    const heads = tablet && table.tHead ? [...table.tHead.rows[0].cells] : [];
    const widths = heads.map((c) => c.getBoundingClientRect().width);
    let extra = 16;
    for (const figs of cols.values()) {
      const measured = figs.map((f) => f.firstElementChild.getBoundingClientRect().width);
      const width = Math.max(...measured), spread = width - Math.min(...measured);
      const slot = !rtl || spread > 0.01;
      for (const f of figs) f.style.minWidth = slot ? `${width}px` : "";
      extra = Math.max(extra, spread);
    }
    if (tablet && cols.size && heads.length === 5) {
      // Freeze every natural column at its measured width, then give Peak at least 16 px from Notes alone. Keeping the
      // other three widths prevents the auto table algorithm from paying for that room by shrinking them on resize.
      const group = document.createElement("colgroup");
      group.dataset.peakRoom = "";
      // Whole pixels for every column but Notes, which takes the rest, so the total is unchanged: fractional column edges
      // left a 1 px seam between the Arabic headers (decision 25).
      const want = widths.map((w, i) => w + (i === 1 ? extra : i === 4 ? -extra : 0));
      const whole = want.map((w, i) => (i === want.length - 1 ? 0 : Math.round(w)));
      whole[whole.length - 1] = want.reduce((s, w) => s + w, 0) - whole.reduce((s, w) => s + w, 0);
      group.innerHTML = whole.map((w) => `<col style="width:${w}px">`).join("");
      table.prepend(group);
      table.style.tableLayout = "fixed";
    }
  };
  window.EclipseTables = Object.freeze({ sortHead, dayHead, dayNoneRow, fitSlots });
  // On the sheet only the table primitives run; Reports data and controls stay on Reports.
  if (!document.body.classList.contains("rp")) return;
  const LANG = root.lang === "en" ? "en" : "ar";
  const RTL = LANG === "ar";
  // A middle dot between two parts of a line is silent (aria-hidden); a screen reader hears this comma instead, so the parts
  // are two phrases, not one run of words (decision 25). It is invisible and takes no room.
  const SR_SEP = `<span class="sr-only">${RTL ? "، " : ", "}</span>`;
  const STATE = root.dataset.state === "short" ? "short" : "full";
  const params = new URLSearchParams(location.search);
  /* K-02: Reports' own page states (reports.html sets data-page before first paint), as the user decided on 2026-10-03
   * (DECISIONS item 14): the options round's option A, Daily's grammar (one skeleton with a placeholder in every awaited
   * value, the pattern's light out under every status but Live, a waiting span noted where it falls), with option C's
   * error (one message for the page in place of the cards). The concept's moment is the Daily page's: Wednesday
   * 23 September, 7:42 PM; Closed is 5:12 AM the same day, before opening. Reports shows complete days only, so a status
   * about now leaves its history whole, except in `pending`, where the edge has been offline since 9:10 PM on Tuesday
   * 22 September and that evening's readings, buffered on the edge, have not arrived yet. */
  const PAGE = root.dataset.page || "live";
  let pageNow = PAGE; // the state shown: loading and error arrive into live
  // The first payload: "ready" (every state but two), "loading", "error", or "retrying" (the error's one retry running).
  let phase = PAGE === "loading" ? "loading" : PAGE === "error" ? "error" : "ready";

  /* ------------------------------------------------------------------ copy */
  // Arabic counted nouns: 1, 2, 3-10, 11-99 and hundreds (100, 200, ...).
  const arN = (n, [one, two, few, many, single]) => {
    if (n === 1) return one;
    if (n === 2) return two;
    const r = n % 100;
    return r >= 3 && r <= 10 ? `${n} ${few}` : r >= 11 ? `${n} ${many}` : `${n} ${single}`;
  };
  // Minutes, by the Daily page's own rule (app.js `arMin`), so «قبل … دقيقة» reads the same on both pages for any count.
  const arMin = (n) => (n === 1 ? "دقيقة" : n === 2 ? "دقيقتين" : n % 100 >= 3 && n % 100 <= 10 ? `${n} دقائق` : `${n} دقيقة`);
  const bdi = (s) => `<bdi>${s}</bdi>`;
  const COPY = {
    ar: {
      skip: "انتقل إلى المحتوى",
      railLabel: "الأقسام",
      brand: "FITWAY، أسماء الأقسام",
      railTip: "أسماء الأقسام",
      nav: { daily: "اليوم", reports: "التقارير", access: "الوصول", activity: "سجل النشاط", operations: "التشغيل", monitoring: "شاشة المراقبة", lang: "English", settings: "الإعدادات", signout: "تسجيل الخروج" },
      // The frame (as on Daily): the bar's short names, the Operations status and its details, the phone's menu.
      tabs: { daily: "اليوم", reports: "التقارير", activity: "النشاط", access: "الوصول", settings: "الإعدادات" },
      opsTitle: "حالة التشغيل",
      more: "المزيد",
      live: "مباشر",
      lastReading: "آخر قراءة",
      hours: "ساعات العمل",
      langAria: "التبديل إلى اللغة الإنجليزية",
      langGlyph: "EN",
      docTitle: "التقارير · FITWAY (مفهوم)",
      title: "التقارير",
      rangeName: "الفترة",
      seg: { "7d": `آخر ${bdi(7)} أيام`, "28d": `آخر ${bdi(28)} يومًا`, custom: "فترة أخرى…" },
      days: (n) => arN(n, ["يوم واحد", "يومان", "أيام", "يومًا", "يوم"]),
      daysWith: (k, n) => `قراءات في ${bdi(k)} من ${arN(n, ["يوم واحد", "يومين", "أيام", "يومًا", "يوم"])}`,
      glance: "باختصار",
      trendTitle: `آخر ${bdi(7)} أيام`,
      wowUnit: "معدّل الموجودين",
      cmp: { busier: "أكثر ازدحامًا", quieter: "أهدأ", same: "قريب من السابق" },
      wowEntries: (p) => `مرات الدخول ${p}`,
      wowEmpty: "لا تكفي القراءات بعد",
      wowEmptyNote: () => `يلزم أسبوعان من القراءات المنتظمة`,
      wowSay: (cur, prev) => `الأيام ${cur} مقارنة بالأيام ${prev}`,
      avgTitle: "معدّل الموجودين",
      peakTitle: "أعلى ذروة",
      entriesTitle: "مرات الدخول",
      entriesNote: (n) => `نحو ${n} في اليوم`,
      noReadings: "لا قراءات",
      levels: ["هادئ", "متوسط", "مزدحم", "شديد الازدحام"],
      patternTitle: "أوقات الازدحام",
      patternSub: "معدّل الموجودين حسب اليوم والساعة",
      busiest: (w, h) => `الأكثر ازدحامًا: ${w} ${h}`,
      numbers: "الأرقام",
      keyFewer: "أقل",
      keyMore: "أكثر",
      empty: "خالية",
      emptyLong: "الصالة خالية",
      closed: "مغلق",
      busiestKey: "الأكثر ازدحامًا",
      fewKey: `أقل من ${bdi(3)} أيام`,
      avgOf: (n) => (n === 1 ? "من يوم واحد" : n === 2 ? "معدّل يومين" : `معدّل ${arN(n, ["", "", "أيام", "يومًا", "يوم"])}`),
      closedTip: "خارج ساعات العمل",
      heatKeys: "استخدم مفاتيح الأسهم للتنقل بين الساعات والأيام، وHome وEnd لأول ساعة وآخر ساعة في اليوم.",
      heatCaption: (r) => `معدّل الموجودين حسب اليوم والساعة، ${r}`,
      dayHead: "اليوم",
      // Below 1280 px, one day at a time (step 4's build; K-39): the week strip and the chosen day's hours.
      weekStrip: "أيام الأسبوع",
      dayHours: (d, r) => `${d}: معدّل الموجودين حسب الساعة، ${r}`,
      daysTitle: "يومًا بيوم",
      cols: { day: "اليوم", peak: "الذروة", avg: "المعدّل", entries: "مرات الدخول", notes: "ملاحظات" },
      daysCaption: (r) => `الأيام ${r}: الذروة والمعدّل ومرات الدخول`,
      sortSay: (c, dir, isDay) => `مرتب حسب ${c}، ${isDay ? (dir === "desc" ? "الأحدث أولًا" : "الأقدم أولًا") : dir === "desc" ? "الأعلى أولًا" : "الأقل أولًا"}`,
      // The day list on a phone (step 4's build): sorted with the phone's own picker; 7 days, then all.
      sortName: "الترتيب",
      sorts: { "day-desc": "الأحدث أولًا", "day-asc": "الأقدم أولًا", "peak-desc": "الذروة الأعلى", "avg-desc": "المعدّل الأعلى", "entries-desc": "مرات الدخول الأكثر" },
      showAll: "عرض كل الأيام",
      showFewer: "عرض أقل",
      peakAt: (t) => `الذروة ${t}`,
      beforeHistory: "لا قراءات بعد",
      // A span in words, the words first (decision 8, user 2026-10-01): «لا قراءات من 10:00 ص إلى 2:00 م».
      spanFrom: "من",
      spanTo: "إلى",
      emptyTable: (a, b) => `${nw("لا قراءات")} ${nw(`من ${a}`)} ${nw(`إلى ${b}`)}`,
      emptyDay: (d) => `${nw("لا قراءات")} ${nw(`في ${d}`)}`,
      // One span inside the button: a flex button would make each run of text and the number an item of its own and set
      // its 8 px gap around «28» (the fix round, 2026-10-01).
      emptyAction: `عرض آخر ${bdi(28)} يومًا`,
      exportMinutes: "تصدير بيانات الدقائق",
      exportTable: "تصدير الجدول",
      close: "إغلاق",
      cancel: "إلغاء",
      rangeDlgTitle: "اختر الفترة",
      rangeDlgDesc: (a, b) => `القراءات متاحة من ${a} حتى ${b}.`,
      rangeApply: "عرض الفترة",
      from: "من",
      to: "إلى",
      err: {
        required: "أدخل تاريخًا",
        format: `اكتب التاريخ هكذا: ${bdi("16/09/2026")}`,
        invalid: "هذا التاريخ غير موجود",
        future: (d) => `آخر يوم مكتمل هو ${d}`,
        order: "تاريخ النهاية قبل البداية",
        tooLong: `اختر ${bdi(366)} يومًا أو أقل`,
      },
      exportTitle: "تصدير بيانات الدقائق",
      rows: (n) => arN(n, ["صف واحد", "صفان", "صفوف", "صفًا", "صف"]),
      exportGo: "تصدير CSV",
      working: "جارٍ التجهيز…",
      progress: (i, n) => `اليوم ${bdi(i)} من ${bdi(n)}`,
      doneTitle: "الملف جاهز",
      save: "حفظ الملف",
      done: "تم",
      failed: "تعذّر التصدير، ولم يُحفظ شيء.",
      retry: "إعادة المحاولة",
      canceledSay: "أُلغي التصدير",
      readySay: (n) => `الملف جاهز، ${n}`,
      rangeSay: (r) => `تُعرض الفترة ${r}`,
      // The page's states (K-02): the status words are the Daily page's (STW-1, STW-2).
      delayed: "متأخر",
      ago: (n) => `قبل ${arMin(n)}`,
      closedWord: "مغلق",
      opens: (t) => `يفتح ${t}`,
      offline: "غير متصل",
      noCount: "لا عدّ حاليًا",
      errorWord: "خطأ",
      errorLine: "تعذّر التحميل",
      errorFull: "تعذّر تحميل قراءات الفترة",
      errorHint: "تحقّق من الاتصال، ثم أعد المحاولة.",
      errorDates: (a, b) => `تعذّر تحميل القراءات من ${a} إلى ${b}`,
      errorDay: (a) => `تعذّر تحميل قراءات ${a}`,
      retrying: "جارٍ المحاولة…",
      loadingWord: "جارٍ التحميل…",
      loadingSay: "جارٍ تحميل قراءات الفترة",
      pending: "قيد الانتظار",
      waiting: "بانتظار القراءات",
      since: "منذ",
    },
    en: {
      skip: "Skip to content",
      railLabel: "Sections",
      brand: "FITWAY, section names",
      railTip: "Section names",
      nav: { daily: "Today", reports: "Reports", access: "Access", activity: "Activity log", operations: "Operations", monitoring: "Monitoring", lang: "العربية", settings: "Settings", signout: "Sign out" },
      tabs: { daily: "Today", reports: "Reports", activity: "Activity", access: "Access", settings: "Settings" },
      opsTitle: "Operations status",
      more: "More",
      live: "Live",
      lastReading: "Last reading",
      hours: "Open",
      langAria: "Switch to Arabic",
      langGlyph: "AR",
      docTitle: "Reports · FITWAY (concept)",
      title: "Reports",
      rangeName: "Dates",
      seg: { "7d": "Last 7 days", "28d": "Last 28 days", custom: "Custom…" },
      days: (n) => `${n} ${n === 1 ? "day" : "days"}`,
      daysWith: (k, n) => `Readings on ${k} of ${n} days`,
      glance: "At a glance",
      trendTitle: "Last 7 days",
      wowUnit: "avg. inside",
      cmp: { busier: "Busier", quieter: "Quieter", same: "About the same" },
      wowEntries: (p) => `Entries ${p}`,
      wowEmpty: "Not enough readings yet",
      wowEmptyNote: () => `Needs two weeks of steady readings`,
      wowSay: (cur, prev) => `The days ${cur} compared with the days ${prev}`,
      avgTitle: "Average inside",
      peakTitle: "Highest peak",
      entriesTitle: "Entries",
      entriesNote: (n) => `About ${n} a day`,
      noReadings: "No readings",
      levels: ["Quiet", "Moderate", "Busy", "Packed"],
      patternTitle: "Busy times",
      patternSub: "Average inside by day and hour",
      busiest: (w, h) => `Busiest: ${w} ${h}`,
      numbers: "Numbers",
      keyFewer: "Fewer",
      keyMore: "More",
      empty: "Empty",
      emptyLong: "Empty",
      closed: "Closed",
      busiestKey: "Busiest",
      fewKey: "Fewer than 3 days",
      avgOf: (n) => `Average of ${n} ${n === 1 ? "day" : "days"}`,
      closedTip: "Outside opening hours",
      heatKeys: "Use the arrow keys to move between hours and days. Home and End go to the day's first and last hour.",
      heatCaption: (r) => `Average inside by day and hour, ${r}`,
      dayHead: "Day",
      weekStrip: "Days of the week",
      dayHours: (d, r) => `${d}: average inside by hour, ${r}`,
      daysTitle: "Day by day",
      cols: { day: "Day", peak: "Peak", avg: "Average", entries: "Entries", notes: "Notes" },
      daysCaption: (r) => `Days ${r}: peak, average and entries`,
      sortSay: (c, dir, isDay) => `Sorted by ${c.toLowerCase()}, ${isDay ? (dir === "desc" ? "newest first" : "oldest first") : dir === "desc" ? "highest first" : "lowest first"}`,
      sortName: "Sort",
      sorts: { "day-desc": "Newest first", "day-asc": "Oldest first", "peak-desc": "Highest peak", "avg-desc": "Highest average", "entries-desc": "Most entries" },
      showAll: "Show all days",
      showFewer: "Show fewer",
      peakAt: (t) => `Peak ${t}`,
      beforeHistory: "No readings yet",
      spanFrom: "from",
      spanTo: "to",
      emptyTable: (a, b) => `${nw("No readings")} ${nw(`from ${a}`)} ${nw(`to ${b}`)}`,
      emptyDay: (d) => `${nw("No readings")} ${nw(`on ${d}`)}`,
      emptyAction: "Show the last 28 days",
      exportMinutes: "Export minute data",
      exportTable: "Export table",
      close: "Close",
      cancel: "Cancel",
      rangeDlgTitle: "Choose dates",
      rangeDlgDesc: (a, b) => `Readings are available from ${a} to ${b}.`,
      rangeApply: "Show these dates",
      from: "From",
      to: "To",
      err: {
        required: "Enter a date",
        format: "Write the date like 16/09/2026",
        invalid: "This date doesn't exist",
        future: (d) => `The last full day is ${d}`,
        order: "The end is before the start",
        tooLong: "Choose 366 days or fewer",
      },
      exportTitle: "Export minute data",
      rows: (n) => `${fmtInt(n)} ${n === 1 ? "row" : "rows"}`,
      exportGo: "Export CSV",
      working: "Preparing…",
      progress: (i, n) => `Day ${i} of ${n}`,
      doneTitle: "Your file is ready",
      save: "Save file",
      done: "Done",
      failed: "Couldn't export. Nothing was saved.",
      retry: "Try again",
      canceledSay: "Export canceled",
      readySay: (n) => `Your file is ready, ${n}`,
      rangeSay: (r) => `Showing ${r}`,
      delayed: "Delayed",
      ago: (n) => `${n} min ago`,
      closedWord: "Closed",
      opens: (t) => `Opens ${t}`,
      offline: "Offline",
      noCount: "No current count",
      errorWord: "Error",
      errorLine: "Couldn't load",
      errorFull: "Couldn't load the period's readings",
      errorHint: "Check the connection, then try again.",
      errorDates: (a, b) => `Couldn't load readings from ${a} to ${b}`,
      errorDay: (a) => `Couldn't load readings for ${a}`,
      retrying: "Trying again…",
      loadingWord: "Loading…",
      loadingSay: "Loading the period's readings",
      pending: "Pending",
      waiting: "Waiting for readings",
      since: "since",
    },
  };
  const L = COPY[LANG];

  /* ------------------------------------------------------------ numbers and time */
  function fmtInt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  const pct = (x) => `${x > 0 ? "+" : x < 0 ? "−" : ""}${Math.abs(Math.round(x))}%`;
  // Minutes since 6:00 AM of the business day, as on the Daily page.
  function clock(m) {
    const abs = (((360 + m) % 1440) + 1440) % 1440;
    const h = Math.floor(abs / 60);
    return { h12: ((h + 11) % 12) + 1, mm: abs % 60, pm: h >= 12 };
  }
  const suffix = (pm) => (RTL ? (pm ? "م" : "ص") : pm ? "PM" : "AM");
  const fmtTime = (m) => { const c = clock(m); return `${c.h12}:${String(c.mm).padStart(2, "0")} ${suffix(c.pm)}`; };
  const fmtHour = (m) => { const c = clock(m); return `${c.h12} ${suffix(c.pm)}`; };
  // Both languages use the en dash (DAT-3, user 2026-10-01). An unspaced Arabic hour range isolates its numbers LTR and joins
  // after the dash (U+2060), so the en dash does not reverse them or open a line break; the suffix stays outside, as before.
  const DASH = "–";
  const NUMS = (a, b) => (RTL ? `<bdi dir="ltr">${a}${DASH}\u2060${b}</bdi>` : `${a}${DASH}${b}`);
  // DAT-4 (K-17): a date, a time or a range never breaks inside; each is one unbreakable span (.nw).
  const nw = (html) => `<span class="nw">${html}</span>`;
  const range2 = (a, b) => `${bdi(a)} ${DASH} ${bdi(b)}`;
  const timeRange = (a, b) => nw(range2(fmtTime(a), fmtTime(b)));
  const timeText = (m) => nw(bdi(fmtTime(m)));
  function hourRange(a, b) {
    const A = clock(a), B = clock(b);
    return nw(A.pm === B.pm ? bdi(`${NUMS(A.h12, B.h12)} ${suffix(A.pm)}`) : range2(fmtHour(a), fmtHour(b)));
  }
  const hourText = (m) => nw(bdi(fmtHour(m)));
  /* A span in words (decision 8, user 2026-10-01): one sentence, the words first, «لا قراءات من 10:00 ص إلى 2:00 م» /
   * "No readings from 10:00 AM to 2:00 PM"; a closed span the same way, «مغلق من 6 ص إلى 2 م». It replaces the range
   * first and the dotted mark. The sentence wraps only between its words: the words stay together, each end keeps its
   * preposition, and a time or a date never breaks inside (DAT-4). One size and one colour for the whole sentence, the
   * ends included: the style its words have where it stands (decision 9, user 2026-10-02). A single day is not a span:
   * it keeps its date in its place (decisions 10 and 11, renderDays and renderList). */
  const spanNote = (words, a, b) => `<span class="gapnote"><span class="w">${words}</span> ` +
    `<span class="nw"><span class="w">${L.spanFrom}</span> <span class="rg">${a}</span></span> <span class="nw"><span class="w">${L.spanTo}</span> <span class="rg">${b}</span></span></span>`;

  /* ------------------------------------------------------------------- dates
   * Dates are business days, handled as whole-day numbers (UTC day counts), never as the viewer's local time. */
  const WD_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const WD_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const WD_EN_S = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  // The week strip's names (below 1280 px): the weekday without its article, as a week strip or a date picker writes it
  // in Arabic («أحد … سبت»), and "Sun" ... "Sat" in English. They replace phase B's one-letter heads (Q20, answered by the
  // user's pick of 2026-10-01). The full name stays each day's accessible name.
  const WD_AR_S = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
  const MO_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  const MO_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const toDn = (iso) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 864e5;
  const isoOf = (dn) => new Date(dn * 864e5).toISOString().slice(0, 10);
  const partsOf = (dn) => { const d = new Date(dn * 864e5); return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), wd: d.getUTCDay() }; };
  const wdOf = (dn) => partsOf(dn).wd;
  const wdLong = (wd) => (RTL ? WD_AR : WD_EN)[wd];
  const wdShort = (wd) => (RTL ? WD_AR : WD_EN_S)[wd];
  const wdStrip = (wd) => (RTL ? WD_AR_S : WD_EN_S)[wd];
  const monthOf = (m) => (RTL ? MO_AR : MO_EN)[m];
  // "22 Sep" / «22 سبتمبر», optionally with the year; never broken inside (DAT-4).
  const dateBare = (dn, year = false) => { const p = partsOf(dn); return `${bdi(p.d)} ${monthOf(p.m)}${year ? ` ${bdi(p.y)}` : ""}`; };
  const dateText = (dn, year = false) => nw(dateBare(dn, year));
  // "Tue 22 Sep" / «الثلاثاء 22 سبتمبر».
  const dayText = (dn) => nw(`${wdShort(wdOf(dn))} ${dateBare(dn)}`);
  function rangeText(a, b, year = true) {
    const A = partsOf(a), B = partsOf(b);
    if (a === b) return dateText(a, year);
    if (A.y !== B.y) return nw(`${dateBare(a, true)} ${DASH} ${dateBare(b, true)}`);
    if (A.m === B.m) return nw(`${range2(A.d, B.d)} ${monthOf(A.m)}${year ? ` ${bdi(A.y)}` : ""}`);
    return nw(`${dateBare(a)} ${DASH} ${dateBare(b)}${year ? ` ${bdi(B.y)}` : ""}`);
  }
  // A period in a sentence names each month/year once (decisions 14 and 21), with words instead of a dash (decision 12).
  function periodSentence(a, b, span, single) {
    const A = partsOf(a), B = partsOf(b);
    return a === b ? single(dateText(b, true))
      : A.y !== B.y ? span(dateText(a, true), dateText(b, true))
      : A.m === B.m ? span(nw(bdi(A.d)), dateText(b, true))
      : span(dateText(a), dateText(b, true));
  }
  const emptyPeriod = () => periodSentence(model.a, model.b, L.emptyTable, L.emptyDay);
  const periodWords = (a, b) => periodSentence(a, b,
    (start, end) => `${L.spanFrom} ${start} ${L.spanTo} ${end}`, (date) => date);
  const plain = (html) => html.replace(/<[^>]+>/g, "");

  /* ------------------------------------------------------------ the gym and its history */
  const DAY = 1140;                         // 6:00 AM to 1:00 AM next day, gym time (Riyadh), as on the Daily page
  const HOURS = 19;                         // the pattern's hour columns: 6 AM ... 12 AM
  const openAt = (wd) => (wd === 5 ? 480 : 0); // Friday opens at 2:00 PM; every other day at 6:00 AM
  const LAST_FULL = toDn("2026-09-22");     // the last complete business day (the Daily page is Wednesday 23 September)
  const FIRST_DAY = toDn("2026-08-02");     // the full history starts on Sunday 2 August 2026
  const HIST_START = STATE === "short" ? toDn("2026-09-13") : FIRST_DAY; // short: readings since Sunday 13 September
  const CAPACITY = 80;                      // owner-private, as on the Daily page; used only in the CSV's capacity_snapshot
  const SETTINGS_VERSION = 1;
  const TZ = "Asia/Riyadh";                 // UTC+3 all year
  const MAX_RANGE = 366;
  const MIN_DAYS = 3;                       // a pattern slot needs 3 days to be certain (PAT-10, GLO-12; Q5)
  const levelOf = (v) => (v <= 24 ? 0 : v <= 48 ? 1 : v <= 68 ? 2 : 3);
  const BAND = ["quiet", "moderate", "busy", "packed"];
  // Camera outages: open minutes with no reading (minutes since 6:00 AM, inclusive).
  const MISSING = { [toDn("2026-09-17")]: [[240, 479]], [toDn("2026-08-31")]: [[252, 280]] };
  // K-02, `pending`: the edge went offline at 9:10 PM on Tuesday 22 September and buffers since; the rest of that day is
  // not received yet (not missing: it backfills on reconnect). The received part counts in the period's figures, and
  // the day notes what it still waits for (DECISIONS item 14).
  const PEND = PAGE === "pending" ? { [LAST_FULL]: [[910, DAY - 1]] } : {};

  // The Daily page's seeded minute simulation, generalised to an opening minute and a quiet start. With open 0 and
  // quiet 10 it is exactly the Daily page's simulateDay (same random draws), so the four Wednesdays it averages as
  // "usual" (26 August and 2, 9, 16 September) are the same days here.
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
    const z = m - p.open;
    if (z < p.quiet) return 0;
    const ramp = ss((z - (p.quiet - 1)) / 22);
    const base = 7 * ss((z - p.quiet) / 60) * (1 - ss((m - 1000) / 140));
    return ramp * (p.am * bump(m, p.amAt, 34, 44) + p.mid * bump(m, p.midAt, 70, 70) + p.pm * bump(m, p.pmAt, 105, 125)) + base;
  }
  function simulate(seed, p) {
    const rnd = mulberry32(seed);
    const poisson = (l) => { if (l <= 0) return 0; const lim = Math.exp(-l); let k = 0, q = 1; do { k++; q *= rnd(); } while (q > lim); return k - 1; };
    const occ = new Array(DAY).fill(null), ent = new Array(DAY).fill(0), ext = new Array(DAY).fill(0);
    let o = 0, prevT = 0;
    for (let m = p.open; m < DAY; m++) {
      const z = m - p.open;
      const T = target(m, p);
      let lam = z < p.quiet ? 0 : Math.max(0, T - prevT * (63 / 64));
      if (z === p.quiet) lam = Math.max(lam, 1.2);
      let x = 0;
      for (let i = 0; i < o; i++) if (rnd() < 1 / 64) x++;
      const e = poisson(lam);
      o = o - x + e;
      occ[m] = o; ent[m] = e; ext[m] = x; prevT = T;
    }
    return { occ, ent, ext };
  }
  const DAILY_SEED = 15983;
  // The Daily page's last four Wednesdays: seed offset and shape (16, 9, 2 September and 26 August).
  const PAST_WED = {
    [toDn("2026-09-16")]: { k: 1, f: 0.78, a: 0.95, at: 762 },
    [toDn("2026-09-09")]: { k: 2, f: 0.74, a: 1.0, at: 747 },
    [toDn("2026-09-02")]: { k: 3, f: 0.8, a: 0.98, at: 757 },
    [toDn("2026-08-26")]: { k: 4, f: 0.76, a: 1.03, at: 752 },
  };
  // Each weekday's own shape. Thursday evenings are the busiest; Friday opens after midday; on Saturday nobody comes
  // before 7:00 AM (a genuine zero hour); Wednesday is the Daily page's usual Wednesday.
  const SHAPE = [
    { am: 21, amAt: 84, mid: 8, midAt: 420, pm: 43, pmAt: 752 },
    { am: 22, amAt: 82, mid: 8, midAt: 420, pm: 45, pmAt: 748 },
    { am: 20, amAt: 84, mid: 8, midAt: 420, pm: 42, pmAt: 758 },
    { am: 22, amAt: 82, mid: 8, midAt: 420, pm: 41, pmAt: 755 },
    { am: 19, amAt: 86, mid: 7, midAt: 430, pm: 47, pmAt: 772 },
    { am: 0, amAt: 0, mid: 11, midAt: 580, pm: 40, pmAt: 812 },
    { am: 13, amAt: 215, mid: 9, midAt: 440, pm: 35, pmAt: 745 },
  ];
  const DAYS = new Map(); // day number -> the simulated day, for every day from FIRST_DAY to LAST_FULL
  for (let dn = FIRST_DAY; dn <= LAST_FULL; dn++) {
    const wd = wdOf(dn), open = openAt(wd), w = PAST_WED[dn];
    let sim;
    if (w) {
      sim = simulate(DAILY_SEED + 1000 * w.k, { open: 0, quiet: 10, am: 22 * w.a, amAt: 82, mid: 8, midAt: 420, pm: 53 * w.f, pmAt: w.at });
    } else {
      const j = mulberry32(40000 + dn), s = SHAPE[wd], t = dn - FIRST_DAY;
      // A gentle rise over the summer, and a busier last week (the start of the autumn season).
      const g = (0.93 + 0.0016 * t + (dn >= toDn("2026-09-16") ? 0.08 : 0)) * (0.95 + 0.1 * j());
      sim = simulate(90001 + dn, { open, quiet: wd === 6 ? 60 : 10, am: s.am * g, amAt: s.amAt + Math.round(8 * (j() - 0.5)), mid: s.mid, midAt: s.midAt, pm: s.pm * g, pmAt: s.pmAt + Math.round(20 * (j() - 0.5)) });
    }
    const miss = MISSING[dn] || [], pend = PEND[dn] || [];
    const obs = (m) => m >= open && m < DAY && !miss.some(([a, b]) => m >= a && m <= b) && !pend.some(([a, b]) => m >= a && m <= b);
    let observed = 0, total = 0, peak = -1, peakM = -1, entries = 0;
    for (let m = open; m < DAY; m++) {
      if (!obs(m)) continue;
      observed++; total += sim.occ[m]; entries += sim.ent[m];
      if (sim.occ[m] > peak) { peak = sim.occ[m]; peakM = m; }
    }
    DAYS.set(dn, { dn, wd, open, ...sim, miss, pend, obs, observed, total, peak, peakM, entries, expected: DAY - open });
  }
  // A day as the reports see it: before the history starts it has no readings (its open minutes are missing).
  const hasReadings = (dn) => dn >= HIST_START && dn <= LAST_FULL;
  function dayModel(dn) {
    const wd = wdOf(dn), open = openAt(wd);
    if (!hasReadings(dn)) return { dn, wd, open, expected: DAY - open, observed: 0, total: 0, peak: null, peakM: null, entries: 0, avg: null, miss: [], pend: [], none: true };
    const d = DAYS.get(dn);
    return { dn, wd, open, expected: d.expected, observed: d.observed, total: d.total, peak: d.observed ? d.peak : null, peakM: d.observed ? d.peakM : null, entries: d.entries, avg: d.observed ? d.total / d.observed : null, miss: d.miss, pend: d.pend, none: false };
  }

  /* ------------------------------------------------------------ the period's model
   * The same semantics as the reporting domain: a pattern cell is closed when no minute of it is open in the period,
   * no data when it is open but has no reading (or its weekday is not in the period), and otherwise the mean of the
   * observed minutes. A genuine zero is a cell whose readings are all 0. */
  function buildModel(a, b) {
    const days = [];
    for (let dn = a; dn <= b; dn++) days.push(dayModel(dn));
    const heat = [];
    for (let wd = 0; wd < 7; wd++) {
      const row = [];
      const ofDay = days.filter((d) => d.wd === wd);
      for (let c = 0; c < HOURS; c++) {
        let expected = 0, observed = 0, total = 0;
        const samples = new Set();
        for (const d of ofDay) {
          for (let m = c * 60; m < c * 60 + 60; m++) {
            if (m < d.open) continue;
            expected++;
            if (d.none) continue;
            const sim = DAYS.get(d.dn);
            if (!sim.obs(m)) continue;
            observed++; total += sim.occ[m]; samples.add(d.dn);
          }
        }
        const state = !ofDay.length ? "missing" : !expected ? "closed" : !observed ? "missing" : "value";
        row.push({ wd, c, state, avg: state === "value" ? total / observed : null, samples: samples.size, observed, expected });
      }
      heat.push(row);
    }
    let observed = 0, total = 0, entries = 0, withReadings = 0, top = null;
    days.forEach((d) => {
      observed += d.observed; total += d.total; entries += d.entries;
      if (d.observed) withReadings++;
      if (d.peak != null && (!top || d.peak >= top.peak)) top = d;
    });
    // "Busiest" is the one-hour slot with the highest average across 3 days or more (GLO-12, Q5); a slot drawn from fewer
    // days is qualified on the pattern (PAT-10) and never named busiest, so a 7-day period has none (TRU-2).
    let busiest = null;
    heat.flat().forEach((cell) => { if (cell.state === "value" && cell.samples >= MIN_DAYS && (!busiest || cell.avg > busiest.avg)) busiest = cell; });
    return { a, b, n: b - a + 1, days, heat, observed, total, entries, withReadings, avg: observed ? total / observed : null, top, busiest };
  }

  // Week over week (the reporting domain's rule): the last seven complete business days against the seven before,
  // compared only when both weeks have readings for at least 80% of their open minutes.
  const WOW = { cur: [LAST_FULL - 6, LAST_FULL], prev: [LAST_FULL - 13, LAST_FULL - 7], minCoverage: 0.8 };
  function weekMetrics([a, b]) {
    let observed = 0, expected = 0, total = 0, entries = 0;
    for (let dn = a; dn <= b; dn++) { const d = dayModel(dn); observed += d.observed; expected += d.expected; total += d.total; entries += d.entries; }
    return { observed, expected, coverage: expected ? observed / expected : 0, avg: observed ? total / observed : null, entries };
  }
  const wow = (() => {
    const cur = weekMetrics(WOW.cur), prev = weekMetrics(WOW.prev);
    const comparable = cur.coverage >= WOW.minCoverage && prev.coverage >= WOW.minCoverage;
    // K-02, `pending`: the last 7 days are not whole until the buffered evening arrives, so the comparison waits («قيد
    // الانتظار», CRD-10's sentence).
    return {
      cur, prev, comparable, pending: PAGE === "pending",
      avgChange: comparable ? ((cur.avg - prev.avg) / prev.avg) * 100 : null,
      entriesChange: comparable ? ((cur.entries - prev.entries) / prev.entries) * 100 : null,
    };
  })();

  /* ------------------------------------------------------------ motion settings
   * Reports has no load motion. Motion is on unless the system asks for reduced motion or the URL says ?motion=off;
   * then every change (the rail, a dialog, the switch) is instant. The interaction motion (dialogs, popovers, labels,
   * the export's done state) is motion.js's, shared by every Owner page (DECISIONS item 36). */
  const URL_OFF = params.get("motion") === "off";
  const mqReduce = matchMedia("(prefers-reduced-motion: reduce)");
  const motionOn = () => !URL_OFF && !mqReduce.matches;
  const M = window.EclipseMotion;
  root.dataset.motion = motionOn() ? "on" : "off";
  const EASE = { rail: "cubic-bezier(0.22, 1, 0.36, 1)", railClose: "cubic-bezier(0.4, 0, 0.2, 1)" };
  const T = { railOpen: 240, railClose: 200, railDist: 156, railReveal: 12 };
  const f2 = (n) => n.toFixed(2);

  /* ---------------------------------------------------------------- the range
   * The period is in the URL (range=7d|28d, or from and to), so a reload and the language link keep it. */
  const PRESETS = { "7d": 7, "28d": 28 };
  const parseIso = (s) => (/^\d{4}-\d{2}-\d{2}$/.test(s || "") && isoOf(toDn(s)) === s ? toDn(s) : null);
  let range = (() => {
    const a = parseIso(params.get("from")), b = parseIso(params.get("to"));
    if (a != null && b != null && a <= b && b <= LAST_FULL && b - a + 1 <= MAX_RANGE) return { kind: "custom", a, b };
    const k = PRESETS[params.get("range")] ? params.get("range") : "28d";
    return { kind: k, a: LAST_FULL - PRESETS[k] + 1, b: LAST_FULL };
  })();
  let model = buildModel(range.a, range.b);
  function urlFor(extra = {}) {
    const p = new URLSearchParams(location.search);
    ["range", "from", "to", "dialog"].forEach((k) => p.delete(k));
    if (range.kind === "custom") { p.set("from", isoOf(range.a)); p.set("to", isoOf(range.b)); } else if (range.kind !== "28d") p.set("range", range.kind);
    Object.entries(extra).forEach(([k, v]) => p.set(k, v));
    return p;
  }

  /* ---------------------------------------------------------------- shell */
  document.title = L.docTitle;
  document.querySelectorAll("[data-t]").forEach((el) => { const v = L[el.dataset.t]; if (typeof v === "string") el.innerHTML = v; });
  document.querySelectorAll("[data-t-label]").forEach((el) => el.setAttribute("aria-label", L[el.dataset.tLabel]));
  const rail = $("#rail"), brand = $("#brand");
  rail.setAttribute("aria-label", L.railLabel);
  brand.setAttribute("aria-label", L.brand);
  $$(".rail-item[data-nav]").forEach((a) => {
    const key = a.dataset.nav, name = L.nav[key];
    $(".rail-name", a).textContent = name;
    a.setAttribute("aria-label", key === "lang" ? L.langAria : name);
    if (a.hasAttribute("data-inert")) a.addEventListener("click", (e) => e.preventDefault());
  });
  $("#lang-glyph").textContent = L.langGlyph;
  $("#lang-glyph").setAttribute("lang", "en");
  // The Daily page keeps the language (and ?motion=off); the language links keep everything, the period included.
  {
    const p = new URLSearchParams({ lang: LANG });
    if (URL_OFF) p.set("motion", "off");
    $("#daily-link").setAttribute("href", `index.html?${p}`);
    $("#tab-daily").setAttribute("href", `index.html?${p}`);
    // Activity log (activity.html) the same way.
    $("#activity-link").setAttribute("href", `activity.html?${p}`);
    $("#tab-activity").setAttribute("href", `activity.html?${p}`);
  }
  const langLink = $("#lang-link"), menuLang = $("#menu-lang");
  for (const el of [langLink, menuLang]) el.setAttribute("hreflang", RTL ? "en" : "ar");
  $(".rail-name", langLink).setAttribute("lang", RTL ? "en" : "ar");
  function syncUrl() {
    const p = urlFor();
    try { history.replaceState(null, "", `${location.pathname}${p.toString() ? `?${p}` : ""}`); } catch (e) { /* file:// may refuse; links still carry the period */ }
    const q = urlFor({ lang: RTL ? "en" : "ar" });
    langLink.setAttribute("href", `?${q}`);
    menuLang.setAttribute("href", `?${q}`);
  }

  /* ---- rail: the Daily page's rail and its motion (app.js "rail"), unchanged. */
  let railOpen = false;
  const railRun = { anims: [], surface: null, open: false };
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
    const rr = rail.getBoundingClientRect(), closedW = rr.width - T.railDist;
    rail.querySelectorAll(".rail-name").forEach((n) => {
      const bx = n.getBoundingClientRect();
      const a = RTL ? rr.right - bx.right : bx.left - rr.left, w = bx.width;
      const p0 = Math.min(1, Math.max(0, (a + T.railReveal - closedW) / T.railDist));
      const p1 = Math.min(1, Math.max(p0, (a + w + T.railReveal - closedW) / T.railDist));
      const clip = (hidden) => { const e = f2(hidden ? w + 8 : -8); return RTL ? `inset(-8px -8px -8px ${e}px)` : `inset(-8px ${e}px -8px -8px)`; };
      const frames = [{ offset: 0, clipPath: clip(1) }, { offset: p0, clipPath: clip(1) }, { offset: p1, clipPath: clip(0) }, { offset: 1, clipPath: clip(0) }];
      an.push(n.animate(open ? frames : frames.map((k) => ({ ...k, offset: 1 - k.offset })).reverse(), o));
    });
    railRun.anims = an;
    Promise.all(an.map((x) => x.finished)).then(() => { if (railRun.anims === an) finishRail(); }).catch(() => {});
  }

  /* ---- the frame (step 4: Reports takes Daily's frame, app.js "the frame"). Breakpoints: the desktop rail at 1024 px
   * and wider (it opens over the content); the same rail from 721 to 1023 px, where it opens as a modal layer (a scrim,
   * the content inert, focus kept inside); at 720 px and below the bar at the bottom and the compact header, whose menu
   * holds Monitoring, the language and sign out. At every size the header's status opens Operations' details: the one
   * way to Operations, which has no section in the rail (user 2026-10-01). Every layer opens from the keyboard, closes
   * with Escape and returns focus to the control that opened it. */
  const mqTablet = matchMedia("(min-width: 721px) and (max-width: 1023px)");
  const mqPhone = matchMedia("(max-width: 720px)");
  const scrim = $("#rail-scrim");
  const railFocusables = () => [...rail.querySelectorAll("button, a[href]")];
  let railModal = false, scrimFade = null;
  const setRailModal = (on) => {
    if (on === railModal) return;
    railModal = on;
    for (const el of [$("#main"), $(".skip")]) el.inert = on;
    if (scrimFade) { scrimFade.cancel(); scrimFade = null; }
    scrim.style.pointerEvents = on ? "" : "none";
    if (on) scrim.hidden = false;
    if (!motionOn() || scrim.hidden) { scrim.hidden = !on; return; }
    const run = scrim.animate(on ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }],
      on ? { duration: T.railOpen, easing: EASE.rail } : { duration: T.railClose, easing: EASE.railClose, fill: "forwards" });
    scrimFade = run;
    run.finished.then(() => { if (scrimFade !== run) return; scrimFade = null; if (!on) { scrim.hidden = true; run.cancel(); } }).catch(() => {});
  };
  const setRail = (open) => {
    if (open === railOpen) return;
    railOpen = open;
    brand.setAttribute("aria-expanded", String(open));
    setRailModal(open && mqTablet.matches);
    animateRail(open);
  };
  brand.addEventListener("click", () => setRail(!railOpen));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && railOpen && !openDlg) { setRail(false); brand.focus(); } });
  document.addEventListener("pointerdown", (e) => { if (railOpen && !rail.contains(e.target)) setRail(false); });
  // On the desktop the open rail is not modal: when keyboard focus leaves it, it closes (FOC-3).
  rail.addEventListener("focusout", (e) => { if (railOpen && !railModal && e.relatedTarget && !rail.contains(e.relatedTarget)) setRail(false); });
  rail.addEventListener("keydown", (e) => {
    if (e.key !== "Tab" || !railModal) return;
    const f = railFocusables(), i = f.indexOf(document.activeElement);
    const next = e.shiftKey ? (i <= 0 ? f[f.length - 1] : null) : (i === f.length - 1 ? f[0] : null);
    if (next) { e.preventDefault(); next.focus(); }
  });

  // The status's details (every size) and the phone's menu. One is open at a time; each closes with Escape (focus
  // returns to its button), a tap outside, or focus leaving it.
  const layers = { ops: { btn: $("#ops-btn"), pop: $("#ops-pop") }, menu: { btn: $("#menu-btn"), pop: $("#menu-pop") } };
  let openLayer = null;
  const menuItems = () => [...layers.menu.pop.querySelectorAll('[role="menuitem"]')];
  // Each unrolls from its control and rolls back up (motion.js); focus moves at once either way.
  function showLayer(name, focus = "first") {
    // One panel replacing another: the old one goes at once, so the two never overlap while one leaves.
    if (openLayer && openLayer !== name) hideLayer(openLayer, false, true);
    const { btn, pop } = layers[name];
    openLayer = name;
    pop.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    if (name === "menu") { const it = menuItems(); (focus === "last" ? it[it.length - 1] : it[0]).focus(); }
    else pop.focus();
    M.popOpen(pop);
  }
  function hideLayer(name, returnFocus, instant = false) {
    const { btn, pop } = layers[name];
    if (pop.hidden) return;
    if (!instant) M.popClose(pop);
    pop.hidden = true;
    btn.setAttribute("aria-expanded", "false");
    if (openLayer === name) openLayer = null;
    if (returnFocus) btn.focus();
  }
  for (const [name, { btn, pop }] of Object.entries(layers)) {
    btn.addEventListener("click", () => (pop.hidden ? showLayer(name) : hideLayer(name, true)));
    pop.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.stopPropagation(); hideLayer(name, true); } });
    pop.addEventListener("focusout", (e) => { if (!pop.hidden && !pop.contains(e.relatedTarget) && e.relatedTarget !== btn && e.relatedTarget) hideLayer(name, false); });
  }
  layers.menu.btn.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); showLayer("menu", e.key === "ArrowUp" ? "last" : "first"); }
  });
  layers.menu.pop.addEventListener("keydown", (e) => {
    const it = menuItems(), i = it.indexOf(document.activeElement);
    const go = (j) => { e.preventDefault(); it[(j + it.length) % it.length].focus(); };
    if (e.key === "ArrowDown") go(i + 1);
    else if (e.key === "ArrowUp") go(i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(it.length - 1);
    else if (e.key === "Tab") hideLayer("menu", true);
    else if (e.key === " ") { e.preventDefault(); document.activeElement.click(); }
  });
  for (const id of ["#menu-signout", "#menu-monitoring", "#ops-link"]) $(id).addEventListener("click", (e) => e.preventDefault());
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && openLayer && !openDlg) hideLayer(openLayer, true); });
  document.addEventListener("pointerdown", (e) => {
    if (!openLayer) return;
    const { btn, pop } = layers[openLayer];
    // A press on the other panel's control replaces this one: it goes at once, so the two never overlap.
    if (!pop.contains(e.target) && !btn.contains(e.target)) hideLayer(openLayer, false, Object.values(layers).some((l) => l.btn.contains(e.target)));
  });
  // Crossing a breakpoint closes whatever the frame has open.
  const onFrameChange = () => { if (railOpen) setRail(false); setRailModal(false); if (openLayer) hideLayer(openLayer, false, true); };
  mqTablet.addEventListener("change", onFrameChange);
  mqPhone.addEventListener("change", onFrameChange);
  layers.menu.btn.setAttribute("aria-label", L.more);
  $("#menu-lang-glyph").textContent = L.langGlyph;
  $("#menu-lang-glyph").setAttribute("lang", "en");
  $("#menu-lang-name").textContent = L.nav.lang;
  $("#menu-lang-name").setAttribute("lang", RTL ? "en" : "ar");
  $("#menu-signout-name").textContent = L.nav.signout;
  $("#menu-monitoring-name").textContent = L.nav.monitoring;
  $("#ops-link-name").textContent = L.nav.operations;
  $("#tabbar").setAttribute("aria-label", L.railLabel);
  $$(".tb-item[data-tab]").forEach((a) => {
    const key = a.dataset.tab;
    $(".tb-name", a).textContent = L.tabs[key];
    a.setAttribute("aria-label", L.nav[key]);
    if (a.hasAttribute("data-inert")) a.addEventListener("click", (e) => e.preventDefault());
  });

  // The frame's status, the same as on every screen (STW-1): the gym's Operations status, not this page's. In the concept
  // it is Daily's moment, live with its last reading at 7:42 PM on Wednesday 23 September; its page states (loading,
  // closed, unavailable, error) come with Reports' own states in a later round (K-02).
  const NOW = { last: 822 };   // 7:42 PM, in minutes since 6:00 AM, as on the Daily page
  // K-02: the Daily page's status words and marks (STW-1), for Reports' own states. Delayed is Daily's moment (the last
  // reading 7:29 PM, 13 minutes ago); Closed is 5:12 AM, before the 6:00 AM opening; Offline (`unavailable`, and
  // `pending`, whose edge has been offline since the evening before) has no count and no time; Error is the page's
  // payload failing. While the page loads the status is not known (STW-2): the control is set aside for the words.
  const SVG_CLOCK = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.2"/><path d="M12 7.6V12l3 2"/></svg>`;
  const SVG_OFF = `<svg class="ico ico-off" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.2"/><path d="M6.3 17.7 17.7 6.3"/></svg>`;
  const SVG_ERR = `<svg class="ico ico-err" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.4"/><path d="M12 7.6v5.4M12 16.2v.2"/></svg>`;
  const OPS_STATES = {
    live: (m = NOW.last) => ({ cls: "", mark: `<span class="dot" aria-hidden="true"></span>`, word: L.live, line: `${L.lastReading} ${timeText(m)}` }),
    delayed: (m = NOW.last - 13) => ({ cls: "is-delayed", mark: SVG_CLOCK, word: L.delayed, line: `${L.lastReading} ${timeText(m)}`, ago: L.ago(13) }),
    closed: () => ({ cls: "is-closed", mark: `<span class="dot ring" aria-hidden="true"></span>`, word: L.closedWord, line: L.opens(timeText(0)) }),
    offline: () => ({ cls: "is-off", mark: SVG_OFF, word: L.offline, line: L.noCount }),
    error: () => ({ cls: "is-err", mark: SVG_ERR, word: L.errorWord, line: L.errorLine, detail: `${L.errorFull}. ${L.errorHint}` }),
  };
  const opsState = () => (phase === "error" || phase === "retrying" ? "error" : pageNow === "unavailable" || pageNow === "pending" ? "offline"
    : pageNow === "closed" || pageNow === "delayed" ? pageNow : "live");
  let statusLoad = null;
  function renderStatus() {
    const btn = layers.ops.btn;
    // STW-2: while the page loads, the words «جارٍ التحميل…» stand where the control will be, boxless and not a control.
    const loading = phase === "loading";
    if (loading && !statusLoad) { statusLoad = Object.assign(document.createElement("span"), { className: "hb-load", textContent: L.loadingWord }); btn.before(statusLoad); }
    if (!loading && statusLoad) { statusLoad.remove(); statusLoad = null; }
    btn.hidden = loading;
    const s = OPS_STATES[opsState()]();
    btn.className = `hbadge${s.cls ? ` ${s.cls}` : ""}`;
    const words = (x) => `${x.mark}<span class="hb-word">${x.word}</span>` +
      `<span class="hb-line"><span class="sr-only">${RTL ? "، " : ", "}</span><span aria-hidden="true">· </span>${x.line}</span>`;
    // K-02 (DECISIONS item 14): from 721 px the status's slot is as wide as the widest status, which unseen copies of
    // every status hold (style.css .hb-res), so loading, its arrival, a retry and any status change keep the control's
    // place and the slot's size; the control itself is as wide as its own status (HDR-3), so its fill and its ring fit
    // the status, at the slot's inline end, where the loading words stand too. On a phone only the control is drawn.
    $("#ops-btn-state").innerHTML = `<span class="sr-only">${L.opsTitle}: </span>${words(s)}`;
    // Decision 24: the same verified 10:44 AM / «10:44 ص» exemplar as Daily, with no synchronous minute scan.
    $("#ops-res").innerHTML = Object.values(OPS_STATES).map((f) => `<span class="hb-r">${words(f(284))}<svg class="hb-chev" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 10l5 5 5-5"/></svg></span>`).join("");
    $("#ops-state").className = `ops-state${s.cls ? ` ${s.cls}` : ""}`;
    $("#ops-state").innerHTML = `${s.mark}<span>${s.word}</span>`;
    $("#ops-last").innerHTML = s.detail || s.line + (s.ago ? `<span class="sep" aria-hidden="true">·</span><span class="ops-ago">${SR_SEP}${s.ago}</span>` : "");
    $("#ops-hours").innerHTML = `${L.hours} ${timeRange(0, DAY)}`;
  }

  const say = (text) => { const el = $("#say"); el.textContent = ""; requestAnimationFrame(() => { el.textContent = text; }); };

  /* ---------------------------------------------------------------- icons */
  const ICON = {
    up: `<svg class="trend" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 16.5l5.2-5.2 3.6 3.6L20 7.7"/><path d="M14.6 7.7H20v5.4"/></svg>`,
    down: `<svg class="trend" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7.5l5.2 5.2 3.6-3.6L20 16.3"/><path d="M14.6 16.3H20v-5.4"/></svg>`,
    same: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 9.5h14M5 14.5h14"/></svg>`,
    info: `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.4"/><path d="M12 11v5.2M12 7.8v.2"/></svg>`,
    gap: `<svg class="ico ico-gap" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="5" cy="12" r="1.3"/><circle cx="9.7" cy="12" r="1.3"/><circle cx="14.3" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/></svg>`,
    alert: `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.4"/><path d="M12 7.6v5.4M12 16.2v.2"/></svg>`,
    sort: SORT_ICO,
    file: `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 3.8h6.6L18.5 8.7v10.1a1.4 1.4 0 0 1-1.4 1.4H7a1.4 1.4 0 0 1-1.4-1.4V5.2A1.4 1.4 0 0 1 7 3.8Z"/><path d="M13.4 3.8v5h5.1"/></svg>`,
    check: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6.5 12.4l3.6 3.6 7.4-7.6"/></svg>`,
    down2: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 4.5v10.2M7.8 10.6 12 14.8l4.2-4.2"/><path d="M5 16.5v1.4a1.6 1.6 0 0 0 1.6 1.6h10.8a1.6 1.6 0 0 0 1.6-1.6v-1.4"/></svg>`,
  };
  const levelChip = (v) => {
    const li = levelOf(v);
    return `<span class="level"><span class="bars" aria-hidden="true">${[0, 1, 2, 3].map((i) => `<i class="${i <= li ? "on" : ""}"></i>`).join("")}</span>${L.levels[li]}</span>`;
  };

  /* ---------------------------------------------------------------- header */
  const segButtons = $$("#range-seg .seg-b");
  segButtons.forEach((btn) => { btn.innerHTML = L.seg[btn.dataset.range]; });
  // The subtitle (step 4 phase B, user 2026-10-01): a preset's length is already its pressed segment's name ("Last 28
  // days"), so a preset's subtitle is its dates alone; a custom period keeps its length. Readings on fewer days than the
  // period has are a fact about the figures, not its length, so that part stays with a preset too.
  function renderHead() {
    const n = model.n, custom = range.kind === "custom";
    const sep = `<span class="sep" aria-hidden="true">·</span>${SR_SEP}`;
    // K-02: while the page loads or could not load, the period's dates and a custom period's length are the request,
    // real text from the first paint; how many days have readings comes with the payload.
    const tail = phase !== "ready" ? (custom ? L.days(n) : "")
      : model.withReadings === n ? (custom ? L.days(n) : "")
      : model.withReadings ? L.daysWith(model.withReadings, n)
      : custom ? `${L.noReadings}${sep}${L.days(n)}` : L.noReadings;
    $("#sub").innerHTML = `<span class="sub-part">${rangeText(model.a, model.b)}</span>${tail ? `${sep}<span class="sub-part">${tail}</span>` : ""}`;
    segButtons.forEach((btn) => btn.setAttribute("aria-pressed", String(btn.dataset.range === range.kind)));
    $("#period-name").innerHTML = rangeText(model.a, model.b);
  }

  /* ---------------------------------------------------------------- at a glance
   * The period's three figures share one card (the period's), under the period control: its average inside (no level
   * badge on an average over many hours, LVL-2), its highest peak with the day and time in the meta slot (DAT-5) and
   * its level, and its entries with the daily rate. "Last 7 days" is its own card beside them, outside the period's row
   * (TRU-1, TRU-7): the last 7 complete days against the 7 before, whatever the period. It carries the page's summary
   * light while it has a complete value, and is a plain card while it has none (LGT-7, LGT-8). Every figure keeps its
   * slots' heights in every state: the value's line 46, the foot 42 (CRD-9, CRD-10). */
  const trendCard = $("#card-trend");
  function renderCards() {
    $("#trend-meta").innerHTML = rangeText(WOW.cur[0], WOW.cur[1], false);
    const tb = $("#trend-body");
    if (wow.pending) {
      tb.innerHTML = `<p class="stat-value"><span class="stat-say">${L.pending}</span></p><div class="stat-foot"></div>`;
    } else if (wow.comparable) {
      const c = wow.avgChange, kind = c >= 5 ? "busier" : c <= -5 ? "quieter" : "same";
      // The value and its measure. The span it compares with is not written beside it: the owner reads the comparison
      // without it, and it made the card too full (Q17, rejected by the user on 2026-10-01); the card's description keeps
      // both spans for assistive technology.
      tb.innerHTML = `<p class="stat-value"><bdi class="num">${pct(c)}</bdi><span class="unit">${L.wowUnit}</span></p>
        <div class="stat-foot"><span class="cmp cmp-${kind}">${kind === "busier" ? ICON.up : kind === "quieter" ? ICON.down : ICON.same}${L.cmp[kind]}</span><span class="stat-aside">${L.wowEntries(bdi(pct(wow.entriesChange)))}</span></div>`;
    } else {
      tb.innerHTML = `<p class="stat-value"><span class="stat-say">${L.wowEmpty}</span></p><div class="stat-foot"><span class="stat-aside">${L.wowEmptyNote()}</span></div>`;
    }
    // "Last 7 days" is plain in every period: Reports keeps only the pattern's data light (OWN-R6, user 2026-10-01, Q13).
    trendCard.setAttribute("aria-description", plain(L.wowSay(periodWords(WOW.cur[0], WOW.cur[1]), periodWords(WOW.prev[0], WOW.prev[1]))));

    const none = (id) => { $(id).innerHTML = `<p class="stat-value"><span class="stat-say">${L.noReadings}</span></p><div class="stat-foot"></div>`; };
    if (model.avg == null) { none("#avg-body"); none("#peak-body"); $("#peak-meta").innerHTML = ""; }
    else {
      $("#avg-body").innerHTML = `<p class="stat-value"><bdi class="num">${Math.round(model.avg)}</bdi></p><div class="stat-foot"></div>`;
      const t = model.top;
      $("#peak-meta").innerHTML = `${dayText(t.dn)}<span class="sep" aria-hidden="true">·</span>${SR_SEP}${timeText(t.peakM)}`;
      $("#peak-body").innerHTML = `<p class="stat-value"><bdi class="num">${t.peak}</bdi></p><div class="stat-foot">${levelChip(t.peak)}</div>`;
    }
    if (!model.withReadings) none("#entries-body");
    else $("#entries-body").innerHTML = `<p class="stat-value"><bdi class="num">${fmtInt(model.entries)}</bdi></p><div class="stat-foot"><span class="stat-aside">${L.entriesNote(bdi(fmtInt(model.entries / model.withReadings)))}</span></div>`;
  }

  /* ---------------------------------------------------------------- the pattern
   * A real table: weekdays are row headers, hours are column headers, and every cell's value is its text. Closed and
   * no-data runs are merged cells that say so. The colour is a single-hue ramp from FITWAY's light ramp (oxblood to
   * FITWAY red to #FF2946); closed and no data are neutral, and a genuine zero is an outlined cell with "0". It is a
   * grid (one Tab stop, arrow keys between cells), and hover, keyboard focus and a tap show the same readout. */
  const RAMP = [[0, [29, 11, 14]], [8, [58, 10, 19]], [16, [77, 7, 19]], [28, [126, 13, 31]], [40, [184, 19, 43]], [52, [229, 25, 53]], [64, [255, 41, 70]]];
  function rampColor(v) {
    if (v >= RAMP[RAMP.length - 1][0]) return RAMP[RAMP.length - 1][1];
    let i = 0;
    while (i < RAMP.length - 2 && v > RAMP[i + 1][0]) i++;
    const [a, ca] = RAMP[i], [b, cb] = RAMP[i + 1], k = Math.max(0, Math.min(1, (v - a) / (b - a)));
    return ca.map((x, j) => Math.round(x + (cb[j] - x) * k));
  }
  const heat = $("#heat"), heatScroll = $("#heat-scroll"), heatTip = $("#heat-tip");
  let heatSlots = [];      // [weekday][hour] -> the cell element covering that slot, in either form
  let heatCur = null;      // { r, c } of the roving cell
  let heatWant = 0;        // the hour a move between weekdays aims for
  const valText = (v) => (v > 0 && v < 0.5 ? "<1" : String(Math.round(v)));
  /* The pattern's two forms. From 1280 px, the week at once: a row per weekday and a column per hour (1440's grid).
   * Below 1280 px, one day at a time (the user's pick of 2026-10-01, option B, carried up to 1279 px by the user's
   * decision on K-39 the same day, so every target keeps 44 px): a week strip chooses the weekday, and that day's 19
   * hours are drawn as labelled bars on one scale for the whole week, so a quieter day looks quieter; closed and
   * no-reading hours are one worded row each, one sentence with the words first. It opens on the busiest weekday (with no
   * busiest hour, as in 7 days, on the day of the highest peak). Nothing in it needs a tap to be read: every bar prints
   * its number. Crossing 1280 px redraws the pattern in that size's form. */
  const mqWide = matchMedia("(min-width: 1280px)");
  const dayForm = () => !mqWide.matches;
  function heatCell(wd, c, run) {
    const cell = model.heat[wd][c];
    const span = run[1] - run[0] + 1, spanAttr = span > 1 ? ` colspan="${span}"` : "";
    if (cell.state === "value") {
      const z = cell.avg === 0;
      const col = rampColor(cell.avg);
      const top = model.busiest && model.busiest.wd === wd && model.busiest.c === c ? " is-top" : "";
      // PAT-10: a slot drawn from fewer than 3 days keeps its colour under a fine hatch of the card's base.
      const few = !z && cell.samples < MIN_DAYS ? " few" : "";
      return `<td class="hc ${z ? "zero" : "v"}${few}${top}" role="gridcell" tabindex="-1" data-r="${wd}" data-c0="${c}" data-c1="${c}"${z ? "" : ` style="--c: rgb(${col.join(" ")})"`}><span class="hv">${z ? "0" : valText(cell.avg)}</span><span class="sr-only">${RTL ? "، " : ", "}${z ? L.emptyLong : L.levels[levelOf(cell.avg)]}</span></td>`;
    }
    // PAT-5 (K-32): a closed run says so in words, a single cell included; so does a run with no readings (PAT-6). The
    // cell's word stands alone (the grid's axis gives the hours); its tooltip says the whole sentence.
    const word = cell.state === "closed" ? L.closed : L.noReadings;
    return `<td class="hc ${cell.state === "closed" ? "closed" : "nodata"}" role="gridcell" tabindex="-1"${spanAttr} data-r="${wd}" data-c0="${run[0]}" data-c1="${run[1]}"><span class="run">${word}</span></td>`;
  }
  // Each weekday's slots as runs: [first hour, last hour], a value slot alone, closed or no-reading slots merged.
  function heatRuns(wd) {
    const row = model.heat[wd], out = [];
    for (let c = 0; c < HOURS; ) {
      let e = c;
      if (row[c].state !== "value") while (e + 1 < HOURS && row[e + 1].state === row[c].state) e++;
      out.push([c, e]);
      c = e + 1;
    }
    return out;
  }
  function renderHeat() {
    const day = dayForm();
    $("#pattern").dataset.form = day ? "day" : "week";
    heatScroll.hidden = day;
    dayHost.hidden = !day;
    const runs = [0, 1, 2, 3, 4, 5, 6].map(heatRuns);
    const caption = `<caption class="sr-only">${L.heatCaption(periodWords(model.a, model.b))}</caption>`;
    if (day) {
      heat.innerHTML = "";
      renderDay();
    } else {
      dayHost.innerHTML = "";
      const hours = [];
      for (let c = 0; c < HOURS; c++) {
        const show = c % 3 === 0;
        hours.push(`<th scope="col" class="hh${show ? " is-shown" : ""}" role="columnheader"><span class="${show ? "hh-t" : "sr-only"}">${bdi(fmtHour(c * 60))}</span></th>`);
      }
      // Sunday first: the working week, then Friday and Saturday together.
      const rows = [0, 1, 2, 3, 4, 5, 6].map((wd) => `<tr role="row"><th scope="row" class="hd" role="rowheader">${wdLong(wd)}</th>${runs[wd].map((run) => heatCell(wd, run[0], run)).join("")}</tr>`);
      heat.innerHTML = `${caption}<colgroup><col class="col-day">${"<col>".repeat(HOURS)}</colgroup>
      <thead><tr role="row"><th scope="col" class="heat-corner" role="columnheader"><span class="sr-only">${L.dayHead}</span></th>${hours.join("")}</tr></thead>
      <tbody>${rows.join("")}</tbody>`;
    }
    // The data light stays only while the pattern holds a value: an empty period is drawn as a plain card (LGT-7, LGT-8).
    const lit = hasValues();
    $("#pattern").classList.toggle("lit", lit);
    $("#pattern").classList.toggle("lit-chart", lit);
    heatSlots = [0, 1, 2, 3, 4, 5, 6].map(() => new Array(HOURS));
    $$(".hc", heat).forEach((td) => { for (let c = +td.dataset.c0; c <= +td.dataset.c1; c++) heatSlots[+td.dataset.r][c] = td; });
    // The roving cell starts on the busiest hour (or the first cell). The day form draws no cells.
    const b = model.busiest;
    heatCur = b ? { r: b.wd, c: b.c } : { r: 0, c: 0 };
    heatWant = heatCur.c;
    const first = heatSlots[heatCur.r][heatCur.c] || $(".hc", heat);
    if (first) first.tabIndex = 0;
    hideTip();
    $("#pattern-sub").innerHTML = `<span class="ps-part">${L.patternSub}</span>${b ? `<span class="sep" aria-hidden="true">·</span><span class="ps-part">${SR_SEP}${L.busiest(wdLong(b.wd), hourRange(b.c * 60, b.c * 60 + 60))}</span>` : ""}`;
    // The key names every mark the pattern shows (TRU-2): the busiest point while there is one, the hatch while any slot
    // is drawn from fewer than 3 days. The day form writes closed and no-reading hours in words and prints every number,
    // so its key holds only the marks its bars carry, and none in an empty period, where there is nothing to explain.
    const anyFew = model.heat.flat().some((x) => x.state === "value" && x.avg > 0 && x.samples < MIN_DAYS);
    // (data-mark: a mark the data brings; while the page loads or could not load it keeps its place, unseen.)
    const marks = (b ? `<li data-mark><span class="k kt" aria-hidden="true"></span><span>${L.busiestKey}</span></li>` : "") +
      (anyFew ? `<li data-mark><span class="k kf" aria-hidden="true"></span><span>${L.fewKey}</span></li>` : "");
    $("#heat-key").innerHTML = day ? (lit ? marks : "") : `<li><span>${L.keyFewer}</span><span class="ramp" aria-hidden="true"></span><span>${L.keyMore}</span></li>
    <li><span class="k k0" aria-hidden="true">0</span><span>${L.empty}</span></li>
    <li><span class="k kc" aria-hidden="true"></span><span>${L.closed}</span></li>
    <li><span class="k kn" aria-hidden="true"></span><span>${L.noReadings}</span></li>` + marks;
    $("#heat-key").hidden = !$("#heat-key").innerHTML;
  }

  /* ---- below 1280 px: one day at a time (the user's pick of 2026-10-01, option B; up to 1279 px since K-39).
   * The week strip is a radio group, one Tab stop, the arrow keys moving between days (mirrored in Arabic), Home and End
   * to Sunday and Saturday. Each day is one bar, its busiest hour on the bars' scale in its ramp colour (the user's
   * decision 1 of 2026-10-01, the options round's form). The chosen day's 19 hours are a table of rows: the hour, its
   * bar on the week's scale and its number at the bar's end; closed and no-reading hours one row each, in one sentence.
   * An empty period is one message for the whole card (EMP-1: the icon, the sentence and the way back). */
  const dayHost = $("#pday");
  let dayWd = 0, dayKey = "";
  const hasValues = () => model.heat.some((r) => r.some((x) => x.state === "value"));
  const weekMax = () => Math.max(1, ...model.heat.flat().filter((x) => x.state === "value").map((x) => x.avg));
  const dayMax = (wd) => { const v = model.heat[wd].filter((x) => x.state === "value").map((x) => x.avg); return v.length ? Math.max(...v) : null; };
  // A weekday's bar: its busiest hour on the week's scale; a weekday whose hours are all zero a short chalk line, and
  // one with no readings at all a short dotted outline (PAT-4, PAT-6).
  function dayBar(wd, max) {
    const v = dayMax(wd);
    if (v == null) return `<span class="wk-bar is-none"></span>`;
    if (v === 0) return `<span class="wk-bar is-zero"></span>`;
    return `<span class="wk-bar" style="--h: ${(v / max).toFixed(4)}; --c: rgb(${rampColor(v).join(" ")})"></span>`;
  }
  function renderDay() {
    if (!hasValues()) {
      dayHost.innerHTML = `<div class="pday-empty">${ICON.info}<p>${emptyPeriod()}</p><button class="rbtn" type="button" data-range-go="28d"><span>${L.emptyAction}</span></button></div>`;
      return;
    }
    const key = `${model.a}-${model.b}`;
    if (key !== dayKey) { dayKey = key; dayWd = model.busiest ? model.busiest.wd : model.top ? model.top.wd : wdOf(LAST_FULL); }
    const max = weekMax();
    const strip = [0, 1, 2, 3, 4, 5, 6].map((wd) => {
      const on = wd === dayWd;
      return `<button type="button" class="wk-b" role="radio" aria-checked="${on}" tabindex="${on ? 0 : -1}" data-wd="${wd}"><span class="wk-col" aria-hidden="true">${dayBar(wd, max)}</span><span class="wk-n" aria-hidden="true">${wdStrip(wd)}</span><span class="sr-only">${wdLong(wd)}</span></button>`;
    }).join("");
    dayHost.innerHTML = `<div class="wk-strip" role="radiogroup" aria-label="${L.weekStrip}">${strip}</div><table class="hb" id="hb" role="table"></table>`;
    renderHours();
  }
  function renderHours() {
    const wd = dayWd, b = model.busiest, max = weekMax();
    const vals = model.heat[wd].filter((x) => x.state === "value").map((x) => x.avg);
    const dm = vals.length ? Math.max(...vals) : null;
    const rows = heatRuns(wd).map(([c0, c1]) => {
      const cell = model.heat[wd][c0];
      if (cell.state === "value") {
        const z = cell.avg === 0;
        const few = !z && cell.samples < MIN_DAYS ? " few" : "";
        const top = b && b.wd === wd && b.c === c0 ? " is-top" : "";
        // A bar is its ramp colour alone, with no edge (the user's decision 2 of 2026-10-01): a quiet hour's tone is close
        // to the plate's, and the number printed at its end carries its value.
        const bar = z ? `<span class="hb-zero">0</span>` : `<span class="hb-bar${few}${top}" style="--w: ${(cell.avg / max).toFixed(4)}; --c: rgb(${rampColor(cell.avg).join(" ")})"></span><span class="hb-v${cell.avg === dm ? " is-max" : ""}">${bdi(valText(cell.avg))}</span>`;
        // On the tablet the hours stand as columns and every third hour keeps its label, as 1440's axis does.
        return `<tr role="row"${c0 % 3 === 0 ? ` class="is-tick"` : ""}><th scope="row" role="rowheader" class="hb-h">${bdi(fmtHour(c0 * 60))}</th><td role="cell" class="hb-c">${bar}<span class="sr-only">${RTL ? "، " : ", "}${z ? L.emptyLong : L.levels[levelOf(cell.avg)]}</span></td></tr>`;
      }
      // A closed or no-reading run: one sentence, the words first (decision 8): «مغلق من 6 ص إلى 2 م».
      const words = spanNote(cell.state === "closed" ? L.closed : L.noReadings, hourText(c0 * 60), hourText(c1 * 60 + 60));
      return `<tr role="row" class="hb-x" style="--span: ${c1 - c0 + 1}"><td role="cell" colspan="2"><span class="hb-run is-${cell.state === "closed" ? "closed" : "none"}">${words}</span></td></tr>`;
    }).join("");
    $("#hb").innerHTML = `<caption class="sr-only">${L.dayHours(wdLong(wd), plain(periodWords(model.a, model.b)))}</caption><tbody>${rows}</tbody>`;
  }
  function pickDay(wd, focus) {
    if (wd === dayWd || !$("#hb")) return;
    dayWd = wd;
    $$(".wk-b", dayHost).forEach((x) => { const on = +x.dataset.wd === wd; x.setAttribute("aria-checked", String(on)); x.tabIndex = on ? 0 : -1; });
    renderHours();
    if (focus) $(`.wk-b[data-wd="${wd}"]`, dayHost).focus();
  }
  dayHost.addEventListener("click", (e) => {
    const d = e.target.closest("[data-wd]");
    if (d) { pickDay(+d.dataset.wd, true); return; }
    const go = e.target.closest("[data-range-go]");
    if (go) goPreset(go.dataset.rangeGo);
  });
  dayHost.addEventListener("keydown", (e) => {
    const d = e.target.closest("[data-wd]");
    if (!d) return;
    const fwd = RTL ? "ArrowLeft" : "ArrowRight", back = RTL ? "ArrowRight" : "ArrowLeft";
    const wd = +d.dataset.wd;
    const to = e.key === fwd || e.key === "ArrowDown" ? (wd + 1) % 7 : e.key === back || e.key === "ArrowUp" ? (wd + 6) % 7 : e.key === "Home" ? 0 : e.key === "End" ? 6 : null;
    if (to == null) return;
    e.preventDefault();
    pickDay(to, true);
  });
  $("#heat-keys").textContent = L.heatKeys;
  $("#heat-key").setAttribute("aria-label", L.patternTitle);

  function tipHTML(td) {
    const wd = +td.dataset.r, c0 = +td.dataset.c0, c1 = +td.dataset.c1, cell = model.heat[wd][c0];
    // A closed or no-reading run names its weekday, then its sentence on two lines, the words first (decision 8): the
    // words, then "from … to …", both in the word's type and colour (one size and one colour, decision 9).
    const sentence = (w) => `<div class="tip-t"><span>${wdLong(wd)}</span></div><div class="tip-main"><span class="tip-word">${w}</span></div><div class="tip-main tip-span"><span class="tip-word"><span class="nw">${L.spanFrom} ${hourText(c0 * 60)}</span> <span class="nw">${L.spanTo} ${hourText(c1 * 60 + 60)}</span></span></div>`;
    if (cell.state === "closed") return `${sentence(L.closed)}<div class="tip-u">${L.closedTip}</div>`;
    if (cell.state === "missing") return sentence(L.noReadings);
    const when = `<div class="tip-t"><span>${wdLong(wd)}</span><span aria-hidden="true">·</span><span>${hourRange(c0 * 60, c1 * 60 + 60)}</span></div>`;
    const z = cell.avg === 0;
    return `${when}<div class="tip-main"><span class="tip-v">${bdi(z ? "0" : valText(cell.avg))}</span><span class="tip-l">${z ? L.emptyLong : L.levels[levelOf(cell.avg)]}</span></div><div class="tip-u">${L.avgOf(cell.samples)}</div>`;
  }
  let tipFor = null;
  function showTip(td) {
    if (!td) return;
    $$(".hc.is-sel", heat).forEach((x) => x.classList.remove("is-sel"));
    td.classList.add("is-sel");
    tipFor = td;
    heatTip.innerHTML = tipHTML(td);
    heatTip.hidden = false;
    // Centred over the cell, kept inside the scroll box; above the cell, or below it when there is no room above.
    const box = heatScroll.getBoundingClientRect(), cb = td.getBoundingClientRect();
    const w = heatTip.offsetWidth, h = heatTip.offsetHeight;
    const sx = heatScroll.scrollLeft;
    let x = cb.left - box.left + sx + cb.width / 2 - w / 2;
    x = Math.max(sx + 2, Math.min(sx + box.width - w - 2, x));
    let y = cb.top - box.top - h - 8;
    if (y < 0) y = cb.bottom - box.top + 8;
    heatTip.style.transform = `translate(${f2(x)}px, ${f2(y)}px)`;
  }
  function hideTip() {
    tipFor = null;
    heatTip.hidden = true;
    heatTip.style.transform = "";
    $$(".hc.is-sel", heat).forEach((x) => x.classList.remove("is-sel"));
  }
  function focusCell(r, c, want = c) {
    const td = heatSlots[r][c];
    if (!td) return;
    $$(".hc[tabindex='0']", heat).forEach((x) => { x.tabIndex = -1; });
    td.tabIndex = 0;
    heatCur = { r, c };
    heatWant = want;
    td.focus();
    showTip(td);
  }
  heat.addEventListener("keydown", (e) => {
    const td = e.target.closest(".hc");
    if (!td || !heatCur) return;
    const r = +td.dataset.r, c0 = +td.dataset.c0, c1 = +td.dataset.c1;
    // Hours run along the inline axis (mirrored in Arabic); weekdays down the grid.
    const fwd = RTL ? "ArrowLeft" : "ArrowRight", back = RTL ? "ArrowRight" : "ArrowLeft";
    const later = fwd, earlier = back, nextDay = "ArrowDown", prevDay = "ArrowUp";
    let nr = r, nc = null;
    if (e.key === later) nc = c1 + 1;
    else if (e.key === earlier) nc = c0 - 1;
    else if (e.key === prevDay) { nr = r - 1; nc = heatWant; }
    else if (e.key === nextDay) { nr = r + 1; nc = heatWant; }
    else if (e.key === "Home") { nc = 0; if (e.ctrlKey) nr = 0; }
    else if (e.key === "End") { nc = HOURS - 1; if (e.ctrlKey) nr = 6; }
    else if (e.key === "Escape") { if (tipFor) { e.preventDefault(); e.stopPropagation(); hideTip(); } return; }
    else return;
    e.preventDefault();
    if (nr < 0 || nr > 6 || nc < 0 || nc >= HOURS) return;
    const dayMove = e.key === prevDay || e.key === nextDay;
    focusCell(nr, nc, dayMove ? heatWant : nc);
  });
  heat.addEventListener("focusin", (e) => { const td = e.target.closest(".hc"); if (td && tipFor !== td) showTip(td); });
  heat.addEventListener("focusout", (e) => { if (!heat.contains(e.relatedTarget)) hideTip(); });
  heat.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const td = e.target.closest(".hc");
    if (td && td !== tipFor) showTip(td);
  });
  heat.addEventListener("pointerleave", () => {
    const f = document.activeElement && document.activeElement.closest && document.activeElement.closest(".hc");
    if (f && heat.contains(f)) showTip(f); else hideTip();
  });
  heat.addEventListener("click", (e) => {
    const td = e.target.closest(".hc");
    if (!td) return;
    focusCell(+td.dataset.r, +td.dataset.c0);
  });
  heatScroll.addEventListener("scroll", () => { if (tipFor) showTip(tipFor); }, { passive: true });
  // Crossing 1280 px redraws the pattern in that size's form, and its readout closes; crossing 720 px redraws day by day
  // as a list or a table (BRK-10).
  mqWide.addEventListener("change", () => { renderHeat(); renderDays(); applyPhase(); });
  mqPhone.addEventListener("change", () => { renderDays(); applyPhase(); });

  const numbersBtn = $("#numbers");
  numbersBtn.addEventListener("click", () => {
    const on = numbersBtn.getAttribute("aria-checked") !== "true";
    numbersBtn.setAttribute("aria-checked", String(on));
    heat.classList.toggle("show-n", on);
    if (tipFor) showTip(tipFor);
  });

  /* ---------------------------------------------------------------- day by day
   * The table system's data table (TBL-1…12): real table semantics (explicit roles too, so a narrow-screen recomposition
   * never drops them), sortable columns with aria-sort, and a camera gap in words; the day with the period's highest
   * peak is tinted, with no flag (decision 17): the glance's «أعلى ذروة» names its day, time and value. Numeric columns
   * (Peak, Average, Entries) put their numbers and their header on the physical right edge in both languages, so units
   * sit under units (TBL-1); the peak cell leads with its value on that edge, then its time (TBL-11), beside it from
   * 721 px (decision 15). A span with no readings (the days before the readings began, or a day inside them with none)
   * is one full-width row, one sentence with the words first (TBL-12, decision 8). */
  const daysTable = $("#days-table");
  let sort = { key: "day", dir: "desc" };
  const SORTS = { day: (d) => d.dn, peak: (d) => d.peak, avg: (d) => d.avg, entries: (d) => d.entries };
  function sortedDays() {
    const dir = sort.dir === "desc" ? -1 : 1;
    if (sort.key === "day") return [...model.days].sort((x, y) => (x.dn - y.dn) * dir);
    const key = SORTS[sort.key];
    const withData = model.days.filter((d) => d.observed).sort((x, y) => (key(x) - key(y)) * dir || y.dn - x.dn);
    const without = model.days.filter((d) => !d.observed).sort((x, y) => y.dn - x.dn);
    return [...withData, ...without];
  }
  // A span of days with no readings, as one sentence (decision 8): «لا قراءات بعد من 2 أغسطس إلى 12 سبتمبر».
  const daysNote = (words, a, b) => spanNote(words, dateText(a), dateText(b));
  // A camera gap inside a day (minutes since 6:00 AM, the last one inclusive).
  const gapNote = ([a, b]) => spanNote(L.noReadings, timeText(a), timeText(b + 1));
  // K-02, `pending`: the part of a day not received yet, one sentence with the words first, in the
  // place a camera gap's note takes: «بانتظار القراءات منذ 9:10 م» (the Daily page's waiting sentence, decision 12).
  const waitNote = ([a]) => `<span class="gapnote is-wait"><span class="w">${L.waiting}</span> <span class="nw"><span class="w">${L.since}</span> <span class="rg">${timeText(a)}</span></span></span>`;
  const dayNotes = (d) => d.miss.map(gapNote).join("") + (d.pend || []).map(waitNote).join("");
  function renderDays() {
    $("#days-sub").innerHTML = L.days(model.n);
    // Below 1280 px an empty period says its sentence once, in the pattern's card with the way back (EMP-1); the day card
    // would only say it again, so it steps aside until the period has readings.
    $("#days").hidden = dayForm() && !model.withReadings;
    const list = mqPhone.matches;
    $("#days").dataset.form = list ? "list" : "table";
    daysTable.hidden = list;
    dlist.hidden = !list;
    if (list) { daysTable.innerHTML = ""; renderList(); tableFile(); return; }
    dlist.innerHTML = "";
    const cols = [
      { key: "day", cls: "c-day", sortable: true },
      { key: "peak", cls: "c-peak n", sortable: true },
      { key: "avg", cls: "c-avg n", sortable: true },
      { key: "entries", cls: "c-entries n", sortable: true },
      { key: "notes", cls: "c-notes", sortable: false },
    ];
    const head = cols.map((c) => {
      const label = L.cols[c.key];
      if (!c.sortable) return `<th scope="col" role="columnheader" class="${c.cls}">${label}</th>`;
      const on = sort.key === c.key;
      const aria = on ? ` aria-sort="${sort.dir === "desc" ? "descending" : "ascending"}"` : "";
      return sortHead(label, `${c.cls}${on ? ` is-sorted is-${sort.dir}` : ""}`, aria, ` data-sort="${c.key}"`);
    }).join("");
    let body;
    if (!model.withReadings) {
      body = `<tr role="row" class="is-empty"><td role="cell" colspan="5"><div class="table-empty">${ICON.info}<p>${emptyPeriod()}</p><button class="rbtn" type="button" data-range-go="28d"><span>${L.emptyAction}</span></button></div></td></tr>`;
    } else {
      const out = [];
      const noneRow = (note) => `<tr role="row" class="is-none"><td role="cell" colspan="5" class="c-none">${note}</td></tr>`;
      // In date order, a firmer line closes each week (between Saturday and Sunday).
      const edgeOf = (d) => sort.key === "day" && (sort.dir === "desc" ? d.wd === 0 : d.wd === 6) && d.dn !== (sort.dir === "desc" ? model.a : model.b);
      const dayRowHead = (d) => dayHead(wdShort(d.wd), dateBare(d.dn));
      // A single day without readings keeps its date in the day column, as every day does, and its words take the rest of
      // the row: «لا قراءات», or «لا قراءات بعد» before the readings began; no figures (decisions 10 and 11, user
      // 2026-10-02; TBL-12).
      const noneDay = (d, words) => dayNoneRow(dayRowHead(d), words, edgeOf(d));
      // Days before the history starts are one merged row ("No readings yet"), or a day row when there is only one.
      let pre = [];
      const flushPre = () => {
        if (!pre.length) return;
        const a = Math.min(...pre.map((d) => d.dn)), b = Math.max(...pre.map((d) => d.dn));
        out.push(a === b ? noneDay(pre[0], L.beforeHistory) : noneRow(daysNote(L.beforeHistory, a, b)));
        pre = [];
      };
      sortedDays().forEach((d) => {
        if (d.none) { pre.push(d); return; }
        flushPre();
        if (!d.observed) { out.push(noneDay(d, L.noReadings)); return; }
        const top = model.top && model.top.dn === d.dn;
        const notes = dayNotes(d);
        const edge = edgeOf(d);
        const cls = [top ? "is-top" : "", edge ? "wk-edge" : "", notes ? "has-note" : ""].filter(Boolean).join(" ");
        out.push(`<tr role="row"${cls ? ` class="${cls}"` : ""}>${dayRowHead(d)}` +
          `<td role="cell" class="c-peak n"><span class="pk"><span class="pv">${bdi(d.peak)}</span><span class="pt">${timeText(d.peakM)}</span></span></td>` +
          `<td role="cell" class="c-avg n">${bdi(Math.round(d.avg))}</td>` +
          `<td role="cell" class="c-entries n">${bdi(fmtInt(d.entries))}</td>` +
          `<td role="cell" class="c-notes">${notes}</td></tr>` +
          // On a narrow screen the notes column folds into a row of its own under the day (only one of the two shows).
          (notes ? `<tr role="row" class="note-row${top ? " is-top" : ""}"><td role="cell" colspan="4">${notes}</td></tr>` : ""));
      });
      flushPre();
      body = out.join("");
    }
    daysTable.innerHTML = `<caption class="sr-only">${L.daysCaption(periodWords(model.a, model.b))}</caption><thead><tr role="row">${head}</tr></thead><tbody>${body}</tbody>`;
    fitSlots(daysTable);
    tableFile();
  }
  addEventListener("resize", () => fitSlots(daysTable));
  /* ---- the day list (720 px and below; the user's pick of 2026-10-01, option B).
   * A day per item: its date and its peak on the first line, its average and entries under the date and the peak's time
   * under the peak, on the peak's edge (TBL-1, TBL-11); a camera gap folds under them, one sentence with the words first
   * (TBL-12, decision 8). The newest 7 days first, the rest one tap away ("Show all days"); shown whole, the list is one
   * plain run of days, with no dated 7-day heads (the user's decision 3 of 2026-10-01). The phone's own picker sorts it
   * (a native select). Days before the readings began are one item, as in the table; a single day without readings is a
   * day item with its date (decisions 10 and 11). */
  const dlist = $("#dlist");
  const LIST_N = 7;
  let listOpen = false, listKey = "";
  function renderList() {
    const lk = `${model.a}-${model.b}`;
    if (lk !== listKey) { listKey = lk; listOpen = false; }
    const items = [];
    let pre = [];
    const noneItem = (note) => `<li class="dli is-none">${note}</li>`;
    // A single day without readings is a day item: its date where every day has it, and under it, where the average and
    // the entries sit, «لا قراءات» or «لا قراءات بعد»; no figures (decisions 10 and 11, user 2026-10-02).
    const dayNoneItem = (d, words) => `<li class="dli is-none-day"><span class="dl-day">${dayText(d.dn)}</span><span class="dl-more">${words}</span></li>`;
    const flushPre = () => { if (!pre.length) return; const a = Math.min(...pre.map((d) => d.dn)), b = Math.max(...pre.map((d) => d.dn)); items.push(a === b ? dayNoneItem(pre[0], L.beforeHistory) : noneItem(daysNote(L.beforeHistory, a, b))); pre = []; };
    sortedDays().forEach((d) => {
      if (d.none) { pre.push(d); return; }
      flushPre();
      if (!d.observed) { items.push(dayNoneItem(d, L.noReadings)); return; }
      const top = model.top && model.top.dn === d.dn;
      const notes = dayNotes(d);
      items.push(`<li class="dli${top ? " is-top" : ""}">` +
        `<span class="dl-day">${dayText(d.dn)}</span>` +
        `<span class="dl-pk"><span class="dl-pv">${bdi(d.peak)}</span></span>` +
        `<span class="dl-more"><span class="nw">${L.cols.avg} ${bdi(Math.round(d.avg))}</span><span class="nw">${L.cols.entries} ${bdi(fmtInt(d.entries))}</span></span>` +
        `<span class="dl-pt nw">${L.peakAt(timeText(d.peakM))}</span>` +
        (notes ? `<span class="dl-note">${notes}</span>` : "") + `</li>`);
    });
    flushPre();
    const n = items.length, cut = !listOpen && n > LIST_N;
    const val = `${sort.key}-${sort.dir}`;
    const opts = Object.entries(L.sorts).map(([k, v]) => `<option value="${k}"${k === val ? " selected" : ""}>${v}</option>`).join("");
    // The select holds 16 px text unseen (no zoom on an iPhone); its face shows the choice in label type, as wide as the
    // widest choice (reports.css "The sort").
    const face = Object.entries(L.sorts).map(([k, v]) => `<span${k === val ? ' class="is-on"' : ""}>${v}</span>`).join("");
    dlist.innerHTML = `<div class="dl-sortrow"><label class="dl-sort"><span class="sr-only">${L.sortName}</span>${ICON.sort}<select id="dl-sort">${opts}</select><span class="sel-face" aria-hidden="true">${face}</span></label></div>
      <ol class="day-list" id="day-list" aria-label="${plain(L.daysCaption(periodWords(model.a, model.b)))}">${(cut ? items.slice(0, LIST_N) : items).join("")}</ol>` +
      (n > LIST_N ? `<button class="rbtn dl-more-btn" id="dl-all" type="button" aria-expanded="${!cut}" aria-controls="day-list">${cut ? L.showAll : L.showFewer}</button>` : "");
  }
  dlist.addEventListener("change", (e) => {
    if (e.target.id !== "dl-sort") return;
    const [key, dir] = e.target.value.split("-");
    sort = { key, dir };
    renderDays();
    $("#dl-sort").focus();
    say(L.sorts[e.target.value]);
  });
  dlist.addEventListener("click", (e) => {
    if (!e.target.closest("#dl-all")) return;
    listOpen = !listOpen;
    renderDays();
    $("#dl-all").focus();
  });

  // TBL-10 (K-14): the table's export exports the table's rows, in the order shown: one row per day, the gym's own
  // time, whole people. A link with the file ready behind it, rebuilt when the rows change.
  const tableExport = $("#table-export");
  let tableUrl = null;
  function tableFile() {
    const q = (v) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    const hhmm = (m) => { const c = clock(m); const h = (c.h12 % 12) + (c.pm ? 12 : 0); return `${String(h).padStart(2, "0")}:${String(c.mm).padStart(2, "0")}`; };
    const lines = ["day,weekday,peak,peak_time,average_inside,entries,note"];
    sortedDays().forEach((d) => {
      const note = d.none ? "no readings yet" : !d.observed ? "no readings"
        : [...d.miss.map(([a, b]) => `no readings ${hhmm(a)}-${hhmm(b + 1)}`), ...(d.pend || []).map(([a]) => `waiting for readings since ${hhmm(a)}`)].join("; ");
      lines.push([isoOf(d.dn), WD_EN[d.wd], d.observed ? d.peak : "", d.observed ? hhmm(d.peakM) : "", d.observed ? Math.round(d.avg) : "", d.observed ? d.entries : "", q(note)].join(","));
    });
    if (tableUrl) URL.revokeObjectURL(tableUrl);
    tableUrl = URL.createObjectURL(new Blob(["\ufeff" + lines.join("\r\n") + "\r\n"], { type: "text/csv;charset=utf-8" }));
    tableExport.href = tableUrl;
    tableExport.setAttribute("download", `fitway-days-${isoOf(model.a)}-to-${isoOf(model.b)}.csv`);
    tableExport.toggleAttribute("aria-disabled", !model.withReadings);
    tableExport.classList.toggle("is-disabled", !model.withReadings);
  }
  tableExport.addEventListener("click", (e) => { if (!model.withReadings) e.preventDefault(); });
  daysTable.addEventListener("click", (e) => {
    const b = e.target.closest("[data-sort]");
    if (b) {
      const key = b.dataset.sort;
      sort = sort.key === key ? { key, dir: sort.dir === "desc" ? "asc" : "desc" } : { key, dir: "desc" };
      renderDays();
      $(`[data-sort="${key}"]`, daysTable).focus();
      say(L.sortSay(L.cols[key], sort.dir, key === "day"));
      return;
    }
    const go = e.target.closest("[data-range-go]");
    if (go) goPreset(go.dataset.rangeGo);
  });

  // The way back from an empty period: a preset, and focus on its segment.
  function goPreset(k) {
    setRange({ kind: k, a: LAST_FULL - PRESETS[k] + 1, b: LAST_FULL });
    segButtons.find((x) => x.dataset.range === k).focus();
  }
  function renderAll() {
    renderHead();
    renderCards();
    renderHeat();
    renderDays();
    syncUrl();
    applyPhase();
  }
  function setRange(next, announce = true) {
    range = next;
    model = buildModel(range.a, range.b);
    // A new period is a new request: while the page could not load, asking for another period is its retry.
    if (phase === "error" || phase === "retrying") { startLoading(LOAD.retry); return; }
    renderAll();
    if (announce && phase === "ready") say(plain(L.rangeSay(periodWords(range.a, range.b))));
  }

  /* ---------------------------------------------------------------- the page's states (K-02)
   * Reports' loading, page-level closed, unavailable and error, and the statuses that say its data is not current, as
   * the user decided on 2026-10-03 (DECISIONS item 14: the options round's A, with C's error). Each draws over the live
   * page's own render: renderAll() renders the period, then applyPhase() writes the state into the same places, so the
   * arrival of the payload is the live page's render, whose boxes the placeholders already hold (DESIGN_GUIDE §6).
   *   loading  0-300 ms the value slots wait empty (data-load="wait"); from 300 ms the skeleton, at least 400 ms; one
   *            announcement at 1 s; the 10 s ceiling turns it into Error. ?arrive=<ms> lets the payload arrive into
   *            live that many ms after the page opened; ?arrive=never lets the ceiling run; without it the skeleton is
   *            held, for review. The header says «جارٍ التحميل…» (STW-2). Names, the period's dates (the request),
   *            the pattern's axes and the period's days are real text from the first paint; the pattern never draws a
   *            bar or a cell it does not have (DESIGN_GUIDE §6: charts do not imitate data). A placeholder stands in
   *            every awaited value: the glance, the pattern's subtitle, day by day's rows.
   *   error    the payload could not be loaded (or the ceiling was reached): the header's Error; one message for the
   *            page under its controls, in the empty period's form (EMP-1: the mark, one sentence naming what is
   *            missing and its dates, one action); the cards, the pattern and day by day step aside. The one retry
   *            takes focus and runs as an action (STA-9), then arrives into live.
   *   closed, delayed, unavailable  the header's status (STW-1); the history is whole, so the page is unchanged but
   *            for its light: the pattern's light is off under every status but Live (DECISIONS 8, Daily's rule).
   *   pending  Offline since 9:10 PM on 22 September: the received part of that day counts and the rest is noted,
   *            «بانتظار القراءات منذ 9:10 م»; "Last 7 days" waits («قيد الانتظار»). */
  const LOAD = { delay: 300, min: 400, say: 1000, ceiling: 10000, retry: 1200 };
  const ARRIVE = (() => { const a = params.get("arrive"); if (a === "never") return "never"; const n = Number(a); return a != null && a !== "" && Number.isFinite(n) && n >= 0 ? n : null; })();
  const load = { shownAt: null, timers: [], announcements: [] };
  const later = (ms, fn) => load.timers.push(setTimeout(fn, Math.max(0, ms)));
  const clearTimers = () => { load.timers.splice(0).forEach(clearTimeout); };
  const ph = (w, cls = "") => `<i class="ph-bar${cls ? ` ${cls}` : ""}" style="--w:${w}px" aria-hidden="true"></i>`;
  const phBox = (w = 76) => `<i class="ph-box" style="width:${w}px" aria-hidden="true"></i>`;
  const valueSlot = (w) => `<p class="stat-value"><span class="num ph-slot" aria-hidden="true">${w ? ph(w) : ""}</span></p>`;
  const busyEls = () => [$("#cards"), $("#pattern"), $("#days")];
  let retryBtn = null;

  // The glance in waiting: every value's own slot holds its placeholder. The "Last 7 days" span is a date range, known
  // before the payload.
  function pendGlance() {
    $("#avg-body").innerHTML = `${valueSlot(56)}<div class="stat-foot"></div>`;
    // The peak's "when" as the live meta draws it: the day, then the time (on two lines on a phone). Each bar is as wide
    // as its words in this language («الخميس 17 سبتمبر» and «6:58 م»; "Thu 17 Sep" and "6:58 PM"), so the bars sit inside
    // the card where the words arrive and the arrival moves nothing.
    $("#peak-meta").innerHTML = `${ph(RTL ? 101 : 62)}<span class="sep ph-sep" aria-hidden="true">·</span>${ph(RTL ? 33 : 44)}`;
    $("#peak-body").innerHTML = `${valueSlot(56)}<div class="stat-foot">${phBox()}</div>`;
    $("#entries-body").innerHTML = `${valueSlot(112)}<div class="stat-foot"><span class="stat-aside">${ph(88)}</span></div>`;
    $("#trend-body").innerHTML = `${valueSlot(88)}<div class="stat-foot">${phBox(104)}<span class="stat-aside">${ph(88)}</span></div>`;
  }
  // The pattern in waiting: its title, the first part of its subtitle, its axes and its key's fixed words are real;
  // the busiest hour (a placeholder) and the key's data marks keep their places, unseen.
  // From 1280 px the week's grid draws its axes on the empty plate; below,
  // the week strip names its days (none chosen, nothing to choose yet) over the hours' empty frame.
  function pendPattern() {
    const sub = $("#pattern-sub");
    sub.innerHTML = `<span class="ps-part">${L.patternSub}</span><span class="sep ph-sep" aria-hidden="true">·</span><span class="ps-part">${ph(168, "ph-lab")}</span>`;
    numbersBtn.disabled = true;
    if (dayForm()) {
      const strip = [0, 1, 2, 3, 4, 5, 6].map((wd) => `<button type="button" class="wk-b" role="radio" aria-checked="false" disabled><span class="wk-col" aria-hidden="true"></span><span class="wk-n" aria-hidden="true">${wdStrip(wd)}</span><span class="sr-only">${wdLong(wd)}</span></button>`).join("");
      const rows = Array.from({ length: HOURS }, (_, c) => `<tr role="row"${c % 3 === 0 ? ` class="is-tick"` : ""}><th scope="row" role="rowheader" class="hb-h">${bdi(fmtHour(c * 60))}</th><td role="cell" class="hb-c"></td></tr>`).join("");
      // (The caption, as the day's own table has one: its box is part of the table's height.)
      dayHost.innerHTML = `<div class="wk-strip" role="radiogroup" aria-label="${L.weekStrip}" aria-disabled="true">${strip}</div><table class="hb is-frame" id="hb" role="table"><caption class="sr-only">${L.heatCaption(plain(periodWords(model.a, model.b)))}</caption><tbody>${rows}</tbody></table>`;
      return;
    }
    const hours = [];
    for (let c = 0; c < HOURS; c++) {
      const show = c % 3 === 0;
      hours.push(`<th scope="col" class="hh${show ? " is-shown" : ""}" role="columnheader"><span class="${show ? "hh-t" : "sr-only"}">${bdi(fmtHour(c * 60))}</span></th>`);
    }
    const cells = () => `<td class="hc ph-cell" role="gridcell"></td>`.repeat(HOURS);
    const rows = [0, 1, 2, 3, 4, 5, 6].map((wd) => `<tr role="row"><th scope="row" class="hd" role="rowheader">${wdLong(wd)}</th>${cells(wd)}</tr>`);
    heat.innerHTML = `<caption class="sr-only">${L.heatCaption(periodWords(model.a, model.b))}</caption><colgroup><col class="col-day">${"<col>".repeat(HOURS)}</colgroup>
      <thead><tr role="row"><th scope="col" class="heat-corner" role="columnheader"><span class="sr-only">${L.dayHead}</span></th>${hours.join("")}</tr></thead>
      <tbody>${rows.join("")}</tbody>`;
  }
  // Day by day in waiting: the period's days are the request, so each keeps its date; its figures wait in
  // placeholders, its notes column empty. On a phone, the newest 7 as the list draws them. Sorting waits.
  function pendDays() {
    $("#days").hidden = false;
    tableExport.classList.add("is-disabled");
    tableExport.setAttribute("aria-disabled", "true");
    const days = [...model.days].sort((x, y) => y.dn - x.dn);
    if (mqPhone.matches) {
      const n = days.length;
      const items = days.slice(0, LIST_N).map((d) => `<li class="dli"><span class="dl-day">${dayText(d.dn)}</span><span class="dl-pk"><span class="dl-pv">${ph(24, "ph-pv")}</span></span><span class="dl-more">${ph(56)}${ph(72)}</span><span class="dl-pt">${ph(64)}</span></li>`).join("");
      dlist.innerHTML = `<div class="dl-sortrow"><label class="dl-sort is-disabled"><span class="sr-only">${L.sortName}</span>${ICON.sort}<select id="dl-sort" disabled><option>${L.sorts["day-desc"]}</option></select><span class="sel-face" aria-hidden="true"><span class="is-on">${L.sorts["day-desc"]}</span></span></label></div>
        <ol class="day-list" id="day-list" aria-label="${plain(L.daysCaption(periodWords(model.a, model.b)))}">${items}</ol>` +
        (n > LIST_N ? `<button class="rbtn dl-more-btn" id="dl-all" type="button" disabled>${L.showAll}</button>` : "");
      return;
    }
    const cols = [["day", "c-day"], ["peak", "c-peak n"], ["avg", "c-avg n"], ["entries", "c-entries n"], ["notes", "c-notes"]];
    const head = cols.map(([k, cls]) => `<th scope="col" role="columnheader" class="${cls}"><span class="sort is-still"><span>${L.cols[k]}</span></span></th>`).join("");
    const edge = (d) => d.wd === 0 && d.dn !== model.a;
    const rows = days.map((d) => `<tr role="row"${edge(d) ? ` class="wk-edge"` : ""}><th scope="row" role="rowheader" class="c-day"><span class="dd"><span class="wd">${wdShort(d.wd)}</span> <span class="dt">${dateText(d.dn)}</span></span></th>` +
      `<td role="cell" class="c-peak n"><span class="pk"><span class="pv">${ph(20, "ph-lab")}</span><span class="pt">${ph(44)}</span></span></td>` +
      `<td role="cell" class="c-avg n">${ph(18, "ph-lab")}</td><td role="cell" class="c-entries n">${ph(36, "ph-lab")}</td><td role="cell" class="c-notes"></td></tr>`).join("");
    daysTable.innerHTML = `<caption class="sr-only">${L.daysCaption(periodWords(model.a, model.b))}</caption><thead><tr role="row">${head}</tr></thead><tbody>${rows}</tbody>`;
  }
  // The alert (EMP-2's sentence form, EMP-5's role). The sentence is drawn with the state's first paint, in its place,
  // so nothing moves after it; its announcement is a separate unseen alert region, written a moment after the region
  // is in place, so it is announced once (the drawn sentence is not read twice). The retry takes focus. While the retry
  // runs (STA-9) it says «جارٍ المحاولة…», keeps focus, width and place, and is aria-disabled: its two labels share
  // one cell (reports.css .rb-stack), only the current one seen and named.
  const retryLabels = (trying) => `<span class="rb-stack"><span class="rb-l"${trying ? ' aria-hidden="true"' : ""}>${L.retry}</span><span class="rb-l"${trying ? "" : ' aria-hidden="true"'}>${L.retrying}</span></span>`;
  function alertHTML(sentence) {
    const trying = phase === "retrying";
    return `<p class="stat-say is-err" aria-hidden="true">${SVG_ERR}<span>${sentence}</span></p><span class="sr-only" id="err-say" role="alert"></span>` +
      `<button class="rbtn rbtn-primary" id="retry" type="button"${trying ? ' aria-disabled="true" aria-busy="true"' : ""}>${retryLabels(trying)}</button>`;
  }
  function wireAlert(host, focus) {
    retryBtn = $("#retry", host);
    retryBtn.addEventListener("click", retry);
    const say1 = $("#err-say", host), text = $(".stat-say > span", host).innerHTML;
    setTimeout(() => { if (say1.isConnected) { say1.innerHTML = text; load.announcements.push({ t: Math.round(performance.now()), text: plain(text), alert: true }); } }, 50);
    if (focus) retryBtn.focus();
  }
  function paintLoading() {
    pendGlance();
    pendPattern();
    pendDays();
  }
  function paintError(focus) {
    $("#days").hidden = true;
    $("#cards").hidden = true;
    $("#pattern").hidden = true;
    let msg = $("#page-msg");
    if (!msg) {
      msg = Object.assign(document.createElement("section"), { className: "card rp-msg", id: "page-msg" });
      $(".rp-tools").after(msg);
    }
    // The period as one plain sentence, words first, with no dash (DECISIONS items 11 and 14), saying each part once:
    // one day names its date alone; inside one month the first date is its day alone, the month and year once at the
    // end; across months the year once, at the end; across two years each date with its own year.
    const sentence = periodSentence(model.a, model.b, L.errorDates, L.errorDay);
    msg.innerHTML = alertHTML(sentence);
    wireAlert(msg, focus);
  }
  // Every state's marks come off before the live render is written again (the arrival, or a period while ready).
  function clearPhase() {
    $("#page-msg")?.remove();
    $("#cards").hidden = false;
    $("#pattern").hidden = false;
    numbersBtn.disabled = false;
    retryBtn = null;
  }
  let focusAlert = phase === "error";
  function applyPhase() {
    clearPhase();
    root.dataset.phase = phase;
    const waiting = phase !== "ready";
    busyEls().forEach((el) => (phase === "loading" || phase === "retrying" ? el.setAttribute("aria-busy", "true") : el.removeAttribute("aria-busy")));
    exportBtn.disabled = waiting;
    if (phase === "loading") paintLoading();
    else if (waiting) { paintError(focusAlert); focusAlert = false; }
    // The light (OWN-R6): the pattern's, while it holds a value, and only under Live (Daily's rule, DECISIONS 8).
    const lit = !waiting && hasValues() && pageNow === "live";
    $("#pattern").classList.toggle("lit", lit);
    $("#pattern").classList.toggle("lit-chart", lit);
    renderStatus();
  }
  function startLoading(arriveAfter) {
    clearTimers();
    phase = "loading";
    root.dataset.load = "wait";
    load.shownAt = null;
    const t0 = performance.now();
    renderAll();
    later(LOAD.delay, () => { if (phase === "loading") { root.dataset.load = "shown"; load.shownAt = performance.now(); } });
    later(LOAD.say, () => { if (phase === "loading") say(L.loadingSay); });
    if (typeof arriveAfter === "number") later(arriveAfter, arrive);
    else if (arriveAfter === "never") later(LOAD.ceiling, () => fail());
    return t0;
  }
  function arrive() {
    if (phase !== "loading" && phase !== "retrying") return false;
    const now = performance.now();
    // Once shown, a skeleton stays at least 400 ms, so it never flickers.
    if (phase === "loading" && load.shownAt != null && now - load.shownAt < LOAD.min) { later(load.shownAt + LOAD.min - now, arrive); return false; }
    clearTimers();
    const hadFocus = Boolean(retryBtn && document.activeElement === retryBtn);
    phase = "ready";
    pageNow = "live";
    delete root.dataset.load;
    renderAll();
    // The retry is gone with the alert: focus goes to the figures that replaced it, quietly (no ring on a region).
    if (hadFocus) { const c = $("#cards"); c.tabIndex = -1; c.focus({ preventScroll: true }); }
    load.arrivedAt = now;
    say(plain(L.rangeSay(periodWords(range.a, range.b))));
    return true;
  }
  function fail() {
    if (phase !== "loading" && phase !== "retrying") return false;
    clearTimers();
    phase = "error";
    delete root.dataset.load;
    focusAlert = true;
    renderAll();
    return true;
  }
  function retry() {
    if (phase !== "error") return false;
    phase = "retrying";
    const [idle, busy] = retryBtn.querySelectorAll(".rb-l");
    idle.setAttribute("aria-hidden", "true");
    busy.removeAttribute("aria-hidden");
    retryBtn.setAttribute("aria-disabled", "true");
    retryBtn.setAttribute("aria-busy", "true");
    busyEls().forEach((el) => el.setAttribute("aria-busy", "true"));
    // The concept's retry succeeds after 1.2 s (STA-9 shows its working state at least 400 ms).
    later(LOAD.retry, arrive);
    later(LOAD.ceiling, fail);
    return true;
  }
  segButtons.forEach((btn) => btn.addEventListener("click", () => {
    const k = btn.dataset.range;
    if (k === "custom") { openRangeDialog(btn); return; }
    if (range.kind === k) return;
    setRange({ kind: k, a: LAST_FULL - PRESETS[k] + 1, b: LAST_FULL });
  }));

  /* ---------------------------------------------------------------- the dialog system
   * One pattern for every dialog: <dialog> opened with showModal (the page behind is inert), a scrim and a panel.
   * Initial focus is chosen per dialog; Tab and Shift+Tab wrap inside the panel; Escape and the scrim close it (Escape
   * also stops a running export); focus returns to the control that opened it. The movement is motion.js's (MOT-9):
   * from 721 px the panel unfolds from its title and folds back; a phone's sheet slides up and back down. Focus moves
   * into the dialog and back out at once; a closing dialog is closed at once and its picture leaves as an inert copy. */
  let openDlg = null;
  const focusables = (el) => $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', el)
    .filter((x) => !x.disabled && x.tabIndex >= 0 && !x.closest("[hidden]") && x.getClientRects().length);
  function openDialog(dlg, opener, first) {
    if (openDlg) closeDialog(openDlg.dlg, true);
    if (railOpen) setRail(false);
    openDlg = { dlg, opener, onClose: dlg._onClose };
    dlg.showModal();
    dlg.classList.add("is-open");
    // Focus moves first, while nothing is moving yet: a focus into a panel still being moved could scroll the dialog
    // to reach it and cancel the movement out. first may be the element, or a function that moves focus (the picker).
    if (typeof first === "function") first(); else (first || focusables($(".dlg-panel", dlg))[0]).focus();
    M.dialogOpen(dlg);
  }
  function closeDialog(dlg, instant = false) {
    if (!openDlg || openDlg.dlg !== dlg) return;
    const { opener, onClose } = openDlg;
    openDlg = null;
    M.dialogClose(dlg, { instant });
    if (onClose) onClose();
    dlg.classList.remove("is-open");
    if (dlg.open) dlg.close();
    const back = opener && opener.isConnected ? opener : $("#main");
    back.focus();
  }
  $$(".dlg").forEach((dlg) => {
    dlg.addEventListener("cancel", (e) => { e.preventDefault(); closeDialog(dlg); });
    dlg.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) { e.preventDefault(); closeDialog(dlg); } });
    dlg.addEventListener("keydown", (e) => {
      if (e.key !== "Tab") return;
      const list = focusables($(".dlg-panel", dlg));
      if (!list.length) return;
      const first = list[0], last = list[list.length - 1];
      if (e.shiftKey && (document.activeElement === first || !dlg.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || !dlg.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
    });
  });

  /* ---- the date-range dialog: the date picker (picker.js, PCK; DECISIONS item 32, dates are picked, not typed), from
   * the first day with readings to the last full day; today is not a full day yet, so it stays dimmed, wearing today's
   * line. The picker opens on the period shown. */
  const dlgRange = $("#dlg-range");
  const picker = window.EclipsePicker.create($("#range-picker"), { lang: LANG, min: HIST_START, max: LAST_FULL, today: LAST_FULL + 1, maxSpan: MAX_RANGE, value: null });
  $("#dlg-range-desc").innerHTML = L.rangeDlgDesc(dateText(HIST_START, true), dateText(LAST_FULL, true));
  function openRangeDialog(opener) {
    picker.set({ a: Math.max(HIST_START, range.a), b: Math.min(LAST_FULL, range.b) });
    openDialog(dlgRange, opener, () => picker.focus());
  }
  $("#range-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const v = picker.validate();
    if (v.error || v.empty) { picker.focus(); return; }
    const same = Object.entries(PRESETS).find(([, n]) => v.b === LAST_FULL && v.b - v.a + 1 === n);
    closeDialog(dlgRange);
    setRange(same ? { kind: same[0], a: v.a, b: v.b } : { kind: "custom", a: v.a, b: v.b });
  });

  /* ---- the export dialog: a real CSV built from the synthetic minutes, in the page. Nothing leaves the page.
   * The file follows the reporting domain's CSV shape: a UTF-8 byte order mark, CRLF lines, and per business day
   * 1440 rows from the 4:00 AM business-day boundary, each with UTC and gym-time columns; closed and missing minutes
   * keep their state and leave the value columns empty. */
  const CSV_HEAD = "business_day,minute_start_utc,minute_start_local,time_zone,state,count,entries,exits,band,capacity_snapshot,settings_version,source";
  const p2 = (n) => String(n).padStart(2, "0");
  function csvDay(dn) {
    const iso = isoOf(dn), open = openAt(wdOf(dn)), d = hasReadings(dn) ? DAYS.get(dn) : null;
    const out = [];
    for (let k = 0; k < 1440; k++) {
      // Minute k of the business day starts at 4:00 AM local; gym time is UTC+3.
      const local = dn * 1440 + 240 + k, utc = local - 180;
      const L1 = partsOf(Math.floor(local / 1440)), U1 = partsOf(Math.floor(utc / 1440));
      const lm = local % 1440, um = ((utc % 1440) + 1440) % 1440;
      const lt = `${L1.y}-${p2(L1.m + 1)}-${p2(L1.d)}T${p2(Math.floor(lm / 60))}:${p2(lm % 60)}:00`;
      const ut = `${U1.y}-${p2(U1.m + 1)}-${p2(U1.d)}T${p2(Math.floor(um / 60))}:${p2(um % 60)}:00.000Z`;
      const m = k - 120; // minutes since 6:00 AM
      let tail;
      if (!(m >= open && m < DAY)) tail = "closed,,,,,,,";
      else if (!d || !d.obs(m)) tail = "missing,,,,,,,";
      else { const c = d.occ[m]; tail = `value,${c},${d.ent[m]},${d.ext[m]},${BAND[levelOf(c)]},${CAPACITY},${SETTINGS_VERSION},live`; }
      out.push(`${iso},${ut},${lt},${TZ},${tail}`);
    }
    return out.join("\r\n") + "\r\n";
  }
  const dlgExport = $("#dlg-export");
  const exportPicker = window.EclipsePicker.create($("#export-picker"), { lang: LANG, min: HIST_START, max: LAST_FULL,
    today: LAST_FULL + 1, maxSpan: MAX_RANGE, value: null, onChange: fileLine });
  const exportBtn = $("#export-btn");
  const fileName = (a, b) => `fitway-minutes-${isoOf(a)}-to-${isoOf(b)}.csv`;
  // The name as shown: it may break only between its parts, never inside a date (DAT-4; the dialog at 320 px).
  const fileNameHTML = (a, b) => `fitway-minutes-<wbr>${nw(isoOf(a))}-to-<wbr>${nw(isoOf(b) + ".csv")}`;
  const rowsText = (n) => (RTL ? L.rows(n).replace(/^\d+/, (x) => bdi(fmtInt(+x))) : L.rows(n));
  const ex = { state: "idle", run: 0, url: null, hold: false, release: null, failNext: params.get("export") === "fail", a: null, b: null, rows: 0, progress: 0, total: 0, showProgress: false };
  function fileLine() {
    const v = exportPicker.get();
    const el = $("#export-file");
    if (!v) { el.innerHTML = ""; return; }
    el.innerHTML = `${ICON.file}<span class="file-name" dir="ltr">${fileNameHTML(v.a, v.b)}</span><span class="file-rows">${rowsText((v.b - v.a + 1) * 1440)}</span>`;
  }
  function progressHTML() { return `${L.working} ${L.progress(Math.min(ex.progress + 1, ex.total), ex.total)}`; }
  // The two buttons keep their width whatever they say (BTN-9): each holds its labels in one cell, only the current one
  // seen and read; a label that changes rolls (motion.js). Export: "Export CSV", "Preparing…", "Try again"; Cancel:
  // "Cancel", "Done".
  const labels = (list, i) => `<span class="rb-stack">${list.map((l, k) => `<span class="rb-l"${k === i ? "" : ' aria-hidden="true"'}>${l}</span>`).join("")}</span>`;
  const showLabel = (btn, i) => btn.querySelectorAll(":scope > .rb-stack > .rb-l").forEach((l, k) => {
    if (k === i) l.removeAttribute("aria-hidden"); else if (l.getAttribute("aria-hidden") !== "true") l.setAttribute("aria-hidden", "true");
  });
  $("#export-go").innerHTML = labels([`${ICON.down2}<span>${L.exportGo}</span>`, L.working, L.retry], 0);
  $("#export-cancel").innerHTML = labels([L.cancel, L.done], 0);
  // The done state's mark is drawn (motion.js draws its ring, then its check); its words rise into their line.
  const DONE_MARK = `<span class="done-mark" aria-hidden="true"><svg viewBox="0 0 44 44" focusable="false"><circle class="m-ring" cx="22" cy="22" r="21.5"/><path class="m-check" d="M16.96 22.37l3.3 3.3 6.78-6.97"/></svg></span>`;
  function renderExport() {
    const s = ex.state, foot = $("#export-foot");
    $("#export-edit").hidden = s === "done";
    // Native disabled controls and inert prevent mouse, touch, preview and keyboard changes during preparation.
    exportPicker.host.disabled = s === "working";
    exportPicker.host.inert = s === "working";
    const prog = $("#export-progress");
    prog.hidden = s !== "working" || !ex.showProgress;
    if (!prog.hidden) {
      $("#export-progress-text").innerHTML = progressHTML();
      $("#export-progress-bar").style.transform = `scaleX(${f2(ex.progress / Math.max(1, ex.total))})`;
    }
    const alert = $("#export-alert");
    alert.hidden = s !== "failed";
    alert.innerHTML = s === "failed" ? `${ICON.alert}<p>${L.failed}</p>` : "";
    const done = $("#export-done");
    done.hidden = s !== "done";
    done.innerHTML = s === "done" ? `${DONE_MARK}<p class="done-title"><span class="m-rise">${L.doneTitle}</span></p>
        <p class="file-line">${ICON.file}<span class="file-name" dir="ltr">${fileNameHTML(ex.a, ex.b)}</span><span class="file-rows">${rowsText(ex.rows)}</span></p>` : "";
    // The footer's controls persist and change in place, so focus is never dropped with a replaced button.
    const cancel = $("#export-cancel", foot), go = $("#export-go", foot), save = $("#export-save", foot);
    showLabel(cancel, s === "done" ? 1 : 0);
    go.hidden = s === "done";
    go.disabled = s === "working";
    go.setAttribute("aria-busy", String(s === "working"));
    showLabel(go, s === "working" ? 1 : s === "failed" ? 2 : 0);
    save.hidden = s !== "done";
    if (s === "done") {
      save.href = ex.url;
      save.setAttribute("download", fileName(ex.a, ex.b));
      if (!save.innerHTML) save.innerHTML = `${ICON.down2}<span>${L.save}</span>`;
    } else {
      save.removeAttribute("href");
      save.removeAttribute("download");
    }
    dlgExport.dataset.state = s;
    $(".dlg-panel", dlgExport).setAttribute("aria-busy", String(s === "working"));
  }
  function resetExport() {
    ex.run++;
    if (ex.url) { URL.revokeObjectURL(ex.url); ex.url = null; }
    ex.state = "idle"; ex.showProgress = false; ex.progress = 0;
    if (ex.release) { const r = ex.release; ex.release = null; r(); }
  }
  function openExportDialog(opener) {
    resetExport();
    exportPicker.set({ a: Math.max(HIST_START, range.a), b: Math.min(LAST_FULL, range.b) });
    fileLine();
    renderExport();
    openDialog(dlgExport, opener, $("#export-go"));
  }
  dlgExport._onClose = () => { if (ex.state === "working") say(L.canceledSay); resetExport(); };
  // The progress line, once the work has run 300 ms (ex.revealDelay; a review can hold it): the panel settles around it.
  ex.revealDelay = 300;
  function revealProgress() {
    if (ex.state !== "working" || ex.showProgress) return;
    ex.shownAt = performance.now();
    M.reflow(dlgExport, () => { ex.showProgress = true; renderExport(); });
  }
  exportBtn.addEventListener("click", () => openExportDialog(exportBtn));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  async function runExport(a, b) {
    const run = ++ex.run;
    // A retry's alert steps aside as it starts: the panel settles; otherwise only the label rolls (motion.js).
    M.reflow(dlgExport, () => {
      Object.assign(ex, { state: "working", a, b, rows: (b - a + 1) * 1440, progress: 0, total: b - a + 1, showProgress: false });
      renderExport();
    });
    // Keep focus inside the panel while the primary button is busy.
    $("#export-foot [data-close]").focus();
    const t0 = performance.now();
    // The busy state shows at once on the button; the progress line only after 300 ms of work (Loading behaviour), and
    // once shown it stays at least 400 ms (DESIGN_GUIDE §6), so the dialog never grows and shrinks again at once; a
    // working state stays at least 400 ms in all, so it never flickers. The wait for that minimum is not work: a file
    // built in less than 300 ms shows no progress line.
    ex.shownAt = null;
    const reveal = setTimeout(() => { if (ex.run === run) revealProgress(); }, Math.min(ex.revealDelay, 2e9));
    const parts = ["﻿" + CSV_HEAD + "\r\n"];
    for (let dn = a; dn <= b; dn++) {
      if (ex.run !== run) { clearTimeout(reveal); return; }
      parts.push(csvDay(dn));
      ex.progress = dn - a + 1;
      if (ex.showProgress) {
        $("#export-progress-text").innerHTML = progressHTML();
        $("#export-progress-bar").style.transform = `scaleX(${f2(ex.progress / ex.total)})`;
      }
      if (ex.hold) await new Promise((r) => { ex.release = r; });
      else if ((dn - a) % 7 === 6) await wait(0);
    }
    clearTimeout(reveal);
    const spent = performance.now() - t0;
    if (spent < 400) await wait(400 - spent);
    if (ex.shownAt != null) { const shown = performance.now() - ex.shownAt; if (shown < 400) await wait(400 - shown); }
    if (ex.run !== run) return;
    if (ex.failNext) {
      ex.failNext = false;
      M.reflow(dlgExport, () => { ex.state = "failed"; renderExport(); });
      $("#export-go").focus();
      return;
    }
    ex.url = URL.createObjectURL(new Blob(parts, { type: "text/csv;charset=utf-8" }));
    // Done: the dialog settles around its result (the file line glides from where it stood), then the mark draws and
    // the words rise (motion.js). Focus and the announcement come at once.
    const doneEl = $("#export-done");
    M.reflow(dlgExport, () => { ex.state = "done"; renderExport(); }, { own: [doneEl], pairs: [[$("#export-file"), () => $(".file-line", doneEl)]] });
    $("#export-save").focus();
    say(L.readySay(plain(L.rows(ex.rows))));
    M.done(doneEl, { delay: M.T.doneAfterReflow });
  }
  $("#export-form").addEventListener("submit", (e) => {
    e.preventDefault();
    if (ex.state === "working" || ex.state === "done") return;
    const v = exportPicker.validate();
    if (v.error || v.empty) { exportPicker.focus(); return; }
    runExport(v.a, v.b).catch(() => { ex.state = "failed"; renderExport(); });
  });

  /* ---------------------------------------------------------------- start */
  if (phase === "loading") startLoading(ARRIVE);
  else renderAll();
  window.__reports = {
    ready: false,
    lang: LANG,
    state: STATE,
    // K-02: the page's state and the first payload's lifecycle (as the Daily page's __eclipse.load).
    page: PAGE,
    get phase() { return phase; },
    get shown() { return pageNow; },
    load: {
      arrive: () => arrive(),
      fail: () => fail(),
      retry: () => retry(),
      show: () => { if (phase !== "loading") return false; root.dataset.load = "shown"; if (load.shownAt == null) load.shownAt = performance.now(); return true; },
      get announcements() { return load.announcements.slice(); },
    },
    get range() { return { kind: range.kind, from: isoOf(range.a), to: isoOf(range.b) }; },
    get model() {
      return {
        days: model.days.map((d) => ({ day: isoOf(d.dn), peak: d.peak, peakTime: d.peakM == null ? null : fmtTime(d.peakM), avg: d.avg == null ? null : Math.round(d.avg * 10) / 10, entries: d.entries, observed: d.observed, expected: d.expected, none: d.none })),
        avg: model.avg == null ? null : Math.round(model.avg * 10) / 10, entries: model.entries, withReadings: model.withReadings,
        top: model.top ? { day: isoOf(model.top.dn), peak: model.top.peak } : null,
        busiest: model.busiest ? { wd: model.busiest.wd, c: model.busiest.c, avg: Math.round(model.busiest.avg * 10) / 10 } : null,
        heat: model.heat.map((row) => row.map((c) => ({ state: c.state, avg: c.avg == null ? null : Math.round(c.avg * 10) / 10, samples: c.samples }))),
      };
    },
    get wow() { return { comparable: wow.comparable, avgChange: wow.avgChange, entriesChange: wow.entriesChange, cur: wow.cur, prev: wow.prev, window: { cur: WOW.cur.map(isoOf), prev: WOW.prev.map(isoOf) } }; },
    setRange: (kind, from, to) => setRange(kind === "custom" ? { kind, a: toDn(from), b: toDn(to) } : { kind, a: LAST_FULL - PRESETS[kind] + 1, b: LAST_FULL }),
    openRange: () => openRangeDialog(segButtons[2]),
    picker,
    exportPicker,
    openExport: () => openExportDialog(exportBtn),
    close: () => { if (openDlg) closeDialog(openDlg.dlg, true); },
    get dialog() { return openDlg ? openDlg.dlg.id : null; },
    csv: (from, to) => { const a = toDn(from), b = toDn(to); let s = "﻿" + CSV_HEAD + "\r\n"; for (let dn = a; dn <= b; dn++) s += csvDay(dn); return s; },
    export: {
      get state() { return ex.state; },
      get progress() { return { done: ex.progress, total: ex.total, shown: ex.showProgress }; },
      set hold(v) { ex.hold = Boolean(v); if (!v && ex.release) { const r = ex.release; ex.release = null; r(); } },
      step() { if (ex.release) { const r = ex.release; ex.release = null; r(); } },
      failNext() { ex.failNext = true; },
      // For review (motion-capture.mjs): when the progress line may show, and showing it now.
      set revealDelay(v) { ex.revealDelay = Number(v); },
      reveal: () => revealProgress(),
      get run() { return ex.run; },
    },
    showCell: (wd, c) => focusCell(wd, c),
    // Below 1280 px: the weekday the pattern shows, and the day list shown whole.
    get day() { return dayForm() && hasValues() ? dayWd : null; },
    pickDay: (wd) => pickDay(wd, false),
    showAllDays: () => { if (!listOpen) { listOpen = true; renderDays(); } },
    hideTip,
    motion: { get on() { return motionOn(); }, timings: T, easings: EASE },
  };
  const WANT = params.get("dialog");
  if (WANT === "range") openRangeDialog(segButtons[2]);
  else if (WANT === "export") openExportDialog(exportBtn);
  // The other script's subset is fetched up front too (the rail's language item is written in it), as on the Daily page.
  if (document.fonts && document.fonts.load) ["400", "500"].forEach((w) => document.fonts.load(`${w} 16px "Readex Pro"`, RTL ? "English FITWAY" : "العربية").catch(() => {}));
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { fitSlots(daysTable); if (tipFor) showTip(tipFor); window.__reports.ready = true; });
})();
