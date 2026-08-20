# Phase 10 UI/CSV b04 — independent plan review rejection

- Recorded: 2026-08-20 23:26 +03:00.
- Reviewed boundary: `a8f40d400337c3325352963177bde81f4fb319d1..4c2b52e8b6aabc6228b0e1870239f1db2cce18c0`.
- Reviewer: fresh read-only independent Sol/xhigh plan reviewer.
- Result: `REJECT`; implementation remained unopened and repair budget remained `0/2`.

## Blocking findings

1. The proposed unmount-on-switch behavior would destroy History range state, abort an active CSV export, and revoke a prepared download. It also left the return-to-History lifecycle unspecified.
2. `OwnerReportingSection` currently returns `null` until the shared daily prerequisite succeeds. Once Daily is hidden, History therefore needs its own visible pending/error/retry path or can present a blank panel.
3. The plan named a switch/tab seam without freezing the ARIA roles, panel relationship, roving focus, activation, arrow-key behavior, or RTL interpretation.

## Significant findings

1. The wiring-only lease had an escape hatch that could permit backend/shared-file edits. Those files must remain unconditionally frozen; a proven need requires stop and re-plan.
2. The validation ladder did not bind the exact phase/run/database/reset values and Playwright port/base/output paths tightly enough to prove isolation.
3. Exact English/Arabic tab and group names, the approved-render fallback rule, and the repository's third-recurrence `FAILED_VALIDATION` terminal state were not explicit.
4. The plan needed to distinguish the carried implementation baseline `a8f40d4` from the rejected planning commit `4c2b52e`.

## Accepted premises retained

- The local Daily/History seam is required by settled Paper area `17YY-0`; it is not a new product or URL-persistence decision.
- Daily remains the default and the seam remains presentation-local.
- `admin.tsx` may change only to mount the wrapper around the accepted Daily siblings and History section.
- The control grouping, `<=820px` breakpoint, width/locale/RTL matrix, source/hash authority, and no-canonical-baseline rule are correctly bounded.

The rejected plan remains immutable at `20260820-231600-p10_ui_csv_b04-fidelity-plan.md`. Its replacement is a new versioned record rather than an edit.
