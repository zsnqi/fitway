# Batch 02 activation record

- Status: `READY`; worker sessions pending
- Integrated feature baseline: `f043611a4bfa9f208b06e51c90aa54affeb87d34` (phase4-health closure)
- Coordinator activation commit: `SELF`
- Coordinator branch: `main`
- Activated at: `2026-07-17T13:30:00+03:00`
- Feature implementation in activation commit: none

## Selected slices

This batch merges `PHASES.md` batch 1C with the immediately eligible slice of batch 2. Both
eligibility conditions closed with the phase4-health integration (`4a59ca2`, recorded in
`docs/phase-records/handoffs/phase4-health/20260716-232500-p4_health_b01-integration.md`).

| Slice | Readiness reason | UI polish |
| --- | --- | --- |
| `phase4-staff-web` | `phase4-auth` and `phase4-health` are `DONE`: the real PIN/session endpoints, canonical auth context, and the integrated `staff.operationalSnapshot` DTO all exist, so the UI binds to real contracts instead of the retired scaffold | REQUIRED: full phase polish loop; owns `VIS-004`; `VIS-001`/`VIS-002` only via the shared shell/atmosphere leases |
| `phase8-alert-evaluator` | `baseline-reconciliation-gate`, `phase-3`, and `phase4-health` are `DONE`: the schedule module and the `edgeCurrentHealth` projection this evaluator consumes read-only are integrated; the ordered migration lane is free and reallocates as `0004` | `NOT_REQUIRED`; backend-only slice |

## Concurrency safety

The two slices are disjoint on every axis the workflow protects:

- **Paths** — staff-web owns/leases only `apps/web/**`, additive `packages/ui` primitives,
  and its new browser spec; the evaluator owns/leases only new `packages/api/src/alerts/**`,
  two new server files, and the schema/migration-0004 lane. No file appears in both
  contracts.
- **Migration lane** — single holder: only `phase8-alert-evaluator` holds the `0004` lease;
  staff-web has no schema surface. Migrations `0000`–`0003` are immutable for both.
- **Shared spine** — neither slice touches context/router/server-index, edge wire schemas,
  OpenAPI, or public payload code this batch; staff-web consumes the integrated contracts
  read-only over HTTP/oRPC.
- **Resources** — distinct run IDs, ports, disposable databases, and output roots (below).

Not activated: `phase-4` (coordinator aggregate; eligible only after staff-web integrates),
`phase8-integration` (waits for `phase-7`), and everything else remains `PLANNED` per the
ledger. No other worktree may be created from this batch.

## Contract sources

The binding execution contracts are
`docs/phase-records/handoffs/phase4-staff-web/20260717-133000-p4_staff_b02.md` and
`docs/phase-records/handoffs/phase8-alert-evaluator/20260717-133000-p8_alert_b02.md`,
derived from:

- `SPEC.md` 384–457 and 528–536 — the frozen staff PIN/session contract, role/401/403
  rules, the `staff.operationalSnapshot` DTO, and the `/login`, `/staff`, `/admin` routes;
- `SPEC.md` 577–584 and 329–358 — the frozen alert policy defaults and the append-only
  health/alert log data model; 414–428 — the current-health boundary Phase 8 must not
  redefine;
- `PHASES.md` Phase 4 and Phase 8 slice definitions and the batch 1C/2 rows;
- ADR-002 (principals/sessions), ADR-003 (edge authority), ADR-004 (time/business day);
- `DESIGN_GUIDE.md`, `visual-direction-gate/approved/APPROVAL_MANIFEST.yaml`, and
  `docs/POLISH_BACKLOG.md` (`VIS-001`, `VIS-002`, `VIS-004` boundaries) for the UI slice;
- `docs/phase-records/handoffs/phase4-health/20260716-232500-p4_health_b01-integration.md`
  — lease release and the integrated prerequisites for this batch.

## Resource allocation

| Slice | Branch / worktree | Run ID / port | Disposable database | Output |
| --- | --- | --- | --- | --- |
| `phase4-staff-web` | `work/phase4-staff-web-b02` / `D:/Projects/fitway-worktrees/phase4-staff-web` | `p4_staff_b02` / `18412` | `fitway_integration_p4_staff_b02` | `output/playwright/p4_staff_b02` in its worktree |
| `phase8-alert-evaluator` | `work/phase8-alert-evaluator-b02` / `D:/Projects/fitway-worktrees/phase8-alert-evaluator` | `p8_alert_b02` / `19517` | `fitway_integration_p8_alert_b02` | `output/playwright/p8_alert_b02` in its worktree |

Both databases are provisioned in the guarded local Postgres container (listener `55432`);
both web ports were verified free at activation. Report and review directories are
`<output>/report` and `<output>/review`. Canonical screenshots are read-only for both
slices; staff-web visual evidence goes to its review directory and any canonical baseline
addition is a separate serialized human-approved pass.

## Ownership, leases, and lanes

- **`phase4-staff-web` owns** its routes (`login`/`staff`/`admin`/`_auth`), staff
  components, the scaffold `sign-in-form.tsx` (for deletion), the auth client replacement,
  `use-staff-*` hooks, its browser spec, and its handoff directory. **Leases:** route-tree
  regeneration, ar/en message catalogs (additive keys), `__root.tsx` shell,
  `index.css` + `public-atmosphere.tsx` (CSS-only `VIS-001`/`VIS-002` polish), and
  additive-only new `packages/ui` primitives. All server/API/db/env code is forbidden and
  consumed read-only.
- **`phase8-alert-evaluator` owns** new `packages/api/src/alerts/**`,
  `apps/server/src/alert-repository.ts`, its integration test, and its handoff directory.
  **Migration `0004` lease:** `packages/db/src/schema/application.ts` (two append-only log
  tables only), the generated `0004_*` migration, its `meta/0004_snapshot.json`, and one
  append-only journal entry. No router/context/server exposure, no Telegram transport, no
  cron, no env change.
- Coordinator retains everything else, including the edge protocol spine, OpenAPI, public
  payload code, context/router/server aggregation, env schemas, root manifests/lockfile,
  test/config scripts, and canonical visual baselines. The two focused verification
  profiles in `scripts/verify.mjs` were registered by this activation commit.

## Verification and integration gates

Focused worker commands (each with its assigned run ID, database, port, and output root):

- `pnpm verify:phase --phase phase4-staff-web` — fast ladder + focused browser spec; gates:
  unit/component, browser, accessibility, visual review; `integration: NOT_REQUIRED`
  (no owned integration test; auth/snapshot integration evidence is already integrated).
- `pnpm verify:phase --phase phase8-alert-evaluator` — fast ladder + focused disposable-
  Postgres integration test; browser/accessibility/visual `NOT_REQUIRED`.

Repair is bounded to two focused attempts per gate; the third recurrence is
`FAILED_VALIDATION`. Each candidate then requires a fresh independent verifier `PASS` on the
exact candidate commit with its own run ID and disposable database, without editing the
candidate.

Integration prerequisites and merge order:

1. Integrate `phase8-alert-evaluator` first once verified: additive backend, sole
   migration-lane holder; gates — diff confined to owned paths and the `0004` lease;
   `0000`–`0003` SQL/snapshot hashes unchanged; exactly one new ordered migration `0004`;
   no write path into any pre-existing table; public payload v2 free of health/alert
   surface; coordinator reruns the focused command post-merge with a fresh run ID/database.
2. Integrate `phase4-staff-web` second: gates — diff confined to owned paths and recorded
   web leases; scaffold auth flow fully removed, not bypassed; no canonical screenshot
   changes (any baseline addition is a separate human-approved pass); `VIS-001`/`VIS-002`/
   `VIS-004` evidence within `docs/POLISH_BACKLOG.md` boundaries; both-locale polish-loop
   evidence recorded; coordinator reruns the focused command post-merge with a fresh run
   ID/database.
3. If staff-web verifies first it waits for the evaluator only if the evaluator is also
   `READY_FOR_INTEGRATION`; otherwise the coordinator may integrate staff-web alone —
   ownership is fully disjoint — and integrates the evaluator later under the same gates.
4. At the completed batch, run `pnpm verify:full` with a new exact disposable database;
   worktree clean before and after; only then are leases released and slices marked `DONE`
   with integrated commits and evidence. `phase-4` aggregation is a subsequent
   coordinator-only step, not part of this batch.

Merge stops on an out-of-scope path, migration ordering conflict, missing independent
review, public-v2 privacy regression, scaffold-auth survival, unauthorized canonical
baseline change, Product/Spec conflict, or any red required gate.

## Activation invariant

This coordinator-only activation commit is the sole child of the integrated baseline
`f043611a4bfa9f208b06e51c90aa54affeb87d34` and contains only live state, the two launch
contracts, this record, and the focused verification profiles. Both worker branches start at
this activation commit; `git rev-parse HEAD^` must resolve to the integrated baseline before
feature work begins.
