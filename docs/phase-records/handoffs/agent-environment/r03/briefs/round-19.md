<!-- brief-format: v1 role: codex -->
# Codex brief: a verify-fitway refusal names the foreign process on the session's port (agent-environment-r03, round 19)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r03-r19`, branch `agent-environment-r03-r19`, HEAD `f2daff93`
- **Milestone:** `agent-environment-r03`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 15, 23.
- **Read first, only these:** `docs/phase-records/handoffs/agent-environment/findings.tsv` row F105;
  `.agents/skills/verify-fitway/SKILL.md` §"Launch and drive", and the scripts beside it.

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
- Drive C is full: keep temp output on D:, and set `TEMP`/`TMP` to `D:/fitway-temp` for a command that writes much. (2026-09)
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. (2026-10-02 retrospective)
<!-- environment:end -->

- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Playwright, Node scripts that run git) fail inside it:
  request escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- If 3176 or 3177 is held by a process you did not start, never stop it; to prove an outcome on those ports, hold
  them with a process you start and stop it when done.
- V2's concept is `design-research/owner-composition-exploration-r04/directions/eclipse` of `owner-followup-r04-build`
  at `ec314ce2`, read from your own `git archive` in your run folder, never from its worktree; its recipes are there.

## Goal

When verify-fitway refuses a session because another process also listens on the session's port, the message says
so and names that process, instead of claiming the session does not serve the port.

## Causes and required outcomes

- **V1. The refusal hides the foreign pid and misstates the cause (F105).** `ownedSession`
  (`.agents/skills/verify-fitway/core.mjs:325-381`) answers a foreign listener beside the session's own preview with
  the generic refusal (`core.mjs:331-335`), and the pid goes only into the error's cause (`core.mjs:375-379`), which
  is not printed. On `f2daff93`, a session launched on 3176 (listening on 127.0.0.1) with a second process listening
  on `::1` port 3176 printed, for `doctor --session` and `cleanup --session` alike, `Port 3176 is not owned by this
  session (not served by this session); refuse session.` with no pid, while the session's preview still answered;
  after that process stopped, `cleanup --session` passed. Outcome: in that situation `doctor`, `cleanup` and
  `drive` given the session each fail with a printed message that names the port and every foreign pid listening on
  it, and does not say the session's preview is not serving; the foreign process keeps listening; nothing in the
  message tells the user to stop a process; the session is still refused, as on the base; once the foreign process
  is gone, `cleanup --session` passes as on the base. The messages for a session whose preview has stopped, and for a
  port answered only by a foreign server, keep their meaning. Intent: the user sees which process shares the port
  and that their session is otherwise intact, so they can decide what to do about it.
- **V2. Proven.** Outcome: a test for V1, failing on `f2daff93` and passing after, runs in the fast ladder;
  `pnpm test:verification` and `node scripts/verify.mjs fast` pass on your committed, clean tree, once with 3176-3177
  free and once held by a process you start; `--port` still refuses all but 3176-3177; on the build's Eclipse
  concept, `launch`, `doctor --session`, one `drive --session` and `cleanup` pass and the port is free after. Intent:
  the repair is shown, not claimed, and nothing that worked stops working.

## Scope

You may change `.agents/skills/verify-fitway/` and `.claude/skills/verify-fitway/`; commit once when done. Everything
else is read-only. Add no dependencies. If an outcome cannot be met, do not work around it: finish and measure the
others, then stop and report. (B3)

## Report

Each outcome PASS or FAIL with the command and the output line that proves it; the files you changed; the commit SHA;
anything you could not do. At most 25 lines.
