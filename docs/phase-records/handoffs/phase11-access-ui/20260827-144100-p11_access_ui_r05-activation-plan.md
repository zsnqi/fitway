# Phase 11 Access UI r05 native repair activation and plan

- State: `IN_PROGRESS`; plan review pending and no source implementation has started.
- Human authority (2026-08-27): freshly repair the blocking findings from the latest terminal Access UI `FAILED_VALIDATION`, use native routes only, do not broaden scope, and stop at this task's terminal outcome.
- Integrated authority: coordinator frontier `8f2de74ecdc1f44f5bafe1f8c4ccd4d662b1a3ab`, containing accepted Access UI r03 integration `0edb9d97fe0967148158f4a15c13294bdf97ee6e` and accepted candidate `abc712ff0b29203ce7ed3b63fcf954306f8d547d`.
- Rejected predecessor: r04 terminal `d69f459b386a8166598e784bd2f59ed695e7d4db`, frozen candidate `af144fd4a1ef1c5fe06a96caef56cf6012736540`, source candidate `bea8774f8c4a403ea9adc5f4cd75ea4d579ff6c7`. r04 remains immutable evidence and is not resumed or cherry-picked.
- Branch/worktree/run prefix: `codex/phase11-access-ui-r05-native` / `D:/Projects/fitway-worktrees/phase5-staff-integration/.codex-worktrees/phase11-access-ui-r05-native` / `p11_access_ui_r05`.

## Objective and observable acceptance

Preserve r04's validated one-time PIN reveal focus lifecycle while replacing its non-discriminating browser evidence with request- and response-derived proof for all seven successful governance actions.

The candidate passes only when executable evidence proves:

1. each rendered audit row is tied to the `auditId` actually received by the browser from that mutation response, including target, prior/new lifecycle or credential version, and reason where applicable; deliberately changing only the response audit ID must make the test fail;
2. the provisioned owner's real principal UUID is used for deactivate, rejected-login, reactivate, and fresh-login probes;
3. fixture login submits a credential and distinguishes current from stale credentials: staff provision/rotation and owner provision/reset accept the replacement/current credential and reject the old credential; deactivation rejects the correct credential; reactivation permits a fresh login without reviving old sessions; unrelated owner sessions remain valid;
4. the staff primary action remains the same DOM/focus target while provision refresh changes it to rotate, both before and after reveal dismissal; Tab, Shift+Tab, Escape, focus return, and secret removal remain covered;
5. no raw PIN/password/session material enters audit rows, durable records, logs, screenshots, or error output.

UI fixtures prove the browser contract and rendered consequence only. Existing disposable-Postgres integration remains the authority for real credential/session/audit persistence and must pass independently.

## Scope and locked decisions

One implementation writer may edit exactly:

- `apps/web/src/components/owner/access/owner-access-view.tsx`
- `apps/web/src/components/owner/access/owner-access-view.test.tsx`
- `tests/browser/phase11-access.browser.spec.ts`

The coordinator alone writes this attempt's ledger, handoff, route-decision, and verification records. No CSS, messages, hooks, backend, API, schema, migration, router, root package/lock/config, environment schema, other owner surface, Paper node, visual-direction artifact, or canonical screenshot may change. The seven action labels, secret-free audit rule, owner lifecycle semantics, accepted r03 Paper successor, and accepted r03 canonical images are locked.

## Stages and rollback boundaries

1. **Activation and plan review.** This metadata-only commit opens r05 at repair count `0/2`. A fresh native reviewer checks authority, scope, discriminating acceptance, and verification completeness. Rollback: revert the activation commit; accepted r03 stays integrated.
2. **Bounded implementation.** Re-derive the smallest r04 focus changes against r03, then build credential-aware, response-correlated browser fixtures. Establish red tests for each recorded r04 blocker before green. Rollback: revert the single source/test implementation commit.
3. **Candidate freeze.** Coordinator reviews the complete diff and evidence, writes the candidate handoff, then runs freeze checks after every tracked write. A freeze defect is repaired before submission and does not consume validation budget. Rollback: amend or revert only the candidate-record commit before submission.
4. **Fresh verification and independent review.** A native verifier that did not implement runs focused and broad gates, performs interactive Browser inspection plus repository Playwright checks, and fault-injects at least audit-ID mismatch and stale-credential acceptance. The verifier never repairs. A rejection consumes one repair attempt; at most two focused repairs are permitted, and a third recurrence is terminal `FAILED_VALIDATION`.
5. **Coordinator terminal gate.** On `PASS`, integrate the bounded candidate onto the current coordinator frontier, rerun integration checks, record `DONE`, and release ownership. On a red gate, run only the authorized focused repair loop or record the required terminal state. Stop without starting another task.

## Verification contract

Environment preparation:

- `pnpm install --frozen-lockfile`
- `pnpm exec .\\node_modules\\.bin\\vitest.CMD --version` on this Windows host. A clean frozen install generated the shim and it reports `vitest/4.1.10 win32-x64 node-v24.14.0`; bare `pnpm exec vitest --version` does not resolve generated root shims in the current host environment.
- provision the worktree's ignored `apps/server/.env` without printing secrets before integration/full gates

Focused and rendered behavior:

- `pnpm exec .\\node_modules\\.bin\\vitest.CMD run apps/web/src/components/owner/access/owner-access-view.test.tsx apps/web/src/hooks/use-owner-access.test.tsx`
- `pnpm exec .\\node_modules\\.bin\\playwright.CMD test tests/browser/phase11-access.browser.spec.ts --project=chromium` with a unique run ID, port, output path, and no baseline updates
- explicit fault-injection copies or runtime switches proving response audit-ID mismatch, wrong-principal use, old-credential acceptance, and replacement-credential rejection turn the exact success test red

Repository ladder:

- `pnpm verify:fast`
- `FITWAY_PHASE=phase11-access pnpm verify:phase`
- `pnpm verify:full` with exact run-specific disposable PostgreSQL database and destructive-test marker

Freeze after all tracked writes:

- `git diff --check 8f2de74ecdc1f44f5bafe1f8c4ccd4d662b1a3ab..HEAD`
- `pnpm check:repository`
- `pnpm check`
- `pnpm check-types`
- full candidate scope/status check and exact accepted canonical SHA256 check

Interactive review covers English LTR and Arabic RTL at desktop/mobile, live/refusal/delayed/loading/unavailable states, reveal keyboard containment and return, 200% reflow, reduced motion, asymmetric safe areas, and absence of page overflow. Canonical hashes must remain desktop Arabic `E4CE9FA625EEDF016EA737A9D77499983BA4C3CF121A7614D5705632C212D064` and mobile English `9C1058544DDC877AAE9F2075E3A05263AFC63737EAC0EFEB5C92FA1A9AA6266C`.

## Risks, decisions, and stop conditions

The primary risk is another self-referential fixture that passes while the browser contract is wrong. The test must consume the actual browser mutation response and submitted credential, not a parallel map populated by the mock. Do not substitute fixed endpoint counts for session identity or infer database behavior from UI fixtures.

No open product decision remains. Stop at `NEEDS_HUMAN` for any required locked-product/security/privacy/material-visual change, authority conflict, out-of-scope production/config edit, or shared-ownership conflict. Unrelated red gates may be attributed only through the existing register rules; this attempt cannot open its own flaky entry.

Environment preflight: `pnpm install --frozen-lockfile` completed from the locked graph. The workflow's bare `pnpm exec vitest --version` lookup failed before assertions even though `node_modules/.bin/vitest.CMD` exists; the explicit generated-shim form above printed version `4.1.10`. This host-only lookup condition consumes no source-repair or validation budget and authorizes no package, lockfile, runner, or configuration edit.

Next gate: fresh native plan review. No source write, integration, deployment, push, external route, or second task is authorized before that review passes.
