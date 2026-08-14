# Phase 8 health-alert integration b01 — Stage C worker record

- Status: `STAGE_C_COMPLETE`. Explicitly **not** `READY_FOR_INTEGRATION` and **not** `DONE`; the
  formal candidate is a separate act after the Stage C independent review passes.
- Branch: `work/phase8-integration-b01`, worktree `D:/Projects/fitway-worktrees/phase8-integration`.
- Base: accepted Stage B `b153ef1` (itself on accepted Stage A `ba8e653`, activation `45d1edf`).
- Run ID: `p8_integration_b01`. Process-local synthetic environment values, generated at run time and
  never printed, committed, or copied into any tracked file.
- Repair budget: `0/2`, unchanged. No formal candidate gate has run, so nothing here is a repair.

## What Stage C delivers

Per the approved plan's Stage C section, plus the four items the Stage A and Stage B reviews
carried forward.

| Artifact | Change |
| --- | --- |
| `packages/api/src/cron/runner.ts` (A) | Composite runner over scheduled reset → alerts → retention, one shared instant, per-component deadline, aggregate `CronRunFailedError`. Frozen alert policy constants. |
| `packages/api/src/cron/runner.test.ts` (A) | 11 tests: order, single clock read, failure isolation per component, aggregate error containing no component detail, deadline, no leaked timer. |
| `apps/server/src/index.ts` (M, leased) | Composes the alert repository, Telegram notifier, retention repository, and the existing scheduled-reset runner into the composite runner; passes it to the **unchanged** `createCronHandler`. Injects a bounded `fetch`. |
| `apps/server/src/cron.test.ts` (M) | The Phase 7 carried-forward item: an equal-length wrong-secret case derived from `cronSecret.length`, paired with an explicit unequal-length case. |
| `apps/server/src/phase8-integration.integration.test.ts` (M) | Four end-to-end scenarios through the real authenticated route against disposable PostgreSQL. |
| `apps/server/src/retention-repository.ts` (M) | Comment only: names the real single-pass guarantee. |
| `packages/api/src/retention/policy.ts` (M) | `retentionCutoff` now derives from `RETENTION_WINDOW_MONTHS`; the governing-column map stops claiming a link it does not have. |

`apps/server/src/cron.ts`, `vercel.json`, `packages/db/**`, every migration and schema artifact, and
every frozen Phase 8 alert-domain file are untouched. `packages/env/src/server.ts` is byte-identical
to Stage A — the lease was needed only for `index.ts` in this stage.

## Carried-forward items, each closed

1. **Stage A significant — no delivery deadline** (`alert-notifier.ts` imposes no `AbortSignal`).
   Closed at the composition site rather than in the accepted transport, which stays frozen:
   `index.ts` injects a `fetch` wrapper carrying `AbortSignal.timeout(10_000)`. Proved by the
   integration assertion that the intercepted Telegram call receives an `AbortSignal`.
   Additionally, the composite runner imposes a 15 s per-component deadline, because the frozen
   failure-isolation contract is satisfied by a *rejection* and not by a *hang* — without a deadline
   a stalled component would silently cost that invocation its scheduled reset. Both are documented
   at their sites.
2. **Stage B significant — the single-pass justification cited a constraint that does not provide
   the guarantee.** `retention-repository.ts` now records that `alert_log_recovery_linkage`
   (`application.ts:530-533`) constrains only `notice_kind = 'alert'`, that recovery → recovery is
   therefore schema-legal, and that the depth-one graph is guaranteed instead by
   `packages/api/src/alerts/evaluator.ts:57` (a prior row is returned only when its `noticeKind` is
   `"alert"`) and `evaluator.ts:259` (the recovery's parent is exactly that row) — both verified
   directly. The comment states that a change to that frozen behaviour makes the single pass a
   fixed-point loop. Comment only; the shipped predicate is unchanged and its integration proof is
   untouched.
3. **Stage B minor — decorative policy exports.** `retentionCutoff` now derives its offset from
   `RETENTION_WINDOW_MONTHS` instead of a hardcoded `year - 1`, so that export is load-bearing and
   the two cannot disagree. `RETENTION_GOVERNING_COLUMN` keeps no claim it cannot support: its
   comment now states plainly that it has no runtime consumer, that the repository names the Drizzle
   columns directly, and that `check-types` cannot detect a disagreement. The existing Stage B
   policy tests remain green unchanged, which is the intended equivalence.
4. **Stage B minor — worker-record line 146.** The Stage B record's claim that "the repository still
   uses the typed Drizzle columns, so the two cannot drift silently" was false and is corrected
   here rather than by rewriting an accepted record: there was no type-level or runtime link. Item 3
   removes the condition that made the sentence wrong.
5. **Stage B minor — retention index question.** Not worker work and deliberately not attempted:
   `packages/db/**` and any new index are forbidden, and the migration lane is coordinator-serialized.
   Carried to the coordinator as input. Stage C's composition does not worsen it — retention's
   day-quantized cutoff means at most one deleting run per UTC day regardless of cron frequency.

## Plan defect encountered again, and how it was handled

The approved plan sets `DATABASE_URL` and `TEST_DATABASE_URL` to the same database (plan lines 372
and 381), which `tests/integration/setup.ts:9-14` rejects through
`apps/server/src/test-support/integration-database-safety.ts:76-83`. Exactly as the Stage B review
predicted, every integration and `verify:phase` run in this stage required `DATABASE_URL` to name a
different database. This is a defect in an already-passed plan, not in any stage's source, and it
will block the coordinator's `p8_integration_c01` run and the detached `_v01` verifier identically
unless each does the same.

## Adjudications made in this stage

- **Where the frozen alert policy constants live.** The plan says "at the composition boundary".
  They are exported from `packages/api/src/cron/runner.ts` — an owned, tested file — rather than
  written inline in the leased `index.ts`, so their values are asserted against `SPEC.md:595-598`
  by a test rather than resting on an unreviewed literal. `staleAfterMs` continues to come from
  `settings_versions.operational_stale_after_seconds` through the accepted repository.
- **The composite runner takes closures, not repositories.** `evaluateAlerts(now)` and
  `purgeExpired(now)` are plain functions, so the pure package keeps no dependency on the server's
  repositories and the notifier and policy are bound once, at the composition site.
- **The deadline abandons rather than cancels.** Documented at the constant: every component is
  idempotent against a repeat invocation (advisory-locked alert claim, day-quantized retention
  cutoff, keyed reset issuance), and the outbound call carries its own abort signal.

## Gates run

```text
focused unit (plan line 380)             7 files / 66 tests passed
integration matrix (plan line 383)       5 files / 34 tests passed
pnpm check-types                         exit 0
pnpm exec biome check --write .          249 files checked, 3 files formatted
pnpm verify:fast                         "passed without repository mutation", exit 0
FITWAY_PHASE=phase8-integration verify:phase   1 file / 7 tests passed,
                                         "passed without repository mutation", exit 0
git diff --check                         clean
git status --short --branch              only the seven Stage C paths
```

`pnpm verify:full` is deliberately not run here; the plan reserves it for the pre-integration
coordinator gate.

## Red/green evidence, and a stated limitation

- `packages/api/src/cron/runner.test.ts` was authored and executed **before** `runner.ts` existed:
  the run failed with `Error: Cannot find module './runner'`, then passed 11/11 after the
  implementation landed.
- The four integration scenarios were written after the composition, so their red phase is a
  **negative control** rather than a module-resolution failure. It was run explicitly: with
  `apps/server/src/index.ts` restored to its pre-Stage-C content and everything else unchanged, the
  suite reports `3 failed | 4 passed` —
  `expected [] to have a length of 2`, `expected [] to have a length of 1`, and
  `expected [ { id: 7, …(8) } ] to have a length of 3`. The fourth scenario passes under the control
  because it supplies its own composite runner as `cronRunnerOverride`; it proves the failure-isolation
  contract end to end, not the wiring. `index.ts` was restored byte-for-byte afterwards and the full
  ladder rerun.
- As in Stages A and B, a squashed single-commit stage leaves no artifact for the red phase itself,
  so no reviewer can verify it from the repository beyond the negative-control description above.

## Scenarios proved against real PostgreSQL

All four run the production composition from `createApp` — real alert repository, real Telegram
notifier, real retention repository, real scheduled-reset runner. The single substitution is
`globalThis.fetch`, which the injected bounded fetch calls; no test opens an ambient socket.

1. **One authenticated invocation does all three.** At the pre-open boundary: `200`/`no-store`,
   exactly one `claimed` row and one `delivered` row for `stale_push`, exactly one outbound call to
   `https://api.telegram.org/bot…` carrying an `AbortSignal`, exactly one `offline` health
   transition, one `scheduled_reset_issuances` row for business day `2026-08-13`, and the expired
   `audit_log` row purged while the in-window row survives.
2. **Closed-hour suppression and pre-open escalation.** Three hours before opening: nothing claimed,
   nothing sent, but the health transition is still recorded because it is not schedule-gated. At
   exactly the 30-minute boundary the same condition escalates into one claimed and one delivered
   row stamped at that instant, and adds no second transition.
3. **Delivery failure is durable and does not touch health.** With a prior offline transition and a
   prior alert older than the re-alert interval, the invocation emits a re-alert and no transition,
   so the assertion is genuinely byte-identical across `current_state`, `edge_current_health`, and
   `edge_health_log`. A non-2xx Telegram response yields `claimed` then `failed` and still returns
   `200` — a transport outage must not become a failing cron that also masks the scheduled reset.
4. **An alerting fault does not prevent reset issuance.** Real reset and real retention with alert
   evaluation forced to throw: the response is the existing fixed `500`/`no-store` `cron_failed`,
   and the issuance row and the retention purge both still happened, while the faulting component
   wrote nothing.

## Residual gaps, stated

- No mutation testing was performed in this stage; the suites were read and executed, not falsified.
  The plan assigns that to the `_v01` verifier.
- The per-component deadline is proved with fake timers against a never-settling promise, not
  against a real stalled socket.
- No behaviour was exercised at production data volume; the retention index question remains
  structural rather than measured.
- Nothing was pushed, deployed, or externally provisioned. No real Telegram credential was used,
  requested, or held.

## Next action

Stage C independent review, read-only, by a session that did not implement it, judged against the
approved plan's Stage C gate: the composite-runner failure-isolation contract, the equal-length
wrong-secret case derived from `cronSecret.length`, the four end-to-end scenarios, scope containment
against `b153ef1`, and that `cron.ts`, `vercel.json`, `packages/db/**`, and every frozen Phase 8
authority are untouched.
