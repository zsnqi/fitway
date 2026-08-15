# phase11-health b01 worker handoff

- Status: `READY_FOR_INTEGRATION`. Repairs consumed `0/2` (no candidate gate failed; the
  neighbour regressions described below were found and fixed inside the implementation loop,
  before any gate run was declared a candidate).
- Base commit / candidate commit: `78fa4ca` (activation, `SELF`) / `fdedb85`
  (`feat(phase11): add the owner incident and uptime summary`, 19 files, +4089 lines). This
  handoff is a separate commit on top of that candidate.
- Branch / worktree / run ID: `work/phase11-health-b01` /
  `D:/Projects/fitway-worktrees/phase11-health-b01` / `p11_health_b01`.
- Owned paths used: `packages/api/src/health/incidents.ts` + test;
  `apps/server/src/health-incident-repository.ts` + test;
  `apps/server/src/phase11-health.integration.test.ts`;
  `apps/web/src/components/owner/health/**`; `apps/web/src/hooks/use-owner-health.ts`;
  `tests/browser/phase11-health.browser.spec.ts` and its own new screenshot subtree; this
  handoff. Shared leases used, wiring only, all four: `packages/api/src/context.ts`,
  `packages/api/src/routers/index.ts`, `apps/server/src/index.ts`,
  `apps/web/src/routes/admin.tsx`. Nothing else was touched; `packages/db/**` and every frozen
  Phase 8 file were read only.

## What an incident is, and the evidence for it

An incident is one `(deviceId, condition, conditionStartedAt)` group in `alert_log`. It is not a
row, and it is not a notice.

- `packages/api/src/alerts/evaluator.ts:246` sets
  `conditionStartedAt: previous?.conditionStartedAt ?? activeSince`, so one continuous unresolved
  condition carries a single start across every bounded re-alert; line 257 reuses that same start
  on the recovery notice. One condition, many notices.
- `apps/server/src/alert-repository.ts:219-243` writes a `claimed` row inside the advisory-locked
  transaction and a second row after commit with the real delivery outcome. One notice, two rows.

So one two-hour outage that was re-alerted once and then recovered persists **six** rows.
`apps/server/src/phase11-health.integration.test.ts` drives the real frozen writer three times and
asserts exactly that: six rows, one distinct `conditionStartedAt`, outcomes
`claimed/delivered/claimed/failed/claimed/delivered` — and then asserts the read surface reports
**one** incident with **two** notices and a recovery. The fixture is written by
`createAlertRepository(...).evaluateAndNotify`, not by hand, so the reader is proved against the
writer rather than against its author's belief.

Two further semantics fall out of the same reading and are enforced:

- A notice carrying only its `claimed` row never had an outcome recorded. That is `unconfirmed`,
  never `failed`.
- A condition suppressed during closed hours writes **no row at all** (the evaluator returns
  before emitting a notice), so a suppressed condition can never appear as an incident. Nothing in
  the UI implies otherwise; the footnote says so in both locales.

## Metrics and their denominators

One window governs every figure: the last `14` business days ending at the current business day,
resolved through the configured IANA zone and business-day boundary, never the browser zone. The
window is stated in the section header before the first number.

| Figure | Numerator | Denominator |
| --- | --- | --- |
| `uptimeRatio` | open minutes online | open minutes the health log actually covers (`monitoredOpenMinutes`) |
| `monitoredRatio` | open minutes covered by the log | scheduled open minutes in the window (`expectedOpenMinutes`) |
| `alerts.delivered/failed/unconfirmed` | notices with that outcome | all notices sent in the window (`noticeCount`), alerts and recoveries |
| per-incident `delivered/failed/unconfirmed` | that incident's alert notices | that incident's `noticeCount` |
| `offlinePeriods[].openMinutes` | open minutes inside the outage | the outage's `elapsedMinutes` |

The uptime denominator is deliberately *monitored*, not *scheduled*. `edge_health_log` begins at
its first transition; minutes before that are unknown, not online. `monitoredRatio` and
`monitoringStartedAtUtc` expose that shortfall instead of hiding it inside a flattering
percentage, and when nothing is monitored `uptimeRatio` is `null` and the UI renders "Not
measurable" plus a distinct card — unknown and perfect are different facts, and the browser spec
asserts the unmonitored state never renders `100%`.

Three dimensions stay separate and are never flattened into "down": connection (were pushes
arriving), the device-reported failure conditions, and the Telegram delivery outcome. A send that
failed on the wire is labelled "failed to send" and charged to no downtime.

## Changes by file

- `packages/api/src/health/incidents.ts` — new pure domain: the DTO Zod schema, `groupAlertIncidents`,
  `countNoticeOutcomes`, `healthAlertLookbackStart`, and `buildHealthIncidentSummary`.
- `packages/api/src/health/incidents.test.ts` — 18 tests over grouping, the two-row trap, closed
  hours, unmonitored coverage, ongoing outages, historical settings, and list bounds.
- `apps/server/src/health-incident-repository.ts` — new read-only repository; `select`-only
  capability, ordered change-log reads, window-bounded `alert_log` read, settings mapping.
- `apps/server/src/health-incident-repository.test.ts` — settings mapping, including a refused
  half-configured weekday.
- `apps/server/src/phase11-health.integration.test.ts` — new; real transport, real auth, real
  Phase 8 writer, disposable Postgres.
- `packages/api/src/context.ts` — lease: optional `readHealthIncidentSummary` reader. No writer.
- `packages/api/src/routers/index.ts` — lease: `admin.health.summary`, `ownerProcedure`, **no input**.
- `apps/server/src/index.ts` — lease: constructs the repository and injects the reader.
- `apps/web/src/hooks/use-owner-health.ts` — new hook; one query, schema-validated.
- `apps/web/src/components/owner/health/{owner-health-section,owner-health-view}.tsx`,
  `messages.ts`, `use-owner-health-messages.ts`, `owner-health.css`, `owner-health-view.test.tsx` — new section.
- `apps/web/src/routes/admin.tsx` — lease: mounts the section last on `/admin`.
- `tests/browser/phase11-health.browser.spec.ts` + 2 new canonical baselines in its own subtree.

## Two neighbour regressions found by the four-spec gate, and how they were fixed

Both were caused by this slice and both were fixed in this slice's own code. No neighbour test or
component was edited and no assertion was weakened.

1. **Duplicate live regions on a shared route.** The section's loading `role="status"` and error
   `role="alert"` made `getByRole("status")`/`getByRole("alert")` resolve to two elements on
   `/admin`, breaking one `phase11-shell` and two `phase9-owner-ui` tests. That is a real
   accessibility defect, not a fixture problem: a screen-reader user would get two competing
   announcements for one page load (`DESIGN_GUIDE.md` §13). Fixed by having the section stand down
   entirely — `status: "unavailable"`, render `null` — while the page's own owner query is pending
   or failed, which is exactly what the accepted audit section does on this route and for the same
   reason. It adds no request: the analytics query it observes is the one `/admin` already issues.
2. **A moved canonical baseline outside this subtree.** Mounting the section *between* the
   analytics and the audit history shifted `.owner-audit` by a sub-pixel amount and its canonical
   Arabic baseline captured 648px against an expected 649px. Verified as caused by this change by
   removing the mount and re-running the audit canonical test, which passed. Rather than
   regenerate a baseline this slice does not own, the section is mounted **last** on `/admin`, so
   every accepted composition above keeps its exact rendered geometry. Product-wise the two
   periodic history surfaces now sit together beneath the live analytics the owner opens daily.

## Decisions made, with canonical source

- Incident identity from the writer, not from row counts — `evaluator.ts:246,257` and
  `alert-repository.ts:219-243`.
- Business-day and gym-timezone windowing via `businessDayFor` and `resolveScheduleSession`, with
  settings resolved by `effectiveFrom` per instant — `SPEC.md` analytics semantics, mirroring the
  accepted `packages/api/src/analytics/daily-analytics.ts`.
- Coverage reported as an explicit `observed / expected` pair — the accepted Phase 9 idiom
  (`observedOpenMinutes` / `expectedOpenMinutes`), `SPEC.md` analytics semantics.
- Transport distinct from device health — `PHASES.md` Phase 8 lines 230-231.
- Owner-only via `ownerProcedure`; 401/403 enforced server-side — `SPEC.md` interfaces.
- Western digits in both locales via the existing `nu-latn` locale tags; a plain hyphen, not an en
  dash, in the date range so Arabic does not reverse it.
- Row accent mirrored for RTL. `box-shadow` has no logical form, so `[dir="rtl"]` flips the offset
  — `DESIGN_GUIDE.md` §9. The label/value gap is laid out by the parent, because a logical margin
  on a `<bdi>` resolves against the bdi's own direction and collapsed the gap in Arabic.

## No migration and no index

Not needed, and measured rather than assumed. `buildHealthIncidentSummary` runs a fourteen-day
minute scan; per-minute `businessDayFor` was replaced with one coarse-then-exact window-boundary
search plus a per-settings-version open-session index, which took the domain build from ~870 ms to
~10 ms (`incidents.test.ts` wall time 15.9 s → 0.45 s for the same 18 cases). The integration test
asserts a measured end-to-end budget of under 400 ms per call over the real transport, with
`edge_health_log` read whole and `alert_log` bounded to the window lookback. `packages/db/**` is
untouched.

## Validation commands and results

| Command | Result |
| --- | --- |
| `vitest run packages/api/src/health/incidents.test.ts apps/server/src/health-incident-repository.test.ts apps/web/src/components/owner/health/owner-health-view.test.tsx` | 3 files, **35 passed** |
| `vitest run --config vitest.integration.config.ts apps/server/src/phase11-health.integration.test.ts` | 1 file, **9 passed** |
| `playwright test` on all four `/admin` specs (health, audit, phase9-owner-ui, shell) | **25 passed** |
| `biome check` on the 17 slice files | **no diagnostics** |
| `pnpm -r check-types` | **7 packages Done**, 0 errors |
| `pnpm verify:fast` (with `FITWAY_PHASE` unset) | **390 passed** / 56 files, 117 Python tests OK, mutation guard clean |
| `FITWAY_PHASE=phase11-health pnpm verify:phase` | **25 browser passed**, integration passed, mutation guard clean |
| `git diff --check` | exit 0 |
| `git status --short --branch` | 4 leased files modified, 9 new owned paths, nothing else |

## Browser / a11y / visual artifacts

Review captures in `output/playwright/p11_health_b01/review/` (12 PNGs). Canonical baselines: **2
new files**, both in this slice's own new subtree
`tests/browser/__screenshots__/win32/chromium/phase11-health.browser.spec.ts/`. No baseline
outside it was created or modified.

Polish loop exercised: both locales (`ar` RTL default, `en` LTR); all nine required widths 320,
360, 390, 721, 768, 820, 1024, 1200, 1440; states loading, error, populated, "clear" (monitored,
nothing broke) and "unmonitored" (no denominator at all); keyboard order and focus across both
labeled scroll regions; 44×44 target minimum; forced colors with a ≥2px outline retained and the
decorative row accents removed; reduced motion with an asserted zero running animations; polite
live region on loading and a single `role="alert"` on error; 200% zoom reflow; no document,
body, or section horizontal scrolling at any width; Axe with zero serious or critical violations
in both locales. Rendered output was inspected directly at 1440 desktop and 390 mobile in both
locales, which is how the RTL gap and accent-mirroring defects were found.

## Privacy

Proved, not asserted. Both source tables are keyed by device; `deviceId` is used only as part of
the internal grouping key and never leaves the domain. The DTO schema is `.strict()` at every
level, so an added field would fail parsing rather than leak. The integration test asserts the
exact key set of the payload and of every offline period and incident, and that the response text
contains neither the real device UUID nor `deviceId`/`device_id`/`tokenHash`, nor
`frame|image|snapshot|visitor`, nor the owner email, any `@`, `sessionId`/`credential`/`pinHash`,
nor `currentCount`/`occupancy`. The domain test and the Arabic view test assert the same absence
at their own layers.

## Remaining work or exact blocker

None. Ready for an independent verifier.

## Exact resume command

```powershell
Set-Location D:\Projects\fitway-worktrees\phase11-health-b01
Get-Content apps/server/.env | Where-Object { $_ -match '^(CRON_SECRET|TELEGRAM_BOT_TOKEN|TELEGRAM_CHAT_ID)=' } |
  ForEach-Object { $p = $_ -split '=',2; Set-Item -Path "env:$($p[0])" -Value $p[1] }
$env:FITWAY_RUN_ID='p11_health_v01'
$env:TEST_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:55432/fitway_integration_p11_health_v01'
$env:FITWAY_INTEGRATION_RESET_DATABASE='fitway_integration_p11_health_v01'
$env:FITWAY_PHASE='phase11-health'
pnpm verify:phase
```

Use PowerShell; Git Bash mangles `/api`-style paths on this machine and breaks Playwright.

## Stop / escalation conditions

- Any change to the incident definition — it is derived from the frozen writer, so a disagreement
  is a finding about this reading, not licence to edit `packages/api/src/alerts/**` or
  `apps/server/src/alert-repository.ts`.
- Any need for a migration or an index on `alert_log` or `edge_health_log`.
- Any canonical baseline diff outside
  `tests/browser/__screenshots__/**/phase11-health.browser.spec.ts/`.
- Any pressure to fold transport delivery failure into downtime, or to present a suppressed
  closed-hours condition as an incident.
