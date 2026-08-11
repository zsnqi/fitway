# Phase 6 b02-r02 recovery-ratification handoff

- Status: `IN_PROGRESS`; the preserved Phase 6 source checkpoint is ratified for one bounded writer. No correction has started.
- Activation commit: `f96e5b2886eac095ae4c82fe2d240ef290254189` (`baseCommit: SELF` in the live activation ledger).
- Preserved source checkpoint: `37d2d52d8e8772368a71ce3a283431c6be343fd5`.
- Traceable replay commit: `5e049255296a325bad7de76a619187bf18925b1e`, created by `git cherry-pick -x 37d2d52d8e8772368a71ce3a283431c6be343fd5` directly on the activation commit.
- Actual initial worker HEAD: `SELF` (this ratification commit). The writer must confirm this commit, branch, worktree, live lease, and clean status before editing.
- Branch / worktree / run ID: `work/phase6-offline-b02-r02` / `D:/Projects/fitway-worktrees/phase6-offline-b02-r02` / `p6_offline_b02_r02`.
- Immutable provenance: `work/phase6-offline-b02` at `cb4ec2de9b99b761b3ee5531c2b48488d9dfedf3` remains untouched.

## Ratification evidence

- The fresh branch was created at exact activation commit `f96e5b2`.
- The replay has activation commit `f96e5b2` as its sole parent and carries the `cherry picked from commit 37d2d52...` trailer.
- `git diff --exit-code 37d2d52 5e04925 -- <the 22 checkpoint paths>` passed: all 22 paths are byte-identical to the preserved source checkpoint. Six of those paths are historical handoffs embedded in the source commit and remain provenance only.
- The worktree was provisioned with the existing local server environment without exposing it.
- `pnpm install --frozen-lockfile` passed with the lockfile unchanged; 555 packages were installed from the frozen graph.
- `pnpm exec vitest --version` returned `vitest/4.1.10 win32-x64 node-v24.14.0`.
- Worktree status after replay and preparation was clean.

## Frozen writer authority

Owned paths:

- `packages/api/src/offline/**`
- `apps/server/src/phase6-offline.integration.test.ts`
- `docs/phase-records/handoffs/phase-6/**`

Exclusive shared lease through `2026-08-18T20:41:09+03:00`:

- `packages/api/src/edge-push.ts`
- `packages/api/src/edge-push.test.ts`
- `packages/api/src/occupancy/engine.ts`
- `packages/api/src/occupancy/engine.test.ts`
- `apps/server/src/edge-push.ts`
- `apps/server/src/openapi.ts`
- `apps/server/src/openapi.test.ts`
- `apps/server/src/occupancy-repositories.ts`
- `edge/**`

Everything else is forbidden, including `PROJECT_STATE.yaml`, database/migrations, router/context/server index, environment and root configuration, verification scripts, Phase 7+ work, UI/Paper/browser assets, and normative Product/Spec/Phase/ADR documents.

## Exact bounded correction

1. Add the missing negative regressions first and demonstrate the expected focused red failures.
2. Reject Boolean Python acknowledgement schema versions while preserving numeric JSON versions `1|2`.
3. Correlate acknowledgement/request schema version before any branch or mutation; allow `commands_pending` only for schema-v2 live requests. Mismatches preserve sequence, count, applied-command ID, outbox, last request, and in-flight request byte-for-byte.
4. Reject whitespace-only timezone in OpenAPI exactly as Zod and Python do.
5. Preserve all valid v1/v2, replay, gap, live `commands_pending`, restart, and batch behavior. Do not refactor the green recovery flow or expand scope.

The ADR-008 carried review is resolved: no authorized production producer of `source=manual` exists. Compatibility enum/read surfaces remain unchanged in this bounded slice; no producer, fallback, migration, or manual-validity setting is authorized.

## Required gates and stop conditions

Run the plan's focused TypeScript/OpenAPI suite, Python unit/compile suite, guarded Phase 6 integration suite with database `fitway_integration_p6_offline_b02_r02`, `pnpm verify:fast`, and `FITWAY_PHASE=6 pnpm verify:phase`. Produce a clean committed candidate and durable handoff. A fresh verifier repeats the ladder under `p6_offline_b02_v02` before integration.

Stop immediately on expired/mismatched lease, unleased file need, Product/Spec/privacy/security conflict, or resource-isolation mismatch. Record any validation failure exactly; repair count starts at `0/2` and cannot be reset by changing sessions.

Exact resume:

```powershell
Set-Location 'D:/Projects/fitway-worktrees/phase6-offline-b02-r02'
git status --short --branch
git rev-parse HEAD
pnpm exec vitest --version
```
