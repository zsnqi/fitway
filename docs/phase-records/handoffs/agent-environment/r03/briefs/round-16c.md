<!-- brief-format: v1 role: codex -->
# Codex brief: a path written as a pattern still protects its folder (agent-environment-r03, round 16c, repair 2)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r03-gardener`, branch `agent-environment-r03-gardener`, HEAD `eb5560d0`
- **Milestone:** `agent-environment-r03`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 16, 24.
- **Read first, only these:** `docs/phase-records/handoffs/agent-environment/r03/briefs/round-16b.md`
  §"Causes and required outcomes" (R5, your round 16b); `.agents/skills/gardener/SKILL.md` and the scripts beside it.

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
- No other round runs beside this one. Never run `git worktree remove`, `git worktree prune`, a removal command a
  survey proposes, or a generated `cleanup.mjs` against this machine's real worktrees or temp folders; tests that
  make or delete folders do so only in what they create, with their own temp root.
- In round 16b the survey's checks failed in your sandbox with `[ERR_PNPM_VERIFY_DEPS_BEFORE_RUN] The value of the
  enableGlobalVirtualStore setting has changed`, while the coordinator's survey of `eb5560d0` outside it completed
  (`D:/fitway-temp/r03-r16b-coordinator/survey-1/`). If that message blocks your survey again, do not install or
  reconfigure anything: report it, and measure R8 from the folder classification the survey still writes.

## Goal

A tracked file that cites a temp folder's evidence by a path written as a pattern protects that folder, while a
pattern standing for a folder not yet named protects nothing.

## Causes and required outcomes

- **R8. A path with a placeholder protects nothing.** `references` (`.agents/skills/gardener/facts.mjs:111`) ends a
  path at `<` and discards any path followed by `<` or holding `<`, `*` or `?` (`facts.mjs:145-160`).
  `docs/phase-records/handoffs/owner-design-exploration/r04/20261002-235032-owner-design-exploration-r04-resume.md:43`
  cites `D:/fitway-temp/owner-r04-k02/out/sheets/NN-<state>-<ar|en>.png`, and the survey of `eb5560d0` proposes
  `D:/fitway-temp/owner-r04-k02` (`D:/fitway-temp/r03-r16b-coordinator/survey-1/survey.json`). Outcome: a citation
  whose path holds a placeholder (`<...>`, `*`, `?` or `{...}`) protects the folder that its complete path segments
  before the first segment holding a placeholder name, when that folder is below the temp root; a placeholder in the
  first segment below the temp root (as in `D:/fitway-temp/<run>/` or `D:/fitway-temp/verify-fitway-*`) protects no
  folder; every R2 and R5 rule holds. On this machine a survey of `D:/fitway-temp` proposes each of survey-1's 31
  folders except `owner-r04-k02` and any that changed since, and names `owner-r04-k02`'s citation. Intent: a recorded
  path to evidence protects it even when its file names are written as a pattern, and the briefs' `<run>` pattern
  does not protect every folder.
- **R9. Proven.** Outcome: tests for R8, failing on `eb5560d0` and passing after, run in the fast ladder; every
  earlier gardener test still passes; `node scripts/verify.mjs fast` passes on your committed, clean tree; one survey
  on your committed tree (`.agents/skills/gardener/pass.ps1` with a fresh `-Out`) shows its proposed folders against
  survey-1's 31, each difference with its reason, and `repository unchanged=true`. Intent: shown on this machine's
  real temp root, not only on fixtures.

## Scope

You may change `.agents/skills/gardener/` and `.claude/skills/gardener/`; commit once when done. Everything else is
read-only. Add no dependencies. If an outcome cannot be met, do not work around it: finish and measure the others,
then stop and report. (B3)

## Report

Each outcome PASS or FAIL with the command and the output line that proves it; the files you changed; the commit SHA;
anything you could not do. At most 25 lines.
