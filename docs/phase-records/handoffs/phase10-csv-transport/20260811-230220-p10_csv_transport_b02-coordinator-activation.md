# Phase 10 CSV transport b02 — coordinator activation

- Status: `READY` for fresh isolated worktree preflight; no implementation edit has started.
- Activated: 2026-08-11 23:02:20 +03:00.
- Immutable BRG ancestry floor: `4df79885ef7e039dcf2d27eb87cf41f8c78b73e2`.
- Exact activation parent: `b9e95652d3a8a1d2cd177e10a5f868e1a8a74e3a`.
- Activation commit / worker initial HEAD: `SELF` (this commit).
- Reviewed plan:
  `docs/phase-records/handoffs/phase10-csv-transport/20260811-224520-p10_csv_transport_b02-plan.md`.
- Branch/worktree: `work/phase10-csv-transport-b02` /
  `D:/Projects/fitway-worktrees/phase10-csv-transport-b02`.
- Worker run/database: `p10_csv_transport_b02` /
  `fitway_integration_p10_csv_transport_b02`.
- Independent verifier run/database: `p10_csv_transport_v02` /
  `fitway_integration_p10_csv_transport_v02`.
- Coordinator integration/full run/database: `p10_csv_transport_c02` /
  `fitway_integration_p10_csv_transport_c02`.
- Fresh repair counter: `0/2`.

## Authority and target

The independently reviewed b02 plan is adopted without widening. Implement exactly the
owner-only `admin.analytics.csv` oRPC event iterator at `/rpc/admin/analytics/csv`. Reuse the
accepted Phase 10 range schema, fixed CSV encoder/allowlist, and reporting repository stream
without semantic changes. Canonical missing/inactive authentication remains `401`, valid staff
remains `403`, and rejected requests must not begin repository streaming.

The stream remains incremental and preserves one BOM, CRLF, fixed column order, RFC-4180 quoting,
formula-prefix protection, Western digits, historical UTC and gym-local time, historical snapshot
fields, and distinct genuine-zero/closed/missing rows. It exposes no public history, device/token,
identity/member, health, or unrelated private data. It adds no audit mutation.

The activation parent is current dependency-complete `main`; the immutable BRG hash above is its
verified ancestor. Branching directly from BRG would omit the accepted `phase10-domain` dependency.
This dependency-aware identity is recorded explicitly and does not alter the baseline ledger.

## Ownership and lease

`PROJECT_STATE.yaml` contains the exact four worker-owned path patterns and the sole exclusive
lease through 2026-08-18 23:02:20 +03:00. The lease covers only `packages/api/src/context.ts`,
`packages/api/src/routers/index.ts`, and `apps/server/src/index.ts` for the one CSV reader/leaf/
repository wiring seam. Existing b01 records are immutable provenance. The coordinator alone owns
the ledger and the restored `scripts/verify.mjs` profile.

No manifest, lockfile, dependency, auth, OpenAPI, audit, environment, database schema/index/
migration, reporting-domain/repository semantic, UI/Paper, browser, or visual-baseline change is
authorized.

## Required preflight

1. Commit this activation and create b02 at that exact commit; do not reuse or move b01.
2. In b02 run `pnpm install --frozen-lockfile`, copy the trusted ignored `apps/server/.env`
   without reading or printing it, and run `pnpm exec vitest --version`.
3. If the probe fails, the only repair is one more frozen install followed by the identical
   probe. A second failure returns the slice to `BLOCKED`, removes the temporary profile, releases
   ownership/lease, preserves evidence, and consumes no validation repair.
4. Only a passing version probe permits the coordinator to record the exact activation hash and
   `IN_PROGRESS`, after which the worker may begin red-green TDD inside the frozen scope.

## Stop conditions

Stop before implementation for mismatched ancestry/branch/worktree, dirty source, expired lease,
untrustworthy Vitest resolution, or missing ignored server environment. Stop during execution for
any need outside the owned/leased paths or any Product/Spec/security/privacy conflict. A worker
candidate is only `READY_FOR_INTEGRATION`; fresh independent verification and coordinator full
validation remain mandatory before `DONE`.
