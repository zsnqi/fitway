<!-- brief-format: v1 role: builder -->
# Builder brief: the walkthrough's notes F1-F3 (owner-design-exploration-r04)

For a fresh `owner-direction-builder` (Opus, high). The three changes below are agreed (DECISIONS item 111); build
them as written and make no other change.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `695600d4`
- **Milestone:** `owner-design-exploration-r04`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:** in `design-research/owner-composition-exploration-r04/directions/eclipse/`: `gym.js`
  (all, 204 lines); `daily.js` lines 215-230 and 315-345 and wherever the busiest-time card prints its head and value;
  `reports.js` lines 170-190, 275-290, 495-515 and 745-770; `activity.js` lines 215-270 and 400-460; `settings.js`
  lines 100-130, 275-300 and 460-620; `shared-frame.js` lines 15-80 and 180-210; `index.html` lines 60-100 and
  140-160; then `D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md`
  §"CLI working loop". The spec rows named below, in the eclipse folder's `spec` parts, when you update them.

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

- Run `pnpm verify:owner` from `D:/Projects/fitway-worktrees/owner-design-exploration-r04` in PowerShell, with
  `--concept` set to the eclipse folder's absolute path and port 3177; that checkout is otherwise read only. Write
  evidence only in `D:/fitway-temp/owner-r04-walkthrough-fix/`, which the coordinator made for you.
- This repository is public. Never read a sketch folder's state file.

## Why

A first-time gym owner walked the six pages. Three things would make them stop: the visitors' page cannot be reached
from any owner page; Today says the busiest time of the last 7 days is 8-9 PM while Reports' Last 7 days names none
and counts different days (Today: 17-23 Sep with today so far; Reports: 16-22 Sep); and Activity's settings rows say
only «تحديث الإعدادات» and the reason, while Settings' own history says «السعة 120 ← 150 شخصًا», and Settings links
to that row. One gym must read the same on every page.

## The changes

1. **F1, the visitors' page.** Add «صفحة الزوار» / "Visitors' page" to every owner page: in the rail's foot directly
   above the language item, and in the phone's "…" menu directly above the language item. It opens `public.html`
   in a new tab (`target="_blank"`, `rel="noopener"`), in the language the owner has chosen, carried the way the owner
   pages already carry it between themselves; its accessible name adds «، تفتح في تبويب جديد» / ", opens in a new
   tab". Its glyph is an arrow leaving a box, drawn like the rail's other glyphs (24 viewBox, same stroke). It
   follows the rail item's existing states (rest, hover, focus, collapsed rail showing the glyph alone) and the menu
   item's keyboard behaviour (arrows, Home, End, Space, Escape). Monitoring stays hidden and inert, as it is.
2. **F2, one "last 7 days".** Put one function in `gym.js` that returns the busiest one-hour slot, on the hour, over a
   span of complete days: for each hour, the mean of each day's average inside where that day was open and read
   (outages excluded, as `daily.js` does now), then the hour with the highest mean; it returns the hour and its mean.
   Today's busiest-time card calls it with the seven complete days before today (today − 7 to today − 1) instead of
   six days plus today so far, keeping its head «آخر 7 أيام» / "Last 7 days", its words and its average. Reports on
   Last 7 days calls the same function with its own seven days (which are the same days), and its busy-times subtitle
   adds, after «معدّل الموجودين حسب اليوم والساعة», the part «أكثر ساعة ازدحامًا: 8–9 م» / "Busiest hour: 8–9 PM",
   in the separator and time format the 28-day subtitle already uses. No cell is marked busiest on Last 7 days and
   the key gains no entry, as now. 28 days and custom ranges are unchanged. Report the hour and mean both pages state
   after the change; if they are not the same hour as each other, stop and report.
3. **F3, what changed.** Move Settings' change lines (the `changes`/`daysName` logic, one version against the one
   before it) to one shared place both pages load, and have Activity's `settings_updated` rows show those lines in
   the row's values place, the reason staying where it is. A saved change (for example capacity 120 → 150) shows
   the same lines on Activity as in Settings' history. A row with several changes lists them as Settings' history
   does. Arabic and English both.

Spec rows that state the old behaviour say the new one: GLO-12 (Today's window and the hour statement on 7 days),
TRU-2 and K-05 (Busiest on a 7-day period), and any row that says what Activity's settings row shows or lists the
rail's items; regenerate `INDEX.md` as its header says.

## Limits

- Nothing else changes: no other layout, word or number. `pnpm verify:owner compare` against `695600d4` on `index`,
  `reports`, `activity`, `access`, `settings` and `public` at 390x844 and 1440x900, ar and en, shows differences only
  where the three changes are (the rail and menu, Today's busiest card if its value moves, Reports' 7-day subtitle,
  Activity's settings rows).
- The rail's foot and the "…" menu keep fitting at 390, 360 and 1440 in both languages, with the rail collapsed and
  open; no item overlaps or wraps.
- `pnpm check:code-health` passes with no raised baseline; `settings.js` and `activity.js` must not grow in code lines
  beyond the call that replaces what moved.
- Commit once on this branch; do not push. CI runs the ladder.

## Check and report

From your own runs: the visitors' link opening `public.html` in a new tab in ar and in en from Today, Reports and
Settings, and from the phone menu (the new tab's URL and language); keyboard reach of the link in the rail and the
menu; Today's card and Reports' 7-day subtitle in ar and en with the hour and mean each states; Activity after saving
capacity 150 and after `?log=every`, with Settings' history beside it, counting rows whose lines differ (expect 0).
Plant one defect to show that count can fail. Frames at 390 and 1440 in ar and en for each change, and one sheet
with all of them. Final message, at most 25 lines: the commit, each change with its measure and frame paths, the
sheet path, the spec rows changed by id, anything you could not do.
