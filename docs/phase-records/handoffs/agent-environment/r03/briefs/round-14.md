<!-- brief-format: v1 role: codex -->
# Codex brief: verify-fitway previews free their ports (agent-environment-r03, round 14)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r03-verify`, branch `agent-environment-r03-verify`, HEAD `03c96437`
- **Milestone:** `agent-environment-r03`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 15, 23.
- **Read first, only these:** `docs/phase-records/handoffs/agent-environment/findings.tsv` rows F095-F097;
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
- No other round runs beside this one. If 3176 or 3177 is held by a process you did not start, never stop it; to
  prove W1, hold the ports with a process you start, and stop it when done.
- W4's concept is `design-research/owner-composition-exploration-r04/directions/eclipse` of `owner-followup-r04-build`
  at `ec314ce2`, read from your own `git archive` in your run folder, never from its worktree; its recipes are there.

## Goal

A verify-fitway preview never holds 3176 or 3177 after nobody uses it, and the fast ladder passes whether or not
another process holds them.

## Causes and required outcomes

- **W1. The ladder needs 3176-3177 free.** `cli.test.mjs` binds the verification ports itself (`:649-674`,
  `:794-824`, `:825-861`; V3 at `:994-1019` reaches the port check), and the fast ladder runs these tests
  (`scripts/verify.mjs:372`). On `03c96437`, with another process listening on 127.0.0.1 at 3176 and 3177,
  `pnpm test:verification` fails 4 of 39; with both free it passes 39. Outcome: `pnpm test:verification` and
  `node scripts/verify.mjs fast` pass while another process listens on 3176 and 3177, and every behaviour those four
  tests cover is still exercised in that condition. Limits, each its own outcome: no test binds 3174 or 3178-3185
  (other previews); `launch`, `doctor`, `drive` and `compare` still refuse any `--port` but 3176-3177; if the round
  adds another way to choose a port, `help` names it and it never selects 3174 or 3178-3185. Intent: one round's
  ladder does not depend on another round's preview, and nobody can launch onto another preview's port.
- **W2. A forgotten preview never stops.** `launch` starts the preview detached and unreferenced
  (`cli.mjs:337-357`, `:407`); only `cleanup` or the token-checked stop route (`core.mjs:138-141`) ends it. Replay
  fix-3's agent never ran cleanup and 3176 stayed served after the round (session
  `D:/fitway-temp/replay/fix-3/preview/session.json`). Outcome: an owned preview that receives no request for 30
  minutes stops itself, frees its port and leaves no process; a preview that keeps receiving requests keeps serving;
  after a self-stop, `cleanup` of its session passes saying the preview had already stopped, and `doctor` or `drive`
  given that session fails with a FIX that relaunches. `help` and SKILL.md state the 30 minutes, and a test can
  shorten it. Intent: a preview someone forgot blocks the next round for at most the bound; a preview in use is never
  cut; the SKILL.md flow (launch, then commands with `--session`, then cleanup) still works.
- **W3. Cleanup passes when it stopped nothing.** `cleanup` looks for `session.json` inside the path it is given
  (`cli.mjs:418-422`) and prints `CLEANUP PASS: no owned preview started` when it is not there. On `03c96437`, after
  `launch --port 3176`, both `cleanup --session <out>/session.json` and `cleanup --session <a path that does not
  exist>` print that PASS with 3176 still served. Outcome: `cleanup` prints PASS only when no preview its session
  started is still serving: given the session file it stops that preview or fails naming the folder to give; given a
  path that does not exist it fails naming the path; a launch folder with no session (a refused launch) and a cleaned
  session still pass as now. Intent: PASS means the session's port is free.
- **W4. Proven.** Outcome: tests for W1-W3, each failing on `03c96437` and passing after, run in the fast ladder;
  `node scripts/verify.mjs fast` passes on your committed, clean tree, once with 3176-3177 free and once held by a
  process you start; on the build's Eclipse concept, `launch`, `doctor --session`, one `drive --session` and
  `cleanup` pass and the port is free after. Intent: the repairs are shown, not claimed.

## Scope

You may change `.agents/skills/verify-fitway/` and `.claude/skills/verify-fitway/`; commit once when done. Everything
else is read-only. Add no dependencies. If an outcome cannot be met, do not work around it: finish and measure the
others, then stop and report. (B3)

## Report

Each outcome PASS or FAIL with the command and the output line that proves it; the files you changed; the commit SHA;
anything you could not do. At most 25 lines.
