<!-- handoff-format: resume-point-v1 -->
# agent-environment-r03: activation

- **As of:** main at `cf7758eb`, 2026-10-07 14:00 +03:00
- **Previous resume point:** none
- **Standing decisions:** `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 12-16 (this phase), and
  `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` item 40 (the tooling round)

## State

- Opened by the coordinator on 2026-10-07 under the user's wider mandate for this phase (DECISIONS item 12): clean,
  simplify and improve the environment itself; old rules, workflows, tools and records stay only on evidence.
- It absorbs agent-environment-r02, whose work is all on main by patch; r02 keeps only its packet and closes once the
  records can express a closure by succession. CLAUDE.md, .claude/agents/**, .claude/skills/** and biome.json moved
  here from owner-design-exploration-r04 (DECISIONS item 14).
- ui-forensics 1.1.0 (the user's machine-level skill) was reviewed and extended for this phase on 2026-10-07; report,
  patch and a focus trial on the build: `D:/fitway-temp/ui-forensics-1.1.0/`.
- The live Owner concept is on the build branch, not on main (DECISIONS item 15): the worktree
  D:/Projects/fitway-worktrees/owner-followup-r04-s04, branch owner-followup-r04-build at `a474fe30`.
- Inputs: the four discussion digests, `D:/fitway-temp/verification-discussion-20261007/`; the opening digest,
  `D:/fitway-temp/milestone-open-digest/REPORT.md`; pstack's two verification skills (user-level, unmodified).

## Running now

Nothing.

## Next steps

1. **The audit** (packet criterion 1): every rule, workflow, tool, check, record type and machine resource, each
   classified keep, merge, replace or remove with cited evidence, saved before the first removal.
2. **The cleanup** in bounded rounds, each naming the audit items it closes; the records change that lets r02 close.
3. **The verification path** (r04 DECISIONS item 40): the verify-fitway skill and feature map first, then the CLI and
   the no-store preview, then the Codex launch command, the checker faults and the B8 and B9 fields.
4. **The gardener** (DECISIONS item 16), its first pass, the closing receipt and the independent review.

## Waiting on the user

Nothing.

## Known risks

- agent-environment-r02's lease ends 2026-10-14 (extended at this opening); close it before then, or renew it.
- Until the checker fault is fixed, a backticked machine-local path (other than D:/fitway-temp) or a slashed branch
  name fails the resume-point check on CI: write them as plain text.
- The lease check reads the wall clock: a branch carrying an older PROJECT_STATE.yaml fails CI once a lease in it
  passes. Merging main refreshes it.
- ui-forensics lives outside the repository, so cloud sessions cannot run the browser verification.

## Pointers

- Worktree: D:/Projects/fitway-worktrees/agent-environment-r03, branch agent-environment-r03, base `cf7758eb`,
  prepared with `pnpm install --frozen-lockfile`.
- Packet: `docs/phase-records/task-packets/agent-environment-r03.yaml`.
- Ports: 3174 is the user's preview; 3176-3177 builders, verifiers and Codex; 3178-3179 reviewers.
- Held-out checks: D:/fitway-grader/ (never in a brief).
