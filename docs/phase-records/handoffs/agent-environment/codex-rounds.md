# agent-environment: Codex rounds as evaluations

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

## Evaluation C3 (agent-environment-r02): OW nav-1 rerun with and without line C3, results `0f669f0` and `9accd86` (level xhigh)

- **Set-up:** line C3 of `brief-failure-causes.md` in the Codex template's checklist (`D:/fitway-temp/evals/c3/`,
  templates named A and B so the writers could not tell them apart). Two blind Sonnet writers rewrote nav-1's brief
  from the read-only base `4b8a5ff`; Codex ran each in its own worktree (`eval-c3-with`, `eval-c3-without`); one
  Sonnet grader graded X (without) and Y (with) on nav-1's held-out rows K1-K7. The writers' own briefs fail
  `brief:check` on relative and to-be-created paths (the checker's known S6 kind); they ran as written.
- **What the line changed in the brief:** the writer with C3 added "no text kept twice" (no 40+ character line in both
  files), "what reads the folder still passes" (`node --check`, the spec lint's exact baseline) and "one commit, clean
  tree". Neither writer set a README length, and both kept `Open and capture` in the contract, as nav-1's brief did.
- **Brief rows:** all pass by Codex's report in both arms (N1-N6 without, N1-N8 with).
- **Held-out rows:** Y 7 of 7; X 6 of 7, K2 partial (one 40+ character line in both files; no whole paragraph). K6
  passes in both (README 655 and 639 lines against nav-1's 821), with no length in either brief: Codex cut deeper this
  time, so K6 does not discriminate.
- **Failure cause:** none in the code. By the rule set before the test, C3 is **adopted**: the arm with it clears K2
  and K6, the arm without it misses K2, and it adds no held-out failure. The margin is one line and one sample, and
  the line's "length or size caps" clause was not exercised. The grader also found Y's README keeps more round
  labels in headings ("(Round 7 step 2/3)"), which K3's sample does not catch.

## agent-environment-r03 round 2: `r03/briefs/round-2.md`, result `5848607` (level xhigh)

- **Set-up:** the brief's commit `82143f13` over HEAD `1756dc7e`. Held-out rows H1-H12 (24 sub-rows) ran from a
  coordinator script in a scratch clone of the result and of the coordinator's record cleanup on top of it (`1d4e99a`);
  the Sonnet grader first launched stopped on the Claude usage limit before grading.
- **Brief rows:** 7 of 7 (M1-M7). Confirmed: CI green on `5848607` and on `1d4e99a`; the scripts suite passes on the
  committed, clean tree (653 tests). The round deleted 5,496 lines and added 894.
- **Held-out rows:** 12 of 12 on behaviour. Three readings needed judgment: a `supersededBy` on a `DONE` record is
  rejected by the schema with Ajv's generic "must NOT be valid" naming the milestone, not the field (a diagnostics
  gap, not a wrong result); `fixtures.ts` keeps the old fields as test input; the README and the handoff template
  name `Previous resume point` and `evidence.receiptTemplate` only to say they are optional, which M7 allows.
- **Failure cause:** none in the code. Follow-up for a later round: report a misplaced `supersededBy` by the field's
  name.

## agent-environment-r03 round 3: `r03/briefs/round-3.md`, result `eb87d09` (level xhigh)

- **Set-up:** the brief's commit `97a2ecd` over HEAD `1d4e99a`. Held-out rows K1-K10 ran from a coordinator script in a
  scratch clone, on the result plus the coordinator's records fix (`aa6a847`); scope rows on the result itself.
- **Brief rows:** 2 of 3 as delivered. N2 and N3 pass. N1 fails: the repository check rejects two resume points
  that cite `scripts/check-frontier-preservation.test.ts`, which the round deleted; both were outside Codex's scope, and
  Codex stopped and reported them. After the coordinator's fix, N1 holds: CI green on `bbafa71`, the ladder in 5 min
  4 s of a 6 min 28 s job. The round deleted 7,750 lines and added 195.
- **Held-out rows:** 10 of 10 on behaviour. Three of the script's first readings were the grader's own faults, fixed
  and rerun: a `run:` key under `defaults` counted as a step; plants that Biome rejected before their step; the last
  `==>` line read as the failing step, though the mutation guard always runs last. A write into the repository is
  caught by the runner's own check, inside the unit-test step, before the final guard. `pnpm test -- <file>` loses
  its filter and runs every test, before and after the round alike.
- **Failure cause:** the brief. It named the files to delete but not the live records that cite them; the checklist
  line on live artifacts now names that search. Follow-up for a later round: strip a standalone `--` in
  `scripts/run-vitest.mjs`, so `pnpm test -- <file>` keeps its filter.

## agent-environment-r03 round 4: `r03/briefs/round-4.md`, result `7c7a768` (level xhigh)

- **Set-up:** the brief's commit `10ba2815` over HEAD `82c34b0e`. The run stopped once when the app that launched it
  exited and twice on usage limits; each time it resumed on its thread. Held-out rows P1-P21: P1 by a fresh Sonnet
  agent that read only the skill; P2-P19 and P21 by two Sonnet graders in scratch clones; P20 from CI.
- **Brief rows, as Codex graded them:** 6 of 8. V1 and V4-V8 pass. V2 fails: the English phone tuner's «الإضاءة»
  toggle sits outside the viewport, so no tap reaches it (a concept defect the CLI found), and the probe kit's Daily
  geometry probe throws while loading. V3 fails: the features come from about 630 lines of recipes kept in the CLI,
  not from the concept's code. CI green on `7c7a768`; the ladder runs the map drift check and the CLI's tests. The
  round added 3,032 lines.
- **Held-out rows:** 17 of 20 graded pass; P20 passes on the CI listing (no plant run). P9 is partial: a new switch, a
  removed switch and a renamed selector fail with file and line, but a new dialog fails only as "source changed". P10
  fails: the doctor names a stale map without the command that fixes it. P14 fails: a foreign server bound to all
  addresses on the CLI's port goes unnoticed (LAUNCH PASS beside it, then a failed cleanup). P1 did both tasks with CLI
  calls only; Activity's long-name case needed a second try, because `case=long` takes effect only with `record=` and
  the first frame passed without showing it.
- **Failure cause:** brief and code. V3 asked for features generated from code, which cannot tell how a user reaches a
  feature or what proves it, so it was not literally reachable as written (B8). The code misses a wildcard listener,
  never checks that a frame shows the state it asked for, and resolves Playwright only from the concept's own checkout,
  so a baseline extracted with `git archive` cannot be driven. Round 6 takes all of them.

## agent-environment-r03 round 5: `r03/briefs/round-5.md`, result `34f472e` (level high)

- **Set-up:** the brief's commit `e6820ba8` over HEAD `7c7a768f`. Held-out rows Q1-Q10: Q1 and Q2 by a real launch and
  resume of a one-line brief in a scratch clone, Q3-Q10 by a Sonnet grader with a stand-in `codex`.
- **Brief rows:** 5 of 5 (21 tests).
- **Held-out rows:** 10 of 10. The launch note names the full HEAD sha, as the agreements write it (`<sha>`; the row's
  "short" was the coordinator's). The real launch printed the thread id and Codex committed; the real resume kept the
  thread and left the first event file byte-identical.
- **Failure cause:** the code, outside the rows. One of its tests starts whichever `bash` comes first on PATH, the WSL
  launcher on this machine, so it fails from PowerShell (1 of 21) while it passes in Git Bash. Resume re-sent the whole
  brief. Round 5b fixes both.

## agent-environment-r03 round 5b: `r03/briefs/round-5b.md`, result `a40ba39` (level high)

- **Set-up:** launched with round 5's own command, the brief's commit `d454ce04` over HEAD `34f472e4`.
- **Brief rows:** 3 of 3 (28 tests, from PowerShell and Git Bash).
- **Held-out rows:** 4 of 5. R1: 28 tests pass from PowerShell here, where `bash` is the WSL launcher. R2: a real
  resume with a one-line Arabic message reached the thread, which did the extra task it asked for; the earlier event
  files stayed byte-identical. R3: by the tests. R5: two files. R4 fails: CI on `a40ba39` fails the new test that puts
  a stand-in `bash` first on PATH, because the runner names its TEMP folder by its 8.3 short form
  (`C:\Users\RUNNER~1\...`) and `where` returns the long form, which the test compares as text.
- **Failure cause:** the code (its own test), on a condition neither the brief nor a local run showed. Round 5c is the
  first focused repair (AGENTS.md).

## Evaluation B8 and B9 (agent-environment-r03): card-1 and touch-1 rerun with and without the fields (level high)

- **Set-up:** the Codex template with two outcome fields, "Intent" (B8: what the outcome is for; an allowance names
  its bound; literally reachable) and "Widest" (B9: the widest value it must hold, measured on the baseline), against
  the template without B8 and B9; arms named x and y, the key kept outside the eval folder. Four blind Sonnet writers
  rewrote card-1's and touch-1's briefs from `bd8bada` with the DECISIONS of the time; Codex ran each brief in its own
  clone holding only `bd8bada`'s history; two blind Sonnet graders graded X and Y on the rounds' held-out rows plus
  one target row each, set with the adoption rule before any writer returned. Every run stopped once on a usage limit
  and resumed on its thread.
- **What the fields changed in the briefs:** the touch-1 writer with them bounded the trail ("at most 4 stops ... on
  the finger's stop within 700 ms of the last report") and wrote "Widest: 40 stops"; the writer without them kept "It
  may trail the finger". Both card-1 writers named the data's own hour as the widest value, and both wrote that a
  range across noon or midnight cannot occur.
- **Held-out rows, card-1 (target: the widest hour):** identical. Both pass H1 and H3-H8 and fail H2 and H10: a range
  across noon keeps the short form («11 ص – 12 م»), and in English at 320 the hours overlap the average by 24.6 px.
- **Held-out rows, touch-1 (target: a bounded trail):** the arm with the fields passes H10 (on the finger's stop 1-21 ms
  after a 1000 px/s drag); the arm without them fails it (22 and 27 stops behind, no catch-up), as the original round
  did. H3 as worded (one change per touchmove) fails the arm with them and passes the other, but H3 and H10 cannot
  both hold for a fast drag; by its intent (no leap: every change is to the next stop) both pass. The arm without the
  fields also changed a file outside its scope (`.impeccable/config.json`) and left MOT-11 stale; the arm with them
  stops the top slide when a drag starts during it, leaving the band above the screen. Codex's own T1 failed in the
  arm with the fields on exact zoom equality without a noise floor.
- **Decision (the rule set before grading):** only touch-1 discriminates, so "Intent" is adopted as a field of the
  template's outcome line and "Widest" is recorded as not shown. One sample per round; the held-out H3 was itself in
  conflict with the target, a fault of the rows, not of either arm. Two lines sharpen on classes now seen twice: B9
  names the widest value the code can produce, not the widest the current data shows (card-1, then both writers here);
  B8 asks an equality measured in emulation for its noise floor (three-rounds-fix F2, then T1 here).
