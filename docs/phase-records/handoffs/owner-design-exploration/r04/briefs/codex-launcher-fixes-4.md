<!-- brief-format: v1 role: codex -->
# Codex brief: one-line review readings read, and a source read by a child process caught (owner-design-exploration-r04, launcher-fixes-4)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-launcher-fixes-4`, branch `owner-r04-launcher-fixes-4`, HEAD `c699d3fb`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` item 62.
- **Read first, only these:**
  - `scripts/agent-environment/codex-round.mjs` lines 518-720 and 799-818;
  - `scripts/agent-environment/codex-round.test.ts` lines 313-332 and 1110-1150;
  - `docs/agent-context/briefs/REVIEW.md` §"Prompt";
  - `docs/phase-records/handoffs/agent-environment/findings.tsv` rows F156 and F182;
  - `D:/fitway-temp/brief-review/codex-vf-runner-1/last.md`, whole.

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
  starts child processes with piped output (pnpm, Vitest, Node scripts that run git) fail inside it: request
  escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- **CI** runs the fast ladder on Windows (`.github/workflows/checks.yml`) from a checkout of the pushed commit alone,
  with no other branch: every test you add passes there, with no file outside the repository.
- **Your temp folder** is `D:/fitway-temp/owner-r04-launcher-fixes-4/`. Other rounds work in other worktrees on this
  machine: start no preview, compare or Codex process of your own. If a verify-fitway test fails in the fast ladder,
  rerun that file alone once and report both runs; the coordinator's CI run on your commit decides L2.

## Goal

A review answer whose readings are each complete on one line is read instead of stopping a launch, and a review
source read before its place is decided fails a test whatever program reads it.

## Causes and required outcomes

- **J1. Readings written on one line (F182).**
  - **Cause.** `parseReadings` (`codex-round.mjs:647-686`) takes a numbered line starting with an ID as a bare start
    that needs an indented body (`bareStart`, `codex-round.mjs:574-584`), and a line wrapped in bold as one that
    needs a body line (`numberedBoldStart`, `codex-round.mjs:564-572`); so `D:/fitway-temp/brief-review/codex-vf-runner-1/last.md`, whose five
    readings each hold REVIEW.md's four parts on one line, is refused as "cannot be read as readings".
  - **Outcome.** That answer reads as exactly five readings, each holding its whole line, with the IDs V1, V1, L1, V3
    and V2 in order, as a test on a copy of it under `scripts/agent-environment/fixtures/codex-round-reviews/`. The
    same holds with `)` in place of `.` after the number, with the labels not bold, and with the readings
    separated by no blank line. A numbered one-line item that names an ID but gives only one of the four parts (a
    list of IDs, or a one-line summary of what the brief asks) is still refused, and so is the same answer with any
    reading's line cut after its ID; every answer the existing tests and fixtures read still reads the same.
  - **Intent.** A complete answer never stops a launch for its layout, and the parser still refuses what is not a
    reading rather than counting it as one.
- **J2. A source read through a child process (F156).**
  - **Cause.** The order tests (`codex-round.test.ts:1110-1150`) see only the reads the launcher reports about itself
    (`captureReviewSourceAccess`, `codex-round.test.ts:313-332`), so a `git show <head>:<source>` started from
    `node:child_process` ahead of `reviewSourcePlan` in `copyReviewSources` (`codex-round.mjs:799-818`), its result
    ignored, passes every test. Two repairs (encoding-launcher E3, encoding-launcher-fix G3) widened what the launcher
    reports, and the plant still passed: the gap is that the observation depends on the code under test.
  - **Outcome.** That plant, written in turn with `spawn`, `spawnSync`, `execFile`, `execFileSync`, `exec` and
    `execSync`, each with its result ignored, makes at least one test fail for each of the three source kinds
    (repository, checkout, temp) because it observed the process start before the place check; the existing file
    read plants still fail. Report each plant with the failing test's name.
  - **Intent.** A source touched before its place is decided fails CI by any route, without relying on the launcher
    to report its own reads.

## Limits the result keeps

- **L1. Today's behaviour elsewhere.** Every existing test keeps its assertions and still runs, none skipped,
  excluded or made conditional; launch, `resume` and the review keep their arguments, files and exit codes.
- **L2. The ladder.** `node scripts/verify.mjs fast` passes on your committed tree, and `git status --short` is empty
  after your commit and after the ladder.

## Scope

You may change `scripts/agent-environment/codex-round.mjs` (must change), `scripts/agent-environment/codex-round.test.ts`
(must change) and files under `scripts/agent-environment/fixtures/codex-round-reviews/`; commit once when done.
Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not work around it: finish and
measure the others, then stop and report. (B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it; for J2 each plant with
its failing test; the files you changed; the commit SHA; anything you could not do; any hook message you did not act
on.
