<!-- brief-format: v1 role: builder -->
# Builder brief: decisions 16-19, K5, Daily's reserved status width, the badge at 320 (owner-design-exploration-r04)

For a fresh `owner-direction-builder` (Opus, high). Every decision is made; build exactly them.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `41a6f7c`
  plus this brief's own commit on top of it
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 3, 9, 11, 12, 16, 17, 18, 19 (read them in the `codex/owner-redesign-r04` branch:
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:<path>`).
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full;
  `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md` rows TBL-1, TBL-6, TBL-9,
  TBL-12, GLO-4, GLO-10, STA-3, HDR-4, BDG-1, SPC-6 by row ID. Navigate code with
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

- Write frames only in `D:/fitway-temp/owner-r04-d16-19/`. A local server uses port 3177 only; 3174 and 3176 belong to
  others. The option folders named below are read-only references: never write in them. (r04 G5)

## The decisions

The user picked from exact renders on 2026-10-03: item 16 from `D:/fitway-temp/owner-r04-en-tables/optB/` (option B,
figures flush on the edge, not the indenting variant in `D:/fitway-temp/owner-r04-en-tables/work/optB-units/`); items 17 and 18 and D6's R2 (the
coordinator's pick, item 16) from `D:/fitway-temp/owner-r04-copy-round/work/options.mjs`, options `usual-1` and
`rows-2`; item 19 from `D:/fitway-temp/owner-r04-copy-round-2/opt/` options `1-3`, `2-4`, `3-2` and `4-1`, whose edits
are listed in `D:/fitway-temp/owner-r04-copy-round-2/work/build-options.mjs`. Each option folder is a copy of
Eclipse at `41a6f7c` with only that option changed: diff it against your worktree to see the change.

## Causes and required outcomes

- **T1 (item 16).** English tables copy Arabic's geometry: numbers and headers sit on the physical right edge. Outcome,
  in English only, at every width and in every state that shows a table: every numeric column of Reports' day table,
  Daily's minute table and the component sheet's tables starts at its left edge, header and figures flush on that edge,
  as in `D:/fitway-temp/owner-r04-en-tables/optB/`; in the Peak column the time sits to the right of its figure and the times line up whatever the
  figure's width; a day's no-readings words start on the same edge. The slot is measured after fonts load
  (`EclipseTables.fitSlots` in `D:/fitway-temp/owner-r04-en-tables/optB/`). If English no longer needs `alignDayNoneRows`, drop it for English.
- **T2 (item 16, Arabic).** In Arabic a peak with three digits puts its time out of line with the two-digit rows'.
  Outcome: Arabic's peak times line up when a peak has three digits; nothing else in Arabic changes.
  `D:/fitway-temp/owner-r04-en-tables/work/capture.mjs` shows how the earlier round opened and checked these cases.
- **C1 (items 17, 18; D6's R2).** Outcome: Daily's coverage card has no "The line" row in either language; the usual
  day reads as option `usual-1` everywhere that option changes it, including the no-history form, the screen-reader
  sentences and the component sheet's legend; English coverage rows read as option `rows-2`. Arabic rows unchanged.
- **C2 (item 19).** Outcome: the export dialog has no description and no `aria-describedby` (`1-3`); "Last 7 days"
  without enough readings shows the line «لا تكفي القراءات بعد» / "Not enough readings yet" in place of today's
  `wowEmpty` text, with `2-4`'s note; the export failure reads as `3-2`; the line's name reads as `4-1` in Daily's
  legend, the minute table's column, the chart's screen-reader text, the component sheet and DESIGN-SPEC GLO-4.
- **K5.** The component sheet's single-day specimen builds its row from `EclipseTables.dayNoneRow` but its day cell is
  a hand-built copy, and at 320 the specimen table runs 14-15 px into the card's padding. Outcome: the day cell comes
  from the pages' component, and at 320 the specimen stays inside the card's padding, AR and EN.
- **S1 (coordinator decision).** Daily's reserved status width follows the latest reading's time (`renderReserve` in
  `app.js`), so the control's width can change through the day. Outcome: the width is held at the widest time the day
  can show, and Daily's header stays on one line at 1024 EN (measured at `41a6f7c`: 283.2 px fits). Report the width.
- **S2.** At 320 EN, Delayed, Reports' status badge sits 2.89 px from the title under a classic (non-overlay)
  scrollbar (`.rp[data-frame] .head` grid in `reports.css`, the K-38 block). Outcome: at 320 AR and EN, in every
  Reports state, with classic and overlay scrollbars, the badge keeps at least SPC-6's 8 px from the title. Check
  first where `41a6f7c` already meets this; a case it fails there that this round does not touch is pre-existing:
  report it, required unchanged.

Required unchanged: every frame of Daily (every state its capture covers), Reports (no `?state=`, and every state) and
`components.html` equals `41a6f7c`, except where the outcomes above change it, at 1440, 1024, 768, 390 and 320, AR and
EN. Render the baseline from your own copy of `41a6f7c` in your temp folder (`git archive`). List every frame that
differs and why.

Update DESIGN-SPEC rows the outcomes change (TBL-1, TBL-9, TBL-12, GLO-4, GLO-10 and any other row or `README.md`
line that states the old geometry or wording) to what is built. Regenerate INDEX.md with the command written at its top.

## Frames

Render with the repository's `@playwright/test`, over HTTP from port 3177 and from `file://`, at 1440, 1024, 768, 390
and 320, AR and EN. Save one first-screen PNG per frame at device scale 2 as
`D:/fitway-temp/owner-r04-d16-19/frames/<daily|reports|components>/<NN-state>-<width>-<ar|en>.png` (the component
sheet as a full page). Crop before and after, at 2x, into `D:/fitway-temp/owner-r04-d16-19/crops/`: Reports' day table
and Daily's minute table at 1440, 768 and 390 EN, and 1440 AR with a three-digit peak; Daily's coverage card and legend
at 1440 and 390, AR and EN; "Last 7 days" without enough readings, the export dialog and the export failure at 1440 and
390, AR and EN; the K5 specimen at 320; Daily's 1024 EN header; Reports' 320 EN Delayed header with a classic scrollbar.
Inspect every frame yourself before reporting; a passing check is not a looked-at frame. (AGENTS.md)

## Scope

You may change, in `design-research/owner-composition-exploration-r04/directions/eclipse/`: `app.js`, `reports.js`,
`components.js`, `index.html`, `reports.html`, `components.html`, `style.css`, `reports.css`, `components.css`, the
`*capture.mjs` scripts whose checks the outcomes change, `DESIGN-SPEC.md`, `README.md` and `INDEX.md`; commit once when
done. Do not redesign beyond the decisions; report anything that seems to need it. (CLAUDE.md)

## Report

T1, T2, C1, C2, K5, S1 and S2 each PASS or FAIL with evidence; S1's width; the frame and crop folders, the crops
numbered; every frame that differs from `41a6f7c` and why; the files you changed; the commit SHA; anything you could not
do; anything the brief's rules or the user's decisions produce that reads wrong, with the rule or decision named
(WORKING_AGREEMENTS "Rules and findings"). At most 40 lines.
