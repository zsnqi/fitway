/* Eclipse: Settings' history, which Settings and Activity log both read. Concept only, synthetic data.
 * Every saved version of the five values the owner edits, oldest first, and what each one changed, from → to, against
 * the one before it, in the page's language. Settings' history card, its record window and its confirmation print
 * these lines, and Activity log prints them in a settings record's values place, so one change reads the same on both
 * pages (DECISIONS item 111). The words of a line live here, and Settings' cards take the same ones (`copy`, `fmt`).
 * load({ cases }) builds the history once: gym.js's records, each with the change it made; the review switches
 * ?log=none|one|every|week on both pages and ?case=<k> on Settings only (Activity log's own ?case= is another fixture);
 * then what the owner saved in this browser (demo-store.js), unless a switch draws another history.
 * A classic script, loaded after demo-store.js and gym.js, so a page works from file:// too. */
window.EclipseSettingsHistory = (() => {
  "use strict";
  const LANG = document.documentElement.lang === "en" ? "en" : "ar";
  const RTL = LANG === "ar";
  const params = new URLSearchParams(location.search);
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
  const clone = (s) => JSON.parse(JSON.stringify(s));

  // The words of a change's line, which Settings' cards use too.
  const COPY = {
    ar: {
      levels: ["هادئ", "متوسط", "مزدحم", "شديد الازدحام"],
      people: (n) => (n === 0 ? `${ltr("0")} أشخاص` : arCount(n, "شخص واحد", "شخصان", "أشخاص", "شخصًا", "شخص")),
      days: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
      closed: "مغلق",
      minutes: (n) => (n === 0 ? "" : arCount(n, "دقيقة واحدة", "دقيقتان", "دقائق", "دقيقة", "دقيقة")),
      resetAfter: (n) => (n === 0 ? "عند الإغلاق" : `${COPY.ar.minutes(n)} بعد الإغلاق`),
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
    },
    en: {
      levels: ["Quiet", "Moderate", "Busy", "Packed"],
      people: (n) => (n === 1 ? `${ltr("1")} person` : `${ltr(fmtInt(n))} people`),
      days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      closed: "Closed",
      minutes: (n) => (n === 1 ? "1 minute" : `${fmtInt(n)} minutes`),
      resetAfter: (n) => (n === 0 ? "At closing" : `${COPY.en.minutes(n)} after closing`),
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
    },
  };
  const L = COPY[LANG];

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

  let built = null;
  function load({ cases = false } = {}) {
    if (built) return built;
    /* ------------------------------------------------------------ the gym's settings (synthetic, from the contract)
     * Version 1 is the snapshot the gym started with (it has no record: the log begins with the first owner change);
     * each later version is the one before it with one owner change applied, written by the owner and at the time
     * Activity log records it (gym.js's CHANGES, versions 2-9), with its reason as typed. */
    const H = (open, close) => ({ open, close });
    const week = (f) => Object.fromEntries(DAYS.map((d, i) => [d, f(d, i)]));
    // The one gym (gym.js) gives the capacity, the limits, the moment and the changes' records.
    const V1 = {
      capacity: EclipseGym.RECORDED.capacity,
      thresholds: { quietMaxPercent: EclipseGym.RECORDED.limits[0], moderateMaxPercent: EclipseGym.RECORDED.limits[1], busyMaxPercent: EclipseGym.RECORDED.limits[2] },
      weeklySchedule: week((d) => (d === "fri" ? H("16:00", "01:00") : H("06:00", "01:00"))),
      businessDayBoundary: "03:00",
      resetBufferMinutes: 30,
    };
    const R = (ar, en) => ({ ar, en });
    // What each saved version changed; when, by whom and why are gym.js's records, which Activity log lists too.
    const APPLY = {
      2: (s) => { for (const d of DAYS) s.weeklySchedule[d].close = "00:00"; },
      3: (s) => { for (const d of DAYS) s.weeklySchedule[d] = d === "fri" ? H("21:00", "02:00") : H("20:00", "02:00"); },
      4: (s) => { for (const d of DAYS) s.weeklySchedule[d] = d === "fri" ? H("16:00", "01:00") : H("06:00", "01:00"); },
      5: (s) => { s.resetBufferMinutes = 5; },
      6: (s) => { s.businessDayBoundary = "04:00"; },
      7: (s) => { s.weeklySchedule.fri.open = "14:00"; },
      8: (s) => { s.weeklySchedule.sat.open = "08:00"; },
      9: (s) => { s.weeklySchedule.thu.close = "02:00"; },
    };
    // Every version, oldest first: { version, date, time, mins, by, reason, editable }, and a saved one's id.
    const versions = [{ version: 1, date: null, mins: null, by: null, reason: null, editable: clone(V1) }];
    for (const { ver, date, time, by, reason } of EclipseGym.CHANGES) {
      const next = clone(versions[versions.length - 1].editable);
      APPLY[ver](next);
      versions.push({ version: ver, date, time, mins: hm(time), by, reason, editable: next });
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
      versions.push({ version: versions.length + 1, date: "2026-09-23", time: "19:30:00", mins: hm("19:30"), by: "o1", reason, editable: next });
    };
    if (LOG_Q === "every") {
      pushToday((s) => {
        s.capacity = 140;
        s.thresholds = { quietMaxPercent: 20, moderateMaxPercent: 45, busyMaxPercent: 70 };
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
    if (cases && CASE_Q in CASES) pushToday(CASES[CASE_Q]);
    if (LOG_Q === "none") versions.splice(0, versions.length, { version: 1, date: null, mins: null, by: null, reason: null, editable: clone(versions[versions.length - 1].editable) });
    if (LOG_Q === "one") {
      const [a, b] = versions.slice(-2);
      versions.splice(0, versions.length, { ...a, version: 1, date: null, mins: null, by: null, reason: null }, { ...b, version: 2 });
    }
    // What the owner saved in this browser (demo-store.js): each a later version, at the demo's clock. A review switch that
    // draws another history keeps to itself (and so does the conflict's made-up other save, ?refuse, ?other).
    const DEMO = EclipseDemo.page(["log", "case", "refuse", "other"]);
    for (const r of DEMO.records("settings")) versions.push({ version: versions.length + 1, date: EclipseGym.NOW.date, mins: EclipseGym.NOW.clock, by: r.by, reason: r.reason ? { raw: r.reason, lang: r.lang } : null, editable: r.editable, id: r.id });
    // A record as Activity log lists it: each version after the first that this browser did not save, with its lines;
    // a record saved here is found by its id.
    const linesAt = (i) => changes(versions[i - 1].editable, versions[i].editable);
    built = {
      versions,
      records: () => versions.map((v, i) => (i && v.id == null ? { date: v.date, time: v.time, by: v.by, reason: v.reason, lines: linesAt(i) } : null)).filter(Boolean),
      linesOf: (id) => { const i = versions.findIndex((v) => v.id === id); return i > 0 ? linesAt(i) : null; },
    };
    return built;
  }

  return { copy: COPY, fmt: { bdi, ltr, nw, fmtInt, arCount, DAYS, hm, fmtClock, clockOf, timeText, DASH, rangeText, clone }, daysName, changes, load };
})();
