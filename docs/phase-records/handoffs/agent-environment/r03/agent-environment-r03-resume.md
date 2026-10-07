<!-- handoff-format: resume-point-v1 -->
# agent-environment-r03: resume point

- **As of:** `agent-environment-r03` at `3a8f19d2`, 2026-10-07 17:07 +03:00
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
- Codex round 3 (CI, xhigh) is committed at `eb87d094`: CI runs the fast ladder (`pnpm verify:fast`) with the
  placeholder values; `check:frontier` and the Vitest provenance layer are gone (7,750 lines). N1 first failed on two
  resume points citing the deleted test (a brief fault, fixed in `aa6a8471`); graded 10 of 10 held-out rows.
- R3 (one home per rule) is merged at `bbafa712`, CI green (the ladder 5 min 4 s): AGENTS.md holds the rules once,
  WORKFLOW.md the procedure, WORKING_AGREEMENTS the agreements (including those that lived only in memory), the
  Codex template's checklist the brief rules B1-B10. Six machine-local memory notes moved to
  D:/fitway-temp/memory-retired-20261007/ (their content is in the repository).
- The machine cleanup is done (the user ran the scripts, 2026-10-07): about 56 GB freed (D:/fitway-temp leftovers
  and the closed held-out runs 17.7 GB, D:/codex-worktrees-archive with its 14 worktrees 15.5 GB, D:/fitway-scratch
  16.5 GB, Codex session logs older than two days 6.4 GB on drive C, which now has 19 GB free); the r01 worktree is
  removed and git holds no stale worktree record.

## Running now

Nothing.

## Next steps

1. R4, the verification path (r04 DECISIONS item 40; agent-environment DECISIONS items 13 and 15): the verify-fitway
   skill at .agents/skills/verify-fitway with a .claude pointer, the feature map generated from the Eclipse folder,
   a CLI on ui-forensics and the probe kit, a no-store preview, and one command that launches a Codex round.
2. R5, the gardener (DECISIONS item 16) and its first pass, then the closing receipt and the independent review.
   Its sweep deletes with rmdir /s /q and the \\?\ prefix: a folder named with a trailing dot ("evidence.",
   2026-10-07) is unreachable through ordinary Windows paths, and a PowerShell script on `Stop` halts on rmdir's
   error output.
3. Follow-ups for a Codex round: name the field when `supersededBy` is misplaced; strip a standalone `--` in
   `scripts/run-vitest.mjs`; remove the routes' compatibility mode and the four unused task classes; separate the
   brief checker's rule ids from B1-B10 (audit A, C13); read the Impeccable path in `scripts/check-design-context.mjs`
   from the environment (audit A, A18); a check that open milestones' owned paths do not overlap (A7).

## Waiting on the user

Nothing.

## Known risks

- Codex's weekly window was 94% used on 2026-10-06 and resets about 2026-10-10; if a run stops on the limit, the
  user switches accounts and the run resumes on its thread (flags before `resume`).
- `codex exec --approve-for-me` is allowed only from the coordinator session in the owner-design-exploration-r04
  worktree (a machine-local allow rule); launch with `-C` from there.
- Branch owner-followup-r04-build still carries the old lease check and fails CI on a push after 2026-10-10: merge
  main into it before its next push.

## Pointers

- Worktree: D:/Projects/fitway-worktrees/agent-environment-r03, branch agent-environment-r03; main and the coordinator
  line codex/owner-redesign-r04 follow it whenever its CI passes.
- Packet: `docs/phase-records/task-packets/agent-environment-r03.yaml`; briefs: `docs/phase-records/handoffs/agent-environment/r03/briefs/`.
- Audit reports A-D: D:/fitway-temp/env-audit-a/ to env-audit-d/ (REPORT.md each); held-out rows: D:/fitway-grader/.
