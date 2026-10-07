<!-- brief-format: v1 role: designer -->
# Designer brief: copy round 2, Reports' heavy explanations and the line's name (owner-design-exploration-r04)

For a fresh `owner-direction-designer` (Opus, xhigh). A copy round: options for the user to pick. You build nothing in
any repository.

- **Source:** a snapshot of Eclipse at `41a6f7c` (branch `owner-followup-r04-build`), at
  `D:/fitway-temp/owner-r04-copy-round-2/src/design-research/owner-composition-exploration-r04/directions/eclipse/`.
  Work on copies of it under `D:/fitway-temp/owner-r04-copy-round-2/`; the snapshot itself stays as it is (option 0).
- **Milestone:** `owner-design-exploration-r04`. Decisions:
  `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 2, 3, 8, 11, 12, 13 and 17.
- **Read first, only these:** the snapshot's `../DO-NOT.md`, in full (decision 3); the `ux-araby` skill, for every
  Arabic line; `D:/Projects/fitway-worktrees/owner-design-exploration-r04/design-research/owner-composition-exploration-r04/directions/NEXT-DIRECTION-BRIEF.md`
  lines 245-257 (item 8: the page carries names and values, not explanatory captions); round 1's report of what it
  found, in this brief below. Navigate code with the snapshot's `INDEX.md`.

<!-- environment:start v1 -->
## Environment

- Work only in `D:/fitway-temp/owner-r04-copy-round-2/`. Never write in any worktree, never push, fetch, switch
  branches, or touch global configuration.
- Use absolute paths; the shell's working directory resets between calls.
- Wait on long jobs with Monitor or a background shell, never `sleep` or `Start-Sleep`.
- Run Playwright from PowerShell, with the repository's `@playwright/test` from
  `D:/Projects/fitway-worktrees/owner-design-exploration-r04/node_modules`. Drive C is full: set `TEMP`/`TMP` to
  `D:/fitway-temp` for anything that writes much.
- Open pages over `file://` only: ports 3176-3179 are in use by other agents.
- If a source here is missing or contradicts what you find, stop and report the gap instead of guessing.
- Return your report as your final message, not as a file.
<!-- environment:end -->

## Why

Eclipse is becoming the single design reference for Owner, then Staff, then Public (decision 2): what it says is what
later screens copy. Copy round 1 found these four as heavy as the line's explanation the user rejected, and the user
wants them fixed now:

1. **The export dialog's description** (`exportDesc`, `reports.js`): «صف لكل دقيقة، مع تمييز الدقائق المغلقة والدقائق
   التي بلا قراءات.» / "One row for every minute, with closed and missing minutes marked."
2. **"Last 7 days" without enough history** (`wowEmpty` and `wowEmptyNote`): «يلزم 14 يومًا · القراءات منذ …» /
   "Needs 14 days · readings since …": two clipped facts the reader has to join. Open it with `?state=short`.
3. **The export failure** (`failed`): «تعذّر تجهيز الملف. لم يُحفظ شيء، والتواريخ كما هي.» / "The file couldn't be
   prepared. Nothing was saved, and your dates are kept.": three statements. Open it with `?export=fail`.
4. **The line's name in Daily's legend** (`keyLine`, `app.js`, and the component sheet's legend): «معدّل كل 30 دقيقة»
   / "30-min average" can read as one average per half hour; the line is a centred average at every minute. With
   decision 17 the coverage card no longer explains the line, so this name is the only thing that names it.

## What must stay true

- Each sentence says only what is true of the state it describes, and a state never reads more live, complete or
  certain than it is (decision 8). The export failure still tells the owner whether anything was saved.
- The line's name stays true: it is smoothed, not the raw readings; the peak marker shows the raw peak.
- Wording rules: decision 11 and `DO-NOT.md` (no dash inside a sentence; ranges as decision 12).

## What to produce

For each of the four, two or three options, Arabic first, each English the same meaning, plainer and shorter than now;
for item 2 the options may change which facts are shown, as long as they stay true. Say for each item which other
places the change reaches (screen-reader text, the component sheet). Also name any rule or decision that makes an
option read wrong (WORKING_AGREEMENTS "Rules and findings").

Render every option in place, in your copies: items 1-3 on Reports at 1440 and 390, item 4 on Daily's chart legend
at 1440 and 390, AR and EN, with the coverage card shown without its "The line" row. Option 0 is the snapshot as it
is. Save one numbered sheet per item in `D:/fitway-temp/owner-r04-copy-round-2/sheets/`, each option labelled with
its number and its text, cropped tight enough to read on a laptop screen. Look at every sheet yourself before
reporting.

## Report

At most 40 lines: each item's options with their Arabic and English text, your recommendation and why, line counts
where they matter, the sheet paths, and any rule you found to read wrong.
