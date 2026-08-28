# Login b03 coordinator integration plan

Base B: c2977cd96d2a19a4b6737dee69a206a32604a895 (Access DONE; full measured cac4b9e).
Candidate: eb2e3dad73fd0af24bd5d925c83ef052ace86c9a; source 2979bdb196b5a09bf3967f5658416d4b721ee57d; original base 0ef72c2f54e8faa16f24c368990ea5cc62693138.

Execute directly in the clean official coordinator worktree on codex/remaining-scope-coordinator after Access gates/ownership close. No new worktree. Preserve the original candidate branch/worktree and seven-commit history. One writer; serialize ladders.

## Authority and scope

AGENTS.md, docs/WORKFLOW.md, Product/Spec and DESIGN_GUIDE remain binding. Login repair1/3/4 handoffs under docs/phase-records/handoffs/login-paper-adoption/ record the Aug27 human Paper copy/state-behavior overrides. S4 is resolved: retain accepted disabled/non-focusable/no-action behavior and record reload-only as an inference, not a new approval gate. The Aug24 coordinator activation at docs/phase-records/handoffs/coordinator/20260824-230600-final-remaining-scope-reconciliation-activation.md authorizes serialized acceptance of the two submitted canonical refreshes after fidelity review.

One-time carry: all 16 candidate paths, including seven historical handoffs and two PNGs. Writable source thereafter: apps/web/src/components/login/login.css only for parity below. Shared leases: apps/web/src/i18n/messages/{ar,en}.ts limited to candidate staffWeb.login blocks; tests/browser/phase4-staff-web.browser.spec.ts; tests/browser/phase9-owner-ui.browser.spec.ts one heading; scripts/verify.mjs additive profile; the two named Login PNGs only. Coordinator owns PROJECT_STATE.yaml, this attempt's records, and a dated Login-only addendum/cross-reference in docs/adr/ADR-007-paper-visual-source-of-truth.md.

No backend/auth-client/DTO/schema/migration/router/global-token/staff.css/owner-CSS/package/lock/config/Paper/manifest edits; no other baselines or unrelated milestones.

## Merge and four compatibility edits

Activate with both dependencies DONE, exact B, owner, paths, existing handoff, heartbeat and unexpired lease. Preserve repair history.

Run git merge --no-ff --no-commit eb2e3dad73fd0af24bd5d925c83ef052ace86c9a. Only phase4 spec overlaps newer source; its copy hunks and accepted focus additions are disjoint. Preserve both; no blanket ours/theirs.

1. Phase9 spec current line411: replace only old Arabic Login-heading expectation with approved title from staffWeb.login; retain redirect/auth assertions.
2. Login CSS line59: local skip-link reveal :focus-visible -> :focus.
3. Copy accepted Login-only forced-colors focus selectors from staff.css:941 into login.css: controls/tab stops get outline:2px solid Highlight; outline-offset:2px. Do not restore staff.css import.
4. Before unchanged operations-shell probe: remove logged-out session mock, call existing mockStaffPage(page), navigate /staff, await main. Preserve exact selector, solid and >=2px assertions; no exact computed offset.

## Profile and gates

Add login-paper-adoption to scripts/verify.mjs: integrationFiles:[], label:"Login Paper adoption integration"; browserFiles are tests/browser/{login-paper-adoption,phase4-staff-web,phase9-owner-ui,public-baseline,phase11-shell}.browser.spec.ts. Retain other profiles.

Recheck pnpm exec vitest --version (verified shim fallback only). Use fresh run IDs/ports/output/report/review paths. Run:
- pnpm exec playwright test tests/browser/phase4-staff-web.browser.spec.ts --project=chromium --grep "keyboard order, focus transfer"
- pnpm verify:fast
- pnpm verify:phase --phase login-paper-adoption

Capture relevant parity red/green; runtime stylesheet fault injection must make Login/operations selector-removal assertions red. No verifier source edits. Commit provisional merge C, then AFTER all record writes freeze: git diff --check B..HEAD; pnpm check:repository; pnpm check; pnpm check-types; clean git status.

Fresh independent native review judges merged C, not old b03: full diff/security/scope, Browser+Paper fidelity, both locales/all nine required widths/S1-S5, cold and Staff-to-Login, plain/keyboard focus, 200% reflow, safe areas, reduced motion/transparency, forced colors, axe/manual semantics, rendered nonempty AR S2/S5. Run registered phase and pnpm verify:full with independent run IDs and exact disposable database/marker, safely separated application URL, no secrets printed. Coordinator checks actual images/XML/logs. Later source edits invalidate C evidence.

Compare only submitted AR1440 and EN390 Login PNGs, normally without --update-snapshots. Their SHA256 prefixes are 0BD7F93986D99E5D and 5218D87031426ED3; capture full hashes at acceptance. No automatic promotion or manifest change.

## Budget, closeout, rollback

Prospective integration repairs 0/2; preserve earlier history. At most two focused in-scope self-gate repairs; third recurrence FAILED_VALIDATION. Fresh independent rejection is terminal: no repair/resubmission. New scope, authority/security/product/schema conflict or material visual change => NEEDS_HUMAN. No flaky excuse for propagation/Windows failures.

After PASS record C, release lease, DONE and metadata freeze. Focused integration may remain NOT_REQUIRED; record full DB evidence. Before commit: git merge --abort. After commit: revert merge with first-parent semantics; preserve terminal records, never reset coordinator/candidate. No push/deploy.
