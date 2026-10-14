<!-- brief-format: v1 role: codex -->
# Codex brief: review answers with lists read, the resume quote exact, a silent early read caught (owner-design-exploration-r04, launcher-fixes-3)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-launcher-fixes-2`, branch `owner-r04-launcher-fixes-2`, HEAD `a6ad0ae4`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 47 and 52.
- **Read first, only these:**
  - `docs/agent-context/briefs/REVIEW.md`, whole;
  - `scripts/agent-environment/codex-round.mjs` lines 437-600;
  - `scripts/agent-environment/check-brief.mjs` lines 150-300;
  - `scripts/agent-environment/codex-round.test.ts` lines 1-170, 1353-1476 and 1858-1986;
  - `scripts/agent-environment/check-brief.test.ts` lines 480-600;
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-environment/findings.tsv`
    rows F156, F162 and F163.

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
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. Any message without a tool call is your final message:
  it ends your run and stops what you started, so wait inside a tool call and write it once, as the report.
  (2026-10-02 retrospective; F154)
<!-- environment:end -->

- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Node scripts that run git) fail inside it: request
  escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- **CI** runs the fast ladder on Windows (`.github/workflows/checks.yml`): every test you add passes there. Tests use
  the fake Codex and `FITWAY_BRIEF_REVIEW_ROOT`; no test or check you run calls Open Design or reads
  `OPENDESIGN_API_KEY`.
- **Your temp folder** is `D:/fitway-temp/owner-r04-launcher-fixes-3/`. Other rounds run compares on this machine:
  start no preview, compare or Codex process of your own. If a verify-fitway test times out in the fast ladder while
  they run, rerun that file alone once and report both runs; the coordinator's CI run on your pushed commit decides L2.

## Goal

The three gaps the grading of launcher-fixes-2 found are closed: a sound review answer whose readings hold lists or
use a bold numbered start is read, the resume message quotes its trigger line exactly, and a test fails when a review
source is read before its place check even if that read's error is ignored.

## Causes and required outcomes

- **K1. A reading's own lists and a bold numbered start (F162).**
  - **Cause.** `parseReadings` (`scripts/agent-environment/codex-round.mjs:437-515`) refuses an answer as "cannot be
    read as readings" when a reading under a `### 1. R1` heading holds its own numbered list (`1.` to `4.` lines in its
    body), and when readings start `**1)** R1 text` (its bold form must wrap the whole line).
  - **Outcome.** An answer whose readings each start with a number in sequence from 1 (bare `N.` or `N)`, inside a
    heading of any level, or bold as `**N.**` or `**N)**` followed by text on the same line) and an outcome or limit ID,
    each with a body, is read as exactly those readings, each the text from its start to the next reading's start,
    whatever numbered or bulleted lists, deeper headings or fenced code its bodies hold. An answer whose reading
    starts cannot be told apart from its bodies' list items is still refused, never guessed. Every answer the existing
    tests refuse is still refused, and every fixture is still read as its readings.
  - **Intent.** A sound answer never stops a launch, and an ambiguous one still stops it.
- **K2. The trigger line quoted exactly (F163).**
  - **Cause.** `autoResumeMessage` (`scripts/agent-environment/codex-round.mjs:568-570`) quotes the trigger line with
    `JSON.stringify`, so its double quotes and backslashes reach the agent escaped.
  - **Outcome.** The resume message holds the trigger's first line character for character, with no character added
    inside it, delimited so its start and end show; a line with double quotes, backslashes, backticks, « », and Arabic
    shows each unchanged. `auto-resumes.log` stays as it is.
  - **Intent.** The agent reads its own last line as it wrote it.
- **K3. A silent read before the place check fails a test (F156).**
  - **Cause.** The launcher-fixes-2 test for read order catches a read that throws (`EISDIR`). With
    `await readFile(real).catch(() => {});` inserted after `const real = await realSourcePath(sourceValue);` in
    `reviewSourcePlan` (`scripts/agent-environment/check-brief.mjs:217-260`), all 189 tests in the two files still pass.
  - **Outcome.** With that line inserted, at least one test fails; with it removed, all pass. The same holds for a
    silent read placed ahead of the check of each other kind of review source the launcher accepts (a repository
    file at the named HEAD, a file in the launcher's checkout, a file outside them all). Report how you checked each.
  - **Intent.** CI notices any read of a source before its place is checked, not only a read that fails.

## Limits the result keeps

- **L1. Today's behaviour elsewhere.** Every existing test keeps its assertions; `pnpm brief:check` gives the same
  result as at the HEAD on every brief under `docs/phase-records/handoffs/owner-design-exploration/r04/briefs/`; launch,
  `resume` and the review keep their arguments, files and exit codes; `check-brief.mjs` changes only where a test
  needs a seam, with its behaviour unchanged.
- **L2. The ladder.** `node scripts/verify.mjs fast` passes on your committed tree, and `git status --short` is empty
  after your commit and after the ladder.

## Scope

You may change `scripts/agent-environment/codex-round.mjs` (must change), `scripts/agent-environment/codex-round.test.ts`
(must change), `scripts/agent-environment/check-brief.test.ts` (must change), `scripts/agent-environment/check-brief.mjs`
(L1's seam only) and files under `scripts/agent-environment/fixtures/`; commit once when done. Everything else is
read-only. Add no dependencies. If an outcome cannot be met, do not work around it: finish and measure the others, then
stop and report. (B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it; for K3, each kind of
source with the inserted read and the failing test's name; the files you changed; the commit SHA; anything you could
not do; any hook message you did not act on.
