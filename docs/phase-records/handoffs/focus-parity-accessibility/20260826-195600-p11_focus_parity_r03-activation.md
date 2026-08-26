# Focus-parity accessibility — exceptional repair activation

- Status: `IN_PROGRESS`; run `p11_focus_parity_r03`.
- Frozen candidate: `a7f517ae743f7679e251b2e8f8a35c4da0388745` on
  `work/phase11-focus-parity-b01` in
  `D:/Projects/fitway-worktrees/phase11-focus-parity-b01`.
- Coordinator: `ced3949485f976fb6ffecfe2be6b708068592305` on
  `codex/remaining-scope-coordinator` before this activation.

## Human authorization and terminal-history preservation

The user explicitly authorizes exactly one fresh repair beyond the already exhausted `2/2` repair
budget, and directs the session to resume from the preserved frozen candidate and recorded evidence.
This is the affirmative authority required to reopen the terminal item. The schema-bounded
`validationRepairAttempts` value remains saturated at `2`; this activation record is the durable
exception. Any red focused, verification, review, or integration gate ends this run at its required
terminal outcome. The prior `FAILED_VALIDATION` handoff and review record remain unchanged.

## Frozen objective and scope

Repair only the confirmed independent-review defect: add a discriminating browser assertion for the
real stylesheet behavior selected by `.operations-shell` under `forced-colors: active`. The proof
must fail if the `.operations-shell` selector is removed and must inspect a focused interactive
target's computed outline style and width. It belongs in the already-owned
`tests/browser/phase4-staff-web.browser.spec.ts`; all three CSS files and the other browser specs stay
frozen.

The test may add a run-local DOM probe carrying the production `.operations-shell` class to the
existing `/login` browser harness so it exercises the shipped stylesheet without changing routes,
components, Paper, configuration, product behavior, canonical screenshots, or application source.
This is test-only non-vacuity coverage; it does not claim the currently unmounted legacy
`StaffShell` component is route-reachable.

Rollback is one repair commit atop `a7f517a`. Reverting that commit restores the exact preserved
candidate. Writable records are limited to this slice's handoffs, verification evidence, and native
route decisions; `PROJECT_STATE.yaml` remains coordinator-only.

## Fixed gates

1. Confirm `pnpm exec vitest --version` and `pnpm exec playwright --version` before executable work.
2. Establish the new operations-shell assertion red with the production selector temporarily absent
   from a disposable working-tree state, restore it, then obtain green on the exact three-spec
   Chromium command with a fresh run ID, port, and output.
3. Run `pnpm verify:fast`, repository, formatter, types, range whitespace, canonical-image diff, and
   candidate-freeze checks after the candidate record is written.
4. Freeze one repair commit and submit it to a fresh native read-only reviewer. The reviewer must
   pass its own Playwright/Vitest readiness check before the browser command, inspect the full
   `c04e7a9..candidate` range, rerun the focused browser and fast ladders, and return `PASS` or
   `FAILED_VALIDATION` without repair.
5. Only a fresh-review `PASS` permits coordinator integration, post-integration focused/fast checks,
   durable `DONE`, and lease release.

## Route and authority

Repair execution is direct native Codex. No delegation trigger applies to the single already-frozen
test seam, and a worker handoff would cost more than the edit. Independent review qualifies on
independence and will use a fresh native reviewer. Per the user's explicit instruction, OpenCode and
all external-worker routes are outside the applicable route set and are not considered, loaded,
preflighted, or invoked. No product, security, privacy, content, Paper, or visual-direction decision
is made.
