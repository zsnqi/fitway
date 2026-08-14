# Phase 8 health-alert integration b01 — Stage B independent review

- Status: `STAGE_B_REVIEW_PASS`. Milestone `phase8-integration` remains `IN_PROGRESS`. No formal
  candidate exists and the formal complete-candidate ladder has not begun. Stage C has not begun.
- Reviewed commit: `b153ef1` on `work/phase8-integration-b01`, worktree
  `D:/Projects/fitway-worktrees/phase8-integration`, clean before and after review.
- Base: accepted Stage A `ba8e6537d0e8dd05d0d6db60e0e1ee68d0b13d3d`.
- Reviewer independence: Stage B was implemented by the coordinating session, so the review was
  **delegated in full** to a fresh read-only reviewer that did not write the code and did not repair
  what it reviewed. It formed and recorded its assessment from the plan, the diff, the schema, and
  executed commands **before** opening the implementer's Stage B record, per `CLAUDE.md`. Its review
  ran on its own run ID `p8_int_b01_sb_rev` and its own database
  `fitway_integration_p8_int_b01_sb_rev`, created for the review and separate from the worker's.
- Coordinator gate on the delegated result: the three substantive findings were re-verified directly
  against the repository before this acceptance was written. Evidence is cited inline below; none was
  taken on the reviewer's word.

## Verdict

`PASS`. No blocking findings. Stage C may begin.

The plan's explicit Stage B gate split holds. `apps/server/src/retention-repository.test.ts:6-11`
disclaims constraint enforcement in its own header, and every referential-integrity claim lives in
`apps/server/src/phase8-integration.integration.test.ts` against real PostgreSQL — so the rejection
condition the plan names ("a referential-integrity claim backed only by a stubbed driver") is not met.

## Gates, independently reproduced

```text
focused unit (plan line 380)          6 files / 53 tests passed
integration matrix (plan line 383)    5 files / 30 tests passed
pnpm check-types                      exit 0, all workspace projects
pnpm verify:fast                      47 files / 262 tests + 18 Python,
                                      "passed without repository mutation", exit 0
pnpm verify:phase                     profile run 1 file / 3 tests passed,
                                      "passed without repository mutation", exit 0
git diff --check ba8e653..b153ef1     clean
git diff --name-status ba8e653..b153ef1  6 files, all A, 957 insertions, 0 deletions
git status --short --branch           clean on work/phase8-integration-b01
```

## Scope containment — verified

Six added paths, every one inside `ownedPaths`: `packages/api/src/retention/policy{,.test}.ts`,
`apps/server/src/retention-repository{,.test}.ts`,
`apps/server/src/phase8-integration.integration.test.ts`, and the Stage B worker record. No modified
tracked file. Neither leased path appears — `packages/env/src/server.ts` is byte-identical to Stage A
and `apps/server/src/index.ts` is untouched. No `packages/db/**`, no migration, no index, no
`cron.ts`, no `vercel.json`. Composition is genuinely absent: `createRetentionRepository` is
referenced only from its two test files, and neither `index.ts` nor `cron.ts` contains any retention
reference. Secret scan surfaced only the synthetic `tokenHash: "b".repeat(64)` fixture and the local
disposable-container DSN already present verbatim in the committed plan.

## Findings

None blocking.

```
[significant — carried forward, not repaired in this slice]
  The single-pass alert_log purge is justified by a constraint that does not provide the
  guarantee the comment claims.
  Where:    apps/server/src/retention-repository.ts:41-44
  Evidence: the comment states `alert_log_recovery_linkage` makes the reference graph "exactly one
            level deep". Re-verified directly: that check
            (packages/db/src/schema/application.ts:530-533) only forces notice_kind='alert' to carry
            a null parent. It places no restriction on a recovery row's parent, so recovery →
            recovery is schema-legal. The reviewer built a depth-3 chain on its own database inside
            begin…rollback and ran the shipped purge predicate: the middle recovery was retained
            (pinned by its child) while the expired root was deleted, raising
            "alert_log_recovery_of_alert_id_alert_log_id_fk … Key (id)=(7) is still referenced".
  Expected: the plan's binding rule — a row still referenced by a retained row is itself retained.
  Why non-blocking: the depth-2 invariant does hold, but through frozen accepted authority rather
            than the cited constraint. Re-verified directly: packages/api/src/alerts/evaluator.ts:57
            returns a prior row only when `last?.noticeKind === "alert"`, and evaluator.ts:259 sets
            recoveryOfAlertId from exactly that row, so a recovery can never parent a recovery. The
            approved plan itself (lines 116-120) authorized the single-pass form using this same
            faulty reasoning, so this is inherited from an independently passed plan, not introduced
            by Stage B.
  Consequence if it ever breaks: the FK abort kills the whole retention transaction, so retention
            stops silently and permanently. The dependency on a frozen file's behaviour deserves to
            be named at the call site.

[minor — carried forward]
  The exported governing-column map is decorative and cannot detect the drift it appears to guard.
  Where:    packages/api/src/retention/policy.ts:9-24
  Evidence: re-verified by repo-wide grep — retentionCutoff is the only export with a production
            consumer (retention-repository.ts:1,29). RETENTION_GOVERNING_COLUMN, RETENTION_TABLES,
            RETENTION_WINDOW_MONTHS, and isExpired reach test files only. retentionCutoff hardcodes
            `year - 1` and never reads RETENTION_WINDOW_MONTHS; the repository hardcodes the Drizzle
            columns. The type is Record<RetentionTable, string>, so check-types does not constrain
            the values.
  Expected: either a real link to the repository's column selection, or no claim of one. As written,
            policy.test.ts:58-69 and :24 restate the same literals — change detectors, not
            behaviour tests.

[minor — Stage C / coordinator input, correctly not a Stage B defect]
  Two of the three deletion predicates are unindexed on a statement designed to run every minute.
  Where:    packages/db/src/schema/application.ts — re-verified: audit_log_created_id_idx
            (created_at, id) is the only index among the three targets; edge_health_log and
            alert_log carry primary keys only, and the alert_log NOT EXISTS self-join on
            recovery_of_alert_id is unindexed.
  Expected: not actionable here — packages/db/** and any new index are explicitly forbidden to this
            worker. Recorded so it is not silently inherited: Stage C's daily gating in the composite
            runner reduces this to one run per day, and any index is a coordinator migration lane
            decision.
```

## Record gate — `PASS` with one mismatch

Every load-bearing claim in `20260814-172303-p8_integration_b01-worker-stage-b.md` matched
independent measurement: all five gate results with their exact counts; the six-path diff with no
modified tracked file; frozen authority and both leased paths untouched; the 8 / 6 / 3 per-file test
counts; the non-vacuity of the byte-identical assertions (post-run row counts `current_state` 1,
`occupancy_minutes` 1, `settings_versions` 1, `edge_devices` 1, `edge_commands` 3,
`scheduled_reset_issuances` 1); and that retention is unreachable from any runtime path. Environment
finding 1 was reproduced independently, including the file and line range it cites, before the record
was read. Status is correctly restrained and claims neither `READY_FOR_INTEGRATION` nor `DONE`. No
secret is disclosed.

**One mismatch, deliberately left unrepaired.** Worker record line 146 states that "the repository
still uses the typed Drizzle columns, so the two cannot drift silently." That is false, for the
reason in the second finding above: there is no type-level or runtime link, no production consumer,
and no test that would fail if the map's values changed. The sentence asserts a safety property the
code does not have. This slice was scoped to review and accept, not to repair, so the correction is
carried to Stage C rather than applied here. It is a record defect, not a source defect, and the
Stage B source behaviour is unaffected.

Two further record statements are accepted with a qualification. The TDD red-phase transcript, the
two integration fixture-constraint failures, and the Biome formatting rerun leave no artifact in a
squashed single-commit stage, so no reviewer can verify them from the repository. The same applies to
the claim that the container was stopped and the disposable database absent at the worker's start
time. Line 24's "five new files" omits the record itself, which is the sixth added path — imprecise,
not contradictory.

## Plan defect confirmed, and it will recur

The reviewer independently reproduced what the worker record reports: the approved plan's
verification ladder cannot pass as written, because it sets `DATABASE_URL` and `TEST_DATABASE_URL` to
the same database (plan lines 372 and 381) while `tests/integration/setup.ts:9-14` feeds
`process.env.DATABASE_URL` into the guard at
`apps/server/src/test-support/integration-database-safety.ts:76-83`, which rejects exactly that
match. `dotenv` never overrides an already-set shell variable, and `apps/server/.env` is present in
the worktree with the same collision, so nothing masks it. Setting both identically produces:

```text
Error: TEST_DATABASE_URL must not target the database configured by DATABASE_URL
 ❯ assertDisposableIntegrationDatabase apps/server/src/test-support/integration-database-safety.ts:80:9
 ❯ tests/integration/setup.ts:9:1
```

The guard is inert at the test file's own call site — `phase8-integration.integration.test.ts:23-27`
passes no `applicationDatabaseUrl`; the rejection comes solely from the shared setup file.

**This will block the coordinator's `p8_integration_c01` run and the detached `_v01` verifier
identically** unless each points `DATABASE_URL` at a database other than its own
`TEST_DATABASE_URL`. It is a defect in an already-passed plan, not in Stage A or Stage B.

## Probes run beyond the required ladder

Cutoff arithmetic was derived independently through a disjoint code path and compared across 20
month, year, and leap-boundary cases including `2024-02-29 → 2023-02-28`, `2000-02-29 → 1999-02-28`,
`2026-01-31 → 2025-01-31`, and `2100-03-01 → 2099-03-01`; all matched, with no off-by-one at any
boundary. Day quantization holds across all 1440 minutes of a UTC day and yields exactly +86 400 000
ms at the next day; a `now` already past midnight in Asia/Riyadh still quantizes by UTC, as the
plan's adjudication 2 requires. The self-FK guard was exercised in both directions, and the third
integration test is a genuine negative control — advancing `now` by two days unpins the previously
retained parent and drains the table. One tautological assertion was found (`policy.test.ts:58-69`,
covered by the second finding); `retention-repository.test.ts:64-66` was confirmed to be a real
vacuity guard rather than a decorative one.

## Gaps in this review, stated

- `pnpm verify:full` was not run — outside the required ladder for a stage review; the plan reserves
  it for the pre-integration coordinator gate.
- Stage A content was not re-reviewed; it was treated as the independently accepted base.
- The TDD red phase, the fixture-constraint failures, and the formatting rerun cannot be verified
  from a squashed stage commit.
- No behaviour was exercised at production data volume and no concurrent-invocation or `EXPLAIN`
  testing was performed; the index finding is structural, not measured.
- Stage C composition was not reviewed and is correctly absent from this diff.

## Resulting state and next action

`phase8-integration` remains `IN_PROGRESS` with gates `unit: PENDING`, `integration: PENDING`, and
repair `0/2`. Stage B is accepted and frozen: any later mutation of the six Stage B paths without a
reviewed repair is a stop condition.

Next bounded slice: **Stage C — cron seam composition and carried-forward hardening**, per the
approved plan's Stage C section, on the same branch and worktree under the same one-writer boundary.
Stage C carries four items that must not be lost:

1. The Stage A delivery-deadline finding — `apps/server/src/alert-notifier.ts` imposes no
   `AbortSignal`, so a hung Telegram request is not a rejection and can block the composite runner.
2. The significant finding above — name the real guarantee at
   `retention-repository.ts:41-44`, which is the frozen evaluator, not the check constraint.
3. The two minor findings — the decorative policy exports, and the worker-record line 146 correction.
4. The retention index question, as coordinator/migration-lane input rather than worker work.

Stage C's own gate additionally requires the equal-length wrong-secret `cron.test.ts` case derived
from `cronSecret.length`, the composite-runner failure-isolation contract, and the end-to-end
integration scenarios listed in the plan.
