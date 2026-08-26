# Focus-parity accessibility — fresh repair attempt 1 candidate

## Completed

- Added one test-only `.operations-shell` forced-colors probe to the existing Phase 4 browser
  accessibility test.
- Preserved the production selector and asserted the focused probe's computed outline style is
  `solid` and its width is at least `2px`; no exact `outline-offset` assertion was added.
- Proved non-vacuity by temporarily removing only the production `.operations-shell` selectors,
  observing the new assertion fail for expected `solid` versus received `none`, then restoring the
  stylesheet exactly and passing the fixed three-spec Chromium gate `24/24`.

## Exact current state

- Candidate branch/worktree: `codex/phase11-focus-parity-r04` in
  `D:/Projects/fitway-worktrees/phase11-focus-parity-r04`. Candidate commit is `SELF`, with preserved
  candidate `a7f517ae743f7679e251b2e8f8a35c4da0388745` as its parent.
- The only source change in `SELF` is `tests/browser/phase4-staff-web.browser.spec.ts`; this record is
  the only new durable file. Production CSS, routes, Paper, configuration, and canonical screenshots
  are unchanged. The final freeze runs only after `SELF` is committed and the worktree is clean.
- Newly authorized repair attempts consumed: `0/2`. The writing stage has not been submitted to a
  gate yet, so a freeze-check correction would remain part of attempt 1 preparation.

## Decisions

- Human: retain discriminating coverage and account for r03's measured Chromium normalization of
  authored `outline-offset: 2px` to computed `0px`.
- Coordinator: style `solid` plus width `>=2px` is the discriminating boundary already measured in
  r03. The selector-absent red proof establishes that removing the relevant production behavior
  fails for the intended reason; weakening the assertion after a gate failure is not permitted.
- Coordinator: all production behavior is frozen. This repair adds only regression proof for the
  already accepted production selector.

## Remaining

1. Run the final candidate-freeze check after this record revision, including a fresh focused browser
   run and repeated fast ladder, then freeze one repair commit.
2. Submit the commit to a fresh native read-only reviewer.
3. On independent PASS, integrate serially and run the post-integration focused/fast/full gates.

## Blockers

None. Native Playwright `1.61.1` and Vitest `4.1.10` readiness passed after frozen-lockfile install.

## Verification

- Disposable red proof at the uncommitted candidate state: run `p11_focus_parity_r04_red`, port
  `43401`; the selected Phase 4 test failed at the new assertion with expected `solid`, received
  `none`. Artifacts: `output/playwright/p11_focus_parity_r04_red`.
- Restored-selector focused gate at the uncommitted candidate state: run
  `p11_focus_parity_r04_green`, port `43402`; the exact three-spec Chromium command passed `24/24`.
  Artifacts: `output/playwright/p11_focus_parity_r04_green`.
- `pnpm verify:fast` with complete synthetic process-local environment and run
  `p11_focus_parity_r04_fast` passed: repository invariants, Biome, all workspace type checks,
  `514/514` unit tests, `117/117` Python simulator tests, and the repository mutation guard.
- Repeated candidate checks passed: `pnpm check:repository` (`53` milestones, `8` canonical approval
  screenshots); `pnpm check` (`376` files, no fixes); `pnpm check-types`; `git diff --check`;
  exact owned scope; and an empty canonical-screenshot diff.
- A pre-commit freeze invocation reran the focused browser and fast ladders successfully but returned
  `frozen: false` solely because its clean-worktree check correctly saw the two intended uncommitted
  candidate files. This is a writing-stage sequencing correction, not a submitted gate outcome.
- Pending at this final record revision: the last candidate-freeze invocation, which will repeat the
  focused browser and fast ladders against committed `SELF` with a clean worktree.

## Recommended next session

If interrupted before freeze, resume `execute` mode on this exact working tree. Run only the pending
candidate checks, update this record with exact results, freeze one commit, and obtain a fresh native
read-only review. Do not edit production CSS, alter Paper, load external-worker routes, or activate
attempt 2 unless attempt 1 reaches a genuine repairable workflow failure.
