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
  var num = h.num, iso = h.iso, hourText = h.hourText, hourHtml = h.hourHtml;
  var dayName = h.dayName, band = h.band;
  var DAYS = h.DAYS, TODAY = h.TODAY, NOW_H = h.NOW_H, NB = h.NB, THIN = h.THIN;
  var T = en ? {
    words: { quiet: "Quiet", moderate: "Moderate", busy: "Busy", packed: "Packed" },
    usually: function (b) { return "usually " + T.words[b].toLowerCase(); },
    rightNow: "Right now",
    crowd: "Crowd", // the head's name where the page carries no time
    srNow: "Crowd right now: ",
    about: function (n) { return T.aboutOf(num(n)); },
    aboutOf: function (x) { return "About " + x + " inside"; }, // x: the number's box (Loading: its placeholder)
    full: function (p) { return T.fullOf(num(p + "%")); },
    fullOf: function (x) { return x + " full"; },
    // The arrival, said once from the header: the word's lead, the level, the count, as one sentence.
    arrival: function (k, n) { return T.srNow + T.words[k] + ", about " + n + " inside"; },
    // Under the word, so "right now" goes without saying.
    vs: {
      "much-quieter": "Quieter than usual",
      quieter: "Quieter than usual",
      usual: "About usual",
      busier: "Busier than usual",
      "much-busier": "Busier than usual"
    },
    live: "Live",
    readAt: function (t) { return num(t); }, // t: the clock's time, its period with it
    // Delayed: the last reading, said as the last, with its time and its age (GLO-9).
    srLast: "Last reading: ",
    delayed: "Delayed",
    lastAt: function (t) { return "Last reading " + iso(t); },
    comma: ",", // the age follows the time as a sentence says it, so a narrow phone parts the line after the comma
    ago: function (m) { return iso(m + NB + "min ago"); },
    // Unavailable: no count, and why none is shown (DESIGN_GUIDE §6: old data is never presented as current).
    noCount: "No count",
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
    openHours: function (d) { return '<span class="open-word">Open </span><span class="num iso">' + hourText(DAYS[d].open) + THIN + "–" + THIN + hourText(DAYS[d].close) + "</span>"; },
    // The quiet line, today's: the hour and how it usually is, nothing more. kind: "quiet", a quiet hour left; "less", none
    // quiet but one lighter than this hour. None lighter, the page hides the line.
    quietLine: function (h, kind) { return '<b class="num">' + hourText(h) + "</b> " + (kind === "quiet" ? T.usually("quiet") : "usually less busy"); },
    // A picked hour: its usual.
    cellUsual: function (c) { return '<b class="num">' + hourHtml(c.h) + "</b>: " + T.usually(band(c.v)); },
    hourName: function (c, isNow, ring) {
      return hourText(c.h) + (isNow ? ", now" : "") + ", " + T.usually(band(c.v)) + (ring === "day" ? ", the quietest hour of the day" : ring ? ", the quietest time left today" : "");
    },
    now: "Now",
    todayName: function (d) { return dayName(d) + ", today"; },
    days: "Days",
    hours: "Hours",
    prevHour: "Previous hour",
    nextHour: "Next hour",
    chartName: function (d, withNow) {
      var D = DAYS[d], s = "A usual " + dayName(d) + " by the hour, " + hourText(D.open) + " to " + hourText(D.close);
      return withNow ? s + ", with now at " + hourText(NOW_H) : s;
    },
    other: "العربية", otherLang: "ar",
    aboutPage: "See how busy the gym is right now against a usual day, and the quietest hour of each day."
  } : {
    words: { quiet: "هادئ", moderate: "متوسط", busy: "مزدحم", packed: "شديد الازدحام" },
    // The level word first, then how often: «مزدحم عادةً».
    usually: function (b) { return T.words[b] + " عادةً"; },
    rightNow: "الآن",
    crowd: "الازدحام",
    srNow: "الازدحام الآن: ",
    // The English line's shape, small word, large count, small words: «نحو» says it is not an exact headcount (GLO-2's
    // rule) in one short word, so the count and the percentage hold one line down to about 378 px.
    about: function (n) { return T.aboutOf(num(n)); },
    aboutOf: function (x) { return "نحو " + x + " في الصالة"; },
    full: function (p) { return T.fullOf(num(p + "%")); },
    fullOf: function (x) { return x + " من السعة"; },
    arrival: function (k, n) { return T.srNow + T.words[k] + "، نحو " + n + " في الصالة"; },
    vs: {
      "much-quieter": "أهدأ من المعتاد",
      quieter: "أهدأ من المعتاد",
      usual: "قريب من المعتاد",
      busier: "أعلى من المعتاد",
      "much-busier": "أعلى من المعتاد"
    },
    live: "مباشر",
    readAt: function (t) { return num(t); },
    srLast: "آخر قراءة: ",
    delayed: "متأخر",
    lastAt: function (t) { return "آخر قراءة " + iso(t); },
    comma: "،",
    // «قبل دقيقة»، «قبل دقيقتين»، «قبل 5 دقائق»، «قبل 13 دقيقة»: the counted noun follows the number's rule.
    ago: function (m) { return iso(m === 1 ? "قبل دقيقة" : m === 2 ? "قبل دقيقتين" : "قبل " + m + NB + (m <= 10 ? "دقائق" : "دقيقة")); },
    // Unavailable: the number is not there, and why no old one stands in for it (written natively, not from "No count").
    noCount: "العدد غير متوفر",
    offline: "غير متصل",
    closed: "مغلق",
    opens: function (h) { return 'يفتح <bdi class="num time">' + hourText(h) + "</bdi>"; },
    outside: "خارج ساعات العمل",
    cantLoad: "تعذر التحميل",
    checkConn: "تحقق من الاتصال إن تكرر ذلك.",
    retry: "إعادة المحاولة",
    retrying: "جارٍ المحاولة…",
    loading: "جارٍ التحميل…",
    loadingSay: "جارٍ تحميل حالة الازدحام",
    usualDay: function (d) { return "المعتاد أيام " + dayName(d); },
    openHours: function (d) { return '<span class="open-word">مفتوح </span><span class="num iso">' + hourHtml(DAYS[d].open) + THIN + "–" + THIN + hourHtml(DAYS[d].close) + "</span>"; },
    quietLine: function (h, kind) { return '<b class="num">' + hourText(h) + "</b> " + (kind === "quiet" ? T.usually("quiet") : "أقل زحمة عادةً"); },
    cellUsual: function (c) { return '<b class="num">' + hourHtml(c.h) + "</b>: " + T.usually(band(c.v)); },
    hourName: function (c, isNow, ring) {
      return hourText(c.h) + (isNow ? "، الآن" : "") + "، " + T.usually(band(c.v)) + (ring === "day" ? "، أهدأ ساعة في اليوم" : ring ? "، أهدأ ساعة متبقية اليوم" : "");
    },
    now: "الآن",
    todayName: function (d) { return dayName(d) + "، اليوم"; },
    days: "الأيام",
    hours: "الساعات",
    prevHour: "الساعة السابقة",
    nextHour: "الساعة التالية",
    chartName: function (d, withNow) {
      var D = DAYS[d], s = "المعتاد أيام " + dayName(d) + " ساعةً بساعة، من " + hourText(D.open) + " إلى " + hourText(D.close);
      return withNow ? s + "، والآن " + hourText(NOW_H) : s;
    },
    other: "English", otherLang: "en",
    aboutPage: "اعرف ازدحام الصالة الآن مقارنةً بالمعتاد، وأهدأ ساعة في كل يوم."
  };
  return T;
};
