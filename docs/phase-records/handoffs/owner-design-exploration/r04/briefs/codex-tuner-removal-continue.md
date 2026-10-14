<!-- brief-format: v1 role: codex -->
# Codex brief: the tuner removal finished and measured in a fresh session (owner-design-exploration-r04, tuner-removal)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `58e39ede`
- **Milestone:** `owner-design-exploration-r04`. Decisions: items 50 and 59. The build branch's copy of DECISIONS.md is
  behind; read them from the coordinator branch with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:**
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/briefs/codex-tuner-removal.md`,
    the round's brief. Its Goal, outcomes T1-T5, limits L1-L3, its paragraphs on the temp folder, the ports, the known
    instabilities and the base, its Scope and its Report hold for this run; everything it tells you to read, read, as
    it stands at the HEAD above, except that its base stays `4352181f`.
  - `D:/fitway-temp/codex-round-62a57dd6-5c06-45b8-9ded-996d11222dab/STOPPED-2026-10-14.md`, what the stopped
    session did and left.

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

An earlier session wrote this round's change and began measuring it; it was stopped on 2026-10-14 at the user's
request so the coordinator's session could end, not for its work. Its uncommitted tree was saved by the coordinator as
`58e39ede` (parent `4352181f`), which is now the branch's HEAD. Its at-rest compares ran on that tree before it was
committed and its motion matrix was cut off, so no earlier record stands in for a result on the commit you deliver.
The temp folder `D:/fitway-temp/owner-r04-tuner-removal/` keeps the base extract, the earlier scripts (`t2-equal.mjs`
among them) and their records: read them and reuse what is sound. No other round runs compares on this machine while
you work; the pair 3188-3189 is yours.

## Goal

The round's brief is met: its Goal and every outcome and limit, measured as it states them, on the commit you deliver.

## Required outcomes

- **R1. Every measurement on the delivered commit.** T1-T5 and L1-L3 are measured as the round's brief states them on
  the commit you deliver, which holds the stopped session's change plus any change you make, as one commit on top of
  `58e39ede`; no earlier record stands in for any of them.
  - **Intent.** The report vouches for the commit that merges, not for a tree that no longer exists.
- **R2. The saved change judged, not assumed.** Before measuring, read the change `58e39ede` makes against `4352181f`
  and check it against T1-T5 and L1-L3; change it only where an outcome or limit is not met, and report each change
  with the outcome it serves.
  - **Intent.** The earlier session's work is kept where it is right and corrected where it is not.

## Scope

As the round's brief: you may change what its Scope names; commit once when done. `58e39ede` is not amended or
rewritten. Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not work around it:
finish and measure the others, then stop and report. (B3)

## Report

As the round's brief's Report, each outcome and limit with the SHA it ran on; R2's changes; the commit SHA you deliver.
At most 30 lines.
