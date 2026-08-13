# Phase 7 scheduled-reset integration b01 coordinator start ratification

- Status: `IN_PROGRESS`; bounded Stage 1 implementation may now begin.
- Activation/base: `346bcc83ee52eb600ef0301096fea64dd08a5e3c`.
- Branch / worktree / run ID: `work/phase7-integration-b01` /
  `D:/Projects/fitway-worktrees/phase7-integration` / `p7_integration_b01`.
- Scope/lease: exact activation ownership and the command/audit/env/server/Vercel lease through
  `2026-08-20T17:27:49+03:00`.
- Preflight: exact identities and clean status; ignored server env copied without disclosure;
  frozen install completed with no tracked change; Vitest `4.1.10`, Node `24.14.0`; only disposable
  database `fitway_integration_p7_integration_b01` created for worker verification.
- Decisions: the independently reviewed plan at
  `docs/phase-records/handoffs/phase-7/20260813-160000-p7_integration_b01-plan.md` is binding;
  Stage 0 is frozen at `ab36c6ff393e286399c0b7c33215233a8e610769`; evaluator and Phase 6 contracts
  remain frozen; candidate repair starts `0/2`.
- Browser/a11y/visual: `NOT_REQUIRED`.
- Remaining work: Stage 1 internal system command service, Stage 2 historical runner/repository,
  Stage 3 authenticated cron and full edge reconciliation, each committed at its rollback boundary;
  then the full worker ladder and fresh independent verification.
- Exact resume command:
  `git -C D:/Projects/fitway-worktrees/phase7-integration status --short --branch`.
- Stop conditions: scope/lease/authority mismatch, an expired lease, a need to change auth principal
  kinds/roles or product routes, migration drift, or exhausted candidate repairs.
