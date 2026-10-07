<!-- brief-format: v1 role: designer -->
# Designer brief: English tables read left to right on their own terms (owner-design-exploration-r04)

For a fresh `owner-direction-designer` (Opus, xhigh). Options for the user to pick; you build nothing in any
repository.

- **Source:** a snapshot of Eclipse at `41a6f7c` (branch `owner-followup-r04-build`), at
  `D:/fitway-temp/owner-r04-en-tables/src/design-research/owner-composition-exploration-r04/directions/eclipse/`.
  Work on copies of it under `D:/fitway-temp/owner-r04-en-tables/`; the snapshot itself stays as it is (option 0).
- **Milestone:** `owner-design-exploration-r04`. Decisions:
  `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 3, 9, 10, 11 and 12.
- **Read first, only these:** the snapshot's `../DO-NOT.md`, in full; the snapshot's `DESIGN-SPEC.md` TBL rows by
  ID; the frame the user commented on, `D:/fitway-temp/owner-r04-d5-d6-pick/d5-options-1440-en.png`. Navigate code
  with the snapshot's `INDEX.md`.

<!-- environment:start v1 -->
## Environment

- Work only in `D:/fitway-temp/owner-r04-en-tables/`. Never write in any worktree, never push, fetch, switch branches,
  or touch global configuration.
- Use absolute paths; the shell's working directory resets between calls.
- Wait on long jobs with Monitor or a background shell, never `sleep` or `Start-Sleep`.
- Run Playwright from PowerShell, with the repository's `@playwright/test` from
  `D:/Projects/fitway-worktrees/owner-design-exploration-r04/node_modules`. Drive C is full: set `TEMP`/`TMP` to
  `D:/fitway-temp` for anything that writes much.
- Open pages over `file://` only: ports 3176-3179 are all in use by other agents.
- If a source here is missing or contradicts what you find, stop and report the gap instead of guessing.
- Return your report as your final message, not as a file.
<!-- environment:end -->

## Why

The user looked at Reports' day-by-day table (the frame above, 2026-10-03). In Arabic it is right: the headings, the
figures and «لا قراءات بعد» all start on the same right-hand edge. In English the single day's "No readings yet" lines
up with nothing, and the peak cell reads "6:25 PM 55", Arabic's geometry copied. The user's direction: English must
not copy Arabic. In English the column aligns to the left, and the time sits to the right of its figure: "55 6:25 PM".

Decision 9 ("numbers and their headers align on the physical right edge") is the rule that produced the English
layout. The user's direction overrides it for English in the Peak column. Whether it also changes English's other
numeric columns (Average, Entries) is open: that is what the options decide. Arabic does not change.

## What to produce

Options, each applied to every English table and every row kind in it (an ordinary day, the peak row, a day without
readings, a day still waiting, a no-readings span) on Reports, on Daily, and in the component sheet's table specimens:

- **A.** The Peak column starts at its left edge in English: its heading, the figure, then the time, and a day's
  no-readings words, all on that one edge. The other columns stay as they are.
- **B.** Every English column starts at its left edge: Arabic mirrored in full.
- **C,** only if you find one clearly better than A and B: your own, with the reason.

In each option the times in the Peak column must line up from row to row even when the figure's width changes (9, 55,
120). Arabic must render exactly as option 0 does; check it.

Render each option at 1440, 1024 and 768 EN, at 390 and 320 EN where a table shows there, and Arabic at 1440 for
reference. Save numbered comparison sheets in `D:/fitway-temp/owner-r04-en-tables/sheets/`, each option labelled with
its letter, cropped so the table's heading row and the single-day row show together. Look at every sheet yourself
before reporting.

## Report

At most 30 lines: each option in one sentence, what changes and where, your recommendation and why, measurements that
show the edges line up (start-edge spread per column, per option), the sheet paths, and anything the options could
not settle.
