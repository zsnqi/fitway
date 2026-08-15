# Coordinator audit generalization — proposal v2, after independent design review

- Recorded: 2026-08-15 13:45 +03:00.
- Status: `DESIGN_REVIEW_REQUIRED` (second round). Authorizes no schema change.
- Supersedes `20260815-130000-audit-generalization-proposal.md`, which remains immutable history.
- The constraints in `20260815-013000-audit-generalization-design.md` still bind unchanged.

## Why v1 was wrong

An independent design review, verified against PostgreSQL 17.10 on a scratch database it created and
dropped, returned `APPROVE_WITH_CHANGES` with two defects that mattered more than the rest.

**v1 would not have applied.** `ALTER TYPE ... ADD VALUE` is append-only in the catalog, but Postgres
forbids *using* a new enum value in the same transaction, and drizzle wraps all pending migrations in
one transaction. v1's destructive-reason check named two new labels in DDL, so the migration would
have failed — on an empty database too, which is the path every integration test takes through
`migrate()`. Every integration test in the repository would have gone red.

**v1's central security claim was false.** v1 asserted a secret had "no column to occupy" and called
that a structural guarantee. It was not. Guarding `audit_log_action_values_coherent` behind
`event_class = 'command'` left `prior_value`, `requested_delta`, `requested_value`, and
`effective_value` completely unconstrained on governance rows. The reviewer inserted an
`access` / `staff_pin_rotated` row carrying `482913` in all four — accepted. The locked staff PIN
shape is 6-12 Western digits and fits in `int4`. **v1's own guard opened a PIN-sized channel the
table did not previously have**, and `audit-repository.ts:135-138` projects all four straight into
the DTO, where `owner-audit-view.tsx:135` renders one of them.

Both were caught before any code existed. That is the gate working, not a near miss.

## v2

The architecture is unchanged and was endorsed: extend `audit_log` rather than fork it, typed
columns rather than JSON, keep the explicit discriminator. The reviewer argued the discriminator
question both ways and concluded keep — a row with all governance columns null would otherwise be
classless, the rescuing rules are circular, and a class filter wants one indexable predicate.

### Migration `0007`, corrected

1. Append the eight names to the **end** of the `auditAction` tuple. Inspect the generated SQL before
   committing: anything other than plain `ADD VALUE` appends — a `BEFORE` clause, or a
   create-new-type/cast/drop recreate — is a stop condition, because a recreate rewrites the column
   and is not additive.
2. **No new `audit_action` literal appears in any DDL.** The destructive-reason check compares
   against a text cast so the literal is never resolved as an enum value:
   `${table.action}::text not in (...)`. The reviewer verified this commits in the same transaction
   as the `ADD VALUE`s and still rejects both `INSERT` and `UPDATE`.
3. New enum `audit_event_class` with `command`, `access`, `settings`; column `event_class` `NOT NULL`
   `DEFAULT 'command'`. A type created in the same transaction is immediately usable — only
   pre-existing enums carry the restriction.
4. `command_id`, `command_issuer_class`, and `effective_value` become nullable, each re-required for
   `event_class = 'command'` by a new check.
5. **Drop `DEFAULT 'human'` from `command_issuer_class`.** Otherwise `appendAuditEntry`'s
   `.values(value)` omits the absent key, Postgres supplies `'human'`, and every governance write
   fails the class check. Fail-closed, but a guaranteed trap for both dependent slices.
6. `audit_log_action_values_coherent` is guarded to command rows, keeping its current three-action
   shape verbatim inside the guard.
7. **New:** non-command rows must have all four count columns null —
   `event_class = 'command' or (prior_value is null and requested_delta is null and
   requested_value is null and effective_value is null)`. This closes the channel v1 opened.
8. **Rewrite `audit_log_actor_kind_role` against `event_class`, not `command_issuer_class`.** A CHECK
   passes when its predicate is NULL, so with a nullable issuer class the existing constraint would
   evaluate to NULL and admit any actor combination on a governance row — `shared_staff` with a null
   principal, or kind `owner` with role `staff`. Split into one arm per class, with command-issuer
   coherence in its own check.
9. `audit_log_values_nonnegative` gains an explicit null guard so it does not go vacuous.
10. Governance columns, all null on command rows: `target_principal_id uuid` referencing
    `auth_principals`, `prior_active`/`new_active` boolean, `prior_credential_version`/
    `new_credential_version` integer with `> 0` bounds mirroring `auth.ts:87-90`, and
    `settings_version bigint` referencing `settings_versions`.
11. Per-class requirements: `access` requires `target_principal_id` and forbids `settings_version`;
    `settings` requires `settings_version` and forbids the access columns.
12. **Require the state that story 26 promises.** `owner_deactivated` demands
    `prior_active = true and new_active = false`; `owner_reactivated` the inverse;
    `staff_pin_rotated` and `credential_reset` demand both credential versions with
    `new_credential_version > prior_credential_version`. Without this the owner's "from → to" column
    renders "Not recorded → Not recorded" for a perfectly valid deactivation, and `SPEC.md:168-169`
    asks for "who, when, from → to, why".

### The composite foreign key, stated honestly

`audit_log_command_issuer_fk` is `MATCH SIMPLE`, which skips enforcement entirely when any key column
is null. The reviewer verified a dangling `command_id` with a null issuer class is accepted. Once
`command_issuer_class` is nullable the FK stops protecting `command_id` on partial-null rows. v2 does
not pretend otherwise: the FK is restated as `MATCH FULL`, and if that proves impractical the record
states plainly that the `event_class` check is the sole protection.

### The `reason` channel — mitigated, and the residual risk recorded

`reason` is free-form 240-character text, and v2 *requires* it on credential-destroying actions. The
reviewer verified `'new PIN 482913 given to front desk'` is accepted. Since staff PINs are
system-generated and revealed once, an operator pasting the new PIN into the reason is the most
likely leak in the entire feature.

Mitigation: reject any run of six or more consecutive Western digits in `reason` on governance rows,
matching the locked PIN shape.

**This is a mitigation, not a proof, and v2 says so.** It does not stop a spaced or spelled-out
secret. The "structural guarantee" language from v1 is withdrawn: the typed governance columns are
structurally secret-free, and `reason` is a reviewed, accepted residual risk on a field that is
owner-authored by design.

### "Destructive", decided in writing rather than by omission

The human decision requires a reason "only for destructive actions" without enumerating them. The
coordinator reading: **destructive means revoking or invalidating an existing credential or access** —
`staff_pin_deactivated`, `owner_deactivated`, `staff_pin_rotated`, and `credential_reset`.
Provisioning and reactivation are additive and need no reason. Recorded explicitly so a human can
correct it; not settled silently.

### Contract extension — larger than v1 claimed

v1 repeated the `phase11-audit` verifier's "exactly two sites" and was wrong. The real set includes
`list.ts:19-23` (the tuple), `:99` and `:189` (both `effectiveValue` declarations), `:211-237` (the
terminal branch), and the filter, row, and mapping sites, plus
`apps/server/src/audit-repository.ts:53-90` and `:128-141`.

**v1 did not mention `apps/web` at all, and widening the tuple breaks it.**
`owner-audit-section.tsx:94-98` maps `AUDIT_ACTIONS` to `messages[action]` and
`owner-audit-view.tsx:127` indexes the same map, while `messages.ts:33-35` defines labels for exactly
three actions in each locale. Widening the tuple is a **compile error in two files** until 8 English
and 8 Arabic labels exist, and the section copy at `messages.ts:12-13` and `:22-23` — "Every
correction and reset", "No correction or reset has been recorded" — becomes false in both locales.

**These 16 bilingual labels and the corrected copy are assigned to the generalization slice itself.**
The contract commit cannot land without them or `apps/web` fails `check-types` and the accepted
`phase11-audit` surface goes red. Arabic copy follows the project's Arabic UX rules.

`effectiveValue` also gains the explicit-`null` "missing" filter option that `priorValue` and
`reason` already have, so the contract stays internally consistent instead of silently excluding
every governance row from that filter.

Request shape and keyset pagination are unaffected — confirmed by the reviewer.

## Rollback, stated honestly

v1 claimed reverting restores the previous shape. **That holds only until the first governance row is
written.** After that, restoring `NOT NULL` on `command_id`, `command_issuer_class`, or
`effective_value` requires deleting audit rows, which the audit log's immutability forbids. Added
enum labels are also permanent. The irreversibility is not limited to enum labels, as v1 implied.

## Retention, inherited and now confirmed rather than assumed

`retention-repository.ts:33-34` deletes from `audit_log` at the 12-month cutoff. Extending the table
therefore puts access-control provenance on the same expiry as occupancy corrections. `SPEC.md:528`
arguably already covers this, but the extend-don't-fork decision applies it silently, so it is
recorded here as a consequence a human may wish to revisit — not a defect.

Similarly, the FKs to `auth_principals` and `settings_versions` mean audit rows will block hard
deletion of a principal. Desirable for an audit log and consistent with "hard deletion is out of
scope for V1", but it converts a V1 scope decision into a structural constraint. Recorded so a later
phase is not surprised.

## Verification required of the implementing slice

The reviewer showed v1's list would not have caught the blocking defect. v2 requires, first:

1. **`migrate()` from an empty database.** This is the exact path the integration tests take and the
   one test that separates catching the enum defect from shipping it.

Then: existing command rows survive unchanged; rejection of a command row without `command_id`; an
access row with `command_id`; an access row without `target_principal_id`; a settings row with
access columns; **any count column set on a governance row**; a governance row with a nonsense actor
and a null issuer class; a dangling `command_id` with a null issuer class; a governance write
omitting `event_class`; a governance write omitting `command_issuer_class`; a destructive action
without a reason; a reason containing a six-digit run; `owner_deactivated` without its state
transition; a second audit row for one command still rejected; the Phase 5 command-plus-audit
transaction unchanged; a bad governance row producing a **rejected write** rather than a
`toAuditEntry` throw that would take down the whole owner audit page; `apps/web` typecheck; and
`tests/browser/phase11-audit.browser.spec.ts` green with a rendered governance row in both locales.

## Next step

Second independent design review of v2 against the eleven required changes, then implementation.
