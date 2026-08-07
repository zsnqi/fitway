# ADR-008: `/staff` is monitoring-only

- Status: Accepted by human decision
- Date: 2026-08-06
- Supersedes ADR-003 in part, limited to the staff manual-fallback clause

## Context

Phase 5 delivered a command domain — queue, service, supersession, edge delivery and
acknowledgement, and transactional audit — and exposed two staff-facing oRPC mutations,
`staff.issueCorrection` and `staff.issueReset`. A candidate staff command UI was built on a worker
branch and never merged.

The design phase that closed in Paper on 2026-08-05 approved `STAFF MONITORING PRODUCTION SET —
CURRENT` with no command controls. ADR-007 made Paper the visual source of truth for composition
while leaving behavior to the repository, so the omission read as an open question rather than a
decision: either the Paper family was incomplete, or the staff command surface was not wanted.

Hussein resolved it on 2026-08-06. The omission is deliberate. This ADR records that resolution and
the code retirement it requires, so that no repository document continues to demand a surface the
product has withdrawn.

## Decision

### 1. `/staff` is permanently monitoring-only

`/staff` shows live occupancy, device health, and freshness. It carries no command centre, no
stepper correction, no direct count entry, no reset control, no reset confirmation dialog, and no
other staff-triggered operational command affordance. The approved Paper family is complete for
its intended scope.

### 2. The two staff-facing mutation endpoints are retired

`staff.issueCorrection` and `staff.issueReset` are removed from `appRouter`. They must not remain
as authenticated product mutations with no caller. The unmerged `staff.recentCommands` leaf, its
schema, and its repository reader are retired with them.

### 3. Internal command infrastructure is preserved

The command system is not cancelled. `CommandService`, the command queue, the `edge_commands`
schema and migration `0005`, edge push delivery and acknowledgement, supersession, backfill,
reconciliation and recovery behavior, the transactional audit path,
`createCommandServiceDatabase`, and the exported `commandService` singleton all remain. Phase 7's
cron route calls the service directly; the oRPC path was never on its way.

What changes is who may issue a command from a product surface: nobody. What does not change is
the lifecycle a command follows once issued.

### 4. Phase 6 introduces no staff-facing manual fallback

Automatic offline fallback, buffered backfill, reconnect ordering, reconciliation, and recovery
remain Phase 6 scope. A staff-triggered manual fallback — the mechanism ADR-003 described, in
which a staff direct entry both creates a pending command and immediately sets current state — is
withdrawn along with the surface that would have triggered it.

### 5. No owner or admin command surface replaces the retired controls

The retirement is not a relocation. `/admin` gains no correction, reset, or command-issuance
control to compensate. `FITWAY_PRODUCT.md`'s "staff operations plus …" description of the owner
means the owner may read the same operational view; it does not grant an owner command surface.

### 6. `operationalSnapshotSchema.source` is not altered here

The frozen operational snapshot DTO keeps its `manual` value. Whether a valid internal producer
of `source=manual` remains after decision 4 is a Phase 6 review item, recorded in `PHASES.md`. It
is neither resolved nor reopened by this ADR, and the enum value is not removed.

## Consequences

- `FITWAY_PRODUCT.md`, `SPEC.md`, `PHASES.md`, `DESIGN_GUIDE.md`, and ADR-003 are reconciled with
  this decision in the same commit that adds this ADR. No interval exists in which an ADR and a
  normative document disagree about whether staff may issue a command.
- ADR-003's lifecycle rules — durable, monotonic, auditable commands, latest-only supersession,
  and apply-before-live on reconnect — remain in force unchanged. Only its staff manual-fallback
  clause is superseded.
- Coverage that existed only at the retired oRPC boundary stops being provable. What it was, and
  what replaced it, is recorded in `docs/phase-records/phase-05-staff-ui.md`; it is not silently
  erased.
- `CommandActor` and `HumanAuditEntry` still model `shared_staff | owner`. After this decision no
  human issues a command through a product surface, and `SPEC.md` already names `system` as the
  scheduled-reset issuer. Reconciling the actor model with that is Phase 7 work and is not started
  here.
- This ADR implements no Paper production family. Implementing `STAFF MONITORING PRODUCTION SET —
  CURRENT` remains separate later work under ADR-007.

## Evidence and history

- Product resolution and its provenance: `docs/phase-records/paper-design-phase-closeout.md`,
  open question 4.
- Slice specification: `docs/phase-records/handoffs/phase5-staff-ui/20260806-155000-p5_staff_monitoring_only-plan.md`.
- Human visual verdict on the unmerged candidate:
  `docs/phase-records/handoffs/phase5-staff-ui/20260727-230622-p5_staff_b03_retry-human-visual-verdict.md`.
- Closeout record: `docs/phase-records/phase-05-staff-ui.md`.
