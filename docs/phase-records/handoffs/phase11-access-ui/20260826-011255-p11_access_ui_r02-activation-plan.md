# Owner Access UI repair 2/2 — activation plan

## Completed

- Coordinator selected the final bounded Access UI repair from the 2026-08-25 independent rejection at `181480a`.
- Paper review mode confirmed the accepted authority remains `OWNER ACCESS — BEHAVIOR-CORRECT SUCCESSOR — CURRENT` in Paper file `01KYPX5AF950XZVVDD88B6J7QB`, Page 1; Paper was not edited.
- The repository plan was independently prepared and adopted with no open product, security, schema, or design decision.

## Exact current state

- Coordinator branch/worktree: `codex/remaining-scope-coordinator` at `61bacdbc782f3aefac628efd88c721abcafc045b`, clean before this activation.
- Repair branch/worktree: `codex/phase11-access-ui-r02` at `D:/Projects/fitway-worktrees/phase11-access-ui-r02`, to start from this activation commit.
- Run: `p11_access_ui_r02`; repair budget becomes `2 of 2`.
- Rejected candidate `181480a176896133c310eadd10273fe8b108a6b0` and its two PNGs remain preserved evidence, not accepted baselines.
- No deployment or external provisioning is authorized or performed.

## Decisions

- Human/Paper authority already accepted the behavior-correct successor; this session implements it and does not redesign it.
- The repair is repository UI only. Paper, backend, schemas, migrations, routers, shared catalogs, global tokens, root config, and unrelated owner surfaces are ruled out.
- Paper timestamps are omitted because the Access DTO does not provide them; fabricating values or widening the backend is ruled out.
- The seven approved action labels, secret-free owner mutation responses/audit, and the recorded M4/M5/rate-limit exclusions remain locked.
- Canonical baseline replacement is coordinator-only and occurs only after fresh fidelity review; rejected images are not promoted by reproducibility.

## Adopted plan

1. Add failing component/browser assertions for the four rejected findings.
2. Implement two sibling desktop summaries above one owners table; at 820px and below collapse provisioning behind the existing action and render owners as one separator-based board.
3. Add a localized polite owner-created success status that says no credential was returned; expose no password, PIN, copy action, or returned secret.
4. Clear reset password and reset mutation/refusal state on cancel and target switch.
5. Validate provision/reset passwords locally before transport: required, minimum 12, maximum 200, localized inline error, `aria-invalid`, and `aria-describedby`.
6. Run focused tests, the registered phase ladder, the full ladder, and the FITWAY UI polish matrix. Replace only this slice's two canonical PNGs after fresh Paper-fidelity review passes.
7. Freeze the candidate, then run fresh independent verification and review. Any recurrence is terminal `FAILED_VALIDATION`; there is no repair 3.

## Scope and rollback

Writer-editable source/tests:

- `apps/web/src/components/owner/access/owner-access-view.tsx`
- `apps/web/src/components/owner/access/owner-access.css`
- `apps/web/src/components/owner/access/messages.ts`
- `apps/web/src/components/owner/access/owner-access-view.test.tsx`
- `tests/browser/phase11-access.browser.spec.ts`
- this run's Access handoffs, route decisions, and verification records

Coordinator-only after fidelity PASS:

- the two existing Windows Chromium Access screenshot files under `tests/browser/__screenshots__/win32/chromium/phase11-access.browser.spec.ts/`
- `PROJECT_STATE.yaml`

Rollback boundary: discard or revert only the fresh repair candidate commit(s); `181480a` and every prior rejection record remain intact.

## Verification

Planned before implementation:

- `pnpm exec vitest run apps/web/src/components/owner/access/owner-access-view.test.tsx apps/web/src/hooks/use-owner-access.test.tsx`
- unique-run Chromium execution of `tests/browser/phase11-access.browser.spec.ts`
- `pnpm verify:fast`
- `FITWAY_PHASE=phase11-access pnpm verify:phase` with run `p11_access_ui_r02_phase`, port `43134`, and exact disposable database `fitway_integration_p11_access_ui_r02_phase`
- `pnpm verify:full` with a fresh run ID, port, and exact disposable database
- fresh Browser/Playwright review in Arabic RTL and English LTR at 320, 360, 390, 721, 768, 820, 1024, 1200, and 1440px; keyboard, focus, axe, reduced motion, forced colors, target size, 200% reflow, and overflow
- candidate freeze via the installed workflow's `candidate-freeze-check.mjs` plus repository checks

Not yet verified: implementation does not exist at activation.

## Remaining

1. Create the isolated repair worktree from the activation commit.
2. Execute the adopted plan with one writer.
3. Run coordinator parent gate, fresh verification/review, serialized baseline decision, integration, and terminal ledger update.

## Blockers

- None at activation. Paper and repository authority agree, dependencies are `DONE`, no shared-file edit is required, and the accepted repair budget has one final attempt remaining.

## Recommended next session if interrupted

Resume mode `execute`: open the activation handoff and route record, verify the branch/worktree starts at the activation commit and the lease is current, then implement only the five writer-editable files against the four frozen findings. Stop on any backend/schema/router/Paper need or authority conflict.
