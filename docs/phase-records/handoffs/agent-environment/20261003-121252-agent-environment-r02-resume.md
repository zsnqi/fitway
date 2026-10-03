<!-- handoff-format: resume-point-v1 -->
# agent-environment-r02: resume point

- **As of:** `codex/owner-redesign-r04` at `316bdaf`, 2026-10-03 12:12 +03:00; `agent-environment-r02` at `f2a9445`
- **Previous resume point:** `docs/phase-records/handoffs/agent-environment/20261003-114500-agent-environment-r02-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/agent-environment/DECISIONS.md`, `docs/agent-context/WORKING_AGREEMENTS.md`

## State

- Criterion 1 done: `docs/phase-records/handoffs/agent-environment/brief-failure-causes.md` (16 brief-caused, 0
  code-caused, 4 unclear), with candidate lines C2 and C3 and how they are tested.
- Criterion 3 done on `agent-environment-r02` (`f2a9445`): `docs/agent-context/HANDOFF_TEMPLATE.md` no longer names
  the `--slug` option; the brief templates name no option their tools lack. Not yet merged into this branch.
- Criterion 4 built: the usage panel mod (DECISIONS item 8) in `C:/Users/Pc Force/.claude/mods/usage-panel`, valid
  under `claude plugin validate`; the user's `settings.json` loads it through `CLAUDE_CODE_PLUGIN_DIRS` from the next
  app start. Not yet seen running: the user has to restart the app, then confirm it shows and reads right.
- C2's evaluation is done: blind writers, two Codex runs (`ece0794` with the line, `ad51e1a` without) and one blind
  grader; identical results, so C2 is not adopted.

## Running now

Nothing.

## Next steps

1. **C2 was tested and is not adopted** (`docs/phase-records/handoffs/agent-environment/codex-rounds.md`,
   "Evaluation C2"): both arms scored the same. Draft C2b from that entry's next hypothesis and test it the same way,
   reusing the worktrees `D:/Projects/fitway-worktrees/eval-c2-with` and `eval-c2-without` reset to `d333762`.
2. **C3's evaluation** the same way, on OW nav-1 (its brief and baseline are named in
   `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`, "nav-1").
3. **The usage panel** after the user's restart: confirm with the user that it shows and that the limit figures
   match the app's own; fix anything they report.
4. Merge `agent-environment-r02` into this branch, then the closing evidence receipt and the independent review the
   packet requires.

## Waiting on the user

- An app restart to load the usage panel, whenever convenient, and a word on how it looks.

## Known risks

- A run killed with the app leaves its eval worktree mid-change: reset it to the brief commit before rerunning.
- The live test in `scripts/check-frontier-preservation.test.ts` passes only on a clean tree.
- PowerShell 5.1 strips the inner quotes of `-c key=["x"]` passed to `codex`; use Git Bash for such overrides.
- The main checkout `D:/Projects/fitway` has an uncommitted one-line change to `AGENTS.md` dated 2026-09-06; not ours.

## Pointers

- Worktree: `D:/Projects/fitway-worktrees/agent-environment-r02`, branch `agent-environment-r02`, expected HEAD `f2a9445`.
- Packet: `docs/phase-records/task-packets/agent-environment-r02.yaml`. Held-out checks: `D:/fitway-grader/agent-environment/` (never in a brief).
