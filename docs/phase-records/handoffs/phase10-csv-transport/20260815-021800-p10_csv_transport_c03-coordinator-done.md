# Phase 10 CSV transport — coordinator integration and DONE

- Status: `DONE`. Repair attempts consumed: `0/2`.
- Integrated commit: `3ce3efd` (`merge: integrate phase 10 CSV transport b03`, no-fast-forward).
- Candidate: `79b9b80` on `work/phase10-csv-transport-b03`, base `c4bd178`.
- Evidence handoffs: worker `9144ec1`, verifier findings summarized below.
- Coordinator run ID / database: `p10_csv_transport_c03` /
  `fitway_integration_p10_csv_transport_c03`.

## What shipped

An owner-only `admin.analytics.csv` oRPC event iterator that streams per-minute reporting CSV, whose
database work is genuinely cancellable rather than merely queued behind a pending `next()`:

- the request `AbortSignal` is threaded through API context into the reporting repository;
- pool acquisition races the signal, a late client is released exactly once without issuing a query,
  and an already-aborted signal opens no connection at all;
- a parameterized transaction-local `SELECT set_config('statement_timeout', $1, true)` bounds the
  settings read, cursor declaration, and every `FETCH`, and accepts only the `30_000` ms production
  value or the `250` ms test injection;
- one idempotent release boundary: normal completion is `CLOSE -> COMMIT -> release()`, consumer
  early return or non-abort failure is `CLOSE -> ROLLBACK -> release()`, abort is `release(true)`
  exactly once with no SQL afterwards;
- error precedence holds in all four combinations: the exact `signal.reason` outranks socket,
  timeout, and cleanup failures; SQLSTATE `57014` survives as primary when no abort occurred; a
  cleanup failure never masks a primary failure;
- diagnostics are category-only (`csv_abort`, `csv_statement_timeout`) and emit nothing else.

Frozen throughout: the CSV contract, range and history semantics, the privacy allowlist, transaction
isolation, cursor batching, schema, migrations, and environment.

## Independent verification — `PASS`

A fresh verifier that did not implement the candidate ran from a clean detached worktree at the
exact candidate on its own disposable database `fitway_integration_p10_csv_transport_v03`, and was
instructed not to read the implementer's handoff until it had recorded its own assessment.

Scope: `git diff --name-status c4bd178..79b9b80` returned exactly the eight authorized paths, three
added and five leased-and-modified, with every frozen surface absent from the diff.

Matrix: all ten frozen plan items and all seven amendment clauses and evidence items proved, each
named to a specific test. The verifier checked that assertions exercise what they claim rather than
passing incidentally — notably that the pending-`FETCH` abort test's rejection path is reachable
only through `release(true)`, so it cannot pass without destructive release.

Findings, all judged non-violations with file and line evidence:

1. **Low** — when abort is observed at a loop condition rather than during a pending `next()`, the
   transport generator exits via `return`, so a consumer sees `{done: true}` rather than a
   rejection. Confirmed by probe. No plan or amendment clause requires the transport to reject on
   abort; the prompt-rejection requirement covers the pending-`next()`/pending-`FETCH` case, which
   does reject with the exact reason. Practical exposure is nil because the signal is the oRPC
   request signal, so the consumer is gone by construction.
2. **Low** — the trailing `throw cleanupError` after each `try/finally` is unreachable on the
   consumer `.return()` path, because a `finally` that completes normally resumes the injected
   return completion. Confirmed by probe. Both statements stay reachable on the loop-exit and
   normal-completion paths, and both the plan and amendment phrase cleanup surfacing permissively.
3. **Informational** — production supplies no `onCsvDiagnostic` sink, so no diagnostic is emitted in
   the running server. Amendment clause 7 constrains what may be emitted rather than mandating a
   sink; adding one would be new production logging outside the lease.
4. **Informational** — one sentence of the worker handoff's residual-risk argument is inaccurate.
   If the statement timeout wins the race, the `57014` path releases the client reusably, the
   backend survives, and the disappearance poll fails — a visible red, never a false green. The
   conclusion is safer than the argument given. No code impact.

Flakiness: the real-Postgres cancellation tracer ran 12 times in isolation plus once inside the
combined integration run and once inside `verify:phase` — 14 green, zero flakes. The verifier
established that the test cannot pass incidentally, because a non-destructive release, a no-op
`release(true)`, or a timeout-wins race all leave the backend alive in a `max: 1` pool whose idle
timeout far exceeds the 1,750 ms deadline.

Not proved by verification, and recorded as such: behaviour on materially slower hardware where the
sub-250 ms abort window could be missed (which fails red, not green); the dense 366-day performance
measurements underpinning the 30,000 ms production budget; and real backpressure from a genuinely
disconnecting HTTP client against production Postgres.

## Merge reconciliation

One conflict, in `apps/server/src/index.ts`: import ordering only, between the Phase 7/8 reset and
retention imports on `main` and the new reporting-repository import. Resolved by keeping all three in
Biome's sorted order; `biome check` on the merged file reports no diagnostics. No behavioural
reconciliation was required, and no other shared file conflicted.

The ratified timeout amendment `ef36cd0` is on `main` but is **not** an ancestor of the b03 branch
point `c4bd178`, because b03 was activated roughly half an hour before the amendment was ratified.
The worker implemented against the amendment read from the coordinator worktree. This is expected
and the merge reunites document and implementation; it is recorded here so no later reader treats it
as provenance drift.

`scripts/verify.mjs` regained the `phase10-csv-transport` profile in `d331685` before the merge,
restoring the profile removed at the b03 blocker rollback.

## Coordinator gates on merged `main`

| Gate | Result |
| --- | --- |
| Focused integration (`phase10-domain` + `phase10-csv-transport`) | PASS — 2 files, 5 tests |
| `pnpm verify:full` | PASS, exit 0 |
| Browser suite inside the full ladder | PASS — 57 tests |
| Repository mutation guard | "Verification full passed without repository mutation." |
| `git status --short` after the ladder | clean |

## Released

Owner, heartbeat, and lease expiry cleared. The five-file shared lease over
`packages/api/src/context.ts`, `packages/api/src/routers/index.ts`, `apps/server/src/index.ts`, and
`apps/server/src/reporting-repository{.ts,.test.ts}` is released. The verification profile is
retained because the slice is now integrated. The b03 branch, its worktree, and the rejected b02
history remain immutable provenance.

`phase10-ui-csv` now has all three of its prerequisites — `phase10-domain`,
`phase10-paper-reporting`, and `phase10-csv-transport` — `DONE`.

No push, no deploy, no external provisioning.
