# phase-6 activation handoff

- Status: `READY` — activated, unlaunched. No feature code exists for this slice.
- Base commit / candidate commit: base is the batch-05 activation commit (`baseCommit: SELF`,
  the only child of `06486487914c5a78afb3aa6e264e6988e0c5cb85`); no candidate yet.
- Branch / worktree / run ID: `work/phase6-offline-b01` /
  `D:/Projects/fitway-worktrees/phase6-offline` / `p6_offline_b01`
- Owned paths / shared leases used:
  - Owned: `packages/api/src/offline/**`,
    `apps/server/src/phase6-offline.integration.test.ts`,
    `docs/phase-records/handoffs/phase-6/**`
  - Leased, exclusive through 2026-08-16T18:30:00+03:00: `packages/api/src/edge-push.ts` and
    `edge-push.test.ts`, `apps/server/src/edge-push.ts`, `apps/server/src/openapi.ts`,
    `packages/api/src/occupancy/engine.ts` and `engine.test.ts`,
    `apps/server/src/occupancy-repositories.ts`, `edge/**`
  - Everything else is forbidden; see the milestone block in `PROJECT_STATE.yaml`.

## Outcome required

Deliver, per `PHASES.md` Phase 6:

1. Automatic offline fallback when the edge cannot reach the cloud.
2. Buffered minute backfill with **history-only** backfill authority — backfill never mutates
   current state.
3. Reconnect ordering in which pending commands apply **before** live authority resumes.
4. A frozen device/OpenAPI contract with TypeScript ↔ Python fixture parity.
5. The ADR-008 decision-6 review: determine whether any valid internal producer of
   `source=manual` remains, for `operationalSnapshotSchema.source`, the occupancy-minute and
   current-state source enums, and the manual-validity freshness window.

Acceptance covers outage, reconnect, duplicate/gap/replay, command ordering, minute idempotency,
current-state protection, and TypeScript/OpenAPI/Python fixture parity.

## Decisions made at activation (with canonical source)

- **Gates.** `browser`, `accessibility`, and `visual` are `NOT_REQUIRED`. Phase 6 "introduces no
  staff-facing manual fallback and no new staff or owner command surface" (`PHASES.md` Phase 6),
  and the polish-loop invariant binds a UI-producing phase. Do not create UI to satisfy a gate.
- **No migration.** `packages/db/**` is forbidden with no lease. `PHASES.md` keeps one
  coordinator-controlled migration stream; the latest migration is `0005`. If Phase 6 genuinely
  requires schema, stop and escalate for a lease — do not hand-author a `0006`.
- **No exposure.** `packages/api/src/routers/**`, `context.ts`, and `apps/server/src/index.ts`
  are forbidden. Phase 6 changes edge-side behavior and the device contract; it adds no router
  leaf.
- **ADR-008 decision 6 is a decision, not a licence.** The enum values and the settings field are
  retained unchanged until the review concludes. Removing one requires confirming no internal
  producer remains; record the finding and escalate rather than deleting an enum value unilaterally.
- **Paper.** Paper is the final visual source of truth. This slice produces no UI, so no Paper
  production family is consulted or implemented. If the work appears to require a UI surface, that
  is a scope error — stop.

## Changes by file

None. This handoff records activation only.

## Validation commands and results

Not yet run. The required ladder for this slice:

```
pnpm verify:fast
FITWAY_RUN_ID=p6_offline_b01 \
TEST_DATABASE_URL=postgresql://.../fitway_integration_p6_offline_b01 \
FITWAY_INTEGRATION_RESET_DATABASE=fitway_integration_p6_offline_b01 \
FITWAY_PHASE=6 pnpm verify:phase
```

Registered profile: `6` — `browserFiles: []`,
`integrationFiles: ["apps/server/src/phase6-offline.integration.test.ts"]`. That path is owned;
the worker creates the file. Port 20663 is reserved for uniqueness only.

Worktree preparation was completed by the coordinator at activation:
`pnpm install --frozen-lockfile` then `pnpm exec vitest --version`, per `docs/WORKFLOW.md`
"Before creating a phase worktree" steps 7–8. `apps/server/.env` is provisioned.

## Browser/a11y/visual artifacts

None, and none expected. All three gates are `NOT_REQUIRED`.

## Independent verifier findings

None yet. A fresh verifier reviews the diff and reruns independent checks before integration, per
`docs/WORKFLOW.md`; it must not read this worker's reasoning before forming its own assessment.

## Remaining work or exact blocker

All of it. No blocker at activation; every ledger dependency is `DONE`.

## Exact resume command

```
cd D:/Projects/fitway-worktrees/phase6-offline
git status --short --branch
git rev-parse HEAD
pnpm exec vitest --version
```

Then read, in order: `AGENTS.md`; `FITWAY_PRODUCT.md` and the relevant `SPEC.md` sections;
`PHASES.md` and `PROJECT_STATE.yaml`; `docs/adr/ADR-003-edge-authority-and-reconciliation.md` and
`docs/adr/ADR-008-staff-monitoring-only.md`; `docs/phase-records/batch-05-activation.md`; this file.

## Stop/escalation conditions

- Any need to touch `packages/db/**`, a migration, `packages/env/**`, the router/context/server
  index, `scripts/verify.mjs`, or `PROJECT_STATE.yaml` → stop, request a coordinator lease.
- Any need for a staff or owner UI surface → stop; ADR-008 withdrew the staff manual fallback and
  no approved Paper family covers a new Phase 6 surface. `NEEDS_HUMAN`.
- Removing a `source` enum value or the manual-validity settings field before the decision-6
  review concludes → `NEEDS_HUMAN`.
- A Product/Spec conflict, privacy/security ambiguity, or unleased shared-file requirement →
  `NEEDS_HUMAN`.
- The same gate failing after two focused repair attempts → `FAILED_VALIDATION`; do not reset the
  count by changing sessions.
- Lease expiry 2026-08-16T18:30:00+03:00. Check it at startup and before every leased-file edit;
  an expired lease requires coordinator renewal and immediate `NEEDS_HUMAN`.
