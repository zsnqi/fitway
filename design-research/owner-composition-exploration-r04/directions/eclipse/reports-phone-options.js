/* Eclipse Reports: the phone options round (step 4). Concept only, synthetic data.
 * The user rejected phase B's phone (9309382) as compressed, not designed: 7 narrow weekday columns, one-letter Arabic
 * heads, «لا قراءات» in every column of an empty period, a cramped day table. This file draws three different answers,
 * each giving up one thing 1440 shows at once, so the user can choose:
 *   ?opt=a  The week in blocks: every day and the whole day at once, in 3-hour blocks (gives up the single hour).
 *   ?opt=b  One day at a time: a day's 19 hours as bars, chosen from a week strip (gives up the week side by side).
 *   ?opt=c  The week as a timetable: every day at every hour at true size, swiped sideways (gives up the whole day at
 *           once).
 * The pattern's option applies from 1023 px down (the tablet frame and the phone frame); the day table's from 720 px
 * down. reports.js calls in only with ?opt; without it the page is phase B's. Every number, word, date and state comes
 * from reports.js's own model and helpers (X), so the options read the same data the page does. */
(() => {
  "use strict";
  const EN = document.documentElement.lang === "en";
  const T = EN ? {
    days: "Days of the week",
    wdS: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    hours: (d, r) => `${d}: average inside by hour, ${r}`,
    openFrom: (t) => `Open from ${t}`,
    openUntil: (t) => `Open until ${t}`,
    sort: "Sort",
    sorts: { "day-desc": "Newest first", "day-asc": "Oldest first", "peak-desc": "Highest peak", "avg-desc": "Highest average", "entries-desc": "Most entries" },
    showAll: "Show all days",
    showFewer: "Show fewer",
    peakAt: (t) => `Peak ${t}`,
    measure: "Value shown",
    blockDays: "Day",
  } : {
    days: "أيام الأسبوع",
    // The calendar's short names: the weekday without its article, as a week strip or a date picker writes it.
    wdS: ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"],
    hours: (d, r) => `${d}: معدّل الموجودين حسب الساعة، ${r}`,
    openFrom: (t) => `مفتوح من ${t}`,
    openUntil: (t) => `مفتوح حتى ${t}`,
    sort: "الترتيب",
    sorts: { "day-desc": "الأحدث أولًا", "day-asc": "الأقدم أولًا", "peak-desc": "الذروة الأعلى", "avg-desc": "المعدّل الأعلى", "entries-desc": "مرات الدخول الأكثر" },
    // The card's subtitle already gives the period's length («28 يومًا»).
    showAll: "عرض كل الأيام",
    showFewer: "عرض أقل",
    peakAt: (t) => `الذروة ${t}`,
    measure: "القيمة المعروضة",
    blockDays: "اليوم",
  };
  const valueCells = (m) => m.heat.flat().filter((x) => x.state === "value");
  const hasValues = (m) => m.heat.some((r) => r.some((x) => x.state === "value"));
  const sep = `<span class="sep" aria-hidden="true">·</span>`;
  const comma = EN ? ", " : "، ";

  /* ================================================================ A. the week in blocks
   * The 19 hours in six blocks of three (the last, 9 PM to 1 AM, of four), the same boundaries as 1440's hour axis
   * (6 AM, 9 AM, 12 PM, 3 PM, 6 PM, 9 PM). A block's value is the mean of its observed minutes, as an hour's is. Its
   * closed hours are drawn as the closed tone across that share of the cell (Friday opens at 2 PM, two thirds into its
   * 12-3 PM block); hours with no readings inside a block that has values put the dotted no-readings edge on it, and the
   * readout says which. A tap, a hover or the keys open the readout: the block's own hours, one by one. */
  const BLOCKS = [[0, 2], [3, 5], [6, 8], [9, 11], [12, 14], [15, 18]];
  function block(m, wd, c0, c1) {
    const hours = [];
    let obs = 0, tot = 0, closed = 0, vals = 0, samples = Infinity;
    const missing = [];
    for (let c = c0; c <= c1; c++) {
      const h = m.heat[wd][c];
      hours.push(h);
      if (h.state === "closed") closed++;
      else if (h.state === "missing") missing.push(c);
      else { vals++; obs += h.observed; tot += h.avg * h.observed; samples = Math.min(samples, h.samples); }
    }
    const n = c1 - c0 + 1;
    let lead = 0; while (lead < n && hours[lead].state === "closed") lead++;
    let trail = 0; while (trail < n - lead && hours[n - 1 - trail].state === "closed") trail++;
    return { wd, c0, c1, n, hours, closed, missing, lead, trail, state: closed === n ? "closed" : vals ? "value" : "missing", avg: vals ? tot / obs : null, samples: vals ? samples : 0 };
  }
  // Each weekday's blocks as runs: a value block alone; closed or no-reading blocks merged.
  function blockRuns(m, wd) {
    const bs = BLOCKS.map(([a, b]) => block(m, wd, a, b)), out = [];
    for (let i = 0; i < bs.length; ) {
      let j = i;
      if (bs[i].state !== "value") while (j + 1 < bs.length && bs[j + 1].state === bs[i].state) j++;
      out.push(bs.slice(i, j + 1));
      i = j + 1;
    }
    return out;
  }
  // The missing hours as ranges: [[first, last], ...].
  const spans = (cs) => cs.reduce((o, c) => { const l = o[o.length - 1]; if (l && l[1] === c - 1) l[1] = c; else o.push([c, c]); return o; }, []);

  const A = {
    pattern: {
      heatHTML(X) {
        const { L, model: m } = X;
        if (!hasValues(m)) {
          // One message for the whole pattern, in the pattern's own no-readings mark (PAT-6): a dotted plate.
          return `<tbody><tr role="row"><td role="gridcell" class="opt-none"><p>${L.emptyTable(X.dateText(m.a, true), X.dateText(m.b, true))}</p></td></tr></tbody>`;
        }
        const b = m.busiest;
        const heads = BLOCKS.map(([a, z]) => `<th scope="col" class="bh" role="columnheader"><span class="bh-s" aria-hidden="true">${X.bdi(X.fmtHour(a * 60))}</span><span class="bh-r">${X.hourRange(a * 60, z * 60 + 60)}</span></th>`).join("");
        const rows = [0, 1, 2, 3, 4, 5, 6].map((wd) => {
          const cells = blockRuns(m, wd).map((run) => {
            const f = run[0], l = run[run.length - 1];
            const data = `data-r="${wd}" data-c0="${f.c0}" data-c1="${l.c1}"`;
            if (f.state === "value") {
              const z = f.avg === 0;
              const top = b && b.wd === wd && b.c >= f.c0 && b.c <= f.c1 ? " is-top" : "";
              const few = !z && f.samples < X.MIN_DAYS ? " few" : "";
              const pc = (f.lead ? " pcl" : "") + (f.trail ? " pct" : "");
              const part = f.missing.length ? " part" : "";
              const st = [z ? "" : `--c: rgb(${X.rampColor(f.avg).join(" ")})`, f.lead ? `--cl: ${((f.lead / f.n) * 100).toFixed(2)}%` : "", f.trail ? `--ct: ${((f.trail / f.n) * 100).toFixed(2)}%` : ""].filter(Boolean).join("; ");
              return `<td class="hc ${z ? "zero" : "v"}${few}${top}${pc}${part}" role="gridcell" tabindex="-1" ${data}${st ? ` style="${st}"` : ""}><span class="hv">${z ? "0" : X.valText(f.avg)}</span><span class="sr-only">${comma}${z ? L.emptyLong : L.levels[X.levelOf(f.avg)]}</span></td>`;
            }
            const word = f.state === "closed" ? L.closed : L.noReadings;
            // A single no-readings block is narrower than its words: the dotted edge alone, the words for assistive tech.
            const say = f.state === "missing" && run.length === 1 ? `<span class="sr-only">${word}</span>` : `<span class="run">${word}</span>`;
            return `<td class="hc ${f.state === "closed" ? "closed" : "nodata"}" role="gridcell" tabindex="-1" ${data} style="--span: ${run.length}">${say}</td>`;
          }).join("");
          return `<tr role="row"><th scope="row" class="hd" role="rowheader">${X.wdLong(wd)}</th>${cells}</tr>`;
        }).join("");
        return `<thead><tr role="row"><th scope="col" class="heat-corner" role="columnheader"><span class="sr-only">${T.blockDays}</span></th>${heads}</tr></thead><tbody>${rows}</tbody>`;
      },
      tip(td, X) {
        const { L, model: m } = X;
        const wd = +td.dataset.r, c0 = +td.dataset.c0, c1 = +td.dataset.c1;
        const k = block(m, wd, c0, c1);
        const oa = c0 + k.lead, ob = c1 - k.trail;
        const when = `<div class="tip-t"><span>${X.wdLong(wd)}</span><span aria-hidden="true">·</span><span>${X.hourRange(oa * 60, ob * 60 + 60)}</span></div>`;
        if (k.state === "closed") return `<div class="tip-t"><span>${X.wdLong(wd)}</span><span aria-hidden="true">·</span><span>${X.hourRange(c0 * 60, c1 * 60 + 60)}</span></div><div class="tip-main"><span class="tip-word">${L.closed}</span></div><div class="tip-u">${L.closedTip}</div>`;
        if (k.state === "missing") return `${when}<div class="tip-main"><span class="tip-word">${L.noReadings}</span></div>`;
        const z = k.avg === 0;
        const vals = k.hours.map((h, i) => ({ h, c: c0 + i })).filter((x) => x.h.state === "value");
        const max = Math.max(...vals.map((x) => x.h.avg));
        const hrs = vals.map(({ h, c }) => `<span class="th${h.avg === max && max > 0 ? " is-max" : ""}"><span class="th-h">${X.bdi(X.fmtHour(c * 60))}</span><span class="th-v">${X.bdi(h.avg === 0 ? "0" : X.valText(h.avg))}</span></span>`).join("");
        const gaps = spans(k.missing).map(([a, b]) => `<div class="tip-g">${X.gapNote(X.hourRange(a * 60, b * 60 + 60), L.noReadings)}</div>`).join("");
        const open = k.lead ? `<span aria-hidden="true">·</span><span>${T.openFrom(X.bdi(X.fmtHour((c0 + k.lead) * 60)))}</span>` : k.trail ? `<span aria-hidden="true">·</span><span>${T.openUntil(X.bdi(X.fmtHour((ob + 1) * 60)))}</span>` : "";
        return `${when}<div class="tip-main"><span class="tip-v">${X.bdi(z ? "0" : X.valText(k.avg))}</span><span class="tip-l">${z ? L.emptyLong : L.levels[X.levelOf(k.avg)]}</span></div>` +
          `<div class="tip-hrs">${hrs}</div>${gaps}<div class="tip-u"><span>${L.avgOf(k.samples)}</span>${open}</div>`;
      },
    },
    /* The day table, regrouped: every day and every figure on one line, the weeks as headings (their dates), so a
     * day's own cell needs only its weekday and its date's number. Sorted by a figure, the weeks fall away and each day
     * names its month again. The peak's time sits beside its value; the highest day and a camera gap fold into a line
     * under the row. */
    days: {
      render(X) {
        const { L, model: m, sort } = X;
        const t = X.$("#days-table");
        const cols = [["day", "c-day"], ["peak", "c-peak n"], ["avg", "c-avg n"], ["entries", "c-entries n"]];
        const head = cols.map(([key, cls]) => {
          const on = sort.key === key;
          return `<th scope="col" role="columnheader" class="${cls}${on ? ` is-sorted is-${sort.dir}` : ""}"${on ? ` aria-sort="${sort.dir === "desc" ? "descending" : "ascending"}"` : ""}><button class="sort" type="button" data-sort="${key}"><span>${L.cols[key]}</span>${X.ICON.sort}</button></th>`;
        }).join("");
        if (!m.withReadings) {
          t.innerHTML = `<caption class="sr-only">${L.daysCaption(X.rangeText(m.a, m.b))}</caption><thead><tr role="row">${head}</tr></thead><tbody><tr role="row" class="is-empty"><td role="cell" colspan="4"><div class="table-empty">${X.ICON.info}<p>${L.emptyTable(X.dateText(m.a, true), X.dateText(m.b, true))}</p><button class="rbtn" type="button" data-range-go="28d">${L.emptyAction}</button></div></td></tr></tbody>`;
          return;
        }
        const byDay = sort.key === "day";
        const groups = [];
        let cur = null, pre = [];
        const weekOf = (dn) => dn - X.wdOf(dn);
        const noneRow = (rangeHTML, words) => `<tr role="row" class="is-none"><td role="cell" colspan="4" class="c-none">${X.gapNote(rangeHTML, words)}</td></tr>`;
        const flushPre = () => { if (!pre.length) return; const a = Math.min(...pre.map((d) => d.dn)), b = Math.max(...pre.map((d) => d.dn)); (cur || (cur = { rows: [], days: [] })).rows.push(noneRow(X.rangeText(a, b, false), L.beforeHistory)); pre = []; };
        X.sortedDays().forEach((d) => {
          if (d.none) { pre.push(d); return; }
          flushPre();
          if (byDay && (!cur || cur.week !== weekOf(d.dn))) { cur = { week: weekOf(d.dn), rows: [], days: [] }; groups.push(cur); }
          if (!cur) { cur = { rows: [], days: [] }; groups.push(cur); }
          cur.days.push(d.dn);
          if (!d.observed) { cur.rows.push(noneRow(X.dayText(d.dn), L.noReadings)); return; }
          const top = m.top && m.top.dn === d.dn;
          const notes = d.miss.map(([a, b]) => X.gapNote(X.timeRange(a, b + 1), L.noReadings)).join("");
          const p = X.partsOf(d.dn);
          const day = byDay ? `<span class="wd">${X.wdShort(d.wd)}</span> <span class="dt">${X.bdi(p.d)}</span>` : `<span class="wd">${X.wdShort(d.wd)}</span> <span class="dt">${X.dateText(d.dn)}</span>`;
          const fold = top || notes;
          cur.rows.push(`<tr role="row" class="${[top ? "is-top" : "", fold ? "has-note" : ""].filter(Boolean).join(" ")}"><th scope="row" role="rowheader" class="c-day"><span class="dd${byDay ? " one" : ""}">${day}</span></th>` +
            `<td role="cell" class="c-peak n"><span class="pk"><span class="pv">${X.bdi(d.peak)}</span><span class="pt">${X.timeText(d.peakM)}</span></span></td>` +
            `<td role="cell" class="c-avg n">${X.bdi(Math.round(d.avg))}</td><td role="cell" class="c-entries n">${X.bdi(X.fmtInt(d.entries))}</td></tr>` +
            (fold ? `<tr role="row" class="note-row${top ? " is-top" : ""}"><td role="cell" colspan="4"><span class="opt-fold">${top ? `<span class="flag">${L.highest}</span>` : ""}${notes}</span></td></tr>` : ""));
        });
        flushPre();
        const body = groups.map((g) => {
          const h = byDay && g.days.length ? `<tr role="row" class="wk-head"><th role="rowheader" scope="rowgroup" colspan="4">${X.rangeText(Math.min(...g.days), Math.max(...g.days), false)}</th></tr>` : "";
          return `<tbody>${h}${g.rows.join("")}</tbody>`;
        }).join("");
        t.innerHTML = `<caption class="sr-only">${L.daysCaption(X.rangeText(m.a, m.b))}</caption><thead><tr role="row">${head}</tr></thead>${body}`;
      },
    },
  };

  /* ================================================================ B. one day at a time
   * A week strip (each weekday's busiest hour as a small bar in its ramp colour, so the week still reads at a glance)
   * chooses the day; its 19 hours run down the card as bars, each with its number, so nothing needs a tap to be read.
   * The bars share one scale across the week, so a quieter day looks quieter. Closed and no-reading hours are one row
   * each, in words, with their range first. An empty period is one sentence. */
  const B = {
    wd: null, key: "", X: null,
    pattern: {
      own: true,
      render(X) {
        B.X = X;
        const { L, model: m } = X;
        let host = X.$("#opt-b");
        if (!host) {
          host = document.createElement("div");
          host.id = "opt-b";
          host.className = "opt-b opt-only";
          X.$("#pattern .pattern-head").after(host);
          host.addEventListener("click", (e) => { const b = e.target.closest("[data-wd]"); if (b) B.pick(+b.dataset.wd, true); });
          host.addEventListener("keydown", (e) => {
            const b = e.target.closest("[data-wd]");
            if (!b) return;
            const fwd = X.RTL ? "ArrowLeft" : "ArrowRight", back = X.RTL ? "ArrowRight" : "ArrowLeft";
            const wd = +b.dataset.wd;
            const to = e.key === fwd || e.key === "ArrowDown" ? (wd + 1) % 7 : e.key === back || e.key === "ArrowUp" ? (wd + 6) % 7 : e.key === "Home" ? 0 : e.key === "End" ? 6 : null;
            if (to == null) return;
            e.preventDefault();
            B.pick(to, true);
          });
        }
        if (!hasValues(m)) {
          host.innerHTML = `<div class="opt-msg">${X.ICON.info}<p>${L.emptyTable(X.dateText(m.a, true), X.dateText(m.b, true))}</p></div>`;
          return;
        }
        const key = `${m.a}-${m.b}`;
        if (key !== B.key) { B.key = key; B.wd = m.busiest ? m.busiest.wd : m.top ? m.top.wd : X.wdOf(X.LAST_FULL); }
        const all = valueCells(m), max = Math.max(1, ...all.map((x) => x.avg));
        const dayMax = (wd) => { const v = m.heat[wd].filter((x) => x.state === "value").map((x) => x.avg); return v.length ? Math.max(...v) : null; };
        const strip = [0, 1, 2, 3, 4, 5, 6].map((wd) => {
          const v = dayMax(wd), on = wd === B.wd;
          const bar = v == null ? `<span class="wk-bar is-none"></span>` : `<span class="wk-bar${v === 0 ? " is-zero" : ""}" style="--h: ${(v / max).toFixed(3)}; --c: rgb(${X.rampColor(v).join(" ")})"></span>`;
          return `<button type="button" class="wk-b" role="radio" aria-checked="${on}" tabindex="${on ? 0 : -1}" data-wd="${wd}"><span class="wk-col" aria-hidden="true">${bar}</span><span class="wk-n" aria-hidden="true">${T.wdS[wd]}</span><span class="sr-only">${X.wdLong(wd)}</span></button>`;
        }).join("");
        const wd = B.wd, b = m.busiest;
        const dm = dayMax(wd);
        const rows = X.heatRuns(wd).map(([c0, c1]) => {
          const cell = m.heat[wd][c0];
          if (cell.state === "value") {
            const z = cell.avg === 0;
            const few = !z && cell.samples < X.MIN_DAYS ? " few" : "";
            const top = b && b.wd === wd && b.c === c0 ? " is-top" : "";
            const bar = z ? `<span class="hb-zero">0</span>` : `<span class="hb-bar${few}${top}" style="--w: ${(cell.avg / max).toFixed(4)}; --c: rgb(${X.rampColor(cell.avg).join(" ")})"></span><span class="hb-v${cell.avg === dm ? " is-max" : ""}">${X.bdi(X.valText(cell.avg))}</span>`;
            // On the tablet the hours stand as columns and every third hour keeps its label, as 1440's axis does.
            return `<tr role="row"${c0 % 3 === 0 ? ` class="is-tick"` : ""}><th scope="row" role="rowheader" class="hb-h">${X.bdi(X.fmtHour(c0 * 60))}</th><td role="cell" class="hb-c">${bar}<span class="sr-only">${comma}${z ? L.emptyLong : L.levels[X.levelOf(cell.avg)]}</span></td></tr>`;
          }
          const range = X.hourRange(c0 * 60, c1 * 60 + 60);
          const span = `style="--span: ${c1 - c0 + 1}"`;
          if (cell.state === "closed") return `<tr role="row" class="hb-x" ${span}><td role="cell" colspan="2"><span class="hb-run is-closed"><span class="rg">${range}</span><span class="w">${L.closed}</span></span></td></tr>`;
          return `<tr role="row" class="hb-x" ${span}><td role="cell" colspan="2"><span class="hb-run is-none">${X.gapNote(range, L.noReadings)}</span></td></tr>`;
        }).join("");
        host.innerHTML = `<div class="wk-strip" role="radiogroup" aria-label="${T.days}">${strip}</div>
          <table class="hb" role="table"><caption class="sr-only">${T.hours(X.wdLong(wd), X.plain(X.rangeText(m.a, m.b)))}</caption><tbody>${rows}</tbody></table>`;
      },
      after(X, { anyFew }) {
        // B's key: only the marks its bars carry (words name closed and no-reading hours in their rows).
        const { L, model: m } = X;
        const key = X.$("#heat-key");
        key.innerHTML = (m.busiest ? `<li><span class="k kt" aria-hidden="true"></span><span>${L.busiestKey}</span></li>` : "") +
          (anyFew ? `<li><span class="k kf" aria-hidden="true"></span><span>${L.fewKey}</span></li>` : "");
        key.toggleAttribute("data-empty", !key.innerHTML || !hasValues(m));
      },
    },
    pick(wd, focus) {
      if (wd === B.wd) return;
      B.wd = wd;
      B.pattern.render(B.X);
      if (focus) B.X.$(`#opt-b [data-wd="${wd}"]`).focus();
    },
    /* The day table as a list: a day per item, its date and its peak on the first line, its average and entries
     * under the date and the peak's time under the peak; the newest 7 first and the rest one tap away. A native
     * select sorts it (the phone's own picker). */
    expanded: false, listKey: "",
    days: {
      render(X) {
        const { L, model: m, sort } = X;
        let host = X.$("#opt-days");
        if (!host) {
          host = document.createElement("div");
          host.id = "opt-days";
          host.className = "opt-days opt-only";
          X.$("#days-wrap").prepend(host);
          host.addEventListener("change", (e) => {
            if (e.target.id !== "opt-sort") return;
            const [key, dir] = e.target.value.split("-");
            X.sort = { key, dir };
            X.renderDays();
            X.$("#opt-sort").focus();
            X.say(T.sorts[e.target.value]);
          });
          host.addEventListener("click", (e) => {
            if (e.target.closest("#opt-more")) { B.expanded = !B.expanded; X.renderDays(); X.$("#opt-more").focus(); return; }
            const go = e.target.closest("[data-range-go]");
            if (go) X.goPreset(go.dataset.rangeGo);
          });
        }
        if (!m.withReadings) {
          host.innerHTML = `<div class="table-empty">${X.ICON.info}<p>${L.emptyTable(X.dateText(m.a, true), X.dateText(m.b, true))}</p><button class="rbtn" type="button" data-range-go="28d">${L.emptyAction}</button></div>`;
          return;
        }
        const lk = `${m.a}-${m.b}`;
        if (lk !== B.listKey) { B.listKey = lk; B.expanded = false; }
        const items = [];
        let pre = [];
        const noneItem = (rangeHTML, words) => `<li class="dli is-none">${X.gapNote(rangeHTML, words)}</li>`;
        const flushPre = () => { if (!pre.length) return; const a = Math.min(...pre.map((d) => d.dn)), b = Math.max(...pre.map((d) => d.dn)); items.push(noneItem(X.rangeText(a, b, false), L.beforeHistory)); pre = []; };
        X.sortedDays().forEach((d) => {
          if (d.none) { pre.push(d); return; }
          flushPre();
          if (!d.observed) { items.push(noneItem(X.dayText(d.dn), L.noReadings)); return; }
          const top = m.top && m.top.dn === d.dn;
          const edge = sort.key === "day" && (sort.dir === "desc" ? d.wd === 0 : d.wd === 6) && d.dn !== (sort.dir === "desc" ? m.a : m.b);
          const notes = d.miss.map(([a, b]) => X.gapNote(X.timeRange(a, b + 1), L.noReadings)).join("");
          items.push(`<li class="dli${top ? " is-top" : ""}${edge ? " wk-edge" : ""}">
            <span class="dl-day">${X.dayText(d.dn)}</span>
            <span class="dl-pk"><span class="dl-pv">${X.bdi(d.peak)}</span>${top ? `<span class="flag">${L.highest}</span>` : ""}</span>
            <span class="dl-more"><span class="nw">${L.cols.avg} ${X.bdi(Math.round(d.avg))}</span>${sep}<span class="nw">${L.cols.entries} ${X.bdi(X.fmtInt(d.entries))}</span></span>
            <span class="dl-pt nw">${T.peakAt(X.timeText(d.peakM))}</span>
            ${notes ? `<span class="dl-note">${notes}</span>` : ""}</li>`);
        });
        flushPre();
        const N = 7, n = items.length, cut = !B.expanded && n > N;
        const val = `${sort.key}-${sort.dir}`;
        const opts = Object.entries(T.sorts).map(([k, v]) => `<option value="${k}"${k === val ? " selected" : ""}>${v}</option>`).join("");
        host.innerHTML = `<div class="opt-sortrow"><label class="opt-sort"><span class="sr-only">${T.sort}</span>${X.ICON.sort}<select id="opt-sort">${opts}</select></label></div>
          <ol class="day-list" id="opt-list" aria-label="${X.plain(L.daysCaption(X.rangeText(m.a, m.b)))}">${(cut ? items.slice(0, N) : items).join("")}</ol>` +
          (n > N ? `<button class="rbtn opt-more" id="opt-more" type="button" aria-expanded="${!cut}" aria-controls="opt-list">${cut ? T.showAll : T.showFewer}</button>` : "");
      },
    },
  };

  /* ================================================================ C. the week as a timetable
   * 1440's own grid at true size: a row per weekday, a column per hour, every cell 44 x 44 with its hour over it, the
   * weekday names held at the start while the hours slide under them. It opens on the busiest hour; the edges fade
   * where more hours wait. An empty period keeps the weekday column and puts one sentence across the rest. */
  const C = {
    pattern: {
      heatHTML(X) {
        const { L, model: m } = X;
        const name = (wd) => (X.RTL ? X.wdLong(wd) : `<span aria-hidden="true">${T.wdS[wd]}</span><span class="sr-only">${X.wdLong(wd)}</span>`);
        if (!hasValues(m)) {
          const rows = [0, 1, 2, 3, 4, 5, 6].map((wd) => `<tr role="row"><th scope="row" class="hd" role="rowheader">${name(wd)}</th>${wd === 0 ? `<td role="gridcell" class="opt-none" rowspan="7"><p>${L.emptyTable(X.dateText(m.a, true), X.dateText(m.b, true))}</p></td>` : ""}</tr>`).join("");
          return `<colgroup><col class="col-day"><col></colgroup><tbody>${rows}</tbody>`;
        }
        const hours = [];
        for (let c = 0; c < X.HOURS; c++) hours.push(`<th scope="col" class="hh is-shown" role="columnheader"><span class="hh-t">${X.bdi(X.fmtHour(c * 60))}</span></th>`);
        const rows = [0, 1, 2, 3, 4, 5, 6].map((wd) => `<tr role="row"><th scope="row" class="hd" role="rowheader">${name(wd)}</th>${X.heatRuns(wd).map((run) => X.heatCell(wd, run[0], run)).join("")}</tr>`).join("");
        return `<colgroup><col class="col-day">${"<col>".repeat(X.HOURS)}</colgroup><thead><tr role="row"><th scope="col" class="heat-corner" role="columnheader"><span class="sr-only">${L.dayHead}</span></th>${hours.join("")}</tr></thead><tbody>${rows}</tbody>`;
      },
      after(X) {
        const plate = X.$("#heat-plate"), wrap = X.$("#heat-scroll");
        const edges = () => {
          const max = plate.scrollWidth - plate.clientWidth, x = Math.abs(plate.scrollLeft);
          wrap.classList.toggle("more-start", x > 2);
          wrap.classList.toggle("more-end", x < max - 2);
        };
        if (!plate.dataset.optWired) {
          plate.dataset.optWired = "1";
          plate.addEventListener("scroll", () => { edges(); if (X.tipFor) X.showTip(X.tipFor); }, { passive: true });
        }
        // Open on the busiest hour (or, in a period too short to name one, the hour of the highest peak), centred in
        // the hours the window shows.
        const m = X.model;
        const at = m.busiest ? { r: m.busiest.wd, c: m.busiest.c } : m.top ? { r: m.top.wd, c: Math.floor(m.top.peakM / 60) } : null;
        plate.scrollLeft = 0;
        if (at) {
          const td = [...plate.querySelectorAll(`.hc[data-r="${at.r}"]`)].find((x) => +x.dataset.c0 <= at.c && +x.dataset.c1 >= at.c);
          const day = plate.querySelector(".hd");
          if (td && day) {
            const p = plate.getBoundingClientRect(), r = td.getBoundingClientRect(), d = day.getBoundingClientRect();
            // The window is the plate less the held weekday column.
            const winL = X.RTL ? p.left : d.right, winR = X.RTL ? d.left : p.right;
            plate.scrollLeft += (r.left + r.width / 2) - (winL + winR) / 2;
          }
        }
        edges();
      },
    },
    /* The day table, one figure at a time: the day and one figure, chosen above the table (the peak by default, with
     * its time); a quiet bar beside each number reads the period at a glance. Sort by the day or by the figure. */
    measure: "peak",
    days: {
      render(X) {
        const { L, model: m, sort } = X;
        let host = X.$("#opt-measure");
        if (!host) {
          host = document.createElement("div");
          host.id = "opt-measure";
          host.className = "opt-measure opt-only";
          X.$("#days-wrap").prepend(host);
          host.addEventListener("click", (e) => {
            const b = e.target.closest("[data-measure]");
            if (!b || b.dataset.measure === C.measure) return;
            C.measure = b.dataset.measure;
            if (X.sort.key !== "day") X.sort = { key: C.measure, dir: X.sort.dir };
            X.renderDays();
            X.$(`#opt-measure [data-measure="${C.measure}"]`).focus();
          });
        }
        const k = C.measure;
        host.innerHTML = `<div class="seg" role="group" aria-label="${T.measure}">${["peak", "avg", "entries"].map((x) => `<button class="seg-b" type="button" data-measure="${x}" aria-pressed="${x === k}">${L.cols[x]}</button>`).join("")}</div>`;
        const t = X.$("#days-table");
        const cols = [["day", "c-day"], [k, `c-${k} c-m n`]];
        const head = cols.map(([key, cls]) => {
          const on = sort.key === key;
          return `<th scope="col" role="columnheader" class="${cls}${on ? ` is-sorted is-${sort.dir}` : ""}"${on ? ` aria-sort="${sort.dir === "desc" ? "descending" : "ascending"}"` : ""}><button class="sort" type="button" data-sort="${key}"><span>${L.cols[key]}</span>${X.ICON.sort}</button></th>`;
        }).join("");
        if (!m.withReadings) {
          t.innerHTML = `<caption class="sr-only">${L.daysCaption(X.rangeText(m.a, m.b))}</caption><thead><tr role="row">${head}</tr></thead><tbody><tr role="row" class="is-empty"><td role="cell" colspan="2"><div class="table-empty">${X.ICON.info}<p>${L.emptyTable(X.dateText(m.a, true), X.dateText(m.b, true))}</p><button class="rbtn" type="button" data-range-go="28d">${L.emptyAction}</button></div></td></tr></tbody>`;
          return;
        }
        const val = (d) => (k === "peak" ? d.peak : k === "avg" ? d.avg : d.entries);
        const vmax = Math.max(1, ...m.days.filter((d) => d.observed).map(val));
        const out = [];
        let pre = [];
        const noneRow = (rangeHTML, words) => `<tr role="row" class="is-none"><td role="cell" colspan="2" class="c-none">${X.gapNote(rangeHTML, words)}</td></tr>`;
        const flushPre = () => { if (!pre.length) return; const a = Math.min(...pre.map((d) => d.dn)), b = Math.max(...pre.map((d) => d.dn)); out.push(noneRow(X.rangeText(a, b, false), L.beforeHistory)); pre = []; };
        X.sortedDays().forEach((d) => {
          if (d.none) { pre.push(d); return; }
          flushPre();
          if (!d.observed) { out.push(noneRow(X.dayText(d.dn), L.noReadings)); return; }
          const top = m.top && m.top.dn === d.dn;
          const notes = d.miss.map(([a, b]) => X.gapNote(X.timeRange(a, b + 1), L.noReadings)).join("");
          const edge = sort.key === "day" && (sort.dir === "desc" ? d.wd === 0 : d.wd === 6) && d.dn !== (sort.dir === "desc" ? m.a : m.b);
          const v = val(d);
          const shown = k === "entries" ? X.fmtInt(v) : String(Math.round(v));
          // TBL-11: the value first in the source (read first), on the numbers' right edge; then its bar, its time and its
          // flag toward the left, in both languages.
          const cell = `<span class="mv"><span class="pv">${X.bdi(shown)}</span><span class="mbar" style="--w: ${(v / vmax).toFixed(4)}" aria-hidden="true"></span>${k === "peak" ? `<span class="pt">${X.timeText(d.peakM)}</span>` : ""}${k === "peak" && top ? `<span class="flag">${L.highest}</span>` : ""}</span>`;
          out.push(`<tr role="row" class="${[top ? "is-top" : "", edge ? "wk-edge" : "", notes ? "has-note" : ""].filter(Boolean).join(" ")}"><th scope="row" role="rowheader" class="c-day">${X.dayText(d.dn)}</th><td role="cell" class="c-m n">${cell}</td></tr>` +
            (notes ? `<tr role="row" class="note-row${top ? " is-top" : ""}"><td role="cell" colspan="2">${notes}</td></tr>` : ""));
        });
        flushPre();
        t.innerHTML = `<caption class="sr-only">${L.daysCaption(X.rangeText(m.a, m.b))}</caption><thead><tr role="row">${head}</tr></thead><tbody>${out.join("")}</tbody>`;
      },
    },
  };

  window.__rpOptions = { a: A, b: B, c: C };
})();
