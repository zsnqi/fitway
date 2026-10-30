// FITWAY public crowd page, the draft from direction B (public-redesign-r01). Concept only, synthetic data, a still.
// ?level=quiet|moderate|busy|packed shows that level, with values that agree with it (Busy without it).
// ?mark=2|3|4 swaps in another form of the four-level mark and changes nothing else (the refined bars without it).
(function () {
  var q = new URLSearchParams(location.search);
  var levels = {
    quiet: { n: "1", word: "هادئ", count: "14", pct: "12%" },
    moderate: { n: "2", word: "متوسط", count: "41", pct: "34%" },
    busy: { n: "3", word: "مزدحم", count: "70", pct: "58%" },
    packed: { n: "4", word: "شديد الازدحام", count: "106", pct: "88%" }
  };
  var v = levels[q.get("level")] || levels.busy;
  var mark = q.get("mark");
  var page = document.querySelector(".page");
  // The percentage sits under the count and the open line stands in the stamp: the markup keeps them the other way
  // round, and public.css styles each for the place it is moved to.
  var facts = document.querySelector(".facts"), stamp = document.querySelector(".stamp");
  var pct = stamp.querySelector(".pct"), open = facts.querySelector(".open");
  facts.appendChild(pct);
  stamp.appendChild(open);
  page.setAttribute("data-level", v.n);
  page.setAttribute("data-mark", /^[1-4]$/.test(mark || "") ? mark : "1");
  document.querySelectorAll("[data-k]").forEach(function (el) {
    var k = el.getAttribute("data-k");
    if (k === "mark") el.setAttribute("aria-label", "مستوى الازدحام: " + v.word);
    else if (v[k]) el.textContent = v[k];
  });

  // Ready once the Readex Pro weights the page uses have loaded (one variable file, real weights 160-700).
  Promise.all(["400", "500", "600"].map(function (w) {
    return document.fonts.load(w + ' 16px "Readex Pro"', "العربية FITWAY 0123456789%").catch(function () {});
  })).then(function () { window.__sketch = { ready: true }; });
})();
