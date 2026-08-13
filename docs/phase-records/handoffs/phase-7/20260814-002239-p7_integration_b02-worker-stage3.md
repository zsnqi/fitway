# Phase 7 scheduled-reset integration b02 worker Stage 3 handoff

## Completed

- `apps/server/src/cron.ts`, `apps/server/src/index.ts`, `packages/env/src/server.ts`, and
  `vercel.json` add the bearer-only internal GET cron seam, production runner composition,
  privacy-safe diagnostics, validated secret, logger exclusion, and exactly one minutely
  `/api/cron` schedule without changing the existing services or rewrites.
- `apps/server/src/cron.test.ts` proves raw Node duplicate-header handling and the actual production
  `createApp()` method topology: GET `401`/`200`/`500`, authenticated HEAD `405` with an empty body,
  unregistered POST/PUT/PATCH/DELETE `404`, and global CORS OPTIONS `204`.
- `apps/server/src/phase7-integration.integration.test.ts` creates and authenticates valid active
  sessions under the exported `fitway_staff_session` and `fitway_owner_session` cookie names, proves
  cookie-only production cron requests leave command/audit/issuance/current rows byte-equivalent,
  and proves fixed 18:29/18:30/18:31 offline reconciliation.

## Exact current state

- Parent / implementation boundary / review-record correction:
  `b707f63d474183b03d68c96321e51f3e2b84ec5c` /
  `41ac3ca1e491bc77e6a6471c6c3e2a19e4b510cd` / `SELF`. Revert this documentation-only correction
  to return to `41ac3ca`, then revert `41ac3ca` to return exactly to `b707f63`.
- Branch / worktree / run ID: `work/phase7-integration-b02-stage3` /
  `C:/Users/Pc Force/.codex/visualizations/2026/08/13/019ffce0-b522-7880-a6a7-3a5cf4c90ff5/phase7-integration-b02-stage3`
  / `p7_integration_b02_s3`; exact disposable database
  `fitway_integration_p7_integration_b02_s3` at `127.0.0.1:55432`.
- Status: Stage 3 implementation and self-verification are complete. `SELF` is for independent
  Stage 3 review only; this is not a formal candidate and does not claim `READY_FOR_INTEGRATION`
  or `DONE`. Nothing was deployed or externally provisioned.
- Scope: exactly the six permitted Stage 3 source/config/test paths and this handoff changed.
  Accepted Stage 1/2 paths, b01, auth behavior/schema, edge/OpenAPI contracts, product surfaces,
  schema/migrations, coordinator state, root configuration, and UI remain untouched.
- Owned paths / shared leases used: worker-owned paths used were `apps/server/src/cron.ts`,
  `apps/server/src/cron.test.ts`, `apps/server/src/phase7-integration.integration.test.ts`, and this
  handoff. Shared paths actually used were `apps/server/src/index.ts`,
  `packages/env/src/server.ts`, and `vercel.json` under the exclusive b02 lease through
  `2026-08-20T20:58:59+03:00`. The other lease-authorized paths
  `packages/api/src/commands/service.ts`, `packages/api/src/commands/service.test.ts`,
  `packages/api/src/audit/types.ts`, `apps/server/src/audit-repository.ts`, and
  `apps/server/src/command-repository.ts` were untouched.

## Decisions

- The human-approved b02 plan fixes real Hono production topology: only GET is registered; HEAD
  reaches the GET fallback and is rejected by the literal guard; the other methods stay actual
  production 404/204 behavior. This rules out an artificial `app.all` route and false 405/no-store
  claims.
- The Product/Spec and ADR-008 keep cron authority outside staff/owner sessions and oRPC. Valid
  sessions are exercised only as non-substituting credentials; no command product surface or auth
  authority was added.
- The accepted Phase 6 contract remains unchanged: pending reset delivery blocks reconnecting live
  authority until same-sequence acknowledgement applies the command, after which replay is inert.

## Remaining

1. Run a fresh independent read-only Stage 3 review at `SELF`; do not edit the candidate.
2. Only after Stage 3 review `PASS`, run the separately gated formal complete-candidate ladder and
   detached `_v02` verification. Coordinator integration and aggregate Phase 7 closeout remain
   later gates.

## Blockers

- None. The direct frozen Vitest binary requires an unsandboxed Windows process because sandboxed
  Vite config loading fails with `spawn EPERM`; all recorded suites ran through that approved path.
  The first marked integration launch found the exact disposable database absent; the database was
  then created explicitly and only that exact database was used. Neither event was a source failure
  or formal b02 candidate repair.

## Verification

- Fresh red: `apps/server/src/cron.test.ts` failed `1` file with `0` tests because `./cron` did not
  exist. The preceding sandbox-only launch stopped at Vite config loading with `spawn EPERM` and
  made no source change. Formal b02 repair remains `0/2`.
- Final focused command/reset/cron/repository units passed `7` files / `62` tests. The cron file
  itself passed `14` tests over raw Node and production `createApp()` transport.
- Final exact marked Phase 5/6/evaluator/Phase 7 PostgreSQL matrix passed `4` files / `25` tests
  with matching `FITWAY_RUN_ID`, `TEST_DATABASE_URL`, and
  `FITWAY_INTEGRATION_RESET_DATABASE` for `p7_integration_b02_s3` /
  `fitway_integration_p7_integration_b02_s3`.
- Production composition evidence verified real active staff and owner sessions, both exported
  cookie names, identical command/audit/issuance/current database rows before and after cookie-only
  GETs, and zero runner calls. Raw transport verified invalid/duplicate/query/body/cookie GET 401,
  canonical GET 200 once, named-error-only 500, empty-body HEAD 405, four unregistered 404 methods,
  and CORS OPTIONS 204 with `GET,POST,OPTIONS`.
- Offline evidence verified one pending system command/audit/issuance triple after concurrent and
  repeated 18:30 cron calls without current mutation; 18:31 schema-v2 reconnect returned
  `commands_pending` without sequence/current advance; same-sequence zero acknowledgement applied
  it; replay/repeat created nothing; settings history and issuance stayed frozen.
- Scoped Biome passed `6` files; all eight workspace type projects passed. `pnpm verify:fast`
  passed `35` repository invariants, Biome over `238` files, all workspace types, `43` TypeScript
  files / `230` tests, `18` Python tests, and the repository mutation guard.
- `git diff --check` passed before this handoff. Final staged/unstaged/name-status/status checks are
  run after adding the handoff and before/after the boundary commit.
- Not verified: independent Stage 3 review; formal candidate `verify:phase` or `verify:full`;
  deployment, production secret placement, Vercel plan entitlement/cadence, or real-gym behavior.
  Browser, visual, and accessibility checks are not required for this backend stage.

## Recommended next session

Mode: independent review.

Exact resume command:
`Set-Location 'C:/Users/Pc Force/.codex/visualizations/2026/08/13/019ffce0-b522-7880-a6a7-3a5cf4c90ff5/phase7-integration-b02-stage3'; git status --short; git rev-parse HEAD; git diff --name-status b707f63d474183b03d68c96321e51f3e2b84ec5c..HEAD`.

Review only the Stage 3 b02 diff from `b707f63d474183b03d68c96321e51f3e2b84ec5c` through `SELF`.
Make no edits. Confirm exact production GET/HEAD/unregistered-method/OPTIONS behavior, canonical
single bearer handling, generic logger exclusion, privacy-safe diagnostics, exported real-session
cookie evidence with database before/after equality, one minutely Vercel schedule with exact
services/rewrites, and fixed offline reconciliation. Rerun focused units, the exact marked
`_b02_s3` PostgreSQL matrix, scoped Biome, all types, `verify:fast`, and scope/tree/diff checks.
Report locatable findings and `PASS` or `FAILED_VALIDATION`; stop on any Stage 1/2 or b01 mutation,
auth/edge/product widening, fake cookie or artificial routing evidence, authority conflict,
lease/resource mismatch, secret exposure, or database-marker mismatch.
