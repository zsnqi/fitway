// FITWAY public crowd page, sketch 13 (public-redesign-r01). Concept only, synthetic data, English this round.
// Sketch 12's `day`, reviewed and polished: the live reading in the page's corner light, and under it the usual day in
// the lit card, with now as the one lit hour on it, the quietest time left, and the other days.
// Switches: ?level=quiet|moderate|busy|packed (busy), ?day=mon..sun (today, Friday), ?pct=off (the owner turned the
// percentage off), ?dir=rtl (the mirror check: Arabic's direction with the English words kept; time runs right to
// left and the week starts on Saturday), ?hour=<0-25> (a picked hour, for frames).
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
  var TODAY = "fri", NOW_H = 19, READ_AT = "7:41 PM", CLOSES_AT = "1 AM";
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
  function highest(d) {
    var D = DAYS[d], best = D.open;
    for (var h = D.open; h < D.close; h++) if (usualAt(d, h) > usualAt(d, best)) best = h;
    return best;
  }

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
    quietestSame: function (h) { return 'Quietest time left: <b class="num">' + hourText(h) + "</b>, usually about as quiet as now"; },
    nowQuietest: "Now is the quiet time: every hour left today is usually busier.",
    dayRange: function (d) { return 'Usually quietest at <b class="num">' + hourText(lowest(d, 0)) + '</b>, busiest at <b class="num">' + hourText(highest(d)) + "</b>"; },
    hourUsual: function (d, h) { return '<b class="num">' + hourText(h) + "</b>: usually " + band(usualAt(d, h)); },
    // Only when the visitor picks the hour now stands in: the same comparison as the line under the word.
    hourNow: function (h) { return '<b class="num">' + hourText(h) + "</b>: " + level.word.toLowerCase() + " now, " + T.vsShort[vs]; },
    vsShort: { "much-quieter": "much quieter than usual", quieter: "quieter than usual", usual: "as busy as usual", busier: "busier than usual", "much-busier": "much busier than usual" },
    hint: "Pick an hour or a day to see its usual crowd.",
    hintPicked: "Pick it again to clear.",
    quietestName: ", the quietest time left today",
    now: "Now",
    today: "Today",
    days: "Day",
    hours: "Hours",
    chartName: function (d) {
      var D = DAYS[d], s = "A usual " + D.name + " by the hour, " + hourText(D.open) + " to " + hourText(D.close);
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
  // The live reading: the word, the count and the percentage, today against usual, the stamp. No level mark: the
  // word says the level, and the lit hour in the card under it is its picture.
  // ---------------------------------------------------------------------------------------------------------------
  function liveBlock() {
    var box = el("section", "live");
    box.setAttribute("aria-label", "Right now");
    var h = el("h1", "word");
    h.innerHTML = '<span class="sr-only">' + T.srNow + "</span>" + run('<span class="level">' + level.word + "</span>");
    box.appendChild(h);
    box.appendChild(el("p", "facts", '<span class="count-line">' + run(T.about(level.n)) + "</span>" + (pctOn ? '<span class="pct">' + run(T.full(level.pct)) + "</span>" : "")));
    box.appendChild(el("p", "vs", vsIcon + "<span>" + run(T.vs[vs]) + "</span>"));
    box.appendChild(el("p", "stamp",
      '<span class="fresh"><i class="dot" aria-hidden="true"></i><span>' + run("<b>" + T.live + "</b> · " + T.lastReading(READ_AT)) + "</span></span>" +
      '<span class="open">' + run(T.openUntil(CLOSES_AT)) + "</span>"));
    return box;
  }

  // ---------------------------------------------------------------------------------------------------------------
  // A day as hour bars: the picked day's opening hours fill the width, and a change of day reflows the bars (closed
  // hours fold to nothing). Each bar: .u the usual (grain), .lv the live reading (light, the hour now stands in only),
  // .cap the usual's chalk top with .ring, the quietest hour left, over it. Nothing after now is measured: those
  // hours are usual, and drawn as usual. Every height is a transform: each layer is the plot's full height, slid down
  // until its top stands at its value, and the plot's floor clips what is under it.
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
      b.innerHTML = '<span class="bar"><i class="u"></i><i class="lv"></i><i class="cap"><i class="ring"></i></i></span><span class="t"></span>';
      bars.appendChild(b);
      slots[h] = b;
    }
    wrap.appendChild(bars);
    return { el: wrap, bars: bars, slots: slots };
  }

  // Set a day on the bars: heights, which hours are open, past/now/ahead, labels, the live bar, the quietest ring.
  function setDay(B, d, picked) {
    var D = DAYS[d], isToday = d === TODAY;
    B.day = d;
    B.el.toggleAttribute("data-today", isToday);
    // The arrival's order: from the day's first hour, the live hour after the hours before it.
    B.bars.style.setProperty("--now-i", NOW_H - D.open);
    for (var h = SPAN0; h < SPAN1; h++) {
      var s = B.slots[h], v = usualAt(d, h), open = v !== null;
      s.style.setProperty("--i", Math.max(0, h - D.open));
      s.toggleAttribute("data-closed", !open);
      s.style.setProperty("--g", open ? 1 : 0);
      s.style.setProperty("--u", open ? (v / TOP).toFixed(4) : 0);
      s.disabled = !open;
      var when = !isToday ? "usual" : h < NOW_H ? "past" : h === NOW_H ? "now" : "ahead";
      s.setAttribute("data-when", open ? when : "closed");
      s.style.setProperty("--l", open && when === "now" ? (level.n / TOP).toFixed(4) : 0);
      var ring = isToday && h === ringHour;
      s.toggleAttribute("data-quietest", ring);
      s.setAttribute("aria-pressed", picked === h ? "true" : "false");
      if (open) s.setAttribute("aria-label", when === "now" ? hourText(h) + ", now " + level.word.toLowerCase() + ", " + T.vsShort[vs] : hourText(h) + ", usually " + band(v) + (ring ? T.quietestName : ""));
      else s.removeAttribute("aria-label");
      var t = s.querySelector(".t");
      var isNow = open && when === "now", isPick = open && picked === h && !isNow, isRing = open && ring && picked == null;
      t.innerHTML = isNow ? run(T.now) : isPick || isRing ? run(hourText(h)) : "";
      t.toggleAttribute("data-now", isNow);
      t.toggleAttribute("data-pick", isPick);
      t.toggleAttribute("data-ring", isRing && !isNow);
    }
    // One tab stop for the hours: the picked hour, or now, or the first open hour; arrows move between them.
    var first = picked != null ? picked : isToday ? NOW_H : D.open;
    for (h = SPAN0; h < SPAN1; h++) B.slots[h].tabIndex = h === first ? 0 : -1;
    B.picked = picked;
  }

  // Labels. How often the clock is labelled follows an hour's width: every hour where there is room for it, else every
  // second, third or sixth. An hour too close to a stronger label gives way; the first and last stand on the plot's
  // edges. Worked out from the final layout: slot width = plot width / open hours.
  function placeLabels(B) {
    var D = DAYS[B.day], W = B.bars.clientWidth, n = D.close - D.open, sw = W / n;
    var every = sw >= 64 ? 1 : sw >= 34 ? 2 : sw >= 21 ? 3 : 6;
    var focused = document.activeElement && document.activeElement.closest && document.activeElement.closest(".slot");
    var items = [];
    for (var h = D.open; h < D.close; h++) {
      var t = B.slots[h].querySelector(".t");
      t.removeAttribute("data-yield");
      t.removeAttribute("data-edge");
      var strong = t.hasAttribute("data-now") || t.hasAttribute("data-pick") || t.hasAttribute("data-ring");
      if (!strong) t.innerHTML = h % every === 0 || B.slots[h] === focused ? run(hourText(h)) : "";
      if (!t.textContent) continue;
      var w = measure(t), c = (h - D.open + 0.5) * sw;
      // Rank: "Now" (never hidden), then the focused hour, then a picked hour or the quietest left, then the clock's
      // hours. A focused hour whose label gives way to "Now" (next to it, on a phone) still shows its focus: its bar
      // lifts and its column lights.
      var rank = t.hasAttribute("data-now") ? 4 : B.slots[h] === focused ? 3 : strong ? 2 : 0;
      items.push({ t: t, w: w, c: c, rank: rank });
    }
    items.forEach(function (it) {
      if (it.c - it.w / 2 < 0) { it.t.setAttribute("data-edge", "start"); it.c = it.w / 2; }
      else if (it.c + it.w / 2 > W) { it.t.setAttribute("data-edge", "end"); it.c = W - it.w / 2; }
    });
    // Strongest first: a label stands unless it would come within 16 px of one already standing (10 px on the phone,
    // where the clock's type is smaller); between two of the same rank, the earlier hour stands.
    var air = wide.matches ? 16 : 10, kept = [];
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
      if (tap) toggle(s);
    }
    B.bars.addEventListener("pointerup", end);
    B.bars.addEventListener("pointercancel", end);
    B.bars.addEventListener("keydown", function (e) {
      rove(e, B.bars, ".slot", function (s) { onPick(+s.getAttribute("data-h"), true); });
    });
    // The focused hour's label always shows (it is the focus mark), so labels are placed again as focus moves.
    B.bars.addEventListener("focusin", function () { placeLabels(B); });
    B.bars.addEventListener("focusout", function () { requestAnimationFrame(function () { placeLabels(B); }); });
  }

  // A picked day reflows the bars: heights glide (their transforms), and each hour still open slides from where it
  // stood (FLIP, a transform). Under reduced motion the new day stands at once.
  function barCentres(B) {
    var m = {};
    for (var h = SPAN0; h < SPAN1; h++) {
      if (B.slots[h].hasAttribute("data-closed")) continue;
      var r = B.slots[h].getBoundingClientRect();
      m[h] = r.left + r.width / 2;
    }
    return m;
  }
  function slide(B, before) {
    for (var h in before) {
      var s = B.slots[h];
      if (s.hasAttribute("data-closed")) continue;
      var r = s.getBoundingClientRect(), dx = before[h] - (r.left + r.width / 2);
      if (Math.abs(dx) < 0.5) continue;
      s.querySelector(".bar").animate([{ transform: "translateX(" + dx + "px)" }, { transform: "none" }], { duration: 560, easing: "cubic-bezier(0.16, 1, 0.3, 1)" });
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
    var hint = el("p", "hint");
    var fig = el("figure", "dayfig");
    var B = dayBars();
    fig.appendChild(B.el);
    var picker = dayPicker(pickedDay, function (d) { show(d, null, true); });
    [title, hours, readout, hint, fig, picker.el].forEach(function (n) { card.appendChild(n); });
    sign.appendChild(card);

    function words(d, h) {
      var html;
      if (h != null) html = "<span>" + run(d === TODAY && h === NOW_H ? T.hourNow(h) : T.hourUsual(d, h)) + "</span>";
      else if (d !== TODAY) html = "<span>" + run(T.dayRange(d)) + "</span>";
      else if (nowVsLeft === "now") html = "<span>" + run(T.nowQuietest) + "</span>";
      else if (nowVsLeft === "same") html = ICON.ring + "<span>" + run(T.quietestSame(quietLeft)) + "</span>";
      else if (nowVsLeft === "later") html = ICON.ring + "<span>" + run(T.quietestLeft(quietLeft)) + "</span>";
      else html = "";
      readout.innerHTML = html;
      readout.toggleAttribute("data-picked", h != null);
      hint.innerHTML = run(h != null ? T.hintPicked : T.hint);
    }
    function show(d, h, animate) {
      var before = animate && !reduce && d !== B.day ? barCentres(B) : null;
      title.innerHTML = run(T.usualDay(d));
      hours.innerHTML = run(T.openHours(d));
      fig.setAttribute("aria-label", T.chartName(d));
      setDay(B, d, h);
      words(d, h);
      placeLabels(B);
      if (before) slide(B, before);
    }
    hourInput(B, function (h, keepFocus) {
      setDay(B, B.day, h); words(B.day, h); placeLabels(B);
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
    return function () { fit(); placeLabels(B); };
  }

  // Motion: the arrival raises the bars from the floor in the day's order, the live hour after the hours before it.
  // Set before the page is built, so no bar is ever drawn at its height and then lowered. Under reduced motion it never
  // runs and every bar stands at its height from the first frame.
  if (!reduce) page.setAttribute("data-intro", "");
  var relayout = build();

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
        setTimeout(function () { page.removeAttribute("data-rise"); }, 2600);
      });
    });
  });
})();
