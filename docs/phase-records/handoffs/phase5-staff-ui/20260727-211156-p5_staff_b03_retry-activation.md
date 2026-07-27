# phase5-staff-ui retry activation

- Status: `READY`; retry branch/worktree prepared, but backend lifecycle-read work and UI work are
  both unlaunched.
- Current integrated main / retry activation: `a7a7f64c099503fcf9a8dd84091061a4e577a03e` / `SELF`
- Branch / worktree / run ID: `work/phase5-staff-ui-b03-retry` /
  `D:/Projects/fitway-worktrees/phase5-staff-ui-retry` / `p5_staff_b03_retry`
- Registered disposable resources: port `20645`, database
  `fitway_integration_p5_staff_b03_retry`, and
  `D:/Projects/fitway-worktrees/phase5-staff-ui-retry/output/playwright/p5_staff_b03_retry`
- Lease expiry: `2026-07-29T21:11:56+03:00`; see the exact scoped lifecycle-read lease in
  `PROJECT_STATE.yaml`. It is reserved and unused by this activation.

## Binding adjudication

The authorized follow-on is a private `staff.recentCommands` read leaf guarded for `staff | owner`.
It returns server-authoritative command rows with only `pending`, `applied`, or `superseded` as the
lifecycle status; the returned row also exposes `issuedAt`, `deliveredAt`, `appliedAt`,
`supersededAt`, and `supersededByCommandId`. `deliveredAt` is delivery metadata and is not a
fourth status. The UI must render the returned status verbatim and must never derive a lifecycle
state from a staff snapshot, occupancy count, timestamps, a later mutation, request order, or
session-local state.

This decision adds no implementation in this activation and does not change the frozen operational
snapshot DTO, command-domain mutation contracts, migrations, edge/OpenAPI, or public payloads.

## Preserved retry state

Carry forward, in order, the valid staff UI implementation from
`a39475058172f9e1a54e9f6e630d60ae15fc319a` and its authority correction from
`01b014d52b6f3dc135ad80ab012f3dec6625e86a`. Do not rebuild it. The second commit is mandatory:
it removes all inferred lifecycle transitions and retains only server-returned issuance state.
The retry worktree must preserve both commits on top of this activation before any future work.

## Continuation boundary and scoped lease

The scoped coordinator lease is limited to the private lifecycle-read implementation paths named
in the ledger. It permits a later bounded API/router/context/server-repository integration and its
focused integration proof only. It does not authorize edits to database schemas or migrations,
edge protocol/OpenAPI, public payloads, `staff.operationalSnapshot`, shared staff shell/catalogs,
route-tree generation, root config, or the UI paths beyond the already recorded staff UI scope.

Do not start either implementation track in this activation. Before resuming, a coordinator must
confirm the lease is live, implement and prove the private leaf, and retain the frozen-boundary
checks. Only then may the UI bind the read leaf and replace the session-local history with the
returned authoritative rows. A fresh independent verifier remains required.

## Verification registration

Run with the registered resource profile and a clean worktree:

```powershell
Set-Location 'D:/Projects/fitway-worktrees/phase5-staff-ui-retry'
$env:FITWAY_RUN_ID='p5_staff_b03_retry'
$env:TEST_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:55432/fitway_integration_p5_staff_b03_retry'
$env:FITWAY_INTEGRATION_RESET_DATABASE='fitway_integration_p5_staff_b03_retry'
$env:FITWAY_PLAYWRIGHT_PORT='20645'
$env:FITWAY_PLAYWRIGHT_BASE_URL='http://127.0.0.1:20645'
$env:FITWAY_PLAYWRIGHT_OUTPUT_DIR='D:/Projects/fitway-worktrees/phase5-staff-ui-retry/output/playwright/p5_staff_b03_retry'
$env:FITWAY_PLAYWRIGHT_REPORT_DIR='D:/Projects/fitway-worktrees/phase5-staff-ui-retry/output/playwright/p5_staff_b03_retry/report'
$env:FITWAY_PLAYWRIGHT_REVIEW_DIR='D:/Projects/fitway-worktrees/phase5-staff-ui-retry/output/playwright/p5_staff_b03_retry/review'
$env:FITWAY_PLAYWRIGHT_SNAPSHOT_DIR='D:/Projects/fitway/tests/browser/__screenshots__'
$env:VITE_SERVER_URL='/api'
pnpm verify:fast
pnpm verify:phase --phase phase5-staff-ui
```

The future lifecycle-read implementation also requires direct, disposable-Postgres proof of
authentication/role enforcement, strict row shape, all three statuses, timestamp and superseding
reference fidelity, `deliveredAt`-is-not-status behavior, and unchanged snapshot/public/edge
payloads. Then rerun the registered phase profile plus fresh Browser, Playwright, accessibility,
and visual review in Arabic RTL and English LTR at the required widths.

## Stop conditions

Stop as `NEEDS_HUMAN` for a Product/Spec or privacy/security conflict, any frozen-surface change,
unleased path, client lifecycle inference, material visual-direction change, or expired lease.
Do not push, update canonical screenshots, implement the leaf in this activation, resume UI work,
or self-mark the aggregate `DONE`.
