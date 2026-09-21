# Concept A — Owner Command Rail (standalone fixture, not authority)

**Status: informal exploration artifact, not a milestone concept.** The active packet is DRAFT, the milestone is PLANNED, and the standing environment-audit gate is unresolved. This file claims no Product/Spec/accessibility/visual authority and is not part of the concept-selection gate.

- Open: `design-research/owner-composition-exploration-r01/concept-a-command-rail/index.html` directly in a browser (double-click; no build/server).
- What it is: one self-contained HTML file with inline CSS/JS, no network calls, no production imports.
- Thesis tested: persistent command rail (7 Owner surfaces + Overview) beside a dominant board; KPI strip → primary instrument/data → supporting governance. Overview answers “the gym now” first.
- Surfaces included: Overview, Daily, Reports, Access, Activity Log, System Status, Settings.
- Interactions: surface switching, AR default / EN toggle (RTL/LTR + logical layout), mobile rail → horizontal strip, dialogs with required reason, inline validation, CSV fixture download, toasts, skip link, focus-visible rings.
- Tokens: FITWAY dark-only baseline (`--fw-*`, Cairo stack, tabular numerals, Western digits, static atmosphere).
- Out of scope: production code untouched (`apps/**`, `packages/**`, `tests/**` unchanged); no canonical/manifest/register/ADR change; no PROJECT_STATE update (coordinator-owned).
