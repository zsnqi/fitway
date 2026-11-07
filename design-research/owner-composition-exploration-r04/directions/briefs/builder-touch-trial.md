<!-- brief-format: v1 role: builder -->
# Builder brief: Daily's chart by touch on the phone, a trial (owner-design-exploration-r04)

For a fresh `owner-direction-builder` (Opus, high). The decision is made; build exactly it.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `f5f0e2d`
  plus this brief's own commit on top of it
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 1, 4, 5, 7, 8, 11, 12, 20 (item 20's last paragraph is this trial); read the file with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full;
  `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md` rows CHT-12, CHT-15, CHT-18,
  OWN-D7, OWN-D8, OWN-D10, FOC-7 by row ID. Navigate code with
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

- Write frames only in `D:/fitway-temp/owner-r04-touch-trial/`. A local server uses port 3177 only.

## The decision

DECISIONS item 20, last paragraph: the user picked, from the page https://claude.ai/artifact/Hg4FjvgySLQr4xWBp8bWiX,
idea 2 (press and hold, then drag) with idea 4 (previous and next) and the shorter busiest-time card, to try as one
version on the phone. The arrangement of the page does not change. Earlier prototypes to reuse where they fit, read only,
in another worktree: the hold and the large reading in
`D:/Projects/fitway-worktrees/owner-r04-daily-phone/design-research/owner-composition-exploration-r04/directions/options/daily-phone/3/app.js`
and `D:/Projects/fitway-worktrees/owner-r04-daily-phone/design-research/owner-composition-exploration-r04/directions/options/daily-phone/3/style.css`;
the busiest-time row in
`D:/Projects/fitway-worktrees/owner-r04-daily-phone/design-research/owner-composition-exploration-r04/directions/options/daily-phone/1/style.css`.
They were built on another arrangement: take the behaviour, not their layout.

## Causes and required outcomes

At 720 px and below only; 721 px and up stay exactly as they are.

- **P1.** A finger on the plot moves the reading as a mouse does, so a vertical swipe that starts on the plot is
  taken by the chart and the page moves by mistake (the user's problem). Outcome: a swipe in any direction that
  starts on the plot without a hold scrolls the page and reads nothing; a press held still for a moment starts the
  reading, and from then on a drag moves it stop by stop while the page does not scroll; lifting the finger ends it
  and the band above the plot returns to what it shows at rest.
- **P2.** On the phone the reading is the computer's tooltip box in its lane (CHT-12, CHT-18), partly under the
  finger. Outcome: while held, the reading stands large in the band above the plot, clear of the finger: the value,
  its time, the level and the usual value; a gap reads as decision 11's words-first sentence; a waiting state reads as
  decision 11's item 12 text. Nothing in "Inside now" changes at any moment (item 8).
- **P3.** Some stops cannot be reached by a finger (`MAGNET` and `stopNear` in `app.js` let the peak and the latest
  reading capture the evening half hours near them at phone width). Outcome: every half hour of the open day, the
  peak and the latest reading can each be reached by a finger at 390 and 320.
- **P4 (idea 4).** Outcome: a quick tap on the plot reads that time and keeps the reading in the band, with
  previous and next buttons beside it that move it half an hour at a time, and a way to close it; a tap outside the
  chart closes it too. Each button is at least 44 px, named for what it does in both languages, and shows when it is
  at the first or last stop. (Coordinator reading of "with idea 2": a hold is temporary, a tap keeps the reading.)
- **P5.** On the phone the busiest-time card holds its value under its title in a full-width card, half of it empty.
  Outcome: its hours sit beside its title, in the same place on the page, AR and EN, 390 and 320.
- **P6.** Keyboard and screen reader keep working on the phone: Tab reaches the plot and the new buttons in reading
  order, the arrow, Page, Home, End and Escape keys behave as CHT-15 says, and the reading is announced as the
  current tooltip is; focus stays clear of the bottom bar (FOC-7).

Required unchanged: every frame at 721 px and up, AR and EN, equals HEAD's; the phone frames at rest change only by
P5. Every Daily state (live, delayed, offline, no history, closed, loading, error) keeps its places and heights at
390 and 320 (OWN-D10), and while a reading is held or kept, nothing stale looks live (item 8).

Update DESIGN-SPEC rows the outcomes change (at least CHT-15 and OWN-D7, and CHT-12 and CHT-18 for the phone) to what
is built. Regenerate INDEX.md with the command written at its top.

## Frames

Render with the repository's `@playwright/test` in a touch phone context (`hasTouch`, `isMobile`, real touch
events), from `file://` and over HTTP on 3177, at 390 × 844 and 320 × 568, AR and EN. Number the crops the same way in
`D:/fitway-temp/owner-r04-touch-trial/crops/`: 01 at rest; 02 holding at the peak; 03 holding at 4:00 PM; 04 holding
in the gap; 05 holding at 7:00 PM; 06 after a tap, kept, with the buttons; 07 after next twice; 08 delayed, holding on
the latest reading; 09 offline, holding after the last reading; 10 the busiest-time card; and one sheet of 01-07 per
language at 390. Record one real-time video of a hold and drag across the day at 390 AR. Inspect every frame yourself
before reporting; a passing check is not a looked-at frame. (AGENTS.md)

## Scope

You may change, in `design-research/owner-composition-exploration-r04/directions/eclipse/`: `app.js`, `index.html`,
`style.css`, `components.js`, `components.css` (the sheet's chart and card specimens follow the page),
`DESIGN-SPEC.md`, `README.md` and `INDEX.md`; commit once when done. Do not redesign beyond the decision; report
anything that seems to need it. (CLAUDE.md)

## Report

P1-P6 each PASS or FAIL with evidence; the crop folder, the sheets and the video; the hold length you chose and why;
every frame at 721 px and up that differs from HEAD; the files you changed; the commit SHA; anything you could not do;
anything the decision or a rule produces that reads wrong, with the rule named (WORKING_AGREEMENTS "Rules and
findings"). At most 40 lines.
