# Coordinator audit generalization — concrete migration and contract proposal

- Recorded: 2026-08-15 13:00 +03:00.
- Status: `DESIGN_REVIEW_REQUIRED`. Authorizes no schema change until an independent review passes.
- Supersedes nothing. Implements the constraints fixed in
  `20260815-013000-audit-generalization-design.md`; every one of those constraints still binds.
- Migration slot: `0007`, the next in the single coordinator-serialized lane after `0006`.

## What this must make representable

The seven human-approved access actions — `staff_pin_provisioned`, `staff_pin_rotated`,
`staff_pin_deactivated`, `owner_provisioned`, `owner_deactivated`, `owner_reactivated`,
`credential_reset` — plus one settings action, `settings_updated`. Those eight names are fixed by
prior human decision and by `SPEC.md` story 24; this proposal does not reopen them.

## Why `audit_log` cannot take them today

`packages/db/src/schema/application.ts:369` is command-coupled by construction: `command_id` is
`NOT NULL` (`:382`) with a unique index (`:395`) and a composite FK to `edge_commands`
(`:425-429`); `effective_value` is a `NOT NULL` integer (`:390`); and
`audit_log_action_values_coherent` (`:413-420`) enumerates exactly the three command actions. A
settings or access event has no command and no integer "effective value".

## Chosen shape: extend `audit_log`, with a discriminated event class

`SPEC.md:168-169` asks the owner for **one** audit log covering corrections, resets, and settings
changes, and `SPEC.md:243` puts a single audit view in the owner area. A second governance table
would satisfy the schema and fail the product, so `audit_log` is extended.

### 1. Enum additions

Append the eight names to `audit_action`. Postgres `ADD VALUE` is append-only and cannot remove or
reorder, so existing rows and their stored labels are untouched.

### 2. A single explicit discriminator

Add `event_class` as a new enum `audit_event_class` with values `command`, `access`, `settings`,
defaulting to `command` and `NOT NULL`. Backfilling is trivial because every existing row is a
command row. The discriminator is explicit rather than inferred from which columns are null, so
every constraint below can be written against one column instead of a disjunction of shapes.

### 3. Relaxations, each re-tightened per class

- `command_id` becomes nullable. A new check requires it `NOT NULL` when
  `event_class = 'command'` and `NULL` otherwise. The existing unique index stays and remains
  effective, because Postgres unique indexes ignore nulls — so the one-audit-row-per-command
  guarantee that Phase 5 depends on is preserved exactly, and governance rows cannot collide with it.
- `command_issuer_class` becomes nullable under the same rule.
- `effective_value` becomes nullable, required `NOT NULL` only for `event_class = 'command'`.
- `audit_log_action_values_coherent` is rewritten to apply **only** when `event_class = 'command'`,
  keeping its current three-action shape verbatim inside that guard. Command rows therefore keep
  every guarantee they have today, unchanged.
- `audit_log_actor_kind_role` is extended so `access` and `settings` rows require a real owner or
  system actor, never `shared_staff`. Governance actions are owner or system by product decision.

### 4. Governance state, constrained rather than free-form

The design record required a representation in which a secret has nowhere to go. **No JSON column.**
Instead, four narrow typed columns, all nullable and all forbidden on command rows:

- `target_principal_id uuid REFERENCES auth_principals(id)` — who the access action was performed on.
- `prior_active boolean` / `new_active boolean` — the active/inactive transition.
- `prior_credential_version integer` / `new_credential_version integer` — credential rotation, as a
  monotonic version only.
- `settings_version bigint REFERENCES settings_versions(version)` — the settings version a
  `settings_updated` row created.

A PIN, password, hash, salt, pepper-derived value, or session token has no column to occupy. This is
a structural guarantee, not a convention a future author could forget.

Per-class checks: `access` rows require `target_principal_id` and forbid `settings_version`;
`settings` rows require `settings_version` and forbid `target_principal_id` and the active and
credential columns; `command` rows forbid all six.

### 5. Reason

`audit_log_reason_short_trimmed` is unchanged. A new check requires a non-null reason for the
destructive actions `staff_pin_deactivated` and `owner_deactivated`, per the human decision that
reason is required only for destructive actions.

## Backward compatibility

Every existing row is a `command` row and satisfies every new constraint after the default backfill.
No existing row is rewritten. No column is dropped or retyped. The Phase 5 atomic-write proof and the
`audit_log_command_unique` guarantee are untouched. `appendAuditEntry` needs no change, though it may
later set `event_class` explicitly rather than relying on the default.

## Contract extension

`packages/api/src/audit/list.ts` is the accepted read contract from `phase11-audit`. It was
deliberately built open: one `AUDIT_ACTIONS` tuple feeds every schema, the action filter is an array,
and the entry DTO carries no `commandId` or issuer class. The extension is therefore additive:

- widen `AUDIT_ACTIONS` to the eleven names;
- add `eventClass` to the entry and as a filter;
- make `effectiveValue` nullable in the DTO, and extend the coherence assertion's terminal branch —
  the verifier of `phase11-audit` identified `list.ts:99` and `:211-237` as exactly the two sites
  requiring an edit, and predicted it would be additive rather than a break. This proposal confirms
  that prediction;
- add the governance fields to the entry as an optional discriminated member.

No existing client request shape changes.

## What this proposal does **not** do

It does not implement access or settings behaviour, does not create a credential surface, and does
not decide any lifecycle rule — those are `phase11-access` and `phase11-settings`, working from the
already-resolved human decisions. It authorizes no code until reviewed.

## Verification required of the implementing slice

1. A migration test proving existing command rows survive unchanged and still satisfy every
   constraint.
2. Negative tests proving the database **rejects**: a command row without `command_id`; an access row
   with `command_id`; an access row without `target_principal_id`; a settings row with
   `target_principal_id`; a `shared_staff` actor on a governance row; a destructive action without a
   reason; and any governance column set on a command row.
3. Proof that `audit_log_command_unique` still rejects a second audit row for one command.
4. A test proving the Phase 5 command-plus-audit transaction is unchanged.
5. The `phase11-audit` read surface still green, including its keyset walk and null semantics.

## Rollback

Single additive migration plus its contract commit. Reverting both restores the previous shape,
because no existing row is rewritten and no column is dropped. Enum values added by
`ALTER TYPE ... ADD VALUE` cannot be removed, which is acceptable: an unused label is inert, and
attempting removal would be the destructive operation.
