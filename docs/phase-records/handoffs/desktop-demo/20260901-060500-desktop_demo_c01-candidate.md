# Desktop demo candidate

- Status: `CANDIDATE` — implementation and author verification complete; independent review
  pending.
- Base commit: `5ebb22998a9e65b8f9fa751d66edc55e13f4bf4e`.
- Branch / worktree / run ID: `codex/desktop-demo` /
  `C:/Users/Pc Force/.codex/worktrees/f2a7/phase5-staff-integration` /
  `desktop_demo_c01`.
- Scope: desktop-only synthetic demo runtime, data profile, operator commands, live browser proof,
  and documentation. No production application, schema, migration, product behavior, LAN/TLS,
  deployment, release, GitHub, screenshot, or presentation path changed.

## Implemented contract

- `compose.demo.yaml` owns exactly one loopback Postgres database and the named
  `fitway-desktop-demo_fitway_desktop_demo_data` volume.
- `scripts/demo.ps1` and `scripts/demo/**` provide guarded `prepare`, `reset`, `start`, `status`,
  `verify`, `owner`, `stop`, and `clean` actions.
- Reset runs reviewed migrations, uses the real AuthService and repositories, generates 28 days
  of deterministic Riyadh history through the existing generator, provisions the real edge
  protocol, and creates coherent owner, staff, analytics, health, access, audit, and settings
  state.
- Raw Staff/Owner credentials are accepted only through secure prompts and immediate child
  environment variables. Generated service secrets and runtime evidence remain under ignored
  `.local/demo` state.
- Server/web/database bind only to loopback. Browser origins use `localhost` so existing Secure,
  HttpOnly, SameSite cookie semantics remain unchanged.
- Owner launch uses a fresh headed Chromium context and the real owner-password endpoint because
  repository truth intentionally provides no owner sign-in UI. It adds no application route.

## Author evidence

- Two guarded resets in the same Riyadh business day produced the identical non-secret profile
  fingerprint `ac695ac5e6049992255eca07c719dc6a7e2599bfd5e8ced240d3a6a9e86eefd3`.
- Unmocked live Chromium: `3/3 PASS` after restart. Covered populated Public, real Staff PIN,
  anonymous 401 redirect, server-side Staff-to-Owner 403, real Owner password, daily analytics,
  audit, uptime/incidents, access, settings, and 28-day History.
- Lifecycle: prepare PASS; reset PASS twice; start PASS; verify PASS; stop PASS with profile
  preserved; restart + verify PASS; clean PASS. After clean, the named container/network/volume,
  `.local/demo`, and listeners on 3100/3101/55432 were absent.
- `pnpm install --frozen-lockfile`: PASS.
- `pnpm verify:fast` with the documented complete process-local synthetic server environment:
  repository invariants PASS; Biome `501` files PASS; all workspace type/build checks PASS;
  Vitest `73` files / `570` tests PASS; Python simulator gate PASS; mutation guard PASS.
- Focused demo/auth/history/public tests: `5` files / `16` tests PASS.
- Direct simulator suite: `117` tests PASS.
- `git diff --check` and repository invariants: PASS.

The first bare `pnpm verify:fast` attempt omitted the documented process-local `CRON_SECRET` and
Telegram variables. It reached `552` passing tests and failed only the three environment-gated
server cases. The complete synthetic environment rerun passed and no value was written to a
tracked file.

## Review request

Review the immutable candidate against the base commit. Check destructive target guards,
credential and secret handling, process ownership/stop races, Docker scope, loopback binding,
real architecture reuse, seed coherence, deterministic fingerprinting, unmocked authorization
proof, cleanup behavior, root dependency declarations, and exact operator documentation. Do not
edit or repair the candidate.
