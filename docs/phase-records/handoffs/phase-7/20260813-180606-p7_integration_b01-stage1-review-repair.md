# Phase 7 scheduled-reset integration b01 Stage 1 review repair

- Status: `IN_PROGRESS`; validation repair `1/2` is active against Stage 1 candidate
  `68f4c4145ced9e6c6e481cafc2f3225106d31e09`.
- Base / branch / worktree / run ID: `346bcc83ee52eb600ef0301096fea64dd08a5e3c` /
  `work/phase7-integration-b01` / `D:/Projects/fitway-worktrees/phase7-integration` /
  `p7_integration_b01`.
- Owned paths / lease: exact Stage 1 test and handoff paths under the active Phase 7 lease through
  `2026-08-20T17:27:49+03:00`; production transaction code is frozen unless a correction test
  proves a behavioral defect.
- Independent verifier: `FAILED_VALIDATION` after commands 10/10, Phase 5 + Phase 7 integration
  15/15, Biome, workspace types, exact scope, diff, and clean-status checks passed. No production
  behavior defect was found.
- Required repair: replace generic rejection evidence with exact PostgreSQL constraint/error
  identity; exercise fabricated system audit provenance with a valid human principal; synchronize
  concurrent calls deterministically with a bounded timeout/deadlock assertion; assert mapped
  business-day/timestamp runtime values for inserted/existing/race results; assert
  `superseded_by_command_id`; replace the Stage 1 handoff with the mandatory workflow fields.
- Visual/browser/a11y: `NOT_REQUIRED`.
- Remaining work: a fresh bounded repair writer, fresh independent Stage 1 review, then Stage 2 only
  if the review passes.
- Exact resume command:
  `git -C D:/Projects/fitway-worktrees/phase7-integration status --short --branch`.
- Stop conditions: any production scope widening, authority/lease conflict, or another failed Stage
  1 review consumes repair `2/2` and must be assessed before further execution.
