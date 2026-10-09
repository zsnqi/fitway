<!-- brief-format: v1 role: codex -->
# Codex brief: the gardener reads the real ladder and surveys only runnable checks (agent-environment-r03, round 15)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r03-gardener`, branch `agent-environment-r03-gardener`, HEAD `32ac00be`
- **Milestone:** `agent-environment-r03`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 16, 20.
- **Read first, only these:** `.agents/skills/gardener/REPORT.md` (the 2026-10-09 pass), its "Correction seen twice"
  and "Gate gaps" rows; `.agents/skills/gardener/SKILL.md` and the scripts beside it.

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
- Round 14 runs beside this one in `D:/Projects/fitway-worktrees/agent-environment-r03-verify` and may hold ports
  3176-3177; if `node scripts/verify.mjs fast` fails only in "Verification CLI contracts" on a held port, wait with
  Monitor until both are free (up to 90 minutes), never stop a process you did not start.
- A survey writes only under `D:/fitway-temp/`; give each run a fresh `-Out` folder there.

## Goal

A change to the fast ladder's shape fails the ladder where it is made, and the weekly outcome is not blocked by a
check that cannot run without arguments, while that check stays visible in the report.

## Causes and required outcomes

- **G1. Only a fixture tests the ladder parser.** `parseFastSteps` (`.agents/skills/gardener/facts.mjs`) is tested on
  a fixture string (`.agents/skills/gardener/facts.test.ts:277-297`). `1b4c813d` gave the real ladder's unit step a
  third element; the fast ladder stayed green while the 2026-10-09 survey blocked, and `fb8fd51e` repaired the parser.
  Outcome: the fast ladder runs a test that reads the real `scripts/verify.mjs` and fails when the gardener cannot read
  its steps (with `fb8fd51e`'s parser change reverted, that test fails); it asserts what the gardener needs from each
  step, not a frozen copy of the file, so an ordinary new step does not fail it. Intent: the next shape change turns
  red in the commit that makes it, not a week later.
- **G2. The survey runs every check bare.** `runChecks` runs each `check:*` script with no arguments
  (`.agents/skills/gardener/survey.mjs:489-491`). `check:concept-css` requires a concept folder and exits 2 with its
  usage line (`scripts/check-concept-css.mjs:483`), so each pass reports it failing and ends blocked. Decision
  (coordinator, 2026-10-09): the survey does not run it until it enters the fast ladder after the Owner CSS round
  (DECISIONS item 20). Outcome: a survey reports `check:concept-css` as not run, with that reason, and its outcome is
  not blocked by it; every other check that exits non-zero, including one that prints a usage line, still counts as
  failing; a check named as not run that `package.json` does not define is reported; the reason lives in one place the
  coordinator edits, not in code. Intent: the weekly outcome reflects real faults, and a check the survey skips is
  never silently dropped.
- **G3. Proven.** Outcome: tests for G1 and G2, each failing on `32ac00be` and passing after, run in the fast ladder;
  `node scripts/verify.mjs fast` passes on your committed, clean tree; one survey on your committed tree
  (`.agents/skills/gardener/pass.ps1` with a fresh `-Out`) shows `check:concept-css` as not run with its reason and
  `repository unchanged=true`. Intent: the repairs are shown, not claimed.

## Scope

You may change `.agents/skills/gardener/` and `.claude/skills/gardener/`; commit once when done. Everything else is
read-only. Add no dependencies. If an outcome cannot be met, do not work around it: finish and measure the others,
then stop and report. (B3)

## Report

Each outcome PASS or FAIL with the command and the output line that proves it; the files you changed; the commit SHA;
anything you could not do. At most 25 lines.
