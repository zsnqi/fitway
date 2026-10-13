<!-- brief-format: v1 role: codex -->
# Codex brief: parallel compares, measured in a fresh session (owner-design-exploration-r04, vf-parallel)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-vf-parallel`, branch `owner-r04-vf-parallel`, HEAD `0fbad66d`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 47 and 48.
- **Read first, only these:**
  - `docs/phase-records/handoffs/owner-design-exploration/r04/briefs/codex-vf-parallel.md` in that worktree, the
    round's brief. Its Goal, outcomes P1-P4, limits L1-L3, the paragraphs on the sandbox, CI, the temp folder, the
    concept, the ports and the known instability, its Scope and its Report hold for this run; everything it tells you
    to read, read, as it stands at the HEAD above.

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

## Why this run

The session that wrote this round's code cannot continue on this model. Its code is committed at `0fbad66d` (nine
files under `.agents/skills/verify-fitway/`, among them the new `compare-parallel.test.mjs`), and the tree is clean.
It reported P4, L2 and L3 as passing and P1, P2, P3 and L1 as unmeasured: the ports were never released to it. Its run
folder is `D:/fitway-temp/codex-round-c9d939cf-0dbd-4bd8-ab8e-1b9a9eb7828e` (its report is `last-message.md`), and
its temp folder is `D:/fitway-temp/owner-r04-vf-parallel/`, which holds the base and result extracts and the kept
captures it made. Read them; reuse what is sound.

The ports stay as the round's brief says: the shared-frame round measures on 3176-3177 now, and you run no compare,
drive or launch on any port until `D:/fitway-temp/owner-r04-ports/free-for-vf-parallel.txt` exists. Until then,
review the committed code against P1-P4 and run the tests, whose tests choose their own ports.

## Goal

The round's brief is met: its Goal and every outcome and limit, measured as it states them, on the commit you deliver.

## Required outcomes

- **R1. Every measurement run.** P1, P2, P3 and L1 are measured as the round's brief states them, on the commit you
  deliver, after the release file exists; P4, L2 and L3 are measured again in this run on that commit, and no earlier
  report stands in for any of them.
- **R2. A change only on evidence.** Change the code only where a measurement or a test shows an outcome or limit
  failing. Then commit once, and measure again on the new commit everything the change can reach, which for a change
  to `compare.mjs`, `compare-runtime.mjs`, `baseline-cache.mjs`, `cache-lock.mjs`, `core.mjs`, `cli.mjs` or
  `runner.mjs` is every outcome and limit.

## Scope

As the round's brief: you may change what its Scope names; commit once if R2 needs a change, otherwise commit nothing.
Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not work around it: finish and
measure the others, then stop and report. (B3)

## Report

As the round's brief's Report: each outcome and limit PASS or FAIL with the command and output line that proves it and
the SHA it ran on; which code, if any, you changed and why; P2's wall times with 1 and 4 workers; every F126 or F148
rerun; the commit SHA you deliver. At most 30 lines.
