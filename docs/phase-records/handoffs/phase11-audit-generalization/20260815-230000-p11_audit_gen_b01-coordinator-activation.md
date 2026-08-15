# Phase 11 audit generalization — b01 coordinator activation

- Status: `PLANNED -> IN_PROGRESS`. Repair budget `0/2`. No prior implementation attempt exists —
  the three prior rounds were design reviews, not candidates.
- Branch / worktree / run ID: `work/phase11-audit-gen-b01` /
  `D:/Projects/fitway-worktrees/phase11-audit-gen-b01` / `p11_audit_gen_b01`.
- Base: `b5a9cef` on `main`. Worktree provisioned: `pnpm install --frozen-lockfile` clean,
  `pnpm exec vitest --version` prints `vitest/4.1.10`, root `.env` and `apps/server/.env` present.
- Dependencies: `phase11-audit`, `DONE` at `748f759`.

## The design is settled; this is implementation

`docs/phase-records/handoffs/coordinator/20260815-224500-audit-generalization-proposal-v4.md` is the
binding design. Three independent design reviews preceded it and the third executed most of it
against real PostgreSQL 17.10; its confirmations are recorded in
`20260815-224000-audit-generalization-v3-rejected.md` and are **established fact, not claims to
re-derive**. Read v4 first, then the v3 rejection for the executed evidence, then
`20260815-013000-audit-generalization-design.md` for the constraints that still bind.

Do not redesign. If you believe v4 is wrong somewhere, escalate with the evidence rather than
choosing differently.

## Slice A — this activation

This activation covers the schema, the migration, the API contracts, and the server read path. It
stops short of `apps/web`.

`apps/web` is deliberately excluded because `phase10-ui-csv` is concurrently writing there, and the
one regression this project has lost an integration to was two `/admin` slices interacting. The web
half of D3 — the target column, its bilingual copy, the `effectiveMode` filter option, and the
`owner-audit-view.test.tsx:235` header-count assertion — is Slice B, activated after
`phase10-ui-csv` integrates.

Owned:

- `packages/db/src/schema/application.ts` — the `audit_log` extension only
- `packages/db/src/migrations/0007_*.sql`, `meta/0007_snapshot.json`, `meta/_journal.json`
- `packages/api/src/audit/**`
- `apps/server/src/audit-repository.ts` and `apps/server/src/audit-repository.test.ts`
- `apps/server/src/phase11-audit-generalization.integration.test.ts` (new)
- `docs/phase-records/handoffs/phase11-audit-generalization/*-p11_audit_gen_b01-worker-*.md`

Forbidden, and these are hard:

- `apps/web/**` in its entirety, and `tests/browser/**`
- `packages/api/src/context.ts`, `packages/api/src/routers/index.ts`, `apps/server/src/index.ts` —
  under a live `phase10-ui-csv` wiring lease. If Slice A genuinely cannot land without one of them,
  that is an escalation, not an edit.
- `packages/api/src/analytics/**`, every reporting surface, and every Phase 10 path
- `packages/api/src/commands/**` and `packages/api/src/alerts/**` — frozen accepted authority
- every migration `0000`–`0006` and their snapshots; `0000` and `0001` are immutable
- `packages/auth/**`, `packages/env/**`, `packages/ui/**`, `edge/**`
- `PROJECT_STATE.yaml`, `scripts/verify.mjs`, `scripts/verify-repository.mjs`
- `visual-direction-gate/**`, Paper, and every normative document including `PHASES.md`
- root manifests, lockfiles, environment schemas, test-runner configuration
- every other milestone's phase record and handoff directory
- the seven approved access action labels, the secret-free rule, and the lifecycle decisions in
  `../phase11-access/20260811-154032-...` — human-locked, not open to reinterpretation

## The governance write path is not in this slice

This slice makes the table and the contracts able to *represent* access and settings events, and
makes the existing owner audit read surface able to carry them. It does **not** author the access or
settings mutations; those belong to `phase11-access` and `phase11-settings`. Where v4 specifies how
the governance write path must behave — credential versions read from the principal row inside the
transaction, never from procedure input — encode that as a contract and a test seam, and record it
for the consuming slices.

## Non-negotiable specifics from v4

1. **The pre-flight is a gate.** Before generating the migration, count `audit_log` rows that the new
   null-safe actor rule would reject, against the real database. It was zero at 22:45. Record the
   result. **Non-zero is a stop condition** — audit rows are immutable and must not be repaired.
2. **No new enum label as a bare literal** in the transaction that adds it. Every constraint naming
   one of the eleven action labels uses `${table.action}::text`. Pre-existing labels may stay bare.
   A type created in that same transaction is usable as a bare literal.
3. **Every column in every arm of the actor rule carries its own `is not null`.** v4 writes the SQL
   out; use it. The natural rendering was demonstrated to accept the exact row the rule exists to
   reject.
4. **Keep `DEFAULT 'human'` on a now-nullable `command_issuer_class`.** The Phase 5 human command
   path depends on it. The governance path passes an explicit `null`.
5. **No reason content restriction.** The digit-run rule is dropped; `audit_log_reason_short_trimmed`
   is the whole treatment of `reason`. A reason containing a ticket number must be **accepted**, and
   a test must prove it.
6. A reason is required for `staff_pin_deactivated` and `owner_deactivated` **only**.
7. `action` is bound to `event_class`; a mismatched row is rejected at write, not on read.
8. The four count columns stay closed on governance rows.

Implementation note that already cost a review cycle: a data-modifying CTE cannot see its own
insert, so `with ins as (insert …) update …` silently updates zero rows and passes for the wrong
reason.

## Resources

- worker `p11_audit_gen_b01` / `fitway_integration_p11_audit_gen_b01`
- verifier `p11_audit_gen_v01` / `fitway_integration_p11_audit_gen_v01`
- coordinator `p11_audit_gen_c01` / `fitway_integration_p11_audit_gen_c01`

Never fall back to `DATABASE_URL`, and never destroy a database not named exactly as above. The
real database `fitway_local_coord` is read-only to this slice, and only for the pre-flight count.

## Exit

`verify:fast` plus the new integration test and the existing Phase 5, 7, and 11-audit suites green.
Commit a candidate and stop at `READY_FOR_INTEGRATION`. A fresh verifier reviews before any merge.
Two focused repairs maximum; a third recurrence of the same red gate is `FAILED_VALIDATION`.

Escalate rather than improvise on: a non-zero pre-flight count, any need for a leased wiring file,
any change to a human-locked access decision, any reason to alter migrations `0000`–`0006`, or any
product decision surfacing in the contract.
