# Phase 7 scheduled-reset integration b02 worker Stage 2 handoff

## Completed

- `packages/api/src/reset/runner.ts` provides the internal runner seam: it captures the injected
  instant once, derives sorted/deduplicated adjacent local dates from `now` and `now - buffer`,
  passes complete history and issuance status only to `evaluateScheduledReset`, and serially
  persists each issue decision.
- `apps/server/src/reset-repository.ts` reads the complete settings history ordered by
  `effectiveFrom`, then `version`, and joins each issuance to its current command status.
- `packages/api/src/reset/runner.test.ts`, `apps/server/src/reset-repository.test.ts`, and
  `apps/server/src/phase7-integration.integration.test.ts` cover the runner/repository seams plus
  exact Friday due and later past-midnight durable issuance.

## Current state

- Stage 1 parent: `e14acc617a788217e0c4ccbe38db0b50a5762fef`; independent Stage 1 review passed
  at coordinator commit `1a340e3629eb623ddb369d00124d121b75210ca8`.
- Stage 2 boundary: `SELF` is the one fresh commit containing the five source/test paths above and
  this handoff. After the commit, `SELF` is the Stage 2 review candidate and the worktree is clean.
- Branch / worktree / worker run ID: `work/phase7-integration-b02` /
  `D:/Projects/fitway-worktrees/phase7-integration-b02` / `p7_integration_b02`; exact disposable
  database: `fitway_integration_p7_integration_b02`.
- Status: Stage 2 implementation and self-verification are complete. The coordinator milestone
  remains `IN_PROGRESS`; this is not a formal candidate and does not claim `READY_FOR_INTEGRATION`
  or `DONE`.
- Scope: only the Stage 2 runner/repository files, the permitted Phase 7 integration test, and
  this new b02 handoff changed. Stage 1 production paths are frozen after review; Stage 3
  cron/env/index/Vercel paths, b01, DB/state/profile/auth/edge/UI, and coordinator state remain
  untouched. The shared command/audit lease was not edited or used by Stage 2 and remains valid
  through `2026-08-20T20:58:59+03:00`.

## Decisions

- The human-approved b02 plan keeps close, buffer, due, close-time settings ownership, and
  already-issued decisions exclusively in the accepted `evaluateScheduledReset` evaluator. The
  runner neither selects latest settings nor reimplements policy.
- The same approved plan permits b01 `fed090e` and `5662b16` only as read-only provenance. This
  Stage 2 is a fresh b02 implementation and test boundary; no b01 commit or handoff was copied,
  cherry-picked, amended, or changed.
- The existing actor-free Stage 1 issuance seam is the runner's only write dependency. This rules
  out a user/session-provided system actor and any new product command surface.

## Remaining

1. Run a fresh independent read-only Stage 2 review at `SELF`; do not edit the candidate.
2. Only after review `PASS`, implement and review the separately bounded Stage 3 cron topology and
   Phase 6 offline reconciliation. Formal candidate verification and coordinator integration remain
   after Stages 1-3.

## Blockers

- None. The direct `pnpm exec vitest` shim is unavailable in this worktree and sandboxed Vitest
  config loading returns `spawn EPERM`; direct frozen Vitest under the approved elevated process ran
  the full recorded test set. This is a tooling constraint, not a source or authority blocker.

## Verification

- Fresh red: direct frozen Vitest against the new runner/repository tracers returned two failed
  suites with zero discovered tests because `./runner` and `./reset-repository` did not exist.
  An initial sandboxed launch stopped earlier at Vite config loading with `spawn EPERM`; it made no
  source change.
- Fresh unit green: the same tracer command passed `2` files / `10` tests.
- Focused reset plus command units passed `6` files / `48` tests.
- Exact marked PostgreSQL Stage 2 integration passed `1` file / `13` tests with matching
  `FITWAY_RUN_ID`, `TEST_DATABASE_URL`, and `FITWAY_INTEGRATION_RESET_DATABASE` for
  `p7_integration_b02` / `fitway_integration_p7_integration_b02`.
- Frozen marked Phase 5/6/evaluator/Phase 7 PostgreSQL matrix passed `4` files / `23` tests.
- Scoped Biome over all five Stage 2 source/test paths passed (`Checked 5 files`); workspace type
  checks passed for all eight checked projects.
- `pnpm verify:fast` passed repository invariants, Biome (`236` files), all workspace types,
  `42` TypeScript files / `216` tests, `18` Python tests, and the repository mutation guard.
- `git diff --check` passed before staging. The single formatting-only correction after the initial
  scoped Biome run is included in the final green evidence and is not a formal candidate repair;
  b02's formal repair count remains `0/2`.
- Not verified: independent Stage 2 review; Stage 3; `verify:phase` and `verify:full`; production
  cron cadence/secrets/deployment/real-gym behavior; Browser, visual, and accessibility checks
  (not required for this backend stage).

## Recommended next session

Mode: independent review.

Review only the Stage 2 b02 diff from `e14acc617a788217e0c4ccbe38db0b50a5762fef` through `SELF`.
Make no edits. Confirm that the runner captures time once, derives only deterministic adjacent
local-date candidates from `now` and `now-buffer`, delegates policy only to the frozen evaluator,
does not substitute latest settings, propagates reader/issuer failures with partial-run durability,
and that the repository preserves sorted full history plus issuance command status. Re-run the
focused reset/command units, exact `_b02` PostgreSQL Phase 5/6/evaluator/Phase 7 matrix, scoped
Biome, types, `verify:fast`, diff/scope/tree/status checks. Report locatable findings and `PASS` or
`FAILED_VALIDATION`; stop on any Stage 1 mutation, b01 mutation, Stage 3/forbidden-path change,
evaluator reimplementation, authority conflict, lease/resource mismatch, or database-marker
mismatch.
