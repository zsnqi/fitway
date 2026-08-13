# Phase 10 CSV transport b03 timeout amendment

- Status: `PLAN_REVIEW_REQUIRED`; active b03 remains `IN_PROGRESS`, repair `0/2`, with no candidate
  or commit.
- This additive record supersedes only the cancellation-mechanism clauses of the immutable reviewed
  `20260813-121151-p10_csv_transport_b03-plan.md`. Every other outcome, scope, frozen behavior,
  resource, gate, failure, rollback, and verification requirement in that plan remains binding.

## Reproduced defect and rejected mechanism

`PoolClient.release(true)` rejected the pending iterator but the exact export backend remained
`active` / `Lock` for more than five seconds while the independent blocker remained held. A
deprecated driver CancelRequest path did not retire it. This was pre-candidate TDD evidence, not a
validation-gate failure.

No control connection, cached-PID signaling, `pg_cancel_backend`, `pg_terminate_backend`, elevated
privilege, new credential, environment change, or production-topology assumption is authorized.

## Measured maximum-range evidence and fixed budget

The coordinator populated only the exact disposable b03 database with a dense 366-day fixture:
`2026-01-01..2027-01-01`, 527,040 observed minute rows, all-day schedules, batch size 1,000. A cold
read observed settings 4 ms, cursor declaration 4 ms, and maximum `FETCH` 199 ms. Three subsequent
runs observed maximum `FETCH` 148/147/143 ms, average 3 ms, settings 3-4 ms, and declaration 3-4 ms.
Total CSV encoding may legitimately exceed two minutes; the timeout is deliberately per database
statement and is not a total-export, transaction-idle, or consumer-backpressure deadline.

- Production `statement_timeout`: exactly `30_000` ms, more than 150 times the observed cold
  maximum statement time for the maximum valid dense fixture.
- Focused test injection: exactly `250` ms or the production default; no other injected value is
  accepted. The option is a positive safe integer and never exceeds the production default.
- Test polling interval: `25` ms.
- Post-timeout observation allowance: `1_500` ms.
- The backend-disappearance deadline is measured from abort and is
  `configured statement timeout + 1_500 ms`. Disappearance is an observed consequence of the
  timeout plus prior socket destruction, not a claim that `statement_timeout` terminates sessions.

The accepted range boundary remains explicit: `2026-01-01..2027-01-01` succeeds as 366 inclusive
days; `2026-01-01..2027-01-02` rejects as 367 before any database acquisition.

## Replacement implementation contract

1. Race `database.$client.connect()` against abort. Attach settlement handlers before racing.
   When abort wins, reject promptly with the exact `signal.reason`; a late client is released exactly
   once before any query, a late rejection is consumed, and no residual waiter is asserted until the
   connect promise settles.
2. After acquisition, register the abort listener and immediately recheck the signal. Use one
   idempotent release boundary. Abort calls `release(true)` immediately and exactly once. After
   destructive release, issue no `CLOSE`, `ROLLBACK`, or other SQL on that client.
3. Start the existing repeatable-read/read-only transaction. Before the settings read, install the
   timeout with parameterized `SELECT set_config('statement_timeout', $1, true)` using the validated
   decimal millisecond string. It bounds the settings read, cursor declaration, and every `FETCH`.
   It does not bound acquisition, `BEGIN`, the `set_config` statement itself, idle/backpressure time,
   CSV encoding, or the total export.
4. Normal completion retains exact `CLOSE -> COMMIT -> release()` behavior. Consumer early return or
   non-abort failure retains `CLOSE` when opened, `ROLLBACK`, and reusable `release()`.
5. Cleanup is an idempotent helper called by the generator. No `throw` or `return` occurs directly in
   `finally`. Cleanup failures never replace a primary producer/query/abort failure and surface only
   when no primary exists.
6. If a statement times out without abort, PostgreSQL SQLSTATE `57014` remains primary, cleanup and
   rollback are attempted, and the client is released reusably. If the signal fired, the exact
   `signal.reason` remains primary over socket, timeout, and cleanup failures.
7. Emit only category diagnostics for `csv_statement_timeout` and `csv_abort`; never log SQL,
   parameters, range values, CSV content, connection/database details, or credentials. The existing
   owner transport generic error boundary remains unchanged.

## Replacement red/green evidence

In addition to all frozen b03 tests:

1. Abort during pending pool acquisition rejects promptly with the exact reason. Late success is
   released once without a query; late rejection is consumed; after settlement there is no waiter.
2. The unit fake proves parameterized transaction-local timeout installation precedes every
   reporting read, accepts only default `30_000` or test `250`, and preserves normal/early/error
   transaction ordering.
3. Independent statement timeout preserves SQLSTATE `57014`; abort preserves `signal.reason`; query
   and producer errors remain primary over cleanup/release errors. Cleanup satisfies Biome
   `noUnsafeFinally` without suppression.
4. The real-Postgres tracer gives the export pool a unique `application_name`, uses its `acquire`
   event to identify the exact repository-owned client in test code, and binds exact
   `(pid, backend_start)` through the observer's `pg_stat_activity` query. It never pre-borrows and
   releases a guessed export client and adds no production PID query.
5. With the blocker held and export pool `max: 1`, poll every 25 ms until that tuple is
   `active` / `Lock`; abort before a CSV event; require prompt iterator rejection; keep the blocker
   held; require the exact tuple absent no later than 1,750 ms under the 250 ms test timeout.
6. Keep blocker/export pools open until disappearance is established. Release the blocker, then run
   a fresh export successfully on the same max-one export pool. Only afterward close all pools in
   the outer `finally`. No control connection is opened by production code.
7. Preserve the raw-SSE first-event equality, decoded-boundary abort/retry, owner-only auth,
   validation-before-read, history, privacy, CRLF/BOM, and accepted 366/367-day boundary matrix.

## Frozen scope and ratification

Authorization, privacy allowlist, CSV/range/history/report-query/projection semantics, transaction
isolation, cursor batching, schema, migrations, environment, UI, and Paper remain frozen. The five
leased shared files and worker-owned files do not change. No Product, privacy, security, privilege,
credential, or topology decision is introduced.

Next step: fresh independent review of this complete additive amendment, then coordinator
ratification in the live ledger before the existing b03 worker resumes. No repair is consumed by
the plan correction.
