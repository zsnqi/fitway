# Phase 7 reset evaluator b03 plan re-review failure

- Status: b03 remains inactive; no source work or live lease/profile exists.
- Reviewed commit: `ca0516737213bdfb55fa1464b421f88f130b791d`.
- Independent result: `FAIL`. Former findings were fixed, but equal scheduled civil labels across
  exact/gap or gap/gap historical candidates lacked a total deterministic tie-break, allowing
  input-order-dependent issue-versus-throw behavior.
- Plan correction: after scheduled civil close label, select by later settings `effectiveFrom`, then
  higher settings `version`, matching append-only historical lookup precedence. `transitionAt`,
  outcome kind, and array position never break ties. Exact-gap and gap-gap permutation regressions
  are now required.
- Validation: read-only plan review; no tests/edits by the reviewer. Repository invariants and diff
  checks are required for this correction commit.
- Remaining work: fresh re-review of the exact committed revision; activation requires `PASS`.
- Exact resume command: `git -C D:/Projects/fitway-worktrees/phase5-staff-integration status --short --branch`.
