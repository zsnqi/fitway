<!-- brief-format: v1 role: codex -->
# Codex brief: grade launcher-fixes-4's result by running these checks (owner-design-exploration-r04, launcher-fixes-4-grade)

- **Worktree:** `D:/fitway-temp/owner-r04-launcher-fixes-4-grade/wt`, branch `grade-launcher-fixes-4`, HEAD `954968b0`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 64 and 67.
- **Read first, only these:**
  - `docs/phase-records/handoffs/owner-design-exploration/r04/briefs/codex-launcher-fixes-4.md`, whole (the round you grade);
  - `scripts/agent-environment/codex-round.mjs` lines 560-700 and 799-830;
  - `scripts/agent-environment/codex-round.test.ts` lines 300-340.

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

- You run in the workspace-write sandbox with automatic approval review. Anything that starts child processes with
  piped output (pnpm, Vitest, Node scripts that run git) fails inside it: request escalation for it from the first
  attempt, with a one-line justification. (DECISIONS item 7)
- **This round grades; it fixes nothing.** The worktree is a detached checkout of the delivered commit. Write your
  scratch tests, plants and logs in `D:/fitway-temp/owner-r04-launcher-fixes-4-grade/`. Other rounds run compares on
  ports 3176-3177, 3186-3187 and 3188-3189: start no preview, compare, Codex process or verify-fitway suite.

## Goal

The coordinator knows, row by row, whether launcher-fixes-4's delivered commit holds on forms and routes its own
tests did not try.

## Causes and required outcomes

- **G1. One-line readings in forms the round did not test.** Outcome: run against the delivered parser (through
  the same review path the round's tests use), each of these reads as its count with each reading's text whole: a
  one-line answer whose parts come in another order (what goes wrong first); one whose labels are plain words in bold
  followed by an em dash instead of a colon; five readings where reading 3 wraps onto a second line at column 0 with
  no indent. Intent: a complete answer is read whatever its layout.
- **G2. What must still be refused.** Outcome: "1. V1, V2 and L1 are the risky ones." followed by "2. V3 is fine."
  is refused; a numbered one-line list of IDs with one short clause each is refused; the round's fixture
  `codex-vf-runner-1.md` with reading 4 deleted and reading 5 renumbered 4 reads as 4; the same with reading 4's line
  cut after its ID is refused. Intent: what is not a complete reading is never counted as one.
- **G3. Answers outside the tests read as before.** Outcome: every fixture under
  `scripts/agent-environment/fixtures/codex-round-reviews/` present at `3bb0eae8`, and the answers
  `D:/fitway-temp/brief-review/codex-vf-runner-2/last.md`, `D:/fitway-temp/brief-review/codex-vf-fixes-1/last.md` and
  `D:/fitway-temp/brief-review/codex-reports-css-1/last.md`, give the same count and texts at `954968b0` as at
  `3bb0eae8` (run the old parser from `git show 3bb0eae8:<path>` in your temp folder). Intent: the change moved no
  answer it was not aimed at.
- **G4. Read routes the round did not plant.** Outcome: each of these, planted alone ahead of `reviewSourcePlan` in
  `copyReviewSources` with its result ignored, makes at least one test in `codex-round.test.ts` fail: a
  `git cat-file -p <head>:<source>` through `execFileSync`; an awaited `promisify(execFile)` call; a child started
  with `fork` that reads the source. Restore the file after each plant. Intent: the order test sees a source read by
  any route.
- **G5. No false alarm.** Outcome: with no plant, the order tests pass three runs in a row, and a child process
  started after the place check (as the launcher's own `git` does for a repository source) fails none of them.
  Intent: the guard fails only on a real early read.
- **G6. The round kept its limits.** Outcome: `git diff --stat 3bb0eae8 954968b0` lists only the three paths the
  round's Scope allows; no `expect(` line present at `3bb0eae8` in `codex-round.test.ts` is missing at `954968b0`;
  the test count at `954968b0` is at least that at `3bb0eae8`. Intent: nothing existing was weakened to pass.

## Limits the result keeps

- **L1. Nothing tracked changes.** After every plant is restored, `git -C <worktree> status --short` is empty, and
  no commit is made.

## Scope

You may change files only temporarily, for a plant, and must restore each before the next; everything you keep goes
in `D:/fitway-temp/owner-r04-launcher-fixes-4-grade/`. Add no dependencies. If an outcome cannot be met, do not
work around it: finish and measure the others, then stop and report. (B3)

## Report

Each of G1-G6 and L1 as PASS or FAIL with the command and the output line that proves it, and for a FAIL the input
that failed; anything you could not run.
