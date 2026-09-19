# Agent-context Login pilot evidence

## Receipt fields

- Status: READY packet on a deliberately PLANNED read-only rehearsal milestone; no worker lease, UI write authority, or visual promotion authority.
- Milestone / task class: `agent-context-pilot-ui-login-r01` / `ui-maintenance`.
- Base commit / candidate commit: packet base `7e79de90c52adb60127b3dfd57c88013985bbfc1`; READY promotion commit `ba3b6e8dca704663c84413744e742e16b4cb7853`.
- Branch / worktree / run ID: `codex/owner-distill-r01`; clean validation worktree `agent-context-m1-final/phase5-staff-integration`; Login browser run `agent_context_login_pilot_r01`.
- Owned paths / shared leases used: this receipt only; no shared lease.
- Decisions made: preserve Login's Product/Spec behavior, ADR-007 Paper authority, approved manifest provenance, accessibility requirements, and exact named-frame identity. No Owner authority or composition decision was opened.
- Changes by file: packet lifecycle/gate metadata, active-state evidence pointers/gates, and this receipt only. UI, browser-test, screenshot, Paper, manifest, and authority bytes were read-only.

## Validation commands and results

- `node scripts/show-agent-context.mjs --milestone agent-context-pilot-ui-login-r01`: bounded packet discovery passed in the draft rehearsal and the post-READY clean-checkout replay.
- `pnpm check:design-context`: PASS in the coordinator host, reporting Impeccable 4.0.0 through the installed Windows helper. A fresh subagent could not launch that helper in its restricted environment; that environment limitation is not treated as a product or design failure.
- `FITWAY_RUN_ID=agent_context_login_pilot_r01 pnpm exec playwright test tests/browser/login-paper-adoption.browser.spec.ts --project=chromium`: PASS, 8/8 tests. This focused run is corroboration, not the authoritative migration ladder.
- Exact current/reference Arabic desktop SHA-256: `81f00333dcc42f4a2741659cd474f58e0517fcc90d53580eab07a74a929d69af` for both named 1440x900 frames.
- Repository invariants passed during the draft rehearsal and at the READY promotion commit.
- Absolute-Node `scripts/verify.mjs fast`, run `agent_context_m3_fast_ready_r03`: PASS, 85 files / 1073 tests plus 120 Python tests, after two documented environment-provisioning attempts supplied missing and then schema-valid synthetic variables.
- Absolute-Node `scripts/verify.mjs full`, run `agent_context_m3_full`: PASS after separating the application and resettable test databases; 85 files / 1073 unit tests, 120 Python tests, 19 files / 133 integration tests, build, and 176 browser/accessibility cases (173 passed, 3 skipped).

## Rendered and accessibility evidence

- Coordinator explicitly inspected the named current and approved-reference Arabic RTL desktop 1440x900 frames; they were visually identical. Hash identity was confirmed separately and was not used as a substitute for visual judgment.
- The focused Login browser profile passed its Arabic/English, desktop/tablet/mobile, keyboard, target-size, zoom, reduced-motion/transparency, operational-state, overflow, and serious/critical Axe checks within that spec's exact matrix.
- No English-mobile difference was approved or promoted. No screenshot or authority bytes changed.

## Independent verifier findings

- PASS before promotion: the independent draft packet review accepted the bounded task, and a separate fresh-agent trial found the correct packet, visual authority chain, Login sources/spec, exact frames, base, scope, and handoff without loading historical content or editing UI.
- It correctly treated the focused browser spec as corroboration and noted that its exact matrix must not be overstated as every width listed in the broader guide.
- The trial exposed the same mechanical-validator/history ambiguity as the backend pilot. The bounded `context:show` repair now distinguishes startup discovery and has an independently accepted 11-test suite.
- Post-READY fresh-agent replay at `ba3b6e8dca704663c84413744e742e16b4cb7853`: PASS for routing/context sufficiency. It found every critical source, matched packet/state/hash/base ancestry/handoff, expanded ADR-007 because Login is Paper-controlled, did not load ADR-009 or history, independently inspected the exact current/reference frames, and left Git clean. Host-only Playwright/design-context evidence remained coordinator-owned and was not misrepresented as the subagent's run.

## Named historical evidence

None. No historical content was requested or used as task context. Stored visual provenance came from the current approved manifest and named reference frame, not phase history.

## Remaining work or exact blocker

M3 evidence is complete. The milestone remains PLANNED with a READY packet because it is a read-only rehearsal without a worker lease. Its serialized CLOSED/history transition is deferred to M4 after the v2 history genesis exists.

## Exact resume command

`pnpm context:show -- --milestone agent-context-pilot-ui-login-r01`

## Stop/escalation conditions

Stop on packet/hash/base/scope/handoff/frame drift, a missing authority selector, any UI or visual-authority change, an Owner-surface expansion, or any attempt to promote provenance or hash equality into visual acceptance.
