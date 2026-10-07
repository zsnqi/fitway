<!-- handoff-format: resume-point-v1 -->
# agent-environment-r02: resume point

- **As of:** codex/owner-redesign-r04 at the commit that adds this file, 2026-10-04 02:00 +03:00; `agent-environment-r02` at `c8b49db`
- **Previous resume point:** `docs/phase-records/handoffs/agent-environment/20261004-004409-agent-environment-r02-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/agent-environment/DECISIONS.md`, `docs/agent-context/WORKING_AGREEMENTS.md`

## State

- Criteria 1, 3 and 4 done; C3 adopted (`33edcc5`); causes 5 with candidate lines C4 and C5 recorded (`19011fc`).
- **`brief:check` crash fix** `bee54c7` reviewed (diff and test) and merged into codex/owner-redesign-r04; the
  agent-environment tests pass, 216 with 1 skipped.
- **Brought in from codex/owner-redesign-r04:** the whole-element review bullet (`1d3f19e`).
- **New on 2026-10-04:** `docs/agent-context/HANDOFF_TEMPLATE.md` asks the coordinator to save each agent report as
  `REPORT.md` in its evidence folder and name it in the resume point (`0fe1b1c`); WORKING_AGREEMENTS "Delegation" adds
  the usage agreement (one Claude review per small round; drawn builds and review fixes to Codex). Both merged into
  codex/owner-redesign-r04.

## Running now

Nothing.

## Next steps

1. **C4 and C5's evaluation**, the same way as C3 (two blind writers, Codex per arm, a blind grader), on OW D3-D8
   run 4's brief at its base (`docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`, "D3-D8 run 4";
   held-out D:/fitway-grader/owner-r04/d3-d8-heldout.md). Under the usage agreement, run the writers and the grader
   on Sonnet definitions, or as separate Codex threads where the grader never sees the arm's brief.
2. C2d, lower priority (`docs/phase-records/handoffs/agent-environment/20261003-171600-agent-environment-r02-resume.md`, "Next steps").
3. The closing evidence receipt and the independent review the packet requires.

## Waiting on the user

Nothing.

## Known risks

- `codex exec --json` does not report `rate_limits`; WORKING_AGREEMENTS asks for them before a launch. Find where the
  CLI exposes them, or record that it does not.
- A run killed with the app leaves its eval worktree mid-change: resume the Codex thread with the exec flags before
  `resume`, or reset to the brief commit before rerunning.
- Eval worktrees D:/Projects/fitway-worktrees/eval-c3-with, `eval-c3-without` and the detached `eval-c3-base` remain;
  remove them when C4 and C5 no longer need them.
- The live test in `scripts/check-frontier-preservation.test.ts` passes only on a clean tree.
- PowerShell 5.1 strips the inner quotes of `-c key=["x"]` passed to `codex`, and of quoted words in a `git commit -m`
  here-string; use Git Bash, or `git commit -F <file>`.

## Pointers

- Worktree: D:/Projects/fitway-worktrees/agent-environment-r02, branch `agent-environment-r02`, expected HEAD `c8b49db`.
- Packet: `docs/phase-records/task-packets/agent-environment-r02.yaml`. Held-out checks: D:/fitway-grader/ (never in a brief).
