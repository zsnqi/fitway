# Phase 11 audit generalization c01 — scope correction and backend-foundation plan v2

- Recorded: 2026-08-16 21:45 +03:00.
- Status: `PLAN_REVIEW_REQUIRED`; this record changes no production implementation.
- Review base: clean `main` at `3bb55f644152210e405f15dcbee5ef8602913ffb`.
- Recovery branch: `codex/phase11-audit-gen-recovery`; the preserved production commits are
  `ba1c4a6` and `cf5d714`. The rejected recovery-plan checkpoint is `a3a4057`.
- Coordinator resource: `p11_audit_gen_c01` / `fitway_integration_p11_audit_gen_c01`.
- Verifier resource: `p11_audit_gen_v01` / `fitway_integration_p11_audit_gen_v01`.
- Repair budget: `0/2`.

## Why v1 was rejected

Independent plan review found a real scope contradiction. An honest shared audit output type carrying
all eleven actions flows into `apps/web`: the table indexes a bilingual catalog containing only the
three command actions. Widening the type while `apps/web/**` is forbidden fails typechecking; hiding
that with a cast would render governance actions as undefined and is prohibited.

The review also found three concrete plan defects: Slice A must supply nullable
`effectiveValue` filter semantics for the later web control; recovery resource names must use the
exact activated c01/v01 allocations; and `baseCommit: SELF` no longer names a reproducible boundary.

## Corrected authority boundary

The coordinator narrows the immediately dependency-safe work to a backend foundation. It may
integrate independently, but it does **not** complete `phase11-audit-generalization`:

- preserve and verify migration 0007, its snapshot, and the generalized database schema;
- preserve the generalized write types and snapshot-based governance builders;
- keep the second aliased target-principal join and project all non-secret governance columns;
- keep the public list output command-only until Slice B can change the shared DTO and its web
  consumer atomically;
- add `effectiveValue: null` filter input and server `IS NULL` translation now, because the later
  web-only `effectiveMode` control cannot lawfully cross back into this API/server slice;
- prove the migration constraints and builders using unit and PostgreSQL integration tests.

No access or settings mutation may start and no governance row may be authored while the read-output
switch remains deferred. `phase11-audit-generalization` stays `IN_PROGRESS` after this foundation is
integrated. Slice B remains blocked behind the unresolved Phase 10 Paper-fidelity decision and must
atomically add the eleven-action DTO, mapper, bilingual labels, target/from-to rendering, filters,
and web tests.

## Stage 1 — API/server foundation and unit proof

Writable files:

- `packages/api/src/audit/list.ts`
- `packages/api/src/audit/list.test.ts`
- `packages/api/src/audit/governance.test.ts` (new)
- `apps/server/src/audit-repository.ts`
- `apps/server/src/audit-repository.test.ts`

End state:

- the existing command output contract remains source- and runtime-compatible;
- the persisted row shape and repository projection include class, target, and all typed governance
  state without exposing credentials or other sensitive principal columns;
- the mapper fails closed on governance rows until the atomic Slice B output switch;
- `effectiveValue: null` is the explicit missing filter and translates to `IS NULL`;
- focused tests prove command compatibility, projection/target aliasing, missing-vs-zero filters,
  and every governance builder invariant, including snapshot-sourced credential versions and the
  absence of secret-shaped input fields.

Verification:

1. Biome on the five Stage 1 files.
2. Focused Vitest for list, governance, and repository tests.
3. `pnpm check-types`.
4. `git diff --check` and exact `3bb55f6..candidate` scope audit.

## Stage 2 — database integration proof

Writable file: `apps/server/src/phase11-audit-generalization.integration.test.ts` (new).

Precondition: re-run the read-only `fitway_local_coord.audit_log` count immediately before the
test stage and record it. Any non-zero row is a stop; immutable audit history is never repaired.

The test applies the candidate migration to the exact c01 database and proves the v4 list: null-role
rejection on command and governance paths; omitted issuer rejection and explicit-null acceptance;
action/class binding; governance count closure; rotation without reason; both deactivation reason
requirements; ticket-number reason acceptance; credential/state coherence; and the retained human
default. The target alias/projection seam is proved by the focused repository unit test until Slice B
can map governance rows. Existing Phase 5,
7-integration, and Phase 11-audit integration suites run serially on the same guarded c01 database.

Then run `pnpm verify:fast`, record a clean mutation guard, and commit a backend-foundation handoff.

## Stage 3 — independent verification

A fresh read-only verifier uses the exact v01 resource, reviews `3bb55f6..candidate` against v4,
this correction, and the activation, and reruns the focused gates. The coordinator repairs at most
twice. Only a PASS permits integration of the backend foundation; integration does not mark the
overall milestone `DONE`.

## Stop conditions

Stop on a non-zero preflight count, any governance write path, any need for `apps/web` or shared
wiring, a human-locked decision change, an edit to migrations 0000-0006, privacy/security ambiguity,
or a third recurrence of the same failed validation gate.
