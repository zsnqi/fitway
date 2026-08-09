# Batch 05 activation — `phase-6` and `phase7-reset-evaluator` in parallel

- Status: both `READY`; no worker launched, no feature code, no push, no deploy
- Verified feature baseline: `06486487914c5a78afb3aa6e264e6988e0c5cb85` (`main`, clean)
- Coordinator activation commit: `SELF`; it is the only child of that baseline
- Activated: 2026-08-09T18:30:00+03:00; lease expiry 2026-08-16T18:30:00+03:00
- Coordinator context: `D:/Projects/fitway-worktrees/phase5-staff-integration`, on `main`

This is the executable subset of the `PHASES.md` batch 4 row. The other two members of that
row, `phase11-audit` and `phase11-access`, are deliberately **not** activated — see
"ADR-007 remains the gate" below.

## Why these two, and only these two

`phase-5` and `phase10-domain` are `DONE` and integrated. Six milestones are DAG-eligible:
`phase-6`, `phase7-reset-evaluator`, `phase10-ui-csv`, `phase11-shell`, `phase11-audit`, and
`phase11-access`. Four of the six produce owner-facing UI and are held by an unresolved
authority question, leaving exactly two executable streams.

| Milestone | Ledger dependencies | Executable | Reason |
| --- | --- | --- | --- |
| `phase-6` | `phase-5` `DONE` | Yes | Backend and edge only; produces no UI |
| `phase7-reset-evaluator` | BRG, `phase-3`, `phase-5` all `DONE` | Yes | Pure evaluator; browser/a11y/visual `NOT_REQUIRED` |
| `phase10-ui-csv` | `phase10-domain` `DONE` | No | ADR-007 |
| `phase11-shell` | `phase-9` `DONE` | No | ADR-007 |
| `phase11-audit` | `phase-5`, `phase-9` `DONE` | No | ADR-007 |
| `phase11-access` | `phase-4`, `phase-5`, `phase-9` `DONE` | No | ADR-007 |

## ADR-007 remains the gate for every remaining UI slice

ADR-007 approves four production families — `OWNER DAILY ANALYTICS`, `STAFF MONITORING`,
`LOGIN`, and `PUBLIC CROWD BOARD` — states that "Implementation of any production family starts
from Paper", and records that "Establishing the per-surface conflict list is implementation-phase
work and has not been done." No approved family covers Phase 10 reporting or any Phase 11
governance surface.

`dependency-parallelization-audit.md` §16.1 records this as a hard blocker for every remaining UI
phase, independent of Phase 5. `phase-05-staff-paper-adoption.md` reaches the same conclusion from
the implementation side and calls it the single highest-value follow-up. Verified at this commit:
the newest change to ADR-007 or the Paper closeout is `ec35298`, which created the ADR; no
amendment answers the question.

Activating a UI slice without that answer would be an agent making a material visual-direction
decision, which `AGENTS.md` makes immediately `NEEDS_HUMAN`. It is therefore held for a human, and
this activation carries no UI work of any kind.

## Coordinator questions resolved from repository authority

**1. Does the batch 4 precondition "a coordinated settings/index migration lands first" gate these
two streams?** No. The phrase appears only at `PHASES.md` line 98 and nowhere else in the
repository; no migration plan is recorded for it. Its clause completes as "...; Phase 11 slices
cannot infer missing audit/auth contracts", which scopes it to the Phase 11 members of that row.
"Settings" is the `phase11-settings` surface and "index" is the open `occupancy_minutes` index
question in audit §16.2, which belongs to Phase 10. Neither `phase-6` nor `phase7-reset-evaluator`
is a settings or index consumer. Both Phase 11 members of the row are held on ADR-007 regardless,
so the precondition is not triggered by this activation.

This ruling is made safe by construction rather than by argument: `packages/db/**`, including
`src/schema/**`, `src/migrations/**`, and `meta/_journal.json`, is in **both** workers'
`forbiddenPaths` with no lease. A schema need discovered mid-slice is a coordinator escalation,
not a worker act.

**2. Should `phase-6` carry browser, accessibility, and visual gates?** No; set to `NOT_REQUIRED`.
`PHASES.md` Phase 6 introduces "no staff-facing manual fallback and no new staff or owner command
surface", and its acceptance list is outage, reconnect, duplicate/gap/replay, command ordering,
minute idempotency, current-state protection, and TypeScript/OpenAPI/Python fixture parity — no UI
acceptance. The `PHASES.md` polish-loop invariant binds a "UI-producing phase"; Phase 6 is not one.
The ledger's previous `PENDING` values were unset defaults. `unit`, `integration`, and
`independentReview` remain `PENDING`.

## Why the two streams are safe to run concurrently

| Check | Evidence |
| --- | --- |
| Ledger dependencies | Both sets are fully `DONE`; the checker enforces this for `READY` |
| Endorsement | `dependency-parallelization-audit.md` §17 lists each as the other's "Parallel with" entry, VERIFIED |
| Owned-path intersection | Empty. `packages/api/src/offline/**` versus `packages/api/src/reset/**`; one integration test each; separate handoff directories |
| Mutual exclusion | Each milestone names the other's owned paths explicitly in its own `forbiddenPaths` |
| Shared-lease intersection | Empty. `phase-6` holds the edge-spine lease; `phase7-reset-evaluator` holds none and has every leased path forbidden |
| Integration spine | Neither may touch `packages/api/src/routers/**`, `context.ts`, `apps/server/src/index.ts`, or `scripts/verify.mjs` |
| Migration lane | `packages/db/**` forbidden to both; no lease granted; latest migration remains `0005` |
| Environment schema | `packages/env/**` forbidden to both; `CRON_SECRET` belongs to `phase7-integration`, verified absent today |
| Verification interference | Neither has a browser, accessibility, or visual gate, so no Playwright port, canonical screenshot, or `/staff` contention |
| Uniqueness | Distinct branch, worktree, run ID, port, and disposable database; the checker asserts branch, worktree, and lease uniqueness across active milestones |
| Shared read surface | Both read Phase 3 schedule/business-day and the Phase 5 command/actor model. Reads need no lease; `packages/api/src/occupancy/business-day.ts`, `schedule.ts`, and `bands.ts` are forbidden to write for both |

The one genuine adjacency is that Phase 6 freezes the device contract over which a Phase 7 reset is
eventually delivered. That coupling lands in `phase7-integration`, which depends on `phase-6` in the
DAG anyway. The evaluator decides *when* a reset is due, not how it is transported, so the parallel
pair does not create a contract race.

## Slice scope

| Slice | State | Branch / worktree | Contract |
| --- | --- | --- | --- |
| `phase-6` | `READY` | `work/phase6-offline-b01` / `D:/Projects/fitway-worktrees/phase6-offline` | `PHASES.md` Phase 6, ADR-003, ADR-008 decision 6, `SPEC.md` edge/reconciliation semantics |
| `phase7-reset-evaluator` | `READY` | `work/phase7-reset-evaluator-b01` / `D:/Projects/fitway-worktrees/phase7-reset-evaluator` | `PHASES.md` Phase 7, ADR-004, `SPEC.md` reset semantics |

No Phase 8, 10-UI, 11, or 12 slice is activated. `phase-7` remains coordinator-owned.

## Resources and verification profile

| Slice | Run ID | Port (reserved) | Disposable database | Run-owned output |
| --- | --- | ---: | --- | --- |
| `phase-6` | `p6_offline_b01` | 20663 | `fitway_integration_p6_offline_b01` | `D:/Projects/fitway-worktrees/phase6-offline/output/playwright/p6_offline_b01` |
| `phase7-reset-evaluator` | `p7_reset_eval_b01` | 20669 | `fitway_integration_p7_reset_eval_b01` | `D:/Projects/fitway-worktrees/phase7-reset-evaluator/output/playwright/p7_reset_eval_b01` |

Both ports are unused by any existing record. Both profiles are registered in `scripts/verify.mjs`
by this commit, with `browserFiles: []`; the ports are reserved for uniqueness only, since neither
slice has a browser gate. `scripts/verify.mjs` stays coordinator-owned and forbidden to both
workers. Canonical screenshots stay read-only.

## Leases

`phase-6` holds one exclusive lease through 2026-08-16T18:30:00+03:00 over the edge protocol
spine: `packages/api/src/edge-push.ts` and `edge-push.test.ts`, `apps/server/src/edge-push.ts`,
`apps/server/src/openapi.ts`, `packages/api/src/occupancy/engine.ts` and `engine.test.ts`,
`apps/server/src/occupancy-repositories.ts`, and `edge/**`. This is the minimum required to freeze
the device/OpenAPI contract and prove fixture parity, and it reuses the lease shape already used
once on this repository. It explicitly excludes `packages/db/**`, the router/context/server-index
lane, `packages/env/**`, and every `apps/web` surface.

`phase7-reset-evaluator` holds no lease and has every leased path in its `forbiddenPaths`.

## Activation invariant

This commit contains only coordinator state, the two launch contracts, the verification-profile
registration, and the phase records. It contains no implementation, no schema change, no migration,
no UI, and no speculative dependency edit. Each worktree must be clean and point exactly here, and
its parent must be `0648648`.

## Rollback boundary

`06486487914c5a78afb3aa6e264e6988e0c5cb85`. This activation is a single revertible commit touching
`PROJECT_STATE.yaml`, `scripts/verify.mjs`, and three new Markdown files. Reverting it returns both
milestones to `PLANNED` and leaves every other stream untouched.
