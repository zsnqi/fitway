<!-- brief-format: v1 role: verifier -->
# Verifier brief: Reports' average and comparison cards (owner-design-exploration-r04)

For a fresh `owner-direction-verifier` (Opus, high). You find; you fix nothing; you read no report of the work you check.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `802278e2`
- **Milestone:** `owner-design-exploration-r04`. Decisions: carried by this brief; read no decision record.
- **The work:** `git diff f835e520..802278e2` (two commits, `222bc4c9` then `802278e2`).
- **Read first, only these:** that diff; in `design-research/owner-composition-exploration-r04/directions/eclipse/`, `reports.html` and the parts of `reports.js`, `reports-compare.js` and `reports.css` that draw the top row, and the spec rows the diff changes; then `D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md` §"CLI working loop".

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

- Run `pnpm verify:owner` from `D:/Projects/fitway-worktrees/owner-design-exploration-r04` in PowerShell, with `--concept` set to the folder's absolute path and port 3186; that checkout is otherwise read only. Write evidence only in `D:/fitway-temp/owner-r04-avg-verify/`.
- This repository is public. Never read a sketch folder's state file.

## What the user agreed (2026-11-06)

1. «معدّل الموجودين» / "Average inside" keeps its name; «متوسط» stays only the crowd level (Quiet · Moderate · Busy · Packed). The number could be read as the count now, so a line under it names the period alone: «خلال آخر 28 يومًا» / "Over the last 28 days", «خلال آخر 7 أيام», a custom range «من 15 إلى 17 سبتمبر» / "15 to 17 Sep" (across months «من 30 أغسطس إلى 2 سبتمبر», one day «في 15 سبتمبر»). No comma, nothing about opening hours. Absent in No readings and Error; a placeholder while loading. No level badge on the average.
2. The comparison card, until now fixed on the last 7 days against the 7 before, follows the chosen period: the period against the equal span just before it. Title «مقابل الفترة السابقة» / "vs the period before", the earlier span's dates at its head, never beside the value. When the earlier span's readings are under the card's coverage rule it shows no figure and says «لا قراءات كافية في الفترة السابقة للمقارنة» / "Too few readings in the period before to compare". Its description for assistive technology names both spans.
3. Nothing else on Today, Reports or Components changes.

## What to check

- **V1, the numbers are true.** For Last 28 days, Last 7 days, 15-17 Sep, a one-day range and 2-4 Aug, compute from the page's own data (`gym.js` and the period model) the earlier span, its coverage, the two percentages and their sign, and compare with what renders, in both languages. Check the period boundaries (no day counted twice or missed) and what happens at the start of the history.
- **V2, the words.** Every string above as rendered, Arabic and English, at 1440x900 and 390x844; Arabic ranges in the right order; no «متوسط» naming an average anywhere on Today, Reports or Components.
- **V3, states.** Loading, Error, No readings (a period with none), pending (a period ending today), and the too-few-before case: absent or stale data never looks live, and loading to loaded moves nothing in the two cards.
- **V4, layout.** Heights of the glance row and both cards at 1920, 1440, 1280, 1200, 1024, 768, 390 and 320, both languages, for the periods in V1; anything clipped, overlapping, or overflowing its card; how the comparison head reads where its dates take a second line. Compare against `f835e520` with `pnpm verify:owner compare` on Today, Reports and Components at 390x844 and 1440x900, ar and en, and name every difference outside the two cards.
- **V5, keyboard and assistive text.** Changing the period by keyboard updates both cards; the cards' accessible text says what is on screen.
- **V6, the ladder's fast checks** that touch this folder (`pnpm verify:fast` is enough), and `pnpm verify:owner belonging-check`.

## Report

Final message, at most 30 lines: each V with its measure and frame paths; findings ranked High, Medium, Low, each with file and line or a frame; what you could not check. Make one sheet with `pnpm verify:owner sheet` of the frames that carry your findings, Arabic first, and give its path.
