# ADR-007 Paper production-family coverage for the remaining UI slices

- Status: `SUPERSEDED_IN_PART` — the rendered-family inventory remains evidence, while the
  missing-family decision was resolved by the human approval recorded below
- Date: 2026-08-09
- Authority: [ADR-007](../adr/ADR-007-paper-visual-source-of-truth.md), which places visual
  composition in Paper and states that "Establishing the per-surface conflict list is
  implementation-phase work and has not been done." This record performs that work for four
  slices and for nothing else.
- Method: read-only inspection of the rendered composition in Paper, not of layer names.
- Source: Paper file `FITWAY UX Exploration` (`01KYPX5AF950XZVVDD88B6J7QB`), `Page 1`,
  token content hash `3b0faca3`. Nothing in Paper was created, edited, moved, or deleted.

This record originally mapped slices onto the **four already-approved families only**. Its
read-only inventory remains valid. Its original `NEEDS_HUMAN` conclusions do not: during the
2026-08-09/10 orchestration run, Hussein explicitly authorized Codex to extend the existing
approved Owner/Management family for the required Phase 10 reporting and Phase 11 audit/access
components, reusing its approved patterns and `DESIGN_GUIDE.md` precedents. An unrelated
replacement production family is forbidden. Staff remains monitoring-only.

## What the approved families actually contain

`OWNER DAILY ANALYTICS PRODUCTION SET — CURRENT` holds nine frames: a title, Desktop 1440
English, Desktop 1440 Arabic, Tablet 768, Mobile 390 English, Mobile 390 Arabic, exception states
at 1440, exceptions at 390, and resilience. Rendered, every frame is the **same single owner
screen** — "Daily analytics" — in different viewports, locales, and states.

That screen renders, verified from the composition:

- a top rail carrying sign-out, the locale toggle, the FITWAY identity, and a
  **two-destination navigation group: `Monitoring` and `Management`**, with the active
  destination in bold;
- a page title and gym-local date;
- three summary facts (peak time, average, total visits);
- one single-day occupancy curve, "People present through the day";
- a disclosable "Today's minutes" table with time, count, crowd level, source, and notes.

The other three approved families — `STAFF MONITORING`, `LOGIN`, and `PUBLIC CROWD BOARD`
`PRODUCTION SET — CURRENT` — cover the staff monitoring board, the PIN login flow, and the public
crowd board. None renders an owner reporting or owner governance surface.

## Coverage verdicts

| Slice | Verdict | Covering family | Evidence |
| --- | --- | --- | --- |
| `phase11-shell` | **COVERED** | `OWNER DAILY ANALYTICS PRODUCTION SET — CURRENT` | The owner shell chrome — top rail, sign-out, locale toggle, FITWAY identity, and the two-destination nav — is rendered in all five viewport/locale frames plus the exception and resilience frames |
| `phase10-ui-csv` | **AUTHORIZED_EXTENSION** | existing approved Owner/Management family | The current family does not yet render the reporting controls, heatmap, comparison, or export affordance; Codex is authorized to author those missing components inside this family and obtain independent review |
| `phase11-audit` | **AUTHORIZED_EXTENSION** | existing approved Owner/Management family | Codex is authorized to author the filterable audit/history presentation inside this family after the generalized audit contract is established |
| `phase11-access` | **AUTHORIZED_EXTENSION** | existing approved Owner/Management family | Codex is authorized to author credential/access administration, reveal-once PIN, and required owner-account presentation inside this family; unresolved security policy remains governed by Product/Spec rather than visual authority |

## The constraint that rides with `phase11-shell`

The approved navigation group has exactly two destinations, `Monitoring` and `Management`. That
is the whole approved rail; there is no third entry, no sub-navigation, and no overflow.

`phase11-shell` may therefore implement the approved rail and page layout as rendered. It may
**not** add a navigation entry for audit, access, settings, or health, because no approved family
renders those destinations and inventing one would be a material visual-direction change, which
`AGENTS.md` makes immediately `NEEDS_HUMAN`. Whether the rail should grow destinations is part of
the same missing-family decision recorded below, not a call for the shell slice to make.

## Superseding human decision

The missing-composition question is closed. Codex may add the required reporting, audit, and
access/account compositions to the **existing** approved Owner/Management family in Paper. Work
must reuse the approved rail, typography, glass boards, tables/disclosures, responsive behavior,
RTL/LTR behavior, and accessibility/state patterns before creating any local component. The
Phase 10 heatmap belongs inside Owner analytics. No governance control may appear on Staff.

New Paper compositions require a bounded writer and fresh independent read-only review before
they become implementation authority. This approval does not settle unrelated security or data
semantics; for example, owner self-deactivation, last-owner protection, and password delivery
remain Product/Spec questions if the repository has not already answered them.

`phase11-settings` and `phase11-health` remain governed by their ledger dependencies. Their future
Owner-family composition is authorized under the same rule, but implementation cannot bypass
failed or incomplete backend dependencies.

## Effect on coordinator state

The visual-authority stall is removed for the authorized extensions. Milestone status, dependency,
ownership, lease, and validation transitions remain coordinator-owned in `PROJECT_STATE.yaml`;
this record alone does not activate implementation.
