# Audit generalization v2 — REJECTED by second independent design review

- Recorded: 2026-08-15 17:50 +03:00.
- Verdict: `REJECT`. Five blocking defects, each demonstrated on PostgreSQL 17.10 against scratch
  databases the reviewer created and dropped. No `fitway_*` database was touched.
- **No schema change is authorized.** `phase11-access` and `phase11-settings` remain blocked.
- The architecture survives: extend-don't-fork, typed columns over JSON, the explicit discriminator,
  and the count-column closure were all endorsed. A v3 keeps them.

## What v2 got right, confirmed

- The `::text` cast genuinely fixes the enum-in-transaction wall. Verified: the whole migration
  commits, and the constraint then rejects a bad `INSERT`, a `reason`-nulling `UPDATE`, and an
  `action`-changing `UPDATE`.
- The integer secret channel v1 opened is **properly closed**. Every count column, individually and
  together, is rejected on a governance row; command rows are unaffected.
- Withdrawing the "structural guarantee" language, the rollback correction, and the
  "mitigation, not a proof" framing were all correct.

## Blocking defects

**B1 — v2 re-opens the blocking defect it claims to have fixed.** Item 2 states the rule "No new
`audit_action` literal appears in any DDL", and item 12 then violates it ten lines later, naming four
new labels literally. Rendered as written it fails identically to v1 — `unsafe use of new value` —
on the empty-database path every integration test takes through `migrate()`. Stating a rule and
breaking it in the only other place it applies is worse than not stating it.

**B2 — dropping `DEFAULT 'human'` breaks every human correction and reset.** My item 5 had the fix
backwards. `packages/api/src/audit/types.ts:6-18` gives `HumanAuditEntry` no `commandIssuerClass`
field, and `packages/api/src/commands/service.ts:142-150`, `:185-192`, `:216-223` never set it: **the
human command path depends entirely on the database default.** Dropping it makes every staff and
owner correction fail at write time and reddens
`apps/server/src/phase7-integration.integration.test.ts:409,414`. This violates the design record's
own constraint that the Phase 5 atomic-write proof survives unchanged. The correct fix is the
reverse: keep the default and require the governance path to pass `commandIssuerClass: null`
explicitly, since drizzle omits only `undefined`.

**B3 — item 12's boolean arms are NULL-vacuous, and self-defeating.** `prior_active = true and
new_active = false` evaluates to NULL when both are null, and a CHECK passes on NULL. Verified: an
`owner_deactivated` row with both booleans omitted inserts cleanly — precisely the
"Not recorded → Not recorded" row item 12 exists to prevent. Needs `is true` / `is false`. The
credential-version arm is already safe because it uses `is not null`.

**B4 — the actor rewrite is still NULL-vacuous on `actor_role`.** An owner-kind governance row with a
null role passes both arms. My diagnosis blamed the nullable issuer class alone and was incomplete:
the reviewer showed the **existing** constraint at `packages/db/src/schema/application.ts:401-408`
already admits owner-kind/null-role command rows today. Such a row reaches
`packages/api/src/audit/list.ts:203`, which throws, and `apps/server/src/audit-repository.ts:152`
maps the whole page — so one bad row 500s the entire owner audit view.

**B5 — nothing binds `action` to `event_class`.** Verified: an `access` row carrying `reset` inserts
cleanly, then throws at `list.ts:234` on read. That is exactly the failure v2's own verification list
demands must not happen — v2 requires the test and never adds the constraint that would make it pass.

## Further required changes

Application-layer `reason` validation ahead of the database check, with bilingual error copy, because
`SPEC.md:212-214` binds mutation and audit into one transaction — so a legitimate reason containing a
ticket number, date, or phone number currently **aborts the credential mutation itself** with an
opaque failure. The digit-run rule is also blind to Arabic-Indic digits in an Arabic-first product.

The contract site list is still short: `apps/web/src/hooks/use-owner-audit.ts:25,128-129` is a third
`apps/web` site; the governance "from → to" rendering is unassigned, since
`owner-audit-view.tsx:128-137` formats numbers only and nothing renders an active/inactive or
credential-version transition; and the false section copy is **four** strings, not two — English
`messages.ts:12,22` and Arabic `:77,85`.

Two of my honesty claims were themselves inaccurate. The `MATCH SIMPLE` risk is already dead under
item 4, which makes partial-null rows unreachable before the FK is consulted, so `MATCH FULL` is
unnecessary and is not additive. And the hard-deletion consequence is not newly introduced:
`application.ts:375-377` already references `auth_principals` with no `ON DELETE`, so audit rows
block principal deletion today.

## The destructive definition goes to a human

The reviewer's judgement, which I accept: this is a `NEEDS_HUMAN` stop under `AGENTS.md`, not a
coordinator reading.

Three reasons. It inverts the word "only" in "a reason is required **only** for destructive
actions", making the exception the rule across four of seven actions. `AGENTS.md` names
privacy/security ambiguity as an immediate `NEEDS_HUMAN`, and recording a reading "so a human can
correct it" is not the same as asking.

And the substantive one: a staff PIN is revealed once, at provisioning or rotation. Rotation and
reset are exactly the two moments a new secret exists in the operator's hands. v2 names an operator
pasting that PIN into `reason` as the most likely leak in the entire feature — and then makes
`reason` **mandatory** at precisely those two moments. My reading and my own threat model point in
opposite directions, and v2 did not notice. The narrow reading is the secret-safer one.

## State

`phase11-audit` remains `DONE` and unaffected. `phase11-access` and `phase11-settings` stay blocked
on this generalization. `phase11-health` is independent and proceeding. No code, migration, or
contract change was made in either review round — both defects that would have shipped were caught
before any implementation existed.
