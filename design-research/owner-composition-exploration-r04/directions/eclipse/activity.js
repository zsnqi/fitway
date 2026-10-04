/* Eclipse Activity log: FITWAY Owner Activity log concept (the third Eclipse page). Synthetic data only; not production.
 * It answers "who changed what, when, and why": one stream of every record, newest first, a day at a time, with the
 * kind shortcuts (all, the count, access, settings), who did it, the dates, and the reason's words under "More filters".
 * Older records come 25 at a time; the stream ends with «لا توجد سجلات أقدم» / "No older records". The log never
 * refreshes by itself: the time of the last load and a refresh button stand at the controls' far end (DECISIONS
 * item 31). Complete at first paint: no intro, no rolling digits (item 4). Nothing on it is lit: every record is a
 * past fact, and no figure on the page is the answer a light would point at (LGT-6 allows none).
 * The data follows the owner-only audit read contract (packages/api/src/audit/list.ts): eleven actions in three
 * classes, three actors (the shared front desk, the owner, the automatic system), an optional reason of at most 240
 * characters (required for the two deactivations), a prior count that may be "not recorded" (never 0), gym-local
 * times, newest first, keyset pages of 25 with no total.
 * Query: lang=ar|en; kind=count|access|settings; person=staff|owner|system; from, to=YYYY-MM-DD; reason=<words>;
 * more=1 (the "More filters" row open); state=loading|error|empty; arrive=<ms>|never (with state=loading);
 * older=fail|hold (the first "Show older" fails, or keeps working); refresh=fail|hold; case=wide (two records with
 * the widest counts the contract allows); ops=delayed|closed|offline (the frame's status, for review); motion=off.
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
  // The first payload: "ready", "loading", "error", or "retrying" (the error's one retry running).
  let phase = PAGE === "loading" ? "loading" : PAGE === "error" ? "error" : "ready";

  /* ------------------------------------------------------------------ copy */
  const bdi = (s) => `<bdi>${s}</bdi>`;
  const ltr = (s) => `<bdi dir="ltr">${s}</bdi>`;
  const nw = (html) => `<span class="nw">${html}</span>`;
  const COPY = {
    ar: {
      skip: "انتقل إلى المحتوى",
      railLabel: "الأقسام",
      brand: "FITWAY، أسماء الأقسام",
      railTip: "أسماء الأقسام",
      nav: { daily: "اليوم", reports: "التقارير", access: "الوصول", activity: "سجل النشاط", operations: "التشغيل", monitoring: "شاشة المراقبة", lang: "English", settings: "الإعدادات", signout: "تسجيل الخروج" },
      tabs: { daily: "اليوم", reports: "التقارير", activity: "النشاط", access: "الوصول", settings: "الإعدادات" },
      opsTitle: "حالة التشغيل",
      more: "المزيد",
      live: "مباشر",
      lastReading: "آخر قراءة",
      hours: "ساعات العمل",
      langAria: "التبديل إلى اللغة الإنجليزية",
      langGlyph: "EN",
      docTitle: "سجل النشاط · FITWAY (مفهوم)",
      title: "سجل النشاط",
      // The controls.
      kindName: "نوع السجل",
      kinds: { all: "الكل", count: "العدد", access: "الوصول", settings: "الإعدادات" },
      kindsName: { count: "تغييرات العدد" },
      personName: "المنفِّذ",
      person: { all: "الجميع", staff: "مكتب الاستقبال", owner: "المالك", system: "النظام التلقائي" },
      datesName: "التواريخ",
      allDates: "كل التواريخ",
      moreFilters: "المزيد من التصفية",
      moreCount: (n) => `المزيد من التصفية (${bdi(n)})`,
      reasonLabel: "السبب يحتوي على",
      reasonClear: "مسح نص السبب",
      loaded: (t) => `آخر تحميل ${t}`,
      refreshing: "جارٍ التحديث…",
      refresh: "تحديث السجل",
      logTitle: "السجلات",
      // The records.
      today: "اليوم",
      yesterday: "أمس",
      actors: { staff: "مكتب الاستقبال", owner: "المالك", system: "النظام التلقائي" },
      adjBy: (d) => `تعديل العدد بمقدار ${d}`,
      setTo: (n) => `ضبط العدد على ${n}`,
      reset: "تصفير العدد",
      pinCreated: "إنشاء رمز مكتب الاستقبال",
      pinChanged: "تغيير رمز مكتب الاستقبال",
      pinOff: "تعطيل رمز مكتب الاستقبال",
      acctCreated: (n) => `إنشاء حساب ${n}`,
      acctOff: (n) => `تعطيل حساب ${n}`,
      acctOn: (n) => `إعادة تفعيل حساب ${n}`,
      signin: (n) => `إعادة تعيين بيانات دخول ${n}`,
      settings: "تحديث الإعدادات",
      resetAfter: "تصفير بعد الإغلاق",
      notRecorded: "غير مسجّل",
      floored: `توقّف عند ${bdi(0)}`,
      figSay: (a, b) => `من ${a} إلى ${b}`,
      figSayNoPrior: (b) => `السابق غير مسجّل، والجديد ${b}`,
      noReason: "بلا سبب",
      reasonSay: "السبب: ",
      showOlder: "عرض الأقدم",
      loadingOlder: "جارٍ التحميل…",
      olderFailed: "تعذّر تحميل السجلات الأقدم.",
      retry: "إعادة المحاولة",
      retrying: "جارٍ المحاولة…",
      endLine: "لا توجد سجلات أقدم",
      noMatch: "لا سجلات تطابق التصفية",
      clearFilters: "مسح التصفية",
      noRecords: "لا سجلات بعد",
      refreshFail: "تعذّر التحديث",
      refreshFailed: (t) => `تعذّر التحديث. السجلات المعروضة من تحميل ${t}.`,
      listSay: "حُدّثت القائمة",
      olderSay: "حُمّلت سجلات أقدم",
      // The page's states: the status words are the Daily page's (STW-1, STW-2).
      errorWord: "خطأ",
      errorLine: "تعذّر التحميل",
      errorFull: "تعذّر تحميل سجل النشاط",
      errorHint: "تحقّق من الاتصال، ثم أعد المحاولة.",
      errorDates: (a, b) => `تعذّر تحميل السجلات من ${a} إلى ${b}`,
      errorDay: (a) => `تعذّر تحميل سجلات ${a}`,
      loadingWord: "جارٍ التحميل…",
      loadingSay: "جارٍ تحميل سجل النشاط",
      // The dates sheet.
      datesTitle: "اختر التواريخ",
      from: "من",
      to: "إلى",
      dateHint: `يوم/شهر/سنة، مثل ${bdi("16/09/2026")}`,
      datesApply: "عرض السجلات",
      datesClear: "مسح التواريخ",
      cancel: "إلغاء",
      close: "إغلاق",
      err: {
        required: "أدخل تاريخًا",
        format: `اكتب التاريخ هكذا: ${bdi("16/09/2026")}`,
        invalid: "هذا التاريخ غير موجود",
        future: "هذا التاريخ بعد اليوم",
        order: "تاريخ النهاية قبل البداية",
      },
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
      docTitle: "Activity log · FITWAY (concept)",
      title: "Activity log",
      kindName: "Kind of record",
      kinds: { all: "All", count: "Count", access: "Access", settings: "Settings" },
      kindsName: { count: "Count changes" },
      personName: "Done by",
      person: { all: "Everyone", staff: "Front desk", owner: "Owner", system: "Automatic system" },
      datesName: "Dates",
      allDates: "All dates",
      moreFilters: "More filters",
      moreCount: (n) => `More filters (${n})`,
      reasonLabel: "Reason contains",
      reasonClear: "Clear reason text",
      loaded: (t) => `Last loaded ${t}`,
      refreshing: "Refreshing…",
      refresh: "Refresh the log",
      logTitle: "Records",
      today: "Today",
      yesterday: "Yesterday",
      actors: { staff: "Front desk", owner: "Owner", system: "Automatic system" },
      adjBy: (d) => `Count adjusted by ${d}`,
      setTo: (n) => `Count set to ${n}`,
      reset: "Count reset to 0",
      pinCreated: "Front desk PIN created",
      pinChanged: "Front desk PIN changed",
      pinOff: "Front desk PIN turned off",
      acctCreated: (n) => `Account created for ${n}`,
      acctOff: (n) => `Account turned off for ${n}`,
      acctOn: (n) => `Account turned back on for ${n}`,
      signin: (n) => `Sign-in details reset for ${n}`,
      settings: "Settings updated",
      resetAfter: "Reset after closing",
      notRecorded: "Not recorded",
      floored: "Stopped at 0",
      figSay: (a, b) => `from ${a} to ${b}`,
      figSayNoPrior: (b) => `previous count not recorded, now ${b}`,
      noReason: "No reason given",
      reasonSay: "Reason: ",
      showOlder: "Show older",
      loadingOlder: "Loading…",
      olderFailed: "Couldn't load older records.",
      retry: "Try again",
      retrying: "Trying again…",
      endLine: "No older records",
      noMatch: "No records match these filters",
      clearFilters: "Clear filters",
      noRecords: "No records yet",
      refreshFail: "Couldn't refresh",
      refreshFailed: (t) => `Couldn't refresh. The records shown are from ${t}.`,
      listSay: "List updated",
      olderSay: "Older records loaded",
      errorWord: "Error",
      errorLine: "Couldn't load",
      errorFull: "Couldn't load the activity log",
      errorHint: "Check the connection, then try again.",
      errorDates: (a, b) => `Couldn't load records from ${a} to ${b}`,
      errorDay: (a) => `Couldn't load records for ${a}`,
      loadingWord: "Loading…",
      loadingSay: "Loading the activity log",
      datesTitle: "Choose dates",
      from: "From",
      to: "To",
      dateHint: "Day/month/year, like 16/09/2026",
      datesApply: "Show records",
      datesClear: "Clear dates",
      cancel: "Cancel",
      close: "Close",
      err: {
        required: "Enter a date",
        format: "Write the date like 16/09/2026",
        invalid: "This date doesn't exist",
        future: "This date is after today",
        order: "The end is before the start",
      },
    },
  };
  const L = COPY[LANG];

  /* ------------------------------------------------------------ numbers, time and dates */
  const fmtInt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  // A signed change: the plus, or the minus as U+2212 (NUM-4), isolated left to right so it never reads "2−".
  const signed = (n) => ltr(`${n > 0 ? "+" : n < 0 ? "−" : ""}${fmtInt(Math.abs(n))}`);
  // Gym time (Riyadh), a 12-hour clock: «7:31 م» / "7:31 PM" (DAT-1).
  const fmtClock = (mins) => {
    const h = Math.floor(mins / 60) % 24, m = mins % 60;
    return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${RTL ? (h >= 12 ? "م" : "ص") : h >= 12 ? "PM" : "AM"}`;
  };
  const timeText = (mins) => nw(bdi(fmtClock(mins)));
  const DASH = "–";
  const range2 = (a, b) => `${bdi(a)} ${DASH} ${bdi(b)}`;
  const WD_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const WD_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MO_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  const MO_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const MO_EN_L = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  // Dates are gym-local calendar days, handled as whole-day numbers, never as the viewer's local time.
  const toDn = (iso) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 864e5;
  const isoOf = (dn) => new Date(dn * 864e5).toISOString().slice(0, 10);
  const partsOf = (dn) => { const d = new Date(dn * 864e5); return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), wd: d.getUTCDay() }; };
  const monthOf = (m) => (RTL ? MO_AR : MO_EN)[m];
  const dateBare = (dn, year = false) => { const p = partsOf(dn); return `${bdi(p.d)} ${monthOf(p.m)}${year ? ` ${bdi(p.y)}` : ""}`; };
  const dateText = (dn, year = false) => nw(dateBare(dn, year));
  const numDate = (dn) => { const p = partsOf(dn); return `${String(p.d).padStart(2, "0")}/${String(p.m + 1).padStart(2, "0")}/${p.y}`; };
  const plain = (html) => html.replace(/<[^>]+>/g, "");

  /* ------------------------------------------------------------ the gym's log (synthetic, from the contract) */
  const YEAR = 2026;
  const TODAY = toDn("2026-09-23");          // Daily's moment: Wednesday 23 September 2026, 7:42 PM
  const NOW_MIN = 19 * 60 + 42;
  const UTC_OFFSET = 3 * 60;                  // Asia/Riyadh, UTC+3 all year
  const PAGE_N = 25;                          // AUDIT_PAGE_LIMIT_DEFAULT
  const DAY_START = 6 * 60;                   // the business day starts at 6:00 AM (Daily, Reports)
  const COMMAND = ["correction_delta", "correction_absolute", "reset"];
  const ACCESS = ["staff_pin_provisioned", "staff_pin_rotated", "staff_pin_deactivated", "owner_provisioned", "owner_deactivated", "owner_reactivated", "credential_reset"];
  const KIND_ACTIONS = { count: COMMAND, access: ACCESS, settings: ["settings_updated"] };
  const ACTOR_KIND = { staff: "shared_staff", owner: "owner", system: "system" };
  // The second owner account the owner provisions, turns off and back on: a target of access records only. The only
  // actors are the front desk, the owner and the automatic system (DECISIONS item 31).
  const NAMES = { noura: { ar: "نورة", en: "Noura" } };
  const R = (ar, en) => ({ ar, en });
  // The longest reasons the contract allows: exactly 240 characters each (AUDIT_REASON_MAX_LENGTH).
  const LONG = R(
    "انقطعت الكاميرا نحو عشر دقائق في وقت ذروة المساء، ودخلت مجموعة الحصة الجماعية مع المدرب في الوقت نفسه، فعددنا الداخلين يدويًا عند الباب ووجدنا أربعة لم تلتقطهم الكاميرا، وأضفناهم حتى يطابق العدد ما في الصالة فعلًا قبل أن تبدأ الحصة التالية.",
    "The camera dropped out for about ten minutes at the evening peak, right as the group class arrived with the coach. We counted people at the door by hand, found four the camera had missed, and added them so the count matches the floor again.",
  );
  /* The people's records. A reason is stored as it was typed; the concept writes most of them in the page's language
   * so each page reads naturally, and keeps two as typed in the other language (25 August, the owner's English; 17
   * September, the front desk's Arabic), which is what a real log looks like. Each row: the gym-local date and time,
   * the actor, the action, its values, the reason. */
  const HUMAN = [
    ["2025-12-28", "16:12:31", "owner", "staff_pin_provisioned", {}, null],
    ["2025-12-28", "16:20:05", "owner", "settings_updated", { ver: 2 }, R("ساعات العمل الشتوية", "Winter opening hours")],
    ["2025-12-30", "21:05:47", "owner", "owner_provisioned", { target: "noura" }, R("حساب لنورة تتابع منه التقارير وقت سفري", "An account for Noura to follow the reports while I'm away")],
    ["2026-08-16", "11:20:12", "owner", "settings_updated", { ver: 3 }, R("التصفير بعد الإغلاق بخمس دقائق", "Reset five minutes after closing")],
    ["2026-08-17", "10:14:40", "owner", "staff_pin_rotated", { cv: [1, 2] }, R("موظف جديد في الفترة الصباحية", "New employee on the morning shift")],
    ["2026-08-20", "20:47:09", "staff", "correction_delta", { prior: 52, delta: 3 }, R("دخلت مجموعة من ثلاثة أشخاص من الباب الجانبي", "A group of three came in through the side door")],
    ["2026-08-22", "18:30:55", "staff", "correction_delta", { prior: 31, delta: -2 }, R("خرج شخصان من باب الطوارئ", "Two people left through the emergency exit")],
    ["2026-08-25", "09:12:20", "owner", "correction_absolute", { prior: 17, value: 12 }, { raw: "Counted everyone on the floor myself", lang: "en" }],
    ["2026-08-27", "14:03:33", "owner", "owner_deactivated", { target: "noura" }, R("عدتُ من السفر", "I'm back from my trip")],
    ["2026-08-30", "19:55:02", "staff", "correction_delta", { prior: 44, delta: 1 }, null],
    ["2026-08-31", "10:41:18", "staff", "correction_absolute", { prior: null, value: 6 }, R("الكاميرا كانت متوقفة، والعدد من دفتر الاستقبال", "The camera was off; the count is from the front desk sheet")],
    ["2026-09-02", "23:58:41", "owner", "reset", { prior: 9 }, R("الصالة خالية والعدد يظهر 9", "The gym was empty but the count showed 9")],
    ["2026-09-04", "15:15:26", "owner", "settings_updated", { ver: 4 }, null],
    ["2026-09-07", "09:28:03", "owner", "owner_reactivated", { target: "noura" }, null],
    ["2026-09-07", "09:31:44", "owner", "credential_reset", { target: "noura", cv: [1, 2] }, R("طلبت نورة كلمة مرور جديدة", "Noura asked for a new password")],
    ["2026-09-08", "19:10:37", "staff", "correction_delta", { prior: 2, delta: -5 }, R("بقي العدد مرتفعًا بعد خروج المجموعة", "The count stayed high after the group left")],
    ["2026-09-10", "20:02:15", "staff", "correction_delta", { prior: 61, delta: 4 }, LONG],
    ["2026-09-12", "06:02:50", "staff", "reset", { prior: 3 }, R("فتحنا والعدد لم يتصفّر", "We opened and the count wasn't at zero")],
    ["2026-09-14", "13:20:08", "owner", "staff_pin_rotated", { cv: [2, 3] }, null],
    ["2026-09-16", "10:05:59", "owner", "settings_updated", { ver: 5 }, R("ساعات الجمعة الجديدة: من 2 م", "New Friday hours: from 2 PM")],
    ["2026-09-17", "14:06:22", "staff", "correction_absolute", { prior: null, value: 24 }, { raw: "انقطعت الكاميرا من 10 صباحًا، وعددنا يدويًا", lang: "ar" }],
    ["2026-09-19", "21:40:11", "owner", "correction_delta", { prior: 38, delta: -1 }, R("سهو", "Typo")],
    ["2026-09-21", "18:02:46", "owner", "staff_pin_deactivated", {}, R("انتهى عقد موظف المساء، والرمز الجديد غدًا", "The evening employee's contract ended; new PIN tomorrow")],
    ["2026-09-22", "09:15:30", "owner", "staff_pin_provisioned", {}, R("رمز جديد بعد إيقاف القديم", "A new PIN after turning off the old one")],
    ["2026-09-22", "20:20:04", "staff", "correction_delta", { prior: 49, delta: 2 }, R("دخل شخصان من الباب الجانبي قبل الحصة", "Two people came in through the side door before class")],
    ["2026-09-23", "11:32:17", "owner", "settings_updated", { ver: 6 }, R("الإغلاق يوم الخميس الساعة 2 ص", "Thursday closing moved to 2 AM")],
    ["2026-09-23", "18:47:39", "staff", "correction_delta", { prior: 58, delta: -3 }, R("خرجت مجموعة من باب الطوارئ بعد التمرين", "A group left through the emergency exit after training")],
    ["2026-09-23", "19:31:52", "owner", "correction_absolute", { prior: 51, value: 47 }, null],
  ];
  // ?case=wide: the widest counts the read contract allows (Number.MAX_SAFE_INTEGER; the write path and the database
  // column stop at 2,147,483,647), a set and an adjustment, today.
  if (params.get("case") === "wide") {
    HUMAN.push(["2026-09-23", "19:35:10", "owner", "correction_absolute", { prior: 9007199254740990, value: 9007199254740991 }, null]);
    HUMAN.push(["2026-09-23", "19:33:40", "staff", "correction_delta", { prior: 9007199254740991, delta: -9007199254740991 }, null]);
  }
  function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  /* The scheduled reset (SPEC, ADR-008): the automatic system zeroes the count five minutes after each closing, from
   * the setting of 16 August on. Its prior is the count the edge held at closing; on 5 September it held none, so the
   * prior is not recorded. Its stored reason is the contract's machine string, which the page says in plain words. */
  function buildLog() {
    if (PAGE === "empty") return [];
    const rows = [];
    const at = (date, time) => { const [h, m, s] = time.split(":").map(Number); return { dn: toDn(date), mins: h * 60 + m, sec: s }; };
    for (const [date, time, actor, action, v, reason] of HUMAN) {
      const t = at(date, time);
      const cls = COMMAND.includes(action) ? "command" : ACCESS.includes(action) ? "access" : "settings";
      const r = { ...t, actor, actorKind: ACTOR_KIND[actor], action, cls, reason, prior: null, eff: null, delta: null };
      if (action === "correction_delta") { r.prior = v.prior; r.delta = v.delta; r.eff = Math.max(0, v.prior + v.delta); }
      else if (action === "correction_absolute") { r.prior = v.prior; r.eff = v.value; }
      else if (action === "reset") { r.prior = v.prior; r.eff = 0; }
      if (v.target) r.target = v.target;
      if (action.startsWith("staff_pin")) r.target = "desk";
      rows.push(r);
    }
    const rnd = mulberry32(23);
    for (let dn = toDn("2026-08-17"); dn <= TODAY; dn++) {
      const prior = isoOf(dn) === "2026-09-05" ? null : [0, 1, 1, 2, 2, 2, 3, 3, 4, 5, 6][Math.floor(rnd() * 11)];
      const business = dn - 1;
      rows.push({ dn, mins: 65, sec: 2 + Math.floor(rnd() * 7), actor: "system", actorKind: "system", action: "reset", cls: "command", prior, eff: 0, delta: null, business, machine: `scheduled reset for business day ${isoOf(business)}` });
    }
    // The server instant (createdAtUtc) and the keyset order: newest first, a tie broken by the id. The business day
    // (bd) is the gym's day, 6:00 AM to the next opening, as on Daily and Reports: a record after midnight and before
    // 6:00 AM belongs to the day that closed, as the night's reset says of itself ("business day …").
    for (const r of rows) { r.ms = (r.dn * 1440 + r.mins - UTC_OFFSET) * 60000 + r.sec * 1000; r.bd = r.mins < DAY_START ? r.dn - 1 : r.dn; }
    rows.sort((a, b) => a.ms - b.ms);
    rows.forEach((r, i) => { r.id = i + 1; r.utc = new Date(r.ms).toISOString(); });
    // What the reason filter searches is the stored reason (a case-insensitive substring), the machine string included.
    for (const r of rows) r.stored = r.machine || (r.reason ? (r.reason.raw ?? r.reason[LANG]) : null);
    return rows.reverse();
  }
  const LOG = buildLog();

  /* The read contract's list: the filters (actor kind, actions, the occurred range, the reason), newest first, a keyset
   * page of 25, and the next cursor only while more rows exist. There is no total. */
  function query(f, cursor = null, limit = PAGE_N) {
    const acts = f.kind === "all" ? null : KIND_ACTIONS[f.kind];
    const who = f.person === "all" ? null : ACTOR_KIND[f.person];
    const needle = f.reason ? f.reason.toLowerCase() : null;
    const rows = LOG.filter((r) => (!acts || acts.includes(r.action)) && (!who || r.actorKind === who)
      && (f.a == null || r.bd >= f.a) && (f.b == null || r.bd <= f.b)
      && (!needle || (r.stored != null && r.stored.toLowerCase().includes(needle))));
    let s = 0;
    if (cursor) { s = rows.findIndex((r) => r.ms < cursor.ms || (r.ms === cursor.ms && r.id < cursor.id)); if (s < 0) s = rows.length; }
    const entries = rows.slice(s, s + limit), last = entries[entries.length - 1];
    return { entries, next: rows.length > s + limit && last ? { ms: last.ms, id: last.id } : null };
  }

  /* ---------------------------------------------------------------- the filters, from the URL
   * The filters live in the URL, so a reload, the language link and a link from Access or Settings carry them: Access
   * links to activity.html?kind=access, its front desk card to ?person=staff, Settings to ?kind=settings. */
  const parseIso = (s) => (/^\d{4}-\d{2}-\d{2}$/.test(s || "") && isoOf(toDn(s)) === s ? toDn(s) : null);
  const F = (() => {
    const k = params.get("kind"), p = params.get("person");
    let a = parseIso(params.get("from")), b = parseIso(params.get("to"));
    if (a == null || b == null || a > b || b > TODAY) { a = null; b = null; }
    const reason = (params.get("reason") || "").trim().slice(0, 240);
    return { kind: KIND_ACTIONS[k] ? k : "all", person: ACTOR_KIND[p] ? p : "all", a, b, reason };
  })();
  const filtered = () => F.kind !== "all" || F.person !== "all" || F.a != null || Boolean(F.reason);
  function urlFor(extra = {}) {
    const p = new URLSearchParams(location.search);
    ["kind", "person", "from", "to", "reason"].forEach((k) => p.delete(k));
    if (F.kind !== "all") p.set("kind", F.kind);
    if (F.person !== "all") p.set("person", F.person);
    if (F.a != null) { p.set("from", isoOf(F.a)); p.set("to", isoOf(F.b)); }
    if (F.reason) p.set("reason", F.reason);
    Object.entries(extra).forEach(([k, v]) => p.set(k, v));
    return p;
  }

  /* ---------------------------------------------------------------- motion */
  const URL_OFF = params.get("motion") === "off";
  const mqReduce = matchMedia("(prefers-reduced-motion: reduce)");
  const motionOn = () => !URL_OFF && !mqReduce.matches;
  root.dataset.motion = motionOn() ? "on" : "off";
  const EASE = { rail: "cubic-bezier(0.22, 1, 0.36, 1)", railClose: "cubic-bezier(0.4, 0, 0.2, 1)" };
  const T = { railOpen: 240, railClose: 200, railDist: 156, railReveal: 12, dlgOpen: 240, dlgClose: 200 };
  const f2 = (n) => n.toFixed(2);

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
  // Today and Reports keep the language (and ?motion=off), as their own links to each other do.
  {
    const p = new URLSearchParams({ lang: LANG });
    if (URL_OFF) p.set("motion", "off");
    for (const id of ["#daily-link", "#tab-daily"]) $(id).setAttribute("href", `index.html?${p}`);
    for (const id of ["#reports-link", "#tab-reports"]) $(id).setAttribute("href", `reports.html?${p}`);
  }
  const langLink = $("#lang-link"), menuLang = $("#menu-lang");
  for (const el of [langLink, menuLang]) el.setAttribute("hreflang", RTL ? "en" : "ar");
  $(".rail-name", langLink).setAttribute("lang", RTL ? "en" : "ar");
  function syncUrl() {
    const p = urlFor();
    try { history.replaceState(null, "", `${location.pathname}${p.toString() ? `?${p}` : ""}`); } catch (e) { /* file:// may refuse; links still carry the filters */ }
    const q = urlFor({ lang: RTL ? "en" : "ar" });
    langLink.setAttribute("href", `?${q}`);
    menuLang.setAttribute("href", `?${q}`);
  }

  /* ---- rail: the Daily page's rail and its motion (app.js "rail"), as Reports takes it. */
  let railOpen = false;
  let openDlg = null;
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

  /* ---- the frame (Daily's and Reports'): the desktop rail at 1024 px and wider; the same rail from 721 to 1023 px as a
   * modal layer; at 720 px and below the bar and the compact header, whose menu holds Monitoring, the language and sign
   * out. At every size the header's status opens Operations' details. */
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
  rail.addEventListener("focusout", (e) => { if (railOpen && !railModal && e.relatedTarget && !rail.contains(e.relatedTarget)) setRail(false); });
  rail.addEventListener("keydown", (e) => {
    if (e.key !== "Tab" || !railModal) return;
    const f = railFocusables(), i = f.indexOf(document.activeElement);
    const next = e.shiftKey ? (i <= 0 ? f[f.length - 1] : null) : (i === f.length - 1 ? f[0] : null);
    if (next) { e.preventDefault(); next.focus(); }
  });

  const layers = { ops: { btn: $("#ops-btn"), pop: $("#ops-pop") }, menu: { btn: $("#menu-btn"), pop: $("#menu-pop") } };
  let openLayer = null;
  const menuItems = () => [...layers.menu.pop.querySelectorAll('[role="menuitem"]')];
  function showLayer(name, focus = "first") {
    if (openLayer && openLayer !== name) hideLayer(openLayer, false);
    const { btn, pop } = layers[name];
    openLayer = name;
    pop.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    if (name === "menu") { const it = menuItems(); (focus === "last" ? it[it.length - 1] : it[0]).focus(); }
    else pop.focus();
  }
  function hideLayer(name, returnFocus) {
    const { btn, pop } = layers[name];
    if (pop.hidden) return;
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
    if (!pop.contains(e.target) && !btn.contains(e.target)) hideLayer(openLayer, false);
  });
  const onFrameChange = () => { if (railOpen) setRail(false); setRailModal(false); if (openLayer) hideLayer(openLayer, false); };
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

  /* The frame's status (STW-1): the gym's Operations status, as on every screen; in the concept, live with its last
   * reading at 7:42 PM. While the log loads the status is not known (STW-2); a first load that fails says Error, as
   * Reports' does (DECISIONS item 14). */
  const DAY_OPEN = 360, DAY_CLOSE = 60;   // 6:00 AM to 1:00 AM
  const SVG_ERR = `<svg class="ico ico-err" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.4"/><path d="M12 7.6v5.4M12 16.2v.2"/></svg>`;
  const SVG_CLOCK = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.2"/><path d="M12 7.6V12l3 2"/></svg>`;
  const SVG_OFF = `<svg class="ico ico-off" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.2"/><path d="M6.3 17.7 17.7 6.3"/></svg>`;
  const OPS_STATES = {
    live: (m = NOW_MIN) => ({ cls: "", mark: `<span class="dot" aria-hidden="true"></span>`, word: L.live, line: `${L.lastReading} ${timeText(m)}` }),
    delayed: (m = NOW_MIN - 13) => ({ cls: "is-delayed", mark: SVG_CLOCK, word: RTL ? "متأخر" : "Delayed", line: `${L.lastReading} ${timeText(m)}` }),
    closed: () => ({ cls: "is-closed", mark: `<span class="dot ring" aria-hidden="true"></span>`, word: RTL ? "مغلق" : "Closed", line: RTL ? `يفتح ${timeText(DAY_OPEN)}` : `Opens ${timeText(DAY_OPEN)}` }),
    offline: () => ({ cls: "is-off", mark: SVG_OFF, word: RTL ? "غير متصل" : "Offline", line: RTL ? "لا عدّ حاليًا" : "No current count" }),
    error: () => ({ cls: "is-err", mark: SVG_ERR, word: L.errorWord, line: L.errorLine, detail: `${L.errorFull}. ${L.errorHint}` }),
  };
  // ?ops=delayed|closed|offline draws the frame's status in another of its states, to check the page's title against the
  // widest status at every width; the log itself is unchanged by it (its records are history).
  const OPS = ["delayed", "closed", "offline"].includes(params.get("ops")) ? params.get("ops") : "live";
  let statusLoad = null;
  function renderStatus() {
    const btn = layers.ops.btn;
    const loading = phase === "loading";
    if (loading && !statusLoad) { statusLoad = Object.assign(document.createElement("span"), { className: "hb-load", textContent: L.loadingWord }); btn.before(statusLoad); }
    if (!loading && statusLoad) { statusLoad.remove(); statusLoad = null; }
    btn.hidden = loading;
    const s = OPS_STATES[phase === "error" || phase === "retrying" ? "error" : OPS]();
    btn.className = `hbadge${s.cls ? ` ${s.cls}` : ""}`;
    const words = (x) => `${x.mark}<span class="hb-word">${x.word}</span>` +
      `<span class="hb-line"><span class="sr-only">${RTL ? "، " : ", "}</span><span aria-hidden="true">· </span>${x.line}</span>`;
    $("#ops-btn-state").innerHTML = `<span class="sr-only">${L.opsTitle}: </span>${words(s)}`;
    // The slot holds every status's width with the verified widest time, 10:44 AM (decision 24), as on Daily and Reports.
    $("#ops-res").innerHTML = Object.values(OPS_STATES).map((f) => `<span class="hb-r">${words(f(644))}<svg class="hb-chev" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 10l5 5 5-5"/></svg></span>`).join("");
    $("#ops-state").className = `ops-state${s.cls ? ` ${s.cls}` : ""}`;
    $("#ops-state").innerHTML = `${s.mark}<span>${s.word}</span>`;
    $("#ops-last").innerHTML = s.detail || s.line;
    $("#ops-hours").innerHTML = `${L.hours} ${nw(`${bdi(fmtClock(DAY_OPEN))} ${DASH} ${bdi(fmtClock(DAY_CLOSE))}`)}`;
  }

  const say = (text) => { const el = $("#say"); el.textContent = ""; requestAnimationFrame(() => { el.textContent = text; }); };

  /* ---------------------------------------------------------------- icons */
  const ICON = {
    // The kinds wear their section's rail icon: the count is Today's, access is Access's, settings is Settings'.
    command: `<svg class="rec-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4.5 13.5a7.5 7.5 0 0 1 15 0"/><path d="M12 13.5 15.6 9.9"/><path d="M3.5 18h17"/><circle class="fill" cx="12" cy="13.5" r="1.3"/></svg>`,
    access: `<svg class="rec-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="8.2" cy="12" r="3.6"/><path d="M11.8 12h8.4M17.2 12v2.8M20.2 12v2"/></svg>`,
    settings: `<svg class="rec-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M10.02 5.6 10.23 3.28A8.9 8.9 0 0 1 13.77 3.28L13.98 5.6A6.7 6.7 0 0 1 15.13 6.07L16.92 4.58A8.9 8.9 0 0 1 19.42 7.08L17.93 8.87A6.7 6.7 0 0 1 18.4 10.02L20.72 10.23A8.9 8.9 0 0 1 20.72 13.77L18.4 13.98A6.7 6.7 0 0 1 17.93 15.13L19.42 16.92A8.9 8.9 0 0 1 16.92 19.42L15.13 17.93A6.7 6.7 0 0 1 13.98 18.4L13.77 20.72A8.9 8.9 0 0 1 10.23 20.72L10.02 18.4A6.7 6.7 0 0 1 8.87 17.93L7.08 19.42A8.9 8.9 0 0 1 4.58 16.92L6.07 15.13A6.7 6.7 0 0 1 5.6 13.98L3.28 13.77A8.9 8.9 0 0 1 3.28 10.23L5.6 10.02A6.7 6.7 0 0 1 6.07 8.87L4.58 7.08A8.9 8.9 0 0 1 7.08 4.58L8.87 6.07A6.7 6.7 0 0 1 10.02 5.6Z"/><circle cx="12" cy="12" r="2.7"/></svg>`,
    // From → to points along the reading line, so it mirrors in Arabic (ICO-5).
    arrow: `<svg class="fig-arw mirror" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h13.5M13.5 7l5 5-5 5"/></svg>`,
    info: `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.4"/><path d="M12 11v5.2M12 7.8v.2"/></svg>`,
    alert: `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.4"/><path d="M12 7.6v5.4M12 16.2v.2"/></svg>`,
  };

  /* ---------------------------------------------------------------- a record
   * Story 26's five facts: when, who, what, from → to, why. From 960 px of log they stand in five columns; narrower,
   * who and what share a line and the reason goes under them; on a phone the record stacks (activity.css). */
  const nameOf = (key) => (key === "desk" ? L.actors.staff : NAMES[key][LANG]);
  function actText(r) {
    switch (r.action) {
      case "correction_delta": return L.adjBy(signed(r.delta));
      case "correction_absolute": return L.setTo(ltr(fmtInt(r.eff)));
      case "reset": return L.reset;
      case "staff_pin_provisioned": return L.pinCreated;
      case "staff_pin_rotated": return L.pinChanged;
      case "staff_pin_deactivated": return L.pinOff;
      case "owner_provisioned": return L.acctCreated(name(r));
      case "owner_deactivated": return L.acctOff(name(r));
      case "owner_reactivated": return L.acctOn(name(r));
      case "credential_reset": return L.signin(name(r));
      default: return L.settings;
    }
  }
  // The account's name (an owner principal's display name, as stored) joins the phrase, isolated, so a name in either
  // script keeps its own direction; it wraps between its words and never leaves a separator at a line's edge.
  const name = (r) => `<span class="rec-target">${bdi(nameOf(r.target))}</span>`;
  function figHTML(r) {
    if (r.cls !== "command") return "";
    const prior = r.prior == null ? `<span class="fig-nr">${L.notRecorded}</span>` : `<bdi class="fig-n">${fmtInt(r.prior)}</bdi>`;
    const floored = r.action === "correction_delta" && r.prior + r.delta < 0;
    const said = r.prior == null ? L.figSayNoPrior(fmtInt(r.eff)) : L.figSay(fmtInt(r.prior), fmtInt(r.eff));
    return `<div class="rec-fig"><span class="fig" aria-hidden="true">${prior}${ICON.arrow}<bdi class="fig-n">${fmtInt(r.eff)}</bdi></span><span class="sr-only">${said}</span>` +
      (floored ? `<span class="fig-note">${L.floored}</span>` : "") + `</div>`;
  }
  function whyHTML(r) {
    if (!r.reason) return `<p class="rec-why is-none">${L.noReason}</p>`;
    const text = r.reason.raw ?? r.reason[LANG], lang = r.reason.raw ? r.reason.lang : LANG;
    return `<p class="rec-why"><span class="sr-only">${L.reasonSay}</span><q><bdi${lang !== LANG ? ` lang="${lang}"` : ""}>${text}</bdi></q></p>`;
  }
  function recHTML(r) {
    const t = `<time class="rec-t" datetime="${isoOf(r.dn)}T${String(Math.floor(r.mins / 60)).padStart(2, "0")}:${String(r.mins % 60).padStart(2, "0")}+03:00">${bdi(fmtClock(r.mins))}</time>`;
    const who = `<span class="rec-who">${L.actors[r.actor]}</span>`;
    const what = `<span class="rec-what">${ICON[r.cls]}<span class="rec-act">${actText(r)}</span></span>`;
    // The night's reset: its stored reason is the contract's machine string ("scheduled reset for business day …"),
    // said in plain words as part of what happened, so it has no reason of a person's beside it.
    if (r.actor === "system") {
      const act = `<span class="rec-what">${ICON.command}<span class="rec-act">${L.resetAfter}</span></span>`;
      return `<li class="rec is-auto" data-id="${r.id}">${t}<div class="rec-main">${who}${act}</div>${figHTML(r)}</li>`;
    }
    // Counts of seven digits or more (the contract allows up to 9,007,199,254,740,991) take their own line on a phone.
    const long = r.cls === "command" && Math.max(r.prior ?? 0, r.eff ?? 0) >= 1e6;
    return `<li class="rec${long ? " is-long" : ""}" data-id="${r.id}">${t}<div class="rec-main">${who}${what}</div>${figHTML(r)}${whyHTML(r)}</li>`;
  }
  function dayHeading(dn) {
    const p = partsOf(dn);
    const date = RTL ? `${WD_AR[p.wd]} ${bdi(p.d)} ${MO_AR[p.m]}${p.y !== YEAR ? ` ${bdi(p.y)}` : ""}` : `${WD_EN[p.wd]}, ${p.d} ${MO_EN_L[p.m]}${p.y !== YEAR ? ` ${p.y}` : ""}`;
    const rel = dn === TODAY ? L.today : dn === TODAY - 1 ? L.yesterday : "";
    return (rel ? `<span class="day-rel">${rel}</span><span class="sep" aria-hidden="true">·</span>${SR_SEP}` : "") + `<span class="day-date">${nw(date)}</span>`;
  }
  // A business day's records, newest first, so the night's reset after its closing stands at its top; a day split
  // across two pages stays one day.
  function daysHTML(entries) {
    let html = "", cur = null;
    for (const r of entries) {
      if (r.bd !== cur) {
        if (cur !== null) html += "</ol></section>";
        cur = r.bd;
        html += `<section class="day" aria-labelledby="day-${r.bd}"><h3 class="day-h" id="day-${r.bd}">${dayHeading(r.bd)}</h3><ol class="recs">`;
      }
      html += recHTML(r);
    }
    return cur === null ? "" : `${html}</ol></section>`;
  }

  /* ---------------------------------------------------------------- the page's state */
  const view = { entries: [], next: null, loadedAt: NOW_MIN, older: "idle", refresh: "idle" };
  const t0 = performance.now();
  // The concept's clock: Daily's 7:42 PM when the page opened, moving on with real time.
  const clockNow = () => NOW_MIN + Math.floor((performance.now() - t0) / 60000);
  function loadFirst() {
    const page = query(F);
    view.entries = page.entries;
    view.next = page.next;
    view.older = "idle";
    view.loadedAt = clockNow();
  }

  /* ---------------------------------------------------------------- the controls */
  const kindButtons = $$("#kind-seg .seg-b");
  kindButtons.forEach((b) => {
    const k = b.dataset.kind;
    b.textContent = L.kinds[k];
    if (L.kindsName[k]) b.setAttribute("aria-label", L.kindsName[k]);
  });
  const personSel = $("#person");
  personSel.innerHTML = ["all", "staff", "owner", "system"].map((k) => `<option value="${k}">${L.person[k]}</option>`).join("");
  const datesBtn = $("#dates-btn"), moreBtn = $("#more-btn"), morePanel = $("#more");
  const reasonInput = $("#reason"), reasonClear = $("#reason-clear");
  reasonInput.setAttribute("dir", "auto");
  reasonClear.setAttribute("aria-label", L.reasonClear);
  const refreshBtn = $("#refresh");
  refreshBtn.setAttribute("aria-label", L.refresh);
  let moreOpen = params.get("more") === "1" || Boolean(F.reason);
  function rangeLabel(a, b) {
    const A = partsOf(a), B = partsOf(b), yr = A.y !== YEAR || B.y !== YEAR;
    if (a === b) return dateText(a, yr);
    if (A.y !== B.y) return nw(`${dateBare(a, true)} ${DASH} ${dateBare(b, true)}`);
    if (A.m === B.m) return nw(`${range2(A.d, B.d)} ${monthOf(A.m)}${yr ? ` ${bdi(A.y)}` : ""}`);
    return nw(`${dateBare(a)} ${DASH} ${dateBare(b)}${yr ? ` ${bdi(B.y)}` : ""}`);
  }
  // Who is as wide as its own choice (with the select's 81 px of padding), not as its widest name, as a native select is;
  // on a phone that is its least width, so beside a long range the dates take the next line instead.
  const personWrap = $("#person-wrap");
  function fitSelect() {
    const m = document.createElement("span");
    m.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap;font-size:13.5px;line-height:20px";
    m.textContent = personSel.options[personSel.selectedIndex].text;
    personWrap.append(m);
    personWrap.style.setProperty("--sel-w", `${Math.ceil(m.getBoundingClientRect().width) + 82}px`);
    m.remove();
  }
  function renderControls() {
    kindButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.kind === F.kind)));
    personSel.value = F.person;
    personWrap.classList.toggle("is-set", F.person !== "all");
    fitSelect();
    const dl = F.a == null ? L.allDates : rangeLabel(F.a, F.b);
    $("#dates-label").innerHTML = dl;
    datesBtn.setAttribute("aria-label", `${L.datesName}: ${plain(dl)}`);
    datesBtn.classList.toggle("is-set", F.a != null);
    morePanel.hidden = !moreOpen;
    moreBtn.setAttribute("aria-expanded", String(moreOpen));
    $("#more-label").innerHTML = !moreOpen && F.reason ? L.moreCount(1) : L.moreFilters;
    moreBtn.classList.toggle("is-set", !moreOpen && Boolean(F.reason));
    if (document.activeElement !== reasonInput) reasonInput.value = F.reason;
    reasonClear.hidden = !reasonInput.value;
  }
  // The time of the last load and its refresh (DECISIONS item 31): the log never refreshes by itself. Its three forms
  // (the time, "refreshing", and a refresh that failed) share one cell, so the caption keeps one width and nothing beside
  // it moves when the form changes; only the current one is seen and read.
  function renderLoaded() {
    const txt = $("#loaded-text");
    const working = view.refresh === "working", failed = view.refresh === "failed";
    if (phase === "loading") txt.innerHTML = `<i class="ph-bar ph-lab" style="--w:${RTL ? 78 : 108}px" aria-hidden="true"></i>`;
    else if (phase !== "ready") txt.innerHTML = "";
    else {
      const form = (html, on) => `<span class="ld"${on ? "" : ' aria-hidden="true"'}>${html}</span>`;
      // A refresh that failed says so where the time stands, with the time of the records still shown beside it
      // (hidden on a phone, where the row has no room; its alert says it in full): DESIGN_GUIDE §6, the last value stays.
      txt.innerHTML = form(L.loaded(timeText(view.loadedAt)), !working && !failed) + form(L.refreshing, working) +
        form(`<span class="ac-fail">${ICON.alert}${L.refreshFail}</span><span class="ac-fail-time"><span class="sep" aria-hidden="true">·</span>${L.loaded(timeText(view.loadedAt))}</span>`, failed);
    }
    const off = phase !== "ready" || working;
    refreshBtn.setAttribute("aria-disabled", String(off));
    refreshBtn.toggleAttribute("aria-busy", working);
    refreshBtn.classList.toggle("is-off", phase !== "ready");
  }

  /* ---------------------------------------------------------------- the log */
  const logEl = $("#log"), bodyEl = $("#log-body");
  const stackLabels = (a, b, showB) => `<span class="rb-stack"><span class="rb-l"${showB ? ' aria-hidden="true"' : ""}>${a}</span><span class="rb-l"${showB ? "" : ' aria-hidden="true"'}>${b}</span></span>`;
  function endHTML() {
    if (!view.entries.length) return "";
    if (!view.next) return `<p class="ac-end"><span>${L.endLine}</span></p>`;
    if (view.older === "failed") {
      return `<div class="ac-tail"><div class="alert" role="alert">${ICON.alert}<span>${L.olderFailed}</span></div>` +
        `<button class="rbtn rbtn-primary ac-older" id="older-retry" type="button">${stackLabels(L.retry, L.retrying, false)}</button></div>`;
    }
    const working = view.older === "working";
    return `<div class="ac-tail"><button class="rbtn ac-older" id="older" type="button"${working ? ' aria-disabled="true" aria-busy="true"' : ""}>${stackLabels(L.showOlder, L.loadingOlder, working)}</button></div>`;
  }
  function emptyHTML() {
    return filtered()
      ? `<div class="ac-empty">${ICON.info}<p>${L.noMatch}</p><button class="rbtn" id="clear-filters" type="button">${L.clearFilters}</button></div>`
      : `<div class="ac-empty">${ICON.info}<p>${L.noRecords}</p></div>`;
  }
  // The skeleton (STA-10, PH-1…3): a day's heading and six records, each awaited value a flat bar in its own slot.
  const ph = (w) => `<i class="ph-bar ph-lab" style="--w:${w}px" aria-hidden="true"></i>`;
  function skeletonHTML() {
    const W = RTL ? [[34, 64, 116, 54, 190], [34, 40, 132, 0, 150], [34, 64, 96, 54, 220], [34, 40, 140, 0, 120], [34, 82, 108, 54, 0], [34, 40, 124, 0, 170]]
      : [[46, 66, 150, 60, 230], [46, 44, 170, 0, 180], [46, 66, 130, 60, 260], [46, 44, 180, 0, 150], [46, 96, 140, 60, 0], [46, 44, 160, 0, 200]];
    const rows = W.map(([t, w, a, f, y]) => `<li class="rec is-ph${y ? "" : " is-auto"}"><span class="rec-t">${ph(t)}</span><div class="rec-main"><span class="rec-who">${ph(w)}</span><span class="rec-what">${ph(a)}</span></div>` +
      (f ? `<div class="rec-fig">${ph(f)}</div>` : "") + (y ? `<p class="rec-why">${ph(y)}</p>` : "") + `</li>`).join("");
    return `<section class="day is-ph"><p class="day-h">${ph(RTL ? 112 : 190)}</p><ol class="recs" aria-hidden="true">${rows}</ol></section>`;
  }
  function renderList() {
    $("#page-msg")?.remove();
    logEl.hidden = false;
    if (phase === "loading") {
      bodyEl.innerHTML = skeletonHTML();
      return;
    }
    if (phase === "error" || phase === "retrying") { paintError(); return; }
    bodyEl.innerHTML = view.entries.length ? daysHTML(view.entries) + endHTML() : emptyHTML();
    wireList();
    fitFigs();
  }
  function wireList() {
    $("#older")?.addEventListener("click", older);
    $("#older-retry")?.addEventListener("click", older);
    $("#clear-filters")?.addEventListener("click", () => {
      Object.assign(F, { kind: "all", person: "all", a: null, b: null, reason: "" });
      moreOpen = false;
      apply();
      kindButtons[0].focus();
    });
  }
  // The figures' column is as wide as the widest from → to on the page (at most 200 px; a wider one wraps at its
  // arrow), so every record's figures start on one edge.
  function fitFigs() {
    // Each figure's natural width, whether or not it wraps: its parts and the two 6 px gaps between them.
    const natural = (f) => [...f.children].reduce((s, c) => s + c.getBoundingClientRect().width, 0) + 12;
    const widths = $$(".fig", bodyEl).map(natural).concat($$(".fig-note", bodyEl).map((n) => n.scrollWidth));
    bodyEl.style.setProperty("--fw", `${Math.ceil(Math.min(200, Math.max(64, ...widths)))}px`);
  }
  function renderAll() {
    renderControls();
    renderLoaded();
    renderList();
    renderStatus();
    root.dataset.phase = phase;
    logEl.toggleAttribute("aria-busy", phase === "loading" || phase === "retrying");
  }

  /* ---------------------------------------------------------------- filtering */
  function apply(announce = true) {
    syncUrl();
    view.refresh = "idle";
    $("#refresh-alert").textContent = "";
    // A new filter is a new request: while the log could not load, asking for another is its retry.
    if (phase === "error") { startLoading(LOAD.retry); return; }
    if (phase !== "ready") { renderControls(); return; }
    loadFirst();
    renderAll();
    if (announce) say(view.entries.length ? L.listSay : filtered() ? L.noMatch : L.noRecords);
  }
  kindButtons.forEach((b) => b.addEventListener("click", () => { if (F.kind === b.dataset.kind) return; F.kind = b.dataset.kind; apply(); }));
  personSel.addEventListener("change", () => { F.person = personSel.value; apply(); });
  moreBtn.addEventListener("click", () => {
    moreOpen = !moreOpen;
    renderControls();
    if (moreOpen) reasonInput.focus();
  });
  let reasonTimer = 0;
  const commitReason = () => {
    clearTimeout(reasonTimer);
    const v = reasonInput.value.trim().slice(0, 240);
    if (v === F.reason) return;
    F.reason = v;
    apply();
  };
  reasonInput.addEventListener("input", () => {
    reasonClear.hidden = !reasonInput.value;
    clearTimeout(reasonTimer);
    reasonTimer = setTimeout(commitReason, 450);
  });
  reasonInput.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    commitReason();
    // On a touch screen, Enter (the keyboard's search key) also puts the keyboard away so the results show.
    if (matchMedia("(pointer: coarse)").matches) reasonInput.blur();
  });
  reasonClear.addEventListener("click", () => { reasonInput.value = ""; reasonClear.hidden = true; commitReason(); reasonInput.focus(); });

  /* ---------------------------------------------------------------- older records, refresh */
  const OLDER = params.get("older"), REFRESH = params.get("refresh");
  let olderFailedOnce = false, refreshFailedOnce = false;
  function older() {
    if (view.older === "working" || !view.next || phase !== "ready") return;
    view.older = "working";
    const btn = $("#older") || $("#older-retry");
    if (btn && btn.id === "older") {
      // Working (STA-9): its words change at once, it keeps its width and focus, and a press does nothing.
      const [idle, busy] = btn.querySelectorAll(".rb-l");
      idle.setAttribute("aria-hidden", "true");
      busy.removeAttribute("aria-hidden");
      btn.setAttribute("aria-disabled", "true");
      btn.setAttribute("aria-busy", "true");
    } else {
      bodyEl.querySelector(".ac-tail").outerHTML = endHTML();
      wireList();
      $("#older").focus();
    }
    if (OLDER === "hold") return;
    later(700, () => {
      if (view.older !== "working") return;
      if (OLDER === "fail" && !olderFailedOnce) {
        olderFailedOnce = true;
        view.older = "failed";
        bodyEl.querySelector(".ac-tail").outerHTML = endHTML();
        wireList();
        $("#older-retry").focus();
        return;
      }
      const page = query(F, view.next);
      const firstNew = page.entries[0];
      view.entries = view.entries.concat(page.entries);
      view.next = page.next;
      view.older = "idle";
      renderList();
      // Focus moves to the first record that arrived, quietly, so a screen reader goes on from there; Tab goes on to
      // "Show older" again.
      const li = firstNew && bodyEl.querySelector(`.rec[data-id="${firstNew.id}"]`);
      if (li) { li.tabIndex = -1; li.focus({ preventScroll: true }); li.scrollIntoView({ block: "nearest" }); }
      say(view.next ? L.olderSay : `${L.olderSay}. ${L.endLine}`);
    });
  }
  function refresh() {
    if (phase !== "ready" || view.refresh === "working") return;
    $("#refresh-alert").textContent = "";
    view.refresh = "working";
    renderLoaded();
    if (REFRESH === "hold") return;
    later(800, () => {
      if (REFRESH === "fail" && !refreshFailedOnce) {
        // A refresh that fails is not an error: the records shown stay, and say which load they are (DESIGN_GUIDE §6).
        refreshFailedOnce = true;
        view.refresh = "failed";
        renderLoaded();
        const a = $("#refresh-alert");
        a.textContent = "";
        setTimeout(() => { a.textContent = plain(L.refreshFailed(fmtClock(view.loadedAt))); }, 50);
        return;
      }
      view.refresh = "idle";
      loadFirst();
      renderAll();
      say(plain(L.loaded(fmtClock(view.loadedAt))));
    });
  }
  refreshBtn.addEventListener("click", () => { if (refreshBtn.getAttribute("aria-disabled") !== "true") refresh(); });

  /* ---------------------------------------------------------------- the page's states
   *   loading  0-300 ms the slots wait empty (data-load="wait"); from 300 ms the skeleton, at least 400 ms; one
   *            announcement at 1 s; the 10 s ceiling turns it into Error. ?arrive=<ms> brings the payload that many ms
   *            after the page opened; ?arrive=never lets the ceiling run; without it the skeleton is held, for review.
   *            The controls, the day's words and the frame are real from the first paint.
   *   error    the first payload could not be loaded: the header's Error, and one message for the page in place of the
   *            log (Reports' option C): the mark, one sentence naming what is missing (and its dates when the dates
   *            are chosen), one action. The retry takes focus and runs as an action (STA-9), then arrives.
   *   empty    the log holds no record yet. A filter that matches nothing is the filtered-empty state. */
  const LOAD = { delay: 300, min: 400, say: 1000, ceiling: 10000, retry: 1200 };
  const ARRIVE = (() => { const a = params.get("arrive"); if (a === "never") return "never"; const n = Number(a); return a != null && a !== "" && Number.isFinite(n) && n >= 0 ? n : null; })();
  const load = { shownAt: null, timers: [] };
  const later = (ms, fn) => load.timers.push(setTimeout(fn, Math.max(0, ms)));
  const clearTimers = () => { load.timers.splice(0).forEach(clearTimeout); };
  let retryBtn = null, focusAlert = phase === "error";
  function periodSentence(a, b, span, single) {
    const A = partsOf(a), B = partsOf(b);
    return a === b ? single(dateText(b, true))
      : A.y !== B.y ? span(dateText(a, true), dateText(b, true))
      : A.m === B.m ? span(nw(bdi(A.d)), dateText(b, true))
      : span(dateText(a), dateText(b, true));
  }
  function paintError() {
    logEl.hidden = true;
    let msg = $("#page-msg");
    if (!msg) {
      msg = Object.assign(document.createElement("section"), { className: "card ac-msg", id: "page-msg" });
      logEl.after(msg);
    }
    const sentence = F.a == null ? L.errorFull : periodSentence(F.a, F.b, L.errorDates, L.errorDay);
    const trying = phase === "retrying";
    msg.innerHTML = `<p class="ac-say" aria-hidden="true">${SVG_ERR}<span>${sentence}</span></p><span class="sr-only" id="err-say" role="alert"></span>` +
      `<button class="rbtn rbtn-primary" id="retry" type="button"${trying ? ' aria-disabled="true" aria-busy="true"' : ""}>${stackLabels(L.retry, L.retrying, trying)}</button>`;
    retryBtn = $("#retry", msg);
    retryBtn.addEventListener("click", retry);
    const sayEl = $("#err-say", msg);
    if (!trying) setTimeout(() => { if (sayEl.isConnected) sayEl.innerHTML = sentence; }, 50);
    if (focusAlert) { retryBtn.focus(); focusAlert = false; }
  }
  function startLoading(arriveAfter) {
    clearTimers();
    phase = "loading";
    root.dataset.load = "wait";
    load.shownAt = null;
    view.entries = [];
    view.next = null;
    renderAll();
    later(LOAD.delay, () => { if (phase === "loading") { root.dataset.load = "shown"; load.shownAt = performance.now(); } });
    later(LOAD.say, () => { if (phase === "loading") say(L.loadingSay); });
    if (typeof arriveAfter === "number") later(arriveAfter, arrive);
    else if (arriveAfter === "never") later(LOAD.ceiling, fail);
  }
  function arrive() {
    if (phase !== "loading" && phase !== "retrying") return false;
    const now = performance.now();
    // Once shown, a skeleton stays at least 400 ms, so it never flickers.
    if (phase === "loading" && load.shownAt != null && now - load.shownAt < LOAD.min) { later(load.shownAt + LOAD.min - now, arrive); return false; }
    clearTimers();
    const hadFocus = Boolean(retryBtn && document.activeElement === retryBtn);
    phase = "ready";
    delete root.dataset.load;
    loadFirst();
    renderAll();
    if (hadFocus) { logEl.tabIndex = -1; logEl.focus({ preventScroll: true }); }
    say(view.entries.length ? L.listSay : filtered() ? L.noMatch : L.noRecords);
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
    logEl.setAttribute("aria-busy", "true");
    later(LOAD.retry, arrive);
    later(LOAD.ceiling, fail);
    return true;
  }

  /* ---------------------------------------------------------------- the form system: a date field
   * Reports' field: day/month/year, Western digits; Arabic-Indic digits typed on an Arabic keyboard are read as
   * Western; and here eight digits with no separator too (16092026), which is all a phone's number pad can type. */
  const toWestern = (s) => s.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
  function parseDate(raw) {
    const s = toWestern(String(raw || "")).trim();
    if (!s) return { error: "required" };
    let m = /^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/.exec(s) || /^(\d{2})(\d{2})(\d{4})$/.exec(s), y, mo, d;
    if (m) { d = +m[1]; mo = +m[2]; y = +m[3]; }
    else if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s))) { y = +m[1]; mo = +m[2]; d = +m[3]; }
    else return { error: "format" };
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return { error: "invalid" };
    const dn = Date.UTC(y, mo - 1, d) / 864e5, p = partsOf(dn);
    if (p.d !== d || p.m !== mo - 1 || p.y !== y) return { error: "invalid" };
    if (dn > TODAY) return { error: "future" };
    return { dn };
  }
  function makeField(host, id, label, hintId) {
    host.innerHTML = `<label class="field-label" for="${id}">${label}</label>
      <input class="field-input" id="${id}" name="${id}" type="text" inputmode="numeric" autocomplete="off" spellcheck="false" dir="ltr" aria-describedby="${hintId}">
      <p class="field-err" id="${id}-err" hidden></p>`;
    const input = $("input", host), err = $(".field-err", host);
    const field = {
      input,
      get value() { return input.value; },
      set value(v) { input.value = v; },
      setError(msg) {
        if (msg) {
          err.innerHTML = `${ICON.alert}<span>${msg}</span>`;
          err.hidden = false;
          input.setAttribute("aria-invalid", "true");
          input.setAttribute("aria-describedby", `${id}-err ${hintId}`);
          host.classList.add("is-invalid");
        } else {
          err.hidden = true;
          err.innerHTML = "";
          input.removeAttribute("aria-invalid");
          input.setAttribute("aria-describedby", hintId);
          host.classList.remove("is-invalid");
        }
      },
    };
    input.addEventListener("blur", () => { const r = parseDate(input.value); if (r.dn != null) input.value = numDate(r.dn); });
    // A field's message leaves as soon as the owner edits it, so a corrected date never sits over an old error (Reports'
    // field keeps its message until the next submit).
    input.addEventListener("input", () => { if (host.classList.contains("is-invalid")) field.setError(""); });
    return field;
  }
  function validatePair(from, to) {
    const A = parseDate(from.value), B = parseDate(to.value);
    const ea = A.error ? L.err[A.error] : "";
    let eb = B.error ? L.err[B.error] : "";
    if (!ea && !eb && B.dn < A.dn) eb = L.err.order;
    from.setError(ea); to.setError(eb);
    if (ea) return { focus: from };
    if (eb) return { focus: to };
    return { a: A.dn, b: B.dn };
  }

  /* ---------------------------------------------------------------- the dialog system (Reports')
   * showModal (the page behind is inert), a scrim and a panel; a bottom sheet at 720 px and below (DLG-5). Initial
   * focus on the first field (DLG-3: a dialog that asks the owner to choose). Tab wraps; Escape and the scrim close it;
   * focus returns to the control that opened it. */
  const dlgRun = { anims: [] };
  const isSheet = () => matchMedia("(max-width: 720px)").matches;
  const focusables = (el) => $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', el)
    .filter((x) => !x.disabled && !x.closest("[hidden]") && x.getClientRects().length);
  function finishDlgAnims() { dlgRun.anims.forEach((a) => a.cancel()); dlgRun.anims = []; }
  function openDialog(dlg, opener, first) {
    if (openDlg) closeDialog(openDlg.dlg, true);
    if (railOpen) setRail(false);
    openDlg = { dlg, opener };
    dlg.showModal();
    dlg.classList.add("is-open");
    finishDlgAnims();
    if (motionOn()) {
      const panel = $(".dlg-panel", dlg), sc = $(".dlg-scrim", dlg);
      const o = { duration: T.dlgOpen, easing: EASE.rail };
      dlgRun.anims = [
        sc.animate([{ opacity: 0 }, { opacity: 1 }], o),
        panel.animate(isSheet() ? [{ transform: "translateY(100%)" }, { transform: "none" }] : [{ transform: "translateY(14px)" }, { transform: "none" }], o),
      ];
      const run = dlgRun.anims;
      Promise.all(run.map((a) => a.finished)).then(() => { if (dlgRun.anims === run) finishDlgAnims(); }).catch(() => {});
    }
    (first || focusables($(".dlg-panel", dlg))[0]).focus();
  }
  function closeDialog(dlg, instant = false, back = null) {
    if (!openDlg || openDlg.dlg !== dlg) return;
    const { opener } = openDlg;
    openDlg = null;
    finishDlgAnims();
    const done = () => {
      finishDlgAnims();
      dlg.classList.remove("is-open");
      if (dlg.open) dlg.close();
      const to = back || (opener && opener.isConnected ? opener : $("#main"));
      to.focus();
    };
    if (instant || !motionOn()) { done(); return; }
    const panel = $(".dlg-panel", dlg), sc = $(".dlg-scrim", dlg);
    const o = { duration: T.dlgClose, easing: EASE.railClose, fill: "forwards" };
    dlgRun.anims = [
      sc.animate([{ opacity: 1 }, { opacity: 0 }], o),
      panel.animate(isSheet() ? [{ transform: "none" }, { transform: "translateY(100%)" }] : [{ transform: "none" }, { transform: "translateY(10px)" }], o),
    ];
    Promise.all(dlgRun.anims.map((a) => a.finished)).then(done).catch(done);
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

  /* ---- the dates: both days, gym-local, inclusive; "Clear dates" when dates are chosen. */
  const dlgDates = $("#dlg-dates");
  const dFrom = makeField($("#df-from"), "dates-from", L.from, "df-hint");
  const dTo = makeField($("#df-to"), "dates-to", L.to, "df-hint");
  const datesClear = $("#dates-clear");
  function openDatesDialog() {
    dFrom.value = F.a == null ? "" : numDate(F.a);
    dTo.value = F.b == null ? "" : numDate(F.b);
    dFrom.setError(""); dTo.setError("");
    datesClear.hidden = F.a == null;
    openDialog(dlgDates, datesBtn, dFrom.input);
  }
  datesBtn.addEventListener("click", openDatesDialog);
  $("#dates-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const v = validatePair(dFrom, dTo);
    if (v.focus) { v.focus.input.focus(); return; }
    closeDialog(dlgDates);
    if (F.a === v.a && F.b === v.b) return;
    F.a = v.a; F.b = v.b;
    apply();
  });
  datesClear.addEventListener("click", () => {
    closeDialog(dlgDates);
    F.a = null; F.b = null;
    apply();
  });

  /* ---------------------------------------------------------------- start */
  if (phase === "ready") loadFirst();
  syncUrl();
  renderAll();
  if (phase === "loading") startLoading(ARRIVE);
  // Font metrics change the figures' widths: measure again once the faces are in.
  document.fonts.ready.then(() => { fitSelect(); if (phase === "ready") fitFigs(); });
  // Hooks for the capture script.
  window.__activity = {
    ready: true,
    get phase() { return phase; },
    get view() { return view; },
    filters: F,
    arrive, fail, older, refresh,
    openDates: () => openDatesDialog(),
    setKind: (k) => { F.kind = k; apply(); },
    setPerson: (p) => { F.person = p; apply(); },
    setDates: (a, b) => { F.a = a == null ? null : toDn(a); F.b = b == null ? null : toDn(b); apply(); },
    setReason: (s) => { F.reason = s; moreOpen = true; apply(); },
    loadAll: () => { while (view.next) { const p = query(F, view.next); view.entries = view.entries.concat(p.entries); view.next = p.next; } renderList(); },
    count: () => LOG.length,
  };
})();
