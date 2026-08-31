# FITWAY

FITWAY v1 is a privacy-limited live-occupancy system for one pilot gym. Its anonymous,
Arabic-first public page helps visitors decide whether to go now with an honest crowd band,
approximate count, opening state, and freshness. Authenticated staff and owner surfaces support
operations and governance without storing visitor identity, images, video, or per-person events.

## Repository status

FITWAY v1 is **repository-complete**. Canonical `main` contains every accepted aggregate phase
from 1 through 12, and the `repository-closeout` milestone is `DONE` in
[PROJECT_STATE.yaml](PROJECT_STATE.yaml). The accepted project-wide `pnpm verify:full` run at
commit `b46f496ac2f217278d2706be02a8061bb199403d` passed the repository invariants, build and type
gates, 566 TypeScript unit/component tests, 117 Python tests, 133 disposable-Postgres integration
tests, and 125 Chromium browser/accessibility/visual tests. The durable evidence and exact run
conditions are recorded in the [repository closeout](docs/phase-records/repository-closeout.md).

Repository completion is not deployment approval. No GitHub push, release, production
provisioning, deployment, demo preparation, or real-gym validation was performed as part of
closeout. Historical `FAILED_VALIDATION` and `NEEDS_HUMAN` attempt records remain intentionally
preserved as terminal engineering history; they are not open v1 implementation work.

## Product surfaces

- **Public `/`:** anonymous, cache-first crowd band and approximate count with honest loading,
  fresh, stale, closed, unavailable, and error states. The public contract exposes no capacity,
  percentage, operational diagnostics, identity, or history.
- **Staff `/login` and `/staff`:** shared PIN authentication with opaque server-side sessions and
  signed HttpOnly cookies, plus a monitoring-only view of occupancy, freshness, and device health.
- **Owner `/admin`:** owner-only analytics, accessible chart/table views, heatmap and
  week-over-week reporting, streamed CSV export, audit history, health/uptime, access management,
  and append-only settings governance.
- **Edge and operations:** authenticated occupancy pushes, durable command/reset and audit
  infrastructure, offline buffering and backfill, scheduled reset, health transitions, bounded
  Telegram alert/recovery delivery, retention, and a durable standard-library Python client with
  SQLite persistence and Windows lifecycle scripts.

Staff and owner product surfaces are monitoring/governance tools; neither exposes a manual count
command. Real camera capture, calibration, detection, and tracking are deliberately site-gated and
are not implemented by the repository client.

## Architecture

FITWAY is a TypeScript pnpm workspace with a separate Python edge runtime:

```text
apps/web        React + Vite + TanStack Router; Arabic RTL and English LTR
apps/server     Hono HTTP, cache, auth, device, cron, and transport boundary
packages/api    oRPC contracts and occupancy, command, analytics, alert, and governance logic
packages/auth   PIN/owner principals, opaque sessions, cookies, and role authorization
packages/db     Drizzle/Postgres schema and the reviewed migration history
packages/env    Validated web/server runtime environment
packages/ui     Shared accessible UI primitives and FITWAY styling foundation
edge            Durable Python client, frozen simulator, fixtures, and Windows lifecycle
tests           Browser, accessibility, visual, and cross-surface verification
docs            Workflow, ADRs, phase evidence, handoffs, and archive
visual-direction-gate/approved  Hash-verified visual baseline and provenance manifest
```

The browser never accesses Postgres directly. Hono is the security and cache boundary; oRPC is the
typed web contract, OpenAPI 3.1 is the device contract, and checked-in Drizzle migrations are the
only schema history. Public reads are capacity-free, cache-first, and never query occupancy
history. The system is intentionally single-gym in v1.

## Documentation map

Current authority is intentionally separate from implementation history:

1. [AGENTS.md](AGENTS.md) — process, safety, ownership, validation, and escalation policy.
2. [FITWAY_PRODUCT.md](FITWAY_PRODUCT.md) and [SPEC.md](SPEC.md) — product boundary and normative
   security, privacy, data, interface, and acceptance contract.
3. Reviewed migrations, Zod/OpenAPI schemas, and shared DTOs — executable conformance evidence.
4. [ADR-007](docs/adr/ADR-007-paper-visual-source-of-truth.md) — Paper is authoritative for visual
   composition; repository behavior remains authoritative. [DESIGN_GUIDE.md](DESIGN_GUIDE.md) and
   the [approval manifest](visual-direction-gate/approved/APPROVAL_MANIFEST.yaml) govern responsive,
   RTL, interaction, accessibility, tokens, and provenance within that split.
5. [PHASES.md](PHASES.md) — the completed delivery scope and dependency/acceptance plan;
   [PROJECT_STATE.yaml](PROJECT_STATE.yaml) — the canonical closeout and milestone ledger.
6. [ADRs](docs/adr/), [RESEARCH.md](RESEARCH.md), and
   [phase records](docs/phase-records/) — durable rationale and accepted engineering evidence.

Material under [`docs/archive/`](docs/archive/), preserved handoffs and terminal attempts, old
G1B/Claude packages, prototypes, and VDG/Stitch worksheets is historical provenance, not a current
implementation backlog. `README.md` is a presentation-facing index, not a normative authority.

## Local development

```bash
pnpm install
pnpm db:migrate
pnpm dev
```

- Web: `http://localhost:3101`
- Server: `http://localhost:3100`
- Development OpenAPI reference: `http://localhost:3100/api-reference`

Provision a development device with `pnpm edge:provision-dev`, then use the simulator as documented
in [edge/README.md](edge/README.md). Integration tests require the explicitly named disposable
database and reset marker described by [.env.integration.example](.env.integration.example); they
never fall back to the development database.

## Verification

```bash
pnpm verify:fast
pnpm verify:phase --phase <registered-name>
pnpm verify:full
```

- `verify:fast`: formatting/lint, type checks, unit/component tests, and repository invariants.
- `verify:phase`: fast checks plus the selected integration/browser checks; it requires a
  registered `--phase` value (or the equivalent `FITWAY_PHASE` environment variable).
- `verify:full`: fast checks plus disposable-Postgres integration, Python, builds, browser,
  accessibility, and visual regression gates.

The verification ladder proves repository behavior under its controlled fixtures. It does not
substitute for site commissioning or production observation.

## External go-live boundary

Production database and Vercel provisioning, plan/spend controls, secrets, domain and final URL,
real gym capacity/thresholds/hours/timezone, edge-PC and network behavior, camera/RTSP access, feed
and exit-path geometry, calibration/detector accuracy, transparency wording, operational ownership,
and owner sign-off remain external go-live gates. These require real-site evidence and explicit
deployment authority; none is implied by repository completion.
