# Coordinator audit generalization — proposal v4

- Recorded: 2026-08-15 22:45 +03:00.
- Status: `IMPLEMENTATION_READY`, subject to the ordinary independent verification of the resulting
  candidate. Authorizes a coordinator-owned migration and the contract work named below.
- Supersedes v3 (`20260815-180000`). v1, v2, the v2 rejection, and the v3 rejection
  (`20260815-224000-audit-generalization-v3-rejected.md`) are immutable history.
- The constraints in `20260815-013000-audit-generalization-design.md` still bind.
- The human decisions in `../phase11-access/20260811-154032-...` still bind and are not re-opened.

## Why there is no fourth design round

The third review returned `REJECT` with four blocking defects, and it also **executed and confirmed**
the parts that were genuinely uncertain: that the full migration commits in one transaction with all
eight `ADD VALUE`s and every action-naming constraint written as `action::text`; that the `::text`
rules still reject a bad INSERT, a reason-nulling UPDATE and an action-changing UPDATE after commit;
that keeping `DEFAULT 'human'` on a nullable `command_issuer_class` behaves exactly as v3 claimed,
including drizzle emitting an explicit null that suppresses the default; that the `is true`/`is
false` state rules reject what they must; that binding action to event class rejects at write; and
that the four count columns are closed on governance rows. Those are now established facts, not
claims.

Of the four blocking defects, one is dropped scope, one is a specification the implementer needs
spelled out, one is added scope that is concrete and testable, and one is settled by evidence the
reviewer explicitly said only the coordinator could gather. None of them is new design. A fourth
design round would re-litigate settled ground; the implementation candidate goes through ordinary
independent verification instead.

## D1 — settled by evidence, not by argument

The reviewer demonstrated that tightening the actor rule on the command path is not additive **if a
legacy owner-kind/null-role row exists**, and that such a row would abort the whole migration because
drizzle wraps all pending migrations in one transaction. It also recorded, correctly, that only the
coordinator could check the real database.

Checked, read-only, against the real database:

```
database: fitway_local_coord
audit_log rows: 0
```

`audit_log` is empty. Production is not provisioned — it remains an external go-live gate in
`RESEARCH.md` — so `fitway_local_coord` is the only real database this migration can meet. No
existing row can violate the new constraint, and the full tightening is therefore safe here.

**This is evidence, not a licence.** The implementation must:

1. re-run that count immediately before generating the migration and record the result in the
   candidate's handoff;
2. treat a non-zero, non-conforming count as a stop condition, not as something to repair by
   editing audit rows — audit immutability forbids that;
3. state plainly in the migration's own comment that the full actor tightening is safe **because
   the table was empty**, so that a future environment with real rows is not silently assumed.

## D2 — the null-safe actor rule, written out

v3 said "null-safe on every column in every arm" without naming the mechanism, and the reviewer
demonstrated that the natural rendering still accepts the exact row the rule exists to reject:
`actor_role = 'owner'` is NULL when the column is NULL, so the arm is NULL and CHECK passes. This is
the same failure mode C3 was raised for. Every column in every arm carries its own null test:

```sql
(
     (command_issuer_class is not null and command_issuer_class = 'human'
  and actor_principal_id  is not null
  and actor_principal_kind is not null and actor_principal_kind = 'shared_staff'
  and actor_role          is not null and actor_role           = 'staff')
  or (command_issuer_class is not null and command_issuer_class = 'human'
  and actor_principal_id  is not null
  and actor_principal_kind is not null and actor_principal_kind = 'owner'
  and actor_role          is not null and actor_role           = 'owner')
  or (command_issuer_class is not null and command_issuer_class = 'system'
  and actor_principal_id  is null
  and actor_principal_kind is not null and actor_principal_kind = 'system'
  and actor_role          is null)
  or (command_issuer_class is null
  and actor_principal_id  is not null
  and actor_principal_kind is not null and actor_principal_kind = 'owner'
  and actor_role          is not null and actor_role           = 'owner')
)
```

The fourth arm is the governance path: `command_issuer_class` is explicitly null there, and only a
real owner may author a governance event. A test must assert that an owner-kind row with a null role
is rejected on **both** the command and governance paths — it is accepted today on the command path,
which is a pre-existing hole this closes.

## D3 — the target read path, added to this slice's scope

v3 argued that requiring data without assigning its rendering leaves the column empty for governance
rows, and then did exactly that with `target_principal_id`, the subject of every access event. The
reviewer verified there is no read path at all: `apps/server/src/audit-repository.ts:128-141` is an
explicit column list without it, and the single join at `:143-146` resolves only the actor's display
name.

This slice therefore also owns:

- a second aliased join resolving the target principal's display name;
- the target field in the audit list DTO and in `packages/api/src/audit/list.ts`;
- the target column in `apps/web/src/components/owner/audit/owner-audit-view.tsx`, with bilingual
  header and an honest empty rendering for command rows, which have no target;
- updating `owner-audit-view.test.tsx:235`, which asserts exactly six `thead th[scope='col']`.

## D4 — the reason digit-run rule is dropped

The reviewer executed it and showed what it actually does:

| reason | result |
| --- | --- |
| `closing ticket TCK-2026-081501` | rejected |
| `member 1012345678 asked for a new card` | rejected |
| `new PIN 4 8 2 9 1 3` | **accepted** |
| `الرمز الجديد ۴۸۲۹۱۳` | **accepted** |

Under `SPEC.md:212-214` the mutation and its audit row share one transaction, so a rejected reason
aborts the deactivation itself. The rule would forbid an owner from recording a ticket number, a
phone number, or a national ID in a deactivation reason, while admitting the spaced form of the very
secret it targets.

**It is dropped, and this is not an escalation.** The human decision locks what the *system* may
store in audit state: PINs, passwords, hashes, salts, pepper-derived values, and session tokens must
never be stored or emitted. It does not speak to the content of an owner-authored free-text field.
`reason` already has an accepted treatment — `audit_log_reason_short_trimmed`, length 1–240 and
trimmed — and governance rows inherit it unchanged. Declining to add a new restriction requires no
authority; adding one would have. No new product decision is made here and none is needed.

**Named residual, carried to go-live review:** an operator can type a secret into a free-text reason.
This is equally true of every correction and reset reason accepted since Phase 5, so the
generalization neither introduces nor worsens it. It is a matter for operator guidance and the
transparency wording already listed as an external gate in `RESEARCH.md`, not for a constraint that
rejects legitimate content and misses the attack.

## N1 — the credential-version channel, closed structurally rather than claimed closed

The reviewer showed `new_credential_version = 482913` is accepted, so "closes the integer secret
channel" was overstated: item 7 closes the four count columns, and item 10 then opens two integer
columns bounded only by `> 0`.

The closure is structural, not numeric. An arbitrary numeric ceiling would be a guess. Instead:

- the governance write path reads `prior_credential_version` and `new_credential_version` from the
  `auth_principals` row inside the same transaction as the mutation, and **never** from procedure
  input;
- no input schema on any access procedure carries a credential-version field;
- a test asserts that the values written equal the principal's actual versions, so an operator has
  no channel to place a chosen integer there.

The `> 0` check stays, mirroring `packages/db/src/schema/auth.ts:87-90`. What remains is that a
credential version is a small monotonic counter and is not secret material; that is a statement about
the data, and it is recorded rather than asserted as a proof.

## Smaller corrections the review earned

- **N3.** The C1 rule is restated correctly: **no _new_ enum label may appear as a bare literal in
  the same transaction that adds it.** Pre-existing labels — the three command actions in item 6 —
  remain correct as bare literals, and a type created in that same transaction is usable as one.
- **N4.** `MATCH FULL` is withdrawn on the sufficient ground only: under the class check a
  partial-null row is unreachable before the FK is consulted, and the reviewer confirmed that a
  dangling `command_id` with a null issuer class on a command row is already rejected by the linkage
  check. The "not additive" reason is dropped — items 6, 8 and 9 also drop and re-add constraints.
- **N5.** `PROJECT_STATE.yaml` gains a tracked `phase11-audit-generalization` milestone, and
  `phase11-access.handoff` is repointed from the 2026-08-11 reconciliation record to its
  authority-resolved record.

## Carried forward unchanged

Extend `audit_log` rather than fork it; typed governance columns rather than JSON; the explicit
`event_class` discriminator; item 7's closure of the four count columns on governance rows; keeping
`DEFAULT 'human'` on a now-nullable `command_issuer_class` with the governance path passing an
explicit null; the `is true`/`is false` state rules; binding action to event class; the eleven action
labels; and the requirement that every action-naming constraint use `action::text`.

Governance provenance inherits the 12-month audit expiry. Rollback is clean only until the first
governance row is written.

## Verification the candidate must produce

Everything the third review executed, re-run against the candidate's own migration, plus:

- the pre-flight count, recorded, with a non-conforming row treated as a stop;
- an owner-kind row with a null role rejected on the command path **and** the governance path;
- a governance write omitting `command_issuer_class` rejected; with an explicit null, accepted;
- an `access` row carrying a command action rejected at write, not on read;
- `staff_pin_rotated` without a reason accepted; both deactivations without a reason rejected;
- a reason containing a ticket number **accepted**, which is the D4 change and must be proved, not
  assumed;
- credential versions written equal to the principal's actual versions, with no input path to them;
- a governance row rendered in both locales and both directions, with its target resolved, and
  `apps/web` typechecking;
- the existing Phase 5, 7 and 11-audit suites green, including
  `phase7-integration.integration.test.ts:409,414`.

Implementation note the reviewer supplied and the implementer must heed: a data-modifying CTE cannot
see its own insert, so `with ins as (insert …) update …` silently updates zero rows and passes for
the wrong reason.
