# Fitway Scaffold Review

The recommended scaffold is a static TanStack Router web app plus one separate Hono backend, connected through oRPC/OpenAPI, running on Node.js and backed by Supabase PostgreSQL through Drizzle. Use Better Auth, pnpm, local Supabase, Biome, and Lefthook. Do not select Turborepo.

This deliberately changes the recorded Clerk choice in [RESEARCH.md](RESEARCH.md#L95). The separate backend and OpenAPI contract better fit the actual browser + Python edge architecture described in [RESEARCH.md](RESEARCH.md#L343), while the static frontend fits the mobile-first live-status surface in [DESIGN_GUIDE.md](DESIGN_GUIDE.md#L82).

## 1. Recommended architecture

```text
                         Vercel — one project, same origin
┌───────────────────────────────────────────────────────────────────┐
│ apps/web                                                          │
│ TanStack Router + React/Vite                                      │
│ Static public, staff, and owner shells                            │
│                                                                   │
│          same-origin /api/*                                       │
│                    │                                              │
│                    ▼                                              │
│ apps/server                                                       │
│ Hono on Node.js                                                   │
│ ├─ public cached occupancy endpoint                               │
│ ├─ authenticated staff/owner commands                             │
│ ├─ device-authenticated edge ingestion and command polling        │
│ ├─ Better Auth sessions and server-side role enforcement          │
│ ├─ oRPC contracts + OpenAPI 3.1 document                          │
│ └─ domain modules: occupancy, correction, audit, analytics, health│
└──────────────────────────────┬────────────────────────────────────┘
                               │ Drizzle
                               ▼
                 Supabase hosted PostgreSQL
                 local Supabase stack for development

Windows Python edge counter
├─ OpenCV/detector/tracker
├─ local count and 24–48h durable outbox
├─ generated/manual OpenAPI client
├─ device credential
└─ Windows service/watchdog
             │
             └──────── HTTPS /api/edge/* ───────► Hono
```

Why this shape:

- TanStack Router gives typed file routes, search parameters, loaders, and route layouts without introducing a second server framework. Its model is explicitly client-oriented. The live value cannot be baked permanently into HTML anyway; a small static shell followed by a CDN-cached JSON request is the simplest honest rendering path. [TanStack Router overview](https://tanstack.com/router/latest/docs/framework/react/overview)
- The separate Hono app is a real module, not a microservice collection. It owns authentication, authorization, device ingestion, reconciliation, audit transactions, analytics queries, and cache policy behind one interface.
- Better‑T‑Stack’s current Vercel deployment supports `apps/web` and `apps/server` as services in one Vercel project, rewriting `/api/*` to Hono on the same origin. This avoids cross-origin cookies, duplicated preview URLs, and ordinary CORS configuration. [Better‑T‑Stack Vercel guide](https://www.better-t-stack.dev/docs/guides/vercel)
- The public occupancy response should set Vercel CDN cache headers directly, while authenticated and device responses remain `private`/`no-store`. Vercel supports `s-maxage` and `stale-while-revalidate` on Function responses. [Vercel cache-control documentation](https://vercel.com/docs/caching/cache-control-headers)
- oRPC can generate OpenAPI 3.1 from the contract. That lets TypeScript callers retain end-to-end typing while Python consumes a language-neutral contract. [oRPC OpenAPI documentation](https://orpc.dev/docs/openapi/openapi-specification)
- Audit-sensitive mutations should be implemented as Hono domain operations that update state and append the audit entry in one database transaction. Router guards are only UX; Hono authorization is authoritative.
- Browser code should not access Supabase tables directly. This removes public database credentials and prevents UI code from becoming a second authorization implementation.

## 2. Exact Better‑T‑Stack selection

These names match the current Builder sections and options. [Current options reference](https://www.better-t-stack.dev/docs/cli/options)

| Builder section | Exact selection               |
| --------------- | ----------------------------- |
| Project Name    | `fitway`                      |
| Web Frontend    | **TanStack Router**           |
| Native Frontend | **No Native Frontend**        |
| Backend         | **Hono**                      |
| Runtime         | **Node.js**                   |
| API             | **oRPC**                      |
| Database        | **PostgreSQL**                |
| ORM             | **Drizzle**                   |
| DB Setup        | **Supabase**                  |
| Web Deploy      | **Vercel**                    |
| Server Deploy   | **Vercel**                    |
| Auth            | **Better Auth**               |
| Payments        | **No Payments**               |
| Package Manager | **pnpm**                      |
| Addons          | **Biome**, **Lefthook** only  |
| Examples        | **No Examples**               |
| Git             | **Initialize Git: Yes**       |
| Install         | **Install dependencies: Yes** |

Additional interpretation:

- Choose Supabase’s local setup, but do not auto-provision or bind production during scaffolding. Create/link the hosted Supabase project later.
- Use Drizzle migrations as the single schema history, including custom SQL for indexes, constraints, triggers, grants, and RLS where needed. Supabase CLI should provide the local stack, not a second competing migration history.
- Pin Node 24 LTS and an exact pnpm version when implementation begins. Node 26 is still Current rather than LTS as of July 2026. [Node release schedule](https://nodejs.org/en/about/previous-releases)
- Better‑T‑Stack already creates a workspace with `apps/*` and `packages/*`; Turborepo is an optional task-runner layer, not what creates the monorepo. [Generated project structure](https://www.better-t-stack.dev/docs/project-structure)

### Addons explicitly not selected

No Turborepo, Nx, Vite+, PWA, Husky, Ultracite, Oxlint, MCP, Skills, evlog, Tauri, Electrobun, documentation app, or example app.

Biome provides one fast formatter/linter with a CI mode, while Lefthook gives cross-platform, centrally configured Git hooks. [Biome](https://biomejs.dev/), [Lefthook](https://lefthook.dev/)

Lefthook should remain a convenience layer; CI commands are the authoritative checks. Biome also does not replace TypeScript type-checking.

## 3. Serious alternatives and why they lose

### Next.js with full-stack route handlers

This is the strongest alternative. It would win if public SEO, server-rendered marketing content, or framework-managed ISR became a major requirement.

It loses for Fitway because:

- The Python edge counter requires a durable external interface regardless of the UI framework.
- Embedding device endpoints, audit commands, health ingestion, and analytics exports in UI route handlers couples the backend lifecycle to Next.
- Fitway’s main public content is a live payload, not a content-heavy page needing React Server Components.
- Next route handlers are uncached by default and require deliberate cache configuration, leaving more opportunity for accidental per-visitor compute. [Next.js route handlers](https://nextjs.org/docs/app/getting-started/route-handlers)

Next.js plus a separate Hono backend is valid, but then Fitway pays for both server models while gaining little over a static TanStack Router frontend.

### TanStack Start

TanStack Start would win if Fitway needed SSR while strongly preferring TanStack conventions.

It loses because its server functions are designed primarily for calls from the Start application; its own documentation directs external callers toward server routes. The Python service therefore still demands an explicit public interface. With separate Hono, Start’s server layer becomes redundant. [TanStack Start server functions](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions)

### Full-stack framework routes instead of Hono

This saves one app directory but weakens the most important seam. Browser sessions, public caching, device credentials, ingestion, reconciliation, audit logging, CSV export, and OpenAPI publication are a coherent backend module independent of rendering. They warrant `apps/server`.

### tRPC

tRPC is excellent when every trusted caller is TypeScript. Its own positioning is explicitly end-to-end TypeScript. [tRPC](https://trpc.io/)

Python makes it the wrong default. Adding an OpenAPI conversion layer later would create a second representation of the interface. oRPC makes OpenAPI part of the primary contract.

### Bun runtime or Bun package manager

Bun is credible and fast, but Fitway gets little value from adding another runtime target:

- Vercel, Hono, Better Auth, Drizzle, and operational tooling are all well-covered by Node LTS.
- Production/runtime parity matters more than install benchmarks.
- Using Bun only as the package manager would require both Bun and Node across Windows development and CI.
- pnpm workspaces are sufficient for two TypeScript apps and shared packages.

### Clerk

Clerk remains a reasonable alternative if outsourced auth UI and account recovery are worth a hosted dependency.

It loses because Fitway has only a few staff accounts, needs repeatable local verification, and benefits from keeping users, sessions, roles, and audit references in the same Postgres environment. Better Auth integrates directly with Hono and Drizzle and supports custom roles. [Better Auth Hono integration](https://better-auth.com/docs/integrations/hono), [Better Auth role management](https://better-auth.com/docs/plugins/admin)

Clerk’s Supabase integration is now better than the older JWT-template approach, but it still adds a second control plane and RLS integration surface. [Clerk–Supabase integration](https://clerk.com/docs/guides/development/integrations/databases/supabase)

### Supabase Auth

Supabase Auth is the best alternative if the architecture changes to direct browser-to-Supabase access with JWT-driven RLS. [Supabase Auth](https://supabase.com/docs/guides/auth)

It loses here because:

- It is not a Better‑T‑Stack Auth choice, requiring `Auth: None` followed by manual integration.
- The selected architecture intentionally places Hono between all clients and the database.
- Direct Supabase access would create another application interface alongside oRPC.
- Better Auth gives more local control without sacrificing server-side role enforcement.

### Hosted-only Supabase development

Hosted-only development has less Docker friction but loses reproducibility, safe destructive testing, offline work, and database-policy verification. Supabase itself recommends local development with checked-in migrations before deployment. [Supabase local development](https://supabase.com/docs/guides/local-development/overview)

If Docker proves impractical on the development machine, the fallback should be a dedicated hosted development project—not production.

### Turborepo

A monorepo is justified; Turborepo is not yet justified.

There are only two TypeScript apps and a handful of shared packages. pnpm recursive/filter commands provide the needed orchestration. Add Turborepo only when measured build/test time, remote caching, or a substantially larger workspace makes its task graph earn its configuration.

## 4. Decisions that should remain deferred

- Exact public domain and future SaaS-friendly URL shape.
- Supabase hosted region/tier, connection-pool mode, backups, and Vercel function region. These must be chosen together before deployment.
- Exact RLS and database-role strategy. The invariant is fixed now: no browser service-role key, and Hono remains authoritative.
- Better Auth login method, email delivery, password recovery, session lifetime, and whether the shared staff account is password- or passkey-based.
- Exact edge command/reconciliation protocol, idempotency keys, sequence numbering, retry timing, and local outbox schema.
- CV dependencies, packaging, Python environment manager, Windows service/watchdog mechanism, and hardware acceleration until the site-check gates are completed.
- Chart library, component additions, testing libraries, observability vendor, and Telegram delivery mechanism.
- Whether Turborepo is added later, based on measured CI cost.
- Trend display, light theme, richer reports, predictions, multi-gym support, and all other already-deferred product scope.

The Python edge counter, Windows lifecycle scripts, camera calibration/configuration, OpenAPI-generated Python client, site-specific secrets, infrastructure billing controls, production monitoring, and operational runbooks should remain outside Better‑T‑Stack’s generated TypeScript scaffold. They may live in the same Git repository, but they should not be managed as JavaScript workspace packages.
