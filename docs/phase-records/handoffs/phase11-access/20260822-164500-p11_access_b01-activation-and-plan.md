# Phase 11 access b01 — activation and slice plan (Slice A: domain and transport)

## Why this can start now

`docs/phase-records/handoffs/phase11-access/20260811-154032-p11_access-authority-resolved-capacity-blocked.md`
recorded `BLOCKED` with four named unblock conditions. All four are now satisfied, checked against
the repository rather than assumed:

1. `phase11-shell` integrated — `PROJECT_STATE.yaml`, `DONE` at `1a4dea5`-lineage integration.
2. `phase11-audit` integrated and the shared Owner lane released — `DONE`; the lane holder
   `phase11-audit-generalization` reached `DONE` at `8fef4ec` and released its lease.
3. An independently reviewed, backward-compatible coordinator-owned audit migration and contract —
   migration `0007_phase11_audit_generalization.sql` plus `packages/api/src/audit/governance.ts`,
   integrated and PASSed by a fresh verifier on 2026-08-22.
4. Working isolated-worker toolchain capacity — the full ladder, disposable Postgres, and Playwright
   all ran to completion in this worktree during the S4 close.

The human/product/security ambiguity was resolved on 2026-08-11 and those decisions are locked. No
new human decision is required to begin. Activation is coordinator work.

## Why this is two slices, not one

`phase11-access` as defined in `PHASES.md` spans a credential domain, a transport, an owner
management surface, bilingual copy, and canonical baselines. That is not one rollback boundary. It
splits along the same seam the repository already uses for `phase9-analytics-domain` /
`phase9-owner-ui` and `phase11-audit` / `phase11-audit-generalization`:

- **Slice A (this one, `p11_access_b01`) — domain and transport.** The access operations, their
  atomicity and audit coupling, session invalidation, and the owner-only procedures. Verifiable
  end-to-end at the transport level with no UI.
- **Slice B (later, `p11_access_ui_b01`) — owner access surface.** The management UI, its bilingual
  copy, its states, its accessibility pass, and its canonical baselines.

Slice B does not start until Slice A is `DONE`. One writer at a time.

## Locked decisions this slice implements

From the 2026-08-11 human authority record, verbatim in substance:

- An owner may not deactivate their own account.
- The last active owner may not be deactivated.
- Deactivation targets the principal and invalidates its credentials and active sessions.
- Reactivation is an explicit separate owner action.
- Hard deletion is out of scope for V1.
- Staff PINs are system-generated.
- A staff PIN is revealed once at provisioning or rotation and is not delivered by email.
- An authorized owner password reset sets a new credential in-app; no email-based reset flow in V1.
- The seven audit actions are locked and already typed in `packages/api/src/audit/types.ts`.
- Audit prior/new state carries only non-secret state. A reason is required only for the two
  destructive actions.

From `SPEC.md`: a staff PIN is 6-12 Western digits; the server stores only a memory-hard hash with a
per-credential salt and a server-held pepper; the raw PIN is never stored; sessions issued against
an obsolete credential version are rejected on their next request; owner-only procedures return
canonical 401/403.

### One consequence worth naming before it is built

"Revealed once at provisioning or rotation" means the generated PIN is present in the response body
of two owner-only procedures. That is inherent to the locked decision, not a drift from it, and it
is the only place raw PIN material exists after generation. The plan therefore fixes three
structural properties rather than promising care: the PIN is generated server-side and never
accepted as input; it is returned by exactly the two procedures the decision names and by no read
path; and it cannot reach an audit row, because `buildAccessAuditEntry` takes principal snapshots
and has no field that could carry it.

## Objective, in observable terms

An authenticated owner can, over the existing owner-only transport:

- provision the shared staff PIN credential when none is active, receiving the generated PIN once;
- rotate the shared staff PIN, receiving the new PIN once and advancing the credential version;
- deactivate the shared staff PIN with a required reason;
- provision a real owner principal;
- deactivate another owner with a required reason, but never themselves and never the last active
  owner;
- reactivate a deactivated owner;
- reset an owner credential in-app, advancing that credential version;
- read the list of principals and their non-secret governance state.

Every mutation is atomic with its audit row, invalidates the sessions the decision says it should,
and is rejected with the canonical status for anonymous and staff callers.

## Scope

In scope, and the owned paths for this slice:

- `packages/auth/src/repository.ts` — extend `AuthRepository` with the access operations.
- `packages/auth/src/crypto.ts` — system PIN generation beside the existing salt/hash helpers.
- `packages/auth/src/access.ts` and `packages/auth/src/access.test.ts` — new: the invariants that do
  not need a database (self-deactivation, last-active-owner, PIN shape, reason requirement).
- `packages/api/src/access/**` — new: input/output schemas and the service that composes validation,
  mutation, and the audit row.
- `apps/server/src/access-repository.ts` and `apps/server/src/access-repository.test.ts` — new: the
  transactional writes and session invalidation.
- `apps/server/src/auth/postgres-auth-repository.ts` — implement the new repository methods.
- `apps/server/src/phase11-access.integration.test.ts` — new.
- `packages/api/src/routers/index.ts` — the `admin.access.*` leaves. **Shared router aggregation,
  under coordinator lease; see below.**
- `apps/server/src/index.ts` — context wiring for the new procedures, if required. **Shared, under
  the same lease.**
- `docs/phase-records/handoffs/phase11-access/*-p11_access_b01-*.md`

Explicitly out of scope:

- Every UI file, `apps/web/**`, `apps/web/src/i18n/**`, `tests/browser/**`, and every canonical
  screenshot. Those are Slice B.
- `packages/db/**`. The schema already carries everything this slice needs: `auth_principals.active`,
  `auth_staff_credentials.credential_version` and `.active`, `auth_owner_credentials` likewise, and
  `auth_sessions.credential_version`. **If this slice turns out to need a migration, that is a stop
  condition, not a decision to make inside it** — migration ordering is coordinator-owned and would
  change the shape of the slice.
- `packages/api/src/audit/**`. The governance contract is integrated and independently verified;
  this slice calls it and does not modify it.
- The Phase 5 command/audit append semantics, the frozen device contract, `scripts/verify.mjs`,
  `scripts/verify-repository.mjs`, and every other milestone's records.
- The seven approved action labels, the secret-free audit rule, and the owner lifecycle decisions:
  human-locked, implemented as written, not reinterpreted.

### Shared-file lease

`packages/api/src/routers/index.ts` is shared router aggregation and `apps/server/src/index.ts` is
shared wiring. `AGENTS.md` requires an explicit lease for both. The coordinator holds the write for
this slice and is the only writer, so the lease is granted to `p11_access_b01` and recorded in
`PROJECT_STATE.yaml`. It covers additive `admin.access.*` leaves and their context wiring only. It
does not authorize touching the staff leaves, the analytics leaves, the audit leaf, or the health
leaf.

## Stages and rollback boundaries

Each stage is one commit, independently revertible, leaving the tree building and green.

- **A — activation.** This record plus the ledger transition. Revert: the activation commit.
- **B — pure invariants.** `packages/auth/src/access.ts` with its unit tests: PIN shape, PIN
  generation, self-deactivation, last-active-owner, reason requirement. No database, no transport.
  Revert: additive only, nothing depends on it yet.
- **C — repository surface.** The `AuthRepository` extension and its Postgres implementation, with
  transactional access writes and session invalidation. Revert: additive; the existing auth paths
  are untouched.
- **D — service and schemas.** `packages/api/src/access/**` composing validation, mutation, and the
  audit row in one transaction. Revert: additive.
- **E — transport.** The `admin.access.*` leaves under the lease, plus context wiring. This is the
  first stage that changes a shared file; it is deliberately last and deliberately small.
  Revert: removes the leaves; every earlier stage still stands and still passes.
- **F — integration test.** `apps/server/src/phase11-access.integration.test.ts` against a
  disposable database: atomicity, audit coupling, session invalidation, 401/403, and each locked
  invariant exercised through the transport.

If any stage reveals that the schema cannot express a locked decision, stop at that stage, record
it, and do not improvise a migration.

## Verification, fixed before the work starts

- `pnpm verify:fast` after each stage that adds code.
- `pnpm exec vitest run` on the new unit test files during stages B-D.
- `pnpm verify:full` on the candidate, with a unique `FITWAY_RUN_ID` and its own disposable database
  named for that run.
- `pnpm check:repository` and the freeze checks over the full candidate range, run after every
  durable record for this slice is written.
- A registered focused profile is **not** added: `scripts/verify.mjs` is coordinator-owned and
  changing it is out of scope for this slice, so the integration file is verified under
  `verify:full`. This repeats a known gap rather than creating one; it is recorded, not hidden.
- Fresh independent verification by a session that did not produce the candidate.

Acceptance is measured against the locked decisions above, one assertion per decision, each
exercised through the transport rather than through the service in isolation.

## Risks and unknowns

- **Session invalidation semantics.** `auth_sessions.credential_version` already exists and
  `AuthService.authenticate` rejects obsolete versions. Whether deactivation should additionally set
  `revoked_at` on live rows, or rely on the version check plus the principal `active` check, is an
  implementation question this slice must answer with a test, not with a preference. Both paths are
  inside the locked decision; the test states which one holds.
- **The shared staff principal is singular.** `auth_principals_one_shared_staff` enforces one. So
  "provision the staff PIN" is a credential operation on an existing principal, not a principal
  creation, and the audit `targetPrincipalId` is that shared principal. Confirm against the schema
  before writing the service.
- **Owner provisioning already exists** as `AuthService.provisionOwner`. This slice must reuse it
  rather than add a second path, and must add the audit row the existing path lacks.
- **Last-active-owner is a race.** The check and the mutation must be in one transaction with the
  appropriate row locking, or two concurrent deactivations can both pass their check. The
  integration test must exercise the concurrent case, not only the sequential one.

## Open decisions

None blocking. Every product and security question this slice touches was settled on 2026-08-11 and
is quoted above. If one turns out to be underspecified in a way that changes behaviour, that is
`NEEDS_HUMAN` at the point it is discovered, and the rest of the slice still ships.
