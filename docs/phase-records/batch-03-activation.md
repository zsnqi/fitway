# Batch 03 first-wave activation

- Status: `READY`; no worker launched, no feature code, no push/deploy
- Verified feature baseline: `94b76a8c58a499976b84dd1a0d177846442cf5cc`
  (`main`, clean; Phase 4 aggregate closure)
- Coordinator activation commit: `SELF`; it is the only child of the verified baseline
- Activated: 2026-07-21T22:11:26+03:00; active lease expiry: 2026-07-23T22:11:26+03:00

## First-wave scope

| Slice | State | Branch / worktree | Contract |
| --- | --- | --- | --- |
| `phase5-command-domain` | `READY`, unlaunched | `work/phase5-command-domain-b03` / `D:/Projects/fitway-worktrees/phase5-command-domain` | `phase-05-command-domain.md` and its handoff |
| `phase9-owner-ui` | `READY`, unlaunched | `work/phase9-owner-ui-b03` / `D:/Projects/fitway-worktrees/phase9-owner-ui` | `phase-09-owner-ui.md` and its handoff |
| `phase5-staff-ui` | `PLANNED`, waiting/unactivated | none | waiting handoff only |

`phase-5` now depends on both Phase 5 slices and remains coordinator-owned. `phase-9` remains
coordinator-owned and continues to depend on its integrated domain slice and owner UI slice.
No Phase 6, 7, 8 integration, 9 aggregate, 10, or 11 slice is activated.

## Resources and verification profiles

| Slice | Run ID | Port | Disposable database | Run-owned output |
| --- | --- | ---: | --- | --- |
| `phase5-command-domain` | `p5_command_b03` | 20615 | `fitway_integration_p5_command_b03` | `D:/Projects/fitway-worktrees/phase5-command-domain/output/playwright/p5_command_b03` |
| `phase9-owner-ui` | `p9_owner_b03` | 20629 | `fitway_integration_p9_owner_b03` | `D:/Projects/fitway-worktrees/phase9-owner-ui/output/playwright/p9_owner_b03` |
| `phase5-staff-ui` (reserved only) | `p5_staff_b03` | 20643 | `fitway_integration_p5_staff_b03` | `D:/Projects/fitway-worktrees/phase5-staff-ui/output/playwright/p5_staff_b03` |

All names are unique; the two active ports were free and their databases absent at activation.
The Phase 5 staff reservation is not provisioned or launchable until its dependency and lease
conditions close. Every focused command sets all resource variables shown in its binding
handoff. New profiles are `phase5-command-domain`, `phase9-owner-ui`, and the reserved
`phase5-staff-ui`; each remains non-writing outside ignored run output. Canonical screenshots
at `tests/browser/__screenshots__` are read-only.

## Exclusive leases and sequencing

1. `phase5-command-domain` alone holds migration `0005`, the edge protocol spine, and router
   lane A through the active expiry. It may change only its explicit files. Its candidate needs
   focused verification and fresh independent review before integration.
2. `phase9-owner-ui` concurrently holds the message catalogs, StaffShell/admin navigation, and
   routeTree regeneration lease. It does not edit API/server aggregation while router lane A is
   active; it builds to the frozen analytics DTO and records non-canonical review evidence.
3. After Phase 5 command domain independently verifies and integrates, the coordinator reviews
   its post-merge focused evidence, releases lane A, and may record a new router lane B transfer
   to Phase 9. Lane B is not granted by this activation commit. Only then can Phase 9 wire the
   frozen owner analytics leaf and integration test.
4. `phase5-staff-ui` remains unactivated until Phase 5 command domain has independently
   verified and integrated; it additionally needs a newly recorded catalog/shell lease after
   Phase 9 releases its current lease. Its later activation rechecks the then-current clean
   integrated baseline and uses a new activation commit if one is needed.

Both candidates require a fresh independent verifier, scoped diff review, their focused profile
with a different run ID/database/port/output, and the standard stop conditions. Integration is
serialized across shared spines; only the coordinator can integrate or mark a slice/aggregate
`DONE`.

## Activation invariant

This commit contains only coordinator state, frozen contracts, launch handoffs, and verification
profile registration. It contains no implementation. The two worker branches/worktrees must be
clean and point exactly here; their parent must be the verified Phase 4 aggregate closure.
