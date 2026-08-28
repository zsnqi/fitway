# ADR-007: Paper is the visual source of truth

- Status: Accepted by human decision
- Date: 2026-08-06
- Supersedes ADR-006 in part, limited to visual composition

## Context

ADR-006 recorded `DESIGN_GUIDE.md` plus `visual-direction-gate/approved/APPROVAL_MANIFEST.yaml`
and its immutable snapshot as the current visual baseline after the Baseline Reconciliation Gate
of 2026-07-15. A complete design phase then ran in Paper and closed on 2026-08-05 with four
approved production families. The repository never recorded that phase, so two current visual
authorities existed at once. A repository audit found the contradiction and escalated it as a
locked-decision question. This ADR records the resolution.

## Decision

Paper is the visual source of truth for FITWAY.

### Paper identity

- File: `FITWAY UX Exploration`, id `01KYPX5AF950XZVVDD88B6J7QB`, page `Page 1`.
- Approved system: `09 — FITWAY FINAL SYSTEM — G3 ADAPTIVE GLASS + OWNER ANALYTICS`.
  Its section 15 records production authority and consolidation; section 16 records the Public
  G3 build contract as fulfilled.
- Organizational banner for the production row: `FITWAY — APPROVED CURRENT PRODUCTION`.

### Approved CURRENT production families

These four native top-level areas inside the production zone are the approved rendered families:

- `OWNER DAILY ANALYTICS PRODUCTION SET — CURRENT`
- `STAFF MONITORING PRODUCTION SET — CURRENT`
- `LOGIN PRODUCTION SET — CURRENT`
- `PUBLIC CROWD BOARD PRODUCTION SET — CURRENT`

Two areas in the same file are explicitly **not** approved production and must never be
presented as such: `PUBLIC — APPROVED BUILD REFERENCES` is reference evidence only, and
`PUBLIC CROWD BOARD — G3 LIVE BASE CANDIDATE` is a source artifact only. Do not build from
either, and do not treat either as the reference for Public visuals.

### Authority split

Paper governs **visual composition**: layout, hierarchy, spacing, surface treatment, and the
rendered appearance of an approved family.

The repository governs **behavior**. `FITWAY_PRODUCT.md` and `SPEC.md`, the ADRs under
`docs/adr/`, reviewed migrations, Zod/OpenAPI schemas and shared DTOs, tests, and application
invariants remain authoritative for behavior, data semantics, privacy, security, and
authorization. Where Paper copy and a repository message catalog disagree, the catalog wins for
application strings; where visual treatment is in question, Paper wins. A Paper composition
cannot authorize a change to a locked product, privacy, security, or lifecycle decision; that
remains `NEEDS_HUMAN`.

### Relationship to ADR-006

Everything in ADR-006 that is not visual composition remains in force unchanged — in particular
the public content boundary, the immutable-provenance and hash model for the approved snapshot,
and the per-phase Browser/Playwright/accessibility/screenshot gate with a fresh verifier.

ADR-006's remaining visual constraints — palette, actual Cairo weights, static atmosphere, the
cumulative 28-bar public instrument, and the crowd-first public hierarchy — stay in force until
a specific approved Paper production materially conflicts with one of them. At that point Paper
governs the visual treatment, and the affected guide section, token, or manifest entry is
amended through an approved phase record rather than resolved ad hoc during implementation.

This ADR enumerates no such conflict. It records the authority order, not a diff. Establishing
the per-surface conflict list is implementation-phase work and has not been done.

## Consequences

- No repository file is an independent current visual authority. `DESIGN_GUIDE.md`, `AGENTS.md`,
  `README.md`, and the approval manifest point here instead of restating the split.
- `DESIGN_GUIDE.md` remains the repository's contract for responsive behavior, RTL and
  localization, interaction and motion, accessibility, the canonical token baseline, and the
  phase visual gate — subject to this ADR for composition.
- The 2026-07-15 theme snapshot keeps its hash verification in `pnpm check:repository` and
  remains immutable provenance. It is no longer the top of the visual authority order.
- Implementation of any production family starts from Paper. This ADR implements none of them
  and grants no approval to any candidate already on a worker branch.
- Evidence and history: `docs/phase-records/paper-design-phase-closeout.md`, and the original
  closing handoff preserved at
  `docs/archive/handoffs/HANDOFF-paper-design-phase-close-20260805.md`.

## 2026-08-28 — Login-specific human authority reconciliation

The human instructions recorded in the Login b03
[Paper fidelity repair](../phase-records/handoffs/login-paper-adoption/20260827-183500-login_paper_b03-paper-fidelity-repair.md),
[repair 3](../phase-records/handoffs/login-paper-adoption/20260827-212500-login_paper_b03-repair3.md),
and [repair 4](../phase-records/handoffs/login-paper-adoption/20260827-222500-login_paper_b03-repair4.md)
make LOGIN PRODUCTION SET — CURRENT authoritative for Login presentation, its represented
states and behavior, and all user-facing Login copy. This is a narrow human-approved exception
to the catalog precedence above, not a general transfer of application behavior to Paper.

Product/Spec security, authorization, privacy and data semantics remain unchanged. In S4,
disabled/non-focusable controls and no invented recovery action are represented authority;
the candidate's fresh-load recovery is a minimal implementation inference, not a claim that
the human explicitly prescribed reload-only recovery. No conflicting recovery requirement
was found in the durable record. Other families retain the general authority split.

The main coordinator adopted the
[bounded current-frontier integration plan](../phase-records/handoffs/login-paper-adoption/20260828-login-b03-coordinator-integration-plan.md).
Canonical comparison and acceptance still require its fresh independent fidelity gate.
