# Batch 04 activation — `phase10-domain` in parallel with the live Phase 5 stream

- Status: `READY`; no worker launched, no feature code, no push, no deploy
- Verified feature baseline: `0f849756cee77d43e9013c9fd5e4e7b5cf36701a` (`main`, clean in a
  dedicated coordinator worktree; carries the integrated Phase 5 monitoring-only closeout `6321949`)
- Coordinator activation commit: `SELF`; it is the only child of that baseline
- Activated: 2026-08-09T12:51:36+03:00; lease expiry 2026-08-16T12:51:36+03:00
- Coordinator context: `D:/Projects/fitway-worktrees/coordinator-main`, a temporary clean worktree on
  `main`, created because `D:/Projects/fitway` is held by the live Phase 5 stream

## Why the recorded baseline moved off `M0`

`docs/phase-records/wave-0-baseline.md` and `docs/phase-records/dependency-parallelization-audit.md`
§15 both name the Wave 0 head `M0` as the baseline for a `phase10-domain` worktree. Both records
predate `6321949` (the Phase 5 monitoring-only closeout merge) and `0f84975`. `docs/WORKFLOW.md`
requires a new worktree to start from the recorded baseline as it stands now, and the audit's own
rule for later waves is "the `main` head after the preceding wave integrates". Current Git and
`PROJECT_STATE.yaml` authority therefore supersede the `M0` recommendation. Basing on `M0` would
have re-opened the closed Phase 5 closeout inside a Phase 10 worktree.

## Why Phase 10 is safe to run in parallel with Phase 5

| Check | Evidence |
| --- | --- |
| Ledger dependency | `phase-9` is `DONE` at `439b1b3`; it is `phase10-domain`'s only dependency |
| Dependency type | AUTHORITY/COORDINATION, not CONTRACT — audit §4; the code Phase 10 consumes is already on `main` |
| Shared owned paths with Phase 5 | none — Phase 5 owns three `apps/web/src/components/staff` files and two browser specs; Phase 10 owns new API reporting modules, one server repository, one integration test |
| Shared integration spine | none — `packages/api/src/routers/**`, `context.ts`, `apps/server/src/index.ts`, `packages/db/**`, `scripts/verify.mjs` are all in Phase 10's `forbiddenPaths` |
| Verification interference | none — Phase 10 has no browser, accessibility, or visual gate, so it never contends for a Playwright port, a canonical screenshot, or the `/staff` surface |
| Uniqueness invariants | branch, worktree, run ID, and disposable database are all distinct from every active milestone |

Phase 10 is parallel-safe **only while it stays additive and unexposed**, which is the same condition
`phase9-analytics-domain` ran under and which audit §6 Group B makes explicit. The moment it needs a
router leaf it becomes serialized behind Phase 5.

## Slice scope

| Slice | State | Branch / worktree | Contract |
| --- | --- | --- | --- |
| `phase10-domain` | `READY`, unlaunched | `work/phase10-domain-b01` / `D:/Projects/fitway-worktrees/phase10-domain` | `PHASES.md` Phase 10, `SPEC.md` analytics semantics, and its activation handoff |
| `phase10-ui-csv` | `PLANNED`, not activated | none | blocked on `phase10-domain` **and** on the unanswered ADR-007 Paper-family question |
| `phase11-shell` | `PLANNED`, not activated | none | deliberately held; shares `StaffShell` and the i18n catalogs with Phase 5 |

No Phase 6, 7, 8-integration, 11, or 12 slice is activated. `phase-10` remains coordinator-owned.

## Resources and verification profile

| Slice | Run ID | Port (reserved) | Disposable database | Run-owned output |
| --- | --- | ---: | --- | --- |
| `phase10-domain` | `p10_domain_b01` | 20657 | `fitway_integration_p10_domain_b01` | `D:/Projects/fitway-worktrees/phase10-domain/output/playwright/p10_domain_b01` |

The `phase10-domain` profile was registered on `main` during Wave 0 (`ffa26ba`) and is unchanged
here: `browserFiles: []`, `integrationFiles: ["apps/server/src/phase10-domain.integration.test.ts"]`.
That path is in `ownedPaths`; the worker creates the file, as every other slice does.
`scripts/verify.mjs` stays coordinator-owned and forbidden to the worker. Port 20657 is reserved for
uniqueness only — this slice has no browser gate. Canonical screenshots stay read-only.

## Leases

None granted. `phase10-domain` holds no shared lease, and no lane on the router, the context, the
server index, the OpenAPI document, the environment schema, or the migration journal is transferred
by this commit. Any Phase 10 exposure wiring and any Phase 10 migration are later coordinator acts,
recorded separately, after Phase 5 integrates.

## Interaction with the live Phase 5 stream

`D:/Projects/fitway` is on `work/phase5-staff-paper-fidelity` at `45fc45f` with uncommitted Phase 5
work, including a coordinator-authored `PROJECT_STATE.yaml` edit that moves `phase5-staff-ui` to
`IN_PROGRESS` with a lease through 2026-08-16T03:01:28+03:00. That edit is not committed, so it is
not in this activation's parent, and this activation does not carry it.

This commit therefore touches **only** the `phase10-domain` milestone block and `updatedAt`. It
leaves the `phase5-staff-ui` block exactly as `main` already had it. The two edits sit ~400 lines
apart in `PROJECT_STATE.yaml`; when the Phase 5 stream commits and integrates, the only overlapping
line is `updatedAt`. Reconciling that is ordinary coordinator integration work.

Nothing in `D:/Projects/fitway` was read into, written from, stashed, committed, reset, cleaned, or
otherwise altered by this activation, and no branch there was switched.

## Activation invariant

This commit contains only coordinator state, the launch contract, and the phase record. It contains
no implementation, no schema change, no migration, no profile change, and no speculative dependency
edit. The `work/phase10-domain-b01` worktree must be clean and point exactly here, and its parent
must be `0f84975`.

## Rollback boundary

`0f849756cee77d43e9013c9fd5e4e7b5cf36701a`. This activation is a single revertible commit touching
`PROJECT_STATE.yaml` and two new Markdown files. Reverting it returns `phase10-domain` to `PLANNED`
and leaves every other stream untouched.
