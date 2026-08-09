# Phase 5 Staff Monitoring repair — failed validation gate

- Status: `FAILED_VALIDATION`; the bounded Staff candidate is implemented and Staff-specific
  verification is green, but the mandatory repository-wide ladder is not green. This is not
  `DONE` or `READY_FOR_INTEGRATION`.
- Date: 2026-08-09
- Branch / worktree: `work/phase5-staff-paper-fidelity` / `D:/Projects/fitway`
- Base / HEAD: `0f849756cee77d43e9013c9fd5e4e7b5cf36701a` /
  `45fc45ffdef03540590056fc301c4cdcdbc445bc`
- Integrated, committed, staged, pushed, merged, or deployed: none

## Completed

- Preserved the inherited Paper-fidelity markup/CSS repair in
  `operational-snapshot-view.tsx` and `staff-board.css`.
- Replaced the unavailable-occupancy raw `health.process` heuristic with the server-owned
  `health.freshness` distinction: unavailable health selects device-offline; current/stale health
  selects the present-but-untrusted composition.
- Added component assertions for offline versus trust selection and for keeping DTO capacity out
  of Staff rendering.
- Added durable Staff browser assertions for the authored Arabic order
  skip → sign out → language → Retry, monitoring-only negative control, Retry focus/44px target and
  successful refetch, responsive overflow, and 200% reflow.
- Strengthened the Staff review spec from capture-only evidence to assertions and made its
  run-scoped capture directory use the repository Playwright variable.
- Obtained a fresh independent verifier: `PASS`, no findings.

## Exact current state

Tracked working changes are limited to:

- `PROJECT_STATE.yaml`
- `apps/web/src/components/staff/operational-snapshot-view.tsx`
- `apps/web/src/components/staff/operational-snapshot-view.test.tsx`
- `apps/web/src/components/staff/staff-board.css`
- `tests/browser/phase4-staff-web.browser.spec.ts`
- `tests/browser/staff-paper-fidelity.review.spec.ts`

This handoff is newly untracked. The inherited untracked reconciliation/activation handoffs remain,
as does unrelated `probe2.mjs`; none was edited, staged, or removed. The ignored
`.impeccable/hook.cache.json` also remains untouched. Build/test output stayed under ignored
`output/` or package `dist/` paths. The exact disposable integration database
`fitway_integration_p5_staff_full_20260809a` was used; no production or development database was
used.

## Decisions

Human decisions ratified by the previous authoritative handoff remain locked:

1. Preserve the authored Arabic intra-zone Tab order exactly; RTL does not reverse it.
2. Capacity remains DTO-only and is not introduced into the Staff UI.
3. The existing Paper candidate and visual `PASS` are final; Paper and canonical baselines stay
   untouched.

No new product or human decision was made or remains open.

## Verification

Focused:

- `git diff --check`: PASS.
- Biome on the five Staff implementation/test files: PASS, 5 files.
- `pnpm exec vitest run apps/web/src/components/staff/operational-snapshot-view.test.tsx`:
  PASS, 1 file / 4 tests.
- First focused Playwright run: 1 Staff case passed; three review cases failed only because the
  review spec required the legacy `FITWAY_STAFF_REVIEW_DIR`. One bounded repair added fallback to
  the runner-owned `FITWAY_PLAYWRIGHT_REVIEW_DIR`.
- Focused rerun `p5_staff_focus_20260809b`: PASS, 4/4.

Required broader/full ladder:

- `pnpm verify:full`, run `p5_staff_full_20260809a`: FAIL at global Biome after repository
  invariants passed. The only Biome failures are unrelated, untouched
  `.impeccable/hook.cache.json` and forbidden untracked `probe2.mjs`.
- `pnpm check-types`: PASS, all workspace projects.
- `pnpm test`: PASS, 35 files / 140 tests.
- `pnpm test:simulator`: PASS, 5 tests.
- `pnpm build`: PASS, server and web.
- `pnpm test:integration` against the exact disposable database: PASS on the ready-container
  rerun, 7 files / 26 tests. The first attempt was `ECONNREFUSED` before the existing PostgreSQL
  container was started.
- `pnpm test:browser`, run `p5_staff_browser_20260809a`: FAIL, 56/57. Every Staff Monitoring,
  Staff fidelity, responsive, axe, and canonical public visual test passed. The sole failure is the
  existing login Retry-After assertion expecting `5` while configured behavior displays `30`;
  login behavior is outside the constrained Staff lease and this same failure is recorded in the
  2026-08-08 Phase 5 handoff.
- Independent verifier: PASS with no findings; component 4/4, new Staff browser case 1/1, complete
  Staff fidelity suite 27/27, and no repository mutation.

Gaps: `pnpm verify:full` has no green end-to-end result, and the repository-wide browser gate is
therefore `FAIL` even though all Staff-specific browser/accessibility evidence passes.

## Blockers

The required repository-wide gate cannot pass inside the current authority:

- Global Biome requires disposition of unrelated `.impeccable/hook.cache.json` and
  `probe2.mjs`; both are outside the Phase 5 owned scope and the latter is explicitly forbidden.
- The shared login Retry-After test/behavior mismatch is outside the Staff Monitoring lease, which
  expressly grants no authority to change login behavior.

These are scope/validation blockers, not unresolved product decisions. No further repair is
authorized in this slice.

## Remaining

1. In a separately authorized verification-unblock slice, disposition the two unrelated Biome
   inputs and reconcile the shared login Retry-After assertion with its already-authoritative
   behavior without changing Phase 5 Staff Monitoring.
2. Rerun `pnpm verify:full` with fresh isolated resources.
3. Only if that run passes, return this candidate to coordinator integration/terminal review.

## Recommended next session

Run one coordinator-owned `execute/verify` slice to unblock the repository-wide verification
ladder. Scope only the two global Biome inputs and the shared login Retry-After mismatch; do not
change the Staff candidate, Arabic order, capacity-free composition, Paper, or canonical baselines.
After explicit authority is confirmed, make only the necessary out-of-slice corrections, rerun
`pnpm verify:full` with fresh isolated resources, and report whether the Phase 5 Staff candidate
can move from `FAILED_VALIDATION` to integration review.
