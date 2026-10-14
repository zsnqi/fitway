<!-- brief-format: v1 role: codex -->
# Codex brief: the gardener counts the rounds and findings (agent-environment-r03, round 25)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r03-r25`, branch `agent-environment-r03-r25`, HEAD `a798440e`
- **Milestone:** `agent-environment-r03`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 16, 20, 21.
- **Read first, only these:**
  - `.agents/skills/gardener/SKILL.md` §"Fixed checklist";
  - `.agents/skills/gardener/survey.mjs` (its `formatReport` and `main`);
  - `docs/phase-records/handoffs/agent-environment/rounds.tsv` and `docs/phase-records/handoffs/agent-environment/findings.tsv`
    (their header lines and a few rows);
  - `docs/agent-context/WORKING_AGREEMENTS.md` §"Delegation" (the paragraph on grading, which says how both files are
    written).

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
- Another round changes `survey.mjs` at the same time. Put this round's logic in a new module beside it, with its own
  tests, and change `survey.mjs` only to call that module and print its section.

## Goal

Each gardener pass reports, from the two round records, which finding classes keep coming back and how the rounds
are trending month by month, so a recurring class gets its check and the trend is read with its sample size.

## Causes and required outcomes

- **C1. Nothing reads the findings list.**
  - **Cause.** DECISIONS items 20 and 21 say the gardener counts the findings list's recurrences and a recurring
    class gets a check, but no script reads `findings.tsv` (`git grep findings.tsv` over the code finds nothing);
    the checklist's first class, a correction seen twice, compares reports by hand.
  - **Outcome.** The survey's report and `survey.json` gain a records section. For `findings.tsv` it gives, per
    class, the open, fixed and other-status counts, and lists as recurring each class with two or more open lines
    from different rounds, naming their ids. A class written `cli-gap:<kind>` counts each kind as its own class, and
    a recurring one is named as a CLI feature that is due.
  - **Intent.** A repeated cause is found from the records, not from memory.
- **C2. Nothing reports the trend.**
  - **Outcome.** For `rounds.tsv` the section gives, per calendar month and per writer, the number of rounds N and,
    each with the count it was computed from beside it: the mean attempts, the share of rounds that needed a repair,
    the `heldout_rows` column's rows passed of rows graded, brief-caused failed rows per round, interventions per round, and defects
    found after acceptance per round. An empty or unparsable cell is left out of that rate and counted as unknown;
    it is never read as zero. No single score is computed.
  - **Intent.** A rate is never read without its N, and a missing value never makes a month look better.
- **C3. Malformed records are visible.**
  - **Outcome.** A line with the wrong number of fields, an id used twice, or a status or month that cannot be read is
    listed with its file and line, and the section still reports everything it could read. A missing file is
    reported as unknown with its reason. None of these blocks collection, and every other part of the survey keeps
    its present outcome.
  - **Intent.** A broken record is repaired, not silently dropped.
- **C4. Planted controls and proof.**
  - **Outcome.** Tests run by the fast ladder, each failing on `a798440e` and passing after, cover: a recurring class
    and a class with one open line; two `cli-gap` kinds, one recurring; open lines from one round only; a month with
    an empty cell; each malformed line of C3; a missing file. On the real files the section's counts equal the
    files' own (for example the open and fixed totals), and the survey from `.agents/skills/gardener/pass.ps1`
    completes on this machine's real state with its folder, branch and worktree proposals unchanged.
    `node scripts/verify.mjs fast` passes on your committed, clean tree.
  - **Intent.** Each count is shown to fail when its defect is planted.

## Scope

You may add one module and its test under `.agents/skills/gardener/`, and change `survey.mjs` only as the
environment note above says; commit once when done. Everything else is read-only. Add no dependencies. If an outcome
cannot be met, do not work around it: finish and measure the others, then stop and report. (B3)

## Report

For each outcome, PASS or FAIL, with the command and the output line that proves it. Then:
- the recurring classes and the latest month's line from the real survey;
- the files you changed;
- the commit SHA;
- anything you could not do.

At most 30 lines.
