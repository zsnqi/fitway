<!-- Part of SPEC.md; the index and the rule for editing are in SPEC.md at the repository root. -->

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
The level mark (28-bar signal on the shipped page) is rendered from `band`, not from a hidden
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
Product approved the feature in principle on 2026-10-29 (public-redesign-r01 DECISIONS item 4): when built,
after v1 and under every constraint above, the owner's setting is on by default, the warning is shown to the owner
where capacity is set and where the setting is, and turning it off omits the field. The approval still needs its
versioned Product/Spec change before any implementation.

**2. Staff/owner procedures (oRPC, session + role enforced server-side).**

- Staff-or-owner: live operational snapshot (public payload fields + capacity, device
  last-seen, health flags, pending command status, source detail). Read-only. ADR-008
  retired `staff.issueCorrection` and `staff.issueReset`; no oRPC procedure issues a
  command, and none may be reintroduced without a new versioned product decision.
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

- `/` — public occupancy page (no auth chrome and no header/nav from the scaffold demo; no
  Owner rail, bar or header; the page carries the brand, the language switch, the gym's name as
  fixed text, and in the error state only «إعادة المحاولة»).
- `/login` — PIN-based staff sign-in; owner access uses its separately provisioned real
  account path. No sign-up route; the scaffolded email/password staff form is not the target.
- `/staff` — operational view; requires `staff` or `owner`.
- `/admin` — owner area (analytics, settings, accounts, audit, health); requires `owner`;
  organized as nested sections under one layout.
- The scaffold's `/dashboard` demo route is removed.

