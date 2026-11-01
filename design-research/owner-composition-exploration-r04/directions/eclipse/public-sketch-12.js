// FITWAY public crowd page, sketch 12 (public-redesign-r01). Concept only, synthetic data, English this round.
// The page is built around what it gives the trainee: the usual day with "Now" on it, whether today runs busier or
// quieter than usual, the quietest time left today, other days, and the live reading.
// Switches: ?design=day|week|later (day without it), ?level=quiet|moderate|busy|packed (busy), ?day=mon..sun (today,
// Friday), ?pct=off (the owner turned the percentage off), ?dir=rtl (the mirror check: Arabic's direction with the
// English words kept; time runs right to left and the week starts on Saturday), ?hour=<0-25> (a picked hour, for frames).
(function () {
  "use strict";
  var q = new URLSearchParams(location.search);
  var page = document.querySelector(".page");
  var sign = document.getElementById("sign");
  var rtl = q.get("dir") === "rtl";
  if (rtl) document.documentElement.dir = "rtl";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  var DESIGNS = ["day", "week", "later"];
  var design = DESIGNS.indexOf(q.get("design")) >= 0 ? q.get("design") : "day";
  page.setAttribute("data-design", design);

  // ---------------------------------------------------------------------------------------------------------------
  // Synthetic data. One room (about 120 at full, never shown), one Friday, the last reading at 7:41 PM.
  // ---------------------------------------------------------------------------------------------------------------
  var LEVELS = {
    quiet: { word: "Quiet", n: 18, pct: 15, step: 1 },
    moderate: { word: "Moderate", n: 41, pct: 34, step: 2 },
    busy: { word: "Busy", n: 70, pct: 58, step: 3 },
    packed: { word: "Packed", n: 96, pct: 80, step: 4 }
  };
  var levelKey = LEVELS[q.get("level")] ? q.get("level") : "busy";
  var level = LEVELS[levelKey];
  page.setAttribute("data-level", levelKey);
  var pctOn = q.get("pct") !== "off";
  if (!pctOn) page.setAttribute("data-pct", "off");

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
  var TODAY = "fri", NOW_H = 19, READ_AT = "7:41 PM", CLOSES_AT = "1:00 AM";
  // Arabic's week starts on Saturday; English keeps the week Google's English keeps, from Monday.
  var WEEK = rtl ? ["sat", "sun", "mon", "tue", "wed", "thu", "fri"] : ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  var SPAN0 = 24, SPAN1 = 0;
  var busiestUsual = 0;
  Object.keys(DAYS).forEach(function (k) {
    var d = DAYS[k];
    SPAN0 = Math.min(SPAN0, d.open); SPAN1 = Math.max(SPAN1, d.close);
    busiestUsual = Math.max(busiestUsual, Math.max.apply(null, d.usual));
  });
  // The day's top: the week's busiest usual hour with air above it, or the live count where it runs over that. Never
  // the gym's capacity, so no height reads back into one.
  var TOP = Math.ceil(Math.max(busiestUsual * 1.32, level.n * 1.04));

  function usualAt(d, h) { var D = DAYS[d]; return h >= D.open && h < D.close ? D.usual[h - D.open] : null; }
  function band(v) { return v < 30 ? "quiet" : v < 60 ? "moderate" : v < 90 ? "busy" : "packed"; }
  // A time never breaks across lines ("2" and "PM" stay together): a no-break space.
  function hourText(h) { var c = h % 24, n = c % 12 || 12; return n + (c < 12 ? " AM" : " PM"); }
  function lowest(d, from) {
    var D = DAYS[d], best = null;
    for (var h = Math.max(D.open, from); h < D.close; h++) if (best === null || usualAt(d, h) < usualAt(d, best)) best = h;
    return best;
  }
  function highest(d) {
    var D = DAYS[d], best = D.open;
    for (var h = D.open; h < D.close; h++) if (usualAt(d, h) > usualAt(d, best)) best = h;
    return best;
  }
  var quietLeft = lowest(TODAY, NOW_H + 1); // the quietest full hour still ahead today

  // Today against a usual Friday at this hour.
  var usualNow = usualAt(TODAY, NOW_H), ratio = level.n / usualNow;
  var vs = ratio < 0.6 ? "much-quieter" : ratio < 0.9 ? "quieter" : ratio <= 1.1 ? "usual" : ratio <= 1.4 ? "busier" : "much-busier";

  // ---------------------------------------------------------------------------------------------------------------
  // Copy. Every line the page writes is here (Arabic follows from this list).
  // ---------------------------------------------------------------------------------------------------------------
  var T = {
    srNow: "Crowd right now: ",
    about: function (n) { return 'About <bdi class="num">' + n + "</bdi> inside"; },
    full: function (p) { return '<bdi class="num">' + p + "%</bdi> full"; },
    // Today against the usual for this hour of a Friday (the card under it names the usual Friday).
    vs: {
      "much-quieter": "Much quieter than usual right now",
      quieter: "Quieter than usual right now",
      usual: "About as busy as usual right now",
      busier: "Busier than usual right now",
      "much-busier": "Much busier than usual right now"
    },
    live: "Live",
    lastReading: function (t) { return 'Last reading <bdi class="num">' + t + "</bdi>"; },
    openUntil: function (t) { return 'Open until <bdi class="num">' + t + "</bdi>"; },
    usualDay: function (d) { return "A usual " + DAYS[d].name; },
    openHours: function (d) { return 'Open <bdi class="num">' + hourText(DAYS[d].open) + "&#8201;&#8211;&#8201;" + hourText(DAYS[d].close) + "</bdi>"; },
    quietestLeft: function (h) { return 'Quietest time left: <b class="num">' + hourText(h) + "</b>, usually " + band(usualAt(TODAY, h)); },
    quietestLeftToday: "Quietest time left today",
    dayRange: function (d) { return 'Usually quietest at <b class="num">' + hourText(lowest(d, 0)) + '</b>, busiest at <b class="num">' + hourText(highest(d)) + "</b>"; },
    hourUsual: function (d, h) { return '<b class="num">' + hourText(h) + "</b>: usually " + band(usualAt(d, h)); },
    // The hour now stands in: the same comparison as the line under the word, so "busy now" never sits beside
    // "usually busy" while that line says "busier".
    hourNow: function (h) { return '<b class="num">' + hourText(h) + "</b>: " + level.word.toLowerCase() + " now, " + T.vsShort[vs]; },
    vsShort: { "much-quieter": "much quieter than usual", quieter: "quieter than usual", usual: "as busy as usual", busier: "busier than usual", "much-busier": "much busier than usual" },
    now: "Now",
    today: "Today",
    days: "Day",
    hours: "Hours",
    week: "The usual week",
    usual: "usually",
    later: "Later",
    quietestTag: "Quietest left",
    quietestDay: "Quietest",
    chartName: function (d) {
      var D = DAYS[d], s = "A usual " + D.name + " by the hour, " + hourText(D.open) + " to " + hourText(D.close);
      return d === TODAY ? s + ", with now at " + hourText(NOW_H) : s;
    },
    weekName: "The usual week by the hour, one row a day",
    legendUsual: "Usual",
    legendNow: "Now"
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
  // Parts
  // ---------------------------------------------------------------------------------------------------------------

  // The level mark: four steps rising in reading order, lit up to the level. Decorative; the word says it.
  function mark() {
    var m = el("span", "mark");
    m.setAttribute("aria-hidden", "true");
    m.setAttribute("data-step", level.step);
    m.innerHTML = "<i></i><i></i><i></i><i></i>";
    return m;
  }

  // The live reading: the word and its mark, the count and the percentage, against usual, the stamp.
  function liveBlock(opts) {
    opts = opts || {};
    var box = el("section", "live");
    box.setAttribute("aria-label", "Right now");
    var h = el(opts.headingTag || "h1", "word");
    h.innerHTML = '<span class="sr-only">' + T.srNow + "</span>" + run('<span class="level">' + level.word + "</span>");
    if (!opts.noMark) h.appendChild(mark()); // later: the pillar under the word is the level's picture
    box.appendChild(h);
    var facts = el("p", "facts");
    facts.innerHTML = '<span class="count-line">' + run(T.about(level.n)) + "</span>" + (pctOn ? '<span class="pct">' + run(T.full(level.pct)) + "</span>" : "");
    box.appendChild(facts);
    if (!opts.noVs) box.appendChild(vsLine());
    if (!opts.noStamp) box.appendChild(stamp());
    // On the computer the column's foot holds the second answer, when to go later; the card's readout then opens on
    // the hour now stands in, so no sentence shows twice. On the phone the card says it (hidden here).
    if (opts.ahead && quietLeft != null) {
      box.appendChild(el("div", "ahead",
        '<p class="ahead-label">' + ICON.ring + "<span>" + run(T.quietestLeftToday) + "</span></p>" +
        '<p class="ahead-time">' + run('<bdi class="num">' + hourText(quietLeft) + "</bdi>") + "</p>" +
        '<p class="ahead-note">' + run(T.usual + " " + band(usualAt(TODAY, quietLeft))) + "</p>"));
    }
    return box;
  }
  var wide = matchMedia("(min-width: 1024px)");
  function vsLine() { return el("p", "vs", vsIcon + "<span>" + run(T.vs[vs]) + "</span>"); }
  function stamp() {
    var s = el("p", "stamp");
    s.innerHTML = '<span class="fresh"><i class="dot" aria-hidden="true"></i><span>' + run("<b>" + T.live + "</b> · " + T.lastReading(READ_AT)) + "</span></span>" +
      '<span class="open">' + run(T.openUntil(CLOSES_AT)) + "</span>";
    return s;
  }

  // A day as hour bars. mode "fit": the picked day's opening hours fill the width, and a change of day reflows the
  // bars (closed hours fold to nothing). mode "clock": every day on one clock, from the week's earliest opening to its
  // latest closing, so opening hours show as where the bars begin and end.
  // Each bar: .u the usual (grain), .lv the live reading (light, the hour now stands in only), .cap the usual's top,
  // .ring the quietest hour left. Nothing after now is measured: those hours are usual, and drawn as usual.
  function dayBars(opts) {
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
      b.style.setProperty("--i", h - SPAN0);
      b.innerHTML = '<span class="bar"><i class="u"></i><i class="lv"></i><i class="cap"></i><i class="ring"></i></span><span class="t"></span>';
      if (opts.labels === false) b.querySelector(".t").remove();
      bars.appendChild(b);
      slots[h] = b;
    }
    wrap.appendChild(bars);
    return { el: wrap, bars: bars, slots: slots, mode: opts.mode || "fit", labels: opts.labels !== false, every: opts.every || 3, labelPicked: !!opts.labelPicked };
  }

  // Set a day on a bar set: heights, which hours are open, past/now/ahead, labels, the live bar, the quietest ring.
  function setDay(B, d, picked) {
    var D = DAYS[d], isToday = d === TODAY;
    B.day = d;
    B.el.setAttribute("data-day", d);
    B.el.toggleAttribute("data-today", isToday);
    // The arrival's order: from the day's first hour (or the week's clock), the live hour after the hours before it.
    var from = B.mode === "fit" ? D.open : SPAN0;
    B.bars.style.setProperty("--now-i", NOW_H - from);
    for (var h = SPAN0; h < SPAN1; h++) {
      var s = B.slots[h], v = usualAt(d, h), open = v !== null;
      s.style.setProperty("--i", Math.max(0, h - from));
      s.toggleAttribute("data-closed", !open);
      s.style.setProperty("--g", open || B.mode === "clock" ? 1 : 0);
      s.style.setProperty("--u", open ? (v / TOP).toFixed(4) : 0);
      s.disabled = !open;
      var when = !isToday ? "usual" : h < NOW_H ? "past" : h === NOW_H ? "now" : "ahead";
      s.setAttribute("data-when", open ? when : "closed");
      s.style.setProperty("--l", open && when === "now" ? (level.n / TOP).toFixed(4) : 0);
      s.toggleAttribute("data-quietest", isToday && h === quietLeft);
      s.setAttribute("aria-pressed", picked === h ? "true" : "false");
      if (open) s.setAttribute("aria-label", when === "now" ? hourText(h) + ", now " + level.word.toLowerCase() + ", " + T.vsShort[vs] : hourText(h) + ", usually " + band(v));
      else s.removeAttribute("aria-label");
      var t = s.querySelector(".t");
      if (t) {
        var isNow = open && when === "now", isPick = open && B.labelPicked && picked === h && !isNow;
        var label = isNow ? T.now : isPick || (open && h % B.every === 0) ? hourText(h) : "";
        t.innerHTML = label ? run(label) : "";
        t.toggleAttribute("data-now", isNow);
        t.toggleAttribute("data-pick", isPick);
        t.removeAttribute("data-yield");
        t.removeAttribute("data-edge");
      }
    }
    // One tab stop for the hours: the picked hour, or now, or the first open hour; arrows move between them.
    var first = picked != null ? picked : isToday ? NOW_H : D.open;
    for (h = SPAN0; h < SPAN1; h++) B.slots[h].tabIndex = h === first ? 0 : -1;
    B.picked = picked;
  }

  // Labels: an hour too close to another (or to "Now") gives way; the first and last stand on the plot's edges.
  // Worked out from the final layout (not mid-reflow): slot width = plot width / open hours.
  function placeLabels(B) {
    if (!B.labels) return;
    var D = DAYS[B.day], W = B.bars.clientWidth;
    var a = B.mode === "fit" ? D.open : SPAN0, z = B.mode === "fit" ? D.close : SPAN1, n = z - a, sw = W / n;
    // The clock's hours every 3, or every 6 where an hour is narrower than 20 px (a 20-hour day on a phone).
    var every = sw < 20 ? 6 : B.every;
    var items = [];
    for (var h = a; h < z; h++) {
      var t = B.slots[h].querySelector(".t");
      if (!t) continue;
      t.removeAttribute("data-yield");
      t.removeAttribute("data-edge");
      if (!t.hasAttribute("data-now") && !t.hasAttribute("data-pick")) t.innerHTML = h % every === 0 ? run(hourText(h)) : "";
      if (!t.textContent) continue;
      var w = t.firstChild ? measure(t) : 0, c = (h - a + 0.5) * sw;
      // Rank: "Now" first, then a picked hour, then the clock's hours.
      items.push({ t: t, h: h, w: w, c: c, rank: t.hasAttribute("data-now") ? 2 : t.hasAttribute("data-pick") ? 1 : 0 });
    }
    // An edge label stands on the edge; its centre moves with it before the yield is decided.
    items.forEach(function (it) {
      if (it.c - it.w / 2 < 0) { it.t.setAttribute("data-edge", "start"); it.c = it.w / 2; }
      else if (it.c + it.w / 2 > W) { it.t.setAttribute("data-edge", "end"); it.c = W - it.w / 2; }
    });
    // A label gives way to a higher-ranked one it would touch; between two of the same rank, the later one gives way.
    items.forEach(function (it, i) {
      items.forEach(function (o, j) {
        if (o === it || o.rank < it.rank || (o.rank === it.rank && j > i)) return;
        if (o.rank === it.rank && o.t.hasAttribute("data-yield")) return;
        if (Math.abs(o.c - it.c) < (o.w + it.w) / 2 + 10) it.t.setAttribute("data-yield", "");
      });
    });
  }
  var measurer = null;
  function measure(t) {
    if (!measurer) { measurer = el("span", "measure"); document.body.appendChild(measurer); }
    measurer.className = "measure " + (t.hasAttribute("data-now") ? "is-now" : "");
    measurer.style.font = getComputedStyle(t).font;
    measurer.textContent = t.textContent;
    return measurer.getBoundingClientRect().width;
  }

  // The day picker: the seven days in the week's order, today named.
  function dayPicker(current, onPick) {
    var g = el("div", "days");
    g.setAttribute("role", "radiogroup");
    g.setAttribute("aria-label", T.days);
    WEEK.forEach(function (d) {
      var b = el("button", "day-btn");
      b.type = "button";
      b.setAttribute("role", "radio");
      b.setAttribute("data-day", d);
      b.setAttribute("aria-label", d === TODAY ? T.today + ", " + DAYS[d].name : DAYS[d].name);
      b.toggleAttribute("data-today", d === TODAY);
      b.innerHTML = run(d === TODAY ? T.today : DAYS[d].short);
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

  function hourInput(B, onPick) {
    B.bars.addEventListener("click", function (e) {
      var s = e.target.closest(".slot");
      if (!s || s.disabled) return;
      var h = +s.getAttribute("data-h");
      onPick(B.picked === h ? null : h);
    });
    B.bars.addEventListener("keydown", function (e) {
      rove(e, B.bars, ".slot", function (s) { onPick(+s.getAttribute("data-h")); });
    });
  }
  function markPicked(B, h) {
    B.picked = h;
    for (var k = SPAN0; k < SPAN1; k++) B.slots[k].setAttribute("aria-pressed", k === h ? "true" : "false");
  }

  // The readout: a picked hour or day answers in a plain sentence.
  function readoutHtml(d, h) {
    if (h != null) return d === TODAY && h === NOW_H ? T.hourNow(h) : T.hourUsual(d, h);
    if (d === TODAY && aheadShown()) return "<span>" + run(T.hourNow(NOW_H)) + "</span>";
    if (d === TODAY) return quietLeft != null ? ICON.ring + "<span>" + run(T.quietestLeft(quietLeft)) + "</span>" : "";
    return "<span>" + run(T.dayRange(d)) + "</span>";
  }
  function aheadShown() { return wide.matches && design !== "later"; }
  function setReadout(r, d, h) {
    var html = readoutHtml(d, h);
    if (h != null) html = "<span>" + run(html) + "</span>";
    r.innerHTML = html;
    r.toggleAttribute("data-picked", h != null);
  }

  var pickedDay = DAYS[q.get("day")] ? q.get("day") : TODAY;
  var hq = q.get("hour"), pickedHour = hq !== null && usualAt(pickedDay, +hq) !== null ? +hq : null;

  // ---------------------------------------------------------------------------------------------------------------
  // day: the usual day is the frame, and the live reading is one lit hour on it.
  // ---------------------------------------------------------------------------------------------------------------
  function buildDay() {
    sign.appendChild(liveBlock({ ahead: true }));
    var card = el("section", "card lit daycard");
    card.setAttribute("aria-labelledby", "day-title");
    card.innerHTML = '<span class="lamp" aria-hidden="true"></span>';
    var head = el("header", "card-head");
    var title = el("h2", "card-title"); title.id = "day-title";
    var hours = el("p", "card-hours");
    head.appendChild(title); head.appendChild(hours);
    card.appendChild(head);
    var readout = el("p", "readout");
    readout.setAttribute("aria-live", "polite");
    card.appendChild(readout);
    var fig = el("figure", "dayfig");
    var B = dayBars({ mode: "fit", every: 3, labelPicked: true });
    fig.appendChild(B.el);
    card.appendChild(fig);
    var picker = dayPicker(pickedDay, function (d) { show(d, null); });
    card.appendChild(picker.el);
    sign.appendChild(card);

    function show(d, h) {
      title.innerHTML = run(T.usualDay(d));
      hours.innerHTML = run(T.openHours(d));
      fig.setAttribute("aria-label", T.chartName(d));
      setDay(B, d, h);
      setReadout(readout, d, h);
      placeLabels(B);
    }
    hourInput(B, function (h) {
      setDay(B, B.day, h); setReadout(readout, B.day, h); placeLabels(B);
      var f = B.slots[h != null ? h : -1]; if (f && document.activeElement && document.activeElement.closest(".bars") === B.bars) f.focus();
    });
    show(pickedDay, pickedHour);
    return function () { placeLabels(B); setReadout(readout, B.day, B.picked); };
  }

  // ---------------------------------------------------------------------------------------------------------------
  // week: the seven usual days on one clock, today open and lit at now; any other day opens to be read.
  // ---------------------------------------------------------------------------------------------------------------
  function buildWeek() {
    sign.appendChild(liveBlock({ ahead: true }));
    var card = el("section", "card lit weekcard");
    card.setAttribute("aria-labelledby", "week-title");
    card.style.setProperty("--row-zoom", (TOP / (busiestUsual * 1.06)).toFixed(4));
    card.innerHTML = '<span class="lamp" aria-hidden="true"></span>';
    var head = el("header", "card-head");
    head.innerHTML = '<h2 class="card-title" id="week-title">' + run(T.week) + "</h2>" +
      '<p class="legend" aria-hidden="true"><span class="key key-u"></span>' + run(T.legendUsual) + '<span class="key key-now"></span>' + run(T.legendNow) + "</p>";
    card.appendChild(head);
    var rows = el("div", "rows");
    rows.setAttribute("role", "radiogroup");
    rows.setAttribute("aria-label", T.days);
    var sets = {};
    WEEK.forEach(function (d) {
      var row = el("div", "row");
      row.setAttribute("data-day", d);
      var name = el("button", "row-name");
      name.type = "button";
      name.setAttribute("role", "radio");
      name.setAttribute("aria-label", (d === TODAY ? T.today + ", " : "") + DAYS[d].name + ", " + T.chartName(d));
      name.innerHTML = run(DAYS[d].short) + (d === TODAY ? '<span class="row-today">' + run(T.today) + "</span>" : "");
      row.appendChild(name);
      var B = dayBars({ mode: "clock", labels: false });
      setDay(B, d, null);
      sets[d] = B;
      row.appendChild(B.el);
      rows.appendChild(row);
      hourInput(B, function (h) {
        if (current !== d) { open(d, null); return; }
        markPicked(B, h); weekReadout(d, h);
      });
    });
    card.appendChild(rows);
    // One clock under the week: 6 AM, 12 PM, 6 PM, 12 AM (and the hours between on the computer).
    var axis = el("div", "clock");
    axis.setAttribute("aria-hidden", "true");
    for (var h = SPAN0; h < SPAN1; h++) {
      if (h % 3) continue;
      var t = el("span", "t" + (h % 6 ? " minor" : ""), run(hourText(h)));
      t.style.setProperty("--x", ((h - SPAN0 + 0.5) / (SPAN1 - SPAN0)).toFixed(4));
      axis.appendChild(t);
    }
    card.appendChild(axis);
    var readout = el("p", "readout");
    readout.setAttribute("aria-live", "polite");
    card.appendChild(readout);
    sign.appendChild(card);

    var current = null;
    // Another day's readout names its opening hours too: in this design they are where its shape begins and ends.
    function weekReadout(d, h) {
      setReadout(readout, d, h);
      if (d !== TODAY && h == null) readout.innerHTML = "<span>" + run(DAYS[d].name + " · " + T.openHours(d)) + "<br>" + run(T.dayRange(d)) + "</span>";
    }
    function open(d, h) {
      current = d;
      rows.querySelectorAll(".row").forEach(function (r) {
        var on = r.getAttribute("data-day") === d;
        r.toggleAttribute("data-open", on);
        var n = r.querySelector(".row-name");
        n.setAttribute("aria-checked", on ? "true" : "false");
        n.tabIndex = on ? 0 : -1;
        sets[r.getAttribute("data-day")].bars.querySelectorAll(".slot").forEach(function (s) {
          if (!on) s.tabIndex = -1;
        });
      });
      setDay(sets[d], d, h);
      weekReadout(d, h);
    }
    rows.addEventListener("click", function (e) {
      var n = e.target.closest(".row-name");
      if (n) open(n.parentNode.getAttribute("data-day"), null);
    });
    rows.addEventListener("keydown", function (e) {
      if (!e.target.closest(".row-name")) return;
      rove(e, rows, ".row-name", function (b) { b.click(); });
    });
    open(pickedDay, pickedHour);
    return function () { weekReadout(current, sets[current].picked); };
  }

  // ---------------------------------------------------------------------------------------------------------------
  // later: now against a later hour. Now stands lit on the start side, the quietest hour left (or any hour or day the
  // visitor picks) on the end side, both on one scale; the usual day under them is where the picking happens.
  // ---------------------------------------------------------------------------------------------------------------
  function buildLater() {
    var duel = el("section", "duel");
    duel.setAttribute("aria-label", T.now + " / " + T.later);
    // Now
    var a = el("article", "side side-now card");
    var aHead = el("p", "side-label", run("<b>" + T.now + "</b>"));
    a.appendChild(aHead);
    var lb = liveBlock({ noVs: true, noStamp: true, noMark: true });
    lb.appendChild(el("p", "stamp stamp-short", '<span class="fresh"><i class="dot" aria-hidden="true"></i><span>' + run("<b>" + T.live + '</b> · <bdi class="num">' + READ_AT + "</bdi>") + "</span></span>"));
    a.appendChild(lb);
    var pa = el("div", "pillar");
    pa.setAttribute("aria-hidden", "true");
    pa.innerHTML = '<i class="u"></i><i class="lv"></i><i class="cap"></i>';
    pa.style.setProperty("--u", (usualNow / TOP).toFixed(4));
    pa.style.setProperty("--l", (level.n / TOP).toFixed(4));
    a.appendChild(pa);
    duel.appendChild(a);
    // Later
    var b = el("article", "side side-later card");
    var bHead = el("p", "side-label");
    var bWord = el("p", "later-word");
    var bNote = el("p", "later-note");
    var pb = el("div", "pillar");
    pb.setAttribute("aria-hidden", "true");
    pb.innerHTML = '<i class="u"></i><i class="cap"></i>';
    b.appendChild(bHead); b.appendChild(bWord); b.appendChild(bNote); b.appendChild(pb);
    duel.appendChild(b);
    sign.appendChild(duel);

    var under = el("div", "under");
    under.appendChild(vsLine());
    under.appendChild(el("p", "stamp", '<span class="open">' + run(T.openUntil(CLOSES_AT)) + "</span>"));
    sign.appendChild(under);

    var card = el("section", "card strip");
    card.setAttribute("aria-labelledby", "strip-title");
    var head = el("header", "card-head");
    var title = el("h2", "card-title"); title.id = "strip-title";
    var hours = el("p", "card-hours");
    head.appendChild(title); head.appendChild(hours);
    card.appendChild(head);
    var fig = el("figure", "dayfig");
    var B = dayBars({ mode: "fit", every: 3, labelPicked: true });
    fig.appendChild(B.el);
    card.appendChild(fig);
    var picker = dayPicker(pickedDay, function (d) { show(d, null); });
    card.appendChild(picker.el);
    sign.appendChild(card);

    function later(d, h) {
      var isQuietLeft = d === TODAY && h === quietLeft;
      var v = usualAt(d, h);
      var when = d === TODAY ? hourText(h) : DAYS[d].short + " " + hourText(h);
      var tag = isQuietLeft ? T.quietestTag : d !== TODAY && h === lowest(d, 0) ? T.quietestDay : "";
      bHead.innerHTML = run('<b class="num">' + when + "</b>" + (tag ? ' <span class="tag">' + tag + "</span>" : ""));
      bWord.innerHTML = run('<span class="usually">' + T.usual + "</span> " + band(v));
      bNote.innerHTML = d === TODAY && h === NOW_H ? run("usual for now") : "";
      pb.style.setProperty("--u", (v / TOP).toFixed(4));
      b.setAttribute("aria-label", T.later + ": " + when + ", usually " + band(v));
    }
    function show(d, h) {
      title.innerHTML = run(T.usualDay(d));
      hours.innerHTML = run(T.openHours(d));
      fig.setAttribute("aria-label", T.chartName(d));
      var target = h != null ? h : d === TODAY ? quietLeft : lowest(d, 0);
      setDay(B, d, target);
      later(d, target);
      placeLabels(B);
    }
    hourInput(B, function (h) {
      var t = h == null ? (B.day === TODAY ? quietLeft : lowest(B.day, 0)) : h;
      setDay(B, B.day, t); later(B.day, t); placeLabels(B);
      var f = B.slots[t]; if (f && document.activeElement && document.activeElement.closest(".bars") === B.bars) f.focus();
    });
    show(pickedDay, pickedHour);
    return function () { placeLabels(B); };
  }

  // Motion: the arrival raises the bars in the day's order, the live hour after the hours before it. Set before the
  // page is built, so no bar is ever drawn at its height and then lowered. Under reduced motion it never runs and every
  // bar stands at its height from the first frame.
  if (!reduce) page.setAttribute("data-intro", "");
  var relayout = { day: buildDay, week: buildWeek, later: buildLater }[design]();

  // The arrival's stagger ends at the visitor's first touch or key, so a pick never waits on it.
  ["pointerdown", "keydown"].forEach(function (t) { addEventListener(t, function () { page.removeAttribute("data-rise"); }, { capture: true, once: true }); });
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
        setTimeout(function () { page.removeAttribute("data-rise"); }, 2400);
      });
    });
  });
})();
