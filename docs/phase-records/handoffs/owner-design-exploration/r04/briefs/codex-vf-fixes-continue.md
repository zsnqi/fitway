<!-- brief-format: v1 role: codex -->
# Codex brief: the verify-fitway gaps finished and measured in a fresh session (owner-design-exploration-r04, vf-fixes)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-vf-fixes`, branch `owner-r04-vf-fixes`, HEAD `862dea71`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 47 and 52.
- **Read first, only these:**
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/briefs/codex-vf-fixes.md`,
    the round's brief. Its Goal, outcomes V1-V7, limits L1-L3, its paragraphs on the sandbox, CI, the temp folder, the concept
    and the ports, its Scope and its Report hold for this run; everything it tells you to read, read, as it stands at
    the HEAD above.
  - `D:/fitway-temp/codex-round-af865e5d-1ef1-4efc-b1b3-f0a3b6975895/STOPPED-2026-10-14.md`, what the stopped
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
`862dea71` (parent `088711e0`), which is now the branch's HEAD; the round's brief's base stays `088711e0`. Its
contract tests ran on that tree before it was committed and its real measurements had not begun, so no earlier record
stands in for a result on the commit you deliver. The temp folder `D:/fitway-temp/owner-r04-vf-fixes/` keeps its
extracts and recipe copies: read them and reuse what is sound. No other round runs on this machine while you work.

## Causes and required outcomes

- **R1. Every measurement on the delivered commit.**
  - **Cause.** The saved change was never measured as a commit.
  - **Outcome.** V1-V7 and L1-L3 are measured as the round's brief states them on the commit you deliver, which holds
    the stopped session's change plus any change you make, as one commit on top of `862dea71`; no earlier record
    stands in for any of them. Report each of them on its own line with PASS or FAIL.
  - **Intent.** The report vouches for the commit that merges, not for a tree that no longer exists.
- **R2. The saved change judged by running it, not by reading it.**
  - **Cause.** A saved change can remove or weaken more than its brief allows; reading its diff missed that in the
    tuner round's continue run.
  - **Outcome.** Before measuring, compare `862dea71` with `088711e0` file by file: every file it deletes or empties,
    every test or assertion it removes or loosens, and every check whose command or threshold it changes is reported
    with the outcome or limit that allows it, and restored where none does. Change the saved work only where an
    outcome or limit is not met, and report each change with the outcome it serves.
  - **Intent.** The earlier session's work is kept where it is right and corrected where it is not.

## Addition to the round's brief

- **V1.** Each post-action proof the measurement relies on is false on the page before its action and true after it,
  shown on at least one switch of each kind the round changes.
  - **Intent.** A proof that holds anyway proves nothing about the switch.

## Scope

As the round's brief: you may change what its Scope names; commit once when done. `862dea71` is not amended or
rewritten. Everything else is read-only, ignored local files included. Add no dependencies. If an outcome cannot be
met, do not work around it: finish and measure the others, then stop and report. (B3)

## Report

As the round's brief's Report, each outcome and limit with the SHA it ran on; R2's list; the commit SHA you deliver.
At most 35 lines.
