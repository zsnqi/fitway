# phase5-command-domain independent verification

- Status: `VERIFIED_READY_FOR_INTEGRATION`
- Verdict: `PASS` — no defect, regression, contract violation, or scope breach found; the
  candidate was not modified
- Verifier: fresh independent session (did not implement the candidate); run ID `p5_command_v04`
- Code candidate commit: `c52772b5289ddbc2292ac6b6fe7565a11a18bea4` on
  `work/phase5-command-domain-b03`; review performed at evidence-only handoff commit
  `8a7f85b0663514bf70486992486cfe222cbb695d`, whose only change beyond the candidate is the
  completion handoff document
- Base: BRG/batch base `94b76a8c58a499976b84dd1a0d177846442cf5cc` via activation commit
  `e5cb13bc200186601c031434c096acd167a5c7c5` (verified: activation parent = `94b76a8`, worker
  history sits directly on the activation commit)
- Worktree/branch clean at review start and end; lease `2026-07-23T22:11:26+03:00` valid at
  review time (2026-07-22)
- Verified: 2026-07-22T13:44:30+03:00
- Not marked `DONE`; not pushed; coordinator integration and `pnpm verify:full` remain pending

## Scope and ownership review

- `git diff e5cb13b..c52772b` touches exactly 28 files, every one inside the slice's
  `ownedPaths` or its three exclusive leases (migration-0005 lane, edge protocol spine, router
  lane A): `packages/api/src/commands/**` (new), `packages/api/src/audit/types.ts` (new),
  `packages/api/src/{context,edge-push,edge-push.test}.ts`, `packages/api/src/occupancy/engine*`,
  `packages/api/src/routers/index.ts`, `apps/server/src/{command-repository,audit-repository}.ts`
  (new), `apps/server/src/{occupancy-repositories,openapi,openapi.test,index}.ts`,
  `apps/server/src/phase5-command-domain.integration.test.ts` (new),
  `packages/db/src/schema/application.ts`, migration `0005` + snapshot + one journal append, and
  `edge/{simulator.py,test_simulator.py,fixtures/push.json}`.
- Forbidden paths untouched: auth/analytics/health/public packages, `apps/server/src/edge-push.ts`
  transport, `apps/web/**`, `packages/ui/**`, browser tests, env schemas, root manifests,
  lockfiles, `scripts/verify.mjs`, `PROJECT_STATE.yaml`, and all normative phase records. The
  handoff commit `8a7f85b` adds only
  `docs/phase-records/handoffs/phase5-command-domain/20260722-014429-p5_command_b03.md`.
- No staff UI, manual fallback, scheduled reset issuance, alerting, owner analytics transport,
  public payload change, or auth change is present. No secret, raw PIN, or token appears in code,
  fixtures, or tests (the integration device token/PIN are run-generated).

## Migration lane review

- Migrations `0000`–`0004` and snapshots `0000`–`0004` are byte-unchanged; `_journal.json`
  gained exactly one appended `idx 5` entry (`0005_phase5_command_domain`); snapshot `0005`
  chains correctly (`prevId` `32882b3d…` = snapshot `0004` id). No competing migration exists.
- Migration `0005` is purely additive: enums `edge_command_type (set_count|reset_zero)`,
  `edge_command_status (pending|applied|superseded)`, `audit_action
  (correction_delta|correction_absolute|reset)`; tables `edge_commands` and `audit_log` with
  identity PKs constrained JSON-safe (`> 0 and <= 9007199254740991`), FKs to `edge_devices` and
  `auth_principals`, and self-FK `superseded_by_command_id`.
- Database-level invariants match the frozen contract: target coherence (`set_count` requires a
  non-negative target, `reset_zero` requires null), lifecycle coherence (`pending` has no
  applied/superseded fields; `applied` requires `delivered_at` and `applied_at`; `superseded`
  requires `superseded_at` + `superseded_by_command_id` and no `applied_at`), delivery as
  nullable metadata (not a fourth state), actor kind/role coherence
  (`shared_staff`↔`staff`, `owner`↔`owner`), non-negative values, action/value coherence per
  audit action, trimmed 1–240-char nullable reasons, and one audit row per command
  (`audit_log_command_unique`). The Drizzle schema in `application.ts` mirrors the SQL exactly.

## Contract review findings (phase-05 freeze, SPEC.md §§459–600, ADR-002, ADR-003)

1. **Authorization and principal boundary** — `staff.issueCorrection` and `staff.issueReset`
   mount on the integrated `staffProcedure` (`requireStaffOrOwner`), re-checked on every call;
   missing/expired auth → `401`; the canonical auth context is passed through as the audit actor
   so the shared desk stays the `shared_staff` principal with no synthetic identity. Router
   visibility is never authorization; validation and role checks live on the procedure leaves.
2. **Issuance semantics** — `createCommandService.issueCorrection` parses the strict
   delta-xor-absolute union, locks current state (`current_state … for update` plus device-row
   lock with an active-device consistency re-check), rejects a delta without a usable current
   count (`current_count_unavailable`), floors the resolved delta at zero, bounds the effective
   target to non-negative Postgres integers, and persists deltas/absolutes as `set_count` and
   resets as `reset_zero` with null target. Reasons are trimmed, optional, stored null when
   absent — never invented.
3. **Atomicity and audit** — insert command, supersede older pendings, and append the immutable
   audit row (actor principal ID/kind/role, command ID, action, prior/requested/effective values,
   nullable reason, server timestamp) all run in one `db.transaction`. The integration test
   forces an audit failure and proves command + supersession + audit roll back together; a failed
   transaction leaves neither row.
4. **Supersession / latest-only** — issuing any newer command atomically supersedes every older
   pending command for the device (`status='pending' and id < newer id`), so `set_count` and
   `reset_zero` conflict as count-authority commands and at most one effective pending command
   exists. Delivery lists pendings oldest-first; the response schema enforces `maxItems: 1` and
   ascending unique IDs.
5. **Ack and edge authority** — the shared command queue owns deliver/ack policy; the occupancy
   engine invokes `commandQueue.reconcile` only after a contiguous live push has been fully
   accepted and processed, inside the same transaction. An acknowledgement applies only a
   command that is `pending` **and** previously delivered; applied (repeat ack), superseded,
   future, unknown, and undelivered IDs are provable no-ops. `delivered_at` is set once via
   `coalesce`, keeping first-delivery metadata stable. Replay and sequence-gap paths return
   before any mutation; the strict request schema (`.strict()`) rejects backfill-shaped bodies
   with `422` and the test proves byte-identical command/audit/current/health state afterwards.
   Cloud current state advances only from the edge's own reported count — command issuance and
   acknowledgement never write `current_state` (proved: count stays 10 across issuance, reaches
   0 only via the edge's own post-reset push).
6. **Monotonic JSON-safe IDs** — identity columns plus check constraints plus repository
   assertions keep command and audit IDs positive safe integers; the integration test observes
   strictly increasing IDs across delta → absolute → reset.
7. **Edge protocol parity** — the schema-version-1 push contract is extended in lockstep:
   Zod (`edge-push.ts` + `commands/schemas.ts`), the published OpenAPI request/response schemas
   (canonical millisecond UTC pattern with seconds `[0-5][0-9]`, sorted/unique minute extension
   `x-fitway-sorted-unique-minute-starts`, latest-only command `oneOf` with per-type target
   coherence, accepted↔`processed` coherence, rejected pushes forced to empty `commands`),
   the JSON fixture (`appliedCommandId: 7`), and the Python simulator (strict acknowledgement
   validation, persistent idempotent command application, highest-applied reporting) change
   together. `openapi.test.ts` compiles both published schemas with AJV (strict) and asserts
   AJV/Zod agreement case-by-case, including non-canonical timestamps, leap-second syntax
   (guarded against invalid-date throw in `canonicalUtcTimestampSchema`), unsorted/duplicate
   minutes, multi-command arrays, and incoherent `reset_zero` targets. No schema v2 was created;
   the public v2 payload and its privacy boundary are untouched, and the device-facing command
   DTO carries only `id/type/targetValue/issuedAt` — no capacity, identity, reason, or history.
8. **Router lane A** — `context.ts` adds an optional injected `commandService`; the server
   index wires the transactional Postgres service; the OpenAPI contract leaf for `/edge/push`
   remains a non-executing documentation leaf owned by the Hono transport. No other router
   surface changed.

Observation (not a defect): pending commands issued against a device that later stops being the
active target would remain `pending` undelivered rather than superseded; with the single-device
gym contract and Phase 5's single-target issuance lock this state is unreachable through the
shipped surfaces, and later phases own device lifecycle.

## Fresh verification run (run-owned resources)

Environment: `FITWAY_RUN_ID=p5_command_v04`,
`TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55432/fitway_integration_p5_command_v04`,
`FITWAY_INTEGRATION_RESET_DATABASE=fitway_integration_p5_command_v04` (freshly created disposable
database on the guarded container, distinct from the worker's `…_b03` and prior verifiers'
`…_v01`–`…_v03`), run-owned Playwright port/dirs (unused; browser gates `NOT_REQUIRED`).

- `pnpm verify:phase --phase phase5-command-domain` → **PASS** (exit 0) on 2026-07-22
  - Repository invariants: PASS (31 milestones, 8 canonical approval screenshots)
  - Biome check: PASS (196 files)
  - Type checks: PASS (all workspaces, including `apps/web` vite build + tsc)
  - Unit tests: PASS — 32 files, 131 tests
  - Python simulator tests: PASS — 5 tests
  - Phase 5 command-domain integration tests: PASS — 1 file, 4 tests on the fresh disposable
    Postgres over real HTTP with real staff PIN and owner sessions
  - Repository mutation guard: PASS (`git status --short` clean before and after)

Integration evidence independently re-observed: `401` unauthenticated issuance; `400` for
negative absolute, fractional delta, ambiguous delta+absolute, and whitespace-only reason; `422`
backfill-shaped push with full command/audit/current/health immutability; zero-floored delta and
monotonic supersession with exact `shared_staff`/`owner` audit provenance; latest-only delivery;
no lifecycle advance on delivery, replay, gap, future ack, or superseded ack; applied lifecycle
only on the eligible accepted acknowledgement; repeated acknowledgement leaving the applied row
byte-identical; cloud current state never overwritten by an online command; and full transaction
rollback on forced audit failure.

## Gate summary

| Gate | Result |
| --- | --- |
| Functional/unit | PASS |
| Biome/types | PASS |
| Disposable-Postgres integration | PASS |
| Python simulator/parity | PASS |
| Repository non-mutation | PASS |
| Browser / accessibility / visual | NOT_REQUIRED (no UI in slice) |
| Independent review | PASS (this record) |

## Next step

Coordinator integration per `docs/WORKFLOW.md`: inspect candidate history, reconcile shared
files, run `pnpm verify:full`, record the integrated commit, release the migration-0005 / edge
protocol / router lane A leases, and declare `DONE`. This verifier does not update
`PROJECT_STATE.yaml`, does not mark the slice `DONE`, and does not push.
