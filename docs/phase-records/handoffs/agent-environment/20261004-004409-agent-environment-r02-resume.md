<!-- handoff-format: resume-point-v1 -->
# agent-environment-r02: resume point

- **As of:** `codex/owner-redesign-r04` at the commit that adds this file, 2026-10-04 00:44 +03:00; `agent-environment-r02` at `bee54c7`
- **Previous resume point:** `docs/phase-records/handoffs/agent-environment/20261003-171600-agent-environment-r02-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/agent-environment/DECISIONS.md`, `docs/agent-context/WORKING_AGREEMENTS.md`

## State

- Criteria 1, 3 and 4 done (previous resume point, "State").
- **C3 adopted:** evaluated on OW nav-1 with and without the line (`docs/phase-records/handoffs/agent-environment/codex-rounds.md`,
  "Evaluation C3"); added to the Codex template's checklist at `33edcc5`, template tests 215 pass. The margin was one
  held-out line on one sample, and the line's length clause was not exercised.
- **New brief causes:** OW D3-D8 run 4's two are in `docs/phase-records/handoffs/agent-environment/brief-failure-causes.md`
  (cause 5: a visual outcome with no anchor, or one the space rules out), with candidate lines C4 and C5 (`19011fc`).
- **Working agreements:** "Talking with the user" (plain words, no measurements) at `83cdcb5`. The whole-element
  review bullet under "Rules and findings" was committed on `codex/owner-redesign-r04` (`4d8e3f4`) because this
  worktree was in use; it is not on `agent-environment-r02` yet.
- **`brief:check` crash** on a code span broken across two lines: fixed at `bee54c7` by a separate session ("Fix
  brief:check crash on a wrapped code span"); not yet reviewed or merged.

## Running now

Nothing known; the separate session above may still be open.

## Next steps

1. Review `bee54c7` (the diff and its test), run the agent-environment tests with
   `pnpm -C D:/Projects/fitway-worktrees/agent-environment-r02 exec node scripts/run-vitest.mjs run scripts/agent-environment`,
   then merge `agent-environment-r02` into `codex/owner-redesign-r04`.
2. Bring `4d8e3f4`'s `docs/agent-context/WORKING_AGREEMENTS.md` change into `agent-environment-r02` (merge or cherry-pick).
3. **C4 and C5's evaluation**, the same way as C3 (two blind writers, Codex per arm, a blind grader), on OW D3-D8
   run 4's brief at its base (`docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`, "D3-D8 run 4";
   held-out `D:/fitway-grader/owner-r04/d3-d8-heldout.md`).
4. C2d, lower priority (previous resume point, "Next steps" 1).
5. The closing evidence receipt and the independent review the packet requires.

## Waiting on the user

Nothing.

## Known risks

- A run killed with the app leaves its eval worktree mid-change: resume the Codex thread with the exec flags before
  `resume`, or reset to the brief commit before rerunning.
- Eval worktrees `D:/Projects/fitway-worktrees/eval-c3-with`, `eval-c3-without` and the detached `eval-c3-base` remain;
  remove them when C4 and C5 no longer need them.
- The live test in `scripts/check-frontier-preservation.test.ts` passes only on a clean tree.
- PowerShell 5.1 strips the inner quotes of `-c key=["x"]` passed to `codex`, and of quoted words in a `git commit -m`
  here-string; use Git Bash, or `git commit -F <file>`.

## Pointers

- Worktree: `D:/Projects/fitway-worktrees/agent-environment-r02`, branch `agent-environment-r02`, expected HEAD `bee54c7`.
- Packet: `docs/phase-records/task-packets/agent-environment-r02.yaml`. Held-out checks: `D:/fitway-grader/` (never in a brief).
