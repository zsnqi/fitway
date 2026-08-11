# Phase 10 CSV transport b02 — accepted-domain contract stop

- Status: `NEEDS_HUMAN` shared-file authority stop before candidate validation.
- Recorded: 2026-08-11 23:20:29 +03:00.
- Activation / worker base: `9d7f4165fa36fb9128b3d68b8399da8fbbc866ce`.
- Coordinator state before this stop: `ab75a069016603f87715d7edbb67fcb84f477eeb`.
- Branch/worktree: `work/phase10-csv-transport-b02` /
  `D:/Projects/fitway-worktrees/phase10-csv-transport-b02`.
- Worker run/database: `p10_csv_transport_b02` /
  `fitway_integration_p10_csv_transport_b02`.
- Repair counter: `0/2`; no validation gate or repair attempt occurred.

## Exact blocker

The real raw-RPC regression proved that client input
`{ startBusinessDay: "2026-02-29", endBusinessDay: "2026-02-29" }` returns HTTP `500` and logs
`RPC request failed RangeError`. Anonymous, staff, unknown-key, and 367-day probes already return
their expected `401`, `403`, `400`, and `400` results respectively, and rejected requests do not
start the reporting stream.

The root cause is in the already-accepted `csvRangeInputSchema`: its base ISO-date refine records
an invalid calendar date, but its later `superRefine` still calls `inclusiveBusinessDayCount`,
which throws `RangeError` instead of returning a Zod validation issue. The transport cannot convert
that to canonical `400` without either masking the defect in a bespoke parser or changing the
forbidden accepted-domain contract. Both were correctly rejected.

The worker stopped before editing `packages/api/src/analytics/reporting/contracts.ts` or any other
unleased path. This is a shared-ownership/scope stop, not a Product, privacy, security, toolchain,
implementation, or database blocker.

## Preserved TDD evidence and worktree

- Red 1: the initial direct auth/read-suppression tracer failed because
  `appRouter.admin.analytics.csv` did not exist.
- Red 2: malformed-date direct validation rejected before stream construction but exposed the
  raw `RangeError`; the worker did not bless it as correct behavior.
- Red 3: explicit iterator `.return()` cleanup passed, while the separate `AbortSignal` tracer
  initially left injected cleanup at zero and drove the minimal signal-aware forwarding wrapper.
- Red 4: guarded real RPC produced the malformed-date `500` above and triggered this stop.

The worktree remains intentionally uncommitted at the activation base. Its exact status contains
only the seven originally authorized transport/wiring/evidence paths:

- modified: `apps/server/src/index.ts`, `packages/api/src/context.ts`,
  `packages/api/src/routers/index.ts`;
- untracked: `apps/server/src/phase10-csv-transport.integration.test.ts`,
  `packages/api/src/analytics/reporting/csv-transport.ts`, and
  `packages/api/src/analytics/reporting/csv-transport.test.ts`, plus the worker's durable blocked
  evidence at
  `docs/phase-records/handoffs/phase10-csv-transport/20260811-232057-p10_csv_transport_b02-worker-blocked.md`.

No accepted domain, repository, auth, manifest, lockfile, migration, UI/Paper, or coordinator file
is changed in that worktree. Preserve these bytes and do not reset, stash, or move b01/b02.

## Released authority

The coordinator clears the active owner, owned/forbidden path lists, heartbeat expiry, and shared
lease. The temporary `phase10-csv-transport` profile is removed from `main` because its integration
test is not integrated. The physical b02 branch/worktree and activation hash remain provenance.

## Smallest resume boundary

Before transport work resumes, create and independently review a focused accepted-domain
validation correction that leases only:

- `packages/api/src/analytics/reporting/contracts.ts`;
- `packages/api/src/analytics/reporting/reporting.test.ts` (or a new exact domain regression file
  if review finds that boundary cleaner).

The regression must prove malformed start and end calendar dates return ordinary schema issues
without throwing, while valid 1-day/366-day, reversed, and 367-day behavior remains unchanged.
The minimal correction is to skip inclusive-day arithmetic unless both dates are valid; it must
not change the 366-day policy, accepted DTOs, CSV columns, repository behavior, or valid inputs.

After that plan passes review, the coordinator may ratify b02 with fresh non-overlapping ownership,
restore the profile and original three-file aggregation lease plus the exact two-file domain lease,
and resume the same worker from its preserved bytes. The raw RPC malformed-date tracer must then
turn `500` to `400` before any remaining transport acceptance or validation gate runs.

## Stop conditions

Do not resume by weakening the failing assertion, accepting `500`, adding a transport-specific raw
parser, changing the range cap, editing the repository, or widening to another reporting semantic.
Any Product/Spec/security/privacy change or competing lease remains `NEEDS_HUMAN`.
