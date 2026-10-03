<!-- handoff-format: resume-point-v1 -->
# agent-environment-r02: resume point

- **As of:** `codex/owner-redesign-r04` at `8561bd1`, 2026-10-03 15:42 +03:00; `agent-environment-r02` at `2c61038`
- **Previous resume point:** `docs/phase-records/handoffs/agent-environment/20261003-121252-agent-environment-r02-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/agent-environment/DECISIONS.md`, `docs/agent-context/WORKING_AGREEMENTS.md`

## State

- Criterion 1 done: `docs/phase-records/handoffs/agent-environment/brief-failure-causes.md` (16 brief-caused, 0
  code-caused, 4 unclear), with candidate lines C2 and C3 and how they are tested.
- Criterion 3 done on `agent-environment-r02` (`f2a9445`, then `2c61038`): `docs/agent-context/HANDOFF_TEMPLATE.md`
  no longer names the `--slug` option; the brief templates name no option their tools lack. Merged into
  `codex/owner-redesign-r04` (`1a35d2f`).
- Criterion 4 done: the usage panel mod (DECISIONS item 8) in `C:/Users/Pc Force/.claude/mods/usage-panel` shows after
  the app restart, and the user confirmed on 2026-10-03 that its limit figures match the app's own.
- C2's evaluation is done: C2, C2b and C2c tested, none adopted.
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
4. Merge `agent-environment-r02` into `codex/owner-redesign-r04`, then the closing evidence receipt and the
   independent review the packet requires.

## Waiting on the user

Nothing.

## Known risks

- A run killed with the app leaves its eval worktree mid-change: reset it to the brief commit before rerunning.
- The live test in `scripts/check-frontier-preservation.test.ts` passes only on a clean tree.
- PowerShell 5.1 strips the inner quotes of `-c key=["x"]` passed to `codex`; use Git Bash for such overrides.
- The main checkout `D:/Projects/fitway` has an uncommitted one-line change to `AGENTS.md` dated 2026-09-06; not ours.

## Pointers

- Worktree: `D:/Projects/fitway-worktrees/agent-environment-r02`, branch `agent-environment-r02`, expected HEAD `2c61038`.
- Packet: `docs/phase-records/task-packets/agent-environment-r02.yaml`. Held-out checks: `D:/fitway-grader/agent-environment/` (never in a brief).
