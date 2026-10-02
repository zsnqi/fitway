# Step 4, Reports on the phone: the user's decisions on the build

Brief for a fresh `owner-direction-builder`, milestone `owner-design-exploration-r04`, 2026-10-01. The work is
concept-only (ADR-009). The superseded Owner Paper frames are reference only. You implement decisions the user has
already made. You do not redesign. Where a decision leaves a real choice open, take the plainest reading, note it,
and go on.

## Where

- **Worktree:** `/home/user/s04`, branch `owner-followup-r04-build`, base `ff0e922` (the phone build). You are its
  only writer. The coordinator names the paths if the session runs elsewhere.
  - Write only in `design-research/owner-composition-exploration-r04/directions/eclipse/` (E/) and in the scratch
    folder that the coordinator names in the launch prompt.
  - Commit, do not push.
- **Rendering:** the repository's `@playwright/test` from the worktree works unmodified, with Chromium shimmed. Do not
  run `playwright install`. Open pages as `file://` URLs. Reports' parameters are in `reports.js:2-3`.
  `E/reports-build-capture.mjs` (the build round) is there to reuse.
- **Entry checks:** in the worktree, run `pnpm check:design-context` and
  `pnpm context:show --milestone owner-design-exploration-r04` (no `--`). Impeccable is the one design skill. Load no
  other design or taste skill.

## Read first, only these

1. `/home/user/fitway/design-research/owner-composition-exploration-r04/directions/DO-NOT.md` (the coordinator
   branch). It binds you. Its no-readings entry changed today.
2. The r04 handoff on the coordinator branch,
   `/home/user/fitway/docs/phase-records/handoffs/owner-design-exploration/20260923-165000-owner-design-exploration-r04-activation.md`:
   only the sections "Reports' phone build delivered at `ff0e922`" and "The user's review of the phone build, one
   decision at a time". Do not read the rest.
3. `E/DESIGN-SPEC.md`, by row ID only: OWN-R3…R5, OWN-R9…R13, PAT-1, PAT-2, PAT-12…14, TBL-*, BRK-*, TRU-7, DAT-4,
   EMP-*, K-39, and §8 Q11, Q18, Q19.
4. `DESIGN_GUIDE.md` §12 (responsive) and the 44 × 44 px target rule.

## The user's decisions (2026-10-01)

1. **The week strip: one bar per day,** as in the options round (`aa509b9`, `?opt=b`; read it with `git show`). Each
   weekday's bar stands for its busiest hour. The mini outlines of each day's hours leave.
2. **The hour bars: no edge.** The 1 px FITWAY-red edge leaves every bar. The printed number carries a quiet hour's
   value.
3. **The full day list: no dated 7-day headers.** The `dl-chunk` heads and their firmer line leave. The list is one
   plain run of days.
4. **An empty period below the grid's width:** unchanged. The sentence appears once, in the busy-times card with the
   way back, and day by day hides.
5. **"Show all days":** unchanged, one tap for the whole period.
6. **K-39: one day at a time up to 1279 px.** The week grid starts at 1280. At 1024-1279 the busy-times card uses B's
   tablet form (the hours as columns). Make it hold at 1024, 1200 and 1279: targets of at least 44 px, no sideways
   scroll, and the card inside the 1024 fold where it fits. The day table keeps its current form at these widths.
   Close K-39.
7. **The empty custom period's header line keeps its middle dot:** «لا قراءات · 31 يومًا». No change.
8. **A no-readings span is one sentence, the words first:** «لا قراءات من 10:00 ص إلى 2:00 م» / "No readings from
   10:00 AM to 2:00 PM". It replaces «10:00 ص – 2:00 م ···· لا قراءات» everywhere in E/: Reports and Daily, the
   day list, the day table, the hour bars' worded rows, tooltips, and `components.html`.
   - It keeps the phrase's current size and colour.
   - It may wrap only between words, never inside a time.
   - A closed span follows the same order: «مغلق من … إلى …» / "Closed from … to …". This is the coordinator's
     reading of the same rule.
   - Any other phrase built as a range followed by words (for example Daily's «Open, nobody inside»): list it in
     your report as a proposal, and do not change it.
   - The dotted mark on a chart's time axis is a data mark. It stays.

## Small fixes

- On the empty period's button «عرض آخر 28 يومًا», the gaps around «28» are wide at 390 AR. Make them a normal word
  space.
- In the spec, record **Q18** (the phone's export on its own line at the row's end) and **Q19** (the coverage line
  stays with a preset, and the phone subtitle takes two lines) as accepted, each citing `user 2026-10-01`.

## Unchanged

- 1280 px and up keep the week grid. The user decided the desktop does not change.
- The language: dark, glass, the one light on the pattern, Readex Pro, and the finish.
- The product rules: complete days only, honest empty and closed spans, Western digits, Arabic RTL and English LTR.
- Not in this round: Reports' page states (K-02, K-38), K-36, the held-out suite, the full test run, and the Codex
  batch items.

## Evidence (in the scratch folder)

Make the evidence easy for the user to read. Large sheets with many small frames were hard to read last round. Give
each decision one cropped before-and-after image: `ff0e922` as 1 and the result as 2, at 2x, about 800 px wide, with
only the numbers drawn on the image.

- the week strip, 390 AR;
- the hour bars, 390 AR;
- the full day list around a week boundary, 390 AR;
- the busy-times card at 1024 and at 1279, AR;
- a no-readings row, before and after, in the day list at 390 AR, and in Daily at 390 AR;
- the same no-readings row at 320 AR and EN, which shows the wrap;
- the «عرض آخر 28 يومًا» button, 390 AR.

**Measured** at 1440, 1279, 1200, 1024, 768, 720, 390 and 320, AR and EN:

- targets of at least 44 px;
- `scrollWidth <= innerWidth`;
- no break inside a date, a time or a range;
- the status box does not move (HDR-6);
- the strip's focus ring and its arrow keys.

**Non-regression:**

- Daily differs from `ff0e922` only in its no-readings and closed phrases. Name every frame that differs.
- Reports at 1440 differs only in those phrases.

**Spec:**

- rewrite the rows these decisions change, with every number measured;
- close K-39;
- record decision 8 against TBL-12 and Q11;
- update `E/README.md` where it describes these;
- `node E/tools/lint-spec.mjs` finds 0 problems.

## Finish

- Commit once. End the message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Stop for the user's review.**
- Final message, results only, with no caveat dropped:
  - the SHA and the files with +/−;
  - each decision: done, or why not;
  - the measurements;
  - the proposals for the user;
  - the exact images to open, in the order above.
