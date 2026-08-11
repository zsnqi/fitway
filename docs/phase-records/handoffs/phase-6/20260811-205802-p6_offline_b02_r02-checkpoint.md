# Phase 6 offline/backfill b02-r02 checkpoint

- Status: `IN_PROGRESS`; bounded source and negative regressions are implemented, but the required phase gate cannot start because coordinator-owned `scripts/verify.mjs` has no Phase 6 profile. This checkpoint is not `READY_FOR_INTEGRATION` or `DONE`.
- Base / candidate: initial worker HEAD `b9290abf230d3fbd10d2bd6379aeaf0918883932`; candidate commit `SELF` (the commit containing this handoff).
- Branch / worktree / run ID: `work/phase6-offline-b02-r02` / `D:/Projects/fitway-worktrees/phase6-offline-b02-r02` / `p6_offline_b02_r02`.
- Current state: all source, tests, and this handoff are committed in `SELF`; no deployment or push occurred. Final `git status --short --branch` is clean as recorded after the commit.
- Owned paths used: `docs/phase-records/handoffs/phase-6/**`.
- Exclusive leased paths used: `edge/simulator.py`, `edge/test_simulator.py`, `apps/server/src/openapi.ts`, and `apps/server/src/openapi.test.ts`. The lease was checked before every shared-file edit and remains valid through `2026-08-18T20:41:09+03:00`.

## Completed

- `edge/simulator.py`: Boolean acknowledgement schema versions are rejected while numeric JSON versions `1` and `2` remain valid. Acknowledgements are correlated with the durable in-flight request schema version before any response branch or state mutation. `commands_pending` is accepted only for schema-v2 live requests.
- `edge/test_simulator.py`: added negative coverage for Boolean schema versions, schema-v1 acknowledgement attempts against schema-v2 live and backfill requests, `commands_pending` against backfill, and whitespace-only timezone. Mismatch tests compare serialized bytes for `sequence`, `count`, `appliedCommandId`, `outbox`, `lastRequest`, and `inFlightRequest` before and after rejection.
- `apps/server/src/openapi.ts`: schema-v2 response timezone now requires at least one non-whitespace character through `pattern: "\\S"`, matching Zod and Python acceptance.
- `apps/server/src/openapi.test.ts`: AJV/OpenAPI and Zod both prove Boolean request/response schema versions invalid; the shared valid schema-v2 fixture proves whitespace-only timezone invalid in both validators.
- Existing valid v1/v2, replay, live `commands_pending`, restart, batch, focused TypeScript/OpenAPI, Python, and Postgres integration behavior remains green.

## Test-first evidence

- `py -3 -m unittest discover -s edge -p test_simulator.py -k schema_version_rejects_boolean`: red, 1 test failed because `schemaVersion: True` was accepted; green after the strict Python integer/non-Boolean guard.
- `py -3 -m unittest discover -s edge -p test_simulator.py -k v1_processed_acknowledgement`: red, both live and backfill subtests failed because no error was raised; green after pre-mutation durable schema-version correlation.
- `py -3 -m unittest discover -s edge -p test_simulator.py -k commands_pending_cannot_settle`: red, 1 test failed because backfill `commands_pending` was accepted; green after the schema-v2 live-only guard. The full `commands_pending` focus then passed 3 tests, including live correction/retry.
- `pnpm exec vitest run apps/server/src/openapi.test.ts`: corrected schema-v2 parity probe red, 1 file / 1 test failed because Zod rejected whitespace-only timezone while AJV/OpenAPI accepted it; green after the non-whitespace OpenAPI constraint. The same test proves AJV/Zod Boolean-version parity.

## Decisions

- No new product, security, privacy, schema, or UI decision was made. The activation plan and ADR-008 remain binding: no staff/owner command surface or manual fallback is introduced, no manual enum/API compatibility value is removed, and frozen settings remain unchanged.
- Validation repair count is `1/2`: the first `verify:fast` run found only Biome import order and two formatter wraps in the new OpenAPI test; the exact mechanical fixes were applied and the rerun passed. The transient sandbox bytecode denial and missing disposable database were environment setup failures, not source repairs.

## Verification

- Preflight: exact branch/worktree/initial HEAD and clean status confirmed; lease valid; escalated `pnpm exec vitest --version` returned `vitest/4.1.10 win32-x64 node-v24.14.0`. The sandbox did not preserve pnpm's injected `.bin` path; a frozen reinstall changed no tracked files.
- `pnpm exec vitest run packages/api/src/offline packages/api/src/edge-push.test.ts packages/api/src/occupancy/engine.test.ts apps/server/src/openapi.test.ts`: passed, 4 files / 17 tests.
- `py -3 -m unittest discover -s edge -p test_*.py`: passed, 15 tests.
- `py -3 -m py_compile edge/simulator.py edge/test_simulator.py`: sandbox run was denied transient bytecode-cache write access; the exact command passed outside the sandbox.
- Guarded Phase 6 integration: first attempt failed before assertions with PostgreSQL `3D000` because the exact disposable database did not exist (1 file failed / 5 skipped). Only `fitway_integration_p6_offline_b02_r02` was created in the local FITWAY Postgres container; the exact command then passed, 1 file / 5 tests.
- First `pnpm verify:fast`: repository invariants passed, then Biome reported 2 mechanical issues. After focused repair 1/2, the OpenAPI focus passed 1 file / 1 test and `pnpm verify:fast` passed: repository invariants, Biome across 225 files, all workspace type checks, 38 unit files / 167 tests, 15 Python tests, and repository mutation guard.
- Required `FITWAY_PHASE=6 pnpm verify:phase`: failed before tests. The verifier's allowed-profile list omits `6`, and read-only inspection confirms `scripts/verify.mjs` has no Phase 6 entry. That coordinator-owned forbidden file was not edited and no unrelated phase was substituted.
- `git diff --check`: passed before this handoff and again immediately before commit.
- Not verified: a green Phase 6 profile gate and fresh independent verification. Browser, accessibility, and visual checks remain not required for this non-UI slice.

## Blocker and remaining work

- Blocked on coordinator-owned verification configuration: register a numeric `6` profile in `scripts/verify.mjs` with no browser files and `apps/server/src/phase6-offline.integration.test.ts` as its integration file, consistent with the mandated `FITWAY_PHASE=6` command. The current writer has no lease for that file.
- After the profile exists on the candidate ancestry, rerun the exact guarded `FITWAY_PHASE=6 pnpm verify:phase` command under `p6_offline_b02_r02`, confirm `git diff --check` and clean status, then commission the fresh `p6_offline_b02_v02` independent verifier. Do not integrate before independent PASS.

## Recommended next session

- Mode: `execute`, coordinator-owned verification-profile continuation.
- Objective: add only the missing Phase 6 verifier profile, place it on the candidate ancestry without altering this source slice, and rerun the blocked worker gate.
- Scope: coordinator-owned `scripts/verify.mjs` plus the minimum coordinator state/handoff updates; Phase 6 source files remain frozen.
- Constraints: preserve the numeric `FITWAY_PHASE=6` contract, use only the named disposable worker database, do not mark Phase 6 ready/done before the worker gate and fresh independent verification pass, and do not reopen Product/Spec/ADR decisions.
- Verification/report: rerun the blocked phase gate, mutation guard, `git diff --check`, and clean status; report exact results and then issue the read-only independent verifier brief if green.

## Exact resume

```powershell
Set-Location 'D:/Projects/fitway-worktrees/phase6-offline-b02-r02'
git status --short --branch
git rev-parse HEAD
$env:FITWAY_RUN_ID='p6_offline_b02_r02'
$env:TEST_DATABASE_URL='<restore the run-owned URL from secure coordinator context>'
$env:FITWAY_INTEGRATION_RESET_DATABASE='fitway_integration_p6_offline_b02_r02'
$env:FITWAY_PHASE='6'
pnpm verify:phase
```
