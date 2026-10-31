// FITWAY public crowd page, sketch 8 (public-redesign-r01). Concept only, synthetic data, a still: English, live, Busy.
// ?light=<name> picks the page's light (public-sketch-8.css, "The lights"); ?pct=off is the owner's percentage turned
// off; ?dir=rtl mirrors the page with the English words kept (the check that Arabic needs no redesign).
(function () {
  var q = new URLSearchParams(location.search);
  var page = document.querySelector(".page");
  var lights = ["now", "floor", "dusk", "corner"];
  page.setAttribute("data-light", lights.indexOf(q.get("light")) >= 0 ? q.get("light") : "now");
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
  if (q.get("pct") === "off") {
    page.setAttribute("data-pct", "off");
    document.querySelector(".pct").remove(); // not hidden: gone, so nothing reads it
  }

  // The day, by the half hour from opening (6:00 AM) to closing (1:00 AM): 38 half hours, each placed by its minutes
  // since opening. Today's readings to the half hour now stands in; the usual Friday after it. Synthetic.
  var today = [8, 11, 15, 18, 22, 26, 30, 34, 38, 41, 42, 37, 27, 22, 23, 25, 27, 29, 32, 35, 39, 43, 47, 52, 57, 62, 66];
  var now = 70; // the live reading, 7:41 PM, in the half hour from 7:30
  var usual = [69, 67, 64, 59, 50, 41, 32, 24, 16, 10];
  var recent = 4; // the last two hours before now
  var bars = document.querySelector(".bars"), html = "";
  function bar(k, v, kind) {
    html += '<i class="bar" data-kind="' + kind + '" style="--m: ' + k * 30 + "; --v: " + v + '"></i>';
  }
  today.forEach(function (v, k) { bar(k, v, k >= today.length - recent ? "recent" : "day"); });
  bar(today.length, now, "now");
  usual.forEach(function (v, k) { bar(today.length + 1 + k, v, "usual"); });
  bars.innerHTML = html;

  // An hour on the axis too close to "Now" gives way to it (on the phone, 6 PM), so no two labels touch.
  function yieldToNow() {
    var ink = function (el) { var r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect(); };
    var nowBox = ink(document.querySelector(".t-now"));
    document.querySelectorAll(".axis .t:not(.t-now)").forEach(function (t) {
      var b = ink(t), near = b.right + 10 > nowBox.left && b.left - 10 < nowBox.right;
      if (near) t.setAttribute("data-yield", ""); else t.removeAttribute("data-yield");
    });
  }
  addEventListener("resize", yieldToNow);

  // Ready once the Readex Pro weights the page uses have loaded (Latin and the Arabic of the language button).
  Promise.all(["400", "500", "600", "700"].map(function (w) {
    return document.fonts.load(w + ' 16px "Readex Pro"', "العربية FITWAY Busy 0123456789%").catch(function () {});
  })).then(function () { yieldToNow(); window.__sketch = { ready: true }; });
})();
