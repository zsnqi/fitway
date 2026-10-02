# Step 4, decisions 15 and 16 and the flag: one build round on `ca70f44`

Brief for a fresh `owner-direction-builder`, milestone `owner-design-exploration-r04`, 2026-10-02. The work is
concept-only (ADR-009). The superseded Owner Paper frames are reference only. You implement decisions the user has
already made. You do not redesign. Where a decision leaves a real choice open, take the plainest reading, note it,
and go on.

## Where

- **Worktree:** `D:\Projects\fitway-worktrees\owner-followup-r04-s04`, branch `owner-followup-r04-build`, base
  `ca70f44`. You are its only writer.
  - Write only in `design-research/owner-composition-exploration-r04/directions/eclipse/` (E/) and in the scratch
    folder that the coordinator names in the launch prompt.
  - Commit, do not push.
- **Shell:** Windows. Run Playwright and Node from PowerShell, not Git Bash (Git Bash mangles `/`-leading arguments).
  Large temporary output goes under `D:\fitway-temp`, never drive C.
- **Rendering:** the repository's `@playwright/test` from the worktree. Do not run `playwright install`. Open pages as
  `file://` URLs. `E/wording-capture.mjs` and `E/reports-fixes-capture.mjs` are there to reuse.
- **Entry checks:** in the worktree, run `pnpm check:design-context` and
  `pnpm context:show --milestone owner-design-exploration-r04` (no `--`). Impeccable is the one design skill, and
  `ux-araby` may check Arabic copy. Load no other design or taste skill.

## Read first, only these

1. `D:\Projects\fitway-worktrees\owner-design-exploration-r04\design-research\owner-composition-exploration-r04\directions\DO-NOT.md`
   (the coordinator branch). It binds you, including the range rule.
2. The r04 handoff on the coordinator branch,
   `D:\Projects\fitway-worktrees\owner-design-exploration-r04\docs\phase-records\handoffs\owner-design-exploration\20260923-165000-owner-design-exploration-r04-activation.md`:
   only the sections from "The user's review of the wording round" to the end. Do not read the rest. The inline
   preview's CSS and DOM and the flag options are described there.
3. `E/DESIGN-SPEC.md`, by row ID only: the rows that record the peak time and the «الأعلى» flag in Reports' table and
   day list, TBL-*, decision 14's rows for Daily's coverage list, and HDR-6 (find them by grep).

## The user's decisions (2026-10-02)

15. **The peak time beside the number at 721-1023 px**, as in the inline preview the user accepted. Include the fix
    for the Arabic time sitting 2 px above the number's baseline: `[dir="rtl"] .pk { align-items: baseline; }` or its
    equivalent in the built markup. Measure the baselines after the fix (AR and EN) and report them.
16. **Daily's coverage list:** no brackets, the middle dot back: «2:14 م – 2:31 م · 18 دقيقة». Decision 14's dash
    rule stands. The range and «· 18 دقيقة» never break inside (each is one unbreakable unit; the line may wrap only
    between them). English follows the same order. Apply it wherever the list appears, `components.html` included.
17. **The «الأعلى» / "Top" flag goes (option 3).** Remove the flag at every width, in the table and in the phone day
    list, Reports and `components.html`. Keep the peak row's tint as it is. The top «أعلى ذروة» card, which names the
    day, time and value in words at every width, is now the only spoken cue; check that it still does so at 320, 390,
    768 and 1440, AR and EN. Keep any screen-reader text that marks the peak row, worded without the flag if it quoted
    it. Update the spec rows that describe the flag.

## Unchanged

- Everything else on `ca70f44`. The deferred defects listed in the last handoff section are not in this round,
  except defect 1 (inside decision 15). Defect 2 should disappear with the flag; confirm it.

## Verify and report

- Render AR and EN at 320, 390, 721, 768, 1023, 1024 and 1440 for Reports, and 320, 390 and 1440 for Daily's coverage
  list and `components.html`. Inspect them yourself. Check: no horizontal scroll introduced, no range or duration
  broken inside, no clipped text, the peak column unshifted where decision 15 does not apply.
- Commit on `owner-followup-r04-build`. Report in under 40 lines: the commit, the files touched, the spec rows
  changed, the measured baselines, and the absolute paths of the key crops (Reports 768 AR and EN, 390 AR, Daily
  coverage 390 AR and 320 AR). Keep the crops in the scratch folder.
