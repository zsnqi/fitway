<!-- brief-format: v1 role: codex -->
# Codex brief: a round's required changes are checked after it runs (agent-environment-r03, round 32)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r03-r32`, branch `agent-environment-r03-r32`, HEAD `e0b199df`
- **Milestone:** `agent-environment-r03`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 6, 16.
- **Read first, only these:**
  - `scripts/agent-environment/codex-round.mjs`, `scripts/agent-environment/check-brief.mjs` and their tests;
  - `docs/agent-context/briefs/codex.md` (the template and its checklist);
  - `docs/phase-records/handoffs/agent-environment/findings.tsv` row F121.

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
- Return your report as your final message, not as a file. (2026-10-02 retrospective)
<!-- environment:end -->

- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Playwright, Node scripts that run git) fail inside it:
  request escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- Never start a real Codex run: prove the launch and resume paths with a stand-in for the `codex` executable placed
  first on `PATH` for the test, as the existing tests do.

## Goal

When a round reports an outcome met although a file that outcome required to change is unchanged, the coordinator
learns it from the launch command itself, before grading.

## Causes and required outcomes

- **C1. Nothing compares a round's required changes with what changed (F121).**
  - **Cause.** Twice on 2026-10-11 Codex reported an outcome PASS while a file it had to change was untouched (round
    22's self-test file, outside git). Only the grading noticed. `codex-round.mjs` records the run's events,
    last message and start load, nothing about the files the brief requires to change.
  - **Outcome.** A brief can mark a path an outcome requires to change by writing ` (must change)` right after its
    backticked path, as it writes ` (new)` today. `brief:check` accepts the marker on an existing file or folder
    (repository path or absolute path) and refuses it on a path that does not exist. At launch, `codex:round`
    records the content of every marked path (a folder by every file below it); when the run ends, and after each
    resume, it writes the comparison to the run folder and prints one line per marked path that is unchanged,
    naming the path and the outcome line of the brief that marked it. A run with no marked path behaves exactly as
    today.
  - **Intent.** "PASS" on an untouched required file shows up the moment the run ends.
- **C2. The template says how to use it.**
  - **Outcome.** The coordinator checklist in `docs/agent-context/briefs/codex.md` gains one line: mark with ` (must
    change)` each path an outcome requires to change. No other template text changes.
  - **Intent.** The marker is used where it helps.
- **C3. Proof.**
  - **Outcome.** Tests run by the fast ladder, each failing on `8e547456` and passing after, cover: a marked
    repository file changed and unchanged; a marked absolute file outside git changed and unchanged; a marked folder
    where one file below it changes; a marker on a missing path refused by `brief:check` and so by the launch; a
    resume after which a marked path is still unchanged; a brief with no marker. `node scripts/verify.mjs fast`
    passes on your committed, clean tree.
  - **Intent.** Each case is shown to fail when its defect is planted.

## Scope

You may change `scripts/agent-environment/codex-round.mjs`, `scripts/agent-environment/check-brief.mjs`, their tests,
any new fixture beside them, and the one checklist line of `docs/agent-context/briefs/codex.md` named above; commit
once when done. Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not work around
it: finish and measure the others, then stop and report. (B3)

## Report

For each outcome, PASS or FAIL, with the command and the output line that proves it. Then the files you changed, the
commit SHA, and anything you could not do. At most 20 lines.
