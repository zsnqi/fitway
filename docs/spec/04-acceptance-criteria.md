<!-- Part of SPEC.md; the index and the rule for editing are in SPEC.md at the repository root. -->

## Acceptance Criteria

The spec is done when all of the following are true (functional criteria first, then
measurable pilot targets):

### Functional

- [ ] Public page implements all six visitor states — loading, open+fresh, stale,
      unavailable/offline, closed, and request error — per DESIGN_GUIDE §6, with no state ever
      presenting stale data as live.
- [ ] Public schema version 2 and Public Live expose no capacity, denominator, percentage,
      health, identity, or history. The crowd-first level mark (the 28-bar signal on the shipped
      page) derives only from `band`, follows reading direction where it has one, and has one
      concise localized accessible name with decorative parts hidden and no numeric ARIA.
- [ ] Public page is Arabic RTL by default with a persistent English/LTR toggle; all copy
      comes from a message catalog; Western digits and `-u-nu-latn` formatting everywhere
      (both languages), per DESIGN_GUIDE §§4, 9, and 14.
- [ ] The shipped product is dark-only: no theme toggle, no light theme, `--fw-*` tokens from
      DESIGN_GUIDE §14 replace the scaffold's default palette.
- [ ] Staff view provides live count + health and nothing that mutates the count: it exposes
      no stepper correction, direct count entry, or reset (ADR-008). Every command that any
      internal path does issue still writes an audit entry (who/when/from→to/reason) in the
      same transaction; staff role cannot invoke any owner-only operation (verified
      server-side, not just hidden in the UI).
- [ ] Owner area provides today's curve, day×hour heatmap, per-day peaks, daily averages,
      estimated daily visits, week-over-week (with honest empty state), CSV export, all
      settings listed in story 24 (versioned), account management, audit log view, and a
      health summary.
- [ ] Edge contract (push, command delivery/ack, backfill, sequence idempotency) is
      implemented and exercised end-to-end by the edge simulator; the OpenAPI document
      accurately describes every device-facing endpoint.
- [ ] Corrections and resets are edge-authoritative: they travel as commands, are applied
      by the (simulated) edge, and the corrected count survives subsequent pushes (i.e., is
      not silently undone). Under ADR-008 the issuers are internal — scheduled reset,
      recovery, and reconciliation — not a staff surface. Offline behavior is automatic and
      reconciles on reconnect; there is no staff-triggered manual fallback.
- [ ] Scheduled daily zero-reset fires per the per-weekday schedule + buffer in gym-local
      time, handles Friday's different hours and past-midnight closing, and reconciles if
      the edge was offline when due.
- [ ] Telegram alerting works for: edge silence during open hours, device-reported
      camera/feed failure, unresolved-failure pre-open re-alert, and recovery — with
      closed-hours suppression and bounded re-alerts, all recorded in an alert log.
- [ ] Visitor read path: the public payload endpoint sets CDN cache headers
      (`s-maxage` + `stale-while-revalidate`); cache hits serve visitors without a
      function invocation; no visitor-reachable endpoint touches the database per request.
- [ ] No image, frame, video, or identity data is stored or transmitted anywhere in the
      system (RESEARCH.md §7). The public surface requires no account and sets no
      tracking identifiers.
- [ ] All checks pass: Biome, TypeScript, and the test suites defined under Testing
      Decisions.

### Pilot targets (provisional — confirm with owner at pilot kickoff; measurement method is part of the target)

- [ ] **Counting accuracy.** In supervised spot-check sessions (≥ 30 min each at the gate,
      observer tally sheet vs. the system's per-minute entries/exits sums; ≥ 6 sessions
      across quiet and busy periods), system entries and exits are each within
      **±5% or ±2 crossings, whichever is larger**, of the observed tally.
- [ ] **Status/occupancy accuracy.** Across ≥ 20 manual occupancy spot checks spread over
      days and bands (manual headcount vs. the band shown publicly at that moment): the
      exact band matches in **≥ 85%** of checks and is **never off by more than one band**;
      median absolute count error is **≤ 10% of configured capacity**.
- [ ] **Edge availability.** Over a rolling 14-day window, a push has been received within
      the last 90 s for **≥ 98% of gym open-hour minutes**, measured from stored push
      records. In acceptance recovery tests (process kill, Windows reboot, power cut —
      1 each), counting resumes without human action within **10 minutes** in 3/3 tests.
- [ ] **Public freshness.** While healthy, the payload a visitor receives reflects a push
      **≤ 90 s old for ≥ 95% of open-hour time** (verified by sampling the public endpoint
      against push timestamps). When the edge goes silent, a polling visitor sees the
      stale state within **≤ 5 minutes** of the last successful push (90 s stale
      threshold + one cache window + one poll interval).
- [ ] **Command propagation.** With the edge online, an issued correction/reset is
      reflected in a freshly fetched public payload within **≤ 90 s in ≥ 90% of ≥ 5
      timed trials, and ≤ 3 min in 100%** (audit timestamp → payload observation). Under
      ADR-008 no staff surface triggers this; the trials are run against an internally
      issued command, and the target is not measurable until Phase 7 supplies one.
- [ ] **Alert delivery.** In ≥ 3 injected-failure tests (edge process killed during open
      hours), the Telegram alert arrives within **≤ 5 minutes** of heartbeat loss in 100%
      of tests, and the recovery notice within **≤ 5 minutes** of the first
      post-recovery push. Verified against the alert log.

---

