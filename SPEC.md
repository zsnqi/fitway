# Spec: FITWAY v1 — Live Gym Occupancy (Pilot)

> **Status.** Implementation spec / Definition of Done for the v1 pilot. Written 2026-07-12.
> This document turns the agreed product and design into implementable, verifiable
> requirements. It participates in the repository hierarchy defined by `AGENTS.md`:
>
> - `FITWAY_PRODUCT.md` co-governs product identity, users, content hierarchy, and surface
>   boundaries.
> - This Spec governs security, privacy, data semantics, interfaces, and acceptance.
> - `DESIGN_GUIDE.md` governs visual, responsive, RTL, interaction, and accessibility detail,
>   subject to Product and Spec.
> - `RESEARCH.md` and `docs/adr/` retain rationale and provenance; archived planning material
>   is not implementation authority.
>
> Where those documents left something genuinely open, this spec resolves it and marks the
> resolution **[Resolved here]**. Everything else preserves the recorded decisions:
> the two-path cache-first architecture, edge-authoritative counting, Hono + Drizzle +
> Supabase Postgres, signed server-side sessions and authorization, Arabic-first RTL,
> **dark-only**, and **Western digits 0–9 exclusively**.
>
> This spec deliberately does **not** split work into phases and does not cover
> deployment/provisioning execution (Supabase project creation, Vercel spend caps, domain).
> Those remain pre-deploy gates listed in RESEARCH.md §11/§17/§18.

---

## Implementation authority and fidelity contract

Phases 1–3 are complete. Broad visual exploration is closed; the one-time Baseline
Reconciliation Gate and Phases 4–12 use the live state in `PROJECT_STATE.yaml`. The following contract applies to
every remaining implementation phase:

- Hard product, security, privacy, content, accessibility, and data-semantic decisions remain
  binding. A material proposal to change one must be surfaced explicitly before implementation;
  it must never be changed silently through UI or technical convenience.
- The approved FITWAY theme and manifest are the visual baseline. G1B and the final Claude
  Design product family remain historical lineage only where the manifest says they apply.
  Implementation may improve composition, hierarchy, spacing,
  typography, responsive/mobile behavior, motion, interaction, charts, tables, accessibility,
  and real-browser quality while retaining FITWAY's identity and locked semantics.
- Design-only annotations, preview labels, demo notices, fake owner/email values, arbitrary
  identities, fixture data, and other mockup-only content must not ship.
- Staff authentication is PIN-based using the signed HttpOnly session model, not
  email/password. The current scaffold login implementation and the archive's fake email form
  are implementation inputs to replace, not product authority.
- Preserve the capacity-free public schema-version-2 contract and the approved Arabic Public
  Live composition with its continuous cumulative 28-bar crowd signal.
  English LTR must be naturally composed rather than mechanically mirrored from Arabic.
- Correct wrapping, RTL/Bidi isolation, Western-digit number and gym-time formatting,
  overflow, responsive tables, mobile operational density, keyboard behavior, reduced motion,
  and loading/stale/unavailable/error semantics before a surface can be accepted.
- The current Design Guide and approval manifest govern page layout. The historical Claude
  Analytics PNG preserves occupancy-curve behavior lineage only; `DESIGN_GUIDE.md` §12 defines
  normative chart interaction, accessibility, RTL, formatting, and reduced-motion rules.

---

## Problem Statement

Fitway members want to know **how crowded the gym is right now** before traveling to it.
Nothing answers that today. The gym owner has no operational view of occupancy patterns
(peaks, quiet hours, daily visits) to schedule staff or run offers. The builder (maintainer)
needs the system to run unattended in someone else's building and to hear about failures
from an alert, not from the owner.

The repository now implements the accepted Phase 1–3 public vertical slice: the static
TanStack Router web app, Hono/oRPC server boundary, Drizzle/Postgres occupancy path, Python
simulator, cached public states, and schedule-aware open/closed behavior. Staff, owner,
command/audit, fallback/backfill, cron/alerts, analytics/reporting, and production edge
lifecycle work remain unfinished.

## Solution

Build the v1 pilot exactly as architected in RESEARCH.md §9–§11 and
`docs/adr/ADR-001-system-shape.md`:

- A **public, anonymous, mobile-first, Arabic-RTL-default occupancy page** showing the
  status band (Quiet/Moderate/Busy/Packed), an approximate count, open/closed state, and
  data freshness — honest in every state (fresh, stale, offline, closed). In v1,
  capacity, a denominator, and derived percentage are not exposed publicly.
- A **staff operational view** (shared front-desk account): live count + device health,
  manual correction, direct count entry, and reset-to-zero — all audited.
- An **owner/admin area**: analytics (today's curve, day×hour heatmap, peaks, daily
  averages, estimated daily visits, week-over-week), CSV export, settings (capacity,
  band thresholds, gym hours, business-day boundary, reset buffer), account management,
  and the audit log.
- A **device-authenticated edge contract**: the on-site Windows Python counter pushes
  batched anonymous counts ~every 20 s, receives correction/reset commands in the push
  response, buffers 24–48 h offline, and backfills history without altering the live count.
- **Maintainer health alerting via Telegram**: edge silence, camera/feed failure, and
  recovery notices, with closed-hours suppression and re-alert policy.

Visitor reads are served from the CDN cache; compute scales with time, never with visitor
count (RESEARCH.md §9 governing rule).

---

## User Stories

### Visitor (anonymous, public page)

1. As a visitor, I want to see the crowd status band and an explicitly labeled approximate
   count on my phone within seconds of opening the page, so that I can decide
   whether to go now. Approved Arabic public copy uses `العدد التقريبي` as that label.
2. As a visitor, I want a last-updated time next to the number, so that I can judge how
   fresh the information is.
3. As a visitor, I want the page to say "Closed now — opens 6:00 AM" when the gym is
   closed, so that I am never shown a fake live count outside opening hours.
4. As a visitor, I want the page to clearly flag stale data ("live updates are delayed —
   last known approximate count: 45 at 7:32 PM") when the feed stops, so that I am never
   misled by a frozen number presented as live.
5. As a visitor, I want an explicit "live occupancy unavailable" state when there is no
   usable data at all, so that absence of data is communicated honestly.
6. As a visitor, I want the page in Arabic (RTL) by default with a toggle to English
   (LTR) that persists on my device, so that I can read it in my language.
7. As a visitor, I want the count to refresh automatically (~every 60 s) while the page is
   open and pause when the tab is hidden, so that the number stays current without my
   interaction and without wasting resources.
8. As a visitor with color-vision deficiency or a screen reader, I want every status
   conveyed by label + icon + position, never color alone, and live updates announced
   politely, so that I can read the state (DESIGN_GUIDE §13).
9. As a visitor on a slow connection, I want a lightweight page with skeleton loading
   states, so that the status appears fast even on poor mobile networks.

### Staff (shared front-desk account)

10. As staff, I want to enter the shared desk PIN once and receive a long-lived signed
    HttpOnly session, so that the desk view is always available without daily logins or an
    invented staff email identity.
11. As staff, I want a live operational view (current count, band, last update, edge/camera
    health), so that I can see at a glance whether the system is healthy.
12. As staff, I want to correct the count with +/− steppers and an explicit Apply action
    (with optional short reason), so that I can fix an obviously wrong number.
13. As staff, I want to type a count directly (non-negative integer) when stepping is
    impractical or the edge is down, so that the public page keeps showing something real.
14. As staff, I want to reset the count to 0 behind a confirmation dialog that states the
    consequence, so that the most destructive action cannot happen by accident.
15. As staff, I want an unmistakable on-screen alert when the edge is offline or data is
    stale, so that I know when manual fallback is needed.
16. As staff, I must NOT be able to reach owner settings, analytics, or account management,
    so that a stray change (e.g., capacity = 5) cannot break the public page.
17. As staff, I want my correction to appear on the public page within ~2 minutes when the
    system is healthy, so that I can trust the fix landed.

### Owner / Admin

18. As the owner, I want everything staff can do, so that I can operate the desk view too.
19. As the owner, I want today's occupancy curve (gym business day, not calendar midnight),
    so that I can see how the day developed.
20. As the owner, I want a day-of-week × hour-of-day busiest-times heatmap, so that I can
    schedule staff and plan offers around real peaks and quiet hours.
21. As the owner, I want per-day peak occupancy, daily averages, and estimated daily visits
    (framed as "estimated entrance crossings, not unique members"), so that I understand
    volume honestly.
22. As the owner, I want week-over-week comparison once enough history exists (and an
    honest empty state before that), so that I can see direction.
23. As the owner, I want CSV export of per-minute history for a date range, so that I can
    analyze data outside the product.
24. As the owner, I want to configure capacity, band thresholds, weekly gym hours
    (including Friday's different hours and past-midnight closing), business-day boundary,
    and the post-close reset buffer — without code changes, so that the system matches the
    real gym as measured on site.
25. As the owner, I want to manage access (provision/rotate/deactivate staff PIN credentials
    and manage real owner accounts), so that routine access control does not require invented
    identities or the maintainer.
26. As the owner, I want to see the audit log (who, when, from → to, why) for every
    correction, reset, and settings change, so that manual interventions are accountable.
27. As the owner, I want a health/uptime summary (offline periods, last incidents), so
    that I can see what I am paying maintenance for.

### Maintainer

28. As the maintainer, I want a Telegram alert within minutes when the edge stops pushing
    during open hours (or its health flags report camera/feed failure), so that I discover
    failures before the owner does.
29. As the maintainer, I want closed-hours failures suppressed but re-checked and alerted
    shortly before opening if still unresolved, so that I am not woken at 3 AM for a
    problem that only matters at 6 AM.
30. As the maintainer, I want bounded re-alerts (not one message per minute) and an
    explicit recovery notice, so that the channel stays trustworthy.
31. As the maintainer, I want an alert delivery log, so that alerting itself is verifiable.

### Edge device (system actor — contract only; CV internals are site-gated)

32. As the edge counter, I want to push my current count, per-minute entry/exit deltas, and
    a health snapshot at most once per configured interval (~20 s) over an authenticated
    endpoint, so that the cloud always has a bounded, recent view.
33. As the edge counter, I want every push acknowledged with any pending commands
    (set-count / reset), so that staff corrections reach my local counter — the single
    source of truth — and my next push reflects them.
34. As the edge counter, I want to buffer counts/events/health locally for 24–48 h during
    an outage and backfill on reconnect, so that history and analytics survive network
    loss — without backfill ever changing the live current count.
35. As the edge counter, I want idempotent pushes (sequence-numbered) and idempotent
    backfill (minute-bucket upserts), so that retries never double-count.
36. As the edge counter, I want the daily zero-reset delivered as a schedule-aware command
    (close time + buffer) that I must apply, including on reconnect if I was offline when
    it was due, so that drift is capped to one day.

### System

37. As the system, I want visitor reads served from the CDN cache with the freshness
    decision baked into the cached payload, so that origin compute scales with time, not
    visitors, and traffic spikes from gym announcements are absorbed.
38. As the system, I want the stored and displayed occupancy floored at 0, so that drift
    can never show a negative or absurd public state.
39. As the system, I want per-minute history (count, entries, exits, band, capacity
    snapshot) recorded from day one in UTC with gym-local business-day attribution, so
    that future "popular times" analytics are possible even though v1 shows no forecasts.
40. As the system, I want every state-changing staff/owner action written atomically with
    its audit entry in one database transaction, so that the audit log can never silently
    miss an intervention.

---

## Acceptance Criteria

The spec is done when all of the following are true (functional criteria first, then
measurable pilot targets):

### Functional

- [ ] Public page implements all six visitor states — loading, open+fresh, stale,
      unavailable/offline, closed, and request error — per DESIGN_GUIDE §6, with no state ever
      presenting stale data as live.
- [ ] Public schema version 2 and Public Live expose no capacity, denominator, percentage,
      health, identity, or history. The crowd-first continuous 28-bar signal derives only from
      `band`, mirrors by direction, and has a concise localized accessible name.
- [ ] Public page is Arabic RTL by default with a persistent English/LTR toggle; all copy
      comes from a message catalog; Western digits and `-u-nu-latn` formatting everywhere
      (both languages), per DESIGN_GUIDE §§4, 9, and 14.
- [ ] The product is dark-only: no theme toggle, no light theme, `--fw-*` tokens from
      DESIGN_GUIDE §14 replace the scaffold's default palette.
- [ ] Staff view provides live count + health, stepper correction, direct count entry, and
      confirmed reset; every one of these writes an audit entry (who/when/from→to/reason)
      in the same transaction; staff role cannot invoke any owner-only operation
      (verified server-side, not just hidden in the UI).
- [ ] Owner area provides today's curve, day×hour heatmap, per-day peaks, daily averages,
      estimated daily visits, week-over-week (with honest empty state), CSV export, all
      settings listed in story 24 (versioned), account management, audit log view, and a
      health summary.
- [ ] Edge contract (push, command delivery/ack, backfill, sequence idempotency) is
      implemented and exercised end-to-end by the edge simulator; the OpenAPI document
      accurately describes every device-facing endpoint.
- [ ] Corrections and resets are edge-authoritative: they travel as commands, are applied
      by the (simulated) edge, and the corrected count survives subsequent pushes (i.e., is
      not silently undone). Manual fallback works when the edge is offline and reconciles
      on reconnect.
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
      stale state within **≤ 5 minutes** of the last successful push (3-min stale
      threshold + one cache window + one poll interval).
- [ ] **Correction propagation.** With the edge online, a staff correction/reset is
      reflected in a freshly fetched public payload within **≤ 90 s in ≥ 90% of ≥ 5
      timed trials, and ≤ 3 min in 100%** (audit timestamp → payload observation).
- [ ] **Alert delivery.** In ≥ 3 injected-failure tests (edge process killed during open
      hours), the Telegram alert arrives within **≤ 5 minutes** of heartbeat loss in 100%
      of tests, and the recovery notice within **≤ 5 minutes** of the first
      post-recovery push. Verified against the alert log.

---

## Implementation Decisions

Ordered from most durable to most volatile. Decisions marked **[Resolved here]** settle
points the source documents left open; everything else restates the binding decision's
implication for implementation.

### Architecture & Schema

**System shape (ADR-001).** Static TanStack Router web app and a
separate Hono (Node) server as two services in one Vercel project on one origin, with
`/api/*` rewritten to the server. oRPC provides typed procedures for the TypeScript web
app and generates the OpenAPI 3.1 document the Python edge consumes. Drizzle over Supabase
Postgres; Drizzle migrations are the single schema history. Browser code never accesses
the database directly. Owner auth plus the shared staff PIN/signed-session records live in
the same Postgres boundary, with Hono enforcing roles server-side; database constraints/RLS
are defense in depth only.

**Monorepo placement.** Domain logic (occupancy, schedule, commands, audit, analytics,
health/alerting, settings) lives in the shared API package as domain modules; the server
app owns HTTP concerns (mounting, cache headers, device auth, cron endpoints); the DB
package owns schema and migrations; the web app consumes typed procedures only. The
Python edge counter and its Windows lifecycle scripts live in a top-level `edge/`
directory in the same repository but are **not** a pnpm workspace package.

**Single gym, SaaS-safe. [Resolved here]** v1 schema and routes are single-gym (no
`gym_id` anywhere), per the scope fence (RESEARCH.md §16). SaaS-friendliness is preserved
at the URL level only: all three surfaces live under paths that a future per-gym prefix or
subdomain can wrap without restructuring.

**Time model.** All timestamps stored in UTC. One configured IANA gym timezone (default
`Asia/Riyadh`, confirm on site) drives every "today", curve, heatmap, reset, and report.
A configurable **business-day boundary** (default 04:00 local) attributes minutes to
business days; the weekly schedule is per-weekday with open/close times where close may
fall past midnight (close ≤ open means "next calendar day"). Friday's different hours are
just data, not a special case.

**Data model (conceptual; names indicative).**

- **Occupancy minutes** — one row per device-minute: UTC minute bucket, business day
  (local date), count (≥ 0), entries, exits, band, capacity snapshot, settings version
  reference, source (`live` | `backfill` | `manual`). Upserted by (device, minute) so
  backfill is idempotent. Retained indefinitely.
- **Current state** — a single-row table: current count, band, source (`edge` | `manual`),
  last push received at, last edge-reported counter time, active device. This is what the
  public payload builder reads; it is only advanced by live pushes and manual fallback,
  never by backfill.
- **Settings versions** — append-only: capacity, band thresholds (% boundaries for
  Quiet/Moderate/Busy/Packed), weekly hours, business-day boundary, reset buffer minutes,
  timezone, freshness windows (push interval, fresh ≤ 90 s, stale ≥ 180 s, public poll
  ~60 s, manual-fallback validity), created-by, effective-from. Current settings = latest
  row; historical rows keep old analytics honest (RESEARCH.md §8).
- **Edge devices** — id, name, hashed device token, enabled flag, last-seen, last
  processed sequence number. One device in v1; the table exists so tokens are rotatable
  and a second camera later is additive.
- **Edge commands** — id (monotonic), type (`set_count` | `reset_zero`), value, status
  (`pending` → `delivered` → `applied`, or `superseded` | `expired`), issued-by (user or
  `system` for scheduled resets), reason, timestamps. A newer pending set/reset supersedes
  older pending ones; only the latest is delivered.
- **Audit log** — actor (authenticated principal; the shared front-desk principal for staff
  actions, accepted coarse granularity per RESEARCH.md §3), action, from → to values,
  optional reason, created-at. Written in the same transaction as the mutation it
  records. Retained ~12 months.
- **Edge health log** — offline/online transitions, device-reported health flags
  (camera/feed/process), derived from pushes and cron detection. Retained ~12 months.
- **Alert log** — alert type, condition started at, sent at, delivery outcome, recovery
  linkage. Drives re-alert suppression and the alert-delivery target. Retained ~12 months.
- **Authentication/session storage** — real owner principals plus the shared staff PIN
  credential metadata and signed sessions. Store only a strong server-side PIN hash, never the
  PIN itself; no staff email identity is required. Roles and deactivation are enforced by the
  server.

**What is never stored:** video, frames, images, biometrics, identities, per-visitor
anything, raw per-crossing events (per-minute aggregation only, RESEARCH.md §8).

**Roles & auth model. [Reconciled at the Baseline Gate]** Two server-enforced roles remain:
`staff` and `owner` (maintainer uses a real owner account; RESEARCH.md §3). Shared staff access
is **PIN-based**, never email/password: the server verifies a strong stored PIN hash and issues
the existing signed session cookie. The cookie is `httpOnly`, `secure`, and — because the
deployment is same-origin — `sameSite=lax`, with a roughly 30-day rolling lifetime suitable
for the shared desk. PIN attempts are rate-limited and return non-enumerating errors.
Self-registration is disabled. Owner identities remain separately provisioned real accounts;
this clarification does not authorize invented owner/email values or weaken server-side role
checks. Deactivation invalidates or rejects the session on its next use.

**Edge authentication.** Static per-device bearer token (≥ 32 random bytes), stored
hashed; presented on every `/api/edge/*` call; lookup by hash (constant-time by
construction). Device endpoints are additionally rate-limited per device (order of one
request per few seconds with a small burst — generous versus the 20 s push interval,
hostile to abuse). In-process limiting is acceptable for the pilot given token auth is
the primary control; note the serverless multi-instance caveat in code.

**Phase 4 staff authentication contract freeze (2026-07-14).**

- Application roles are exactly `staff | owner`; principal kinds are `shared_staff |
  owner`. The one shared staff principal is the accepted v1 audit actor and never requires
  or receives a synthetic email identity. Owner principals map only to separately
  provisioned real owner identities.
- A staff PIN is 6–12 Western digits. The server stores only a password-grade memory-hard
  hash with per-credential salt and a server-held pepper, plus `active`, `credentialVersion`,
  creation/rotation timestamps, and the shared principal reference. The raw PIN is never
  stored, logged, placed in a URL, or seeded by a migration.
- Successful verification creates an opaque server-side session and a signed HttpOnly cookie.
  Production attributes are `Secure`, `SameSite=Lax`, `Path=/`, no `Domain`, and a roughly
  30-day rolling expiry refreshed at most once per 24 hours. The server stores only a hashed
  session token. Expired/revoked sessions, inactive principals, or staff sessions issued
  against an obsolete credential version are rejected on their next request.
- Authentication resolves to one canonical request context:
  `principalId`, `principalKind`, `role`, `sessionId`, `expiresAt`, and `active`. A request
  carrying ambiguous valid owner and staff sessions is rejected and the next explicit login
  clears the other session; middleware never guesses which authority the caller intended.
- `/staff` and `staff.*` accept `staff | owner`; `/admin` and `admin.*` accept only `owner`.
  Missing/expired authentication is `401`; a valid wrong role is `403`. Web route guards are
  redirect-only UX and never replace the Hono/oRPC role check.
- `/login` is the PIN-first staff route. Better Auth may remain behind a separate,
  deliberately provisioned owner credential path, but email/password is never the staff
  flow and self-registration is disabled server-side. Direct sign-up calls must be rejected.
- The current scaffold is explicitly non-conforming: it enables email/password and sign-up,
  uses `SameSite=None`, relies on the default short session lifetime, and renders an email/
  password staff form. The `phase4-auth` stream must replace those assumptions and tests;
  no staff UI or Phase 4 merge may bind to them in the meantime.

**Phase 4 operational-health contract freeze (2026-07-14).** The required edge input fields
remain `health.process`, `health.camera`, `health.feed` (`ok | degraded | failed | unknown`)
and `health.detectorFps` (finite non-negative number or `null`, where `null` means unknown,
not zero). The edge owns those reported values; server receipt time is the connectivity
authority.

Persist the latest accepted live health in a separate `edgeCurrentHealth` projection keyed by
device with exactly: `deviceId`, `sequence`, `processStatus`, `cameraStatus`, `feedStatus`,
`detectorFps`, `edgeObservedAt`, `receivedAt`, and `updatedAt`. Update it in the same database
transaction as minute/current-state writes, device sequence advancement, and `lastSeenAt`, and
only for an accepted contiguous live push. Replay, sequence gap, validation failure, disabled
device, transaction rollback, and future pure backfill do not change current health. Existing
devices are `unavailable` until their first accepted post-migration live push. Phase 8 later
owns append-only health transitions and alert history; it must not redefine this current
projection.

The API-visible `staff.operationalSnapshot` health shape is frozen as:

```ts
health: {
  freshness: "current" | "stale" | "unavailable";
  condition: "healthy" | "degraded" | "failed" | "unknown";
  process: "ok" | "degraded" | "failed" | "unknown" | null;
  camera: "ok" | "degraded" | "failed" | "unknown" | null;
  feed: "ok" | "degraded" | "failed" | "unknown" | null;
  detectorFps: number | null;
  edgeObservedAt: string | null;
  receivedAt: string | null;
  lastSeenAt: string | null;
  staleAt: string | null;
}
```

`current` means trusted `receivedAt` age is below the settings-driven
`operationalStaleAfterSeconds`; equality is `stale`. `unavailable` means no projection, no
usable active device, or a disabled device, and all raw fields/times except an independently
known `lastSeenAt` are null. Condition precedence for a usable projection is any `failed` →
`failed`, else any `degraded` → `degraded`, else any `unknown` → `unknown`, else all-ok →
`healthy`; stale freshness does not erase the last-known flags. The server/evaluator owns
freshness and condition, the repository owns projection reads, and the UI only renders them.
Transport/API failure is an error state, never converted into `unavailable` current health.
The staff snapshot also carries `schemaVersion`, `computedAt`, the public occupancy fields,
authorized `capacity`, and source detail. It does not reserve speculative command fields
before Phase 5.

### Interfaces & Contracts

Three interface groups, one Hono app:

**1. Public read (anonymous, cached).** A single GET endpoint returns public payload schema
version 2 with `Cache-Control: public, s-maxage=<cache window ~20–30 s>,
stale-while-revalidate=<~2× window>`. The payload is language-neutral (the client renders
localized labels) and contains: schema version; open/closed with next-open time (when
closed); freshness state (`fresh` | `stale` | `unavailable` | `closed`) **baked in at origin
refresh**; band and count (floored at 0); last-updated timestamp; source (`edge` |
`manual`); computed-at; and a reserved `trend`
field that is always null in v1 **[Resolved here — trend deferred; slot reserved]**.
Capacity, denominator, percentage, health, device identity, and history are not exposed by
the current schema-version-2 contract.
The continuous cumulative 28-bar crowd signal is rendered from `band`, not from a hidden
capacity ratio. This endpoint reads only the current-state row and settings — never history — and is the only
thing visitors touch. Version 2 is an intentional pre-Phase-4 privacy correction; web,
server, fixtures, and tests upgrade atomically and version 1 is not served in parallel.

**Public capacity boundary and post-v1 safety reservation.** Schema version 2 is strict and
does not accept or emit `capacity`, a denominator, or `percentFull`. There is no v1 setting,
migration, feature flag, procedure, UI, or client-side toggle for public percentage disclosure.
If a later product version explicitly approves disclosure, it must use a new versioned API; omit
the optional field entirely while disabled; make the server the disclosure authority; permit
only an authenticated owner to change it; warn that count plus percentage can reveal capacity;
and audit actor/prior/new values/time. These constraints reserve a safe boundary only. They do
not authorize implementation, and historical visual artifacts do not pre-authorize the feature.

**2. Staff/owner procedures (oRPC, session + role enforced server-side).**

- Staff-or-owner: live operational snapshot (public payload fields + capacity, device
  last-seen, health flags, pending command status, source detail); issue correction
  (delta or absolute value, optional reason); issue reset; each returns the created
  command + audit reference.
- Owner-only: analytics queries (today curve, heatmap, daily peaks/averages/visits,
  week-over-week); CSV export (per-minute rows for a date range, streamed, UTC + local
  time columns, Western digits); settings read/update (new version row + audit);
  access management (provision/rotate/deactivate staff PIN credentials and manage real owner
  accounts); audit log listing; health/alert history.
- Router guards in the web app are UX only; every procedure re-checks role on the server
  (`docs/adr/ADR-002-auth-principals-sessions.md`).

**3. Edge endpoints (OpenAPI-documented, device-token auth).**

- **Push** — request: device sequence number, edge-local timestamp, current count,
  per-minute entry/exit buckets since last acknowledged push (a reconnecting edge sends
  buffered buckets flagged as backfill), health snapshot (process/camera/feed status,
  detector fps), and the highest command id already applied. Response: acknowledgment
  (highest processed sequence), pending commands (oldest-first, latest-only for
  superseded types), current settings version + the schedule/reset config subset the edge
  needs, and server time. Pushes with a sequence ≤ the last processed are acknowledged
  idempotently without effect. A push flagged all-backfill updates history only; the
  current-state row advances only on live samples.
- The push cadence (~20 s, config-driven) **is** the heartbeat; the edge pushes on
  schedule even with zero crossings. There is no separate heartbeat endpoint.
- The OpenAPI 3.1 document (already emitted by the scaffold's OpenAPI handler) is the
  contract the Python client is built against. The interactive reference UI is available
  in development; in production it is disabled or auth-gated **[Resolved here]**.

**4. Internal cron endpoint.** A minutely scheduled invocation (Vercel Cron, bearer
`CRON_SECRET`) runs: freshness/offline detection and alert evaluation; scheduled-reset
command creation at close + buffer; health-log transition recording; and (daily) 12-month
audit/health/alert retention cleanup. If plan limits force a coarser cadence, alerting
targets degrade accordingly and the target table must be revisited — flag at deploy time.

**Environment additions** (validated in the env package like existing vars):
Telegram bot token + chat id, cron secret. Gym configuration (timezone, hours, capacity,
thresholds) lives in the settings table, not env.

**Routes (web). [Resolved here]**

- `/` — public occupancy page (no auth chrome, no header/nav from the scaffold demo).
- `/login` — PIN-based staff sign-in; owner access uses its separately provisioned real
  account path. No sign-up route; the scaffolded email/password staff form is not the target.
- `/staff` — operational view; requires `staff` or `owner`.
- `/admin` — owner area (analytics, settings, accounts, audit, health); requires `owner`;
  organized as nested sections under one layout.
- The scaffold's `/dashboard` demo route is removed.

### Behavior & Interactions

**Freshness state machine (defaults; all config-driven).** Edge pushes every ~20 s.
Payload age ≤ 90 s → `fresh`. No accepted push for ≥ 180 s → `stale`: public page dims the
number, labels it last-known with its time, and shows the stale treatment (DESIGN_GUIDE
§6). No usable data at all (or device disabled) → `unavailable` (DESIGN_GUIDE §6).
Closed per schedule → `closed` overrides everything: no count is shown, next-open time is
shown when known (DESIGN_GUIDE §6). The freshness decision is computed at origin refresh and baked into
the cached payload, so it costs nothing per visitor; the worst-case detection lag is one
cache window.

**Public polling.** The page fetches on load, then every ~60 s with small jitter, pauses
via the Page Visibility API when hidden, and refetches immediately on becoming visible.
No WebSockets/SSE (RESEARCH.md §10).

**Corrections and resets (edge-authoritative).** Staff correction (steppers or direct
entry) and reset create a command; the UI shows "pending" until a subsequent push reflects
the applied value (expected ≤ ~40 s online). Commands are **not** applied by overwriting
the cloud value while the edge is online — the next push would silently undo it
(RESEARCH.md §9). Reset always passes a destructive-confirmation dialog; direct entry
accepts non-negative integers only, Western digits (DESIGN_GUIDE §11). Every
command, applied or superseded, has its audit entry.

**Manual fallback (edge offline). [Resolved here — validity window]** When the system is
`stale`/`unavailable`, a staff direct entry both creates the pending command **and**
immediately sets the current-state row (source `manual`), so the public page shows the
staff-entered value with its own honest timestamp and a "manual estimate" presentation.
Because a manual value cannot self-update, it uses a longer staleness window
(default 30 min, configurable) instead of the 3-minute edge window — otherwise staff
would have to re-enter every 3 minutes, which contradicts the no-babysitting principle
(RESEARCH.md §5). On reconnect, the edge receives the pending set-count command, applies
it, and its next live push retakes authority.

**Daily zero-reset.** The cron evaluates the per-weekday schedule in gym-local time and,
at close + buffer (default buffer 30 min, configurable), issues a system `reset_zero`
command and marks the business day closed. If the edge is offline at that moment, the
command stays pending and must be applied on reconnect **before** the edge's pushes
advance the live count again (RESEARCH.md §9). Occupancy still floors at 0 independently.

**Alert policy. [Resolved here — defaults]** Alert conditions: (a) no accepted push for
≥ the stale threshold during open hours or within the 30-minute pre-open window; (b) a
push whose health snapshot reports camera/feed/process failure; (c) at most one re-alert
per condition every 30 min while unresolved; (d) failures arising during closed hours are
suppressed but alert at pre-open if still unresolved; (e) a recovery notice when the
condition clears. All sends and outcomes are recorded in the alert log. Channel: Telegram
bot message to the maintainer chat. Owner-facing capacity alerts remain out of scope
(RESEARCH.md §16).

**Analytics semantics.** All aggregation is business-day and gym-timezone aware. "Daily
visits" = sum of entries per business day, always presented with the "estimated entrance
crossings, not unique members" framing (RESEARCH.md §5, §20). Heatmap averages occupancy
by (weekday, local hour); closed periods render as "closed", and missing history renders
as "no data" — visually distinct from zero (DESIGN_GUIDE §12). Week-over-week shows
an honest empty state until two comparable weeks exist. Analytics read historical band
and capacity from the row snapshots, not from current settings.

For the isolated Phase 9 domain, `dailyAverage` is the arithmetic mean of observed open-minute
counts: include genuine zero rows, exclude closed and missing minutes, and return
`observedOpenMinutes` plus `expectedOpenMinutes` so outage coverage is never hidden. Timeline
DTOs classify every bucket as `value | closed | missing`; `closed` and `missing` carry a null
count. Classification uses the settings version effective at each instant. A gap has no row,
so the query resolves the append-only settings timeline by `effectiveFrom` rather than using
today's settings. These semantics must be unit-tested before the analytics domain can merge.

**Internationalization.** Arabic (`dir="rtl" lang="ar"`) is the default; English is a
first-class toggle persisted client-side. All user-facing copy — including error states,
confirmation dialogs, and toasts — lives in ar/en message catalogs from the first screen;
no hard-coded strings. Numbers, dates, and times use `Intl` with `-u-nu-latn` so Western
digits render in both locales; tabular numerals for anything that updates or aligns.
Layout uses logical properties; charts follow reading direction
(DESIGN_GUIDE §§4, 9, 12). The document default (`index.html`) is Arabic/RTL with localized
title/meta and the approved FITWAY favicon.

**Dark-only visual system.** The scaffold's theme toggle and light theme are removed; the
`--fw-*` token set in DESIGN_GUIDE §14 is the single palette. Cairo is self-hosted at actual
weights 400–700. The crowd level, approximate count, continuous 28-bar signal, badges,
freshness, operational panels, KPI cards, charts, skeletons, and empty/error states follow
DESIGN_GUIDE §§3–13, including reduced motion and accessibility.

**Scaffold cleanup (first implementation act, recorded here so nothing demo-shaped
survives).** Remove: the ASCII demo home page, sign-up form/route, theme
toggle/light-theme plumbing, demo `privateData` procedure, unused chat-style UI
components in the UI package, and the default shadcn palette values superseded by
`--fw-*`. The web app's devtools remain development-only.

**Edge application (contract-level requirements; CV specifics are site-gated).** The
Python counter must: read config (RTSP source, ROI, line, thresholds, endpoints, token,
intervals) from a local file without code changes; count directionally with the proven
pipeline approach of RESEARCH.md §6; keep a durable local outbox (e.g., SQLite) sized for
24–48 h; push on the interval with sequence numbers and apply commands in order; persist
its counter and last-applied command across restarts; run as an auto-starting,
watchdog-supervised Windows service that recovers from crash/reboot/power loss without
staff action (RESEARCH.md §12); and never write frames or images to disk or network
(RESEARCH.md §7). Detector/tracker choices, packaging, and hardware acceleration are
deferred to the site-check gates (RESEARCH.md §18).

**Edge simulator.** A simulator that speaks the exact device contract (push cadence,
sequences, backfill, command application, health flags, failure injection) is a required
deliverable — it is the development stand-in until site access exists and the fixture for
integration tests. Preferably implemented in Python so it seeds the real edge client.

---

## Module Design

Deep modules with small interfaces; counting/state rules live in exactly one place each
(RESEARCH.md §14):

1. **Occupancy engine** — the only writer of current state and minute history. Interface:
   "process this push" / "apply this manual fallback"; hides sequence dedup, backfill
   rules, flooring, band computation, and snapshotting.
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

The repository has unit, component, API, Python simulator, browser, and disposable-Postgres
integration suites for Phases 1–3. Continue using Vitest for TypeScript unit/integration tests,
the repository Playwright suite for repeatable browser checks, and the disposable local
Postgres contract for database integration tests.

- **Unit (highest density):** schedule & business-day module (Friday hours, past-midnight
  close, boundary attribution, reset-due, next-open); band computation and threshold
  edges; freshness state machine including manual-fallback validity; command
  supersession/ordering; payload builder outputs for every state; settings validation.
- **Integration (API-level, real Postgres):** push → current state → public payload
  round trip; sequence idempotency and backfill-does-not-move-current; command lifecycle
  through simulated edge acks; correction/reset/audit transactional atomicity; role
  enforcement (staff calling owner procedures is rejected server-side); scheduled reset
  issuance; alert condition detection writing the alert log (Telegram transport faked);
  CSV export shape.
- **End-to-end (thin):** one browser smoke pass — public page renders each payload state
  correctly in Arabic RTL and English LTR, and a staff correction flows through the
  simulated edge to the public payload.
- **Visual and accessibility acceptance:** Browser inspection plus repeatable Playwright
  screenshots at the required mobile/desktop sizes in Arabic RTL and English LTR; keyboard and
  focus order; reduced motion; wrapping/overflow; responsive tables; and chart hover,
  keyboard-focus, and mobile-tap selection. Loading, stale, closed, unavailable, and error
  states are verified independently.
- **Edge simulator** doubles as the integration fixture and the manual dev harness,
  including failure injection for the alerting and recovery acceptance tests.
- The pilot targets' acceptance protocols (spot checks, injected failures, reboot tests)
  are operational tests executed on site, not CI tests; the spec's targets define their
  pass criteria.

---

## Out of Scope

Everything in RESEARCH.md §16's scope fence, reaffirmed, plus items settled during this
spec:

- **Trend indicator** — deferred; a null slot is reserved in the payload so adding it
  later is non-breaking. A noisy arrow would undermine the honesty principle.
- **Light theme** — dark-only v1 (recorded 2026-07-11); tokens stay semantic so a light
  theme is a value-override later.
- **Multi-gym/SaaS, predictions, floor headcount, snapshots, WebSockets/SSE, face/identity
  anything, native apps, visitor accounts, bookings, payments, push notifications,
  capacity/owner alerts, turnstile-pulse cross-check, managed fleet updates** — per
  RESEARCH.md §16.
- **Deployment execution** — Supabase project provisioning/region/pooling, Vercel spend
  caps and cron plan verification, domain purchase, secrets placement: pre-deploy gates
  (RESEARCH.md §11), deliberately not part of this spec's build scope.
- **CV pipeline internals** — detector/tracker selection, ROI/line calibration, Windows
  packaging specifics: blocked on the site-check gates (RESEARCH.md §18); only the cloud
  contract and lifecycle requirements are specced.
- **Phase/slice planning** — a separate step after this spec.
- **Email delivery** (password reset mail, etc.) — owner/maintainer reset flow avoids the
  dependency in v1.
- **Turborepo** — not justified at current workspace size (ADR-001).

## Open Questions

None block implementation; all are external gates or deploy-time choices:

- Real capacity and band thresholds — measured on site; admin-configurable regardless.
- Site-check gates (RESEARCH.md §18): camera/RTSP access, exit-path geometry, edge PC
  capability, remote access, actual hours vs. Google (esp. Friday), timezone confirmation.
- Owner sign-off items: transparency notice wording, remote maintenance/calibration
  acknowledgment, maintenance scope.
- Domain / final URL host (paths are fixed by this spec; the host is not).
- Chart library selection — constrained by DESIGN_GUIDE §12 (RTL mirroring, token colors,
  accessible fallbacks); pick during implementation.
- i18n library vs. typed in-repo message catalogs — behavior is fully specced; the
  mechanism is an implementation choice.
- Vercel plan's cron cadence and Supabase tier/pausing/backups/pooling — pre-deploy
  verification (RESEARCH.md §11).
- Pilot target values — adopted provisionally above; confirm with the owner at pilot
  kickoff and record any adjustment in this file.

## Further Notes

- **Honesty is a requirement, not a tone.** Every surface that shows a number must identify
  it as approximate, carry its freshness, and carry its state. Approved Arabic public copy
  uses the explicit `العدد التقريبي` label instead of `حوالي` or a person unit; a
  confidently wrong page is a spec violation, not a style issue (RESEARCH.md §4).
- **The governing cost rule** — compute scales with time/cache windows, never visitor
  count (RESEARCH.md §9) — is an acceptance criterion here, not advice: any
  visitor-reachable path that invokes a function per request on cache hit is a defect.
- The repository hierarchy is defined in `AGENTS.md`. Product and Spec are co-authoritative
  within their named domains. If they overlap and disagree, mark `NEEDS_HUMAN`; do not silently
  choose one. `RESEARCH.md`, ADRs, archived plans, mockups, and prototypes preserve rationale
  and provenance but cannot override Product/Spec.
