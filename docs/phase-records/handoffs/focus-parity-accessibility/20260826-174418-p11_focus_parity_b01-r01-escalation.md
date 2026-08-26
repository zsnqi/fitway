# Focus-parity accessibility — repair 1 escalation

## Completed

- Applied the deterministic fresh `/login` navigation after the new pointer-plus-programmatic skip-link proof in `tests/browser/phase4-staff-web.browser.spec.ts`, before the pre-existing keyboard-order sequence.
- Ran the required three-spec Chromium command once with a fresh run identity and isolated port/output.
- Reverted an accidental edit to an earlier, unrelated public-spec reload immediately; no change remains at that location.

## Exact current state

- Status: `ESCALATION`; repair 1 of 2 ended at its required first post-repair red focused run.
- Branch/worktree/HEAD: `work/phase11-focus-parity-b01` / `D:/Projects/fitway-worktrees/phase11-focus-parity-b01` / `c04e7a9f892bd921d8aa2d81608a8a611e969512`.
- The tree is intentionally dirty and has no candidate commit. Tracked implementation changes remain limited to the original three CSS files and three allowed browser specs. The prior worker escalation record and this record are the only durable handoff paths.
- The public programmatic-focus proof still precedes the original `page.reload()` and first-Tab assertion; the intended public fresh-navigation correction was not persisted because the focused run was red and this worker must not perform repair 2.

## Decisions

- Human activation contract: stop after any red post-repair focused run; do not attempt repair 2 in this worker.
- Repair worker: preserve every original keyboard assertion and do not manually focus the skip link to manufacture the sequential Tab origin.
- Repair worker: retain the frozen CSS candidate unchanged; no product, visual, route, configuration, or screenshot decision was made.

## Remaining

1. A fresh repair-2 worker must address only the remaining public sequential-focus reset at the existing `/` navigation seam, then use a new run ID/port/output for the complete focused suite.
2. Only after that focused gate passes may a worker run the fast/repository/formatter/type/freeze ladder, write a candidate record, commit the candidate, and request fresh independent read-only review.

## Blockers

- The focused Chromium gate is red: the public spec's pre-existing first-Tab assertion at `tests/browser/public-baseline.browser.spec.ts:522` remained inactive after the reload-based reset. This contractually blocks repair 1 from further implementation or verification.

## Verification

- `FITWAY_RUN_ID=p11_focus_parity_b01_r01`, `FITWAY_PLAYWRIGHT_PORT=43217`, run-local `output/playwright/p11_focus_parity_b01_r01`:
  `pnpm exec playwright test tests/browser/public-baseline.browser.spec.ts tests/browser/phase4-staff-web.browser.spec.ts tests/browser/phase11-shell.browser.spec.ts --project=chromium`
  — RED: 24 tests total, 23 passed, 1 failed. The only failure was public baseline line 522, `expect(skipLink).toBeFocused()` after the original reload-reset plus `Tab`; phase 4 staff was 11/11 and phase 11 shell was 5/5.
- Canonical screenshot status: unchanged; no canonical screenshot path appeared in status/diff.
- `git diff --check` passed before this record was written. Candidate freeze, `pnpm verify:fast`, `pnpm check:repository`, formatter/type checks, and a candidate commit were not run because the required focused gate is red and no candidate may be submitted.

## Recommended next session

`execute` mode: work only in `D:/Projects/fitway-worktrees/phase11-focus-parity-b01` on repair 2 of the focus-parity candidate. Read the activation plan, target map, both escalation handoffs, and full diff. Modify only the allowed public/staff/phase11 browser specs if necessary plus one new handoff; keep all CSS frozen. Preserve every assertion and keyboard-order proof. Correct the public sequential-focus reset through the existing `/` route navigation seam without manually focusing the skip link, run the exact three-spec Chromium command once with a new isolated run ID/port/output, and stop/escalate on any red result. If green, complete only the prescribed candidate verification and freeze protocol, commit one candidate beyond `c04e7a9`, then request fresh independent read-only review.
