# Phase 8 health-alert integration b01 — Stage C review corrections

- Status: `STAGE_C_CORRECTED`. Still not `READY_FOR_INTEGRATION` and not `DONE`.
- Branch `work/phase8-integration-b01`, worktree `D:/Projects/fitway-worktrees/phase8-integration`.
- Base: Stage C `9a5d28e`.
- Repair budget: `0/2`, **unchanged**. The approved plan states that stage-review corrections before
  the formal candidate are not repairs, and no formal candidate gate has run.
- The Stage C independent review returned `PASS` with no blocking findings. These corrections are
  taken on its two significant and three of its minor findings, each re-verified against the
  repository by the coordinating session before being acted on — none was accepted on the reviewer's
  word.

## S1 — corrected. The alerts component could breach its own deadline under a *stalling* Telegram

**Re-verified independently.** `packages/api/src/alerts/types.ts:1-6` declares four condition types.
`apps/server/src/alert-repository.ts:233-244` delivers notices strictly sequentially — `await
outcomeFor(...)` then `await database.insert(...)`, once per notice. At the shipped Stage C values a
stalling transport therefore cost the alerts component up to `4 × 10 s = 40 s` against a `15 s`
component deadline, so the deadline would fire, `CronRunFailedError` would be thrown, and the seam
would return `500`. The plan's adjudication 4 says in terms that a Telegram outage produces **no**
aggregate error and no `500`, because `alert-repository.ts:103-111` already converts a rejection into
a durable `failed` row. The rejecting outage shape was correct and proved; the stalling shape was not.

Correction:

- `CRON_COMPONENT_DEADLINE_MS` 15 000 → **18 000** (three components still fit inside the minute,
  with 6 s of slack).
- The delivery bound moves out of `apps/server/src/index.ts` and into
  `packages/api/src/cron/runner.ts` as `ALERT_DELIVERY_TIMEOUT_MS` = **4 000**, because the cron seam
  is what sizes it. `index.ts` now imports it. 4 × 4 000 = 16 000 ≤ 18 000, leaving 2 s for the
  per-notice inserts.
- The relation is asserted rather than left to arithmetic in a comment:
  `runner.test.ts` now imports `ALERT_CONDITION_TYPES` from the frozen types module (a read-only
  import; that file is unchanged) and asserts
  `ALERT_DELIVERY_TIMEOUT_MS × ALERT_CONDITION_TYPES.length ≤ CRON_COMPONENT_DEADLINE_MS`. A fifth
  condition type, or a raised per-delivery bound, now fails a test instead of silently
  reintroducing the spurious `500`.

## m1 — corrected. The runner tests could not distinguish sequential from concurrent execution

**Re-verified:** every prior stub recorded its name synchronously on entry, so the whole suite would
have passed under `Promise.all`. The implementation is sequential (`runner.ts`), but that property
was asserted only in a form that could not fail. A new test drives components that record `start:`
and `end:` around two awaited microtasks and asserts the exact six-event interleaving, which
concurrent execution cannot produce.

## m2 — corrected. A mistitled test

`runner.test.ts`'s "attempts scheduled reset, then alerts, then retention on one shared instant"
asserted only the shared instant, because its two overridden components recorded into a different
array. Retitled to "gives both time-dependent components the same instant"; the order property now
has its own test (m1 above).

## m5 — corrected. The `retentionCutoff` rewrite had no test of its own

Stage C changed the cutoff to derive from `RETENTION_WINDOW_MONTHS` instead of a hardcoded
`year - 1`, in a Stage-B-accepted file, without extending `policy.test.ts`. A five-case property test
now recovers the month distance *from the result* and compares it to the declared window, asserts the
February clamp against an independently computed last-day-of-month, and asserts day quantization —
so the declared window and the arithmetic cannot drift apart.

## S2 — not corrected here; escalated to the coordinator as migration-lane input

**Re-verified and accepted as the reviewer states it, including that it is larger than the Stage B
review recorded.** `packages/api/src/cron/runner.ts` calls `purgeExpired(now)` unconditionally on
every invocation; the approved plan's adjudication 2 deliberately removed any gate, because the
day-quantized cutoff makes the day's later runs *delete nothing*. So the Stage B review's mitigation
("Stage C's daily gating in the composite runner reduces this to one run per day") is false against
the shipped design, and the Stage C worker record's "at most one deleting run per UTC day" is true
only of deleting runs: the three `DELETE` statements — including the unindexed `NOT EXISTS` self-join
on `alert_log.recovery_of_alert_id` — execute on every invocation and scan every time.

Not worker work and deliberately not attempted: `packages/db/**` and any new index are forbidden to
this worker and the migration lane is coordinator-serialized. Carried to the coordinator at its true
size, as input to a later index decision. It is a performance question at v1 scale, not a
correctness defect: the tables are append-only at rates bounded by the 30-minute re-alert interval
and by transition events.

## m3 — accepted as a disclosed limitation, with the reasoning

The fault-isolation integration scenario supplies its own composite runner as `cronRunnerOverride`,
so it proves the runner's contract against real reset and real retention but not `index.ts`'s wiring.
This was examined for a fix and deliberately left: every route to a genuine *alert-only* fault
through the production composition runs through shared settings — an invalid timezone, an unparsable
schedule time, an impossible staleness window — and each of those breaks the scheduled-reset
component too, which would destroy the very isolation the scenario exists to prove. The database
check constraints (`settings_operational_stale_after_fresh`, the seven `settings_schedule_*_pair`
checks, `settings_fresh_for_positive`) block the remaining candidates at insert time.

What `index.ts` actually wires is proved instead by integration scenario 1, which observes all three
components' durable effects — alert rows, one issuance row, and the retention purge — from a single
authenticated invocation of the real route. Order is proved by the runner's own tests.

**Correction to the Stage C worker record.** That record's claim "All four run the production
composition from `createApp`" is false for scenario 4 and is superseded by this paragraph; the same
record states the exception correctly two paragraphs earlier. Its negative-control passage also
remains accurate, including that scenario 4 passes under the control precisely because of the
override. The accepted record is left intact rather than rewritten, per the same handling used for
the Stage B line-146 correction.

## m4, m6, m7 — accepted without change, reasons recorded

- **m4** (`RETENTION_GOVERNING_COLUMN`, `RETENTION_TABLES`, `isExpired` still have no production
  consumer). The Stage B review's remedy set explicitly allowed "no claim of one", and the comment
  now makes exactly that claim. Deleting them is a simplification with no correctness value and would
  widen this stage's diff into more Stage B files.
- **m6** (no just-before-boundary case at 04:29). The pre-open boundary arithmetic belongs to the
  accepted `phase8-alert-evaluator` slice and is proved there; this file's scenario proves the
  composed seam honours it.
- **m7** (no paired success control on the delivery-failure scenario). Its
  `[delivered, claimed, failed]` ordering assertion is already a strong discriminator, and the plan's
  claim is literally that a delivery failure leaves the three health surfaces untouched — which is
  what the fixture proves.

## Gates rerun after the corrections

```text
focused unit                             7 files / 73 tests passed   (was 66; +7)
integration matrix                       5 files / 34 tests passed
pnpm exec biome check --write .          249 files, 1 file formatted
pnpm check-types                         exit 0
pnpm verify:fast                         "passed without repository mutation", exit 0
FITWAY_PHASE=phase8-integration verify:phase   "passed without repository mutation", exit 0
git diff --check                         clean
```

Changed by this correction: `packages/api/src/cron/runner.ts`, `packages/api/src/cron/runner.test.ts`,
`apps/server/src/index.ts` (leased), `packages/api/src/retention/policy.test.ts`, plus this record.
No frozen authority, no `packages/db/**`, no `cron.ts`, no `vercel.json`, no migration or schema
artifact. `packages/env/src/server.ts` remains byte-identical to Stage A.

## Next action

The formal complete candidate, then the detached `_v01` independent verification at the exact
candidate commit, then the coordinator's pre-integration ladder including `pnpm verify:full`.
