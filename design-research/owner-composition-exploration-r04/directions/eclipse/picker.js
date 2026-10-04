/* Eclipse date picker: the one way an Owner page asks for days (DECISIONS item 32, "dates are picked, not typed").
 * Activity log's dates and Reports' custom period both open it, inside the page's own dialog (DLG-1…6; a bottom sheet
 * at 720 px and below). Concept only; not production.
 *   The owner picks a start and an end day with a finger, a mouse or the keys: the first day picked is the start, the
 *   second the end (picked earlier than the start, the two swap, so a range is never reversed); a third starts again.
 *   A start alone is a one-day range. The two ends read above the month ("From" / "To"); the end still to pick is
 *   outlined. Days the page cannot ask for (after its last day, before its first) stay in place, dimmed, and cannot be
 *   picked. Today wears today's red line (COL-13).
 *   Keys (the APG date grid): the arrows move a day and a week (the left and right arrows follow the reading line, so in
 *   Arabic the left arrow is the next day), Home and End the week's first and last day, Page Up and Page Down a month,
 *   with Shift a year; Enter or Space picks. The grid is one Tab stop; the month's name is announced when it changes,
 *   and each pick is announced in a sentence.
 *   Numbers and dates are written without Intl (Western digits, NUM-1). A classic script, so file:// works.
 * EclipsePicker.create(host, { lang, min, max, today, value, maxSpan, onChange }) returns
 *   { get(), set(value), clear(), focus(), validate(), view, picking }; days are whole-day numbers (days since 1970-01-01,
 *   gym-local calendar days). */
(() => {
  "use strict";
  const MO = {
    ar: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
    en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  };
  const MO_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const WD = {
    ar: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
    en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  };
  // The weekday heads: a word each, never one letter (the user's phone critique of 2026-10-01).
  const WD_HEAD = {
    ar: ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"],
    en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  };
  const arDays = (n) => (n === 1 ? "يوم واحد" : n === 2 ? "يومان" : n <= 10 ? `${n} أيام` : `${n} يومًا`);
  const COPY = {
    ar: {
      from: "من", to: "إلى", startDay: "يوم البداية", endDay: "يوم النهاية",
      prev: "الشهر السابق", next: "الشهر التالي",
      today: "اليوم", start: "بداية الفترة", end: "نهاية الفترة", only: "بداية الفترة ونهايتها", mid: "ضمن الفترة", off: "غير متاح",
      sayStart: (d) => `البداية ${d}. اختر يوم النهاية.`,
      sayRange: (a, b, n) => `الفترة من ${a} إلى ${b}، ${arDays(n)}.`,
      sayOne: (a) => `الفترة ${a}، يوم واحد.`,
      sayClear: "مُسحت التواريخ.",
      tooLong: (n) => `اختر ${n} يومًا أو أقل`,
    },
    en: {
      from: "From", to: "To", startDay: "Start day", endDay: "End day",
      prev: "Previous month", next: "Next month",
      today: "today", start: "start of the range", end: "end of the range", only: "start and end of the range", mid: "in the range", off: "unavailable",
      sayStart: (d) => `Start ${d}. Now choose the end day.`,
      sayRange: (a, b, n) => `From ${a} to ${b}, ${n} ${n === 1 ? "day" : "days"}.`,
      sayOne: (a) => `${a}, one day.`,
      sayClear: "Dates cleared.",
      tooLong: (n) => `Choose ${n} days or fewer`,
    },
  };
  const ICON = {
    chev: '<svg class="mirror" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14.5 6.5 9 12l5.5 5.5"/></svg>',
    chevNext: '<svg class="mirror" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9.5 6.5 15 12l-5.5 5.5"/></svg>',
    alert: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.4"/><path d="M12 7.6v5.4M12 16.2v.2"/></svg>',
  };
  const partsOf = (dn) => { const d = new Date(dn * 864e5); return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), wd: d.getUTCDay() }; };
  const dnOf = (y, m, d) => Date.UTC(y, m, d) / 864e5;
  const monthLen = (y, m) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const addMonths = (dn, k) => { const p = partsOf(dn); const t = p.m + k, y = p.y + Math.floor(t / 12), m = ((t % 12) + 12) % 12; return dnOf(y, m, Math.min(p.d, monthLen(y, m))); };
  let seq = 0;

  function create(host, opts) {
    const lang = opts.lang === "en" ? "en" : "ar", RTL = lang === "ar", C = COPY[lang];
    const min = opts.min, max = opts.max, today = opts.today, maxSpan = opts.maxSpan || null;
    const yearNow = partsOf(today).y;
    const id = `dp${++seq}`;
    const bdi = (s) => `<bdi>${s}</bdi>`;
    // "16 سبتمبر" / "16 Sep", the year only outside the current year (OWN-A4's rule); the full form for speech.
    const short = (dn) => { const p = partsOf(dn); return RTL ? `${bdi(p.d)} ${MO.ar[p.m]}${p.y !== yearNow ? ` ${bdi(p.y)}` : ""}` : `${p.d} ${MO_SHORT[p.m]}${p.y !== yearNow ? ` ${p.y}` : ""}`; };
    const full = (dn) => { const p = partsOf(dn); return RTL ? `${WD.ar[p.wd]} ${p.d} ${MO.ar[p.m]} ${p.y}` : `${WD.en[p.wd]}, ${p.d} ${MO.en[p.m]} ${p.y}`; };
    const spoken = (dn) => { const p = partsOf(dn); return RTL ? `${p.d} ${MO.ar[p.m]} ${p.y}` : `${p.d} ${MO.en[p.m]} ${p.y}`; };
    const clamp = (dn) => Math.min(max, Math.max(min, dn));

    // The pick: a (start), b (end, null while the end is still to pick), and which end the next pick sets.
    const st = { a: null, b: null, picking: "start", hover: null, focus: null, vy: 0, vm: 0, error: "" };

    host.classList.add("dp");
    host.innerHTML = `
      <div class="dp-ends">
        <p class="dp-end" data-end="a"><span class="dp-end-l">${C.from}</span><span class="dp-end-v"></span></p>
        <p class="dp-end" data-end="b"><span class="dp-end-l">${C.to}</span><span class="dp-end-v"></span></p>
      </div>
      <p class="dp-err" id="${id}-err" hidden></p>
      <div class="dp-nav">
        <h3 class="dp-month" id="${id}-month" aria-live="polite"></h3>
        <div class="dp-arrows">
          <button class="icon-btn dp-step" type="button" data-step="-1" aria-label="${C.prev}">${ICON.chev}</button>
          <button class="icon-btn dp-step" type="button" data-step="1" aria-label="${C.next}">${ICON.chevNext}</button>
        </div>
      </div>
      <table class="dp-grid" role="grid" aria-labelledby="${id}-month" aria-describedby="${id}-err">
        <thead><tr>${WD_HEAD[lang].map((w, i) => `<th scope="col" abbr="${WD[lang][i]}"><span aria-hidden="true">${w}</span></th>`).join("")}</tr></thead>
        <tbody></tbody>
      </table>
      <p class="sr-only dp-say" aria-live="polite" aria-atomic="true"></p>`;
    const $ = (s) => host.querySelector(s);
    const tbody = $("tbody"), monthEl = $(".dp-month"), sayEl = $(".dp-say"), errEl = $(".dp-err");
    const ends = { a: $('[data-end="a"]'), b: $('[data-end="b"]') };
    const steps = [...host.querySelectorAll(".dp-step")];
    let cells = new Map();

    const say = (t) => { sayEl.textContent = ""; requestAnimationFrame(() => { sayEl.textContent = t; }); };
    const setView = (dn) => { const p = partsOf(dn); st.vy = p.y; st.vm = p.m; };
    const viewKey = () => st.vy * 12 + st.vm;
    const keyOf = (dn) => { const p = partsOf(dn); return p.y * 12 + p.m; };

    // One month: six rows always, so the sheet never changes height between months; days of other months stay empty.
    function build() {
      const first = dnOf(st.vy, st.vm, 1), lead = partsOf(first).wd, len = monthLen(st.vy, st.vm);
      let html = "";
      for (let r = 0; r < 6; r++) {
        html += "<tr>";
        for (let c = 0; c < 7; c++) {
          const day = r * 7 + c - lead + 1;
          if (day < 1 || day > len) { html += '<td class="dp-gap"></td>'; continue; }
          const dn = first + day - 1;
          html += `<td data-c="${c}"><button class="dp-day" type="button" tabindex="-1" data-dn="${dn}"><span class="dp-n">${day}</span></button></td>`;
        }
        html += "</tr>";
      }
      tbody.innerHTML = html;
      cells = new Map([...tbody.querySelectorAll(".dp-day")].map((b) => [Number(b.dataset.dn), b]));
      monthEl.innerHTML = `${MO[lang][st.vm]} ${bdi(st.vy)}`;
      steps[0].setAttribute("aria-disabled", String(viewKey() <= keyOf(min)));
      steps[1].setAttribute("aria-disabled", String(viewKey() >= keyOf(max)));
    }

    // Each day's look and its name: the chosen ends (a chalk tile), the days between (a band), and while the end is still
    // to pick, the range the pointer or the focus would make (a fainter band, the end outlined).
    function paint() {
      const { a, b } = st;
      const len = monthLen(st.vy, st.vm), first = dnOf(st.vy, st.vm, 1);
      let lo = null, hi = null, soft = false, ghost = null;
      if (a != null && b != null) { lo = a; hi = b; }
      else if (a != null && st.hover != null && st.hover !== a && st.hover >= min && st.hover <= max) {
        lo = Math.min(a, st.hover); hi = Math.max(a, st.hover); soft = true; ghost = st.hover;
      }
      for (const [dn, btn] of cells) {
        const off = dn < min || dn > max;
        const isA = dn === a, isB = b != null && dn === b;
        const inBand = lo != null && lo !== hi && dn >= lo && dn <= hi;
        const td = btn.parentElement, col = Number(td.dataset.c), day = dn - first + 1;
        const cls = ["dp-day"];
        if (off) cls.push("is-off");
        if (dn === today) cls.push("is-today");
        if (isA || isB) cls.push("is-end");
        if (dn === ghost) cls.push("is-ghost");
        if (inBand) {
          cls.push(soft ? "band-soft" : "band");
          cls.push(dn === lo ? "band-from" : dn === hi ? "band-to" : "band-mid");
          // The band rounds where a row or the month ends.
          if (dn !== lo && (col === 0 || day === 1)) cls.push("r-s");
          if (dn !== hi && (col === 6 || day === len)) cls.push("r-e");
        }
        btn.className = cls.join(" ");
        const chosen = a != null && (b != null ? dn >= a && dn <= b : dn === a);
        td.setAttribute("aria-selected", String(chosen));
        const words = [full(dn)];
        if (dn === today) words.push(C.today);
        if (isA && (b == null || a === b)) words.push(b == null ? C.start : C.only);
        else if (isA) words.push(C.start);
        else if (isB) words.push(C.end);
        else if (chosen) words.push(C.mid);
        if (off) words.push(C.off);
        btn.setAttribute("aria-label", words.join(RTL ? "، " : ", "));
        btn.setAttribute("aria-disabled", String(off));
        btn.tabIndex = dn === st.focus ? 0 : -1;
      }
      // The ends above the month: the date, or the end still to pick, outlined.
      const val = (el, dn, ph) => { el.querySelector(".dp-end-v").innerHTML = dn == null ? ph : short(dn); el.classList.toggle("is-empty", dn == null); };
      val(ends.a, a, C.startDay);
      val(ends.b, b, C.endDay);
      ends.a.classList.toggle("is-wait", a == null);
      ends.b.classList.toggle("is-wait", a != null && b == null);
      errEl.hidden = !st.error;
      errEl.innerHTML = st.error ? `${ICON.alert}<span>${st.error}</span>` : "";
      host.dataset.picking = st.picking;
    }

    function goTo(dn, focus = true) {
      st.focus = clamp(dn);
      if (keyOf(st.focus) !== viewKey()) { setView(st.focus); build(); }
      paint();
      if (focus) cells.get(st.focus)?.focus();
    }
    function pick(dn) {
      if (dn < min || dn > max) return;
      st.error = "";
      if (st.picking === "start") {
        st.a = dn; st.b = null; st.picking = "end";
        say(C.sayStart(spoken(dn)));
      } else {
        if (dn < st.a) { st.b = st.a; st.a = dn; } else st.b = dn;
        st.picking = "start";
        const n = st.b - st.a + 1;
        say(n === 1 ? C.sayOne(spoken(st.a)) : C.sayRange(spoken(st.a), spoken(st.b), n));
      }
      st.focus = dn;
      st.hover = null;
      paint();
      opts.onChange?.(api.get());
    }

    tbody.addEventListener("click", (e) => {
      const btn = e.target.closest(".dp-day");
      if (!btn || btn.getAttribute("aria-disabled") === "true") return;
      pick(Number(btn.dataset.dn));
    });
    // The range the next pick would make follows the pointer (mouse only; a touch has no hover) and the keyboard focus.
    tbody.addEventListener("pointerover", (e) => {
      if (e.pointerType !== "mouse") return;
      const btn = e.target.closest(".dp-day");
      const h = btn ? Number(btn.dataset.dn) : null;
      if (h !== st.hover) { st.hover = h; if (st.picking === "end") paint(); }
    });
    tbody.addEventListener("pointerleave", () => { st.hover = host.contains(document.activeElement) && document.activeElement.classList.contains("dp-day") ? st.focus : null; if (st.picking === "end") paint(); });
    tbody.addEventListener("focusin", (e) => {
      const btn = e.target.closest(".dp-day");
      if (!btn) return;
      st.focus = Number(btn.dataset.dn);
      st.hover = st.focus;
      paint();
    });
    tbody.addEventListener("keydown", (e) => {
      if (!e.target.closest(".dp-day")) return;
      const d = st.focus, wd = partsOf(d).wd;
      let to = null;
      switch (e.key) {
        case "ArrowLeft": to = d + (RTL ? 1 : -1); break;
        case "ArrowRight": to = d + (RTL ? -1 : 1); break;
        case "ArrowUp": to = d - 7; break;
        case "ArrowDown": to = d + 7; break;
        case "Home": to = d - wd; break;
        case "End": to = d + 6 - wd; break;
        case "PageUp": to = addMonths(d, e.shiftKey ? -12 : -1); break;
        case "PageDown": to = addMonths(d, e.shiftKey ? 12 : 1); break;
        default: return;
      }
      e.preventDefault();
      goTo(to);
    });
    steps.forEach((s) => s.addEventListener("click", () => {
      if (s.getAttribute("aria-disabled") === "true") return;
      const k = Number(s.dataset.step);
      const t = st.vm + k;
      st.vy += Math.floor(t / 12); st.vm = ((t % 12) + 12) % 12;
      // The grid's one Tab stop follows the month shown: the same day, within the month and the days that can be picked.
      const p = partsOf(st.focus ?? max);
      st.focus = clamp(dnOf(st.vy, st.vm, Math.min(p.d, monthLen(st.vy, st.vm))));
      if (keyOf(st.focus) !== viewKey()) { setView(st.focus); }
      build();
      paint();
    }));

    const api = {
      get() { return st.a == null ? null : { a: st.a, b: st.b ?? st.a }; },
      set(v) {
        st.a = v ? v.a : null; st.b = v ? v.b : null; st.picking = "start"; st.hover = null; st.error = "";
        // Open on the end's month (the latest chosen day), or today's (the last day that can be picked).
        st.focus = clamp(v ? v.b : max);
        setView(st.focus); build(); paint();
      },
      clear() {
        st.a = null; st.b = null; st.picking = "start"; st.error = "";
        paint();
        say(C.sayClear);
        opts.onChange?.(null);
      },
      focus() { cells.get(st.focus)?.focus(); },
      // At the dialog's submit: { a, b }, { empty: true }, or { error } with the message shown and announced.
      validate() {
        const v = api.get();
        if (!v) return { empty: true };
        if (maxSpan && v.b - v.a + 1 > maxSpan) { st.error = C.tooLong(maxSpan); paint(); return { error: st.error }; }
        return v;
      },
      get view() { return { y: st.vy, m: st.vm }; },
      get picking() { return st.picking; },
      host,
    };
    api.set(opts.value || null);
    return api;
  }
  window.EclipsePicker = { create };
})();
