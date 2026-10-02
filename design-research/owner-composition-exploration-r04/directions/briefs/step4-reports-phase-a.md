# Step 4, phase A: the frame's Operations change, and Reports at 1440

Brief for `owner-direction-designer`, milestone `owner-design-exploration-r04`, 2026-10-01. The work is concept-only
(ADR-009): the superseded Owner Paper frames are reference only, and nothing is accepted or rejected for differing from
them.

## Where

- **Worktree:** `/home/user/s04`, branch `owner-followup-r04-build`, base `d2cf1a3`. You are its only writer.
  - Write only in `design-research/owner-composition-exploration-r04/directions/eclipse/` (E/) and in
    `/tmp/fitway-scratch/reports/`.
  - Commit, do not push.
- **Rendering:** repository `@playwright/test` from `/home/user/s04` works unmodified, with Chromium shimmed. Do not
  run `playwright install`. Open pages as `file://` URLs. Reports takes `lang`, `state`, `range`, `from`/`to`,
  `motion`, `export` and `dialog`, listed in `reports.js:2-3`.
- **Entry checks:**
  - from `/home/user/fitway`, run `pnpm check:design-context`;
  - run `pnpm context:show --milestone owner-design-exploration-r04`, without the `--`.
  - Impeccable is the one design skill, used through that bridge. Load no other design or taste skill.

## Read first, only these

1. `directions/DO-NOT.md` on `/home/user/fitway`: the user's own rejections. They bind you.
2. `directions/NEXT-DIRECTION-BRIEF.md` on `/home/user/fitway`:
   - lines 821-940, "The design-phase plan";
   - its section "What the user wants".
3. `E/DESIGN-SPEC.md`, using the row IDs named below. Do not read it whole.
4. The packet's sections, as `context:show` lists them. `DESIGN_GUIDE.md` §4, §12 and §15 matter most.

## What the round must achieve

The goal is plan §1: Eclipse becomes the single, complete reference. The language carries over, and the composition
does not. Reports composes its own page, decides where its light goes, if anywhere, and does not copy Daily's
arrangement.

### A. The frame: Operations leaves the rail (user decision, 2026-10-01)

- **The decision:** Operations has no section in the rail. At every size, it is reached through the header's status,
  which opens Operations' details: data freshness and sensor health.
  - The phone already works this way, through the badge (BDG-1…4).
  - On desktop and tablet, the status (HDR-3 says it "opens nothing" today) becomes a real control with a 44 px target
    (CHP-2). It keeps HDR-6's fixed box, so a status change moves nothing.
  - One way in, at every size.
- **Applies to Daily and Reports both.** Today's sites:
  - Daily: `index.html:79`, `:114`, `:119-141`; `app.js:498-506`, `:531-627`, `:662-708`; `style.css:748-906`.
  - Reports: `reports.html:69-71`; `reports.js:35`, `:121`, `:451-459`.
- **Reports adopts the frame:**
  - `body[data-frame]` (BRK-11), removing the phone placeholder (`reports.css:334-351`, `:381`);
  - the same header status as every screen, since the status is the frame's (STW-1, STW-2), not Daily's.
- **Spec rows to bring in line:**
  - RAI-1: drop Operations, and correct its source, since the user's 2026-10-01 decision set the order of the
    sections, not this placement;
  - HDR-3, HDR-4 and HDR-6; BRK-2…4; BDG-1…4; STW-1 and STW-2;
  - STA-12, which says "Operations is in the rail", and STA-13;
  - MOT-12, SRF-8, GLO-19, the §3.13 title and K-10.
  - Daily's «تحقّق من حالة التشغيل» note (`app.js:819`) must still point somewhere true.

### B. Reports at 1440, with the review fixes assigned to step 4

- The user accepted all of step 1's review findings (F1-F21, D1, D4). Reports' share is the K entries whose fix
  round is step 4:
  - K-01, K-03, K-04, K-05, K-08, K-09, K-10, K-11, K-13, K-14;
  - K-17, K-18, K-19, K-21, K-22, K-24, K-28, K-29, K-32, K-34, K-35.
  - Re-measure K-25.
- Each K entry names its rule. Fix each to its rule and mark it fixed, with this round's commit.
- The 44 px targets come from BTN-1, CHP-1, CHP-2 and CHP-9. Segments are 36 px inside a 44 px frame (SEG-2, SEG-5).
- **Keep:** PAT-1, DLG-1, BRK-5 and STA-4…8.
- **Do not change** Reports' "no intro, no rolling digits" (MOT-10, OWN-R5). The user decides it in this step's review.

### Not in phase A

- Reports at 768, 390 and 320 is phase B (BRK-9).
- Reports' page states (K-02: loading, closed, unavailable, error) go to a later designer. Leave them alone.
- K-36 is deferred to step 8.

## Evidence (in `/tmp/fitway-scratch/reports/`)

- **Frames:**
  - Reports at 1440×900, AR and EN: the first screen and the full page;
  - Daily at 1440 and 390, AR and EN, for the frame change;
  - the Operations details opened from the status on desktop and on the phone.
  - Open and inspect what you capture. Downscale a frame for viewing, and measure pixel facts in code.
- **One contact sheet for the user:** Reports before (`d2cf1a3`) and after at 1440, AR and EN, plus the frame change.
- **Measured:**
  - targets of at least 44 px;
  - `scrollWidth <= innerWidth`;
  - no line break inside a date, time or range (DAT-3, DAT-4);
  - the status box does not move when the status changes (HDR-6).
- **Non-regression:** apart from the frame change, Daily is unchanged. Prove it with before and after captures of
  its seven states at 1440 and 390.
- **Spec:**
  - new and changed rows are typed as rule (R), composition (C) or known issue (K);
  - every number is measured;
  - `node E/tools/lint-spec.mjs` finds 0 problems.

## Finish

- Commit once. End the message with
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Stop for the user's review.** The coordinator resumes you for phase B with their notes.
- Final message, results only, with no caveat dropped:
  - the SHA and the files with +/−;
  - each K entry's status;
  - the measurements;
  - anything you could not do or that needs the user's decision, as proposals;
  - the exact frames to open, the contact sheet first.
