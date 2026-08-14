# Phase 8 health-alert integration b01 — formal complete candidate

- **Status:** `READY_FOR_INTEGRATION`. Explicitly **not** `DONE`; only the coordinator declares that,
  and only after the detached `_v01` independent verification returns `PASS`.
- **Base commit / candidate commit:** activation `45d1edfbb4f9a727c3589e600cfff66151fd45f6` →
  candidate `3e6bec9` (this record is committed on top; the integration diff is
  `git diff 45d1edf..<candidate head>`).
- **Branch / worktree / run ID:** `work/phase8-integration-b01` /
  `D:/Projects/fitway-worktrees/phase8-integration` / `p8_integration_b01`.
- **Repair budget:** `0/2`. No formal candidate gate has failed. The three stage-review correction
  cycles are, per the approved plan, not repairs.

## Stage history, each independently reviewed before the next began

| Stage | Commit | Independent review |
| --- | --- | --- |
| A — Telegram transport and environment | `ba8e653` | `PASS` — `…-165215-…-stage-a-review-pass.md` |
| B — retention cleanup | `b153ef1` | `PASS` — `…-181657-…-stage-b-review-pass.md` |
| C — cron seam composition and carried-forward hardening | `9a5d28e` | `PASS`, no blocking; corrections applied at `3e6bec9` and recorded in `…-190400-…-stage-c-corrections.md` |

## Owned paths / shared leases used

Every changed path is inside `ownedPaths` or the two-path exclusive lease. Of the lease, only
`packages/env/src/server.ts` (Stage A, two variables) and `apps/server/src/index.ts` (Stage C
composition) were used, and nothing else. `git diff --name-only 45d1edf..HEAD` restricted to
`apps/server/src/cron.ts`, `vercel.json`, `packages/db/**`, `packages/api/src/alerts/{evaluator,
evaluator.test,types,notifier}.ts`, `apps/server/src/alert-repository.ts`, `packages/api/src/reset/**`,
`apps/server/src/reset-repository.ts`, `edge/**`, `apps/web/**`, `packages/ui/**`, `tests/browser/**`,
`scripts/**`, `PROJECT_STATE.yaml`, and the normative documents is **empty**.

## Changes by file

| Path | Stage | Change |
| --- | --- | --- |
| `packages/api/src/alerts/message.ts` (+test) | A | Pure notice → maintainer message text. |
| `apps/server/src/alert-notifier.ts` (+test) | A | Telegram `AlertNotifier` over an injected `fetch`; every failure path throws one fixed message carrying no credential. |
| `packages/env/src/server.ts` | A (leased) | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` as required server variables. |
| `packages/api/src/retention/policy.ts` (+test) | B, C | Day-quantized 12-month cutoff, now derived from `RETENTION_WINDOW_MONTHS`, with a five-case property test. |
| `apps/server/src/retention-repository.ts` (+test) | B, C | One-transaction purge honouring the `alert_log` self-key; comment now names the real depth-one guarantee. |
| `packages/api/src/cron/runner.ts` (+test) | C | Composite runner, frozen alert policy constants, per-component deadline, sized delivery bound. |
| `apps/server/src/index.ts` | C (leased) | Composes alerts, retention, and the existing reset runner into the **unchanged** `createCronHandler`; injects the bounded `fetch`. |
| `apps/server/src/cron.test.ts` | C | Equal-length wrong-secret case derived from `cronSecret.length`, paired with an unequal-length case. |
| `apps/server/src/phase8-integration.integration.test.ts` | B, C | Retention properties plus four composed-seam scenarios against disposable PostgreSQL. |

## Decisions made, with canonical source

- Alert policy as frozen constants rather than settings columns — approved plan adjudication 1,
  resting on `SPEC.md:595-598` and `RESEARCH.md:622-624`. Disclosed for a human to overrule.
- Day-quantized retention cutoff, no gate and no run marker — adjudication 2.
- Composite-runner failure isolation with one aggregate error, and a transport outage explicitly
  producing no aggregate error — adjudication 4.
- Delivery bound sized so a *stalling* transport also cannot breach the component deadline —
  Stage C review finding S1, corrected at `3e6bec9`.
- No migration, index, or schema change was needed or made; the plan's stop condition on that point
  never fired.

## Validation commands and results, at the candidate

```text
pnpm exec vitest --version                     vitest/4.1.10 win32-x64 node-v24.14.0
focused unit (plan line 380)                   7 files / 73 tests passed
integration matrix (plan line 383)             5 files / 34 tests passed
pnpm check-types                               exit 0
pnpm exec biome check --write .                249 files, no fixes outstanding
pnpm verify:fast                               "passed without repository mutation", exit 0
FITWAY_PHASE=phase8-integration verify:phase   "passed without repository mutation", exit 0
git diff --check / --cached --check            clean
git status --short --branch                    clean on work/phase8-integration-b01
```

`pnpm verify:full` is deliberately **not** run by the worker; the approved plan reserves it for the
coordinator's pre-integration gate.

## Browser / a11y / visual artifacts

None, and none required. This slice produces no user interface. `browser`, `accessibility`, and
`visual` are `NOT_REQUIRED`, consistent with `phase8-alert-evaluator` and every Phase 7 slice.

## Independent verifier findings so far

Three stage reviews, each by a session that did not write the stage and did not repair what it
reviewed, each running its own run ID and its own disposable database. All three returned `PASS`
with no blocking findings. Carried-forward findings are individually closed or explicitly deferred
in `…-190400-…-stage-c-corrections.md`. The one item deferred **out** of this slice is the retention
index question, which belongs to the coordinator-serialized migration lane.

The contracted detached `_v01` verification has **not** yet run. Its mutation check is the residual
assurance gap that no stage review closed.

## Remaining work or exact blocker

None inside this slice. The remaining steps are not worker work:

1. Detached `_v01` independent verification at this exact candidate, in worktree
   `D:/Projects/fitway-worktrees/phase8-integration-v01`, run ID `p8_integration_v01`, database
   `fitway_integration_p8_integration_v01`.
2. Coordinator no-fast-forward merge on `PASS`, then the `p8_integration_c01` ladder including
   `pnpm verify:full`.
3. Coordinator closure: `phase8-integration` `DONE`, both leases released, profile retained.
4. Aggregate `phase-8` closure as a separate coordinator milestone.

## Known plan defect the next runs must handle

The approved plan's ladder sets `DATABASE_URL` and `TEST_DATABASE_URL` to the same database, which
`tests/integration/setup.ts` rejects through
`apps/server/src/test-support/integration-database-safety.ts`. Both the `_v01` verifier and the
coordinator's `p8_integration_c01` run must point `DATABASE_URL` at a different, unused database
name or nothing will run. Reproduced independently by the Stage B reviewer, the Stage C reviewer,
and this worker.

## Exact resume command

```powershell
cd D:\Projects\fitway-worktrees\phase8-integration
git log --oneline -6
git diff --name-status 45d1edf..HEAD
git status --short --branch
```

Then provision process-local synthetic values for `FITWAY_RUN_ID`, `DATABASE_URL` (a database other
than the test one), `TEST_DATABASE_URL`, `FITWAY_INTEGRATION_RESET_DATABASE`, `BETTER_AUTH_SECRET`,
`BETTER_AUTH_URL`, `CORS_ORIGIN`, `CRON_SECRET`, `TELEGRAM_BOT_TOKEN`, and `TELEGRAM_CHAT_ID`, and
rerun the ladder above.

## Stop / escalation conditions

Unchanged from the approved plan. Immediate `NEEDS_HUMAN` on any Product/Spec conflict, privacy or
security ambiguity, a need for any forbidden path, a need for a migration, index, or schema change,
a need to change `cron.ts` or `vercel.json`, a need to widen the lease, a stale or overlapping lease,
any secret reaching a tracked file, log, artifact, or handoff, any public capacity/history/health or
device-identity leak, any staff or owner command or UI surface, any edge or OpenAPI contract change,
or any deployment or external provisioning requirement. `FAILED_VALIDATION` if the `_v01` verifier
rejects the candidate.

Nothing was pushed, deployed, or externally provisioned. No real Telegram credential was used,
requested, or held; every environment value used at any stage was synthetic, process-local, and
never written to a tracked file.
