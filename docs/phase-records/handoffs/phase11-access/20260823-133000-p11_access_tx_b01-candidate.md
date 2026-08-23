# P2 access transport follow-ups — candidate

- Status: **`READY_FOR_INTEGRATION`** pending independent verification.
- Milestone `phase11-access-tx`, run ID `p11_access_tx_b01`.
- Base commit: `aaa646b174d4dbb248eb1a73a6b7273fa40af3e7`. Candidate commit: `ecae31b` (**resubmission**; the first submission was `805f675`).
- Branch `work/phase11-access-tx-b01`, worktree `D:/Projects/fitway-worktrees/phase5-staff-integration`.
- Repair budget: **1 of 2 consumed**.
- `git diff aaa646b..ecae31b` is the whole slice.

## What shipped

Two transport-level defects the Slice A independent verification carried forward as open minor
findings, and named as the best candidate for a small follow-up slice.

**M1.** A duplicate owner email reached the caller as a bare 500. `provisionOwner`'s principal
insert had no collision handling, so the driver error escaped the transport's `AccessRuleError`
test and was rethrown raw. It now goes through `insertOwnerPrincipal`, the same shape the staff path
already used, and refuses with the new `owner_email_taken`.

`isUniqueViolation` gained an optional constraint name. SQLSTATE 23505 alone answers "some unique
index rejected this row", which is only the same question as "that email is taken" while the
statement can collide on exactly one index. The owner insert names
`auth_principals_owner_email_unique`; the staff caller passes no name and is unchanged.

**M3.** `assertStaffPinShape` guards a value the server generates, and no procedure accepts a PIN,
so its refusal can only ever be a generator defect. The transport maps every `AccessRuleError` to
`BAD_REQUEST`, so that defect reached the owner as a 400 telling them they mistyped a value they
never typed. Converted at the seam, which is the only place that knows where the value came from.
The rejected PIN is kept out of both the message and the `cause`.

## Chain of custody

| Commit | Stage |
|---|---|
| `d4974ac` | Activation: ledger milestone, the approved three-slice plan, the slice contract |
| `595de9b` | Stage 1 findings and its route decision — delegated, read-only |
| `7fa0d68` | M1: typed duplicate-email refusal, constraint-scoped classifier, two tests |
| `ca263a8` | M3: generator defect converted out of the caller-error path, three tests |
| `1feeae2` | A refusal count in an M3 comment that M1 had already invalidated |
| `805f675` | First candidate record and gate results — **submitted, and returned escalated** |
| `0b2bd07` | Verification route requalified from current registry evidence |
| `ecae31b` | Repair 1: the access integration file resets its own schema; the guard test labelled |

## Routing

Every implementation and investigation stage had its delegation test evaluated when the stage
opened, from the plan and durable records, before that stage's own target-file discovery — verified
by `scripts/resolve-opencode-worker.mjs`, which returned no lifecycle violations on any of the
three. Records under `docs/phase-records/route-decisions/`.

| Stage | Route | Why |
|---|---|---|
| 1 investigation | **ox-alpha** `opencode/x-preview-f-free`, control `high` | Volume. ~40KB of source read inside the worker, one-page map returned |
| 2 M1 | direct | The deciding evidence is a race observed against a real database, and those credentials are an excluded payload class |
| 3 M3 | direct | Provable without a database, so the pool was genuinely eligible; it lost on handoff cost against a ten-line seam change |

The two 2026-08-21 external-worker authorizations were reconciled as in force and not re-requested.

## Gates

| Gate | Result |
|---|---|
| Repository invariants | PASS — `pnpm check:repository`, 43 milestones |
| Biome / type checks | PASS |
| Unit | PASS — 63 files / 476 tests, up from Slice A's 62 / 473 by this slice's three seam tests |
| Integration | PASS — 18 files / 122 tests, up from Slice A's 18 / 120 by this slice's two access tests |
| Focused access file | PASS — 24/24 across three runs, two of them on freshly created databases (`p11_access_tx_m1a`, `p11_access_tx_m3a`), up from Slice A's 22 |
| Simulator / build | PASS |
| Browser / accessibility | PASS — 83/83 |
| Visual | PASS — no baseline touched; the diff contains zero files under `apps/web/**` or `tests/browser/**` |
| Full ladder | PASS — `p11_access_tx_full3` at the resubmitted candidate `ecae31b`: complete, green on its first invocation, unit 63/476, integration 18 files / 122 tests, browser 83/83, mutation guard clean. The pre-repair candidate `805f675` also passed complete as `p11_access_tx_full2` |
| Independent review | pending |

The full ladder went green first time, so no known-flaky attribution was invoked and none was
needed. That is worth stating rather than passing over: this candidate *could* have claimed
attribution — it touches zero files in any registered entry's surface — and did not have to.
Slice B will not have that option at all.

A first full-ladder run at `ca263a8` (`p11_access_tx_full1`) was **deliberately stopped mid-run**,
not failed. The refusal-count defect in the M3 comment was found while it was in the simulator step,
and certifying a tree already known to be wrong is worse than paying for a restart. It is recorded
here so the log in the capture directory is not mistaken later for a suppressed red run.

## Verification history

**Attempt 1 — ESCALATED.** deepseek-v4-pro at `max` examined `805f675`, passed every
candidate-owned gate, proved all three claims non-vacuous with controls stronger than the
implementer's, and then stopped: `pnpm verify:full` went red twice, in two different places, neither
in code this candidate touches. It correctly refused to attribute either failure and correctly
refused to decide whether pre-existing suite flakiness should block the candidate. Full record:
`docs/phase-records/handoffs/phase11-access/20260823-155000-p11_access_v01-verification-escalation.md`.

One of the two failures was a real latent defect in a file this slice owns and is repaired at
`ecae31b`. The other is outside owned paths, is recorded as a failure observation, and is **not**
attributed and **not** added to the known-flaky register by this session.

**Attempt 2 — pending**, on a fresh verifier at the repaired candidate. The route was requalified
rather than reused: the resolver read the escalation appended to the candidate's evidence record and
fired its own trigger, naming both the outcome entry and the `ESCALATED` gate outcome. It resolved
to the same route and control, because the escalation was environmental rather than a capability
shortfall - the verifier performed above the bar, and re-sizing it would draw the wrong lesson.

## Findings deliberately not repaired

- **M4** — `deactivateOwner` can refuse spuriously. Fails closed, retry succeeds. Widening the lock
  has deadlock implications and needs its own verification.
- **M5** — the `AuthService.loginOwner` race. Pre-existing Phase 4 code in
  `packages/auth/src/auth-service.ts`, outside this slice's owned paths.
- **Rate limiting on the owner access leaves** — an open new decision belonging to nobody yet.
- **`staff_pin_shape` is now unreachable through the transport** and is deliberately kept in
  `AccessRuleCode`. It is still the domain-level invariant, `packages/auth/src/access.test.ts`
  asserts it, and removing a member of a locked refusal surface is not this slice's decision.

## Scope

Five source and test files, plus this slice's records and the ledger. Nothing under `apps/web/**`
or `tests/browser/**`, which is what keeps the known-flaky attribution available to this candidate
and is exactly what Slice B will not be able to claim.

One scope item was surfaced rather than taken silently: `apps/server/src/access-service.test.ts`
did not exist and so was not in `ownedPaths`. M3 is only observable at the generator seam, which no
procedure reaches, so it needed a unit test beside its source. The coordinator extended `ownedPaths`
in the same commit.

## For the independent verifier

Acceptance is one assertion per claim above, exercised through the surface rather than through the
service in isolation, except M3 which no procedure can reach and is therefore asserted at the seam.

Worth checking specifically:

1. That the case-insensitivity test is not passing by accident. `auth_principals_owner_email_unique`
   is a `lower(owner_email)` index; the refusal depends on the pg error carrying `.constraint` with
   the index name, which was not knowable by reading and is the reason that test exists.
2. That the narrowed `isUniqueViolation` did not change the staff path's behaviour.
3. That no rejected PIN value can reach a log through the new `Error` or its `cause`.
4. That the M3 unit test is not vacuous. The negative control is recorded, not assumed: with the
   fix stashed it fails on its own assertion.
