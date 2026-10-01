# Step 4, Reports on the phone: build the user's pick, option B

Brief for a fresh `owner-direction-designer`, milestone `owner-design-exploration-r04`, 2026-10-01. The work is
concept-only (ADR-009): the superseded Owner Paper frames are reference only, and nothing is accepted or rejected for
differing from them. Another designer drew three options. The user picked one, and you build it.

## Where

- **Worktree:** `D:\Projects\fitway-worktrees\owner-followup-r04-s04`, branch `owner-followup-r04-build`, base
  `aa509b9`. You are its only writer.
  - Write only in `design-research/owner-composition-exploration-r04/directions/eclipse/` (E/) and in
    `D:\fitway-temp\reports-phone\build\`.
  - Commit, do not push.
- **Machine:** local Windows. Drive C is full: keep every temp and scratch file on D:, and point `TEMP`/`TMP` at
  `D:\fitway-temp` for any command that writes large temp output. Run Playwright from PowerShell, not Git Bash.
- **Rendering:** the repository's `@playwright/test` from the worktree. Open pages as `file://` URLs. Reports'
  parameters are listed in `reports.js:2-3`. `E/reports-capture.mjs` (phase B) and `E/reports-options-capture.mjs`
  (the options round) are there to reuse or not.
- **Entry checks:** in the worktree, run `pnpm check:design-context` and
  `pnpm context:show --milestone owner-design-exploration-r04` (no `--`). Impeccable is the one design skill. Load no
  other design or taste skill.

## Read first, only these

1. `D:\Projects\fitway-worktrees\owner-design-exploration-r04\design-research\owner-composition-exploration-r04\directions\DO-NOT.md`:
   the user's own rejections. They bind you.
2. `NEXT-DIRECTION-BRIEF.md` in the same folder: lines 18-35, "What the user wants", and lines 821-918, "The
   design-phase plan".
3. `briefs/step4-reports-phone-options.md` in the same folder: the options round's brief, for the problem it answers.
4. `E/DESIGN-SPEC.md`, by row ID only. Do not read it whole. The rows you need:
   - OWN-R1…R11, CRD-11, PAT-*, TBL-*, BRK-*, DAT-3, DAT-4, EMP-*, LGT-6…8 and K-29;
   - its open questions Q17-Q22;
   - OWN-D7, Daily's phone, as a reference for the language only.
5. The packet's sections, as `context:show` lists them. `DESIGN_GUIDE.md` §4, §12 and §15 matter most.

## The user's pick (2026-10-01)

The options round (`aa509b9`) drew three answers behind `?opt=a|b|c`. **The user picked B, "one day at a time":**

- a week strip of 7 radio buttons, each with a small bar;
- the chosen day's 19 hours as labelled bars on one scale for the whole week, with closed and no-readings hours
  collapsed into one worded row each, range first;
- it opens on the busiest weekday (in 7d, the day of the highest peak);
- the day table as a two-line list (date and peak, then average, entries and peak time), 7 days, then "Show all days",
  sorted with a native select;
- at 768, the hours turn into columns with every third hour labelled, and the card ends inside the 1024 fold;
- in an empty period, one icon and one sentence for the whole pattern.

The user did not pick A (the week in three-hour blocks) or C (the week swiped sideways).

## What this round must achieve

1. **B becomes Reports' composition below 1024** (the pattern from 1023 px down, the day table from 720 px down).
   - A, C and the `?opt` switch leave the page. B is no longer an option but the page.
   - 1200 px and up keep their current compositions.
2. **Finish B where the options round left it weak.** These are the known points. Solve them, or say why not:
   - **The week strip barely compares the days.** Its bars show each weekday's busiest hour, which is about the same
     every day, so the bars are nearly equal. The strip should help the owner choose which day to look at.
   - **Quiet hours in the ramp's darkest tones are faint.** The printed number carries the value. Judge whether the
     bar still reads.
   - **An empty period says its sentence twice,** once in the pattern and once in the table.
   - **The day list, fully shown, is about as long as a table.** Judge whether "Show all days" is enough.
3. **Look at 768 under the same lens.** It is not a shrunken 1440 and not a stretched phone. Close Q21 (cells under
   44 px wide below 1024) and Q22 (the 768 fold) with what you build, and decide whether the day table at 768 keeps
   phase B's form.
4. **Remove the Q17 baseline at every size.** «مقابل 9 – 15 سبتمبر» / "vs 9 – 15 Sep" leaves the "Last 7 days" card.
   The user rejected it (DO-NOT.md).
5. **Close Q20** (the one-letter Arabic day heads): B's strip replaces them. Record it.
6. **Unchanged:** the language (dark, glass, the one light on the pattern, Readex Pro, the finish), the product rules
   (complete days only, honest empty and closed spans, Western digits, Arabic RTL and English LTR), and Daily.
7. **Not in this round:** Reports' page states (K-02), K-36, the held-out suite and the full test run.

## Evidence (in `D:\fitway-temp\reports-phone\build\`)

- **Contact sheets for the user, first:**
  1. 390: phase B (`9309382`) and the build, AR and EN, first screen and full page, in `28d`;
  2. 390: `7d` with the camera gap, `state=short`, an empty July, another weekday chosen, the full day list, and the
     range and export dialogs, AR and EN;
  3. 768: the same two sheets;
  4. the "Last 7 days" card at 1440, AR and EN, before and after the Q17 removal.
  - Label each tile with its size, language and state.
- **Spot frames:** 320, 1024 and 720 (200%).
- **Open and inspect what you capture.** Downscale a frame for viewing, and measure pixel facts in code.
- **Measured at 1440, 1024, 768, 720, 390 and 320, AR and EN:**
  - targets of at least 44 px;
  - `scrollWidth <= innerWidth`;
  - no break inside a date, a time, a range or a no-readings phrase;
  - the status or badge box does not move when the status changes (HDR-6);
  - focus order and visible rings on the phone bar, the menu, the period control, the week strip (arrow keys move
    between days), the list's sort and "Show all days", and the dialogs;
  - the page's full height at 390 and 768, against phase B's.
- **Non-regression:** Daily is byte-identical to `aa509b9` in its seven states at 1440, 768 and 390. Reports at 1440
  differs only by the Q17 removal.
- **Spec:**
  - rewrite Reports' tablet and phone rows (OWN-R9…R11, PAT-12, and the TBL and BRK rows B changes), with every
    number measured;
  - close K-29, and record Q17 as rejected and Q20-Q22 as answered, each citing `user 2026-10-01`;
  - type each new row as R, C or K;
  - update `E/README.md` where it describes Reports;
  - `node E/tools/lint-spec.mjs` finds 0 problems.

## Finish

- Commit once. End the message with
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Stop for the user's review.**
- Final message, results only, with no caveat dropped:
  - the SHA and the files with +/−;
  - how you solved each weak point in "Finish B", or why you left it;
  - what 768 became, and the answers to Q20-Q22;
  - the measurements;
  - proposals that need the user;
  - the exact frames to open, contact sheets first.
