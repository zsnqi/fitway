# Phase 7 reset evaluator b02 coordinator validation handoff

- Status: `VALIDATING`; fresh verification is required before integration.
- Activation / candidate: `0e299e2b5147f8757572898be7f2feb85291f51e` /
  `96385d414025cd394204eb2ef31e9c7b5e733c6a`.
- Branch / worktree: `work/phase7-reset-evaluator-b02` /
  `D:/Projects/fitway-worktrees/phase7-reset-evaluator-b02`; clean status and empty index proven.
- Commit boundaries: exact replay `34c5331`; total resolver/repair `f08ea91`; docs-only handoff
  `96385d4`. Scope is exactly seven authorized paths.
- Worker gates: reset `20/20`; schedule plus reset `31/31`; Phase 7 integration `1/1`; scoped
  Biome; API/server types; `verify:fast` (`189` TypeScript plus `18` Python); exact Phase 7 profile
  plus integration; mutation/diff/scope/status checks all passed.
- Repair count: `1/2`, consumed only by one formatter wrap; full ladder restarted and passed.
- Browser/a11y/visual: `NOT_REQUIRED`.
- Remaining work: fresh Standards and Spec review plus a detached verifier run with suffix `_v02`.
- Exact resume command: create a clean detached worktree at `96385d4`, frozen-install, provision
  ignored env, prove Vitest, then run the frozen verifier ladder without edits.
- Stop conditions: verifier rejection is terminal `FAILED_VALIDATION`; only full independent PASS
  permits integration.
