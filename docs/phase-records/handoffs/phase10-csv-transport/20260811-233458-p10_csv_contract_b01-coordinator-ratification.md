# Phase 10 CSV malformed-date contract correction — coordinator ratification

- Status: `IN_PROGRESS`; the exact two-file accepted-domain correction is authorized.
- Recorded: 2026-08-11 23:34:58 +03:00.
- Coordinator plan commit: `adfc5b6`.
- Reviewed plan:
  `docs/phase-records/handoffs/phase10-csv-transport/20260811-232425-p10_csv_contract_b01-plan.md`.
- Independent plan review: `PASS`; no blocker, missing check, or requested change.
- Preserved branch/worktree/base: `work/phase10-csv-transport-b02` /
  `D:/Projects/fitway-worktrees/phase10-csv-transport-b02` /
  `9d7f4165fa36fb9128b3d68b8399da8fbbc866ce`.
- Writer run/database: `p10_csv_contract_b01` /
  `fitway_integration_p10_csv_contract_b01`.
- Repair counter: `0/2`.

## Authority and objective

The prior `NEEDS_HUMAN` state correctly stopped an unleased shared-file edit. The user's standing
authority permits the coordinator to resolve routine in-scope leases after review. No Product,
Spec, privacy, security, CSV-policy, or user-visible decision is open.

Correct only the accepted CSV range schema so malformed calendar dates return ordinary Zod
validation failure without throwing. Preserve the one-day and 366-day acceptance boundary,
reversed/367-day rejection, direct-helper throwing behavior, messages, paths, cap, DTOs, and all
reporting/transport semantics.

## Exact ownership and isolation

The worker owns and holds an exclusive lease through 2026-08-18 23:34:58 +03:00 only for:

- `packages/api/src/analytics/reporting/contracts.ts`;
- `packages/api/src/analytics/reporting/reporting.test.ts`.

The b02 worktree remains intentionally dirty with seven preserved transport/wiring/evidence
paths. Those paths, every other source/config path, `scripts/verify.mjs`, and `PROJECT_STATE.yaml`
are forbidden during this correction. The worker must stage and commit exactly the two leased
files, never use broad staging, and leave all seven preserved paths byte-identical and dirty.

## Required execution

1. Reconfirm branch, exact HEAD, dirty-path inventory, live lease, ignored server environment,
   and Vitest resolution before editing.
2. Follow red-green TDD for malformed start and end dates, a true 366-day range
   (`2026-01-01` through `2027-01-01`), one-day acceptance, reversed rejection, and 367-day
   rejection.
3. Run the reviewed focused test, Biome, API type check, diff checks, and exact cached-name proof.
4. Commit only the two leased files and stop; do not resume CSV transport.
5. A fresh detached verifier must return `PASS` before coordinator integration.

## Stop conditions

Stop immediately for an expired/mismatched lease, any cached or modified path outside the two-file
correction, failed trust probe after the workflow's allowed frozen reinstall, a needed semantic
change beyond skipping invalid-date cap arithmetic, or a Product/Spec/security/privacy conflict.
No repair is consumed by a pre-edit authority or environment stop.
