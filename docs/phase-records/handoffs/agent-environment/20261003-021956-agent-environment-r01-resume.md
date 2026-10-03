<!-- handoff-format: resume-point-v1 -->
# agent-environment-r01: resume point

- **As of:** `codex/owner-redesign-r04` at `47c44ba` plus the commit that adds this file; `agent-environment-r01` at `58f41d7`; 2026-10-03 02:19 +03:00
- **Previous resume point:** `docs/phase-records/handoffs/agent-environment/20261002-235031-agent-environment-r01-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/agent-environment/DECISIONS.md`, `docs/agent-context/WORKING_AGREEMENTS.md`

## State

- Codex rounds 5-8b are done, graded on held-out checks and recorded in
  `docs/phase-records/handoffs/agent-environment/codex-rounds.md`: shared path classifier (6), folder references and
  Windows short paths (7), the acceptance review's six findings (8), one resume-point name (8b; DECISIONS item 10).
- CI is green on GitHub at `c99d07c` (run 37074516125). `gh` is installed and signed in; in a shell older than the
  install use `C:/Users/Pc Force/AppData/Local/Microsoft/WinGet/Links/gh.exe`.
- Independent acceptance review (Opus verifier): A1-A7 pass, which covers criteria 2-6 of the packet; its findings
  were repaired in rounds 8 and 8b.
- Merged into `codex/owner-redesign-r04` (`47c44ba`): 708 script tests, both checkers and Biome pass there, and the
  runs leave `git status` unchanged. `owner-r04-nav` needs no merge: it is finished and merged into the build branch.
- The Codex command in `docs/agent-context/WORKING_AGREEMENTS.md` now prepends a launch note naming the brief's own
  commit; without it Codex stops on the HEAD mismatch.

## Running now

Nothing.

## Next steps

1. **Acceptance criterion 1:** this session's successor is the test. It receives only «كمّل» and must reach both
   milestones' next steps through `PROJECT_STATE.yaml`, `pnpm context:show --milestone <id>` and these resume points.
   Record a transcript excerpt (the route it took, the step it reached) for the evidence receipt.
2. **Merge into `owner-followup-r04-build`:** done by owner-design-exploration-r04's step 1.
3. **Close the milestone:** an evidence receipt from `docs/agent-context/EVIDENCE_RECEIPT_TEMPLATE.md` with the test
   results, the packet SHA-256, the step-1 excerpt and the acceptance verifier's report
   (`D:/fitway-temp/env-acceptance/`); then the terminal state and archive as `docs/WORKFLOW.md` describes.
4. **Brief quality** (DECISIONS items 6 and 9): most failed rows this session traced to the coordinator's briefs.
   Count brief-caused and code-caused failures per round in both codex-rounds.md files; propose template lines for
   the two recurring causes (a required outcome whose baseline was not checked, B7: rounds 3 and 6; a rule stated
   without its boundary cases: round 5's path rule, round 8's S1); test them through the evaluation loop before
   they enter the templates.
5. **Usage panel mod** (DECISIONS item 8), once the desktop app runs Claude Code 2.1.287 or later.

## Waiting on the user

Nothing.

## Known risks

- Codex was at 96% of its five-hour window at 01:45; it resets at 05:13 +03:00 on 2026-10-03. Read `rate_limits` from
  the newest `C:/Users/Pc Force/.codex/sessions/**/rollout-*.jsonl` before each launch.
- The live test in `scripts/check-frontier-preservation.test.ts` passes only on a clean tree.
- A file-name pattern that contains an exact template token (such as a branch placeholder before `-resume.md`) is
  rejected as a placeholder (`scripts/agent-environment/resume-point.mjs:25`); write such patterns another way.
- The main checkout `D:/Projects/fitway` has an uncommitted one-line change to `AGENTS.md` dated 2026-09-06; not ours.
- PowerShell 5.1 strips the inner quotes of `-c key=["x"]` passed to `codex`; use Git Bash for such overrides.

## Pointers

- Environment worktree: `D:/Projects/fitway-worktrees/agent-environment-r01`, branch `agent-environment-r01`, expected HEAD `58f41d7`.
- Held-out checks: `D:/fitway-grader/agent-environment/` (never in a brief). Codex run logs: `D:/fitway-temp/codex-runs/<run>/`.
- Packet: `docs/phase-records/task-packets/agent-environment-r01.yaml`.
