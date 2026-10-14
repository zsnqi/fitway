<!-- brief-format: v1 role: codex -->
# Codex brief: the gardener's worktree counts and folder inventory say what is true (agent-environment-r03, round 27)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r03-r27`, branch `agent-environment-r03-r27`, HEAD `356515f2`
- **Milestone:** `agent-environment-r03`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 16, 24.
- **Read first, only these:**
  - `docs/phase-records/handoffs/agent-environment/findings.tsv` rows F106, F107, F109, F117;
  - `.agents/skills/gardener/SKILL.md` and `.agents/skills/gardener/CLEANUP.md`;
  - the code and tests those rows name.

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

- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Playwright, Node scripts that run git) fail inside it:
  request escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)

## Goal

The gardener's counts and prose name every worktree it withholds and why, a folder that disappears during a survey
never blocks it, and no test fixture keeps a real temp folder protected.

## Causes and required outcomes

- **G1. Link-withheld worktrees are counted as merged and clean (F106).**
  - **Cause.** `mergedClean` (`.agents/skills/gardener/facts.mjs:256`) ignores `linksSafe`, so the report's "merged
    clean worktrees" count includes worktrees withheld for an outward or dangling link.
  - **Outcome.** The count of merged clean worktrees includes only worktrees the survey could propose; worktrees that
    are merged and clean but withheld for links are counted on their own.
  - **Intent.** A count of removable worktrees means removable.
- **G2. Link-withheld worktrees appear only in the JSON (F107).**
  - **Cause.** `formatReport` (`.agents/skills/gardener/survey.mjs`) names such worktrees only inside its JSON dump.
  - **Outcome.** The report has a prose section that names each worktree withheld for links, with each link and its
    target or error, or says "None."; the console counts them.
  - **Intent.** The coordinator sees what is withheld without reading JSON.
- **G3. A vanishing folder blocks the survey (F117).**
  - **Cause.** The folder inventory (`collectFolders` in `.agents/skills/gardener/survey.mjs`) treats an `ENOENT` on a
    folder it listed a moment before as a collection error, so a test run that removes its own scratch folder under
    the temp root blocks the whole survey.
  - **Outcome.** A folder that no longer exists when it is measured is reported as gone, with its path, is never
    proposed, and does not block collection; any other error still blocks as before. A folder that vanishes between
    the survey and the cleanup script is still refused by the script.
  - **Intent.** Activity elsewhere on the machine never makes a survey unusable, and nothing unmeasured is proposed.
- **G4. A test cites a real temp folder (F109).**
  - **Cause.** `.agents/skills/gardener/round16c.test.ts:27-30` uses the real `D:/fitway-temp/owner-r04-k02` path as its
    fixture, so the tracked test protects that folder, and a protection check alone would not notice when the
    folder's real citation goes away.
  - **Outcome.** No tracked gardener test names a temp folder that exists or is cited by a record outside the tests;
    every such fixture uses a name made only for the test. The same cases are tested as before.
  - **Intent.** A folder is protected by the records that need it, never by a test.
- **G5. Proof.**
  - **Outcome.** Each of G1-G4 has a test run by the fast ladder that fails on `356515f2` and passes after. The survey
    from `.agents/skills/gardener/pass.ps1` completes on this machine's real state, and its proposals equal those of
    a survey of `356515f2` run on the same state, apart from what G1-G3 change; name each difference.
    `node scripts/verify.mjs fast` passes on your committed, clean tree.
  - **Intent.** Each fix is shown to fail when its defect is planted, and nothing else the survey does changes.

## Scope

You may change `.agents/skills/gardener/**`; commit once when done. Everything else is read-only. Add no dependencies.
If an outcome cannot be met, do not work around it: finish and measure the others, then stop and report. (B3)

## Report

For each outcome, PASS or FAIL, with the command and the output line that proves it. Then:
- the files you changed;
- the commit SHA;
- anything you could not do.

At most 25 lines.
