# Phase 10 CSV transport b03 worker candidate handoff

- Status: `READY_FOR_INTEGRATION`. Not merged, not pushed; no ledger, profile, or normative
  document was touched. Repair counter unchanged at `0/2` — no candidate gate went red.
- Base commit / candidate commit: `c4bd178a0cc0ca9524a2da8230fa6d84487da2e1` (activation) /
  `79b9b80`.
- Branch / worktree / run ID: `work/phase10-csv-transport-b03` /
  `D:/Projects/fitway-worktrees/phase10-csv-transport-b03` / `p10_csv_transport_b03`.
- Owned paths / shared leases used: owned `packages/api/src/analytics/reporting/csv-transport.ts`,
  `packages/api/src/analytics/reporting/csv-transport.test.ts`,
  `apps/server/src/phase10-csv-transport.integration.test.ts`, this handoff. Leased
  `packages/api/src/context.ts`, `packages/api/src/routers/index.ts`, `apps/server/src/index.ts`,
  `apps/server/src/reporting-repository.ts`, `apps/server/src/reporting-repository.test.ts`,
  used only for optional `AbortSignal` propagation, statement-timeout installation, idempotent
  release/cleanup, primary-error preservation, category-only diagnostics, and their focused tests.

## Decisions made (with canonical source)

- Cancellation mechanism follows `20260813-144635-p10_csv_transport_b03-timeout-amendment.md`
  clauses 1-7 in full; every other clause of `20260813-121151-p10_csv_transport_b03-plan.md`
  remains binding and unmodified.
- Abort precedence (amendment clause 6): when `signal.aborted` is true at the failure point, the
  exact `signal.reason` is thrown, outranking the socket/`FETCH` failure that `release(true)`
  necessarily produces, the statement timeout, and any cleanup failure. This closed the recorded
  pre-existing TDD red.
- Diagnostics (amendment clause 7): `CsvDiagnosticCategory` is now exported and reachable through
  a new optional `onCsvDiagnostic` repository option. The category string is the entire payload;
  no SQL, parameters, range values, CSV content, connection/database details, or credentials are
  emitted. Each category is reported at most once per export. A throwing diagnostic sink is
  swallowed and never alters export control flow. Production wiring in `apps/server/src/index.ts`
  supplies no sink, so default behaviour is unchanged and the owner transport's generic error
  boundary is untouched.
- Cleanup shape (amendment clause 5): both generators now capture the primary failure in `catch`,
  run an idempotent non-throwing cleanup helper from `finally`, and rethrow after the `try`
  statement. Biome `lint/correctness/noUnsafeFinally` passes with no suppression. A consumer early
  `return()` completes as a return, so a cleanup failure cannot convert it into a throw; cleanup
  errors surface only when there is no primary failure.
- Real-Postgres tracer identity (amendment clause 4): the export pool carries a unique
  `application_name` and the test binds the repository-owned backend from the pool's `acquire`
  event (`client.processID`), then binds the exact `(pid, backend_start)` tuple through the
  observer connection's `pg_stat_activity` query. The previous pre-borrowed guessed identity
  client was removed. Production issues no PID query and opens no control connection.
- No CSV, range, history, privacy, isolation, cursor, schema, migration, environment, dependency,
  manifest, UI, or Paper semantics changed. No new dependency.

## Changes by file

- `packages/api/src/analytics/reporting/csv-transport.ts` (new): owner-only `admin.analytics.csv`
  oRPC event-iterator procedure; forwards chunks incrementally, memoizes the underlying `return()`,
  passes the request `AbortSignal` to `streamCsv`, preserves the producer failure over cleanup
  rejection, and keeps cleanup out of `finally`.
- `packages/api/src/analytics/reporting/csv-transport.test.ts` (new): 8 focused transport tests.
- `packages/api/src/context.ts` (leased): optional `streamCsv(input, signal?)` context seam.
- `packages/api/src/routers/index.ts` (leased): registers `admin.analytics.csv`.
- `apps/server/src/index.ts` (leased): constructs the reporting repository once and supplies
  `streamCsv` to the request context.
- `apps/server/src/reporting-repository.ts` (leased): abort-racing pool acquisition with
  late-client destruction and late-rejection consumption; parameterized transaction-local
  `set_config('statement_timeout', $1, true)` installed before every reporting read; single
  idempotent release boundary with destructive `release(true)` on abort and no post-destruction
  SQL; exported `CsvDiagnosticCategory` plus the `onCsvDiagnostic` option; SQLSTATE `57014`
  detection; primary-error preservation; `noUnsafeFinally`-safe cleanup helper.
- `apps/server/src/reporting-repository.test.ts` (leased): 13 tests, including the new SQLSTATE
  `57014` case and the corrected abort-during-pending-`FETCH` case.
- `apps/server/src/phase10-csv-transport.integration.test.ts` (new): 4 real-Postgres tests,
  including the rewritten deterministic `(pid, backend_start)` tracer.

## Validation commands and results

Resources: `FITWAY_RUN_ID=p10_csv_transport_b03`,
`TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55432/fitway_integration_p10_csv_transport_b03`,
`FITWAY_INTEGRATION_RESET_DATABASE=fitway_integration_p10_csv_transport_b03`,
`FITWAY_PHASE=phase10-csv-transport`. The disposable database already existed; no other database
was targeted or created.

| Command | Result |
| --- | --- |
| `pnpm exec vitest run packages/api/src/analytics/reporting/csv-transport.test.ts` | pass, 1 file / 8 tests |
| `pnpm exec vitest run packages/api/src/analytics/reporting/reporting.test.ts apps/server/src/reporting-repository.test.ts packages/api/src/analytics/reporting/csv-transport.test.ts` | pass, 3 files / 33 tests |
| `pnpm exec vitest run --config vitest.integration.config.ts apps/server/src/phase10-domain.integration.test.ts apps/server/src/phase10-csv-transport.integration.test.ts` | pass, 2 files / 5 tests |
| `pnpm exec biome check <eight authorized paths>` | pass, 8 files, no diagnostics |
| `pnpm check-types` | pass |
| `pnpm verify:fast` | pass, 41 files / 220 tests, 18 simulator tests, mutation guard clean |
| `pnpm verify:phase` | pass, fast ladder plus phase-10 CSV slice 1 file / 4 tests, mutation guard clean |
| `git diff --check` / `git diff --cached --check` | clean, exit 0 |
| `git diff --name-status c4bd178..HEAD` | exactly the eight authorized paths (3 `A`, 5 `M`) |
| `git status --short --branch` | clean apart from this untracked handoff |

The tracer test was additionally run four times in total with no flake, to probe the race between
the 250 ms injected statement timeout and the abort.

## Browser/a11y/visual artifacts

None. This slice produces no UI surface and the phase-10 CSV profile carries `browserFiles: []`.

## Independent verifier findings

None yet; independent verification has not run.

## Remaining work or exact blocker

None inside the slice. The complete frozen plan matrix (items 1-10) and the amendment's
replacement matrix (items 1-7) are proved green by the tests listed below.

Plan matrix:

1. `forwards the exact request AbortSignal to the CSV repository`.
2. `preserves a producer failure when iterator cleanup also rejects`.
3. `destroys the client once when abort interrupts a pending FETCH`.
4. `opens no database connection for an already-aborted export`.
5. `closes and rolls back the cursor when the CSV consumer stops early`.
6. `preserves a query failure when rollback and release also fail`.
7. `streams the raw header as its own first event before historical rows`.
8. `aborts a raw CSV stream without poisoning the next export`.
9. `destroys the exact lock-waiting export backend and permits a fresh export`.
10. `allows only active owners without starting rejected streams`,
    `rejects invalid ranges before streaming and accepts both inclusive boundaries`,
    `delivers ordered chunks lazily and completes cleanly`,
    `forwards iterator return and runs cleanup exactly once`,
    `forwards AbortSignal cancellation and runs cleanup exactly once`,
    `validates every yielded CSV event lazily`,
    `enforces owner auth and canonical wire validation statuses`,
    `streams a read-only cursor in bounded batches and releases it`,
    `enforces the CSV cap before opening a database connection`.

Amendment matrix:

1. `rejects an aborted pending acquisition promptly and destroys the late client` and
   `consumes a late acquisition rejection after returning the abort reason`.
2. `installs only the parameterized transaction-local CSV statement timeout before reporting reads`
   and `rejects every CSV statement-timeout injection except 250 or 30000 ms`.
3. `preserves SQLSTATE 57014 and reports only the timeout category without abort`,
   `destroys the client once when abort interrupts a pending FETCH`,
   `preserves a query failure when rollback and release also fail`,
   `preserves a producer failure when iterator cleanup also rejects`; `noUnsafeFinally` proved by
   `pnpm exec biome check` with no suppression comment in either generator.
4-6. `destroys the exact lock-waiting export backend and permits a fresh export`.
7. the plan-matrix items 7, 8, and 10 tests above, plus
   `rejects invalid ranges before streaming and accepts both inclusive boundaries` for the
   366/367-day boundary.

## Exact resume command

```powershell
cd D:/Projects/fitway-worktrees/phase10-csv-transport-b03
$env:FITWAY_RUN_ID='p10_csv_transport_b03'
$env:TEST_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:55432/fitway_integration_p10_csv_transport_b03'
$env:FITWAY_INTEGRATION_RESET_DATABASE='fitway_integration_p10_csv_transport_b03'
$env:FITWAY_PHASE='phase10-csv-transport'
pnpm verify:phase
```

## Stop/escalation conditions

- The candidate is `READY_FOR_INTEGRATION` only. Integration, `pnpm verify:full`, ledger updates,
  lease release, and `DONE` remain coordinator actions after a fresh verifier returns `PASS`.
- Any Product/Spec conflict, privacy or security ambiguity, or requirement unreachable inside the
  five-file lease is `NEEDS_HUMAN`.
- The same candidate gate red after two focused repairs is `FAILED_VALIDATION`.

## Residual risk for the verifier to probe

- The tracer aborts inside the injected 250 ms statement timeout window. Detection of
  `active`/`Lock` observed at the first or second 25 ms poll in every local run, so abort landed
  well inside the window; a much slower host could let the statement time out first. The test
  still holds in that case because it asserts prompt iterator rejection rather than the exact
  rejection reason, and the destroyed socket still retires the backend, but a verifier on slower
  hardware should confirm the disappearance deadline is met.
- The candidate has not been run under `pnpm verify:full`; that gate belongs to integration.
