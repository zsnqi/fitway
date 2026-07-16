# FITWAY Delivery Phases

> **Purpose:** durable dependency, scope, merge-gate, and acceptance plan. Live status is
> recorded only in `PROJECT_STATE.yaml`. Product and implementation semantics are defined by
> `FITWAY_PRODUCT.md` and `SPEC.md`; visual acceptance is defined by `DESIGN_GUIDE.md`.
>
> The detailed pre-reconciliation plan is historical evidence at
> `docs/archive/plans/PHASES-pre-brg-20260715.md` and cannot override this file.

## Foundation and baseline milestones

| Milestone | Integrated commit/evidence | Durable result |
| --- | --- | --- |
| Phase 1 | `e43d38a6e547bb5dff15c4248f22f57e115c7a49` | Arabic-first/English public shell, self-hosted Cairo, dark FITWAY foundation, public states |
| Phase 2 | `928f3b3737e474be630a603e97bf54659a8ce8d4` | Simulated edge → authenticated push → transactional engine → Postgres → cached public page |
| Phase 3 | `ab4126dd30598a916ca2aa2e6f8b815a21d86bba` | Gym-local schedule, past-midnight behavior, closed override, next opening |
| Baseline Reconciliation Gate | `PROJECT_STATE.yaml`; `integratedCommit: SELF` only in the passing baseline commit | Approved FITWAY theme promoted; public schema v2 and baseline reconciled; workflow and test resources stabilized |

Phase records under `docs/phase-records/` preserve accepted evidence. Historical checklists
are not live status.

## Invariants for every phase

- Public schema v2 is capacity-free: no capacity, denominator, percentage, `% full`, health,
  device identity, or history. Public crowd level is primary; approximate count is secondary.
- Stale, absent, closed, loading, and error data never look live. State absence removes old
  values from both the visible UI and accessibility tree where `SPEC.md` requires it.
- No video, frame, image, biometric, identity, or per-visitor data is stored or transmitted.
- Visitor reads remain cache-first and never read history; compute scales with refresh windows,
  not visitor count.
- Staff/owner authorization is server-side. Staff uses the frozen PIN/session model, not
  email/password. Missing authentication is `401`; wrong role is `403`.
- Every staff/owner mutation and its audit record share one database transaction.
- UTC storage, configured IANA gym timezone, business-day boundary, schedule, and append-only
  settings history govern all current and historical semantics.
- Arabic RTL is default; English LTR is first-class. Both use Western digits, bidi isolation,
  real Cairo 400–700, color-independent status, and the responsive/accessibility contract.
- A UI-producing phase ends with the focused Browser/Playwright/accessibility/screenshot
  polish loop in `docs/WORKFLOW.md`. Broad product-wide visual exploration is closed.

## Dependency DAG

```text
baseline-reconciliation-gate + phase-2 + phase-3 -> phase4-auth
phase4-auth -> phase4-health
phase4-auth + phase4-health -> phase4-staff-web
phase4-auth + phase4-health + phase4-staff-web -> phase-4
phase-4 -> phase-5 -> phase-6

baseline-reconciliation-gate + phase-3 + phase-5 -> phase7-reset-evaluator
phase7-reset-evaluator + phase-6 -> phase7-integration
phase7-reset-evaluator + phase7-integration -> phase-7

baseline-reconciliation-gate + phase-3 + phase4-health -> phase8-alert-evaluator
phase8-alert-evaluator + phase-7 -> phase8-integration
phase8-alert-evaluator + phase8-integration -> phase-8

baseline-reconciliation-gate + phase-2 + phase-3 -> phase9-analytics-domain
phase9-analytics-domain + phase-4 -> phase9-owner-ui
phase9-analytics-domain + phase9-owner-ui -> phase-9
phase-9 -> phase10-domain -> phase10-ui-csv
phase10-domain + phase10-ui-csv -> phase-10

phase-9 -> phase11-shell
phase-5 + phase-9 -> phase11-audit
phase-4 + phase-5 + phase-9 -> phase11-access
phase-3 + phase-5 + phase-6 + phase-7 + phase-9 -> phase11-settings
phase-8 + phase-9 -> phase11-health
phase11-shell + phase11-audit + phase11-access + phase11-settings + phase11-health
  -> phase-11

phase-6 -> phase-12
```

Slice IDs are worker-branch milestones. Aggregate IDs with slices (`phase-4`, `phase-7`,
`phase-8`, `phase-9`, `phase-10`, and `phase-11`) are coordinator-owned integration and
acceptance milestones, not worker branches. A slice may become `DONE` independently once its
own dependencies and gates close; an aggregate becomes `DONE` only after every listed slice
and integration condition closes.

This permits `phase7-reset-evaluator` after Phase 3/5 while `phase7-integration` still waits for
Phase 6 offline/reconnect closure. It permits `phase8-alert-evaluator` after `phase4-health` and
Phase 3 while `phase8-integration` still waits for Phase 7. It also permits
`phase9-analytics-domain` before Phase 4 closes while `phase9-owner-ui` still waits for owner
authorization through the Phase 4 aggregate.

## Parallel execution batches

No phase worktree starts until BRG is `DONE` in `PROJECT_STATE.yaml`.

| Batch | Concurrent bounded streams | Integration condition |
| --- | --- | --- |
| 1A | `phase4-auth`, `phase9-analytics-domain` | BRG, `phase-2`, and `phase-3` are `DONE`; auth alone leases the next migration/context lane, while analytics stays additive and unexposed |
| 1B | `phase4-health` after `phase4-auth` integrates | Coordinator releases and reallocates the ordered migration plus edge transaction/repository lane; health rebases on auth |
| 1C | `phase4-staff-web` after auth and health integrate | Real principal/session and `staff.operationalSnapshot` contracts exist before UI binds; shared shell/catalog/style leases are then allocated |
| 2 | `phase8-alert-evaluator` when `phase4-health` closes; coordinator aggregates `phase-4`; then `phase-5` and `phase9-owner-ui` start as their dependencies close | Aggregate nodes stay on the integration branch and are never worker worktrees |
| 3 | Coordinator aggregates `phase-9`; then `phase10-domain` and `phase11-shell` start | Migration and router aggregation remain serialized |
| 4 | `phase-6`, `phase7-reset-evaluator`, `phase11-audit`, and `phase11-access` as their exact ledger dependencies close | A coordinated settings/index migration lands first; Phase 11 slices cannot infer missing audit/auth contracts |
| 5 | `phase7-integration` after its evaluator and `phase-6`; `phase10-ui-csv` after `phase10-domain`; `phase-12` after `phase-6`; then coordinator aggregates `phase-7`/`phase-10` and starts `phase11-settings` when eligible | The three worker streams use separate ownership scopes and do not mutate the frozen device contract independently |
| 6 | `phase8-integration` after its evaluator and `phase-7`; then coordinator aggregates `phase-8`, starts `phase11-health`, and aggregates `phase-11` after all five slices | Phase 8 API/log integration is complete before health UI acceptance |

Research may run earlier, but it may not install dependencies, generate migrations, edit
shared files, or bind production code to speculative contracts.

## Shared integration ownership

The coordinator owns these serial surfaces unless `PROJECT_STATE.yaml` records a temporary
lease:

- `packages/db/src/schema/**`, `packages/db/src/migrations/**`, and migration metadata;
- API context/index/router aggregation and `apps/server/src/index.ts`;
- the edge protocol spine: edge-push schemas, occupancy engine, repositories, OpenAPI,
  Python fixtures/simulator/client, and parity tests;
- root/package manifests, lockfile, environment schemas, Vercel and test-runner configs;
- web root/shell, generated route tree, shared message catalogs, global tokens/styles;
- integration database setup, deterministic shared fixtures, browser ports/output, and
  approved visual baselines.

Historical migrations `0000` and `0001` are immutable. One coordinator-controlled stream
generates a reviewed migration, downstream work rebases, and no worker invents a parallel
migration number. Never hand-edit generated route trees or migration snapshots.

## Integration and approval gates

1. Worker branch is based on the recorded baseline and remains inside owned paths.
2. Focused unit/type/lint checks pass in the worker worktree.
3. Relevant contract/integration/simulator/browser checks pass with a unique run ID and
   disposable resources.
4. UI work completes the phase polish loop in both locales and applicable viewports.
5. A fresh verifier reviews the diff and reruns independent checks.
6. Coordinator integrates one shared-spine change at a time, then runs focused checks.
7. Completed batch runs the full non-writing verification ladder.
8. Human approval is required for locked-product/security/privacy changes, a material visual
   direction change, or baseline screenshot updates.
9. Only the coordinator marks the phase `DONE`, with integrated commit and evidence.

## Stop conditions

- `NEEDS_HUMAN`: Product/Spec conflict, privacy/security ambiguity, material visual change,
  unleased shared-file requirement, or missing product decision.
- `BLOCKED`: an external prerequisite such as credentials, service, hardware/site check, or
  upstream phase is unavailable.
- `FAILED_VALIDATION`: the same gate still fails after two focused repair attempts, or an
  independent verifier rejects the result.
- Any public capacity/history/identity leak, false-live presentation, mock content, synthetic
  staff identity, missing audit atomicity, or unreviewed migration is an immediate hard stop.

## Phase 4 — Staff access and live operations

**Depends on:** Phase 2, Phase 3, BRG.

`phase4-auth` depends on Phase 2, Phase 3, and BRG. `phase4-health` follows auth because both
require the single ordered schema/migration lane in this repository. `phase4-staff-web` follows
both backend slices so it cannot bind to the explicitly nonconforming email/password scaffold or
invent the missing `staff.operationalSnapshot`. `phase-4` is the coordinator
integration/acceptance milestone and depends on all three slices.

Deliver the frozen PIN/session/principal model, server-side role guards, persisted current
health projection, `staff.operationalSnapshot`, PIN-first `/login`, `/staff`, and an
owner-only `/admin` shell stub. Replace rather than extend the email/password staff scaffold.

Acceptance includes the exact cookie/session/rotation/deactivation/401/403 rules and health
transaction/evaluator/DTO rules in `SPEC.md`; replay, gap, backfill, validation failure, and
rollback cannot mutate current health. Staff UI proves loading/live/stale/unavailable/error,
keyboard, both directions, responsive density, and private capacity visibility.

## Phase 5 — Commands, corrections, resets, and audit

**Depends on:** Phase 4.

Deliver command queue/lifecycle, delta and absolute correction, destructive reset,
supersession, edge delivery/application acknowledgement, and an audit entry in the same
transaction as every mutation. Cloud state does not silently override an online edge.

Acceptance covers role enforcement, monotonic IDs, replay/idempotency, latest-only delivery,
pending/applied/superseded UI, floor at zero, reason handling, and audit provenance.

## Phase 6 — Offline fallback, backfill, and reconciliation

**Depends on:** Phase 5.

Deliver staff manual fallback with its own validity window, buffered minute backfill,
history-only backfill authority, reconnect ordering, and a frozen device/OpenAPI contract.
Pending commands apply before live authority resumes.

Acceptance covers outage, reconnect, duplicate/gap/replay, manual-value expiry, command
ordering, minute idempotency, current-state protection, and TypeScript/OpenAPI/Python fixture
parity.

## Phase 7 — Scheduled reset

**Depends on:** Phase 3 and Phase 5 for core issuance; Phase 6 for acceptance.

`phase7-reset-evaluator` is the pure evaluator worker milestone and depends on BRG, `phase-3`,
and `phase-5`. `phase7-integration` is the integration worker milestone and depends on that
slice plus `phase-6`. `phase-7` is the coordinator integration/acceptance milestone and depends
on both slices.

Deliver authenticated cron evaluation, close-plus-buffer scheduling, exactly-once system
reset command and audit, past-midnight/business-day correctness, and offline persistence until
the edge applies the reset.

## Phase 8 — Health alerts and logs

**Depends on:** Phase 4 health + Phase 3 for pure policy; Phase 7 for full integration.

`phase8-alert-evaluator` is the pure evaluator worker milestone and depends on BRG, `phase-3`,
and `phase4-health`. `phase8-integration` is the integration worker milestone and depends on
that slice plus `phase-7`. `phase-8` is the coordinator integration/acceptance milestone and
depends on both slices.

Deliver health transitions, alert/recovery logs, Telegram delivery, closed-hour suppression,
pre-open escalation, bounded re-alerting, and retention. Transport failure remains distinct
from unavailable device health. All delivery outcomes are durable.

## Phase 9 — Owner shell and core analytics

**Depends on:** Phase 2 history, Phase 3 time/settings semantics, Phase 4 owner authorization.

`phase9-analytics-domain` is the domain worker milestone and depends on BRG, `phase-2`, and
`phase-3`. `phase9-owner-ui` is the owner shell/chart worker milestone and depends on that slice
plus `phase-4`. `phase-9` is the coordinator integration/acceptance milestone and depends on
both slices.

Deliver owner-only shell, today's occupancy curve, peak, observed-open-minute daily average,
estimated entrance crossings, coverage (`observedOpenMinutes` / `expectedOpenMinutes`), and a
deterministic multi-day history generator. Timeline buckets are `value | closed | missing`;
historical settings are resolved by `effectiveFrom`.

Acceptance includes chart/table parity, RTL/LTR time direction, keyboard/hover/tap parity,
Western-digit gym-local time, honest empty/missing/closed/zero states, and immutable historical
results after later settings changes.

## Phase 10 — Heatmap, comparison, and CSV

**Depends on:** Phase 9.

`phase10-domain` is the domain/reporting worker milestone and depends on `phase-9`.
`phase10-ui-csv` is the UI/export worker milestone and depends on `phase10-domain`.
`phase-10` is the coordinator integration/acceptance milestone and depends on both slices.

Deliver weekday/hour heatmap, week-over-week comparison, date range, and owner-only streamed
CSV with UTC and gym-local time. Closed, missing, and zero remain distinct. CSV is UTF-8,
spreadsheet-safe, uses Western digits, and includes only authorized private analytics fields.

## Phase 11 — Owner governance slices

**Depends on:** each slice's upstreams in the DAG; do not run Phase 11 as one broad branch.

- **`phase11-shell`:** Phase 9 navigation/layout.
- **`phase11-audit`:** Phase 5 + Phase 9, filterable actor/action/from/to/reason history.
- **`phase11-access`:** Phase 4 + Phase 5 audit + Phase 9, PIN provision/rotate/deactivate and real owner
  account management without synthetic staff email.
- **`phase11-settings`:** Phase 3 + Phase 5 audit + Phase 6 + Phase 7 + Phase 9, append-only capacity,
  thresholds, schedule, business-day, reset, and freshness configuration.
- **`phase11-health`:** Phase 8 + Phase 9, incident and uptime summary.

`phase-11` is the coordinator integration/acceptance milestone and depends on all five slices.

Capacity changes may change the public **band** on the next payload but never expose a public
percentage or denominator. Historical analytics remain unchanged because rows carry snapshots.
Every settings/access mutation is validated, atomic, audited, and versioned.

## Phase 12 — Durable Python edge client and Windows lifecycle

**Depends on:** Phase 6 frozen device/OpenAPI contract. Real CV remains site-gated.

Deliver a configurable Python client with synthetic counting source, durable SQLite outbox,
sequence/counter/applied-command persistence, command-before-live reconnect, privacy-safe
logging, auto-start, watchdog restart, and reboot/update/power-loss recovery. No code path
writes frames or images. Contract parity and restart/outage/replay/backfill tests are required.

## External go-live gates

Site checks, production database/Vercel provisioning, spend controls, credentials, actual
capacity/thresholds/hours/timezone, hardware/feed geometry, transparency wording, and owner
sign-off remain external gates in `RESEARCH.md`. They do not permit speculative implementation
or weaken the Definition of Done.
