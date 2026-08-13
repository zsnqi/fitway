# Phase 7 reset evaluator b03 coordinator activation

- Status: `READY`; no source replay/edit has begun.
- Activation parent: clean `main` at `770e464000640b9d55cdfef82e9550641f4d28ed`;
  `baseCommit: SELF` resolves to this activation commit at worktree creation.
- Branch / worktree / run ID: `work/phase7-reset-evaluator-b03` /
  `D:/Projects/fitway-worktrees/phase7-reset-evaluator-b03` / `p7_reset_eval_b03`.
- Owned paths: reset module, Phase 7 integration test, and new b03 worker handoffs. The exclusive
  schedule/business-day source/test lease expires `2026-08-20T13:13:09+03:00`.
- Decisions: b01/b02 remain terminal provenance. b03 starts fresh at `0/2` under the plan reviewed
  PASS at `770e464`; SPEC/ADR-004 ownership is unchanged.
- Changes: coordinator state activation, isolated Phase 7 profile, plan-review PASS record, and
  this activation record only.
- Validation required before worktree creation: profile Biome, repository invariants, diff/cached
  checks, commit and clean-status proof.
- Browser/a11y/visual: `NOT_REQUIRED`.
- Remaining work: create absent worktree, frozen install, ignored env, Vitest trust probe, then
  coordinator `IN_PROGRESS` ratification before Stage 1.
- Exact resume command: `git worktree add D:/Projects/fitway-worktrees/phase7-reset-evaluator-b03 -b work/phase7-reset-evaluator-b03 <activation-commit>`.
- Stop conditions: preflight mismatch, scope/lease/authority conflict, exhausted fresh repairs, or
  verifier rejection becomes the workflow-defined terminal state.
