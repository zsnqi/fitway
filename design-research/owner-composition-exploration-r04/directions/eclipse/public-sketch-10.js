// FITWAY public crowd page, sketch 10 (public-redesign-r01). Concept only, synthetic data, a still: English, live.
// ?chart=<name> picks the chart (public-sketch-10.css, "The charts"); ?level=quiet|moderate|busy|packed picks the crowd
// level (Busy without it); ?pct=off is the owner's percentage turned off; ?dir=rtl mirrors the page with the English
// words kept (the check that Arabic needs no redesign).
(function () {
  var q = new URLSearchParams(location.search);
  var page = document.querySelector(".page");
  var charts = ["lit", "rim", "sky"];
  var chart = charts.indexOf(q.get("chart")) >= 0 ? q.get("chart") : "lit";
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

  // The day by the hour, from opening (6:00 AM) to closing (1:00 AM): 19 hours, each placed by its minutes since
  // opening. Today's hours up to the hour now stands in, which shows the latest reading; the usual Friday for every
  // hour of the day, behind today and alone after now. Today follows the level (Busy's day scaled to the reading
  // now); the usual Friday is the same every day, so Busy runs a little above it, Packed well above, Quiet well below.
  var busyDay = [10, 17, 25, 33, 41, 36, 24, 23, 28, 34, 41, 50, 60]; // 6 AM to the 6 PM hour, at Busy
  var usual = [9, 15, 22, 29, 35, 33, 25, 22, 25, 31, 38, 47, 56, 63, 66, 56, 40, 25, 12]; // 6 AM to the 12 AM hour
  var today = busyDay.map(function (v) { return Math.max(1, Math.round(v * level.n / 70)); });
  // The chart's top is the day's own tallest, today or usual, with a little air: never the gym's capacity.
  var top = Math.ceil(Math.max.apply(null, today.concat(usual, [level.n])) * 1.04);
  var day = document.querySelector(".day"), bars = document.querySelector(".bars"), html = "";
  day.style.setProperty("--max", top);
  function bar(k, v, kind) {
    html += '<i class="bar" data-kind="' + kind + '" style="--m: ' + k * 60 + "; --v: " + v + '"></i>';
  }
  today.forEach(function (v, k) { bar(k, v, "day"); });
  bar(today.length, level.n, "now");
  bars.innerHTML = html;

  // The mirror check keeps the English words: each line's words are set as one left-to-right run, so the check shows
  // where things stand, not English reordered by an Arabic line ("AM 12"). Arabic will need none of this.
  var rtl = q.get("dir") === "rtl";
  if (rtl) {
    document.documentElement.dir = "rtl";
    document.querySelectorAll(".word, .count-line, .pct, .usual-label, .axis .t, .best, .fresh > span, .open").forEach(function (el) {
      var run = document.createElement("span");
      run.className = "en-run";
      while (el.firstChild) run.appendChild(el.firstChild);
      el.appendChild(run);
    });
  }

  // The usual Friday as a shape over minutes since opening: a monotone curve (it never overshoots an hour) through each
  // hour's middle, down to half its first and last hours at opening and closing.
  var span = 1140;
  var pts = [[0, usual[0] / 2]].concat(usual.map(function (v, k) { return [k * 60 + 30, v]; }), [[span, usual[usual.length - 1] / 2]]);
  function smoothCurve(X, Y) {
    var n = pts.length, d = [], m = [], i, s = "";
    for (i = 0; i < n - 1; i++) d.push((pts[i + 1][1] - pts[i][1]) / (pts[i + 1][0] - pts[i][0]));
    m[0] = d[0]; m[n - 1] = d[n - 2];
    for (i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
    for (i = 0; i < n - 1; i++) {
      if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
      var a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b;
      if (h > 9) { var t = 3 / Math.sqrt(h); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
    }
    s = "M" + X(pts[0][0]) + " " + Y(pts[0][1]);
    for (i = 0; i < n - 1; i++) {
      var x0 = pts[i][0], x1 = pts[i + 1][0], w = (x1 - x0) / 3;
      s += "C" + X(x0 + w) + " " + Y(pts[i][1] + m[i] * w) + " " + X(x1 - w) + " " + Y(pts[i + 1][1] - m[i + 1] * w) + " " + X(x1) + " " + Y(pts[i + 1][1]);
    }
    return s;
  }
  // The shape closes well under the floor, so its softened lower edge is cut away by the floor, not faded above it.
  function smoothPath(X, Y, under) { return "M" + X(0) + " " + (Y(0) + under) + "L" + smoothCurve(X, Y).slice(1) + "L" + X(span) + " " + (Y(0) + under) + "Z"; }
  // The usual Friday's height at a minute (between the hours' middles, a straight line is close enough to place a label).
  function usualAt(min) {
    for (var i = 0; i < pts.length - 1; i++) if (min <= pts[i + 1][0]) return pts[i][1] + (pts[i + 1][1] - pts[i][1]) * (min - pts[i][0]) / (pts[i + 1][0] - pts[i][0]);
    return pts[pts.length - 1][1];
  }

  var ink = function (el) { var r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect(); };
  function drawUsual() {
    var svg = document.querySelector(".usual"), plot = document.querySelector(".plot");
    var W = plot.clientWidth, H = plot.clientHeight, cs = getComputedStyle(svg);
    var soft = parseFloat(cs.getPropertyValue("--soft")) || 0, rimSoft = parseFloat(cs.getPropertyValue("--rim-soft")) || 0;
    var r2 = function (v) { return Math.round(v * 100) / 100; };
    var X = function (min) { var x = min / span * W; return r2(rtl ? W - x : x); };
    var Y = function (v) { return r2(H - v / top * H); };
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.innerHTML =
      '<defs><filter id="usual-soft" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="' + soft + '"/></filter>' +
      '<filter id="usual-rim" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="' + rimSoft + '"/></filter>' +
      '<clipPath id="usual-floor"><rect x="-40" y="-80" width="' + (W + 80) + '" height="' + (H + 80) + '"/></clipPath></defs>' +
      '<g clip-path="url(#usual-floor)"><path class="shade" filter="url(#usual-soft)" d="' + smoothPath(X, Y, soft * 3 + 2) + '"/>' +
      '<path class="rim" filter="url(#usual-rim)" d="' + smoothCurve(X, Y) + '"/></g>';
    // "Usual Friday" rests on the shadow at its far end, low, where the usual day winds down to closing: over the
    // shadow's height three quarters of the way along the label, so its start stands in the shadow and it never sits
    // beside the top of the bar at now.
    // Where the column is so narrow that the label would come within 12 px of the bar at now, its two words stand one
    // over the other.
    var label = document.querySelector(".usual-label"), nowBar = document.querySelector('.bar[data-kind="now"]');
    label.removeAttribute("data-stack");
    var gap = function () { var l = ink(label), n = nowBar.getBoundingClientRect(); return rtl ? n.left - l.right : l.left - n.right; };
    if (gap() < 12) label.setAttribute("data-stack", "");
    var at = span - (ink(label).width / 4) / W * span;
    label.style.setProperty("--v", usualAt(at));
  }

  function fit() {
    // Where the count and the percentage do not fit on one line (a three-digit count on a phone), the percentage goes
    // under the count, without its hairline, as on the narrow phone.
    var facts = document.querySelector(".facts"), pct = document.querySelector(".pct");
    facts.removeAttribute("data-wrap");
    var line = document.querySelector(".count-line").getBoundingClientRect();
    if (pct && pct.getBoundingClientRect().top >= line.bottom - 2) facts.setAttribute("data-wrap", "");
    // An hour on the axis too close to "Now" gives way to it (on the phone, 6 PM), so no two labels touch.
    var nowBox = ink(document.querySelector(".t-now"));
    document.querySelectorAll(".axis .t:not(.t-now)").forEach(function (t) {
      var b = ink(t), near = b.right + 10 > nowBox.left && b.left - 10 < nowBox.right;
      if (near) t.setAttribute("data-yield", ""); else t.removeAttribute("data-yield");
    });
    drawUsual();
  }
  addEventListener("resize", fit);

  // Ready once the Readex Pro weights the page uses have loaded (Latin and the Arabic of the language button).
  Promise.all(["400", "500", "600", "700"].map(function (w) {
    return document.fonts.load(w + ' 16px "Readex Pro"', "العربية FITWAY Quiet Moderate Busy Packed 0123456789%").catch(function () {});
  })).then(function () { fit(); window.__sketch = { ready: true }; });
})();
