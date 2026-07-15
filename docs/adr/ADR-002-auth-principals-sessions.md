# ADR-002: Authentication principals, sessions, and roles

- Status: Accepted contract; implementation begins in Phase 4
- Date: 2026-07-14; migrated 2026-07-15

## Context

FITWAY has one shared front desk and separately provisioned real owners. Treating staff as fake
email/password users would create invented identity, misleading audit attribution, and the wrong
operational flow. Navigation guards alone cannot protect owner or mutation APIs.

## Decision

- Roles are exactly `staff | owner`; principal kinds are `shared_staff | owner`.
- Staff signs in with a 6–12 Western-digit PIN. Store only a password-grade memory-hard hash with
  per-credential salt and a server-held pepper; never store/log/seed the raw PIN.
- Successful staff verification creates an opaque server-side session. Store only a hashed token.
  The signed cookie is HttpOnly, Secure, SameSite=Lax, Path=/, with no Domain and roughly 30-day
  rolling expiry refreshed at most daily.
- Credential version, principal/session activity, expiration, revocation, rotation, and
  deactivation are checked on the next request.
- Canonical context is `principalId`, `principalKind`, `role`, `sessionId`, `expiresAt`, `active`.
  Ambiguous valid owner/staff sessions are rejected rather than guessed.
- `/staff` and `staff.*` allow staff or owner; `/admin` and `admin.*` allow owner only. Missing or
  expired auth is 401; a valid wrong role is 403. Every leaf procedure checks server-side.
- Owner identities are separately provisioned real accounts. No public sign-up exists.

## Consequences

The current Better Auth email/password scaffold is non-conforming input to replace. Staff audit
attribution is intentionally the shared front-desk principal. Phase 4 must prove cookie attributes,
rate limiting, non-enumeration, session lifecycle, direct signup rejection, and role enforcement.

## Provenance

Normative detail remains in `SPEC.md` under the Phase 4 authentication contract freeze.
