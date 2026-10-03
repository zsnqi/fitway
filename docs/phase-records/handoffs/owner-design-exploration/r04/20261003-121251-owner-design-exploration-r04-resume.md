<!-- handoff-format: resume-point-v1 -->
# owner-design-exploration-r04: resume point

- **As of:** `codex/owner-redesign-r04` at `316bdaf`, 2026-10-03 12:12 +03:00; `owner-followup-r04-build` at `8b6c30f`
- **Previous resume point:** `docs/phase-records/handoffs/owner-design-exploration/r04/20261003-021956-owner-design-exploration-r04-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`, `docs/agent-context/WORKING_AGREEMENTS.md`

## State

- **K-02 is built** as decision 14 says (the user's two answers of 2026-10-03 included): `cbd7bbc` on the build branch,
  by an Opus builder from `design-research/owner-composition-exploration-r04/directions/briefs/builder-k02-build-a.md`.
  Reports has option A's behaviour only, with C's page-level error sentence (year once); the status control keeps one
  width from 721 up on Reports and Daily, and its hover, open and focus outline fits the text. The coordinator looked
  at the error frames, the outline crops and Daily's 1024 EN header. No independent review yet.
- **Comparison page for the user:** https://claude.ai/artifact/DXZsMNXgyS27BghFVaz1sW (source
  `D:/fitway-temp/claude/D--Projects-fitway-worktrees-owner-design-exploration-r04/28297a9c-b991-4be6-9a34-8c810756c1eb/scratchpad/k02-build/`;
  frames, crops and the builder's baselines in `D:/fitway-temp/owner-r04-k02-build/`). The user will look after
  finishing other work.
- The build branch carries this branch's tools and ledger (merges `6790412`, `7eb4006`).

## Running now

- **Codex D3-D8, run 4,** on the build worktree from
  `design-research/owner-composition-exploration-r04/directions/briefs/codex-d3-d8-defects.md` (HEAD `8b6c30f` over
  `cbd7bbc`), launched 12:10. Output: `D:/fitway-temp/codex-runs/owner-d3-d8/run4/` (`last-message.md` when done).
  Grade it on `D:/fitway-grader/owner-r04/d3-d8-heldout.md` (K1 and K7 updated for the removed options).

## Next steps

1. **Grade run 4** (brief rows, held-out rows, failure cause) and record it in
   `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`; check `git status` in the build
   worktree and that nothing was pushed.
2. **The user's three answers** (below) go into DECISIONS.md item 14; then a builder makes the changes they ask for,
   after run 4 has committed (one writer per worktree).
3. **The step-4 reviewer** on the build: a fresh verifier on K-02 and D3-D8, which also looks at Daily at 390 under
   the "compressed, not designed" lens (any Daily change is the user's call); then the user.

## Waiting on the user

All three are on the comparison page, each with the coordinator's recommendation (a):
- Daily at 1024 EN: the concept label now drops under the status in every state (it did only in Delayed before).
  (a) accept; (b) one line, the slot shrinks there and the header moves when Delayed arrives.
- A one-day period's error sentence: (a) «تعذّر تحميل قراءات 22 سبتمبر 2026»; (b) keep «من 22 سبتمبر إلى 22 سبتمبر 2026».
- A same-month period: (a) «من 16 إلى 22 سبتمبر 2026», the header's form; (b) keep both months.

## Known risks

- The builder left two small points, not decided: Daily's reserved width follows the last reading's time (a new
  hour digit can widen the empty part of the slot; nothing moves), and Reports EN shows a CLS of about 0.0005 after a
  retry.
- NEXT-DIRECTION-BRIEF.md still says "plain hyphen" for Arabic ranges; DECISIONS.md item 12 overrides it.
- Ports: 3174 is the user's preview; 3176-3177 for builders, verifiers and Codex, 3178-3179 the probe kit's.
- Real-device touch, Firefox and Safari first paint, and screen-reader output were never checked.
- Launch Codex with the launch note in `docs/agent-context/WORKING_AGREEMENTS.md` ("Delegation").

## Pointers

- Build worktree: `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, expected HEAD `8b6c30f` (later if run 4 has committed).
- Eclipse source: `D:/Projects/fitway-worktrees/owner-followup-r04-s04/design-research/owner-composition-exploration-r04/directions/eclipse/`.
- Codex evaluations: `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`; held-out checks in `D:/fitway-grader/owner-r04/`.
