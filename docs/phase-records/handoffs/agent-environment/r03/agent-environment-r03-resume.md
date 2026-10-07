<!-- handoff-format: resume-point-v1 -->
# agent-environment-r03: resume point

- **As of:** `agent-environment-r03` at `1d4e99a2`, 2026-10-07 15:45 +03:00
- **Standing decisions:** `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 12-16,
  `docs/agent-context/WORKING_AGREEMENTS.md`

## State

- The audit is saved: `docs/phase-records/handoffs/agent-environment/r03/AUDIT.md` (rounds R1-R5).
- R1 is done and on main at `a1776392`: CI no longer fails on its own records (lease judged against the ledger,
  only repository paths judged, `biome ci .`, owner tokens in CI, one concurrency group, 20-minute timeout).
- The brief checker accepts a cited line range (`1756dc7e`).
- Codex round 2 (records, xhigh, `docs/phase-records/handoffs/agent-environment/r03/briefs/round-2.md`) is committed at `58486075`, CI green: `SUPERSEDED` with
  `supersededBy`; no heartbeat, lease or packet pin is read; scope, baseCommit and the handoff live in the ledger and
  `taskClass` in the packet; one resume file per milestone; closing needs no receipt; closed records are checked for
  shape only. It removed 4,602 lines. Graded 12 of 12 held-out rows; recorded in
  `docs/phase-records/handoffs/agent-environment/codex-rounds.md`.
- After it, the coordinator stripped the unread fields and the packet copies, closed agent-environment-r02 as
  `SUPERSEDED` by r03, and moved r03, r04 and access-reason-cap-r01 to stable resume files.
- A CI probe (branch ci-probe-verify-fast, run 37613695315) ran `node scripts/verify.mjs fast` on windows-latest with
  the placeholder values of `docs/WORKFLOW.md:102-114`: green in 8 min 50 s (unit tests 6 min 7 s).

## Running now

- Codex round 3 (xhigh) in this worktree, from `docs/phase-records/handoffs/agent-environment/r03/briefs/round-3.md`;
  its run folder is D:/fitway-temp/codex-r03-round3/ (events.jsonl, last-message.md). Write nothing in this worktree
  until it ends.
- R3, the rules round, by the coordinator in the worktree D:/Projects/fitway-worktrees/agent-environment-r03-rules,
  branch agent-environment-r03-rules (disjoint paths; merged into this branch after round 3).

## Next steps

1. When round 3 ends: grade it on D:/fitway-grader/agent-environment/r03-round3-heldout.md in a scratch clone, record
   it in the rounds log, push, and check CI is green inside its timeout; then delete the probe branch
   ci-probe-verify-fast on origin.
2. Finish R3 (one home per rule in `AGENTS.md`, `docs/WORKFLOW.md`, `docs/agent-context/WORKING_AGREEMENTS.md`,
   `CLAUDE.md` and `docs/agent-context/briefs/codex.md`; conflicts C1-C14 and the stale text of audit A; the
   verification rule becomes the CI run on the pushed commit), merge it, then trim the user's machine-local memory to
   machine facts.
3. R4, the verification path (r04 DECISIONS item 40), then R5, the gardener (DECISIONS item 16) and the closing review.

## Waiting on the user

- Run the cleanup script: powershell -ExecutionPolicy Bypass -File D:\fitway-temp\env-cleanup-20261007.ps1 (a dry run;
  add -Apply to delete; -IncludeHeldoutRuns also frees 17.6 GB of closed r01 evaluation runs).
- Keep or delete: D:/fitway-scratch (17.7 GB), D:/codex-worktrees-archive (16.7 GB), C:/Users/Pc Force/.codex/sessions
  (7 GB on the full drive C).

## Known risks

- Codex's weekly window was 94% used on 2026-10-06 and resets about 2026-10-10; if a run stops on the limit, the
  user switches accounts and the run resumes on its thread (flags before `resume`).
- `codex exec --approve-for-me` is allowed only from the coordinator session in the owner-design-exploration-r04
  worktree (a machine-local allow rule); launch with `-C` from there.
- Until round 3, `scripts/check-frontier-preservation.test.ts` fails whenever the tree holds any uncommitted file:
  judge the scripts suite on a committed, clean tree.
- Branch owner-followup-r04-build still carries the old lease check and fails CI on a push after 2026-10-10: merge
  main into it before its next push.
- Delete the probe branch ci-probe-verify-fast on origin once round 3's CI is green.

## Pointers

- Worktree: D:/Projects/fitway-worktrees/agent-environment-r03, branch agent-environment-r03; main and the coordinator
  line codex/owner-redesign-r04 are at `a1776392`.
- Packet: `docs/phase-records/task-packets/agent-environment-r03.yaml`; briefs: `docs/phase-records/handoffs/agent-environment/r03/briefs/`.
- Audit reports A-D: D:/fitway-temp/env-audit-a/ to env-audit-d/ (REPORT.md each); held-out rows: D:/fitway-grader/.
