<!-- handoff-format: resume-point-v1 -->
# owner-design-exploration-r04: resume point

- **As of:** `codex/owner-redesign-r04` at the commit that adds this file, 2026-10-04; `owner-followup-r04-build` at `436fe40`
- **Previous resume point:** `docs/phase-records/handoffs/owner-design-exploration/r04/20261004-015612-owner-design-exploration-r04-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`, `docs/agent-context/WORKING_AGREEMENTS.md`

## State

- **Both Codex rounds finished and are merged on `owner-followup-r04-build`:** card-1 at `0fcd3e3`, touch-1 at `38a86cd`,
  and the merge at `436fe40` (INDEX.md regenerated; OWN-D7 names the slide from the top; MOT-11 drops the promise
  that a reduced-motion flick stops at release). Both are recorded in `codex-rounds.md`; their held-out rows wait for
  the review. Nothing is reviewed yet: `bd8bada`, card-1 and touch-1 are all still unreviewed.
- **Context trimmed (the user's choice, 2026-10-04):** most plugins are off, 14 redundant design skills can only be
  run by the user with `/`, and shadcn and context7 were removed. The settings apply from the next session on. The
  Impeccable plugin was kept for its UI hook. This setup is machine-local and is not project truth.

## Running now

Nothing.

## Next steps

1. **One review** of `bd8bada`, `0fcd3e3` and `38a86cd` as merged at `436fe40`: a fresh `owner-direction-verifier-high`,
   scoped to the changed elements, reading direction included, grading the held-out rows
   `D:/fitway-grader/owner-r04/card-1-heldout.md` and `D:/fitway-grader/owner-r04/touch-1-heldout.md` (they never go
   in a brief). Save its report as `REPORT.md` in its folder, then fill in the held-out rows and failure causes in
   `codex-rounds.md`.
2. **Send the fixes from that review to Codex,** together with: the computer's busiest-time card, which takes «مساءً» and
   «بمعدّل» from 721 px up as well (DECISIONS item 26); the Arabic button «عرض آخر 28 يومًا» in `components.js`,
   whose gaps around «28» are too wide (Reports fixed this, but the sheet did not); and the sheet's decision-20
   caption, which still says "hours beside the title" (reported by card-1). Also settle the `.sw-line` detector finding
   in `style.css`: card-1 judged it a false positive and left it in place.
3. Publish Daily and Reports as one private multi-file artifact for the user's phone and computer (real touch was
   never tested).
4. Then Activity log in one pass (DECISIONS "How this milestone's rounds run" item 6): ask all its questions first,
   then `owner-direction-designer-max`, one review.

## Waiting on the user

Nothing.

## Known risks

- touch-1's L3 failed on the brief's literal wording: the previous-time button goes from the latest reading (7:42) to
  7:30, as the baseline does. This looks like a brief fault, and the review should confirm it.
- Pinch was proved only by CDP emulation (scale 1 to 1.0066). Pinch, iOS long-press and the real feel of a flick
  are unmeasured on a device.
- At 721 and 1023 px EN, the busiest-time card's glyphs render about a third of a pixel apart from `f5f0e2d`. The
  cause is unknown.
- «مساءً» on the phone card is a deliberate exception to `DESIGN_GUIDE.md` §9 («ص/م»); carry it to the later ADR.
- Ports: 3174 is the user's preview; 3176-3177 are for builders, verifiers and Codex; 3178-3179 are for reviewers.

## Pointers

- Build worktree: `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `436fe40`.
- Codex reports: `D:/fitway-temp/codex-runs/owner-card-1/` (the long report is the largest `agent_message` in
  `events.jsonl`) and `D:/fitway-temp/codex-runs/owner-touch-1/last-message.md`; evidence is in
  `D:/fitway-temp/owner-r04-card-1/` and `D:/fitway-temp/owner-r04-touch-1/`.
- Eclipse source: `D:/Projects/fitway-worktrees/owner-followup-r04-s04/design-research/owner-composition-exploration-r04/directions/eclipse/`.
- Codex evaluations: `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`.
