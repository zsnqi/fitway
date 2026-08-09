# Phase 6 offline/backfill b02 resumed-attempt activation

- Status: `IN_PROGRESS` — fresh resumed attempt, not a third repair of b01.
- Activation base: `SELF` in the activation commit whose parent is
  `604d4d96432923d44bf909fc46f74679c0db4049`.
- Branch / worktree / run ID: `work/phase6-offline-b02` /
  `D:/Projects/fitway-worktrees/phase6-offline-b02` / `p6_offline_b02`.
- Worker database: `fitway_integration_p6_offline_b02`.
- Independent run/database: `p6_offline_b02_verify01` /
  `fitway_integration_p6_offline_b02_verify01`.
- Repair counter: 0. The b01 terminal handoff and its two attempts remain immutable history.

## Preserved candidate reuse

Replay the clean preserved candidate commit
`37d2d52d8e8772368a71ce3a283431c6be343fd5` with a traced cherry-pick from this activation:

```powershell
git cherry-pick -x 37d2d52d8e8772368a71ce3a283431c6be343fd5
```

The candidate is 22 paths, 2,936 insertions and 257 deletions from parent `9909377`. Read-only
merge-tree analysis against this activation found no conflict, and no candidate-touched path
changed on `main` after its original base. After replay, prove the 22-path tree matches the
preserved commit before adding the b02 fix. Never cherry-pick it directly to `main`.

## Exact correction boundary

Keep the replayed implementation intact except for the smallest changes needed to:

1. Reject Python Boolean `schemaVersion` values before membership/equality checks, without
   accidentally rejecting a JSON numeric value that the TypeScript/OpenAPI contract accepts.
2. Correlate every acknowledgement's schema version with the durable in-flight request before any
   response branch or state mutation. `commands_pending` is valid only for a schema-v2 live
   request, never backfill. A mismatch must preserve sequence, count, applied command, outbox,
   `lastRequest`, and `inFlightRequest` exactly.
3. Make OpenAPI timezone validation reject whitespace-only strings, matching Zod and Python.
4. Add only the missing negative regressions; do not refactor the already-green recovery flow.

Frozen Phase 6 settings remain exactly: version, pushIntervalSeconds, timezone,
businessDayBoundary, weeklySchedule. No resetBufferMinutes, migration, router leaf, Staff/Owner UI,
or new command surface is allowed.

## Ownership and lease

Owned:

- `packages/api/src/offline/**`
- `apps/server/src/phase6-offline.integration.test.ts`
- `docs/phase-records/handoffs/phase-6/**`

Exclusive shared lease through `2026-08-17T01:31:00+03:00`:

- `packages/api/src/edge-push.ts` and `edge-push.test.ts`
- `apps/server/src/edge-push.ts`
- `apps/server/src/openapi.ts`
- `packages/api/src/occupancy/engine.ts` and `engine.test.ts`
- `apps/server/src/occupancy-repositories.ts`
- `edge/**`

Everything else remains forbidden as recorded in `PROJECT_STATE.yaml`, especially migrations/db,
API router/context/index, server index, env, Reset, every UI/Paper path, root configuration, and
other milestones' tests/handoffs.

## Required red regressions

- `schemaVersion: true` is rejected.
- Schema-v1 `processed` cannot settle schema-v2 backfill and leaves the durable request/outbox/
  sequence/command state byte-for-byte unchanged.
- `commands_pending` for backfill is rejected without consuming data or applying its command.
- TypeScript/OpenAPI reject Boolean schema versions; TypeScript/OpenAPI/Python reject
  whitespace-only timezone.
- Existing valid v1/v2, replay, live `commands_pending`, restart, and batch-drain cases stay green.

## Gate ladder

1. Focused TypeScript/OpenAPI tests.
2. `py -3 -m unittest discover -s edge -p test_*.py` and `py_compile`.
3. Guarded Phase 6 Postgres integration with the exact worker run/database identifiers.
4. `pnpm verify:fast`.
5. `FITWAY_PHASE=6 pnpm verify:phase` with the same guarded database.
6. Clean scope/handoff/commit, then a fresh verifier repeats all gates with the independent
   run/database and reproduces the former failure probes.
7. Only a fresh verifier PASS permits coordinator integration and `verify:full`.

Stop on any need to widen the frozen contract or ownership. At most two b02 repair attempts; a
third recurrence is terminal `FAILED_VALIDATION` for b02.
