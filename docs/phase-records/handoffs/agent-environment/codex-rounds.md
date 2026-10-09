# agent-environment: Codex rounds as evaluations

One entry per round: the brief, brief rows passed, held-out rows passed, and the failure cause. The
held-out checks live outside the repository and never appear here or in a brief. `rounds.tsv` and
`findings.tsv` beside this file hold one line per round and per side finding, for this file and the Owner
`docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md` (DECISIONS item 21).

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

## agent-environment-r03 round 5c: `r03/briefs/round-5c.md`, result `b80c3ad` (level high)

- **Set-up:** the first focused repair of CI's failure on `a40ba39` (AGENTS.md), launched with `pnpm codex:round`.
- **Brief rows:** 1 of 1: the test file passes with TEMP in its 8.3 short form and its long form, from both shells
  (drive D has no 8.3 names; the short form came from drive C), and the fast ladder passes.
- **Held-out rows:** CI green on `76caf6c` (the result plus the coordinator's records).
- **Failure cause:** none.

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

## agent-environment-r03 round 6: `r03/briefs/round-6.md`, result `8e520995` (level xhigh)

- **Set-up:** the brief's commit `cd95a508` over HEAD `76caf6c3`, launched on HEAD `2bb94d24` (round 5c's record came
  between). Held-out rows T1-T10: T1-T4 and T5-T8 by two Sonnet graders, one after the other because the CLI owns two
  ports, in a disposable worktree at `8e520995` with plants in copies of the concept; T9 by a fresh Sonnet agent that
  read only the skill; T10 by the coordinator from the diff and CI.
- **Brief rows, as Codex graded them:** 5 of 7. W1, W3, W4, W6 and W7 pass. W2 fails: discovery from code misses two
  openers in components.js and the rail's CSS-only tooltip. W5 fails: a copy without the probe kit gets "FIX BLOCKED",
  not a command. CI green on `8e520995`.
- **Held-out rows:** 7 of 10 pass, 3 partial.
  - T3 is partial: a new dialog, a removed one and a renamed id fail by name with file and line, and a comment-only
    change passes; a new button with `aria-haspopup="menu"` passes, because discovery never reads that attribute.
  - T7 is partial: a foreign server on 3177, bound to 0.0.0.0 or ::, is refused by launch, drive and compare with the
    port named, and survives cleanup; but the doctor prints no command for a missing recipe file, and its command for
    a stale recipe repeats the drift errors instead of repairing them.
  - T9 is partial: Reports' period dialog in English at 320 by touch worked on the first try; Access's PIN dialog
    in Arabic at 768 by keyboard cannot be asked for, because keyboard is not an input of `drive`, and the skill does
    not say so.
  - T4 passes on its intent: nothing generated is committed, and the recipe file holds no switch the code can tell;
    it holds sample values for open-domain switches (dates, a record, a reason), which the code cannot list.
  - T6 passes: 42 of 42 equal against its own extraction; a planted colour change is found on the four computer items
    with its region and a diff image. The repeat under load is in the code; no flaky difference occurred to show it.
  - T1, T2, T5, T8 and T10 pass.
- **Also found:** a clone without node_modules fails `help` with a raw module error; `compare` prints the whole diff
  map JSON; diff image names carry no state or feature; the refusal names 0.0.0.0 for a listener on ::; `launch --lan`
  prints `http://0.0.0.0:3176`; the skill's example expects the recipe file beside the concept, which the coordinator
  committed on the build branch on 2026-10-08 (`6df156bd`).
- **Failure cause:** the brief and the code. W2 asked a static scan for every element a user can open, which a CSS-only
  tooltip or an `aria-haspopup` without a target does not reveal; a missing recipe file has no command to give, since
  only the concept's branch holds it. The follow-up round takes `aria-haspopup`, keyboard input, the stale-recipe
  command and the output noise; the CSS-only opener stays a recipe entry.

## agent-environment-r03 round 7: `r03/briefs/round-7.md`, result `a36e97fe` (level xhigh)

- **Set-up:** the brief's commit `e8963b39` over HEAD `2bb94d24`, on branch `agent-environment-r03-gardener`. Held-out
  rows U1-U8: U1 by two fresh Sonnet agents that read only the skill, each in its own disposable worktree at
  `a36e97fe`; U2-U6 by a Sonnet grader in a disposable worktree and a scratch clone; U7 and U8 by the coordinator from
  CI and the diff.
- **Brief rows, as Codex graded them:** 5 of 5 (G1-G5). CI green on `a36e97fe`; its 30 new tests ran in CI's unit step.
- **Held-out rows:** 5 of 8 pass, 2 partial, 1 fails.
  - U1 passes: both agents ended `blocked` with the same findings in each class (446 unreferenced temp folders, 418
    proposals of 19.1 GB, the same two merged branches, three gates outside the ladder, 16 duplicated rule lines).
  - U4 passes: the survey changed no worktree's status and no `D:/fitway-temp` entry outside the harness's folder and
    the grader's own, and opened no server or network call. U6, U7 and U8 pass.
  - U2 is partial: "merged" is judged against local `main`, 486 commits behind `origin/main`, so three merged branches
    no record names and no worktree holds are missed. The row's eval-c* branches are not merged: a fault of the row.
  - U3 is partial: four of five plants are found, two with file and line; a new failing `check:*` script is reported
    "unknown check command" and never run.
  - U5 fails: `cleanup.mjs` passes `rmdir /s /q "<path>"` through `execFileSync`, Node escapes the inner quotes, and
    every deletion fails ("The specified path is invalid"), so nothing is deleted. With verbatim arguments it removes a
    trailing-dot folder and a 328-character path and reports a locked file. Its temp root is fixed at `D:/fitway-temp`,
    and a top-level folder named "evidence." is never proposed, because the reference search matches the prose word.
- **Also found by both cold agents:** the skill's `$root` is a fixed path; the report's date is the UTC day; proposals
  carry no age or citation guard, so folders hours old and a folder the rolling report cites are proposed; `clean`
  is out of reach while landed briefs stay in the resume's next steps, where `brief:check` fails on them for good;
  `survey.json` shows `status: null, clean: false` for worktrees it never measured; the skill lets a pass delete
  merged branches, where the user's decision for the weekly pass is that it deletes nothing.
- **Failure cause:** the code, and one row. No test ran `cleanup.mjs`'s command, which is how the quoting fault
  passed; the survey's merged check was not told which `main`. A follow-up round takes U2, U3, U5 and the cold
  agents' findings before the weekly schedule starts.

## agent-environment-r03 round 8: `r03/briefs/round-8.md`, result `3003f7ff` (level xhigh)

- **Set-up:** the brief's commit `aa75a137` over HEAD `d05b9ec9`, on branch `agent-environment-r03-gardener`, alongside
  round 9 in the other worktree. Held-out rows X1-X11: X1-X8 by a Sonnet grader in a disposable worktree and a scratch
  clone; X9 by two fresh Sonnet agents that read only the skill, each in its own disposable worktree at `3003f7ff`;
  X10 and X11 by the coordinator from CI and the diff.
- **Brief rows, as Codex graded them:** 9 of 10. H10 fails: the fast ladder stopped on the verify-fitway contract
  tests, which bind port 3177, held by round 9. A brief fault: two concurrent rounds shared a port through the ladder.
- **Held-out rows:** 9 of 11 pass, 1 partial, 1 fails.
  - X1 passes, with its negative control: without verbatim arguments the round's own deletion test fails ("The
    specified path is invalid"). X3-X8 and X11 pass; the coordinator re-ran X3's branch list.
  - X2 is partial: a path cited at the end of a sentence (`foo-bar.`), before a colon or in bold, or written
    `fitway-temp/x` or `/d/fitway-temp/x`, is not taken as a citation, so that folder would be proposed; the minimum
    age is in the skill but has no line in the report.
  - X9 passes on its row: both agents ended `blocked` with the same counts in every class (504 temp folders, 13
    proposed, 3 branches, 3 worktrees, 16 duplicated lines), deleted nothing and pushed nothing. Both found that the
    final survey cannot give a usable cleanup script: the report must name its proposals, a name in the report
    protects them, and the report's new date fails `check:repository` until the coordinator writes the ledger, so the
    final survey is blocked.
  - X10 fails: CI on `3003f7ff` fails H6's test, which compares the checkout path as text where the runner's TEMP is
    the 8.3 short path `RUNNER~1` (the fault recorded above under Round 6, `codex-r6-path-tokens.md`).
- **Also found:** the survey proposes removing the gardener's own worktree each week; worktrees not merged into
  `origin/main` are never measured, so old evaluation worktrees are never seen; a finished but ungraded round's brief
  fails `brief:check` and blocks the pass; `pass.ps1` points TEMP at the inventoried root; pnpm's pre-run dependency
  check tries an install when node_modules is stale.
- **Failure cause:** the brief and the tests. H2 (written by the coordinator) made anything the rolling report cites
  safe, without separating its evidence from its proposals; the brief let two rounds share a port; the H6 test
  compares paths as text. Round 8b takes these and the findings above.

## agent-environment-r03 round 9: `r03/briefs/round-9.md`, result `f32d4cca` (level xhigh)

- **Set-up:** the brief's commit `aa75a137` over HEAD `d05b9ec9`, alongside round 8. Held-out rows Y1-Y6: Y2-Y6 by a
  Sonnet grader in a disposable worktree with planted copies of the concept; Y1 by a fresh Sonnet agent that read only
  the skill, on two copies of the concept (one with the PIN opener taken out of the tab order); CI by the coordinator.
- **Brief rows, as Codex graded them:** 5 of 5 (K1-K5). CI green on `f32d4cca`; its 33 contract tests run in the
  ladder's verification-contracts step, which already existed.
- **Held-out rows:** 6 of 6 pass.
  - Y1: the PIN dialog opens in Arabic at the tablet width by keyboard in 12 Tabs and Enter, focus ending in the new
    PIN field (the coordinator looked at the frame); the planted copy is reported unreachable by keyboard, naming the
    body where the Tab cycle repeated.
  - Y2: an `aria-haspopup="menu"` opener with no target fails drift by file and line, `"false"` does not; the build
    passes with the round's recipe additions, and the specimens are covered by recipe entries, not by a rule that
    also hides a live opener. Negative control: without the `aria-haspopup` discovery, 6 of 33 tests fail.
  - Y3: the doctor's repair command drops the stale recipes and adds marked drafts; drift then names only the drafts;
    the concept is unchanged. Y4, Y5 and Y6 pass.
- **Also found:** commands that need dependencies still fail with a raw module error in a clone without node_modules
  (only `help` names the install step); the doctor prints its problem block twice; a keyboard-unreachable item is
  counted as a problem, not as "not reachable", in the drive summary; the summary's proof field does not repeat the
  dialog-open proof; every focus step carries the activation's label.
- **Failure cause:** none in the rows. The findings above go to the follow-up list.

## agent-environment-r03 round 8b: `r03/briefs/round-8b.md`, result `e0fcb90e` (level high)

- **Set-up:** the brief's commit `eb705aef` over HEAD `8a47897b` (round 8's result merged with its grade), on branch
  `agent-environment-r03-gardener`; the coordinator's ledger entry for the round's proof pass followed as `46194162`.
  Held-out rows Z1-Z9: Z1 and Z3-Z9 by a Sonnet grader in a disposable worktree, scratch roots and a scratch clone;
  Z2 by a fresh Sonnet agent that read only the skill, on a scratch temp root, its cleanup run by the coordinator.
- **Brief rows, as Codex graded them:** 8 of 9. R9 failed only on the ledger's date against the new rolling report,
  which is the coordinator's entry; CI green on `46194162`.
- **Held-out rows:** 8 of 9 pass, 1 partial.
  - Z2: the final cleanup script listed exactly the three folders the report proposed; run by the coordinator, it
    removed them (one named "evidence.") and left the young folder and the survey folders. The agent's first attempt
    stopped on the coordinator's prompt, which forbade writing the survey output inside the temp root, where the
    skill puts it by design.
  - Z1: the round's tests pass with TEMP in 8.3 form (a C: short path; D: has no 8.3 names); round 8's test fails under
    the same TEMP. Z3, Z4, Z6, Z7, Z8 and Z9 pass; Z9 re-ran round 8's X1-X8 on the new code.
  - Z5 is partial: every worktree is measured and the evaluation worktrees carry branch, date and status, but an old
    unmerged worktree is flagged only as a field in the JSON, with no line naming it; none is old enough today.
- **Also found:** writing the ledger entry changes an open record, so the cleanup script handed over before it no
  longer runs ("Open records changed; run a fresh survey"); a flagged unmerged worktree keeps every pass blocked
  until the coordinator acts; the weekly worktree's path is fixed in `facts.mjs`.
- **Failure cause:** none in the code for the rows; Z5's listing is the round's reading of "listed". Follow-ups:
  a named section for worktrees awaiting review; the final survey rerun after the ledger entry (docs/WORKFLOW.md).

## agent-environment-r03 round 13: `r03/briefs/round-13.md`, result `644e8abc` (level high)

- **Set-up:** the brief's commit `ae89c7a9` over HEAD `70bc51c1`, on branch `agent-environment-r03-css`, launched with
  rounds 10-12 side by side. Held-out rows T1-T5 by a Sonnet grader in a disposable worktree at the result, on a
  `git archive` of the build's Eclipse folder at `1d3539a3` and planted fixtures; T3 reproduced by the coordinator.
- **Brief rows, as Codex graded them:** 3 of 3 (C1-C3); 68 tests; the fast ladder passed on its clean tree.
- **Held-out rows:** 4 of 5 pass, 1 partial.
  - T1: on the build's folder the lint exits 1 with 87 findings: 76 ungated hover selectors (80 less 4 gated, as the
    review and the facts scan found), 0 `transition: all`, 0 `ease-in`, 11 outline removals without a ring. The grader
    opened all 11: none is a false positive; 5 have no ring anywhere and 6 move it to a child or parent (no declared
    ring comment exists yet). The twelfth, `style.css:941` `.fw-pop`, passes on its own border and shadow.
  - T2, T4 and T5 pass: the planted gating, `all`, `ease-in` and `cubic-bezier` cases; a folder outside the repository
    and one named with a space and Arabic letters; no CSS is `NO_CSS ... not a pass`, exit 2; hashes and times
    unchanged; diff in scope, not in the ladder; breaking the hover gate fails 5 tests, the ease-in check 7.
  - T3 is partial: a `focus-ring:` comment naming a missing selector is flagged, but the finding does not name it.
- **Also found:** `outline: 0 none` and `outline-style: none` are not seen as removals; `@media not all and (hover:
  hover)` counts as gated; the finding does not tell a moved ring from no ring; a decorative border or shadow counts
  as a ring (`.fw-pop`).
- **Failure cause:** none in the rows but T3's wording; the findings above go to the follow-up list with the other
  rounds'.

## agent-environment-r03 round 11: `r03/briefs/round-11.md`, result `c7e0e404` (level high)

- **Set-up:** the brief's commit `35e2ed33` over HEAD `70bc51c1`, on branch `agent-environment-r03-verify`, launched with
  rounds 10, 12 and 13. Held-out rows Q1-Q7 by a Sonnet grader in a disposable worktree at the result, on a
  `git archive` of the build's Eclipse folder at `1d3539a3`, planted copies and a clone without node_modules; Q1
  reproduced by the coordinator. Before launch the coordinator added to V1 that the fast ladder runs
  `check:verification-map` and must still pass with no recipe file.
- **Brief rows, as Codex graded them:** 7 of 7 (V1-V7); 39 contract tests, six failing on the base; ladder passed.
- **Held-out rows:** 7 of 7 pass.
  - Q1: no recipe file prints `DRIFT SKIP: no recipe file was found; nothing checked.`, exit 0; with the build's file
    `DRIFT PASS: 1 recipe files found and checked.`; a gone selector still fails.
  - Q2-Q3: without node_modules, map, list and drift name typescript and the install line, doctor and compare name
    `@playwright/test`, no stack, exit 1; each failure prints once.
  - Q4-Q6: Access's PIN opener out of the tab order reads `1 keyboard unreachable (access.html/pinChange ...); 0
    problems`, exit 1, and a failing state proof stays a problem; the summary carries `featureProof`
    (`#dlg-pin[open]`) beside the state proof; the 12 Tab steps read `Tab move to <selector>` and only Enter carries
    the activation. The grader looked at the 768 frame: the Arabic PIN dialog open, focus on the new-code field.
  - Q7: round 9's PIN drive and Daily's compare (42 equal) pass; drift passes on the build; diff in scope; reverting
    the V1 branch fails its test.
- **Also found:** the keyboard-unreachable text quotes the whole body's text as where focus stopped; "not reachable"
  and "keyboard unreachable" read alike; `featureProof` records the recipe's declared proof, not a measured value; the
  CLI accepts only ports 3176-3177 (`core.mjs:295`), so a grader cannot move off the builders' ports.
- **Failure cause:** none.

## agent-environment-r03 round 10: `r03/briefs/round-10.md`, result `d8945397` (level high)

- **Set-up:** the brief's commit `95cc46c2` over HEAD `70bc51c1`, on branch `agent-environment-r03`, launched with
  rounds 11-13. Held-out rows P1-P7 by a Sonnet grader in a disposable worktree at the result, with scratch ledgers,
  packets and homes; the lease finding confirmed by the coordinator in the diff.
- **Brief rows, as Codex graded them:** 7 of 7 (R1-R7); ladder passed.
- **Held-out rows:** 5 of 7 pass, 2 partial; one unrequested regression.
  - P2, P4, P5 and P7 pass: `pnpm test [--] <file>` runs one file in both shells and keeps `-t`; the checker's ids are
    now `brief-format`, `brief-readiness`, `brief-references` and `brief-length`, and codex.md's B10 names
    `brief-references`; the Impeccable fallback is found under any home in `.codex` or `.agents`; reverting
    run-vitest's repair fails 2 of its 9 tests.
  - P6 passes with gaps: file against glob, nested globs and bare against scoped `SPEC.md` fail naming both milestones;
    disjoint globs, a lease and a closed record pass; the real ledger passes. But prose words are claimed as paths
    (`tests` from "... and its tests"; "one new frontier policy pointer document"), and access-reason-cap-r01's folder
    named inside prose (`docs/phase-records/handoffs/coordinator/`) is not claimed.
  - P1 is partial: each misplaced `supersededBy` is named, but the check stops at the first fault, so one run names
    only one of two. P3 is partial: a bad `taskClass` fails with a schema dump that omits the value.
  - Regression: the check at `70bc51c1` that failed two open milestones sharing a lease string is gone; with the new
    rule an overlap passes when either milestone's lease names the path, so both may hold it (AGENTS.md: a lease for
    a shared file).
- **Failure cause:** the brief. R7 said an overlap passes "unless a `sharedLeases` entry names that path" without
  saying a lease has one holder, and it left the scope-line rule to the round. Repair attempt 1 is round 10b.

## agent-environment-r03 round 12: `r03/briefs/round-12.md`, result `db995501` (level high)

- **Set-up:** the brief's commit `9f28df01` over HEAD `70bc51c1`, on branch `agent-environment-r03-gardener`, launched
  with rounds 10, 11 and 13. Held-out rows S1-S5 by a Sonnet grader in a disposable worktree at the result, a scratch
  clone with a planted 10-day-old worktree, scratch temp roots and planted folders. Before launch the coordinator
  changed G2 to keep the ledger's `gardener` outcome values, whose schema was round 10's scope.
- **Brief rows, as Codex graded them:** 5 of 5 (G1-G5); 35 gardener tests; ladder passed.
- **Held-out rows:** 4 of 5 pass, 1 partial.
  - S2: the planted worktree appears under "Worktrees awaiting review" with path, branch, date and status, is not
    proposed, the console counts it, and the implied ledger entry passes `check:repository`; with the other findings
    neutralised the outcome is `clean`.
  - S3: the weekly path is a literal only in `config.json`; `FITWAY_GARDENER_WORKTREE` relocates it and the relocated
    worktree is no longer proposed; this machine's `gardener` worktree is not proposed. S4: the skill's closing order
    matches `docs/WORKFLOW.md`. S5: diff in scope, 35 tests with TEMP on D: and in 8.3 form, round 8b's Z4, Z5, Z7 and
    Z8 re-run; reverting `cleanup.mjs` fails the G1 test.
  - S1 is partial: a `gardener`-entry edit or removal leaves the script runnable and a report edit is refused, but an
    edited or added milestone is refused naming `PROJECT_STATE.yaml`, not the milestone.
- **Also found:** `updatedAt` is outside the exemption, and `check:repository` fails a `gardener` date after it, so a
  real entry written after a later pass also bumps `updatedAt` and voids the old script; the workflow's rerun of the
  final survey still hands the user a working one. At `70bc51c1` the resume point's bare `FACTS.md` beside "briefs"
  read as an open brief and blocked every survey; the coordinator line no longer has it. `docs/WORKFLOW.md` still
  names the weekly path in prose.
- **Failure cause:** none in the rows but S1's wording ("the record" read as the file).

## agent-environment-r03 round 10b: `r03/briefs/round-10b.md`, result `24aa82e9` (level high)

- **Set-up:** repair attempt 1 of round 10: the brief's commit `a9f456fa` over `d8945397`, on branch
  `agent-environment-r03`. Held-out rows PB1-PB5 by a Sonnet grader in a disposable worktree at the result, with
  scratch ledgers and packets; PB1 reproduced by the coordinator in a scratch repository.
- **Brief rows, as Codex graded them:** 4 of 4 (L1-L4); 11 of 13 new tests fail on `d8945397`; ladder passed. Its
  report lists what every open milestone's entries claim.
- **Held-out rows:** 5 of 5 pass.
  - PB1: two open milestones holding `lib/foo.mjs`, or `lib/**` and `lib/foo.mjs`, fail with "a lease must have one
    holder"; disjoint leases pass; an overlap passes with a lease on exactly one side; a closed record's lease does not
    count.
  - PB2: access-reason-cap-r01's prose line claims `docs/phase-records/handoffs/coordinator/**` and nothing else; no
    prose word is claimed; an entry with no path before `: ` fails naming the milestone and the entry.
  - PB3: `taskClass "historical-audit" has no route` names the packet. PB4: round 10's P2-P6 hold; diff in scope.
    PB5: round 10's parser restored fails 6 of 7 L2 tests.
- **Also found:** prose tokens such as "and/or" or "v1.2" before `: ` would be claimed (none in the ledger today); a
  second, cascaded line in the task-class failure; the checks still stop at the first fault.
- **Failure cause:** none.
