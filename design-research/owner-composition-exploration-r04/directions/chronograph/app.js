/* FITWAY Owner — "Chronograph" exploration concept. Synthetic data only. */
(function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* Parameters                                                          */
  /* ------------------------------------------------------------------ */
  var params = new URLSearchParams(location.search);
  var LANG = params.get("lang") === "en" ? "en" : "ar";
  var RTL = LANG === "ar";
  var SECTIONS = ["daily", "history", "access", "audit", "health", "settings"];
  var SECTION = SECTIONS.indexOf(params.get("section")) >= 0 ? params.get("section") : "daily";
  var STATES = ["live", "delayed", "closed", "empty", "loading", "error"];
  var STATE = STATES.indexOf(params.get("state")) >= 0 ? params.get("state") : "live";
  var REDUCED =
    params.get("motion") === "off" ||
    (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  /* ------------------------------------------------------------------ */
  /* Copy (production wording where it exists; authored lines marked)    */
  /* ------------------------------------------------------------------ */
  var M = {
    en: {
      brand: "FITWAY",
      monitoring: "Monitoring",
      management: "Management",
      appArea: "App area",
      langLabel: "Switch to Arabic",
      langText: "العربية",
      logout: "Sign out",
      skip: "Skip to operational status",
      concept: "Exploration concept · synthetic data",
      sectionsGroup: "Management sections",
      sections: { daily: "Daily", history: "Reports", access: "Access", audit: "Activity Log", health: "Operations", settings: "Settings" },
      monitoringNotice: "Monitoring is not part of this concept.",
      logoutNotice: "Sign out is inactive in this concept.",

      title: "Daily analytics",
      description: "Your gym day, with times shown in the gym’s timezone",
      businessDay: "Business day",
      openingHours: "Opening hours",
      nextDay: "next day",
      gymTimeNow: "Gym time now",
      timeZone: "Current gym timezone",
      tzValue: "Riyadh · UTC+3",
      weekday: "Wednesday",
      dayLong: "Wednesday 23 September 2026",
      statusLive: "Live",
      statusDelayed: "Delayed",
      statusClosed: "Closed today",
      statusEmpty: "No readings yet",
      statusLoading: "Loading",
      statusError: "Not loaded",
      latestReading: "Latest reading",
      lastReading: "Last reading",
      delayedNote: "Live updates are delayed. These values are last known.",
      lastKnown: "Last known",
      asOf: "as of",
      peak: "Peak level",
      average: "Average occupancy",
      crossings: "Total entries",
      crossingsNote: "Estimated entrance crossings, not unique members",
      busiestEntryHour: "Most entries around",
      coverage: "Data coverage",
      coverageNote: "Recorded open minutes / scheduled open minutes",
      observedPrefix: "Observed",
      of: "of",
      scheduledMinutes: "scheduled minutes",
      recordedMinutesPrefix: "Across",
      recordedMinutesSuffix: "recorded minutes",
      atTime: "at",
      capacity: "Capacity",
      capacityNote: "Owner-only figure · the dial’s outer ring",
      noValue: "Not available",
      chartTitle: "People present through the day",
      chartLabel: "Interactive occupancy dial",
      chartHint:
        "Focus the dial, then use Left or Right Arrow (or Up and Down) to step through minutes. Page Up and Page Down move an hour; Home and End jump to opening and to the latest reading. Hover or tap also selects a point.",
      readDial: "Reading the dial",
      clockwise: "Time runs clockwise from opening",
      clockwiseShort: "Clockwise from",
      noMirror: "A clock face does not mirror: this dial reads clockwise in both languages.",
      binRule: "One point per minute. The line joins neighbouring minutes directly, with no smoothing.",
      legendObserved: "Observed value",
      legendZero: "Genuine zero",
      legendMissing: "Missing observation",
      legendClosed: "Scheduled closed",
      legendAhead: "Still ahead",
      legendWaiting: "Waiting for readings",
      legendNow: "Now",
      legendNowDelayed: "Now, no live reading",
      legendSelected: "Selected reading",
      legendAverage: "Average ring",
      legendPeak: "Peak marker",
      latest: "Latest",
      selectedReading: "Selected reading",
      presentPrefix: "≈",
      presentSuffix: "present",
      observed: "Observed",
      missing: "Missing observation",
      closed: "Scheduled closed",
      zeroTag: "genuine zero",
      waiting: "Waiting for readings",
      ahead: "Still ahead",
      aheadNote: "No reading yet. This time has not come.",
      waitingNote: "Readings for this minute have not arrived.",
      missingNote: "Nothing was recorded in this minute.",
      until: "until",
      since: "since",
      min: "min",
      avgShort: "Avg",
      peakShort: "Peak",
      quiet: "Quiet", moderate: "Moderate", busy: "Busy", packed: "Packed",
      live: "Live",
      tableSummary: "Minute details",
      tableIntro: "Every recorded minute, 60 at a time, in gym-local time.",
      minutePage: "Minute page",
      showing: "Showing",
      previousPage: "Previous 60 minutes",
      nextPage: "Next 60 minutes",
      jumpHour: "Jump to an hour",
      tableRegion: "Minute-by-minute analytics data",
      time: "Gym-local time",
      count: "Approximate occupancy",
      band: "Crowd band",
      state: "State",
      source: "Source",
      loading: "Loading today's readings",
      loadingDescription: "Loading the daily analytics summary and chart.",
      errorTitle: "Today's readings didn't load",
      errorDescription: "We couldn’t load today’s readings. Please try again.",
      retry: "Try again",
      noObservedTitle: "No readings yet today",
      noObservedDescription: "Today’s chart will appear when readings are available.",
      closedDayTitle: "FITWAY is closed today",
      closedDayDescription:
        "FITWAY is closed today on the published schedule, so no readings are expected. Daily analytics resumes with the first reading after the gym reopens.",
      notDesigned: "Not designed in this early look",
      notDesignedBody:
        "This section keeps its production content. Its Chronograph treatment is not drawn yet, so nothing here stands for the final page.",
      placeholders: {
        access: ["Access", "Staff PIN and owner accounts"],
        audit: ["Activity Log", "Owner and staff actions"],
        health: ["Operations & incidents", "Counter uptime and incidents over the last business days"],
        settings: ["Settings", "Set capacity, crowd levels, business day, and weekly hours. Changes apply from now on and never rewrite past reports."]
      },

      /* Reports */
      rTitle: "Busiest times and direction",
      rDescription: "How the week actually fills, by weekday and gym-local hour",
      windowLabel: "Window",
      windowValue: ["26 Aug", "22 Sep 2026"],
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
      rangeConcept: "Synthetic data stays the same in this concept.",
      problemIncomplete: "Choose both a first and a last business day.",
      problemInverted: "The last day comes before the first day.",
      problemTooLong: "This window is longer than 31 business days.",
      heatmapTitle: "Occupancy by weekday and hour",
      heatmapDescription: "How busy the gym usually is at each hour of the working day",
      heatmapRegion: "Weekday by hour heatmap",
      heatmapHint: "Select a cell to read its figures. Left and Right Arrow move by hour; Up and Down move by weekday.",
      ringOrder: "Outer ring Sunday, inner ring Saturday. Each cell spans one gym-local hour, between two numerals.",
      cellRule: "Each cell is the average number present over that weekday-hour’s observed minutes across the window. Cells round to a whole person; the selected-hour readout gives one decimal.",
      legendLabel: "Cell meaning",
      legendQuiet: "Quieter",
      legendBusy: "Busier",
      legendZeroCell: "Open and empty",
      legendClosedCell: "Closed",
      legendMissingCell: "No data",
      selectedTitle: "Selected hour",
      selectedAverage: "Average occupancy",
      selectedObserved: "Observed open minutes",
      selectedExpected: "Scheduled open minutes",
      selectedSamples: "Weekdays measured",
      selectedClosed: "The gym was not open in this hour.",
      selectedMissing: "No history was recorded for this hour.",
      selectedNoValue: "No average — nothing was observed in this hour.",
      hourSuffix: "hour",
      tableSummaryR: "Hourly detail",
      tableRegionR: "Weekday by hour figures",
      columnWeekday: "Weekday",
      columnHour: "Hour",
      columnState: "State",
      columnAverage: "Average occupancy",
      columnObserved: "Observed open minutes",
      columnExpected: "Scheduled open minutes",
      columnSamples: "Weekdays measured",
      stateValue: "Observed",
      stateZero: "Open and empty",
      stateClosed: "Closed",
      stateMissing: "No data",
      chooseWeekday: "Weekday shown in the table",
      comparisonTitle: "Weekly comparison",
      comparisonDescription: "Last 2 complete weeks",
      comparisonMetric: "Metric",
      comparisonCurrent: "Latest week",
      comparisonPrior: "Week before",
      comparisonChange: "Change",
      comparisonAverage: "Average occupancy",
      comparisonCrossings: "Total entries",
      comparisonCoverage: "Data coverage",
      comparisonUp: "up",
      comparisonDown: "down",
      comparisonFlat: "unchanged",
      weekLatest: "13–19 Sep",
      weekPrior: "6–12 Sep",
      points: "pts",
      csvTitle: "CSV export range",
      csvDescription: "Download minute-by-minute occupancy history for your selected dates.",
      csvLegend: "Export window",
      csvHint: "Up to 366 days",
      csvExport: "Export CSV",
      csvConcept: "Concept only: no file is produced in this early look.",
      csvPrivacyNote: "The file carries occupancy history only: no device, no account, and nothing about an individual visitor.",
      footnote:
        "An average is taken over the minutes that were actually observed, so an outage lowers the data coverage rather than quietly lowering the average. Closed hours are excluded from every average instead of being counted as empty. Changing a setting today never rewrites what last month looked like.",
      weekdays: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      weekdaysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      closedUntil: "Closed until 2 PM"
    },
    ar: {
      brand: "FITWAY",
      monitoring: "المراقبة",
      management: "الإدارة",
      appArea: "قسم التطبيق",
      langLabel: "التبديل إلى اللغة الإنجليزية",
      langText: "English",
      logout: "تسجيل الخروج",
      skip: "الانتقال إلى الحالة التشغيلية",
      concept: "مفهوم استكشافي · بيانات تجريبية",
      sectionsGroup: "أقسام الإدارة",
      sections: { daily: "اليومي", history: "التقارير", access: "الوصول", audit: "سجل النشاط", health: "التشغيل", settings: "الإعدادات" },
      monitoringNotice: "المراقبة ليست ضمن هذا المفهوم.",
      logoutNotice: "تسجيل الخروج غير مفعّل في هذا المفهوم.",

      title: "التحليلات اليومية",
      description: "يوم صالتك، مع عرض الأوقات بتوقيت الصالة",
      businessDay: "يوم العمل",
      openingHours: "ساعات العمل",
      nextDay: "اليوم التالي",
      gymTimeNow: "الوقت الآن في الصالة",
      timeZone: "المنطقة الزمنية الحالية للصالة",
      tzValue: "الرياض · UTC+3",
      weekday: "الأربعاء",
      dayLong: "الأربعاء 23 سبتمبر 2026",
      statusLive: "مباشر",
      statusDelayed: "متأخر",
      statusClosed: "مغلق اليوم",
      statusEmpty: "لا توجد قراءات بعد",
      statusLoading: "جارٍ التحميل",
      statusError: "تعذّر التحميل",
      latestReading: "آخر قراءة",
      lastReading: "آخر قراءة وصلت",
      delayedNote: "التحديثات المباشرة متأخرة. هذه آخر قيم معروفة.",
      lastKnown: "آخر قيمة معروفة",
      asOf: "حتى",
      peak: "مستوى الذروة",
      average: "متوسط الازدحام",
      crossings: "إجمالي الدخول",
      crossingsNote: "تقدير لمرات العبور من المدخل، لا لعدد الأعضاء",
      busiestEntryHour: "ذروة الدخول عند",
      coverage: "تغطية البيانات",
      coverageNote: "دقائق العمل المسجّلة / دقائق العمل المجدولة",
      observedPrefix: "رُصدت",
      of: "من",
      scheduledMinutes: "دقيقة مجدولة",
      recordedMinutesPrefix: "خلال",
      recordedMinutesSuffix: "دقيقة مسجّلة",
      atTime: "عند",
      capacity: "السعة",
      capacityNote: "رقم خاص بالمالك · الحلقة الخارجية للقرص",
      noValue: "غير متاح",
      chartTitle: "عدد الموجودين خلال اليوم",
      chartLabel: "قرص إشغال تفاعلي",
      chartHint:
        "ركّز على القرص واستخدم سهم اليمين أو اليسار (أو الأعلى والأسفل) للتنقل بين الدقائق. ينقلك Page Up وPage Down ساعة كاملة، وHome وEnd إلى الافتتاح وآخر قراءة. ويمكنك أيضاً التحديد بالتمرير أو اللمس.",
      readDial: "قراءة القرص",
      clockwise: "يسير الوقت مع عقارب الساعة من الافتتاح",
      clockwiseShort: "مع عقارب الساعة من",
      noMirror: "وجه الساعة لا ينعكس: يُقرأ هذا القرص مع عقارب الساعة في اللغتين.",
      binRule: "نقطة لكل دقيقة، والخط يصل الدقائق المتجاورة مباشرة بلا تنعيم.",
      legendObserved: "قيمة مرصودة",
      legendZero: "صفر فعلي",
      legendMissing: "رصد مفقود",
      legendClosed: "إغلاق مجدول",
      legendAhead: "لم يحن بعد",
      legendWaiting: "بانتظار القراءات",
      legendNow: "الآن",
      legendNowDelayed: "الآن، بلا قراءة مباشرة",
      legendSelected: "القراءة المحددة",
      legendAverage: "حلقة المتوسط",
      legendPeak: "علامة الذروة",
      latest: "آخر قراءة",
      selectedReading: "القراءة المحددة",
      presentPrefix: "نحو",
      presentSuffix: "حاضرًا",
      observed: "مرصود",
      missing: "رصد مفقود",
      closed: "إغلاق مجدول",
      zeroTag: "صفر فعلي",
      waiting: "بانتظار القراءات",
      ahead: "لم يحن بعد",
      aheadNote: "لا قراءة بعد، فهذا الوقت لم يأتِ.",
      waitingNote: "لم تصل قراءات هذه الدقيقة بعد.",
      missingNote: "لم يُسجَّل شيء في هذه الدقيقة.",
      until: "حتى",
      since: "منذ",
      min: "دقيقة",
      avgShort: "المتوسط",
      peakShort: "الذروة",
      quiet: "هادئ", moderate: "متوسط", busy: "مزدحم", packed: "شديد الازدحام",
      live: "مباشر",
      tableSummary: "تفاصيل الدقائق",
      tableIntro: "كل دقيقة مسجّلة، ستون دقيقة في كل صفحة، بتوقيت الصالة.",
      minutePage: "صفحة الدقائق",
      showing: "المعروض",
      previousPage: "الدقائق الستون السابقة",
      nextPage: "الدقائق الستون التالية",
      jumpHour: "الانتقال إلى ساعة",
      tableRegion: "بيانات التحليلات لكل دقيقة",
      time: "الوقت المحلي للصالة",
      count: "الإشغال التقريبي",
      band: "مستوى الازدحام",
      state: "الحالة",
      source: "المصدر",
      loading: "جارٍ تحميل قراءات اليوم",
      loadingDescription: "جارٍ تحميل ملخص التحليلات اليومية ومخططها.",
      errorTitle: "تعذر تحميل قراءات اليوم",
      errorDescription: "تعذر تحميل قراءات اليوم. يرجى إعادة المحاولة.",
      retry: "إعادة المحاولة",
      noObservedTitle: "لا توجد قراءات اليوم بعد",
      noObservedDescription: "سيظهر مخطط اليوم عند توفر القراءات.",
      closedDayTitle: "الصالة مغلقة اليوم",
      closedDayDescription:
        "الصالة مغلقة اليوم حسب الجدول المعلن، لذلك لا توجد قراءات متوقعة. تعود التحليلات اليومية مع أول قراءة بعد إعادة الفتح.",
      notDesigned: "غير مصمم في هذه النظرة المبكرة",
      notDesignedBody:
        "يحتفظ هذا القسم بمحتواه الحالي في المنتج. لم يُرسم بعد بأسلوب كرونوغراف، فلا شيء هنا يمثل الصفحة النهائية.",
      placeholders: {
        access: ["الوصول", "رمز الموظفين وحسابات المالكين"],
        audit: ["سجل النشاط", "إجراءات المالك والموظفين"],
        health: ["التشغيل والأعطال", "تشغيل جهاز العد والأعطال خلال أيام العمل الأخيرة"],
        settings: ["الإعدادات", "اضبط السعة ومستويات الازدحام ويوم العمل وساعات الأسبوع. تنطبق التغييرات من الآن ولا تعيد كتابة التقارير السابقة."]
      },

      rTitle: "أوقات الذروة والاتجاه",
      rDescription: "كيف يمتلئ الأسبوع فعلياً، بحسب اليوم والساعة بتوقيت الصالة",
      windowLabel: "الفترة",
      windowValue: ["26 أغسطس", "22 سبتمبر 2026"],
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
      rangeConcept: "تبقى البيانات التجريبية كما هي في هذا المفهوم.",
      problemIncomplete: "اختر أول يوم عمل وآخر يوم عمل معاً.",
      problemInverted: "آخر يوم يسبق أول يوم.",
      problemTooLong: "هذه الفترة أطول من 31 يوم عمل.",
      heatmapTitle: "الإشغال حسب اليوم والساعة",
      heatmapDescription: "الزحمة المعتادة في كل ساعة من أيام العمل",
      heatmapRegion: "خريطة اليوم مقابل الساعة",
      heatmapHint: "اختر خانة لقراءة أرقامها. ينقلك سهما اليمين واليسار بين الساعات، والأعلى والأسفل بين الأيام.",
      ringOrder: "الحلقة الخارجية للأحد والداخلية للسبت. كل خانة ساعة واحدة بتوقيت الصالة، بين رقمين.",
      cellRule: "كل خانة هي متوسط عدد الموجودين خلال الدقائق المرصودة لتلك الساعة من ذلك اليوم عبر الفترة. تُقرَّب الخانة إلى أقرب شخص، وتعرض قراءة الساعة المختارة منزلة عشرية واحدة.",
      legendLabel: "دلالة الخانة",
      legendQuiet: "أهدأ",
      legendBusy: "أزحم",
      legendZeroCell: "مفتوحة وفارغة",
      legendClosedCell: "مغلقة",
      legendMissingCell: "لا توجد بيانات",
      selectedTitle: "الساعة المختارة",
      selectedAverage: "متوسط الازدحام",
      selectedObserved: "دقائق العمل التي توفرت فيها قراءات",
      selectedExpected: "دقائق العمل المجدولة",
      selectedSamples: "عدد الأيام التي توفرت فيها قراءات",
      selectedClosed: "لم تكن الصالة مفتوحة في هذه الساعة.",
      selectedMissing: "لم يُسجَّل أي تاريخ لهذه الساعة.",
      selectedNoValue: "لا يوجد متوسط — لم يُرصد شيء في هذه الساعة.",
      hourSuffix: "ساعة",
      tableSummaryR: "تفاصيل الساعات",
      tableRegionR: "أرقام اليوم مقابل الساعة",
      columnWeekday: "اليوم",
      columnHour: "الساعة",
      columnState: "الحالة",
      columnAverage: "متوسط الازدحام",
      columnObserved: "دقائق العمل التي توفرت فيها قراءات",
      columnExpected: "دقائق العمل المجدولة",
      columnSamples: "عدد الأيام التي توفرت فيها قراءات",
      stateValue: "مرصودة",
      stateZero: "مفتوحة وفارغة",
      stateClosed: "مغلقة",
      stateMissing: "لا توجد بيانات",
      chooseWeekday: "اليوم المعروض في الجدول",
      comparisonTitle: "المقارنة الأسبوعية",
      comparisonDescription: "آخر أسبوعين مكتملين",
      comparisonMetric: "المؤشر",
      comparisonCurrent: "الأسبوع الأخير",
      comparisonPrior: "الأسبوع السابق",
      comparisonChange: "التغيّر",
      comparisonAverage: "متوسط الازدحام",
      comparisonCrossings: "إجمالي الدخول",
      comparisonCoverage: "تغطية البيانات",
      comparisonUp: "ارتفاع",
      comparisonDown: "انخفاض",
      comparisonFlat: "بلا تغيّر",
      weekLatest: "13-19 سبتمبر",
      weekPrior: "6-12 سبتمبر",
      points: "نقطة",
      csvTitle: "نطاق تصدير CSV",
      csvDescription: "تنزيل سجل الإشغال لكل دقيقة خلال الفترة المحددة.",
      csvLegend: "فترة التصدير",
      csvHint: "366 يوماً كحد أقصى",
      csvExport: "تصدير CSV",
      csvConcept: "مفهوم فقط: لا يُنتج أي ملف في هذه النظرة المبكرة.",
      csvPrivacyNote: "يحمل الملف سجل الإشغال فقط: لا جهاز، ولا حساب، ولا أي شيء عن زائر بعينه.",
      footnote:
        "يُحسب المتوسط على الدقائق التي توفرت فيها قراءات فعلاً، فالانقطاع يخفض تغطية البيانات بدل أن يخفض المتوسط بصمت. وتُستبعد ساعات الإغلاق من كل متوسط بدل احتسابها فارغة. وتغيير أي إعداد اليوم لا يعيد كتابة صورة الشهر الماضي.",
      weekdays: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
      weekdaysShort: ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"],
      closedUntil: "مغلقة حتى 2 م"
    }
  };
  var t = M[LANG];

  /* ------------------------------------------------------------------ */
  /* Formatting — Western digits in both locales; no Intl for Arabic      */
  /* ------------------------------------------------------------------ */
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function bdi(s) { return "<bdi>" + esc(s) + "</bdi>"; }
  function period(pm) { return LANG === "ar" ? (pm ? "م" : "ص") : (pm ? "PM" : "AM"); }
  /* minute-of-day (may exceed 1440 for past-midnight) -> "7:42 PM" / "7:42 م" */
  function clock(mod) {
    var m = ((mod % 1440) + 1440) % 1440;
    var h = Math.floor(m / 60), mm = m % 60;
    var h12 = h % 12 || 12;
    return h12 + ":" + (mm < 10 ? "0" : "") + mm + " " + period(h >= 12);
  }
  function hourName(mod) {
    var m = ((mod % 1440) + 1440) % 1440;
    var h = Math.floor(m / 60);
    return (h % 12 || 12) + " " + period(h >= 12);
  }
  function dash() { return LANG === "ar" ? " - " : " – "; }
  function span(a, b) { return bdi(a) + dash() + bdi(b); }
  function num(n, dp) {
    var s = dp ? n.toFixed(dp) : String(Math.round(n));
    var parts = s.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }

  /* ------------------------------------------------------------------ */
  /* Synthetic day — seeded count process around the brief's target      */
  /* ------------------------------------------------------------------ */
  var OPEN = 360;            /* 6:00 AM */
  var CLOSE = 1500;          /* 1:00 AM next day, kept with the opening day */
  var NOW = 1182;            /* 7:42 PM */
  var DELAYED_LAST = 1161;   /* 7:21 PM */
  var CAP = 80;
  var BANDS = [24, 48, 68];  /* Quiet <= 24, Moderate <= 48, Busy <= 68, Packed above */
  var MISSING_FROM = 494, MISSING_TO = 511; /* 2:14 PM - 2:31 PM, minute index from open */
  var LAST_IDX = NOW - OPEN; /* 822 */

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var x = Math.imul(a ^ (a >>> 15), 1 | a);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }
  function poisson(r, l) {
    if (l <= 0) return 0;
    var L = Math.exp(-l), k = 0, p = 1;
    do { k++; p *= r(); } while (p > L);
    return k - 1;
  }
  function binom(r, n, p) { var k = 0; for (var i = 0; i < n; i++) if (r() < p) k++; return k; }
  function target(h) {
    if (h < 6 + 10 / 60) return 0;
    var ramp = Math.min(1, (h - (6 + 10 / 60)) / 0.4);
    var base = 6 * ramp;
    var morning = 25 * Math.exp(-Math.pow((h - 7.33) / 0.55, 2));
    var noon = 9 * Math.exp(-Math.pow((h - 13.0) / 0.5, 2));
    var s = h < 18.5 ? 1.2 : 2.3;
    var eve = 55 * Math.exp(-Math.pow((h - 18.5) / s, 2));
    return base + morning + noon + eve;
  }
  var DAY = (function () {
    var r = mulberry32(31), O = 0, pts = [];
    for (var i = 0; i <= LAST_IDX; i++) {
      var T = target(6 + i / 60), e = 0, x = 0;
      if (i >= 10) {
        var lam = Math.max(0, T / 64 + (T - O) * 0.10);
        e = poisson(r, lam);
        x = binom(r, O, 1 / 64);
      }
      O = Math.max(0, O + e - x);
      var miss = i >= MISSING_FROM && i <= MISSING_TO;
      pts.push({ i: i, mod: OPEN + i, v: miss ? null : O, entries: miss ? null : e, state: miss ? "missing" : "observed" });
    }
    return pts;
  })();

  function bandIndex(v) { return v <= BANDS[0] ? 0 : v <= BANDS[1] ? 1 : v <= BANDS[2] ? 2 : 3; }
  function bandName(v) { return [t.quiet, t.moderate, t.busy, t.packed][bandIndex(v)]; }

  function metrics(lastIdx) {
    var peak = -1, peakAt = 0, sum = 0, n = 0, E = 0, hourE = {};
    for (var i = 0; i <= lastIdx; i++) {
      var p = DAY[i];
      if (p.state !== "observed") continue;
      if (p.v > peak) { peak = p.v; peakAt = p.mod; }
      sum += p.v; n++; E += p.entries;
      var h = Math.floor(p.mod / 60);
      hourE[h] = (hourE[h] || 0) + p.entries;
    }
    var bh = null, bv = -1;
    Object.keys(hourE).forEach(function (h) { if (hourE[h] > bv) { bv = hourE[h]; bh = +h; } });
    return {
      peak: peak, peakAt: peakAt, avg: sum / n, recorded: n, scheduled: lastIdx + 1,
      entries: E, busiestHour: bh * 60, coverage: (100 * n) / (lastIdx + 1),
      latest: DAY[lastIdx]
    };
  }

  /* ------------------------------------------------------------------ */
  /* Synthetic reporting window — 26 Aug to 22 Sep 2026, 28 business days */
  /* ------------------------------------------------------------------ */
  var HOURS = 19; /* 6 AM hour through the 12 AM hour */
  var WEEK = (function () {
    var r = mulberry32(2026);
    var weekdayProfile = [14, 27, 20, 12, 9, 9, 11, 15, 12, 13, 20, 34, 47, 49, 41, 31, 21, 12, 5];
    var mult = [1.04, 1.08, 1.0, 0.98, 0.9];
    var friday = [null, null, null, null, null, null, null, null, 10, 14, 18, 24, 30, 36, 44, 47, 42, 30, 16];
    var saturday = [0, 8, 14, 18, 20, 19, 17, 16, 17, 20, 27, 35, 39, 36, 29, 21, 14, 8, 3];
    var grid = [];
    for (var w = 0; w < 7; w++) {
      var row = [];
      for (var k = 0; k < HOURS; k++) {
        var cell = { w: w, k: k, mod: OPEN + k * 60 };
        var base;
        if (w === 5) base = friday[k];
        else if (w === 6) base = saturday[k];
        else base = weekdayProfile[k] * mult[w];
        var noise = (r() - 0.5) * 3.2;
        var obs = 228 + Math.floor(r() * 13);
        if (base === null) {
          cell.state = "closed"; cell.avg = null; cell.observed = 0; cell.expected = 0; cell.samples = 0;
        } else if (w === 2 && k === 4) {
          cell.state = "missing"; cell.avg = null; cell.observed = 0; cell.expected = 240; cell.samples = 0;
        } else if (w === 6 && k === 0) {
          cell.state = "zero"; cell.avg = 0; cell.observed = 236; cell.expected = 240; cell.samples = 4;
        } else {
          cell.state = "value";
          cell.avg = Math.max(0.6, Math.round((base + noise) * 10) / 10);
          cell.observed = w === 3 && k === 8 ? 212 : obs;
          cell.expected = 240; cell.samples = 4;
        }
        row.push(cell);
      }
      grid.push(row);
    }
    return grid;
  })();
  var WEEK_MAX = 0, WEEK_BUSIEST = null;
  WEEK.forEach(function (row) { row.forEach(function (c) { if (c.state === "value" && c.avg > WEEK_MAX) { WEEK_MAX = c.avg; WEEK_BUSIEST = c; } }); });

  /* ------------------------------------------------------------------ */
  /* Dial geometry — a 24-hour face, noon at the top, time clockwise      */
  /* ------------------------------------------------------------------ */
  var C = 380;
  function ang(mod) { return (mod - 720) / 4; }            /* degrees clockwise from 12 o'clock (noon) */
  function pt(r, deg) {
    var a = (deg * Math.PI) / 180;
    return [C + r * Math.sin(a), C - r * Math.cos(a)];
  }
  function f(n) { return Math.round(n * 100) / 100; }
  function P(r, deg) { var p = pt(r, deg); return f(p[0]) + " " + f(p[1]); }
  function arc(r, d0, d1) {
    var large = d1 - d0 > 180 ? 1 : 0;
    return "M" + P(r, d0) + " A" + r + " " + r + " 0 " + large + " 1 " + P(r, d1);
  }
  function arcRev(r, d0, d1) { /* counter-clockwise from d1 back to d0 */
    var large = d1 - d0 > 180 ? 1 : 0;
    return "M" + P(r, d1) + " A" + r + " " + r + " 0 " + large + " 0 " + P(r, d0);
  }
  function sector(r0, r1, d0, d1) {
    var large = d1 - d0 > 180 ? 1 : 0;
    return "M" + P(r1, d0) + " A" + r1 + " " + r1 + " 0 " + large + " 1 " + P(r1, d1) +
      " L" + P(r0, d1) + " A" + r0 + " " + r0 + " 0 " + large + " 0 " + P(r0, d0) + " Z";
  }
  var R0 = 150, R1 = 280, HUB = 140;
  function rv(v) { return R0 + ((R1 - R0) * v) / CAP; }
  var A_OPEN = ang(OPEN);   /* -90 */
  var A_CLOSE = ang(CLOSE); /* 195 */

  var uid = 0;
  /* Estimated rendered width, used only to place and size text paths so labels never clip. */
  function estW(text, fs) { return String(text).length * fs * (LANG === "ar" ? 0.52 : 0.64); }
  /* A label that begins at startDeg and runs dir (+1 clockwise, -1 counter-clockwise) */
  function curvedFrom(text, r, startDeg, dir, cls, fs) {
    var half = ((estW(text, fs) / 2) / r) * (180 / Math.PI);
    return { svg: curved(text, r, startDeg + dir * half, cls, { span: half * 3 + 6 }), end: startDeg + dir * half * 2 };
  }
  function curved(text, r, mid, cls, opts) {
    opts = opts || {};
    var span = opts.span || 60;
    var lower = mid > 100 && mid < 260;
    var id = "tp" + (++uid);
    var d = lower ? arcRev(r, mid - span / 2, mid + span / 2) : arc(r, mid - span / 2, mid + span / 2);
    return '<path id="' + id + '" d="' + d + '" fill="none" stroke="none"/>' +
      '<text class="' + cls + '" dominant-baseline="central"><textPath href="#' + id + '" startOffset="50%" text-anchor="middle">' +
      esc(text) + "</textPath></text>";
  }

  /* ------------------------------------------------------------------ */
  /* Small authored icons                                                 */
  /* ------------------------------------------------------------------ */
  var ICON = {
    live: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="3.25" fill="currentColor"/></svg>',
    delayed: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 1.75h8M4 14.25h8M5 1.75c0 3.2 6 3.6 6 6.25S5 11.05 5 14.25M11 1.75c0 3.2-6 3.6-6 6.25s6 3.05 6 6.25" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    closed: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M3.6 12.4 12.4 3.6" stroke="currentColor" stroke-width="1.5"/></svg>',
    empty: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2.2 2.2"/></svg>',
    loading: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="5" cy="8" r="1" fill="currentColor"/><circle cx="8" cy="8" r="1" fill="currentColor"/><circle cx="11" cy="8" r="1" fill="currentColor"/></svg>',
    error: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.9 14.6 13.6H1.4Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M8 6v3.6" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="11.6" r=".9" fill="currentColor"/></svg>',
    up: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13.5V3M3.8 7.2 8 3l4.2 4.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    down: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5V13M3.8 8.8 8 13l4.2-4.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    flat: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 8h11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    shield: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.6 13.2 3.5v4.1c0 3.2-2.2 5.6-5.2 6.8-3-1.2-5.2-3.6-5.2-6.8V3.5Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="m5.6 8 1.7 1.7 3.2-3.4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    clockwise: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M13 8A5 5 0 1 1 8 3h2.2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="m8.8 1 2 2-2 2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    prev: '<svg class="ico flip-rtl" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    next: '<svg class="ico flip-rtl" viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  /* A four-segment band gauge: filled segments count the band, so it reads without color. */
  function bandGlyph(idx) {
    var s = '<svg class="band-glyph" viewBox="0 0 22 13" aria-hidden="true">';
    for (var i = 0; i < 4; i++) {
      var d0 = -90 + i * 45 + 4, d1 = -90 + (i + 1) * 45 - 4;
      var a0 = (d0 * Math.PI) / 180, a1 = (d1 * Math.PI) / 180, r = 8.5;
      var x0 = 11 + r * Math.sin(a0), y0 = 11.5 - r * Math.cos(a0), x1 = 11 + r * Math.sin(a1), y1 = 11.5 - r * Math.cos(a1);
      s += '<path d="M' + f(x0) + " " + f(y0) + " A" + r + " " + r + " 0 0 1 " + f(x1) + " " + f(y1) +
        '" class="' + (i <= idx ? "seg on" : "seg") + '"/>';
    }
    return s + "</svg>";
  }
  function statusBlock(kind, word) {
    return '<p class="status status-' + kind + '">' + ICON[kind] + "<span>" + esc(word) + "</span></p>";
  }

  /* ------------------------------------------------------------------ */
  /* Shell                                                               */
  /* ------------------------------------------------------------------ */
  function hrefWith(changes) {
    var q = new URLSearchParams(location.search);
    Object.keys(changes).forEach(function (k) {
      if (changes[k] === null) q.delete(k); else q.set(k, changes[k]);
    });
    return "?" + q.toString();
  }

  function shell(mainHTML) {
    var nav = SECTIONS.map(function (s) {
      var cur = s === SECTION;
      return '<li><a href="' + esc(hrefWith({ section: s === "daily" ? null : s, state: null })) + '"' +
        (cur ? ' aria-current="page"' : "") + ">" + esc(t.sections[s]) + "</a></li>";
    }).join("");
    return (
      '<a class="skip" href="#main">' + esc(t.skip) + "</a>" +
      '<header class="case">' +
      '<div class="caseband">' +
      '<a class="brand" href="' + esc(hrefWith({ section: null, state: null })) + '" aria-label="FITWAY"><span class="brand-index" aria-hidden="true"></span><span lang="en" dir="ltr">FITWAY</span></a>' +
      '<div class="appswitch" role="group" aria-label="' + esc(t.appArea) + '">' +
      '<a href="#" class="appswitch-opt" data-notice="monitoring">' + esc(t.monitoring) + "</a>" +
      '<a href="' + esc(hrefWith({})) + '" class="appswitch-opt" aria-current="page"><span class="lamp" aria-hidden="true"></span>' + esc(t.management) + "</a>" +
      "</div>" +
      '<p class="concept-plate">' + esc(t.concept) + "</p>" +
      '<div class="case-tools">' +
      '<a class="tool" href="' + esc(hrefWith({ lang: LANG === "ar" ? "en" : "ar" })) + '" aria-label="' + esc(t.langLabel) + '" lang="' + (LANG === "ar" ? "en" : "ar") + '">' + esc(t.langText) + "</a>" +
      '<button type="button" class="tool" data-notice="logout">' + esc(t.logout) + "</button>" +
      "</div>" +
      "</div>" +
      '<nav class="bezel" aria-label="' + esc(t.sectionsGroup) + '"><ol>' + nav + "</ol></nav>" +
      "</header>" +
      '<main id="main" tabindex="-1">' + mainHTML + "</main>" +
      '<p class="toast" id="toast" role="status" aria-live="polite"></p>'
    );
  }

  /* ------------------------------------------------------------------ */
  /* Daily                                                               */
  /* ------------------------------------------------------------------ */
  var dailyModel = null;

  function dailyMode() {
    if (STATE === "delayed") return { mode: "delayed", lastIdx: DELAYED_LAST - OPEN };
    if (STATE === "live") return { mode: "live", lastIdx: LAST_IDX };
    return { mode: STATE, lastIdx: -1 };
  }

  function dialSVG(dm) {
    var mode = dm.mode, lastIdx = dm.lastIdx;
    var hasData = mode === "live" || mode === "delayed";
    var skeleton = mode === "loading" || mode === "error";
    var o = [];
    o.push('<svg class="dial-svg" viewBox="0 0 760 760" aria-hidden="true" focusable="false">');
    o.push("<defs>" +
      '<radialGradient id="face" cx="50%" cy="50%" r="50%">' +
      '<stop offset="0" stop-color="#1d080d"/><stop offset=".42" stop-color="#170b0f"/><stop offset=".78" stop-color="#121114"/><stop offset="1" stop-color="#0e0e10"/></radialGradient>' +
      '<radialGradient id="mass" gradientUnits="userSpaceOnUse" cx="' + C + '" cy="' + C + '" r="' + R1 + '">' +
      '<stop offset="' + f(R0 / R1) + '" stop-color="#2a060d"/><stop offset="1" stop-color="#8e1426"/></radialGradient>' +
      '<pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#101013"/><line x1="0" y1="0" x2="0" y2="5" stroke="#8a8d96" stroke-width="1.3"/></pattern>' +
      '<clipPath id="sweep"><path id="sweep-path" d="' + sector(0, 380, A_OPEN, A_CLOSE) + '"/></clipPath>' +
      "</defs>");

    /* Case and face */
    o.push('<circle cx="' + C + '" cy="' + C + '" r="372" class="case-ring"/>');
    o.push('<circle cx="' + C + '" cy="' + C + '" r="364" fill="url(#face)" class="face"/>');

    /* Closed window: 1:00 AM -> 6:00 AM, recessed plate */
    var closedFrom = mode === "closed" ? -180 : A_CLOSE, closedTo = mode === "closed" ? 180 : A_OPEN + 360;
    if (mode === "closed") o.push('<circle cx="' + C + '" cy="' + C + '" r="356" class="closed-plate"/>');
    else o.push('<path d="' + sector(HUB + 6, 356, closedFrom, closedTo) + '" class="closed-plate"/>');

    /* Sunray engraving across the open arc */
    if (mode !== "closed") {
      var rays = "";
      for (var m = OPEN; m <= CLOSE; m += 10) rays += "M" + P(R0, ang(m)) + " L" + P(R1, ang(m)) + " ";
      o.push('<path d="' + rays + '" class="rays"/>');
      /* Packed zone, like a tachometer's red sector */
      o.push('<path d="' + sector(rv(BANDS[2]), rv(CAP), A_OPEN, A_CLOSE) + '" class="packed-zone"/>');
    }

    /* Band rings and capacity ring */
    if (mode !== "closed") {
      BANDS.concat([CAP]).forEach(function (b, bi) {
        var cls = bi === 3 ? "cap-ring" : "band-ring";
        o.push('<path d="' + arc(rv(b), A_OPEN, A_CLOSE) + '" class="' + cls + '"/>');
        o.push('<path d="' + arc(rv(b), A_CLOSE, A_OPEN + 360) + '" class="' + cls + ' dim"/>');
      });
      o.push('<path d="' + arc(R0, A_OPEN, A_CLOSE) + '" class="base-ring"/>');
    }

    /* Bezel ticks: 5-minute, quarter-hour, hour */
    var ticks = { five: "", quarter: "", hour: "", dim: "" };
    for (var mm = 0; mm < 1440; mm += 5) {
      var modAbs = mm < OPEN ? mm + 1440 : mm;
      var open = mode !== "closed" && modAbs >= OPEN && modAbs <= CLOSE;
      var a = ang(mm);
      var kind = mm % 60 === 0 ? "hour" : mm % 15 === 0 ? "quarter" : "five";
      var len = kind === "hour" ? 16 : kind === "quarter" ? 9 : 5;
      var seg = "M" + P(346 - len, a) + " L" + P(346, a) + " ";
      if (open) ticks[kind] += seg; else ticks.dim += seg;
    }
    o.push('<path d="' + ticks.five + '" class="tick five"/><path d="' + ticks.quarter + '" class="tick quarter"/><path d="' + ticks.hour + '" class="tick hour"/><path d="' + ticks.dim + '" class="tick dimtick"/>');
    o.push('<circle cx="' + C + '" cy="' + C + '" r="349" class="bezel-line"/>');

    /* Hour numerals for the opening hours */
    if (mode !== "closed") {
      for (var hh = 6; hh <= 25; hh++) {
        var mod = hh * 60, p = pt(312, ang(mod));
        var key = hh === 6 || hh === 12 || hh === 18 || hh === 24 || hh === 25;
        var h12 = (hh % 12) || 12;
        var label = key ? '<tspan class="num-key">' + h12 + '</tspan><tspan class="num-period"> ' + period(hh % 24 >= 12) + "</tspan>" : String(h12);
        o.push('<text x="' + f(p[0]) + '" y="' + f(p[1]) + '" class="numeral' + (key ? " key" : "") + '" text-anchor="middle" dominant-baseline="central">' + label + "</text>");
      }
      /* Closed window label along the numeral track */
      o.push(curved(t.closed + "  ·  " + clock(CLOSE) + dash().trim().replace(/^/, " ") + " " + clock(OPEN), 312, (A_CLOSE + A_OPEN + 360) / 2, "curved closed-label", { span: 70 }));
      /* Band names engraved in the closed window, value scale on the 1 AM spoke */
      var bandMid = [12, 36, 58, 74], bandNames = [t.quiet, t.moderate, t.busy, t.packed];
      for (var bi2 = 0; bi2 < 4; bi2++) o.push(curved(bandNames[bi2], rv(bandMid[bi2]), 236, "curved band-label", { span: 50 }));
      [0, 24, 48, 68, 80].forEach(function (v) {
        var q = pt(rv(v), A_CLOSE + 4.2);
        o.push('<text x="' + f(q[0]) + '" y="' + f(q[1]) + '" class="scale-num" text-anchor="middle" dominant-baseline="central">' + v + "</text>");
      });
    }

    /* Data */
    if (hasData) {
      var g = [];
      /* Missing span: hatched sector, dashed edge, and a break in the trace */
      var aM0 = ang(OPEN + MISSING_FROM), aM1 = ang(OPEN + MISSING_TO + 1);
      g.push('<path d="' + sector(R0, R1, aM0, aM1) + '" class="missing"/>');

      /* Observed runs: mass + trace through every observed minute, no smoothing */
      var runs = [], cur = null;
      for (var i = 0; i <= lastIdx; i++) {
        var d = DAY[i];
        if (d.state === "observed") { if (!cur) { cur = []; runs.push(cur); } cur.push(d); }
        else cur = null;
      }
      var massD = "", lineD = "";
      runs.forEach(function (run) {
        var first = run[0], last = run[run.length - 1];
        var line = run.map(function (d, j) { return (j ? "L" : "M") + P(rv(d.v), ang(d.mod)); }).join(" ");
        lineD += line + " ";
        massD += line + " L" + P(R0, ang(last.mod)) + " A" + R0 + " " + R0 + " 0 0 0 " + P(R0, ang(first.mod)) + " Z ";
      });
      g.push('<path d="' + massD + '" class="mass"/>');
      g.push('<path d="' + lineD + '" class="trace"/>');
      /* End caps at the edges of the missing span */
      [MISSING_FROM - 1, MISSING_TO + 1].forEach(function (ix) {
        var d = DAY[ix];
        if (!d || ix > lastIdx) return;
        g.push('<circle cx="' + f(pt(rv(d.v), ang(d.mod))[0]) + '" cy="' + f(pt(rv(d.v), ang(d.mod))[1]) + '" r="2.6" class="endcap"/>');
      });
      /* Genuine zero: a bold bar on the zero ring with square end ticks */
      var z0 = ang(OPEN), z1 = ang(OPEN + 9);
      g.push('<path d="' + arc(R0, z0, z1) + '" class="zero-bar"/>');
      g.push('<path d="M' + P(R0 - 6, z0) + " L" + P(R0 + 6, z0) + " M" + P(R0 - 6, z1) + " L" + P(R0 + 6, z1) + '" class="zero-tick"/>');
      o.push('<g id="data" clip-path="url(#sweep)">' + g.join("") + "</g>");

      var mt = metrics(lastIdx);
      /* Average ring over the recorded span */
      var aAvgEnd = ang(OPEN + lastIdx);
      o.push('<path d="' + arc(rv(mt.avg), A_OPEN, aAvgEnd) + '" class="avg-ring"/>');
      o.push(curved(t.avgShort + " " + num(mt.avg, 1), rv(mt.avg) + 0.5, ang(NOW) + 11, "curved avg-label", { span: 22 }));

      /* Peak tell-tale on the capacity track */
      var aP = ang(mt.peakAt);
      o.push('<path d="M' + P(284, aP) + " L" + P(296, aP - 1.6) + " L" + P(296, aP + 1.6) + ' Z" class="peak-pip"/>');
      o.push('<path d="M' + P(rv(mt.peak) + 5, aP) + " L" + P(282, aP) + '" class="peak-lead"/>');

      /* Annotation track — a ring of engraved notes between the capacity ring and the numerals */
      var trackR = 291, fs = 12.5;
      o.push(curvedFrom(t.peakShort + " " + mt.peak + " · " + clock(mt.peakAt), trackR, aP - 3, -1, "curved note-label", fs).svg);
      var aheadStart = ang(NOW) + 3;
      if (mode === "delayed") {
        var wl = curvedFrom(t.waiting + " · " + t.since + " " + clock(DELAYED_LAST), trackR, aheadStart, 1, "curved note-label waiting-label", fs);
        o.push(wl.svg);
        aheadStart = wl.end + 4;
      }
      o.push(curvedFrom(t.ahead + " · " + t.until + " " + clock(CLOSE), trackR, aheadStart, 1, "curved ahead-label", fs).svg);
      o.push(curved(t.missing + " · 18 " + t.min, trackR, (aM0 + aM1) / 2, "curved note-label", { span: 60 }));
      o.push(curvedFrom(t.legendZero + " · " + clock(OPEN) + dash() + clock(OPEN + 9), trackR, A_OPEN + 1.5, 1, "curved note-label", fs).svg);
      o.push('<path d="M' + P(R0 + 8, ang(OPEN + 4)) + " L" + P(282, ang(OPEN + 4)) + '" class="zero-lead"/>');

      /* Still ahead: the unlit part of the dial, with dotted guides to closing */
      var aheadFrom = ang(NOW);
      o.push('<path d="' + sector(R0, R1, aheadFrom, A_CLOSE) + '" class="ahead-veil"/>');
      o.push('<path d="' + arc(R0, aheadFrom, A_CLOSE) + '" class="ahead-guide"/>');
      o.push('<path d="' + arc(R1, aheadFrom, A_CLOSE) + '" class="ahead-guide"/>');

      if (mode === "delayed") {
        var aW0 = ang(DELAYED_LAST) + 0.25, aW1 = ang(NOW);
        o.push('<path d="' + sector(R0, R1, aW0, aW1) + '" class="waiting"/>');
        var lp = pt(rv(mt.latest.v), ang(mt.latest.mod));
        o.push('<circle cx="' + f(lp[0]) + '" cy="' + f(lp[1]) + '" r="5.5" class="last-known"/>');
        o.push('<g id="needle" class="needle needle-delayed"><path d="M' + P(HUB + 6, ang(NOW)) + " L" + P(356, ang(NOW)) + '"/></g>');
      } else {
        var np = pt(rv(mt.latest.v), ang(NOW));
        o.push('<g id="needle" class="needle"><path d="M' + P(HUB + 6, ang(NOW)) + " L" + P(358, ang(NOW)) + '" class="needle-hand"/>' +
          '<path d="M' + P(360, ang(NOW)) + " L" + P(348, ang(NOW) - 1.5) + " L" + P(348, ang(NOW) + 1.5) + ' Z" class="needle-tip"/>' +
          '<circle cx="' + f(np[0]) + '" cy="' + f(np[1]) + '" r="5" class="needle-dot"/></g>');
      }
    } else if (mode === "empty") {
      o.push('<path d="' + arc(R0, A_OPEN, ang(NOW)) + '" class="ahead-guide"/>');
      o.push('<g class="needle needle-delayed"><path d="M' + P(HUB + 6, ang(NOW)) + " L" + P(356, ang(NOW)) + '"/></g>');
    }

    /* Selection hand (filled in by interaction) */
    o.push('<g id="sel" class="sel" style="display:none"><path id="sel-hand" d=""/><circle id="sel-ring" r="7" cx="0" cy="0"/><path id="sel-pip" d=""/></g>');

    /* Hub */
    o.push('<circle cx="' + C + '" cy="' + C + '" r="' + (HUB + 6) + '" class="hub-ring"/>');
    o.push('<circle cx="' + C + '" cy="' + C + '" r="' + HUB + '" class="hub-face"/>');
    var hubTicks = "";
    for (var ht = 0; ht < 360; ht += 6) hubTicks += "M" + P(HUB - (ht % 30 === 0 ? 7 : 3), ht) + " L" + P(HUB, ht) + " ";
    o.push('<path d="' + hubTicks + '" class="hub-ticks"/>');
    if (mode === "loading") o.push('<circle cx="' + C + '" cy="' + C + '" r="' + ((R0 + R1) / 2) + '" class="skeleton-ring"/>');
    o.push("</svg>");
    return o.join("");
  }

  function figureBlock(label, valueHTML, lines, extraCls) {
    return '<div class="fig' + (extraCls ? " " + extraCls : "") + '"><dt>' + esc(label) + "</dt><dd>" +
      '<p class="fig-value">' + valueHTML + "</p>" +
      lines.map(function (l) { return '<p class="fig-line">' + l + "</p>"; }).join("") + "</dd></div>";
  }

  function renderDaily() {
    var dm = dailyMode();
    var mode = dm.mode;
    var hasData = mode === "live" || mode === "delayed";
    var mt = hasData ? metrics(dm.lastIdx) : null;
    dailyModel = { dm: dm, mt: mt, sel: null, page: hasData ? Math.floor(dm.lastIdx / 60) : 0 };

    /* Status */
    var status;
    if (mode === "live") status = statusBlock("live", t.statusLive) + '<p class="status-sub"><span>' + esc(t.latestReading) + "</span> " + bdi(clock(NOW)) + "</p>";
    else if (mode === "delayed") status = statusBlock("delayed", t.statusDelayed) + '<p class="status-sub"><span>' + esc(t.lastReading) + "</span> " + bdi(clock(DELAYED_LAST)) + '</p><p class="status-sub muted"><span>' + esc(t.gymTimeNow) + "</span> " + bdi(clock(NOW)) + '</p><p class="status-note">' + esc(t.delayedNote) + "</p>";
    else if (mode === "closed") status = statusBlock("closed", t.statusClosed);
    else if (mode === "empty") status = statusBlock("empty", t.statusEmpty);
    else if (mode === "loading") status = statusBlock("loading", t.statusLoading);
    else status = statusBlock("error", t.statusError);

    var hours = mode === "closed"
      ? esc(t.statusClosed)
      : span(clock(OPEN), clock(CLOSE)) + ' <span class="muted">(' + esc(t.nextDay) + ")</span>";

    var legendItems = [
      ["observed", t.legendObserved],
      ["zero", t.legendZero],
      ["missing", t.legendMissing],
      ["closed", t.legendClosed],
      ["ahead", t.legendAhead]
    ];
    if (mode === "delayed") legendItems.push(["waiting", t.legendWaiting]);
    legendItems.push([mode === "delayed" ? "now-delayed" : "now", mode === "delayed" ? t.legendNowDelayed : t.legendNow]);
    legendItems.push(["selected", t.legendSelected]);

    var left =
      '<section class="wing wing-start" aria-labelledby="daily-title">' +
      '<h1 id="daily-title">' + esc(t.title) + "</h1>" +
      '<p class="lede">' + esc(t.description) + "</p>" +
      '<div class="status-plate">' + status + "</div>" +
      '<dl class="facts">' +
      '<div class="span-2"><dt>' + esc(t.businessDay) + "</dt><dd>" + esc(t.dayLong).replace(/(\d+)/g, "<bdi>$1</bdi>") + "</dd></div>" +
      '<div class="span-2"><dt>' + esc(t.openingHours) + "</dt><dd>" + hours + "</dd></div>" +
      '<div class="span-2"><dt>' + esc(t.timeZone) + "</dt><dd>" + bdi(t.tzValue) + "</dd></div>" +
      "</dl>" +
      (!hasData ? "" :
        '<div class="key" aria-labelledby="key-title"><h2 id="key-title" class="key-title">' + esc(t.chartTitle) + "</h2>" +
        '<p class="key-note">' + ICON.clockwise + "<span>" + esc(t.noMirror) + "</span></p>" +
        '<ul class="key-list">' + legendItems.map(function (li) {
          return '<li><span class="sw sw-' + li[0] + '" aria-hidden="true"></span><span>' + esc(li[1]) + "</span></li>";
        }).join("") + "</ul>" +
        '<p class="key-rule">' + esc(t.binRule) + "</p></div>") +
      "</section>";

    /* Figures */
    var figs = "";
    if (hasData) {
      var lk = mode === "delayed" ? '<span class="lk">' + esc(t.lastKnown) + "</span>" : "";
      var asOf = mode === "delayed" ? '<p class="fig-asof"><span>' + esc(t.lastKnown) + " · " + esc(t.asOf) + "</span> " + bdi(clock(DELAYED_LAST)) + "</p>" : "";
      figs =
        '<dl class="figs">' +
        figureBlock(t.peak,
          '<span class="band-word">' + bandGlyph(bandIndex(mt.peak)) + "<span>" + esc(bandName(mt.peak)) + '</span></span><span class="big">' + bdi(String(mt.peak)) + "</span>",
          ['<span>' + esc(t.atTime) + "</span> " + bdi(clock(mt.peakAt))], "fig-peak") +
        figureBlock(t.average, '<span class="big">' + bdi(num(mt.avg, 1)) + "</span>",
          ["<span>" + esc(t.recordedMinutesPrefix) + "</span> " + bdi(num(mt.recorded)) + " <span>" + esc(t.recordedMinutesSuffix) + "</span>"]) +
        figureBlock(t.crossings, '<span class="big">' + bdi(num(mt.entries)) + "</span>",
          ["<span>" + esc(t.crossingsNote) + "</span>",
            "<span>" + esc(t.busiestEntryHour) + "</span> " + bdi(hourName(mt.busiestHour))]) +
        figureBlock(t.coverage, '<span class="big">' + bdi(num(mt.coverage, 1) + "%") + "</span>",
          ["<span>" + esc(t.observedPrefix) + "</span> " + bdi(num(mt.recorded)) + " <span>" + esc(t.of) + "</span> " + bdi(num(mt.scheduled)) + " <span>" + esc(t.scheduledMinutes) + "</span>",
            '<span class="muted">' + esc(t.coverageNote) + "</span>"]) +
        "</dl>" +
        '<p class="capacity"><span>' + esc(t.capacity) + "</span> " + bdi("80") + ' <span class="muted">· ' + esc(t.capacityNote) + "</span></p>";
      figs = asOf + figs;
      if (lk) figs = figs; /* qualifier carried by fig-asof and per-figure tag */
    } else if (mode === "closed") {
      figs = '<div class="wing-message"><h2>' + esc(t.closedDayTitle) + "</h2><p>" + esc(t.closedDayDescription) + "</p></div>";
    } else if (mode === "empty") {
      figs = '<dl class="figs">' +
        [t.peak, t.average, t.crossings, t.coverage].map(function (l) {
          return figureBlock(l, '<span class="big na">—</span>', ["<span>" + esc(t.noValue) + "</span>"]);
        }).join("") + "</dl>";
    } else if (mode === "loading") {
      figs = '<div class="figs-skeleton" aria-hidden="true"><span></span><span></span><span></span><span></span></div>';
    } else {
      figs = "";
    }

    var right = '<section class="wing wing-end' + (mode === "delayed" ? " is-delayed" : "") + '" aria-label="' + esc(t.title) + '">' + figs + "</section>";

    /* Dial */
    var hub = '<div class="hub" id="hub" aria-live="polite"></div>';
    var center =
      '<section class="dial-col" aria-labelledby="dial-title">' +
      '<h2 id="dial-title" class="visually-hidden">' + esc(t.chartTitle) + "</h2>" +
      '<div class="dial' + (mode === "loading" ? " is-loading" : "") + '" id="dial"' +
      (hasData ? ' tabindex="0" role="application" aria-roledescription="' + esc(LANG === "ar" ? "قرص" : "dial") + '" aria-label="' + esc(t.chartLabel + " · " + t.chartTitle) + '" aria-describedby="dial-hint dial-summary"' : "") +
      (mode === "loading" ? ' aria-busy="true"' : "") + ">" +
      dialSVG(dm) + hub + "</div>" +
      (hasData ? '<p class="visually-hidden" id="dial-hint">' + esc(t.chartHint) + "</p>" +
        '<p class="visually-hidden" id="dial-summary">' + esc(dialSummary(dm, mt)) + "</p>" : "") +
      "</section>";

    var html = '<div class="cluster">' + left + center + right + "</div>";
    if (hasData) html += ledgerHTML(dm);
    if (hasData) html += '<p class="dial-hint-visible" aria-hidden="true"></p>';
    return html;
  }

  function dialSummary(dm, mt) {
    var parts = [
      t.chartTitle + ".",
      t.peak + " " + mt.peak + " (" + bandName(mt.peak) + ") " + t.atTime + " " + clock(mt.peakAt) + ".",
      t.legendZero + " " + clock(OPEN) + dash() + clock(OPEN + 9) + ".",
      t.missing + " " + clock(OPEN + MISSING_FROM) + dash() + clock(OPEN + MISSING_TO) + ".",
      (dm.mode === "delayed" ? t.waiting + " " + t.since + " " + clock(DELAYED_LAST) + ". " : "") +
      t.ahead + " " + clock(NOW) + dash() + clock(CLOSE) + "."
    ];
    return parts.join(" ");
  }

  function hubHTML(sel) {
    var dm = dailyModel.dm, mode = dm.mode, mt = dailyModel.mt;
    if (mode === "loading") return '<p class="hub-title">' + esc(t.loading) + '</p><p class="hub-note">' + esc(t.loadingDescription) + "</p>";
    if (mode === "error") return '<p class="hub-title">' + esc(t.errorTitle) + '</p><p class="hub-note">' + esc(t.errorDescription) + '</p><button type="button" class="btn btn-red hub-btn" id="retry">' + esc(t.retry) + "</button>";
    if (mode === "closed") return '<p class="hub-state hub-closed">' + ICON.closed + "<span>" + esc(t.statusClosed) + "</span></p>";
    if (mode === "empty") return '<p class="hub-title">' + esc(t.noObservedTitle) + '</p><p class="hub-note">' + esc(t.noObservedDescription) + "</p>";

    var kind, p, extra = "";
    if (sel == null) {
      p = mt.latest;
      kind = mode === "delayed"
        ? '<span class="hub-kind-word">' + esc(t.lastKnown) + "</span>"
        : '<span class="pip" aria-hidden="true"></span><span class="hub-kind-word">' + esc(t.latest) + " · " + esc(t.live) + "</span>";
    } else {
      kind = '<span class="hub-kind-word">' + esc(t.selectedReading) + "</span>";
      if (sel.ahead) {
        return '<p class="hub-kind">' + kind + '</p><p class="hub-time">' + bdi(clock(sel.mod)) + '</p><p class="hub-dash" aria-hidden="true">—</p><p class="hub-state">' + esc(t.ahead) + '</p><p class="hub-note">' + esc(t.aheadNote) + "</p>";
      }
      if (sel.waiting) {
        return '<p class="hub-kind">' + kind + '</p><p class="hub-time">' + bdi(clock(sel.mod)) + '</p><p class="hub-dash" aria-hidden="true">—</p><p class="hub-state">' + esc(t.waiting) + '</p><p class="hub-note">' + esc(t.waitingNote) + "</p>";
      }
      p = DAY[sel.i];
    }
    if (p.state === "missing") {
      return '<p class="hub-kind">' + kind + '</p><p class="hub-time">' + bdi(clock(p.mod)) + '</p><p class="hub-dash" aria-hidden="true">—</p><p class="hub-state">' + esc(t.missing) + '</p><p class="hub-note">' + esc(t.missingNote) + "</p>";
    }
    if (p.v === 0) extra = '<p class="hub-state">' + esc(t.observed) + " · " + esc(t.zeroTag) + "</p>";
    else if (sel == null) extra = '<p class="hub-dir">' + ICON.clockwise + "<span>" + esc(t.clockwiseShort) + "</span> " + bdi(clock(OPEN)) + "</p>";
    return '<p class="hub-kind">' + kind + "</p>" +
      '<p class="hub-time">' + bdi(clock(p.mod)) + "</p>" +
      '<p class="hub-value"><span class="hub-pre">' + esc(t.presentPrefix) + '</span><span class="hub-num">' + bdi(String(p.v)) + "</span></p>" +
      '<p class="hub-unit">' + esc(t.presentSuffix) + "</p>" +
      '<p class="hub-band">' + bandGlyph(bandIndex(p.v)) + "<span>" + esc(bandName(p.v)) + "</span></p>" + extra;
  }

  function ledgerHTML(dm) {
    return '<section class="ledger" aria-labelledby="ledger-title">' +
      '<div class="ledger-side">' +
      '<h2 id="ledger-title">' + esc(t.tableSummary) + "</h2>" +
      '<p class="lede">' + esc(t.tableIntro) + "</p>" +
      '<p class="page-status" id="page-status" aria-live="polite"></p>' +
      '<div class="pager">' +
      '<button type="button" class="btn btn-line" id="page-prev">' + ICON.prev + "<span>" + esc(t.previousPage) + "</span></button>" +
      '<button type="button" class="btn btn-line" id="page-next"><span>' + esc(t.nextPage) + "</span>" + ICON.next + "</button>" +
      "</div>" +
      '<div class="hour-index" role="group" aria-label="' + esc(t.jumpHour) + '" id="hour-index"></div>' +
      "</div>" +
      '<div class="ledger-table" role="region" aria-label="' + esc(t.tableRegion) + '" tabindex="0" id="ledger-scroll">' +
      '<table><caption class="visually-hidden">' + esc(t.tableRegion) + "</caption><thead><tr>" +
      "<th scope=\"col\">" + esc(t.time) + "</th><th scope=\"col\">" + esc(t.count) + "</th><th scope=\"col\">" + esc(t.band) + "</th><th scope=\"col\">" + esc(t.state) + "</th><th scope=\"col\">" + esc(t.source) + "</th>" +
      '</tr></thead><tbody id="ledger-body"></tbody></table></div>' +
      "</section>";
  }

  function renderLedgerPage() {
    var dm = dailyModel.dm;
    var lastRow = LAST_IDX; /* rows run to now; after the last reading they are waiting */
    var pages = Math.floor(lastRow / 60) + 1;
    var pg = Math.max(0, Math.min(pages - 1, dailyModel.page));
    dailyModel.page = pg;
    var from = pg * 60, to = Math.min(lastRow, from + 59);
    var rows = "";
    for (var i = from; i <= to; i++) {
      var d = DAY[i], waiting = i > dm.lastIdx;
      var selCls = dailyModel.sel && !dailyModel.sel.ahead && dailyModel.sel.i === i ? ' class="is-sel"' : "";
      var cells;
      if (waiting) {
        cells = "<td>—</td><td>—</td><td>" + esc(t.waiting) + "</td><td>—</td>";
      } else if (d.state === "missing") {
        cells = '<td>—</td><td>—</td><td><span class="st st-missing">' + esc(t.missing) + "</span></td><td>—</td>";
      } else {
        cells = "<td>" + bdi(String(d.v)) + '</td><td><span class="band-cell">' + bandGlyph(bandIndex(d.v)) + "<span>" + esc(bandName(d.v)) + "</span></span></td><td>" +
          esc(t.observed) + (d.v === 0 ? ' <span class="st st-zero">· ' + esc(t.zeroTag) + "</span>" : "") + "</td><td>" + esc(t.live) + "</td>";
      }
      rows += "<tr" + selCls + ' data-i="' + i + '"><th scope="row">' + bdi(clock(d.mod)) + "</th>" + cells + "</tr>";
    }
    document.getElementById("ledger-body").innerHTML = rows;
    document.getElementById("page-status").innerHTML =
      '<span class="ps-page"><span>' + esc(t.minutePage) + "</span> " + bdi(String(pg + 1)) + " <span>" + esc(t.of) + "</span> " + bdi(String(pages)) + "</span>" +
      '<span class="ps-range"><span>' + esc(t.showing) + "</span> " + span(clock(OPEN + from), clock(OPEN + to)) + "</span>";
    document.getElementById("page-prev").disabled = pg === 0;
    document.getElementById("page-next").disabled = pg === pages - 1;
    var idx = "";
    for (var p = 0; p < pages; p++) {
      idx += '<button type="button" class="hour-btn" data-page="' + p + '"' + (p === pg ? ' aria-current="true"' : "") + ">" + bdi(hourName(OPEN + p * 60)) + "</button>";
    }
    document.getElementById("hour-index").innerHTML = idx;
  }

  function setSelection(sel, fromKeyboard) {
    dailyModel.sel = sel;
    var g = document.getElementById("sel");
    document.getElementById("hub").innerHTML = hubHTML(sel);
    if (!sel) { g.style.display = "none"; renderLedgerPage(); return; }
    var a = ang(sel.mod);
    var d = !sel.ahead && !sel.waiting ? DAY[sel.i] : null;
    g.style.display = "";
    document.getElementById("sel-hand").setAttribute("d", "M" + P(HUB + 8, a) + " L" + P(344, a));
    document.getElementById("sel-pip").setAttribute("d", "M" + P(350, a) + " L" + P(362, a - 1.4) + " L" + P(362, a + 1.4) + " Z");
    var ring = document.getElementById("sel-ring");
    if (d && d.state === "observed") {
      var q = pt(rv(d.v), a);
      ring.setAttribute("cx", f(q[0])); ring.setAttribute("cy", f(q[1])); ring.style.display = "";
    } else ring.style.display = "none";
    if (!sel.ahead) {
      var pg = Math.floor(sel.i / 60);
      if (pg !== dailyModel.page) dailyModel.page = pg;
      renderLedgerPage();
      var row = document.querySelector('#ledger-body tr[data-i="' + sel.i + '"]');
      var box = document.getElementById("ledger-scroll");
      if (row && box) {
        var top = row.offsetTop - box.clientHeight / 2;
        box.scrollTop = Math.max(0, top);
      }
    }
  }

  function bindDaily() {
    var dm = dailyModel.dm;
    var hub = document.getElementById("hub");
    hub.innerHTML = hubHTML(null);
    var retry = document.getElementById("retry");
    if (retry) retry.addEventListener("click", function () { location.href = hrefWith({ state: null }); });
    if (!(dm.mode === "live" || dm.mode === "delayed")) return;

    renderLedgerPage();
    document.getElementById("page-prev").addEventListener("click", function () { dailyModel.page--; renderLedgerPage(); });
    document.getElementById("page-next").addEventListener("click", function () { dailyModel.page++; renderLedgerPage(); });
    document.getElementById("hour-index").addEventListener("click", function (e) {
      var b = e.target.closest("[data-page]"); if (!b) return;
      dailyModel.page = +b.getAttribute("data-page"); renderLedgerPage();
      var nb = document.querySelector('#hour-index [data-page="' + dailyModel.page + '"]'); if (nb) nb.focus();
    });

    var dial = document.getElementById("dial");
    var svg = dial.querySelector("svg");
    function minuteFromEvent(e) {
      var rect = svg.getBoundingClientRect();
      var x = ((e.clientX - rect.left) / rect.width) * 760 - C;
      var y = ((e.clientY - rect.top) / rect.height) * 760 - C;
      var r = Math.sqrt(x * x + y * y);
      if (r < HUB || r > 364) return null;
      var deg = (Math.atan2(x, -y) * 180) / Math.PI; if (deg < 0) deg += 360;
      var mod = Math.round(720 + deg * 4);
      if (mod < OPEN) mod += 1440;
      if (mod > CLOSE + 1440) mod -= 1440;
      if (mod < OPEN || mod > CLOSE) return null; /* the closed window */
      if (mod > NOW) return { ahead: true, mod: mod };
      var i = mod - OPEN;
      if (i > dm.lastIdx) return { waiting: true, i: i, mod: mod };
      return { i: i, mod: mod };
    }
    var pinned = false;
    dial.addEventListener("pointermove", function (e) {
      if (pinned || e.pointerType === "touch") return;
      var s = minuteFromEvent(e);
      if (s) setSelection(s);
    });
    dial.addEventListener("pointerleave", function () { if (!pinned) setSelection(null); });
    dial.addEventListener("click", function (e) {
      var s = minuteFromEvent(e);
      if (!s) { pinned = false; setSelection(null); return; }
      pinned = true; setSelection(s);
    });
    dial.addEventListener("keydown", function (e) {
      var cur = dailyModel.sel && !dailyModel.sel.ahead ? dailyModel.sel.i : LAST_IDX;
      var later = RTL ? "ArrowLeft" : "ArrowRight", earlier = RTL ? "ArrowRight" : "ArrowLeft";
      var step = e.shiftKey ? 10 : 1, next = null;
      if (e.key === later || e.key === "ArrowUp") next = cur + step;
      else if (e.key === earlier || e.key === "ArrowDown") next = cur - step;
      else if (e.key === "PageUp") next = cur - 60;
      else if (e.key === "PageDown") next = cur + 60;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = dm.lastIdx;
      else if (e.key === "Escape") { pinned = false; setSelection(null); return; }
      else return;
      e.preventDefault();
      next = Math.max(0, Math.min(LAST_IDX, next));
      pinned = true;
      var sel = next > dm.lastIdx ? { waiting: true, i: next, mod: OPEN + next } : { i: next, mod: OPEN + next };
      setSelection(sel, true);
    });

    if (!REDUCED) sweep();
  }

  /* One authored moment: the hand sweeps from opening to now, revealing the day behind it. */
  function sweep() {
    var clip = document.getElementById("sweep-path");
    var needle = document.getElementById("needle");
    if (!clip || !needle) return;
    var start = A_OPEN, end = ang(NOW), dur = 1150, t0 = null;
    function ease(x) { return x === 1 ? 1 : 1 - Math.pow(2, -10 * x); }
    function frame(ts) {
      if (t0 === null) t0 = ts;
      var k = Math.min(1, (ts - t0) / dur), a = start + (end - start) * ease(k);
      clip.setAttribute("d", sector(0, 380, start - 0.5, a + 0.3));
      needle.setAttribute("transform", "rotate(" + f(a - end) + " " + C + " " + C + ")");
      if (k < 1) requestAnimationFrame(frame);
      else { clip.setAttribute("d", sector(0, 380, A_OPEN, A_CLOSE)); needle.removeAttribute("transform"); }
    }
    clip.setAttribute("d", sector(0, 380, start - 0.5, start));
    needle.setAttribute("transform", "rotate(" + f(start - end) + " " + C + " " + C + ")");
    requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------------------ */
  /* Reports                                                             */
  /* ------------------------------------------------------------------ */
  var RING_OUT = 300, RING_IN = 146, RING_W = (RING_OUT - RING_IN) / 7;
  var reportSel = null, tableDay = 0;

  function ramp(v) {
    /* single-hue ramp: deep oxblood to FITWAY red, never lighter than #E51935 */
    var k = Math.max(0, Math.min(1, v / WEEK_MAX));
    var a = [0x2b, 0x09, 0x10], b = [0xe5, 0x19, 0x35];
    var g = 0.85; k = Math.pow(k, g);
    return "rgb(" + a.map(function (x, i) { return Math.round(x + (b[i] - x) * k); }).join(",") + ")";
  }

  function weekSVG() {
    var o = [];
    o.push('<svg class="dial-svg" viewBox="0 0 760 760" aria-hidden="true" focusable="false">');
    o.push('<defs><radialGradient id="face2" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#1d080d"/><stop offset=".45" stop-color="#150c10"/><stop offset="1" stop-color="#0e0e10"/></radialGradient>' +
      '<pattern id="hatch2" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#111114"/><line x1="0" y1="0" x2="0" y2="5" stroke="#8a8d96" stroke-width="1.3"/></pattern></defs>');
    o.push('<circle cx="' + C + '" cy="' + C + '" r="372" class="case-ring"/>');
    o.push('<circle cx="' + C + '" cy="' + C + '" r="364" fill="url(#face2)" class="face"/>');
    o.push('<path d="' + sector(RING_IN - 4, 356, A_CLOSE, A_OPEN + 360) + '" class="closed-plate"/>');
    /* ring guides through the closed window, so each engraved weekday name sits on its ring */
    for (var gi = 0; gi <= 7; gi++) o.push('<path d="' + arc(RING_OUT - gi * RING_W, A_CLOSE + 1, A_OPEN + 359) + '" class="ring-guide"/>');

    /* ticks */
    var ticks = { five: "", quarter: "", hour: "", dim: "" };
    for (var mm = 0; mm < 1440; mm += 5) {
      var modAbs = mm < OPEN ? mm + 1440 : mm, open = modAbs >= OPEN && modAbs <= CLOSE, a = ang(mm);
      var kind = mm % 60 === 0 ? "hour" : mm % 15 === 0 ? "quarter" : "five";
      var len = kind === "hour" ? 16 : kind === "quarter" ? 9 : 5;
      var seg = "M" + P(346 - len, a) + " L" + P(346, a) + " ";
      if (open) ticks[kind] += seg; else ticks.dim += seg;
    }
    o.push('<path d="' + ticks.five + '" class="tick five"/><path d="' + ticks.quarter + '" class="tick quarter"/><path d="' + ticks.hour + '" class="tick hour"/><path d="' + ticks.dim + '" class="tick dimtick"/>');
    o.push('<circle cx="' + C + '" cy="' + C + '" r="349" class="bezel-line"/>');
    for (var hh = 6; hh <= 25; hh++) {
      var p = pt(320, ang(hh * 60)), key = hh === 6 || hh === 12 || hh === 18 || hh === 24 || hh === 25, h12 = (hh % 12) || 12;
      var label = key ? '<tspan class="num-key">' + h12 + '</tspan><tspan class="num-period"> ' + period(hh % 24 >= 12) + "</tspan>" : String(h12);
      o.push('<text x="' + f(p[0]) + '" y="' + f(p[1]) + '" class="numeral' + (key ? " key" : "") + '" text-anchor="middle" dominant-baseline="central">' + label + "</text>");
    }

    /* cells */
    WEEK.forEach(function (row, w) {
      var rO = RING_OUT - w * RING_W, rI = rO - RING_W;
      row.forEach(function (c, k) {
        var a0 = ang(OPEN + k * 60), a1 = a0 + 15;
        var d = sector(rI + 1.1, rO - 1.1, a0 + 0.55, a1 - 0.55);
        var cls = "cell cell-" + c.state;
        var fill = c.state === "value" ? ' style="fill:' + ramp(c.avg) + '"' : "";
        o.push('<path d="' + d + '" class="' + cls + '"' + fill + ' data-w="' + w + '" data-k="' + k + '"/>');
        var mid = pt((rI + rO) / 2, (a0 + a1) / 2);
        if (c.state === "value" || c.state === "zero") {
          o.push('<text x="' + f(mid[0]) + '" y="' + f(mid[1]) + '" class="cell-num' + (c.state === "zero" ? " zero" : "") + '" text-anchor="middle" dominant-baseline="central">' + Math.round(c.avg) + "</text>");
        } else if (c.state === "missing") {
          o.push('<text x="' + f(mid[0]) + '" y="' + f(mid[1]) + '" class="cell-num missing" text-anchor="middle" dominant-baseline="central">?</text>');
        }
      });
      /* weekday label engraved in the closed window */
      o.push(curved(t.weekdays[w], (rI + rO) / 2, 233, "curved day-label", { span: 56 }));
    });
    /* Friday closed-span label runs along the Friday ring */
    var fO = RING_OUT - 5 * RING_W, fI = fO - RING_W;
    o.push(curved(t.closedUntil, (fO + fI) / 2, ang(OPEN + 4 * 60), "curved fri-label", { span: 50 }));

    o.push('<g id="wsel" class="wsel" style="display:none"><path id="wsel-cell" d=""/></g>');
    o.push('<circle cx="' + C + '" cy="' + C + '" r="' + (RING_IN - 6) + '" class="hub-ring"/>');
    o.push('<circle cx="' + C + '" cy="' + C + '" r="' + (RING_IN - 12) + '" class="hub-face"/>');
    var hubTicks = "";
    for (var ht = 0; ht < 360; ht += 6) hubTicks += "M" + P(RING_IN - 12 - (ht % 30 === 0 ? 7 : 3), ht) + " L" + P(RING_IN - 12, ht) + " ";
    o.push('<path d="' + hubTicks + '" class="hub-ticks"/>');
    o.push("</svg>");
    return o.join("");
  }

  function hourSpan(k) { return span(clock(OPEN + k * 60), clock(OPEN + k * 60 + 59)); }

  function weekHubHTML(c) {
    var head = '<p class="hub-kind"><span class="hub-kind-word">' + esc(t.selectedTitle) + "</span></p>" +
      '<p class="hub-time"><span>' + esc(t.weekdays[c.w]) + "</span> · " + bdi(hourName(OPEN + c.k * 60)) + "</p>";
    if (c.state === "closed") return head + '<p class="hub-dash" aria-hidden="true">—</p><p class="hub-state">' + esc(t.stateClosed) + '</p><p class="hub-note">' + esc(t.selectedClosed) + "</p>";
    if (c.state === "missing") return head + '<p class="hub-dash" aria-hidden="true">—</p><p class="hub-state">' + esc(t.stateMissing) + '</p><p class="hub-note">' + esc(t.selectedMissing) + "</p>";
    return head +
      '<p class="hub-value"><span class="hub-num">' + bdi(num(c.avg, 1)) + "</span></p>" +
      '<p class="hub-unit">' + esc(t.selectedAverage) + (c.state === "zero" ? " · " + esc(t.stateZero) : "") + "</p>";
  }

  function weekReadoutHTML(c) {
    var rows = [
      [t.selectedAverage, c.avg == null ? esc(t.noValue === undefined ? "—" : "—") : bdi(num(c.avg, 1))],
      [t.selectedObserved, bdi(num(c.observed)) + " <span>" + esc(t.of) + "</span> " + bdi(num(c.expected))],
      [t.selectedSamples, bdi(String(c.samples))]
    ];
    var note = c.state === "closed" ? t.selectedClosed : c.state === "missing" ? t.selectedMissing : c.state === "zero" ? t.stateZero : "";
    return '<h2 class="panel-title">' + esc(t.selectedTitle) + "</h2>" +
      '<p class="readout-when"><span>' + esc(t.weekdays[c.w]) + "</span> · " + hourSpan(c.k) + "</p>" +
      '<dl class="readout-list">' + rows.map(function (r) { return "<div><dt>" + esc(r[0]) + "</dt><dd>" + r[1] + "</dd></div>"; }).join("") + "</dl>" +
      (note ? '<p class="readout-note">' + esc(note) + "</p>" : "");
  }

  function renderHistory() {
    var comp = [
      [t.comparisonAverage, 31.4, 29.0, 1, ""],
      [t.comparisonCrossings, 2316, 2187, 0, ""],
      [t.comparisonCoverage, 98.6, 97.9, 1, "%"]
    ];
    var compRows = comp.map(function (r) {
      var d = r[1] - r[2], dir = d > 0 ? "up" : d < 0 ? "down" : "flat";
      var word = dir === "up" ? t.comparisonUp : dir === "down" ? t.comparisonDown : t.comparisonFlat;
      var sign = d > 0 ? "+" : d < 0 ? "−" : "";
      var abs = Math.abs(d);
      var deltaHTML = r[4] === "%"
        ? '<bdi dir="ltr">' + esc(sign + num(abs, 1)) + "</bdi> <span>" + esc(t.points) + "</span>"
        : '<bdi dir="ltr">' + esc(sign + num(abs, r[3]) + " (" + sign + num((abs / r[2]) * 100, 1) + "%)") + "</bdi>";
      return "<tr><th scope=\"row\">" + esc(r[0]) + "</th>" +
        '<td class="cmp-now">' + bdi(num(r[1], r[3]) + r[4]) + "</td>" +
        '<td class="cmp-prev">' + bdi(num(r[2], r[3]) + r[4]) + "</td>" +
        '<td class="cmp-change cmp-' + dir + '">' + ICON[dir] + '<span class="cmp-words"><span>' + esc(word) + "</span> " + deltaHTML + "</span></td></tr>";
    }).join("");

    var left =
      '<section class="wing wing-start" aria-labelledby="r-title">' +
      '<h1 id="r-title">' + esc(t.rTitle) + "</h1>" +
      '<p class="lede">' + esc(t.rDescription) + "</p>" +
      '<dl class="facts">' +
      '<div class="span-2"><dt>' + esc(t.windowLabel) + "</dt><dd>" + t.windowValue.map(function (s) { return esc(s).replace(/(\d+)/g, "<bdi>$1</bdi>"); }).join(dash()) + "</dd></div>" +
      "<div><dt>" + esc(t.windowDays) + "</dt><dd>" + bdi("28") + "</dd></div>" +
      "<div><dt>" + esc(t.timeZoneLabel) + "</dt><dd>" + bdi(t.tzValue) + "</dd></div>" +
      "</dl>" +
      '<form class="range" id="range" novalidate>' +
      '<fieldset><legend>' + esc(t.rangeLegend) + ' <span class="hint">· ' + esc(t.rangeHint) + "</span></legend>" +
      '<div class="range-fields">' +
      '<label><span>' + esc(t.startLabel) + '</span><input type="date" id="r-start" value="2026-08-26" min="2025-01-01" max="2026-09-22"></label>' +
      '<label><span>' + esc(t.endLabel) + '</span><input type="date" id="r-end" value="2026-09-22" min="2025-01-01" max="2026-09-22"></label>' +
      "</div>" +
      '<div class="presets" role="group" aria-label="' + esc(t.presetsLegend) + '">' +
      '<button type="button" class="chip" data-days="7" aria-pressed="false">' + esc(t.presetLast7) + "</button>" +
      '<button type="button" class="chip" data-days="28" aria-pressed="true">' + esc(t.presetLast28) + "</button>" +
      '<button type="button" class="chip" data-days="31" aria-pressed="false">' + esc(t.presetLast31) + "</button>" +
      "</div>" +
      '<div class="range-actions"><button type="submit" class="btn btn-red">' + esc(t.apply) + '</button><p class="range-msg" id="range-msg" role="status" aria-live="polite"></p></div>' +
      "</fieldset></form>" +
      '<div class="key" aria-labelledby="wkey-title"><h2 id="wkey-title" class="key-title">' + esc(t.legendLabel) + "</h2>" +
      '<div class="ramp-key"><span class="ramp-bar" aria-hidden="true"></span><span class="ramp-ends"><span>' + esc(t.legendQuiet) + " " + bdi("0") + "</span><span>" + esc(t.legendBusy) + " " + bdi(num(WEEK_MAX, 1)) + "</span></span></div>" +
      '<ul class="key-list">' +
      '<li><span class="sw sw-cell-zero" aria-hidden="true">0</span><span>' + esc(t.legendZeroCell) + "</span></li>" +
      '<li><span class="sw sw-closed" aria-hidden="true"></span><span>' + esc(t.legendClosedCell) + "</span></li>" +
      '<li><span class="sw sw-missing" aria-hidden="true">?</span><span>' + esc(t.legendMissingCell) + "</span></li>" +
      "</ul>" +
      '<p class="key-rule">' + esc(t.cellRule) + "</p>" +
      '<p class="key-note">' + ICON.clockwise + "<span>" + esc(t.ringOrder) + "</span></p>" +
      "</div>" +
      "</section>";

    var center =
      '<section class="dial-col" aria-labelledby="w-title">' +
      '<h2 id="w-title" class="visually-hidden">' + esc(t.heatmapTitle) + "</h2>" +
      '<div class="dial week" id="wdial" tabindex="0" role="application" aria-roledescription="' + esc(LANG === "ar" ? "قرص الأسبوع" : "week dial") + '" aria-label="' + esc(t.heatmapRegion + " · " + t.heatmapDescription) + '" aria-describedby="w-hint">' +
      weekSVG() + '<div class="hub" id="whub"></div></div>' +
      '<p class="visually-hidden" id="w-hint">' + esc(t.heatmapHint + " " + t.ringOrder) + "</p>" +
      "</section>";

    var right =
      '<section class="wing wing-end" aria-label="' + esc(t.selectedTitle + " · " + t.comparisonTitle) + '">' +
      '<div class="panel readout" id="readout" aria-live="polite"></div>' +
      '<div class="panel compare"><h2 class="panel-title">' + esc(t.comparisonTitle) + "</h2>" +
      '<p class="panel-sub">' + esc(t.comparisonDescription) + "</p>" +
      '<table class="cmp"><thead><tr><th scope="col"><span class="visually-hidden">' + esc(t.comparisonMetric) + "</span></th>" +
      '<th scope="col">' + esc(t.comparisonCurrent) + '<span class="wk">' + bdi(t.weekLatest) + "</span></th>" +
      '<th scope="col">' + esc(t.comparisonPrior) + '<span class="wk">' + bdi(t.weekPrior) + "</span></th>" +
      '<th scope="col"><span class="visually-hidden">' + esc(t.comparisonChange) + "</span></th></tr></thead><tbody>" + compRows + "</tbody></table></div>" +
      "</section>";

    var lower =
      '<div class="lower">' +
      '<section class="panel csv" aria-labelledby="csv-title"><h2 id="csv-title" class="panel-title">' + esc(t.csvTitle) + "</h2>" +
      '<p class="panel-sub">' + esc(t.csvDescription) + "</p>" +
      '<form id="csv" novalidate><fieldset><legend class="visually-hidden">' + esc(t.csvLegend) + "</legend>" +
      '<p class="fieldset-cap">' + esc(t.csvLegend) + ' <span class="hint">· ' + esc(t.csvHint) + "</span></p>" +
      '<div class="range-fields"><label><span>' + esc(t.startLabel) + '</span><input type="date" value="2026-09-01" max="2026-09-22"></label>' +
      '<label><span>' + esc(t.endLabel) + '</span><input type="date" value="2026-09-22" max="2026-09-22"></label>' +
      '<button type="submit" class="btn btn-red">' + esc(t.csvExport) + "</button></div></fieldset>" +
      '<p class="range-msg" id="csv-msg" role="status" aria-live="polite"></p></form>' +
      '<p class="privacy">' + ICON.shield + "<span>" + esc(t.csvPrivacyNote) + "</span></p></section>" +
      '<aside class="footnote" aria-label="' + esc(LANG === "ar" ? "ملاحظة الحساب" : "How averages are counted") + '"><p>' + esc(t.footnote) + "</p></aside>" +
      "</div>" +
      '<section class="ledger ledger-hours" aria-labelledby="h-title">' +
      '<div class="ledger-side"><h2 id="h-title">' + esc(t.tableSummaryR) + "</h2>" +
      '<p class="lede">' + esc(t.heatmapDescription) + "</p>" +
      '<div class="day-window" role="group" aria-label="' + esc(t.chooseWeekday) + '" id="day-window"></div></div>' +
      '<div class="ledger-table tall" role="region" aria-label="' + esc(t.tableRegionR) + '" tabindex="0">' +
      '<table><caption class="visually-hidden" id="h-caption"></caption><thead><tr>' +
      '<th scope="col">' + esc(t.columnHour) + '</th><th scope="col">' + esc(t.columnState) + '</th><th scope="col">' + esc(t.columnAverage) + '</th><th scope="col">' + esc(t.columnObserved) + '</th><th scope="col">' + esc(t.columnExpected) + '</th><th scope="col">' + esc(t.columnSamples) + "</th>" +
      '</tr></thead><tbody id="h-body"></tbody></table></div></section>';

    return '<div class="cluster cluster-reports">' + left + center + right + "</div>" + lower;
  }

  function renderHourTable() {
    var rows = WEEK[tableDay].map(function (c) {
      var st = c.state === "value" ? t.stateValue : c.state === "zero" ? t.stateZero : c.state === "closed" ? t.stateClosed : t.stateMissing;
      var sel = reportSel && reportSel.w === c.w && reportSel.k === c.k ? ' class="is-sel"' : "";
      return "<tr" + sel + '><th scope="row">' + hourSpan(c.k) + '</th><td><span class="st st-' + c.state + '">' + esc(st) + "</span></td>" +
        "<td>" + (c.avg == null ? "—" : bdi(num(c.avg, 1))) + "</td>" +
        "<td>" + (c.state === "closed" ? "—" : bdi(num(c.observed))) + "</td>" +
        "<td>" + bdi(num(c.expected)) + "</td>" +
        "<td>" + (c.state === "closed" ? "—" : bdi(String(c.samples))) + "</td></tr>";
    }).join("");
    document.getElementById("h-body").innerHTML = rows;
    document.getElementById("h-caption").textContent = t.tableRegionR + " · " + t.weekdays[tableDay];
    document.getElementById("day-window").innerHTML = t.weekdays.map(function (d, w) {
      return '<button type="button" class="day-btn" data-w="' + w + '" aria-pressed="' + (w === tableDay) + '">' + esc(d) + "</button>";
    }).join("");
  }

  function selectCell(w, k) {
    var c = WEEK[w][k];
    reportSel = c;
    var rO = RING_OUT - w * RING_W, rI = rO - RING_W, a0 = ang(OPEN + k * 60), a1 = a0 + 15;
    document.getElementById("wsel").style.display = "";
    document.getElementById("wsel-cell").setAttribute("d", sector(rI + 0.2, rO - 0.2, a0 + 0.1, a1 - 0.1));
    document.getElementById("whub").innerHTML = weekHubHTML(c);
    document.getElementById("readout").innerHTML = weekReadoutHTML(c);
    tableDay = w;
    renderHourTable();
  }

  function bindHistory() {
    var start = WEEK_BUSIEST;
    selectCell(start.w, start.k);
    var wd = document.getElementById("wdial");
    var svg = wd.querySelector("svg");
    function cellFromEvent(e) {
      var rect = svg.getBoundingClientRect();
      var x = ((e.clientX - rect.left) / rect.width) * 760 - C;
      var y = ((e.clientY - rect.top) / rect.height) * 760 - C;
      var r = Math.sqrt(x * x + y * y);
      if (r < RING_IN || r > RING_OUT) return null;
      var w = Math.floor((RING_OUT - r) / RING_W);
      var deg = (Math.atan2(x, -y) * 180) / Math.PI; if (deg < 0) deg += 360;
      var mod = 720 + deg * 4; if (mod < OPEN) mod += 1440; if (mod > CLOSE + 1440) mod -= 1440;
      if (mod < OPEN || mod >= CLOSE) return null;
      return { w: Math.max(0, Math.min(6, w)), k: Math.floor((mod - OPEN) / 60) };
    }
    var pinned = false;
    wd.addEventListener("pointermove", function (e) {
      if (pinned || e.pointerType === "touch") return;
      var c = cellFromEvent(e); if (c) selectCell(c.w, c.k);
    });
    wd.addEventListener("click", function (e) { var c = cellFromEvent(e); if (c) { pinned = true; selectCell(c.w, c.k); } });
    wd.addEventListener("keydown", function (e) {
      var w = reportSel.w, k = reportSel.k;
      var later = RTL ? "ArrowLeft" : "ArrowRight", earlier = RTL ? "ArrowRight" : "ArrowLeft";
      if (e.key === later) k = Math.min(HOURS - 1, k + 1);
      else if (e.key === earlier) k = Math.max(0, k - 1);
      else if (e.key === "ArrowUp") w = Math.max(0, w - 1);
      else if (e.key === "ArrowDown") w = Math.min(6, w + 1);
      else if (e.key === "Home") k = 0;
      else if (e.key === "End") k = HOURS - 1;
      else return;
      e.preventDefault(); pinned = true; selectCell(w, k);
    });
    document.getElementById("day-window").addEventListener("click", function (e) {
      var b = e.target.closest("[data-w]"); if (!b) return;
      tableDay = +b.getAttribute("data-w"); renderHourTable();
      var nb = document.querySelector('#day-window [data-w="' + tableDay + '"]'); if (nb) nb.focus();
    });

    /* Range control */
    var form = document.getElementById("range"), msg = document.getElementById("range-msg");
    var sEl = document.getElementById("r-start"), eEl = document.getElementById("r-end");
    function days(a, b) { return Math.round((new Date(b + "T00:00:00Z") - new Date(a + "T00:00:00Z")) / 86400000) + 1; }
    function pend() { msg.textContent = t.rangePending; msg.className = "range-msg pending"; }
    [sEl, eEl].forEach(function (el) { el.addEventListener("input", function () { setPreset(null); pend(); }); });
    function setPreset(n) {
      form.querySelectorAll(".chip").forEach(function (c) { c.setAttribute("aria-pressed", String(+c.getAttribute("data-days") === n)); });
    }
    form.querySelector(".presets").addEventListener("click", function (e) {
      var c = e.target.closest(".chip"); if (!c) return;
      var n = +c.getAttribute("data-days");
      var end = new Date("2026-09-22T00:00:00Z"), st = new Date(end.getTime() - (n - 1) * 86400000);
      sEl.value = st.toISOString().slice(0, 10); eEl.value = "2026-09-22";
      setPreset(n); pend();
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!sEl.value || !eEl.value) { msg.textContent = t.problemIncomplete; msg.className = "range-msg problem"; return; }
      var n = days(sEl.value, eEl.value);
      if (n < 1) { msg.textContent = t.problemInverted; msg.className = "range-msg problem"; return; }
      if (n > 31) { msg.textContent = t.problemTooLong; msg.className = "range-msg problem"; return; }
      msg.textContent = t.rangeApplied + " · " + t.rangeConcept; msg.className = "range-msg ok";
    });
    document.getElementById("csv").addEventListener("submit", function (e) {
      e.preventDefault();
      document.getElementById("csv-msg").textContent = t.csvConcept;
    });
  }

  /* ------------------------------------------------------------------ */
  /* Placeholder sections                                                */
  /* ------------------------------------------------------------------ */
  function renderPlaceholder(key) {
    var pl = t.placeholders[key];
    var ticks = "";
    for (var mm = 0; mm < 1440; mm += 15) {
      var a = ang(mm), len = mm % 60 === 0 ? 14 : 6;
      ticks += "M" + P(346 - len, a) + " L" + P(346, a) + " ";
    }
    return '<div class="placeholder">' +
      '<div class="blank-dial" aria-hidden="true"><svg class="dial-svg" viewBox="0 0 760 760" focusable="false">' +
      '<circle cx="380" cy="380" r="372" class="case-ring"/><circle cx="380" cy="380" r="364" class="face blank-face"/>' +
      '<path d="' + ticks + '" class="tick quarter"/><circle cx="380" cy="380" r="349" class="bezel-line"/>' +
      '<circle cx="380" cy="380" r="236" class="band-ring dim"/></svg></div>' +
      '<div class="placeholder-copy">' +
      "<h1>" + esc(pl[0]) + "</h1>" +
      '<p class="lede">' + esc(pl[1]) + "</p>" +
      '<p class="nd-tag">' + esc(t.notDesigned) + "</p>" +
      '<p class="nd-body">' + esc(t.notDesignedBody) + "</p>" +
      "</div></div>";
  }

  /* ------------------------------------------------------------------ */
  /* Boot                                                                */
  /* ------------------------------------------------------------------ */
  var main;
  if (SECTION === "daily") main = renderDaily();
  else if (SECTION === "history") main = renderHistory();
  else main = renderPlaceholder(SECTION);
  document.title = "FITWAY · " + t.sections[SECTION] + " · Chronograph";
  document.body.classList.add("sec-" + SECTION, REDUCED ? "motion-off" : "motion-on");
  document.getElementById("app").innerHTML = shell(main);

  if (SECTION === "daily") bindDaily();
  if (SECTION === "history") bindHistory();

  document.querySelectorAll("[data-notice]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      var toast = document.getElementById("toast");
      toast.textContent = el.getAttribute("data-notice") === "monitoring" ? t.monitoringNotice : t.logoutNotice;
      toast.classList.add("show");
      clearTimeout(toast._t);
      toast._t = setTimeout(function () { toast.classList.remove("show"); toast.textContent = ""; }, 3200);
    });
  });
})();
