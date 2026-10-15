<!-- brief-format: v1 role: codex -->
# Codex brief: grade reports-css's result by running these checks (owner-design-exploration-r04, reports-css-grade)

- **Worktree:** `D:/fitway-temp/owner-r04-reports-css-grade/wt`, branch `grade-reports-css`, HEAD `23314b3a`
- **Milestone:** `owner-design-exploration-r04`. Decisions: numbers 64 and 67 of the milestone's DECISIONS file on
  the coordinator branch, at
  `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:**
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/briefs/codex-reports-css.md`, whole (the round you grade);
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md`, the CLI's guide.

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
  piped output (pnpm, Playwright, Node scripts that run git) fails inside it: request escalation for it from the first
  attempt, with a one-line justification. (DECISIONS item 7)
- **This round grades; it fixes nothing.** Keep scripts, probes and logs in `D:/fitway-temp/owner-r04-reports-css-grade/`.
- **Tools.** The verify-fitway CLI, read-only, from the coordinator's worktree: `node
  D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/cli.mjs`, ports 3176-3177
  only; if one is held by a process you did not start, never stop it; ports 3174 and 3180 serve the user's preview.
  Two other rounds compare on 3186-3187 and 3188-3189 meanwhile: record that load beside every run.
- **The base** is the concept folder `design-research/owner-composition-exploration-r04/directions/eclipse/` at
  `c2fe4661`, the result the same folder at `23314b3a`; take each with `git archive` and extract it outside every
  git tree.

## Goal

The coordinator knows, row by row, whether reports-css's delivered commit holds on checks its own run did not make.

## Causes and required outcomes

- **G1. Where each rule lives.** Outcome: for each rule in the result's `shared.css`, at least one element on two
  different pages matches it in some state; for each rule left in the result's `reports.css`, no element on Access,
  Activity or the components sheet's non-Reports specimens matches it in any state the recipes reach, by a DOM probe
  over every recipe state, Arabic and English. Intent: shared means used by more than one page.
- **G2. What each page loads.** Outcome: Access's and Activity's heads no longer name `reports.css`; Reports and the
  components sheet name both stylesheets; no page loads a stylesheet twice. Intent: no page carries another's styles.
- **G3. Every page unchanged.** Outcome: a full compare, base against result, every page, `--feature all`, Arabic and
  English, desktop, tablet and phone, reduced motion, 4 workers: every item EQUAL apart from the capture problems
  the round's brief names as known; list any other with its item. Intent: the split changed no pixel.
- **G4. Motion unchanged.** Outcome: `--timeline` on Access's dialogs, Reports' segmented control and its table sort,
  Arabic, desktop and phone, full motion: no TIMELINE DIFFERENT; any NOT-HELD sample is one where the base compared
  with itself also varies (run that self compare and cite it). Intent: no moment moved.
- **G5. Loading proofs under load.** Outcome: the base compared with itself, Reports and Access `--states all`, Arabic
  and English, desktop, reduced motion, 4 workers, while another compare runs on another pair: every `state=loading`
  item EQUAL in 3 of 3 runs, and each captured loading frame shows the skeleton (crop one per page). Intent: a
  loading state is captured as loading on a busy machine.
- **G6. No rule lost or doubled.** Outcome: the union of both stylesheets' rules at the result equals the base
  `reports.css`'s rules, comments aside, and no rule appears twice. Intent: the split moved, never rewrote.
- **G7. Scope.** Outcome: `git diff --stat c2fe4661 23314b3a` lists only files the round's Scope allows;
  the concept folder's `HISTORY.md` and its `evidence` folder are byte-identical; the folder's index check passes. Intent: nothing
  outside the split moved.

## Limits the result keeps

- **L1. Nothing tracked changes.** `git -C <worktree> status --short` is empty at the end, and no commit is made.

## Scope

You change no tracked file; everything you keep goes in `D:/fitway-temp/owner-r04-reports-css-grade/`. Add no
dependencies. If an outcome cannot be met, do not work around it: finish and measure the others, then stop and
report. (B3)

## Report

Each of G1-G7 and L1 as PASS or FAIL with the command and the output line that proves it, and for a FAIL the item or
input that failed; each run's load; anything you could not run.
