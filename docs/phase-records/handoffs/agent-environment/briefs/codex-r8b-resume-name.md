<!-- brief-format: v1 role: codex -->
# Codex brief: one name for resume points (agent-environment-r01, round 8b)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r01`, branch `agent-environment-r01`, HEAD `c071d87`
- **Milestone:** `agent-environment-r01`. Decisions: `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-environment/DECISIONS.md`
  items 2 and 6.
- **Read first, only these:** `docs/phase-records/handoffs/agent-environment/briefs/codex-r8-acceptance-repairs.md`
  §"Causes and required outcomes" (S1, which this round settles; S2-S5 are done); `scripts/agent-environment/new-handoff.mjs`;
  `scripts/agent-environment/resume-point.mjs`.

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

A resume point has one name, so the checks can tell it from older handoffs without guessing.

## Causes and required outcomes

- **S1.** `handoff:new` accepts any slug (`scripts/agent-environment/new-handoff.mjs:205`), so a resume point's name
  cannot be told from older handoffs such as `...-coordinator-resume.md` or `...-resume-activation.md`, which carry no
  marker. The coordinator's rule (2026-10-03): a resume point is named `<YYYYMMDD-HHMMSS>-<milestone-id>-resume.md`,
  where `<milestone-id>` is the `PROJECT_STATE.yaml` key of the milestone whose `handoff` names it. Outcome:
  `handoff:new` always writes that name and no other, and its usage line says so; a milestone's active handoff with
  exactly that name fails the checks when it lacks the marker; an active handoff with any other name is treated as
  before.

Required unchanged (B7): the two resume points named by
`D:/Projects/fitway-worktrees/owner-design-exploration-r04/PROJECT_STATE.yaml` (key `handoff` of each milestone)
pass `validateActiveResumePoints` with that worktree as the repository root, before and after your change.

## Scope

You may change `scripts/agent-environment/**` and `package.json`'s `handoff:new` entry if its arguments change;
commit once when done. Everything else is read-only. Add no dependencies. Required checks:
`node scripts/run-vitest.mjs run scripts` (again after your commit; the live test in
`scripts/check-frontier-preservation.test.ts` passes only on a clean tree), both checkers, and
`pnpm biome ci apps packages scripts`. If the outcome cannot be met, do not work around it: stop and report. (r04 B3)

## Report

The outcome as PASS or FAIL with the command and the output line that proves it; the files you changed; the commit
SHA; anything you could not do.
