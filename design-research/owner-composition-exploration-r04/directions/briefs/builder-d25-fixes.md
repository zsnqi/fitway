<!-- brief-format: v1 role: builder -->
# Builder brief: decision 25 and the trial's defects, Daily and Reports (owner-design-exploration-r04)

For a fresh `owner-direction-builder` (Opus, high). The decisions are made; build exactly them.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `e1837cf`
  plus this brief's own commit on top of it
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 4, 7, 8, 11, 12, 20, 21, 22, 23 and 25 (item 25 is this round); read the file with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full;
  `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md` rows CHT-15, MOT-10, MOT-11,
  OWN-D5, OWN-D7, OWN-D10, FOC-7, TBL-12 by row ID. Navigate code with
  `design-research/owner-composition-exploration-r04/directions/eclipse/INDEX.md`.

<!-- environment:start v1 -->
## Environment

- Work only in the worktree and branch named above, and in `D:/fitway-temp/<run>/`. Never push, fetch, switch
  branches, or touch other worktrees or global configuration. (AGENTS.md, one writer per worktree)
- Use absolute paths; the shell's working directory resets between calls. (2026-10-02 retrospective)
- Wait on long jobs with Monitor or a background shell, never `sleep` or `Start-Sleep`. (2026-10-02 retrospective)
- Read a file before editing it. Write UTF-8 without a BOM and keep the file's line endings. (2026-10-02 retrospective)
- In PowerShell run pnpm without `2>&1`. Run Playwright from PowerShell: Git Bash rewrites `/api` paths. (2026-09)
- Drive C is full: keep temp output on D:, and set `TEMP`/`TMP` to `D:/fitway-temp` for a command that writes much. (2026-09)
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. (2026-10-02 retrospective)
<!-- environment:end -->

- Write frames only in `D:/fitway-temp/owner-r04-d25-build/`. A local server uses port 3177 only.
- Leave the busiest-time card as it is: another round redraws it in parallel.

## Causes and required outcomes

Each outcome holds in Arabic and English. Where a cause names a file and line, it is the reviewer's hypothesis;
confirm it before you act on it, and report it if it is wrong.

**Daily, the phone (720 px and below)**

- **A1. The bar** (item 25). When a hold or a tap starts while part of the reading area or the plot is under the
  bottom bar, the reading can be hidden. Outcome: the page slides up once, smoothly, until both are above the bar,
  and never moves while the finger moves; the reading follows the finger's position across the slide. With reduced
  motion the move is instant. Nothing slides when both are already clear.
- **A2. No first-open intro on the phone** (item 25). Outcome: at 720 px and below the page is complete at first
  paint, with no intro and no rolling digits on open; a live change still rolls as item 4 says. From 721 px the
  intro is exactly as it is (MOT-10, OWN-D5). A window resized across 720 px never starts an intro.
- **A3. The first part of a drag is lost.** After the hold, no `touchmove` arrives until the finger has moved about
  15 px, so the reading jumps two stops at 390 and three at 320, in both directions. Suspected cause: the passive,
  never-cancelled `touchstart` (`app.js:1789-1802`), which leaves Chromium's touch slop in force. Outcome: after the
  hold, the reading moves stop by stop from the finger's first movement. Kept from the trial: a swipe in any
  direction that starts without a hold scrolls the page and reads nothing.
- **A4. A hold in the band covers the reading.** The band is part of the touch area (CHT-15), so a hold there puts
  the finger on the reading's box. Outcome: the finger never covers the reading it holds, wherever the hold starts.
- **A5. English "Waiting for readings" at 320** runs past its column into the cell beside the close button
  (`style.css:819`, `app.js:1705`), much closer to the button than any other reading. Outcome: it stands as clear of
  the buttons as the reading does everywhere else, in every state and at every stop.
- **A6. Tab order across close, previous and next** zigzags across their grid (`index.html:227`): close, then the
  far corner, then back. Outcome: Tab moves through the three in a straight line in both languages, with previous
  and next keeping their sides for each language. If the arrangement must change for that, keep the band's look and
  report what changed.

**Reports and the component sheet**

- **B1. The empty-period sentence** breaks right after «إلى» / "to", leaving its date on the next line (390 and 768;
  `reports.js:417` and `:173`/`:293`; Daily's band already keeps «إلى 2:31 م» together, `app.js:1705`). Outcome:
  «إلى» / "to" never ends a line apart from its date, in every form item 21 names, at every width.
- **B2. A one-pixel seam in Reports' Arabic header row,** between Average and Entries, at 721 and 768, seen when a
  one-digit and a three-digit peak share the table (hypothesis: fractional column widths in the fixed colgroup,
  `reports.js` ~62-69). It was not repeated across runs. Outcome: no seam, with those peaks planted, over several runs.
- **B3. The English spoken "Last 7 days" comparison** reads "from 16 to 22 Sep 2026 compared with from 9 to 15 Sep
  2026" (`reports.js:256` with `:930`). Outcome: a grammatical sentence in English; Arabic checked the same way.
- **B4. The sheet's "Last 7 days" range** sits in a flex row without its unbreakable wrapper, wider than on Reports
  (`components.js:89`). Outcome: it matches Reports.
- **B5. The sheet's empty-state row** forces two columns at phone widths (`components.js:899`): the alert's Cancel
  button runs into the empty-state card and "Show the last 28 days" runs past its card, at 390 and 320. Outcome:
  nothing overlaps or runs past its card at any width.

**Both pages**

- **C1. Header lines run together for screen readers:** separators are hidden, so the page reads, for example,
  "26 Aug – 22 Sep 2026Readings on 10 of 28 days" and "23 September 2026Open 6:00 AM – 1:00 AM". Outcome: each line is
  heard as its own phrase in both languages; nothing visible changes.

**Required unchanged:** every frame from 721 px up equals HEAD's, except where B1, B2 and the sheet's B4-B5 change it
and during the intro's first paint; the phone frames at rest equal HEAD's except by B1, B5 and the absent intro.
Every Daily state (live, delayed, offline, no history, closed, loading, error) keeps its places and heights at 390
and 320 (OWN-D10); nothing stale looks live (item 8).

Look at every element you change as a whole on its page, its order, alignment, sizes and spacing, not only at whether
the outcome happened (WORKING_AGREEMENTS "Rules and findings").

Update the DESIGN-SPEC rows the outcomes change (at least CHT-15, MOT-10, OWN-D5 and OWN-D7) to what is built.
Regenerate INDEX.md with the command written at its top.

## Frames

Render with the repository's `@playwright/test`, from `file://` and over HTTP on 3177; phone frames in a touch
context (`hasTouch`, `isMobile`, real touch events) at 390 × 844 and 320 × 568, AR and EN. Number the crops in
`D:/fitway-temp/owner-r04-d25-build/crops/`: 01 a hold started with the plot partly under the bar, before and after
the slide; 02 the first frames of a drag after the hold; 03 a hold started in the band; 04 EN 320 offline, waiting,
kept with the buttons; 05 the three buttons with focus on each in turn; 06 the phone's first paint and the computer's
intro at 1440; 07 Reports' empty-period sentence at 390 and 768, each form; 08 Reports' Arabic header at 721 and 768
with the planted peaks; 09 the sheet's "Last 7 days" and empty-state rows at 390 and 320. Record one real-time video
of A1 at 390 AR. Inspect every frame yourself before reporting; a passing check is not a looked-at frame. (AGENTS.md)

## Scope

You may change, in `design-research/owner-composition-exploration-r04/directions/eclipse/`: `app.js`, `index.html`,
`style.css`, `reports.js`, `reports.html`, `reports.css`, `components.js`, `components.html`, `components.css`,
`DESIGN-SPEC.md`, `README.md` and `INDEX.md`; commit once when done. Do not redesign beyond the decisions; report
anything that seems to need it. (CLAUDE.md)

## Report

A1-A6, B1-B5 and C1 each PASS or FAIL with evidence; the crop folder and the video; every frame from 721 px up that
differs from HEAD; the files you changed; the commit SHA; anything you could not do; anything a decision or rule
produces that reads wrong, with the rule named (WORKING_AGREEMENTS "Rules and findings"). At most 40 lines.
