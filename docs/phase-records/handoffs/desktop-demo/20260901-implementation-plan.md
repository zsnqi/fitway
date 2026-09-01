# Desktop demo implementation plan

## Objective

Deliver the approved desktop-only synthetic demo as one reversible repository slice. A user can
reset, start, verify, stop, and clean a real local FITWAY stack without touching any existing
remote database, production credential, locked product behavior, or historical phase.

## Scope

In scope: `compose.demo.yaml`, root demo scripts, `scripts/demo/**`, one live browser spec,
`docs/desktop-demo.md`, the desktop-demo handoff/risk records, root package script aliases, and the
coordinator ledger.

Out of scope: schema/migration changes, application UI/API/auth changes, `apps/server/.env`, LAN or
TLS work, canonical screenshots, deployment/release/GitHub work, presentation assets, and every
historical phase record.

## Stage 1 — guarded runtime and deterministic profile

Files:

- `compose.demo.yaml`
- `scripts/demo.ps1`
- `scripts/demo/contract.ts`
- `scripts/demo/contract.test.ts`
- `scripts/demo/server.ts`
- `scripts/demo/seed.ts`
- `scripts/demo/seed.test.ts`
- `scripts/demo/cli.ts`
- `package.json`
- `docs/desktop-demo.md`

Outcome:

- loopback-only named Postgres lifecycle;
- fail-closed URL/project/path/PID guards;
- secure interactive credential input and ignored local secrets;
- reviewed migrations plus real edge provisioning;
- real AuthService credentials, deterministic analytics history, and coherent health/access/audit
  state;
- foreground start supervisor with bounded readiness, status, stop, and clean.

Verification:

```powershell
pnpm exec vitest run scripts/demo/contract.test.ts scripts/demo/seed.test.ts
pnpm check-types
pnpm check:repository
git diff --check
```

Rollback boundary: revert the Stage 1 commit. It adds isolated demo tooling only; no production
module consumes it.

## Stage 2 — live product-path proof

Files:

- `tests/browser/desktop-demo.browser.spec.ts`
- focused corrections inside Stage 1 files only if the live proof exposes a defect

Outcome:

- one real, unmocked Chromium walkthrough covers Public, Staff, Owner, 401, and 403 behavior;
- operator `verify` drives the spec against the already-running loopback services;
- two resets on the same gym business day return the same non-secret profile fingerprint;
- stop/restart preserves the profile and clean removes only demo-owned resources.

Verification:

```powershell
pnpm demo:reset
pnpm demo:start
pnpm demo:verify
pnpm demo:status
pnpm demo:stop
pnpm demo:start
pnpm demo:verify
pnpm demo:stop
pnpm demo:clean
```

The credential-bearing commands prompt interactively; credentials never appear in the command
line or committed evidence. Docker resources are always the fixed `fitway-desktop-demo` project.

Rollback boundary: revert the Stage 2 commit; the Stage 1 operator remains usable without the live
browser proof.

## Stage 3 — freeze, independent review, and integration

Files:

- `docs/phase-records/handoffs/desktop-demo/**`
- `PROJECT_STATE.yaml`

Outcome:

- full candidate evidence is durable and consistent with the candidate commit;
- `pnpm verify:fast`, focused auth/analytics/simulator checks, demo lifecycle proof, and candidate
  hygiene pass;
- a fresh read-only reviewer checks the full diff, destructive guards, credential handling,
  process ownership, contract reuse, and verification evidence;
- coordinator fast-forwards canonical `main`, records `desktop-demo: DONE`, and leaves the worktree
  clean.

Verification:

```powershell
pnpm verify:fast
pnpm test:simulator
pnpm exec vitest run packages/auth/src/auth-service.test.ts packages/api/src/analytics/history-generator.test.ts packages/api/src/public/payload-builder.test.ts
node C:\Users\Pc Force\.codex\skills\agent-project-workflow\scripts\candidate-freeze-check.mjs --base 5ebb22998a9e65b8f9fa751d66edc55e13f4bf4e --also "pnpm check:repository"
git status --short --branch
```

Rollback boundary: revert the final integration commits on `main`; Compose cleanup remains
available through `pnpm demo:clean` before or after a repository rollback.

## Risks and unknowns

- Docker Desktop is installed but its engine was inaccessible during discovery. This is an
  operational prerequisite, not permission to alter machine configuration.
- The worktree dependency links are incomplete and must be repaired only with
  `pnpm install --frozen-lockfile`.
- Chromium's localhost secure-cookie behavior must be proven in the live walkthrough.
- Docker image availability may require the user's existing Docker network access; no alternative
  remote database will be used if the image cannot be obtained.
- Physical-phone/LAN behavior is explicitly untested and out of scope.

## Adopted plan

The user approved the design and confirmed the written design record. This plan is adopted for
execution under the active `desktop-demo` milestone. Any need to touch a forbidden path or weaken a
guard is a stop condition, not permission to widen the slice.
