/* FITWAY public crowd page, Eclipse, first options (public-redesign-r01). Concept only, synthetic data.
 *
 * One page answers, in FITWAY_PRODUCT.md's order: is the gym open and is the information live; the crowd band; the
 * approximate count; the level mark; when it was updated; and, closed, when it opens (stale: what the visitor can
 * safely conclude). Three options draw that same order three ways, each with its own level mark:
 *   a  the sheet   one lit plate, the answers in ruled rows; the mark is a four-step track with the four words
 *   b  the dial    a data-lit card; the mark is a four-sector arc around the band word
 *   c  the stair   no card; the mark is Eclipse's four-bar level badge (CHP-5) drawn at the page's scale
 * Every mark comes from the band only, keeps the written band word visible, runs in reading direction, has one
 * accessible name and hides its parts (DESIGN_GUIDE.md section 5). The page is complete at first paint; digits roll
 * only when a new live reading arrives (section 10), never on opening, never while stale or closed, never under
 * reduced motion or ?motion=off. Demo hooks, never controls: ?state=, ?option=, ?arrive (a new reading 1.5 s after
 * opening, fresh only; ?arrive=busy crosses a band), ?band= (layout checks only). */
(() => {
  "use strict";
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const en = root.lang === "en";
  const OPTION = root.dataset.option, STATE = root.dataset.state;
  const params = new URLSearchParams(location.search);
  const BANDS = ["quiet", "moderate", "busy", "packed"];
  // Synthetic fixtures (FITWAY_PRODUCT.md names 37 a fixture, not measured truth). Times are minutes after midnight in
  // gym time (Riyadh), as the Owner concept's Wednesday: the live reading at 7:42 PM, the stale one 13 minutes older
  // (the age is measured against the payload's server time, never the device clock), the opening at 6:00 AM.
  const BAND_COUNT = { quiet: 14, moderate: 37, busy: 56, packed: 74 };
  const asked = BANDS.includes(params.get("band")) ? params.get("band") : "moderate";
  const reading = {
    band: BANDS.indexOf(asked),
    count: BAND_COUNT[asked],
    at: STATE === "stale" ? 19 * 60 + 29 : 19 * 60 + 42,
    serverNow: 19 * 60 + 42,
    opens: 6 * 60,
  };

  const STR = {
    ar: {
      gym: "نادي الياسمين",
      langGlyph: "EN", langAria: "التبديل إلى اللغة الإنجليزية",
      open: "مفتوح", status: { fresh: "مباشر", stale: "متأخر", closed: "مغلق" },
      level: "مستوى الازدحام", levelStale: "آخر مستوى معروف",
      count: "داخل الصالة الآن · تقريبًا", countStale: "آخر عدد معروف · تقريبًا",
      bands: ["هادئ", "متوسط", "مزدحم", "شديد الازدحام"],
      last: "آخر قراءة",
      ago: (m) => (m === 1 ? "قبل دقيقة" : m === 2 ? "قبل دقيقتين" : m <= 10 ? `قبل ${m} دقائق` : `قبل ${m} دقيقة`),
      staleNote: "قد يكون الازدحام الآن مختلفًا.",
      opens: "يفتح",
      mark: (b) => `مستوى الازدحام: ${b}`, markStale: (b) => `آخر مستوى معروف: ${b}`,
      say: (b, n, t) => `${b}، ${n} داخل الصالة الآن تقريبًا، آخر قراءة ${t}`,
      am: "ص", pm: "م",
    },
    en: {
      gym: "Al Yasmin Gym",
      langGlyph: "AR", langAria: "Switch to Arabic",
      open: "Open", status: { fresh: "Live", stale: "Delayed", closed: "Closed" },
      level: "Crowd level", levelStale: "Last known level",
      count: "Inside now · approx.", countStale: "Last known count · approx.",
      bands: ["Quiet", "Moderate", "Busy", "Packed"],
      last: "Last reading",
      ago: (m) => `${m} min ago`,
      staleNote: "It may be different now.",
      opens: "Opens",
      mark: (b) => `Crowd level: ${b}`, markStale: (b) => `Last known level: ${b}`,
      say: (b, n, t) => `${b}, about ${n} inside now, last reading ${t}`,
      am: "AM", pm: "PM",
    },
  };
  const L = STR[en ? "en" : "ar"];

  // A 12-hour time in gym time, Western digits, «ص/م» or AM/PM (DAT-1); one unbreakable phrase (DAT-4).
  const clock = (min) => {
    const h = Math.floor(min / 60) % 24, m = String(min % 60).padStart(2, "0");
    return `${h % 12 || 12}:${m} ${h < 12 ? L.am : L.pm}`;
  };
  const SEP = `<span class="sep" aria-hidden="true">·</span><span class="sr-only">${en ? ", " : "، "}</span>`;
  const ICON = {
    clock: `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.2"/><path d="M12 7.6V12l3 2"/></svg>`,
  };
  const LAMP = `<i class="lamp" aria-hidden="true"><i class="lamp-in"><i class="lamp-rim"></i></i></i>`;

  /* ---- the parts every option shares */
  const stale = STATE === "stale";
  const part = {
    status() {
      const mark = STATE === "fresh" ? `<i class="dot" aria-hidden="true"></i>`
        : STATE === "stale" ? ICON.clock : `<i class="dot ring" aria-hidden="true"></i>`;
      // Question 1 has two parts: open, then live. Open and live (or delayed) say both; closed says closed.
      const words = STATE === "closed" ? "" : `<span class="st-w">${L.open}</span>${SEP}`;
      return `<p class="st is-${STATE}">${mark}${words}<span class="st-w st-f">${L.status[STATE]}</span></p>`;
    },
    band: (cls = "") => `<p class="bw ${cls}" id="band-w">${L.bands[reading.band]}</p>`,
    count: () => `<bdi class="big num" id="count-n">${reading.count}</bdi>`,
    countLabel: () => (stale ? L.countStale : L.count),
    levelLabel: () => (stale ? L.levelStale : L.level),
    markName: () => (stale ? L.markStale : L.mark)(L.bands[reading.band]),
    time() {
      const t = `<bdi class="t" id="time-t">${clock(reading.at)}</bdi>`;
      if (!stale) return `<p class="tm">${L.last} ${t}</p>`;
      const age = reading.serverNow - reading.at;
      return `<p class="tm">${L.last} ${t}${SEP}<span class="ago">${L.ago(age)}</span></p>`;
    },
    note: () => (stale ? `<p class="note">${L.staleNote}</p>` : ""),
    opens: (cls) => `<div class="${cls}"><p class="lbl">${L.opens}</p><p class="big"><bdi class="t">${clock(reading.opens)}</bdi></p></div>`,
  };
  const on = (i) => (i <= reading.band ? " on" : "") + (i === reading.band ? " cur" : "");

  /* ---- the level marks. Each fills from the reading start: right to left in Arabic, left to right in English. */
  const mark = {
    // a: four whole units on one unbroken line, each word under its unit, the current one in chalk.
    track: () => `<div class="track" id="mark" role="img" aria-label="${part.markName()}"><span class="track-in" aria-hidden="true">${
      BANDS.map((_, i) => `<span class="tu${on(i)}"><i class="tu-bar"><b class="fl"></b></i><span class="tu-w">${L.bands[i]}</span></span>`).join("")
    }</span></div>`,
    // b: a half ring of four sectors. Drawn left to right and mirrored in Arabic (it holds no text).
    dial() {
      const rc = 92, pt = (t) => {
        const a = Math.PI - (t * Math.PI) / 180;
        return `${(100 + rc * Math.cos(a)).toFixed(2)} ${(100 - rc * Math.sin(a)).toFixed(2)}`;
      };
      const arcs = BANDS.map((_, i) => {
        const t0 = i * 45 + (i ? 1.6 : 0), t1 = (i + 1) * 45 - (i < 3 ? 1.6 : 0);
        return `M${pt(t0)} A${rc} ${rc} 0 0 1 ${pt(t1)}`;
      });
      const layer = (cls, extra = () => "") => arcs.map((d, i) => `<path class="${cls}${extra(i)}" d="${d}" pathLength="1"/>`).join("");
      return `<div class="dial" id="mark" role="img" aria-label="${part.markName()}"><svg class="dial-svg" viewBox="0 0 200 100" aria-hidden="true" focusable="false">${
        layer("ds-plate") + layer("ds-off") + layer("ds-on", (i) => on(i))
      }</svg></div>`;
    },
    // c: CHP-5's four bars at the page's scale: heights 4, 6.5, 9 and 11, every lit bar #FF2946.
    stair: () => `<div class="stair" id="mark" role="img" aria-label="${part.markName()}"><span class="stair-in" aria-hidden="true">${
      BANDS.map((_, i) => `<i class="sb${on(i)}"><b class="fl"></b></i>`).join("")
    }</span></div>`,
  };

  /* ---- the three options. Closed shows no count, band, mark or freshness: the status and the next opening only. */
  const OPTIONS = {
    a() {
      if (STATE === "closed") return `<div class="card pa"><div class="pa-r">${part.status()}</div>${part.opens("pa-r pa-open")}</div>`;
      const lit = STATE === "fresh";
      return `<div class="card pa${lit ? " lit lit-card" : ""}">${lit ? LAMP : ""}
        <div class="pa-r pa-st">${part.status()}</div>
        <div class="pa-r pa-band"><p class="lbl">${part.levelLabel()}</p>${part.band("v")}</div>
        <div class="pa-r pa-count"><p class="lbl">${part.countLabel()}</p><p class="v">${part.count()}</p></div>
        <div class="pa-r pa-mk">${mark.track()}</div>
        <div class="pa-r pa-tm">${part.time()}${part.note()}</div>
      </div>`;
    },
    b() {
      if (STATE === "closed") return `<div class="card pb">${part.status()}${part.opens("pb-open")}</div>`;
      const lit = STATE === "fresh";
      return `<div class="card pb${lit ? " lit lit-chart" : ""}">${lit ? LAMP : ""}
        ${part.status()}
        <div class="pb-g">${part.band("pb-band")}<p class="pb-n">${part.count()}</p><p class="lbl pb-k">${part.countLabel()}</p>${mark.dial()}</div>
        <div class="pb-tm">${part.time()}${part.note()}</div>
      </div>`;
    },
    c() {
      if (STATE === "closed") return `<div class="pc is-closed">${part.status()}${part.opens("pc-open")}</div>`;
      return `<div class="pc">
        <div class="pc-txt">${part.status()}${part.band("pc-band")}<p class="pc-n">${part.count()}</p><p class="lbl">${part.countLabel()}</p></div>
        ${mark.stair()}
        <div class="pc-tm">${part.time()}${part.note()}</div>
      </div>`;
    },
  };

  function render() {
    document.title = `${L.gym} · FITWAY`;
    $("#gym").textContent = L.gym;
    const lang = $("#lang");
    lang.setAttribute("aria-label", L.langAria);
    $("#lang-glyph").textContent = L.langGlyph;
    lang.addEventListener("click", () => {
      const url = new URL(location.href);
      url.searchParams.set("lang", en ? "ar" : "en");
      location.assign(url);
    });
    $("#reading").innerHTML = OPTIONS[OPTION]();
  }

  /* ---- a new live reading (fresh only). Only what changed moves: changed digits roll inside their own ink box (MOT-2,
   * 280 ms), a unit, sector or bar fills or empties (MOT-3, 200 ms, 50 ms apart), the band word swaps at once (never a
   * cross-fade, DO-NOT); assistive technology hears the new reading once. */
  const motionOn = () => (window.EclipseMotion ? window.EclipseMotion.on() : !matchMedia("(prefers-reduced-motion: reduce)").matches);
  const STATE_EASE = "cubic-bezier(0.25, 1, 0.5, 1)";
  function roll(el, text, up) {
    const old = el.textContent;
    el.textContent = text;
    if (old === text || old.length !== text.length || !motionOn()) return;
    el.textContent = "";
    const timing = { duration: 280, easing: STATE_EASE };
    const anims = [];
    // Each numeric run («7:43») is an LTR isolate while it rolls: a slot is bidi-neutral, and inside a time that holds
    // «م» it would otherwise be ordered right to left («37:4»).
    let run = null;
    [...text].forEach((ch, i) => {
      if (!/[\d:]/.test(ch)) { run = null; el.append(ch); return; }
      if (!run) { run = document.createElement("span"); run.dir = "ltr"; el.append(run); }
      if (ch === old[i] || !/\d/.test(ch) || !/\d/.test(old[i])) { run.append(ch); return; }
      const slot = document.createElement("span"), nw = document.createElement("span"), was = document.createElement("span");
      slot.className = "roll"; was.className = "roll-old";
      nw.textContent = ch; was.textContent = old[i];
      was.setAttribute("aria-hidden", "true");
      slot.append(nw, was);
      run.append(slot);
      const d = up ? 0.78 : -0.78;
      anims.push(nw.animate([{ transform: `translateY(${d}em)` }, { transform: "none" }], timing));
      anims.push(was.animate([{ transform: "none" }, { transform: `translateY(${-d}em)` }], { ...timing, fill: "forwards" }));
    });
    Promise.all(anims.map((a) => a.finished)).then(() => { el.textContent = text; }, () => { el.textContent = text; });
  }
  // The mark's parts that change state fill (lower first when the level rises) or empty (upper first when it falls).
  function moveMark(from, to) {
    const parts = [...document.querySelectorAll("#mark .tu, #mark .sb, #mark .ds-on")];
    parts.forEach((p, i) => { p.classList.toggle("on", i <= to); p.classList.toggle("cur", i === to); });
    if (!motionOn() || from === to) return;
    const rising = to > from;
    const changed = parts.map((p, i) => ({ p, i })).filter(({ i }) => (i <= from) !== (i <= to));
    (rising ? changed : changed.reverse()).forEach(({ p }, k) => {
      const timing = { duration: 200, delay: k * 50, easing: STATE_EASE, fill: "backwards" };
      if (p.matches(".ds-on")) {
        p.animate([{ strokeDashoffset: rising ? 1 : 0 }, { strokeDashoffset: rising ? 0 : 1 }], timing);
        return;
      }
      const axis = p.matches(".sb") ? "scaleY" : "scaleX";
      p.querySelector(".fl").animate([{ transform: `${axis}(${rising ? 0 : 1})` }, { transform: `${axis}(${rising ? 1 : 0})` }], timing);
    });
  }
  function arrive(next) {
    if (STATE !== "fresh") return;
    const from = reading.band;
    Object.assign(reading, next);
    roll($("#count-n"), String(reading.count), reading.count >= next.prev);
    roll($("#time-t"), clock(reading.at), true);
    $("#band-w").textContent = L.bands[reading.band];
    $("#mark").setAttribute("aria-label", part.markName());
    moveMark(from, reading.band);
    $("#say").textContent = L.say(L.bands[reading.band], reading.count, clock(reading.at));
  }

  render();
  // The readiness signal verify-fitway waits for: the page is drawn.
  window.__public = { ready: true, arrive: (n) => arrive({ prev: reading.count, ...n }) };
  if (params.has("arrive") && STATE === "fresh") {
    const busy = params.get("arrive") === "busy";
    setTimeout(() => window.__public.arrive({ count: busy ? 52 : 39, band: busy ? 2 : reading.band, at: reading.at + 1, serverNow: reading.at + 1 }), 1500);
  }
})();
