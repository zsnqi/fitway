# Phase 7 reset evaluator b02 coordinator activation

- Status: `READY`; source work has not started.
- Activation parent: clean coordinator `main` at
  `1a2261c68236c807c6885f161f63bbfa8b35deac`; `baseCommit: SELF` resolves to this activation commit
  when the worktree is created.
- Branch / worktree / run ID: `work/phase7-reset-evaluator-b02` /
  `D:/Projects/fitway-worktrees/phase7-reset-evaluator-b02` / `p7_reset_eval_b02`.
- Owned paths: `packages/api/src/reset/**`, the Phase 7 reset-evaluator integration test, and new
  b02 worker handoffs. The exclusive schedule resolver/test lease expires
  `2026-08-20T12:17:28+03:00`.
- Decisions: Product ownership is normative in SPEC/ADR-004. The revised superseding plan passed
  independent review at `1a2261c`; b01 remains immutable terminal provenance at `2/2`; b02 starts
  fresh at `0/2`.
- Changes by file: coordinator state activation, isolated Phase 7 verification profile, plan-review
  PASS record, and this activation record only.
- Validation: repository invariants, focused Biome for the profile, `git diff --check`, cached diff
  check, and clean commit/status proof are required before worktree creation.
- Browser/a11y/visual: `NOT_REQUIRED` for this pure evaluator slice.
- Independent findings: `PASS`; no remaining plan blocker.
- Remaining work: create the absent worktree, frozen install, ignored env provisioning, Vitest trust
  probe, then coordinator start ratification to `IN_PROGRESS` before any replay/edit.
- Exact resume command: `git worktree add D:/Projects/fitway-worktrees/phase7-reset-evaluator-b02 -b work/phase7-reset-evaluator-b02 <activation-commit>`.
- Stop conditions: preflight identity/tool failure, scope/lease mismatch, authority conflict, two
  failed candidate repairs, or fresh verifier rejection becomes the workflow-defined terminal state.
