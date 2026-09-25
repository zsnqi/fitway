/*
 * FITWAY Owner · "Pit Wall" (جدار الصيانة) — exploration concept, synthetic data only.
 * Self-contained: no build step, no dependencies. Nothing here is production code.
 */
(() => {
  "use strict";

  /* ------------------------------------------------------------------ URL state */
  const params = new URLSearchParams(location.search);
  const LANG = params.get("lang") === "en" ? "en" : "ar";
  const RTL = LANG === "ar";
  const SECTIONS = ["daily", "history", "access", "audit", "health", "settings"];
  const STATES = ["live", "delayed", "closed", "empty", "loading", "error"];
  let section = SECTIONS.includes(params.get("section")) ? params.get("section") : "daily";
  let dayState = STATES.includes(params.get("state")) ? params.get("state") : "live";
  const MOTION_OFF =
    params.get("motion") === "off" ||
    (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const root = document.documentElement;
  root.lang = LANG;
  root.dir = RTL ? "rtl" : "ltr";
  root.classList.toggle("motion-off", MOTION_OFF);

  /* ------------------------------------------------------------------ Copy */
  // Production wording where it exists (owner/messages.ts, reporting/messages.ts,
  // owner-section-switch labels, staffWeb.common/admin). Concept-only lines are marked "concept".
  const COPY = {
    en: {
      skip: "Skip to operational status",
      modesLabel: "Workspace",
      monitoring: "Monitoring",
      management: "Management",
      sectionsLabel: "Management sections",
      sections: { daily: "Daily", history: "Reports", access: "Access", audit: "Activity Log", health: "Operations", settings: "Settings" },
      langLabel: "Switch to Arabic",
      langText: "العربية",
      signOut: "Sign out",
      concept: "Exploration concept · synthetic data",
      conceptInert: "Not active in this exploration concept.",
      lampLive: "live",
      lampDelayed: "delayed",

      title: "Daily analytics",
      description: "Your gym day, with times shown in the gym’s timezone",
      status: "Status",
      live: "Live",
      delayed: "Delayed",
      closedToday: "Closed today",
      noReadingsYet: "No readings yet",
      loadingShort: "Loading",
      errorShort: "Not loaded",
      latestReading: "Latest reading",
      lastKnown: "Last-known reading",
      businessDay: "Business day",
      weekdayToday: "Wednesday",
      hours: "Opening hours",
      nextDay: "next day",
      gymTime: "Gym time",
      gymTimeValue: "Riyadh",
      capacity: "Configured capacity",
      delayedNotice: "Live updates are delayed. These values are last known.",
      delayedNotice2: "Live updates resume automatically once the counting device starts sending again.",

      chartTitle: "People present through the day",
      chartLabel: "Interactive occupancy curve",
      chartHint: "Focus the chart and use Left or Right Arrow to inspect observed points. Hover or tap also selects a point.",
      chartKeys: '<kbd>Page Up</kbd> / <kbd>Page Down</kbd> move 60 minutes; <kbd>Home</kbd> / <kbd>End</kbd> jump to the first / latest reading.',
      oneAxis: "three strips, one time axis",
      peopleName: "People present",
      peopleScale: "per minute · scale 0-80, configured capacity",
      entriesTitle: "Entries per 10 minutes",
      entriesNote: "estimated entrance crossings",
      coverageTitle: "Data coverage by minute",
      coverageNote: "Recorded open minutes / scheduled open minutes",
      binRule: "Each step sums entrance crossings in a 10-minute bin. A dashed step is incomplete: some of its minutes were not observed or have not happened yet.",
      stRecorded: "Recorded",
      stZero: "Genuine zero",
      stMissing: "Missing observation",
      stWaiting: "Waiting for readings",
      stAhead: "Still ahead",
      now: "Now",
      until: "until",
      min: "min",
      selectedReading: "Selected reading",
      count: "Approximate occupancy",
      presentPrefix: "≈",
      presentSuffix: "present",
      band: "Crowd band",
      bands: { quiet: "Quiet", moderate: "Moderate", busy: "Busy", packed: "Packed" },
      entries: "Entries",
      binIncomplete: "incomplete bin",
      source: "Source",
      sourceLive: "Live",
      observed: "Observed",
      missingExplain: (a, b) => `No reading for this minute. Part of an observation gap from ${a} to ${b}.`,
      waitingExplain: (t) => `No reading has arrived for this minute yet. Last-known reading at ${t}.`,
      zeroExplain: "The gym was open and nobody was inside.",
      dayFigures: "Day figures",
      dayFiguresLive: (t) => `through ${t}`,
      dayFiguresDelayed: (t) => `last known · through ${t}`,
      peak: "Peak level",
      atTime: "at",
      average: "Average occupancy",
      recordedMinutesPrefix: "Across",
      recordedMinutesSuffix: "recorded minutes",
      crossings: "Total entries",
      crossingsNote: "Estimated entrance crossings, not unique members",
      busiestEntryHour: "Most entries around",
      coverage: "Data coverage",
      observedPrefix: "Observed",
      of: "of",
      scheduledMinutes: "scheduled minutes",
      tableSummary: "Minute details",
      minutePage: "Minute page",
      minuteRange: "Showing",
      minuteTotal: "of",
      minutesWord: "minutes",
      previousPage: "Previous 60 minutes",
      nextPage: "Next 60 minutes",
      tableRegion: "Minute-by-minute analytics data",
      colTime: "Gym-local time",
      colState: "State",
      colCount: "Approximate occupancy",
      colBand: "Crowd band",
      colEntries: "Entries",
      colSource: "Source",
      closedDayTitle: "FITWAY is closed today",
      closedDayDescription: "FITWAY is closed today on the published schedule, so no readings are expected. Daily analytics resumes with the first reading after the gym reopens.",
      noObservedTitle: "No readings yet today",
      noObservedDescription: "Today’s chart will appear when readings are available.",
      loading: "Loading today's readings",
      loadingDescription: "Loading the daily analytics summary and chart.",
      errorTitle: "Today's readings didn't load",
      errorDescription: "We couldn’t load today’s readings. Please try again.",
      retry: "Try again",
      noValue: "Not available",

      rPageTitle: "Reports",
      rTitle: "Busiest times and direction",
      rDescription: "How the week actually fills, by weekday and gym-local hour",
      windowLabel: "Window",
      windowDays: "Business days",
      timeZoneLabel: "Gym timezone",
      rangeLegend: "Reporting range",
      rangeHint: "Up to 31 days",
      startLabel: "Start",
      endLabel: "End",
      apply: "Apply",
      presetsLegend: "Quick ranges",
      presetLast7: "Last 7 days",
      presetLast28: "Last 28 days",
      presetLast31: "Last 31 days",
      rangePending: "Changes not applied yet",
      rangeApplied: "Report window applied",
      problemIncomplete: "Choose both a first and a last business day.",
      problemMalformed: "That is not a real calendar day.",
      problemInverted: "The last day comes before the first day.",
      problemTooLong: "This window is longer than 31 business days.",
      problemCsvTooLong: "An export covers at most 366 business days.",
      heatmapTitle: "Occupancy by weekday and hour",
      heatmapDescription: "How busy the gym usually is at each hour of the working day",
      heatmapRegion: "Weekday by hour heatmap",
      heatmapHint: "Select a cell to read its figures. Arrow keys move between cells.",
      hourAxis: "Gym-local hour",
      weekdayAxis: "Weekday",
      legendLabel: "Cell meaning",
      legendQuiet: "Quieter",
      legendBusy: "Busier",
      legendZero: "Open and empty",
      legendClosed: "Closed",
      legendMissing: "No data",
      legendPartial: "Observed under 90% of scheduled minutes",
      closedUntil: (h) => `Closed until ${h}`,
      cellValueNote: "Cells show the average, rounded to a whole person.",
      profileTitle: "Hour profile",
      profileCoverage: "Coverage",
      selectedTitle: "Selected hour",
      selectedAverage: "Average occupancy",
      selectedObserved: "Observed open minutes",
      selectedExpected: "Scheduled open minutes",
      selectedSamples: "Weekdays measured",
      selectedNoValue: "No average — nothing was observed in this hour.",
      selectedClosed: "The gym was not open in this hour.",
      selectedMissing: "No history was recorded for this hour.",
      stateValue: "Observed",
      stateZero: "Open and empty",
      stateClosed: "Closed",
      stateMissing: "No data",
      comparisonTitle: "Weekly comparison",
      comparisonDescription: "Last 2 complete weeks",
      comparisonMetric: "Metric",
      comparisonCurrent: "Latest week",
      comparisonPrior: "Week before",
      comparisonAverage: "Average occupancy",
      comparisonCrossings: "Total entries",
      comparisonCoverage: "Data coverage",
      comparisonChange: "Change",
      comparisonUp: "up",
      comparisonDown: "down",
      comparisonFlat: "unchanged",
      points: "pts",
      csvTitle: "CSV export range",
      csvDescription: "Download minute-by-minute occupancy history for your selected dates.",
      csvLegend: "Export window",
      csvHint: "Up to 366 days",
      csvExport: "Export CSV",
      csvPrivacyNote: "The file carries occupancy history only: no device, no account, and nothing about an individual visitor.",
      csvConcept: "Exploration concept: no file is created here.",
      footnote: "An average is taken over the minutes that were actually observed, so an outage lowers the data coverage rather than quietly lowering the average. Closed hours are excluded from every average instead of being counted as empty. Changing a setting today never rewrites what last month looked like.",
      hTableSummary: "Hourly detail",
      hTableRegion: "Weekday by hour figures",
      columnWeekday: "Weekday",
      columnHour: "Hour",
      columnState: "State",
      columnAverage: "Average occupancy",
      columnObserved: "Observed open minutes",
      columnExpected: "Scheduled open minutes",
      columnSamples: "Weekdays measured",

      notDesigned: "Not designed in this early look",
      notDesignedBody: "This section keeps its production name and place. Its screen is designed once a direction is chosen.",
      placeholderChannels: "No signal on this channel",
      placeholders: {
        access: ["Access", "Staff PIN and owner accounts"],
        audit: ["Activity Log", "Owner and staff actions"],
        health: ["Operations & incidents", "Counter uptime and incidents over the last business days"],
        settings: ["Settings", "Set capacity, crowd levels, business day, and weekly hours. Changes apply from now on and never rewrite past reports."],
      },
    },
    ar: {
      skip: "الانتقال إلى الحالة التشغيلية",
      modesLabel: "مساحة العمل",
      monitoring: "المراقبة",
      management: "الإدارة",
      sectionsLabel: "أقسام الإدارة",
      sections: { daily: "اليومي", history: "التقارير", access: "الوصول", audit: "سجل النشاط", health: "التشغيل", settings: "الإعدادات" },
      langLabel: "التبديل إلى اللغة الإنجليزية",
      langText: "English",
      signOut: "تسجيل الخروج",
      concept: "مفهوم استكشافي · بيانات تجريبية",
      conceptInert: "غير مفعّل في هذا المفهوم الاستكشافي.",
      lampLive: "مباشر",
      lampDelayed: "متأخر",

      title: "التحليلات اليومية",
      description: "يوم صالتك، مع عرض الأوقات بتوقيت الصالة",
      status: "الحالة",
      live: "مباشر",
      delayed: "متأخر",
      closedToday: "مغلق اليوم",
      noReadingsYet: "لا توجد قراءات بعد",
      loadingShort: "جارٍ التحميل",
      errorShort: "تعذر التحميل",
      latestReading: "آخر قراءة",
      lastKnown: "آخر قراءة معروفة",
      businessDay: "يوم العمل",
      weekdayToday: "الأربعاء",
      hours: "ساعات العمل",
      nextDay: "اليوم التالي",
      gymTime: "توقيت الصالة",
      gymTimeValue: "الرياض",
      capacity: "السعة المضبوطة",
      delayedNotice: "التحديثات المباشرة متأخرة. هذه آخر قيم معروفة.",
      delayedNotice2: "يعود التحديث المباشر تلقائيًا عندما يستأنف جهاز العد الإرسال.",

      chartTitle: "عدد الموجودين خلال اليوم",
      chartLabel: "منحنى إشغال تفاعلي",
      chartHint: "ركّز على المخطط واستخدم سهم اليمين أو اليسار لاستعراض النقاط المرصودة. ويمكنك أيضاً التحديد بالتمرير أو اللمس.",
      chartKeys: '<bdi dir="ltr"><kbd>Page Up</kbd> / <kbd>Page Down</kbd></bdi> للتنقل <bdi class="n" dir="ltr">60</bdi> دقيقة، و<bdi dir="ltr"><kbd>Home</kbd> / <kbd>End</kbd></bdi> لأول قراءة وآخرها.',
      oneAxis: "ثلاثة مسارات على محور زمني واحد",
      peopleName: "الحاضرون",
      peopleScale: "لكل دقيقة · المقياس 0-80، السعة المضبوطة",
      entriesTitle: "الدخول لكل 10 دقائق",
      entriesNote: "تقدير لمرات العبور من المدخل",
      coverageTitle: "تغطية البيانات لكل دقيقة",
      coverageNote: "دقائق العمل المسجّلة / دقائق العمل المجدولة",
      binRule: "كل درجة تجمع مرات العبور من المدخل خلال 10 دقائق. الدرجة المتقطعة غير مكتملة: بعض دقائقها لم تُرصد أو لم تمرّ بعد.",
      stRecorded: "مسجّلة",
      stZero: "صفر فعلي",
      stMissing: "رصد مفقود",
      stWaiting: "بانتظار القراءات",
      stAhead: "لم يحن بعد",
      now: "الآن",
      until: "حتى",
      min: "دقيقة",
      selectedReading: "القراءة المحددة",
      count: "الإشغال التقريبي",
      presentPrefix: "نحو",
      presentSuffix: "حاضرًا",
      band: "مستوى الازدحام",
      bands: { quiet: "هادئ", moderate: "متوسط", busy: "مزدحم", packed: "شديد الازدحام" },
      entries: "الدخول",
      binIncomplete: "فترة غير مكتملة",
      source: "المصدر",
      sourceLive: "مباشر",
      observed: "مرصود",
      missingExplain: (a, b) => `لا توجد قراءة لهذه الدقيقة. هي جزء من فجوة رصد من ${a} إلى ${b}.`,
      waitingExplain: (t) => `لم تصل قراءة لهذه الدقيقة بعد. آخر قراءة معروفة عند ${t}.`,
      zeroExplain: "كانت الصالة مفتوحة ولم يكن فيها أحد.",
      dayFigures: "أرقام اليوم",
      dayFiguresLive: (t) => `حتى ${t}`,
      dayFiguresDelayed: (t) => `آخر ما عُرف · حتى ${t}`,
      peak: "مستوى الذروة",
      atTime: "عند",
      average: "متوسط الازدحام",
      recordedMinutesPrefix: "خلال",
      recordedMinutesSuffix: "دقيقة مسجّلة",
      crossings: "إجمالي الدخول",
      crossingsNote: "تقدير لمرات العبور من المدخل، وليس عدد الأعضاء",
      busiestEntryHour: "ذروة الدخول عند",
      coverage: "تغطية البيانات",
      observedPrefix: "رُصدت",
      of: "من",
      scheduledMinutes: "دقيقة مجدولة",
      tableSummary: "تفاصيل الدقائق",
      minutePage: "صفحة الدقائق",
      minuteRange: "المعروض",
      minuteTotal: "من",
      minutesWord: "دقيقة",
      previousPage: "الدقائق الستون السابقة",
      nextPage: "الدقائق الستون التالية",
      tableRegion: "بيانات التحليلات لكل دقيقة",
      colTime: "الوقت المحلي للصالة",
      colState: "الحالة",
      colCount: "الإشغال التقريبي",
      colBand: "مستوى الازدحام",
      colEntries: "الدخول",
      colSource: "المصدر",
      closedDayTitle: "الصالة مغلقة اليوم",
      closedDayDescription: "الصالة مغلقة اليوم حسب الجدول المعلن، لذلك لا توجد قراءات متوقعة. تعود التحليلات اليومية مع أول قراءة بعد إعادة الفتح.",
      noObservedTitle: "لا توجد قراءات اليوم بعد",
      noObservedDescription: "سيظهر مخطط اليوم عند توفر القراءات.",
      loading: "جارٍ تحميل قراءات اليوم",
      loadingDescription: "جارٍ تحميل ملخص التحليلات اليومية ومخططها.",
      errorTitle: "تعذر تحميل قراءات اليوم",
      errorDescription: "تعذر تحميل قراءات اليوم. يرجى إعادة المحاولة.",
      retry: "إعادة المحاولة",
      noValue: "غير متاح",

      rPageTitle: "التقارير",
      rTitle: "أوقات الذروة والاتجاه",
      rDescription: "كيف يمتلئ الأسبوع فعلياً، بحسب اليوم والساعة بتوقيت الصالة",
      windowLabel: "الفترة",
      windowDays: "أيام العمل",
      timeZoneLabel: "المنطقة الزمنية للصالة",
      rangeLegend: "نطاق التقرير",
      rangeHint: "حتى 31 يوماً",
      startLabel: "البداية",
      endLabel: "النهاية",
      apply: "تطبيق",
      presetsLegend: "فترات سريعة",
      presetLast7: "آخر 7 أيام",
      presetLast28: "آخر 28 يوماً",
      presetLast31: "آخر 31 يوماً",
      rangePending: "تغييرات لم تُطبق بعد",
      rangeApplied: "تم تطبيق فترة التقرير",
      problemIncomplete: "اختر أول يوم عمل وآخر يوم عمل معاً.",
      problemMalformed: "هذا ليس تاريخاً صحيحاً.",
      problemInverted: "آخر يوم يسبق أول يوم.",
      problemTooLong: "هذه الفترة أطول من 31 يوم عمل.",
      problemCsvTooLong: "يغطي التصدير 366 يوم عمل على الأكثر.",
      heatmapTitle: "الإشغال حسب اليوم والساعة",
      heatmapDescription: "الزحمة المعتادة في كل ساعة من أيام العمل",
      heatmapRegion: "خريطة اليوم مقابل الساعة",
      heatmapHint: "اختر خانة لقراءة أرقامها. تنقل بين الخانات بمفاتيح الأسهم.",
      hourAxis: "الساعة بتوقيت الصالة",
      weekdayAxis: "اليوم",
      legendLabel: "دلالة الخانة",
      legendQuiet: "أهدأ",
      legendBusy: "أزحم",
      legendZero: "مفتوحة وفارغة",
      legendClosed: "مغلقة",
      legendMissing: "لا توجد بيانات",
      legendPartial: "رُصدت أقل من 90% من دقائقها المجدولة",
      closedUntil: (h) => `مغلقة حتى ${h}`,
      cellValueNote: "تعرض الخانة المتوسط مقرّباً إلى أقرب شخص.",
      profileTitle: "النمط الساعي",
      profileCoverage: "التغطية",
      selectedTitle: "الساعة المختارة",
      selectedAverage: "متوسط الازدحام",
      selectedObserved: "دقائق العمل التي توفرت فيها قراءات",
      selectedExpected: "دقائق العمل المجدولة",
      selectedSamples: "عدد الأيام التي توفرت فيها قراءات",
      selectedNoValue: "لا يوجد متوسط — لم يُرصد شيء في هذه الساعة.",
      selectedClosed: "لم تكن الصالة مفتوحة في هذه الساعة.",
      selectedMissing: "لم يُسجَّل أي تاريخ لهذه الساعة.",
      stateValue: "مرصودة",
      stateZero: "مفتوحة وفارغة",
      stateClosed: "مغلقة",
      stateMissing: "لا توجد بيانات",
      comparisonTitle: "المقارنة الأسبوعية",
      comparisonDescription: "آخر أسبوعين مكتملين",
      comparisonMetric: "المؤشر",
      comparisonCurrent: "الأسبوع الأخير",
      comparisonPrior: "الأسبوع السابق",
      comparisonAverage: "متوسط الازدحام",
      comparisonCrossings: "إجمالي الدخول",
      comparisonCoverage: "تغطية البيانات",
      comparisonChange: "التغيّر",
      comparisonUp: "ارتفاع",
      comparisonDown: "انخفاض",
      comparisonFlat: "بلا تغيّر",
      points: "نقطة",
      csvTitle: "نطاق تصدير CSV",
      csvDescription: "تنزيل سجل الإشغال لكل دقيقة خلال الفترة المحددة.",
      csvLegend: "فترة التصدير",
      csvHint: "366 يوماً كحد أقصى",
      csvExport: "تصدير CSV",
      csvPrivacyNote: "يحمل الملف سجل الإشغال فقط: لا جهاز، ولا حساب، ولا أي شيء عن زائر بعينه.",
      csvConcept: "مفهوم استكشافي: لا يُنشأ أي ملف هنا.",
      footnote: "يُحسب المتوسط على الدقائق التي توفرت فيها قراءات فعلاً، فالانقطاع يخفض تغطية البيانات بدل أن يخفض المتوسط بصمت. وتُستبعد ساعات الإغلاق من كل متوسط بدل احتسابها فارغة. وتغيير أي إعداد اليوم لا يعيد كتابة صورة الشهر الماضي.",
      hTableSummary: "تفاصيل الساعات",
      hTableRegion: "أرقام اليوم مقابل الساعة",
      columnWeekday: "اليوم",
      columnHour: "الساعة",
      columnState: "الحالة",
      columnAverage: "متوسط الازدحام",
      columnObserved: "دقائق العمل التي توفرت فيها قراءات",
      columnExpected: "دقائق العمل المجدولة",
      columnSamples: "عدد الأيام التي توفرت فيها قراءات",

      notDesigned: "لم يُصمَّم هذا القسم في هذه النظرة الأولى",
      notDesignedBody: "يحتفظ القسم باسمه ومكانه كما في الإنتاج، وتُصمَّم شاشته بعد اختيار الاتجاه.",
      placeholderChannels: "لا إشارة على هذه القناة",
      placeholders: {
        access: ["الوصول", "رمز الموظفين وحسابات المالكين"],
        audit: ["سجل النشاط", "إجراءات المالك والموظفين"],
        health: ["التشغيل والأعطال", "تشغيل جهاز العد والأعطال خلال أيام العمل الأخيرة"],
        settings: ["الإعدادات", "اضبط السعة ومستويات الازدحام ويوم العمل وساعات الأسبوع. تنطبق التغييرات من الآن ولا تعيد كتابة التقارير السابقة."],
      },
    },
  };
  const C = COPY[LANG];

  const WEEKDAYS = {
    en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    ar: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
  };
  const MONTHS = {
    en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    enShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    ar: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
  };

  /* ------------------------------------------------------------------ Formatting
   * Western digits only. No Intl / toLocaleString with a plain "ar" locale.
   */
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const pad2 = (n) => String(n).padStart(2, "0");
  const fmtInt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const fmt1 = (x) => (Math.round(x * 10) / 10).toFixed(1);
  // Numbers are always an LTR island: digits, "%", "≤" and "+" never mirror inside Arabic.
  const n = (s) => `<bdi class="n" dir="ltr">${esc(s)}</bdi>`;
  const mer = (h) => (LANG === "ar" ? (h >= 12 ? "م" : "ص") : h >= 12 ? "PM" : "AM");
  const h12 = (h) => (h % 12 === 0 ? 12 : h % 12);
  const clockOf = (m) => {
    const t = (((360 + m) % 1440) + 1440) % 1440;
    return { h: Math.floor(t / 60), mi: t % 60 };
  };
  /** Plain text time, for accessible names. */
  const tText = (m) => {
    const { h, mi } = clockOf(m);
    return `${h12(h)}:${pad2(mi)} ${mer(h)}`;
  };
  /** Rich time: digits isolated, meridiem kept with them. */
  const tHTML = (m) => {
    const { h, mi } = clockOf(m);
    return `<span class="t"><bdi class="n" dir="ltr">${h12(h)}:${pad2(mi)}</bdi>&nbsp;<span class="mer">${mer(h)}</span></span>`;
  };
  const hourText = (h) => `${h12(h)} ${mer(h)}`;
  const hourHTML = (h) =>
    `<span class="t"><bdi class="n" dir="ltr">${h12(h)}</bdi>&nbsp;<span class="mer">${mer(h)}</span></span>`;
  /** Ranges: Arabic uses a plain hyphen (an en dash reverses in RTL); English an en dash. */
  const DASH = LANG === "ar" ? " - " : " – ";
  const rangeHTML = (a, b) => `<span class="rng">${a}${DASH}${b}</span>`;
  const dateHTML = (y, mo, d, withWeekday) => {
    const wd = withWeekday ? `${WEEKDAYS[LANG][new Date(Date.UTC(y, mo - 1, d)).getUTCDay()]} ` : "";
    return LANG === "ar"
      ? `<span class="d">${wd}<bdi class="n">${d}</bdi> ${MONTHS.ar[mo - 1]} <bdi class="n">${y}</bdi></span>`
      : `<span class="d">${wd}<bdi class="n">${d}</bdi> ${MONTHS.en[mo - 1]} <bdi class="n">${y}</bdi></span>`;
  };
  const dayMonth = (y, mo, d) =>
    LANG === "ar" ? `<bdi class="n">${d}</bdi> ${MONTHS.ar[mo - 1]}` : `<bdi class="n">${d}</bdi> ${MONTHS.enShort[mo - 1]}`;
  const pct = (x) => `${fmt1(x * 100)}%`;

  /* ------------------------------------------------------------------ Synthetic day
   * A count process around a target: each minute, entries ~ Poisson(λ) and exits ~
   * Binomial(occupancy, 1/64). Seeded, so every render is the same day.
   */
  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const DAY_LEN = 1140; // 6:00 AM → 1:00 AM next day, kept with the opening day
  const NOW_M = 822; // 7:42 PM
  const DELAY_M = 801; // 7:21 PM (last reading in the delayed state)
  const MISS_A = 494; // 2:14 PM
  const MISS_B = 511; // 2:31 PM (18 minutes, inclusive)
  const CAPACITY = 80;
  const BANDS = [
    ["quiet", 24],
    ["moderate", 48],
    ["busy", 68],
    ["packed", Infinity],
  ];
  const bandOf = (v) => BANDS.findIndex(([, lim]) => v <= lim);

  const TARGET = [
    ["06:00", 0], ["06:09", 0], ["06:10", 3], ["06:45", 20], ["07:20", 30], ["07:50", 26],
    ["08:30", 15], ["09:30", 9], ["10:30", 7], ["11:30", 8], ["12:30", 13], ["13:00", 15],
    ["13:30", 13], ["14:30", 8], ["15:30", 8], ["16:30", 16], ["17:15", 30], ["17:45", 46],
    ["18:10", 58], ["18:30", 62], ["18:45", 60], ["19:10", 55], ["19:42", 50], ["20:30", 42],
  ].map(([t, v]) => {
    const [h, mi] = t.split(":").map(Number);
    return [(h - 6) * 60 + mi, v];
  });
  const target = (m) => {
    for (let i = 1; i < TARGET.length; i++) {
      if (m <= TARGET[i][0]) {
        const [m0, v0] = TARGET[i - 1];
        const [m1, v1] = TARGET[i];
        return v0 + ((v1 - v0) * (m - m0)) / (m1 - m0);
      }
    }
    return TARGET[TARGET.length - 1][1];
  };
  const SIM = (() => {
    const rnd = mulberry32(264);
    const poisson = (l) => {
      if (l <= 0) return 0;
      const L = Math.exp(-l);
      let k = 0;
      let p = 1;
      do {
        k++;
        p *= rnd();
      } while (p > L);
      return k - 1;
    };
    const binom = (count, p) => {
      let c = 0;
      for (let i = 0; i < count; i++) if (rnd() < p) c++;
      return c;
    };
    const occ = [];
    const ent = [];
    let o = 0;
    for (let m = 0; m <= NOW_M; m++) {
      let e = 0;
      let x = 0;
      if (m >= 10) {
        const T = target(m);
        const lam = Math.max(0, T / 64 + (target(m + 1) - T) + 0.05 * (T - o));
        e = poisson(lam);
        x = binom(o, 1 / 64);
      }
      o = o + e - x;
      occ.push(o);
      ent.push(e);
    }
    return { occ, ent };
  })();

  function dayModel(st) {
    const last = st === "delayed" ? DELAY_M : NOW_M;
    const stateOf = (m) => {
      if (m > NOW_M) return "ahead";
      if (m > last) return "waiting";
      if (m >= MISS_A && m <= MISS_B) return "missing";
      return SIM.occ[m] === 0 ? "zero" : "recorded";
    };
    const observed = (m) => {
      const s = stateOf(m);
      return s === "recorded" || s === "zero";
    };
    let peak = -1;
    let peakM = 0;
    let sum = 0;
    let rec = 0;
    let total = 0;
    const hourEntries = new Array(19).fill(0);
    for (let m = 0; m <= last; m++) {
      if (!observed(m)) continue;
      const v = SIM.occ[m];
      rec++;
      sum += v;
      total += SIM.ent[m];
      hourEntries[Math.floor(m / 60)] += SIM.ent[m];
      if (v > peak) {
        peak = v;
        peakM = m;
      }
    }
    let busiestHour = 0;
    hourEntries.forEach((v, i) => {
      if (v > hourEntries[busiestHour]) busiestHour = i;
    });
    const bins = [];
    for (let b = 0; b < DAY_LEN / 10; b++) {
      let s = 0;
      let obs = 0;
      let elapsed = 0;
      for (let m = b * 10; m < b * 10 + 10; m++) {
        if (m <= NOW_M) elapsed++;
        if (m <= NOW_M && observed(m)) {
          obs++;
          s += SIM.ent[m];
        }
      }
      bins.push({ b, sum: s, obs, elapsed, complete: obs === 10 });
    }
    return {
      st,
      last,
      stateOf,
      observed,
      peak,
      peakM,
      avg: rec ? sum / rec : 0,
      rec,
      scheduled: last + 1,
      total,
      busiestHour,
      bins,
    };
  }

  /* ------------------------------------------------------------------ Synthetic reports window */
  const HOURS = Array.from({ length: 19 }, (_, i) => (6 + i) % 24); // 6 AM hour … 12 AM hour
  const PROFILE_WEEK = [16, 29, 22, 12, 8, 8, 11, 14, 10, 9, 14, 31, 52, 50, 38, 27, 17, 9, 4];
  const PROFILE_FRI = [null, null, null, null, null, null, null, null, 12, 15, 19, 24, 30, 36, 43, 45, 36, 22, 9];
  const PROFILE_SAT = [0, 9, 14, 17, 19, 18, 15, 13, 12, 14, 22, 34, 40, 37, 29, 20, 12, 6, 3];
  const DAY_FACTOR = [1.02, 0.98, 1.0, 1.05, 0.95, 1, 1];
  const DEFAULT_RANGE = { start: "2026-08-26", end: "2026-09-22" };

  const parseISO = (s) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s).trim());
    if (!m) return null;
    const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const t = Date.UTC(y, mo - 1, d);
    const dt = new Date(t);
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
    return { y, mo, d, t };
  };
  const isoOf = (t) => {
    const d = new Date(t);
    return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
  };
  const DAY_MS = 86400000;

  function reportModel(startISO, endISO) {
    const a = parseISO(startISO);
    const b = parseISO(endISO);
    const counts = new Array(7).fill(0);
    for (let t = a.t; t <= b.t; t += DAY_MS) counts[new Date(t).getUTCDay()]++;
    const days = Math.round((b.t - a.t) / DAY_MS) + 1;
    let seed = 0;
    for (const ch of startISO + endISO) seed = (seed * 31 + ch.charCodeAt(0)) | 0;
    const rnd = mulberry32(seed ^ 0x5eed);
    const cells = [];
    let vmax = 0;
    for (let d = 0; d < 7; d++) {
      const row = [];
      for (let hi = 0; hi < 19; hi++) {
        const k = counts[d];
        const base = d === 5 ? PROFILE_FRI[hi] : d === 6 ? PROFILE_SAT[hi] : PROFILE_WEEK[hi] * DAY_FACTOR[d];
        const noise = 1 + (rnd() - 0.5) * 0.12;
        const lost = Math.floor(rnd() * 13); // 0-12 minutes lost per 4 weekdays
        let cell;
        if (base === null) {
          cell = { state: "closed", avg: null, observed: 0, expected: 0, samples: 0 };
        } else if (k === 0) {
          cell = { state: "none", avg: null, observed: 0, expected: 0, samples: 0 };
        } else if (d === 2 && hi === 4) {
          cell = { state: "missing", avg: null, observed: 0, expected: 60 * k, samples: 0 };
        } else if (d === 6 && hi === 0) {
          cell = { state: "zero", avg: 0, observed: 60 * k - Math.round((lost * k) / 4), expected: 60 * k, samples: k };
        } else {
          const expected = 60 * k;
          const observed = d === 3 && hi === 8 ? Math.round((212 * k) / 4) : expected - Math.round((lost * k) / 4);
          const avg = Math.max(1, base * noise);
          cell = { state: "value", avg: Math.round(avg * 10) / 10, observed, expected, samples: k };
          vmax = Math.max(vmax, cell.avg);
        }
        row.push(cell);
      }
      cells.push(row);
    }
    let best = [3, 12];
    cells.forEach((row, d) =>
      row.forEach((c, hi) => {
        if (c.state === "value" && c.avg > cells[best[0]][best[1]].avg) best = [d, hi];
      }),
    );
    return { start: a, end: b, days, counts, cells, vmax, best };
  }

  /* ------------------------------------------------------------------ Small shared pieces */
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  const announcer = $("#announcer");
  let announceTimer = 0;
  const announce = (text) => {
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => {
      announcer.textContent = "";
      requestAnimationFrame(() => (announcer.textContent = text));
    }, 120);
  };
  const bandGlyph = (idx) =>
    `<span class="bandglyph" aria-hidden="true">${[0, 1, 2, 3].map((i) => `<i class="${i <= idx ? "on" : ""}"></i>`).join("")}</span>`;
  const conceptTag = () => `<span class="concept-tag">${esc(C.concept)}</span>`;

  /* ------------------------------------------------------------------ Shell */
  function renderShell() {
    document.title = `FITWAY · ${C.management} · ${C.sections[section]}`;
    const skip = $("#skip");
    skip.textContent = C.skip;
    const other = LANG === "ar" ? "en" : "ar";
    const langHref = urlWith({ lang: other });
    const lamp =
      dayState === "live"
        ? `<span class="lamp lamp--live" aria-hidden="true"></span><span class="sr-only"> · ${esc(C.lampLive)}</span>`
        : dayState === "delayed"
          ? `<span class="lamp lamp--delayed" aria-hidden="true"></span><span class="sr-only"> · ${esc(C.lampDelayed)}</span>`
          : "";
    $("#bar").innerHTML = `
      <div class="bar__brand"><span class="brand-slab" aria-hidden="true"></span><bdi class="brand-word">FITWAY</bdi></div>
      <nav class="modes" aria-label="${esc(C.modesLabel)}">
        <a class="modes__item" href="#" data-inert>${esc(C.monitoring)}</a>
        <a class="modes__item" href="${esc(urlWith({}))}" aria-current="page">${esc(C.management)}</a>
      </nav>
      <div class="keys" role="tablist" aria-label="${esc(C.sectionsLabel)}">
        ${SECTIONS.map(
          (s) => `<button class="key" type="button" role="tab" id="tab-${s}" aria-controls="panel"
            aria-selected="${s === section}" tabindex="${s === section ? 0 : -1}" data-section="${s}">
            ${s === "daily" ? lamp : ""}<span class="key__label">${esc(C.sections[s])}</span></button>`,
        ).join("")}
      </div>
      <div class="bar__utils">
        <a class="util" href="${esc(langHref)}" hreflang="${other}" lang="${other}" aria-label="${esc(C.langLabel)}">${esc(C.langText)}</a>
        <button class="util" type="button" data-inert>${esc(C.signOut)}</button>
      </div>`;
    $$(".key", $("#bar")).forEach((btn) => {
      btn.addEventListener("click", () => selectSection(btn.dataset.section, false));
      btn.addEventListener("keydown", (e) => {
        const i = SECTIONS.indexOf(btn.dataset.section);
        let next = null;
        if (e.key === "Home") next = SECTIONS[0];
        else if (e.key === "End") next = SECTIONS[SECTIONS.length - 1];
        else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          const forward = (e.key === "ArrowRight") !== RTL;
          next = SECTIONS[(i + (forward ? 1 : -1) + SECTIONS.length) % SECTIONS.length];
        }
        if (!next) return;
        e.preventDefault();
        selectSection(next, true);
      });
    });
    $$("[data-inert]").forEach((el) =>
      el.addEventListener("click", (e) => {
        e.preventDefault();
        announce(C.conceptInert);
        el.setAttribute("title", C.conceptInert);
      }),
    );
  }

  function urlWith(over) {
    const p = new URLSearchParams(location.search);
    p.set("lang", LANG);
    p.set("section", section);
    Object.entries(over).forEach(([k, v]) => (v == null ? p.delete(k) : p.set(k, v)));
    return `?${p.toString()}`;
  }

  function selectSection(next, focus) {
    if (next !== section) {
      section = next;
      history.replaceState(null, "", urlWith({}));
      $$(".key").forEach((k) => {
        const on = k.dataset.section === section;
        k.setAttribute("aria-selected", String(on));
        k.tabIndex = on ? 0 : -1;
      });
      document.title = `FITWAY · ${C.management} · ${C.sections[section]}`;
      renderMain();
    }
    if (focus) $(`#tab-${section}`).focus();
  }

  function renderMain() {
    const main = $("#main");
    main.innerHTML = `<div id="panel" role="tabpanel" aria-labelledby="tab-${section}" class="panel panel--${section}"></div>`;
    const panel = $("#panel");
    if (section === "daily") renderDaily(panel);
    else if (section === "history") renderReports(panel);
    else renderPlaceholder(panel, section);
  }

  /* ------------------------------------------------------------------ Session band */
  function sessionBand({ title, description, cells }) {
    return `<header class="session">
      <div class="session__title">
        <div class="session__h"><h1>${esc(title)}</h1>${conceptTag()}</div>
        <p class="session__desc">${esc(description)}</p>
      </div>
      <dl class="session__cells">${cells
        .map(
          (c) => `<div class="cell${c.cls ? ` ${c.cls}` : ""}"><dt>${esc(c.label)}</dt><dd>${c.value}</dd></div>`,
        )
        .join("")}</dl>
    </header>`;
  }

  /* ================================================================== DAILY */
  let daily = null; // live view state for the Daily section

  function statusCell(st, model) {
    const plate = (cls, glyph, word, tail) =>
      `<span class="status status--${cls}"><span class="status__line">${glyph}<span class="status__word">${esc(word)}</span></span>${tail ? `<span class="status__tail">${tail}</span>` : ""}</span>`;
    switch (st) {
      case "live":
        return plate("live", `<span class="lamp lamp--live" aria-hidden="true"></span>`, C.live, `<span>${esc(C.latestReading)} ${tHTML(model.last)}</span>`);
      case "delayed":
        return plate("delayed", `<span class="lamp lamp--delayed" aria-hidden="true"></span>`, C.delayed, `<span>${esc(C.lastKnown)} ${tHTML(model.last)}</span>`);
      case "closed":
        return plate("closed", `<span class="glyph glyph--closed" aria-hidden="true"></span>`, C.closedToday, "");
      case "empty":
        return plate("empty", `<span class="glyph glyph--empty" aria-hidden="true"></span>`, C.noReadingsYet, "");
      case "loading":
        return plate("loading", `<span class="glyph glyph--loading" aria-hidden="true"></span>`, C.loadingShort, "");
      default:
        return plate("error", `<span class="glyph glyph--error" aria-hidden="true">!</span>`, C.errorShort, "");
    }
  }

  function renderDaily(panel) {
    const st = dayState;
    const model = dayModel(st === "delayed" ? "delayed" : "live");
    const hours =
      st === "closed"
        ? esc(C.closedToday)
        : `${rangeHTML(tHTML(0), tHTML(DAY_LEN))} <span class="muted">(${esc(C.nextDay)})</span>`;
    panel.innerHTML = `
      ${sessionBand({
        title: C.title,
        description: C.description,
        cells: [
          { label: C.status, value: statusCell(st, model), cls: "cell--status" },
          { label: C.businessDay, value: dateHTML(2026, 9, 23, true) },
          { label: C.hours, value: hours },
          { label: C.gymTime, value: esc(C.gymTimeValue) },
          { label: C.capacity, value: n(CAPACITY) },
        ],
      })}
      ${
        st === "delayed"
          ? `<div class="notice" role="status"><span class="lamp lamp--delayed" aria-hidden="true"></span><p><strong>${esc(C.delayedNotice)}</strong> ${esc(C.delayedNotice2)}</p></div>`
          : ""
      }
      <div class="wall">
        <aside class="tower" aria-label="${esc(C.selectedReading)} · ${esc(C.dayFigures)}" id="tower"></aside>
        <div class="deck" id="deck"></div>
      </div>`;
    if (st === "loading") return renderDailyLoading();
    if (st === "error") return renderDailyError();
    if (st === "closed" || st === "empty") return renderDailyNoData(st, model);
    daily = { model, cursor: model.last, page: Math.floor(model.last / 60) };
    renderTower(model);
    renderDeck(model);
    setCursor(model.last, { source: "init" });
  }

  function renderDailyLoading() {
    $("#main").setAttribute("aria-busy", "true");
    $("#tower").innerHTML = `<div class="skel-block" aria-hidden="true">
        <i style="inline-size:40%"></i><i class="tall" style="inline-size:55%"></i><i style="inline-size:70%"></i>
        <hr><i style="inline-size:50%"></i><i class="mid" style="inline-size:35%"></i><i style="inline-size:60%"></i>
        <hr><i style="inline-size:50%"></i><i class="mid" style="inline-size:35%"></i></div>`;
    $("#deck").innerHTML = `<section class="scope-pane" aria-labelledby="loading-title">
        <div class="empty-state" role="status">
          <span class="glyph glyph--loading" aria-hidden="true"></span>
          <h2 id="loading-title">${esc(C.loading)}</h2><p>${esc(C.loadingDescription)}</p>
        </div>
        <div class="skel-strips" aria-hidden="true"><i class="p"></i><i class="e"></i><i class="s"></i></div>
      </section>`;
    announce(C.loading);
  }

  function renderDailyError() {
    $("#tower").innerHTML = "";
    $("#tower").hidden = true;
    $(".wall").classList.add("wall--single");
    $("#deck").innerHTML = `<section class="scope-pane" aria-labelledby="error-title">
        <div class="empty-state empty-state--error" role="alert">
          <span class="glyph glyph--error" aria-hidden="true">!</span>
          <h2 id="error-title">${esc(C.errorTitle)}</h2><p>${esc(C.errorDescription)}</p>
          <button class="btn btn--primary" type="button" id="retry">${esc(C.retry)}</button>
        </div>
      </section>`;
    $("#retry").addEventListener("click", () => {
      dayState = "live";
      history.replaceState(null, "", urlWith({ state: null }));
      renderShell();
      renderMain();
      $("#tab-daily").focus();
    });
  }

  function renderDailyNoData(st, model) {
    const closed = st === "closed";
    $("#tower").innerHTML = `<section class="tower__block">
        <h2 class="tower__h">${esc(C.dayFigures)} <span class="tower__q">${esc(closed ? C.closedToday : C.noReadingsYet)}</span></h2>
        <dl class="figs figs--void">
          ${[C.peak, C.average, C.crossings, C.coverage]
            .map((l) => `<div class="fig"><dt>${esc(l)}</dt><dd class="fig__void">${esc(C.noValue)}</dd></div>`)
            .join("")}
        </dl></section>`;
    $("#deck").innerHTML = `<section class="scope-pane" aria-labelledby="nodata-title">
        <div class="empty-state">
          <span class="glyph glyph--${closed ? "closed" : "empty"}" aria-hidden="true"></span>
          <h2 id="nodata-title">${esc(closed ? C.closedDayTitle : C.noObservedTitle)}</h2>
          <p>${esc(closed ? C.closedDayDescription : C.noObservedDescription)}</p>
        </div>
        <div class="void-strips ${closed ? "void-strips--closed" : ""}" aria-hidden="true">
          <i class="p"></i><i class="e"></i><i class="s"></i>
          <div class="void-axis">${HOURS.map((h) => `<span>${hourHTML(h)}</span>`).join("")}</div>
        </div>
      </section>`;
    void model;
  }

  /* ---- Tower (timing column): selected reading + day figures ---- */
  function renderTower(model) {
    const delayed = model.st === "delayed";
    const bandIdx = bandOf(model.peak);
    const qual = delayed ? C.dayFiguresDelayed(tHTML(model.last)) : C.dayFiguresLive(tHTML(model.last));
    $("#tower").innerHTML = `
      <section class="tower__block readout" aria-labelledby="ro-h">
        <div class="readout__head">
          <h2 class="tower__h" id="ro-h">${esc(C.selectedReading)}</h2>
          <span class="readout__state" id="ro-state"></span>
        </div>
        <p class="readout__time" id="ro-time"></p>
        <div class="readout__main" id="ro-main"></div>
        <dl class="readout__meta" id="ro-meta"></dl>
      </section>
      <section class="tower__block" aria-labelledby="fig-h">
        <h2 class="tower__h" id="fig-h">${esc(C.dayFigures)} <span class="tower__q">${qual}</span></h2>
        <dl class="figs">
          <div class="fig fig--crowd">
            <dt>${esc(C.peak)}</dt>
            <dd><span class="fig__subs"><span class="fig__band">${bandGlyph(bandIdx)}<span>${esc(C.bands[BANDS[bandIdx][0]])}</span></span>
              <span class="fig__sub">${esc(C.atTime)} ${tHTML(model.peakM)}</span></span>
              <span class="fig__num">${n(model.peak)}</span></dd>
          </div>
          <div class="fig fig--crowd">
            <dt>${esc(C.average)}</dt>
            <dd><span class="fig__subs"><span class="fig__sub">${esc(C.recordedMinutesPrefix)} ${n(fmtInt(model.rec))} ${esc(C.recordedMinutesSuffix)}</span></span>
              <span class="fig__num">${n(fmt1(model.avg))}</span></dd>
          </div>
          <div class="fig fig--entries">
            <dt>${esc(C.crossings)}</dt>
            <dd><span class="fig__subs"><span class="fig__sub">${esc(C.crossingsNote)}</span>
              <span class="fig__sub">${esc(C.busiestEntryHour)} ${hourHTML(HOURS[model.busiestHour])}</span></span>
              <span class="fig__num">${n(fmtInt(model.total))}</span></dd>
          </div>
          <div class="fig fig--coverage">
            <dt>${esc(C.coverage)}</dt>
            <dd><span class="fig__subs"><span class="fig__sub">${esc(C.observedPrefix)} ${n(fmtInt(model.rec))} ${esc(C.of)} ${n(fmtInt(model.scheduled))} ${esc(C.scheduledMinutes)}</span></span>
              <span class="fig__num">${n(pct(model.rec / model.scheduled))}</span></dd>
            <span class="covbar" aria-hidden="true"><i style="inline-size:${((model.rec / model.scheduled) * 100).toFixed(2)}%"></i></span>
          </div>
        </dl>
      </section>`;
  }

  function updateReadout(m) {
    const model = daily.model;
    const s = model.stateOf(m);
    const v = SIM.occ[m];
    const bin = model.bins[Math.floor(m / 10)];
    const stateWord = { recorded: C.observed, zero: C.stZero, missing: C.stMissing, waiting: C.stWaiting }[s];
    const isLast = m === model.last;
    const headWord = isLast ? (model.st === "delayed" ? C.lastKnown : C.latestReading) : C.selectedReading;
    $("#ro-h").textContent = headWord;
    $("#ro-state").innerHTML = `<span class="chip chip--${s}"><i aria-hidden="true"></i>${esc(stateWord)}</span>`;
    $("#ro-time").innerHTML = tHTML(m);
    if (s === "recorded" || s === "zero") {
      const bi = bandOf(v);
      $("#ro-main").innerHTML = `
        <div class="readout__row">
          <p class="readout__count"><span class="readout__pre">${esc(C.presentPrefix)}</span><bdi class="n readout__big" dir="ltr">${v}</bdi><span class="readout__suf">${esc(C.presentSuffix)}</span></p>
          <p class="readout__band">${bandGlyph(bi)}<span>${esc(C.bands[BANDS[bi][0]])}</span></p>
        </div>
        ${s === "zero" ? `<p class="readout__note">${esc(C.zeroExplain)}</p>` : ""}`;
    } else if (s === "missing") {
      $("#ro-main").innerHTML = `<p class="readout__void">—</p><p class="readout__note">${C.missingExplain(tHTML(MISS_A), tHTML(MISS_B))}</p>`;
    } else {
      $("#ro-main").innerHTML = `<p class="readout__void">—</p><p class="readout__note">${C.waitingExplain(tHTML(model.last))}</p>`;
    }
    const binA = bin.b * 10;
    const binLabel = `${esc(C.entries)} ${rangeHTML(tHTML(binA), tHTML(binA + 9))}`;
    const binVal =
      bin.obs === 0
        ? "—"
        : `${n(bin.sum)}${bin.complete ? "" : ` <span class="muted">· ${esc(C.binIncomplete)}</span>`}`;
    $("#ro-meta").innerHTML = `
      <div><dt>${binLabel}</dt><dd>${binVal}</dd></div>
      <div><dt>${esc(C.source)}</dt><dd>${s === "recorded" || s === "zero" ? esc(C.sourceLive) : "—"}</dd></div>`;
  }

  /* ---- Deck: synchronized strips + minute log ---- */
  const GEO = { PS: 6, PE: 92, HP: 282, HE: 72, HS: 16, T: 12 };

  function renderDeck(model) {
    $("#deck").innerHTML = `
      <section class="scope-pane" aria-labelledby="chart-title">
        <header class="scope-pane__head">
          <h2 id="chart-title">${esc(C.chartTitle)}</h2>
          <p class="scope-pane__meta">${rangeHTML(tHTML(0), tHTML(DAY_LEN))} <span class="muted">· ${esc(C.oneAxis)}</span></p>
        </header>
        <div class="scope" id="scope" tabindex="0" role="slider" aria-label="${esc(C.chartLabel)}"
             aria-describedby="chart-hint" aria-valuemin="0" aria-valuemax="${NOW_M}" aria-orientation="horizontal">
          <div class="strip strip--people" id="strip-people">
            <div class="strip__head"><span class="strip__tag strip__tag--crowd" aria-hidden="true"></span><span class="strip__name">${esc(C.peopleName)}</span><span class="strip__unit">${esc(C.peopleScale)}</span></div>
            <div class="strip__plot" id="plot-people"></div>
          </div>
          <div class="strip strip--entries" id="strip-entries">
            <div class="strip__head"><span class="strip__tag strip__tag--entries" aria-hidden="true"></span><span class="strip__name">${esc(C.entriesTitle)}</span><span class="strip__unit">${esc(C.entriesNote)}</span></div>
            <div class="strip__plot" id="plot-entries"></div>
          </div>
          <div class="strip strip--state" id="strip-state">
            <div class="strip__head"><span class="strip__tag strip__tag--coverage" aria-hidden="true"></span><span class="strip__name">${esc(C.coverageTitle)}</span><span class="strip__unit">${esc(C.coverageNote)}</span></div>
            <div class="strip__plot" id="plot-state"></div>
          </div>
          <div class="axis" id="axis" aria-hidden="true"></div>
        </div>
        <footer class="scope-pane__foot">
          <ul class="legend">
            <li><i class="sw sw--trace"></i>${esc(C.peopleName)}</li>
            <li><i class="sw sw--recorded"></i>${esc(C.stRecorded)}</li>
            <li><i class="sw sw--zero"></i>${esc(C.stZero)}</li>
            <li><i class="sw sw--missing"></i>${esc(C.stMissing)}</li>
            ${model.st === "delayed" ? `<li><i class="sw sw--waiting"></i>${esc(C.stWaiting)}</li>` : ""}
            <li><i class="sw sw--ahead"></i>${esc(C.stAhead)}</li>
          </ul>
          <p class="rule">${esc(C.binRule)}</p>
          <p class="rule rule--hint" id="chart-hint">${esc(C.chartHint)} <span class="keys-hint">${C.chartKeys}</span></p>
        </footer>
      </section>
      <section class="log" aria-labelledby="log-title">
        <header class="log__head">
          <h2 id="log-title">${esc(C.tableSummary)}</h2>
          <div class="pager" role="group" aria-label="${esc(C.minutePage)}">
            <button class="btn pager__btn" type="button" id="pg-prev"><span class="chev chev--back" aria-hidden="true"></span><span>${esc(C.previousPage)}</span></button>
            <p class="pager__status" id="pg-status" aria-live="polite"></p>
            <button class="btn pager__btn" type="button" id="pg-next"><span>${esc(C.nextPage)}</span><span class="chev chev--fwd" aria-hidden="true"></span></button>
          </div>
        </header>
        <div class="log__scroll" id="log-scroll" role="region" aria-labelledby="log-cap" tabindex="0">
          <table class="log__table">
            <caption id="log-cap" class="sr-only">${esc(C.tableRegion)}</caption>
            <thead><tr>
              <th scope="col">${esc(C.colTime)}</th><th scope="col">${esc(C.colState)}</th>
              <th scope="col" class="num">${esc(C.colCount)}</th><th scope="col">${esc(C.colBand)}</th>
              <th scope="col" class="num">${esc(C.colEntries)}</th><th scope="col">${esc(C.colSource)}</th>
            </tr></thead>
            <tbody id="log-body"></tbody>
          </table>
        </div>
      </section>`;
    drawStrips(model);
    wireScope(model);
    $("#pg-prev").addEventListener("click", () => setPage(daily.page - 1, true));
    $("#pg-next").addEventListener("click", () => setPage(daily.page + 1, true));
    const scopeEl = $("#scope");
    let lastW = scopeEl.clientWidth;
    const ro = new ResizeObserver(() => {
      if (!scopeEl.isConnected) return ro.disconnect();
      if (scopeEl.clientWidth === lastW) return;
      lastW = scopeEl.clientWidth;
      drawStrips(model);
      placeCursor(daily.cursor);
    });
    ro.observe(scopeEl);
  }

  // Geometry: logical offset u from the inline-start edge; x mirrors for RTL inside SVG.
  function geo(W) {
    const k = (W - GEO.PS - GEO.PE) / DAY_LEN;
    const u = (m) => GEO.PS + m * k;
    const x = (m) => (RTL ? W - u(m) : u(m));
    return { k, u, x };
  }
  const r2 = (v) => Math.round(v * 100) / 100;

  function patterns(id) {
    return `<defs>
      <pattern id="hatch-${id}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#0c0e10"/><line x1="0" y1="0" x2="0" y2="5" stroke="#4a5158" stroke-width="1.4"/></pattern>
      <pattern id="wait-${id}" width="6" height="4" patternUnits="userSpaceOnUse"><rect width="6" height="4" fill="#0c0e10"/><line x1="0" y1="2" x2="3" y2="2" stroke="#6d757d" stroke-width="1"/></pattern>
      <pattern id="ahead-${id}" width="8" height="8" patternUnits="userSpaceOnUse"><rect x="3.5" y="3.5" width="1" height="1" fill="#2a2f35"/></pattern>
    </defs>`;
  }

  function hourGrid(g, H, top) {
    let s = "";
    for (let h = 0; h <= 19; h++) {
      const X = Math.round(g.x(h * 60)) + 0.5;
      const major = h % 6 === 0 || h === 19;
      s += `<line x1="${X}" y1="${top}" x2="${X}" y2="${H}" class="${major ? "g-major" : "g-minor"}"/>`;
    }
    return s;
  }

  function spanRect(g, a, b, y0, y1, fill, cls = "") {
    const xa = g.x(a);
    const xb = g.x(b);
    const X = Math.min(xa, xb);
    return `<rect x="${r2(X)}" y="${y0}" width="${r2(Math.abs(xb - xa))}" height="${y1 - y0}" fill="${fill}" class="${cls}"/>`;
  }

  function drawStrips(model) {
    const scope = $("#scope");
    const W = Math.round(scope.clientWidth);
    const g = geo(W);
    const delayed = model.st === "delayed";
    const last = model.last;

    /* People present: crisp step trace, per-minute, no smoothing. */
    {
      const H = GEO.HP;
      const T = GEO.T;
      const B = H - 0.5;
      const y = (v) => r2(T + (1 - v / CAPACITY) * (B - T));
      let d = "";
      let pen = false;
      for (let m = 0; m <= last; m++) {
        if (!model.observed(m)) {
          pen = false;
          continue;
        }
        const Y = y(SIM.occ[m]);
        d += pen ? `V${Y}` : `M${r2(g.x(m))},${Y}`;
        d += `H${r2(g.x(m + 1))}`;
        pen = true;
      }
      const lines = [24, 48, 68]
        .map((v) => `<line x1="${r2(g.x(0))}" x2="${r2(g.x(DAY_LEN))}" y1="${Math.round(y(v)) + 0.5}" y2="${Math.round(y(v)) + 0.5}" class="g-band"/>`)
        .join("");
      const cap = `<line x1="${r2(g.x(0))}" x2="${r2(g.x(DAY_LEN))}" y1="${T + 0.5}" y2="${T + 0.5}" class="g-cap"/>`;
      const base = `<line x1="${r2(g.x(0))}" x2="${r2(g.x(DAY_LEN))}" y1="${B}" y2="${B}" class="g-base"/>`;
      const ahead = spanRect(g, NOW_M + 1, DAY_LEN, T, H, "url(#ahead-p)");
      const wait = delayed ? spanRect(g, last + 1, NOW_M + 1, T, H - 1, "url(#wait-p)", "s-wait") : "";
      const miss = spanRect(g, MISS_A, MISS_B + 1, T, H - 1, "url(#hatch-p)", "s-miss");
      const nowX = Math.round(g.x(NOW_M + 1)) + 0.5;
      const nowLine = `<line x1="${nowX}" x2="${nowX}" y1="${T}" y2="${H}" class="${delayed ? "now now--delayed" : "now"}"/>`;
      const lastX = r2(g.x(last + 0.5));
      const lastY = y(SIM.occ[last]);
      const lastMark = delayed
        ? `<rect x="${lastX - 4}" y="${lastY - 4}" width="8" height="8" class="mk-last mk-last--hollow"/>`
        : `<rect x="${lastX - 3.5}" y="${lastY - 3.5}" width="7" height="7" class="mk-last"/>`;
      $("#plot-people").innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">
        ${patterns("p")}${hourGrid(g, H, T)}${ahead}${wait}${miss}${lines}${cap}${base}
        <path d="${d}" class="trace"/>${nowLine}${lastMark}</svg>
        ${peopleLabels(g, y, model)}`;
    }

    /* Entries per 10-minute bin: stepped outline; incomplete bins dashed. */
    {
      const H = GEO.HE;
      const T = 6;
      const B = H - 0.5;
      const EMAX = 25;
      const y = (v) => r2(T + (1 - v / EMAX) * (B - T));
      // Contiguous runs of bins with the same completeness become one stair outline.
      const runs = [];
      let run = null;
      for (const bin of model.bins) {
        if (bin.elapsed === 0 || bin.obs === 0) {
          run = null;
          continue;
        }
        if (!run || run.complete !== bin.complete) {
          run = { complete: bin.complete, bins: [] };
          runs.push(run);
        }
        run.bins.push(bin);
      }
      let full = "";
      let part = "";
      for (const r of runs) {
        let d = `M${r2(g.x(r.bins[0].b * 10))},${B}`;
        for (const bin of r.bins) d += `V${y(bin.sum)}H${r2(g.x(bin.b * 10 + 10))}`;
        d += `V${B}Z`;
        if (r.complete) full += `<path d="${d}"/>`;
        else part += `<path d="${d}"/>`;
      }
      const grid = [10, 20]
        .map((v) => `<line x1="${r2(g.x(0))}" x2="${r2(g.x(DAY_LEN))}" y1="${Math.round(y(v)) + 0.5}" y2="${Math.round(y(v)) + 0.5}" class="g-band"/>`)
        .join("");
      const bh = model.busiestHour;
      $("#plot-entries").innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">
        ${patterns("e")}${hourGrid(g, H, T)}
        ${spanRect(g, NOW_M + 1, DAY_LEN, T, H, "url(#ahead-e)")}
        ${delayed ? spanRect(g, last + 1, NOW_M + 1, T, H - 1, "url(#wait-e)", "s-wait") : ""}
        ${spanRect(g, MISS_A, MISS_B + 1, T, H - 1, "url(#hatch-e)", "s-miss")}
        ${grid}<line x1="${r2(g.x(0))}" x2="${r2(g.x(DAY_LEN))}" y1="${B}" y2="${B}" class="g-base"/>
        <g class="bins">${full}</g><g class="bins bins--part">${part}</g></svg>
        <span class="gut gut--scale" style="inset-block-start:${y(20) - 7}px">${n(20)}</span>
        <span class="gut gut--scale" style="inset-block-start:${y(10) - 7}px">${n(10)}</span>
        <span class="busytag" style="inset-inline-start:${r2(g.u(bh * 60))}px;inline-size:${r2(g.k * 60)}px"><span>${esc(C.busiestEntryHour)} ${hourHTML(HOURS[bh])}</span></span>`;
    }

    /* Coverage / state track. */
    {
      const H = GEO.HS;
      let s = "";
      let runStart = 0;
      const st = (m) => model.stateOf(m);
      for (let m = 1; m <= DAY_LEN; m++) {
        if (m === DAY_LEN || st(m) !== st(runStart)) {
          const kind = st(runStart);
          const fill = { recorded: "#3b4148", zero: "#e6e9ec", missing: "url(#hatch-s)", waiting: "url(#wait-s)", ahead: "url(#ahead-s)" }[kind];
          s += spanRect(g, runStart, m, 0.5, H - 0.5, fill, `s-${kind}`);
          runStart = m;
        }
      }
      $("#plot-state").innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">
        ${patterns("s")}${s}</svg>
        <span class="gut gut--pct">${n(pct(model.rec / model.scheduled))}</span>`;
    }

    /* Shared time axis: hour ticks; labels sit just after their tick (logical positioning). */
    {
      let a = "";
      for (let h = 0; h <= 19; h++) {
        // Tick 19 is 1:00 AM: the close, which stays with the opening day.
        const cls = h === 19 ? " tick--major tick--end" : h % 6 === 0 ? " tick--major" : "";
        a += `<span class="tick${cls}" style="inset-inline-start:${r2(g.u(h * 60))}px">${hourHTML(h < 19 ? HOURS[h] : 1)}</span>`;
      }
      $("#axis").innerHTML = `${a}<span class="cursor__tag" id="cursor-tag"></span>`;
    }
    ensureCursorParts();
  }

  function ensureCursorParts() {
    ["people", "entries", "state"].forEach((k) => {
      const plot = $(`#plot-${k}`);
      if (!$(".cursor-line", plot)) {
        const line = document.createElement("span");
        line.className = "cursor-line";
        line.setAttribute("aria-hidden", "true");
        plot.appendChild(line);
      }
    });
  }

  function peopleLabels(g, y, model) {
    const delayed = model.st === "delayed";
    const aheadMid = g.u((NOW_M + 1 + DAY_LEN) / 2);
    const gapMid = g.u((MISS_A + MISS_B + 1) / 2);
    const zones = [
      [C.bands.quiet, 12, 24],
      [C.bands.moderate, 36, 48],
      [C.bands.busy, 58, 68],
      [C.bands.packed, 74, 80],
    ];
    // Band scale: one segment per crowd band, darker toward black for quieter bands.
    const shade = [34, 55, 78, 100];
    const gutter = zones
      .map(
        ([name, mid, lim], i) =>
          `<span class="bandscale" aria-hidden="true" style="inset-block-start:${y(lim)}px;block-size:${r2(y(i ? zones[i - 1][2] : 0) - y(lim))}px;background:color-mix(in oklab, #e51935 ${shade[i]}%, #000)"></span>
           <span class="gut gut--zone" style="inset-block-start:${y(mid) - 8}px">${esc(name)}</span>
           <span class="gut gut--lim" style="inset-block-start:${y(lim) - 7}px">${n(lim === 80 ? "80" : `≤${lim}`)}</span>`,
      )
      .join("");
    const nowU = g.u(NOW_M + 1);
    return `${gutter}
      <span class="tag tag--ahead" style="inset-inline-start:${r2(aheadMid)}px;inset-block-start:${y(20)}px">
        <span class="tag__t">${esc(C.stAhead)}</span><span class="tag__s">${esc(C.until)} ${tHTML(DAY_LEN)}</span></span>
      <span class="tag tag--miss" style="inset-inline-start:${r2(gapMid)}px;inset-block-start:${y(76) - 2}px">
        <span class="tag__t">${esc(C.stMissing)} · ${n(MISS_B - MISS_A + 1)} ${esc(C.min)}</span></span>
      <span class="tag tag--zero" style="inset-inline-start:${r2(g.u(0))}px;inset-block-start:${y(46)}px">
        <span class="tag__t">${esc(C.stZero)}</span><span class="tag__s">${rangeHTML(tHTML(0), tHTML(9))}</span></span>
      <span class="leader leader--zero" style="inset-inline-start:${r2(g.u(5))}px;inset-block-start:${y(46) + 38}px;block-size:${r2(y(0) - y(46) - 40)}px"></span>
      <span class="nowtag${delayed ? " nowtag--delayed" : ""}" style="inset-inline-start:${r2(nowU)}px">
        <span class="nowtag__line"><span>${esc(C.now)} ${tHTML(NOW_M)}</span></span>
        ${
          delayed
            ? `<span class="nowtag__wait"><i class="sw sw--waiting" aria-hidden="true"></i><span>${esc(C.stWaiting)} · ${n(NOW_M - model.last)} ${esc(C.min)}</span></span>
               <span class="nowtag__wait nowtag__wait--sub"><span>${esc(C.lastKnown)} ${tHTML(model.last)}</span></span>`
            : ""
        }
      </span>`;
  }

  /* ---- Cursor: one scrubber across every strip ---- */
  function wireScope(model) {
    const scope = $("#scope");
    const toMinute = (clientX) => {
      const rect = scope.getBoundingClientRect();
      const u = RTL ? rect.right - clientX : clientX - rect.left;
      const g = geo(rect.width);
      return Math.floor((u - GEO.PS) / g.k);
    };
    scope.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") return;
      const m = toMinute(e.clientX);
      if (m < 0 || m > DAY_LEN) return;
      setCursor(m, { source: "hover" });
    });
    scope.addEventListener("pointerdown", (e) => {
      const m = toMinute(e.clientX);
      if (m < 0 || m > DAY_LEN) return;
      setCursor(m, { source: "tap" });
    });
    scope.addEventListener("keydown", (e) => {
      const fwd = RTL ? "ArrowLeft" : "ArrowRight";
      const back = RTL ? "ArrowRight" : "ArrowLeft";
      let m = daily.cursor;
      const step = e.shiftKey ? 10 : 1;
      if (e.key === fwd || e.key === "ArrowUp") m += step;
      else if (e.key === back || e.key === "ArrowDown") m -= step;
      else if (e.key === "PageUp") m += 60;
      else if (e.key === "PageDown") m -= 60;
      else if (e.key === "Home") m = 0;
      else if (e.key === "End") m = model.last;
      else return;
      e.preventDefault();
      setCursor(m, { source: "key" });
    });
  }

  function valueText(m) {
    const s = daily.model.stateOf(m);
    const sep = LANG === "ar" ? "، " : ", ";
    if (s === "recorded" || s === "zero") {
      const v = SIM.occ[m];
      return [tText(m), `${C.presentPrefix} ${v} ${C.presentSuffix}`, C.bands[BANDS[bandOf(v)][0]], s === "zero" ? C.stZero : null]
        .filter(Boolean)
        .join(sep);
    }
    return [tText(m), s === "missing" ? C.stMissing : C.stWaiting].join(sep);
  }

  function setCursor(m, { source }) {
    const model = daily.model;
    m = Math.max(0, Math.min(NOW_M, m));
    daily.cursor = m;
    const scope = $("#scope");
    scope.setAttribute("aria-valuenow", String(m));
    scope.setAttribute("aria-valuetext", valueText(m));
    placeCursor(m);
    updateReadout(m);
    const page = Math.floor(m / 60);
    if (page !== daily.page || source === "init") setPage(page, false);
    else markRow();
    if (source === "tap") announce(valueText(m));
    void model;
  }

  function placeCursor(m) {
    const scope = $("#scope");
    if (!scope) return;
    const W = scope.clientWidth;
    const g = geo(W);
    const model = daily.model;
    const u = g.u(m + 0.5);
    $$(".cursor-line", scope).forEach((line) => (line.style.insetInlineStart = `${r2(u)}px`));
    const tag = $("#cursor-tag");
    tag.innerHTML = tHTML(m);
    tag.style.insetInlineStart = `${r2(u)}px`;
    // Hour labels under the scrubber tag step aside rather than peeking out from behind it.
    const tr = tag.getBoundingClientRect();
    $$(".tick", $("#axis")).forEach((t) => {
      const r = t.getBoundingClientRect();
      t.classList.toggle("is-covered", r.right > tr.left - 3 && r.left < tr.right + 3);
    });
    // Marker on the people strip (only where a value exists).
    let mk = $("#cursor-mark");
    if (!mk) {
      mk = document.createElement("span");
      mk.id = "cursor-mark";
      mk.className = "cursor-mark";
      mk.setAttribute("aria-hidden", "true");
      $("#strip-people .strip__plot").appendChild(mk);
    }
    const s = model.stateOf(m);
    if (s === "recorded" || s === "zero") {
      const T = GEO.T;
      const B = GEO.HP - 0.5;
      const Y = T + (1 - SIM.occ[m] / CAPACITY) * (B - T);
      mk.hidden = false;
      mk.style.insetInlineStart = `${r2(u)}px`;
      mk.style.insetBlockStart = `${r2(Y)}px`;
    } else mk.hidden = true;
    // Bin outline on the entries strip.
    let bm = $("#cursor-bin");
    if (!bm) {
      bm = document.createElement("span");
      bm.id = "cursor-bin";
      bm.className = "cursor-bin";
      bm.setAttribute("aria-hidden", "true");
      $("#strip-entries .strip__plot").appendChild(bm);
    }
    const bin = model.bins[Math.floor(m / 10)];
    if (bin.obs > 0) {
      const H = GEO.HE;
      const T = 6;
      const B = H - 0.5;
      const Y = T + (1 - bin.sum / 25) * (B - T);
      bm.hidden = false;
      bm.style.insetInlineStart = `${r2(g.u(bin.b * 10))}px`;
      bm.style.inlineSize = `${r2(g.k * 10)}px`;
      bm.style.insetBlockStart = `${r2(Y - 1)}px`;
      bm.style.blockSize = `${r2(B - Y + 1)}px`;
    } else bm.hidden = true;
  }

  /* ---- Minute log: 60 minutes per page, follows the cursor ---- */
  function setPage(p, fromButton) {
    const model = daily.model;
    const maxPage = Math.floor(NOW_M / 60);
    daily.page = Math.max(0, Math.min(maxPage, p));
    const a = daily.page * 60;
    const b = Math.min(NOW_M, a + 59);
    const rows = [];
    for (let m = a; m <= b; m++) {
      const s = model.stateOf(m);
      const has = s === "recorded" || s === "zero";
      const v = SIM.occ[m];
      const word = { recorded: C.observed, zero: C.stZero, missing: C.stMissing, waiting: C.stWaiting }[s];
      rows.push(`<tr data-m="${m}" class="row--${s}">
        <th scope="row">${tHTML(m)}</th>
        <td><span class="chip chip--${s}"><i aria-hidden="true"></i>${esc(word)}</span></td>
        <td class="num">${has ? n(v) : "—"}</td>
        <td>${has ? esc(C.bands[BANDS[bandOf(v)][0]]) : "—"}</td>
        <td class="num">${has ? n(SIM.ent[m]) : "—"}</td>
        <td>${has ? esc(C.sourceLive) : "—"}</td></tr>`);
    }
    $("#log-body").innerHTML = rows.join("");
    $("#pg-status").innerHTML = `${esc(C.minuteRange)} ${rangeHTML(tHTML(a), tHTML(b))} <span class="muted">· ${n(b - a + 1)} ${esc(C.minuteTotal)} ${n(NOW_M + 1)} ${esc(C.minutesWord)}</span>`;
    $("#pg-prev").disabled = daily.page === 0;
    $("#pg-next").disabled = daily.page === maxPage;
    if (fromButton) $("#log-scroll").scrollTop = 0;
    markRow(!fromButton);
  }

  function markRow(scroll = true) {
    $$("#log-body tr.is-cursor").forEach((tr) => tr.classList.remove("is-cursor"));
    const tr = $(`#log-body tr[data-m="${daily.cursor}"]`);
    if (!tr) return;
    tr.classList.add("is-cursor");
    if (!scroll) return;
    const box = $("#log-scroll");
    const head = $("thead", box).offsetHeight;
    const top = tr.offsetTop - head - (box.clientHeight - head) / 2 + tr.offsetHeight / 2;
    box.scrollTop = Math.max(0, top);
  }

  /* ================================================================== REPORTS */
  let rep = null;

  function renderReports(panel) {
    const model = reportModel(DEFAULT_RANGE.start, DEFAULT_RANGE.end);
    rep = { model, sel: model.best.slice(), applied: { ...DEFAULT_RANGE } };
    panel.innerHTML = `
      <div id="rep-session"></div>
      <form class="range" id="range" novalidate aria-labelledby="range-legend">
        <div class="range__lead"><h2 class="range__legend" id="range-legend">${esc(C.rangeLegend)}</h2><span class="range__hint" id="range-hint">${esc(C.rangeHint)}</span></div>
        <div class="range__fields">
          <label class="field"><span class="field__label">${esc(C.startLabel)}</span>
            <input class="field__input" id="r-start" name="start" inputmode="numeric" autocomplete="off" dir="ltr" value="${DEFAULT_RANGE.start}" aria-describedby="range-hint r-problem" placeholder="2026-08-26"></label>
          <label class="field"><span class="field__label">${esc(C.endLabel)}</span>
            <input class="field__input" id="r-end" name="end" inputmode="numeric" autocomplete="off" dir="ltr" value="${DEFAULT_RANGE.end}" aria-describedby="range-hint r-problem" placeholder="2026-09-22"></label>
        </div>
        <div class="presets" role="group" aria-label="${esc(C.presetsLegend)}">
          <button type="button" class="btn btn--seg" data-days="7" aria-pressed="false">${esc(C.presetLast7)}</button>
          <button type="button" class="btn btn--seg" data-days="28" aria-pressed="true">${esc(C.presetLast28)}</button>
          <button type="button" class="btn btn--seg" data-days="31" aria-pressed="false">${esc(C.presetLast31)}</button>
        </div>
        <button type="submit" class="btn btn--primary">${esc(C.apply)}</button>
        <p class="range__status" id="r-status" role="status">${esc(C.rangeApplied)}</p>
        <p class="range__problem" id="r-problem" hidden></p>
      </form>
      <div class="wall wall--reports">
        <aside class="tower" id="rtower" aria-label="${esc(C.selectedTitle)}"></aside>
        <div class="deck">
          <section class="scope-pane" aria-labelledby="hm-title">
            <header class="scope-pane__head">
              <h2 id="hm-title">${esc(C.heatmapTitle)}</h2>
              <p class="scope-pane__hint" id="hm-hint">${esc(C.heatmapDescription)} · ${esc(C.heatmapHint)}</p>
            </header>
            <div id="matrix-wrap"></div>
          </section>
        </div>
      </div>
      <div class="lower">
        <section class="pane compare" aria-labelledby="cmp-title">${compareHTML()}</section>
        <section class="pane csv" aria-labelledby="csv-title">${csvHTML()}</section>
      </div>
      <p class="footnote">${esc(C.footnote)}</p>
      <details class="hdetail">
        <summary><span class="chev chev--fwd" aria-hidden="true"></span>${esc(C.hTableSummary)}</summary>
        <div class="hdetail__scroll" role="region" tabindex="0" aria-labelledby="hd-cap" id="hdetail"></div>
      </details>`;
    renderReportBody();
    wireRange();
    wireCsv();
  }

  function renderReportBody() {
    const m = rep.model;
    const s = m.start;
    const e = m.end;
    const sameYear = s.y === e.y;
    const full = (d) => (LANG === "en" ? `<span class="d">${dayMonth(d.y, d.mo, d.d)} ${n(d.y)}</span>` : dateHTML(d.y, d.mo, d.d, false));
    const windowHTML = rangeHTML(sameYear ? dayMonth(s.y, s.mo, s.d) : full(s), full(e));
    $("#rep-session").innerHTML = sessionBand({
      title: C.rTitle,
      description: C.rDescription,
      cells: [
        { label: C.windowLabel, value: windowHTML },
        { label: C.windowDays, value: n(m.days) },
        { label: C.timeZoneLabel, value: esc(C.gymTimeValue) },
      ],
    });
    renderMatrix();
    renderHourTable();
    selectCell(rep.sel[0], rep.sel[1], false);
  }

  function heat(v, vmax) {
    // Intensity varies darkness toward black (mixing with black in OKLab), never toward white.
    const t = Math.max(0, Math.min(1, v / vmax));
    const p = 30 + 70 * t;
    return `color-mix(in oklab, #e51935 ${p.toFixed(1)}%, #000)`;
  }

  function cellLabel(d, hi, c) {
    const day = WEEKDAYS[LANG][d];
    const hr = hourText(HOURS[hi]);
    const sep = LANG === "ar" ? "، " : ", ";
    if (c.state === "closed") return `${day}${sep}${hr}${sep}${C.stateClosed}`;
    if (c.state === "missing" || c.state === "none") return `${day}${sep}${hr}${sep}${C.stateMissing}`;
    const avg = c.state === "zero" ? "0" : fmt1(c.avg);
    return `${day}${sep}${hr}${sep}${C.selectedAverage} ${avg}${sep}${c.observed} ${C.of} ${c.expected}`;
  }

  function renderMatrix() {
    const m = rep.model;
    const head = `<div class="mx-row mx-row--head" role="row">
        <div class="mx-corner" role="columnheader"><span class="mx-axis">${esc(C.weekdayAxis)} / ${esc(C.hourAxis)}</span></div>
        ${HOURS.map((h, i) => `<div class="mx-col" role="columnheader" data-hi="${i}" style="grid-column:${i + 2}">${hourHTML(h)}</div>`).join("")}
      </div>`;
    const rows = m.cells
      .map((row, d) => {
        const cells = row
          .map((c, hi) => {
            const partial = c.state === "value" && c.observed / c.expected < 0.9;
            let inner = "";
            let style = `grid-column:${hi + 2}`;
            if (c.state === "value") {
              inner = n(Math.round(c.avg));
              style += `;background:${heat(c.avg, m.vmax)}`;
            } else if (c.state === "zero") inner = n(0);
            else if (c.state === "missing" || c.state === "none") inner = "—";
            return `<div class="mx-cell mx-cell--${c.state}${partial ? " mx-cell--partial" : ""}" role="gridcell" tabindex="-1"
              aria-selected="false" data-d="${d}" data-hi="${hi}" style="${style}" aria-label="${esc(cellLabel(d, hi, c))}">${inner}</div>`;
          })
          .join("");
        let closedSpan = "";
        const firstOpen = row.findIndex((c) => c.state !== "closed");
        if (firstOpen > 0) {
          closedSpan = `<div class="mx-span" aria-hidden="true" style="grid-column:2 / span ${firstOpen}"><span>${esc(C.closedUntil(hourText(HOURS[firstOpen])))}</span></div>`;
        }
        return `<div class="mx-row" role="row" data-d="${d}">
          <div class="mx-rowhead" role="rowheader" data-d="${d}">${esc(WEEKDAYS[LANG][d])}</div>${cells}${closedSpan}</div>`;
      })
      .join("");
    $("#matrix-wrap").innerHTML = `
      <div class="matrix" id="matrix" role="grid" aria-labelledby="hm-title" aria-describedby="hm-hint">${head}${rows}</div>
      <div class="mx-under" aria-hidden="true">
        <div class="mx-under__row mx-under__row--profile">
          <div class="mx-under__head"><span class="strip__tag strip__tag--crowd"></span><span id="pf-name"></span></div>
          <div class="mx-under__plot" id="profile"></div>
        </div>
        <div class="mx-under__row mx-under__row--cov">
          <div class="mx-under__head"><span class="strip__tag strip__tag--coverage"></span><span>${esc(C.profileCoverage)}</span></div>
          <div class="mx-under__plot" id="covtrack"></div>
        </div>
      </div>
      <p class="mx-note">${esc(C.cellValueNote)}</p>`;
    const grid = $("#matrix");
    grid.addEventListener("click", (e) => {
      const cell = e.target.closest(".mx-cell");
      if (!cell) return;
      selectCell(Number(cell.dataset.d), Number(cell.dataset.hi), true);
      announce(cell.getAttribute("aria-label"));
    });
    grid.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") return;
      const cell = e.target.closest(".mx-cell");
      if (!cell) return;
      const d = Number(cell.dataset.d);
      const hi = Number(cell.dataset.hi);
      if (d !== rep.sel[0] || hi !== rep.sel[1]) selectCell(d, hi, false);
    });
    grid.addEventListener("keydown", (e) => {
      let [d, hi] = rep.sel;
      const fwd = RTL ? "ArrowLeft" : "ArrowRight";
      const back = RTL ? "ArrowRight" : "ArrowLeft";
      if (e.key === fwd) hi = Math.min(18, hi + 1);
      else if (e.key === back) hi = Math.max(0, hi - 1);
      else if (e.key === "ArrowDown") d = Math.min(6, d + 1);
      else if (e.key === "ArrowUp") d = Math.max(0, d - 1);
      else if (e.key === "Home") hi = 0;
      else if (e.key === "End") hi = 18;
      else return;
      e.preventDefault();
      selectCell(d, hi, true);
    });
    const wrap = $("#matrix-wrap");
    const ro = new ResizeObserver(() => (wrap.isConnected ? drawUnder() : ro.disconnect()));
    ro.observe(wrap);
  }

  function selectCell(d, hi, focus) {
    rep.sel = [d, hi];
    $$(".mx-cell").forEach((c) => {
      const on = Number(c.dataset.d) === d && Number(c.dataset.hi) === hi;
      c.setAttribute("aria-selected", String(on));
      c.tabIndex = on ? 0 : -1;
    });
    $$(".mx-col").forEach((c) => c.classList.toggle("is-sel", Number(c.dataset.hi) === hi));
    $$(".mx-rowhead").forEach((c) => c.classList.toggle("is-sel", Number(c.dataset.d) === d));
    if (focus) $(`.mx-cell[data-d="${d}"][data-hi="${hi}"]`).focus();
    renderReportTower();
    drawUnder();
  }

  function drawUnder() {
    const plot = $("#profile");
    if (!plot) return;
    const m = rep.model;
    const [d, sel] = rep.sel;
    const row = m.cells[d];
    const W = Math.round(plot.clientWidth);
    const gap = 2;
    const cw = (W - 18 * gap) / 19;
    const colX = (i) => {
      const u = i * (cw + gap);
      return RTL ? W - u - cw : u;
    };
    $("#pf-name").textContent = `${C.profileTitle} · ${WEEKDAYS[LANG][d]}`;
    // Profile: one flat step per hour at its average; closed and no-data hours break the trace.
    const H = 78;
    const T = 6;
    const B = H - 0.5;
    const y = (v) => r2(T + (1 - v / CAPACITY) * (B - T));
    let dPath = "";
    let pen = false;
    let marks = "";
    row.forEach((c, i) => {
      const xa = colX(i);
      const x0 = RTL ? xa + cw + gap / 2 : xa - gap / 2;
      const x1 = RTL ? xa - gap / 2 : xa + cw + gap / 2;
      if (c.state === "value" || c.state === "zero") {
        const Y = y(c.state === "zero" ? 0 : c.avg);
        dPath += pen ? `V${Y}` : `M${r2(i === 0 ? (RTL ? W : 0) : x0)},${Y}`;
        dPath += `H${r2(i === 18 ? (RTL ? 0 : W) : x1)}`;
        pen = true;
      } else {
        pen = false;
        const fill = c.state === "closed" ? "url(#hatch-u)" : "none";
        marks += `<rect x="${r2(xa) + 0.5}" y="${T}" width="${r2(cw) - 1}" height="${r2(B - T)}" fill="${fill}" class="${c.state === "closed" ? "u-closed" : "u-missing"}"/>`;
      }
    });
    const selX = colX(sel);
    const lines = [24, 48, 68]
      .map((v) => `<line x1="0" x2="${W}" y1="${Math.round(y(v)) + 0.5}" y2="${Math.round(y(v)) + 0.5}" class="g-band"/>`)
      .join("");
    plot.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" focusable="false">
      <defs><pattern id="hatch-u" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#0c0e10"/><line x1="0" y1="0" x2="0" y2="5" stroke="#3a4046" stroke-width="1.4"/></pattern></defs>
      <rect x="${r2(selX)}" y="0" width="${r2(cw)}" height="${H}" class="u-sel"/>
      ${lines}<line x1="0" x2="${W}" y1="${B}" y2="${B}" class="g-base"/>${marks}
      <path d="${dPath}" class="trace"/></svg>`;
    // Coverage track: observed / scheduled minutes per hour of the selected weekday.
    const HC = 14;
    let cov = "";
    row.forEach((c, i) => {
      const xa = colX(i);
      if (c.state === "closed") {
        cov += `<rect x="${r2(xa)}" y="0.5" width="${r2(cw)}" height="${HC - 1}" fill="url(#hatch-c)" class="u-closed"/>`;
        return;
      }
      if (!c.expected) return;
      const f = c.observed / c.expected;
      cov += `<rect x="${r2(xa)}" y="0.5" width="${r2(cw)}" height="${HC - 1}" class="c-bg${f === 0 ? " c-bg--none" : ""}"/>`;
      if (f > 0) {
        const w = cw * f;
        cov += `<rect x="${r2(RTL ? xa + cw - w : xa)}" y="0.5" width="${r2(w)}" height="${HC - 1}" class="c-fill"/>`;
      }
    });
    $("#covtrack").innerHTML = `<svg width="${W}" height="${HC}" viewBox="0 0 ${W} ${HC}" focusable="false">
      <defs><pattern id="hatch-c" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#0c0e10"/><line x1="0" y1="0" x2="0" y2="5" stroke="#3a4046" stroke-width="1.4"/></pattern></defs>
      ${cov}<rect x="${r2(selX) + 0.5}" y="0.5" width="${r2(cw) - 1}" height="${HC - 1}" class="u-selc"/></svg>`;
  }

  function renderReportTower() {
    const m = rep.model;
    const [d, hi] = rep.sel;
    const c = m.cells[d][hi];
    const h = HOURS[hi];
    const hourRange = rangeHTML(tHTML(hi * 60), tHTML(hi * 60 + 59));
    let main = "";
    if (c.state === "closed") {
      main = `<p class="readout__void">—</p><p class="readout__note">${esc(C.selectedClosed)}</p>`;
    } else if (c.state === "missing" || c.state === "none") {
      main = `<p class="readout__void">—</p><p class="readout__note">${esc(C.selectedMissing)} ${esc(C.selectedNoValue)}</p>`;
    } else {
      main = `<p class="readout__label">${esc(C.selectedAverage)}</p>
        <p class="readout__count"><bdi class="n readout__big">${c.state === "zero" ? "0" : fmt1(c.avg)}</bdi></p>
        ${c.state === "zero" ? `<p class="readout__note">${esc(C.stateZero)}</p>` : ""}`;
    }
    const f = c.expected ? c.observed / c.expected : 0;
    const stateWord = { value: C.stateValue, zero: C.stateZero, closed: C.stateClosed, missing: C.stateMissing, none: C.stateMissing }[c.state];
    const chipKind = { value: "recorded", zero: "zero", closed: "closed", missing: "missing", none: "missing" }[c.state];
    $("#rtower").innerHTML = `
      <section class="tower__block readout" aria-labelledby="rro-h">
        <div class="readout__head"><h2 class="tower__h" id="rro-h">${esc(C.selectedTitle)}</h2>
          <span class="readout__state"><span class="chip chip--${chipKind}"><i aria-hidden="true"></i>${esc(stateWord)}</span></span></div>
        <p class="readout__time"><span class="readout__day">${esc(WEEKDAYS[LANG][d])}</span> ${hourRange}</p>
        <div class="readout__main">${main}</div>
        <dl class="readout__meta">
          <div><dt>${esc(C.selectedObserved)}</dt><dd>${c.state === "closed" ? "—" : `${n(c.observed)} ${esc(C.of)} ${n(c.expected)}`}</dd></div>
          ${c.state === "closed" ? "" : `<div class="readout__cov"><span class="covbar${f < 0.9 ? " covbar--low" : ""}" aria-hidden="true"><i style="inline-size:${(f * 100).toFixed(1)}%"></i></span><span class="muted">${n(pct(f))}</span></div>`}
          <div><dt>${esc(C.selectedExpected)}</dt><dd>${c.state === "closed" ? n(0) : n(c.expected)}</dd></div>
          <div><dt>${esc(C.selectedSamples)}</dt><dd>${n(c.samples)}</dd></div>
        </dl>
      </section>
      <section class="tower__block" aria-labelledby="lg-h">
        <h2 class="tower__h" id="lg-h">${esc(C.legendLabel)}</h2>
        <div class="ramp" aria-hidden="true">${[0.08, 0.3, 0.52, 0.74, 1].map((t) => `<i style="background:${heat(t * m.vmax, m.vmax)}"></i>`).join("")}</div>
        <p class="ramp__ends"><span>${esc(C.legendQuiet)}</span><span>${esc(C.legendBusy)} · ${n(Math.round(m.vmax))}</span></p>
        <ul class="klegend">
          <li><span class="kcell kcell--zero" aria-hidden="true">${n(0)}</span>${esc(C.legendZero)}</li>
          <li><span class="kcell kcell--closed" aria-hidden="true"></span>${esc(C.legendClosed)}</li>
          <li><span class="kcell kcell--missing" aria-hidden="true">—</span>${esc(C.legendMissing)}</li>
          <li><span class="kcell kcell--partial" aria-hidden="true"></span>${esc(C.legendPartial)}</li>
        </ul>
      </section>`;
    void h;
  }

  // A purely numeric day span stays one LTR island with a plain hyphen in Arabic,
  // so "13-19" can never render as "19-13".
  const weekSpan = (a, b) =>
    LANG === "ar" ? `${n(`${a}-${b}`)} ${MONTHS.ar[8]}` : `${n(`${a}–${b}`)} ${MONTHS.enShort[8]}`;

  function compareHTML() {
    const rows = [
      [C.comparisonAverage, "31.4", "29.0", 2.4, (v) => fmt1(v), ""],
      [C.comparisonCrossings, "2,316", "2,187", 129, (v) => fmtInt(v), ""],
      [C.comparisonCoverage, "98.6%", "97.9%", 0.7, (v) => fmt1(v), ` ${C.points}`],
    ];
    const change = (delta, f, unit) => {
      const dir = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
      const glyph = { up: "▲", down: "▼", flat: "＝" }[dir];
      const word = { up: C.comparisonUp, down: C.comparisonDown, flat: C.comparisonFlat }[dir];
      const sign = delta > 0 ? "+" : delta < 0 ? "−" : "";
      return `<span class="delta delta--${dir}"><span class="delta__g" aria-hidden="true">${glyph}</span><span>${esc(word)}</span>${dir === "flat" ? "" : ` ${n(`${sign}${f(Math.abs(delta))}`)}${esc(unit)}`}</span>`;
    };
    return `
      <header class="pane__head"><h2 id="cmp-title">${esc(C.comparisonTitle)}</h2><p class="pane__desc">${esc(C.comparisonDescription)}</p></header>
      <table class="cmp">
        <thead><tr>
          <th scope="col">${esc(C.comparisonMetric)}</th>
          <th scope="col" class="num">${esc(C.comparisonCurrent)}<span class="cmp__w">${weekSpan(13, 19)}</span></th>
          <th scope="col" class="num">${esc(C.comparisonPrior)}<span class="cmp__w">${weekSpan(6, 12)}</span></th>
          <th scope="col">${esc(C.comparisonChange)}</th>
        </tr></thead>
        <tbody>${rows
          .map(
            ([label, cur, prior, delta, f, unit]) => `<tr>
            <th scope="row">${esc(label)}</th>
            <td class="num cmp__cur">${n(cur)}</td>
            <td class="num cmp__prior">${n(prior)}</td>
            <td>${change(delta, f, unit)}</td></tr>`,
          )
          .join("")}</tbody>
      </table>`;
  }

  function csvHTML() {
    return `
      <header class="pane__head"><h2 id="csv-title">${esc(C.csvTitle)}</h2><p class="pane__desc">${esc(C.csvDescription)}</p></header>
      <form class="csv__form" id="csv" novalidate>
        <fieldset class="csv__fields">
          <legend class="sr-only">${esc(C.csvLegend)}</legend>
          <label class="field"><span class="field__label">${esc(C.startLabel)}</span>
            <input class="field__input" id="c-start" inputmode="numeric" autocomplete="off" dir="ltr" value="2026-09-01" aria-describedby="csv-hint c-problem"></label>
          <label class="field"><span class="field__label">${esc(C.endLabel)}</span>
            <input class="field__input" id="c-end" inputmode="numeric" autocomplete="off" dir="ltr" value="2026-09-22" aria-describedby="csv-hint c-problem"></label>
          <button class="btn btn--primary" type="submit">${esc(C.csvExport)}</button>
        </fieldset>
        <p class="csv__hint" id="csv-hint">${esc(C.csvLegend)} · ${esc(C.csvHint)}</p>
        <p class="range__problem" id="c-problem" hidden></p>
        <p class="csv__status" id="c-status" role="status"></p>
      </form>
      <p class="privacy"><svg class="privacy__g" width="14" height="16" viewBox="0 0 14 16" aria-hidden="true" focusable="false"><rect x="1.5" y="7" width="11" height="8" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M4 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.3"/></svg><span>${esc(C.csvPrivacyNote)}</span></p>`;
  }

  function validateRange(a, b, maxDays, tooLongMsg) {
    if (!a.trim() || !b.trim()) return C.problemIncomplete;
    const pa = parseISO(a);
    const pb = parseISO(b);
    if (!pa || !pb) return C.problemMalformed;
    if (pb.t < pa.t) return C.problemInverted;
    if ((pb.t - pa.t) / DAY_MS + 1 > maxDays) return tooLongMsg;
    return null;
  }

  function wireRange() {
    const form = $("#range");
    const status = $("#r-status");
    const problem = $("#r-problem");
    const start = $("#r-start");
    const end = $("#r-end");
    const setPending = () => {
      status.textContent = C.rangePending;
      status.classList.add("is-pending");
    };
    [start, end].forEach((el) =>
      el.addEventListener("input", () => {
        $$(".presets .btn", form).forEach((b) => b.setAttribute("aria-pressed", "false"));
        setPending();
      }),
    );
    $$(".presets .btn", form).forEach((btn) =>
      btn.addEventListener("click", () => {
        const days = Number(btn.dataset.days);
        const endT = parseISO("2026-09-22").t;
        start.value = isoOf(endT - (days - 1) * DAY_MS);
        end.value = "2026-09-22";
        $$(".presets .btn", form).forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
        setPending();
      }),
    );
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const err = validateRange(start.value, end.value, 31, C.problemTooLong);
      [start, end].forEach((el) => el.setAttribute("aria-invalid", String(Boolean(err))));
      if (err) {
        problem.hidden = false;
        problem.textContent = err;
        return;
      }
      problem.hidden = true;
      rep.model = reportModel(start.value.trim(), end.value.trim());
      rep.sel = rep.model.best.slice();
      status.textContent = C.rangeApplied;
      status.classList.remove("is-pending");
      renderReportBody();
    });
  }

  function wireCsv() {
    const form = $("#csv");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const a = $("#c-start");
      const b = $("#c-end");
      const err = validateRange(a.value, b.value, 366, C.problemCsvTooLong);
      [a, b].forEach((el) => el.setAttribute("aria-invalid", String(Boolean(err))));
      const problem = $("#c-problem");
      if (err) {
        problem.hidden = false;
        problem.textContent = err;
        $("#c-status").textContent = "";
        return;
      }
      problem.hidden = true;
      $("#c-status").textContent = C.csvConcept;
    });
  }

  function renderHourTable() {
    const m = rep.model;
    const rows = [];
    m.cells.forEach((row, d) =>
      row.forEach((c, hi) => {
        const word = { value: C.stateValue, zero: C.stateZero, closed: C.stateClosed, missing: C.stateMissing, none: C.stateMissing }[c.state];
        const kind = { value: "recorded", zero: "zero", closed: "closed", missing: "missing", none: "missing" }[c.state];
        const avg = c.state === "value" ? n(fmt1(c.avg)) : c.state === "zero" ? n("0.0") : "—";
        rows.push(`<tr${hi === 0 ? ' class="grp"' : ""}>
          <th scope="row">${esc(WEEKDAYS[LANG][d])}</th><td>${hourHTML(HOURS[hi])}</td>
          <td><span class="chip chip--${kind}"><i aria-hidden="true"></i>${esc(word)}</span></td>
          <td class="num">${avg}</td>
          <td class="num">${c.state === "closed" ? "—" : n(c.observed)}</td>
          <td class="num">${c.state === "closed" ? n(0) : n(c.expected)}</td>
          <td class="num">${n(c.samples)}</td></tr>`);
      }),
    );
    $("#hdetail").innerHTML = `<table class="log__table">
      <caption id="hd-cap" class="sr-only">${esc(C.hTableRegion)}</caption>
      <thead><tr><th scope="col">${esc(C.columnWeekday)}</th><th scope="col">${esc(C.columnHour)}</th><th scope="col">${esc(C.columnState)}</th>
      <th scope="col" class="num">${esc(C.columnAverage)}</th><th scope="col" class="num">${esc(C.columnObserved)}</th>
      <th scope="col" class="num">${esc(C.columnExpected)}</th><th scope="col" class="num">${esc(C.columnSamples)}</th></tr></thead>
      <tbody>${rows.join("")}</tbody></table>`;
  }

  /* ================================================================== PLACEHOLDERS */
  function renderPlaceholder(panel, key) {
    const [title, desc] = C.placeholders[key];
    panel.innerHTML = `
      ${sessionBand({ title, description: desc, cells: [] })}
      <div class="wall wall--single">
        <section class="scope-pane nosignal" aria-labelledby="ns-title">
          <div class="empty-state">
            <span class="glyph glyph--empty" aria-hidden="true"></span>
            <h2 id="ns-title">${esc(C.notDesigned)}</h2>
            <p>${esc(C.notDesignedBody)}</p>
          </div>
          <div class="nosignal__strips" aria-hidden="true">
            ${[1, 2, 3].map(() => `<div class="nosignal__strip"><span>${esc(C.placeholderChannels)}</span></div>`).join("")}
          </div>
        </section>
      </div>`;
  }

  /* ------------------------------------------------------------------ Boot */
  renderShell();
  renderMain();
  window.__pitwall = { ready: true, lang: LANG, section: () => section, state: dayState };
})();
