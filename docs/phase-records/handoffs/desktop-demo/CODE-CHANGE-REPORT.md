# Code Change Guardian

## FITWAY guarded desktop demo environment

> **PROCEED WITH CONDITIONS** · IMPACT mode · analysis complete; implementation not started

The demo is additive and isolated from production modules, but destructive Compose cleanup, credential handling, process ownership, secure localhost cookies, and time-relative seed data need explicit guards and live proof.

## Decision snapshot

| Field | Value |
|---|---|
| Requested change | Implement the approved desktop-only synthetic demo environment for Public, Staff, and Owner using the real Postgres schema, authentication, services, APIs, and edge simulator. |
| Repository | `C:/Users/Pc Force/.codex/worktrees/f2a7/phase5-staff-integration` |
| Branch / HEAD | `codex/desktop-demo` / `45e9f38` |
| Working tree | Dirty — preserve existing changes |
| Generated | 2026-09-01T05:25:00.000Z |

### In scope

- Loopback-only Compose Postgres lifecycle
- Synthetic seed and real auth/service reuse
- Desktop application supervision and cleanup
- Live Public, Staff, and Owner verification

### Out of scope

- Production application behavior or schema changes
- Existing apps/server/.env or remote databases
- LAN, TLS, certificates, or firewall changes
- Deployment, release, GitHub, screenshots, or PDF work

## Blast-radius map

| Surface | Relationship | Risk | Evidence | Files |
|---|---|---:|---|---|
| Local database lifecycle | operational | High | Reset and clean remove a Compose volume; existing integration guards demonstrate the repository's fail-closed destructive-data policy. | [compose.demo.yaml](compose.demo.yaml), [scripts/demo/cli.ts](scripts/demo/cli.ts), [apps/server/src/test-support/integration-database-safety.ts](apps/server/src/test-support/integration-database-safety.ts) |
| Authentication and credentials | contractual | High | AuthService hashes credentials and session cookies remain Secure/HttpOnly/SameSite=Lax; demo input must stay off disk and command lines. | [scripts/demo.ps1](scripts/demo.ps1), [scripts/demo/seed.ts](scripts/demo/seed.ts), [packages/auth/src/auth-service.ts](packages/auth/src/auth-service.ts), [packages/auth/src/cookies.ts](packages/auth/src/cookies.ts) |
| Synthetic analytics and health state | direct | Medium | The existing deterministic history generator and integration fixtures establish the accepted data semantics. | [scripts/demo/seed.ts](scripts/demo/seed.ts), [packages/api/src/analytics/history-generator.ts](packages/api/src/analytics/history-generator.ts), [apps/server/src/phase11-health.integration.test.ts](apps/server/src/phase11-health.integration.test.ts) |
| Application process lifecycle | operational | High | The new supervisor will own server, Vite, and simulator child processes and must not terminate unrelated reused PIDs. | [scripts/demo/cli.ts](scripts/demo/cli.ts), [scripts/demo/server.ts](scripts/demo/server.ts) |
| Real browser flows | test-only | Medium | Existing browser tests mock most requests; a new live spec is needed to prove the split-local origin and secure-cookie path. | [tests/browser/desktop-demo.browser.spec.ts](tests/browser/desktop-demo.browser.spec.ts), [playwright.config.ts](playwright.config.ts) |

## Failure modes

| ID | What could break | Score | Tier | Primary mitigation |
|---|---|---:|---:|---|
| R1 | Reset or clean targets a non-demo database or unrelated Docker resource. | 12/20 | High | Hard-code and independently validate the exact project, loopback URL, database name, and resolved local runtime path before every destructive call; test all refusal cases. |
| R2 | A raw Staff PIN or Owner password is committed, logged, stored, or exposed in a process command line. | 12/20 | High | PowerShell secure prompts, environment-only child input, immediate environment clearing, no credential fields in profile/log output, and diff/log scans. |
| R3 | A stale PID file causes stop to terminate an unrelated local process. | 12/20 | High | Record role markers and verify each live process command line before termination; refuse mismatches and remove only stale records for missing PIDs. |
| R4 | Secure session cookies do not persist across the localhost web/server split, blocking Staff or Owner login. | 11/20 | Medium | Use localhost consistently, credentials-included requests, and a real Chromium login/session walkthrough; do not weaken cookie flags. |
| R5 | Time-relative seed data is empty, stale, closed, or changes across same-day resets. | 11/20 | Medium | Anchor the profile to the current Asia/Riyadh business day, use a 24-hour synthetic schedule, fixed offsets and seed, and compare non-secret fingerprints across two resets. |
| R6 | Docker or the Postgres image is unavailable on the local machine. | 8/20 | Medium | Prepare/reset fail before writes with one actionable Docker Desktop prerequisite; never fall back to the existing remote env file. |

### R1: Reset or clean targets a non-demo database or unrelated Docker resource.

- **Evidence:** The operation is destructive, while the approved design fixes project, database, port, and path values.
- **Rollback:** No destructive call runs when a guard fails; successful cleanup affects only the disposable demo volume.

### R2: A raw Staff PIN or Owner password is committed, logged, stored, or exposed in a process command line.

- **Evidence:** Credential material crosses the operator-to-seed boundary once during reset.
- **Rollback:** Destroy the disposable database and local runtime directory; no real credential is in scope.

### R3: A stale PID file causes stop to terminate an unrelated local process.

- **Evidence:** Windows can reuse PIDs after an unclean supervisor exit.
- **Rollback:** Stop refuses ownership ambiguity; the user can close the foreground supervisor normally.

### R4: Secure session cookies do not persist across the localhost web/server split, blocking Staff or Owner login.

- **Evidence:** Cookies are always Secure and the desktop demo uses HTTP localhost with exact-origin CORS.
- **Rollback:** Remove the demo harness; production cookie behavior is untouched.

### R5: Time-relative seed data is empty, stale, closed, or changes across same-day resets.

- **Evidence:** Owner queries and freshness evaluate against wall clock while analytics rows use gym-local business days.
- **Rollback:** Reset recreates the complete disposable profile.

### R6: Docker or the Postgres image is unavailable on the local machine.

- **Evidence:** Docker CLI exists, but the engine was inaccessible during discovery and no local Postgres service is installed.
- **Rollback:** No repository or database mutation occurs when the prerequisite fails.

## Contracts to preserve

| Contract | Required behavior | Evidence | Protection |
|---|---|---|---|
| Database destruction boundary | Only the named loopback demo Compose database and volume may be recreated or removed. | AGENTS.md and docs/WORKFLOW.md require exact disposable targets. | Contract unit tests plus two reset/clean lifecycle runs. |
| Authentication and authorization | Real hashed credentials, Secure HttpOnly cookies, server-side Staff/Owner guards, 401/403 semantics, and monitoring-only Staff. | FITWAY_PRODUCT.md, SPEC.md, AuthService, and authorization procedures. | Focused auth tests and live browser/API denial checks. |
| Public privacy/data semantics | Anonymous public output remains capacity-free and never exposes device, health, identity, or history. | FITWAY_PRODUCT.md and public payload builder. | Existing payload tests plus live Public response assertions. |
| Historical analytics semantics | UTC minutes, gym-local business day, settings snapshots, true zero, missing coverage, and deterministic generation. | History generator and Phase 9 integration tests. | Seed unit tests, fingerprint comparison, and Owner live assertions. |

## Safe change plan

| Step | Change | Files | Validation | Rollback boundary |
|---:|---|---|---|---|
| 1 | Add guarded Compose/operator/profile tooling and focused unit tests. | [compose.demo.yaml](compose.demo.yaml), [scripts/demo.ps1](scripts/demo.ps1), [scripts/demo/**](scripts/demo/**), [package.json](package.json), [docs/desktop-demo.md](docs/desktop-demo.md) | Focused Vitest, type checks, repository invariants, and diff hygiene. | Revert the isolated Stage 1 commit. |
| 2 | Add and run the unmocked desktop browser walkthrough and lifecycle proof. | [tests/browser/desktop-demo.browser.spec.ts](tests/browser/desktop-demo.browser.spec.ts) | Two resets, live Playwright, stop/restart, status, and scoped clean. | Revert the Stage 2 commit. |
| 3 | Freeze, independently review, integrate, and mark the milestone DONE. | [docs/phase-records/handoffs/desktop-demo/**](docs/phase-records/handoffs/desktop-demo/**), [PROJECT_STATE.yaml](PROJECT_STATE.yaml) | verify:fast, focused suites, candidate freeze, independent review, and clean canonical status. | Revert final integration commits and run demo clean. |

## Proof ledger

| Phase | Command | Result | Evidence |
|---|---|---|---|
| baseline | `git status --short --branch` | clean on codex/desktop-demo immediately after design commit | Coordinator observation at 45e9f38. |
| baseline | `node scripts/verify-repository.mjs` | Repository invariants passed: 62 milestones, 8 canonical approval screenshots. | Coordinator baseline run after milestone activation. |
| baseline | `pnpm exec vitest --version` | failed: Vitest executable links are incomplete | Requires the repository-prescribed frozen install before implementation verification. |

## Unknowns and blind spots

- Docker Desktop engine availability and image pull capability are not yet proven.
- Physical mobile/LAN behavior is intentionally excluded and will not be inferred from desktop results.
- The real Chromium localhost Secure-cookie path has not yet been exercised.

## Rollback strategy

- Each writing stage is one commit and independently revertible.
- The demo clean command removes only validated project resources and ignored local runtime state.
- No migration or production module change is planned.

## Next safest action

**Repair package links from the frozen lockfile, then execute Stage 1 exactly as recorded in the adopted plan.**

---

_Generated by Code Change Guardian. “Safe” means supported by the recorded evidence, not risk-free._
