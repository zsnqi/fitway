// FITWAY public crowd page, the draft from direction B (public-redesign-r01). Concept only, synthetic data, a still.
// ?level=quiet|moderate|busy|packed shows that level, with values that agree with it (Busy without it).
// ?mark=2|3|4 swaps in another form of the four-level mark and changes nothing else (the refined bars without it).
// ?state=loading|delayed|unavailable|closed|error draws that state on the same page, at rest (live without it; see "The
// other states" in public.css). Delayed keeps ?level=; the others show no level. ?state=loading&arrive=<ms> lets the
// first payload arrive into live after that many milliseconds by DESIGN_GUIDE §6's loading rules, so its shift can be
// measured; a load that reaches 10 s becomes Error.
// ?demo= plays an event on the live page, &after=<ms> (1500 without it) once the fonts have loaded, to show its motion
// (see "Motion" in public.css): reading (a new reading, the count up, then another, down), level (the level up a step,
// then back; down first from Packed), delayed (the readings stop, then return), stale (they stop), closed, unavailable,
// error (the live page goes to that state; Error's retry then loads into live); a list plays them in turn, &gap=<ms>
// apart (3500 without it). Under reduced motion every change is instant.
// ?lang=en sets the page in English, left to right, every state and demo with it; the language button switches between
// the two and keeps the rest of the address.
(function () {
  var q = new URLSearchParams(location.search);
  var en = q.get("lang") === "en";
  // The page's words. Each language is written for itself (GLO-17), not as a mirror of the other: Arabic first, the
  // markup's own; English in the same places. A time is Western digits and a 12-hour clock in gym time, its period
  // never parted from it (ص/م, AM/PM). Values come in as text; each function returns the markup of its line.
  var num = function (x, cls) { return '<bdi class="num' + (cls ? " " + cls : "") + '">' + x + "</bdi>"; };
  var count = function (c) { return '<bdi class="num count" data-k="count">' + c + "</bdi>"; };
  var T = en ? {
    lang: "en", other: "العربية", otherLang: "ar",
    words: { quiet: "Quiet", moderate: "Moderate", busy: "Busy", packed: "Packed" },
    now: "Crowd right now", level: "Crowd level",
    pm: function (t) { return num(t) + "&nbsp;PM"; }, am: function (t, cls) { return num(t, cls) + "&nbsp;AM"; },
    countLine: function (c) { return count(c) + " inside now · approx."; },
    pct: function (p) { return '<bdi class="num" data-k="pct">' + p + "</bdi> full"; },
    open: function () { return "Open until " + T.am("1:00"); },
    live: function (t) { return "Live · Last reading " + T.pm(t); },
    say: function (w, c) { return "Crowd right now: " + w + ", about " + c + " inside"; },
    thenSr: "Crowd at the last reading", thenLevel: "Crowd level at the last reading",
    thenLine: function (c, t) { return count(c) + " inside at " + T.pm(t) + " · approx."; },
    delayed: function (t) { return "Delayed · Last reading " + T.pm(t) + " · " + num("13") + "&nbsp;min ago"; },
    loading: "Loading…",
    closed: ["Closed", function () { return "Opens " + T.am("6:00", "lead"); }, "Outside opening hours"],
    unavailable: ["No current count", "We won’t show an old reading as current.", "The count returns with the next reading.", "Offline"],
    error: ["Couldn’t load", "Check your connection, then try again.", "Error", "Try again", "Trying again…"]
  } : {
    lang: "ar", other: "English", otherLang: "en",
    words: { quiet: "هادئ", moderate: "متوسط", busy: "مزدحم", packed: "شديد الازدحام" },
    now: "الازدحام الآن", level: "مستوى الازدحام",
    pm: function (t) { return num(t) + "&nbsp;م"; }, am: function (t, cls) { return num(t, cls) + "&nbsp;ص"; },
    countLine: function (c) { return count(c) + " داخل الصالة الآن · تقريبًا"; },
    pct: function (p) { return 'نسبة الامتلاء <bdi class="num" data-k="pct">' + p + "</bdi>"; },
    open: function () { return "مفتوح حتى " + T.am("1:00"); },
    live: function (t) { return "مباشر · آخر قراءة " + T.pm(t); },
    say: function (w, c) { return "الازدحام الآن: " + w + "، " + c + " داخل الصالة تقريبًا"; },
    thenSr: "الازدحام عند آخر قراءة", thenLevel: "مستوى الازدحام عند آخر قراءة",
    thenLine: function (c, t) { return count(c) + " داخل الصالة عند " + T.pm(t) + " · تقريبًا"; },
    delayed: function (t) { return "متأخر · آخر قراءة " + T.pm(t) + " · قبل " + num("13") + " دقيقة"; },
    loading: "جارٍ التحميل…",
    closed: ["مغلق", function () { return "يفتح " + T.am("6:00", "lead"); }, "خارج ساعات العمل"],
    unavailable: ["لا عدّ حاليًا", "لن نعرض قراءة قديمة على أنها حالية.", "يعود العدد حين تصل قراءة جديدة.", "غير متصل"],
    error: ["تعذّر التحميل", "تحقّق من الاتصال، ثم أعد المحاولة.", "خطأ", "أعد المحاولة", "جارٍ المحاولة…"]
  };
  var levels = {
    quiet: { n: "1", word: T.words.quiet, count: "14", pct: "12%" },
    moderate: { n: "2", word: T.words.moderate, count: "41", pct: "34%" },
    busy: { n: "3", word: T.words.busy, count: "70", pct: "58%" },
    packed: { n: "4", word: T.words.packed, count: "106", pct: "88%" }
  };
  var order = ["quiet", "moderate", "busy", "packed"];
  var key = levels[q.get("level")] ? q.get("level") : "busy";
  var v = Object.assign({ time: "7:41" }, levels[key]); // the reading on the page; a demo replaces it
  var mark = q.get("mark");
  var page = document.querySelector(".page");
  var facts = document.querySelector(".facts"), stamp = document.querySelector(".stamp");
  // English: the document's language and direction, and each line of the markup in its English words (the four
  // levels' names under the scale too).
  if (en) {
    document.documentElement.lang = "en";
    document.documentElement.dir = "ltr";
    document.querySelector(".word .sr-only").textContent = T.now + ": ";
    facts.querySelector(".count-line").innerHTML = T.countLine(v.count);
    facts.querySelector(".open").innerHTML = T.open();
    stamp.querySelector(".fresh span").innerHTML = T.live(v.time);
    stamp.querySelector(".pct").innerHTML = T.pct(v.pct);
    document.querySelectorAll(".mark span").forEach(function (s, k) { s.textContent = levels[order[k]].word; });
  }
  // The language button names the other language in its own words and opens the same page, state and level in it.
  var langBtn = document.querySelector(".lang"), there = new URLSearchParams(q);
  if (en) there.delete("lang"); else there.set("lang", "en");
  langBtn.textContent = T.other;
  langBtn.lang = T.otherLang;
  langBtn.hreflang = T.otherLang;
  langBtn.href = location.pathname + (String(there) ? "?" + there : "");
  // The percentage sits under the count and the open line stands in the stamp: the markup keeps them the other way
  // round, and public.css styles each for the place it is moved to.
  var pct = stamp.querySelector(".pct"), open = facts.querySelector(".open");
  facts.appendChild(pct);
  stamp.appendChild(open);
  page.setAttribute("data-level", v.n);
  page.setAttribute("data-mark", /^[1-4]$/.test(mark || "") ? mark : "1");
  document.querySelectorAll("[data-k]").forEach(function (el) {
    var k = el.getAttribute("data-k");
    if (k === "mark") el.setAttribute("aria-label", T.level + ": " + v.word);
    else if (v[k]) el.textContent = v[k];
  });

  // The other states. Each keeps the header, the light and the page's places. The status always stands where the live
  // stamp stands, at the foot's start, its cue the live dot emptied into a ring (Error: the alert mark); nothing but
  // Live has the green dot or «مباشر». Where there is no reading, the state's answer takes the level word's place.
  var sign = document.querySelector(".sign"), word = sign.querySelector(".word"), markEl = sign.querySelector(".mark");
  var snap = { word: word.innerHTML, facts: facts.innerHTML, stamp: stamp.innerHTML };
  var n = {}, slow, said; // the nodes a state writes into, found again after a rebuild; the slow-load timer; the voice
  var bind = function () {
    n.text = word.querySelector("[data-k=word]"); n.sr = word.querySelector(".sr-only");
    n.line = facts.querySelector(".count-line"); n.count = facts.querySelector(".count");
    n.pct = facts.querySelector(".pct"); n.pctNum = n.pct.querySelector("bdi");
    n.fresh = stamp.querySelector(".fresh"); n.open = stamp.querySelector(".open");
    n.time = n.fresh.querySelector("bdi");
  };
  bind();
  // The page's one announcement, outside the busy region; made only where something will be said.
  function voice() {
    if (!said) { said = document.createElement("p"); said.className = "sr-only"; said.setAttribute("role", "status"); page.appendChild(said); }
    return said;
  }
  var state = q.get("state");
  var draw = { loading: loading, delayed: delayed, closed: closed, unavailable: unavailable, error: error };
  if (draw[state]) { voice(); draw[state](); }

  function ring(text) { return '<i class="cue" aria-hidden="true"></i><span>' + text + "</span>"; }
  // A placeholder stands where a value is awaited, in the room of the value's median form (public.css).
  function ph(kind) { return '<i class="ph" data-ph="' + kind + '" aria-hidden="true"></i>'; }
  function markOff() { markEl.removeAttribute("role"); markEl.removeAttribute("aria-label"); markEl.setAttribute("aria-hidden", "true"); }
  // The live page's nodes as the page first drew them.
  function restore() {
    word.innerHTML = snap.word; facts.innerHTML = snap.facts; stamp.innerHTML = snap.stamp;
    bind();
  }

  // Loading: the first payload is resolving. The labels are real text, each awaited value a placeholder of its geometry,
  // and the mark's place a flat baseline. No level, count, time or dot.
  function loading() {
    page.setAttribute("data-state", "loading");
    page.removeAttribute("data-level");
    sign.setAttribute("aria-busy", "true");
    n.sr.textContent = T.now;
    n.text.innerHTML = '<i class="ph ph-word" aria-hidden="true"></i>';
    markOff();
    n.count.innerHTML = ph("count");
    n.pctNum.innerHTML = ph("pct");
    n.fresh.innerHTML = ring(T.loading);
    n.open.innerHTML = ph("open");
    var t0 = performance.now(), arrive = q.get("arrive");
    slow = setTimeout(function () { voice().textContent = T.loading; }, 1000);
    if (arrive === null) return; // the still: the skeleton at rest
    // Before 300 ms the value areas keep their space, empty; the skeleton then stays at least 400 ms; 10 s is the ceiling.
    page.setAttribute("data-wait", "");
    var shown = null, at = Math.max(0, +arrive || 0);
    var show = setTimeout(function () { page.removeAttribute("data-wait"); shown = performance.now(); }, 300);
    var ceiling = setTimeout(function () { clearTimeout(slow); clearTimeout(land); page.removeAttribute("data-wait"); change(error); }, 10000);
    var land = setTimeout(function go() {
      if (shown !== null && performance.now() - shown < 400) { land = setTimeout(go, 400 - (performance.now() - shown)); return; }
      clearTimeout(show); clearTimeout(ceiling);
      page.removeAttribute("data-wait");
      live(); arrival();
      window.__arrived = { at: performance.now() - t0, skeleton: shown === null ? null : shown - t0 };
    }, at);
  }

  // The live page with the reading in v: the nodes as first drawn, then the values written into them.
  function live() {
    clearTimeout(slow);
    restore();
    page.removeAttribute("data-state");
    page.setAttribute("data-level", v.n);
    sign.removeAttribute("aria-busy");
    n.text.textContent = v.word;
    markEl.removeAttribute("aria-hidden");
    markEl.setAttribute("role", "img");
    markEl.setAttribute("aria-label", T.level + ": " + v.word);
    n.count.textContent = v.count;
    n.pctNum.textContent = v.pct;
    n.time.textContent = v.time;
    voice().textContent = T.say(v.word, v.count);
  }

  // Delayed: the last reading kept, qualified as last known. The status says «متأخر» / Delayed with the reading's time
  // and age; the word, the count and the percentage dim; the mark keeps the level's place but nothing in it is lit; the
  // count's line gives the reading's time where the live one says «الآن» / now, so the figure under the word says when
  // it was true. The still's reading is 7:28; a demo keeps its own.
  function delayed(time) {
    var t = time || "7:28";
    page.setAttribute("data-state", "delayed");
    n.sr.textContent = T.thenSr + ": ";
    markEl.setAttribute("aria-label", T.thenLevel + ": " + v.word);
    n.line.innerHTML = T.thenLine(v.count, t);
    n.fresh.innerHTML = ring(T.delayed(t));
  }

  // Closed, Unavailable and Error have no reading: the state's answer takes the level word's place, the mark keeps only
  // its ground (public.css), and the line under the answer says what follows.
  function answer(name, words, line, small, status) {
    page.setAttribute("data-state", name);
    page.removeAttribute("data-level");
    n.sr.remove();
    n.text.textContent = words;
    markOff();
    n.line.innerHTML = line;
    if (small) n.pct.textContent = small; else n.pct.remove();
    n.fresh.innerHTML = status;
  }
  function closed() {
    answer("closed", T.closed[0], T.closed[1](), null, ring(T.closed[2]));
    n.open.remove();
  }
  function unavailable() {
    var w = T.unavailable;
    answer("unavailable", w[0], w[1], w[2], ring(w[3]));
  }
  function error() {
    var w = T.error;
    answer("error", w[0], w[1], null,
      '<svg class="cue cue-alert" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><circle cx="6" cy="6" r="5.25"/><path d="M6 3.3v3.4"/><circle class="cue-pt" cx="6" cy="8.75" r=".9"/></svg><span>' + w[2] + "</span>");
    sign.removeAttribute("aria-busy");
    if (n.open.isConnected) n.open.remove();
    var retry = document.createElement("button");
    retry.type = "button"; retry.className = "retry"; retry.textContent = w[3];
    facts.appendChild(retry);
    voice().setAttribute("role", "alert");
    said.textContent = w[0] + ". " + w[1];
    retry.focus({ preventScroll: true });
    // The one retry: «جارٍ المحاولة…» / Trying again… with focus kept, then the load again; the synthetic payload
    // arrives into live.
    retry.addEventListener("click", function () {
      if (retry.getAttribute("aria-disabled")) return;
      retry.setAttribute("aria-disabled", "true");
      retry.textContent = w[4];
      setTimeout(function () {
        change(function () {
          said.setAttribute("role", "status"); said.textContent = "";
          restore(); loading();
        });
        setTimeout(function () { live(); arrival(); word.tabIndex = -1; word.focus(); }, 900);
      }, 700);
    });
  }

  // Motion (public.css, "Motion"). Every change above is a still; what follows only moves between stills. Nothing runs
  // under reduced motion, and nothing here repeats: the one loop, the live dot's beat, is CSS and runs in live only.
  // Nothing moves under reduced motion, nor while the page is hidden (a phone in a pocket): a change made then is written
  // at once, so the page shown again is never mid-motion or behind.
  function moving() { return !matchMedia("(prefers-reduced-motion: reduce)").matches && !document.hidden && !!document.body.animate; }
  var settle = "cubic-bezier(0.16, 1, 0.3, 1)";
  var swapping = []; // the elements with a value on its way out

  // Ends every motion of a reading at once, its values written: a state that follows must not inherit one (a bar's
  // colour still on its way would light a Delayed mark; a word on its way would be written over Closed).
  function settleAll() {
    swapping.splice(0).forEach(function (el) { if (el.__swap) el.__swap.give(); });
    if (document.getAnimations) document.getAnimations().forEach(function (a) { if (!a.animationName && !a.transitionProperty) a.cancel(); });
  }

  document.addEventListener("visibilitychange", function () { if (document.hidden) settleAll(); });

  // A state replaces a state: one short crossfade of the whole page where the browser has view transitions.
  function change(apply) {
    settleAll();
    if (moving() && document.startViewTransition) {
      var t = document.startViewTransition(function () { settleAll(); apply(); });
      t.ready.catch(function () {}); // a skipped transition still applies the state; only its crossfade is lost
    } else apply();
  }

  // A value is replaced: the old lifts out, then the new settles into the same place, upward when the value grows (or
  // the time moves on), downward when it falls; never through a value that was not a reading. `dist` is in the
  // element's ems. The old leaves at an even pace, so it moves from the first frame; the new decelerates into place. A
  // swap that is overtaken writes its value at once and gives way.
  function swap(el, write, dir, dist) {
    if (el.__swap) el.__swap.give();
    if (!moving()) { write(); return; }
    var y = dist || 0.3, s = { done: false, anims: [] }, unbox = box(el);
    s.give = function () { s.anims.forEach(function (a) { a.cancel(); }); if (!s.done) { s.done = true; write(); } unbox(); el.__swap = null; };
    var out = el.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(" + (-dir * y) + "em)" }],
      { duration: 120, easing: "linear", fill: "forwards" });
    s.anims.push(out); el.__swap = s; if (swapping.indexOf(el) < 0) swapping.push(el);
    out.finished.then(function () {
      if (el.__swap !== s) return;
      s.done = true; write();
      var inn = el.animate([{ opacity: 0, transform: "translateY(" + (dir * y) + "em)" }, { opacity: 1, transform: "none" }],
        { duration: 300, easing: settle });
      s.anims.push(inn); out.cancel();
      inn.finished.then(function () { if (el.__swap === s) { unbox(); el.__swap = null; swapping.splice(swapping.indexOf(el), 1); } }, function () {});
    }, function () {});
  }

  // An inline run (a value's bdi) is a box while it moves, so a transform can carry it, and an inline run again at rest:
  // a box is painted on whole device pixels where the run need not be, so a box at rest could stand a fraction of a
  // device pixel aside (its layout position is the same). Returns the undo.
  function box(el) {
    if (getComputedStyle(el).display !== "inline") return function () {};
    el.style.display = "inline-block";
    return function () { el.style.removeProperty("display"); };
  }

  // The values of a new reading, each that changed replaced in the direction of its change.
  function values(next) {
    var way = function (a, b) { return parseFloat(a) > parseFloat(b) ? 1 : -1; };
    if (next.count !== v.count) swap(n.count, function () { n.count.textContent = next.count; }, way(next.count, v.count));
    if (next.pct !== v.pct) swap(n.pctNum, function () { n.pctNum.textContent = next.pct; }, way(next.pct, v.pct));
    if (next.time !== v.time) swap(n.time, function () { n.time.textContent = next.time; }, 1);
  }

  // The mark's coloured parts: each bar (form 4: its rule and its label), in reading order.
  function parts() {
    var out = [], four = page.getAttribute("data-mark") === "4";
    markEl.querySelectorAll("i").forEach(function (i, k) {
      if (four) { out.push({ el: i, pseudo: "::before", prop: "backgroundColor", k: k }); out.push({ el: i.querySelector("span"), prop: "color", k: k }); }
      else out.push({ el: i, prop: "backgroundColor", k: k });
    });
    out.forEach(function (p) { p.from = getComputedStyle(p.el, p.pseudo || null)[p.prop]; });
    return out;
  }

  // A new reading at the same level. Readings change the live page only; any other state changes by change().
  function reading(next) { if (page.hasAttribute("data-state")) return; values(next); v = next; }

  // A new reading at another level: the word is replaced in the direction of the change, and the mark's light steps
  // along the bars the same way, each part that changes after the one before it.
  function relevel(next) {
    if (page.hasAttribute("data-state")) return;
    var dir = +next.n > +v.n ? 1 : -1, ps = moving() ? parts() : [];
    swap(word, function () { n.text.textContent = next.word; }, dir, 0.12);
    page.setAttribute("data-level", next.n);
    markEl.setAttribute("aria-label", T.level + ": " + next.word);
    var changed = ps.filter(function (p) { p.to = getComputedStyle(p.el, p.pseudo || null)[p.prop]; return p.to !== p.from; });
    var ks = changed.map(function (p) { return p.k; }).filter(function (k, i, a) { return a.indexOf(k) === i; }).sort(function (a, b) { return dir * (a - b); });
    changed.forEach(function (p) {
      var kf = [{}, {}]; kf[0][p.prop] = p.from; kf[1][p.prop] = p.to;
      p.el.animate(kf, { duration: 320, delay: 60 + 90 * ks.indexOf(p.k), easing: "cubic-bezier(0.2, 0.6, 0.2, 1)", fill: "backwards", pseudoElement: p.pseudo });
    });
    values(next);
    v = next;
    voice().textContent = T.say(v.word, v.count);
  }

  // The first payload arrives (from Loading): the bars rise from the loading baseline in reading order (the other forms
  // of the mark fade in the same order), and each value settles in where its placeholder stood. The labels, real text
  // from the first paint, stay still.
  function arrival() {
    if (!moving()) return;
    var bars = page.getAttribute("data-mark") === "1";
    markEl.querySelectorAll("i").forEach(function (i, k) {
      i.animate(bars ? [{ transform: "scaleY(0)" }, { transform: "none" }] : [{ opacity: 0 }, { opacity: 1 }],
        { duration: 440, delay: 50 * k, easing: settle, fill: "backwards" });
    });
    // No delay: the placeholders are gone in the same frame, so a value that waited would leave its place empty.
    var rise = function (el, y) {
      var unbox = box(el);
      el.animate([{ opacity: 0, transform: "translateY(" + y + "em)" }, { opacity: 1, transform: "none" }], { duration: 340, easing: settle }).finished.then(unbox, unbox);
    };
    rise(word, 0.12); rise(n.count, 0.3); rise(n.pctNum, 0.3);
    [n.fresh, n.open].forEach(function (el) { el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: settle }); });
  }

  // The demos (?demo=, &after=), on the live page only. Readings follow the levels' own ratio (a capacity of 120.5) and
  // the clock moves on a minute a reading.
  function later(time, mins) {
    var p = time.split(":"), t = +p[0] * 60 + +p[1] + mins;
    return Math.floor(t / 60) + ":" + ("0" + (t % 60)).slice(-2);
  }
  function at(count, mins) { return Object.assign({}, v, { count: String(count), pct: Math.round(count / 120.5 * 100) + "%", time: later(v.time, mins) }); }
  function stepTo(k) { return Object.assign({}, levels[k], { time: later(v.time, 1) }); }
  var demos = {
    reading: [function () { reading(at(+v.count + 3, 1)); }, function () { reading(at(+v.count - 5, 1)); }],
    level: [function () { relevel(stepTo(order[order.indexOf(key) + (key === "packed" ? -1 : 1)])); }, function () { relevel(stepTo(key)); }],
    stale: [function () { var t = v.time; change(function () { delayed(t); }); }],
    delayed: [function () { demos.stale[0](); }, function () { v = at(+v.count, 14); change(live); }],
    closed: [function () { change(closed); }],
    unavailable: [function () { change(unavailable); }],
    error: [function () { change(error); }]
  };
  // A list (?demo=level,closed) plays every step of each in turn, &gap=<ms> apart (3500 without it): a short gap
  // overtakes one motion with the next.
  var demo = draw[state] ? [] : (q.get("demo") || "").split(",").reduce(function (all, d) { return all.concat(demos[d] || []); }, []);

  // Ready once the Readex Pro weights the page uses have loaded (one variable file, real weights 160-700).
  Promise.all(["400", "500", "600"].map(function (w) {
    return document.fonts.load(w + ' 16px "Readex Pro"', "العربية FITWAY 0123456789%").catch(function () {});
  })).then(function () {
    window.__sketch = { ready: true };
    if (!demo.length) return;
    var after = Math.max(0, q.get("after") === null ? 1500 : +q.get("after") || 0);
    var gap = Math.max(0, q.get("gap") === null ? 3500 : +q.get("gap") || 0);
    window.__demo = [];
    demo.forEach(function (f, i) {
      setTimeout(function () { window.__demo.push(performance.now()); f(); }, after + gap * i);
    });
  });
})();
