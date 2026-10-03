<!-- handoff-format: resume-point-v1 -->
# owner-design-exploration-r04: resume point

- **As of:** `codex/owner-redesign-r04` at the commit that adds this file, 2026-10-04 00:44 +03:00; `owner-followup-r04-build` at `e1837cf`
- **Previous resume point:** `docs/phase-records/handoffs/owner-design-exploration/r04/20261003-171600-owner-design-exploration-r04-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`, `docs/agent-context/WORKING_AGREEMENTS.md`

## State

- **Built on `owner-followup-r04-build`:** decisions 16-19, K5, Daily's held status width and the 320 badge
  (`f193046`); Codex round fix-1, decisions 21-24 and the reviews' defects (`f5f0e2d`); the phone touch trial of
  decision 20 (`a223c82`: hold then drag, the reading large in the band, a tap keeps it with close, previous and
  next, every half hour reachable, a shorter busiest-time card). `e1837cf` adds only the verifier brief.
- **Reviews done:** `f193046` (verifier 9 of 11, both failures fixed in fix-1; reading-direction review clean).
  fix-1 and the trial: `D:/Projects/fitway-worktrees/owner-followup-r04-s04/design-research/owner-composition-exploration-r04/directions/briefs/verifier-fix1-touch.md`,
  evidence in `D:/fitway-temp/owner-r04-fix1-touch-verify/`; reading-direction evidence in
  `D:/fitway-temp/owner-r04-fix1-touch-rtl/`. Their open findings are next step 1's list.
- **The user's picks after the trial:** DECISIONS item 25 (the bar, no phone intro, the busiest-time card still open,
  the small fixes, the whole-element review lesson). Item 20 records the phone arrangement staying as it is; the three
  layout options are set aside on `owner-r04-daily-phone` (`b80083a`).
- **Coordinator call on the H3 conflict:** decision 23 aligns Arabic peak times whenever the figures differ in width;
  Readex Pro's two-digit figures differ slightly, so all-two-digit Arabic tables now align too (up to 2.86 px from
  `e675f1e`). Kept: it is what item 23 says, and the held-out row's "unchanged" expectation was the coordinator's.
- **Pages the user has seen:** decisions 16-19 results https://claude.ai/artifact/NxAZnPDf2L57kPvQ4RcmjG; phone
  layouts https://claude.ai/artifact/2oP51ViJ2F5qUrnwqtBUuo; touch ideas https://claude.ai/artifact/Hg4FjvgySLQr4xWBp8bWiX.
  Talk to the user in plain words, without measurements (WORKING_AGREEMENTS "Talking with the user").
- **Codex rounds:** fix-1 recorded in `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`;
  its held-out rows (`D:/fitway-grader/owner-r04/fix-1-heldout.md`) were graded by the verifier above: H1, H2, H4-H7,
  H9 pass, H8 observed (pre-existing), H3 is the conflict above. Add that to the fix-1 entry.

## Running now

Nothing.

## Next steps

1. **One build round** (fresh `owner-direction-builder`) on the build worktree from `e1837cf`, Daily and Reports:
   - DECISIONS item 25: the one smooth slide when a hold or tap starts with the reading area or plot under the bar;
     no first-open intro at 720 px and below; «إلى» / "to" kept with its date in the empty-period sentence; English
     "Waiting for readings" clear of the close button at 320; a straight Tab order across close, previous, next; the
     one-pixel seam in Reports' Arabic header (721 and 768, one-digit with three-digit peaks).
   - The trial verifier's defects: the first ~15 px of a drag after the hold are lost (passive `touchstart`,
     `app.js:1789-1802`); a hold in the band puts the finger on the reading; the English spoken "Last 7 days"
     comparison "compared with from …" (`reports.js:256` with `:930`); the sheet's "Last 7 days" range without its
     unbreakable wrapper (`components.js:89`); the sheet's empty-state row squeezing the alert on the phone
     (`components.js:899`); header lines read run together by screen readers.
2. **The busiest-time card, alongside step 1:** a fresh `owner-direction-designer` (xhigh, not max) draws it again for
   720 px and below, in a copy under `D:/fitway-temp/`, AR and EN at 390 and 320: up to three small variants of the
   card alone, judged as a whole composition. Show the user plain crops; a builder or fixer builds the pick.
3. **After steps 1-2:** a fresh `owner-direction-verifier-high` and `rtl-ltr-reviewer` side by side. Then publish
   Daily and Reports as one private multi-file artifact (pages, scripts, styles, fonts) so the user can try them on
   a real phone and computer (the user asked, 2026-10-03); real touch was never tested.
4. **Then Activity log, in one pass** (DECISIONS "How this milestone's rounds run" item 6): ask the user all its
   questions at once first, in plain words; then `owner-direction-designer-max` with a light brief (the question and
   the hard limits only); one review; the user judges the max trial before it is used again.

## Waiting on the user

Nothing.

## Known risks

- A usage limit stops subagents mid-run: resume each with SendMessage (its transcript survives) instead of
  relaunching. A Codex run dies with the app: resume its thread with the exec flags before `resume`.
- Touch was verified only with CDP emulation; Chromium's touch slop and iOS long-press are unmeasured on a device.
- At 721 and 1023 px EN the busiest-time card's glyphs render about a third of a pixel apart from `f5f0e2d`; boxes
  and styles match; cause unknown (phone-only rules present).
- The whole-element review agreement was committed on this branch (`4d8e3f4`), not on `agent-environment-r02`, whose
  worktree was in use; merge it there.
- `brief:check` crashed on a code span broken across two lines; a separate session ("Fix brief:check crash on a
  wrapped code span") worked on it in `D:/Projects/fitway-worktrees/agent-environment-r02`.
- Ports: 3174 the user's preview; 3176-3177 builders, verifiers and Codex; 3178-3179 reviewers.
- The user-level mod `prompt-cache-control` (cache meter) was installed on 2026-10-04 in `C:/Users/Pc Force/.claude/skills/prompt-cache-control`; it loads
  from the next session.

## Pointers

- Build worktree: `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, expected HEAD `e1837cf`.
- Eclipse source: `D:/Projects/fitway-worktrees/owner-followup-r04-s04/design-research/owner-composition-exploration-r04/directions/eclipse/`.
- Phone layout options (set aside): `D:/Projects/fitway-worktrees/owner-r04-daily-phone`, branch `owner-r04-daily-phone`, expected HEAD `b80083a`.
- Trial frames and video: `D:/fitway-temp/owner-r04-touch-trial/`. Codex evaluations: `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`.
