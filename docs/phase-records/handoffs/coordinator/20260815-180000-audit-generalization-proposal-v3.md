# Coordinator audit generalization — proposal v3

- Recorded: 2026-08-15 18:00 +03:00.
- Status: `DESIGN_REVIEW_REQUIRED` (third round). Authorizes no schema change.
- Supersedes v2 (`20260815-134500`), which is immutable history along with v1 (`20260815-130000`)
  and the rejection record (`20260815-175000`).
- The constraints in `20260815-013000-audit-generalization-design.md` still bind.

## Human decision obtained, 2026-08-15

**A reason is required for `staff_pin_deactivated` and `owner_deactivated` only.** Rotation,
reset, provisioning, and reactivation may carry an optional reason but never demand one.

This resolves the ambiguity v2 tried to settle by coordinator reading. The reading v2 chose was the
secret-*unsafer* one: a staff PIN is revealed once, at provisioning or rotation, so mandating a
free-text field at rotation and reset would have forced a prompt at exactly the two moments a new
secret sits in the operator's hands — against the threat model v2 itself set out. The narrow reading
also matches the restricting force of "only" in the original decision.

## Carried forward unchanged, endorsed by both reviews

Extend `audit_log` rather than fork it; typed governance columns rather than JSON; the explicit
`event_class` discriminator; and v2's item 7, which closes the integer secret channel v1 opened —
verified rejecting every count column individually and together on governance rows, with command rows
unaffected.

## The five blocking corrections

**C1 — no new `audit_action` literal in any DDL, and that includes the state rules.** v2 stated this
and then violated it. Every constraint that names one of the eleven action labels uses
`${table.action}::text`, including the per-action state rules. Verified: the cast form commits in the
same transaction as `ALTER TYPE ... ADD VALUE` and still rejects a bad `INSERT`, a `reason`-nulling
`UPDATE`, and an `action`-changing `UPDATE`. `audit_event_class` is created in the same transaction
and *is* usable as a bare literal — only pre-existing enums carry the restriction. Drizzle wraps all
pending migrations in one transaction, so splitting files does not evade this.

**C2 — keep `DEFAULT 'human'` on `command_issuer_class`.** v2 had this backwards.
`packages/api/src/audit/types.ts:6-18` gives `HumanAuditEntry` no such field, and
`packages/api/src/commands/service.ts:142-150`, `:185-192`, `:216-223` never set it, so **the human
command path depends entirely on that default**. Dropping it would fail every staff and owner
correction at write time and redden
`apps/server/src/phase7-integration.integration.test.ts:409,414`. The column becomes nullable, the
default stays, and the governance write path passes `commandIssuerClass: null` **explicitly** —
drizzle omits only `undefined`, so an explicit null is emitted and the default does not fire. A test
asserts that omitting it on a governance write fails.

**C3 — NULL-safe state rules.** `prior_active = true` passes vacuously when the column is null, which
is the exact row the rule exists to reject. All boolean arms use `is true` / `is false`. The
credential-version arms already used `is not null` and were correct.

**C4 — NULL-safe actor rules, including `actor_role`.** My diagnosis blamed the nullable issuer class
alone and was incomplete: the **existing** constraint at
`packages/db/src/schema/application.ts:401-408` already admits an owner-kind row with a null role
today. The rewrite is null-safe on every column in every arm and closes that pre-existing hole too.
This matters beyond tidiness — such a row reaches `packages/api/src/audit/list.ts:203`, which throws,
and `apps/server/src/audit-repository.ts:152` maps the whole page, so one bad row 500s the entire
owner audit view.

**C5 — bind `action` to `event_class`.** v2 required a test for this and never added the constraint
that would make it pass. An `access` row carrying `reset` currently inserts cleanly and then throws
on read at `list.ts:234`. A new check ties each action label, by text cast, to its permitted class.

## Reason validation, corrected

The digit-run rule stays as a **database backstop**, extended to Arabic-Indic digits
(`[0-9٠-٩]{6}`) — an Arabic-first product cannot ship a Western-digit-only guard.

Ahead of it, an **application-layer validation with bilingual error copy**. This is not polish:
`SPEC.md:212-214` binds the mutation and its audit row into one transaction, so a constraint
violation aborts the deactivation itself and surfaces as an opaque failure. The false-positive class
is real and recorded — ticket numbers, dates, phone numbers, national IDs.

Because reason is now required only on the two deactivations, the field is no longer mandatory at
either PIN-revealing moment. The residual risk is smaller than v2's, and it remains a mitigation
rather than a proof: a spaced or spelled-out secret still passes.

## Contract sites, complete this time

Beyond v2's list: `apps/web/src/hooks/use-owner-audit.ts:25` widens silently and `:128-129` is where
the new `effectiveValue: null` filter option must be wired as an `effectiveMode` mirroring
`priorMode` at `:122-127`.

**The governance "from → to" rendering is assigned to this slice.**
`apps/web/src/components/owner/audit/owner-audit-view.tsx:128-137` renders that column through
`CountValue`, which formats a number; nothing renders an active/inactive or credential-version
transition. Requiring the data without assigning its rendering would leave the column empty for every
governance row — defeating the stated purpose of the state rules.

The false section copy is **four** strings, not two: English `messages.ts:12`, `:22` and Arabic
`:77`, `:85`. With the 16 bilingual action labels, the `effectiveMode` copy, and the governance
transition copy, the bilingual deliverable is substantially larger than v2 implied, and all of it
belongs to this slice.

## Two of my own honesty claims were wrong

The `MATCH SIMPLE` concern is **dead**, not live: under the class check a partial-null row is
unreachable before the FK is ever consulted, so `MATCH FULL` is unnecessary — and it would not be
additive, requiring DROP and ADD of an existing constraint. The section is withdrawn.

The hard-deletion consequence is **not newly introduced**: `application.ts:375-377` already
references `auth_principals` with no `ON DELETE`, so audit rows block principal deletion today.
`target_principal_id` adds a second such reference and converts nothing.

Retention and rollback statements from v2 stand: governance provenance inherits the 12-month audit
expiry, and rollback is only clean until the first governance row is written.

## Verification

v2's list plus: a governance write omitting `command_issuer_class` must fail; an `access` row
carrying a command action must be **rejected at write** rather than throwing on read; an
`owner_deactivated` row with null booleans must be rejected; an owner-kind row with a null role must
be rejected, including on the command path where it is accepted today; a reason containing
Arabic-Indic digits must be rejected; a legitimate reason containing a ticket number must be caught
at the application layer with localized copy rather than by the constraint; and `apps/web` must
typecheck with a governance row rendered in both locales and both directions.

## Next step

Third independent design review against C1-C5 and the corrected contract scope, then implementation.
Two rounds have each found blocking defects that would have shipped, so the third is not ceremony.
