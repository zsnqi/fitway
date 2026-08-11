# Phase 6 recovery attempt plan — `p6_offline_recovery01`

- Mode: `execute`, adopted after the human decisions recorded on 2026-08-09.
- Branch / worktree: `work/phase6-offline-b01` /
  `D:/Projects/fitway-worktrees/phase6-offline`.
- Activation HEAD / preserved rejected base: `9909377423d82670f4aa3569a2231f13c26a7bb5` /
  the uncommitted `p6_offline_b01` candidate rejected at
  `20260809-194135-p6_offline_b01-failed-validation.md`.
- Recovery run ID / disposable database: `p6_offline_recovery01` /
  `fitway_integration_p6_offline_recovery01`.
- The existing recorded owned paths and edge-spine lease remain the implementation boundary.
  `PROJECT_STATE.yaml` remains coordinator-owned and unchanged; this record preserves the required
  failed-validation/recovery reconciliation.

## Objective

Recover the preserved Phase 6 candidate so that stale ambiguous live requests cannot refresh
current authority, historical minutes use minute-effective settings, the frozen v2 acknowledgement
contains the human-approved settings subset, and the Python simulator durably retries the exact
in-flight request across restart while retaining bounded backfill behavior. The candidate must pass
focused, fast, Phase 6, and fresh independent review gates; the worker outcome is never `DONE`.

## Locked interface and scope decisions

- Frozen v2 `settings` contains exactly `version`, `pushIntervalSeconds`, `timezone`,
  `businessDayBoundary`, and `weeklySchedule`. Phase 6 does not add `resetBufferMinutes`.
- Reset remains command-driven through `reset_zero`; the edge does not compute reset scheduling.
- Python validates the five required settings values but permits additive keys inside `settings`.
  Request/acknowledgement envelopes, commands, minutes, and all other structures remain strict.
- Recovery continues in the current branch/worktree/lease and preserves the rejected work.
- No schema/migration, UI, router/context/index, environment, verifier-script, normative-document,
  ledger, schedule/reset-module, analytics, or other milestone change is permitted.
- `source=manual` cleanup remains out of scope.

## Stage 1 — TypeScript authority, historical settings, and frozen response

Add regression tests at the existing public seams, then implement:

- stale schema-v2 live requests settle contiguous sequence/history without updating current or
  health authority;
- each historical minute resolves the greatest settings version effective no later than that
  minute, while current state and acknowledgements still use latest settings;
- the v2 response schema/serializer/OpenAPI expose the approved five-field settings object, while
  schema-v1 compatibility remains unchanged;
- deterministic duplicate backfill after a settings change retains the minute-effective snapshot.

Targets: `packages/api/src/offline/**`, `packages/api/src/edge-push.ts` and test,
`packages/api/src/occupancy/engine.ts` and test, `apps/server/src/occupancy-repositories.ts`,
`apps/server/src/openapi.ts`, the two v2 acknowledgement fixtures, and the owned Phase 6
integration test. The fixture update is part of freezing the TypeScript contract; Stage 2 restores
Python parity with that already-frozen shape.

Rollback boundary: reverse only this recovery attempt's changes in those files; the preserved
rejected candidate remains intact.

Gate:

```powershell
pnpm exec vitest run packages/api/src/offline packages/api/src/edge-push.test.ts packages/api/src/occupancy/engine.test.ts
```

## Stage 2 — Python exact-request durability and bounded reconnect

Add regression tests, then implement:

- atomically persist `inFlightRequest` before first send;
- reuse it byte-for-byte after restart and through network, 429, and 5xx ambiguity;
- replace it only after explicit `commands_pending`, using the corrected local count and the same
  sequence; clear it only after matching `processed` or `replay` settlement;
- remove backfilled outbox minutes only from the exact settled persisted request;
- retain exactly the newest 2,880 completed minutes and drain more than 100 minutes in repeated
  bounded batches before a final fresh live request;
- validate all five required acknowledgement settings values while permitting additive keys only
  inside `settings`.

Targets: `edge/simulator.py`, `edge/test_simulator.py`, `edge/README.md`, and `edge/fixtures/**`.

Rollback boundary: reverse only this recovery attempt's edge changes; Stage 1 and the preserved
candidate remain intact.

Gate:

```powershell
py -m unittest discover -s edge -p test_*.py
```

## Stage 3 — Cross-runtime acceptance and closeout

Complete the owned HTTP/Postgres and fixture-parity evidence for stale-live recovery,
minute-effective duplicate backfill, command-before-live, crash/restart semantics represented at
the simulator boundary, 2,880-minute eviction, multi-batch draining, and final live recovery.
Align fixtures and OpenAPI with the adopted five-field response. Make no unrelated cleanup.

This third writing stage serves the single Phase 6 recovery slice by proving the TypeScript,
OpenAPI, fixture, Python, and database paths agree end to end.

Rollback boundary: reverse only the recovery additions to the Phase 6 integration test, shared
fixtures/OpenAPI parity, and recovery handoff; Stages 1–2 remain independently testable.

Focused and required gates:

```powershell
pnpm exec vitest run packages/api/src/offline packages/api/src/edge-push.test.ts packages/api/src/occupancy/engine.test.ts apps/server/src/openapi.test.ts
py -m unittest discover -s edge -p test_*.py
$env:FITWAY_RUN_ID='p6_offline_recovery01'
$env:TEST_DATABASE_URL='postgresql://.../fitway_integration_p6_offline_recovery01'
$env:FITWAY_INTEGRATION_RESET_DATABASE='fitway_integration_p6_offline_recovery01'
pnpm exec vitest run --config vitest.integration.config.ts apps/server/src/phase6-offline.integration.test.ts
pnpm verify:fast
$env:FITWAY_PHASE='6'
pnpm verify:phase
```

Then obtain a fresh independent reviewer that does not edit the candidate. It must inspect the full
diff and rerun the focused/Python/Postgres/Phase 6 checks with a distinct run ID and disposable
database before returning `PASS` or `FAILED_VALIDATION`.

## Risks and stop conditions

- Missing effective settings for a historical minute must fail honestly; it must not silently use
  a future row. If existing baseline data violates that invariant, stop and report the data issue.
- Legacy schema-v1 response compatibility must not be expanded accidentally by the v2 settings
  change.
- The edge's additive settings tolerance must not weaken strict validation elsewhere.
- Any required file outside the recorded owned paths/lease, expired lease, schema/migration need,
  or Product/Spec conflict is `NEEDS_HUMAN`.
- A gate receives at most two focused repair attempts. A fresh verifier rejection is
  `FAILED_VALIDATION`.

## Open decisions

None. The human resolved the remaining frozen-interface and recovery-location questions before
this plan was adopted.
