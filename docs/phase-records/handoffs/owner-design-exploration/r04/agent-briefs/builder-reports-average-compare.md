<!-- brief-format: v1 role: builder -->
# Builder brief: Reports' average and comparison cards (owner-design-exploration-r04)

For a fresh `owner-direction-builder` (Opus, high).

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `f835e520`
- **Milestone:** `owner-design-exploration-r04`. Decisions: carried by this brief; read no decision record.
- **Folder:** `design-research/owner-composition-exploration-r04/directions/eclipse/` (below, "the folder").
- **Read first, only these:** in the folder, `reports.html`, the parts of `reports.js` and `reports.css` that draw the top row of cards (`#fig-avg`, `#card-trend`, the `wow` model and the period model), the strings in `daily.js` and `components.js` that hold «معدّل», `DESIGN-SPEC.md` with the spec rows OWN-R3, TRU-7, K-01, CRD-11 and Q3/Q17; then `D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md` §"CLI working loop".

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

- Run `pnpm verify:owner` from `D:/Projects/fitway-worktrees/owner-design-exploration-r04` in PowerShell, with `--concept` set to the folder's absolute path and port 3176; that checkout is otherwise read only. Write evidence only in `D:/fitway-temp/owner-r04-avg-compare/`.
- This repository is public. Never read a sketch folder's state file.

## Why

The gym's owner read «معدّل الموجودين 41» on Reports and could not tell what it measures; it can read as the number inside now. Beside it, the "Last 7 days" card stays on the last 7 days whatever period the owner picks, which looks broken. The user agreed both changes below, word for word; the Arabic strings in quotes are the user's and stay as written.

## Outcomes

- **O1, the average names its basis.** The card `#fig-avg` is titled «متوسط الموجودين» / "Average inside". Under its number, in the foot the other two figures use, one line: «طوال الدوام، » / "Across opening hours, " followed by the period as the period control names it: «طوال الدوام، آخر 28 يومًا» / "Across opening hours, last 28 days", «طوال الدوام، آخر 7 أيام», and for a custom range its dates, «طوال الدوام، 15 – 17 سبتمبر» / "Across opening hours, 15 – 17 Sep" (the range isolated so the en-dash reads right in Arabic; check it rendered). The line changes when the period changes. In No readings and Error the line is absent; while loading a placeholder holds its place, so loading to loaded moves nothing. No level badge (LVL-2 stays). The card keeps its place and size.
- **O2, the comparison follows the period.** The card `#card-trend` compares the chosen period with the equal span just before it: 28 days against the 28 before, 7 against the 7 before, a 3-day custom range against the 3 days before. Its title becomes «مقارنة بالفترة السابقة» / "Compared with the period before", its head's dates become the earlier span's dates (e.g. «29 يوليو – 25 أغسطس»), and its value, measure and entries line keep their present form. No dates beside the value (the user refused that on 2026-10-01). When the earlier span's readings fall under the card's coverage rule (80% today), the card shows no figure and says «لا قراءات كافية قبلها للمقارنة» / "Too few readings before it to compare", in the same quiet tone as the page's other no-data text. The card's description for assistive technology names both spans. Loading, Error and pending keep their present honest forms.
- **O3, one word for the measure.** Wherever «معدّل» names this average (people inside, averaged) on Reports, Today (`daily.js`) and Components, it becomes «متوسط» with the right article and form: «متوسط الموجودين», «المتوسط», «أعلى متوسط», «بمتوسط», «متوسط آخر 4 أيام أربعاء», «متوسط يومين», including table heads, sort names, captions, keys and screen-reader text. English is unchanged unless it now disagrees with the Arabic. Check the changed Arabic with the `ux-araby` skill; report any suggestion you did not apply instead of changing the user's strings.
- **O4, nothing else moves.** With `pnpm verify:owner compare` against `f835e520` at `390x844` and `1440x900`, `ar` and `en`: on Reports, pixels change only inside the two cards and where the word changed; on Today and Components only where the word changed. Report any other change.
- **O5, the spec says it.** Update OWN-R3, TRU-7 and K-01 in the folder's spec parts to the new behaviour (Q3 (b)'s fixed 7 days superseded by the user, 2026-11-06), add the average's line to the row that describes `#fig-avg`, and regenerate `INDEX.md` as its header says.

## Checks

Render with `pnpm verify:owner frames`: Reports Arabic and English, 1440 and 390, for Last 28 days, Last 7 days and the custom range 15-17 Sep; Arabic 1440 for a custom range whose earlier span has too few readings (one starting 2026-08-02), No readings, Error and Loading. Measure the two cards' heights before and after at both widths. Plant one defect (for example the old 7-day window) and show your check fails on it. Make one sheet with `pnpm verify:owner sheet`, Arabic first, and look at it yourself. Leave the whole ladder to CI. Commit on this branch.

## Report

Final message, at most 30 lines: the commit; each O with its measure; the sheet's absolute path; every Arabic string you added or changed, as rendered; what you could not check.
