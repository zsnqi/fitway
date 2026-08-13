# Phase 7 scheduled-reset integration b01 coordinator activation

- Status: `READY`; no worker source edit has begun.
- Activation parent: clean `main` at `ab36c6ff393e286399c0b7c33215233a8e610769`;
  `baseCommit: SELF` resolves to this activation commit.
- Stage 0 boundary: `ab36c6ff393e286399c0b7c33215233a8e610769`; ordinary revert removes the
  unused additive schema/migration/test if this attempt terminates before integration.
- Branch / worktree / run ID: `work/phase7-integration-b01` /
  `D:/Projects/fitway-worktrees/phase7-integration` / `p7_integration_b01`.
- Owned paths: reset runner/repository, cron handler, focused integration test, and new b01 worker
  handoffs. The exclusive command/audit/env/server/Vercel lease expires
  `2026-08-20T17:27:49+03:00`.
- Decisions: the approved plan at
  `docs/phase-records/handoffs/phase-7/20260813-160000-p7_integration_b01-plan.md` is binding;
  accepted evaluator and Phase 6 behavior remain frozen; no staff/owner/system command UI or oRPC
  surface is permitted.
- Stage 0 validation: disposable `fitway_integration_p7_integration_c01`; focused migration 4/4,
  frozen Phase 5/6 plus Stage 0 13/13, all workspace type checks, independent migration review
  `PASS`, and `pnpm verify:fast` (repository invariants, 204 unit tests, 18 simulator tests) passed.
  Generated-metadata formatting consumed focused repair 1 for Stage 0 only; slice candidate repair
  remains `0/2` because the formal candidate ladder has not begun.
- Browser/a11y/visual: `NOT_REQUIRED`.
- Remaining work: create the absent isolated worktree, frozen install/ignored env/Vitest/database
  preflight, then record `IN_PROGRESS` before any source edit or test replay.
- Exact resume command: `git worktree add D:/Projects/fitway-worktrees/phase7-integration -b work/phase7-integration-b01 <activation-commit>`.
- Stop conditions: identity/preflight mismatch, expired or conflicting lease, authority/scope
  conflict, migration drift, exhausted repairs, or verifier rejection becomes the workflow-defined
  terminal state.
