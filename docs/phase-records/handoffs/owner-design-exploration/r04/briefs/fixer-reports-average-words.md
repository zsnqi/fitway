<!-- brief-format: v1 role: fixer -->
# Fixer brief: Reports' average and comparison words (owner-design-exploration-r04)

For a fresh `owner-direction-fixer` (Sonnet, high). Every target below is frozen; make no design decision. Where a target cannot be met as written, stop and report it.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `222bc4c9`
- **Milestone:** `owner-design-exploration-r04`. Decisions: carried by this brief; read no decision record.
- **Folder:** `design-research/owner-composition-exploration-r04/directions/eclipse/` (below, "the folder").
- **Read first, only these:** `git show 222bc4c9` (the commit you correct), then in the folder the parts of `reports.js`, `reports-compare.js`, `reports.css`, `daily.js` and `components.js` it touched, and the spec rows it changed; then `D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md` §"CLI working loop".

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

- Run `pnpm verify:owner` from `D:/Projects/fitway-worktrees/owner-design-exploration-r04` in PowerShell, with `--concept` set to the folder's absolute path and port 3176; that checkout is otherwise read only. Write evidence only in `D:/fitway-temp/owner-r04-avg-words/`.
- This repository is public. Never read a sketch folder's state file.

## Why

`222bc4c9` built the user's agreed changes to Reports' average and comparison cards. Looking at it, the user kept «متوسط» for the crowd level (Quiet · Moderate · Busy · Packed), so the average goes back to «معدّل», and found the line under the average heavy. The comparison card's title was too long for its dates and made the whole row taller. The Arabic strings in quotes are final.

## Outcomes

- **O1, «معدّل» back everywhere.** Undo the commit's change of «معدّل» to «متوسط» in `reports.js`, `reports-compare.js`, `daily.js` and `components.js`, including the comparison value («+5% معدّل الموجودين»), table heads, sorts, captions, keys and screen-reader text: every such string reads as at `f835e520`. The Arabic Average column's minimum width goes back to its `f835e520` value. The crowd level «متوسط» is untouched.
- **O2, the average's line is the period alone.** The card's title is «معدّل الموجودين» / "Average inside", as at `f835e520`. The line under the number reads: «خلال آخر 28 يومًا» / "Over the last 28 days"; «خلال آخر 7 أيام» / "Over the last 7 days"; a custom range «من 15 إلى 17 سبتمبر» / "15 to 17 Sep", across months «من 30 أغسطس إلى 2 سبتمبر» / "30 Aug to 2 Sep", one day «في 15 سبتمبر» / "On 15 Sep". No comma, nothing about opening hours. It stays on one line wherever it fits; remove the rule that forces it onto two lines on the phone if it now fits. Its states stay as built: absent in No readings and Error, a placeholder while loading, nothing moves from loading to loaded.
- **O3, the comparison head on one line.** The comparison card's title becomes «مقابل الفترة السابقة» / "vs the period before". Its dates stay at its head. Measure the title beside the widest dates the history gives at each width; where they now fit on one line, the dates sit beside the title as the old card's did at `f835e520`, and the equal-height heads the commit added go away there. Target: at 1440 the glance row is 166 px tall again in both languages, and at 390 the period card is 374 px as at `f835e520`. Where a width still cannot hold both, keep the commit's two-line form there and report the width.
- **O4, its no-data text.** «لا قراءات كافية قبلها للمقارنة» becomes «لا قراءات كافية في الفترة السابقة للمقارنة» / "Too few readings in the period before to compare".
- **O5, the spec follows.** OWN-R3, TRU-7 and K-01 say the new title, line and text; GLO-3, GLO-4 and K-03 read as at `f835e520`. Regenerate `INDEX.md` as its header says.

## Checks

With `pnpm verify:owner compare` against `f835e520` at `390x844` and `1440x900`, `ar` and `en`: Today and Components show no difference; on Reports, pixels differ only inside the average and comparison cards. Render Reports Arabic and English, 1440 and 390, for Last 28 days, Last 7 days and 15-17 Sep, plus Arabic 1440 for 2-4 Aug (too few before) and Loading, and make one sheet, Arabic first, with `pnpm verify:owner sheet`; look at it yourself. Measure the row and card heights at 1200, 1280, 1440, 768 and 390 in both languages. Leave the whole ladder to CI. Commit on this branch.

## Report

Final message, at most 20 lines: the commit; each O with its measure; the sheet's absolute path; any width that kept two lines; what you could not check.
