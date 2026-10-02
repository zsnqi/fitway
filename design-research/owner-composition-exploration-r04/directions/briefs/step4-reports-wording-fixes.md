# Step 4, the wording round: the user's picks on the phone fixes

Brief for a fresh `owner-direction-builder`, milestone `owner-design-exploration-r04`, 2026-10-02. The work is
concept-only (ADR-009). The superseded Owner Paper frames are reference only. You implement decisions the user has
already made. You do not redesign. Where a decision leaves a real choice open, take the plainest reading, note it,
and go on.

## Where

- **Worktree:** `/home/user/s04`, branch `owner-followup-r04-build`, base `e8461a5` (the phone fixes). You are its
  only writer. The coordinator names the paths if the session runs elsewhere.
  - Write only in `design-research/owner-composition-exploration-r04/directions/eclipse/` (E/) and in the scratch
    folder that the coordinator names in the launch prompt.
  - Commit, do not push.
- **Rendering:** the repository's `@playwright/test` from the worktree works unmodified, with Chromium shimmed. Do not
  run `playwright install`. Open pages as `file://` URLs. `E/reports-fixes-capture.mjs` (the last round) is there to
  reuse. The coordinator's scratchpad holds `wording/render.mjs`, which rendered the options the user picked from; it
  shows where each phrase sits and which state and data reach it (including the in-memory data change that makes a
  whole day empty).
- **Entry checks:** in the worktree, run `pnpm check:design-context` and
  `pnpm context:show --milestone owner-design-exploration-r04` (no `--`). Impeccable is the one design skill, and
  `ux-araby` may check Arabic copy. Load no other design or taste skill.

## Read first, only these

1. `/home/user/fitway/design-research/owner-composition-exploration-r04/directions/DO-NOT.md` (the coordinator
   branch). It binds you.
2. The r04 handoff on the coordinator branch,
   `/home/user/fitway/docs/phase-records/handoffs/owner-design-exploration/20260923-165000-owner-design-exploration-r04-activation.md`:
   only the sections from "Reports' phone fixes delivered at `e8461a5`" to the end. Do not read the rest.
3. `E/DESIGN-SPEC.md`, by row ID only: TBL-12, DAT-4, EMP-*, §8 Q11, the rows that record decision 8, and the Daily
   rows for the gap tooltip, the screen-reader text, the chart summary and the coverage list (find them by grep).

## The user's decisions (2026-10-02)

9. **One size and one colour for the whole sentence.** Every no-readings, closed and waiting sentence in E/ (Reports,
   Daily, `components.html`) takes the style its words have now, for the times and dates inside it too. That covers
   Daily's minute table and Reports' full-width rows, where the times are now 13.5 px `--ink-2`. Report the measured
   contrast; if it falls under `DESIGN_GUIDE.md`'s minimum, stop and say so instead of choosing another style.
10. **A whole day without readings keeps its date in its place.** The day shows its date where every day shows it,
    styled like its neighbours, and under it, where average and entries sit, «لا قراءات» / "No readings". No
    figures. Below 721 px this is the day-list item. From 721 px it is the table row: the date in the day column, the
    words in the rest of the row. This replaces «لا قراءات يوم الخميس 17 سبتمبر». Rewrite TBL-12 ("no row header"
    no longer holds for a single day). *The user approved the rule change.*
11. **A single day before readings began takes the same form:** its date in its place, and under it «لا قراءات بعد» /
    "No readings yet". This removes «لا قراءات بعد يوم 12 سبتمبر», which reads as "after 12 September". A run of
    several days before readings keeps «لا قراءات بعد من 26 أغسطس إلى 12 سبتمبر» (accepted 2026-10-02).
12. **Daily's waiting tooltip:** two lines, «بانتظار القراءات» then «منذ 3:00 م» / "Waiting for readings", "since
    3:00 PM". The current time is no longer printed in it. The screen-reader text and the chart summary say the same
    sentence, «بانتظار القراءات منذ 3:00 م» / "Waiting for readings since 3:00 PM". It applies to every state that
    shows this span (offline, unavailable) and to `components.html` where it shows it.
13. **Daily's coverage list:** the label column is unchanged. The value reads «من 2:14 م إلى 2:31 م (18 دقيقة)»,
    the duration in brackets after the range, with no middle dot. A row without a duration reads «من 6:00 ص إلى
    6:09 ص». English follows the same order with the list's current duration wording. The value takes the label's
    colour (decision 9's one-colour rule), so each row reads as one sentence. The «792 من 810 دقيقة» row is not a
    span and is unchanged.

## Unchanged

- The quiet hour bars stay as built. The user reads them clearly.
- Everything else at `e8461a5`: the strip, the hour bars, the day list, K-39, the language and the product rules
  (complete days only, honest empty and closed spans, nothing absent looks live, Western digits, Arabic RTL and
  English LTR).
- Not in this round: Reports' page states (K-02, K-38), K-36, the held-out suite, the full test run, and the Codex
  batch items.

## Evidence (in the scratch folder)

One cropped before-and-after image per decision, `e8461a5` as 1 and the result as 2, at 2x, about 800 px wide, with
only the numbers drawn on the image:

- decision 9: Daily's minute table at its no-readings row, and Reports' full-width row at 768, AR;
- decision 10: the day list at 390, AR and EN, and the table row at 768, AR (the whole-day data change);
- decision 11: the day list at 390, AR (`state=short&from=2026-09-12&to=2026-09-22`, all days shown);
- decision 12: the tooltip at 390, AR and EN;
- decision 13: the coverage list at 390 AR, and at 320 AR to show the wrap.

**Measured** at 1440, 1279, 1200, 1024, 768, 720, 390 and 320, AR and EN: targets of at least 44 px,
`scrollWidth <= innerWidth`, no break inside a date, a time or a range, and the status box does not move (HDR-6).

**Non-regression:** Daily and Reports differ from `e8461a5` only in these sentences, rows and lists. Name every frame
that differs.

**Spec:** rewrite the rows these decisions change, with every number measured; record decisions 9-13 with
`user 2026-10-02`; update `E/README.md` where it describes these; `node E/tools/lint-spec.mjs` finds 0 problems.

## Finish

- Commit once. End the message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Stop for the user's review.**
- Final message, results only, with no caveat dropped: the SHA and the files with +/−; each decision, done or why
  not; the measurements, including decision 9's contrast; the exact images to open, in the order above.
