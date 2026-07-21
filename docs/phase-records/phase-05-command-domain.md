# Phase 5 command-domain contract freeze

- Status: `FROZEN_FOR_BATCH_03`
- Frozen: 2026-07-21T22:11:26+03:00 by the Batch 03 coordinator
- Authority: `FITWAY_PRODUCT.md`, `SPEC.md` §§459–600, `PHASES.md` Phase 5,
  `docs/adr/ADR-002-auth-principals-sessions.md`, and
  `docs/adr/ADR-003-edge-authority-and-reconciliation.md`
- Implementing slice: `phase5-command-domain`; staff UI is deliberately deferred to
  `phase5-staff-ui` after this slice is independently verified and integrated.

## Frozen outcome

Phase 5 creates the durable command and audit spine. A staff-or-owner correction or reset
creates a command and its immutable audit entry in one database transaction. The cloud does
not overwrite current state while the edge is online; an edge applies the command, reports the
highest applied command on a subsequent accepted live push, and only then does the command
become applied. Phase 6 alone may add the offline/manual-current-state exception.

## Command and audit contract

- Commands are durable, monotonically increasing positive safe-integer IDs and have exactly
  `pending | applied | superseded` lifecycle states. The device-facing command forms are
  `set_count` with a non-negative integer target and `reset_zero` with no target. IDs, values,
  reasons, and timestamps use JSON-safe representations and Western-digit validation where
  typed by a human.
- The staff-or-owner correction input is either a signed integer `delta` or an absolute
  non-negative integer. A delta is resolved while locking current state, floors at zero, and is
  persisted/delivered as `set_count`; a delta cannot be issued without a usable current count.
  An absolute correction is persisted/delivered as `set_count`. A reset is delivered as
  `reset_zero` and has the same lifecycle. Reasons are optional, short, trimmed text; absent
  is stored as null, not an invented explanation.
- Issuing a newer pending command supersedes every older conflicting pending command in the
  same transaction. Delivery is oldest-first over the remaining effective set and therefore
  latest-only for superseded types. Applied and superseded rows are immutable audit history.
- An accepted contiguous live push acknowledges the highest command the edge reports as
  applied. Replayed/gapped/invalid/backfill-only pushes cannot advance command lifecycle or
  audit state. Acknowledgement is idempotent and cannot apply an undelivered, superseded, or
  future command. Pending commands are returned in the edge push response only under the
  frozen latest-only rule.
- Every human mutation records actor principal ID, principal kind, role, command ID, action,
  prior and requested/effective values as applicable, nullable reason, and server timestamp in
  the same transaction. The shared desk remains the shared-staff principal; no synthetic
  email identity is introduced. A failed transaction leaves neither a command nor an audit row.
- Server procedures enforce `staff | owner` for corrections/resets and re-check that role on
  every call. Missing/expired auth is `401`; valid non-owner access to owner-only procedures
  remains `403`. Router visibility is never authorization.

## Frozen boundaries

- Migration lane is exactly `0005`; `0000`–`0004`, their snapshots, and their journal history
  are immutable. The migration adds only the reviewed command/audit persistence needed above.
- The Phase 5 edge response extends the existing schema-version-1 push contract in lockstep:
  Zod, OpenAPI, server handler, repository/engine, fixture, simulator, and parity tests change
  together. It does not create schema v2 or alter the public payload.
- PIN/session, principals, roles, health projection, public schema v2, privacy boundaries,
  historical analytics DTOs/semantics, and settings/time primitives are read-only contracts.
- Phase 5 does not add manual fallback current-state mutation, history backfill behavior,
  scheduled system reset issuance, alerting, owner analytics transport, or staff command UI.

## Required proof

Unit and disposable-Postgres evidence must cover role rejection; delta/absolute/reset input
validation; zero floor; monotonic IDs; supersession/latest-only delivery; accepted-push ack;
replay/gap/backfill no-op behavior; audit atomicity/provenance; OpenAPI/Zod/Python parity; and
the invariant that an online command does not overwrite cloud current state. A fresh independent
verifier must inspect the exact candidate, rerun the focused profile with a different run ID and
database, and return `PASS` without edits.

Any public capacity/history/identity leak, missing atomic audit, command acknowledgement that
breaks edge authority, unreviewed migration, unleased shared-file need, or Product/Spec
conflict is `NEEDS_HUMAN` immediately.
