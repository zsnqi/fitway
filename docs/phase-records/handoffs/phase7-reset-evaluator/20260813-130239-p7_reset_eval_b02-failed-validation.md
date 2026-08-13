# Phase 7 reset evaluator b02 failed-validation handoff

- Status: `FAILED_VALIDATION`; no b02 source is integrated. Candidate
  `d5b856c0a83f7d2e6bd3a7e2e5a281f2d2bbb9dd` remains on the isolated branch as provenance.
- Activation / candidate: `0e299e2b5147f8757572898be7f2feb85291f51e` /
  `d5b856c0a83f7d2e6bd3a7e2e5a281f2d2bbb9dd`.
- Branch / worktree / run ID: `work/phase7-reset-evaluator-b02` /
  `D:/Projects/fitway-worktrees/phase7-reset-evaluator-b02` / `p7_reset_eval_b02`.
- Commit boundaries: exact accepted replay `34c5331`; rejected total-resolver repair `122bb96`;
  docs-only handoff `d5b856c`. The detached verifier worktree is
  `D:/Projects/fitway-worktrees/phase7-reset-evaluator-v02` at the same candidate.
- Owned paths: reset module, Phase 7 integration test, and b02 worker handoff. The released lease
  covered only `packages/api/src/occupancy/schedule.ts` and `.test.ts`.
- Product decision: SPEC/ADR-004 pre-close ownership and frozen buffer/dueAt remain normative and
  are not reopened. The failure is implementation correctness, not authority.
- Worker validation: after repair `2/2`, reset `21/21`, schedule plus reset `32/32`, integration
  `1/1`, scoped Biome, API/server types, `verify:fast` (`190` TypeScript plus `18` Python), exact
  Phase 7 profile plus integration, mutation/diff/scope/status gates passed.
- Independent Standards and Spec review: **FAIL**. Gap business-day attribution compares the
  scheduled close label with the boundary using `<`. When close equals boundary inside a DST gap,
  it assigns the following civil day. Exact/fold closes use the instant immediately before close,
  so equality belongs to the preceding business day. This can suppress selection/rejection of an
  unresolved winner and violates past-midnight/business-day correctness.
- Required fresh-attempt regression: for `America/New_York` on 2026-03-08 with a `02:30` gap close
  and `02:30` business-day boundary, the preceding business day selects and rejects the gap while
  the following day reports no applicable close. The fresh plan should also centralize or reuse the
  business-day attribution primitive rather than duplicate its comparison rule.
- Repair accounting: `2/2` remains exhausted (Biome wrap; boundary-inside-gap separation). Fresh
  reviewer rejection is terminal under `docs/WORKFLOW.md`; no third repair is allowed.
- Browser/a11y/visual: `NOT_REQUIRED`.
- Repository action: clear active owner/heartbeat/expiry and schedule lease; remove the unintegrated
  Phase 7 profile from `main`; preserve b01 and b02 branches/records without rewrite.
- Remaining work: if resumed, create a reviewed fresh b03 root-cause plan/attempt at `0/2` from the
  then-current clean main. Do not amend or integrate b02.
- Exact resume command: `git -C D:/Projects/fitway-worktrees/phase5-staff-integration status --short --branch`
  followed by fresh b03 planning and independent plan review.
- Stop conditions: any same-level authority conflict, unleased shared path, exhausted fresh repair
  budget, or fresh verifier rejection becomes the workflow-defined terminal state.
