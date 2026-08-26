# Focus-parity accessibility — fresh repair attempt 1 activation

## Completed

- Reconciled the preserved candidate `a7f517ae743f7679e251b2e8f8a35c4da0388745`, the original
  independent-review rejection, and the terminal exceptional-r03 evidence.
- Adopted the recorded r03 next-session plan as the executable plan for run
  `p11_focus_parity_r04`; no completed discovery is being repeated.

## Exact current state

- Coordinator line: `codex/focus-parity-r04` at parent `4ca60ca048045940b91b87c4d41053bddd9de3b5`
  in `D:/Projects/fitway-worktrees/phase11-focus-parity-r04-coordinator`.
- Repair line: `codex/phase11-focus-parity-r04` at preserved candidate
  `a7f517ae743f7679e251b2e8f8a35c4da0388745` in
  `D:/Projects/fitway-worktrees/phase11-focus-parity-r04`.
- Status: `IN_PROGRESS`. Historical `validationRepairAttempts` remains saturated at `2`; the user
  authorized two fresh attempts beyond that exhausted budget, with `0/2` newly consumed at
  activation. Attempt 1 is active; attempt 2 is held unless attempt 1 reaches a genuine repairable
  workflow failure.

## Decisions

- Human, 2026-08-26: authorized two fresh focused repairs beyond prior terminal history; required
  native routes only, preservation of discriminating `.operations-shell` coverage, no Paper or
  scope broadening, full verification/review/integration closeout, and stop at acceptance,
  exhaustion, or a human-only blocker.
- Coordinator: attempt 1 may edit only `tests/browser/phase4-staff-web.browser.spec.ts` plus this
  slice's durable records. It must assert the real `.operations-shell` forced-colors behavior by
  computed outline style and minimum width. It must not assert exact `outline-offset`, because r03
  measured Chromium normalizing the authored `2px` offset to `0px` while retaining `solid` and
  `2px` width.
- Coordinator: direct native execution is selected before target discovery because the preserved
  plan names one deterministic test seam and one rollback commit. Independent review qualifies on
  independence and will use a fresh native reviewer; OpenCode/external-worker routes are excluded
  by explicit human instruction and are not considered or preflighted.

## Remaining

1. Add the test-only `.operations-shell` probe and obtain selector-absent red plus restored-selector
   green on the exact three-spec Chromium gate.
2. Write candidate evidence, run `pnpm verify:fast`, repository/type/format/range/image/freeze
   checks, and freeze one repair commit.
3. Obtain a fresh native independent review with its own readiness, focused-browser, fast-ladder,
   scope, non-vacuity, and clean-tree evidence.
4. If PASS, integrate serially, run post-integration focused/fast/full gates, record `DONE`, and
   release ownership. If a genuine repairable gate fails, consume attempt 1 and activate attempt 2;
   otherwise stop at the required terminal state.

## Blockers

None at activation. No product, security, privacy, content, accessibility-policy, or visual-source
decision is open.

## Verification

- Read-only preactivation evidence: candidate and prior coordinator worktrees were clean; preserved
  candidate HEAD was exact `a7f517a`; r03 selector-absent proof produced `outline-style: none`, and
  restored production behavior produced `outline-style: solid`, `outline-width: 2px`, and
  browser-normalized `outline-offset: 0px`.
- Executable checks have not yet run for r04.

## Recommended next session

If this session stops before writing, resume `execute` mode on `codex/phase11-focus-parity-r04`.
Edit only the existing Phase 4 browser spec and slice records; require selector-absent red and
selector-present green using computed solid outline plus minimum `2px` width, then run the recorded
candidate and independent native review gates. Do not load or invoke external-worker routes.
