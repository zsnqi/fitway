# FITWAY Paper-versus-Design-Guide conflict map

> **Authority status: DERIVED VIEW — NOT AUTHORITY.** This map creates no authority, grants no
> approval, and changes no locked product, privacy, security, accessibility, content, or visual
> decision by itself. It records only where an accepted Paper production is known to conflict with
> `DESIGN_GUIDE.md` §3–§14 or with the ADR-006 constraints retained by ADR-007, plus where that
> question is still unresolved. The guide and ADR-007 remain the governing texts; Paper governs the
> visual treatment under ADR-007. For the seven Owner surfaces, the 2026-09-15 human decision
> (`docs/adr/ADR-009-owner-composition-authority-supersession.md`, ADR-009) supersedes Paper
> composition authority, so their rows record that supersession instead of a Paper-versus-guide
> conflict. Where this map and a source disagree, the source governs.

- Recorded: 2026-09-15 (WS-C of the design-agent environment repair; documentation only).
- Fulfills the open item at `docs/phase-records/paper-design-phase-closeout.md:82` (open question 5:
  "The per-surface Paper-versus-`DESIGN_GUIDE.md` conflict list does not exist").
- Retained ADR-006 constraints that ADR-007 keeps in force until a specific approved Paper
  production materially conflicts with them: palette, actual Cairo weights, static atmosphere, the
  cumulative 28-bar public instrument, and the crowd-first public hierarchy
  (`docs/adr/ADR-007-paper-visual-source-of-truth.md:78-82`). ADR-007 states that it enumerates no
  such conflict and that establishing the per-surface list was implementation-phase work that had
  not been done (`:84-85`).

## Evidence rule

Every entry below cites an accepted artifact or accepted record; no inference is accepted as
evidence. Live Paper tools were not exposed during the 2026-09-15 diagnosis
(`docs/phase-records/handoffs/coordinator/20260915-165423-design-agent-environment-diagnosis.md:118-128`,
`:235-239`), and no session since has certified these constraints against live Paper. Unresolved
surfaces are therefore recorded `NOT YET DETERMINED — requires live Paper`, which is **not** the
same as "no conflict". The disposition `VERIFIED NONE AGAINST STORED EXPORTS` may be used only when
an accepted record actually certifies the check against stored exports; no entry below yet
qualifies, so that disposition is currently unused. `SUPERSEDED BY HUMAN DECISION (ADR-009)` marks
a composition question the 2026-09-15 human decision removed from this map for the Owner surfaces:
the guide's system constraints remain binding and will be judged against the future approved design
rather than the superseded frames. What would resolve an unresolved row: a session
with exposed live Paper tools (or an explicitly named, timestamped export package) that compares the
named accepted Paper family frames against the named guide section and records the result in a
reviewed record.

## Conflict map

| Surface | Constraint / guide section | Observed or potential conflict | Disposition | Exact evidence |
| --- | --- | --- | --- | --- |
| `staff` | `PHASES.md` Phase 4 acceptance text requiring "private capacity visibility" (`PHASES.md:182`); `DESIGN_GUIDE.md` §2 permits configured capacity and private percentages on authenticated surfaces where the Spec contract permits (`DESIGN_GUIDE.md:78-79`) | Paper's accepted Staff production `STAFF MONITORING PRODUCTION SET — CURRENT` (QPD-0) renders no capacity, while the older Phase 4 acceptance wording required it; capacity remains authorized in the DTO/data model | `RESOLVED BY HUMAN` | 2026-08-09 human decision 2 (`docs/phase-records/handoffs/phase5-staff-ui/20260809-030128-p5_staff_monitoring-activation-ratification.md:39-43`); coordination note (`PHASES.md:184-189`); accepted Staff entry (`AUTHORITY_MANIFEST.yaml:139-144`) |
| `staff` | `DESIGN_GUIDE.md` §3–§14 and retained ADR-006 palette, Cairo weights, and static-atmosphere constraints | No conflict enumerated by any accepted record; the checked frames are not certified against live Paper for these constraints | `NOT YET DETERMINED — requires live Paper` | ADR-007:78-85; diagnosis root cause 7 (`:235-239`); accepted Staff leaf exports (`AUTHORITY_MANIFEST.yaml:202-246`) |
| `login` | `DESIGN_GUIDE.md` §3 "Text and focus indicators target WCAG AA contrast" (`DESIGN_GUIDE.md:110-111`) and §13 accessibility baseline (`:273-285`) | Paper's Login deviations frame specifies enabled-submit hover `#FF2946`; white on that hover measures 4.35:1, below WCAG AA 4.5:1 | `RESOLVED BY HUMAN` — the 2026-08-31 human authority resolved it in favor of accessibility; the repository uses `#c41430` and the global token is untouched | Frame `login/login-deviations-contract.png` (`AUTHORITY_MANIFEST.yaml:138`); candidate record `docs/phase-records/handoffs/login-paper-adoption/20260831-103000-login_paper_r01-candidate.md:13-20`, `:78-81`; implementation `apps/web/src/components/login/login.css:357-366`; closure disclosure `docs/phase-records/handoffs/full-route-paper-fidelity/20260905-fidelity-closure.md:20-21`, `:97-99` |
| `login` | `DESIGN_GUIDE.md` §3–§14 and retained ADR-006 constraints, all states other than the hover value above | Hover is the only enumerated Login divergence; remaining constraints are not certified against live Paper | `NOT YET DETERMINED — requires live Paper` | `AUTHORITY_MANIFEST.yaml:83-87`; Login/Staff checkpoint `docs/phase-records/handoffs/full-route-paper-fidelity/20260902-211102-login-staff-paper-checkpoint.md:7-17` |
| `public` | `DESIGN_GUIDE.md` §5 cumulative 28-bar band-derived public crowd instrument (`:130-148`) and §2 crowd-first public hierarchy (`:50-65`); retained ADR-006 constraints (ADR-007:78-82) | No conflict enumerated by any accepted record; the accepted Public checkpoint describes the reconciled family but does not certify §5/§2 conformance against the stored exports, and live Paper was not available | `NOT YET DETERMINED — requires live Paper` | ADR-007:84-85; diagnosis:118-128, `:235-239`; accepted Public entry and leaf exports (`AUTHORITY_MANIFEST.yaml:32-82`); `docs/phase-records/handoffs/full-route-paper-fidelity/20260902-213926-public-paper-repair.md:8`, `:13-17` |
| `public` | `DESIGN_GUIDE.md` §3 palette and surfaces (`:81-111`), §4 Cairo weights (`:113-128`), §1 static atmosphere (`:33-37`) | No conflict enumerated; stored exports are not certified against these sections by any accepted record | `NOT YET DETERMINED — requires live Paper` | ADR-007:78-85; `APPROVAL_MANIFEST.yaml` `approvedDecisions:74-85`; diagnosis:120-128 |
| all Owner surfaces (`owner-shared-navigation`, `owner-daily`, `owner-reports`, `owner-access`, `owner-activity-log`, `owner-system-status`, `owner-settings`) | `DESIGN_GUIDE.md` §2 "restrained sections, tables, and forms with clear rails and separators rather than a wall of identical cards" (`:75-76`), §3 surfaces (`:105-108`), §7 composition (`:168-197`) | Independent review found composition-quality weaknesses in the accepted Owner topology; per ADR-009 the previous Owner composition is superseded as composition authority, so the guide's system constraints remain binding and will be judged against the new design rather than the superseded frames; no new design is verified | `SUPERSEDED BY HUMAN DECISION (ADR-009)` — composition authority superseded; guide system constraints remain binding against the future design; quality concerns tracked under "Composition quality exceptions" as redesign inputs | Diagnosis root cause 1 (`:132-150`); audit `docs/phase-records/handoffs/owner-demo-polish/20260912-owner-presentation-audit-r01.md:22-30`, `:34-53`; ADR-007:84-85; ADR-009 (`docs/adr/ADR-009-owner-composition-authority-supersession.md`); decision record `docs/phase-records/handoffs/coordinator/20260915-185500-human-owner-visual-authority-decision.md` |
| all surfaces | ADR-007 records the authority order, not a diff; the per-surface conflict list was never completed | The complete conflict list does not exist, so an unenumerated conflict cannot be ruled out for any surface | `NOT YET DETERMINED — requires live Paper` (umbrella statement for the rows above) | ADR-007:84-85; `docs/phase-records/paper-design-phase-closeout.md:82-85` |

## Composition quality exceptions

These are composition-quality concerns, not Paper-versus-guide conflicts. They do not amend
`DESIGN_GUIDE.md`, do not change Paper authority, and do not by themselves authorize any
implementation. They are separated here because a weak reference is a design-governance question,
not a guide-conformance question, and the two must not be conflated. Under ADR-009 they are inputs
to concept selection for the Owner redesign, not defects against binding composition authority.

- **Owner Settings wide, form-heavy topology.** Diagnosis root cause 1 records that weak
  characteristics (wide form-heavy rows, repeated similarly weighted surfaces, limited role
  differentiation, an overextended horizontal topology) are already encoded in both the Paper export
  and the promoted canonical, so the implementation is not failing to reproduce a strong reference
  (`docs/phase-records/handoffs/coordinator/20260915-165423-design-agent-environment-diagnosis.md:134-138`).
  The audit adds 425px control boxes whose trailing area is pointer-dead and heaviest material
  carrying the least content (`docs/phase-records/handoffs/owner-demo-polish/20260912-owner-presentation-audit-r01.md:28-29`).
- **Owner Reports dead space and ragged boards.** ~190px mid-row void in the Range row, ~520px dead
  space in the CSV board, 99px lower-board height mismatch, and a clipped hourly row
  (`20260912-owner-presentation-audit-r01.md:24-26`).
- **Owner Activity Log filter surface.** Open dropdowns render one word per line (P0), widths are
  inconsistent, paired numeric inputs are orphaned, and row/action rhythm is uneven
  (`20260912-owner-presentation-audit-r01.md:27`).
- **Owner cross-section tab strip instability.** The strip re-lands 3-7px between sections because
  its anchor is derived from content-measured heading heights; this is a structure-contract defect
  that appears across Owner sections, not a Paper composition conflict
  (`20260912-owner-presentation-audit-r01.md:22`).
- **Frozen governance recomposition candidate.** `owner-governance-layout-recomposition-r02` is
  terminal `NEEDS_HUMAN` with no canonical or Paper promotion; r01 was rejected by independent
  review on a clipped painted focus outline and a 200% reflow overlap
  (`docs/phase-records/handoffs/owner-demo-polish/20260915-owner-governance-layout-recomposition-r01.md:48-52`;
  `docs/phase-records/handoffs/owner-demo-polish/20260915-owner-governance-layout-recomposition-r02.md:3`,
  `:9-13`, `:30-34`). Disposition decided 2026-09-15: not adopted as the design to preserve;
  preserved as provenance; must not constrain the redesign (ADR-009 decision 2; decision record
  "r02 disposition").

The decision requests that followed from these exceptions are answered and recorded in
`docs/design/OWNER_COMPOSITION_REDESIGN_READINESS.md`; ADR-009 is the binding decision. The seven
Owner surfaces now carry the vacant-authority status recorded in `docs/design/VISUAL_AUTHORITY_STATUS.md`
(`Owner composition redesign authorized — composition authority vacant; prior composition and
canonicals reference-only (ADR-009)`), while Public, Login, and Staff remain
`Paper composition authority`.
