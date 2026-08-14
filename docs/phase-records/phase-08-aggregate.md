# Phase 8 coordinator aggregate closure

- Status: `DONE`
- Aggregate evidence baseline: `f7c231e620e03edbd09c2ef18a0ab8480b37c5e8` (`main`, clean)
- Full-gate evidence commit: `f7c231e620e03edbd09c2ef18a0ab8480b37c5e8`
- Closed by: coordinator, 2026-08-14T21:26:00+03:00
- Push/deploy: none
- Source changed by this closure: none. Aggregate acceptance required no source, test, contract, migration, or configuration change, and none was invented.

## Dependency and slice reconciliation

Both `phase-8` dependencies are `DONE` in `PROJECT_STATE.yaml`, and both recorded integrated commits are ancestors of the aggregate evidence baseline, confirmed by `git merge-base --is-ancestor`. The ledger dependency list and `PHASES.md:220-224` name the same two slices — there is no naming divergence to adjudicate here, unlike Phase 7.

| Slice | Integrated commit | Required gates / independent evidence | Current reconciliation |
| --- | --- | --- | --- |
| `phase8-alert-evaluator` | `7b2fe32394b8c494dd8c59c6f099a8f21ece68c8` | unit, disposable-PostgreSQL integration, independent review; browser/accessibility/visual `NOT_REQUIRED` | PASS; already released to `branch: main`, `worktree: null`, `sharedLeases: []`. `validationRepairAttempts` remains `0` and is preserved unchanged. |
| `phase8-integration` | `6d2a5ee66891957d9a6d0c5fc4505668fb0a04bb` | unit, integration, independent review; browser/accessibility/visual `NOT_REQUIRED` | PASS; released by its own closure to `branch: main`, `worktree: null`, `ownerSession: null`, `sharedLeases: []`, `leaseExpiresAt: null`. `validationRepairAttempts` remains `0` and is preserved unchanged. |

Slice evidence, all preserved and unmodified by this closure:

- `docs/phase-records/batch-02-integration.md` — `phase8-alert-evaluator` integration, and `docs/phase-records/handoffs/phase8-alert-evaluator/20260721-200618-p8_alert_review_b02_retry-verified.md` — its independent verification.
- `docs/phase-records/handoffs/phase8-integration/20260814-133826-p8_integration_b01-plan.md` — the plan, with both rounds of independent plan review recorded in it.
- `…/20260814-165215-…-stage-a-review-pass.md`, `…/20260814-181657-…-stage-b-review-pass.md` — the accepted Stage A and Stage B reviews.
- `…/20260814-190400-p8_integration_b01-worker-stage-c-corrections.md` — the Stage C review's findings, each answered.
- `…/20260814-190800-p8_integration_b01-candidate.md` — the formal complete candidate.
- `…/20260814-211800-p8_integration_b01-coordinator-done.md` — integration, the detached `_v01` verification, closure, and the `git revert -m 1 6d2a5ee` rollback boundary.
- The four b01 worker stage records under `…/handoffs/phase8-integration/*-p8_integration_b01-worker-*.md`.

No active Phase 8 lease, worker reservation, worktree reservation, or assigned validation port remains in the ledger for either dependency. The `phase8-integration` profile in `scripts/verify.mjs` is retained.

## Aggregate acceptance and verification

`PHASES.md:229-231` defines the Phase 8 deliverable as health transitions, alert and recovery logs, Telegram delivery, closed-hour suppression, pre-open escalation, bounded re-alerting, and retention; transport failure remaining distinct from unavailable device health; and all delivery outcomes durable. Coverage by the reconciled slice evidence:

- **Health transitions** — online/offline and reported-flags transitions derived from the accepted evaluator and written inside the alert evaluation transaction. Proved against real PostgreSQL in the composed seam: one connection transition on a stale projection, and none added on a later invocation that finds the same connection state.
- **Alert and recovery logs** — append-only, with recovery notices linked to the alert they resolve through the `alert_log` self-key. The `phase8-alert-evaluator` slice, integrated at `7b2fe32`.
- **Telegram delivery** — a transport behind the frozen one-function `AlertNotifier` boundary, over an injected `fetch` bounded by an abort signal, whose every failure path throws one fixed message that cannot carry the credential-bearing endpoint.
- **Closed-hour suppression and pre-open escalation** — proved end to end through the real authenticated cron route: three hours before opening nothing is claimed and nothing is sent, while the health transition is still recorded because it is not schedule-gated; at exactly the 30-minute pre-open boundary the same condition escalates into one claimed and one delivered row stamped at that instant.
- **Bounded re-alerting** — the 30-minute interval, supplied as frozen policy at the composition boundary per `SPEC.md:595-598`, and mutation-proved: changing either policy constant fails a test.
- **Retention** — 12 months of the audit, edge-health, and alert logs, in one transaction, on a day-quantized cutoff that needs no marker row, no in-process state, and no migration. Referential integrity holds in both directions, each mutation-proved three separate ways.
- **Transport failure distinct from unavailable device health** — a non-2xx Telegram response yields `claimed` then `failed` and still returns `200`, with `current_state`, `edge_current_health`, and `edge_health_log` byte-identical across the failure. A transport outage never degrades device health and never becomes a failing cron.
- **All delivery outcomes durable** — the claimed row is written inside the advisory-locked transaction and the terminal outcome row after it, without mutating the claim or any prior history.

Durable full-gate evidence for this closure:

```text
run id:   p8_aggregate_c01
database: fitway_integration_p8_aggregate_c01   host: 127.0.0.1:55432
command:  pnpm verify:full
commit:   f7c231e620e03edbd09c2ef18a0ab8480b37c5e8 (main, clean)
result:   PASS (exit code 0) at 2026-08-14T21:26:00+03:00
```

Covered, gate by gate: repository invariants at 35 milestones and 8 canonical approval screenshots; Biome across 249 files with no fixes; workspace type checks with no errors; 48 unit files / 282 tests; 18 Python simulator tests; production builds for `apps/web` and `apps/server`; 12 integration files / 55 tests across the complete PostgreSQL matrix; all 57 Chromium functional, accessibility, responsive, and visual tests; and the repository mutation guard closing with "Verification full passed without repository mutation." Two prerequisites arose — the disposable databases `fitway_integration_p8_integration_c01` and `fitway_integration_p8_aggregate_c01` were absent and were created, and the coordinator worktree's ignored `apps/server/.env` lacked `CRON_SECRET`, `TELEGRAM_BOT_TOKEN`, and `TELEGRAM_CHAT_ID`, which were provisioned with synthetic process-local values — both classified as environment provisioning, consuming no repair budget. No source defect appeared at any gate.

This closure runs a fresh `pnpm verify:full` rather than relying on the `phase8-integration` run at `6d2a5ee`, because the intervening commit `f7c231e` modified `PROJECT_STATE.yaml`, and `check:repository` is precisely the gate that validates the ledger. That follows the reasoning already established in `docs/phase-records/phase-07-aggregate.md` and `docs/phase-records/phase-09-aggregate.md`, and resolves it by rerunning rather than by argument.

## Gate values

`unit: PASS`, `integration: PASS`, `independentReview: PASS`, and `browser`, `accessibility`, `visual` as `NOT_REQUIRED`. Phase 8 delivers no user interface — the owner-facing incident and uptime surface is `phase11-health` (`PHASES.md:277`) — and both child slices recorded the same three as `NOT_REQUIRED`; recording the aggregate consistently with its own children is the accurate statement of what the phase required. The full browser and accessibility suite nevertheless ran and passed at 57 tests in the evidence above, which is stronger evidence than the phase requires and is recorded as such rather than as a gate the phase imposed.

`independentReview: PASS` rests on durable independent evidence, not on any implementer's self-report. Six separate read-only contexts judged this phase, none of which held write authority over what it examined and none of which repaired anything: the `phase8-alert-evaluator` slice's own independent verification; two rounds of independent plan review; the Stage A, Stage B, and Stage C reviews, each by a session that did not write the stage; and the detached `_v01` verification at the exact candidate on isolated resources.

The `_v01` verification closed the one assurance gap every earlier review had explicitly left open. It applied **15 targeted mutations and all 15 were caught, with no survivors** — component ordering, failure capture, the deadline race, the retention cutoff boundary, the self-FK guard neutralised three independent ways, the audit cutoff, the derived retention window, both alert policy constants, the injected abort signal, and the cron secret comparison. That last one confirmed the Phase 7 carried-forward hardening item is load-bearing: the equal-length wrong-secret case is the only test that catches neutralising the constant-time digest comparison.

## Carried forward — real items, each with a destination

No genuine unresolved item belongs to Phase 8 itself. Each open observation resolves to another authority, and the phase is not expanded to absorb any of them merely because they are adjacent.

- **The alerts component's delivery budget omits database time.** `ALERT_DELIVERY_TIMEOUT_MS × ALERT_CONDITION_TYPES.length ≤ CRON_COMPONENT_DEADLINE_MS` holds at 4 × 4 000 ≤ 18 000, but the advisory-locked evaluation transaction before the delivery loop and the outcome insert after each delivery are not in the relation, leaving a 2 000 ms margin under a full transport stall. Exceeding it raises the aggregate error and returns a `500` for a case the frozen contract says must never produce one. Rare, bounded, and lossless — the scheduled reset and retention still run. The `_v01` verifier scored it significant but non-blocking and scoped it out of the candidate. Remedy: reduce the delivery bound to about 3 000 ms, or fold an insert allowance into the asserted relation. **Destination: a Phase 8 polish slice or `phase11-health`.** Analytical, never timed against a real stall.
- **Retention scans on every invocation against two unindexed predicates.** Behaviourally daily by day-quantization, but the three `DELETE` statements — including the unindexed `NOT EXISTS` self-join on `alert_log.recovery_of_alert_id` — execute every minute. `audit_log` already carries `audit_log_created_id_idx`; `edge_health_log` and `alert_log` carry primary keys only. **Destination: the coordinator-serialized migration lane**, as an index decision at the point real volume justifies it. Structural, never measured; not a correctness defect, and correctly untouched by a worker forbidden `packages/db/**`.
- **An abandoned delivery can orphan a `claimed` row.** Safe for correctness — the advisory lock is released before the delivery loop, so nothing blocks the next invocation, and re-alert suppression reads `noticeKind` and `sentAt` only, ignoring `deliveryOutcome`. The residue is that an operator reading `alert_log` cannot distinguish "abandoned" from "in flight". **Destination: `phase11-health`**, which owns the owner-facing incident and uptime surface.
- **The `phase8-integration` plan's verification ladder cannot be run as written**, because it sets `DATABASE_URL` and `TEST_DATABASE_URL` to the same database and the integration safety guard rejects exactly that — the rejection being the safety property. Independently reproduced four times and confirmed a plan defect only, not a source defect. **Destination: recorded in the slice closure; the plan document is historical and is not amended.**
- **Real Telegram credentials, production secret placement, Vercel plan entitlement and cron cadence, spend controls, deployment, and real-site acceptance.** `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are validated at import, so an unprovisioned environment fails server boot rather than only cron; the tracked Zod schema in `packages/env/src/server.ts` is the authoritative definition and no repository documentation deliverable is outstanding. **Destination: the external go-live gates in `RESEARCH.md` §17-18**, which by `PHASES.md:294-299` do not permit speculative implementation and do not weaken the Definition of Done.
- **Owner-editable alert configuration** is `phase11-settings`; **owner-facing capacity alerts** are out of scope for v1 per `SPEC.md:601-602`. Neither was absorbed here.

## Closure

`phase-8` alone is marked `DONE`. Its `baseCommit` and `integratedCommit` are the coordinator commit that closes the aggregate — the commit this record was created in. Following the settled convention documented in `docs/phase-records/phase-09-aggregate.md`, they are written first as the pre-closure head `f7c231e620e03edbd09c2ef18a0ab8480b37c5e8`, because a commit cannot reference its own hash, and re-anchored to the closure commit by the immediately following coordinator commit. The "Aggregate evidence baseline" above deliberately continues to name `f7c231e`: it is the clean, fully verified head this closure was adjudicated against, which is a different fact from where the aggregate became `DONE`.

No successor was activated, no branch or worktree was created or deleted, and no Product, Spec, privacy, security, or visual contract changed. Nothing was pushed, deployed, or externally provisioned.

`phase11-health` becomes dependency-eligible: its recorded dependencies are `phase-8`, which this record closes, and `phase-9`, which is already `DONE` at `439b1b3`. It is **not** activated by this record, and its activation requires the same plan-and-independent-review gate every other slice has passed through. `phase-12` remains `IN_PROGRESS` on its own independently-scoped `edge/**` lease, unaffected by this closure.
