# Batch 01A activation record

- Status: `READY`; worker sessions not yet launched
- Approved feature baseline: `4df79885ef7e039dcf2d27eb87cf41f8c78b73e2`
- Coordinator activation commit: `SELF`
- Coordinator branch: `main`
- Activated at: `2026-07-16T13:10:48+03:00`
- Feature implementation in activation commit: none

## Selected slices

| Slice | Readiness reason | UI polish |
| --- | --- | --- |
| `phase4-auth` | Product/Spec/ADR contract is frozen; it exclusively owns the next auth schema/migration and principal/context lane | `NOT_REQUIRED`; backend-only slice |
| `phase9-analytics-domain` | Existing minute/settings history contains the required inputs; work remains additive and unexposed without an owner route | `NOT_REQUIRED`; domain/repository-only slice |

## Deferred candidates

- `phase4-health` remains `PLANNED` until auth and migration `0002` integrate. It then rebases and
  receives the next ordered migration plus edge transaction/repository lease. Running both from
  the baseline would create competing schema/migration histories.
- `phase4-staff-web` remains `PLANNED` until both auth and health integrate. The current login is
  explicitly nonconforming email/password, and no real `staff.operationalSnapshot` DTO exists.
  Its later polish owns `VIS-004`; `VIS-001` and `VIS-002` apply only if it leases and edits the
  shared atmosphere/shell. `VIS-003` remains Phase 6 work.

The execution dependencies in `PHASES.md` and `PROJECT_STATE.yaml` encode these waits so a later
coordinator cannot treat the old coarse batch proposal as permission to launch them early.

## Resource allocation

| Slice | Branch / worktree | Run ID / port | Disposable database | Output |
| --- | --- | --- | --- | --- |
| `phase4-auth` | `work/phase4-auth-b01` / `D:/Projects/fitway-worktrees/phase4-auth` | `p4_auth_b01` / `11406` | `fitway_integration_p4_auth_b01` | `output/playwright/p4_auth_b01` in its worktree |
| `phase9-analytics-domain` | `work/phase9-analytics-domain-b01` / `D:/Projects/fitway-worktrees/phase9-analytics-domain` | `p9_analytics_b01` / `22515` | `fitway_integration_p9_analytics_b01` | `output/playwright/p9_analytics_b01` in its worktree |

Both databases were provisioned in the guarded local Postgres container. Port `55432` is the
database listener; both assigned web ports were free at activation. Report and review directories
are `<output>/report` and `<output>/review`. Each worktree's canonical screenshot directory is
read-only and must not be updated by these non-UI slices.

## Shared-risk control and integration order

1. Review and integrate `phase9-analytics-domain` first because it is additive, owns only new
   modules, and has no shared lease or migration.
2. Review auth's migration and shared-spine diff, then integrate `phase4-auth` as the only holder
   of the schema/migration/context/router/server leases.
3. After each candidate, run its focused command with a fresh coordinator run ID/database.
4. After both integrate, run `pnpm verify:full` with a new exact disposable database and obtain a
   fresh independent review before either slice is marked `DONE`.
5. Release leases only after the integrated auth migration and repository state pass.

Merge stops on an out-of-scope path, migration ordering conflict, missing independent review,
public-v2 privacy regression, Product/Spec conflict, or any red required gate. A worker branch can
reach `READY_FOR_INTEGRATION`; only the coordinator can record `DONE`.

## Activation invariant

This coordinator-only activation commit is the sole child of the approved baseline and contains
only state, launch contracts, corrected execution dependencies, and focused verification profiles.
Worker branches start at this activation commit; `git rev-parse HEAD^` must resolve to the approved
baseline before feature work begins.
