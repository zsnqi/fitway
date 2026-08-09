# phase7-reset-evaluator activation handoff

- Status: `READY` — activated, unlaunched. No feature code exists for this slice.
- Base commit / candidate commit: base is the batch-05 activation commit (`baseCommit: SELF`,
  the only child of `06486487914c5a78afb3aa6e264e6988e0c5cb85`); no candidate yet.
- Branch / worktree / run ID: `work/phase7-reset-evaluator-b01` /
  `D:/Projects/fitway-worktrees/phase7-reset-evaluator` / `p7_reset_eval_b01`
- Owned paths / shared leases used:
  - Owned: `packages/api/src/reset/**`,
    `apps/server/src/phase7-reset-evaluator.integration.test.ts`,
    `docs/phase-records/handoffs/phase7-reset-evaluator/**`
  - Shared leases: **none**. Everything else is forbidden; see the milestone block in
    `PROJECT_STATE.yaml`.

## Outcome required

Deliver the **pure evaluator** half of `PHASES.md` Phase 7:

1. Close-plus-buffer reset scheduling — when a scheduled system reset becomes due.
2. Past-midnight and business-day correctness, resolving historical settings by `effectiveFrom`.
3. Exactly-once system reset issuance decisions, including the supersession and idempotency rules
   the Phase 5 command model already defines.

The slice is additive and unexposed, mirroring the `phase9-analytics-domain` and `phase10-domain`
ownership pattern that this repository has already proven twice.

**Explicitly out of scope, and owned by `phase7-integration`:** the authenticated cron endpoint,
`CRON_SECRET` and any `packages/env` change, command persistence, offline persistence until the
edge applies the reset, and every router/context/server-index wiring. `PHASES.md` names this slice
"the pure evaluator worker milestone"; transport and persistence are the next slice.

## Decisions made at activation (with canonical source)

- **No environment variable.** `packages/env/**` is forbidden. Verified at this commit: the server
  environment schema declares five variables and contains no cron entry. `CRON_SECRET` belongs to
  `phase7-integration`.
- **No migration.** `packages/db/**` is forbidden with no lease; the migration lane is
  coordinator-serialized and the latest migration is `0005`. A pure evaluator should need none;
  if it appears to, stop and escalate.
- **No exposure.** `packages/api/src/routers/**`, `context.ts`, and `apps/server/src/index.ts` are
  forbidden. Do not add a router leaf.
- **Read, do not write, the shared time semantics.** `packages/api/src/occupancy/**` is forbidden
  for writes; `business-day.ts` and `schedule.ts` are the canonical Phase 3 helpers and must be
  consumed as they stand. `packages/api/src/occupancy/engine.ts` is additionally under an exclusive
  `phase-6` lease for the duration of this batch.
- **Gates.** `browser`, `accessibility`, and `visual` are `NOT_REQUIRED`, as already recorded in
  the ledger. `unit`, `integration`, and `independentReview` are `PENDING`.
- **Paper.** Paper is the final visual source of truth. This slice produces no UI, so no Paper
  production family is consulted or implemented. A UI need is a scope error — stop.

## Changes by file

None. This handoff records activation only.

## Validation commands and results

Not yet run. The required ladder for this slice:

```
pnpm verify:fast
FITWAY_RUN_ID=p7_reset_eval_b01 \
TEST_DATABASE_URL=postgresql://.../fitway_integration_p7_reset_eval_b01 \
FITWAY_INTEGRATION_RESET_DATABASE=fitway_integration_p7_reset_eval_b01 \
FITWAY_PHASE=phase7-reset-evaluator pnpm verify:phase
```

Registered profile: `phase7-reset-evaluator` — `browserFiles: []`,
`integrationFiles: ["apps/server/src/phase7-reset-evaluator.integration.test.ts"]`. That path is
owned; the worker creates the file. Port 20669 is reserved for uniqueness only.

Worktree preparation was completed by the coordinator at activation:
`pnpm install --frozen-lockfile` then `pnpm exec vitest --version`, per `docs/WORKFLOW.md`
"Before creating a phase worktree" steps 7–8. `apps/server/.env` is provisioned.

## Browser/a11y/visual artifacts

None, and none expected. All three gates are `NOT_REQUIRED`.

## Independent verifier findings

None yet. A fresh verifier reviews the diff and reruns independent checks before integration, per
`docs/WORKFLOW.md`; it must not read this worker's reasoning before forming its own assessment.

## Remaining work or exact blocker

All of it. No blocker at activation; every ledger dependency is `DONE`.

## Exact resume command

```
cd D:/Projects/fitway-worktrees/phase7-reset-evaluator
git status --short --branch
git rev-parse HEAD
pnpm exec vitest --version
```

Then read, in order: `AGENTS.md`; `FITWAY_PRODUCT.md` and the relevant `SPEC.md` sections;
`PHASES.md` and `PROJECT_STATE.yaml`; `docs/adr/ADR-004-time-and-business-day.md`;
`docs/phase-records/batch-05-activation.md`; this file.

## Stop/escalation conditions

- Any need to touch `packages/db/**`, a migration, `packages/env/**`, the router/context/server
  index, `packages/api/src/occupancy/**`, `edge/**`, `scripts/verify.mjs`, or `PROJECT_STATE.yaml`
  → stop, request a coordinator lease. `phase-6` holds an exclusive edge-spine lease for this
  batch; do not negotiate with that worker directly.
- Any drift into cron transport, `CRON_SECRET`, or persistence → stop; that is `phase7-integration`.
- Any need for a UI surface → stop. `NEEDS_HUMAN`.
- A Product/Spec conflict, privacy/security ambiguity, or unleased shared-file requirement →
  `NEEDS_HUMAN`.
- The same gate failing after two focused repair attempts → `FAILED_VALIDATION`; do not reset the
  count by changing sessions.
- Lease expiry 2026-08-16T18:30:00+03:00. Check it at startup; an expired lease requires
  coordinator renewal and immediate `NEEDS_HUMAN`.
