# FITWAY fidelity/integration closure r02 activation

- Status: `IN_PROGRESS`.
- Preserved source candidate: `2069896e39434c4f2c6adff4504a7040167b53c5`.
- Branch / worktree / run ID: `codex/fidelity-integration-closure`,
  `C:/Users/Pc Force/.codex/worktrees/f2a7/phase5-staff-integration`,
  `fidelity_closure_r02`.
- Authority: primary Codex coordinator; one repository writer at a time.

## Bounded successor scope

r02 carries the r01 candidate unchanged and repairs only the full-gate assertion proven stale by
the accepted Public recomposition: the Phase 2 live-browser integration test must locate the
single responsive `.public-live__freshness` element rather than the removed desktop/mobile
duplicate wrappers. The exact test file receives a narrow coordinator lease; server behavior,
contracts, database semantics, and all other server paths remain forbidden.

After that repair r02 must rerun the failed integration test, `pnpm verify:fast`, and a fresh
`pnpm verify:full` on a new exact disposable database and run-owned browser resources. It then
rebuilds and verifies the desktop demo, obtains independent rendered and source/behavior review,
records the visual-closure supersession without rewriting history, integrates to clean canonical
`main`, and stops the disposable runtime. No gate may be weakened, skipped, or baseline-updated
inside this repair.

