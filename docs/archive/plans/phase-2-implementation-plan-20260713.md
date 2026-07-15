# Phase 2 Implementation Plan — Tracer bullet: simulated edge to live public page

> **ARCHIVED 2026-07-15 — NON-AUTHORITATIVE.** This plan includes superseded public schema-v1
> percentage behavior. Current public v2 is governed by Product, Spec, and ADR-005; surviving
> evidence is summarized in `docs/phase-records/phase-02-edge-to-public.md`.

> **Historical plan note (VDG-B):** this document records the Phase 2 implementation as it was
> planned. Its public `percentFull`, percentage, and numeric-meter requirements are superseded
> by the binding schema-version-2 public contract in `SPEC.md`, `PHASES.md`, `FITWAY_PRODUCT.md`,
> and `DESIGN_GUIDE.md`. The current/default public surface must not expose capacity, a
> denominator, or a derived percentage. A later authenticated-owner opt-in is governed only by
> the future contract in `SPEC.md`; it is not part of this historical plan. Edge ingestion and
> private threshold semantics are unchanged.

## 1. Purpose and scope

This plan covers Phase 2 only: one authenticated simulated edge device pushes anonymous occupancy data through the real server and database path, and the cached public endpoint drives the live visitor page. It is based on the complete Phase 2 section in `PHASES.md` and the governing decisions in `SPEC.md`, `RESEARCH.md`, `DESIGN_GUIDE.md`, and `SOL_SCAFFOLD_REVIEW.md`.

The phase is a vertical tracer bullet:

```text
Python simulator
  -> POST /api/edge/push (bearer token, rate limited)
  -> occupancy engine transaction
  -> edge_devices + occupancy_minutes + current_state
  -> GET /api/public/occupancy (CDN cached)
  -> Arabic/English public live UI
```

The phase must prove the path end to end without implying that simulated data is real production occupancy. Simulator defaults and seeded capacity/thresholds are development values pending the required site measurements and owner confirmation.

### In scope

- The first application migration and deterministic development seed for edge devices, settings, current state, and per-minute occupancy.
- A device-authenticated push endpoint with sequence idempotency, complete per-minute bucket upserts, health input, acknowledgements, and per-device rate limiting.
- The occupancy engine as the sole mutation boundary for current occupancy and minute history.
- The business-day attribution primitive required by minute history (timezone plus configurable boundary), but not schedule/open/closed behavior.
- A database-backed public payload builder that returns `fresh`, `stale`, or `unavailable` and preserves Phase 1 CDN cache headers.
- The complete Phase 2 live/stale/unavailable public UI, cached polling, Page Visibility behavior, localization, accessibility, and honest presentation.
- A Python edge simulator that speaks the exact OpenAPI contract and can be stopped, restarted, replayed, and configured to force exits.
- An accurate OpenAPI 3.1 document and a development-only interactive reference.
- Phase 2 unit, integration, contract, component, and thin browser tests.

### Explicitly out of scope

- Weekly opening hours, open/closed state, next-open calculation, or daily reset scheduling (Phase 3 and Phase 7).
- Staff/owner screens, corrections, reset commands, audit mutations, command delivery/application, or manual fallback (Phases 4–6). The push response contains `commands: []` only.
- Offline outbox/backfill behavior and the production Python CV client (Phases 6 and 12). Phase 2 minute upserts are retry-safe, but no backfill workflow is exposed.
- Telegram alerts, health transition logs, cron, analytics, CSV export, account/role work, production provisioning, or site-specific CV choices.
- Trend calculation (`trend` remains `null`), forecasts, WebSockets/SSE, multi-gym fields, visitor accounts, tracking, or any image/frame/video/identity handling.

## 2. Verified starting point

### Git and accepted Phase 1 baseline

- Branch: `main`.
- Worktree at planning start: clean (`git status --short --branch` showed no changed files).
- Local branch position: two commits ahead of `origin/main`.
- Reviewed pre-Phase-1 baseline: `639e456` — `chore: establish reviewed pre-phase-1 baseline`.
- Accepted Phase 1 implementation: `e43d38a` — `feat: establish phase 1 public foundation`.
- Baseline verification run on 2026-07-13:
  - `pnpm test`: 5 test files, 14 tests passed.
  - `pnpm check`: passed with no fixes.
  - `SKIP_ENV_VALIDATION=true pnpm check-types`: all workspace type checks passed and the web production build succeeded.

### Existing implementation to preserve

- `packages/api/src/public-occupancy.ts` owns the canonical public paths, the exact `public, s-maxage=30, stale-while-revalidate=60` policy, and the Phase 1 unavailable contract.
- `apps/server/src/public-occupancy.ts` is a DB-less Hono handler and is the seam to upgrade to the payload builder.
- `apps/server/src/index.ts` mounts the public route and the oRPC/OpenAPI handler. Its reference plugin is currently unconditional and must become development-only.
- `packages/db` currently exports only Better Auth schema and has no generated application migrations.
- `packages/api/src/routers/index.ts` is empty; domain modules do not yet exist.
- `apps/web/src/routes/index.tsx` performs a one-time React Query fetch and always resolves to the unavailable component.
- The web app already has the Arabic-first locale provider, persistent language toggle, Western-digit formatters, Cairo assets, dark-only `--fw-*` tokens, loading skeleton, unavailable state, and Phase 1 tests. Phase 2 extends these foundations rather than replacing them.
- The deployment rewrite keeps the external public/device paths under `/api/*` while Hono receives the stripped internal path. Canonical paths must remain centralized to prevent simulator, OpenAPI, server, and deployment drift.

## 3. Governing invariants

Every Phase 2 implementation decision must satisfy all of the following:

1. **Honesty:** a count is always qualified as “around/حوالي,” carries a last-updated time, and is never called live after the fresh window. Missing data never displays a number. Simulated defaults must be identified as development data.
2. **Privacy:** the request contract accepts anonymous counts, minute aggregates, timestamps, and coarse process/camera/feed health only. It has no image, frame, video, name, identity, biometric, per-person, or raw crossing-event field. Request bodies and bearer tokens must not be logged.
3. **Cache-first cost model:** the public endpoint retains `s-maxage=30, stale-while-revalidate=60`; freshness is computed at origin response creation and baked into the cached JSON. The public page calls only this endpoint, and the builder reads current state plus current settings—never `occupancy_minutes`.
4. **Single writer:** only the occupancy engine writes `current_state` or `occupancy_minutes`. The edge HTTP handler authenticates, rate-limits, validates, delegates, and formats the result.
5. **Edge authority:** accepted live pushes determine current count. Cloud code floors the value at zero but does not invent crossings or reconcile corrections in this phase.
6. **Idempotency:** replayed, duplicate, or gapped/out-of-order sequences do not mutate device, current, or minute state. Minute bucket writes replace complete snapshots under a unique `(device_id, minute_start_utc)` key; they never add deltas to an existing row.
7. **Time correctness:** timestamps are UTC in storage. Business-day dates are computed in the configured IANA gym timezone using the configured local boundary, defaulting to `Asia/Riyadh` and `04:00`.
8. **Public data minimization:** capacity, threshold values, device identity, health details, sequence values, and settings internals never appear in the public payload.
9. **UI system:** dark-only Fitway tokens, Cairo, Arabic RTL default, first-class English LTR, Western digits through `-u-nu-latn`, logical layout, tabular changing numbers, reduced-motion support, and no status communicated by color alone.
10. **Strict phase boundary:** no placeholder UI or dormant public contract for future staff, schedule, command, backfill, alert, analytics, or CV features beyond fields that the Phase 2 acknowledgement explicitly requires (`commands: []`).

## 4. Target module and file shape

Names may be adjusted to local conventions during implementation, but ownership must remain as follows.

### `packages/db` — schema and migration history

- Add application schema modules, likely:
  - `src/schema/edge-devices.ts`
  - `src/schema/settings.ts`
  - `src/schema/occupancy.ts`
  - exports in `src/schema/index.ts`
- Generate and commit the first Drizzle application migration under `src/migrations/` plus Drizzle metadata.
- Add a Phase 2 development-device provisioning/seed script that stores only a token hash. Do not place a raw device token in a migration, fixture committed to Git, or browser-readable environment variable.

### `packages/api` — contracts and deep domain modules

- Expand `src/public-occupancy.ts` into the language-neutral discriminated public payload contract while preserving canonical paths and cache constants.
- Add an edge push contract module with Zod request/response schemas and canonical internal/external paths.
- Add deep modules:
  - `occupancy/engine.ts` — transactional push processing and the only state writer.
  - `occupancy/bands.ts` — pure threshold/band calculation.
  - `occupancy/business-day.ts` — pure timezone/boundary attribution only.
  - `public/payload-builder.ts` — current/settings read and freshness projection.
- Expose the edge operation through the oRPC router so the OpenAPI document is generated from the same schemas used at runtime. Keep database operations injectable for deterministic unit and integration tests.

### `apps/server` — HTTP concerns

- Add bearer-token authentication and hashing, a per-device limiter, and the edge push mount.
- Upgrade the public handler to call the payload builder and preserve the Phase 1 cache header on every successful payload state.
- Ensure all edge responses, auth failures, rate-limit responses, and OpenAPI/reference responses use an appropriate non-public cache policy (`no-store` for device traffic).
- Separate the machine-readable OpenAPI JSON from the interactive reference. Keep JSON available at a stable path; mount the interactive UI only when `NODE_ENV !== "production"`.
- Redact `Authorization` and push bodies from logging or replace broad request logging on `/edge/*` with metadata-only logs (status, device id after auth, sequence outcome, duration).

### `apps/web` — live public experience

- Extend the public contract parser/fetcher to accept the exact unavailable/fresh/stale union.
- Add focused components for the occupancy hero, approximate count, crowd badge, meter, freshness, and stale banner, composed by the `/` route.
- Expand both message catalogs in lockstep; keep components free of user-facing hard-coded strings.
- Add a polling hook/controller that owns jitter, visibility pause, focus refetch, and announcement throttling.

### `edge/` — simulator, outside pnpm workspaces

- Add a small Python simulator and README/config example under top-level `edge/`; do not add `edge/` to `pnpm-workspace.yaml`.
- Prefer the Python standard library for Phase 2 unless a dependency materially simplifies contract validation. This is a simulator, not the site-gated CV client.
- Ignore local simulator state and secrets in Git.

## 5. Schema and migration plan

Use Drizzle migrations as the only schema history. Do not use `db:push` as the implementation record. All timestamp columns use timezone-aware Postgres timestamps, and database constraints repeat critical domain invariants as defense in depth.

### 5.1 `edge_devices`

Required columns:

- `id`: UUID primary key with a database-generated default.
- `name`: non-empty text for operator identification.
- `token_hash`: fixed-format SHA-256 digest (hex text or `bytea`), unique and non-null. The schema/API must make clear that raw tokens are never stored.
- `enabled`: boolean, non-null, default `true`.
- `last_seen_at`: nullable UTC timestamp; updated only by a newly accepted contiguous push, not by a replay or sequence gap.
- `last_sequence`: non-negative 64-bit integer, non-null, default `0`.
- `created_at` and `updated_at`: UTC timestamps.

Indexes/constraints:

- Unique index on `token_hash`.
- Check `last_sequence >= 0`.
- Index on `enabled` is unnecessary for one device unless the authentication query plan demonstrates a need; token hash is the lookup key.

### 5.2 `settings_versions`

Phase 2 columns only:

- `version`: monotonic 64-bit primary key/identity used in acknowledgements and history snapshots.
- `capacity`: positive integer.
- Three ascending percent boundaries sufficient to derive four exhaustive bands. Use explicit names such as `quiet_max_percent`, `moderate_max_percent`, and `busy_max_percent`, with a database check `0 <= quiet < moderate < busy <= 100`; values above the last boundary are `packed`.
- `timezone`: non-empty IANA identifier, default seed `Asia/Riyadh`; validate it in application code before use.
- `business_day_boundary`: local `time`, default seed `04:00`.
- `push_interval_seconds`: positive integer, seed `20`.
- `fresh_for_seconds`: positive integer, seed `90`; this is the maximum age at which the public experience may present data as fresh.
- `operational_stale_after_seconds`: integer greater than `fresh_for_seconds`, seed `180`; this is the edge-silence/health threshold, not an extension of public freshness.
- `public_poll_seconds`: positive integer, seed `60`.
- `effective_from` and `created_at`: UTC timestamps.
- `created_by`: nullable for the system seed. Better Auth/audit coupling is deferred until settings mutation exists.

Seed one immutable settings row. Use deterministic development values for capacity and bands (proposed: capacity `100`, boundaries `25/50/75`) and label them in seed/docs as non-production placeholders that must be replaced after site measurement. Do not build a Phase 2 settings editor.

### 5.3 `current_state`

Use a constrained singleton row rather than relying on convention:

- `id`: small integer primary key constrained to `1`.
- `current_count`: nullable non-negative integer; null means no usable device data has ever been accepted.
- `band`: nullable constrained value `quiet | moderate | busy | packed`.
- `source`: nullable constrained value `edge | manual`; Phase 2 writes `edge` only, while retaining the governing conceptual schema.
- `last_push_received_at`: nullable server receipt timestamp used for public freshness.
- `last_edge_reported_at`: nullable edge timestamp for diagnostics, never trusted for freshness.
- `active_device_id`: nullable foreign key to `edge_devices`.
- `settings_version`: nullable foreign key to the settings snapshot used for the accepted state.
- `updated_at`: UTC timestamp.

Seed the singleton with null state, so the public builder returns `unavailable` before the first accepted push. Add a check that all live-state fields are either coherently null or populated, plus `current_count >= 0`.

### 5.4 `occupancy_minutes`

Required columns:

- `device_id`: foreign key to `edge_devices`.
- `minute_start_utc`: UTC timestamp truncated/aligned to a minute.
- `business_day`: gym-local date derived from settings timezone and boundary.
- `count`: non-negative end-of-minute/current-minute snapshot.
- `entries`: non-negative complete aggregate for that minute.
- `exits`: non-negative complete aggregate for that minute.
- `band`: `quiet | moderate | busy | packed`.
- `capacity_snapshot`: positive integer.
- `settings_version`: foreign key to the settings row used for derivation.
- `source`: constrained `live | backfill | manual`; Phase 2 writes `live` only.
- `updated_at`: UTC timestamp, useful because the active minute is replaced as totals grow.

Keys/constraints:

- Composite primary key or unique constraint on `(device_id, minute_start_utc)`.
- Checks for minute alignment, `count >= 0`, `entries >= 0`, `exits >= 0`, and `capacity_snapshot > 0`.
- Index on `(business_day, minute_start_utc)` may be added now because it directly supports the preserved history contract, but no analytics query is implemented in this phase.

### 5.5 Migration/seed/provisioning workflow

1. Define schema and relations.
2. Generate a named migration; inspect the SQL for checks, foreign keys, uniqueness, and seed order.
3. Insert the settings seed and empty current singleton in migration SQL or a deterministic database seed invoked immediately after migration. The result must be repeatable in local integration databases.
4. Provision the development simulator device separately:
   - Generate at least 32 random bytes using a cryptographically secure generator, or accept a developer-supplied token.
   - Hash with SHA-256 using the same canonical UTF-8 representation as server authentication.
   - Insert/update the device by stable development name.
   - Show the raw token once to the developer and store it only in a local ignored environment/config file.
5. Apply the migration to a disposable local Postgres/Supabase database and verify both an empty database and a second no-op migration run.
6. Integration tests must require a dedicated test database URL and refuse obvious production URLs; they must not mutate an arbitrary `DATABASE_URL` silently.

## 6. Edge push contract and authentication

### 6.1 Canonical route and transport

- External route: `POST /api/edge/push`.
- Internal Hono resource path after Vercel rewrite: `/edge/push`.
- Content type: `application/json`.
- Authentication: `Authorization: Bearer <raw-device-token>`.
- All success and error responses: `Cache-Control: no-store`.
- HTTPS is mandatory outside local development.

Keep both path constants in the shared contract module. The simulator must consume the external path/base URL configuration rather than duplicate it in multiple files.

### 6.2 Request schema v1

Proposed exact JSON shape:

```json
{
  "schemaVersion": 1,
  "sequence": 42,
  "observedAt": "2026-07-13T18:24:20.000Z",
  "currentCount": 37,
  "minutes": [
    {
      "minuteStart": "2026-07-13T18:24:00.000Z",
      "count": 37,
      "entries": 2,
      "exits": 1
    }
  ],
  "health": {
    "process": "ok",
    "camera": "ok",
    "feed": "ok",
    "detectorFps": 4.8
  },
  "appliedCommandId": null
}
```

Contract rules:

- `schemaVersion` is exactly `1`.
- `sequence` is a positive safe integer serialized as JSON number for Python/TypeScript interoperability. Reject values beyond the agreed safe range rather than losing precision.
- `observedAt` and `minuteStart` are canonical UTC ISO-8601 timestamps. `minuteStart` must be second/millisecond zero and cannot be implausibly far in the future. Server receipt time, not edge time, controls freshness.
- `currentCount` and minute `count` are integers. Negative input is tolerated only if the governing floor-at-zero rule is intentionally exercised; the validated domain value written and acknowledged is always `max(0, value)`. `entries` and `exits` are non-negative integers.
- Each minute object is a **complete snapshot** of totals for that minute, not an increment to add. This is what makes repeated current-minute upserts idempotent.
- Bound request size and bucket count. For Phase 2, permit only a small live window (for example current and immediately previous minute, maximum 2 buckets) and reject a backfill-sized batch. Phase 6 can deliberately widen/flag this contract when offline backfill is implemented.
- Minute buckets must be unique and sorted ascending in the request.
- Health enums are `ok | degraded | failed | unknown`; `detectorFps` is nullable or a finite non-negative number. Health is validated and acknowledged but not persisted to a health log or exposed publicly in Phase 2.
- `appliedCommandId` must be `null` in Phase 2. It reserves the governing field without pretending command acknowledgement exists.
- Unknown fields are rejected so image/identity data cannot accidentally enter the API unnoticed.

### 6.3 Response schema v1

```json
{
  "schemaVersion": 1,
  "accepted": true,
  "reason": "processed",
  "highestProcessedSequence": 42,
  "commands": [],
  "settings": {
    "version": 1,
    "pushIntervalSeconds": 20
  },
  "serverTime": "2026-07-13T18:24:20.250Z"
}
```

- `accepted` distinguishes a newly processed push from a harmless replay/gap acknowledgement.
- `reason`: `processed | replay | sequence_gap`.
- `highestProcessedSequence` is the device row’s highest contiguous committed sequence after handling the request.
- `commands` is typed as an empty tuple/array in Phase 2; do not emit fake command types.
- `settings.version` is the current settings version used by the server, and `settings.pushIntervalSeconds` is the effective settings-driven cadence the simulator adopts after this acknowledgement. No schedule/reset settings are returned in Phase 2.
- `serverTime` is canonical UTC.
- Authentication failures use a minimal `401` error and do not disclose whether a device exists or is disabled.
- Rate limiting returns `429` with `Retry-After` and no state mutation.
- Schema/semantic validation failures return `400`/`422` consistently as generated by the contract layer; internal failures return a non-sensitive `500`.

### 6.4 Authentication flow

1. Require one well-formed Bearer token and reject missing, blank, duplicate, or wrong-scheme credentials.
2. Enforce a minimum raw token length consistent with provisioning (at least 32 random bytes; the encoded token will be longer).
3. SHA-256 hash the presented UTF-8 token and query the unique hash. Equality is performed on fixed-size digests; no raw secret is loaded from the database.
4. Reject absent or disabled devices with the same `401` response.
5. Attach only the authenticated device id/name to the request context. Never pass the raw token into domain logic.
6. Ensure logger/error paths redact the authorization header and body.

## 7. Idempotency, ordering, concurrency, and rate limiting

### 7.1 Sequence semantics

Sequences are strictly contiguous per device:

- If `sequence === last_sequence + 1`, process it in one transaction.
- If `sequence <= last_sequence`, return `accepted: false, reason: "replay"` and the current highest sequence. Do not update `last_seen_at`, current state, minute rows, or freshness.
- If `sequence > last_sequence + 1`, return `accepted: false, reason: "sequence_gap"` and the current highest sequence. Do not mutate state. The simulator retries from the missing sequence.

This makes “out of order” unambiguous and prevents a late missing push from overwriting newer state. A replay cannot keep stale data looking fresh.

### 7.2 Transaction and locking

For a contiguous sequence, the occupancy engine opens one database transaction and:

1. Locks the authenticated device row (`SELECT … FOR UPDATE`) to serialize concurrent pushes for that device.
2. Re-checks `enabled` and sequence under the lock.
3. Loads the latest settings version once.
4. Floors the top-level and minute counts at zero; computes bands from the same settings snapshot.
5. Computes each minute’s business day using the minute UTC timestamp, settings timezone, and boundary.
6. Upserts complete minute snapshots on `(device_id, minute_start_utc)`, setting source `live`, capacity snapshot, and settings version. Conflict action replaces the snapshot; it never increments stored entries/exits.
7. Updates the singleton current state from the top-level authoritative live sample, with server receipt time as `last_push_received_at`, edge time as `last_edge_reported_at`, source `edge`, and the computed band.
8. Updates device `last_sequence` and `last_seen_at`.
9. Commits, then formats the acknowledgement from committed state.

Any error rolls back all four mutations. The public endpoint can therefore never observe a new sequence/current count without its corresponding minute snapshot.

### 7.3 Rate limiter

- Implement an in-process token-bucket limiter keyed by authenticated device id, with an injectable clock/store for tests.
- Proposed pilot values: capacity 3 requests and refill 1 token every 5 seconds. This permits a small retry/startup burst while remaining generous against the normal 20-second cadence.
- Authenticate before applying the per-device limiter so keys are stable and cannot be spoofed from a header value.
- Return `429`, `Retry-After`, and `no-store` before entering the occupancy transaction.
- Bound and periodically evict limiter entries even though v1 has one device.
- Document in code and the plan handoff that serverless instances do not share this limiter. Static high-entropy device authentication is the primary control for the pilot; a distributed limiter is not introduced without evidence or a scope change.

## 8. Occupancy engine boundaries

Expose one narrow operation such as `processLivePush(input, dependencies)` returning a sequence outcome and committed state metadata. HTTP status selection, header parsing, rate limiting, OpenAPI rendering, and public localization must remain outside it.

The engine owns:

- sequence re-check under lock;
- count flooring;
- band computation;
- minute alignment/semantic validation after schema parsing;
- business-day attribution;
- complete-snapshot minute upserts;
- settings/capacity snapshots;
- current-state advancement;
- device sequence/last-seen advancement;
- transaction atomicity.

It does not own:

- bearer authentication or token hashing;
- per-device rate limiting;
- schedule/open/closed calculations;
- command issuance/delivery/acknowledgement;
- manual fallback or backfill;
- health transitions/alerting;
- public payload localization or browser polling.

Pure helpers should be directly testable:

- `floorOccupancy(value) -> non-negative integer`.
- `bandFor(count, capacity, thresholds) -> quiet|moderate|busy|packed`, with percentage comparisons documented at exact boundaries and zero/over-capacity cases.
- `businessDayFor(utcInstant, timezone, boundary) -> YYYY-MM-DD`, including pre/post 04:00 Riyadh and UTC date-crossing cases.

## 9. Public payload and caching

### 9.1 Language-neutral discriminated union

Preserve schema version `1`, Phase 1’s minimal unavailable shape, and `trend: null`:

```ts
type PublicOccupancyPayload =
  | {
      schemaVersion: 1;
      freshness: "unavailable";
      computedAt: string;
      trend: null;
    }
  | {
      schemaVersion: 1;
      freshness: "fresh" | "stale";
      band: "quiet" | "moderate" | "busy" | "packed";
      count: number;
      percentFull: number;
      lastUpdatedAt: string;
      freshUntil: string;
      source: "edge" | "manual";
      computedAt: string;
      trend: null;
    };
```

- Do not expose `capacity`, thresholds, device id/name, raw health, sequence, business day, or settings version.
- `count` is guaranteed non-negative.
- `percentFull` is the non-negative rounded occupancy ratio capped at `100` by the payload builder. The displayed percentage, meter fill, and meter ARIA numeric value all consume this same capped field. The underlying count remains uncapped and may exceed capacity; such a count produces the `packed` band.
- `lastUpdatedAt` is the server receipt time of the last accepted live push, not the edge clock.
- `freshUntil` is the absolute UTC instant `lastUpdatedAt + fresh_for_seconds`. It is part of the public safety contract, not a display suggestion.
- `computedAt` is the origin recomputation time proving that freshness was baked into the response.

Open/closed fields are intentionally absent until Phase 3.

### 9.2 Resolved freshness semantics

The governing documents name both a 90-second fresh window and a 180-second stale/edge-silence threshold without naming the state for ages between them. Phase 2 interprets these as two different concerns, not as a 90-second ambiguity:

- **Public truthfulness threshold:** data is publicly `fresh` only through `fresh_for_seconds` (default 90). At any age greater than 90 seconds, the public experience is `stale` and uses the last-known treatment.
- **Operational silence threshold:** `operational_stale_after_seconds` (default 180) is when the edge is considered operationally silent/offline for later health logging and alerting. Those operational behaviors are deferred to their phases. Crossing 180 seconds does not introduce a new Phase 2 public state; it remains `stale`.
- Therefore the 90–180-second interval is a deliberate operational grace interval while the public UI is already conservative. It is never presented as fresh.

Builder algorithm at injected `now`:

Builder algorithm at injected `now`:

1. Read only the singleton current row, its active enabled device, and the latest settings row. Do not import/query the minute-history table.
2. Return `unavailable` when the singleton is empty, the active device is missing/disabled, settings are absent/invalid, or there is no usable last accepted push.
3. Return `fresh` only when age is non-negative and `<= fresh_for_seconds` (default 90).
4. Return `stale` for every usable value older than the fresh window, including the entire 90–180-second operational grace interval and all later ages.
5. Future timestamps caused by clock anomalies do not become indefinitely fresh; clamp small negative age to zero or return stale/unavailable for implausible values and test the policy.

### 9.3 Cache-safe freshness contract

The endpoint keeps the existing `Cache-Control: public, s-maxage=30, stale-while-revalidate=60`. Because stale-while-revalidate may legally serve a previously generated JSON object after its baked `freshness: "fresh"` label has aged out, the origin label alone is not sufficient for presentation.

The contract prevents an expired cached payload from remaining visibly fresh as follows:

1. Every usable payload includes immutable `lastUpdatedAt`, absolute `freshUntil`, and `computedAt` values produced by the origin.
2. The origin marks a payload `fresh` only when its own computation time is at or before `freshUntil`; otherwise it emits `stale`.
3. The browser derives an **effective freshness** before every render: it may render fresh only when the payload says `fresh` **and** the current time is strictly before `freshUntil`. Either condition failing downgrades locally to stale; the browser can never upgrade an origin-stale payload.
4. On receiving a fresh payload, the browser schedules a local one-shot expiry at `freshUntil`. The UI changes to stale at that instant even if no poll occurs and even if the CDN continues serving the same object during stale-while-revalidate.
5. Missing/invalid `freshUntil`, implausible timestamp ordering, or material client clock skew detected against `computedAt` fails closed to stale/unavailable rather than fresh. Tests use an injected clock.
6. A subsequent refetch still uses the CDN-cached endpoint; no visitor request bypasses the cache or touches history. SWR may delay newer data, but it cannot mislabel expired data as live.

Errors must not be cached as successful occupancy JSON. The CDN continues to bound origin work by the cache window, while the absolute expiry bounds what the visitor can see as fresh.

## 10. Public live UI

### 10.1 Rendering states

- **Loading:** preserve the Phase 1 skeleton, `aria-busy`, hidden decorative skeletons, and localized polite loading announcement.
- **Unavailable:** preserve the existing honest offline state and show no count, percentage, meter, or band.
- **Fresh:** compose DESIGN_GUIDE §§8.9–8.14:
  - dominant count with visible “around/حوالي” qualifier and localized unit;
  - quiet/moderate/busy/packed badge with distinct icon, text, and color;
  - meter with visible percent readout, `role="meter"`, localized `aria-valuetext`, and clamped fill;
  - last-updated absolute local time plus concise relative time;
  - fresh icon/text, not pulse/color alone.
- **Stale:** retain the last-known count but label it explicitly as last known, dim it, render the striped/dimmed meter, replace live freshness language, and show the §8.15 warning containing the last-known value and time. The transition to stale must be announced, but routine timestamp rerenders must not chatter.
- **Locally expired cached fresh payload:** render identically to stale as soon as `freshUntil` passes; never wait for the next poll or CDN recomputation.

### 10.2 Localization and formatting

- Add all count, unit, percentage, band, freshness, relative-time, stale, and accessibility-summary strings/functions to both `ar` and `en` catalogs with compile-time key parity.
- Use existing `formatNumber`/`formatDate` and extend helpers around `Intl.RelativeTimeFormat` using `ar-SA-u-nu-latn` and `en-SA-u-nu-latn`.
- Format public time in `Asia/Riyadh`/the payload’s contractually fixed gym timezone for Phase 2. Do not infer the user’s browser timezone.
- Use 12-hour localized time with Western digits. Wrap mixed Arabic number/unit runs in `<bdi>` or equivalent isolation.
- No physical left/right CSS. Meter growth follows inline-start automatically for RTL/LTR.

### 10.3 Polling and visibility

Use one controller/hook, preferably built on the existing React Query instance:

- Initial request immediately on mount.
- Read the effective `public_poll_seconds` from a cacheable, non-sensitive response header such as `X-Fitway-Poll-Seconds` on every successful public response. Expose that header in development CORS. The settings row is the only runtime source of truth; the browser has no independent 60-second contract constant.
- If the header is absent/invalid, schedule no background poll for that response; keep local freshness expiry and refetch-on-focus active, and surface/fail to the honest error/unavailable state as appropriate. Do not introduce a browser fallback cadence that could drift from settings.
- Add bounded jitter per cycle (proposed ±10%, producing 54–66 seconds) using an injectable random source for tests; do not synchronize all clients on exact minute boundaries.
- When `document.visibilityState !== "visible"`, schedule no interval fetches.
- On `visibilitychange` back to visible, cancel any stale timer and refetch immediately once.
- Avoid duplicate refetches from React Query’s default focus behavior by choosing one owner for focus/visibility semantics.
- Abort/cancel on unmount and avoid overlapping requests.
- On transient fetch/parse failure, do not present old client data as freshly fetched. Preserve it only with stale/error honesty or fall back to the unavailable presentation; never let React Query’s cached timestamp imply source freshness.
- Independently schedule/cancel the `freshUntil` expiry timer. Poll timing and freshness expiry are separate: polling seeks newer data, while `freshUntil` prevents an old cached value from remaining live.

### 10.4 Motion and accessibility

- Count uses `font-variant-numeric: tabular-nums`; updates may cross-fade/flip in at no more than `--fw-dur-slow` and must not move layout.
- Honor global `prefers-reduced-motion`: immediate number/meter updates, no pulse/shimmer/flip.
- Provide one concise screen-reader summary containing band, approximate count, percentage, freshness, and last update.
- Use `aria-live="polite"` for meaningful count/band/freshness changes and throttle/deduplicate announcements so the 60-second poll and relative-time tick do not create spam.
- Status remains usable in grayscale: label + icon + color + meter position.
- Verify contrast, 390px layout, 200% zoom/reflow, both directions, and 44px language-toggle target.

## 11. Edge simulator v1

Implement under `edge/` as a development tool that sends only anonymous numeric/health data.

### Required behavior

- CLI/config inputs: server base URL, raw token, deterministic random seed, starting count, optional state-file path, and a pattern/mode. Normal operation does not take an independent cadence value.
- Send the first push immediately on startup, then adopt `settings.pushIntervalSeconds` from every valid acknowledgement as the sole runtime cadence source. A clearly named test-only cadence override may exist for automated/Manual QA, but it must announce that settings-driven timing is bypassed and must never be the default path.
- Persist at least sequence and current count in a local ignored state file so clean stop/start resumes monotonically. Write state atomically after an acknowledged processed push.
- Maintain complete entry/exit totals for the active UTC minute and send the current minute snapshot on each cadence.
- Generate plausible bounded patterns: mostly zero/small flows, busier windows, no impossible negative local count after applying exits. A deterministic seed makes tests/reproduction stable.
- Support a documented “exit-heavy” mode for floor-at-zero QA.
- Support a documented replay action that resends an already acknowledged request without incrementing local state.
- Support a documented sequence-gap action to prove out-of-order handling and recovery.
- Send configurable health enums and detector FPS so the contract is exercised; no Phase 2 alert behavior is implied.
- Handle `SIGINT`/Ctrl+C cleanly: finish or cancel the active request, persist acknowledged state, print a concise stop summary, and exit without corrupting state.
- On `401`, stop with an actionable authentication message and never print the token.
- On `429`, honor `Retry-After` without changing sequence.
- On network/5xx errors, retry the same sequence with bounded exponential backoff and jitter; only advance after `accepted: true` or a replay acknowledgement proving that sequence is already committed.
- On `sequence_gap`, reset its send cursor to `highestProcessedSequence + 1` if that request is available; otherwise stop and tell the developer how to reset/reconcile the local development state. Do not silently skip.

### Settings propagation in Phase 2

- The database settings row is authoritative for push cadence, public freshness, the later operational silence threshold, and browser polling.
- The simulator learns cadence through the authenticated push acknowledgement and applies changes after the response that reports the new settings version.
- The public payload builder applies `fresh_for_seconds` directly and emits `freshUntil`; the browser never reimplements or downloads the raw freshness window.
- The public response exposes `public_poll_seconds` through the cacheable `X-Fitway-Poll-Seconds` header, which the browser uses for its next jittered interval. A changed setting reaches visitors on the next origin recomputation after normal CDN expiry/revalidation; no cache bypass is added.
- `operational_stale_after_seconds` is stored and tested as a semantic boundary but has no active health/alert consumer until the later operations phase.
- Live settings mutation/admin UI is not part of Phase 2. Dynamic propagation is nevertheless defined and testable by inserting a newer settings version in an integration test or through DB Studio in supplemental QA; no simulator/browser restart should be required after the next acknowledgement or origin-recomputed public response.

### Simulator honesty and privacy

- README output must state “simulated development occupancy,” not suggest it is the real gym feed.
- No camera dependencies, RTSP settings, frames, images, raw crossing records, identities, or telemetry/tracking.
- Token and state files are ignored; logs show endpoint, sequence outcome, counts, bucket totals, and timing only.

## 12. OpenAPI contract

- Define the push operation once through the oRPC/Zod contract and generate OpenAPI 3.1 from it. Do not hand-maintain a divergent JSON/YAML schema.
- Give the operation a stable id (for example `edge.pushOccupancy`), `Edge` tag, summary, request/response examples, Bearer security scheme, and documented `401`, `422`, `429`, and `500` responses.
- Accurately express strict objects, enums, integer bounds, canonical timestamp formats, nullable `appliedCommandId`, the empty Phase 2 commands array, and response reason variants.
- Publish machine-readable JSON at a stable same-origin path such as external `/api/openapi.json`.
- Mount the interactive reference at a distinct development path only when `NODE_ENV !== "production"`. A production request to the reference UI must return 404 (or require auth later); the plan chooses 404 for Phase 2.
- Ensure the OpenAPI server/base path matches the Vercel `/api` rewrite, while local simulator configuration can target the local server directly.
- Add a contract test that loads the generated document, locates `POST /edge/push` (or the documented external representation), asserts the Bearer security requirement and schemas, and validates the simulator’s sample request/response fixtures against the source Zod schemas.

## 13. Implementation sequence

Keep commits/review units vertical and small; do not start later phases while closing gaps in this one.

1. **Freeze Phase 2 contracts and semantics.** Add a short contract note/tests for paths, payload unions, sequence rules, minute snapshot semantics, and the conservative freshness mapping. This prevents schema, simulator, and UI from independently guessing.
2. **Create schema and first migration.** Add the four tables, checks, relations, settings/current seeds, migration SQL, and safe development device provisioning. Apply against a disposable local database and inspect generated SQL.
3. **Build pure occupancy primitives.** Implement count floor, exact threshold behavior, and timezone/boundary business-day attribution with dense unit tests.
4. **Build the occupancy engine.** Implement transaction locking, contiguous sequence processing, complete minute upserts, snapshots, singleton/device advancement, and replay/gap outcomes. Verify with real-Postgres integration tests before exposing HTTP.
5. **Add device authentication and rate limiting.** Implement token parsing/hash lookup, disabled-device behavior, limiter, redacted logging, and `no-store` responses with injected dependencies for tests.
6. **Expose the push operation and OpenAPI.** Mount the contract at the canonical Hono route, generate machine-readable OpenAPI, gate reference UI to development, and run contract tests.
7. **Deliver simulator v1.** Implement deterministic cadence/state/retry/replay/gap/exit-heavy/health behavior against the real endpoint. Use it to exercise the transaction and OpenAPI examples.
8. **Upgrade the public payload builder/handler.** Read only current/settings/device state; produce unavailable/fresh/stale union with baked `computedAt` and `freshUntil`; cap `percentFull` at 100; emit the settings-driven poll header; preserve exact CDN cache headers; prove through query-level/integration tests that history is not read.
9. **Build the public live UI.** Extend catalogs/formatters and add the hero, badge, meter, freshness, stale warning, tabular update motion, accessible summary, and honest error behavior.
10. **Add cache-safe freshness and polling/visibility behavior.** Implement local `freshUntil` expiry, settings-header-driven jittered polling, hidden pause, immediate refocus fetch, cancellation, and announcement throttling with fake-clock component tests.
11. **Complete Phase 2 verification.** Run unit/integration/contract/component/browser checks, Biome, type checks, production build/reference-gating check, then execute the three required Manual QA test suites below.

## 14. Testing strategy

Per `PHASES.md`, implement the vertical slice first, then add/finish its tests as a separate work item before Manual QA. Tests should use injected clocks/randomness and a dedicated Postgres database so timing and transaction behavior are deterministic.

### Unit tests

- **Banding:** zero, every threshold boundary, one below/above, count over capacity, invalid settings rejection.
- **Flooring:** negative input, zero, large positive input; both current and minute counts.
- **Business day:** Riyadh 03:59:59 vs 04:00, UTC/local date crossing, another valid IANA timezone, invalid timezone, boundary exactly at instant.
- **Freshness/payload:** empty state, disabled device, exactly 90 seconds, 90 seconds + 1 ms, 180 seconds, old-but-usable stale, future timestamp policy, absolute `freshUntil`, percentage capped at 100 with uncapped count/packed band, capacity not leaked, trend null, computed time injected.
- **Contract validation:** strict unknown-key rejection, minute alignment/order/uniqueness, numeric bounds, health enums, `appliedCommandId: null`, canonical timestamps.
- **Authentication:** missing/malformed token, hash canonicalization, disabled device, constant error shape, no secret in errors.
- **Rate limiter:** initial burst, refill, isolation by device, `Retry-After`, entry eviction, no domain call on rejection.
- **Polling/cache expiry:** dynamic poll-header parsing, missing/invalid header schedules no interval, jitter bounds, hidden tabs schedule nothing, visible transition refetches once, `freshUntil` expires locally without a request, origin-stale cannot be upgraded, unmount cancels, no overlap.
- **Formatting/accessibility helpers:** Western digits in both locales, Riyadh 12-hour time, relative time, localized ARIA text.

### Real-Postgres integration tests

- Apply migrations to an empty test database and verify deterministic seed/singleton state.
- First valid push updates device, current state, and minute row atomically; public builder returns matching fresh payload.
- Same sequence replay returns acknowledgement and leaves row values/timestamps unchanged.
- Lower sequence and higher sequence gap do not mutate state; missing contiguous sequence can then process.
- Concurrent same-next-sequence requests result in exactly one commit.
- Repeated current-minute snapshots replace entries/exits/count rather than add them; one row remains.
- Negative current/minute count is stored as zero and never returned negative.
- Minute row contains entries, exits, computed band, capacity snapshot, settings version, `live` source, and correct prior business day for 01:30 Riyadh.
- Transaction rollback leaves device/current/minute unchanged when a forced write fails.
- Invalid/disabled token returns 401; limiter produces 429 without DB mutation.
- Public endpoint before any push returns the exact Phase 1 unavailable payload and cache header.
- Public endpoint after push reads current/settings/device only. Enforce this through a repository interface with no history method and/or a query spy; do not rely only on code review.
- At injected ages, public response switches fresh to stale with a new `computedAt`, while count remains last-known and capacity remains absent.
- A cached payload originally marked fresh is rendered stale once `freshUntil` passes even when subsequent mocked CDN responses return the identical JSON during SWR.
- Inserting a newer settings version changes the next push acknowledgement cadence and the next origin-recomputed public response's `freshUntil` calculation/poll header without restarting the server, simulator, or browser. Existing CDN objects retain their old header until normal cache revalidation, which is the deliberate cache-first propagation bound; `freshUntil` still prevents them from remaining visibly fresh. The 180-second operational threshold does not extend public freshness.

### Contract and simulator tests

- Snapshot/semantic assertions on generated OpenAPI 3.1 document and Bearer scheme.
- Validate committed simulator example fixtures against the same request/response schemas.
- Start an ephemeral server/test DB, run a short deterministic simulator session, and assert resulting state/minute rows.
- Stop/restart simulator state, replay a sequence, create a sequence gap, return 401, and return 429 in deterministic tests.
- Verify the interactive reference exists in development and is absent from a production-configured app.

### Web component and thin browser tests

- Render loading, unavailable, all four fresh bands, and stale in Arabic RTL and English LTR.
- Assert count qualifier, band label/icon, visible percentage, meter role/value text, last-updated text, stale last-known copy, and absence of count/meter in unavailable.
- Assert tabular-number class/style and stable layout container across one- to three-digit changes.
- With fake timers and mocked visibility, prove settings-header-driven jittered polling (60-second seed gives 54–66 seconds), hidden pause, immediate focus refetch, and independent local freshness expiry.
- Assert polite live region deduplicates routine polls/relative-time ticks and announces meaningful count/band/stale changes.
- Run an accessibility scan/manual tree assertion for labels, landmarks, status roles, contrast-relevant class use, and no color-only status.
- Thin end-to-end smoke: migrated DB + server + simulator + browser; observe unavailable → fresh → changed count → stale → fresh recovery in both locales.

### Required verification commands

Add explicit scripts as needed, then run at minimum:

```powershell
pnpm db:migrate
pnpm test
pnpm test:integration
pnpm check
pnpm check-types
pnpm build
```

Any integration script must clearly target the dedicated local test database. Record exact versions and failures; do not skip database or browser coverage while reporting the phase complete.

## 15. Phase 2 acceptance criteria

Phase 2 is complete only when every item below is demonstrated:

- [ ] The accepted Phase 1 surface and checks remain intact; no sign-up, light theme, demo route, or hard-coded public copy returns.
- [ ] A freshly migrated database contains one settings version and one empty current singleton; no raw device token exists in schema, migration, logs, or Git.
- [ ] A valid simulator push traverses auth → limiter → occupancy engine transaction → current/minute tables and receives the documented acknowledgement with empty commands.
- [ ] `/` shows the approximate live count, correct band, displayed percentage and meter both capped at 100, and last-updated time within one public poll plus CDN cache window; an over-capacity count remains uncapped and produces `packed`.
- [ ] With no accepted device data, the exact honest unavailable presentation shows no count or meter.
- [ ] Public data is fresh only through the settings-driven fresh window (default 90 seconds). Ages from 90–180 seconds are already stale publicly while still inside the operational grace interval; at/after 180 seconds the future operational-silence threshold is also crossed, with no different Phase 2 public state.
- [ ] `freshUntil` causes local stale rendering at expiry even if CDN stale-while-revalidate serves the old `fresh` JSON; the browser never upgrades origin-stale data and never bypasses the CDN to enforce honesty.
- [ ] Restarting the simulator with its saved state resumes sequences and returns the public UI to fresh.
- [ ] Duplicate, replayed, lower, and gapped/out-of-order sequences are acknowledged without changing device freshness, current state, or minute rows.
- [ ] Repeated snapshots for the same device-minute leave exactly one row and replace—not add—complete totals.
- [ ] Stored/displayed count never goes below zero; band follows the seeded thresholds at all boundaries; visual meter never fills beyond 100%.
- [ ] Minute rows contain count, entries, exits, band, capacity snapshot, settings version, business-day attribution, and source `live`; a 01:30 Riyadh bucket belongs to the previous local business date with the 04:00 boundary.
- [ ] The public endpoint queries no history and retains exactly `public, s-maxage=30, stale-while-revalidate=60`; freshness, `freshUntil`, and `computedAt` are baked at origin.
- [ ] Missing, malformed, wrong, and disabled device tokens receive indistinguishable 401 responses; per-device rate limiting returns 429 and prevents engine execution.
- [ ] The OpenAPI 3.1 document matches the endpoint and simulator fixtures; the interactive reference is reachable only in development and is 404 in production configuration.
- [ ] Settings are the single runtime source: the simulator adopts acknowledgement cadence, the builder derives `freshUntil`, and the browser adopts the public poll header. With seeded settings, polling occurs around 60 seconds with bounded jitter only while visible; refocusing performs one immediate fetch.
- [ ] Arabic RTL and English LTR use catalog copy and Western digits; changing count does not shift layout; status is conveyed by label/icon/position as well as color.
- [ ] Count/status updates are announced politely without repetitive chatter, and reduced-motion users receive instant non-animated updates.
- [ ] No request, schema, storage, log, simulator file, or public payload contains image/frame/video/identity/per-person data.
- [ ] Unit, integration, contract, simulator, component, thin browser, Biome, TypeScript, and production build checks pass.

## 16. Required Manual QA plan — three canonical test suites

Run Manual QA only after automated checks pass. The three required test suites below preserve all nine canonical Phase 2 checks from `PHASES.md`, grouped without changing their pass conditions. Use a disposable local database and development-only token. Record timestamps/screenshots and relevant DB rows, but redact the token and do not capture/store any camera imagery (the simulator has none).

### Prerequisites and setup

1. Copy the documented local environment examples, point `DATABASE_URL` and the integration URL at disposable local Postgres/Supabase, and set required auth/CORS variables. Keep the simulator token in an ignored local file/environment variable.
2. Apply migrations and provision the development device:

   ```powershell
   pnpm db:migrate
   pnpm edge:provision-dev
   ```

   **Expected:** migration succeeds; provisioning reports the device id/name and displays or writes the raw token once without committing it. `settings_versions` has one placeholder row and `current_state` has one empty singleton.

3. Start web/server stack and simulator in separate terminals using the scripts documented during implementation:

   ```powershell
   pnpm dev
   python edge/simulator.py --base-url http://localhost:3000 --token $env:FITWAY_EDGE_TOKEN --state-file .local/edge-simulator-state.json --seed 42
   ```

   If local web and server ports differ, use the documented Vite URL for the browser and server URL for the simulator. Do not improvise a different endpoint path.

### Required test 1 — Public live behavior

#### A. Live flow

1. Before starting the simulator (or after clearing only the disposable application rows), open `/` at a 390×844 viewport.
2. Confirm the loading skeleton resolves to unavailable with no count/meter.
3. Start the simulator and keep DevTools Network open.
4. Wait one simulator push plus one 60-second poll and, when testing through a CDN-equivalent environment, up to the 30-second cache window.

**Expected:** the page shows a dominant Western-digit count with visible “حوالي” in Arabic, a labeled/icon band matching seeded thresholds, visible percent, a meter, and a “last updated” value that advances honestly. Network requests target only the cached public endpoint from the visitor page. The number changes as accepted simulator pushes change count.

#### B. No width jitter

1. Watch the number change at 390px, including a digit-count transition if practical.

**Expected:** tabular digits prevent width jitter; the layout does not shift as digits change.

#### C. Stale honesty and recovery

1. Note the displayed count and last-updated time, then stop the simulator with Ctrl+C.
2. Verify its state file remains valid and its stop summary contains no token.
3. Keep the page visible through at least three minutes plus the next poll/cache recompute (allow up to about five minutes as `PHASES.md` specifies).
4. Restart the simulator with the same state file.

**Expected:** the page never advances the timestamp while pushes are stopped. It transitions to a stale banner, labels the count as last known, dims the number/meter, and retains the exact last-updated time. It never calls the value live. Restart resumes the next sequence and returns to fresh within one push + poll/cache window.

#### D. Visibility pause/refetch

1. With DevTools Network preserving requests, leave `/` visible until one poll occurs.
2. Hide/background the tab for at least two minutes.
3. Bring it to the foreground.

**Expected:** no public polling requests occur while hidden. Exactly one immediate refetch occurs on visibility restoration, then the jittered schedule resumes without overlapping/duplicate requests.

### Required test 2 — Edge and stored-data correctness

#### A. Device authentication

1. Send a minimal valid-shaped push with no token, then with a wrong token:

   ```powershell
   curl.exe -i -X POST http://localhost:3000/edge/push -H "Content-Type: application/json" --data-binary "@edge/fixtures/push.json"
   curl.exe -i -X POST http://localhost:3000/edge/push -H "Authorization: Bearer wrong-token-value" -H "Content-Type: application/json" --data-binary "@edge/fixtures/push.json"
   ```

2. Inspect terminal/server logs.

**Expected:** both receive the same minimal 401 shape and `Cache-Control: no-store`; no device existence detail, raw token, authorization header, or push body appears in logs; DB state is unchanged.

#### B. Replay and out-of-order idempotency

1. Pause normal simulator cadence or use its one-shot controls.
2. Record `edge_devices.last_sequence`, current state, and the active minute row in `pnpm db:studio`.
3. Replay the last request with the same sequence.
4. Send a request with `last_sequence + 2` before `last_sequence + 1`.
5. Send the missing next sequence, then resend the formerly gapped sequence.

**Expected:** replay returns `accepted: false, reason: replay`; the gap returns `accepted: false, reason: sequence_gap`; neither changes last-seen/current/minute values. The missing contiguous request commits once, followed by the next contiguous request. At all times, the acknowledgement reports the highest contiguous processed sequence.

#### C. Floor at zero

1. Configure the simulator to push more exits than entries until its submitted current count would cross below zero.
2. Inspect current/minute rows and the public page after refresh.

**Expected:** stored and displayed count never goes below 0.

#### D. Business-day attribution

1. Push a valid test fixture whose edge/minute time represents 01:30 in `Asia/Riyadh` while the boundary is 04:00. Use a fresh disposable device sequence/state; do not edit production-like data.

**Expected:** the minute row’s `business_day` is the previous local date.

### Required test 3 — Contract and accessibility

#### A. Contract document

1. Open the OpenAPI reference in development.
2. Compare its push request/response schemas to what the simulator actually sends and receives, with the token redacted.

**Expected:** the push request/response schemas match the simulator exchange.

#### B. Screen reader

1. Inspect the accessibility tree or use a screen reader on `/` while the band/count changes.

**Expected:** the band is announced as text and count updates are announced politely without interruption spam.

## 17. Supplemental QA — not part of the canonical manual gate

These checks are useful for release confidence but are not additional required Manual QA tests from `PHASES.md`. Prefer automated coverage where specified in §14; run them manually only when diagnosing or doing a final release pass.

- **Settings propagation:** create a newer settings row in the disposable database. Verify the next push acknowledgement changes simulator cadence and the next public response changes freshness expiry/poll header without a restart.
- **Cache-expiry safety:** hold/replay a cached payload whose JSON still says `fresh` past `freshUntil`. Verify the page locally becomes stale at expiry without waiting for a poll. This is a required automated browser/integration assertion.
- **Rate-limit stress:** exceed the authenticated device burst, verify 429/no mutation, honor `Retry-After`, then retry the same sequence. This is primarily an automated limiter/API test.
- **Cache/data minimization inspection:** verify the exact Phase 1 cache header, `freshUntil`, capped percentage, poll header, absence of capacity/device/health/history, and no `occupancy_minutes` query. This is primarily an integration test.
- **Over-capacity presentation:** submit a count above capacity. Verify the underlying/displayed count remains uncapped, band is `packed`, and both displayed percentage and meter/ARIA value are 100.
- **Localization/responsive regression:** switch Arabic/English, test Western digits, RTL/LTR meter direction, 200% zoom, grayscale, and reduced motion. These supplement the canonical width-jitter and screen-reader checks.
- **Production/reference/privacy regression:** verify machine-readable OpenAPI remains available in production, the interactive reference is 404, login/Phase 1 regressions are absent, no secret is logged, and no media/identity field or local simulator secret/state is committed.

## 18. Resolved decisions before execution

The following plan-level decisions are resolved and must be treated as implementation constraints, not reopened during execution:

- Complete minute snapshots (including minute `count`) are accepted as the idempotent wire representation.
- Strict contiguous sequences and `sequence_gap` acknowledgement are accepted as the definition of out-of-order behavior.
- Public values older than 90 seconds are stale for honesty; 180 seconds is the later operational silence threshold. The 90–180-second interval is publicly stale but operationally within grace.
- Development seed values `100` and `25/50/75` are explicitly non-production placeholders.
- Displayed percentage and meter/ARIA value cap at 100; the underlying count remains uncapped and produces `packed` above capacity.
- Machine-readable OpenAPI remains available while only the interactive UI is development-only.
- Settings are the single runtime source: push acknowledgement propagates simulator cadence, the builder propagates freshness through `freshUntil`, and the public response header propagates polling interval.

None of these checkpoints authorizes Phase 3+ work. Any change that introduces schedules, commands, backfill, staff writes, alerts, real CV, or production deployment must be deferred to its governing phase.
