# Batch 02 Phase 8 alert-evaluator retry activation

- Coordinator status: `READY` for one bounded retry; no worker has been launched.
- Rejected candidate: `7517a28e2f72e040b9e84b2287f7a86d6c330448`
- Terminal rejection record: `6396d5b70ca533c890624c716be2733a06dfa2a0`,
  `docs/phase-records/handoffs/phase8-alert-evaluator/20260721-184700-p8_alert_b02-failed-validation.md`
- Preserved rejected branch/worktree: `work/phase8-alert-evaluator-b02` /
  `D:/Projects/fitway-worktrees/phase8-alert-evaluator` (clean, unchanged).
- Retry branch/worktree: `work/phase8-alert-evaluator-b02-retry` /
  `D:/Projects/fitway-worktrees/phase8-alert-evaluator-retry`, based on the terminal rejection
  record.
- Retry run ID / lease expiry: `p8_alert_b02_retry` / `2026-07-23T19:30:00+03:00`.

## Terminal disposition preserved

The fresh verifier rejected candidate `7517a28` despite a passing focused command. Under
`docs/WORKFLOW.md`, that independent-verifier result is terminal `FAILED_VALIDATION` for the
candidate, not `READY_FOR_INTEGRATION`. The terminal evidence is retained verbatim at the
handoff path above and the rejected branch has not been reset, rebased, amended, or merged.

The failure is limited to three contract defects:

1. prior alert records were scoped by condition but not device, permitting cross-device
   suppression and recovery contamination;
2. delivery was read/send/append rather than atomically claimed and persisted, so concurrent
   identical evaluations could duplicate notification delivery;
3. a continuing failure used the latest projection receipt as `conditionStartedAt` instead of
   the first qualifying transition.

## Retry revalidation

- Dependencies `baseline-reconciliation-gate`, `phase-3`, and `phase4-health` are `DONE` in
  `PROJECT_STATE.yaml`; their integrated history has not changed.
- The rejected candidate owns the sole unintegrated `0004` migration lane. The retry inherits
  that exclusive lease to amend its existing `0004` schema/migration/snapshot/journal entry;
  it must not create `0005` or a competing migration. Migrations `0000` through `0003` remain
  immutable.
- The preserved candidate and new retry worktrees are clean. The retry branch is a new child
  of the terminal rejection record, preserving valid implementation and all rejection history.
- Docker container `fitway-phase2-postgres` is running at `127.0.0.1:55432`. The prior
  `fitway_integration_p8_alert_b02` database is consumed and is forbidden for retry use. Fresh
  `fitway_integration_p8_alert_b02_retry` was provisioned and has zero `public` tables.
- Port `19518` has no listener. The retry output root
  `D:/Projects/fitway-worktrees/phase8-alert-evaluator-retry/output/playwright/p8_alert_b02_retry`
  is absent. The Phase 8 focused profile remains registered in `scripts/verify.mjs` with the
  single disposable-Postgres integration file and no browser files.

## Activation boundaries

The retry inherits the original Phase 8 contract as amended by
`20260721-184500-p8_alert_b02.md` and the binding retry handoff below. It may change only the
already-owned evaluator, repository, focused integration test, Phase 8 handoffs, and the
exclusive `application.ts` / existing generated `0004` lease for the stated corrections.
All router, context, OpenAPI, environment, existing server modules, UI, browser tests, root
manifests/lockfiles/configuration, and unrelated documentation remain forbidden. The worker
must use only the explicitly named retry database and reset marker; no fallback database,
other worker server, or canonical screenshot resource is permitted.

Only coordinator records and the binding retry handoff are committed for this activation. No
implementation repair, worker launch, `DONE` transition, integration, or push is authorized.
