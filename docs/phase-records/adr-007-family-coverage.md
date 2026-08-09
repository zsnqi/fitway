# ADR-007 Paper production-family coverage for the remaining UI slices

- Status: `RECORDED` — coordinator determination; documentation only
- Date: 2026-08-09
- Authority: [ADR-007](../adr/ADR-007-paper-visual-source-of-truth.md), which places visual
  composition in Paper and states that "Establishing the per-surface conflict list is
  implementation-phase work and has not been done." This record performs that work for four
  slices and for nothing else.
- Method: read-only inspection of the rendered composition in Paper, not of layer names.
- Source: Paper file `FITWAY UX Exploration` (`01KYPX5AF950XZVVDD88B6J7QB`), `Page 1`,
  token content hash `3b0faca3`. Nothing in Paper was created, edited, moved, or deleted.

This record maps slices onto the **four already-approved families only**. It proposes no new
family, no new surface, and no visual direction. Where no approved family renders a surface, the
slice is reported `NEEDS_HUMAN` rather than resolved.

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
| `phase10-ui-csv` | **NEEDS_HUMAN** | none | No approved family renders a weekday/hour heatmap, week-over-week comparison, date-range control, or CSV export affordance; a file-wide search returns zero `heatmap` and zero `CSV` nodes, and the only approved owner chart is a single-day curve |
| `phase11-audit` | **NEEDS_HUMAN** | none | No approved family renders an audit history list or its actor/action/from/to/reason filters; the single file-wide `audit` match is a note about a repository audit, not an interface |
| `phase11-access` | **NEEDS_HUMAN** | none | No approved family renders PIN provisioning, rotation, deactivation, or owner account management; every file-wide `PIN` match is the word "spinner" inside Login and Public loading copy |

## The constraint that rides with `phase11-shell`

The approved navigation group has exactly two destinations, `Monitoring` and `Management`. That
is the whole approved rail; there is no third entry, no sub-navigation, and no overflow.

`phase11-shell` may therefore implement the approved rail and page layout as rendered. It may
**not** add a navigation entry for audit, access, settings, or health, because no approved family
renders those destinations and inventing one would be a material visual-direction change, which
`AGENTS.md` makes immediately `NEEDS_HUMAN`. Whether the rail should grow destinations is part of
the same missing-family decision recorded below, not a call for the shell slice to make.

## What remains open for Hussein

Three slices need a visual decision before any of them can implement:

- **`phase10-ui-csv`** — the missing family is an owner **reporting** surface: weekday/hour
  heatmap, week-over-week comparison, date-range selection, and the export affordance.
- **`phase11-audit`** — the missing family is an owner **audit history** surface: a filterable
  actor/action/from/to/reason record list.
- **`phase11-access`** — the missing family is an owner **access management** surface: PIN
  provisioning, rotation, and deactivation, plus owner account management.

`phase11-settings` and `phase11-health` are not assessed here; both are still blocked by their own
ledger dependencies, and their coverage should be determined when those close.

The decision required is the one `dependency-parallelization-audit.md` §16.1 named and left
unverified: whether a new Paper production family must exist before an owner surface with no
family may be implemented, or whether ADR-007 is amended to authorize implementing such a surface
from `DESIGN_GUIDE.md` using an approved family as precedent. This record does not take that
decision and no agent may.

## Effect on coordinator state

None. This record changes no milestone status, gate, ownership, or lease. `phase11-shell` becomes
eligible for a normal activation on its own schedule; `PROJECT_STATE.yaml` is unchanged by this
determination.
