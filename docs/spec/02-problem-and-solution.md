<!-- Part of SPEC.md; the index and the rule for editing are in SPEC.md at the repository root. -->

## Problem Statement

Fitway members want to know **how crowded the gym is right now** before traveling to it.
Nothing answers that today. The gym owner has no operational view of occupancy patterns
(peaks, quiet hours, daily visits) to schedule staff or run offers. The builder (maintainer)
needs the system to run unattended in someone else's building and to hear about failures
from an alert, not from the owner.

The repository implements the complete accepted v1 system: the static TanStack Router web app,
Hono/oRPC server boundary, Drizzle/Postgres occupancy path, cached public states, schedule-aware
open/closed behavior, PIN/session authentication, staff monitoring, owner analytics/reporting and
governance, command/audit infrastructure, offline backfill and reconciliation, scheduled reset,
health alerts and retention, and the durable Python/Windows edge lifecycle. Camera/CV integration,
site commissioning, production provisioning, and deployment remain outside repository completion.

## Solution

Build the v1 pilot exactly as architected in RESEARCH.md §9–§11 and
`docs/adr/ADR-001-system-shape.md`:

- A **public, anonymous, mobile-first, Arabic-RTL-default occupancy page** showing the
  status band (Quiet/Moderate/Busy/Packed), an approximate count, open/closed state, and
  data freshness — honest in every state (fresh, stale, offline, closed). In v1,
  capacity, a denominator, and derived percentage are not exposed publicly.
- A **staff operational view** (shared front-desk account): live count, device health, and
  freshness. It is monitoring-only — it issues no correction, direct count entry, or reset
  (`docs/adr/ADR-008-staff-monitoring-only.md`).
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

