# agent-environment-r01: Codex rounds as evaluations

One entry per round: the brief, brief rows passed, held-out rows passed, and the failure cause. The
held-out checks live outside the repository and never appear here or in a brief.

## Round 1: `briefs/codex-r1-resume-tooling.md`, result `3b91b9d`

- **Brief rows:** 7 of 7. O1-O6 pass (80 tests in 4 files). O7 passes with one pre-existing failure:
  `scripts/check-agent-context.test.ts:621` expects `owner-design-exploration-r01` in the live ledger, which it
  left before the base commit `ad49c8a`; the failure is unchanged from the baseline.
- **Held-out rows:** 9 of 10.
- **Failure cause:** `handoff:new` takes the repository root from `process.cwd()`
  (`scripts/agent-environment/new-handoff.mjs:131`), so it fails when started outside the root. The brief never
  said where it may be started; an unstated requirement, not a misread one.
- **Side findings:** the next actions omit `git add` although the checks reject an untracked handoff; ledger
  timestamps are written as UTC with milliseconds while the ledger uses local time with its offset.
- **Environment:** Codex could neither run Vitest (`spawn EPERM`) nor commit (`index.lock`); the coordinator
  committed and ran the tests. Fixed for later rounds by `DECISIONS.md` item 7.

## Round 2: `briefs/codex-r2-repair.md`, result `aa3d13f`

- **Brief rows:** 13 of 13 on the committed tree (R1-R6, O1-O7; 559 of 559 script tests). Codex reported R5 and
  O7 as failing: it ran the full suite before committing, and `scripts/check-frontier-preservation.mjs:993` switches
  to dirty mode on any non-empty `git status`, where the live test fails.
- **Held-out rows:** 9 of 9.
- **Failure cause:** none in the code. The brief asked for a full-suite run without saying the suite needs a clean
  tree; later briefs say so.
- **Side finding:** the repaired live-registry test compares the ledger's milestones with themselves
  (`scripts/check-agent-context.test.ts:621`); its real guard is `result.ok`.
- **Environment:** the first round in which Codex ran the tests and committed itself (full access).

## Round 3: `briefs/codex-r3-quiet-tooling.md`, result `3d80304`

- **Brief rows:** 4 of 6 as written; Q1, Q3 and Q6 pass, Q2 passes unchanged from the baseline. Two rows were the
  brief's errors (rule B7 broken by the coordinator): Q2 required `git ls-files -ci --exclude-standard` to be empty,
  but the local `.git/info/exclude` rule `.claude/` lists 70 tracked files before and after; Q5 required
  `pnpm biome check .` to pass, but `design-research/**` has 21 older errors. Q4 failed correctly: the brief asked for
  the repository's Node pin, and there is none; Codex stopped instead of guessing. CI moved to round 4.
- **Held-out rows:** 5 of 6 run (L4 not run, no workflow).
- **Failure cause:** L5. The two new checker-output tests in `scripts/verify-repository.schema.test.ts:437-471` each
  run a checker twice at about 11 s a run under Vitest's 20 s default, so they pass only on an idle machine.
- **Environment:** the first round under `--approve-for-me`; Codex escalated the commit and the test runs itself.

## Round 4: `briefs/codex-r4-brief-check.md`, result `d333762`

- **Brief rows:** 4 of 6 as written; B1-B4 pass (26 new tests). B5 failed on `pnpm biome check .`, the same brief
  error as round 3. B6's workflow is written, but the fresh-clone replay failed at checkout: ten tracked asset paths
  exceed Windows' path limit without `core.longpaths`.
- **Held-out rows:** 7 of 9. M7 failed on false positives the brief's B1 wording required: a bare backticked name
  (`app.js`, `INDEX.md`) resolves at the repository root, and a file the brief asks the agent to create fails as
  missing (or as drift). M9 failed on round 3's timing tests. With `core.longpaths` the CI replay passes steps 1-4.
- **Failure cause:** the brief did not define what counts as a path, and did not mark files to be created.
- **Side findings:** a lowercase `## coordinator checklist` passes; a brief that quotes the forbidden words to
  describe the rule fails.

## Round 5: `briefs/codex-r5-repair.md`, result `a7c9ecc`

- **Brief rows:** 5 of 5 (F1-F5). 601 of 601 script tests, also with two suites running at once; CI's five commands
  pass in a fresh clone with `core.longpaths`; the action tags `checkout@v6.1.0`, `setup-node@v7.0.0` and
  `action-setup@v6.1.0` exist.
- **Held-out rows:** 7 of 8; S6 partial. Of the day's real briefs, round 5's passes and nav-2's fails truly (written
  before the ` (new)` marker existed). nav-3's and the K-02 designer's fail falsely: the npm name `@playwright/test`,
  and `tools/` meant relative to the eclipse folder, are read as repository paths
  (`scripts/agent-environment/check-brief.mjs:79`).
- **Failure cause:** the brief's. F2 defined a path as any backticked token containing `/`, and Codex built exactly
  that; the definition did not foresee npm scope names or folder-relative paths.
- **Environment:** Codex hit its usage limit after committing and wrote no final report. The coordinator's Sonnet
  grader graded the round from the commit and the held-out checks.

## Round 6: `briefs/codex-r6-path-tokens.md`, result `dc8d2e0`

- **Brief rows:** 5 of 5 (P1-P5); 645 of 645 script tests, both checkers and Biome pass. A shared
  `scripts/agent-environment/path-reference.mjs` now classifies tokens for both tools. `brief:check` on the round's
  own brief fails after the commit by design: the commit changes non-Markdown files after the named HEAD.
- **Held-out rows:** 8 of 10; H4 partial, H7 failed. H7: both live resume points now fail, because each names an
  existing folder by absolute path with a trailing `/`, and `scripts/agent-environment/resume-point.mjs:94` requires an absolute path to
  be a file where the base code skipped absolute paths. H4: bare names on the two header lines are still checked as
  paths, which the brief asked for ("as they are now").
- **Failure cause:** the brief's (rule B7 broken by the coordinator). P4 told the tools that absolute paths are valid
  references, but no outcome required the live resume points to keep passing, and nothing said a reference may be a
  folder.
- **Side finding:** CI on `a7c9ecc` (run 37063118711) fails nine `check-brief` tests on the GitHub runner, whose TEMP
  is an 8.3 short path (`RUNNER~1`): the named worktree is compared with the long path Git returns. Moved to round 7.

## Round 7: `briefs/codex-r7-path-identity.md`, result `4d5d2f3`

- **Brief rows:** 2 of 2 (Q1, Q2). 666 script tests pass and one POSIX-only test is skipped, with TEMP both long and
  short; both checkers and Biome pass. Codex made a real 8.3 name with `fsutil file setshortname` and showed the
  suite failing with it first (56 failures).
- **Held-out rows:** 3 of 3. GitHub CI run 37069750244 on `4d5d2f3` passes every step, where run 37063118711 failed.
  The two live resume points pass. Existing folders pass as references (relative and absolute, with or without a
  trailing `/`) and missing ones fail.
- **Failure cause:** none.

## Round 8 and 8b: `briefs/codex-r8-acceptance-repairs.md` and `briefs/codex-r8b-resume-name.md`, results `c071d87` and `c99d07c`

- **Brief rows:** round 8, 4 of 5 (S2-S5); Codex stopped on S1 because the brief's rule could not tell a resume point
  from older `...-resume-activation.md` and `...-coordinator-resume.md` handoffs without guessing. Round 8b settled S1
  with the coordinator's rule (one name, `<YYYYMMDD-HHMMSS>-<milestone-id>-resume.md`): 1 of 1. 708 tests pass.
- **Held-out rows:** 6 of 7, J6 partial by the grader's literal reading: the two earlier briefs now report the round's
  commits as drift after their named HEAD, which is by design. CI run 37074516125 on `c99d07c` passes.
- **Failure cause:** round 8's S1 was the brief's (an ambiguous rule; Codex was right to stop). Both rounds' first
  launches stopped on the brief's own commit sitting on the named HEAD, before the launch note existed.
- **Side finding:** a file-name pattern that contains an exact template token, such as `<branch>-resume.md`, is
  rejected as a placeholder (`scripts/agent-environment/resume-point.mjs:25`).

## Evaluation C2 (agent-environment-r02): round 5 rerun with and without line C2, results `ece0794` and `ad51e1a`

- **Set-up:** line C2 of `brief-failure-causes.md`. Two blind Sonnet writers rewrote round 5's brief from the Codex
  template, one with C2 in the checklist and one without (`D:/fitway-temp/evals/c2/`); Codex ran each on `d333762`
  in its own worktree; one Sonnet grader graded both commits as X and Y without knowing which had the line.
- **Brief rows:** both arms report F1-F5 pass.
- **Held-out rows:** identical, 12 of 13 each; S6 partial in both, with the same two false failures as round 5 had:
  the npm name `@playwright/test` in nav-3's brief and the folder-relative `tools/` in the K-02 designer's brief are
  read as repository paths.
- **Failure cause:** the line, not the code. With C2 the writer defined "path" with real examples, but drew them from
  the files the round would act on; the boundary cases lived in the real briefs the checker would later read, which
  neither writer sampled. **C2 is not adopted.** Next hypothesis (C2b): test a rule against a sample of the real
  inputs it will judge (for a brief checker, the last real briefs) and list each one it would misclassify.

## Evaluation C2b (agent-environment-r02): the brief only, no Codex run

- **Set-up:** line C2b ("each rule an outcome states is tried on a sample of the real inputs it will judge, and the
  brief lists every sampled input the rule as written would misjudge, with where the boundary falls"), one blind
  Sonnet writer on round 5's draft at `d333762` (`D:/fitway-temp/evals/c2b/`).
- **Result:** the writer sampled 17 real briefs and templates and listed the misjudged inputs, `@playwright/test` from
  the builder template among them, with the boundary at the `/`. It then kept the draft's rule and wrote that such
  tokens "keep failing". Codex was not run: the brief itself requires the false S6 failure, so the held-out result
  is fixed by its text. The writer also dropped outcome F5 (a writer error, not the line's).
- **Failure cause:** the line finds the boundary but asks for no decision on it. Next hypothesis (C2c): every input
  the rule would misjudge gets a decision in the brief, the rule changed to cover it or a stated reason it stays.

## Evaluation C2c (agent-environment-r02): round 5 rerun with line C2c, result `66052a6` (level xhigh)

- **Set-up:** line C2c (C2b plus "every sampled input the rule as written would misjudge gets a decision in the
  brief: the rule changes to judge it right, or the brief says why it stays"), one blind Sonnet writer at `d333762`
  (`D:/fitway-temp/evals/c2c/`), Codex on its brief, one Sonnet grader. Control: C2's arm without a line (`ad51e1a`).
- **Brief rows:** 5 of 5 by Codex's report.
- **Held-out rows:** 12 of 13; S6 partial with one false failure where the control had two. The writer had decided
  that a token starting with `@` is a package name, so nav-3's `@playwright/test` now passes; the K-02 designer's
  folder-relative `tools/` still fails: that brief was not in the writer's sample. S4 passes with a caveat: the
  workflow sets `core.longpaths` through job-level `GIT_CONFIG_*` variables, unverified on a hosted runner.
- **Failure cause:** the line's reach, not the code: it decided what it sampled, and the sample missed a kind of
  input (folder-relative paths). By the rule set before the test (`brief-failure-causes.md`), C2c is **not adopted**;
  it is the best candidate so far. Next (C2d, lower priority): the sample spans every folder where that kind of input
  lives, not the ones nearest the task.
