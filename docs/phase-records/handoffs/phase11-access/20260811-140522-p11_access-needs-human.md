# Phase 11 access b01 — authority stop

- Recorded: 2026-08-11 14:05:22 +03:00
- Milestone: `phase11-access`
- Durable state: `NEEDS_HUMAN`
- Validation repair attempts: `0`
- Worker authority/resources: none
- Candidate: none

## Decision

Do not activate implementation. Product/Spec authorize the outcome—owner-managed staff PIN
provision/rotation/deactivation and real-owner account management—but do not settle the
security and data semantics required to implement that outcome safely. `AGENTS.md` makes
security ambiguity and an invented locked-product contract immediate `NEEDS_HUMAN`.

The approved Owner/Management visual extension is not the blocker. The ADR-007 coverage record
explicitly says that its approval does not settle owner self-deactivation, last-owner protection,
or password delivery when the repository has not answered them. The targeted authority search
found no current Product/Spec, ADR, reviewed schema, DTO, or accepted implementation contract
that answers those questions.

## Human product/security decisions required

1. **Lifecycle and lockout policy.** Define the v1 owner mutations (provision, rename/email
   change, rotate credential, deactivate, reactivate); whether an owner may deactivate their own
   account; whether the last active owner is protected; whether deactivation applies to the
   credential, principal, or both; and whether rotation/provisioning may reactivate an inactive
   identity. Hard deletion remains excluded unless explicitly authorized.
2. **Secret handoff and reset.** Choose owner-entered versus generated/reveal-once staff PIN and
   owner password handling, including the v1 owner/maintainer reset path. Email delivery is
   explicitly out of scope, so implementation may not invent an email invite/reset flow.
3. **Atomic access-audit contract.** Authorize access action names, a privacy-safe prior/new
   representation, and whether destructive mutations require a reason. No PIN, password, hash,
   salt, pepper-derived value, session token, or other secret may enter audit storage or output.

These are binding product/security choices, not local UI or repository-implementation details.

## Locked semantics that remain reusable

- Roles/principal kinds stay exactly `staff | owner` and `shared_staff | owner`; staff remains
  one real shared principal with no synthetic email.
- Staff PINs remain 6–12 Western digits. Raw secrets are never stored, logged, placed in URLs,
  or seeded by migrations.
- Owners remain separately provisioned real identities; self-registration stays disabled.
- Every access procedure is owner-only: missing/expired authentication is `401`, staff is `403`.
- Credential version/activity and principal activity continue to invalidate rejected sessions on
  their next use.
- Every accepted access mutation must be validated, versioned, audited, and atomic.
- Access composition stays inside the approved Owner/Management family and never appears on Staff.

## Schema evidence and future migration boundary

The current `audit_log` is command-specific: its action enum contains only correction/reset
values, `command_id` is a required edge-command foreign key, and `effective_value` is required
numeric state. It cannot represent an access mutation without inventing semantics or weakening
constraints. After the human decisions, the coordinator must establish an independently reviewed,
backward-compatible audit migration/contract before granting worker authority. Existing Phase 5
command/audit atomicity and rows must remain valid.

The current authentication tables and services already provide reusable principal, credential,
activity, version, hashing, and session-invalidation primitives. No auth-table or index change is
authorized on current evidence.

## Resume and preservation rules

- Preserve this as the first blocker even if isolated-worker execution capacity recovers.
- Keep repair count `0`; no assertion or implementation attempt occurred.
- Do not create a branch/worktree, verification profile, migration, lease, DTO, route, or Paper
  access composition until the three decision groups above are durably answered.
- After decisions, serialize work as: integrated `phase11-shell` → integrated `phase11-audit` →
  reviewed coordinator audit migration/contract → fresh `phase11-access` activation.
- The earlier capacity-blocked record remains historical evidence; this record supersedes its
  stop reason because human authority is now the first blocker.

## Evidence inspected

- `AGENTS.md`
- `FITWAY_PRODUCT.md`
- `SPEC.md` stories/contracts/open-questions sections
- `PHASES.md` Phase 11 dependency and mutation requirements
- `docs/adr/ADR-002-auth-principals-sessions.md`
- `docs/phase-records/adr-007-family-coverage.md`
- `packages/auth/src/auth-service.ts`
- `packages/auth/src/repository.ts`
- `packages/db/src/schema/auth.ts`
- `packages/db/src/schema/application.ts`
- `packages/db/src/migrations/0005_phase5_command_domain.sql`
- current Phase 4 auth and Phase 5 command-domain integration coverage
