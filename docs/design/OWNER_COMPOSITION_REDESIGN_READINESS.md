# Owner composition redesign — decisions recorded

> **Authority status: DECISIONS RECORDED — DERIVED VIEW — NOT AUTHORITY.** This document records
> the answers the 2026-09-15 human decision gave to the three decision requests prepared in the
> WS-C package. `docs/adr/ADR-009-owner-composition-authority-supersession.md` (ADR-009) is the
> binding decision. This document creates no authority, grants no approval, and changes no locked
> product, privacy, security, accessibility, content, or visual decision by itself. No UI, source,
> Paper, canonical, manifest, or baseline change is authorized by this document. The binding
> per-surface status is in `docs/design/VISUAL_AUTHORITY_STATUS.md`; the frozen r02 candidate stays
> frozen as provenance. Where this document and ADR-009 disagree, ADR-009 governs.

- Prepared: 2026-09-15 (WS-C of the design-agent environment repair; documentation only).
- Updated: 2026-09-15 (WS-G of the design-agent environment repair; documentation only) to record
  the human decision.
- Why now: repeated weak Owner outcomes were diagnosed as a design-authority and acceptance-system
  failure, with weak topology already encoded in Paper and promoted canonicals; a frozen candidate
  and a dirty Owner frontier were waiting on explicit human disposition
  (`docs/phase-records/handoffs/coordinator/20260915-165423-design-agent-environment-diagnosis.md:10-23`,
  `:132-150`, `:323-331`).
- Status: all three decision requests below were answered on 2026-09-15. The human record is
  `docs/phase-records/handoffs/coordinator/20260915-185500-human-owner-visual-authority-decision.md`;
  ADR-009 is the binding authority record.

## Decision 1 — disposition of `owner-governance-layout-recomposition-r02`: DECIDED

**Decided (2026-09-15):** the candidate is **not adopted as the design to preserve**; it is
preserved as provenance and must not constrain the redesign, be cited as acceptance authority, or
be used to reject a redesign for differing from it (ADR-009 decision 2; decision record "r02
disposition"). It remains frozen and immutable as a comparison reference.

The candidate is terminal `NEEDS_HUMAN`. It implements the recorded Owner governance recomposition
(centered ≤1040px compact governance rail, separator-only section rails, flat 16px sections, 28px
dominant data boards across Settings, Access, Activity, Reports, and Health; Daily and the shared
six-destination navigation are not recomposed). No canonical, Paper, manifest, or authority-hash
promotion occurred (`PROJECT_STATE_HISTORY.yaml:3506`, `:3530`;
`docs/phase-records/handoffs/owner-demo-polish/20260915-owner-governance-layout-recomposition-r02.md:3`,
`:17`, `:26`).

Review evidence (retained for provenance, not a pending review):

- Handoff: `docs/phase-records/handoffs/owner-demo-polish/20260915-owner-governance-layout-recomposition-r02.md`
  (status and failure/hypothesis at `:3`, `:9-13`; evidence inventory at `:21-27`).
- r02 closure frames: `output/playwright/owner_gov_r02_closure_visual/review/owner-hourly-focused-en-390x844.png`,
  `output/playwright/owner_gov_r02_closure_visual/review/owner-hourly-focused-ar-390x844.png`,
  `output/playwright/owner_gov_r02_closure_visual/review/owner-settings-en-200-percent-reflow.png`
  (r02 handoff `:24`).
- Full exact-source native matrix: `output/playwright/owner_governance_visual_r02/review/` (20/20,
  r02 handoff `:25`).
- r01 before/after pairs: `output/playwright/owner_review_20260915074442/review/` versus
  `output/playwright/owner_governance_visual_r01/review/`
  (`docs/phase-records/handoffs/owner-demo-polish/20260915-owner-governance-layout-recomposition-r01.md:38-44`).
- Blocking history to re-check in any future primitive or concept work: r01 rejection (clipped
  Hourly painted focus outline; Settings dirty-valid overlap at 320px/200%) at r01 handoff `:48-52`;
  r02 red-before/green-after assertions at r02 handoff `:21`.
- Perceptual-gate requirement for any future acceptance: name the exact full-resolution frames
  inspected (`docs/WORKFLOW.md:255-260`). The current status of the frozen candidate is also
  recorded in `docs/design/VISUAL_AUTHORITY_STATUS.md` ("Frozen candidate").

## Decision 2 — visual-authority status per Owner surface: DECIDED

**Decided (2026-09-15):** the previous Owner composition authority is superseded for all seven
Owner surfaces, and no Owner composition authority is in force until a new concept is approved
through the concept-selection gate and the perceptual-promotion gate in `docs/WORKFLOW.md`
(ADR-009 decisions 1-3). The register records the fifth status for each surface:
`Owner composition redesign authorized — composition authority vacant; prior composition and
canonicals reference-only (ADR-009)`
(`docs/design/VISUAL_AUTHORITY_STATUS.md`). Prior Owner Paper compositions, accepted canonical
routed screenshots, accepted-case authority mappings, and the frozen r02 candidate are provenance
and comparison references only (ADR-009 decision 2).

Surfaces in scope: `owner-shared-navigation`, `owner-daily`, `owner-reports`, `owner-access`,
`owner-activity-log`, `owner-system-status`, `owner-settings`
(`visual-direction-gate/approved/paper-route-authority-20260902/AUTHORITY_MANIFEST.yaml:247-254`,
`:267-273`, `:340-346`, `:389-395`, `:428-437`, `:469-478`, `:512-519`).

Context that informed the decision: the diagnosis recommended deciding per surface so that agents
know whether to preserve Paper topology or to redesign through the concept gate (diagnosis workflow
change 2, `:333-342`); the audit and diagnosis identify composition-quality concerns concentrated
in Settings, Reports, and the Activity Log filter surface
(`docs/phase-records/handoffs/owner-demo-polish/20260912-owner-presentation-audit-r01.md:22-30`;
diagnosis `:134-138`). Those concerns are now redesign inputs, not authority conflicts; the prior
status-1 treatment is no longer binding for any Owner surface.

## Decision 3 — scoped ADR-007 amendment for Owner composition: DECIDED

**Decided (2026-09-15):** the draft scoped amendment is ratified as ADR-009
(`docs/adr/ADR-009-owner-composition-authority-supersession.md`, status "Accepted by human
decision"). ADR-009 supersedes ADR-007 in part, limited to Owner composition authority; Public,
Staff, and Login composition authority under ADR-007 is unaffected.

The draft amendment text that previously appeared in this document is superseded by ADR-009. It is
not reproduced, maintained, or given any effect here; ADR-009 governs. Any future composition change on
an Owner surface proceeds only through the concept-selection and perceptual-promotion gates, and
canonical promotion remains a separate serialized action requiring explicit human approval.

## Deferred design-system item — semantic composition primitives

A small, deliberate Owner composition layer — page/governance rail, section rail, content board,
compact data surface, action region, responsive grouping/stack, and stable heading/navigation
slots — remains **deferred** until after concept selection for the Owner redesign (ADR-009
consequences; diagnosis workflow change 9, `:414-426`). Introducing primitives before the topology
is chosen would encode the incumbent or candidate layout as a system.

The untracked `apps/web/src/components/owner/owner-layout.css` (55 lines) is **evidence only, not
authority**: it introduces local `owner-governance-rail`, `owner-section-rail`,
`owner-section-surface`, and `owner-data-board` roles, but it is part of the unapproved dirty
frontier. It carries a clipped-outline regression history: its `overflow: clip` on the section
surface and data board (`apps/web/src/components/owner/owner-layout.css:17`, `:25`) outranked a
keyboard-scrollable region in the earlier candidate, and the r01 independent review found that a
16px wrapper clipped a trigger's outward painted focus outline
(`docs/phase-records/handoffs/owner-demo-polish/20260915-owner-governance-layout-recomposition-r01.md:26`
and `:50-52`; diagnosis root cause 5 at `:204-220`, including `:220`). Any future primitive work must
be reviewed against that history before reuse.

## Next steps (recorded order)

1. **Fresh independent audit of the repaired and superseded environment.** The audit charged in
   `docs/phase-records/handoffs/coordinator/20260915-183000-design-agent-environment-repair-r01.md`
   §9 must pass before anything below starts (decision record "Limits of this record").
2. **Concept selection for the Owner redesign — only after the audit passes.** Two or three
   whole-page alternatives, judged by the concept-selection gate in `docs/WORKFLOW.md` ("Design
   work: authority, concepts, and perceptual gates"), using the active design packet
   `docs/design/ACTIVE_DESIGN_PACKET_TEMPLATE.md`.
3. **Semantic composition primitives remain deferred** until after concept selection.
4. **The redesign must start from an explicitly owned clean candidate frontier**, not the preserved
   dirty frontier (ADR-009 consequences).

## Explicit freeze statement

No UI, source, Paper, canonical, manifest, hash, test, data, credential, deployment, or release
change is authorized by this document. The 2026-09-15 reconciliation that produced this update
changed no UI and authorized no implementation. The preserved dirty Owner frontier remains
preserved exactly as it stands; any redesign must start from a new, explicitly owned clean
candidate frontier (ADR-009).
