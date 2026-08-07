# Wave 0 — common baseline repair on `main`

- Status: `DONE`
- Session: coordinator-only, `main`, 2026-08-07. No worktree created, no branch created, no phase
  activated, no push.
- Starting head: `680cccc48c8f2b6aef4f6746016cc639f74f9798`
- Resulting head (`M0`): the commit containing this record
- Trigger: `docs/phase-records/dependency-parallelization-audit.md` §1, independently reproduced
  before any change was made

## Root cause of the red baseline

`node scripts/verify-repository.mjs` on `680cccc`:

```text
FAILED_VALIDATION: phase5-staff-ui has an expired lease at the current wall-clock time
exit=1
```

`PROJECT_STATE.yaml` carried `phase5-staff-ui.leaseExpiresAt: 2026-07-29T21:11:56+03:00`, frozen at
the 2026-07-27 activation (`680cccc`) while the retry branch kept moving.
`scripts/verify-repository.mjs` rejects an expired lease on any milestone in
`READY | IN_PROGRESS | VALIDATING | READY_FOR_INTEGRATION`, and `check:repository` is step 1 of
`fastSteps()` in `scripts/verify.mjs`, so it is the base of every rung of the ladder. Any worktree
branched from `680cccc` failed its first gate for a reason unrelated to its own work. This single
expired lease was the whole of the red baseline; no second cause was found.

## Shared commit propagation

All twelve commits on `work/phase5-staff-ui-b03-retry` were inspected by diff, message, ancestry,
and interaction with `main` before any was accepted. `main` was a strict ancestor of that branch
(`merge-base` = `680cccc`), so nothing had to be reconciled.

Integrated, in branch order, by `git cherry-pick -x`. Each resulting commit is patch-identical to
its source (`git patch-id --stable`), so a later `git rebase --onto` of the Phase 5 branch drops
them rather than replaying them:

| Source | New | Why it is repository-wide |
| --- | --- | --- |
| `f212bc1` | `ec35298` | ADR-007 makes Paper the visual source of truth, supersedes ADR-006 in part, and adds the manifest `paperAuthority` block. Binds every future UI phase, not Phase 5. |
| `9b31486` | `716ac10` | Migrates four untracked root authority documents into defined locations, voids the self-granted implementation gate one of them claimed, and records the one-writer and review-every-result rules in `AGENTS.md`. |
| `43b08da` | `6e1735f` | Adds `CLAUDE.md` importing `AGENTS.md`, so a Claude session loads the root policy at all, and retitles `docs/WORKFLOW.md` as tool-neutral. Without it every Claude worktree starts without the source-of-truth order. |
| `bf73e6a` | `739f57c` | The dependency and parallelization audit itself. It governs cross-phase waves, ownership boundaries, and per-worktree baselines for phases 5 through 12; a `phase10-domain` worktree that cannot see it cannot honour it. |

Deliberately **not** propagated:

- `06454f9`, `36aa857`, `67feb96`, `6cc6d6a` — the staff command UI candidate, its
  server-authoritative lifecycle salvage, and the UX/visual rebalance. Phase 5 implementation.
- `9ebbf37` — the human visual verdict record. Documentation-only, but it is Phase 5 slice
  evidence and the monitoring-only plan's rollback boundary names it among the five commits that
  must not reach `main` ahead of the closeout.
- `6611c4b`, `39a0204` — the monitoring-only reconciliation plan and its revision. Overwhelmingly
  Phase-5-scoped, and they live inside `phase5-staff-ui`'s own `ownedPaths` handoff directory.
  They reach `main` with the closeout that owns them.
- `c735a77` — a `PROJECT_STATE.yaml` change authored inside a worker worktree, against that
  slice's own `forbiddenPaths`. Its intent was adopted; its content was re-authored on `main` by
  the coordinator (below).

Known and accepted consequence: `docs/phase-records/dependency-parallelization-audit.md` links to
`handoffs/phase5-staff-ui/20260806-155000-p5_staff_monitoring_only-plan.md`, which is added by
`6611c4b` and is therefore branch-only. That link resolves when the Phase 5 closeout integrates.
Pulling the plan forward to fix a link would have meant absorbing a Phase-5-specific commit into
the common baseline, which Wave 0 does not do. Nothing executable depends on the link.

## Handoff-pointer resolution

`c735a77` repointed `phase5-staff-ui.handoff` at
`docs/phase-records/handoffs/phase5-staff-ui/20260727-230622-p5_staff_b03_retry-human-visual-verdict.md`,
which `9ebbf37` adds. `scripts/verify-repository.mjs` calls `readBytes(milestone.handoff)` for
every milestone in an active worker status, so replaying `c735a77` onto `main` would have traded
the expired-lease failure for a missing-handoff failure — the invariant problem the audit raised
in §3.4.

Resolved in `ef96dab` by keeping the pointer at
`20260727-211156-p5_staff_b03_retry-activation.md`. That is the latest `phase5-staff-ui` handoff
that exists on `main`, which is exactly what `docs/WORKFLOW.md` asks the pointer to be. The lease
renewal and heartbeat refresh reuse the already human-authorized values from `c735a77`
(`2026-08-13T21:00:00+03:00`), and `ownerSession` was corrected because "UI work unlaunched" was
false. Status, gates, `ownedPaths`, `forbiddenPaths`, and lease scope are unchanged, and no Phase 5
implementation behavior was touched.

## Phase 9 aggregate closure

Closed in `439b1b3`. Evidence, reconciliation, the `integratedCommit` derivation, and the reason a
fresh `verify:full` was not rerun are in `docs/phase-records/phase-09-aggregate.md`.

## Phase 10 domain verification registration

Registered in `ffa26ba`. `scripts/verify.mjs` had no `phase10-domain` profile, so
`pnpm verify:phase --phase phase10-domain` was rejected outright and `docs/WORKFLOW.md` step 5
could not be satisfied for that worktree. The entry is mechanical: `browserFiles: []` because the
ledger already declares that slice's browser, accessibility, and visual gates `NOT_REQUIRED`;
`integrationFiles` non-empty because it declares `integration` required; the path follows the
`apps/server/src/<milestone-id>.integration.test.ts` convention used by five existing profiles.

The named file does not exist yet — the worker creates it, as with every other slice profile. The
Phase 10 activation must list that exact path in `ownedPaths`.

## Gates run on `M0`

```text
pnpm check:repository                                                              exit=0
  Repository invariants passed: 31 milestones, 8 canonical approval screenshots.

pnpm verify:fast                                                                   exit=0
  Repository invariants     PASS
  Biome check               PASS — 211 files
  Type checks               PASS — all workspaces
  Unit tests                PASS — 36 files / 140 tests
  Python simulator tests    PASS — 5 tests
  Repository mutation guard PASS — "Verification fast passed without repository mutation"
```

Run twice, consecutively, at `1ac03a7` — the last Wave 0 commit that touches any executable file.
Everything after it is Markdown that no gate reads.

This answers the audit's §16.4 open question: `verify:fast` does pass on the Wave 0 baseline. The
blocker the Paper closeout record predicted — `apps/server/src/command-repository.test.ts`
importing `packages/db` at module scope — does not exist here; that file is untracked on `main`
(`git ls-files` returns nothing) and belongs to the Phase 5 branch.

### The gate was red once, for a reason that predates Wave 0

Recorded because the first `verify:fast` on the Wave 0 head passed and the second failed, and
because the fix is a coordinator-owned file every future worktree inherits.

`packages/api/src/analytics/history-generator.test.ts` timed out at Vitest's undeclared 5000ms
default. `vitest.config.ts` had never set `testTimeout`, and under full-file parallelism that test
measures 5.9s while the next-slowest measures 4.0s; alone it takes ~3.0s. The suite had been
riding the default ceiling since Phase 9, so which side of it a run landed on was decided by
machine load: green at `439b1b3`, then red three consecutive times at `fc798b7` with no
intervening executable change.

Not a Wave 0 regression, and verified as such before anything was touched: `git diff --name-only
680cccc..HEAD -- packages apps edge tests` is empty, and the test, `packages/api/src/analytics/`,
`vitest.config.ts`, `package.json`, and `pnpm-lock.yaml` are byte-identical to `a7a7f64`, where
`verify:full` passed 140/140. The test file has not changed since `90aded1` on 2026-07-16.

Fixed in `1ac03a7` by declaring `testTimeout: 20000` in the root `vitest.config.ts` — roughly 3.4x
the slowest observed test. `vitest.config.ts` is root test-runner configuration, coordinator-owned
and named in every worker's `forbiddenPaths`, so it is Wave 0's to change and no worker's. No
test, assertion, product file, or gate semantic changed; only the wall clock stopped deciding
them. `vitest.integration.config.ts` is a separate config and was left alone.

The alternative — a per-test timeout inside
`packages/api/src/analytics/history-generator.test.ts` — was rejected: that path is
`phase9-analytics-domain`'s `ownedPaths` in a slice that is `DONE`, and the problem is the
suite-wide ceiling, not that one test.

`verify:full` was not rerun. See `docs/phase-records/phase-09-aggregate.md` for the reasoning and
for what would change if the Phase 4 precedent is held binding.

## Rollback boundary

`680cccc48c8f2b6aef4f6746016cc639f74f9798`. Every Wave 0 commit is independently revertible and
touches only coordinator-owned or repository-wide documentation, ledger state, and the verification
profile table. `git reset --hard 680cccc` restores the pre-Wave-0 `main`, including its red
baseline. No worker branch, worktree, or working tree outside `D:/Projects/fitway` was read from
or written to.

## State after Wave 0

- `main` clean; `git status --porcelain` empty.
- Ten registered worktrees, all unmodified by this session.
- `phase-9` `DONE`. `phase10-domain` and `phase11-shell` are now dependency-eligible;
  neither is activated.
- `phase5-staff-ui` remains `READY` on `work/phase5-staff-ui-b03-retry` with a live lease through
  2026-08-13T21:00:00+03:00.

## Unresolved, carried forward

1. **ADR-007 Paper-family coverage.** Audit §16.1. Six future UI surfaces have no approved Paper
   production family. Human decision or ADR amendment. Out of Wave 0 scope; blocks `phase11-shell`
   and `phase10-ui-csv`, not `phase10-domain`.
2. **The `phase5-staff-ui` verification profile is latently broken.** Audit §3.3.
   `scripts/verify.mjs` names `tests/browser/phase5-staff-ui.browser.spec.ts`, which does not exist
   on `main`, so `pnpm verify:phase --phase phase5-staff-ui` is red here. Deliberately left alone:
   the monitoring-only plan repoints it at `phase4-staff-web.browser.spec.ts` as part of the Phase 5
   closeout, which Wave 0 must not begin. It affects no Wave 0 gate.
3. **`SPEC.md` still requires the retired staff command UI.** Audit §3.6. Phase 5 closeout step 2.
4. **The five files in `6cc6d6a` outside `phase5-staff-ui`'s owned paths** remain retroactively
   unauthorized. Audit §16.5. Closeout work.
5. **Whether `phase10-domain` needs an index migration.** Audit §16.2. Measurement, not a
   coordinator decision.

## Next

Wave 1 may start from `M0`: the Phase 5 closeout on the existing rebased branch, and
`phase10-domain` as a new unexposed worktree. Both still require their own coordinator activation
commit with owner, branch, worktree, base commit, lease, and handoff recorded before any edit.
Neither is started here.
