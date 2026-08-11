# Completion blocker-state reconciliation plan — 2026-08-11

## Objective

Make the coordinator ledger describe the verified completion frontier rather than the discharged
isolated-worker-capacity blocker. After this slice, resumable but unassigned work is `PLANNED`,
preserved candidates and terminal attempts remain reachable, and the next implementation slice can
be activated without inventing authority or weakening a gate.

## Scope

- `PROJECT_STATE.yaml`
- `docs/phase-records/handoffs/coordinator/20260811-201714-shared-toolchain-unblock-probe.md`
- one coordinator completion-frontier handoff under
  `docs/phase-records/handoffs/coordinator/`
- this plan

Out of scope: implementation code, candidate branches/worktrees, Paper edits, canonical screenshot
files, new visual milestones, `PHASES.md`, migrations, router/server aggregation, deployment,
provisioning, and pushing. `staff-canonical-baselines`, `owner-analytics-paper-adoption`, and
`public-paper-parity` remain a separately planned and reviewed follow-up slice.

## Locked decisions

- The human approved canonical screenshot baselines for final adopted Paper surfaces, including
  `/staff`, `/login`, `/admin`, and Owner reporting as applicable.
- `146R-0` is approved Staff interaction/accessibility authority. Staff remains monitoring-only.
- The real repository FITWAY logo is the final brand mark only where an approved Paper composition
  assigns a brand-mark position. Paper composition controls placement; legacy watermark or drawn
  branding does not create a new role for the asset.
- Preserved Phase 6, Login, and Owner-shell candidates are reused, not rebuilt. The historical
  Phase 7 b01 attempt remains terminal; a fresh b02 uses a new repair counter and the recorded
  regression plan.
- Phase 11 Access decisions recorded at `103cc00` remain resolved and are not re-escalated.

## Stages and rollback boundaries

1. Reconcile stale blocker state in one coordinator change:
   - reference the successful shared unblock record at
     `20260811-201714-shared-toolchain-unblock-probe.md`: preserved Phase 6 worktree
     `work/phase6-offline-b02` at `cb4ec2d`, run label `codex_shared_unblock_probe`, frozen install
     completed in 248 ms, Vitest `4.1.10` printed, and Vite/Vitest configuration reached collection
     at `2026-08-11T20:17:14+03:00`;
   - change `phase-6`, `phase7-reset-evaluator`, `login-paper-adoption`,
     `phase10-csv-transport`, `phase11-shell`, `phase11-audit`, and `phase11-access` from stale
     `BLOCKED` classifications to truthful unassigned `PLANNED` states;
   - clear `ownerSession`, `baseCommit`, `ownedPaths`, `forbiddenPaths`, `sharedLeases`,
     `lastHeartbeatAt`, `leaseExpiresAt`, and `stopReason` for every transitioned milestone;
   - retain repair count `0`, keep branch/worktree values only for the physically preserved Phase 6
     and Phase 10 CSV worktrees, and preserve immutable historical handoffs/checkpoints by reference
     from the new coordinator handoff;
   - point each transitioned milestone at the new coordinator handoff;
   - record Phase 11 Owner-lane serialization as execution ordering, not as an invented Product
     dependency.
   Rollback: revert the single coordinator reconciliation commit; the prior blocked ledger and all
   preserved branches/worktrees remain intact.
2. Independently review the diff and evidence without repair. Any blocking finding returns the
   slice to a focused correction before activation of implementation work.

## Verification fixed before execution

- `pnpm check:repository` — schema, dependency DAG, live-state invariants, and referenced handoffs.
- `pnpm verify:fast` — repository invariants, Biome, type/build checks, unit tests, Python simulator
  tests, and mutation guard; capture the actual counts rather than fixing them in advance.
- `git diff --check`.
- `git status --short --branch` before and after verification; only the declared files may differ
  before commit and the worktree must be clean after the reconciliation commit.
- Fresh read-only reviewer checks the full diff against `AGENTS.md`, `docs/WORKFLOW.md`,
  `PHASES.md`, `PROJECT_STATE.yaml`, the terminal handoffs, and the human decisions above.

## Risks and unknowns

- `origin/main` is only the local remote-tracking snapshot until a later authorized fetch; this
  slice does not depend on remote state and does not push.
- Paper rendering was not reproduced in this slice. Visual milestone creation and public parity
  remain a separate follow-up, and no public adoption is inferred.
- `READY` is not used for queued work because repository invariants require an assigned owner,
  branch, worktree, base, lease, and handoff with every dependency `DONE`. Activation is a separate
  coordinator stage for the one slice that will actually run.
- Phase 7 semantic coverage remains governed by its recorded regression/root-cause plan and must
  be proven in the fresh b02; this reconciliation makes no evaluator decision.

## Open decisions

None. The human decisions required by the completion audit are supplied in the active goal brief.

## Recommended first activation after this slice

Resume Phase 6 from preserved implementation candidate
`e4832915524fe23edca77afaa0f9be74a0c38ff3`, restore its exact scoped leases and isolated run
resources, run the recorded negative regressions first, and do not replay or rebuild the candidate.
