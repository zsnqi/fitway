<!-- brief-format: v1 role: codex -->
# Codex brief: <title> (<milestone-id>, round <n>)

- **Worktree:** `D:/Projects/fitway-worktrees/<worktree>`, branch `<branch>`, HEAD `<short-sha>`
- **Milestone:** `<milestone-id>`. Decisions: `<repo path to DECISIONS.md>` items <n, m>.
- **Read first, only these:** `<repo path>` §"<heading>" or rows `<ID, ID>`; one line each.

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

## Goal

<One or two sentences: what is true after this round.>

## Causes and required outcomes

- **<X>1.** <The cause, with `path:line` evidence.> Outcome: <an observable result, not an approach>.

## Scope

You may change `<paths>`; commit once when done. Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not
work around it: finish and measure the others, then stop and report. (r04 B3)

## Report

Each outcome as PASS or FAIL with the command and the output line that proves it; the files you changed; the commit
SHA; anything you could not do.

## Coordinator checklist (delete before launch)

- [ ] Goal, cause and outcomes only; the approach is left open (B4). One change, aimed at one cause (B6).
- [ ] Every way to open and run the artifact is named, with the ones the checks cover (B1).
- [ ] The baseline meets each required outcome under each condition, or the condition is marked "unchanged from the
      baseline" (B2, B7).
- [ ] Every command an outcome requires was run on the baseline in that scope first: `pnpm biome check .` has 21
      older errors in `design-research/**`, which Biome's config excludes anyway, and `git ls-files -ci` lists the
      local `.claude/` exclude (agent-environment rounds 3, 4; nav-2).
- [ ] No verifier probe, threshold or held-out check, and no `fitway-grader` path (B5).
- [ ] A test suite that needs a clean tree is run after the commit (agent-environment round 2).
- [ ] Every field is a pointer (path and §heading, row IDs, decision numbers); nothing is pasted from a source.
- [ ] `pnpm brief:check <this file>` passes against the worktree it names.
