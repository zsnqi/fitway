/* Eclipse components (run owner_spec_r04_s12): renders every component of DESIGN-SPEC.md §3 in each designed state, in
 * its rule form, AR and EN. Concept only, synthetic data; not production. A classic script (no modules, no fetch), so the
 * page works from file:// too. Query: lang=ar|en (default ar), motion=off. The language switch at the top re-renders in
 * place. Specimens of a state (hover, focus, disabled...) are inert copies; the live demos are marked "Interactive".
 * Western digits only: numbers are printed with String(), never Intl or toLocaleString. */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  let LANG = root.lang === "en" ? "en" : "ar";
  let RTL = LANG === "ar";
  const b = (s) => `<bdi>${s}</bdi>`;

  /* ------------------------------------------------------------ the day (synthetic) */
  // Minutes since 6:00 AM of the business day; the day runs to 1:00 AM. Now is 7:42 PM; a genuine zero from opening to
  // 6:09 AM; no readings from 2:14 to 2:31 PM; while delayed, the latest reading is 13 minutes old.
  const DAY = 1140, NOW = 822, GAP0 = 494, GAP1 = 511, ZERO_END = 9, LATE = 13;
  const bump = (m, c, wl, wr) => Math.exp(-(((m - c) / (m < c ? wl : wr)) ** 2));
  const shape = (m) => 3 + 27 * bump(m, 80, 38, 60) + 11 * bump(m, 390, 80, 90) + 56 * bump(m, 752, 90, 150);
  const usual = (m) => 3.5 + 25 * bump(m, 90, 45, 65) + 12 * bump(m, 400, 80, 90) + 46 * bump(m, 760, 105, 175);
  function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const DATA = (() => {
    const rnd = mulberry32(20260923), raw = new Array(NOW + 1);
    let w = 0;
    for (let m = 0; m <= NOW; m++) {
      w = w * 0.92 + (rnd() - 0.5) * 1.2;
      raw[m] = m <= ZERO_END ? 0 : m >= GAP0 && m <= GAP1 ? null : Math.max(0, Math.round(shape(m) + w * 2.5));
    }
    // The line: a centred 30-minute average with triangular weights, cut at opening, at the gap and at the latest
    // reading; the zero span stays 0.
    const lineFor = (last) => {
      const out = new Array(last + 1).fill(null);
      for (let m = 0; m <= last; m++) {
        if (raw[m] == null) continue;
        if (m <= ZERO_END) { out[m] = 0; continue; }
        const a = m < GAP0 ? 0 : GAP1 + 1, z = m < GAP0 ? GAP0 - 1 : last;
        let s = 0, ws = 0;
        for (let d = -15; d <= 15; d++) { const k = m + d; if (k < a || k > z || raw[k] == null) continue; const wt = 16 - Math.abs(d); s += raw[k] * wt; ws += wt; }
        out[m] = s / ws;
      }
      return out;
    };
    let peak = -1, peakM = 0;
    for (let m = 0; m <= NOW - LATE; m++) if (raw[m] != null && raw[m] > peak) { peak = raw[m]; peakM = m; }
    return { raw, line: { live: lineFor(NOW), delayed: lineFor(NOW - LATE) }, peak, peakM };
  })();
  const LINE_STOP = 390, AHEAD_STOP = 840;
  const levelOf = (v) => (v <= 24 ? 0 : v <= 48 ? 1 : v <= 68 ? 2 : 3);

  /* ------------------------------------------------------------------ copy */
  const arDays = (n) => (n === 1 ? "يوم واحد" : n === 2 ? "يومين" : n >= 3 && n <= 10 ? `${b(n)} أيام` : `${b(n)} يومًا`);
  const COPY = {
    ar: {
      skip: "انتقل إلى المحتوى",
      docTitle: "المكوّنات · FITWAY Eclipse (مفهوم)",
      title: "المكوّنات",
      sub: `مواصفات تصميم ${b("Eclipse")} · مسودة · مقيسة على ${b("31a40d6")}`,
      concept: "مفهوم استكشافي · بيانات افتراضية",
      langName: "لغة الصفحة",
      note: `كل مكوّن في صيغة القاعدة وفي كل حالة مصمَّمة. المقاسات والمسافات هنا هي قواعد المواصفات ${b("TYP-3")} و${b("SPC-5")} و${b("SPC-6")}، وقد اعتمدها المستخدم في ${b(30)} سبتمبر ${b(2026)}. وما يبقى مقترحًا فقط عليه علامة «مقترح». الحالات النشطة (عند المرور والتركيز والتعطيل) نسخ ثابتة؛ والعناصر التفاعلية معلَّمة.`,
      indexName: "أقسام الصفحة",
      proposed: "مقترح",
      live: "تفاعلي",
      st: { def: "افتراضي", hover: "عند المرور", focus: "عند التركيز", pressed: "محدد", disabled: "معطّل", working: "قيد العمل", invalid: "غير صالح", filled: "مملوء", on: "مفعّل", off: "متوقف", current: "الصفحة الحالية", open: "مفتوح", phone: "على الهاتف", inset: "الحلقة الداخلية" },
      sec: {
        found: ["الأساسيات", "الألوان، والخط، والمسافات، والزوايا، والتركيز، والأيقونات."],
        card: ["البطاقة والبطاقة المضاءة", "رأس (أيقونة واسم ووقت)، ثم القيمة، ثم شارة أو ملاحظة في الأسفل. البطاقة المضاءة تفقد ضوءها حين لا تكون قيمتها حالية."],
        chart: ["بطاقة المخطط", "خط اليوم، والخط المعتاد، والعلامة، والتلميح في شريطه العلوي، والمحاور. تتدفق الأوقات من اليمين إلى اليسار."],
        pattern: ["النمط (خريطة الازدحام)", "جدول حقيقي بخانة تبويب واحدة؛ الأسهم تنقل التحديد، والقراءة نفسها عند المرور والتركيز واللمس."],
        table: ["الجدول", "جدول واحد بكثافتين. في عمود الأرقام تصطف الأرقام وعنوانها على الحافة اليمنى في اللغتين، فتقع الآحاد تحت الآحاد، بأرقام متساوية العرض؛ والأشخاص أعداد صحيحة."],
        buttons: ["الأزرار", "زر واحد بارتفاع 44: ثانوي وأساسي وزر أيقونة. الأحمر ليس لون زر."],
        seg: ["مجموعة الاختيار", "كل خيار بارتفاع 44، وخانة تبويب لكل خيار."],
        sw: ["المفتاح", "دور switch مع aria-checked، بارتفاع 44."],
        field: ["حقل التاريخ", "اسم ثابت فوق الحقل، وتلميح للصيغة، وخطأ محدد تحته."],
        dialog: ["النافذة والورقة السفلية", "نافذة مشروطة؛ وعلى الهاتف ورقة من الأسفل تتقاسم أزرارها العرض."],
        chips: ["الشارات", "الشارة داخل المحتوى بارتفاع 26؛ وفي صف الأزرار تساوي الشارة ارتفاع الزر أو تتخلى عن إطارها."],
        rail: ["الشريط الجانبي والرأس", "الاسم يظهر عند التركيز بلوحة المفاتيح فقط، ولا تلميح عند مرور الفأرة. على الجهاز اللوحي يُفتح الشريط فوق طبقة معتمة ويبقى التركيز داخله."],
        frame: ["إطار الهاتف: الشريط السفلي والرأس المضغوط", "عند 720 بكسل وأقل يصير الشريط الجانبي شريطًا زجاجيًا في الأسفل بخمسة أقسام، ويحمل الرأس الحالةَ شارةً تفتح تفاصيلها، وقائمةً واحدة لشاشة المراقبة واللغة وتسجيل الخروج. كل طبقة تُفتح من لوحة المفاتيح، وتُغلق بـ Escape، ويعود التركيز إلى ما فتحها."],
        empty: ["الحالة الفارغة والتنبيه وإعادة المحاولة", "جملة تقول ما الناقص وتواريخه، وطريق واحد للعودة؛ وتنبيه يقول ما حدث وما بقي كما هو."],
      },
      f: { colours: "الألوان", type: "الخط: السلّم", spacing: "المسافات", radii: "الزوايا", focus: "حلقة التركيز", icons: "الأيقونات في السطر، بلا إطار" },
      typeSample: "داخل الصالة الآن",
      nowTitle: "داخل الصالة الآن", approx: "تقريبًا", peakTitle: "ذروة اليوم", lastReading: "آخر قراءة",
      ago: (n) => `قبل ${b(n)} دقيقة`,
      entries: "مرات الدخول", usualN: (n) => `المعتاد ${b(n)}`, busiestTitle: "أكثر الأوقات ازدحامًا", last7: `آخر ${b(7)} أيام`,
      avgN: (n) => `المعدّل ${b(n)}`, avgTitle: "معدّل الموجودين", noReadings: "لا قراءات", noReadingsYet: "لا قراءات بعد",
      wowTitle: "مقارنة أسبوعية", notEnough: "لا يكفي السجل بعد", needs: `يلزم أسبوعان كاملان · القراءات منذ ${b(13)} سبتمبر`,
      wowDates: `${b("16 - 22")} سبتمبر`,
      levels: ["هادئ", "متوسط", "مزدحم", "شديد الازدحام"],
      cmp: { busier: "أعلى من المعتاد", quieter: "أهدأ من المعتاد", same: "قريب من المعتاد" },
      cards: { live: "مباشر، مضاءة", plain: "قيمة ووقتها", late: "متأخرة، بلا ضوء", words: "قيمة بالكلمات", none: "لا قراءات", short: "لا يكفي السجل، بلا ضوء" },
      undesigned: `لم تُصمَّم بعد: التحميل، والإغلاق كحالة للصفحة، وعدم التوفر، والخطأ. تُصمَّم كلٌّ منها في جولة شاشتها (${b("K-02")}).`,
      chartTitle: "ازدحام اليوم", keyLine: `معدّل كل ${b(30)} دقيقة`, keyUsual: "الأربعاء المعتاد", keyPeak: "قراءة الذروة", noHistory: "لا يكفي السجل للمقارنة بعد",
      details: "عرض التفاصيل", peakTag: "الذروة", latestFlag: "آخر قراءة", usual: "المعتاد", stillAhead: "لم يحن بعد",
      chartMain: "مباشر، ومحدد عليها آخر قراءة",
      vars: { peak: "الذروة", line: "نقطة على الخط", gap: "فترة بلا قراءات", ahead: "لم يحن بعد", delayed: "آخر قراءة، متأخرة", nohistory: "لم يحن بعد، بلا سجل" },
      aheadNote: `الخط المعتاد بعد الآن بشفافية ${b(".36")}`,
      patternTitle: "أوقات الازدحام",
      patternSub: `معدّل الموجودين حسب اليوم والساعة · ${b(4)} أسابيع، ${b(28)} يومًا`,
      busiest: (w, h) => `الأكثر ازدحامًا: ${w} ${h}`,
      fewer: "أقل", more: "أكثر", emptyWord: "خالية", emptyLong: "الصالة خالية", closed: "مغلق", busiestKey: "الأكثر ازدحامًا", fewKey: `أقل من ${b(3)} أيام`,
      numbers: "الأرقام", closedTip: "خارج ساعات العمل", noneTip: "لا قراءات في هذه الفترة",
      avgOf: (n) => `معدّل ${arDays(n)}`,
      wd: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
      heatKeys: "استخدم مفاتيح الأسهم للتنقل بين الساعات والأيام، وHome وEnd لأول ساعة وآخرها.",
      numbersOn: "الأرقام ظاهرة: الخلايا مخففة إلى 80%",
      daysTitle: "يومًا بيوم", daysSub: `${b(7)} أيام`,
      cols: { day: "اليوم", peak: "الذروة", avg: "المعدّل", entries: "مرات الدخول", notes: "ملاحظات" },
      daysCaption: `الأيام من ${b(16)} إلى ${b(22)} سبتمبر ${b(2026)}: الذروة والمعدّل ومرات الدخول`,
      highest: "الأعلى", gapRange: "10:00 ص - 2:00 م", beforeRow: `${b(2)} أغسطس - ${b(12)} سبتمبر`,
      sortedBy: "مرتب حسب اليوم، الأحدث أولًا",
      compactTitle: "دقيقة بدقيقة", compactCaption: "قراءات اليوم دقيقة بدقيقة",
      ccols: { time: "الوقت", inside: "داخل الصالة", avg: `معدّل ${b(30)} دقيقة`, note: "ملاحظة" },
      cnotes: { empty: "خالية", peak: "الذروة", latest: "آخر قراءة" },
      dens: { def: "الكثافة الافتراضية: صفوف 48", compact: "الكثافة المضغوطة: صفوف 36" },
      cancel: "إلغاء", apply: "عرض الفترة", save: "حفظ الملف", working: "جارٍ التجهيز…", close: "إغلاق", retry: "إعادة المحاولة", done: "تم",
      seg: { "7d": `آخر ${b(7)} أيام`, "28d": `آخر ${b(4)} أسابيع`, custom: "فترة أخرى…" }, segName: "الفترة",
      from: "من", to: "إلى", hint: `يوم/شهر/سنة، مثل ${b("16/09/2026")}`, errOrder: "تاريخ النهاية قبل البداية", errRequired: "أدخل تاريخًا", errFormat: `اكتب التاريخ هكذا: ${b("16/09/2026")}`,
      rangeTitle: "اختر الفترة", rangeDesc: `القراءات متاحة من ${b(2)} أغسطس ${b(2026)} حتى ${b(22)} سبتمبر ${b(2026)}.`,
      exportTitle: "تصدير بيانات الدقائق", exportDesc: "صف لكل دقيقة بتوقيت الصالة، مع تمييز الدقائق المغلقة والتي بلا قراءات.",
      progress: `اليوم ${b(12)} من ${b(28)}`, failed: "تعذّر تجهيز الملف. لم يُحفظ شيء، والتواريخ كما هي.", ready: "الملف جاهز",
      rows: `${b("40,320")} صفًا`,
      dlgStates: { ready: "جاهزة، والتركيز على الحقل الأول", working: "قيد العمل", failed: "تعذّر، والتركيز على إعادة المحاولة", done: "تم", sheet: "ورقة سفلية على الهاتف" },
      openDlg: "افتح النافذة",
      statusLive: `${"<strong>مباشر</strong>"} · آخر قراءة ${b("7:42 م")}`, statusLate: `${"<strong>متأخر</strong>"} · آخر قراءة ${b("7:29 م")}`,
      chipCaps: { levels: "شارة الازدحام: على «الآن» والذروات فقط", stale: "متأخرة: تخفت مع قيمتها", cmp: "شارة المقارنة", flags: "وسوم", status: "الحالة في الرأس، بلا إطار", statusBtn: "الحالة حين تفتح تفاصيلها: زر 44", concept: "علامة المفهوم، بلا إطار", legend: "مفتاح المخطط، بلا إطار", heatKey: "مفتاح النمط، بلا إطار" },
      nav: { today: "اليوم", reports: "التقارير", access: "الوصول", activity: "سجل النشاط", operations: "التشغيل", monitoring: "شاشة المراقبة", lang: "English", settings: "الإعدادات", signout: "تسجيل الخروج" },
      brand: "FITWAY، أسماء الأقسام", railLabel: "الأقسام",
      railCaps: { states: "الحالات: الحالية، وعند المرور، وعند التركيز مع الاسم", live: "اضغط Tab: يظهر الاسم عند التركيز فقط", open: "مفتوح فوق المحتوى", brand: "الشعار عند التركيز: يسمّي ما يفتحه", tablet: "الجهاز اللوحي: مفتوح فوق طبقة معتمة، والتركيز يبقى داخله" },
      railTip: "أسماء الأقسام",
      tabs: { today: "اليوم", reports: "التقارير", activity: "النشاط", access: "الوصول", settings: "الإعدادات" },
      opsTitle: "حالة التشغيل", more: "المزيد", liveWord: "مباشر", delayedWord: "متأخر",
      date: `الأربعاء ${b(23)} سبتمبر ${b(2026)}`, hours: `ساعات العمل ${b("6:00 ص")} - ${b("1:00 ص")}`,
      lastAt: (t) => `آخر قراءة ${b(t)}`, pm: (t) => `${t} م`,
      frameCaps: { head: "الرأس المضغوط: العنوان، والحالة، والقائمة", headLate: "الرأس المضغوط، متأخر", ops: "تفاصيل الحالة مفتوحة", opsLate: "تفاصيل الحالة، متأخر", menu: "القائمة مفتوحة، والتركيز على أول عنصر", bar: "الشريط السفلي عند 390، والقسم الحالي «اليوم»", bar320: "عند 320: المرور على «التقارير»، والتركيز على «الإعدادات»", live: "جرّب: Tab ثم Enter، والأسهم داخل القائمة، وEscape يعيد التركيز" },
      hdrTitle: "التقارير", hdrSub: `${b("26")} أغسطس - ${b("22")} سبتمبر ${b(2026)}<span class="sep">·</span>${b(28)} يومًا`,
      hdrCap: "رأس الصفحة: العنوان، ثم الفترة، وعناصر التحكم بارتفاع 44 في نهاية السطر",
      emptyTable: `لا قراءات من ${b(1)} يوليو ${b(2026)} إلى ${b(31)} يوليو ${b(2026)}`, emptyAction: `عرض آخر ${b(4)} أسابيع`,
      emptyCaps: { table: "جدول بلا قراءات، وطريق واحد للعودة", alert: "تنبيه وإعادة محاولة واحدة" },
      colourNames: { page: "الصفحة", card: "البطاقة", panel: "النافذة", head: "رأس الجدول", line: "خط السطح", line2: "خط العنصر", line3: "عند المرور", ink: "الطباشير", ink2: "ثانوي", ink3: "توضيحي", red: "أحمر FITWAY", redhi: "الأحمر الساطع", ox: "العنابي", obs: "الأسود", live: "مباشر", delayed: "متأخر", amber: "نص المتأخر", stale: "رمادي قديم", err: "خطأ", field: "حافة الحقل" },
      ratioOn: (r) => `${b(r)}:1 على البطاقة`,
      focusCaps: { ring: "حلقة واحدة: 2 بكسل على بعد 3", inset: "الداخلية: على بعد −4 للعناصر المتلاصقة" },
      iconCaps: { flow: "أيقونة في السطر قبل الاسم", mirror: "رموز الاتجاه تنعكس في العربية" },
      spacingCap: "سلّم المسافات", radiiNames: ["السطوح", "الألواح", "العناصر", "الشارات", "الوسوم"],
    },
    en: {
      skip: "Skip to content",
      docTitle: "Components · FITWAY Eclipse (concept)",
      title: "Components",
      sub: "Eclipse design spec · draft · measured at 31a40d6",
      concept: "Exploration concept · synthetic data",
      langName: "Page language",
      note: "Every component in its rule form and in each designed state. Type sizes and spacing here are the spec's rules TYP-3, SPC-5 and SPC-6, accepted by the user on 30 Sep 2026; anything still only proposed carries a “Proposed” flag. Hover, focus and disabled specimens are still copies; the live parts are marked.",
      indexName: "Sections of this page",
      proposed: "Proposed",
      live: "Interactive",
      st: { def: "Default", hover: "Hover", focus: "Focus", pressed: "Pressed", disabled: "Disabled", working: "Working", invalid: "Invalid", filled: "Filled", on: "On", off: "Off", current: "Current page", open: "Open", phone: "Phone", inset: "Inset ring" },
      sec: {
        found: ["Foundations", "Colour, type, spacing, radii, focus and icons."],
        card: ["Card and lit card", "A head (icon, label, when), the value, then a badge or a note at the foot. A lit card loses its light when its value is not current."],
        chart: ["Chart card", "Today's line, the usual line, the marker, the tooltip in its top lane, and the axes. Time flows left to right."],
        pattern: ["Pattern (heat map)", "A real table with one Tab stop; the arrow keys move the selection, and hover, focus and tap show the same readout."],
        table: ["Table", "One table in two densities. In a numeric column the numbers and their header share the right edge in both languages, so units sit under units, with tabular figures; people as whole numbers."],
        buttons: ["Buttons", "One 44 px button: secondary, primary and icon. Red is never a button colour."],
        seg: ["Segmented control", "Every segment 44 px tall, one Tab stop each."],
        sw: ["Switch", "role=switch with aria-checked, 44 px tall."],
        field: ["Date field", "A persistent label above, a format hint, and a specific error below."],
        dialog: ["Dialog and bottom sheet", "A modal dialog; on a phone, a sheet from the bottom whose actions share the width."],
        chips: ["Chips and badges", "A badge in content is 26 px; in a row of controls a pill matches the control height or drops its box."],
        rail: ["Rail and header", "A rail item shows its name on keyboard focus only; the mouse hover shows no tooltip. On a tablet the rail opens over a scrim and keeps focus inside."],
        frame: ["The phone's frame: the bar and the compact header", "At 720 px and below the rail becomes a glass bar at the bottom with five sections, and the header carries the status as a badge that opens its details, and one menu for Monitoring, the language and sign out. Every layer opens from the keyboard, closes with Escape, and returns focus to what opened it."],
        empty: ["Empty state, alert and retry", "One sentence that names what is missing and its dates, and one way back; an alert that says what happened and what is kept."],
      },
      f: { colours: "Colour", type: "Type: the scale", spacing: "Spacing", radii: "Radii", focus: "Focus ring", icons: "Icons in the flow, with no tile" },
      typeSample: "Inside now",
      nowTitle: "Inside now", approx: "approx.", peakTitle: "Today's peak", lastReading: "Last reading",
      ago: (n) => `${n} min ago`,
      entries: "Entries", usualN: (n) => `Usual ${n}`, busiestTitle: "Busiest time", last7: "Last 7 days",
      avgN: (n) => `Average ${n}`, avgTitle: "Average inside", noReadings: "No readings", noReadingsYet: "No readings yet",
      wowTitle: "Week over week", notEnough: "Not enough history yet", needs: "Needs two full weeks · readings since 13 Sep",
      wowDates: "16 – 22 Sep",
      levels: ["Quiet", "Moderate", "Busy", "Packed"],
      cmp: { busier: "Busier than usual", quieter: "Quieter than usual", same: "About usual" },
      cards: { live: "Live, lit", plain: "A value and its time", late: "Delayed, unlit", words: "A value in words", none: "No readings", short: "Not enough history, unlit" },
      undesigned: "Not designed yet: loading, closed as a page state, unavailable and error. Each is designed in its screen's round (K-02).",
      chartTitle: "Today's crowd", keyLine: "30-min average", keyUsual: "Usual Wednesday", keyPeak: "Peak reading", noHistory: "Not enough history to compare yet",
      details: "View details", peakTag: "Peak", latestFlag: "Latest", usual: "Usual", stillAhead: "Still ahead",
      chartMain: "Live, with the latest reading selected",
      vars: { peak: "The peak", line: "A stop on the line", gap: "A span with no readings", ahead: "Still ahead", delayed: "Latest reading, delayed", nohistory: "Still ahead, no history" },
      aheadNote: "The usual line after now at .36",
      patternTitle: "Busy times",
      patternSub: "Average inside by day and hour · 4 weeks, 28 days",
      busiest: (w, h) => `Busiest: ${w} ${h}`,
      fewer: "Fewer", more: "More", emptyWord: "Empty", emptyLong: "Empty", closed: "Closed", busiestKey: "Busiest", fewKey: "Fewer than 3 days",
      numbers: "Numbers", closedTip: "Outside opening hours", noneTip: "No readings in these dates",
      avgOf: (n) => `Average of ${n} ${n === 1 ? "day" : "days"}`,
      wd: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      heatKeys: "Use the arrow keys to move between hours and days. Home and End go to the day's first and last hour.",
      numbersOn: "Numbers on: the cells dim to 80%",
      daysTitle: "Day by day", daysSub: "7 days",
      cols: { day: "Day", peak: "Peak", avg: "Average", entries: "Entries", notes: "Notes" },
      daysCaption: "Days from 16 to 22 Sep 2026: peak, average and entries",
      highest: "Highest", gapRange: "10:00 AM – 2:00 PM", beforeRow: "2 Aug – 12 Sep",
      sortedBy: "Sorted by day, newest first",
      compactTitle: "Minute by minute", compactCaption: "Today's readings, minute by minute",
      ccols: { time: "Time", inside: "Inside", avg: "30-min average", note: "Note" },
      cnotes: { empty: "Empty", peak: "Peak", latest: "Latest reading" },
      dens: { def: "Default density: 48 px rows", compact: "Compact density: 36 px rows" },
      cancel: "Cancel", apply: "Show these dates", save: "Save file", working: "Preparing…", close: "Close", retry: "Try again", done: "Done",
      seg: { "7d": "Last 7 days", "28d": "Last 4 weeks", custom: "Custom…" }, segName: "Dates",
      from: "From", to: "To", hint: "Day/month/year, like 16/09/2026", errOrder: "The end is before the start", errRequired: "Enter a date", errFormat: "Write the date like 16/09/2026",
      rangeTitle: "Choose dates", rangeDesc: "Readings are available from 2 Aug 2026 to 22 Sep 2026.",
      exportTitle: "Export minute data", exportDesc: "One row per minute, in gym time. Closed minutes and minutes with no readings are marked.",
      progress: "Day 12 of 28", failed: "The file couldn't be prepared. Nothing was saved, and your dates are kept.", ready: "Your file is ready",
      rows: "40,320 rows",
      dlgStates: { ready: "Ready, focus on the first field", working: "Working", failed: "Failed, focus on Try again", done: "Done", sheet: "Bottom sheet on a phone" },
      openDlg: "Open the dialog",
      statusLive: "<strong>Live</strong> · Last reading 7:42 PM", statusLate: "<strong>Delayed</strong> · Last reading 7:29 PM",
      chipCaps: { levels: "Level badge: on “now” and peaks only", stale: "Delayed: dims with its value", cmp: "Comparison badge", flags: "Flags", status: "Header status, boxless", statusBtn: "A status that opens its details: a 44 px control", concept: "Concept label, boxless", legend: "Chart legend, boxless", heatKey: "Pattern key, boxless" },
      nav: { today: "Today", reports: "Reports", access: "Access", activity: "Activity log", operations: "Operations", monitoring: "Monitoring", lang: "العربية", settings: "Settings", signout: "Sign out" },
      brand: "FITWAY, section names", railLabel: "Sections",
      railCaps: { states: "States: current, hover, and focus with its name", live: "Press Tab: the name shows on focus only", open: "Open, over the content", brand: "The logo on focus: it names what it opens", tablet: "Tablet: open over a scrim, focus kept inside" },
      railTip: "Section names",
      tabs: { today: "Today", reports: "Reports", activity: "Activity", access: "Access", settings: "Settings" },
      opsTitle: "Operations status", more: "More", liveWord: "Live", delayedWord: "Delayed",
      date: "Wednesday, 23 September 2026", hours: "Open 6:00 AM – 1:00 AM",
      lastAt: (t) => `Last reading ${t}`, pm: (t) => `${t} PM`,
      frameCaps: { head: "The compact header: title, status and menu", headLate: "The compact header, delayed", ops: "The status details, open", opsLate: "The status details, delayed", menu: "The menu, open, focus on its first item", bar: "The bar at 390, Today current", bar320: "At 320: hover on Reports, focus on Settings", live: "Try it: Tab then Enter, the arrows inside the menu, Escape returns focus" },
      hdrTitle: "Reports", hdrSub: `26 Aug – 22 Sep 2026<span class="sep">·</span>28 days`,
      hdrCap: "Page header: the title, then the period; 44 px controls at the inline end",
      emptyTable: "No readings from 1 Jul 2026 to 31 Jul 2026", emptyAction: "Show the last 4 weeks",
      emptyCaps: { table: "A table with no readings, and one way back", alert: "An alert and one retry" },
      colourNames: { page: "Page", card: "Card", panel: "Dialog", head: "Table head", line: "Surface line", line2: "Control line", line3: "Hover line", ink: "Chalk", ink2: "Secondary", ink3: "Caption", red: "FITWAY red", redhi: "Bright red", ox: "Oxblood", obs: "Obsidian", live: "Live", delayed: "Delayed", amber: "Delayed text", stale: "Stale grey", err: "Error", field: "Field edge" },
      ratioOn: (r) => `${r}:1 on a card`,
      focusCaps: { ring: "One ring: 2 px at a 3 px offset", inset: "Inset: −4 px, for controls packed edge to edge" },
      iconCaps: { flow: "An icon in the flow, before its label", mirror: "Direction glyphs mirror in Arabic" },
      spacingCap: "The spacing scale", radiiNames: ["Surfaces", "Plates", "Controls", "Badges", "Flags"],
    },
  };
  let L = COPY[LANG];

  /* ------------------------------------------------------------ numbers and time */
  const clock = (m) => { const t = (360 + Math.round(m)) % 1440; const h = Math.floor(t / 60); return { h12: h % 12 || 12, mm: t % 60, pm: h >= 12 }; };
  const suf = (pm) => (LANG === "ar" ? (pm ? "م" : "ص") : pm ? "PM" : "AM");
  const time = (m) => { const c = clock(m); return `${c.h12}:${String(c.mm).padStart(2, "0")} ${suf(c.pm)}`; };
  const hourLabel = (m) => { const c = clock(m); return `${c.h12} ${suf(c.pm)}`; };
  // Ranges: a plain hyphen in Arabic, an en dash in English (DAT-3); times with a suffix are spaced.
  const timeRange = (a, z) => (LANG === "ar" ? `${time(a)} - ${time(z)}` : `${time(a)} – ${time(z)}`);
  const hourRange = (h) => {
    const a = clock((h - 6) * 60), z = clock((h - 5) * 60), dash = LANG === "ar" ? "-" : "–";
    return a.pm === z.pm ? `${a.h12}${dash}${z.h12} ${suf(z.pm)}` : `${a.h12} ${suf(a.pm)}${dash}${z.h12} ${suf(z.pm)}`;
  };

  /* ------------------------------------------------------------------ icons */
  const svg = (inner, cls = "cx-ico") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${inner}</svg>`;
  const P = {
    person: '<circle cx="12" cy="8.2" r="3.4"/><path d="M5.6 19.4a6.4 6.4 0 0 1 12.8 0"/>',
    peak: '<path d="M4 17.5 9.2 11l3.4 3.2L20 6.5"/><path d="M15.4 6.5H20v4.6"/>',
    entries: '<path d="M10 4.5H6.8a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H10"/><path d="M20 12h-9M14.2 8.8 11 12l3.2 3.2"/>',
    clock: '<circle cx="12" cy="12" r="8.2"/><path d="M12 7.6V12l3 2"/>',
    wow: '<path d="M4 16.5l5.2-5.2 3.6 3.6L20 7.7"/><path d="M14.6 7.7H20v5.4"/>',
    up: '<path d="M4 16.5l5.2-5.2 3.6 3.6L20 7.7"/><path d="M14.6 7.7H20v5.4"/>',
    down: '<path d="M4 7.5l5.2 5.2 3.6-3.6L20 16.3"/><path d="M14.6 16.3H20v-5.4"/>',
    same: '<path d="M5 9.5h14M5 14.5h14"/>',
    info: '<circle cx="12" cy="12" r="8.4"/><path d="M12 11v5.2M12 7.8v.2"/>',
    alert: '<circle cx="12" cy="12" r="8.4"/><path d="M12 7.6v5.4M12 16.2v.2"/>',
    gap: '<circle class="fill" cx="5" cy="12" r="1.3"/><circle class="fill" cx="9.7" cy="12" r="1.3"/><circle class="fill" cx="14.3" cy="12" r="1.3"/><circle class="fill" cx="19" cy="12" r="1.3"/>',
    sort: '<path d="M12 5.5v13M7.5 14l4.5 4.5 4.5-4.5"/>',
    file: '<path d="M7 3.8h6.6L18.5 8.7v10.1a1.4 1.4 0 0 1-1.4 1.4H7a1.4 1.4 0 0 1-1.4-1.4V5.2A1.4 1.4 0 0 1 7 3.8Z"/><path d="M13.4 3.8v5h5.1"/>',
    check: '<path d="M6.5 12.4l3.6 3.6 7.4-7.6"/>',
    save: '<path d="M12 4.5v10.2M7.8 10.6 12 14.8l4.2-4.2"/><path d="M5 16.5v1.4a1.6 1.6 0 0 0 1.6 1.6h10.8a1.6 1.6 0 0 0 1.6-1.6v-1.4"/>',
    close: '<path d="M7 7l10 10M17 7 7 17"/>',
    chevron: '<path d="M7 10l5 5 5-5"/>',
    next: '<path d="M10 7l5 5-5 5"/>',
    more: '<circle class="fill" cx="5.5" cy="12" r="1.6"/><circle class="fill" cx="12" cy="12" r="1.6"/><circle class="fill" cx="18.5" cy="12" r="1.6"/>',
    today: '<path d="M4.5 13.5a7.5 7.5 0 0 1 15 0"/><path d="M12 13.5 15.6 9.9"/><path d="M3.5 18h17"/><circle class="fill" cx="12" cy="13.5" r="1.3"/>',
    reports: '<path d="M4 19.5h16"/><path d="M7 16v-4.5M12 16V6.5M17 16v-7"/>',
    access: '<circle cx="8.2" cy="12" r="3.6"/><path d="M11.8 12h8.4M17.2 12v2.8M20.2 12v2"/>',
    activity: '<rect x="5" y="3.8" width="14" height="16.4" rx="3"/><path d="M8.6 8.6h6.8M8.6 12h6.8M8.6 15.4h4"/>',
    operations: '<path d="M4.5 7.5h9M17.5 7.5h2M4.5 16.5h2M10.5 16.5h9"/><circle cx="15.5" cy="7.5" r="2"/><circle cx="8.5" cy="16.5" r="2"/>',
    monitoring: '<rect x="3.6" y="4.6" width="16.8" height="11.4" rx="2.4"/><path d="M9 20h6M12 16v4"/>',
    settings: '<path d="M10.02 5.6 10.23 3.28A8.9 8.9 0 0 1 13.77 3.28L13.98 5.6A6.7 6.7 0 0 1 15.13 6.07L16.92 4.58A8.9 8.9 0 0 1 19.42 7.08L17.93 8.87A6.7 6.7 0 0 1 18.4 10.02L20.72 10.23A8.9 8.9 0 0 1 20.72 13.77L18.4 13.98A6.7 6.7 0 0 1 17.93 15.13L19.42 16.92A8.9 8.9 0 0 1 16.92 19.42L15.13 17.93A6.7 6.7 0 0 1 13.98 18.4L13.77 20.72A8.9 8.9 0 0 1 10.23 20.72L10.02 18.4A6.7 6.7 0 0 1 8.87 17.93L7.08 19.42A8.9 8.9 0 0 1 4.58 16.92L6.07 15.13A6.7 6.7 0 0 1 5.6 13.98L3.28 13.77A8.9 8.9 0 0 1 3.28 10.23L5.6 10.02A6.7 6.7 0 0 1 6.07 8.87L4.58 7.08A8.9 8.9 0 0 1 7.08 4.58L8.87 6.07A6.7 6.7 0 0 1 10.02 5.6Z"/><circle cx="12" cy="12" r="2.7"/>',
    signout: '<path d="M13.5 4.5H7.2a2.2 2.2 0 0 0-2.2 2.2v10.6a2.2 2.2 0 0 0 2.2 2.2h6.3"/><path d="M10.5 12h9M16.5 8.8 19.7 12l-3.2 3.2"/>',
  };
  const ico = (name, extra = "") => svg(P[name], `cx-ico${extra ? " " + extra : ""}`);
  // ICO-5: glyphs that show time or direction mirror in Arabic.
  const MIRROR = new Set(["peak", "entries", "wow", "up", "down", "signout"]);
  const icon = (name) => ico(name, MIRROR.has(name) ? "mirror" : "");
  const LOGO = `<svg viewBox="0 0 64 64" class="cx-brand-mk" aria-hidden="true" focusable="false"><path class="mk" d="M20.6 50.4A23 23 0 1 0 13.6 43.4" stroke-width="4.4"/><path class="mk" d="M24.2 20.8A13.6 13.6 0 1 1 26.4 44.2" stroke-width="4"/><path class="mk" d="M19.4 21.4 30.2 32.2 14.6 47.8" stroke-width="4.2" stroke-linejoin="miter" stroke-linecap="butt"/><circle class="mk-dot" cx="36" cy="28.2" r="4.2"/></svg>`;
  const LAMP = '<i class="lamp" aria-hidden="true"><i class="lamp-in"><i class="lamp-rim"></i></i></i>';

  /* ---------------------------------------------------------------- helpers */
  const prop = () => `<span class="cx-prop">${L.proposed}</span>`;
  const cap = (state, ids, proposed = false) => `<figcaption class="cx-cap"><b>${state}</b>${ids ? `<span>${b(ids)}</span>` : ""}${proposed ? prop() : ""}</figcaption>`;
  const fig = (inner, state, ids, proposed = false, live = false) => `<figure class="cx-fig"><div class="cx-spec"${live ? "" : " inert"}>${inner}</div>${cap(state, ids, proposed)}${live ? `<span class="cx-live-tag">${L.live}</span>` : ""}</figure>`;
  const section = (key, id, ids, body) => {
    const [t, d] = L.sec[key];
    return `<section class="cx-sec" id="${id}" aria-labelledby="${id}-t"><div class="cx-sec-head"><h2 id="${id}-t">${t}</h2><span class="cx-ids">${b(ids)}</span></div><p class="cx-sec-desc">${d}</p><div class="cx-sec-body">${body}</div></section>`;
  };
  const badge = (v, stale = false) => { const li = levelOf(v); return `<span class="cx-badge${stale ? " is-stale" : ""}"><span class="cx-bars" aria-hidden="true">${[0, 1, 2, 3].map((i) => `<i class="${i <= li ? "on" : ""}"></i>`).join("")}</span>${L.levels[li]}</span>`; };
  const cmpBadge = (k) => `<span class="cx-badge cmp ${k}">${icon(k === "busier" ? "up" : k === "quieter" ? "down" : "same")}${L.cmp[k]}</span>`;

  /* ------------------------------------------------------------ foundations */
  function foundations() {
    const sw = [
      ["page", "#070707", "#070707", ""], ["card", "#0F0E0F · 94%", "rgba(15,14,15,.94)", ""], ["panel", "#111011 · 98%", "rgba(17,16,17,.98)", ""], ["head", "#121112", "#121112", ""],
      ["line", "#FFF · 7.5%", "rgba(255,255,255,.075)", "1.14"], ["line2", "#FFF · 10%", "rgba(255,255,255,.10)", "1.28"], ["line3", "#FFF · 24%", "rgba(255,255,255,.24)", "2.10"], ["field", "#FFF · 34%", "rgba(255,255,255,.34)", "3.08"],
      ["ink", "#F5F3F2", "#F5F3F2", "17.47"], ["ink2", "#C9C3C4", "#C9C3C4", "11.12"], ["ink3", "#AAA4A6", "#AAA4A6", "7.89"], ["stale", "#8F898B", "#8F898B", "5.63"],
      ["red", "#E51935", "#E51935", ""], ["redhi", "#FF2946", "#FF2946", "5.21"], ["ox", "#4D0713", "#4D0713", ""], ["obs", "#08090A", "#08090A", ""],
      ["live", "#4BE29B", "#4BE29B", "11.64"], ["delayed", "#D9A400", "#D9A400", "8.52"], ["amber", "#E8B62E", "#E8B62E", "10.27"], ["err", "#FF6B7D", "#FF6B7D", "6.93"],
    ].map(([k, hex, css, r]) => `<div class="cx-sw"><i style="background:${css}"></i><b>${L.colourNames[k]}</b><span>${b(hex)}</span><span>${r ? L.ratioOn(r) : "&nbsp;"}</span></div>`).join("");
    const roles = [["display", "46 / 46 · 500", "var(--t-display)", "49"], ["title", "30 / 36 · 500", "var(--t-title)", L.title], ["heading", "19 / 28.5 · 500", "var(--t-heading)", L.chartTitle], ["body", "15 / 22.5 · 400", "var(--t-body)", L.typeSample], ["label", "13.5 / 20 · 400", "var(--t-label)", L.nowTitle], ["caption", "12 / 18 · 400", "var(--t-caption)", L.last7]];
    const type = roles.map(([r, m, f, s]) => `<div><span class="role">${b(r)}</span><span class="meta">${b(m)}</span><span class="sample" style="font:${f}">${s}</span></div>`).join("");
    const scale = [4, 8, 12, 16, 24, 32, 48, 72].map((s) => `<div><i style="--s:${s}px"></i>${b(s)}</div>`).join("");
    const radii = [24, 16, 12, 8, 4].map((r, i) => `<div><i style="border-radius:${r}px"></i><span>${b(r)} · ${L.radiiNames[i]}</span></div>`).join("");
    const iconsRow = `<span>${icon("person")}${L.nowTitle}</span><span>${icon("peak")}${L.peakTitle}</span><span>${icon("entries")}${L.entries}</span><span>${icon("clock")}${L.busiestTitle}</span><span>${icon("wow")}${L.wowTitle}</span>`;
    return section("found", "found", "COL · TYP · SPC · RAD · FOC · ICO", `
      <div class="card cx-stage"><p class="cx-stage-title">${L.f.colours}</p><div class="cx-swatches">${sw}</div></div>
      <div class="cx-row cx-row-2">
        <div class="card cx-stage"><p class="cx-stage-title">${L.f.type}</p><div class="cx-type">${type}</div></div>
        <div class="card cx-stage">
          <p class="cx-stage-title">${L.f.spacing}</p><div class="cx-scale">${scale}</div>
          <p class="cx-stage-title" style="margin-block-start:24px">${L.f.radii}</p><div class="cx-radii">${radii}</div>
        </div>
      </div>
      <div class="cx-row cx-row-2">
        <div class="card cx-stage"><p class="cx-stage-title">${L.f.focus}</p><div class="cx-grid" style="--min:180px">
          ${fig(`<button class="cx-btn is-focus" type="button">${L.cancel}</button>`, L.focusCaps.ring, "FOC-1")}
          ${fig(`<div class="cx-seg"><button class="cx-seg-b is-focus" type="button" aria-pressed="false">${L.seg["7d"]}</button><button class="cx-seg-b" type="button" aria-pressed="true">${L.seg["28d"]}</button></div>`, L.focusCaps.inset, "FOC-2")}
        </div></div>
        <div class="card cx-stage"><p class="cx-stage-title">${L.f.icons}</p><div class="cx-icons">${iconsRow}</div>
          <p class="cx-cap" style="margin-block-start:16px"><b>${L.iconCaps.mirror}</b><span>${b("ICO-5")}</span></p></div>
      </div>`);
  }

  /* ------------------------------------------------------------ cards */
  function statCard(o) {
    const head = `<div class="cx-stat-head">${icon(o.icon)}<h3 class="cx-stat-label">${o.label}</h3>${o.meta ? `<span class="cx-stat-meta${o.late ? " is-late" : ""}">${o.meta}</span>` : ""}</div>`;
    const body = o.empty
      ? `<p class="cx-stat-empty">${o.empty}</p>${o.emptyNote ? `<div class="cx-stat-foot"><span class="cx-note">${o.emptyNote}</span></div>` : ""}`
      : `<p class="cx-stat-value">${o.words ? `<span class="cx-words">${o.value}</span>` : `<bdi class="num">${o.value}</bdi>`}${o.unit ? `<span class="cx-unit">${o.unit}</span>` : ""}</p><div class="cx-stat-foot">${o.foot || ""}</div>`;
    return `<article class="card cx-stat${o.lit ? " lit lit-card" : ""}${o.stale ? " is-stale" : ""}">${o.lit ? LAMP : ""}${head}${body}</article>`;
  }
  function cards() {
    const latest = DATA.raw[NOW], lateV = DATA.raw[NOW - LATE];
    const c = [
      [statCard({ lit: true, icon: "person", label: L.nowTitle, meta: `<i class="cx-dot"></i>${b(time(NOW))}`, value: latest, unit: L.approx, foot: badge(latest) }), L.cards.live, "CRD-1 · CRD-6 · LVL-2", false],
      [statCard({ icon: "peak", label: L.peakTitle, meta: b(time(DATA.peakM)), value: DATA.peak, foot: badge(DATA.peak) }), L.cards.plain, "CRD-2 · DAT-5", false],
      [statCard({ stale: true, icon: "person", label: `${L.lastReading} ${b(time(NOW - LATE))}`, meta: `${ico("clock")}${L.ago(LATE)}`, late: true, value: lateV, unit: L.approx, foot: badge(lateV, true) }), L.cards.late, "LGT-7 · LVL-5", false],
      [statCard({ icon: "clock", label: L.busiestTitle, meta: L.last7, words: true, value: b(hourRange(18)), foot: `<span class="cx-note">${L.avgN(51)}</span>` }), L.cards.words, "TYP-3 · GLO-12", false],
      [statCard({ icon: "person", label: L.avgTitle, empty: L.noReadings }), L.cards.none, "CRD-3 · GLO-5", false],
      [statCard({ icon: "wow", label: L.wowTitle, meta: L.wowDates, empty: L.notEnough, emptyNote: L.needs }), L.cards.short, "CRD-3 · LGT-7", false],
    ];
    const figs = c.map(([h, s, ids, p]) => `<figure class="cx-fig" style="align-items:stretch">${h}${cap(s, ids, p)}</figure>`).join("");
    return section("card", "card", "CRD-1…8 · LGT-6…9 · LVL-2…6", `<div class="cx-row cx-row-3">${figs}</div><p class="cx-sec-desc" style="margin:0 8px">${L.undesigned}</p>`);
  }

  /* ------------------------------------------------------------ chart */
  function tipHTML(kind, state) {
    const hist = state !== "nohistory", last = state === "delayed" ? NOW - LATE : NOW, line = DATA.line[state === "delayed" ? "delayed" : "live"];
    const flag = (t) => `<span class="cx-flag">${t}</span>`;
    const usualRow = (m) => (hist ? `<div class="cx-tip-u"><i class="sw-usual" aria-hidden="true"></i><span>${L.usual} ${b(Math.round(usual(m)))}</span></div>` : "");
    const main = (v, stale) => `<div class="cx-tip-main${stale ? " is-stale" : ""}"><bdi class="cx-tip-v">${v}</bdi><span class="cx-tip-l">${L.levels[levelOf(v)]}</span></div>`;
    if (kind === "latest") return `<div class="cx-tip-t">${flag(L.latestFlag)}${b(time(last))}</div>${main(DATA.raw[last], state === "delayed")}${state === "delayed" ? `<div class="cx-tip-ago">${ico("clock")}<span>${L.ago(LATE)}</span></div>` : ""}${usualRow(last)}`;
    if (kind === "peak") return `<div class="cx-tip-t">${flag(L.peakTag)}${b(time(DATA.peakM))}</div>${main(DATA.peak)}${usualRow(DATA.peakM)}`;
    if (kind === "line") return `<div class="cx-tip-t">${b(time(LINE_STOP))}</div>${main(Math.round(line[LINE_STOP]))}${usualRow(LINE_STOP)}`;
    if (kind === "gap") return `<div class="cx-tip-t">${b(timeRange(GAP0, GAP1))}</div><div class="cx-tip-main"><span class="cx-tip-word">${L.noReadings}</span></div>`;
    return `<div class="cx-tip-t">${b(time(AHEAD_STOP))}</div><div class="cx-tip-main"><span class="cx-tip-word">${L.stillAhead}</span></div>${usualRow(AHEAD_STOP)}`;
  }
  const plotHost = (id, state, sel, h) => `<div class="cx-plot" id="${id}" data-state="${state}" data-sel="${sel}"${h ? ` style="--plot-h:${h}px"` : ""} aria-hidden="true"></div>`;
  function chart() {
    // Q1 (user 2026-10-01): a third entry names the ring, which marks a single reading.
    const legend = (hist) => `<ul class="cx-legend">${`<li><i class="sw-line"></i>${L.keyLine}</li>`}${hist ? `<li><i class="sw-usual"></i>${L.keyUsual}</li>` : `<li>${ico("info")}${L.noHistory}</li>`}<li><i class="sw-ring"></i>${L.keyPeak}</li></ul>`;
    const main = `<figure class="cx-fig" style="align-items:stretch"><section class="card lit lit-chart cx-chart" aria-label="${L.chartTitle}">${LAMP}
      <header class="cx-chart-head"><h3>${L.chartTitle}</h3><div class="cx-chart-tools">${legend(true)}<button class="cx-btn" type="button" tabindex="-1">${L.details}${ico("chevron")}</button></div></header>
      ${plotHost("plot-main", "live", "latest", 440)}</section>${cap(L.chartMain, "CHT-1…15 · CHT-18…20 · LGT-9", false)}</figure>`;
    const vars = [["peak", "live"], ["line", "live"], ["gap", "live"], ["ahead", "live"], ["latest", "delayed"], ["ahead", "nohistory"]].map(([sel, st], i) => {
      const title = st === "delayed" ? L.vars.delayed : st === "nohistory" ? L.vars.nohistory : L.vars[sel];
      const p = sel === "ahead" && st === "live";
      return `<figure class="cx-fig" style="align-items:stretch"><div class="card cx-var"><p class="cx-var-title">${title}</p>${plotHost(`plot-v${i}`, st, sel)}</div>${cap(p ? L.aheadNote : title, sel === "gap" ? "CHT-9 · CHT-14 · GLO-5" : st === "delayed" ? "CHT-8 · CHT-9 · STA-2" : p ? "CHT-4 · CHT-9 · CHT-14" : "CHT-9 · CHT-12 · CHT-14")}</figure>`;
    }).join("");
    return section("chart", "chart", "CHT-1…17", `${main}<div class="cx-row cx-row-3">${vars}</div>`);
  }
  // Draws one plot into its host: the lane, the scale, the line, the usual line, the marks, the tooltip and its connector.
  function drawPlot(host) {
    const state = host.dataset.state, sel = host.dataset.sel, id = host.id;
    const W = host.clientWidth, H = host.clientHeight;
    if (!W || !H) return;
    const hist = state !== "nohistory", delayed = state === "delayed", last = delayed ? NOW - LATE : NOW;
    const line = DATA.line[delayed ? "delayed" : "live"];
    // The lane: as tall as the tallest tooltip among this chart's stops; the width: the widest numbered one + 2, rounded up.
    const measure = document.createElement("div");
    measure.className = "cx-measure";
    const kinds = hist ? ["latest", "peak", "line", "ahead", "gap"] : ["latest", "peak", "line", "ahead", "gap"];
    measure.innerHTML = kinds.map((k) => `<div class="cx-tip" data-k="${k}">${tipHTML(k, state)}</div>`).join("");
    host.appendChild(measure);
    let laneH = 0, tipW = 0;
    for (const t of measure.children) { const r = t.getBoundingClientRect(); laneH = Math.max(laneH, r.height); if (t.dataset.k !== "gap") tipW = Math.max(tipW, r.width); }
    measure.remove();
    laneH = Math.ceil(laneH); tipW = Math.ceil(tipW + 2);
    const yLab = 30, xL = RTL ? 8 : yLab + 8, xR = RTL ? W - yLab - 8 : W - 8;
    const X = (m) => (RTL ? xR - (m / DAY) * (xR - xL) : xL + (m / DAY) * (xR - xL));
    const laneBottom = 2 + laneH, y80 = laneBottom + 8 + 9, yb = H - 28;
    const Y = (v) => yb - (v / 80) * (yb - y80);
    const f = (n) => n.toFixed(1);
    const path = (a, z, fn, step = 2) => { let d = ""; for (let m = a; m <= z; m += step) d += `${d ? "L" : "M"}${f(X(m))},${f(Y(fn(m)))}`; return d + `L${f(X(z))},${f(Y(fn(z)))}`; };
    const s = [];
    s.push(`<defs><linearGradient id="${id}-hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff2946" stop-opacity="0.46"/><stop offset="0.45" stop-color="#ff2946" stop-opacity="0.15"/><stop offset="1" stop-color="#ff2946" stop-opacity="0"/></linearGradient>
      <linearGradient id="${id}-sel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${delayed && sel === "latest" ? "#f5f3f2" : "#ff2946"}" stop-opacity="0.5"/><stop offset="1" stop-color="${delayed && sel === "latest" ? "#f5f3f2" : "#ff2946"}" stop-opacity="0.1"/></linearGradient>
      <radialGradient id="${id}-chalk"><stop offset="0" stop-color="#f5f3f2" stop-opacity="0.2"/><stop offset="1" stop-color="#f5f3f2" stop-opacity="0"/></radialGradient>
      <filter id="${id}-soft" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="1.4"/></filter></defs>`);
    [20, 40, 60, 80].forEach((v) => s.push(`<path d="M${f(xL)},${Math.round(Y(v)) + 0.5}H${f(xR)}" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>`));
    const by = Math.round(yb) + 0.5, g0 = Math.min(X(GAP0), X(GAP1)), g1 = Math.max(X(GAP0), X(GAP1));
    s.push(`<path d="M${f(xL)},${by}H${f(g0)}M${f(g1)},${by}H${f(xR)}" stroke="rgba(255,255,255,0.13)" stroke-width="1"/>`);
    const gapDots = []; for (let x = g0 + 2; x <= g1 - 1.5; x += 4) gapDots.push(x);
    const lit = sel === "gap";
    gapDots.forEach((x) => s.push(`<circle cx="${f(x)}" cy="${by}" r="${lit ? 1.25 : 1}" fill="${lit ? "#f5f3f2" : "rgba(245,243,242,0.62)"}"/>`));
    if (lit) s.push(`<ellipse cx="${f((g0 + g1) / 2)}" cy="${by}" rx="${f((g1 - g0) / 2 + 9)}" ry="7" fill="url(#${id}-chalk)"/>`);
    // Fine lines under today's line.
    const x0 = Math.min(X(0), X(last)), x1 = Math.max(X(0), X(last));
    for (let x = x0 + 2; x <= x1; x += 5) {
      const m = Math.round(RTL ? ((xR - x) / (xR - xL)) * DAY : ((x - xL) / (xR - xL)) * DAY);
      if (m < 0 || m > last || line[m] == null) continue;
      const top = Y(line[m]) + 3;
      if (yb - top > 1) s.push(`<rect x="${f(x)}" y="${f(top)}" width="1" height="${f(yb - top)}" fill="url(#${id}-hair)"/>`);
    }
    if (hist) {
      s.push(`<path d="${path(0, NOW, usual, 4)}" fill="none" stroke="rgba(245,243,242,0.55)" stroke-width="1.5" stroke-dasharray="3.5 4.5" stroke-linecap="round"/>`);
      s.push(`<path d="${path(NOW, DAY - 1, usual, 4)}" fill="none" stroke="rgba(245,243,242,0.36)" stroke-width="1.5" stroke-dasharray="3.5 4.5" stroke-linecap="round"/>`);
    }
    const ln = (m) => line[m];
    s.push(`<path d="${path(0, GAP0 - 1, ln)}" fill="none" stroke="#ff2946" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`);
    s.push(`<path d="${path(GAP1 + 1, last, ln)}" fill="none" stroke="#ff2946" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`);
    // The peak: its ring at the true reading, a dotted drop to the line, and its tag.
    const px = X(DATA.peakM), py = Y(DATA.peak), ly = Y(line[DATA.peakM]);
    if (ly - py > 14) s.push(`<path d="M${f(px)},${f(py + 7)}V${f(ly - 4)}" stroke="rgba(245,243,242,0.4)" stroke-width="1" stroke-dasharray="1.5 3" stroke-linecap="round"/>`);
    if (sel !== "peak") s.push(`<circle cx="${f(px)}" cy="${f(py)}" r="4.6" fill="#0f0e0f" stroke="#f5f3f2" stroke-width="2"/>`);
    // The end point: red with a halo while live, grey without one while delayed.
    const ex = X(last), ey = Y(line[last]);
    if (!delayed && sel !== "latest") s.push(`<circle cx="${f(ex)}" cy="${f(ey)}" r="9" fill="none" stroke="rgba(255,41,70,0.32)" stroke-width="1"/>`);
    s.push(`<circle cx="${f(ex)}" cy="${f(ey)}" r="4.4" fill="${delayed ? "#8f898b" : "#ff2946"}" stroke="#0f0e0f" stroke-width="2"/>`);
    // The selected stop.
    let mx = 0, my = 0, top = 0, style = "solid";
    const ring = (x, y, stale) => `${stale ? "" : `<circle cx="${f(x)}" cy="${f(y)}" r="6.5" fill="none" stroke="#ff2946" stroke-width="3.5" opacity="0.55" filter="url(#${id}-soft)"/>`}<circle cx="${f(x)}" cy="${f(y)}" r="6.5" fill="#0f0e0f" stroke="${stale ? "#8f898b" : "#ff2946"}" stroke-width="1.5"/>`;
    const hair = (x, y) => (yb - (y + 10) > 1 ? `<rect x="${f(x - 0.5)}" y="${f(y + 10)}" width="1" height="${f(yb - y - 10)}" fill="url(#${id}-sel)"/>` : "");
    if (sel === "latest" || sel === "line" || sel === "peak") {
      const m = sel === "latest" ? last : sel === "peak" ? DATA.peakM : LINE_STOP;
      mx = X(m); my = sel === "peak" ? py : sel === "latest" ? ey : Y(line[m]);
      s.push(hair(mx, my) + ring(mx, my, delayed && sel === "latest"));
      top = my - 7.25;
    } else if (sel === "ahead" && hist) {
      mx = X(AHEAD_STOP); my = Y(usual(AHEAD_STOP)); style = "dashed";
      s.push(`<path d="M${f(mx)},${f(my + 10)}V${f(yb)}" stroke="rgba(245,243,242,0.3)" stroke-width="1" stroke-dasharray="2 3"/><circle cx="${f(mx)}" cy="${f(my)}" r="6.5" fill="#0f0e0f" stroke="rgba(245,243,242,0.85)" stroke-width="1.25"/>`);
      top = my - 7.1;
    } else if (sel === "ahead") {
      mx = X(AHEAD_STOP); style = "dotted";
      s.push(`<path d="M${f(mx)},${f(yb - 3.5)}V${f(yb + 4.5)}" stroke="rgba(245,243,242,0.6)" stroke-width="1"/>`);
      top = yb - 3.5;
    } else if (sel === "gap") {
      // The dot nearest the span's middle; a plot too narrow for dots points at the middle itself (no NaN path).
      mx = gapDots.length ? gapDots.reduce((a, x) => (Math.abs(x - (g0 + g1) / 2) < Math.abs(a - (g0 + g1) / 2) ? x : a), gapDots[0]) : (g0 + g1) / 2; style = "dotted";
      top = by - 1.25;
    }
    // Labels: the scale at the inline start, the hours every two hours (no last tick at closing), the peak's tag.
    const lab = [];
    [0, 20, 40, 60, 80].forEach((v) => lab.push(`<span class="cx-ax" style="${RTL ? "right" : "left"}:0;top:${f(Y(v) - 9)}px;width:${yLab}px;text-align:${RTL ? "right" : "left"}">${b(v)}</span>`));
    for (let m = 0; m <= 1080; m += W < 700 ? 240 : 120) lab.push(`<span class="cx-ax" data-x="${f(X(m))}" style="left:${f(X(m))}px;top:${f(yb + 8)}px">${b(hourLabel(m))}</span>`);
    const tagTop = py - 12 - 20;
    lab.push(`<span class="cx-peak-tag" data-x="${f(px)}" style="left:${f(px)}px;top:${f(tagTop)}px">${L.peakTag} <b>${b(DATA.peak)}</b></span>`);
    // The tooltip, in the lane, centred on its stop and kept 2 px inside the plot.
    const tip = `<div class="cx-tip" style="--tip-w:${tipW}px">${tipHTML(sel, state)}</div>`;
    host.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${s.join("")}<g class="cx-conn"></g></svg><div class="cx-plot-labels">${lab.join("")}</div>${tip}`;
    // Centre the hour labels and the tag on their x now that they have a width.
    for (const el of host.querySelectorAll("[data-x]")) { const w = el.getBoundingClientRect().width; el.style.left = `${Math.max(0, Math.min(W - w, +el.dataset.x - w / 2))}px`; }
    const t = host.querySelector(".cx-tip"), tw = t.getBoundingClientRect().width, th = t.getBoundingClientRect().height;
    const left = Math.max(2, Math.min(W - 2 - tw, mx - tw / 2));
    t.style.transform = `translateX(${f(left)}px)`;
    // The connector: from the box to the mark, behind the data, ending in a small pointer whose tip touches the mark.
    const x = Math.round(mx) + 0.5, y0 = 2 + th, tipY = top, baseY = tipY - 4.2;
    const lineEnd = sel === "peak" ? Math.min(baseY, tagTop - 3) : baseY;
    const col = style === "dashed" ? "rgba(245,243,242,0.3)" : style === "dotted" ? "rgba(245,243,242,0.34)" : "rgba(245,243,242,0.36)";
    const dash = style === "dashed" ? ' stroke-dasharray="2 3"' : style === "dotted" ? ' stroke-dasharray="0.01 4" stroke-linecap="round"' : "";
    const conn = host.querySelector(".cx-conn");
    conn.innerHTML = (lineEnd > y0 + 1 ? `<path d="M${x},${f(y0)}V${f(lineEnd)}" stroke="${col}" stroke-width="${style === "dotted" ? 1.6 : 1}"${dash} fill="none"/>` : "") + `<path d="M${f(x - 2.7)},${f(baseY)}L${f(x + 2.7)},${f(baseY)}L${x},${f(tipY)}Z" fill="${col}"/>`;
    // The connector runs behind the data: move it to the start of the SVG.
    const svgEl = host.querySelector("svg");
    svgEl.insertBefore(conn, svgEl.children[1]);
  }

  /* ------------------------------------------------------------ pattern */
  const HOURS = Array.from({ length: 19 }, (_, i) => 6 + i);
  const RAMP = [[0, [29, 11, 14]], [8, [58, 10, 19]], [16, [77, 7, 19]], [28, [126, 13, 31]], [40, [184, 19, 43]], [52, [229, 25, 53]], [64, [255, 41, 70]]];
  function rampColor(v) {
    if (v >= 64) return RAMP[6][1];
    let i = 0;
    while (i < RAMP.length - 2 && v > RAMP[i + 1][0]) i++;
    const [a, ca] = RAMP[i], [z, cz] = RAMP[i + 1], k = Math.max(0, Math.min(1, (v - a) / (z - a)));
    return ca.map((c, j) => Math.round(c + (cz[j] - c) * k));
  }
  const FACT = [0.95, 1, 0.97, 0.95, 1.04, 0.86, 0.78];
  const heatVal = (r, h) => Math.max(1, Math.round((shape((h - 6) * 60 + 30) - 3) * FACT[r] + 2 + ((r * 7 + h * 3) % 5) - 2));
  function heatModel() {
    const rows = [];
    let top = { v: -1 };
    for (let r = 0; r < 7; r++) {
      const cells = [];
      for (let i = 0; i < HOURS.length; i++) {
        const h = HOURS[i];
        if (r === 5 && h >= 6 && h <= 13) { if (h === 6) cells.push({ kind: "closed", c0: i, c1: i + 7 }); continue; }
        if (r === 4 && h >= 10 && h <= 13) { if (h === 10) cells.push({ kind: "none", c0: i, c1: i + 3 }); continue; }
        if (r === 6 && h === 6) { cells.push({ kind: "zero", c0: i, c1: i, v: 0 }); continue; }
        // PAT-5: a single closed cell still says so (Saturday closes at midnight in this synthetic week).
        if (r === 6 && h === 24) { cells.push({ kind: "closed", c0: i, c1: i }); continue; }
        const few = r === 4 && (h === 14 || h === 15);
        const cell = { kind: few ? "few" : "v", c0: i, c1: i, v: heatVal(r, h), days: few ? 2 : 4 };
        if (!few && cell.v > top.v) top = { v: cell.v, r, i };
        cells.push(cell);
      }
      rows.push(cells);
    }
    rows[top.r].find((c) => c.c0 === top.i).top = true;
    return { rows, top };
  }
  function heatTable(model, { id, showN = false, onlyRows = null, grid = true }) {
    const head = `<thead><tr role="row"><th class="col-day" role="columnheader"><span class="sr-only">${L.cols.day}</span></th>${HOURS.map((h) => `<th class="cx-hh" scope="col" role="columnheader">${(h - 6) % 3 === 0 ? b(hourLabel((h - 6) * 60)) : `<span class="sr-only">${hourLabel((h - 6) * 60)}</span>`}</th>`).join("")}</tr></thead>`;
    const rowsIdx = onlyRows || [0, 1, 2, 3, 4, 5, 6];
    const body = rowsIdx.map((r) => `<tr role="row"><th class="cx-hd" scope="row" role="rowheader">${L.wd[r]}</th>${model.rows[r].map((c) => {
      const span = c.c1 - c.c0 + 1, base = `role="${grid ? "gridcell" : "cell"}"${grid ? ' tabindex="-1"' : ""} data-r="${r}" data-c0="${c.c0}" data-c1="${c.c1}"${span > 1 ? ` colspan="${span}"` : ""}`;
      if (c.kind === "closed") return `<td class="cx-hc closed" ${base}><span class="run">${L.closed}</span></td>`;
      if (c.kind === "none") return `<td class="cx-hc none" ${base}><span class="run">${L.noReadings}</span></td>`;
      if (c.kind === "zero") return `<td class="cx-hc zero" ${base}><span class="hv">0</span><span class="sr-only">, ${L.emptyLong}</span></td>`;
      return `<td class="cx-hc ${c.kind === "few" ? "few" : "v"}${c.top ? " is-top" : ""}" ${base} style="--c: rgb(${rampColor(c.v).join(" ")})"><span class="hv">${c.v}</span><span class="sr-only">, ${L.levels[levelOf(c.v)]}</span></td>`;
    }).join("")}</tr>`).join("");
    return `<table class="cx-heat${showN ? " show-n" : ""}" ${grid ? `role="grid" id="${id}" aria-labelledby="pattern-t" aria-describedby="pattern-sub pattern-keys"` : `role="table" aria-label="${L.numbersOn}"`}><colgroup><col class="col-day">${HOURS.map(() => "<col>").join("")}</colgroup>${head}<tbody>${body}</tbody></table>`;
  }
  function pattern() {
    const model = heatModel();
    const topCell = model.rows[model.top.r].find((c) => c.top);
    const sub = `${L.patternSub}<span class="sep" style="margin-inline:8px">·</span>${L.busiest(L.wd[model.top.r], b(hourRange(HOURS[topCell.c0])))}`;
    const key = `<ul class="cx-legend"><li>${L.fewer}<i class="ramp" aria-hidden="true"></i>${L.more}</li><li><i class="k k0" aria-hidden="true">0</i>${L.emptyWord}</li><li><i class="k kc" aria-hidden="true"></i>${L.closed}</li><li><i class="k kn" aria-hidden="true"></i>${L.noReadings}</li><li><i class="k kt" aria-hidden="true"></i>${L.busiestKey}</li><li><i class="k kf" aria-hidden="true"></i>${L.fewKey}</li></ul>`;
    const main = `<figure class="cx-fig" style="align-items:stretch"><section class="card lit lit-chart cx-pattern" aria-labelledby="pattern-t">${LAMP}
      <header class="cx-pattern-head"><div><h3 id="pattern-t">${L.patternTitle}</h3><p id="pattern-sub">${sub}</p></div>
        <div class="cx-pattern-tools">${key}<button class="cx-switch" id="numbers" type="button" role="switch" aria-checked="false"><span class="cx-track" aria-hidden="true"><span class="cx-thumb"></span></span><span>${L.numbers}</span></button></div></header>
      <div class="cx-heat-wrap" id="heat-wrap"><div class="cx-plate">${heatTable(model, { id: "heat" })}</div><div class="cx-tip cx-heat-tip" id="heat-tip" hidden></div></div>
      <p class="sr-only" id="pattern-keys">${L.heatKeys}</p></section>${cap(`${L.st.def} · ${L.st.focus}`, "PAT-1…10 · SRF-5 · TRU-2", false)}<span class="cx-live-tag">${L.live}</span></figure>`;
    const strip = `<figure class="cx-fig" style="align-items:stretch"><div class="card cx-stage" inert><div class="cx-plate">${heatTable(model, { showN: true, onlyRows: [2, 4], grid: false })}</div></div>${cap(L.numbersOn, "PAT-8", false)}</figure>`;
    return { html: section("pattern", "pattern", "PAT-1…11", main + strip), model };
  }
  function heatReadout(td) {
    const r = +td.dataset.r, c0 = +td.dataset.c0, c1 = +td.dataset.c1, h0 = HOURS[c0], h1 = HOURS[c1];
    const when = c0 === c1 ? hourRange(h0) : LANG === "ar" ? `${clock((h0 - 6) * 60).h12} ${suf(clock((h0 - 6) * 60).pm)} - ${clock((h1 - 5) * 60).h12} ${suf(clock((h1 - 5) * 60).pm)}` : `${hourLabel((h0 - 6) * 60)} – ${hourLabel((h1 - 5) * 60)}`;
    const t = `<div class="cx-tip-t">${L.wd[r]} · ${b(when)}</div>`;
    if (td.classList.contains("closed")) return `${t}<div class="cx-tip-main"><span class="cx-tip-word">${L.closed}</span></div><div class="cx-tip-u">${L.closedTip}</div>`;
    if (td.classList.contains("none")) return `${t}<div class="cx-tip-main"><span class="cx-tip-word">${L.noReadings}</span></div><div class="cx-tip-u">${L.noneTip}</div>`;
    if (td.classList.contains("zero")) return `${t}<div class="cx-tip-main"><bdi class="cx-tip-v">0</bdi><span class="cx-tip-l">${L.emptyLong}</span></div><div class="cx-tip-u">${L.avgOf(4)}</div>`;
    const v = +td.querySelector(".hv").textContent, few = td.classList.contains("few");
    return `${t}<div class="cx-tip-main"><bdi class="cx-tip-v">${v}</bdi><span class="cx-tip-l">${L.levels[levelOf(v)]}</span></div><div class="cx-tip-u">${L.avgOf(few ? 2 : 4)}</div>`;
  }
  function heatSelect(td, focus) {
    const table = $("#heat"), wrap = $("#heat-wrap"), tip = $("#heat-tip");
    if (!table || !td) return;
    for (const c of table.querySelectorAll(".cx-hc")) { c.classList.remove("is-sel"); c.tabIndex = -1; }
    td.classList.add("is-sel");
    td.tabIndex = 0;
    if (focus) td.focus();
    tip.innerHTML = heatReadout(td);
    tip.hidden = false;
    const wr = wrap.getBoundingClientRect(), cr = td.getBoundingClientRect(), tr = tip.getBoundingClientRect();
    const x = Math.max(0, Math.min(wr.width - tr.width, cr.left - wr.left + cr.width / 2 - tr.width / 2));
    const y = cr.top - wr.top - tr.height - 8;
    tip.style.transform = `translate(${x.toFixed(1)}px, ${Math.max(0, y).toFixed(1)}px)`;
  }
  function wireHeat() {
    const table = $("#heat");
    if (!table) return;
    const cells = () => [...table.querySelectorAll(".cx-hc")];
    const at = (r, col) => cells().find((c) => +c.dataset.r === r && +c.dataset.c0 <= col && +c.dataset.c1 >= col);
    table.addEventListener("pointerover", (e) => { const td = e.target.closest(".cx-hc"); if (td) heatSelect(td, false); });
    table.addEventListener("click", (e) => { const td = e.target.closest(".cx-hc"); if (td) heatSelect(td, true); });
    table.addEventListener("focusin", (e) => { const td = e.target.closest(".cx-hc"); if (td) heatSelect(td, false); });
    table.addEventListener("keydown", (e) => {
      const cur = table.querySelector(".cx-hc.is-sel") || cells()[0];
      const r = +cur.dataset.r, c0 = +cur.dataset.c0, c1 = +cur.dataset.c1;
      const later = RTL ? "ArrowLeft" : "ArrowRight", earlier = RTL ? "ArrowRight" : "ArrowLeft";
      let next = null;
      if (e.key === later) next = at(r, Math.min(HOURS.length - 1, c1 + 1));
      else if (e.key === earlier) next = at(r, Math.max(0, c0 - 1));
      else if (e.key === "ArrowUp") next = at(Math.max(0, r - 1), c0);
      else if (e.key === "ArrowDown") next = at(Math.min(6, r + 1), c0);
      else if (e.key === "Home") next = at(r, 0);
      else if (e.key === "End") next = at(r, HOURS.length - 1);
      else if (e.key === "Escape") { $("#heat-tip").hidden = true; cur.classList.remove("is-sel"); return; }
      else return;
      e.preventDefault();
      if (next) heatSelect(next, true);
    });
    const sw = $("#numbers");
    sw.addEventListener("click", () => {
      const on = sw.getAttribute("aria-checked") !== "true";
      sw.setAttribute("aria-checked", String(on));
      table.classList.toggle("show-n", on);
    });
    // The resting selection: Tuesday 7-8 PM.
    heatSelect(at(2, HOURS.indexOf(19)), false);
  }

  /* ------------------------------------------------------------ table */
  function tables() {
    const days = [["الثلاثاء", "Tue", 22, 53, 1123, 25, 352, ""], ["الاثنين", "Mon", 21, 58, 1145, 27, 371, "hover"], ["الأحد", "Sun", 20, 55, 1110, 26, 360, "edge"], ["السبت", "Sat", 19, 41, 680, 18, 244, ""], ["الجمعة", "Fri", 18, 49, 1210, 20, 230, ""], ["الخميس", "Thu", 17, 76, 1138, 24, 318, "top"], ["الأربعاء", "Wed", 16, 57, 1111, 26, 349, ""]];
    // TBL-8: the weekday and the date are separate spans, so a phone can set the weekday over the date.
    const dayName = (d) => (LANG === "ar" ? `<span class="wd">${d[0]}</span> <span class="dt">${b(d[2])} سبتمبر</span>` : `<span class="wd">${d[1]}</span> <span class="dt">${d[2]} Sep</span>`);
    // The no-readings note: the range first (DAT-3), then the dotted mark and the words (user 2026-10-01, option د).
    // A line may break only between the range and the mark; the mark stays with the words; neither part breaks inside.
    const gapNote = (w, r) => `<span class="cx-gapnote"><bdi class="rg">${r}</bdi> <span class="mw">${ico("gap")}<span class="w">${w}</span></span></span>`;
    // TBL-12 (user 2026-09-30): a row with no readings is one cell across every column, a break in the sequence rather
    // than a row of values: no row header, no empty value cells, no words under a numeric column.
    const noneRow = (w, r, cols) => `<tr role="row" class="is-none"><td role="cell" class="none" colspan="${cols}">${gapNote(w, r)}</td></tr>`;
    const hdr = (k, cls) => `<th scope="col" role="columnheader" class="${cls}"${cls.includes("is-sorted") ? ' aria-sort="descending"' : ""}><button class="cx-sort${cls.includes("hover") ? " is-hover" : ""}${cls.includes("focus") ? " is-focus" : ""}" type="button" tabindex="-1"><span>${L.cols[k]}</span>${ico("sort")}</button></th>`;
    const rows = days.map((d) => {
      const top = d[7] === "top";
      const minutes = d[4] - 360;
      const cls = [d[7] === "hover" ? "is-hover" : "", d[7] === "edge" ? "wk-edge" : "", top ? "is-top has-note" : ""].filter(Boolean).join(" ");
      // TBL-11: a composite cell leads with the value at the numbers' edge; its time, then its flag, follow it.
      return `<tr role="row"${cls ? ` class="${cls}"` : ""}><th scope="row" role="rowheader">${dayName(d)}</th>
        <td role="cell" class="n"><span class="cx-pk"><span class="pv">${b(d[3])}</span><span class="pt">${b(time(minutes))}</span>${top ? `<span class="cx-flag is-red">${L.highest}</span>` : ""}</span></td>
        <td role="cell" class="n">${b(d[5])}</td><td role="cell" class="n">${b(d[6])}</td>
        <td role="cell" class="notes">${top ? gapNote(L.noReadings, L.gapRange) : ""}</td></tr>` +
        // TBL-8: on a phone the notes column folds into a row of its own under its day (only one of the two shows).
        (top ? `<tr role="row" class="note-row is-top"><td role="cell" colspan="4">${gapNote(L.noReadings, L.gapRange)}</td></tr>` : "");
    }).join("") + noneRow(L.noReadingsYet, L.beforeRow, 5);
    const def = `<table class="cx-table" role="table"><caption>${L.daysCaption}</caption><thead><tr role="row">${hdr("day", "is-sorted")}${hdr("peak", "n hover")}${hdr("avg", "n focus")}${hdr("entries", "n")}<th scope="col" role="columnheader" class="notes">${L.cols.notes}</th></tr></thead><tbody>${rows}</tbody></table>`;
    const line = DATA.line.live;
    const mins = [[490, ""], [491, ""], [492, ""], [493, ""], ["gap", ""], [512, ""], [DATA.peakM, "peak"], [NOW, "latest"]];
    const crow = mins.map(([m, n]) => {
      // TBL-12: the gap is one row across the table, from the time column's text edge.
      if (m === "gap") return noneRow(L.noReadings, timeRange(GAP0, GAP1), 4);
      const cls = [n === "peak" ? "is-top" : "", n ? "has-note" : ""].filter(Boolean).join(" ");
      return `<tr role="row"${cls ? ` class="${cls}"` : ""}><th scope="row" role="rowheader">${b(time(m))}</th><td role="cell" class="n">${b(DATA.raw[m])}</td><td role="cell" class="n">${b(Math.round(line[m]))}</td><td role="cell" class="notes">${n ? L.cnotes[n] : ""}</td></tr>` +
        (n ? `<tr role="row" class="note-row${n === "peak" ? " is-top" : ""}"><td role="cell" colspan="3">${L.cnotes[n]}</td></tr>` : "");
    }).join("");
    const compact = `<table class="cx-table is-compact" role="table"><caption>${L.compactCaption}</caption><thead><tr role="row"><th scope="col" role="columnheader">${L.ccols.time}</th><th scope="col" role="columnheader" class="n">${L.ccols.inside}</th><th scope="col" role="columnheader" class="n">${L.ccols.avg}</th><th scope="col" role="columnheader" class="notes">${L.ccols.note}</th></tr></thead><tbody>${crow}</tbody></table>`;
    return section("table", "table", "TBL-1…13", `<div class="cx-row cx-row-tables">
      <figure class="cx-fig" style="align-items:stretch"><div class="card cx-table-card" inert><div class="cx-table-head"><div><h3>${L.daysTitle}</h3><p>${L.daysSub}</p></div></div>${def}</div>${cap(`${L.dens.def} · ${L.st.hover} · ${L.st.focus} · ${L.sortedBy}`, "TBL-1 · TBL-2 · TBL-4…6 · TBL-11 · TBL-12", false)}</figure>
      <figure class="cx-fig" style="align-items:stretch"><div class="card cx-table-card" inert><div class="cx-table-head"><div><h3>${L.compactTitle}</h3></div></div>${compact}</div>${cap(L.dens.compact, "TBL-3 · TBL-12 · NUM-5", false)}</figure></div>`);
  }

  /* ------------------------------------------------------------ controls */
  function buttons() {
    const sec = (cls, label, iconName = "") => `<button class="cx-btn ${cls}" type="button">${iconName ? ico(iconName) : ""}${label}</button>`;
    const items = [
      [sec("", L.cancel), `${L.st.def}`, "BTN-2"], [sec("is-hover", L.cancel), L.st.hover, "BTN-2"], [sec("is-focus", L.cancel), L.st.focus, "FOC-1"], [`<button class="cx-btn" type="button" disabled>${L.cancel}</button>`, L.st.disabled, "BTN-4"],
      [sec("", L.save, "save"), `${L.st.def} · ${b("17 px")}`, "BTN-1"],
      [sec("primary", L.apply), L.st.def, "BTN-3"], [sec("primary is-hover", L.apply), L.st.hover, "BTN-3"], [sec("primary is-focus", L.apply), L.st.focus, "FOC-1"], [`<button class="cx-btn primary" type="button" disabled>${L.apply}</button>`, L.st.disabled, "BTN-4"], [`<button class="cx-btn primary" type="button" disabled aria-busy="true">${L.working}</button>`, L.st.working, "STA-9"],
      [`<button class="cx-icon-btn" type="button" aria-label="${L.close}">${ico("close")}</button>`, L.st.def, "BTN-5"], [`<button class="cx-icon-btn is-hover" type="button" aria-label="${L.close}">${ico("close")}</button>`, L.st.hover, "BTN-5"], [`<button class="cx-icon-btn is-focus" type="button" aria-label="${L.close}">${ico("close")}</button>`, L.st.focus, "FOC-1"],
    ];
    return section("buttons", "buttons", "BTN-1…8", `<div class="card cx-stage"><div class="cx-grid" style="--min:170px">${items.map(([h, s, id]) => fig(h, s, id)).join("")}</div></div>`);
  }
  const seg = (pressed, extra = {}, cls = "") => `<div class="cx-seg ${cls}" role="group" aria-label="${L.segName}">${["7d", "28d", "custom"].map((k) => `<button class="cx-seg-b${extra[k] ? " " + extra[k] : ""}" type="button" aria-pressed="${k === pressed}"${k === "custom" ? ' aria-haspopup="dialog"' : ""}>${L.seg[k]}</button>`).join("")}</div>`;
  function segs() {
    return section("seg", "seg", "SEG-1…5", `<div class="card cx-stage"><div class="cx-grid" style="--min:320px">
      ${fig(seg("28d"), `${L.st.def} · ${L.st.pressed}`, "SEG-2 · SEG-3")}
      ${fig(seg("28d", { "7d": "is-hover" }), L.st.hover, "SEG-3")}
      ${fig(seg("28d", { custom: "is-focus" }), `${L.st.focus} · ${L.st.inset}`, "FOC-2")}
      ${fig(`<div class="cx-phone">${seg("7d", {}, "is-full")}</div>`, L.st.phone, "SEG-4", false)}
    </div></div>`);
  }
  const switchEl = (on, cls = "") => `<button class="cx-switch ${cls}" type="button" role="switch" aria-checked="${on}"><span class="cx-track" aria-hidden="true"><span class="cx-thumb"></span></span><span>${L.numbers}</span></button>`;
  function switches() {
    return section("sw", "switch", "SWI-1…4", `<div class="card cx-stage"><div class="cx-grid" style="--min:170px">
      ${fig(switchEl(false), L.st.off, "SWI-2")}${fig(switchEl(false, "is-hover"), L.st.hover, "SWI-3")}${fig(switchEl(false, "is-focus"), L.st.focus, "FOC-1")}${fig(switchEl(true), L.st.on, "SWI-2")}
    </div></div>`);
  }
  let fieldN = 0;
  const field = ({ label, value = "", cls = "", inputCls = "", err = "", hint = true, disabled = false }) => {
    const id = `fld-${++fieldN}`;
    return `<div class="cx-field ${cls}"><label class="cx-field-label" for="${id}">${label}</label><input class="cx-input ${inputCls}" id="${id}" type="text" inputmode="numeric" autocomplete="off" dir="ltr" value="${value}"${disabled ? " disabled" : ""}${err ? ` aria-invalid="true" aria-describedby="${id}-e"` : hint ? ` aria-describedby="${id}-h"` : ""}>${err ? `<p class="cx-err" id="${id}-e">${ico("alert")}<span>${err}</span></p>` : hint ? `<p class="cx-hint" id="${id}-h">${L.hint}</p>` : ""}</div>`;
  };
  function fields() {
    return section("field", "field", "FLD-1…7", `<div class="card cx-stage"><div class="cx-grid" style="--min:220px">
      ${fig(field({ label: L.from }), L.st.def, "FLD-1 · FLD-2")}
      ${fig(field({ label: L.from, value: "26/08/2026" }), L.st.filled, "FLD-1")}
      ${fig(field({ label: L.from, value: "26/08/2026", inputCls: "is-hover" }), L.st.hover, "FLD-3")}
      ${fig(field({ label: L.from, value: "26/08/2026", inputCls: "is-focus" }), L.st.focus, "FLD-3 · FOC-1")}
      ${fig(field({ label: L.to, value: "10/08/2026", cls: "is-invalid", err: L.errOrder }), L.st.invalid, "FLD-4")}
      ${fig(field({ label: L.from, value: "26/08/2026", cls: "is-disabled", disabled: true, hint: false }), L.st.disabled, "FLD-5")}
    </div></div>`);
  }

  /* ------------------------------------------------------------ dialogs */
  const fileLine = () => `<p class="cx-file">${ico("file")}<span class="cx-file-name" dir="ltr">fitway-minutes-2026-08-26-to-2026-09-22.csv</span><span class="cx-file-rows">${L.rows}</span></p>`;
  const panelHead = (title, id) => `<header class="cx-panel-head"><h3${id ? ` id="${id}"` : ""}>${title}</h3><button class="cx-icon-btn" type="button" aria-label="${L.close}">${ico("close")}</button></header>`;
  function dialogs() {
    const ready = `<div class="cx-panel">${panelHead(L.rangeTitle)}<div class="cx-panel-body"><p class="cx-panel-desc">${L.rangeDesc}</p><div class="cx-field-row">${field({ label: L.from, value: "26/08/2026", inputCls: "is-focus", hint: false })}${field({ label: L.to, value: "22/09/2026", hint: false })}</div><p class="cx-hint">${L.hint}</p></div><footer class="cx-panel-foot"><button class="cx-btn" type="button">${L.cancel}</button><button class="cx-btn primary" type="button">${L.apply}</button></footer></div>`;
    const working = `<div class="cx-panel" aria-busy="true">${panelHead(L.exportTitle)}<div class="cx-panel-body"><p class="cx-panel-desc">${L.exportDesc}</p><div class="cx-field-row">${field({ label: L.from, value: "26/08/2026", cls: "is-disabled", disabled: true, hint: false })}${field({ label: L.to, value: "22/09/2026", cls: "is-disabled", disabled: true, hint: false })}</div><div class="cx-progress" role="status"><p>${L.progress}</p><span aria-hidden="true"><i></i></span></div></div><footer class="cx-panel-foot"><button class="cx-btn is-focus" type="button">${L.cancel}</button><button class="cx-btn primary" type="button" disabled aria-busy="true">${L.working}</button></footer></div>`;
    const failed = `<div class="cx-panel">${panelHead(L.exportTitle)}<div class="cx-panel-body"><p class="cx-panel-desc">${L.exportDesc}</p>${fileLine()}<div class="cx-alert" role="alert">${ico("alert")}<span>${L.failed}</span></div></div><footer class="cx-panel-foot"><button class="cx-btn" type="button">${L.cancel}</button><button class="cx-btn primary is-focus" type="button">${L.retry}</button></footer></div>`;
    const done = `<div class="cx-panel">${panelHead(L.exportTitle)}<div class="cx-panel-body"><div class="cx-done"><span class="cx-done-mark" aria-hidden="true">${ico("check")}</span><p class="cx-done-title">${L.ready}</p>${fileLine()}</div></div><footer class="cx-panel-foot"><button class="cx-btn" type="button">${L.done}</button><button class="cx-btn primary is-focus" type="button">${ico("save")}${L.save}</button></footer></div>`;
    const sheet = `<div class="cx-frame"><div class="cx-frame-page" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="cx-scrim"></div><div class="cx-panel">${panelHead(L.rangeTitle)}<div class="cx-panel-body"><p class="cx-panel-desc">${L.rangeDesc}</p><div class="cx-field-row">${field({ label: L.from, value: "26/08/2026", hint: false })}${field({ label: L.to, value: "22/09/2026", hint: false })}</div><p class="cx-hint">${L.hint}</p></div><footer class="cx-panel-foot"><button class="cx-btn" type="button">${L.cancel}</button><button class="cx-btn primary" type="button">${L.apply}</button></footer></div></div>`;
    return section("dialog", "dialog", "DLG-1…6 · EMP-2 · EMP-3", `<div class="cx-row" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto">
      <div class="cx-row" style="gap:24px">${fig(ready, L.dlgStates.ready, "DLG-2 · DLG-3")}${fig(failed, L.dlgStates.failed, "DLG-4 · EMP-2 · EMP-3")}</div>
      <div class="cx-row" style="gap:24px">${fig(working, L.dlgStates.working, "DLG-4 · STA-9")}${fig(done, L.dlgStates.done, "DLG-4")}</div>
      <div class="cx-row" style="gap:24px;align-content:start">${fig(sheet, L.dlgStates.sheet, "DLG-5")}
        <figure class="cx-fig"><button class="cx-btn" type="button" id="open-dlg" aria-haspopup="dialog">${L.openDlg}</button><span class="cx-live-tag">${L.live}</span></figure></div>
    </div>`);
  }
  function liveDialogForm() {
    return `${panelHead(L.rangeTitle, "cx-dlg-title").replace('type="button"', 'type="button" data-close')}<div class="cx-panel-body"><p class="cx-panel-desc" id="cx-dlg-desc">${L.rangeDesc}</p><div class="cx-field-row" id="cx-dlg-fields">${field({ label: L.from, value: "26/08/2026", hint: false })}${field({ label: L.to, value: "22/09/2026", hint: false })}</div><p class="cx-hint">${L.hint}</p></div><footer class="cx-panel-foot"><button class="cx-btn" type="button" data-close>${L.cancel}</button><button class="cx-btn primary" type="submit">${L.apply}</button></footer>`;
  }
  let opener = null;
  function wireDialog() {
    const dlg = $("#cx-dlg"), form = $("#cx-dlg-form"), btn = $("#open-dlg");
    if (!dlg || !btn) return;
    btn.addEventListener("click", () => {
      opener = btn;
      form.innerHTML = liveDialogForm();
      dlg.showModal();
      const first = form.querySelector(".cx-input");
      if (first) first.focus();
    });
  }
  function wireDialogOnce() {
    const dlg = $("#cx-dlg"), form = $("#cx-dlg-form");
    dlg.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) dlg.close(); });
    dlg.addEventListener("close", () => { if (opener && opener.isConnected) opener.focus(); });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const re = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
      let firstBad = null;
      for (const wrap of form.querySelectorAll(".cx-field")) {
        const input = wrap.querySelector(".cx-input"), v = input.value.trim();
        const msg = !v ? L.errRequired : re.test(v) ? "" : L.errFormat;
        wrap.classList.toggle("is-invalid", Boolean(msg));
        wrap.querySelector(".cx-err")?.remove();
        if (msg) {
          const p = document.createElement("p");
          p.className = "cx-err"; p.id = input.id + "-e"; p.innerHTML = `${ico("alert")}<span>${msg}</span>`;
          wrap.appendChild(p);
          input.setAttribute("aria-invalid", "true"); input.setAttribute("aria-describedby", p.id);
          firstBad = firstBad || input;
        } else { input.removeAttribute("aria-invalid"); input.removeAttribute("aria-describedby"); }
      }
      if (firstBad) firstBad.focus(); else dlg.close();
    });
  }

  /* ------------------------------------------------------------ chips */
  function chips() {
    const lv = [10, 30, 55, 72].map((v) => badge(v)).join(" ");
    return section("chips", "chips", "CHP-1…9 · LVL-2…6", `<div class="card cx-stage"><div class="cx-grid" style="--min:280px">
      ${fig(`<div style="display:flex;gap:8px;flex-wrap:wrap">${lv}</div>`, L.chipCaps.levels, "CHP-4 · CHP-5 · LVL-2")}
      ${fig(badge(46, true), L.chipCaps.stale, "LVL-5 · LVL-6")}
      ${fig(`<div style="display:flex;gap:8px;flex-wrap:wrap">${cmpBadge("busier")}${cmpBadge("quieter")}${cmpBadge("same")}</div>`, L.chipCaps.cmp, "CHP-6 · ICO-5")}
      ${fig(`<div style="display:flex;gap:8px;flex-wrap:wrap"><span class="cx-flag">${L.peakTag}</span><span class="cx-flag">${L.latestFlag}</span><span class="cx-flag is-red">${L.highest}</span></div>`, L.chipCaps.flags, "CHP-7 · CHP-8")}
      ${fig(`<div style="display:grid;gap:12px"><span class="cx-status"><i class="cx-dot"></i>${L.statusLive}</span><span class="cx-status is-late">${ico("clock")}${L.statusLate}</span></div>`, L.chipCaps.status, "CHP-2 · STA-1 · STA-2")}
      ${fig(`<button class="cx-btn" type="button"><i class="cx-dot"></i><span class="cx-status">${L.statusLive}</span></button>`, L.chipCaps.statusBtn, "CHP-1 · CHP-2")}
      ${fig(`<span class="cx-concept">${L.concept}</span>`, L.chipCaps.concept, "CHP-2 · GLO-15")}
      ${fig(`<ul class="cx-legend"><li><i class="sw-line"></i>${L.keyLine}</li><li><i class="sw-usual"></i>${L.keyUsual}</li><li><i class="sw-ring"></i>${L.keyPeak}</li></ul>`, L.chipCaps.legend, "CHP-3 · Q1", false)}
    </div></div>`);
  }

  /* ------------------------------------------------------------ rail and header */
  // The order everywhere (user 2026-10-01): Today, Reports, Activity log, Access, then the rest.
  const NAV = [["today", "today"], ["reports", "reports"], ["activity", "activity"], ["access", "access"], ["operations", "operations"]];
  const FOOT = [["monitoring", "monitoring"], ["lang", null], ["settings", "settings"], ["signout", "signout"]];
  function rail({ open = false, forced = {}, live = false }) {
    const item = (k, iconName) => {
      const name = L.nav[k], cur = k === "today", f = forced[k] || "";
      const glyph = iconName ? svg(P[iconName], k === "signout" ? "mirror" : "") : `<span class="cx-glyph">${LANG === "ar" ? "EN" : "AR"}</span>`;
      return `<li><button class="cx-ri${f ? " " + f : ""}" type="button"${cur ? ' aria-current="page"' : ""}${open ? "" : ` aria-label="${name}"`}${live ? "" : ' tabindex="-1"'}><span class="cx-tile">${glyph}</span><span class="cx-rn"${k === "lang" ? ` lang="${LANG === "ar" ? "en" : "ar"}"` : ""}>${name}</span>${open ? "" : `<span class="cx-rtip" aria-hidden="true">${name}</span>`}</button></li>`;
    };
    const bf = forced.brand || "";
    return `<nav class="cx-rail${open ? " is-open" : ""}" aria-label="${L.railLabel}"><div class="brand"><button class="cx-ri${bf ? " " + bf : ""}" type="button" aria-label="${L.brand}"${live ? "" : ' tabindex="-1"'}><span class="cx-tile brand">${LOGO}</span><span class="cx-rn wordmark" lang="en">FITWAY</span>${open ? "" : `<span class="cx-rtip" aria-hidden="true">${L.railTip}</span>`}</button></div>
      <ul>${NAV.map(([k, i]) => item(k, i)).join("")}</ul><ul class="foot">${FOOT.map(([k, i]) => item(k, i)).join("")}</ul></nav>`;
  }
  function rails() {
    const hdr = `<div class="cx-header-spec" style="border:1px solid var(--line);border-radius:24px;background:#070707"><div class="cx-hdr"><div><h3>${L.hdrTitle}</h3><p>${L.hdrSub}</p></div><div class="cx-hdr-end"><span class="cx-concept">${L.concept}</span>${seg("28d")}</div></div></div>`;
    // RAI-6: the tablet's open rail over SRF-4's scrim, with two plain cards standing for the page behind it.
    const tablet = `<div class="cx-tablet"><div class="cx-tablet-page"><i class="card lit lit-card">${LAMP}</i><i class="card"></i><i class="card is-wide lit lit-chart">${LAMP}</i></div><i class="cx-scrim-spec"></i>${rail({ open: true })}</div>`;
    return section("rail", "rail", "RAI-1…8 · HDR-1…2 · FOC-4…5", `<div class="card cx-stage"><div class="cx-rails">
      <figure class="cx-fig" style="flex:0 0 260px"><div class="cx-spec" inert>${rail({ forced: { reports: "is-hover", access: "is-focus" } })}</div>${cap(L.railCaps.states, "RAI-2 · FOC-4 · FOC-5")}</figure>
      <figure class="cx-fig" style="flex:0 0 260px"><div class="cx-spec" inert>${rail({ forced: { brand: "is-focus" } })}</div>${cap(L.railCaps.brand, "RAI-8 · FOC-5")}</figure>
      <figure class="cx-fig" style="flex:0 0 260px"><div class="cx-spec">${rail({ live: true })}</div>${cap(L.railCaps.live, "FOC-4")}<span class="cx-live-tag">${L.live}</span></figure>
      <figure class="cx-fig" style="flex:0 0 260px"><div class="cx-spec" inert>${rail({ open: true })}</div>${cap(L.railCaps.open, "RAI-3 · RAI-7 · GLO-14", false)}</figure>
      <figure class="cx-fig" style="flex:0 0 420px"><div class="cx-spec" inert>${tablet}</div>${cap(L.railCaps.tablet, "RAI-6 · BRK-3 · SRF-4")}</figure>
    </div></div>
    <figure class="cx-fig" style="align-items:stretch"><div class="cx-spec" inert>${hdr}</div>${cap(L.hdrCap, "HDR-1 · HDR-2 · CHP-2")}</figure>`);
  }

  /* ------------------------------------------------------------ the phone's frame (step 3) */
  // The page's own classes (style.css "the frame"), so a specimen is the page's form; components.css only places them.
  const TABS = ["today", "reports", "activity", "access", "settings"];
  const bar = (forced = {}) => `<nav class="tabbar" aria-label="${L.railLabel}"><ul>${TABS.map((k) => `<li><a class="tb-item${forced[k] ? " " + forced[k] : ""}" href="#frame" tabindex="-1"${k === "today" ? ' aria-current="page"' : ""} aria-label="${L.nav[k]}"><span class="tb-tile">${svg(P[k], "")}</span><span class="tb-name">${L.tabs[k]}</span></a></li>`).join("")}</ul></nav>`;
  const stateMark = (late) => (late ? svg(P.clock, "ico") : '<span class="dot" aria-hidden="true"></span>');
  const hbadge = (late, open, live) => `<button class="hbadge${late ? " is-delayed" : ""}" type="button"${live ? ' data-layer="ops"' : ' tabindex="-1"'} aria-expanded="${open}" aria-haspopup="dialog" aria-label="${L.opsTitle}: ${late ? L.delayedWord : L.liveWord}"><span class="hb-state">${stateMark(late)}<span class="hb-word">${late ? L.delayedWord : L.liveWord}</span></span>${svg(P.chevron, "hb-chev")}</button>`;
  const hmenu = (open, live) => `<button class="hbtn" type="button"${live ? ' data-layer="menu"' : ' tabindex="-1"'} aria-expanded="${open}" aria-haspopup="menu" aria-label="${L.more}">${svg(P.more, "")}</button>`;
  const opsPop = (late, open) => `<div class="fw-pop ops-pop" role="dialog" aria-label="${L.opsTitle}" tabindex="-1"${open ? "" : " hidden"} data-pop="ops"><div class="ops-body"><h4 class="ops-title">${L.opsTitle}</h4><p class="ops-state${late ? " is-delayed" : ""}">${stateMark(late)}<span>${late ? L.delayedWord : L.liveWord}</span></p><p class="ops-line">${L.lastAt(L.pm(late ? "7:29" : "7:42"))}${late ? `<span class="sep" aria-hidden="true">·</span><span class="ops-ago">${L.ago(13)}</span>` : ""}</p><p class="ops-line">${L.hours}</p></div><div class="ops-foot"><a class="fw-mi" href="#frame" tabindex="-1">${svg(P.operations, "")}<span>${L.nav.operations}</span>${svg(P.next, "fw-mi-end mirror")}</a></div></div>`;
  // The menu (user 2026-10-01): Monitoring, then the language, then sign out.
  const menuPop = (open, focus) => `<div class="fw-pop menu-pop" role="menu" aria-label="${L.more}"${open ? "" : " hidden"} data-pop="menu"><a class="fw-mi${focus ? " is-focus" : ""}" role="menuitem" tabindex="-1" href="#frame">${svg(P.monitoring, "")}<span>${L.nav.monitoring}</span></a><a class="fw-mi" role="menuitem" tabindex="-1" href="#frame"><span class="fw-glyph" lang="en" aria-hidden="true">${LANG === "ar" ? "EN" : "AR"}</span><span lang="${LANG === "ar" ? "en" : "ar"}">${L.nav.lang}</span></a><a class="fw-mi" role="menuitem" tabindex="-1" href="#frame">${svg(P.signout, "mirror")}<span>${L.nav.signout}</span></a></div>`;
  const phoneHead = ({ late = false, open = "", live = false } = {}) => `<div class="cx-ph-head"><h3>${L.nav.today}</h3><div class="head-acts">${hbadge(late, open === "ops", live)}${opsPop(late, open === "ops")}${hmenu(open === "menu", live)}${menuPop(open === "menu", open === "menu" && !live)}</div><p class="cx-ph-sub">${L.date}</p><span class="cx-concept">${L.concept}</span></div>`;
  const phone = (inner, cls = "") => `<div class="cx-phbox${cls ? " " + cls : ""}">${inner}<i class="card cx-ph-card"></i></div>`;
  function frame() {
    const f = (inner, state, ids, live = false, w = 390) => `<figure class="cx-fig" style="flex:0 0 ${w}px">${live ? `<div class="cx-spec cx-live-frame">${inner}</div>` : `<div class="cx-spec" inert>${inner}</div>`}${cap(state, ids)}${live ? `<span class="cx-live-tag">${L.live}</span>` : ""}</figure>`;
    return section("frame", "frame", "BRK-4 · BRK-10 · HDR-4 · BDG-1…4 · MNU-1…4 · BAR-1…6", `<div class="card cx-stage"><div class="cx-phones">
      ${f(phone(phoneHead()), L.frameCaps.head, "HDR-4 · BDG-1 · MNU-1")}
      ${f(phone(phoneHead({ late: true })), L.frameCaps.headLate, "BDG-1 · COL-16")}
      ${f(phone(phoneHead({ open: "ops" }), "is-tall"), L.frameCaps.ops, "BDG-2…4 · SRF-8")}
      ${f(phone(phoneHead({ late: true, open: "ops" }), "is-tall"), L.frameCaps.opsLate, "BDG-3 · STA-2")}
      ${f(phone(phoneHead({ open: "menu" }), "is-tall"), L.frameCaps.menu, "MNU-2…4 · FOC-2")}
      ${f(phone(phoneHead({ live: true }), "is-tall"), L.frameCaps.live, "BDG-2 · MNU-4", true)}
      ${f(`<div class="cx-phbox cx-bar-spec">${bar()}</div>`, L.frameCaps.bar, "BAR-1…4 · BAR-6 · GLO-18")}
      ${f(`<div class="cx-phbox cx-bar-spec is-320">${bar({ reports: "is-hover", settings: "is-focus" })}</div>`, L.frameCaps.bar320, "BAR-3 · BAR-5 · FOC-1", false, 320)}
    </div></div>`);
  }
  // The interactive phone header: the same behaviour as the page (app.js "the frame"), in one specimen.
  function wireFrame() {
    for (const box of $$(".cx-live-frame")) {
      const btns = { ops: $('[data-layer="ops"]', box), menu: $('[data-layer="menu"]', box) };
      const pops = { ops: $('[data-pop="ops"]', box), menu: $('[data-pop="menu"]', box) };
      for (const a of $$("a", box)) a.addEventListener("click", (e) => e.preventDefault());
      let open = null;
      const items = () => $$('[role="menuitem"]', pops.menu);
      const show = (k, where = "first") => { if (open && open !== k) hide(open, false); open = k; pops[k].hidden = false; btns[k].setAttribute("aria-expanded", "true"); if (k === "menu") { const it = items(); (where === "last" ? it[it.length - 1] : it[0]).focus(); } else pops[k].focus(); };
      const hide = (k, back) => { if (pops[k].hidden) return; pops[k].hidden = true; btns[k].setAttribute("aria-expanded", "false"); if (open === k) open = null; if (back) btns[k].focus(); };
      for (const k of ["ops", "menu"]) {
        btns[k].addEventListener("click", () => (pops[k].hidden ? show(k) : hide(k, true)));
        pops[k].addEventListener("keydown", (e) => { if (e.key === "Escape") { e.stopPropagation(); hide(k, true); } });
        pops[k].addEventListener("focusout", (e) => { if (!pops[k].hidden && e.relatedTarget && !pops[k].contains(e.relatedTarget) && e.relatedTarget !== btns[k]) hide(k, false); });
      }
      for (const a of $$("a", pops.ops)) a.removeAttribute("tabindex");
      btns.menu.addEventListener("keydown", (e) => { if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); show("menu", e.key === "ArrowUp" ? "last" : "first"); } });
      pops.menu.addEventListener("keydown", (e) => {
        const it = items(), i = it.indexOf(document.activeElement), go = (j) => { e.preventDefault(); it[(j + it.length) % it.length].focus(); };
        if (e.key === "ArrowDown") go(i + 1); else if (e.key === "ArrowUp") go(i - 1); else if (e.key === "Home") go(0); else if (e.key === "End") go(it.length - 1);
        else if (e.key === "Tab") hide("menu", true);
      });
      frameOutside = (t) => { if (open && !pops[open].contains(t) && !btns[open].contains(t)) hide(open, false); };
    }
  }
  let frameOutside = null; // the live specimen's tap-outside close, replaced on each render
  document.addEventListener("pointerdown", (e) => { if (frameOutside) frameOutside(e.target); });

  /* ------------------------------------------------------------ empty, alert, retry */
  function empties() {
    const table = `<div class="card cx-table-card"><div class="cx-table-head"><div><h3>${L.daysTitle}</h3></div></div><table class="cx-table" role="table"><thead><tr role="row"><th scope="col">${L.cols.day}</th><th scope="col" class="n">${L.cols.peak}</th><th scope="col" class="n">${L.cols.avg}</th><th scope="col" class="n">${L.cols.entries}</th></tr></thead><tbody><tr role="row" class="is-empty"><td role="cell" colspan="4"><div class="cx-empty">${ico("info")}<p>${L.emptyTable}</p><button class="cx-btn" type="button">${L.emptyAction}</button></div></td></tr></tbody></table></div>`;
    const alert = `<div class="card cx-stage" style="width:min(468px,100%)"><div class="cx-alert" role="alert" style="margin:0">${ico("alert")}<span>${L.failed}</span></div><div style="display:flex;justify-content:flex-end;gap:8px;margin-block-start:24px"><button class="cx-btn" type="button">${L.cancel}</button><button class="cx-btn primary is-focus" type="button">${L.retry}</button></div></div>`;
    return section("empty", "empty", "EMP-1…4", `<div class="cx-row" style="grid-template-columns:minmax(0,3fr) minmax(0,2fr)">
      <figure class="cx-fig" style="align-items:stretch"><div class="cx-spec" inert>${table}</div>${cap(L.emptyCaps.table, "EMP-1 · STA-8 · EMP-4")}</figure>${fig(alert, L.emptyCaps.alert, "EMP-2 · EMP-3 · EMP-4")}</div>`);
  }

  /* ------------------------------------------------------------ render */
  const ORDER = [["found", "found"], ["card", "card"], ["chart", "chart"], ["pattern", "pattern"], ["table", "table"], ["buttons", "buttons"], ["seg", "seg"], ["sw", "switch"], ["field", "field"], ["dialog", "dialog"], ["chips", "chips"], ["rail", "rail"], ["frame", "frame"], ["empty", "empty"]];
  function drawPlots() { for (const h of $$(".cx-plot")) drawPlot(h); }
  function render() {
    L = COPY[LANG];
    RTL = LANG === "ar";
    fieldN = 0;
    root.lang = LANG;
    root.dir = RTL ? "rtl" : "ltr";
    document.title = L.docTitle;
    for (const el of $$("[data-t]")) el.innerHTML = L[el.dataset.t];
    for (const btn of $$("#lang-seg .cx-seg-b")) btn.setAttribute("aria-pressed", String(btn.dataset.lang === LANG));
    $("#cx-index").innerHTML = `<span class="sr-only" id="index-name">${L.indexName}</span>` + ORDER.map(([k, id]) => `<a href="#${id}">${L.sec[k][0]}</a>`).join("");
    const pat = pattern();
    $("#cx-root").innerHTML = [foundations(), cards(), chart(), pat.html, tables(), buttons(), segs(), switches(), fields(), dialogs(), chips(), rails(), frame(), empties()].join("");
    drawPlots();
    wireHeat();
    wireDialog();
    wireFrame();
  }
  function setLang(lang) {
    if (lang === LANG) return;
    LANG = lang;
    try { const u = new URL(location.href); u.searchParams.set("lang", lang); history.replaceState(null, "", u.href); } catch (e) { /* file:// may refuse; the switch still works */ }
    render();
    const btn = $(`#lang-seg [data-lang="${lang}"]`);
    if (btn) btn.focus();
  }
  for (const btn of $$("#lang-seg .cx-seg-b")) btn.addEventListener("click", () => setLang(btn.dataset.lang));
  wireDialogOnce();
  render();
  // Redraw the plots when the fonts arrive (the tooltip's size sets the lane) and when the page's width changes.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { drawPlots(); const s = $("#heat .is-sel"); if (s) heatSelect(s, false); });
  let rz = 0, lastW = innerWidth;
  addEventListener("resize", () => { if (innerWidth === lastW) return; lastW = innerWidth; cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { drawPlots(); const s = $("#heat .is-sel"); if (s) heatSelect(s, false); }); });
  window.__components = { ready: true, setLang, get lang() { return LANG; }, data: { peak: DATA.peak, peakM: DATA.peakM, latest: DATA.raw[NOW] } };
})();
