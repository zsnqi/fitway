# Handoff — Phase 6 offline/backfill — 2026-08-09

## Completed

- Built an uncommitted Phase 6 candidate covering schema-v2 live/backfill requests,
  history-only backfill authority, command-before-live reconciliation, a bounded Python
  outbox, shared fixtures, OpenAPI parity, and authenticated disposable-Postgres acceptance.
- Completed the ADR-008 decision-6 repository review: no valid internal production producer of
  `source=manual` remains. Retained enums, DTO values, analytics types, labels, and fixtures are
  consumers only; no enum, settings, migration, normative document, or UI was changed.
- Restored `apps/server/src/openapi.test.ts` to its activation contents after the worker boundary
  audit; the final candidate changes only owned or explicitly leased paths.
- Independent verification executed the required suites but rejected the candidate. Per
  `docs/WORKFLOW.md` lines 34–35 and 180–190, the worker outcome is `FAILED_VALIDATION`; only the
  coordinator may record that state in `PROJECT_STATE.yaml`.

## Current state

Branch:       `work/phase6-offline-b01`
Working tree: uncommitted and unstaged candidate changes in `apps/server/src/openapi.ts`,
              `apps/server/src/phase6-offline.integration.test.ts`, `packages/api/src/offline/**`,
              `packages/api/src/edge-push.ts`, `packages/api/src/edge-push.test.ts`,
              `packages/api/src/occupancy/engine.ts`, `packages/api/src/occupancy/engine.test.ts`,
              `edge/**`, and this Phase 6 handoff directory. No forbidden path remains changed.
Committed:    none after activation commit `9909377423d82670f4aa3569a2231f13c26a7bb5`
              (parent `06486487914c5a78afb3aa6e264e6988e0c5cb85`).
Tests:        implementer `verify:fast` PASS; implementer `FITWAY_PHASE=6 pnpm verify:phase`
              PASS; independent focused/unit/Python/integration/phase gates PASS; independent
              acceptance verdict REJECT.
Deployed:     not deployed; not pushed; no commit was created for the rejected candidate.
In progress:  none. Production-code work stopped immediately on the verifier rejection. The
              rejected working tree is intentionally preserved for coordinator inspection or a
              separately activated recovery attempt.

## Decisions

- Use `FITWAY_PHASE=6` — decided by the coordinator on 2026-08-09 — supersedes only the earlier
  `phase-6` selector and rules out editing `scripts/verify.mjs`.
- Phase 6 produces no UI — locked by Product/Phase/ADR-008 and activation — rules out any staff or
  owner fallback/command surface and any Paper/browser/visual gate.
- No current internal producer of `source=manual` exists — independent repository audit confirmed
  the worker finding — rules out preserving the value on producer grounds, but does not authorize
  removal. A legacy-data audit and coordinated schema/DTO/normative cleanup remain necessary.
- The fresh verifier's REJECT is `FAILED_VALIDATION` — required by `docs/WORKFLOW.md` — rules out
  repairing or re-verifying this attempt in place.

## Remaining

1. Coordinator records this attempt as `FAILED_VALIDATION` without overwriting its history and
   decides whether to activate a new Phase 6 attempt from a clean branch/worktree.
2. A new attempt must resolve the stale-live reconnect authority bug and persist the exact
   ambiguous in-flight request across crashes before rebuilding/draining subsequent payloads.
3. Resolve backfilled minutes with the settings version effective at each minute, including a
   deterministic duplicate after a settings change.
4. Define the exact schedule/reset subset required in the frozen edge response. If the required
   values are absent from the current schema, obtain coordinator/human authority for any migration
   or normative change rather than working around the activation boundary.
5. Add end-to-end and boundary evidence for Python outage/reconnect, `commands_pending`, final live
   recovery, crash/restart, 2,880-minute eviction, and more-than-100-minute batch draining.
6. Coordinator separately audits deployed legacy `manual` rows and plans atomic enum/DTO/settings/
   normative cleanup; this failed attempt does not authorize that cleanup.

## Blockers

- Fresh independent verification rejected the candidate — blocks integration and any ready/DONE
  claim for this attempt.
  Options: preserve this tree as evidence and activate a clean recovery attempt; or abandon the
  candidate. Continuing repairs in this attempt is not permitted by the workflow.
  Recommendation: create a new recorded attempt with explicit leases for effective-settings
  lookup and with a human/coordinator decision on the schedule/reset response subset.
- The verifier found four product-affecting defects:
  - an old ambiguous live payload can re-establish fresh current authority before backfill drains;
  - backfill uses latest rather than minute-effective settings;
  - the frozen v2 response omits the required schedule/reset subset;
  - the exact in-flight request is not durable across process restart, allowing same-sequence
    payload drift and possible wrong outbox removal after replay.

## Verification

- Focused TypeScript contract/domain suite — 4 files, 12 tests passed.
- Python simulator suite — 7 tests passed.
- Focused authenticated Postgres suite on `fitway_integration_p6_offline_b01` — 1 file, 3 tests
  passed, including shared TypeScript/OpenAPI/Python fixture parity.
- `pnpm verify:fast` — PASS: repository invariants, Biome over 225 files, eight workspace type
  checks, 38 unit files / 162 tests, seven Python tests, mutation guard.
- `FITWAY_RUN_ID=p6_offline_b01`, reserved disposable database, `FITWAY_PHASE=6 pnpm verify:phase`
  — PASS: fast ladder plus Phase 6 integration 3/3 and mutation guard.
- Independent run `p6_offline_review01` with disposable database
  `fitway_integration_p6_offline_review01` — focused 12/12, Python 7/7, integration 3/3, and full
  Phase 6 gate PASS; acceptance verdict REJECT with the four product defects above.
- Scope check — all changed/untracked files are owned or leased; `apps/server/src/openapi.test.ts`
  is unchanged from activation; no UI/database/migration/env/router/context/index/verification/
  ledger path changed.
- Not verified: `pnpm verify:full`, non-profile integration/build/browser suites, deployment, or
  real network Python-to-server recovery. Phase verification explicitly defers non-profile gates;
  UI/browser gates are not required for this no-UI phase.

## Recommended next session

Mode: `plan`

Coordinator session: record `p6_offline_b01` as `FAILED_VALIDATION`, preserve the rejected branch
for evidence, and prepare one clean Phase 6 recovery attempt. Freeze the exact response
schedule/reset subset before launch; grant any additional repository/settings lease it requires.
The recovery objective is to settle ambiguous sequences without granting stale live authority,
persist the exact in-flight payload across restart, resolve minute-effective historical settings,
and prove Python outage/reconnect plus boundary batching. Require focused TDD, `verify:fast`,
`FITWAY_PHASE=6 pnpm verify:phase` with new disposable resources, a durable candidate handoff, and
a fresh independent verifier. Do not update UI or remove `manual` values in that worker attempt.
