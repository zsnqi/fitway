<!-- handoff-format: resume-point-v1 -->
# owner-design-exploration-r04: resume point

- **As of:** `codex/owner-redesign-r04` at the commit that adds this text, 2026-10-05 evening +03:00;
  `owner-followup-r04-build` at `d8e272f`
- **Previous resume point:** `docs/phase-records/handoffs/owner-design-exploration/r04/20261004-160300-owner-design-exploration-r04-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` (new today: 37, and
  rounds items 10 and 11), `docs/agent-context/WORKING_AGREEMENTS.md`

## State

- **Daily, Reports, Activity log and Access** are built on `owner-followup-r04-build` (worktree
  `D:/Projects/fitway-worktrees/owner-followup-r04-s04`).
- **The interaction-motion round (DECISIONS 36)** is built and reviewed: designer `0c43c90` (one shared `motion.js`;
  report `D:/fitway-temp/owner-r04-motion/REPORT.md`, frames and videos there; the designer reached about 584k
  tokens and was resumed once after an API limit, which led to rounds item 10), verifier-high review
  `D:/fitway-temp/owner-r04-motion-review/REPORT.md` (all pass but V11: F1, F2 lows; notes O1 medium, O2-O4 low).
  Briefs: `directions/briefs/designer-motion.md`, `verifier-motion.md`.
- **Production motion and components** decided (DECISIONS 37), from `D:/fitway-temp/owner-r04-motion-research/REPORT.md`.
- **Published** on the current account (the old RKEf… link belongs to the previous account and cannot be updated):
  https://claude.ai/artifact/BqN1pBc36nsuaf3SSvw5nR (version 1, `0c43c90` staged without `tuner.js` in the session
  scratchpad `.../scratchpad/eclipse-pub/`; a new account cannot update it either; publish a new copy and give the
  user the link). Publishing needed the user's explicit approval: the auto-mode classifier refused it once as data
  exfiltration.
- **`access-reason-cap-r01`** stays paused by the user (its own handoff says how to resume).

## Running now

- The variants round is built (`2dbf25c` F1, `02c92bb` export variants `?done=0|1|2`, `d3b45d7` Access `?row=0|1`,
  `35051c9`; output `D:/fitway-temp/owner-r04-done-variants/`; designer picks variant 2 and row option 1).
- A designer (xhigh) on `directions/briefs/designer-records-arrival.md` (`8f1d381`): a new access record arrives
  with motion (DECISIONS 38). Output `D:/fitway-temp/owner-r04-records-arrival/` (`NOTES.md`; replace, never resume).
- Next: Codex `high` on the drafted brief in the session scratchpad `codex-motion-lows.md` (F2, O3, O4; held-out rows
  `D:/fitway-grader/owner-r04/motion-lows-heldout.md`), then one verifier-high check of all three rounds, every error
  fixed, then republish and show the user the variants to pick.

## Next steps

0. **The user's answers are in DECISIONS 38.** Open, waiting on the user: (a) whether Access's «سجل الوصول» card
   should show a new record arriving with motion (the user looks at the live site themselves; no walk-through);
   (b) the export's empty moment (O1): the user wants to see both ideas (DECISIONS 38); a designer (xhigh) builds
   them as switchable variants beside the current one, then the user picks on the live site. The user asked not to
   start edits before switching accounts; this is the first build of the next session, with O2 in the same brief.
1. **Finish the motion round** (rounds item 11): O2 per DECISIONS 38 (a designer, xhigh, small brief), the records
   card's motion if the user wants it; F1, F2, O3, O4 (measurable, no taste) to Codex or a fixer; O1 stays (DECISIONS
   38). One verifier-high check, every error it finds fixed, then republish and show the live site (`eclipse-build`
   preview, 3174) and frame strips.
2. **The remaining Owner screens,** in order Settings, Operations (the header status's details), Monitoring, each per
   rounds items 6, 8, 9, 10 and 11, built with the motion. Codex briefs: read each outcome against the limits before
   launch and state the purpose of anything an outcome replaces.
3. **Daily and Reports' last round:** the user's open comment on Reports' «معدّل الموجودين» card (`#fig-avg`, DECISIONS
   30) on the old artifact, redrawn by a designer and shown before it is built; fix-3's open findings
   (`D:/fitway-temp/owner-r04-fix-3-verify/REPORT.md`); the waiting lows.
4. **Access's last round:** N1 one name for the reset («تعيين» vs «إعادة تعيين»); N2 the done link lands on «هذا السجل
   غير موجود في هذه العينة.»; N3 the records card sparse at 1440; N4 the field's zero dot at 1x; N5 721 EN pairs wrap;
   N6 lone last words; N7 mono loads on every visit; a tapped Retry leaves the desk title's ring; OWN-C9's "programmatic
   focus always shows its ring" is stale; `.acc :focus-visible` beats `.rail-item:focus-visible { outline: none }`.

## Known risks

- Artifacts are per account; links from an earlier account do not open or update on a later one.
- Claude's auto-mode classifier refuses changes to the frontier preservation guard, and refused one artifact publish
  until the user approved it in chat.
- Pinch, iOS long-press and a flick are proved on a device only by the user's informal try (DECISIONS 30).
- «مساءً», «ظهرًا», «ليلًا» on the busiest-time card are a deliberate exception to `DESIGN_GUIDE.md` §9; carry it to the
  later ADR with every Product/Spec amendment the concept made (DECISIONS 33, 34).
- The motion's smoothness was measured headless only (V10); a real GPU and phone are the user's try.
- **Lighter sessions in this worktree:** its untracked `.claude/settings.local.json` turns off account-synced plugins
  and claude.ai connectors for this worktree only.
- Ports: 3174 is the user's preview; 3176-3177 builders, verifiers and Codex; 3178-3179 reviewers.

## Pointers

- Motion: designer `D:/fitway-temp/owner-r04-motion/` (`_watch/` contact sheets, `_coord-done-rows.png`), review
  `D:/fitway-temp/owner-r04-motion-review/` (watch first `runs/vid/2-export-run-1440-ar-anim.webm`,
  `6-row-1440-ar-anim.webm`), research `D:/fitway-temp/owner-r04-motion-research/REPORT.md`.
- Access: `D:/fitway-temp/owner-r04-access-fix-review/REPORT.md`, skeleton `D:/fitway-temp/owner-r04-access-skeleton/`.
- Codex evaluations: `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`.
