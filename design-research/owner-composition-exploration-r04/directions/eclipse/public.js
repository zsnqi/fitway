/* FITWAY public crowd page, public-redesign-r01 direction 2: the day's timetable. Concept only, synthetic data.
 *
 * The page is today's timetable at the gym, read top to bottom from opening to closing like a prayer-times board.
 * The hours already gone are folded into a dim strip; the current hour is the one lit row and opens into the answer
 * (the band word, the approximate count, the percentage, the last reading); the hours still to come carry the usual
 * crowd. One grid holds every part, so the level mark's four cells stand on the same four band columns the usual
 * curve runs through.
 *
 * Truth: the mark comes from the band only (four whole cells, never the percentage), its written word is always
 * shown, it fills in reading direction, has one accessible name and hides its parts. The percentage is a separate
 * figure and the page reads whole without it (?pct=off). Times are gym time (Riyadh), 12-hour with «ص/م», Western
 * digits. Every value below is a fixture, not measured FITWAY truth. */
(() => {
  "use strict";
  const root = document.documentElement;
  const en = root.lang === "en";
  const params = new URLSearchParams(location.search);

  // Synthetic fixtures, all in gym time. A Wednesday evening: the gym opens at 6:00 AM and closes at 1:00 AM; the
  // live reading arrived at 7:41 PM and the page is read at 7:42 PM. 70 inside of a hidden 120 is 58%, which is Busy.
  const DAY = {
    open: 6, // hour the gym opens
    close: 25, // hour it closes: 1:00 AM, the next morning
    // Usual crowd on Wednesdays, percent, on each hour from 6:00 AM (index 0) to 1:00 AM (index 19).
    usual: [8, 18, 22, 20, 16, 14, 12, 11, 13, 17, 24, 33, 44, 54, 66, 78, 70, 46, 26, 10],
  };
  const NOW = { at: 19 * 60 + 42 };
  const READING = { at: 19 * 60 + 41, count: 70, pct: 58 };
  // Bands: Quiet below 25, Moderate 25-49, Busy 50-74, Packed 75 and over.
  const bandOf = (pct) => (pct < 25 ? 0 : pct < 50 ? 1 : pct < 75 ? 2 : 3);
  READING.band = bandOf(READING.pct);

  const STR = {
    ar: {
      langName: "English", langOther: "en",
      open: "مفتوح", until: (t) => `حتى ${t}`,
      bands: ["هادئ", "متوسط", "مزدحم", "شديد الازدحام"],
      now: "الازدحام الآن",
      count: "داخل الصالة الآن · تقريبًا",
      pct: "من السعة",
      last: "آخر قراءة",
      live: "مباشر",
      mark: (b) => `مستوى الازدحام: ${b}`,
      usual: "الازدحام المعتاد أيام الأربعاء",
      hour: "الساعة", usualCol: "المعتاد",
      closes: "يغلق",
      am: "ص", pm: "م",
    },
    en: {
      langName: "العربية", langOther: "ar",
      open: "Open", until: (t) => `until ${t}`,
      bands: ["Quiet", "Moderate", "Busy", "Packed"],
      now: "Crowd now",
      count: "Inside now · approx.",
      pct: "of capacity",
      last: "Last reading",
      live: "Live",
      mark: (b) => `Crowd level: ${b}`,
      usual: "Usual crowd on Wednesdays",
      hour: "Hour", usualCol: "Usual",
      closes: "Closes",
      am: "AM", pm: "PM",
    },
  };
  const L = STR[en ? "en" : "ar"];

  // A 12-hour time in gym time, Western digits, «ص/م» or AM/PM. Minutes may pass midnight (1:00 AM is 25 * 60).
  const clock = (min) => {
    const h = Math.floor(min / 60) % 24, m = String(min % 60).padStart(2, "0");
    return `${h % 12 || 12}:${m} ${h < 12 ? L.am : L.pm}`;
  };
  const t = (min, cls = "") => `<bdi class="num${cls ? ` ${cls}` : ""}">${clock(min)}</bdi>`;

  /* ---- the usual curve: a monotone cubic through the hourly points (Fritsch-Carlson), so it never overshoots below
   * zero or above a peak the data does not have. x is percent of the band area, from the reading start. */
  const curve = (() => {
    const y = DAY.usual, n = y.length, d = [], m = [];
    for (let i = 0; i < n - 1; i++) d.push(y[i + 1] - y[i]);
    m[0] = d[0];
    m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
    for (let i = 0; i < n - 1; i++) {
      if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
      const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
      if (s > 9) { const k = 3 / Math.sqrt(s); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; }
    }
    return (hour) => {
      const x = Math.min(Math.max(hour - DAY.open, 0), n - 1);
      const i = Math.min(Math.floor(x), n - 2), u = x - i;
      const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u;
      const h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
      return h00 * y[i] + h10 * m[i] + h01 * y[i + 1] + h11 * m[i + 1];
    };
  })();

  // One hour's piece of the curve, drawn in its own row: x across 0-100, y down 0-1. Pieces meet exactly at the hour
  // lines, so the rows build one continuous curve whatever their heights. Drawn left to right and mirrored in Arabic.
  const piece = (hour) => {
    const pts = [];
    for (let k = 0; k <= 12; k++) pts.push([curve(hour + k / 12), k / 12]);
    const line = pts.map(([x, yy], k) => `${k ? "L" : "M"}${x.toFixed(2)} ${yy.toFixed(4)}`).join("");
    const area = `M0 0${pts.map(([x, yy]) => `L${x.toFixed(2)} ${yy.toFixed(4)}`).join("")}L0 1Z`;
    return `<svg class="seg" viewBox="0 0 100 1" preserveAspectRatio="none" aria-hidden="true" focusable="false">`
      + `<path class="seg-area" d="${area}"/><path class="seg-line" d="${line}"/></svg>`;
  };

  const nowHour = Math.floor(NOW.at / 60);
  const hours = (from, to) => Array.from({ length: Math.max(to - from, 0) }, (_, i) => from + i);
  const pastHours = hours(DAY.open, nowHour);
  const nextHours = hours(nowHour + 1, DAY.close);

  // The hours gone: a dim strip, labelled every third hour (the opening included).
  const pastRow = (h) => {
    const label = (h - DAY.open) % 3 === 0 ? `<span class="hr-t">${t(h * 60)}</span>` : "";
    return `<div class="hr hr-past">${label}<span class="plot">${piece(h)}</span></div>`;
  };
  // The hours to come: one ruled row each, its time on the hour line.
  const nextRow = (h) => `<div class="hr hr-next"><span class="hr-t">${t(h * 60)}</span><span class="plot">${piece(h)}</span></div>`;
  // The closing line: the curve ends on it.
  const closeRow = `<div class="hr hr-close"><span class="hr-t">${t(DAY.close * 60)}</span><span class="plot"><span class="hr-w">${L.closes}</span></span></div>`;

  const word = L.bands[READING.band];
  const cells = L.bands.map((b, i) => {
    const state = i < READING.band ? "done" : i === READING.band ? "cur" : "next";
    return `<span class="cell is-${state}"><i class="cell-bar"></i><span class="cell-w">${b}</span></span>`;
  }).join("");

  // The accessible equivalent of the curve: every hour and its usual band, in words.
  const table = `<table class="sr-only"><caption>${L.usual}</caption><thead><tr><th scope="col">${L.hour}</th><th scope="col">${L.usualCol}</th></tr></thead><tbody>${
    hours(DAY.open, DAY.close).map((h) => `<tr><th scope="row">${t(h * 60)}</th><td>${L.bands[bandOf(DAY.usual[h - DAY.open])]}</td></tr>`).join("")
  }</tbody></table>`;

  const day = document.getElementById("day");
  day.innerHTML = `
    <section class="gym" aria-labelledby="gym">
      <h1 class="sr-only" id="gym">FITWAY</h1>
      <p class="gym-o"><span class="gym-ow">${L.open}</span> ${L.until(t(DAY.close * 60))}</p>
    </section>
    <section class="answer" aria-label="${L.now}">
      <p class="word">${word}</p>
      <div class="figs">
        <p class="fig fig-count"><bdi class="num fig-n">${READING.count}</bdi><span class="fig-l">${L.count}</span></p>
        <p class="fig fig-pct"><bdi class="num fig-n">${READING.pct}%</bdi><span class="fig-l">${L.pct}</span></p>
      </div>
    </section>
    <div class="reading">
      <p class="rd"><span class="rd-l">${L.last}</span> ${t(READING.at, "rd-t")}</p>
      <p class="live"><i class="dot" aria-hidden="true"></i>${L.live}</p>
    </div>
    <div class="mark" role="img" aria-label="${L.mark(word)}"><span class="mark-in" aria-hidden="true">${cells}</span></div>
    <p class="cap" aria-hidden="true">${L.usual}</p>
    <div class="past" aria-hidden="true">${pastHours.map(pastRow).join("")}</div>
    <div class="horizon" aria-hidden="true"><i class="atm"></i><i class="spill"></i><i class="rim"></i></div>
    <div class="next" aria-hidden="true">${nextHours.map(nextRow).join("")}${closeRow}</div>
    ${table}
    <svg class="defs" aria-hidden="true" focusable="false"><defs>
      <linearGradient id="usual-fill" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="0">
        <stop offset="0" stop-color="#4d0713" stop-opacity=".5"/><stop offset="1" stop-color="#e51935" stop-opacity=".42"/>
      </linearGradient></defs></svg>`;

  // The language switch names the other language in that language, so its visible words are its name.
  const lang = document.getElementById("lang");
  const glyph = document.getElementById("lang-glyph");
  glyph.textContent = L.langName;
  glyph.lang = L.langOther;
  lang.addEventListener("click", () => {
    const u = new URL(location.href);
    u.searchParams.set("lang", en ? "ar" : "en");
    location.href = u.toString();
  });
  document.title = "FITWAY";
  // The page is complete at first paint; the capture tools wait on this.
  window.__public = { ready: true };
})();
