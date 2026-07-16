# phase4-health independent verification

- Status: `VERIFIED_READY_FOR_INTEGRATION`
- Verdict: `PASS` — no defect or contract violation found; candidate not modified
- Verifier: fresh independent session (did not implement the candidate); run ID `p4_health_v01`
- Candidate commit: `97c7d41d0de07513ac870893451da7ab1f832c56` (tip of `work/phase4-health-b01`,
  contains implementation commit `e441d9f5f7e907f67a45488e1a974ced7e5daa14`)
- Base: BRG `ac59e7e53a65235efedb5875035fe0f36ff60492` via activation commit
  `43211088e4b33639117d1c64a264bef8fb1b0001` (verified `HEAD^^` = activation, activation parent = BRG)
- Worktree/branch clean at review start; lease `2026-07-18T16:49:00+03:00` valid at review time
- Verified: 2026-07-16T23:01:35+03:00
- Not marked `DONE`; not pushed; coordinator integration and `pnpm verify:full` remain pending

## Scope and ownership review

- `git diff 4321108..97c7d41` touches only the owned paths and the exact shared leases in the
  launch handoff and `PROJECT_STATE.yaml`: `packages/api/src/health/**` (new),
  `apps/server/src/health-repository.ts` (new), `apps/server/src/phase4-health.integration.test.ts`
  (new), the leased schema/migration/engine/repository/context/router/server-index files, and the
  two handoff documents. No other file changed.
- Forbidden paths untouched: auth packages/routes/schema, `packages/api/src/edge-push.ts`,
  `apps/server/src/edge-push.ts`, OpenAPI, public/analytics code, `packages/env/**`, web/UI,
  `edge/**`, browser tests, root manifests/lockfiles, shared test setup, normative docs,
  `PROJECT_STATE.yaml`. No dependency/lockfile/catalog change. No secret in code, fixtures, or logs.
- Migrations `0000`–`0002` and their meta snapshots are byte-unchanged. `_journal.json` gained
  exactly one appended `0003` entry. `meta/0003_snapshot.json` chains correctly
  (`prevId` = 0002 snapshot id). No second competing migration number exists.

## Contract review findings (SPEC.md 414–457, ADR-002, ADR-003, FITWAY_PRODUCT.md)

1. **Projection shape** — `edge_current_health` has exactly the nine frozen columns keyed by
   `device_id` (PK → `edge_devices.id`); statuses use the new `edge_health_status` enum
   (`ok|degraded|failed|unknown`); `detector_fps` is nullable `double precision` with a
   `null or (>= 0 and < 'infinity')` check, which under Postgres NaN ordering also rejects
   NaN and ±infinity, so `null` means unknown, never zero. Migration `0003` seeds no rows.
2. **Transaction boundary** — `processLivePush` calls `upsertCurrentHealth` only after replay/gap
   early returns, minute validation, minute upserts, current-state update, and device advancement,
   all inside one `db.transaction`. Disabled device and missing settings throw before any write;
   an engine error rolls the whole transaction back. Backfill has no write path to the projection.
3. **Evaluator semantics** — `current` iff trusted `receivedAt` age is strictly below
   `operationalStaleAfterSeconds` (equality and beyond → `stale`); condition precedence
   failed → degraded → unknown → healthy over the three flags; stale never erases last-known
   flags; `unavailable` (no projection / no usable active device / disabled device) nulls every
   raw field and time except an independently known `lastSeenAt`. Repository read failures
   propagate as errors and are never converted into `unavailable`.
4. **Snapshot DTO** — `operationalSnapshotSchema` is a strict Zod object with exactly
   `schemaVersion` (literal 1), `computedAt`, `occupancy` (shared public payload schema reused via
   the shared builder — no recomputation), authorized `capacity`, `source`, and the strict
   ten-field `health` block. No speculative Phase 5 command fields.
5. **Auth boundary** — `staff.operationalSnapshot` mounts on the pre-existing integrated
   `staffProcedure` (staff|owner); missing/expired auth → `401` via `requireStaffOrOwner`, and the
   guard family's `403` valid-wrong-role path (`requireOwner`) is unchanged, per ADR-002. Auth
   code was consumed read-only.
6. **Public privacy** — public payload schema v2 is strict and byte-unchanged; it cannot carry
   capacity, percentage, health, device identity, or history. The integration test additionally
   asserts the live public payload has none of those keys.
7. **Ownership of derivation** — the evaluator owns freshness/condition; `health-repository.ts`
   only reads (occupancy inputs via the shared public repository plus active device + projection);
   no consumer recomputes freshness or condition. Phase 8 transition/alert surfaces are not
   defined or touched.
8. **Context reconciliation** — `readOperationalSnapshot` is required on `createContext` options
   (server must wire it) and optional on the shared `Context` type so read-only auth tests still
   type-check; the leaf guards defensively with `INTERNAL_SERVER_ERROR`. Judged a minimal,
   contract-consistent reconciliation, matching the candidate handoff's stated decision.

Observation (not a defect): the integration test drives pushes through `processLivePush` with the
real database transaction adapter rather than over the HTTP `/api/edge/push` transport. The
transport→engine wiring (including wire-schema health validation) is pre-existing and covered by
`phase2.integration.test.ts` over real HTTP with bearer tokens; the edge transport file is
forbidden to this slice and unchanged. The phase-owned HTTP surface, `staff.operationalSnapshot`,
is exercised over real HTTP with real sessions.

## Fresh verification run (run-owned resources)

Environment: `FITWAY_RUN_ID=p4_health_v01`,
`TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55432/fitway_integration_p4_health_v01`,
`FITWAY_INTEGRATION_RESET_DATABASE=fitway_integration_p4_health_v01` (freshly created disposable
database on the guarded container; distinct from every prior run's database).

- `pnpm verify:phase --phase phase4-health` → **PASS** (exit 0)
  - Repository invariants: PASS (29 milestones, 8 canonical approval screenshots)
  - Biome check: PASS (166 files)
  - Type checks: PASS (all packages, including `apps/web` vite build + tsc)
  - Unit tests: PASS — 25 files, 109 tests
  - Python simulator tests: PASS — 3 tests
  - Phase 4 operational health integration tests: PASS — 1 file, 7 tests
    (fresh disposable Postgres, real HTTP server, real staff PIN + owner sessions)
  - Repository mutation guard: PASS (`git status --short` unchanged; tree clean before and after)

Integration evidence independently re-observed: no seed rows and `unavailable` before the first
push; accepted push → exact projection row → `current`/`healthy` snapshot over HTTP for staff and
owner (`200`); byte-for-byte projection immutability across replay, sequence gap, validation
failure, disabled device, and transaction rollback; `stale` at/beyond the threshold preserving
degraded flags with correct `staleAt`; `unavailable` for a disabled active device with
`lastSeenAt` retained; missing auth `401`, expired sessions `401`; public payload free of
capacity/health/device identity.

## Gate summary

| Gate | Result |
| --- | --- |
| Functional/unit | PASS |
| Biome/types | PASS |
| Disposable-Postgres integration | PASS |
| Repository non-mutation | PASS |
| Browser / accessibility / visual | NOT_REQUIRED (no UI in slice) |
| Independent review | PASS (this record) |

## Next step

Coordinator integration per `docs/WORKFLOW.md`: inspect candidate history, reconcile shared
files, run `pnpm verify:full`, record the integrated commit, release leases, and declare `DONE`.
