<!-- brief-format: v1 role: codex -->
# Codex brief: why three compares vary between captures of one moment (owner-design-exploration-r04, diagnosis)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-diagnosis`, branch `owner-r04-diagnosis`, HEAD `c699d3fb`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 47, 52 and 56.
- **Read first, only these:**
  - `.agents/skills/verify-fitway/SKILL.md`, whole;
  - `docs/phase-records/handoffs/agent-environment/findings.tsv` rows F126, F148, F165 and F171;
  - `.agents/skills/verify-fitway/timeline.mjs`, whole.

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
- Meet each outcome in full: never delete or loosen what a limit keeps to save effort; report it instead. (2026-10-14)
- Shell text is code: `JSON.stringify()` is not shell quoting, and backticks or `$()` still run; use a file. (2026-10-14)
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. Any message without a tool call is your final message:
  it ends your run and stops what you started, so wait inside a tool call and write it once, as the report.
  (2026-10-02 retrospective; F154)
<!-- environment:end -->

- You run in the workspace-write sandbox with automatic approval review. Anything that starts child processes with
  piped output (pnpm, Playwright, Node scripts that run git) fails inside it: request escalation for it from the
  first attempt, with a one-line justification. (DECISIONS item 7)
- **Your temp folder** is `D:/fitway-temp/owner-r04-diagnosis/`: every probe, script, capture and note lives there.
  Compares use ports 3188-3189 only; ports 3174 and 3180 serve the user's preview, and other rounds use other ports:
  never stop a process you did not start. The concept is the build branch's folder
  `design-research/owner-composition-exploration-r04/directions/eclipse/` at `c2fe4661`, taken with `git archive`
  and extracted outside every git tree; the CLI is this worktree's, run as it is.
- **Load.** Other rounds run compares on this machine. Record the load beside every measurement, and judge a cause
  that depends on load only from runs whose load you controlled (for example a run with `--workers 1` against one
  with 4, or with a deliberate second process).

## Goal

Each of three known instabilities has a demonstrated cause, or a recorded list of what was ruled out, and a fix
proposed with the check that would prove it, so the next round can fix them without guessing.

## Causes and required outcomes

- **D1. An icon's edge pixels during a release (F148).**
  - **Outcome.** A verdict on why the download icon of Reports' export button and the calendar icon of Activity's
    dates button differ by one or two edge pixels between two captures of one held moment early in the release: a
    reproduction that shows it at will, and a control that removes it while the moment stays held (for example a
    change in the concept, the CLI's hold, or the browser's flags, tried only in your temp copy), with the runs that
    show each; or, if no cause is shown, each hypothesis tried and how it was ruled out. "At will" means a named
    command that shows it in at least 5 of 10 runs under stated load, and the control shows it in 0 of 10 under the
    same load. Before a no-cause verdict, each of these is tried with a controlled run: machine load, worker count,
    the browser's raster and compositing settings, the capture's timing, the concept's own animation and the icon's
    raster.
  - **Intent.** The fix round changes the cause, not the check that sees it.
- **D2. The press light under touch (F165).**
  - **Outcome.** The same kind of verdict for the whole control's press light differing between two captures under
    touch, at 1 ms and once at 100 ms, on every page, base and result alike.
  - **Intent.** As D1.
- **D3. A long compare full of callback problems (F171).**
  - **Outcome.** The same kind of verdict, attributed only from A/B runs that vary one factor (load, workers, the
    browser, the callbacks' presence), for Access's 4-worker timeline compare that once returned all 3,439 samples
    as callback problems while every settled item was EQUAL, and on a quiet rerun none: whether the machine's load,
    the workers, the browser, or the page's callbacks (`shared-frame.js:176`, `access.js:1305` in the concept) cause it.
  - **Intent.** A whole run of problems is either prevented or reported as what it is, never read as a regression.
- **D4. Fixes proposed, not made.** For each verdict, the smallest change that would remove the cause, where it would
  live, and the check that would prove it, shown failing now and passing with the change in a temp copy, with any risk
  to verdicts the CLI gives today. A retry, tolerance or reclassification in the CLI is proposed only where the cause
  is shown to lie outside our code (the browser), and says so.

## Limits the result keeps

- **L1. Nothing tracked changes.** No file in any worktree changes; `git status --short` in this worktree is empty at
  the end, and every experiment ran on copies in your temp folder.
- **L2. Evidence kept.** Every run you make, cited or not, is a row in a chronological ledger in your temp folder
  (command, load, outcome, output path), and every count or rate the report gives is reconciled against it.

## Scope

You may change nothing tracked; write only in your temp folder; make no commit. Add no dependencies. If an outcome
cannot be met, do not work around it: finish and measure the others, then stop and report. (B3)

## Report

D1-D4 and L1-L2 each as PASS or FAIL with the evidence path and the output line that proves it; for each finding,
the verdict in two sentences; anything you could not do; any hook message you did not act on.
