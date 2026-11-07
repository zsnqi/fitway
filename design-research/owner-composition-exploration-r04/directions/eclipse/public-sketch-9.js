// FITWAY public crowd page, sketch 9 (public-redesign-r01). Concept only, synthetic data, a still: English, live.
// ?lift=<name> picks how the page gains presence (public-sketch-9.css, "The lifts"); ?level=quiet|moderate|busy|packed
// picks the crowd level (Busy without it); ?pct=off is the owner's percentage turned off; ?dir=rtl mirrors the page
// with the English words kept (the check that Arabic needs no redesign).
(function () {
  var q = new URLSearchParams(location.search);
  var page = document.querySelector(".page");
  var lifts = ["reach", "card", "full", "none"];
  page.setAttribute("data-lift", lifts.indexOf(q.get("lift")) >= 0 ? q.get("lift") : "reach");

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
  // opening. Today's hours to the hour now stands in, which shows the latest reading; the usual Friday after it.
  // Today follows the level (Busy's day scaled to the reading now); the usual Friday is the same every day.
  var busyDay = [10, 17, 25, 33, 41, 36, 24, 23, 28, 34, 41, 50, 60]; // 6 AM to the 6 PM hour, at Busy
  var usual = [66, 56, 40, 25, 12]; // the 8 PM hour to the 12 AM hour
  var recent = 2; // the last two hours before now
  var today = busyDay.map(function (v) { return Math.max(1, Math.round(v * level.n / 70)); });
  // The chart's top is the day's own tallest bar with a little air, never the gym's capacity.
  var top = Math.ceil(Math.max.apply(null, today.concat(usual, [level.n])) * 1.04);
  var day = document.querySelector(".day"), bars = document.querySelector(".bars"), html = "";
  day.style.setProperty("--max", top);
  function bar(k, v, kind) {
    html += '<i class="bar" data-kind="' + kind + '" style="--m: ' + k * 60 + "; --v: " + v + '"></i>';
  }
  today.forEach(function (v, k) { bar(k, v, k >= today.length - recent ? "recent" : "day"); });
  bar(today.length, level.n, "now");
  usual.forEach(function (v, k) { bar(today.length + 1 + k, v, "usual"); });
  bars.innerHTML = html;
  document.querySelector(".usual-label").style.setProperty("--v", Math.max.apply(null, usual));

  // The mirror check keeps the English words: each line's words are set as one left-to-right run, so the check shows
  // where things stand, not English reordered by an Arabic line ("AM 12"). Arabic will need none of this.
  if (q.get("dir") === "rtl") {
    document.documentElement.dir = "rtl";
    document.querySelectorAll(".word, .count-line, .pct, .usual-label, .axis .t, .best, .fresh > span, .open").forEach(function (el) {
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
    // An hour on the axis too close to "Now" gives way to it (on the phone, 6 PM), so no two labels touch.
    var nowBox = ink(document.querySelector(".t-now"));
    document.querySelectorAll(".axis .t:not(.t-now)").forEach(function (t) {
      var b = ink(t), near = b.right + 10 > nowBox.left && b.left - 10 < nowBox.right;
      if (near) t.setAttribute("data-yield", ""); else t.removeAttribute("data-yield");
    });
    // "Usual Friday" starts where the usual day starts; where the column is too narrow for it there, it ends at the
    // column's end instead, still over the usual day.
    var label = document.querySelector(".usual-label"), plot = document.querySelector(".plot").getBoundingClientRect();
    label.removeAttribute("data-end");
    var l = ink(label), rtl = document.documentElement.dir === "rtl";
    if (rtl ? l.left < plot.left : l.right > plot.right) label.setAttribute("data-end", "");
  }
  addEventListener("resize", fit);

  // Ready once the Readex Pro weights the page uses have loaded (Latin and the Arabic of the language button).
  Promise.all(["400", "500", "600", "700"].map(function (w) {
    return document.fonts.load(w + ' 16px "Readex Pro"', "العربية FITWAY Quiet Moderate Busy Packed 0123456789%").catch(function () {});
  })).then(function () { fit(); window.__sketch = { ready: true }; });
})();
