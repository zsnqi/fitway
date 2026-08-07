# phase5-staff-ui — monitoring-only closeout, ready for integration

- Status: `READY_FOR_INTEGRATION`. Not `DONE` — a green worker branch never is. Nothing pushed.
- Base commit / candidate commit: `229b9ce…` (`M0`) / `a2936e5`
- Branch / worktree / run ID: `work/phase5-staff-ui-b03-retry` /
  `D:/Projects/fitway-worktrees/phase5-staff-ui-retry` / `p5_staff_b03_retry`
- `main` at handoff: `cd8b8a9`. `main` is still a strict ancestor of the branch apart from the
  three coordinator ledger commits `dfd77c0`, `c00f98a`, `cd8b8a9`, which no worker file depends on.

## What was completed

Five commits on `608c1f8`, in order:

| Commit | Author role | Content |
| --- | --- | --- |
| `63bc227` | worker | ADR-008 plus every normative document it makes true — SPEC, PRODUCT, PHASES, DESIGN_GUIDE, ADR-003 supersession note, ADR index — in **one atomic commit**, so no interval exists where an ADR and a normative document disagree |
| `f5bc29e` | worker | The retirement: `staff.issueCorrection`, `staff.issueReset`, `staff.recentCommands`, the dead helpers and imports, `commandService` out of the oRPC context, and the branch-only command UI |
| `8e6a7c8` | worker | `phase5-command-domain.integration.test.ts` re-proved through direct service calls; the monitoring/login salvage; `staff.description` reverted; `docs/phase-records/phase-05-staff-ui.md` |
| `3fac5ad` | **coordinator** | `scripts/verify.mjs` profile repoint — withheld from the worker lease by design |
| `a2936e5` | coordinator | Documentation-only repair after independent review |

`apps/web/src/routes/staff.tsx` and `routeTree.gen.ts` are byte-identical to `main`: nothing was
removed from the running UI, because the command UI was never merged.

## Decisions made, and by whom

- **Human, before this session** — the six monitoring-only decisions in the closeout plan. Locked.
- **Coordinator (MAIN), this session** — (1) remove the `commandService` field from `context.ts`
  rather than leaving it inert, since an inert injected service is a standing re-exposure path;
  (2) treat plan "Step 0" as obsolete, superseded by Wave 0 and the M0 reconciliation;
  (3) ratify the `command-repository.test.ts` DELETE against a CONSTRAINED WRITE lease, recorded on
  the lease itself in `PROJECT_STATE.yaml`; (4) point the repointed profile's `integrationFiles` at
  `phase5-command-domain.integration.test.ts`, closing open question 3, since the ledger declares
  this slice's `integration` gate required and the list was empty.
- **Not decided, deliberately** — Decision 6 (`operationalSnapshotSchema.source`) stays deferred.

## Verification performed

`pnpm verify:phase --phase phase5-staff-ui` ran green **twice at `a2936e5`**: once by the
coordinator (`p5_staff_b03_retry`, port `20645`) and once by an independent verifier from a clean
session with its own run id (`p5_verify_indep`), its own disposable database, and port `20647`.
Each run: invariants PASS (31 milestones, 8 canonical screenshots), Biome 211 files clean, all
workspace type checks PASS, 35 unit files / 138 tests PASS, 5 simulator tests PASS, 4/4 integration
blocks PASS, 10/10 `phase4-staff-web` browser tests PASS, mutation guard clean. Both worktrees
`git status --porcelain` empty.

Independent verification verdict: **PASS**, minor findings only. The reviewer reported and did not
repair; the coordinator scoped the repair (`a2936e5`) and applied it.

Environment note that costs an hour if unknown: the browser gate only passes from **PowerShell** —
Git Bash mangles `VITE_SERVER_URL=/api` into a Windows path via MSYS conversion and silently fails
all ten tests. The `fitway-phase2-postgres` container must be running. An untracked machine-local
`.claude/launch.json` in the worktree was Biome-formatted in place so it stops blocking the ladder;
no tracked source and no `biome.json` entry changed.

## What remains

1. **Coordinator integration of the candidate into `main`**, then `pnpm verify:full` at the batch.
   `accessibility` and `visual` gates are `PENDING` for exactly this reason and are provable only
   there.
2. **Human confirmation that `/staff` shows no command affordance** — the plan's validation item 7.
   No automated negative control exists: the deliverable is an *absence*, and the repointed browser
   profile runs Phase 4 monitoring coverage, so reintroducing a command control would fail no test.
3. **`phase-5` aggregate closure** once `phase5-staff-ui` reaches `DONE`.

Carried forward, each outside this slice's leases and recorded in
`docs/phase-records/phase-05-staff-ui.md`:

- `SPEC.md:496-498` still lists "pending command status" in the operational snapshot while the
  frozen DTO at `packages/api/src/health/snapshot.ts:41-50` has no such field. Pre-existing on
  `main`; a spec/implementation mismatch, **not** a surviving command-surface requirement, since
  reading pending status is monitoring rather than issuance.
- `RESEARCH.md:283` and `:576` still mention manual fallback and staff correction/reset usability.
  Provenance, not normative.
- `apps/server/src/command-repository.ts:208` exports `commandService` with no current consumer.
  Deliberate — Phase 7's cron route calls it.

## Blockers

None. No `NEEDS_HUMAN` condition arose.

## Recommended next session

Coordinator integration: merge or cherry-pick the five candidate commits into `main` in order, run
`pnpm verify:full` at the integrated head, set `accessibility` and `visual` from that run, record
the integrated commit, release the four leases, and mark `phase5-staff-ui` `DONE`. Then close the
`phase-5` aggregate. Do not begin Phase 10 or Phase 11 in the same session.
