<!-- brief-format: v1 role: fixer -->
# Fixer brief: level feet on Reports' top row (owner-design-exploration-r04)

For a fresh `owner-direction-fixer` (Sonnet, high). Every target below is frozen; make no design decision. Where a target cannot be met as written, stop and report it with the measure.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `651d6c3e`
- **Milestone:** `owner-design-exploration-r04`. Decisions: carried by this brief; read no decision record.
- **Folder:** `design-research/owner-composition-exploration-r04/directions/eclipse/` (below, "the folder").
- **Read first, only these:** `git diff 802278e2..651d6c3e` (how the row keeps one height: hidden widest-case copies under each foot, `reports-compare.js` `glance` and `foot`); `reports.css` around line 98; the spec rows OWN-R3, OWN-R7 and CRD-11; the review's measuring scripts `D:/fitway-temp/owner-r04-avg-verify-2/scripts/v4c.mjs` with `v4c-read.cjs` and `v4d.mjs`, and how they were run (`D:/fitway-temp/owner-r04-avg-verify-2/v4c/manifest.json`); then `D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md` §"CLI working loop".

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

- Run `pnpm verify:owner` from `D:/Projects/fitway-worktrees/owner-design-exploration-r04` in PowerShell, with `--concept` set to the folder's absolute path and ports 3176/3177; that checkout is otherwise read only. Copy the review's scripts into your run folder before changing anything in them. Write evidence only in `D:/fitway-temp/owner-r04-avg-level/`.
- This repository is public. Never read a sketch folder's state file.

## Why

Reports' top row keeps one height for every period by reserving room for its widest words. A review measured that where the reserve is taller than the words shown, the real words sit at the top of it, so the feet are no longer level: at 1200 (both languages) and Arabic 1280 the comparison's badge and entries line sit 26 px above the period card's notes; at Arabic 390 and 768 the average's one-line note sits 10 px above the peak's badge. At `f835e520` every foot in the row was level.

## Outcomes

- **O1, level feet.** In every case the review measured (`v4c`'s widths, both languages, every period), the centres of the feet in the glance row (the average's line, the peak's badge, the entries' daily line, the comparison's badge and entries line) are level within 1 px of each other wherever they share a row, as at `f835e520`. The reserve stays: the row keeps one height per width and language for every period and state, and loading to loaded still moves nothing (0.00 px). A wrapped line sits level by its last line with its neighbours' feet; say how you placed it.
- **O2, the spec says it.** OWN-R7 names every width where the page below the row sits lower than at `f835e520`, with the amount, as measured on your head (the review measured Arabic 390 +10, Arabic 768 +10, Arabic 1280 +26, Arabic and English 1200 +26, Arabic 1440 +22). OWN-R3's Arabic 320 height is the measured one (the review measured 764, 560 and 188; it says 790). Regenerate `INDEX.md` as its header says.

## Checks

Rerun your copies of `v4c` and `v4d` on your head against `f835e520` and report the feet's centres, the row heights and the downward shifts; plant one defect (a foot 3 px off) and show the check fails on it. Rerun the arrival check the earlier round used (`D:/fitway-temp/owner-r04-avg-fix/states3`'s script) for 0.00 px. `pnpm verify:owner compare` on Today and Components against `f835e520` at 390x844 and 1440x900, ar and en: equal. Make one sheet, Arabic first, of Arabic 1200 and 390 and English 1200, Last 28 days, with `pnpm verify:owner sheet`, and look at it yourself. Leave the whole ladder to CI. Commit on this branch.

## Report

Final message, at most 15 lines: the commit; each O with its measure; the sheet's absolute path; anything you could not meet or check.
