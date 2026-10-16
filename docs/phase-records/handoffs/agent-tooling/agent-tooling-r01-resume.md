<!-- handoff-format: resume-point-v1 -->
# agent-tooling-r01: resume point

- **As of:** `codex/owner-redesign-r04` at `cfbc9ea2`, 2026-10-16 13:43 +03:00
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

- **code-map-fix** (`docs/phase-records/handoffs/agent-tooling/briefs/codex-code-map-fix.md`), on `tooling-code-map`
  from `df2640aa` (D:/Projects/fitway-worktrees/tooling-code-map), run folder
  D:/fitway-temp/codex-round-8892703c-86e7-4629-9cfe-e5c3d5b74989: the diff review's nine findings
  (D:/fitway-temp/code-review/code-map-1/) and the grade's G4 and G11 FAILs (the Sol grade of `df2640aa`,
  D:/fitway-temp/codex-round-a2f0ef9b-6d16-401c-9554-271ec3365d99/last-message.md: 9 of 11 rows PASS). CI passed on
  `df2640aa`.
- **launcher-fixes-6-fix** (`docs/phase-records/handoffs/agent-tooling/briefs/codex-launcher-fixes-6-fix.md`), on
  `tooling-launcher-fixes-6` from `493c0adf` (D:/Projects/fitway-worktrees/tooling-launcher-fixes-6), run folder
  D:/fitway-temp/codex-round-63f07391-335b-4dd8-9d6d-e1d9386c7893: the diff review's four findings, F257 and F258. Its
  first grade was stopped (F258 risk); the fix result is graded instead. CI passed on `493c0adf`.

## Next steps

1. **Grade each fix result** with a fresh grading brief that names no commit SHA in its report (the F258 workaround in
   `docs/phase-records/handoffs/owner-design-exploration/r04/briefs/codex-shared-lows-grade.md`, until the fixed
   launcher merges), then the diff review again (`docs/agent-context/briefs/CODE_REVIEW.md`), then merge into
   `agent-tooling-r01` after CI.
2. **The ratchet** (DECISIONS items 6 and 7), then **the CLI contract with `pnpm tools`** (F251, draft in the
   coordinator's scratchpad), then **map upkeep** (F252, the gardener's scope, the do-not-copy list), then **the lighter
   pickup**.

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
