# Owner Daily annotation + nav review — 2026-09-06 (human verdict requested)

Human-approved scope: bounded annotation-placement repair + nav Variant B.
No canonical promotion. No unrelated Owner surface touched.

## What changed (working tree, uncommitted)

- `apps/web/src/components/owner/owner-analytics-view.tsx`
  - Deleted `edgeAwareLabelTransform` (binary 25/75 snap that detached edge
    captions from their stems and collided the Latest label with gap labels).
  - New exported `clampedCaptionLeft(ratio, halfPx)`: captions stay centered
    via the stylesheet; only the anchor is clamped
    (`clamp(Hpx, P%, calc(100% - Hpx))`, margins latest 55 / gap 40 /
    tick 30) so the point's x always falls inside its own caption box.
    Direction-independent; tooltip rule untouched.
  - Data semantics, curve, marker, gap stems/bracket, table, RTL/LTR,
    keyboard, and responsive behavior unchanged.
- `apps/web/src/components/owner/reporting/owner-reporting.css`
  - Variant B per human approval: six-destination row
    `background-color: transparent` (was `#ffeef004`); divider and
    active-tab underline preserved. Nothing else in the file touched.
- `apps/web/src/components/owner/owner-analytics-view.test.tsx`: 6/6 pass.
  happy-dom cannot parse `clamp()`, so DOM assertions pin "no inline
  transform override" and the exported helper is asserted directly;
  real placement is governed in Chromium (next line).
- `tests/browser/phase9-owner-ui.browser.spec.ts`: new permanent test
  "latest-day captions stay associated …" passes — caption containment,
  marker-center-in-Latest-box, gap-midpoint-in-gap-box, desktop
  Latest/gap non-overlap, and Variant B computed-style assertions
  (transparent row, divider present, active inset underline).
- Full phase9 suite: 6/6 pass; the 7th (canonical `toHaveScreenshot`
  vs frozen REJECTED_R05) fails intentionally — no promotion authorized.
- `pnpm --filter web check-types` pass; `pnpm biome check` clean on
  touched files.

## Evidence for visual review (additive only, no manifest edit yet)

- `…/evidence/owner-daily/review-20260906/index.html` — contact sheet:
  12 Paper↔routed pairs (open / latest / selected × AR/EN × 1440/390)
  against `I89-0` frames (`ID9-0/IOF-0`, `IB4-0/IMA-0`, `IGK-0/IRQ-0`,
  `J5M-0/JE1-0`, `J3Q-0/JC5-0`, `J87-0/JGM-0`), annotation close-ups,
  and nav Variant B references (`1GIV-0`, `1GNX-0`).
- `…/evidence/owner-daily/chart-annotations-{ar,en}-{1440,390}.png`
  refreshed in place (latest state, dense mock payload).
- Temp capture spec `tests/browser/owner-daily-slice-review.spec.ts`
  (3/3 passed) removed after the run, per precedent.

## Verdicts requested

1. Annotation placement faithful in all 12 cells + close-ups.
2. Nav Variant B accepted (transparent row, divider, underline) —
   on approval this amends deviation
   `owner-shared-navigation-uniform-material` (approved in principle
   for the uniform fill) to the transparent treatment.

## Known notes (not defects in this slice)

- Mock tick times look non-monotonic (mixed historical timezones in the
  test payload); placement only is under review.
- If a future payload packs a gap bracket within one label width of the
  latest stem, two centered captions can touch — irreducible without
  leaving the anchor; no Paper frame covers that pathological case.
- Committed `evidence/owner-daily/routed-daily-*` still predate the chart
  slice (old zero-square, hatched bands, old rail copy); refresh them and
  register evidence hashes in the manifest only after this verdict.

## After approval

Commit slice files + evidence, amend the nav deviation record, refresh
the stale `routed-daily-*` captures, register candidate-evidence hashes
(no canonical promotion), then proceed to the recorded human-acceptance
→ promotion → `verify:full` → DONE sequence.
