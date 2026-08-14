# Phase 8 health-alert integration b01 — coordinator integration and closure

- **Status:** `DONE`. Milestone `phase8-integration`, attempt b01, repair `0/2` — no formal candidate
  gate ever failed.
- **Candidate:** `1496dc2` on `work/phase8-integration-b01`, activation base `45d1edf`.
- **Integrated commit:** `6d2a5ee66891957d9a6d0c5fc4505668fb0a04bb` — no-fast-forward merge into
  `main`.
- **Rollback boundary:** `git revert -m 1 6d2a5ee` restores the reset-only cron composition of
  `0a128a5` while leaving the accepted `phase8-alert-evaluator` domain, which this slice never
  touched, intact.
- **Closed by:** coordinator, 2026-08-14T21:18:00+03:00. Nothing pushed, deployed, or externally
  provisioned.

## Independent evidence this closure rests on

Four separate read-only contexts, none of which held write authority over what it judged and none of
which repaired anything:

| Gate | Record | Verdict |
| --- | --- | --- |
| Plan review, rounds 1 and 2 | `20260814-133826-…-plan.md` (history section) | `FAIL` → `PASS` |
| Stage A review | `20260814-165215-…-stage-a-review-pass.md` | `PASS` |
| Stage B review | `20260814-181657-…-stage-b-review-pass.md` | `PASS` |
| Stage C review | delegated fresh reviewer, findings recorded and answered in `20260814-190400-…-stage-c-corrections.md` | `PASS`, no blocking |
| Detached `_v01` verification at the exact candidate | this record, below | `PASS` |

The `_v01` verification ran in its own detached worktree
`D:/Projects/fitway-worktrees/phase8-integration-v01` at `1496dc2`, run ID `p8_integration_v01`, on
its own disposable databases, and closed the one residual assurance gap every stage review had
declared open:

**Mutation check — 15 targeted mutations, 15 caught, 0 survivors.** Component ordering, the failure
capture, the deadline race, the retention cutoff boundary (`<` → `<=`), the `notExists` self-FK guard
in three independent ways, the audit cutoff, the derived retention window, both alert policy
constants, the injected abort signal, and the cron secret comparison. The equal-length wrong-secret
case was confirmed to be the *only* test that catches neutralising the constant-time digest
comparison at `cron.ts:52` — the Phase 7 carried-forward item is therefore load-bearing, not
decorative. The verifier proved its worktree byte-clean afterwards with empty `git status --short`,
empty `git diff`, and `git diff --stat 1496dc2` empty.

Scope, frozen authority, and byte identity were re-established independently, not accepted from any
record: the slice diff restricted to every frozen path returns only the leased
`apps/server/src/index.ts`; `packages/db/**` is absent entirely; and `vercel.json` and
`apps/server/src/cron.ts` carry identical blob hashes at base and candidate.

## Coordinator gate at the merged commit

```text
run id:   p8_integration_c01
database: fitway_integration_p8_integration_c01   host: 127.0.0.1:55432
commit:   6d2a5ee66891957d9a6d0c5fc4505668fb0a04bb (main, clean)

focused unit                                   7 files / 73 tests passed
FITWAY_PHASE=phase8-integration verify:phase   1 file / 7 tests passed, no mutation
pnpm verify:full                               PASS (exit 0)
```

`verify:full` covered: repository invariants at 35 milestones and 8 canonical approval screenshots;
Biome; workspace type checks; **48 unit files / 282 tests**; 18 Python simulator tests; production
builds for `apps/web` and `apps/server`; **12 integration files / 55 tests** across the complete
PostgreSQL matrix; **57 Chromium functional, accessibility, responsive, and visual tests**; and the
mutation guard closing with "Verification full passed without repository mutation."

One prerequisite arose and is classified as environment provisioning, consuming no repair budget:
the disposable database `fitway_integration_p8_integration_c01` did not exist and was created, and
the coordinator worktree's ignored `apps/server/.env` lacked `CRON_SECRET`, `TELEGRAM_BOT_TOKEN`, and
`TELEGRAM_CHAT_ID`, which were provisioned with synthetic process-local values. No synthetic value
reached a tracked file, a commit, an artifact, or this record. No source defect appeared at any gate.

## What Phase 8's integration slice delivers

Against `PHASES.md:229-231` and `SPEC.md:525-529, 595-602`:

- **Telegram delivery** behind the frozen one-function `AlertNotifier` boundary, over an injected
  `fetch` bounded by an abort signal. Every failure path throws one fixed message carrying no
  credential, which `alert-repository.ts:103-111` already records as a durable `failed` outcome —
  so transport failure stays distinct from device health and never degrades it. Proved against real
  PostgreSQL with all three health surfaces byte-identical across a delivery failure.
- **12-month retention** of the audit, edge-health, and alert logs, in one transaction, with a
  day-quantized cutoff that makes every invocation after the day's first a no-op with no marker row,
  no in-process state, and no migration. Referential integrity is preserved: an expired `alert_log`
  parent still referenced by a retained recovery is retained, and an expired parent with an equally
  expired recovery is deleted with it in one statement.
- **The composed cron seam** — scheduled reset, alert evaluation, and retention attempted on every
  minutely invocation in that fixed order, on one shared instant, each bounded by its own deadline,
  with failures captured so no component can suppress another and one aggregate error raised after
  all attempts. The existing `createCronHandler` is unchanged and `vercel.json` still carries exactly
  one minutely schedule.
- **The frozen alert policy** (30-minute pre-open window, 30-minute re-alert interval) supplied as
  named constants at the composition boundary, with `staleAfterMs` still read from
  `settings_versions.operational_stale_after_seconds`.
- **The Phase 7 carried-forward cron hardening**, now proved load-bearing by the mutation check.

Closed-hour suppression, pre-open escalation, bounded re-alerting, recovery notices, health
transitions, and the append-only claimed/outcome delivery log were already delivered and
independently verified by `phase8-alert-evaluator`; this slice wires them and did not modify them.

## Gate values

`unit: PASS`, `integration: PASS`, `independentReview: PASS`. `browser`, `accessibility`, and
`visual` are `NOT_REQUIRED` — this slice produces no user interface, matching `phase8-alert-evaluator`
and every Phase 7 slice. The full browser and accessibility suite nevertheless ran and passed at 57
tests in the `verify:full` evidence above; that is stronger evidence than the slice required and is
recorded as such, not as a gate it imposed.

## Leases released

Both leased paths are released at this closure: `packages/env/src/server.ts` and
`apps/server/src/index.ts`. `sharedLeases` becomes empty and `leaseExpiresAt` becomes null. The
`phase8-integration` profile in `scripts/verify.mjs` is **retained**, as the plan requires. The
`phase-12` lease over named `edge/**` Python files is untouched and remains live and non-overlapping.

## Carried forward — real items, each with a destination

None of these blocks this closure, and none is absorbed into Phase 8 merely because it is adjacent.

1. **The alerts component's delivery budget omits database time.** The Stage C correction sized
   `ALERT_DELIVERY_TIMEOUT_MS × ALERT_CONDITION_TYPES.length ≤ CRON_COMPONENT_DEADLINE_MS`
   (4 × 4 000 ≤ 18 000), but `alert-repository.ts:218-230` inserts an outcome row after every
   delivery and `:199-217` runs an advisory-locked evaluation transaction before the loop, neither of
   which is in the relation. Under a full transport stall the loop consumes 16 000 ms, leaving 2 000 ms
   for the transaction and four inserts. Exceeding that raises the aggregate error and returns the
   `500` that adjudication 4 says a transport outage must never produce. Consequence is a rare
   spurious `500` on `/cron` when a Telegram stall coincides with slow database latency; the
   scheduled reset and retention still run and no data is lost. The `_v01` verifier scored this
   significant but non-blocking and explicitly scoped it out of the candidate. Suggested remedy,
   unchanged from that verifier: reduce `ALERT_DELIVERY_TIMEOUT_MS` to about 3 000 ms, or fold an
   insert allowance into the asserted relation. **Destination: a Phase 8 polish slice or
   `phase11-health`.** It is analytical, not timed — no measurement under a real stall was made.
2. **Retention runs on every invocation against three unindexed predicates.** `SPEC.md:526-528` says
   daily; the day-quantized cutoff makes the behaviour daily but the three `DELETE` statements —
   including the unindexed `NOT EXISTS` self-join on `alert_log.recovery_of_alert_id` — still execute
   1 440 times a day and scan each time. `audit_log` already has `audit_log_created_id_idx`;
   `edge_health_log` and `alert_log` carry primary keys only. The worker correctly could not act:
   `packages/db/**` and any new index are forbidden to it and the migration lane is
   coordinator-serialized. **Destination: the coordinator migration lane**, as an index decision at
   the point real volume justifies it. Structural, never measured; not a correctness defect.
3. **An abandoned delivery can orphan a `claimed` row.** When the alerts deadline fires the delivery
   loop is abandoned rather than cancelled, so terminal `delivered`/`failed` rows for the remaining
   notices may never be written. The `_v01` verifier confirmed this is safe for correctness — the
   advisory lock is released when the evaluation transaction closes, before the loop, so nothing
   blocks the next invocation, and `evaluator.ts:47-57` derives re-alert suppression from
   `noticeKind`/`sentAt` alone, ignoring `deliveryOutcome`. The residue is observability: an operator
   reading `alert_log` cannot distinguish "abandoned" from "in flight". **Destination:
   `phase11-health`**, which owns the owner-facing incident and uptime surface.
4. **The approved plan's verification ladder cannot be run as written.** It sets `DATABASE_URL` and
   `TEST_DATABASE_URL` to the same database, which
   `apps/server/src/test-support/integration-database-safety.ts:76-83` rejects by design — that
   rejection *is* the safety property. Reproduced independently by the Stage B reviewer, the Stage C
   reviewer, this worker, and the `_v01` verifier, which confirmed it is a **plan defect only, not a
   source defect**. Every future run of this profile must point `DATABASE_URL` at a different
   database. **Destination: recorded here; the plan document is historical and is not amended.**
5. **Two new hard-required environment variables.** `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are
   validated at import, so any environment that does not provision them fails server boot, not just
   cron. Correct per `SPEC.md:530-532`, and the tracked Zod schema is the authoritative definition.
   **Destination: the external go-live gates in `RESEARCH.md` §17-18**, with real credentials,
   production secret placement, Vercel plan entitlement and cadence, and spend controls.

## Two record corrections, made here rather than by rewriting accepted records

- The candidate record's header names the candidate as `3e6bec9` "with this record committed on top".
  The formal candidate actually verified and merged is **`1496dc2`**. Self-consistent but misleading
  to a reader who takes only the header line; corrected here.
- The Stage C worker record states "All four run the production composition from `createApp`". That
  is false for the fault-isolation scenario, which supplies its own composite runner as
  `cronRunnerOverride`; the same record states the exception correctly two paragraphs earlier, and
  `…-stage-c-corrections.md` records why a genuine alert-only fault cannot be manufactured through
  shared settings without also breaking the reset component it exists to prove independent.

## Resulting state

`phase8-integration` is `DONE` at `6d2a5ee`, released to `branch: main`, `worktree: null`,
`ownerSession: null`, `sharedLeases: []`, `leaseExpiresAt: null`, repair `0/2`. The branch
`work/phase8-integration-b01`, its worktree, the detached `_v01` worktree, and every stage record are
preserved unmodified as provenance.

Aggregate `phase-8` closure is a **separate** coordinator milestone and is not performed by this
record. Its dependencies are `phase8-alert-evaluator`, already `DONE` at `7b2fe32`, and this slice.
