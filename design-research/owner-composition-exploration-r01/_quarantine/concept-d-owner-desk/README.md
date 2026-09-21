# Concept D — The Owner's Desk / مكتب المالك (standalone fixture, not authority)

**Status: informal exploration artifact, not a milestone concept.** The active packet is DRAFT, the milestone is PLANNED, and the standing environment-audit gate is unresolved. This file claims no Product/Spec/accessibility/visual authority and is not part of the concept-selection gate. The previous concepts in this directory (A command rail, B briefing dossier, C strata) are rejected and were **not** used as design references; this concept shares no layout, composition, navigation model, or visual direction with them.

- Open: `design-research/owner-composition-exploration-r01/concept-d-owner-desk/index.html` directly in a browser (double-click; no build/server, no network calls).
- What it is: one self-contained HTML file (inline CSS/JS) plus the canonical self-hosted Cairo subsets copied unchanged into `fonts/`.

## Spatial thesis (new, not inherited)

**Hub-and-spoke "Desk".** The Owner area opens on a composed home — *The Desk / المكتب* — that answers "the gym now" first (crowd level dominant, approximate count secondary, continuous 28-bar signal, freshness), then lists the six destinations as text-led index rows, each carrying its single most important live fact. Navigation is a masthead destinations popover plus a breadcrumb back to the Desk. There is no side rail, no chapter column with scroll-spy, and no segmented tab strip or bottom tab bar.

Composition answers the recorded diagnosis (wide form-heavy rows, weak role differentiation, overextended horizontal structure): one centered measure (≤1064px), hairline section rails instead of card walls, data boards at full measure, forms constrained to a narrow measure, and governance actions isolated in a distinct bordered action zone.

## Surfaces included

Desk (shared navigation home), Daily (occupancy curve + minute table), Reports (range, weekday×hour heatmap with keyboard navigation, week-over-week, CSV fixture download), Activity Log (filters, ledger, load-older), System Status (uptime/incidents/devices), Access (PIN rotate/deactivate with required reason, owner list, validated create-owner), Settings (capacity, crowd-level thresholds, weekly hours, read-only technical settings, dirty-state save bar with validation).

## Behavior

Arabic-first RTL with English LTR toggle (full re-render, logical properties, Western digits, `bdi` isolation, gym-local Asia/Riyadh 12-hour times), hash routing (`#/daily` …), focus-on-heading navigation, destinations popover (Esc/outside close), dialogs with required reason, inline validation, toasts in a polite live region, skip link, 44px targets, visible focus, `prefers-reduced-motion` collapse. All data is static deterministic fixture content; nothing is fetched, stored, or transmitted.

## Tokens

FITWAY dark-only baseline (`--fw-*` values verbatim from DESIGN_GUIDE.md §14), Cairo 400/500/600/700 (no synthetic 800/900), tabular numerals, static layered-gradient oxblood atmosphere (no canvas/RAF/animation), hairline borders, radii 8/16/28.

## Boundaries

No production code touched (`apps/**`, `packages/**`, `tests/**` unchanged); no canonical, Paper, manifest, register, or ADR change; `PROJECT_STATE.yaml` untouched (coordinator-owned). Locked copy reused verbatim where the catalogs fix it (e.g. `العدد التقريبي`, band labels, settings labels); all other strings are native fixture copy, not new locked copy.
