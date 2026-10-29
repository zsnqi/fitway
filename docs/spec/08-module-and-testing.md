<!-- Part of SPEC.md; the index and the rule for editing are in SPEC.md at the repository root. -->

## Module Design

Deep modules with small interfaces; counting/state rules live in exactly one place each
(RESEARCH.md §14):

1. **Occupancy engine** — the only writer of current state and minute history. Interface:
   "process this push"; hides sequence dedup, backfill rules, flooring, band computation,
   and snapshotting. ADR-008 withdrew the staff manual fallback, so the engine gains no
   "apply this manual fallback" entry point.
2. **Schedule & business-day module** — pure functions over settings: open/closed at an
   instant, next-open, business-day attribution, reset-due evaluation. Hides all timezone
   and past-midnight complexity; the most heavily unit-tested code in the system.
3. **Command queue** — issue/deliver/ack/supersede semantics behind "issue(command)" and
   "collect pending for device / mark applied".
4. **Public payload builder** — assembles the cached payload and bakes the freshness
   decision; the only module that decides what visitors see.
5. **Analytics/reporting** — aggregation queries + CSV streaming over occupancy minutes.
6. **Alerting** — condition detection, suppression/re-alert policy, Telegram delivery,
   alert log. Telegram transport isolated behind a one-function notifier.
7. **Audit** — transactional append coupled to mutations; no mutation path bypasses it.

---

## Testing Decisions

The repository has unit, component, API, durable-Python/simulator, browser, accessibility, visual,
and disposable-Postgres integration suites across v1. Continue using Vitest for TypeScript
unit/integration tests, the repository Playwright suite for repeatable browser checks, and the
disposable local Postgres contract for database integration tests. The accepted final full-ladder
result is recorded in `docs/phase-records/repository-closeout.md`.

- **Unit (highest density):** schedule & business-day module (Friday hours, past-midnight
  close, boundary attribution, reset-due, next-open); band computation and threshold
  edges; freshness state machine and retained compatibility enum/read behavior; command
  supersession/ordering; payload builder outputs for every state; settings validation.
- **Integration (API-level, real Postgres):** push → current state → public payload
  round trip; sequence idempotency and backfill-does-not-move-current; command lifecycle
  through simulated edge acks; correction/reset/audit transactional atomicity; role
  enforcement (staff calling owner procedures is rejected server-side); scheduled reset
  issuance; alert condition detection writing the alert log (Telegram transport faked);
  CSV export shape.
- **End-to-end (thin):** one browser smoke pass — public page renders each payload state
  correctly in Arabic RTL and English LTR. ADR-008 removed the staff correction that this
  pass previously drove end-to-end; the command path is exercised at the integration level
  through direct service calls and simulated edge acknowledgement instead.
- **Visual and accessibility acceptance:** Browser inspection plus repeatable Playwright
  screenshots at the required mobile/desktop sizes in Arabic RTL and English LTR; keyboard and
  focus order; reduced motion; wrapping/overflow; responsive tables; and chart hover,
  keyboard-focus, and mobile-tap selection. Loading, stale, closed, unavailable, and error
  states are verified independently. Before the Public redesign is promoted to production, the
  Public page is tested with a real screen reader in Arabic and English (names, the one
  announcement of a new reading, the state announcements). The concept ships the markup that
  costs nothing and defers this test.
- **Edge simulator** doubles as the integration fixture and the manual dev harness,
  including failure injection for the alerting and recovery acceptance tests.
- The pilot targets' acceptance protocols (spot checks, injected failures, reboot tests)
  are operational tests executed on site, not CI tests; the spec's targets define their
  pass criteria.

---

