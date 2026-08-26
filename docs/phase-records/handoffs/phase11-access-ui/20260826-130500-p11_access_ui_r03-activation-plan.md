# Phase 11 Access UI r03 — human-authorized fresh repair activation

## Completed

- Reconciled the terminal `r02` handoff and ledger against preserved candidate `97e4f70581a250b75bf75e878c96602c1ce1747f`.
- Recorded the human decision of 2026-08-26 authorizing one fresh repair attempt beyond the exhausted `2/2` budget.
- Adopted the predecessor's exact repair recommendation without repeating completed implementation, visual discovery, or accepted Paper-family work.

## Exact current state

- Status: `IN_PROGRESS`; run `p11_access_ui_r03`.
- Coordinator branch/worktree: `codex/remaining-scope-coordinator` / `C:/Users/Pc Force/.codex/worktrees/f2a7/phase5-staff-integration`.
- Fresh repair branch/worktree: `codex/phase11-access-ui-r03` / `D:/Projects/fitway-worktrees/phase11-access-ui-r03`, to be created from preserved candidate `97e4f70581a250b75bf75e878c96602c1ce1747f`.
- Terminal predecessor `codex/phase11-access-ui-r02`, its `FAILED_VALIDATION` handoff, commits, canonical evidence, and review verdicts remain immutable.
- No shared lease is open. No deployment or external provisioning is authorized.

## Decisions

- Human, 2026-08-26: authorize exactly one fresh repair attempt beyond the prior exhausted budget; this rules out treating the terminal `r02` attempt as reopenable.
- Coordinator: the fresh attempt inherits the accepted `r02` candidate and changes only the independently confirmed open-state defect plus its missing regression assertion.
- The accepted Paper family, product/content decisions, backend, schema, router, catalog, tokens, other owner surfaces, and canonical compositions remain locked and out of scope.

## Adopted plan and rollback

1. Add a failing assertion that the `Provision owner` trigger is hidden after the provisioning form opens.
2. Insert the missing class-token separator before `owner-access-owners-summary--provision-open`.
3. Run focused component and browser checks, `verify:fast`, the registered `phase11-access` ladder, `verify:full`, candidate freeze, and the required responsive/accessibility/visual checks on fresh run-scoped resources.
4. Obtain fresh independent contract verification and a separate independent UI/Paper-family review. Neither reviewer may repair.
5. If both gates pass, integrate into `codex/remaining-scope-coordinator`, rerun post-integration verification, update the ledger and durable handoff, and mark `DONE`. Any blocking gate failure is the terminal outcome of this explicitly authorized attempt.

Rollback boundary: one fresh `r03` repair commit on top of preserved candidate `97e4f70`; reverting that commit restores the rejected candidate exactly.

## Scope

Writer-owned:

- `apps/web/src/components/owner/access/owner-access-view.tsx`
- `apps/web/src/components/owner/access/owner-access-view.test.tsx`
- `tests/browser/phase11-access.browser.spec.ts` only if the focused component assertion cannot prove the rendered open-state contract
- `docs/phase-records/handoffs/phase11-access-ui/*-p11_access_ui_r03-*.md`
- `docs/phase-records/route-decisions/p11_access_ui_r03-*.json`
- `docs/phase-records/verification/*p11_access_ui_r03*`

Coordinator-only:

- `PROJECT_STATE.yaml`
- integration and terminal-state records

Forbidden: every path outside the list above; Paper mutation; canonical screenshot replacement; design or content changes; backend/schema/router/catalog/token work; M4/M5 races; rate limiting; unrelated debt; deployment.

## Verification

Precommitted commands and observations:

- `pnpm exec vitest run apps/web/src/components/owner/access/owner-access-view.test.tsx apps/web/src/hooks/use-owner-access.test.tsx`
- unique-run Chromium coverage of the open provisioning state in `tests/browser/phase11-access.browser.spec.ts`
- `pnpm verify:fast`
- `FITWAY_PHASE=phase11-access pnpm verify:phase` with run `p11_access_ui_r03_phase`, a unique port, and disposable database `fitway_integration_p11_access_ui_r03_phase`
- `pnpm verify:full` with a second unique run ID, port, and disposable database
- responsive/UI checks at the previously required widths, English LTR and Arabic RTL, including keyboard, focus, target size, reduced motion, forced colors, 200% reflow, accessibility, and overflow
- workflow candidate-freeze check after all durable candidate records are written

Not yet verified: the fresh branch and repair do not exist at activation.

## Blockers

- None. The human authorization resolves the only terminal-attempt authority blocker.

## Recommended next session

`execute` mode: create `codex/phase11-access-ui-r03` from preserved `97e4f70`, implement only the class-token separator and trigger-hidden assertion, run the precommitted gates, and return the candidate for fresh independent contract and UI review without changing Paper or any accepted baseline.
