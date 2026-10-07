<!-- handoff-format: resume-point-v1 -->
# agent-environment-r02: resume point

- **As of:** `codex/owner-redesign-r04` at `81ffd55` plus the commit that adds this file, 2026-10-03 11:45 +03:00
- **Previous resume point:** `docs/phase-records/handoffs/agent-environment/20261003-113917-agent-environment-r01-done.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/agent-environment/DECISIONS.md`, `docs/agent-context/WORKING_AGREEMENTS.md`

## State

- Opened 2026-10-03 as the successor of agent-environment-r01 (DONE, archived by receipt
  `docs/phase-records/history-transitions/0011-20261003-agent-environment-r01-done.json`), for the work r01's packet
  excluded: the evaluation loop for briefs and the usage panel.
- Criterion 1 is done: `docs/phase-records/handoffs/agent-environment/brief-failure-causes.md` classifies every
  failed row of both round logs (16 brief-caused, 0 code-caused, 4 unclear) and names the recurring causes.
- Worktree `D:/Projects/fitway-worktrees/agent-environment-r02` exists at `81ffd55`, without `node_modules`.

## Running now

Nothing.

## Next steps

1. **Fix the template drift** (criterion 3): `docs/agent-context/HANDOFF_TEMPLATE.md` "Writing one" step 1 still
   gives `--slug <run-id>`, which `pnpm handoff:new` no longer takes (DECISIONS item 10); check the brief templates
   against `pnpm brief:check` the same way. A frozen edit: Codex or the coordinator.
2. **Draft one template line each** for causes 2 and 3 of `brief-failure-causes.md` ("Recurring brief causes"), as
   coordinator design (DECISIONS item 6), with the round each comes from.
3. **Evaluation rounds** (criterion 2, DECISIONS item 9): reuse a past round whose failure the line targets (for
   cause 2, AE round 5's path rule; for cause 3, OW nav-1), brief it from the template with and without the line,
   grade both on held-out rows written first in `D:/fitway-grader/agent-environment/`, and adopt a line only if it
   removes the failure without new ones. Record each round in `docs/phase-records/handoffs/agent-environment/codex-rounds.md`.
4. **Usage panel** (criterion 4, DECISIONS item 8): once the user's desktop app runs Claude Code 2.1.287 or later,
   build the mod with the `plugin-authoring` skill and install it only with the user's approval.

## Waiting on the user

- The desktop-app update for the usage panel (step 4), whenever the user chooses.

## Known risks

- Read Codex's `rate_limits` from the newest `C:/Users/Pc Force/.codex/sessions/**/rollout-*.jsonl` before each launch.
- The live test in `scripts/check-frontier-preservation.test.ts` passes only on a clean tree.
- PowerShell 5.1 strips the inner quotes of `-c key=["x"]` passed to `codex`; use Git Bash for such overrides.
- The main checkout `D:/Projects/fitway` has an uncommitted one-line change to `AGENTS.md` dated 2026-09-06; not ours.

## Pointers

- Worktree: `D:/Projects/fitway-worktrees/agent-environment-r02`, branch `agent-environment-r02`, expected HEAD `81ffd55`.
- Packet: `docs/phase-records/task-packets/agent-environment-r02.yaml`. Held-out checks: `D:/fitway-grader/agent-environment/` (never in a brief).
