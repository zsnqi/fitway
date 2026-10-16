<!-- handoff-format: resume-point-v1 -->
# agent-tooling-r01: resume point

- **As of:** `codex/owner-redesign-r04` at `8647512c`, 2026-10-16 11:07 +03:00
- **Standing decisions:** `docs/phase-records/handoffs/agent-tooling/DECISIONS.md`, `docs/agent-context/WORKING_AGREEMENTS.md`

## State

- Opened by the coordinator on 2026-10-16 under r04's decision 73 (DECISIONS item 1, `c286c4c9`). The tool paths r04
  held moved here (F253); the packet is `docs/phase-records/task-packets/agent-tooling-r01.yaml`.
- The coordinator of owner-design-exploration-r04 coordinates this milestone too, from the r04 worktree, where the
  ledger lives; this milestone's branch `agent-tooling-r01` is the integration branch for its rounds and merges into
  the coordinator line, then main through `pnpm main:advance`.
- From 2026-10-16 every brief has two reviews, DeepSeek (the launcher) and GPT-6.1 Sol `xhigh` in `<review folder>-sol`
  (r04 decision 66's rule applied, `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`
  §"Evaluation: both reviewers, decision 66's rule applied").

## Running now

- **code-map** (`docs/phase-records/handoffs/agent-tooling/briefs/codex-code-map.md`): worktree
  D:/Projects/fitway-worktrees/tooling-code-map, branch `tooling-code-map` from `c286c4c9`, run folder
  D:/fitway-temp/codex-round-9be94292-833b-4ee1-b3ac-8240cca8f848; held-out rows
  D:/fitway-grader/agent-tooling/code-map-heldout.md.
- **launcher-fixes-6** (`docs/phase-records/handoffs/agent-tooling/briefs/codex-launcher-fixes-6.md`, F254 and F255):
  worktree D:/Projects/fitway-worktrees/tooling-launcher-fixes-6, branch `tooling-launcher-fixes-6` from `c286c4c9`,
  run folder D:/fitway-temp/codex-round-c7addb2e-0a77-44df-be1a-eba8a1a3fe8d; both reviews dispositioned (F256
  recorded from Sol's reading 5); held-out rows D:/fitway-grader/agent-tooling/launcher-fixes-6-heldout.md.

## Next steps

1. **Grade and merge** each round: check the report's commit and ladder against its events, grade on its held-out
   rows (a Sol grader; reproduce one row, two for a DeepSeek grader), merge into `agent-tooling-r01` after CI passes.
2. **The CLI contract with `pnpm tools`** (F251; packet criterion 2), cut after both merges; its body is drafted in
   the coordinator session's scratchpad and is rewritten against the merged HEAD before review.
3. **Map upkeep** (F252, the README map check, a gardener pass), then **the lighter pickup** (packet criteria 4, 5).

## Waiting on the user

Nothing.

## Known risks

- `pnpm handoff:new` refuses to create the resume point of a milestone whose resume file does not exist yet
  ("Missing repository path"), so this file was first written from the template by hand (F255, in launcher-fixes-6).
- The risks in r04's resume point apply here too: DeepSeek reports can claim steps that never ran (check the commit
  and ladder against the events), grading briefs name the round's brief by its absolute coordinator path, timed work
  needs a quiet machine (B13), and node_modules junctions are unlinked before `git worktree remove`.
- Sol reviews run with `codex exec ... - < prompt.md` from Bash: PowerShell 5.1 pipes the prompt as ASCII.

## Pointers

- Worktree: D:/Projects/fitway-worktrees/agent-tooling-r01, branch agent-tooling-r01, expected HEAD the commit that
  last changed this text on the coordinator line.
- Coordinator: D:/Projects/fitway-worktrees/owner-design-exploration-r04, branch codex/owner-redesign-r04.
- Codex evaluations: `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`.
