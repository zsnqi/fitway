# Agent-context Login pilot evidence

## Receipt fields

- Status: READY packet on a deliberately PLANNED read-only rehearsal milestone; no worker lease, UI write authority, or visual promotion authority.
- Milestone / task class: `agent-context-pilot-ui-login-r01` / `ui-maintenance`.
- Base commit / candidate commit: packet base `7e79de90c52adb60127b3dfd57c88013985bbfc1`; promotion-candidate parent `6647739df04488060607d6b8c909001878a8e8ed`; the exact promotion commit is recorded by the post-READY evidence update.
- Branch / worktree / run ID: `codex/owner-distill-r01`; clean validation worktree `agent-context-m1-final/phase5-staff-integration`; Login browser run `agent_context_login_pilot_r01`.
- Owned paths / shared leases used: this receipt only; no shared lease.
- Decisions made: preserve Login's Product/Spec behavior, ADR-007 Paper authority, approved manifest provenance, accessibility requirements, and exact named-frame identity. No Owner authority or composition decision was opened.
- Changes by file: packet lifecycle/gate metadata, active-state evidence pointers/gates, and this receipt only. UI, browser-test, screenshot, Paper, manifest, and authority bytes were read-only.

## Validation commands and results

- `node scripts/show-agent-context.mjs --milestone agent-context-pilot-ui-login-r01`: bounded packet discovery passed in the draft rehearsal. The post-READY clean-checkout replay is required before M3 closure.
- `pnpm check:design-context`: PASS in the coordinator host, reporting Impeccable 4.0.0 through the installed Windows helper. A fresh subagent could not launch that helper in its restricted environment; that environment limitation is not treated as a product or design failure.
- `FITWAY_RUN_ID=agent_context_login_pilot_r01 pnpm exec playwright test tests/browser/login-paper-adoption.browser.spec.ts --project=chromium`: PASS, 8/8 tests. This focused run is corroboration, not the authoritative migration ladder.
- Exact current/reference Arabic desktop SHA-256: `81f00333dcc42f4a2741659cd474f58e0517fcc90d53580eab07a74a929d69af` for both named 1440x900 frames.
- Repository invariants passed during the draft rehearsal; authoritative migration fast/full runs remain closure gates.

## Rendered and accessibility evidence

- Coordinator explicitly inspected the named current and approved-reference Arabic RTL desktop 1440x900 frames; they were visually identical. Hash identity was confirmed separately and was not used as a substitute for visual judgment.
- The focused Login browser profile passed its Arabic/English, desktop/tablet/mobile, keyboard, target-size, zoom, reduced-motion/transparency, operational-state, overflow, and serious/critical Axe checks within that spec's exact matrix.
- No English-mobile difference was approved or promoted. No screenshot or authority bytes changed.

## Independent verifier findings

- PASS before promotion: the independent draft packet review accepted the bounded task, and a separate fresh-agent trial found the correct packet, visual authority chain, Login sources/spec, exact frames, base, scope, and handoff without loading historical content or editing UI.
- It correctly treated the focused browser spec as corroboration and noted that its exact matrix must not be overstated as every width listed in the broader guide.
- The trial exposed the same mechanical-validator/history ambiguity as the backend pilot. The bounded `context:show` repair now distinguishes startup discovery and has an independently accepted 11-test suite.
- The state `independentReview` gate records those completed pre-promotion reviews. A separate post-READY fresh-agent replay from the clean promotion commit remains an M3 closure gate.

## Named historical evidence

None. No historical content was requested or used as task context. Stored visual provenance came from the current approved manifest and named reference frame, not phase history.

## Remaining work or exact blocker

Run the post-READY clean-checkout fresh-agent trial, tracked routing checks, and migration fast/full ladders. Keep the milestone PLANNED until closure because this is a read-only rehearsal, not an executable worker assignment.

## Exact resume command

`pnpm context:show -- --milestone agent-context-pilot-ui-login-r01`

## Stop/escalation conditions

Stop on packet/hash/base/scope/handoff/frame drift, a missing authority selector, any UI or visual-authority change, an Owner-surface expansion, or any attempt to promote provenance or hash equality into visual acceptance.
