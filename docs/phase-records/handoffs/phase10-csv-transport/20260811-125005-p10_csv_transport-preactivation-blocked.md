# Phase 10 CSV transport — pre-activation external block and resume plan

- Status: `BLOCKED` before activation
- Recorded: 2026-08-11 12:50:05 +03:00
- Repository authority point: `3d69e4c6cd61c1ed7b8a3fbbeff510e8dcb11a1a`
- Repair count: 0 of 2
- Worker/branch/worktree/profile/lease/candidate: none

## Exact external blocker

The coordinator's single required fast verification attempt established the current host condition before this stream was activated:

```text
FAILED_VALIDATION: spawn EPERM
[ELIFECYCLE] Command failed with exit code 1.
```

The mandatory fresh-worktree trust gate requires a frozen install and a successful `pnpm exec vitest --version` probe. Current child-process creation capacity prevents that gate from starting. No Phase 10 CSV assertion ran, so this is external `BLOCKED`, not candidate `FAILED_VALIDATION`, and the validation repair count remains zero.

Do not create a branch/worktree, register a verification profile, allocate a lease, or retry/diagnose the host failure while this blocker remains authoritative.

## Resolved transport authority

`SPEC.md` places owner analytics and streamed CSV export in the staff/owner oRPC procedure surface. Resume with an owner-only oRPC event stream under `admin.analytics`; do not introduce a bespoke `/api/admin/analytics/csv` route and do not reconsider the transport seam.

The implementation must reuse the accepted Phase 10 domain and repository without modification:

- `csvRangeInputSchema`, the fixed CSV allowlist/DTOs, and `streamReportingCsv`;
- `createReportingRepository(db).streamCsv`, including its repeatable-read read-only cursor, bounded batches, and cancellation cleanup;
- canonical session authentication and existing `ownerProcedure` role enforcement.

Locked behaviour:

- anonymous, inactive, expired, or ambiguous authentication is `401`; valid staff is `403`; owner access succeeds;
- the ordered inclusive business-day range is capped at 366 days and rejects missing, duplicate, unknown, malformed, reversed, or over-cap inputs before repository streaming;
- the stream preserves one UTF-8 BOM, CRLF records, exact fixed column order, RFC-4180 quoting, formula-prefix protection, Western digits, historical UTC and gym-local time, and distinct value/closed/missing/zero semantics;
- only authorized private analytics fields are exported; no device, token, member, health, or unrelated private data may appear;
- this read-only export adds no audit mutation, OpenAPI edge surface, migration/index, UI/Paper, or reporting-domain semantic change.

## Activation scope after unblock

Freeze the exact path list in a fresh activation record. The smallest expected surface is one additive reporting transport module plus direct unit tests and one real-Postgres integration test. Temporary exclusive coordinator leases are required only for API context/router aggregation, server dependency wiring, and the exact `scripts/verify.mjs` profile registration. `PROJECT_STATE.yaml` remains coordinator-only.

The rollback boundary is one additive candidate and its constrained mount/profile edits. Reverting that integration commit must remove the oRPC leaf, wiring, tests, profile, and handoff without changing the accepted reporting domain or database.

## Predeclared verification

1. Direct procedure tests prove 401/403/owner behaviour, strict range parsing, ordered incremental chunks, and cancellation without unauthorized repository reads.
2. Existing reporting CSV and repository unit tests remain green.
3. A disposable real-Postgres integration test proves authenticated transport shape, historical UTC/local semantics, genuine zero, closed/missing rows, snapshot fields, and private-field exclusion.
4. Biome, type checks, `pnpm verify:fast`, and a registered non-browser `phase10-csv-transport` phase profile pass with isolated worker and verifier run/database identifiers.
5. A fresh independent security/privacy/diff review passes before coordinator integration.

## Exact unblock condition

Host child-process creation works again, then a fresh worktree completes `pnpm install --frozen-lockfile` and `pnpm exec vitest --version` prints a version. Only afterward may a fresh coordinator activation allocate the branch, worktree, paths, leases, profile, and isolated run resources.
