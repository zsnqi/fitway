# P2 — access transport follow-ups: activation

- Status: **`IN_PROGRESS`**, milestone `phase11-access-tx`, run ID `p11_access_tx_b01`.
- Base commit: `aaa646b174d4dbb248eb1a73a6b7273fa40af3e7` (`main` frontier; Slice A integrated at
  `8ff55f9`, the two commits above it are records only).
- Branch: `work/phase11-access-tx-b01`. Worktree:
  `D:/Projects/fitway-worktrees/phase5-staff-integration`. `baseCommit: SELF` is **not** used: the
  branch starts at `aaa646b` and this activation commit is its first commit.
- Approved plan governing this slice and its two successors:
  `docs/phase-records/handoffs/coordinator/20260823-124724-p11-access-successor-sequence-plan.md`.

## Why the plan document lives under `coordinator/`

The approved plan covers three milestones — P2 (`phase11-access-tx`), P1
(`browser-load-sensitivity-debt`), and Slice B (`phase11-access-ui`). It is a multi-slice execution
plan, so it takes the location the repository already uses for those, beside
`20260816-224000-completion-preflight-and-remaining-execution-plan.md`, rather than the
single-slice location the plan text named for itself. Each slice's activation record points at it.
Recorded here rather than done silently.

## Objective

1. **M1.** `owner/provision` returns a typed refusal for a duplicate owner email instead of a bare
   500 on `auth_principals_owner_email_unique`, with a concurrency test in the same shape as the
   staff-path collision `insertSharedStaffPrincipal` already closes.
2. **M3.** `assertStaffPinShape` no longer maps a server-side generator defect to a caller-facing
   400.

Both were carried forward as open minor findings by the Slice A independent verification and named
there as the best candidate for a small follow-up slice.

## Scope

Owned paths, as recorded in the ledger:

- `packages/api/src/access/**`
- `packages/auth/src/access.ts`, `packages/auth/src/access.test.ts`
- `apps/server/src/access-repository.ts`, `apps/server/src/access-service.ts`
- `apps/server/src/phase11-access.integration.test.ts`
- this slice's handoffs, and the append-only route-decision and verification record directories

No shared lease is opened. `phase11-access-b02` is `DONE` and released its two leases on
integration, and nothing in this slice's objective reaches shared router aggregation or server
wiring: `admin.access` is already mounted at `packages/api/src/routers/index.ts:135`. If M1 turns
out to require a router or wiring change, that is a lease request to the coordinator, not a decision
inside a stage.

Out of scope and forbidden: `apps/web/**` and `tests/browser/**` in their entirety (Slice B);
`packages/db/**` — a migration need is a stop condition; `packages/api/src/audit/**`;
`packages/api/src/commands/**` and the frozen Phase 5 append semantics; the seven approved action
labels, the secret-free audit rule, and the owner lifecycle decisions, which are human-locked.

Named and deliberately not repaired here:

- **M4** — `deactivateOwner` can refuse spuriously. Fails closed; widening the lock has deadlock
  implications and needs its own verification.
- **M5** — the `AuthService.loginOwner` race, pre-existing Phase 4 code in
  `packages/auth/src/auth-service.ts`, outside these owned paths. Must not be repaired
  opportunistically.
- **Rate limiting on the owner access leaves** — an open new decision belonging to nobody yet.

## Stages, and the routing boundary

| # | Stage | Rollback boundary | Route |
|---|---|---|---|
| 0 | Activation — this record, the plan record, the ledger transition | this commit | Coordinator by authority |
| 1 | Refusal-surface investigation, read-only | nothing to revert | **Open** |
| 2 | M1 — typed duplicate-email refusal plus its concurrency test | one commit | **Open** |
| 3 | M3 — generator defect no longer surfaces as a caller 400 | one commit | **Open** |
| 4 | Freeze | n/a | Whoever held the last writing stage; submission is coordinator |
| 5 | Independent verification | n/a, read-only | **Open**, qualifies on Independence |
| 6 | Integration and `DONE` | the integration commit | Coordinator by authority |

Stages 1-3 and 5 have **no route assigned by this record**. For each, the delegation test is
evaluated when the stage opens, from the plan and the durable records, **before** that stage's own
target-file reading or repair-list derivation is performed by anyone including the coordinator, and
`docs/phase-records/route-decisions/p11_access_tx_b01-<stage>.json` is written before the stage is
assigned or any write lease for it is opened. The qualified OpenCode pool competes normally under
the two durable 2026-08-21 authorizations, which are reconciled as in force and not re-requested.

No stage-specific target-file discovery has been performed for this slice. The activation
deliberately stops short of it so the stage-1 route comparison is decided on the stage's merits
rather than on context the coordinator consumed out of order.

## Verification, fixed before the work starts

- `set -a; . ./.env; set +a` from the worktree root first — `pnpm verify:fast` otherwise fails on
  `CRON_SECRET must be supplied to the cron test process`.
- `pnpm exec vitest run` on the touched unit test files during stages 2-3.
- `pnpm verify:fast` after each stage that adds code.
- `apps/server/src/phase11-access.integration.test.ts` on a disposable database with a unique
  `FITWAY_RUN_ID`, including the new concurrency case.
- `pnpm verify:full` on the candidate.
- `pnpm check:repository` and `scripts/candidate-freeze-check.mjs` over the full candidate range,
  run last, after every durable record this slice produces is written.
- Fresh independent verification by a session that did not produce the candidate.

A red browser step inside `verify:full` may still be attributed against
`docs/phase-records/verification/known-flaky-register.json` for this slice: its candidate touches
zero files under `apps/web/**` or `tests/browser/**`, so it does not lose the attribution the way
Slice B would. Attribution still runs through `scripts/flaky-attribution-check.mjs`, which refuses
by default, and an attributed run is still recorded as a run that went red.

## Stop conditions

- A migration or schema change turns out to be required.
- The refusal set cannot express M1 without changing a locked decision or an audit contract.
- The same gate is red after two focused repair attempts.
