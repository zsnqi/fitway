# Phase 11 owner health and uptime — b01 coordinator activation

- Status: `PLANNED -> IN_PROGRESS`. Repair budget `0/2`. No prior attempt exists.
- Branch / worktree / run ID: `work/phase11-health-b01` /
  `D:/Projects/fitway-worktrees/phase11-health-b01` / `p11_health_b01`.
- Dependencies: `phase-8` and `phase-9`, both `DONE`.
- Base: `SELF` — this activation commit.

## Why this slice can run now

It is the one remaining Phase 11 slice that does **not** depend on the coordinator audit
generalization. `phase11-access` and `phase11-settings` both need governance actions the current
`audit_log` cannot represent; health is a **read-only** surface over two existing append-only tables
and introduces no audit action, no mutation, and no schema change.

## Observable slice

An owner-only incident and uptime summary in the owner area, per `SPEC.md` story 27 — "a
health/uptime summary (offline periods, last incidents), so that I can see what I am paying
maintenance for" — and `PHASES.md` Phase 11 `phase11-health`.

## Ground truth established by coordinator reconnaissance

Verified against `main`, so the worker does not have to rediscover it, and so any contradiction it
finds is a reportable finding rather than a surprise:

- **No read path exists.** `edge_health_log` and `alert_log` appear nowhere in `apps/web/src` and
  have no query path outside their own write flow. `apps/server/src/retention-repository.ts` only
  deletes by cutoff. This slice is greenfield reads.
- **One writer, one transaction.** `apps/server/src/alert-repository.ts:113-248`
  (`evaluateAndNotify`) is the sole writer of both tables. Health transitions and the first alert row
  are inserted inside one advisory-locked transaction; `packages/api/src/alerts/evaluator.ts:205`
  (`evaluateAlerts`) is the pure decision function.
- **`alert_log` carries two rows per notice.** A `claimed` row inside the transaction, then a second
  row after commit with the real delivery outcome (`delivered` or `failed`). **The summary must treat
  `alert_log` as an append-only sequence, not a mutable status table.** Counting rows as incidents
  would double-count every notice. This is the single most likely way to get this slice wrong.
- Recovery rows link back through `recovery_of_alert_id`, constrained by
  `alert_log_recovery_linkage` in `packages/db/src/schema/application.ts:530-533`.
- `edge_health_log` transition types are `online`, `offline`, `reported_flags_changed`, with the
  process/camera/feed status columns nullable together.

## Locked semantics

- **Read-only.** No mutation of either table, no new audit action, no migration, no index. If the
  worker believes an index is required it must stop and report measured evidence, not add one.
- Transport failure stays distinct from unavailable device health — that distinction is accepted
  Phase 8 authority and must survive into the summary rather than being flattened into "down".
- Uptime and incident windows are business-day and gym-timezone aware, resolved through the
  configured IANA zone, never the browser or device zone. Western digits in both locales.
- Closed-hours suppression is existing alert policy; a suppressed condition is not an incident the
  owner was exposed to, and the summary must not imply otherwise.
- Owner-only: missing or expired authentication is 401, staff is 403, enforced server-side.
- No device identity, no per-visitor data, no image or frame reference anywhere in the DTO or UI.

## Scope

Owned:

- `packages/api/src/health/incidents.ts` and its test (or an equivalently named module under
  `packages/api/src/health/` that does not collide with the accepted `evaluator.ts` or `snapshot.ts`)
- `apps/server/src/health-incident-repository.ts` and its test
- `apps/server/src/phase11-health.integration.test.ts`
- `apps/web/src/components/owner/health/**`, including component-owned bilingual messages and hook
- `apps/web/src/hooks/use-owner-health.ts` and its test
- `tests/browser/phase11-health.browser.spec.ts` and its own new screenshot subtree
- new `docs/phase-records/handoffs/phase11-health/*-p11_health_b01-worker-*.md`

Temporary coordinator lease, wiring only, four files: `packages/api/src/context.ts`,
`packages/api/src/routers/index.ts`, `apps/server/src/index.ts`, `apps/web/src/routes/admin.tsx`.

Forbidden: `packages/db/**` entirely; `packages/api/src/alerts/**` and
`apps/server/src/alert-repository.ts`, which are frozen accepted Phase 8 authority;
`packages/api/src/health/evaluator.ts` and `snapshot.ts`; `apps/server/src/retention-repository.ts`;
every Phase 9, audit, and shell component and test; `apps/web/src/i18n/**` and shared catalogs;
`routeTree.gen.ts`; other screenshot subtrees; `PROJECT_STATE.yaml`; `scripts/verify.mjs`; root
manifests, lockfiles, configuration; `visual-direction-gate/**` and Paper; every normative document.

Canonical baselines outside this slice's own new subtree are read-only. A canonical diff elsewhere is
a stop condition, never a regeneration.

## Verification profile

`scripts/verify.mjs` gains `phase11-health` at this activation commit, gating on
`phase11-health`, `phase11-audit`, `phase9-owner-ui`, and `phase11-shell` browser specs plus the new
integration test. **All four browser specs from the start** — the `phase11-audit` slice proved that
a profile listing only its own spec structurally blinds both the worker and the independent verifier
to a regression on the shared `/admin` route.

## Resources

- worker `p11_health_b01` / `fitway_integration_p11_health_b01`
- verifier `p11_health_v01` / `fitway_integration_p11_health_v01`
- coordinator `p11_health_c01` / `fitway_integration_p11_health_c01`

Playwright derives its port and output directory from the run ID; no port is reserved by hand.

## Exit

The worker completes the phase UI polish loop in both locales across the required widths, runs the
profile gate and `verify:fast`, commits a candidate, and stops at `READY_FOR_INTEGRATION`. A fresh
verifier that did not implement it reviews before any merge. Two focused repairs maximum.

Escalate rather than improvise on any Product/Spec conflict, privacy ambiguity, a needed migration or
index, or a canonical diff outside the owned subtree.
