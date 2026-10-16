<!-- handoff-format: resume-point-v1 -->
# agent-tooling-r01: resume point

- **As of:** `codex/owner-redesign-r04` at `f714fd03`, 2026-10-16 19:10 +03:00
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

- **code-map** is integrated: `agent-tooling-r01` fast-forwarded to `e080324d` and pushed (CI passed). The chain:
  code-map-fix-3 (`6ba59f03`, run D:/fitway-temp/codex-round-fd9fda9f-43de-474a-ba61-72cb48dfa054), the diff review's
  four findings (D:/fitway-temp/code-review/code-map-3/) applied by a fixer at `e080324d`, then the Sol grade (run
  D:/fitway-temp/codex-round-56a3b941-033d-43b0-946c-6878da89f738): 14 PASS; G10 FAIL counted the round's intermediate
  red runs, and the coordinator reproduced all five committed N cases failing against `572d94c4`'s generator at their
  assertions; G15 FAIL counted `describe` containers as functions (the grading brief's wording). Map: 48 files, 603
  callables, 473 without a covering test.
- **launcher-fixes-6-fix-2** delivered `42ce5333` (run D:/fitway-temp/codex-round-67683b06-56af-47fa-bed2-b2ee881bc629);
  the diff review's two findings (D:/fitway-temp/code-review/launcher-fixes-6-3/) were applied by a fixer at `51bf35d9`.

## Running now

- **launcher-fixes-6-fix-3** (`docs/phase-records/handoffs/agent-tooling/briefs/codex-launcher-fixes-6-fix-3.md`), on
  `tooling-launcher-fixes-6` from `51bf35d9` (D:/Projects/fitway-worktrees/tooling-launcher-fixes-6), run folder
  D:/fitway-temp/codex-round-ad5b4b6c-3edf-4c88-b94f-a00455bc6e4b: Y1 escaped quotes and Y2 comments, from the Sol grade
  of `51bf35d9` (D:/fitway-temp/tooling-launcher-fixes-6-fix-2-grade/report.md, run folder
  D:/fitway-temp/codex-round-cf20b9cb-8869-4d57-8405-c7fecf578632: 12 PASS; G9 FAIL was the grading brief's error, the
  first fixer also touched `new-handoff.test.ts`; G11 escaped quotes a real defect; G14 comments a finding). Held-out
  rows H16-H18 are in the grader's folder. CI passed on `51bf35d9`.

## Next steps

1. **launcher-fixes-6-fix-3:** check its commit and ladder against the events, push, run the diff review
   (`D:/fitway-temp/code-review/make-folder.sh launcher-fixes-6 <worktree> 51bf35d9 <result> <brief>`), then grade with a
   fresh brief from `codex-launcher-fixes-6-fix-2-grade.md` plus Y1-Y2 and H16-H18, still naming no SHA in its report
   (F258 until this result merges). Then merge `tooling-launcher-fixes-6` into `agent-tooling-r01`: both branches touch
   the map's sources, so run `pnpm map:tooling` in the merge and let CI decide.
2. **Merge `agent-tooling-r01` into the coordinator line, then `pnpm main:advance`** on the pushed, green commit; the
   coordinator line's launcher then carries the F255-F258 fixes.
3. **The ratchet** (DECISIONS items 6 and 7), then **the CLI contract with `pnpm tools`** (F251, draft at
   D:/fitway-temp/agent-tooling-drafts/cli-contract-body.md), then **map upkeep** (F252), then **the lighter pickup**.

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
