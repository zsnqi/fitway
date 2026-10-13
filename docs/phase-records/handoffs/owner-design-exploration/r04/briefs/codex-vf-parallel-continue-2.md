<!-- brief-format: v1 role: codex -->
# Codex brief: parallel compares on the kept optimization, measured in a fresh session (owner-design-exploration-r04, vf-parallel)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-vf-parallel`, branch `owner-r04-vf-parallel`, HEAD `f3601821`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 47 and 48.
- **Read first, only these:**
  - `docs/phase-records/handoffs/owner-design-exploration/r04/briefs/codex-vf-parallel.md` in that worktree, the
    round's brief. Its Goal, outcomes P1-P4, limits L1-L3, the paragraphs on the sandbox, CI, the temp folder, the
    concept, the ports and the known instability, its Scope and its Report hold for this run; everything it tells you
    to read, read, as it stands at the HEAD above.
  - `D:/fitway-temp/owner-r04-vf-parallel/STOPPED-2026-10-14.md`, what the stopped session measured and left.

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
- Return your report as your final message, not as a file. Any message without a tool call is your final message:
  it ends your run and stops what you started, so wait inside a tool call and write it once, as the report.
  (2026-10-02 retrospective; F154)
<!-- environment:end -->

## Why this run

Two earlier sessions wrote and measured this round's code; the second was stopped on 2026-10-14 at the user's request,
for a fresh session. The code is `0fbad66d` plus `f3601821` (fewer manifest rewrites in `runner.mjs`), which the
user chose to keep because it may make compares faster. Every measurement in `STOPPED-2026-10-14.md` ran on
`0fbad66d` or was cut off, and its timings ran while another session loaded the machine, so none of them stands in for
a result on the commit you deliver. The temp folder `D:/fitway-temp/owner-r04-vf-parallel/` keeps the base and result
extracts, the earlier `measure.mjs` and its records: read them and reuse what is sound.

The ports are free and yours: `D:/fitway-temp/owner-r04-ports/free-for-vf-parallel.txt` exists. The coordinator runs
nothing else on this machine while you time P2.

## Goal

The round's brief is met: its Goal and every outcome and limit, measured as it states them, on the commit you deliver.

## Required outcomes

- **R1. Every measurement run on the delivered commit.** P1, P2, P3, P4 and L1-L3 are measured as the round's brief
  states them, on the commit you deliver; no earlier record stands in for any of them.
- **R2. Every pair gives the real verdicts.** P1's two and three compares run the result against the base, in place
  of the base against itself, and each gives the items, their order, verdicts and failures that the same command gives
  on 3176-3177 with 1 worker; P3's runs of "Reports' P1 command" are this command.
- **R3. Timings that can be trusted.** Each P2 timing runs with nothing else of yours running on the machine. When
  a command's 4-worker time lands between 45% and 55% of its 1-worker time, that pair runs twice more, alternating
  (1, 4, 1, 4), and the medians are the result; the report gives every run.
- **R4. A change only on evidence.** Change the code only where a measurement or a test shows an outcome or limit
  failing. Then commit once, and measure again on the new commit everything the change can reach, which for a change
  to `compare.mjs`, `compare-runtime.mjs`, `baseline-cache.mjs`, `cache-lock.mjs`, `core.mjs`, `cli.mjs` or
  `runner.mjs` is every outcome and limit.

## Scope

As the round's brief: you may change what its Scope names; commit once if R4 needs a change, otherwise commit nothing.
Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not work around it: finish and
measure the others, then stop and report. (B3)

## Report

As the round's brief's Report: each outcome and limit PASS or FAIL with the command and output line that proves it and
the SHA it ran on; which code, if any, you changed and why; P2's wall times, every run of each pair;
every F126 or F148 rerun; the commit SHA you deliver. At most 30 lines.
