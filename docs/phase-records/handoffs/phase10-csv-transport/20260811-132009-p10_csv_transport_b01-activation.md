# Phase 10 CSV transport b01 — activation

- Status: `READY` for isolated worktree trust preflight
- Activated: 2026-08-11 13:20:09 +03:00
- Coordinator base before activation: `5b9575f081a26b48021b8e09c8ae58aa073b3228`
- Branch/worktree: `work/phase10-csv-transport-b01` / `D:/Projects/fitway-worktrees/phase10-csv-transport`
- Worker run/database: `p10_csv_transport_b01` / `fitway_integration_p10_csv_transport_b01`
- Independent run/database: `p10_csv_transport_v01` / `fitway_integration_p10_csv_transport_v01`
- Repair count: 0 of 2

## Objective and authority

Expose the accepted incremental reporting CSV generator as an owner-only streamed oRPC procedure under `admin.analytics`. `SPEC.md` places CSV export in the staff/owner oRPC surface; do not introduce a bespoke HTTP download route and do not reopen that transport decision.

Reuse without modification: `csvRangeInputSchema`, the fixed CSV DTO/allowlist and `streamReportingCsv`, `createReportingRepository(db).streamCsv`, canonical authentication, and `ownerProcedure` enforcement. The ordered inclusive business-day range is capped at 366 days. Anonymous/inactive/ambiguous authentication is 401, valid staff is 403, and rejected requests must not start repository streaming.

The stream preserves the exact column order, one UTF-8 BOM, CRLF, RFC-4180 quoting, formula-prefix protection, Western digits, historical UTC and gym-local time, and distinct value/closed/missing/zero semantics. Export only authorized private analytics fields. No audit mutation, Edge OpenAPI, auth, migration/index, reporting-domain/repository semantic, UI, or Paper change is authorized.

## Ownership and rollback

Worker-owned and leased paths are exactly those recorded in `PROJECT_STATE.yaml`. Shared context/router/server aggregation may change only enough to inject the existing repository stream and mount the owner leaf. `scripts/verify.mjs` and `PROJECT_STATE.yaml` remain coordinator-only.

The rollback boundary is one additive candidate: reverting it removes the oRPC leaf, wiring, focused tests, integration proof, profile, and handoff without changing the accepted reporting domain or database.

## Preflight and gate ladder

1. Create the worktree only from the activation commit; run `pnpm install --frozen-lockfile`, provision ignored `apps/server/.env` from the trusted coordinator copy without printing it, and require `pnpm exec vitest --version` to print a version before moving to `IN_PROGRESS`.
2. Direct procedure tests cover canonical authorization, strict query input, ordered incremental chunks, early delivery, cancellation, and no unauthorized repository reads.
3. Existing reporting CSV/repository unit tests remain green; a guarded real-Postgres integration proves authenticated stream shape, historical semantics, zero/closed/missing rows, snapshots, and private-field exclusion.
4. Run Biome/type checks, `pnpm verify:fast`, and guarded `FITWAY_PHASE=phase10-csv-transport pnpm verify:phase` with the exact worker identifiers.
5. Commit a clean worker candidate/handoff; a fresh verifier repeats every gate with the independent identifiers and performs a security/privacy/diff review.
6. Only verifier PASS permits coordinator integration and a full non-writing verification.

If the exact fresh-worktree preflight is externally rejected, record that execution path once, return the stream to external `BLOCKED`, release lease/profile, and keep repair count 0. Do not generalize the result to other streams or retry/work around it.
