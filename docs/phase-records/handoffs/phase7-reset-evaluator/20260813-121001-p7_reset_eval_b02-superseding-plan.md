# Phase 7 reset evaluator b02 superseding fresh-attempt plan

- Status: `PLAN_REVIEW_REQUIRED`; no source worktree, lease, profile, or implementation is active.
- Authority base: clean coordinator `main` at
  `a8e0c6a57f5827b28f5841ec0677745eb866fc22`.
- Fresh attempt: `work/phase7-reset-evaluator-b02` in
  `D:/Projects/fitway-worktrees/phase7-reset-evaluator-b02`, repair budget `0/2`.
- Preserved terminal attempt: b01 and its `2/2` failure record remain immutable provenance.
- This file supersedes, but does not overwrite,
  `20260811-222719-p7_reset_eval_b02-plan.md`.

## Observable outcome and normative semantics

Deliver the pure scheduled-reset evaluator required by Phase 7. For every historical evaluation,
it identifies the latest applicable close, freezes the owning settings version and buffer at that
close, derives the stable due instant, and returns the existing pending/applied/superseded decision
without transport, router, cron, persistence, migration, or UI work.

`SPEC.md` and ADR-004 now settle the former blocker:

- the settings version effective immediately before close owns that session's reset;
- a version effective exactly at close does not own it;
- the owning version, `resetBufferMinutes`, and `dueAt` freeze at close;
- later settings changes, including during the buffer, never recompute or transfer that reset;
- later versions apply prospectively, and historical evaluation never substitutes current settings.

## Preserved evidence and reuse boundary

Replay only these four exact file blobs from
`f329f70ba887004315308fa0345fcc4ef74df407`:

- `packages/api/src/reset/types.ts`
- `packages/api/src/reset/evaluator.ts`
- `packages/api/src/reset/evaluator.test.ts`
- `apps/server/src/phase7-reset-evaluator.integration.test.ts`

Those blobs are byte-identical to b01 `dd3abbc` and preserve stable evaluator intent. Reuse only
the obsolete-gap regression from `457a06a` and the selected-gap-must-throw regression from
`c1db8a8`; do not replay either implementation. Commits `61dd078`, `457a06a`, and `c1db8a8` remain
rejected provenance. The b01 terminal counterexamples and the advisory plan
`20260810-012600-p7_reset_eval-advisory-resume-plan.md` supply the required transition-window seam.

## Scope and ownership

Worker-owned paths:

- `packages/api/src/reset/**`
- `apps/server/src/phase7-reset-evaluator.integration.test.ts`
- new `docs/phase-records/handoffs/phase7-reset-evaluator/*-p7_reset_eval_b02-worker-*.md`

Exclusive seven-day shared lease:

- `packages/api/src/occupancy/schedule.ts`
- `packages/api/src/occupancy/schedule.test.ts`

Coordinator-only paths:

- `PROJECT_STATE.yaml`
- `scripts/verify.mjs`
- `SPEC.md`, ADRs, workflow, manifests, lock/config files, schemas, and migrations
- every existing handoff and every phase record outside the new b02 worker pattern

All routers, contexts, auth, analytics, reporting, offline/edge, commands, database schema/migration,
environment, web, Browser, Paper, visual, and unrelated server paths are forbidden. The evaluator
remains additive and unexposed; Phase 7 integration owns cron transport and persistence later.

## Activation and state sequence

After independent plan `PASS`, the coordinator:

1. restores only the `phase7-reset-evaluator` verification profile with the Phase 7 integration
   test and `browserFiles: []`;
2. records `NEEDS_HUMAN -> READY`, the exact clean activation commit, b02 identities/scope, lease,
   repair `0/2`, and pending gates;
3. creates the absent b02 branch/worktree from that activation commit;
4. runs `pnpm install --frozen-lockfile`, provisions ignored `apps/server/.env` without disclosure,
   and proves `pnpm exec vitest --version`;
5. only after those preflight checks records `READY -> IN_PROGRESS` with a start-ratification
   handoff. No source replay or edit precedes ratification.

## Regression-first implementation invariants

Candidate generation must be total. Convert every candidate wall time independently into one of:

- exact: one real timeline instant;
- ambiguous fold: choose the established earlier matching instant;
- nonexistent gap: retain an unresolved candidate rather than throwing during generation.

One settings candidate must never abort generation or ownership evaluation of the others. Apply
ownership only after generating candidates across the full settings history, compare real timeline
instants, and make the result independent of `settingsVersions` input order.

The selected winner controls rejection: only a winning unresolved gap may surface the existing
rejection. An obsolete, future, non-owning, or otherwise losing gap cannot abort evaluation. Do not
change the public `evaluateSchedule` contract. Preserve its current strict traversal behavior,
including the separate next-opening scan throw path; characterize that untouched second path before
any leased schedule edit.

## Frozen red/green matrix

The worker first proves the replayed stable suite green, then adds one focused red at a time:

1. exact-close version change: immediately pre-close settings own; exact-close settings do not;
2. during-buffer change: owning version, buffer, and `dueAt` remain byte-stable after close;
3. prospective later close: the newer version can own only a later applicable session;
4. transition-window false negative: a valid winning candidate survives an obsolete gap candidate;
5. transition-window false positive: an obsolete candidate cannot be selected by sampled-offset or
   hypothetical-instant ownership;
6. winning unresolved gap: the existing rejection surfaces only when that candidate wins;
7. ambiguous fold: the earlier matching real instant is selected and then ownership is evaluated;
8. order independence: several permutations of the same settings history return identical results;
9. final-close/business-day behavior: the latest applicable close wins across midnight and weekday
   boundaries with no retroactive current-settings substitution;
10. schedule preservation: existing selected gap behavior plus the untouched next-opening scan
    throw path retain their exact current public outcomes.

Each new regression must fail for the intended semantic reason before the minimal production
change. TDD reds do not consume repair attempts; a candidate-gate failure may receive at most two
focused repairs cumulatively.

## Worker validation ladder

Use only:

```powershell
$env:FITWAY_RUN_ID='p7_reset_eval_b02'
$env:TEST_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:55432/fitway_integration_p7_reset_eval_b02'
$env:FITWAY_INTEGRATION_RESET_DATABASE='fitway_integration_p7_reset_eval_b02'
$env:FITWAY_PHASE='phase7-reset-evaluator'
pnpm exec vitest run packages/api/src/reset/evaluator.test.ts
pnpm exec vitest run packages/api/src/occupancy/schedule.test.ts packages/api/src/reset/evaluator.test.ts
pnpm exec vitest run --config vitest.integration.config.ts apps/server/src/phase7-reset-evaluator.integration.test.ts
pnpm exec biome check packages/api/src/reset packages/api/src/occupancy/schedule.ts packages/api/src/occupancy/schedule.test.ts apps/server/src/phase7-reset-evaluator.integration.test.ts
pnpm --filter @fitway/api check-types
pnpm --filter server check-types
pnpm verify:fast
pnpm verify:phase
git diff --check
git diff --cached --check
git status --short --branch
```

The worker commits a clean candidate and evidence handoff, then stops at
`READY_FOR_INTEGRATION`. It does not push, merge, change state/profile, or declare `DONE`.

## Independent verification and coordinator closeout

A fresh verifier who did not implement b02 uses run/database suffix `_v02`, reviews the full
activation-to-candidate diff and every authority/invariant above, runs the exact worker ladder, and
returns `PASS` or `FAILED_VALIDATION` without edits. A verifier rejection is terminal.

Only verifier `PASS` permits serial no-ff integration. The coordinator then uses suffix `_coord02`,
runs the focused unit/integration/profile ladder plus `pnpm verify:full`, checks the exact diff and
clean status, writes the terminal handoff, clears the lease/owner/heartbeat/expiry, retains the
passing profile, and marks only `phase7-reset-evaluator` `DONE`. Dependent `phase7-integration`
remains separate.

## Failure and rollback

- Same candidate gate red after repair `2/2` or fresh verifier rejection: `FAILED_VALIDATION`.
- Product/security/privacy conflict or new same-level authority disagreement: `NEEDS_HUMAN`.
- External dependency unavailable after bounded evidence: `BLOCKED`.
- On any terminal b02 failure, preserve unmerged source only on the isolated branch, write exact
  evidence, clear owner/heartbeat/expiry, release the schedule lease, remove the unintegrated
  profile, and never rewrite b01 or b02 repair history.
- No former exact-close/during-buffer ownership question remains; do not re-escalate it.
