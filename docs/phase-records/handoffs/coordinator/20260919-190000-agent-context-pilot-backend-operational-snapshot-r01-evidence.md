# Agent-context backend pilot evidence

## Receipt fields

- Status: READY packet on a deliberately PLANNED read-only rehearsal milestone; no worker lease or application write authority.
- Milestone / task class: `agent-context-pilot-backend-operational-snapshot-r01` / `backend-api-data`.
- Base commit / candidate commit: packet base `7e79de90c52adb60127b3dfd57c88013985bbfc1`; promotion-candidate parent `6647739df04488060607d6b8c909001878a8e8ed`; the exact promotion commit is recorded by the post-READY evidence update.
- Branch / worktree / run ID: `codex/owner-distill-r01`; clean validation worktree `agent-context-m1-final/phase5-staff-integration`; focused unit run under the direct runner and integration run `agent_context_m3_phase4`.
- Owned paths / shared leases used: this receipt only; no shared lease.
- Decisions made: preserve the existing Staff monitoring-only and operational-snapshot semantics from Product, Spec, ADR-003, ADR-008, and the reviewed DTO/procedure sources named in the packet. No semantic decision or source change was made.
- Changes by file: packet lifecycle metadata, active-state evidence pointers/gates, and this receipt only. Application and test sources were read-only.

## Validation commands and results

- `node scripts/show-agent-context.mjs --milestone agent-context-pilot-backend-operational-snapshot-r01`: bounded packet discovery passed in the draft rehearsal. The post-READY clean-checkout replay is required before M3 closure.
- Absolute-Node `scripts/run-vitest.mjs run --config vitest.config.ts packages/api/src/health/snapshot.test.ts`: PASS, 1 file / 4 tests.
- Absolute-Node `scripts/verify.mjs phase --phase phase4-health`, with disposable PostgreSQL database `fitway_integration_agent_context_m3_phase4` and run ID `agent_context_m3_phase4`: PASS, 84 unit files / 1062 tests, 120 Python tests, 1 integration file / 7 tests, and mutation guard.
- `node scripts/verify-repository.mjs`: PASS during the draft rehearsal.
- The disposable `postgres:16-alpine` container was removed after the phase run.
- A first phase attempt exposed copied-state fixture contamination and produced the committed fixture-isolation repair. A second attempt omitted `TEST_DATABASE_URL`; it was not accepted as evidence. The recorded PASS is the later isolated disposable-database run.

## Rendered and accessibility evidence

Not required for this backend-only rehearsal. No visual or accessibility claim is made.

## Independent verifier findings

- PASS before promotion: the independent draft packet review accepted the bounded task, and a separate fresh-agent trial found the correct packet, base, scope, handoff, Product/Spec/ADR authorities, DTO, repository, procedure, and focused tests without application edits.
- It also exposed that repository-wide `check-agent-context` mechanically parses history and should not be described as agent startup context. The bounded `context:show` repair now separates startup discovery from mechanical ledger validation and has an independently accepted 11-test suite.
- The state `independentReview` gate records those completed pre-promotion reviews. A separate post-READY fresh-agent replay from the clean promotion commit remains an M3 closure gate.

## Named historical evidence

None. No historical content was requested or used as task context. Mechanical repository validation may parse the history ledger without loading it into agent reasoning.

## Remaining work or exact blocker

Run the post-READY clean-checkout fresh-agent trial, tracked routing checks, and migration fast/full ladders. Keep the milestone PLANNED until closure because this is a read-only rehearsal, not an executable worker assignment.

## Exact resume command

`pnpm context:show -- --milestone agent-context-pilot-backend-operational-snapshot-r01`

## Stop/escalation conditions

Stop on packet/hash/base/scope/handoff drift, a missing canonical selector, any application or DTO change, a privacy or monitoring-only conflict, or any attempt to load history without a named trigger.
