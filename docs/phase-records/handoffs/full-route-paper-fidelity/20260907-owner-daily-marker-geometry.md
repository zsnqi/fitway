# Owner Daily marker-geometry closure — 20260907 (fidelity correction slice)

Human-directed defect against Paper authority
`FITWAY UX Exploration / Page 1 / OWNER DAILY ANALYTICS PRODUCTION SET — CURRENT`
(area `I89-0`): the chart line continued through the highlighted marker ring
toward the solid core. Paper terminates the line at the OUTER edge of the ring.
REJECTED_R05 was not used as authority anywhere in this slice. The approved
Owner navigation treatment (transparent Variant B) and Owner Daily visual
direction were treated as accepted; no settled visual decision was reopened.

## Slice files (this session only; the wider tree carries the milestone's prior uncommitted work)

- `apps/web/src/components/owner/owner-analytics-view.tsx`
  - New exported `markerExitPoint` / `trimActiveRun` (+ `OWNER_CHART_MARKER_OUTER_PX_*`
    constants): the active value run is redrawn as up to two subpaths whose ends
    sit exactly on the marker ellipse. The fixed CSS-pixel outer radius (10px
    desktop / 9px mobile, border-box) is converted to viewBox units from the
    measured plot box (ResizeObserver), so the cutout is pixel-exact at every
    width in RTL and LTR; breakpoint-matched estimates cover the first frame.
  - The active stem now drops from the ring's outer bottom edge
    (`yFor + markerRy`), omitted only when the reading rests on the baseline.
  - A lone active reading draws no line (the HTML core already marks it);
    idle solo dots, other runs, `smoothPath` bounds, gap stems/brackets/ticks,
    Latest/selected/tooltip/keyboard/RTL/responsive behavior, and ring/core
    anatomy are unchanged. Trimmed endpoints interpolate true observations, so
    the bounded truthful-curve deviation still holds and no value moves.
- `apps/web/src/components/owner/owner-analytics-view.test.tsx`: 6 new
  marker-geometry tests (axis/diagonal/on-edge exits, degenerate rejections,
  interior/end splits, hidden-neighbor walk, rendered line-to-center clearance
  plus stem-from-ring assertion); pristine counts updated (active solo draws
  nothing: 1 line / 1 solo).
- `tests/browser/phase9-owner-ui.browser.spec.ts`: pristine counts (2 lines /
  0 solo / 0 trimmed); interior selection (31) asserts left+right trimmed paths,
  screen-space line-outside-ring clearance, and stem-at-ring-edge.
- `tests/browser/phase11-shell.browser.spec.ts` (test-only): stale
  uniform-fill (`rgba(255, 238, 240, 0.016)`) nav assertion updated to the
  approved transparent Variant B; test renamed accordingly.
- `visual-direction-gate/.../AUTHORITY_MANIFEST.yaml`: refreshed bytes/sha256
  for the 4 stale `evidence/owner-daily/routed-daily-*` captures only.
- `deviations/owner-shared-navigation-uniform-material.yaml`: records Variant B
  as the accepted treatment (superseding the uniform fill) per the standing
  human instruction; explicitly notes Variant B has no separate independent
  rendered review yet and stays under the milestone's final human gate.
- `evidence/owner-daily/review-20260906/index.html`: `alt=""` on all 30 review
  images (each carries a figcaption) — unblocks the repo-wide Biome gate, no
  visual change.
- Evidence (additive; no manifest edit, no canonical promotion):
  `evidence/owner-daily/marker-geometry-{selected,latest}-{ar,en}-{1440,390}.png`
  (8 ring close-ups) + refreshed `routed-daily-{ar,en}-{1440,390}.png`.
  `chart-annotations-*` left untouched (annotation placement unaffected by the
  line cutout; regenerating them under a new payload would corrupt their purpose).

## Verification (this slice)

| Check | Result |
| --- | --- |
| Unit file `owner-analytics-view.test.tsx` | 12/12 pass |
| Full unit suite (documented sentinel env) | 74 files / 598 tests pass |
| Edge simulator | 117/117 pass |
| `pnpm --filter web check-types` (build + tsc) | pass |
| Biome (touched files, then repo-wide via fast ladder) | clean |
| `phase9-owner-ui` browser | 6/7; the 7th is the intentional frozen-REJECTED_R05 canonical mismatch (identical 19570px diff before/after), no promotion authorized |
| `phase11-shell` + `phase4-staff-web` browser | 16/18 + 6/7 shell: Variant B assertion passes; remaining `.owner-rail` canonical diff (628px, nav-row only per diff image) is the approved Variant B delta awaiting the human promotion gate |
| Repository invariants (`verify-repository.mjs`) | pass (68 milestones, 424 authority cases, 228 Paper exports, 41 frozen r05) |
| Bare `node scripts/verify.mjs fast` unit step | red without sentinels (pre-existing invocation gap: `cron`/`reference-gating` require `CRON_SECRET`/`TELEGRAM_*` + `apps/server/.env`); green with the documented sentinel env (598/598). No verifier edit made. |

## Independent review and repairs

Fresh read-only review returned REQUEST-CHANGES with 7 findings; 2 were real
defects in this slice and were repaired + re-verified (unit 12/12, Biome clean,
phase9 browser re-run 6/7 with the identical intentional canonical diff):
1. Deviation provenance could read as circular (Variant B citing pending
   reviews) — reworded to record the session instruction as authority and to
   state Variant B's independent rendered review is still pending.
2. Pre-measure fallback radii understated mobile rx (~12 vs ~32) for one frame —
   fallback is now breakpoint-matched (desktop 12/10, mobile ≈32/11) with the
   observer correcting to exact values immediately after.
The other 5 findings were evidenced misattributions to this slice (broader
pre-existing tree state, frozen manifest history, untouched shell/reporting
CSS, and a misquoted assertion — the replaced value was `rgba(255, 238, 240,
0.016)` = #FFEEF004 as read pre-edit); no code change, documented here.

## Remaining gates (unchanged milestone posture: NEEDS_HUMAN)

1. Human rendered approval of the review package (now including the 8
   marker-geometry close-ups and refreshed `routed-daily-*`).
2. Serialized canonical promotion + accepted-case mapping, then clean
   `verify:full` with normal snapshots + final independent verification, then DONE.
