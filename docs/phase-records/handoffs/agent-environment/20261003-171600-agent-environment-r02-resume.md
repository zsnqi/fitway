<!-- handoff-format: resume-point-v1 -->
# agent-environment-r02: resume point

- **As of:** `codex/owner-redesign-r04` at the commit that adds this file, 2026-10-03 17:16 +03:00; `agent-environment-r02` at `f372043`
- **Previous resume point:** `docs/phase-records/handoffs/agent-environment/20261003-154200-agent-environment-r02-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/agent-environment/DECISIONS.md`, `docs/agent-context/WORKING_AGREEMENTS.md`

## State

- Criterion 1 done: `docs/phase-records/handoffs/agent-environment/brief-failure-causes.md` (16 brief-caused, 0
  code-caused, 4 unclear), with candidate lines C2 and C3 and how they are tested.
- Criterion 3 done (`f2a9445`, `2c61038`), merged into `codex/owner-redesign-r04`.
- Criterion 4 done: the usage panel mod shows, and the user confirmed its limit figures match the app's own.
- C2's evaluation is done: C2, C2b and C2c tested, none adopted.
- New on this branch, merged into `codex/owner-redesign-r04`: the user's "Rules and findings" agreement in
  `docs/agent-context/WORKING_AGREEMENTS.md` (`45d177b`, worded in the user's terms at `f372043`), and a line in the
  verifier, designer and builder templates asking for problems that meet their rule. The template tests pass (159).
- New evidence for criterion 1 from Owner D3-D8 run 4 (`docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`):
  two more brief-caused failures (an outcome defined as "mirror the other language" with no anchor; an outcome that
  geometry rules out, with a quote the page no longer shows), one code-caused.

## Running now

Nothing.

## Next steps

1. **C2d**, lower priority: the C2c line with the sample spanning every folder where that kind of input lives; a new
   branch from `d333762` in `D:/Projects/fitway-worktrees/eval-c2-with`
   (`docs/phase-records/handoffs/agent-environment/codex-rounds.md`, "C2c").
2. **C3's evaluation** the same way, on OW nav-1 (its brief and baseline are named in
   `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`, "nav-1").
3. Add D3-D8 run 4's two brief causes to `brief-failure-causes.md`, and test whether a template line ("name the
   anchor of every alignment outcome"; "check the outcome fits the space before requiring it") removes them.
4. Merge `agent-environment-r02` into `codex/owner-redesign-r04` again if it moves, then the closing evidence receipt
   and the independent review the packet requires.

## Waiting on the user

Nothing.

## Known risks

- A run killed with the app leaves its eval worktree mid-change: reset it to the brief commit before rerunning.
- The live test in `scripts/check-frontier-preservation.test.ts` passes only on a clean tree.
- PowerShell 5.1 strips the inner quotes of `-c key=["x"]` passed to `codex`; use Git Bash for such overrides.
- The main checkout `D:/Projects/fitway` has an uncommitted one-line change to `AGENTS.md` dated 2026-09-06; not ours.

## Pointers

- Worktree: `D:/Projects/fitway-worktrees/agent-environment-r02`, branch `agent-environment-r02`, expected HEAD `f372043`.
- Packet: `docs/phase-records/task-packets/agent-environment-r02.yaml`. Held-out checks: `D:/fitway-grader/agent-environment/` (never in a brief).
