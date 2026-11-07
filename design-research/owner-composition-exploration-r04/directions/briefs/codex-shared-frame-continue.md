<!-- brief-format: v1 role: codex -->
# Codex brief: one shared frame script, continued from a saved patch (owner-design-exploration-r04)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `32c1edcb`
- **Milestone:** `owner-design-exploration-r04`. Decisions: as the brief below names them.
- **Read first, only these:**
  `design-research/owner-composition-exploration-r04/directions/briefs/codex-shared-frame.md`, the round's brief.
  Its Goal, causes, outcomes F1-F4 and the reruns, limits L1-L2, Scope and Report hold unchanged for this run;
  everything it tells you to read, read.

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
- Drive C is short: keep output on D:. `TEMP` and `TMP` are already on drive D; never point them at `D:/fitway-temp`,
  whose folders the gardener inventories. (2026-09; agent-environment DECISIONS item 24)
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. (2026-10-02 retrospective)
<!-- environment:end -->

- **Temp folder, sandbox, hooks, tools, ways to open the concept and the base:** as that brief's paragraphs of the same
  names. The base is the folder at `7e28c713`, the HEAD that brief names (the HEAD above only adds two briefs to it).

## Why this run

An earlier run of that brief moved the frame code, then stopped on a server error ("Selected model is at capacity")
before it checked or committed anything, and its thread could not be resumed. Its uncommitted work is saved as
`D:/fitway-temp/owner-r04-shared-frame/previous-run/previous-run.patch` (12 files: the four page scripts, the four
pages, `INDEX.md`, the two index tools, and the new `shared-frame.js`; SHA-256 begins `e151eb4fee1833e2`). In its own
last words it removed 931 duplicated lines, left a 225-line shared file, and all scripts parsed; none of the brief's
outcomes was measured. Nothing in it is evidence.

## Goal

The round's brief is met: its Goal and every outcome and limit, measured as it states them.

## Required outcomes

- **P1. Start from the saved work.** Apply the patch to the worktree (`git apply`) before any other change; if it does
  not apply cleanly, stop and report. Then judge the moved code as yours: read it, and change it wherever an outcome
  of the round's brief needs it.
- **P2. The round's outcomes.** F1-F4 and the reruns, L1 and L2 of the round's brief, each measured as it states, on
  the commit you deliver (measure again whatever changed after a measurement; report the SHA each one ran on). The
  verify-fitway CLI and the recipes are not changed, and a tool in the folder that the Scope lets you change changes
  only to name the new script: no check is loosened.
- **P3. A clean tree.** Scratch files and scripts live in your temp folder, never in the worktree (the earlier run left
  two `.tmp-*` scripts at the worktree root): `git status --short` is empty after your commit, the commit adds no
  file outside the round's Scope, and it holds the whole change from `7e28c713`.

## Scope

As the round's brief: you may change what its Scope names; commit once when done. Everything else is read-only. Add
no dependencies. If an outcome cannot be met, do not work around it: finish and measure the others, then stop and
report. (B3)

## Report

As the round's brief's Report, and whether the patch applied cleanly. At most 30 lines.
