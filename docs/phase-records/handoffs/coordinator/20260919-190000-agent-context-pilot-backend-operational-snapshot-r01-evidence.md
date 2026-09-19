# Agent-context backend pilot evidence

## Receipt fields

- Status: READY packet on a deliberately PLANNED read-only rehearsal milestone; no worker lease or application write authority.
- Milestone / task class: `agent-context-pilot-backend-operational-snapshot-r01` / `backend-api-data`.
- Base commit / candidate commit: packet base `7e79de90c52adb60127b3dfd57c88013985bbfc1`; READY promotion commit `ba3b6e8dca704663c84413744e742e16b4cb7853`.
- Branch / worktree / run ID: `codex/owner-distill-r01`; clean validation worktree `agent-context-m1-final/phase5-staff-integration`; focused unit run under the direct runner and integration run `agent_context_m3_phase4`.
- Owned paths / shared leases used: this receipt only; no shared lease.
- Decisions made: preserve the existing Staff monitoring-only and operational-snapshot semantics from Product, Spec, ADR-003, ADR-008, and the reviewed DTO/procedure sources named in the packet. No semantic decision or source change was made.
- Changes by file: packet lifecycle metadata, active-state evidence pointers/gates, and this receipt only. Application and test sources were read-only.

## Validation commands and results

- `node scripts/show-agent-context.mjs --milestone agent-context-pilot-backend-operational-snapshot-r01`: bounded packet discovery passed in the draft rehearsal and the post-READY clean-checkout replay.
- Absolute-Node `scripts/run-vitest.mjs run --config vitest.config.ts packages/api/src/health/snapshot.test.ts`: PASS, 1 file / 4 tests.
- Absolute-Node `scripts/verify.mjs phase --phase phase4-health`, with disposable PostgreSQL database `fitway_integration_agent_context_m3_phase4` and run ID `agent_context_m3_phase4`: PASS, 84 unit files / 1062 tests, 120 Python tests, 1 integration file / 7 tests, and mutation guard.
- `node scripts/verify-repository.mjs`: PASS during the draft rehearsal and at the READY promotion commit.
- Absolute-Node `scripts/verify.mjs fast`, run `agent_context_m3_fast_ready_r03`: PASS, 85 files / 1073 tests plus 120 Python tests, after two documented environment-provisioning attempts supplied missing and then schema-valid synthetic variables.
- Absolute-Node `scripts/verify.mjs full`, run `agent_context_m3_full`: PASS after separating the application and resettable test databases; 85 files / 1073 unit tests, 120 Python tests, 19 files / 133 integration tests, build, and 176 browser/accessibility cases (173 passed, 3 skipped).
- The disposable `postgres:16-alpine` container was removed after the phase run.
- A first phase attempt exposed copied-state fixture contamination and produced the committed fixture-isolation repair. A second attempt omitted `TEST_DATABASE_URL`; it was not accepted as evidence. The recorded PASS is the later isolated disposable-database run.

## Rendered and accessibility evidence

Not required for this backend-only rehearsal. No visual or accessibility claim is made.

## Independent verifier findings

- PASS before promotion: the independent draft packet review accepted the bounded task, and a separate fresh-agent trial found the correct packet, base, scope, handoff, Product/Spec/ADR authorities, DTO, repository, procedure, and focused tests without application edits.
- It also exposed that repository-wide `check-agent-context` mechanically parses history and should not be described as agent startup context. The bounded `context:show` repair now separates startup discovery from mechanical ledger validation and has an independently accepted 11-test suite.
- Post-READY fresh-agent replay at `ba3b6e8dca704663c84413744e742e16b4cb7853`: PASS. It discovered the exact READY packet, matched state/hash/base/scope/handoff, selected every critical Product/Spec/ADR/code/test source, expanded only the role/DTO conditionals, opened no history/UI/visual/phase records, ran 4/4 focused unit tests and 7/7 isolated integration tests, removed its disposable container, and left Git clean.

## Named historical evidence

None. No historical content was requested or used as task context. Mechanical repository validation may parse the history ledger without loading it into agent reasoning.

## Remaining work or exact blocker

M3 evidence is complete. The milestone remains PLANNED with a READY packet because it is a read-only rehearsal without a worker lease. Its serialized CLOSED/history transition is deferred to M4 after the v2 history genesis exists.

## Exact resume command

`pnpm context:show -- --milestone agent-context-pilot-backend-operational-snapshot-r01`

## Stop/escalation conditions

Stop on packet/hash/base/scope/handoff drift, a missing canonical selector, any application or DTO change, a privacy or monitoring-only conflict, or any attempt to load history without a named trigger.
