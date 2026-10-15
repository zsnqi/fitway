<!-- brief-format: v1 role: codex -->
# Codex brief: a state-changing feature keeps the rules it does not end, and a failed proof names its rule and moment (owner-design-exploration-r04, vf-proofs)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-vf-proofs`, branch `owner-r04-vf-proofs`, HEAD `5b81b3b7`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 67 and 70.
- **Read first, only these:**
  - `.agents/skills/verify-fitway/runner.mjs` lines 636-680 and 830-915;
  - `.agents/skills/verify-fitway/state-rules.mjs`, whole;
  - `.agents/skills/verify-fitway/drive.mjs` lines 1-130;
  - `.agents/skills/verify-fitway/cli.test.mjs` lines 2860-3260;
  - `.agents/skills/verify-fitway/SKILL.md` lines 36-48;
  - `docs/phase-records/handoffs/agent-environment/findings.tsv` rows F241 and F244.

<!-- environment:start v1 -->
## Environment

- Work only in the worktree and branch named above, and in `D:/fitway-temp/<run>/`. Never push, fetch, switch
  branches, or touch other worktrees or global configuration. (AGENTS.md, one writer per worktree)
- Use absolute paths; the shell's working directory resets between calls. (2026-10-02 retrospective)
- Wait on long jobs with Monitor or a background shell, never `sleep` or `Start-Sleep`. (2026-10-02 retrospective)
- Read a file before editing it. Write UTF-8 without a BOM and keep the file's line endings. (2026-10-02 retrospective)
- Windows PowerShell 5.1 without a profile pipes text to node, python or git as ASCII: Arabic, «» and … become `?`.
  Put such text in a file and run the file, and read back each file you write that holds it. (replay motion-lows)
- In PowerShell run pnpm without `2>&1`. Run Playwright from PowerShell: Git Bash rewrites `/api` paths. (2026-09)
- Drive C is short: keep output on D:. `TEMP` and `TMP` are already on drive D; never point them at `D:/fitway-temp`,
  whose folders the gardener inventories. (2026-09; agent-environment DECISIONS item 24)
- Meet each outcome in full: never delete or loosen what a limit keeps to save effort; report it instead. (2026-10-14)
- Shell text is code: `JSON.stringify()` is not shell quoting, and backticks or `$()` still run; use a file. (2026-10-14)
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. Any message without a tool call is your final message:
  it ends your run and stops what you started, so wait inside a tool call and write it once, as the report.
  (2026-10-02 retrospective; F154)
<!-- environment:end -->

- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Playwright, Node scripts that run git) fail inside it: request
  escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- **CI** runs the fast ladder on Windows (`.github/workflows/checks.yml`) from a checkout of the pushed commit alone,
  with no other branch, without Playwright Chromium or ui-forensics, and with a system temp folder in its short 8.3
  form (`C:UsersRUNNER~1...`): every test you add passes there.
- **Your temp folder** is `D:/fitway-temp/owner-r04-vf-proofs/`. Start no compare; ports 3174 and 3180 serve the
  user's preview: never stop a process you did not start. Two other rounds work in other worktrees on this machine.
  If a verify-fitway test fails in the fast ladder, rerun that file alone once and report both runs; if the two Git
  Bash tests in `codex-round.test.ts` fail with `sed` or `dirname` not found, that is F237, another round's: report
  it and go on. The coordinator's CI run on your commit decides L2.
- **Your report is checked against this run's recorded commands.** A step counts as done only when a tool call ran
  it in this run; quote its real output, and name the SHA `git rev-parse HEAD` printed after your commit.

## Goal

A feature that changes the page's state can name the before rules its action ends and keeps proving the others
beside the after frame, and a state proof that fails says which rule failed and at which moment.

## Causes and required outcomes

- **S1. A state-changing feature drops every before rule (F241).**
  - **Cause (inferred from the source).** `recheckBeforeState` (`runner.mjs:656`) is false for any feature marked
    `changesState`, so beside its after frame (`runner.mjs:900-910`) no before rule is proved, including rules its
    action does not end; `ends` (`state-rules.mjs:13-20`) can be declared only on an arrival rule.
  - **Outcome.** A feature can declare `ends: [{ when: {...} }]` in the recipe, checked when recipes load exactly as an
    arrival's `ends` is (exact, non-wildcard, one before rule per language the feature runs in); for such a feature
    every before rule that applies to the item and is not ended, by it or by an arrival, is proved before and after
    the after frame and listed in `afterFrameProof`. A feature with both `changesState` and `ends` is refused at load,
    and a feature with `changesState` alone behaves as at the HEAD. Tests, without a browser, show a not-ended rule
    that fails beside the after frame failing the item, an ended one lifted, and each refusal. SKILL.md documents it.
  - **Intent.** A state change lifts only what it really ends, so a state that should survive the action is still
    checked; the build branch's recipes can move to declarations one feature at a time.
- **S2. A failed state proof names nothing (F244).**
  - **Cause (inferred from the Opus grader's plants).** `prove` (`drive.mjs:3-40`) waits with
    `page.waitForFunction`, so a failure reports only `page.waitForFunction: Timeout 5000ms exceeded.`, naming neither
    the rule nor the capture it failed beside.
  - **Outcome.** A state proof that fails in `runner.mjs` throws an error that names the rule (its `shows`), whether
    it is a before or an `afterActions` rule, and the moment: before or after the before frame, before or after the
    after frame; Playwright's own message is kept in it; the same text reaches the item's problems in the run's JSON.
    A test plants a failing rule at each of the four moments and checks the text.
  - **Intent.** A failed proof is read from the run's output, without a rerun with a probe.

## Limits the result keeps

- **L0. New cases prove the repair.** Each case you add fails on the HEAD's code with your production change
  reverted; report each failing output.
- **L1. Today's behaviour elsewhere.** Every existing test keeps its assertions and still runs, none skipped,
  excluded or made conditional, the helpers and fixtures they use keep what they check (a change to one is reported
  with the outcome that needed it), and the suite runs at least as many tests as at the HEAD; a recipe that loads at
  the HEAD loads and runs the same, `changesState` included.
- **L2. The ladder.** `node scripts/verify.mjs fast` passes on your committed tree, and `git status --short` is empty
  after your commit and after the ladder.

## Scope

You may change `.agents/skills/verify-fitway/runner.mjs` (must change), `.agents/skills/verify-fitway/state-rules.mjs`
(must change), `.agents/skills/verify-fitway/cli.test.mjs` (must change), `.agents/skills/verify-fitway/drive.mjs`,
`.agents/skills/verify-fitway/SKILL.md` and other files under `.agents/skills/verify-fitway/`; commit once when done.
Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not work around it: finish and
measure the others, then stop and report. (B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it; for S2 the four planted
messages; the files you changed; the commit SHA; anything you could not do; any hook message you did not act on. Also
list, read-only with `git show owner-followup-r04-build:design-research/owner-composition-exploration-r04/directions/eclipse/verification-recipes.json`,
each feature marked `changesState` with the before rules that apply to its page, for the build branch's later
declarations.
