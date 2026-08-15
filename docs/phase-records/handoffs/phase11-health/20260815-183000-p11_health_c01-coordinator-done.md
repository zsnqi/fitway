# Phase 11 owner health and uptime — coordinator integration and DONE

- Status: `DONE`. Repair attempts consumed: `0/2`.
- Integrated commit: `974302b`. Candidate `7dadab0` (implementation `fdedb85`), activation `78fa4ca`.
- Coordinator run ID / database: `p11_health_c01` / `fitway_integration_p11_health_c01`.

## What shipped

An owner-only incident and uptime summary over a 14-business-day window, read-only over
`edge_health_log` and `alert_log`, answering `SPEC.md` story 27.

## The definition that made it correct

An incident is **one `(deviceId, condition, conditionStartedAt)` triple**, not a row and not a
notice. This was derived from the frozen Phase 8 writer rather than assumed:
`packages/api/src/alerts/evaluator.ts:246` carries one `conditionStartedAt` across every bounded
re-alert and `:257` reuses it on the recovery, while
`apps/server/src/alert-repository.ts:219-243` writes a `claimed` row inside the advisory-locked
transaction and an outcome row after commit. One re-alerted, recovered outage therefore persists six
rows. Counting rows as incidents would have inflated every figure the owner sees.

The candidate's integration test drives the real writer three times and asserts those six rows exist
with one distinct start, then asserts the reader reports **one** incident — so the reader is proved
against the writer, not against its own fixtures.

## Honest denominators

- `uptimeRatio` divides by **monitored** open minutes, not scheduled ones, because
  `edge_health_log` begins at its first transition and earlier minutes are unknown rather than
  online.
- `monitoredRatio` surfaces the coverage shortfall separately, with `monitoringStartedAtUtc`, rather
  than burying it inside a flattering percentage.
- With nothing monitored both ratios are `null` and the UI renders "Not measurable" — never `100%`.
  Unknown and perfect are different facts.
- Delivery outcomes sum to the notice count by construction; offline periods state open minutes
  beside elapsed minutes.

Transport delivery failure, device-reported condition, and connection loss remain three distinct
dimensions, and the rendered footnote says so in prose: a notice that failed to send is a messaging
failure, not extra downtime. Closed-hours suppression writes no alert row, so a suppressed condition
can never appear as an incident the owner was exposed to.

## Independent verification — `PASS`

A fresh verifier at the exact candidate on its own disposable database, instructed not to read the
implementer's handoff until it had recorded its own assessment. It confirmed afterwards that it had
formed the incident derivation, denominator analysis, and privacy proof independently first.

It did not accept the candidate's fixtures. It drove the real writer through a **harder** scenario —
two separate `stale_push` outages split by a recovery, a concurrent `process_failure`, a failed send,
and a crash-orphaned `claimed`-only row. The writer persisted 12 rows; the verifier's independent
count gave 6 notices and 3 incidents; the reader returned exactly that, and did **not** merge the two
same-condition outages. The candidate's own fixture never exercised the two-separate-incidents case.

Also proved independently: unmonitored minutes excluded from the uptime denominator with real
numbers (`expectedOpenMinutes 19510`, `monitoredOpenMinutes 359`, `uptimeRatio 0.802`,
`monitoredRatio 0.018`); a permanently-closed scenario returning `null` rather than `100%`; a
crash-orphaned notice reading as `unconfirmed` rather than `failed`; a four-case authorization matrix
(401 anonymous, 401 expired, 403 staff, 200 owner); and a privacy sweep against a planted device name,
occupancy count, and detector FPS, none of which appear in the 1,222-byte response — whose only string
values are five instants, the gym zone, and three condition enums. A hostile request body carrying a
device id and an `includeDeviceIdentity` flag returned the identical window and no identity, because
the procedure takes no input. Timezone was proved against an emulated `Asia/Tokyo` device rendering
the Riyadh reading.

Read-only was proved structurally: the repository's type is `Pick<Database, "select">`, so no write
is reachable. `packages/db/**` is untouched — no migration, no index.

## Two neighbour regressions, caught and fixed inside the slice

The worker caused and repaired both **in its own code**, without touching a neighbour test or
assertion, before declaring any candidate:

1. Its `role="status"` and `role="alert"` made `getByRole` resolve to two elements on `/admin`,
   breaking one shell and two Phase 9 tests. That was a real `DESIGN_GUIDE.md` §13 defect, not a test
   inconvenience; the section now stands down while the page's own owner query is pending or failed,
   matching the accepted audit section.
2. Mounting between analytics and audit shifted `.owner-audit` sub-pixel and moved its canonical
   baseline by one pixel. The worker verified the shift was its own by removing the mount and
   re-running, then mounted the section **last** so every accepted composition above stays
   byte-identical — rather than regenerating a baseline it does not own.

## No index, measured rather than assumed

The 14-day scan initially cost roughly 870 ms per build. Replacing a per-minute `businessDayFor` call
with a coarse-then-exact window-boundary search plus a per-settings-version open-session index took it
to roughly 10 ms, and the integration test asserts a sub-400 ms end-to-end budget over the real
transport. The activation required measured evidence before any index; the answer was that none is
needed.

## Findings recorded, neither blocking

1. **Low — interior monitoring gaps count as healthy.** `edge_health_log` is a change log, so if the
   cron stops mid-window while the device is online, the final span extends to now and subsequent
   open minutes read as online rather than unknown. The **leading** gap is handled correctly. Being
   right would need a heartbeat signal the schema does not carry, and adding one requires a migration
   this slice forbids. Recorded as a known limitation of the data, not a defect in the reader.
2. **Low — "0 notices / All delivered" is reachable at the window edge.** An incident whose notices
   fall before the window but whose recovery lands inside it yields a zero-notice group rendered as
   "All delivered". Reachability is low, since a live condition re-alerts every 30 minutes. Being
   right means a neutral dash when the notice count is zero.

## Coordinator gates on merged `main`

| Gate | Result |
| --- | --- |
| `pnpm verify:full` | PASS, exit 0 |
| Browser suite inside the full ladder | PASS — 77 tests |
| Repository mutation guard | "Verification full passed without repository mutation." |
| `git status --short` after the ladder | clean |

## Released

Owner, heartbeat, and lease cleared; the four-file wiring lease released. The `phase11-health`
profile is retained and gates on all four `/admin` browser specs.

Two new canonical baselines in this slice's own subtree are recorded in the coordinator baseline
ledger as **awaiting human ratification**. The verifier attested they honestly depict the built UI;
only a human can ratify them as the approved composition.

Not proved and recorded as such: reader behaviour across a settings-version change mid-window that
alters the timezone or business-day boundary; multi-device behaviour, since connection spans merge
into one gym-level step function on the invariant that the alert evaluator only ever evaluates the
active device; and performance at realistic data volume.

No push, no deploy, no external provisioning.
