# Human decision — Owner visual composition authority supersession

- Recorded: 2026-09-15 18:55 +03:00.
- Authority: Human decision-maker, in-session, 2026-09-15.
- Scope: Owner visual composition authority for `owner-shared-navigation`, `owner-daily`,
  `owner-reports`, `owner-access`, `owner-activity-log`, `owner-system-status`, and
  `owner-settings`.
- Status: `RECORDED — binding`.
- Binding authority record: `docs/adr/ADR-009-owner-composition-authority-supersession.md`.
- Related: repair handoff §7 decision requests
  (`docs/phase-records/handoffs/coordinator/20260915-183000-design-agent-environment-repair-r01.md`);
  decision-request package with the superseded draft amendment
  (`docs/design/OWNER_COMPOSITION_REDESIGN_READINESS.md`).

## Decision as stated by the human

1. **Not approved as the design to preserve.** The current Owner visual composition is not
   approved as the design to preserve.
2. **No constraint on the redesign.** The existing r02 candidate and the older Owner
   visual/canonical composition must not constrain the upcoming Owner redesign.
3. **Historical artifacts are provenance only.** Historical artifacts remain provenance/reference
   only; they must be removed or superseded from active visual authority so future agents are not
   pulled back toward the current topology.
4. **Non-visual contracts preserved.** Product behavior, data semantics, privacy/security,
   accessibility requirements, and explicitly approved non-visual contracts are preserved.
5. **Public and Staff stay out of scope.** Public and Staff remain outside this Owner redesign
   unless evidence requires otherwise.
6. **Reconcile the records; do not redesign yet.** Reconcile the design-authority records
   accordingly, including the outstanding human-decision items from the repair handoff. Do not
   redesign the UI yet.

## Immediate effect

- **Superseded records.** Owner composition authority carried by the previous Owner Paper
  compositions, their accepted canonical routed screenshots, the accepted-case authority mappings,
  and the draft scoped ADR-007 amendment is superseded as composition authority; they become
  immutable provenance and comparison references only. ADR-009 is the binding record.
- **r02 disposition.** `owner-governance-layout-recomposition-r02` is not adopted as the design to
  preserve. The candidate is preserved as provenance and must not constrain the redesign, be cited
  as acceptance authority, or be used to reject a redesign for differing from it.
- **Register state.** No Owner composition authority is in force until a new concept is approved
  through the concept-selection gate and the perceptual-promotion gate in `docs/WORKFLOW.md`. The
  per-surface state is recorded in `docs/design/VISUAL_AUTHORITY_STATUS.md` by the subsequent
  register update.
- **Unaffected surfaces.** Public, Staff, and Login composition authority under ADR-007 is
  unaffected; Login is not an Owner surface.
- **Still binding.** `FITWAY_PRODUCT.md` and `SPEC.md` behavior, data semantics, privacy/security,
  accessibility, and exact copy fixed by those sources or the message catalogs; `DESIGN_GUIDE.md`
  system rules; Owner route and deep-link behavior, state semantics, CSV/export behavior, and
  analytics semantics; `docs/adr/ADR-008-staff-monitoring-only.md`; approval/promotion separation
  and the ban on silent baseline regeneration. Canonical promotion remains a separate serialized
  action requiring explicit human approval.

## Limits of this record

This record grants no UI redesign and no code change. It authorizes no Paper, canonical, manifest,
hash, baseline, source, or product change. The next gate is the fresh independent audit of the
repaired design-agent environment charged in
`docs/phase-records/handoffs/coordinator/20260915-183000-design-agent-environment-repair-r01.md`
§9; concept selection may begin only after that audit passes and the records above are reconciled.

## Authority

`docs/adr/ADR-009-owner-composition-authority-supersession.md` is the binding authority record for
this decision. Where any summary, register, or derived view disagrees with ADR-009, ADR-009
governs.
