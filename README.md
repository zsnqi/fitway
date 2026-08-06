# FITWAY

FITWAY is a single-gym live-occupancy pilot. Its anonymous public page gives visitors an
honest, cache-first crowd level and approximate count. Later authenticated surfaces add
operations, corrections, analytics, governance, and health without storing visitor identity
or camera media.

## Status

- Phases 1–3 are integrated.
- Broad visual exploration is closed. The one-time Baseline Reconciliation Gate promotes the
  capacity-free public schema v2 and approved FITWAY production baseline; its authoritative
  completion state is in `PROJECT_STATE.yaml`.
- Phases 4–12 are not implemented. Do not create Phase 4 worktrees until
  `PROJECT_STATE.yaml` records the baseline as `DONE`.
- Shared staff authentication is the Spec's PIN/opaque-session model. The remaining scaffold
  email/password code is explicitly not the Phase 4 target.

Live status, ownership, baseline reference, dependencies, gates, and blockers are recorded in
[PROJECT_STATE.yaml](PROJECT_STATE.yaml). The phase DAG is in [PHASES.md](PHASES.md).

## Sources of truth

Read them in this order:

1. [AGENTS.md](AGENTS.md) — agent policy, ownership, validation, and escalation.
2. [FITWAY_PRODUCT.md](FITWAY_PRODUCT.md) and [SPEC.md](SPEC.md) — product boundary and
   normative implementation contract.
3. Reviewed migrations, Zod/OpenAPI schemas, and shared DTOs — executable conformance.
4. [ADR-007](docs/adr/ADR-007-paper-visual-source-of-truth.md) — Paper is the visual source of
   truth; the repository stays authoritative for behavior.
   [DESIGN_GUIDE.md](DESIGN_GUIDE.md) and the
   [visual approval manifest](visual-direction-gate/approved/APPROVAL_MANIFEST.yaml) — responsive,
   RTL, interaction, accessibility, tokens, and artifact provenance, subject to ADR-007 for
   visual composition.
5. [PHASES.md](PHASES.md) and [PROJECT_STATE.yaml](PROJECT_STATE.yaml) — delivery scope/DAG
   and live coordinator-owned state.
6. [ADRs](docs/adr/), [RESEARCH.md](RESEARCH.md), and
   [phase records](docs/phase-records/) — rationale and accepted evidence.

Material under [`docs/archive/`](docs/archive/), old G1B/Claude packages,
prototypes, handoffs, VDG/Stitch worksheets, and generated reviews is historical evidence,
not current authority.

## Repository shape

```text
apps/web        React + Vite + TanStack Router UI
apps/server     Hono HTTP/cache/device/auth boundary
packages/api    Shared contracts and domain logic
packages/db     Drizzle schema and migration history
packages/auth   Auth scaffold to be replaced/reconciled in Phase 4
packages/env    Validated runtime environment
packages/ui     Shared UI primitives and tokens
edge            Python simulator; durable client arrives in Phase 12
tests           Browser and integration infrastructure
docs            Workflow, ADRs, phase records, schemas, and archive
visual-direction-gate/approved  Current manifest plus immutable provenance
```

The browser never accesses Postgres directly. Hono owns anonymous cache behavior, device
authentication, future sessions/authorization, and staff/owner procedures. Public reads never
touch history.

## Local development

```bash
pnpm install
pnpm db:migrate
pnpm dev
```

- Web: `http://localhost:3101`
- Server: `http://localhost:3100`
- Development OpenAPI reference: `http://localhost:3100/api-reference`

Provision a development device with `pnpm edge:provision-dev`, then use the simulator as
documented in [edge/README.md](edge/README.md).

## Verification

The stable non-writing entry points are:

```bash
pnpm verify:fast
pnpm verify:phase
pnpm verify:full
```

- `verify:fast`: formatting/lint, type checks, unit/component tests, and repository invariants.
- `verify:phase`: fast checks plus the phase-selected focused integration/browser checks.
  Set the documented phase/run variables when a phase adds a selector.
- `verify:full`: fast checks plus disposable-Postgres integration, simulator, build, browser,
  accessibility, and visual regression gates.

Integration tests require the explicitly named disposable database and marker described by
`.env.integration.example`; they never fall back to the development database. Browser runs use
`FITWAY_RUN_ID` to derive a unique port and disposable output/review directory for future
parallel sessions. Canonical visual snapshots are platform-scoped and coordinator-owned. See
[docs/WORKFLOW.md](docs/WORKFLOW.md).

Visual acceptance also requires interactive Browser inspection, Arabic RTL and English LTR,
the applicable 320–1440 responsive matrix, keyboard/focus, reduced motion, 200% zoom/reflow,
manual accessibility semantics, and a fresh independent verifier.

## Deployment boundary

Deployment, Supabase/Vercel provisioning, spend controls, production secrets, domain setup,
hardware/feed validation, real capacity/thresholds, and owner sign-off are external go-live
gates. Do not infer deployment authority from implementation completion.
