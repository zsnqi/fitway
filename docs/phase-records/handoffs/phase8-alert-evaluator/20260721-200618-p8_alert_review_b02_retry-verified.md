# phase8-alert-evaluator retry independent verification

- Status: `VERIFIED_READY_FOR_INTEGRATION`
- Base commit / candidate commit: `6396d5b70ca533c890624c716be2733a06dfa2a0` /
  `cb63cc4d2190eb08b3f4021e180cff86484f0347` (handoff `bca34049f3b4dba3e3dfa0418553ef7d1b43681c`)
- Branch / worktree / run ID: `work/phase8-alert-evaluator-b02-retry` /
  `D:/Projects/fitway-worktrees/phase8-alert-evaluator-retry` / `p8_alert_review_b02_retry`
- Verifier database: `fitway_integration_p8_alert_review_b02_retry` (fresh, created for this
  run, distinct from all implementer and prior-verifier databases)

## Scope and ownership review

- Range `6396d5b..bca3404` contains exactly three commits: the coordinator activation
  `f4fe3d6` (coordinator-owned `PROJECT_STATE.yaml` plus retry records only), implementation
  `cb63cc4`, and handoff `bca3404` (one record file only).
- `cb63cc4` touches only owned or leased paths: `packages/api/src/alerts/{evaluator,types,
  evaluator.test}.ts`, `apps/server/src/alert-repository.ts`,
  `apps/server/src/phase8-alert-evaluator.integration.test.ts`,
  `packages/db/src/schema/application.ts` (one enum value on `alert_delivery_outcome` only),
  and the existing `0004` migration SQL and snapshot. No router/context/index, env, OpenAPI,
  UI, cron, transport, or retention change; no root manifest or lockfile change.
- Migration history: `0000`–`0003` untouched; no `0005` lane; `meta/_journal.json` unchanged
  since the rejected candidate (single `0004` entry preserved); amended `0004` SQL matches the
  amended `0004` snapshot (`alert_delivery_outcome` = `claimed | delivered | failed`).
- Public payload v2 code untouched; no alert, health, or device-identity leak into any public
  surface. The notifier remains a one-function injected boundary; no Telegram or network code.

## Finding-by-finding conformance

1. **Cross-device isolation — resolved.** `unresolvedAlert`, `failureStartedAt`, and
   `healthTransitions` (`packages/api/src/alerts/evaluator.ts:48-58,72-93,144-183`) all filter
   prior logs by `deviceId` before condition. The repository reads `alert_log` and
   `edge_health_log` scoped to the active device. Unit fixture "isolates unresolved alerts and
   recoveries by device" proves another device's unresolved alert cannot suppress, link, or
   fabricate a recovery; integration test 2 proves it against Postgres with a second device's
   alert and recovery rows left byte-identical.
2. **Atomic delivery claim and append-only logs — resolved.**
   `apps/server/src/alert-repository.ts:198-232` serializes read → evaluate → append inside one
   transaction under `pg_advisory_xact_lock`, appending each notice as a durable `claimed` row
   before any notifier call; the final `delivered`/`failed` outcome is appended as a new row
   after transport. No `update`/`delete` exists on either log table. Integration test 3
   (delayed fake notifier, genuinely concurrent second evaluation) proves exactly one notifier
   call, exactly one claim, rows `["claimed","delivered"]`, and byte-identical
   `currentState`/`occupancyMinutes`/`edgeCurrentHealth`/`edgeDevices`/`settingsVersions`.
   A crash between claim and outcome leaves the durable claim, which suppresses duplicates
   until the re-alert interval; no path can deliver twice for one claim window.
3. **Stable failure start — resolved.** `failureStartedAt` derives `conditionStartedAt` from
   the first still-unresolved qualifying device transition; re-alerts inherit
   `previous.conditionStartedAt` (`evaluator.ts:246,257`). Unit fixture "keeps a failure start
   at its first unresolved qualifying transition" covers repeated projections with newer
   receipts, re-alert, recovery linkage, and a fresh interval after recovery; integration
   test 1 confirms the persisted re-alert keeps the original start after the projection
   receipt advances.

Original required fixtures remain present and passing: stale-threshold equality, closed-hour
suppression escalating exactly at the pre-open boundary (Friday schedule), past-midnight
session, re-alert interval edge, recovery emission, flapping append-only transitions, and
non-mutation of pre-existing tables around every evaluation. Alert semantics match `SPEC.md`
577–584; `edgeCurrentHealth` is consumed strictly read-only per the Phase 4 freeze
(`SPEC.md` 414–428) and ADR-003; times are injected with no ambient clock (ADR-004).

## Validation commands and results (2026-07-21, +03:00)

- `pnpm install --frozen-lockfile` — PASS (up to date).
- `FITWAY_RUN_ID=p8_alert_review_b02_retry`,
  `TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55432/fitway_integration_p8_alert_review_b02_retry`,
  `FITWAY_INTEGRATION_RESET_DATABASE=fitway_integration_p8_alert_review_b02_retry`,
  `pnpm verify:phase --phase phase8-alert-evaluator` — PASS at 20:05:44–20:06:00: repository
  invariants (29 milestones), Biome (173 files), workspace type checks, 116 unit tests
  (26 files), Python simulator (3 tests), Phase 8 disposable-Postgres integration suite
  (3 tests), and the repository mutation guard ("passed without repository mutation").
- `git status --short` empty before and after the run; tracked files unchanged.
- Browser/a11y/visual artifacts: `NOT_REQUIRED` (no UI or browser surface in this slice).

## Verdict

`PASS` — the retry candidate `cb63cc4d2190eb08b3f4021e180cff86484f0347` resolves all three
`FAILED_VALIDATION` findings, stays inside owned/leased scope, preserves immutable migration
history, and passes every applicable gate under fresh verifier-owned resources. The candidate
is `VERIFIED_READY_FOR_INTEGRATION`. Not `DONE`: coordinator integration must still run
`pnpm verify:full`, reconcile shared files, integrate, and release leases. Nothing was pushed;
no implementation file was modified by this verification.
