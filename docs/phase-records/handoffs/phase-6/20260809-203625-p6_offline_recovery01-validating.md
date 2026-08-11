# Phase 6 recovery handoff — `p6_offline_recovery01`

- Worker status: `VALIDATING`, with an external execution blocker. The coordinator should
  reconcile the stale ledger and decide the `BLOCKED` transition; this worktree does not own
  `PROJECT_STATE.yaml`.
- Final candidate state: not `READY_FOR_INTEGRATION` and never declared `DONE`.
- Base / candidate: activation HEAD remains
  `9909377423d82670f4aa3569a2231f13c26a7bb5`; the preserved candidate and recovery remain
  uncommitted.
- Branch / worktree / run ID: `work/phase6-offline-b01` /
  `D:/Projects/fitway-worktrees/phase6-offline` / `p6_offline_recovery01`.
- Disposable database: `fitway_integration_p6_offline_recovery01` was created but its test process
  was not permitted to start.

## Recovery reconciliation

- This is the fresh recovery attempt following
  `20260809-194135-p6_offline_b01-failed-validation.md`.
- The human authorized recovery in the existing Phase 6 branch, worktree, and lease, preserving
  the rejected work. No branch, worktree, or lease was created or replaced.
- The stale `READY` ledger entry is coordinator-owned and is not treated as an implementation
  gate. `PROJECT_STATE.yaml` remains unchanged and forbidden to this worker.
- The existing owned paths and exclusive edge-spine lease were used. No schema, migration,
  router/context/index, environment, verifier, UI, normative source, or other forbidden path was
  changed.

## Human decisions applied

- Schema-v2 acknowledgement `settings` contains exactly `version`, `pushIntervalSeconds`,
  `timezone`, `businessDayBoundary`, and `weeklySchedule`.
- Phase 6 does not add `resetBufferMinutes`. Reset remains command-driven through `reset_zero`; the
  edge does not compute a reset schedule.
- Python requires and validates the five v2 settings values while tolerating additive keys only
  inside the v2 `settings` object. The acknowledgement envelope, commands, minutes, requests,
  schema-v1 settings, and all other structures remain strict.

## Implemented recovery

- Schema-v2 stale and future-dated live samples settle contiguous history and sequence without
  refreshing current or health authority. Only a fresh live sample can restore authority after
  backfill drains.
- Historical minute rows resolve the greatest settings version effective no later than each
  minute. Missing historical settings fail honestly; current state and response settings still use
  the latest version.
- TypeScript schemas, serializer, OpenAPI, fixtures, and Python agree on the frozen v1/v2 response
  shapes.
- The simulator atomically persists `inFlightRequest` before sending, uses canonical serialization
  for byte-identical retries across restart, retains it through network/429/5xx ambiguity, and
  settles/removes outbox data only from the matching processed or replayed request.
- `commands_pending` must correlate to the immediately preceding highest sequence, replaces the
  in-flight request with a corrected live request at the same sequence, and does not consume queued
  backfill. Malformed command containers are rejected without throwing.
- The outbox retains the newest 2,880 completed minutes and drains in repeated batches of at most
  100 before returning to live mode.
- Phase 6 Postgres cases now reset to an independent baseline. A rollback case acknowledges a
  delivered command and then forces missing minute-effective settings, asserting that the command,
  device sequence, and current state all roll back.

## Repair and review count

- Focused correction cycle 1 resolved the first independent review's three blockers:
  `commands_pending` no longer consumes backfill, schema-v1 settings remain exact, and highest
  sequence correlation is enforced.
- Focused correction cycle 2, the final permitted cycle, resolved the second independent review's
  future-timestamp authority, canonical-byte replay, malformed-command validation, integration
  isolation, and transactional rollback findings.
- A fresh read-only final audit returned `APPROVE` with no blocking or significant findings and
  confirmed scope compliance. It did not and could not supply the repository's required executable
  independent-verification pass because host process spawning remains unavailable.
- Any new code defect or executable verifier rejection in this attempt recurs after both focused
  repair cycles and must be recorded as `FAILED_VALIDATION`, not repaired again in this run.

## Validation evidence

- Frozen installation repair — pass: `pnpm install --frozen-lockfile` completed, followed by a
  forced frozen reinstall to repair missing local executable links; `pnpm exec vitest --version`
  reported `vitest/4.1.10 win32-x64 node-v24.14.0`.
- Focused TypeScript/domain/OpenAPI before the final correction — pass: 4 files, 16 tests. This is
  retained as earlier evidence only; post-correction Vitest execution remains blocked.
- Python simulator after the final correction — pass: `py -3 -m unittest discover -s edge -p
  test_simulator.py`, 12 tests.
- Python syntax after the final correction — pass: `py -3 -m py_compile edge/simulator.py
  edge/test_simulator.py`.
- Direct TypeScript checks after the final correction — pass for
  `packages/api/tsconfig.json` and `apps/server/tsconfig.json`.
- Targeted Biome after the final correction — pass: 13 TypeScript/JSON files, no fixes required.
- `git diff --check` after the final correction — pass.
- `FITWAY_PHASE=6 pnpm verify:phase` after the final correction — invoked with run ID and the
  run-owned disposable database, but stopped before its first verification step with
  `FAILED_VALIDATION: spawn EPERM`.
- Not executed after the final correction: focused Vitest/OpenAPI, disposable Postgres integration,
  `pnpm verify:fast`, executable independent verification, and `pnpm verify:full`.
- Browser, accessibility, and visual validation: `NOT_REQUIRED` for this no-UI phase.
- Deployed / pushed / committed: none.

## Exact blocker and unblock condition

The host currently denies the verifier's required child-process execution (`spawn EPERM`), and the
execution approval service rejected the database run before Vitest started after reaching its usage
limit. This is external to the candidate; it is not evidence that a code gate passed or failed.

Unblock when process-spawn/approval capacity is restored. Resume this same attempt without editing
first, use the existing run-owned database, and execute:

```powershell
pnpm exec vitest run packages/api/src/offline packages/api/src/edge-push.test.ts packages/api/src/occupancy/engine.test.ts apps/server/src/openapi.test.ts
py -3 -m unittest discover -s edge -p test_*.py
$env:FITWAY_RUN_ID='p6_offline_recovery01'
$env:TEST_DATABASE_URL='postgresql://.../fitway_integration_p6_offline_recovery01'
$env:FITWAY_INTEGRATION_RESET_DATABASE='fitway_integration_p6_offline_recovery01'
pnpm exec vitest run --config vitest.integration.config.ts apps/server/src/phase6-offline.integration.test.ts
pnpm verify:fast
$env:FITWAY_PHASE='6'
pnpm verify:phase
```

Then invoke a fresh independent verifier with a distinct run ID and disposable database. If every
required gate passes, the coordinator may advance the worker candidate to `READY_FOR_INTEGRATION`.
Do not edit `PROJECT_STATE.yaml`, move the work, add reset scheduling, broaden scope, or declare
Phase 6 `DONE`.
