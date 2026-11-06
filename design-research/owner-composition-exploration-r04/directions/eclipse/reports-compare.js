/* Eclipse Reports: the comparison with the period before. Synthetic data only; not production.
 * The comparison follows the period (the user, 2026-11-06, superseding Q3 (b)'s fixed 7 days): the chosen period
 * against the equal span just before it (28 days against the 28 before, a 3-day range against the 3 days before),
 * compared only when both spans have readings for at least 80% of their open minutes (the coverage rule; TRU-7).
 * Reports' own day model (reports.js `dayModel`) gives each day's observed and expected open minutes, its total inside
 * and its entries, and the page says whether the period ends on the edge's buffered evening (K-02, `pending`). Its own
 * module by responsibility, out of reports.js (the code-health limit on giant files). A classic script (no modules and
 * no fetch), as reports.js, so the page works from file:// too. */
(() => {
  "use strict";
  const MIN_COVERAGE = 0.8;
  // A span's readings: its observed and expected open minutes, its coverage, its average inside and its entries.
  function spanMetrics(dayModel, [a, b]) {
    let observed = 0, expected = 0, total = 0, entries = 0;
    for (let dn = a; dn <= b; dn++) { const d = dayModel(dn); observed += d.observed; expected += d.expected; total += d.total; entries += d.entries; }
    return { observed, expected, coverage: expected ? observed / expected : 0, avg: observed ? total / observed : null, entries };
  }
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
      entriesChange: comparable ? ((cur.entries - prev.entries) / prev.entries) * 100 : null,
    };
  }
  window.EclipseCompare = Object.freeze({ MIN_COVERAGE, compareFor });
})();
