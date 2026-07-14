# FITWAY

FITWAY is a single-gym live-occupancy pilot. The anonymous public page shows an honest,
cache-first crowd state; later staff and owner surfaces add operations, corrections,
analytics, governance, and health without exposing visitor identity or camera media.

## Current status

- Phases 1–3 are complete: Arabic-first/English public shell, simulated edge-to-public
  occupancy path, honest freshness states, and schedule-aware open/closed behavior.
- VDG-A is complete. G1B and the final Claude Design product family are approved visual
  references; VDG-B is the next UI gate.
- Phases 4–12 are not implemented. `/staff`, `/admin`, commands/audit, fallback/backfill,
  cron/alerts, analytics/reporting, and the production edge lifecycle remain future work.
- Shared staff authentication is locked as PIN-based through the signed HttpOnly session
  model. The current scaffold email/password form is not the Phase 4 target.

See [PHASES.md](PHASES.md) for the dependency graph, parallel execution waves, worktree
boundaries, merge gates, and stop conditions.

## Sources of truth

- [FITWAY_PRODUCT.md](FITWAY_PRODUCT.md) — product and visual-authority boundary.
- [SPEC.md](SPEC.md) — implementation contract and Definition of Done.
- [PHASES.md](PHASES.md) — delivery status, dependencies, and phase acceptance plans.
- [RESEARCH.md](RESEARCH.md) — product, privacy, architecture, risk, and pilot rationale.
- [DESIGN_GUIDE.md](DESIGN_GUIDE.md) — design system, responsive/RTL, chart, motion, and
  accessibility rules, including the Fitness Time research evidence.
- [SOL_SCAFFOLD_REVIEW.md](SOL_SCAFFOLD_REVIEW.md) — repository and service architecture.
- [`visual-direction-gate/approved/public-live-desktop/`](visual-direction-gate/approved/public-live-desktop/)
  — immutable approved G1B Arabic Public Live Desktop anchor.
- [`visual-direction-gate/approved/full-product/`](visual-direction-gate/approved/full-product/)
  — final full-product Claude Design archive and Analytics chart-behavior reference.

## Current system

```text
apps/web       React + Vite + TanStack Router public UI
apps/server    Hono HTTP boundary, cached public read, edge push, auth mount, OpenAPI
packages/api   Shared contracts and occupancy/schedule domain logic
packages/db    Drizzle schemas, migrations, and development provisioning
packages/auth  Current scaffold auth configuration; Phase 4 staff PIN target is documented
packages/env   Validated web/server environment
packages/ui    Shared primitives, FITWAY tokens, and global styles
edge           Python simulator, fixtures, and tests
tests          Browser and integration test infrastructure
design-*       Behavioral baselines and preserved Fitness Time design research
visual-direction-gate  Review inputs and immutable approved artifacts
```

The browser never accesses Postgres directly. Hono owns public caching, device
authentication, sessions/authorization, and future staff/owner procedures. The public
payload remains capacity-free and never reads history.

## Local development

Install dependencies and configure the package environment files, then run:

```bash
pnpm install
pnpm db:migrate
pnpm dev
```

- Web: `http://localhost:3101`
- Server: `http://localhost:3100`
- Development OpenAPI reference: `http://localhost:3100/api-reference`

Provision a development edge token with `pnpm edge:provision-dev`, then run the simulator
as documented in [edge/README.md](edge/README.md).

## Verification

```bash
pnpm check
pnpm check-types
pnpm test
pnpm test:simulator
pnpm test:browser
pnpm build
```

`pnpm test:integration` additionally requires a disposable Postgres database configured
through `.env.integration.local`; start from [.env.integration.example](.env.integration.example).
The integration guard refuses non-test database targets.

Future UI merges also require Browser inspection when available, repository Playwright
screenshots, Arabic RTL/English LTR checks, mobile/desktop responsive verification, keyboard
and reduced-motion checks, and visual comparison against the approved artifacts.

## Useful scripts

- `pnpm dev:web` / `pnpm dev:server` — run one service.
- `pnpm db:generate` / `pnpm db:migrate` / `pnpm db:studio` — manage the Drizzle database.
- `pnpm deploy:check` — Vercel dry run without upload.
- `pnpm deploy` / `pnpm deploy:prod` — preview/production deployment.
- `pnpm env:preview` / `pnpm env:production` — sync project environment values.

The Vercel configuration deploys web and server in one project and rewrites same-origin
`/api/*` traffic to the Hono service.
