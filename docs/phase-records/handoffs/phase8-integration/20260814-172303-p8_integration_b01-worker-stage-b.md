# Phase 8 health-alert integration b01 — Stage B worker record

- Status: `STAGE_B_COMPLETE`, self-verified. Awaiting fresh independent Stage B review.
  Milestone stays `IN_PROGRESS`. Stage C has not begun.
- Base commit: `ba8e6537d0e8dd05d0d6db60e0e1ee68d0b13d3d`, the independently accepted Stage A
  (`docs/phase-records/handoffs/phase8-integration/20260814-165215-p8_integration_b01-stage-a-review-pass.md`)
- Branch / worktree / run ID: `work/phase8-integration-b01` /
  `D:/Projects/fitway-worktrees/phase8-integration` / `p8_integration_b01`
- Approved plan: `docs/phase-records/handoffs/phase8-integration/20260814-133826-p8_integration_b01-plan.md`,
  Stage B section and the binding retention referential-integrity section
- Repair budget: `0/2`, unchanged. No formal repair was consumed.
- Push/deploy: none.

## Scope delivered — exactly the reviewed Stage B boundary

| File | Ownership | Change |
| --- | --- | --- |
| `packages/api/src/retention/policy.ts` | owned, new | Pure cutoff and per-table eligibility |
| `packages/api/src/retention/policy.test.ts` | owned, new | 8 tests |
| `apps/server/src/retention-repository.ts` | owned, new | One-transaction deletion honouring the self-FK |
| `apps/server/src/retention-repository.test.ts` | owned, new | 6 tests, stubbed driver |
| `apps/server/src/phase8-integration.integration.test.ts` | owned, **created this stage** | 3 tests, disposable PostgreSQL |

Five new files, no modified tracked file. `git status --short` before the commit listed exactly these
paths and nothing else. Neither leased path was touched: `packages/env/src/server.ts` is byte-identical
to Stage A and `apps/server/src/index.ts` remains unmodified — composition is Stage C. Frozen authority
confirmed unmodified: `packages/api/src/alerts/{evaluator,evaluator.test,types,notifier}.ts`,
`apps/server/src/alert-repository.ts`, `apps/server/src/cron.ts`, `vercel.json`, all of `packages/db/**`,
and every migration. No schema, migration, index, router, OpenAPI, UI, or cron-composition change exists.

## TDD red → green

Red first, as the plan requires. Both unit suites were written and executed before either
implementation file existed:

```text
pnpm exec vitest run packages/api/src/retention/policy.test.ts apps/server/src/retention-repository.test.ts
→ Test Files 2 failed (2) | Tests: no tests
  Error: Cannot find module './policy'
  Error: Cannot find module './retention-repository'
```

After implementing both modules, the same command: `2 passed (2) | 14 passed (14)`.

The integration suite was likewise written against the already-green units and then run, where it
failed twice on fixture constraints before passing — `edge_commands_lifecycle_coherent` (a `pending`
command may not carry apply timestamps) and `current_state_coherent` (an `edge` source requires both
push timestamps). Both were defects in this stage's own new fixture, not in the retention code under
test, and neither is a formal repair.

## The gate split, as the plan requires it

**Unit suite — what a stubbed driver can prove.** `policy.test.ts` proves the cutoff arithmetic:
quantization to the UTC day start (00:00:00.000, midday, and 23:59:59.999 of the same day all yield
one identical cutoff), twelve calendar months back from that day start, exactly 86 400 000 ms of
advance across a day boundary, and the boundary rule — a row exactly at the cutoff is retained while
one a millisecond older is expired. `retention-repository.test.ts` proves statement shape only: one
transaction wrapping exactly three statements, each table deleted by its own governing column with a
strict `<`, the day-quantized cutoff bound as the parameter rather than the raw clock value, the
`not exists` self-reference guard, and that no statement names any non-target table or performs any
`insert`/`update`. The file states in a header comment that it enforces no database constraint, and
**no referential-integrity claim rests on it**.

**Integration suite — what only PostgreSQL can prove.** Against the disposable database:

- The self-FK case. An `alert_log` parent sent ten days before the cutoff, whose recovery was sent one
  day *after* it, is **retained**; its recovery is retained; and the parent survives intact with
  `notice_kind = 'alert'` and a null `recovery_of_alert_id` rather than being orphaned or nulled.
- An expired parent and its equally expired recovery are deleted **together in one statement**,
  confirming the `ON DELETE no action` end-of-statement reading in the plan's binding section.
- The boundary in real `timestamptz`: the row exactly at the cutoff survives, the row one millisecond
  older does not.
- A second run at the same instant and a third at 23:59:59.999 of the same UTC day leave all three
  retention tables byte-identical — the day-quantized no-op, with no gate, no marker row, no
  migration, and no in-process state.
- `occupancy_minutes`, `settings_versions`, `current_state`, `edge_devices`, `edge_commands`, and
  `scheduled_reset_issuances` are byte-identical after every retention run, each seeded with real
  rows so the comparison is not vacuous.
- A later run, once the recovery itself falls out of the window, expires the previously pinned parent
  — proving the guard is a dependency on the recovery's own age, not a permanent exemption.

**Negative control, run directly against PostgreSQL and rolled back.** With a pinned parent and its
retained recovery present, the naive age-only statement the guard exists to prevent —
`delete from alert_log where sent_at < <cutoff>` — fails with
`ERROR: update or delete on table "alert_log" violates foreign key constraint
"alert_log_recovery_of_alert_id_alert_log_id_fk"`, `DETAIL: Key (id)=(7) is still referenced from
table "alert_log"`. The probe ran inside `begin … rollback`, so no state changed. This establishes
that the retained-recovery guard is load-bearing rather than incidentally satisfied.

## Validation commands and results, 2026-08-14 +03:00

```text
focused unit (plan line 380)     → 6 files / 53 tests passed
integration matrix (plan line 383, five files, serialized)
                                 → 5 files / 30 tests passed   (re-run after formatting)
pnpm check-types                 → PASS, all workspace projects
pnpm verify:fast                 → PASS, "passed without repository mutation"
                                   47 files / 262 tests
                                   (Stage A baseline 45 / 248 → +2 files, +14 tests)
pnpm verify:phase                → PASS, first stage at which it is meaningful
                                   profile integration run: 1 file / 3 tests passed
                                   "Verification phase passed without repository mutation."
git diff --check                 → clean
git status --short               → only the five Stage B paths
```

One prerequisite consumed no repair budget: the first `verify:fast` failed Biome formatting in three
files this stage had just created. `pnpm exec biome check --write` was applied to the five Stage B
paths only, and both the integration matrix and `verify:fast` were rerun afterwards. Formatting a new
file the stage owns is not a source defect, matching the Stage A precedent.

## Environment findings the next session must not rediscover

1. **The approved plan's verification ladder cannot pass as written.** It sets `DATABASE_URL` and
   `TEST_DATABASE_URL` to the same database, `fitway_integration_p8_integration_b01` (plan lines 372
   and 381), while `apps/server/src/test-support/integration-database-safety.ts:76-83` rejects exactly
   that: *"TEST_DATABASE_URL must not target the database configured by DATABASE_URL"*. The activation
   step 4 provisioning of `apps/server/.env` followed the plan and carries the same collision. Every
   integration command in this stage therefore set `DATABASE_URL` to
   `postgresql://postgres:postgres@127.0.0.1:55432/fitway_local_coord` **in the shell only** —
   `apps/server/.env` was not edited, and `DATABASE_URL` is never connected to by these tests; only its
   database name is compared. The Phase 7 b02 plan set `TEST_DATABASE_URL` alone in that block and did
   not hit this. This is a plan defect, not a product defect, and it will block the coordinator's
   `p8_integration_c01` run and the `_v01` verifier identically unless they apply the same separation.
2. **The disposable database did not exist.** `fitway_integration_p8_integration_b01` was absent from
   the container; it was created by this session with `create database` and is pristine apart from
   this stage's runs. `FITWAY_INTEGRATION_RESET_DATABASE` and `FITWAY_RUN_ID` matched it exactly, so
   the safety guard's run-ownership checks held.
3. **The guarded container was stopped.** `fitway-phase2-postgres` (`127.0.0.1:55432`) was down because
   Docker Desktop was not running; both were started, matching the `batch-02-reactivation.md:44-46`
   precedent. No container, image, or port configuration was changed.

## Implementation choices, disclosed

- **Leap-day clamping.** Twelve calendar months back from 29 February lands on a date that does not
  exist. `retentionCutoff` clamps to the last day of the target month (2024-02-29 → 2023-02-28) rather
  than letting `Date.UTC` roll forward into March, which would silently shorten the window by a day.
  `SPEC.md` says "~12 months", so either is within the specification; clamping is chosen because it
  never deletes more than the stated window. One day every four years, and behind a pure function.
- **`purgeExpired` returns `void`.** No row counts are returned. The cron seam logs only an error name,
  nothing consumes a count today, and Stage C can query if it ever needs one. Smallest thing that works.
- **The cutoff is computed before the transaction opens**, so an invalid clock value throws
  `RangeError` with zero statements issued rather than leaving a half-applied deletion.
- **`policy.ts` exports the governing-column map** as data rather than embedding the column names only
  in the repository, so the eligibility contract is testable without a database. The repository still
  uses the typed Drizzle columns, so the two cannot drift silently.

## What Stage B deliberately does not do

Nothing is composed. `packages/api/src/cron/runner.ts`, the `apps/server/src/index.ts` wiring, the
`cron.test.ts` equal-length wrong-secret case, and every end-to-end alerting scenario are Stage C, as
is the delivery-deadline finding the Stage A review carried forward
(`alert-notifier.ts` imposes no `AbortSignal`). None was touched here. Retention is additive and
unreachable from any runtime path until Stage C wires it.

## Exact next action

A **fresh independent read-only Stage B review**, which must not repair what it reviews. Per the plan
it is judged against the unit/integration split above: a referential-integrity claim backed only by
the stubbed driver is a rejection. It should verify scope containment against `ba8e653`, that no
frozen authority and neither leased path changed, the self-FK retention case, the same-day no-op, and
the byte-identity of the six non-target tables. Stage C does not begin until that review passes.

## Resume command

```powershell
cd D:/Projects/fitway-worktrees/phase8-integration
git status --short --branch
git log --oneline -1
# DATABASE_URL must not name the test database — see environment finding 1
$env:DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:55432/fitway_local_coord'
$env:TEST_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:55432/fitway_integration_p8_integration_b01'
$env:FITWAY_INTEGRATION_RESET_DATABASE='fitway_integration_p8_integration_b01'
$env:FITWAY_RUN_ID='p8_integration_b01'
pnpm exec vitest run --config vitest.integration.config.ts apps/server/src/phase8-integration.integration.test.ts
```

## Rollback

`git revert <B>`. Removes the three retention modules and the integration file. Because the
`phase8-integration` verify profile names
`apps/server/src/phase8-integration.integration.test.ts`, a revert of Stage B returns `verify:phase`
to its pre-Stage-B "No test files found" state; the coordinator must remove the profile in that same
act. Stage A is unaffected and its two environment variables remain required at import.

## Stop conditions

Unchanged. `NEEDS_HUMAN` on a forbidden-path need, a migration/index/schema need, a need to change
`cron.ts` or `vercel.json`, a lease widening, a secret reaching a tracked file, or any deployment
requirement.
