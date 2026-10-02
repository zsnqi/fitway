<!-- brief-format: v1 role: codex -->
# Codex brief: repair round after rounds 3 and 4 (agent-environment-r01, round 5)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r01`, branch `agent-environment-r01`, HEAD `d333762`
- **Milestone:** `agent-environment-r01`. Decisions: `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-environment/DECISIONS.md`
  items 3, 4 and 6.
- **Read first, only these:** `docs/phase-records/handoffs/agent-environment/briefs/codex-r4-brief-check.md` (its
  B1-B6 still hold except where this brief changes them); `scripts/agent-environment/check-brief.mjs`.

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

`brief:check` passes real briefs that follow the format, the script suite passes on a busy machine, and CI can
check out the repository on Windows.

## Causes and required outcomes

- **F1.** The two checker-output tests near `scripts/verify-repository.schema.test.ts:437` each run a checker twice,
  about 11 s a run, under Vitest's 20 s default, and time out. Outcome: they pass while a second full suite runs at
  the same time, and still assert what they assert now.
- **F2.** `check-brief.mjs` treats any backticked name with an extension as a repository-root path
  (`scripts/agent-environment/check-brief.mjs:84`), so a file mentioned by bare name after its full path fails.
  Outcome: a backticked token is a path only when it contains `/`; a bare name is a mention and is skipped. When a
  path with `/` is missing and exactly one tracked file in the worktree ends with it, the message names that file.
- **F3.** A brief names files the round will create, and they fail as missing, or as drift when the command's own
  repository already has them. Outcome: a path followed by ` (new)` must not exist in the worktree yet, its parent
  folder must exist or be another `(new)` path, and it is never reported as drift. A glob such as `.github/workflows/**` is
  checked by its folder.
- **F4.** CI's checkout fails on Windows: ten tracked asset paths exceed the path limit unless `core.longpaths` is
  set. Outcome: `.github/workflows/checks.yml` sets it before checking out, and every action it uses is pinned to a
  release tag that exists in that action's repository (say how you confirmed each). A fresh clone made with
  `core.longpaths` runs all five CI commands to a pass; report each.
- **F5.** A lowercase `## coordinator checklist` heading passes (`scripts/agent-environment/check-brief.mjs:366`).
  Outcome: the heading is matched in any case.

## Scope

You may change `scripts/agent-environment/**`, `scripts/verify-repository.schema.test.ts` and
`.github/workflows/**`; commit once when done. Everything else is read-only. Add no dependencies. Required checks:
`node scripts/run-vitest.mjs run scripts` (again after your commit; the live test in
`scripts/check-frontier-preservation.test.ts` passes only on a clean tree), both checkers, and
`pnpm biome ci apps packages scripts`. If an outcome cannot be met, do not work around it: finish and measure the
others, then stop and report. (r04 B3)

## Report

Each outcome as PASS or FAIL with the command and the output line that proves it; the output of
`pnpm brief:check` on this brief; the files you changed; the commit SHA; anything you could not do.
