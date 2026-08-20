# Phase 11 audit generalization c01 — Phase 7 fixture compatibility repair plan

- Recorded: 2026-08-16 22:15 +03:00.
- Status: `PLAN_REVIEW_REQUIRED`; no Phase 7 file has been edited by this record.
- Candidate branch: `codex/phase11-audit-gen-recovery`.
- Stage 2 integration proof: `e015034`, `11/11` passed on the exact c01 database.
- Validation repair budget after observed gates: `2/2`.

## Observed regression gate

The frozen Phase 5 command-domain integration file passed `4/4`. The next serialized file,
`phase7-integration.integration.test.ts`, passed `6/15` and failed `9/15`. Every failure reached
the same PostgreSQL error: `42703`, column `audit_log.event_class` does not exist.

This is a fixture-schema mismatch. The test resets the database, applies migrations through `0005`,
seeds the pre-Phase-7 command/audit rows, and applies `0006`; it intentionally ignores later
migrations. The imported current Drizzle `auditLog` schema now emits the additive `0007` columns,
so every command-service audit insert fails before exercising the Phase 7 behavior under test.

## Narrow repair lease

One coordinator lease is granted for
`apps/server/src/phase7-integration.integration.test.ts` only. Preserve its legacy `0000`-`0005`
seed and its isolated `0006` ordering assertions. After applying `0006`, apply every later migration
in filename order before constructing current-schema repositories/services. No test expectation,
production path, migration, configuration, or other Phase 7 file may change.

Rollback boundary: one fixture-only commit. Reverting it restores the previously accepted Phase 7
test unchanged and leaves the Phase 11 migration/proof commits intact.

## Verification fixed before repair

1. Biome and `git diff --check` on the one leased file.
2. Exact Phase 7 integration file on `p11_audit_gen_c01` / the exact c01 database: `15/15` required.
3. Re-run the new audit-generalization file and the Phase 11 audit file serially on c01.
4. `pnpm check-types` and `pnpm verify:fast`.
5. Fresh independent diff review before integration.

A failure caused by the same missing-column fixture after this repair is a third recurrence and
`FAILED_VALIDATION`; do not widen the repair.
