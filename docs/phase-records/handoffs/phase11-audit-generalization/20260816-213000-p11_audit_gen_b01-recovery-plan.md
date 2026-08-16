# Phase 11 audit generalization b01 — interrupted-work recovery plan

- Mode: `plan`; this record changes no production implementation.
- Recovery branch / worktree: `codex/phase11-audit-gen-recovery` /
  `D:/Projects/fitway-worktrees/phase5-staff-integration`.
- Current clean checkpoint: `cf5d714`, containing the preserved migration/schema commit and the
  interrupted API/server checkpoint reconstructed onto current `main`.
- Repair budget: `0/2`. Recovery and completion of an interrupted stage are not failed-gate repairs.
- Concurrent writers: `0`.

## Objective

Complete activated Slice A so `audit_log` can represent and serve command, access, and settings
events without breaking the existing command path: the generalized transport carries event class,
all eleven actions, an honest resolved target, nullable command counts, and typed governance state;
the repository maps governance rows instead of failing the page; the migration and write builders
prove every v4 constraint; existing Phase 5, 7, and 11-audit behavior remains green; and a fresh
verifier can review a clean candidate. Slice B (`apps/web` target rendering/copy/filter work) remains
separate and blocked behind Phase 10.

## Locked authority

- `20260815-224500-audit-generalization-proposal-v4.md` and the b01 activation are binding.
- Preserve the migration/schema and second target-principal join unless a stated gate proves a
  defect.
- The seven approved access actions, secret-free rule, owner lifecycle decisions, reason treatment,
  and transaction-local credential-version source are immutable.
- No wiring, web, command-service, alert, earlier migration, root config, normative document, or
  unrelated phase path may change.

## Stage 1 — generalized transport and focused unit proof

Writable files:

- `packages/api/src/audit/list.ts`
- `packages/api/src/audit/list.test.ts`
- `packages/api/src/audit/governance.test.ts` (new)
- `apps/server/src/audit-repository.ts`
- `apps/server/src/audit-repository.test.ts`

End state:

- the output DTO and action filter accept all eleven persisted actions;
- every entry carries `eventClass`, a resolved nullable target, nullable command counts, and the
  typed governance state needed to render honest from/to values;
- `toAuditEntry` reasserts class/action, actor, target, command-count, access-state/version, settings
  version, reason, and timestamp coherence, then maps access/settings rows rather than rejecting;
- the server projects every mapped field and resolves actor and target through separate joins;
- focused tests cover command compatibility, both governance classes, secret-free shape, target
  resolution, filters, and builder invariants.

Rollback: revert the single Stage 1 commit, returning to clean recovery checkpoint `cf5d714`.

Verification fixed before execution:

1. `pnpm exec biome check` on the five Stage 1 files.
2. `pnpm exec vitest run packages/api/src/audit/list.test.ts packages/api/src/audit/governance.test.ts apps/server/src/audit-repository.test.ts`.
3. `pnpm check-types`.
4. `git diff --check` and exact scope audit.

## Stage 2 — migration/write-path integration proof

Writable file:

- `apps/server/src/phase11-audit-generalization.integration.test.ts` (new)

Precondition: re-run the read-only `fitway_local_coord.audit_log` count. Non-zero is a stop
condition; never repair immutable audit rows.

The integration test must prove the candidate migration and v4 verification list, including:

- null-role owner rows rejected on command and governance paths;
- omitted `command_issuer_class` rejected and explicit null accepted;
- action/event-class mismatch rejected at write;
- rotation without reason accepted, both deactivations without reason rejected, and a ticket-number
  reason accepted;
- governance count columns closed;
- credential versions equal the actual principal-row snapshots and no input schema carries them;
- target display name resolves through the generalized repository;
- existing command rows and default `'human'` behavior remain unchanged.

Rollback: revert the Stage 2 test commit; Stage 1 remains independently buildable and unit-tested.

Verification fixed before execution:

1. focused new integration file on exact disposable database
   `fitway_integration_p11_audit_gen_b01r`;
2. existing `phase5-command-domain.integration.test.ts`,
   `phase7-integration.integration.test.ts`, and `phase11-audit.integration.test.ts` on the same
   guarded run-owned database in serialized runs;
3. `pnpm verify:fast`;
4. clean mutation guard and candidate handoff.

## Stage 3 — independent verification

A fresh read-only verifier reviews the complete Slice A diff against v4 and the activation, reruns
the focused unit/integration gates with separate `p11_audit_gen_v01r` resources, and returns PASS or
findings without repairing. Only after PASS may the coordinator integrate Slice A. Slice B is a
later activation, not an extension of this writer's scope.

## Stop conditions

Stop on non-zero preflight rows, any need for leased wiring or `apps/web`, a human-locked access
decision change, a change to migrations `0000`–`0006`, a privacy/security ambiguity, or a third
recurrence of one failed gate after two focused repairs.
