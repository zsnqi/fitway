# ADR-005: Cache-first, capacity-free public boundary

- Status: Accepted; public schema version 2
- Date: 2026-07-15

## Context

Visitors need only a current decision aid. Exposing capacity or a percentage adds inference risk
without improving the primary qualitative answer. Per-visitor server/database work would make
cost scale with popularity, and public history/diagnostics would broaden privacy and attack surface.

## Decision

- The anonymous endpoint is a language-neutral, CDN-cacheable schema-version-2 discriminated
  union with origin-baked state/freshness and computed time.
- A usable payload exposes open/closed context, `band`, approximate count, last update, source,
  gym timezone/computation metadata, and reserved `trend: null` only as specified.
- It never exposes capacity, denominator, percentage/`percentFull`, health, device identity,
  history, or visitor identity. There is no v1 disclosure toggle.
- The public crowd instrument is derived only from `band`, never a hidden capacity ratio.
- Public reads use current/settings only, never history. Cache headers use bounded `s-maxage` and
  stale-while-revalidate; client polling is sparse, jittered, visibility-aware, and refetches on
  return.
- Closed/unavailable/error remove readings. Delayed data is explicitly last-known and never live.

## Consequences

Compute scales with origin/cache refresh time, not visitor count. Any capacity/history/identity leak
is a hard stop. A future disclosure would require a new Product/Spec decision and versioned API;
old percentage mockups do not pre-authorize it. The Spec's post-v1 reservation constrains any
future version to explicit Product approval, a versioned optional field omitted while disabled,
server/owner authorization, inference warning, and audit; it authorizes no current code.
