# phase11-e2e-propagation-wait: prospective bounded plan

Date: 2026-08-28. Discovery was read-only; no runtime reproduction was performed during planning.
Coordinator adoption: clean authoritative HEAD `9082d8f16b8fe9f0a26b65998b32a3b23424888c`, after terminal Login rejection and history-preserving rollback. The packet's target source and protocol excerpts are unchanged from the observed planning head. This durable record adopts the plan and authorizes W1 only; W2 remains conditional on native causal reproduction.
Repository root: C:/Users/Pc Force/.codex/worktrees/f2a7/phase5-staff-integration.
Route: docs/phase-records/route-decisions/p11_propagation_plan_20260828.json.

## Authority and scope

AGENTS.md and docs/WORKFLOW.md retain coordinator ownership, one writer, explicit leases, real isolated verification, and at most two focused validation repairs; a third recurrence is FAILED_VALIDATION. PROJECT_STATE.yaml:1684 has this milestone PLANNED, dependency phase11-browser-debt, no leases, zero repairs, integration and independent review required. Its forbidden paths explicitly prohibit timeout inflation and pipeline mocking. SPEC.md:192-197 requires history backfill never to change current count. No new product/security choice is evident. An engine/backfill semantics change would conflict with that rule and is not this repair.

Read authoritative historical evidence:
- docs/phase-records/verification/20260823-phase2-integration-browser-wait-followup.json: three independent changed-count failures at phase2.integration.test.ts:779 inside verify:full integration; intermittent standalone greens; explicitly NOT an attribution license.
- docs/phase-records/verification/20260823-p11_ladder_contention_b01-falsification-result.json: 865d678 raised global Playwright expectations to 20s; four full runs still browser-red; reverted at ceb0968. Global expect cannot reach the explicit 5s waits here. Its four integration greens were coincidence, not evidence of repair.

## Source evidence and falsifiable hypotheses

H1, strongest, not reproduced: the test mistakes an acknowledged backfill for an acknowledged current sample.
apps/server/src/phase2.integration.test.ts:741-764 runs real py edge/simulator.py --action once, checks only outcome=processed, then returns persisted state.count. At :775-779 it expects that value in the browser.
edge/simulator.py:99-120 buffers the previous minute when wall time crosses a UTC minute, then changes local count; :141-150 selects a push. edge/fitway_edge/protocol.py:57-106 prioritizes outbox backfill, with no currentCount, before live. simulator.py:275 returns after that first processed request. protocol.py:351 preserves the acknowledged payload as lastRequest.
packages/api/src/offline/reconciliation.ts:15-22 forbids backfill current writes. occupancy/engine.ts:289-300 updates current only with authority plus currentCount, yet :323-328 returns processed for accepted history too. Therefore changed local count may never have been sent live; no longer DOM wait can make it appear. Existing edge/test_simulator.py:92-147 already verifies buffering, backfill acknowledgement, then live resume at unit level.

H2, related: simulator.py:207-225 keeps sampling during network/429/5xx retries while retaining the exact in-flight request. local state.count can differ from even a live acknowledged lastRequest.currentCount. engine.ts:236-247 and reconciliation.ts:31-38 also make an old v2 live sample history-only. A live-mode processed acknowledgement alone does not prove a fresh current write. Default DeviceRateLimiter is three tokens, one refill per 5000ms; an added drain call can expose throttling. Do not weaken that limiter or freshness to make the test pass.

H3, conditional only: if a fresh accepted live request updated current but the browser misses it, inspect real GET/poll/render causality. use-public-occupancy.ts:27-37 schedules visible-page polling; lib/public-occupancy.ts:46-50 jitters the configured 1s interval to 900-1100ms. The test sets a real 3s freshness window. payload-builder.ts:108-115 retains count when stale, so freshness expiry alone does not explain permanent absence of the changed count. No latency distribution or frontend defect is established.

## Activation and exact ownership

Coordinator: activate from clean accepted post-Login HEAD; register owner, source HEAD, expiry, repair budget, branch/worktree, evidence paths. A writer worktree must be isolated and prepared per WORKFLOW; preserve original coordinator and Login evidence.
Worker source lease ONLY apps/server/src/phase2.integration.test.ts, specifically the existing real-browser test and necessary local imports/types/helpers. No production code, snapshots, package/lock/config, edge runtime, DB schema, application hooks, or other tests.
Coordinator-only edits: PROJECT_STATE.yaml; new bounded handoff/verification records; scripts/verify.mjs solely to add phase11-e2e-propagation-wait with integrationFiles ["apps/server/src/phase2.integration.test.ts"], browserFiles [], descriptive label. Chromium is already exercised within integration; no extra standalone browser profile or timeout change. No worker owns scripts/verify.mjs.

## GLM-first writer stages; native evidence gates

Use a meaningful, deliberately qualified expansion of GLM's demonstrated edit class, not a probe or a claim that GLM owns server safety. Parent freezes a task-scoped packet: full leased test, the source excerpts above, real request/ack/state shapes, authority clauses, exact diff constraints, unchanged 5s/60s budgets, and sanitized expected trace. No .env, real credentials, unrestricted repository discovery, DB access, external services, or runtime permission. One writer; native reviewers read while source is frozen.

W1 (GLM, real test edit): add bounded failure diagnostics and one causal persisted-state fixture within the existing test. Collect only request mode/sequence/observedAt/currentCount, response status/reason/highest sequence/serverTime, process outcome, real browser occupancy responses/poll header, and DOM/count/freshness timings. Observe actual handlers/responses without substituting them; never log request headers, bearer tokens, cookies, environment, or whole payloads. Capture diagnostics on failure without making success depend on extra DB polling. Immediately before the changed-count leg, seed a valid prior-minute simulator state so the real next once call must drain backfill. This controls real pipeline input, not the clock or transport. Native reviews the patch before executing it.

Native reproduction: use the old helper with this fixture. Prediction: real accepted backfill advances sequence/history, current stays at firstCount, simulator local count differs, and old changed-count wait fails. Prove one subsequent actual fresh live push updates DB, public payload and browser. Preserve the intentional red as a predeclared experiment, not a red gate excused as flaky. If a genuine fresh live request was already processed and changed current before the failure, H1 is falsified for that run; stop and follow H3 rather than apply a speculative fix. Record real 429/retries and sample age.

W2 (GLM, after native freezes reproduced mechanism): replace the arbitrary local-count expectation with strict acknowledgement correlation and bounded real backfill-drain-to-live orchestration. Keep the forced rollover regression; first and recovery legs still exercise normal live. Use acknowledged lastRequest.currentCount only for a fresh live request, preserving changedCount != firstCount and every original unavailable/fresh/changed/stale/recovery plus Arabic/English DOM assertion. Proposed ceiling: at most three real once invocations per logical sample, existing total 60s ceiling, existing 5s DOM deadline after the actual live acknowledgement. Extra attempts may drain observed backfill only; no retry-to-green for a stale live, unexpected sequence, transport error or wrong DOM. Native must freeze exact rate-limit-safe real pacing from W1 before this packet is executable; do not increase limiter capacity, bypass Retry-After, hide elapsed time by waiting on DB first, force query refetch/reload, or remove original freshness checks. If those constraints cannot hold, stop for a revised bounded plan, not ad hoc production changes.

Native reviews each source delta and runs actual Python/HTTP/Postgres/browser checks; a fresh independent native reviewer checks integrated proof and executed traces. GLM authors a substantial deterministic test change but does not declare conformance, integrate, or pass its own work. Out-of-scope edits or an unreviewable result reject the packet and consume no authority to expand it.

## Reproduction and candidate gates

Before native execution: frozen lockfile install and pnpm exec vitest --version; privately provision required server environment; unique lowercase FITWAY_RUN_ID; exact disposable TEST_DATABASE_URL database fitway_integration_<run-id>; matching FITWAY_INTEGRATION_RESET_DATABASE; per-run output and ports. Never print credential values. No concurrent source writer or shared database run.

Commands, at frozen candidate and with those guards:
1. pnpm exec vitest run --config vitest.integration.config.ts apps/server/src/phase2.integration.test.ts -t "drives the real browser through unavailable, fresh, changed, stale, and recovery"
2. pnpm verify:fast
3. pnpm verify:phase --phase phase11-e2e-propagation-wait
4. pnpm verify:full

Predeclare six consecutive focused candidate repetitions and two full-ladder runs with fresh run IDs/resources, stopping on any unexpected red rather than accumulating selected greens. Repeat counts do not replace the deterministic causal regression. No repeated full run before diagnosing/recording its failure. Reviewer must inspect the pre-fix red, repaired same-input green, unchanged backfill semantics, real request-to-DOM chain, actual test counts and unchanged tracked status. A negative control withholding the required live follow-up must still fail changed-count acceptance; it must not pass by reading DB/API instead of the browser.

## Windows caveat, risk, stop and rollback

edge/windows/run.ps1:157-159 passes space-containing client/config paths through unquoted Start-Process -ArgumentList. The direct phase2 target uses execFileAsync("py", argument array), never run.ps1, so this defect does not block the narrow reproduction. verify:fast/phase/full run test:simulator and Windows lifecycle coverage, so the broad gate can fail on space-containing TEMP/TMP. Native may provision and record an explicitly run-owned space-free TEMP/TMP before the run; this is environment isolation, not a Windows defect fix or permission to waive a red. No run.ps1 work belongs here.

Risk is primarily weakened proof, extra requests triggering the real limiter, and secret-bearing diagnostics. Preserve wall clocks, server/DB/HTTP/polling, original time budgets, cleanup and all assertions. Product/UI behavior and canonical images are unchanged.

Stop on unleased source need, Product/Spec conflict, destructive-resource guard failure, uncorrelated acknowledgements, failure evidence contradicting the frozen cause, or a failed gate outside the declared repair. Record at most two prospective focused repairs across all writers/sessions; third recurrence FAILED_VALIDATION. No human authority question currently needs reopening; any later semantic/security conflict does.

Rollback boundary: preserve activation and evidence, discard/revert only this candidate's explicit test patch and coordinator profile/ledger changes through normal coordinator review; never reset the current checkout or revert Login/Access. Keep failed/negative evidence and candidate worktree. Only coordinator adopts the result, integrates, runs full gates and declares DONE.
