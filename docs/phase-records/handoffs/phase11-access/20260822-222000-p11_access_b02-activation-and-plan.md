# Phase 11 access Slice A b02 — activation, state reconciliation, and repair plan

- Status: activation. `phase11-access-b02` opens `IN_PROGRESS` with a fresh repair budget of 2.
- Base commit: `6071e1b6489cf2a477e766dbc95743791092e0fd` — the integrated S4 frontier and the
  current `main`. Not b01's tip.
- Branch / worktree / run ID: `work/phase11-access-b02` /
  `D:/Projects/fitway-worktrees/phase5-staff-integration` / `p11_access_b02`.
- Predecessor: `phase11-access` remains terminal `FAILED_VALIDATION` and is preserved untouched.

## State reconciliation performed before activation

Checked against the repository, not against the ledger's description of it:

1. **Stale attempt ownership.** The coordinator worktree was parked on `work/phase11-access-b01`
   at `623e4c3`, which is the b01 closure commit. b01 is terminal, so the worktree was moved to a
   new branch cut from `main` at `6071e1b`. `work/phase11-access-b01` still points at `623e4c3`
   and its candidate `8e77536bebcda08f401d0c3d4db296bab8cf3286` is reachable from it. Nothing on
   that branch is rewritten, and no b02 commit lands on it.
2. **Stale leases.** `phase11-access` held two shared leases granted to `p11_access_b01`, both
   nominally live through 2026-08-23T16:45:00+03:00 — the `admin.access.*` router leaves plus
   `apps/server/src/index.ts` wiring, and the additive `packages/api/src/context.ts` members. The
   attempt they were granted to is terminal, so they are released from that entry and re-granted
   to `p11_access_b02` with the same boundaries and a new expiry. What b01 held is preserved in
   `docs/phase-records/handoffs/phase11-access/20260822-173000-p11_access_b01-failed-validation.md`
   and in the b01 activation record.
3. **Frontier.** `main` is `6071e1b`; `phase11-audit-generalization` is `DONE` at `8fef4ec`; the
   top-level baseline still matches `baseline-reconciliation-gate`. No b01 work was integrated.
4. **Worktree readiness.** `pnpm exec vitest --version` prints `vitest/4.1.10` from the worktree
   root and `apps/server/.env` is present, so the `docs/WORKFLOW.md` step 7 and step 8 gates are
   already satisfied here. This worktree ran the full ladder during the S4 close.
5. **Workflow-adoption record.** The active `agent-project-workflow` requires each stage's route
   decision to be a machine-readable record a later stage can read, not prose. FITWAY had no
   designated location for one. `docs/phase-records/route-decisions/` is designated in this
   activation, with `README.md` stating the rules, and this stage's decision is recorded at
   `docs/phase-records/route-decisions/p11_access_b02-implementation.json`.
6. **Durable authorizations already in force.** The two 2026-08-21 external-worker authorizations
   named in `docs/WORKFLOW.md` remain in force and were not re-requested. They are recorded as
   relied upon in the route record even though this stage selected direct execution, because the
   comparison would have been opened under them had a trigger applied.

## Routing

This stage runs **directly under the coordinator**, and the reason is recorded rather than
implied: no delegation trigger applies. The repair list is fixed in advance, the file set is
named, and the inspection is already complete — briefing a worker would cost more than the edits.
The full comparison and what was filtered is in the route record.

The **independent-verification** stage is a different decision. It qualifies on Independence and
`docs/WORKFLOW.md` requires a session that did not produce the candidate. Its route is chosen and
recorded when that stage opens, not pre-committed here.

## No new human decision is required

The b01 terminal record states this and the repository agrees. Every rule b02 must satisfy is
already locked from 2026-08-11 and the verifier marked all eleven HELD on the b01 candidate. The
rejection was on concurrency defects the locked-decision checklist does not cover. Two points in
the repair list could be mistaken for new decisions and are not:

- **Refusing `resetOwnerCredential` on a deactivated principal** is not a new rule. The locked
  decision says deactivation "targets the principal and invalidates its credentials", and
  reactivation "is an explicit separate owner action". A reset that sets the credential row back
  to active on a deactivated owner half-undoes a deactivation with no `owner_reactivated` row.
  Refusing is the reading that holds both locked decisions; allowing it is the reading that breaks
  one. This is a defect against a locked decision, not a choice between two lawful designs.
- **New refusal codes** are additive to an output contract no surface consumes yet. Slice B maps
  codes to copy and has not started. The seven audit action labels are untouched.

If any repair turns out to need a schema change, that remains a stop condition, exactly as in b01.

## Inherited candidate: one-time, path-scoped carry-forward

b02 does **not** rewrite Slice A. The b01 verifier found the substance sound — all eleven locked
decisions HELD, no secret material reachable, atomicity proved by trigger, canonical 401/403 on
all eight leaves, no Phase 4 guarantee weakened, `packages/db/**` and `packages/api/src/audit/**`
untouched. Discarding that to retype it would destroy verified evidence and buy nothing.

The coordinator therefore authorizes **one** carry-forward commit on `work/phase11-access-b02`,
scoped to paths rather than to a merge:

- Carried, from `8e77536bebcda08f401d0c3d4db296bab8cf3286`: the twelve implementation files —
  `packages/auth/src/access.ts`, `packages/auth/src/access.test.ts`, `packages/auth/src/index.ts`,
  `packages/api/src/access/contracts.ts`, `packages/api/src/access/procedures.ts`,
  `packages/api/src/context.ts`, `packages/api/src/routers/index.ts`,
  `apps/server/src/access-repository.ts`, `apps/server/src/access-service.ts`,
  `apps/server/src/index.ts`, `apps/server/src/phase11-access.integration.test.ts`, and
  `apps/server/src/auth/runtime.ts`.
- **Not** carried: `PROJECT_STATE.yaml` and both b01 handoffs. b01's ledger state and records stay
  on b01's branch, where they are the terminal record of that attempt. b02 writes its own.

The carry is its own commit so it is independently revertible, and every repair lands on top of it
as a reviewable diff. This mirrors the coordinator-authorized carry already used for
`phase10-ui-csv` b04 into b05.

## The repair list, and why each item is here

Every item is a confirmed b01 finding. Numbering follows the b01 terminal record's successor list.

1. **Lock the rows each mutation reasons about.** `deactivateOwner` locks via
   `countActiveOwnersForUpdate`; the other five read through `readStaffState` or `readOwnerState`
   with no lock and then write a value derived from what they read. Under READ COMMITTED two
   concurrent transactions read the same version and write the same successor. Fix: take a
   `for update` lock on the target principal row before the state read, in `provisionStaffPin`,
   `rotateStaffPin`, `deactivateStaffPin`, `reactivateOwner`, and `resetOwnerCredential`, and add
   the target lock to `deactivateOwner` after its existing count lock. The lock is taken on the
   principal row and not on the join, because `for update` is illegal on the nullable side of an
   outer join and the credential is reached through a left join.
   - Consequence for `provisionStaffPin` when the shared staff principal does not exist yet: there
     is no row to lock, so mutual exclusion falls to `auth_principals_one_shared_staff`. That
     currently surfaces as an untyped 500 (b01 finding 5). It is mapped to the domain refusal
     instead, which is the same refusal the locked path already gives.
2. **Correct the `appendGovernanceRow` comment.** It claims a caller "cannot describe a transition
   that did not happen". True against a malicious caller, false against a concurrent one before
   item 1. After item 1 the claim holds, and the comment must say why — the lock, not the
   server-side snapshot alone, is what makes it true.
3. **Refuse `resetOwnerCredential` on an inactive principal**, per the reasoning above.
4. **Give the three state refusals their own codes.** `staff_pin_shape` currently covers "an
   active staff PIN already exists", "there is no active staff PIN to rotate", and the same for
   deactivate. None is a shape problem.
5. **Call `assertStaffPinShape` on the generated PIN before it is hashed.** b01's candidate record
   claims the 6-12 Western digits rule lives in `isStaffPinShape`; in fact nothing in the access
   path calls it and the shape holds only because `createStaffPin` emits eight digits. Calling it
   at the one seam where a PIN becomes credential material makes the claim true.
6. **Extend the integration test to the concurrent case for every mutation.** The sequential suite
   passed 16/16 six times and caught none of this. Each new assertion must be able to fail: the
   concurrency tests are run against the unrepaired carry first.

Explicitly **not** in this slice: rate limiting on the owner access leaves (a new decision, named
as such in the b01 record), and the load-sensitive browser step of `pnpm verify:full`, which is
repository debt outside these owned paths.

## Stages and rollback boundaries

Each stage is one commit, independently revertible.

- **A — activation.** This record, the route record and its README, and the ledger transition.
- **B — carry-forward.** The twelve files at `8e77536`, unmodified. Green as it stood.
- **C — invariants and codes.** `packages/auth/src/access.ts` and its unit test: the new refusal
  codes (item 4). Additive.
- **D — locking and refusals.** `apps/server/src/access-repository.ts`: items 1, 2, 3, and the
  refusal-code sites. The core of the repair.
- **E — PIN shape at the seam.** `apps/server/src/access-service.ts`: item 5.
- **F — concurrency tests.** `apps/server/src/phase11-access.integration.test.ts`: item 6.

Stage F is written to fail against stage B and pass against stages C-E; that negative control is
the evidence the tests are real, and it is recorded rather than asserted.

## Verification, fixed before the work starts

- `pnpm verify:fast` after each code stage.
- `pnpm exec vitest run` on the focused unit files during stages C-E.
- The access integration file against a disposable database named for `p11_access_b02`, run
  repeatedly, both before and after the repair, so the concurrency assertions are shown to fail on
  the unrepaired carry.
- `pnpm verify:full` on the candidate with a unique `FITWAY_RUN_ID`.
- `pnpm check:repository` and the whitespace/scope checks over the full candidate range, run
  **after** every durable record for this slice is written.
- Fresh independent verification by a session that did not produce the candidate. Its route is a
  separate recorded decision.

The browser, accessibility, and visual gates stay `NOT_REQUIRED`: this slice has no UI. That is
unchanged from b01 and remains true — the diff touches no `apps/web/**` and no `tests/browser/**`.

## Stop conditions

- A repair that cannot be made without a schema change.
- A third recurrence of the same red gate after two focused repair attempts — `FAILED_VALIDATION`.
- Any locked decision that turns out to be underspecified in a way that changes behaviour —
  `NEEDS_HUMAN` at the point of discovery, with the rest of the slice still shipping.
- Slice B does not start. Not in this session, not on this candidate.
