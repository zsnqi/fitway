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
