# Next-batch planning packet after Phase 4

- Status: planning only — no milestone, branch, worktree, lease, or external action is activated
- Planning baseline: Phase 4 aggregate closure on clean `main`

## Newly unblocked candidates

| Candidate | Why it is eligible | Recommended ownership and effort |
| --- | --- | --- |
| `phase-5` | Its sole DAG dependency, `phase-4`, is now `DONE`. | Split before activation into bounded command/audit domain and staff-command UI slices. Use a senior backend/security model for transactional command lifecycle, monotonic/idempotent delivery, audit atomicity, and edge authority; high effort. Assign an experienced accessibility/RTL frontend model only to the later staff UI slice; medium-high effort. |
| `phase9-owner-ui` | `phase9-analytics-domain` and `phase-4` are both `DONE`. | Use a senior frontend/data-visualization model experienced with server-enforced owner guards, RTL/LTR chart/table parity, keyboard/touch semantics, and honest empty/missing/closed/zero states; high effort. A coordinator retains the transport/router aggregation. |

Neither candidate is activated by this packet.

## Remaining dependencies and blockers

- `phase-6` waits for `phase-5`.
- `phase7-reset-evaluator` waits for `phase-5`; `phase7-integration` then also waits for
  `phase-6`; `phase-7` and `phase8-integration` remain blocked behind those milestones.
- `phase-8` waits for `phase8-integration` even though `phase8-alert-evaluator` is `DONE`.
- `phase-9` waits for `phase9-owner-ui`; Phase 10 and the Phase 11 shell consequently remain
  blocked behind Phase 9.
- `phase11-access` has Phase 4 complete but still waits for Phase 5 and Phase 9. The remaining
  Phase 11 slices and Phase 12 retain their recorded upstream dependencies.
- No current ledger item is `BLOCKED`, `NEEDS_HUMAN`, or `FAILED_VALIDATION`. External go-live
  gates remain external and do not authorize speculative implementation.

## Ownership and shared-file risks

- Phase 5 will need a coordinator-owned ordered migration lane and likely API context/router/server
  aggregation, edge command protocol, deterministic integration fixtures, and staff-route/catalog
  work. These are serial shared surfaces; do not launch one broad worker against all of them.
- `phase9-owner-ui` consumes the existing unexposed analytics domain. Exposing it requires an
  explicit coordinator lease for owner procedure/router/server wiring; `/admin`, shared catalogs,
  generated route handling, global styles/tokens, browser resources, and canonical screenshots
  remain shared-risk surfaces.
- Both candidates may need the shared message catalogs and route aggregation. Allocate one holder
  at a time, never hand-edit generated routes, and keep canonical screenshot updates human-gated.
- The public schema-v2 boundary, historical analytics semantics, PIN/session model, and private
  capacity/health boundary are read-only contracts for both candidates.

## Safe parallel combinations and integration ordering

At current DAG granularity, no broad concurrent Phase 5 worktree is safe. After coordinator
planning creates non-overlapping contracts, the safe combination is Phase 5's command/audit
domain slice in its exclusive migration/shared-spine lane alongside Phase 9's presentation slice
only after the coordinator has frozen and serialized the owner analytics transport. Give catalog,
route-generation, router aggregation, server index, database, test-resource, and screenshot
leases to exactly one holder at a time.

Recommended order:

1. Plan and activate bounded Phase 5 slices; integrate its schema/command/audit spine before any
   Phase 5 staff UI binds to it.
2. In parallel only where leases do not overlap, develop Phase 9 owner presentation against the
   coordinator-frozen owner analytics transport; integrate that transport serially before its UI.
3. Run focused post-merge checks after every shared-spine change, then `pnpm verify:full` for the
   completed batch before declaring any slice or aggregate `DONE`.
4. Do not activate Phase 6, 7, 8 integration, Phase 9 aggregate, or Phase 11 from this packet.

## Required activation inputs

Before either candidate starts, record its exact acceptance criteria, owned and forbidden paths,
leases, fresh run ID/database/port/output roots, focused verification profile, verifier assignment,
and integration sequence in `PROJECT_STATE.yaml`. Any Product/Spec conflict, privacy/security
ambiguity, material visual-direction proposal, or unleased shared-file need is `NEEDS_HUMAN`.
