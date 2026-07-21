# Batch 02 reactivation record

- Status: `DONE`; both verified slices integrated and Batch 02 closed by
  `docs/phase-records/batch-02-integration.md`
- Supersedes: `docs/phase-records/batch-02-activation.md` (activation commit
  `bf06c8842b84a5ed539722acfd16998aabb9e373`, activated `2026-07-17T13:30:00+03:00`)
- Integrated feature baseline: `f043611a4bfa9f208b06e51c90aa54affeb87d34` (unchanged)
- Coordinator reactivation commit: `SELF`
- Coordinator branch: `main`
- Reactivated at: `2026-07-21T18:45:00+03:00`
- Renewed lease expiry (both slices): `2026-07-23T18:45:00+03:00`
- Feature implementation in this commit: none

## Trigger

The batch 02 leases for `phase4-staff-web` and `phase8-alert-evaluator` expired at
`2026-07-19T13:30:00+03:00` before either worker session began execution. Both workers
correctly stopped `NEEDS_HUMAN` at startup per `docs/WORKFLOW.md` ("an expired lease requires
coordinator renewal and immediate `NEEDS_HUMAN`"). Neither worker made any commit or
working-tree change; both slices remained `READY` in the ledger and no ownership was ever
taken. This record is the coordinator renewal resolving that stop.

## Revalidation evidence (2026-07-21)

- **Integrated state** — `main` HEAD was still the superseded activation commit `bf06c88`;
  no integration, shared-spine, or contract drift occurred since activation.
  `git rev-parse bf06c88^` = `f043611a4bfa9f208b06e51c90aa54affeb87d34`.
- **Dependencies** — `phase4-auth`, `phase4-health`, `baseline-reconciliation-gate`, and
  `phase-3` are all `DONE` in `PROJECT_STATE.yaml` with integrated commits recorded.
- **Branches/worktrees** — `work/phase4-staff-web-b02` at
  `D:/Projects/fitway-worktrees/phase4-staff-web` and `work/phase8-alert-evaluator-b02` at
  `D:/Projects/fitway-worktrees/phase8-alert-evaluator` were both exactly at `bf06c88` with
  clean `git status --short`. Both are preserved and fast-forwarded to this reactivation
  commit; no branch or worktree was recreated.
- **Ownership and leases** — owned paths, forbidden paths, and shared leases are carried
  forward byte-identical from the superseded contracts; the two slices remain disjoint on
  every axis (paths, migration lane, shared spine, resources) per the superseded record.
- **Migration lane** — `packages/db/src/migrations/` contains exactly `0000`–`0003`; the
  `0004` lane leased to `phase8-alert-evaluator` is free.
- **Verification profiles** — `phase4-staff-web` (focused browser spec, no integration
  files) and `phase8-alert-evaluator` (focused integration test, no browser files) remain
  registered in `scripts/verify.mjs`.
- **Ports** — `18412` and `19517` verified free (no listener).
- **Databases** — the guarded Postgres container `fitway-phase2-postgres`
  (`postgres:17-alpine`, listener `127.0.0.1:55432`) was found stopped (Docker Desktop was
  not running); the coordinator started Docker Desktop and the container.
  `fitway_integration_p4_staff_b02` and `fitway_integration_p8_alert_b02` both exist and are
  pristine (zero tables in `public`): the b02 run IDs were never consumed.
- **Output roots** — `output/playwright/<run-id>` is absent in both worktrees and `output/`
  is gitignored; no stale artifacts exist.

## Disposition

- **Renewal, not reallocation.** Because no execution began and every allocated resource is
  intact and unconsumed, the branches, worktrees, run IDs (`p4_staff_b02`, `p8_alert_b02`),
  ports, disposable databases, and output roots from the superseded record are reissued
  unchanged under a renewed 48-hour lease expiring `2026-07-23T18:45:00+03:00`.
- **New activation point.** This coordinator-only commit supersedes `bf06c88` as the
  activation point. Both worker branches were fast-forwarded to it; the ledger's
  `baseCommit: SELF` for both slices now means this reactivation commit.
- **New binding handoffs** (each incorporates its superseded 2026-07-17 contract by
  reference, amending only lineage, lease, startup checks, and resume command):
  - `docs/phase-records/handoffs/phase4-staff-web/20260721-184500-p4_staff_b02.md`
  - `docs/phase-records/handoffs/phase8-alert-evaluator/20260721-184500-p8_alert_b02.md`
- The superseded activation record and 2026-07-17 handoffs are retained unmodified apart
  from a supersession pointer on the activation record's status line; history is preserved.

## Activation invariant (amended)

This reactivation commit is coordinator-only and sits directly on top of the superseded
activation commit `bf06c88842b84a5ed539722acfd16998aabb9e373`, which remains the sole child
of the integrated baseline `f043611a4bfa9f208b06e51c90aa54affeb87d34`. It contains only this
record, the two renewed launch contracts, the supersession pointer, and the live ledger
update. Both worker branches start at this reactivation commit: before feature work begins,
`git rev-parse HEAD^` must resolve to the superseded activation commit and
`git rev-parse HEAD~2` to the integrated baseline. All batch 02 selection, concurrency-safety,
verification-gate, merge-order, and stop-condition rules in the superseded record remain in
force unchanged.
