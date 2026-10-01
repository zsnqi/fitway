# Step 4, Reports on the phone: options for the user to choose from

Brief for a fresh `owner-direction-designer`, milestone `owner-design-exploration-r04`, 2026-10-01. The work is
concept-only (ADR-009): the superseded Owner Paper frames are reference only, and nothing is accepted or rejected for
differing from them. This round shows the user options and stops. A separate designer builds the one the user picks.

## Where

- **Worktree:** `D:\Projects\fitway-worktrees\owner-followup-r04-s04`, branch `owner-followup-r04-build`, base
  `9309382`. You are its only writer.
  - Write only in `design-research/owner-composition-exploration-r04/directions/eclipse/` (E/) and in
    `D:\fitway-temp\reports-phone\options\`.
  - Commit, do not push.
- **Machine:** local Windows. Drive C is full: keep every temp and scratch file on D:, and point `TEMP`/`TMP` at
  `D:\fitway-temp` for any command that writes large temp output. Run Playwright from PowerShell, not Git Bash.
- **Rendering:** the repository's `@playwright/test` from the worktree. Open pages as `file://` URLs. Reports'
  parameters are listed in `reports.js:2-3`. `E/reports-capture.mjs` is phase B's capture script; reuse it or not.
- **Entry checks:** in the worktree, run `pnpm check:design-context` and
  `pnpm context:show --milestone owner-design-exploration-r04` (no `--`). Impeccable is the one design skill. Load no
  other design or taste skill.

## Read first, only these

1. `D:\Projects\fitway-worktrees\owner-design-exploration-r04\design-research\owner-composition-exploration-r04\directions\DO-NOT.md`:
   the user's own rejections. They bind you. Its entry "Do not fit the phone by compressing the desktop composition"
   is the reason for this round.
2. `NEXT-DIRECTION-BRIEF.md` in the same folder: lines 18-35, "What the user wants", and lines 821-918, "The
   design-phase plan".
3. `E/DESIGN-SPEC.md`, by row ID only. Do not read it whole. The rows you need:
   - OWN-R1…R11, PAT-*, TBL-*, BRK-*, DAT-3, DAT-4, EMP-* and K-29;
   - OWN-D7, Daily's phone, as a reference for the language only. It is not a template.
4. The packet's sections, as `context:show` lists them. `DESIGN_GUIDE.md` §4, §12 and §15 matter most.

## The problem

The user reviewed Reports at 390 from phase B (`9309382`) on a real phone and rejected it as **compressed, not
designed**:

- the page reads squeezed, thin and very long;
- the pattern became 7 narrow columns (cells 31.6 px wide, a 1152 px card), with one-letter Arabic day heads;
- in an empty period, every column draws «لا قراءات», which breaks over two lines and collides with its neighbours
  (the user circled it on `390 · AR · empty July · pattern`);
- the day table is cramped too.

The cause: phase B kept every slot of 1440 (7 × 19 cells, the five-column table) and made them fit by narrowing. Its
measured checks all passed (44 px targets, no sideways scroll, no broken dates), and that is the point: those checks
are lint, not design quality. Q20 (the one-letter day heads), Q21 (cells under 44 px wide below 1024) and Q22 (the 768
fold) stay open until this is solved.

## What this round must achieve

Show the user **two or three genuinely different options** for Reports' busy-times pattern, its day table and its
empty periods on the phone, rendered as real pages, so the user can pick one.

- **Start from the owner's question, not from 1440's slots.** On a phone, what does the owner need from "how does my
  gym usually behave" and "day by day"? An option may show less at once, if what it shows reads well and the rest is
  one clear step away.
- **Different answers, not degrees of compression.** Where the trade-off is real, the options should sit on different
  sides of it. Examples, not a menu: one day at a time, coarser time blocks, or a different form for the pattern; a
  list form for the day table.
- **Hypotheses to test, not decisions:**
  - an empty period shows one message for the whole pattern, as the table's empty state does, not one label per
    column;
  - the day table on the phone may need a list form rather than five squeezed columns.
- **The language carries over unchanged:** dark, glass, the one light on the pattern, Readex Pro, and the finish.
  Every product rule still holds: complete days only, honest empty and closed spans, Western digits, Arabic RTL and
  English LTR.
- **Say how each option carries to 768.** The tablet gets the same lens (Q21, Q22); it does not have to share the
  phone's form.
- **Real pages.** Each option runs on the page's real data and states, so the picked one can be built out. How you
  make them coexist for this round is your call. The current page without an option must still render as it does at
  `9309382`, and Daily is untouched.
- **Not in this round:** building the picked option fully, removing the Q17 baseline, Reports' page states (K-02), and
  anything on Daily.

## Evidence (in `D:\fitway-temp\reports-phone\options\`)

- **One comparison sheet for the user, first:** phase B's 390 as the "before" tile, then each option at 390 in AR,
  showing the pattern and the day table in `28d` (default) and in an empty July. Label each tile with its option,
  size, language and state.
- **Per option:** 390 in AR and EN for `28d`, `7d` with the camera gap, and an empty July; and one 768 AR frame in
  `28d` showing how the option carries to the tablet.
- **Open and inspect what you capture.** Downscale a frame for viewing, and measure pixel facts in code.
- **Measured per option at 390 and 320, AR and EN:**
  - the page's full height at 390, against phase B's;
  - the pattern's cell size, or its equivalent in the option's form;
  - targets of at least 44 px;
  - `scrollWidth <= innerWidth`;
  - no break inside a date, a time, a range or a no-readings phrase.

## Finish

- Commit once. End the message with
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Stop for the user's choice.**
- Final message, results only, with no caveat dropped:
  - the SHA and the files with +/−;
  - per option: what it shows, what the owner gives up against 1440, how it carries to 768, and its measurements;
  - your recommendation, and why;
  - how to open each option (the exact `file://` URLs and parameters);
  - the exact frames to open, the comparison sheet first.
