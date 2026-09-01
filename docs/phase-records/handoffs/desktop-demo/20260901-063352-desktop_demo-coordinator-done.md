# FITWAY desktop demo coordinator closeout

- Status: `DONE`.
- Base commit: `5ebb22998a9e65b8f9fa751d66edc55e13f4bf4e`.
- Accepted candidate: `024d98cf19fbffdaea2050b55f6fcb50b1eda7b4`.
- Closure/integration commit: `SELF` (the commit containing this record and the matching ledger
  transition).
- Canonical branch: `main`, reached by fast-forward only; no push performed.
- Run ID: `desktop_demo_c03`.
- Repair budget: `2/2` used. Candidate 1 was rejected for hourly nondeterminism and overly broad
  credential inheritance. Candidate 2 was rejected because Playwright's HTML reporter persisted
  the Staff PIN in action titles. Candidate 3 passed independent review with no blocking or
  non-blocking findings.

## Delivered desktop-only environment

- Fixed loopback Compose Postgres using the real reviewed schema and migrations.
- Deterministic, same-Riyadh-business-day synthetic profile with 28 days of history, current live
  state, health and incident history, access principals, audit events, settings, real edge device
  credentials, and the existing simulator.
- Guarded `prepare`, `reset`, `start`, `status`, `verify`, `owner`, `stop`, and `clean` commands.
- Real Public, Staff, and Owner surfaces with production authentication, secure cookies, role
  boundaries, APIs, and authorization semantics unchanged.
- Loopback-only server/web/database binding. No LAN, TLS, certificate, firewall, deployment,
  GitHub, release/tag, screenshot, presentation, or PDF work.
- Raw interactive credentials are never persisted or inherited by helper/application/browser
  processes. Live browser verification disables traces and persistent reporters.

## Accepted verification

- Two same-business-day resets produced identical non-secret fingerprint
  `61c8858efa9f961e4dcb67981c7e47f2419b7009013aa31e6fb7ca5f0987951c`.
- Full guarded lifecycle passed: clean, prepare with migrations, reset, start, ownership/readiness
  status, stop with profile preservation, restart, and exact cleanup.
- Unmocked Chromium `3/3 PASS`: populated anonymous Public; protected Staff redirect and real PIN
  sign-in; Staff-to-Owner server 403; real Owner password sign-in; daily analytics, 28-day History,
  audit, uptime/incidents, access, and settings.
- Credential-persistence proof passed. After live verification no Playwright artifact existed and
  a complete runtime scan found neither synthetic credential value.
- `pnpm verify:fast`: repository invariants PASS; Biome `501` files PASS; workspace types/build
  PASS; Vitest `73` files / `572` tests PASS; simulator `117` tests PASS; mutation guard PASS.
- Candidate freeze check PASS at `024d98cf19fbffdaea2050b55f6fcb50b1eda7b4`.
- Fresh independent terminal review: PASS with no correctness or security findings.
- Final cleanup: `.local/demo`, exact Compose container/network/volume, and listeners on 3100,
  3101, and 55432 absent.

`accessibility` and `visual` are `NOT_REQUIRED` for this milestone because it adds no product UI or
changes to accepted surfaces. The live browser proof exercises those existing production surfaces
without mocks; their historical accepted gates remain immutable.

## Operator handoff

The exact desktop workflow is documented in `docs/desktop-demo.md`. The minimum sequence is:

```powershell
pnpm demo:prepare
pnpm demo:reset
pnpm demo:start
```

Public opens at `http://localhost:3101`; Staff signs in at `http://localhost:3101/login`; Owner is
opened from a second terminal with `pnpm demo:owner`. A second terminal stops the preserved demo
with `pnpm demo:stop`, and `pnpm demo:clean` removes only the disposable profile when desired.

No repository implementation, verification, integration, ledger, or desktop-demo closure work
remains. LAN/mobile support and every other explicit exclusion remain future, separately
authorized work.
