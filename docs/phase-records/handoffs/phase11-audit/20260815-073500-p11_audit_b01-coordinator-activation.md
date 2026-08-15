# Phase 11 audit b01 coordinator activation

- Status: `PLANNED -> IN_PROGRESS`. First attempt, repair `0/2`.
- Branch / worktree / run ID: `work/phase11-audit-b01` /
  `D:/Projects/fitway-worktrees/phase11-audit-b01` / `p11_audit_b01`.
- Base commit: `SELF` — this activation commit.
- Dependencies: `phase-5` and `phase-9` are `DONE`, and `phase11-shell` integrated at `63c3603`,
  which its authority packet required before this slice could start.

## Authority

`docs/phase-records/handoffs/phase11-audit/20260811-135010-p11_audit-authority-packet.md` is the
reviewed, plan-ready authority for this slice and binds in full: observable slice, locked semantics,
reuse and gaps, the database and scope decision, expected owned paths, temporary leases, and
predeclared verification. It was prepared against repository authority point `113b5e8`; the
coordinator has re-checked its assumptions against current `main` and they hold, with the two
clarifications below.

## What changed since the packet was written, and what did not

Re-checked rather than assumed:

- **The keyset index still exists and no migration is needed.** `audit_log_created_id_idx` on
  `(created_at, id)` is present at `packages/db/src/schema/application.ts:396`, and
  `audit_log_command_unique` at `:395`. The packet's "no migration, index, environment, or platform
  change is currently required" stands.
- **`/admin` now renders `OwnerShell`, not `StaffShell`.** The packet predates `phase11-shell`. The
  audit UI mounts inside the owner shell; the lease on `apps/web/src/routes/admin.tsx` covers adding
  the section, not re-litigating the shell.
- **The three actions are unchanged.** `auditAction` at
  `packages/db/src/schema/application.ts:80` is still exactly `correction_delta`,
  `correction_absolute`, `reset`.

## Explicit instruction: do not pre-generalize

The packet is emphatic and the coordinator reaffirms it: **current actions remain exactly
`correction_delta`, `correction_absolute`, and `reset`. Do not pre-generalize access, settings, or
system actions in this slice.**

`docs/phase-records/handoffs/coordinator/20260815-013000-audit-generalization-design.md` records that
`audit_log` is command-coupled — `command_id` is `NOT NULL` with a unique index and a composite
foreign key, `effective_value` is a non-null integer, and a check constraint enumerates only the
three command actions — and that generalizing it is a separate coordinator-owned migration gating
`phase11-access` and `phase11-settings`. That migration comes **after** this slice, deliberately, so
the read contract lands against a stable schema first. A worker that anticipates it will be rejected.

What this slice must do is leave room: the DTO and query shape should not make a later additive
action set impossible, without inventing one now.

## Scope

Owned:

- `packages/api/src/audit/**` — new transport DTO, input/output schemas, strict filters, cursor
  contract. The existing command-write `HumanAuditEntry` with its `Date` is **not** the transport
  DTO.
- `apps/server/src/audit-repository.ts` and `apps/server/src/audit-repository.test.ts` — a list path
  added alongside the existing append repository.
- `apps/server/src/phase11-audit.integration.test.ts`
- `apps/web/src/components/owner/audit/**`, including component-owned bilingual messages and its
  message hook
- `apps/web/src/hooks/use-owner-audit.ts` and `use-owner-audit.test.tsx`
- `tests/browser/phase11-audit.browser.spec.ts` and its Phase 11 audit screenshot subtree
- new `docs/phase-records/handoffs/phase11-audit/*-p11_audit_b01-worker-*.md`

Temporary coordinator leases, exactly four files: `packages/api/src/context.ts`,
`packages/api/src/routers/index.ts`, `apps/server/src/index.ts`, `apps/web/src/routes/admin.tsx`.

Frozen and forbidden: the Phase 5 command service, transaction adapters, and audit append semantics;
`packages/db/**` including schema, migrations, metadata, and any new index; `packages/auth/**` and
every auth surface; the Phase 9 analytics components and the owner shell; generated route trees;
global catalogs and tokens; `PROJECT_STATE.yaml`; `scripts/verify.mjs`; canonical screenshot
baselines outside the new Phase 11 audit subtree; every normative document; every other milestone's
record.

## Locked semantics carried from the packet

- Actor is the stable authenticated principal referenced by the audit row. Shared staff remains one
  real front-desk principal. **Never invent a staff email or per-person identity.** Use persisted
  principal id, kind, role, and `display_name`; expose no credential or session data.
- `from` is nullable `priorValue` and **null never means zero**. `to` is `effectiveValue`. Delta
  reflects the floored effective result; absolute preserves requested/effective parity; reset is
  zero.
- Reason is optional trimmed text up to 240 characters; null stays absent.
- Timestamp is the persisted server `createdAt` UTC instant, emitted as ISO UTC. The UI formats it
  with `formatGymTime`, the configured gym IANA timezone, the selected locale, and Western digits.
  **Browser or device timezone must not affect display or filters.**
- Missing or expired authentication is `401`; staff is `403`.
- Filters are strict: actor, action, from, to, timestamp range, and nullable reason text. From/to are
  numeric exact matches with an explicit missing-prior option for nullable `from`.
- Pagination is newest-first bounded keyset pages over the existing `(created_at, id)` index, stable
  with no duplicate and no skipped row.

## Resources

- worker: `p11_audit_b01` / `fitway_integration_p11_audit_b01`
- verifier: `p11_audit_v01` / `fitway_integration_p11_audit_v01`
- coordinator: `p11_audit_c01` / `fitway_integration_p11_audit_c01`

Playwright derives a run-unique port and output directory from the run ID.

## Verification profile

`scripts/verify.mjs` gains `phase11-audit` with
`browserFiles: ["tests/browser/phase11-audit.browser.spec.ts"]` and
`integrationFiles: ["apps/server/src/phase11-audit.integration.test.ts"]`, in this activation commit.
It is removed again if the attempt terminates unintegrated.

## Stop conditions

Synthetic identities, future action kinds, weakened atomicity, a new migration or index without
evidence, or scope beyond the exact leases is immediate `NEEDS_HUMAN` or replan. Retention cleanup is
separate system work and is not in this slice.

## Exit

The worker completes the phase UI polish loop in both locales, runs the predeclared verification,
commits a candidate, and stops at `READY_FOR_INTEGRATION`. A fresh verifier that did not implement it
reviews before any merge. Two focused repairs maximum; the third recurrence is terminal.
