// FITWAY public crowd page (public-redesign-r01): its words. Concept only, synthetic data.
// Every line the page writes, in each language, written for itself (GLO-17); the run's COPY.md lists them side by
// side. The four level words are GLO-3's; the comparison is GLO-10's; Live, Delayed, Last reading and the age are
// GLO-9's; the count says GLO-2's "inside" and "approx." in the page's own shorter words («نحو 70 في الصالة», a
// departure); Closed and Outside opening hours are GLO-7's; the states' words are the family's (STA-10 to STA-13,
// STW-1, EMP-3), but for Unavailable's Arabic, written natively.
// public.js calls it before it builds anything, with the page's language and what the lines are made of: the clock
// (an hour, a span, an isolated run), the days and their usual hours, and now.
window.FitwayPublicCopy = function (en, h) {
  "use strict";
  var num = h.num, iso = h.iso, hourText = h.hourText, hourHtml = h.hourHtml, spanHtml = h.spanHtml, spanSpoken = h.spanSpoken;
  var dayName = h.dayName, usualAt = h.usualAt, band = h.band, splits = h.splits, quietCell = h.quietCell, busyCell = h.busyCell;
  var DAYS = h.DAYS, TODAY = h.TODAY, NOW_H = h.NOW_H, NB = h.NB, THIN = h.THIN;
  var T = en ? {
    words: { quiet: "Quiet", moderate: "Moderate", busy: "Busy", packed: "Packed" },
    usually: function (b) { return "usually " + T.words[b].toLowerCase(); },
    rightNow: "Right now",
    srNow: "Crowd right now: ",
    about: function (n) { return T.aboutOf(num(n)); },
    aboutOf: function (x) { return "About " + x + " inside"; }, // x: the number's box (Loading: its placeholder)
    full: function (p) { return T.fullOf(num(p + "%")); },
    fullOf: function (x) { return x + " full"; },
    // The arrival, said once from the header: the word's lead, the level, the count, as one sentence.
    arrival: function (k, n) { return T.srNow + T.words[k] + ", about " + n + " inside"; },
    // Under the word, so "right now" goes without saying.
    vs: {
      "much-quieter": "Much quieter than usual",
      quieter: "Quieter than usual",
      usual: "About usual",
      busier: "Busier than usual",
      "much-busier": "Much busier than usual"
    },
    live: "Live",
    readAt: function (t) { return num(t + NB + "PM"); },
    // Delayed: the last reading, said as the last, with its time and its age (GLO-9).
    srLast: "Last reading: ",
    delayed: "Delayed",
    lastAt: function (t) { return "Last reading " + iso(t + NB + "PM"); },
    comma: ",", // the age follows the time as a sentence says it, so a narrow phone parts the line after the comma
    ago: function (m) { return iso(m + NB + "min ago"); },
    // Unavailable: no count, and why none is shown (DESIGN_GUIDE §6: old data is never presented as current).
    noCount: "No count",
    noOld: "We never show an old count in its place.",
    offline: "Offline",
    // Closed: the next opening, today's (STA-11's form: the day is named only when it is another).
    closed: "Closed",
    opens: function (h) { return 'Opens <bdi class="num time">' + hourText(h) + "</bdi>"; },
    outside: "Outside opening hours",
    // Error: what failed, the one way back under it (EMP-3, EMP-5), and what to do if it fails again.
    cantLoad: "Couldn't load",
    checkConn: "Check your connection if it fails again.",
    retry: "Try again",
    retrying: "Trying again…",
    // Loading: the status line's words while the first payload is on its way, and the one announcement after 1 s.
    loading: "Loading…",
    loadingSay: "Loading how busy it is",
    usualDay: function (d) { return "A usual " + dayName(d); },
    openHours: function (d) { return 'Open <span class="num iso">' + hourText(DAYS[d].open) + THIN + "–" + THIN + hourText(DAYS[d].close) + "</span>"; },
    // The card's answer keeps one shape for today: "Quietest time left:" and when.
    quietestLeft: function (h) { return 'Quietest time left: <b class="num">' + hourHtml(h) + "</b>, " + T.usually(band(usualAt(TODAY, h))); },
    quietestSame: function (h) { return 'Quietest time left: <b>now</b> or <b class="num">' + hourHtml(h) + "</b>"; },
    nowQuietest: "Quietest time left: <b>now</b>",
    // Closed: the whole day is still ahead.
    quietestToday: function (h) { return 'Quietest time today: <b class="num">' + hourHtml(h) + "</b>, " + T.usually(band(usualAt(TODAY, h))); },
    // Another day: its card is titled "A usual …", so the line says only when; on two-hour bars, the two bars' spans.
    dayRange: function (cells, n) {
      var lo = spanHtml(quietCell(cells)), hi = spanHtml(busyCell(cells));
      return n > 1 ? 'Quietest <b class="num">' + lo + '</b>, busiest <b class="num">' + hi + "</b>"
        : 'Quietest at <b class="num">' + lo + '</b>, busiest at <b class="num">' + hi + "</b>";
    },
    // A picked hour: its usual; a two-hour bar whose hours read differently, each hour in clock order.
    cellUsual: function (c) {
      if (!splits(c)) return '<b class="num">' + spanHtml(c) + "</b>: " + T.usually(band(c.v));
      return c.us.map(function (u, j) {
        return '<span class="hr"><b class="num">' + hourHtml(c.h + j) + "</b> " + T.usually(band(u)) + (j < c.n - 1 ? " ·" : "") + "</span>";
      }).join(" ");
    },
    splitName: function (c) {
      return c.us.map(function (u, j) { return hourText(c.h + j) + " " + T.usually(band(u)); }).join(", ");
    },
    hourName: function (c, isNow, ring) {
      return spanSpoken(c) + (isNow ? ", now" : "") + ", " + T.usually(band(c.v)) + (ring ? ", the quietest time left today" : "");
    },
    now: "Now",
    todayName: function (d) { return dayName(d) + ", today"; },
    days: "Days",
    hours: "Hours",
    prevHour: "Previous hour",
    nextHour: "Next hour",
    chartName: function (d, n, withNow) {
      var D = DAYS[d], s = "A usual " + dayName(d) + (n > 1 ? " in two-hour steps, " : " by the hour, ") + hourText(D.open) + " to " + hourText(D.close);
      return withNow ? s + ", with now at " + hourText(NOW_H) : s;
    },
    concept: "Exploration concept · synthetic data",
    other: "العربية", otherLang: "ar"
  } : {
    words: { quiet: "هادئ", moderate: "متوسط", busy: "مزدحم", packed: "شديد الازدحام" },
    // The level word first, then how often: «مزدحم عادةً».
    usually: function (b) { return T.words[b] + " عادةً"; },
    rightNow: "الآن",
    srNow: "الازدحام الآن: ",
    // The English line's shape, small word, large count, small words: «نحو» says it is not an exact headcount (GLO-2's
    // rule) in one short word, so the count and the percentage hold one line down to 360 px, as the English does.
    about: function (n) { return T.aboutOf(num(n)); },
    aboutOf: function (x) { return "نحو " + x + " في الصالة"; },
    full: function (p) { return T.fullOf(num(p + "%")); },
    fullOf: function (x) { return x + " من السعة"; },
    arrival: function (k, n) { return T.srNow + T.words[k] + "، نحو " + n + " في الصالة"; },
    vs: {
      "much-quieter": "أهدأ بكثير من المعتاد",
      quieter: "أهدأ من المعتاد",
      usual: "قريب من المعتاد",
      busier: "أعلى من المعتاد",
      "much-busier": "أعلى بكثير من المعتاد"
    },
    live: "مباشر",
    readAt: function (t) { return num(t + NB + "م"); },
    srLast: "آخر قراءة: ",
    delayed: "متأخر",
    lastAt: function (t) { return "آخر قراءة " + iso(t + NB + "م"); },
    comma: "،",
    // «قبل دقيقة»، «قبل دقيقتين»، «قبل 5 دقائق»، «قبل 13 دقيقة»: the counted noun follows the number's rule.
    ago: function (m) { return iso(m === 1 ? "قبل دقيقة" : m === 2 ? "قبل دقيقتين" : "قبل " + m + NB + (m <= 10 ? "دقائق" : "دقيقة")); },
    // Unavailable: the number is not there, and why no old one stands in for it (written natively, not from "No count").
    noCount: "العدد غير متوفر",
    noOld: "لا نعرض عددًا قديمًا على أنه الحالي.",
    offline: "غير متصل",
    closed: "مغلق",
    opens: function (h) { return 'يفتح <bdi class="num time">' + hourText(h) + "</bdi>"; },
    outside: "خارج ساعات العمل",
    cantLoad: "تعذّر التحميل",
    checkConn: "تحقّق من الاتصال إن تكرّر ذلك.",
    retry: "إعادة المحاولة",
    retrying: "جارٍ المحاولة…",
    loading: "جارٍ التحميل…",
    loadingSay: "جارٍ تحميل حالة الازدحام",
    usualDay: function (d) { return "المعتاد أيام " + dayName(d); },
    openHours: function (d) { return 'مفتوح <span class="num iso">' + hourHtml(DAYS[d].open) + THIN + "–" + THIN + hourHtml(DAYS[d].close) + "</span>"; },
    quietestLeft: function (h) { return 'أهدأ ساعة متبقية: <b class="num">' + hourHtml(h) + "</b>، " + T.usually(band(usualAt(TODAY, h))); },
    quietestSame: function (h) { return 'أهدأ ساعة متبقية: <b>الآن</b> أو <b class="num">' + hourHtml(h) + "</b>"; },
    nowQuietest: "أهدأ ساعة متبقية: <b>الآن</b>",
    quietestToday: function (h) { return 'أهدأ ساعة اليوم: <b class="num">' + hourHtml(h) + "</b>، " + T.usually(band(usualAt(TODAY, h))); },
    // One shape for an hour and for a span: the card's title already names the day.
    dayRange: function (cells) {
      return 'الأهدأ <b class="num">' + spanHtml(quietCell(cells)) + '</b>، والأكثر ازدحامًا <b class="num">' + spanHtml(busyCell(cells)) + "</b>";
    },
    // Two hours that read differently are two short clauses, joined as Arabic joins them, by its comma.
    cellUsual: function (c) {
      if (!splits(c)) return '<b class="num">' + spanHtml(c) + "</b>: " + T.usually(band(c.v));
      return c.us.map(function (u, j) {
        return '<span class="hr"><b class="num">' + hourHtml(c.h + j) + "</b> " + T.usually(band(u)) + (j < c.n - 1 ? "،" : "") + "</span>";
      }).join(" ");
    },
    splitName: function (c) {
      return c.us.map(function (u, j) { return hourText(c.h + j) + " " + T.usually(band(u)); }).join("، ");
    },
    hourName: function (c, isNow, ring) {
      return spanSpoken(c) + (isNow ? "، الآن" : "") + "، " + T.usually(band(c.v)) + (ring ? "، أهدأ ساعة متبقية اليوم" : "");
    },
    now: "الآن",
    todayName: function (d) { return dayName(d) + "، اليوم"; },
    days: "الأيام",
    hours: "الساعات",
    prevHour: "الساعة السابقة",
    nextHour: "الساعة التالية",
    chartName: function (d, n, withNow) {
      var D = DAYS[d], s = "المعتاد أيام " + dayName(d) + (n > 1 ? " كل ساعتين، " : " ساعةً بساعة، ") + "من " + hourText(D.open) + " إلى " + hourText(D.close);
      return withNow ? s + "، والآن " + hourText(NOW_H) : s;
    },
    concept: "مفهوم استكشافي · بيانات افتراضية",
    other: "English", otherLang: "en"
  };
  return T;
};
