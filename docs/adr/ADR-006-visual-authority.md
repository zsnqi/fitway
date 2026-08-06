# ADR-006: Visual authority and phase polish

- Status: Accepted by the Baseline Reconciliation Gate; superseded in part on 2026-08-06
- Date: 2026-07-15

> **Superseded in part by [ADR-007](ADR-007-paper-visual-source-of-truth.md), limited to visual
> composition.** Paper is now the visual source of truth, so the first bullet below is no longer
> the top of the visual authority order. The rest of this ADR stands, and its visual constraints
> remain in force until a specific approved Paper production materially conflicts with one of
> them. The decision text is preserved unedited as the record of what the gate accepted.

## Context

G1B, Claude Design, Stitch, VDG worksheets, an old Design Guide, production candidates, and a final
visual-lab prototype contained overlapping and sometimes contradictory direction. The approved
system needed durable provenance without preserving every exploration artifact as authority.

## Decision

- The current visual baseline is `DESIGN_GUIDE.md` plus
  `visual-direction-gate/approved/APPROVAL_MANIFEST.yaml` and its immutable source snapshot.
- FITWAY is premium first, athletic second, minimal third: obsidian/graphite/oxblood, concentrated
  FITWAY red, static atmosphere, Cairo 400–700, restrained structure, and strong RTL/LTR behavior.
- Public Live uses a panoramic board, crowd-first hierarchy, secondary approximate count, and a
  continuous cumulative 28-bar red signal derived from `band`.
- No public capacity/percentage, unavailable synthetic font weights, four-color segmented meter,
  Aurora/WebGL/background motion, fake identities, or preview-only content ships.
- G1B and Claude artifacts remain immutable lineage only where the manifest identifies retained
  composition. Stitch, worksheets, old workflow documents, and prototypes are provenance.
- Broad exploration is complete. Each UI phase ends with focused Browser/Playwright/a11y/screenshot
  polish and a fresh verifier. Material direction changes require human approval.

## Consequences

Implementation may improve route-specific composition and quality without reopening identity or
locked product decisions. Canonical baselines are changed only through an approved phase record and
manifest update. Four deferred refinements live in `docs/POLISH_BACKLOG.md` and do not block the BRG.
