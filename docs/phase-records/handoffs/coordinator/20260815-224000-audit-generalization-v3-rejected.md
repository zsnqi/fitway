# Coordinator audit generalization — v3 rejected by third independent design review

- Recorded: 2026-08-15 22:40 +03:00.
- Reviewer: fresh independent session, no authorship of v1–v3.
- Verdict: **REJECT**, four blocking defects.
- Environment: PostgreSQL 17.10, disposable database `fitway_integration_p11_audit_gen_v03` built
  from migrations `0000`–`0006` and seeded with three real command rows, dropped afterwards. v3
  contains no SQL, so the reviewer rendered v2 items 1–12 as corrected by C1–C5.

This record is immutable history. The response is
`20260815-224500-audit-generalization-proposal-v4.md`.

## Blocking defects

**D1 — the C4 actor tightening is not additive and can abort the migration.** With one legacy
owner-kind/null-role command row present:

```
ALTER TABLE audit_log ADD CONSTRAINT audit_log_actor_kind_role CHECK (…)
ERROR 23514: check constraint "audit_log_actor_kind_role" of relation "audit_log"
             is violated by some row
```

Drizzle runs all pending migrations in one transaction (`drizzle-orm@0.45.2`
`pg-core/dialect.cjs:62-73`), so this aborts the whole migration, and audit immutability forbids
repairing the row. v3 stated no pre-flight, no `NOT VALID` path, and no decision to scope the
tightening.

**D2 — "null-safe on every column in every arm" is not achieved by the natural rendering.** Rendered
as C4 reads — `is not null` on `actor_principal_id` and plain equality on kind and role — the exact
row the rule exists to reject was **accepted**: `actor_role = 'owner'` is NULL when the column is
null, so the arm is NULL and CHECK passes. Only when every column carries its own null test are both
the governance and command rows rejected. C3 was required to name its mechanism; C4 was not, on the
third round of the same bug.

**D3 — the contract-site list is still incomplete, by v3's own argument.**
`target_principal_id` — the subject of every access event — has no read path:
`apps/server/src/audit-repository.ts:128-141` is an explicit column list without it, and the single
`leftJoin` at `:143-146` resolves only the actor's display name. A target name needs a second
aliased join, a DTO field, a table column, and bilingual copy, and adding the column is itself an
unlisted site: `owner-audit-view.test.tsx:235` asserts exactly six `thead th[scope='col']`.

**D4 — the reason digit-run rule is a product decision.** Executed on governance rows:

| reason | result |
| --- | --- |
| `closing ticket TCK-2026-081501` | rejected |
| `member 1012345678 asked for a new card` | rejected |
| `new PIN 4 8 2 9 1 3` | **accepted** |
| `الرمز الجديد ۴۸۲۹۱۳` (U+06F0–06F9) | **accepted** |

Under `SPEC.md:212-214` the refusal aborts the credential mutation. The rule forbids an owner from
recording any six-digit run while admitting the spaced form of the secret it targets. The human
decision locks what the system stores in audit state; it does not authorize restricting the content
of an owner-authored field.

## Non-blocking findings

- **N1** — the integer secret channel is not fully closed: `new_credential_version = 482913` was
  accepted on `staff_pin_rotated`, `credential_reset` and `staff_pin_provisioned`. Item 7 closes the
  four count columns; item 10 adds two integer columns bounded only by `> 0`, and C3 makes both
  mandatory on exactly the two PIN-revealing actions. Lower severity than v1's channel because it is
  code-controlled, but "closes the integer secret channel" is overstated.
- **N2** — `[0-9٠-٩]` misses Extended Arabic-Indic U+06F0–06F9.
- **N3** — C1's stated rule is wider than true and wider than item 6 obeys; the real rule is "no
  *new* label as a bare enum literal".
- **N4** — the "not additive" ground for withdrawing `MATCH FULL` applies equally to items 6, 8 and
  9, which also drop and re-add constraints. The other ground given is sufficient and confirmed.
- **N5** — `PROJECT_STATE.yaml` carries no work item for this generalization, and
  `phase11-access.handoff` still points at the 2026-08-11 reconciliation record rather than the
  authority-resolved one.

## Confirmed — now established fact, not claim

- **C1 in full.** `ALTER TYPE … ADD VALUE 'zz_probe'` plus `CHECK (action <> 'zz_probe')` in one
  transaction fails with `unsafe use of new value`. The full proposed migration — all eight
  `ADD VALUE`s, every action-naming constraint as `action::text` — **committed in one transaction**
  over a table holding three command rows, all backfilled to `event_class = 'command'` unchanged. A
  type created in the same transaction *is* usable as a bare literal. Post-commit the `::text` rules
  reject a bad INSERT, a reason-nulling UPDATE, and an action-changing UPDATE.
- **C2, both halves.** `packages/api/src/audit/types.ts:6-18` has no `commandIssuerClass`;
  `commands/service.ts:142-150`, `:185-192`, `:216-223` never set it; the baseline column is
  `NOT NULL DEFAULT 'human'`. Drizzle emits `default` for an omitted or `undefined` value and a
  bound null for an explicit null. A governance write omitting it is rejected by the linkage check;
  with an explicit null it is accepted. `phase7-integration.integration.test.ts:409,414` do assert
  `command_issuer_class: "human"`.
- **C3.** The `is true`/`is false` rules reject `owner_deactivated` with null booleans, the reversed
  transition, and `staff_pin_rotated` with null or non-monotonic versions; they admit true→false
  with reason, false→true, and 1→2.
- **C4's premise.** Against a replica of `application.ts:401-408`, an owner-kind/null-role row is
  accepted today, and the downstream consequence is real: `list.ts:204` throws and
  `audit-repository.ts:151-153` maps the whole page, so one bad row 500s the owner audit view.
- **C5.** `access`+`reset`, `settings`+`credential_reset` and `command`+`owner_deactivated` are all
  rejected at write.
- **Item 7.** Each count column individually and all four together rejected on governance rows;
  command rows unaffected.
- Also: `audit_log_command_unique` still rejects a second row per command; multiple governance rows
  with null `command_id` coexist; access without target, settings without version, access with a
  `command_id`, and a command row with a governance column are all rejected; `staff_pin_rotated`
  without a reason is accepted and both deactivations without one are rejected.
- **Citations checked and accurate:** `use-owner-audit.ts:25`, `:122-127`, `:128-129`;
  `owner-audit-view.tsx:128-137`; `messages.ts:12,22,77,85` and `:33-35`/`:96-98`;
  `SPEC.md:168-169` and `:212-214`; `application.ts:375-377`; `retention-repository.ts:32-34`;
  `auth.ts:87-90`.

## Left unverified by the reviewer, said plainly

- Whether any live `audit_log` contains an owner-kind/null-role row. Settled afterwards by the
  coordinator against the real database — see v4.
- The 2026-08-15 human decision itself, which the reviewer had no evidence for beyond the
  proposal's assertion.
- `apps/web` typecheck and browser behaviour, there being no implementation yet.

## Implementation note the reviewer supplied

A data-modifying CTE cannot see its own insert, so `with ins as (insert …) update …` silently
updates zero rows and passes for the wrong reason.
