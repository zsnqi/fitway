# owner-design-exploration-envelope-repair-r01 — opening (IN_PROGRESS)

- Recorded: 2026-09-21 18:31 +03:00 (observed local clock; report-name timestamps follow the
  session convention and are not authoritative capture times).
- Status: **IN_PROGRESS**. Packet `READY`.
- Task class: `repository-infrastructure`.
- Base: `59ee417555383f271e10d9c283826d865a5efc08` (branch `codex/owner-design-exploration-r01`;
  `baseCommit: SELF` names this opening context).
- Worktree: `C:/Users/Pc Force/.codex/worktrees/owner-design-exploration-r01/phase5-staff-integration`.
- Owner session: `owner-design-exploration-envelope-repair-r01-coordinator`.
- Packet: `docs/phase-records/task-packets/owner-design-exploration-envelope-repair-r01.yaml`.
- Decision record: `docs/phase-records/handoffs/owner-design-exploration-envelope-repair-r01/20260921-183100-exploration-envelope-decision.md`.

## Why this repair exists

Repeated Owner concept attempts across different models, skills, and directions converged on the
same near-black/oxblood/FITWAY-red atmosphere. Investigation traced this to the exploration
context, not to model taste: the locked palette/atmosphere rules were applied to exploration
artifacts verbatim, the concept gate judged composition only, the packet carried no
exploration-envelope or direction-distinctness fields, the design-skill router sent sessions into
"established world: inherit it", and prior attempts plus the frozen r02 topology acted as
in-brief references.

## Scope of this repair

- Add an explicit exploration envelope (`visual.explorationEnvelope`) and require it for
  `authorityStatus: VACANT` packets.
- Repair the concept gate and evidence rules in `docs/WORKFLOW.md`; add an exploration-mode clause
  to the `DESIGN.md` router.
- Quarantine the prior informal attempts as evidence, add the milestone brief and anti-ruts, and
  scope Biome away from the frozen quarantine only.
- Update the exploration packet with the envelope, direction-distinctness acceptance criteria, and
  the `DESIGN.md` exploration-mode authority; keep it PLANNED/DRAFT and keep the standing
  design-environment audit gate unresolved.
- No production, authority, canonical, register, ADR, manifest, or hash change.

## Pre-existing observations before edits (recorded, not caused by this repair)

- `node scripts/check-agent-context.mjs` PASS; `node scripts/verify-repository.mjs` PASS.
- `scripts/check-agent-context.test.ts:606` fails (expects no open milestone; actual
  `["owner-design-exploration-r01"]`) — stale expectation from the exploration milestone opening.
- `node scripts/check-frontier-preservation.mjs` fails in dirty mode because the untracked
  `design-research/**` artifacts flip the check to dirty mode and the recorded dirty frontier
  entry `apps/web/src/components/owner/access/messages.ts` is absent in this worktree.
- `pnpm exec biome check design-research` reports 44 errors from the untracked informal artifacts.

## Non-claims

No UI, Paper, canonical, manifest, register, ADR, approval-hash, dependency, schema-migration, or
product behavior change. No concept selection begins. The audit gate remains open.
