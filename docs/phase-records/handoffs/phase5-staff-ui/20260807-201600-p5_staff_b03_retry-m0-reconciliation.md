# phase5-staff-ui retry — M0 branch reconciliation

- Status: `READY`. The retry branch is reconciled onto `M0`. The Phase 5 closeout is **not**
  started; no closeout step from the monitoring-only plan was executed.
- Base commit / candidate commit: `229b9ce1f50ba8f598ea60556913a8b98ac0c228` (`M0`, `main` HEAD at
  reconciliation) / `608c1f8ac190c3af06f8cdf2c1dce85dc4889b05`
- Branch / worktree / run ID: `work/phase5-staff-ui-b03-retry` /
  `D:/Projects/fitway-worktrees/phase5-staff-ui-retry` / `p5_staff_b03_retry`
- Registered disposable resources unchanged: port `20645`, database
  `fitway_integration_p5_staff_b03_retry`, and
  `D:/Projects/fitway-worktrees/phase5-staff-ui-retry/output/playwright/p5_staff_b03_retry`
- Owned paths / shared leases used: none consumed. No file inside `ownedPaths` or the scoped
  lifecycle-read lease was edited by this session; the branch was rewritten by replay only.
- Rollback ref: `preserve/phase5-staff-ui-b03-retry-pre-m0-20260807` =
  `bf73e6ac36715e5b9a6f16a49d982d9d19a8ccf7`, the pre-reconciliation head.

## Why

`docs/phase-records/wave-0-baseline.md` closed Wave 0 at `M0` and left Wave 1 to start there: "the
Phase 5 closeout on the existing rebased branch". `docs/phase-records/dependency-parallelization-audit.md`
§ *Wave 1* and its base-commit table require the same — the branch rebased onto `M0`, with
`baseCommit: M0`, because the recorded `baseCommit: SELF` pointed at the superseded `680cccc`
activation. Before this session the branch still sat on `680cccc` and carried four commits that
Wave 0 had already integrated into `main`.

## Commit topology, as reconciled

Merge base before: `680cccc` (the 2026-07-27 activation). Merge base after: `M0`. `main` is now a
strict ancestor of the branch; `git rev-list --count work/phase5-staff-ui-b03-retry..main` is `0`.

**Dropped as already upstream (4).** Verified patch-identical by `git patch-id --stable`, not by
message, and independently confirmed by `git cherry main work/phase5-staff-ui-b03-retry` marking
each `-` before the replay:

| Dropped from branch | Already on `main` as | `patch-id` |
| --- | --- | --- |
| `f212bc1` docs(visual): record Paper as the visual source of truth | `ec35298` | `0660272673e9b381c97a8439102c9bdade143ea7` |
| `9b31486` docs(coordination): migrate the untracked root authority documents | `716ac10` | `7955f70144e1b17e56aca074fab00b35f40bc176` |
| `43b08da` docs(coordination): make the root agent policy legible to both agents | `6e1735f` | `332a0fbfbe98de7e57988c66b4676b67afe294f8` |
| `bf73e6a` docs(coordination): record the read-only dependency and parallelization audit | `739f57c` | `597d1c22a76f0225b2f07d4ceeee999b03f74607` |

**Dropped as coordinator-superseded (1).** `c735a77` fix(coordination): renew the expired phase5
staff UI lease. It is a `PROJECT_STATE.yaml` edit authored inside a worker worktree against that
slice's own `forbiddenPaths`. Its intent was already adopted on `main` by the coordinator in
`ef96dab`, which reused the same human-authorized lease values and deliberately kept the `handoff`
pointer at a record that exists on `main` — replaying `c735a77` would have reintroduced the
missing-handoff failure `docs/phase-records/wave-0-baseline.md` § *Handoff-pointer resolution*
records. It was not replayed. `PROJECT_STATE.yaml` at the reconciled branch head is blob-identical
to `main`'s (`fe08430881a551f0732f7a6f865b629e9ee887b6`).

**Preserved and replayed, in original order (7).** Author and message preserved; hashes are new
because the base moved.

| Before | After | Commit |
| --- | --- | --- |
| `06454f9` | `ed10781` | feat(staff): add command correction and reset controls |
| `36aa857` | `2f41491` | fix(staff): keep command lifecycle server-authoritative |
| `67feb96` | `418e7e8` | feat(staff): read authoritative command lifecycle |
| `9ebbf37` | `f170538` | docs(staff): record human visual verdict |
| `6cc6d6a` | `885b5b0` | refactor(staff): rebalance staff operations and login surfaces |
| `6611c4b` | `12d8be2` | docs(staff): plan the monitoring-only Phase 5 reconciliation |
| `39a0204` | `608c1f8` | docs(staff): specify the monitoring-only Phase 5 closeout slice |

All seven replayed without a conflict. The only file `main` and the branch both touch since
`680cccc` is `docs/phase-records/paper-design-phase-closeout.md`, and `main`'s blob after `716ac10`
(`8df4b8f`) is identical to the blob `6611c4b` was authored against, so the two doc commits applied
as written.

## What the reconciliation changed, exactly

`git diff --name-status bf73e6a 608c1f8` — five entries, all inbound from `M0`, none Phase 5:

```text
M  PROJECT_STATE.yaml                          (c735a77 dropped; now identical to main)
A  docs/phase-records/phase-09-aggregate.md    (Phase 9 closure, 439b1b3/fc798b7)
A  docs/phase-records/wave-0-baseline.md       (Wave 0 record, fc798b7/229b9ce)
M  scripts/verify.mjs                          (phase10-domain profile, ffa26ba)
M  vitest.config.ts                            (unit-ladder timeout headroom, 1ac03a7)
```

Phase 5 content is byte-identical across the rewrite: `git diff bf73e6a 608c1f8` restricted to
`apps/`, `packages/api`, `tests/browser`, `docs/phase-records/handoffs/phase5-staff-ui/`, and
`docs/phase-records/paper-design-phase-closeout.md` is empty. `git diff --name-status M0 608c1f8`
is the 26 Phase 5 files and nothing else. No Staff Command UI reached `main`; `main`'s `/staff`
still imports no command component.

## Validation commands and results

On `main` at the coordinator commit, `FITWAY_RUN_ID=p5_recon_m0_main`:

```text
pnpm check:repository   exit=0   31 milestones, 8 canonical approval screenshots
pnpm verify:fast        exit=0   invariants PASS · Biome PASS 211 files · types PASS all workspaces
                                 unit PASS 36 files / 140 tests · simulator PASS 5 tests
                                 mutation guard PASS
```

On the reconciled branch in `D:/Projects/fitway-worktrees/phase5-staff-ui-retry`,
`FITWAY_RUN_ID=p5_recon_m0_branch`:

```text
pnpm check:repository                exit=0   31 milestones, 8 canonical approval screenshots
pnpm verify:fast                     exit=1   stops at Biome — see the environmental note below
biome check <tracked paths only>     exit=0   219 files, no diagnostics
pnpm check-types                     exit=0   all workspaces, apps/web builds
pnpm test                            exit=1   40 files: 39 pass / 147 tests pass, 1 collection failure
SKIP_ENV_VALIDATION=1 pnpm test      exit=0   40 files / 148 tests
py -m unittest discover -s edge      exit=0   5 tests
git status --porcelain               empty after every run — no repository mutation
```

Two branch failures, both pre-existing and neither introduced by the reconciliation:

- **Biome.** The sole diagnostic is `.claude/launch.json`, a formatting difference in a file that
  is untracked, absent from every commit (`git log --all -- .claude` is empty), excluded through
  the machine-local `.git/info/exclude`, and present only in this worktree with an mtime of
  `2026-08-07 14:04` — hours before this session. `biome.json` excludes `**/.vscode` but has no
  `**/.claude` entry, and `main`'s worktree has no such file, which is why `main` is green at 211
  files and the branch red at 224. `CLAUDE.md` states that `.claude/` here is untracked and
  nothing in it is normative. Deliberately not touched: deleting a machine-local user file and
  amending root `biome.json` are both outside this reconciliation. Restricted to tracked source
  the branch is Biome-clean.
- **Unit collection.** `apps/server/src/command-repository.test.ts` imports `packages/db` at module
  scope, so `packages/env/src/server.ts` throws without `DATABASE_URL`. This is open question 2 in
  `docs/phase-records/paper-design-phase-closeout.md`, recorded on 2026-08-06 against `6cc6d6a`,
  owned by `phase5-staff-ui`, and unchanged here. Every test that collects passes.

Not run, and not required to prove the branch is correctly based: `pnpm verify:phase --phase
phase5-staff-ui`, `pnpm test:integration`, `pnpm test:browser`, `pnpm verify:full`. The phase
profile is separately known-broken on `main` (Wave 0 carried-forward item 2) and the closeout
repoints it.

## Remaining work or exact blocker

Not a blocker — the Phase 5 closeout slice itself, specified in
[the monitoring-only plan](20260806-155000-p5_staff_monitoring_only-plan.md) as revised by
`608c1f8`. Carried forward unresolved and still owned by that slice:

1. The `phase5-staff-ui` profile in `scripts/verify.mjs` names
   `tests/browser/phase5-staff-ui.browser.spec.ts`, which exists on the branch but not on `main`;
   the plan repoints it. Wave 0 carried-forward item 2.
2. `SPEC.md` still requires the retired staff command UI. Wave 0 carried-forward item 3.
3. The five files in `885b5b0` (`6cc6d6a`) outside `ownedPaths` remain retroactively unauthorized.
   Wave 0 carried-forward item 4.
4. **Decision 6 — `operationalSnapshotSchema.source`.** Deferred by `608c1f8`: the frozen enum is
   untouched by the closeout, `"manual"` is recorded for review in Phase 6, and it is removed only
   once no valid internal producer remains. This reconciliation neither resolves nor reopens it.

## Exact resume command

```sh
cd D:/Projects/fitway-worktrees/phase5-staff-ui-retry
git status --short && git rev-parse HEAD    # expect clean, 608c1f8…
```

Then read `PROJECT_STATE.yaml` on `main` — the worktree's copy is the `M0` snapshot and does not
carry this reconciliation's ledger entry, which is normal for every worktree in this repository.

## Stop/escalation conditions

Unchanged from the activation record, plus: the closeout retires two integrated oRPC mutations and
edits locked `SPEC.md`/`FITWAY_PRODUCT.md`/`PHASES.md` statements under a human product decision
recorded in `docs/phase-records/paper-design-phase-closeout.md` open question 4. Any step beyond
that recorded decision — in particular touching `operationalSnapshotSchema.source`, the edge/OpenAPI
device contract, migrations, or public payloads — is `NEEDS_HUMAN`.
