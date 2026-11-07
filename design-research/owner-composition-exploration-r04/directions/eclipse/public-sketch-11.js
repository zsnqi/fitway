// FITWAY public crowd page, sketch 11 (public-redesign-r01). Concept only, synthetic data, a still: English, live.
// ?chart=line|dots picks the form of today's day (public-sketch-11.css, "The forms"; line without it);
// ?level=quiet|moderate|busy|packed picks the crowd level (Busy without it); ?pct=off is the owner's percentage turned
// off; ?dir=rtl mirrors the page with the English words kept (the check that Arabic needs no redesign).
(function () {
  var q = new URLSearchParams(location.search);
  var page = document.querySelector(".page");
  var charts = ["line", "dots"];
  var chart = charts.indexOf(q.get("chart")) >= 0 ? q.get("chart") : "line";
  page.setAttribute("data-chart", chart);

  // The four levels, synthetic and coherent: the same room (about 120 at full), the same Friday, 7:41 PM.
  var levels = {
    quiet: { word: "Quiet", n: 18, pct: 15 },
    moderate: { word: "Moderate", n: 41, pct: 34 },
    busy: { word: "Busy", n: 70, pct: 58 },
    packed: { word: "Packed", n: 96, pct: 80 }
  };
  var key = levels[q.get("level")] ? q.get("level") : "busy", level = levels[key];
  page.setAttribute("data-level", key);
  document.querySelector(".word .level").textContent = level.word;
  document.querySelector(".count").textContent = String(level.n);
  document.querySelector(".pct .num").textContent = level.pct + "%";

  if (q.get("pct") === "off") {
    page.setAttribute("data-pct", "off");
    document.querySelector(".pct").remove(); // not hidden: gone, so nothing reads it
  }

  // Today by the hour, each hour placed at its middle by minutes since opening (6:00 AM): the hours from 6 AM to the
  // 6 PM hour, then the hour now stands in (7 PM), which shows the latest reading. Never finer than an hour. Today
  // follows the level (Busy's day scaled to the reading now).
  var busyDay = [10, 17, 25, 33, 41, 36, 24, 23, 28, 34, 41, 50, 60];
  var hours = busyDay.map(function (v) { return Math.max(1, Math.round(v * level.n / 70)); }).concat([level.n]);
  var last = hours.length - 1, span = 1140; // the open day: 6:00 AM to 1:00 AM, 19 hours
  // The day's top is the same at every level: half again the usual Friday's busiest hour (66), or today's own
  // busiest with a little air where today runs over it. Never the gym's capacity: so Packed stands near the top, Busy
  // lower, Moderate and Quiet low, and no height can be read back into a capacity. The usual Friday itself is not
  // drawn; "Usually quieter after 10 PM" says what comes next.
  var usualBusiest = 66;
  var top = Math.max(Math.ceil(usualBusiest * 1.5), Math.ceil(Math.max.apply(null, hours) * 1.04));

  var rtl = q.get("dir") === "rtl";
  if (rtl) document.documentElement.dir = "rtl";

  var r2 = function (v) { return Math.round(v * 100) / 100; };
  var mid = function (k) { return k * 60 + 30; };
  // A monotone curve through each hour's middle (data space: minutes, count): it passes through every hour's value and,
  // between two hours, never goes beyond them, so it draws no peak or dip that was not read.
  function curve(P, X, Y) {
    var n = P.length, d = [], m = [], i, s = "M" + X(P[0][0]) + " " + Y(P[0][1]);
    for (i = 0; i < n - 1; i++) d.push((P[i + 1][1] - P[i][1]) / (P[i + 1][0] - P[i][0]));
    m[0] = d[0]; m[n - 1] = d[n - 2];
    for (i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
    for (i = 0; i < n - 1; i++) {
      if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
      var a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b;
      if (h > 9) { var t = 3 / Math.sqrt(h); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
    }
    for (i = 0; i < n - 1; i++) {
      var x0 = P[i][0], x1 = P[i + 1][0], w = (x1 - x0) / 3;
      s += "C" + X(x0 + w) + " " + Y(P[i][1] + m[i] * w) + " " + X(x1 - w) + " " + Y(P[i + 1][1] - m[i + 1] * w) + " " + X(x1) + " " + Y(P[i + 1][1]);
    }
    return s;
  }
  function dot(x, y, r, c) { return '<circle class="' + c + '" cx="' + r2(x) + '" cy="' + r2(y) + '" r="' + r + '"/>'; }
  function seg(c, x0, y0, x1, y1) { return '<path class="' + c + '" d="M' + x0 + " " + y0 + "L" + x1 + " " + y1 + '"/>'; }

  // The forms (public-sketch-11.css, "The forms"). In both, the hour now stands in is the only red, and nothing is
  // drawn after it: the rest of the day is open.
  var forms = {
    // line: today as one line through the hours, ending at now: a red point on a hairline that rises from "Now".
    line: function (X, Y, S, H) {
      var P = hours.map(function (v, k) { return [mid(k), v]; }), x = X(mid(last)), y = Y(hours[last]);
      var rule = y + S.nowR < H ? seg("now-rule", x, H, x, r2(y + S.nowR)) : ""; // none when now is on the floor
      return rule + '<path class="trace" d="' + curve(P, X, Y) + '"/>' + dot(x, y, S.nowR, "now");
    },
    // dots: one reading per hour, each over its hour's tick; the ticks run on to closing, the hours still to come.
    dots: function (X, Y, S, H) {
      var ticks = "";
      for (var k = 0; k < span / 60; k++) ticks += seg("tick", X(mid(k)), H, X(mid(k)), H - S.tick);
      return ticks + hours.map(function (v, k) { return k === last ? dot(X(mid(k)), Y(v), S.nowR, "now") : dot(X(mid(k)), Y(v), S.dotR, "reading"); }).join("");
    }
  };

  function draw() {
    var plot = document.querySelector(".plot"), svg = document.querySelector(".today");
    var W = plot.clientWidth, H = plot.clientHeight, cs = getComputedStyle(plot);
    var num = function (n) { return parseFloat(cs.getPropertyValue(n)); };
    var S = { nowR: num("--now-r"), dotR: num("--dot-r"), tick: num("--tick") };
    var air = num("--air"); // room above the top for the mark at now
    var X = function (min) { var x = min / span * W; return r2(rtl ? W - x : x); };
    var Y = function (v) { return r2(air + (H - air) * (1 - v / top)); };
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.innerHTML = forms[chart](X, Y, S, H);
  }

  // The mirror check keeps the English words: each line's words are set as one left-to-right run, so the check shows
  // where things stand, not English reordered by an Arabic line ("AM 12"). Arabic will need none of this.
  if (rtl) {
    document.querySelectorAll(".word, .count-line, .pct, .axis .t, .best, .fresh > span, .open").forEach(function (el) {
      var run = document.createElement("span");
      run.className = "en-run";
      while (el.firstChild) run.appendChild(el.firstChild);
      el.appendChild(run);
    });
  }

  var ink = function (el) { var r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect(); };
  function fit() {
    // Where the count and the percentage do not fit on one line (a three-digit count on a phone), the percentage goes
    // under the count, without its hairline, as on the narrow phone.
    var facts = document.querySelector(".facts"), pct = document.querySelector(".pct");
    facts.removeAttribute("data-wrap");
    var line = document.querySelector(".count-line").getBoundingClientRect();
    if (pct && pct.getBoundingClientRect().top >= line.bottom - 2) facts.setAttribute("data-wrap", "");
    // An hour on the axis within 20 px of "Now" gives way to it (6 PM), so no two labels read as one.
    var nowBox = ink(document.querySelector(".t-now"));
    document.querySelectorAll(".axis .t:not(.t-now)").forEach(function (t) {
      var b = ink(t), near = b.right + 20 > nowBox.left && b.left - 20 < nowBox.right;
      if (near) t.setAttribute("data-yield", ""); else t.removeAttribute("data-yield");
    });
    draw();
  }
  addEventListener("resize", fit);

  // Ready once the Readex Pro weights the page uses have loaded (Latin and the Arabic of the language button).
  Promise.all(["400", "500", "600", "700"].map(function (w) {
    return document.fonts.load(w + ' 16px "Readex Pro"', "العربية FITWAY Quiet Moderate Busy Packed 0123456789%").catch(function () {});
  })).then(function () { fit(); window.__sketch = { ready: true }; });
})();
