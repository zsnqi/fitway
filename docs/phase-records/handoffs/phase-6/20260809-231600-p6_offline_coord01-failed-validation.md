# Phase 6 coordinator failure handoff — `p6_offline_coord01`

- Status: `FAILED_VALIDATION` — the fresh executable verifier confirmed a frozen-contract defect
  after both focused repair cycles were already exhausted. No further repair is permitted in this
  run.
- Base / preserved candidate: `9909377423d82670f4aa3569a2231f13c26a7bb5` /
  `37d2d52d8e8772368a71ce3a283431c6be343fd5`.
- Branch / worktree: `work/phase6-offline-b01` /
  `D:/Projects/fitway-worktrees/phase6-offline`.
- Run IDs / disposable databases: worker validation `p6_offline_recovery01` /
  `fitway_integration_p6_offline_recovery01`; independent verification
  `p6_offline_verify02` / `fitway_integration_p6_offline_verify02`.

## Completed

- Preserved the exact recovery candidate as clean checkpoint `37d2d52`: 22 authorized paths,
  2,936 insertions / 257 deletions, pre-commit hook pass, no forbidden path touched.
- Completed the previously blocked executable worker ladder and a distinct fresh executable
  independent verification run.
- Kept the rejected implementation out of `main`. The checkpoint and all recovery handoffs remain
  recoverable on the worker branch; nothing was reset, discarded, pushed, or deployed.

## Decisions and authority

- Human-locked Phase 6 contract remains unchanged: schema-v2 response settings contain exactly
  `version`, `pushIntervalSeconds`, `timezone`, `businessDayBoundary`, and `weeklySchedule`;
  TypeScript adds no `resetBufferMinutes`; reset stays command-driven through `reset_zero`.
- Python may tolerate additive keys only inside schema-v2 `settings` and must remain strict for the
  acknowledgement envelope, schema version, commands, minutes, requests, and schema-v1 settings.
- Repository policy, not a new product decision: the two recorded correction cycles are exhausted.
  A fresh independent code rejection therefore transitions the milestone to `FAILED_VALIDATION`
  without another repair attempt.

## Failure evidence

- `edge/simulator.py` accepts `schemaVersion: true` because Python booleans compare equal to integer
  `1`.
- `accept_acknowledgement` does not correlate the acknowledgement schema version with the durable
  in-flight request. A fresh probe supplied a schema-v1 `processed` response for a schema-v2
  backfill; validation returned true, sequence advanced to `1`, and the only durable outbox minute
  was deleted.
- This violates the frozen TypeScript/OpenAPI/Python parity contract and the explicit strictness
  rule outside additive schema-v2 settings.
- Minor parity mismatch: OpenAPI accepts whitespace-only `timezone` with `minLength: 1`, while
  TypeScript and Python trim and reject it.

## Verification

- Worker focused TypeScript/OpenAPI: 4 files / 17 tests passed.
- Worker Python: 12 tests passed; `py_compile` passed.
- Worker guarded Postgres integration: 1 file / 5 tests passed.
- Worker `pnpm verify:fast` and `FITWAY_PHASE=6 pnpm verify:phase`: repository invariants, Biome,
  all workspace types, 38 unit files / 167 tests, 12 Python tests, five Phase 6 integration tests,
  and mutation guards passed.
- Fresh verifier repeated focused TypeScript, Python, guarded integration, and Phase 6 gates under
  `p6_offline_verify02`; all executable gates passed and tracked status remained clean.
- Fresh independent review: `FAIL` on the acknowledgement-version defects above. Green suites do
  not override the missing negative contract coverage.
- Coordinator post-ledger `pnpm verify:fast` passed: repository invariants, Biome, all workspace
  types, 37 unit files / 156 tests, five baseline Python tests, and mutation guard.
- Not run: `pnpm verify:full`, because the candidate failed independent verification before
  coordinator integration. Browser/accessibility/visual are `NOT_REQUIRED` for this no-UI phase.

## Current state

- Coordinator `main` contains this failure record and no Phase 6 candidate source.
- Worker HEAD `37d2d52` is clean and immutable evidence; ignored test/build/bytecode artifacts may
  remain locally.
- The Phase 6 exclusive edge-spine lease is released by the accompanying coordinator ledger
  update. A resumed effort requires a new attempt record and explicit coordinator allocation.

## Blockers and remaining work

- Phase 6 is blocked by terminal validation failure in this run. It prevents Phase 6 integration
  and every downstream milestone that requires Phase 6 `DONE`.
- Any future resumed attempt must begin fresh from the preserved checkpoint/history, add negative
  parity coverage for boolean/mismatched response versions, `commands_pending` on backfill, and
  whitespace-only timezone, then repair the contract without erasing failed evidence.
- Phase 7 reset-evaluator is independently `FAILED_VALIDATION`; its separate durable handoff names
  the DST-transition-window defect and settings-transition authority gap.

## Recommended next session

- Mode: `discover` / runnable-stream audit.
- Objective: identify the highest-value milestone that remains runnable without Phase 6 or Phase 7
  and without reopening completed visual work.
- Scope: current `PROJECT_STATE.yaml`, `PHASES.md`, existing clean worker candidates/handoffs, and
  approved Paper-production tracks.
- Constraints: do not resume either failed milestone in the same attempt record, do not allocate
  overlapping leases, and do not update the ledger until branch evidence is reachable on `main`.
- Verification/report: exact dependency proof, ownership/lease scope, candidate state, and the next
  one-slice execution brief.

## Exact resume

```powershell
Set-Location 'D:/Projects/fitway-worktrees/phase5-staff-integration'
git status --short --branch
Get-Content -Raw 'docs/phase-records/handoffs/phase-6/20260809-231600-p6_offline_coord01-failed-validation.md'
Set-Location 'D:/Projects/fitway-worktrees/phase6-offline'
git status --short --branch
git show --stat --oneline 37d2d52
```
