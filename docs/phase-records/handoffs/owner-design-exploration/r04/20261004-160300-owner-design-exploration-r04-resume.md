<!-- handoff-format: resume-point-v1 -->
# owner-design-exploration-r04: resume point

- **As of:** `codex/owner-redesign-r04` at the commit that adds this file, 2026-10-04 16:03 +03:00 (updated after the designer's return); `owner-followup-r04-build` at `7bb5845`; `owner-r04-activity` at `a8aa8ad`
- **Previous resume point:** `docs/phase-records/handoffs/owner-design-exploration/r04/20261004-154306-owner-design-exploration-r04-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`, `docs/agent-context/WORKING_AGREEMENTS.md`

## State

- **Daily and Reports are built through Codex fix-3** on `owner-followup-r04-build`: the review of `436fe40`
  (DECISIONS 27), the busiest-time card's form and one period word (28), Codex fix-2 `ac3ae02`, the user's answers on
  its review (29), Codex fix-3 `4e0be02`. `7bb5845` only adds the fix-3 verifier brief. All rounds are graded in
  `codex-rounds.md`.
- **The user tried both pages on a phone and a computer** (DECISIONS 30): all good so far. One open note: Reports'
  «معدّل الموجودين» card is too empty (artifact comment thread on `#fig-avg`, left open).
- **Activity log's questions are answered** (DECISIONS 31); the research digest is
  `D:/fitway-temp/owner-r04-activity-questions/REPORT.md`.
- **Process:** brief rules B8 and B9 (DECISIONS "How this milestone's rounds run" item 3); a repeat-fault line per
  Codex round (`codex-rounds.md` intro); the lessons from Daily and Reports (item 7), which the remaining screens follow.

## Running now

Nothing. The fix round returned `e72e5fe` on `owner-r04-activity` (report
`D:/fitway-temp/owner-r04-activity-fix-1/REPORT.md`); published https://claude.ai/artifact/RKEfwzfwZ7oD5r5fZLnqPS from
the scratchpad staging (no `tuner.js`).

## Next steps

1. **Activity log:** the user tries the published build. Then one small follow-up (DECISIONS 32, last bullet: the
   export dialog's picker, components sheet date specimens, one-string owner names), then merge `owner-r04-activity`
   into `owner-followup-r04-build`.
2. **Daily and Reports' last round,** after Activity log or beside it: the «معدّل الموجودين» card redrawn by a
   designer and shown to the user before Codex builds it; fix-3's open findings in `D:/fitway-temp/owner-r04-fix-3-verify/REPORT.md`.
   The old artifact Fu3qDtwnRUNd9zMj5NiMZp (with the `#fig-avg` thread) no longer lists; the note stands as DECISIONS 30.

## Waiting on the user

The user tries Activity log at https://claude.ai/artifact/4rrdgUHUuX8hyiQeGTSMdC (staged copy of `a8aa8ad`
without `tuner.js`, staging `D:/fitway-temp/owner-r04-artifact-2/`) and answers the designer's questions.

## Known risks

- Pinch, iOS long-press and a flick are proved on a device only by the user's informal try (DECISIONS 30).
- The catch-up after a fast swipe takes about 0.4 s and depends on the screen's refresh rate (accepted, DECISIONS 29).
- «مساءً», «ظهرًا», «ليلًا» on the busiest-time card are a deliberate exception to `DESIGN_GUIDE.md` §9; carry it to the
  later ADR.
- The artifact is a staged copy without `tuner.js`; republish from a fresh staging after any new build.
- Codex: the first account hit its five-hour limit on 2026-10-04 and the round was resumed on another account
  (`codex-rounds.md` fix-2 "Environment").
- Ports: 3174 is the user's preview; 3176-3177 are for builders, verifiers and Codex; 3178-3179 are for reviewers.

## Pointers

- Build worktree: `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `7bb5845`.
- Reviews: `D:/fitway-temp/owner-r04-review-436fe40/REPORT.md`, `D:/fitway-temp/owner-r04-fix-2-verify/REPORT.md`;
  designer `D:/fitway-temp/owner-r04-busiest-average/REPORT.md`.
- Codex runs: `D:/fitway-temp/codex-runs/owner-fix-2/` and `D:/fitway-temp/codex-runs/owner-fix-3/` (`last-message.md`).
- Artifact: https://claude.ai/artifact/RKEfwzfwZ7oD5r5fZLnqPS (Daily, Reports, Activity log at `e72e5fe`). Artifacts are per account; older links belong to the previous account.
- Codex evaluations: `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`.
