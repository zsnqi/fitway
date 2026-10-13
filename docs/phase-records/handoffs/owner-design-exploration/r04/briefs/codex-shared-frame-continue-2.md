<!-- brief-format: v1 role: codex -->
# Codex brief: one shared frame script, measured to the end in a fresh session (owner-design-exploration-r04)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `4352181f`
- **Milestone:** `owner-design-exploration-r04`. Decisions: as the briefs below name them.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/briefs/codex-shared-frame.md` in that worktree, the
    round's brief. Its Goal, outcomes F1-F4 and the reruns, limits L1-L2, Scope and Report hold for this run;
    everything it tells you to read, read.
  - `codex-shared-frame-continue.md` beside it: its P2 and P3 hold (its P1 is done: the patch was applied).
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md` §"Compare": the
    CLI the round's compares call changed after the round's brief was written.

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

- **Temp folder, sandbox, hooks, tools, ways to open the concept and the base:** as the round's brief's paragraphs of
  the same names. The base is the concept folder at `7e28c713`. **Ports:** 3176-3177 are yours; another round waits
  to measure until you report.

## Why this run

The session that did this round's work so far can no longer be resumed: its thread grew to about 48 MB, and the
service answers it with "Selected model is at capacity" or 503 on both models. Its work is committed at `4352181f`
(the frame code moved into `shared-frame.js`). Its measurements are in `D:/fitway-temp/owner-r04-shared-frame/`: the
job list `matrix-vfhold-435.json`, one folder per job in `D:/fitway-temp/owner-r04-shared-frame/live/` with
`measurement.json` (the SHA, the CLI revision, the counts) and `comparison.json`, its runner `matrix-runner-vfhold-435.mjs` and its progress script
`progress-vfhold-435.mjs` (95 jobs complete and 133 pending on 2026-10-13 at 14:15). Read them; reuse what is sound.

What it found, which you inherit:
- The CLI gained affected-page compares and kept baseline captures (vf-speed, `ebbfecd6`) and now holds a press's
  release and the page's clocks in `--timeline` (vf-hold, `f2c89624`); timeline jobs run before `f2c89624` are stale.
- Daily, the status details, English, phone, mouse, timeline 1-401 ms: 21 samples `DIFFERENT` in one run, all inside
  the Lights chip (F126), and `EQUAL` at every sample when the item ran alone; its record is
  `D:/fitway-temp/owner-r04-shared-frame/live/dense-status-diagnosis-vfhold-435.json`.
- Known instabilities at the base: F126 (Daily's Lights chip on the phone, half a pixel) and F148 (in a release's
  first 21 ms, an SVG icon inside a scaling button differs by one or two levels on one or two edge pixels).

## Goal

The round's brief is met: its Goal and every outcome and limit, measured as it states them, on the commit you deliver.

## Required outcomes

- **R1. The measurements finished.** Every F2 and F3 configuration the round's brief names is measured on the commit
  you deliver with the CLI in `D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/`
  (its code is `f2c89624`'s; later commits there change only `SKILL.md`), and judged by the round's rules. A recorded
  result counts only when one complete run produced it: its `measurement.json` has `completedAt` and an exit code,
  names that commit and that CLI code (`cliCodeRevision` or `cliHashes`), its `comparisonSha256` matches the
  `comparison.json` you read, and that file holds every item its `expectedItems` names with every sample; measure the
  rest. Kept baseline captures may be used: their verdicts equal a `--baseline-cache off` run's.
- **R2. The instabilities reported, not passed.** Any item or sample with a difference inside F126's chip or F148's
  edge pixels is rerun once alone and reported with its captures and its rerun's result, whatever else differs in it;
  a difference outside those regions is judged by the round's rules. One `NOT-HELD` on the result side only, after its
  rerun, goes in the report for the coordinator; do not count it as passing.
- **R3. The rest of the round holds.** F1, F4, L1, L2 and the continuation's P3 hold on the commit you deliver, each
  measured by you in this run (they are quick); no earlier record stands in for them.
- **R4. A change only on evidence.** Change the code only where a measurement shows the move changed what a user sees
  or does (a difference the base does not have in the same place, after its rerun). Then the round's rules for the
  change apply, and everything the change can reach is measured again.

## Scope

As the round's brief: you may change what its Scope names; commit once if R4 needs a change, otherwise commit nothing.
Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not work around it: finish and
measure the others, then stop and report. (B3)

## Report

As the round's brief's Report: each outcome and limit PASS or FAIL with the command and output line that proves it,
the SHA and CLI each measurement ran on, and which results you took from the records and which you measured; every
R2 item with its captures; the commit SHA you deliver. At most 30 lines.
