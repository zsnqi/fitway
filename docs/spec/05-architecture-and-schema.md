<!-- Part of SPEC.md; the index and the rule for editing are in SPEC.md at the repository root. -->

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
  backfill is idempotent. Retained indefinitely. `manual` remains a compatibility enum value,
  not an authorized production source.
- **Current state** — a single-row table: current count, band, source (`edge` | `manual`),
  last push received at, last edge-reported counter time, active device. This is what the
  public payload builder reads; it is advanced only by accepted live pushes, never by backfill.
  The Phase 6 ADR-008 review found no authorized production `source=manual` producer; the enum
  remains for compatibility without authorizing a manual fallback.
- **Settings versions** — append-only: capacity, band thresholds (% boundaries for
  Quiet/Moderate/Busy/Packed), weekly hours, business-day boundary, reset buffer minutes,
  timezone, freshness windows (push interval; public fresh window 90 s, older is stale;
  operational stale threshold 180 s for staff health and alerts; public poll ~60 s), created-by,
  effective-from. Current settings = latest row; historical rows keep
  old analytics honest (RESEARCH.md §8).
- **Edge devices** — id, name, hashed device token, enabled flag, last-seen, last
  processed sequence number. One device in v1; the table exists so tokens are rotatable
  and a second camera later is additive.
- **Edge commands** — id (monotonic), type (`set_count` | `reset_zero`), value, status
  (`pending` → `delivered` → `applied`, or `superseded` | `expired`), issued-by (user or
  `system` for scheduled resets), reason, timestamps. A newer pending set/reset supersedes
  older pending ones; only the latest is delivered.
- **Audit log** — actor (authenticated principal; the shared front-desk principal for staff
  actions, accepted coarse granularity per RESEARCH.md §3), action, from → to values,
  optional reason (at most 240 characters), created-at. Written in the same transaction as the mutation it
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
- The pre-v1 scaffold was explicitly non-conforming: it enabled email/password and sign-up,
  used `SameSite=None`, relied on the default short session lifetime, and rendered an email/
  password staff form. Phase 4 replaced those assumptions and tests; the historical scaffold
  remains non-authoritative.

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

