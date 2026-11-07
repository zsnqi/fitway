/* Eclipse Reports: the comparison with the period before. Synthetic data only; not production.
 * The comparison follows the period (the user, 2026-11-06, superseding Q3 (b)'s fixed 7 days): the chosen period
 * against the equal span just before it (28 days against the 28 before, a 3-day range against the 3 days before),
 * compared only when both spans have readings for at least 80% of their open minutes (the coverage rule; TRU-7).
 * The words and feet of the glance's two cards that follow the period (the average's line, the comparison's foot) are built here too.
 * Reports' own day model (reports.js `dayModel`) gives each day's observed and expected open minutes, its total inside
 * and its entries, and the page says whether the period ends on the edge's buffered evening (K-02, `pending`). Its own
 * module by responsibility, out of reports.js (the code-health limit on giant files). A classic script (no modules and
 * no fetch), as reports.js, so the page works from file:// too. */
(() => {
  "use strict";
  const MIN_COVERAGE = 0.8;
  // A span's readings: its observed and expected open minutes, its coverage, its average inside, its entries and the days
  // that have readings (the entries are compared per such day, so days missing before the history starts count for nothing).
  function spanMetrics(dayModel, [a, b]) {
    let observed = 0, expected = 0, total = 0, entries = 0, days = 0;
    for (let dn = a; dn <= b; dn++) { const d = dayModel(dn); observed += d.observed; expected += d.expected; total += d.total; entries += d.entries; if (d.observed) days++; }
    return { observed, expected, coverage: expected ? observed / expected : 0, avg: observed ? total / observed : null, entries, days };
  }
  // A figure's foot (reports.css .foot-stack): the real words and an unseen copy of the longest words it can hold share one cell,
  // so the foot keeps the room of the tallest at its width, in every period and every state.
  const foot = (real, ghost) => `<div class="stat-foot foot-stack"><div class="foot-real">${real}</div><div class="foot-ghost" aria-hidden="true">${ghost}</div></div>`;
  // A piece of the average's line: wraps only between pieces, never inside one (DAT-4).
  const bx = (html) => `<span class="nw bx">${html}</span>`;
  // The glance's words and feet that follow the period (reports.js passes its copy and helpers): the average's line, the
  // period alone: a preset by its segment's name, a custom period by its dates, with words in place of a dash, each date kept
  // whole (DAT-4) and the year only across a year; it wraps in its own column, only between «من 13 أغسطس» and «إلى 12 سبتمبر»
  // (reports.css .bx). Each foot keeps the room of the tallest words it can hold at its width, drawn unseen under the real ones:
  // the comparison's longest badge beside its widest change (the largest the history gives is +147%), the average's longest
  // dates. No period or state changes a card's height, and loading to loaded moves nothing.
  function glance({ L, icon, bdi, periodSentence, toDn, range }) {
    const periodLine = () => { const r = range(); return r.kind !== "custom" ? L.avgBasis.preset(r.kind) : periodSentence(r.a, r.b, L.avgBasis.span, L.avgBasis.one, false); };
    const trend = `<span class="cmp cmp-same">${icon}${L.cmp.same}</span><span class="stat-aside">${L.wowEntries(bdi("+188%"))}</span>`;
    const basis = `<span class="stat-aside avg-basis">${periodSentence(toDn("2026-08-30"), toDn("2026-09-30"), L.avgBasis.span, L.avgBasis.one, false)}</span>`;
    return { periodLine, trendFoot: (real = "") => foot(real, trend), basisFoot: (real = "") => foot(real, basis) };
  }
  // The badge's word follows the percentage the card prints (its rounded value): +5% and over is busier, -5% and under quieter.
  const kindOf = (change) => { const shown = Math.round(change); return shown >= 5 ? "busier" : shown <= -5 ? "quieter" : "same"; };
  // The period a…b (day numbers) against the n days before it. `pending`: a period that ends on the edge's buffered
  // evening is not whole until it arrives, so the comparison waits («قيد الانتظار», CRD-10's sentence); the span before
  // it never holds that evening.
  function compareFor(dayModel, a, b, pending) {
    const n = b - a + 1, span = { cur: [a, b], prev: [a - n, a - 1] };
    const cur = spanMetrics(dayModel, span.cur), prev = spanMetrics(dayModel, span.prev);
    const curOk = cur.coverage >= MIN_COVERAGE, prevOk = prev.coverage >= MIN_COVERAGE, comparable = curOk && prevOk;
    return {
      span, n, cur, prev, curOk, prevOk, comparable, pending,
      avgChange: comparable ? ((cur.avg - prev.avg) / prev.avg) * 100 : null,
      entriesChange: comparable ? ((cur.entries / cur.days - prev.entries / prev.days) / (prev.entries / prev.days)) * 100 : null,
    };
  }
  window.EclipseCompare = Object.freeze({ MIN_COVERAGE, compareFor, kindOf, foot, bx, glance });
})();
