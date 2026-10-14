<!-- brief-format: v1 role: codex -->
# Codex brief: verify-fitway session messages name the real port and owner (agent-environment-r03, round 17)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r03-verify`, branch `agent-environment-r03-verify`, HEAD `edaf626c`
- **Milestone:** `agent-environment-r03`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 15, 23.
- **Read first, only these:** `docs/phase-records/handoffs/agent-environment/findings.tsv` rows F101, F102;
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
- Round 16 runs beside this one in `D:/Projects/fitway-worktrees/agent-environment-r03-gardener` and does not use
  3176 or 3177. If 3176 or 3177 is held by a process you did not start, never stop it; to prove an outcome on those
  ports, hold them with a process you start and stop it when done.
- V3's concept is `design-research/owner-composition-exploration-r04/directions/eclipse` of `owner-followup-r04-build`
  at `ec314ce2`, read from your own `git archive` in your run folder, never from its worktree; its recipes are there.

## Goal

When a verify-fitway session can no longer be used, its messages name the port that is actually usable and say
plainly when a port belongs to someone else.

## Causes and required outcomes

- **V1. The relaunch FIX names the other port (F101).** `doctorFix` (`.agents/skills/verify-fitway/cli.mjs:314`)
  answers a port or session error with `launch --port 3177` unless `--port 3177` was passed, and `doctor --session`
  passes no port. On `edaf626c`, a session launched on 3176 that expired after its idle bound, then
  `doctor --session` on it, printed a FIX with `--port 3177` while 3176 was free. Outcome: a relaunch FIX names a
  verification port that is free when the FIX is printed, the session's own port first when there is a session;
  when neither 3176 nor 3177 is free it names no port as usable, says both are held, and does not tell the user to
  stop any process; run as printed, the FIX launches. Intent: the next command the user copies works, and never
  lands on another preview's port.
- **V2. A foreign server on the session's port surfaces as a JSON error (F102).** `ownedSession`
  (`.agents/skills/verify-fitway/core.mjs:325`) parses the identity response as JSON (`core.mjs:350`) whatever the
  server sent. On `edaf626c`, after a session's preview died and another process served plain text on its port,
  `cleanup --session` and `doctor --session` both failed with `Unexpected token 'o', "foreign 127"... is not valid
  JSON`. Outcome: whatever a foreign server on the session's port answers (any status, any body, or no response),
  `cleanup`, `doctor` and `drive` given that session fail saying the port is not served by this session and naming
  the port; no message is a parse error; the foreign server keeps serving; an owned session still passes and cleans
  up as before. Intent: the user learns at once that another process holds the port, and nothing stops it.
- **V3. Proven.** Outcome: tests for V1 and V2, each failing on `edaf626c` and passing after, run in the fast ladder;
  `pnpm test:verification` and `node scripts/verify.mjs fast` pass on your committed, clean tree, once with 3176-3177
  free and once held by a process you start; `--port` still refuses all but 3176-3177; on the build's Eclipse
  concept, `launch`, `doctor --session`, one `drive --session` and `cleanup` pass and the port is free after. Intent:
  the repairs are shown, not claimed, and nothing that worked stops working.

## Scope

You may change `.agents/skills/verify-fitway/` and `.claude/skills/verify-fitway/`; commit once when done. Everything
else is read-only. Add no dependencies. If an outcome cannot be met, do not work around it: finish and measure the
others, then stop and report. (B3)

## Report

Each outcome PASS or FAIL with the command and the output line that proves it; the files you changed; the commit SHA;
anything you could not do. At most 25 lines.
