// FITWAY public crowd page, the draft from direction B (public-redesign-r01). Concept only, synthetic data, a still.
// ?level=quiet|moderate|busy|packed shows that level, with values that agree with it (Busy without it).
// ?mark=2|3|4 swaps in another form of the four-level mark and changes nothing else (the refined bars without it).
// ?state=loading|delayed|unavailable|closed|error draws that state on the same page, at rest (live without it; see "The
// other states" in public.css). Delayed keeps ?level=; the others show no level. ?state=loading&arrive=<ms> lets the
// first payload arrive into live after that many milliseconds by DESIGN_GUIDE §6's loading rules, so its shift can be
// measured; a load that reaches 10 s becomes Error.
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

  // The other states. Each keeps the header, the light and the page's places. The status always stands where the live
  // stamp stands, at the foot's start, its cue the live dot emptied into a ring (Error: the alert mark); nothing but
  // Live has the green dot or «مباشر». Where there is no reading, the state's answer takes the level word's place.
  var state = q.get("state");
  var draw = { loading: loading, delayed: delayed, closed: closed, unavailable: unavailable, error: error };
  if (draw[state]) {
    var sign = document.querySelector(".sign"), word = sign.querySelector(".word"), markEl = sign.querySelector(".mark");
    var snap = { word: word.innerHTML, facts: facts.innerHTML, stamp: stamp.innerHTML };
    var n = {}, slow; // the nodes a state writes into, found again after a rebuild; the slow-load announcement
    var bind = function () {
      n.text = word.querySelector("[data-k=word]"); n.sr = word.querySelector(".sr-only");
      n.line = facts.querySelector(".count-line"); n.count = facts.querySelector(".count");
      n.pct = facts.querySelector(".pct"); n.pctNum = n.pct.querySelector("bdi");
      n.fresh = stamp.querySelector(".fresh"); n.open = stamp.querySelector(".open");
    };
    bind();
    var said = document.createElement("p"); // the page's one announcement, outside the busy region
    said.className = "sr-only"; said.setAttribute("role", "status");
    page.appendChild(said);
    draw[state]();
  }

  function ring(text) { return '<i class="cue" aria-hidden="true"></i><span>' + text + "</span>"; }
  // A placeholder stands where a value is awaited, in the room of the value's median form (public.css).
  function ph(kind) { return '<i class="ph" data-ph="' + kind + '" aria-hidden="true"></i>'; }
  function markOff() { markEl.removeAttribute("role"); markEl.removeAttribute("aria-label"); markEl.setAttribute("aria-hidden", "true"); }

  // Loading: the first payload is resolving. The labels are real text, each awaited value a placeholder of its geometry,
  // and the mark's place a flat baseline. No level, count, time or dot.
  function loading() {
    page.setAttribute("data-state", "loading");
    page.removeAttribute("data-level");
    sign.setAttribute("aria-busy", "true");
    n.sr.textContent = "الازدحام الآن";
    n.text.innerHTML = '<i class="ph ph-word" aria-hidden="true"></i>';
    markOff();
    n.count.innerHTML = ph("count");
    n.pctNum.innerHTML = ph("pct");
    n.fresh.innerHTML = ring("جارٍ التحميل…");
    n.open.innerHTML = ph("open");
    var t0 = performance.now(), arrive = q.get("arrive");
    slow = setTimeout(function () { said.textContent = "جارٍ التحميل…"; }, 1000);
    if (arrive === null) return; // the still: the skeleton at rest
    // Before 300 ms the value areas keep their space, empty; the skeleton then stays at least 400 ms; 10 s is the ceiling.
    page.setAttribute("data-wait", "");
    var shown = null, at = Math.max(0, +arrive || 0);
    var show = setTimeout(function () { page.removeAttribute("data-wait"); shown = performance.now(); }, 300);
    var ceiling = setTimeout(function () { clearTimeout(slow); clearTimeout(land); page.removeAttribute("data-wait"); error(); }, 10000);
    var land = setTimeout(function go() {
      if (shown !== null && performance.now() - shown < 400) { land = setTimeout(go, 400 - (performance.now() - shown)); return; }
      clearTimeout(show); clearTimeout(ceiling);
      page.removeAttribute("data-wait");
      live();
      window.__arrived = { at: performance.now() - t0, skeleton: shown === null ? null : shown - t0 };
    }, at);
  }

  // The arrival: the values fill the same nodes, and the page is the live page.
  function live() {
    clearTimeout(slow);
    page.removeAttribute("data-state");
    page.setAttribute("data-level", v.n);
    sign.removeAttribute("aria-busy");
    n.sr.textContent = "الازدحام الآن: ";
    n.text.textContent = v.word;
    markEl.removeAttribute("aria-hidden");
    markEl.setAttribute("role", "img");
    markEl.setAttribute("aria-label", "مستوى الازدحام: " + v.word);
    n.count.textContent = v.count;
    n.pctNum.textContent = v.pct;
    var s = document.createElement("div"); s.innerHTML = snap.stamp;
    n.fresh.innerHTML = s.querySelector(".fresh").innerHTML;
    n.open.innerHTML = s.querySelector(".open").innerHTML;
    said.textContent = "الازدحام الآن: " + v.word + "، " + v.count + " داخل الصالة تقريبًا";
  }

  // Delayed: the last reading kept, qualified as last known. The status says «متأخر» with the reading's time and age;
  // the word, the count and the percentage dim; the mark keeps the level's place but nothing in it is lit; the count's
  // line says «حينها» (then) where the live one says «الآن» (now).
  function delayed() {
    page.setAttribute("data-state", "delayed");
    n.sr.textContent = "الازدحام عند آخر قراءة: ";
    markEl.setAttribute("aria-label", "مستوى الازدحام عند آخر قراءة: " + v.word);
    n.line.innerHTML = '<bdi class="num count" data-k="count">' + v.count + "</bdi> داخل الصالة حينها · تقريبًا";
    n.fresh.innerHTML = ring('متأخر · آخر قراءة <bdi class="num">7:28</bdi>&nbsp;م · قبل <bdi class="num">13</bdi> دقيقة');
  }

  // Closed, Unavailable and Error have no reading: the state's answer takes the level word's place, the mark goes, and
  // the line under the answer says what follows.
  function answer(name, words, line, small, status) {
    page.setAttribute("data-state", name);
    page.removeAttribute("data-level");
    n.sr.remove();
    n.text.textContent = words;
    markOff();
    markEl.hidden = true;
    n.line.innerHTML = line;
    if (small) n.pct.textContent = small; else n.pct.remove();
    n.fresh.innerHTML = status;
  }
  function closed() {
    answer("closed", "مغلق", 'يفتح <bdi class="num lead">6:00</bdi>&nbsp;ص', null, ring("خارج ساعات العمل"));
    n.open.remove();
  }
  function unavailable() {
    answer("unavailable", "لا عدّ حاليًا", "لن نعرض قراءة قديمة على أنها حالية.", "يعود العدد حين تصل قراءة جديدة.", ring("غير متصل"));
  }
  function error() {
    answer("error", "تعذّر التحميل", "تحقّق من الاتصال، ثم أعد المحاولة.", null,
      '<svg class="cue cue-alert" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><circle cx="6" cy="6" r="5.25"/><path d="M6 3.3v3.4"/><circle class="cue-pt" cx="6" cy="8.75" r=".9"/></svg><span>خطأ</span>');
    sign.removeAttribute("aria-busy");
    if (n.open.isConnected) n.open.remove();
    var retry = document.createElement("button");
    retry.type = "button"; retry.className = "retry"; retry.textContent = "أعد المحاولة";
    facts.appendChild(retry);
    said.setAttribute("role", "alert");
    said.textContent = "تعذّر التحميل. تحقّق من الاتصال، ثم أعد المحاولة.";
    retry.focus({ preventScroll: true });
    // The one retry: «جارٍ المحاولة…» with focus kept, then the load again; the synthetic payload arrives into live.
    retry.addEventListener("click", function () {
      if (retry.getAttribute("aria-disabled")) return;
      retry.setAttribute("aria-disabled", "true");
      retry.textContent = "جارٍ المحاولة…";
      setTimeout(function () {
        said.setAttribute("role", "status"); said.textContent = "";
        word.innerHTML = snap.word; facts.innerHTML = snap.facts; stamp.innerHTML = snap.stamp;
        markEl.hidden = false; bind(); loading();
        setTimeout(function () { live(); word.tabIndex = -1; word.focus(); }, 900);
      }, 700);
    });
  }

  // Ready once the Readex Pro weights the page uses have loaded (one variable file, real weights 160-700).
  Promise.all(["400", "500", "600"].map(function (w) {
    return document.fonts.load(w + ' 16px "Readex Pro"', "العربية FITWAY 0123456789%").catch(function () {});
  })).then(function () { window.__sketch = { ready: true }; });
})();
