// FITWAY public crowd page, sketch 11 (public-redesign-r01). Concept only, synthetic data, a still: English, live.
// EXPLORATION BUILD: ?chart=<form> sketches a form of today's day; ?place=beside tries the day beside the word on the
// computer. ?level=quiet|moderate|busy|packed picks the crowd level (Busy without it); ?pct=off is the owner's
// percentage turned off; ?dir=rtl mirrors the page with the English words kept (the check that Arabic needs no redesign).
(function () {
  var q = new URLSearchParams(location.search);
  var page = document.querySelector(".page");
  var charts = ["line", "poly", "steps", "hours", "dots", "stems", "levels", "bars", "area", "nums"];
  var chart = charts.indexOf(q.get("chart")) >= 0 ? q.get("chart") : "line";
  page.setAttribute("data-chart", chart);
  page.setAttribute("data-place", q.get("place") === "below" ? "below" : "beside");
  if (q.get("nowline")) page.setAttribute("data-nowline", "");

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

  // Today by the hour: 6 AM to the 6 PM hour, then the hour now stands in (7 PM), which shows the latest reading.
  // Today follows the level (Busy's day scaled to the reading now).
  var busyDay = [10, 17, 25, 33, 41, 36, 24, 23, 28, 34, 41, 50, 60];
  var hours = busyDay.map(function (v) { return Math.max(1, Math.round(v * level.n / 70)); }).concat([level.n]);
  var usual = [9, 15, 22, 29, 35, 33, 25, 22, 25, 31, 38, 47, 56, 63, 66, 56, 40, 25, 12]; // the usual Friday, 6 AM to the 12 AM hour
  // The chart's top is the same at every level: half again the usual Friday's busiest hour (more if today runs over),
  // never the gym's capacity. So Packed stands near the top, Busy lower, Quiet low, and nothing reveals capacity.
  var top = Math.max(Math.ceil(Math.max.apply(null, usual) * 1.5), Math.ceil(Math.max.apply(null, hours) * 1.04));
  // The levels sketch only: each hour's public band (synthetic room of 120; the server would send the bands).
  function band(v) { var p = v / 120; return p < 0.25 ? 0 : p < 0.5 ? 1 : p < 0.75 ? 2 : 3; }

  var span = 1140;
  var rtl = q.get("dir") === "rtl";
  if (rtl) document.documentElement.dir = "rtl";

  var r2 = function (v) { return Math.round(v * 100) / 100; };
  // A monotone curve through points (data space: minutes, count): it never overshoots an hour's value.
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
  var mid = function (k) { return k * 60 + 30; };
  var last = hours.length - 1;

  // The forms. Each returns SVG for the plot; the hour now stands in is the only red.
  var forms = {
    line: function (X, Y, S) {
      var P = hours.map(function (v, k) { return [mid(k), v]; });
      return '<path class="ln" d="' + curve(P, X, Y) + '"/>' + dot(X(mid(last)), Y(hours[last]), S.nowR, "now");
    },
    poly: function (X, Y, S) {
      var d = hours.map(function (v, k) { return (k ? "L" : "M") + X(mid(k)) + " " + Y(v); }).join("");
      var pts = hours.slice(0, last).map(function (v, k) { return dot(X(mid(k)), Y(v), S.ptR, "pt"); }).join("");
      return '<path class="ln" d="' + d + '"/>' + pts + dot(X(mid(last)), Y(hours[last]), S.nowR, "now");
    },
    steps: function (X, Y, S) {
      var d = "";
      hours.forEach(function (v, k) { if (k < last) d += (k ? "L" : "M") + X(k * 60) + " " + Y(v) + "L" + X(k * 60 + 60) + " " + Y(v); });
      var nowSeg = "M" + X(last * 60) + " " + Y(hours[last]) + "L" + X(last * 60 + 41) + " " + Y(hours[last]);
      d += "L" + X(last * 60) + " " + Y(hours[last]);
      return '<path class="ln" d="' + d + '"/><path class="now-ln" d="' + nowSeg + '"/>';
    },
    hours: function (X, Y, S) {
      return hours.map(function (v, k) {
        var a = k * 60 + 9, b = k * 60 + 51;
        return '<path class="' + (k === last ? "now-ln" : "dash") + '" d="M' + X(a) + " " + Y(v) + "L" + X(b) + " " + Y(v) + '"/>';
      }).join("");
    },
    dots: function (X, Y, S, W, H) {
      var ticks = "";
      for (var k = 0; k < span / 60; k++) ticks += '<path class="tick" d="M' + X(mid(k)) + " " + H + "L" + X(mid(k)) + " " + (H - 5) + '"/>';
      return ticks + hours.map(function (v, k) { return k === last ? dot(X(mid(k)), Y(v), S.nowR, "now") : dot(X(mid(k)), Y(v), S.dotR, "pt"); }).join("");
    },
    nums: function (X, Y, S) {
      return hours.map(function (v, k) { return '<text class="nm' + (k === last ? " nm-now" : "") + '" x="' + X(mid(k)) + '" y="' + Y(v) + '">' + v + "</text>"; }).join("");
    },
    stems: function (X, Y, S) {
      return hours.map(function (v, k) {
        var x = X(mid(k)), c = k === last ? "now" : "pt";
        return '<path class="stem ' + (k === last ? "stem-now" : "") + '" d="M' + x + " " + Y(0) + "L" + x + " " + Y(v) + '"/>' + dot(x, Y(v), k === last ? S.nowR - 1 : S.ptR + 0.5, c);
      }).join("");
    },
    levels: function (X, Y, S, W, H) {
      var y = function (b) { return r2(H - 10 - b * (H - 26) / 3); };
      var g = [0, 1, 2, 3].map(function (b) { return '<path class="grid" d="M' + X(0) + " " + y(b) + "L" + X(span) + " " + y(b) + '"/>'; }).join("");
      var d = hours.map(function (v, k) { return (k ? "L" : "M") + X(mid(k)) + " " + y(band(v)); }).join("");
      var pts = hours.map(function (v, k) { return k === last ? dot(X(mid(k)), y(band(v)), S.nowR, "now") : dot(X(mid(k)), y(band(v)), S.dotR, "pt"); }).join("");
      var marks = document.querySelector(".marks"), names = ["Quiet", "Moderate", "Busy", "Packed"];
      marks.innerHTML = names.map(function (nm, b) { return '<span class="lv" style="--y: ' + (H - y(b)) + 'px">' + nm + "</span>"; }).join("");
      return g + '<path class="ln ln-faint" d="' + d + '"/>' + pts;
    },
    bars: function (X, Y, S, W) {
      var bw = Math.min(W * 60 / span * 0.5, 22);
      return hours.map(function (v, k) {
        var x = X(mid(k)) - bw / 2;
        return '<rect class="' + (k === last ? "now" : "bar") + '" x="' + r2(x) + '" y="' + Y(v) + '" width="' + r2(bw) + '" height="' + r2(Y(0) - Y(v)) + '" rx="2"/>';
      }).join("");
    },
    area: function (X, Y, S) {
      var P = hours.map(function (v, k) { return [mid(k), v]; }), c = curve(P, X, Y);
      var fill = c + "L" + X(mid(last)) + " " + Y(0) + "L" + X(mid(0)) + " " + Y(0) + "Z";
      return '<path class="fill" d="' + fill + '"/><path class="ln" d="' + c + '"/>' + dot(X(mid(last)), Y(hours[last]), S.nowR, "now");
    }
  };
  function dot(x, y, r, c) { return '<circle class="' + c + '" cx="' + r2(x) + '" cy="' + r2(y) + '" r="' + r + '"/>'; }

  function draw() {
    var plot = document.querySelector(".plot"), svg = document.querySelector(".today");
    var W = plot.clientWidth, H = plot.clientHeight, cs = getComputedStyle(plot);
    var num = function (n, d) { var v = parseFloat(cs.getPropertyValue(n)); return isNaN(v) ? d : v; };
    var S = { nowR: num("--now-r", 6), ptR: num("--pt-r", 2.5), dotR: num("--dot-r", 3.5) };
    var inset = num("--inset", 10);
    var X = function (min) { var x = min / span * W; return r2(rtl ? W - x : x); };
    var Y = function (v) { return r2(inset + (H - inset) * (1 - v / top)); };
    document.querySelector(".marks").innerHTML = "";
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    var nowLine = page.hasAttribute("data-nowline") ? '<path class="nowline" d="M' + X(mid(last)) + " " + H + "L" + X(mid(last)) + " " + Y(hours[last]) + '"/>' : "";
    svg.innerHTML = nowLine + forms[chart](X, Y, S, W, H);
    if (rtl) document.querySelectorAll(".marks .lv").forEach(enRun);
  }

  // The mirror check keeps the English words: each line's words are set as one left-to-right run, so the check shows
  // where things stand, not English reordered by an Arabic line ("AM 12"). Arabic will need none of this.
  function enRun(el) {
    var run = document.createElement("span");
    run.className = "en-run";
    while (el.firstChild) run.appendChild(el.firstChild);
    el.appendChild(run);
  }
  if (rtl) document.querySelectorAll(".word, .count-line, .pct, .axis .t, .best, .fresh > span, .open").forEach(enRun);

  var ink = function (el) { var r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect(); };
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
    draw();
  }
  addEventListener("resize", fit);

  // Ready once the Readex Pro weights the page uses have loaded (Latin and the Arabic of the language button).
  Promise.all(["400", "500", "600", "700"].map(function (w) {
    return document.fonts.load(w + ' 16px "Readex Pro"', "العربية FITWAY Quiet Moderate Busy Packed 0123456789%").catch(function () {});
  })).then(function () { fit(); window.__sketch = { ready: true }; });
})();
