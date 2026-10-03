<!-- brief-format: v1 role: codex -->
# Codex brief: folder references and short paths (agent-environment-r01, round 7)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r01`, branch `agent-environment-r01`, HEAD `dc8d2e0`
- **Milestone:** `agent-environment-r01`. Decisions: `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-environment/DECISIONS.md`
  items 3 and 6.
- **Read first, only these:** `docs/phase-records/handoffs/agent-environment/briefs/codex-r6-path-tokens.md` §"Causes and required outcomes"
  (P1-P5 still hold); `scripts/agent-environment/path-reference.mjs`; `scripts/agent-environment/resume-point.mjs`;
  `scripts/agent-environment/check-brief.mjs`.

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

Both tools accept a reference to a folder that exists, and both work when a path they compare is a Windows short
(8.3) path, as the GitHub runner's TEMP is.

## Causes and required outcomes

- **Q1.** Since round 6, the resume-point validator requires an absolute reference to be a file
  (`scripts/agent-environment/resume-point.mjs:94`; its repository-relative branch does the same), so a reference to an existing folder fails.
  The two live resume points name folders by absolute path with a trailing `/`, and both passed before round 6.
  Outcome: in resume points and in briefs, a reference to an existing folder passes, relative or absolute, with or
  without a trailing `/`; a missing folder still fails. The two resume points named by
  `D:/Projects/fitway-worktrees/owner-design-exploration-r04/PROJECT_STATE.yaml` (key `handoff` of each milestone)
  pass `validateActiveResumePoints` with that worktree as the repository root, as they did at `e306a85`.
- **Q2.** CI run 37063118711 (GitHub, `windows-latest`, commit `a7c9ecc`) fails nine tests in
  `scripts/agent-environment/check-brief.test.ts` with "named worktree is not a Git worktree root": the test's
  worktree lives under TEMP, which on the runner is the short path C:/Users/RUNNER~1/..., and
  `scripts/agent-environment/check-brief.mjs:122` compares it with the long path Git returns. Outcome: the script
  suite passes with TEMP and TMP set to a short 8.3 path; `check-brief.mjs` accepts a named worktree written as a
  short path, a long path, or with different letter case; and every other place in `scripts/agent-environment/**`
  that compares two paths gives the same answer for those forms. Say how you produced a short path on this machine
  and that the suite failed with it before your change.

The tools are run as `node scripts/agent-environment/check-brief.mjs <brief>` and `pnpm brief:check <brief>`, from
this worktree or another; the resume-point validator runs inside `node scripts/verify-repository.mjs` and
`node scripts/check-agent-context.mjs`. CI runs `.github/workflows/checks.yml` on `windows-latest`; you cannot run it,
so reproduce its condition locally.

## Scope

You may change `scripts/agent-environment/**`; commit once when done. Everything else is read-only. Add no
dependencies. Required checks: `node scripts/run-vitest.mjs run scripts` (again after your commit; the live test in
`scripts/check-frontier-preservation.test.ts` passes only on a clean tree), the same suite with TEMP and TMP set to a
short path, both checkers, and `pnpm biome ci apps packages scripts`. If an outcome cannot be met, do not work around
it: finish and measure the others, then stop and report. (r04 B3)

## Report

Each outcome as PASS or FAIL with the command and the output line that proves it; the files you changed; the commit
SHA; anything you could not do.
