<!-- brief-format: v1 role: codex -->
# Codex brief: the launch command's tests pass on CI's short TEMP path (agent-environment-r03, round 5c)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r03`, branch `agent-environment-r03`, HEAD `0fd22451`
- **Milestone:** `agent-environment-r03`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 7, 13.
- **Read first, only these:**
  - `scripts/agent-environment/codex-round.test.ts` around line 480, and `scripts/agent-environment/codex-round.mjs`
    where it finds Git Bash.
  - `D:/fitway-temp/r03-round5b/ci-a40ba39-failed.log`: CI's failure on `a40ba39`.

<!-- environment:start v1 -->
## Environment

- Work only in the worktree and branch named above, and in `D:/fitway-temp/<run>/`. Never push, fetch, switch
  branches, or touch other worktrees or global configuration. (AGENTS.md, one writer per worktree)
- Use absolute paths; the shell's working directory resets between calls. (2026-10-02 retrospective)
- Wait on long jobs with Monitor or a background shell, never `sleep` or `Start-Sleep`. (2026-10-02 retrospective)
- Read a file before editing it. Write UTF-8 without a BOM and keep the file's line endings. (2026-10-02 retrospective)
- In PowerShell run pnpm without `2>&1`. Run Playwright from PowerShell: Git Bash rewrites `/api` paths. (2026-09)
- Drive C is full: keep temp output on D:, and set `TEMP`/`TMP` to `D:/fitway-temp` for a command that writes much. (2026-09)
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. (2026-10-02 retrospective)
<!-- environment:end -->

- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Playwright, Node scripts that run git) fail inside it:
  request escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- Never start a real Codex run: you are one. Every test uses a stand-in for the `codex` executable.

## Goal

The launch command's tests pass on CI as they do here, so CI is green on the branch again.

## Causes and required outcomes

- **F4.** CI on `a40ba39` fails one test, "gives the same launch in PowerShell and Git Bash"
  (`scripts/agent-environment/codex-round.test.ts:480`): the runner's TEMP folder is named by its 8.3 short form
  (`C:\Users\RUNNER~1\...`) while `where bash` returns the long form (`C:\Users\runneradmin\...`), and the test compares
  the two paths as text. Outcome: every path the tests and the command compare is compared as the same file, whether
  named by its short or long form, in any letter case, with either slash; the tests pass when TEMP is an 8.3 short path
  (drive D has no 8.3 names; reproduce it with TEMP and TMP set to `C:\Users\PCFORC~1\AppData\Local\Temp`, the short
  form of this user's temp folder, for the test file only, which writes a few small files) and when it is a long one,
  from PowerShell and from Git Bash; `node scripts/verify.mjs fast` passes from PowerShell on your committed, clean
  tree. Intent: no test here depends on how the machine spells a path. The coordinator confirms on CI after your commit.

## Scope

You may change `scripts/agent-environment/codex-round.test.ts`, and `scripts/agent-environment/codex-round.mjs` only
where the command itself compares paths as text; commit once when done. Everything else is read-only. Add no
dependencies. If an outcome cannot be met, do not work around it: finish and measure the others, then stop and
report. (B3)

## Report

The outcome as PASS or FAIL with the commands and output lines that prove it (both TEMP forms, both shells); every
place you found a path compared as text; the files you changed; the commit SHA; anything you could not do.
