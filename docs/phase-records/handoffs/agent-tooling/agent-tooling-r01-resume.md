<!-- handoff-format: resume-point-v1 -->
# agent-tooling-r01: resume point

- **As of:** `codex/owner-redesign-r04` at `0df775e5`, 2026-10-18 23:17 +03:00
- **Standing decisions:** `docs/phase-records/handoffs/agent-tooling/DECISIONS.md` (items 1-14), `docs/agent-context/WORKING_AGREEMENTS.md`

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

- **loading-check runs** (the user, 2026-10-24: r04 decision 82's check now, beside Settings, gating nothing):
  brief `docs/phase-records/handoffs/agent-tooling/briefs/codex-loading-check.md` (`0f19c6d6`), DeepSeek `max`, worktree
  `D:/Projects/fitway-worktrees/tooling-loading-check` (branch `tooling-loading-check` from the coordinator line at
  `f721ccd4`, its own install), run folder `D:/fitway-temp/codex-round-loading-check`, thread
  `01a16f8e-2522-7c60-b548-a9aa67d98e0d`. Reviews: DeepSeek `D:/fitway-temp/brief-review/codex-loading-check-3` (5
  closed) and Sol `...-3-sol` (3 closed, reading 3 left open: decision 82 compares boxes, not nodes). The port part
  the user approved was dropped: F183 was the tests' ports and is fixed; the verifiers' 3191 came from the
  coordinator's briefs, not the allocation. **Delivered `9fc29e91`, graded** (Opus verifier,
  `D:/fitway-temp/tooling-loading-check-grade/`, measured): 54 lines, 28 PASS / 26 FAIL in 156 s reproduce; the grader's
  own plants all behave; the four out-of-scope files tighten or are needed (the registry), none loosens. Defects:
  shifts under 0.0001 pass (`loading-browser.mjs:337`), Daily's Error is not named Error (:132-140), only the largest
  movement is kept, Activity's slot groups exempt added boxes, case and language are echoed not read back. Real page
  findings: Settings 390 AR «فأكثر» wraps (13 px), Reports' table columns at 768 and a 390 row, Access `case=long`
  rows, Activity's first day heading (36 → 46 px); Activity's 1730 px and Reports' 1440 title are artifacts.
  Not merged. CI on the coordinator line also fails `check:verification-map`: 11 Settings dialogs, menus and openers
  have no recipe (since Settings' dialogs landed on the build branch); the user decides when recipes are added.
- Before it: nothing ran (measured 2026-10-18 23:20). Item 14's before-the-demo work is done: ratchet-2 is merged into the
  coordinator line (`504d6572`, CI 39160024759; grade 11/14 with the three FAILs repaired by the coordinator;
  `longFunctionLines` kept, to be reviewed after the demo; `codex-rounds.md` §"ratchet-2"; F286-F289), and the brief
  template's lines are in `docs/agent-context/briefs/codex.md` (`b9e46dd1`).
- **base-run waits until after the demo** (item 14): edits uncommitted on disk in
  `D:/Projects/fitway-worktrees/tooling-base-run` over `c0e12373` (pushed); its session stopped without a stop note, so
  diff them against its review dispositions before any commit.
- The ratchet-2 worktrees (`tooling-ratchet-2`, `records-ratchet-2`, the grading checkout
  `D:/fitway-temp/tooling-ratchet-2-grade/wt`) are no longer needed; unlink any node_modules junction before removing them.

## Next steps

1. **main is at `9f134a3d`** (CI run 39119869580); the coordinator line carries ratchet-2 and its records, for
   `pnpm main:advance` once a pushed coordinator commit's CI passes.
2. This milestone's work waits for the demo (item 14's list).
3. **Five dated `giantFiles` exceptions until 2026-11-15** (`compare.mjs`, `cli.test.mjs`, `check-brief.test.ts`,
   `check-agent-context.test.ts`, `verify-repository.schema.test.ts`; F290): renew or retire them before that date,
   since the test split now waits for the demo.
4. **Briefs keep "room is made by moving code out"** while any giant file remains (item 10).

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
