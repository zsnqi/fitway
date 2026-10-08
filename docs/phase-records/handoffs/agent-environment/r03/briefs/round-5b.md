<!-- brief-format: v1 role: codex -->
# Codex brief: the launch command's test finds Git Bash, and resume takes a message (agent-environment-r03, round 5b)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r03`, branch `agent-environment-r03`, HEAD `34f472e4`
- **Milestone:** `agent-environment-r03`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 7, 13.
- **Read first, only these:**
  - `scripts/agent-environment/codex-round.mjs` and `scripts/agent-environment/codex-round.test.ts`: round 5's command
    and its tests.
  - `docs/agent-context/WORKING_AGREEMENTS.md` §"Delegation": how a stopped run resumes.

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

The launch command's tests pass on any Windows machine with Git installed, whatever the order of its PATH, and a
resumed run can be told in one line why it stopped instead of receiving its whole brief again.

## Causes and required outcomes

- **F1.** The test "gives the same launch in PowerShell and Git Bash" starts `bash`, which on this machine resolves to
  the WSL launcher `C:\Windows\System32\bash.exe` ahead of Git Bash. It then fails with exit 127 ("node.exe: No such
  file or directory"), 1 test of 21, so `node scripts/run-vitest.mjs run scripts/agent-environment/codex-round.test.ts`
  fails from PowerShell here, although it passed in your round. Outcome: the test runs Git for Windows' bash wherever
  Git is installed, whatever the order of PATH (also with the WSL launcher first), and passes from PowerShell and from
  Git Bash on this machine; on a machine without Git Bash it fails with one line naming what is missing. Intent: a
  developer's local ladder and CI give the same result.
- **F2.** `resume <folder>` sends the run's original input again, launch note and brief (`codex-round.mjs:236-240`).
  After a usage limit or an account switch the coordinator wants to tell the thread what happened. Outcome: resume
  takes an optional message, sent instead of the original input, byte for byte (Arabic text included); without one,
  resume behaves as it does today. The command's help shows the option. Intent: the thread hears one line about the
  stop, not its whole brief again.
- **F3.** Outcome: tests cover F1 (a PATH whose first `bash` is a stand-in that is not Git Bash) and F2 (the message's
  bytes reach the stand-in; without a message, the original input as before), and `node scripts/verify.mjs fast`
  passes from PowerShell on your committed, clean tree. Intent: neither regresses unseen.

## Scope

You may change `scripts/agent-environment/codex-round.mjs` and `scripts/agent-environment/codex-round.test.ts`;
commit once when done. Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not work
around it: finish and measure the others, then stop and report. (B3)

## Report

Each outcome as PASS or FAIL with the command and the output line that proves it; the command's help as it prints it;
the files you changed; the commit SHA; anything you could not do.
