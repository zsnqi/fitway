// FITWAY public crowd page, the draft from direction B (public-redesign-r01). Concept only, synthetic data, a still.
// ?level=quiet|moderate|busy|packed shows that level, with values that agree with it (Busy without it).
// ?p1 (one-line «شديد الازدحام» on the computer), ?p2 (the percentage and the open line swap places) and ?p3 (lower
// floors on short screens) each switch on one proposal; any combination may be on, none changes the page without it.
// ?p1m (one-line «شديد الازدحام» on the phone, below 1024 px).
// ?size=75|67 scales the level's word (and its gap to the mark) to 75 % or 67 %; nothing else changes.
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
  // ?p1, ?p2, ?p3 switch on a proposal each (any combination): the class p1/p2/p3 on .page.
  if (q.has("p1")) page.classList.add("p1");
  if (q.has("p3")) page.classList.add("p3");
  if (q.has("p1m")) page.classList.add("p1m"); // below 1024 px, «شديد الازدحام» on one line
  if (q.get("size") === "75" || q.get("size") === "67") page.classList.add("size" + q.get("size")); // the level's word at 75 % or 67 %
  if (q.has("p2")) {
    page.classList.add("p2"); // the percentage and the open line swap places; public.css gives each the styles of its new place
    var facts = document.querySelector(".facts"), stamp = document.querySelector(".stamp");
    var pct = stamp.querySelector(".pct"), open = facts.querySelector(".open");
    facts.appendChild(pct);
    stamp.appendChild(open);
  }
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
