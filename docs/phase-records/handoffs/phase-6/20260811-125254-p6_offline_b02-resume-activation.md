# Phase 6 offline/backfill b02 — replay reactivation

- Status: `IN_PROGRESS`
- Reactivated: 2026-08-11 12:52:54 +03:00
- Coordinator authority point before activation: `bd53433830d1f4a9912c25ae5a2ec6db5b31ce5a`
- Existing branch/worktree: `work/phase6-offline-b02` / `D:/Projects/fitway-worktrees/phase6-offline-b02`
- Existing clean worktree head: `d9ad91e34744249d8d2f3c995be17a617cb40cd4`
- Worker run/database: `p6_offline_b02` / `fitway_integration_p6_offline_b02`
- Independent run/database: `p6_offline_b02_verify01` / `fitway_integration_p6_offline_b02_verify01`
- Repair count: 0 of 2; this is not a third repair of b01

## Preserved candidate reuse

The b02 worktree is already provisioned and passed its frozen-install/Vitest trust preflight before the prior host authorization block. Fast-forward the existing branch from `d9ad91e` to this activation commit; do not create another branch/worktree and do not reset or rebase it.

Then replay the preserved candidate exactly with traceability:

```powershell
git cherry-pick -x 37d2d52d8e8772368a71ce3a283431c6be343fd5
```

Read-only merge-tree analysis against current main found no conflict, and current main changed none of the candidate's 22 paths since its original base. After replay, prove those paths match the preserved commit before any correction. Never replay the candidate directly on `main`.

## Correction boundary

Keep the replayed implementation intact except for the smallest changes needed to:

1. reject Python Boolean `schemaVersion` values before membership/equality checks without rejecting valid JSON numeric versions;
2. correlate every acknowledgement's schema version with the durable in-flight request before any response branch or mutation; `commands_pending` is valid only for schema-v2 live requests, never backfill, and mismatches preserve durable state byte-for-byte;
3. make OpenAPI timezone validation reject whitespace-only strings, matching Zod and Python;
4. add only the missing negative regressions without refactoring the already-green recovery flow.

Frozen settings remain version, push interval, timezone, business-day boundary, and weekly schedule. No reset buffer, migration, router/context/server-index change, UI, or new command surface is authorized.

## Ownership and lease

Owned paths remain `packages/api/src/offline/**`, `apps/server/src/phase6-offline.integration.test.ts`, and `docs/phase-records/handoffs/phase-6/**`.

The renewed exclusive edge-spine lease through 2026-08-18 12:52:54 +03:00 covers only the exact API/server/OpenAPI/occupancy/Python paths listed in `PROJECT_STATE.yaml`. Database/migrations, router/context/server index, environment, Reset, all UI/Paper paths, root configuration, verification scripts/state, and other milestones' tests/records remain forbidden.

## Gate ladder and external-capacity rule

1. Replay and prove exact 22-path candidate parity.
2. Run the focused TypeScript/OpenAPI and Python tests.
3. Run guarded Phase 6 Postgres integration with the worker identifiers.
4. Run `pnpm verify:fast` and guarded `FITWAY_PHASE=6 pnpm verify:phase`.
5. Commit a clean worker candidate and handoff; a fresh verifier repeats every gate and prior negative probe with the independent identifiers.
6. Only verifier PASS permits coordinator integration and `verify:full`.

If the traced Git replay is rejected by host authorization again, record the exact denial, return Phase 6 to external `BLOCKED`, release the lease, and keep repair count 0. If replay succeeds but a required command cannot start because of the already-recorded host `spawn EPERM`, preserve the replay commit and classify external `BLOCKED` with repair count 0 because no Phase 6 assertion ran. Do not retry or invent a workaround.
