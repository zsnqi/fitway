# Phase 7 scheduled-reset integration b02 worker Stage 1 handoff

- Status: Stage 1 implementation and self-verification are complete; stop for fresh independent
  read-only Stage 1 review. The coordinator milestone remains `IN_PROGRESS`; no worker claims
  `READY_FOR_INTEGRATION` or `DONE`.
- Base / candidate: activation `f54b7f6dba66dea1a65414bdf4650b5a41815f68`; candidate `SELF`
  (the fresh Stage 1 commit containing this handoff).
- Branch / worktree / run ID: `work/phase7-integration-b02` /
  `D:/Projects/fitway-worktrees/phase7-integration-b02` / `p7_integration_b02`; exact disposable
  database `fitway_integration_p7_integration_b02`.
- Owned paths / shared lease used: only `packages/api/src/commands/{service.ts,service.test.ts}`,
  `packages/api/src/audit/types.ts`, `apps/server/src/{audit-repository.ts,command-repository.ts,
  phase7-integration.integration.test.ts}`, and this new b02 handoff. The exclusive b02
  command/audit lease was rechecked at `2026-08-13T21:13:15+03:00` and remains valid through
  `2026-08-20T20:58:59+03:00`.

## Completed

- `packages/api/src/commands/service.ts` adds an internal, actor-free scheduled-reset issuance
  seam. It writes one system command, supersession, system audit, and business-day claim in one
  transaction, returning the durable winning claim on an exact business-day race.
- `packages/api/src/audit/types.ts` and `apps/server/src/audit-repository.ts` add the typed system
  audit variant without widening human actor/session types.
- `apps/server/src/command-repository.ts` maps system provenance, the durable issuance claim,
  exact-claim reads, target-change rejection, and bounded test fault seams onto the existing
  database transaction.
- `packages/api/src/commands/service.test.ts` preserves all three human-command assertions and adds
  fresh exact-due issuance and claimed-day no-mutation coverage.
- `apps/server/src/phase7-integration.integration.test.ts` proves one-millisecond pre-due no-op,
  exact-due atomic command/audit/claim creation, pending/applied/superseded idempotency,
  deterministic two-call concurrency with exactly one complete triple, older-pending-only
  supersession, current-state preservation, absent/changed-device and injected command/audit/claim
  rollback, exact constraint/race behavior, and rejection of fabricated session-provided system
  provenance.

## Exact current state

- Candidate is one fresh b02 Stage 1 commit at `SELF`; no b01 commit or handoff was cherry-picked,
  amended, copied, or changed. The b01 branch/worktree and coordinator state are untouched.
- The candidate contains seven changed/new paths, all within the Stage 1 boundary above. There is
  no deployment and no external provisioning.
- The tracked worktree is clean at handoff closure. Stage 2 reset runner/repository and every
  Stage 3 cron/env/index/Vercel path remain unmodified from activation.

## Decisions

- No new product, auth, privacy, edge, migration, or visual decision was made. The human-approved
  b02 plan, ADR-008 monitoring-only boundary, accepted evaluator output, Stage 0 schema, Phase 5
  human behavior, and Phase 6 edge contract remain the authorities.
- System authority is exposed only by the actor-free `issueScheduledReset(decision)` application
  seam; `CommandActor` remains exactly human `shared_staff | owner` with `staff | owner` roles.

## Verification

- TDD red: direct frozen Vitest 4.1.10,
  `vitest run packages/api/src/commands/service.test.ts` -> `1 failed | 3 passed`; the exact new
  tracer failed with `TypeError: value.service.issueScheduledReset is not a function`.
- Focused unit green: the same command -> `1 passed`, `5 passed`.
- Exact Phase 7 PostgreSQL: matching `FITWAY_RUN_ID=p7_integration_b02`,
  `TEST_DATABASE_URL=.../fitway_integration_p7_integration_b02`, and
  `FITWAY_INTEGRATION_RESET_DATABASE=fitway_integration_p7_integration_b02`; direct Vitest with
  `vitest.integration.config.ts apps/server/src/phase7-integration.integration.test.ts` ->
  `1 passed`, `12 passed`.
- Frozen Phase 5 plus Phase 7 PostgreSQL under the same exact markers -> `2 passed`, `16 passed`.
- Scoped Biome over all six source/test paths -> `Checked 6 files`; no fixes.
- `pnpm check-types` -> all eight checked workspace projects passed.
- `pnpm verify:fast` -> repository invariants passed; Biome `232` files; workspace types passed;
  TypeScript `40` files / `206` tests passed; Python `18` tests passed; repository mutation guard
  passed.
- `git diff --check` passed; pre-handoff status named only the six intended source/test paths.
- Tooling note: this worker shell did not inject the local `.bin` path for `pnpm exec vitest` even
  after `pnpm install --frozen-lockfile`; the direct frozen `node_modules/.bin/vitest.cmd` reported
  `4.1.10` and ran every focused/integration command, while `pnpm verify:fast` independently
  resolved and ran the same Vitest installation. No source or lockfile workaround was made.
- Not verified: Stage 2, Stage 3, `verify:phase`, `verify:full`, Browser/a11y/visual (not required),
  production Vercel cadence/secrets, deployment, and real-gym behavior.

## Remaining

1. Fresh independent read-only Stage 1 review at this exact `SELF` commit, including full diff,
   exact b02 database rerun, frozen Phase 5 evidence, types, Biome, scope, and clean status.
2. Only after review `PASS`, begin a fresh Stage 2 TDD session in the separately owned reset
   runner/repository paths. Stage 3 and formal candidate validation remain later boundaries.

## Blockers

- None in Stage 1 production behavior or evidence. The `pnpm exec` path-injection observation is a
  worker-shell tooling note; direct frozen Vitest and the repository fast gate both passed.

## Recommended next session

Mode: independent `review`. Review only the b02 Stage 1 diff from activation
`f54b7f6dba66dea1a65414bdf4650b5a41815f68` through `SELF`; make no edits. Confirm the exact
approved atomic issuance/idempotency/concurrency/supersession/rollback/system-authority behaviors,
rerun the focused units and exact marked `_b02` PostgreSQL Phase 5 + Phase 7 evidence, types,
scoped Biome, diff/scope/status, and return locatable findings plus `PASS` or
`FAILED_VALIDATION`. Stop on any b01 mutation, arbitrary actor/session authority, human behavior
change, forbidden-path need, lease conflict, or database-marker mismatch.

- Exact resume command: `Set-Location D:/Projects/fitway-worktrees/phase7-integration-b02; git
  status --short --branch; git rev-parse HEAD`.
