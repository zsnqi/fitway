<!-- brief-format: v1 role: fixer -->
# Fixer brief: the review's findings on Reports' average and comparison cards (owner-design-exploration-r04)

For a fresh `owner-direction-fixer` (Sonnet, high). Every target below is frozen; make no design decision. Where a target cannot be met as written, stop and report it with the measure.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `802278e2`
- **Milestone:** `owner-design-exploration-r04`. Decisions: carried by this brief; read no decision record.
- **Folder:** `design-research/owner-composition-exploration-r04/directions/eclipse/` (below, "the folder").
- **Read first, only these:** `git diff f835e520..802278e2` (the work these findings are about); in the folder the parts of `reports.js`, `reports-compare.js` and `reports.css` that draw the top row; the spec rows OWN-R3, OWN-R7, TRU-5, TRU-7, CRD-10; then `D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md` §"CLI working loop". The review's evidence is in `D:/fitway-temp/owner-r04-avg-verify/` (its scripts in `calc/`, `states/`, `matrix/` can be rerun).

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

- Run `pnpm verify:owner` from `D:/Projects/fitway-worktrees/owner-design-exploration-r04` in PowerShell, with `--concept` set to the folder's absolute path and port 3176; that checkout is otherwise read only. Write evidence only in `D:/fitway-temp/owner-r04-avg-fix/`.
- This repository is public. Never read a sketch folder's state file.

## Why

Reports' top row now names the average's period under its number («خلال آخر 28 يومًا», «من 15 إلى 17 سبتمبر») and compares the chosen period with the equal span before it («مقابل الفترة السابقة»). An independent review found the faults below. The agreed words do not change.

## Outcomes

- **O1, the line stays in its column.** At 390 px in Arabic, «من 13 أغسطس إلى 12 سبتمبر» runs across the column divider beside the level badge (`.stat-aside`'s `white-space: nowrap`, reports.css:54, on the line drawn at reports.js:289). The line wraps inside its own column where it does not fit, breaking only between «من 13 أغسطس» and «إلى 12 سبتمبر» (each date whole), in both languages, at every width from 320. Nothing crosses a divider.
- **O2, a stable row.** At a given width and language, the glance row and both cards have one height for every period (Last 28 days, Last 7 days, 15-17 Sep, 13 Aug-12 Sep, 30 Aug-2 Sep, one day, 2-4 Aug, a period in July) and every state (Loading, loaded, too few readings, No readings, Error, pending). Reserve the room the tallest content needs at that width; the comparison's no-figure sentence wraps inside the space its value and foot take. Loading to loaded moves nothing (0.00 px) in either card. Measure at 1920, 1440, 1280, 1200, 1024, 768, 390 and 320, both languages; heights may differ between widths and languages, never between periods or states.
- **O3, entries compare per day.** The entries' change compares the entries per day with readings in each span, not raw totals (reports-compare.js:47), so days missing before the history starts do not inflate it. The average's change stays as it is. Update the card's assistive description if it names the basis.
- **O4, the badge follows the figure shown.** The badge's word is chosen from the rounded percentage the card prints (reports.js:647 tests the unrounded value; `pct` at reports.js:355 rounds): +5% and over reads «أكثر ازدحامًا» / "Busier", -5% and under the quieter word, otherwise «قريب من السابق» / "About the same".
- **O5, the right reason.** When the chosen period itself is under the coverage rule, the card says «لا قراءات كافية للمقارنة» / "Too few readings to compare"; «لا قراءات كافية في الفترة السابقة للمقارنة» only when the chosen period passes and the earlier span fails.
- **O6, the placeholder fits its line.** While loading, the average line's placeholder is as wide as the line that will render (within 4 px), for every period above.
- **O7, the spec says it.** OWN-R7 and OWN-R3 describe the layout as measured after this round (Arabic at 1440 keeps the comparison's dates on a second line under the title; say the row height). TRU-7 adds: the entries compare per day with readings; an equal span may hold different weekdays (a 4-day range against the 4 days before), as the user agreed. Regenerate `INDEX.md` as its header says.

## Checks

Rerun the review's checks on your head and report each: `calc/calc.cjs` (all numbers against `gym.js`), `states/` (arrival), `matrix/` (heights per period and width). `pnpm verify:owner compare` against `802278e2` on Reports and against `f835e520` on Today and Components, at 390x844 and 1440x900, ar and en: Today and Components equal; Reports differs only inside the two cards (and below them only where O2 changes the row's height; name it). Make one sheet, Arabic first, of the frames for O1, O2 (too few readings, Arabic 1440 and English 1200), O4 (15-17 Sep) with `pnpm verify:owner sheet`, and look at it yourself. Leave the whole ladder to CI. Commit on this branch.

## Report

Final message, at most 20 lines: the commit; each O with its measure; the sheet's absolute path; anything you could not meet or check.
