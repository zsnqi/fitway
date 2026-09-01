# FITWAY fidelity/integration closure r03 failed validation

- Status: `FAILED_VALIDATION` at independent review.
- Base / terminal candidate: `28a57b41373a81b4c368b47bcfa5fc5373971017` /
  `b1bc91c4028eb02083ea59dc73a3c8c03614c767`.
- Branch / worktree / run ID: `codex/fidelity-integration-closure`,
  `C:/Users/Pc Force/.codex/worktrees/f2a7/phase5-staff-integration`,
  `fidelity_closure_r03`.
- r03 owned only the stale Phase 4 assertions and shell-canonical reproducibility check. Product,
  security, privacy, API, schema, database, and canonical baseline behavior remained unchanged.

## Preserved verification evidence

- The 126-pixel Owner shell drift did not reproduce in an isolated canonical rerun; the unchanged
  shell baseline passed again and no tolerance or baseline update was made.
- Repair 1 replaced three old Owner content-heading assertions with the localized selected Daily
  tab that the Phase 4 integration slice actually owns. The affected browser set passed 16/16.
- `pnpm verify:fast` passed mutation-free after 65 repository invariants, Biome, workspace types,
  572 unit tests, 117 simulator tests, and both production builds.
- Fresh `pnpm verify:full` passed mutation-free against the exact disposable r03 database: 133/133
  integration tests and 128/128 executed browser/accessibility tests passed; the three desktop-demo
  tests remained deliberately isolated to `pnpm demo:verify`.

## Independent-review blockers

1. A lazy first visit after the Daily query becomes stale can mount a new observer and refetch the
   Daily/time-context pair. If that refetch fails, the switch replaces a visited section subtree,
   violating its keep-mounted contract and risking loss of an unsaved Settings draft or filter.
2. Daily loading/error and Settings loading branches have no active page-level `h1` after the old
   persistent Owner heading was removed.
3. The Access, Audit, and Uptime 200-percent review captures visibly overlap the header, section
   tabs, and headings. Their overflow-only assertions therefore produced a visual false pass.
4. The mobile Access table rule overrides the identity row's flex layout, concatenating the owner
   name and email in the routed canonical.
5. Important non-live routed states are functionally exercised but remain underrepresented in the
   canonical screenshot set.

Those source and CSS paths were forbidden by r03's frozen test-only scope, so r03 does not widen
itself after review. The candidate is preserved unintegrated and superseded by the human-authorized
repair-lineage successor `fidelity-integration-closure-r04`. No deployment, push, release, tag,
presentation, or owner-facing PDF action occurred.
