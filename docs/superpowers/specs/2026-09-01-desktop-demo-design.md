# FITWAY desktop demo design

## Objective

Provide one reproducible, desktop-only local environment in which the completed Public, Staff,
and Owner product surfaces run against realistic synthetic state through the repository's real
Postgres schema, authentication, authorization, services, APIs, and edge protocol.

The demo is for a private walkthrough on one Windows PC. LAN/mobile access, deployment, release
work, presentation capture, and real-gym configuration are outside this slice.

## Architecture

The demo adds an operator harness around the existing application rather than a second product
implementation:

- Docker Compose owns one loopback-only Postgres container and its disposable named volume.
- A PowerShell entry point exposes `prepare`, `reset`, `start`, `status`, `verify`, `stop`, and
  `clean` operations.
- A TypeScript seed program connects only to the guarded demo database. It calls existing schema,
  authentication, analytics, and service seams instead of adding demo-only API responses.
- The existing Python edge simulator is provisioned with an ignored local token and supplies the
  live current occupancy projection through the real edge push route.
- The existing Vite web app and Hono server run on loopback with exact-origin CORS and unchanged
  secure HttpOnly session cookies.
- A live Playwright walkthrough validates Public, Staff, and Owner against the running services
  without intercepting or mocking application requests.

## Safety boundaries

- The database port binds to `127.0.0.1` only and uses the exact database name
  `fitway_desktop_demo` under a fixed Compose project name.
- Reset and clean refuse to run unless the Compose project, database name, and loopback URL match
  the demo contract. Destruction is limited to the named Compose resources.
- The existing `apps/server/.env` is neither read as authority nor overwritten. Demo processes
  receive an explicit environment generated under ignored `.local/demo/` state.
- No production or existing remote database URL is accepted by the demo seed/reset path.
- The operator supplies a Staff PIN and Owner password through secure prompts during reset. Raw
  login credentials are not committed, written to local files, passed on command lines, or placed
  in URLs. Only their normal salted hashes reach Postgres.
- Service secrets and the synthetic edge token are generated locally, stored only in ignored demo
  runtime files, and never printed by the operator.
- Production authorization remains server-side. Staff remains monitoring-only; Owner-only API
  and navigation behavior remain unchanged.

## Synthetic profile

The profile is deterministic for all non-credential data:

- one synthetic enabled device;
- one active shared Staff principal and one synthetic Owner principal created through
  `AuthService`;
- Asia/Riyadh timezone, a 04:00 business-day boundary, realistic weekly hours, capacity, crowd
  thresholds, freshness settings, and a later settings version for snapshot semantics;
- 28 days of minute history generated with the existing deterministic analytics history generator
  and a fixed seed, including honest zero values and deterministic missing coverage;
- a current live projection and healthy device state delivered by the existing simulator;
- representative, internally consistent audit, health, settings, and access state created through
  existing repositories/services where those domains require transactional or linkage invariants.

Reset destroys only the disposable demo volume, reapplies reviewed migrations, recreates the
profile, reprovisions the edge device, and resets simulator state. Repeated reset with the same
credentials produces the same non-secret data.

## Operator behavior

- `prepare` validates Docker, Node, pnpm, Python, dependency links, ports, and repository state;
  starts Postgres; applies migrations; and prepares ignored runtime secrets.
- `reset` stops demo processes, recreates the named database volume, migrates, securely prompts for
  credentials, seeds data, provisions the device, and leaves the environment stopped but ready.
- `start` starts Postgres if necessary, then the server, web app, and simulator as hidden background
  processes with PID and log files under `.local/demo/`. It waits for readiness and prints only
  loopback URLs and non-secret account identifiers.
- `status` reports component readiness without revealing credentials or secrets.
- `verify` runs API/auth checks and the live Playwright walkthrough against the running demo.
- `stop` terminates only PIDs recorded by the demo harness and stops its Compose service while
  preserving the volume.
- `clean` performs `stop`, removes only the named Compose resources and volume, and removes ignored
  demo runtime state after validating each target.

Failures are fail-closed. Partial startup invokes the same scoped stop path. Existing listeners,
Docker unavailability, incomplete package links, unsafe URLs, migration/seed failure, or missing
credentials stop the operation with an actionable message.

## Verification

Before handoff, the slice must prove:

1. unit tests for guard logic and deterministic seed output;
2. existing auth, analytics, public-payload, simulator, and repository checks;
3. a reset followed by a second reset produces the same non-secret dataset fingerprint;
4. Public loads live synthetic state through the real API;
5. Staff logs in with the real PIN endpoint, sees the populated monitoring view, and cannot access
   Owner APIs;
6. Owner logs in with the real password endpoint and can inspect daily analytics, reporting,
   audit, health, access, and settings state;
7. stop preserves data, restart restores the same dataset, and clean removes only demo resources;
8. `pnpm verify:fast`, candidate hygiene, and an independent read-only review pass;
9. the final canonical `main` worktree is clean and `PROJECT_STATE.yaml` records the demo milestone
   as `DONE` with exact evidence.

## Explicit exclusions

No LAN/mobile path, HTTPS gateway, certificate trust, firewall changes, application behavior
changes, schema migration, production credentials, deployment, GitHub synchronization, tag,
release, presentation screenshot, or owner-facing PDF is part of this design.
