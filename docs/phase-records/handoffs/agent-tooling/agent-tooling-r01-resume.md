<!-- handoff-format: resume-point-v1 -->
# agent-tooling-r01: resume point

- **As of:** `codex/owner-redesign-r04` at `f5172ecc`, 2026-10-16 10:16 +03:00
- **Standing decisions:** `docs/phase-records/handoffs/agent-tooling/DECISIONS.md`, `docs/agent-context/WORKING_AGREEMENTS.md`

## State

- Opened by the coordinator on 2026-10-16 under r04's decision 73 (DECISIONS item 1). The tool paths r04 held moved
  here (F253); the packet is `docs/phase-records/task-packets/agent-tooling-r01.yaml`.
- The coordinator of owner-design-exploration-r04 coordinates this milestone too, from the r04 worktree, where the
  ledger lives; this milestone's branch `agent-tooling-r01` is the integration branch for its rounds and merges into
  the coordinator line, then main through `pnpm main:advance`.

## Running now

Nothing.

## Next steps

1. **F254, the launcher's report claim check** (DECISIONS item 5): a Codex round on DeepSeek, cut from
   `agent-tooling-r01`, graded on held-out rows written first.
2. **The CLI contract with `pnpm tools`** (F251; packet criterion 2), briefed and reviewed while step 1 runs.
3. **The code map and map upkeep** (F252; packet criteria 3 and 5), then **the lighter pickup** (criterion 4).

## Waiting on the user

Nothing.

## Known risks

- `pnpm handoff:new` refuses to create the resume point of a milestone whose resume file does not exist yet
  ("Missing repository path"), so this file was written from the template by hand (F255).
- The risks in r04's resume point apply here too: DeepSeek reports can claim steps that never ran (check the commit
  and ladder against the events), grading briefs name the round's brief by its absolute coordinator path, timed work
  needs a quiet machine (B13), and node_modules junctions are unlinked before `git worktree remove`.

## Pointers

- Worktree: D:/Projects/fitway-worktrees/agent-tooling-r01, branch agent-tooling-r01, expected HEAD the commit that
  last changed this text on the coordinator line.
- Coordinator: D:/Projects/fitway-worktrees/owner-design-exploration-r04, branch codex/owner-redesign-r04.
- Codex evaluations: `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`.
