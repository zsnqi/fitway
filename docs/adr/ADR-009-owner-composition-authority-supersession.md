# ADR-009: Owner composition authority is superseded for redesign

- Status: Accepted by human decision
- Date: 2026-09-15
- Supersedes ADR-007 in part, limited to Owner composition authority

## Context

The 2026-09-15 design-agent environment diagnosis
(`docs/phase-records/handoffs/coordinator/20260915-165423-design-agent-environment-diagnosis.md`)
found that the accepted Owner topology itself encodes weak composition: wide form-heavy rows,
limited role differentiation, and overextended horizontal structure are already present in the
approved Paper exports and promoted canonicals (diagnosis root cause 1 at `:132-150`,
`:134-138`). The repair that followed
(`docs/phase-records/handoffs/coordinator/20260915-183000-design-agent-environment-repair-r01.md`)
recorded three outstanding human decisions at §7: the disposition of the frozen
`owner-governance-layout-recomposition-r02` candidate, the per-surface Owner authority status,
and a scoped ADR-007 amendment enabling Owner composition redesign.
`docs/design/OWNER_COMPOSITION_REDESIGN_READINESS.md` carried the decision requests and a draft
scoped amendment with no authority.

On 2026-09-15 the human decision-maker answered in session. The durable human record is
`docs/phase-records/handoffs/coordinator/20260915-185500-human-owner-visual-authority-decision.md`.
This ADR records the binding decision.

## Decision

1. **The current Owner visual composition is not approved as the design to preserve.** The Owner
   surfaces are `owner-shared-navigation`, `owner-daily`, `owner-reports`, `owner-access`,
   `owner-activity-log`, `owner-system-status`, and `owner-settings`.
2. **The previous Owner composition authority is superseded.** The previous Owner Paper
   compositions, their accepted canonical routed screenshots, the accepted-case authority
   mappings, and the frozen `owner-governance-layout-recomposition-r02` candidate are superseded
   as composition authority. They remain immutable provenance and comparison references only.
   They must not constrain the redesign, must not be cited as acceptance authority, and must not
   be used to reject a redesign for differing from them.
3. **No Owner composition authority is in force** until a new concept is approved through the
   concept-selection gate and the perceptual-promotion gate in `docs/WORKFLOW.md` ("Design work:
   authority, concepts, and perceptual gates"). The per-surface state is recorded in
   `docs/design/VISUAL_AUTHORITY_STATUS.md`.
4. **Public, Staff, and Login composition authority under ADR-007 is unaffected.** Login is not an
   Owner surface.
5. **Paper remains the visual source of truth** for every surface where ADR-007 applies and no
   supersession is recorded here.

## What remains binding

Nothing in this ADR changes behavior, semantics, or non-visual contracts. In particular:

- `FITWAY_PRODUCT.md` and `SPEC.md` behavior, data semantics, privacy, security, accessibility,
  and exact copy fixed by those sources or by the message catalogs remain binding.
- `DESIGN_GUIDE.md` system rules remain binding: palette and token baseline, Cairo weights, static
  atmosphere, RTL and localization, interaction and motion, the responsive contract, the
  accessibility baseline, and the phase visual gate.
- Owner route and deep-link behavior, loading/empty/error/conflict/recovery state semantics,
  CSV/export behavior, and analytics semantics remain binding.
- `docs/adr/ADR-008-staff-monitoring-only.md` remains binding.
- Approval and promotion remain separate: no baseline, canonical, manifest, or authority hash is
  regenerated, promoted, or silently changed by this ADR or by any redesign session. Canonical
  promotion remains a separate serialized action requiring explicit human approval.

## Copy handling

Wording that exists only in superseded Owner frames becomes reference, not authority. Copy
required or locked by `FITWAY_PRODUCT.md`, `SPEC.md`, or the message catalogs remains binding.
Deliberate copy changes made during the redesign must be recorded in the approved concept or
acceptance record.

## Canonical screenshots

Until an approved redesign replaces them through the separate human-approved promotion pass, the
existing Owner canonical files remain regression evidence of the current implementation. They are
not design authority and cannot reject a redesign for differing from them.

## Consequences

- Future sessions must not cite the superseded Owner Paper frames, the Owner canonical routed
  screenshots, the accepted-case authority mappings, or the frozen r02 candidate as Owner
  composition authority.
- The Owner redesign must start from an explicitly owned clean candidate frontier, not from the
  preserved dirty frontier.
- The deferred semantic-composition-primitives work remains deferred until after concept
  selection (`docs/design/OWNER_COMPOSITION_REDESIGN_READINESS.md`, "Deferred design-system
  item").
- The draft scoped ADR-007 amendment in `docs/design/OWNER_COMPOSITION_REDESIGN_READINESS.md` is
  superseded by this ADR.

## References

- Decision record:
  `docs/phase-records/handoffs/coordinator/20260915-185500-human-owner-visual-authority-decision.md`
- Diagnosis:
  `docs/phase-records/handoffs/coordinator/20260915-165423-design-agent-environment-diagnosis.md`
- Repair handoff (decision requests at §7):
  `docs/phase-records/handoffs/coordinator/20260915-183000-design-agent-environment-repair-r01.md`
- Per-surface register: `docs/design/VISUAL_AUTHORITY_STATUS.md`
- Paper-versus-Guide conflict map: `docs/design/PAPER_GUIDE_CONFLICT_MAP.md`
