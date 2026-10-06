<!-- handoff-format: resume-point-v1 -->
# owner-design-exploration-r04: resume point

- **As of:** `codex/owner-redesign-r04` at the commit that adds this text, 2026-10-06 evening +03:00;
  `owner-followup-r04-build` at `8e2a7fc` (pushed)
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

- **Codex `high` on `directions/briefs/codex-variants-removal.md`** (`42191ca`, over `2996d7a`), run
  `D:/fitway-temp/owner-r04-variants-removal/run-1/` (resume its thread from `events.jsonl` line 1 if the app dies):
  the user kept both moments as built (DECISIONS 39, `?done=0`, `?row=0`); remove variants 1-2, row option 1 and the
  trial switches. Held-out rows: `D:/fitway-grader/owner-r04/variants-removal-heldout.md`.
- **The narrow-sheet round** (`b6d6a5c`, brief `codex-narrow-sheet.md`): Codex PASS on every row; its review
  (`verifier-narrow-sheet.md`) was stopped as moot after the pick: its open observations (an empty tenth of a second
  at sheet heights 560-620, a partly visible file line restarting from below, the cut line not on the sheet's edge)
  concern variant 2 only. Not yet graded in `codex-rounds.md`.
- **Report-only, under load only:** the dialogs', popover's and records card's parts split across threads under a
  planted stall; rounds item 11 to decide whether they are errors on a real machine.
- **Parked by the user:** the pixel-character pane mod and the usage-band redesign (`D:/fitway-temp/claude-pixel-crew/`).

## Next after this

One verifier-high on the removal with its held-out rows; then a new published copy and the live site; the round is
done. Then the remaining Owner screens (Settings first).

Done today: M1 finished (`cd7a27c`, an empty commit verifying Codex's WIP `48ff52b`; 48 measures, 0 px); the
three rounds reviewed by verifier-high (`verifier-three-rounds.md`, `8104b3e`; evidence
`D:/fitway-temp/owner-r04-three-rounds-review/`): V1-V14 PASS, H1-H8 PASS; F3 (variant 2 still opens on an empty
space), F4 (row=1 hides the focus ring 220 ms) and F5 are inherent observations for the user's pick; the Codex
motion-lows round graded in `codex-rounds.md`.

## Next steps

0. **Finish the one-clock round:** resume Codex's thread on WIP `dbee42d` (flags before `resume`; tell it the edit is
   now committed as WIP and to commit its result on top), or a fresh Codex run from the brief told the same. Then
   grade both rounds.
1. **One verifier-high on the result** with the held-out rows (rounds item 11), then a new published copy and the
   live site (`eclipse-build` preview, 3174) with frame strips; the user picks `?done` and `?row` there (tell them F3
   and F4 of the first review with the options: variant 2 still opens on an empty space; row=1 hides the focus ring
   220 ms).
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
