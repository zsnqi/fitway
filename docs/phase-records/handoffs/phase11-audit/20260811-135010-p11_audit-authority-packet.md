# Phase 11 audit — plan-ready authority packet

- Status: `BLOCKED` before b01 activation by isolated-worker capacity
- Prepared: 2026-08-11 13:50:10 +03:00
- Repository authority point: `113b5e8`
- Dependencies: `phase-5` and `phase-9`, both `DONE`
- Repair count: 0 of 2
- Candidate/worker/branch/worktree/profile/lease: none

## Observable slice

Add one owner-only `admin.audit.list` read surface that returns newest-first, bounded keyset pages of immutable audit records and renders loading, empty, error, and populated history within the approved Owner/Management family. Missing/expired authentication is 401; staff is 403.

Each row exposes persisted actor attribution, action, prior value, effective value, nullable reason, and server timestamp. Correction-specific requested delta/value may remain supplemental provenance. Strict filters cover actor, action, from, to, timestamp range, and nullable reason text. From/to filters are numeric exact matches, with an explicit missing-prior option for nullable `from`; null is never coerced to zero.

## Locked semantics

- Actor is the stable authenticated principal referenced by the audit row. Shared staff remains one real front-desk principal; never invent a staff email or per-person identity. Use persisted principal ID/kind/role and `display_name`; expose no credential or session data.
- Current actions remain exactly `correction_delta`, `correction_absolute`, and `reset`. Do not pre-generalize access/settings/system actions in this slice.
- `from` is nullable `priorValue` and null never means zero. `to` is `effectiveValue`; delta reflects the floored effective result, absolute preserves requested/effective parity, and reset is zero.
- Reason is optional trimmed text up to 240 characters; null stays absent. Timestamp is the persisted server `createdAt` UTC instant emitted as ISO UTC. The UI formats that instant with `formatGymTime`, the configured gym IANA timezone, the selected locale, and Western digits; browser/device timezone must not affect display or filters.
- Existing command/audit atomicity is frozen. The read slice may not alter command service, transaction adapters, append semantics, or future scheduled-reset principal representation.

## Reuse and gaps

Reuse reviewed migration `0005`, the `audit_log` constraints/FKs/unique command linkage, its `(created_at,id)` index, the existing append repository and Phase 5 atomic write proof, canonical owner guard, and current context/router/server injection pattern.

Missing and owned by the future slice: transport DTO/input/output schemas, strict filters and cursor contract, query/repository list path, `admin.audit` wiring, Owner history UI, and focused unit/integration/browser evidence. The existing command-write `HumanAuditEntry` with `Date` is not the transport DTO.

Audit-retention cron/cleanup is separate system work and is not included.

## Database and scope decision

No migration, index, environment, or platform change is currently required. The existing keyset index supports deterministic newest-first pagination, and no measured plan or Product/Spec target justifies another index. Any later schema/index need requires coordinator review and evidence.

Expected worker-owned paths are:

- `packages/api/src/audit/**`
- `apps/server/src/audit-repository.ts`
- `apps/server/src/audit-repository.test.ts`
- `apps/server/src/phase11-audit.integration.test.ts`
- `apps/web/src/components/owner/audit/**`, including component-owned bilingual messages and message hook
- `apps/web/src/hooks/use-owner-audit.ts` and `apps/web/src/hooks/use-owner-audit.test.ts`
- `tests/browser/phase11-audit.browser.spec.ts` and its Phase 11 audit screenshot subtree
- `docs/phase-records/handoffs/phase11-audit/**`

Temporary coordinator leases are exactly `packages/api/src/context.ts`, `packages/api/src/routers/index.ts`, `apps/server/src/index.ts`, and `apps/web/src/routes/admin.tsx`. `PROJECT_STATE.yaml` and `scripts/verify.mjs` remain coordinator-only. Database/migrations, auth, command writes, generated route tree, global catalogs/configuration, unrelated UI, canonical baselines, and other phase records remain forbidden.

To preserve the accepted shell candidate without rebuilding it, resume order after capacity returns is Phase 11 shell b02 first, then audit b01 rebased on integrated shell, then access b01 rebased on integrated audit. Each stream releases `/admin`, aggregation, and generalized audit resources before the next activation.

## Predeclared verification

1. Unit/repository tests: strict inputs, keyset cursor, equal-timestamp ordering, nullable prior/reason, actor/action/from/to/time/reason filters, action/value mapping, actor labels, and loading/empty/error/populated UI.
2. Guarded disposable-Postgres integration: 401/403/owner success, stable pages without duplicate/skip, all six filters including nullable `from`, real staff/owner labels, no credential leakage, and unchanged Phase 5 rows.
3. Arabic RTL and English LTR browser proof at required responsive anchors, configured-gym-timezone display with Western digits and device-timezone independence, keyboard/filter focus, 200% zoom/reflow, forced colors, reduced motion, Axe, and all states.
4. Freeze worker run/database `p11_audit_b01` / `fitway_integration_p11_audit_b01`, verifier run/database `p11_audit_v01` / `fitway_integration_p11_audit_v01`, and currently collision-free Playwright ports `20703` / `20709` plus isolated output directories in the activation record.
5. Use separate PowerShell steps for guarded verification: set `$env:FITWAY_RUN_ID`, `$env:TEST_DATABASE_URL`, and `$env:FITWAY_INTEGRATION_RESET_DATABASE`; run the focused integration; set `$env:FITWAY_PHASE='phase11-audit'`; then run `pnpm verify:phase`. Also require Biome/types, `pnpm verify:fast`, a clean mutation guard, and a fresh verifier with the reserved independent resources.
6. Coordinator integration only after verifier PASS; full verification at the batch boundary.

Rollback is the additive worker candidate plus its coordinator profile/ledger/shared-mount reconciliation commit. Reverting both removes the read contract, wiring, UI, profile, and activation artifacts while preserving migration `0005`, existing rows, and Phase 5 atomic writes.

## Stop conditions and unblock

Synthetic identities, future action kinds, weakened atomicity, a new migration/index without evidence, or scope beyond the exact leases is immediate `NEEDS_HUMAN`/replan. No current Product/Spec conflict is open.

Do not launch a per-stream capacity probe. Resume only after a known external capacity change or one coordinator-authorized shared isolated-worker probe completes frozen install, prints the Vitest version, and reaches assertion collection through Vite/Vitest configuration. Then issue a fresh b01 activation from current main with audit before access.
