<!-- brief-format: v1 role: verifier -->
# Verifier brief: what a gym owner would see on the Owner pages (owner-design-exploration-r04)

For a fresh `owner-direction-verifier` (Opus, high). An audit before the demo's polish round: you find, you fix nothing, and you read no earlier report.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `33677c89`
- **Milestone:** `owner-design-exploration-r04`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md` §"CLI working loop".
  - The pages under `design-research/owner-composition-exploration-r04/directions/eclipse/`: `index.html` (Daily), `reports.html`, `activity.html`, `access.html`, `settings.html`, `public.html`, and their scripts as you need them.

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

- Run `pnpm verify:owner` from `D:/Projects/fitway-worktrees/owner-design-exploration-r04` in PowerShell, with `--concept` set to the page's absolute folder and port 3176; that checkout is otherwise read only. Write only in `D:/fitway-temp/owner-r04-demo-audit-data/`.
- This repository is public. Never read a sketch folder's state file, and never name an outside source for the demo data.

## Why

The demo shows these pages to the owner of a gym, who knows what a gym's day looks like. The composition of these pages is accepted; do not judge taste or propose redesigns. Look for what would make that person stop believing what they see.

## What to check

Default state of each page, plus each state a person reaches by clicking in the demo, at `1440x900` and `390x844`, `ar` and `en`.

- **A1, one gym across the pages.** Make a table: capacity, opening hours, today's date and weekday, the count now, today's peak and its time, the quietest hour, a usual day's level, the people who appear in the logs. One row per value, one column per page, the value as rendered. Mark every disagreement: a count on Daily that Reports' same day contradicts, a percentage that does not follow from Settings' capacity, a chart's hours outside Settings' hours, an Activity record that Access or Settings contradicts, a date in the wrong year or on the wrong weekday.
- **A2, numbers that look made up.** Read each chart and table as the gym's owner would: rhythm through a day and a week, Friday against other days, round or repeated figures, values that stay flat or jump for no reason, a record count that does not fit the rows, names or texts that read as test data.
- **A3, words of the workshop.** Anything a visitor to the demo can see that belongs to the work and not the product: browser tab titles, meta descriptions, "Eclipse", "concept", "exploration", "sketch", "synthetic", "demo", a query state shown on screen.
- **A4, every link and control.** List each link, menu item and button on each page once, and what happens on click. Separate: goes to a built page; does its job; does nothing (name it); goes to a page not built or to `components.html`; the export's download gives a real file with the numbers on screen.
- **A5, unfinished looks.** Any card, row or area at the default state that reads as empty, leftover or broken, with its frame. Start with Reports' `#fig-avg` card and the light on Reports' "Last 7 days" card.
- **A6, the belonging check.** Run `pnpm verify:owner belonging-check` on this head and give the counts.

## Report

Final message, at most 60 lines: the A1 table; then each finding as a hypothesis with page, language, size, the frame's absolute path and `file:line`, marked **stops the demo**, **worth fixing** or **leave**; what you could not check. Never edit a page. Facts only, no praise.
