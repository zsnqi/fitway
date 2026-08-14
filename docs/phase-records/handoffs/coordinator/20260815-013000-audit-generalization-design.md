# Coordinator audit generalization — design record

- Recorded: 2026-08-15 01:30 +03:00.
- Status: `DESIGN_REVIEW_REQUIRED`. This authorizes no migration, branch, lease, or candidate.
- Evidence base: read-only reconnaissance of `main` at `61afaa4`, cited by `path:line` below.

## Why this record exists

`phase11-access` already records that "the current command-only audit schema cannot represent these
actions". Reconnaissance shows the same constraint binds `phase11-settings`, which no existing
record states. That changes the Phase 11 critical path, so it is recorded before any slice starts
rather than discovered mid-implementation.

## The constraint, from the schema itself

`packages/db/src/schema/application.ts:369` defines `audit_log` as strictly command-coupled:

- `commandId` is `notNull()` (`:382`) with `uniqueIndex("audit_log_command_unique")` (`:395`) and a
  composite foreign key to `edge_commands` (`:425-429`);
- `effectiveValue` is a `notNull()` integer (`:390`);
- `audit_log_action_values_coherent` (`:413-420`) enumerates exactly the three command actions and
  fixes the prior/requested/effective shape of each;
- `auditAction` (`:80`) is exactly `correction_delta`, `correction_absolute`, `reset`.

A settings change or an access change has no command, no integer "effective value", and carries
state that is not a count. Neither can be written to this table as it stands.

## What each dependent slice needs

**`phase11-access`** — the seven human-approved actions, which must not be re-litigated:
`staff_pin_provisioned`, `staff_pin_rotated`, `staff_pin_deactivated`, `owner_provisioned`,
`owner_deactivated`, `owner_reactivated`, `credential_reset`. Prior/new state may contain only
non-secret state such as active/inactive status and credential version. Reason is required only for
destructive actions.

**`phase11-settings`** — one action for an append-only settings version change. Reconnaissance
confirms there is **no existing settings write path anywhere in non-test code**: every
`insert(settingsVersions)` occurrence is an integration-test fixture, and
`settings_versions.created_by` (`packages/db/src/schema/application.ts:153`) is a nullable text
column that nothing populates. So the settings slice authors both the write path and its audit
representation, and `SPEC.md:212-214` requires the mutation and its audit entry to share one
transaction.

**`phase11-audit`** — must ship *before* this generalization. Its authority packet is explicit:
"Current actions remain exactly `correction_delta`, `correction_absolute`, and `reset`. Do not
pre-generalize access/settings/system actions in this slice." The audit read surface therefore lands
against today's three actions, and this generalization extends both the schema and that read
contract afterwards.

## Product requirement that decides the shape

`SPEC.md:168-169` (owner story 26) asks for **one** audit log covering "every correction, reset, and
settings change", and `SPEC.md:243` requires the owner area to provide an "audit log view" alongside
account management. One unified history is the product requirement, so a second parallel
governance-audit table would satisfy the schema and fail the product. The generalization extends
`audit_log`; it does not fork it.

This is an implementation decision derived from an existing Product requirement. It is not a new
product decision and does not need human resolution. What *would* need human authority — changing
any of the seven approved access actions, changing the secret-free rule, or weakening
mutation/audit atomicity — is out of scope here.

## Constraints any accepted design must satisfy

1. **Backward compatible.** Existing rows stay valid and unmodified. The Phase 5 atomic-write proof
   and the `audit_log_command_unique` guarantee for command actions survive unchanged.
2. **Additive migration only**, coordinator-owned and serialized, in the single ordered migration
   lane after `0006`. No worker invents a parallel migration number, and historical `0000`/`0001`
   remain immutable.
3. **Command actions keep every current guarantee.** Whatever discriminator is introduced, a
   command action must still require its command linkage and its coherent prior/requested/effective
   shape. Relaxing `commandId` to nullable is only acceptable if a constraint still forces it
   non-null for command actions.
4. **Secrets can never be represented.** The new state columns must be shaped so that a PIN,
   password, hash, salt, pepper-derived value, or session token has nowhere to go. Prefer a
   constrained non-secret state representation over free-form JSON that merely promises restraint.
5. **Actor rules unchanged.** `audit_log_actor_kind_role` (`:401-408`) already encodes the
   shared-staff / owner / system triad. Governance actions are owner or system; no synthetic staff
   identity is ever invented.
6. **Atomicity unchanged.** Every settings or access mutation and its audit row share one
   transaction, per `SPEC.md:212-214` and the Phase 5 precedent.
7. **The Phase 11 audit read contract extends, not breaks.** Rows for the new actions must be
   representable in the DTO the audit slice ships, with `from`/`to` remaining honest — null never
   coerced to zero.

## Revised Phase 11 critical path

The earlier sequencing record placed the audit generalization between audit and access. The settings
dependency moves it: it now gates **two** slices, not one.

1. `phase11-shell` b02
2. `phase11-audit` b01 — three command actions only, on today's schema
3. **coordinator audit generalization** — design review, then additive migration and contract
4. `phase11-access` b01 and `phase11-settings` b01 — both depend on step 3, and both touch `/admin`,
   so they run sequentially, not concurrently
5. `phase11-health` b01 — independent of the generalization; it is read-only over
   `edge_health_log` and `alert_log` and needs no new action
6. `phase-11` aggregate

`phase11-health` could in principle run earlier since it does not depend on the generalization, but
it shares the `/admin` surface with every other Phase 11 slice, so it stays in the same serial lane.

## Health slice note, recorded while the evidence is fresh

Reconnaissance found **no read or reporting path** over `edge_health_log` or `alert_log` anywhere
outside the alert evaluator's own write flow, and no reference to either table in `apps/web/src`.
`apps/server/src/retention-repository.ts` only deletes by cutoff. So `phase11-health` is a
greenfield read surface over two append-only tables whose single writer is
`apps/server/src/alert-repository.ts:113-248`, where health transitions and the `claimed` alert row
are inserted inside one advisory-locked transaction and the real delivery outcome is appended after
commit. The uptime/incident summary must therefore treat `alert_log` as an append-only sequence with
two rows per notice, not as a mutable status table.

## Next step

Independent review of this design record, then a concrete migration and contract proposal reviewed
on its own before any schema change. No implementation is authorized by this record.
