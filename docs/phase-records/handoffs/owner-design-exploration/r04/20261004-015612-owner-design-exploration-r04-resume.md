<!-- handoff-format: resume-point-v1 -->
# owner-design-exploration-r04: resume point

- **As of:** `codex/owner-redesign-r04` at the commit that adds this file, 2026-10-04 02:00 +03:00; `owner-followup-r04-build` at `ecee791`; `owner-r04-touch-fix` at `ac0ec7d`
- **Previous resume point:** `docs/phase-records/handoffs/owner-design-exploration/r04/20261004-004409-owner-design-exploration-r04-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`, `docs/agent-context/WORKING_AGREEMENTS.md`

## State

- **Built on `owner-followup-r04-build`:** decision 25 and the touch trial's defects at `bd8bada` (Opus builder;
  report `D:/fitway-temp/owner-r04-d25-build/REPORT.md`, crops and sheets beside it). The user saw the summary and
  said "ممتاز"; not reviewed yet.
- **The busiest-time card:** a designer drew three variants (`D:/fitway-temp/owner-r04-busiest-card/REPORT.md`; first
  screen sheets in `D:/fitway-temp/owner-r04-busiest-card/crops/context/`). The user's pick and the touch follow-ups are DECISIONS item 26.
- **New agreements (WORKING_AGREEMENTS "Delegation", 2026-10-04):** the Claude subscription is the scarce budget; a
  small round gets one Claude review (verifier `high`, reading direction included for changed elements); drawn builds
  and review fixes go to Codex. Agent reports are saved verbatim as `REPORT.md` in their evidence folder
  (`docs/agent-context/HANDOFF_TEMPLATE.md`).
- **The user stopped Claude work for 2026-10-04 to save usage;** Codex may run.

## Running now

Two Codex rounds (GPT-6.1 Sol, `high`), started 01:55 in harness background shells; each commits once, not pushed:
- **card-1** in `D:/Projects/fitway-worktrees/owner-followup-r04-s04` from `ecee791`, brief
  `D:/Projects/fitway-worktrees/owner-followup-r04-s04/design-research/owner-composition-exploration-r04/directions/briefs/codex-busiest-card.md`; run
  folder `D:/fitway-temp/codex-runs/owner-card-1/` (`last-message.md`, `events.jsonl`); thread
  `01a103fb-41d2-7a33-940e-74a7c3b7c06d`; port 3176.
- **touch-1** in `D:/Projects/fitway-worktrees/owner-r04-daily-phone` (branch `owner-r04-touch-fix`) from `ac0ec7d`,
  brief `D:/Projects/fitway-worktrees/owner-r04-daily-phone/design-research/owner-composition-exploration-r04/directions/briefs/codex-touch-native.md`;
  run folder `D:/fitway-temp/codex-runs/owner-touch-1/`; thread `01a103fb-41df-7c03-a441-cfd9eecefcfd`; port 3177.

## Next steps

1. **When both rounds end:** read each `last-message.md`; record both in
   `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md` (brief rows, held-out rows, failure
   cause). Merge `owner-r04-touch-fix` into `owner-followup-r04-build`; expect conflicts only in the generated
   `INDEX.md` (regenerate it) and possibly README. touch-1 was told not to edit OWN-D7; fold anything it reports for
   OWN-D7 into that row.
2. **One review** of `bd8bada` plus both rounds: a fresh `owner-direction-verifier-high`, scoped to the changed
   elements, with reading direction included, grading the held-out rows `D:/fitway-grader/owner-r04/card-1-heldout.md`
   and `D:/fitway-grader/owner-r04/touch-1-heldout.md` (never in a brief). Save its report as `REPORT.md` in its folder.
3. **Fixes from that review go to Codex.** Add the computer's busiest-time card: «مساءً» and «بمعدّل» from 721 px up
   too (DECISIONS item 26; card-1 kept them to the phone). Add the pre-existing sheet defect: the Arabic button «عرض آخر 28 يومًا» in
   `components.js` has wide gaps around «28» (Reports fixed it; the sheet did not).
4. Publish Daily and Reports as one private multi-file artifact for the user's phone and computer (real touch was
   never tested).
5. Then Activity log in one pass (DECISIONS "How this milestone's rounds run" item 6): ask all its questions first,
   then `owner-direction-designer-max`, one review.

## Waiting on the user

Nothing. (2026-10-04: the user agreed to `high` for coordinating sessions; set it in the app when a session starts.)


## Known risks

- A Codex run dies with the Claude app: resume its thread with the exec flags before `resume`
  (`codex exec --approve-for-me -C <worktree> resume -m gpt-6.1-sol -c model_reasoning_effort="high" --json -o <run>/last-message.md <thread> -`).
- `codex exec --json` does not report `rate_limits`; two `high` rounds were launched side by side without reading them.
- Touch was verified only with CDP emulation; pinch, iOS long-press and real flick feel are unmeasured on a device.
- At 721 and 1023 px EN the busiest-time card's glyphs render about a third of a pixel apart from `f5f0e2d`; cause
  unknown.
- «مساءً» on the phone card is a deliberate exception to `DESIGN_GUIDE.md` §9 («ص/م»); carry it to the later ADR.
- Ports: 3174 the user's preview; 3176-3177 builders, verifiers and Codex; 3178-3179 reviewers.

## Pointers

- Build worktree: `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, expected HEAD `ecee791` plus card-1's commit.
- Touch worktree: `D:/Projects/fitway-worktrees/owner-r04-daily-phone`, branch `owner-r04-touch-fix`, expected HEAD `ac0ec7d` plus touch-1's commit (the set-aside layout options stay on `owner-r04-daily-phone` at `b80083a`).
- Eclipse source: `D:/Projects/fitway-worktrees/owner-followup-r04-s04/design-research/owner-composition-exploration-r04/directions/eclipse/`.
- Codex evaluations: `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`.
