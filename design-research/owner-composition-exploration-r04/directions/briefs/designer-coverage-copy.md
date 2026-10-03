<!-- brief-format: v1 role: designer -->
# Designer brief: plain explanations for the line and the usual day (owner-design-exploration-r04)

For a fresh `owner-direction-designer` (Opus, xhigh). This is a copy round: options for the user to pick. You build
nothing in any repository.

- **Source:** a snapshot of Eclipse at `37f284a` (branch `owner-followup-r04-build`), at
  `D:/fitway-temp/owner-r04-copy-round/src/design-research/owner-composition-exploration-r04/directions/eclipse/`.
  Work on copies of it under `D:/fitway-temp/owner-r04-copy-round/`; the snapshot itself stays as it is (option 0).
- **Milestone:** `owner-design-exploration-r04`. Decisions:
  `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 2, 3, 8, 11, 12 and 13.
- **Read first, only these:** the snapshot's `../DO-NOT.md`, in full (decision 3); the `ux-araby` skill, for every
  Arabic line; `D:/Projects/fitway-worktrees/owner-design-exploration-r04/design-research/owner-composition-exploration-r04/directions/NEXT-DIRECTION-BRIEF.md`
  lines 105-115 and 245-257 (what the usual line is for; item 8 there: the page carries names and values, not
  explanatory captions, and adds none). Navigate code with the snapshot's `INDEX.md`.

<!-- environment:start v1 -->
## Environment

- Work only in `D:/fitway-temp/owner-r04-copy-round/`. Never write in any worktree, never push, fetch, switch
  branches, or touch global configuration. Another agent is writing in `owner-followup-r04-s04`: read nothing there.
- Use absolute paths; the shell's working directory resets between calls.
- Wait on long jobs with Monitor or a background shell, never `sleep` or `Start-Sleep`.
- Run Playwright from PowerShell, with the repository's `@playwright/test` from
  `D:/Projects/fitway-worktrees/owner-design-exploration-r04/node_modules`. Drive C is full: set `TEMP`/`TMP` to
  `D:/fitway-temp` for anything that writes much.
- A local server uses port 3176 only; 3177 is the other agent's. `file://` works too.
- If a source here is missing or contradicts what you find, stop and report the gap instead of guessing.
- Return your report as your final message, not as a file.
<!-- environment:end -->

## Why

Eclipse is becoming the single design reference for Owner, then Staff, then Public (decision 2): what it says here is
what later screens copy. The user read Daily's "Data coverage" card and found two explanations hard:

- **The line** (`covLineVal` in `app.js`): «معدّل 30 دقيقة حول كل نقطة: 15 قبلها و15 بعدها، والأقرب أثقل وزنًا» /
  "Average of the 30 minutes around each point: 15 before and 15 after, weighted toward the middle". Too long; it
  could be simpler.
- **The usual day** (`keyUsual`, `cov.usual`, `covUsualVal`, `covUsualNone`): «الأربعاء المعتاد» with «معدّل 26 أغسطس
  و2 و9 و16 سبتمبر». The user asked "why Wednesday?" and found its explanation unclear. The name does not say that it
  is today's weekday over the past four weeks, so on a Wednesday it reads as an arbitrary day.

The same card's other rows break onto more lines in English than in Arabic at 390 and 320 (deferred defect D6): at
320 EN a label, the 16 px gap and an unbreakable range need 286 px in a 238 px row.

## What must stay true

- The line is a centred 30-minute average of the readings, weighted toward the middle (`app.js`, the comment above
  the smoothing). An explanation may leave out detail the owner does not need; it may not say anything false.
- The usual line is the same centred average on each of the last four same weekdays, averaged; with fewer recorded,
  it says how many (`covUsualNone`). It runs past now, and it is not a forecast (brief line 251), though no caption
  says so.
- A state never reads more live, complete or certain than it is (decision 8; AGENTS.md).
- The term for the usual day appears in more places than the card: the chart's legend, the tooltip's readout, the
  "usual" entries figure and the busier/quieter comparison. Any rename covers every place, and each place still reads
  naturally.

## What to produce

1. For **the line**, two or three options, Arabic first, each English the same meaning. Plainer and shorter than now.
2. For **the usual day**, two or three options, each a name and an explanation together, Arabic first. The reader
   should not have to ask why that weekday. Say for each whether the name changes in the other places, and how.
3. For **the card's other rows** at 390 and 320 (D6): whether your options, or shorter labels for the other rows,
   keep each row's label and value on one line in both languages. Give the label options only where a row breaks.
   Measure line counts; do not estimate them.
4. A short list, not options: any other explanation on Daily or Reports that is as heavy as these two, with where it
   is and what it says now.

Render every option in place, in your copies: Daily's coverage card at 1440, 390 and 320, AR and EN, and for the usual
day also the legend and the tooltip at 1440 AR and EN. Option 0 is the snapshot as it is. Save numbered sheets for
comparison in `D:/fitway-temp/owner-r04-copy-round/sheets/`, one per item, each option labelled with its number and
its text. Look at every sheet yourself before reporting.

## Report

At most 40 lines: each item's options with their Arabic and English text, your recommendation and why, the line
counts at 390 and 320, the sheet paths, and the list of other heavy explanations.
