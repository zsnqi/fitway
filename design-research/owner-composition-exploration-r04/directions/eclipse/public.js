// FITWAY public crowd page (public-redesign-r01). Concept only, synthetic data. Sketch 16 as the page's own files,
// Arabic by default (lang="ar" dir="rtl") and English at ?lang=en (lang="en" dir="ltr"); each language is written for
// itself (GLO-17), and the list of every line in both is the run's COPY.md.
// The level word leads the page in its corner light, one line of facts under it, and under them the usual day in the
// lit card, with now as the one lit hour on it, the quietest time left, and the other days. On the phone a dense other
// day shows one bar per two hours, by its busier hour (?hours=); the live head steps back while another day is shown
// (?head=); today's day button reads its short name ("Fri", «جمعة») with a chalk dot under it. The hour labels under
// the bars are fixed for a day (a pick, hover, focus or drag never adds, drops or moves one; the readout names the
// picked time), and a picked bar is drawn as the picked day is, its edges in chalk.
// Time runs in the reading direction: right to left in Arabic, left to right in English (the hours, the slide, the
// arrow keys, the arrival's order and the week row), all from logical properties, flex order and measured boxes.
// The six states (DESIGN_GUIDE §6), at ?state=: loading, live (the default), delayed, unavailable, closed, error. Each
// fills the same three rows of the head (the word, its facts, the status line) and keeps the head's height, so a state
// that follows another moves nothing on the page; the usual day is history and stays wherever it has arrived, but only
// Live draws a reading on it (the red hour, the Live dot, the comparison, "Now"), and only Live lights the card.
// Switches: ?lang=en (Arabic without it; the language link switches and keeps every other switch),
// ?state=loading|live|delayed|unavailable|closed|error (live), ?arrive=<ms> (with loading: the payload lands then, into
// Live; without it the load reaches the 10 s ceiling and becomes Error), ?level=quiet|moderate|busy|packed (busy; in
// Delayed, the last reading's), ?day=mon..sun (today, Friday), ?pct=off (the owner turned the percentage off),
// ?grain=medium|light|faint (the bars' grain, light), ?hours=2|1 (2: on the phone, another day whose hours would be
// narrower than a finger target shows two hours a bar; 1: every day hourly), ?head=quiet|keep (quiet: the head steps
// back while another day is shown; keep: it stays), ?hour=<0-25> (a picked hour, for frames; on a two-hour day it
// picks the bar that holds it).
(function () {
  "use strict";
  var q = new URLSearchParams(location.search);
  var page = document.querySelector(".page");
  var sign = document.getElementById("sign");
  var en = q.get("lang") === "en";
  var rtl = !en;
  document.documentElement.lang = en ? "en" : "ar";
  document.documentElement.dir = rtl ? "rtl" : "ltr";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var wide = matchMedia("(min-width: 1024px)");
  var tablet = matchMedia("(min-width: 600px) and (max-width: 1023.98px)");
  var short = matchMedia("(max-height: 820px)");
  // The ranges as the page's own attribute (CSS, [data-range]): the phone, the tablet, the computer, and a short
  // computer (data-short). The page can then be laid out as the range beside it for a moment and measured (fit).
  function rangeNow() { return wide.matches ? "computer" : tablet.matches ? "tablet" : "phone"; }
  function setRange(r) { page.setAttribute("data-range", r); page.toggleAttribute("data-short", r === "computer" && short.matches); }
  function range() { return page.getAttribute("data-range"); }
  function isWide() { return range() === "computer"; }
  setRange(rangeNow());

  // ---------------------------------------------------------------------------------------------------------------
  // The state. Live is the default. Loading turns into Live when its payload lands (?arrive=) or into Error at the
  // ceiling; Error's one retry lands into Live. Delayed, Unavailable and Closed hold for the page's life (concept).
  // ---------------------------------------------------------------------------------------------------------------
  var STATES = ["loading", "live", "delayed", "unavailable", "closed", "error"];
  var state = STATES.indexOf(q.get("state")) >= 0 ? q.get("state") : "live";
  page.setAttribute("data-state", state);
  var arriveAt = state === "loading" && /^\d+$/.test(q.get("arrive") || "") ? +q.get("arrive") : null;
  // What a state has: the usual day (history, arrived with the payload), a reading of now (Live only).
  function hasDay() { return state !== "loading" && state !== "error"; }
  function isLive() { return state === "live"; }

  // ---------------------------------------------------------------------------------------------------------------
  // Synthetic data. One room (about 120 at full, never shown), one Friday, the last reading at 7:41 PM. Delayed's last
  // reading came 13 minutes before now (7:28 PM); Closed is Friday at 11:20 AM, before the gym opens at 1 PM.
  // ---------------------------------------------------------------------------------------------------------------
  var LEVELS = {
    quiet: { n: 18, pct: 15 },
    moderate: { n: 41, pct: 34 },
    busy: { n: 70, pct: 58 },
    packed: { n: 96, pct: 80 }
  };
  var levelKey = LEVELS[q.get("level")] ? q.get("level") : "busy";
  var level = LEVELS[levelKey];
  page.setAttribute("data-level", levelKey);
  var pctOn = q.get("pct") !== "off";
  if (!pctOn) page.setAttribute("data-pct", "off");
  // The bars' grain: three strengths for the user to choose by eye (CSS, --gs).
  var GRAINS = ["medium", "light", "faint"];
  page.setAttribute("data-grain", GRAINS.indexOf(q.get("grain")) >= 0 ? q.get("grain") : "light");
  // The phone's hours on a dense other day: two hours a bar (2, the default) or every day hourly (1, sketch 15).
  var HOURS = q.get("hours") === "1" ? 1 : 2;
  // An hour narrower than this on the phone is too narrow for a finger: WCAG 2.5.8's minimum target (24 CSS px; the
  // hours stand side by side with no spacing, so an hour's own width is its target). Today, 12 hours, stays above it
  // down to 360 px; Saturday's 16 hours and the weekdays' 20 and 21 fall under it.
  var FINGER = 24;
  // The head while another day is shown: steps back (quiet, the default) or stays as it is (keep, sketch 15).
  page.setAttribute("data-head", q.get("head") === "keep" ? "keep" : "quiet");

  // The usual day: the average inside for each hour the gym is open, over past weeks. Hours run from the opening hour;
  // an hour past 23 is after midnight (24 is the 12 AM hour). Hours are the finest grain. Each day carries its names
  // in both languages: the full name (the card's title, the spoken names) and the short one (the day buttons).
  var DAYS = {
    mon: { name: ["Monday", "الاثنين"], short: ["Mon", "اثنين"], open: 5, close: 25, usual: [16, 31, 36, 27, 19, 16, 15, 18, 16, 14, 17, 26, 41, 56, 68, 76, 70, 52, 36, 21] },
    tue: { name: ["Tuesday", "الثلاثاء"], short: ["Tue", "ثلاثاء"], open: 5, close: 25, usual: [15, 29, 35, 25, 18, 15, 14, 17, 15, 13, 15, 23, 37, 51, 62, 69, 64, 48, 32, 19] },
    wed: { name: ["Wednesday", "الأربعاء"], short: ["Wed", "أربعاء"], open: 5, close: 25, usual: [13, 26, 32, 24, 17, 14, 13, 16, 14, 12, 14, 21, 34, 47, 58, 64, 61, 47, 33, 20] },
    thu: { name: ["Thursday", "الخميس"], short: ["Thu", "خميس"], open: 5, close: 26, usual: [12, 24, 29, 22, 16, 13, 12, 15, 13, 12, 14, 20, 30, 40, 49, 55, 58, 54, 46, 36, 22] },
    fri: { name: ["Friday", "الجمعة"], short: ["Fri", "جمعة"], open: 13, close: 25, usual: [22, 18, 21, 30, 43, 55, 62, 67, 51, 29, 35, 31] },
    sat: { name: ["Saturday", "السبت"], short: ["Sat", "سبت"], open: 8, close: 24, usual: [18, 24, 33, 41, 44, 38, 30, 27, 35, 46, 55, 60, 58, 47, 34, 21] },
    sun: { name: ["Sunday", "الأحد"], short: ["Sun", "أحد"], open: 5, close: 25, usual: [14, 28, 34, 26, 18, 15, 14, 17, 15, 13, 16, 24, 38, 52, 63, 71, 66, 50, 34, 20] }
  };
  var L = en ? 0 : 1; // the language's index in the names
  function dayName(d) { return DAYS[d].name[L]; }
  function dayShort(d) { return DAYS[d].short[L]; }
  // Now, by the gym's clock: 7:41 PM in the 7 PM hour, or 11:20 AM before Friday's 1 PM opening (Closed). Today's
  // closing, 1 AM, is the card's "Open 1 PM – 1 AM".
  var TODAY = "fri", NOW_H = state === "closed" ? 11 : 19, READ_AT = "7:41", LAST_AT = "7:28", AGO = 13;
  // The week from Sunday in both languages: Saudi Arabia's first day and the calendar week of the Owner pages (GLO-13).
  // It runs in the reading direction, so Sunday stands at the right in Arabic and at the left in English.
  var WEEK = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  var SPAN0 = 24, SPAN1 = 0;
  var busiestUsual = 0;
  Object.keys(DAYS).forEach(function (k) {
    var d = DAYS[k];
    SPAN0 = Math.min(SPAN0, d.open); SPAN1 = Math.max(SPAN1, d.close);
    busiestUsual = Math.max(busiestUsual, Math.max.apply(null, d.usual));
  });
  // One scale for every day: the week's busiest usual hour with a little air, or the live count where it runs over
  // that. Never the gym's capacity, so no height reads back into one. The same scale in every state, so a reading that
  // arrives or goes never rescales the usual day under it.
  var TOP = Math.ceil(Math.max(busiestUsual * 1.1, level.n * 1.04));

  function usualAt(d, h) { var D = DAYS[d]; return h >= D.open && h < D.close ? D.usual[h - D.open] : null; }
  function band(v) { return v < 30 ? "quiet" : v < 60 ? "moderate" : v < 90 ? "busy" : "packed"; }
  function lowest(d, from) {
    var D = DAYS[d], best = null;
    for (var h = Math.max(D.open, from); h < D.close; h++) if (best === null || usualAt(d, h) < usualAt(d, best)) best = h;
    return best;
  }
  // A day's bars: one per hour, or one per two hours counted from the opening hour (an odd last hour stands alone, at
  // an hour's width, so the clock stays true). A two-hour bar stands for its busier hour: its height, its word, its
  // spoken name and the day's quietest and busiest all use it, so the page never promises a quieter time than one of
  // its hours usually is. Each hour's own usual is kept (us), so a picked bar can tell its hours apart.
  function cellsOf(d, n) {
    var D = DAYS[d], out = [];
    for (var h = D.open; h < D.close; h += n) {
      var k = Math.min(n, D.close - h), us = [];
      for (var j = 0; j < k; j++) us.push(usualAt(d, h + j));
      out.push({ h: h, n: k, v: Math.max.apply(null, us), us: us, i: out.length });
    }
    return out;
  }
  // Whether a bar's hours read differently: a two-hour bar whose two hours fall in different words.
  function splits(c) { return c.n > 1 && c.us.some(function (u) { return band(u) !== band(c.us[0]); }); }
  function quietCell(cells) { return cells.reduce(function (a, c) { return c.v < a.v ? c : a; }); }
  function busyCell(cells) { return cells.reduce(function (a, c) { return c.v > a.v ? c : a; }); }

  // ---------------------------------------------------------------------------------------------------------------
  // The clock. Gym time on a 12-hour clock, Western digits in both languages (NUM-1): «7 م», "7 PM". An hour and its
  // period never part (a no-break space, DAT-4), and a time or a span in a line is one isolated, unbreakable run
  // (.iso, NUM-3), so the sentence around it never reorders it. A span shares its period where both ends do, unspaced
  // (DAT-3): "6–8 PM", «6–8 م»; a span whose ends each keep their own period (across noon or midnight, and the day's
  // hours) takes a thin space each side of the dash: "10 AM – 12 PM", «10 ص – 12 م». Every Arabic span reads from the
  // right, as the sentence, the bars and the day's hours do: its first hour stands at the right (an RTL run, so the en
  // dash puts the later number to its left), and one card never runs two ways (a departure from DAT-3's isolated
  // left-to-right «6–8 م», for this page). The word joiner after an unspaced dash (U+2060) keeps the span whole even
  // outside its run.
  // ---------------------------------------------------------------------------------------------------------------
  var NB = " ", THIN = " ", WJ = "⁠";
  function half(h) { return h % 24 < 12 ? (en ? "AM" : "ص") : (en ? "PM" : "م"); }
  function n12(h) { return h % 24 % 12 || 12; }
  function hourText(h) { return n12(h) + NB + half(h); } // plain text: the labels and the spoken names
  function iso(html) { return '<span class="iso">' + html + "</span>"; }
  function hourHtml(h) { return iso(hourText(h)); }
  function spanHtml(c) {
    if (c.n === 1) return hourHtml(c.h);
    var a = c.h, b = c.h + c.n;
    if (half(a) !== half(b)) return iso(hourHtml(a) + THIN + "–" + THIN + hourHtml(b));
    return iso(n12(a) + "–" + WJ + n12(b) + NB + half(b));
  }
  // A span spoken: "6 to 8 PM", «من 6 إلى 8 م».
  function spanSpoken(c) {
    if (c.n === 1) return hourText(c.h);
    var a = c.h, b = c.h + c.n, same = half(a) === half(b);
    return en ? (same ? n12(a) : hourText(a)) + " to " + hourText(b) : "من " + (same ? n12(a) : hourText(a)) + " إلى " + hourText(b);
  }

  // The quietest full hour still ahead today, held against now. The page never sends the visitor to a later hour
  // that is usually busier than it is right now: "now" when the live count is clearly under that hour's usual, "same"
  // when it is within a tenth of it, "later" when the later hour is clearly quieter. Without a reading of now (every
  // state but Live) only the usual can answer, so it names the later hour: the quietest left, by the usual alone.
  var quietLeft = lowest(TODAY, NOW_H + 1);
  var leftUsual = quietLeft != null ? usualAt(TODAY, quietLeft) : null;
  var nowVsLeft = quietLeft == null ? "none" : level.n < leftUsual * 0.9 ? "now" : level.n <= leftUsual * 1.1 ? "same" : "later";
  function ringHour() {
    if (!hasDay() || quietLeft == null) return null;
    if (!isLive()) return quietLeft;
    return nowVsLeft === "later" || nowVsLeft === "same" ? quietLeft : null;
  }

  // Today against a usual Friday at this hour: a reading of now, so Live's alone (and always the open gym's 7 PM: the
  // head's held height is Live's, worked out in every state and at every level).
  var usualNow = usualAt(TODAY, 19);
  var COMPARISONS = ["much-quieter", "quieter", "usual", "busier", "much-busier"];
  function vsOf(n) { var r = n / usualNow; return r < 0.6 ? "much-quieter" : r < 0.9 ? "quieter" : r <= 1.1 ? "usual" : r <= 1.4 ? "busier" : "much-busier"; }
  var vs = vsOf(level.n);
  // The live hour's grain runs the way today runs against the usual: up when busier, down when quieter (CSS, Motion).
  function setFlow() {
    page.removeAttribute("data-flow"); page.removeAttribute("data-much");
    if (!isLive()) return;
    page.setAttribute("data-flow", vs.indexOf("busier") >= 0 ? "up" : vs.indexOf("quieter") >= 0 ? "down" : "still");
    if (vs.indexOf("much") === 0) page.setAttribute("data-much", "");
  }

  // ---------------------------------------------------------------------------------------------------------------
  // Copy: every line the page writes, in each language, is public-copy.js's (the run's COPY.md lists them), made
  // from the page's clock, days and data.
  // ---------------------------------------------------------------------------------------------------------------
  var num = function (x) { return '<bdi class="num">' + x + "</bdi>"; };
  var T = window.FitwayPublicCopy(en, {
    num: num, iso: iso, hourText: hourText, hourHtml: hourHtml, spanHtml: spanHtml, spanSpoken: spanSpoken,
    dayName: dayName, usualAt: usualAt, band: band, splits: splits, quietCell: quietCell, busyCell: busyCell,
    DAYS: DAYS, TODAY: TODAY, NOW_H: NOW_H, NB: NB, THIN: THIN
  });

  // The page's own lines in the markup: the concept's label and the language link, which names the other language in
  // its own words and opens this page in it with every other switch kept.
  document.querySelectorAll(".concept").forEach(function (n) { n.textContent = T.concept; });
  var langLink = document.querySelector(".lang"), there = new URLSearchParams(q);
  if (en) there.delete("lang"); else there.set("lang", "en");
  langLink.textContent = T.other;
  langLink.lang = T.otherLang;
  langLink.hreflang = T.otherLang;
  langLink.href = location.pathname + (String(there) ? "?" + there : "");
  // One polite voice for the page, in the header, never inside a busy region: loading after 1 s, and the arrival.
  var say = document.createElement("p");
  say.className = "sr-only";
  say.setAttribute("aria-live", "polite");
  document.querySelector(".top").appendChild(say);
  function speak(text) { say.textContent = ""; setTimeout(function () { say.textContent = text; }, 50); }

  // Icons, drawn: one stroke, one weight. Up and down are the reading's own, not the line's, so they never mirror;
  // nor do the states' marks (ICO-5).
  var ICON = {
    up: '<svg class="ic" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8 13.5V3M3.5 7.5 8 3l4.5 4.5"/></svg>',
    down: '<svg class="ic" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8 2.5V13M3.5 8.5 8 13l4.5-4.5"/></svg>',
    level: '<svg class="ic" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 6h11M2.5 10h11"/></svg>',
    // The quietest hour left's own mark: the ring the chart draws over that hour.
    ring: '<svg class="ic ic-ring" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="4.25"/></svg>',
    // The states' marks (STW-1): Delayed's clock, Unavailable's struck circle, Error's alert.
    clock: '<svg class="ic st" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.25"/><path d="M8 4.75V8l2.25 1.5"/></svg>',
    struck: '<svg class="ic st" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.25"/><path d="M3.6 12.4 12.4 3.6"/></svg>',
    alert: '<svg class="ic st" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.25"/><path d="M8 4.6v4.1M8 11.2v.2"/></svg>',
    // The step keys' chevron, drawn towards the later hour (CSS turns it with the reading direction and the key).
    chev: '<svg class="ic" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M6.25 3.5 10.75 8l-4.5 4.5"/></svg>'
  };
  function vsIcon(c) { return c.indexOf("quieter") >= 0 ? ICON.down : c === "usual" ? ICON.level : ICON.up; }

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  // A line with no words yet (a placeholder's, the empty readout's) carries an unseen strut in the language's face, so
  // it stands as tall as the line of words that replaces it: in Arabic the Arabic letter mark (U+061C, which only
  // Readex Pro's Arabic face covers; the Arabic face sits deeper than the Latin strut), in English a zero-width space.
  var STRUT = String.fromCharCode(en ? 0x200b : 0x061c);
  // A placeholder (PH-1): one flat bar where a value is awaited, as tall as its digits' ink, a typical value wide.
  function ph(w) { return '<i class="ph" style="--w:' + w + '"></i>' + STRUT; }
  // A number awaited: the bar fills the number's own held room, in the number's own box (its line is the digits' face).
  function phNum(w) { return num('<i class="ph" style="--w:' + w + '"></i>'); }

  // ---------------------------------------------------------------------------------------------------------------
  // The head: the word, and under it two rows (the facts; the status line, which in Live leads with the comparison).
  // Every state writes into the same rows, and the head holds the height Live gives it (holdHead), so a state that
  // follows another moves nothing. Live: the level, the count and the percentage, the comparison and "Live" with its
  // time. Delayed: the same reading in --ink-2, said as the last one, with its time and its age, the comparison gone.
  // Unavailable: no count, why none is shown, Offline. Closed: Closed, the next opening, outside opening hours. Error:
  // what failed, what to do, the one retry. Loading: Live's own rows and boxes, the words real and placeholders where
  // the values will stand (in the rooms the readings hold), and "Loading…" in the stamp's room.
  // A level (lk, the page's own by default) and a comparison (cmp, the level's own) can be given, so the head can be
  // held at the tallest any reading writes (hold).
  // ---------------------------------------------------------------------------------------------------------------
  function rowsHtml(s, lk, cmp) {
    var facts, line, word, lv = LEVELS[lk || levelKey];
    cmp = cmp || vsOf(lv.n);
    if (s === "live" || s === "delayed") {
      word = '<span class="sr-only">' + (s === "live" ? T.srNow : T.srLast) + '</span><span class="level">' + T.words[lk || levelKey] + "</span>";
      facts = '<p class="facts"><span class="count-line">' + T.about(lv.n) + "</span>" + (pctOn ? '<span class="pct">' + T.full(lv.pct) + "</span>" : "") + "</p>";
      line = s === "live"
        ? '<p class="vs">' + vsIcon(cmp) + "<span>" + T.vs[cmp] + '</span></p><p class="stamp"><i class="dot" aria-hidden="true"></i><b>' + T.live + "</b> · " + T.readAt(READ_AT) + "</p>"
        : '<p class="stamp st-late">' + ICON.clock + '<span class="iso"><b>' + T.delayed + "</b> · " + T.lastAt(LAST_AT) + T.comma + '</span> <span class="ago">' + T.ago(AGO) + "</span></p>";
    } else if (s === "unavailable") {
      word = '<span class="level">' + T.noCount + "</span>";
      facts = '<p class="facts note">' + T.noOld + "</p>";
      line = '<p class="stamp">' + ICON.struck + "<b>" + T.offline + "</b></p>";
    } else if (s === "closed") {
      // «يفتح 1 م» / "Opens 1 PM" is one run, as "About 70 inside" is: its words a word space from the time.
      word = '<span class="level">' + T.closed + "</span>";
      facts = '<p class="facts"><span class="count-line">' + T.opens(DAYS[TODAY].open) + "</span></p>";
      line = '<p class="stamp"><i class="ring-mark" aria-hidden="true"></i><b>' + T.outside + "</b></p>";
    } else if (s === "error") {
      word = '<span class="level">' + T.cantLoad + "</span>";
      facts = '<p class="facts act"><button class="retry" type="button">' + T.retry + "</button></p>";
      line = '<p class="stamp err">' + ICON.alert + "<span>" + T.checkConn + "</span></p>";
    } else { // loading: Live's rows, the awaited values waiting in their own slots and rooms, so the reading lands in place
      word = '<span class="level">' + ph("2.3em") + "</span>";
      facts = '<p class="facts"><span class="count-line">' + T.aboutOf(phNum("var(--count-w)")) + "</span>" + (pctOn ? '<span class="pct">' + T.fullOf(phNum("var(--pct-w)")) + "</span>" : "") + "</p>";
      line = '<p class="vs"><i class="ph-ic"></i><span>' + ph("var(--ph-vs)") + '</span></p><p class="stamp"><span class="loading-words">' + T.loading + "</span></p>";
    }
    return { word: word, sub: facts + line };
  }

  // ---------------------------------------------------------------------------------------------------------------
  // A day as hour bars: the picked day's opening hours fill the width, and a change of day reflows the bars (closed
  // hours fold to nothing). Each bar: .u the usual (grain), .lv the live reading (light, the hour now stands in only),
  // .cap the usual's chalk top, .pk the bar's outline (its .edge lit in chalk when picked, the focus ring around it),
  // and .ring, the quietest hour left, over it. Nothing after now is measured: those hours are usual, and drawn as
  // usual. Every height is a transform: each layer is the plot's full height, slid down until its top stands at its
  // value, and the plot's floor clips what is under it. Before the usual day has arrived (Loading, Error) the plot is
  // an empty frame: the floor under the open hours and the clock under it, never bars that could read as a reading.
  // ---------------------------------------------------------------------------------------------------------------
  function dayBars() {
    var wrap = el("div", "plot");
    var bars = el("div", "bars");
    bars.setAttribute("role", "group");
    bars.setAttribute("aria-label", T.hours);
    var slots = {};
    for (var h = SPAN0; h < SPAN1; h++) {
      var b = el("button", "slot");
      b.type = "button";
      b.tabIndex = -1;
      b.setAttribute("data-h", h);
      b.innerHTML = '<span class="bar"><span class="body"><i class="u"></i><i class="lv"></i><i class="cap"></i><i class="pk"><i class="edge"></i></i></span><i class="rk"><i class="ring"></i></i></span><span class="t"></span>';
      bars.appendChild(b);
      slots[h] = b;
    }
    bars.style.setProperty("--lg", (level.n / TOP).toFixed(4)); // the live red's ramp (CSS)
    wrap.appendChild(bars);
    return { el: wrap, bars: bars, slots: slots };
  }

  // How many hours a bar holds for a day here: two on the phone (?hours=2) where an hour would be narrower than a
  // finger target, else one. Today stays hourly, with its Now; the computer stays hourly.
  function grainFor(B, d) {
    if (HOURS === 1 || d === TODAY || isWide()) return 1;
    var D = DAYS[d];
    return B.bars.clientWidth / (D.close - D.open) < FINGER ? 2 : 1;
  }

  // Set a day on the bars: heights, which hours are open, past/now/ahead, labels, the live bar, the quietest ring. A
  // two-hour bar is its first hour's slot at twice the width (flex 2); its second hour folds into it (flex 0), taking
  // the bar's height as it goes, so a change between one and two hours a bar is the same movement as a change of day.
  // Only Live has a now hour (data-when="now": the red, the wide chalk top); in Delayed and Unavailable the hour now
  // stands in is drawn as its usual, after the dimmed hours gone before it; Closed is before the day's first hour.
  function setDay(B, d, picked) {
    var D = DAYS[d], isToday = d === TODAY, data = hasDay(), lit = isLive();
    var n = grainFor(B, d), cells = cellsOf(d, n), head = {}, cellAt = {};
    cells.forEach(function (c) { head[c.h] = c; for (var j = 0; j < c.n; j++) cellAt[c.h + j] = c; });
    if (!data) picked = null;
    if (picked != null) picked = cellAt[picked] ? cellAt[picked].h : null; // an hour inside a bar picks the bar
    B.day = d; B.grain = n; B.cells = cells; B.cellAt = cellAt;
    B.el.toggleAttribute("data-today", isToday);
    B.bars.toggleAttribute("aria-hidden", !data);
    var rh = ringHour();
    // The arrival's order: from the day's first hour, the live hour after the hours before it.
    B.bars.style.setProperty("--now-i", Math.max(0, NOW_H - D.open));
    for (var h = SPAN0; h < SPAN1; h++) {
      var s = B.slots[h], c = head[h], within = cellAt[h], open = !!c, v = within ? within.v : null;
      s.style.setProperty("--i", Math.max(0, h - D.open));
      s.toggleAttribute("data-closed", !open);
      // An odd last hour on a two-hour day: its bar stays an hour wide, its target reaches past the plot's end (CSS).
      s.toggleAttribute("data-lone", open && n > 1 && c.n === 1);
      s.style.setProperty("--g", open ? c.n : 0);
      s.style.setProperty("--u", v !== null && data ? (v / TOP).toFixed(4) : 0);
      if (v !== null) s.style.setProperty("--ug", (v / TOP).toFixed(4)); // the column's ramp (CSS); kept when it closes
      s.disabled = !open || !data;
      var when = !isToday ? "usual" : h < NOW_H ? "past" : h === NOW_H ? (lit ? "now" : "current") : "ahead";
      s.setAttribute("data-when", open ? when : "closed");
      s.style.setProperty("--l", open && when === "now" ? (level.n / TOP).toFixed(4) : 0);
      var ring = data && isToday && h === rh;
      s.toggleAttribute("data-quietest", ring);
      s.setAttribute("aria-pressed", open && picked === h ? "true" : "false");
      // Today is hourly, so "now" and the quietest left never meet a bar whose hours read differently. The hour now
      // stands in keeps "now" in its spoken name in every state that has the day: with "usually", it names the clock.
      if (open && data) s.setAttribute("aria-label", splits(c) ? T.splitName(c) : T.hourName(c, isToday && h === NOW_H, ring));
      else s.removeAttribute("aria-label");
      // A pick changes no label: its bar's own label, where the day has one, is set bold, and the readout names it.
      s.querySelector(".t").toggleAttribute("data-pick", open && picked === h);
    }
    // One tab stop for the hours: the picked hour, else the hour that has focus (a pick cleared with Escape leaves the
    // stop where focus is, so Tab leaves the hours), else now, else the first open hour; arrows move between them.
    // None while the plot is an empty frame.
    var act = document.activeElement, held = act && act.parentNode === B.bars ? +act.getAttribute("data-h") : null;
    if (held != null && !head[held]) held = null;
    var first = !data ? null : picked != null ? picked : held != null ? held : isToday && cellAt[NOW_H] ? NOW_H : D.open;
    for (h = SPAN0; h < SPAN1; h++) B.slots[h].tabIndex = h === first ? 0 : -1;
    B.picked = picked;
  }

  // Labels, fixed for a day: they follow the day, the plot's width and the direction, never a pick, a hover, focus or
  // a slide, so the clock under the bars never changes under the finger. How often the clock is labelled follows a
  // bar's width: every bar where there is room for it, else every second, third or sixth, counted from the opening
  // hour, so the day's first hour is named (when it opens, by form). A bar's label is its first hour. Today in Live
  // adds two labels of its own, part of its answer: "Now", and the quietest hour left (in the other states that have
  // the day, the quietest hour alone: no "Now" stands under a bar that is not a reading). Today keeps one rhythm with
  // them: the clock is counted from the hour now stands in (from the quietest where the day has no now, Closed), at
  // the finest step its width allows that the quietest hour left also falls on, so the strong labels are part of the
  // clock and the two languages name the same hours (1 PM, 4 PM, Now, 10 PM on the phone and the tablet; every hour on
  // the computer). The rhythm is the day's and the clock's, never the reading's: the quietest hour left by the usual
  // sets it whether or not a ring marks it (Live at Quiet answers "now"), and the empty frame of Loading and Error
  // labels the hours Live will, so neither a reading that changes nor its arrival moves the clock. A label too close
  // to a stronger one gives way; the first and last stand on the plot's edges. Each label keeps the width of its bold
  // self, so the one a pick sets bold keeps its box. Worked out from the final layout: an hour's width = plot width /
  // open hours, a bar's = that times its hours.
  function placeLabels(B) {
    var D = DAYS[B.day], W = B.bars.clientWidth, hw = W / (D.close - D.open), sw = hw * B.grain;
    var every = sw >= 64 ? 1 : sw >= 34 ? 2 : sw >= 21 ? 3 : 6;
    var isToday = B.day === TODAY, items = [], rh = ringHour();
    // Today's rhythm: its anchor and its step (else the opening hour and the width's step).
    var anchor = D.open, step = every;
    if (isToday) {
      var nowOn = state !== "closed" && B.cellAt[NOW_H] ? NOW_H : null;
      anchor = nowOn != null ? nowOn : quietLeft != null ? quietLeft : D.open;
      if (nowOn != null && quietLeft != null) {
        for (var k = every; k <= 2 * every && (quietLeft - anchor) % k !== 0; k++);
        if ((quietLeft - anchor) % k === 0) step = k; else anchor = D.open; // no shared step close by: the opening's clock
      }
    }
    for (var h = SPAN0; h < SPAN1; h++) {
      var t = B.slots[h].querySelector(".t"), cell = B.cellAt[h], head = !!cell && cell.h === h;
      var isNow = head && isToday && isLive() && h === NOW_H, isRing = head && isToday && h === rh && !isNow;
      var onClock = isToday ? ((h - anchor) % step + step) % step === 0 : cell && cell.i % every === 0;
      var text = !head ? "" : isNow ? T.now : isRing || onClock ? hourText(h) : "";
      t.textContent = text;
      t.setAttribute("data-label", text);
      t.toggleAttribute("data-now", isNow);
      t.toggleAttribute("data-ring", isRing);
      t.removeAttribute("data-yield");
      t.removeAttribute("data-edge");
      if (!text) continue;
      // Rank: "Now", then the quietest left, then the clock's hours.
      items.push({ t: t, w: measure(t), c: (h - D.open + cell.n / 2) * hw, rank: isNow ? 4 : isRing ? 2 : 0 });
    }
    items.forEach(function (it) {
      if (it.c - it.w / 2 < 0) { it.t.setAttribute("data-edge", "start"); it.c = it.w / 2; }
      else if (it.c + it.w / 2 > W) { it.t.setAttribute("data-edge", "end"); it.c = W - it.w / 2; }
    });
    // Strongest first: a label stands unless it would come within 16 px of one already standing (the phone too: at 10
    // px "10 PM" and "12 AM" read as one run); between two of the same rank, the earlier hour stands.
    var air = 16, kept = [];
    items.map(function (it, i) { it.i = i; return it; })
      .sort(function (a, b) { return b.rank - a.rank || a.i - b.i; })
      .forEach(function (it) {
        var hit = kept.some(function (o) { return Math.abs(o.c - it.c) < (o.w + it.w) / 2 + air; });
        if (hit) it.t.setAttribute("data-yield", ""); else kept.push(it);
      });
  }
  var measurer = null;
  function measure(t, weight) {
    if (!measurer) { measurer = el("span", "measure"); measurer.setAttribute("aria-hidden", "true"); document.body.appendChild(measurer); }
    measurer.style.font = getComputedStyle(t).font;
    measurer.style.fontWeight = weight || "600"; // a label's box is its bold self's (CSS, .t::after)
    measurer.innerHTML = t.innerHTML;
    if (t.classList.contains("t") || t.classList.contains("day-btn")) measurer.textContent = t.textContent;
    return measurer.getBoundingClientRect().width;
  }

  // The labels a day change or the arrival puts up or takes down fade instead of swapping in a frame (motion review
  // F4): 140 ms on the strong ease-out, a new label in from nothing where it stands, a label that goes out from where
  // it stood (a copy of it, left in place while its bar moves on). Under reduced motion the fades stay; what a key
  // starts changes at once.
  var EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";
  function shownLabels(B) {
    var m = {}, pr = B.el.getBoundingClientRect();
    for (var h = SPAN0; h < SPAN1; h++) {
      var t = B.slots[h].querySelector(".t");
      if (!t.textContent || t.hasAttribute("data-yield")) continue;
      var r = t.getBoundingClientRect();
      m[h] = { text: t.textContent, x: r.left - pr.left, y: r.top - pr.top, w: r.width, a: getComputedStyle(t).textAlign, cls: t.hasAttribute("data-now") || t.hasAttribute("data-ring") };
    }
    return m;
  }
  function fadeLabels(B, before) {
    if (!before || page.hasAttribute("data-keys")) return;
    var after = shownLabels(B);
    for (var h = SPAN0; h < SPAN1; h++) {
      var a = before[h], b = after[h];
      if (a && b && a.text === b.text) continue;
      var t = B.slots[h].querySelector(".t");
      if (b && !t.getAnimations().some(function (x) { return x.id === "open"; })) t.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 140, easing: EASE_OUT, id: "fade" });
      if (a) {
        var g = el("span", "t-out");
        g.textContent = a.text;
        g.setAttribute("aria-hidden", "true");
        g.toggleAttribute("data-strong", a.cls);
        g.style.cssText = "left:" + a.x.toFixed(2) + "px;top:" + a.y.toFixed(2) + "px;width:" + a.w.toFixed(2) + "px;text-align:" + a.a;
        B.el.appendChild(g);
        g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: EASE_OUT, fill: "forwards" }).onfinish = (function (n) { return function () { n.remove(); }; })(g);
      }
    }
  }

  // The day picker: the seven days in the week's order, each by its short name; today is marked by a chalk dot under
  // its name (CSS), and its name says "today" to a screen reader. The visible name leads the spoken one (WCAG 2.5.3).
  // While the usual day has not arrived (Loading, Error) the days are real text but wait (aria-disabled).
  function dayPicker(current, onPick) {
    var g = el("div", "days");
    g.setAttribute("role", "radiogroup");
    g.setAttribute("aria-label", T.days);
    WEEK.forEach(function (d) {
      var b = el("button", "day-btn");
      b.type = "button";
      b.setAttribute("role", "radio");
      b.setAttribute("data-day", d);
      b.setAttribute("aria-label", d === TODAY ? T.todayName(d) : dayName(d));
      b.toggleAttribute("data-today", d === TODAY);
      b.textContent = dayShort(d);
      b.setAttribute("data-label", dayShort(d)); // its bold self's width, kept (CSS)
      g.appendChild(b);
    });
    function sync(cur) {
      g.querySelectorAll(".day-btn").forEach(function (b) {
        var on = b.getAttribute("data-day") === cur;
        b.setAttribute("aria-checked", on ? "true" : "false");
        b.tabIndex = on ? 0 : -1;
      });
    }
    sync(current);
    g.addEventListener("click", function (e) {
      var b = e.target.closest(".day-btn");
      if (!b || g.getAttribute("aria-disabled") === "true") return;
      sync(b.getAttribute("data-day"));
      onPick(b.getAttribute("data-day"));
    });
    g.addEventListener("keydown", function (e) { if (g.getAttribute("aria-disabled") !== "true") rove(e, g, ".day-btn", function (b) { b.click(); }); });
    return { el: g, sync: sync };
  }

  // Arrow keys move along a row in reading order (mirrored in Arabic: the left arrow goes to the later hour and the
  // later day, which stand to the left); Home and End jump to the row's first and last.
  function rove(e, root, sel, act) {
    var keys = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1, ArrowDown: 1, ArrowUp: -1 };
    var list = Array.prototype.filter.call(root.querySelectorAll(sel), function (b) { return !b.disabled; });
    var i = list.indexOf(document.activeElement);
    if (i < 0) return;
    var j = e.key === "Home" ? 0 : e.key === "End" ? list.length - 1 : keys[e.key] != null ? i + keys[e.key] : null;
    if (j === null || j < 0 || j >= list.length) return;
    e.preventDefault();
    list.forEach(function (b) { b.tabIndex = -1; });
    list[j].tabIndex = 0;
    list[j].focus();
    act(list[j]);
  }

  // Hours answer a tap or a click (again to clear), arrow keys, and a slide: a finger or a pressed pointer drawn
  // sideways along the day picks each hour it passes, so a 16 px hour on a phone Monday needs no aim; the hour is
  // found by where it stands on the screen, so the slide follows the day in either direction. A vertical swipe still
  // scrolls the page (touch-action: pan-y on the bars). A pointer's tap is taken on its release, not from the click
  // that may follow (Chromium drops the click of a tap that comes just after a slide); the click is left to the
  // keyboard and to assistive technology (a click with no pointer behind it, detail 0).
  function hourInput(B, onPick) {
    var drag = null;
    function slotAt(x) {
      var best = null, bd = Infinity;
      B.bars.querySelectorAll(".slot:not([data-closed])").forEach(function (s) {
        var r = s.getBoundingClientRect(), d = x < r.left ? r.left - x : x > r.right ? x - r.right : 0;
        if (d < bd) { bd = d; best = s; }
      });
      return best;
    }
    function toggle(s) {
      if (!s || s.disabled) return;
      var h = +s.getAttribute("data-h");
      onPick(B.picked === h ? null : h, false);
    }
    B.bars.addEventListener("click", function (e) { if (e.detail === 0) toggle(e.target.closest(".slot")); });
    B.bars.addEventListener("pointerdown", function (e) {
      if (e.button !== 0 || !hasDay()) return;
      drag = { id: e.pointerId, x: e.clientX, on: false, slot: e.target.closest(".slot") };
    });
    B.bars.addEventListener("pointermove", function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.on) {
        if (Math.abs(e.clientX - drag.x) < 8) return;
        drag.on = true;
        page.setAttribute("data-drag", ""); // the hours follow the finger at once (CSS, Motion)
        try { B.bars.setPointerCapture(e.pointerId); } catch (err) { /* a pointer that already left */ }
      }
      var s = slotAt(e.clientX), h = s ? +s.getAttribute("data-h") : null;
      if (h !== null && h !== B.picked) onPick(h, true);
    });
    function end(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var tap = !drag.on && e.type === "pointerup" && drag.slot && drag.slot === e.target.closest(".slot");
      var s = drag.slot;
      drag = null;
      page.removeAttribute("data-drag");
      if (tap) toggle(s);
    }
    B.bars.addEventListener("pointerup", end);
    B.bars.addEventListener("pointercancel", end);
    // The hours' one Tab stop follows focus wherever it lands (a key, a click).
    B.bars.addEventListener("focusin", function (e) {
      var s = e.target.closest(".slot");
      if (!s) return;
      B.bars.querySelectorAll(".slot").forEach(function (o) { o.tabIndex = o === s ? 0 : -1; });
    });
    // Escape clears a picked hour (as picking it again does), and the card's answer returns.
    B.bars.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && B.picked != null) { e.preventDefault(); onPick(null, true); return; }
      rove(e, B.bars, ".slot", function (s) { onPick(+s.getAttribute("data-h"), true); });
    });
  }

  // A picked day reflows the bars as one movement on screen, 280 ms on a strong ease in and out: its timings and its
  // steps (what is seen, whether the bars move, stopping a slide, the slide itself) are public-slide.js's.
  var M = window.FitwayPublicSlide(SPAN0, SPAN1, EASE_OUT);
  var SLIDE = M.SLIDE, SLIDE_ON = M.SLIDE_ON, seen = M.seen, moving = M.moving, stopSlide = M.stopSlide, slide = M.slide;

  // ---------------------------------------------------------------------------------------------------------------
  // The page: the live reading above, the usual day in the lit card under it, on the phone and the computer alike.
  // ---------------------------------------------------------------------------------------------------------------
  var pickedDay = DAYS[q.get("day")] ? q.get("day") : TODAY;
  var hq = q.get("hour"), pickedHour = hq !== null && usualAt(pickedDay, +hq) !== null ? +hq : null;

  // The level word takes the size the width gives it (CSS, --fs-word), and a word too long for its line at that size
  // («شديد الازدحام», "Couldn't load" on the phone) is set down until it fits on one line; the other words keep the
  // size. Only the word is set down, never its line, so the line keeps the height every word gives it and the facts
  // under it stay where they are whatever the word (a reading that turns Packed moves nothing).
  // (A word set down can round its line a fraction of a pixel deeper: «تعذّر التحميل» at 390 px by 0.41 px. The line
  // keeps the height the word gave it at full size, measured before it is set down.)
  // The word's first stroke stands on the facts' start edge. A word's first letter has a side bearing of its own
  // (in English "B", "M", "N", "P" twice that of "C" or "Q"; in Arabic the first letter at the right, «م», «ه», «ش»,
  // «ع», «ت» each its own), so it is measured in the face the word is drawn in, in the word's direction, and taken back
  // (canvas). A placeholder is flat, so it starts on the edge itself.
  var inkPad = null;
  function inkLead(word) {
    if (!inkPad) inkPad = document.createElement("canvas").getContext("2d");
    var cs = getComputedStyle(word);
    inkPad.font = cs.fontWeight + " 200px " + cs.fontFamily;
    inkPad.direction = rtl ? "rtl" : "ltr";
    inkPad.textAlign = rtl ? "right" : "left";
    var m = inkPad.measureText(word.textContent);
    return -(rtl ? m.actualBoundingBoxRight : m.actualBoundingBoxLeft) / 200;
  }
  function fitWord(head) {
    var w = head.word, word = w.querySelector(".level");
    word.style.fontSize = ""; w.style.blockSize = ""; word.style.marginInlineStart = "";
    if (word.querySelector(".ph")) word.style.marginInlineStart = "0";
    else word.style.marginInlineStart = (-inkLead(word)).toFixed(4) + "em";
    var room = sign.clientWidth, need = word.getBoundingClientRect().width;
    if (need > room) {
      var line = w.getBoundingClientRect().height;
      word.style.fontSize = (parseFloat(getComputedStyle(word).fontSize) * room / need).toFixed(2) + "px";
      w.style.blockSize = line + "px";
    }
  }
  // The count and the percentage share a line; where a narrow screen parts them, the percentage starts its own line
  // without the rule that stood between them (CSS, data-wrapped).
  function fitFacts(head) {
    var f = head.sub.querySelector(".facts");
    if (f) f.removeAttribute("data-wrapped");
    wrapFacts(head.sub);
  }
  // The week row: seven equal buttons while every day's name stands in its button with room on both sides (at least
  // AIR px, a little under what "Wed" has at 360 px); where one does not («خميس» on the phone), each button takes its
  // name's width and the row's room is shared out evenly, so every name keeps the same air (CSS, data-fit).
  var AIR = 3;
  function fitDays(row) {
    row.removeAttribute("data-fit");
    var btns = row.querySelectorAll(".day-btn"), share = btns[0].getBoundingClientRect().width, need = 0;
    btns.forEach(function (b) { need = Math.max(need, measure(b) + 2 * AIR); });
    if (need > share) row.setAttribute("data-fit", "content");
  }

  // The step keys: where a picked day's hour is narrower than a finger (today on a phone under 354 px; any hourly day
  // under it with ?hours=1), a picked hour brings two keys to the end of the readout's line, the earlier hour and the
  // later one, so every hour has a target of 40 px (WCAG 2.5.8's equivalent control; the family's previous and next
  // beside a kept reading, CHT-15). The slide stays. They wait at the first and last hour (aria-disabled), and go when
  // the pick does.
  function stepKeys() {
    var g = el("div", "steps");
    g.hidden = true;
    var keys = [[-1, T.prevHour], [1, T.nextHour]].map(function (k) {
      var b = el("button", "step", ICON.chev);
      b.type = "button";
      b.setAttribute("data-step", k[0]);
      b.setAttribute("aria-label", k[1]);
      g.appendChild(b);
      return b;
    });
    return { el: g, prev: keys[0], next: keys[1] };
  }
  function narrow(d, n) { var D = DAYS[d]; return B.bars.clientWidth / (D.close - D.open) * n < FINGER; }
  function syncSteps() {
    var on = hasDay() && B.picked != null && narrow(B.day, B.grain);
    steps.el.hidden = !on;
    readout.toggleAttribute("data-steps", on);
    if (!on) return;
    var i = B.cells.indexOf(B.cellAt[B.picked]);
    steps.prev.setAttribute("aria-disabled", i <= 0 ? "true" : "false");
    steps.next.setAttribute("aria-disabled", i >= B.cells.length - 1 ? "true" : "false");
  }
  function pickHour(h, keepFocus) {
    setDay(B, B.day, h); words(B.day, B.picked);
    var f = B.slots[h != null ? h : -1];
    if (!keepFocus && f && document.activeElement && document.activeElement.closest(".bars") === B.bars) f.focus();
  }

  var B, head, card, title, hours, readout, steps, fig, picker, relayout;
  function build() {
    head = { el: el("section", "live") };
    head.el.setAttribute("aria-label", T.rightNow);
    head.word = el("h1", "word");
    head.word.tabIndex = -1; // where focus lands when a retry arrives (the figures)
    head.sub = el("div", "sub");
    head.el.appendChild(head.word);
    head.el.appendChild(head.sub);
    sign.appendChild(head.el);
    card = el("section", "card daycard");
    card.setAttribute("aria-labelledby", "day-title");
    card.innerHTML = '<span class="lamp" aria-hidden="true"><span class="lamp-in"></span><span class="lamp-rim"></span></span>';
    title = el("h2", "card-title"); title.id = "day-title";
    hours = el("p", "card-hours");
    readout = el("p", "readout");
    steps = stepKeys();
    fig = el("figure", "dayfig");
    B = dayBars();
    fig.appendChild(B.el);
    picker = dayPicker(pickedDay, function (d) { show(d, null, true); });
    [title, hours, readout, steps.el, fig, picker.el].forEach(function (n) { card.appendChild(n); });
    sign.appendChild(card);

    // A pick leaves the labels where the day put them (placeLabels runs only for a day or a width).
    hourInput(B, pickHour);
    steps.el.addEventListener("click", function (e) {
      var k = e.target.closest(".step");
      if (!k || k.getAttribute("aria-disabled") === "true" || B.picked == null) return;
      var c = B.cells[B.cells.indexOf(B.cellAt[B.picked]) + +k.getAttribute("data-step")];
      if (c) pickHour(c.h, true);
    });
    head.sub.addEventListener("click", function (e) { var r = e.target.closest(".retry"); if (r) retry(r); });

    renderState(false);
    show(pickedDay, pickedHour, false);
    hold();
    fit();
    // A new width can change how many hours a bar holds (a phone turned, a window resized): the day is set again.
    return function () {
      setRange(rangeNow());
      hold();
      if (grainFor(B, B.day) !== B.grain) show(B.day, B.picked, false);
      fit();
      placeLabels(B);
      syncSteps();
    };
  }

  // The state into the page: the head's rows, the card's light (CSS: only Live lights it, LGT-11), the days, the
  // busy marks. The card's answer and the bars follow in show().
  function renderState() {
    page.setAttribute("data-state", state);
    var r = rowsHtml(state);
    head.word.innerHTML = r.word;
    head.sub.innerHTML = r.sub;
    [head.el, card].forEach(function (n) { if (state === "loading") n.setAttribute("aria-busy", "true"); else n.removeAttribute("aria-busy"); });
    picker.el.setAttribute("aria-disabled", hasDay() ? "false" : "true");
    // The readout speaks a pick once the day has arrived, from the frame after its answer is written, so the arrival
    // says one thing (the reading, from the header).
    readout.removeAttribute("aria-live");
    if (hasDay()) requestAnimationFrame(function () { readout.setAttribute("aria-live", "polite"); });
    setFlow();
    fitWord(head); fitFacts(head);
  }

  // The card's answer, and a picked hour's words in its place.
  function pickWords(c) { return "<span>" + T.cellUsual(c) + "</span>"; }
  function todayWords() {
    if (state === "closed") return quietLeft != null ? ICON.ring + "<span>" + T.quietestToday(quietLeft) + "</span>" : "";
    if (!isLive()) return quietLeft != null ? ICON.ring + "<span>" + T.quietestLeft(quietLeft) + "</span>" : "";
    if (nowVsLeft === "now") return "<span>" + T.nowQuietest + "</span>";
    if (nowVsLeft === "same") return ICON.ring + "<span>" + T.quietestSame(quietLeft) + "</span>";
    if (nowVsLeft === "later") return ICON.ring + "<span>" + T.quietestLeft(quietLeft) + "</span>";
    return "";
  }
  function words(d, h) {
    var html;
    if (state === "loading") html = "<span>" + ph("15em") + "</span>";
    else if (state === "error") html = "<span>" + STRUT + "</span>";
    else if (d !== TODAY) html = "<span>" + T.dayRange(B.cells, B.grain) + "</span>";
    else html = todayWords();
    if (h != null) html = pickWords(B.cellAt[h]);
    readout.innerHTML = html;
    readout.toggleAttribute("data-picked", h != null);
    syncSteps();
  }
  function show(d, h, animate) {
    var before = animate && !reduce && d !== B.day && !page.hasAttribute("data-keys") ? seen(B) : null;
    var labels = animate && d !== B.day ? shownLabels(B) : null;
    // A second pick while the bars still move: they carry on from where they are, easing out (F2). The heights' own
    // transitions take the same curve for this movement (CSS, data-on).
    var on = !!before && moving(B);
    stopSlide(B);
    if (on) { B.bars.setAttribute("data-on", ""); clearTimeout(show.t); show.t = setTimeout(function () { B.bars.removeAttribute("data-on"); }, 300); }
    title.textContent = T.usualDay(d);
    hours.innerHTML = T.openHours(d);
    setDay(B, d, h);
    fig.setAttribute("aria-label", T.chartName(d, B.grain, hasDay() && state !== "closed" && d === TODAY));
    // The head is now's: while another day is shown it steps back (?head=quiet, CSS).
    page.toggleAttribute("data-away", d !== TODAY);
    words(d, B.picked);
    placeLabels(B);
    if (before) slide(B, before, on ? SLIDE_ON : SLIDE);
    fadeLabels(B, labels);
  }

  // ---------------------------------------------------------------------------------------------------------------
  // Held heights: nothing on the page moves when the day, the state or the reading changes (motion review F1; the
  // Loading behaviour's zero shift). Worked out for the width, again only when it changes:
  // - the head holds the tallest two rows any state writes at this width, at every level (silent copies, measured), so
  //   a state that follows another, or a reading that changes level, moves nothing under the word; the stamp follows
  //   its comparison at the line's gap, and where the widest of the five and the stamp would not share a line, every
  //   level's stamp takes the next one, so a new comparison moves the stamp along its line and never off it; Loading
  //   writes Live's rows into Live's boxes (the numbers' rooms, the stamp's room, the comparison's as the default
  //   reading writes it);
  // - the card's head stacks its name over its hours where any day's name and hours would not share a line;
  // - on the phone and the tablet the readout holds the tallest of everything it can say at this width: today's
  //   answer in every state, every day's answer and every hour a day offers, picked (on the computer the answer stands
  //   on one line beside the card's name).
  // ---------------------------------------------------------------------------------------------------------------
  function ghostOf(node, host, html) {
    var g = node.cloneNode(false);
    g.removeAttribute("aria-live"); g.removeAttribute("id");
    g.setAttribute("aria-hidden", "true");
    g.style.cssText = "position:absolute;visibility:hidden;inset-inline:0;min-height:0";
    if (html != null) g.innerHTML = html;
    host.appendChild(g);
    return g;
  }
  function wrapFacts(sub) {
    var f = sub.querySelector(".facts"), c = f && f.querySelector(".count-line"), p = f && f.querySelector(".pct");
    if (p && c && p.getBoundingClientRect().top - c.getBoundingClientRect().top > 4) f.setAttribute("data-wrapped", "");
    return f;
  }
  function hold() {
    fitWord(head); fitDays(picker.el);
    // The head. The status line first: the widest of the five comparisons at this width, the stamp's width, and the
    // line the stamp takes (its comparison's, or the next where the widest and the stamp would not share one); the
    // default reading's comparison words, the length Loading's line holds. Then the numerals' room: Readex Pro's
    // digits are not tabular, so the count and the percentage each hold the width of the widest the readings write
    // (the four levels'; "00" to "99" would hold 3-5 px more and part the Arabic facts at 360 px). Then Live's rows
    // (their facts row is the height Error's key stands at), every level's in Live and Delayed, and every other
    // state's; the head holds the tallest.
    head.sub.style.minHeight = "";
    head.sub.removeAttribute("data-stamp");
    var gs = ghostOf(head.sub, head.el, ""), vsW = 0, stampW = 0, phVs = 0, vsDefault = vsOf(LEVELS.busy.n);
    COMPARISONS.forEach(function (c) {
      gs.innerHTML = rowsHtml("live", levelKey, c).sub;
      var v = gs.querySelector(".vs");
      vsW = Math.max(vsW, v.getBoundingClientRect().width);
      if (c === vsDefault) phVs = v.querySelector("span").getBoundingClientRect().width;
      stampW = gs.querySelector(".stamp").getBoundingClientRect().width;
    });
    var own = !isWide() && vsW + (parseFloat(getComputedStyle(gs).columnGap) || 0) + stampW > gs.getBoundingClientRect().width;
    var cW = 0, pW = 0, gn = gs.querySelector(".count-line .num"), gp = gs.querySelector(".pct .num");
    Object.keys(LEVELS).forEach(function (k) {
      gn.textContent = LEVELS[k].n; cW = Math.max(cW, gn.getBoundingClientRect().width);
      if (gp) { gp.textContent = LEVELS[k].pct + "%"; pW = Math.max(pW, gp.getBoundingClientRect().width); }
    });
    [gs, head.sub].forEach(function (n) { // the numerals in whole pixels, so every reading's box is the held one exactly
      n.style.setProperty("--count-w", Math.ceil(cW) + "px");
      n.style.setProperty("--pct-w", Math.ceil(pW) + "px");
      n.style.setProperty("--ph-vs", phVs + "px"); // as measured, so the boxes are Live's to the layout's own unit
      n.style.setProperty("--stamp-w", stampW + "px");
      if (own) n.setAttribute("data-stamp", "own"); else n.removeAttribute("data-stamp");
    });
    fitFacts(head);
    gs.innerHTML = rowsHtml("live").sub;
    var rowA = wrapFacts(gs).getBoundingClientRect().height, tallest = 0;
    gs.style.setProperty("--row-a", rowA.toFixed(2) + "px");
    STATES.forEach(function (st) {
      (st === "live" || st === "delayed" ? Object.keys(LEVELS) : [null]).forEach(function (lk) {
        gs.innerHTML = rowsHtml(st, lk).sub;
        wrapFacts(gs);
        tallest = Math.max(tallest, gs.getBoundingClientRect().height);
      });
    });
    gs.remove();
    head.sub.style.minHeight = tallest + "px"; // exact: Live, where it is the tallest, keeps its own height
    head.sub.style.setProperty("--row-a", rowA.toFixed(2) + "px"); // Error's key row (CSS)
    // The card's name and hours.
    card.removeAttribute("data-stack");
    if (!isWide()) {
      var room = card.clientWidth - parseFloat(getComputedStyle(card).paddingInlineStart) - parseFloat(getComputedStyle(card).paddingInlineEnd);
      var gap = parseFloat(getComputedStyle(card).columnGap) || 0, keep = { t: title.textContent, h: hours.innerHTML };
      var stack = WEEK.some(function (d) {
        title.textContent = T.usualDay(d); hours.innerHTML = T.openHours(d);
        return measure(title, "500") + measure(hours, "400") + gap > room;
      });
      title.textContent = keep.t; hours.innerHTML = keep.h;
      card.toggleAttribute("data-stack", stack);
    }
    // The readout. A pick on a day whose hours are narrower than a finger is measured beside the step keys, which
    // centre on its words' first line (CSS) and reach into the readout's margins without adding to them, so their
    // coming and going moves nothing.
    readout.style.minHeight = "";
    if (!isWide()) {
      var g = ghostOf(readout, card), held = 0;
      var say = [ICON.ring + "<span>" + T.quietestLeft(quietLeft) + "</span>", ICON.ring + "<span>" + T.quietestSame(quietLeft) + "</span>", "<span>" + T.nowQuietest + "</span>"];
      var early = lowest(TODAY, 0);
      say.push(ICON.ring + "<span>" + T.quietestToday(early) + "</span>");
      say = say.map(function (w) { return [w, false]; });
      WEEK.forEach(function (d) {
        var n = grainFor(B, d), cells = cellsOf(d, n), k = narrow(d, n);
        say.push(["<span>" + T.dayRange(cells, n) + "</span>", false]);
        cells.forEach(function (c) { say.push([pickWords(c), k]); });
      });
      say.forEach(function (w) {
        g.innerHTML = w[0];
        g.toggleAttribute("data-steps", w[1]);
        held = Math.max(held, g.getBoundingClientRect().height);
      });
      g.remove();
      readout.style.minHeight = held + "px";
    }
  }

  // The day fills what the screen leaves it: the page is measured with the plot at nothing, and the plot takes the
  // rest, between a floor and a ceiling (on a tall screen the rest goes to the space around). At 390 x 844 and on
  // the larger phones the plot reaches its ceiling and the page is the screen's height, the concept label at its foot.
  // A range's edge would make the day jump (the next range's frame, rows and floor and ceiling give it another height:
  // at 1023 / 1024 x 768 182 against 300 px in Arabic), so in the BLEND px under an edge the page is also laid out as
  // the next range, measured, and the day runs in a straight line from its own height to that one, which it reaches
  // at the edge: on the phone from 440 px to the tablet's at 600, on the tablet from 864 px to the computer's at 1024.
  // There the page takes a little air or a little more scroll for it; the designed sizes (the phones to 430 px, 600,
  // 768 and 834 on the tablet, every computer) sit outside, and keep their fit.
  var BLEND = 160;
  function fitted() {
    var r = range(), min = r === "phone" ? 150 : 180, max = r === "computer" ? 560 : r === "tablet" ? 520 : 320;
    var foot = document.querySelector(".concept-foot");
    page.classList.add("fitting");
    B.el.style.height = "0px";
    var natural = page.getBoundingClientRect().height - (foot && foot.offsetParent ? foot.getBoundingClientRect().height : 0);
    page.classList.remove("fitting");
    return Math.max(min, Math.min(max, innerHeight - natural));
  }
  function fit() {
    var here = range(), plot = fitted(), edge = here === "phone" ? 600 : here === "tablet" ? 1024 : null;
    var w = innerWidth, t = edge ? (w - (edge - BLEND)) / BLEND : 0;
    if (t > 0) {
      setRange(here === "phone" ? "tablet" : "computer"); hold();
      var next = fitted();
      setRange(here); hold();
      plot += (next - plot) * Math.min(1, t);
    }
    B.el.style.height = Math.round(plot) + "px";
  }

  // ---------------------------------------------------------------------------------------------------------------
  // Loading behaviour (DESIGN_GUIDE §6): for the first 300 ms the value slots keep their space, empty, and a payload
  // that lands in time fills them directly; from 300 ms the placeholders and "Loading…" show, static, for at least
  // 400 ms; at 1 s the polite voice says it once; at 10 s the load becomes Error. The arrival: the head's rows are
  // written into the space they held, the card lights at once (LGT-11), the usual day rises from its floor as the page
  // arrives (the arrival, unchanged), and the voice says the reading once.
  // ---------------------------------------------------------------------------------------------------------------
  var timers = [], shownAt = null;
  function later(f, ms) { timers.push(setTimeout(f, ms)); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function startLoading() {
    later(function () { shownAt = performance.now(); page.setAttribute("data-shown", ""); ready(); }, 300);
    later(function () { speak(T.loadingSay); }, 1000);
    later(function () { toState("error"); }, 10000);
    if (arriveAt != null) later(function () {
      var wait = shownAt == null ? 0 : shownAt + 400 - performance.now();
      if (wait > 0) later(arrive, wait); else arrive();
    }, arriveAt);
  }
  function toState(s) {
    clearTimers();
    state = s;
    page.removeAttribute("data-shown");
    renderState();
    var labels = shownLabels(B);
    show(B.day, null, false);
    hold(); fit(); placeLabels(B);
    fadeLabels(B, labels);
    if (s === "error") alertOnce();
  }
  function arrive(focus) {
    // The bars wait at their floor while the day is written (the arrival's first frame), then rise.
    if (!reduce) page.setAttribute("data-intro", "");
    toState("live");
    speak(T.arrival(levelKey, level.n));
    if (focus) head.word.focus();
    ready();
    rise();
  }
  function rise() {
    if (reduce) { page.removeAttribute("data-intro"); return; }
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        page.setAttribute("data-rise", "");
        page.removeAttribute("data-intro");
        setTimeout(function () { page.removeAttribute("data-rise"); }, 2600);
      });
    });
  }
  // Error: the alert is written once it is in place, so it is said once; the one retry takes focus (EMP-5). The retry
  // works as an action: its words at once, focus kept, at least 400 ms, then the arrival (concept: it always lands).
  function alertOnce() {
    var a = el("p", "sr-only");
    a.setAttribute("role", "alert");
    head.el.appendChild(a);
    setTimeout(function () { a.textContent = T.cantLoad + ". " + T.checkConn; }, 50);
    var r = head.sub.querySelector(".retry");
    if (r) r.focus();
  }
  function retry(r) {
    if (r.getAttribute("aria-disabled") === "true") return;
    r.textContent = T.retrying;
    r.setAttribute("aria-disabled", "true");
    r.setAttribute("aria-busy", "true");
    head.el.querySelectorAll('[role="alert"]').forEach(function (n) { n.remove(); });
    later(function () { arrive(true); }, 900);
  }

  // Motion: the arrival raises the bars from the floor in the day's order, the live hour after the hours before it.
  // Set before the page is built, so no bar is ever drawn at its height and then lowered. Under reduced motion it never
  // runs and every bar stands at its height from the first frame. While Loading the bars wait at their floor.
  if (!reduce || state === "loading" || state === "error") page.setAttribute("data-intro", "");
  var initial = state;
  relayout = build();
  if (state === "loading") startLoading();

  // The arrival's stagger ends at the visitor's first touch or key, so a pick never waits on it.
  ["pointerdown", "keydown"].forEach(function (t) { addEventListener(t, function () { page.removeAttribute("data-rise"); }, { capture: true, once: true }); });
  // What a key starts changes at once (STANDARDS.md: never animate keyboard-initiated actions): arrows, Home, End and
  // Escape on the hours, arrows, Space and Enter on the days. A pointer that moves or presses brings the motion back.
  addEventListener("keydown", function () { page.setAttribute("data-keys", ""); }, true);
  addEventListener("pointerdown", function () { page.removeAttribute("data-keys"); }, true);
  addEventListener("pointermove", function (e) { if ((e.movementX || e.movementY) && page.hasAttribute("data-keys")) page.removeAttribute("data-keys"); }, true);
  addEventListener("resize", function () { relayout(); });
  [wide, tablet, short].forEach(function (m) { m.addEventListener("change", function () { relayout(); }); });

  // Ready once the page stands in its faces. Readex Pro is optional (CSS): it is used when it is there within the
  // browser's short block period, which a preloaded file on any working connection is, and otherwise the metric-matched
  // fallback stays for the visit, so a late file never moves the text (motion review F7). The page waits for the faces
  // only that long (150 ms at most), then lays out once and the day rises; it never shows its words over an empty day.
  var SAMPLE = "FITWAY English Quiet Moderate Busy Packed 0123456789% هادئ متوسط مزدحم شديد الازدحام العربية";
  var faces = Promise.all(["400", "500", "600", "700"].map(function (w) {
    return document.fonts.load(w + ' 16px "Readex Pro"', SAMPLE).catch(function () {});
  }));
  var isReady = false;
  function ready() {
    if (state === "loading" && shownAt == null) return; // a Loading frame is the skeleton, shown
    if (isReady) return;
    isReady = true;
    window.__public = { ready: true };
  }
  Promise.race([faces, new Promise(function (r) { setTimeout(r, 150); })]).then(function () {
    relayout();
    if (initial === "loading") return; // the loading flow owns the arrival and the ready signal
    if (state === "error") { page.removeAttribute("data-intro"); alertOnce(); ready(); return; }
    ready();
    if (!reduce) requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        page.setAttribute("data-rise", "");
        page.removeAttribute("data-intro");
        setTimeout(function () { page.removeAttribute("data-rise"); }, 2600);
      });
    });
  });
  // Exposed for the round's measurements: the current state, read-only.
  window.__publicState = function () { return state; };
})();
