/* Eclipse Settings: FITWAY Owner Settings concept (the fifth Eclipse page). Synthetic data only; not production.
 * It answers "what shapes the gym and the visitors' page, and how do I change one value safely": the five values the
 * owner edits (capacity, the three crowd-level limits, the weekly hours, the end of the business day and the reset
 * buffer) on three cards, beside a fourth, the latest settings changes with their reasons (arrangement ج, DECISIONS
 * item 80). A card's «تعديل» opens that card in a window over the page (part 2 of this round); a save asks first,
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
 * Query: lang=ar|en; ops=delayed|closed|offline (the frame's status, for review); motion=off; edit=crowd|hours|day (a
 * card's window on load); state=loading|error with arrive=<ms>|never (the first load); refuse=bad_request|unauthorized|
 * forbidden|settings_version_conflict, fail=1, hold=1 (the answer to the first application), other=limits (the save
 * that came first also moves Busy); log=none|one|every and
 * case=cap1|capmax|tight|wide|closed|friday|allday|low|high (the whole range, "the gym's settings" below).
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
  // The counted noun alone, for a unit after digits the owner types (a field shows digits, never words): 3-10 the
  // plural, 11-99 and their hundreds the accusative singular, otherwise (0, 1, 2, a round hundred) the singular.
  const arUnit = (n, sing, few, acc) => {
    const t = n % 100;
    if (n >= 3 && t >= 3 && t <= 10) return few;
    if (t >= 11) return acc;
    return sing;
  };
  const COPY = {
    ar: {
      docTitle: "الإعدادات · FITWAY (مفهوم)",
      title: "الإعدادات",
      history: "سجل الإعدادات",
      historyName: "سجل الإعدادات في سجل النشاط",
      sec: { crowd: "الزحام", hours: "ساعات العمل", day: "يوم العمل" },
      hoursUnit: "توقيت الرياض",
      noOpening: "لا ساعات عمل",
      edit: "تعديل",
      // The visible word, then the card it edits (WCAG 2.5.3).
      editName: (s) => `تعديل ${s}`,
      capacity: "السعة",
      levelsTitle: "المستويات",
      levels: ["هادئ", "متوسط", "مزدحم", "شديد الازدحام"],
      upTo: "حتى",
      above: "فوق",
      people: (n) => (n === 0 ? `${ltr("0")} أشخاص` : arCount(n, "شخص واحد", "شخصان", "أشخاص", "شخصًا", "شخص")),
      // A level no whole count reaches (its limit holds no more people than the level under it, a capacity too small to
      // tell them apart): it never shows, said in the people's place. (Named noReach: the frame's copy, merged over the
      // page's, has its own noCount, «لا عدّ حاليًا».)
      noReach: "لا يظهر بهذه السعة",
      days: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
      closed: "مغلق",
      allDay: (n) => `${ltr(n)} ساعة`,
      dayEnd: "نهاية يوم العمل",
      reset: "تصفير العدد",
      minutes: (n) => (n === 0 ? "" : arCount(n, "دقيقة واحدة", "دقيقتان", "دقائق", "دقيقة", "دقيقة")),
      resetAfter: (n) => (n === 0 ? "عند الإغلاق" : `${COPY.ar.minutes(n)} بعد الإغلاق`),
      // The settings history card (from 721 px; on a phone the control under the header takes its place).
      logTitle: "سجل الإعدادات",
      logAll: "عرض الكل",
      logAllName: "عرض كل سجلات الإعدادات في سجل النشاط",
      logEmpty: "لا تغييرات بعد",
      // Under the oldest record when the history holds fewer than the card's three: the log starts there.
      logStart: "لا تغييرات أقدم",
      // After a record's first change, the others it made (Activity log lists them): «وتغيير آخر», «وتغييران آخران»,
      // «و3 تغييرات أخرى», «و11 تغييرًا آخر».
      moreChanges: (n) => `و${arCount(n, "تغيير آخر", "تغييران آخران", "تغييرات أخرى", "تغييرًا آخر", "تغيير آخر")}`,
      // A folded record's control (named; its mark is the chevron) and its window's name: how many changes it holds.
      recOpen: "عرض التغيير كاملًا",
      recTitle: (n) => arCount(n, "تغيير واحد", "تغييران", "تغييرات", "تغييرًا", "تغيير"),
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
      // The people a level holds, after its limit: one «حتى» governs both values, «حتى 20% أو 24 شخصًا», so the people
      // read as an upper bound without «حتى» twice in the row (the coordinator's ruling of 2026-10-19: a bare «24 شخصًا»
      // reads as exactly 24). The top level keeps «69 شخصًا فأكثر».
      orPeople: (html) => `أو ${nw(html)}`,
      orMorePeople: (n) => `أو ${nw(COPY.ar.people(n))} فأكثر`,
      /* ---- the editor (part 2): each value card's window */
      close: "إغلاق",
      cancel: "إلغاء",
      save: "حفظ",
      noChange: "لم يتغيّر شيء، فلم يُحفظ شيء",
      // After a number typed in a field, the counted noun follows the digits by their last two («3 أشخاص», «24 شخصًا»,
      // «100 شخص»); a field always shows digits, so one and two take the singular («1 شخص»).
      capUnit: (n) => arUnit(n, "شخص", "أشخاص", "شخصًا"),
      resetUnit: (n) => `${arUnit(n, "دقيقة", "دقائق", "دقيقة")} بعد الإغلاق`,
      limitName: (lv) => `${lv}، الحد الأعلى بالمئة`,
      am: "ص",
      pm: "م",
      opensHead: "يفتح",
      closesHead: "يغلق",
      openName: (d) => `وقت فتح ${d}`,
      closeName: (d) => `وقت إغلاق ${d}`,
      apName: (name) => `${name}، ص أو م`,
      swName: (d) => `مفتوح يوم ${d}`,
      nextDay: "اليوم التالي",
      // The days in a sentence: «يوم الخميس», «يومي الجمعة والسبت», «أيام الأحد إلى الأربعاء», «كل الأيام».
      daysAt: (n, text) => (n >= 6 ? text : `${n === 1 ? "يوم" : n === 2 ? "يومي" : "أيام"} ${text}`),
      // A field's refusal on the page (FLD-4): what to type, never what went wrong.
      err: {
        capEmpty: "اكتب السعة",
        capWhole: "اكتب عددًا صحيحًا من الأشخاص، مثل 120",
        capMin: "اجعل السعة شخصًا واحدًا على الأقل",
        capMax: `أكبر سعة ممكنة ${ltr("2,147,483,647")} شخصًا`,
        limEmpty: (lv) => `اكتب حد ${lv}`,
        limRange: `اكتب عددًا صحيحًا من ${ltr("0")} إلى ${ltr("100")}`,
        limRise: (lv, pct) => `اجعله أعلى من حد ${lv}، ${ltr(`${pct}%`)}`,
        openEmpty: "اكتب وقت الفتح",
        closeEmpty: "اكتب وقت الإغلاق",
        timeEmpty: "اكتب الوقت",
        timeBad: `اكتب الوقت هكذا: ${ltr("6:30")}`,
        resetEmpty: "اكتب عدد الدقائق",
        resetWhole: "اكتب عددًا صحيحًا من الدقائق، مثل 30",
        resetMax: `أكبر عدد ممكن ${ltr("2,147,483,647")} دقيقة`,
      },
      // A value that looks like a mistake is accepted, with one plain sentence under its field (DECISIONS item 49): what
      // the value means, then what follows from it.
      warn: {
        capLow: (cur) => `هذا أقل من نصف السعة الحالية، ${cur}، فستبدو الصالة للزوار أكثر ازدحامًا من الآن بالعدد نفسه.`,
        capHigh: (cur) => `هذا أكثر من ضعف السعة الحالية، ${cur}، فستبدو الصالة للزوار أهدأ من الآن بالعدد نفسه.`,
        allClosed: "كل الأيام مغلقة، فسيرى الزوار الصالة مغلقة دائمًا.",
        boundary: (days) => `يقع هذا الوقت ضمن ساعات العمل ${days}، فتُحسب الساعات بعده في اليوم التالي.`,
        boundaryHours: (t, days) => `ينتهي يوم العمل الساعة ${t}، وهي ضمن ساعات العمل ${days}، فتُحسب الساعات بعدها في اليوم التالي.`,
        reset: (days) => `بهذا التأخير يُصفَّر العدد بعد أن تفتح الصالة ${days}، فيبدأ من الصفر والناس فيها.`,
        resetHours: (days) => `بهذه الساعات يُصفَّر العدد بعد أن تفتح الصالة ${days}، فيبدأ من الصفر والناس فيها.`,
      },
      /* ---- the dialogs and states (part 3). The editor's «حفظ» only gathers and checks; nothing is sent until the
       * confirmation's «تطبيق الآن», the step that makes the values live (effective at once, no later date: item 49). */
      back: "رجوع",
      applyNow: "تطبيق الآن",
      applying: "جارٍ التطبيق…",
      applyMine: "تطبيق تغييري",
      cf: {
        title: (sec, many) => `تطبيق ${many ? "تغييرات" : "تغيير"} ${COPY.ar.sec[sec]}؟`,
        // What the step does, in one sentence (DLG-7): the visitors' page for the crowd and the hours; the business day
        // reaches no visitor, so its sentence says when it applies and that past days keep their reports (SPEC).
        desc: {
          crowd: () => "يرى الزوار المستوى وفق هذه القيم فور التطبيق.",
          hours: () => "يرى الزوار الساعات الجديدة فور التطبيق.",
          day: (many) => (many ? "تسري التغييرات فور التطبيق، وتبقى تقارير الأيام السابقة كما هي." : "يسري التغيير فور التطبيق، وتبقى تقارير الأيام السابقة كما هي."),
        },
        listName: "التغييرات",
        pplName: "الأشخاص في كل مستوى",
      },
      // The people a level holds, before → after, in the confirmation: «حتى 24 ← 28 شخصًا»; said in full as «هادئ: حتى
      // 28 شخصًا بدلًا من 24».
      pplUpTo: (n) => `حتى ${n}`,
      never: "لا يظهر",
      pplSaid: (lv, a, b) => `${lv}: ${b === null ? "لا يظهر" : `حتى ${b}`}، بدلًا من ${a === null ? "لا يظهر" : a}`,
      reasonLabel: "السبب (اختياري)",
      reasonRow: "السبب",
      left: (n) => (n === 0 ? "لم يبق أي حرف" : n === 1 ? "بقي حرف واحد" : n === 2 ? "بقي حرفان" : n <= 10 ? `بقيت ${n} أحرف` : `بقي ${n} حرفًا`),
      done: (many) => (many ? "طُبّقت التغييرات." : "طُبّق التغيير."),
      doneLink: "عرض في سجل النشاط",
      // Each answer the contract can give besides success and the version conflict: what happened, that nothing changed,
      // what to do (EMP-2, DLG-10).
      refuse: {
        bad_request: "لم تُقبل هذه القيم، فلم يتغيّر شيء. ارجع إلى التعديل وراجعها.",
        unauthorized: "سُجّل خروجك، فلم يتغيّر شيء. سجّل الدخول مجددًا للمتابعة.",
        forbidden: "لا يستطيع هذا الحساب تغيير الإعدادات، فلم يتغيّر شيء.",
      },
      failed: "تعذّر تطبيق التغيير، ولم يتغيّر شيء.",
      // Another save came first (409): it names no one (DECISIONS item 78), says when, and keeps what was typed.
      cx: {
        title: "حُفظت تغييرات أخرى قبل تغييرك",
        apply: (t) => `حُفظت الساعة ${t}، فلم يُطبَّق تغييرك.`,
        same: (t) => `حُفظت الساعة ${t}، وفيها ما كتبته، فلا شيء لتطبيقه.`,
        clash: (t) => `حُفظت الساعة ${t}، ولم يعد تغييرك يتّفق معها. ارجع إلى التعديل لتراجعه.`,
        saved: "المحفوظ الآن",
        yours: "تغييرك",
      },
      // Closing a window with something typed (Escape, ×, «إلغاء»): the user's kept second-pass question, for a window.
      ds: {
        title: "إغلاق دون حفظ؟",
        desc: (name) => `لم تُحفظ تغييرات ${name}، وتضيع إن أغلقت.`,
        keep: "متابعة التعديل",
        discard: "إغلاق دون حفظ",
      },
      errorFull: "تعذّر تحميل الإعدادات",
      errorHint: "تحقّق من الاتصال، ثم أعد المحاولة.",
      retry: "إعادة المحاولة",
      retrying: "جارٍ المحاولة…",
      loadingSay: "جارٍ تحميل الإعدادات",
      arrivedSay: "حُمّلت الإعدادات",
    },
    en: {
      docTitle: "Settings · FITWAY (concept)",
      title: "Settings",
      history: "Settings history",
      historyName: "Settings history in the Activity log",
      sec: { crowd: "Crowd", hours: "Opening hours", day: "Business day" },
      hoursUnit: "Riyadh time",
      noOpening: "No opening hours",
      edit: "Edit",
      editName: (s) => `Edit ${s.toLowerCase()}`,
      capacity: "Capacity",
      levelsTitle: "Levels",
      levels: ["Quiet", "Moderate", "Busy", "Packed"],
      upTo: "up to",
      above: "above",
      people: (n) => (n === 1 ? `${ltr("1")} person` : `${ltr(fmtInt(n))} people`),
      noReach: "Never shown at this capacity",
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
      logStart: "No earlier changes",
      // "and 9 more changes" wrapped the first record's line in the 1024 px card.
      moreChanges: (n) => `and ${n} more`,
      recOpen: "Show the whole change",
      recTitle: (n) => (n === 1 ? "1 change" : `${n} changes`),
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
      orPeople: (html) => `or ${nw(html)}`,
      // "or 69+ people": "or at least 69 people" spilled the 390 px card by 4 px beside "above 57%".
      orMorePeople: (n) => `or ${nw(`${ltr(fmtInt(n))}+ people`)}`,
      close: "Close",
      cancel: "Cancel",
      save: "Save",
      noChange: "Nothing changed, so nothing was saved",
      capUnit: (n) => (n === 1 ? "person" : "people"),
      resetUnit: (n) => (n === 1 ? "minute after closing" : "minutes after closing"),
      limitName: (lv) => `${lv}, upper limit in percent`,
      am: "AM",
      pm: "PM",
      opensHead: "Opens",
      closesHead: "Closes",
      openName: (d) => `${d} opening time`,
      closeName: (d) => `${d} closing time`,
      apName: (name) => `${name}, AM or PM`,
      swName: (d) => `Open on ${d}`,
      nextDay: "next day",
      daysAt: (n, text) => (n >= 6 ? text : `on ${text}`),
      // Under 430 px of sheet the week's rows take the short day names (DAT-2); their full names stay the fields' names.
      daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      err: {
        capEmpty: "Enter the capacity",
        capWhole: "Enter a whole number of people, like 120",
        capMin: "Capacity must be at least 1 person",
        capMax: "The largest capacity is 2,147,483,647 people",
        limEmpty: (lv) => `Enter the limit for ${lv}`,
        limRange: "Enter a whole number from 0 to 100",
        limRise: (lv, pct) => `Make it higher than ${lv}'s ${pct}%`,
        openEmpty: "Enter the opening time",
        closeEmpty: "Enter the closing time",
        timeEmpty: "Enter a time",
        timeBad: "Enter a time like 6:30",
        resetEmpty: "Enter the minutes",
        resetWhole: "Enter a whole number of minutes, like 30",
        resetMax: "The largest is 2,147,483,647 minutes",
      },
      warn: {
        capLow: (cur) => `That's less than half the current ${cur}, so the same crowd will look busier to visitors than it does now.`,
        capHigh: (cur) => `That's more than double the current ${cur}, so the same crowd will look quieter to visitors than it does now.`,
        allClosed: "Every day is closed, so visitors will always see the gym as closed.",
        boundary: (days) => `This falls within the opening hours ${days}, so the hours after it count toward the next day.`,
        boundaryHours: (t, days) => `The business day ends at ${t}, within the opening hours ${days}, so the hours after it count toward the next day.`,
        reset: (days) => `With this delay, the count resets after the gym has opened ${days}, so it starts from zero with people inside.`,
        resetHours: (days) => `With these hours, the count resets after the gym has opened ${days}, so it starts from zero with people inside.`,
      },
      back: "Back",
      applyNow: "Apply now",
      applying: "Applying…",
      applyMine: "Apply my change",
      cf: {
        title: (sec, many) => `Apply ${many ? "these" : "this"} ${COPY.en.sec[sec].toLowerCase()} change${many ? "s" : ""}?`,
        desc: {
          crowd: () => "The level visitors see follows these values as soon as you apply.",
          hours: () => "Visitors see the new hours as soon as you apply.",
          day: (many) => `${many ? "They take" : "It takes"} effect as soon as you apply. Reports for past days stay as they are.`,
        },
        listName: "Changes",
        pplName: "People at each level",
      },
      pplUpTo: (n) => `up to ${n}`,
      never: "never shown",
      pplSaid: (lv, a, b) => `${lv}: ${b === null ? "never shown" : `up to ${b}`}, was ${a === null ? "never shown" : a}`,
      reasonLabel: "Reason (optional)",
      reasonRow: "Reason",
      left: (n) => (n === 0 ? "No characters left" : n === 1 ? "1 character left" : `${n} characters left`),
      done: (many) => (many ? "Changes applied." : "Change applied."),
      doneLink: "View in Activity log",
      refuse: {
        bad_request: "These values weren't accepted, so nothing changed. Go back and check them.",
        unauthorized: "You've been signed out, so nothing changed. Sign in again to continue.",
        forbidden: "This account can't change settings, so nothing changed.",
      },
      failed: "Couldn't apply the change. Nothing changed.",
      cx: {
        title: "Other changes were saved before yours",
        apply: (t) => `They were saved at ${t}, so yours wasn't applied.`,
        same: (t) => `They were saved at ${t} and already hold what you entered, so there's nothing to apply.`,
        clash: (t) => `They were saved at ${t}, and your change no longer fits with them. Go back to check it.`,
        saved: "Saved now",
        yours: "Your change",
      },
      ds: {
        title: "Close without saving?",
        desc: (name) => `Your ${name.toLowerCase()} changes aren't saved. They'll be lost if you close.`,
        keep: "Keep editing",
        discard: "Close without saving",
      },
      errorFull: "Couldn't load settings",
      errorHint: "Check the connection, then try again.",
      retry: "Try again",
      retrying: "Trying again…",
      loadingSay: "Loading settings",
      arrivedSay: "Settings loaded",
    },
  };
  COPY.ar.daysShort = COPY.ar.days;
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
  // The people level i holds at a capacity, as the phrase after its limit (the card and its window alike): «أو 24
  // شخصًا», the top level «أو 69 شخصًا فأكثر». A Quiet holding only the empty gym keeps the pattern, «أو 0 أشخاص»
  // (part 3: the earlier «الصالة خالية فقط» stood after «حتى 20%» with nothing to join them); a level no count reaches
  // says «لا يظهر بهذه السعة» in the people's place.
  function peoplePhrase(cap, lims, i) {
    const last = lims.map((p) => lastCount(cap, p));
    if (i === 3) return L.orMorePeople(last[2] + 1);
    if (i > 0 && last[i] === last[i - 1]) return L.noReach;
    return L.orPeople(L.people(last[i]));
  }

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
  /* Review switches for the whole range (rounds item 7), each a truthful history: what the cards show is always the
   * latest version, and the history's records are the versions before it.
   *   ?log=none   no change yet: one version, holding today's values (the history says «لا تغييرات بعد»)
   *   ?log=one    one change: the version before today's, then today's
   *   ?log=every  a ninth change today at 7:30 PM, by فهد, touching every kind of value, with a reason of 240 characters
   *   ?log=week   a ninth change today at 7:30 PM, by فهد: all seven days' hours, each its own line, 240 characters
   *   ?case=<k>   a ninth change today at 7:30 PM, by فهد, no reason: cap1 (capacity 1), capmax (2,147,483,647), tight
   *               (limits 0 / 1 / 2), wide (98 / 99 / 100), closed (every day), friday (Friday closed), allday (Wednesday
   *               opening equal to its closing), low (the business day ending at midnight, the reset at closing), high
   *               (ending 11:59 PM, the reset 2,147,483,647 minutes after closing) */
  const LOG_Q = params.get("log"), CASE_Q = params.get("case");
  const REASON_240 = {
    ar: "وسّعنا الصالة وافتتحنا منطقة الأوزان الحرة، فرفعنا السعة إلى 140 شخصًا وعدّلنا حدود المستويات لتناسبها، وقدّمنا الإغلاق إلى منتصف الليل في أول الأسبوع، وأغلقنا الجمعة للصيانة الدورية حتى نهاية الشهر، ونقلنا التصفير إلى ربع ساعة بعد الإغلاق.",
    en: "We expanded the gym and opened the free-weights area, so capacity goes to 140 and the levels follow it; we close at midnight early in the week, Friday is closed for maintenance until month end, and the count resets 15 minutes after closing.",
  };
  const pushToday = (apply, reason = null) => {
    const next = clone(versions[versions.length - 1].editable);
    apply(next);
    versions.push({ version: versions.length + 1, date: "2026-09-23", mins: hm("19:30"), by: "o1", reason, editable: next });
  };
  if (LOG_Q === "every") {
    pushToday((s) => {
      s.capacity = 140;
      s.thresholds = { quietMaxPercent: 25, moderateMaxPercent: 50, busyMaxPercent: 75 };
      for (const d of ["sun", "mon", "tue"]) s.weeklySchedule[d].close = "00:00";
      s.weeklySchedule.wed = H("07:00", "23:00");
      s.weeklySchedule.thu.open = "07:00";
      s.weeklySchedule.fri = null;
      s.businessDayBoundary = "05:00";
      s.resetBufferMinutes = 15;
    }, R(REASON_240.ar, REASON_240.en));
  }
  // ?log=week  the widest record ج can write (one window holds one card): the hours window saving all seven days, each
  // with both ends changed and none like another, so the record names every day on its own line, with a reason of 240
  // characters. Today at 7:30 PM, by فهد.
  if (LOG_Q === "week") {
    pushToday((s) => {
      const NEW = { sun: H("10:00", "00:00"), mon: H("10:30", "00:30"), tue: H("11:00", "00:00"), wed: H("11:30", "00:30"), thu: H("10:00", "03:00"), fri: H("12:00", "02:30"), sat: H("11:00", "00:30") };
      for (const d of DAYS) s.weeklySchedule[d] = NEW[d];
    }, R("ساعات رمضان: نفتح كل يوم قبل الظهر ونغلق بعد منتصف الليل لأن الإقبال يكثر بعد التراويح، والخميس حتى الثالثة فجرًا، والجمعة من الظهر. نرجع إلى الساعات المعتادة بعد العيد مباشرة، وأي تغيير قبل ذلك نعلنه للأعضاء قبل يومين على الأقل في المجموعة",
      "Ramadan hours: we open before noon every day and close after midnight, since most members come after tarawih; Thursday until 3 AM, Friday from noon. Back to the usual hours right after Eid; any change before then is announced two days ahead"));
  }
  const CASES = {
    cap1: (s) => { s.capacity = 1; },
    capmax: (s) => { s.capacity = 2147483647; },
    tight: (s) => { s.thresholds = { quietMaxPercent: 0, moderateMaxPercent: 1, busyMaxPercent: 2 }; },
    wide: (s) => { s.thresholds = { quietMaxPercent: 98, moderateMaxPercent: 99, busyMaxPercent: 100 }; },
    closed: (s) => { for (const d of DAYS) s.weeklySchedule[d] = null; },
    friday: (s) => { s.weeklySchedule.fri = null; },
    allday: (s) => { s.weeklySchedule.wed = H("06:00", "06:00"); },
    low: (s) => { s.businessDayBoundary = "00:00"; s.resetBufferMinutes = 0; },
    high: (s) => { s.businessDayBoundary = "23:59"; s.resetBufferMinutes = 2147483647; },
  };
  if (CASE_Q in CASES) pushToday(CASES[CASE_Q]);
  if (LOG_Q === "none") versions.splice(0, versions.length, { version: 1, date: null, mins: null, by: null, reason: null, editable: clone(versions[versions.length - 1].editable) });
  if (LOG_Q === "one") {
    const [a, b] = versions.slice(-2);
    versions.splice(0, versions.length, { ...a, version: 1, date: null, mins: null, by: null, reason: null }, { ...b, version: 2 });
  }
  // The snapshot the page loaded (settings.read): the latest version and its five read-only values, never shown but
  // as «توقيت الرياض» beside the hours (item 49).
  const current = () => versions[versions.length - 1];
  const OPERATIONAL = { timezone: "Asia/Riyadh", pushIntervalSeconds: 20, freshForSeconds: 90, operationalStaleAfterSeconds: 180, publicPollSeconds: 60 };

  /* ------------------------------------------------------- what changed, from → to (the history's words)
   * One version against the one before it. The order follows the cards: capacity, the three limits, the hours, the end
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
  // The next opening for the closed status (STA-11): today's, else the next open day's («يفتح الخميس 6:00 ص»); with
  // every day closed there is none, and the line says so rather than invent one.
  function nextOpening() {
    const week = current().editable.weeklySchedule, i0 = DAYS.indexOf(TODAY_KEY);
    for (let k = 0; k < 7; k++) {
      const i = (i0 + k) % 7, h = week[DAYS[i]];
      if (h) return k === 0 ? L.opens(timeText(hm(h.open))) : L.opens(nw(`${L.daysShort[i]} ${bdi(clockOf(h.open))}`));
    }
    // The frame's status always writes «· » before its line (shared-frame.js), so with no opening at all the line says so.
    return L.noOpening;
  }
  const OPS_STATES = {
    live: (m = NOW_MIN) => ({ cls: "", mark: '<span class="dot" aria-hidden="true"></span>', word: L.live, line: `${L.lastReading} ${timeText(m)}` }),
    delayed: (m = NOW_MIN - 13) => ({ cls: "is-delayed", mark: EclipseFrame.icons.clock, word: L.delayed, line: `${L.lastReading} ${timeText(m)}` }),
    closed: () => ({ cls: "is-closed", mark: '<span class="dot ring" aria-hidden="true"></span>', word: L.closed, line: nextOpening() }),
    offline: () => ({ cls: "is-off", mark: EclipseFrame.icons.offline, word: L.offline, line: L.noCount }),
    error: () => ({ cls: "is-err", mark: SVG_ERR, word: L.errorWord, line: L.errorLine, detail: `${L.errorFull}. ${L.errorHint}` }),
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

  /* ---------------------------------------------------------------- the value cards
   * Three cards, each a heading with its «تعديل» at the head's end, then its values on one module of rows (--row, 48 px
   * from 721 px), every block ruled from the one above with the row line, so the crowd's levels and the hours' last
   * four days share their rules across the gutter and the two cards end on one line. A value that stands alone is a
   * figure (VAL-3): its label, then the value in title type over two rows; a list is rows (VAL-2): a label column, then
   * the figures. The crowd: capacity as a figure, then «المستويات» and the four levels, each its level's four bars (CHP-5,
   * the key the visitors' page and Daily use), «حتى 20%» and the people it holds. The hours: the week from Sunday, each
   * day's opening and closing as one range phrase (a closing time before the opening is the night after, as every
   * opening-hours list writes it), or «مغلق». The business day: its end and the reset, two figures. Nothing is lit;
   * nothing here is a reading. */
  const LEVEL_BARS = (lv) => `<span class="lvl-bars" aria-hidden="true">${[0, 1, 2, 3].map((i) => `<i${i <= lv ? ' class="on"' : ""}></i>`).join("")}</span>`;
  // While the first payload loads, «تعديل» waits (BTN-4): there is nothing to edit yet.
  const editBtn = (sec) => `<button class="rbtn set-edit" type="button" data-edit="${sec}" aria-label="${esc(L.editName(L.sec[sec]))}"${phase === "loading" ? " disabled" : ""}>${L.edit}</button>`;
  // After a change is applied, the done sentence stands in its card's head (EMP-6), where the owner made it: on the
  // title's line where the card has room, under it where it has not (settings.css "the done sentence").
  const head = (sec, extra = "") => `<div class="set-head">
      <h2 class="set-title" id="${sec}-title" tabindex="-1"><span class="set-name">${L.sec[sec]}</span>${extra}</h2>
      ${noticeHTML(sec)}${editBtn(sec)}
    </div>`;
  const row = (dt, dd, cls = "") => `<div class="set-row${cls ? ` ${cls}` : ""}"><dt>${dt}</dt><dd>${dd}</dd></div>`;
  // A figure's value: its figure in title type and the words that finish it smaller on the same baseline (CRD-2's value
  // and unit), joined by a real space so it reads as one phrase. Where Arabic writes the count in words (one and two:
  // «شخص واحد», «دقيقتان»), or the value is words alone («عند الإغلاق»), the words take the figure's size.
  const figVal = (big, small = "") => `<span class="fig-n">${big}</span>${small ? ` <span class="fig-u">${small}</span>` : ""}`;
  const fig = (dt, dd, cls = "") => `<div class="set-fig${cls ? ` ${cls}` : ""}"><dt>${dt}</dt><dd>${dd}</dd></div>`;
  const FIG = {
    people: (n) => (RTL
      ? (n === 1 ? figVal("شخص واحد") : n === 2 ? figVal("شخصان") : figVal(ltr(fmtInt(n)), COPY.ar.people(n).replace(/^<bdi[^>]*>[^<]*<\/bdi> /, "")))
      : figVal(ltr(fmtInt(n)), n === 1 ? "person" : "people")),
    time: (mins) => { const [t, ap] = fmtClock(mins).split(" "); return figVal(ltr(t), ap); },
    reset: (n) => {
      if (n === 0) return figVal(L.resetAfter(0));
      if (RTL) return n === 1 ? figVal("دقيقة واحدة", "بعد الإغلاق") : n === 2 ? figVal("دقيقتان", "بعد الإغلاق") : figVal(ltr(fmtInt(n)), `${COPY.ar.minutes(n).replace(/^<bdi[^>]*>[^<]*<\/bdi> /, "")} بعد الإغلاق`);
      return figVal(ltr(fmtInt(n)), n === 1 ? "minute after closing" : "minutes after closing");
    },
  };
  function crowdHTML(s) {
    const cap = s.capacity, t = s.thresholds;
    const lims = [t.quietMaxPercent, t.moderateMaxPercent, t.busyMaxPercent];
    const ppl = (i) => peoplePhrase(cap, lims, i);
    const lvRow = (i) => row(
      `${LEVEL_BARS(i)}<span>${L.levels[i]}</span>`,
      `<span class="v-q">${i === 3 ? L.above : L.upTo}</span><span class="v-n">${ltr(`${lims[Math.min(i, 2)]}%`)}</span>${SR_SEP}<span class="v-p">${nw(ppl(i))}</span>`,
      "is-level");
    return `${head("crowd")}
    <dl class="set-figs">${fig(L.capacity, FIG.people(cap), "is-cap")}</dl>
    <h3 class="set-sub" id="levels-title">${L.levelsTitle}</h3>
    <dl class="set-dl dl-levels" aria-labelledby="levels-title">${[0, 1, 2, 3].map(lvRow).join("")}</dl>`;
  }
  function hoursHTML(s) {
    const unit = `<span class="set-unit">${SR_SEP}${L.hoursUnit}</span>`;
    const dayRow = (d, i) => {
      const h = s.weeklySchedule[d];
      if (!h) return row(L.days[i], `<span class="v-closed">${L.closed}</span>`, "is-closed");
      const allDay = h.open === h.close;
      // The opening and its dash share a column, the closing has its own, so openings and closings each keep one edge
      // and the dash takes the middle of what an opening ending in «م» leaves (settings.css "the hours").
      return row(L.days[i],
        `<span class="v-hr"><span class="v-od"><span class="v-n v-t">${bdi(clockOf(h.open))}</span><span class="v-dash" aria-hidden="true">${DASH}</span><span class="sr-only">${RTL ? " إلى " : " to "}</span></span>` +
        `<span class="v-n v-t">${bdi(clockOf(h.close))}</span></span>${allDay ? `${SR_SEP}<span class="v-note">${L.allDay(24)}</span>` : ""}`);
    };
    return `${head("hours", unit)}
    <dl class="set-dl dl-hours">${DAYS.map(dayRow).join("")}</dl>`;
  }
  function dayHTML(s) {
    return `${head("day")}
    <dl class="set-figs">
      ${fig(L.dayEnd, FIG.time(hm(s.businessDayBoundary)))}
      ${fig(L.reset, FIG.reset(s.resetBufferMinutes))}
    </dl>`;
  }

  /* ---------------------------------------------------------------- the settings history (the fourth card)
   * The latest three records, newest first, each two lines at every width: its first change, from → to (chalk figures,
   * the arrow along the reading line), and how many more it made («و9 تغييرات أخرى»); then the reason as typed, in
   * quotation marks, on one line, only where one was given, and who and when at that line's far end. The list's place is
   * one height, three such records (the card ends level with its row at 1440 × 900 with the page inside the window),
   * whatever the records hold, so the row never follows the history: loading, the arrival and a save keep one geometry
   * (DECISIONS item 82). A record that does not fit its two lines is folded (fitLog) and opens whole in a window over the
   * page (DECISIONS item 83); «عرض الكل» opens every settings record in Activity log (OWN-A9). With fewer records than
   * three, «لا تغييرات أقدم» stands in the middle of the place left under the oldest, as «لا تغييرات بعد» stands in the
   * whole place when there is none, so the card reads finished at every length of history. */
  const LOG_N = 3;
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
  const CHEVRON = `<svg class="mirror" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M10 7l5 5-5 5"/></svg>`;
  function recordHTML(v, prev) {
    // Its first change on the first line (the records share their columns, so every record's figures start on one
    // edge), then how many more it made; said in full to assistive technology, and describing the control that opens it.
    const all = changes(prev.editable, v.editable), c = all[0], more = all.length - 1;
    const moreHTML = more ? `<span class="log-more">${L.moreChanges(more)}</span>` : "";
    const said = more ? `${c.said}${RTL ? "، " : ", "}${L.moreChanges(more).replace(/<[^>]+>/g, "")}` : c.said;
    const reason = v.reason ? (v.reason.raw ?? v.reason[LANG]) : null;
    const why = reason ? `<p class="log-why"><q><bdi dir="auto">${esc(reason)}</bdi></q></p>` : "";
    // Folded short (fitLog), the count follows the name as one phrase: «ساعات الأحد و6 تغييرات أخرى».
    return `<li class="log-rec" data-v="${v.version}"${more ? " data-more" : ""}>` +
      `<span class="log-what" aria-hidden="true">${c.what}${more ? `<span class="log-wm"> ${L.moreChanges(more)}</span>` : ""}</span>` +
      `<span class="log-fig" aria-hidden="true"><span class="log-ft"><span class="log-from">${c.from}</span><span class="log-to">${ARROW}<span>${c.to}</span></span></span>${moreHTML}</span>` +
      `<span class="sr-only" id="rec-said-${v.version}">${esc(said)}</span>` +
      `<p class="log-meta">${SR_SEP}${bdi(esc(OWNER_NAMES[v.by]))}<span class="sep" aria-hidden="true">·</span>${SR_SEP}${whenHTML(v)}</p>${why}` +
      `<button class="log-open" type="button" data-rec="${v.version}" aria-label="${esc(L.recOpen)}" aria-describedby="rec-said-${v.version}" hidden>${CHEVRON}</button></li>`;
  }
  const logHead = () => `<div class="set-head">
        <h2 class="set-title" id="log-title" tabindex="-1"><span class="set-name">${L.logTitle}</span></h2>
        <a class="acc-all set-all" id="log-all" href="${LOG_HREF}" aria-label="${esc(L.logAllName)}"><span>${L.logAll}</span>${CHEVRON}</a>
      </div>`;
  function logHTML() {
    if (phase === "loading") return logPH();
    const recs = versions.slice(1).map((v, i) => [v, versions[i]]).reverse();
    if (!recs.length) return `${logHead()}<div class="log-box"><p class="log-none">${L.logEmpty}</p></div>`;
    const end = recs.length < LOG_N ? `<p class="log-end">${L.logStart}</p>` : "";
    return `${logHead()}<div class="log-box"><ol class="log-list">${recs.slice(0, LOG_N).map(([v, p]) => recordHTML(v, p)).join("")}</ol>${end}</div>`;
  }
  /* A record folds where its two lines cannot hold it at this width: more changes than its first line names, a reason
   * cut short, a long name of what changed cut short at half the list, or a first change too wide for its line (the
   * hours of a day both ends changed, in the 1024 px card), whose figures then leave the line to its name and its
   * count: «ساعات الأربعاء» or «السعة و9 تغييرات أخرى». Only a folded record takes the control that opens it whole,
   * with its chevron at the first line's end. Measured, not guessed: on every paint of the card, when the cards change
   * width and when the fonts arrive. A fold never changes a record's height. */
  function fitLog() {
    const list = $(".log-list", cardEl.log);
    if (!list || !list.getClientRects().length) return;
    const cut = (el) => Boolean(el && el.scrollWidth > el.clientWidth + 0.5);
    for (const li of $$(":scope > .log-rec:not(.is-ph)", list)) {
      li.classList.remove("is-short");
      li.classList.toggle("is-folded", li.hasAttribute("data-more") || cut($(".log-why", li)) || cut($(".log-what", li)));
      if (cut($(".log-fig", li))) li.classList.add("is-short", "is-folded");
      $(".log-open", li).hidden = !li.classList.contains("is-folded");
    }
  }

  /* ---- a folded record, whole (DECISIONS item 83): its window over the page, as a card's «تعديل» opens its own
   * (DLG-1…6, a bottom sheet at 720 px and below; the page behind does not move). Its name says how many changes it
   * holds, who and when under it, then every change on CHG-1's ruled rows, from → to, and the reason as typed, whole, on
   * the last row; «إغلاق» at the foot, where its text starts (item 35). It grows to its content from DLG-2's 468 px, so
   * the widest record ج writes (the week's seven days, each both ends) keeps a line per change, and its body scrolls,
   * the head and the foot fixed, only where the screen is too short for it (200% zoom, 320 px, a phone held sideways).
   * Escape, ×, «إغلاق» and a tap beside it close it (nothing in it can be lost), and focus returns to the record that
   * opened it. Read only. */
  const DREC = $("#dlg-rec");
  function recordWindow(n) {
    const i = versions.findIndex((v) => v.version === n);
    if (i < 1) return null;
    const v = versions[i], all = changes(versions[i - 1].editable, v.editable);
    const reason = v.reason ? (v.reason.raw ?? v.reason[LANG]) : null;
    const whyRow = reason ? `<li class="cf-row is-why"><span class="cf-what">${L.reasonRow}</span><span class="cf-fig"><q class="cf-q"><bdi dir="auto">${esc(reason)}</bdi></q></span></li>` : "";
    return `<div class="dlg-scrim" data-close="scrim"></div>
      <section class="dlg-panel rec-panel">
        <header class="dlg-head"><h2 id="rec-title" tabindex="-1"><span>${L.recTitle(all.length)}</span></h2>${closeX}</header>
        <div class="dlg-body">
          <p class="dlg-desc rec-who" id="rec-desc">${SR_SEP}${bdi(esc(OWNER_NAMES[v.by]))}<span class="sep" aria-hidden="true">·</span>${SR_SEP}${whenHTML(v)}</p>
          <div class="cf-grid"><ul class="cf-list" aria-labelledby="rec-title">${changeItems(all)}${whyRow}</ul></div>
        </div>
        <footer class="dlg-foot"><button class="rbtn" type="button" data-close>${L.close}</button></footer>
      </section>`;
  }
  function openRecord(n, opener) {
    const html = recordWindow(n);
    if (!html) return;
    DREC.innerHTML = html;
    DREC.dataset.sec = "";
    DREC.setAttribute("aria-labelledby", "rec-title");
    DREC.setAttribute("aria-describedby", "rec-desc");
    openDialog(DREC, opener, $("#rec-title", DREC));
    fitRecord();
  }
  // A change whose figures cannot stand beside its name, even broken before the arrow (a range or «15 minutes after
  // closing» in a narrow sheet), goes under it, across the window, instead of past its edge; the others keep the
  // column, so their figures still start on one edge. Measured on opening and whenever the window changes width.
  function fitRecord() {
    if (!DREC.open) return;
    for (const row of $$(".cf-row:not(.is-why)", DREC)) {
      row.classList.remove("is-stack");
      const f = $(".cf-fig", row);
      if (f.scrollWidth > f.clientWidth + 0.5) row.classList.add("is-stack");
    }
  }
  let recW = 0;
  new ResizeObserver(([e]) => { const w = Math.round(e.contentRect.width); if (w !== recW) { recW = w; fitRecord(); } }).observe(DREC);
  // Back to the record that opened it; if the history is gone (the window outlived a move under 721 px), to the way to
  // the history under the header.
  const closeRecord = () => {
    const op = openDlg && openDlg.opener;
    closeDialog(DREC, { back: op && op.isConnected && op.getClientRects().length ? op : $("#history-link") });
  };

  /* ---------------------------------------------------------------- render
   * Each card is drawn whole from the current version: renderCard("crowd" | "hours" | "day" | "log"). A save (part 3)
   * pushes a new version and calls renderAll(), so the cards and the history's top record follow it. */
  const cardEl = { crowd: $("#card-crowd"), hours: $("#card-hours"), day: $("#card-day"), log: $("#card-log") };
  const gridEl = $("#grid");
  const CARD_HTML = {
    crowd: () => (phase === "loading" ? crowdPH() : crowdHTML(current().editable)),
    hours: () => (phase === "loading" ? hoursPH() : hoursHTML(current().editable)),
    day: () => (phase === "loading" ? dayPH() : dayHTML(current().editable)),
    log: logHTML,
  };
  function renderCard(k) { cardEl[k].innerHTML = CARD_HTML[k](); }
  function renderAll() {
    if (phase === "error" || phase === "retrying") paintError();
    else {
      $("#page-msg")?.remove();
      gridEl.hidden = false;
      for (const k of Object.keys(cardEl)) renderCard(k);
      for (const el of Object.values(cardEl)) el.toggleAttribute("aria-busy", phase === "loading");
      fitLog();
      fitNotice();
    }
    frame.refreshStatus();
    root.dataset.phase = phase;
  }

  /* ---- the done sentence (EMP-6): after a change is applied, one paragraph in the head of the card it changed, in
   * Access's form: a check, «طُبّق التغيير.» or «طُبّقت التغييرات.», and the way to its record in Activity log (the exact
   * record, AMD-C2's arrival). It stays until another change replaces it or the page loads again: a window that opens
   * or closes never takes it away, so the page behind a window never moves (the brief's hard limit). It arrives at once,
   * with the cards' new values and the history's new record: the page itself has no motion (item 4). */
  let notice = null;                               // { at: "crowd" | "hours" | "day", many, id }
  // A record a save writes takes the session's next id, as Access's do (57 on; Activity log's sample ends at 56).
  let nextRecordId = 57;
  const recHref = (id) => `activity.html?kind=settings&record=${id}&${keep}`;
  const CHECK = '<svg class="done-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path class="m-check" d="M5.5 12.5 10 17l8.5-9.5"/></svg>';
  // Its words sit in one block that rises into the line, the check drawing as it comes (Access's done line, MOT-17).
  function noticeHTML(sec) {
    if (!notice || notice.at !== sec || phase !== "ready") return "";
    return `<p class="done set-done" id="notice" tabindex="-1"><span class="m-rise">${CHECK}<span class="done-t">${L.done(notice.many)}</span> <a class="done-a" href="${recHref(notice.id)}">${L.doneLink}</a></span></p>`;
  }
  /* The sentence never grows its card where the head can hold it, so the page behind the closing window keeps still
   * (the brief's hard limit) and a row's two cards keep their rules on one line: on the title's line between the title
   * and «تعديل» ("line"); where one line has no room, the sentence over its link in the same 44 px ("stack"); for the
   * hours, whose name carries «توقيت الرياض», the unit under the name as well, the name and the unit filling the head's
   * 44 px (28 + 16) ("tight": the hours at 1024); only where none fits (a phone: the hours and the business day at
   * 390, every card at 320), under the title's line, the card growing by it and the cards below sliding (MOT-17), as
   * Access's done line does ("under"). Measured, not guessed, in each language and at each width, and again when the
   * cards change width. */
  function fitNotice() {
    const p = $("#notice");
    if (!p) return;
    const head = p.parentElement, unit = head.querySelector(".set-unit");
    for (const mode of ["line", "stack", "tight", "under"]) {
      if (mode === "tight" && !unit) continue;
      head.dataset.done = mode;
      if (mode === "under" || (p.scrollWidth <= p.clientWidth + 0.5 && head.offsetHeight <= 44.5)) break;
    }
  }
  let gridW = 0;
  new ResizeObserver(([e]) => {
    const w = Math.round(e.contentRect.width);
    if (w !== gridW) { gridW = w; fitLog(); fitNotice(); }
  }).observe(gridEl);
  document.fonts.ready.then(() => fitLog());

  /* ---- Loading (STA-10, PH-1…3). Real from the first paint: the title, every card's name and «توقيت الرياض», the
   * labels («السعة», «المستويات», the levels with their keys, the days, «نهاية يوم العمل», «تصفير العدد»), the history's
   * name and «عرض الكل», the phone's way to the history, the frame. Awaited: every value, in its own slot, as one flat bar
   * as tall as its digits' ink (22 px for a figure in title type, 11 px for a value in body type, as Access's names), a
   * typical value's width; three history records of bars. «تعديل» waits (BTN-4). Nothing moves; 0-300 ms the bars are
   * unseen (data-load="wait"), then at least 400 ms; the arrival writes the values into the same slots. */
  const ph = (w, cls = "ph-v") => `<i class="ph-bar ${cls}" style="--w:${w}px" aria-hidden="true"></i>`;
  const phRow = (dt, w, cls = "") => row(dt, `<span class="ph-span">${ph(w)}</span>`, cls);
  // A level waits in its arrived parts: «حتى» / «فوق» (words, known before the values), then a bar for its limit and one
  // for its people, so a narrow card puts the people's bar under the limit's as it will put the people. Each of the two
  // slots also holds the arrived text itself, hidden (.ph-ghost: no ink, out of the accessibility tree), so the slot
  // takes the arrived column width and the arrived line count (a phrase that wraps on a phone, a limit of 100% a wider
  // column than 40%) and the row keeps its arrived box whatever the values are; the bar is drawn over the ghost's first
  // line (.ph-in).
  function crowdPH() {
    const s = current().editable, t = s.thresholds, cap = s.capacity;
    const lims = [t.quietMaxPercent, t.moderateMaxPercent, t.busyMaxPercent];
    const slot = (w, text) => `<span class="ph-in">${ph(w)}<span class="ph-ghost" aria-hidden="true">${text}</span></span>`;
    const lvRow = (i) => row(`${LEVEL_BARS(i)}<span>${L.levels[i]}</span>`,
      `<span class="v-q">${i === 3 ? L.above : L.upTo}</span><span class="v-n">${slot(32.17, ltr(`${lims[Math.min(i, 2)]}%`))}</span><span class="v-p">${slot(i === 3 ? 104 : 72, nw(peoplePhrase(cap, lims, i)))}</span>`, "is-level");
    return `${head("crowd")}
    <dl class="set-figs">${fig(L.capacity, ph(108, "ph-fig"), "is-cap")}</dl>
    <h3 class="set-sub" id="levels-title">${L.levelsTitle}</h3>
    <dl class="set-dl dl-levels" aria-labelledby="levels-title">${[0, 1, 2, 3].map(lvRow).join("")}</dl>`;
  }
  function hoursPH() {
    return `${head("hours", `<span class="set-unit">${SR_SEP}${L.hoursUnit}</span>`)}
    <dl class="set-dl dl-hours">${DAYS.map((d, i) => phRow(L.days[i], 124)).join("")}</dl>`;
  }
  function dayPH() {
    return `${head("day")}
    <dl class="set-figs">${fig(L.dayEnd, ph(84, "ph-fig"))}${fig(L.reset, ph(176, "ph-fig"))}</dl>`;
  }
  // Three records in the arrived records' parts and lines (what, the figures, who and when; the reason), so each
  // record keeps its arrived box.
  function logPH() {
    // The first record's "what" bar is as wide as the widest arrived name of the default history (Thursday closing /
    // Saturday opening: 114.67 px; «إغلاق الخميس»: 83.16 px), so the shared column starts the figures where they will start.
    const W = [[LANG === "en" ? 114.67 : 83.16, 128, 168, 88], [60, 120, 132, 72], [68, 112, 188, 72]];
    return `${logHead()}<div class="log-box"><ol class="log-list">${W.map(([w, f, r, m]) => `<li class="log-rec is-ph"><span class="log-what">${ph(w)}</span><span class="log-fig">${ph(f)}</span>` +
      `<p class="log-meta">${ph(m, "ph-c")}</p><p class="log-why">${ph(r)}</p></li>`).join("")}</ol></div>`;
  }

  /* ---- Error (STA-13; the first load failed): the header's Error, and one message for the page in place of the cards
   * (Reports' option C, as Access and Activity log): the mark, «تعذّر تحميل الإعدادات», and the one retry, focused; it
   * runs as an action (BTN-9) and arrives with focus on the first card's name. The phone's way to the history stays (a
   * link to another page). */
  let retryBtn = null, focusAlert = phase === "error";
  const stack = (a, b, showB = false) => `<span class="rb-stack"><span class="rb-l"${showB ? ' aria-hidden="true"' : ""}>${a}</span><span class="rb-l"${showB ? "" : ' aria-hidden="true"'}>${b}</span></span>`;
  function paintError() {
    gridEl.hidden = true;
    let msg = $("#page-msg");
    if (!msg) {
      msg = Object.assign(document.createElement("section"), { className: "card set-msg", id: "page-msg" });
      gridEl.after(msg);
    }
    const trying = phase === "retrying";
    msg.innerHTML = `<p class="set-say" aria-hidden="true">${SVG_ERR}<span>${L.errorFull}</span></p><span class="sr-only" id="err-say" role="alert"></span>` +
      `<button class="rbtn rbtn-primary" id="retry" type="button"${trying ? ' aria-disabled="true" aria-busy="true"' : ""}>${stack(L.retry, L.retrying, trying)}</button>`;
    retryBtn = $("#retry", msg);
    retryBtn.addEventListener("click", retry);
    const sayEl = $("#err-say", msg);
    if (!trying) setTimeout(() => { if (sayEl.isConnected) sayEl.textContent = L.errorFull; }, 50);
    if (focusAlert) { retryBtn.focus(); focusAlert = false; }
  }

  /* ================================================================ the editor (part 2 of this round)
   * Each value card's «تعديل» opens that card in a window over the page (DLG-1…6; a bottom sheet at 720 px and below,
   * DLG-5), and only that card: the card's own name, then its values in the card's order, each value now a field where
   * it stood. A figure (capacity, the end of the business day, the reset) keeps its label above it, the field in the
   * value's place with the words that finished the value after it («شخصًا», «دقائق بعد الإغلاق»); a list (the levels,
   * the week) keeps its rows, the field in the value's column. So the window reads as the card it came from, and the
   * owner changes one card's values without the rest of the page in the way. Cancel, then «حفظ», at the start (DECISIONS
   * item 35). The page behind is inert and does not move (`scrollbar-gutter: stable`).
   * As the owner types: a level's people follow capacity and its limit at once (bandFor's counting); a closing time at
   * or before its opening says «اليوم التالي» beside it (equal: «24 ساعة»); the unit after a number follows it. A value
   * the contract refuses is said under its field on «حفظ» (FLD-4), focus on the first, and the message leaves as soon as
   * the field is right. A value that looks like a mistake is accepted, with one plain sentence under its field (item
   * 49): it comes when the owner leaves the field, never while a number is half typed, and leaves at once when the value
   * stops warranting it; a «حفظ» that brings one the owner has not seen stops there once, so it is read. A valid «حفظ»
   * goes to the confirmation (part 3: confirmSave). */
  const MAX_INT = 2147483647;
  const ICON = {
    close: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 7l10 10M17 7 7 17"/></svg>',
    alert: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.4"/><path d="M12 7.6v5.4M12 16.2v.2"/></svg>',
    // A sentence about a value that looks like a mistake: an information mark, never the error's.
    note: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.4"/><path d="M12 11v5.2M12 7.8v.2"/></svg>',
    chev: '<svg class="tf-chev" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 10.5l4 4 4-4"/></svg>',
  };
  // Arabic-Indic and Persian digits become Western as they are typed (NUM-1), so they are never refused.
  const toWestern = (s) => s.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
  // A whole number as typed (thousands commas and spaces allowed): null when empty, NaN when it is not one.
  const parseWhole = (raw) => { const s = toWestern(raw).replace(/[\s,٬%]/g, ""); return !s ? null : /^\d+$/.test(s) ? Number(s) : NaN; };
  /* A time as typed on the 12-hour clock: "6", "630", "0630", "6:30", "6.30", with or without «ص» / «م» (AM / PM) after
   * it. A 24-hour time ("18:30", "0:15") is read as one and sets its ص / م. Returns { h, m, ap } (h 1-12; ap "am", "pm", or null to keep the field's own), null when
   * empty, false when it is not a time. */
  function parseClock(raw) {
    let s = toWestern(raw).replace(/[\s.]+$/, "").replace(/\s/g, "").toLowerCase();
    if (!s) return null;
    // «م» or «ص», PM or AM typed after the time sets the list beside it.
    let typed = null;
    const suf = /(ص|م|a\.?m\.?|p\.?m\.?)$/.exec(s);
    if (suf) { typed = /^(م|p)/.test(suf[1]) ? "pm" : "am"; s = s.slice(0, -suf[1].length); }
    let h, m;
    const sep = /^(\d{1,2})[:.,،٫](\d{2})$/.exec(s);
    if (sep) { h = +sep[1]; m = +sep[2]; }
    else if (/^\d{1,2}$/.test(s)) { h = +s; m = 0; }
    else if (/^\d{3,4}$/.test(s)) { h = +s.slice(0, -2); m = +s.slice(-2); }
    else return false;
    if (h > 23 || m > 59 || (typed && (h === 0 || h > 12))) return false;
    if (h === 0) return { h: 12, m, ap: "am" };
    if (h > 12) return { h: h - 12, m, ap: "pm" };
    return { h, m, ap: typed };
  }
  const to24 = (h, m, ap) => ((h % 12) + (ap === "pm" ? 12 : 0)) * 60 + m;
  const hhmm = (mins) => `${String(Math.floor(mins / 60) % 24).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
  const clock12 = (mins) => { const h = Math.floor(mins / 60) % 24; return { text: `${((h + 11) % 12) + 1}:${String(mins % 60).padStart(2, "0")}`, ap: h >= 12 ? "pm" : "am" }; };

  /* ---- the fields. Every field remembers what it opened with (data-init), so the window knows whether anything was
   * typed. A number is FLD-1's field, left to right (in Arabic its digits keep the right edge, FLD-1), 16 px text. A
   * percent keeps its sign inside the field, after the digits, as the page writes a percent. A time is one field of
   * two parts: the time typed, then ص / م, a native list (TYP-6's form: it lies unseen over its face), so a phone gives
   * its own picker and a keyboard changes it with the arrows; each part draws the inset ring (FOC-2), two controls
   * edge to edge. */
  const fieldErr = (id) => `<p class="field-err" id="${id}-err" hidden></p>`;
  const fieldWarn = (id) => `<p class="ed-warn" id="${id}-warn" hidden></p>`;
  const numField = (id, value, label, extra = "") => `<input class="field-input ed-num" id="${id}" name="${id}" type="text" dir="ltr" inputmode="numeric" autocomplete="off" spellcheck="false" value="${value}" data-init="${value}"${label ? ` aria-label="${esc(label)}"` : ""}${extra}>`;
  // A count the owner left: its thousands marked, as the page writes it («2,147,483,647»); a limit stays bare.
  function tidyCount(input) {
    const n = parseWhole(input.value);
    if (Number.isFinite(n) && n !== null) input.value = fmtInt(n);
  }
  function timeField(id, mins, name) {
    const c = clock12(mins);
    return `<span class="tf" data-tf="${id}">` +
      `<input class="tf-in" id="${id}" name="${id}" type="text" dir="ltr" inputmode="numeric" autocomplete="off" spellcheck="false" value="${c.text}" data-init="${c.text}" aria-label="${esc(name)}">` +
      `<span class="tf-ap"><select class="tf-sel" id="${id}-ap" name="${id}-ap" data-init="${c.ap}" aria-label="${esc(L.apName(name))}">` +
      `<option value="am"${c.ap === "am" ? " selected" : ""}>${L.am}</option><option value="pm"${c.ap === "pm" ? " selected" : ""}>${L.pm}</option></select>` +
      `<span class="tf-face" aria-hidden="true"><span class="tf-w">${c.ap === "am" ? L.am : L.pm}</span>${ICON.chev}</span></span></span>`;
  }
  // A time field's value: { mins }, { empty: true } or { bad: true }.
  function readClock(input) {
    const sel = $(`#${input.id}-ap`), p = parseClock(input.value);
    if (p === null) return { empty: true };
    if (p === false) return { bad: true };
    return { mins: to24(p.h, p.m, p.ap || sel.value) };
  }
  // On leaving a time field: its words tidied («630» → «6:30»), and a 24-hour time setting its ص / م.
  function tidyClock(input) {
    const p = parseClock(input.value);
    if (!p) return;
    input.value = `${p.h}:${String(p.m).padStart(2, "0")}`;
    if (p.ap) setAp($(`#${input.id}-ap`), p.ap);
  }
  function setAp(sel, ap) {
    sel.value = ap;
    $(".tf-w", sel.parentNode).textContent = ap === "am" ? L.am : L.pm;
  }
  const head2 = (sec, extra = "") => `<header class="dlg-head"><h2 id="ed-${sec}-title" tabindex="-1"><span class="ed-name">${L.sec[sec]}</span>${extra}</h2>` +
    `<button class="icon-btn dlg-x" type="button" data-close aria-label="${L.close}">${ICON.close}</button></header>`;
  const foot = `<footer class="dlg-foot"><button class="rbtn ed-cancel" type="button" data-close>${L.cancel}</button>` +
    `<button class="rbtn rbtn-primary ed-save" type="submit">${L.save}</button></footer>`;

  /* ---- the crowd's window: capacity (a figure: its label over its field, «شخصًا» after it), then «المستويات» and the
   * four levels, each a row on the card's columns: the key and the word, «حتى», the limit (a percent field), and the
   * people it holds as typed. The top level follows Busy: «فوق 57%» drawn where a field's digits stand, not a field. */
  function crowdEditor(s) {
    const t = s.thresholds, lims = [t.quietMaxPercent, t.moderateMaxPercent, t.busyMaxPercent];
    const lvRow = (i) => (i < 3
      ? `<div class="ed-row" data-lv="${i}">` +
        `<span class="ed-rl">${LEVEL_BARS(i)}<span>${L.levels[i]}</span></span>` +
        `<span class="ed-q" aria-hidden="true">${L.upTo}</span>` +
        `<span class="ed-pct">${numField(`ed-lv${i}`, lims[i], L.limitName(L.levels[i]), ` maxlength="4" aria-describedby="ed-lv${i}-ppl"`)}<span class="ed-pct-s" aria-hidden="true">%</span><span class="ed-pct-m" aria-hidden="true"></span></span>` +
        `<span class="ed-ppl" id="ed-lv${i}-ppl"></span>${fieldErr(`ed-lv${i}`)}</div>`
      : `<div class="ed-row is-top" data-lv="3">` +
        `<span class="ed-rl">${LEVEL_BARS(3)}<span>${L.levels[3]}</span></span>` +
        `<span class="ed-q">${L.above}</span>` +
        `<span class="ed-pct is-ro"><span class="ed-pct-v" id="ed-lv3-pct">${lims[2]}</span><span class="ed-pct-s">%</span></span>` +
        `<span class="ed-ppl" id="ed-lv3-ppl"></span></div>`);
    return `<form class="dlg-panel ed-panel ed-crowd" id="ed-crowd" novalidate>${head2("crowd")}
      <div class="dlg-body">
        <div class="ed-fig">
          <label class="ed-lab" for="ed-cap">${L.capacity}</label>
          <div class="ed-line">${numField("ed-cap", fmtInt(s.capacity), "", ' maxlength="13"')}<span class="ed-unit" id="ed-cap-unit"></span></div>
          ${fieldErr("ed-cap")}${fieldWarn("ed-cap")}
        </div>
        <h3 class="set-sub ed-sub" id="ed-levels-title">${L.levelsTitle}</h3>
        <div class="ed-list ed-levels" role="group" aria-labelledby="ed-levels-title">${[0, 1, 2, 3].map(lvRow).join("")}</div>
      </div>${foot}</form>`;
  }

  /* ---- the hours' window: «توقيت الرياض» beside its name, as on the card; the week from Sunday, a row per day: the
   * day, its switch (open or closed), the opening and the closing (12-hour, ص / م), and the note beside the closing
   * («اليوم التالي», «24 ساعة»). «يفتح» and «يغلق» head the two field columns once. A closed day says «مغلق» where its
   * fields stood and keeps them, so switching it back brings its hours back; a day closed when the window opened takes
   * the week's most common hours when switched on. */
  function commonHours(week) {
    const tally = new Map();
    for (const d of DAYS) if (week[d]) { const k = `${week[d].open}|${week[d].close}`; tally.set(k, (tally.get(k) || 0) + 1); }
    const best = [...tally.entries()].sort((a, b) => b[1] - a[1])[0];
    return best ? { open: hm(best[0].split("|")[0]), close: hm(best[0].split("|")[1]) } : { open: 6 * 60, close: 0 };
  }
  function hoursEditor(s) {
    const week = s.weeklySchedule, dflt = commonHours(week);
    const dayRow = (d, i) => {
      const h = week[d], on = Boolean(h);
      return `<div class="ed-row ed-day${on ? "" : " is-off"}" id="ed-${d}" data-day="${d}">` +
        `<span class="ed-rl ed-dn" id="ed-${d}-name"><span class="dn-full">${L.days[i]}</span><span class="dn-short" aria-hidden="true">${L.daysShort[i]}</span></span>` +
        `<button class="switch ed-sw" type="button" role="switch" id="ed-${d}-sw" aria-checked="${on}" data-init="${on}" aria-label="${esc(L.swName(L.days[i]))}"><span class="switch-track"><span class="switch-thumb"></span></span></button>` +
        timeField(`ed-${d}-open`, h ? hm(h.open) : dflt.open, L.openName(L.days[i])) +
        timeField(`ed-${d}-close`, h ? hm(h.close) : dflt.close, L.closeName(L.days[i])) +
        `<span class="ed-closed">${L.closed}</span>` +
        `<span class="ed-note" id="ed-${d}-note"></span>${fieldErr(`ed-${d}`)}</div>`;
    };
    const unit = `<span class="set-unit">${SR_SEP}${L.hoursUnit}</span>`;
    return `<form class="dlg-panel ed-panel ed-hours" id="ed-hours" novalidate>${head2("hours", unit)}
      <div class="dlg-body">
        <div class="ed-list ed-week" role="group" aria-labelledby="ed-hours-title">
          <div class="ed-heads" aria-hidden="true"><span class="eh-o">${L.opensHead}</span><span class="eh-c">${L.closesHead}</span></div>
          ${DAYS.map(dayRow).join("")}
        </div>
        <div class="ed-warns" id="ed-week-warns" hidden>${fieldWarn("ed-week")}${fieldWarn("ed-week2")}${fieldWarn("ed-week3")}</div>
      </div>${foot}</form>`;
  }

  /* ---- the business day's window: its two figures, each a label over its field: the end of the business day (a
   * time), the reset (minutes, «دقائق بعد الإغلاق» after them, following the number). */
  function dayEditor(s) {
    return `<form class="dlg-panel ed-panel ed-dayp" id="ed-day" novalidate>${head2("day")}
      <div class="dlg-body">
        <div class="ed-fig">
          <label class="ed-lab" for="ed-end">${L.dayEnd}</label>
          <div class="ed-line">${timeField("ed-end", hm(s.businessDayBoundary), L.dayEnd)}</div>
          ${fieldErr("ed-end")}${fieldWarn("ed-end")}
        </div>
        <div class="ed-fig">
          <label class="ed-lab" for="ed-reset">${L.reset}</label>
          <div class="ed-line">${numField("ed-reset", fmtInt(s.resetBufferMinutes), "", ' maxlength="13"')}<span class="ed-unit" id="ed-reset-unit"></span></div>
          ${fieldErr("ed-reset")}${fieldWarn("ed-reset")}
        </div>
      </div>${foot}</form>`;
  }
  const EDITOR_HTML = { crowd: crowdEditor, hours: hoursEditor, day: dayEditor };

  /* ---- reading a window: { value, errors } where value holds what parsed (for the people, the notes and the
   * sentences while typing) and errors maps a field's id to its message. */
  function readCrowd() {
    const errors = new Map(), cap = parseWhole($("#ed-cap").value);
    let capacity = null;
    if (cap === null) errors.set("ed-cap", L.err.capEmpty);
    else if (Number.isNaN(cap)) errors.set("ed-cap", L.err.capWhole);
    else if (cap < 1) errors.set("ed-cap", L.err.capMin);
    else if (cap > MAX_INT) errors.set("ed-cap", L.err.capMax);
    else capacity = cap;
    const lims = [0, 1, 2].map((i) => {
      const v = parseWhole($(`#ed-lv${i}`).value);
      if (v === null) { errors.set(`ed-lv${i}`, L.err.limEmpty(L.levels[i])); return null; }
      if (Number.isNaN(v) || v > 100) { errors.set(`ed-lv${i}`, L.err.limRange); return null; }
      return v;
    });
    // Strictly rising: the message stands on the level that must be higher.
    for (let i = 1; i < 3; i++) {
      const prev = lims[i - 1] ?? (i === 2 ? lims[0] : null);
      const prevLv = lims[i - 1] !== null ? i - 1 : 0;
      if (lims[i] !== null && prev !== null && lims[i] <= prev && !errors.has(`ed-lv${i}`)) errors.set(`ed-lv${i}`, L.err.limRise(L.levels[prevLv], prev));
    }
    return { errors, value: { capacity, lims } };
  }
  function readHours() {
    const errors = new Map(), week = {};
    DAYS.forEach((d) => {
      const on = $(`#ed-${d}-sw`).getAttribute("aria-checked") === "true";
      if (!on) { week[d] = null; return; }
      const o = readClock($(`#ed-${d}-open`)), c = readClock($(`#ed-${d}-close`));
      const msg = o.empty ? L.err.openEmpty : o.bad ? L.err.timeBad : c.empty ? L.err.closeEmpty : c.bad ? L.err.timeBad : "";
      if (msg) { errors.set(`ed-${d}`, msg); ROW_AT.set(`ed-${d}`, o.empty || o.bad ? "open" : "close"); week[d] = undefined; return; }
      week[d] = { open: hhmm(o.mins), close: hhmm(c.mins) };
    });
    return { errors, value: { week } };
  }
  function readDay() {
    const errors = new Map(), e = readClock($("#ed-end")), r = parseWhole($("#ed-reset").value);
    let boundary = null, reset = null;
    if (e.empty) errors.set("ed-end", L.err.timeEmpty);
    else if (e.bad) errors.set("ed-end", L.err.timeBad);
    else boundary = e.mins;
    if (r === null) errors.set("ed-reset", L.err.resetEmpty);
    else if (Number.isNaN(r)) errors.set("ed-reset", L.err.resetWhole);
    else if (r > MAX_INT) errors.set("ed-reset", L.err.resetMax);
    else reset = r;
    return { errors, value: { boundary, reset } };
  }
  const READ = { crowd: readCrowd, hours: readHours, day: readDay };
  // The snapshot a valid window would save: the saved one with this card's values replaced.
  function applyEdit(sec, v, base) {
    const next = clone(base);
    if (sec === "crowd") {
      next.capacity = v.capacity;
      next.thresholds = { quietMaxPercent: v.lims[0], moderateMaxPercent: v.lims[1], busyMaxPercent: v.lims[2] };
    } else if (sec === "hours") next.weeklySchedule = v.week;
    else { next.businessDayBoundary = hhmm(v.boundary); next.resetBufferMinutes = v.reset; }
    return next;
  }

  /* ---- the sentences about values that look like a mistake (item 49), computed from what is typed and, for what this
   * window does not hold, from what is saved. */
  const daysAt = (idx) => L.daysAt(idx.length, daysName(idx).text);
  // The days whose opening hours hold a business day ending at b (strictly inside: at an opening or a closing is fine).
  function boundaryDays(week, b) {
    const out = [];
    DAYS.forEach((d, i) => {
      const h = week[d];
      if (!h) return;
      const o = hm(h.open);
      let c = hm(h.close);
      if (c <= o) c += 1440;
      if ((b > o && b < c) || (b + 1440 > o && b + 1440 < c)) out.push(i);
    });
    return out;
  }
  // The days on which the gym has opened before the reset that follows the closing before them (close + buffer).
  function resetDays(week, buffer) {
    const out = new Set();
    DAYS.forEach((d, i) => {
      const h = week[d];
      if (!h) return;
      const o = hm(h.open);
      let c = hm(h.close);
      if (c <= o) c += 1440;
      for (let k = 1; k <= 7; k++) {
        const n = week[DAYS[(i + k) % 7]];
        if (!n) continue;
        if (c + buffer > k * 1440 + hm(n.open)) out.add((i + k) % 7);
        break;
      }
    });
    return [...out].sort((a, b) => a - b);
  }
  function warnings(sec, v) {
    const saved = current().editable, out = {};
    if (sec === "crowd" && v.capacity !== null) {
      if (v.capacity * 2 < saved.capacity) out["ed-cap"] = L.warn.capLow(L.people(saved.capacity));
      else if (v.capacity > saved.capacity * 2) out["ed-cap"] = L.warn.capHigh(L.people(saved.capacity));
    }
    if (sec === "hours") {
      // A day whose times are still being typed counts as neither open nor closed: the sentences speak of the others.
      const lines = [], week = Object.fromEntries(DAYS.map((d) => [d, v.week[d] || null]));
      if (DAYS.every((d) => v.week[d] === null)) lines.push(L.warn.allClosed);
      else {
        const b = boundaryDays(week, hm(saved.businessDayBoundary));
        if (b.length) lines.push(L.warn.boundaryHours(timeText(hm(saved.businessDayBoundary)), daysAt(b)));
        const r = resetDays(week, saved.resetBufferMinutes);
        if (r.length) lines.push(L.warn.resetHours(daysAt(r)));
      }
      lines.forEach((l, k) => { out[["ed-week", "ed-week2", "ed-week3"][k]] = l; });
    }
    if (sec === "day") {
      if (v.boundary !== null) { const b = boundaryDays(saved.weeklySchedule, v.boundary); if (b.length) out["ed-end"] = L.warn.boundary(daysAt(b)); }
      if (v.reset !== null) { const r = resetDays(saved.weeklySchedule, v.reset); if (r.length) out["ed-reset"] = L.warn.reset(daysAt(r)); }
    }
    return out;
  }
  const WARN_IDS = { crowd: ["ed-cap"], hours: ["ed-week", "ed-week2", "ed-week3"], day: ["ed-end", "ed-reset"] };

  /* English: each limit's sign follows its digits, their width measured in the field's own face. A window opened before
   * the fonts arrived (?edit=crowd on a fresh load) measured the fallback face, so every open field is measured again
   * when the fonts are ready and whenever more of them finish loading. */
  function measurePct() {
    if (RTL) return;
    $$(".ed-pct:not(.is-ro)").forEach((box) => {
      if (!box.getClientRects().length) return;
      const m = $(".ed-pct-m", box);
      m.textContent = $("input", box).value;
      box.style.setProperty("--pct-x", `${m.getBoundingClientRect().width}px`);
    });
  }
  document.fonts.ready.then(measurePct);
  document.fonts.addEventListener("loadingdone", measurePct);
  /* ---- live: what follows the typing at once (the people, the notes, the units). */
  function live(sec) {
    const { value: v } = READ[sec](), s0 = current().editable;
    if (sec === "crowd") {
      const cap = v.capacity;
      $("#ed-cap-unit").textContent = L.capUnit(cap ?? s0.capacity);
      const lims = v.lims;
      const lastOk = lims[2] !== null;
      // English: each limit's sign follows its digits (their width measured in the field's own face).
      measurePct();
      $("#ed-lv3-pct").textContent = lastOk ? String(lims[2]) : "";
      $("#ed-lv3-pct").parentNode.classList.toggle("is-empty", !lastOk);
      // A level's people only while its limit and those under it are valid and strictly rising: a refused limit shows
      // no count that would contradict the level under it.
      const rising = (i) => lims.slice(0, Math.min(i + 1, 3)).every((x, k, a) => x !== null && (k === 0 || x > a[k - 1]));
      [0, 1, 2, 3].forEach((i) => {
        $(`#ed-lv${i}-ppl`).innerHTML = cap !== null && rising(i) ? peoplePhrase(cap, lims, i) : "";
      });
    } else if (sec === "hours") {
      // With every day closed the two field columns stand empty, so their heads step aside (their line kept).
      $(".ed-heads").classList.toggle("is-idle", DAYS.every((d) => $(`#ed-${d}-sw`).getAttribute("aria-checked") !== "true"));
      DAYS.forEach((d) => {
        const row = $(`.ed-day[data-day="${d}"]`), on = $(`#ed-${d}-sw`).getAttribute("aria-checked") === "true";
        row.classList.toggle("is-off", !on);
        const o = readClock($(`#ed-${d}-open`)), c = readClock($(`#ed-${d}-close`));
        const note = !on || o.mins === undefined || c.mins === undefined ? "" : c.mins === o.mins ? L.allDay(24) : c.mins < o.mins ? L.nextDay : "";
        $(`#ed-${d}-note`).innerHTML = note;
      });
    } else {
      $("#ed-reset-unit").textContent = L.resetUnit(v.reset ?? s0.resetBufferMinutes);
    }
  }

  /* ---- messages under fields: an error (FLD-4, --err with its mark, the field's edge in --err) or a sentence about a
   * value that looks like a mistake (--ink-2 with an information mark, the field unchanged). A field is described by
   * what stands under it. A change to the window's height settles its edges (MOT-15). */
  const msgEl = (id, kind) => $(`#${id}-${kind}`);
  // Which part of a day's row a message is about («open» or «close»), from the last reading of the week.
  const ROW_AT = new Map();
  // The controls a message belongs to: a number field; a time field's two parts; in a day's row, the part it names.
  function partsOf(id) {
    const el = $(`#${id}`);
    if (!el) return { frames: [], inputs: [] };
    if (el.matches(".tf-in")) return { frames: [el.closest(".tf")], inputs: [el, $(`#${id}-ap`)] };
    if (el.matches("input")) return { frames: [el], inputs: [el] };
    const at = ROW_AT.get(id) || "open", tf = $(`[data-tf="${id}-${at}"]`, el);
    return { frames: tf ? [tf] : [], inputs: tf ? $$(".tf-in, .tf-sel", tf) : [] };
  }
  // A control is described by what stands under it (its own description, a level's people, first).
  function describe(id) {
    const ids = ["err", "warn"].map((k) => msgEl(id, k)).filter((e) => e && !e.hidden).map((e) => e.id);
    const row = $(`#${id}`);
    const all = row && !row.matches("input") ? $$(".tf-in, .tf-sel", row) : partsOf(id).inputs;
    for (const input of all) {
      const list = [...(input.dataset.describedby || "").split(" ").filter(Boolean), ...ids];
      if (list.length) input.setAttribute("aria-describedby", list.join(" ")); else input.removeAttribute("aria-describedby");
    }
  }
  function setMsg(id, kind, html) {
    const el = msgEl(id, kind);
    if (!el) return;
    el.hidden = !html;
    el.dataset.text = html || "";
    el.innerHTML = html ? `${kind === "err" ? ICON.alert : ICON.note}<span>${html}</span>` : "";
    if (kind === "err") {
      const row = $(`#${id}`);
      if (row && !row.matches("input")) $$(".tf", row).forEach((f) => f.classList.remove("is-invalid"));
      if (row && !row.matches("input")) $$(".tf-in, .tf-sel", row).forEach((i) => i.removeAttribute("aria-invalid"));
      const { frames, inputs } = partsOf(id);
      frames.forEach((f) => f.classList.toggle("is-invalid", Boolean(html)));
      inputs.forEach((i) => { if (html) i.setAttribute("aria-invalid", "true"); else i.removeAttribute("aria-invalid"); });
    }
    describe(id);
  }
  const shownText = (id, kind) => { const el = msgEl(id, kind); return el && !el.hidden ? el.dataset.text : ""; };
  const dlgOf = (sec) => D[sec];
  // The sentences: on leaving a field (add = true) any that now apply come; while typing only those that stop applying go.
  function refreshWarnings(sec, { add = false } = {}) {
    const { value } = READ[sec]();
    const want = warnings(sec, value);
    const ids = WARN_IDS[sec];
    const next = ids.map((id) => {
      const w = want[id] || "";
      return [id, add ? w : (w && shownText(id, "warn") ? w : "")];
    });
    const diff = next.filter(([id, html]) => shownText(id, "warn") !== html);
    if (!diff.length) return;
    M.reflow(dlgOf(sec), () => {
      diff.forEach(([id, html]) => setMsg(id, "warn", html));
      const box = $("#ed-week-warns");
      if (sec === "hours" && box) box.hidden = ids.every((id) => msgEl(id, "warn").hidden);
    });
  }
  // Errors leave as soon as their field is right; they come only on «حفظ».
  function clearFixedErrors(sec) {
    const { errors } = READ[sec]();
    const shown = $$(".field-err:not([hidden])", $(`#ed-${sec}`)).map((e) => e.id.replace(/-err$/, ""));
    const gone = shown.filter((id) => !errors.has(id));
    if (!gone.length) return;
    M.reflow(dlgOf(sec), () => gone.forEach((id) => setMsg(id, "err", "")));
  }

  /* ---- the window: open, close, submit. One <dialog> per card holds the editor and, after it, one step panel that
   * takes the editor's place in turn, as Access's code dialog does (DLG-11 then DLG-9): the scrim never leaves, the
   * panel keeps the editor's width, and its edges settle around the new step (MOT-15). The steps: the confirmation, the
   * conflict view, the question before closing with something typed. The editor stays in the window, hidden, with what
   * was typed, so «رجوع» brings it back as it was left. */
  const D = { crowd: $("#dlg-crowd"), hours: $("#dlg-hours"), day: $("#dlg-day") };
  const mqPhone = matchMedia("(max-width: 720px)");
  const panelOf = (dlg) => $$(":scope > .dlg-panel", dlg).find((p) => !p.hidden) || null;
  const focusables = (el) => $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', el)
    .filter((x) => !x.disabled && x.tabIndex >= 0 && !x.closest("[hidden]") && x.getClientRects().length);
  let editing = null;                                 // the section whose window is open
  /* The open window's flow: its step ("edit", "confirm", "conflict", "discard"), the snapshot a confirmation was
   * computed from (base) and would save (next), the reason as typed (kept across the steps until the window closes),
   * where «رجوع» and «متابعة التعديل» return focus (from), and whether an application is on its way (busy). */
  let flow = null;
  const ME = "o1";                                    // the signed-in owner (فهد)
  function openDialog(dlg, opener, first) {
    if (openDlg) closeDialog(openDlg.dlg, { instant: true, quiet: true });
    if (frame.state.railOpen) frame.setRail(false);
    if (frame.state.openLayer) frame.hideLayer(frame.state.openLayer, false);
    openDlg = { dlg, opener };
    dlg.showModal();
    dlg.classList.add("is-open");
    (first || focusables(panelOf(dlg))[0]).focus();
    M.dialogOpen(dlg);
  }
  function closeDialog(dlg, { instant = false, back = null, quiet = false } = {}) {
    if (!openDlg || openDlg.dlg !== dlg) return;
    M.dialogClose(dlg, { instant });
    const { opener } = openDlg;
    openDlg = null;
    editing = null;
    flow = null;
    dlg.dataset.busy = "false";
    dlg.classList.remove("is-open");
    if (dlg.open) dlg.close();
    if (quiet) return;
    const to = back || (opener && opener.isConnected ? opener : $(`[data-edit="${dlg.dataset.sec}"]`));
    (to || $("#main")).focus();
  }
  /* Where focus starts: from 721 px the window's first field (DLG-3), so the owner types at once. On a phone the
   * window's title instead: a field focused on opening would raise the keyboard over half the sheet before the owner
   * has seen the values; the first tap on a field raises it. */
  function firstFocus(sec) {
    if (mqPhone.matches) return $(`#ed-${sec}-title`);
    if (sec === "crowd") return $("#ed-cap");
    if (sec === "hours") { const d = DAYS.find((x) => $(`#ed-${x}-sw`).getAttribute("aria-checked") === "true"); return d ? $(`#ed-${d}-open`) : $("#ed-sun-sw"); }
    return $("#ed-end");
  }
  // A field's own description (a level's people) is kept apart from its messages.
  const keepDescribed = (el) => $$("[aria-describedby]", el).forEach((i) => { i.dataset.describedby = i.getAttribute("aria-describedby"); });
  function openEditor(sec, opener) {
    const dlg = D[sec];
    dlg.dataset.sec = sec;
    dlg.innerHTML = `<div class="dlg-scrim" data-close="scrim"></div>${EDITOR_HTML[sec](current().editable)}` +
      `<form class="dlg-panel st-panel" id="st-${sec}" data-sec="${sec}" novalidate hidden></form>`;
    dlg.setAttribute("aria-labelledby", `ed-${sec}-title`);
    dlg.removeAttribute("aria-describedby");
    dlg.removeAttribute("role");
    keepDescribed(dlg);
    editing = sec;
    flow = { sec, step: "edit", base: null, next: null, reason: "", from: null, busy: false, mode: null };
    live(sec);
    openDialog(dlg, opener, firstFocus(sec));
    if (!RTL && sec === "crowd") live(sec);           // the signs measured once the window is laid out
  }
  // Anything typed, switched or chosen since the window opened (or, after a conflict, unlike what is saved now).
  const isDirty = (sec) => $$("[data-init]", $(`#ed-${sec}`)).some((el) => (el.matches("[role=switch]") ? el.getAttribute("aria-checked") : el.value) !== el.dataset.init);
  function submitEdit(sec) {
    $$(".tf-in", $(`#ed-${sec}`)).forEach(tidyClock);
    $$("#ed-cap, #ed-reset", $(`#ed-${sec}`)).forEach(tidyCount);
    live(sec);
    const { errors, value } = READ[sec]();
    const wantWarn = errors.size ? {} : warnings(sec, value);
    // A sentence the owner has not seen yet (it would have come on leaving the field) stops this press, so it is read
    // before anything goes on; the next «حفظ» goes on with the value accepted (DECISIONS item 49).
    const unseen = Object.keys(wantWarn).filter((id) => shownText(id, "warn") !== wantWarn[id]);
    const shownErr = $$(".field-err", $(`#ed-${sec}`)).map((e) => e.id.replace(/-err$/, ""));
    M.reflow(D[sec], () => {
      shownErr.forEach((id) => setMsg(id, "err", errors.get(id) || ""));
      if (!errors.size) {
        WARN_IDS[sec].forEach((id) => setMsg(id, "warn", wantWarn[id] || ""));
        const box = $("#ed-week-warns");
        if (sec === "hours" && box) box.hidden = WARN_IDS.hours.every((id) => msgEl(id, "warn").hidden);
      }
    });
    if (errors.size) {
      const first = [...errors.keys()][0], el = $(`#${first}`);
      (el.matches("input") ? el : $(`#${first}-${ROW_AT.get(first) || "open"}`)).focus();
      return;
    }
    const base = current().editable, next = applyEdit(sec, value, base);
    if (!changes(base, next).length) { closeDialog(D[sec]); say(L.noChange); return; }
    if (unseen.length) {
      const id = unseen[0], el = $(`#${id}`);
      if (el?.matches("input")) el.focus();
      say(wantWarn[id].replace(/<[^>]+>/g, ""));
      return;
    }
    showConfirm(sec, base, next);
  }

  /* ================================================================ the steps after «حفظ» (part 3 of this round)
   * The confirmation (DECISIONS item 49): the card's name in a question, what the step does in one sentence, each change
   * from → to in the history's own words (the record the log will keep), the people that follow for the crowd, the
   * optional reason (240 characters, AMD-S1), then «رجوع» and «تطبيق تغييري / تطبيق الآن». Its button does not repeat the
   * editor's «حفظ» (the coordinator's ruling): «تطبيق الآن» names what this step does that the first did not, the values
   * become live, for the visitors' page where they reach it, at once (no later date, item 49); a second «حفظ» would read
   * as the first one having failed. Working, done, each refusal and the conflict view follow it in the same panel. */
  const stEl = (sec) => $(`#st-${sec}`);
  const edEl = (sec) => $(`#ed-${sec}`);
  const closeX = `<button class="icon-btn dlg-x" type="button" data-close aria-label="${L.close}">${ICON.close}</button>`;
  const stHead = (sec, title, x = true) => `<header class="dlg-head"><h2 id="st-${sec}-title" tabindex="-1">${title}</h2>${x ? closeX : ""}</header>`;
  // A change as the history will name it: what, then from, the arrow along the reading line, and to (LOG-1's words);
  // here the new value carries the weight (from in --ink-2, to in chalk). Said in full to assistive technology.
  const changeItems = (list) => list.map((c) => `<li class="cf-row"><span class="cf-what" aria-hidden="true">${c.what}</span>` +
    `<span class="cf-fig" aria-hidden="true"><span class="cf-from">${c.from}</span><span class="cf-to">${ARROW}<span>${c.to}</span></span></span>` +
    `<span class="sr-only">${esc(c.said)}</span></li>`).join("");
  const limsOf = (s) => [s.thresholds.quietMaxPercent, s.thresholds.moderateMaxPercent, s.thresholds.busyMaxPercent];
  const risingOk = (s) => { const l = limsOf(s); return l[0] < l[1] && l[1] < l[2]; };
  const plain = (h) => String(h).replace(/<[^>]+>/g, "");
  /* The crowd's confirmation keeps the people (the open point, decided): the ruled list is exactly what the record will
   * say (capacity, a limit: the history's words), and after it, quieter and unruled, the people each level holds before
   * → after, as the user kept them from the skeleton's second pass, so a change of capacity or of a limit shows what the
   * visitors will see at each count, in the people the owner thinks in, without being counted as a change. Only levels
   * whose people change; Packed starts where Busy ends, so its line would only repeat Busy's; no level key (the one red
   * mark in the window would pull the eye from the change to its consequence). A level no count reaches says «لا يظهر». */
  function peopleItems(a, b) {
    const la = limsOf(a).map((p) => lastCount(a.capacity, p)), lb = limsOf(b).map((p) => lastCount(b.capacity, p));
    const at = (last, i) => (i > 0 && last[i] === last[i - 1] ? null : last[i]);
    let out = "";
    for (let i = 0; i < 3; i++) {
      const x = at(la, i), y = at(lb, i);
      if (x === y) continue;
      const from = x === null ? L.never : L.pplUpTo(ltr(fmtInt(x)));
      const to = y === null ? L.never : L.people(y);
      out += `<li class="cf-row is-ppl"><span class="cf-what" aria-hidden="true">${L.levels[i]}</span>` +
        `<span class="cf-fig" aria-hidden="true"><span class="cf-from">${nw(from)}</span><span class="cf-to">${ARROW}${nw(to)}</span></span>` +
        `<span class="sr-only">${esc(L.pplSaid(L.levels[i], x === null ? null : fmtInt(x), y === null ? null : plain(to)))}</span></li>`;
    }
    return out;
  }
  // The reason (FLD-9): a text area, three lines growing with its words, 240 characters (what the log stores); from 200
  // typed it says what is left, said to assistive technology at 40, 20, 10 and none.
  function reasonField(sec) {
    const id = `st-${sec}-reason`;
    return `<div class="field cf-reason"><label class="field-label" for="${id}">${L.reasonLabel}</label>` +
      `<textarea class="field-input cf-reason-in" id="${id}" name="${id}" rows="3" maxlength="240" dir="auto" spellcheck="true"></textarea>` +
      `<p class="cf-left" id="${id}-left" hidden></p></div>`;
  }
  function showLeft(t, announce = true) {
    const left = 240 - t.value.length, el = $(`#${t.id}-left`);
    el.hidden = left > 40;
    el.textContent = left <= 40 ? L.left(left) : "";
    if (left <= 40) t.setAttribute("aria-describedby", el.id); else t.removeAttribute("aria-describedby");
    if (announce && [40, 20, 10, 0].includes(left) && t.dataset.said !== String(left)) { t.dataset.said = String(left); say(L.left(left)); }
  }
  const alertBox = (sec) => `<div class="alert st-alert" id="st-${sec}-alert" role="alert" hidden></div>`;
  const keepReason = (sec) => { const r = $(".cf-reason-in", stEl(sec)); if (r && flow) flow.reason = r.value; };
  // A step takes the editor's place (or the step before it); the panel settles around it.
  function showStep(sec, html) {
    const dlg = D[sec], ed = edEl(sec), st = stEl(sec);
    keepReason(sec);
    M.reflow(dlg, () => {
      ed.hidden = true;
      st.hidden = false;
      st.innerHTML = html;
      dlg.setAttribute("aria-labelledby", `st-${sec}-title`);
      const desc = $(`#st-${sec}-desc`, st);
      if (desc) dlg.setAttribute("aria-describedby", desc.id); else dlg.removeAttribute("aria-describedby");
      if (flow.step === "discard") dlg.setAttribute("role", "alertdialog"); else dlg.removeAttribute("role");
    });
  }
  // Back to the editor, as it was left; focus where the owner left it (the «حفظ» that led on, or the field they were in).
  function showEditor(sec, to) {
    const dlg = D[sec], ed = edEl(sec), st = stEl(sec);
    keepReason(sec);
    flow.step = "edit";
    M.reflow(dlg, () => {
      st.hidden = true;
      st.innerHTML = "";
      ed.hidden = false;
      dlg.setAttribute("aria-labelledby", `ed-${sec}-title`);
      dlg.removeAttribute("aria-describedby");
      dlg.removeAttribute("role");
    });
    (to && to.isConnected && ed.contains(to) ? to : $(".ed-save", ed)).focus();
  }
  function showConfirm(sec, base, next) {
    const list = changes(base, next), many = list.length > 1;
    const ppl = sec === "crowd" ? peopleItems(base, next) : "";
    Object.assign(flow, { base, next, step: "confirm", from: document.activeElement });
    showStep(sec, `${stHead(sec, L.cf.title(sec, many))}
      <div class="dlg-body">
        <p class="dlg-desc" id="st-${sec}-desc">${L.cf.desc[sec](many)}</p>
        <div class="cf-grid"><ul class="cf-list" aria-label="${esc(L.cf.listName)}">${changeItems(list)}</ul>` +
        `${ppl ? `<ul class="cf-list cf-ppl" aria-label="${esc(L.cf.pplName)}">${ppl}</ul>` : ""}</div>
        ${reasonField(sec)}
        ${alertBox(sec)}
      </div>
      <footer class="dlg-foot"><button class="rbtn st-back" type="button" data-back>${L.back}</button>` +
      `<button class="rbtn rbtn-primary st-do" type="submit">${stack(L.applyNow, L.applying)}</button></footer>`);
    const r = $(`#st-${sec}-reason`);
    r.value = flow.reason;
    showLeft(r, false);
    // From 721 px the reason (DLG-8): the owner may say why at once, and «تطبيق الآن» is never one Enter away. On a
    // phone the title, as in the editor: a focused field would raise the keyboard over the list of changes.
    (mqPhone.matches ? $(`#st-${sec}-title`) : r).focus();
  }

  /* ---- working, then the answer. Synthetic answers from the contract: success by default; ?refuse=<code> makes the
   * first application return that code, once (bad_request: 400; unauthorized: 401; forbidden: 403;
   * settings_version_conflict: 409); ?fail=1 makes the first one fail (500), once; ?hold=1 keeps it working. Working
   * (STA-15): «تطبيق الآن» rolls to «جارٍ التطبيق…» (MOT-14) and keeps its width and focus, `aria-busy`; «رجوع», the
   * close button, the reason, Escape and the scrim wait: values already sent cannot be called back. It shows for the
   * answer's 700 ms, never under 400 ms (STA-9). */
  const REFUSE = params.get("refuse"), FAIL = params.get("fail") === "1", HOLD = params.get("hold") === "1";
  const REFUSALS = ["bad_request", "unauthorized", "forbidden", "settings_version_conflict"];
  let refuseUsed = false, failUsed = false, held = HOLD, pending = null;
  const LATENCY = 700;
  function answer() {
    if (REFUSALS.includes(REFUSE) && !refuseUsed) { refuseUsed = true; return { refuse: REFUSE }; }
    if (FAIL && !failUsed) { failUsed = true; return { fail: true }; }
    return { ok: true };
  }
  const run = (fn) => {
    pending = fn;
    if (held) return;
    setTimeout(() => { if (pending === fn && !held) { pending = null; fn(); } }, LATENCY);
  };
  const releaseAnswer = () => { const f = pending; pending = null; if (f) f(); };
  // A button's two labels share one cell (its width is the wider's); only the current one is seen and read.
  const setLabels = (btn, second) => {
    const [a, b] = btn.querySelectorAll(".rb-l");
    if (!a || !b) return;
    if (second) { a.setAttribute("aria-hidden", "true"); b.removeAttribute("aria-hidden"); }
    else { a.removeAttribute("aria-hidden"); b.setAttribute("aria-hidden", "true"); }
  };
  const setOff = (el, on) => { if (on) el.setAttribute("aria-disabled", "true"); else el.removeAttribute("aria-disabled"); };
  function setBusy(sec, on) {
    const st = stEl(sec), doBtn = $(".st-do", st);
    flow.busy = on;
    D[sec].dataset.busy = String(on);
    if (doBtn) {
      setLabels(doBtn, on);
      setOff(doBtn, on);
      if (on) doBtn.setAttribute("aria-busy", "true"); else doBtn.removeAttribute("aria-busy");
    }
    $$(".st-back, .dlg-x", st).forEach((x) => setOff(x, on));
    $$(".cf-reason-in", st).forEach((i) => { i.readOnly = on; });
  }
  // The alert (EMP-2) under the list: what happened, that nothing changed, what to do. A refusal no retry can mend sets
  // the action aside and the way out takes focus (DLG-10): «رجوع» to the editor where its values can be mended (400),
  // «إغلاق» where nothing typed here can mend it (401 signed out, 403 not an owner), which closes at once; a failure
  // keeps the action, which is the retry.
  function setAlert(sec, text, moot, out = false) {
    const st = stEl(sec), a = $(`#st-${sec}-alert`, st);
    a.innerHTML = `${ICON.alert}<span>${text}</span>`;
    a.hidden = false;
    if (moot) $(".st-do", st).hidden = true;
    if (out) {
      const b = $(".st-back", st);
      b.removeAttribute("data-back");
      b.dataset.close = "now";
      b.textContent = L.close;
    }
  }
  function clearAlert(sec) {
    const st = stEl(sec), a = $(`#st-${sec}-alert`, st);
    if (a) { a.hidden = true; a.innerHTML = ""; }
  }
  function applyStep(sec) {
    if (!flow || flow.busy || (flow.step !== "confirm" && !(flow.step === "conflict" && flow.mode === "apply"))) return;
    keepReason(sec);
    M.reflow(D[sec], () => { clearAlert(sec); setBusy(sec, true); });
    run(() => {
      if (!flow || flow.sec !== sec) return;
      const r = answer();
      if (r.refuse === "settings_version_conflict") { showConflict(sec); return; }
      if (r.refuse) {
        M.reflow(D[sec], () => { setBusy(sec, false); setAlert(sec, L.refuse[r.refuse], true, r.refuse !== "bad_request"); });
        $(".st-back", stEl(sec)).focus();
        return;
      }
      if (r.fail) { M.reflow(D[sec], () => { setBusy(sec, false); setAlert(sec, L.failed, false); }); return; }
      commit(sec);
    });
  }
  /* Done: the window closes (its picture leaves as it was, working, MOT-9); the cards behind already show the new
   * values and the history its new record, with the reason as typed; the done sentence stands under the changed card's
   * head and takes focus (its ring when a key led there), and is announced. */
  // Where the done line lands (Access's MOT-17): a line it adds where the head cannot hold it, or takes away from the
  // card that held the last one, makes the blocks below slide instead of jumping (motion.js flip); the record the
  // change wrote arrives at the top of the history in the same movement (flip's list, DECISIONS item 38), the oldest of
  // the three leaving under the card's edge; «لا تغييرات أقدم» slides down under it in the same movement.
  const blocks = () => [
    ...Object.entries(cardEl).map(([k, el]) => [`card:${k}`, el]),
    ...["crowd", "hours", "day"].flatMap((k) => $$(".set-figs > .set-fig, .set-sub, .set-dl > .set-row", cardEl[k]).map((el, i) => [`${k}:${i}`, el])),
    ...$$(".log-end", cardEl.log).map((el) => ["log:end", el]),
  ];
  const logList = { box: cardEl.log, rows: () => $$(".log-list > .log-rec:not(.is-ph)", cardEl.log).map((li) => [li.dataset.v, li]),
    words: ".log-what, .log-fig, .log-meta, .log-why", empty: ".log-none" };
  function commit(sec) {
    const reason = flow.reason.trim(), many = changes(flow.base, flow.next).length > 1, id = nextRecordId++, next = flow.next;
    closeDialog(D[sec], { quiet: true });
    M.flip(blocks, () => {
      versions.push({ version: current().version + 1, date: "2026-09-23", mins: NOW_MIN, by: ME, reason: reason ? { raw: reason } : null, editable: next, id });
      notice = { at: sec, many, id };
      renderAll();
    }, { list: logList });
    const n = $("#notice");
    if (n) { n.focus(); M.done(n, { line: true, delay: M.T.lineAfterClose }); }
    say(L.done(many));
  }

  /* ---- the conflict view (409, settings_version_conflict; DECISIONS items 49 and 78). Another save came first: the
   * page reads the settings again, so the cards behind show what is saved now (and the history its record); the view
   * takes the confirmation's place and says so without naming anyone, when it was saved, then two lists: «المحفوظ الآن»,
   * what that save changed (from what this window started from), and «تغييرك», what applying would change now (from
   * what is saved now to what was typed), with the reason. What was typed is kept: the values the owner changed stay,
   * those they did not follow what is saved now, so nothing they did not touch is put back, and nothing is applied
   * without being listed. «تطبيق تغييري» applies it against the new version; «رجوع» returns to the editor, which
   * holds the same. When what was typed is already saved, there is nothing to apply and «إغلاق» closes; when it no
   * longer fits (a limit now at or under the one below it), «رجوع» leads to the editor's own refusal. */
  // The save that came first (synthetic): capacity 120 → 150 and Friday from 4:00 PM, a minute ago, by the signed-in
  // owner, the likely case (the same owner on another device, item 78), with no reason. ?other=limits adds Busy at 45%,
  // so a Moderate typed at 45% or more no longer fits under it (the view's third form, "clash").
  const OTHER_LIMITS = params.get("other") === "limits";
  const OTHER = (s) => {
    s.capacity = 150;
    if (s.weeklySchedule.fri) s.weeklySchedule.fri = { ...s.weeklySchedule.fri, open: "16:00" };
    if (OTHER_LIMITS) s.thresholds = { ...s.thresholds, busyMaxPercent: 45 };
  };
  // Which of the window's values the owner changed (against what each field opened with).
  function touched(sec) {
    const ed = edEl(sec);
    const num = (id) => { const el = $(`#${id}`, ed); return parseWhole(el.value) !== parseWhole(el.dataset.init); };
    const time = (id) => {
      const el = $(`#${id}`, ed), sel = $(`#${id}-ap`, ed), p = parseClock(el.dataset.init);
      return readClock(el).mins !== (p ? to24(p.h, p.m, p.ap || sel.dataset.init) : null) || sel.value !== sel.dataset.init;
    };
    if (sec === "crowd") return { cap: num("ed-cap"), lims: [0, 1, 2].map((i) => num(`ed-lv${i}`)) };
    if (sec === "day") return { end: time("ed-end"), reset: num("ed-reset") };
    return Object.fromEntries(DAYS.map((d) => {
      const sw = $(`#ed-${d}-sw`, ed), on = sw.getAttribute("aria-checked") === "true";
      return [d, String(on) !== sw.dataset.init || (on && (time(`ed-${d}-open`) || time(`ed-${d}-close`)))];
    }));
  }
  // What applying would save now: what is saved now, with the values the owner changed.
  function overlay(sec, latest) {
    const t = touched(sec), { value: v } = READ[sec](), mine = clone(latest);
    if (sec === "crowd") {
      if (t.cap) mine.capacity = v.capacity;
      ["quietMaxPercent", "moderateMaxPercent", "busyMaxPercent"].forEach((k, i) => { if (t.lims[i]) mine.thresholds[k] = v.lims[i]; });
    } else if (sec === "day") {
      if (t.end) mine.businessDayBoundary = hhmm(v.boundary);
      if (t.reset) mine.resetBufferMinutes = v.reset;
    } else DAYS.forEach((d) => { if (t[d]) mine.weeklySchedule[d] = v.week[d]; });
    return mine;
  }
  // The editor drawn again with those values, each field's starting value now what is saved now, so it is "changed"
  // only where it differs from what is saved.
  function rebuildEditor(sec, values, init) {
    const old = edEl(sec), tmp = document.createElement("div"), ref = document.createElement("div");
    tmp.innerHTML = EDITOR_HTML[sec](values);
    ref.innerHTML = EDITOR_HTML[sec](init);
    const fresh = tmp.firstElementChild;
    $$("[data-init]", ref).forEach((r) => { const f = fresh.querySelector(`#${CSS.escape(r.id)}`); if (f) f.dataset.init = r.dataset.init; });
    fresh.hidden = old.hidden;
    old.replaceWith(fresh);
    keepDescribed(fresh);
    live(sec);
  }
  function showConflict(sec) {
    keepReason(sec);
    const oldBase = flow.base, latest = clone(current().editable);
    OTHER(latest);
    versions.push({ version: current().version + 1, date: "2026-09-23", mins: NOW_MIN - 1, by: ME, reason: null, editable: latest, id: nextRecordId++ });
    renderAll();
    const mine = overlay(sec, latest);
    rebuildEditor(sec, mine, latest);
    const saved = changes(oldBase, latest), yours = changes(latest, mine);
    const mode = !risingOk(mine) ? "clash" : yours.length ? "apply" : "same";
    const t = timeText(NOW_MIN - 1), why = flow.reason.trim();
    Object.assign(flow, { base: latest, next: mine, mode, step: "conflict", busy: false });
    D[sec].dataset.busy = "false";
    const whyRow = why ? `<li class="cf-row is-why"><span class="cf-what">${L.reasonRow}</span><span class="cf-fig"><q class="cf-q"><bdi dir="auto">${esc(why)}</bdi></q></span></li>` : "";
    showStep(sec, `${stHead(sec, L.cx.title)}
      <div class="dlg-body">
        <p class="dlg-desc" id="st-${sec}-desc">${L.cx[mode](t)}</p>
        <div class="cf-grid">
          <h3 class="cf-sub" id="st-${sec}-saved">${L.cx.saved}</h3>
          <ul class="cf-list" aria-labelledby="st-${sec}-saved">${changeItems(saved)}</ul>
          ${mode === "same" ? "" : `<h3 class="cf-sub" id="st-${sec}-yours">${L.cx.yours}</h3><ul class="cf-list" aria-labelledby="st-${sec}-yours">${changeItems(yours)}${whyRow}</ul>`}
        </div>
        ${alertBox(sec)}
      </div>
      <footer class="dlg-foot">${mode === "same" ? `<button class="rbtn st-back" type="button" data-close="now">${L.close}</button>`
        : `<button class="rbtn st-back" type="button" data-back>${L.back}</button>${mode === "apply" ? `<button class="rbtn rbtn-primary st-do" type="submit">${stack(L.applyMine, L.applying)}</button>` : ""}`}</footer>`);
    // Focus on the way on that changes nothing (DLG-10's form), and the view said once.
    $(".st-back", stEl(sec)).focus();
    say(`${L.cx.title}. ${plain(L.cx[mode](t))}`);
  }

  /* ---- closing with something typed asks first (DECISIONS item 49, and the coordinator's ruling: Escape, the close
   * button and «إلغاء» alike; the scrim already keeps the window). The user's kept second-pass question, for a window:
   * «إغلاق دون حفظ؟», what is lost, «متابعة التعديل» (focused: never one Enter from losing anything), then «إغلاق دون
   * حفظ» (BTN-10, the destructive commit). With nothing typed, the window closes at once. Leaving the page itself (a
   * reload, the back button, closing the tab; the page behind the window is inert, so no link is in reach) gets the
   * browser's own question while a window holds typed values or is applying them. */
  function requestClose(sec, from) {
    if (!flow || flow.busy) return;
    if (isDirty(sec)) askDiscard(sec, from);
    else closeDialog(D[sec]);
  }
  function askDiscard(sec, from) {
    if (from && edEl(sec).contains(from)) flow.from = from;
    flow.step = "discard";
    showStep(sec, `${stHead(sec, L.ds.title, false)}<div class="dlg-body"><p class="dlg-desc" id="st-${sec}-desc">${L.ds.desc(L.sec[sec])}</p></div>` +
      `<footer class="dlg-foot"><button class="rbtn st-back" type="button" data-back>${L.ds.keep}</button>` +
      `<button class="rbtn rbtn-danger st-discard" type="button" data-discard>${L.ds.discard}</button></footer>`);
    $(".st-back", stEl(sec)).focus();
  }
  // Escape steps back one layer: from a step to the editor; from the editor, a close (which asks first if needed).
  function onEscape(sec) {
    if (!flow || flow.busy) return;
    if (flow.step === "conflict" && flow.mode === "same") closeDialog(D[sec]);
    else if (flow.step !== "edit") showEditor(sec, flow.from);
    else requestClose(sec, document.activeElement);
  }
  // Escape is the window's, in every step: it is taken before the browser's own dialog handling, which closes a
  // dialog after a refused cancel and would lose what was typed.
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !openDlg || !flow) return;
    e.preventDefault();
    e.stopPropagation();
    onEscape(flow.sec);
  }, true);
  window.addEventListener("beforeunload", (e) => {
    if (flow && (flow.busy || isDirty(flow.sec))) { e.preventDefault(); e.returnValue = ""; }
  });

  // «تعديل» on a card, and a folded record's control (each card is drawn whole, so the listener is the grid's).
  gridEl.addEventListener("click", (e) => {
    const b = e.target.closest("[data-edit]");
    if (b && phase === "ready") openEditor(b.dataset.edit, b);
    const r = e.target.closest(".log-open");
    if (r && phase === "ready") openRecord(Number(r.dataset.rec), r);
  });
  // The record's window: read only, so every way out closes it at once.
  DREC.addEventListener("cancel", (e) => { e.preventDefault(); closeRecord(); });
  DREC.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) { e.preventDefault(); closeRecord(); } });
  DREC.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const list = focusables(panelOf(DREC));
    if (!list.length) return;
    const first = list[0], last = list[list.length - 1];
    if (e.shiftKey && (document.activeElement === first || !DREC.contains(document.activeElement) || document.activeElement.id === "rec-title")) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || !DREC.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
  });
  for (const [sec, dlg] of Object.entries(D)) {
    // A close request the keyboard listener above did not see (a system back gesture) goes the same way.
    dlg.addEventListener("cancel", (e) => { e.preventDefault(); onEscape(sec); });
    // Should the browser close the window anyway, it opens again at once, with what was typed.
    dlg.addEventListener("close", () => { if (openDlg && openDlg.dlg === dlg) { dlg.showModal(); dlg.classList.add("is-open"); } });
    dlg.addEventListener("click", (e) => {
      const c = e.target.closest("[data-close]"), b = e.target.closest("[data-back]"), x = e.target.closest("[data-discard]");
      const hit = c || b || x;
      if (!hit) return;
      e.preventDefault();
      // While working, «رجوع», the close button and the scrim wait.
      if (!flow || flow.busy || hit.getAttribute("aria-disabled") === "true") return;
      if (x) { closeDialog(dlg); return; }
      if (b) { showEditor(sec, flow.from); return; }
      if (c.dataset.close === "scrim") {
        // A tap beside the window closes it only while nothing is typed, so a stray tap never throws changes away.
        if (flow.step === "edit" && !isDirty(sec)) closeDialog(dlg);
        return;
      }
      if (c.dataset.close === "now") { closeDialog(dlg); return; }
      requestClose(sec, c);
    });
    dlg.addEventListener("keydown", (e) => {
      if (e.key !== "Tab") return;
      const list = focusables(panelOf(dlg));
      if (!list.length) return;
      const first = list[0], last = list[list.length - 1];
      if (e.shiftKey && (document.activeElement === first || !dlg.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || !dlg.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
    });
    dlg.addEventListener("submit", (e) => {
      e.preventDefault();
      if (e.target.matches(".ed-panel")) submitEdit(sec);
      else applyStep(sec);
    });
    dlg.addEventListener("input", (e) => {
      const t = e.target;
      if (t.matches(".cf-reason-in")) { showLeft(t); return; }
      if (!t.closest(".ed-panel")) return;
      // Arabic-Indic digits become Western as they are typed, the caret kept.
      if (t.matches("input")) {
        const w = toWestern(t.value);
        if (w !== t.value) { const at = t.selectionStart; t.value = w; t.setSelectionRange(at, at); }
      }
      if (t.matches(".tf-sel")) setAp(t, t.value);
      live(sec);
      clearFixedErrors(sec);
      refreshWarnings(sec);
    });
    dlg.addEventListener("change", (e) => {
      const t = e.target;
      if (!t.closest(".ed-panel")) return;
      if (t.matches(".tf-in")) tidyClock(t);
      if (t.matches("#ed-cap, #ed-reset")) tidyCount(t);
      if (t.matches(".tf-sel")) setAp(t, t.value);
      live(sec);
      clearFixedErrors(sec);
      refreshWarnings(sec, { add: true });
    });
    // A day's switch: open or closed, at once; the sentences about the week follow it (a switch is a decision made).
    dlg.addEventListener("click", (e) => {
      const sw = e.target.closest(".ed-sw");
      if (!sw) return;
      sw.setAttribute("aria-checked", String(sw.getAttribute("aria-checked") !== "true"));
      live(sec);
      clearFixedErrors(sec);
      refreshWarnings(sec, { add: true });
    });
  }
  // A window stays open across 720 px (BRK-10 closes the frame's own layers): it turns between a sheet and a dialog
  // with what is typed kept, in every step.

  /* ---------------------------------------------------------------- the page's states
   *   loading  0-300 ms the slots wait empty (data-load="wait"); from 300 ms the bars, at least 400 ms; one
   *            announcement at 1 s; the 10 s ceiling turns it into Error. ?arrive=<ms> brings the payload that many ms
   *            after the page opened; ?arrive=never lets the ceiling run; without it the bars are held, for review.
   *   error    the first payload could not be loaded: the header's Error and one message in place of the cards, the
   *            retry focused; it runs as an action (BTN-9), then arrives, focus on the first card's name. */
  const LOAD = { delay: 300, min: 400, say: 1000, ceiling: 10000, retry: 1200 };
  const ARRIVE = (() => { const a = params.get("arrive"); if (a === "never") return "never"; const n = Number(a); return a != null && a !== "" && Number.isFinite(n) && n >= 0 ? n : null; })();
  const load = { shownAt: null, timers: [] };
  const later = (ms, fn) => load.timers.push(setTimeout(fn, Math.max(0, ms)));
  const clearTimers = () => { load.timers.splice(0).forEach(clearTimeout); };
  function startLoading(arriveAfter) {
    clearTimers();
    phase = "loading";
    root.dataset.load = "wait";
    load.shownAt = null;
    renderAll();
    later(LOAD.delay, () => { if (phase === "loading") { root.dataset.load = "shown"; load.shownAt = performance.now(); } });
    later(LOAD.say, () => { if (phase === "loading") say(L.loadingSay); });
    if (typeof arriveAfter === "number" && arriveAfter < LOAD.ceiling) later(arriveAfter, arrive);
    if (arriveAfter === "never" || typeof arriveAfter === "number") later(LOAD.ceiling, fail);
  }
  function arrive() {
    if (phase !== "loading" && phase !== "retrying") return false;
    const now = performance.now();
    if (phase === "loading" && load.shownAt != null && now - load.shownAt < LOAD.min) { later(load.shownAt + LOAD.min - now, arrive); return false; }
    clearTimers();
    const hadFocus = Boolean(retryBtn && document.activeElement === retryBtn);
    phase = "ready";
    delete root.dataset.load;
    renderAll();
    // After a retry, focus goes where the page begins, with its ring when a key moved it and none after a pointer.
    if (hadFocus) $("#crowd-title").focus({ preventScroll: true });
    say(L.arrivedSay);
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
    setLabels(retryBtn, true);
    retryBtn.setAttribute("aria-disabled", "true");
    retryBtn.setAttribute("aria-busy", "true");
    frame.refreshStatus();
    root.dataset.phase = phase;
    later(LOAD.retry, arrive);
    later(LOAD.ceiling, fail);
    return true;
  }

  /* ---------------------------------------------------------------- start */
  renderAll();
  if (phase === "loading") startLoading(ARRIVE);
  // Hooks for the capture script. They expose state, never anything a visitor could be identified by (there is none).
  window.__settings = {
    ready: true,
    get phase() { return phase; },
    get version() { return current().version; },
    get editable() { return clone(current().editable); },
    get operational() { return { ...OPERATIONAL }; },
    people: (cap, pct) => lastCount(cap, pct),
    changes: (a, b) => changes(versions[a - 1].editable, versions[b - 1].editable).map((c) => c.said),
    // The editor: which window is open, and whether anything in it was typed.
    get editing() { return editing; },
    dirty: () => (editing ? isDirty(editing) : false),
    edit: (sec) => openEditor(sec, $(`[data-edit="${sec}"]`)),
    // The steps (part 3): the open window's step and whether it is applying; the done sentence's card; the states.
    get step() { return flow ? flow.step : null; },
    get busy() { return Boolean(flow?.busy); },
    get notice() { return notice ? notice.at : null; },
    get records() { return versions.slice(1).map((v) => v.version).reverse(); },
    arrive, fail, retry,
    set hold(v) { held = Boolean(v); },
    answer: () => releaseAnswer(),
  };
  // ?edit=crowd|hours|day opens that card's window on load (for review), as its «تعديل» would.
  const EDIT_Q = params.get("edit");
  if (EDIT_Q in D && phase === "ready") openEditor(EDIT_Q, $(`[data-edit="${EDIT_Q}"]`));
  // ?record=<version> opens that record's window on load (for review; on a phone, where the history card waits for its
  // own round, DECISIONS item 81, this is the only way to it). «latest» is the newest.
  const REC_Q = params.get("record");
  if (REC_Q && phase === "ready" && !openDlg) openRecord(REC_Q === "latest" ? current().version : Number(REC_Q), $(`.log-open[data-rec="${REC_Q === "latest" ? current().version : REC_Q}"]`));
})();
