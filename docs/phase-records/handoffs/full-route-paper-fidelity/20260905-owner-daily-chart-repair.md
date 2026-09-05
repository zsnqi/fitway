# Owner Daily chart repair — 2026-09-05 (chart slice only)

Human-locked decisions implemented against Paper authority
`FITWAY UX Exploration / Page 1 / OWNER DAILY ANALYTICS PRODUCTION SET — CURRENT`
(area `I89-0`), with behavior authority from SPEC / DESIGN_GUIDE §12.
REJECTED_R05 was not used as authority anywhere in this slice.

## Changes (all inside the chart slice)

- `apps/web/src/components/owner/owner-analytics-view.tsx`
  - Removed the `owner-chart__zero` hollow-square marker entirely.
  - Latest-day detection (`isCurrentBusinessDay`, gym-zone calendar date vs
    `daily.businessDay`; unresolvable zone degrades to completed presentation):
    latest days rest the marker on the latest real reading (not the peak) with
    a dashed stem and a visible `{latest} {time}` annotation
    (`Latest 3:07 AM` / `آخر قراءة 3:07 ص`), matching Paper's in-progress frames.
  - Explicit selection (hover/touch/arrow/Home/End) sets `hasSelected` and
    exposes a visible `owner-chart-tip` card (`3:07 AM` / `≈57 present`,
    `5:00 م` / `نحو 30 حاضرًا` in Arabic — exact Paper copy) with edge-aware
    anchoring. Pristine completed days show ring-only on the peak (no stem, no
    tooltip), matching Paper's closed frames. The sr-only live region still
    announces every selection change.
  - No observation moved, fabricated, or hidden: zero renders as the line at
    the zero ordinate, missing/closed render as interior dashed-stem gaps with
    the desktop bracket treatment, and the semantic table is unchanged.
- `apps/web/src/components/owner/owner-analytics.css`
  - Deleted the zero-square rules; replaced the dead `.owner-chart-reading`
    block with `.owner-chart-tip` (Paper dark-card treatment) and added
    `.owner-chart__latest` (gap-label typography).
  - Mobile (≤720px): gap bracket, end ticks, and duration label are
    `display:none`; dashed stems stay visible — Paper mobile shows stems only.
    Desktop gap treatment is unchanged.
- `apps/web/src/components/owner/messages.ts`: added `latest`,
  `presentPrefix`, `presentSuffix` (EN/AR Paper wording). `legendZero` copy
  key is retained unused; it requires no chart glyph.
- `apps/web/src/components/owner/owner-analytics-view.test.tsx`: zero marker
  asserted absent; pristine/selected/latest/fallback states covered (6 tests).
- `tests/browser/phase9-owner-ui.browser.spec.ts`: zero asserted absent;
  pristine completed state asserted (no stem/label/tooltip); tooltip asserted
  after selection; per-width computed-display assertions for the mobile
  stems-only rule (SVG lines have empty geometric boxes, so visibility
  assertions cannot observe them).
- `.../deviations/owner-daily-bounded-truthful-curve.yaml` (worktree-local):
  corrected marker size to the implemented/tested 20px desktop / 18px mobile.

## Verification

- Unit: `owner-analytics-view.test.tsx` 6/6 pass.
- `pnpm --filter web check-types`: pass. `pnpm biome check` on all touched
  files: clean.
- Browser `phase9-owner-ui.browser.spec.ts`: 5/6 pass. The single failure is
  the pre-existing intentional `toHaveScreenshot` comparison against the
  frozen REJECTED_R05 canonical baseline (`owner-daily-route-ar-desktop…`);
  no baseline promotion is authorized in this slice, so it stays failing.
- Fresh routed evidence (current implementation, mock analytics payload):
  `visual-direction-gate/approved/paper-route-authority-20260902/evidence/owner-daily/chart-repair-{latest-{ar,en}-{1440,390},selected-en-{1440,390}}.png`.
  Additive only — no manifest edit, no canonical promotion.
- Temporary evidence spec `tests/browser/owner-daily-chart-repair.review.spec.ts`
  was removed after the run (2/2 passed).

## Addendum — marker core concentricity (same day, chart-marker boundary)

- Defect: the solid core (`.owner-chart__active::after`) was positioned with
  `inset-inline-start: 50%` + `translate(-50%, -50%)`. In RTL that resolves to
  the right edge at center and decenters the core by half its own size
  (2.5px desktop / 2px mobile), so every Arabic render showed a malformed,
  off-center dot against Paper's concentric marker.
- Fix (`owner-analytics.css` only): physical `top: 50%; left: 50%` — centering
  geometry is direction-invariant and must not use logical insets. LTR
  rendering is pixel-identical; RTL is corrected. Ring size/stroke/field
  unchanged.
- Governing check: `phase9-owner-ui.browser.spec.ts` responsive test now
  asserts the core center coincides with the ring center (≤1px) in both
  directions at every required width — 18 marker checks + axe pass.
- Fresh evidence: `evidence/owner-daily/chart-marker-{ar,en}-{1440,390}.png`
  (additive). Temporary marker spec removed after its pass.
- Noticed but out of scope (chart-marker boundary): the centered Latest/duration
  annotations can clip at the plot's extreme edge (visible on mobile RTL where
  the latest point sits at the visual edge). Left untouched for a later slice.

## Addendum — annotation edge anchoring (same day, annotation-clipping boundary)

- Defect: Latest, gap-duration, and x-axis tick labels all used unconditional
  `translateX(-50%)` centering, so any annotation near 0%/100% overflowed the
  plot — worst for the Latest label on mobile RTL (latest reading at the
  visual edge) and the first/last x-ticks at every width.
- Fix (`owner-analytics-view.tsx` only, no CSS/geometry/data change): shared
  `edgeAwareLabelTransform` helper — center mid-plot, anchor to the point
  (`translate(0,0)` / `translate(-100%,0)`) past the 25/75 marks, mirroring the
  approved tooltip rule. Physical X transforms, direction-independent; mid-plot
  rendering (including desktop gap brackets) is pixel-identical to before.
- Governing checks: unit asserts edge-anchored Latest vs centered gap label;
  temporary browser spec asserted every visible annotation's box stays inside
  the chart panel (AR/EN × 1440/390) — passed, then removed.
- Fresh evidence: `evidence/owner-daily/chart-annotations-{ar,en}-{1440,390}.png`
  (additive). Chart geometry, marker, gap treatment, tooltip, RTL/LTR, and
  responsive compositions otherwise preserved.

## Open for human review

- Fresh `chart-repair-*` captures vs Paper `I91-0/IB4-0/IGK-0` (desktop) and
  `J1W-0/J3Q-0/J87-0` (mobile) states.
- Canonical baseline promotion remains explicitly out of scope.
