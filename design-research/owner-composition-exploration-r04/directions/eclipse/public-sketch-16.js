// FITWAY public crowd page, sketch 16 (public-redesign-r01). Concept only, synthetic data, English this round.
// Sketch 15, polished a fourth time: the level word leads the page in its corner light, one line of facts under it,
// and under them the usual day in the lit card, with now as the one lit hour on it, the quietest time left, and the
// other days. This round: on the phone a dense other day shows one bar per two hours, wide enough for a finger
// (?hours=); the live head steps back while another day is shown, so it reads as now and not as that day (?head=);
// today's day button reads "Fri" like the others, with a small chalk dot under it for today. Then: the hour labels
// under the bars are fixed for a day (a pick, hover, focus or drag never adds, drops or moves one; the readout names
// the picked time), and a picked bar is drawn as the picked day is, its edges in chalk.
// Switches: ?level=quiet|moderate|busy|packed (busy), ?day=mon..sun (today, Friday), ?pct=off (the owner turned the
// percentage off), ?grain=medium|light|faint (the bars' grain, light), ?hours=2|1 (2: on the phone, another day whose
// hours would be narrower than a finger target shows two hours a bar; 1: every day hourly, as sketch 15),
// ?head=quiet|keep (quiet: the head steps back while another day is shown; keep: as sketch 15), ?dir=rtl (the mirror
// check: Arabic's direction with the English words kept; time runs right to left and the week starts on Saturday),
// ?hour=<0-25> (a picked hour, for frames; on a two-hour day it picks the bar that holds it).
(function () {
  "use strict";
  var q = new URLSearchParams(location.search);
  var page = document.querySelector(".page");
  var sign = document.getElementById("sign");
  var rtl = q.get("dir") === "rtl";
  if (rtl) document.documentElement.dir = "rtl";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var wide = matchMedia("(min-width: 1024px)");

  // ---------------------------------------------------------------------------------------------------------------
  // Synthetic data. One room (about 120 at full, never shown), one Friday, the last reading at 7:41 PM.
  // ---------------------------------------------------------------------------------------------------------------
  var LEVELS = {
    quiet: { word: "Quiet", n: 18, pct: 15 },
    moderate: { word: "Moderate", n: 41, pct: 34 },
    busy: { word: "Busy", n: 70, pct: 58 },
    packed: { word: "Packed", n: 96, pct: 80 }
  };
  var levelKey = LEVELS[q.get("level")] ? q.get("level") : "busy";
  var level = LEVELS[levelKey];
  page.setAttribute("data-level", levelKey);
  var pctOn = q.get("pct") !== "off";
  if (!pctOn) page.setAttribute("data-pct", "off");
  // The bars' grain: three strengths for the user to choose by eye, all lighter than sketch 14's (CSS, --gs).
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
  // an hour past 23 is after midnight (24 is the 12 AM hour). Hours are the finest grain.
  var DAYS = {
    mon: { name: "Monday", short: "Mon", open: 5, close: 25, usual: [16, 31, 36, 27, 19, 16, 15, 18, 16, 14, 17, 26, 41, 56, 68, 76, 70, 52, 36, 21] },
    tue: { name: "Tuesday", short: "Tue", open: 5, close: 25, usual: [15, 29, 35, 25, 18, 15, 14, 17, 15, 13, 15, 23, 37, 51, 62, 69, 64, 48, 32, 19] },
    wed: { name: "Wednesday", short: "Wed", open: 5, close: 25, usual: [13, 26, 32, 24, 17, 14, 13, 16, 14, 12, 14, 21, 34, 47, 58, 64, 61, 47, 33, 20] },
    thu: { name: "Thursday", short: "Thu", open: 5, close: 26, usual: [12, 24, 29, 22, 16, 13, 12, 15, 13, 12, 14, 20, 30, 40, 49, 55, 58, 54, 46, 36, 22] },
    fri: { name: "Friday", short: "Fri", open: 13, close: 25, usual: [22, 18, 21, 30, 43, 55, 62, 67, 51, 29, 35, 31] },
    sat: { name: "Saturday", short: "Sat", open: 8, close: 24, usual: [18, 24, 33, 41, 44, 38, 30, 27, 35, 46, 55, 60, 58, 47, 34, 21] },
    sun: { name: "Sunday", short: "Sun", open: 5, close: 25, usual: [14, 28, 34, 26, 18, 15, 14, 17, 15, 13, 16, 24, 38, 52, 63, 71, 66, 50, 34, 20] }
  };
  var TODAY = "fri", NOW_H = 19, READ_AT = "7:41 PM"; // today's closing, 1 AM, is the card's "Open 1 PM – 1 AM"
  // Arabic's week starts on Saturday; English keeps the week Google's English keeps, from Monday.
  var WEEK = rtl ? ["sat", "sun", "mon", "tue", "wed", "thu", "fri"] : ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  var SPAN0 = 24, SPAN1 = 0;
  var busiestUsual = 0;
  Object.keys(DAYS).forEach(function (k) {
    var d = DAYS[k];
    SPAN0 = Math.min(SPAN0, d.open); SPAN1 = Math.max(SPAN1, d.close);
    busiestUsual = Math.max(busiestUsual, Math.max.apply(null, d.usual));
  });
  // One scale for every day: the week's busiest usual hour with a little air, or the live count where it runs over
  // that. Never the gym's capacity, so no height reads back into one. (Sketch 12 kept a third of the plot empty for a
  // reading that only Packed reaches.)
  var TOP = Math.ceil(Math.max(busiestUsual * 1.1, level.n * 1.04));

  function usualAt(d, h) { var D = DAYS[d]; return h >= D.open && h < D.close ? D.usual[h - D.open] : null; }
  function band(v) { return v < 30 ? "quiet" : v < 60 ? "moderate" : v < 90 ? "busy" : "packed"; }
  function hourText(h) { var c = h % 24, n = c % 12 || 12; return n + (c < 12 ? " AM" : " PM"); }
  function lowest(d, from) {
    var D = DAYS[d], best = null;
    for (var h = Math.max(D.open, from); h < D.close; h++) if (best === null || usualAt(d, h) < usualAt(d, best)) best = h;
    return best;
  }
  // A day's bars: one per hour, or one per two hours counted from the opening hour (an odd last hour stands alone, at
  // an hour's width, so the clock stays true). A two-hour bar stands for its busier hour: its height, its word, its
  // spoken name and the day's quietest and busiest all use it, so the page never promises a quieter time than one of
  // its hours usually is (sketch 16 used the mean: 6 – 8 PM read "moderate" although 7 PM alone is "busy"). Each hour's
  // own usual is kept (us), so a picked bar can tell its hours apart.
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
  // A span as the clock writes it: "6 – 8 PM", "10 AM – 12 PM", "10 PM – 12 AM"; one hour is its own hour.
  function spanText(c, to) {
    if (c.n === 1) return hourText(c.h);
    var a = c.h % 24, b = (c.h + c.n) % 24, s = hourText(c.h);
    if ((a < 12) === (b < 12)) s = s.replace(/ [AP]M$/, "");
    return s + (to || " – ") + hourText(c.h + c.n);
  }
  function quietCell(cells) { return cells.reduce(function (a, c) { return c.v < a.v ? c : a; }); }
  function busyCell(cells) { return cells.reduce(function (a, c) { return c.v > a.v ? c : a; }); }

  // The quietest full hour still ahead today, held against now. The page never sends the visitor to a later hour
  // that is usually busier than it is right now: "now" when the live count is clearly under that hour's usual, "same"
  // when it is within a tenth of it, "later" when the later hour is clearly quieter.
  var quietLeft = lowest(TODAY, NOW_H + 1);
  var leftUsual = quietLeft != null ? usualAt(TODAY, quietLeft) : null;
  var nowVsLeft = quietLeft == null ? "none" : level.n < leftUsual * 0.9 ? "now" : level.n <= leftUsual * 1.1 ? "same" : "later";
  var ringHour = nowVsLeft === "later" || nowVsLeft === "same" ? quietLeft : null;

  // Today against a usual Friday at this hour.
  var usualNow = usualAt(TODAY, NOW_H), ratio = level.n / usualNow;
  var vs = ratio < 0.6 ? "much-quieter" : ratio < 0.9 ? "quieter" : ratio <= 1.1 ? "usual" : ratio <= 1.4 ? "busier" : "much-busier";
  // The live hour's grain runs the way today runs against the usual: up when busier, down when quieter (CSS, Motion).
  page.setAttribute("data-flow", vs.indexOf("busier") >= 0 ? "up" : vs.indexOf("quieter") >= 0 ? "down" : "still");
  if (vs.indexOf("much") === 0) page.setAttribute("data-much", "");

  // ---------------------------------------------------------------------------------------------------------------
  // Copy. Every line the page writes is here, and the one line in the HTML (Arabic follows from this list).
  // ---------------------------------------------------------------------------------------------------------------
  var T = {
    srNow: "Crowd right now: ",
    about: function (n) { return 'About <bdi class="num">' + n + "</bdi> inside"; },
    full: function (p) { return '<bdi class="num">' + p + "%</bdi> full"; },
    // Under the word, so "right now" goes without saying.
    vs: {
      "much-quieter": "Much quieter than usual",
      quieter: "Quieter than usual",
      usual: "About as busy as usual",
      busier: "Busier than usual",
      "much-busier": "Much busier than usual"
    },
    live: "Live",
    // The reading's time beside Live, as the Owner pages' Inside now card stamps it.
    readAt: function (t) { return '<bdi class="num">' + t + "</bdi>"; },
    usualDay: function (d) { return "A usual " + DAYS[d].name; },
    openHours: function (d) { return 'Open <bdi class="num">' + hourText(DAYS[d].open) + "&#8201;&#8211;&#8201;" + hourText(DAYS[d].close) + "</bdi>"; },
    // The card's answer keeps one shape for today: "Quietest time left:" and when.
    quietestLeft: function (h) { return 'Quietest time left: <b class="num">' + hourText(h) + "</b>, usually " + band(usualAt(TODAY, h)); },
    quietestSame: function (h) { return 'Quietest time left: <b>now</b> or <b class="num">' + hourText(h) + "</b>"; },
    nowQuietest: "Quietest time left: <b>now</b>",
    // Another day: its card is titled "A usual …", so the line says only when; on two-hour bars, the two bars' spans.
    dayRange: function (cells, n) {
      var lo = spanText(quietCell(cells)), hi = spanText(busyCell(cells));
      return n > 1 ? 'Quietest <b class="num">' + lo + '</b>, busiest <b class="num">' + hi + "</b>"
        : 'Quietest at <b class="num">' + lo + '</b>, busiest at <b class="num">' + hi + "</b>";
    },
    // A picked hour, the hour now stands in too: the head above already says now, so the card says what it does not,
    // the hour's usual (its chalk top) and, under "Now" on the clock, which hour now is. A two-hour bar names its span
    // where its hours share a word, and each hour in clock order where they do not ("6 PM usually moderate · 7 PM
    // usually busy"); each hour's words hold together and the dot stays with the first, so a narrow line breaks after
    // the dot and never opens the next line with it.
    cellUsual: function (c) {
      if (!splits(c)) return '<b class="num">' + spanText(c) + "</b>: usually " + band(c.v);
      return c.us.map(function (u, j) {
        return '<span class="hr"><b class="num">' + hourText(c.h + j) + "</b> usually " + band(u) + (j < c.n - 1 ? " ·" : "") + "</span>";
      }).join(" ");
    },
    // The spoken name of a bar whose hours read differently: each hour's ("6 PM usually moderate, 7 PM usually busy").
    splitName: function (c) {
      return c.us.map(function (u, j) { return hourText(c.h + j) + " usually " + band(u); }).join(", ");
    },
    quietestName: ", the quietest time left today",
    now: "Now",
    today: "Today",
    days: "Day",
    hours: "Hours",
    chartName: function (d, n) {
      var D = DAYS[d], s = "A usual " + D.name + (n > 1 ? " in two-hour steps, " : " by the hour, ") + hourText(D.open) + " to " + hourText(D.close);
      return d === TODAY ? s + ", with now at " + hourText(NOW_H) : s;
    }
  };

  // Icons, drawn: one stroke, one weight.
  var ICON = {
    up: '<svg class="ic" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8 13.5V3M3.5 7.5 8 3l4.5 4.5"/></svg>',
    down: '<svg class="ic" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8 2.5V13M3.5 8.5 8 13l4.5-4.5"/></svg>',
    level: '<svg class="ic" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 6h11M2.5 10h11"/></svg>',
    // The quietest hour left's own mark: the ring the chart draws over that hour.
    ring: '<svg class="ic ic-ring" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="4.25"/></svg>'
  };
  var vsIcon = vs.indexOf("quieter") >= 0 ? ICON.down : vs === "usual" ? ICON.level : ICON.up;

  // The mirror check keeps the English words: each English line is one left-to-right run inside the mirrored page.
  function run(html) { return rtl ? '<span class="en-run">' + html + "</span>" : html; }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  // ---------------------------------------------------------------------------------------------------------------
  // The live reading: the word, and one line under it (the count and the percentage, today against usual, the
  // stamp). No level mark: the word says the level, and the lit hour in the card under it is its picture.
  // ---------------------------------------------------------------------------------------------------------------
  function liveBlock() {
    var box = el("section", "live");
    box.setAttribute("aria-label", "Right now");
    var h = el("h1", "word");
    h.innerHTML = '<span class="sr-only">' + T.srNow + "</span>" + run('<span class="level">' + level.word + "</span>");
    box.appendChild(h);
    var sub = el("div", "sub");
    sub.appendChild(el("p", "facts", '<span class="count-line">' + run(T.about(level.n)) + "</span>" + (pctOn ? '<span class="pct">' + run(T.full(level.pct)) + "</span>" : "")));
    sub.appendChild(el("p", "vs", vsIcon + "<span>" + run(T.vs[vs]) + "</span>"));
    sub.appendChild(el("p", "stamp", '<i class="dot" aria-hidden="true"></i>' + run("<b>" + T.live + "</b> · " + T.readAt(READ_AT))));
    box.appendChild(sub);
    return box;
  }

  // ---------------------------------------------------------------------------------------------------------------
  // A day as hour bars: the picked day's opening hours fill the width, and a change of day reflows the bars (closed
  // hours fold to nothing). Each bar: .u the usual (grain), .lv the live reading (light, the hour now stands in only),
  // .cap the usual's chalk top, .pk the bar's outline (its .edge lit in chalk when picked, the focus ring around it),
  // and .ring, the quietest hour left, over it. Nothing after now is measured: those hours are usual, and drawn as
  // usual. Every height is a transform: each layer is the plot's full height, slid down until its top stands at its
  // value, and the plot's floor clips what is under it.
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
    if (HOURS === 1 || d === TODAY || wide.matches) return 1;
    var D = DAYS[d];
    return B.bars.clientWidth / (D.close - D.open) < FINGER ? 2 : 1;
  }

  // Set a day on the bars: heights, which hours are open, past/now/ahead, labels, the live bar, the quietest ring. A
  // two-hour bar is its first hour's slot at twice the width (flex 2); its second hour folds into it (flex 0), taking
  // the bar's height as it goes, so a change between one and two hours a bar is the same movement as a change of day.
  function setDay(B, d, picked) {
    var D = DAYS[d], isToday = d === TODAY;
    var n = grainFor(B, d), cells = cellsOf(d, n), head = {}, cellAt = {};
    cells.forEach(function (c) { head[c.h] = c; for (var j = 0; j < c.n; j++) cellAt[c.h + j] = c; });
    if (picked != null) picked = cellAt[picked] ? cellAt[picked].h : null; // an hour inside a bar picks the bar
    B.day = d; B.grain = n; B.cells = cells; B.cellAt = cellAt;
    B.el.toggleAttribute("data-today", isToday);
    // The arrival's order: from the day's first hour, the live hour after the hours before it.
    B.bars.style.setProperty("--now-i", NOW_H - D.open);
    for (var h = SPAN0; h < SPAN1; h++) {
      var s = B.slots[h], c = head[h], within = cellAt[h], open = !!c, v = within ? within.v : null;
      s.style.setProperty("--i", Math.max(0, h - D.open));
      s.toggleAttribute("data-closed", !open);
      // An odd last hour on a two-hour day: its bar stays an hour wide, its target reaches past the plot's end (CSS).
      s.toggleAttribute("data-lone", open && n > 1 && c.n === 1);
      s.style.setProperty("--g", open ? c.n : 0);
      s.style.setProperty("--u", v !== null ? (v / TOP).toFixed(4) : 0);
      if (v !== null) s.style.setProperty("--ug", (v / TOP).toFixed(4)); // the column's ramp (CSS); kept when it closes
      s.disabled = !open;
      var when = !isToday ? "usual" : h < NOW_H ? "past" : h === NOW_H ? "now" : "ahead";
      s.setAttribute("data-when", open ? when : "closed");
      s.style.setProperty("--l", open && when === "now" ? (level.n / TOP).toFixed(4) : 0);
      var ring = isToday && h === ringHour;
      s.toggleAttribute("data-quietest", ring);
      s.setAttribute("aria-pressed", open && picked === h ? "true" : "false");
      // Today is hourly, so "now" and the quietest left never meet a bar whose hours read differently.
      if (open) s.setAttribute("aria-label", splits(c) ? T.splitName(c) : spanText(c, " to ") + (when === "now" ? ", " + T.now.toLowerCase() : "") + ", usually " + band(v) + (ring ? T.quietestName : ""));
      else s.removeAttribute("aria-label");
      // A pick changes no label: its bar's own label, where the day has one, is set bold, and the readout names it.
      s.querySelector(".t").toggleAttribute("data-pick", open && picked === h);
    }
    // One tab stop for the hours: the picked hour, or now, or the first open hour; arrows move between them.
    var first = picked != null ? picked : isToday ? NOW_H : D.open;
    for (h = SPAN0; h < SPAN1; h++) B.slots[h].tabIndex = h === first ? 0 : -1;
    B.picked = picked;
  }

  // Labels, fixed for a day: they follow the day, the plot's width and the direction, never a pick, a hover, focus or
  // a slide, so the clock under the bars never changes under the finger (sketch 16 put a picked bar's span in and
  // pushed its neighbours out; the readout names the picked time). How often the clock is labelled follows a bar's
  // width: every bar where there is room for it, else every second, third or sixth, counted from the opening hour, so
  // the day's first hour is always named (when it opens, by form). A bar's label is its first hour. Today adds two
  // labels of its own, part of its answer: "Now", and the quietest hour left. A label too close to a stronger one
  // gives way; the first and last stand on the plot's edges. Each label keeps the width of its bold self, so the one
  // a pick sets bold keeps its box. Worked out from the final layout: an hour's width = plot width / open hours, a
  // bar's = that times its hours.
  function placeLabels(B) {
    var D = DAYS[B.day], W = B.bars.clientWidth, hw = W / (D.close - D.open), sw = hw * B.grain;
    var every = sw >= 64 ? 1 : sw >= 34 ? 2 : sw >= 21 ? 3 : 6;
    var isToday = B.day === TODAY, items = [];
    for (var h = SPAN0; h < SPAN1; h++) {
      var t = B.slots[h].querySelector(".t"), cell = B.cellAt[h], head = !!cell && cell.h === h;
      var isNow = head && isToday && h === NOW_H, isRing = head && isToday && h === ringHour && !isNow;
      var text = !head ? "" : isNow ? T.now : isRing || cell.i % every === 0 ? hourText(h) : "";
      t.innerHTML = text ? run(text) : "";
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
  function measure(t) {
    if (!measurer) { measurer = el("span", "measure"); measurer.setAttribute("aria-hidden", "true"); document.body.appendChild(measurer); }
    measurer.style.font = getComputedStyle(t).font;
    measurer.style.fontWeight = "600"; // a label's box is its bold self's (CSS, .t::after)
    measurer.textContent = t.textContent;
    return measurer.getBoundingClientRect().width;
  }

  // The day picker: the seven days in the week's order, each by its short name; today is marked by a chalk dot under
  // its name (CSS), and its name says "today" to a screen reader. The visible name leads the spoken one (WCAG 2.5.3).
  function dayPicker(current, onPick) {
    var g = el("div", "days");
    g.setAttribute("role", "radiogroup");
    g.setAttribute("aria-label", T.days);
    WEEK.forEach(function (d) {
      var b = el("button", "day-btn");
      b.type = "button";
      b.setAttribute("role", "radio");
      b.setAttribute("data-day", d);
      b.setAttribute("aria-label", d === TODAY ? DAYS[d].name + ", " + T.today.toLowerCase() : DAYS[d].name);
      b.toggleAttribute("data-today", d === TODAY);
      b.innerHTML = run(DAYS[d].short);
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
      if (!b) return;
      sync(b.getAttribute("data-day"));
      onPick(b.getAttribute("data-day"));
    });
    g.addEventListener("keydown", function (e) { rove(e, g, ".day-btn", function (b) { b.click(); }); });
    return { el: g, sync: sync };
  }

  // Arrow keys move along a row in reading order (mirrored in RTL); Home and End jump.
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
  // sideways along the day picks each hour it passes, so a 16 px hour on a phone Monday needs no aim. A vertical
  // swipe still scrolls the page (touch-action: pan-y on the bars). A pointer's tap is taken on its release, not from
  // the click that may follow (Chromium drops the click of a tap that comes just after a slide); the click is left to
  // the keyboard and to assistive technology (a click with no pointer behind it, detail 0).
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
      if (e.button !== 0) return;
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
    // Escape clears a picked hour (as picking it again does), and the card's answer returns.
    B.bars.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && B.picked != null) { e.preventDefault(); onPick(null, true); return; }
      rove(e, B.bars, ".slot", function (s) { onPick(+s.getAttribute("data-h"), true); });
    });
  }

  // A picked day reflows the bars as one movement on screen, 280 ms on a strong ease in and out (STANDARDS.md):
  // heights glide (their transitions, CSS), and every hour goes from where it is seen to its new place and width
  // (FLIP: a translate on the bar and on its label, a scale on the bar's body, so the ring over it never bends). A
  // closed hour stands folded to nothing at the day's edge (flex 0), so an hour that opens unfolds from that edge as it
  // rises, and an hour that closes folds into it as it sinks. Measured from the screen, so a second pick in the middle
  // of a movement carries on from where the bars are. Under reduced motion, or from a key, the new day stands at once.
  var SLIDE = { duration: 280, easing: "cubic-bezier(0.77, 0, 0.175, 1)", id: "slide" };
  function seen(B) {
    var m = {};
    for (var h = SPAN0; h < SPAN1; h++) {
      var r = B.slots[h].querySelector(".body").getBoundingClientRect();
      m[h] = { c: r.left + r.width / 2, w: r.width };
    }
    return m;
  }
  function stopSlide(B) {
    B.bars.querySelectorAll(".bar, .body, .t").forEach(function (n) {
      n.getAnimations().forEach(function (a) { if (a.id === "slide") a.cancel(); });
    });
    B.bars.querySelectorAll("[data-leaving]").forEach(function (s) { s.removeAttribute("data-leaving"); s.style.removeProperty("--bw"); });
  }
  function folded(slot, body) {
    return function () {
      slot.removeAttribute("data-leaving");
      slot.style.removeProperty("--bw");
      body.getAnimations().forEach(function (a) { if (a.id === "slide") a.cancel(); });
    };
  }
  function slide(B, before) {
    for (var h = SPAN0; h < SPAN1; h++) {
      var s = B.slots[h], o = before[h], open = !s.hasAttribute("data-closed");
      if (!open && o.w < 0.5) continue; // folded before and after
      var bar = s.querySelector(".bar"), body = s.querySelector(".body"), t = s.querySelector(".t");
      if (!open) { s.setAttribute("data-leaving", ""); s.style.setProperty("--bw", o.w + "px"); }
      var r = bar.getBoundingClientRect(), dx = o.c - (r.left + r.width / 2);
      var from = "translateX(" + dx.toFixed(2) + "px)";
      if (!open) {
        bar.animate([{ transform: from }, { transform: "none" }], SLIDE);
        body.animate([{ transform: "none" }, { transform: "scaleX(0)" }], Object.assign({ fill: "forwards" }, SLIDE)).onfinish = folded(s, body);
        continue;
      }
      var sx = r.width > 0 ? o.w / r.width : 1;
      if (Math.abs(dx) >= 0.5) {
        bar.animate([{ transform: from }, { transform: "none" }], SLIDE);
        // An opening hour's label rides out with it from the edge, but shows only once the hours have room.
        if (t.textContent) t.animate(o.w < 0.5 ? [{ transform: from, opacity: 0 }, { opacity: 0, offset: 0.6 }, { transform: "none", opacity: 1 }] : [{ transform: from }, { transform: "none" }], SLIDE);
      }
      if (Math.abs(sx - 1) >= 0.005) body.animate([{ transform: "scaleX(" + sx.toFixed(4) + ")" }, { transform: "none" }], SLIDE);
    }
  }

  // ---------------------------------------------------------------------------------------------------------------
  // The page: the live reading above, the usual day in the lit card under it, on the phone and the computer alike.
  // ---------------------------------------------------------------------------------------------------------------
  var pickedDay = DAYS[q.get("day")] ? q.get("day") : TODAY;
  var hq = q.get("hour"), pickedHour = hq !== null && usualAt(pickedDay, +hq) !== null ? +hq : null;

  function build() {
    sign.appendChild(liveBlock());
    var card = el("section", "card daycard");
    card.setAttribute("aria-labelledby", "day-title");
    card.innerHTML = '<span class="lamp" aria-hidden="true"><span class="lamp-in"></span><span class="lamp-rim"></span></span>';
    var title = el("h2", "card-title"); title.id = "day-title";
    var hours = el("p", "card-hours");
    var readout = el("p", "readout");
    readout.setAttribute("aria-live", "polite");
    var fig = el("figure", "dayfig");
    var B = dayBars();
    fig.appendChild(B.el);
    var picker = dayPicker(pickedDay, function (d) { show(d, null, true); });
    [title, hours, readout, fig, picker.el].forEach(function (n) { card.appendChild(n); });
    sign.appendChild(card);

    // The card's answer, and a picked hour's words in its place. On the phone the readout holds the tallest of the
    // answer and every pick the day offers, picked or not: on a narrow phone the answer takes two lines and an hour
    // one, and a two-hour bar whose hours read differently takes two where the answer takes one, and the bars would
    // jump a line under the finger on the first pick or as it slides (sketch 15 moved them 22 px at 360 px).
    function pickWords(c) { return "<span>" + run(T.cellUsual(c)) + "</span>"; }
    function words(d, h) {
      var html;
      if (d !== TODAY) html = "<span>" + run(T.dayRange(B.cells, B.grain)) + "</span>";
      else if (nowVsLeft === "now") html = "<span>" + run(T.nowQuietest) + "</span>";
      else if (nowVsLeft === "same") html = ICON.ring + "<span>" + run(T.quietestSame(quietLeft)) + "</span>";
      else if (nowVsLeft === "later") html = ICON.ring + "<span>" + run(T.quietestLeft(quietLeft)) + "</span>";
      else html = "";
      readout.style.minHeight = "";
      if (!wide.matches) { // the computer's answer stands on one line, beside the card's name
        // Measured on a silent copy across the same grid area, so the live region announces only the hour.
        var ghost = readout.cloneNode(false), held = 0;
        ghost.removeAttribute("aria-live");
        ghost.setAttribute("aria-hidden", "true");
        ghost.style.cssText = "position:absolute;visibility:hidden;inset-inline:0";
        card.appendChild(ghost);
        [html].concat(B.cells.map(pickWords)).forEach(function (w) {
          ghost.innerHTML = w;
          held = Math.max(held, ghost.getBoundingClientRect().height);
        });
        readout.style.minHeight = held + "px";
        ghost.remove();
      }
      if (h != null) html = pickWords(B.cellAt[h]);
      readout.innerHTML = html;
      readout.toggleAttribute("data-picked", h != null);
    }
    function show(d, h, animate) {
      var before = animate && !reduce && d !== B.day && !page.hasAttribute("data-keys") ? seen(B) : null;
      stopSlide(B);
      title.innerHTML = run(T.usualDay(d));
      hours.innerHTML = run(T.openHours(d));
      setDay(B, d, h);
      fig.setAttribute("aria-label", T.chartName(d, B.grain));
      // The head is now's: while another day is shown it steps back (?head=quiet, CSS).
      page.toggleAttribute("data-away", d !== TODAY);
      words(d, B.picked);
      placeLabels(B);
      if (before) slide(B, before);
    }
    // A pick leaves the labels where the day put them (placeLabels runs only for a day or a width).
    hourInput(B, function (h, keepFocus) {
      setDay(B, B.day, h); words(B.day, B.picked);
      var f = B.slots[h != null ? h : -1];
      if (!keepFocus && f && document.activeElement && document.activeElement.closest(".bars") === B.bars) f.focus();
    });
    // The day fills what the screen leaves it: the page is measured with the plot at nothing, and the plot takes the
    // rest, between a floor and a ceiling (on a tall screen the rest goes to the space around). The phone's concept
    // label stays under the fold.
    function fit() {
      var min = wide.matches ? 180 : 150, max = wide.matches ? 560 : 320;
      var foot = document.querySelector(".concept-foot");
      page.classList.add("fitting");
      B.el.style.height = "0px";
      var natural = page.getBoundingClientRect().height - (foot && foot.offsetParent ? foot.getBoundingClientRect().height : 0);
      B.el.style.height = Math.round(Math.max(min, Math.min(max, innerHeight - natural))) + "px";
      page.classList.remove("fitting");
    }
    show(pickedDay, pickedHour, false);
    fit();
    // A new width can change how many hours a bar holds (a phone turned, a window resized): the day is set again.
    return function () {
      if (grainFor(B, B.day) !== B.grain) show(B.day, B.picked, false);
      else words(B.day, B.picked); // the answer's held height, at the new width and in the loaded face
      fit();
      placeLabels(B);
    };
  }

  // Motion: the arrival raises the bars from the floor in the day's order, the live hour after the hours before it.
  // Set before the page is built, so no bar is ever drawn at its height and then lowered. Under reduced motion it never
  // runs and every bar stands at its height from the first frame.
  if (!reduce) page.setAttribute("data-intro", "");
  var relayout = build();

  // The arrival's stagger ends at the visitor's first touch or key, so a pick never waits on it.
  ["pointerdown", "keydown"].forEach(function (t) { addEventListener(t, function () { page.removeAttribute("data-rise"); }, { capture: true, once: true }); });
  // What a key starts changes at once (STANDARDS.md: never animate keyboard-initiated actions): arrows, Home, End and
  // Escape on the hours, arrows, Space and Enter on the days. A pointer that moves or presses brings the motion back.
  addEventListener("keydown", function () { page.setAttribute("data-keys", ""); }, true);
  addEventListener("pointerdown", function () { page.removeAttribute("data-keys"); }, true);
  addEventListener("pointermove", function (e) { if ((e.movementX || e.movementY) && page.hasAttribute("data-keys")) page.removeAttribute("data-keys"); }, true);
  addEventListener("resize", function () { relayout(); });
  wide.addEventListener("change", function () { relayout(); });

  // Ready once the Readex Pro weights the page uses have loaded (Latin, and the Arabic of the language button).
  Promise.all(["400", "500", "600", "700"].map(function (w) {
    return document.fonts.load(w + ' 16px "Readex Pro"', "العربية FITWAY Quiet Moderate Busy Packed 0123456789%").catch(function () {});
  })).then(function () {
    relayout();
    window.__sketch = { ready: true };
    if (!reduce) requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        page.setAttribute("data-rise", "");
        page.removeAttribute("data-intro");
        setTimeout(function () { page.removeAttribute("data-rise"); }, 2600);
      });
    });
  });
})();
