<!-- handoff-format: resume-point-v1 -->
# owner-design-exploration-r04: resume point

- **As of:** `codex/owner-redesign-r04` at the commit that adds this text, 2026-10-06 about 02:00 +03:00;
  `owner-followup-r04-build` at `48ff52b` (pushed)
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

Nothing. The user stopped for the day (2026-10-06, about 02:00) and continues tomorrow.

- **Variants round built** (`2dbf25c` F1, `02c92bb` export variants `?done=0|1|2`, `d3b45d7` Access `?row=0|1`,
  `35051c9`; output `D:/fitway-temp/owner-r04-done-variants/`; designer and coordinator both lean to variant 2 and row
  option 1; the user has been told and picks on the live site after the review).
- **Records arrival finished** by a second designer from the WIP (brief `designer-records-arrival-finish.md`,
  `7a897f8`; commits `203e02d`, `53178d8` capture moment 11, `285dd84` docs; output and NOTES
  `D:/fitway-temp/owner-r04-records-arrival/`, videos `capture/11-records-v0-1440-ar.webm`, `-v1-`). Coordinator
  looked at the 1440 AR strips for both row options: as described. Known: with `row=0` the open slot shows about 80 ms
  before the record rises (the done line's own rhythm).
- **Codex motion lows** (brief `codex-motion-lows.md`, `602c62e`, run `D:/fitway-temp/owner-r04-motion-lows/run-1/`):
  `4850e58` M2-M5 PASS. M1 stopped on the brief's own error: L1 allowed only "sub-pixel" moves, the real offset is
  6.328 px (English Copy's icon). The coordinator's correction was resumed on the thread, and Codex hit its usage
  limit mid-check. Its edit is saved unverified as WIP `48ff52b` (`access.css`, three lines). A fixer (brief
  `fixer-copy-label.md`, `eaa7629`) was stopped for the day before reporting (partial output in `.../fixer/`).
  Record in `codex-rounds.md` after grading: B8 was followed, but the allowance's bound came from the review's
  reading (about 2 px) instead of a measure at the HEAD; Codex rightly stopped (B3).
- **Permissions:** auto mode refused `codex exec --approve-for-me` as an unsafe agent; with the user's approval,
  `Bash(codex exec:*)` is allowed in this worktree's untracked `.claude/settings.local.json` (untested yet).

## Next steps

0. **Finish M1:** a fresh `owner-direction-fixer` on `fixer-copy-label.md`, told that the edit it describes as
   uncommitted is now WIP `48ff52b` (verify it and commit the result on top). Codex's limit was to reset at 03:40.
1. **Review the three rounds:** a fresh `owner-direction-verifier-high` from the draft
   `D:/fitway-temp/owner-r04-three-rounds-review/brief-draft.md` (fill HEAD and the environment block, paste the
   held-out rows from `D:/fitway-grader/owner-r04/motion-lows-heldout.md` into V9 — they go to the verifier, never
   to Codex — and commit it as `directions/briefs/verifier-three-rounds.md`). Every error it finds fixed (rounds item
   11), then a new published copy and the live site (`eclipse-build` preview, 3174) with frame strips; the user picks
   `?done` and `?row` there.
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
