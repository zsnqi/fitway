<!-- brief-format: v1 role: builder -->
# Builder brief: one gym across the six pages (owner-design-exploration-r04)

For a fresh `owner-direction-builder` (Opus, high).

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `33677c89`
- **Milestone:** `owner-design-exploration-r04`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/eclipse/public.js` (the data part, to about line 150), `design-research/owner-composition-exploration-r04/directions/eclipse/daily.js` and `design-research/owner-composition-exploration-r04/directions/eclipse/reports.js` (their simulation parts), `design-research/owner-composition-exploration-r04/directions/eclipse/settings.js` (its values and history), `design-research/owner-composition-exploration-r04/directions/eclipse/activity.js` (its records of settings changes).
  - `D:/fitway-temp/owner-r04-demo-audit-data/REPORT.md`, the audit this round answers.
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md` §"CLI working loop".

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

- Run `pnpm verify:owner` from `D:/Projects/fitway-worktrees/owner-design-exploration-r04` in PowerShell, with `--concept` set to the page's absolute folder and port 3176; that checkout is otherwise read only. Write evidence only in `D:/fitway-temp/owner-r04-one-gym/`.
- This repository is public. Never read a sketch folder's state file, and never name an outside source for the demo data.

## Why

These pages go to the owner of a gym. Today the Owner pages and the public page describe two different gyms. Only the data changes: every composition is accepted by the user and stays.

## The one gym (frozen)

Put it in one small script the pages load, and let every page read it instead of its own copy.

- **Capacity:** 120.
- **Level limits:** 25%, 50%, 75% of capacity, so 30, 60, 90 people. A level holds every count at or under its limit, on every page, the public page included (today `public.js` uses "under").
- **Hours:** Settings' current hours stay: Sunday to Wednesday 6 AM to 1 AM, Thursday 6 AM to 2 AM, Friday 2 PM to 1 AM, Saturday 8 AM to 1 AM. Past days follow Settings' own history (Friday from 4 PM until 16 Sep, Saturday from 6 AM until 19 Sep), so a reading never sits in a closed hour.
- **Now:** Wednesday 23 September 2026, 7:42 PM, 70 inside, on Today, Reports, Activity, Access, Settings and the public page. The public page's today becomes Wednesday and its last reading 7:42 PM; its Delayed stays 13 minutes behind and its other states keep their counts.
- **The week's rhythm:** the public page's `usual` arrays are the table. Cut them to the hours above: Sunday, Monday, Tuesday and Wednesday lose their 1 AM hour; Saturday loses its 6 AM and 7 AM hours and its 1 AM hour; Thursday stays whole; Friday gains a 12 AM hour of 24.
- **Prayer:** the gym has a prayer room inside, so people do not leave to pray. Nothing adds a dip for prayer times.

## Outcomes

- **O1, Reports and Today follow the rhythm.** The minute simulation in `daily.js` and `reports.js` takes its shape from the table in place of its own bumps, and keeps its day-to-day variation and its outages. For each weekday, the average per hour over the last four such days is within 5 people of the table; Wednesday's "usual" on Today within 3. Today's own line up to 7:42 PM reaches 70 at that minute, with today's peak at or above it.
- **O2, Settings and the log agree.** Settings shows capacity 120 and limits 25, 50, 75, with its history rows moved to fit. Activity's records of those changes agree with Settings' history. Keep a varied, believable history; dates of the hour changes above stay.
- **O3, the export agrees.** `capacity_snapshot` is 120 and `settings_version` follows Settings' history. Peak, peak time, average and entries still match the screen.
- **O4, nothing is out of its box.** Larger figures fit their cards and charts at `320x568`, `390x844`, `768x1024`, `1440x900`, `ar` and `en`; chart scales adjust to the figures (Today's axis tops out above the highest value). The public page keeps its look with bars for the new hours; Friday's short day already shows it copes.
- **O5, a reading the owner would trust.** In the 28-day view no peak figure repeats more than 3 times, and no day's numbers look copied from another.
- **O6, the records follow.** Rows in `design-research/owner-composition-exploration-r04/directions/eclipse/PUBLIC-SPEC.md`, `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md`, `design-research/owner-composition-exploration-r04/directions/eclipse/SETTINGS-SPEC.md` and their parts that quote a changed figure, hour, or Tuesday say the new one. Regenerate `INDEX.md` as its header says.

## Checks

Name each result by measure: the O1 table per weekday; the same-moment table across the six pages; `pnpm verify:owner belonging-check` per page on `index`, `reports`, `activity`, `access`, `settings`; frames of those five and `public` at `390x844` and `1440x900`, `ar` and `en`, plus `320x568` for `index` and `reports`, and look at them. Leave the whole ladder to CI. Commit on this branch.

## Report

Final message, at most 40 lines: the commit; each O with its measure; the absolute path of one sheet of the frames; each place the frozen table could not hold and what you did; every spec row changed, by id; what you could not check.
