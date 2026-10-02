<!-- brief-format: v1 role: codex -->
# Codex brief: `pnpm brief:check` (agent-environment-r01, round 4)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r01`, branch `agent-environment-r01`, HEAD `3d80304`
- **Milestone:** `agent-environment-r01`. Decisions: `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-environment/DECISIONS.md`
  items 3, 4 and 6 (that file lives on the coordinator's branch).
- **Read first, only these:** `docs/agent-context/briefs/ENVIRONMENT.md`; `docs/agent-context/briefs/codex.md`
  (a template is also an example of the format); `scripts/agent-environment/resume-point.mjs` (the style to follow).

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

Before every launch, one command shows whether a brief can be followed in the worktree it names.

## Causes and required outcomes

- **B1.** Briefs cited files that did not exist in the agent's worktree, because the coordinator's branch and the
  build branch drift apart. Outcome: `pnpm brief:check <brief>` reads the brief's Worktree line and checks there:
  the worktree exists, its current branch matches the line, the named HEAD is the worktree's HEAD or an ancestor
  of it whose later commits change only Markdown files (the coordinator commits the brief after naming HEAD),
  and every backticked path exists in it.
  Repository-relative paths resolve against that worktree, absolute paths as they are; a path inside `<…>` or under
  `D:/fitway-temp/` is skipped. A `§"heading"` after a path must exist as a heading of that file; a `path:line`
  must not exceed the file's length. A repository-relative path that is missing in the worktree but present in the
  repository the command runs from is reported as drift, naming both.
- **B2.** Briefs drift from the shared rules. Outcome: a brief must start with
  `<!-- brief-format: v1 role: <codex|builder|designer|verifier> -->`, and its block between
  `<!-- environment:start v1 -->` and `<!-- environment:end -->` must equal `docs/agent-context/briefs/ENVIRONMENT.md`
  (line endings ignored). The command can write that block into a brief whose markers are empty
  (`--fill-environment`), and changes nothing else in the file.
- **B3.** Outcome: a brief fails when it still has a `## Coordinator checklist` section or an unfilled placeholder
  (`<…>` outside the environment block and outside code spans, HTML comments excluded); a `codex` brief also fails
  when it mentions `fitway-grader` or "held-out", in any case.
- **B4.** Outcome: more than 80 lines prints a warning, never a failure (DECISIONS item 4). Every problem prints
  as one line with its line number; the exit code is 0 or 1. The four templates fail (they hold placeholders), and
  the check tells which rule each failure breaks.
- **B5.** Unit tests in `scripts/agent-environment/` cover B1-B4 with temporary fixtures, including a temporary git
  worktree for branch, HEAD and drift. `node scripts/run-vitest.mjs run scripts`, both checkers and
  `pnpm biome check .` pass; run the full suite again after your commit (the live test in
  `scripts/check-frontier-preservation.test.ts` passes only on a clean tree).

- **B6.** Nothing runs the checks on push; round 3 stopped because the repository pins no Node version. Outcome:
  `.github/workflows/checks.yml` runs on push and pull request, on `windows-latest`, with `permissions: contents: read`,
  Node `24.14.0` (the version every agent runs locally) and pnpm from `packageManager`; then
  `pnpm install --frozen-lockfile`, `pnpm biome ci apps packages scripts` (the scope with no errors today;
  `design-research/**` has 21 older ones), `node scripts/check-agent-context.mjs`, `node scripts/verify-repository.mjs`
  and `node scripts/run-vitest.mjs run scripts`. No one can watch a GitHub run from this machine, so run the same
  commands in a fresh clone of your commit under the system temp folder and report each step; a step that cannot
  pass on a fresh clone is named with its cause.

## Scope

You may change `scripts/agent-environment/**`, `.github/workflows/**` and the `scripts` entries of `package.json`;
commit once when done.
Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not work around it: finish and
measure the others, then stop and report. (r04 B3)

## Report

Each outcome as PASS or FAIL with the command and the output line that proves it; the output of
`pnpm brief:check` on this brief and on `docs/agent-context/briefs/codex.md`; the files you changed; the commit SHA;
anything you could not do.
