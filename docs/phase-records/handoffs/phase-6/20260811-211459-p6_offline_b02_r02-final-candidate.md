# Phase 6 offline/backfill b02-r02 final candidate

- Status: `IN_PROGRESS`; final writer candidate is green and awaits fresh independent verification. This is not an integration or `DONE` claim.
- Initial worker HEAD / first checkpoint / coordinator continuation / candidate: `b9290abf230d3fbd10d2bd6379aeaf0918883932` / `851b339bb0d51aad3e94f73beb3467f87fb9eb66` / `9cd4234b3fffeaf17792e4624639049a4e665e74` / `SELF`.
- Branch / worktree / run ID: `work/phase6-offline-b02-r02` / `D:/Projects/fitway-worktrees/phase6-offline-b02-r02` / `p6_offline_b02_r02`.
- Current state: all authorized repair files and this handoff are committed in `SELF`; final `git status --short --branch` is clean. No push, deployment, integration, or external provisioning occurred in this repair.
- Repair count: `2/2`; no further writer repair is available if the same gate or fresh independent review fails.
- Repair scope used: `edge/simulator.py`, `edge/test_simulator.py`, and this Phase 6 handoff. The lease was checked before shared-file edits and remains valid through `2026-08-18T20:41:09+03:00`. `scripts/verify.mjs`, `PROJECT_STATE.yaml`, and all other paths were not edited by the writer.

## Completed

- `accept_acknowledgement` now requires a valid persisted `state.inFlightRequest`; it never settles caller-supplied transient payload when durable state is missing or invalid.
- Every valid acknowledgement received by `run`, including `sequence_gap`, is correlated with the durable request schema version before printing a request-dependent outcome, branching, replacing recovery state, applying commands, or settling state. Settlement and recovery use the correlated durable request.
- `--action replay` persists the selected `lastRequest` as `inFlightRequest` before network send, so interruption and restart replay the identical request bytes.
- Existing direct settlement tests now establish the same durable in-flight precondition as production.

## Test-first evidence

- Missing durable request: `py -3 -m unittest discover -s edge -p test_simulator.py -k requires_a_durable_in_flight_request` was red, 1 test failed because no `ValueError` was raised. It is green after removing caller-payload fallback. The regression compares serialized `sequence`, `count`, `appliedCommandId`, `outbox`, `lastRequest`, and `inFlightRequest` before and after rejection.
- Schema-v1 `sequence_gap` against durable schema-v2: `py -3 -m unittest discover -s edge -p test_simulator.py -k v1_sequence_gap_cannot_replace` was red because the client sent twice and replaced recovery state (`call_count` 2 instead of 1). It is green after pre-branch correlation and preserves the same six serialized fields byte-for-byte.
- Replay durability: `py -3 -m unittest discover -s edge -p test_simulator.py -k replay_persists_last_request` was red because persisted `inFlightRequest` was `null` at send time. It is green after pre-send persistence; the test simulates interruption, reloads state, restarts with the identical serialized request, and settles it.
- After updating legacy direct tests to persist their requests, the full Python suite passed 18 tests.

## Decisions

- No product, security, privacy, schema, settings, command-surface, or UI decision was made. Product/Spec/ADR-008 and the recovery activation remain unchanged.
- The coordinator-owned profile continuation at `9cd4234` is retained in ancestry and was not modified by this writer. It selects only the guarded Phase 6 integration file and no browser suite.

## Verification

- Resume preflight: exact clean HEAD `9cd4234b3fffeaf17792e4624639049a4e665e74`, branch/worktree, valid lease, and `vitest/4.1.10 win32-x64 node-v24.14.0` confirmed.
- `pnpm exec vitest run packages/api/src/offline packages/api/src/edge-push.test.ts packages/api/src/occupancy/engine.test.ts apps/server/src/openapi.test.ts`: passed, 4 files / 17 tests.
- `py -3 -m unittest discover -s edge -p test_*.py`: passed, 18 tests.
- `py -3 -m py_compile edge/simulator.py edge/test_simulator.py`: passed.
- Guarded Phase 6 integration under run `p6_offline_b02_r02` and its exact run-owned database/marker: passed, 1 file / 5 tests.
- `pnpm verify:fast`: passed repository invariants, Biome across 225 files, all workspace type checks, 38 unit files / 167 tests, 18 Python tests, and repository mutation guard.
- Exact `FITWAY_PHASE=6 pnpm verify:phase` under the same run-owned database: selected `Phase 6 offline fallback, backfill, and reconciliation` and passed repository invariants, Biome, all workspace type checks, 38 unit files / 167 tests, 18 Python tests, 1 integration file / 5 tests, and repository mutation guard.
- `git diff --check`: passed before this handoff and again immediately before commit.
- Not run: `pnpm verify:full`, which the coordinator runs after integration. Browser, accessibility, and visual checks are not required for this non-UI phase.

## Blockers and remaining work

- Blockers: none in the writer candidate.
- Remaining: a fresh read-only verifier must inspect the complete candidate diff and repeat the full ladder under `p6_offline_b02_v02` with its distinct exact disposable database. Only verifier PASS permits coordinator integration and subsequent `verify:full`.

## Recommended next session

- Mode: `verify`, fresh independent Phase 6 verifier.
- Objective: review candidate `SELF` against Product/Spec/ADR-008 and the two recovery records, rerun the former-failure probes plus the full worker ladder under `p6_offline_b02_v02`, and return PASS or `FAILED_VALIDATION` without editing.
- Scope: read-only complete diff from `b9290abf230d3fbd10d2bd6379aeaf0918883932` through candidate `SELF`, with particular attention to durable acknowledgement correlation, all response branches, replay persistence/restart, backfill state protection, OpenAPI/Zod/Python parity, and the numeric Phase 6 profile.
- Constraints: no repair, integration, push, deployment, state update, or substitution of another phase profile; use only the independent exact database and reset marker from the activation plan.
- Verification/report: exact commands, counts, former-failure probe results, scope findings, clean mutation/status proof, and final PASS or `FAILED_VALIDATION`.

## Exact verifier start

```powershell
Set-Location 'D:/Projects/fitway-worktrees/phase6-offline-b02-r02'
git status --short --branch
git rev-parse HEAD
pnpm exec vitest --version
# Restore the independent run-owned database URL from secure coordinator context.
$env:FITWAY_RUN_ID='p6_offline_b02_v02'
$env:FITWAY_INTEGRATION_RESET_DATABASE='fitway_integration_p6_offline_b02_v02'
$env:FITWAY_PHASE='6'
pnpm verify:phase
```

Stage 1 durable request / replay repair: direct writer, gate pass. Sequential writing stages: 1. Concurrent writers: 0.
