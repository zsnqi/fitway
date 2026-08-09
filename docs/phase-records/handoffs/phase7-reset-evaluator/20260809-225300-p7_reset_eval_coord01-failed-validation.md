# phase7-reset-evaluator coordinator failure handoff

- Status: `FAILED_VALIDATION` — two focused repair attempts were exhausted and the final fresh
  verifier reproduced the remaining blocker class. The unaccepted additive module was reverted
  from `main`; all rejected commits remain in Git history.
- Base / rejected / rollback commits: coordinator base
  `3521fab0b589d8df113a739a709cf79442b8b37a`; worker candidate through
  `61dd078`; coordinator repair `457a06a`; final test evidence `c1db8a8`; explicit reverse-order
  rollback through `381f459`.
- Branch / worktree / run IDs: coordinator `main` /
  `D:/Projects/fitway-worktrees/phase5-staff-integration`; worker branch
  `work/phase7-reset-evaluator-b01`; coordinator verification runs
  `p7_reset_eval_integrate01` and `p7_reset_eval_repair02`.
- Owned paths / shared leases: the rejected commits changed only the activated
  `packages/api/src/reset/**`, owned Phase 7 integration-test path, and Phase 7 handoff directory.
  No shared lease or migration was used.

## Completed

- Preserved the worker candidate, both repairs, regression evidence, fresh reviews, and explicit
  rollback as reachable commits on `main` history.
- Restored the production tree to the pre-candidate Phase 7 state through `381f459`; no Phase 7
  evaluator file remains integrated or exposed.
- Provisioned the ignored local coordinator environment and disposable verification databases;
  no secret or environment file was committed and nothing was deployed.

## Decisions and authority

- Repository policy, not a product choice: after the worker's final-close repair and the
  coordinator's DST-history repair, the next fresh rejection exhausts the maximum two focused
  repair attempts. A third implementation attempt is forbidden in this run; the milestone is
  `FAILED_VALIDATION`.
- Human-locked decisions remain unchanged: scheduled resets use the dedicated `system` principal,
  travel as `reset_zero` commands, and create no Staff mutation surface.
- Unresolved before any future `phase7-integration`: ADR-004 and SPEC settle append-only
  `effectiveFrom` history and close-plus-buffer reset behavior, but do not settle which settings
  version owns an exact-close transition or a change during the buffer. The rejected evaluator
  chose the version effective one millisecond before close and retained its buffer; this must not
  be presented as canonical without a recorded authority decision.

## Failure evidence

- Worker repair attempt 1 fixed selection of the final close when adjacent sessions share one
  business day and passed its fresh re-review.
- Coordinator review then reproduced an obsolete `America/New_York` `02:30` DST-gap settings row
  aborting a valid current `03:30` reset. Repair attempt 2 (`457a06a`) added effective-history
  relevance filtering and a regression; the focused suite passed 10 tests.
- The final fresh verifier found the relevance heuristic still used offset-derived hypothetical
  candidates rather than the real DST transition. A version active only across the `07:00Z`
  transition was silently ignored, while a version superseded at `06:45Z` still threw. This can
  both hide an actively invalid schedule and reject irrelevant history.

## Verification

- At rejected repair `457a06a`, `FITWAY_PHASE=phase7-reset-evaluator pnpm verify:phase` passed:
  repository invariants, Biome, all workspace types, 38 unit files / 166 tests, five Python tests,
  one Phase 7 integration test, and mutation guard.
- At rejected repair `457a06a`, `pnpm verify:full` passed with run
  `p7_reset_eval_repair02`: 38 unit files / 166 tests, nine integration files / 28 tests, 57
  browser/accessibility tests, builds, and mutation guard.
- Final focused active-gap evidence at `c1db8a8`: reset suite 11/11 and focused Biome passed.
- Independent review: `FAIL`; the transition-window counterexamples above remain outside those
  green suites.
- Post-rollback `pnpm verify:fast` passed: repository invariants, Biome, all workspace types,
  37 unit files / 156 tests, five Python tests, and mutation guard.

## Current state and blockers

- `main` contains the rejected and revert history but no Phase 7 evaluator production files.
- The worker worktree remains the original clean branch candidate; do not treat it as accepted.
- Phase 7 integration and the Phase 7 aggregate cannot start. A future resumed attempt requires a
  fresh attempt record and a plan that resolves real DST-transition ownership without exceeding
  the recorded repair history. Exact-close/during-buffer settings semantics must be resolved
  before production exposure.

## Recommended next session

- Mode: `execute` / preservation checkpoint for Phase 6.
- Objective: preserve the exact current 22-path Phase 6 recovery tree in one checkpoint commit,
  without claiming validation or changing its implementation.
- Scope: only the already-dirty Phase 6 owned/leased paths and its six recovery handoffs.
- Constraints: run the repository hook, do not bypass or edit verification code, do not update
  `PROJECT_STATE.yaml` until the checkpoint handoff is reachable from `main`, and preserve the
  locked five-field Phase 6 settings contract.
- Verification/report: exact pre/post status, committed path list, hook result, commit SHA, and
  confirmation that no unrelated path moved.

## Exact resume

```powershell
Set-Location 'D:/Projects/fitway-worktrees/phase5-staff-integration'
git status --short --branch
git log --oneline -12
Get-Content -Raw 'docs/phase-records/handoffs/phase7-reset-evaluator/20260809-225300-p7_reset_eval_coord01-failed-validation.md'
```
