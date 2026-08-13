# Phase 10 CSV malformed-date contract correction — integrated

- Status: `DONE` for the bounded accepted-domain correction; CSV transport remains separately
  `PLANNED` and unassigned.
- Recorded: 2026-08-13 11:40:47 +03:00.
- Candidate: `668898373be2de19d3f825ea7dc37da1ac7e909a`.
- No-fast-forward integration commit:
  `cd0c27534d5d27f9e6cf8073a9a38fc96d8f5cb1`.
- Candidate parent / preserved transport activation:
  `9d7f4165fa36fb9128b3d68b8399da8fbbc866ce`.
- Branch/worktree: `work/phase10-csv-transport-b02` /
  `D:/Projects/fitway-worktrees/phase10-csv-transport-b02`.
- Independent verifier worktree:
  `D:/Projects/fitway-worktrees/phase10-csv-contract-v01`.
- Writer/verifier/coordinator run IDs: `p10_csv_contract_b01` /
  `p10_csv_contract_v01` / `p10_csv_contract_c01`.
- Repair counter: `0/2`.

## Resolution

Execution capacity recovered on 2026-08-13. The same clean verifier that had been blocked proved
Vitest 4.1.10 on Node 24.14.0, Docker 29.6.1, and disposable Postgres access. Only the exact
database `fitway_integration_p10_csv_contract_v01` was created for independent verification.

The correction makes `csvRangeInputSchema.safeParse` return ordinary validation failure for an
invalid start or end calendar date instead of throwing from inclusive range arithmetic. It adds
only two validity guards. The direct `inclusiveBusinessDayCount` helper, its `RangeError` and
message, Zod issue paths/messages, 366-day cap, DTOs, repository, CSV generation, transport, and
router/context/server behavior remain unchanged.

The integrated diff is exactly:

- `packages/api/src/analytics/reporting/contracts.ts`;
- `packages/api/src/analytics/reporting/reporting.test.ts`.

## TDD and independent verification

- Writer red: malformed calendar input threw
  `RangeError("Reporting range must contain ordered ISO business days")`.
- Writer green: reporting suite 12/12; Biome two files; API types; diff/scope checks.
- Independent focused reporting: 12/12.
- Independent reporting repository: 5/5.
- Independent active boundary probe: malformed start/end reject without throws; one-day and true
  366-day (`2026-01-01` through `2027-01-01`) pass; reversed and 367-day fail; direct helper still
  throws on invalid inputs and returns 366 at the maximum.
- Independent `verify:fast`: PASS — repository invariants, Biome 225 files, workspace types,
  38 files/168 Vitest tests, 18 Python simulator tests, mutation guard.
- Independent `FITWAY_PHASE=phase10-domain pnpm verify:phase`: PASS — same fast ladder plus
  1 file/1 Postgres integration test and mutation guard.
- Independent diff/status: exact two-file scope and clean detached worktree.

## Coordinator validation

Using exact disposable database `fitway_integration_p10_csv_contract_c01`:

- focused reporting: 12/12 PASS;
- `pnpm verify:fast`: PASS — 38 files/168 tests plus 18 simulator tests;
- `FITWAY_PHASE=phase10-domain pnpm verify:phase`: PASS — 1/1 Phase 10 integration;
- `pnpm verify:full`: PASS — builds, 9 files/32 integration tests, 57 browser/accessibility
  tests, and repository mutation guard.

All coordinator diff checks and final status were clean before closeout. The Phase 10 domain
milestone now records the correction integration as its latest accepted commit while remaining
`DONE`.

## Preserved transport frontier

The b02 worktree remains intentionally dirty with the same seven transport/wiring/evidence paths;
their bytes were not integrated, reset, stashed, or rebuilt. The correction commit is now the b02
branch tip and its two source files match accepted `main`.

CSV transport is returned to unassigned `PLANNED` with no live owner, source lease, profile, or
stop reason. The next slice must ratify the original reviewed b02 transport plan against current
`main`, restore only its exact profile/shared aggregation lease, verify the seven preserved paths
are unchanged, and resume the same writer rather than rebuilding.
