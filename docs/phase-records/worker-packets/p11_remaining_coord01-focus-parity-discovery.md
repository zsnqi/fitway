# FITWAY focus-parity target discovery packet

Return a compact current-checkout evidence map only. Do not write files, run tests/builds, read `.env`, use environment values, access or mutate Paper, or delegate.

## Frozen authority

Read `AGENTS.md`, `DESIGN_GUIDE.md` sections 10, 11, and 13, `PROJECT_STATE.yaml` milestone `focus-parity-accessibility`, and `docs/phase-records/handoffs/coordinator/20260815-031500-focus-parity-gap.md`. The planned scope is the three already-recorded gaps only:

1. visible forced-colors focus on public, staff, login, and owner surfaces;
2. public/staff/login skip links reveal on focus even after pointer interaction;
3. owner skip-link transition is actually disabled under reduced motion.

Keep ordinary `:focus-visible` treatment. `:focus` is permitted only for off-screen skip-link reveal or forced-colors fallback. Do not redesign composition, touch Paper, or include M4/M5 Access races, owner-access rate limiting, or workflow environment-documentation work.

## Questions

1. Reconfirm the exact current selectors, specificity, and cascade responsible for each gap with `file:line` evidence.
2. Identify the smallest exact CSS hunks and whether all three planned writable files remain necessary. Flag any newer rule that makes an old planned hunk obsolete.
3. Map the smallest focused Browser/Playwright test changes needed to prove all four surfaces, including forced-colors, pointer-then-Tab skip-link visibility, reduced motion, and canonical non-regression. Name exact existing specs/helpers to extend; do not invent a new global harness if existing coverage suffices.
4. Identify shared-file lease collisions with current Access/Settings/Uptime work and propose an exact disjoint ownership/forbidden-path list for a later writer.
5. State whether implementation is low-consequence and migration/Paper/baseline-free. Canonical screenshot changes are a stop condition, not authorized promotion.

## Return contract

Start with `READY_BOUNDED`, `STALE_PLAN`, or `AUTHORITY_CONFLICT`. Provide exact file:line evidence, smallest ownership map, focused test list, and at most six risks. End with `END-OF-MAP`. Do not paste source blocks or narrate searches.
