# Batch 01B activation record

- Status: `READY`; worker session pending
- Integrated feature baseline: `ac59e7e53a65235efedb5875035fe0f36ff60492` (Batch 01A closure)
- Coordinator activation commit: `SELF`
- Coordinator branch: `main`
- Activated at: `2026-07-16T16:49:13+03:00`
- Feature implementation in activation commit: none

## Selected slice

| Slice | Readiness reason | UI polish |
| --- | --- | --- |
| `phase4-health` | `phase4-auth` and migration `0002` are integrated at the baseline; the ordered migration lane is free and the coordinator reallocates it as `0003` together with the edge transaction/occupancy-repository lane | `NOT_REQUIRED`; backend-only slice |

Batch 01B contains only this slice. `phase4-staff-web` remains `PLANNED` until health
integrates and the real `staff.operationalSnapshot` exists; `phase8-alert-evaluator` remains
`PLANNED` until `phase4-health` is `DONE`. No other worktree may be created from this batch.

## Contract sources

The binding execution contract is
`docs/phase-records/handoffs/phase4-health/20260716-164900-p4_health_b01.md`, derived from:

- `SPEC.md` 414–457 — the frozen Phase 4 operational-health contract: edge input fields,
  `edgeCurrentHealth` projection shape, transactional update rule, freshness/condition
  semantics, and the frozen `staff.operationalSnapshot` health DTO;
- `PHASES.md` Phase 4 and the Batch 1B row — health follows auth on the single ordered
  schema/migration lane and rebases on the integrated auth baseline;
- ADR-002 (principals/sessions, consumed read-only) and ADR-003 (edge authority);
- `docs/phase-records/batch-01a-integration.md` — lease release and the named prerequisites
  for this batch.

## Resource allocation

| Slice | Branch / worktree | Run ID / port | Disposable database | Output |
| --- | --- | --- | --- | --- |
| `phase4-health` | `work/phase4-health-b01` / `D:/Projects/fitway-worktrees/phase4-health` | `p4_health_b01` / `17403` | `fitway_integration_p4_health_b01` | `output/playwright/p4_health_b01` in its worktree |

The database was provisioned in the guarded local Postgres container (listener `55432`); port
`17403` was verified free at activation. Report and review directories are `<output>/report`
and `<output>/review`. Canonical screenshots are read-only for this non-UI slice.

## Ownership, leases, and lanes

- **Owned:** new `packages/api/src/health/**`, new `apps/server/src/health-repository.ts`,
  `apps/server/src/phase4-health.integration.test.ts`, and the slice handoff directory.
- **Migration `0003` ownership:** exclusive lease on `packages/db/src/schema/application.ts`,
  the generated `0003_*` migration, its `meta/0003_snapshot.json`, and one append-only journal
  entry. Migrations `0000`–`0002` are immutable history. No parallel migration number exists;
  the lease returns to the coordinator at integration.
- **Edge transaction / occupancy-repository lane:** exclusive lease on
  `packages/api/src/occupancy/engine.ts` (+ its colocated test) and
  `apps/server/src/occupancy-repositories.ts`, only to add the projection write inside the
  existing accepted-live-push transaction.
- **Authenticated API/server boundary:** exclusive lease on `packages/api/src/context.ts`,
  `packages/api/src/routers/index.ts`, and `apps/server/src/index.ts` to mount the
  `staff.operationalSnapshot` leaf and wire its repository. The integrated auth contracts
  (`packages/auth/**`, `packages/api/src/auth/**`, `apps/server/src/auth/**`, schema `0002`)
  are consumed read-only and are forbidden paths.
- Coordinator retains everything else, including edge wire schemas (`edge-push.ts` on both
  sides), OpenAPI, public payload code, env schemas, root manifests/lockfile, and test/config
  scripts. The `phase4-health` profile in `scripts/verify.mjs` was registered by this
  activation commit.

## Verification and integration gates

Focused worker command: `pnpm verify:phase --phase phase4-health` with the assigned run ID,
database, and port. Browser/accessibility/visual gates are `NOT_REQUIRED` (no UI surface).
Repair is bounded to two focused attempts per gate; the third recurrence is
`FAILED_VALIDATION`.

Integration prerequisites and merge gates, in order:

1. Candidate diff confined to owned paths and recorded leases; `0000`–`0002` SQL/snapshot
   hashes unchanged; exactly one new ordered migration `0003`.
2. Public payload schema v2 remains free of capacity, percentage, health, device identity,
   and history.
3. Fresh independent verifier `PASS` on the exact candidate commit with its own run ID and
   disposable database, without editing the candidate.
4. Coordinator reruns `pnpm verify:phase --phase phase4-health` post-merge with a fresh
   coordinator run ID/database.
5. Coordinator runs `pnpm verify:full` with a new exact disposable database; the worktree is
   clean before and after.
6. Only the coordinator records `DONE` with the integrated commit and evidence; the schema/
   migration/engine/repository/context/router/server leases are released only after the
   integrated migration and repository state pass.

Merge stops on an out-of-scope path, migration ordering conflict, missing independent review,
public-v2 privacy regression, Product/Spec conflict, or any red required gate.

## Activation invariant

This coordinator-only activation commit is the sole child of the integrated baseline
`ac59e7e53a65235efedb5875035fe0f36ff60492` and contains only live state, the launch contract,
this record, and the focused verification profile. The worker branch starts at this activation
commit; `git rev-parse HEAD^` must resolve to the integrated baseline before feature work
begins.
