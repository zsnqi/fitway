# P2 — access transport follow-ups: integrated and DONE

- Status: **`DONE`**. Milestone `phase11-access-tx` integrated into `main`.
- Integrated commit: `6299a7568f8dfd30813f54e85a4ececdf22efee3`, reached by fast-forward — `main`
  had not moved from `aaa646b` and no other branch touched the shared spine.
- Base: `aaa646b174d4dbb248eb1a73a6b7273fa40af3e7`. Branch `work/phase11-access-tx-b01`.
- Repair budget: **1 of 2 consumed**.
- **P1 has not started and was not started here. Slice B has not started.**

## What shipped

Two transport-level defects the Slice A independent verification carried forward as open minor
findings and named as the best candidate for exactly this slice.

**M1.** A duplicate owner email reached the caller as a bare 500. `provisionOwner`'s principal
insert had no collision handling, so the driver error escaped the transport's `AccessRuleError` test
and was rethrown raw. It now goes through `insertOwnerPrincipal` — the shape the staff path already
used — and refuses with the new `owner_email_taken`. `isUniqueViolation` gained an optional
constraint name so the owner insert names the index it means.

**M3.** `assertStaffPinShape` guards a value the server generates, and no procedure accepts a PIN,
so its refusal can only be a generator defect. The transport maps every `AccessRuleError` to
`BAD_REQUEST`, so that defect reached the owner as a 400 about a value they never typed. Converted
at the seam, with the rejected PIN kept out of both message and `cause`.

**A latent test defect found by verification.** `phase11-access.integration.test.ts` was the only
integration file that migrated without first resetting its schema, and inside a full run it could
fail its `beforeAll` with SQLSTATE 42710. It now resets its own schema like its seventeen siblings.

## Chain of custody

| Commit | Stage |
|---|---|
| `d4974ac` | Activation: ledger milestone, the approved three-slice plan, the slice contract |
| `595de9b` | Stage 1 findings and route decision — delegated, read-only, ox-alpha |
| `7fa0d68` | M1 |
| `ca263a8` | M3 |
| `1feeae2` | A refusal count an earlier stage had invalidated |
| `805f675` | First candidate record — **submitted, returned escalated** |
| `0b2bd07` | Verification route requalified from current registry evidence |
| `ecae31b` | Repair 1: the schema reset, and the guard test labelled |
| `6299a75` | Resubmission record — **the verified candidate** |

`git diff aaa646b..6299a75` is the whole slice.

## Scope of the PASS

The verifier's `PASS` attaches to `6299a75`. Commits after it in this slice contain records and
coordinator-owned ledger state only, and no executable code; a later commit touching executable code
in the access paths inherits nothing from that verdict.

## Gates

| Gate | Result |
|---|---|
| Unit | PASS — 63 files / 476 tests |
| Integration | PASS — 18 files / 122 tests; the access file 24/24 across five runs on four separately created databases |
| Browser / accessibility | PASS — 83/83, reproduced independently by the verifier |
| Visual | NOT_REQUIRED — zero files under `apps/web/**` or `tests/browser/**` |
| Full ladder | PASS at `6299a75`, complete, green on first invocation, mutation guard clean |
| Freeze | PASS — six checks, exit 0, zero failing lines, run after every durable record was committed |
| Independent review | **PASS**, no findings |

## Routing, and what it cost

Every implementation and investigation stage had its delegation test evaluated when the stage
opened, before that stage's own target-file discovery, verified by
`scripts/resolve-opencode-worker.mjs` with no lifecycle violations on any stage.

| Stage | Route | Why |
|---|---|---|
| 1 investigation | ox-alpha `opencode/x-preview-f-free` / `high` | Volume |
| 2 M1 | direct | Deciding evidence needs real database credentials, an excluded payload class |
| 3 M3 | direct | Provable without a database, so the pool was eligible; lost on handoff cost |
| 5 verification ×2 | deepseek-v4-pro `opencode-go/deepseek-v4-pro` / `max` | Independence; only candidate surviving the hard filters |

The verification route was **requalified twice, never reused**. The first requalification rejected a
prior native decision whose premise — that no external candidate could run the ladder — had been
overtaken by recorded probes. The second fired on its own: the resolver read the escalation appended
to the candidate's evidence record and refused a decision that was hours old against an unchanged
registry. Both are the reuse rules working in the direction that costs something.

## What verification actually bought

Three things the implementer had not done, all of which changed the candidate or the record:

1. **A real defect.** The schema-reset issue was latent, in an owned file, and would have kept
   producing unexplained red ladders for later slices.
2. **Stronger non-vacuity than the implementer's.** Reverting each change and observing the specific
   failure, including breaking the *pre-existing* staff race deliberately.
3. **An honest non-proof.** It declined to claim non-vacuity for the classifier narrowing, and
   explained that the narrowing is not behaviour-visible on the current schema so no discriminating
   test can exist. That is correct, and it matches what the narrowing is for — defence against a
   future unique index, not a fix for present behaviour.

The gate also caught the coordinator being wrong. The central finding was nearly dismissed because a
grep for `drop schema public cascade` returned nothing; the actual pattern is
`drop schema if exists public cascade`. Recorded in the escalation note.

## Carried forward, deliberately unrepaired

- **M4** — `deactivateOwner` can refuse spuriously. Fails closed; widening the lock has deadlock
  implications and needs its own verification.
- **M5** — the `AuthService.loginOwner` race, pre-existing Phase 4 code outside these owned paths.
- **Rate limiting on the owner access leaves** — an open new decision belonging to nobody yet.
- **`staff_pin_shape` is now unreachable through the transport**, deliberately. It remains the
  domain invariant with its own unit test; removing a member of a locked refusal surface is not this
  slice's decision, and the verifier agreed it is intended and safe.
- **`apps/server/src/phase2.integration.test.ts:779`** — a Playwright timeout observed once by the
  attempt-1 verifier, outside owned paths. Recorded as a failure observation at
  `docs/phase-records/verification/20260823-p11_access_v01-phase2-integration-timeout.json` and
  **not** added to the known-flaky register by the session that repaired this candidate.

## Next

**P1, the browser load-sensitivity debt slice**, per the approved sequence. Before it activates, its
scope needs one reconsideration that this slice produced: P1 was written for three assertions in
`tests/browser/**`, and the failure observation above is a fourth load-sensitive location living in
an integration file. Whether P1 widens to cover it, or it takes its own entry, is a coordinator
decision at P1 activation.

Slice B remains third and unstarted. Its blocker is unchanged: every register entry's surface
includes `apps/web/**` and `tests/browser/**`, which is Slice B in its entirety.

No human decision is outstanding.
