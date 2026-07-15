# ADR-001: System and repository shape

- Status: Accepted
- Date: 2026-07-12; migrated 2026-07-15

## Context

The pilot needs an inexpensive anonymous public read path, typed TypeScript application APIs,
a stable machine contract for a Python edge client, one migration history, and a structure that
does not imply multi-gym SaaS complexity.

## Decision

- Use a static React/Vite/TanStack Router web app and a separate Hono Node server, deployed as
  two services in one Vercel project on one origin. Rewrite `/api/*` to Hono.
- Use oRPC for typed web procedures and an OpenAPI 3.1 document for Python/device integration.
- Use Drizzle over Postgres; checked-in Drizzle migrations are the only schema history.
- Browser code never accesses Postgres directly.
- Put domain logic in `packages/api`, HTTP/cache/auth/cron concerns in `apps/server`, schema and
  migrations in `packages/db`, and the Python simulator/client in top-level `edge/` outside the
  pnpm workspace.
- Keep v1 single-gym: no `gym_id` and no multi-tenant machinery. Preserve future flexibility at
  the URL/deployment boundary rather than speculative schema abstraction.
- Do not add Turborepo at the current workspace size.

## Consequences

Hono is the security and cache boundary. Shared router/schema/server index files and migration
ordering are serial integration surfaces. The deployment remains simple, but Vercel plan/cron,
Supabase pooling/backup/pausing, spend controls, and production provisioning remain go-live gates.

## Provenance

Migrated from the scaffold review retained at
`docs/archive/architecture/SOL_SCAFFOLD_REVIEW-pre-brg-20260715.md`, plus `RESEARCH.md` and
`SPEC.md`.
