# Step 4, phase B: three refinements at 1440, then Reports at 768 and 390

Brief for a fresh `owner-direction-designer`, milestone `owner-design-exploration-r04`, 2026-10-01. The work is
concept-only (ADR-009): the superseded Owner Paper frames are reference only, and nothing is accepted or rejected for
differing from them. Phase A was done by another designer. Its decisions are written into the spec, and this brief
gives you what you need from its report.

## Where

- **Worktree:** `/home/user/s04`, branch `owner-followup-r04-build`, base `9b6ae63`. You are its only writer.
  - Write only in `design-research/owner-composition-exploration-r04/directions/eclipse/` (E/) and in
    `/tmp/fitway-scratch/reports-b/`.
  - Commit, do not push.
- **Rendering:** repository `@playwright/test` from `/home/user/s04` works unmodified, with Chromium shimmed. Do not
  run `playwright install`. Open pages as `file://` URLs. Reports' parameters are listed in `reports.js:2-3`.
  - The `check:repository` failure on this branch's old `PROJECT_STATE.yaml` lease is known. Ignore it.
- **Entry checks:**
  - from `/home/user/fitway`, run `pnpm check:design-context`;
  - run `pnpm context:show --milestone owner-design-exploration-r04`, without the `--`.
  - Impeccable is the one design skill. Load no other design or taste skill.

## Read first, only these

1. `/home/user/fitway/design-research/owner-composition-exploration-r04/directions/DO-NOT.md`: the user's own
   rejections. They bind you.
2. `/home/user/fitway/design-research/owner-composition-exploration-r04/directions/NEXT-DIRECTION-BRIEF.md`:
   - lines 821-940, "The design-phase plan";
   - its section "What the user wants".
3. `E/DESIGN-SPEC.md`, by row ID only. Do not read it whole. The rows you need:
   - OWN-R1…R6, CRD-11, TRU-7 and LGT-6…8;
   - BRK-1…11, RAI-*, BAR-*, HDR-*, BDG-* and STW-*;
   - SEG-*, CHP-*, BTN-1, PAT-*, TBL-*, DLG-*, DAT-3 and DAT-4;
   - K-29 and K-36.
   - Daily's phone and tablet compositions, OWN-D6…D10, are a reference for the language. They are not a template.
4. The packet's sections, as `context:show` lists them. `DESIGN_GUIDE.md` §4, §12 and §15 matter most.

## State at `9b6ae63`, from phase A and the user's decisions (2026-10-01)

- **The frame:**
  - Operations is not in the rail.
  - From 721 px, the header status is a 44 px control with no box at rest, and it opens Operations' details. On a
    phone it is the badge.
  - Reports has the full frame: the rail, the modal rail on tablet, and the phone's bar, compact header and menu.
- **Reports at 1440, approved by the user:**
  1. under the header, the period control and "Export minute data";
  2. one card of the period's three figures (CRD-11), with "Last 7 days" in its own plain card at the row's end
     (3 : 1);
  3. the pattern across the page, which is the page's only light;
  4. "Day by day" with "Export table".
  - The order stays. The week card stays plain and stays where it is.
  - There is no intro and no digit roll (Q12). The period is «آخر 28 يومًا» / "Last 28 days".
- **Phase A's caveats:**
  - Reports' layout below 1200 px is provisional. In AR at 768 there is a 2 px overflow inside one figure head.
  - BRK-5's "four summary cards in a row" no longer describes Reports.

## What this round must achieve

### 1. Three refinements at 1440, decided by the user on 2026-10-01

- **Export moves away from the period control,** to the row's far end, which is the left in RTL. The period control
  then stands alone as the page's control, because it is the only thing that changes what you see. "Export minute
  data" is something you take away, and beside the control it reads as part of choosing.
- **The week card names its baseline.** "+9%" says nothing about what it compares with.
  - Add the span it compares with: «مقابل 9 – 15 سبتمبر» / "vs 9 – 15 Sep". Write it as a date range (DAT-3: an en
    dash, spaced) and keep it from breaking (DAT-4).
  - It is a date, not an explanatory caption.
  - Place it where it reads best inside the card.
  - **The user wants to judge whether the card becomes too full.** Deliver before and after crops of the card at
    1440, AR and EN, and say what you weighed. If one placement is clearly crowded, show the alternative you
    considered.
- **The subtitle shows the period's length only for a custom period.** Today "· 28 days" repeats the selected
  "Last 28 days". With a preset, the subtitle is the dates alone. With «فترة أخرى…» / "Custom…", the length stays.

### 2. Reports at 768 and 390, every period and dialog (BRK-9)

- Plan §2: design 1440, 768 and 390. Only check 320, 1024 and 200% zoom (a 720 px reflow), so nothing breaks.
- Plan §3:
  - on tablet, the rail opens over the content, and the content reflows;
  - on the phone, the page controls sit under the title at full width.
- **Compose Reports for each size.** Do not shrink 1440 and do not copy Daily's arrangement.
  - The pattern (7 × 19) and the day table are the hard parts on a phone. Solve them within the rules, with no
    sideways page scroll (BRK-*, PAT-*, TBL-*).
  - The language carries over unchanged: dark, glass, the one light on the pattern, Readex Pro, and the finish.
- **Cover:** `28d` (default), `7d` with the camera gap, `state=short`, an empty July, numbers on, the range dialog
  and the export dialog, in AR and EN.
- **Not in this round:** Reports' page states, K-02 (loading, closed, unavailable, error), which go to the next
  designer. K-36 is deferred to step 8.

## Evidence (in `/tmp/fitway-scratch/reports-b/`)

- **Contact sheets for the user:**
  1. 1440 before (`9b6ae63`) and after, AR and EN, first screen, plus the week card's crops;
  2. 768, AR and EN, first screen and full page, in `28d`, plus one sheet of the other periods and dialogs;
  3. 390, the same set.
  - Label each tile with its size, language and state.
- **Spot frames:** 320, 1024 and 720 (200%).
- **Open and inspect what you capture.** Downscale a frame for viewing, and measure pixel facts in code.
- **Measured at 1440, 1024, 768, 720, 390 and 320, AR and EN:**
  - targets of at least 44 px;
  - `scrollWidth <= innerWidth`;
  - no break inside a date, time or range;
  - the status or badge box does not move when the status changes (HDR-6);
  - focus order and visible rings on the phone bar, the menu, the period control and the dialogs.
- **Non-regression:** Daily is byte-identical to `9b6ae63` in its seven states at 1440, 768 and 390.
- **Spec:**
  - add Reports' tablet and phone compositions (C rows);
  - update BRK-5 and BRK-9, and close K-29 for Reports;
  - type each new row as R, C or K, with every number measured;
  - `node E/tools/lint-spec.mjs` finds 0 problems.

## Finish

- Commit once. End the message with
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Stop for the user's review.**
- Final message, results only, with no caveat dropped:
  - the SHA and the files with +/−;
  - the three refinements, including the week card's verdict;
  - the measurements;
  - proposals that need the user;
  - the exact frames to open, contact sheets first.
