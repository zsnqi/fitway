# Phase 11 access — human authority resolved, activation blocked

- Recorded: 2026-08-11 15:40:32 +03:00
- Milestone: `phase11-access`
- Durable state: `BLOCKED`
- Validation repair attempts: `0`
- Worker authority/resources: none
- Candidate: none

## Human decisions — v1 owner lifecycle

- An owner may not deactivate their own account.
- The last active owner may not be deactivated.
- Deactivation targets the principal and invalidates its credentials and active sessions.
- Reactivation is an explicit separate owner action.
- Hard deletion is out of scope for V1.

## Human decisions — credentials

- Staff PINs are system-generated.
- A staff PIN is revealed once at provisioning or rotation and is not delivered by email.
- In V1, an authorized owner password reset sets a new credential in-app.
- No email-based password reset flow is required for V1.

## Human decisions — secret-safe audit contract

The approved action set is:

- `staff_pin_provisioned`
- `staff_pin_rotated`
- `staff_pin_deactivated`
- `owner_provisioned`
- `owner_deactivated`
- `owner_reactivated`
- `credential_reset`

Audit prior/new state may contain only non-secret state such as active/inactive status and
credential version. PINs, passwords, credential secrets, hashes, salts, pepper-derived values,
session tokens, and all other secret material must never be stored or emitted in audit state. A
reason is required only for destructive actions.

Canonical decision source: explicit human instruction in the active FITWAY coordinator task on
2026-08-11. These decisions supersede the unresolved groups in
`20260811-140522-p11_access-needs-human.md`; the historical record remains preserved.

## Locked semantics retained

All reusable locked semantics in the historical authority stop remain binding: principal kinds
and roles, 6–12 Western-digit staff PIN shape, real separately provisioned owners, disabled
self-registration, owner-only procedures with canonical 401/403 behavior, version/activity-based
session invalidation, atomic validated/audited mutations, and no Staff-surface access composition.

## Exact current state and blocker

The human/product/security ambiguity is resolved. No implementation attempt exists and repair
count remains `0`. Access is not implementation-ready because the current command-only audit
schema cannot represent these actions and because repository ordering requires:

1. integrated `phase11-shell`;
2. integrated `phase11-audit` and release of the shared Owner lane;
3. an independently reviewed, backward-compatible coordinator-owned audit migration/contract;
4. a fresh bounded `phase11-access` activation with working isolated-worker toolchain capacity.

Phase 11 shell and audit remain durably capacity-blocked before assertions. This record therefore
supersedes `NEEDS_HUMAN` with `BLOCKED`; it does not authorize a migration, schema/DTO change,
branch, worktree, profile, lease, or implementation candidate.

## Verification and next lawful work

The decision set was reconciled against the existing Phase 11 access authority stop, workflow,
and ledger. No tests apply because no implementation or migration was authorized. The next lawful
Access-adjacent slice is the coordinator audit migration/contract only after shell and audit are
integrated and independently reviewed; until then, preserve this state without repeated probing.

## Exact resume command

Not applicable until integrated `phase11-shell`, integrated `phase11-audit`, the independently
reviewed backward-compatible coordinator audit migration/contract, and working isolated-worker
toolchain capacity satisfy the listed unblock conditions. At that point the coordinator must
create a fresh bounded `phase11-access` activation record, branch/worktree, leases, verification
profile, and worker brief from the durable decisions above.
