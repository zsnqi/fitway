// FITWAY public crowd page (public-redesign-r01). Concept only, synthetic data. Arabic by default (lang="ar" dir="rtl")
// and English at ?lang=en (lang="en" dir="ltr"); each language is written for itself (GLO-17), and the list of every
// line in both is the run's COPY.md.
// The level word leads the page in its corner light, two rows of facts under it, and under them the usual day in the
// lit card: one solid bar per open hour on every screen, now as the one red hour on it, a circle on the quiet hour the
// card's line names, and the other days. The live head steps back while another day is shown; today's day button reads
// its short name ("Wed", «أربعاء») with a chalk mark under it. The hour labels under the bars are fixed for a day (a
// pick, hover, focus or drag never adds, drops or moves one; the readout names the picked time), and a picked bar lightens.
// Time runs in the reading direction: right to left in Arabic, left to right in English (the hours, the slide, the
// arrow keys, the arrival's order and the week row), all from logical properties, flex order and measured boxes.
// The six states (DESIGN_GUIDE §6), at ?state=: loading, live (the default), delayed, unavailable, closed, error. Each
// fills the same three rows of the head (the word, its facts, the status line) and keeps the head's height, so a state
// that follows another moves nothing on the page, on any screen (hold); the usual day is history and stays wherever it
// has arrived, but only Live draws a reading on it (the red hour, the Live dot, the comparison, "Now"), and only Live
// lights the card.
// Switches: ?lang=en (Arabic without it; the language link switches and keeps every other switch),
// ?state=loading|live|delayed|unavailable|closed|error (live), ?arrive=<ms> (with loading: the payload lands then, into
// Live; without it the load reaches the 10 s ceiling and becomes Error), ?level=quiet|moderate|busy|packed (busy; in
// Delayed, the last reading's), ?day=mon..sun (the day shown; today without it), ?today=mon..sun (wed), ?now=<hour>
// (the clock's hour, 19; before the opening in Closed), ?pct=off (the owner turned the percentage off), ?hour=<0-25>
// (a picked hour, for frames).
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
  // Synthetic data, the one gym of every page (gym.js). One room (120 at full, never shown), one day, the last reading
  // at 7:42 PM. Delayed's last reading came 13 minutes before now (7:29 PM); Closed is the hours before the gym opens.
  // ---------------------------------------------------------------------------------------------------------------
  var GYM = window.EclipseGym;
  var percentOf = function (n) { return Math.min(100, Math.round((n / GYM.CAPACITY) * 100)); };
  var LEVELS = {
    quiet: { n: 18, pct: percentOf(18) },
    moderate: { n: 41, pct: percentOf(41) },
    busy: { n: GYM.NOW.count, pct: percentOf(GYM.NOW.count) },
    packed: { n: 96, pct: percentOf(96) }
  };
  var levelKey = LEVELS[q.get("level")] ? q.get("level") : "busy";
  var level = LEVELS[levelKey];
  // A reading's level is worked out from its count, so a capacity or limits the owner saved move it; levelKey names the sample.
  page.setAttribute("data-level", band(level.n));
  var pctOn = q.get("pct") !== "off";
  if (!pctOn) page.setAttribute("data-pct", "off");
  // An hour narrower than this on the phone is too narrow for a finger: WCAG 2.5.8's minimum target (24 CSS px; the
  // hours stand side by side with no spacing, so an hour's own width is its target). Friday's 11 hours stay above it;
  // the other days' 17 to 20 fall under it, and a picked hour brings the step keys (stepKeys).
  var FINGER = 24;

  // The usual day: the average inside for each hour the gym is open, over past weeks (gym.js's table, with the hours
  // Settings shows). Hours run from the opening hour; an hour past 23 is after midnight (24 is the 12 AM hour). Hours are
  // the finest grain. Each day carries its names in both languages: the full name (the card's title, the spoken names)
  // and the short one (the day buttons).
  var DAYS = {
    mon: { name: ["Monday","الاثنين"], short: ["Mon","اثنين"] },
    tue: { name: ["Tuesday","الثلاثاء"], short: ["Tue","ثلاثاء"] },
    wed: { name: ["Wednesday","الأربعاء"], short: ["Wed","أربعاء"] },
    thu: { name: ["Thursday","الخميس"], short: ["Thu","خميس"] },
    sat: { name: ["Saturday","السبت"], short: ["Sat","سبت"] },
    sun: { name: ["Sunday","الأحد"], short: ["Sun","أحد"] },
    fri: { name: ["Friday", "الجمعة"], short: ["Fri", "جمعة"] }
  };
  Object.keys(DAYS).forEach(function (k) {
    var W = GYM.WEEK[k];
    DAYS[k].open = W.open; DAYS[k].close = W.close; DAYS[k].usual = W.usual;
  });
  var L = en ? 0 : 1; // the language's index in the names
  function dayName(d) { return DAYS[d].name[L]; }
  function dayShort(d) { return DAYS[d].short[L]; }
  // Now, by the gym's clock: the 7 PM hour, or in Closed the hours before the opening (4 AM; 11 AM on Friday). The last
  // reading came at 42 minutes past the hour now stands in; Delayed's came 13 minutes before that.
  var TODAY = DAYS[q.get("today")] ? q.get("today") : GYM.NOW.weekday, NOW_H = q.get("now") ? +q.get("now") : state === "closed" ? (TODAY === "fri" ? 11 : 4) : GYM.NOW.hour, AGO = GYM.NOW.delayedBy;
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
  function band(v) { return GYM.LEVELS[GYM.levelOf(v)]; }
  function lowest(d, from) {
    var D = DAYS[d], best = null;
    for (var h = Math.max(D.open, from); h < D.close; h++) if (best === null || usualAt(d, h) < usualAt(d, best)) best = h;
    return best;
  }
  // A day's bars: one per open hour.
  function cellsOf(d) {
    var D = DAYS[d], out = [];
    for (var h = D.open; h < D.close; h++) out.push({ h: h, v: usualAt(d, h), i: out.length });
    return out;
  }
  function quietCell(cells) { return cells.reduce(function (a, c) { return c.v < a.v ? c : a; }); }

  // ---------------------------------------------------------------------------------------------------------------
  // The clock. Gym time on a 12-hour clock, Western digits in both languages (NUM-1): «7 م», "7 PM". An hour and its
  // period never part (a no-break space, DAT-4), and a time in a line is one isolated, unbreakable run (.iso, NUM-3),
  // so the sentence around it never reorders it. The day's hours take a thin space each side of the dash, and in Arabic
  // read from the right, as the sentence and the bars do: the opening hour stands at the right (an RTL run, so the en
  // dash puts the later hour to its left), and one card never runs two ways (a departure from DAT-3's isolated
  // left-to-right «6–8 م», for this page).
  // ---------------------------------------------------------------------------------------------------------------
  var NB = " ", THIN = " ";
  function half(h) { return h % 24 < 12 ? (en ? "AM" : "ص") : (en ? "PM" : "م"); }
  function n12(h) { return h % 24 % 12 || 12; }
  function hourText(h) { return n12(h) + NB + half(h); } // plain text: the labels and the spoken names
  function iso(html) { return '<span class="iso">' + html + "</span>"; }
  function hourHtml(h) { return iso(hourText(h)); }
  function clockAt(h, m) { return n12(h) + ":" + m + NB + half(h); }
  // Closed's own hours before the opening carry no reading, so its head holds the room of the page's usual hour.
  var READ_H = q.get("now") ? NOW_H : GYM.NOW.hour, READ_AT = clockAt(READ_H, GYM.NOW.min), LAST_AT = clockAt(READ_H, GYM.NOW.min - AGO);

  // The hour the card's line and circle name: the quietest full hour still ahead today, by the usual alone. A quiet one
  // ("quiet"); else one lighter than the hour now stands in ("less"; before the opening every hour is ahead, so the
  // day's lightest); else nothing, and the line is hidden and no circle stands. Another day has its own lowest hour's circle.
  var quietLeft = lowest(TODAY, NOW_H + 1);
  var leftUsual = quietLeft != null ? usualAt(TODAY, quietLeft) : null;
  var usualHere = usualAt(TODAY, NOW_H);
  var lineKind = quietLeft == null ? "none" : band(leftUsual) === "quiet" ? "quiet" : usualHere === null || leftUsual < usualHere ? "less" : "none";
  // A whole day has no "left" in it: another day, and today while the gym is closed, whatever the clock says.
  function wholeDay(d) { return d !== TODAY || state === "closed"; }
  function ringHour(d) {
    if (!hasDay()) return null;
    if (!wholeDay(d)) return lineKind === "none" ? null : quietLeft;
    return lowest(d, DAYS[d].open);
  }
  // Live and Delayed carry a time, so the quiet hour still left may be spoken; "now" is Live's alone (isLive), a stale
  // reading never says it. Unavailable and Closed carry no time (DESIGN_GUIDE §6); Error and Loading have no day.
  function carriesTime() { return state === "live" || state === "delayed"; }

  // Today against a usual day at this hour: a reading of now, so Live's alone. The live value against the usual of the hour
  // now stands in, whatever the hour and the level. An hour the gym is shut has no usual, so nothing to compare with.
  var usualNow = usualAt(TODAY, NOW_H);
  var COMPARISONS = ["much-quieter", "quieter", "usual", "busier", "much-busier"];
  function vsOf(n) {
    if (usualNow === null) return null;
    var r = n / usualNow;
    return r < 0.6 ? "much-quieter" : r < 0.9 ? "quieter" : r <= 1.1 ? "usual" : r <= 1.4 ? "busier" : "much-busier";
  }
  var vs = vsOf(level.n);
  // The live hour's grain runs the way today runs against the usual: up when busier, down when quieter (CSS, Motion).
  function setFlow() {
    page.removeAttribute("data-flow"); page.removeAttribute("data-much");
    if (!isLive() || !vs) return;
    page.setAttribute("data-flow", vs.indexOf("busier") >= 0 ? "up" : vs.indexOf("quieter") >= 0 ? "down" : "still");
    if (vs.indexOf("much") === 0) page.setAttribute("data-much", "");
  }

  // ---------------------------------------------------------------------------------------------------------------
  // Copy: every line the page writes, in each language, is public-copy.js's (the run's COPY.md lists them), made
  // from the page's clock, days and data.
  // ---------------------------------------------------------------------------------------------------------------
  var num = function (x) { return '<bdi class="num">' + x + "</bdi>"; };
  var T = window.FitwayPublicCopy(en, {
    num: num, iso: iso, hourText: hourText, hourHtml: hourHtml,
    dayName: dayName, usualAt: usualAt, band: band, quietCell: quietCell,
    DAYS: DAYS, TODAY: TODAY, NOW_H: NOW_H, NB: NB, THIN: THIN
  });

  // The page's own line in the markup: the language link, which names the other language in its own words and opens this
  // page in it with every other switch kept.
  var langLink = document.querySelector(".lang"), there = new URLSearchParams(q);
  if (en) there.delete("lang"); else there.set("lang", "en");
  langLink.textContent = T.other;
  langLink.lang = T.otherLang;
  langLink.hreflang = T.otherLang;
  langLink.href = location.pathname + (String(there) ? "?" + there : "");
  document.querySelector('meta[name="description"]').content = T.aboutPage;
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
  function rowsHtml(s, lk, cmp, lastAt) {
    var facts, line, word, lv = LEVELS[lk || levelKey];
    cmp = cmp || vsOf(lv.n);
    if (s === "live" || s === "delayed") {
      word = '<span class="sr-only">' + (s === "live" ? T.srNow : T.srLast) + '</span><span class="level">' + T.words[band(lv.n)] + "</span>";
      facts = '<p class="facts"><span class="count-line">' + T.about(lv.n) + "</span>" + (pctOn ? '<span class="pct">' + T.full(lv.pct) + "</span>" : "") + "</p>";
      line = s === "live"
        ? '<p class="vs">' + (cmp ? vsIcon(cmp) + "<span>" + T.vs[cmp] + "</span>" : "<span>" + STRUT + "</span>") + '</p><p class="stamp"><i class="dot" aria-hidden="true"></i><b>' + T.live + "</b> · " + T.readAt(READ_AT) + "</p>"
        : '<p class="stamp st-late">' + ICON.clock + '<span><span class="late-at"><b>' + T.delayed + "</b> · " + T.lastAt(lastAt || LAST_AT) + T.comma + '</span> <span class="ago">' + T.ago(AGO) + "</span></span></p>";
    } else if (s === "unavailable") {
      word = '<span class="level">' + T.noCount + "</span>";
      facts = "";
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
  // hours fold to nothing). Each bar: .u the usual, flat chalk; .lv the live reading where it stands above the usual,
  // see-through red; .cap the solid red up to the lower of the usual and the reading (those two on the hour now stands
  // in only; a reading below the usual leaves .u see-through above the red); .pk the bar's outline for the focus ring;
  // and .ring, the quiet hour the line names, over it. Nothing after now is measured: those hours are usual, and drawn
  // as usual. Every height is a transform: each layer is the plot's full height, slid down until its top stands at its
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
      b.innerHTML = '<span class="bar"><span class="body"><i class="u"></i><i class="lv"></i><i class="cap"></i><i class="pk"></i></span><i class="rk"><i class="ring"></i></i></span><span class="t"></span>';
      bars.appendChild(b);
      slots[h] = b;
    }
    bars.style.setProperty("--lg", (level.n / TOP).toFixed(4)); // the live red's ramp (CSS)
    wrap.appendChild(bars);
    return { el: wrap, bars: bars, slots: slots };
  }

  // Set a day on the bars: heights, which hours are open, past/now/ahead, labels, the live bar, the circle. Only Live has
  // a now hour (data-when="now": the red); in Delayed and Unavailable the hour now stands in is drawn as its usual, after
  // the hours gone before it; Closed is before the day's first hour.
  function setDay(B, d, picked) {
    var D = DAYS[d], isToday = d === TODAY, whole = wholeDay(d), data = hasDay(), lit = isLive();
    var cells = cellsOf(d), cellAt = {};
    cells.forEach(function (c) { cellAt[c.h] = c; });
    if (!data || !cellAt[picked]) picked = null;
    B.day = d; B.cells = cells; B.cellAt = cellAt;
    B.el.toggleAttribute("data-today", isToday);
    // An empty frame says nothing: the 20 waiting hours leave the tree. (An empty aria-hidden would leave them in it.)
    if (data) B.bars.removeAttribute("aria-hidden"); else B.bars.setAttribute("aria-hidden", "true");
    var rh = ringHour(d);
    // The arrival's order: from the day's first hour, the live hour after the hours before it.
    B.bars.style.setProperty("--now-i", Math.max(0, NOW_H - D.open));
    for (var h = SPAN0; h < SPAN1; h++) {
      var s = B.slots[h], c = cellAt[h], open = !!c, v = open ? c.v : null;
      s.style.setProperty("--i", Math.max(0, h - D.open));
      s.toggleAttribute("data-closed", !open);
      s.style.setProperty("--g", open ? 1 : 0);
      s.style.setProperty("--u", v !== null && data ? (v / TOP).toFixed(4) : 0);
      if (v !== null) s.style.setProperty("--ug", (v / TOP).toFixed(4)); // the column's ramp (CSS); kept when it closes
      s.disabled = !open || !data;
      var when = whole ? "usual" : h < NOW_H ? "past" : h === NOW_H ? (lit ? "now" : "current") : "ahead";
      s.setAttribute("data-when", open ? when : "closed");
      s.style.setProperty("--l", open && when === "now" ? (level.n / TOP).toFixed(4) : 0);
      var ring = data && h === rh;
      s.toggleAttribute("data-quietest", ring);
      s.setAttribute("aria-pressed", open && picked === h ? "true" : "false");
      // "Now" in the hour's spoken name is Live's alone (isLive), a stale reading never says it; the quiet hour still left
      // is spoken where the page carries a time (carriesTime).
      if (open && data) s.setAttribute("aria-label", T.hourName(c, isLive() && isToday && h === NOW_H, !ring ? null : whole ? "day" : carriesTime() ? "left" : null));
      else s.removeAttribute("aria-label");
      // A pick changes no label: its bar's own label, where the day has one, is set bold, and the readout names it.
      s.querySelector(".t").toggleAttribute("data-pick", open && picked === h);
    }
    // One tab stop for the hours: the picked hour, else the hour that has focus (a pick cleared with Escape leaves the
    // stop where focus is, so Tab leaves the hours), else now, else the first open hour; arrows move between them.
    // None while the plot is an empty frame.
    var act = document.activeElement, held = act && act.parentNode === B.bars ? +act.getAttribute("data-h") : null;
    if (held != null && !cellAt[held]) held = null;
    var first = !data ? null : picked != null ? picked : held != null ? held : !whole && cellAt[NOW_H] ? NOW_H : D.open;
    for (h = SPAN0; h < SPAN1; h++) B.slots[h].tabIndex = h === first ? 0 : -1;
    B.picked = picked;
  }

  // Labels, fixed for a day: they follow the day, the plot's width and the direction, never a pick, a hover, focus or
  // a slide, so the clock under the bars never changes under the finger. How often the clock is labelled follows an
  // hour's width: every hour where there is room for it, else every third where the widest label keeps its air from the
  // next (LABEL_AIR), else every sixth, counted from the opening hour, so the day's first hour is named (when it
  // opens, by form) and each label stands under its own bar: fewer labels, never smaller ones. Today in Live adds
  // "Now" under the live hour. The quiet hour takes no label of its own: its circle names it. The digits alone are the
  // label's box, centred on the bar, so the number belongs to its bar; the period hangs after them and takes no part in
  // the centring. A label too close to a stronger one gives way; between two of the same rank, the earlier hour stands.
  // Each label keeps the width of its bold self, so the one a pick sets bold keeps its box. Worked out from the final
  // layout: an hour's width = plot width / open hours.
  function placeLabels(B) {
    var D = DAYS[B.day], hw = B.bars.clientWidth / (D.close - D.open);
    var every = hw >= 75 ? 1 : labelReach(B) + LABEL_AIR <= hw * 3 ? 3 : 6;
    var isToday = B.day === TODAY, items = [];
    var reach = parseFloat(getComputedStyle(card).paddingInlineEnd) - EDGE_AIR; // how far a period may hang past the last hour
    for (var h = SPAN0; h < SPAN1; h++) {
      var t = B.slots[h].querySelector(".t"), cell = B.cellAt[h];
      var isNow = !!cell && isToday && isLive() && h === NOW_H;
      var onClock = cell && cell.i % every === 0;
      var text = !cell ? "" : isNow ? T.now : onClock ? hourText(h) : "";
      var hung = text && !isNow;
      t.textContent = hung ? n12(h) : text;
      t.setAttribute("data-label", hung ? String(n12(h)) : text);
      var sfx = null;
      if (hung) { sfx = el("span", "sfx", half(h)); t.appendChild(sfx); }
      t.toggleAttribute("data-now", isNow);
      t.removeAttribute("data-yield");
      if (!text) continue;
      // Rank: "Now", then the clock's hours.
      var item = { t: t, c: (h - D.open + 0.5) * hw, rank: isNow ? 4 : 0 };
      if (sfx) { // measured on its own: the digits' bold width, and the period past them on the inline-end side
        var sfxW = measure(sfx, "500");
        sfx.remove(); item.w = measure(t); t.appendChild(sfx);
        item.back = item.w / 2; item.fore = item.w / 2 + SFX_GAP + sfxW;
      } else { item.w = measure(t); item.back = item.fore = item.w / 2; }
      // A period that would hang onto the card's edge takes its label with it ("11 PM" on a phone's Friday).
      if (item.c + item.fore - B.bars.clientWidth > reach) { t.setAttribute("data-yield", ""); continue; }
      items.push(item);
    }
    // Strongest first: a label stands unless it would come within the air of one already standing. The extents are the
    // real ones in the inline direction, so one sum serves both languages.
    var air = hw < 21 ? 4 : 16, kept = [];
    items.map(function (it, i) { it.i = i; return it; })
      .sort(function (a, b) { return b.rank - a.rank || a.i - b.i; })
      .forEach(function (it) {
        var hit = kept.some(function (o) {
          var first = o.c <= it.c ? o : it, then = first === o ? it : o;
          return (then.c - then.back) - (first.c + first.fore) < air || (o.rank === 4 && Math.abs(o.c - it.c) < hw * 1.5);
        });
        if (hit) it.t.setAttribute("data-yield", ""); else kept.push(it);
      });
  }
  var SFX_GAP = 3; // CSS, .sfx
  var EDGE_AIR = 4.5; // a label's ink stays this far from the card's edge
  var LABEL_AIR = 6; // the least air between two of the clock's labels, every third hour
  // What the clock's widest label takes from one digit's centre to the next digit's: "12", the wider period and a "3".
  function labelReach(B) {
    var probe = el("span", "t");
    B.slots[SPAN0].appendChild(probe);
    probe.textContent = "12";
    var wide = measure(probe);
    probe.textContent = "3";
    var next = measure(probe);
    var sfx = [0, 12].reduce(function (w, h) { probe.textContent = half(h); return Math.max(w, measure(probe, "500")); }, 0);
    probe.remove();
    return wide / 2 + SFX_GAP + sfx + next / 2;
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
      m[h] = { text: t.textContent, html: t.innerHTML, x: r.left - pr.left, y: r.top - pr.top, w: r.width, a: getComputedStyle(t).textAlign, cls: t.hasAttribute("data-now") };
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
        g.innerHTML = a.html;
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
  // (A word set down can round its line a fraction of a pixel deeper: «تعذر التحميل» at 390 px by 0.41 px. The line
  // keeps the height the word gave it at full size, measured before it is set down.)
  // The word's first stroke stands on the facts' start edge, its side bearing measured and taken back; where a text's
  // strokes stand is public-ink.js's.
  var Ink = window.FitwayPublicInk(rtl);
  function fitWord(head) {
    var w = head.word, word = w.querySelector(".level");
    word.style.fontSize = ""; w.style.blockSize = ""; word.style.marginInlineStart = "";
    if (word.querySelector(".ph")) word.style.marginInlineStart = "0";
    else word.style.marginInlineStart = (-Ink.lead(word)).toFixed(4) + "em";
    var room = sign.clientWidth, need = word.getBoundingClientRect().width;
    // Arabic fits by its ink, not its box. A last letter's stroke reaches past the box («متوفر» by 1.5 px past the
    // card's edge), and a box that leads with a side bearing leaves «شديد الازدحام» 3.8 px short of the far edge.
    if (rtl && !word.querySelector(".ph")) {
      var im = Ink.measure(word);
      need = (im.actualBoundingBoxLeft + im.actualBoundingBoxRight) / 200 * parseFloat(getComputedStyle(word).fontSize);
    }
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
  // AIR px); where one does not («خميس» on the phone), each button takes its name's width and the row's room is shared out
  // evenly, so every name keeps the same air; where seven names do not stand in one row at all (a phone at 200% zoom),
  // the row wraps, so no name ever runs into the next (CSS, data-fit).
  var AIR = 3, AIR_LEAST = 2;
  function fitDays(row) {
    row.removeAttribute("data-fit");
    var btns = row.querySelectorAll(".day-btn"), share = btns[0].getBoundingClientRect().width, need = 0, all = 0;
    var gap = parseFloat(getComputedStyle(row).columnGap) || 0;
    btns.forEach(function (b) { var w = measure(b); need = Math.max(need, w + 2 * AIR); all += w + 2 * AIR_LEAST + gap; });
    if (need > share) row.setAttribute("data-fit", all - gap > row.clientWidth ? "wrap" : "content");
  }

  // The step keys: where a picked day's hour is narrower than a finger (every day but Friday on a phone; Friday too on a
  // phone at 200%), a picked hour brings two keys to the end of the readout's line, the earlier hour and the
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
  function narrow(d) { var D = DAYS[d]; return B.bars.clientWidth / (D.close - D.open) < FINGER; }
  function syncSteps() {
    var on = hasDay() && B.picked != null && narrow(B.day);
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
    return function () {
      setRange(rangeNow());
      hold();
      fit();
      placeLabels(B);
      syncSteps();
    };
  }

  // The state into the page: the head's rows, the card's light (CSS: only Live lights it, LGT-11), the days, the
  // busy marks. The card's answer and the bars follow in show().
  function renderState() {
    page.setAttribute("data-state", state);
    head.el.setAttribute("aria-label", isLive() ? T.rightNow : T.crowd);
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
    if (lineKind === "none") return "";
    return ICON.ring + "<span>" + T.quietLine(quietLeft, lineKind) + "</span>";
  }
  // A whole day: another day, or today before it opens. Every whole day has the one form, the circle and the day's
  // quiet line: its lowest hour and how it usually is.
  function dayWords(d) {
    var low = quietCell(cellsOf(d));
    return ICON.ring + "<span>" + T.quietLine(low.h, band(low.v) === "quiet" ? "quiet" : "less") + "</span>";
  }
  function words(d, h) {
    var html;
    if (state === "loading") html = "<span>" + ph("15em") + "</span>";
    else if (state === "error") html = "<span>" + STRUT + "</span>";
    else html = (wholeDay(d) ? dayWords(d) : todayWords()) || "<span>" + STRUT + "</span>"; // a hidden line keeps its row, so the plot never moves
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
    if (hasDay()) fig.setAttribute("aria-label", T.chartName(d, isLive() && d === TODAY)); else fig.removeAttribute("aria-label");
    // The head is now's: while another day is shown it steps back (CSS).
    page.toggleAttribute("data-away", d !== TODAY);
    words(d, B.picked);
    placeLabels(B);
    if (before) slide(B, before, on ? SLIDE_ON : SLIDE);
    fadeLabels(B, labels);
  }

  // ---------------------------------------------------------------------------------------------------------------
  // Held heights: nothing on the page moves when the day, the state or the reading changes (motion review F1; the
  // Loading behaviour's zero shift). Worked out for the width, again only when it changes:
  // - the head holds the tallest two rows any state writes at this width, at every level and with every comparison (silent
  //   copies, measured), so a state that follows another, or a reading that changes level or hour, moves nothing under the
  //   word; "Live" stands under the percentage at every width (sub, data-mode): where the count and the percentage share a
  //   line they are two columns, the count over the comparison, the percentage over the stamp. The first column is the
  //   count's, widened for the comparison, which may also reach into the gap up to VS_AIR from the stamp, so the two
  //   facts stay a pair in English as in Arabic; "Quieter than usual" takes two lines where that leaves it short (cols-wrap,
  //   a phone under 384 px), and no reading moves either. Where they part, the percentage starts the column's edge, the
  //   comparison on its own line under it and the stamp on the same edge under that, so the comparison never falls after
  //   "Live" (stack); Loading writes Live's rows into Live's boxes (the numbers' rooms, the stamp's room, the comparison's
  //   as the default reading writes it);
  // - the card's head stands on one line where it can: where a day's name and hours would not share one (a 320 px phone),
  //   the hours first let go of the word "Open" (data-tight), and only then stand under the name (data-stack);
  // - on the phone and the tablet the readout holds the tallest of everything it can say at this width: today's
  //   line in either form, every day's answer and every hour a day offers, picked (on the computer the answer stands
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
  var VS_AIR = 12; // the least air between a comparison and the stamp beside it
  var STAMP_HANG = 4; // how far the widest clock ("12:00 ص") may run past the percentage's column, into the page's margin
  var WIDEST_CLOCKS = [10, 12, 22, 24]; // the hours with two digits, "11" being narrow
  function hold() {
    fitWord(head); fitDays(picker.el);
    // The head. The status line first: the widest of the five comparisons at this width, the stamp's width; the default
    // reading's comparison words, the length Loading's line holds. Then the numerals' room: Readex Pro's
    // digits are not tabular, so the count and the percentage each hold the width of the widest the readings write
    // (the four levels'; "00" to "99" would hold 3-5 px more and part the Arabic facts at 360 px). Then Live's rows
    // (their facts row is the height Error's key stands at), every level's in Live and Delayed, Delayed at its widest
    // clocks, and every other state's; the head holds the tallest.
    head.sub.style.minHeight = "";
    head.sub.removeAttribute("data-mode");
    var gs = ghostOf(head.sub, head.el, ""), vsW = 0, stampW = 0, phVs = 0, vsDefault = vsOf(LEVELS.busy.n) || "usual";
    COMPARISONS.forEach(function (c) {
      gs.innerHTML = rowsHtml("live", levelKey, c).sub;
      var v = gs.querySelector(".vs");
      vsW = Math.max(vsW, v.getBoundingClientRect().width);
      if (c === vsDefault) phVs = v.querySelector("span").getBoundingClientRect().width;
    });
    // The stamp's room is its widest time's, so the hour never changes the head's form.
    WIDEST_CLOCKS.forEach(function (h) {
      gs.querySelector(".stamp .num").textContent = clockAt(h, "00");
      stampW = Math.max(stampW, gs.querySelector(".stamp").getBoundingClientRect().width);
    });
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
    });
    gs.innerHTML = rowsHtml("live").sub;
    var W = gs.getBoundingClientRect().width, G = parseFloat(getComputedStyle(gs).columnGap) || 0;
    var countW = gs.querySelector(".count-line").getBoundingClientRect().width;
    var pctW = gs.querySelector(".pct") ? gs.querySelector(".pct").getBoundingClientRect().width : 0;
    var firstCol = W - G - Math.max(pctW, stampW - STAMP_HANG), mode = "stack", colA = 0, reach = Math.max(0, G - VS_AIR);
    if (countW + 0.5 <= firstCol) {
      colA = Math.min(firstCol, Math.max(countW, vsW - reach));
      mode = vsW - 0.5 > colA + reach ? "cols-wrap" : "cols";
    }
    [gs, head.sub].forEach(function (n) {
      n.setAttribute("data-mode", mode);
      n.style.setProperty("--col-a", colA + "px");
      n.style.setProperty("--vs-reach", reach + "px");
    });
    fitFacts(head);
    gs.innerHTML = rowsHtml("live").sub;
    var rowA = wrapFacts(gs).getBoundingClientRect().height, tallest = 0;
    gs.style.setProperty("--row-a", rowA.toFixed(2) + "px");
    var measureRows = function (st, lk, c, at) {
      gs.innerHTML = rowsHtml(st, lk, c, at).sub;
      wrapFacts(gs);
      tallest = Math.max(tallest, gs.getBoundingClientRect().height);
    };
    STATES.forEach(function (st) {
      if (st === "live") COMPARISONS.forEach(function (c) { Object.keys(LEVELS).forEach(function (lk) { measureRows(st, lk, c); }); });
      else if (st === "delayed") Object.keys(LEVELS).forEach(function (lk) { WIDEST_CLOCKS.forEach(function (h) { measureRows(st, lk, null, clockAt(h, "00")); }); });
      else measureRows(st);
    });
    gs.remove();
    head.sub.style.minHeight = tallest + "px"; // exact: Live, where it is the tallest, keeps its own height
    head.sub.style.setProperty("--row-a", rowA.toFixed(2) + "px"); // Error's key row (CSS)
    // The card's name and hours.
    card.removeAttribute("data-stack");
    card.removeAttribute("data-tight");
    if (!isWide()) {
      var room = card.clientWidth - parseFloat(getComputedStyle(card).paddingInlineStart) - parseFloat(getComputedStyle(card).paddingInlineEnd);
      var gap = parseFloat(getComputedStyle(card).columnGap) || 0, keep = { t: title.textContent, h: hours.innerHTML };
      var over = function (bare) {
        return WEEK.some(function (d) {
          title.textContent = T.usualDay(d); hours.innerHTML = T.openHours(d);
          return measure(title, "600") + measure(bare ? hours.querySelector(".num") : hours, "500") + gap > room;
        });
      };
      var tight = over(false), stack = tight && over(true);
      title.textContent = keep.t; hours.innerHTML = keep.h;
      card.toggleAttribute("data-tight", tight && !stack);
      card.toggleAttribute("data-stack", stack);
    }
    // The readout. A pick on a day whose hours are narrower than a finger is measured beside the step keys, which
    // centre on its words' first line (CSS) and reach into the readout's margins without adding to them, so their
    // coming and going moves nothing.
    readout.style.minHeight = "";
    if (!isWide()) {
      var g = ghostOf(readout, card), held = 0;
      var at = quietLeft != null ? quietLeft : DAYS[TODAY].open;
      var say = ["quiet", "less"].map(function (k) { return [ICON.ring + "<span>" + T.quietLine(at, k) + "</span>", false]; });
      WEEK.forEach(function (d) {
        var cells = cellsOf(d), k = narrow(d);
        if (dayWords(d)) say.push([dayWords(d), false]);
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
  // rest, between a floor and a ceiling (on a tall screen the rest goes to the space around). The phone's ceiling
  // follows the screen's height, 289 px at 844 tall to 320 at 932, so the card stays a little under three fifths of a
  // tall phone and the rest goes to the white around the head; its floor comes down from 150 px at 740 tall to 107 at
  // 606, so the days stand on a short phone's first screen, in Readex Pro and in the fallback faces. The tablet's ceiling is three tenths of the screen, so its card
  // stays about half of it and the head stands low in the white above.
  // A range's edge would make the day jump (the next range's frame, rows and floor and ceiling give it another height:
  // at 1023 / 1024 x 768 182 against 300 px in Arabic), so in the BLEND px under an edge the page is also laid out as
  // the next range, measured, and the day runs in a straight line from its own height to that one, which it reaches
  // at the edge: on the phone from 440 px to the tablet's at 600, on the tablet from 864 px to the computer's at 1024.
  // There the page takes a little air or a little more scroll for it; the designed sizes (the phones to 430 px, 600,
  // 768 and 834 on the tablet, every computer) sit outside, and keep their fit.
  var BLEND = 160;
  function fitted() {
    var r = range(), min = r === "phone" ? Math.round(Math.max(107, Math.min(150, 150 - (740 - innerHeight) * 0.32))) : 180;
    var max = r === "computer" ? 560 : r === "tablet" ? Math.min(520, Math.round(innerHeight * 0.3)) : Math.min(320, Math.round(289 + (innerHeight - 844) * 0.35));
    page.classList.add("fitting");
    B.el.style.height = "0px";
    var rest = innerHeight - page.getBoundingClientRect().height;
    page.classList.remove("fitting");
    return Math.max(min, Math.min(max, rest));
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
    B.el.style.height = Math.floor(plot) + "px";
    keyRoom();
  }
  // Error: the word, the ringed key (it has focus on arrival, EMP-5), the sentence and the card stand apart by one gap,
  // up to KEY_ROOM, stroke to stroke. The head holds Error's rows at their closest (hold), so the card and every other
  // state never feel this: the key and the sentence only come down into the white between the head and the card (CSS:
  // --key-down, --line-down), and on a screen too tight for more they stay where the hold put them.
  var KEY_ROOM = 32, KEY_RING = 5;
  function keyRoom() {
    var key = head.sub.querySelector(".retry");
    if (!key) return;
    head.sub.style.setProperty("--key-down", "0px");
    head.sub.style.setProperty("--line-down", "0px");
    var k = key.getBoundingClientRect(), t = Ink.strokes(head.sub.querySelector(".stamp.err > span")), ink = Ink.strokes(head.word.querySelector(".level")).bottom;
    var gap = Math.min(KEY_ROOM, (card.getBoundingClientRect().top - ink - k.height - 2 * KEY_RING - (t.bottom - t.top)) / 3) + KEY_RING;
    var down = Math.max(0, gap - (k.top - ink));
    head.sub.style.setProperty("--key-down", down.toFixed(2) + "px");
    head.sub.style.setProperty("--line-down", (down + Math.max(0, gap - (t.top - k.bottom))).toFixed(2) + "px");
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
    speak(T.arrival(band(level.n), level.n));
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
