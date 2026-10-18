<!-- handoff-format: resume-point-v1 -->
# agent-tooling-r01: resume point

- **As of:** `codex/owner-redesign-r04` at `9f134a3d`, 2026-10-18 13:36 +03:00
- **Standing decisions:** `docs/phase-records/handoffs/agent-tooling/DECISIONS.md` (items 1-13), `docs/agent-context/WORKING_AGREEMENTS.md`

## State

- Opened by the coordinator on 2026-10-16 under r04's decision 73 (DECISIONS item 1, `c286c4c9`). The tool paths r04
  held moved here (F253); the packet is `docs/phase-records/task-packets/agent-tooling-r01.yaml`.
- The coordinator of owner-design-exploration-r04 coordinates this milestone too, from the r04 worktree, where the
  ledger lives; this milestone's branch `agent-tooling-r01` is the integration branch for its rounds and merges into
  the coordinator line, then main through `pnpm main:advance`.
- From 2026-10-16 every brief has two reviews, DeepSeek (the launcher) and GPT-6.1 Sol `xhigh` in `<review folder>-sol`
  (r04 decision 66's rule applied, `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`
  §"Evaluation: both reviewers, decision 66's rule applied"), and every result a Sol diff review
  (`docs/agent-context/briefs/CODE_REVIEW.md`) whose blocking findings a mechanical fixer applies before the grade.
- **The first wave is integrated and on main.** `agent-tooling-r01` holds the code map (`e080324d`) and
  launcher-fixes-6 (`18c670fc`), merged at `cd1001ed` with the map regenerated (48 files, 618 callables, 488 without a
  covering test; CI passed); the coordinator line merged it at `fcc8365b`, and `pnpm main:advance` moved main from
  `3cde7a07` to `fcc8365b`. The coordinator's launcher now carries the fixes of F255, F257 and F258 (marked fixed in
  `findings.tsv`): a new milestone's first resume point,
  graders exempt from the claim check (grading briefs no longer need the no-SHA workaround), commands read as a shell
  reads them (quotes, escapes and comments in one scanning loop), and a commit found on any line. F256 (the events carry
  no working directory) stays open.
- **Grades of the wave** (records in the run folders): code-map's last Sol grade
  D:/fitway-temp/codex-round-56a3b941-033d-43b0-946c-6878da89f738 (14 PASS; G10 and G15 the grading brief's wording, the
  coordinator reproduced the committed N cases failing at their assertions); launcher's last Sol grade
  D:/fitway-temp/codex-round-2a25aa90-95dc-4236-9cb0-f00491e17389 (14 PASS; G9 the grading brief's wording on a table
  merge; the coordinator reproduced G13, quote state only in `shellScan`). Readings left open across the wave wait for
  the CLI contract's report fields (a claimed commit, a brief role, structured rows).
- **Data for the ratchet (measured 2026-10-16).** The day's 9 Sol diff reviews (D:/fitway-temp/code-review/) gave 30
  blocking findings: D1 duplicated code 14, D7 a second path 4, D3 dead code 4, D2 speculative generality 3, D5 growth
  out of proportion 3, D4 and D6 one each; 18 of 30 (60%) are duplication or a second path, which a check can catch
  before any review. Examples: the focus ring copied ten times in `components.css`, two shell tokenizers, two
  import-binding readers.

## Running now

- **The test split, then base-run** (side session "giant-split", measured
  2026-10-18 11:30): base-run (DECISIONS item 13, P-A: `pnpm tests:base-run` classifies a round's added or changed
  tests run against the base's code as assertion, missing-module, wrong-reason or green-on-base) is in its DeepSeek
  round's replay step; the session then splits `scripts/agent-environment/codex-round.test.ts` (1,415 s of the 27-28 min
  CI ladder, run 39107745366: its 262 cases run one after another in one file) and the other giant tooling test files so
  Vitest runs them in parallel, measured by the CI ladder's wall time before and after; then base-run's review, fixes
  and grade. Report files: `D:/fitway-temp/tooling-base-run/REPORT.md` and the test split's own.
- **ratchet-2** (side session "ratchet-codelines"): stopped on a Claude
  session limit until 13:10 on 2026-10-18 (inferred from its error); its causes: longFunctionLines (non-test files),
  emptyBlocks, Biome warnings fail the ladder with `noSkippedTests`, `noUnusedExpressions` and `noNonNullAssertion` at
  error, a per-test-file floor of cases and expects, the timeouts (F261, F281, F282; one setting replacing 580ba805's
  per-file line), F284, split instructions in every giant-file failure and a lefthook pre-commit job on staged files
  (the user's addition through a side session); each replayed on the 18 pairs of
  `D:/fitway-temp/review-recurrence/REPORT.md`. Finding IDs F286-F289; base-run and the test split take F290 onward
  after F294. Its report: `D:/fitway-temp/tooling-ratchet-2/REPORT.md`. Resume it with a message once its limit resets.

## Next steps

1. **Integrated on 2026-10-18 (measured):** ratchet-codelines (`4476c766`, F269, F272; records `527456a4`), the
   giant-file split (`2b295008` through the integration merge `bd6ed12d`: six source files into modules; `compare.mjs`
   kept, F293; records `9f134a3d`, F290-F294); main at `10fe1783` (CI run 39110319014); the line at `9f134a3d` waits for
   its CI run 39119869580, then `pnpm main:advance`.
2. **DECISIONS item 13** (the user's freedom for measured preventions): after ratchet-2 and base-run, the launcher
   runs the fast ladder itself after accepting a commit claim and calls base-run (F256's ladder half, F279), and the
   brief template gains the reuse line, the D1-D8 pointer, a `Forms:` list with a `brief:check` presence rule, and
   what a new check does when its input is missing. Track blocking findings per diff review by class in
   `codex-rounds.md`; the baseline is the recurrence report's 74 findings over 19 reviews.
3. **Five dated `giantFiles` exceptions until 2026-11-15** (`compare.mjs`, `cli.test.mjs`, `check-brief.test.ts`,
   `check-agent-context.test.ts`, `verify-repository.schema.test.ts`): an exception zeroes the measure (F290); the test
   split retires four of them. `compareOwned` may be rewritten if it improves it (the user, recorded in `35519230`), its
   behaviour proved unchanged by tests (F293).
4. **Briefs keep "room is made by moving code out"** while any giant file remains (item 10).
5. **Left for later:** the lighter pickup; F264 with the next verify-fitway round; F273-F276 (CLI contract leftovers);
   a near-clone measure only after a hand-judged sample (item 13).

## Waiting on the user

Nothing.

## Known risks

- **CI takes 27-28 min** on Windows (the job limit is 45 min since `10fe1783`; runs 39104738645 and 39108328967 failed
  at the old 30 min and on F282), until the test split lands; a push cancels the branch's running CI run (the workflow's
  concurrency group), so batch pushes while waiting on a run `main:advance` needs.
- **Side sessions stop on Claude session limits** (both did on 2026-10-18); a session that stops is resumed with a
  message after its reset, and its last commit and report are checked first.
- The risks in r04's resume point apply here too: DeepSeek reports can claim steps that never ran (check the commit
  and ladder against the events), grading briefs name the round's brief by its absolute coordinator path, timed work
  needs a quiet machine (B13), and node_modules junctions are unlinked before `git worktree remove`.
- A busy machine fails the local fast ladder on `scripts/check-agent-context.test.ts` K1, at its 20 s timeout (F261);
  CI on the same commit decides.
- Sol reviews run with `codex exec ... - < prompt.md` from Bash: PowerShell 5.1 pipes the prompt as ASCII. Three Sol
  accounts take turns: on 2026-10-16/17 hhmam1435, ryshyjhad85 and smhsdxsz5h each reached a limit; hhmam1435 is
  limited until 05:17 on 2026-10-17, ryshyjhad85 current since 02:57; `node D:/fitway-temp/codex-accounts.mjs list` shows
  them, and `D:/fitway-temp/resume-auto.sh <run> D:/fitway-temp/resume-after-limit.md limit-first` switches and resumes.
- Never commit in a worktree where a fixer may still be running: a commit during its ladder trips the mutation guard
  (2026-10-17, F263's second commit).
- A fresh `git clone` of this repository on drive D needs `-c core.longpaths=true`: without it the checkout stops on
  `visual-direction-gate/` evidence paths ("Filename too long", measured 2026-10-17); grading briefs that ask for a
  clone should say so.
- Never pipe `pnpm codex:round` through `head`: a closed pipe can stop the launcher; write its output to a log file.

## Pointers

- Worktree: D:/Projects/fitway-worktrees/agent-tooling-r01, branch agent-tooling-r01, expected HEAD the commit that
  last changed this text on the coordinator line.
- Coordinator: D:/Projects/fitway-worktrees/owner-design-exploration-r04, branch codex/owner-redesign-r04.
- Codex evaluations: `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`.
