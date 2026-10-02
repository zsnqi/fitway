<!-- brief-format: v1 role: codex -->
# Codex brief: which backticked tokens are paths (agent-environment-r01, round 6)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r01`, branch `agent-environment-r01`, HEAD `a7c9ecc`
- **Milestone:** `agent-environment-r01`. Decisions: `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-environment/DECISIONS.md`
  items 3 and 6.
- **Read first, only these:** `docs/phase-records/handoffs/agent-environment/briefs/codex-r5-repair.md` §"Causes and required outcomes"
  (F2 and F3 still hold except where this brief changes them);
  `scripts/agent-environment/check-brief.mjs`; `scripts/agent-environment/resume-point.mjs`.

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
  starts child processes with piped output (pnpm, Vitest, Node scripts that run git) fail inside it: request
  escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)

## Goal

`brief:check` and the resume-point validator agree on which backticked tokens are repository paths, and neither
reports a token that is not a path. A path written relative to some folder other than the repository root stays a
failure, with a message that says how to write it.

## Causes and required outcomes

- **P1.** Both tools read any backticked token containing `/` as a path
  (`scripts/agent-environment/check-brief.mjs:79`, `scripts/agent-environment/resume-point.mjs:56`), so an npm
  package name fails as a missing path: @playwright/test in a real brief. Outcome: an npm package name, scoped or
  not, with or without a version, is never a path in either tool.
- **P2.** A Git branch name with `/` fails as a missing path. `resume-point.mjs:48` skips it only when the word
  "branch" comes right before it; `check-brief.mjs` never skips it, so the Worktree line of a brief for the branch
  codex/owner-redesign-r04 is at risk. Outcome: in both tools, a token that names a local or remote-tracking branch of
  the repository and is not an existing path is not reported, wherever it stands in the line.
- **P3.** `resume-point.mjs:57` reads any bare name with an extension as a file at the repository root, the defect
  round 5's F2 removed from `brief:check`. Outcome: in a resume point, a bare name (no `/`) is a mention and is
  skipped, except on the "Previous resume point" and "Standing decisions" header lines, which stay checked as they
  are now.
- **P4.** A folder-relative path such as tools/ (meant inside the eclipse folder) is a writing error, not a tool
  defect: briefs and resume points write paths from the repository root or as absolute paths. Outcome: both tools
  still report it, and the message says that paths are written from the repository root or as absolute paths. In
  resume points too, when exactly one tracked file or folder ends with the missing path, the message names it, as
  `brief:check` already does.
- **P5.** Outcome: for the same token, the two tools reach the same decision (path or not), apart from the two header
  lines in P3; tests show this on a shared list of tokens.

The tools are run as `node scripts/agent-environment/check-brief.mjs <brief>` and `pnpm brief:check <brief>`, from
this worktree or from another one, on a brief whose named worktree is this one or another one; the resume-point
validator runs inside `node scripts/verify-repository.mjs` and `node scripts/check-agent-context.mjs`. Your tests
cover the first form and the validator directly.

## Scope

You may change `scripts/agent-environment/**`; commit once when done. Everything else is read-only. Add no
dependencies. Required checks: `node scripts/run-vitest.mjs run scripts` (again after your commit; the live test in
`scripts/check-frontier-preservation.test.ts` passes only on a clean tree), both checkers, and
`pnpm biome ci apps packages scripts`. If an outcome cannot be met, do not work around it: finish and measure the
others, then stop and report. (r04 B3)

## Report

Each outcome as PASS or FAIL with the command and the output line that proves it; the output of
`pnpm brief:check` on this brief; the files you changed; the commit SHA; anything you could not do.
