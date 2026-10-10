<!-- brief-format: v1 role: codex -->
# Codex brief: the gardener's link test passes under a short temp path (agent-environment-r03, round 18)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r03-gardener`, branch `agent-environment-r03-gardener`, HEAD `c08f83e4`
- **Milestone:** `agent-environment-r03`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 16, 17.
- **Read first, only these:** `.agents/skills/gardener/round16.test.ts` and the gardener scripts it imports.

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
- No other round runs beside this one. Drive D makes no 8.3 short names, so the short-path condition below uses
  `C:/Users/PCFORC~1/AppData/Local/Temp/<run>` (`PCFORC~1` is the short name of `C:/Users/Pc Force`); the tests write
  a few kilobytes there; remove only the `<run>` folders you create.

## Goal

The fast ladder passes on CI's Windows runner, whose temp folder is an 8.3 short path, as it does on this machine.

## Causes and required outcomes

- **T1. The R1 test expects the short path.** CI run of `c08f83e4` (workflow `.github/workflows/checks.yml`) failed
  one test, `round16.test.ts` "R1: real junctions are reported; proposed commands preserve outside data and recheck
  links" (`.agents/skills/gardener/round16.test.ts:120-127`): the fixture lives under `os.tmpdir()`
  (`C:/Users/RUNNER~1/...` there), the expectation builds the link path from it, and the gardener reports the path
  Git lists (`C:/Users/runneradmin/...`). With `TEMP` and `TMP` set to `C:/Users/PCFORC~1/AppData/Local/Temp/<run>`
  the same test fails on this machine; with `D:/fitway-temp` it passes. Outcome: every test under
  `.agents/skills/gardener/` passes with `TEMP` and `TMP` set to a short-name path as above and with them set to
  `D:/fitway-temp`; each assertion still checks the same facts (the link's path, that it is outside, its target, the
  candidate flags), compared as the same folder whichever spelling the operating system gives. Intent: the test
  proves the gardener's behaviour on any Windows temp folder, not the spelling of one.
- **T2. Proven.** Outcome: `node scripts/verify.mjs fast` passes on your committed, clean tree, once with `TEMP` and
  `TMP` set to the short-name path and once with `D:/fitway-temp`. Intent: the next CI run is green for this cause.

## Scope

You may change `.agents/skills/gardener/*.test.ts`; commit once when done. Everything else, including the gardener's
scripts, is read-only. Add no dependencies. If an outcome cannot be met, do not work around it: finish and measure
the others, then stop and report. (B3)

## Report

Each outcome PASS or FAIL with the command and the output line that proves it; the files you changed; the commit SHA;
anything you could not do. At most 20 lines.
