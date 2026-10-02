<!-- brief-format: v1 role: codex -->
# Codex brief: repairs from the acceptance review (agent-environment-r01, round 8)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r01`, branch `agent-environment-r01`, HEAD `ef28fa6`
- **Milestone:** `agent-environment-r01`. Decisions: `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-environment/DECISIONS.md`
  items 2, 3 and 6.
- **Read first, only these:** `docs/agent-context/HANDOFF_TEMPLATE.md`; `scripts/agent-environment/resume-point.mjs`;
  `scripts/agent-environment/new-handoff.mjs`; `scripts/show-agent-context.mjs` (the resume-point ending it prints).

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

A resume point cannot pass the checks while unmarked or still holding the template's placeholders; the tools that
recognize a resume point agree; and the startup instructions do not contradict the brief environment.

## Causes and required outcomes

- **S1.** The validator applies no rule to a file without the resume-point marker
  (`scripts/agent-environment/resume-point.mjs:60`), so an unmarked file with four sections passes. Older handoffs
  (activation logs and the like) have no marker and must stay accepted. Outcome: a file named the way
  `handoff:new` names resume points fails when it lacks the marker; other unmarked handoffs pass as before.
- **S2.** `handoff:new` fills only the "As of" and "Previous resume point" lines
  (`scripts/agent-environment/new-handoff.mjs:215`), and the unedited template passes the checks with its
  placeholders. Outcome: a resume point that still contains any placeholder text from
  `docs/agent-context/HANDOFF_TEMPLATE.md` fails, naming the line; the "Standing decisions" line must name a
  DECISIONS file that exists. Text that only looks like a placeholder, such as a file-name pattern written with angle
  brackets, is not a template placeholder and passes.
- **S3.** `scripts/show-agent-context.mjs` recognizes a resume point by the marker at the very start of the file, the
  validator by the marker anywhere, so a file with a UTF-8 BOM passes the checks but loses context:show's "read in
  full" line. Outcome: both recognize exactly the same files, with or without a BOM.
- **S4.** On a detached HEAD, `handoff:new` fails with Git's raw message (`scripts/agent-environment/new-handoff.mjs:208`).
  Outcome: one line saying that a branch must be checked out, and a non-zero exit.
- **S5.** `AGENTS.md:15` and `docs/WORKFLOW.md:132` tell every session to run `git fetch`, while every brief's
  environment block tells the delegated agent never to fetch. Outcome: the startup instruction says who fetches (the
  session that starts from the startup route) and that a delegated agent follows its brief; the brief environment
  block (`docs/agent-context/briefs/ENVIRONMENT.md`) stays unchanged, so briefs that pass today still pass.

Required unchanged (B7): the two resume points named by
`D:/Projects/fitway-worktrees/owner-design-exploration-r04/PROJECT_STATE.yaml` (key `handoff` of each milestone)
pass `validateActiveResumePoints` with that worktree as the repository root, before and after your change; check
this first.

## Scope

You may change `scripts/agent-environment/**`, `scripts/show-agent-context.mjs`, `scripts/show-agent-context.test.ts`,
`AGENTS.md` and `docs/WORKFLOW.md` (S5's wording only); commit once when done. Everything else is read-only. Add no
dependencies. Required checks: `node scripts/run-vitest.mjs run scripts` (again after your commit; the live test in
`scripts/check-frontier-preservation.test.ts` passes only on a clean tree), both checkers, and
`pnpm biome ci apps packages scripts`. If an outcome cannot be met, do not work around it: finish and measure the
others, then stop and report. (r04 B3)

## Report

Each outcome as PASS or FAIL with the command and the output line that proves it; the files you changed; the commit
SHA; anything you could not do.
